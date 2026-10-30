async function getJSON(url){const response=await fetch(url);if(!response.ok)throw Error(response.status);return response.json();}
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


if(['voxelbox.org','www.voxelbox.org'].includes(location.hostname)){initPush();}else{const button=document.querySelector('[data-push-btn]');if(button)button.disabled=true;const status=document.querySelector('[data-push-status]');if(status)status.textContent='Local preview: notification subscriptions are disabled.';}
