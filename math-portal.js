/* Nur oqiw Mathematics 2–7. Server data is authoritative.
 * Dense monthly rank (1,1,2), dated results, DQ attendance, manual paid flags,
 * multi-file Excel/CSV review, reconnecting revision polling + optional SSE.
 */
(() => {
 'use strict';
 const API='https://nur-apk-api.onrender.com/api';
 const $=id=>document.getElementById(id);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const tick='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" stroke-width="2.4"/></svg>';
 const clock='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
 const pencil='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="m4 20 4.5-.8L20 7.5 16.5 4 5 15.5 4 20Z"/></svg>';
 const arrow='<svg class="m-chevron" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>';
 let pageDate='',month='',data=null,loading=false,lastSuccess=0,pollInFlight=false,eventSource=null;
 let ctxAdmin=null,draft=[],draftWarnings=[],importFiles=[],adminMode='math',adminBound=false,uploadBusy=false;
 let minimumPhotoRows=0, datePinned=false, monthPinned=false, ocrBatchHandle=null, pendingImages=0;
 function today(){
   const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
   const val=k=>parts.find(x=>x.type===k)?.value||'';
   return val('year')+'-'+val('month')+'-'+val('day');
 }
 pageDate=today();month=pageDate.slice(0,7);
 function readAdminToken(){try{return sessionStorage.getItem('nur-apk-admin-session')||''}catch{return ''}}
 async function api(path,options={}){
   const headers={'Accept':'application/json'};
   if(options.admin){
     const token=readAdminToken();
     if(!token)throw Error('Admin sifatida qayta kiring');
     headers['Authorization']='Bearer '+token;
   }
   if(options.body!==undefined && !(options.body instanceof FormData))headers['Content-Type']='application/json';
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
   try{
     const response=await fetch(API+path,{
       method:options.method||'GET',headers,
       body:options.body===undefined?undefined:options.body instanceof FormData?options.body:JSON.stringify(options.body),
       cache:'no-store',signal:controller.signal
     });
     const result=await response.json().catch(()=>({}));
     if(!response.ok)throw Error(result.error||'Ma’lumotni olishda xatolik');
     return result;
   }catch(e){
     if(e.name==='AbortError')throw Error('So‘rov kechikdi. Qayta urinib ko‘ring');
     if(e instanceof TypeError)throw Error('Ulanishni tekshiring va qayta urinib ko‘ring');
     throw e;
   }finally{clearTimeout(timeout)}
 }
 function notice(message){if(typeof window.toast==='function')window.toast(message);else{
   const el=document.createElement('div');el.className='floating-toast';el.textContent=message;
   document.body.append(el);setTimeout(()=>el.remove(),3400);
 }}
 function fixed(n){return Number(n||0).toLocaleString('uz-UZ')}
 function prettyDay(s){if(!s)return '';const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);return m?m[3]+'.'+m[2]+'.'+m[1]:s}
 function pill(paid){return '<span class="nur-paid-pill'+(paid?'':' pending')+'">'+(paid?tick:clock)+
   (paid?'To‘lov qilindi':'Kutilmoqda')+'</span>'}
 function setupPages(){
   const home=$('home');if(!home)return;
   const oldList=home.querySelector('.content .list');
   if(oldList){
     const card=document.createElement('button');card.className='nur-math-home';card.type='button';
     card.innerHTML='<span class="m-symbol"><svg viewBox="0 0 24 24"><path d="M4 20V4m0 16h17M7 16l4-4 4 2 5-9"/></svg></span>'+
       '<span class="m-copy"><b>2–7-sinflar · MATEMATIKA</b><small id="nur-math-home-caption">Barcha o‘quvchilar va natijalar</small></span>'+arrow;
     card.addEventListener('click',()=>window.go?.('results'));
     oldList.replaceChildren(card);
   }
   const heads=home.querySelectorAll('.section-head');
   if(heads[0]){heads[0].querySelector('h2').textContent='MATEMATIKA';heads[0].querySelector('small').textContent='2–7-sinflar'}
   const stats=home.querySelectorAll('.stat');
   if(stats[1]){stats[1].querySelector('small').textContent='YO‘NALISH';stats[1].querySelector('strong').textContent='1';stats[1].querySelector('span').textContent='2–7-sinflar'}
   const pay=home.querySelector('.payment-home-card');
   if(pay){
     pay.setAttribute('onclick','');
     pay.onclick=()=>window.go?.('math-monthly');
     pay.querySelector('strong').textContent='Oylik to‘lovlar';
     pay.querySelector('small').textContent='To‘lov qilindi yoki kutilmoqda';
   }
   home.querySelector('.note')?.remove();
   for(const [page,description] of [
     ['rating','Oylik to‘plangan ballar va davomat · teng ball — teng o‘rin'],
     ['results','Bugungi natijalar va oldingi sanalardagi testlar']]){
     const element=$(page);
     if(!element)continue;
     const p=element.querySelector('.desc');if(p)p.textContent=description;
     element.querySelector('.filters')?.remove();
     element.querySelector('#'+(page==='rating'?'ratingEmpty':'resultsEmpty'))?.remove();
     const region=document.createElement('div');region.id='nur-math-'+page;
     region.className='nur-math-initial';region.setAttribute('aria-label','Natijalar');
     element.append(region);
   }
   const phone=document.querySelector('main.phone');
   const monthly=document.createElement('section');
   monthly.id='math-monthly';monthly.className='view subpage';
   monthly.innerHTML='<button class="back" type="button">Bosh menyu</button><h2>Oylik to‘lovlar</h2>'+
     '<p class="desc">Admin tomonidan belgilangan holat. Pul o‘tkazilganini avtomatik tasdiqlamaydi.</p>'+
     '<div id="nur-math-monthly" class="nur-math-initial" aria-label="Oylik to‘lovlar"></div>';
   monthly.querySelector('.back').addEventListener('click',()=>window.go?.('home'));
   const bar=phone?.querySelector('.tabbar');if(bar)bar.before(monthly);
   const modal=document.createElement('div');modal.id='nur-math-profile';modal.className='nur-math-profile';modal.hidden=true;
   modal.innerHTML='<div class="nur-math-profile-card" role="dialog" aria-modal="true" aria-label="O‘quvchi natijalari">'+
     '<header><h2>O‘quvchi profili</h2><button type="button" aria-label="Yopish">×</button></header>'+
     '<div id="nur-math-profile-content"></div></div>';
   modal.querySelector('button').onclick=()=>{modal.hidden=true};
   modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});
   document.body.append(modal);
   const settings=document.createElement('section');
   settings.id='nur-settings';settings.className='view subpage';
   settings.innerHTML='<button class="back" type="button">Bosh menyu</button>'+
      '<h2>Sozlamalar</h2><p class="desc">Ilova ko‘rinishi va tungi rejim.</p>'+
      '<div id="nur-appearance-settings"></div>';
   settings.querySelector('.back').addEventListener('click',()=>window.go?.('home'));
   if(bar)bar.before(settings);
   const open=document.createElement('button');open.className='nur-settings-open';open.type='button';
   open.innerHTML='<span>Sozlamalar</span><span>›</span>';
   open.addEventListener('click',()=>{window.closeMenu?.();window.go?.('nur-settings')});
   const drawer=$('drawer'),language=drawer?.querySelector('.language-panel');
   if(language)language.after(open);else drawer?.append(open);
   
   renderAppearance();
 }
 async function reload(silent=false){
   if(loading||document.hidden||!navigator.onLine)return;
   loading=true;
   try{
     // Unpinned screens follow the newest published test in a single request.
     // Explicitly selected dates remain fixed.
     const query='?date='+encodeURIComponent(datePinned?pageDate:'latest')+
       ((datePinned||monthPinned)?'&month='+encodeURIComponent(month):'');
     const response=await api('/math/overview'+query);
     if(!datePinned)pageDate=response.day;
     if(!monthPinned&&!datePinned)month=response.month;
     const changed=!data||data.revision!==response.revision||
       data.day!==response.day||data.month!==response.month;
     data=response;lastSuccess=Date.now();
     if(changed)render();
     
   }catch(err){
     if(!silent&&!data)for(const id of ['nur-math-rating','nur-math-results','nur-math-monthly']){
        const region=$(id);if(!region)continue;
        region.replaceChildren();
        const retry=document.createElement('button');
        retry.type='button';retry.className='nur-math-retry';
        retry.textContent='↻';retry.title='Qayta urinish';
        retry.setAttribute('aria-label','Qayta urinish');
        retry.addEventListener('click',()=>reload(false));
        const msg=document.createElement('div');msg.className='nur-math-error-message';
        msg.textContent='Ma’lumotlar hozircha ko‘rsatilmayapti. Qayta urinib ko‘ring.';
        region.append(msg,retry);
      }
   }finally{loading=false}
 }
 async function refreshRevision(){
   if(pollInFlight||document.hidden||!navigator.onLine)return;
   pollInFlight=true;
   try{
     const r=await api('/math/revision');
     if(!data||r.revision!==data.revision)await reload(true);
   }catch(_){/* polling is resilient; reconnect on next interval */}
   finally{pollInFlight=false}
 }
 function live(){
   if(typeof EventSource==='function'){
     try{
       const stream=new EventSource(API+'/math/events');
       eventSource=stream;
       stream.addEventListener('revision',()=>reload(true));
       stream.onerror=()=>{stream.close();if(eventSource===stream)eventSource=null};
     }catch(_){}
   }
   setInterval(()=>{if(!document.hidden)refreshRevision()},6500);
   document.addEventListener('visibilitychange',()=>{if(!document.hidden)reload(true)});
   addEventListener('online',()=>reload(true),{passive:true});
 }
 function render(){
   if(!data)return;
   const total=$('home')?.querySelector('.stat strong');
   if(total)total.textContent=String(data.total_students||0);
   const caption=$('nur-math-home-caption');
   if(caption)caption.textContent=(data.total_students||0)+' ta o‘quvchi · yagona matematika ro‘yxati';
   renderResults();renderRating();renderMonthly();
 }
 function renderResults(){
   const root=$('nur-math-results');if(!root||!data)return;
   root.className='';
   const dates=data.dates||[];
   const current=data.tests||[];
   const count=current.reduce((n,t)=>n+t.rows.length,0);
   root.innerHTML='<div class="nur-math-tools"><label><span style="font-size:11px">Sana</span> '+
      '<input id="nur-math-date" type="date" value="'+esc(pageDate)+'"></label>'+ 
      '<button type="button" id="nur-results-latest" class="nur-latest-button">Oxirgi test</button>'+
      '</div>'+
     '<div id="nur-date-links" class="nur-date-links"></div>'+
     '<div class="nur-stat-row"><div class="nur-stat-box"><b>'+current.length+'</b><small>Test</small></div>'+
     '<div class="nur-stat-box"><b>'+count+'</b><small>Kiritilgan natija</small></div>'+
     '<div class="nur-stat-box"><b>'+current.reduce((n,t)=>n+t.rows.filter(r=>r.status==='dq').length,0)+
        '</b><small>DQ</small></div></div>'+
     '<div id="nur-results-tables"></div>';
   $('nur-math-date').addEventListener('change',e=>{if(!e.target.value)return;datePinned=true;monthPinned=false;pageDate=e.target.value;month=pageDate.slice(0,7);reload(true)});
   $('nur-results-latest').addEventListener('click',()=>{datePinned=false;monthPinned=false;reload(true)});
   const links=$('nur-date-links');
   const unique=[...new Set(dates.map(d=>d.date))].slice(0,30);
   for(const day of unique){
     const b=document.createElement('button');b.type='button';
     b.className=day===pageDate?'on':'';
     b.textContent=prettyDay(day);
     b.addEventListener('click',()=>{datePinned=true;monthPinned=false;pageDate=day;month=day.slice(0,7);reload(true)});
     links.append(b);
   }
   const table=$('nur-results-tables');
   if(!current.length){
     table.innerHTML='<div class="nur-math-empty">Bu sana uchun natija saqlanmagan. Oldingi sanani tanlashingiz mumkin.</div>';
     return;
   }
   for(const t of current){
     const head=document.createElement('div');head.className='nur-math-subhead';
     head.innerHTML='<b>'+esc(t.title)+'</b><small>'+t.questions+' savol</small>';
     table.append(head);
     const list=document.createElement('div');list.className='nur-score-list';
     for(const x of t.rows){
       const row=document.createElement('div');
       row.className='nur-score-row'+(x.status==='dq'?' dq':'');
       const correct=x.status==='dq'?'<span class="nur-mini-dq">DQ</span>':
           '<div class="score">'+x.correct_answers+' / '+t.questions+
           '<small>'+((x.correct_answers/t.questions)*100).toFixed(1)+'%</small></div>';
       row.innerHTML='<div class="name">'+esc(x.full_name)+
         '<small>'+(x.grade?x.grade+'-sinf · ':'')+(x.status==='dq'?'Qatnashmagan':'Qatnashgan')+
         '</small></div>'+correct;
       list.append(row);
     }
     table.append(list);
   }
 }
 function renderRating(){
   const root=$('nur-math-rating');if(!root||!data)return;
   root.className='';
   const ranking=[...data.students].sort((a,b)=>(a.rank??99999)-(b.rank??99999)||
     a.full_name.localeCompare(b.full_name));
   root.innerHTML='<div class="nur-math-tools"><label style="font-size:11px">Reyting oyi '+
     '<input id="nur-rank-month" type="month" value="'+esc(month)+'"></label>'+
     '<span class="nur-math-live">Avtomatik reyting</span></div>'+
     '<div class="nur-math-subhead"><b>Umumiy oylik reyting</b><small>Teng ball — teng o‘rin</small></div>'+
     '<div id="nur-rank-rows" class="nur-leaderboard"></div>';
   $('nur-rank-month').addEventListener('change',e=>{if(!e.target.value)return;monthPinned=true;month=e.target.value;reload(true)});
   const list=$('nur-rank-rows');
   if(!ranking.length){list.innerHTML='<div class="nur-math-empty">Reyting uchun hali o‘quvchi qo‘shilmagan.</div>';return}
   for(const x of ranking){
     const button=document.createElement('button');button.type='button';
     button.className='nur-rank-row'+(x.rank&&x.rank<=3?' rank-'+x.rank:'');
     button.innerHTML='<span class="rank">'+(x.rank??'—')+'</span><span class="name">'+esc(x.full_name)+
       '<small>Davomat '+x.attended+'/'+x.attendance_total+' · DQ '+x.dq+
       ' · Jami '+fixed(x.total_points)+' ball</small></span>'+
       '<span class="points">'+fixed(x.monthly_points)+'<small>oylik ball</small></span>';
     button.addEventListener('click',()=>openProfile(x));
     list.append(button);
   }
 }
 function renderMonthly(){
   const root=$('nur-math-monthly');if(!root||!data)return;
   root.className='';
   root.innerHTML='<div class="nur-math-tools"><label style="font-size:11px">To‘lov oyi '+
      '<input type="month" id="nur-payment-month" value="'+esc(month)+'"></label>'+
      '<small style="color:var(--muted)">Admin tasdiqlaydi</small></div>'+
      '<div id="nur-payment-rows" class="nur-monthly-list"></div>';
   $('nur-payment-month').addEventListener('change',e=>{if(!e.target.value)return;monthPinned=true;month=e.target.value;reload(true)});
   const list=$('nur-payment-rows');
   if(!data.students.length){list.innerHTML='<div class="nur-math-empty">Hozircha o‘quvchilar yo‘q.</div>';return}
   for(const x of data.students){
     const row=document.createElement('div');row.className='nur-payment-row';
     row.innerHTML='<div class="name">'+esc(x.full_name)+'<small>'+(x.grade?x.grade+'-sinf · ':'')+
       (x.amount_uzs?fixed(x.amount_uzs)+' so‘m':'Summa belgilanmagan')+
       '</small></div>'+pill(x.paid);
     list.append(row);
   }
 }
 async function openProfile(st){
   const modal=$('nur-math-profile');
   if(!modal)return;
   modal.hidden=false;
   const root=$('nur-math-profile-content');
   root.replaceChildren();
   try{
     const details=await api('/math/student/'+st.id);
     let content='<div class="nur-stat-row">'+
       '<div class="nur-stat-box"><b>'+(st.rank??'—')+'</b><small>O‘rin</small></div>'+
       '<div class="nur-stat-box"><b>'+fixed(st.monthly_points)+'</b><small>Oylik ball</small></div>'+
       '<div class="nur-stat-box"><b>'+fixed(st.total_points)+'</b><small>Jami ball</small></div></div>'+
       '<p style="font-size:12px;margin:13px 0;color:var(--muted)">Davomat '+
         st.attended+'/'+st.attendance_total+' · DQ: '+st.dq+'</p>'+
       '<div class="nur-math-subhead"><b>Natijalar tarixi</b></div>';
     for(const h of details.history||[]){
       content+='<div class="nur-math-profile-row"><span>'+prettyDay(h.held_on)+' · '+esc(h.title)+
         '</span><span>'+(h.status==='dq'?'DQ':h.correct_answers+'/'+h.question_count)+'</span></div>';
     }
     if(!details.history?.length)content+='<div class="nur-math-empty">Natijalar yo‘q.</div>';
     root.innerHTML=content;
     modal.querySelector('header h2').textContent=details.student.full_name;
   }catch(e){root.textContent=e.message}
 }
 function renderAppearance(){
   const root=$('nur-appearance-settings');if(!root)return;
   let saved='emerald';
    try{saved=localStorage.getItem('nur-accent')||'emerald'}catch(_){}
    root.innerHTML='<div class="nur-math-panel"><h3>Ilova mavzusi</h3>'+
      '<p>Liquid Glass ko‘rinish, kunduzgi va tungi rejim.</p>'+
      '<div class="nur-settings-options" id="nur-theme-options">'+
      [['light','Kunduzgi'],['dark','Tungi']].map(([k,t])=>'<button type="button" data-theme="'+k+'">'+t+'</button>').join('')+
      '</div></div><div class="nur-math-panel"><h3>Ichki ranglar</h3>'+
      '<div class="nur-settings-options" id="nur-accent-options">'+
      [['emerald','Zumrad','#227351'],['blue','Ko‘k','#357bba'],['graphite','Grafit','#54636b']].map(([k,t,c])=>
       '<button type="button" data-accent="'+k+'" class="'+(saved===k?'chosen':'')+'">'+
       '<span class="swatch" style="display:block;background:'+c+'"></span>'+t+'</button>').join('')+'</div></div>';
    for(const b of root.querySelectorAll('button[data-theme]')){
     b.classList.toggle('chosen',b.dataset.theme===(document.body.classList.contains('dark')?'dark':'light'));
     b.addEventListener('click',()=>{window.setTheme?.(b.dataset.theme==='dark');renderAppearance()});
   }
   for(const b of root.querySelectorAll('button[data-accent]'))b.addEventListener('click',()=>{
     document.body.dataset.nurAccent=b.dataset.accent;
     try{localStorage.setItem('nur-accent',b.dataset.accent)}catch(_){}
     renderAppearance();
   });
   
 }
 function bindAdmin(root,ctx){
   ctxAdmin=ctx;
   if(root.dataset.nurMathEvents)return;
   root.dataset.nurMathEvents='1';
   root.addEventListener('click',async event=>{
     const button=event.target.closest('button[data-math-action]');
     if(!button)return;
     event.preventDefault();event.stopPropagation();
     const action=button.dataset.mathAction;
     try{
       if(action==='add-row'){
         draft.unshift({name:'',correct:null,status:'unresolved',grade:null});
         renderDraft(root);return;
       }
       if(action==='resolve'){
         const i=Number(button.dataset.idx);if(!draft[i])return;
         draft[i].status=button.dataset.status;
         draft[i].correct=button.dataset.status==='dq'?null:0;
         renderDraft(root);return;
       }
       if(action==='mark-payment'){
         button.disabled=true;
         const card=button.closest('[data-pay-student]');
         const id=Number(card?.dataset.payStudent);
         const amount=card?.querySelector('input[name=amount]')?.value||'';
         const paid=button.dataset.nextPaid==='yes';
         await api('/admin/math/payment',{admin:true,method:'POST',body:{
           student_id:id,month,paid,amount_uzs:amount===''?null:Number(amount)}});
         notice(paid?'To‘lov qilindi deb belgilandi':'Kutilmoqda deb belgilandi');
         await reload(true);await renderAdmin(root,ctxAdmin,'math-payments');return;
       }
       if(action==='edit-student'){
         const id=Number(button.dataset.student);
         const existing=data?.students?.find(x=>x.id===id);
         const name=prompt('O‘quvchining ism-familiyasi',existing?.full_name||'');
         if(!name)return;
         const grade=prompt('Sinf (2–7, bo‘sh bo‘lishi mumkin)',String(existing?.grade||''));
         if(grade===null)return;
         await api('/admin/math/students/'+id,{admin:true,method:'PATCH',
           body:{name:name.trim(),grade:grade===''?null:Number(grade)}});
         notice('O‘quvchi yangilandi');await reload(true);await renderAdmin(root,ctxAdmin,'math-students');
       }
     }catch(e){notice(e.message);button.disabled=false}
   });
   root.addEventListener('input',event=>{
     const input=event.target.closest('[data-math-index]');
     if(!input)return;
     const i=Number(input.dataset.mathIndex);
     if(!draft[i])return;
     const prop=input.dataset.mathField;
     if(prop==='correct'){
       draft[i].correct=input.value===''?null:Number(input.value);
       if(input.value!=='')draft[i].status='present';
     }else if(prop==='grade')draft[i].grade=input.value===''?null:Number(input.value);
     else if(prop==='name')draft[i].name=input.value;
     else if(prop==='status'){
       draft[i].status=input.value;
       if(input.value==='dq')draft[i].correct=null;
     }
     updateWarningCount(root);
   });
   root.addEventListener('change',async event=>{
     const input=event.target;
     if(input.matches('input[data-math-files]')){
       await previewFiles(root,input.files);
     }
     if(input.matches('select[data-math-index]'))renderDraft(root);
   });
   root.addEventListener('submit',async event=>{
     const form=event.target.closest('form[data-math-form]');
     if(!form)return;
     event.preventDefault();event.stopPropagation();
     const type=form.dataset.mathForm;
     const button=form.querySelector('button[type=submit]');if(button)button.disabled=true;
     try{
       if(type==='new-student'){
         const payload=Object.fromEntries(new FormData(form));
         await api('/admin/math/students',{admin:true,method:'POST',body:{
           name:payload.name,grade:payload.grade===''?null:Number(payload.grade)}});
         form.reset();notice('O‘quvchi qo‘shildi');await reload(true);await renderAdmin(root,ctxAdmin,'math-students');
       }
       if(type==='commit'){
         const value=Object.fromEntries(new FormData(form));
         const questions=Number(value.question_count);
         if(!Number.isInteger(questions)||questions<1||questions>200)throw Error('Savol 1–200 bo‘lsin');
         const pending=draft.filter(x=>x.status==='unresolved'||(x.status==='present' &&
           (x.correct===null||x.correct===''||!Number.isInteger(Number(x.correct)))));
         if(pending.length)throw Error(pending.length+' ta sariq natijani tekshiring (DQ yoki 0, yoki ball).');
         const named=draft.filter(x=>x.name.trim());
         if(!named.length)throw Error('Kamida bitta o‘quvchi kiriting');
         if(minimumPhotoRows && named.length<minimumPhotoRows)
           throw Error('Rasm jadvalida '+minimumPhotoRows+' nafar o‘quvchi bor, lekin '+named.length+' ta ism kiritilgan. Yetishmaganlarni qo‘shing.');
         if(new Set(named.map(x=>x.name.trim().toLowerCase())).size!==named.length)
           throw Error('Bir xil ism takrorlangan; qatorlarni tahrirlang');
         if(named.some(x=>x.status==='present'&&Number(x.correct)>questions))
           throw Error('Ball savollar sonidan katta');
         const post=await api('/admin/math/commit',{admin:true,method:'POST',
           body:{date:value.date,title:value.title,question_count:questions,
             source:importFiles.length?'bulk':'manual',
             entries:named.map(x=>({name:x.name.trim(),status:x.status,
               correct:x.status==='dq'?null:Number(x.correct),
               grade:x.grade===null?null:Number(x.grade)}))}});
         draft=[];importFiles=[];draftWarnings=[];minimumPhotoRows=0;pendingImages=0;
         notice(post.saved+' ta natija saqlandi. Reyting barcha ulangan ilovalarda yangilanadi.');
         datePinned=false;monthPinned=false;pageDate=value.date;month=pageDate.slice(0,7);
         await reload(true);await renderAdmin(root,ctxAdmin,'math');
       }
     }catch(e){notice(e.message)}
     finally{if(button)button.disabled=false}
   });
   root.addEventListener('dragover',e=>{
     if(e.target.closest('.nur-math-upload')){e.preventDefault();e.dataTransfer.dropEffect='copy'}
   });
   root.addEventListener('drop',async e=>{
     if(!e.target.closest('.nur-math-upload'))return;
     e.preventDefault();await previewFiles(root,e.dataTransfer.files);
   });
 }
 function updateWarningCount(root){
   const missing=draft.filter(x=>!x.name.trim()||x.status==='unresolved'||
     (x.status==='present'&&(x.correct===null||x.correct===''))).length;
   const count=root.querySelector('#nur-math-warning-count');
   if(count)count.textContent=missing?missing+' ta natija tekshirishni kutmoqda':'Barcha qatorlar tekshirildi';
 }
 function addImportWarning(message){
   const value=String(message||'').trim().slice(0,180);
   if(!value)return;
   draftWarnings=[value];
 }
 function mergeDraftRows(rows){
   const key=v=>String(v||'').trim().toLocaleLowerCase('uz').replace(/\s+/g,' ');
   const index=new Map(draft.map((r,i)=>[key(r.name),i]));
   let conflicts=0;
   for(const row of rows||[]){
     if(!row||!key(row.name))continue;
     const k=key(row.name),i=index.get(k);
     if(i===undefined){
       index.set(k,draft.length);
       draft.push({name:row.name,grade:row.grade??null,
         status:row.status||'unresolved',correct:row.correct??null});
     }else{
       const old=draft[i];
       if(old.correct!==null && row.correct!==null &&
          Number(old.correct)!==Number(row.correct)){
         old.correct=null;old.status='unresolved';conflicts++;
       }else if(old.correct===null&&row.correct!==null&&old.status==='unresolved'){
         old.correct=row.correct;old.status=row.status||'present';
       }
     }
   }
   if(conflicts)addImportWarning(conflicts+' ta takroriy ismdagi ball farq qiladi.');
 }
 function normalizeStudentName(value){
   return String(value||'').toLocaleLowerCase('uz')
     .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
     .replace(/[ʻ‘’ʼ\x27]/g,'').replace(/[^a-z0-9\s]/g,'')
     .replace(/\s+/g,' ').trim();
 }
 function editDistance(a,b){
   if(a===b)return 0;
   if(Math.abs(a.length-b.length)>5)return 99;
   let prev=Array.from({length:b.length+1},(_,i)=>i);
   for(let i=1;i<=a.length;i++){
     const cur=[i];
     for(let j=1;j<=b.length;j++)
       cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
     prev=cur;
   }
   return prev[b.length];
 }
 // Compare OCR suggestions to the existing verified roster. Never guess
 // attendance and never silently insert a misspelled duplicate student.
 function alignPhotoNames(rows){
   const known=Array.isArray(data?.students)?data.students:[];
   if(!known.length)return rows||[];
   let unmatched=0,corrected=0;
   const mapped=(rows||[]).map(row=>{
     const original=normalizeStudentName(row.name);
     if(!original||original.split(' ').length<2){
       unmatched++;return {...row,status:'unresolved'};
     }
     const ranked=known.map(x=>({x,dist:editDistance(original,normalizeStudentName(x.full_name))}))
       .sort((a,b)=>a.dist-b.dist);
     const first=ranked[0],second=ranked[1];
     const threshold=Math.max(1,Math.min(3,Math.floor(original.length*.13)));
     if(first&&first.dist<=threshold&&(!second||second.dist-first.dist>=2)){
       if(first.dist)corrected++;
       return {...row,name:first.x.full_name,grade:row.grade??first.x.grade??null};
     }
     unmatched++;return {...row,status:'unresolved'};
   });
   if(unmatched||corrected)addImportWarning(
     (corrected?corrected+' ta ism ro‘yxat bilan moslashtirildi. ':'')+
     (unmatched?unmatched+' ta ismni tekshirish kerak.':''));
   return mapped;
 }
 function scheduleDraftRender(){
   if(ocrBatchHandle!==null)clearTimeout(ocrBatchHandle);
   ocrBatchHandle=setTimeout(()=>{
     ocrBatchHandle=null;
     const root=$('admin-tab-content');if(!root)return;
     renderDraft(root);
     const el=root.querySelector('#nur-file-status');
     if(el)el.textContent=(pendingImages?pendingImages+' ta rasm o‘qilmoqda · ':'')+
       draft.length+' ta o‘quvchi · natijalarni tekshiring';
   },240);
 }
 // On-device recognition produces editable suggestions; never auto-publishes.
 window.NurImageOCRDeliver=function(payload){
   pendingImages=Math.max(0,pendingImages-1);
   const filename=String(payload?.file||'Rasm').slice(0,150);
   if(payload?.error)addImportWarning(filename+': rasmni o‘qib bo‘lmadi.');
   else if(!window.NurOCR?.parse)addImportWarning('OCR moduli yuklanmadi.');
   else try{
     const result=window.NurOCR.parse(payload);
     const summary=result.summary||{};
     if(Number.isInteger(summary.present)&&Number.isInteger(summary.absent))
       minimumPhotoRows=Math.max(minimumPhotoRows,summary.present+summary.absent);
     if(Number.isInteger(summary.questions)&&summary.questions>=1&&summary.questions<=200){
       const input=$('admin-tab-content')?.querySelector('input[name="question_count"]');
       if(input&&input.value==='32')input.value=String(summary.questions);
     }
     if((result.rows||[]).length){
       if(!importFiles.includes(filename))importFiles.push(filename);
       mergeDraftRows(alignPhotoNames(result.rows));
     }else addImportWarning(filename+': o‘quvchi qatorlari topilmadi.');
     if(summary.missingRows)addImportWarning('Rasmning ayrim qatorlarini tekshiring.');
   }catch(error){addImportWarning(filename+': rasm jadvalini ajratib bo‘lmadi.');}
   scheduleDraftRender();
 };
 async function previewFiles(root,files){
   if(uploadBusy)return;
   const selected=Array.from(files||[]);
   if(!selected.length)return;
   if(selected.length>8){notice('Bir marta 8 tagacha fayl tanlang');return}
   const images=selected.filter(f=>/\.(png|jpe?g|webp)$/i.test(f.name));
   const sheets=selected.filter(f=>!/\.(png|jpe?g|webp)$/i.test(f.name));
   const info=root.querySelector('#nur-file-status');
   if(images.length){
     if(navigator.userAgent.includes('NurOqiwAndroid')){
       pendingImages+=images.length;
       if(info)info.textContent=images.length+' ta rasm tanildi. Telefonda matni tekshirilmoqda...';
     }else{
       addImportWarning('Rasm OCR faqat Android APK ichida ishlaydi.');
       renderDraft(root);
     }
   }
   if(!sheets.length){
     const input=root.querySelector('input[data-math-files]');if(input)input.value='';
     return;
   }
   uploadBusy=true;
   if(info)info.textContent=sheets.length+' ta jadval fayli yuklanmoqda...';
   try{
     const form=new FormData();
     for(const f of sheets)form.append('files',f,f.name);
     const output=await api('/admin/math/preview',{admin:true,method:'POST',body:form});
     const incoming=[];
     for(const entry of output.files||[]){
       if(!importFiles.includes(entry.file))importFiles.push(entry.file);
       for(const w of (entry.warnings||[]).slice(0,2))addImportWarning(entry.file+': '+w);
       for(const row of entry.rows||[])incoming.push({
         name:row.name||'',grade:row.grade??null,status:row.status,
         correct:row.correct??null
       });
     }
     mergeDraftRows(incoming);
     renderDraft(root);
     if(info)info.textContent=selected.map(x=>x.name).join(', ');
   }catch(err){notice(err.message);if(info)info.textContent='Faylni o\u2018qishda xatolik'}
   finally{uploadBusy=false;const input=root.querySelector('input[data-math-files]');if(input)input.value=''}
 }
 function renderDraft(root){
   const table=root.querySelector('#nur-import-rows');if(!table)return;
   const warning=root.querySelector('#nur-import-warnings');
   if(warning){
      const pending=draft.filter(r=>r.status==='unresolved'||
        (r.status==='present'&&r.correct===null)||!r.name.trim()).length;
      if(!pending&&!draftWarnings.length)warning.textContent='';
      else warning.innerHTML='<div class="nur-import-warning"><b>'+
        esc(pending?pending+' ta qatorni tekshiring. ':'')+
        '</b>'+esc(draftWarnings.slice(-1).join(' '))+'</div>';
    }
    table.replaceChildren();
   const sorted=[...draft.map((x,i)=>({x,i}))].sort((a,b)=>
     Number(a.x.status!=='unresolved'&&a.x.name.trim()!=='')-Number(b.x.status!=='unresolved'&&b.x.name.trim()!==''));
   const fragment=document.createDocumentFragment();
   for(const {x,i} of sorted){
     const cell=document.createElement('div');
     cell.className='nur-import-row'+(x.status==='unresolved'||!x.name.trim()?' unresolved':'');
     cell.innerHTML='<div class="row-line"><div><label>Ism va familiya</label>'+
        '<input data-math-index="'+i+'" data-math-field="name" value="'+esc(x.name)+'" placeholder="Ism Familiya"></div>'+
        '<div><label>Sinf</label><input type="number" min="2" max="7" data-math-index="'+i+'" data-math-field="grade"'+
        ' value="'+(x.grade??'')+'" placeholder="2–7"></div></div>'+
        '<div class="row-line"><div><label>Holat</label><select data-math-index="'+i+'" data-math-field="status">'+
        [['present','Qatnashdi'],['dq','DQ — kelmagan'],['unresolved','Aniqlanmagan']].map(([k,t])=>
         '<option value="'+k+'"'+(x.status===k?' selected':'')+'>'+t+'</option>').join('')+
        '</select></div><div><label>To‘g‘ri javoblar</label><input type="number" min="0" max="200" '+
        'data-math-index="'+i+'" data-math-field="correct" value="'+(x.correct??'')+'"'+
        (x.status==='dq'?' disabled':'')+' placeholder="0"></div></div>'+
        (x.status==='unresolved'?'<div style="display:flex;gap:7px;margin-top:9px">'+
        '<button class="nur-btn alt" type="button" data-math-action="resolve" data-idx="'+i+'" data-status="dq">DQ</button>'+
        '<button class="nur-btn alt" type="button" data-math-action="resolve" data-idx="'+i+'" data-status="present">0 ball</button></div>':'');
     fragment.append(cell);
   }
   table.append(fragment);
   updateWarningCount(root);
 }
 async function renderAdmin(root,ctx,tab='math'){
   if(!root)return;
   bindAdmin(root,ctx);adminMode=tab;
   if(!data)await reload(true);
   root.replaceChildren();
   if(tab==='math'){
     const panel=document.createElement('section');panel.className='nur-math-panel';
     panel.innerHTML='<h3>Test natijalarini yuklash</h3>'+
       '<p>Excel/CSV fayllari va Android APK ichida jadval rasmlari o\u2018qiladi. Rasmda aniqlangan ism, 0 ball va DQ natijalarini admin tekshiradi; avtomatik e\u2019lon qilinmaydi.</p>'+
       '<form class="nur-math-form" data-math-form="commit">'+
       '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
       '<label>Test sanasi<input type="date" name="date" required value="'+esc(pageDate)+'"></label>'+
       '<label>Savollar soni<input type="number" name="question_count" required min="1" max="200" value="32"></label></div>'+
       '<label>Test nomi<input name="title" required maxlength="120" value="Matematika testi"></label>'+
       '<label class="nur-math-upload" for="nur-math-files"><b>Fayllarni tanlash yoki shu yerga tashlash</b>'+
       '<small>Bir nechta fayl: Excel/CSV 2 MB gacha; rasm telefonda OCR orqali o‘qiladi</small></label>'+
       '<input id="nur-math-files" data-math-files type="file" accept=".csv,.xlsx,.png,.jpg,.jpeg,.webp" multiple style="position:absolute;opacity:0;max-width:1px;max-height:1px">'+
       '<div id="nur-file-status" style="font-size:11px;color:var(--muted)">'+esc(importFiles.join(', '))+'</div>'+
       '<div class="nur-math-subhead"><b>Topilgan o‘quvchilar</b><small id="nur-math-warning-count"></small></div>'+
       '<div id="nur-import-warnings"></div><div id="nur-import-rows"></div>'+
       '<button type="button" class="nur-btn alt" data-math-action="add-row">+ Qator qo‘shish</button>'+
       '<button type="submit" class="nur-btn">Tekshirdim — natijalarni e’lon qilish</button>'+
       '</form>';
     root.append(panel);
     renderDraft(root);
   }else if(tab==='math-payments'){
     root.innerHTML='<section class="nur-math-panel"><h3>Oylik to‘lovlarni tasdiqlash</h3>'+
       '<p>Admin pulni mustaqil tekshirib «To‘lov qilindi» belgilaydi. Belgilanmaganlarning holati «Kutilmoqda» bo‘ladi.</p>'+
       '<label>Oy <input id="nur-admin-paymonth" type="month" value="'+esc(month)+'"></label>'+
       '<div id="nur-admin-pay-list" class="nur-monthly-list" style="margin-top:14px"></div></section>';
     root.querySelector('#nur-admin-paymonth').onchange=async e=>{
       monthPinned=true;month=e.target.value;await reload(true);await renderAdmin(root,ctx,'math-payments');
     };
     const list=root.querySelector('#nur-admin-pay-list');
     for(const x of data?.students||[]){
       const box=document.createElement('div');box.className='nur-math-panel';box.dataset.payStudent=String(x.id);
       box.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:7px">'+
          '<div class="name"><b style="font-size:12px">'+esc(x.full_name)+'</b><small style="display:block;color:var(--muted)">'+
          (x.grade?x.grade+'-sinf':'2–7-sinflar')+'</small></div>'+pill(x.paid)+'</div>'+
          '<div class="nur-math-payment-controls">'+
          '<input name="amount" type="number" min="1000" step="1000" placeholder="Summa, so‘m" value="'+(x.amount_uzs??'')+'">'+
          '<button type="button" class="nur-math-pay-action" data-math-action="mark-payment" data-next-paid="'+(x.paid?'no':'yes')+'">'+
          (x.paid?'Kutilmoqda qilish':'To‘lov qilindi')+'</button></div>';
       list.append(box);
     }
     if(!data?.students?.length)list.innerHTML='<div class="nur-math-empty">Hali ro‘yxat yo‘q. O‘quvchilarni qo‘shing.</div>';
   }
 }
 function init(){
   setupPages();
   try{document.body.dataset.nurAccent=localStorage.getItem('nur-accent')||'emerald'}catch{}
   const priorGo=window.go;
   if(typeof priorGo==='function'){
     window.go=function(id){
       const out=priorGo.apply(this,arguments);
       if(['rating','results','math-monthly'].includes(id)){reload(true)}
       if(id==='nur-settings')renderAppearance();
       return out;
     };
   }
   reload(false);
   live();
 }
 window.NurMath={renderAdmin,reload,openProfile};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
