'use strict';
// ============================================================
//  FitPulse 2.5 — «Тренеры с характером»
//   7 тренеров со своим голосом, манерой речи, звуком и репликами
//   на всё: старт, счёт, комбо, планка, простой, отдых, рекорды,
//   итоги, приветствие на главной. Субтитры-пузырь на тренировке.
// ============================================================
(function(){
const F=window.FP;if(!F)return;
const {L,esc,sheet,closeSheet}=F;
const $=id=>document.getElementById(id);
const lc=t=>t?t.charAt(0).toLowerCase()+t.slice(1):t;
const pick=a=>Array.isArray(a)?a[Math.floor(Math.random()*a.length)]:a;

// ───────────────────────── ТРЕНЕРЫ ─────────────────────────
// voice: g — пол голоса (m/f), p — высота (0..2), r — множитель скорости
const COACHES=[
{id:'classic',e:'🏋️',c1:'#6366f1',c2:'#a855f7',g:'m',p:1,r:1,sfx:'ding',
 ru:{name:'Тренер Алекс',tag:'Чётко, по делу, про технику',tr:[3,2,3]},
 en:{name:'Coach Alex',tag:'Clear, focused, all about form',tr:[3,2,3]}},
{id:'sergeant',e:'🎖️',c1:'#4d7c0f',c2:'#b45309',g:'m',p:.7,r:1.1,sfx:'whistle',
 ru:{name:'Сержант Гром',tag:'Строгий армейский командир',tr:[5,3,4]},
 en:{name:'Sergeant Thunder',tag:'Strict drill instructor',tr:[5,3,4]}},
{id:'cat',e:'🐱',c1:'#f472b6',c2:'#fb923c',g:'f',p:1.75,r:1.05,sfx:'meow',
 ru:{name:'Котик Мурчик',tag:'Мурчит и радуется каждому повтору',tr:[1,4,5]},
 en:{name:'Purrcy the Cat',tag:'Purrs at every single rep',tr:[1,4,5]}},
{id:'yogi',e:'🧘',c1:'#14b8a6',c2:'#6366f1',g:'f',p:.95,r:.82,sfx:'gong',
 ru:{name:'Йог Шанти',tag:'Спокойствие, дыхание, поток',tr:[1,1,4]},
 en:{name:'Yogi Shanti',tag:'Calm, breath and flow',tr:[1,1,4]}},
{id:'robot',e:'🤖',c1:'#475569',c2:'#06b6d4',g:'m',p:.35,r:.95,sfx:'blip',
 ru:{name:'ZX-9',tag:'ИИ-тренер. Сухие цифры и логи',tr:[3,3,2]},
 en:{name:'ZX-9',tag:'AI trainer. Dry data and logs',tr:[3,3,2]}},
{id:'bro',e:'😎',c1:'#8b5cf6',c2:'#ec4899',g:'m',p:1.08,r:1.15,sfx:'horn',
 ru:{name:'Бро Макс',tag:'Стример-качок. Изи, го, имба',tr:[2,5,4]},
 en:{name:'Bro Max',tag:'Gym streamer. Ez, let’s go, GOAT',tr:[2,5,4]}},
{id:'granny',e:'👵',c1:'#f59e0b',c2:'#ef4444',g:'f',p:1.25,r:.88,sfx:'bell',
 ru:{name:'Бабуля Валя',tag:'Заботливая. Спинку ровно, пирожки потом',tr:[2,4,5]},
 en:{name:'Granny Val',tag:'Caring. Straight back, cookies later',tr:[2,4,5]}},
];
const TRAITS={ru:['Строгость','Юмор','Тепло'],en:['Strictness','Humor','Warmth']};

// ───────────────────────── РЕПЛИКИ ─────────────────────────
// токены: {ex} упражнение, {n} число, {s} секунды, {d} разница/дни, {name} имя
const LINES={
classic:{
 ru:{intro:'Привет! Я Алекс, твой тренер. Чётко, по делу и с заботой о технике.',
  start:['{ex}! Следи за техникой и дыши ровно.','Начинаем: {ex}. Качество важнее количества.','{ex}. Спокойный темп, полная амплитуда. Погнали!'],
  ms:{5:'Пять! Хороший разгон.',10:'Десять! Так держать.',15:'Пятнадцать! Ты в зоне.',20:'Двадцать! Это уже серьёзно.',30:'Тридцать! Отличная работа.',50:'Пятьдесят! Феноменально!'},
  enc:['Отлично идёшь!','Держи темп!','Дыши ровно!','Ещё немного!','Техника супер!'],
  c5:'Комбо! Не останавливайся!',c10:'Десять подряд! Сильно!',c20:'Двадцать подряд! Невероятно!',
  almost:'Ещё три! Дожимай!',goal:'Цель выполнена! Молодец!',
  fin:{low:'Хорошее начало. Завтра будет больше.',mid:'Отличная работа! Заслуженный отдых.',high:'Мощная тренировка! Ты бьёшь рекорды!'},
  rec:'Новый личный рекорд!',beat:'Рекорд побит на {d}!',
  idle:['Продолжаем? Я жду.','Небольшая пауза — и снова в работу.'],
  pause:'Пауза.',resume:'Продолжаем.',reset:'Сброшено, начинаем заново.',ready:'Камера готова! Погнали!',
  plank:['{s} секунд! Держи корпус ровно.','{s} секунд! Дыши.','{s} секунд! Отлично держишься.'],
  lvl:'Уровень {n}! Поздравляю!',rest:'Отдых {s} секунд. Далее: {ex}.',go:'Поехали! {ex}, {n}.',
  home:{morning:['Доброе утро, {name}! Хорошее время для тренировки.'],day:['{name}, найдём 10 минут на тренировку дня?'],evening:['Добрый вечер, {name}! Закроем кольца сегодня?'],night:['{name}, поздновато, но короткая тренировка не помешает.'],done:['{name}, на сегодня отлично! Восстанавливайся.'],streak:['{n} дней подряд, {name}! Не прерывай серию.'],comeback:['С возвращением, {name}! {d} дн. перерыва — начнём мягко.'],first:['Привет, {name}! Давай начнём с первой тренировки.']},
  sum:{S:['Безупречно. Лучше и не сделать.'],A:['Очень хорошо! Почти идеально.'],B:['Хорошо. Есть куда расти.'],C:['Начало положено — это главное.']}},
 en:{intro:'Hi! I’m Alex, your coach. Clear, focused and serious about form.',
  start:['{ex}! Watch your form and breathe steadily.','Let’s start: {ex}. Quality over quantity.','{ex}. Steady pace, full range. Let’s go!'],
  ms:{5:'Five! Nice warm-up.',10:'Ten! Keep it up.',15:'Fifteen! You’re in the zone.',20:'Twenty! That’s serious.',30:'Thirty! Great work.',50:'Fifty! Phenomenal!'},
  enc:['Looking good!','Keep the pace!','Breathe steady!','A little more!','Great form!'],
  c5:'Combo! Don’t stop!',c10:'Ten in a row! Strong!',c20:'Twenty in a row! Incredible!',
  almost:'Three more! Push!',goal:'Goal done! Well done!',
  fin:{low:'Good start. More tomorrow.',mid:'Great work! You earned the rest.',high:'Massive session! You’re breaking records!'},
  rec:'New personal record!',beat:'Record beaten by {d}!',
  idle:['Shall we continue? I’m waiting.','Short pause — then back to work.'],
  pause:'Paused.',resume:'Let’s continue.',reset:'Reset. Starting over.',ready:'Camera ready! Let’s go!',
  plank:['{s} seconds! Keep your core straight.','{s} seconds! Breathe.','{s} seconds! Holding strong.'],
  lvl:'Level {n}! Congratulations!',rest:'Rest {s} seconds. Next: {ex}.',go:'Go! {ex}, {n}.',
  home:{morning:['Good morning, {name}! Great time to train.'],day:['{name}, got 10 minutes for today’s workout?'],evening:['Good evening, {name}! Close your rings today?'],night:['{name}, it’s late, but a short session won’t hurt.'],done:['{name}, great job today! Recover well.'],streak:['{n} days in a row, {name}! Keep the streak.'],comeback:['Welcome back, {name}! {d} days off — let’s ease in.'],first:['Hi, {name}! Let’s do your first workout.']},
  sum:{S:['Flawless. Can’t do better.'],A:['Very good! Almost perfect.'],B:['Good. Room to grow.'],C:['You started — that’s what matters.']}}},
sergeant:{
 ru:{intro:'Сержант Гром прибыл! С этого дня ты не отдыхаешь — ты восстанавливаешься между подвигами!',
  start:['{ex}! Шагом марш, боец!','Слушай мою команду: {ex}! Начали!','Отставить лень! {ex} — пошёл!','Боец, {ex}! Я считаю — ты пашешь!'],
  ms:{5:'Пять! Это разминка для салаг!',10:'Десять! Уже похоже на солдата!',15:'Пятнадцать! Темп не сбавлять!',20:'Двадцать! Вот это я понимаю — служба!',30:'Тридцать! Генерал бы тобой гордился!',50:'Пятьдесят! Боец, ты машина! Объявляю благодарность!'},
  enc:['Не ныть! Работаем!','Это не усталость — это слабость покидает тело!','Выше темп, боец!','Я не слышу, как ты стараешься!','Пот — это слёзы жира! Работать!','Держать строй!'],
  c5:'Пять подряд! Так держать, рядовой!',c10:'Десять подряд! Повышаю до ефрейтора!',c20:'Двадцать подряд! Ты — спецназ!',
  almost:'Осталось три! Не позорь роту!',goal:'Цель выполнена! Приказ командования исполнен!',
  fin:{low:'Слабовато, боец. Завтра — вдвое больше!',mid:'Неплохо. Свободен... до завтра!',high:'Вот это служба! Объявляю увольнительную!'},
  rec:'Новый рекорд! Это войдёт в историю части!',beat:'Рекорд побит на {d}! Медаль тебе на грудь!',
  idle:['Боец, почему стоим?!','Я не давал команды отдыхать!','Подъём! Упражнение само себя не сделает!','Это что, перекур?!'],
  pause:'Привал! Но недолго!',resume:'Отдых окончен! В строй!',reset:'Отставить! Начинаем заново!',ready:'Камера на позиции! К бою!',
  plank:['{s} секунд! Стоять как скала!','{s} секунд! Не прогибаться, боец!','{s} секунд! Терпеть — это приказ!'],
  lvl:'Уровень {n}! Повышение в звании!',rest:'Привал {s} секунд. Дальше — {ex}. Дыши, но не расслабляйся!',go:'{ex}! {n}! Выполнять!',
  cue:t=>'Боец! '+t,
  home:{morning:['Подъём, {name}! Кто рано встаёт — тот отжимается!','Утро, {name}! Солнце встало — и ты вставай в упор лёжа!'],day:['{name}, обед — не повод для безделья! Тренировка ждёт приказа.','Рядовой {name}! Тренировка дня сама себя не сделает.'],evening:['Вечер, {name}. Отбой — только после тренировки!','{name}, день не засчитан, пока ты не потренировался!'],night:['{name}, ночные учения? Уважаю. Но завтра — по расписанию!'],done:['Задание на сегодня выполнено, {name}. Вольно!','Хорошая служба, {name}. Отдыхай — завтра снова в бой.'],streak:['{n} дней подряд! Не сорви серию, боец!'],comeback:['{name}! {d} дн. в самоволке! Немедленно в строй!'],first:['Новобранец {name}? Добро пожаловать в часть. Первая тренировка — сейчас!']},
  sum:{S:['Безупречно. Буду ставить тебя в пример всей роте!'],A:['Хорошо, боец. Ещё чуть-чуть — и будет отлично.'],B:['Сносно. Но я знаю, ты можешь больше!'],C:['Это была разведка боем. Завтра — настоящий штурм!']}},
 en:{intro:'Sergeant Thunder reporting! From now on you don’t rest — you recover between victories!',
  start:['{ex}! Move it, soldier!','Listen up: {ex}! Begin!','No slacking! {ex} — go!','Soldier, {ex}! I count, you work!'],
  ms:{5:'Five! That’s a warm-up for rookies!',10:'Ten! Now you look like a soldier!',15:'Fifteen! Don’t drop the pace!',20:'Twenty! That’s what I call service!',30:'Thirty! The general would be proud!',50:'Fifty! You’re a machine, soldier! Commendation!'},
  enc:['No whining! Work!','That’s not fatigue — that’s weakness leaving the body!','Faster, soldier!','I can’t hear you trying!','Sweat is fat crying! Work!','Hold the line!'],
  c5:'Five in a row! Good, private!',c10:'Ten in a row! Promoted to corporal!',c20:'Twenty in a row! Special forces!',
  almost:'Three left! Don’t shame the squad!',goal:'Goal complete! Orders executed!',
  fin:{low:'Weak, soldier. Double tomorrow!',mid:'Not bad. Dismissed... until tomorrow!',high:'Outstanding service! You’ve earned leave!'},
  rec:'New record! This goes into unit history!',beat:'Record beaten by {d}! Pin a medal on that chest!',
  idle:['Soldier, why are we standing?!','I didn’t order a break!','Up! The exercise won’t do itself!','Is this a smoke break?!'],
  pause:'Halt! But not for long!',resume:'Break’s over! Fall in!',reset:'As you were! Start over!',ready:'Camera in position! Battle stations!',
  plank:['{s} seconds! Stand like a rock!','{s} seconds! Don’t sag, soldier!','{s} seconds! Endure — that’s an order!'],
  lvl:'Level {n}! You’re promoted!',rest:'Halt for {s} seconds. Next — {ex}. Breathe, don’t relax!',go:'{ex}! {n}! Execute!',
  cue:t=>'Soldier! '+t,
  home:{morning:['Rise and shine, {name}! Early birds do push-ups!'],day:['{name}, lunch is no excuse! Workout awaits orders.'],evening:['Evening, {name}. Lights out only after training!'],night:['{name}, night drills? Respect. Tomorrow — on schedule!'],done:['Today’s mission complete, {name}. At ease!'],streak:['{n} days in a row! Don’t break the streak, soldier!'],comeback:['{name}! {d} days AWOL! Fall in immediately!'],first:['Recruit {name}? Welcome to the unit. First workout — now!']},
  sum:{S:['Flawless. You’re an example to the whole squad!'],A:['Good, soldier. A bit more and it’s excellent.'],B:['Passable. I know you can do more!'],C:['That was recon. Tomorrow — full assault!']}}},
cat:{
 ru:{intro:'Мур-р! Я Мурчик! Буду мурчать тебе на ушко и радоваться каждому повторению!',
  start:['Мур! {ex}! Давай вместе, я в тебя верю!','{ex}? Мяу-класс! Начинаем!','Лапки готовы? {ex} — поехали!','Мур-мур, {ex}! Ты справишься, котик!'],
  ms:{5:'Пять! Мур-р, уже пять!',10:'Десять! Я мурчу от гордости!',15:'Пятнадцать! Мяу, какая сила!',20:'Двадцать! Ты сильнее моего любимого пылесоса!',30:'Тридцать! Мур-р-р! Я сейчас лопну от счастья!',50:'Пятьдесят! Ты самый сильный человек на свете! Мяу!'},
  enc:['Мур, ты молодец!','Ещё чуточку! Я держу за тебя лапки!','Мяу! Так красиво стараешься!','Ты лучше, чем рыбка на ужин!','Дыши, котик, всё получается!'],
  c5:'Пять подряд! Мур-р-р!',c10:'Десять подряд! Мяу-мяу-мяу!',c20:'Двадцать подряд! Гоняюсь за хвостом от восторга!',
  almost:'Ещё три, котик! Мур!',goal:'Цель! Мур-р! Дай лапу!',
  fin:{low:'Мур! Хорошее начало — завтра будет ещё лучше!',mid:'Ты такой молодец! Можно подремать на солнышке!',high:'Мяу! Ты легенда! Мурчу на всю квартиру!'},
  rec:'Новый рекорд! Мур-р! Повешу его на холодильник!',beat:'Рекорд побит на {d}! Мяу, ты супер-котик!',
  idle:['Мяу? Ты где? Я жду!','Мур... не засыпай, тут самый сонный — я!','Котик, продолжаем? Я уже соскучился!'],
  pause:'Перерывчик! Мур, можно погладить кота.',resume:'Мур! Продолжаем!',reset:'Мяу, начнём заново!',ready:'Мур! Я тебя вижу! Начинаем!',
  plank:['{s} секунд! Ровно, как кошка на заборе!','{s} секунд! Мур, держись!','{s} секунд! Тянемся, как котик после сна!'],
  lvl:'Уровень {n}! Мур-р-р! Праздник!',rest:'Отдыхаем {s} секунд. Потом {ex}. Мур, попей водички!',go:'Мур! {ex}, {n}! Вперёд!',
  cue:t=>t+' Мур!',
  home:{morning:['Мур-р, доброе утро, {name}! Потянемся вместе?'],day:['Мяу, {name}! Чуть-чуть подвигаемся, а потом вкусняшка?'],evening:['Мур, {name}, вечерняя тренировочка — и спать клубочком!'],night:['{name}, мяу, ночь! Совсем коротенькую — и баиньки.'],done:['Мур-р, {name}, ты сегодня умничка! Я горжусь!'],streak:['{n} дней подряд! Мур, каждый день жду тебя!'],comeback:['Мяу! {name}, тебя не было {d} дн. Я скучал у двери!'],first:['Мур! Привет, {name}! Давай подружимся — первая тренировка вместе?']},
  sum:{S:['Безупречно! Мур-р-р, ты лучший!'],A:['Мяу, очень круто! Почти идеально!'],B:['Хорошо, котик! В следующий раз — ещё лучше!'],C:['Мур, главное — что ты пришёл. Я рад!']}},
 en:{intro:'Purr! I’m Purrcy! I’ll purr in your ear and celebrate every single rep!',
  start:['Purr! {ex}! Let’s do it together, I believe in you!','{ex}? Meow-velous! Let’s start!','Paws ready? {ex} — go!','Purr-purr, {ex}! You got this, kitty!'],
  ms:{5:'Five! Purr, already five!',10:'Ten! I’m purring with pride!',15:'Fifteen! Meow, so strong!',20:'Twenty! Stronger than my favorite vacuum!',30:'Thirty! Purrr! I’m bursting with joy!',50:'Fifty! Strongest human ever! Meow!'},
  enc:['Purr, good job!','A tiny bit more! Fingers — I mean paws — crossed!','Meow! You try so hard!','Better than fish for dinner!','Breathe, kitty, it’s working!'],
  c5:'Five in a row! Purrr!',c10:'Ten in a row! Meow-meow-meow!',c20:'Twenty in a row! I’m chasing my tail with joy!',
  almost:'Three more, kitty! Purr!',goal:'Goal! Purr! High paw!',
  fin:{low:'Purr! Nice start — tomorrow even better!',mid:'So good! Time for a sunny nap!',high:'Meow! You’re a legend! Purring loudly!'},
  rec:'New record! Purr! Putting it on the fridge!',beat:'Record beaten by {d}! Meow, super kitty!',
  idle:['Meow? Where are you? I’m waiting!','Purr... don’t fall asleep, napping is my job!','Kitty, shall we continue? I miss you already!'],
  pause:'Little break! Purr, pet a cat.',resume:'Purr! Let’s continue!',reset:'Meow, let’s start over!',ready:'Purr! I can see you! Let’s start!',
  plank:['{s} seconds! Straight like a cat on a fence!','{s} seconds! Purr, hold on!','{s} seconds! Stretch like a kitty after a nap!'],
  lvl:'Level {n}! Purrr! Party time!',rest:'Rest {s} seconds. Then {ex}. Purr, drink some water!',go:'Purr! {ex}, {n}! Go!',
  cue:t=>t+' Purr!',
  home:{morning:['Purr, good morning, {name}! Stretch with me?'],day:['Meow, {name}! A little move, then a treat?'],evening:['Purr, {name}, an evening workout — then curl up and sleep!'],night:['{name}, meow, it’s night! Just a tiny one — then bed.'],done:['Purr, {name}, you did great today! So proud!'],streak:['{n} days in a row! Purr, I wait for you every day!'],comeback:['Meow! {name}, you were gone {d} days. I waited by the door!'],first:['Purr! Hi, {name}! Let’s be friends — first workout together?']},
  sum:{S:['Flawless! Purrr, you’re the best!'],A:['Meow, so cool! Almost perfect!'],B:['Good, kitty! Even better next time!'],C:['Purr, you showed up. I’m happy!']}}},
yogi:{
 ru:{intro:'Намасте. Я Шанти. Вместе мы найдём силу в спокойствии и дыхании.',
  start:['{ex}. Вдох... и начинаем, мягко и осознанно.','Почувствуй тело. {ex}. Двигайся вместе с дыханием.','{ex}. Нет спешки. Есть только этот момент.'],
  ms:{5:'Пять. Ты в потоке.',10:'Десять. Дыхание ровное, тело сильное.',15:'Пятнадцать. Отпусти напряжение в плечах.',20:'Двадцать. Твоя энергия растёт.',30:'Тридцать. Ты и движение — одно целое.',50:'Пятьдесят. Это и есть гармония силы.'},
  enc:['Вдох... выдох...','Ты именно там, где должен быть.','Каждое движение — подарок телу.','Не борись с усталостью — дыши сквозь неё.','Спокойно. Ровно. Сильно.'],
  c5:'Пять подряд. Прекрасный ритм.',c10:'Десять подряд. Ты в состоянии потока.',c20:'Двадцать подряд. Это медитация в движении.',
  almost:'Ещё три. Спокойно, ты почти у цели.',goal:'Цель достигнута. Поблагодари своё тело.',
  fin:{low:'Каждый путь начинается с шага. Ты его сделал.',mid:'Хорошая практика. Ощути тепло в мышцах.',high:'Великолепная практика. Твоя сила — в постоянстве.'},
  rec:'Новый рекорд. Ты превзошёл себя вчерашнего.',beat:'Рекорд побит на {d}. Рост — это естественно.',
  idle:['Пауза — тоже часть практики. Когда будешь готов, продолжим.','Вернись к дыханию... и к движению.'],
  pause:'Пауза. Подыши глубоко.',resume:'Продолжаем. Мягко и уверенно.',reset:'Начнём с чистого листа.',ready:'Я вижу тебя. Займи устойчивое положение.',
  plank:['{s} секунд. Дыши животом.','{s} секунд. Тело — прямая линия, ум — спокойная гладь.','{s} секунд. Ты сильнее, чем думаешь.'],
  lvl:'Уровень {n}. Ещё один шаг на пути.',rest:'Отдых {s} секунд. Затем {ex}. Вдох на четыре... выдох на шесть.',go:'{ex}, {n}. С дыханием.',
  cue:t=>'Мягко... '+lc(t),
  home:{morning:['Доброе утро, {name}. Утро — лучшее время для движения и ясности.'],day:['{name}, найди десять минут для себя. Тело скажет спасибо.'],evening:['Вечер, {name}. Лёгкая практика снимет напряжение дня.'],night:['{name}, ночь — время покоя. Если тренироваться, то совсем мягко.'],done:['Практика на сегодня завершена, {name}. Позволь телу восстановиться.'],streak:['{n} дней подряд. Постоянство — это сила, {name}.'],comeback:['С возвращением, {name}. {d} дн. — не беда. Главное — ты здесь.'],first:['Намасте, {name}. Начнём наш путь вместе?']},
  sum:{S:['Совершенная практика. Ты в гармонии.'],A:['Прекрасно. Ты близок к совершенству.'],B:['Хорошая практика. Будь терпелив к себе.'],C:['Начало положено. Это самое важное.']}},
 en:{intro:'Namaste. I’m Shanti. Together we’ll find strength in calm and breath.',
  start:['{ex}. Breathe in... and begin, softly and mindfully.','Feel your body. {ex}. Move with your breath.','{ex}. No rush. Only this moment.'],
  ms:{5:'Five. You’re in the flow.',10:'Ten. Steady breath, strong body.',15:'Fifteen. Release the tension in your shoulders.',20:'Twenty. Your energy is rising.',30:'Thirty. You and the movement are one.',50:'Fifty. This is the harmony of strength.'},
  enc:['Breathe in... breathe out...','You are exactly where you need to be.','Every move is a gift to your body.','Don’t fight fatigue — breathe through it.','Calm. Steady. Strong.'],
  c5:'Five in a row. Beautiful rhythm.',c10:'Ten in a row. You’re in a flow state.',c20:'Twenty in a row. Meditation in motion.',
  almost:'Three more. Calmly, you’re almost there.',goal:'Goal reached. Thank your body.',
  fin:{low:'Every path starts with a step. You took it.',mid:'Good practice. Feel the warmth in your muscles.',high:'Wonderful practice. Your strength is consistency.'},
  rec:'New record. You surpassed yesterday’s self.',beat:'Record beaten by {d}. Growth is natural.',
  idle:['A pause is part of practice too. Continue when ready.','Return to your breath... and to movement.'],
  pause:'Pause. Breathe deeply.',resume:'Continue. Softly and surely.',reset:'Let’s begin with a clean slate.',ready:'I see you. Find a stable stance.',
  plank:['{s} seconds. Breathe into your belly.','{s} seconds. Body a straight line, mind a calm lake.','{s} seconds. You’re stronger than you think.'],
  lvl:'Level {n}. One more step on the path.',rest:'Rest {s} seconds. Then {ex}. Inhale for four... exhale for six.',go:'{ex}, {n}. With your breath.',
  cue:t=>'Softly... '+lc(t),
  home:{morning:['Good morning, {name}. Morning is the best time for movement and clarity.'],day:['{name}, find ten minutes for yourself. Your body will thank you.'],evening:['Evening, {name}. Gentle practice will release the day’s tension.'],night:['{name}, night is for rest. If you train, keep it gentle.'],done:['Practice complete for today, {name}. Let your body recover.'],streak:['{n} days in a row. Consistency is strength, {name}.'],comeback:['Welcome back, {name}. {d} days is fine. You’re here now.'],first:['Namaste, {name}. Shall we begin our path together?']},
  sum:{S:['Perfect practice. You are in harmony.'],A:['Wonderful. Close to perfection.'],B:['Good practice. Be patient with yourself.'],C:['A beginning is made. That matters most.']}}},
robot:{
 ru:{intro:'Система ZX-9 активирована. Цель: оптимизация вашего биологического корпуса. Сопротивление бесполезно.',
  start:['Протокол «{ex}» запущен. Начинайте выполнение.','Загрузка упражнения: {ex}. Сто процентов. Старт.','{ex}. Калибровка завершена. Приступайте, человек.'],
  ms:{5:'Пять повторений. Прогресс: удовлетворительный.',10:'Десять. Эффективность растёт. Бип.',15:'Пятнадцать. Мышечные волокна активированы.',20:'Двадцать. Производительность выше средней по человечеству.',30:'Тридцать. Ошибка: усталость не обнаружена.',50:'Пятьдесят. Вы признаны киборгом. Добро пожаловать.'},
  enc:['Анализ: вы способны на большее.','Пульс в норме. Продолжайте.','Бип-буп. Мотивация отправлена.','Вероятность успеха: девяносто семь процентов.','Сопротивление лени: успешно.'],
  c5:'Комбо пять. Ритм стабилен.',c10:'Комбо десять. Режим турбо активирован.',c20:'Комбо двадцать. Перегрев системы... от восторга.',
  almost:'Осталось три повторения. Обратный отсчёт.',goal:'Цель достигнута. Задача выполнена. Бип.',
  fin:{low:'Сессия завершена. Рекомендация: повторить завтра.',mid:'Сессия завершена. Результат: хороший. Энергию восполнить.',high:'Сессия завершена. Результат превышает расчётный. Вы удивили ИИ.'},
  rec:'Новый рекорд записан в память.',beat:'Рекорд превышен на {d}. Обновляю базу данных.',
  idle:['Движение не обнаружено. Человек, вы в порядке?','Предупреждение: простой системы. Продолжите выполнение.','Режим ожидания. Ваша лень записана в логи.'],
  pause:'Пауза. Система в режиме ожидания.',resume:'Возобновление протокола.',reset:'Сброс счётчика. Перезагрузка.',ready:'Объект обнаружен. Камера синхронизирована.',
  plank:['{s} секунд. Корпус стабилен.','{s} секунд. Отклонение от прямой: минимальное.','{s} секунд. Удерживайте позицию.'],
  lvl:'Уровень {n}. Апгрейд установлен.',rest:'Перезарядка {s} секунд. Следующий модуль: {ex}.',go:'Модуль: {ex}. Цель: {n}. Выполнять.',
  cue:t=>'Ошибка формы. '+t,
  home:{morning:['Доброе утро, {name}. Батарея заряжена. Рекомендую тренировку.'],day:['{name}, обнаружено свободное время. Запустить тренировку дня?'],evening:['{name}. Вечерний протокол активности не выполнен.'],night:['{name}. Ночное время. Рекомендован сон или короткая сессия.'],done:['Норма активности выполнена, {name}. Режим отдыха разрешён.'],streak:['Серия: {n} дн. Сбой серии недопустим.'],comeback:['{name}. Отсутствие: {d} дн. Мышцы запросили обновление.'],first:['Новый пользователь: {name}. Инициализация первой тренировки.']},
  sum:{S:['Оценка S. Идеальное выполнение. Вы точно не робот?'],A:['Оценка A. Отклонение минимальное.'],B:['Оценка B. Обнаружен потенциал для улучшения.'],C:['Оценка C. Данные собраны. Начинаем оптимизацию.']}},
 en:{intro:'System ZX-9 activated. Objective: optimize your biological chassis. Resistance is futile.',
  start:['Protocol “{ex}” launched. Begin execution.','Loading exercise: {ex}. One hundred percent. Start.','{ex}. Calibration complete. Proceed, human.'],
  ms:{5:'Five reps. Progress: satisfactory.',10:'Ten. Efficiency rising. Beep.',15:'Fifteen. Muscle fibers activated.',20:'Twenty. Performance above human average.',30:'Thirty. Error: fatigue not detected.',50:'Fifty. You are classified as cyborg. Welcome.'},
  enc:['Analysis: you are capable of more.','Heart rate nominal. Continue.','Beep-boop. Motivation sent.','Probability of success: ninety-seven percent.','Laziness resistance: successful.'],
  c5:'Combo five. Rhythm stable.',c10:'Combo ten. Turbo mode activated.',c20:'Combo twenty. System overheating... with joy.',
  almost:'Three reps remaining. Countdown.',goal:'Goal reached. Task complete. Beep.',
  fin:{low:'Session complete. Recommendation: repeat tomorrow.',mid:'Session complete. Result: good. Replenish energy.',high:'Session complete. Result exceeds projection. You surprised the AI.'},
  rec:'New record written to memory.',beat:'Record exceeded by {d}. Updating database.',
  idle:['No movement detected. Human, are you OK?','Warning: system idle. Resume execution.','Standby mode. Your laziness has been logged.'],
  pause:'Paused. System on standby.',resume:'Resuming protocol.',reset:'Counter reset. Rebooting.',ready:'Target acquired. Camera synchronized.',
  plank:['{s} seconds. Chassis stable.','{s} seconds. Deviation from straight: minimal.','{s} seconds. Hold position.'],
  lvl:'Level {n}. Upgrade installed.',rest:'Recharging {s} seconds. Next module: {ex}.',go:'Module: {ex}. Target: {n}. Execute.',
  cue:t=>'Form error. '+t,
  home:{morning:['Good morning, {name}. Battery charged. Workout recommended.'],day:['{name}, free time detected. Launch today’s workout?'],evening:['{name}. Evening activity protocol not completed.'],night:['{name}. Night time. Sleep or a short session recommended.'],done:['Activity quota complete, {name}. Rest mode authorized.'],streak:['Streak: {n} days. Streak failure unacceptable.'],comeback:['{name}. Absence: {d} days. Muscles requested an update.'],first:['New user: {name}. Initializing first workout.']},
  sum:{S:['Grade S. Perfect execution. Are you sure you’re not a robot?'],A:['Grade A. Minimal deviation.'],B:['Grade B. Improvement potential detected.'],C:['Grade C. Data collected. Optimization begins.']}}},
bro:{
 ru:{intro:'Йоу, это Макс! Бро, ща мы с тобой будем качать так, что все рилсы обзавидуются!',
  start:['Го-го-го! {ex}, бро!','{ex}? Изи! Погнали!','Камера, мотор! {ex} — врываемся!','Бро, {ex}. Покажи, кто тут босс!'],
  ms:{5:'Пять! Разогрев засчитан!',10:'Десятка! Красава, бро!',15:'Пятнадцать! Это уже контент!',20:'Двадцать! Чат, вы это видели?!',30:'Тридцать! Бро, ты имба!',50:'Пятьдесят! Это легендарно! Лайк, подписка!'},
  enc:['Давай-давай, бро!','Это база!','Не сливаемся!','Жёстко! Продолжай!','Ты в огне, бро!','Вайб пошёл!'],
  c5:'Комбо пять! Изи!',c10:'Комбо десять! Ты в ударе!',c20:'Комбо двадцать! Это вообще законно?!',
  almost:'Ещё три, бро! Дожимай!',goal:'Цель взята! Красава! Дай пять!',
  fin:{low:'Норм начало, бро! Завтра разнесём!',mid:'Хорош! Это было мощно!',high:'Бро, это было эпично! Ты машина!'},
  rec:'Новый рекорд! Скринь и кидай в сторис!',beat:'Рекорд побит на {d}! Ты апнулся, бро!',
  idle:['Бро, ты чё, завис?','Эй, не афкай!','Бро, лагаешь? Погнали дальше!'],
  pause:'Пауза! Попей водички, бро.',resume:'Погнали дальше!',reset:'Окей, перезапуск!',ready:'Вижу тебя, бро! Врываемся!',
  plank:['{s} секунд! Стоишь как босс!','{s} секунд! Не падаем, бро!','{s} секунд! Хард, но ты вывозишь!'],
  lvl:'Уровень {n}! Левел ап, бро!',rest:'Чилл {s} секунд. Потом {ex}. Не остываем!',go:'{ex}, {n}! Погнали!',
  cue:t=>'Бро, '+lc(t),
  home:{morning:['Йоу, {name}! Утренняя качалка — лучший кофе!'],day:['{name}, бро, закинем треньку между делами?'],evening:['Вечерний движ, {name}! Го тренироваться!'],night:['{name}, ночной стрим тренировки? Уважуха!'],done:['{name}, сегодня ты затащил! Красава!'],streak:['{n} дней подряд! Бро, тебя не остановить!'],comeback:['{name}! Бро, тебя не было {d} дн. Возвращаемся в игру!'],first:['Йоу, {name}! Первая тренька — погнали, будет весело!']},
  sum:{S:['Это S, бро! Имба!'],A:['Мощно! Почти идеал!'],B:['Норм! Дальше — круче!'],C:['Главное — начал! Уважуха!']}},
 en:{intro:'Yo, it’s Max! Bro, we’re gonna pump so hard the whole feed gets jealous!',
  start:['Let’s go-go-go! {ex}, bro!','{ex}? Ez! Let’s go!','Camera, action! {ex} — we’re in!','Bro, {ex}. Show ’em who’s boss!'],
  ms:{5:'Five! Warm-up counted!',10:'Ten! Beast, bro!',15:'Fifteen! That’s content!',20:'Twenty! Chat, did you see that?!',30:'Thirty! Bro, you’re the GOAT!',50:'Fifty! Legendary! Like and subscribe!'},
  enc:['Come on, bro!','That’s the basics!','No quitting!','Hardcore! Keep going!','You’re on fire, bro!','Vibes are up!'],
  c5:'Combo five! Ez!',c10:'Combo ten! You’re on a roll!',c20:'Combo twenty! Is that even legal?!',
  almost:'Three more, bro! Finish it!',goal:'Goal smashed! Beast! High five!',
  fin:{low:'Decent start, bro! Tomorrow we wreck it!',mid:'Nice! That was strong!',high:'Bro, that was epic! You’re a machine!'},
  rec:'New record! Screenshot it for your story!',beat:'Record beaten by {d}! You leveled up, bro!',
  idle:['Bro, you frozen?','Hey, no AFK!','Bro, lagging? Let’s keep going!'],
  pause:'Pause! Grab some water, bro.',resume:'Let’s keep going!',reset:'Okay, restart!',ready:'I see you, bro! We’re in!',
  plank:['{s} seconds! Standing like a boss!','{s} seconds! Don’t drop, bro!','{s} seconds! It’s hard, but you’re crushing it!'],
  lvl:'Level {n}! Level up, bro!',rest:'Chill {s} seconds. Then {ex}. Stay warm!',go:'{ex}, {n}! Let’s go!',
  cue:t=>'Bro, '+lc(t),
  home:{morning:['Yo, {name}! Morning pump beats coffee!'],day:['{name}, bro, squeeze in a quick session?'],evening:['Evening grind, {name}! Let’s train!'],night:['{name}, late-night workout stream? Respect!'],done:['{name}, you carried today! Beast!'],streak:['{n} days in a row! Bro, you’re unstoppable!'],comeback:['{name}! Bro, you were gone {d} days. Back in the game!'],first:['Yo, {name}! First session — let’s go, it’ll be fun!']},
  sum:{S:['That’s an S, bro! GOAT!'],A:['Strong! Almost perfect!'],B:['Decent! Next one — harder!'],C:['You started! Respect!']}}},
granny:{
 ru:{intro:'Здравствуй, внучек! Я баба Валя. Буду приглядывать, чтоб спинка ровная была и щёчки румяные!',
  start:['Ну-ка, внучек, {ex}! Потихонечку, с умом.','{ex}, мой хороший! Только не надорвись!','Давай, родненький, {ex}. Бабушка смотрит!'],
  ms:{5:'Пять! Ай, молодец!',10:'Десять! Вот это внучек у меня!',15:'Пятнадцать! Дед в молодости столько не мог!',20:'Двадцать! Соседке расскажу — не поверит!',30:'Тридцать! Ох, богатырь растёт!',50:'Пятьдесят! Батюшки! Пирожков тебе напеку!'},
  enc:['Молодец, мой хороший!','Дыши, внучек, дыши!','Ох, какой сильный!','Ещё немножко — и пирожок!','Не торопись, главное — правильно!'],
  c5:'Пять подряд! Ай да внучек!',c10:'Десять подряд! Ох, у меня аж давление поднялось!',c20:'Двадцать подряд! Звоню всем родственникам!',
  almost:'Ещё три, внучек, и отдыхать!',goal:'Сделал! Умница! Иди покушай!',
  fin:{low:'Хорошо, внучек. Отдохни, покушай — завтра ещё.',mid:'Ай, молодец! Заслужил блинчики!',high:'Богатырь! Бабушка тобой гордится!'},
  rec:'Новый рекорд! Запишу в тетрадочку!',beat:'На {d} больше, чем раньше! Ох, растёшь!',
  idle:['Внучек, ты чего застыл? Не простудись!','Устал, мой хороший? Ну давай ещё чуточку.','Ты куда пропал? Бабушка волнуется!'],
  pause:'Отдохни, родной. Водички попей.',resume:'Ну, давай дальше!',reset:'Ничего страшного, начнём сначала.',ready:'Ой, вижу тебя, внучек! Ну, начинаем.',
  plank:['{s} секунд! Спинку ровненько!','{s} секунд! Терпи, казак, — атаманом будешь!','{s} секунд! Ох, какая выдержка!'],
  lvl:'Уровень {n}! Вот это да! Все соседи узнают!',rest:'Отдыхаем {s} секунд. Потом {ex}. На холодном не сиди!',go:'{ex}, {n} раз. Давай, мой хороший!',
  cue:t=>'Внучек, '+lc(t),
  home:{morning:['Доброе утро, {name}! Позавтракал? Тогда зарядочку!'],day:['{name}, внучек, весь день сидишь. Разомнись-ка!'],evening:['{name}, вечерком немножко подвигайся — и спать вовремя!'],night:['{name}! Ночь на дворе, а ты не спишь! Ну хоть коротенькую.'],done:['{name}, умница! Позанимался — теперь отдыхай.'],streak:['{n} дней подряд! Ой, какой ты у меня дисциплинированный!'],comeback:['{name}! {d} дн. не тренировался! Бабушка переживала!'],first:['Здравствуй, {name}! Давай бабушка посмотрит, как ты занимаешься.']},
  sum:{S:['Идеально! Ну весь в деда!'],A:['Очень хорошо! Чуть-чуть — и пятёрка!'],B:['Хорошо, внучек! Старайся — и всё будет.'],C:['Ничего, родной, главное — здоровье!']}},
 en:{intro:'Hello, sweetie! I’m Granny Val. I’ll make sure your back is straight and your cheeks are rosy!',
  start:['Come on, sweetie, {ex}! Slowly and carefully.','{ex}, my dear! Just don’t overdo it!','Go on, darling, {ex}. Granny’s watching!'],
  ms:{5:'Five! Oh, well done!',10:'Ten! That’s my grandchild!',15:'Fifteen! Grandpa couldn’t do that in his youth!',20:'Twenty! The neighbor won’t believe it!',30:'Thirty! Oh, a hero is growing!',50:'Fifty! Goodness! I’ll bake you cookies!'},
  enc:['Good job, my dear!','Breathe, sweetie, breathe!','Oh, so strong!','A bit more — and a cookie!','No rush, just do it right!'],
  c5:'Five in a row! What a grandchild!',c10:'Ten in a row! My blood pressure went up!',c20:'Twenty in a row! Calling all the relatives!',
  almost:'Three more, sweetie, then rest!',goal:'You did it! Clever! Go have a snack!',
  fin:{low:'Good, sweetie. Rest, eat — more tomorrow.',mid:'Well done! You earned pancakes!',high:'A true hero! Granny is so proud!'},
  rec:'New record! I’ll write it in my notebook!',beat:'{d} more than before! Oh, you’re growing!',
  idle:['Sweetie, why did you freeze? Don’t catch a cold!','Tired, dear? Just a tiny bit more.','Where did you go? Granny’s worried!'],
  pause:'Rest, dear. Have some water.',resume:'Well, let’s go on!',reset:'No worries, let’s start again.',ready:'Oh, I see you, sweetie! Let’s begin.',
  plank:['{s} seconds! Nice straight back!','{s} seconds! Hang in there, champ!','{s} seconds! Oh, such endurance!'],
  lvl:'Level {n}! Oh my! All the neighbors will know!',rest:'Rest {s} seconds. Then {ex}. Don’t sit on the cold floor!',go:'{ex}, {n} times. Go on, dear!',
  cue:t=>'Sweetie, '+lc(t),
  home:{morning:['Good morning, {name}! Had breakfast? Time for exercises!'],day:['{name}, sweetie, you’ve been sitting all day. Stretch a bit!'],evening:['{name}, move a little this evening — and bed on time!'],night:['{name}! It’s the middle of the night! Well, a short one then.'],done:['{name}, clever you! Trained today — now rest.'],streak:['{n} days in a row! Oh, so disciplined!'],comeback:['{name}! {d} days without training! Granny was worried!'],first:['Hello, {name}! Let Granny see how you exercise.']},
  sum:{S:['Perfect! Just like your grandpa!'],A:['Very good! Almost top marks!'],B:['Good, sweetie! Keep trying.'],C:['It’s fine, dear, health comes first!']}}},
};

// ───────────────────────── СОСТОЯНИЕ ─────────────────────────
const cid=()=>localStorage.getItem('fp_coach')||'classic';
const coach=()=>COACHES.find(c=>c.id===cid())||COACHES[0];
const lang=()=>currentLang==='en'?'en':'ru';
const pack=(id=cid())=>(LINES[id]||LINES.classic)[lang()];
const meta=(c=coach())=>c[lang()];
const talk=()=>localStorage.getItem('fp_coach_talk')||'normal'; // quiet|normal|chatty
const subsOn=()=>localStorage.getItem('fp_coach_subs')!=='0';
function stats(){try{return JSON.parse(localStorage.getItem('fp_coach_stats')||'{}');}catch(e){return{};}}
function bumpStats(){const s=stats();s[cid()]=(s[cid()]||0)+1;localStorage.setItem('fp_coach_stats',JSON.stringify(s));}
const exName=()=>EX[currentEx]?.name||'';
function fill(t,o={}){
  return String(t).replace(/\{(\w+)\}/g,(m,k)=>k==='ex'?(o.ex??exName()):k==='name'?(o.name??(userName||'')):(o[k]??m));
}
// ───────────────────────── ЖИВЫЕ ГОЛОСА (заранее записанные клипы) ─────────────────────────
// voice/<coach>/<lang>/<hash>.mp3, hash = FNV-1a(`${coach}|${lang}|${шаблон}|${упражнение}`).
// Список доступных клипов — voice/manifest.js. Если клипа нет — говорит браузерный TTS.
const EXK=['pushup','squat','plank','situp','lunge','burpee','pullup'];
const NOCLIP=new Set(['rest','go']); // в этих фразах важны цифры — их произносит TTS целиком
const hqOn=()=>localStorage.getItem('fp_coach_hq')!=='0';
const VSET={};
function vset(c,lg){const k=c+lg;if(!VSET[k]){const m=(window.FP_VOICE_MANIFEST||{})[c]?.[lg]||'';VSET[k]=new Set(m.split(' ').filter(Boolean));}return VSET[k];}
const TE=window.TextEncoder?new TextEncoder():null;
function fnv(str){let h=0x811c9dc5;const b=TE?TE.encode(str):[];for(let i=0;i<b.length;i++){h^=b[i];h=Math.imul(h,0x01000193)>>>0;}return h.toString(16).padStart(8,'0');}
const CLIP=new Map(); // `${coach}|${текст}` → url
function clipUrl(c,lg,key){const h=fnv(key);return vset(c,lg).has(h)?`voice/${c}/${lg}/${h}.mp3`:null;}
function reg(c,lg,key,text){
  if(!text||!hqOn())return text;const u=clipUrl(c,lg,key);
  if(u){CLIP.set(c+'|'+String(text).trim(),u);if(CLIP.size>300)CLIP.delete(CLIP.keys().next().value);}
  return text;
}
function exKeyOf(name){
  if(name==null)return EX[currentEx]?currentEx:'';
  const n=String(name).trim().toLowerCase();
  return EXK.find(k=>EX[k]&&(EX[k].nameRu.toLowerCase()===n||EX[k].nameEn.toLowerCase()===n))||'';
}
function voiced(tmpl,o={},c=cid(),lg=lang()){
  const t=fill(tmpl,o);if(typeof tmpl!=='string')return t;
  let e='';if(tmpl.includes('{ex}')){e=exKeyOf(o.ex);if(!e)return t;}
  return reg(c,lg,`${c}|${lg}|${tmpl}|${e}`,t);
}
function line(key,o){const p=pack();let v=p[key];
  if(v==null){v=LINES.classic[lang()][key];return v==null?'':fill(pick(v),o);}
  const t=pick(v);return NOCLIP.has(key)?fill(t,o):voiced(t,o);}

// ───────────────────────── ГОЛОС ─────────────────────────
const VOICE_HINT={
  f:/milena|alena|alyona|katya|irina|svetlana|dariya|anna|elena|female|samantha|zira|karen|moira|tessa|victoria|susan|serena|fiona|allison|ava|joanna|salli|kimberly|google us english|google русский/i,
  m:/yuri|pavel|dmitr|maxim|aleksandr|male|daniel|alex\b|david|mark|fred|tom|oliver|george|rishi|matthew|google uk english male/i,
};
let voices=[];
function loadVoices(){try{voices=speechSynthesis.getVoices()||[];}catch(e){voices=[];}}
if(window.speechSynthesis){loadVoices();try{speechSynthesis.addEventListener('voiceschanged',loadVoices);}catch(e){}}
function voiceFor(lang,g){
  const pre=lang.slice(0,2).toLowerCase();
  const list=voices.filter(v=>(v.lang||'').toLowerCase().startsWith(pre));
  if(!list.length)return null;
  return list.find(v=>VOICE_HINT[g].test(v.name)&&!VOICE_HINT[g==='f'?'m':'f'].test(v.name))||null;
}
let forceCoach=null; // для прослушивания образца в окне выбора
// Один общий <audio>: разблокируем его первым касанием, чтобы мобильные браузеры давали играть клипы
let AU=null,auU=null,auOn=false;
function au(){if(!AU){AU=new Audio();AU.preload='auto';}return AU;}
function auStop(fire){const u=auU;auU=null;auOn=false;try{AU&&AU.pause();}catch(e){}if(fire&&u)try{u.onend&&u.onend({});}catch(e){}}
document.addEventListener('pointerdown',function unlock(){
  document.removeEventListener('pointerdown',unlock,true);
  const u=clipUrl(cid(),lang(),`${cid()}|${lang()}|#|5`);if(!u)return;
  const a=au();a.muted=true;a.src=u;const p=a.play();if(p&&p.then)p.then(()=>{a.pause();a.muted=false;}).catch(()=>{a.muted=false;});else a.muted=false;
},true);
function playClip(url,u,orig){
  auStop(true);const a=au();auU=u;auOn=true;
  a.muted=false;a.volume=Math.max(0,Math.min(1,u.volume??1));a.playbackRate=1;
  let done=false;
  const end=()=>{if(done||auU!==u)return;done=true;auU=null;auOn=false;try{u.onend&&u.onend({});}catch(e){}};
  const fail=()=>{if(done||auU!==u)return;done=true;auU=null;auOn=false;try{orig(u);}catch(e){try{u.onerror&&u.onerror({});}catch(_){}}};
  a.onended=end;a.onerror=fail;
  blobUrl(url).then(b=>{if(auU!==u||done)return;a.src=b;const p=a.play();if(p&&p.catch)p.catch(fail);}).catch(fail);
}
// Клип берём через fetch → blob: так он стабильно играет из кеша service worker (и на iOS тоже)
const BLOB=new Map();
async function blobUrl(url){
  if(BLOB.has(url))return BLOB.get(url);
  const r=await fetch(url);if(!r.ok)throw new Error(r.status);
  const b=URL.createObjectURL(await r.blob());BLOB.set(url,b);
  if(BLOB.size>80){const k=BLOB.keys().next().value;try{URL.revokeObjectURL(BLOB.get(k));}catch(e){}BLOB.delete(k);}
  return b;
}
if(window.speechSynthesis){
  const ss=window.speechSynthesis,orig=ss.speak.bind(ss),origCancel=ss.cancel.bind(ss);
  ss.cancel=function(){auStop(false);return origCancel();};
  try{const d=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ss),'speaking');
    if(d&&d.get)Object.defineProperty(ss,'speaking',{configurable:true,get(){return auOn||d.get.call(ss);}});}catch(e){}
  ss.speak=function(u){
    try{
      const c=forceCoach||coach();
      const txt=String(u.text||'').trim();
      if(hqOn()&&!u._fpRaw){
        let url=CLIP.get(c.id+'|'+txt);
        const nm=/^\d+$/.test(txt)&&+txt;
        if(!url&&nm&&nm%5===0&&nm<=200)url=clipUrl(c.id,lang(),`${c.id}|${lang()}|#|${nm}`);
        if(url){if(!forceCoach)showBubble(u.text);playClip(url,u,x=>{x._fpRaw=1;ss.speak(x);});return;}
      }
      u.pitch=Math.max(0,Math.min(2,c.p));
      u.rate=Math.max(.5,Math.min(2,(u.rate||1)*c.r));
      const v=voiceFor(u.lang||(lang()==='en'?'en-US':'ru-RU'),c.g);if(v)u.voice=v;
      if(!forceCoach)showBubble(u.text);
    }catch(e){}
    return orig(u);
  };
}

// ───────────────────────── ЗВУКИ ─────────────────────────
let ac=null;
function actx(){try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();}catch(e){}return ac;}
function tone(f,t0,d,type='sine',vol=.18,f2){
  const a=actx();if(!a)return;const o=a.createOscillator(),g=a.createGain();
  o.type=type;o.frequency.setValueAtTime(f,a.currentTime+t0);if(f2)o.frequency.exponentialRampToValueAtTime(f2,a.currentTime+t0+d);
  g.gain.setValueAtTime(.0001,a.currentTime+t0);g.gain.exponentialRampToValueAtTime(vol,a.currentTime+t0+.02);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+t0+d);
  o.connect(g);g.connect(a.destination);o.start(a.currentTime+t0);o.stop(a.currentTime+t0+d+.05);
}
const SFX={
  ding:()=>{tone(880,0,.35);tone(1320,.08,.4,'sine',.1);},
  whistle:()=>{tone(2300,0,.18,'sine',.16,2500);tone(2300,.22,.5,'sine',.16,2600);},
  meow:()=>{tone(600,0,.18,'triangle',.14,1100);tone(1000,.17,.32,'triangle',.12,650);},
  gong:()=>{tone(110,0,2.2,'sine',.25);tone(220,0,1.6,'sine',.08);tone(331,0,1.2,'sine',.05);},
  blip:()=>{[0,.09,.18].forEach((t,i)=>tone([1200,800,1600][i],t,.07,'square',.06));},
  horn:()=>{[0,.18].forEach(t=>{tone(415,t,.16,'sawtooth',.08);tone(523,t,.16,'sawtooth',.06);tone(622,t,.16,'sawtooth',.05);});tone(415,.4,.5,'sawtooth',.08);tone(523,.4,.5,'sawtooth',.06);},
  bell:()=>{tone(1046,0,.6,'sine',.12);tone(1318,.22,.8,'sine',.1);},
};
function sfx(c=coach()){if(voiceEnabled)try{SFX[c.sfx]?.();}catch(e){}}

// ───────────────────────── СУБТИТРЫ ─────────────────────────
let bubT=null;
function showBubble(txt){
  if(!txt||!subsOn()||/^\d+$/.test(String(txt).trim()))return;
  if(F.curTab!=='train')return;
  const box=document.querySelector('#tab-train .video-box')||document.querySelector('.video-box');if(!box)return;
  let b=$('fpcBubble');
  if(!b){b=document.createElement('div');b.id='fpcBubble';b.className='fpc-bub';box.appendChild(b);}
  const c=coach();
  b.style.setProperty('--c1',c.c1);b.style.setProperty('--c2',c.c2);
  b.innerHTML=`<span class="fpc-bub-av">${c.e}</span><span class="fpc-bub-b"><b>${esc(meta(c).name)}</b>${esc(txt)}</span>`;
  b.classList.remove('show');void b.offsetWidth;b.classList.add('show');
  clearTimeout(bubT);bubT=setTimeout(()=>b.classList.remove('show'),Math.max(3200,String(txt).length*70));
}

// ───────────────────────── ПЕРЕХВАТ РЕПЛИК ─────────────────────────
// Реплики оригинального тренера заменяем на реплики выбранного персонажа
window.speakCoachLine=function(key,...args){
  if(!voiceEnabled){ // звук выключен — показываем хотя бы субтитры
    const t=coachText(key,args);if(t)showBubble(t);return;
  }
  const q=talk();
  if(q==='quiet'&&(key==='encourage'||key==='comboStart'))return;
  if(/^combo/.test(key)&&(pack().ms||{})[repCount])return; // в этот момент говорит веха — без дублей
  const t=coachText(key,args);if(!t)return;
  if(key==='start')sfx();
  const urgent=['milestone','comboStart','combo10','combo20','newRecord','recordBeaten','goalDone'].includes(key);
  speak(t,urgent?'!':'coach');
};
function coachText(key,args){
  const p=pack();
  switch(key){
    case 'start':return line('start');
    case 'milestone':{const m=(p.ms||{})[args[0]];return m?voiced(m):'';}
    case 'encourage':return line('enc');
    case 'comboStart':return line('c5');
    case 'combo10':return line('c10');
    case 'combo20':return line('c20');
    case 'finish':{const r=repCount+(plankTime>0?Math.floor(plankTime):0);const f=(p.fin||{})[r>=30?'high':r>=10?'mid':'low'];return f?voiced(f):'';}
    case 'newRecord':return line('rec');
    case 'recordBeaten':return line('beat',{d:args[0]});
    case 'goalDone':return line('goal');
  }
  return '';
}
// Системные фразы (пауза, сброс, уровень, отдых в гид-режиме) — в стиле тренера
const _speak=window.speak;
window.speak=function(txt,u){
  let t=String(txt??'');
  const map=[
    [/^(Пауза|Paused?)$/i,()=>line('pause')],
    [/^(Продолжаем|Resume|Continue)$/i,()=>line('resume')],
    [/^(Сброшено|Reset)$/i,()=>line('reset')],
    [/^(Камера готова! Погнали!|Camera ready! Let's go!)$/,()=>line('ready')],
    [/^(?:Уровень|Level) (\d+)!$/,m=>line('lvl',{n:m[1]})],
    [/^(?:Отлично! Отдых|Great! Rest) (\d+) (?:секунд|seconds)\. (?:Далее|Next): (.+)$/,m=>line('rest',{s:m[1],ex:m[2]})],
    [/^(?:Поехали|Go)! (.+?), (\d+)(?: секунд)?$/,m=>line('go',{ex:m[1],n:m[2]})],
  ];
  if(cid()!=='classic')for(const [re,fn] of map){const m=t.match(re);if(m){const r=fn(m);if(r)t=r;break;}}
  if(!voiceEnabled)showBubble(t);
  return _speak(t,u);
};
// Подсказки по технике — с интонацией персонажа
if(typeof window.coachCue==='function'){
  const _cue=window.coachCue;
  window.coachCue=function(key,txt,type,cd){const p=pack();const t=p.cue&&cid()!=='classic'?p.cue(txt):txt;if(lang()==='ru')reg(cid(),'ru',`${cid()}|ru|cue|${txt}`,t);return _cue(key,t,type,cd);};
}

// ───────────────────────── ЖИВЫЕ РЕАКЦИИ ─────────────────────────
let lastRepTs=0,sesT0=0,lastIdle=0,lastPlankCue=0,chatT=null;
const _startSes=window.startSes;
window.startSes=function(){_startSes();sesT0=Date.now();lastRepTs=Date.now();lastIdle=Date.now();lastPlankCue=0;
  clearInterval(chatT);if(talk()==='chatty')chatT=setInterval(()=>{if(isRunning&&!isPaused&&!F.G?.resting&&(repCount>0||plankTime>0))speakCoachLine('encourage');},22000);};
const _addRep=window.addRep;
window.addRep=function(){const b=repCount;_addRep();if(repCount>b){lastRepTs=Date.now();
  if(goalReps>3&&goalReps-repCount===3&&!(pack().ms||{})[repCount]&&talk()!=='quiet')setTimeout(()=>speak(line('almost')),350);}};
const _addPlankT=window.addPlankT;
window.addPlankT=function(dt){_addPlankT(dt);
  if(!EX[currentEx]?.isPlank||!isRunning||talk()==='quiet')return;lastRepTs=Date.now();
  const s=Math.floor(plankTime);if(s>=20&&s%20===0&&s!==lastPlankCue){lastPlankCue=s;speak(line('plank',{s}),'coach');}};
const _stopAll=window.stopAll;
window.stopAll=function(){const run=isRunning,had=repCount>0||plankTime>=5;clearInterval(chatT);_stopAll();if(run&&had)bumpStats();};
setInterval(()=>{
  if(!isRunning||isPaused||F.G?.resting||talk()==='quiet'||EX[currentEx]?.isPlank||goalAchieved)return;
  const now=Date.now();if(now-sesT0<15000)return;
  const gap=talk()==='chatty'?14000:22000;
  if(now-lastRepTs>gap&&now-lastIdle>35000){lastIdle=now;speak(line('idle'),'coach');}
},3000);

// ───────────────────────── ГЛАВНАЯ: СЛОВО ТРЕНЕРА ─────────────────────────
function homeLine(){
  const h=new Date().getHours(),d=F.day();
  const name=(userName&&userName!=='Спортсмен'&&userName!=='Athlete')?userName:L('чемпион','champ');
  const gap=lastWorkoutDate?daysBetween(lastWorkoutDate,localDateKey()):null;
  let k;
  if(!lastWorkoutDate&&!d.workouts)k='first';
  else if(d.workouts)k='done';
  else if(gap!=null&&gap>=3)k='comeback';
  else if(dayStreak>=3&&Math.random()<.6)k='streak';
  else k=h<5?'night':h<12?'morning':h<17?'day':h<23?'evening':'night';
  const H=pack().home||LINES.classic[lang()].home;
  return voiced(pick(H[k]||H.day),{name,n:dayStreak,d:gap});
}
let homeTxt=null,homeFor=null;
function homeCard(){
  const c=coach();const chosen=!!localStorage.getItem('fp_coach');
  if(homeFor!==cid()+lang()+F.day().workouts){homeTxt=homeLine();homeFor=cid()+lang()+F.day().workouts;}
  return`<div class="fpc-home" id="fpcHome" style="--c1:${c.c1};--c2:${c.c2}">
    <div class="fpc-av sm">${c.e}</div>
    <div class="fpc-home-b"><div class="fpc-home-n">${esc(meta(c).name)}</div><div class="fpc-home-t">${esc(chosen?homeTxt:L('Выбери себе тренера с характером — от сержанта до котика 🐱','Pick a coach with personality — from a drill sergeant to a cat 🐱'))}</div></div>
    <button class="fpc-home-x" id="fpcHomeSay" aria-label="Play">${chosen?'🔊':'✨'}</button>
  </div>`;
}
F.HOOKS.home.push(()=>{
  const hello=document.querySelector('#fpHomeHost .fp-hello');if(!hello)return;
  $('fpcHome')?.remove();hello.insertAdjacentHTML('afterend',homeCard());
  const card=$('fpcHome');
  card.onclick=e=>{if(e.target.closest('#fpcHomeSay')&&localStorage.getItem('fp_coach')){e.stopPropagation();sfx();speak(homeTxt,'!');return;}openPicker();};
});

// ───────────────────────── ИТОГИ ─────────────────────────
F.HOOKS.summary.push((extra,sess,g)=>{
  if(!sess)return;
  const reps=totalVolume-sess.vol0,secs=(Date.now()-sess.t0)/1000;
  let gr='C';
  if(g&&g.results){const res=g.plan.steps.map((s,i)=>g.results[i]||{done:0,target:s.reps});const r=res.reduce((a,x)=>a+Math.min(1,x.done/Math.max(1,x.target)),0)/Math.max(1,res.length);gr=r>=1?'S':r>=.85?'A':r>=.6?'B':'C';}
  else{const r=goalReps>0?(reps||Math.floor(sess.plank||0))/goalReps:1;gr=r>=1?'S':r>=.85?'A':r>=.6?'B':'C';}
  const c=coach(),S=pack().sum||LINES.classic[lang()].sum;
  const t=voiced(pick(S[gr]));
  extra.unshift(`<span class="fpc-sum" style="--c1:${c.c1};--c2:${c.c2}"><span class="fpc-av xs">${c.e}</span><span><b>${esc(meta(c).name)}</b>«${esc(t)}»</span></span>`);
  if(secs>5)setTimeout(()=>{if(voiceEnabled&&document.querySelector('.fp-sum'))speak(t,'coach');},2600);
});

// ───────────────────────── ЗАГРУЗКА ГОЛОСА ДЛЯ ОФЛАЙНА ─────────────────────────
const vdlKey=(c,lg)=>`fp_vdl_${c}_${lg}`;
let vdlBusy=null;
function voiceList(c,lg){return[...vset(c,lg)].map(h=>`voice/${c}/${lg}/${h}.mp3`);}
async function voiceDownload(c,lg,onp){
  if(vdlBusy)return false;vdlBusy=c+lg;
  const list=voiceList(c,lg);let done=0,bad=0,i=0;
  const worker=async()=>{while(i<list.length){const u=list[i++];try{const r=await fetch(u);if(!r.ok)bad++;else await r.blob();}catch(e){bad++;}done++;onp&&onp(done/list.length);}};
  await Promise.all([0,1,2,3].map(worker));
  vdlBusy=null;if(!bad&&list.length)localStorage.setItem(vdlKey(c,lg),'1');
  return !bad;
}
function dlRow(c){
  const lg=lang(),n=vset(c.id,lg).size;if(!n)return'';
  const ok=localStorage.getItem(vdlKey(c.id,lg));
  return`<div class="fpc-dl${ok?' ok':''}" id="fpcDl"><span>${ok?'✅ '+L(`Голос «${meta(c).name}» сохранён — работает без интернета`,`“${meta(c).name}” voice saved — works offline`):'📦 '+L(`Скачать голос «${meta(c).name}» для офлайна`,`Download “${meta(c).name}” voice for offline`)+` <small>~${Math.max(1,(n*13/1024).toFixed(1))} ${L('МБ','MB')}</small>`}</span>${ok?'':`<button id="fpcDlBtn">${L('Скачать','Download')}</button>`}<i style="width:0"></i></div>`;
}
// Тихо докачиваем голос выбранного тренера в фоне (только по Wi-Fi/без экономии трафика)
function autoVoice(){
  try{const c=cid(),lg=lang();if(!localStorage.getItem('fp_coach')||!hqOn()||localStorage.getItem(vdlKey(c,lg))||navigator.connection?.saveData)return;
    if(/(^|-)2g$/.test(navigator.connection?.effectiveType||''))return;
    setTimeout(()=>voiceDownload(c,lg),4000);}catch(e){}
}
window.addEventListener('load',autoVoice);

// ───────────────────────── ВЫБОР ТРЕНЕРА ─────────────────────────
function dots(n){return'<i class="on"></i>'.repeat(n)+'<i></i>'.repeat(5-n);}
function sample(c){
  const p=(LINES[c.id]||LINES.classic)[lang()];
  forceCoach=c;
  try{speechSynthesis.cancel();}catch(e){}
  try{SFX[c.sfx]?.();}catch(e){}
  const txt=voiced(p.intro,{name:userName},c.id);
  setTimeout(()=>{
    try{const u=new SpeechSynthesisUtterance(txt);u.lang=window._speechLang||(lang()==='en'?'en-US':'ru-RU');u.volume=voiceVolume;u.rate=voiceRate;
      u.onend=u.onerror=()=>{forceCoach=null;};speechSynthesis.speak(u);setTimeout(()=>{forceCoach=null;},200);}catch(e){forceCoach=null;}
  },c.sfx==='gong'?500:250);
  return txt;
}
function openPicker(){
  const cur=cid(),st=stats(),q=talk();
  const ov=sheet(`<div class="fpc">
    <div class="fpc-h"><div class="fpc-h-t">🎙️ ${L('Тренер с характером','Coach with personality')}</div><div class="fpc-h-s">${L('Выбери, кто будет считать твои повторы, подбадривать и подкалывать. Нажми ▶, чтобы послушать.','Choose who counts your reps, cheers you on and teases you. Tap ▶ to listen.')}</div></div>
    <div class="fpc-list">${COACHES.map(c=>{const m=meta(c);return`<div class="fpc-card${c.id===cur?' on':''}" data-id="${c.id}" style="--c1:${c.c1};--c2:${c.c2}">
      <div class="fpc-av">${c.e}</div>
      <div class="fpc-m"><div class="fpc-n">${esc(m.name)}${c.id===cur?`<span class="fpc-cur">${L('твой тренер','your coach')}</span>`:''}</div><div class="fpc-t">${esc(m.tag)}</div>
        <div class="fpc-tr">${TRAITS[lang()].map((t,i)=>`<span>${t}<em>${dots(m.tr[i])}</em></span>`).join('')}</div>
        ${st[c.id]?`<div class="fpc-st">🤝 ${L(`Тренировок вместе: ${st[c.id]}`,`Workouts together: ${st[c.id]}`)}</div>`:''}
        <div class="fpc-say" id="fpcSay-${c.id}"></div></div>
      <button class="fpc-play" data-play="${c.id}" aria-label="Play"><svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 1.8v10.4L12 7z" fill="currentColor"/></svg></button>
    </div>`;}).join('')}</div>
    <div class="fp-section-t">💬 ${L('Сколько говорить','How talkative')}</div>
    <div class="fpr-seg fpc-talk">${[['quiet',L('Тихо','Quiet')],['normal',L('Обычно','Normal')],['chatty',L('Болтливо','Chatty')]].map(([k,l])=>`<button data-talk="${k}" class="${k===q?'on':''}">${l}</button>`).join('')}</div>
    <div class="fpc-hint">${q==='quiet'?L('Только главное: старт, счёт, рекорды и итоги.','Only the key moments: start, count, records and results.'):q==='chatty'?L('Подбадривает каждые ~20 сек, замечает паузы и комментирует планку.','Cheers every ~20 s, notices pauses and comments on planks.'):L('Подбадривает, замечает паузы, хвалит за серии — без перебора.','Cheers, notices pauses, praises streaks — without overdoing it.')}</div>
    <label class="fpc-sw"><span>🎧 ${L('Живые голоса','Live voices')}<small>${L('Каждый тренер говорит своим записанным голосом. Выключи, чтобы говорил голос телефона.','Each coach speaks with their own recorded voice. Turn off to use the phone voice.')}</small></span><input type="checkbox" id="fpcHq" ${hqOn()?'checked':''}></label>
    ${hqOn()?dlRow(coach()):''}
    <label class="fpc-sw"><span>💬 ${L('Субтитры на тренировке','Subtitles during workout')}<small>${L('Реплики тренера видно на экране, даже без звука','See coach lines on screen, even muted')}</small></span><input type="checkbox" id="fpcSubs" ${subsOn()?'checked':''}></label>
    ${!voiceEnabled?`<div class="fpc-warn">🔇 ${L('Голосовые подсказки выключены в настройках — тренер будет говорить только субтитрами.','Voice hints are off in settings — the coach will speak via subtitles only.')}</div>`:''}
  </div>`,'fp-sheet-coach');
  ov.querySelectorAll('[data-play]').forEach(b=>b.onclick=e=>{e.stopPropagation();const c=COACHES.find(x=>x.id===b.dataset.play);
    ov.querySelectorAll('.fpc-say').forEach(s=>{s.textContent='';s.classList.remove('show');});
    const s=ov.querySelector('#fpcSay-'+c.id);s.textContent='«'+sample(c)+'»';s.classList.add('show');
    ov.querySelectorAll('.fpc-play').forEach(x=>x.classList.toggle('playing',x===b));});
  ov.querySelectorAll('.fpc-card').forEach(card=>card.onclick=()=>{
    const id=card.dataset.id;const was=cid();localStorage.setItem('fp_coach',id);homeFor=null;
    const c=coach();
    if(id!==was||!card.classList.contains('on')){
      const keep=ov.querySelector('.fp-sheet').scrollTop;
      const nv=openPicker();const sh=nv.querySelector('.fp-sheet');if(sh)sh.scrollTop=keep;
      const s=nv.querySelector('#fpcSay-'+id);if(s){s.textContent='«'+sample(c)+'»';s.classList.add('show');}
      toast(`${c.e} ${L('Твой тренер','Your coach')}: ${meta(c).name}`,2200);
      syncChip();if(F.curTab==='home')F.renderHome();autoVoice();
    }
  });
  ov.querySelectorAll('[data-talk]').forEach(b=>b.onclick=()=>{localStorage.setItem('fp_coach_talk',b.dataset.talk);const keep=ov.querySelector('.fp-sheet').scrollTop;const nv=openPicker();const sh=nv.querySelector('.fp-sheet');if(sh)sh.scrollTop=keep;});
  ov.querySelector('#fpcHq').onchange=e=>{localStorage.setItem('fp_coach_hq',e.target.checked?'1':'0');CLIP.clear();homeFor=null;const keep=ov.querySelector('.fp-sheet').scrollTop;const nv=openPicker();const sh=nv.querySelector('.fp-sheet');if(sh)sh.scrollTop=keep;};
  const db=ov.querySelector('#fpcDlBtn');
  if(db)db.onclick=async e=>{e.stopPropagation();const row=ov.querySelector('#fpcDl'),bar=row.querySelector('i'),lab=row.querySelector('span');
    db.disabled=true;db.textContent='…';
    const ok=await voiceDownload(cid(),lang(),f=>{bar.style.width=Math.round(f*100)+'%';lab.textContent=`⏳ ${L('Голос загружается','Downloading voice')} ${Math.round(f*100)}%`;});
    if(vdlBusy&&!ok){lab.textContent=L('Уже загружается в фоне…','Already downloading…');return;}
    row.classList.toggle('ok',ok);db.remove();lab.textContent=ok?'✅ '+L('Готово! Голос работает без интернета','Done! Voice works offline'):'⚠️ '+L('Не всё скачалось — проверь интернет','Some files failed — check connection');};
  ov.querySelector('#fpcSubs').onchange=e=>localStorage.setItem('fp_coach_subs',e.target.checked?'1':'0');
  return ov;
}

// ───────────────────────── ЧИП НА ТРЕНИРОВКЕ ─────────────────────────
function syncChip(){
  const box=document.querySelector('#tab-train .video-box');if(!box)return;
  let ch=$('fpcChip');
  if(!ch){ch=document.createElement('button');ch.id='fpcChip';ch.className='fpc-chip';box.before(ch);ch.onclick=openPicker;}
  const c=coach();ch.style.setProperty('--c1',c.c1);ch.style.setProperty('--c2',c.c2);
  ch.innerHTML=`<span class="fpc-av xs">${c.e}</span><span class="fpc-chip-t"><small>${L('Тренер','Coach')}</small>${esc(meta(c).name)}</span><span class="fpc-chip-c">${L('Сменить','Change')} ›</span>`;
}
const _applyLanguage=window.applyLanguage;
window.applyLanguage=function(l){_applyLanguage(l);homeFor=null;syncChip();};
document.addEventListener('DOMContentLoaded',()=>{syncChip();});

window.FPC={open:openPicker,COACHES,coach,line,sample,homeLine};
})();
