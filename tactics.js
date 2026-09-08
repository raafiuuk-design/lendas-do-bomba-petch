(() => {
  const base=document.createElement('script');
  base.src='tactics-base.js';
  document.head.appendChild(base);
  const art=document.createElement('script');
  art.src='artilheiros.js';
  document.head.appendChild(art);
})();

/*
  REGRA DAS PARTIDAS:
  R/B/C/L identificam SEMPRE o jogador.
  O texto digitado no campo da partida e apenas o nome do time.
  Ex.: B -> MOSTRO continua contando para B (Berna).
  Ex.: B x R, com CHINA x BRASIL, conta CHINA para B e BRASIL para R.
*/
const PLAYER_PAIRS=[['R','B'],['R','C'],['R','L'],['B','C'],['B','L'],['C','L']];
const HISTORY_API=SUPA+'/rest/v1/bomba_petch_history';

function ensureGamePlayers(){
  games.forEach((g,i)=>{
    const p=PLAYER_PAIRS[i%PLAYER_PAIRS.length];
    if(!g.player_a) g.player_a=p[0];
    if(!g.player_b) g.player_b=p[1];
  });
}

function calculateStandings(){
  ensureGamePlayers();
  const s={
    R:{name:'R',j:0,w:0,d:0,l:0,pts:0},
    B:{name:'B',j:0,w:0,d:0,l:0,pts:0},
    C:{name:'C',j:0,w:0,d:0,l:0,pts:0},
    L:{name:'L',j:0,w:0,d:0,l:0,pts:0}
  };
  games.forEach(g=>{
    const pa=String(g.player_a||'').trim().toUpperCase();
    const pb=String(g.player_b||'').trim().toUpperCase();
    const a=Number(g.score_a),b=Number(g.score_b);
    if(!s[pa]||!s[pb]||pa===pb)return;
    if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<0)return;
    if(a===0&&b===0)return;
    s[pa].j++;s[pb].j++;
    if(a>b){s[pa].w++;s[pa].pts+=3;s[pb].l++;s[pb].pts-=1}
    else if(b>a){s[pb].w++;s[pb].pts+=3;s[pa].l++;s[pa].pts-=1}
    else{s[pa].d++;s[pb].d++;s[pa].pts++;s[pb].pts++}
  });
  return ['R','B','C','L'].map(k=>s[k]);
}

function updateMatchStandings(){
  const rows=calculateStandings();
  const order=['R','B','C','L'];
  const standings=document.getElementById('standingsBody');
  const table=document.getElementById('tableBody');
  if(standings)standings.innerHTML=rows.map(r=>`<tr><td>${r.name}</td><td>${r.j}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td class="points">${r.pts}</td></tr>`).join('');
  if(table){
    const ranked=[...rows].sort((a,b)=>b.pts-a.pts||b.w-a.w||b.j-a.j||order.indexOf(a.name)-order.indexOf(b.name));
    table.innerHTML=ranked.map((r,i)=>`<tr><td>${i+1}º</td><td>${r.name}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td class="points">${r.pts}</td></tr>`).join('');
  }
}
window.renderStandings=updateMatchStandings;

/* =========================
   HISTORIA DOS CAMPEONATOS
   ========================= */
let historyData=[];
let historySelected=0;

function historyTableHTML(snapshot){
  const rows=Array.isArray(snapshot)?snapshot:[];
  return `<div class="standings"><table><thead><tr><th>Jogador</th><th>J</th><th>V</th><th>E</th><th>D</th><th>Pontos</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${Number(r.j)||0}</td><td>${Number(r.w)||0}</td><td>${Number(r.d)||0}</td><td>${Number(r.l)||0}</td><td class="points">${Number(r.pts)||0}</td></tr>`).join('')}</tbody></table></div>`;
}

function renderHistory(){
  const box=document.getElementById('history');
  if(!box)return;
  const intro=`<h1>📜 História</h1><div class="card"><p>O BOMBA PETCH é disputado por <b>Rafagamer, Cristian, Leandro e Berna</b>.</p><p class="muted">As tabelas ficam registradas aqui quando um campeonato é resetado.</p></div>`;
  if(!historyData.length){
    box.innerHTML=intro+`<div class="card" style="margin-top:20px"><h2>🏆 Primeiro Campeonato Da Temporada</h2><p class="muted">Ainda não há campeonato encerrado. Quando você clicar em Resetar na aba Partidas, a tabela será salva aqui automaticamente.</p></div>`;
    return;
  }
  const tabs=historyData.map((h,i)=>`<button class="btn ${i===historySelected?'primary':''}" data-history="${i}">🏆 ${esc(h.title)}</button>`).join('');
  const h=historyData[historySelected]||historyData[0];
  const date=h.created_at?new Date(h.created_at).toLocaleString('pt-BR'):'';
  box.innerHTML=intro+`<div class="history-tabs" style="display:flex;gap:10px;flex-wrap:wrap;margin:20px 0">${tabs}</div><div class="card"><h2>${esc(h.title)}</h2><p class="muted">Registrado em ${esc(date)}</p>${historyTableHTML(h.snapshot)}</div>`;
  box.querySelectorAll('[data-history]').forEach(btn=>btn.addEventListener('click',()=>{historySelected=Number(btn.dataset.history);renderHistory()}));
}

async function loadHistory(){
  try{
    const r=await fetch(HISTORY_API+'?select=id,title,snapshot,created_at&order=id.asc',{headers:H});
    if(!r.ok)throw new Error(await r.text());
    historyData=await r.json();
    historySelected=Math.max(0,historyData.length-1);
  }catch(e){
    console.error('Erro ao carregar historia:',e);
    historyData=[];
  }
  renderHistory();
}

async function saveHistorySnapshot(){
  const snapshot=calculateStandings();
  if(!snapshot.length)return false;
  try{
    const countResponse=await fetch(HISTORY_API+'?select=id&order=id.desc&limit=1',{headers:H});
    if(!countResponse.ok)throw new Error(await countResponse.text());
    const existing=await countResponse.json();
    const n=(existing.length?Number(existing[0].id):0)+1;
    const ordinals=['Primeiro','Segundo','Terceiro','Quarto','Quinto','Sexto','Setimo','Oitavo','Nono','Decimo'];
    const ordinal=ordinals[n-1]||(`${n}º`);
    const title=`${ordinal} Campeonato Da Temporada`;
    const r=await fetch(HISTORY_API,{method:'POST',headers:{...HJSON,Prefer:'return=representation'},body:JSON.stringify({title,snapshot})});
    if(!r.ok)throw new Error(await r.text());
    const saved=await r.json();
    if(Array.isArray(saved)&&saved.length)historyData.push(saved[0]);
    else historyData.push({title,snapshot,created_at:new Date().toISOString()});
    historySelected=historyData.length-1;
    renderHistory();
    return true;
  }catch(e){
    console.error('Erro ao salvar historia:',e);
    const msg=document.getElementById('gamesMsg');
    if(msg)msg.textContent='✕ Não foi possível salvar a tabela na História';
    alert('Não foi possível salvar a tabela na História. O reset não foi realizado.');
    return false;
  }
}

// Mantem a tabela com R/B/C/L mesmo que o codigo original tente redesenha-la.
let fixingTable=false;
const tableObserver=new MutationObserver(()=>{
  if(fixingTable)return;
  clearTimeout(window.__bombaTableTimer);
  window.__bombaTableTimer=setTimeout(updateMatchStandings,0);
});
setTimeout(()=>{
  const a=document.getElementById('standingsBody');
  const b=document.getElementById('tableBody');
  if(a)tableObserver.observe(a,{childList:true,subtree:true});
  if(b)tableObserver.observe(b,{childList:true,subtree:true});
  updateMatchStandings();
  loadHistory();
},0);

// A posicao da partida define o jogador. O nome digitado nunca altera o jogador.
document.addEventListener('input',event=>{
  const el=event.target;
  if(!el.classList||!el.classList.contains('gameInput'))return;
  const i=Number(el.dataset.i);
  if(!games[i])return;
  const p=PLAYER_PAIRS[i%PLAYER_PAIRS.length];
  games[i].player_a=p[0];
  games[i].player_b=p[1];
  clearTimeout(window.__bombaInputTimer);
  window.__bombaInputTimer=setTimeout(updateMatchStandings,0);
},true);

// Salva tambem o jogador dono de cada lado no banco. O nome do time fica em team_a/team_b.
async function persistPlayerOwners(){
  ensureGamePlayers();
  try{
    for(const g of games){
      const r=await fetch(GAMES+'?id=eq.'+g.id,{method:'PATCH',headers:{...HJSON,Prefer:'return=minimal'},body:JSON.stringify({player_a:g.player_a,player_b:g.player_b})});
      if(!r.ok)throw new Error(await r.text());
    }
  }catch(e){console.error('Erro ao salvar jogador das partidas:',e)}
}

document.addEventListener('click',event=>{
  const btn=event.target.closest&&event.target.closest('#saveGames');
  if(!btn)return;
  ensureGamePlayers();
  setTimeout(persistPlayerOwners,1200);
},true);

async function hydratePlayerOwners(){
  ensureGamePlayers();
  try{
    const r=await fetch(GAMES+'?select=id,player_a,player_b&order=id.asc',{headers:H});
    if(r.ok){
      const rows=await r.json();
      rows.forEach(x=>{
        if(x.id>=1&&x.id<=18){
          const i=x.id-1;
          const p=PLAYER_PAIRS[i%PLAYER_PAIRS.length];
          games[i].player_a=String(x.player_a||p[0]).toUpperCase();
          games[i].player_b=String(x.player_b||p[1]).toUpperCase();
        }
      });
    }
    updateMatchStandings();
    await persistPlayerOwners();
  }catch(e){console.error('Erro ao carregar donos dos jogadores:',e);updateMatchStandings()}
}
setTimeout(hydratePlayerOwners,900);

// RESETAR: primeiro guarda a tabela atual na Historia. Depois zera placares e preserva o dono de cada lado.
const resetGamesButton=document.getElementById('resetGames');
if(resetGamesButton){
  resetGamesButton.addEventListener('click',async(event)=>{
    event.stopImmediatePropagation();
    if(!confirm('Salvar a tabela atual na História e depois resetar?'))return;

    const saved=await saveHistorySnapshot();
    if(!saved)return;

    games.forEach((g,i)=>{
      const p=PLAYER_PAIRS[i%PLAYER_PAIRS.length];
      g.player_a=p[0];
      g.player_b=p[1];
      g.team_a=p[0];
      g.team_b=p[1];
      g.score_a=0;
      g.score_b=0;
    });

    renderGames();
    updateMatchStandings();

    try{
      for(const g of games){
        const r=await fetch(GAMES+'?id=eq.'+g.id,{method:'PATCH',headers:{...HJSON,Prefer:'return=minimal'},body:JSON.stringify({team_a:g.team_a,score_a:0,score_b:0,team_b:g.team_b,player_a:g.player_a,player_b:g.player_b,updated_at:new Date().toISOString()})});
        if(!r.ok)throw new Error(await r.text());
      }
      const msg=document.getElementById('gamesMsg');
      if(msg){msg.textContent='✓ Tabela salva na História e partidas resetadas!';setTimeout(()=>msg.textContent='',4000)}
    }catch(e){
      console.error(e);
      const msg=document.getElementById('gamesMsg');
      if(msg)msg.textContent='✕ Erro ao salvar o reset';
    }
  },true);
}
