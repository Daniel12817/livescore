export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET");

  try{
    // This one always has games, no API key needed
    const r = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard");
    const j = await r.json();

    const matches = (j.events || []).map(ev => {
      const comp = ev.competitions[0];
      const home = comp.competitors.find(t=>t.home);
      const away = comp.competitors.find(t=>!t.home);
      return {
        league: "Premier League",
        homeTeam: home.team.displayName,
        awayTeam: away.team.displayName,
        homeScore: home.score || "0",
        awayScore: away.score || "0",
        status: comp.status.type.shortDetail || comp.status.type.description,
        isLive: comp.status.type.state === "in"
      };
    });

    return res.status(200).json({ count: matches.length, data: matches });
  }catch(e){
    return res.status(200).json({ count: 0, data: [], error: e.message });
  }
}
