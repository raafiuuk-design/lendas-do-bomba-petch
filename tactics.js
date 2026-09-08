(() => {
  const base=document.createElement('script');
  base.src='tactics-base.js';
  document.head.appendChild(base);
  const art=document.createElement('script');
  art.src='artilheiros.js';
  document.head.appendChild(art);
})();

// Corrige a contabilização da tabela de partidas.
// Aceita tanto os códigos (R/B/C/L) quanto os nomes completos.
function normalizeMatchPlayer(value){
  const v=String(value ?? '').trim().toLowerCase();
  const p=players.find(x => x.code.toLowerCase()===v || x.name.toLowerCase()===v);
  return p ? p.code : null;
}

function updateMatchStandings(){
  const s={};
  players.forEach(p => s[p.code]={name:p.name,j:0,w:0,d:0,l:0,pts:0});

  games.forEach(g => {
    const aPlayer=normalizeMatchPlayer(g.team_a);
    const bPlayer=normalizeMatchPlayer(g.team_b);
    const a=Number(g.score_a);
    const b=Number(g.score_b);

    if(!aPlayer || !bPlayer || aPlayer===bPlayer) return;
    if(!Number.isFinite(a) || !Number.isFinite(b) || a<0 || b<0) return;
    if(a===0 && b===0) return;

    s[aPlayer].j++;
    s[bPlayer].j++;

    if(a>b){
      s[aPlayer].w++;
      s[aPlayer].pts+=3;
      s[bPlayer].l++;
      s[bPlayer].pts-=1;
    }else if(b>a){
      s[bPlayer].w++;
      s[bPlayer].pts+=3;
      s[aPlayer].l++;
      s[aPlayer].pts-=1;
    }else{
      s[aPlayer].d++;
      s[bPlayer].d++;
      s[aPlayer].pts++;
      s[bPlayer].pts++;
    }
  });

  const rows=Object.values(s).sort((a,b)=>b.pts-a.pts || b.w-a.w || b.j-a.j);
  const standings=document.getElementById('standingsBody');
  const table=document.getElementById('tableBody');

  if(standings){
    standings.innerHTML=rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${r.j}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td class="points">${r.pts}</td></tr>`).join('');
  }
  if(table){
    table.innerHTML=rows.map((r,i)=>`<tr><td>${i+1}º</td><td>${esc(r.name)}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td class="points">${r.pts}</td></tr>`).join('');
  }
}

// Substitui a função usada pelo site para manter a tabela atualizada.
window.renderStandings=updateMatchStandings;
setTimeout(updateMatchStandings,0);

// Ao clicar em RESETAR, zera os placares, a tabela e tambem salva o zero no banco.
const resetGamesButton=document.getElementById('resetGames');
if(resetGamesButton){
  resetGamesButton.addEventListener('click',async(event)=>{
    event.stopImmediatePropagation();
    if(!confirm('Resetar os placares e a tabela?')) return;

    games.forEach((g,i)=>{
      const p=pairs[i%6];
      g.team_a=p[0];
      g.team_b=p[1];
      g.score_a=0;
      g.score_b=0;
    });

    renderGames();
    updateMatchStandings();

    try{
      for(const g of games){
        const r=await fetch(GAMES+'?id=eq.'+g.id,{method:'PATCH',headers:{...HJSON,Prefer:'return=minimal'},body:JSON.stringify({team_a:g.team_a,score_a:0,score_b:0,team_b:g.team_b,updated_at:new Date().toISOString()})});
        if(!r.ok) throw new Error(await r.text());
      }
      const msg=document.getElementById('gamesMsg');
      if(msg){msg.textContent='✓ Placares e tabela resetados!';setTimeout(()=>msg.textContent='',3000);}
    }catch(e){
      console.error(e);
      const msg=document.getElementById('gamesMsg');
      if(msg)msg.textContent='✕ Erro ao salvar o reset';
    }
  },true);
}
