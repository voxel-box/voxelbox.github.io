/* VOXELBOX — voxel theme shell + interactions */
const DISCORD = "https://discord.gg/mpeZ62uEEp";
const STATUS_URL = "https://panel.voxelbox.org/vb-status/status.json";
const NEWS_URL = "https://panel.voxelbox.org/vb-status/news.json";

const NAV = [
  { id:"home", label:"Home", href:"index.html" },
  { id:"servers", label:"Servers", href:"servers.html" },
  { id:"prints", label:"3D Prints", href:"3d-prints.html" },
  { id:"community", label:"Community", href:"community.html", children:[
    { id:"announcements", label:"News", href:"announcements.html" },
    { id:"showcase", label:"Showcase", href:"showcase.html" },
    { id:"partners", label:"Partners", href:"partners.html" },
    { id:"rules", label:"Rules", href:"rules.html" },
  ]},
  { id:"about", label:"About", href:"about.html", children:[
    { id:"team", label:"Team", href:"team.html" },
    { id:"costs", label:"Costs", href:"costs.html" },
  ]},
  { id:"support", label:"Support", href:"support.html", children:[
    { id:"getting-started", label:"Getting Started", href:"getting-started.html" },
    { id:"applications", label:"Applications", href:"applications.html" },
    { id:"update-pings", label:"Update Pings", href:"update-pings.html" },
  ]},
  { id:"contact", label:"Contact", href:"contact.html" },
];
const FOOT = [
  ["Explore", [["Home","index.html"],["Servers","servers.html"],["3D Prints","3d-prints.html"],["About","about.html"],["Team","team.html"]]],
  ["Play", [["All Servers","servers.html"],["How To Join","getting-started.html"],["Rules","rules.html"],["Update Pings","update-pings.html"]]],
  ["Community", [["Join Discord",DISCORD,1],["News","announcements.html"],["Showcase","showcase.html"],["Partners","partners.html"]]],
  ["More", [["Costs","costs.html"],["Applications","applications.html"],["Contact","contact.html"],["Terms","terms.html"],["Privacy","privacy.html"]]],
];
const SRV_COLOR = {
  minecraft:"#67d073", palworld:"#49b6ff", satisfactory:"#ffce4d", enshrouded:"#b47bff",
  "american-truck-simulator":"#ff7d74", beammp:"#4fd6c0", fivem:"#ff9a4d",
};

const esc = (s)=>String(s).replace(/[&<>"']/g,(m)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function age(iso){ const s=Math.max(0,(Date.now()-new Date(iso).getTime())/1000); if(s<60)return Math.floor(s)+"s"; if(s<3600)return Math.floor(s/60)+"m"; if(s<86400)return Math.floor(s/3600)+"h"; return Math.floor(s/86400)+"d"; }
async function getJSON(u){ const r=await fetch(u,{cache:"no-store"}); if(!r.ok) throw new Error(r.status); return r.json(); }

document.addEventListener("DOMContentLoaded", ()=>{
  renderShell(); initNav(); initReveal(); initFaq();
  initServerStatus(); initNewsFeed(); initStreamers();
  initContactForm(); initApplyForm(); initCookies(); setYear();
  initAmbient(); initPush();
});

/* ---------- ambient living background (all pages) ---------- */
function initAmbient(){
  // the homepage has the full 3D world; skip there and for reduced motion
  if(document.querySelector("[data-voxel-scene]")) return;
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv=document.createElement("canvas");
  cv.setAttribute("aria-hidden","true");
  cv.style.cssText="position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none";
  document.body.appendChild(cv);
  const ctx=cv.getContext("2d"); if(!ctx) return;
  let W=0,H=0,dpr=1;
  const resize=()=>{ dpr=Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight;
    cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); };
  resize(); addEventListener("resize",resize,{passive:true});

  const ACCENTS=["#7fb2ff","#9ec6ff","#b99bff","#6fe0d0","#ff9a63"];

  // aurora orbs — rendered into a tiny offscreen buffer and GPU-upscaled
  // (cheap + blur-smooth: no per-frame full-viewport gradients, no banding)
  const AW=240, AH=135;
  const aur=document.createElement("canvas"); aur.width=AW; aur.height=AH;
  const actx=aur.getContext("2d");
  const orbs=[
    {x:.80,y:.12,r:.42,c:"127,178,255",a:.13,sp:.21,ph:0},
    {x:.10,y:.78,r:.38,c:"255,143,94",a:.09,sp:.16,ph:2.1},
    {x:.45,y:.40,r:.30,c:"185,155,255",a:.07,sp:.12,ph:4.2},
  ];
  function drawAurora(t){
    actx.clearRect(0,0,AW,AH);
    orbs.forEach((o)=>{
      const ox=(o.x+Math.sin(t*o.sp+o.ph)*.08)*AW;
      const oy=(o.y+Math.cos(t*o.sp*.8+o.ph)*.08)*AH;
      const rr=o.r*AW*(1+Math.sin(t*.5+o.ph)*.08);
      const g=actx.createRadialGradient(ox,oy,0,ox,oy,rr);
      g.addColorStop(0,`rgba(${o.c},${o.a*(0.8+Math.sin(t*.7+o.ph)*.2)})`);
      g.addColorStop(1,`rgba(${o.c},0)`);
      actx.fillStyle=g; actx.fillRect(0,0,AW,AH);
    });
  }
  // rising light motes — bright enough to actually see
  const N=Math.min(110,Math.round(innerWidth/12));
  const motes=Array.from({length:N},()=>({
    x:Math.random(), y:Math.random(),
    r:1.4+Math.random()*2.4, s:(.35+Math.random()*.8)/900,
    a:.25+Math.random()*.35, ph:Math.random()*Math.PI*2, depth:.4+Math.random()*.6 }));
  // floating wireframe voxel shards (the brand DNA, drifting through the page)
  const shards=Array.from({length:9},(_,i)=>({
    x:Math.random(), y:Math.random(),
    s:14+Math.random()*26, rot:Math.random()*Math.PI,
    vr:(Math.random()-.5)*.012, vy:(.12+Math.random()*.25)/900,
    c:ACCENTS[i%ACCENTS.length], a:.16+Math.random()*.2, depth:.5+Math.random()*.5, ph:Math.random()*6 }));
  // occasional comet streak
  let streak=null, nextStreak=performance.now()+3000+Math.random()*5000;

  let run=!document.hidden, t=0, last=0;
  const FRAME=1000/30;                        // 30fps is plenty for ambient drift
  document.addEventListener("visibilitychange",()=>{ run=!document.hidden; if(run) loop(); });
  function loop(now){
    if(!run) return;
    requestAnimationFrame(loop);
    if(now && now-last<FRAME) return;
    last=now||0; t+=0.033;
    const sc=(window.scrollY||0);
    ctx.clearRect(0,0,W,H);

    drawAurora(t);
    ctx.imageSmoothingEnabled=true;
    ctx.drawImage(aur,0,0,W,H);

    ctx.fillStyle="#bcd4ff";
    motes.forEach((m)=>{
      m.y-=m.s*m.depth*(H/700+1)*2; m.x+=Math.sin(t*.7+m.ph)*.0004;
      if(m.y<-.01){ m.y=1.01; m.x=Math.random(); }
      const y=(m.y*H - sc*.10*m.depth)%(H+40);
      ctx.globalAlpha=m.a*(0.7+Math.sin(t*1.4+m.ph)*0.3);
      ctx.fillRect(m.x*W, y<-20?y+H+40:y, m.r, m.r);
    });

    ctx.lineWidth=1.4;
    shards.forEach((sh)=>{
      sh.rot+=sh.vr*2; sh.y-=sh.vy*sh.depth*2;
      if(sh.y<-.06){ sh.y=1.06; sh.x=Math.random(); }
      const x=sh.x*W, y=(sh.y*H - sc*.16*sh.depth)%(H+120);
      const yy=y<-60?y+H+120:y, bob=Math.sin(t*.8+sh.ph)*6;
      ctx.save(); ctx.translate(x,yy+bob); ctx.rotate(sh.rot);
      ctx.globalAlpha=sh.a*(0.75+Math.sin(t+sh.ph)*0.25);
      ctx.strokeStyle=sh.c;
      const s=sh.s*sh.depth;
      ctx.strokeRect(-s/2,-s/2,s,s);
      ctx.globalAlpha*=.5;
      ctx.strokeRect(-s/3.2,-s/3.2,s/1.6,s/1.6);   // inner frame = voxel depth
      ctx.restore();
    });

    // comet streak every few seconds
    const nowMs=performance.now();
    if(!streak && nowMs>nextStreak){
      const fromLeft=Math.random()<.5;
      streak={x:fromLeft?-.05:1.05, y:Math.random()*.5,
        vx:(fromLeft?1:-1)*(.009+Math.random()*.005), vy:.004+Math.random()*.003, life:1};
    }
    if(streak){
      streak.x+=streak.vx*2; streak.y+=streak.vy*2; streak.life-=.024;
      const x=streak.x*W, y=streak.y*H, tx=x-streak.vx*W*14, ty=y-streak.vy*H*14;
      const g=ctx.createLinearGradient(x,y,tx,ty);
      g.addColorStop(0,`rgba(190,215,255,${.8*streak.life})`); g.addColorStop(1,"rgba(190,215,255,0)");
      ctx.strokeStyle=g; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(tx,ty); ctx.stroke();
      if(streak.life<=0 || streak.x<-.1 || streak.x>1.1){ streak=null; nextStreak=nowMs+5000+Math.random()*8000; }
    }

    ctx.globalAlpha=1;
  }
  loop();
}

/* ---------- site notifications (web push) ---------- */
function urlB64(s){
  const pad="=".repeat((4-(s.length%4))%4);
  const b=atob((s+pad).replace(/-/g,"+").replace(/_/g,"/"));
  return Uint8Array.from([...b].map((c)=>c.charCodeAt(0)));
}
function initPush(){
  const box=document.querySelector("[data-push-ui]"); if(!box) return;
  const btn=box.querySelector("[data-push-btn]");
  const st=box.querySelector("[data-push-status]");
  const say=(m,cls)=>{ if(st){ st.textContent=m; st.className="form-status "+(cls||""); } };
  if(!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)){
    if(btn) btn.disabled=true;
    say("this browser doesn't support notifications","err"); return;
  }
  let reg=null;
  const refresh=async()=>{
    const sub=reg ? await reg.pushManager.getSubscription() : null;
    if(sub){ btn.textContent="Turn off notifications"; say("you're signed up — updates will pop up on this device","ok"); }
    else if(Notification.permission==="denied"){ btn.textContent="Turn on notifications"; btn.disabled=true;
      say("notifications are blocked in your browser settings","err"); }
    else { btn.textContent="Turn on notifications"; btn.disabled=false; say(""); }
    return sub;
  };
  navigator.serviceWorker.register("sw.js")
    .then((r)=>{ reg=r; return refresh(); })
    .catch(()=>{ btn.disabled=true; say("couldn't start the notification service","err"); });
  btn.addEventListener("click", async()=>{
    if(!reg) return;
    btn.disabled=true; say("working…","pending");
    try{
      const sub=await reg.pushManager.getSubscription();
      if(sub){
        await fetch("/api/push/unsubscribe",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({endpoint:sub.endpoint})}).catch(()=>{});
        await sub.unsubscribe();
      }else{
        const j=await getJSON("/api/push/key");
        if(!j.key) throw new Error("no key");
        const s2=await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:urlB64(j.key)});
        const r=await fetch("/api/push/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify(s2)});
        if(!r.ok){ await s2.unsubscribe().catch(()=>{}); throw new Error("subscribe failed"); }
      }
    }catch(e){ say(Notification.permission==="denied"
        ? "notifications are blocked in your browser settings"
        : "couldn't sign you up — try again in a moment","err"); }
    btn.disabled=false; await refresh();
  });
}

function renderShell(){
  const page = document.body.dataset.page || "";
  const head = document.querySelector("[data-shell-header]");
  if (head){
    const links = NAV.map((n)=>{
      const active = n.id===page || n.children?.some((c)=>c.id===page);
      if (n.children){
        const sub = n.children.map((c)=>`<a href="${c.href}" class="${c.id===page?"is-active":""}">${c.label}</a>`).join("");
        return `<div class="nav-group"><a class="nav-link ${active?"is-active":""}" href="${n.href}">${n.label}</a><div class="nav-menu">${sub}</div></div>`;
      }
      return `<a class="nav-link ${active?"is-active":""}" href="${n.href}">${n.label}</a>`;
    }).join("");
    head.innerHTML = `<header class="site-header"><div class="wrap nav">
      <a class="brand" href="index.html"><span class="cube"></span>Voxel<b>box</b></a>
      <button class="nav-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
      <nav class="nav-links">${links}<a class="btn btn--primary nav-cta" href="${DISCORD}" target="_blank" rel="noopener noreferrer">Join Discord</a></nav>
    </div></header>`;
  }
  const foot = document.querySelector("[data-shell-footer]");
  if (foot){
    const cols = FOOT.map(([t,ls])=>`<div><h4>${t}</h4>${ls.map(([l,h,e])=>`<a href="${h}"${e?' target="_blank" rel="noopener noreferrer"':""}>${l}</a>`).join("")}</div>`).join("");
    foot.innerHTML = `<footer class="foot"><div class="wrap">
      <div class="foot-grid">
        <div class="foot-brand"><a class="brand" href="index.html"><span class="cube"></span>Voxel<b>box</b></a>
          <p>Free community game worlds and custom 3D prints — self-hosted, $0 to play, built by people who actually play.</p>
          <div class="pills"><span class="pill">Free Servers</span><span class="pill">Custom Prints</span><span class="pill">Discord-First</span></div></div>
        ${cols}
      </div>
      <div class="foot-bottom"><span>© <span data-year></span> Voxelbox — all worlds free, forever.</span><span>Built by the community, for the community.</span></div>
    </div></footer>`;
  }
}

function initNav(){
  const t=document.querySelector(".nav-toggle");
  if(t) t.addEventListener("click",()=>document.body.classList.toggle("nav-open"));
  document.querySelectorAll(".nav-links a, .hud-nav a").forEach((a)=>a.addEventListener("click",()=>document.body.classList.remove("nav-open")));
  document.querySelectorAll(".nav-group").forEach((g)=>{
    g.querySelector(".nav-link")?.addEventListener("click",(e)=>{ if(innerWidth<=900){ e.preventDefault(); g.classList.toggle("is-open"); }});
  });
}

function initReveal(){
  const items=document.querySelectorAll("[data-reveal]");
  if(!items.length) return;
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){ items.forEach((el)=>el.classList.add("vis")); return; }
  items.forEach((el)=>{ if(el.dataset.delay) el.style.setProperty("--d",el.dataset.delay); });
  const io=new IntersectionObserver((es)=>es.forEach((e)=>{ if(e.isIntersecting){ e.target.classList.add("vis"); io.unobserve(e.target);} }),{threshold:.12});
  items.forEach((el)=>io.observe(el));
}

function initServerStatus(){
  const grid=document.querySelector("[data-srv-grid]");
  const worlds=document.querySelector("[data-worlds-count]");
  if(!grid && !worlds) return;
  const paint=(data)=>{
    const servers=data.servers||[];
    let up=0;
    if(grid){
      grid.innerHTML=servers.map((s)=>{
        const on=s.status==="running";
        if(on) up++;
        const col=SRV_COLOR[s.slug]||"#8a86a6";
        const state=on?"online":(s.status==="offline"?"offline":"checking");
        const cls=on?"up is-up":(s.status==="offline"?"down is-down":"warn");
        return `<div class="srv ${on?"is-up":s.status==="offline"?"is-down":""}">
          <span class="srv-cube" style="background:${col}"></span>
          <div><div class="srv-name">${esc(s.name)}</div><div class="srv-state ${on?"up":s.status==="offline"?"down":"warn"}">${state}</div></div>
          <span class="pulse"></span></div>`;
      }).join("");
    } else { up=servers.filter((s)=>s.status==="running").length; }
    if(worlds) worlds.textContent=`${up}/${servers.length||7}`;
  };
  getJSON(STATUS_URL).then(paint).catch(()=>{ if(worlds) worlds.textContent="7/7"; });
  setInterval(()=>getJSON(STATUS_URL).then(paint).catch(()=>{}),30000);
}

function initNewsFeed(){
  const feed=document.querySelector("[data-bot]");
  if(!feed) return;
  const ico={up:"▲",down:"▼",warn:"!",info:"◆"};
  const render=(data)=>{
    const items=(data.items||[]).slice(0,14);
    if(!items.length){ feed.innerHTML=`<div class="bot-line"><span class="muted">voxelbot is watching the servers…</span></div>`; return; }
    feed.innerHTML=items.map((it)=>`<div class="bot-line">
      <span class="bot-ic ${esc(it.level||"info")}">${ico[it.level]||"◆"}</span>
      <span class="bot-txt">${esc(it.text)}</span>
      <span class="bot-time">${it.at?age(it.at):""}</span></div>`).join("");
  };
  getJSON(NEWS_URL).then(render).catch(()=>{ feed.innerHTML=`<div class="bot-line"><span class="muted">voxelbot offline — feed resumes shortly.</span></div>`; });
  setInterval(()=>getJSON(NEWS_URL).then(render).catch(()=>{}),30000);
}

function initFaq(){
  document.querySelectorAll(".faq-item").forEach((item,i)=>{
    const t=item.querySelector(".faq-q"); if(!t) return;
    if(i===0) item.classList.add("open");
    t.addEventListener("click",()=>item.classList.toggle("open"));
  });
}

const streamers=[
  {name:"Tyler Moose Live",channel:"tylermooselive",role:"Community Streamer"},
  {name:"Howe Randome",channel:"howe_randome",role:"Featured Creator"},
  {name:"qqvirtue",channel:"qqvirtue",role:"Rising Streamer"},
];
function initStreamers(){
  const grid=document.querySelector("[data-streamer-grid]"); if(!grid) return;
  const state=streamers.map((s)=>({...s,live:false,checked:false}));
  const render=()=>{
    const ord=[...state].sort((a,b)=>Number(b.live)-Number(a.live));
    grid.innerHTML=ord.map((s)=>{
      const badge=s.live?'<span class="srv-state up">● live now</span>':s.checked?'<span class="srv-state down">○ offline</span>':'<span class="srv-state warn">… checking</span>';
      return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="pill">@${s.channel}</span>${badge}</div>
        <h3>${s.name}</h3><p class="muted" style="margin:6px 0 12px">${s.role}</p>
        <a class="btn ${s.live?"btn--primary":"btn--ghost"}" href="https://twitch.tv/${s.channel}" target="_blank" rel="noopener noreferrer">${s.live?"Watch Live":"Visit Channel"}</a></div>`;
    }).join("");
  };
  render();
  state.forEach((s)=>{ const img=new Image(); img.referrerPolicy="no-referrer";
    img.onload=()=>{s.live=true;s.checked=true;render();}; img.onerror=()=>{s.checked=true;render();};
    img.src=`https://static-cdn.jtvnw.net/previews-ttv/live_user_${s.channel}-640x360.jpg?cb=${Date.now()}`; });
}

function formErr(code,err){
  if(code===429||err==="rate_limited") return "too many messages right now — try later or use Discord.";
  if(err==="missing_fields") return "please fill in the required fields.";
  if(err==="bad_email") return "that email doesn't look right.";
  if(err==="too_long") return "that's a bit long — trim it down.";
  return "couldn't send right now — reach us on Discord instead.";
}
function wireForm(sel,url,fields){
  const form=document.querySelector(sel); if(!form) return;
  const status=form.querySelector(".form-status");
  const btn=form.querySelector('button[type="submit"]');
  const val=(n)=>(form.querySelector(`[name="${n}"]`)?.value||"");
  form.addEventListener("submit",async(e)=>{
    e.preventDefault(); status.className="form-status pending"; status.textContent="sending…"; btn.disabled=true;
    const payload={}; fields.forEach((f)=>payload[f]=val(f)); payload.company=val("company");
    try{
      const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      let j={}; try{j=await r.json();}catch{}
      if(r.ok&&j.ok){ status.className="form-status ok"; status.textContent=form.dataset.ok||"sent — thanks!"; form.reset(); }
      else{ status.className="form-status err"; status.textContent=formErr(r.status,j.error); }
    }catch{ status.className="form-status err"; status.textContent="connection error — reach us on Discord instead."; }
    finally{ btn.disabled=false; }
  });
}
function initContactForm(){ wireForm("[data-contact-form]","/api/contact",["name","email","message"]); }
function initApplyForm(){ wireForm("[data-apply-form]","/api/apply",["name","email","role","age","experience","message"]); }

function initCookies(){
  if(localStorage.getItem("vb_cookie_consent")) return;
  const bar=document.createElement("div"); bar.className="cookie";
  bar.innerHTML=`<div class="cookie-in"><p>🍪 Voxelbox uses only essential cookies for basic site function — no ads, no third-party tracking. <a href="privacy.html">Privacy</a></p>
    <div class="cookie-actions"><button class="btn btn--primary" data-cookie="accept">Accept</button><button class="btn btn--ghost" data-cookie="decline">Decline</button></div></div>`;
  document.body.appendChild(bar);
  requestAnimationFrame(()=>bar.classList.add("show"));
  bar.addEventListener("click",(e)=>{ const c=e.target?.dataset?.cookie; if(!c) return;
    try{localStorage.setItem("vb_cookie_consent",c);}catch{} bar.classList.remove("show"); setTimeout(()=>bar.remove(),300); });
}
function setYear(){ document.querySelectorAll("[data-year]").forEach((n)=>n.textContent=new Date().getFullYear()); }
