(()=>{
  const TOTAL_GAMES=18;

  function defaultGame(i){
    const p=pairs[i%pairs.length];
    return {id:i+1,team_a:p[0],score_a:0,score_b:0,team_b:p[1],player_a:p[0],player_b:p[1]};
  }

  async function force18Games(){
    try{
      const r=await fetch(GAMES+'?select=*&order=id.asc',{headers:H,cache:'no-store'});
      const rows=r.ok?await r.json():[];
      const byId=new Map(rows.map(x=>[Number(x.id),x]));
      games=Array.from({length:TOTAL_GAMES},(_,i)=>{
        const base=defaultGame(i);
        const x=byId.get(i+1);
        if(!x)return base;
        return {
          ...base,
          ...x,
          id:i+1,
          player_a:x.player_a||base.player_a,
          player_b:x.player_b||base.player_b,
          score_a:+x.score_a||0,
          score_b:+x.score_b||0
        };
      });
      renderGames();
      if(window.renderStandings)window.renderStandings();
    }catch(e){
      console.error('Erro ao garantir 18 partidas:',e);
      if(Array.isArray(games)&&games.length<18){
        for(let i=games.length;i<TOTAL_GAMES;i++)games.push(defaultGame(i));
        renderGames();
        if(window.renderStandings)window.renderStandings();
      }
    }
  }

  setTimeout(force18Games,700);
  setTimeout(force18Games,1800);
})();
