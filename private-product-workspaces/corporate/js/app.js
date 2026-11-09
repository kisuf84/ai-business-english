/* Langslate Corporate — App Logic v1 (built on the Langslate Academy engine) */
'use strict';

// Safety net: if anything throws anywhere after this point (including before
// App.init runs), show a visible, actionable message instead of a silent
// blank page. This is the single biggest source of "the platform is empty"
// reports — an uncaught error with nothing on screen to explain why.
window.addEventListener('error', function(ev){
  var page=document.getElementById('page');
  if(!page || page.innerHTML.trim())return; // don't clobber an already-rendered page over a minor later error
  page.innerHTML='<div style="max-width:640px;margin:40px auto;padding:28px;border:1px solid #f43f5e;border-radius:14px;background:#1c1c26;color:#f0f0f8;font-family:sans-serif">'
    +'<h2 style="color:#f43f5e;margin-bottom:10px">Something went wrong loading this page</h2>'
    +'<p style="color:#94a3b8;font-size:.9rem;line-height:1.6;margin-bottom:14px">This is usually fixed by making sure the platform is running via <b>start.bat</b> (served at <code>http://localhost:3001</code>) rather than opening <code>index.html</code> directly as a file. Close this tab, double-click <b>start.bat</b>, and use the page it opens.</p>'
    +'<p style="color:#64748b;font-size:.78rem;font-family:monospace;white-space:pre-wrap;background:#111118;padding:10px;border-radius:8px">'+String((ev&&ev.message)||'Unknown error')+'</p>'
    +'<button style="margin-top:14px;padding:10px 18px;border-radius:10px;background:#7c3aed;color:#fff;border:none;cursor:pointer" onclick="location.reload()">Reload</button></div>';
});

const SECTION_META = {
  professions:{label:'Professions',color:'#3b82f6',bg:'rgba(59,130,246,.12)',icon:'&#128188;',desc:'Role-specific English for every job title, from entry-level to the C-suite.',route:'professions'},
  industries:{label:'Industries',color:'#f59e0b',bg:'rgba(245,158,11,.12)',icon:'&#127981;',desc:'Sector vocabulary and real scenarios across 60 global industries.',route:'industries'},
  departments:{label:'Departments',color:'#10b981',bg:'rgba(16,185,129,.12)',icon:'&#127970;',desc:'Cross-functional English for every team inside a modern company.',route:'departments'},
  langslatePro:{label:'Langslate Pro',color:'#f43f5e',bg:'rgba(244,63,94,.12)',icon:'&#128081;',desc:'Elite executive programs for leadership, negotiation, and the boardroom.',route:'langslatePro'}
};
const SECTION_KEYS = ['professions','industries','departments','langslatePro'];

const AVATARS=[
  {id:'m1',emoji:'&#128100;&#8205;&#128188;',label:'Man 1'},
  {id:'m2',emoji:'&#128100;&#8205;&#127891;',label:'Man 2'},
  {id:'m3',emoji:'&#128100;&#8205;&#128187;',label:'Man 3'},
  {id:'m4',emoji:'&#129492;',label:'Man 4'},
  {id:'m5',emoji:'&#128100;&#8205;&#127979;',label:'Man 5'},
  {id:'f1',emoji:'&#128105;&#8205;&#128188;',label:'Woman 1'},
  {id:'f2',emoji:'&#128105;&#8205;&#127891;',label:'Woman 2'},
  {id:'f3',emoji:'&#128105;&#8205;&#128187;',label:'Woman 3'},
  {id:'f4',emoji:'&#128105;&#8205;&#127979;',label:'Woman 4'},
  {id:'f5',emoji:'&#128105;&#8205;&#127908;',label:'Woman 5'}
];

function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function dateKey(off){var d=new Date();d.setDate(d.getDate()+(off||0));return d.toISOString().split('T')[0];}

var STATE_KEY='lc_state_v1';
var state=loadState();
function defaultState(){return{user:{name:'Learner',avatarId:'m1'},xp:0,xpToday:0,streak:0,lastActive:null,completed:{},dailyGoal:3,dailyDone:0,goalDate:null,theme:'dark',heatmap:{},totalTime:0};}
function loadState(){try{var s=JSON.parse(localStorage.getItem(STATE_KEY));return s?Object.assign(defaultState(),s):defaultState();}catch(e){return defaultState();}}
function saveState(){try{localStorage.setItem(STATE_KEY,JSON.stringify(state));}catch(e){/* storage unavailable (private mode, blocked, or opened as a local file) — progress just won't persist */}}
function getAvatar(){return AVATARS.find(function(a){return a.id===state.user.avatarId;})||AVATARS[0];}

function checkStreak(){
  var today=dateKey(0),yesterday=dateKey(-1);
  if(state.lastActive===today)return;
  if(state.lastActive===yesterday)state.streak=(state.streak||0)+1;
  else if(state.lastActive&&state.lastActive!==today)state.streak=0;
  state.lastActive=today;
  if(state.goalDate!==today){state.dailyDone=0;state.goalDate=today;state.xpToday=0;}
  saveState();
}

// ---- Data helpers -----------------------------------------------------
var _catCache={};
function getLessonsBySection(sec){return LESSONS.filter(function(l){return l.section===sec;});}
function getCategoriesForSection(sec){
  if(_catCache[sec])return _catCache[sec];
  var map={},order=[];
  LESSONS.forEach(function(l){
    if(l.section!==sec)return;
    if(!map[l.categorySlug]){map[l.categorySlug]={slug:l.categorySlug,label:l.categoryLabel,count:0};order.push(l.categorySlug);}
    map[l.categorySlug].count++;
  });
  var out=order.map(function(s){return map[s];});
  _catCache[sec]=out;
  return out;
}
function getLessonsByCategory(sec,catSlug){return LESSONS.filter(function(l){return l.section===sec&&l.categorySlug===catSlug;});}
function getLessonById(id){return LESSONS.find(function(l){return l.id===id;});}
function sectionDoneCount(sec){return getLessonsBySection(sec).filter(function(l){return state.completed[l.id];}).length;}
function categoryDoneCount(sec,catSlug){return getLessonsByCategory(sec,catSlug).filter(function(l){return state.completed[l.id];}).length;}

var App=(function(){
  var currentLesson=null;

  function init(){
    try{
      checkStreak();applyTheme(state.theme);buildLevelNav();updateSidebar();
      var hash=location.hash.replace('#','')||'dashboard';
      renderPage(hash);
      window.addEventListener('hashchange',function(){
        try{renderPage(location.hash.replace('#','')||'dashboard');}catch(e){showFatalError(e);}
      });
      document.addEventListener('keydown',function(e){
        if(e.key==='Escape'){
          var m=document.getElementById('viewer-modal');
          if(m&&m.classList.contains('focus'))exitFocus();
          else if(m&&m.classList.contains('open'))closeViewer();
        }
      });
    }catch(e){showFatalError(e);}
  }

  function showFatalError(e){
    var page=document.getElementById('page');
    if(!page)return;
    page.innerHTML='<div class="glass" style="padding:28px;max-width:640px;margin:40px auto;border:1px solid var(--rose)">'
      +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><i class="fas fa-triangle-exclamation" style="color:var(--rose);font-size:1.3rem"></i>'
      +'<h2 style="font-family:\'Playfair Display\',serif;font-size:1.3rem;color:var(--txt)">Something went wrong loading this page</h2></div>'
      +'<p style="color:var(--txt2);font-size:.9rem;line-height:1.6;margin-bottom:14px">This is usually fixed by making sure the platform is running via <b>start.bat</b> (which serves it over <code>http://localhost:3001</code>) rather than opening <code>index.html</code> directly as a file. Try closing this tab, double-clicking <b>start.bat</b>, and reopening the page it launches.</p>'
      +'<p style="color:var(--txt3);font-size:.78rem;font-family:monospace;white-space:pre-wrap;background:var(--card2);padding:10px;border-radius:8px">'+esc(e&&(e.stack||e.message||String(e)))+'</p>'
      +'<button class="btn-primary" style="margin-top:14px" onclick="location.reload()">Reload</button></div>';
  }

  function nav(route){
    var modal=document.getElementById('viewer-modal');
    if(modal&&modal.classList.contains('open'))closeViewer();
    history.replaceState(null,'','#'+route);
    document.querySelectorAll('[data-route]').forEach(function(n){n.classList.remove('active');});
    document.querySelectorAll('[data-route="'+route.split('/')[0]+'"]').forEach(function(n){n.classList.add('active');});
    closeSidebar();
    renderPage(route);
  }

  function renderPage(hash){
    var parts=hash.split('/'),route=parts[0],p1=parts[1],p2=parts[2];
    if(route==='lesson'&&p1){openViewer(Number(p1));return;}
    document.getElementById('page').innerHTML='';
    document.querySelectorAll('[data-route]').forEach(function(n){n.classList.toggle('active',n.dataset.route===route);});
    ({dashboard:pageDashboard,courses:function(){pageCourses(p1,p2);},
      progress:pageProgress,achievements:pageAchievements,settings:pageSettings}[route]||pageDashboard)();
  }

  // ---- Dashboard --------------------------------------------------------
  function pageDashboard(){
    var page=document.getElementById('page');
    var done=Object.keys(state.completed).length,total=LESSONS.length,pct=Math.round(done/total*100);
    var next=LESSONS.find(function(l){return !state.completed[l.id];})||LESSONS[0];
    var secCards=SECTION_KEYS.map(function(sec){
      var m=SECTION_META[sec],ls=getLessonsBySection(sec),d=sectionDoneCount(sec),p=Math.round(d/ls.length*100);
      return '<div class="glass-solid" style="padding:14px;cursor:pointer" onclick="App.nav(\'courses/'+sec+'\')">'        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><span style="font-size:1.3rem">'+m.icon+'</span>'        +'<div><div style="font-size:.85rem;font-weight:700;color:var(--txt)">'+m.label+'</div><div style="font-size:.7rem;color:var(--txt3)">'+d+'/'+ls.length+'</div></div></div>'        +'<div class="progress-bar"><div style="height:100%;border-radius:99px;background:'+m.color+';width:'+p+'%;transition:width .8s"></div></div>'        +'<div style="text-align:right;font-size:.7rem;font-weight:700;color:'+m.color+';margin-top:4px">'+p+'%</div></div>';
    }).join('');
    page.innerHTML='<div style="display:flex;flex-direction:column;gap:24px">'      +'<div class="hero-card fade-up" style="padding:36px 40px"><div style="position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px">'      +'<div><div style="font-size:.85rem;color:#c4b5fd;font-weight:500;margin-bottom:6px">Welcome back &#128075;</div>'      +'<h1 style="font-family:\'Playfair Display\',serif;font-size:2rem;font-weight:800;color:#fff;line-height:1.2">'+esc(state.user.name)+'</h1>'      +'<p style="color:#c4b5fd;margin-top:8px;font-size:.95rem">Keep your streak alive &mdash; learn something new today!</p>'      +'<div style="display:flex;align-items:center;gap:16px;margin-top:20px;flex-wrap:wrap">'      +'<button class="btn-primary" onclick="App.openViewer('+next.id+')"><i class="fas fa-play"></i> Continue Learning</button>'      +'<div style="display:flex;align-items:center;gap:8px;color:#e2e8f0"><span style="font-size:1.3rem">&#128293;</span>'      +'<span style="font-weight:700;font-size:1.1rem">'+state.streak+'</span><span style="font-size:.85rem;opacity:.8"> day streak</span></div></div></div>'      +'<div style="text-align:center"><div style="width:110px;height:110px;border-radius:50%;border:4px solid rgba(167,139,250,.4);display:flex;align-items:center;justify-content:center;flex-direction:column;background:rgba(124,58,237,.15)">'      +'<div style="font-size:1.6rem;font-weight:900;color:#fff">'+pct+'%</div><div style="font-size:.7rem;color:#c4b5fd">Done</div></div>'      +'<div style="color:#c4b5fd;font-size:.75rem;margin-top:8px">'+done+' / '+total+'</div></div></div>'      +'<div style="position:relative;z-index:1;margin-top:24px"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:.8rem;color:#c4b5fd">Overall Progress</span><span style="font-size:.8rem;color:#a78bfa;font-weight:700">'+pct+'%</span></div>'      +'<div class="progress-bar"><div class="progress-fill" style="width:'+pct+'%"></div></div></div></div>'      +'<div class="stats-grid fade-up delay-1">'+sCard('&#9889;','Total XP',state.xp+' XP','rgba(245,158,11,.15)','#f59e0b')+sCard('&#128293;','Streak',state.streak+' days','rgba(239,68,68,.15)','#ef4444')+sCard('&#128218;','Completed',done+' lessons','rgba(124,58,237,.15)','#7c3aed')+sCard('&#128193;','Lessons',total.toLocaleString()+' total','rgba(16,185,129,.15)','#10b981')+'</div>'      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px" class="fade-up delay-2">'      +'<div class="glass" style="padding:24px"><div class="section-title" style="margin-bottom:14px"><i class="fas fa-bullseye" style="color:var(--violet)"></i> Daily Goals</div>'      +gItem('Complete 1 lesson','+15 XP',state.dailyDone>=1)+gItem('Complete 3 lessons','+45 XP',state.dailyDone>=3)+gItem('Earn 50 XP today','Bonus',state.xpToday>=50)+'</div>'      +'<div class="glass" style="padding:24px"><div class="section-title" style="margin-bottom:4px"><i class="fas fa-calendar-check" style="color:var(--violet)"></i> Activity</div>'      +'<div style="font-size:.78rem;color:var(--txt2);margin-bottom:14px">16-week learning activity</div><div id="hm-sm"></div></div></div>'      +'<div class="glass fade-up delay-3" style="padding:24px"><div class="section-title" style="margin-bottom:20px"><i class="fas fa-layer-group" style="color:var(--violet)"></i> Category Progress</div>'      +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:12px">'+secCards+'</div></div>'      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px" class="fade-up delay-4">'      +'<div class="glass" style="padding:22px"><div class="section-title" style="margin-bottom:14px"><i class="fas fa-history" style="color:var(--violet)"></i> Recent Lessons</div>'+recentRows()+'</div>'      +'<div class="glass" style="padding:22px"><div class="section-title" style="margin-bottom:14px"><i class="fas fa-star" style="color:var(--gold)"></i> Up Next</div>'+nextRows()+'</div>'      +'</div></div>';
    buildHeatmap('hm-sm',16);
  }
  function sCard(icon,label,val,bg,col){return '<div class="stat-card"><div class="stat-icon" style="background:'+bg+'"><span style="font-size:1.3rem">'+icon+'</span></div><div style="font-size:1.35rem;font-weight:800;color:'+col+'">'+val+'</div><div style="font-size:.8rem;color:var(--txt2);margin-top:2px">'+label+'</div></div>';}
  function gItem(label,xp,done){return '<div class="goal-item"><div class="goal-check '+(done?'done':'')+'"><i class="fas fa-check" style="font-size:.7rem"></i></div><div><div style="font-size:.875rem;font-weight:600;color:var(--txt)">'+label+'</div><div style="font-size:.75rem;color:var(--txt3)">'+xp+'</div></div></div>';}
  function miniRow(l,done){var m=SECTION_META[l.section];return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="App.openViewer('+l.id+')"><div style="width:34px;height:34px;border-radius:8px;background:'+m.bg+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.1rem">'+m.icon+'</div><div style="flex:1;min-width:0"><div style="font-size:.82rem;font-weight:600;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(l.title)+'</div><div style="font-size:.72rem;color:var(--txt3)">'+esc(l.categoryLabel)+' &middot; '+l.duration+'min</div></div>'+(done?'<i class="fas fa-check-circle" style="color:var(--emerald);flex-shrink:0"></i>':'<span style="font-size:.7rem;color:var(--gold);font-weight:700;flex-shrink:0">+'+l.xp+'XP</span>')+'</div>';}
  function recentRows(){var r=Object.entries(state.completed).sort(function(a,b){return b[1]-a[1];}).slice(0,5).map(function(e){return getLessonById(Number(e[0]));}).filter(Boolean);return r.length?r.map(function(l){return miniRow(l,true);}).join(''):'<div style="color:var(--txt3);font-size:.875rem">Start your first lesson!</div>';}
  function nextRows(){var n=LESSONS.filter(function(l){return !state.completed[l.id];}).slice(0,5);return n.length?n.map(function(l){return miniRow(l,false);}).join(''):'<div style="color:var(--txt3)">&#127881; All done!</div>';}

  // ---- Courses: section grid -> category grid -> lesson grid -----------
  function pageCourses(p1,p2){
    var page=document.getElementById('page');
    var sec=SECTION_KEYS.indexOf(p1)!==-1?p1:null;

    if(!sec){
      page.innerHTML='<div style="display:flex;flex-direction:column;gap:24px"><div class="fade-up"><h2 style="font-family:\'Playfair Display\',serif;font-size:1.8rem;font-weight:800;color:var(--txt)">All Categories</h2><p style="color:var(--txt2);margin-top:6px">'+LESSONS.length.toLocaleString()+' lessons across 259 categories</p></div>'        +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:18px" class="fade-up delay-1">'+SECTION_KEYS.map(sectionCard).join('')+'</div></div>';
      return;
    }

    var catSlug=p2||null;
    var m=SECTION_META[sec];

    if(!catSlug){
      var cats=getCategoriesForSection(sec),done=sectionDoneCount(sec);
      page.innerHTML='<div style="display:flex;flex-direction:column;gap:20px">'        +'<div class="breadcrumb" style="font-size:.8rem;color:var(--txt3)"><a href="#courses" style="color:var(--txt2)">All Categories</a> <i class="fas fa-chevron-right" style="font-size:.6rem;margin:0 4px"></i> '+m.label+'</div>'        +'<div class="hero-card fade-up" style="padding:26px 32px"><div style="position:relative;z-index:1;display:flex;align-items:center;gap:18px;flex-wrap:wrap"><div style="font-size:3rem">'+m.icon+'</div><div style="flex:1"><h2 style="font-family:\'Playfair Display\',serif;font-size:1.5rem;font-weight:800;color:#fff">'+m.label+'</h2><p style="color:#c4b5fd;margin-top:3px;font-size:.85rem">'+m.desc+'</p></div>'        +'<div style="text-align:center"><div style="font-size:2rem;font-weight:900;color:#fff">'+done+'</div><div style="font-size:.72rem;color:#c4b5fd">of '+cats.reduce(function(a,c){return a+c.count;},0)+' done</div></div></div></div>'        +'<div style="position:relative"><input type="text" id="cat-filter" placeholder="Filter '+cats.length+' categories..." style="width:100%;padding:11px 16px;font-size:.85rem" oninput="App.filterCategories(this.value)"/></div>'        +'<div class="lessons-grid fade-up delay-2" id="category-grid">'+cats.map(function(c){return categoryCard(sec,c);}).join('')+'</div></div>';
      return;
    }

    var ls=getLessonsByCategory(sec,catSlug);
    if(!ls.length){page.innerHTML='<div style="color:var(--txt3)">Category not found.</div>';return;}
    var catLabel=ls[0].categoryLabel,doneC=ls.filter(function(l){return state.completed[l.id];}).length,pctC=Math.round(doneC/ls.length*100);
    page.innerHTML='<div style="display:flex;flex-direction:column;gap:20px">'      +'<div class="breadcrumb" style="font-size:.8rem;color:var(--txt3)"><a href="#courses" style="color:var(--txt2)">All Categories</a> <i class="fas fa-chevron-right" style="font-size:.6rem;margin:0 4px"></i> <a href="#courses/'+sec+'" style="color:var(--txt2)">'+m.label+'</a> <i class="fas fa-chevron-right" style="font-size:.6rem;margin:0 4px"></i> '+esc(catLabel)+'</div>'      +'<div class="hero-card fade-up" style="padding:26px 32px"><div style="position:relative;z-index:1;display:flex;align-items:center;gap:18px;flex-wrap:wrap"><div style="font-size:3rem">'+m.icon+'</div><div style="flex:1"><div style="font-size:.75rem;color:#c4b5fd;font-weight:700;text-transform:uppercase;letter-spacing:.08em">'+m.label+'</div><h2 style="font-family:\'Playfair Display\',serif;font-size:1.5rem;font-weight:800;color:#fff">'+esc(catLabel)+'</h2><p style="color:#c4b5fd;margin-top:3px;font-size:.85rem">'+ls.length+' modules &middot; ~'+ls.reduce(function(a,l){return a+l.duration;},0)+' min total</p></div>'      +'<div style="text-align:center"><div style="font-size:2rem;font-weight:900;color:#fff">'+doneC+'</div><div style="font-size:.72rem;color:#c4b5fd">of '+ls.length+' done</div><div class="progress-bar" style="width:130px;margin-top:7px;height:5px"><div style="height:100%;border-radius:99px;background:'+m.color+';width:'+pctC+'%;transition:width .8s"></div></div></div></div></div>'      +'<div class="lessons-grid fade-up delay-2" id="lessons-grid">'+ls.map(lessonCard).join('')+'</div></div>';
  }
  function sectionCard(sec){
    var m=SECTION_META[sec],ls=getLessonsBySection(sec),done=sectionDoneCount(sec),pct=Math.round(done/ls.length*100),cats=getCategoriesForSection(sec);
    return '<div class="glass" style="padding:22px;cursor:pointer" onclick="App.nav(\'courses/'+sec+'\')">'      +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div style="width:50px;height:50px;border-radius:12px;background:'+m.bg+';display:flex;align-items:center;justify-content:center;font-size:1.5rem;border:1px solid '+m.color+'44">'+m.icon+'</div>'      +'<div><div style="font-size:1.05rem;font-weight:800;color:var(--txt)">'+m.label+'</div><div style="font-size:.75rem;color:var(--txt2)">'+cats.length+' categories &middot; '+ls.length+' lessons</div></div>'      +'<div style="margin-left:auto;font-size:1.1rem;font-weight:900;color:'+m.color+'">'+pct+'%</div></div>'      +'<p style="font-size:.82rem;color:var(--txt2);margin-bottom:12px;line-height:1.5">'+m.desc+'</p>'      +'<div class="progress-bar"><div style="height:100%;border-radius:99px;background:'+m.color+';width:'+pct+'%;transition:width .8s"></div></div>'      +'<div style="display:flex;justify-content:space-between;margin-top:7px"><span style="font-size:.72rem;color:var(--txt3)">'+done+' completed</span><span style="font-size:.72rem;color:'+m.color+';font-weight:700">Explore &rarr;</span></div></div>';
  }
  function categoryCard(sec,c){
    var m=SECTION_META[sec],done=categoryDoneCount(sec,c.slug),pct=Math.round(done/c.count*100);
    return '<div class="category-card" data-name="'+esc(c.label.toLowerCase())+'" onclick="App.nav(\'courses/'+sec+'/'+c.slug+'\')">'      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><span class="level-chip" style="background:'+m.bg+';color:'+m.color+'">'+c.count+' lessons</span>'+(pct>0?'<span style="font-size:.72rem;font-weight:700;color:'+m.color+'">'+pct+'%</span>':'')+'</div>'      +'<div class="lesson-title" style="margin-bottom:10px">'+esc(c.label)+'</div>'      +'<div class="progress-bar"><div style="height:100%;border-radius:99px;background:'+m.color+';width:'+pct+'%"></div></div></div>';
  }
  function filterCategories(q){
    q=q.trim().toLowerCase();
    document.querySelectorAll('#category-grid .category-card').forEach(function(el){
      el.style.display=el.dataset.name.indexOf(q)!==-1?'':'none';
    });
  }
  function lessonCard(l){
    var m=SECTION_META[l.section],isDone=!!state.completed[l.id];
    return '<div class="lesson-card '+(isDone?'completed':'')+'" onclick="App.openViewer('+l.id+')">'      +'<div class="lesson-card-header"><span class="level-chip" style="background:'+m.bg+';color:'+m.color+'">#'+l.id+'</span><span class="lesson-num">'+l.duration+'m</span></div>'      +'<div class="lesson-title">'+esc(l.title)+'</div>'      +'<div class="lesson-meta"><span class="meta-tag"><i class="fas fa-clock"></i> '+l.duration+'m</span><span class="meta-tag" style="color:var(--gold)">&#11088; '+l.xp+' XP</span>'+(isDone?'<span class="meta-tag" style="color:var(--emerald);margin-left:auto"><i class="fas fa-check-circle"></i> Done</span>':'')+'</div></div>';
  }

  // ---- Progress -----------------------------------------------------
  function pageProgress(){
    var page=document.getElementById('page'),done=Object.keys(state.completed).length;
    var rows=SECTION_KEYS.map(function(sec){
      var m=SECTION_META[sec],ls=getLessonsBySection(sec),d=sectionDoneCount(sec),p=Math.round(d/ls.length*100);
      return '<div><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px"><div style="display:flex;align-items:center;gap:10px"><span>'+m.icon+'</span><span style="font-size:.9rem;font-weight:700;color:var(--txt)">'+m.label+'</span></div><div style="display:flex;align-items:center;gap:12px"><span style="font-size:.8rem;color:var(--txt2)">'+d+' / '+ls.length+'</span><span style="font-size:.9rem;font-weight:800;color:'+m.color+';min-width:38px;text-align:right">'+p+'%</span></div></div><div class="progress-bar" style="height:10px"><div style="height:100%;border-radius:99px;background:'+m.color+';width:'+p+'%;transition:width 1s"></div></div></div>';
    }).join('');
    page.innerHTML='<div style="display:flex;flex-direction:column;gap:24px"><div class="fade-up"><h2 style="font-family:\'Playfair Display\',serif;font-size:1.8rem;font-weight:800;color:var(--txt)">Progress Analytics</h2><p style="color:var(--txt2);margin-top:6px">Track your English learning journey</p></div>'      +'<div class="stats-grid fade-up delay-1">'+sCard('&#128218;','Lessons Done',done,'rgba(124,58,237,.15)','#7c3aed')+sCard('&#9889;','XP Earned',state.xp,'rgba(245,158,11,.15)','#f59e0b')+sCard('&#128293;','Day Streak',state.streak,'rgba(239,68,68,.15)','#ef4444')+sCard('&#9200;','Minutes Studied',state.totalTime,'rgba(16,185,129,.15)','#10b981')+'</div>'      +'<div class="glass fade-up delay-2" style="padding:26px"><div class="section-title" style="margin-bottom:20px"><i class="fas fa-layer-group" style="color:var(--violet)"></i> Category Breakdown</div><div style="display:flex;flex-direction:column;gap:16px">'+rows+'</div></div>'      +'<div class="glass fade-up delay-3" style="padding:26px"><div class="section-title" style="margin-bottom:6px"><i class="fas fa-fire" style="color:var(--violet)"></i> Activity Heatmap</div><div style="font-size:.8rem;color:var(--txt2);margin-bottom:18px">52 weeks of learning</div><div id="hm-full" style="overflow-x:auto"></div>'      +'<div style="display:flex;align-items:center;gap:8px;margin-top:10px"><span style="font-size:.7rem;color:var(--txt3)">Less</span>'+['','heat1','heat2','heat3','heat4'].map(function(c){return '<div class="heatmap-cell '+c+'" style="width:13px;height:13px"></div>';}).join('')+'<span style="font-size:.7rem;color:var(--txt3)">More</span></div></div></div>';
    buildHeatmap('hm-full',52);
  }

  // ---- Achievements ---------------------------------------------------
  function pageAchievements(){
    var page=document.getElementById('page'),done=Object.keys(state.completed).length,badges=getBadges(done);
    page.innerHTML='<div style="display:flex;flex-direction:column;gap:24px"><div class="fade-up"><h2 style="font-family:\'Playfair Display\',serif;font-size:1.8rem;font-weight:800;color:var(--txt)">Achievements</h2><p style="color:var(--txt2);margin-top:6px">'+badges.filter(function(b){return b.unlocked;}).length+' of '+badges.length+' badges earned</p></div>'      +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:14px" class="fade-up delay-1">'+badges.map(function(b){return '<div class="badge-card '+(b.unlocked?'':'locked')+'"><div class="badge-icon">'+b.icon+'</div><div class="badge-title">'+b.title+'</div><div class="badge-desc">'+b.desc+'</div>'+(b.unlocked?'<div style="color:var(--gold);font-size:.75rem;font-weight:700">+'+b.xp+' XP</div>':'<div style="color:var(--txt3);font-size:.72rem">&#128274; Locked</div>')+'</div>';}).join('')+'</div></div>';
  }
  function getBadges(done){
    var b=[
      {icon:'&#127807;',title:'First Step',desc:'1 lesson',xp:25,unlocked:done>=1},
      {icon:'&#128214;',title:'Bookworm',desc:'10 done',xp:50,unlocked:done>=10},
      {icon:'&#127919;',title:'On Target',desc:'25 done',xp:75,unlocked:done>=25},
      {icon:'&#128640;',title:'Rocket',desc:'50 done',xp:100,unlocked:done>=50},
      {icon:'&#128142;',title:'Gem Learner',desc:'100 done',xp:150,unlocked:done>=100},
      {icon:'&#11088;',title:'Star Student',desc:'250 done',xp:200,unlocked:done>=250},
      {icon:'&#127942;',title:'Half Millennium',desc:'500 done',xp:300,unlocked:done>=500},
      {icon:'&#128081;',title:'Corporate Legend',desc:'1000 done',xp:500,unlocked:done>=1000},
      {icon:'&#128293;',title:'On Fire',desc:'7-day streak',xp:100,unlocked:state.streak>=7},
      {icon:'&#9889;',title:'XP Legend',desc:'1000 XP',xp:200,unlocked:state.xp>=1000}
    ];
    SECTION_KEYS.forEach(function(sec){
      var m=SECTION_META[sec];
      b.push({icon:m.icon,title:m.label+' Master',desc:'Complete all '+m.label,xp:400,unlocked:getLessonsBySection(sec).every(function(l){return state.completed[l.id];})});
    });
    return b;
  }

  // ---- Settings ---------------------------------------------------
  function pickAvatar(id){
    document.querySelectorAll('.av-opt').forEach(function(el){el.classList.remove('selected');});
    var el=document.getElementById('avopt-'+id);if(el)el.classList.add('selected');
    state.user.avatarId=id;saveState();updateSidebar();toast('Avatar updated!');
  }

  function pageSettings(){
    var page=document.getElementById('page');
    var ag=AVATARS.map(function(a){
      var sel=a.id===state.user.avatarId;
      return '<div class="av-opt'+(sel?' selected':'')+'" id="avopt-'+a.id+'" onclick="App.pickAvatar(\''+a.id+'\')" title="'+a.label+'"><span style="font-size:1.6rem">'+a.emoji+'</span></div>';
    }).join('');
    page.innerHTML='<div style="display:flex;flex-direction:column;gap:22px;max-width:700px">'      +'<div class="fade-up"><h2 style="font-family:\'Playfair Display\',serif;font-size:1.8rem;font-weight:800;color:var(--txt)">Settings</h2></div>'      +'<div class="glass fade-up delay-1" style="padding:26px"><div class="section-title" style="margin-bottom:16px"><i class="fas fa-user-circle" style="color:var(--violet)"></i> Profile</div>'      +'<div style="margin-bottom:16px"><label style="font-size:.82rem;color:var(--txt2);font-weight:600;display:block;margin-bottom:6px">Display Name</label>'      +'<div style="display:flex;gap:10px"><input type="text" id="pf-name" value="'+esc(state.user.name)+'" style="flex:1;padding:10px 13px"/>'      +'<button class="btn-primary" onclick="var v=document.getElementById(\'pf-name\').value;if(v.trim()){state.user.name=v.trim();App.saveState();App.updateSidebar();App.toast(\'Name saved!\');}">Save</button></div></div>'      +'<div><label style="font-size:.82rem;color:var(--txt2);font-weight:600;display:block;margin-bottom:4px">Choose Avatar</label>'      +'<div style="font-size:.75rem;color:var(--txt3);margin-bottom:10px">5 male &amp; 5 female options</div>'      +'<div class="avatar-grid">'+ag+'</div></div></div>'      +'<div class="glass fade-up delay-2" style="padding:26px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">'      +'<div><div class="section-title"><i class="fas fa-palette" style="color:var(--violet)"></i> Theme</div><div style="font-size:.8rem;color:var(--txt2);margin-top:4px">Currently: '+state.theme+'</div></div>'      +'<button class="btn-primary" onclick="App.toggleTheme()"><i class="fas fa-adjust"></i> Toggle Dark / Light</button></div>'      +'<div class="glass fade-up delay-3" style="padding:26px">'      +'<div class="section-title" style="margin-bottom:14px"><i class="fas fa-bullseye" style="color:var(--violet)"></i> Daily Lesson Goal</div>'      +'<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--txt)">Lessons per day</span><span id="goal-val" style="color:var(--violet);font-weight:700">'+state.dailyGoal+'</span></div>'      +'<input type="range" min="1" max="10" value="'+state.dailyGoal+'" style="width:100%;accent-color:var(--violet)" oninput="state.dailyGoal=Number(this.value);document.getElementById(\'goal-val\').textContent=this.value;App.saveState()"/></div>'      +'<div class="glass fade-up delay-4" style="padding:26px"><div class="section-title" style="margin-bottom:12px;color:var(--rose)"><i class="fas fa-trash"></i> Reset Progress</div>'      +'<button class="btn-ghost" style="color:var(--rose);border-color:var(--rose)" onclick="if(confirm(\'Reset all progress?\')){localStorage.removeItem(\'lc_state_v1\');location.reload()}">Reset All Progress</button></div></div>';
  }

  // ---- Viewer -----------------------------------------------------
  function openViewer(id){
    var lesson=getLessonById(id);if(!lesson)return;
    currentLesson=lesson;
    var modal=document.getElementById('viewer-modal');
    modal.classList.add('open');modal.classList.remove('focus');
    document.getElementById('focus-exit').style.display='none';
    document.body.style.overflow='hidden';
    document.getElementById('vw-title').textContent=lesson.title;
    document.getElementById('vw-meta').textContent=lesson.categoryLabel+' · '+lesson.duration+' min · +'+lesson.xp+' XP';
    document.getElementById('lesson-iframe').src=lesson.url;
    var ls=getLessonsByCategory(lesson.section,lesson.categorySlug),m=SECTION_META[lesson.section];
    document.getElementById('vw-level-label').textContent=lesson.categoryLabel;
    document.getElementById('vw-level-count').textContent=ls.length+' lessons · '+m.label;
    document.getElementById('vw-lesson-list').innerHTML=ls.map(function(l){
      var isA=l.id===lesson.id,chk=state.completed[l.id]?'<i class="fas fa-check-circle" style="color:var(--emerald);font-size:.8rem;flex-shrink:0"></i>':'<div style="width:13px;height:13px;border-radius:50%;border:1.5px solid var(--border);flex-shrink:0"></div>';
      return '<div class="vl-item '+(isA?'active':'')+'" id="vl-'+l.id+'" onclick="App.openViewer('+l.id+')"><div style="display:flex;align-items:center;gap:8px">'+chk+'<div><div class="vl-item-title">'+esc(l.title)+'</div><div class="vl-item-meta">'+l.duration+'min · +'+l.xp+'XP</div></div></div></div>';
    }).join('');
    setTimeout(function(){var el=document.getElementById('vl-'+lesson.id);if(el)el.scrollIntoView({behavior:'smooth',block:'center'});},120);
    history.replaceState(null,'','#lesson/'+id);
  }

  function openFocus(id){openViewer(id);setTimeout(toggleFocus,200);}
  function toggleFocus(){
    var m=document.getElementById('viewer-modal'),isF=m.classList.toggle('focus');
    document.getElementById('focus-exit').style.display=isF?'block':'none';
    var b=document.getElementById('vw-focus');if(b)b.innerHTML=isF?'<i class="fas fa-compress"></i> Exit Focus':'<i class="fas fa-expand"></i> Focus';
  }
  function exitFocus(){
    document.getElementById('viewer-modal').classList.remove('focus');
    document.getElementById('focus-exit').style.display='none';
    var b=document.getElementById('vw-focus');if(b)b.innerHTML='<i class="fas fa-expand"></i> Focus';
  }
  function closeViewer(){
    var m=document.getElementById('viewer-modal');
    m.classList.remove('open','focus');
    document.getElementById('focus-exit').style.display='none';
    document.getElementById('lesson-iframe').src='about:blank';
    document.body.style.overflow='';
    var last=currentLesson;
    currentLesson=null;
    if(last){history.replaceState(null,'','#courses/'+last.section+'/'+last.categorySlug);renderPage('courses/'+last.section+'/'+last.categorySlug);}
    else{history.replaceState(null,'','#dashboard');renderPage('dashboard');}
    document.querySelectorAll('[data-route]').forEach(function(n){n.classList.remove('active');});
    document.querySelectorAll('[data-route="courses"]').forEach(function(n){n.classList.add('active');});
  }

  function toggleSidebar2(){document.getElementById('vw-list').classList.toggle('collapsed');}
  function prevLesson(){if(!currentLesson)return;var ls=getLessonsByCategory(currentLesson.section,currentLesson.categorySlug),i=ls.findIndex(function(l){return l.id===currentLesson.id;});if(i>0)openViewer(ls[i-1].id);}
  function nextLesson(){if(!currentLesson)return;var ls=getLessonsByCategory(currentLesson.section,currentLesson.categorySlug),i=ls.findIndex(function(l){return l.id===currentLesson.id;});if(i<ls.length-1)openViewer(ls[i+1].id);}

  function markDone(){
    if(!currentLesson)return;var id=currentLesson.id;
    if(state.completed[id]){toast('Already completed!');return;}
    state.completed[id]=Date.now();state.xp+=currentLesson.xp;state.xpToday+=currentLesson.xp;
    state.dailyDone++;state.totalTime+=currentLesson.duration;
    state.heatmap[dateKey(0)]=(state.heatmap[dateKey(0)]||0)+1;
    saveState();updateSidebar();
    var el=document.getElementById('vl-'+id);
    if(el){var c=el.querySelector('div[style*="border-radius:50%"]');if(c)c.outerHTML='<i class="fas fa-check-circle" style="color:var(--emerald);font-size:.8rem;flex-shrink:0"></i>';}
    toast('+'+currentLesson.xp+' XP — '+currentLesson.title);
    if(state.dailyDone===state.dailyGoal)setTimeout(function(){toast('Daily goal reached! 🎉');confetti();},1200);
    [1,10,25,50,100,250,500,1000].forEach(function(n){if(Object.keys(state.completed).length===n)setTimeout(function(){toast('Badge unlocked! '+n+' lessons 🏆');confetti();},700);});
  }

  // ---- Search -----------------------------------------------------
  var _st;
  function search(q){
    clearTimeout(_st);_st=setTimeout(function(){
      var box=document.getElementById('search-results');
      if(!q.trim()){box.classList.remove('show');return;}
      var lq=q.toLowerCase();
      var res=LESSONS.filter(function(l){return l.title.toLowerCase().indexOf(lq)!==-1||l.categoryLabel.toLowerCase().indexOf(lq)!==-1;}).slice(0,10);
      box.innerHTML=res.length?res.map(function(l){
        return '<div class="sr-item" onmousedown="event.preventDefault();App.openViewer('+l.id+');document.getElementById(\'search-input\').value=\'\';document.getElementById(\'search-results\').classList.remove(\'show\')"><div class="sr-title">'+esc(l.title)+'</div><div class="sr-meta">'+esc(l.categoryLabel)+' · '+l.duration+'min · +'+l.xp+'XP</div></div>';
      }).join(''):'<div class="sr-item"><div class="sr-title" style="color:var(--txt3)">No results found</div></div>';
      box.classList.add('show');
    },200);
  }
  function searchFocus(){var q=document.getElementById('search-input').value;if(q)search(q);}
  function searchBlur(){setTimeout(function(){document.getElementById('search-results').classList.remove('show');},200);}

  function buildHeatmap(cid,weeks){
    var el=document.getElementById(cid);if(!el)return;
    var today=new Date(),cols=[];
    for(var w=weeks-1;w>=0;w--){
      var cells=[];
      for(var d=6;d>=0;d--){
        var dt=new Date(today);dt.setDate(today.getDate()-(w*7+d));
        var key=dt.toISOString().split('T')[0],n=state.heatmap[key]||0;
        var heat=n===0?'':n===1?'heat1':n<=3?'heat2':n<=5?'heat3':'heat4';
        cells.push('<div class="heatmap-cell '+heat+'" title="'+key+': '+n+'"></div>');
      }
      cols.push('<div style="display:flex;flex-direction:column;gap:3px">'+cells.join('')+'</div>');
    }
    el.innerHTML='<div class="heatmap-grid">'+cols.join('')+'</div>';
  }

  function buildLevelNav(){
    document.getElementById('level-nav').innerHTML=SECTION_KEYS.map(function(sec){
      var m=SECTION_META[sec],ls=getLessonsBySection(sec),done=sectionDoneCount(sec);
      return '<div class="level-pill" onclick="App.nav(\'courses/'+sec+'\')"><div style="display:flex;align-items:center;gap:8px"><span>'+m.icon+'</span><span style="font-size:.85rem;font-weight:600;color:var(--txt)">'+m.label+'</span></div><span style="font-size:.72rem;color:'+m.color+';font-weight:700">'+done+'/'+ls.length+'</span></div>';
    }).join('');
  }

  function updateSidebar(){
    var xp=state.xpToday||0;
    document.getElementById('sb-xp-bar').style.width=Math.min(100,Math.round(xp/100*100))+'%';
    document.getElementById('sb-xp-label').textContent=xp+' / 100';
    document.getElementById('sb-streak').textContent=state.streak+' day streak 🔥';
    document.getElementById('sb-name').textContent=state.user.name;
    document.getElementById('tb-xp').textContent=state.xp+' XP';
    var av=getAvatar();
    var emojiEl=document.getElementById('sb-avatar-emoji');
    if(emojiEl)emojiEl.innerHTML=av.emoji;
  }

  function applyTheme(t){
    document.documentElement.setAttribute('data-theme',t);
    var b=document.getElementById('theme-btn');
    if(b)b.innerHTML=t==='dark'?'<i class="fas fa-sun"></i>':'<i class="fas fa-moon"></i>';
  }
  function toggleTheme(){state.theme=state.theme==='dark'?'light':'dark';applyTheme(state.theme);saveState();}
  function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('overlay').classList.toggle('show');}
  function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('overlay').classList.remove('show');}

  function toast(msg,dur){
    dur=dur||3000;var el=document.createElement('div');el.className='toast-item';el.textContent=msg;
    document.getElementById('toast').appendChild(el);
    setTimeout(function(){el.style.opacity='0';el.style.transition='opacity .3s';setTimeout(function(){el.remove();},300);},dur);
  }
  function confetti(){
    var colors=['#7c3aed','#4f46e5','#f59e0b','#10b981','#f43f5e','#60a5fa'];
    for(var i=0;i<60;i++){
      var el=document.createElement('div');el.className='confetti-piece';
      el.style.cssText='left:'+(Math.random()*100)+'vw;width:'+(6+Math.random()*6)+'px;height:'+(8+Math.random()*8)+'px;background:'+colors[Math.floor(Math.random()*colors.length)]+';animation-duration:'+(2+Math.random()*2)+'s;animation-delay:'+(Math.random()*.5)+'s;transform:rotate('+(Math.random()*360)+'deg)';
      document.body.appendChild(el);
      setTimeout(function(e){return function(){e.remove();};}(el),4500);
    }
  }

  return {
    init:init,nav:nav,openViewer:openViewer,openFocus:openFocus,closeViewer:closeViewer,
    toggleFocus:toggleFocus,exitFocus:exitFocus,
    toggleSidebar2:toggleSidebar2,prevLesson:prevLesson,nextLesson:nextLesson,markDone:markDone,
    pickAvatar:pickAvatar,filterCategories:filterCategories,
    toggleTheme:toggleTheme,toggleSidebar:toggleSidebar,closeSidebar:closeSidebar,
    search:search,searchFocus:searchFocus,searchBlur:searchBlur,
    saveState:saveState,updateSidebar:updateSidebar,toast:toast,confetti:confetti,buildLevelNav:buildLevelNav
  };
})();

document.addEventListener('DOMContentLoaded',App.init);
