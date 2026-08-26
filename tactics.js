const TACTIC_FORMATIONS={"5-4-1":[[50,91,"GOL"],[18,78,"LAT"],[38,82,"ZAG"],[62,82,"ZAG"],[82,78,"LAT"],[25,61,"MEI"],[42,65,"MEI"],[58,65,"MEI"],[75,61,"MEI"],[50,27,"ATA"]],"4-3-3":[[50,91,"GOL"],[20,76,"LAT"],[40,82,"ZAG"],[60,82,"ZAG"],[80,76,"LAT"],[30,59,"MEI"],[50,64,"MEI"],[70,59,"MEI"],[24,32,"ATA"],[50,25,"ATA"],[76,32,"ATA"]],"3-5-2":[[50,91,"GOL"],[28,78,"ZAG"],[50,82,"ZAG"],[72,78,"ZAG"],[12,58,"ALA"],[32,62,"MEI"],[50,66,"MEI"],[68,62,"MEI"],[88,58,"ALA"],[38,29,"ATA"],[62,29,"ATA"]],"4-4-2":[[50,91,"GOL"],[20,76,"LAT"],[40,82,"ZAG"],[60,82,"ZAG"],[80,76,"LAT"],[20,57,"MEI"],[40,61,"MEI"],[60,61,"MEI"],[80,57,"MEI"],[38,31,"ATA"],[62,31,"ATA"]],"4-2-3-1":[[50,91,"GOL"],[20,76,"LAT"],[40,82,"ZAG"],[60,82,"ZAG"],[80,76,"LAT"],[38,61,"VOL"],[62,61,"VOL"],[25,43,"MEI"],[50,38,"MEI"],[75,43,"MEI"],[50,25,"ATA"]],"3-4-3":[[50,91,"GOL"],[28,79,"ZAG"],[50,83,"ZAG"],[72,79,"ZAG"],[18,59,"ALA"],[40,63,"MEI"],[60,63,"MEI"],[82,59,"ALA"],[24,31,"ATA"],[50,25,"ATA"],[76,31,"ATA"]],"5-3-2":[[50,91,"GOL"],[14,76,"LAT"],[32,82,"ZAG"],[50,84,"ZAG"],[68,82,"ZAG"],[86,76,"LAT"],[30,59,"MEI"],[50,64,"MEI"],[70,59,"MEI"],[38,30,"ATA"],[62,30,"ATA"]],"4-5-1":[[50,91,"GOL"],[20,76,"LAT"],[40,82,"ZAG"],[60,82,"ZAG"],[80,76,"LAT"],[18,57,"MEI"],[34,61,"MEI"],[50,64,"MEI"],[66,61,"MEI"],[82,57,"MEI"],[50,27,"ATA"]]};
let currentTactic='4-3-3';
function tacticsKey(){return 'bomba-petch-tactics-'+((window.selectedPlayer&&window.selectedPlayer.code)||'global');}
function renderTactics(){const host=document.getElementById('tacticsHost');if(!host)return;host.innerHTML='<div class="tactics-panel"><h2>🧠 TÁTICAS</h2><p class="muted">Escolha uma formação para visualizar o time no campo.</p><div class="tactics-tabs">'+Object.keys(TACTIC_FORMATIONS).map(f=>'<button class="'+(f===currentTactic?'active':'')+'" data-tactic="'+f+'">'+f+'</button>').join('')+'</div><div id="tacticsPitch" class="pitch"></div><div class="tactics-actions"><button class="btn primary" id="saveTacticsBtn">💾 Salvar tática</button><span id="tacticsMsg" class="tactics-msg"></span></div></div>';host.querySelectorAll('[data-tactic]').forEach(b=>b.onclick=()=>{currentTactic=b.dataset.tactic;renderTactics()});const pitch=document.getElementById('tacticsPitch');pitch.innerHTML=TACTIC_FORMATIONS[currentTactic].map((p,i)=>'<div class="tplayer" style="left:'+p[0]+'%;top:'+p[1]+'%"><span>'+String(i+1)+'</span><input id="tactic-'+i+'" placeholder="'+p[2]+'"></div>').join('');try{const data=JSON.parse(localStorage.getItem(tacticsKey())||'{}')[currentTactic]||[];data.forEach((v,i)=>{const el=document.getElementById('tactic-'+i);if(el)el.value=v})}catch(e){}document.getElementById('saveTacticsBtn').onclick=saveTactics;}
function saveTactics(){const vals=TACTIC_FORMATIONS[currentTactic].map((_,i)=>document.getElementById('tactic-'+i)?.value||'');const data=JSON.parse(localStorage.getItem(tacticsKey())||'{}');data[currentTactic]=vals;localStorage.setItem(tacticsKey(),JSON.stringify(data));const m=document.getElementById('tacticsMsg');m.textContent='✓ Tática salva neste dispositivo!';setTimeout(()=>m.textContent='',2500)}
function ensureTactics(){const pc=document.getElementById('profileContent');if(!pc)return;if(!document.getElementById('tacticsHost')){const host=document.createElement('div');host.id='tacticsHost';pc.appendChild(host)}renderTactics()}
const observer=new MutationObserver(()=>{if(document.getElementById('profile')?.classList.contains('active'))ensureTactics()});observer.observe(document.body,{subtree:true,childList:true});document.addEventListener('DOMContentLoaded',ensureTactics);

/* CORREÇÃO DO LOGIN DOS PERFIS: não clona nem duplica o botão original. */
(function(){
  const RPC_URL='https://vgurvbdbpxcgkhmunlxr.supabase.co/rest/v1/rpc/';
  const KEY='sb_publishable_Dlgj0c5D_PVKP0h7x6GZ4w_BssxbIoj';
  function installAuth(){
    const btn=document.getElementById('passwordSubmit'),p1=document.getElementById('password1'),p2=document.getElementById('password2'),modal=document.getElementById('passwordModal');
    if(!btn||!p1||!p2||!modal||btn.dataset.authFixed==='1')return;
    btn.dataset.authFixed='1';btn.removeAttribute('onclick');
    let busy=false;
    const login=async()=>{
      if(busy)return;
      const err=document.getElementById('passwordError');
      const player=window.selectedPlayer;
      const pass=p1.value;
      err.textContent='';
      if(!player){err.textContent='Selecione o jogador novamente.';return}
      if(pass.length<4){err.textContent='A senha precisa ter pelo menos 4 caracteres.';return}
      const isCreating=window.creating===true;
      if(isCreating&&pass!==p2.value){err.textContent='As senhas não conferem.';return}
      busy=true;btn.disabled=true;btn.textContent='Verificando...';
      try{
        const h={apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'};
        if(isCreating){
          const r=await fetch(RPC_URL+'bomba_petch_set_password',{method:'POST',headers:h,body:JSON.stringify({p_player_code:player.code,p_password:pass})});
          if(!r.ok)throw new Error(await r.text());
          const created=await r.json();
          if(created!==true){err.textContent='Não foi possível criar a senha.';return}
          window.creating=false;
        }
        const r=await fetch(RPC_URL+'bomba_petch_verify_profile',{method:'POST',headers:h,body:JSON.stringify({p_player_code:player.code,p_password:pass})});
        if(!r.ok)throw new Error(await r.text());
        const result=await r.json();
        if(!(result===true||result?.ok===true||result?.valid===true||result?.player_code)) {err.textContent='Senha incorreta.';return}
        modal.classList.remove('show');
        if(typeof window.showProfile==='function')window.showProfile(result);
      }catch(e){console.error(e);err.textContent='Erro de conexão. Tente novamente.'}
      finally{busy=false;btn.disabled=false;btn.textContent='Continuar'}
    };
    btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();login()});
    p1.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();login()}});
    p2.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();login()}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installAuth);else installAuth();
  setTimeout(installAuth,300);
})();