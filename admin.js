'use strict';
// ============================================================
//  FitPulse — режим администратора
//  Вход: 7 быстрых нажатий на логотип → ввод кода доступа.
//  В коде хранится только SHA-256 хеш кода, сам код в репозитории не лежит.
//  Сменить код: в консоли браузера FPA.hash('НОВЫЙ-КОД') → вставить результат в ADMIN_HASH.
//  Пока режим включён, результаты с устройства НЕ публикуются в онлайн-рейтинг.
// ============================================================
(function(){
const ADMIN_HASH='b79088200c183cda36f32ebe606f75e7052d47f37b90b9bcba8b7a9c1ca134dc';
const F=window.FP;if(!F)return;
const $=id=>document.getElementById(id);
const isAdmin=()=>localStorage.getItem('fp_admin')===ADMIN_HASH;
const REW={5:'🦊',10:'aurora',15:'🐺',20:'ember',25:'🦁',30:'gold',35:'🐉',40:'cosmos'};
const PET_AT=[0,40,200,600,1500,4000];
const totalXP=()=>100*(lvl-1)*lvl/2+xp;

// ── SHA-256 (своя реализация — работает и без https) ──
function sha256(str){
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const bytes=[...new TextEncoder().encode(str)],l=bytes.length*8;
  bytes.push(0x80);while(bytes.length%64!==56)bytes.push(0);
  for(let i=7;i>=0;i--)bytes.push(Math.floor(l/2**(i*8))&255);
  let h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const r=(x,n)=>(x>>>n)|(x<<(32-n));
  for(let o=0;o<bytes.length;o+=64){
    const w=new Array(64);
    for(let i=0;i<16;i++)w[i]=(bytes[o+i*4]<<24)|(bytes[o+i*4+1]<<16)|(bytes[o+i*4+2]<<8)|bytes[o+i*4+3];
    for(let i=16;i<64;i++){const s0=r(w[i-15],7)^r(w[i-15],18)^(w[i-15]>>>3),s1=r(w[i-2],17)^r(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0;}
    let [a,b,c,d,e,f,g,hh]=h;
    for(let i=0;i<64;i++){
      const S1=r(e,6)^r(e,11)^r(e,25),ch=(e&f)^(~e&g),t1=(hh+S1+ch+K[i]+w[i])|0;
      const S0=r(a,2)^r(a,13)^r(a,22),mj=(a&b)^(a&c)^(b&c),t2=(S0+mj)|0;
      hh=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;
    }
    h=h.map((v,i)=>(v+[a,b,c,d,e,f,g,hh][i])|0);
  }
  return h.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('');
}
const hashPin=p=>sha256('fitpulse:'+String(p).trim().toUpperCase());

// ── Блокируем публикацию в облако в режиме админа ──
const _pub=window.publishToCloud;
window.publishToCloud=async function(silent=true){
  if(isAdmin()){if(!silent)toast('🛠️ Режим админа: публикация в рейтинг отключена');return;}
  return _pub.apply(this,arguments);
};

function refreshAll(){
  save();F.saveP();updateLvlUI();updateDayStreakUI();updatePRList();updateAchUI();renderAvatar();buildThemeGrid();buildEmojiGrid();
  if(F.curTab==='home')F.renderHome();else openTab(F.curTab);
  syncAdminUI();
}
function unlock(id){const P=F.P;if(!P.unlocked.includes(id))P.unlocked.push(id);if(/\p{Extended_Pictographic}/u.test(id)&&!EMOJIS.includes(id))EMOJIS.push(id);}
function completePath(n){const P=F.P;P.path={};for(let i=0;i<n;i++)P.path[i]=3;Object.entries(REW).forEach(([k,v])=>{if(+k<=n)unlock(v);});}
function setStreak(n){
  dayStreak=n;if(n>maxStreak)maxStreak=n;lastWorkoutDate=n>0?localDateKey():null;
  const dates=[];for(let i=0;i<Math.min(n,90);i++){const d=new Date();d.setDate(d.getDate()-i);dates.push(localDateKey(d));}
  localStorage.setItem('fp_workout_dates',JSON.stringify(dates.reverse()));
}

let scrollKeep=0;
function openAdmin(){
  if(!isAdmin())return askPin();
  const P=F.P,pet=window.FPP?.pet(),ST=window.FPP?.STAGES||[];
  const petStage=pet?PET_AT.reduce((a,v,i)=>pet.food>=v?i:a,0):0;
  const curTheme=localStorage.getItem('fp_theme')||'violet';
  const wm=window.FPP?.wrapMode()||'auto';
  const ov=F.sheet(`<div class="fpa">
    <div class="fpa-head"><div class="fpa-ico">🛠️</div>
      <div style="flex:1"><div class="fpa-t">Админ-панель</div><div class="fpa-s">🔒 Онлайн-рейтинг для этого устройства отключён</div></div><button class="fpa-x" data-x title="Закрыть" aria-label="Закрыть"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button></div>

    <button class="fp-cta" data-a="all">👑 Открыть всё</button>
    <div class="fpa-hint">Уровень 100, все темы и аватары, весь Путь на ★★★, серия 30, все достижения, феникс</div>

    <div class="fpa-g"><div class="fpa-sec">⚡ Уровень и опыт</div>
      <div class="fpa-row"><span>Уровень</span><input type="number" class="inp" id="fpaLvl" value="${lvl}" min="1" max="999"><button class="fpa-b pri" data-a="lvl">OK</button><button class="fpa-b" data-a="lvlmax">MAX</button></div>
      <div class="fpa-row"><span>Опыт</span><button class="fpa-b" data-a="xp100">+100</button><button class="fpa-b" data-a="xp1000">+1000</button><button class="fpa-b" data-a="xp10000">+10к</button></div>
    </div>

    <div class="fpa-g"><div class="fpa-sec">🎨 Темы</div>
      <div class="fpa-themes">${THEMES.map(t=>`<button data-theme="${t.id}" class="${t.id===curTheme?'on':''}"><i style="background:linear-gradient(135deg,${t.s1},${t.s2})"></i><span>${t.name}${t.lock&&!P.unlocked.includes(t.id)?' 🔒':''}</span></button>`).join('')}</div>
      <button class="fpa-b wide" data-a="themes">🔓 Открыть все темы и аватары</button>
    </div>

    <div class="fpa-g"><div class="fpa-sec">🗺️ Путь героя · ${Object.keys(P.path).length}/40</div>
      <div class="fpa-row"><span>Пройти до этапа</span><input type="number" class="inp" id="fpaPath" value="${Math.max(10,Object.keys(P.path).length)}" min="0" max="40"><button class="fpa-b pri" data-a="path">OK</button><button class="fpa-b" data-a="path0">Сброс</button></div>
    </div>

    <div class="fpa-g"><div class="fpa-sec">🔥 Серия и награды</div>
      <div class="fpa-row"><span>Серия дней</span><input type="number" class="inp" id="fpaStreak" value="${dayStreak}" min="0" max="999"><button class="fpa-b pri" data-a="streak">OK</button></div>
      <div class="fpa-row"><span>Щиты: ${P.shields}/3</span><button class="fpa-b" data-a="sh3">🛡️ Max</button><button class="fpa-b" data-a="gift">🎁 Подарок</button></div>
      <div class="fpa-row"><span>Сегодня</span><button class="fpa-b" data-a="wod">↺ Тренировка дня</button><button class="fpa-b" data-a="rings">💫 Кольца</button></div>
    </div>

    ${window.FPS?(()=>{const si=FPS.seasonInfo();return`<div class="fpa-g"><div class="fpa-sec">🎫 Сезон «${si.name}» · ур. ${si.level}/${FPS.SMAX}</div>
      <div class="fpa-row"><span>Уровень сезона</span><input type="number" class="inp" id="fpaSeason" value="${si.level}" min="0" max="${FPS.SMAX}"><button class="fpa-b pri" data-a="season">OK</button><button class="fpa-b" data-a="seasonMax">MAX</button></div>
      <div class="fpa-row"><span>Награды</span><button class="fpa-b" data-a="seasonOpen">🎫 Открыть</button><button class="fpa-b" data-a="seasonReset">↺ Сброс</button></div>
    </div>`;})():''}

    <div class="fpa-g"><div class="fpa-sec">🐣 Питомец</div>
      <div class="fpa-pets">${ST.map((s,i)=>`<button data-pet="${i}" class="${i===petStage?'on':''}" title="${s.ru}"><img src="${FPP.petSrc(i)}" alt=""><span>${s.ru}</span></button>`).join('')}</div>
    </div>

    <div class="fpa-g"><div class="fpa-sec">📅 Итоги месяца на главном</div>
      <div class="fpa-seg">${[['auto','Авто · 1-го числа'],['show','Показать'],['hide','Скрыть']].map(([k,l])=>`<button data-wrap="${k}" class="${k===wm?'on':''}">${l}</button>`).join('')}</div>
      <div class="fpa-hint">«Авто» — карточка появляется только 1-го числа с итогами прошлого месяца</div>
    </div>

    <div class="fpa-g"><div class="fpa-sec">👀 Предпросмотр экранов</div>
      <div class="fpa-grid3"><button class="fpa-b" data-a="pv-sum">🏅 Итоги</button><button class="fpa-b" data-a="pv-lvl">⭐ Level Up</button><button class="fpa-b" data-a="pv-wrap">📅 Месяц</button><button class="fpa-b" data-a="pv-onb">👋 Старт</button><button class="fpa-b" data-a="pv-new">✨ Новое</button><button class="fpa-b" data-a="pv-gift">🎁 Сундук</button></div>
    </div>

    <button class="fpa-b wide danger" data-a="off">Выйти из режима админа</button>
    <div class="fpa-hint">Выданный прогресс хранится только на этом устройстве. Начать с нуля — «Профиль → Сбросить весь прогресс».</div>
  </div>`,'fp-sheet-admin');
  ov.querySelector('[data-x]').onclick=()=>{scrollKeep=0;F.closeSheet();};
  const sh=ov.querySelector('.fp-sheet');sh.scrollTop=scrollKeep;sh.addEventListener('scroll',()=>scrollKeep=sh.scrollTop);

  const num=(id,min,max)=>Math.max(min,Math.min(max,parseInt($(id).value)||min));
  const act={
    all(){lvl=100;xp=0;THEMES.forEach(t=>t.lock&&unlock(t.id));Object.values(REW).forEach(unlock);completePath(40);setStreak(Math.max(dayStreak,30));P.shields=3;
      ACH.forEach(a=>achievements[a.k]=true);if(window.FPP){FPP.pet().food=PET_AT[5];FPP.pet().last=Date.now();}toast('👑 Открыто всё!');confetti(2500);},
    lvl(){lvl=num('fpaLvl',1,999);xp=0;toast(`⚡ Уровень ${lvl}`);},
    lvlmax(){lvl=100;xp=0;toast('⚡ Уровень 100');},
    xp100(){addXP(100);},xp1000(){addXP(1000);},xp10000(){addXP(10000);},
    themes(){THEMES.forEach(t=>t.lock&&unlock(t.id));Object.values(REW).forEach(unlock);toast('🔓 Все темы и аватары открыты');},
    path(){completePath(num('fpaPath',0,40));toast('🗺️ Путь обновлён');},
    path0(){completePath(0);P.unlocked=[];toast('🗺️ Путь сброшен');},
    streak(){setStreak(num('fpaStreak',0,999));toast(`🔥 Серия: ${dayStreak}`);},
    sh3(){P.shields=3;toast('🛡️ 3 щита');},
    season(){FPS.setLevel(num('fpaSeason',0,FPS.SMAX));toast(`🎫 Уровень сезона: ${FPS.seasonInfo().level}`);},
    seasonMax(){FPS.setLevel(FPS.SMAX);toast('🎫 Сезон пройден');},
    seasonReset(){FPS.resetSeason();toast('↺ Награды сезона сброшены');},
    seasonOpen(){F.closeSheet();setTimeout(()=>FPS.openSeason(),280);return true;},
    gift(){P.gift.last=F.keyOffset(-1);toast('🎁 Подарок снова доступен');},
    wod(){F.day().plan=false;toast('↺ Тренировку дня можно пройти заново');},
    rings(){const d=F.day();d.reps+=200;d.secs+=40*60;d.xp+=1000;toast('💫 Кольца закрыты');},
    'pv-sum'(){F.closeSheet();setTimeout(()=>F.showSummary({t0:Date.now()-372000,xp0:totalXP()-240,vol0:totalVolume-42,cal0:caloriesBurned-23,pr0:{...prRecords},per:{pushup:18,squat:24},plank:0},null),300);return true;},
    'pv-lvl'(){F.closeSheet();showLevelUpScreen(lvl);return true;},
    'pv-wrap'(){F.closeSheet();if(window.FPP)FPP.openWrapped();return true;},
    'pv-onb'(){F.closeSheet();$('onboardOv')?.classList.add('visible');return true;},
    'pv-new'(){F.closeSheet();openChangelog();return true;},
    'pv-gift'(){P.gift.last=F.keyOffset(-1);F.closeSheet();openTab('home');setTimeout(()=>$('fpGiftCard')?.click(),350);return true;},
    off(){localStorage.removeItem('fp_admin');toast('Режим админа выключен');F.closeSheet();refreshAll();return true;},
  };
  const reopen=()=>setTimeout(openAdmin,260);
  ov.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const stop=act[b.dataset.a]();refreshAll();if(!stop)reopen();});
  ov.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{unlock(b.dataset.theme);setTheme(b.dataset.theme);refreshAll();reopen();});
  ov.querySelectorAll('[data-pet]').forEach(b=>b.onclick=()=>{if(window.FPP){FPP.pet().food=PET_AT[+b.dataset.pet];FPP.pet().last=Date.now();}refreshAll();reopen();});
  ov.querySelectorAll('[data-wrap]').forEach(b=>b.onclick=()=>{window.FPP?.setWrapMode(b.dataset.wrap);refreshAll();reopen();toast(b.dataset.wrap==='hide'?'📅 Итоги месяца скрыты':b.dataset.wrap==='show'?'📅 Итоги месяца показаны на главном':'📅 Итоги — только 1-го числа');});
}

function askPin(){
  const ov=F.sheet(`<div class="fpa fpa-pin">
    <div class="fpa-head"><div class="fpa-ico">🔐</div><div style="flex:1"><div class="fpa-t">Вход для администратора</div><div class="fpa-s">Введите код доступа</div></div><button class="fpa-x" data-x title="Закрыть" aria-label="Закрыть"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button></div>
    <input class="inp fpa-pin-in" id="fpaPin" placeholder="XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false">
    <div class="fpa-pin-err" id="fpaPinErr"></div>
    <button class="fp-cta" id="fpaPinGo">Войти</button></div>`,'fp-sheet-admin');
  ov.querySelector('[data-x]').onclick=F.closeSheet;
  const inp=ov.querySelector('#fpaPin');setTimeout(()=>inp.focus(),300);
  let tries=+(sessionStorage.getItem('fpa_tries')||0);
  const go=()=>{
    if(tries>=5){$('fpaPinErr').textContent='Слишком много попыток. Перезапустите приложение.';return;}
    if(hashPin(inp.value)===ADMIN_HASH){
      localStorage.setItem('fp_admin',ADMIN_HASH);sessionStorage.removeItem('fpa_tries');
      syncAdminUI();toast('🛠️ Режим админа включён');F.closeSheet();setTimeout(openAdmin,280);
    }else{
      tries++;sessionStorage.setItem('fpa_tries',tries);
      $('fpaPinErr').textContent='Неверный код';inp.classList.remove('shake');void inp.offsetWidth;inp.classList.add('shake');
      if(navigator.vibrate)navigator.vibrate([40,40,40]);
    }
  };
  ov.querySelector('#fpaPinGo').onclick=go;inp.onkeydown=e=>{if(e.key==='Enter')go();};
}

// Пункт в меню существует ТОЛЬКО у админа
function syncAdminUI(){
  const on=isAdmin();document.body.classList.toggle('fp-admin',on);
  let b=$('fpaHubBtn');const hub=document.querySelector('#menuHubModal .modal-body');
  if(on&&!b&&hub){b=document.createElement('button');b.id='fpaHubBtn';b.className='m-btn ghost menu-hub-item';b.innerHTML='🛠️ Админ-панель <span class="menu-hub-sub">Уровни, темы, награды</span>';b.onclick=()=>{closeModal('menuHubModal');openAdmin();};hub.appendChild(b);}
  if(!on&&b)b.remove();
}
document.addEventListener('DOMContentLoaded',()=>{
  // старый флаг из прошлой версии больше не даёт доступа
  if(localStorage.getItem('fp_admin')==='1')localStorage.removeItem('fp_admin');
  syncAdminUI();
  let taps=0,tt=null;
  document.querySelector('.app-header .logo')?.addEventListener('click',()=>{
    taps++;clearTimeout(tt);tt=setTimeout(()=>taps=0,1500);
    if(taps>=7){taps=0;openAdmin();}
  });
});
window.FPA={open:openAdmin,hash:hashPin};
})();
