// Offline cache: newest files when online, saved copy when offline or slow.
const CACHE='sound-garden-v20';
const FILES=['./','index.html','manifest.webmanifest','privacy.html','support.js','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png'];
// Spoken clips are listed in sounds/tts/clips.json; save them all so the voice works offline. Missing clips are fine.
const saveClips=c=>fetch('sounds/tts/clips.json',{cache:'reload'}).then(r=>r.ok?r.json():[]).then(l=>Promise.all(l.map(n=>c.add(new Request('sounds/tts/'+n+'.mp3',{cache:'reload'})).catch(()=>{})))).catch(()=>{});
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'}))).then(()=>saveClips(c))));self.skipWaiting()});
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
