'use strict';
// ============================================================
//  FitPulse 2.1 — «Пульс+»
//   • Пульсик — питомец, который растёт от твоих тренировок
//   • Бой с тенью — соревнуйся со своим лучшим подходом в реальном времени
//   • Итоги месяца — сторис в стиле Wrapped
//   • Бит — встроенная музыка-метроном для тренировки
//   • Конструктор — собери свою тренировку и запускай в гид-режиме
// ============================================================
(function(){
const F=window.FP;if(!F)return;
const {L,esc,sheet,closeSheet,saveP,day,todayKey}=F;
const $=id=>document.getElementById(id);
const P=()=>F.P;

// ───────────────────────── ПУЛЬСИК ─────────────────────────
const STAGES=[
  {at:0,e:'🥚',img:'egg',ru:'Яйцо',en:'Egg'},
  {at:40,e:'🐣',img:'hatchling',ru:'Малыш',en:'Hatchling'},
  {at:200,e:'🐥',img:'chick',ru:'Птенец',en:'Chick'},
  {at:600,e:'🦅',img:'eagle',ru:'Орёл',en:'Eagle'},
  {at:1500,e:'🐉',img:'dragon',ru:'Дракон',en:'Dragon'},
  {at:4000,e:'🐦‍🔥',img:'phoenix',ru:'Феникс',en:'Phoenix'},
];
const petSrc=i=>`pets/${STAGES[i].img}.webp`;
const petImg=(i,cls='fpp-inl')=>`<img class="${cls}" src="${petSrc(i)}" alt="${STAGES[i].ru}" draggable="false">`;
// предзагрузка, чтобы смена формы была мгновенной
STAGES.forEach((_,i)=>{const im=new Image();im.src=petSrc(i);});
function pet(){const p=P();return p.pet||(p.pet={name:L('Пульсик','Pulsy'),food:0,born:Date.now(),last:0});}
function stageOf(food){let i=0;STAGES.forEach((s,k)=>{if(food>=s.at)i=k;});return i;}
function mood(){
  const pt=pet();const h=pt.last?(Date.now()-pt.last)/3600000:999;
  if(h<20)return{k:'happy',face:'😄',ru:'Сытый и счастливый!',en:'Full and happy!'};
  if(h<44)return{k:'ok',face:'🙂',ru:'Немного проголодался',en:'Getting a bit hungry'};
  if(h<999)return{k:'sad',face:'🥺',ru:'Скучает… потренируйся, чтобы накормить',en:'Misses you… train to feed me'};
  return{k:'new',face:'✨',ru:'Сделай первые повторения — и я вылуплюсь!',en:'Do your first reps and I will hatch!'};
}
const PHRASES={ru:['Ещё 10 повторений — и я подрасту!','Ты мой герой 💪','Хрум-хрум, вкусные повторения!','Пойдём тренироваться?','Я чувствую силу!','Не бросай меня, тренируйся каждый день 🥺'],
  en:['10 more reps and I grow!','You are my hero 💪','Yum, tasty reps!','Shall we train?','I feel the power!','Train every day, don’t leave me 🥺']};
function feed(n){const pt=pet();pt.food+=n;pt.last=Date.now();}
function petCard(){
  const pt=pet(),si=stageOf(pt.food),st=STAGES[si],nx=STAGES[si+1],m=mood();
  const pct=nx?Math.min(100,(pt.food-st.at)/(nx.at-st.at)*100):100;
  return `<div class="fp-card fpp-pet mood-${m.k}" id="fppPet">
    <div class="fpp-pet-stage"><img class="fpp-pet-e" id="fppPetE" src="${petSrc(si)}" alt="${L(st.ru,st.en)}" draggable="false"><div class="fpp-pet-shadow"></div></div>
    <div class="fpp-pet-info">
      <div class="fpp-pet-name"><span id="fppPetName">${esc(pt.name)}</span> <small>${L(st.ru,st.en)} · ${m.face}</small></div>
      <div class="fpp-pet-bubble" id="fppBubble">${L(m.ru,m.en)}</div>
      <div class="fp-mini-bar"><div style="width:${pct}%"></div></div>
      <div class="fpp-pet-next">${nx?L(`🍖 ${pt.food} / ${nx.at} до формы «${nx.ru}»`,`🍖 ${pt.food} / ${nx.at} to “${nx.en}”`):L('🏆 Максимальная форма!','🏆 Final form!')}</div>
    </div></div>`;
}
function bindPet(){
  const e=$('fppPetE');if(!e)return;
  e.onclick=()=>{
    e.classList.remove('jump');void e.offsetWidth;e.classList.add('jump');
    const arr=PHRASES[currentLang]||PHRASES.ru;$('fppBubble').textContent=arr[Math.floor(Math.random()*arr.length)];
    beep(900+Math.random()*400,.06,.2);if(navigator.vibrate)navigator.vibrate(15);
    spawnHeart(e);
  };
  $('fppPetName').onclick=()=>{
    const n=prompt(L('Как назовёшь питомца?','Name your pet:'),pet().name);
    if(n&&n.trim()){pet().name=n.trim().slice(0,16);saveP();F.renderHome();}
  };
}
function spawnHeart(el){
  const h=document.createElement('span');h.className='fpp-heart';h.textContent=['💜','❤️','✨','💪'][Math.floor(Math.random()*4)];
  h.style.left=(30+Math.random()*40)+'%';el.parentNode.appendChild(h);setTimeout(()=>h.remove(),1000);
}

// ───────────────────────── БОЙ С ТЕНЬЮ ─────────────────────────
let setStart=0,setTimes=[],ghostInt=null,lastLead=null,ghostBeaten=false;
function ghostOf(ex){return (P().ghost||{})[ex]||null;}
function saveGhostIfBetter(){
  if(!setTimes.length||EX[currentEx]?.isPlank)return;
  const p=P();p.ghost=p.ghost||{};
  const g=p.ghost[currentEx];
  if(!g||setTimes.length>g.length){if(g)ghostBeaten=true;p.ghost[currentEx]=setTimes.slice(0,300);saveP();}
}
function ghostBadge(){
  let b=$('fppGhost');
  if(!b){b=document.createElement('div');b.id='fppGhost';b.className='fpp-ghost';document.querySelector('.video-box')?.appendChild(b);}
  return b;
}
function tickGhost(){
  const b=ghostBadge();
  const g=ghostOf(currentEx);
  if(!isRunning||EX[currentEx]?.isPlank||!g||isPaused){b.style.display='none';return;}
  const el=Date.now()-setStart;
  let gc=0;while(gc<g.length&&g[gc]<=el)gc++;
  const diff=repCount-gc;
  b.style.display='flex';
  b.className='fpp-ghost '+(diff>0?'lead':diff<0?'behind':'tie');
  b.innerHTML=`<span>👻 ${gc}</span><b>${diff>0?'▲'+diff:diff<0?'▼'+(-diff):'='}</b><span>${L('Ты','You')} ${repCount}</span>`;
  const lead=diff>0?1:diff<0?-1:0;
  if(lastLead!==null&&lead!==lastLead&&repCount>2){
    if(lead===1)coachCue('ghost_lead',L('Ты обгоняешь свою тень!','You are ahead of your ghost!'),'good',8000);
    else if(lead===-1)coachCue('ghost_behind',L('Тень впереди — ускорься!','Ghost is ahead — speed up!'),'warn',8000);
  }
  lastLead=lead;
}
const _startSes=window.startSes;
window.startSes=function(){_startSes();ghostBeaten=false;setStart=Date.now();setTimes=[];lastLead=null;clearInterval(ghostInt);ghostInt=setInterval(tickGhost,250);startBeat();petStage0=stageOf(pet().food);};
const _resetReps=window.resetReps;
window.resetReps=function(){if(isRunning)saveGhostIfBetter();_resetReps();setStart=Date.now();setTimes=[];lastLead=null;};
const _addRep=window.addRep;
window.addRep=function(){
  const before=repCount;_addRep();
  if(repCount>before){
    setTimes.push(Date.now()-setStart);
    feed(1);
    const d=day();d.ex=d.ex||{};d.ex[currentEx]=(d.ex[currentEx]||0)+1;
    saveP();
  }
};
let plankFeedBuf=0;
const _addPlankT=window.addPlankT;
window.addPlankT=function(dt){
  _addPlankT(dt);
  if(EX[currentEx]?.isPlank&&isRunning){
    plankFeedBuf+=dt;const d=day();d.ex=d.ex||{};d.ex.plank=(d.ex.plank||0)+dt;
    if(plankFeedBuf>=3){feed(Math.floor(plankFeedBuf/3));plankFeedBuf%=3;saveP();}
  }
};
let petStage0=0;
const _stopAll=window.stopAll;
window.stopAll=function(){
  if(isRunning)saveGhostIfBetter();
  clearInterval(ghostInt);const b=$('fppGhost');if(b)b.style.display='none';
  stopBeat();
  _stopAll();
};
const _pauseAll=window.pauseAll;
window.pauseAll=function(){_pauseAll();isPaused?stopBeat():startBeat();};
F.HOOKS.summary.push((extra,sess)=>{
  if(!sess)return;
  const s=stageOf(pet().food);
  if(s>petStage0){extra.push(`${petImg(s)} 🎉 ${esc(pet().name)} ${L('эволюционировал','evolved into')}: <b>${L(STAGES[s].ru,STAGES[s].en)}</b>`);bRecord();}
  else extra.push(`${petImg(s)} ${esc(pet().name)} ${L('накормлен','is fed')} 🍖 ${pet().food}`);
  if(ghostBeaten)extra.push(`👻 ${L('Тень побеждена — новый эталон подхода','Ghost beaten — new benchmark set')}`);
});

// ───────────────────────── БИТ (музыка тренировки) ─────────────────────────
let beatOn=localStorage.getItem('fp_beat')==='1',beatTimer=null,beatStep=0,nextT=0;
const BPM={pushup:100,squat:110,lunge:105,situp:100,burpee:128,plank:90,pullup:96};
function ctx(){return aC();}
function drum(type,t){
  const c=ctx(),g=c.createGain();g.connect(c.destination);
  if(type==='kick'){const o=c.createOscillator();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(40,t+.12);g.gain.setValueAtTime(.32,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);o.connect(g);o.start(t);o.stop(t+.2);}
  else if(type==='hat'){const b=c.createBuffer(1,c.sampleRate*.04,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type='highpass';f.frequency.value=7000;s.connect(f);f.connect(g);g.gain.value=.08;s.start(t);}
  else if(type==='snare'){const b=c.createBuffer(1,c.sampleRate*.12,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=1800;s.connect(f);f.connect(g);g.gain.value=.14;s.start(t);}
  else{const o=c.createOscillator();o.type='triangle';o.frequency.value=type;g.gain.setValueAtTime(.07,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);o.connect(g);o.start(t);o.stop(t+.24);}
}
const BASS=[55,55,65.4,49];
function schedule(){
  const c=ctx(),spb=60/(BPM[currentEx]||110)/2;
  while(nextT<c.currentTime+.15){
    const s=beatStep%16;
    if(s%4===0)drum('kick',nextT);
    if(s===4||s===12)drum('snare',nextT);
    drum('hat',nextT);
    if(s%4===2)drum(BASS[Math.floor(beatStep/16)%4],nextT);
    nextT+=spb;beatStep++;
  }
}
function startBeat(){
  if(!beatOn||!isRunning||beatTimer)return;
  const c=ctx();if(c.state==='suspended')c.resume();
  nextT=c.currentTime+.05;beatStep=0;beatTimer=setInterval(schedule,50);
}
function stopBeat(){clearInterval(beatTimer);beatTimer=null;}
function mountBeatBtn(){
  const row=document.querySelector('.controls-wrap .btns-row');if(!row||$('fppBeatBtn'))return;
  const b=document.createElement('button');b.className='btn-sec'+(beatOn?' fpp-on':'');b.id='fppBeatBtn';
  const lbl=()=>b.textContent=(beatOn?'🎵 ':'🔇 ')+L('Бит','Beat');lbl();
  b.onclick=()=>{beatOn=!beatOn;localStorage.setItem('fp_beat',beatOn?'1':'0');b.classList.toggle('fpp-on',beatOn);lbl();if(beatOn)startBeat();else stopBeat();toast(beatOn?L('🎵 Бит включён — ритм под упражнение','🎵 Beat on — tempo matches exercise'):L('🔇 Бит выключен','🔇 Beat off'));};
  row.appendChild(b);
}

// ───────────────────────── ИТОГИ МЕСЯЦА ─────────────────────────
const MONTHS_RU=['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
const MONTHS_RU_GEN=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MONTHS_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
function wrapOffset(){return new Date().getDate()===1?-1:0;}
function wrapMode(){return localStorage.getItem('fp_wrap_mode')||'auto';}
function wrapVisible(){const m=wrapMode();if(m==='hide')return false;if(m==='show')return true;return new Date().getDate()===1;}
function monthStats(off=wrapOffset()){
  const now=new Date();now.setDate(1);now.setMonth(now.getMonth()+off);const pre=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const dates=new Set(getWorkoutDates().filter(d=>d.startsWith(pre)));
  let reps=0,secs=0,xpS=0,best=null,ex={};
  Object.entries(P().days).forEach(([k,d])=>{
    if(!k.startsWith(pre))return;
    reps+=d.reps||0;secs+=d.secs||0;xpS+=d.xp||0;
    if(d.reps||d.secs)dates.add(k);
    if(!best||(d.reps||0)>best.reps)best={k,reps:d.reps||0};
    Object.entries(d.ex||{}).forEach(([e,n])=>ex[e]=(ex[e]||0)+n);
  });
  const fav=Object.entries(ex).filter(([e])=>e!=='plank').sort((a,b)=>b[1]-a[1])[0];
  return{m:now.getMonth(),days:dates.size,reps,mins:Math.round(secs/60),xp:Math.round(xpS),best,fav,plank:Math.round(ex.plank||0),stars:Object.values(P().path).reduce((a,b)=>a+b,0)};
}
function wrappedCard(){
  if(!wrapVisible())return'';
  const s=monthStats();if(!s.days&&wrapMode()!=='show')return'';
  const mn=L(MONTHS_RU[s.m],MONTHS_EN[s.m]);
  return `<div class="fp-card fpp-wrap-card" id="fppWrapCard"><div class="fpp-wc-e">📅</div><div style="flex:1"><div class="fpp-wc-t">${L('Твой','Your')} ${mn}${L(' в FitPulse',' in FitPulse')}</div><div class="fpp-wc-s">${L(`${s.days} дн. · ${s.reps} повт. — смотри историю`,`${s.days} days · ${s.reps} reps — watch your story`)}</div></div><div class="fpp-wc-go">▶</div></div>`;
}
function openWrapped(){
  const s=monthStats(),mn=L(MONTHS_RU[s.m],MONTHS_EN[s.m]);
  const bd=s.best&&s.best.reps?new Date(s.best.k+'T00:00:00'):null;
  const slides=[
    {bg:'linear-gradient(160deg,var(--primary),var(--secondary))',html:`<div class="fpp-sl-k">${L('ИТОГИ МЕСЯЦА','MONTH WRAPPED')}</div><div class="fpp-sl-big">${mn}</div><div class="fpp-sl-t">${L('Давай посмотрим, каким он был 👀','Let’s see how it went 👀')}</div>`},
    {bg:'linear-gradient(160deg,var(--secondary),color-mix(in srgb,var(--accent) 80%,#000))',html:`<div class="fpp-sl-k">${L('ДНЕЙ С ТРЕНИРОВКОЙ','TRAINING DAYS')}</div><div class="fpp-sl-big">${s.days}</div><div class="fpp-sl-t">${L('в этом месяце','this month')}</div><div class="fpp-sl-s">${s.days>=20?L('Это уровень машины 🤖','Machine level 🤖'):s.days>=10?L('Отличная регулярность!','Great consistency!'):L('Хорошее начало — дальше больше!','Great start — more to come!')}</div>`},
    {bg:'linear-gradient(160deg,color-mix(in srgb,var(--primary) 85%,#000),var(--accent))',html:`<div class="fpp-sl-k">${L('ВСЕГО','IN TOTAL')}</div><div class="fpp-sl-big">${s.reps}</div><div class="fpp-sl-t">${L('повторений','reps')}</div><div class="fpp-sl-s">⏱ ${s.mins} ${L('мин','min')} · ⚡ ${s.xp} XP${s.plank?` · 🧱 ${s.plank} ${L('сек планки','sec plank')}`:''}</div>`},
    ...(bd?[{bg:'linear-gradient(200deg,var(--accent),color-mix(in srgb,var(--secondary) 70%,#000))',html:`<div class="fpp-sl-k">${L('ЛУЧШИЙ ДЕНЬ','BEST DAY')}</div><div class="fpp-sl-big">${bd.getDate()}</div><div class="fpp-sl-t">${L(MONTHS_RU_GEN[s.m],MONTHS_EN[s.m])}</div><div class="fpp-sl-s">${s.best.reps} ${L('повторений за день 🔥','reps in one day 🔥')}</div>`}]:[]),
    ...(s.fav?[{bg:'radial-gradient(circle at 30% 20%,var(--accent),var(--primary) 55%,color-mix(in srgb,var(--secondary) 60%,#000))',html:`<div class="fpp-sl-k">${L('ЛЮБИМОЕ УПРАЖНЕНИЕ','FAVORITE EXERCISE')}</div><div class="fpp-sl-emoji">${EX[s.fav[0]].emoji}</div><div class="fpp-sl-t">${esc(EX[s.fav[0]].name)}</div><div class="fpp-sl-s">${s.fav[1]} ${L('повторений','reps')}</div>`}]:[]),
    {bg:'linear-gradient(160deg,color-mix(in srgb,var(--secondary) 60%,#000),var(--primary))',html:`<div class="fpp-sl-k">${L('СЕРИЯ И ПИТОМЕЦ','STREAK & PET')}</div>${petImg(stageOf(pet().food),'fpp-sl-pet')}<div class="fpp-sl-t">${esc(pet().name)} · ${L(STAGES[stageOf(pet().food)].ru,STAGES[stageOf(pet().food)].en)}</div><div class="fpp-sl-s">🔥 ${dayStreak} ${L('дн. подряд','day streak')} · ⭐ ${s.stars} ${L('звёзд Пути','path stars')}</div>`},
    {bg:'radial-gradient(circle at 70% 80%,var(--primary),var(--secondary) 60%,color-mix(in srgb,var(--secondary) 50%,#000))',html:`<div class="fpp-sl-k">${L('ВПЕРЕДИ','UP NEXT')}</div><div class="fpp-sl-big" style="font-size:3.2rem">${L('Следующий месяц — твой','Next month is yours')}</div><button class="fp-cta" id="fppWrapShare" style="margin-top:28px;background:#fff;color:#1a1033">📤 ${L('Поделиться итогами','Share my month')}</button>`},
  ];
  const ov=document.createElement('div');ov.className='fpp-story';
  ov.innerHTML=`<div class="fpp-bars">${slides.map(()=>'<i><b></b></i>').join('')}</div><button class="fpp-close" aria-label="Close">${window.FP_XSVG||'✕'}</button><div class="fpp-slide"></div>`;
  document.body.appendChild(ov);
  let i=0,timer=null;
  const show=()=>{
    const sl=slides[i],box=ov.querySelector('.fpp-slide');
    ov.style.background=sl.bg;box.innerHTML=sl.html;box.classList.remove('in');void box.offsetWidth;box.classList.add('in');
    ov.querySelectorAll('.fpp-bars i').forEach((b,k)=>{b.className=k<i?'done':k===i?'cur':'';});
    clearTimeout(timer);if(i<slides.length-1)timer=setTimeout(()=>{i++;show();},4500);
    const sh=$('fppWrapShare');if(sh)sh.onclick=e=>{e.stopPropagation();shareMonth(s,mn);};
    beep(600+i*80,.05,.15);
  };
  ov.onclick=e=>{if(e.target.closest('.fpp-close')){clearTimeout(timer);ov.remove();return;}
    const x=e.clientX/innerWidth;if(x<.3)i=Math.max(0,i-1);else if(i<slides.length-1)i++;else{clearTimeout(timer);ov.remove();return;}show();};
  show();
}
async function shareMonth(s,mn){
  const txt=L(`Мой ${mn} в FitPulse: ${s.days} дней тренировок, ${s.reps} повторений, серия ${dayStreak} дн. 💪 `,`My ${mn} in FitPulse: ${s.days} training days, ${s.reps} reps, ${dayStreak}-day streak 💪 `)+APP_URL;
  try{if(navigator.share){await navigator.share({text:txt});return;}}catch(e){if(e.name==='AbortError')return;}
  try{await navigator.clipboard.writeText(txt);toast(L('📋 Текст скопирован','📋 Copied'));}catch(e){toast(txt,5000);}
}

// ───────────────────────── КОНСТРУКТОР ТРЕНИРОВОК ─────────────────────────
const PICK=['pushup','squat','lunge','situp','plank','burpee','pullup'];
function customs(){return P().custom||(P().custom=[]);}
function myCardHtml(){
  const list=customs();
  return `<div class="card fpp-my" id="fppMy"><div class="card-title">🛠️ ${L('Мои тренировки','My workouts')}</div>
    ${list.length?list.map((w,i)=>`<div class="fpp-my-row"><div class="fpp-my-info"><b>${esc(w.emoji||'🛠️')} ${esc(w.title)}</b><span>${w.steps.map(s=>EX[s.ex].emoji+(s.ex==='plank'?s.reps+L('с','s'):'×'+s.reps)).join('  ')}</span></div>
      <button class="fpp-my-go" data-i="${i}">▶</button><button class="fpp-my-ed" data-i="${i}">✏️</button></div>`).join(''):`<div class="fpp-my-empty">${L('Собери свою тренировку из любых упражнений — и запускай её в гид-режиме с отдыхом и голосом.','Build your own workout from any exercises and run it in guided mode.')}</div>`}
    <button class="m-btn" id="fppNewW" style="margin-top:10px">➕ ${L('Создать тренировку','Create workout')}</button></div>`;
}
function mountMy(){
  const tab=$('tab-programs');if(!tab)return;
  let el=$('fppMy');const html=myCardHtml();
  const tmp=document.createElement('div');tmp.innerHTML=html;const nn=tmp.firstElementChild;
  if(el)el.replaceWith(nn);else tab.insertBefore(nn,tab.firstChild);
  nn.querySelectorAll('.fpp-my-go').forEach(b=>b.onclick=()=>{const w=customs()[+b.dataset.i];F.startGuided({kind:'custom',title:w.title,emoji:w.emoji||'🛠️',steps:w.steps.map(s=>({...s}))});});
  nn.querySelectorAll('.fpp-my-ed').forEach(b=>b.onclick=()=>openBuilder(+b.dataset.i));
  $('fppNewW').onclick=()=>openBuilder(-1);
}
function openBuilder(idx){
  const src=idx>=0?customs()[idx]:{title:L('Моя тренировка','My workout'),emoji:'🛠️',steps:[{ex:'pushup',reps:10},{ex:'squat',reps:15}]};
  const w=JSON.parse(JSON.stringify(src));
  const EMO=['🛠️','🔥','⚡','💪','🦵','🎯','🧘','🚀','🐉','🌙'];
  const draw=()=>{
    const ov=sheet(`<div class="fpp-b">
      <div class="fp-ns-t" style="margin-bottom:12px">${idx>=0?L('Редактировать','Edit'):L('Новая тренировка','New workout')}</div>
      <div class="fpp-b-emo">${EMO.map(e=>`<button class="${e===w.emoji?'on':''}" data-e="${e}">${e}</button>`).join('')}</div>
      <input class="inp fpp-b-name" id="fppBName" maxlength="30" value="${esc(w.title)}">
      <div class="fpp-b-steps">${w.steps.map((s,i)=>`<div class="fpp-b-step"><span class="fp-ns-i">${i+1}</span>
        <select data-i="${i}" class="inp fpp-b-sel">${PICK.map(k=>`<option value="${k}"${k===s.ex?' selected':''}>${EX[k].emoji} ${esc(EX[k].name)}</option>`).join('')}</select>
        <div class="fpp-b-num"><button data-i="${i}" data-d="-1">−</button><b>${s.reps}${s.ex==='plank'?L('с','s'):''}</b><button data-i="${i}" data-d="1">+</button></div>
        <button class="fpp-b-del" data-i="${i}">✕</button></div>`).join('')}</div>
      ${w.steps.length<10?`<button class="m-btn ghost" id="fppBAdd">➕ ${L('Добавить упражнение','Add exercise')}</button>`:''}
      <div class="fp-sum-btns" style="margin-top:14px">${idx>=0?`<button class="fp-cta ghost" id="fppBDel">🗑️ ${L('Удалить','Delete')}</button>`:`<button class="fp-cta ghost" id="fppBCancel">${L('Отмена','Cancel')}</button>`}<button class="fp-cta" id="fppBSave">💾 ${L('Сохранить','Save')}</button></div></div>`);
    const name=ov.querySelector('#fppBName');name.oninput=()=>w.title=name.value;
    ov.querySelectorAll('.fpp-b-emo button').forEach(b=>b.onclick=()=>{w.emoji=b.dataset.e;draw();});
    ov.querySelectorAll('.fpp-b-sel').forEach(s=>s.onchange=()=>{const st=w.steps[+s.dataset.i];st.ex=s.value;st.reps=s.value==='plank'?30:10;draw();});
    ov.querySelectorAll('.fpp-b-num button').forEach(b=>b.onclick=()=>{const st=w.steps[+b.dataset.i],step=st.ex==='plank'?5:1;st.reps=Math.max(step,Math.min(st.ex==='plank'?600:200,st.reps+step*(+b.dataset.d)));draw();});
    ov.querySelectorAll('.fpp-b-del').forEach(b=>b.onclick=()=>{if(w.steps.length>1){w.steps.splice(+b.dataset.i,1);draw();}});
    const add=ov.querySelector('#fppBAdd');if(add)add.onclick=()=>{w.steps.push({ex:'lunge',reps:10});draw();};
    ov.querySelector('#fppBSave').onclick=()=>{
      w.title=(w.title||'').trim()||L('Моя тренировка','My workout');
      if(idx>=0)customs()[idx]=w;else customs().push(w);
      saveP();closeSheet();mountMy();toast(L('💾 Тренировка сохранена','💾 Workout saved'));
    };
    const del=ov.querySelector('#fppBDel');if(del)del.onclick=()=>{if(confirm(L('Удалить тренировку?','Delete workout?'))){customs().splice(idx,1);saveP();closeSheet();mountMy();}};
    const cancel=ov.querySelector('#fppBCancel');if(cancel)cancel.onclick=closeSheet;
  };
  draw();
}
function myHomeChips(){
  const list=customs();if(!list.length)return'';
  return `<div class="fpp-chips">${list.slice(0,6).map((w,i)=>`<button class="fpp-chip" data-i="${i}">${esc(w.emoji||'🛠️')} ${esc(w.title)}</button>`).join('')}</div>`;
}

// ───────────────────────── МОНТАЖ ─────────────────────────
F.HOOKS.home.push(host=>{
  if(!host)return;
  host.innerHTML=petCard()+wrappedCard()+myHomeChips();
  bindPet();
  const wc=$('fppWrapCard');if(wc)wc.onclick=openWrapped;
  host.querySelectorAll('.fpp-chip').forEach(b=>b.onclick=()=>{const w=customs()[+b.dataset.i];F.startGuided({kind:'custom',title:w.title,emoji:w.emoji||'🛠️',steps:w.steps.map(s=>({...s}))});});
});
const _openTab=window.openTab;
window.openTab=function(id){_openTab(id);if(id==='programs')mountMy();};
const _applyLanguage=window.applyLanguage;
window.applyLanguage=function(l){_applyLanguage(l);const b=$('fppBeatBtn');if(b)b.textContent=(beatOn?'🎵 ':'🔇 ')+L('Бит','Beat');if($('fppMy'))mountMy();};
document.addEventListener('DOMContentLoaded',()=>{mountBeatBtn();mountMy();});
window.FPP={openWrapped,openBuilder,monthStats,pet,STAGES,petSrc,wrapMode,setWrapMode:m=>{localStorage.setItem('fp_wrap_mode',m);F.renderHome();}};
})();
