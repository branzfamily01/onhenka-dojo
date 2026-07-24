/* 音変化道場 Service Worker
   方針: HTMLはネットワーク優先(先生の更新が即反映される)。
   オフライン時のみキャッシュから起動。アイコン類はキャッシュ優先。 */
const CACHE = "onhenka-dojo-v3";
const ASSETS = ["./index.html", "./manifest.json", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // ページ本体・教材パック: ネットワーク優先 → 失敗時キャッシュ(オフライン起動)
  if (req.mode === "navigate" || req.url.endsWith(".html") || req.url.includes("packs.json")) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }
  // その他(アイコン等): キャッシュ優先
  e.respondWith(
    caches.match(req).then((r) => r || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }))
  );
});
