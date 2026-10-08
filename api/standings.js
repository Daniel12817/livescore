export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  const KEY = process.env.API_FOOTBALL_KEY;
  const {league, season} = req.query;
  try{
    const r = await fetch(`https://v3.football.api-sports.io/standings?league=${league}&season=${season}`,{headers:{"x-apisports-key":KEY}});
    const j = await r.json();
    res.json(j);
  }catch(e){ res.json({error:"Failed"})}
}
