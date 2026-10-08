export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET");
  
  const API_KEY = process.env.API_FOOTBALL_KEY;
  
  if(!API_KEY){
    return res.status(500).json({error:"API_FOOTBALL_KEY not set in Vercel"});
  }

  try{
    // Use Africa/Lagos date so Nigeria matches show correctly
    const today = new Date().toLocaleDateString('en-CA', {timeZone:'Africa/Lagos'});
    
    const response = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
      headers: {
        "x-apisports-key": API_KEY
      }
    });
    
    const json = await response.json();
    
    if(!json.response || json.response.length === 0){
      return res.json({count:0, data:[], message:`No matches on ${today}`});
    }

    const data = json.response.map(f=>({
      league: `${f.league.name} - ${f.league.country}`,
      homeTeam: f.teams.home.name,
      awayTeam: f.teams.away.name,
      homeScore: f.goals.home ?? 0,
      awayScore: f.goals.away ?? 0,
      status: f.fixture.status.long === "Match Finished" ? "FT" : f.fixture.status.short + (f.fixture.status.elapsed ? ` ${f.fixture.status.elapsed}'` : ""),
      isLive: ["1H","2H","HT","ET","P","LIVE"].includes(f.fixture.status.short),
      time: new Date(f.fixture.date).toLocaleTimeString('en-NG', {hour:'2-digit', minute:'2-digit', timeZone:'Africa/Lagos'})
    }));

    return res.json({count:data.length, data});
    
  }catch(e){
    return res.status(500).json({error:e.message});
  }
}
