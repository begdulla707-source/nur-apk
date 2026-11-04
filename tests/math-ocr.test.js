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
assert.equal(byName['Orazbaev Ruslan'].status,'present');
assert.equal(byName['Ayapbergenova Raziya'].correct,32);
assert.equal(byName['Paraxatov Adilbek'].correct,32);
assert.equal(byName['Janzakov Begdulla'].correct,26);
assert.equal(byName['Quli Nursultan'].status,'unresolved');
assert.equal(byName['Quli Nursultan'].correct,0);
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
assert.equal(complete.rows[0].correct,0);
assert.equal(complete.rows[0].status,'unresolved');
assert.equal(complete.rows[1].correct,20);
assert.equal(complete.rows[1].status,'present');
assert.equal(complete.rows[16].name,'Fam16 Ali16');
assert.equal(complete.summary.missingRows,undefined);
const partial=OCR.parse({elements:full.filter(x=>x.text!=='|Fam25'&&x.text!=='Ali25')});
assert.equal(partial.summary.missingRows,true);
assert(partial.warnings.some(x=>x.includes('DIQQAT')));
console.log('PASS: full 26-row sheet, decorated score cells, 22/4 attendance, 32 questions and missing-row warning');


// Wide A-group sheet: columns are dates, yellow/missing cells must NOT
// silently become zero or DQ. Only a selected day's scores enter the draft.
const wide=[at('MATEMATIKA',.22,.01,.19),at('Oktyabr',.25,.028,.07)];
const days=[1,4,6,8,10,13,15];
days.forEach((day,i)=>wide.push(at(String(day),.315+i*.071,.062,.018,.020)));
const questionCounts=[40,40,40,40,32,32,15];
questionCounts.forEach((count,i)=>wide.push(at(String(count),.315+i*.071,.091,.026,.018)));
const people=[
  ['Ametov','Nurbol',[25,16,null,39,27,36,9]],
  ['Ayapbergenova','Raziya',[28,null,40,38,40,40,13]],
  ['Orazbaev','Ruslan',[39,null,39,40,31,35,0]]
];
people.forEach(([family,given,scores],i)=>{
  const y=.155+i*.060;
  wide.push(at(String(i+1),.035,y,.018),at(family,.095,y,.09),at(given,.192,y,.077));
  scores.forEach((score,j)=>{if(score!==null)wide.push(at(String(score),.315+j*.071,y,.025))});
});
const spreadsheet=OCR.parse({elements:wide});
assert(spreadsheet.matrix,'Wide spreadsheet must be detected');
assert.deepEqual(spreadsheet.matrix.dates,days);
assert.deepEqual(spreadsheet.matrix.question_counts,questionCounts);
assert.equal(spreadsheet.rows.length,3,JSON.stringify(spreadsheet));
assert.equal(spreadsheet.matrix.students[0].values[2],null);
assert.equal(spreadsheet.rows[0].correct,9);
assert.equal(spreadsheet.rows[1].correct,13);
assert.equal(spreadsheet.rows[2].correct,0);
assert.equal(spreadsheet.rows[2].status,'unresolved');
assert(spreadsheet.warnings.some(w=>w.includes('Ko‘p sanali')));
console.log('PASS: multi-date table OCR, date columns, yellow blanks retained, zero requires review');

// A clearly invalid score > questions and low-confidence OCR must remain
// unconfirmed; do not invent a grade or DQ status.
const wrong=[...wide,at('19',.315+6*.071,.335,.025,.020)];
wrong.push(at('Saparov',.095,.335,.09),at('Temur',.192,.335,.077),at('4',.035,.335,.018));
const wrongParsed=OCR.parse({elements:wrong});
assert(wrongParsed.matrix);
const invalid=wrongParsed.matrix.students.find(x=>x.name==='Saparov Temur');
assert(invalid);
assert.equal(invalid.values[6],null);
const lowConf=wide.map(x=>x.text==='13'&&Math.abs(x.y-.215)<.03?{...x,confidence:25}:x);
const lowParsed=OCR.parse({elements:lowConf});
assert.equal(lowParsed.rows[1].correct,null);
console.log('PASS: question counts, impossible/uncertain cells and confidence checks');
