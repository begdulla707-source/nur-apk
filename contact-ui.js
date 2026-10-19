/* Independent Nur APK contact screen and administrator private inbox. */
(() => {
 'use strict';
 const API='https://nur-apk-api.onrender.com/api';
 const $=id=>document.getElementById(id);
 const clean=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 function messageDate(raw){try{return new Intl.DateTimeFormat('uz-UZ',{timeZone:'Asia/Tashkent',dateStyle:'medium',timeStyle:'short'}).format(new Date(raw))}catch{return String(raw)}}
 const form=$('public-contact-form');
 if(form){
  const kind=form.elements.namedItem('sender_type'),label=$('contact-subject-label'),subject=form.elements.namedItem('subject_code');
  function changeKind(){const student=kind.value==='student';label.hidden=!student;subject.required=student;if(!student)subject.value=''}
  kind.addEventListener('change',changeKind);changeKind();
  form.addEventListener('submit',async event=>{
   event.preventDefault();
   if(!form.reportValidity())return;
   const button=form.querySelector('button[type=submit]'),feed=$('contact-feedback');
   button.disabled=true;feed.textContent='Xabar yuborilmoqda...';
   try{
    const data=Object.fromEntries(new FormData(form));
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
    let response;
    try{response=await fetch(API+'/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:controller.signal})}
    finally{clearTimeout(timer)}
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload.error||'Xabarni yuborib bo‘lmadi');
    feed.textContent='Xabaringiz administratorga yuborildi. Raqam: '+payload.reference;
    feed.className='okbox';
    form.elements.namedItem('message').value='';
   }catch(e){feed.className='errorbox';feed.textContent=e.name==='AbortError'?'Server kech javob bermoqda. Keyinroq qayta urinib ko‘ring.':e.message}
   finally{button.disabled=false}
  });
 }
 async function inbox(root,ctx){
   root.innerHTML='<div class="premium-heading"><h3>Admin xabarlari</h3><small>Faqat admin uchun</small></div><div class="inbox-controls"><button type="button" class="appbtn secondary" data-inbox-action="refresh">Yangilash</button><button type="button" class="appbtn light" data-inbox-action="unread">O‘qilmaganlar</button><button type="button" class="appbtn light" data-inbox-action="active">Barcha xabarlar</button></div><div id="inbox-items">Xabarlar yuklanmoqda...</div>';
   await loadInbox(ctx,'active');
 }
 async function loadInbox(ctx,status){
   const root=$('inbox-items');if(!root)return;
   root.textContent='Xabarlar yuklanmoqda...';
   try{
    const result=await ctx.api('/admin/inbox?status='+encodeURIComponent(status),{admin:true});
    root.replaceChildren();
    root.insertAdjacentHTML('beforeend','<p class="page-message">O‘qilmagan xabarlar: '+result.unread+'</p>');
    if(!result.messages?.length){root.insertAdjacentHTML('beforeend','<div class="empty">Hozircha xabar yo‘q.</div>');return}
    for(const m of result.messages){
     const card=document.createElement('article');
     card.className='appcard inbox-card'+(m.is_read?'':' unread');
     const who=m.sender_type==='parent'?'Ota-ona':'O‘quvchi';
     const subject={mat:'Matematika',fiz:'Fizika',rus:'Rus tili',eng:'Ingliz tili',other:'Boshqa'}[m.subject_code]||'—';
     card.innerHTML='<h4>'+clean(m.full_name)+'</h4><p class="page-message">'+clean(who)+' · '+clean(subject)+' · '+clean(messageDate(m.created_at))+'</p><p class="inbox-body">'+clean(m.message)+'</p>'+
      '<div class="action-row">'+(m.is_read?'':'<button type="button" class="appbtn secondary small" data-inbox-action="read" data-id="'+m.id+'">O‘qildi</button>')+
      '<button type="button" class="appbtn danger small" data-inbox-action="archive" data-id="'+m.id+'">Arxivlash</button></div>';
     root.append(card);
    }
   }catch(err){root.textContent=err.message}
 }
 async function click(button,ctx){
  const action=button.dataset.inboxAction;
  if(!action)return false;
  if(['refresh','active','unread'].includes(action)){await loadInbox(ctx,action==='unread'?'unread':'active');return true}
  if(['read','archive'].includes(action)){
   try{
    await ctx.api('/admin/inbox/'+Number(button.dataset.id),{admin:true,method:'PATCH',body:action==='read'?{is_read:true}:{archived:true}});
    await loadInbox(ctx,'active');ctx.toast('Xabar yangilandi');
   }catch(e){ctx.toast(e.message)}
   return true;
  }
  return false;
 }
 window.NurContact={inbox,click};
})();
