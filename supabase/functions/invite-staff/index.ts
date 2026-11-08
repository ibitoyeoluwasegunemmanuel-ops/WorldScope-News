// Deploy with Supabase CLI: supabase functions deploy invite-staff
// Configure SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY as function secrets.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:{...cors,"Content-Type":"application/json"}});
 try{
  const auth=req.headers.get("Authorization")||"";
  if(!auth.startsWith("Bearer "))return new Response(JSON.stringify({error:"Sign-in required"}),{status:401,headers:{...cors,"Content-Type":"application/json"}});
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const callerClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:{user:caller},error:authErr}=await callerClient.auth.getUser();
  if(authErr||!caller)return new Response(JSON.stringify({error:"Invalid session"}),{status:401,headers:{...cors,"Content-Type":"application/json"}});
  const {data:profile}=await callerClient.from("profiles").select("role").eq("id",caller.id).single();
  if(profile?.role!=="admin")return new Response(JSON.stringify({error:"Administrator permission required"}),{status:403,headers:{...cors,"Content-Type":"application/json"}});
  const body=await req.json(),email=String(body.email||"").trim().toLowerCase(),display_name=String(body.display_name||"").trim(),role=String(body.role||"reporter");
  if(!/^\S+@\S+\.\S+$/.test(email)||!display_name||!["reporter","editor","moderator"].includes(role))return new Response(JSON.stringify({error:"Provide a valid email, name and permitted staff role"}),{status:400,headers:{...cors,"Content-Type":"application/json"}});
  const admin=createClient(url,service);
  const {data,error}=await admin.auth.admin.inviteUserByEmail(email,{data:{display_name},redirectTo:"https://worldscope-news.vercel.app/admin.html"});
  if(error)throw error;
  const {error:roleErr}=await admin.from("profiles").upsert({id:data.user.id,display_name,role},{onConflict:"id"});
  if(roleErr)throw roleErr;
  return new Response(JSON.stringify({message:"Invitation sent to "+email+". The team member can set their password from the email link.",user_id:data.user.id}),{status:200,headers:{...cors,"Content-Type":"application/json"}});
 }catch(e){return new Response(JSON.stringify({error:e.message||"Invitation failed"}),{status:400,headers:{...cors,"Content-Type":"application/json"}})}
});
