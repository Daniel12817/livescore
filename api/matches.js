export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const API_KEY = process.env.RAPIDAPI_KEY;

  // AUTOMATIC EUROPE/BERLIN TIME - FOREVER
  const berlinToday = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });

  // 1. TRY YOUR API FIRST (5 dates: today, yesterday, etc)
  if(API_KEY){
    let dates = [0,-1,-2,1,-3].map(o=>{
      let d=new Date(); d.setDate(d.getDate()+o);
      return d.toLocaleDateString('en-CA',{timeZone:'Europe/Berlin'});
    });
    for(let dateStr of dates){
      try{
        let r = await fetch(`https://soccer-highlightly-api.p.rapidapi.com/matches?date=${dateStr}`,{
          headers:{"X-RapidAPI-Key":API_KEY,"X-RapidAPI-Host":"soccer-highlightly-api.p.rapidapi.com"}
        });
        let j = await r.json();
        let list = Array.isArray(j)? j : (j.data || j.matches || []);
        if(list.length > 0){
          return res.json({dateUsed:dateStr,timeZone:"Europe/Berlin",count:list.length,data:list,src:"your-api"});
        }
      }catch(e){}
    }
  }

  // 2. BACKUP - FREE ESPN - ALWAYS HAS TODAY MATCHES
  try{
    let espnDate = berlinToday.replace(/-/g,'');
    let r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates=${espnDate}`);
    let j = await r.json();
    let events = j.events || [];
    let list = events.map(ev=>{
      let comp = ev.competitions[0];
      return {
        league:{name:ev.leagues?.[0]?.name || "Premier League"},
        homeTeam:{name:comp.competitors[0].team.displayName},
        awayTeam:{name:comp.competitors[1].team.displayName},
        homeScore:comp.competitors[0].score,
        awayScore:comp.competitors[1].score,
        status:comp.status.type.description,
        minute:comp.status.displayClock,
        date:ev.date
      };
    });
    if(list.length>0){
      return res.json({dateUsed:berlinToday,timeZone:"Europe/Berlin",count:list.length,data:list,src:"espn-backup"});
    }
  }catch(e){}

  return res.json({dateUsed:berlinToday,timeZone:"Europe/Berlin",count:0,data:[]});
}
