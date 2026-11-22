interface Env {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_TOKEN_ENCRYPTION_KEY?: string;
}
const SENDER = "hello.nirauloom@gmail.com";
const APP = "https://nirauloom.pages.dev";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const b64 = (v: string) => Uint8Array.from(atob(v.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4-v.length%4)%4)), c => c.charCodeAt(0));
const enc = (v: Uint8Array) => { let s=""; for(const c of v)s+=String.fromCharCode(c); return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,""); };
async function getUser(request: Request, env: Env) {
  const token=request.headers.get("Authorization")?.replace(/^Bearer\s+/i,"");
  if(!token||!env.VITE_SUPABASE_URL||!env.VITE_SUPABASE_ANON_KEY)return null;
  const r=await fetch(env.VITE_SUPABASE_URL+"/auth/v1/user",{headers:{apikey:env.VITE_SUPABASE_ANON_KEY,Authorization:"Bearer "+token}});
  if(!r.ok)return null;
  return await r.json() as {id:string;email?:string};
}
async function rest(env:Env,path:string,init:RequestInit={}) {
  const key=env.SUPABASE_SERVICE_ROLE_KEY!;
  return fetch(env.VITE_SUPABASE_URL+path,{...init,headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",...(init.headers||{})}});
}
async function send(env:Env,to:string,subject:string,body:string) {
  if(!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET||!env.GOOGLE_TOKEN_ENCRYPTION_KEY||!env.SUPABASE_SERVICE_ROLE_KEY||!env.VITE_SUPABASE_URL)throw new Error("Gmail sender is not fully configured.");
  const q=new URLSearchParams({select:"email,encrypted_refresh_token,encryption_iv",email:"eq."+SENDER});
  const cr=await rest(env,"/rest/v1/outreach_gmail_connections?"+q.toString());
  if(!cr.ok)throw new Error("Could not load the connected Gmail sender.");
  const rows=await cr.json() as Array<{email:string;encrypted_refresh_token:string;encryption_iv:string}>;
  const c=rows[0]; if(!c||c.email.toLowerCase()!==SENDER)throw new Error("Nirauloom Gmail is not connected.");
  const secret=env.GOOGLE_TOKEN_ENCRYPTION_KEY.trim();
  const raw=/^[0-9a-f]{64}$/i.test(secret)?Uint8Array.from(secret.match(/.{2}/g)!,h=>parseInt(h,16)):b64(secret);
  if(raw.length!==32)throw new Error("Invalid Gmail encryption configuration.");
  const key=await crypto.subtle.importKey("raw",raw,"AES-GCM",false,["decrypt"]);
  const refresh=new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:b64(c.encryption_iv)},key,b64(c.encrypted_refresh_token)));
  const tr=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,refresh_token:refresh,grant_type:"refresh_token"})});
  const td=await tr.json() as {access_token?:string;error?:string};
  if(!tr.ok||!td.access_token)throw new Error("Gmail authorization failed. Reconnect the sender.");
  const subject64=btoa(String.fromCharCode(...new TextEncoder().encode(subject)));
  const body64=btoa(String.fromCharCode(...new TextEncoder().encode(body))).replace(/.{1,76}/g,"$&\r\n").trim();
  const mime=[`From: Nirauloom <${SENDER}>`,`To: ${to}`,`Subject: =?UTF-8?B?${subject64}?=`,"MIME-Version: 1.0","Content-Type: text/plain; charset=UTF-8","Content-Transfer-Encoding: base64","",body64].join("\r\n");
  const sr=await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send",{method:"POST",headers:{Authorization:"Bearer "+td.access_token,"Content-Type":"application/json"},body:JSON.stringify({raw:enc(new TextEncoder().encode(mime))})});
  const sd=await sr.json() as {id?:string};
  if(!sr.ok||!sd.id)throw new Error("Gmail did not accept the notification.");
  return sd.id;
}
export const onRequestPost=async({request,env}:{request:Request;env:Env})=>{
 try{
  const user=await getUser(request,env); if(!user?.id)return json({error:"Sign in required."},401);
  const input=await request.json() as {event?:string;creationId?:string};
  const event=input.event||"";
  if(!["welcome","submitted","approved","rejected"].includes(event))return json({error:"Unsupported notification."},400);
  let recipient=user.email||"", displayName="Creator", projectName="";
  const profile=await rest(env,"/rest/v1/profiles?select=display_name&id=eq."+user.id);
  if(profile.ok){const p=await profile.json() as Array<{display_name?:string}>;displayName=p[0]?.display_name||displayName;}
  if(event!=="welcome"){
   if(!input.creationId)return json({error:"Project reference required."},400);
   const cq=new URLSearchParams({select:"id,name,creator_id,status,rejection_reason",id:"eq."+input.creationId});
   const cr=await rest(env,"/rest/v1/creations?"+cq.toString());
   if(!cr.ok)return json({error:"Could not verify project."},500);
   const projects=await cr.json() as Array<{id:string;name:string;creator_id:string;status:string;rejection_reason?:string}>;
   const p=projects[0]; if(!p)return json({error:"Project not found."},404);
   if(event==="submitted"&&p.creator_id!==user.id)return json({error:"Not your project."},403);
   if(event==="approved"||event==="rejected"){
    const pr=await rest(env,"/rest/v1/profiles?select=is_admin&id=eq."+user.id);
    const admins=pr.ok?await pr.json() as Array<{is_admin:boolean}>:[];
    if(!admins[0]?.is_admin)return json({error:"Admin access required."},403);
   }
   projectName=p.name;
   if(event!=="submitted"){
    const ar=await rest(env,"/auth/v1/admin/users/"+p.creator_id);
    if(!ar.ok)return json({error:"Could not find project creator."},500);
    const au=await ar.json() as {email?:string;user_metadata?:{full_name?:string}};
    recipient=au.email||"";
    displayName=au.user_metadata?.full_name||displayName;
   }
   if(event==="submitted"&&p.status!=="pending"&&p.status!=="approved")return json({skipped:true});
   if(event==="approved"&&p.status!=="approved")return json({skipped:true});
   if(event==="rejected"&&p.status!=="rejected")return json({skipped:true});
  }
  if(!recipient||!/^\S+@\S+\.\S+$/.test(recipient))return json({error:"Recipient email unavailable."},400);
  const dedupe=event==="welcome"?"welcome:"+user.id:event+":"+input.creationId;
  const reserve=await rest(env,"/rest/v1/notification_deliveries",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({dedupe_key:dedupe,event_type:event,user_id:user.id,recipient_email:recipient,status:"sending"})});
  if(reserve.status===409)return json({success:true,duplicate:true});
  if(!reserve.ok){const t=await reserve.text();if(t.includes("23505")||t.includes("duplicate"))return json({success:true,duplicate:true});return json({error:"Could not reserve notification."},500);}
  let subject="",message="";
  if(event==="welcome"){subject="Welcome to Nirauloom";message=`Hi ${displayName},\n\nWelcome to Nirauloom — a place to discover, share, and celebrate independent creations.\n\nWhen you're ready, publish a project and let the community discover what you're building.\n\nExplore Nirauloom: ${APP}\n\nDiscover. Build. Connect.\nNirauloom Team`;}
  if(event==="submitted"){subject="We received your project";message=`Hi ${displayName},\n\nThank you for submitting “${projectName}” to Nirauloom. Your project is now in the review queue. We'll email you when its review is complete.\n\nView Nirauloom: ${APP}\n\nDiscover. Build. Connect.\nNirauloom Team`;}
  if(event==="approved"){subject="Your project is live on Nirauloom";message=`Hi ${displayName},\n\nGood news — “${projectName}” has been approved and is now published on Nirauloom. Share your work and let more people discover it.\n\nVisit: ${APP}\n\nDiscover. Build. Connect.\nNirauloom Team`;}
  if(event==="rejected"){subject="An update about your Nirauloom project";message=`Hi ${displayName},\n\nThank you for submitting “${projectName}”. After review, it was not approved at this time.\n\nPlease review the platform guidelines and any feedback provided in your project dashboard before resubmitting.\n\nVisit: ${APP}\n\nDiscover. Build. Connect.\nNirauloom Team`;}
  try{
   const messageId=await send(env,recipient,subject,message);
   await rest(env,"/rest/v1/notification_deliveries?dedupe_key=eq."+encodeURIComponent(dedupe),{method:"PATCH",body:JSON.stringify({status:"sent",provider_message_id:messageId,sent_at:new Date().toISOString()})});
   return json({success:true});
  }catch(e){
   await rest(env,"/rest/v1/notification_deliveries?dedupe_key=eq."+encodeURIComponent(dedupe),{method:"PATCH",body:JSON.stringify({status:"failed",error_message:e instanceof Error?e.message:"Send failed"})});
   return json({error:e instanceof Error?e.message:"Email could not be sent."},502);
  }
 }catch(e){console.error("transactional_notification_failed",e instanceof Error?e.message:"unknown");return json({error:"Notification could not be sent."},500);}
};
