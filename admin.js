(function(){
const $=id=>document.getElementById(id),cfg=window.WORLDSCOPE_SUPABASE||{},ok=cfg.url&&cfg.anonKey&&window.supabase;
const login=$("loginPanel"),dash=$("dashboard");let db,user,profile,articles=[];
const msg=(id,s)=>{if($(id))$(id).textContent=s};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const roleNames={admin:"Administrator",editor:"Editor",reporter:"Reporter",moderator:"Moderator"};
function panel(name){document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));document.querySelectorAll("[id^=tab-]").forEach(s=>s.classList.toggle("hidden",s.id!=="tab-"+name))}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>panel(b.dataset.tab));
function loggedIn(){login.classList.add("hidden");dash.classList.remove("hidden");$("staffIdentity").textContent=(profile.display_name||user.email)+" · "+roleNames[profile.role];}
function loggedOut(){login.classList.remove("hidden");dash.classList.add("hidden")}
function canEdit(){return ["admin","editor"].includes(profile.role)}
async function loadArticles(){
 const {data,error}=await db.from("articles").select("id,title,category,status,updated_at,author_id").order("updated_at",{ascending:false}).limit(150);
 if(error){$("articleList").textContent=error.message;return}
 articles=data||[];
 $("articleList").innerHTML=articles.length?'<table class="admin-list"><thead><tr><th>Headline</th><th>Desk</th><th>Status</th><th>Updated</th><th>Action</th></tr></thead><tbody>'+articles.map(a=>'<tr><td>'+esc(a.title)+'</td><td>'+esc(a.category)+'</td><td><span class="status '+(a.status==="published"?"published":a.status==="in_review"?"review":"")+'">'+esc(a.status)+'</span></td><td>'+new Date(a.updated_at).toLocaleDateString()+'</td><td><button class="admin-btn secondary" data-edit="'+a.id+'">Edit</button> '+(canEdit()&&a.status==="in_review"?'<button class="admin-btn" data-publish="'+a.id+'">Approve & publish</button>':"")+'</td></tr>').join("")+'</tbody></table>':'No articles yet.';
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>edit(b.dataset.edit));
 document.querySelectorAll("[data-publish]").forEach(b=>b.onclick=()=>publish(b.dataset.publish));
 $("sourceArticle").innerHTML=articles.map(a=>'<option value="'+a.id+'">'+esc(a.title)+'</option>').join("")||'<option value="">No articles</option>';
}
async function edit(id){const {data,error}=await db.from("articles").select("*").eq("id",id).single();if(error)return alert(error.message);
 $("articleId").value=data.id;$("headline").value=data.title;$("category").value=data.category;$("summary").value=data.summary;$("body").value=data.body;$("imageUrl").value=data.featured_image_url||"";$("editorHeading").textContent="Edit report";panel("new")}
async function publish(id){if(!confirm("Approve and publish this report? Check every source and image first."))return;const {error}=await db.from("articles").update({status:"published",published_at:new Date().toISOString()}).eq("id",id);if(error)alert(error.message);else{alert("Report published.");loadArticles()}}
async function save(status){const id=$("articleId").value,row={title:$("headline").value.trim(),slug:$("headline").value.trim().toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),category:$("category").value,summary:$("summary").value.trim(),body:$("body").value.trim(),featured_image_url:$("imageUrl").value.trim()||null,status};
 if(!row.title||!row.summary||!row.body)return msg("articleMessage","Complete headline, summary and body.");
 const res=id?await db.from("articles").update(row).eq("id",id):await db.from("articles").insert({...row,author_id:user.id});
 msg("articleMessage",res.error?res.error.message:"Saved successfully.");if(!res.error){$("articleForm").reset();$("articleId").value="";await loadArticles();panel("articles")}}
$("newArticleBtn").onclick=()=>{ $("articleForm").reset();$("articleId").value="";panel("new")};
$("saveDraft").onclick=()=>save("draft");$("submitReview").onclick=()=>save("in_review");
$("sourceForm").onsubmit=async e=>{e.preventDefault();const {error}=await db.from("article_sources").insert({article_id:$("sourceArticle").value,title:$("sourceTitle").value,url:$("sourceUrl").value,source_type:$("sourceType").value,notes:$("sourceNote").value,added_by:user.id});msg("sourceMessage",error?.message||"Source recorded.");if(!error)e.target.reset()};
async function staff(){if(profile.role!=="admin"){$("tab-staff").innerHTML="<h2>Staff access</h2><p>Only administrators can manage newsroom accounts.</p>";return}
 const {data,error}=await db.from("profiles").select("id,display_name,role,created_at").order("created_at",{ascending:false});
 $("staffList").innerHTML=error?esc(error.message):'<h3>Newsroom accounts</h3><table class="admin-list"><tbody>'+(data||[]).map(p=>'<tr><td>'+esc(p.display_name||"Team member")+'<br><small>'+p.id.slice(0,8)+'…</small></td><td><select data-role="'+p.id+'">'+Object.keys(roleNames).map(r=>'<option value="'+r+'" '+(p.role===r?"selected":"")+'>'+roleNames[r]+'</option>').join("")+'</select></td><td>'+(p.id===user.id?"You":'<button class="admin-btn secondary" data-save-role="'+p.id+'">Save role</button>')+'</td></tr>').join("")+'</tbody></table>';
 document.querySelectorAll("[data-save-role]").forEach(b=>b.onclick=async()=>{const id=b.dataset.saveRole,role=document.querySelector('[data-role="'+id+'"]').value;if(!confirm("Change this team member's role to "+role+"?"))return;const {error}=await db.from("profiles").update({role}).eq("id",id);alert(error?.message||"Role updated.");staff()})
}
async function ads(){
 const {data,error}=await db.from("ad_campaigns").select("*").order("created_at",{ascending:false});
 $("adList").innerHTML=error?esc(error.message):(data||[]).map(a=>'<p><b>'+esc(a.name)+'</b> · '+esc(a.placement)+' · '+esc(a.status)+'<br><a href="'+esc(a.asset_url)+'" target="_blank" rel="noopener">View creative</a> '+(profile.role==="admin"||profile.role==="editor"?'<button class="admin-btn secondary" data-ad-approve="'+a.id+'">Activate</button> <button class="admin-btn secondary" data-ad-pause="'+a.id+'">Pause</button>':"")+'</p>').join("")||"No campaigns yet.";
 document.querySelectorAll("[data-ad-approve]").forEach(b=>b.onclick=async()=>{const {error}=await db.from("ad_campaigns").update({status:"active"}).eq("id",b.dataset.adApprove);if(error)alert(error.message);else ads()});
 document.querySelectorAll("[data-ad-pause]").forEach(b=>b.onclick=async()=>{const {error}=await db.from("ad_campaigns").update({status:"paused"}).eq("id",b.dataset.adPause);if(error)alert(error.message);else ads()});
}
$("inviteForm").onsubmit=async e=>{e.preventDefault();msg("inviteMessage","Sending secure invitation…");const {data:{session}}=await db.auth.getSession();const {data,error}=await db.functions.invoke("invite-staff",{body:{email:$("inviteEmail").value.trim(),display_name:$("inviteName").value.trim(),role:$("inviteRole").value}});msg("inviteMessage",error?.message||(data?.message||"Invitation request sent."));if(!error)e.target.reset()};
$("togglePassword").onclick=()=>{const p=$("password"),show=p.type==="password";p.type=show?"text":"password";$("togglePassword").textContent=show?"Hide":"Show"};
const remembered=localStorage.getItem("ws_staff_email");if(remembered){$("email").value=remembered;$("rememberEmail").checked=true}
$("rememberEmail").onchange=()=>{if(!$("rememberEmail").checked)localStorage.removeItem("ws_staff_email")};
$("forgotPassword").onclick=async()=>{const email=$("email").value.trim();if(!email)return msg("loginMessage","Enter your email address first.");const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+"/admin.html"});msg("loginMessage",error?.message||"If the account exists, a password reset email has been sent.")};
async function boot(){if(!ok){$("loginForm").querySelector("button[type=submit]").disabled=true;msg("loginMessage","Database configuration is missing.");return}
 db=window.supabase.createClient(cfg.url,cfg.anonKey);const {data:{session}}=await db.auth.getSession();if(session)await accept(session.user)}
async function accept(u){user=u;const {data,error}=await db.from("profiles").select("role,display_name").eq("id",u.id).single();if(error||!data||!["admin","editor","reporter","moderator"].includes(data.role)){await db.auth.signOut();loggedOut();msg("loginMessage","This account has no authorised newsroom role.");return}
 profile=data;loggedIn();$("connectionNotice").textContent="Connected. Your access is restricted by your newsroom role.";
 if(profile.role==="reporter"||profile.role==="moderator"){$("tab-staff").classList.add("hidden")}
 await loadArticles();if(profile.role==="admin"){staff();ads()}}
$("loginForm").onsubmit=async e=>{e.preventDefault();if(!$("rememberEmail").checked)localStorage.removeItem("ws_staff_email");else localStorage.setItem("ws_staff_email",$("email").value.trim());msg("loginMessage","Signing in…");const {data,error}=await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error)return msg("loginMessage",error.message);await accept(data.user)};
$("logoutBtn").onclick=async()=>{await db.auth.signOut();loggedOut()};
$("articleForm").querySelectorAll("input,textarea,select,button").forEach(el=>{if(["headline","category","summary","body","imageUrl","articleId","saveDraft","submitReview"].includes(el.id)&&profile?.role==="moderator")el.disabled=true});
boot();
})();