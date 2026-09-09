const stage=document.querySelector('.rift-stage');
const journey=initJourney();
if(stage) import('./vendor/three.module.js').then(initRift).catch(()=>{});
function initJourney(){
 const wrapper=document.querySelector('.scroll-journey');
 const state={progress:0,onChange:null};
 if(!wrapper||matchMedia('(prefers-reduced-motion: reduce)').matches)return state;
 document.documentElement.classList.add('scroll-ready');
 const hero=wrapper.querySelector('.rift'),copies=[...wrapper.querySelectorAll('[data-chapter]')],stops=[...wrapper.querySelectorAll('[data-scroll-to]')];
 const notes=['We build the websites, systems, and worlds you wish already existed.','Pull an idea apart. Find the unexpected. Turn a different perspective into something worth making.','Websites. Platforms. AI. Entire worlds. Designed here, engineered here, and operated long after launch.'];
 const clamp=v=>Math.max(0,Math.min(1,v));
 const ramp=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
 let scheduled=false,last=-1;
 function update(){
  scheduled=false;
  const travel=wrapper.offsetHeight-hero.offsetHeight;
  state.progress=clamp(-wrapper.getBoundingClientRect().top/Math.max(1,travel));
  const p=state.progress,chapter=p<.29?0:p<.73?1:2;
  const alpha=[1-ramp(.18,.32,p),ramp(.18,.32,p)*(1-ramp(.65,.79,p)),ramp(.65,.79,p)];
  copies.forEach((el,i)=>{el.style.opacity=alpha[i];el.style.transform=`translateY(${(1-alpha[i])*22}px)`;el.setAttribute('aria-hidden',String(i!==chapter));});
  wrapper.style.setProperty('--journey-progress',p);
  hero.dataset.scrollChapter=String(chapter);
  if(chapter!==last){
   wrapper.querySelector('.rift-note p').textContent=notes[chapter];
   wrapper.querySelector('.rift-coordinate').innerHTML=`FIG. 0${chapter+1}<br>${['IDEAS HAVE NO FIXED FORM','LET THE POSSIBILITIES EXPAND','FROM POSSIBILITY TO PRODUCTION'][chapter]}`;
   stops.forEach((button,i)=>{if(i===chapter)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
   last=chapter;
  }
  state.onChange?.();
 }
 const queue=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}};
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});
 stops.forEach(button=>button.addEventListener('click',()=>{const ratio=[0,.5,.98][Number(button.dataset.scrollTo)];window.scrollTo({top:scrollY+wrapper.getBoundingClientRect().top+(wrapper.offsetHeight-hero.offsetHeight)*ratio,behavior:'smooth'});}));
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
 const resize=()=>{const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=innerWidth<700?23:19;camera.updateProjectionMatrix();draw(0);};
 hero.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reduce)return;const r=hero.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width-.5;pointer.y=(e.clientY-r.top)/r.height-.5;});
 hero.addEventListener('pointerleave',()=>{pointer.x=pointer.y=0;});
 button.addEventListener('click',()=>{chaos=!chaos;button.setAttribute('aria-pressed',String(chaos));button.textContent=chaos?'RESTORE REALITY ↙':'UNLEASH CHAOS ↗';status.textContent=chaos?'ORDER IS OPTIONAL.':'MOVE YOUR CURSOR. BEND REALITY.';hero.classList.toggle('chaos',chaos);if(paused||reduce){progress=chaos?1:0;draw(0);}else start();});
 motion.addEventListener('click',()=>{paused=!paused;motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'▶':'Ⅱ';motion.setAttribute('aria-label',paused?'Play sculpture animation':'Pause sculpture animation');if(paused){cancelAnimationFrame(frame);frame=0;}else start();});
 function draw(delta){
  if(!paused)time+=delta;
  const trip=journey.progress;
  const expansion=Math.sin(Math.min(1,trip/.75)*Math.PI);
  const assembly=Math.max(0,Math.min(1,(trip-.58)/.35));
  const target=chaos?1:expansion*.9;
  progress=paused?target:progress+(target-progress)*.075;
  smooth.x+=(pointer.x-smooth.x)*.035;smooth.y+=(pointer.y-smooth.y)*.035;
  uniforms.uTime.value=time;
  rig.rotation.set(.2+smooth.y*.5+assembly*.3,time*.1+smooth.x*.6+trip*2.8,-.28+Math.sin(time*.15)*.12+assembly*.6);
  rig.position.x=-Math.sin(trip*Math.PI)*1.1;
  rig.scale.setScalar(1-trip*.14);
  knot.rotation.y=time*.13;knot.rotation.z=time*.07;wire.rotation.copy(knot.rotation);
  knot.scale.setScalar(Math.max(.035,(1-progress*.9)*(1-assembly)));wire.scale.copy(knot.scale);
  for(let i=0;i<count;i++){const d=data[i];dummy.position.copy(d.home).lerp(d.away,progress).lerp(d.built,chaos?0:assembly);dummy.rotation.set((d.rot+time*.12)*(1-assembly),(d.rot+time*.18)*(1-assembly),0);dummy.scale.setScalar(d.size*(1+progress*1.8)*(1-assembly)+assembly*2.5);dummy.updateMatrix();blocks.setMatrixAt(i,dummy.matrix);}
  blocks.instanceMatrix.needsUpdate=true;rings.forEach((ring,i)=>{ring.rotation.z=time*(i%2?-.09:.07)+i*.6;});
  renderer.render(scene,camera);
 }
 function tick(now){frame=0;if(paused||!visible||document.hidden)return;const dt=Math.min((now-previous)/1000,.05);previous=now;draw(dt);frame=requestAnimationFrame(tick);}
 function start(){if(!frame&&!paused&&visible&&!document.hidden){previous=performance.now();frame=requestAnimationFrame(tick);}}
 journey.onChange=()=>{if(paused&&visible)draw(0);};
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{cancelAnimationFrame(frame);frame=0;}},{threshold:0}).observe(hero);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});
 window.addEventListener('scroll',()=>{if(!reduce)scrollTurn=Math.min(1,Math.max(0,-hero.getBoundingClientRect().top/hero.clientHeight));},{passive:true});
 window.addEventListener('resize',resize,{passive:true});resize();start();
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;stage.classList.remove('rendered');button.hidden=true;motion.hidden=true;});
}
