export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const ymd = date.replace(/-/g,'');
  try{
    const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${ymd}`);
    const j = await r.json();
    const games = (j.events||[]).map(ev=>{
      const c = ev.competitions?.[0];
      const h = c?.competitors?.find(x=>x.homeAway==='home');
      const a = c?.competitors?.find(x=>x.homeAway==='away');
      const st = c?.status?.type?.state;
      let rawLeague = ev.league?.name || c?.notes?.[0] || "Football";
      rawLeague = rawLeague.replace(' - Qualification','').trim();

      let country = 'WORLD';
      let league = rawLeague;

      // REAL COUNTRY + LEAGUE SEPARATION
      const l = rawLeague.toLowerCase();
      if(l.includes('english premier')){country='ENGLAND'; league='Premier League';}
      else if(l.includes('english champ')){country='ENGLAND'; league='Championship';}
      else if(l.includes('fa cup')){country='ENGLAND'; league='FA Cup';}
      else if(l.includes('la liga')||l.includes('spanish')){country='SPAIN'; league='LaLiga';}
      else if(l.includes('bundesliga')){country='GERMANY'; league='Bundesliga';}
      else if(l.includes('serie a')){country='ITALY'; league='Serie A';}
      else if(l.includes('ligue 1')){country='FRANCE'; league='Ligue 1';}
      else if(l.includes('eredivisie')){country='NETHERLANDS'; league='Eredivisie';}
      else if(l.includes('primeira')||l.includes('portuguese')){country='PORTUGAL'; league='Liga Portugal';}
      else if(l.includes('saudi pro')){country='SAUDI ARABIA'; league='Pro League';}
      else if(l.includes('mls')||l.includes('major league')){country='USA'; league='MLS';}
      else if(l.includes('uefa champions')){country='EUROPE'; league='Champions League';}
      else if(l.includes('europa')){country='EUROPE'; league='Europa League';}
      else { // Fallback: first word as country
        const parts = rawLeague.split(' ');
        if(parts.length>1){country=parts[0].toUpperCase(); league=parts.slice(1).join(' ');}
      }

      return{
        country, league,
        homeTeam: h?.team?.displayName||'Home',
        awayTeam: a?.team?.displayName||'Away',
        homeScore: parseInt(h?.score)||0,
        awayScore: parseInt(a?.score)||0,
        minute: st==='in'?'LIVE' : st==='halftime'?'HT' : st==='post'?'FT' : new Date(ev.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),
        isLive: st==='in'||st==='halftime',
        isFinished: st==='post'
      }
    });
    return res.status(200).json({data:games});
  }catch(e){return res.status(200).json({data:[]})}
}
