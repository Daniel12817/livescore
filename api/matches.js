export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const API_KEY = process.env.APISPORT_KEY;
  const date = req.query.date || new Date().toISOString().split('T')[0];

  if (!API_KEY) {
    return res.status(200).json({ data: [], error: "No APISPORT_KEY in Vercel" });
  }

  try {
    // YOUR REAL API - livescores
    const r = await fetch(`https://api.isportsapi.com/sport/football/livescores?api_key=${API_KEY}`);
    const j = await r.json();

    if (j.code!== 0 &&!j.data) {
      return res.status(200).json({ data: [], api_error: j.message || j.msg, raw: j });
    }

    let list = j.data || [];

    // If date clicked, also fetch schedule for that date
    if (date && req.query.date) {
      try {
        const r2 = await fetch(`https://api.isportsapi.com/sport/football/schedule?api_key=${API_KEY}&date=${date}`);
        const j2 = await r2.json();
        if (j2.data && j2.data.length > 0) list = j2.data;
      } catch(e){}
    }

    const games = list.map(m => ({
      country: (m.countryName || 'WORLD').toUpperCase(),
      league: m.leagueName || 'League',
      homeTeam: m.homeName || 'Home',
      awayTeam: m.awayName || 'Away',
      homeScore: m.homeScore?? 0,
      awayScore: m.awayScore?? 0,
      minute: m.status==1? 'LIVE' : m.status==0? 'FT' : (m.matchTime || '15:00'),
      isLive: m.status==1,
      isFinished: m.status==0
    }));

    return res.status(200).json({ data: games, source: "YOUR API - apisport.online", count: games.length });

  } catch (e) {
    return res.status(200).json({ data: [], error: e.message });
  }
}
