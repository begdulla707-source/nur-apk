/* Nur oqiw — compact verified owner row.
 * Two deliberate taps reveal the secure administrator login.
 * This is a UI shortcut, never authentication by itself.
 */
(() => {
  'use strict';
  function init(){
    const drawer=document.getElementById('drawer');
    if(!drawer||drawer.querySelector('#nur-owner-shortcut'))return;
    drawer.querySelector('#nur-portfolio-preview')?.remove();
    const row=document.createElement('button');
    row.type='button';row.id='nur-owner-shortcut';row.className='nur-compact-owner';
    row.setAttribute('aria-label','Administrator kirish uchun ikki marta bosing');
    row.innerHTML='<span class="nur-compact-avatar" aria-hidden="true">ЖБ</span>'+
     '<span class="nur-compact-title"><strong>Жанзаков Бегдулла</strong>'+
     '<small>Администратор приложения</small></span>'+
     '<svg class="nur-mini-verified" viewBox="0 0 24 24" aria-hidden="true">'+
     '<path fill="#2497ed" d="M12 1 15 3l3-.1 1.3 3 2.7 1.5-.4 3.1 1.4 2.5-1.8 2.5.2 3.1-3 1.3L16 23l-4-1.5L8 23l-2.4-3.2-3-1.3.2-3.1L1 13l1.4-2.5L2 7.4l2.7-1.5 1.3-3L9 3z"/>'+
     '<path d="m7.4 12.2 3.1 3.1 6.1-6.7" fill="none" stroke="#fff" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round"/></svg>';
    let tapped=0,last=0;
    row.addEventListener('click',()=>{
      const now=Date.now();
      tapped=now-last<1700?tapped+1:1;
      last=now;
      if(tapped>=2){
        tapped=0;
        if(typeof window.closeMenu==='function')window.closeMenu();
        if(typeof window.go==='function')window.go('admin');
      }
    });
    const footer=document.createElement('div');
    footer.className='nur-compact-owner-wrap';
    footer.append(row);
    drawer.append(footer);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();