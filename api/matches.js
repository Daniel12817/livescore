export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const ymd = date.replace(/-/g,'');
  try {
    const r = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates='+ymd);
    const j = await r.json();
    const games = (j.events||[]).map(ev=>{
      const c=ev.competitions?.[0];
      const home=c?.competitors?.find(x=>x.homeAway==='home');
      const away=c?.competitors?.find(x=>x.homeAway==='away');
      const st=c?.status?.type?.state;
      return {
        country: 'WORLD', league: ev.league?.name||'Football',
        homeTeam: home?.team?.displayName||'Home',
        awayTeam: away?.team?.displayName||'Away',
        homeScore: home?.score||0, awayScore: away?.score||0,
        minute: st==='in'?'LIVE' : st==='post'?'FT' : new Date(ev.date).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
        isLive: st==='in', isFinished: st==='post'
      }
    });
    res.status(200).json({data:games});
  } catch(e){ res.status(200).json({data:[]}) }
}
