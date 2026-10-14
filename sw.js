// Network first so updates show up right away; the cache is only used with no signal.
var CACHE = "contact-pass-v4";
var FILES = ["./", "index.html", "vendor/qrcode.js", "manifest.webmanifest", "icon.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(FILES.map(function (f) { return new Request(f, { cache: "reload" }); }));
  }));
  self.skipWaiting();
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var sameOrigin = new URL(e.request.url).origin === location.origin;
  e.respondWith(fetch(e.request, sameOrigin ? { cache: "no-cache" } : undefined).then(function (res) {
    if (res.ok && sameOrigin) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      return hit || caches.match("./");
    });
  }));
});
