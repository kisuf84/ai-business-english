/**
 * Injects the missing interactivity functions into all bricepremiumcourses2
 * module files. Module 10 is DATA-driven (complete) and is skipped.
 *
 * Usage:
 *   node scripts/fixCourse2Interactivity.mjs          # all modules
 *   node scripts/fixCourse2Interactivity.mjs 1        # single module
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COURSE_DIR = resolve(__dirname, "..", "premium-content/premium-classes/bricepremiumcourses2");

// Module 10 already has a complete DATA-driven script — skip it.
const SKIP_MODULES = new Set([10]);

// ─── Comprehensive interactivity script (handles all module patterns) ──────
const INTERACTIVITY_SCRIPT = `
<script>
(function(){
'use strict';

/* ── 1. NAVIGATION ───────────────────────────────────────────────────────── */
// data-section nav (modules 6,7,9,11,12) – attach on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.nav-item[data-section]').forEach(function(item){
    item.addEventListener('click', function(){
      _showSec(item.dataset.section);
    });
  });
});

function _showSec(name){
  document.querySelectorAll('.section').forEach(function(s){s.classList.remove('active');});
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
  var target = document.getElementById('sec-'+name) || document.getElementById(name);
  if(target) target.classList.add('active');
  document.querySelectorAll('.nav-item[data-section="'+name+'"]').forEach(function(n){n.classList.add('active');});
  window.scrollTo({top:0,behavior:'smooth'});
}

// showSection for onclick-based nav (modules 1-5,8).
// Handled directly — does NOT delegate to _showSec — so that nav items using
// onclick attributes (not data-section) get highlighted correctly.
if(typeof showSection==='undefined'){
  window.showSection=function(id){
    var M={vocabulary:'sec-vocab','grammar-review':'sec-gramreview',casestudies:'sec-cases'};
    var eid=M[id]||('sec-'+id);
    document.querySelectorAll('.section').forEach(function(s){s.classList.remove('active');});
    document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
    var el=document.getElementById(eid)||document.getElementById(id);
    if(el)el.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(function(n){
      var oc=n.getAttribute('onclick')||'';
      if(oc.indexOf("'"+id+"'")!==-1||oc.indexOf('"'+id+'"')!==-1)n.classList.add('active');
    });
    window.scrollTo({top:0,behavior:'smooth'});
  };
}

/* ── 2. MCQ GROUP-A  selectOption / checkAll  (deferred feedback) ─────────
   HTML IDs: {prefix}-q{qi}-o{oi}  ·  score: {prefix}-score               */
var _mcqA={};
window.selectOption=function(prefix,qi,oi,correctAns){
  var qId=prefix+'-q'+qi;
  _mcqA[qId]=correctAns;
  var qBlock=document.getElementById(qId);
  if(!qBlock)return;
  Array.from(qBlock.querySelectorAll('.mcq-option')).forEach(function(o){o.classList.remove('selected','correct','incorrect');});
  var clicked=document.getElementById(qId+'-o'+oi);
  if(clicked)clicked.classList.add('selected');
};

window.checkAll=function(prefix,n){
  var score=0;
  for(var qi=0;qi<n;qi++){
    var qId=prefix+'-q'+qi,correct=_mcqA[qId];
    if(correct===undefined)continue;
    var qBlock=document.getElementById(qId);
    if(!qBlock)continue;
    var opts=Array.from(qBlock.querySelectorAll('.mcq-option'));
    var chosen=-1;
    opts.forEach(function(o,j){if(o.classList.contains('selected'))chosen=j;});
    opts.forEach(function(o,j){
      o.classList.remove('correct','incorrect');
      if(j===correct){o.classList.add('correct');if(j===chosen)score++;}
      else if(j===chosen)o.classList.add('incorrect');
    });
  }
  var scoreEl=document.getElementById(prefix+'-score');
  if(scoreEl){
    scoreEl.style.display='block';
    var pct=Math.round(score/n*100);
    scoreEl.innerHTML='<strong>'+score+' / '+n+'</strong> ('+pct+'%)';
  }
};

/* ── 3. MCQ GROUP-B/C/D  selectMCQ  (instant feedback) ────────────────────
   HTML IDs: {qId}_opt{j}  ·  feedback: {qId}_fb                          */
window.selectMCQ=function(qId,chosenIdx,correctIdx){
  var allOpts=[];
  for(var j=0;j<8;j++){var o=document.getElementById(qId+'_opt'+j);if(!o)break;allOpts.push(o);}
  allOpts.forEach(function(o){o.classList.remove('correct','wrong','disabled');});
  var clickedEl=document.getElementById(qId+'_opt'+chosenIdx);
  var correctEl=document.getElementById(qId+'_opt'+correctIdx);
  if(chosenIdx===correctIdx){
    if(clickedEl)clickedEl.classList.add('correct','disabled');
  }else{
    if(clickedEl)clickedEl.classList.add('wrong','disabled');
    if(correctEl)correctEl.classList.add('correct');
  }
  allOpts.forEach(function(o){o.classList.add('disabled');});
  var fb=document.getElementById(qId+'_fb');
  if(fb){
    fb.style.display='block';
    fb.innerHTML=chosenIdx===correctIdx?
      '<span style="color:#1a6e4c;font-weight:600">✓ Correct!</span>':
      '<span style="color:#8b1a1a;font-weight:600">✗ Incorrect.</span>';
  }
};

/* ── 4. CLOZE  selectCloze  (module 7) ─────────────────────────────────── */
window.selectCloze=function(qId,chosenIdx,correctIdx,correctText){
  window.selectMCQ(qId,chosenIdx,correctIdx);
  if(chosenIdx!==correctIdx){
    var fb=document.getElementById(qId+'_fb');
    if(fb)fb.innerHTML+=' <em>Answer: <strong>'+correctText+'</strong></em>';
  }
};

/* ── 5. DROPDOWN GAP FILL  checkDropdownGapFill  (modules 9,11,12) ────────
   HTML: <select id="{prefix}_{i}" data-answer="{correctOptionValue}">     */
window.checkDropdownGapFill=function(prefix,n){
  var score=0;
  for(var i=0;i<n;i++){
    var sel=document.getElementById(prefix+'_'+i);
    if(!sel)continue;
    var correct=parseInt(sel.dataset.answer);
    var chosen=parseInt(sel.value);
    sel.style.outline='';
    if(!isNaN(chosen)&&chosen===correct){score++;sel.style.outline='2px solid #2ecc8a';}
    else if(!isNaN(chosen))sel.style.outline='2px solid #e05c5c';
  }
  var pct=Math.round(score/n*100);
  var scoreId=prefix+'-df-score';
  var scoreEl=document.getElementById(scoreId);
  if(!scoreEl){
    scoreEl=document.createElement('div');
    scoreEl.id=scoreId;
    scoreEl.style.cssText='margin-top:10px;font-weight:600;font-size:.9rem;padding:6px 0;';
    var lastSel=document.getElementById(prefix+'_'+(n-1));
    if(lastSel&&lastSel.closest('.card'))lastSel.closest('.card').appendChild(scoreEl);
  }
  scoreEl.textContent='Score: '+score+' / '+n+' ('+pct+'%)';
};

/* ── 6. TEXT GAP FILL  checkGapFill  (Group-A) ─────────────────────────── */
window.checkGapFill=function(){
  var score=0,total=0,i=0;
  for(;;){
    var el=document.getElementById('gf-'+i);
    if(!el)break;
    total++;
    var correct=(el.dataset.ans||'').toLowerCase().trim();
    var given=el.value.toLowerCase().trim();
    el.classList.remove('correct','incorrect');
    if(given&&given===correct){score++;el.classList.add('correct');}
    else if(given)el.classList.add('incorrect');
    i++;
  }
  var scoreEl=document.getElementById('gf-score');
  if(scoreEl&&total>0){
    scoreEl.style.display='block';
    scoreEl.innerHTML='<strong>'+score+' / '+total+'</strong> ('+Math.round(score/total*100)+'%)';
  }
};

/* ── 7. TRUE / FALSE ────────────────────────────────────────────────────── */
// Group-A:  selectTF(i:number, val:'T'/'F', correct:bool)  — buttons tf-{i}-T/F
// Group-B:  selectTF(qId:string, val:bool, correct:bool)   — divs {qId}_optT/F
var _tfA={};
window.selectTF=function(iOrId,valOrBool,correct){
  if(typeof iOrId==='number'){
    // Group-A
    var i=iOrId,val=valOrBool;
    _tfA[i]={selected:val,correct:correct};
    var tBtn=document.getElementById('tf-'+i+'-T'),fBtn=document.getElementById('tf-'+i+'-F');
    if(tBtn)tBtn.classList.remove('selected-true','selected-false','correct-answer','wrong-answer');
    if(fBtn)fBtn.classList.remove('selected-true','selected-false','correct-answer','wrong-answer');
    var clicked=val==='T'?tBtn:fBtn;
    if(clicked)clicked.classList.add(val==='T'?'selected-true':'selected-false');
  }else{
    // Group-B (instant feedback)
    var qId=iOrId,bVal=valOrBool;
    var tOpt=document.getElementById(qId+'_optT'),fOpt=document.getElementById(qId+'_optF');
    [tOpt,fOpt].forEach(function(o){if(o)o.classList.remove('correct','wrong','disabled');});
    var isOk=(bVal===correct);
    var clickedEl=bVal?tOpt:fOpt,correctEl=correct?tOpt:fOpt;
    if(isOk){if(clickedEl)clickedEl.classList.add('correct','disabled');}
    else{if(clickedEl)clickedEl.classList.add('wrong','disabled');if(correctEl)correctEl.classList.add('correct');}
    [tOpt,fOpt].forEach(function(o){if(o)o.classList.add('disabled');});
  }
};

window.checkTF=function(){
  var score=0,total=0,i=0;
  for(;;){
    var tBtn=document.getElementById('tf-'+i+'-T');
    if(!tBtn)break;
    total++;
    var fBtn=document.getElementById('tf-'+i+'-F');
    var d=_tfA[i];
    if(d){
      var cv=d.correct?'T':'F',ok=(d.selected===cv);
      if(ok)score++;
      tBtn.classList.remove('selected-true','selected-false','correct-answer','wrong-answer');
      if(fBtn)fBtn.classList.remove('selected-true','selected-false','correct-answer','wrong-answer');
      if(cv==='T')tBtn.classList.add('correct-answer');
      else if(d.selected==='T')tBtn.classList.add('wrong-answer');
      if(cv==='F'&&fBtn)fBtn.classList.add('correct-answer');
      else if(d.selected==='F'&&fBtn)fBtn.classList.add('wrong-answer');
    }
    i++;
  }
  var scoreEl=document.getElementById('tf-score');
  if(scoreEl){
    scoreEl.style.display='block';
    scoreEl.innerHTML='<strong>'+score+' / '+total+'</strong> ('+(total?Math.round(score/total*100):0)+'%)';
  }
};

/* ── 8. TAB SWITCHERS  showVocabEx / showGrammarEx ─────────────────────── */
window.showVocabEx=function(n,tab){
  document.querySelectorAll('.vocab-ex').forEach(function(el){el.style.display='none';});
  var t=document.getElementById('vocab-ex-'+n);if(t)t.style.display='';
  if(tab&&tab.parentNode)Array.from(tab.parentNode.querySelectorAll('.ex-tab')).forEach(function(b){b.classList.remove('active');});
  if(tab)tab.classList.add('active');
};
window.showGrammarEx=function(n,tab){
  document.querySelectorAll('.grammar-ex').forEach(function(el){el.style.display='none';});
  var t=document.getElementById('grammar-ex-'+n);if(t)t.style.display='';
  if(tab&&tab.parentNode)Array.from(tab.parentNode.querySelectorAll('.ex-tab')).forEach(function(b){b.classList.remove('active');});
  if(tab)tab.classList.add('active');
};

/* ── 9. FINAL ASSESSMENT  selectFinalOption / submitAssessment ──────────── */
var _asmq={};
window.selectFinalOption=function(qi,oi,correctAns){
  _asmq[qi]={correct:correctAns,chosen:oi};
  for(var j=0;j<4;j++){var el=document.getElementById('asmq-q'+qi+'-o'+j);if(el)el.classList.remove('selected','correct','incorrect');}
  var clicked=document.getElementById('asmq-q'+qi+'-o'+oi);
  if(clicked)clicked.classList.add('selected');
};

window.submitAssessment=function(){
  var total=0;
  while(document.getElementById('asmq-q'+total+'-o0'))total++;
  if(!total){
    // Group-B: assessment options have no onclick — just acknowledge
    var rEl=document.getElementById('final-result')||document.querySelector('.final-result');
    if(rEl){rEl.className='final-result';rEl.style.display='block';rEl.innerHTML='<div class="final-score">—</div><div class="final-verdict">Assessment submitted</div><div class="final-msg">Thank you for completing the assessment.</div>';}
    return;
  }
  var score=0;
  for(var qi=0;qi<total;qi++){
    var d=_asmq[qi];if(!d)continue;
    for(var j=0;j<4;j++){
      var el=document.getElementById('asmq-q'+qi+'-o'+j);if(!el)continue;
      el.classList.remove('selected','correct','incorrect');
      if(j===d.correct){el.classList.add('correct');if(j===d.chosen)score++;}
      else if(j===d.chosen)el.classList.add('incorrect');
    }
  }
  var pct=Math.round(score/total*100),pass=pct>=70;
  var resultEl=document.getElementById('final-result');
  if(resultEl){
    resultEl.className='final-result '+(pass?'pass':'fail');
    resultEl.style.display='block';
    resultEl.innerHTML='<div class="final-score">'+pct+'%</div><div class="final-verdict">'+(pass?'✓ Passed':'✗ Not passed')+'</div><div class="final-msg">'+score+' / '+total+' questions correct. '+(pass?'Excellent work!':'Please review the content and try again.')+'</div>';
    resultEl.scrollIntoView({behavior:'smooth'});
  }
  var sBtn=document.getElementById('submit-assessment-btn'),rBtn=document.getElementById('retry-assessment-btn');
  if(sBtn)sBtn.style.display='none';
  if(rBtn)rBtn.style.display=pass?'none':'inline-block';
};

window.resetAssessment=function(){
  var qi=0;
  for(;;){
    var found=false;
    for(var j=0;j<4;j++){var el=document.getElementById('asmq-q'+qi+'-o'+j);if(el){el.classList.remove('selected','correct','incorrect');found=true;}}
    if(!found)break;qi++;
  }
  _asmq={};
  var resultEl=document.getElementById('final-result');
  if(resultEl){resultEl.style.display='none';resultEl.className='final-result';}
  var sBtn=document.getElementById('submit-assessment-btn'),rBtn=document.getElementById('retry-assessment-btn');
  if(sBtn)sBtn.style.display='';if(rBtn)rBtn.style.display='none';
  window.scrollTo({top:0,behavior:'smooth'});
};

/* ── 10. AUDIO TTS ─────────────────────────────────────────────────────── */
var _aud={};
function _el(ids){for(var i=0;i<ids.length;i++){var e=document.getElementById(ids[i]);if(e)return e;}return null;}

window.togglePlay=function(n){
  if(!_aud[n])_aud[n]={playing:false,speed:0.85};
  var st=_aud[n],btn=_el(['play-'+n,'playBtn'+n]);
  if(st.playing){
    window.speechSynthesis.cancel();st.playing=false;
    if(btn)btn.innerHTML='►';if(st.timer){clearInterval(st.timer);st.timer=null;}return;
  }
  window.speechSynthesis.cancel();
  var transEl=_el(['trans-'+n,'trans'+n]);
  var text=transEl?(transEl.innerText||transEl.textContent||'').trim():'';
  if(!text)return;
  var utt=new SpeechSynthesisUtterance(text);
  utt.lang='en-GB';utt.rate=st.speed;utt.pitch=1.0;
  var voices=window.speechSynthesis.getVoices();
  var v=voices.find(function(v){return v.name==='Google UK English Female';})||voices.find(function(v){return v.lang==='en-GB';});
  if(v)utt.voice=v;
  var words=text.split(/\s+/).length,dur=Math.round(words/(st.speed*2.6));
  var fmt=function(s){return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
  var timeEl=_el(['time-'+n,'time'+n]),progEl=_el(['prog-'+n,'prog'+n,'progressFill']);
  if(timeEl)timeEl.textContent='0:00 / '+fmt(dur);
  var elapsed=0;
  st.timer=setInterval(function(){
    if(!_aud[n].playing){clearInterval(st.timer);return;}
    elapsed++;
    if(progEl)progEl.style.width=Math.min(elapsed/dur*100,100)+'%';
    if(timeEl)timeEl.textContent=fmt(elapsed)+' / '+fmt(dur);
  },1000);
  utt.onend=function(){
    st.playing=false;if(btn)btn.innerHTML='►';
    if(st.timer){clearInterval(st.timer);st.timer=null;}
    if(progEl)progEl.style.width='100%';
  };
  window.speechSynthesis.speak(utt);st.playing=true;if(btn)btn.innerHTML='⏸';
};

window.setSpeed=function(n,spd,btn){
  if(!_aud[n])_aud[n]={playing:false,speed:spd};
  _aud[n].speed=spd;
  var card=btn.closest?btn.closest('.audio-player,.audio-block,.listen-card'):null;
  if(card)Array.from(card.querySelectorAll('.speed-btn')).forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  if(_aud[n].playing){
    window.speechSynthesis.cancel();_aud[n].playing=false;
    var pb=_el(['play-'+n,'playBtn'+n]);if(pb)pb.innerHTML='►';
    if(_aud[n].timer){clearInterval(_aud[n].timer);_aud[n].timer=null;}
    setTimeout(function(){window.togglePlay(n);},80);
  }
};

window.replayAudio=function(n){
  if(_aud[n]){_aud[n].playing=false;if(_aud[n].timer)clearInterval(_aud[n].timer);}
  window.speechSynthesis.cancel();
  var progEl=_el(['prog-'+n,'prog'+n]);if(progEl)progEl.style.width='0%';
  var pb=_el(['play-'+n,'playBtn'+n]);if(pb)pb.innerHTML='►';
  setTimeout(function(){window.togglePlay(n);},80);
};

window.toggleTranscript=function(n){
  var toggle=_el(['trans-toggle-'+n]);
  var content=_el(['trans-'+n,'trans'+n]);
  if(toggle)toggle.classList.toggle('open');
  if(content)content.classList.toggle('open');
};

/* ── 11. WRITING ──────────────────────────────────────────────────────── */
window.updateWordCount=function(id){
  var ta=document.getElementById(id+'-textarea'),counter=document.getElementById(id+'-counter');
  if(!ta||!counter)return;
  var w=ta.value.trim()===''?0:ta.value.trim().split(/\s+/).length;
  counter.textContent=w+' word'+(w!==1?'s':'');
};

window.countWords=function(taId,wcId,min,max){
  var ta=document.getElementById(taId),wc=document.getElementById(wcId);
  if(!ta||!wc)return;
  var w=ta.value.trim()===''?0:ta.value.trim().split(/\s+/).length;
  wc.textContent=w+' words (target: '+min+'–'+max+')';
  wc.style.color=w>parseInt(max)?'#c0392b':'';
};

window.submitWriting=function(id){
  var ta,success;
  if(typeof id==='number'){ta=document.getElementById('write'+id);success=document.getElementById('wfb'+id);}
  else{ta=document.getElementById(id+'-textarea');success=document.getElementById(id+'-success');}
  if(!ta||ta.value.trim().length<20){alert('Please write your response before submitting.');return;}
  if(success){success.style.display='block';success.scrollIntoView({behavior:'smooth'});}
};

/* ── VOICE INIT ───────────────────────────────────────────────────────── */
window.addEventListener('load',function(){
  if(window.speechSynthesis){
    window.speechSynthesis.getVoices();
    if(window.speechSynthesis.onvoiceschanged!==undefined)
      window.speechSynthesis.onvoiceschanged=function(){window.speechSynthesis.getVoices();};
  }
});

})();
</script>
`;

const filterModule = process.argv[2] ? parseInt(process.argv[2]) : null;

let ok = 0, skip = 0;
const modules = filterModule ? [filterModule] : Array.from({ length: 12 }, (_, i) => i + 1);

for (const m of modules) {
  const filePath = resolve(COURSE_DIR, `module_${m}.html`);

  if (SKIP_MODULES.has(m)) {
    console.log(`  — bricepremiumcourses2/module_${m}.html  (skipped — DATA-driven)`);
    skip++;
    continue;
  }

  let html;
  try {
    html = readFileSync(filePath, "utf-8");
  } catch {
    console.warn(`  ⚠ Not found: module_${m}.html`);
    continue;
  }

  // If a tiny script block exists (only showSection) replace it;
  // otherwise inject before </body>.
  const tinyScriptRe = /<script>\s*function showSection[\s\S]*?<\/script>\s*<\/body>/;

  let updated;
  if (tinyScriptRe.test(html)) {
    // Replace the small existing script + close tags
    updated = html.replace(tinyScriptRe, INTERACTIVITY_SCRIPT.trim() + "\n</body>");
  } else if (html.includes("</body>")) {
    // No existing script or script already larger — inject before </body>
    updated = html.replace("</body>", INTERACTIVITY_SCRIPT.trim() + "\n</body>");
  } else {
    updated = html + "\n" + INTERACTIVITY_SCRIPT.trim();
  }

  writeFileSync(filePath, updated, "utf-8");
  const kb = Math.round(updated.length / 1024);
  console.log(`  ✓ bricepremiumcourses2/module_${m}.html  (${kb} KB)`);
  ok++;
}

console.log(`\n${ok} fixed, ${skip} skipped.\n`);
