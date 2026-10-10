export default async function handler(req,res){
 res.setHeader('Access-Control-Allow-Origin','*');
 res.setHeader('Cache-Control','s-maxage=30, stale-while-revalidate');
 const KEY = process.env.APISPORT_KEY;
 if(!KEY) return res.status(200).json({data:[], error:"Missing APISPORT_KEY"});
 try{
   const url = `https://api.apisport.online/sport/football/fixtures/live`;
   const r = await fetch(url,{ headers:{ 'x-api-key': KEY }});
   const j = await r.json();
   let list = j.data || j.d || j.result || [];
   if(!Array.isArray(list) || list.length===0){
     return res.status(200).json({data:[], raw:j, count:0, note:"No live now - raw: "+JSON.stringify(j).slice(0,200)});
   }
   const games = list.map(m=>({
     id:m.id,
     status:m.status || "LIVE",
     league:m.league?.name || "Live Match",
     homeTeam:m.homeTeam?.name || m.home?.name || "Home",
     awayTeam:m.awayTeam?.name || m.away?.name || "Away",
     homeScore:m.homeTeam?.score ?? m.home?.score ?? 0,
     awayScore:m.awayTeam?.score ?? m.away?.score ?? 0,
     minute:m.minute || m.time || 0,
     isLive:true
   }));
   return res.status(200).json({data:games, count:games.length, source:"apisport.online - LIVE"});
 }catch(e){
   return res.status(200).json({data:[], error:e.message});
 }
}
