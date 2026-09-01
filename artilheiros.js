(() => {
  const SUPA_URL='https://vgurvbdbpxcgkhmunlxr.supabase.co';
  const SUPA_KEY='sb_publishable_Dlgj0c5D_PVKP0h7x6GZ4w_BssxbIoj';
  const API=SUPA_URL+'/rest/v1/artilheiros';
  const HEAD={apikey:SUPA_KEY,Authorization:'Bearer '+SUPA_KEY,'Content-Type':'application/json'};
  let rows=[];
  let unlocked=false;

  function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
  function addStyles(){
    if(document.getElementById('artPasswordStyles'))return;
    const st=document.createElement('style');st.id='artPasswordStyles';
    st.textContent='.art-pass-overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px}.art-pass-box{width:min(430px,100%);background:#121720;border:1px solid #343b47;border-radius:16px;padding:28px;box-shadow:0 20px 60px #000}.art-pass-box h2{margin-top:0;color:#ff7300}.art-pass-box input{width:100%;padding:13px;margin:7px 0;background:#080b10;color:#fff;border:1px solid #343b47;border-radius:8px;font-size:16px}.art-pass-box .err{color:#ff7373;min-height:24px;margin-top:6px}.art-pass-actions{display:flex;gap:10px;margin-top:12px}.art-pass-actions button{flex:1}';
    document.head.appendChild(st);
  }
  function hasPassword(){return !!localStorage.getItem('bomba_petch_artilheiros_password')}
  function openProtected(){
    if(unlocked){openPage();return}
    addStyles();
    const first=!hasPassword();
    const o=document.createElement('div');o.className='art-pass-overlay';
    o.innerHTML=first
      ? '<div class="art-pass-box"><h2>🔐 Criar senha dos Artilheiros</h2><p class="muted">Esta é a primeira vez que você entra. Escolha uma senha para proteger esta aba.</p><input id="artPass1" type="password" placeholder="Digite sua nova senha" autocomplete="new-password"><input id="artPass2" type="password" placeholder="Confirme sua nova senha" autocomplete="new-password"><div class="err" id="artPassErr"></div><div class="art-pass-actions"><button class="btn" id="artPassCancel">Cancelar</button><button class="btn primary" id="artPassOk">Criar senha</button></div></div>'
      : '<div class="art-pass-box"><h2>🔐 Artilheiros</h2><p class="muted">Digite a senha para entrar nesta aba.</p><input id="artPass1" type="password" placeholder="Digite sua senha" autocomplete="current-password"><div class="err" id="artPassErr"></div><div class="art-pass-actions"><button class="btn" id="artPassCancel">Cancelar</button><button class="btn primary" id="artPassOk">Entrar</button></div></div>';
    document.body.appendChild(o);
    const input=o.querySelector('#artPass1'), err=o.querySelector('#artPassErr'), btn=o.querySelector('#artPassOk');
    o.querySelector('#artPassCancel').onclick=()=>o.remove();
    btn.onclick=()=>{
      const p=input.value;
      err.textContent='';
      if(p.length<4){err.textContent='A senha precisa ter pelo menos 4 caracteres.';return}
      if(first){
        const p2=o.querySelector('#artPass2').value;
        if(p!==p2){err.textContent='As senhas não são iguais.';return}
        localStorage.setItem('bomba_petch_artilheiros_password',p);
        unlocked=true;o.remove();openPage();return;
      }
      if(p===localStorage.getItem('bomba_petch_artilheiros_password')){unlocked=true;o.remove();openPage();}
      else err.textContent='Senha incorreta.';
    };
    input.addEventListener('keydown',e=>{if(e.key==='Enter')btn.click()});
    input.focus();
  }
  function openPage(){
    document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
    const page=document.getElementById('artilheiros');if(page)page.classList.add('active');
    document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.page==='artilheiros'));
    window.scrollTo({top:0,behavior:'smooth'});load();
  }
  function addUI(){
    const nav=document.getElementById('nav'),main=document.querySelector('main.wrap');if(!nav||!main)return;
    addStyles();
    if(!document.getElementById('artilheirosNav')){
      const b=document.createElement('button');b.id='artilheirosNav';b.dataset.page='artilheiros';b.textContent='⚽ Artilheiros';b.onclick=openProtected;nav.appendChild(b);
    }
    if(!document.getElementById('artilheiros')){
      const s=document.createElement('section');s.id='artilheiros';s.className='page';
      s.innerHTML='<h1>⚽ Artilheiros</h1><p class="muted">Cadastre o nome do jogador e a quantidade de gols.</p><div class="card"><div id="artilheirosGrid" class="slots"></div><div class="savebar"><button id="saveArtilheiros" class="btn primary">💾 Salvar artilheiros</button><span id="artilheirosMsg" class="ok"></span></div></div>';
      main.appendChild(s);document.getElementById('saveArtilheiros').onclick=save;
    }
  }
  async function load(){
    addUI();const grid=document.getElementById('artilheirosGrid');if(!grid)return;
    grid.innerHTML='<p class="muted">Carregando artilheiros...</p>';
    try{const r=await fetch(API+'?select=id,player_name,goals&order=id.asc',{headers:HEAD,cache:'no-store'});if(!r.ok)throw new Error(await r.text());rows=await r.json();while(rows.length<30)rows.push({id:null,player_name:'',goals:0});render();}
    catch(e){console.error(e);grid.innerHTML='<p class="muted">Não foi possível carregar os artilheiros.</p>';}
  }
  function render(){
    const grid=document.getElementById('artilheirosGrid');
    grid.innerHTML=rows.slice(0,30).map((r,i)=>'<label class="slot"><span class="num">'+(i+1)+'</span><input class="input artilheiroName" data-i="'+i+'" value="'+esc(r.player_name||'')+'" placeholder="Nome do jogador"><input class="input artilheiroGoals" data-i="'+i+'" type="number" min="0" value="'+Math.max(0,Number(r.goals)||0)+'" placeholder="Gols" style="max-width:120px"></label>').join('');
  }
  async function save(){
    if(!unlocked){openProtected();return}
    const msg=document.getElementById('artilheirosMsg');msg.textContent='Salvando...';
    try{const names=document.querySelectorAll('.artilheiroName'),goals=document.querySelectorAll('.artilheiroGoals');for(let i=0;i<names.length;i++){const row=rows[i],body={player_name:names[i].value.trim(),goals:Math.max(0,Number(goals[i].value)||0),updated_at:new Date().toISOString()};let r;if(row&&row.id)r=await fetch(API+'?id=eq.'+row.id,{method:'PATCH',headers:{...HEAD,Prefer:'return=minimal'},body:JSON.stringify(body)});else r=await fetch(API,{method:'POST',headers:{...HEAD,Prefer:'return=representation'},body:JSON.stringify(body)});if(!r.ok)throw new Error(await r.text())}msg.textContent='✓ Artilheiros salvos no site!';await load();setTimeout(()=>msg.textContent='',3000)}catch(e){console.error(e);msg.textContent='✕ Erro ao salvar';}
  }
  addUI();
})();