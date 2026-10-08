export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  const KEY = process.env.API_FOOTBALL_KEY;
  if(!KEY) return res.json({error:"Add API_FOOTBALL_KEY in Vercel Settings!"});
  try{
    const today = new Date().toISOString().split('T')[0];
    const r = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}&timezone=Africa/Lagos`,{
      headers:{"x-apisports-key":KEY}
    });
    const j = await r.json();
    const data = (j.response||[]).map(f=>({
      league: f.league.name,
      homeTeam: f.teams.home.name,
      awayTeam: f.teams.away.name,
      homeScore: f.goals.home?? 0,
      awayScore: f.goals.away?? 0,
      status: f.fixture.status.short + (f.fixture.status.elapsed? " "+f.fixture.status.elapsed+"'" : ""),
      isLive: ["1H","2H","HT","ET","LIVE"].includes(f.fixture.status.short)
    }));
    return res.json({count:data.length, data, date:today});
  }catch(e){
    return res.json({error:e.message});
  }
}
