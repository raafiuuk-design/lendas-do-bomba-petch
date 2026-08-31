(() => {
  const SUPA_URL='https://vgurvbdbpxcgkhmunlxr.supabase.co';
  const SUPA_KEY='sb_publishable_Dlgj0c5D_PVKP0h7x6GZ4w_BssxbIoj';
  const API=SUPA_URL+'/rest/v1/artilheiros';
  const HEAD={apikey:SUPA_KEY,Authorization:'Bearer '+SUPA_KEY,'Content-Type':'application/json'};
  let rows=[];
  function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
  function addUI(){
    const nav=document.getElementById('nav'),main=document.querySelector('main.wrap'); if(!nav||!main)return;
    if(!document.getElementById('artilheirosNav')){const b=document.createElement('button');b.id='artilheirosNav';b.dataset.page='artilheiros';b.textContent='⚽ Artilheiros';b.addEventListener('click',()=>window.showPage&&window.showPage('artilheiros'));nav.appendChild(b)}
    if(!document.getElementById('artilheiros')){const s=document.createElement('section');s.id='artilheiros';s.className='page';s.innerHTML='<h1>⚽ Artilheiros</h1><p class="muted">Cadastre o nome do jogador e a quantidade de gols.</p><div class="card"><div id="artilheirosGrid" class="slots"></div><div class="savebar"><button id="saveArtilheiros" class="btn primary">💾 Salvar artilheiros</button><span id="artilheirosMsg" class="ok"></span></div></div>';main.appendChild(s);document.getElementById('saveArtilheiros').addEventListener('click',save)}
  }
  async function load(){addUI();const grid=document.getElementById('artilheirosGrid');if(!grid)return;grid.innerHTML='<p class="muted">Carregando artilheiros...</p>';try{const r=await fetch(API+'?select=id,player_name,goals&order=id.asc',{headers:HEAD,cache:'no-store'});if(!r.ok)throw new Error(await r.text());rows=await r.json();while(rows.length<30)rows.push({id:null,player_name:'',goals:0});render()}catch(e){console.error(e);grid.innerHTML='<p class="muted">Não foi possível carregar os artilheiros.</p>'}}
  function render(){const grid=document.getElementById('artilheirosGrid');grid.innerHTML=rows.slice(0,30).map((r,i)=>'<label class="slot"><span class="num">'+(i+1)+'</span><input class="input artilheiroName" data-i="'+i+'" value="'+esc(r.player_name||'')+'" placeholder="Nome do jogador"><input class="input artilheiroGoals" data-i="'+i+'" type="number" min="0" value="'+Math.max(0,Number(r.goals)||0)+'" placeholder="Gols" style="max-width:120px"></label>').join('')}
  async function save(){const msg=document.getElementById('artilheirosMsg');msg.textContent='Salvando...';try{const names=document.querySelectorAll('.artilheiroName'),goals=document.querySelectorAll('.artilheiroGoals');for(let i=0;i<names.length;i++){const row=rows[i],body={player_name:names[i].value.trim(),goals:Math.max(0,Number(goals[i].value)||0),updated_at:new Date().toISOString()};let r;if(row&&row.id)r=await fetch(API+'?id=eq.'+row.id,{method:'PATCH',headers:{...HEAD,Prefer:'return=minimal'},body:JSON.stringify(body)});else r=await fetch(API,{method:'POST',headers:{...HEAD,Prefer:'return=representation'},body:JSON.stringify(body)});if(!r.ok)throw new Error(await r.text())}msg.textContent='✓ Artilheiros salvos no site!';await load();setTimeout(()=>msg.textContent='',3000)}catch(e){console.error(e);msg.textContent='✕ Erro ao salvar';alert('Não foi possível salvar os artilheiros.')}}
  addUI();load();
})();
