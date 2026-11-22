interface Env {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_TOKEN_ENCRYPTION_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}
const SUPABASE_URL = "https://jqggrvirneqygwzbrebl.supabase.co";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
async function verifyAdmin(request: Request, anonKey: string): Promise<string | null> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !anonKey) return null;
  const headers = { apikey: anonKey, Authorization: `Bearer ${token}` };
  const auth = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers });
  if (!auth.ok) return null;
  const user = await auth.json() as { id?: string };
  if (!user.id) return null;
  const url = new URL(`${SUPABASE_URL}/rest/v1/profiles`);
  url.searchParams.set("select", "is_admin");
  url.searchParams.set("id", `eq.${user.id}`);
  const profile = await fetch(url, { headers });
  if (!profile.ok) return null;
  const rows = await profile.json() as Array<{ is_admin?: boolean }>;
  return rows[0]?.is_admin === true ? user.id : null;
}
function fromB64(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
function encryptionKeyBytes(secret: string): Uint8Array {
  const value = secret.trim();
  return /^[0-9a-f]{64}$/i.test(value)
    ? Uint8Array.from(value.match(/.{2}/g)!, h => parseInt(h, 16))
    : fromB64(value);
}
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const anonKey = request.headers.get("X-Supabase-Anon-Key") || env.VITE_SUPABASE_ANON_KEY || "";
    const userId = await verifyAdmin(request, anonKey);
    if (!userId) return json({ error: "Admin access required." }, 403);
    const configured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_TOKEN_ENCRYPTION_KEY && env.SUPABASE_SERVICE_ROLE_KEY);
    if (!configured) return json({ connected: false, configured: false, reconnectRequired: false });
    const url = new URL(`${SUPABASE_URL}/rest/v1/outreach_gmail_connections`);
    url.searchParams.set("select", "email,encrypted_refresh_token,encryption_iv,connected_at");
    url.searchParams.set("admin_user_id", `eq.${userId}`);
    const response = await fetch(url, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } });
    if (!response.ok) return json({ connected: false, configured: true, error: "Could not read Gmail connection." }, 500);
    const rows = await response.json() as Array<{ email: string; encrypted_refresh_token: string; encryption_iv: string; connected_at: string }>;
    const row = rows[0];
    if (!row || row.email.toLowerCase() !== "hello.nirauloom@gmail.com") return json({ connected: false, configured: true, reconnectRequired: true });
    try {
      const rawKey = encryptionKeyBytes(env.GOOGLE_TOKEN_ENCRYPTION_KEY!);
      if (rawKey.length !== 32) throw new Error("invalid_key");
      const key = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
      const refreshToken = new TextDecoder().decode(await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: fromB64(row.encryption_iv) }, key, fromB64(row.encrypted_refresh_token)
      ));
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID!, client_secret: env.GOOGLE_CLIENT_SECRET!, refresh_token: refreshToken, grant_type: "refresh_token" })
      });
      const tokenData = await tokenResponse.json() as { access_token?: string; error?: string };
      if (!tokenResponse.ok || !tokenData.access_token) {
        const reason = tokenData.error === "invalid_grant" ? "Gmail authorization has expired or been revoked." : tokenData.error === "invalid_client" ? "Google OAuth client configuration is invalid." : "Gmail authorization could not be verified.";
        return json({ connected: false, configured: true, reconnectRequired: tokenData.error !== "invalid_client", error: reason });
      }
      return json({ connected: true, configured: true, email: row.email, connectedAt: row.connected_at, verified: true });
    } catch (error) {
      console.error("gmail_status_verification_failed", error instanceof Error ? error.message : "unknown");
      return json({ connected: false, configured: true, reconnectRequired: true, error: "Saved Gmail authorization could not be verified. Reconnect Gmail." });
    }
  } catch {
    return json({ error: "Could not check Gmail connection." }, 500);
  }
};
