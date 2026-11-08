(() => {
 const cfg=window.WORLDSCOPE_SUPABASE||{};
 if(!window.supabase||!cfg.url||!cfg.anonKey)return;
 const db=window.supabase.createClient(cfg.url,cfg.anonKey);
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const fmt=v=>v?new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric"}).format(new Date(v)):"";
 const fallback=c=>({Nigeria:"https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1000&q=80",Africa:"https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1000&q=80",Business:"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80",Technology:"https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80",Sports:"https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=80"}[c]||"https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80");
 const url=s=>"story.html?slug="+encodeURIComponent(s);
 const card=a=>'<article class="live-story-card"><a href="'+url(a.slug)+'"><img src="'+esc(a.featured_image_url||fallback(a.category))+'" alt="'+esc(a.title)+'" loading="lazy"><div class="live-story-copy"><span class="eyebrow">'+esc(a.category||"News")+'</span><h3>'+esc(a.title)+'</h3><p>'+esc(a.summary||"Read the latest report from WorldScope News.")+'</p><small>'+esc(a.byline_name||"WorldScope News")+' · '+fmt(a.published_at)+'</small></div></a></article>';
 async function home(){
  const {data,error}=await db.from("articles").select("id,title,slug,category,summary,featured_image_url,published_at,byline_name,is_featured").eq("status","published").order("is_featured",{ascending:false}).order("published_at",{ascending:false}).limit(16);
  if(error){console.error("WorldScope feed:",error.message);return;} if(!data?.length)return;
  const lead=data.find(a=>a.is_featured)||data[0],hero=document.querySelector(".hero");
  if(hero)hero.innerHTML='<img src="'+esc(lead.featured_image_url||fallback(lead.category))+'" alt="'+esc(lead.title)+'" fetchpriority="high"><div class="hero-shade"></div><div class="hero-content"><span class="red-label">'+esc(lead.category||"TOP STORY")+'</span><h1>'+esc(lead.title)+'</h1><p>'+esc(lead.summary)+'</p><a class="hero-cta" href="'+url(lead.slug)+'">Read full story <b>→</b></a></div><span class="hero-index">WS <small>IN FOCUS</small></span>';
  const latest=document.querySelector(".latest-placeholder");if(latest)latest.outerHTML='<div class="live-story-grid">'+data.filter(a=>a.id!==lead.id).map(card).join("")+'</div>';
  const trend=document.querySelector(".trend-panel");if(trend){const head=trend.querySelector(".panel-heading")?.outerHTML||"";trend.innerHTML=head+data.slice(0,4).map((a,i)=>'<a class="trend-live-item" href="'+url(a.slug)+'"><span>'+String(i+1).padStart(2,"0")+'</span><b>'+esc(a.title)+'</b></a>').join("")+'<a class="text-link" href="desk.html?section=latest">All latest reports →</a>';}
 }
 async function desk(){
  const grid=document.querySelector("[data-live-desk]");if(!grid)return;
  const p=new URLSearchParams(location.search),section=(p.get("section")||"latest").toLowerCase(),q=(p.get("search")||"").trim();
  const heading=document.querySelector("#deskTitle");if(heading)heading.textContent=q?"Search: "+q:section==="latest"?"Latest reports":section[0].toUpperCase()+section.slice(1);
  let query=db.from("articles").select("id,title,slug,category,summary,featured_image_url,published_at,byline_name").eq("status","published").order("published_at",{ascending:false}).limit(40);
  if(section!=="latest"&&!q)query=query.ilike("category",section);if(q)query=query.or("title.ilike.%"+q+"%,summary.ilike.%"+q+"%,body.ilike.%"+q+"%");
  const {data,error}=await query;if(error){grid.textContent="The newsroom feed is temporarily unavailable.";return;}
  grid.innerHTML=data?.length?data.map(card).join(""):'<div class="desk-empty"><div class="empty-mark">W</div><h2>No published reports in this desk yet.</h2><p>Drafts remain private until editorial approval.</p></div>';
 }
 async function story(){
  const root=document.querySelector("[data-live-story]");if(!root)return;
  const slug=new URLSearchParams(location.search).get("slug");if(!slug){root.textContent="Story not found.";return;}
  const {data,error}=await db.from("articles").select("id,title,category,summary,body,featured_image_url,published_at,byline_name").eq("slug",slug).eq("status","published").maybeSingle();
  if(error||!data){root.innerHTML="<h1>Story unavailable</h1><p>This report is not publicly available.</p>";return;}
  const {data:sources}=await db.from("article_sources").select("title,url").eq("article_id",data.id);
  document.title=data.title+" | WorldScope News";
  root.innerHTML='<article class="story-article"><span class="eyebrow">'+esc(data.category)+'</span><h1>'+esc(data.title)+'</h1><p class="story-deck">'+esc(data.summary)+'</p><p class="story-byline">By '+esc(data.byline_name||"WorldScope News")+' · '+fmt(data.published_at)+'</p>'+(data.featured_image_url?'<img class="story-image" src="'+esc(data.featured_image_url)+'" alt="'+esc(data.title)+'">':"")+'<div class="story-body">'+String(data.body||"").split(/\n\n+/).map(p=>"<p>"+esc(p).replace(/\n/g,"<br>")+"</p>").join("")+'</div><section class="story-sources"><h2>Sources & further reading</h2>'+(sources||[]).map(s=>'<p><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+'</a></p>').join("")+'</section></article>';
 }

 async function adverts(){
  const today=new Date().toISOString().slice(0,10);
  const {data}=await db.from("ad_campaigns").select("name,advertiser,placement,click_url,asset_url,media_type").eq("status","active").or("starts_at.is.null,starts_at.lte."+today).or("ends_at.is.null,ends_at.gte."+today).order("created_at",{ascending:false}).limit(8);
  if(!data?.length)return;
  const sidebar=data.find(a=>a.placement==="sidebar")||data[0],box=document.querySelector(".advert-card");
  if(box){const img=box.querySelector(".ad-image"),copy=box.querySelector(".ad-copy");if(img){img.innerHTML=sidebar.media_type==="video"?'<video controls muted playsinline preload="metadata" src="'+esc(sidebar.asset_url)+'"></video>':'<a href="'+esc(sidebar.click_url)+'" target="_blank" rel="sponsored noopener"><img src="'+esc(sidebar.asset_url)+'" alt="'+esc(sidebar.name)+'"></a>';}if(copy)copy.innerHTML='<span>ADVERTISEMENT · SPONSORED</span><h2>'+esc(sidebar.name)+'</h2><p>Presented by '+esc(sidebar.advertiser)+'.</p><a href="'+esc(sidebar.click_url)+'" target="_blank" rel="sponsored noopener">Visit advertiser →</a>';}
  const banner=data.find(a=>a.placement==="banner");if(banner){const section=document.createElement("section");section.className="live-ad-banner";section.innerHTML='<span>ADVERTISEMENT · SPONSORED</span><a href="'+esc(banner.click_url)+'" target="_blank" rel="sponsored noopener">'+(banner.media_type==="video"?'<video controls muted playsinline src="'+esc(banner.asset_url)+'"></video>':'<img src="'+esc(banner.asset_url)+'" alt="'+esc(banner.name)+'">')+'</a>';const main=document.querySelector("main.shell");if(main)main.append(section);}
 }
 document.addEventListener("DOMContentLoaded",()=>{home();desk();story();adverts();});
})();