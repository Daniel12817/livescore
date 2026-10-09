export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  const date=req.query.date||new Date().toISOString().split('T')[0];
  const ymd=date.replace(/-/g,'');
  try{
    const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${ymd}`);
    const j=await r.json();
    const games=(j.events||[]).map(ev=>{
      const c=ev.competitions?.[0];
      const h=c?.competitors?.find(x=>x.homeAway==='home');
      const a=c?.competitors?.find(x=>x.homeAway==='away');
      const st=c?.status?.type?.state;
      let league=ev.league?.name||'LEAGUE';
      // Try to get country from league
      let country='WORLD';
      const l=league.toLowerCase();
      if(l.includes('england')||l.includes('premier')||l.includes('championship')||l.includes('fa cup')) country='ENGLAND';
      else if(l.includes('spain')||l.includes('la liga')) country='SPAIN';
      else if(l.includes('germany')||l.includes('bundesliga')) country='GERMANY';
      else if(l.includes('italy')||l.includes('serie')) country='ITALY';
      else if(l.includes('france')||l.includes('ligue')) country='FRANCE';
      else if(l.includes('saudi')||l.includes('pro league')) country='SAUDI ARABIA';
      else if(l.includes('uefa')||l.includes('champions')||l.includes('europa')) country='EUROPE';
      else country=league.split(' ')[0]||'WORLD';
      return{
        country:country,
        league:league,
        homeTeam:h?.team?.displayName||'Home',
        awayTeam:a?.team?.displayName||'Away',
        homeScore:parseInt(h?.score)||0,
        awayScore:parseInt(a?.score)||0,
        minute:st==='in'?'LIVE' : st==='halftime'?'HT' : st==='post'?'FT' : new Date(ev.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),
        isLive:st==='in'||st==='halftime',
        isFinished:st==='post'
      }
    });
    return res.status(200).json({data:games});
  }catch(e){return res.status(200).json({data:[]})}
}
