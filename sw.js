/* 서비스 워커 — 오프라인에서도 열리게 해준다.
   전략: 네트워크 우선, 실패하면 캐시.
   (캐시 우선으로 하면 foods.js 를 수정해서 올려도 폰에 계속 옛날 버전이 뜬다) */

const CACHE = "mealpicker-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./config.js",
  "./foods.js",
  "./app.js",
  "./icon.svg",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  "./manifest.webmanifest",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // 동기화 서버(Firebase) 같은 외부 요청은 건드리지 않는다.
  // 캐시했다간 옛날 목록이 내려오고, 실패 시 index.html 이 돌아가 버린다.
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 정상 응답이면 캐시를 갱신해 둔다
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html")))
  );
});
