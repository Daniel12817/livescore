export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const ymd = date.replace(/-/g, '');
  try {
    const r = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=' + ymd);
    const j = await r.json();
    const out = [];
    for (const ev of j.events || []) {
      const comp = ev.competitions && ev.competitions[0];
      if (!comp) continue;
      const home = comp.competitors.find(c => c.homeAway === 'home');
      const away = comp.competitors.find(c => c.homeAway === 'away');
      const state = comp.status.type.state;
      let raw = ev.league.name;
      let country = 'WORLD';
      let league = raw;
      const L = raw.toLowerCase();
      if (L.includes('premier')) { country = 'ENGLAND'; league = 'Premier League'; }
      else if (L.includes('championship')) { country = 'ENGLAND'; league = 'Championship'; }
      else if (L.includes('la liga') || L.includes('laliga')) { country = 'SPAIN'; league = 'LaLiga'; }
      else if (L.includes('bundesliga')) { country = 'GERMANY'; league = 'Bundesliga'; }
      else if (L.includes('serie a')) { country = 'ITALY'; league = 'Serie A'; }
      else if (L.includes('ligue 1')) { country = 'FRANCE'; league = 'Ligue 1'; }
      else if (L.includes('champions league')) { country = 'EUROPE'; league = 'Champions League'; }
      out.push({
        country: country,
        league: league,
        homeTeam: home? home.team.displayName : 'Home',
        awayTeam: away? away.team.displayName : 'Away',
        homeScore: home? parseInt(home.score) || 0 : 0,
        awayScore: away? parseInt(away.score) || 0 : 0,
        minute: state === 'in'? 'LIVE' : state === 'post'? 'FT' : '15:00',
        isLive: state === 'in',
        isFinished: state === 'post'
      });
    }
    res.status(200).json({ data: out });
  } catch (e) {
    res.status(200).json({ data: [] });
  }
}
