/* Nur oqiw orayi Paynet QR payment requests.
 * Never claim a QR transfer is automatically confirmed. The admin must verify
 * the real Paynet operation externally before setting the paid status.
 */
(() => {
  'use strict';
  const API='https://nur-apk-api.onrender.com/api';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const money=n=>Number(n||0).toLocaleString('uz-UZ')+' so‘m';
  const localMonth=()=>{
    const p=new Intl.DateTimeFormat('en-US',{year:'numeric',month:'2-digit',timeZone:'Asia/Tashkent'})
      .formatToParts(new Date());
    const v=k=>p.find(x=>x.type===k)?.value;
    return v('year')+'-'+v('month');
  };
  const statusLabels={
    created:'Buyurtma yaratildi',submitted:'Admin tekshiruvida',
    confirmed:'To‘lov tasdiqlandi',rejected:'To‘lov tasdiqlanmadi'
  };
  const storeKey='nur-apk-payments-v1';
  let config=null,activeToken='',adminFilter='all',busy=false;
  async function fetchJson(route,opts={}){
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
    try{
      const response=await fetch(API+route,{
        method:opts.method||'GET',cache:'no-store',signal:ctrl.signal,
        headers:{Accept:'application/json',...(opts.body?{'Content-Type':'application/json'}:{})},
        body:opts.body?JSON.stringify(opts.body):undefined
      });
      const body=await response.json().catch(()=>({}));
      if(!response.ok)throw Error(body.error||'Serverga ulanishda xatolik');
      return body;
    }catch(error){if(error.name==='AbortError')throw Error('Server kech javob bermoqda. Keyinroq qayta urinib ko‘ring.');throw error}
    finally{clearTimeout(timer)}
  }
  function saved(){
    try{
      const a=JSON.parse(localStorage.getItem(storeKey)||'[]');
      return Array.isArray(a)?a.filter(x=>typeof x.token==='string'&&/^[a-f0-9]{32}$/.test(x.token)).slice(0,20):[];
    }catch{return []}
  }
  function remember(item){
    const list=[item,...saved().filter(x=>x.token!==item.token)].slice(0,20);
    try{localStorage.setItem(storeKey,JSON.stringify(list))}catch{}
  }
  function storageIsEnabled(){
    try{const k='nur-test-storage';localStorage.setItem(k,'1');localStorage.removeItem(k);return true}catch{return false}
  }
  function setStatus(text,kind=''){
    const root=$('payment-page-status');if(!root)return;
    root.textContent=text;
    root.className=text?'payment-alert '+kind:'';
  }
  function renderGroupOptions(groups){
    const select=$('payment-group');if(!select)return;
    const old=select.value;
    select.replaceChildren();
    const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Guruhni tanlang';select.append(placeholder);
    for(const g of groups){
      const opt=document.createElement('option');opt.value=String(g.group_id);
      opt.textContent=g.subject_title+' / '+g.group_title+' — '+money(g.amount_uzs);
      select.append(opt);
    }
    if([...select.options].some(o=>o.value===old))select.value=old;
    updateAmount();
  }
  function updateAmount(){
    const selected=config?.groups?.find(x=>String(x.group_id)===$('payment-group')?.value);
    if($('payment-preview-amount'))$('payment-preview-amount').textContent=selected?money(selected.amount_uzs):'—';
    const submit=$('payment-public-form')?.querySelector('button[type=submit]');
    if(submit)submit.disabled=!config?.ready||!selected||busy;
  }
  async function loadPublic(){
    if(!$('payments'))return;
    setStatus('To‘lov ma’lumotlari yuklanmoqda...');
    try{
      config=await fetchJson('/payments/config');
      renderGroupOptions(config.groups||[]);
      const form=$('payment-public-form');
      if(form)form.hidden=false;
      if(!config.ready){
        setStatus('To‘lov tizimi hozircha faollashtirilmagan. Administrator oluvchini va guruh narxini tasdiqlashi kerak.','warning');
      }else if(!config.groups?.length){
        setStatus('Hozircha hech bir guruh uchun to‘lov miqdori belgilanmagan.','warning');
      }else{
        setStatus('Paynet QR orqali to‘lang. To‘lov faqat administrator Paynetdagi tranzaksiyani tekshirgach tasdiqlanadi.');
      }
      updateAmount();
      renderHistory();
    }catch(error){
      setStatus(error.message,'warning');
      if($('payment-public-form'))$('payment-public-form').hidden=false;
      config=null;updateAmount();
      renderHistory();
    }
  }
  function renderHistory(){
    const target=$('payment-my-orders');if(!target)return;
    target.replaceChildren();
    const orders=saved();
    if(!orders.length){
      const blank=document.createElement('div');blank.className='empty';blank.textContent='Sizning to‘lov so‘rovingiz hozircha yo‘q.';
      target.append(blank);return;
    }
    for(const order of orders){
      const btn=document.createElement('button');btn.className='payment-status';btn.type='button';
      btn.dataset.paymentAction='view';btn.dataset.token=order.token;
      btn.style.width='100%';btn.style.textAlign='left';
      btn.innerHTML='<div class="payment-status-head"><strong>'+esc(order.code||'To‘lov so‘rovi')+'</strong>'+
       '<span class="payment-status-chip">Holatini ko‘rish</span></div><p>'+
       esc(order.group||'')+' · '+esc(order.period||'')+'</p>';
      target.append(btn);
    }
  }
  function renderOrderPanel(data,token){
    activeToken=token;
    const root=$('payment-order-panel');if(!root)return;
    root.hidden=false;
    const status=data.status||'created';
    $('payment-order-code').textContent=data.order_code||'';
    $('payment-order-amount').textContent=money(data.amount_uzs);
    $('payment-order-status').textContent=statusLabels[status]||status;
    $('payment-order-status').className='payment-status-chip '+status;
    $('payment-order-summary').textContent=(data.group_title||'')+' · '+(data.period||'');
    const qr=$('payment-qr-section');
    if(qr)qr.hidden=!(status==='created'&&config?.ready);
    const refForm=$('payment-review-form');
    if(refForm)refForm.hidden=status!=='created';
    const message=$('payment-final-message');
    if(message){
      message.textContent=(
        status==='confirmed'?'To‘lov tasdiqlandi. Administrator Paynet operatsiyasini tekshirgan.':
        status==='submitted'?'Ma’lumot yuborildi. Administrator Paynet operatsiyasini tekshirmaguncha tasdiqlangan hisoblanmaydi.':
        status==='rejected'?'To‘lovni tasdiqlab bo‘lmadi. Administrator bilan bog‘laning.':
        'QR-ni skanerlang yoki Paynet ilovasida rasm sifatida oching. To‘lovdan so‘ng operatsiya raqamini yuboring.'
      );
    }
    const payee=$('payment-payee-name');
    if(payee)payee.textContent=data.payee_name||config?.payee_name||'IBIRAYM NURJANOV';
  }
  async function lookup(token){
    if(!token)return;
    const button=$('payment-refresh-status');if(button)button.disabled=true;
    try{
      const data=await fetchJson('/payments/status?receipt_token='+encodeURIComponent(token));
      renderOrderPanel(data,token);
      $('payment-order-panel')?.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(error){setStatus(error.message,'warning')}
    finally{if(button)button.disabled=false}
  }
  async function createOrder(event){
    event.preventDefault();
    const form=event.currentTarget;
    if(!config?.ready){setStatus('To‘lov tizimi hali faollashtirilmagan.','warning');return}
    if(!form.reportValidity())return;
    const data=Object.fromEntries(new FormData(form));
    busy=true;updateAmount();
    try{
      const result=await fetchJson('/payments/orders',{method:'POST',body:{
        payer_name:data.payer_name,payer_type:data.payer_type,
        group_id:Number(data.group_id),period:data.period
      }});
      remember({token:result.receipt_token,code:result.order_code,group:result.group_title,period:result.period});
      renderHistory();
      renderOrderPanel(result,result.receipt_token);
      setStatus('Buyurtma yaratildi. QR orqali to‘lovdan so‘ng operatsiya raqamini administratorga yuboring.');
      $('payment-order-panel')?.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(error){setStatus(error.message,'warning')}
    finally{busy=false;updateAmount()}
  }
  async function submitClaim(event){
    event.preventDefault();
    const form=event.currentTarget;
    if(!activeToken)return;
    if(!form.reportValidity())return;
    const data=Object.fromEntries(new FormData(form));
    const btn=form.querySelector('button[type=submit]');if(btn)btn.disabled=true;
    try{
      const result=await fetchJson('/payments/claim',{method:'POST',body:{
        receipt_token:activeToken,payment_reference:data.payment_reference,
        note:data.note
      }});
      setStatus(result.message);
      await lookup(activeToken);
    }catch(error){setStatus(error.message,'warning')}
    finally{if(btn)btn.disabled=false}
  }
  function bindPublic(){
    const form=$('payment-public-form');
    if(!form)return;
    const month=form.elements.namedItem('period');
    if(month&&!month.value)month.value=localMonth();
    $('payment-group')?.addEventListener('change',updateAmount);
    form.addEventListener('submit',createOrder);
    $('payment-review-form')?.addEventListener('submit',submitClaim);
    $('payment-refresh-status')?.addEventListener('click',()=>lookup(activeToken));
    $('payment-my-orders')?.addEventListener('click',event=>{
      const button=event.target.closest('button[data-token]');
      if(button)lookup(button.dataset.token);
    });
    $('payment-copy-token')?.addEventListener('click',()=>{
      if(!activeToken)return;
      if(navigator.clipboard?.writeText)navigator.clipboard.writeText(activeToken)
        .then(()=>setStatus('Maxfiy tekshirish kodi nusxalandi. Uni hech kimga bermang.'))
        .catch(()=>prompt('Tekshirish kodingizni nusxalang:',activeToken));
      else prompt('Tekshirish kodingizni nusxalang:',activeToken);
    });
    renderHistory();
  }
  function adminOptions(ctx,selected=''){
    return (ctx.state.groups||[]).map(g=>'<option value="'+g.id+'"'+(String(g.id)===String(selected)?' selected':'')+'>'+
      esc(ctx.state.subjects?.find(s=>s.id===g.subject_id)?.title||'')+' / '+esc(g.title)+'</option>').join('');
  }
  function adminStatusChip(value){
    return '<span class="payment-status-chip '+esc(value)+'">'+esc(statusLabels[value]||value)+'</span>';
  }
  async function admin(root,ctx){
    root.innerHTML='<div class="loadertext">To‘lovlar yuklanmoqda...</div>';
    try{
      const data=await ctx.api('/admin/payments/overview',{admin:true});
      const settings=data.settings||{};
      const tariffs=new Map((data.tariffs||[]).map(x=>[x.group_id,x]));
      root.innerHTML='<div class="payment-block"><h3>To‘lov boshqaruvi</h3>'+
       '<p>Hozircha Paynet avtomatik tasdiqlash ulanmagan. QR orqali tushgan pulni haqiqiy hisobdan tekshirib tasdiqlashingiz kerak.</p>'+
       '<form class="appform" data-form="payment-settings">'+
       '<label>Rasmdagi oluvchi ismi<input required name="payee_name" maxlength="100" value="'+esc(settings.payee_name||data.expected_qr_payee)+'"></label>'+
       '<label class="payment-settings-line"><input type="checkbox" name="payee_verified" '+(settings.payee_verified?'checked':'')+'>'+
       '<span>IBIRAYM NURJANOV nomidagi Paynet hisobiga mablag‘ olish vakolatini mustaqil tekshirdim.</span></label>'+
       '<label class="payment-settings-line"><input type="checkbox" name="qr_enabled" '+(settings.qr_enabled?'checked':'')+'>'+
       '<span>Rasmdagi Paynet QR hisobimga tegishli va ishlashini tekshirdim.</span></label>'+
       '<label class="payment-settings-line"><input type="checkbox" name="enabled" '+(settings.enabled?'checked':'')+'>'+
       '<span>To‘lov qabul qilishni faollashtirish</span></label>'+
       '<button class="appbtn" type="submit">To‘lov sozlamalarini saqlash</button></form>'+
       '<div class="payment-alert warning">Tasdiqlashdan oldin QR pulni aynan kimning hisobiga yuborishini tekshiring. Paynet rasmiy merchant integratsiyasi hozircha yo‘q.</div>'+
       '</div><div class="payment-block"><h3>Guruhlar uchun narxlar</h3>'+
       '<p>Summani administrator belgilaydi. Hozircha hech qanday namunaviy 200–350 minglik narx qo‘yilmagan.</p>'+
       '<div id="payment-admin-tariffs"></div></div>'+
       '<div class="payment-block"><h3>O‘quvchilar to‘lovlari</h3>'+
       '<label>Holat bo‘yicha ko‘rsatish<select id="payment-admin-filter">'+
       [['all','Barchasi'],['created','Yaratilgan'],['submitted','Tekshiruvda'],
         ['confirmed','Tasdiqlangan'],['rejected','Rad etilgan']].map(([id,t])=>
          '<option value="'+id+'"'+(adminFilter===id?' selected':'')+'>'+t+'</option>').join('')+
       '</select></label><div id="payment-admin-orders" class="payment-admin-list"></div></div>';
      const target=$('payment-admin-tariffs');
      for(const group of ctx.state.groups||[]){
        const price=tariffs.get(group.id);
        const card=document.createElement('div');card.className='payment-admin-tariff';
        card.innerHTML='<b>'+esc(group.title)+'</b><small class="premium-muted">'+
          esc(ctx.state.subjects?.find(s=>s.id===group.subject_id)?.title||'')+
          '</small><form class="appform" data-form="payment-tariff" data-group="'+group.id+'">'+
          '<label>So‘mda summa<input type="number" name="amount_uzs" min="1000" max="100000000" step="1000"'+
          ' value="'+(price?.amount_uzs??'')+'" required placeholder="Masalan: 250000"></label>'+
          '<button class="appbtn secondary" type="submit">Saqlash</button></form>';
        target.append(card);
      }
      await loadAdminOrders(ctx,adminFilter);
    }catch(error){root.innerHTML='<div class="errorbox">'+esc(error.message)+'</div>'}
  }
  async function loadAdminOrders(ctx,filter){
    const root=$('payment-admin-orders');if(!root)return;
    root.innerHTML='<p class="loadertext">To‘lovlar tekshirilmoqda...</p>';
    try{
      const data=await ctx.api('/admin/payments/orders?status='+filter,{admin:true});
      root.replaceChildren();
      if(!data.orders?.length){
        const empty=document.createElement('div');empty.className='empty';empty.textContent='Hozircha bu holatda to‘lov yo‘q.';root.append(empty);return;
      }
      for(const order of data.orders){
        const card=document.createElement('div');card.className='payment-admin-order';
        card.innerHTML='<h4>'+esc(order.payer_name)+'</h4>'+
          '<p>'+esc(order.subject_title)+' / '+esc(order.group_title)+' · '+esc(String(order.period_month).slice(0,7))+'</p>'+
          '<p class="payment-order-id">'+esc(order.order_code)+' · '+money(order.amount_uzs)+'</p>'+
          '<div class="payment-status-head">'+adminStatusChip(order.status)+'</div>'+
          (order.claim_reference?'<p>Paynet operatsiyasi: <b>'+esc(order.claim_reference)+'</b></p>':'')+
          (order.admin_note?'<p>Izoh: '+esc(order.admin_note)+'</p>':'')+
          (order.status==='submitted'?'<div class="payment-action-row">'+
            '<button class="appbtn small" type="button" data-payment-action="confirm" data-id="'+order.id+
            '" data-reference="'+esc(order.claim_reference||'')+'">Hisobda tekshirib tasdiqlash</button>'+
            '<button class="appbtn danger small" type="button" data-payment-action="reject" data-id="'+order.id+'">Rad etish</button></div>':'');
        root.append(card);
      }
    }catch(error){root.innerHTML='<div class="errorbox">'+esc(error.message)+'</div>'}
  }
  async function onAdminSubmit(form,ctx){
    const type=form.dataset.form;
    if(!['payment-settings','payment-tariff'].includes(type))return false;
    const submit=form.querySelector('button[type=submit]');if(submit)submit.disabled=true;
    try{
      if(type==='payment-settings'){
        const body={
          payee_name:form.elements.namedItem('payee_name').value,
          payee_verified:form.elements.namedItem('payee_verified').checked,
          qr_enabled:form.elements.namedItem('qr_enabled').checked,
          enabled:form.elements.namedItem('enabled').checked
        };
        await ctx.api('/admin/payments/settings',{admin:true,method:'PATCH',body});
      }else{
        const groupId=Number(form.dataset.group);
        await ctx.api('/admin/payments/tariffs/'+groupId,{admin:true,method:'PUT',
          body:{amount_uzs:Number(form.elements.namedItem('amount_uzs').value),active:true}});
      }
      ctx.toast('To‘lov sozlamalari saqlandi');
      await admin(ctx.root,ctx);
    }catch(error){ctx.toast(error.message)}
    finally{if(submit)submit.disabled=false}
    return true;
  }
  async function onAdminClick(button,ctx){
    const act=button.dataset.paymentAction;
    if(!act)return false;
    const id=Number(button.dataset.id);
    try{
      if(act==='confirm'){
        const transaction=button.dataset.reference;
        if(!transaction||transaction.length<5)throw Error('Operatsiya raqami yo‘q');
        if(!confirm('Paynet hisobingizda '+transaction+' operatsiya raqami va summa HAQIQATDA kelganini tekshirdingizmi? Tekshirmasdan tasdiqlamang.'))return true;
        await ctx.api('/admin/payments/orders/'+id,{admin:true,method:'PATCH',
          body:{status:'confirmed',verified_externally:true,verified_transaction:transaction}});
        ctx.toast('To‘lov faqat administrator tekshiruvidan so‘ng tasdiqlandi');
      }else if(act==='reject'){
        const reason=prompt('Rad etish sababi:','Paynet hisobida to‘lov topilmadi');
        if(reason===null)return true;
        await ctx.api('/admin/payments/orders/'+id,{admin:true,method:'PATCH',
          body:{status:'rejected',admin_note:reason}});
        ctx.toast('To‘lov tasdiqlanmadi');
      }
      await loadAdminOrders(ctx,adminFilter);
    }catch(error){ctx.toast(error.message)}
    return true;
  }
  async function onAdminChange(input,ctx){
    if(input.id!=='payment-admin-filter')return false;
    adminFilter=input.value;
    await loadAdminOrders(ctx,adminFilter);
    return true;
  }
  window.NurPayments={openPublic:loadPublic,admin,onAdminSubmit,onAdminClick,onAdminChange};
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',bindPublic,{once:true});
  }else bindPublic();
})();
