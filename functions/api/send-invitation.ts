interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

async function getAdminId(request: Request, env: Env): Promise<string | null> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const authResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!authResponse.ok) return null;
  const user = await authResponse.json() as { id?: string };
  if (!user.id) return null;

  const profileUrl = new URL(`${env.SUPABASE_URL}/rest/v1/profiles`);
  profileUrl.searchParams.set("select", "is_admin");
  profileUrl.searchParams.set("id", `eq.${user.id}`);
  const profileResponse = await fetch(profileUrl.toString(), {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!profileResponse.ok) return null;
  const profiles = await profileResponse.json() as Array<{ is_admin?: boolean }>;
  return profiles[0]?.is_admin === true ? user.id : null;
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return json({ error: "Email sending is not configured yet. Add the Resend API key and verified sender address to Cloudflare Pages secrets." }, 503);
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Server authentication is not configured." }, 503);
  }

  try {
    const adminId = await getAdminId(request, env);
    if (!adminId) return json({ error: "Admin access required. Please sign in again." }, 403);

    const body = await request.json() as Record<string, unknown>;
    const opportunityId = clean(body.opportunityId, 120);
    const recipientEmail = clean(body.recipientEmail, 254).toLowerCase();
    const subject = clean(body.subject, 160);
    const message = clean(body.message, 4000);
    const sourceUrl = clean(body.sourceUrl, 1000);
    const sourceTitle = clean(body.sourceTitle, 240);
    const publicContactConfirmed = body.publicContactConfirmed === true;

    if (!opportunityId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return json({ error: "Enter a valid creator contact email." }, 400);
    }
    if (!subject || !message || message.length < 20 || !sourceTitle || !publicContactConfirmed) {
      return json({ error: "Review the message and confirm that the recipient email is publicly listed for project contact." }, 400);
    }
    if (!sourceUrl.startsWith("https://")) return json({ error: "A valid HTTPS source link is required." }, 400);
    if (/\r|\n/.test(subject)) return json({ error: "Invalid email subject." }, 400);

    const restHeaders = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    };
    const logResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/growth_scout_outreach?on_conflict=admin_user_id,opportunity_id`,
      {
        method: "POST",
        headers: { ...restHeaders, Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify({
          admin_user_id: adminId,
          opportunity_id: opportunityId,
          recipient_email: recipientEmail,
          subject,
          message,
          source_url: sourceUrl,
          source_title: sourceTitle,
          status: "pending",
        }),
      },
    );
    if (!logResponse.ok) {
      return json({ error: "Could not create the send record. Check the database migration before trying again." }, 500);
    }
    const inserted = await logResponse.json() as Array<{ id: string }>;
    if (!inserted.length) {
      return json({ error: "An invitation attempt for this creator is already recorded. Duplicate sends are blocked." }, 409);
    }

    let providerId = "";
    try {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `nirauloom-${adminId}-${opportunityId}`,
        },
        body: JSON.stringify({
          from: env.RESEND_FROM_EMAIL,
          to: [recipientEmail],
          subject,
          text: message,
        }),
      });
      const emailData = await emailResponse.json() as { id?: string; message?: string; name?: string };
      if (!emailResponse.ok || !emailData.id) {
        throw new Error(emailData.message || emailData.name || "Email provider rejected the message.");
      }
      providerId = emailData.id;
    } catch (error) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/growth_scout_outreach?id=eq.${inserted[0].id}`, {
        method: "PATCH",
        headers: { ...restHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ status: "failed", error_message: error instanceof Error ? error.message.slice(0, 300) : "Email provider error" }),
      });
      return json({ error: error instanceof Error ? error.message : "Email delivery failed." }, 502);
    }

    await fetch(`${env.SUPABASE_URL}/rest/v1/growth_scout_outreach?id=eq.${inserted[0].id}`, {
      method: "PATCH",
      headers: { ...restHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({ status: "sent", provider_message_id: providerId, sent_at: new Date().toISOString() }),
    });

    return json({ success: true, message: "Invitation accepted by the email provider.", providerId });
  } catch {
    return json({ error: "The invitation could not be sent. Please try again later." }, 500);
  }
};
