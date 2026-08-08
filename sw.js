'use strict';
// ============================================================
//  SERVICE WORKER v6 — FitPulse
//  Стратегии: Cache-First для статики/CDN, Network-First для API
//  Push-уведомления с расписанием напоминаний
// ============================================================

const CACHE_STATIC = 'fp-static-v6';
const CACHE_CDN    = 'fp-cdn-v6';

const STATIC_ASSETS = [
  './', './index.html', './style.css', './script.js',
  './db.js', './cloud.js', './manifest.json',
  './icon-192.png', './icon-512.png', './favicon.ico'
];

// ── Install: кешируем статику ──────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then(c => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: чистим старые кеши ──────────────────────────
self.addEventListener('activate', e => {
  const keep = [CACHE_STATIC, CACHE_CDN];
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !keep.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Messages от клиента ───────────────────────────────────
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  // Клиент просит запланировать напоминание
  if (e.data?.type === 'SCHEDULE_REMINDER') scheduleReminder(e.data.delayMs, e.data.msg);
});

// ── Fetch: раздельные стратегии ───────────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Supabase API — Network-Only (никогда не кешируем)
  if (url.hostname.includes('supabase.co')) return;

  // MediaPipe CDN — Cache-First (большие файлы, не меняются)
  if (url.hostname.includes('jsdelivr.net') || url.hostname.includes('unpkg.com')) {
    e.respondWith(cacheFirst(e.request, CACHE_CDN));
    return;
  }

  // Наша статика — Network-First с fallback в кеш
  if (url.origin === self.location.origin) {
    e.respondWith(networkFirst(e.request, CACHE_STATIC));
    return;
  }
});

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.status === 200) {
      const c = await caches.open(cacheName);
      c.put(req, res.clone());
    }
    return res;
  } catch {
    return cached || new Response('Офлайн', { status: 503 });
  }
}

async function networkFirst(req, cacheName) {
  try {
    const res = await fetch(req);
    if (res && res.status === 200) {
      const c = await caches.open(cacheName);
      c.put(req, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    return cached || new Response('Офлайн — проверьте соединение', { status: 503 });
  }
}

// ── Push-уведомления ──────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  const title = data.title || 'FitPulse 💪';
  const body  = data.body  || 'Время тренироваться!';
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: './icon-192.png',
      badge: './favicon-32.png',
      tag: 'fitpulse-reminder',
      renotify: true,
      actions: [
        { action: 'open',   title: '🏋️ Тренироваться' },
        { action: 'snooze', title: '⏰ Напомнить позже' }
      ],
      data: { url: self.location.origin }
    })
  );
});

// ── Клик по уведомлению ───────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'snooze') {
    scheduleReminder(3600000, { // через час
      title: 'FitPulse — не забудь! ⏰',
      body: 'Ты отложил тренировку час назад. Пора!'
    });
    return;
  }
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) if (c.url.includes('FitPulse') && 'focus' in c) return c.focus();
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});

// ── Локальный планировщик напоминаний (без Push-сервера) ──
// Клиент передаёт delay в мс и текст — SW ставит setTimeout
const reminders = new Map();
function scheduleReminder(delayMs, msg) {
  const id = Date.now();
  const timer = setTimeout(() => {
    self.registration.showNotification(msg?.title || 'FitPulse 💪', {
      body: msg?.body || 'Время тренироваться! Не теряй серию 🔥',
      icon: './icon-192.png',
      badge: './favicon-32.png',
      tag: 'fitpulse-reminder',
      renotify: true,
      actions: [
        { action: 'open',   title: '🏋️ Тренироваться' },
        { action: 'snooze', title: '⏰ Через час' }
      ]
    });
    reminders.delete(id);
  }, delayMs);
  reminders.set(id, timer);
}
