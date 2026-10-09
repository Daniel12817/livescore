export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const ymd = date.replace(/-/g,'');

  // 1. Try Highlightly BASIC $0
  try {
    const KEY = process.env.HIGHLIGHTLY_API_KEY || process.env.HIGHLIGHTLY_KEY;
    if(KEY){
      const r = await fetch(`https://soccer.highlightly.net/matches?date=${date}`,{
        headers:{"x-rapidapi-key":KEY,"x-api-key":KEY,"x-rapidapi-host":"soccer.highlightly.net"}
      });
      if(r.ok){
        const j = await r.json();
        const raw = j.data || j.matches || [];
        if(raw.length>0){
          const data = raw.map(i=>{
            const m=i.match||i;
            let hs=0,as=0; const sc=m.state?.score?.current||""; if(sc.includes("-")){const p=sc.split("-"); hs=parseInt(p[0])||0; as=parseInt(p[1])||0;}
            let timeEU="00:00"; if(m.date){timeEU=new Date(m.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Europe/Madrid'});}
            const d=(m.state?.description||"").toLowerCase();
            return{
              country:(m.country?.name||"WORLD").toUpperCase(),
              league:(m.league?.name||"LEAGUE").toUpperCase(),
              leagueLogo:m.league?.logo||"",
              homeTeam:m.homeTeam?.name||"Home",
              awayTeam:m.awayTeam?.name||"Away",
              homeLogo:m.homeTeam?.logo||"",
              awayLogo:m.awayTeam?.logo||"",
              homeScore:hs,awayScore:as,timeEU,
              isLive:d.includes("live"),isFinished:d.includes("finish")
            };
          });
          return res.status(200).json({data});
        }
      }
    }
  }catch(e){}

  // 2. FALLBACK ESPN - FREE ALWAYS SHOWS ALL LEAGUES
  try{
    const er = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/misc/dates/${ymd}/scoreboard`);
    const ej = await er.json();
    let data=[];
    for(const lg of (ej.leagues||[])){
      for(const ev of (lg.events||[])){
        const c=ev.competitions?.[0]; if(!c)continue;
        const home=c.competitors?.find(x=>x.homeAway==='home');
        const away=c.competitors?.find(x=>x.homeAway==='away');
        let timeEU="00:00"; if(ev.date){timeEU=new Date(ev.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Europe/Madrid'});}
        data.push({
          country:(lg.abbreviation||"WORLD").toUpperCase(),
          league:(lg.name||"LEAGUE").toUpperCase(),
          leagueLogo:lg.logos?.[0]?.href||"",
          homeTeam:home?.team?.displayName||"Home",
          awayTeam:away?.team?.displayName||"Away",
          homeLogo:home?.team?.logo||"",
          awayLogo:away?.team?.logo||"",
          homeScore:parseInt(home?.score)||0,
          awayScore:parseInt(away?.score)||0,
          timeEU,
          isLive:c.status?.type?.state==='in',
          isFinished:c.status?.type?.state==='post'
        });
      }
    }
    return res.status(200).json({data});
  }catch(e){
    return res.status(200).json({data:[],error:e.message});
  }
}
