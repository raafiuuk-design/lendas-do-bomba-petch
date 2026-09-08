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

// Mantém a atualização automática enquanto os placares são editados.
window.renderStandings=updateMatchStandings;
setTimeout(updateMatchStandings,0);
