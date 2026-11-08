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
  const page=Math.max(1,parseInt(p.get("page")||"1",10)||1),pageSize=20;
  const heading=document.querySelector("#deskTitle");if(heading)heading.textContent=q?"Search: "+q:section==="latest"?"Latest reports":section[0].toUpperCase()+section.slice(1);
  const intro=document.querySelector("#deskIntro");if(intro)intro.textContent=q?"Search published WorldScope reports by headline, summary and article text.":section==="latest"?"The latest published reports from Nigeria, Africa and around the world.":"Published reporting from the "+section+" desk. Drafts remain private until editorial approval.";
  let query=db.from("articles").select("id,title,slug,category,summary,featured_image_url,published_at,byline_name",{count:"exact"}).eq("status","published").order("published_at",{ascending:false});
  const categoryMap={world:["World"],africa:["Africa"],nigeria:["Nigeria"],business:["Business"],technology:["Technology"],health:["Health"],environment:["Environment"],entertainment:["Entertainment"],opinion:["Opinion"],sports:["Sports"]};
  if(section!=="latest"&&!q){const categories=categoryMap[section]||[section];query=query.in("category",categories);}
  if(q){const safe=q.replace(/[,%()]/g," ").replace(/\s+/g," ").trim().slice(0,120);if(safe)query=query.or("title.ilike.%"+safe+"%,summary.ilike.%"+safe+"%,body.ilike.%"+safe+"%");}
  if(p.get("year")){const y=Number(p.get("year"));if(Number.isInteger(y)&&y>=1900&&y<=2100){query=query.gte("published_at",y+"-01-01T00:00:00.000Z").lt("published_at",(y+1)+"-01-01T00:00:00.000Z");}}
  const from=(page-1)*pageSize;query=query.range(from,from+pageSize-1);
  const {data,error,count}=await query;
  if(error){grid.textContent="The newsroom feed is temporarily unavailable.";return;}
  const totalPages=Math.max(1,Math.ceil((count||0)/pageSize));
  const articles=data||[];
  const archive=document.createElement("div");archive.className="archive-tools";
  archive.innerHTML='<div class="archive-meta"><span>NEWS ARCHIVE</span><b>'+((count||0).toLocaleString())+' published reports</b><small>Browse the full archive, newest first.</small></div><label>Year <select id="archiveYear"><option value="">All years</option></select></label>';
  const yearSelect=archive.querySelector("#archiveYear");
  const {data:years}=await db.from("articles").select("published_at").eq("status","published").order("published_at",{ascending:false}).limit(1000);
  const yearList=[...new Set((years||[]).map(a=>new Date(a.published_at).getFullYear()).filter(Number.isFinite))].sort((a,b)=>b-a);
  yearList.forEach(y=>{const o=document.createElement("option");o.value=String(y);o.textContent=String(y);yearSelect.append(o)});
  if(p.get("year"))yearSelect.value=p.get("year");
  yearSelect.onchange=()=>{const next=new URLSearchParams(location.search);next.delete("page");if(yearSelect.value)next.set("year",yearSelect.value);else next.delete("year");location.search=next.toString()};
  const cards=document.createElement("div");cards.className="live-story-grid";cards.innerHTML=articles.length?articles.map(card).join(""):'<div class="desk-empty"><div class="empty-mark">W</div><h2>No published reports in this view.</h2><p>Try another section or year. Drafts remain private until editorial approval.</p></div>';
  const pager=document.createElement("nav");pager.className="archive-pagination";pager.setAttribute("aria-label","News archive pages");
  pager.innerHTML='<span>Page '+page+' of '+totalPages+'</span><div>'+(page>1?'<a href="'+esc(pageUrl(page-1))+'">← Newer</a>':'')+(page<totalPages?'<a href="'+esc(pageUrl(page+1))+'">Older →</a>':'')+'</div>';
  function pageUrl(n){const next=new URLSearchParams(location.search);next.set("page",String(n));return "desk.html?"+next.toString()}
  grid.replaceChildren(archive,cards,pager);
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
  const {data,error}=await db.from("advertisements").select("id,title,advertiser,format,placement,media_path,click_url,alt_text").eq("status","active").lte("starts_at",new Date().toISOString()).gte("ends_at",new Date().toISOString()).order("created_at",{ascending:false}).limit(12);
  if(error){console.warn("Sponsored placements unavailable",error.message);return;}
  const campaigns=(data||[]).map(a=>({...a,name:a.title,asset_url:a.media_path,media_type:a.format}));
  const media=a=>a.media_type==="video"?'<video controls muted playsinline preload="metadata" src="'+esc(a.asset_url)+'"></video>':'<img src="'+esc(a.asset_url)+'" alt="'+esc(a.alt_text||a.name)+'">';
  const linked=a=>'<a href="'+esc(a.click_url||"#")+'" target="_blank" rel="sponsored noopener">'+media(a)+'</a>';
  const side=campaigns.find(a=>["sidebar","homepage_rail"].includes(a.placement));
  const box=document.querySelector(".advert-card");
  if(side&&box){const img=box.querySelector(".ad-image"),copy=box.querySelector(".ad-copy");if(img)img.innerHTML=side.media_type==="video"?media(side):linked(side);if(copy)copy.innerHTML='<span>ADVERTISEMENT · SPONSORED</span><h2>'+esc(side.name)+'</h2><p>Presented by '+esc(side.advertiser)+'.</p><a href="'+esc(side.click_url||"#")+'" target="_blank" rel="sponsored noopener">Visit advertiser →</a>';}
  const banner=campaigns.find(a=>["banner","top_leaderboard"].includes(a.placement));
  if(banner){let section=document.querySelector(".live-ad-banner");if(!section){section=document.createElement("section");section.className="live-ad-banner";const main=document.querySelector("main.shell");if(main)main.insertBefore(section,main.querySelector(".latest-section"));}section.innerHTML='<span>ADVERTISEMENT · SPONSORED</span>'+linked(banner);}
  const railVideo=campaigns.find(a=>a.placement==="homepage_rail"&&a.media_type==="video");
  if(railVideo&&side?.id!==railVideo.id){const rail=document.querySelector(".right-rail");if(rail){const video=document.createElement("section");video.className="live-ad-video";video.innerHTML='<span>ADVERTISEMENT · SPONSORED</span>'+linked(railVideo);rail.append(video);}}
 }
 document.addEventListener("DOMContentLoaded",()=>{home();desk();story();adverts();});
})();