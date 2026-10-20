/* Nur oqiw owner portfolio, derived from approved interactive preview.
 * An additional public page only; current Render/Neon admin, ranking and payments are unchanged.
 * Social usernames are link targets, never visible in the UI.
 */
(() => {
  'use strict';
  const svg=(path,other='')=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+path+other+'</svg>';
  const chevron=svg('<path d="m9 5 7 7-7 7"/>');
  const blueBadge='<span class="nur-badge" aria-label="Administrator tasdiqlash belgisi" title="Ilova administratori"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#2596f3" d="M12 1.3 14.65 2.5l2.85-.1 1.2 2.55 2.55 1.2-.15 2.85L22.5 12l-1.4 2.95.15 2.85-2.55 1.2-1.2 2.55-2.85-.1L12 22.7l-2.65-1.25-2.85.1-1.2-2.55-2.55-1.2.15-2.85L1.5 12l1.4-3-.15-2.85 2.55-1.2 1.2-2.55 2.85.1z"/><path stroke="#fff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" fill="none" d="m7.4 12.2 3.1 3.1 6.1-6.7"/></svg></span>';
  const logo=(initials='ЖБ')=>'<span class="nur-owner-avatar" aria-hidden="true">'+initials+'</span>';
  function initIcons(){
    const arrows=document.querySelectorAll('#home .subject .arrow');
    for(const arrow of arrows){arrow.textContent='';arrow.innerHTML=chevron;arrow.setAttribute('aria-hidden','true')}
    const subjects=document.querySelectorAll('#home .subject');
    const russian=subjects[2]?.querySelector('.symbol');
    const english=subjects[3]?.querySelector('.symbol');
    if(russian)russian.innerHTML=svg('<path d="M5 5h10a4 4 0 0 1 4 4v7a3 3 0 0 1-3 3H9l-4 2v-5a4 4 0 0 1-2-4V9a4 4 0 0 1 4-4Z"/><path d="M9 9h6m-3-2v7m-3 0 6-5"/>');
    if(english)english.innerHTML=svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-6 6-6 12 0 18M12 3c6 6 6 12 0 18"/>');
  }
  function buildDrawer(){
    const drawer=document.getElementById('drawer');
    if(!drawer||document.getElementById('nur-portfolio-preview'))return;
    const teaser=document.createElement('section');
    teaser.id='nur-portfolio-preview';teaser.className='nur-portfolio-preview';
    teaser.innerHTML='<h4>Administrator portfoliosi</h4>'+
      '<div class="nur-mini-id"><div class="nur-mini-head">'+logo()+
      '<div class="nur-mini-person"><b>Жанзаков Бегдулла</b>'+blueBadge+
      '<small>Разработчик приложения</small></div></div>'+
      '<div class="nur-mini-meta"><div><strong>40+</strong><span>loyihalar</span></div>'+
      '<button type="button" class="nur-open-portfolio" aria-label="Administrator portfoliosini ochish">Ochish '+chevron+'</button></div></div>';
    teaser.querySelector('button').addEventListener('click',openPortfolio);
    const footer=document.createElement('div');
    footer.className='nur-drawer-footer';
    footer.innerHTML='<button type="button" class="nur-owner-shortcut" aria-label="Administrator portfoliosi">'+logo()+
      '<span class="nur-owner-shortcut-text"><strong>Жанзаков Бегдулла</strong><small>Администратор приложения</small></span>'+chevron+'</button>';
    footer.querySelector('button').addEventListener('click',openPortfolio);
    drawer.append(teaser,footer);
  }
  function buildPage(){
    const phone=document.querySelector('main.phone');
    if(!phone||document.getElementById('portfolio'))return;
    const section=document.createElement('section');
    section.id='portfolio';section.className='view subpage nur-portfolio-page';
    const java=svg('<path d="M8 17c-3 .5-3 2 4 2s8-1.5 4-2M8 13c-2 .6-2 2 4 2s6-1.4 4-2M9.5 3c-2 2 2 2.6.2 5M14 2c-3 2 2 3-1 6M6 20c3 2 9 2 12 0"/>');
    const python=svg('<path d="M12 2H7a4 4 0 0 0-4 4v4h9v3H7a4 4 0 0 0-4 4v1a4 4 0 0 0 4 4h6M12 22h5a4 4 0 0 0 4-4v-4h-9v-3h5a4 4 0 0 0 4-4V6a4 4 0 0 0-4-4h-5"/><path d="M8 6h.01M16 18h.01" stroke-width="2.6"/>');
    const cpp=svg('<path d="M14 5a8 8 0 1 0 0 14M16 9v6m-3-3h6m3-3v6m-3-3h3"/>');
    const html=svg('<path d="m8 5-6 7 6 7m8-14 6 7-6 7M14 4l-4 16"/>');
    const ig=svg('<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.6 6.6h.01" stroke-width="3"/>');
    const tg=svg('<path d="M21.3 3.5 2.6 10.9c-.9.35-.86 1.3.1 1.62l4.54 1.42 1.58 4.96c.2.6.78.75 1.25.32l2.45-2.35 4.4 3.14c.8.54 1.65.02 1.81-.91L22 5c.17-.95-.05-1.62-.7-1.5Z"/><path d="m7.3 14 11-7.4-8.5 10.7"/>');
    const phoneIcon=svg('<path d="M5.3 3.5 8 3.1l2.1 4.1-2 2c1.2 2.5 3 4.4 5.7 5.7l2-2 4.1 2.1-.4 2.7a3 3 0 0 1-3.4 2.7C9.4 19.6 4.4 14.6 3 8a3 3 0 0 1 2.3-4.5Z"/>');
    section.innerHTML=
      '<button class="back nur-portfolio-back" type="button">Bosh menyu</button>'+
      '<div class="nur-portfolio-kicker">NUR OQIW / PORTFOLIO</div>'+
      '<h2>Администратор приложения</h2>'+
      '<p class="desc">Administrator portfoliosi va aloqa ma’lumotlari.</p>'+
      '<article class="nur-id-card"><div class="nur-id-head"><b>NUR OQIW</b><span>ADMIN / PORTFOLIO</span></div>'+
      '<div class="nur-id-person">'+logo()+'<div class="nur-id-name"><b>Жанзаков<br>Бегдулла</b>'+blueBadge+
      '<p>Разработчик и администратор приложения</p></div></div>'+
      '<div class="nur-id-bottom"><span><strong>40+</strong><small>Tugallangan loyihalar</small></span><em>PORTFOLIO</em></div></article>'+
      '<article class="nur-contact-card"><div class="nur-card-head"><b>Aloqa ma’lumotlari</b><small>CONTACT</small></div>'+
      '<a class="nur-phone-link" href="tel:+998919360924" aria-label="Qo‘ng‘iroq: +998 91 936 09 24"><span class="nur-phone-icon">'+phoneIcon+'</span><span><small>Telefon</small><strong>+998 91 936 09 24</strong></span></a>'+
      '<div class="nur-social-links"><a href="https://www.instagram.com/your.sant1z/" target="_blank" rel="noopener noreferrer" aria-label="Instagram profilini ochish" title="Instagram">'+ig+'</a>'+
      '<a href="https://t.me/up17v" target="_blank" rel="noopener noreferrer" aria-label="Telegram profilini ochish" title="Telegram">'+tg+'</a></div>'+
      '<p class="nur-social-help">Ikonchani bosing — profil ochiladi.</p></article>'+
      '<article class="nur-skills"><div class="nur-card-head"><b>Texnologiyalar</b><small>DEVELOPMENT</small></div>'+
      '<div class="nur-skill-grid">'+
      '<div class="nur-skill"><span>'+java+'</span><b>Java</b></div>'+
      '<div class="nur-skill"><span>'+python+'</span><b>Python</b></div>'+
      '<div class="nur-skill"><span>'+cpp+'</span><b>C++</b></div>'+
      '<div class="nur-skill"><span>'+html+'</span><b>HTML</b></div></div></article>';
    section.querySelector('.nur-portfolio-back').addEventListener('click',()=>window.go('home'));
    const nav=phone.querySelector('.tabbar');
    if(nav)nav.before(section);else phone.append(section);
  }
  function openPortfolio(){
    if(typeof window.closeMenu==='function')window.closeMenu();
    if(typeof window.go==='function')window.go('portfolio');
    else {
      document.querySelectorAll('.view').forEach(x=>x.classList.remove('show'));
      document.getElementById('portfolio')?.classList.add('show');
    }
    window.scrollTo({top:0,behavior:'instant'});
  }
  function init(){
    initIcons();buildDrawer();buildPage();
    if(window.NurI18n?.refresh)window.NurI18n.refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();