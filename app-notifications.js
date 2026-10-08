(()=>{
'use strict';
const API='https://vgurvbdbpxcgkhmunlxr.supabase.co/functions/v1/bomba-app-push';
const KEY='sb_publishable_Dlgj0c5D_PVKP0h7x6GZ4w_BssxbIoj';
const STORAGE='bomba-push-registration-v1';
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
let card,button,message,registration,busy=false;
function saved(){try{return JSON.parse(localStorage.getItem(STORAGE)||'null');}catch{return null;}}
async function request(action,data){
 const response=await fetch(API+'?action='+action,{method:data?'POST':'GET',headers:{apikey:KEY,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});
 if(!response.ok)throw new Error('Não foi possível conectar o serviço de notificações. Tente novamente.');
 return response.json();
}
function keyBytes(key){return Uint8Array.from(atob(key.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-key.length%4)%4)),c=>c.charCodeAt(0));}
async function refresh(){
 if(!card)return;
 card.hidden=!standalone();
 if(card.hidden)return;
 if(!('Notification' in window)||!('PushManager' in window)||!('serviceWorker' in navigator)){
 button.hidden=true;message.textContent='Este dispositivo não oferece notificações para o aplicativo. No iPhone, use iOS 16.4 ou superior.';return;
 }
 if(Notification.permission==='denied'){button.disabled=true;message.textContent='Notificações bloqueadas. Ative a permissão nas configurações do celular para receber os avisos.';return;}
 try{
 registration=await navigator.serviceWorker.ready;
 const sub=await registration.pushManager.getSubscription(),record=saved();
 const active=Boolean(sub&&record&&record.endpoint===sub.endpoint&&record.registered===true&&Notification.permission==='granted');
 button.textContent=active?'🔕 Desativar notificações':'🔔 Receber notificações';
 button.dataset.active=String(active);
 button.disabled=busy;
 message.textContent=active?'Você receberá avisos quando uma atualização for publicada no site.':'Ative para receber avisos das novidades do Bomba Patch.';
 }catch{message.textContent='Não foi possível verificar as notificações. Abra o aplicativo novamente.';}
}
async function toggle(){
 if(busy||!standalone())return;
 busy=true;button.disabled=true;
 try{
 if(button.dataset.active==='true'){
 const sub=await registration.pushManager.getSubscription(),record=saved();
 if(sub&&record){await request('unsubscribe',{endpoint:sub.endpoint,capability:record.capability});await sub.unsubscribe();}
 localStorage.removeItem(STORAGE);
 }else{
 // Request directly from the user's tap, before any network call.
 const permission=await Notification.requestPermission();
 if(permission!=='granted'){message.textContent='Autorize as notificações para receber os avisos.';return;}
 const config=await request('config');
 registration=await navigator.serviceWorker.ready;
 let sub=await registration.pushManager.getSubscription(),record=saved();
 if(sub&&(!record||record.endpoint!==sub.endpoint)){await sub.unsubscribe();sub=null;}
 const capability=record?.capability||crypto.randomUUID();
 const provisional={capability,endpoint:null};
 localStorage.setItem(STORAGE,JSON.stringify(provisional));
 if(!sub)sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(config.publicKey)});
 // Persist the recovery token before saving remotely, so retries use the same token.
 record={capability,endpoint:sub.endpoint};
 localStorage.setItem(STORAGE,JSON.stringify(record));
 await request('subscribe',{subscription:sub.toJSON(),capability});
 localStorage.setItem(STORAGE,JSON.stringify({...record,registered:true}));
 }
 busy=false;await refresh();
 }catch(error){message.textContent=error.message||'Não foi possível ativar os avisos. Tente novamente.';}
 finally{busy=false;button.disabled=Notification.permission==='denied';}
}
function init(){
 const home=document.querySelector('#home .hero');if(!home)return;
 card=document.createElement('div');card.className='card';card.id='bombaPushCard';card.hidden=true;card.style.marginTop='24px';
 card.innerHTML='<h2>🔔 Notificações do aplicativo</h2><p>Receba um aviso no celular quando houver uma nova publicação no site.</p><button class="btn primary" type="button">🔔 Receber notificações</button><p class="muted" role="status" aria-live="polite"></p>';
 home.append(card);button=card.querySelector('button');message=card.querySelector('[role="status"]');
 button.addEventListener('click',toggle);refresh();
 matchMedia('(display-mode: standalone)').addEventListener('change',refresh);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();