interface Env {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_TOKEN_ENCRYPTION_KEY?: string;
}

type EventName = "welcome" | "submitted" | "approved" | "rejected";
const SENDER = "hello.nirauloom@gmail.com";
const APP = "https://nirauloom.pages.dev";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function fromB64(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}
function toB64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function toB64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function encryptionKeyBytes(secret: string): Uint8Array {
  const value = secret.trim();
  return /^[0-9a-f]{64}$/i.test(value)
    ? Uint8Array.from(value.match(/.{2}/g)!, (hex) => parseInt(hex, 16))
    : fromB64(value);
}

async function getUser(request: Request, env: Env): Promise<{ id: string; email?: string } | null> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) return null;
  const response = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return await response.json() as { id: string; email?: string };
}

async function rest(env: Env, path: string, init: RequestInit = {}): Promise<Response> {
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !env.VITE_SUPABASE_URL) {
    throw new Error("Supabase server configuration is incomplete.");
  }
  return fetch(`${env.VITE_SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

async function sendEmail(env: Env, recipient: string, subject: string, message: string): Promise<string> {
  if (
    !env.GOOGLE_CLIENT_ID ||
    !env.GOOGLE_CLIENT_SECRET ||
    !env.GOOGLE_TOKEN_ENCRYPTION_KEY ||
    !env.SUPABASE_SERVICE_ROLE_KEY ||
    !env.VITE_SUPABASE_URL
  ) throw new Error("Gmail sender is not fully configured.");

  const query = new URLSearchParams({
    select: "email,encrypted_refresh_token,encryption_iv",
    email: `eq.${SENDER}`,
  });
  const connectionResponse = await rest(env, `/rest/v1/outreach_gmail_connections?${query}`);
  if (!connectionResponse.ok) throw new Error("Could not load the connected Gmail sender.");
  const connections = await connectionResponse.json() as Array<{
    email: string;
    encrypted_refresh_token: string;
    encryption_iv: string;
  }>;
  const connection = connections[0];
  if (!connection || connection.email.toLowerCase() !== SENDER) {
    throw new Error("Nirauloom Gmail is not connected.");
  }

  const rawKey = encryptionKeyBytes(env.GOOGLE_TOKEN_ENCRYPTION_KEY);
  if (rawKey.length !== 32) throw new Error("Invalid Gmail encryption configuration.");
  const aesKey = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
  const refreshToken = new TextDecoder().decode(await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(connection.encryption_iv) },
    aesKey,
    fromB64(connection.encrypted_refresh_token),
  ));

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
    throw new Error("Gmail authorization failed. Reconnect the sender.");
  }

  const subjectBase64 = toB64(new TextEncoder().encode(subject));
  const bodyBase64 = toB64(new TextEncoder().encode(message)).replace(/.{1,76}/g, "$&\r\n").trim();
  const mime = [
    `From: Nirauloom <${SENDER}>`,
    `To: ${recipient}`,
    `Subject: =?UTF-8?B?${subjectBase64}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    bodyBase64,
  ].join("\r\n");

  const gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: toB64Url(new TextEncoder().encode(mime)) }),
  });
  const gmailData = await gmailResponse.json() as {
    id?: string;
    error?: { message?: string; status?: string; errors?: Array<{ reason?: string; message?: string }> };
  };
  if (!gmailResponse.ok || !gmailData.id) {
    // Keep Google's actionable error details in the delivery log; never log tokens or message contents.
    const reason = gmailData.error?.errors?.map((item) => item.reason || item.message).filter(Boolean).join(", ");
    const detail = [gmailData.error?.status, reason, gmailData.error?.message].filter(Boolean).join(": ");
    throw new Error(`Gmail API rejected the message (HTTP ${gmailResponse.status})${detail ? `: ${detail}` : "."}`);
  }
  return gmailData.id;
}

async function reserveDelivery(
  env: Env,
  dedupeKey: string,
  event: EventName,
  recipientUserId: string,
  recipientEmail: string,
): Promise<"reserved" | "duplicate"> {
  const insert = await rest(env, "/rest/v1/notification_deliveries", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      dedupe_key: dedupeKey,
      event_type: event,
      user_id: recipientUserId,
      recipient_email: recipientEmail,
      status: "sending",
    }),
  });
  if (insert.ok) return "reserved";
  if (insert.status !== 409) {
    const detail = (await insert.text()).slice(0, 300);
    if (!detail.includes("23505") && !detail.toLowerCase().includes("duplicate")) {
      throw new Error("Could not reserve notification delivery.");
    }
  }

  // A previous failed attempt is eligible for retry. Sent or in-progress rows stay deduplicated.
  const retry = await rest(
    env,
    `/rest/v1/notification_deliveries?dedupe_key=eq.${encodeURIComponent(dedupeKey)}&status=eq.failed`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ status: "sending", error_message: null, provider_message_id: null, sent_at: null }),
    },
  );
  if (!retry.ok) throw new Error("Could not retry failed notification.");
  const rows = await retry.json() as Array<{ id: string }>;
  return rows.length ? "reserved" : "duplicate";
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  let dedupeKey = "";
  try {
    const user = await getUser(request, env);
    if (!user?.id) return json({ error: "Sign in required." }, 401);

    const input = await request.json() as { event?: EventName; creationId?: string };
    const event = input.event;
    if (!event || !["welcome", "submitted", "approved", "rejected"].includes(event)) {
      return json({ error: "Unsupported notification." }, 400);
    }

    let recipientEmail = user.email || "";
    let recipientUserId = user.id;
    let displayName = "Creator";
    let projectName = "";

    const profileQuery = new URLSearchParams({ select: "display_name", id: `eq.${user.id}` });
    const profileResponse = await rest(env, `/rest/v1/profiles?${profileQuery}`);
    if (profileResponse.ok) {
      const profiles = await profileResponse.json() as Array<{ display_name?: string }>;
      displayName = profiles[0]?.display_name || displayName;
    }

    if (event !== "welcome") {
      if (!input.creationId) return json({ error: "Project reference required." }, 400);
      const projectQuery = new URLSearchParams({
        select: "id,name,creator_id,status",
        id: `eq.${input.creationId}`,
      });
      const projectResponse = await rest(env, `/rest/v1/creations?${projectQuery}`);
      if (!projectResponse.ok) return json({ error: "Could not verify project." }, 500);
      const projects = await projectResponse.json() as Array<{
        id: string; name: string; creator_id: string; status: string;
      }>;
      const project = projects[0];
      if (!project) return json({ error: "Project not found." }, 404);

      if (event === "submitted" && project.creator_id !== user.id) {
        return json({ error: "Not your project." }, 403);
      }
      if (event === "approved" || event === "rejected") {
        const adminQuery = new URLSearchParams({ select: "is_admin", id: `eq.${user.id}` });
        const adminResponse = await rest(env, `/rest/v1/profiles?${adminQuery}`);
        const admins = adminResponse.ok
          ? await adminResponse.json() as Array<{ is_admin: boolean }>
          : [];
        if (!admins[0]?.is_admin) return json({ error: "Admin access required." }, 403);
      }

      projectName = project.name;
      // Delivery ownership and deduplication must belong to the creator, not the reviewing admin.
      recipientUserId = project.creator_id;
      if (event !== "submitted") {
        const creatorResponse = await rest(env, `/auth/v1/admin/users/${encodeURIComponent(project.creator_id)}`);
        if (!creatorResponse.ok) return json({ error: "Could not find project creator." }, 500);
        const creator = await creatorResponse.json() as {
          email?: string; user_metadata?: { full_name?: string; name?: string };
        };
        recipientEmail = creator.email || "";
        displayName = creator.user_metadata?.full_name || creator.user_metadata?.name || "Creator";
      }

      if (event === "submitted" && project.status !== "pending" && project.status !== "approved") {
        return json({ skipped: true });
      }
      if (event === "approved" && project.status !== "approved") return json({ skipped: true });
      if (event === "rejected" && project.status !== "rejected") return json({ skipped: true });
    }

    if (!recipientEmail || !/^\S+@\S+\.\S+$/.test(recipientEmail)) {
      return json({ error: "Recipient email unavailable." }, 400);
    }

    dedupeKey = event === "welcome" ? `welcome:${recipientUserId}` : `${event}:${input.creationId}`;
    const reservation = await reserveDelivery(env, dedupeKey, event, recipientUserId, recipientEmail);
    if (reservation === "duplicate") return json({ success: true, duplicate: true });

    const messages: Record<EventName, { subject: string; body: string }> = {
      welcome: {
        subject: "Welcome to Nirauloom",
        body: `Hi ${displayName},\n\nWelcome to Nirauloom — a place to discover, share, and celebrate independent creations.\n\nWhen you're ready, publish a project and let the community discover what you're building.\n\nExplore Nirauloom: ${APP}\n\nDiscover. Build. Connect.\nNirauloom Team`,
      },
      submitted: {
        subject: "We received your project",
        body: `Hi ${displayName},\n\nThank you for submitting “${projectName}” to Nirauloom. Your project is now in the review queue. We'll email you when its review is complete.\n\nView Nirauloom: ${APP}\n\nDiscover. Build. Connect.\nNirauloom Team`,
      },
      approved: {
        subject: "Your project is live on Nirauloom",
        body: `Hi ${displayName},\n\nGood news — “${projectName}” has been approved and is now published on Nirauloom. Share your work and let more people discover it.\n\nVisit: ${APP}\n\nDiscover. Build. Connect.\nNirauloom Team`,
      },
      rejected: {
        subject: "An update about your Nirauloom project",
        body: `Hi ${displayName},\n\nThank you for submitting “${projectName}”. After review, it was not approved at this time. Please review the platform guidelines and any feedback in your project dashboard before resubmitting.\n\nVisit: ${APP}\n\nDiscover. Build. Connect.\nNirauloom Team`,
      },
    };

    try {
      const sentId = await sendEmail(env, recipientEmail, messages[event].subject, messages[event].body);
      const update = await rest(
        env,
        `/rest/v1/notification_deliveries?dedupe_key=eq.${encodeURIComponent(dedupeKey)}`,
        { method: "PATCH", body: JSON.stringify({ status: "sent", provider_message_id: sentId, sent_at: new Date().toISOString(), error_message: null }) },
      );
      if (!update.ok) console.error("notification_delivery_log_update_failed", update.status);
      return json({ success: true });
    } catch (error) {
      await rest(
        env,
        `/rest/v1/notification_deliveries?dedupe_key=eq.${encodeURIComponent(dedupeKey)}`,
        { method: "PATCH", body: JSON.stringify({ status: "failed", error_message: error instanceof Error ? error.message : "Send failed" }) },
      );
      throw error;
    }
  } catch (error) {
    console.error("transactional_notification_failed", error instanceof Error ? error.message : "unknown");
    return json({ error: error instanceof Error ? error.message : "Notification could not be sent." }, 502);
  }
};
