export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const ymd = date.replace(/-/g,'');
  try {
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${ymd}`);
    const json = await response.json();
    let games = [];
    (json.events||[]).forEach(ev=>{
      const c = ev.competitions?.[0];
      if(!c) return;
      const home = c.competitors?.find(x=>x.homeAway==='home');
      const away = c.competitors?.find(x=>x.homeAway==='away');
      const st = c.status?.type?.state;
      let league = ev.league?.name || c.league?.name || "Football";
      let country = "WORLD";
      const lower = league.toLowerCase();
      if(lower.includes('england')||lower.includes('premier')||lower.includes('championship')||lower.includes('fa cup')) country='ENGLAND';
      else if(lower.includes('spain')||lower.includes('la liga')||lower.includes('copa del rey')) country='SPAIN';
      else if(lower.includes('german')||lower.includes('bundesliga')) country='GERMANY';
      else if(lower.includes('italy')||lower.includes('serie')) country='ITALY';
      else if(lower.includes('france')||lower.includes('ligue')) country='FRANCE';
      else if(lower.includes('nether')||lower.includes('erediv')) country='NETHERLANDS';
      else if(lower.includes('portug')) country='PORTUGAL';
      else if(lower.includes('belgium')||lower.includes('jupiler')) country='BELGIUM';
      else if(lower.includes('albania')||lower.includes('abissnet')) country='ALBANIA';
      else if(lower.includes('andorra')) country='ANDORRA';
      else if(lower.includes('uefa')||lower.includes('champion')) country='EUROPE';
      else { country = league.split(':')[0] || 'WORLD'; }

      let minute = "";
      if(st==='in') minute = (c.status.displayClock||"Live") + "'";
      else if(st==='halftime') minute = "HT";
      else if(st==='post') minute = "FT";
      else minute = new Date(ev.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Africa/Lagos'});

      games.push({
        country: country.toUpperCase(),
        league: league,
        homeTeam: home?.team?.displayName||"Home",
        awayTeam: away?.team?.displayName||"Away",
        homeScore: parseInt(home?.score)||0,
        awayScore: parseInt(away?.score)||0,
        minute: minute.replace("''","'"),
        isLive: st==='in'||st==='halftime',
        isFinished: st==='post'
      });
    });
    games.sort((a,b)=>a.country.localeCompare(b.country));
    return res.status(200).json({data:games});
  } catch(err) {
    return res.status(200).json({data:[], error:err.message});
  }
}
