export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const ymd = date.replace(/-/g,'');
  const KEY = process.env.APISPORT_KEY || "";

  // 1. TRY APISPORT FIRST (if your PRO key dey for Vercel)
  if(KEY){
    try{
      const urls=[
        `https://api.apisport.online/v1/football/matches?date=${date}`,
        `https://api.apisport.online/football/matches?date=${date}`
      ];
      for(const url of urls){
        const r=await fetch(url,{headers:{"x-api-key":KEY,"X-API-KEY":KEY,"x-apisports-key":KEY}});
        const j=await r.json();
        const list=j.data||j.matches||j.response||[];
        if(list.length>0){
          const games=list.map(it=>{
            const m=it.match||it;
            let minute=m.minute?m.minute+"'":(m.status?.elapsed?m.status.elapsed+"'":"FT");
            if(String(minute).includes("HT")) minute="HT";
            return{
              country:(m.country?.name||m.league?.country||"WORLD").toUpperCase(),
              league:(m.league?.name||"LEAGUE").toUpperCase(),
              homeTeam:m.homeTeam?.name||it.homeTeam||"Home",
              awayTeam:m.awayTeam?.name||it.awayTeam||"Away",
              homeScore:parseInt(m.homeScore||0), awayScore:parseInt(m.awayScore||0),
              minute, isLive:String(minute).includes("'"), isFinished:minute==="FT"
            }
          });
          if(games.length) return res.status(200).json({data:games});
        }
      }
    }catch{}
  }

  // 2. FLASHSCORE STYLE - LOAD EACH LEAGUE SEPARATELY (this fixes WORLD-ALL)
  const LEAGUES = [
    {id:'eng.1', country:'ENGLAND', name:'Premier League'},
    {id:'eng.2', country:'ENGLAND', name:'Championship'},
    {id:'eng.fa', country:'ENGLAND', name:'FA Cup'},
    {id:'esp.1', country:'SPAIN', name:'LaLiga'},
    {id:'esp.copa_del_rey', country:'SPAIN', name:'Copa del Rey'},
    {id:'ger.1', country:'GERMANY', name:'Bundesliga'},
    {id:'ita.1', country:'ITALY', name:'Serie A'},
    {id:'fra.1', country:'FRANCE', name:'Ligue 1'},
    {id:'ned.1', country:'NETHERLANDS', name:'Eredivisie'},
    {id:'por.1', country:'PORTUGAL', name:'Liga Portugal'},
    {id:'bel.1', country:'BELGIUM', name:'Jupiler League'},
    {id:'uefa.champions', country:'EUROPE', name:'Champions League'},
    {id:'usa.1', country:'USA', name:'MLS'},
  ];

  let allGames=[];
  try{
    const promises = LEAGUES.map(async L=>{
      try{
        const er=await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${L.id}/scoreboard?dates=${ymd}`);
        const ej=await er.json();
        (ej.events||[]).forEach(ev=>{
          const c=ev.competitions?.[0]; if(!c) return;
          const home=c.competitors?.find(x=>x.homeAway==='home');
          const away=c.competitors?.find(x=>x.homeAway==='away');
          const st=c.status?.type?.state;
          let minute=st==='in'?(c.status.displayClock||"")+"'" : st==='halftime'?"HT" : st==='post'?"FT" : new Date(ev.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Africa/Lagos'});
          minute=minute.replace("''","'").replace(/LIVE/gi,'').trim();
          allGames.push({
            country:L.country,
            league:L.name.toUpperCase(),
            homeTeam:home?.team?.displayName||"Home",
            awayTeam:away?.team?.displayName||"Away",
            homeScore:parseInt(home?.score)||0,
            awayScore:parseInt(away?.score)||0,
            minute,
            isLive:st==='in'||st==='halftime',
            isFinished:st==='post'
          });
        });
      }catch{}
    });
    await Promise.all(promises);
  }catch{}

  // If still empty, fallback to /all/ but group by league name
  if(allGames.length===0){
    try{
      const er=await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${ymd}`);
      const ej=await er.json();
      (ej.events||[]).forEach(ev=>{
        const c=ev.competitions?.[0]; if(!c) return;
        const home=c.competitors?.find(x=>x.homeAway==='home');
        const away=c.competitors?.find(x=>x.homeAway==='away');
        const st=c.status?.type?.state;
        let minute=st==='in'?(c.status.displayClock||"")+"'" : st==='halftime'?"HT" : st==='post'?"FT" : "12:00";
        allGames.push({
          country:'WORLD', league:(ev.league?.name||'ALL').toUpperCase(),
          homeTeam:home?.team?.displayName||"Home", awayTeam:away?.team?.displayName||"Away",
          homeScore:parseInt(home?.score)||0, awayScore:parseInt(away?.score)||0,
          minute, isLive:st==='in', isFinished:st==='post'
        });
      });
    }catch{}
  }

  allGames.sort((a,b)=>a.country.localeCompare(b.country));
  return res.status(200).json({data:allGames});
}
