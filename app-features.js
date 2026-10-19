/* Nur Oqiw Orayi: live data, role-protected admin workflows. Theme CSS is not modified. */
(() => {
  'use strict';
  const API = 'https://nur-apk-api.onrender.com/api';
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const state = { subjects:[], groups:[], notices:[], selectedGroup:null, subject:null,
    rankingGroup:'', resultGroup:'', adminTab:'dashboard', sessions:[], sessionId:null, online:false };
  let auth = sessionStorage.getItem('nur-apk-admin-session') || '';
  let refreshing = false;
  const choice = (rows, selected='') => rows.map(r=>'<option value="'+escape(r.value)+'"'+(String(r.value)===String(selected)?' selected':'')+'>'+escape(r.text)+'</option>').join('');
  const groupOptions = () => state.groups.map(g=>({value:g.id,text:(state.subjects.find(s=>s.id===g.subject_id)?.title||'')+' / '+g.title}));
  const el = (tag, cls, text) => {const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
  async function api(path, options={}) {
    const headers = {'Accept':'application/json'};
    if (options.body) headers['Content-Type']='application/json';
    if (options.admin) {
      if(!auth) throw new Error('Avval administrator sifatida kiring');
      headers['Authorization']='Bearer '+auth;
    }
    const controller = new AbortController();
    const timeout=setTimeout(()=>controller.abort(), 15000);
    try {
      const res=await fetch(API+path,{method:options.method||'GET',headers,body:options.body?JSON.stringify(options.body):undefined,signal:controller.signal,cache:'no-store'});
      const data=await res.json().catch(()=>({}));
      if(!res.ok) {
        if(res.status===401&&options.admin){auth='';sessionStorage.removeItem('nur-apk-admin-session')}
        throw new Error(data.error||('Server xatosi: '+res.status));
      }
      return data;
    } catch (err) {
      if(err.name==='AbortError') throw new Error('Server javobi kechikyapti. Qayta urinib ko‘ring');
      if(err instanceof TypeError) throw new Error('Serverga ulanish yo‘q. Internet yoki API sozlamalarini tekshiring');
      throw err;
    } finally {clearTimeout(timeout)}
  }
  function toast(text) {
    document.querySelector('.floating-toast')?.remove();
    const p=el('div','floating-toast',text);document.body.append(p);setTimeout(()=>p.remove(),3400);
  }
  async function refresh(silent=false) {
    if(refreshing)return;refreshing=true;
    try {
      const data=await api('/bootstrap');
      state.subjects=data.subjects||[];state.groups=data.groups||[];state.notices=data.notices||[];state.online=true;
      const counter=document.querySelector('#home .stat strong');
      if(counter)counter.textContent=String(data.total_students);
      renderGroups();renderSubjects();renderNotices();renderFilters();
      if(['rating','results'].includes(document.querySelector('.view.show')?.id))await renderPublicResults();
      if(document.querySelector('.view.show')?.id==='group')await renderStudentList();
    } catch(err) {
      state.online=false;
      if(!silent)toast(err.message);
    } finally {refreshing=false}
  }
  function renderGroups() {
    const root=$('group-list');if(!root)return;
    const math=state.subjects.find(x=>x.code==='mat');
    const groups=state.groups.filter(g=>g.subject_id===math?.id);
    root.replaceChildren();
    for(const g of groups){
      const btn=el('button','group');btn.textContent=g.title;
      btn.append(el('small','',g.student_count+' o‘quvchi'));
      btn.onclick=()=>openGroup(g);root.append(btn);
    }
    if(!groups.length)root.append(el('div','empty','Bu fan bo‘yicha guruh yaratilmagan.'));
  }
  function renderSubjects() {
    document.querySelectorAll('#home .subject').forEach((btn,i)=>{
      const s=state.subjects[i];if(!s)return;
      const sub=btn.querySelector('small');
      if(sub)sub.textContent=state.groups.filter(g=>g.subject_id===s.id).length+' ta guruh';
      btn.onclick=()=>openSubjectDynamic(s);
    });
  }
  function openSubjectDynamic(subject) {
    state.subject=subject;
    if(subject.code==='mat'){go('groups');return}
    $('subject-title').textContent=subject.title;
    const section=$('subject');let target=$('subject-groups');
    if(!target){target=el('div','groupgrid');target.id='subject-groups';section.querySelector('.empty')?.after(target)}
    target.replaceChildren();
    const items=state.groups.filter(g=>g.subject_id===subject.id);
    const blank=section.querySelector('.empty');if(blank)blank.style.display=items.length?'none':'';
    for(const g of items){const b=el('button','group',g.title);b.append(el('small','',g.student_count+' o‘quvchi'));b.onclick=()=>openGroup(g);target.append(b)}
    go('subject');
  }
  function openGroup(group) {
    state.selectedGroup=group;
    $('group-title').textContent=group.title;
    go('group');renderStudentList();
  }
  async function renderStudentList(){
    if(!state.selectedGroup)return;
    const section=$('group');
    let target=$('student-list');
    if(!target){target=el('div','data-list');target.id='student-list';section.append(target)}
    section.querySelector('.empty')?.classList.add('hidden');
    target.replaceChildren(el('p','loadertext','Yuklanmoqda...'));
    try{
      const data=await api('/students?group_id='+state.selectedGroup.id);
      target.replaceChildren();
      if(!data.students.length){target.append(el('div','empty','Bu guruhga hali o‘quvchi qo‘shilmagan.'));return}
      for(const [i,s] of data.students.entries()){
        const r=el('div','data-row');
        r.append(el('span','tiny-number',i+1));
        r.append(el('div','',s.full_name));
        target.append(r);
      }
    }catch(e){target.replaceChildren(el('div','empty',e.message))}
  }
  function renderNotices(){
    let target=$('notices-panel');const root=document.querySelector('#home .content');
    if(!root)return;
    if(!target){target=el('section','');target.id='notices-panel';root.append(target)}
    target.replaceChildren();
    if(!state.notices.length)return;
    const title=el('div','data-section');title.append(el('h3','','E’lonlar'));title.append(el('small','','Yangiliklar'));target.append(title);
    for(const item of state.notices.slice(0,10)){
      const card=el('div','notice-card');card.append(el('b','',item.title));card.append(el('p','',item.body));card.append(el('time','',dateText(item.created_at)));target.append(card)
    }
  }
  function renderFilters(){
    for(const [rootId, key] of [['rating-filters','rankingGroup'],['results-filters','resultGroup']]){
      const root=$(rootId);if(!root)return;root.replaceChildren();
      const all=[{id:'',title:'Barchasi'},...state.groups];
      for(const g of all){
        const b=el('button','chip'+(String(state[key])===String(g.id)?' on':''),g.title);
        b.onclick=()=>{state[key]=g.id;renderFilters();renderPublicResults()};
        root.append(b);
      }
    }
  }
  async function renderPublicResults(){
    const page=document.querySelector('.view.show')?.id;
    if(page==='rating')await renderRanking();
    if(page==='results')await renderResults();
  }
  async function renderRanking(){
    const target=$('ratingEmpty');if(!target)return;
    target.replaceChildren(el('p','loadertext','Reyting yuklanmoqda...'));
    try{
      const data=await api('/ranking'+(state.rankingGroup?'?group_id='+state.rankingGroup:''));
      if(!data.ranking.length){target.textContent='Hozircha o‘quvchilar qo‘shilmagan.';return}
      target.className='data-list';
      target.replaceChildren();
      for(const s of data.ranking){
        const row=el('div','data-row');row.append(el('span','tiny-number',s.rank||'—'));
        const info=el('div');info.append(el('b','',s.full_name));info.append(el('small','',s.group_title+' · '+s.tests+' ta natija'+(s.absences?', DQ: '+s.absences:'')));row.append(info);
        row.append(el('strong','',s.average===null?'—':s.average+'%'));target.append(row);
      }
    }catch(e){target.className='empty';target.textContent=e.message}
  }
  async function renderResults(){
    const target=$('resultsEmpty');if(!target)return;
    target.replaceChildren(el('p','loadertext','Natijalar yuklanmoqda...'));
    try{
      const data=await api('/results'+(state.resultGroup?'?group_id='+state.resultGroup:''));
      if(!data.results.length){target.className='empty';target.textContent='Hozircha natijalar yo‘q.';return}
      target.className='data-list';target.replaceChildren();
      for(const r of data.results){
        const row=el('div','data-row');
        const info=el('div');info.append(el('b','',r.full_name));info.append(el('small','',r.group_title+' · '+r.session_title+' · '+dateText(r.held_on)));row.append(info);
        row.append(el('strong','',r.absent?'DQ':r.score+'%'));target.append(row)
      }
    }catch(e){target.className='empty';target.textContent=e.message}
  }
  const previousGo=window.go;
  window.go=function(page){previousGo(page);if(page==='rating'||page==='results')renderPublicResults();if(page==='admin')renderAdmin()};
  function dateText(x){
    if(!x)return '';
    const d=new Date(x);return Number.isNaN(d.getTime())?String(x):new Intl.DateTimeFormat('uz-UZ',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Asia/Tashkent'}).format(d)
  }
  function tashkentDate(){
    const p=new Intl.DateTimeFormat('en-US',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Tashkent'}).formatToParts(new Date());
    const f=k=>p.find(x=>x.type===k)?.value;return f('year')+'-'+f('month')+'-'+f('day');
  }
  let adminRoot;
  function setupAdmin(){
    const page=$('admin');page.querySelector('.empty')?.classList.add('hidden');
    adminRoot=el('div','');adminRoot.id='admin-workspace';page.append(adminRoot);
    adminRoot.addEventListener('submit',onAdminSubmit);
    adminRoot.addEventListener('click',onAdminClick);
    adminRoot.addEventListener('change',onAdminChange);
  }
  function premiumCtx(){return {root:$('admin-tab-content'),state,api,toast,refresh,renderAdmin,showAdminTab,dateText,tashkentDate}}
  async function renderAdmin(){
    if(!adminRoot)setupAdmin();
    if(!auth){
      syncAdminEntry();
      adminRoot.innerHTML='<div class="appcard"><h3>Admin token bilan kirish</h3><form class="appform" data-form="login"><label>Maxfiy admin token<input name="token" type="password" autocomplete="off" required placeholder="Admin tokenni kiriting"></label><button class="appbtn" type="submit">Xavfsiz kirish</button><div class="page-message">Token ilova kodida saqlanmaydi; kirgandan keyin vaqtinchalik sessiya ishlatiladi.</div></form></div>';
      return;
    }
    adminRoot.innerHTML='<p class="loadertext">Boshqaruv paneli yuklanmoqda...</p>';
    try{
      const [overview,bootstrap]=await Promise.all([api('/admin/overview',{admin:true}),api('/bootstrap')]);
      state.sessions=overview.sessions||[];
      state.groups=bootstrap.groups||[];state.subjects=bootstrap.subjects||[];
      const c=overview.counts||{};
      adminRoot.innerHTML='<div class="admin-grid"><div><strong>'+Number(c.groups||0)+'</strong><small>Guruhlar</small></div><div><strong>'+Number(c.students||0)+'</strong><small>O‘quvchilar</small></div><div><strong>'+Number(c.sessions||0)+'</strong><small>Mashg‘ulotlar</small></div></div><button class="appbtn small light" data-act="logout">Chiqish</button><div class="admin-tabs" id="admin-tabs"></div><div id="admin-tab-content"></div>';
      const root=$('admin-tabs');
      for(const [id,title] of [['dashboard','Panel'],['groups','Guruhlar'],['students','O‘quvchilar'],['sessions','Mashg‘ulot'],['marks','Baholar'],['attendance','Davomat'],['analytics','Tahlil'],['notices','E’lonlar'],['archive','Arxiv'],['audit','Tarix'],['exports','CSV'],['security','Xavfsizlik'],['catalog','TOP 50']]){
        const b=el('button',state.adminTab===id?'on':'',title);b.dataset.tab=id;root.append(b);
      }
      await showAdminTab();
    }catch(err){if(!auth)return renderAdmin();adminRoot.innerHTML='<div class="errorbox">'+escape(err.message)+'</div><button class="appbtn secondary" data-act="reload">Qayta urinish</button>'}
  }
  async function showAdminTab(){
    const root=$('admin-tab-content');if(!root)return;
    $('admin-tabs')?.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.tab===state.adminTab));
    if(window.NurPremium && ['dashboard','students','sessions','attendance','analytics','notices','archive','audit','exports','catalog','security'].includes(state.adminTab)) {
      await window.NurPremium.renderTab(state.adminTab,premiumCtx());
      return;
    }
    if(state.adminTab==='groups'){ 
      root.innerHTML='<section class="appcard"><h3>Guruh qo‘shish</h3><form data-form="add-group" class="appform"><label>Fan<select required name="subject_id">'+choice(state.subjects.map(s=>({value:s.id,text:s.title})))+'</select></label><label>Guruh kodi<input required maxlength="16" name="code" placeholder="Masalan: K"></label><label>Guruh nomi<input maxlength="80" name="title" placeholder="Masalan: K guruhi"></label><button class="appbtn">Guruhni saqlash</button></form></section>';
      for(const g of state.groups){
        const row=el('div','appcard');row.innerHTML='<b>'+escape(g.title)+'</b><div class="small-group-label">'+escape(state.subjects.find(s=>s.id===g.subject_id)?.title)+' · '+g.student_count+' o‘quvchi</div><div class="action-row"><button class="appbtn secondary small" data-act="rename-group" data-id="'+g.id+'">Nomini o‘zgartirish</button><button class="appbtn danger small" data-act="archive-group" data-id="'+g.id+'">Arxivlash</button></div>';root.append(row);
      }
    }else if(state.adminTab==='students'){
      const opts=choice(groupOptions());root.innerHTML='<section class="appcard"><h3>O‘quvchi qo‘shish</h3><form class="appform" data-form="add-student"><label>Guruh<select required name="group_id" id="admin-student-group">'+opts+'</select></label><label>Ism va familiya<input required maxlength="120" name="full_name" placeholder="Ism Familiya"></label><button class="appbtn">O‘quvchini saqlash</button></form></section><div class="data-section"><h3>Guruh o‘quvchilari</h3></div><div id="admin-students"></div>';
      await showAdminStudents();
    }else if(state.adminTab==='marks'){
      root.innerHTML='<section class="appcard"><h3>Mashg‘ulot qo‘shish</h3><form class="appform" data-form="add-session"><label>Guruh<select required name="group_id">'+choice(groupOptions())+'</select></label><label>Mashg‘ulot / test nomi<input name="title" maxlength="120" required placeholder="Haftalik sinov"></label><label>Sana (Toshkent vaqti)<input name="held_on" type="date" required value="'+tashkentDate()+'"></label><button class="appbtn">Mashg‘ulot yaratish</button></form></section><div class="appcard"><h3>Natijalarni kiritish / tahrirlash</h3><form class="appform" data-form="save-marks"><label>Mashg‘ulot<select required id="admin-session" name="session_id">'+choice(state.sessions.map(s=>({value:s.id,text:s.group_title+' · '+s.title+' ('+dateText(s.held_on)+')'})),state.sessionId||'')+'</select></label><div id="admin-mark-list" class="loadertext">Mashg‘ulotni tanlang.</div><button class="appbtn">Natijalarni saqlash</button></form></div><div id="session-list"></div>';
      if(!state.sessionId&&state.sessions.length)state.sessionId=state.sessions[0].id;
      if(state.sessionId&&$('admin-session'))$('admin-session').value=state.sessionId;
      await showAdminMarks();showSessions();
    }else if(state.adminTab==='notices'){
      root.innerHTML='<section class="appcard"><h3>Bildirishnoma / e’lon</h3><form class="appform" data-form="add-notice"><label>Sarlavha<input required name="title" maxlength="120"></label><label>Xabar<textarea required name="body" maxlength="1000"></textarea></label><button class="appbtn">Hammaga e’lon qilish</button></form><p>Bu e’lon ilova ichida ko‘rinadi. Telefon push xabarlari alohida sozlanadi.</p></section><div id="admin-notice-list"></div>';
      showNotices();
    }
  }
  async function showAdminStudents(){
    const selected=$('admin-student-group')?.value;const target=$('admin-students');if(!target||!selected)return;
    target.innerHTML='<p class="loadertext">O‘quvchilar yuklanmoqda...</p>';
    try{
      const data=await api('/students?group_id='+selected);
      target.replaceChildren();
      if(!data.students.length){target.append(el('div','empty','Bu guruhda o‘quvchi yo‘q.'));return}
      for(const s of data.students){
        const row=el('div','appcard');row.innerHTML='<b>'+escape(s.full_name)+'</b><div class="action-row"><button class="appbtn secondary small" data-act="rename-student" data-id="'+s.id+'" data-name="'+escape(s.full_name)+'">Tahrirlash</button><button class="appbtn danger small" data-act="archive-student" data-id="'+s.id+'">Arxivlash</button></div>';target.append(row);
      }
    }catch(e){target.textContent=e.message}
  }
  async function showAdminMarks(){
    const session=state.sessions.find(s=>String(s.id)===String(state.sessionId));
    const target=$('admin-mark-list');if(!target)return;
    if(!session){target.className='empty';target.textContent='Avval mashg‘ulot yarating.';return}
    target.className='';target.innerHTML='<p class="loadertext">O‘quvchilar yuklanmoqda...</p>';
    try{
      const [data,all]=await Promise.all([api('/students?group_id='+session.group_id),api('/results?group_id='+session.group_id)]);
      const prev=new Map(all.results.filter(x=>x.session_id===session.id).map(x=>[x.student_id,x]));
      target.replaceChildren();
      if(!data.students.length){target.append(el('div','empty','Bu guruhga avval o‘quvchi qo‘shing.'));return}
      const hint=el('p','page-message','Ball 0–100. DQ — dars qoldirdi. Bo‘sh qoldirilgan qatorlar saqlanmaydi.');target.append(hint);
      for(const s of data.students){
        const p=prev.get(s.id);
        const r=el('div','mark-row');r.dataset.student=s.id;
        r.append(el('label','',s.full_name));
        const n=document.createElement('input');n.type='number';n.min='0';n.max='100';n.step='0.01';n.placeholder='Ball';n.dataset.score='true';if(p&&!p.absent)n.value=p.score;
        const ab=document.createElement('input');ab.type='checkbox';ab.dataset.absent='true';ab.title='DQ';ab.checked=!!p?.absent;
        n.disabled=ab.checked;ab.addEventListener('change',()=>{n.disabled=ab.checked;if(ab.checked)n.value=''});
        r.append(n,ab);target.append(r);
      }
    }catch(e){target.className='errorbox';target.textContent=e.message}
  }
  function showSessions(){
    const t=$('session-list');if(!t)return;t.replaceChildren();
    for(const s of state.sessions.slice(0,30)){
      const row=el('div','appcard');row.innerHTML='<b>'+escape(s.title)+'</b><p>'+escape(s.group_title)+' · '+dateText(s.held_on)+' · '+s.marked_count+' natija</p><div class="action-row"><button class="appbtn secondary small" data-act="choose-session" data-id="'+s.id+'">Natijalarni ochish</button><button class="appbtn danger small" data-act="archive-session" data-id="'+s.id+'">Arxivlash</button></div>';t.append(row)
    }
  }
  function showNotices(){
    const root=$('admin-notice-list');if(!root)return;root.replaceChildren();
    for(const n of state.notices){const row=el('div','appcard');row.innerHTML='<b>'+escape(n.title)+'</b><p>'+escape(n.body)+'</p><div class="action-row"><button class="appbtn danger small" data-act="archive-notice" data-id="'+n.id+'">Arxivlash</button></div>';root.append(row)}
  }
  async function onAdminSubmit(e){
    const form=e.target.closest('form[data-form]');if(!form)return;
    e.preventDefault();
    if(form.dataset.form?.startsWith('premium-') && window.NurPremium){await window.NurPremium.onSubmit(form,premiumCtx());return}
    const type=form.dataset.form;const data=Object.fromEntries(new FormData(form));const submit=form.querySelector('button[type=submit],button.appbtn');if(submit)submit.disabled=true;
    try{
      if(type==='login'){
        const r=await api('/admin/login',{method:'POST',body:{token:data.token}});
        auth=r.session;sessionStorage.setItem('nur-apk-admin-session',auth);syncAdminEntry();toast('Administratorga xush kelibsiz');await renderAdmin();return;
      }
      if(type==='add-group')await api('/admin/groups',{method:'POST',admin:true,body:{subject_id:Number(data.subject_id),code:data.code,title:data.title}});
      if(type==='add-student')await api('/admin/students',{method:'POST',admin:true,body:{group_id:Number(data.group_id),full_name:data.full_name}});
      if(type==='add-session'){
        const r=await api('/admin/sessions',{method:'POST',admin:true,body:{group_id:Number(data.group_id),title:data.title,held_on:data.held_on}});
        state.sessionId=r.id;state.adminTab='marks';
      }
      if(type==='add-notice')await api('/admin/notices',{method:'POST',admin:true,body:{title:data.title,body:data.body}});
      if(type==='save-marks'){
        const marks=Array.from($('admin-mark-list').querySelectorAll('[data-student]')).map(row=>{
          const absent=row.querySelector('[data-absent]').checked;const score=row.querySelector('[data-score]').value;
          return absent?{student_id:Number(row.dataset.student),absent:true}:score!==''?{student_id:Number(row.dataset.student),score:Number(score),absent:false}:null
        }).filter(Boolean);
        if(!marks.length)throw new Error('Kamida bitta ball yoki DQ kiriting');
        await api('/admin/marks',{method:'POST',admin:true,body:{session_id:Number(data.session_id),marks}});
      }
      toast('Ma’lumotlar saqlandi');await refresh(true);await renderAdmin();
    }catch(err){toast(err.message)}finally{if(submit)submit.disabled=false}
  }
  async function onAdminClick(e){
    const btn=e.target.closest('button[data-act],button[data-tab]');if(!btn)return;
    if(btn.dataset.tab){state.adminTab=btn.dataset.tab;await showAdminTab();return}
    if(btn.dataset.act?.startsWith('premium-') && window.NurPremium){await window.NurPremium.onClick(btn,premiumCtx());return}
    const act=btn.dataset.act,id=Number(btn.dataset.id);
    if(act==='logout'){auth='';sessionStorage.removeItem('nur-apk-admin-session');syncAdminEntry();await renderAdmin();return}
    if(act==='reload'){await renderAdmin();return}
    if(act==='choose-session'){state.sessionId=id;state.adminTab='marks';await showAdminTab();return}
    if(['archive-group','archive-student','archive-session','archive-notice'].includes(act)){
      if(!confirm('Bu elementni arxivlamoqchimisiz? Oldingi ma’lumotlar saqlanadi.'))return;
      const collection=act.split('-')[1]+'s';
      try{await api('/admin/'+collection+'/'+id,{admin:true,method:'DELETE'});if(act==='archive-session'&&state.sessionId===id)state.sessionId=null;toast('Arxivlandi');await refresh(true);await renderAdmin()}catch(err){toast(err.message)}
      return;
    }
    if(act==='rename-group'||act==='rename-student'){
      const current=act==='rename-student'?btn.dataset.name:state.groups.find(g=>g.id===id)?.title;
      const name=prompt('Yangi nomini kiriting:',current||'');
      if(name===null)return;
      try{
        await api('/admin/'+(act==='rename-group'?'groups':'students')+'/'+id,{admin:true,method:'PATCH',body:act==='rename-group'?{title:name}:{full_name:name}});
        toast('Nom yangilandi');await refresh(true);await renderAdmin()
      }catch(err){toast(err.message)}
    }
  }
  async function onAdminChange(e){
    if(e.target.dataset.premiumFilter && window.NurPremium){await window.NurPremium.onChange(e.target,premiumCtx());return}
    if(e.target.id==='admin-student-group')await showAdminStudents();
    if(e.target.id==='admin-session'){state.sessionId=Number(e.target.value);await showAdminMarks()}
  }
  function bindLanguage(){
    const dict={
      UZ:['Bosh menyu','Reyting','Natijalar','Ta’lim yo‘nalishlari','Fan tanlang','Har bir qadam —','yangi imkoniyat.'],
      QQ:['Bas bet','Reyting','Nátiyjeler','Oqıw baǵdarları','Pándi tańlań','Hár bir qádem —','jańa imkaniyat.'],
      RU:['Главная','Рейтинг','Результаты','Направления','Выберите предмет','Каждый шаг —','новая возможность.']
    };
    window.lang=function(btn,name){
      document.querySelectorAll('.langs button').forEach(x=>x.classList.remove('on'));btn.classList.add('on');
      const d=dict[name]||dict.UZ;
      document.querySelectorAll('.tabbar button').forEach((b,i)=>{const svg=b.querySelector('svg');b.textContent=d[i];b.prepend(svg)});
      const head=$('home').querySelector('.section-head');if(head){head.querySelector('h2').textContent=d[3];head.querySelector('small').textContent=d[4]}
      $('home').querySelector('.hero h1').textContent=d[5]+'\n'+d[6];
      $('lang-msg').textContent=name+' tanlandi. Boshqa bo‘limlar tarjimasi ishlab chiqilmoqda.';
      try{localStorage.setItem('nur-apk-language',name)}catch{}
    };
  }
  setupAdmin();bindLanguage();
  // The admin entry point is hidden from regular users. A signed session controls API rights.
  const adminEntrance=document.querySelector('.adminbtn');
  function syncAdminEntry(){if(adminEntrance)adminEntrance.style.display=auth?'block':'none'}
  syncAdminEntry();
  const intendedAdmin=new URLSearchParams(location.search).get('admin')==='1';
  if(intendedAdmin)go('admin');

  const oldGroupHandler=window.openSubject;
  window.openSubject=function(name){const s=state.subjects.find(x=>x.title===name);if(s)return openSubjectDynamic(s);return oldGroupHandler(name)};
  refresh(true).then(()=>renderPublicResults());
  setInterval(()=>{if(!document.hidden)refresh(true)},20000);
  if(auth&&document.querySelector('.view.show')?.id==='admin')renderAdmin();
})();
