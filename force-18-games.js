(()=>{
  const PAIRS=[['R','B'],['R','C'],['R','L'],['B','C'],['B','L'],['C','L']];
  function normalizeGames(){
    if(!Array.isArray(window.games) && typeof games==='undefined') return;
    const current=(typeof games!=='undefined'&&Array.isArray(games))?games:(Array.isArray(window.games)?window.games:[]);
    const byId=new Map(current.map(g=>[Number(g.id),g]));
    const fixed=Array.from({length:18},(_,i)=>{
      const id=i+1,p=PAIRS[i%6],g=byId.get(id)||{};
      return {
        ...g,
        id,
        team_a:g.team_a??p[0],
        score_a:Number(g.score_a)||0,
        score_b:Number(g.score_b)||0,
        team_b:g.team_b??p[1],
        player_a:g.player_a||p[0],
        player_b:g.player_b||p[1]
      };
    });
    if(typeof games!=='undefined') games.splice(0,games.length,...fixed);
    window.games=fixed;
    if(typeof renderGames==='function') renderGames();
    if(window.renderStandings) window.renderStandings();
  }
  const run=()=>{normalizeGames();setTimeout(normalizeGames,300);setTimeout(normalizeGames,1200);setTimeout(normalizeGames,2500)};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  const oldFetch=window.fetch;
  window.fetch=async function(...args){
    const r=await oldFetch.apply(this,args);
    try{const u=String(args[0]||'');if(u.includes('/bomba_petch_partidas'))setTimeout(normalizeGames,50)}catch(e){}
    return r;
  };
})();
