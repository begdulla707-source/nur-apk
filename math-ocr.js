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
  function norm(s){return String(s||'').replace(/[|_]/g,'').replace(/^[.,:;!?-]+|[.,:;!?-]+$/g,'').trim().replace(/\s+/g,' ')}
  function median(nums){if(!nums.length)return 0;let a=[...nums].sort((x,y)=>x-y);return a[Math.floor(a.length/2)]}
  function isTitle(s){return /^(f\.?a\.?|d[uú]r[iı]s[iı]|100%|№|no|test|result|natija|familiya)$/i.test(norm(s))}
  function headerScore(s){return /d[uú]r[iı]s[iı]|to[gǵg']ri|correct|ball|natija/i.test(norm(s))}
  function isName(s){
    const v=norm(s);
    return v.length>=2 && v.length<=NAME_LIMIT &&
      /[A-Za-zÀ-žʻʼ‘’]/.test(v) && !isTitle(v) &&
      !/^\d/.test(v) && !/^(o'rtacha|sorawlar|testke|testga|okt[yi]abr|guruh|gruppa|jami|qatnas|matematika|nur oqiw)/i.test(v);
  }
  // Header totals identify attendance at the GROUP level, not individual DQ.
  // Never silently treat a zero score as an absence.
  function summaryFromSidePanel(tokens,rowTol){
    const side=tokens.filter(z=>z.x+z.w/2>.72 && z.y<.55).sort((a,b)=>a.y-b.y||a.x-b.x);
    const lines=[];
    for(const z of side){
      const cy=z.y+z.h/2;
      let line=lines.find(g=>Math.abs(g.y-cy)<Math.max(.014,rowTol*.8));
      if(!line){line={y:cy,words:[]};lines.push(line)}
      line.words.push(z);
    }
    const totals={};
    for(const line of lines){
      line.words.sort((a,b)=>a.x-b.x);
      const label=line.words.map(z=>z.t.toLowerCase()).join(' ');
      const values=line.words.filter(z=>/^\d{1,3}$/.test(z.t)).sort((a,b)=>b.x-a.x);
      if(!values.length)continue;
      const count=Number(values[0].t);
      if(!Number.isInteger(count)||count>450)continue;
      if(/s[oó]ra[wuv]lar|s[aá]voll?ar|questions?/.test(label)){
        if(count>0&&count<=200)totals.questions=count;
      }else if(/qatnas|qatnash/.test(label)){
        if(/pa[gǵg']an|magan|m[aá]gan|[eé]mes/.test(label))totals.absent=count;
        else totals.present=count;
      }
    }
    return totals;
  }
  // The A-group photograph has a wide date grid rather than the old
  // 2-panel "F.A / Durisi" layout. Treat EVERY cell as a separate observation.
  // Never interpret an empty/yellow cell as 0 or DQ.
  function parseWideTable(tokens,rowTol){
    const dates=tokens.filter(z=>/^([1-9]|[12][0-9]|3[01])$/.test(z.t)&&
      z.y<.125&&z.x>.27&&z.x<.86);
    const dateLines=[];
    for(const token of dates.sort((a,b)=>a.y-b.y||a.x-b.x)){
      const cy=token.y+token.h/2;
      let line=dateLines.find(g=>Math.abs(g.y-cy)<.014);
      if(!line){line={y:cy,values:[]};dateLines.push(line)}
      line.values.push(token);
    }
    const row=dateLines.filter(g=>g.values.length>=6)
      .sort((a,b)=>a.y-b.y||b.values.length-a.values.length)[0];
    if(!row)return null;
    let columns=row.values.map(z=>({day:Number(z.t),x:z.x+z.w/2})).sort((a,b)=>a.x-b.x);
    columns=columns.filter((col,i)=>i===0||Math.abs(col.x-columns[i-1].x)>.012).slice(0,31);
    if(columns.length<6)return null;
    const firstX=columns[0].x;
    const minY=Math.max(.10,row.y+.035);
    const nameTokens=tokens.filter(z=>z.y+z.h/2>minY&&z.x+z.w/2>.07&&
      z.x<firstX-.022&&isName(z.t))
      .sort((a,b)=>(a.y+a.h/2)-(b.y+b.h/2)||a.x-b.x);
    const lines=[];
    const tolerance=Math.min(.019,Math.max(.011,rowTol*.93));
    for(const word of nameTokens){
      const cy=word.y+word.h/2;
      let line=lines.find(g=>Math.abs(g.cy-cy)<tolerance);
      if(!line){line={cy,words:[]};lines.push(line)}
      line.words.push(word);
    }
    const scoreWords=tokens.filter(z=>z.y+z.h/2>minY&&
      /^\d{1,3}$/.test(z.t)&&z.x+z.w/2>firstX-.023&&z.x<.89);
    const students=[];
    for(const line of lines){
      const name=norm(line.words.sort((a,b)=>a.x-b.x).map(w=>w.t).join(' '));
      if(!isName(name)||name.length<5)continue;
      const values=columns.map((col,i)=>{
        const neighbor=columns[i+1]?.x??col.x+.044;
        const previous=columns[i-1]?.x??col.x-.044;
        const distLimit=Math.min(.026,Math.min(neighbor-col.x,col.x-previous)*.44);
        const matches=scoreWords.filter(z=>
          Math.abs(z.x+z.w/2-col.x)<distLimit &&
          Math.abs(z.y+z.h/2-line.cy)<Math.max(.012,tolerance*1.1))
          .sort((a,b)=>Math.abs(a.y+a.h/2-line.cy)-Math.abs(b.y+b.h/2-line.cy));
        const value=matches.length?Number(matches[0].t):null;
        return Number.isInteger(value)&&value>=0&&value<=200?value:null;
      });
      students.push({name,values});
    }
    if(students.length<2)return null;
    const unique=new Map();
    for(const st of students){
      const key=st.name.toLocaleLowerCase('uz');
      if(!unique.has(key))unique.set(key,st);
    }
    const matrix={dates:columns.map(x=>x.day),students:[...unique.values()]};
    const indexNumbers=tokens.filter(z=>z.y+z.h/2>minY&&z.x<.075&&
      /^\d{1,3}$/.test(z.t)).map(z=>Number(z.t));
    const expectedRows=indexNumbers.length>=3?Math.max(...indexNumbers):null;
    const last=columns.length-1;
    const rows=matrix.students.map(st=>{
      const correct=st.values[last];
      return {name:st.name,grade:null,correct,
        status:correct===null||correct===0?'unresolved':'present'};
    });
    const warnings=[
      'Ko‘p sanali jadval tanildi ('+columns.length+' ta ustun, '+rows.length+
        ' ta o‘quvchi). Har bir sana alohida testdir; yil/oyni tekshiring.',
      'OCR barcha raqamlarni kafolatli o‘qimaydi. Sariq/bo‘sh kataklar natija yo‘q, DQ emas.',
      'Bitta sana ustunini tanlab, uning savollar soni va har bir ballini tekshirgach e’lon qiling.'
    ];
    if(expectedRows&&rows.length<expectedRows)warnings.push(
      'DIQQAT: jadvalda '+expectedRows+' qator bor, OCR esa '+rows.length+
      ' ta ism topdi. Yetishmaganlarni qo‘lda kiriting yoki Excel/CSV yuklang.');
    return {rows,matrix,warnings,summary:{wide:true,expectedRows,
      missingRows:Boolean(expectedRows&&rows.length<expectedRows)},
      requires_confirmation:true,engine:'table-grid-ocr'};
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
    const wide=parseWideTable(tokens,rowTol);
    if(wide)return wide;
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
        // Positive correct answers indicate participation; zero requires review, not auto-DQ.
        const review=correct===null||correct===0;
        results.push({name,grade:null,correct,
          status:review?'unresolved':'present',_y:y,_col:column});
        if(correct===0)warnings.push(name+': 0 ball — qatnashdi yoki DQ ekanini tekshiring.');
        else if(correct===null)warnings.push(name+': ball o‘qilmadi — natijani aniqlang.');
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
    const summary=summaryFromSidePanel(tokens,rowTol);
    if(Number.isInteger(summary.present)||Number.isInteger(summary.absent)){
      const p=summary.present??'?',a=summary.absent??'?';
      warnings.push('Jadval jami: '+p+' ta qatnashgan, '+a+' ta qatnashmagan. 0 ball olganlarning DQ holatini qo\u2018lda tekshiring.');
      if(Number.isInteger(summary.present)&&Number.isInteger(summary.absent)&&
         rows.length!==summary.present+summary.absent){
        warnings.push('DIQQAT: rasmda '+(summary.present+summary.absent)+
          ' o\u2018quvchi qayd etilgan, ammo OCR '+rows.length+
          ' ta ismni topdi. Yetishmagan qatorlarni qo\u2018shmasdan e\u2019lon qilmang.');
        summary.missingRows=true;
      }
    }
    if(summary.questions)warnings.push('Rasmdagi savollar soni: '+summary.questions+' — tasdiqlang.');
    if(!rows.length)warnings.push('O\u2018quvchi qatorlari aniqlanmadi. Rasmni to\u2018g\u2018rilab yoki Excel orqali kiriting.');
    else warnings.unshift(rows.length+' ta o‘quvchi topildi. Musbat ballar avtomatik qatnashgan; faqat 0 ball va noaniq natijalarni ko‘ring.');
    return {rows,warnings,summary,requires_confirmation:true,engine:'android-mlkit'};
  }
  return {parse};
});
