(() => {
  const base=document.createElement('script');
  base.src='tactics-base.js';
  document.head.appendChild(base);
  const art=document.createElement('script');
  art.src='artilheiros.js';
  document.head.appendChild(art);
})();

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

    if(!aName || !bName || !aKey || !bKey || aKey===bKey) return;
    if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<0) return;
    // 0x0 continua sendo considerado campo ainda não jogado.
    if(a===0 && b===0) return;

    if(!s[aKey]) s[aKey]={name:aName,j:0,w:0,d:0,l:0,pts:0};
    if(!s[bKey]) s[bKey]={name:bName,j:0,w:0,d:0,l:0,pts:0};

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
setTimeout(updateMatchStandings,0);

// O RESETAR zera os placares e tambem grava o reset no banco.
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
