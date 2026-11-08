import * as THREE from '/vendor/three.module.js';
const canvas=document.getElementById('possibility-canvas'),host=canvas?.closest('[data-scene]');
const chapters=[...document.querySelectorAll('[data-chapter]')],rail=[...document.querySelectorAll('.journey-rail a')];
const captions=['00 / AN IDEA TAKING SHAPE','01 / A WINDOW TO SOMEWHERE NEW','02 / BEAUTY WITH A BACKBONE','03 / LANTERNMARCH','04 / THERE’S ROOM FOR YOUR IDEA'];
const colors=['#ebe9e1','#e5d7cc','#e4e7dc','#172b29','#d9e998'];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let offsets=[],chapterIndex=0,chapterBlend=0,chapterPosition=0,needsRender=true,visible=true,inWorld=true,raf=0;
let renderScene=()=>{},paused=reduced.matches;
function measure(){offsets=chapters.map((el,i)=>i===0?0:el.offsetTop-innerHeight*.08);updateJourney();}
function updateJourney(){
 let y=scrollY,index=0;while(index<offsets.length-1&&y>=offsets[index+1])index++;
 let blend=index<offsets.length-1?THREE.MathUtils.clamp((y-offsets[index])/(offsets[index+1]-offsets[index]),0,1):0;
 chapterIndex=index;chapterBlend=blend;chapterPosition=index+blend;
 const active=Math.min(4,Math.floor(chapterPosition+.45));
 chapters.forEach(chapter=>{const rect=chapter.getBoundingClientRect(),entry=THREE.MathUtils.clamp((innerHeight-rect.top)/(innerHeight*.55),0,1),exit=THREE.MathUtils.clamp(rect.bottom/(innerHeight*.8),0,1);chapter.style.setProperty('--chapter-fade',String(Math.min(entry,exit)));chapter.style.setProperty('--chapter-offset',reduced.matches?'0px':((1-entry)*35-(1-exit)*35)+'px');});
 document.body.dataset.chapter=String(active);rail.forEach((link,i)=>{if(i===active)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');});
 const readout=document.querySelector('[data-mode-caption]');if(readout)readout.textContent=captions[active];
 const color=new THREE.Color(colors[index]).lerp(new THREE.Color(colors[Math.min(4,index+1)]),THREE.MathUtils.smoothstep(blend,.08,.94));
 document.body.dataset.dark=String(color.r*.2126+color.g*.7152+color.b*.0722<.18);
 document.body.style.backgroundColor='#'+color.getHexString();
 document.body.style.setProperty('--journey-progress',Math.min(1,y/Math.max(1,offsets[4]+innerHeight)));
 const end=document.querySelector('.journey-landing').getBoundingClientRect().top;
 const opacity=THREE.MathUtils.clamp(end/innerHeight,0,1);host.style.opacity=String(opacity);document.querySelector('.journey-hud').style.opacity=String(opacity);document.querySelector('.journey-rail').style.opacity=String(opacity);
 inWorld=opacity>0;host.style.visibility=inWorld?'visible':'hidden';needsRender=true;kick();
}
function kick(){if(!raf&&visible&&inWorld)raf=requestAnimationFrame(frame);}
function frame(time){raf=0;renderScene(time);if(!paused&&visible&&inWorld)kick();}
addEventListener('scroll',updateJourney,{passive:true});addEventListener('resize',measure,{passive:true});
document.addEventListener('visibilitychange',()=>{visible=!document.hidden;kick();});
function motionState(){const button=document.querySelector('.motion-toggle');button.setAttribute('aria-pressed',String(paused));button.setAttribute('aria-label',paused?'Play ambient animation':'Pause ambient animation');document.querySelector('[data-motion-icon]').textContent=paused?'▷':'Ⅱ';}
document.querySelector('.motion-toggle')?.addEventListener('click',()=>{paused=!paused;motionState();needsRender=true;kick();});
reduced.addEventListener('change',event=>{paused=event.matches;motionState();needsRender=true;kick();});
if(host){try{init();}catch(error){host.dataset.renderer='fallback';document.querySelector('.motion-toggle').disabled=true;console.info('Using the static journey artwork.',error.message);}}
motionState();measure();
function init(){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0xebe9e1,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(33,innerWidth/innerHeight,.1,100);camera.position.set(0,0,13.4);
 scene.add(new THREE.HemisphereLight(0xfff5e2,0x7a8967,2.7));
 const key=new THREE.DirectionalLight(0xffecda,4);key.position.set(-3,6,5);scene.add(key);
 const rim=new THREE.DirectionalLight(0xd2e3ff,3.2);rim.position.set(5,2,-3);scene.add(rim);
 const count=2400,geometry=new THREE.BoxGeometry(.105,.105,.105),material=new THREE.MeshStandardMaterial({color:0xdf5f32,roughness:.4,metalness:.3});
 const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;
 const group=new THREE.Group();group.add(mesh);scene.add(group);
 const lanternLight=new THREE.PointLight(0xffaf53,0,2.25);
 lanternLight.position.set(.05,-.65,0);
 group.add(lanternLight);
 const haloCanvas=document.createElement('canvas');
 haloCanvas.width=haloCanvas.height=64;
 const haloContext=haloCanvas.getContext('2d');
 const gradient=haloContext.createRadialGradient(32,32,0,32,32,32);
 gradient.addColorStop(0,'rgba(255, 186, 92, .9)');
 gradient.addColorStop(.42,'rgba(255, 159, 66, .36)');
 gradient.addColorStop(1,'rgba(255, 159, 66, 0)');
 haloContext.fillStyle=gradient;
 haloContext.fillRect(0,0,64,64);
 const haloTexture=new THREE.CanvasTexture(haloCanvas);
 haloTexture.colorSpace=THREE.SRGBColorSpace;
 const haloMaterial=new THREE.SpriteMaterial({map:haloTexture,transparent:true,depthWrite:false,opacity:0});
 const halo=new THREE.Sprite(haloMaterial);
 halo.position.copy(lanternLight.position);
 halo.scale.set(2.35,2.65,1);
 group.add(halo);
 const dummy=new THREE.Object3D(),shade=new THREE.Color(),sets=[[],[],[],[],[]],worldHeights=[],worldColors=[];
 const lantern=[];
 const lanternPalette=[0x9d4324,0xb95830,0xda7946,0x7b351d,0xffa027,0xffdd70,0xffefb1].map(value=>new THREE.Color(value));
 for(let y=-19;y<=22;y++){
  for(let x=-10;x<=10;x++){
   for(let z=-10;z<=10;z++){
    const edge=Math.max(Math.abs(x),Math.abs(z));
    let tone=-1, flame=false;
    if(y>=-19&&y<=-14){
     const width=y===-19||y===-14?9:10;
     if(edge<=width&&(edge>=width-(y>=-16?1:0)||y===-14))tone=edge===width?2:0;
    }else if(y>=8&&y<=13){
     const width=10-Math.floor((y-8)*.8);
     if(edge<=width&&(edge===width||y===13))tone=y===8?2:1;
    }else if(y>=14){
     const ring=(x*x+(y-16)*(y-16)*.75);
     if(Math.abs(z)<=1&&ring>=20&&ring<=39)tone=y>=19?2:1;
    }else{
     const corner=Math.abs(x)>=7&&Math.abs(z)>=7&&edge<=8;
     const rail=(y===-13||y===7)&&edge===8;
     if(corner||rail)tone=corner&&edge===8?1:3;
     const flameWidth=y>=-10&&y<=3?Math.max(0,4-Math.floor(Math.abs(y+6)*.57)):-1;
     const flameOffset=y>=-3?1:0;
     const flameDistance=Math.abs(x-flameOffset)+Math.abs(z);
     if(y>=-13&&y<=-11&&Math.abs(x)<=2&&Math.abs(z)<=2)tone=5;
     if(flameDistance<=flameWidth){
      flame=true;
      tone=flameDistance<=1&&y<-4?6:flameDistance<flameWidth?5:4;
     }
    }
    if(tone>=0)lantern.push({point:new THREE.Vector3(x*.105,(y-1)*.105,z*.105),color:lanternPalette[tone],flame});
   }
  }
 }
 const lanternCenter=new THREE.Vector3();
 for(let i=0;i<count;i++){
  const j=i%12;
  sets[0].push(lantern[i]?.point||lanternCenter);
  // Four bands form a deep, open architectural frame around the live work.
  const side=Math.floor(i/600),q=(i%600)/600,depth=(i%12-5.5)*.07,band=(Math.floor(i/12)%5-2)*.075;
  sets[1].push(new THREE.Vector3(side===0?-2.1+4.2*q:side===1?2.1+band:side===2?2.1-4.2*q:-2.1+band,side===0?1.65+band:side===1?1.65-3.3*q:side===2?-1.65+band:-1.65+3.3*q,depth));
  const phi=Math.acos(1-2*(i+.5)/count),theta=Math.PI*(3-Math.sqrt(5))*i,r=2.05;
  sets[2].push(new THREE.Vector3(r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta)));
  const u=(i%60)/59*2-1,v=Math.floor(i/60)/39*2-1,x=u*Math.sqrt(1-v*v/2)*2.6,z=v*Math.sqrt(1-u*u/2)*2.15;
  const water=Math.abs(z-.3*Math.sin(x*1.8))<.17,building=Math.max(Math.abs(x+.65),Math.abs(z+.6))<.28||Math.max(Math.abs(x-.5),Math.abs(z-.7))<.24;
  const h=water?.19:building?1.5+.25*Math.sin(x*3):.35+.32*(Math.sin(x*1.7+z*.5)+1)+.18*(Math.cos(z*1.9)+1);
  worldHeights.push(h);worldColors.push(new THREE.Color(water?0x609caa:building?0xe9e2c9:Math.sin(i*.27)>.3?0xa1bc72:0x6f9457));
  sets[3].push(new THREE.Vector3(x,h/2-.8,z));
  const face=Math.floor(i/400),s=((i%20)/19-.5)*2.9,w=((Math.floor(i/20)%20)/19-.5)*2.9;
  sets[4].push(new THREE.Vector3(...[[-1.45,s,w],[1.45,s,w],[s,-1.45,w],[s,1.45,w],[s,w,-1.45],[s,w,1.45]][face]));
  const value=.72+(j%3)*.1;shade.setRGB(value,value,value);mesh.setColorAt(i,shade);
 }
 const points=sets[0].map(p=>p.clone());
 const plates=new THREE.Group();group.add(plates);
 const screenMaterials=[],loader=new THREE.TextureLoader();
 for(const [i,file] of ['nadir.jpg','fable.jpg'].entries()){
  const texture=loader.load('/assets/'+file);texture.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:0,side:THREE.DoubleSide});screenMaterials.push(mat);
  const plate=new THREE.Mesh(new THREE.PlaneGeometry(3.5,2.25),mat);plate.position.set(i===0?-.08:.1,i===0?.15:-.15,.45+i*.05);plate.rotation.set(0,i===0?.04:-.04,i===0?.03:-.02);plates.add(plate);
 }
 const wirePoints=[];for(let i=0;i<36;i++){const a=sets[2][Math.floor(i/36*count)],b=sets[2][Math.floor(((i+7)%36)/36*count)];wirePoints.push(a.x,a.y,a.z,b.x,b.y,b.z);}
 const wireMaterial=new THREE.LineBasicMaterial({color:0x4f6f39,transparent:true,opacity:0});const wireGeo=new THREE.BufferGeometry();wireGeo.setAttribute('position',new THREE.Float32BufferAttribute(wirePoints,3));const wires=new THREE.LineSegments(wireGeo,wireMaterial);group.add(wires);
 const starsGeo=new THREE.BufferGeometry(),starPositions=[];for(let i=0;i<160;i++)starPositions.push(Math.sin(i*17.3)*11,Math.cos(i*27.1)*6,-5-Math.abs(Math.sin(i*37))*6);starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));const starMat=new THREE.PointsMaterial({color:0xd9ee8d,size:.024,transparent:true,opacity:0});const stars=new THREE.Points(starsGeo,starMat);scene.add(stars);
 let lookX=0,lookY=0,dragging=false,pressedLantern=false,startX=0,startY=0,lastX=0,lastY=0,lastTime=0,tick=0,frames=0,settled=0;
 const posFrames=[[2.15,.05,0],[-2.25,0,0],[2.25,0,0],[-2.2,-.1,0],[2.2,0,0]];
 const rotFrames=[[.08,-.42,-.06],[.03,-.13,-.04],[.1,.2,.05],[.74,.25,-.12],[.3,-.5,.12]];
 const materialColors=[0xffffff,0xbb5c38,0x658945,0xffffff,0xe76e37].map(c=>new THREE.Color(c));
 const blendVec=new THREE.Vector3(),color=new THREE.Color();
 const mobile=()=>innerWidth<761;
 const lerp=(a,b,t)=>a+(b-a)*t;
 renderScene=time=>{
  if(!visible||!inWorld)return;
  const dt=Math.min((time-lastTime)/1000||.016,.04);lastTime=time;if(!paused)tick+=dt;
  const a=chapterIndex,b=Math.min(4,a+1),t=THREE.MathUtils.smoothstep(chapterBlend,0,1);
  const currentIndex=reduced.matches?Math.min(4,Math.floor(chapterPosition+.5)):a;
  const nextIndex=reduced.matches?currentIndex:b,mix=reduced.matches?0:t;
  const lanternAmount=currentIndex===0?1-mix:0;
  const flicker=reduced.matches?0:(Math.sin(tick*7.1)*.62+Math.sin(tick*11.7+.6)*.26+Math.sin(tick*17.3)*.12);
  lanternLight.intensity=(.85+.12*flicker)*lanternAmount;
  haloMaterial.opacity=(.22+.025*flicker)*lanternAmount;
  halo.visible=lanternAmount>0;
  let moving=false;
  for(let i=0;i<count;i++){
   blendVec.copy(sets[currentIndex][i]).lerp(sets[nextIndex][i],mix);
   if(!reduced.matches){const travel=Math.sin(mix*Math.PI)*.45;blendVec.x+=Math.sin(i*2.31+tick*.2)*travel;blendVec.y+=Math.cos(i*1.31+tick*.2)*travel;}
   const point=points[i];if(point.distanceToSquared(blendVec)>.00002)moving=true;
   point.lerp(blendVec,reduced.matches?1:Math.min(1,dt*9));dummy.position.copy(point);
   const worldAmount=(currentIndex===3?1-mix:0)+(nextIndex===3?mix:0);
   const height=1+worldAmount*(worldHeights[i]/.105-1);
   const flame=lantern[i]?.flame;
   if(flame){
    const tip=THREE.MathUtils.smoothstep(lantern[i].point.y,-1.05,.2);
    dummy.position.x+=.065*flicker*tip*lanternAmount;
    dummy.position.y+=.048*flicker*tip*lanternAmount;
   }
   const lanternScale=i<lantern.length?1-.045*lanternAmount:1-lanternAmount;
   const value=.72+(i%12%3)*.1;
   shade.setRGB(value,value,value).lerp(worldColors[i],worldAmount);
   if(lantern[i])shade.lerp(lantern[i].color,lanternAmount);
   if(flame)shade.multiplyScalar(1+.065*flicker*lanternAmount);
   mesh.setColorAt(i,shade);
   dummy.scale.set(lanternScale,height*lanternScale,lanternScale);
   const cubeAmount=(currentIndex===4?1-mix:0)+(nextIndex===4?mix:0);
   const tumble=1-worldAmount-cubeAmount-lanternAmount;
   dummy.rotation.set(tumble*i*.07,tumble*Math.sin(i*.4)*.3,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;
  const posA=posFrames[currentIndex],posB=posFrames[nextIndex],rotA=rotFrames[currentIndex],rotB=rotFrames[nextIndex];
  group.position.set(lerp(posA[0],posB[0],mix),lerp(posA[1],posB[1],mix),0);
  group.rotation.set(lerp(rotA[0],rotB[0],mix)+lookY,lerp(rotA[1],rotB[1],mix)+lookX+Math.sin(tick*.16)*.16,lerp(rotA[2],rotB[2],mix));
  if(mobile()){const mobileY=[-1.95,-2.5,-2.6,-2.5,-2.9],mobileScale=[.6,.52,.50,.60,.50];group.position.x*=.12;group.position.y=lerp(mobileY[currentIndex],mobileY[nextIndex],mix);group.scale.setScalar(lerp(mobileScale[currentIndex],mobileScale[nextIndex],mix));camera.position.z=12.5;}else{group.scale.setScalar(1-((currentIndex===3?1-mix:0)+(nextIndex===3?mix:0))*.08);const cameraFrames=[13.4,13.2,13.2,12.8,13.2];camera.position.z=lerp(cameraFrames[currentIndex],cameraFrames[nextIndex],mix)-(reduced.matches?0:Math.sin(mix*Math.PI)*.8);}
  color.copy(materialColors[currentIndex]).lerp(materialColors[nextIndex],mix);material.color.copy(color);
  const windowAmount=THREE.MathUtils.clamp(1-Math.abs(chapterPosition-1)*1.6,0,1),screenBlend=THREE.MathUtils.smoothstep(chapterPosition,1.15,1.4);screenMaterials[0].opacity=windowAmount*(1-screenBlend);screenMaterials[1].opacity=windowAmount*screenBlend;
  plates.visible=windowAmount>.01;wireMaterial.opacity=THREE.MathUtils.clamp(1-Math.abs(chapterPosition-2)*1.4,0,1)*.35;starMat.opacity=THREE.MathUtils.clamp(1-Math.abs(chapterPosition-3),0,1)*.8;
  renderer.render(scene,camera);host.dataset.mode=String(Math.min(4,Math.floor(chapterPosition+.45)));host.dataset.progress=chapterPosition.toFixed(3);host.dataset.frames=String(++frames);
  if(moving&&!reduced.matches&&settled++<150)kick();else settled=0;
  needsRender=false;
 };
 function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.position.z=mobile()?12.5:13.4;camera.updateProjectionMatrix();needsRender=true;kick();}
 const playLink=document.querySelector('[data-lanternmarch-play]');
 const lanternBounds=new THREE.Box3().setFromPoints(sets[0]).expandByScalar(.06);
 const raycaster=new THREE.Raycaster(),localRay=new THREE.Ray(),inverse=new THREE.Matrix4(),pointer=new THREE.Vector2();
 const lanternIsActive=()=>Boolean(playLink)&&chapterPosition<.22;
 function hitsLantern(event){
  if(!lanternIsActive())return false;
  const rect=canvas.getBoundingClientRect();
  pointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
  raycaster.setFromCamera(pointer,camera);
  localRay.copy(raycaster.ray).applyMatrix4(inverse.copy(group.matrixWorld).invert());
  return localRay.intersectsBox(lanternBounds);
 }
 canvas.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0)return;
  dragging=true;
  pressedLantern=hitsLantern(event);
  startX=lastX=event.clientX;startY=lastY=event.clientY;
  canvas.setPointerCapture(event.pointerId);
 });
 canvas.addEventListener('pointermove',event=>{
  if(!event.isPrimary)return;
  if(!dragging){canvas.style.cursor=hitsLantern(event)?'pointer':'';return;}
  if(Math.hypot(event.clientX-startX,event.clientY-startY)>8)pressedLantern=false;
  lookX+=(event.clientX-lastX)*.004;
  lookY=THREE.MathUtils.clamp(lookY+(event.clientY-lastY)*.003,-.5,.5);
  lastX=event.clientX;lastY=event.clientY;needsRender=true;kick();
 });
 canvas.addEventListener('pointerup',event=>{
  if(!event.isPrimary)return;
  dragging=false;
  if(pressedLantern&&Math.hypot(event.clientX-startX,event.clientY-startY)<=8&&hitsLantern(event))playLink.click();
  pressedLantern=false;
 });
 canvas.addEventListener('pointercancel',()=>{dragging=false;pressedLantern=false;});
 canvas.addEventListener('keydown',event=>{
  if(event.key==='Enter'&&lanternIsActive()){event.preventDefault();playLink.click();}
  else if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();lookX+=event.key==='ArrowLeft'?-.12:.12;kick();}
  else if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();lookY=THREE.MathUtils.clamp(lookY+(event.key==='ArrowUp'?-.08:.08),-.5,.5);kick();}
 });
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();host.classList.remove('scene-ready');host.dataset.renderer='fallback';renderScene=()=>{};});
 canvas.addEventListener('webglcontextrestored',()=>location.reload());
 addEventListener('resize',resize,{passive:true});host.classList.add('scene-ready');host.dataset.renderer='webgl';resize();
}
