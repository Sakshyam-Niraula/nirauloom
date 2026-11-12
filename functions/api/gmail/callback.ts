interface Env {
  GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_TOKEN_ENCRYPTION_KEY?: string; SUPABASE_SERVICE_ROLE_KEY?: string;
}
const APP_URL = "https://nirauloom.pages.dev";
function toB64(bytes: Uint8Array): string { let b = ""; for (const x of bytes) b += String.fromCharCode(x); return btoa(b).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,""); }
function fromB64(v: string): Uint8Array { const p=v.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-v.length%4)%4); return Uint8Array.from(atob(p),c=>c.charCodeAt(0)); }
async function openState(value:string,secret:string):Promise<string|null>{
 const [encoded,sig,extra]=value.split("."); if(!encoded||!sig||extra)return null;
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
 if(!await crypto.subtle.verify("HMAC",key,fromB64(sig),new TextEncoder().encode(encoded)))return null;
 try{return new TextDecoder().decode(fromB64(encoded));}catch{return null;}
}
async function encryptToken(token:string,secret:string){
 const raw=/^[0-9a-f]{64}$/i.test(secret)?Uint8Array.from(secret.match(/.{2}/g)!,h=>parseInt(h,16)):fromB64(secret);
 if(raw.length!==32)throw new Error("Encryption key must decode to exactly 32 bytes.");
 const key=await crypto.subtle.importKey("raw",raw,"AES-GCM",false,["encrypt"]),iv=crypto.getRandomValues(new Uint8Array(12));
 const ciphertext=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(token));
 return {ciphertext:toB64(new Uint8Array(ciphertext)),iv:toB64(iv)};
}
async function saveConnection(env:Env,userId:string,email:string,encrypted:{ciphertext:string;iv:string}){
 const response=await fetch("https://jqggrvirneqygwzbrebl.supabase.co/rest/v1/outreach_gmail_connections?on_conflict=admin_user_id",{
  method:"POST",headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY!,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"},
  body:JSON.stringify({admin_user_id:userId,email,encrypted_refresh_token:encrypted.ciphertext,encryption_iv:encrypted.iv,connected_at:new Date().toISOString(),updated_at:new Date().toISOString()})
 });
 if(!response.ok){const detail=(await response.text()).slice(0,500);console.error("gmail_callback_save_failed",response.status,detail);throw new Error("save_error");}
}
export const onRequestGet=async({request,env}:{request:Request;env:Env})=>{
 const clearCookie="nirauloom_gmail_state=; HttpOnly; Secure; SameSite=Lax; Path=/api/gmail; Max-Age=0";
 const finish=(s:string)=>new Response(null,{status:302,headers:{Location:`${APP_URL}/outreach-agent?gmail=${s}`,"Set-Cookie":clearCookie,"Cache-Control":"no-store"}});
 let stage="callback_start";
 try{
  const url=new URL(request.url);if(url.searchParams.has("error"))return finish("cancelled");
  const code=url.searchParams.get("code")||"",state=url.searchParams.get("state")||"";
  const cookie=request.headers.get("Cookie")?.split(";").map(v=>v.trim()).find(v=>v.startsWith("nirauloom_gmail_state="))?.slice("nirauloom_gmail_state=".length)||"";
  if(!code||!state||!cookie)return finish("missing_callback_data");
  if(!env.GOOGLE_TOKEN_ENCRYPTION_KEY||!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET||!env.SUPABASE_SERVICE_ROLE_KEY)return finish("missing_config");
  stage="state_validation";const decoded=await openState(cookie,env.GOOGLE_TOKEN_ENCRYPTION_KEY);if(!decoded)return finish("invalid_state");
  const payload=JSON.parse(decoded) as {state:string;userId:string;exp:number};
  if(payload.state!==state||payload.exp<Date.now()||!payload.userId)return finish("invalid_state");
  stage="google_token_exchange";
  const tokenResponse=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:`${APP_URL}/api/gmail/callback`,grant_type:"authorization_code"})});
  const tokens=await tokenResponse.json() as {access_token?:string;refresh_token?:string;error?:string};
  if(!tokenResponse.ok||!tokens.access_token||!tokens.refresh_token){console.error("gmail_callback_token_failed",tokenResponse.status,tokens.error||"missing access or refresh token");return finish("token_error");}
  stage="gmail_profile_check";
  const profileResponse=await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile",{headers:{Authorization:`Bearer ${tokens.access_token}`}});
  if(!profileResponse.ok){console.error("gmail_callback_profile_failed",profileResponse.status,(await profileResponse.text()).slice(0,300));return finish("profile_error");}
  const profile=await profileResponse.json() as {emailAddress?:string},email=(profile.emailAddress||"").toLowerCase();
  if(email!=="hello.nirauloom@gmail.com")return finish("wrong_account");
  stage="token_encryption";let encrypted:{ciphertext:string;iv:string};
  try{encrypted=await encryptToken(tokens.refresh_token,env.GOOGLE_TOKEN_ENCRYPTION_KEY);}catch(e){console.error("gmail_callback_encryption_failed",e instanceof Error?e.message:"unknown");return finish("encryption_error");}
  stage="supabase_save";await saveConnection(env,payload.userId,email,encrypted);return finish("connected");
 }catch(e){console.error("gmail_callback_unhandled",stage,e instanceof Error?e.message:"unknown error");return finish("callback_error");}
};
