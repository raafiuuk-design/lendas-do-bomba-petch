/* Remove a antiga aba Perfis sem alterar a proteção da Tabela. */
(function(){
  function removeProfiles(){
    document.querySelectorAll('[data-page="profiles"]').forEach(el=>el.remove());
    const profiles=document.getElementById('profiles');
    if(profiles) profiles.remove();
    const profile=document.getElementById('profile');
    if(profile) profile.remove();
    const passwordModal=document.getElementById('passwordModal');
    if(passwordModal) passwordModal.remove();
    document.querySelectorAll('[onclick*="go(\'profiles\')"]').forEach(el=>el.remove());
    if(window.location.hash==='#profiles'||window.location.hash==='#profile'){
      if(typeof window.go==='function') window.go('home');
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',removeProfiles);
  else removeProfiles();
})();