const menu=document.getElementById('site-menu');
const menuButton=document.querySelector('.menu-toggle');
const closeMenu=()=>{menu?.close();document.body.classList.remove('menu-open');menuButton?.setAttribute('aria-expanded','false');};
menuButton?.addEventListener('click',()=>{menu.showModal();document.body.classList.add('menu-open');menuButton.setAttribute('aria-expanded','true');});
document.querySelector('.menu-close')?.addEventListener('click',closeMenu);
menu?.addEventListener('close',()=>{document.body.classList.remove('menu-open');menuButton?.setAttribute('aria-expanded','false');});
menu?.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});

const filters=document.querySelectorAll('[data-filter]');
filters.forEach(button=>button.addEventListener('click',()=>{
 filters.forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
 let total=0;document.querySelectorAll('[data-category]').forEach(project=>{const show=button.dataset.filter==='all'||project.dataset.category===button.dataset.filter;project.hidden=!show;if(show)total++;});
 document.querySelector('.filter-count').textContent=String(total).padStart(2,'0')+` PROJECT${total===1?'':'S'}`;
}));

const inquiry=document.getElementById('inquiry-form');
document.querySelectorAll('[data-year]').forEach(element=>element.textContent=new Date().getFullYear());
document.querySelectorAll('.faq-item').forEach((item,index)=>{
 const trigger=item.querySelector('.faq-q');if(!trigger)return;
 if(trigger.tagName!=='BUTTON'){trigger.setAttribute('role','button');trigger.tabIndex=0;}
 if(index===0)item.classList.add('open');
 const sync=()=>trigger.setAttribute('aria-expanded',String(item.classList.contains('open')));sync();
 const toggle=()=>{item.classList.toggle('open');sync();};trigger.addEventListener('click',toggle);
 if(trigger.tagName!=='BUTTON')trigger.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle();}});
});
if(inquiry){
 const chosen=new URLSearchParams(location.search).get('type');
 if(chosen){const input=[...inquiry.querySelectorAll('[name=project]')].find(el=>el.value===chosen);if(input)input.checked=true;}
 inquiry.addEventListener('submit',async event=>{
  event.preventDefault();if(!inquiry.reportValidity())return;
  const status=inquiry.querySelector('.form-status');const button=inquiry.querySelector('[type=submit]');const fields=new FormData(inquiry);
  if(fields.get('company'))return;
  if(!['voxelbox.org','www.voxelbox.org'].includes(location.hostname)){
   status.className='form-status';status.textContent='This is a local preview, so your enquiry has not been sent. You can email admin@voxelbox.org to start the conversation.';return;
  }
  const message=`Project: ${fields.get('project')}\nBudget: ${fields.get('budget')||'To discuss'}\nTiming: ${fields.get('timing')||'To discuss'}\n\n${fields.get('message')}`;
  const payload={name:String(fields.get('name')).trim(),email:String(fields.get('email')).trim(),message,company:''};
  button.disabled=true;status.className='form-status';status.textContent='Sending your idea…';
  try{
   const response=await fetch('https://demos.voxelbox.org/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
   const body=await response.json().catch(()=>null);
   if(response.ok&&body?.ok){status.className='form-status success';status.textContent='Your idea is on its way. Thanks for getting in touch — we’ll reply by email.';inquiry.reset();}
   else{status.className='form-status error';status.textContent=response.status===429?'A few too many requests right now. Please try again later, or email admin@voxelbox.org.':'We couldn’t confirm your enquiry was sent. Your message is still here. Please try again or email admin@voxelbox.org.';}
  }catch{status.className='form-status error';status.textContent='We couldn’t confirm your enquiry was sent. Your message is still here. Please try again or email admin@voxelbox.org.';}
  finally{button.disabled=false;}
 });
}

// Guard retained forms as well: previews never send enquiries or signups.
if(!['voxelbox.org','www.voxelbox.org'].includes(location.hostname)){
 document.addEventListener('submit',event=>{
  if(event.target.id==='inquiry-form')return;
  if(event.target.matches('[data-contact-form],[data-apply-form],[data-beta-form]')){
   event.preventDefault();event.stopImmediatePropagation();
   const status=event.target.querySelector('.form-status');if(status)status.textContent='Local preview: nothing has been sent. Please email admin@voxelbox.org.';
  }
 },true);
}
