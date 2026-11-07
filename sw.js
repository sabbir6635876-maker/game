// Service Worker: cache-first, তাই অফলাইনেও চলবে
const C='chacha-v1',A=['./','index.html','data.js','game.js','manifest.json','icon.svg','https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>Promise.all(A.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));return res;}).catch(()=>caches.match('index.html'))));});
