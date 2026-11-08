const $=s=>document.querySelector(s);
const dateNode=$("#dateLine");if(dateNode)dateNode.textContent=new Intl.DateTimeFormat("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date());
const year=$("#year");if(year)year.textContent=new Date().getFullYear();
const menu=$("#menuToggle"),nav=$("#navLinks");if(menu&&nav){menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-label",open?"Close navigation":"Open navigation");menu.textContent=open?"×":"☰"});nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menu.textContent="☰"}));}
const search=$("#searchForm");if(search)search.addEventListener("submit",e=>{e.preventDefault();const q=$("#searchInput").value.trim();if(q)window.location.href="desk.html?search="+encodeURIComponent(q)});
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));}
