export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const ymd = date.replace(/-/g,'');
  let allGames = [];
  const KEY = process.env.HIGHLIGHTLY_API_KEY || process.env.HIGHLIGHTLY_KEY || "";

  try{
    if(KEY){
      const r = await fetch(`https://soccer.highlightly.net/matches?date=${date}`, {
        headers: { "x-rapidapi-key": KEY, "x-api-key": KEY, "x-rapidapi-host": "soccer.highlightly.net" }
      });
      const text = await r.text();
      try{
        const j = JSON.parse(text);
        const raw = j.data || j.matches || [];
        raw.forEach(item=>{
          const m=item.match||item;
          let hs=0,as=0; const sc=m.state?.score?.current||"";
          if(sc.includes("-")){ const p=sc.split("-"); hs=parseInt(p[0])||0; as=parseInt(p[1])||0; }
          let timeEU="00:00"; try{ if(m.date){ timeEU=new Date(m.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Europe/Madrid'}); }}catch{}
          const d=(m.state?.description||"").toLowerCase();
          allGames.push({
            country:(m.country?.name||"WORLD").toUpperCase(),
            league:(m.league?.name||"LEAGUE").toUpperCase(),
            leagueLogo:m.league?.logo||"",
            homeTeam:m.homeTeam?.name||"Home",
            awayTeam:m.awayTeam?.name||"Away",
            homeLogo:m.homeTeam?.logo||"",
            awayLogo:m.awayTeam?.logo||"",
            homeScore:hs, awayScore:as, timeEU,
            isLive:d.includes("live")||d.includes("half"),
            isFinished:d.includes("finish")
          });
        });
      }catch{}
    }
  }catch{}

  // Only use ESPN if Highlightly empty, and SINGLE CALL
  if(allGames.length===0){
    try{
      const er = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${ymd}`);
      if(er.ok){
        const ej = await er.json();
        (ej.events||[]).forEach(ev=>{
          const c=ev.competitions?.[0]; if(!c) return;
          const home=c.competitors?.find(x=>x.homeAway==='home');
          const away=c.competitors?.find(x=>x.homeAway==='away');
          let timeEU="00:00"; try{ if(ev.date){ timeEU=new Date(ev.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Europe/Madrid'}); }}catch{}
          allGames.push({
            country:"WORLD", league:(ev.league?.name||"LEAGUE").toUpperCase(), leagueLogo:"",
            homeTeam:home?.team?.displayName||"Home", awayTeam:away?.team?.displayName||"Away",
            homeLogo:home?.team?.logo||"", awayLogo:away?.team?.logo||"",
            homeScore:parseInt(home?.score)||0, awayScore:parseInt(away?.score)||0, timeEU,
            isLive:c.status?.type?.state==='in', isFinished:c.status?.type?.state==='post'
          });
        });
      }
    }catch{}
  }

  // ALWAYS return JSON, never crash
  return res.status(200).json({ data: allGames, count: allGames.length, date });
}
