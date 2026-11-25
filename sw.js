// Offline cache: newest files when online, saved copy when offline or slow.
const CACHE='sound-garden-v15';
const FILES=['./','index.html','manifest.webmanifest','privacy.html','support.js','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  const cache=caches.open(CACHE);
  const net=fetch(req.url,{cache:'no-cache'}).then(async r=>{if(r.ok)await (await cache).put(req,r.clone());return r});
  e.waitUntil(net.catch(()=>{}));
  e.respondWith((async()=>{
    try{const r=await Promise.race([net,new Promise(r=>setTimeout(r,3000))]);if(r&&r.status<500)return r}catch{}
    return (await (await cache).match(req,{ignoreSearch:req.mode==='navigate'}))||net;
  })());
});
