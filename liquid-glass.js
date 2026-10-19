/* Animated droplet navigation: no layout rewrites and no icon changes. */
(() => {
  'use strict';
  const nav=document.querySelector('.tabbar');
  if(!nav)return;
  const tabs=[...nav.querySelectorAll('button[data-page]')];
  if(!tabs.length)return;
  const pill=document.createElement('div');pill.className='glass-bubble';
  pill.setAttribute('aria-hidden','true');
  pill.innerHTML='<span></span>';
  nav.prepend(pill);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let lastActive='',restartId=0,frame=0;
  function reposition(immediate=false){
    const tab=tabs.find(x=>x.classList.contains('active'))||tabs[0];
    const navBox=nav.getBoundingClientRect(),rect=tab.getBoundingClientRect();
    const x=rect.left-navBox.left;
    const y=rect.top-navBox.top;
    if(immediate)pill.style.transition='none';
    pill.style.width=Math.round(rect.width)+'px';
    pill.style.height=Math.round(rect.height)+'px';
    pill.style.transform='translate3d('+Math.round(x)+'px,'+Math.round(y)+'px,0)';
    if(immediate)requestAnimationFrame(()=>{pill.style.transition=''});
    if(lastActive!==tab.dataset.page){
      if(lastActive && !reduced.matches){
        pill.classList.remove('moving');void pill.offsetWidth;pill.classList.add('moving');
        clearTimeout(restartId);restartId=setTimeout(()=>pill.classList.remove('moving'),540);
      }
      lastActive=tab.dataset.page;
    }
  }
  function queue(){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>reposition(false))}
  new MutationObserver(queue).observe(nav,{attributes:true,subtree:true,attributeFilter:['class']});
  nav.addEventListener('pointerdown',ev=>{
    const button=ev.target.closest('button[data-page]');
    if(!button||reduced.matches)return;
    const r=document.createElement('span');r.className='glass-tap';
    button.append(r);setTimeout(()=>r.remove(),520);
  },{passive:true});
  nav.addEventListener('click',queue);
  addEventListener('resize',queue,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(queue,160));
  addEventListener('load',queue,{once:true});
  if(document.fonts?.ready)document.fonts.ready.then(queue).catch(()=>{});
  requestAnimationFrame(()=>reposition(true));
  document.querySelector('#drawer')?.setAttribute('aria-label','Silliq ochiladigan sozlamalar menyusi');
})();
