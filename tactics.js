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

function ensureGamePlayers(){
  games.forEach((g,i)=>{
    const p=PLAYER_PAIRS[i%PLAYER_PAIRS.length];
    if(!g.player_a) g.player_a=p[0];
    if(!g.player_b) g.player_b=p[1];
  });
}

function updateMatchStandings(){
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
    const a=Number(g.score_a), b=Number(g.score_b);
    if(!s[pa]||!s[pb]||pa===pb)return;
    if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<0)return;
    // 0 x 0 continua representando partida ainda nao jogada.
    if(a===0&&b===0)return;

    s[pa].j++;
    s[pb].j++;

    if(a>b){
      s[pa].w++;
      s[pa].pts+=3;
      s[pb].l++;
      s[pb].pts-=1;
    }else if(b>a){
      s[pb].w++;
      s[pb].pts+=3;
      s[pa].l++;
      s[pa].pts-=1;
    }else{
      s[pa].d++;
      s[pb].d++;
      s[pa].pts++;
      s[pb].pts++;
    }
  });

  const order=['R','B','C','L'];
  const rows=order.map(k=>s[k]);
  const standings=document.getElementById('standingsBody');
  const table=document.getElementById('tableBody');

  if(standings){
    standings.innerHTML=rows.map(r=>`<tr><td>${r.name}</td><td>${r.j}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td class="points">${r.pts}</td></tr>`).join('');
  }
  if(table){
    const ranked=[...rows].sort((a,b)=>b.pts-a.pts||b.w-a.w||b.j-a.j||order.indexOf(a.name)-order.indexOf(b.name));
    table.innerHTML=ranked.map((r,i)=>`<tr><td>${i+1}º</td><td>${r.name}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td class="points">${r.pts}</td></tr>`).join('');
  }
}

window.renderStandings=updateMatchStandings;

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

// Carrega/normaliza o dono de cada lado. Para registros antigos sem player_a/player_b,
// usa a ordem fixa das partidas e grava essa relacao no banco.
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
    // Garante que registros antigos tambem passem a ter os donos salvos.
    await persistPlayerOwners();
  }catch(e){console.error('Erro ao carregar donos dos jogadores:',e);updateMatchStandings()}
}
setTimeout(hydratePlayerOwners,900);

// RESETAR: volta nomes dos times para R/B/C/L, zera placares e preserva o dono de cada lado.
const resetGamesButton=document.getElementById('resetGames');
if(resetGamesButton){
  resetGamesButton.addEventListener('click',async(event)=>{
    event.stopImmediatePropagation();
    if(!confirm('Resetar os placares e a tabela?'))return;

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
      if(msg){msg.textContent='✓ Placares e tabela resetados!';setTimeout(()=>msg.textContent='',3000)}
    }catch(e){
      console.error(e);
      const msg=document.getElementById('gamesMsg');
      if(msg)msg.textContent='✕ Erro ao salvar o reset';
    }
  },true);
}
