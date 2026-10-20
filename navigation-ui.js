/* Nur oqiw — Android hardware Back follows the in-app page stack.
 * Android calls a fixed JS expression via evaluateJavascript; no JS bridge.
 * On the home page return false, so Android can ask before app exit.
 */
(() => {
  'use strict';
  const backStack=['home'];
  let navigatingBack=false;
  function currentPage(){return document.querySelector('main.phone .view.show')?.id||'home'}
  function start(){
    const original=window.go;
    if(typeof original!=='function')return;
    const initial=currentPage();
    backStack[0]=initial;
    window.go=function(page){
      if(typeof page!=='string'||!document.getElementById(page)){
        return original.apply(this,arguments);
      }
      const current=currentPage();
      if(!navigatingBack && page!==current){
        backStack.push(page);
        if(backStack.length>35)backStack.splice(1,backStack.length-35);
      }
      return original.apply(this,arguments);
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
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();