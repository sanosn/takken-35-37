/* =========================================================
   オフラインで遊べるようにする仕組み（サービスワーカー）
   - 一度ひらいたファイルをスマホの中に保存しておき、
     地下鉄などで電波がないときは保存したものを使う
   - アプリを更新したら VERSION の数字を1つ上げる
   ========================================================= */
const VERSION = 'v1';
const CACHE = 'takken3537-' + VERSION;

const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// インストール時：アプリのファイルをまとめて保存
self.addEventListener('install', (e) => {
  const requests = APP_FILES.map((url) => new Request(url, { cache: 'reload' }));
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(requests)).then(() => self.skipWaiting()));
});

// 古いバージョンの保存データを消す
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 保存してあるものをすぐ返し、電波があれば裏で新しいものに入れかえる
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      const network = fetch(e.request.url, { cache: 'no-cache' })
        .then((res) => {
          if (res && res.ok) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
