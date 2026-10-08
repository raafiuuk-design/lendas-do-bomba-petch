/* Online app: requests and saves always go directly to the server. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

self.addEventListener('push',event=>{
 let data={};try{data=event.data?event.data.json():{};}catch{}
 event.waitUntil(self.registration.showNotification(data.title||'⚽ Bomba Patch atualizado!',{
 body:data.body||'Abra o aplicativo para conferir as novidades.',
 icon:'./icons/icon-192.png',badge:'./icons/icon-192.png',
 tag:data.tag||'bomba-update',data:{url:self.registration.scope},renotify:false
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil((async()=>{
 const url=self.registration.scope;
 const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 for(const client of windows){if(client.url.startsWith(url)&&'focus' in client){await client.focus();return;}}
 await self.clients.openWindow(url);
 })());
});
