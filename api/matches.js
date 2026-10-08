export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const API_KEY = process.env.RAPIDAPI_KEY;
  if(!API_KEY) return res.status(500).json({error:"No KEY"});

  // AUTOMATIC BERLIN TIME FUNCTION
  function getBerlinDate(offsetDays = 0){
    let d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
  }

  // Try today, yesterday, tomorrow, 2 days ago - to ALWAYS find games
  let offsets = [0, -1, -2, 1, -3];
  
  for(let off of offsets){
    let dateStr = getBerlinDate(off);
    try{
      let url = `https://soccer-highlightly-api.p.rapidapi.com/matches?date=${dateStr}`;
      let r = await fetch(url, {
        headers:{
          "X-RapidAPI-Key": API_KEY,
          "X-RapidAPI-Host": "soccer-highlightly-api.p.rapidapi.com"
        }
      });
      let j = await r.json();
      let list = Array.isArray(j) ? j : (j.data || j.matches || []);
      if(list && list.length > 0){
        return res.status(200).json({
          dateUsed: dateStr,
          timeZone: "Europe/Berlin",
          isAutomatic: true,
          count: list.length,
          data: list
        });
      }
    }catch(e){ continue; }
  }

  // Last fallback - today even if 0
  return res.status(200).json({
    dateUsed: getBerlinDate(0),
    timeZone: "Europe/Berlin",
    isAutomatic: true,
    count: 0,
    data: []
  });
}
