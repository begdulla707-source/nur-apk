/* Touch-driven Liquid Glass navigation: tap, hold and drag across three tabs.
   Lightweight transforms avoid continuously repainting large blurred surfaces. */
(() => {
  'use strict';
  const nav=document.querySelector('.tabbar');
  if(!nav)return;
  const tabs=[...nav.querySelectorAll('button[data-page]')];
  if(tabs.length!==3)return;
  const bubble=document.createElement('div');
  bubble.className='glass-bubble';
  bubble.setAttribute('aria-hidden','true');
  bubble.innerHTML='<span></span>';
  nav.prepend(bubble);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let pointerId=null,startX=0,startY=0,dragging=false,longHeld=false;
  let downTime=0,locked=false,holdTimer=0,suppressClicksUntil=0;
  let redraw=0,bounceTimer=0,lastActive='',hintTarget=null;
  const gap=9;
  function closest(clientX){
    let target=tabs[0],distance=Infinity;
    for(const tab of tabs){
      const rect=tab.getBoundingClientRect();
      const delta=Math.abs(rect.left+rect.width/2-clientX);
      if(delta<distance){distance=delta;target=tab}
    }
    return target;
  }
  function position(tab,options={}){
    if(!tab)return;
    const bar=nav.getBoundingClientRect(),box=tab.getBoundingClientRect();
    const x=Math.round(box.left-bar.left);
    const y=Math.round(box.top-bar.top);
    if(options.immediate)bubble.style.transition='none';
    bubble.style.width=Math.round(box.width)+'px';
    bubble.style.height=Math.round(box.height)+'px';
    bubble.style.transform='translate3d('+x+'px,'+y+'px,0)';
    if(options.immediate)requestAnimationFrame(()=>bubble.style.removeProperty('transition'));
    if(!options.quiet && !reduced.matches && lastActive!==tab.dataset.page){
      bubble.classList.remove('moving');
      void bubble.offsetWidth;
      bubble.classList.add('moving');
      clearTimeout(bounceTimer);
      bounceTimer=setTimeout(()=>bubble.classList.remove('moving'),450);
    }
    if(!options.quiet)lastActive=tab.dataset.page;
  }
  function move(){
    if(dragging||locked)return;
    const selected=tabs.find(tab=>tab.classList.contains('active'))||tabs[0];
    position(selected,{quiet:false});
  }
  function schedule(){
    if(dragging)return;
    cancelAnimationFrame(redraw);
    redraw=requestAnimationFrame(move);
  }
  // Only observe the three tab buttons; observing the whole nav caused
  // the glass effect itself to trigger a MutationObserver animation loop.
  for(const tab of tabs){
    new MutationObserver(schedule).observe(tab,{attributes:true,attributeFilter:['class']});
  }
  function activePreview(target){
    tabs.forEach(tab=>tab.classList.toggle('drag-preview',tab===target));
    hintTarget=target;
  }
  function releasePreview(){tabs.forEach(tab=>tab.classList.remove('drag-preview'));hintTarget=null}
  function startDrag(event){
    if(dragging||pointerId===null)return;
    dragging=true;
    try{nav.setPointerCapture(pointerId)}catch{}
    clearTimeout(holdTimer);
    nav.classList.add('glass-dragging');
    bubble.classList.remove('moving');
    activePreview(closest(event.clientX));
    position(hintTarget,{quiet:true});
  }
  nav.addEventListener('pointerdown',event=>{
    if(pointerId!==null || !event.isPrimary || event.button>0)return;
    const hit=event.target.closest('button[data-page]');
    if(!hit)return;
    pointerId=event.pointerId;
    startX=event.clientX;startY=event.clientY;
    downTime=performance.now();dragging=false;longHeld=false;
    // Do not capture taps; Android must still dispatch normal button clicks.
    clearTimeout(holdTimer);
    holdTimer=setTimeout(()=>{
      if(pointerId!==null){
        longHeld=true;startDrag({clientX:startX,clientY:startY});
        // A tiny vibration is optional and never required for navigation.
        if(navigator.vibrate)navigator.vibrate(8);
      }
    },230);
  },{passive:true});
  nav.addEventListener('pointermove',event=>{
    if(pointerId!==event.pointerId)return;
    const dx=event.clientX-startX,dy=event.clientY-startY;
    if(!dragging && Math.abs(dy)>30 && Math.abs(dy)>Math.abs(dx)*1.6){
      clearTimeout(holdTimer);
      pointerId=null;
      return;
    }
    if(!dragging && Math.abs(dx)>gap)startDrag(event);
    if(!dragging)return;
    event.preventDefault();
    const target=closest(event.clientX);
    if(hintTarget!==target){
      activePreview(target);
      if(!reduced.matches && navigator.vibrate)navigator.vibrate(3);
    }
    // Liquid follows the tab nearest to the finger, smoothly.
    position(target,{quiet:true});
  },{passive:false});
  function finish(event,cancel=false){
    if(pointerId===null || pointerId!==event.pointerId)return;
    const wasDragging=dragging;
    clearTimeout(holdTimer);
    pointerId=null;dragging=false;longHeld=false;
    nav.classList.remove('glass-dragging');
    releasePreview();
    if(wasDragging){
      suppressClicksUntil=performance.now()+450;
      const dest=closest(event.clientX);
      const current=tabs.find(tab=>tab.classList.contains('active'));
      if(!cancel && dest && dest!==current && typeof window.go==='function'){
        window.go(dest.dataset.page);
      }
      schedule();
    }else{
      schedule();
    }
    try{nav.releasePointerCapture(event.pointerId)}catch{}
  }
  nav.addEventListener('pointerup',event=>finish(event),{passive:true});
  nav.addEventListener('pointercancel',event=>finish(event,true),{passive:true});
  // Captured pointerup can synthesize a click on the starting tab:
  // ignore it after a swipe, otherwise it would undo the selected section.
  nav.addEventListener('click',event=>{
    if(performance.now()<suppressClicksUntil){
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },true);
  nav.addEventListener('click',schedule);
  addEventListener('resize',schedule,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(schedule,140));
  if(document.fonts?.ready)document.fonts.ready.then(schedule).catch(()=>{});
  addEventListener('pageshow',schedule);
  requestAnimationFrame(()=>position(tabs.find(tab=>tab.classList.contains('active'))||tabs[0],{immediate:true,quiet:true}));
  nav.setAttribute('aria-label','Bosh menyu, Reyting va Natijalar: bosib turing va suring');
})();
