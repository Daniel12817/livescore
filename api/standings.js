export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  const KEY = process.env.APISPORT_KEY;
  const {league} = req.query;
  try{
    const r = await fetch(`https://api.isportsapi.com/sport/football/standing?api_key=${KEY}&leagueId=${league||42}`);
    const j = await r.json();
    res.json(j);
  }catch(e){res.json({error:"Failed", details:e.message})}
}
