interface Env {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_TOKEN_ENCRYPTION_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}
const SUPABASE_URL = "https://jqggrvirneqygwzbrebl.supabase.co";
const APP_URL = "https://nirauloom.pages.dev";
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
function toB64(bytes: Uint8Array): string {
  let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromB64(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
async function hmacKey(secret: string) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
async function sealState(payload: string, secret: string) {
  const encoded = toB64(new TextEncoder().encode(payload));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), new TextEncoder().encode(encoded));
  return `${encoded}.${toB64(new Uint8Array(sig))}`;
}
async function openState(value: string, secret: string): Promise<string | null> {
  const [encoded, signature, extra] = value.split(".");
  if (!encoded || !signature || extra) return null;
  const valid = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromB64(signature), new TextEncoder().encode(encoded));
  if (!valid) return null;
  try { return new TextDecoder().decode(fromB64(encoded)); } catch { return null; }
}
async function encryptToken(token: string, secret: string) {
  const raw = /^[0-9a-f]{64}$/i.test(secret) ? Uint8Array.from(secret.match(/.{2}/g)!, h => parseInt(h, 16)) : fromB64(secret);
  if (raw.length !== 32) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex characters or base64url).");
  const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(token));
  return { ciphertext: toB64(new Uint8Array(ciphertext)), iv: toB64(iv) };
}
async function saveConnection(env: Env, userId: string, email: string, encrypted: { ciphertext: string; iv: string }) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/outreach_gmail_connections?on_conflict=admin_user_id`, {
    method: "POST",
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ admin_user_id: userId, email, encrypted_refresh_token: encrypted.ciphertext, encryption_iv: encrypted.iv, connected_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error("Could not securely save the Gmail connection.");
}

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const url = new URL(request.url);
  const clearCookie = "nirauloom_gmail_state=; HttpOnly; Secure; SameSite=Lax; Path=/api/gmail; Max-Age=0";
  const finish = (status: string) => Response.redirect(`${APP_URL}/outreach-agent?gmail=${status}`, 302);
  try {
    if (url.searchParams.has("error")) return finish("cancelled");
    const code = url.searchParams.get("code") || "";
    const state = url.searchParams.get("state") || "";
    const cookie = request.headers.get("Cookie")?.split(";").map(v => v.trim()).find(v => v.startsWith("nirauloom_gmail_state="))?.slice("nirauloom_gmail_state=".length) || "";
    if (!code || !state || !cookie || !env.GOOGLE_TOKEN_ENCRYPTION_KEY || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.SUPABASE_SERVICE_ROLE_KEY) return finish("error");
    const decoded = await openState(cookie, env.GOOGLE_TOKEN_ENCRYPTION_KEY);
    if (!decoded) return finish("invalid_state");
    const payload = JSON.parse(decoded) as { state: string; userId: string; exp: number };
    if (payload.state !== state || payload.exp < Date.now() || !payload.userId) return finish("invalid_state");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: `${APP_URL}/api/gmail/callback`, grant_type: "authorization_code" }),
    });
    const tokens = await tokenResponse.json() as { access_token?: string; refresh_token?: string; error?: string };
    if (!tokenResponse.ok || !tokens.access_token || !tokens.refresh_token) return finish("token_error");
    const profileResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!profileResponse.ok) return finish("profile_error");
    const profile = await profileResponse.json() as { emailAddress?: string };
    const email = (profile.emailAddress || "").toLowerCase();
    if (email !== "hello.nirauloom@gmail.com") return finish("wrong_account");
    const encrypted = await encryptToken(tokens.refresh_token, env.GOOGLE_TOKEN_ENCRYPTION_KEY);
    await saveConnection(env, payload.userId, email, encrypted);
    return new Response(null, { status: 302, headers: { Location: `${APP_URL}/outreach-agent?gmail=connected`, "Set-Cookie": clearCookie, "Cache-Control": "no-store" } });
  } catch {
    return new Response(null, { status: 302, headers: { Location: `${APP_URL}/outreach-agent?gmail=error`, "Set-Cookie": clearCookie, "Cache-Control": "no-store" } });
  }
};
