/* Nur oqiw: privacy-preserving notification center.
 * Published announcements are public. Personal replies require the ticket
 * issued when that person sent a contact message. No Telegram dependency.
 * Foreground polling ~28 seconds; this is not OS push/FCM.
 */
(() => {
  'use strict';
  const API='https://nur-apk-api.onrender.com/api';
  const TICKETS='nur-reply-tickets',SEEN='nur-notifications-seen';
  const $=id=>document.getElementById(id);
  const bell='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9M10 21h4"/></svg>';
  const xicon='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14M19 5 5 19"/></svg>';
  const INSTALLED_BUILD=22;
  let items=[],lastSignature='',active=false,waiting=false,previousError='',lastChecked=0;
  let appUpdate=null,lastReleaseCheck=0;
  function readArray(key,max){
    try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string').slice(0,max):[]}catch{return []}
  }
  function persist(key,arr){try{localStorage.setItem(key,JSON.stringify(arr))}catch{}}
  function translated(s){return window.NurI18n?.translate?.(s)||s}
  function addTicket(ticket){
    if(typeof ticket!=='string'||ticket.length<32||ticket.length>80)return;
    const arr=readArray(TICKETS,30);
    persist(TICKETS,[ticket,...arr.filter(x=>x!==ticket)].slice(0,30));
    refresh(true);
  }
  function dateText(input){
    const d=new Date(input);
    if(Number.isNaN(d.getTime()))return '';
    return new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Tashkent'}).format(d);
  }
  function build(){
    if(!$('home')||$('nur-notify-button'))return;
    const phone=document.querySelector('main.phone');
    if(!phone)return;
    const button=document.createElement('button');
    button.type='button';button.id='nur-notify-button';button.className='nur-notify-button';
    button.setAttribute('aria-label','Bildirishnomalar');button.setAttribute('aria-haspopup','dialog');
    button.setAttribute('aria-expanded','false');
    button.innerHTML=bell+'<span id="nur-notify-badge" class="nur-notify-badge" hidden>0</span>';
    button.addEventListener('click',()=>active?close():open());
    phone.append(button);
    const backdrop=document.createElement('div');
    backdrop.id='nur-notify-backdrop';backdrop.className='nur-notify-backdrop';
    backdrop.hidden=true;backdrop.addEventListener('click',close);
    document.body.append(backdrop);
    const pane=document.createElement('section');
    pane.id='nur-notify-panel';pane.className='nur-notify-panel';
    pane.setAttribute('role','dialog');pane.setAttribute('aria-modal','true');
    pane.setAttribute('aria-label','Bildirishnomalar');pane.hidden=true;
    pane.innerHTML='<header class="nur-notify-header"><div><b>Bildirishnomalar</b><small>Admin javoblari va yangi e’lonlar</small></div>'+
      '<button type="button" id="nur-notify-close" aria-label="Yopish">'+xicon+'</button></header>'+
      '<div class="nur-notify-body" id="nur-notify-list"></div>'+
      '<footer class="nur-notify-footer"><button type="button" id="nur-notify-refresh">Yangilash</button>'+
      '<span id="nur-notify-status">Internet orqali yangilanadi</span></footer>';
    document.body.append(pane);
    $('nur-notify-close').addEventListener('click',close);
    $('nur-notify-refresh').addEventListener('click',()=>refresh(true));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active)close()});
    updateList();
  }
  function unread(){
    const seen=new Set(readArray(SEEN,300));
    return items.filter(item=>!seen.has(item.key)).length;
  }
  function badge(){
    const count=unread(),b=$('nur-notify-badge'),button=$('nur-notify-button');
    if(!b||!button)return;
    b.hidden=count===0;
    b.textContent=count>99?'99+':String(count);
    button.setAttribute('aria-label',count?('Bildirishnomalar — '+count+' ta yangi'):'Bildirishnomalar');
  }
  function markSeen(){
    persist(SEEN,[...new Set([...items.map(x=>x.key),...readArray(SEEN,300)])].slice(0,300));
    badge();
  }
  function rowFor(item){
    const article=document.createElement('article');article.className='nur-notify-item';
    const upper=document.createElement('div');upper.className='nur-notify-meta';
    const kind=document.createElement('span');kind.className='nur-notify-kind';
    kind.textContent=translated(item.type==='reply'?'Administrator javobi':item.type==='update'?'Yangi versiya':'E’lon');
    const time=document.createElement('time');time.textContent=dateText(item.created_at);
    upper.append(kind,time);
    const name=document.createElement('b');name.textContent=item.title;
    const msg=document.createElement('p');msg.textContent=item.body;
    article.append(upper,name,msg);
    if(item.type==='update' && typeof item.url==='string' &&
       /^https:\/\/github\.com\/begdulla707-source\/nur-apk\/releases\/download\//.test(item.url)){
      const link=document.createElement('a');
      link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';
      link.className='nur-notify-download';
      link.textContent=translated('Yangilangan APKni yuklab olish');
      article.append(link);
    }
    return article;
  }
  function updateList(){
    const root=$('nur-notify-list');if(!root)return;
    root.replaceChildren();
    if(!items.length){
      const empty=document.createElement('p');
      empty.className='nur-notify-empty';empty.textContent=translated('Hozircha bildirishnoma yo‘q.');
      root.append(empty);
    } else for(const item of items)root.append(rowFor(item));
    if(previousError){
      const warning=document.createElement('p');
      warning.className='nur-notify-warning';warning.textContent=previousError;root.append(warning);
    }
    badge();
  }
  function open(){
    build();active=true;
    $('nur-notify-backdrop').hidden=false;
    $('nur-notify-panel').hidden=false;
    $('nur-notify-button').setAttribute('aria-expanded','true');
    markSeen();updateList();refresh(true);
  }
  function close(){
    active=false;
    if($('nur-notify-backdrop'))$('nur-notify-backdrop').hidden=true;
    if($('nur-notify-panel'))$('nur-notify-panel').hidden=true;
    $('nur-notify-button')?.setAttribute('aria-expanded','false');
  }
  async function refresh(force=false){
    if(waiting||document.hidden||!navigator.onLine)return;
    if(!force&&Date.now()-lastChecked<25000)return;
    lastChecked=Date.now();waiting=true;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7800);
    try{
      const response=await fetch(API+'/notifications/sync',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({tickets:readArray(TICKETS,30)}),
        cache:'no-store',signal:controller.signal
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||'Server javob bermadi');
      const feed=[
        ...(appUpdate?[appUpdate]:[]),
        ...(data.notices||[]).map(n=>({key:'n:'+n.id,type:'notice',
          title:String(n.title||'E’lon'),body:String(n.body||''),created_at:n.created_at})),
        ...(data.replies||[]).map(r=>({key:'r:'+r.id,type:'reply',
          title:'Administrator javobi · №'+r.reference,body:String(r.body||''),created_at:r.created_at}))
      ].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,120);
      const signature=JSON.stringify(feed);
      previousError='';
      if(signature!==lastSignature){lastSignature=signature;items=feed;updateList()}
      if(active){markSeen()}
      const status=$('nur-notify-status');if(status)status.textContent=translated('Yangilandi');
    }catch(err){
      previousError='Yangilanishni olishda xatolik. Internet va serverni tekshiring.';
      if(active)updateList();
      const status=$('nur-notify-status');if(status)status.textContent=translated('Serverga ulanib bo‘lmadi');
    }finally{clearTimeout(timer);waiting=false}
  }
  async function checkRelease(force=false){
    if(document.hidden||!navigator.onLine)return;
    if(!force&&Date.now()-lastReleaseCheck<30*60*1000)return;
    lastReleaseCheck=Date.now();
    try{
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),6500);
      let res;
      try{
        res=await fetch('https://api.github.com/repos/begdulla707-source/nur-apk/releases?per_page=12',
          {cache:'no-store',headers:{Accept:'application/vnd.github+json'},signal:controller.signal});
      }finally{clearTimeout(timeout)}
      if(!res.ok)return;
      const releases=await res.json();
      if(!Array.isArray(releases))return;
      const builds=releases.filter(x=>!x.draft).map(x=>({
        number:Number((x.tag_name||'').match(/^build-(\d+)$/)?.[1]||0),
        asset:(x.assets||[]).find(a=>a.name==='Nur_oqiw.apk'),
        published_at:x.published_at
      })).filter(x=>x.number>INSTALLED_BUILD&&x.asset?.browser_download_url);
      builds.sort((a,b)=>b.number-a.number);
      if(builds.length){
        const newest=builds[0];
        appUpdate={key:'u:'+newest.number,type:'update',
          title:'Yangi ilova versiyasi mavjud',
          body:'Nur oqiw ilovasi yangilandi. Xavfsiz yuklab olish uchun rasmiy GitHub Release sahifasini oching.',
          created_at:newest.published_at||new Date().toISOString(),url:newest.asset.browser_download_url};
      }else appUpdate=null;
      // Update the rendered feed without waiting for the next network poll.
      lastChecked=0;refresh(true);
    }catch(err){/* An update lookup must never interrupt messages. */}
  }
  function init(){
    build();refresh(true);checkRelease(true);
    setInterval(()=>{if(!document.hidden){refresh();checkRelease()}},28000);
    addEventListener('online',()=>{refresh(true);checkRelease(true)},{passive:true});
    addEventListener('visibilitychange',()=>{if(!document.hidden){refresh(true);checkRelease()}},{passive:true});
  }
  window.NurNotifications={addTicket,refresh,open,close,isOpen:()=>active};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();