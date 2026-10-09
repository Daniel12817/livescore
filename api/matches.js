export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const KEY = process.env.APISPORT_KEY || "";

  // Helper to get country from league name for ESPN
  function getCountry(name){
    const n=(name||"").toLowerCase();
    if(n.includes('england')||n.includes('premier')||n.includes('championship')||n.includes('fa cup')||n.includes('efl')) return 'ENGLAND';
    if(n.includes('spain')||n.includes('la liga')||n.includes('copa del rey')||n.includes('segunda')) return 'SPAIN';
    if(n.includes('german')||n.includes('bundesliga')) return 'GERMANY';
    if(n.includes('italy')||n.includes('serie')) return 'ITALY';
    if(n.includes('france')||n.includes('ligue 1')||n.includes('ligue 2')) return 'FRANCE';
    if(n.includes('portugal')) return 'PORTUGAL';
    if(n.includes('netherlands')||n.includes('eredivisie')) return 'NETHERLANDS';
    if(n.includes('belgium')||n.includes('jupiler')) return 'BELGIUM';
    if(n.includes('scotland')) return 'SCOTLAND';
    if(n.includes('uefa')||n.includes('champions league')||n.includes('europa')) return 'EUROPE';
    return 'WORLD';
  }

  try {
    // 1. TRY YOUR PAID apisport.online - this gives real country/league
    if(KEY){
      const endpoints = [
        `https://api.apisport.online/v1/football/matches?date=${date}`,
        `https://api.apisport.online/api/football/matches?date=${date}`,
        `https://api.apisport.online/football/matches?date=${date}`,
        `https://api.apisport.online/v1/matches?date=${date}`,
        `https://api.apisport.online/matches?date=${date}`
      ];
      for(const url of endpoints){
        try{
          const r=await fetch(url,{headers:{"x-api-key":KEY,"X-API-KEY":KEY}});
          const j=await r.json();
          const list=j.data||j.matches||j.response||j.result||[];
          if(Array.isArray(list)&&list.length>0){
            const games=list.map(item=>{
              const m=item.match||item.fixture||item;
              const home=m.homeTeam||item.homeTeam||item.teams?.home||{};
              const away=m.awayTeam||item.awayTeam||item.teams?.away||{};
              let minute="";
              if(m.minute) minute=m.minute+"'";
              else if(m.state?.minute) minute=m.state.minute+"'";
              else if(m.status?.elapsed) minute=m.status.elapsed+"'";
              else minute=m.state?.description||"FT";
              if(minute.toUpperCase().includes('HT')) minute='HT';
              if(minute.toUpperCase().includes('FT')) minute='FT';
              minute=minute.replace(/LIVE/gi,'').trim();
              let hs=0,as=0;
              if(m.state?.score?.current){const p=m.state.score.current.split("-");hs=parseInt(p[0])||0;as=parseInt(p[1])||0;}
              else {hs=parseInt(home.score||item.goals?.home||0)||0;as=parseInt(away.score||item.goals?.away||0)||0;}
              return{
                country:(m.country?.name||m.league?.country||item.league?.country||getCountry(m.league?.name||"")).toUpperCase(),
                league:(m.league?.name||item.league?.name||"LEAGUE").toUpperCase(),
                homeTeam:home.name||"Home", awayTeam:away.name||"Away",
                homeScore:hs, awayScore:as,
                minute, timeEU:minute,
                isLive:(m.state?.status==='inplay'||String(minute).includes("'")),
                isFinished:(m.state?.status==='finished'||minute==='FT')
              };
            });
            if(games.length>0) return res.status(200).json({data:games, source:"apisport"});
          }
        }catch{}
      }
    }

    // 2. FALLBACK ESPN - now with correct country/league parsing
    const ymd=date.replace(/-/g,'');
    const er=await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${ymd}`);
    const ej=await er.json();
    let games=[];
    (ej.events||[]).forEach(ev=>{
      const c=ev.competitions?.[0]; if(!c) return;
      const home=c.competitors?.find(x=>x.homeAway==='home');
      const away=c.competitors?.find(x=>x.homeAway==='away');
      const st=c.status?.type?.state;
      const leagueName=ev.league?.name||"ALL";
      let minute=st==='in'?(c.status.displayClock||"")+"'" : st==='halftime'?"HT" : st==='post'?"FT" : new Date(ev.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Africa/Lagos'});
      minute=minute.replace("''","'").replace(/LIVE/gi,'').trim();
      games.push({
        country:getCountry(leagueName),
        league:leagueName.toUpperCase(),
        homeTeam:home?.team?.displayName||"Home",
        awayTeam:away?.team?.displayName||"Away",
        homeScore:parseInt(home?.score)||0,
        awayScore:parseInt(away?.score)||0,
        minute, timeEU:minute,
        isLive:st==='in'||st==='halftime',
        isFinished:st==='post'
      });
    });
    games.sort((a,b)=>a.isLive&&!b.isLive?-1:!a.isLive&&b.isLive?1:0);
    return res.status(200).json({data:games, source:"espn"});
  } catch(e){
    return res.status(200).json({data:[], error:e.message});
  }
}
