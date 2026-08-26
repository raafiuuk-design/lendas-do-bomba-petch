/* PERFIS: acesso público sem senha. Este arquivo substitui o bloqueio antigo. */
document.addEventListener('DOMContentLoaded',()=>{
  const modal=document.getElementById('passwordModal');
  const profiles=window.players||[];
  window.openProfile=function(p){
    window.selectedPlayer=p;
    window.creating=false;
    if(modal) modal.classList.remove('show');
    try{
      if(typeof window.showProfile==='function') window.showProfile(p);
      else if(typeof window.go==='function') window.go('profile');
    }catch(e){
      console.error('Erro ao abrir perfil:',e);
      if(typeof window.go==='function') window.go('profile');
    }
  };
  const submit=document.getElementById('passwordSubmit');
  if(submit) submit.onclick=(e)=>{e.preventDefault(); if(modal) modal.classList.remove('show');};
  const cancel=document.getElementById('passwordCancel');
  if(cancel) cancel.onclick=()=>{if(modal) modal.classList.remove('show');};
  const cards=document.getElementById('profileCards');
  if(cards){
    cards.addEventListener('click',e=>{
      const card=e.target.closest('[data-player-code]');
      if(!card)return;
      const p=profiles.find(x=>x.code===card.dataset.playerCode);
      if(p) window.openProfile(p);
    });
  }
});