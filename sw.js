const CACHE = "sejtbio-v18";
const FILES = ["./","./index.html","./quiz.json","./manifest.webmanifest",
               "./icon-192.png","./icon-512.png","./apple-touch-icon.png","./favicon.png"];

self.addEventListener("install", e=>{
  // mindig friss peldanyt tolt le a halozatrol telepiteskor, nem a bongeszo
  // sajat HTTP-gyorsitotarabol (ez okozta, hogy egy uj verzio is regi
  // tartalmat "fagyasztott be" a Cache Storage-ba)
  e.waitUntil((async()=>{
    const c = await caches.open(CACHE);
    await Promise.all(FILES.map(async url=>{
      try{
        const res = await fetch(url, {cache: "reload"});
        if(res && res.ok) await c.put(url, res);
      }catch(err){ /* offline telepites: majd a fetch-eseny potolja */ }
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(
    ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))
  )).then(()=>self.clients.claim()));
});
self.addEventListener("message", e=>{
  if(e.data === "skipWaiting") self.skipWaiting();
});
self.addEventListener("fetch", e=>{
  if(e.request.method !== "GET") return;
  // halozat-elso: amig van net, mindig a legfrissebb tartalmat kapod;
  // a gyorsitotar csak offline tartalek
  e.respondWith(
    fetch(e.request).then(res=>{
      if(res && res.ok){
        const copy = res.clone();
        caches.open(CACHE).then(c=>c.put(e.request, copy)).catch(()=>{});
      }
      return res;
    }).catch(()=>caches.match(e.request).then(hit=>hit || caches.match("./index.html")))
  );
});
