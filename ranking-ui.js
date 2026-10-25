/* Admin ranking release controls and public Top 15 student profiles.
   No private admin notes or phone numbers are requested by the public view. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const base='https://nur-apk-api.onrender.com/api';
  let requestId=0,selectedPublicGroup='';
  const dateText=d=>{if(!d)return '—';const value=new Date(d);if(!Number.isFinite(value.getTime()))return String(d);
    return new Intl.DateTimeFormat('uz-UZ',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Asia/Tashkent'}).format(value)};
  const percentage=v=>v===null||v===undefined?'—':Number(v).toFixed(1)+'%';
  const isTop=r=>r.rank!==null&&r.rank!==undefined;
  function ensurePublic(){
    const rating=$('rating');
    if(!rating)return null;
    let el=$('public-top15');
    if(!el){
      el=document.createElement('section');el.id='public-top15';
      const before=$('ratingEmpty');
      if(before)before.before(el);else rating.append(el);
    }
    let page=$('student-profile');
    if(!page){
      page=document.createElement('section');page.className='view subpage';
      page.id='student-profile';
      page.innerHTML='<button class="back" type="button" id="profile-back">← Reytingga qaytish</button><div id="public-profile-body"></div>';
      $('results')?.after(page);
      page.querySelector('#profile-back').addEventListener('click',()=>window.go?.('rating'));
    }
    return el;
  }
  async function loadTop(groupId=''){
    selectedPublicGroup=String(groupId||'');
    const el=ensurePublic();
    if(!el)return;
    const call=++requestId;
    el.replaceChildren();
    const q=selectedPublicGroup?'?group_id='+encodeURIComponent(selectedPublicGroup):'';
    try{
      const response=await fetch(base+'/top15'+q,{cache:'no-store'});
      if(!response.ok)throw Error('Reytingni yuklab bo‘lmadi');
      const data=await response.json();
      if(call!==requestId)return;
      if(!data.settings?.published){
        el.innerHTML='<div class="empty">Reyting administrator tomonidan hali e’lon qilinmagan.</div>';return;
      }
      const ranking=data.ranking||[];
      if(!ranking.length){el.innerHTML='';return}
      const head=document.createElement('div');head.className='rank-top-title';
      head.innerHTML='<h3>TOP '+Number(data.settings?.top_limit||15)+'</h3><small>O‘quvchi profilini ochish</small>';
      el.replaceChildren(head);
      const podium=document.createElement('div');podium.className='rank-podium';
      for(const rank of [2,1,3]){
        const s=ranking[rank-1];
        const card=document.createElement(s?'button':'div');
        card.className='rank-podium-item';
        if(!s){card.style.visibility='hidden';podium.append(card);continue}
        card.type='button';card.dataset.profile=String(s.student_id);
        card.innerHTML='<span class="rank-medal">'+rank+'</span><b>'+esc(s.full_name)+'</b>'+
          '<small>'+esc(s.group_title)+'</small><strong>'+percentage(s.average)+'</strong>';
        podium.append(card);
      }
      el.append(podium);
      const list=document.createElement('div');list.className='top-list';
      for(const s of ranking.slice(3)){
        const btn=document.createElement('button');btn.type='button';btn.className='top-item';
        btn.dataset.profile=String(s.student_id);
        btn.innerHTML='<span class="tiny-number">'+s.rank+'</span><div><b>'+esc(s.full_name)+'</b>'+
           '<small>'+esc(s.group_title)+' · '+s.tests+' natija</small></div>'+
           '<strong>'+percentage(s.average)+'</strong>';
        list.append(btn);
      }
      el.append(list);
      const caption=document.createElement('p');caption.className='rank-note';
      caption.textContent='Top reyting yakunlangan baholar asosida hisoblanadi. DQ o‘rtacha ballga kirmaydi.';
      el.append(caption);
    }catch(error){if(call===requestId)el.innerHTML='<div class="empty">'+esc(error.message)+'</div>'}
  }
  async function openProfile(id){
    ensurePublic();
    const root=$('public-profile-body');if(!root)return;
    root.innerHTML='<div class="empty">Profil ochilmoqda...</div>';
    window.go?.('student-profile');
    try{
      const q=selectedPublicGroup?'?group_id='+encodeURIComponent(selectedPublicGroup):'';
      const r=await fetch(base+'/students/'+encodeURIComponent(id)+'/profile'+q,{cache:'no-store'});
      const d=await r.json();
      if(!r.ok)throw Error(d.error||'Profil yuklanmadi');
      const p=d.student;
      root.innerHTML='<div class="rank-profile-card"><div class="rank-profile-head"><span class="rank-medal">'+
         esc(p.rank)+'</span><div><b>'+esc(p.full_name)+'</b><small>'+esc(p.group_title)+
         ' · Reytingdagi o‘rni: '+p.rank+'</small></div></div>'+
         '<div class="rank-profile-metrics"><div><b>'+percentage(p.average)+'</b><small>O‘rtacha</small></div>'+
         '<div><b>'+Number(p.tests)+'</b><small>Natijalar</small></div>'+
         '<div><b>'+Number(p.absences)+'</b><small>DQ</small></div></div></div>'+
         '<div class="rank-top-title"><h3>O‘quvchi natijalari</h3><small>'+esc(dateText(d.settings?.period_start))+
         ' – '+esc(dateText(d.settings?.period_end))+'</small></div>';
      const list=document.createElement('div');list.className='data-list';
      for(const n of d.results||[]){
        const row=document.createElement('div');row.className='data-row';
        row.innerHTML='<div><b>'+esc(n.session_title)+'</b><small>'+esc(dateText(n.held_on))+
          '</small></div><strong>'+esc(n.absent?'DQ':percentage(n.score))+'</strong>';
        list.append(row);
      }
      if(!list.children.length)list.innerHTML='<div class="empty">Natijalar hali mavjud emas.</div>';
      root.append(list);
    }catch(err){root.innerHTML='<div class="empty">'+esc(err.message)+'</div>'}
  }
  async function adminRanking(root,ctx){
    root.innerHTML='<div class="appcard"><h3>Reyting boshqaruvi</h3><p>Reyting faqat kiritilgan ballardan avtomatik hisoblanadi. Administrator davr va e’lon holatini o‘zgartiradi.</p></div>';
    const data=await ctx.api('/admin/ranking/settings',{admin:true});
    const settings=data.settings;
    const form=document.createElement('div');form.className='appcard rank-settings';
    form.innerHTML='<form class="appform" data-form="rank-settings">'+
      '<label class="rank-setting-toggle"><span>Reytingni foydalanuvchilarga ko‘rsatish</span>'+
      '<input type="checkbox" name="is_published" '+(settings.published?'checked':'')+'></label>'+
      '<label>Davr boshlanishi<input name="period_start" type="date" value="'+esc(settings.period_start||'')+'"></label>'+
      '<label>Davr tugashi<input name="period_end" type="date" value="'+esc(settings.period_end||'')+'"></label>'+
      '<label>Top o‘quvchilar soni<select name="top_limit">'+[5,10,15].map(n=>
       '<option value="'+n+'"'+(settings.top_limit===n?' selected':'')+'>'+n+'</option>').join('')+
      '</select></label>'+
      '<p class="page-message">Davrni bo‘sh qoldirsangiz, barcha mavjud natijalar hisoblanadi.</p>'+
      '<button class="appbtn" type="submit">Reyting sozlamalarini saqlash</button></form>';
    root.append(form);
    const pre=document.createElement('div');pre.className='admin-preview';
    pre.innerHTML='<div class="rank-top-title"><h3>Top o‘quvchilar</h3><small>Admin ko‘rinishi</small></div>';
    for(const s of data.top15||[]){
      pre.innerHTML+='<div class="premium-row"><div><strong>'+esc(s.rank+'. '+s.full_name)+
        '</strong><small>'+esc(s.group_title)+'</small></div><b>'+percentage(s.average)+'</b></div>';
    }
    if(!data.top15?.length)pre.innerHTML+='<div class="empty">Hozircha ball kiritilmagan.</div>';
    root.append(pre);
  }
  let selectedAdminStudent=null;
  async function adminProfiles(root,ctx){
    root.innerHTML='<div class="appcard"><h3>O‘quvchi profillari</h3>'+
      '<label class="appform">Guruh<select id="rank-profiles-group"><option value="">Barcha guruhlar</option>'+
      (ctx.state.groups||[]).map(x=>'<option value="'+x.id+'">'+esc(x.title)+'</option>').join('')+'</select></label>'+
      '<label class="appform" style="margin-top:9px">Izlash<input id="rank-profiles-search" placeholder="Ism familiya"></label>'+
      '<div class="action-row"><button class="appbtn secondary" data-ranking-act="search">O‘quvchilarni ko‘rsatish</button></div></div>'+
      '<div id="rank-profiles-list"></div><div id="rank-profile-admin-detail"></div>';
    await loadProfiles(ctx);
  }
  async function loadProfiles(ctx){
    const root=$('rank-profiles-list');if(!root)return;root.replaceChildren();
    const q=new URLSearchParams();
    const group=$('rank-profiles-group')?.value,query=$('rank-profiles-search')?.value;
    if(group)q.set('group_id',group);
    if(query?.trim())q.set('q',query.trim().slice(0,80));
    try{
      const data=await ctx.api('/admin/v2/students?'+q,{admin:true});
      root.replaceChildren();
      if(!data.students.length){root.innerHTML='<div class="empty">O‘quvchi topilmadi.</div>';return}
      for(const s of data.students.slice(0,100)){
        const button=document.createElement('button');button.className='data-row';
        button.dataset.rankingAct='details';button.dataset.studentId=s.id;
        button.innerHTML='<span class="tiny-number">'+esc(s.id)+'</span><div><b>'+
          esc(s.full_name)+'</b><small>'+esc(s.group_title)+'</small></div><strong>›</strong>';
        root.append(button);
      }
    }catch(error){root.innerHTML='<div class="empty">'+esc(error.message)+'</div>'}
  }
  async function adminStudentDetail(ctx,id){
    const root=$('rank-profile-admin-detail');if(!root)return;
    root.replaceChildren();
    try{
      const data=await ctx.api('/admin/students/'+id+'/performance',{admin:true});
      const p=data.student,m=data.summary;
      root.innerHTML='<div class="rank-profile-card"><div class="rank-profile-head"><span class="rank-medal">N</span>'+
       '<div><b>'+esc(p.full_name)+'</b><small>'+esc(p.group_title)+' · '+esc(p.subject_title)+'</small></div></div>'+
       '<div class="rank-profile-metrics"><div><b>'+percentage(m.average)+'</b><small>O‘rtacha ball</small></div>'+
       '<div><b>'+m.assessments+'</b><small>Baholar</small></div><div><b>'+m.dq+'</b><small>DQ</small></div></div>'+
       '<p class="rank-note">Telefon: '+esc(p.phone||'Kiritilmagan')+'</p>'+
       '<p class="rank-note">Ichki izoh: '+esc(p.notes||'Yo‘q')+'</p></div><div class="rank-top-title"><h3>Natijalar tarixi</h3></div>';
      const list=document.createElement('div');list.className='data-list';
      for(const result of data.results||[]){
        const row=document.createElement('div');row.className='data-row';
        row.innerHTML='<div><b>'+esc(result.session_title)+'</b><small>'+
          esc(result.group_title)+' · '+esc(dateText(result.held_on))+'</small></div>'+
          '<strong>'+esc(result.absent?'DQ':percentage(result.score))+'</strong>';list.append(row);
      }
      if(!list.childNodes.length)list.innerHTML='<div class="empty">Natijalar yo‘q.</div>';
      root.append(list);
    }catch(e){root.innerHTML='<div class="empty">'+esc(e.message)+'</div>'}
  }
  async function onAdminSubmit(form,ctx){
    if(form.dataset.form!=='rank-settings')return false;
    const inputs=new FormData(form);
    const body={is_published:form.elements.namedItem('is_published').checked,
      period_start:inputs.get('period_start')||null,
      period_end:inputs.get('period_end')||null,
      top_limit:Number(inputs.get('top_limit')||15)};
    const button=form.querySelector('button[type=submit]');
    if(button)button.disabled=true;
    try{
      await ctx.api('/admin/ranking/settings',{method:'PATCH',body,admin:true});
      ctx.toast('Reyting sozlamalari saqlandi');
      await adminRanking(ctx.root,ctx);
      return true;
    }catch(err){ctx.toast(err.message);return true}
    finally{if(button)button.disabled=false}
  }
  async function onAdminClick(button,ctx){
    if(!button.dataset.rankingAct)return false;
    if(button.dataset.rankingAct==='search')await loadProfiles(ctx);
    if(button.dataset.rankingAct==='details')await adminStudentDetail(ctx,Number(button.dataset.studentId));
    return true;
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('button[data-profile]');
    if(button)openProfile(button.dataset.profile);
  });
  window.NurRankingUI={ensurePublic,loadTop,openProfile,adminRanking,adminProfiles,onAdminSubmit,onAdminClick,loadProfiles};
  ensurePublic();
})();
