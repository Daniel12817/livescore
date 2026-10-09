// FINAL FORCE 21:00 - MATCH FLASHSCORE.MOBI
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const API_KEY = process.env.HIGHLIGHTLY_API_KEY || process.env.HIGHLIGHTLY_KEY;
  if (!API_KEY) return res.status(200).json({ data: [] });
  try {
    const r = await fetch(`https://soccer.highlightly.net/matches?date=${date}`, {
      headers: { "x-rapidapi-key": API_KEY, "x-api-key": API_KEY, "x-rapidapi-host": "soccer.highlightly.net" }
    });
    const json = await r.json();
    const raw = json.data || json.matches || [];
    const data = raw.map(item => {
      const m = item.match || item;
      let hs=0,as=0; const sc=m.state?.score?.current||""; if(sc.includes("-")){const p=sc.split("-"); hs=parseInt(p[0])||0; as=parseInt(p[1])||0;}

      let timeEU="00:00";
      if(m.date){
        // FORCE +1 HOUR to make 20:00 become 21:00 like Flashscore.mobi
        let d = new Date(m.date);
        d = new Date(d.getTime() + 1*60*60*1000); // <-- ADD 1 HOUR
        timeEU = d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Europe/Madrid'});
      }

      const desc=(m.state?.description||"").toLowerCase();
      const hName = m.homeTeam?.longName || m.homeTeam?.fullName || m.homeTeam?.name || "Home";
      const aName = m.awayTeam?.longName || m.awayTeam?.fullName || m.awayTeam?.name || "Away";
      return {
        country: (m.country?.name||"WORLD").toUpperCase(),
        league: (m.league?.name||"LEAGUE").toUpperCase(),
        homeTeam: hName, awayTeam: aName,
        homeScore: hs, awayScore: as, timeEU,
        isLive: desc.includes("live"), isFinished: desc.includes("finish"), isHT: desc.includes("half"),
        status: desc.includes("live")?"LIVE":desc.includes("finish")?"FT":"NS"
      };
    });
    res.status(200).json({ data });
  } catch(e){ res.status(200).json({ data: [] }); }
}
