(()=>{
let installPrompt=null;
const button=document.getElementById('installBombaApp'),panel=document.getElementById('bombaInstallHelp');
const installed=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
if(installed())document.getElementById('bombaAppCard').hidden=true;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;button.textContent='📲 Instalar aplicativo';});
window.addEventListener('appinstalled',()=>{installPrompt=null;document.getElementById('bombaAppCard').hidden=true;});
button.addEventListener('click',async()=>{
if(installPrompt){const prompt=installPrompt;installPrompt=null;await prompt.prompt();await prompt.userChoice;return;}
panel.hidden=!panel.hidden;
});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(console.error));
const status=document.getElementById('bombaConnectionStatus');
function connection(){status.hidden=navigator.onLine;status.textContent='Sem conexão. Conecte à internet para carregar e salvar os dados do campeonato.';}
window.addEventListener('offline',connection);window.addEventListener('online',connection);connection();
document.addEventListener('click',event=>{
if(navigator.onLine)return;
const target=event.target.closest('button');
if(target&&(/salvar|resetar|deletar|criar|limpar/i.test(target.textContent))){event.preventDefault();event.stopImmediatePropagation();alert('Conecte à internet antes de alterar ou salvar os dados.');}
},true);
})();