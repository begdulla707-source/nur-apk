'use strict';
const assert=require('node:assert/strict');
const OCR=require('../math-ocr.js');
const at=(text,x,y,w=.046,h=.026)=>({text,x,y,w,h});
const rows=[
  at('Durisi',.265,.121,.055),at('Durisi',.625,.121,.055),
  at('Ametov',.084,.22,.065),at('Nurbol',.161,.22,.048),
  at('19',.285,.22,.017),at('59,4',.335,.22,.032),
  at('Orazbaev',.419,.22,.083),at('Ruslan',.514,.22,.050),at('31',.637,.22,.017),
  at('Ayapbergenova',.084,.272,.124),at('Raziya',.21,.272,.038),
  at('32',.286,.272,.017),
  at('Paraxatov',.420,.272,.081),at('Adilbek',.510,.272,.057),
  at('32',.635,.272,.017),
  at('Janzakov',.083,.324,.083),at('Begdulla',.175,.324,.063),
  at('26',.288,.324,.017),
  at('Quli',.42,.324,.05),at('Nursultan',.48,.324,.076),at('0',.635,.324,.015),
  at('Testke',.75,.32,.05),at('qatnasqan',.82,.32,.085),at('22',.93,.32,.02)
];
const result=OCR.parse({elements:rows});
assert.equal(result.rows.length,6,JSON.stringify(result));
console.log('OCR preview rows:',JSON.stringify(result.rows));
const byName=Object.fromEntries(result.rows.map(r=>[r.name,r]));
assert.equal(byName['Ametov Nurbol'].correct,19);
assert.equal(byName['Orazbaev Ruslan'].correct,31);
assert.equal(byName['Ayapbergenova Raziya'].correct,32);
assert.equal(byName['Paraxatov Adilbek'].correct,32);
assert.equal(byName['Janzakov Begdulla'].correct,26);
assert.equal(byName['Quli Nursultan'].status,'unresolved');
assert.equal(byName['Quli Nursultan'].correct,null);
assert.equal(result.requires_confirmation,true);
assert(result.warnings.length>=2);
const none=OCR.parse({elements:[]});
assert.equal(none.rows.length,0);
assert(none.warnings.length);
console.log('PASS: dual-column OCR, numeric scores, missing/zero=review, safe empty parse');

const full=[at('Durisi|',.265,.105,.055),at('Durisi',.625,.105,.055)];
for(let i=0;i<26;i++){
  const left=i<16, column=left?0:1, r=left?i:i-16;
  const y=.17+r*.046;
  const x=column===0?.071:.414;
  const score=[0,5,12,24].includes(i)?0:Math.min(32,19+i%14);
  full.push(at('|Fam'+i,x,y,.070),at('Ali'+i,x+.083,y,.048));
  full.push(at(String(score)+'_|',column===0?.285:.636,y,.023));
}
full.push(at('Testke',.75,.18,.055),at('qatnasqan',.81,.18,.09),at('22',.93,.18,.02));
full.push(at('Testke',.75,.25,.055),at('qatnaspagan',.81,.25,.09),at('4',.93,.25,.02));
full.push(at('Sorawlar',.75,.32,.07),at('sani:',.83,.32,.05),at('32',.93,.32,.02));
const complete=OCR.parse({elements:full});
assert.equal(complete.rows.length,26,JSON.stringify(complete));
assert.equal(complete.summary.present,22);
assert.equal(complete.summary.absent,4);
assert.equal(complete.summary.questions,32);
assert.equal(complete.rows[0].correct,null);
assert.equal(complete.rows[0].status,'unresolved');
assert.equal(complete.rows[1].correct,20);
assert.equal(complete.rows[16].name,'Fam16 Ali16');
assert.equal(complete.summary.missingRows,undefined);
const partial=OCR.parse({elements:full.filter(x=>x.text!=='|Fam25'&&x.text!=='Ali25')});
assert.equal(partial.summary.missingRows,true);
assert(partial.warnings.some(x=>x.includes('DIQQAT')));
console.log('PASS: full 26-row sheet, decorated score cells, 22/4 attendance, 32 questions and missing-row warning');
