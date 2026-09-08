(() => {
  const base=document.createElement('script');
  base.src='tactics-base.js';
  document.head.appendChild(base);
  const art=document.createElement('script');
  art.src='artilheiros.js';
  document.head.appendChild(art);
})();

// As iniciais R/B/C/L servem apenas para identificar o jogador.
// Quando o nome do time substituir a inicial, mantemos internamente
// qual jogador era o dono daquela partida (player_a/player_b).
function ensureMatchOwners(){
  games.forEach((g,i)=>{
    const p=pairs[i%6];
    if(!g.player_a) g.player_a=p[0];
    if(!g.player_b) g.player_b=p[1];
  });
}

async function loadMatchOwners(){
  try{
    const r=await fetch(GAMES+'?select=id,player_a,player_b&order=id.asc',{headers:H});
    if(r.ok){
      const rows=await r.json();
      rows.forEach(x=>{
        if(x.id>=1&&x.id<=18){
          games[x.id-1].player_a=x.player_a||pairs[(x.id-1)%6][0];
          games[x.id-1].player_b=x.player_b||pairs[(x.id-1)%6][1];
        }
      });
    }
  }catch(e){console.error(e)}
  ensureMatchOwners();
  updateMatchStandings();
}

// A tabela usa o nome que estiver escrito nos campos das partidas.
// O jogador pode substituir R/B/C/L por qualquer nome de time.
function updateMatchStandings(){
  const s={};
  const keyOf=value=>String(value ?? '').trim().toLowerCase();

  games.forEach(g=>{
    const aName=String(g.team_a ?? '').trim();
    const bName=String(g.team_b ?? '').trim();
    const aKey=keyOf(aName), bKey=keyOf(bName);
    const a=Number(g.score_a), b=Number(g.score_b);

    if(!aName||!bName||!aKey||!bKey||aKey===bKey)return;
    if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<0)return;
    // 0x0 continua sendo considerado campo ainda não jogado.
    if(a===0&&b===0)return;

    if(!s[aKey])s[aKey]={name:aName,j:0,w:0,d:0,l:0,pts:0};
    if(!s[bKey])s[bKey]={name:bName,j:0,w:0,d:0,l:0,pts:0};

    s[aKey].j++;
    s[bKey].j++;

    if(a>b){
      s[aKey].w++;
      s[aKey].pts+=3;
      s[bKey].l++;
      s[bKey].pts-=1;
    }else if(b>a){
      s[bKey].w++;
      s[bKey].pts+=3;
      s[aKey].l++;
      s[aKey].pts-=1;
    }else{
      s[aKey].d++;
      s[bKey].d++;
      s[aKey].pts++;
      s[bKey].pts++;
    }
  });

  const rows=Object.values(s).sort((a,b)=>b.pts-a.pts||b.w-a.w||b.j-a.j||a.name.localeCompare(b.name));
  const standings=document.getElementById('standingsBody');
  const table=document.getElementById('tableBody');

  if(standings){
    standings.innerHTML=rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${r.j}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td class="points">${r.pts}</td></tr>`).join('');
  }
  if(table){
    table.innerHTML=rows.map((r,i)=>`<tr><td>${i+1}º</td><td>${esc(r.name)}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td class="points">${r.pts}</td></tr>`).join('');
  }
}

window.renderStandings=updateMatchStandings;

// Garante que qualquer nome digitado no lugar da inicial continue ligado
// ao jogador que estava originalmente naquela posição.
document.addEventListener('input',(event)=>{
  const el=event.target;
  if(!el.classList||!el.classList.contains('gameInput'))return;
  const i=Number(el.dataset.i);
  if(!Number.isInteger(i)||!games[i])return;
  const p=pairs[i%6];
  if(!games[i].player_a)games[i].player_a=p[0];
  if(!games[i].player_b)games[i].player_b=p[1];
},true);

// Antes de o salvamento normal das partidas acontecer, grava tambem
// os jogadores donos de cada lado no banco.
const saveGamesButton=document.getElementById('saveGames');
if(saveGamesButton){
  saveGamesButton.addEventListener('click',async()=>{
    ensureMatchOwners();
    try{
      for(const g of games){
        const r=await fetch(GAMES+'?id=eq.'+g.id,{method:'PATCH',headers:{...HJSON,Prefer:'return=minimal'},body:JSON.stringify({player_a:g.player_a,player_b:g.player_b})});
        if(!r.ok)throw new Error(await r.text());
      }
    }catch(e){console.error('Erro ao salvar donos das partidas:',e)}
  },true);
}

setTimeout(()=>{
  ensureMatchOwners();
  loadMatchOwners();
},300);

// O RESETAR zera os placares, restaura as iniciais e grava o reset no banco.
const resetGamesButton=document.getElementById('resetGames');
if(resetGamesButton){
  resetGamesButton.addEventListener('click',async(event)=>{
    event.stopImmediatePropagation();
    if(!confirm('Resetar os placares e a tabela?'))return;

    games.forEach((g,i)=>{
      const p=pairs[i%6];
      g.team_a=p[0];
      g.team_b=p[1];
      g.player_a=p[0];
      g.player_b=p[1];
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
      if(msg){msg.textContent='✓ Placares, nomes e jogadores resetados!';setTimeout(()=>msg.textContent='',3000)}
    }catch(e){
      console.error(e);
      const msg=document.getElementById('gamesMsg');
      if(msg)msg.textContent='✕ Erro ao salvar o reset';
    }
  },true);
}
