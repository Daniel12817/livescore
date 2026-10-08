export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,OPTIONS");
  if(req.method==="OPTIONS") return res.status(200).end();

  const KEY = process.env.API_FOOTBALL_KEY;
  if(!KEY) return res.status(200).json({count:0,data:[],error:"No key"});

  try{
    const today = new Date().toISOString().split('T')[0];
    const apiRes = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`,{
      headers:{"x-apisports-key":KEY,"x-apisports-host":"v3.football.api-sports.io"}
    });
    const json = await apiRes.json();

    if(!json.response){
      return res.status(200).json({count:0,data:[],raw:json});
    }

    const data = json.response.map(f=>{
      const d = new Date(f.fixture.date);
      const timeEU = d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'});
      return{
        country: f.league.country || 'World',
        league: f.league.name,
        homeTeam: f.teams.home.name,
        awayTeam: f.teams.away.name,
        homeScore: f.goals.home?? 0,
        awayScore: f.goals.away?? 0,
        status: f.fixture.status.short,
        elapsed: f.fixture.status.elapsed || 0,
        timeEU: timeEU,
        isLive: ['1H','2H','HT','LIVE','ET','P'].includes(f.fixture.status.short)
      }
    });
    return res.status(200).json({count:data.length,data});
  }catch(e){
    return res.status(200).json({count:0,data:[],error:e.message});
  }
}
