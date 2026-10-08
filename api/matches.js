export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  const KEY = process.env.API_FOOTBALL_KEY;
  if(!KEY) return res.json({error:"Add API_FOOTBALL_KEY!"});
  try{
    const today = new Date().toISOString().split('T')[0];
    const r = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}&timezone=Europe/London`,{
      headers:{"x-apisports-key":KEY}
    });
    const j = await r.json();
    const data = (j.response||[]).map(f=>{
      const dateObj = new Date(f.fixture.date);
      const europeTime = dateObj.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'});
      return {
        country: f.league.country,
        league: f.league.name,
        homeTeam: f.teams.home.name,
        awayTeam: f.teams.away.name,
        homeScore: f.goals.home?? 0,
        awayScore: f.goals.away?? 0,
        status: f.fixture.status.short + (f.fixture.status.elapsed? " "+f.fixture.status.elapsed+"'" : ""),
        timeEU: europeTime,
        kickoff: f.fixture.date,
        isLive: ["1H","2H","HT","ET","LIVE"].includes(f.fixture.status.short)
      }
    });
    return res.json({count:data.length, data, date:today, timezone:"Europe/Berlin"});
  }catch(e){
    return res.json({error:e.message});
  }
}
