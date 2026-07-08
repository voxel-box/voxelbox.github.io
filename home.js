/* =====================================================================
   VOXELBOX — HOME / "The System Assembles"
   ES module. Hero: instanced-cube monolith that assembles itself in
   real time (three.js, vendored locally). Everything else: lightweight
   scroll choreography, tilt/glow micro-interactions, pipeline flow.

   Tuning knobs are grouped in CONFIG below — adjust freely.
   ===================================================================== */

const CONFIG = {
  bootOncePerSession: true,   // set false to see the boot sequence every load
  heroDprCap: 1.75,           // rendering resolution cap
  shellKeep: .58,             // density of the monolith's outer shell (0..1)
  midKeep: .34,               // density of the middle layer
  particleCount: innerWidth < 700 ? 160 : 340,
  orbiters: 22,               // loose cubes circling the structure
  assembleDur: 1.6,           // seconds per block flight
  breakawayEvery: 3.4,        // seconds between "a block detaches" events
};

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $  = (s,r)=>(r||document).querySelector(s);
const $$ = (s,r)=>Array.from((r||document).querySelectorAll(s));

/* =====================================================================
   BOOT SEQUENCE
   ===================================================================== */
function boot(){
  if(REDUCED) return;
  if(CONFIG.bootOncePerSession && sessionStorage.getItem("vb_boot")) return;
  try{ sessionStorage.setItem("vb_boot","1"); }catch{}
  const el=document.createElement("div");
  el.className="boot"; el.setAttribute("aria-hidden","true");
  el.innerHTML=`<div class="boot-in">
    <div class="boot-cubes">${"<i></i>".repeat(9)}</div>
    <div class="boot-line">voxelbox <b>//</b> system online</div>
  </div>`;
  document.body.appendChild(el);
  setTimeout(()=>el.classList.add("done"), 1050);
  setTimeout(()=>el.remove(), 1700);
}

/* =====================================================================
   HERO — the monolith
   ===================================================================== */
async function initHero(){
  const stage=$("[data-hero-stage]");
  const hero=$("[data-hero]");
  if(!stage||!hero) return;
  // debug/perf escape hatch: ?nofx renders the CSS-only hero
  if(new URLSearchParams(location.search).has("nofx")){ hero.classList.add("hero--flat"); return; }
  let THREE;
  try{ THREE = await import("./vendor/three.module.js"); }
  catch{ hero.classList.add("hero--flat"); return; }

  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
  }catch{ hero.classList.add("hero--flat"); return; }

  renderer.setPixelRatio(Math.min(devicePixelRatio||1, CONFIG.heroDprCap));
  stage.appendChild(renderer.domElement);

  const scene=new THREE.Scene();
  scene.fog=new THREE.Fog(0x07080b, 26, 60);
  const camera=new THREE.PerspectiveCamera(45, 1, .1, 120);
  camera.position.set(0, 2, 24);

  /* lights: cool wash + hot orange heart + violet whisper */
  scene.add(new THREE.AmbientLight(0x8899bb, .5));
  const sun=new THREE.DirectionalLight(0xdfe8ff, 1.6); sun.position.set(7,11,8); scene.add(sun);
  const violet=new THREE.PointLight(0x8b5cf6, 40, 34, 1.9); violet.position.set(-9,4,7); scene.add(violet);

  /* fading grid floor */
  const grid=new THREE.GridHelper(72, 48, 0x3a4150, 0x191e28);
  grid.position.y=-6.4;
  grid.material.transparent=true; grid.material.opacity=.32;
  scene.add(grid);

  const rig=new THREE.Group(); rig.position.y=1.4; scene.add(rig);
  /* the molten heart travels with the structure */
  const heart=new THREE.PointLight(0xff7a1a, 140, 30, 1.8); heart.position.set(0,.2,0); rig.add(heart);

  /* ----- design the structure: hollow cube lattice + molten core -----
     Blocks are laid out on a 7×7×7 lattice; the shell has deliberate
     gaps so the system reads as forever-assembling. */
  const SP=1.16, rnd=(a,b)=>a+Math.random()*(b-a);
  const shellPts=[], corePts=[];
  for(let x=-3;x<=3;x++) for(let y=-3;y<=3;y++) for(let z=-3;z<=3;z++){
    const m=Math.max(Math.abs(x),Math.abs(y),Math.abs(z));
    if(m===3){ if(Math.random()<CONFIG.shellKeep) shellPts.push([x*SP,y*SP,z*SP]); }
    else if(m===2){ if(Math.random()<CONFIG.midKeep) shellPts.push([x*SP,y*SP,z*SP]); }
    else corePts.push([x*SP,y*SP,z*SP]);
  }

  const box=new THREE.BoxGeometry(1,1,1);
  const graphite=new THREE.MeshLambertMaterial({color:0xffffff});
  const shell=new THREE.InstancedMesh(box, graphite, shellPts.length+CONFIG.orbiters);
  const core=new THREE.InstancedMesh(box, new THREE.MeshBasicMaterial({color:0xff7a1a}), corePts.length);
  rig.add(shell, core);

  /* per-instance colors: graphite, with rare blue/violet circuits */
  const cGraph=new THREE.Color(0x272d38), cGraph2=new THREE.Color(0x333b49),
        cBlue=new THREE.Color(0x2c3d63), cViolet=new THREE.Color(0x40325e),
        cCoreA=new THREE.Color(0xff7a1a), cCoreB=new THREE.Color(0xffa14d);
  shellPts.forEach((_,i)=>{
    const r=Math.random();
    shell.setColorAt(i, r<.06?cBlue : r<.1?cViolet : r<.5?cGraph : cGraph2);
  });
  for(let i=0;i<CONFIG.orbiters;i++) shell.setColorAt(shellPts.length+i, Math.random()<.5?cCoreA:cGraph2);
  corePts.forEach((_,i)=>core.setColorAt(i, Math.random()<.6?cCoreA:cCoreB));

  /* flight plans: every block starts scattered in space, flies home */
  const dummy=new THREE.Object3D();
  const plan=(pts,delayBase)=>pts.map(([x,y,z],i)=>{
    const th=rnd(0,Math.PI*2), ph=rnd(-1,1), r=rnd(15,26);
    return { t:[x,y,z],
      s:[Math.cos(th)*r, ph*10+rnd(-3,3), Math.sin(th)*r],
      d:delayBase + Math.hypot(x,y,z)*.16 + Math.random()*.5,
      bobA:rnd(.02,.06), bobS:rnd(.5,1.1), bobP:rnd(0,6.28) };
  });
  const shellPlan=plan(shellPts, .9), corePlan=plan(corePts, .15);

  /* orbiters ride two tilted rings */
  const orbs=Array.from({length:CONFIG.orbiters},(_,i)=>({
    r:rnd(6.5,9.5), sp:rnd(.12,.3)*(Math.random()<.5?1:-1),
    ph:rnd(0,6.28), tilt:i%2?.5:-.35, y:rnd(-2,3), s:rnd(.28,.5) }));

  /* additive glow sprite at the heart */
  {
    const cv=document.createElement("canvas"); cv.width=cv.height=128;
    const g=cv.getContext("2d"), gr=g.createRadialGradient(64,64,0,64,64,64);
    gr.addColorStop(0,"rgba(255,140,50,.55)"); gr.addColorStop(.5,"rgba(255,110,20,.16)"); gr.addColorStop(1,"rgba(255,110,20,0)");
    g.fillStyle=gr; g.fillRect(0,0,128,128);
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({
      map:new THREE.CanvasTexture(cv), blending:THREE.AdditiveBlending, depthWrite:false, transparent:true}));
    spr.scale.setScalar(11); rig.add(spr);
  }

  /* particle field: embers + cool dust */
  function cloud(n, color, size, spread){
    const pos=new Float32Array(n*3);
    for(let i=0;i<n;i++){ pos[i*3]=rnd(-spread,spread); pos[i*3+1]=rnd(-8,14); pos[i*3+2]=rnd(-spread*.6,spread*.6); }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos,3));
    const pts=new THREE.Points(geo, new THREE.PointsMaterial({
      color, size, transparent:true, opacity:.55, blending:THREE.AdditiveBlending, depthWrite:false}));
    scene.add(pts); return pts;
  }
  const embers=cloud(Math.round(CONFIG.particleCount*.4), 0xff8a33, .16, 22);
  const dust  =cloud(Math.round(CONFIG.particleCount*.6), 0x5b7cff, .1, 30);

  /* ----- state ----- */
  const ease=(k)=>1-Math.pow(1-Math.min(1,Math.max(0,k)),3);
  let t=0,last=0,run=true,inView=true,mx=0,my=0,scr=0;
  let breakaway=null, nextBreak=CONFIG.breakawayEvery+3;

  addEventListener("pointermove",(e)=>{
    if(e.pointerType==="touch") return;
    mx=e.clientX/innerWidth-.5; my=e.clientY/innerHeight-.5;
  },{passive:true});
  addEventListener("scroll",()=>{ scr=scrollY||0; },{passive:true});
  document.addEventListener("visibilitychange",()=>{ run=!document.hidden; });
  new IntersectionObserver((es)=>es.forEach((e)=>{ inView=e.isIntersecting; }),{threshold:.02}).observe(hero);

  function resize(){
    const r=stage.getBoundingClientRect();
    if(!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect=r.width/r.height; camera.updateProjectionMatrix();
    // anchor the monolith right of the headline on wide screens
    rig.position.x = r.width>900 ? 5 : 0;
  }
  resize();
  addEventListener("resize", resize, {passive:true});
  addEventListener("load", resize, {passive:true});          // late stylesheet safety
  if("ResizeObserver" in window) new ResizeObserver(resize).observe(stage);

  function pose(mesh, plans, offset, tt){
    plans.forEach((p,i)=>{
      const k=ease((tt-p.d)/CONFIG.assembleDur);
      let x=p.s[0]+(p.t[0]-p.s[0])*k,
          y=p.s[1]+(p.t[1]-p.s[1])*k,
          z=p.s[2]+(p.t[2]-p.s[2])*k;
      if(k>=1) y+=Math.sin(tt*p.bobS+p.bobP)*p.bobA;          // settled: gentle bob
      if(breakaway && breakaway.mesh===mesh && breakaway.i===i){ // one block drifts out & re-docks
        const bk=Math.sin(Math.min(1,(tt-breakaway.at)/2.6)*Math.PI);
        x+=breakaway.dir[0]*bk*2.6; y+=breakaway.dir[1]*bk*2.6; z+=breakaway.dir[2]*bk*2.6;
      }
      dummy.position.set(x,y,z);
      dummy.rotation.set(0,(1-k)*rndRot[i%rndRot.length],0);   // spin flattens as it docks
      dummy.updateMatrix();
      mesh.setMatrixAt(offset+i, dummy.matrix);
    });
  }
  const rndRot=Array.from({length:32},()=>Math.random()*6);

  function frame(now){
    requestAnimationFrame(frame);
    if(!run||!inView) return;
    if(now-last<1000/60) return;
    const dt=Math.min(.05,(now-last)/1000)||.016; last=now; t+=dt;

    // choreograph: assembly clocks
    pose(core, corePlan, 0, t);
    pose(shell, shellPlan, 0, t);

    // orbiters
    orbs.forEach((o,i)=>{
      const a=t*o.sp+o.ph;
      dummy.position.set(Math.cos(a)*o.r, o.y+Math.sin(a*.9)*1.2+Math.sin(a)*o.r*o.tilt*.3, Math.sin(a)*o.r);
      dummy.rotation.set(a*.7,a,.0);
      dummy.scale.setScalar(o.s);
      dummy.updateMatrix();
      shell.setMatrixAt(shellPts.length+i, dummy.matrix);
      dummy.scale.setScalar(1);
    });
    shell.instanceMatrix.needsUpdate=true;
    core.instanceMatrix.needsUpdate=true;

    // a living system: blocks occasionally detach and re-dock
    if(t>nextBreak){
      const useShell=Math.random()<.8, n=useShell?shellPlan.length:corePlan.length;
      const dir=[rnd(-1,1),rnd(.2,1),rnd(-1,1)];
      const len=Math.hypot(...dir)||1;
      breakaway={mesh:useShell?shell:core, i:Math.floor(Math.random()*n), at:t, dir:dir.map(v=>v/len)};
      nextBreak=t+CONFIG.breakawayEvery+Math.random()*2;
    }
    if(breakaway && t-breakaway.at>2.7) breakaway=null;

    // heart pulse
    heart.intensity=140+Math.sin(t*2.2)*36;

    // camera: mouse parallax + scroll orbit
    rig.rotation.y=t*.07+scr*.0006;
    rig.rotation.x=Math.sin(t*.12)*.02;
    camera.position.x+=((mx*3)-camera.position.x)*.045;
    camera.position.y+=((2-my*1.6)-camera.position.y)*.045;
    camera.lookAt(0,1.4,0);

    // particles drift
    embers.rotation.y=t*.014; dust.rotation.y=-t*.008;
    dust.position.y=Math.sin(t*.2)*.6;

    renderer.render(scene,camera);
  }

  if(REDUCED){
    // land fully assembled, render one still frame
    pose(core,corePlan,0,999); pose(shell,shellPlan,0,999);
    orbs.forEach((o,i)=>{ const a=o.ph;
      dummy.position.set(Math.cos(a)*o.r,o.y,Math.sin(a)*o.r);
      dummy.rotation.set(0,0,0); dummy.scale.setScalar(o.s); dummy.updateMatrix();
      shell.setMatrixAt(shellPts.length+i,dummy.matrix); dummy.scale.setScalar(1); });
    shell.instanceMatrix.needsUpdate=core.instanceMatrix.needsUpdate=true;
    rig.rotation.y=.6;
    renderer.render(scene,camera);
    return;
  }
  requestAnimationFrame(frame);
}

/* =====================================================================
   SCROLL CHOREOGRAPHY
   ===================================================================== */
function initReveal(){
  const items=$$("[data-reveal]");
  const pipe=$("[data-pipe]");
  if(REDUCED){ items.forEach((el)=>el.classList.add("vis")); if(pipe) pipe.classList.add("flow"); return; }

  items.forEach((el)=>{ if(el.dataset.delay) el.style.setProperty("--d",el.dataset.delay); });
  const io=new IntersectionObserver((es)=>es.forEach((e)=>{
    if(e.isIntersecting){ e.target.classList.add("vis"); io.unobserve(e.target); }
  }),{threshold:.14,rootMargin:"0px 0px -6% 0px"});
  items.forEach((el)=>io.observe(el));
  if(pipe){
    new IntersectionObserver((es,pio)=>es.forEach((e)=>{
      if(e.isIntersecting){ pipe.classList.add("flow"); pio.unobserve(pipe); }
    }),{threshold:.35}).observe(pipe);
  }

  /* safety net: if IO misses (anchor jumps, odd browsers), a cheap
     scroll check reveals anything at or above the viewport */
  let tick=0;
  const sweep=()=>{ tick=0;
    const vh=innerHeight;
    items.forEach((el)=>{
      if(el.classList.contains("vis")) return;
      if(el.getBoundingClientRect().top < vh*.92) el.classList.add("vis");
    });
    if(pipe && !pipe.classList.contains("flow") && pipe.getBoundingClientRect().top < vh*.8)
      pipe.classList.add("flow");
  };
  addEventListener("scroll",()=>{ if(!tick) tick=setTimeout(sweep,120); },{passive:true});
  setTimeout(sweep, 700);
}

/* =====================================================================
   MICRO-INTERACTIONS — tilt + cursor glow
   ===================================================================== */
function initTilt(){
  if(REDUCED) return;
  $$(".mod").forEach((card)=>{
    let raf=0;
    card.addEventListener("pointermove",(e)=>{
      if(e.pointerType==="touch") return;
      const r=card.getBoundingClientRect();
      const px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
      if(!raf) raf=requestAnimationFrame(()=>{ raf=0;
        card.style.setProperty("--mx",(px*100)+"%");
        card.style.setProperty("--my",(py*100)+"%");
        card.style.setProperty("--ry",((px-.5)*7)+"deg");
        card.style.setProperty("--rx",((.5-py)*7)+"deg");
      });
    },{passive:true});
    card.addEventListener("pointerleave",()=>{
      card.style.setProperty("--rx","0deg"); card.style.setProperty("--ry","0deg");
    });
  });
}

/* =====================================================================
   FINAL CTA — drifting voxel motes
   ===================================================================== */
function initMotes(){
  if(REDUCED) return;
  const bg=$("[data-final-bg]"); if(!bg) return;
  for(let i=0;i<9;i++){
    const m=document.createElement("i");
    m.className="mote";
    m.style.left=(6+Math.random()*88)+"%";
    m.style.bottom=(Math.random()*30)+"%";
    m.style.setProperty("--md",(Math.random()*9)+"s");
    m.style.animationDuration=(7+Math.random()*6)+"s";
    m.style.opacity=String(.12+Math.random()*.2);
    bg.appendChild(m);
  }
}

/* =====================================================================
   SHELL — header, nav, cookie, year
   ===================================================================== */
function initShell(){
  const top=$("[data-top]");
  if(top){
    const onScroll=()=>top.classList.toggle("solid",(scrollY||0)>30);
    addEventListener("scroll",onScroll,{passive:true}); onScroll();
  }
  const tog=$(".nav-toggle");
  if(tog) tog.addEventListener("click",()=>document.body.classList.toggle("nav-open"));
  $$(".top-nav a").forEach((a)=>a.addEventListener("click",()=>document.body.classList.remove("nav-open")));
  $$("[data-year]").forEach((n)=>n.textContent=new Date().getFullYear());
  if(!localStorage.getItem("vb_cookie_consent")){
    const bar=document.createElement("div"); bar.className="cookie";
    bar.innerHTML=`<div class="cookie-in"><p>🍪 Voxelbox uses only essential cookies for basic site function — no ads, no third-party tracking. <a href="privacy.html">Privacy</a></p>
      <div class="cookie-actions"><button class="btn btn--primary" data-cookie="accept">Accept</button><button class="btn btn--ghost" data-cookie="decline">Decline</button></div></div>`;
    document.body.appendChild(bar);
    requestAnimationFrame(()=>bar.classList.add("show"));
    bar.addEventListener("click",(e)=>{ const c=e.target?.dataset?.cookie; if(!c) return;
      try{localStorage.setItem("vb_cookie_consent",c);}catch{} bar.classList.remove("show"); setTimeout(()=>bar.remove(),300); });
  }
}

/* ----- go ----- */
boot();
initShell();
initReveal();
initTilt();
initMotes();
initHero();
