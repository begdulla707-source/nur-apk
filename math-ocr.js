/* Nur oqiw: parse on-device ML Kit OCR word coordinates from two-panel test
   result photographs. Parsing is deliberately conservative: every row is
   reviewed by the admin and missing/zero results require confirmation.
   No server-side automatic publishing or attendance guesses. */
(function(factory){
  const api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  if(typeof window!=='undefined')window.NurOCR=api;
})(function(){
  'use strict';
  const NAME_LIMIT=120;
  function norm(s){return String(s||'').trim().replace(/\s+/g,' ')}
  function median(nums){if(!nums.length)return 0;let a=[...nums].sort((x,y)=>x-y);return a[Math.floor(a.length/2)]}
  function isTitle(s){return /^(f\.?a\.?|d[uú]r[iı]s[iı]|100%|№|no|test|result|natija|familiya)$/i.test(norm(s))}
  function headerScore(s){return /d[uú]r[iı]s[iı]|to[gǵg']ri|correct|ball|natija/i.test(norm(s))}
  function isName(s){
    const v=norm(s);
    return v.length>=5 && v.length<=NAME_LIMIT &&
      /[A-Za-zÀ-žʻʼ‘’]/.test(v) && !isTitle(v) &&
      !/^\d/.test(v) && !/^(o'rtacha|sorawlar|testke|testga|okt[yi]abr|guruh|gruppa|jami|qatnas|matematika|nur oqiw)/i.test(v);
  }
  function parse(input){
    const raw=Array.isArray(input)?input:input&&Array.isArray(input.elements)?input.elements:[];
    const warnings=[];
    if(raw.length>1800)return {rows:[],warnings:['Rasmda juda ko\u2018p matn topildi. Jadvalni yaqinroq suratga oling.']};
    const tokens=raw.map(z=>({
      t:norm(z.text),x:Number(z.x),y:Number(z.y),w:Number(z.w),h:Number(z.h)
    })).filter(z=>z.t&&[z.x,z.y,z.w,z.h].every(Number.isFinite)&&
      z.x>=0&&z.y>=0&&z.x<=1&&z.y<=1&&z.w>0&&z.h>0&&z.w<=1&&z.h<=1);
    if(tokens.length<5)return {rows:[],warnings:['Rasmdan o\u2018qiladigan matn topilmadi; tiniqroq rasm tanlang.']};
    const heights=tokens.map(z=>z.h).filter(h=>h<0.10);
    const rowTol=Math.max(.014,Math.min(.028,median(heights)*.65));
    const heads=tokens.filter(z=>headerScore(z.t)).sort((a,b)=>a.x-b.x);
    // In the supplied NUR table each half is No | F.A | Durisi | 100%.
    // Where two Durisi columns can be detected, derive the score column
    // positions from those headers instead of assuming the image size.
    const plausible=heads.filter(z=>z.y<.40 && z.x<.90);
    let scoreXs=[];
    for(const h of plausible){
      const x=h.x+h.w/2;
      if(!scoreXs.some(k=>Math.abs(k-x)<.10))scoreXs.push(x);
    }
    scoreXs=scoreXs.sort((a,b)=>a-b).slice(0,2);
    if(scoreXs.length===0){
      scoreXs=[.291,.637];
      warnings.push('Ustun sarlavhalari noaniq: standart ikki qismli jadval bo\u2018yicha tekshiring.');
    }else if(scoreXs.length===1){
      // A cropped single-panel table is possible.
      warnings.push('Faqat bitta ball ustuni aniqlandi: barcha qatorlarni tekshiring.');
    }
    const headerBottom=plausible.length?Math.max(...plausible.map(z=>z.y+z.h)):.14;
    const minY=Math.max(.09,Math.min(.35,headerBottom+.004));
    const results=[];
    for(let column=0;column<scoreXs.length;column++){
      const sx=scoreXs[column];
      const preceding=column===0?0:scoreXs[column-1]+.065;
      const names=tokens.filter(z=>{
        const x=z.x+z.w/2;
        return z.y>=minY && x>Math.max(preceding,sx-.29) &&
          x<sx-.042 && isName(z.t) &&
          !/^[\d.,%/]+$/.test(z.t);
      }).sort((a,b)=>(a.y+a.h/2)-(b.y+b.h/2)||a.x-b.x);
      const scores=tokens.filter(z=>{
        const x=z.x+z.w/2;
        return z.y>=minY && Math.abs(x-sx)<.046 &&
          /^\d{1,3}$/.test(z.t.trim());
      });
      let group=[];
      function flush(){
        if(!group.length)return;
        const y=group.reduce((sum,z)=>sum+z.y+z.h/2,0)/group.length;
        const name=norm(group.sort((a,b)=>a.x-b.x).map(z=>z.t).join(' '));
        group=[];
        if(!isName(name))return;
        const nearest=scores.map(z=>({z,dist:Math.abs(z.y+z.h/2-y)}))
          .filter(a=>a.dist<Math.max(.025,rowTol*1.65))
          .sort((a,b)=>a.dist-b.dist)[0];
        const correct=nearest?Number(nearest.z.t):null;
        if(correct!==null && correct>200)return;
        const ambiguous=correct===null||correct===0;
        results.push({name,grade:null,correct:ambiguous?null:correct,
          status:ambiguous?'unresolved':'present',_y:y,_col:column});
        if(ambiguous)warnings.push(name+': 0 ball yoki noma\u2019lum natija. Admin DQ/0/ballni tanlasin.');
        if(name.split(/\s+/).length<2)warnings.push(name+': ism yoki familiya to\u2018liq o\u2018qilmagan bo\u2018lishi mumkin.');
      }
      for(const part of names){
        if(group.length && Math.abs(part.y+part.h/2 -
          group.reduce((sum,z)=>sum+z.y+z.h/2,0)/group.length)>rowTol)flush();
        group.push(part);
      }
      flush();
    }
    results.sort((a,b)=>a._col-b._col||a._y-b._y);
    const seen=new Set();
    const rows=[];
    for(const r of results){
      const key=r.name.toLocaleLowerCase('uz');
      if(seen.has(key)){warnings.push(r.name+': rasmda takror topildi.');continue}
      seen.add(key);
      rows.push({name:r.name,grade:null,correct:r.correct,status:r.status});
    }
    if(!rows.length)warnings.push('O\u2018quvchi qatorlari aniqlanmadi. Rasmni to\u2018g\u2018rilab yoki Excel orqali kiriting.');
    else warnings.unshift(rows.length+' ta o\u2018quvchi topildi. BARCHA ismlar va ballarni tasdiqlang.');
    return {rows,warnings,requires_confirmation:true,engine:'android-mlkit'};
  }
  return {parse};
});
