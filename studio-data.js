/* =====================================================================
   VOXELBOX — studio-data.js
   Dynamic modules for the rebuilt studio (home.css) pages: live server
   status, portfolio feed, VoxelBot news, streamers, forms, FAQ.
   Each module is guarded by element presence, so this one file is safe
   to load on every page. Loads alongside home.js (chrome + reveals).
   ===================================================================== */
(function(){
  "use strict";
  const DISCORD = "https://discord.gg/mpeZ62uEEp";
  const STATUS_URL = "https://status.voxelbox.org/api/public/status";
  const NEWS_URL = "https://panel.voxelbox.org/vb-status/news.json";
  const PORTFOLIO_URL = "https://demos.voxelbox.org/portfolio.json";

  const GAME_SERVERS = [{"slug":"minecraft","name":"Minecraft","short":"Minecraft","href":"/minecraft-server","color":"#67d073","type":"survival / modded"},{"slug":"palworld","name":"Palworld","short":"Palworld","href":"/palworld-server","color":"#49b6ff","type":"co-op survival"},{"slug":"satisfactory","name":"Satisfactory","short":"Satisfactory","href":"/satisfactory-server","color":"#ffce4d","type":"factory co-op"},{"slug":"enshrouded","name":"Enshrouded","short":"Enshrouded","href":"/enshrouded-server","color":"#b47bff","type":"survival co-op"},{"slug":"american-truck-simulator","name":"American Truck Simulator","short":"American Truck Sim","href":"/american-truck-simulator-server","color":"#ff7d74","type":"convoy nights"},{"slug":"beammp","name":"BeamMP","short":"BeamMP","href":"/beammp-server","color":"#4fd6c0","type":"driving sessions"},{"slug":"fivem","name":"FiveM","short":"FiveM","href":"/fivem-server","color":"#ff9a4d","type":"gta v roleplay"},{"slug":"euro-truck-simulator-2","name":"Euro Truck Simulator 2","short":"Euro Truck Sim 2","href":"/euro-truck-simulator-2-server","color":"#ff6428","type":"convoy nights"},{"slug":"garrys-mod","name":"Garry's Mod","short":"Garry's Mod","href":"/garrys-mod-server","color":"#6ba7ff","type":"sandbox sessions"},{"slug":"left-4-dead-2","name":"Left 4 Dead 2","short":"Left 4 Dead 2","href":"/left-4-dead-2-server","color":"#9ad36a","type":"co-op campaigns"},{"slug":"no-more-room-in-hell","name":"No More Room in Hell","short":"No More Room in Hell","href":"/no-more-room-in-hell-server","color":"#c8665a","type":"co-op survival horror"},{"slug":"rust","name":"Rust","short":"Rust","href":"/rust-server","color":"#d48a45","type":"survival pvp"},{"slug":"sons-of-the-forest","name":"Sons of the Forest","short":"Sons of the Forest","href":"/sons-of-the-forest-server","color":"#78b46b","type":"survival co-op"},{"slug":"squad","name":"Squad","short":"Squad","href":"/squad-server","color":"#b7a56a","type":"tactical teamwork"},{"slug":"team-fortress-2","name":"Team Fortress 2","short":"Team Fortress 2","href":"/team-fortress-2-server","color":"#d65a4a","type":"arena nights"},{"slug":"terraria","name":"Terraria","short":"Terraria","href":"/terraria-server","color":"#65c97a","type":"adventure sandbox"},{"slug":"the-forest","name":"The Forest","short":"The Forest","href":"/the-forest-server","color":"#5aa568","type":"survival co-op"}];
  const SRV_COLOR = Object.fromEntries(GAME_SERVERS.map((s)=>[s.slug,s.color]));
  const SERVER_SLUGS = {};
  GAME_SERVERS.forEach((s)=>{ SERVER_SLUGS[s.name.toLowerCase()]=s.slug; SERVER_SLUGS[s.short.toLowerCase()]=s.slug; });

  const esc=(s)=>String(s).replace(/[&<>"']/g,(m)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const age=(iso)=>{ const s=Math.max(0,(Date.now()-new Date(iso).getTime())/1000); if(s<60)return Math.floor(s)+"s"; if(s<3600)return Math.floor(s/60)+"m"; if(s<86400)return Math.floor(s/3600)+"h"; return Math.floor(s/86400)+"d"; };
  async function getJSON(u){ const r=await fetch(u,{cache:"no-store"}); if(!r.ok) throw new Error(r.status); return r.json(); }
  const gameSlug=(name)=>SERVER_SLUGS[String(name||"").toLowerCase()] || String(name||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const playerText=(n)=>n==null ? "players unavailable" : `${n} player${n===1?"":"s"}`;
  function normalizeStatusPayload(data){
    if(data&&data.games&&data.games.servers){
      const servers=data.games.servers.map((s)=>({ slug:gameSlug(s.name), name:s.name, status:s.online?"running":"offline", players:s.players }));
      return { servers, up:(data.games.online!=null?data.games.online:servers.filter((s)=>s.status==="running").length), total:(data.games.total!=null?data.games.total:servers.length), players:data.games.players };
    }
    const servers=((data&&data.servers)||[]).map((s)=>({ slug:s.slug, name:s.name, status:s.status, players:s.players }));
    return { servers, up:((data&&data.up)!=null?data.up:servers.filter((s)=>s.status==="running").length), total:((data&&data.total)!=null?data.total:servers.length), players:servers.reduce((a,s)=>a+(Number.isFinite(s.players)?s.players:0),0) };
  }

  /* ---------- live server status ---------- */
  function initServerStatus(){
    const grid=document.querySelector("[data-srv-grid]");
    const worlds=document.querySelectorAll("[data-worlds-count]");
    const totalPlayers=document.querySelectorAll("[data-players-count]");
    if(!grid && !worlds.length && !totalPlayers.length && !document.querySelector("[data-server-status]")) return;
    const applyLive=(data)=>{
      const live=normalizeStatusPayload(data);
      const hasData = live.total>0 && live.servers.some((s)=>s.status==="running"||s.status==="offline");
      const ordered=GAME_SERVERS.map((cfg)=>live.servers.find((s)=>s.slug===cfg.slug) || {slug:cfg.slug,name:cfg.name,status:"unknown",players:null});
      if(grid){
        grid.innerHTML=ordered.map((s)=>{
          const cfg=GAME_SERVERS.find((g)=>g.slug===s.slug) || s;
          const on=s.status==="running", offline=s.status==="offline";
          const col=cfg.color || SRV_COLOR[s.slug] || "#8a86a6";
          const state=on?"online":(offline?"offline":"checking");
          return `<a class="srv" href="${esc(cfg.href||"/servers")}">
            <span class="srv-cube" style="background:${col}"></span>
            <div class="srv-meta"><div class="srv-name">${esc(cfg.name||s.name)}</div><div class="srv-state ${on?"up":offline?"down":"warn"}">${state} · ${playerText(s.players)}</div></div>
            <span class="pulse ${on?"is-up":offline?"is-down":""}"></span></a>`;
        }).join("");
      }
      if(hasData){ worlds.forEach((el)=>{ el.textContent=`${live.up}/${live.total || ordered.length}`; }); }
      if(hasData){ totalPlayers.forEach((el)=>{ el.textContent=Number.isFinite(live.players) ? live.players : ordered.reduce((a,s)=>a+(Number.isFinite(s.players)?s.players:0),0); }); }
      ordered.forEach((s)=>{
        const on=s.status==="running", offline=s.status==="offline";
        document.querySelectorAll(`[data-server-status="${s.slug}"]`).forEach((el)=>{
          el.textContent=on?"online":(offline?"offline":"checking");
          el.classList.toggle("up",on); el.classList.toggle("down",offline); el.classList.toggle("warn",!on&&!offline);
        });
        document.querySelectorAll(`[data-server-players="${s.slug}"]`).forEach((el)=>{ el.textContent=playerText(s.players); });
      });
    };
    getJSON(STATUS_URL).then(applyLive).catch(()=>{ worlds.forEach((el)=>el.textContent="17/17"); });
    setInterval(()=>getJSON(STATUS_URL).then(applyLive).catch(()=>{}),30000);
  }

  /* ---------- portfolio feed ---------- */
  function initPortfolio(){
    const grid=document.querySelector("[data-portfolio-grid]");
    if(!grid) return;
    getJSON(PORTFOLIO_URL).then((d)=>{
      const sites=(d.sites||[]).slice().sort((a,b)=>String(b.updated||"").localeCompare(String(a.updated||"")));
      const cnt=document.querySelector("[data-portfolio-count]"); if(cnt) cnt.textContent=sites.length;
      if(!sites.length){ grid.innerHTML=`<div class="card"><h3>Coming soon</h3><p class="muted">The first demos are being built — check back shortly.</p></div>`; return; }
      grid.innerHTML=sites.map((s,i)=>`
        <a class="card holo" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" style="--f:${(i%4)*0.5}s;display:block">
          <span class="tag" style="margin-bottom:12px;display:inline-block">${esc(s.kind||"site")}</span>
          <h3>${esc(s.title||s.slug)}</h3>
          <p class="muted" style="margin-top:8px">${esc(s.description||"")}</p>
          ${(s.tags&&s.tags.length)?`<div class="holo-tags" style="margin-top:14px">${s.tags.map((t)=>`<span class="tag">${esc(t)}</span>`).join("")}</div>`:""}
          <div class="btn btn--ghost" style="margin-top:16px">Open live site →</div>
        </a>`).join("");
    }).catch(()=>{ grid.innerHTML=`<div class="card"><h3>Portfolio unavailable</h3><p class="muted">Couldn't reach the live feed right now — please try again in a moment.</p></div>`; });
  }

  /* ---------- VoxelBot news feed ---------- */
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

  /* ---------- streamers ---------- */
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
        return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="tag">@${esc(s.channel)}</span>${badge}</div>
          <h3>${esc(s.name)}</h3><p class="muted" style="margin:6px 0 14px">${esc(s.role)}</p>
          <a class="btn ${s.live?"btn--primary":"btn--ghost"}" href="https://twitch.tv/${esc(s.channel)}" target="_blank" rel="noopener noreferrer">${s.live?"Watch Live":"Visit Channel"}</a></div>`;
      }).join("");
    };
    render();
    state.forEach((s)=>{ const img=new Image(); img.referrerPolicy="no-referrer";
      img.onload=()=>{s.live=true;s.checked=true;render();}; img.onerror=()=>{s.checked=true;render();};
      img.src=`https://static-cdn.jtvnw.net/previews-ttv/live_user_${s.channel}-640x360.jpg?cb=${Date.now()}`; });
  }

  /* ---------- forms ---------- */
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

  /* ---------- FAQ accordions ---------- */
  function initFaq(){
    document.querySelectorAll(".faq-item").forEach((item,i)=>{
      const t=item.querySelector(".faq-q"); if(!t) return;
      if(i===0) item.classList.add("open");
      t.addEventListener("click",()=>item.classList.toggle("open"));
    });
  }

  function run(){
    initServerStatus(); initPortfolio(); initNewsFeed(); initStreamers();
    wireForm("[data-contact-form]","https://demos.voxelbox.org/api/lead",["name","email","message"]);
    wireForm("[data-apply-form]","https://demos.voxelbox.org/api/lead",["name","email","role","age","experience","message"]);
    initFaq();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",run); else run();
})();
