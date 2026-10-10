export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const KEY = process.env.APISPORT_KEY;
  const date = req.query.date || new Date().toISOString().split('T')[0];

  if (!KEY) return res.json({ data: [], error: "No KEY in Vercel" });

  try {
    // Use apisport.online correct endpoint - test both
    let url = `https://api.apisport.online/v1/football/matches?date=${date}`;

    // Try apisport.online with header auth
    const r = await fetch(url, {
      headers: {
        'x-api-key': KEY,
        'Authorization': KEY
      }
    });

    const text = await r.text();
    let j;
    try { j = JSON.parse(text); } catch(e) { j = { raw: text }; }

    // If apisport.online fails, try isportsapi format too
    if (!r.ok || j.code === 2 || text.includes('Invalid')) {
      const r2 = await fetch(`http://api.isportsapi.com/sport/football/schedule?api_key=${KEY}&date=${date}`);
      const j2 = await r2.json();
      if (j2.data) {
        const games = j2.data.map(m => ({
          country: (m.countryName || 'WORLD').toUpperCase(),
          league: m.leagueName || 'League',
          homeTeam: m.homeName || 'Home',
          awayTeam: m.awayName || 'Away',
          homeScore: m.homeScore?? 0,
          awayScore: m.awayScore?? 0,
          minute: m.status==1?'LIVE':m.status==0?'FT':(m.matchTime||'15:00'),
          isLive: m.status==1,
          isFinished: m.status==0
        }));
        return res.json({ data: games, source: "isportsapi fallback", count: games.length });
      }
      return res.json({ data: [], error: "Invalid key", raw: text, raw2: j2 });
    }

    // Parse apisport.online success
    let list = j.data || j.matches || [];
    const games = list.map(m => ({
      country: (m.country || 'WORLD').toUpperCase(),
      league: m.league || 'League',
      homeTeam: m.home || m.homeTeam || 'Home',
      awayTeam: m.away || m.awayTeam || 'Away',
      homeScore: m.homeScore?? 0,
      awayScore: m.awayScore?? 0,
      minute: m.minute || '15:00',
      isLive: m.isLive || false,
      isFinished: m.isFinished || false
    }));

    return res.json({ data: games, count: games.length, source: "apisport.online" });

  } catch (e) {
    return res.json({ data: [], error: e.message });
  }
}
