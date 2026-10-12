'use strict';
// ============================================================
//  FitPulse 2.4 — «Прогресс 2.0» и «Сезоны»
//   • Прогресс: периоды с дельтами, столбики по дням, тепловая карта,
//     баланс тела, рекорды с целями, разбивка по упражнениям, инсайты
//   • Сезон: месячный боевой пропуск — 30 уровней за опыт месяца,
//     еженедельные миссии, рамки аватара, титулы, щиты, сундуки опыта
// ============================================================
(function(){
const F=window.FP;if(!F)return;
const {L,esc,sheet,closeSheet,saveP,day,todayKey}=F;
const $=id=>document.getElementById(id);
const P=()=>F.P;
const pad2=n=>String(n).padStart(2,'0');
const kOf=d=>localDateKey(d);
const dOf=k=>{const [y,m,dd]=k.split('-').map(Number);return new Date(y,m-1,dd);};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
const fmt=n=>Math.round(n).toLocaleString(currentLang==='en'?'en-US':'ru-RU');
const WD=()=>currentLang==='en'?['Mo','Tu','We','Th','Fr','Sa','Su']:['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const wdi=d=>(d.getDay()+6)%7; // 0 = понедельник

// ───────────────────── учёт упражнений по дням ─────────────────────
const _addRep=window.addRep;
window.addRep=function(){
  const b=repCount;_addRep();
  if(repCount>b){const d=day();d.ex=d.ex||{};d.ex[currentEx]=(d.ex[currentEx]||0)+1;saveP();}
};
const _addPlankT=window.addPlankT;
window.addPlankT=function(dt){
  _addPlankT(dt);
  if(EX[currentEx]?.isPlank&&isRunning){const d=day();d.ex=d.ex||{};d.ex.plank=(d.ex.plank||0)+dt;}
};
const _stopAll=window.stopAll;
window.stopAll=function(){
  const run=isRunning;_stopAll();
  if(run){const h=new Date().getHours();const p=P();p.hours=p.hours||Array(24).fill(0);p.hours[h]++;saveP();}
  setTimeout(()=>{if(F.curTab==='progress')renderPro();},700);
};

// ───────────────────── данные ─────────────────────
let HIST=[],histAt=0;
async function loadHist(){
  if(Date.now()-histAt<4000)return HIST;
  let h=[];
  try{h=await dbGetHistory(3000);}catch(e){try{h=JSON.parse(localStorage.getItem('fp_hist')||'[]');}catch(_){h=[];}}
  HIST=h.map(r=>({...r,t:typeof r.date==='number'?r.date:Date.parse(r.date)})).filter(r=>r.t&&!isNaN(r.t));
  histAt=Date.now();return HIST;
}
function buildDays(){
  const out={};
  const hd={};
  HIST.forEach(r=>{
    const k=kOf(new Date(r.t));const d=hd[k]||(hd[k]={reps:0,secs:0,xp:0,workouts:0,ex:{}});
    const v=r.reps||0;if(r.exercise!=='plank')d.reps+=v;d.ex[r.exercise]=(d.ex[r.exercise]||0)+v;d.workouts++;
  });
  Object.keys(hd).forEach(k=>out[k]=hd[k]);
  Object.entries(P().days).forEach(([k,d])=>{
    if(!(d.reps||d.workouts||d.plank||d.xp))return;
    const h=hd[k];
    out[k]={reps:d.reps||0,secs:d.secs||0,xp:d.xp||0,plank:d.plank||0,workouts:Math.max(d.workouts||0,h?.workouts||0),ex:(d.ex&&Object.keys(d.ex).length)?d.ex:(h?.ex||{}),plan:!!d.plan};
  });
  return out;
}
const PER={week:7,month:30};
function sumRange(days,from,len){
  const r={reps:0,secs:0,xp:0,workouts:0,active:0,ex:{}};
  for(let i=0;i<len;i++){
    const d=days[kOf(addDays(from,i))];if(!d)continue;
    r.reps+=d.reps;r.secs+=d.secs||0;r.xp+=d.xp||0;r.workouts+=d.workouts||0;
    if(d.reps||d.workouts||d.plank)r.active++;
    Object.entries(d.ex||{}).forEach(([e,v])=>r.ex[e]=(r.ex[e]||0)+v);
  }
  return r;
}
function sumAll(days){
  const r={reps:0,secs:0,xp:0,workouts:0,active:0,ex:{}};
  Object.values(days).forEach(d=>{r.reps+=d.reps;r.secs+=d.secs||0;r.xp+=d.xp||0;r.workouts+=d.workouts||0;if(d.reps||d.workouts||d.plank)r.active++;Object.entries(d.ex||{}).forEach(([e,v])=>r.ex[e]=(r.ex[e]||0)+v);});
  return r;
}

// ───────────────────── визуализации ─────────────────────
const EXC={pushup:'#a855f7',squat:'#22d3ee',plank:'#facc15',situp:'#f472b6',lunge:'#34d399',burpee:'#fb7185',pullup:'#60a5fa'};
const GROUPS=[
  {id:'upper',ru:'Верх',en:'Upper',ex:['pushup','pullup'],tip:'pushup'},
  {id:'legs',ru:'Ноги',en:'Legs',ex:['squat','lunge'],tip:'squat'},
  {id:'core',ru:'Кор',en:'Core',ex:['situp','plank'],tip:'plank'},
  {id:'cardio',ru:'Кардио',en:'Cardio',ex:['burpee'],tip:'burpee'},
];
const units=(e,v)=>e==='plank'?v/3:e==='burpee'?v*2:v;

function delta(cur,prev){
  if(!prev&&!cur)return'';
  if(!prev)return`<span class="fpr-d up">new</span>`;
  const p=Math.round((cur-prev)/prev*100);
  if(p===0)return`<span class="fpr-d">0%</span>`;
  return`<span class="fpr-d ${p>0?'up':'dn'}">${p>0?'▲':'▼'} ${Math.abs(p)}%</span>`;
}

function barsSVG(vals,labels,hiIdx){
  const W=320,H=120,n=vals.length,gap=n>14?2:6,bw=(W-gap*(n-1))/n,max=Math.max(1,...vals.map(v=>v.v));
  return`<svg viewBox="0 0 ${W} ${H+18}" class="fpr-bars" preserveAspectRatio="none">
    <defs><linearGradient id="fprBG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="fpr-s1"/><stop offset="1" class="fpr-s2"/></linearGradient></defs>
    ${vals.map((v,i)=>{const h=v.v?Math.max(4,v.v/max*H):3;const x=i*(bw+gap);
      return`<g class="fpr-bar${i===hiIdx?' hi':''}${v.v?'':' z'}" data-i="${i}"><rect x="${x}" y="0" width="${bw}" height="${H}" fill="transparent"/><rect class="fpr-bar-r" x="${x}" y="${H-h}" width="${bw}" height="${h}" rx="${Math.min(6,bw/2)}"/></g>`;}).join('')}
    ${labels.map((l,i)=>l?`<text x="${i*(bw+gap)+bw/2}" y="${H+14}" text-anchor="middle" class="fpr-bl">${l}</text>`:'').join('')}
  </svg>`;
}

function heatmap(days){
  const weeks=17,today=new Date();today.setHours(0,0,0,0);
  const start=addDays(today,-wdi(today)-7*(weeks-1));
  const vals=[];for(let i=0;i<weeks*7;i++){const d=days[kOf(addDays(start,i))];vals.push(d?d.reps+Math.floor((d.plank||0)/3)+(d.workouts&&!d.reps?5:0):0);}
  const nz=vals.filter(v=>v>0).sort((a,b)=>a-b),q=p=>nz.length?nz[Math.min(nz.length-1,Math.floor(nz.length*p))]:1;
  const t1=q(.25),t2=q(.5),t3=q(.8);
  const lvl=v=>!v?0:v<=t1?1:v<=t2?2:v<=t3?3:4;
  const months=[];let lastM=-1;
  for(let w=0;w<weeks;w++){const d=addDays(start,w*7);if(d.getMonth()!==lastM){lastM=d.getMonth();months.push([w,d.toLocaleDateString(currentLang==='en'?'en-US':'ru-RU',{month:'short'}).replace('.','')]);}}
  const tk=kOf(today);
  let cells='';
  for(let w=0;w<weeks;w++)for(let r=0;r<7;r++){const i=w*7+r,dt=addDays(start,i),k=kOf(dt);if(dt>today)continue;
    cells+=`<i class="l${lvl(vals[i])}${k===tk?' t':''}" style="grid-column:${w+1};grid-row:${r+1}" data-k="${k}" data-v="${vals[i]}"></i>`;}
  return`<div class="fpr-heat-m">${months.map(([w,n])=>`<span style="grid-column:${w+1}">${n}</span>`).join('')}</div>
    <div class="fpr-heat-wrap"><div class="fpr-heat-wd">${WD().map((d,i)=>`<span>${i%2?'':d}</span>`).join('')}</div><div class="fpr-heat">${cells}</div></div>
    <div class="fpr-heat-leg">${L('Меньше','Less')} <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> ${L('Больше','More')}</div>`;
}

function radar(sc){
  const C=90,R=66,n=sc.length;
  const pt=(i,r)=>{const a=-Math.PI/2+i*2*Math.PI/n;return[C+Math.cos(a)*r,C+Math.sin(a)*r];};
  const ring=f=>sc.map((_,i)=>pt(i,R*f).join(',')).join(' ');
  const poly=sc.map((s,i)=>pt(i,R*Math.max(.06,s.v)).join(',')).join(' ');
  return`<svg viewBox="0 0 180 180" class="fpr-radar">
    ${[.25,.5,.75,1].map(f=>`<polygon points="${ring(f)}" class="fpr-rg"/>`).join('')}
    ${sc.map((_,i)=>{const[x,y]=pt(i,R);return`<line x1="${C}" y1="${C}" x2="${x}" y2="${y}" class="fpr-rg"/>`;}).join('')}
    <polygon points="${poly}" class="fpr-rp"/>
    ${sc.map((s,i)=>{const[x,y]=pt(i,R*Math.max(.06,s.v));return`<circle cx="${x}" cy="${y}" r="3.5" class="fpr-rd"/>`;}).join('')}
    ${sc.map((s,i)=>{const[x,y]=pt(i,R+15);return`<text x="${x}" y="${y+4}" text-anchor="middle" class="fpr-rl">${esc(s.n)}</text>`;}).join('')}
  </svg>`;
}

function donut(ex){
  const list=Object.entries(ex).filter(([k,v])=>v>0&&EX[k]).map(([k,v])=>[k,units(k,v)]).sort((a,b)=>b[1]-a[1]);
  const tot=list.reduce((a,b)=>a+b[1],0);
  if(!tot)return`<div class="fpr-empty">${L('Здесь появится разбивка, когда потренируешься','Your breakdown appears after a workout')}</div>`;
  const r=42,c=2*Math.PI*r;let off=0;
  const segs=list.map(([k,v])=>{const len=v/tot*c;const s=`<circle r="${r}" cx="60" cy="60" fill="none" stroke="${EXC[k]}" stroke-width="16" stroke-dasharray="${Math.max(0,len-2)} ${c}" stroke-dashoffset="${-off}" transform="rotate(-90 60 60)"/>`;off+=len;return s;}).join('');
  return`<div class="fpr-donut"><svg viewBox="0 0 120 120"><circle r="${r}" cx="60" cy="60" fill="none" class="fpr-dbg" stroke-width="16"/>${segs}
    <text x="60" y="58" text-anchor="middle" class="fpr-dv">${list.length}</text><text x="60" y="74" text-anchor="middle" class="fpr-dl">${L('упражн.','exercises')}</text></svg>
    <div class="fpr-dleg">${list.map(([k,v])=>`<div><i style="background:${EXC[k]}"></i><span>${EX[k].emoji} ${esc(EX[k].name)}</span><b>${Math.round(v/tot*100)}%</b></div>`).join('')}</div></div>`;
}

const MS_R=[5,10,15,20,25,30,40,50,60,75,100,125,150,200,250,300,400,500];
const MS_P=[15,30,45,60,90,120,180,240,300,420,600,900];
function records(){
  return Object.keys(EX).map(k=>{
    const e=EX[k],pr=Math.round(prRecords[k]||0),ms=e.isPlank?MS_P:MS_R;
    const next=ms.find(m=>m>pr)||pr+100,prevM=[...ms].reverse().find(m=>m<=pr)||0;
    const pct=Math.round((pr-prevM)/Math.max(1,next-prevM)*100);
    const u=e.isPlank?L('с','s'):'';
    return`<div class="fpr-rec${pr?'':' off'}" data-ex="${k}"><div class="fpr-rec-e">${e.emoji}</div>
      <div class="fpr-rec-m"><div class="fpr-rec-t"><span>${esc(e.name)}</span><b>${pr?pr+u:'—'}</b></div>
      <div class="fp-mini-bar"><div style="width:${pr?Math.max(4,pct):0}%"></div></div>
      <div class="fpr-rec-s">${pr?L(`До цели ${next}${u}: ещё ${next-pr}${u}`,`Next goal ${next}${u}: ${next-pr}${u} to go`):L('Ещё не пробовал — нажми, чтобы начать','Not tried yet — tap to start')}</div></div></div>`;
  }).join('');
}

function insights(days,cur,prev,per){
  const out=[];
  const keys=Object.keys(days);
  // лучший день недели
  const wd=Array(7).fill(0),wc=Array(7).fill(0);
  keys.forEach(k=>{const d=days[k];const i=wdi(dOf(k));wd[i]+=d.reps;if(d.reps)wc[i]++;});
  if(keys.length>=3){const bi=wd.indexOf(Math.max(...wd));if(wd[bi]>0){const full=currentLang==='en'?['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']:['понедельник','вторник','среду','четверг','пятницу','субботу','воскресенье'];
    out.push(['📅',L(`Твой сильный день — ${full[bi]}`,`Your power day is ${full[bi]}`),L(`В этот день ты делаешь больше всего повторений: ${fmt(wd[bi])} всего`,`You do the most reps on this day: ${fmt(wd[bi])} total`)]);}}
  // время суток
  const hrs=Array(24).fill(0);(P().hours||[]).forEach((v,i)=>hrs[i]+=v||0);HIST.forEach(r=>hrs[new Date(r.t).getHours()]++);
  const tot=hrs.reduce((a,b)=>a+b,0);
  if(tot>=3){const seg=[[5,12,'🌅',L('утром','in the morning')],[12,17,'☀️',L('днём','in the afternoon')],[17,23,'🌆',L('вечером','in the evening')],[23,29,'🌙',L('ночью','at night')]];
    const sc=seg.map(([a,b])=>{let s=0;for(let h=a;h<b;h++)s+=hrs[h%24];return s;});const bi=sc.indexOf(Math.max(...sc));
    out.push([seg[bi][2],L(`Чаще всего тренируешься ${seg[bi][3]}`,`You usually train ${seg[bi][3]}`),L(`${Math.round(sc[bi]/tot*100)}% тренировок — это время. Поставь напоминание на него`,`${Math.round(sc[bi]/tot*100)}% of workouts. Set a reminder for this time`)]);}
  // темп
  if(per!=='all'){
    if(cur.reps>prev.reps&&prev.reps>0)out.push(['🚀',L(`+${Math.round((cur.reps-prev.reps)/prev.reps*100)}% к прошлому периоду`,`+${Math.round((cur.reps-prev.reps)/prev.reps*100)}% vs previous period`),L('Ты растёшь — так держать!','You are growing — keep it up!')]);
    else if(prev.reps>cur.reps&&cur.reps>0)out.push(['💡',L(`Ещё ${fmt(prev.reps-cur.reps)} повторений до прошлого результата`,`${fmt(prev.reps-cur.reps)} reps to match last period`),L('Одна тренировка дня — и ты догонишь себя','One daily workout and you will catch up')]);
    const len=PER[per];if(cur.active>0){const pace=Math.round(cur.reps/len*30);out.push(['📈',L(`Прогноз: ~${fmt(pace)} повторений в месяц`,`Forecast: ~${fmt(pace)} reps per month`),L(`В среднем ${fmt(cur.reps/Math.max(1,cur.active))} за активный день`,`Avg ${fmt(cur.reps/Math.max(1,cur.active))} per active day`)]);}
  }
  if(maxStreak>1||dayStreak>1)out.push(['🔥',L(`Рекордная серия — ${Math.max(maxStreak,dayStreak)} дн.`,`Best streak — ${Math.max(maxStreak,dayStreak)} days`),dayStreak>=Math.max(maxStreak,1)?L('Ты прямо сейчас на рекорде!','You are on your record right now!'):L(`Сейчас ${dayStreak} дн. — побей рекорд!`,`Now ${dayStreak} days — beat it!`)]);
  if(!out.length)out.push(['✨',L('Инсайты появятся после пары тренировок','Insights appear after a couple of workouts'),L('Мы найдём твой лучший день и время','We will find your best day and time')]);
  return out.slice(0,4).map(([e,t,s])=>`<div class="fpr-ins"><div class="fpr-ins-e">${e}</div><div><div class="fpr-ins-t">${t}</div><div class="fpr-ins-s">${s}</div></div></div>`).join('');
}

// ───────────────────── экран «Прогресс» ─────────────────────
let PERIOD=localStorage.getItem('fp_pro_period')||'week';
function ensureHost(){
  const tab=$('tab-progress');if(!tab)return null;
  let host=$('fpProHost');
  if(!host){
    host=document.createElement('div');host.id='fpProHost';tab.prepend(host);
    // старые карточки (график по упражнению, экспорт, история) — в раскрывающийся блок
    const det=document.createElement('details');det.className='fp-card fpr-legacy';det.id='fprLegacy';
    det.innerHTML=`<summary><span>📒 ${L('Подходы, график и экспорт','Sets, chart & export')}</span><i>›</i></summary><div class="fpr-legacy-b"></div>`;
    const body=det.querySelector('.fpr-legacy-b');
    [...tab.children].filter(c=>c!==host).forEach(c=>body.appendChild(c));
    tab.appendChild(det);
    det.addEventListener('toggle',()=>{if(det.open){try{buildChartTabs();drawChart();}catch(e){}}});
  }
  return host;
}
async function renderPro(){
  const host=ensureHost();if(!host)return;
  if(!host.dataset.ready){host.innerHTML=`<div class="fp-card fpr-skel"></div><div class="fp-card fpr-skel"></div>`;}
  await loadHist();
  const days=buildDays();
  const today=new Date();today.setHours(0,0,0,0);
  let cur,prev,bars,labels,hi,title;
  if(PERIOD==='all'){
    cur=sumAll(days);prev=null;
    const wk0=addDays(today,-wdi(today)-7*11);
    bars=[];labels=[];
    for(let w=0;w<12;w++){const s=sumRange(days,addDays(wk0,w*7),7);bars.push({v:s.reps,k:kOf(addDays(wk0,w*7)),w:1});const d=addDays(wk0,w*7);labels.push(w%3===0?`${d.getDate()}.${pad2(d.getMonth()+1)}`:'');}
    hi=11;title=L('Повторения по неделям','Reps per week');
  }else{
    const len=PER[PERIOD],from=addDays(today,-(len-1));
    cur=sumRange(days,from,len);prev=sumRange(days,addDays(from,-len),len);
    bars=[];labels=[];
    for(let i=0;i<len;i++){const d=addDays(from,i),k=kOf(d),x=days[k];bars.push({v:x?x.reps+Math.floor((x.plank||0)/3):0,k});labels.push(len===7?WD()[wdi(d)]:(i%5===0||i===len-1)?String(d.getDate()):'');}
    hi=len-1;title=L('Повторения по дням','Reps per day');
  }
  const sc=GROUPS.map(g=>({n:L(g.ru,g.en),raw:g.ex.reduce((a,e)=>a+units(e,cur.ex[e]||0),0),g}));
  const mx=Math.max(1,...sc.map(s=>s.raw));sc.forEach(s=>s.v=s.raw/mx);
  const weak=[...sc].sort((a,b)=>a.raw-b.raw)[0],strong=[...sc].sort((a,b)=>b.raw-a.raw)[0];
  const hasBal=sc.some(s=>s.raw>0);
  const balPct=hasBal?Math.round(sc.reduce((a,s)=>a+s.v,0)/sc.length*100):0;
  const tile=(ico,val,lab,d)=>`<div class="fpr-tile"><div class="fpr-tile-i">${ico}</div><div class="fpr-tile-v">${val}</div><div class="fpr-tile-l">${lab}</div>${d||''}</div>`;
  const perLabel={week:L('7 дней','7 days'),month:L('30 дней','30 days'),all:L('Всё время','All time')};
  const activeTxt=PERIOD==='all'?L(`${cur.active} активных дней`,`${cur.active} active days`):L(`Активных дней: ${cur.active} из ${PER[PERIOD]}`,`Active days: ${cur.active} of ${PER[PERIOD]}`);
  const actPct=PERIOD==='all'?1:cur.active/PER[PERIOD];
  const allReps=PERIOD==='all'?Math.max(cur.reps,totalVolume):cur.reps;
  host.dataset.ready=1;
  host.innerHTML=`
  <div class="fpr-head">
    <div class="fpr-seg">${['week','month','all'].map(p=>`<button data-p="${p}" class="${p===PERIOD?'on':''}">${perLabel[p]}</button>`).join('')}</div>
  </div>
  <div class="fp-card fpr-hero">
    <div class="fpr-hero-top"><div><div class="fpr-hero-k">${PERIOD==='all'?L('За всё время','All time'):L('За '+perLabel[PERIOD],'Last '+perLabel[PERIOD])}</div>
      <div class="fpr-hero-v">${fmt(allReps)}<small>${L('повторений','reps')}</small></div></div>${prev?delta(cur.reps,prev.reps):''}</div>
    <div class="fpr-act"><div class="fpr-act-t">${activeTxt}</div><div class="fp-mini-bar"><div style="width:${Math.round(actPct*100)}%"></div></div></div>
    <div class="fpr-tiles">
      ${tile('⏱️',fmt(cur.secs/60),L('минут','minutes'),prev?delta(cur.secs,prev.secs):'')}
      ${tile('⚡',fmt(cur.xp),'XP',prev?delta(cur.xp,prev.xp):'')}
      ${tile('🏋️',fmt(cur.workouts),L('тренировок','workouts'),prev?delta(cur.workouts,prev.workouts):'')}
      ${tile('🔥',fmt(PERIOD==='all'?caloriesBurned:cur.reps*.55+cur.secs/60*4),L('ккал','kcal'),'')}
    </div>
  </div>

  <div class="fp-card"><div class="fpr-ct"><span>${title}</span><b id="fprBarVal"></b></div>${barsSVG(bars,labels,hi)}</div>

  <div class="fp-card"><div class="fpr-ct"><span>🗓️ ${L('Карта активности','Activity map')}</span><b id="fprHeatVal">${L('17 недель','17 weeks')}</b></div>${heatmap(days)}</div>

  <div class="fp-card fpr-bal"><div class="fpr-ct"><span>🧬 ${L('Баланс тела','Body balance')}</span><b>${hasBal?balPct+'%':''}</b></div>
    <div class="fpr-bal-row">${radar(sc)}
      <div class="fpr-bal-side">${sc.map(s=>`<div class="fpr-bal-i"><span>${esc(s.n)}</span><div class="fp-mini-bar"><div style="width:${Math.round(s.v*100)}%"></div></div></div>`).join('')}</div></div>
    ${hasBal?`<div class="fpr-tip">${weak.raw<strong.raw*.5?`💡 ${L(`Отстаёт «${weak.n}». Добавь ${EX[weak.g.tip].name.toLowerCase()} — так тело будет развиваться гармонично`,`“${weak.n}” is lagging. Add ${EX[weak.g.tip].name.toLowerCase()} for balanced growth`)}<button class="fpr-tip-b" data-ex="${weak.g.tip}">${EX[weak.g.tip].emoji} ${L('Тренировать','Train')}</button>`:`✅ ${L('Отличный баланс! Все группы мышц в работе','Great balance! All muscle groups are working')}`}</div>`:`<div class="fpr-empty">${L('Потренируйся — и здесь появится карта твоих мышц','Train and your muscle map will appear here')}</div>`}
  </div>

  <div class="fp-card"><div class="fpr-ct"><span>🥧 ${L('Из чего состоят тренировки','What your workouts are made of')}</span></div>${donut(cur.ex)}</div>

  <div class="fp-card"><div class="fpr-ct"><span>🏆 ${L('Рекорды и цели','Records & goals')}</span></div><div class="fpr-recs">${records()}</div></div>

  <div class="fp-section-t">🧠 ${L('Инсайты','Insights')}</div>
  <div class="fpr-inss">${insights(days,cur,prev||{},PERIOD)}</div>
  `;
  host.querySelectorAll('.fpr-seg button').forEach(b=>b.onclick=()=>{PERIOD=b.dataset.p;localStorage.setItem('fp_pro_period',PERIOD);renderPro();});
  const bv=$('fprBarVal');
  const showBar=i=>{const b=bars[i];if(!b)return;host.querySelectorAll('.fpr-bar').forEach(g=>g.classList.toggle('hi',+g.dataset.i===i));
    const d=dOf(b.k);const dl=d.toLocaleDateString(currentLang==='en'?'en-US':'ru-RU',{day:'numeric',month:'short'});
    bv.textContent=`${b.w?L('нед. с ','wk of ')+dl:dl}: ${fmt(b.v)}`;};
  host.querySelectorAll('.fpr-bar').forEach(g=>g.onclick=()=>showBar(+g.dataset.i));showBar(hi);
  const hv=$('fprHeatVal');
  host.querySelectorAll('.fpr-heat i').forEach(c=>c.onclick=()=>{host.querySelectorAll('.fpr-heat i.sel').forEach(x=>x.classList.remove('sel'));c.classList.add('sel');
    const d=dOf(c.dataset.k);hv.textContent=`${d.toLocaleDateString(currentLang==='en'?'en-US':'ru-RU',{day:'numeric',month:'short'})}: ${fmt(+c.dataset.v)}`;});
  const go=ex=>{openTab('train');setTimeout(()=>{try{setEx(ex);}catch(e){}},120);};
  host.querySelectorAll('.fpr-tip-b').forEach(b=>b.onclick=()=>go(b.dataset.ex));
  host.querySelectorAll('.fpr-rec').forEach(r=>r.onclick=()=>go(r.dataset.ex));
  const lg=document.querySelector('#fprLegacy summary span');if(lg)lg.textContent='📒 '+L('Подходы, график и экспорт','Sets, chart & export');
}

// ============================================================
//  СЕЗОН
// ============================================================
const SPL=200,SMAX=30;
const SEASONS=[
  ['❄️','Ледяной старт','Ice Start'],['🛡️','Стальная воля','Steel Will'],['🌱','Пробуждение','Awakening'],
  ['🚀','Космический рывок','Space Sprint'],['🌸','Цветущая сила','Blooming Power'],['☀️','Солнечный заряд','Solar Charge'],
  ['🌊','Летняя волна','Summer Wave'],['🔥','Жаркий рекорд','Heat Record'],['🍂','Новый ритм','New Rhythm'],
  ['🎃','Тыквенная лихорадка','Pumpkin Rush'],['⛈️','Железный ноябрь','Iron November'],['🎄','Зимний марафон','Winter Marathon'],
];
const FRAMES={
  spark:{ru:'Искра',en:'Spark'},wave:{ru:'Волна',en:'Wave'},flame:{ru:'Пламя',en:'Flame'},
  gold:{ru:'Золото',en:'Gold'},prism:{ru:'Призма',en:'Prism'},legend:{ru:'Легенда',en:'Legend'},
};
const TITLES={10:['Боец сезона','Season Fighter'],20:['Ветеран сезона','Season Veteran'],30:['Чемпион сезона','Season Champion']};
function reward(l){
  const fr={3:'spark',8:'wave',13:'flame',19:'gold',25:'prism',30:'legend'}[l];
  if(fr)return{t:'frame',v:fr,ico:'🖼️',title:TITLES[l]?l:0};
  if(TITLES[l])return{t:'title',v:l,ico:'🏅'};
  if([5,12,18,24,28].includes(l))return{t:'shield',ico:'🛡️'};
  if([7,15,22,27].includes(l))return{t:'xp',v:{7:150,15:250,22:350,27:500}[l],ico:'💰'};
  return{t:'food',v:10+l*2,ico:'🍖'};
}
function rewardName(r){
  if(r.t==='frame')return L(`Рамка «${FRAMES[r.v].ru}»`,`“${FRAMES[r.v].en}” frame`)+(r.title?L(` + титул «${TITLES[r.title][0]}»`,` + “${TITLES[r.title][1]}” title`):'');
  if(r.t==='title')return L(`Титул «${TITLES[r.v][0]}»`,`“${TITLES[r.v][1]}” title`);
  if(r.t==='shield')return L('Щит серии','Streak shield');
  if(r.t==='xp')return L(`Сундук +${r.v} XP`,`Chest +${r.v} XP`);
  return L(`Угощение Пульсику +${r.v}`,`Pet treat +${r.v}`);
}
const mKey=(d=new Date())=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}`;
function SS(){const p=P();const s=p.season||(p.season={});s.claimed=s.claimed||{};s.bonus=s.bonus||{};s.cx=s.cx||{};s.mis=s.mis||{};s.frames=s.frames||[];s.titles=s.titles||{};s.adm=s.adm||{};return s;}
function seasonInfo(){
  const mk=mKey(),s=SS(),now=new Date();
  let xp=0;Object.entries(P().days).forEach(([k,d])=>{if(k.startsWith(mk))xp+=d.xp||0;});
  xp=Math.max(0,xp-(s.cx[mk]||0))+(s.bonus[mk]||0)+(s.adm[mk]||0);
  const level=Math.min(SMAX,Math.floor(xp/SPL));
  const into=level>=SMAX?SPL:xp-level*SPL;
  const end=new Date(now.getFullYear(),now.getMonth()+1,1);const left=Math.ceil((end-now)/864e5);
  const [e,ru,en]=SEASONS[now.getMonth()];
  const claimed=s.claimed[mk]||[];
  const ready=[];for(let l=1;l<=level;l++)if(!claimed.includes(l))ready.push(l);
  return{mk,xp,level,into,left,e,name:L(ru,en),claimed,ready,num:now.getMonth()+1};
}
// миссии недели (пн–вс)
function weekKeys(){const t=new Date();t.setHours(0,0,0,0);const s=addDays(t,-wdi(t));return Array.from({length:7},(_,i)=>kOf(addDays(s,i)));}
function missions(){
  const ks=weekKeys(),D=P().days;
  const w=ks.reduce((a,k)=>a+(D[k]?.workouts||0),0),r=ks.reduce((a,k)=>a+(D[k]?.reps||0),0);
  const rings=ks.filter(k=>P().claims[k]).length,plans=ks.filter(k=>D[k]?.plan).length;
  const act=ks.filter(k=>D[k]&&(D[k].reps||D[k].workouts)).length;
  return[
    {id:'w3',e:'🏋️',t:L('3 тренировки за неделю','3 workouts this week'),c:w,n:3},
    {id:'r300',e:'💪',t:L('300 повторений за неделю','300 reps this week'),c:r,n:300},
    {id:'a4',e:'📆',t:L('Тренируйся 4 разных дня','Train on 4 different days'),c:act,n:4},
    {id:'wod2',e:'🎯',t:L('2 тренировки дня','2 daily workouts'),c:plans,n:2},
    {id:'ring1',e:'💫',t:L('Закрой все кольца','Close all rings'),c:rings,n:1},
  ];
}
const MIS_XP=150;
function weekId(){return weekKeys()[0];}

function claim(l){
  const si=seasonInfo(),s=SS();if(l>si.level||si.claimed.includes(l))return;
  const r=reward(l);(s.claimed[si.mk]=s.claimed[si.mk]||[]).push(l);
  let msg=rewardName(r);
  if(r.t==='frame'){if(!s.frames.includes(r.v))s.frames.push(r.v);s.frame=r.v;if(r.title)s.titles[si.mk]=Math.max(s.titles[si.mk]||0,r.title);applyFrame();}
  else if(r.t==='title'){s.titles[si.mk]=Math.max(s.titles[si.mk]||0,r.v);}
  else if(r.t==='shield'){if(P().shields<3)P().shields++;else{msg+=L(' (щиты полные — +30 XP)',' (shields full — +30 XP)');s.cx[si.mk]=(s.cx[si.mk]||0)+30;addXP(30);}}
  else if(r.t==='xp'){s.cx[si.mk]=(s.cx[si.mk]||0)+r.v;addXP(r.v);}
  else if(r.t==='food'){window.FPP?.pet&&(FPP.pet().food+=r.v,FPP.pet().last=Date.now());}
  saveP();save();
  toast(`${r.ico} ${msg}`,3000);try{confetti(r.t==='frame'||r.t==='title'?2200:900);}catch(e){}
}
function claimMission(id){
  const s=SS(),wk=weekId(),m=missions().find(x=>x.id===id);if(!m||m.c<m.n)return;
  const got=s.mis[wk]||(s.mis[wk]=[]);if(got.includes(id))return;
  got.push(id);const mk=mKey();s.bonus[mk]=(s.bonus[mk]||0)+MIS_XP;
  Object.keys(s.mis).filter(k=>k<kOf(addDays(new Date(),-60))).forEach(k=>delete s.mis[k]);
  saveP();toast(`🎫 +${MIS_XP} ${L('очков сезона','season points')}`,2500);
}
function bestTitle(){
  const s=SS();const ent=Object.entries(s.titles).sort((a,b)=>b[1]-a[1]||b[0].localeCompare(a[0]));if(!ent.length)return null;
  const [mk,l]=ent[0];const m=+mk.slice(5)-1;return{l,txt:L(TITLES[l][0],TITLES[l][1]),season:L(SEASONS[m][1],SEASONS[m][2]),e:SEASONS[m][0],mk};
}
function applyFrame(){
  const f=SS().frame;
  [...document.body.classList].filter(c=>c.startsWith('fps-fr-')).forEach(c=>document.body.classList.remove(c));
  if(f)document.body.classList.add('fps-fr-'+f);
  const pt=$('profileTitle');
  let b=$('fpsBadge');const t=bestTitle();
  if(t&&pt){if(!b){b=document.createElement('div');b.id='fpsBadge';b.className='fps-badge';pt.after(b);}b.textContent=`${t.e} ${t.txt}`;b.title=t.season;}
  else if(b)b.remove();
}

function seasonCard(){
  const si=seasonInfo();
  return`<div class="fp-card fps-card" id="fpsCard">
    <div class="fps-c-top"><div class="fps-c-e">${si.e}</div><div class="fps-c-m"><div class="fps-c-k">${L('Сезон','Season')} ${si.num} · ${L(`ещё ${si.left} дн.`,`${si.left} days left`)}</div><div class="fps-c-t">${esc(si.name)}</div></div>
      <div class="fps-c-l"><b>${si.level}</b><span>/${SMAX}</span></div></div>
    <div class="fps-c-bar"><div style="width:${Math.round(si.into/SPL*100)}%"></div></div>
    <div class="fps-c-s">${si.ready.length?`🎁 ${L(`Награды ждут: ${si.ready.length}`,`Rewards waiting: ${si.ready.length}`)}`:si.level>=SMAX?L('👑 Сезон пройден полностью!','👑 Season complete!'):L(`До ур. ${si.level+1}: ${SPL-si.into} XP · следующая: ${rewardName(reward(si.level+1))}`,`To lv ${si.level+1}: ${SPL-si.into} XP · next: ${rewardName(reward(si.level+1))}`)}</div>
    ${si.ready.length?'<span class="fps-dot"></span>':''}
  </div>`;
}
let seasonScroll=null;
function openSeason(){
  const si=seasonInfo(),s=SS(),wk=weekId(),got=s.mis[wk]||[];
  const ms=missions();
  const tiers=[];for(let l=1;l<=SMAX;l++){const r=reward(l),st=si.claimed.includes(l)?'done':l<=si.level?'ready':'lock';
    tiers.push(`<div class="fps-tier ${st}${r.t==='frame'||r.t==='title'?' big':''}${l===si.level+1?' next':''}" data-l="${l}">
      <div class="fps-tier-n">${l}</div>
      <div class="fps-tier-i">${r.t==='frame'?`<span class="fps-fprev fps-fp-${r.v}"></span>`:r.ico}</div>
      <div class="fps-tier-t">${rewardName(r)}</div>
      ${st==='ready'?`<button class="fps-claim" data-l="${l}">${L('Забрать','Claim')}</button>`:st==='done'?'<span class="fps-ok">✓</span>':'<span class="fps-lk">🔒</span>'}
    </div>`);}
  const ov=sheet(`<div class="fps">
    <div class="fps-hero"><div class="fps-hero-e">${si.e}</div>
      <div class="fps-hero-k">${L('Сезон','Season')} ${si.num} · ${L(`до конца ${si.left} дн.`,`${si.left} days left`)}</div>
      <div class="fps-hero-t">${esc(si.name)}</div>
      <div class="fps-hero-l">${L('Уровень','Level')} <b>${si.level}</b> / ${SMAX}</div>
      <div class="fps-c-bar"><div style="width:${Math.round(si.into/SPL*100)}%"></div></div>
      <div class="fps-hero-s">${si.level>=SMAX?L('Все уровни пройдены 👑','All levels done 👑'):`${si.into} / ${SPL} XP`}</div>
      ${si.ready.length>1?`<button class="fps-all">🎁 ${L(`Забрать всё (${si.ready.length})`,`Claim all (${si.ready.length})`)}</button>`:''}
    </div>
    <div class="fps-how">${L('Любой опыт за месяц двигает сезон. Каждые 200 XP — новый уровень и награда. 1-го числа стартует новый сезон, а рамки и титулы остаются навсегда.','All XP earned this month pushes the season. Every 200 XP = new level and reward. A new season starts on the 1st; frames and titles stay forever.')}</div>
    <div class="fp-section-t">🎯 ${L('Миссии недели','Weekly missions')} · +${MIS_XP} XP ${L('каждая','each')}</div>
    <div class="fps-mis">${ms.map(m=>{const done=got.includes(m.id),ok=m.c>=m.n;return`<div class="fps-m${done?' done':''}"><div class="fps-m-e">${m.e}</div><div class="fps-m-b"><div class="fps-m-t">${m.t}</div><div class="fp-mini-bar"><div style="width:${Math.min(100,Math.round(m.c/m.n*100))}%"></div></div><div class="fps-m-s">${Math.min(m.c,m.n)} / ${m.n}</div></div>
      ${done?'<span class="fps-ok">✓</span>':ok?`<button class="fps-claim" data-m="${m.id}">+${MIS_XP}</button>`:''}</div>`;}).join('')}</div>
    ${s.frames.length?`<div class="fp-section-t">🖼️ ${L('Рамки аватара','Avatar frames')}</div>
    <div class="fps-frames"><button data-f="" class="${!s.frame?'on':''}"><span class="fps-fprev none"></span><em>${L('Без рамки','None')}</em></button>${s.frames.map(f=>`<button data-f="${f}" class="${s.frame===f?'on':''}"><span class="fps-fprev fps-fp-${f}"></span><em>${L(FRAMES[f].ru,FRAMES[f].en)}</em></button>`).join('')}</div>`:''}
    <div class="fp-section-t">🎫 ${L('Награды сезона','Season rewards')}</div>
    <div class="fps-tiers">${tiers.join('')}</div>
  </div>`,'fp-sheet-season');
  const sh=ov.querySelector('.fp-sheet');
  if(seasonScroll!=null){sh.scrollTop=seasonScroll;}
  else if(!si.ready.length&&si.level>4)setTimeout(()=>{const n=sh.querySelector('.fps-tier.next');if(n)n.scrollIntoView({block:'center',behavior:'smooth'});},420);
  sh.addEventListener('scroll',()=>seasonScroll=sh.scrollTop);
  const reopen=()=>{refresh();openSeason();};
  ov.querySelectorAll('.fps-claim[data-l]').forEach(b=>b.onclick=()=>{claim(+b.dataset.l);reopen();});
  ov.querySelectorAll('.fps-claim[data-m]').forEach(b=>b.onclick=()=>{claimMission(b.dataset.m);reopen();});
  const all=ov.querySelector('.fps-all');if(all)all.onclick=()=>{const tt=window.toast;let n=0;window.toast=()=>{};try{si.ready.forEach(l=>{claim(l);n++;});}finally{window.toast=tt;}toast(`🎁 ${L(`Получено наград: ${n}`,`Rewards claimed: ${n}`)}`,2600);confetti(2500);reopen();};
  ov.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{SS().frame=b.dataset.f||null;saveP();applyFrame();reopen();});
}
function refresh(){applyFrame();if($('fpMeHost'))renderMe();if(F.curTab==='home')F.renderHome();if(F.curTab==='progress')renderPro();}


// ============================================================
//  ПРОФИЛЬ — новое меню
// ============================================================
const PEN='<svg width="16" height="16" viewBox="0 0 16 16"><path d="M10.8 2.6l2.6 2.6-7.7 7.7-3.3.7.7-3.3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
function petStage(){const pt=window.FPP?.pet?.();if(!pt)return null;const ST=FPP.STAGES;let i=0;ST.forEach((st,k)=>{if(pt.food>=st.at)i=k;});return{i,st:ST[i],name:pt.name};}
function row(a,ico,t,sub,val,cls=''){return`<button class="fpm-row ${cls}" data-a="${a}"><span class="fpm-ico">${ico}</span><span class="fpm-m"><span class="fpm-t">${t}</span>${sub?`<span class="fpm-s">${sub}</span>`:''}</span>${val!=null?`<span class="fpm-v">${val}</span>`:''}<span class="fpm-ch">›</span></button>`;}
function renderMe(){
  const tab=$('tab-profile');if(!tab)return;
  tab.classList.add('fp-me');
  const card=tab.querySelector('.profile-card');
  if(card&&!$('fpmEdit')){
    const b=document.createElement('button');b.id='fpmEdit';b.className='fpm-edit';b.innerHTML=PEN;b.setAttribute('aria-label','Edit');
    b.onclick=e=>{e.stopPropagation();openEdit();};card.appendChild(b);
  }
  let host=$('fpMeHost');
  if(!host){host=document.createElement('div');host.id='fpMeHost';card?card.after(host):tab.prepend(host);}
  const si=seasonInfo(),ps=petStage(),achN=Object.keys(achievements||{}).filter(k=>achievements[k]).length;
  const prN=Object.keys(prRecords||{}).filter(k=>prRecords[k]>0).length;
  const fr=SS().frame,th=localStorage.getItem('fp_theme')||'violet';
  const thO=(typeof THEMES!=='undefined'?THEMES:[]).find(t=>t.id===th);const thName=thO?(currentLang==='en'&&thO.nameEn?thO.nameEn:thO.name):th;
  host.innerHTML=`
  <div class="fpm-quick">
    <button data-a="streak" class="${dayStreak>0?'hot':''}"><b>🔥 ${dayStreak}</b><span>${L('серия','streak')}</span></button>
    <button data-a="shields"><b>🛡️ ${P().shields}</b><span>${L('щиты','shields')}</span></button>
    <button data-a="season"><b>🎫 ${si.level}</b><span>${L('сезон','season')}</span>${si.ready.length?'<i></i>':''}</button>
    <button data-a="pet">${ps?`<img src="${FPP.petSrc(ps.i)}" alt=""><span>${esc(L(ps.st.ru,ps.st.en))}</span>`:'<b>🐣</b><span>—</span>'}</button>
  </div>
  <div class="fp-section-t">${L('Мой прогресс','My progress')}</div>
  <div class="fpm-g">
    ${row('progress','📊',L('Прогресс и статистика','Progress & stats'),L('Графики, карта активности, инсайты','Charts, activity map, insights'))}
    ${row('season','🎫',L('Сезон','Season')+' · '+esc(si.name),si.ready.length?L(`🎁 Наград ждёт: ${si.ready.length}`,`🎁 Rewards waiting: ${si.ready.length}`):L(`Уровень ${si.level} из ${SMAX}`,`Level ${si.level} of ${SMAX}`),null,si.ready.length?'hl':'')}
    ${row('records','🏆',L('Личные рекорды','Personal records'),L('Лучшие подходы по упражнениям','Best sets per exercise'),prN)}
    ${row('ach','🏅',L('Достижения','Achievements'),L('Открывай значки за успехи','Unlock badges for milestones'),`${achN}/${(typeof ACH!=='undefined'?ACH.length:12)}`)}
    ${row('path','🗺️',L('Путь героя','Hero path'),L(`Пройдено этапов: ${Object.keys(P().path).length} из 40`,`Stages cleared: ${Object.keys(P().path).length} of 40`))}
  </div>
  <div class="fp-section-t">${L('Оформление','Appearance')}</div>
  <div class="fpm-g">
    ${window.FPC?(()=>{const c=FPC.coach();return row('coach',c.e,L('Тренер с характером','Coach with personality'),esc(c[currentLang==='en'?'en':'ru'].name),null,localStorage.getItem('fp_coach')?'':'hl');})():''}
    ${row('avatar','🙂',L('Аватар','Avatar'),L('Эмодзи или своё фото','Emoji or your photo'))}
    ${row('frame','🖼️',L('Рамка аватара','Avatar frame'),fr?L(FRAMES[fr].ru,FRAMES[fr].en):L('Получай рамки в сезоне','Earn frames in the season'),SS().frames.length||null)}
    ${row('theme','🎨',L('Тема','Theme'),esc(thName))}
    ${row('lang','🌐',L('Язык','Language'),currentLang==='en'?'English':'Русский',currentLang==='en'?'EN':'RU')}
  </div>
  <div class="fp-section-t">${L('Аккаунт','Account')}</div>
  <div class="fpm-g">
    ${row('edit','✏️',L('Имя, вес и рост','Name, weight & height'),`${esc(userName)} · ${userWeight} ${L('кг','kg')} · ${userHeight} ${L('см','cm')}`)}
    ${row('settings','⚙️',L('Настройки','Settings'),L('Камера, голос, отображение','Camera, voice, display'))}
    ${row('faq','❓',L('Как пользоваться','How to use'),L('FAQ и приветствие','FAQ & intro'))}
    ${row('feedback','💬',L('Обратная связь','Feedback'),L('Отзыв, идея или вопрос','Review, idea or question'))}
    ${row('news','✨',L('Что нового','What\'s new'),L('История обновлений','Release notes'))}
  </div>
  <div class="fpm-g">${row('reset','⚠️',L('Сбросить весь прогресс','Reset all progress'),L('Удалит уровни, историю и награды','Deletes levels, history and rewards'),null,'danger')}</div>
  <div class="fpm-ver">FitPulse 2.6</div>`;
  const A={
    progress:()=>openTab('progress'),season:()=>{seasonScroll=null;openSeason();},path:()=>openTab('path'),
    records:()=>listSheet('🏆',L('Личные рекорды','Personal records'),$('prList')?.innerHTML,'fpm-pr'),
    ach:()=>listSheet('🏅',L('Достижения','Achievements'),`<div class="ach-grid">${$('achGrid')?.innerHTML||''}</div>`,'fpm-ach'),
    streak:()=>{const bn=$('dayStreakBanner');listSheet('🔥',L('Серия тренировок','Workout streak'),bn?bn.outerHTML.replace('id="dayStreakBanner"','')+`<div class="fpm-note">${L(`Рекорд: ${Math.max(maxStreak,dayStreak)} дн. Тренируйся каждый день, чтобы огонёк не погас.`,`Best: ${Math.max(maxStreak,dayStreak)} days. Train daily to keep the fire alive.`)}</div>`:'');},
    shields:()=>listSheet('🛡️',L('Щиты серии','Streak shields'),`<div class="fpm-big">${'🛡️'.repeat(P().shields)||'—'}<small>${P().shields} / 3</small></div><div class="fpm-note">${L('Щит сам спасает серию, если ты пропустил день. Получай щиты в подарке дня, за каждые 7 дней серии и в сезоне.','A shield saves your streak if you miss a day. Get them from the daily gift, every 7-day streak and the season.')}</div>`),
    pet:()=>openTab('home'),
    coach:()=>window.FPC?.open(),avatar:()=>openModal('avatarModal'),frame:openFrames,theme:()=>openModal('themeModal'),
    lang:()=>applyLanguage(currentLang==='en'?'ru':'en'),
    edit:openEdit,settings:()=>openModal('settingsModal'),faq:()=>openModal('faqModalWrap'),feedback:()=>openModal('feedbackModal'),
    news:()=>{openChangelog();localStorage.setItem('fp_changelog_seen',String(CURRENT_VERSION));},
    reset:()=>$('resetAllBtn')?.click(),
  };
  host.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>A[b.dataset.a]?.());
}
function listSheet(ico,title,body,cls=''){
  sheet(`<div class="fpm-sh ${cls}"><div class="fpm-sh-h"><span>${ico}</span>${esc(title)}</div>${body||`<div class="fpr-empty">${L('Пока пусто','Nothing yet')}</div>`}</div>`);
}
function openFrames(){
  const s=SS();
  sheet(`<div class="fpm-sh"><div class="fpm-sh-h"><span>🖼️</span>${L('Рамка аватара','Avatar frame')}</div>
    ${s.frames.length?`<div class="fps-frames fpm-frames"><button data-f="" class="${!s.frame?'on':''}"><span class="fps-fprev none"></span><em>${L('Без рамки','None')}</em></button>${s.frames.map(f=>`<button data-f="${f}" class="${s.frame===f?'on':''}"><span class="fps-fprev fps-fp-${f}"></span><em>${L(FRAMES[f].ru,FRAMES[f].en)}</em></button>`).join('')}</div>`:''}
    <div class="fpm-note">${L('Рамки открываются на уровнях сезона 3, 8, 13, 19, 25 и 30 и остаются навсегда.','Frames unlock at season levels 3, 8, 13, 19, 25 and 30 and are yours forever.')}</div>
    <button class="fp-cta" id="fpmToSeason">🎫 ${L('Открыть сезон','Open season')}</button></div>`);
  document.querySelectorAll('.fpm-frames [data-f]').forEach(b=>b.onclick=()=>{SS().frame=b.dataset.f||null;saveP();applyFrame();renderMe();openFrames();});
  $('fpmToSeason').onclick=()=>{closeSheet();setTimeout(()=>{seasonScroll=null;openSeason();},260);};
}
function openEdit(){
  sheet(`<div class="fpm-sh"><div class="fpm-sh-h"><span>✏️</span>${L('Мой профиль','My profile')}</div>
    <button class="fpm-av" id="fpmAv">${$('avatarImg')?.innerHTML||'🏆'}<i>${PEN}</i></button>
    <label class="fpm-f"><span>${L('Имя','Name')}</span><input class="inp" id="fpmName" maxlength="24" value="${esc(userName)}"></label>
    <div class="fpm-2"><label class="fpm-f"><span>${L('Вес, кг','Weight, kg')}</span><input class="inp" type="number" id="fpmW" min="30" max="250" value="${userWeight}"></label>
    <label class="fpm-f"><span>${L('Рост, см','Height, cm')}</span><input class="inp" type="number" id="fpmH" min="100" max="250" value="${userHeight}"></label></div>
    <div class="fpm-note">${L('Вес и рост нужны, чтобы точнее считать калории.','Weight and height make calorie estimates more accurate.')}</div>
    <button class="fp-cta" id="fpmSave">💾 ${L('Сохранить','Save')}</button></div>`);
  $('fpmAv').onclick=()=>{closeSheet();openModal('avatarModal');};
  $('fpmSave').onclick=()=>{
    const set=(id,v)=>{const e=$(id);if(e)e.value=v;};
    set('nameInput',$('fpmName').value.trim()||L('Спортсмен','Athlete'));set('weightInput',$('fpmW').value||70);set('heightInput',$('fpmH').value||170);
    $('saveProfileBtn')?.click();closeSheet();renderMe();
  };
}

// ───────────────────── хуки ─────────────────────
F.HOOKS.home.push(host=>{
  if(!host)return;
  host.insertAdjacentHTML('afterbegin',seasonCard());
  const c=$('fpsCard');if(c)c.onclick=()=>{seasonScroll=null;openSeason();};
});
let lvl0=null;
const _startSes=window.startSes;
window.startSes=function(){_startSes();lvl0=seasonInfo().level;};
F.HOOKS.summary.push(extra=>{
  if(lvl0==null)return;const si=seasonInfo();
  if(si.level>lvl0)extra.push(`🎫 ${L('Сезон','Season')}: ${L('уровень','level')} <b>${si.level}</b> — ${L('забери награду на главной','claim your reward on Today')}`);
  lvl0=null;
});
const _openTab=window.openTab;
window.openTab=function(id){_openTab(id);if(id==='progress')renderPro();if(id==='profile')renderMe();};
const _applyLanguage=window.applyLanguage;
window.applyLanguage=function(l){_applyLanguage(l);applyFrame();if(F.curTab==='progress')renderPro();if($('fpMeHost'))renderMe();};
const _updateProfileUI=window.updateProfileUI;
if(_updateProfileUI)window.updateProfileUI=function(){_updateProfileUI.apply(this,arguments);applyFrame();if($('fpMeHost')&&F.curTab==='profile')renderMe();};
document.addEventListener('DOMContentLoaded',()=>{applyFrame();ensureHost();renderMe();
  // единые SVG-крестики и в старых окнах
  document.querySelectorAll('.modal-close').forEach(b=>{if(b.textContent.trim()==='✕'){b.innerHTML=window.FP_XSVG||'✕';b.setAttribute('aria-label','Close');}});
});

window.FPS={seasonInfo,openSeason,renderPro,SS,claim,reward,SPL,SMAX,FRAMES,setLevel(l){const si=seasonInfo(),s=SS();s.adm[si.mk]=(s.adm[si.mk]||0)+Math.max(0,Math.min(SMAX,l))*SPL-si.xp;saveP();refresh();},resetSeason(){const s=SS(),mk=mKey();delete s.claimed[mk];delete s.adm[mk];delete s.titles[mk];s.mis={};saveP();refresh();}};
})();
