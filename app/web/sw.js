/* Offline support for the hosted app (not used by the desktop launcher).
   App files: from the cache, which each release replaces. Market data: network first, last saved copy when offline. */
const VERSION="sparplan-dev"; // the publish workflow stamps the commit here so every release replaces the cache
const SHELL=["./","index.html","app.css","core.js","i18n.js","lang/de.js","lang/fr.js","lang/es.js","app.js","icon.png","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png",
 "fonts/fonts.css","fonts/sourcesans3-latin.woff2","fonts/sourcesans3-latin-ext.woff2","fonts/sourceserif4-latin.woff2","fonts/sourceserif4-latin-ext.woff2"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=="GET"||u.origin!==location.origin)return;
 if(u.pathname.endsWith("/market-data.json")){
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(VERSION).then(x=>x.put("market-data.json",c))}return r})
   .catch(()=>caches.match("market-data.json").then(hit=>hit||Response.error())));
  return;
 }
 e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||fetch(e.request)));
});
