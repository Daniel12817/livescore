export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  const KEY = process.env.API_FOOTBALL_KEY;
  const today = new Date().toISOString().split('T')[0];
  try{
    const r = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`,{
      headers:{"x-apisports-key":KEY}
    });
    const j = await r.json();
    const data = j.response.map(f=>{
      const dt = new Date(f.fixture.date);
      const timeEU = dt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'});
      return{
        country: f.league.country,
        league: f.league.name,
        homeTeam: f.teams.home.name,
        awayTeam: f.teams.away.name,
        homeScore: f.goals.home?? 0,
        awayScore: f.goals.away?? 0,
        status: f.fixture.status.short,
        elapsed: f.fixture.status.elapsed,
        timeEU: timeEU,
        isLive: ["1H","2H","LIVE"].includes(f.fixture.status.short),
        isHT: f.fixture.status.short==="HT"
      }
    });
    res.json({count:data.length,data});
  }catch(e){ res.json({count:0,data:[],error:e.message})}
}
