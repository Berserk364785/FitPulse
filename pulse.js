'use strict';
// ============================================================
//  FitPulse 2.0 — «ПУЛЬС»
//  Новый слой поверх основного приложения:
//   • Нижняя навигация в стиле мобильного приложения (5 разделов)
//   • Главный экран «Сегодня»: кольца активности, тренировка дня, подарок дня
//   • Тренировка дня — персональный план, подстраивается под уровень и рекорды
//   • Гид-режим: упражнения идут друг за другом с отдыхом между ними
//   • «Путь героя» — 40 этапов, 4 главы, боссы и награды (темы, аватары)
//   • Экран итогов после каждой тренировки + карточка для сторис
//   • Ежедневный подарок с 7-дневной серией входов
//   • Щиты серии — спасают огонёк, если пропустил день
//   • Фокус-режим во время тренировки — ничего лишнего на экране
//  Модуль подключается ПОСЛЕ script.js и аккуратно оборачивает его функции.
// ============================================================
(function(){
const L=(ru,en)=>(typeof currentLang!=='undefined'&&currentLang==='en')?en:ru;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ───────────────────────── STORAGE ─────────────────────────
const PKEY='fp_pulse';
function loadP(){
  let p={};try{p=JSON.parse(localStorage.getItem(PKEY)||'{}')||{};}catch(e){p={};}
  p.days=p.days||{};p.shields=p.shields??1;p.path=p.path||{};p.unlocked=p.unlocked||[];
  p.frozen=p.frozen||[];p.gift=p.gift||{last:null,streak:0};p.claims=p.claims||{};
  return p;
}
let P=loadP();
function saveP(){
  // держим историю дней не больше 400 дней (нужна для тепловой карты и сезона)
  const keys=Object.keys(P.days).sort();
  if(keys.length>400)keys.slice(0,keys.length-400).forEach(k=>delete P.days[k]);
  localStorage.setItem(PKEY,JSON.stringify(P));
}
const todayKey=()=>localDateKey();
function keyOffset(n){const d=new Date();d.setDate(d.getDate()+n);return localDateKey(d);}
function day(k=todayKey()){return P.days[k]||(P.days[k]={reps:0,secs:0,plank:0,xp:0,workouts:0,plan:false});}
const fitLevel=()=>localStorage.getItem('fp_fitness_level')||'intermediate';
const LVI=()=>({beginner:0,intermediate:1,advanced:2}[fitLevel()]??1);
const totalXP=()=>100*(lvl-1)*lvl/2+xp;

// ─────────────── ЩИТЫ СЕРИИ (до загрузки основного state) ───────────────
// Если пропущены дни, а щитов хватает — «замораживаем» серию до вчерашнего дня,
// чтобы load() в script.js её не обнулил.
let shieldSavedMsg=null;
(function applyShields(){
  try{
    const d=JSON.parse(localStorage.getItem('fp2')||'{}');
    if(!d.lastWorkoutDate||!d.dayStreak)return;
    const gap=daysBetween(d.lastWorkoutDate,todayKey());
    if(gap<=1)return;
    const need=gap-1;
    if(P.shields>=need){
      P.shields-=need;
      for(let i=1;i<=need;i++){const dd=new Date(d.lastWorkoutDate+'T00:00:00');dd.setDate(dd.getDate()+i);P.frozen.push(localDateKey(dd));}
      P.frozen=P.frozen.slice(-30);
      d.lastWorkoutDate=keyOffset(-1);
      localStorage.setItem('fp2',JSON.stringify(d));
      shieldSavedMsg={need,streak:d.dayStreak};
      saveP();
    }
  }catch(e){}
})();

// ───────────────────────── НОВЫЕ ТЕМЫ ─────────────────────────
const EXTRA_THEMES=[
  {id:'aurora',name:'Аврора',nameEn:'Aurora',s1:'#2dd4bf',s2:'#a855f7',lock:10},
  {id:'ember',name:'Пламя',nameEn:'Ember',s1:'#f43f5e',s2:'#fb923c',lock:20},
  {id:'gold',name:'Золото',nameEn:'Gold',s1:'#fbbf24',s2:'#d97706',lock:30},
  {id:'cosmos',name:'Космос',nameEn:'Cosmos',s1:'#60a5fa',s2:'#f472b6',lock:40},
];
EXTRA_THEMES.forEach(t=>THEMES.push(t));
const isUnlocked=id=>P.unlocked.includes(id);

// ───────────────────────── ПУТЬ ГЕРОЯ ─────────────────────────
const CHAPTERS=[
  {ru:'Пробуждение',en:'Awakening',e:'🌱',title:{ru:'Пробуждённый',en:'Awakened'}},
  {ru:'Закалка',en:'Tempering',e:'🔥',title:{ru:'Закалённый',en:'Tempered'}},
  {ru:'Сила',en:'Power',e:'⚡',title:{ru:'Мастер силы',en:'Power Master'}},
  {ru:'Легенда',en:'Legend',e:'👑',title:{ru:'Легенда FitPulse',en:'FitPulse Legend'}},
];
const NODES=40;
// Награды за этапы-боссы: каждый 5-й этап
const REWARDS={
  5:{type:'emoji',v:'🦊'},10:{type:'theme',v:'aurora'},
  15:{type:'emoji',v:'🐺'},20:{type:'theme',v:'ember'},
  25:{type:'emoji',v:'🦁'},30:{type:'theme',v:'gold'},
  35:{type:'emoji',v:'🐉'},40:{type:'theme',v:'cosmos'},
};
function rewardLabel(r){
  if(!r)return'';
  if(r.type==='emoji')return L(`Аватар ${r.v}`,`Avatar ${r.v}`);
  const t=EXTRA_THEMES.find(x=>x.id===r.v);return L(`Тема «${t.name}»`,`Theme “${t.nameEn}”`);
}
// Базовые объёмы по уровню подготовки [новичок, средний, продвинутый]
const BASE={pushup:[6,12,20],squat:[10,18,28],lunge:[8,12,18],situp:[8,15,22],burpee:[4,8,12],plank:[20,35,60],pullup:[2,5,9]};
const HOME_EX=['pushup','squat','lunge','situp','plank','burpee'];
function repsFor(ex,mult){
  const b=BASE[ex][LVI()];
  let r=Math.round(b*mult);
  const pr=prRecords?.[ex]||0;
  // Адаптация: если рекорд сильно выше базы — подтягиваем план к ~60% рекорда
  if(pr>0)r=Math.max(r,Math.min(Math.round(pr*0.6*mult),b*2));
  if(ex==='plank')r=Math.max(10,Math.round(r/5)*5);
  return Math.max(ex==='plank'?10:3,r);
}
function nodePlan(n){
  const rng=seededRandom(9001+n*131);
  const ch=Math.floor(n/10),boss=(n%5===4);
  const count=Math.min(5,2+Math.floor(ch/1.5)+(boss?1:0)+(rng()<.4?1:0));
  const mult=(0.6+n*0.025)*(boss?1.25:1);
  const pool=[...HOME_EX];const steps=[];let last=null;
  for(let i=0;i<count;i++){
    let ex;do{ex=pool[Math.floor(rng()*pool.length)];}while(ex===last);
    last=ex;steps.push({ex,reps:repsFor(ex,mult)});
  }
  return{kind:'path',node:n,boss,title:boss?L(`Испытание · Этап ${n+1}`,`Trial · Stage ${n+1}`):L(`Этап ${n+1}`,`Stage ${n+1}`),steps};
}
const pathDone=n=>P.path[n]>0;
const currentNode=()=>{for(let i=0;i<NODES;i++)if(!pathDone(i))return i;return NODES;};

// ───────────────────────── ТРЕНИРОВКА ДНЯ ─────────────────────────
const DAY_THEMES={
  1:{ru:'Верх тела',en:'Upper body',e:'💪',ex:['pushup','plank','burpee','pushup']},
  2:{ru:'День ног',en:'Leg day',e:'🦵',ex:['squat','lunge','squat','plank']},
  3:{ru:'Кор и пресс',en:'Core & abs',e:'🎯',ex:['situp','plank','lunge','situp']},
  4:{ru:'Всё тело',en:'Full body',e:'🔥',ex:['burpee','squat','pushup','situp']},
  5:{ru:'Сила',en:'Strength',e:'🏋️',ex:['pushup','squat','lunge','pushup']},
  6:{ru:'Кардио-взрыв',en:'Cardio blast',e:'⚡',ex:['burpee','squat','lunge','burpee']},
  0:{ru:'Лёгкий день',en:'Easy day',e:'🧘',ex:['squat','plank','situp'],light:true},
};
function dailyPlan(){
  const k=todayKey(),wd=new Date().getDay(),th=DAY_THEMES[wd];
  const rng=seededRandom(dateSeed(k)+77);
  const mult=(th.light?0.7:1)*(0.95+rng()*0.15);
  return{kind:'daily',title:L(th.ru,th.en),emoji:th.e,steps:th.ex.map(ex=>({ex,reps:repsFor(ex,mult)}))};
}
function planMinutes(plan){
  let s=0;plan.steps.forEach((st,i)=>{s+=st.ex==='plank'?st.reps:st.reps*(st.ex==='burpee'?5:3);if(i)s+=restSec();});
  return Math.max(2,Math.round(s/60));
}
const restSec=()=>[35,25,20][LVI()];
const unit=ex=>ex==='plank'?L('сек','sec'):'×';
const stepTxt=st=>st.ex==='plank'?`${st.reps} ${L('сек','sec')}`:`×${st.reps}`;

// ───────────────────────── КОЛЬЦА АКТИВНОСТИ ─────────────────────────
function ringGoals(){const i=LVI();return{move:[30,60,100][i],mins:[8,12,20][i],xp:[150,300,500][i]};}
function ringVals(k=todayKey()){
  const d=day(k),g=ringGoals();
  const move=d.reps+Math.floor((d.plank||0)/3);
  return{move,mins:Math.floor(d.secs/60),xp:Math.round(d.xp),g,
    pm:Math.min(1,move/g.move),pt:Math.min(1,d.secs/60/g.mins),px:Math.min(1,d.xp/g.xp)};
}
function ringsSVG(v,size=150,stroke=14){
  const rings=[{p:v.pm,c:'#f43f5e'},{p:v.pt,c:'#a3e635'},{p:v.px,c:'#22d3ee'}];
  const c=size/2;let out=`<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="fp-rings">`;
  rings.forEach((r,i)=>{
    const rad=c-stroke/2-i*(stroke+3),len=2*Math.PI*rad;
    out+=`<circle cx="${c}" cy="${c}" r="${rad}" stroke="${r.c}" stroke-opacity=".18" stroke-width="${stroke}" fill="none"/>`;
    out+=`<circle cx="${c}" cy="${c}" r="${rad}" stroke="${r.c}" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-dasharray="${len}" stroke-dashoffset="${len*(1-Math.max(r.p,0.001))}" transform="rotate(-90 ${c} ${c})" class="fp-ring-arc" style="--len:${len}"/>`;
  });
  return out+'</svg>';
}

// ───────────────────────── УТИЛИТЫ UI ─────────────────────────
// Глобальный тост: старый жил внутри видео и был не виден на других вкладках
let bootQuiet=true;
window.toast=function(txt,dur=2500){
  if(bootQuiet)return;
  let el=$('fpToast');
  if(!el){el=document.createElement('div');el.id='fpToast';el.className='fp-toast';document.body.appendChild(el);}
  el.textContent=txt;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');
  clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),dur);
};
// setTheme в script.js перезаписывал весь className у body — теперь сохраняем остальные классы
window.setTheme=function(t){
  const th=THEMES.find(x=>x.id===t);
  if(th&&th.lock&&!isUnlocked(th.id))t='violet';
  [...document.body.classList].filter(c=>c.startsWith('theme-')).forEach(c=>document.body.classList.remove(c));
  document.body.classList.add('theme-'+t);localStorage.setItem('fp_theme',t);
};
window.buildThemeGrid=function(){
  const el=$('themeGrid');if(!el)return;
  const cur=localStorage.getItem('fp_theme')||'violet';
  el.innerHTML=THEMES.map(t=>{
    const locked=t.lock&&!isUnlocked(t.id);
    const name=currentLang==='en'&&t.nameEn?t.nameEn:t.name;
    return `<button class="th-btn${t.id===cur?' active':''}${locked?' fp-locked':''}" data-t="${t.id}"><div class="th-swatch" style="background:linear-gradient(90deg,${t.s1},${t.s2})"></div>${locked?'🔒 ':''}${name}${locked?`<div class="fp-lock-hint">${L('Путь: этап','Path: stage')} ${t.lock}</div>`:''}</button>`;
  }).join('');
  el.querySelectorAll('.th-btn').forEach(b=>b.onclick=()=>{
    const t=THEMES.find(x=>x.id===b.dataset.t);
    if(t.lock&&!isUnlocked(t.id)){toast(L(`🔒 Откроется на этапе ${t.lock} «Пути героя»`,`🔒 Unlocks at Hero Path stage ${t.lock}`));return;}
    setTheme(b.dataset.t);el.querySelectorAll('.th-btn').forEach(x=>x.classList.toggle('active',x===b));closeModal('themeModal');
  });
};
// разблокированные аватары
P.unlocked.forEach(u=>{if(/\p{Extended_Pictographic}/u.test(u)&&!EMOJIS.includes(u))EMOJIS.push(u);});

const XSVG='<svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
window.FP_XSVG=XSVG;
function sheet(html,cls=''){
  closeSheet();
  const ov=document.createElement('div');ov.className='fp-sheet-ov';ov.id='fpSheet';
  const x=html.includes('data-x')?'':`<div class="fp-sheet-xw"><button class="fp-sheet-x" aria-label="${L('Закрыть','Close')}">${XSVG}</button></div>`;
  ov.innerHTML=`<div class="fp-sheet ${cls}">${x}<div class="fp-sheet-grab"></div>${html}</div>`;
  ov.querySelector('.fp-sheet-x')?.addEventListener('click',closeSheet);
  ov.addEventListener('click',e=>{if(e.target===ov)closeSheet();});
  document.body.appendChild(ov);requestAnimationFrame(()=>ov.classList.add('open'));
  return ov;
}
function closeSheet(){const s=$('fpSheet');if(s){s.classList.remove('open');setTimeout(()=>s.remove(),250);}}
window.fpCloseSheet=closeSheet;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('fpSheet')){e.stopImmediatePropagation();closeSheet();}},true);

// ───────────────────────── НАВИГАЦИЯ ─────────────────────────
const GROUPS=[
  {id:'home',ico:'🏠',ru:'Сегодня',en:'Today',tabs:['home']},
  {id:'train',ico:'🏋️',ru:'Тренировка',en:'Train',tabs:['train']},
  {id:'path',ico:'🗺️',ru:'Путь',en:'Path',tabs:['path','programs']},
  {id:'arena',ico:'⚔️',ru:'Арена',en:'Arena',tabs:['duels','community']},
  {id:'me',ico:'👤',ru:'Я',en:'Me',tabs:['profile','progress']},
];
const SUBLABEL={path:['🗺️ Путь героя','🗺️ Hero path'],programs:['📋 Программы','📋 Programs'],duels:['⚔️ Дуэли','⚔️ Duels'],community:['🏆 Рейтинг','🏆 Ranking'],profile:['👤 Профиль','👤 Profile'],progress:['📊 Прогресс','📊 Progress']};
let curTab='home';
function groupOf(tab){return GROUPS.find(g=>g.tabs.includes(tab))||GROUPS[0];}
function buildNav(){
  let nav=$('fpNav');
  if(!nav){nav=document.createElement('nav');nav.id='fpNav';nav.className='fp-nav';document.body.appendChild(nav);}
  nav.innerHTML=GROUPS.map(g=>`<button class="fp-nav-btn" data-g="${g.id}"><span class="fp-nav-ico">${g.ico}</span><span class="fp-nav-lbl">${L(g.ru,g.en)}</span>${g.id==='home'?'<span class="fp-nav-dot" id="fpHomeDot"></span>':''}</button>`).join('');
  nav.querySelectorAll('.fp-nav-btn').forEach(b=>b.onclick=()=>{
    const g=GROUPS.find(x=>x.id===b.dataset.g);
    const target=g.tabs.includes(curTab)?curTab:(g._last||g.tabs[0]);
    openTab(target);if(navigator.vibrate)navigator.vibrate(8);
  });
  let sub=$('fpSubnav');
  if(!sub){sub=document.createElement('div');sub.id='fpSubnav';sub.className='fp-subnav';document.querySelector('.tab-bar')?.after(sub);}
  updateNav();
}
function updateNav(){
  const g=groupOf(curTab);g._last=curTab;
  document.querySelectorAll('.fp-nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.g===g.id));
  const sub=$('fpSubnav');if(!sub)return;
  if(g.tabs.length<2){sub.style.display='none';return;}
  sub.style.display='flex';
  sub.innerHTML=g.tabs.map(t=>`<button class="fp-sub-btn${t===curTab?' active':''}" data-t="${t}">${L(...SUBLABEL[t])}</button>`).join('');
  sub.querySelectorAll('.fp-sub-btn').forEach(b=>b.onclick=()=>openTab(b.dataset.t));
  const dot=$('fpHomeDot');if(dot)dot.style.display=giftAvailable()?'block':'none';
}
const HOOKS={home:[],summary:[]};
const _openTab=window.openTab;
window.openTab=function(id){
  curTab=id;_openTab(id);
  if(id==='home')renderHome();
  if(id==='path')renderPath();
  updateNav();
  if(!document.body.classList.contains('fp-live'))window.scrollTo({top:0,behavior:'instant'});
};

// ───────────────────────── ШАПКА ─────────────────────────
function renderHeaderStats(){
  let el=$('fpHStats');
  if(!el){
    el=document.createElement('button');el.id='fpHStats';el.className='fp-hstats';
    document.querySelector('.app-header .logo')?.after(el);
  }
  el.onclick=()=>openTab('profile');
  el.innerHTML=`<span class="fp-hs-fire${dayStreak>0?' hot':''}">🔥 ${dayStreak}</span><span class="fp-hs-sh">🛡️ ${P.shields}</span><span class="fp-hs-lvl">Lv ${lvl}</span>`;
}

// ───────────────────────── ГЛАВНЫЙ ЭКРАН ─────────────────────────
function greeting(){
  const h=new Date().getHours();
  if(h<5)return L('Доброй ночи','Good night');
  if(h<12)return L('Доброе утро','Good morning');
  if(h<18)return L('Добрый день','Good afternoon');
  return L('Добрый вечер','Good evening');
}
function motto(){
  const d=day();
  if(dayStreak>0&&!d.workouts)return L(`🔥 Серия ${dayStreak} дн. ждёт продолжения — не дай огоньку погаснуть`,`🔥 Your ${dayStreak}-day streak is waiting — keep the fire alive`);
  if(d.plan)return L('✅ Тренировка дня закрыта. Ты сегодня в ударе!','✅ Workout of the day done. You are on fire today!');
  if(d.workouts)return L('Хорошее начало! Добей кольца до конца дня 💫','Great start! Close your rings before the day ends 💫');
  const arr=[L('Начни с малого — 5 минут сегодня важнее часа «когда-нибудь»','Start small — 5 minutes today beats an hour “someday”'),
    L('Тело запоминает каждое повторение 💪','Your body remembers every rep 💪'),
    L('Лучшее время для тренировки — сейчас','The best time to train is now')];
  return arr[new Date().getDate()%arr.length];
}
function weekStrip(){
  const dates=new Set(getWorkoutDates()),fr=new Set(P.frozen);
  const now=new Date(),wd=(now.getDay()+6)%7;const names=L('Пн Вт Ср Чт Пт Сб Вс','Mo Tu We Th Fr Sa Su').split(' ');
  let html='',cnt=0,reps=0;
  for(let i=0;i<7;i++){
    const k=keyOffset(i-wd),done=dates.has(k),frozen=fr.has(k),isT=i===wd,fut=i>wd;
    if(done){cnt++;reps+=(P.days[k]?.reps||0);}
    html+=`<div class="fp-wd${done?' done':''}${frozen?' frozen':''}${isT?' today':''}${fut?' fut':''}"><div class="fp-wd-n">${names[i]}</div><div class="fp-wd-c">${done?'✓':frozen?'🛡️':isT?'•':''}</div></div>`;
  }
  return{html,cnt,reps};
}
function giftAvailable(){return P.gift.last!==todayKey();}
const GIFT_TABLE=[20,30,40,50,60,80,100];
function renderHome(){
  const host=$('fpHomeHost');if(!host)return;
  const v=ringVals(),plan=dailyPlan(),d=day(),node=currentNode(),ws=weekStrip();
  const avatarHtml=avatarIsPhoto?`<img src="${esc(avatar)}" alt="">`:esc(avatar);
  const gStreak=P.gift.last===keyOffset(-1)||P.gift.last===todayKey()?P.gift.streak:0;
  const nextGiftDay=giftAvailable()?(gStreak%7)+1:((gStreak-1)%7)+1;
  host.innerHTML=`
  <div class="fp-hello">
    <div class="fp-hello-av" onclick="openTab('profile')">${avatarHtml}</div>
    <div class="fp-hello-txt">
      <div class="fp-hello-g">${greeting()}, ${esc(userName)}!</div>
      <div class="fp-hello-m">${motto()}</div>
    </div>
  </div>

  <div class="fp-card fp-rings-card">
    <div class="fp-rings-wrap">${ringsSVG(v)}<div class="fp-rings-center"><div class="fp-rc-big">${Math.round((v.pm+v.pt+v.px)/3*100)}%</div><div class="fp-rc-sm">${L('дня','of day')}</div></div></div>
    <div class="fp-ring-legend">
      <div class="fp-rl"><i style="background:#f43f5e"></i><div><b>${v.move}</b> / ${v.g.move}<span>${L('Движение · повт.','Move · reps')}</span></div></div>
      <div class="fp-rl"><i style="background:#a3e635"></i><div><b>${v.mins}</b> / ${v.g.mins}<span>${L('Активные минуты','Active minutes')}</span></div></div>
      <div class="fp-rl"><i style="background:#22d3ee"></i><div><b>${v.xp}</b> / ${v.g.xp}<span>${L('Опыт за день','XP today')}</span></div></div>
    </div>
  </div>

  <div class="fp-card fp-wod${d.plan?' done':''}">
    <div class="fp-wod-top">
      <div class="fp-chip">${L('Тренировка дня','Workout of the day')}</div>
      <div class="fp-wod-min">⏱ ~${planMinutes(plan)} ${L('мин','min')}</div>
    </div>
    <div class="fp-wod-title">${plan.emoji} ${esc(plan.title)}</div>
    <div class="fp-wod-sub">${L('Подобрано под твой уровень и рекорды','Tuned to your level and records')}</div>
    <div class="fp-wod-steps">${plan.steps.map(s=>`<div class="fp-step-chip"><span>${EX[s.ex].emoji}</span>${esc(EX[s.ex].name)} <b>${stepTxt(s)}</b></div>`).join('')}</div>
    <button class="fp-cta" id="fpStartWod">${d.plan?L('🔁 Пройти ещё раз','🔁 Do it again'):L('▶ Начать тренировку','▶ Start workout')}</button>
    ${d.plan?`<div class="fp-wod-done">✅ ${L('Выполнено сегодня','Completed today')}</div>`:`<div class="fp-wod-bonus">+${60+LVI()*20} XP ${L('бонус за выполнение','completion bonus')}</div>`}
  </div>

  <div id="fpPlusHome"></div>
  <div class="fp-grid2">
    <div class="fp-card fp-gift${giftAvailable()?' ready':''}" id="fpGiftCard">
      <div class="fp-gift-ico">${giftAvailable()?'🎁':'✅'}</div>
      <div class="fp-gift-t">${giftAvailable()?L('Подарок дня','Daily gift'):L('Подарок получен','Gift claimed')}</div>
      <div class="fp-gift-s">${giftAvailable()?L(`День ${nextGiftDay} из 7`,`Day ${nextGiftDay} of 7`):L('Возвращайся завтра','Come back tomorrow')}</div>
      <div class="fp-gift-dots">${GIFT_TABLE.map((_,i)=>`<i class="${i<(giftAvailable()?nextGiftDay-1:nextGiftDay)?'on':''}${i===6?' big':''}"></i>`).join('')}</div>
    </div>
    <div class="fp-card fp-pathmini" id="fpPathMini">
      <div class="fp-gift-ico">${node>=NODES?'👑':CHAPTERS[Math.floor(node/10)].e}</div>
      <div class="fp-gift-t">${L('Путь героя','Hero path')}</div>
      <div class="fp-gift-s">${node>=NODES?L('Путь пройден!','Path complete!'):L(`Этап ${node+1} из ${NODES}`,`Stage ${node+1} of ${NODES}`)}</div>
      <div class="fp-mini-bar"><div style="width:${node/NODES*100}%"></div></div>
    </div>
  </div>

  <div class="fp-card fp-week">
    <div class="fp-week-head"><div><div class="fp-week-t">🔥 ${dayStreak} ${L('дн. подряд','day streak')}</div><div class="fp-week-s">${L(`На этой неделе: ${ws.cnt} трен. · ${ws.reps} повт.`,`This week: ${ws.cnt} workouts · ${ws.reps} reps`)}</div></div>
      <div class="fp-shields" title="${L('Щиты серии','Streak shields')}">${'🛡️'.repeat(P.shields)||'—'}<span>${L('щиты','shields')}</span></div></div>
    <div class="fp-week-row">${ws.html}</div>
    <div class="fp-week-tip">${L('🛡️ Щит спасает серию, если пропустишь день. Получай их в подарке 7-го дня и за каждые 7 дней серии.','🛡️ A shield saves your streak if you miss a day. Earn them on gift day 7 and every 7-day streak.')}</div>
  </div>
  <div class="fp-section-t">${L('Задания и вызовы','Quests & challenges')}</div>
  `;
  // Задания из старого экрана переносим под главный экран (DOM-узлы сохраняют свои id и логику)
  const qh=$('fpQuestHost');
  if(qh&&!qh.dataset.moved){['questBlock','challengeBlock'].forEach(id=>{const n=$(id);if(n){n.classList.remove('collapsed');qh.appendChild(n);}});qh.dataset.moved='1';}
  $('fpStartWod').onclick=()=>startGuided(dailyPlan());
  $('fpGiftCard').onclick=()=>giftAvailable()?openGift():toast(L('🎁 Новый подарок будет завтра','🎁 Next gift tomorrow'));
  $('fpPathMini').onclick=()=>openTab('path');
  renderHeaderStats();
  HOOKS.home.forEach(f=>{try{f($('fpPlusHome'));}catch(e){console.error(e);}});
}

// ───────────────────────── ПОДАРОК ДНЯ ─────────────────────────
function openGift(){
  if(!giftAvailable())return;
  const cont=P.gift.last===keyOffset(-1);
  const streakN=cont?P.gift.streak+1:1;
  const dayIdx=(streakN-1)%7;
  let amount=GIFT_TABLE[dayIdx],shield=dayIdx===6,lucky=Math.random()<0.12;
  if(lucky)amount*=2;
  if(!shield&&dayIdx>=2&&Math.random()<0.08)shield=true;
  const ov=sheet(`
    <div class="fp-giftbox"><div class="fp-chest" id="fpChest">🎁</div>
    <div class="fp-gift-reveal" id="fpGiftReveal">
      <div class="fp-gr-xp">+${amount} XP</div>
      ${lucky?`<div class="fp-gr-luck">🍀 ${L('Удача! Награда ×2','Lucky! Reward ×2')}</div>`:''}
      ${shield?`<div class="fp-gr-sh">🛡️ ${L('+1 щит серии','+1 streak shield')}</div>`:''}
      <div class="fp-gr-day">${L(`День ${dayIdx+1} из 7`,`Day ${dayIdx+1} of 7`)} · ${dayIdx<6?L(`на 7-й день — щит и ${GIFT_TABLE[6]} XP`,`day 7 — shield + ${GIFT_TABLE[6]} XP`):L('цикл завершён!','cycle complete!')}</div>
      <button class="fp-cta" onclick="fpCloseSheet()">${L('Забрать','Collect')}</button>
    </div>
    <div class="fp-gift-tap" id="fpGiftTap">${L('Нажми на подарок','Tap the gift')}</div></div>`,'fp-sheet-gift');
  const chest=ov.querySelector('#fpChest');
  let opened=false;
  chest.onclick=()=>{
    if(opened)return;opened=true;
    chest.classList.add('shake');beep(500,.08);
    setTimeout(()=>{
      chest.classList.remove('shake');chest.classList.add('burst');chest.textContent='✨';
      ov.querySelector('#fpGiftReveal').classList.add('show');ov.querySelector('#fpGiftTap').style.display='none';
      P.gift={last:todayKey(),streak:streakN};
      if(shield)P.shields=Math.min(3,P.shields+1);
      saveP();addXP(amount);bSuccess();confetti(2200);
      if(navigator.vibrate)navigator.vibrate([30,40,60]);
      renderHome();updateNav();
    },800);
  };
}

// ───────────────────────── ПУТЬ: ЭКРАН ─────────────────────────
function renderPath(){
  const host=$('fpPathHost');if(!host)return;
  const cur=currentNode();
  const ch=Math.min(3,Math.floor(Math.min(cur,NODES-1)/10));
  const stars=Object.values(P.path).reduce((s,v)=>s+(v||0),0);
  let html=`<div class="fp-card fp-path-head">
    <div class="fp-ph-e">${CHAPTERS[ch].e}</div>
    <div style="flex:1"><div class="fp-ph-t">${L('Глава','Chapter')} ${ch+1}: ${L(CHAPTERS[ch].ru,CHAPTERS[ch].en)}</div>
    <div class="fp-ph-s">${L(`Пройдено ${Math.min(cur,NODES)} из ${NODES} этапов · ⭐ ${stars}/${NODES*3}`,`${Math.min(cur,NODES)} of ${NODES} stages · ⭐ ${stars}/${NODES*3}`)}</div>
    <div class="fp-mini-bar"><div style="width:${cur/NODES*100}%"></div></div></div></div>
    <div class="fp-path">`;
  for(let n=0;n<NODES;n++){
    if(n%10===0){
      const c=CHAPTERS[n/10],locked=n>cur;
      html+=`<div class="fp-chapter${locked?' locked':''}"><span>${c.e}</span>${L('Глава','Chapter')} ${n/10+1} · ${L(c.ru,c.en)}<small>${L('Титул','Title')}: ${L(c.title.ru,c.title.en)}</small></div>`;
    }
    const done=pathDone(n),isCur=n===cur,boss=n%5===4,rew=REWARDS[n+1];
    const off=Math.round(Math.sin(n*0.9)*70);
    const st=done?'done':isCur?'cur':'locked';
    html+=`<div class="fp-node-row" style="--off:${off}px"><button class="fp-node ${st}${boss?' boss':''}" data-n="${n}">
      <span class="fp-node-ico">${done?(boss?'🏆':'✓'):isCur?(boss?'⚔️':'▶'):(boss?'⚔️':'🔒')}</span>
      ${done?`<span class="fp-node-stars">${'★'.repeat(P.path[n])}${'☆'.repeat(3-P.path[n])}</span>`:''}
      ${isCur?`<span class="fp-node-lbl">${L('СТАРТ','START')}</span>`:''}
      ${rew&&!done?`<span class="fp-node-rew">🎁</span>`:''}
    </button><div class="fp-node-num">${n+1}</div></div>`;
  }
  html+=`<div class="fp-chapter final${cur>=NODES?'':' locked'}"><span>👑</span>${L('Финал: ты — Легенда','Finale: you are a Legend')}</div></div>`;
  host.innerHTML=html;
  host.querySelectorAll('.fp-node').forEach(b=>b.onclick=()=>{
    const n=+b.dataset.n;
    if(n>cur){toast(L('🔒 Сначала пройди предыдущие этапы','🔒 Complete previous stages first'));return;}
    openNodeSheet(n);
  });
  setTimeout(()=>host.querySelector('.fp-node.cur')?.scrollIntoView({block:'center',behavior:'smooth'}),120);
}
function openNodeSheet(n){
  const plan=nodePlan(n),rew=REWARDS[n+1],done=pathDone(n);
  const xpR=plan.boss?100:30+n*2;
  sheet(`<div class="fp-ns-head ${plan.boss?'boss':''}"><div class="fp-ns-ico">${plan.boss?'⚔️':CHAPTERS[Math.floor(n/10)].e}</div>
    <div><div class="fp-ns-t">${esc(plan.title)}</div><div class="fp-ns-s">${plan.boss?L('Испытание главы — объём выше обычного','Chapter trial — higher volume'):L('Выполни минимум 70% плана, чтобы пройти этап','Complete at least 70% to pass')}</div></div></div>
    <div class="fp-ns-steps">${plan.steps.map((s,i)=>`<div class="fp-ns-step"><span class="fp-ns-i">${i+1}</span><span class="fp-ns-e">${EX[s.ex].emoji}</span><span class="fp-ns-n">${esc(EX[s.ex].name)}</span><b>${stepTxt(s)}</b></div>`).join('')}</div>
    <div class="fp-ns-rew"><span>⚡ +${xpR} XP</span>${rew?`<span>🎁 ${rewardLabel(rew)}</span>`:''}${done?`<span>${'★'.repeat(P.path[n])}${'☆'.repeat(3-P.path[n])}</span>`:''}</div>
    <div class="fp-ns-stars">★★★ — 100% · ★★ — 85% · ★ — 70%</div>
    <button class="fp-cta" id="fpNodeGo">${done?L('🔁 Перепройти на 3 звезды','🔁 Replay for 3 stars'):L('▶ Начать этап','▶ Start stage')}</button>`);
  $('fpNodeGo').onclick=()=>{closeSheet();startGuided(plan);};
}

// ───────────────────────── ГИД-РЕЖИМ (последовательная тренировка) ─────────────────────────
let G=null; // {plan, idx, results:[], savedGoal, resting, restLeft, restInt, stepDone}
let suppressReset=false;
const _speak=window.speak;
window.speak=function(txt,u){if(suppressReset&&/Сброшено|Reset/.test(String(txt)))return;return _speak(txt,u);};

function applyStep(i){
  const st=G.plan.steps[i];G.idx=i;G.stepDone=false;
  suppressReset=true;const tt=window.toast;window.toast=()=>{};
  try{setEx(st.ex);}finally{window.toast=tt;suppressReset=false;}
  const dm=$('demoOv');if(dm&&isRunning)dm.style.display='none';
  goalReps=st.reps;const gi=$('goalInput');if(gi)gi.value=goalReps;
  updProgress();renderStrip();
}
function startGuided(plan){
  if(isRunning)stopAll();
  G={plan,idx:0,results:[],savedGoal:goalReps,resting:false};
  openTab('train');
  applyStep(0);
  toast(`${plan.emoji||'🗺️'} ${plan.title}: ${plan.steps.length} ${L('упр.','exercises')}`);
  setTimeout(()=>$('startBtn')?.click(),250);
}
function renderStrip(){
  let el=$('fpStrip');
  if(!G){if(el)el.remove();return;}
  if(!el){el=document.createElement('div');el.id='fpStrip';el.className='fp-strip';const tab=$('tab-train');tab.insertBefore(el,tab.firstChild);}
  const st=G.plan.steps[G.idx];
  el.innerHTML=`<div class="fp-strip-top"><div class="fp-strip-t">${G.plan.kind==='path'?'🗺️':(G.plan.emoji||'🔥')} ${esc(G.plan.title)}</div>
    <div class="fp-strip-btns"><button id="fpSkipStep">${L('Пропустить','Skip')} ⏭</button><button id="fpEndG">✕</button></div></div>
    <div class="fp-strip-steps">${G.plan.steps.map((s,i)=>`<div class="fp-ss${i<G.idx?' done':i===G.idx?' cur':''}"><span>${EX[s.ex].emoji}</span><b>${stepTxt(s)}</b></div>`).join('')}</div>
    <div class="fp-strip-now">${L('Сейчас','Now')}: <b>${EX[st.ex].emoji} ${esc(EX[st.ex].name)} ${stepTxt(st)}</b> · ${L('шаг','step')} ${G.idx+1}/${G.plan.steps.length}</div>`;
  $('fpSkipStep').onclick=()=>{if(!G)return;if(G.resting){endRest();return;}recordStep();nextOrFinish();};
  $('fpEndG').onclick=()=>{if(!G)return;if(isRunning)stopAll();else{G=null;renderStrip();}};
}
function curCount(){return EX[currentEx]?.isPlank?Math.floor(plankTime):repCount;}
function recordStep(){
  if(!G||G.results[G.idx])return;
  const st=G.plan.steps[G.idx];
  G.results[G.idx]={ex:st.ex,target:st.reps,done:Math.min(curCount(),st.reps*3)};
}
function nextOrFinish(){
  if(!G)return;
  if(G.idx>=G.plan.steps.length-1){if(isRunning)stopAll();else finishGuidedNoSession();return;}
  if(isRunning&&curCount()>0)saveSet(true);
  if(isRunning)startRest();else applyStep(G.idx+1);
}
function startRest(){
  G.resting=true;isPaused=true;
  const next=G.plan.steps[G.idx+1];
  G.restLeft=restSec();
  let ov=$('fpRest');
  if(!ov){ov=document.createElement('div');ov.id='fpRest';ov.className='fp-rest';document.querySelector('.video-box').appendChild(ov);}
  const draw=()=>{
    const len=2*Math.PI*52,p=G.restLeft/restSec();
    ov.innerHTML=`<div class="fp-rest-in"><div class="fp-rest-lbl">${L('ОТДЫХ','REST')}</div>
      <div class="fp-rest-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,.15)" stroke-width="8" fill="none"/><circle cx="60" cy="60" r="52" stroke="var(--primary)" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="${len}" stroke-dashoffset="${len*(1-p)}" transform="rotate(-90 60 60)" style="transition:stroke-dashoffset 1s linear"/></svg><div class="fp-rest-num">${G.restLeft}</div></div>
      <div class="fp-rest-next">${L('Далее','Next')}: ${EX[next.ex].emoji} <b>${esc(EX[next.ex].name)} ${stepTxt(next)}</b></div>
      <div class="fp-rest-btns"><button id="fpRestPlus">+15${L('с','s')}</button><button id="fpRestSkip" class="pri">${L('Поехали','Go')} ▶</button></div></div>`;
    $('fpRestPlus').onclick=()=>{G.restLeft+=15;draw();};
    $('fpRestSkip').onclick=endRest;
  };
  ov.style.display='flex';draw();
  speak(L(`Отлично! Отдых ${G.restLeft} секунд. Далее: ${EX[next.ex].nameRu}`,`Great! Rest ${G.restLeft} seconds. Next: ${EX[next.ex].nameEn}`),'coach');
  clearInterval(G.restInt);
  G.restInt=setInterval(()=>{
    if(!G){return;}
    G.restLeft--;
    if(G.restLeft<=3&&G.restLeft>0)beep(700,.1,.35);
    if(G.restLeft<=0){endRest();return;}
    draw();
  },1000);
  const pb=$('pauseBtn');if(pb)pb.disabled=true;
}
function endRest(){
  if(!G)return;clearInterval(G.restInt);G.resting=false;
  const ov=$('fpRest');if(ov)ov.style.display='none';
  applyStep(G.idx+1);
  isPaused=false;
  const pb=$('pauseBtn');if(pb){pb.disabled=!isRunning;pb.textContent=L('⏸️ Пауза','⏸️ Pause');}
  const st=G.plan.steps[G.idx];
  beep(900,.25,.5);
  speak(L(`Поехали! ${EX[st.ex].nameRu}, ${st.reps}${st.ex==='plank'?' секунд':''}`,`Go! ${EX[st.ex].nameEn}, ${st.reps}`),'!');
}
function finishGuidedNoSession(){const g=G;G=null;renderStrip();if(g)showSummary(null,g);}

// цель шага выполнена → дальше
const _updProgress=window.updProgress;
window.updProgress=function(){
  const was=goalAchieved;_updProgress();
  if(G&&!G.stepDone&&!was&&goalAchieved&&isRunning&&!G.resting){
    G.stepDone=true;recordStep();
    setTimeout(()=>{if(G&&isRunning)nextOrFinish();},1300);
  }
};

// ───────────────────────── СЕССИЯ И ИТОГИ ─────────────────────────
let S=null;
const _startSes=window.startSes;
window.startSes=function(){
  _startSes();
  S={t0:Date.now(),xp0:totalXP(),vol0:totalVolume,cal0:caloriesBurned,pr0:{...prRecords},per:{},plank:0,lvl0:lvl,rings0:ringVals()};
  document.body.classList.add('fp-live');
  setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),300);
};
const _addRep=window.addRep;
window.addRep=function(){
  const before=repCount;_addRep();
  if(repCount>before){day().reps++;if(S)S.per[currentEx]=(S.per[currentEx]||0)+1;saveP();}
};
const _addPlankT=window.addPlankT;
window.addPlankT=function(dt){
  _addPlankT(dt);
  if(EX[currentEx]?.isPlank&&isRunning){const d=day();d.plank=(d.plank||0)+dt;if(S){S.plank+=dt;S.per.plank=(S.per.plank||0)+dt;}}
};
const _addXP=window.addXP;
window.addXP=function(a){const b=totalXP();_addXP(a);const g=totalXP()-b;if(g>0){day().xp+=g;saveP();}renderHeaderStats();};
const _updateDayStreak=window.updateDayStreak;
window.updateDayStreak=function(){
  const before=dayStreak,was=lastWorkoutDate;_updateDayStreak();
  if(dayStreak>before&&was!==todayKey()&&dayStreak%7===0&&P.shields<3){P.shields++;saveP();toast(L('🛡️ +1 щит серии за 7 дней подряд!','🛡️ +1 streak shield for 7 days in a row!'),3500);}
  renderHeaderStats();
};
const _stopAll=window.stopAll;
window.stopAll=function(){
  const sess=S;S=null;
  if(G){clearInterval(G.restInt);const ov=$('fpRest');if(ov)ov.style.display='none';if(!G.resting)recordStep();}
  const g=G;G=null;
  const hadWork=!!sess&&(totalVolume>sess.vol0||sess.plank>=1);
  const tt=window.toast;if(hadWork&&repCount===0&&plankTime<1)window.toast=()=>{};
  try{_stopAll();}finally{window.toast=tt;}
  document.body.classList.remove('fp-live');
  if(sess&&hadWork){
    const secs=Math.round((Date.now()-sess.t0)/1000);
    const d=day();d.secs+=Math.min(secs,3*3600);d.workouts++;saveP();
    if(repCount===0&&plankTime<1){ // гид завершился на шаге без повторов — серию всё равно засчитываем
      updateDayStreak();recordWorkoutDate();publishToCloud(true);
    }
  }
  if(g){goalReps=g.savedGoal;const gi=$('goalInput');if(gi)gi.value=goalReps;save();}
  renderStrip();
  if(sess&&hadWork)setTimeout(()=>showSummary(sess,g),400);
  renderHeaderStats();
};

function grade(r){if(r>=1)return['S','#facc15'];if(r>=.85)return['A','#22c55e'];if(r>=.6)return['B','#38bdf8'];return['C','#a78bfa'];}
function showSummary(sess,g){
  const now=Date.now();
  const secs=sess?Math.round((now-sess.t0)/1000):0;
  const reps=sess?totalVolume-sess.vol0:0;
  const kcal=sess?Math.max(0,Math.round(caloriesBurned-sess.cal0)):0;
  const extra=[];let ratio=null;
  // Итоги плана
  if(g){
    const res=g.plan.steps.map((s,i)=>g.results[i]||{ex:s.ex,target:s.reps,done:0});
    ratio=res.reduce((a,r)=>a+Math.min(1,r.done/r.target),0)/res.length;
    if(g.plan.kind==='daily'&&ratio>=0.7&&!day().plan){
      day().plan=true;saveP();const b=60+LVI()*20;addXP(b);extra.push(`✅ ${L('Тренировка дня выполнена','Workout of the day complete')} <b>+${b} XP</b>`);
    }
    if(g.plan.kind==='path'){
      const n=g.plan.node,stars=ratio>=1?3:ratio>=.85?2:ratio>=.7?1:0,prev=P.path[n]||0;
      if(stars>0){
        if(stars>prev){P.path[n]=stars;}
        if(!prev){
          const b=g.plan.boss?100:30+n*2;addXP(b);
          extra.push(`🗺️ ${L(`Этап ${n+1} пройден`,`Stage ${n+1} cleared`)} ${'★'.repeat(stars)}${'☆'.repeat(3-stars)} <b>+${b} XP</b>`);
          const rew=REWARDS[n+1];
          if(rew&&!isUnlocked(rew.v)){P.unlocked.push(rew.v);if(rew.type==='emoji'&&!EMOJIS.includes(rew.v))EMOJIS.push(rew.v);extra.push(`🎁 ${L('Награда открыта','Reward unlocked')}: <b>${rewardLabel(rew)}</b>`);buildThemeGrid();}
          if((n+1)%10===0)extra.push(`🏅 ${L('Новый титул','New title')}: <b>${L(CHAPTERS[n/10|0].title.ru,CHAPTERS[n/10|0].title.en)}</b>`);
        }else if(stars>prev)extra.push(`⭐ ${L(`Этап ${n+1}: улучшено до`,`Stage ${n+1}: improved to`)} ${'★'.repeat(stars)}`);
        saveP();
      }else extra.push(`💪 ${L(`Этап ${n+1}: выполнено ${Math.round(ratio*100)}% — нужно 70%. Ещё чуть-чуть!`,`Stage ${n+1}: ${Math.round(ratio*100)}% done — 70% needed. Almost!`)}`);
    }
  }
  // Рекорды
  if(sess)Object.keys(prRecords).forEach(k=>{if((prRecords[k]||0)>(sess.pr0[k]||0))extra.push(`🏆 ${L('Новый рекорд','New record')}: ${EX[k]?.emoji||''} ${esc(EX[k]?.name||k)} — <b>${prRecords[k]}</b>${sess.pr0[k]?` (${L('было','was')} ${sess.pr0[k]})`:''}`);});
  // Кольца
  const v=ringVals();
  if(v.pm>=1&&v.pt>=1&&v.px>=1&&!P.claims[todayKey()]){P.claims[todayKey()]=1;saveP();addXP(50);extra.push(`💫 ${L('Все кольца закрыты!','All rings closed!')} <b>+50 XP</b>`);}
  HOOKS.summary.forEach(f=>{try{f(extra,sess,g);}catch(e){console.error(e);}});
  const xpG=sess?Math.max(0,Math.round(totalXP()-sess.xp0)):0;
  if(ratio===null)ratio=goalReps>0?Math.min(1,(reps||Math.floor(sess?.plank||0))/goalReps):1;
  const [gr,gc]=grade(ratio);
  const titles={S:L('Безупречно!','Flawless!'),A:L('Отличная работа!','Great job!'),B:L('Хорошая тренировка!','Good workout!'),C:L('Каждый шаг важен!','Every step counts!')};
  const mm=Math.floor(secs/60),ss=secs%60;
  const perRows=sess?Object.entries(sess.per).map(([k,n])=>`<div class="fp-sum-row"><span>${EX[k]?.emoji||''} ${esc(EX[k]?.name||k)}</span><b>${k==='plank'?Math.floor(n)+' '+L('сек','sec'):n+' '+L('повт.','reps')}</b></div>`).join(''):'';
  const data={gr,gc,title:titles[gr],time:`${mm}:${String(ss).padStart(2,'0')}`,reps,kcal,xpG,streak:dayStreak,name:userName,plan:g?.plan?.title||L('Свободная тренировка','Free workout')};
  sheet(`<div class="fp-sum">
    <div class="fp-sum-grade" style="--gc:${gc}">${gr}</div>
    <div class="fp-sum-t">${titles[gr]}</div>
    <div class="fp-sum-s">${esc(data.plan)}</div>
    <div class="fp-sum-stats">
      <div><b>${data.time}</b><span>${L('время','time')}</span></div>
      <div><b>${reps||Math.floor(sess?.plank||0)}</b><span>${reps?L('повторов','reps'):L('сек планки','plank sec')}</span></div>
      <div><b>${kcal}</b><span>${L('ккал','kcal')}</span></div>
      <div><b>+${xpG}</b><span>XP</span></div>
    </div>
    ${perRows?`<div class="fp-sum-list">${perRows}</div>`:''}
    ${extra.length?`<div class="fp-sum-extra">${extra.map(x=>`<div>${x}</div>`).join('')}</div>`:''}
    <div class="fp-sum-rings">${ringsSVG(v,74,8)}<div><div class="fp-sum-rt">${L('Кольца дня','Daily rings')}</div><div class="fp-sum-rs">${Math.round(v.pm*100)}% · ${Math.round(v.pt*100)}% · ${Math.round(v.px*100)}%</div><div class="fp-sum-rs">🔥 ${L('Серия','Streak')}: ${dayStreak} · 🛡️ ${P.shields}</div></div></div>
    <div class="fp-sum-btns"><button class="fp-cta ghost" id="fpShareCard">📸 ${L('Карточка','Share card')}</button><button class="fp-cta" id="fpSumOk">${L('Готово','Done')}</button></div>
  </div>`,'fp-sheet-sum');
  if(gr==='S'||extra.length)confetti(2500);
  $('fpSumOk').onclick=()=>{closeSheet();openTab('home');};
  $('fpShareCard').onclick=()=>shareCard(data);
  renderHeaderStats();
}

// ───────────────────────── КАРТОЧКА ДЛЯ СТОРИС ─────────────────────────
async function shareCard(d){
  const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const cs=getComputedStyle(document.body),p1=cs.getPropertyValue('--primary').trim()||'#a855f7',p2=cs.getPropertyValue('--secondary').trim()||'#7c3aed';
  const bg=x.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#0b0618');bg.addColorStop(1,'#1d0b3a');x.fillStyle=bg;x.fillRect(0,0,W,H);
  const gl=x.createRadialGradient(W*.8,H*.15,0,W*.8,H*.15,600);gl.addColorStop(0,p1+'88');gl.addColorStop(1,'transparent');x.fillStyle=gl;x.fillRect(0,0,W,H);
  x.fillStyle='#fff';x.font='900 64px Inter,Arial';x.fillText('💪 FitPulse',80,140);
  x.font='600 38px Inter,Arial';x.fillStyle='rgba(255,255,255,.65)';x.fillText(new Date().toLocaleDateString(currentLang==='en'?'en-US':'ru-RU',{day:'numeric',month:'long'}),80,200);
  x.beginPath();x.arc(W/2,470,170,0,Math.PI*2);x.strokeStyle=d.gc;x.lineWidth=18;x.stroke();
  x.fillStyle=d.gc;x.font='900 230px Inter,Arial';x.textAlign='center';x.fillText(d.gr,W/2,550);
  x.fillStyle='#fff';x.font='800 70px Inter,Arial';x.fillText(d.title,W/2,760);
  x.font='500 40px Inter,Arial';x.fillStyle='rgba(255,255,255,.7)';x.fillText(d.plan,W/2,820);
  const st=[[d.time,L('время','time')],[String(d.reps),L('повторов','reps')],[String(d.kcal),L('ккал','kcal')],['+'+d.xpG,'XP']];
  st.forEach((s,i)=>{const cx=80+i*(W-160)/4+(W-160)/8;
    x.fillStyle='rgba(255,255,255,.08)';x.beginPath();x.roundRect(cx-110,900,220,190,30);x.fill();
    x.fillStyle='#fff';x.font='900 64px Inter,Arial';x.fillText(s[0],cx,1000);x.font='500 32px Inter,Arial';x.fillStyle='rgba(255,255,255,.6)';x.fillText(s[1],cx,1050);});
  const grd=x.createLinearGradient(0,0,W,0);grd.addColorStop(0,p1);grd.addColorStop(1,p2);x.fillStyle=grd;x.beginPath();x.roundRect(80,1150,W-160,110,55);x.fill();
  x.fillStyle='#fff';x.font='800 44px Inter,Arial';x.fillText(`🔥 ${d.streak} ${L('дн. подряд','day streak')} · ${d.name}`,W/2,1222);
  x.textAlign='left';
  const blob=await new Promise(r=>c.toBlob(r,'image/png'));
  const file=new File([blob],'fitpulse.png',{type:'image/png'});
  const text=L(`Моя тренировка в FitPulse: оценка ${d.gr}, ${d.reps} повторов 💪 `,`My FitPulse workout: grade ${d.gr}, ${d.reps} reps 💪 `)+APP_URL;
  try{
    if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],text});return;}
  }catch(e){if(e.name==='AbortError')return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='fitpulse.png';a.click();
  toast(L('📸 Карточка сохранена','📸 Card saved'));
}

// ───────────────────────── ТИТУЛ В ПРОФИЛЕ ─────────────────────────
const _updateLvlUI=window.updateLvlUI;
window.updateLvlUI=function(){
  _updateLvlUI();
  let best=-1;for(let c=0;c<4;c++)if(pathDone(c*10+9))best=c;
  const el=$('profileTitle');if(!el)return;
  let b=$('fpTitleBadge');
  if(best<0){if(b)b.remove();return;}
  if(!b){b=document.createElement('div');b.id='fpTitleBadge';b.className='fp-title-badge';el.after(b);}
  b.textContent='🏅 '+L(CHAPTERS[best].title.ru,CHAPTERS[best].title.en);
};

// ───────────────────────── ЯЗЫК ─────────────────────────
const _applyLanguage=window.applyLanguage;
window.applyLanguage=function(lang){
  _applyLanguage(lang);
  if($('fpNav')){buildNav();if(curTab==='home')renderHome();if(curTab==='path')renderPath();renderStrip();}
};

// ───────────────────────── ИНИЦИАЛИЗАЦИЯ ─────────────────────────
function mountTabs(){
  if($('tab-home'))return; // разметка 2.0 уже в index.html
  const app=document.querySelector('.app');
  const home=document.createElement('div');home.className='tab-content';home.id='tab-home';
  home.innerHTML='<div id="fpHomeHost"></div><div id="fpQuestHost"></div>';
  const path=document.createElement('div');path.className='tab-content';path.id='tab-path';
  path.innerHTML='<div id="fpPathHost"></div>';
  const train=$('tab-train');
  app.insertBefore(home,train);app.appendChild(path);
  train.classList.remove('active');
  // Календарь серии переезжает в профиль — на «Тренировке» остаётся только тренировка
  const banner=$('dayStreakBanner'),prof=$('tab-profile');
  if(banner&&prof)prof.insertBefore(banner,prof.children[1]||null);
}
document.addEventListener('DOMContentLoaded',()=>{
  // старт script.js уже отработал (зарегистрирован раньше)
  mountTabs();buildNav();buildThemeGrid();
  const want=new URLSearchParams(location.search).get('tab');
  openTab(want&&$('tab-'+want)?want:'home');
  if(shieldSavedMsg)setTimeout(()=>{toast(L(`🛡️ Щит спас твою серию в ${shieldSavedMsg.streak} дн.!`,`🛡️ A shield saved your ${shieldSavedMsg.streak}-day streak!`),4500);},1200);
  document.body.classList.add('fp-ready');
  setTimeout(()=>{bootQuiet=false;},300);
});
// для отладки/тестов
window.FP={HOOKS,L,esc,sheet,closeSheet,saveP,day,todayKey,keyOffset,ringsSVG,renderHome,get curTab(){return curTab;},get P(){return P;},startGuided,dailyPlan,nodePlan,showSummary,ringVals,get G(){return G;}};
})();
