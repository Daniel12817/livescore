export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const KEY = process.env.APISPORT_KEY || "";

  try {
    // 1. TRY APISPORT.ONLINE WITH x-api-key HEADER (your paid key)
    if (KEY) {
      const urls = [
        `https://api.apisport.online/v1/football/matches?date=${date}`,
        `https://api.apisport.online/api/football/matches?date=${date}`,
        `https://api.apisport.online/football/matches/live`,
        `https://api.apisport.online/v1/football/livescores?date=${date}`
      ];
      for (const url of urls) {
        try {
          const r = await fetch(url, { headers: { "x-api-key": KEY, "X-API-KEY": KEY } });
          const j = await r.json();
          const list = j.data || j.matches || j.response || [];
          if (list.length > 0) {
            const games = list.map(item => {
              const m = item.match || item.fixture || item;
              const home = m.homeTeam || item.teams?.home || {};
              const away = m.awayTeam || item.teams?.away || {};
              let minute = m.minute? m.minute+"'" : m.state?.minute? m.state.minute+"'" : "FT";
              if ((m.state?.description||"").toUpperCase().includes("HT")) minute="HT";
              let hs=0,as=0;
              if (m.state?.score?.current){ const p=m.state.score.current.split("-"); hs=parseInt(p[0])||0; as=parseInt(p[1])||0; }
              else { hs=parseInt(home.score||item.goals?.home)||0; as=parseInt(away.score||item.goals?.away)||0; }
              return {
                country:(m.country?.name||"WORLD").toUpperCase(),
                league:(m.league?.name||item.league?.name||"LEAGUE").toUpperCase(),
                homeTeam:home.name||"Home", awayTeam:away.name||"Away",
                homeScore:hs, awayScore:as,
                minute:minute.replace(/LIVE/gi,'').trim(), timeEU:minute.replace(/LIVE/gi,'').trim(),
                isLive:(m.state?.status==='inplay'), isFinished:(m.state?.status==='finished')
              };
            });
            if (games.length>0) return res.status(200).json({ data: games, source:"apisport" });
          }
        } catch {}
      }
    }

    // 2. FALLBACK ESPN - always works with minute like 47' 26'
    const ymd = date.replace(/-/g,'');
    const er = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${ymd}`);
    const ej = await er.json();
    let games=[];
    (ej.events||[]).forEach(ev=>{
      const c=ev.competitions?.[0]; if(!c) return;
      const home=c.competitors?.find(x=>x.homeAway==='home');
      const away=c.competitors?.find(x=>x.homeAway==='away');
      const st=c.status?.type?.state;
      let minute = st==='in'? (c.status.displayClock||"")+"'" : st==='halftime'? "HT" : st==='post'? "FT" : new Date(ev.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Africa/Lagos'});
      minute=minute.replace("''","'").replace("LIVE",'').trim();
      if(!minute.includes("'")&&!minute.includes(":")&&minute!=="HT"&&minute!=="FT") minute+="''";
      games.push({
        country:"WORLD", league:(ev.league?.name||"ALL").toUpperCase(),
        homeTeam:home?.team?.displayName||"Home", awayTeam:away?.team?.displayName||"Away",
        homeScore:parseInt(home?.score)||0, awayScore:parseInt(away?.score)||0,
        minute, timeEU:minute, isLive:st==='in'||st==='halftime', isFinished:st==='post'
      });
    });
    games.sort((a,b)=>a.isLive&&!b.isLive?-1:!a.isLive&&b.isLive?1:0);
    return res.status(200).json({ data: games, source:"espn" });
  } catch(e){
    return res.status(200).json({ data: [], error:e.message });
  }
}
