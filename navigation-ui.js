/* Nur oqiw — Android hardware Back follows the in-app page stack.
 * Android calls a fixed JS expression via evaluateJavascript; no JS bridge.
 * Admin navigation stays in the admin workspace when visiting rating/results.
 * The admin screen's own Back/Bosh menyu still exits to public home.
 */
(() => {
  'use strict';
  const backStack=['home'];
  let navigatingBack=false;
  let cameFromAdmin=false;
  function currentPage(){return document.querySelector('main.phone .view.show')?.id||'home'}
  function hasAdminSession(){
    try {
      return Boolean(localStorage.getItem('nur-apk-admin-session')||
        sessionStorage.getItem('nur-apk-admin-session'));
    } catch {return false}
  }
  function setButtonLabel(button,label){
    if(!button)return;
    // Preserve SVG icons, tooltips and other child controls.
    const text=[...button.childNodes].find(node=>node.nodeType===3);
    if(text)text.textContent=label;
  }
  function syncAdminReturnLabels(){
    const page=currentPage();
    const returnToAdmin=cameFromAdmin&&hasAdminSession()&&page!=='admin'&&page!=='home';
    const label=window.NurI18n?.translate?.(returnToAdmin?'Admin':'Bosh menyu')||
      (returnToAdmin?'Admin':'Bosh menyu');
    setButtonLabel(document.querySelector('.tabbar button[data-page="home"]'),label);
    for(const id of ['rating','results','math-monthly','nur-settings']){
      const back=document.querySelector('#'+id+' > button.back');
      if(back)back.textContent=window.NurI18n?.translate?.(returnToAdmin?'Admin panel':'Bosh menyu')||
        (returnToAdmin?'Admin panel':'Bosh menyu');
    }
  }
  function resolveDestination(page,current){
    if(page==='admin'){
      cameFromAdmin=true;
      return page;
    }
    // An explicit Back/Bosh menu press FROM the admin dashboard exits it.
    if(page==='home'&&current==='admin'){
      cameFromAdmin=false;
      return 'home';
    }
    // In a rating/results tab opened FROM admin, return to the admin panel,
    // not to the ordinary home page. No credentials are inferred or created.
    if(page==='home'&&cameFromAdmin&&hasAdminSession()&&current!=='home')
      return 'admin';
    if(page==='home')cameFromAdmin=false;
    return page;
  }
  // The desktop sidebar remains visible; mobile drawer behavior is untouched.
  function syncDesktopSidebar(){
    const drawer=document.getElementById('drawer');
    if(!drawer)return;
    const desktop=typeof matchMedia==='function' &&
      matchMedia('(min-width: 900px) and (pointer: fine)').matches;
    if(desktop){
      drawer.setAttribute('aria-hidden','false');
      document.getElementById('overlay')?.classList.remove('open');
    }else if(!drawer.classList.contains('open')){
      drawer.setAttribute('aria-hidden','true');
    }
  }
  function start(){
    const original=window.go;
    if(typeof original!=='function')return;
    const initial=currentPage();
    backStack[0]=initial;
    cameFromAdmin=initial==='admin';
    window.go=function(page){
      if(typeof page!=='string'||!document.getElementById(page)){
        return original.apply(this,arguments);
      }
      const current=currentPage();
      const destination=resolveDestination(page,current);
      if(!navigatingBack && destination!==current){
        backStack.push(destination);
        if(backStack.length>35)backStack.splice(1,backStack.length-35);
      }
      const result=original.call(this,destination);
      syncAdminReturnLabels();
      syncDesktopSidebar();
      return result;
    };
    window.NurAndroidBack=function(){
      if(window.NurNotifications?.isOpen?.()){
        window.NurNotifications.close();return true;
      }
      const drawer=document.getElementById('drawer');
      if(drawer?.classList.contains('open')){
        if(typeof window.closeMenu==='function')window.closeMenu();
        return true;
      }
      const current=currentPage();
      if(current==='home')return false;
      if(backStack.at(-1)!==current)backStack.push(current);
      backStack.pop();
      const previous=backStack.at(-1)||'home';
      navigatingBack=true;
      try{window.go(previous)}finally{navigatingBack=false}
      window.scrollTo({top:0,behavior:'instant'});
      return true;
    };
    syncAdminReturnLabels();
    syncDesktopSidebar();
    if(typeof matchMedia==='function'){
      const query=matchMedia('(min-width: 900px) and (pointer: fine)');
      if(typeof query.addEventListener==='function')
        query.addEventListener('change',syncDesktopSidebar);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
