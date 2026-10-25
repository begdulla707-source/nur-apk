/* Advanced admin console. Reuses original jade/emerald theme variables unchanged. */
(() => {
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const pad=v=>String(v).padStart(2,'0');
  const v={group:'',query:'',attendanceGroup:'',analyticsGroup:'',archiveType:'students',exportGroup:'',cachedStudents:[],cachedNotices:[],alerts:null};
  const $=id=>document.getElementById(id);
  const groupOptions=(groups,all=false,selected='')=> (all?'<option value="">Barcha guruhlar</option>':'')+
      groups.map(g=>'<option value="'+g.id+'"'+(String(selected)===String(g.id)?' selected':'')+'>'+esc(g.title)+'</option>').join('');
  const field=(label,name,type='text',value='',extra='')=>'<label>'+esc(label)+'<input type="'+type+'" name="'+name+'" value="'+esc(value)+'" '+extra+'></label>';
  const groupBox=(ctx,name,selected='',all=true)=>'<label>Guruh<select name="'+name+'" data-premium-filter="'+name+'">'+groupOptions(ctx.state.groups,all,selected)+'</select></label>';
  const loading=root=>{root.innerHTML='<div class="premium-loading"><span class="premium-spinner" aria-label="Tayyorlanmoqda"></span></div>'};
  const error=(root,e)=>{root.innerHTML='<div class="errorbox">'+esc(e.message||e)+'</div><button class="appbtn secondary" data-act="premium-refresh">Qayta urinish</button>'};
  const b=(label,act,id,more='')=>'<button class="appbtn small '+more+'" data-act="'+act+'" data-id="'+(id||'')+'">'+esc(label)+'</button>';
  const previewDate=value=>{if(!value)return '—';const d=new Date(value);return Number.isNaN(d.getTime())?String(value):new Intl.DateTimeFormat('uz-UZ',{timeZone:'Asia/Tashkent',day:'2-digit',month:'2-digit',year:'numeric'}).format(d)};
  const ymd=()=>{const a=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const x=t=>a.find(v=>v.type===t)?.value;return x('year')+'-'+x('month')+'-'+x('day')};
  const asTime=value=>{if(!value)return '';try{const d=new Date(value);const f=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);const p=t=>f.find(x=>x.type===t)?.value;return p('year')+'-'+p('month')+'-'+p('day')+'T'+p('hour')+':'+p('minute')}catch{return ''}};
  const pct=n=>n===null||n===undefined?'—':Number(n).toFixed(Number(n)%1===0?0:1)+'%';
  const opt=(ctx)=>groupOptions(ctx.state.groups,false,v.group||ctx.state.groups[0]?.id);
  const checkAction=()=>true;
  function metric(label,value,note=''){return '<div class="premium-metric"><small>'+esc(label)+'</small><b>'+esc(value??'—')+'</b>'+(note?'<span>'+esc(note)+'</span>':'')+'</div>'}
  function row(name,desc,right=''){return '<div class="premium-row"><div><strong>'+esc(name)+'</strong><small>'+esc(desc||'')+'</small></div><b>'+esc(right)+'</b></div>'}
  function section(heading,right=''){return '<div class="premium-heading"><h3>'+esc(heading)+'</h3><small>'+esc(right)+'</small></div>'}
  function note(text){return '<p class="page-message">'+esc(text)+'</p>'}
  function premiumModal(content){return '<div id="premium-edit" class="premium-edit">'+content+'</div>'}
  const catalog=[
    ['Dashboard Pro',1],
    ['O‘quvchi qo‘shish',1],
    ['O‘quvchini tahrirlash',1],
    ['O‘quvchini arxivlash va tiklash',1],
    ['Guruh yaratish',1],
    ['Guruhlarni boshqarish',1],
    ['O‘quvchini boshqa guruhga ko‘chirish',1],
    ['Ball kiritish',1],
    ['Ballni tahrirlash',1],
    ['Davomat nazorati — DQ',1],
    ['Avtomatik reyting',1],
    ['Reyting davri va e’lonini boshqarish',1],
    ['Top 15 o‘quvchi',1],
    ['O‘quvchi premium profili',1],
    ['Bildirishnomalar va e’lonlar',1],
    ['Statistika Pro',1],
    ['Admin xavfsizligi — token va amallar tarixi',1]
  ];
  async function renderTab(tab,ctx){
    const root=ctx.root; if(!root)return;
    loading(root);
    try{
      if(tab==='dashboard')await dashboard(root,ctx);
      else if(tab==='students')await students(root,ctx);
      else if(tab==='sessions')await sessions(root,ctx);
      else if(tab==='attendance')await attendance(root,ctx);
      else if(tab==='analytics')await analytics(root,ctx);
      else if(tab==='notices')await notices(root,ctx);
      else if(tab==='audit')await audit(root,ctx);
      else if(tab==='archive')await archive(root,ctx);
      else if(tab==='exports')await exports(root,ctx);
      else if(tab==='catalog')showCatalog(root);
      else if(tab==='security')security(root,ctx);
      else {root.innerHTML='<div class="empty">Ushbu bo‘lim keyinroq qo‘shiladi.</div>'}
    }catch(e){error(root,e)}
  }
  async function dashboard(root,ctx){
    const [r,alertData]=await Promise.all([ctx.api('/admin/v2/dashboard',{admin:true}),ctx.api('/admin/v2/alerts',{admin:true})]);
    v.alerts=alertData;
    const a=r.stats||{};
    root.innerHTML=section('Boshqaruv paneli','Asia/Tashkent')+'<div class="premium-metrics">'+
      metric('O‘quvchilar',a.students)+metric('Guruhlar',a.groups)+metric('Mashg‘ulotlar',a.sessions)+
      metric('O‘rtacha ball',pct(a.avg_score))+metric('Baholar',a.marks)+metric('DQ',a.dq)+
      '</div><div class="premium-quick">'+b('O‘quvchi qo‘shish','premium-tab','students','secondary')+
      b('Natija kiritish','premium-tab','marks','secondary')+b('E’lon chiqarish','premium-tab','notices','secondary')+'</div>'+
      section('E’tibor talab qiladiganlar',String(alertData.at_risk?.length||0)+' o‘quvchi');
    if(!alertData.at_risk?.length)root.innerHTML+='<div class="empty">Hozircha alohida ogohlantirish yo‘q.</div>';
    else for(const x of alertData.at_risk.slice(0,8))root.innerHTML+=row(x.full_name,x.group_title+' · DQ: '+x.absences,pct(x.average));
    root.innerHTML+=section('Tugallanmagan natijalar');
    if(!alertData.ungraded_sessions?.length)root.innerHTML+='<div class="empty">Kiritilmagan baholar topilmadi.</div>';
    else for(const x of alertData.ungraded_sessions.slice(0,5))root.innerHTML+=row(x.title,x.group_title+' · '+previewDate(x.held_on),x.missing+' ta');
    root.innerHTML+=section('Guruhlar bo‘yicha o‘zlashtirish');
    for(const g of r.groups||[])root.innerHTML+=row(g.title,g.subject+' · '+g.students+' o‘quvchi',pct(g.average));
    root.innerHTML+=section('So‘nggi admin amallari');
    for(const x of r.recent||[])root.innerHTML+=row(x.event_type,x.description,previewDate(x.created_at));
  }
  async function students(root,ctx){
    const opts=groupOptions(ctx.state.groups,true,v.group);
    root.innerHTML='<div class="appcard"><h3>Yangi o‘quvchi</h3>'+
      '<form class="appform" data-form="premium-student-add">'+
      '<label>Guruh<select name="group_id" required>'+groupOptions(ctx.state.groups)+'</select></label>'+
      field('Ism va familiya','full_name','text','','required maxlength="120"')+
      field('Ota-ona / aloqa raqami (faqat admin)','phone','tel','','maxlength="32"')+
      '<label>Ichki izoh<textarea name="notes" maxlength="2000" placeholder="Qo‘shimcha ma’lumot"></textarea></label>'+
      '<button class="appbtn" type="submit">O‘quvchi qo‘shish</button></form></div>'+
      section('O‘quvchilar','Qidirish va tahrirlash')+
      '<div class="premium-search"><select id="premium-student-group" name="students-group" data-premium-filter="students-group">'+opts+'</select>'+
      '<input id="premium-student-search" aria-label="O‘quvchi qidirish" placeholder="Ism bo‘yicha izlash" value="'+esc(v.query)+'">'+
      b('Izlash','premium-search','', 'secondary')+'</div><div id="premium-student-list"></div>'+
      '<div class="appcard"><h3>Ommaviy o‘quvchi importi</h3>'+
      note('Har qatorda: Ism Familiya; telefon. Bir martada 100 ta o‘quvchigacha. Takroriy ismlar o‘tkazib yuboriladi.')+
      '<form class="appform" data-form="premium-student-import">'+
      '<label>Qaysi guruhga?<select name="group_id" required>'+groupOptions(ctx.state.groups)+'</select></label>'+
      '<label>Ro‘yxat<textarea name="names" required rows="5" placeholder="Ali Valiyev; +998901234567&#10;Guli Xojayeva"></textarea></label>'+
      '<button class="appbtn" type="submit">Ro‘yxatni qo‘shish</button></form></div>';
    await loadStudents(ctx);
  }
  async function loadStudents(ctx){
    const target=$('premium-student-list');if(!target)return;
    target.innerHTML='<div class="premium-loading"><span class="premium-spinner"></span></div>';
    const qs=new URLSearchParams();
    if(v.group)qs.set('group_id',v.group);
    if(v.query)qs.set('q',v.query);
    try{
      const data=await ctx.api('/admin/v2/students?'+qs.toString(),{admin:true});
      v.cachedStudents=data.students||[];
      target.innerHTML=v.cachedStudents.length?'':'<div class="empty">O‘quvchi topilmadi.</div>';
      for(const x of v.cachedStudents){
        const row=document.createElement('div');row.className='premium-student';
        row.innerHTML='<div class="premium-student-info"><b>'+esc(x.full_name)+'</b><small>'+esc(x.group_title)+' · '+esc(x.subject_title)+'</small></div>'+
          '<div class="premium-student-actions">'+b('Tahrir','premium-edit-student',x.id,'secondary')+b('Arxiv','premium-archive-student',x.id,'danger')+'</div>';
        target.append(row);
      }
    }catch(e){error(target,e)}
  }
  function showStudentEdit(id,ctx){
    const s=v.cachedStudents.find(x=>x.id===id);if(!s){ctx.toast('O‘quvchi topilmadi');return}
    $('premium-edit')?.remove();
    const parent=$('admin-tab-content');
    const wrap=document.createElement('div');
    wrap.id='premium-edit';wrap.className='premium-modal';
    wrap.innerHTML='<div class="premium-modal-box"><h3>O‘quvchini tahrirlash</h3>'+
      '<form data-form="premium-student-edit" class="appform" data-id="'+id+'">'+
      field('Ism va familiya','full_name','text',s.full_name,'required maxlength="120"')+
      '<label>Guruh<select name="group_id" required>'+groupOptions(ctx.state.groups,false,s.group_id)+'</select></label>'+
      field('Telefon','phone','tel',s.phone||'','maxlength="32"')+
      '<label>Admin izohi<textarea name="notes" maxlength="2000">'+esc(s.notes||'')+'</textarea></label>'+
      '<div class="premium-quick"><button class="appbtn" type="submit">Saqlash</button>'+b('Bekor qilish','premium-close','', 'secondary')+'</div></form></div>';
    parent.append(wrap);
  }
  async function sessions(root,ctx){
    root.innerHTML='<div class="appcard"><h3>Natija sanasini qo‘shish</h3>'+
      '<form class="appform" data-form="add-session"><label>Guruh<select required name="group_id">'+groupOptions(ctx.state.groups)+'</select></label>'+
      field('Mashg‘ulot nomi','title','text','','required maxlength="120"')+
      field('Sana (Toshkent)','held_on','date',ymd(),'required')+
      '<button class="appbtn" type="submit">Yaratish</button></form></div>'+section('Natija kunlari',String(ctx.state.sessions.length));
    const list=document.createElement('div');root.append(list);
    for(const se of ctx.state.sessions){
      const node=document.createElement('div');node.className='appcard';
      node.innerHTML='<h4>'+esc(se.title)+'</h4><p>'+esc(se.group_title)+' · '+previewDate(se.held_on)+' · '+se.marked_count+' baho</p>'+
        '<div class="premium-quick">'+b('Baholar','premium-gradebook',se.id,'secondary')+
        b('Tahrir','premium-edit-session',se.id,'secondary')+b('Nusxa olish','premium-duplicate-session',se.id,'secondary')+
        b('Arxiv','premium-archive-session',se.id,'danger')+'</div>';
      list.append(node);
    }
    if(!ctx.state.sessions.length)list.innerHTML='<div class="empty">Hali natija kuni qo‘shilmagan.</div>';
  }
  function showSessionModal(type,id,ctx){
    const se=ctx.state.sessions.find(s=>s.id===id);
    if(!se)return ctx.toast('Mashg‘ulot topilmadi');
    $('premium-edit')?.remove();
    const body='<div id="premium-edit" class="premium-modal"><div class="premium-modal-box"><h3>'+
      (type==='duplicate'?'Mashg‘ulot nusxasi':'Mashg‘ulot tahriri')+'</h3>'+
      '<form class="appform" data-form="premium-session-'+type+'" data-id="'+id+'">'+
      field('Nomi','title','text',se.title,'required maxlength="120"')+
      field('Sana','held_on','date',type==='duplicate'?ymd():String(se.held_on).slice(0,10),'required')+
      '<div class="premium-quick"><button type="submit" class="appbtn">Saqlash</button>'+
      b('Bekor qilish','premium-close','','secondary')+'</div></form></div></div>';
    $('admin-tab-content').insertAdjacentHTML('beforeend',body);
  }
  async function attendance(root,ctx){
    root.innerHTML=section('Davomat nazorati')+
      '<div class="appcard">'+groupBox(ctx,'attendance-group',v.attendanceGroup)+
      note('DQ — dars qoldirdi. Baho kiritilmagan o‘quvchilar alohida ko‘rinadi.')+'</div>'+
      '<div id="premium-attendance-body"></div>';
    await loadAttendance(ctx);
  }
  async function loadAttendance(ctx){
    const root=$('premium-attendance-body');if(!root)return;loading(root);
    const query=v.attendanceGroup?'?group_id='+v.attendanceGroup:'';
    try{
      const [data,alerts]=await Promise.all([
        ctx.api('/admin/v2/analytics'+query,{admin:true}),
        ctx.api('/admin/v2/alerts',{admin:true})
      ]);
      root.innerHTML='<div class="premium-metrics">'+metric('Tekshiruvlar',data.summary?.sessions||0)+
        metric('Qatnashgan',data.summary?.grades||0)+metric('DQ',data.summary?.absences||0)+'</div>'+
        section('Kiritilmagan natijalar');
      const rows=alerts.ungraded_sessions.filter(x=>!v.attendanceGroup||ctx.state.sessions.some(s=>s.id===x.id&&String(s.group_id)===v.attendanceGroup));
      if(!rows.length)root.innerHTML+='<div class="empty">Kiritilmagan natija topilmadi.</div>';
      for(const x of rows)root.innerHTML+=row(x.title,x.group_title+' · '+previewDate(x.held_on),x.missing+' ta');
      root.innerHTML+=section('Davomat o‘zgarishi');
      for(const item of data.trend.slice(-30).reverse())root.innerHTML+=row(previewDate(item.held_on),item.marks+' ta javob','DQ '+item.absences);
    }catch(e){error(root,e)}
  }
  async function analytics(root,ctx){
    root.innerHTML=section('O‘zlashtirish tahlili')+
      '<div class="appcard">'+groupBox(ctx,'analytics-group',v.analyticsGroup)+'</div>'+
      '<div id="premium-analytics-body"></div>';
    await loadAnalytics(ctx);
  }
  async function loadAnalytics(ctx){
    const root=$('premium-analytics-body');if(!root)return;loading(root);
    try{
      const q=v.analyticsGroup?'?group_id='+v.analyticsGroup:'';
      const data=await ctx.api('/admin/v2/analytics'+q,{admin:true});
      const s=data.summary||{};
      root.innerHTML='<div class="premium-metrics">'+metric('O‘rtacha ball',pct(s.average))+
        metric('80+ ball',s.high||0)+metric('50 dan past',s.low||0)+metric('DQ',s.absences||0)+'</div>'+
        section('Sana bo‘yicha o‘rtacha ball');
      const trend=data.trend||[];
      if(!trend.length)root.innerHTML+='<div class="empty">Statistika uchun natijalar kiritilmagan.</div>';
      for(const d of trend.slice(-16)){
        root.innerHTML+='<div class="premium-progress"><div><span>'+esc(previewDate(d.held_on))+'</span><strong>'+esc(pct(d.average))+'</strong></div>'+
          '<div class="premium-track"><div style="width:'+Math.max(0,Math.min(100,Number(d.average)||0))+'%"></div></div></div>';
      }
      root.innerHTML+=section('Guruhlar bo‘yicha taqqoslash');
      for(const g of data.groups||[])root.innerHTML+=row(g.title,g.subject+' · DQ: '+g.dq,pct(g.average));
    }catch(e){error(root,e)}
  }
  async function notices(root,ctx){
    const r=await ctx.api('/admin/v2/notices',{admin:true});
    v.cachedNotices=r.notices||[];
    root.innerHTML='<div class="appcard"><h3>Premium e’lon yaratish</h3>'+
      '<form data-form="premium-notice-add" class="appform">'+field('Sarlavha','title','text','','required maxlength="120"')+
      '<label>Matn<textarea name="body" required maxlength="1000"></textarea></label>'+
      groupBox(ctx,'group_id','',true)+
      '<label class="premium-check"><input type="checkbox" name="pinned" value="1"> Muhim e’lon (yuqorida turadi)</label>'+
      field('Chop etish vaqti (ixtiyoriy)','publish_at','datetime-local','')+
      field('Yakunlanish vaqti (ixtiyoriy)','expires_at','datetime-local','')+
      '<button type="submit" class="appbtn">E’lonni saqlash</button></form>'+
      note('Rejalashtirilgan e’lon belgilangan vaqtda ilovada ko‘rinadi. Push bildirishnoma hozircha yo‘q.')+
      '</div>'+section('E’lonlar',v.cachedNotices.length+' ta');
    for(const n of v.cachedNotices){
      let detail=(n.group_title||'Hamma')+' · '+previewDate(n.publish_at);
      if(n.pinned)detail+=' · Muhim';
      if(n.archived)detail+=' · Arxiv';
      const card=document.createElement('div');card.className='appcard';
      card.innerHTML='<h4>'+esc(n.title)+'</h4><p>'+esc(n.body)+'</p><small class="premium-muted">'+esc(detail)+'</small>'+
        '<div class="premium-quick">'+b('Tahrir','premium-edit-notice',n.id,'secondary')+
        b(n.pinned?'Oddiy qilish':'Yuqoriga chiqarish','premium-pin-notice',n.id,'secondary')+
        (n.archived?b('Tiklash','premium-restore-notice',n.id,'secondary'):b('Arxiv','premium-archive-notice',n.id,'danger'))+'</div>';
      root.append(card);
    }
  }
  function noticeModal(id,ctx){
    const n=v.cachedNotices.find(x=>x.id===id);if(!n)return ctx.toast('E’lon topilmadi');
    $('premium-edit')?.remove();
    const html='<div id="premium-edit" class="premium-modal"><div class="premium-modal-box"><h3>E’lonni tahrirlash</h3>'+
      '<form class="appform" data-form="premium-notice-edit" data-id="'+id+'">'+
      field('Sarlavha','title','text',n.title,'required maxlength="120"')+
      '<label>Matn<textarea name="body" required maxlength="1000">'+esc(n.body)+'</textarea></label>'+
      groupBox(ctx,'group_id',n.group_id||'',true)+
      '<label class="premium-check"><input type="checkbox" name="pinned" value="1" '+(n.pinned?'checked':'')+'> Muhim e’lon</label>'+
      field('Chop etish vaqti','publish_at','datetime-local',asTime(n.publish_at))+
      field('Yakunlanish vaqti','expires_at','datetime-local',asTime(n.expires_at))+
      '<div class="premium-quick"><button type="submit" class="appbtn">Saqlash</button>'+b('Bekor qilish','premium-close','','secondary')+
      '</div></form></div></div>';
    $('admin-tab-content').insertAdjacentHTML('beforeend',html);
  }
  async function audit(root,ctx){
    const r=await ctx.api('/admin/v2/audit?limit=100',{admin:true});
    root.innerHTML=section('Harakatlar tarixi',r.events.length+' yozuv')+note('Bu jurnal admin panelidagi muvaffaqiyatli o‘zgartirishlarni qayd qiladi, maxfiy tokenlar yozilmaydi.');
    if(!r.events.length)root.innerHTML+='<div class="empty">Hali admin amali qayd qilinmagan.</div>';
    for(const item of r.events)root.innerHTML+=row(item.event_type,item.description,previewDate(item.created_at));
  }
  async function archive(root,ctx){
    const types=[['students','O‘quvchilar'],['groups','Guruhlar'],['sessions','Mashg‘ulotlar'],['notices','E’lonlar']];
    root.innerHTML=section('Arxiv va tiklash')+
      '<div class="appcard"><label>Arxiv turi<select name="archive-type" data-premium-filter="archive-type">'+
      types.map(([key,label])=>'<option value="'+key+'"'+(v.archiveType===key?' selected':'')+'>'+label+'</option>').join('')+
      '</select></label></div><div id="premium-archive-list"></div>';
    await loadArchive(ctx);
  }
  async function loadArchive(ctx){
    const root=$('premium-archive-list');if(!root)return;loading(root);
    try{
      const r=await ctx.api('/admin/v2/archive?type='+encodeURIComponent(v.archiveType),{admin:true});
      root.innerHTML=r.items.length?'':'<div class="empty">Arxivda ma’lumot topilmadi.</div>';
      for(const item of r.items){
        root.innerHTML+='<div class="appcard"><b>'+esc(item.title)+'</b><div class="action-row">'+b('Arxivdan tiklash','premium-restore-archive',item.id,'secondary')+'</div></div>';
      }
    }catch(e){error(root,e)}
  }
  async function exports(root,ctx){
    root.innerHTML=section('Ma’lumotlarni eksport qilish')+
      '<div class="appcard">'+groupBox(ctx,'export-group',v.exportGroup)+
      note('CSV fayllarni Excel va Google Sheets dasturlarida ochish mumkin. Telefon raqamlari faqat admin eksportida mavjud.')+
      '<div class="premium-export-list">'+
      [['students','O‘quvchilar ro‘yxati'],['results','Baholar va natijalar'],['attendance','Davomat va DQ'],['sessions','Mashg‘ulotlar'],['ranking','Reyting hisoboti']].map(([key,label])=>
        '<button class="premium-export-item" data-act="premium-export" data-id="'+key+'"><span>'+esc(label)+'</span><strong>CSV ↓</strong></button>').join('')+
      '</div></div>';
  }
  function security(root,ctx){
    root.innerHTML=section('Xavfsizlik')+
      '<div class="appcard"><h3>Administrator · Жанзаков Б</h3>'+
      note('Sessiya 12 soat amal qiladi. Token va baza parollari dastur ichida emas, faqat server muhitida saqlanadi.')+
      '<div class="premium-row"><div><strong>Admin sessiyasi</strong><small>Serverdagi tekshiruv bilan</small></div><b>Faol</b></div>'+
      '<div class="premium-row"><div><strong>Ma’lumot vaqti</strong><small>Toshkent — Asia/Tashkent</small></div><b>UTC+5</b></div>'+
      '<div class="premium-quick">'+b('Seansdan chiqish','premium-logout','', 'danger')+
      b('Harakatlar jurnali','premium-tab','audit','secondary')+'</div></div>'+
      '<div class="appcard"><h3>Serverni ulash</h3>'+note('Render → nur-apk-api → Environment → DATABASE_URL. Bu satrni chatga yubormang.')+'</div>';
  }
  function showCatalog(root){
    const count=catalog.filter(x=>x[1]).length;
    root.innerHTML=section('TOP 17 premium funksiya',count+' ta kodlangan')+
      note('Pastdagi “Kodlandi” holati ishlab chiqilgan funksiyani bildiradi. Jonli ishlashi uchun Render DATABASE_URL ulanib, API tekshiruvidan o‘tishi kerak.')+
      '<div class="premium-catalog">'+catalog.map(([title,ready],i)=>
        '<div><span class="premium-catalog-no">'+pad(i+1)+'</span><span>'+esc(title)+'</span><small class="'+(ready?'ready':'planned')+'">'+(ready?'Kodlandi':'Keyingi')+'</small></div>').join('')+'</div>';
  }
  async function downloadCsv(kind,ctx){
    const auth=sessionStorage.getItem('nur-apk-admin-session');
    if(!auth)throw new Error('Admin sessiyasi tugagan');
    const search=new URLSearchParams({kind});
    if(v.exportGroup)search.set('group_id',v.exportGroup);
    const resp=await fetch('https://nur-apk-api.onrender.com/api/admin/v2/export?'+search,{headers:{Authorization:'Bearer '+auth},cache:'no-store'});
    if(!resp.ok)throw new Error('Hisobot yuklanmadi ('+resp.status+')');
    const blob=await resp.blob();
    const filename='nur-apk-'+kind+'-'+ymd()+'.csv';
    if(window.NurFiles && typeof window.NurFiles.saveCsv==='function'){
      const dataUrl=await new Promise((resolve,reject)=>{
        const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Faylni tayyorlashda xatolik'));reader.readAsDataURL(blob);
      });
      window.NurFiles.saveCsv(filename,String(dataUrl).split(',')[1]);
      ctx.toast('Telefonning fayl saqlash oynasi ochiladi');return;
    }
    const href=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=href;a.download=filename;
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),2500);
    ctx.toast('CSV hisobot yuklandi');
  }
  async function onSubmit(form,ctx){
    const type=form.dataset.form;
    if(!type?.startsWith('premium-'))return;
    const data=Object.fromEntries(new FormData(form));
    const submit=form.querySelector('button[type=submit]');if(submit)submit.disabled=true;
    try{
      let endpoint='',body={},method='POST';
      if(type==='premium-student-add'){
        endpoint='/admin/v2/students';body={group_id:Number(data.group_id),full_name:data.full_name,phone:data.phone,notes:data.notes};
      }else if(type==='premium-student-edit'){
        endpoint='/admin/v2/students/'+Number(form.dataset.id);method='PATCH';
        body={group_id:Number(data.group_id),full_name:data.full_name,phone:data.phone,notes:data.notes};
      }else if(type==='premium-student-import'){
        const lines=data.names.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
        const students=lines.map(line=>{const [name,...rest]=line.split(';');return {full_name:name.trim(),phone:rest.join(';').trim()}});
        if(students.length>100)throw new Error('Bir martada 100 tadan ko‘p o‘quvchi yubormang');
        endpoint='/admin/v2/students/import';body={group_id:Number(data.group_id),students};
      }else if(type==='premium-session-edit'||type==='premium-session-duplicate'){
        const id=Number(form.dataset.id);method=type==='premium-session-edit'?'PATCH':'POST';
        endpoint='/admin/v2/sessions/'+id+(method==='POST'?'/duplicate':'');
        body={title:data.title,held_on:data.held_on};
      }else if(type==='premium-notice-add'||type==='premium-notice-edit'){
        endpoint='/admin/v2/notices'+(type.endsWith('edit')?'/'+Number(form.dataset.id):'');
        method=type.endsWith('edit')?'PATCH':'POST';
        body={title:data.title,body:data.body,group_id:data.group_id?Number(data.group_id):null,
          pinned:form.querySelector('[name=pinned]').checked,publish_at:data.publish_at||null,expires_at:data.expires_at||null};
      }else throw new Error('Noma’lum amal');
      const result=await ctx.api(endpoint,{method,body,admin:true});
      ctx.toast(type==='premium-student-import'?result.imported+' o‘quvchi qo‘shildi, '+result.skipped+' ta takror':'Muvaffaqiyatli saqlandi');
      await ctx.refresh(true);await ctx.renderAdmin();
    }catch(e){ctx.toast(e.message)}finally{if(submit)submit.disabled=false}
  }
  async function onClick(btn,ctx){
    const action=btn.dataset.act;
    if(!action?.startsWith('premium-'))return;
    const id=Number(btn.dataset.id);
    try{
      if(action==='premium-close'){$('premium-edit')?.remove();return}
      if(action==='premium-refresh'){await ctx.renderAdmin();return}
      if(action==='premium-tab'){
        const tab=btn.dataset.id;ctx.state.adminTab=tab;await ctx.showAdminTab();return;
      }
      if(action==='premium-search'){
        v.query=$('premium-student-search')?.value.trim()||'';await loadStudents(ctx);return;
      }
      if(action==='premium-edit-student'){showStudentEdit(id,ctx);return}
      if(action==='premium-edit-session'){showSessionModal('edit',id,ctx);return}
      if(action==='premium-duplicate-session'){showSessionModal('duplicate',id,ctx);return}
      if(action==='premium-edit-notice'){noticeModal(id,ctx);return}
      if(action==='premium-gradebook'){
        ctx.state.sessionId=id;ctx.state.adminTab='marks';await ctx.showAdminTab();return;
      }
      if(action==='premium-pin-notice'){
        const item=v.cachedNotices.find(n=>n.id===id);
        if(!item)return;await ctx.api('/admin/v2/notices/'+id,{admin:true,method:'PATCH',body:{pinned:!item.pinned}});
      }else if(action.startsWith('premium-archive-')){
        if(!confirm('Elementni arxivlamoqchimisiz?'))return;
        const type=action.replace('premium-archive-','');
        const route=type==='student'?'students':type==='session'?'sessions':type==='notice'?'notices':null;
        if(!route)throw new Error('Arxiv turi noto‘g‘ri');
        await ctx.api('/admin/'+route+'/'+id,{admin:true,method:'DELETE'});
      }else if(action==='premium-restore-archive'){
        await ctx.api('/admin/v2/archive/'+v.archiveType+'/'+id+'/restore',{admin:true,method:'POST',body:{}});
      }else if(action==='premium-restore-notice'){
        await ctx.api('/admin/v2/archive/notices/'+id+'/restore',{admin:true,method:'POST',body:{}});
      }else if(action==='premium-export'){
        await downloadCsv(btn.dataset.id,ctx);return;
      }else if(action==='premium-logout'){
        sessionStorage.removeItem('nur-apk-admin-session');window.location.assign('/');return;
      }else return;
      ctx.toast('Amal bajarildi');await ctx.refresh(true);await ctx.renderAdmin();
    }catch(e){ctx.toast(e.message)}
  }
  async function onChange(input,ctx){
    const name=input.dataset.premiumFilter;
    if(!name)return;
    if(name==='students-group'){v.group=input.value;await loadStudents(ctx)}
    if(name==='attendance-group'){v.attendanceGroup=input.value;await loadAttendance(ctx)}
    if(name==='analytics-group'){v.analyticsGroup=input.value;await loadAnalytics(ctx)}
    if(name==='archive-type'){v.archiveType=input.value;await loadArchive(ctx)}
    if(name==='export-group'){v.exportGroup=input.value}
  }
  window.NurPremium={renderTab,onSubmit,onClick,onChange,catalog};
})();
