export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const ymd = date.replace(/-/g,'');
  try{
    const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${ymd}`);
    const j=await r.json();
    const games=[];
    (j.events||[]).forEach(ev=>{
      const c=ev.competitions?.[0]; if(!c) return;
      const home=c.competitors?.find(x=>x.homeAway==='home');
      const away=c.competitors?.find(x=>x.homeAway==='away');
      const st=c.status?.type?.state;
      // Flashscore grouping fix
      let leagueName = c.league?.name || ev.league?.name || "ALL";
      let country = "WORLD";
      // Try to get country from league slug
      const slug = (c.league?.slug||"").toLowerCase();
      if(slug.includes('eng')) country='ENGLAND';
      else if(slug.includes('esp')||slug.includes('spa')) country='SPAIN';
      else if(slug.includes('ger')) country='GERMANY';
      else if(slug.includes('ita')) country='ITALY';
      else if(slug.includes('fra')) country='FRANCE';
      else if(slug.includes('ned')) country='NETHERLANDS';
      else if(slug.includes('por')) country='PORTUGAL';
      else if(slug.includes('alb')) country='ALBANIA';
      else if(slug.includes('and')) country='ANDORRA';
      else country=(leagueName.split(' ')[0]||'WORLD').toUpperCase();

      let minute=st==='in'?(c.status.displayClock||"")+"'" : st==='halftime'?"HT" : st==='post'?"FT" : new Date(ev.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});
      minute=minute.replace("''","'").trim();
      games.push({
        country, league:leagueName,
        homeTeam:home?.team?.displayName||"Home",
        awayTeam:away?.team?.displayName||"Away",
        homeScore:parseInt(home?.score)||0,
        awayScore:parseInt(away?.score)||0,
        minute, isLive:st==='in'||st==='halftime', isFinished:st==='post'
      });
    });
    // Sort by country like Flashscore
    games.sort((a,b)=>a.country.localeCompare(b.country));
    return res.status(200).json({data:games});
  }catch(e){return res.status(200).json({data:[],error:e.message});}
}
