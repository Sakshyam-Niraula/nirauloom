interface Env {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_TOKEN_ENCRYPTION_KEY?: string;
}

const DEFAULT_SENDER = "hello.nirauloom@gmail.com";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

function fromB64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}
function toB64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function encryptionBytes(secret: string): Uint8Array {
  const value = secret.trim();
  if (/^[0-9a-f]{64}$/i.test(value)) {
    return Uint8Array.from(value.match(/.{2}/g)!, (hex) => parseInt(hex, 16));
  }
  return fromB64Url(value);
}
async function decryptRefreshToken(ciphertext: string, ivValue: string, secret: string): Promise<string> {
  const rawKey = encryptionBytes(secret);
  if (rawKey.length !== 32) throw new Error("Invalid encryption key configuration.");
  const key = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
  const clear = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64Url(ivValue) },
    key,
    fromB64Url(ciphertext),
  );
  return new TextDecoder().decode(clear);
}

async function getAdminId(request: Request, env: Env): Promise<string | null> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const authResponse = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!authResponse.ok) return null;
  const user = await authResponse.json() as { id?: string };
  if (!user.id) return null;

  const profileUrl = new URL(`${env.VITE_SUPABASE_URL}/rest/v1/profiles`);
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

async function sendWithConnectedGmail(env: Env, adminId: string, recipient: string, subject: string, message: string) {
  const base = env.VITE_SUPABASE_URL!;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY!;
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const connectionUrl = new URL(`${base}/rest/v1/outreach_gmail_connections`);
  connectionUrl.searchParams.set("select", "email,encrypted_refresh_token,encryption_iv");
  connectionUrl.searchParams.set("admin_user_id", `eq.${adminId}`);
  const connectionResponse = await fetch(connectionUrl, { headers });
  if (!connectionResponse.ok) throw new Error("Could not verify the connected Gmail sender.");
  const connections = await connectionResponse.json() as Array<{
    email: string; encrypted_refresh_token: string; encryption_iv: string;
  }>;
  const connection = connections[0];
  if (!connection || connection.email.toLowerCase() !== DEFAULT_SENDER) {
    throw new Error("Connect the approved Nirauloom Gmail sender before sending.");
  }
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_TOKEN_ENCRYPTION_KEY) {
    throw new Error("Gmail sending is not fully configured on the server.");
  }

  const refreshToken = await decryptRefreshToken(
    connection.encrypted_refresh_token,
    connection.encryption_iv,
    env.GOOGLE_TOKEN_ENCRYPTION_KEY,
  );
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const tokenData = await tokenResponse.json() as { access_token?: string; error?: string };
  if (!tokenResponse.ok || !tokenData.access_token) {
    console.error("gmail_send_token_refresh_failed", tokenResponse.status, tokenData.error || "missing access token");
    throw new Error("Gmail could not authorize this send. Reconnect the sender and try again.");
  }

  const subjectEncoded = btoa(String.fromCharCode(...new TextEncoder().encode(subject)));
  const bodyBase64 = btoa(String.fromCharCode(...new TextEncoder().encode(message)))
    .replace(/.{1,76}/g, "$&\r\n").trim();
  const mime = [
    `From: Nirauloom <${DEFAULT_SENDER}>`,
    `To: ${recipient}`,
    `Subject: =?UTF-8?B?${subjectEncoded}?=`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    bodyBase64,
  ].join("\r\n");
  const gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: toB64Url(new TextEncoder().encode(mime)) }),
  });
  const gmailData = await gmailResponse.json() as { id?: string; error?: { message?: string } };
  if (!gmailResponse.ok || !gmailData.id) {
    console.error("gmail_send_failed", gmailResponse.status, gmailData.error?.message || "missing message id");
    throw new Error("Gmail did not accept the invitation. No successful send was recorded.");
  }
  return gmailData.id;
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
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
    const contactSourceUrl = clean(body.contactSourceUrl, 1000);

    if (!opportunityId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return json({ error: "Enter a valid creator contact email." }, 400);
    }
    if (!subject || !message || message.length < 20 || !sourceTitle || !publicContactConfirmed || !contactSourceUrl) {
      return json({ error: "Review the message and confirm that the recipient email is publicly listed for project contact." }, 400);
    }
    if (/\r|\n/.test(subject)) return json({ error: "Invalid email subject." }, 400);
    try {
      const parsed = new URL(sourceUrl);
      if (parsed.protocol !== "https:") throw new Error("https required");
    } catch {
      return json({ error: "A valid HTTPS source link is required." }, 400);
    }
    try {
      const contactPage = new URL(contactSourceUrl);
      if (contactPage.protocol !== "https:") throw new Error("https required");
    } catch {
      return json({ error: "Provide the HTTPS page where this project-contact address is publicly listed." }, 400);
    }

    if (recipientEmail === DEFAULT_SENDER) {
      return json({ error: "Use a separate test workflow for the sender's own address." }, 400);
    }

    const restHeaders = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    };

    // Respect this admin's suppression list before any send.
    const suppressionUrl = new URL(`${env.VITE_SUPABASE_URL}/rest/v1/outreach_suppressions`);
    suppressionUrl.searchParams.set("select", "id");
    suppressionUrl.searchParams.set("admin_user_id", `eq.${adminId}`);
    suppressionUrl.searchParams.set("email", `eq.${recipientEmail}`);
    const suppressionResponse = await fetch(suppressionUrl, { headers: restHeaders });
    if (!suppressionResponse.ok) return json({ error: "Could not verify the opt-out list. No email was sent." }, 500);
    const suppressions = await suppressionResponse.json() as Array<{ id: string }>;
    if (suppressions.length) return json({ error: "This address is on your opt-out list. No email was sent." }, 409);

    // Enforce the saved daily ceiling on the server, not only in the interface.
    const settingsUrl = new URL(`${env.VITE_SUPABASE_URL}/rest/v1/outreach_agent_settings`);
    settingsUrl.searchParams.set("select", "daily_limit");
    settingsUrl.searchParams.set("admin_user_id", `eq.${adminId}`);
    const settingsResponse = await fetch(settingsUrl, { headers: restHeaders });
    if (!settingsResponse.ok) return json({ error: "Could not verify the daily outreach limit." }, 500);
    const settingsRows = await settingsResponse.json() as Array<{ daily_limit?: number }>;
    const dailyLimit = Math.max(1, Math.min(5, Number(settingsRows[0]?.daily_limit ?? 5)));
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const countUrl = new URL(`${env.VITE_SUPABASE_URL}/rest/v1/growth_scout_outreach`);
    countUrl.searchParams.set("select", "id");
    countUrl.searchParams.set("admin_user_id", `eq.${adminId}`);
    countUrl.searchParams.set("status", "eq.sent");
    countUrl.searchParams.set("sent_at", `gte.${dayStart.toISOString()}`);
    const countResponse = await fetch(countUrl, { headers: { ...restHeaders, Prefer: "count=exact" } });
    if (!countResponse.ok) return json({ error: "Could not verify today's outreach count." }, 500);
    const countRange = countResponse.headers.get("Content-Range") || "";
    const sentToday = Number(countRange.split("/")[1] || 0);
    if (sentToday >= dailyLimit) {
      return json({ error: `Daily sending limit reached (${dailyLimit}). No email was sent.` }, 429);
    }

    const logResponse = await fetch(
      `${env.VITE_SUPABASE_URL}/rest/v1/growth_scout_outreach?on_conflict=admin_user_id,opportunity_id`,
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
      providerId = await sendWithConnectedGmail(env, adminId, recipientEmail, subject, message);
    } catch (error) {
      await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/growth_scout_outreach?id=eq.${inserted[0].id}`, {
        method: "PATCH",
        headers: { ...restHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({
          status: "failed",
          error_message: error instanceof Error ? error.message.slice(0, 300) : "Gmail send error",
        }),
      });
      return json({ error: error instanceof Error ? error.message : "Gmail delivery failed." }, 502);
    }

    await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/growth_scout_outreach?id=eq.${inserted[0].id}`, {
      method: "PATCH",
      headers: { ...restHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({ status: "sent", provider_message_id: providerId, sent_at: new Date().toISOString() }),
    });

    return json({ success: true, message: "Invitation accepted by the connected Gmail account.", providerId });
  } catch (error) {
    console.error("gmail_invitation_handler_failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "The invitation could not be sent. Please try again later." }, 500);
  }
};
