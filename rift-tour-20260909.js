const stage=document.querySelector('.rift-stage');
const journey=initJourney();
if(stage) import('./vendor/three.module.js').then(initRift).catch(()=>{});
function initJourney(){
 const state={progress:0,expansion:0,assembly:0,onChange:null,active:false,finished:false};
 if(!stage||matchMedia('(prefers-reduced-motion: reduce)').matches)return state;
 const chapters=[
  {selector:'.rift',label:'Welcome to the unexpected',hint:'One idea. A whole world of possibilities.',side:'right',expand:0,assemble:0},
  {selector:'#build',label:'What we can build',hint:'From individual pieces to a working system.',side:'left',expand:.12,assemble:1},
  {selector:'#work',label:'Ideas out in the wild',hint:'Real projects. Follow any one and explore.',side:'right',expand:.28,assemble:0},
  {selector:'#arcade',label:'A little room to play',hint:'Step into the worlds we made from scratch.',side:'left',expand:1,assemble:0},
  {selector:'#difference',label:'Built to keep running',hint:'The structure behind everything you see.',side:'right',expand:0,assemble:1},
  {selector:'#process',label:'How it takes shape',hint:'A clear path from the first idea to launch.',side:'left',expand:.5,assemble:.45},
  {selector:'#start-project',label:'Your idea goes here',hint:'The next thing we make could be yours.',side:'right',expand:0,assemble:0}
 ].map(c=>({...c,el:document.querySelector(c.selector)})).filter(c=>c.el);
 state.active=true;document.documentElement.classList.add('tour-ready');
 stage.classList.add('tour-stage');document.body.append(stage);
 const hud=document.createElement('aside');hud.className='tour-hud';hud.setAttribute('aria-label','Page tour');
 hud.innerHTML='<div class="tour-count"><span>YOUR TOUR / <b>01</b> — 07</span><a href="#work">SKIP TO WORK ↗</a></div><div class="tour-title"></div><p class="tour-hint"></p><div class="tour-meter"><i></i></div><nav class="tour-stops" aria-label="Tour chapters"></nav><div class="tour-bottom"><button class="tour-next">KEEP EXPLORING ↓</button></div>';
 document.body.append(hud);
 const actions=document.querySelector('.rift-actions');hud.querySelector('.tour-bottom').append(actions);
 const stops=chapters.map((chapter,i)=>{const button=document.createElement('button');button.textContent=String(i+1).padStart(2,'0');button.setAttribute('aria-label',chapter.label);button.addEventListener('click',()=>go(i));hud.querySelector('.tour-stops').append(button);return button;});
 let active=0,scheduled=false,last=-1;
 hud.querySelector('.tour-next').addEventListener('click',()=>go(active===chapters.length-1?0:active+1));
 function go(i){const el=chapters[i].el;window.scrollTo({top:scrollY+el.getBoundingClientRect().top-(innerWidth<800?240:80),behavior:'smooth'});}
 const clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,t)=>a+(b-a)*t;
 function target(chapter){
  const mobile=innerWidth<800;
  if(chapter===chapters[0]){const size=Math.min(innerWidth*(mobile?1.18:.74),innerHeight*.93);return{x:innerWidth*(mobile?.5:.68)-size/2,y:mobile?innerHeight*.3:innerHeight*.07,size};}
  const size=mobile?148:Math.min(innerWidth*.43,innerHeight*.69,650);
  return{x:mobile?innerWidth-size-8:innerWidth*(chapter.side==='left'?.225:.775)-size/2,y:mobile?70:innerHeight*.43-size/2,size};
 }
 function update(){
  scheduled=false;
  const cookie=document.querySelector('.cookie.show');document.documentElement.style.setProperty('--tour-cookie',cookie?cookie.getBoundingClientRect().height+'px':'0px');
  const positions=chapters.map(c=>scrollY+c.el.getBoundingClientRect().top);
  const probe=scrollY+innerHeight*.48;
  let i=0;for(let n=1;n<chapters.length;n++)if(probe>=positions[n])i=n;
  active=i;
  const from=i?chapters[i-1]:chapters[0],to=chapters[i];
  let amount=i?clamp((probe-positions[i])/(innerHeight*(innerWidth<800?.18:.42))):1;amount=amount*amount*(3-2*amount);
  const a=target(from),b=target(to),size=mix(a.size,b.size,amount),x=mix(a.x,b.x,amount),y=mix(a.y,b.y,amount);
  const end=document.querySelector('.foot').getBoundingClientRect().top;
  const opacity=clamp((end-100)/250);
  stage.style.transform=`translate3d(${x}px,${y}px,0) scale(${size/700})`;
  stage.style.opacity=opacity;
  state.finished=opacity===0;state.progress=(i?i-1+amount:0)/(chapters.length-1);
  state.travel=scrollY/innerHeight;state.expansion=mix(from.expand,to.expand,amount);state.assembly=mix(from.assemble,to.assemble,amount);
  hud.style.setProperty('--tour-progress',state.progress);hud.style.opacity=opacity;hud.inert=state.finished;
  hud.dataset.side=to.side;document.documentElement.dataset.tourChapter=String(i);stage.dataset.tourChapter=String(i);
  document.documentElement.classList.toggle('tour-in-content',i>0);
  if(i!==last){hud.querySelector('.tour-count b').textContent=String(i+1).padStart(2,'0');hud.querySelector('.tour-title').textContent=to.label;hud.querySelector('.tour-hint').textContent=to.hint;hud.querySelector('.tour-next').textContent=i===chapters.length-1?'BACK TO THE BEGINNING ↑':'KEEP EXPLORING ↓';stops.forEach((button,n)=>{if(n===i)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});last=i;}
  state.onChange?.();
 }
 const queue=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}};
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});
 new ResizeObserver(queue).observe(document.querySelector('main'));
 new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 update();return state;
}

function initRift(THREE){
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:innerWidth>700,powerPreference:'low-power'});}catch{return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 renderer.setClearColor(0,0);stage.append(renderer.domElement);stage.classList.add('rendered');
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,100);
 camera.position.set(0,0,19);
 const rig=new THREE.Group();scene.add(rig);
 const uniforms={uTime:{value:0},uChaos:{value:0}};
 const metal=new THREE.ShaderMaterial({uniforms,vertexShader:`varying vec3 vN; varying vec3 vP; void main(){vN=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);vP=p.xyz;gl_Position=projectionMatrix*p;}`,fragmentShader:`varying vec3 vN; varying vec3 vP;uniform float uTime;uniform float uChaos;void main(){vec3 n=normalize(vN);vec3 v=normalize(-vP);float f=pow(1.-abs(dot(n,v)),2.2);float band=sin(n.y*13.+n.x*5.+uTime*.18)*.5+.5;float strip=smoothstep(.46,.52,band);vec3 c=mix(vec3(.035,.035,.06),vec3(.79,.83,.88),strip);c+=pow(max(0.,dot(n,normalize(vec3(-1.,2.,3.)))),30.)*vec3(.8);c=mix(c,vec3(.56,.15,1.),f*.85);float acid=pow(max(0.,n.x),8.);c+=acid*vec3(.53,.8,.05);gl_FragColor=vec4(c,1.);}`});
 const knot=new THREE.Mesh(new THREE.TorusKnotGeometry(2.3,.64,200,20,2,3),metal);rig.add(knot);
 const wire=new THREE.Mesh(new THREE.TorusKnotGeometry(2.32,.66,84,8,2,3),new THREE.MeshBasicMaterial({color:0xceff31,wireframe:true,transparent:true,opacity:.12}));rig.add(wire);
 const count=innerWidth<700?270:540;
 const blocks=new THREE.InstancedMesh(new THREE.BoxGeometry(.13,.13,.13),new THREE.MeshStandardMaterial({roughness:.3,metalness:.6}),count);rig.add(blocks);
 scene.add(new THREE.HemisphereLight(0xffffff,0x2d0644,3));
 const light=new THREE.DirectionalLight(0xffffff,5);light.position.set(3,6,8);scene.add(light);
 const purple=new THREE.PointLight(0x8d2dff,70,25);purple.position.set(-4,-1,4);scene.add(purple);
 const data=[],dummy=new THREE.Object3D();
 let seed=29;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 for(let i=0;i<count;i++){
  const a=random()*Math.PI*2, b=random()*Math.PI*2,rad=4.1+random()*.65;
  const home=new THREE.Vector3(Math.cos(a)*rad,Math.sin(a)*rad*.9,Math.sin(b)*.45);
  const theta=random()*Math.PI*2,phi=Math.acos(2*random()-1),dist=3+random()*4;
  const away=new THREE.Vector3(dist*Math.sin(phi)*Math.cos(theta),dist*Math.cos(phi),dist*Math.sin(phi)*Math.sin(theta));
  const columns=9,rows=6;
  const built=new THREE.Vector3((i%columns-4)*.62,(Math.floor(i/columns)%rows-2.5)*.62,(Math.floor(i/(columns*rows))-4.5)*.62);
  data.push({home,away,built,size:.45+random()*1.5,rot:random()*6});
  blocks.setColorAt(i,new THREE.Color(i%5===0?0xceff31:i%3===0?0x9e5fff:0xd9dbea));
 }
 const ringMat=new THREE.MeshBasicMaterial({color:0xa072ff,transparent:true,opacity:.5});
 const rings=[];
 for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(5+i*.45,.012,6,140),ringMat);ring.rotation.set(.4+i*.55,.4+i*.25,i*.6);rig.add(ring);rings.push(ring);}
 const starsGeo=new THREE.BufferGeometry(),stars=[];
 for(let i=0;i<150;i++)stars.push((random()-.5)*26,(random()-.5)*18,-5-random()*8);
 starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));scene.add(new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xb9abcf,size:.018,transparent:true,opacity:.65})));
 let chaos=false,progress=0,paused=reduce,visible=true,time=0,previous=0,frame=0,scrollTurn=0;
 const pointer={x:0,y:0},smooth={x:0,y:0};
 const hero=document.querySelector('.rift'),button=document.querySelector('.chaos-button'),motion=document.querySelector('.motion-button'),status=document.querySelector('.rift-state');
 button.hidden=false;motion.hidden=false;motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'▶':'Ⅱ';motion.setAttribute('aria-label',paused?'Play sculpture animation':'Pause sculpture animation');
 const resize=()=>{const w=journey.active?700:stage.clientWidth,h=journey.active?700:stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=journey.active?19:(innerWidth<700?23:19);camera.updateProjectionMatrix();draw(0);};
 document.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reduce)return;const r=journey.active?{left:0,top:0,width:innerWidth,height:innerHeight}:hero.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width-.5;pointer.y=(e.clientY-r.top)/r.height-.5;});
 hero.addEventListener('pointerleave',()=>{pointer.x=pointer.y=0;});
 button.addEventListener('click',()=>{chaos=!chaos;button.setAttribute('aria-pressed',String(chaos));button.textContent=chaos?'RESTORE REALITY ↙':'UNLEASH CHAOS ↗';status.textContent=chaos?'ORDER IS OPTIONAL.':'MOVE YOUR CURSOR. BEND REALITY.';hero.classList.toggle('chaos',chaos);if(paused||reduce){progress=chaos?1:0;draw(0);}else start();});
 motion.addEventListener('click',()=>{paused=!paused;motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'▶':'Ⅱ';motion.setAttribute('aria-label',paused?'Play sculpture animation':'Pause sculpture animation');if(paused){cancelAnimationFrame(frame);frame=0;}else start();});
 function draw(delta){
  if(!paused)time+=delta;
  const trip=journey.progress;
  const expansion=journey.expansion||0;
  const assembly=journey.assembly||0;
  const target=chaos?1:expansion*.9;
  progress=paused?target:progress+(target-progress)*.075;
  smooth.x+=(pointer.x-smooth.x)*.035;smooth.y+=(pointer.y-smooth.y)*.035;
  uniforms.uTime.value=time;
  rig.rotation.set(.2+smooth.y*.5+assembly*.3,time*.1+smooth.x*.6+trip*2.8+(journey.travel||0)*.25,-.28+Math.sin(time*.15)*.12+assembly*.6);
  rig.position.x=0;
  rig.scale.setScalar(1);
  knot.rotation.y=time*.13;knot.rotation.z=time*.07;wire.rotation.copy(knot.rotation);
  knot.scale.setScalar(Math.max(.035,(1-progress*.9)*(1-assembly)));wire.scale.copy(knot.scale);
  for(let i=0;i<count;i++){const d=data[i];dummy.position.copy(d.home).lerp(d.away,progress).lerp(d.built,chaos?0:assembly);dummy.rotation.set((d.rot+time*.12)*(1-assembly),(d.rot+time*.18)*(1-assembly),0);dummy.scale.setScalar(d.size*(1+progress*1.8)*(1-assembly)+assembly*2.5);dummy.updateMatrix();blocks.setMatrixAt(i,dummy.matrix);}
  blocks.instanceMatrix.needsUpdate=true;rings.forEach((ring,i)=>{ring.rotation.z=time*(i%2?-.09:.07)+i*.6;});
  renderer.render(scene,camera);
 }
 function tick(now){frame=0;if(paused||!visible||document.hidden)return;const dt=Math.min((now-previous)/1000,.05);previous=now;draw(dt);frame=requestAnimationFrame(tick);}
 function start(){if(!frame&&!paused&&visible&&!document.hidden){previous=performance.now();frame=requestAnimationFrame(tick);}}
 journey.onChange=()=>{visible=!journey.finished;if(paused&&visible)draw(0);else if(visible)start();};
 if(!journey.active)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{cancelAnimationFrame(frame);frame=0;}},{threshold:0}).observe(hero);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});
 window.addEventListener('scroll',()=>{if(!reduce)scrollTurn=Math.min(1,Math.max(0,-hero.getBoundingClientRect().top/hero.clientHeight));},{passive:true});
 window.addEventListener('resize',resize,{passive:true});resize();start();
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;stage.classList.remove('rendered');button.hidden=true;motion.hidden=true;});
}
