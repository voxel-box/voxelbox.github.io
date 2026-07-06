/* VOXELBOX — the homepage IS the world.
   One continuous obsidian realm; scrolling flies the camera along a path
   through five stations (arrival → worlds → bot → forge → join).
   Content panels fade in at each station. No stacked page sections.
   Camera update runs synchronously in the scroll handler (works even when
   rAF is throttled); an ambient rAF loop adds life when the tab is visible. */
import * as THREE from "./vendor/three.module.js";

const mount = document.querySelector("[data-voxel-scene]");
if (mount) boot(mount);

function boot(mount){
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:"high-performance" }); }
  catch(e){ document.body.classList.add("no-webgl"); return; }
  const fb = mount.querySelector(".scene-fallback"); if(fb) fb.style.display="none";
  const labelBox = mount.querySelector("[data-labels]");

  const W = ()=>innerWidth, H = ()=>innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(W(),H());
  mount.insertBefore(renderer.domElement, mount.firstChild);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x07080c, 26, 100);

  const cam = new THREE.PerspectiveCamera(42, W()/H(), 0.1, 300);

  // --- lighting: cold rim from behind, faint warm fill ---
  scene.add(new THREE.HemisphereLight(0x2a3550, 0x05060a, 0.55));
  const rim = new THREE.DirectionalLight(0xbcd4ff, 2.1); rim.position.set(-10, 16, -14); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0x7fb2ff, 1.1); rim2.position.set(14, 10, -8); scene.add(rim2);
  const fill = new THREE.DirectionalLight(0xff9a63, 0.3); fill.position.set(6, 4, 18); scene.add(fill);

  const box = new THREE.BoxGeometry(1,1,1);
  const obsidian = new THREE.MeshStandardMaterial({ color:0x0e1017, roughness:.42, metalness:.55, flatShading:true });
  const world = new THREE.Group(); scene.add(world);

  function monolith(cx, cz, height, baseR, taper){
    const g = new THREE.Group();
    for(let y=0;y<height;y++){
      const t = y/Math.max(1,height-1);
      const r = Math.max(1, Math.round(baseR - t*taper));
      const m = new THREE.Mesh(box, obsidian);
      m.scale.set(r*2 - (y%3?0:0.4), 1, r*1.6);
      m.position.set(cx, y + 0.5, cz);
      m.rotation.y = y*0.06;
      g.add(m);
    }
    world.add(g); return g;
  }
  function edgeGlow(w,h,d, x,y,z, color, op=.65){
    const e = new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,d));
    const l = new THREE.LineSegments(e, new THREE.LineBasicMaterial({ color, transparent:true, opacity:op }));
    l.position.set(x,y,z); world.add(l); return l;
  }
  function beam(x,y,z,color,ht,thick=.32){
    const m = new THREE.Mesh(new THREE.BoxGeometry(thick,ht,thick), new THREE.MeshBasicMaterial({color, transparent:true, opacity:.85}));
    m.position.set(x,y,z); world.add(m); return m;
  }

  // ============ THE CORE ============
  monolith(0, 0, 13, 3, 5);
  edgeGlow(6.6, 13, 5.4, 0, 6.5, 0, 0x9ec6ff);
  const coreBeam = beam(0, 15.5, 0, 0xcfe0ff, 5);
  const capstone = new THREE.Mesh(new THREE.OctahedronGeometry(1.15,0), new THREE.MeshBasicMaterial({color:0xa9c9ff}));
  capstone.position.set(0,18.4,0); world.add(capstone);
  const CORE_HUB = new THREE.Vector3(0, 8.5, 0);

  // ============ 7 SERVER SHARDS (ring around the core) ============
  const SERVERS = [
    ["minecraft","Minecraft",0x8fd6a0,"minecraft-server.html"],
    ["palworld","Palworld",0x7fb2ff,"palworld-server.html"],
    ["satisfactory","Satisfactory",0xffcf6b,"satisfactory-server.html"],
    ["enshrouded","Enshrouded",0xb99bff,"enshrouded-server.html"],
    ["american-truck-simulator","American Truck Sim",0xff9a70,"american-truck-simulator-server.html"],
    ["beammp","BeamMP",0x6fe0d0,"beammp-server.html"],
    ["fivem","FiveM",0xffab5e,"fivem-server.html"],
  ];
  const shards = [];
  SERVERS.forEach(([slug,name,color,href],i)=>{
    const a = Math.PI*2 * (i/SERVERS.length) + Math.PI/7;
    const rad = 14 + (i%2)*2.6;
    const cx = Math.cos(a)*rad, cz = Math.sin(a)*rad;
    const ht = 5 + (i%3)*2;
    const g = monolith(cx, cz, ht, 1, 0.4);
    const be = beam(cx, ht + 2, cz, color, 3);
    const ed = edgeGlow(2.2, ht, 1.8, cx, ht/2, cz, color);
    const top = new THREE.Vector3(cx, ht + 1.2, cz);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([CORE_HUB.clone(), top.clone()]),
      new THREE.LineBasicMaterial({ color, transparent:true, opacity:.15 }));
    world.add(line);
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(.16,8,8), new THREE.MeshBasicMaterial({color}));
    world.add(pulse);
    shards.push({ slug, name, color, href, group:g, beam:be, edge:ed, line, pulse,
      from:CORE_HUB.clone(), to:top, phase:i/SERVERS.length, online:true,
      anchor:new THREE.Vector3(cx, ht + 3.2, cz) });
  });

  // ============ THE PRINT FORGE (warm structure, own station) ============
  const FORGE = { x:26, z:8 };
  monolith(FORGE.x, FORGE.z, 6, 2, 1);
  edgeGlow(5, 6, 4, FORGE.x, 3, FORGE.z, 0xff9a63, .55);
  const forgeBeam = beam(FORGE.x, 8.4, FORGE.z, 0xffb98a, 3, .4);
  // printed objects rising off the forge
  const printed = [];
  for(let i=0;i<5;i++){
    const c = new THREE.Mesh(box, new THREE.MeshStandardMaterial({ color:0xff9a63, roughness:.5, metalness:.2, emissive:0x743d1e }));
    c.scale.setScalar(.55 + Math.random()*.3);
    c.position.set(FORGE.x + (Math.random()-.5)*4, 7+i*1.8, FORGE.z + (Math.random()-.5)*4);
    world.add(c); printed.push({ m:c, ph:Math.random()*Math.PI*2 });
  }

  // ============ floor grid + dust ============
  const grid = new THREE.GridHelper(140, 46, 0x2b3550, 0x141a28);
  grid.material.transparent = true; grid.material.opacity = .26; grid.position.y = 0.02; world.add(grid);
  const P = 160, pgeo = new THREE.BufferGeometry();
  const pos = new Float32Array(P*3), spd = new Float32Array(P);
  for(let i=0;i<P;i++){ pos[i*3]=(Math.random()-.5)*90; pos[i*3+1]=Math.random()*36; pos[i*3+2]=(Math.random()-.5)*90; spd[i]=0.004+Math.random()*0.012; }
  pgeo.setAttribute("position", new THREE.BufferAttribute(pos,3));
  const dust = new THREE.Points(pgeo, new THREE.PointsMaterial({ color:0x9ec6ff, size:.12, transparent:true, opacity:.5, depthWrite:false }));
  world.add(dust);
  world.position.y = -1;

  // ============ clickable labels ============
  const labels = shards.map((sh)=>{
    const el = document.createElement("a");
    el.className = "world-label"; el.href = sh.href;
    el.innerHTML = `<span class="ld"></span>${sh.name}`;
    if(labelBox) labelBox.appendChild(el);
    return { el, sh };
  });
  // forge label
  const forgeLabel = document.createElement("a");
  forgeLabel.className = "world-label world-label--forge"; forgeLabel.href = "3d-prints.html";
  forgeLabel.innerHTML = `<span class="ld" style="background:#ff9a63;box-shadow:0 0 9px #ff9a63"></span>Print Forge`;
  if(labelBox) labelBox.appendChild(forgeLabel);
  const FORGE_ANCHOR = new THREE.Vector3(FORGE.x, 10.4, FORGE.z);

  const proj = new THREE.Vector3();
  function placeLabel(el, anchor){
    world.localToWorld(proj.copy(anchor));
    proj.project(cam);
    const x=(proj.x*0.5+0.5)*W(), y=(-proj.y*0.5+0.5)*H();
    if(proj.z<1 && x>-70 && x<W()+70 && y>-30 && y<H()+30){ el.style.display=""; el.style.left=x+"px"; el.style.top=y+"px"; }
    else el.style.display="none";
  }
  function placeLabels(){
    if(!labelBox) return;
    labels.forEach(({el,sh})=>placeLabel(el, sh.anchor));
    placeLabel(forgeLabel, FORGE_ANCHOR);
  }

  // ============ live status -> dim offline shards ============
  fetch("https://panel.voxelbox.org/vb-status/status.json",{cache:"no-store"})
    .then(r=>r.ok?r.json():null).then(d=>{ if(!d) return;
      const map={}; (d.servers||[]).forEach(s=>map[s.slug]=s.status);
      shards.forEach((sh)=>{ const st=map[sh.slug];
        if(st && st!=="running"){
          sh.online=false;
          sh.beam.material.color.setHex(0x39415a); sh.beam.material.opacity=.4;
          sh.edge.material.color.setHex(0x39415a); sh.edge.material.opacity=.3;
          sh.line.material.opacity=.05; sh.pulse.visible=false;
          const L=labels.find(l=>l.sh===sh); if(L) L.el.classList.add("off");
        }
      });
    }).catch(()=>{});

  // ============ THE FLIGHT PATH (scroll-driven camera) ============
  const KEYS = [
    { p:0.00, pos:[0,10,38],   look:[0,7.5,0] },   // arrival — face the core
    { p:0.16, pos:[20,7,26],   look:[8,5,4] },     // bank right toward the ring
    { p:0.30, pos:[24,6,-6],   look:[6,5,-6] },    // fly along the shards
    { p:0.42, pos:[6,7,-24],   look:[-6,5,-8] },   // behind the realm
    { p:0.54, pos:[-12,11,-8], look:[0,9,0] },     // close on the core beam (bot)
    { p:0.66, pos:[-6,7,18],   look:[12,4,10] },   // turn toward the forge
    { p:0.78, pos:[18,5,20],   look:[26,4,8] },    // arrive at the forge
    { p:0.90, pos:[14,18,34],  look:[0,7,0] },     // pull up and back
    { p:1.00, pos:[0,30,52],   look:[0,5,0] },     // overview — join
  ];
  const CHAPTERS = [
    { id:0, a:0.00, b:0.13 },
    { id:1, a:0.17, b:0.44 },
    { id:2, a:0.48, b:0.62 },
    { id:3, a:0.66, b:0.82 },
    { id:4, a:0.88, b:1.01 },
  ];
  const panels = [...document.querySelectorAll("[data-chapter]")];
  const dots = [...document.querySelectorAll("[data-jump]")];
  const smooth = (x)=>x*x*(3-2*x);
  const v3a=new THREE.Vector3(), v3b=new THREE.Vector3(), lk=new THREE.Vector3();

  let progress=0, mx=0, my=0, tx=0, ty=0;
  function applyCamera(){
    // find segment
    let i=0; while(i<KEYS.length-2 && progress>KEYS[i+1].p) i++;
    const k0=KEYS[i], k1=KEYS[i+1];
    const t = smooth(Math.min(1, Math.max(0,(progress-k0.p)/(k1.p-k0.p||1))));
    v3a.fromArray(k0.pos).lerp(v3b.fromArray(k1.pos), t);
    lk.fromArray(k0.look).lerp(v3b.fromArray(k1.look), t);
    cam.position.set(v3a.x + mx*3, v3a.y - my*2, v3a.z);
    cam.lookAt(lk);
  }
  function applyChapters(){
    let active=-1;
    CHAPTERS.forEach((c)=>{ if(progress>=c.a && progress<=c.b) active=c.id; });
    panels.forEach((el)=>{
      const on = Number(el.dataset.chapter)===active;
      el.classList.toggle("on", on);
    });
    dots.forEach((d,i)=>d.classList.toggle("on", i===active));
    document.body.dataset.station = active;
  }
  const scroller = ()=>document.scrollingElement || document.documentElement;
  function readScroll(){
    const s = scroller();
    const max = Math.max(s.scrollHeight, document.body.scrollHeight) - innerHeight;
    const y = Math.max(s.scrollTop, document.body.scrollTop||0, scrollY||0);
    progress = max>0 ? Math.min(1, Math.max(0, y/max)) : 0;
  }
  function snap(){
    window.__vb = { progress:+progress.toFixed(3), station:document.body.dataset.station,
      cam:[+cam.position.x.toFixed(1),+cam.position.y.toFixed(1),+cam.position.z.toFixed(1)] };
  }
  function update(){        // full deterministic update (scroll-safe, rAF-free)
    readScroll(); applyCamera(); applyChapters(); placeLabels();
    renderer.render(scene, cam); snap();
  }
  // debug/verify hook: drive the flight without real scrolling
  window.__vbSeek = (p)=>{ progress=Math.min(1,Math.max(0,p));
    applyCamera(); applyChapters(); placeLabels(); renderer.render(scene,cam); snap(); };
  // capture=true catches scrolls no matter which element ends up the scroller
  document.addEventListener("scroll", update, { passive:true, capture:true });
  addEventListener("resize", ()=>{ cam.aspect=W()/H(); cam.updateProjectionMatrix(); renderer.setSize(W(),H()); update(); }, { passive:true });
  if(!reduced) addEventListener("pointermove",(e)=>{ tx=(e.clientX/innerWidth-0.5); ty=(e.clientY/innerHeight-0.5); },{passive:true});

  // chapter rail jumps
  dots.forEach((d,i)=>d.addEventListener("click",()=>{
    const c=CHAPTERS[i]; const s=scroller();
    const max=Math.max(s.scrollHeight, document.body.scrollHeight)-innerHeight;
    const top=((c.a+c.b)/2)*max;
    try{ s.scrollTo({ top, behavior: reduced?"auto":"smooth" }); }
    catch{ s.scrollTop=top; }
  }));

  // ============ ambient life (rAF when visible) ============
  let running=!document.hidden, t=0;
  document.addEventListener("visibilitychange",()=>{ running=!document.hidden; if(running&&!reduced) loop(); });
  const tmp=new THREE.Vector3();
  function loop(){
    if(!running || reduced) return; t+=0.016;
    mx+=(tx-mx)*0.05; my+=(ty-my)*0.05;
    capstone.rotation.y += 0.01; capstone.rotation.x += 0.006;
    capstone.position.y = 18.4 + Math.sin(t*1.1)*0.25;
    coreBeam.material.opacity = 0.7 + Math.sin(t*1.6)*0.18;
    forgeBeam.material.opacity = 0.6 + Math.sin(t*2.1)*0.22;
    printed.forEach((p,i)=>{ p.m.rotation.y+=0.012; p.m.position.y = 7+i*1.8 + Math.sin(t*0.8+p.ph)*0.3; });
    shards.forEach((sh,i)=>{
      sh.group.position.y = Math.sin(t*0.9 + i)*0.3;
      if(sh.online){
        sh.beam.material.opacity = 0.55 + Math.sin(t*1.4+i)*0.2;
        const p = ((t*0.26 + sh.phase) % 1);
        tmp.copy(sh.from).lerp(sh.to, p);
        sh.pulse.position.copy(tmp);
        sh.pulse.scale.setScalar(0.7 + Math.sin(p*Math.PI)*0.8);
      }
    });
    readScroll(); applyCamera(); applyChapters(); placeLabels();
    renderer.render(scene, cam); snap();
    requestAnimationFrame(loop);
  }
  update();               // first paint (works even hidden)
  if(!reduced) loop();
}
