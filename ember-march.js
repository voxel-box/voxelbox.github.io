/* ============================================================
   EMBER MARCH — an atmospheric lantern-survival browser game
   Canvas 2D · light/darkness system · waves · bosses · upgrades
   No dependencies. Pure vanilla JS.
   ============================================================ */
(() => {
'use strict';

// ---------- canvas & layers ----------
const cv  = document.getElementById('game');
const ctx = cv.getContext('2d');
const darkCv = document.createElement('canvas');       // darkness layer (destination-out holes, then tinted)
const darkCtx = darkCv.getContext('2d');
const fogCv = document.createElement('canvas');        // static fog-of-war noise
let scale = 1;                                         // dpr scale for main canvas

const WORLD_W = 3400, WORLD_H = 2400;
const CAMP = { x: WORLD_W/2, y: WORLD_H/2, r: 95 };

let VW = 0, VH = 0; // css viewport size

function resize(){
  VW = window.innerWidth; VH = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = VW*dpr; cv.height = VH*dpr;
  cv.style.width = VW+'px'; cv.style.height = VH+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  darkCv.width = VW; darkCv.height = VH;
  buildFog();
}
window.addEventListener('resize', resize);

// fog-of-war tile noise (drawn once per resize)
function buildFog(){
  fogCv.width = Math.ceil(VW/64)+1; fogCv.height = Math.ceil(VH/64)+1;
  const f = fogCv.getContext('2d');
  f.clearRect(0,0,fogCv.width,fogCv.height);
  f.fillStyle = 'rgba(140,160,200,0.05)';
  for(let i=0;i<fogCv.width*fogCv.height*0.18;i++){
    const x=Math.random()*fogCv.width, y=Math.random()*fogCv.height, r=1+Math.random()*2.2;
    f.beginPath(); f.arc(x,y,r,0,7); f.fill();
  }
}

// ---------- utils ----------
const TAU = Math.PI*2;
const clamp = (v,a,b)=>v<a?a:v>b?b:v;
const lerp = (a,b,t)=>a+(b-a)*t;
const rand = (a=1,b=0)=>b+Math.random()*(a-b);
const dist2=(x1,y1,x2,y2)=>{const dx=x2-x1,dy=y2-y1;return dx*dx+dy*dy;};
const hypot=Math.hypot;
const pick=a=>a[(Math.random()*a.length)|0];
function angLerp(a,b,t){ let d=((b-a+Math.PI)%TAU+TAU)%TAU-Math.PI; return a+d*t; }

// ---------- audio (tiny synth, no assets) ----------
const SFX = (()=>{
  let ac=null, master=null, muted=false, ambGain=null;
  function ensure(){
    if(ac) return;
    try{
      ac = new (window.AudioContext||window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value=.5; master.connect(ac.destination);
      // ambient drone: two detuned oscillators through lowpass
      ambGain = ac.createGain(); ambGain.gain.value=.05; ambGain.connect(master);
      const lp = ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=220; lp.connect(ambGain);
      [55,55.7,110.3].forEach(f=>{ const o=ac.createOscillator(); o.type='sawtooth'; o.frequency.value=f; o.connect(lp); o.start(); });
    }catch(e){}
  }
  function blip(freq,dur,type,vol,slideTo){
    if(!ac||muted) return;
    const o=ac.createOscillator(), g=ac.createGain();
    o.type=type||'square'; o.frequency.value=freq;
    if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime+dur);
    g.gain.setValueAtTime(vol||.15, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime+dur);
    o.connect(g); g.connect(master); o.start(); o.stop(ac.currentTime+dur+.02);
  }
  function noise(dur,vol,filterFreq){
    if(!ac||muted) return;
    const n=ac.sampleRate*dur, buf=ac.createBuffer(1,n,ac.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
    const s=ac.createBufferSource(); s.buffer=buf;
    const f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.value=filterFreq||1200;
    const g=ac.createGain(); g.gain.value=vol||.2;
    s.connect(f); f.connect(g); g.connect(master); s.start();
  }
  return {
    unlock(){ ensure(); if(ac&&ac.state==='suspended') ac.resume(); },
    shoot(){ blip(880,.08,'square',.06,220); },
    hit(){ noise(.06,.12,900); },
    kill(){ blip(160,.22,'triangle',.16,40); noise(.1,.1,600); },
    pickup(){ blip(660,.09,'sine',.12,990); setTimeout(()=>blip(990,.07,'sine',.09,1320),50); },
    dash(){ noise(.14,.1,2400); },
    hurt(){ blip(120,.25,'sawtooth',.2,60); noise(.15,.18,500); },
    wave(){ [392,523,659,784].forEach((f,i)=>setTimeout(()=>blip(f,.18,'triangle',.12),i*110)); },
    boss(){ [110,98,82].forEach((f,i)=>setTimeout(()=>blip(f,.5,'sawtooth',.18),i*220)); },
    upgrade(){ [523,659,784,1046].forEach((f,i)=>setTimeout(()=>blip(f,.12,'sine',.12),i*70)); },
    deny(){ blip(180,.12,'square',.08,140); },
    gameover(){ [330,262,196,131].forEach((f,i)=>setTimeout(()=>blip(f,.4,'triangle',.16),i*260)); },
    victory(){ [523,659,784,1046,1318].forEach((f,i)=>setTimeout(()=>blip(f,.3,'triangle',.14),i*160)); },
    toggleMute(){ muted=!muted; if(ambGain) ambGain.gain.value=muted?0:.05; return muted; }
  };
})();

// ---------- input ----------
const keys = {};
const mouse = { x:VW/2, y:VH/2, down:false };
let usingTouch = ('ontouchstart' in window) && !matchMedia('(pointer:fine)').matches;

addEventListener('keydown', e=>{
  if(['Space','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault();
  if(!keys[e.code]) onKeyDown(e.code);
  keys[e.code]=true;
});
addEventListener('keyup', e=>keys[e.code]=false);
cv.addEventListener('mousemove', e=>{ mouse.x=e.clientX; mouse.y=e.clientY; });
cv.addEventListener('mousedown', e=>{ mouse.down=true; SFX.unlock(); });
addEventListener('mouseup', ()=>mouse.down=false);
addEventListener('blur', ()=>{ mouse.down=false; for(const k in keys) keys[k]=false; });

// touch: left half = virtual stick, tap elsewhere = aim+shoot toward point
const stick = { active:false, id:-1, cx:0, cy:0, dx:0, dy:0 };
const stickKnob = document.getElementById('stickKnob');
cv.addEventListener('touchstart', e=>{
  usingTouch = true; document.getElementById('touchUI').style.display='block';
  SFX.unlock();
  for(const t of e.changedTouches){
    if(t.clientX < VW*0.45 && !stick.active){
      stick.active=true; stick.id=t.identifier; stick.cx=t.clientX; stick.cy=t.clientY; stick.dx=stick.dy=0;
      const sb=document.getElementById('stickBase');
      sb.style.left=(t.clientX-55)+'px'; sb.style.top=(t.clientY-55)+'px'; sb.style.bottom='auto';
    } else {
      mouse.x=t.clientX; mouse.y=t.clientY; mouse.down=true;
    }
  }
},{passive:true});
cv.addEventListener('touchmove', e=>{
  for(const t of e.changedTouches){
    if(t.identifier===stick.id){
      let dx=t.clientX-stick.cx, dy=t.clientY-stick.cy;
      const m=hypot(dx,dy)||1, cap=Math.min(m,48);
      stick.dx=dx/m*cap/48; stick.dy=dy/m*cap/48;
      stickKnob.style.transform=`translate(${stick.dx*34}px,${stick.dy*34}px)`;
    } else { mouse.x=t.clientX; mouse.y=t.clientY; }
  }
  e.preventDefault();
},{passive:false});
function endTouch(e){
  for(const t of e.changedTouches){
    if(t.identifier===stick.id){ stick.active=false; stick.id=-1; stick.dx=stick.dy=0; stickKnob.style.transform=''; }
    else mouse.down=false;
  }
}
cv.addEventListener('touchend', endTouch); cv.addEventListener('touchcancel', endTouch);
document.getElementById('dashBtn').addEventListener('touchstart', e=>{ e.stopPropagation(); tryDash(); },{passive:true});

function onKeyDown(code){
  if(state==='playing'){
    if(code==='KeyP'||code==='Escape'){ pauseGame(); return; }
    if(code==='KeyE') interactCamp();
    if(code==='Space') tryDash();
  } else if(state==='paused' && (code==='KeyP'||code==='Escape')) resumeGame();
  else if(state==='dead' && code==='KeyR') startRun(runMode);
  else if(state==='won' && code==='KeyR') startRun(runMode);
}

// ---------- game state ----------
let state = 'menu';           // menu | playing | paused | shopHint | dead | won
let runMode = 'classic';
let time = 0, shakeT = 0, shakeMag = 0;
const cam = { x:0, y:0 };

const player = {
  x:CAMP.x, y:CAMP.y+140, vx:0, vy:0, r:13, hp:100, maxHp:100,
  aim:0, speed:235, fireCd:0, fireRate:.3, dmg:12, oil:60, maxOil:100,
  invuln:0, dashCd:0, dashT:0, dashDx:0, dashDy:0, pierce:1, spread:1, bulletSpeed:560,
  regenTimer:0, emberDrainCombo:0
};

const UPGRADES = [
  { key:'oil',   icon:'🛢', name:'Lantern Oil',   desc:'+40 max oil, refill',        cost:()=>12, apply(){ player.maxOil+=40; player.oil=player.maxOil; }},
  { key:'dmg',   icon:'⚔', name:'Hotter Rounds',  desc:'+6 bullet damage',           cost:()=>10, apply(){ player.dmg+=6; }},
  { key:'rate',  icon:'🌀', name:'Quick Hands',    desc:'-18% fire interval',         cost:()=>14, apply(){ player.fireRate*=.82; }},
  { key:'speed', icon:'👟', name:'Light Step',     desc:'+14% move speed',            cost:()=>10, apply(){ player.speed*=1.14; }},
  { key:'hp',    icon:'❤', name:'Stout Heart',     desc:'+25 max HP, heal 25',        cost:()=>12, apply(){ player.maxHp+=25; player.hp=Math.min(player.maxHp,player.hp+25); }},
  { key:'pierce',icon:'🏹', name:'Piercing Light', desc:'Shots pierce +1 enemy',      cost:()=>20, apply(){ player.pierce+=1; }},
  { key:'spread',icon:'✨', name:'Scatter Flame',  desc:'+1 shot per volley',         cost:()=>25, apply(){ player.spread+=1; }},
  { key:'regen', icon:'🌿', name:'Camp Warmth',    desc:'Slow HP regen near campfire',cost:()=>18, apply(){ player.regenTimer=player.regenTimer||0; player.hasRegen=true; }},
];

let embers=0, score=0, kills=0, wave=0, best=+(localStorage.getItem('emberMarchBest')||0);
let enemies=[], bullets=[], pickups=[], particles=[], floaters=[], spawnQueue=[], spawnTimer=0;
let boss=null, intermission=0, shopOpen=false, slowmo=0, dawnT=0;
let comboCount=0, comboTimer=0;

// ---------- world decor (rocks/trees, deterministic-ish) ----------
const decor = [];
for(let i=0;i<110;i++){
  const type = Math.random()<.5?'rock':(Math.random()<.6?'pine':'stub');
  decor.push({ x:rand(WORLD_W), y:rand(WORLD_H), type, s:rand(1.4,.6), seed:Math.random()*9 });
}

// ---------- spawning ----------
function makeEnemy(kind, x, y){
  const base = { x, y, vx:0, vy:0, kind, hitFlash:0, wobble:rand(TAU), seed:Math.random()*9 };
  const wf = 1 + wave*0.06;
  if(kind==='crawler')  Object.assign(base,{ r:12, hp:26*wf, spd:rand(95,70), dmg:10, val:5,  col:'#7ee08a' });
  if(kind==='runner')   Object.assign(base,{ r:10, hp:14*wf, spd:rand(190,155), dmg:8, val:7, col:'#c08bff' });
  if(kind==='brute')    Object.assign(base,{ r:22, hp:120*wf, spd:52, dmg:22, val:16, col:'#ff7a5c' });
  if(kind==='spitter')  Object.assign(base,{ r:13, hp:30*wf, spd:70, dmg:10, val:12, col:'#5cffdf', range:340, shootCd:rand(2.4,1.2) });
  if(kind==='shade')    Object.assign(base,{ r:14, hp:34*wf, spd:120, dmg:14, val:14, col:'#8fa2ff', flick:0 });
  if(kind==='boss'){
    Object.assign(base,{ r:52, hp:(900+wave*160), spd:78, dmg:30, val:120, col:'#ff4d6d', phase:1, abilityCd:2.5, telegraph:0, telegraphKind:0 });
    base.isBoss=true;
  }
  return base;
}

function startWave(n){
  wave = n;
  hud.wave.textContent = runMode==='time' ? `Time ${fmtTime(time)}` : `Wave ${n}`;
  spawnQueue = [];
  const budget = 6 + n*3;
  const kinds = ['crawler','crawler','runner'];
  if(n>=3) kinds.push('spitter');
  if(n>=4) kinds.push('brute');
  if(n>=6) kinds.push('shade','shade');
  let spent=0;
  while(spent<budget){
    const k=pick(kinds);
    const c={crawler:1,runner:1,spitter:2,brute:3,shade:2}[k];
    spent+=c;
    // spawn from off-screen ring around player
    const a=rand(TAU), d=Math.max(VW,VH)*0.65+rand(240);
    spawnQueue.push({ kind:k, x:clamp(player.x+Math.cos(a)*d,20,WORLD_W-20), y:clamp(player.y+Math.sin(a)*d,20,WORLD_H-20) });
  }
  if(n===1){ // escort a couple of marchers visually via floaters
    addFloater(CAMP.x, CAMP.y-70, 'The march makes camp. Survive.', '#9fc7ff', 3);
  }
  spawnTimer=0;
  SFX.wave();
  addFloater(player.x, player.y-60, runMode==='boss'||n%5===0 ? '' : `— Wave ${n} —`, '#ffd27a', 1.6);
  if(n%5===0 && runMode!=='time'){ // boss every 5 waves
    const a=rand(TAU), d=Math.max(VW,VH)*0.7;
    boss = makeEnemy('boss', clamp(player.x+Math.cos(a)*d,60,WORLD_W-60), clamp(player.y+Math.sin(a)*d,60,WORLD_H-60));
    enemies.push(boss);
    hud.bossWrap.style.display='block';
    hud.bossName.textContent = pick(['The Hollow King','Morrow Wraith','The Long Dark','Gloom Titan']) ;
    SFX.boss(); shake(14,.9);
    addFloater(player.x, player.y-90, 'A GREAT DARKNESS APPROACHES', '#ff8fa3', 2.4);
  }
}

function fmtTime(t){ const m=(t/60)|0, s=(t%60)|0; return `${m}:${String(s).padStart(2,'0')}`; }

// ---------- combat ----------
function tryDash(){
  if(state!=='playing'||player.dashCd>0) return;
  let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  let dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
  if(stick.active){ dx=stick.dx; dy=stick.dy; }
  if(!dx&&!dy){ dx=Math.cos(player.aim); dy=Math.sin(player.aim); }
  const m=hypot(dx,dy)||1;
  player.dashDx=dx/m; player.dashDy=dy/m;
  player.dashT=.16; player.dashCd=1.1; player.invuln=Math.max(player.invuln,.28);
  SFX.dash();
  for(let i=0;i<8;i++) puff(player.x,player.y,'#8fd0ff',.4);
}

function shoot(){
  if(player.fireCd>0) return;
  player.fireCd = player.fireRate;
  const baseAng = Math.atan2(mouse.y-(player.y-cam.y), mouse.x-(player.x-cam.x));
  player.aim = baseAng;
  const n = player.spread, arc = n>1 ? .34 : 0;
  for(let i=0;i<n;i++){
    const a = baseAng + (n===1?0:(i/(n-1)-.5)*arc) + rand(.05,-.05);
    bullets.push({ x:player.x+Math.cos(a)*16, y:player.y+Math.sin(a)*16,
      vx:Math.cos(a)*player.bulletSpeed, vy:Math.sin(a)*player.bulletSpeed,
      life:1.1, dmg:player.dmg, pierce:player.pierce, hits:new Set() });
  }
  // firing burns a little oil — your lantern doubles as the weapon's focus
  player.oil = Math.max(0, player.oil - .35);
  SFX.shoot();
  muzzleFx(player.x+Math.cos(baseAng)*18, player.y+Math.sin(baseAng)*18, baseAng);
  shake(2.5,.06);
}

function damagePlayer(amount, srcX, srcY){
  if(player.invuln>0||state!=='playing') return;
  player.hp -= amount; player.invuln = .8;
  SFX.hurt(); shake(9,.3);
  addFloater(player.x, player.y-24, `-${Math.round(amount)}`, '#ff6e5a', .9);
  for(let i=0;i<10;i++) puff(player.x,player.y,'#ff6e5a',.5);
  if(player.hp<=0) doGameOver();
}

function killEnemy(e){
  kills++;
  comboCount++; comboTimer=2.2;
  const mult = 1 + Math.min(comboCount,20)*0.05;
  const pts = Math.round(e.val * mult * (1+wave*.1));
  score += pts;
  addFloater(e.x,e.y-e.r, `+${pts}`, '#ffd27a', .9);
  // drop embers
  const count = e.isBoss?14 : (Math.random()<.75?1:0) + (e.kind==='brute'?2:0) + (Math.random()<.25?1:0);
  for(let i=0;i<count;i++) dropEmber(e.x,e.y);
  if(Math.random()<.10) pickups.push({x:e.x,y:e.y,type:'medkit',r:10,life:14,bob:rand(TAU)});
  if(e.isBoss){
    boss=null; hud.bossWrap.style.display='none';
    slowmo=1.2; shake(20,1); SFX.victory();
    addFloater(e.x,e.y,'THE DARKNESS RECOILS!', '#8fd0ff', 2.5);
    for(let i=0;i<40;i++) puff(e.x,e.y,pick(['#ff4d6d','#ffd27a','#fff']),1.2);
    score += 500;
  } else {
    SFX.kill();
    for(let i=0;i<8;i++) puff(e.x,e.y,e.col,.7);
  }
}

function dropEmber(x,y){
  pickups.push({ x, y, type:'ember', r:7, vx:rand(120,-120), vy:rand(120,-120), life:22, bob:rand(TAU) });
}

// ---------- particles / floaters ----------
function puff(x,y,col,spd){ particles.push({x,y,vx:rand(90,-90)*(spd||1),vy:rand(90,-90)*(spd||1),life:rand(.6,.25),col,r:rand(4,1.5)}); }
function muzzleFx(x,y,a){ for(let i=0;i<4;i++) particles.push({x,y,vx:Math.cos(a+rand(.6,-.6))*rand(220,80),vy:Math.sin(a+rand(.6,-.6))*rand(220,80),life:.22,col:'#ffd27a',r:rand(3.5,1.5)}); }
function addFloater(x,y,text,col,life){ if(!text)return; floaters.push({x,y,text,col,life,maxLife:life}); }
function shake(mag,t){ shakeMag=Math.max(shakeMag,mag); shakeT=Math.max(shakeT,t); }

// ---------- camp / shop ----------
function interactCamp(){
  if(intermission>0 && hypot(player.x-CAMP.x,player.y-CAMP.y) < CAMP.r+40){
    shopOpen = !shopOpen;
  } else if(player.oil < player.maxOil && embers>0){
    // quick-feed lantern: 1 ember -> 12 oil
    const use = Math.min(embers, Math.ceil((player.maxOil-player.oil)/12));
    embers-=use; player.oil=Math.min(player.maxOil, player.oil+use*12);
    addFloater(player.x,player.y-30,`lantern fed (+${use*12} oil)`,'#8fd0ff',1);
    SFX.upgrade();
  } else if(hypot(player.x-CAMP.x,player.y-CAMP.y) >= CAMP.r+40){
    addFloater(player.x,player.y-30,'move to the campfire between waves','#7d879c',1.2);
    SFX.deny();
  } else {
    addFloater(player.x,player.y-30,'no embers to burn','#7d879c',1); SFX.deny();
  }
}
function buy(u){
  const c=u.cost();
  if(embers<c){ SFX.deny(); return; }
  embers-=c; u.apply(); SFX.upgrade();
  addFloater(player.x,player.y-34,`${u.icon} ${u.name}!`,'#ffd27a',1.4);
  renderShop();
}

// ---------- HUD refs ----------
const $=id=>document.getElementById(id);
const hud = {
  root:$('hud'), wave:$('waveLabel'), hp:$('hpbar'), oil:$('oilbar'),
  score:$('scoreVal'), ember:$('emberVal'), kill:$('killVal'),
  combo:$('combo'), bossWrap:$('bossbarWrap'), bossName:$('bossName'), boss:$('bossbar'),
  menu:$('menu'), over:$('gameover'), win:$('victory'), pauseOv:$('pauseOverlay'),
};

// shop DOM (built dynamically)
const shopEl = document.createElement('div');
shopEl.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:8;display:none;background:rgba(10,12,20,.88);border:1px solid rgba(255,210,122,.35);border-radius:16px;padding:20px 22px;backdrop-filter:blur(8px);box-shadow:0 0 60px rgba(255,140,40,.2);width:min(560px,92vw);';
document.body.appendChild(shopEl);
function renderShop(){
  if(!shopOpen) return;
  shopEl.innerHTML = `<div style="color:#ffd27a;font-weight:800;letter-spacing:2px;font-size:18px;text-align:center;">CAMPFIRE UPGRADES</div>
  <div style="color:#9aa4b8;font-size:13px;text-align:center;margin:4px 0 14px;">🔥 ${embers} embers — click to spend · press <kbd>E</kbd> to close</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">` +
  UPGRADES.map((u,i)=>`
    <button data-i="${i}" style="text-align:left;cursor:pointer;font-family:inherit;background:${embers>=u.cost()?'rgba(255,210,122,.08)':'rgba(255,255,255,.03)'};border:1px solid ${embers>=u.cost()?'rgba(255,210,122,.4)':'#2a3046'};border-radius:10px;padding:10px 12px;color:#cfd6e4;">
      <div style="font-weight:700;color:${embers>=u.cost()?'#ffd27a':'#66718a'}">${u.icon} ${u.name} <span style="float:right">🔥${u.cost()}</span></div>
      <div style="font-size:12px;color:#8b95ab;margin-top:2px;">${u.desc}</div>
    </button>`).join('') + `</div>`;
  shopEl.querySelectorAll('button').forEach(b=>b.onclick=()=>{ buy(UPGRADES[+b.dataset.i]); });
}

// ---------- flow ----------
function startRun(mode){
  runMode = mode;
  SFX.unlock();
  state='playing'; shopOpen=false; shopEl.style.display='none';
  Object.assign(player,{ x:CAMP.x, y:CAMP.y+140, vx:0,vy:0, hp:100,maxHp:100, speed:235, fireRate:.3,
    dmg:12, oil:60, maxOil:100, invuln:1, dashCd:0, dashT:0, pierce:1, spread:1, hasRegen:false });
  enemies=[]; bullets=[]; pickups=[]; particles=[]; floaters=[]; spawnQueue=[];
  boss=null; hud.bossWrap.style.display='none';
  embers=0; score=0; kills=0; time=0; comboCount=0; comboTimer=0; intermission=0; slowmo=0; dawnT=0;
  hud.root.style.display='flex';
  hud.menu.style.display='none'; hud.over.style.display='none'; hud.win.style.display='none';
  startWave(1);
}
function doGameOver(){
  state='dead'; player.hp=0;
  best=Math.max(best,score); localStorage.setItem('emberMarchBest',best);
  hud.root.style.display='none'; hud.bossWrap.style.display='none';
  shopOpen=false; shopEl.style.display='none';
  $('goScore').textContent=score; $('goWave').textContent=wave; $('goKills').textContent=kills; $('goBest').textContent=best;
  hud.over.style.display='flex';
  SFX.gameover(); slowmo=1.4;
  for(let i=0;i<30;i++) puff(player.x,player.y,pick(['#ff6e5a','#ffd27a']),1.4);
}
function doVictory(){
  state='won';
  best=Math.max(best,score); localStorage.setItem('emberMarchBest',best);
  hud.root.style.display='none'; hud.bossWrap.style.display='none';
  shopOpen=false; shopEl.style.display='none';
  $('winScore').textContent=score; $('winTime').textContent=fmtTime(time); $('winKills').textContent=kills; $('winBest').textContent=best;
  hud.win.style.display='flex';
  SFX.victory();
}
function pauseGame(){ if(state!=='playing')return; state='paused'; hud.pauseOv.style.display='flex'; }
function resumeGame(){ if(state!=='paused')return; state='playing'; hud.pauseOv.style.display='none'; }

$('btnClassic').onclick=()=>startRun('classic');
$('btnTime').onclick=()=>startRun('time');
$('btnRetry').onclick=()=>startRun(runMode);
$('btnAgain').onclick=()=>startRun(runMode);
$('btnMenu1').onclick=$('btnMenu2').onclick=()=>toMenu();
$('muteBtn').onclick=()=>{ SFX.unlock(); const m=SFX.toggleMute(); $('muteBtn').textContent=m?'🔇 muted':'🔊 sound'; };
function toMenu(){
  state='menu';
  hud.root.style.display='none'; hud.bossWrap.style.display='none'; hud.over.style.display='none'; hud.win.style.display='none';
  shopOpen=false; shopEl.style.display='none';
  hud.menu.style.display='flex';
  $('bestLine').textContent = best>0 ? `Best score so far: ${best}` : '';
}

// ============================================================
//                            UPDATE
// ============================================================
function update(dtRaw){
  // menu ambience
  if(state==='menu'){ time+=dtRaw; return; }
  if(state==='paused') return;

  let dt = dtRaw;
  if(slowmo>0){ slowmo-=dtRaw; dt = dtRaw*0.35; }
  time += dt;
  if(state==='dead'||state==='won'){
    updateParticles(dt); updateCam(dt);
    if(state==='won'){ dawnT=Math.min(1,dawnT+dtRaw*.4); if(dawnT>=1&&runMode==='time'){} }
    return;
  }

  // timers
  player.fireCd-=dt; player.dashCd-=dt; player.invuln-=dt;
  if(comboTimer>0){ comboTimer-=dt; if(comboTimer<=0) comboCount=0; }
  if(shakeT>0) shakeT-=dtRaw; 

  // movement input
  let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  let dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
  if(stick.active){ dx=stick.dx; dy=stick.dy; }
  const ml=hypot(dx,dy); if(ml>1){dx/=ml;dy/=ml;}
  const darkFactor = lerp(.55,1, clamp(player.oil/player.maxOil,0,1)); // sluggish when lantern dims
  if(player.dashT>0){
    player.dashT-=dt;
    player.x+=player.dashDx*820*dt; player.y+=player.dashDy*820*dt;
    particles.push({x:player.x,y:player.y,vx:0,vy:0,life:.25,col:'#8fd0ff',r:8});
  } else {
    player.x+=dx*player.speed*darkFactor*dt;
    player.y+=dy*player.speed*darkFactor*dt;
  }
  player.x=clamp(player.x,14,WORLD_W-14); player.y=clamp(player.y,14,WORLD_H-14);

  // oil drain & death-by-darkness
  player.oil = Math.max(0, player.oil - dt*(1.4 + wave*.06));
  if(player.oil<=0){
    // standing in your own camp light refills slowly
    if(hypot(player.x-CAMP.x,player.y-CAMP.y)<CAMP.r+30){ player.oil=Math.min(player.maxOil,player.oil+dt*10); }
    else { damagePlayer(dt*9,0,0); } // darkness gnaws at you
  }
  // campfire regen upgrade
  if(player.hasRegen && hypot(player.x-CAMP.x,player.y-CAMP.y)<CAMP.r+30 && player.hp<player.maxHp){
    player.hp=Math.min(player.maxHp,player.hp+dt*6);
  }

  // shooting
  if(mouse.down) shoot();

  // spawn queue drip
  if(intermission>0){
    intermission-=dt;
    if(intermission<=0){ shopOpen=false; shopEl.style.display='none'; startWave(wave+1); }
  } else if(spawnQueue.length){
    spawnTimer-=dt;
    if(spawnTimer<=0){
      spawnTimer = Math.max(.25, 1.1 - wave*.04);
      const s=spawnQueue.pop();
      enemies.push(makeEnemy(s.kind,s.x,s.y));
    }
  } else if(!enemies.length && !boss){
    // wave cleared!
    if(runMode==='time'){
      // endless time trial: keep spawning, escalating; survive as long as possible
      startWave(wave+1);
    } else if(wave>=10){
      doVictory();
    } else {
      intermission=8;
      SFX.wave();
      addFloater(CAMP.x,CAMP.y-80,'WAVE CLEARED — make camp! (E at fire)','#7ee08a',3);
      // reward embers
      embers+=5+wave; score+=100*wave;
    }
  }

  updateEnemies(dt);
  updateBullets(dt);
  updatePickups(dt);
  updateParticles(dt);
  updateFloaters(dt);
  updateCam(dt);

  // HUD
  hud.hp.style.width=(player.hp/player.maxHp*100)+'%';
  hud.oil.style.width=(player.oil/player.maxOil*100)+'%';
  hud.score.textContent=score;
  hud.ember.textContent=embers;
  hud.kill.textContent=kills;
  if(runMode==='time') hud.wave.textContent=`Survived ${fmtTime(time)} · Wave ${wave}`;
  if(boss) hud.boss.style.width=(boss.hp/bossMaxHpCache*100)+'%';
  hud.combo.style.opacity = comboCount>=3?1:0;
  if(comboCount>=3) hud.combo.textContent=`COMBO ×${comboCount} (${(1+Math.min(comboCount,20)*.05).toFixed(2)})`;
  if(shopOpen) renderShop();
}

let bossMaxHpCache=1;

function updateEnemies(dt){
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    e.hitFlash=Math.max(0,e.hitFlash-dt*6);
    e.wobble+=dt*5;
    const px=player.x-e.x, py=player.y-e.y, d=hypot(px,py)||1;

    if(e.isBoss){
      bossMaxHpCache = Math.max(bossMaxHpCache, e.hp);
      // phases
      const frac=e.hp/bossMaxHpCache;
      e.phase = frac>.66?1:frac>.33?2:3;
      // orbit the player at melee range-ish distance
      const want = d>240?1:-0.15;
      moveToward(e,px/d,py/d,e.spd*(1+(3-e.phase)*.18),want,dt);
      strafe(e,px/d,py/d,e.spd*.9,dt);
      e.abilityCd-=dt;
      if(e.abilityCd<=0 && d<520){
        e.telegraph=.9; e.telegraphKind=pick(e.phase>=2?[0,1,2]:[0,1]);
        e.abilityCd = lerp(3.2,1.4,e.phase/3);
      }
      if(e.telegraph>0){
        e.telegraph-=dt;
        if(e.telegraph<=0) bossCast(e);
      }
      if(d<e.r+player.r+4) damagePlayer(e.dmg*dt*3,e.x,e.y);
    }
    else if(e.kind==='spitter'){
      const want = d>e.range?-1:(d<e.range*.6?1:0);
      moveToward(e,px/d,py/d,e.spd,want,dt);          // keep preferred distance
      strafe(e,px/d,py/d,e.spd*(want===0?.8:.3),dt);  // sidestep when in the sweet spot
      e.shootCd-=dt;
      if(e.shootCd<=0 && d<e.range*1.3){
        e.shootCd=rand(2.6,1.6);
        const a=Math.atan2(py,px);
        bullets.push({enemy:true,x:e.x,y:e.y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,life:2.4,dmg:e.dmg,r:6,col:'#5cffdf',pierce:0,hits:null});
        SFX.hit();
      }
      if(d<e.r+player.r) damagePlayer(8*dt*3);
    }
    else if(e.kind==='shade'){
      // flickers: sluggish in darkness, emboldened by your light
      const lightR = lightRadius();
      const inLight = d < lightR+30;
      e.flick = inLight ? 1 : (e.flick||0);
      const spd = e.spd*(inLight?1:.35);
      moveToward(e,px/d,py/d,spd,1,dt);
      strafe(e,px/d,py/d,spd*.6,dt);
      if(d<e.r+player.r && inLight) damagePlayer(e.dmg, e.x,e.y);
    }
    else { // crawler / runner / brute
      const chase = 1 + (player.oil<=0?.5:0); // they smell darkness
      moveToward(e,px/d,py/d,e.spd*chase,1,dt);
      strafe(e,px/d,py/d,e.spd*chase*.4,dt);
      if(d<e.r+player.r){
        damagePlayer(e.dmg,e.x,e.y);
        // knockback attacker
        e.x-=px/d*24; e.y-=py/d*24;
      }
    }
    // separation
    for(let j=i-1;j>=0;j--){
      const o=enemies[j];
      const ox=o.x-e.x, oy=o.y-e.y, od=hypot(ox,oy);
      const min=e.r+o.r;
      if(od<min && od>0){ const push=(min-od)/2; e.x-=ox/od*push; e.y-=oy/od*push; o.x+=ox/od*push; o.y+=oy/od*push; }
    }
    e.x=clamp(e.x,10,WORLD_W-10); e.y=clamp(e.y,10,WORLD_H-10);
    if(e.hp<=0){ killEnemy(e); enemies.splice(i,1); }
  }
}
function moveToward(e,nx,ny,spd,want,dt){ // move along n toward(+)/away(-)
  e.x+=nx*spd*want*dt; e.y+=ny*spd*want*dt;
}
function strafe(e,nx,ny,amt,dt){ // wander perpendicular using wobble phase
  const s=Math.sin(e.wobble*.7+e.seed)*amt;
  e.x+=-ny*s*dt; e.y+=nx*s*dt;
}
function bossCast(e){
  const px=player.x-e.x, py=player.y-e.y;
  const a0=Math.atan2(py,px);
  if(e.telegraphKind===0){ // radial burst
    const n = e.phase>=3?18:12;
    for(let k=0;k<n;k++){
      const a=a0+k*(TAU/n);
      bullets.push({enemy:true,x:e.x,y:e.y,vx:Math.cos(a)*220,vy:Math.sin(a)*220,life:3,dmg:12,r:7,col:'#ff8fa3',pierce:0,hits:null});
    }
    shake(6,.3);
  } else if(e.telegraphKind===1){ // charge toward player
    const m=hypot(px,py)||1;
    e.x+=px/m*140; e.y+=py/m*140;
    addFloater(e.x,e.y-70,'CHARGE!','#ff8fa3',.7);
    SFX.dash();
  } else { // summon adds
    for(let k=0;k<2+e.phase;k++){
      const a=rand(TAU);
      enemies.push(makeEnemy(pick(['crawler','runner','shade']), clamp(e.x+Math.cos(a)*120,20,WORLD_W-20), clamp(e.y+Math.sin(a)*120,20,WORLD_H-20)));
    }
    addFloater(e.x,e.y-70,'RISE, MY HOLLOW ONES','#ff8fa3',1);
  }
  SFX.boss();
}

function updateBullets(dt){
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];
    b.x+=b.vx*dt; b.y+=b.vy*dt; b.life-=dt;
    if(b.life<=0||b.x<0||b.y<0||b.x>WORLD_W||b.y>WORLD_H){ bullets.splice(i,1); continue; }
    if(b.enemy){
      if(dist2(b.x,b.y,player.x,player.y) < (player.r+ (b.r||6))**2){
        damagePlayer(b.dmg,b.x,b.y); bullets.splice(i,1);
      }
      continue;
    }
    // player bullet vs enemies
    for(const e of enemies){
      if(b.hits && b.hits.has(e)) continue;
      if(dist2(b.x,b.y,e.x,e.y) < (e.r+6)**2){
        e.hp-=b.dmg; e.hitFlash=1;
        e.x+=b.vx*.012; e.y+=b.vy*.012;
        SFX.hit();
        for(let k=0;k<3;k++) puff(b.x,b.y,'#ffd27a',.5);
        b.hits.add(e); b.pierce--;
        if(b.pierce<0){ bullets.splice(i,1); }
        break;
      }
    }
  }
}

function updatePickups(dt){
  for(let i=pickups.length-1;i>=0;i--){
    const p=pickups[i]; p.life-=dt; p.bob+=dt*4;
    if(p.vx){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=.92; p.vy*=.92; }
    const d2=dist2(p.x,p.y,player.x,player.y);
    if(d2<120*120){ // magnet
      const d=Math.sqrt(d2)||1; p.x+=(player.x-p.x)/d*260*dt; p.y+=(player.y-p.y)/d*260*dt;
    }
    if(d2<(player.r+p.r+6)**2){
      if(p.type==='ember'){ embers++; score+=5; SFX.pickup(); addFloater(p.x,p.y,'+1🔥','#ffb347',.6); }
      else { player.hp=Math.min(player.maxHp,player.hp+25); SFX.pickup(); addFloater(p.x,p.y,'+25❤','#7ee08a',.8); }
      for(let k=0;k<5;k++) puff(p.x,p.y,'#ffb347',.4);
      pickups.splice(i,1); continue;
    }
    if(p.life<=0) pickups.splice(i,1);
  }
}

function updateParticles(dt){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i]; p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=.94; p.vy*=.94;
    if(p.life<=0) particles.splice(i,1);
  }
}
function updateFloaters(dt){
  for(let i=floaters.length-1;i>=0;i--){
    const f=floaters[i]; f.life-=dt; f.y-=34*dt;
    if(f.life<=0) floaters.splice(i,1);
  }
}
function updateCam(dt){
  const tx=player.x-VW/2, ty=player.y-VH/2;
  cam.x=lerp(cam.x,clamp(tx,0,Math.max(0,WORLD_W-VW)),1-Math.pow(.001,dt));
  cam.y=lerp(cam.y,clamp(ty,0,Math.max(0,WORLD_H-VH)),1-Math.pow(.001,dt));
}

function lightRadius(){
  const t=clamp(player.oil/player.maxOil,0,1);
  return lerp(150, 430, t) + Math.sin(time*7)*8 + Math.sin(time*13)*4; // flicker
}

// ============================================================
//                            RENDER
// ============================================================
function render(){
  ctx.clearRect(0,0,VW,VH);
  let sx=0, sy=0;
  if(shakeT>0){ sx=rand(shakeMag,-shakeMag); sy=rand(shakeMag,-shakeMag); }
  ctx.save(); ctx.translate(-cam.x+sx,-cam.y+sy);

  drawGround();
  drawDecor();
  drawCamp();
  drawPickups();
  drawEnemies();
  drawBullets();
  if(state!=='dead'&&state!=='menu') drawPlayer();
  drawParticles();
  drawFloaters();

  ctx.restore();

  drawDarkness(sx,sy);
  drawVignette();
  if(state==='menu') drawMenuScene();
  if(intermission>0 && state==='playing') drawBanner(`MAKE CAMP — ${Math.ceil(intermission)}s`, shopOpen?'':'press E at the fire to upgrade');
}

function drawGround(){
  // tiled mossy ground
  const g=ctx.createLinearGradient(0,0,0,VH);
  ctx.fillStyle='#0b1018';
  ctx.fillRect(cam.x-50,cam.y-50,VW+100,VH+100);
  ctx.strokeStyle='rgba(90,120,110,.05)'; ctx.lineWidth=1;
  const gs=90;
  const x0=Math.floor(cam.x/gs)*gs, y0=Math.floor(cam.y/gs)*gs;
  ctx.beginPath();
  for(let x=x0;x<cam.x+VW+gs;x+=gs){ ctx.moveTo(x,cam.y-20); ctx.lineTo(x,cam.y+VH+20); }
  for(let y=y0;y<cam.y+VH+gs;y+=gs){ ctx.moveTo(cam.x-20,y); ctx.lineTo(cam.x+VW+20,y); }
  ctx.stroke();
  // scattered grass tufts from decor seeds
  ctx.strokeStyle='rgba(80,110,95,.16)';
  for(const d of decor){
    if(d.x<cam.x-30||d.x>cam.x+VW+30||d.y<cam.y-30||d.y>cam.y+VH+30) continue;
    if(d.type!=='stub') continue;
    ctx.beginPath();
    for(let k=0;k<3;k++){ ctx.moveTo(d.x+k*3,d.y); ctx.lineTo(d.x+k*3+Math.sin(time+d.seed)*2, d.y-8*d.s); }
    ctx.stroke();
  }
  // world border
  ctx.strokeStyle='rgba(255,90,60,.25)'; ctx.lineWidth=6;
  ctx.strokeRect(3,3,WORLD_W-6,WORLD_H-6);
}

function drawDecor(){
  for(const d of decor){
    if(d.x<cam.x-60||d.x>cam.x+VW+60||d.y<cam.y-80||d.y>cam.y+VH+40) continue;
    if(d.type==='rock'){
      ctx.fillStyle='#1b2230';
      ctx.beginPath(); ctx.ellipse(d.x,d.y,10*d.s,7*d.s,d.seed,0,TAU); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.05)';
      ctx.beginPath(); ctx.ellipse(d.x-2*d.s,d.y-2*d.s,5*d.s,3*d.s,d.seed,0,TAU); ctx.fill();
    } else if(d.type==='pine'){
      const sway=Math.sin(time*.8+d.seed)*2;
      ctx.fillStyle='#10171f';
      ctx.fillRect(d.x-2,d.y-6,4,10);
      ctx.fillStyle='#15241f';
      ctx.beginPath();
      ctx.moveTo(d.x+sway,d.y-38*d.s);
      ctx.lineTo(d.x-13*d.s,d.y-4*d.s); ctx.lineTo(d.x+13*d.s,d.y-4*d.s);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(d.x+sway*.7,d.y-52*d.s);
      ctx.lineTo(d.x-9*d.s,d.y-22*d.s); ctx.lineTo(d.x+9*d.s,d.y-22*d.s);
      ctx.closePath(); ctx.fill();
    }
  }
}

function drawCamp(){
  const t=time;
  // ring of stones
  ctx.fillStyle='#242c3d';
  for(let i=0;i<10;i++){
    const a=i/10*TAU;
    ctx.beginPath(); ctx.ellipse(CAMP.x+Math.cos(a)*CAMP.r,CAMP.y+Math.sin(a)*CAMP.r*.6,9,6,a,0,TAU); ctx.fill();
  }
  // logs
  ctx.strokeStyle='#3a2b1c'; ctx.lineWidth=8; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(CAMP.x-26,CAMP.y+8); ctx.lineTo(CAMP.x+22,CAMP.y-6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CAMP.x-20,CAMP.y-8); ctx.lineTo(CAMP.x+26,CAMP.y+10); ctx.stroke();
  // fire glow + flames
  const fl = 1+Math.sin(t*11)*.12+Math.sin(t*23)*.06;
  const gr=ctx.createRadialGradient(CAMP.x,CAMP.y,4,CAMP.x,CAMP.y,120*fl);
  gr.addColorStop(0,'rgba(255,190,90,.5)'); gr.addColorStop(1,'rgba(255,120,30,0)');
  ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(CAMP.x,CAMP.y,120*fl,0,TAU); ctx.fill();
  for(let i=0;i<3;i++){
    const h=(18+i*7)*fl, w=10-i*2.5, off=[-6,0,6][i];
    const grd=ctx.createLinearGradient(0,CAMP.y,0,CAMP.y-h);
    grd.addColorStop(0,i===1?'#ffe08a':'#ffb347'); grd.addColorStop(1,'rgba(255,80,20,0)');
    ctx.fillStyle=grd;
    ctx.beginPath();
    ctx.moveTo(CAMP.x+off-w,CAMP.y+4);
    ctx.quadraticCurveTo(CAMP.x+off-w*.4,CAMP.y-h*.6,CAMP.x+off+Math.sin(t*9+i)*3,CAMP.y-h);
    ctx.quadraticCurveTo(CAMP.x+off+w*.4,CAMP.y-h*.6,CAMP.x+off+w,CAMP.y+4);
    ctx.closePath(); ctx.fill();
  }
  // marching lanterns circling camp (ambient life!)
  for(let i=0;i<5;i++){
    const a=t*.35+i/5*TAU, rr=CAMP.r+34;
    const lx=CAMP.x+Math.cos(a)*rr, ly=CAMP.y+Math.sin(a)*rr*.6;
    ctx.fillStyle='#0e1420'; ctx.beginPath(); ctx.arc(lx,ly-10,4,0,TAU); ctx.fill();
    ctx.fillStyle='#ffd27a'; ctx.beginPath(); ctx.arc(lx,ly-8,2.6,0,TAU); ctx.fill();
    ctx.strokeStyle='#2a3046'; ctx.beginPath(); ctx.moveTo(lx,ly-6); ctx.lineTo(lx,ly); ctx.stroke();
    if(Math.random()<.06) particles.push({x:lx,y:ly-8,vx:rand(10,-10),vy:-rand(30,10),life:.5,col:'#ffb347',r:1.6});
  }
  if(intermission>0){
    ctx.fillStyle='rgba(255,210,122,.9)'; ctx.font='700 15px Segoe UI,sans-serif'; ctx.textAlign='center';
    ctx.fillText('⌂ CAMP — press E here', CAMP.x, CAMP.y+CAMP.r*.6+34);
  }
}

function drawPickups(){
  for(const p of pickups){
    const yo=Math.sin(p.bob)*3;
    if(p.type==='ember'){
      const g=ctx.createRadialGradient(p.x,p.y+yo,1,p.x,p.y+yo,16);
      g.addColorStop(0,'rgba(255,180,70,.8)'); g.addColorStop(1,'rgba(255,120,20,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y+yo,16,0,TAU); ctx.fill();
      ctx.fillStyle='#ffcf6e'; ctx.beginPath(); ctx.arc(p.x,p.y+yo,4.5,0,TAU); ctx.fill();
      ctx.fillStyle='#fff2c0'; ctx.beginPath(); ctx.arc(p.x,p.y+yo-1,2,0,TAU); ctx.fill();
    } else {
      ctx.fillStyle='rgba(126,224,138,.25)'; ctx.beginPath(); ctx.arc(p.x,p.y+yo,13,0,TAU); ctx.fill();
      ctx.fillStyle='#7ee08a'; ctx.fillRect(p.x-6,p.y+yo-2,12,4); ctx.fillRect(p.x-2,p.y+yo-6,4,12);
    }
  }
}

function drawEnemies(){
  for(const e of enemies){
    if(e.x<cam.x-80||e.x>cam.x+VW+80||e.y<cam.y-80||e.y>cam.y+VH+80) continue;
    const wob=Math.sin(e.wobble)*2;
    ctx.save(); ctx.translate(e.x,e.y);
    if(e.isBoss){
      // aura
      const g=ctx.createRadialGradient(0,0,10,0,0,e.r*2.4);
      g.addColorStop(0,'rgba(180,20,60,.35)'); g.addColorStop(1,'rgba(80,0,40,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,e.r*2.4,0,TAU); ctx.fill();
      // body: jagged shadow king
      ctx.fillStyle=e.telegraph>0?'#5a1030':'#231226';
      ctx.beginPath();
      for(let i=0;i<=14;i++){
        const a=i/14*TAU, rr=e.r*(1+(i%2?-.18:.06))+Math.sin(time*4+i)*3;
        ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);
      }
      ctx.closePath(); ctx.fill();
      // crown
      ctx.fillStyle='#ff4d6d';
      ctx.beginPath();
      ctx.moveTo(-e.r*.6,-e.r*.75); ctx.lineTo(-e.r*.4,-e.r*1.15); ctx.lineTo(-e.r*.15,-e.r*.8);
      ctx.lineTo(0,-e.r*1.3); ctx.lineTo(e.r*.15,-e.r*.8); ctx.lineTo(e.r*.4,-e.r*1.15); ctx.lineTo(e.r*.6,-e.r*.75);
      ctx.closePath(); ctx.fill();
      // eyes track player
      const a=Math.atan2(player.y-e.y,player.x-e.x);
      ctx.fillStyle='#ffe08a';
      for(const s of [-1,1]){
        ctx.beginPath(); ctx.arc(Math.cos(a)*6+s*13+Math.cos(a)*3,Math.sin(a)*4-8+Math.sin(a)*2,5,0,TAU); ctx.fill();
      }
      if(e.telegraph>0){ // warning ring
        ctx.strokeStyle=`rgba(255,90,120,${.3+.5*Math.sin(time*20)})`; ctx.lineWidth=3;
        ctx.setLineDash([10,8]);
        ctx.beginPath(); ctx.arc(0,0,e.r+26+(1-e.telegraph)*40,0,TAU); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    else if(e.kind==='shade'){
      const al = e.flick>0? .95 : .28;
      ctx.globalAlpha=al;
      ctx.fillStyle='#2a3358';
      ctx.beginPath(); ctx.arc(0,wob*.4,e.r,Math.PI,0); 
      ctx.quadraticCurveTo(e.r*.6,e.r+wob,0,e.r*1.2); ctx.quadraticCurveTo(-e.r*.6,e.r-wob,-e.r,0); ctx.fill();
      ctx.fillStyle='#aab8ff';
      ctx.beginPath(); ctx.arc(-4,-2,2.2,0,TAU); ctx.arc(4,-2,2.2,0,TAU); ctx.fill();
      ctx.globalAlpha=1;
    }
    else if(e.kind==='brute'){
      ctx.fillStyle='#3d1a14';
      ctx.beginPath(); ctx.arc(0,wob*.3,e.r,0,TAU); ctx.fill();
      ctx.fillStyle='#5c2a1e';
      ctx.beginPath(); ctx.arc(0,wob*.3-4,e.r*.72,0,TAU); ctx.fill();
      ctx.fillStyle='#ffb347';
      ctx.beginPath(); ctx.arc(-7,-4,3,0,TAU); ctx.arc(7,-4,3,0,TAU); ctx.fill();
      // horns
      ctx.strokeStyle='#8a4a34'; ctx.lineWidth=4; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(-e.r*.6,-e.r*.55); ctx.quadraticCurveTo(-e.r*.9,-e.r*1.1,-e.r*.45,-e.r*1.15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(e.r*.6,-e.r*.55); ctx.quadraticCurveTo(e.r*.9,-e.r*1.1,e.r*.45,-e.r*1.15); ctx.stroke();
    }
    else if(e.kind==='spitter'){
      ctx.fillStyle='#123c3a';
      ctx.beginPath(); ctx.ellipse(0,wob*.3,e.r,e.r*.8,0,0,TAU); ctx.fill();
      ctx.fillStyle='#5cffdf';
      ctx.beginPath(); ctx.arc(0,-2+wob*.3,4,0,TAU); ctx.fill();
      ctx.strokeStyle='#5cffdf'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(0,-e.r*.8); ctx.lineTo(0,-e.r-6); ctx.stroke();
    }
    else { // crawler / runner
      ctx.fillStyle=e.kind==='runner'?'#2c1b46':'#173321';
      ctx.beginPath(); ctx.ellipse(0,0,e.r,e.r*.8,wob*.05,0,TAU); ctx.fill();
      ctx.fillStyle=e.col;
      ctx.beginPath(); ctx.arc(-3,-2,2,0,TAU); ctx.arc(3,-2,2,0,TAU); ctx.fill();
      // legs
      ctx.strokeStyle=e.col; ctx.lineWidth=1.6;
      for(let l=0;l<3;l++){
        const la=wob+l*1.3;
        ctx.beginPath(); ctx.moveTo(-e.r*.7,l*4-4); ctx.lineTo(-e.r-4+Math.sin(la)*3,l*4-2+Math.cos(la)*3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(e.r*.7,l*4-4); ctx.lineTo(e.r+4+Math.sin(la+2)*3,l*4-2+Math.cos(la+2)*3); ctx.stroke();
      }
    }
    if(e.hitFlash>0){
      ctx.globalAlpha=e.hitFlash*.8; ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(0,0,e.r+2,0,TAU); ctx.fill(); ctx.globalAlpha=1;
    }
    ctx.restore();
  }
}

function drawBullets(){
  for(const b of bullets){
    if(b.enemy){
      ctx.fillStyle=b.col||'#5cffdf';
      ctx.shadowBlur=8; ctx.shadowColor=b.col||'#5cffdf';
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r||5,0,TAU); ctx.fill();
      ctx.shadowBlur=0;
    } else {
      const a=Math.atan2(b.vy,b.vx);
      ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(a);
      const g=ctx.createLinearGradient(-14,0,6,0);
      g.addColorStop(0,'rgba(255,150,50,0)'); g.addColorStop(1,'#ffd27a');
      ctx.fillStyle=g; ctx.fillRect(-14,-2,20,4);
      ctx.fillStyle='#fff2c0'; ctx.beginPath(); ctx.arc(4,0,3.4,0,TAU); ctx.fill();
      ctx.restore();
    }
  }
}

function drawPlayer(){
  const p=player;
  ctx.save(); ctx.translate(p.x,p.y);
  if(p.invuln>0 && Math.sin(time*30)>0) ctx.globalAlpha=.5;
  // cloak
  ctx.fillStyle='#1d2436';
  ctx.beginPath(); ctx.arc(0,2,p.r,0,TAU); ctx.fill();
  ctx.fillStyle='#2a3450';
  ctx.beginPath(); ctx.arc(0,-1,p.r*.72,0,TAU); ctx.fill();
  // hood tip toward aim
  ctx.fillStyle='#141a2a';
  ctx.beginPath();
  ctx.arc(Math.cos(p.aim)*4,Math.sin(p.aim)*4,p.r*.5,0,TAU); ctx.fill();
  // lantern in hand
  const lx=Math.cos(p.aim+1.25)*16, ly=Math.sin(p.aim+1.25)*16;
  ctx.strokeStyle='#3a4258'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(lx,ly); ctx.stroke();
  const lit = clamp(p.oil/p.maxOil,0,1);
  ctx.fillStyle=`rgba(255,${150+lit*80|0},${60+lit*40|0},${.35+lit*.65})`;
  ctx.shadowBlur=14*lit+2; ctx.shadowColor='#ffb347';
  ctx.beginPath(); ctx.arc(lx,ly,5,0,TAU); ctx.fill();
  ctx.shadowBlur=0;
  // dash trail indicator
  if(p.dashCd>0.9){ ctx.strokeStyle='rgba(140,200,255,.5)'; ctx.beginPath(); ctx.arc(0,0,p.r+5,0,TAU); ctx.stroke(); }
  ctx.restore();
}

function drawParticles(){
  for(const p of particles){
    ctx.globalAlpha=clamp(p.life*2,0,1);
    ctx.fillStyle=p.col;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r*p.life*2.2,0,TAU); ctx.fill();
  }
  ctx.globalAlpha=1;
}

function drawFloaters(){
  ctx.textAlign='center'; ctx.font='700 15px Segoe UI,sans-serif';
  for(const f of floaters){
    ctx.globalAlpha=clamp(f.life/f.maxLife*1.6,0,1);
    ctx.fillStyle='#000'; ctx.fillText(f.text,f.x+1,f.y+1);
    ctx.fillStyle=f.col; ctx.fillText(f.text,f.x,f.y);
  }
  ctx.globalAlpha=1;
}

// ---- darkness composite ----
function drawDarkness(sx,sy){
  const dark = state==='menu' ? .82 : clamp(.9 - dawnT*.6, 0, .9);
  darkCtx.setTransform(1,0,0,1,0,0);
  darkCtx.clearRect(0,0,VW,VH);
  darkCtx.fillStyle=`rgba(4,6,14,${dark})`;
  darkCtx.fillRect(0,0,VW,VH);
  darkCtx.globalCompositeOperation='destination-out';
  const cut=(wx,wy,r,soft)=>{
    const x=wx-cam.x+sx, y=wy-cam.y+sy;
    if(x<-r||y<-r||x>VW+r||y>VH+r) return;
    const g=darkCtx.createRadialGradient(x,y,r*.25,x,y,r);
    g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(.7,'rgba(0,0,0,.55)'); g.addColorStop(1,'rgba(0,0,0,0)');
    darkCtx.fillStyle=g;
    darkCtx.beginPath(); darkCtx.arc(x,y,r,0,TAU); darkCtx.fill();
  };
  if(state!=='menu'){
    cut(player.x,player.y,lightRadius());
    cut(CAMP.x,CAMP.y,170+Math.sin(time*9)*6);
    for(const b of bullets) if(!b.enemy) cut(b.x,b.y,46);
    for(const p of pickups) if(p.type==='ember') cut(p.x,p.y,40);
    if(boss) cut(boss.x,boss.y,120);
  } else {
    cut(WORLD_W/2,WORLD_H/2,240);
  }
  darkCtx.globalCompositeOperation='source-over';
  ctx.drawImage(darkCv,0,0,VW,VH);
  // warm tint right around the light sources (additive)
  ctx.save(); ctx.globalCompositeOperation='overlay';
  if(state!=='menu'){
    tint(player.x-cam.x+sx,player.y-cam.y+sy,lightRadius()*.9,'rgba(255,150,50,.20)');
    tint(CAMP.x-cam.x+sx,CAMP.y-cam.y+sy,150,'rgba(255,120,40,.25)');
  }
  ctx.restore();
  // fog overlay tiles
  ctx.save(); ctx.globalAlpha=.5;
  const fx=(-cam.x*.15)-64, fy=(-cam.y*.15)-64;
  ctx.drawImage(fogCv, 0,0, fogCv.width*64, fogCv.height*64, fx, fy, VW+128, VH+128);
  ctx.restore();
}
function tint(x,y,r,col){
  const g=ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill();
}

function drawVignette(){
  const g=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.35,VW/2,VH/2,Math.max(VW,VH)*.75);
  g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.5)');
  ctx.fillStyle=g; ctx.fillRect(0,0,VW,VH);
  // low-oil red pulse
  if(state==='playing'&&player.oil/player.maxOil<.22){
    ctx.fillStyle=`rgba(160,20,20,${.10+.08*Math.sin(time*6)})`;
    ctx.fillRect(0,0,VW,VH);
  }
  if(state==='playing'&&player.hp/player.maxHp<.3){
    ctx.fillStyle=`rgba(180,20,20,${.08+.07*Math.sin(time*8)})`;
    ctx.fillRect(0,0,VW,VH);
  }
}

function drawBanner(main,sub){
  ctx.save(); ctx.textAlign='center';
  ctx.font='800 clamp(24px,5vw,44px) Segoe UI,sans-serif';
  ctx.fillStyle='rgba(0,0,0,.5)';
  ctx.fillRect(0,VH*.16,VW,86);
  ctx.fillStyle='#ffd27a'; ctx.shadowBlur=18; ctx.shadowColor='rgba(255,150,50,.7)';
  ctx.fillText(main,VW/2,VH*.16+44);
  ctx.shadowBlur=0; ctx.font='600 15px Segoe UI,sans-serif'; ctx.fillStyle='#9aa4b8';
  ctx.fillText(sub||'',VW/2,VH*.16+70);
  ctx.restore();
}

// menu background scene: silhouetted march across the bottom
function drawMenuScene(){
  ctx.save();
  ctx.textAlign='left';
  const y=VH-70;
  for(let i=0;i<7;i++){
    const x=((time*22+i*130)%(VW+200))-100;
    const bob=Math.sin(time*4+i)*2;
    ctx.fillStyle='#0a0d16';
    ctx.beginPath(); ctx.arc(x,y+bob,9,0,TAU); ctx.fill();
    ctx.fillRect(x-6,y+bob,12,22);
    // lantern
    ctx.fillStyle='#ffb347'; ctx.shadowBlur=12; ctx.shadowColor='#ff9d3c';
    ctx.beginPath(); ctx.arc(x+12,y+bob+8+Math.sin(time*3+i)*1.5,3,0,TAU); ctx.fill();
    ctx.shadowBlur=0;
  }
  ctx.restore();
}

// ============================================================
//                          MAIN LOOP
// ============================================================
let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000); last=now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

resize();
toMenu();
requestAnimationFrame(frame);

// first interaction unlocks audio
addEventListener('pointerdown',()=>SFX.unlock(),{once:true});

})();
