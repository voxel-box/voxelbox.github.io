(() => {
 'use strict';
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const store={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
 const scenes=[['THE THRESHOLD','A WORLD BUILT FROM POSSIBILITIES'],['THE DESIGN DISTRICT','IDEAS TAKE ON ANOTHER DIMENSION'],['THE ENGINE ROOM','COMPLEXITY, CONNECTED'],['THE OTHER WORLDS','CURIOSITY IS THE WHOLE POINT'],['THE NEXT POSSIBILITY','EVERY WORLD STARTS WITH A WHAT IF']];
 const chapters=$$('[data-chapter]'), links=$$('.journey-nav a'), story=$('.world-story');
 const header=$('[data-top]'), menu=$('.top-nav'), toggle=$('.nav-toggle');
 let world=null,progress=0,frame=0,paused=reduced.matches,away=false,active=-1;
 $$('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
 menu.id='primary-navigation';toggle.setAttribute('aria-controls',menu.id);
 const closeMenu=()=>{header.classList.remove('nav-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open menu')};
 toggle.addEventListener('click',()=>{const open=header.classList.toggle('nav-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu')});
 menu.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&header.classList.contains('nav-open')){closeMenu();toggle.focus()}});
 matchMedia('(min-width:901px)').addEventListener('change',closeMenu);
 const update=()=>{
  frame=0;const scroll=scrollY, points=chapters.map(c=>c.offsetTop);
  let part=0;
  for(let i=0;i<points.length-1;i++){
   if(scroll>=points[i])part=i+Math.min(1,Math.max(0,(scroll-points[i])/(points[i+1]-points[i])));
  }
  progress=Math.min(4,Math.max(0,part));
  const next=Math.round(progress);
  if(next!==active){active=next;document.body.dataset.activeChapter=String(active);links.forEach((a,i)=>{if(i===active)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current')});$('[data-scene-name]').textContent=scenes[active][0];$('[data-scene-note]').textContent=scenes[active][1];$('[data-coordinate]').textContent=`0${active} / 04`}
  $('[data-journey-progress]').style.setProperty('--journey-progress',String(progress/4));
  const nextAway=scroll+innerHeight*.4>=story.offsetTop+story.offsetHeight;
  if(nextAway!==away){away=nextAway;document.body.classList.toggle('scene-away',away);$('.journey-nav').inert=away;$('.scene-tools').inert=away;world?.setPaused(paused||away||document.hidden)}
  if(!away)world?.setProgress(progress);
 };
 const queue=()=>{if(!frame)frame=requestAnimationFrame(update)};
 window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue,{passive:true});
 const motion=$('.world-motion'),explode=$('.world-explode');
 const updateMotion=()=>{motion.setAttribute('aria-pressed',String(paused));motion.setAttribute('aria-label',paused?'Play world animation':'Pause world animation');$('[data-motion-icon]').textContent=paused?'▶':'Ⅱ';world?.setPaused(paused||away||document.hidden)};
 motion.addEventListener('click',()=>{paused=!paused;updateMotion()});
 reduced.addEventListener('change',()=>{paused=reduced.matches;updateMotion()});
 explode.addEventListener('click',()=>{const open=explode.getAttribute('aria-pressed')!=='true';explode.setAttribute('aria-pressed',String(open));$('[data-explode-label]').textContent=open?'Reassemble':'Deconstruct';world?.setExploded(open)});
 window.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reduced.matches||paused||away)return;world?.setPointer((e.clientX/innerWidth-.5)*2,(e.clientY/innerHeight-.5)*2)},{passive:true});
 document.addEventListener('visibilitychange',()=>world?.setPaused(paused||away||document.hidden));
 import('./worldzero-scene-20260909.js').then(async({createWorld})=>{
  world=await createWorld($('#world-canvas'));world.setProgress(progress);updateMotion();
  document.body.dataset.world='ready';$('[data-render-label]').textContent='LIVE WORLD / EXPLORE';motion.hidden=false;explode.hidden=false;
 }).catch(()=>{document.body.dataset.world='fallback';$('[data-render-label]').textContent='WORLD ZERO';});
 update();
 window.addEventListener('load',queue,{once:true});
 // Legacy chapter anchors remain useful from older links and supporting pages.
 const aliases={build:'systems',process:'start-project',play:'arcade'};
 if(aliases[location.hash.slice(1)])requestAnimationFrame(()=>document.getElementById(aliases[location.hash.slice(1)]).scrollIntoView());
 const fetchJSON=async url=>{const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Feed unavailable');return r.json()};
 const safeURL=value=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}};
 fetchJSON('https://demos.voxelbox.org/portfolio.json').then(d=>{
  if(!Array.isArray(d.sites))return;$('[data-stat="sites"]').textContent=String(d.sites.length);
  const sites=d.sites.filter(s=>s&&!/game/i.test(String(s.kind||''))&&safeURL(s.url)).sort((a,b)=>String(b.updated||'').localeCompare(String(a.updated||''))).slice(0,8);
  if(!sites.length)return;
  const rows=sites.map((s,i)=>{const a=document.createElement('a'),n=document.createElement('span'),t=document.createElement('b'),l=document.createElement('span');a.href=safeURL(s.url);a.target='_blank';a.rel='noopener noreferrer';n.textContent=String(i+1).padStart(2,'0');t.textContent=String(s.title||s.slug||'Live project').split(/\s[–—-]\s/)[0];l.textContent='Explore ↗';a.append(n,t,l);return a});
  $('[data-live-projects]').replaceChildren(...rows);
 }).catch(()=>{});
 fetchJSON('https://status.voxelbox.org/api/public/status').then(d=>{const up=d?.summary?.up,total=d?.summary?.total;if(Number.isFinite(up)&&Number.isFinite(total)&&up>=0&&total>0&&up<=total)$('[data-stat-val]').textContent=`${up}/${total}`}).catch(()=>{});
 if(!store.get('vb_cookie_consent')){const bar=document.createElement('aside');bar.className='cookie-banner';bar.setAttribute('aria-label','Site storage preferences');bar.innerHTML='<p>We use site storage to remember your preferences. Read our <a href="/privacy">privacy policy</a>.</p><div class="cookie-actions"><button type="button" data-consent="accept">Accept</button><button type="button" data-consent="decline">Decline</button></div>';bar.addEventListener('click',e=>{const b=e.target.closest('[data-consent]');if(!b)return;store.set('vb_cookie_consent',b.dataset.consent);bar.remove()});document.body.append(bar)}
})();
