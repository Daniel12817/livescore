export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  const KEY = process.env.API_FOOTBALL_KEY;
  if(!KEY) return res.json({error:"Add API_FOOTBALL_KEY in Vercel settings!"});

  try{
    const today = new Date().toISOString().split('T')[0]; // 2026-10-08 etc
    const r = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}&timezone=Africa/Lagos`, {
      headers: {"x-apisports-key": KEY}
    });
    const j = await r.json();

    const data = (j.response || []).map(f=>({
      league: f.league.name,
      homeTeam: f.teams.home.name,
      awayTeam: f.teams.away.name,
      homeScore: f.goals.home?? 0,
      awayScore: f.goals.away?? 0,
      status: f.fixture.status.short,
      isLive: ["1H","2H","LIVE"].includes(f.fixture.status.short)
    }));

    return res.json({count:data.length, data, date:today});
  }catch(e){
    return res.json({error:e.message});
  }
}
