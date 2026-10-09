export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const API_KEY = process.env.APISPORT_KEY;
  const date = req.query.date || new Date().toISOString().split('T')[0];

  if (!API_KEY) return res.status(200).json({ data: [] });

  try {
    // Only YOUR apisport.online API - No ESPN
    const url = `https://api.isportsapi.com/sport/football/schedule?api_key=${API_KEY}&date=${date}`;
    const url2 = `https://api.isportsapi.com/sport/football/livescores?api_key=${API_KEY}`;

    let list = [];

    // Try by date first
    let r = await fetch(url);
    let j = await r.json();
    list = j.data || [];

    // If no games for date, try livescores
    if (list.length === 0) {
      r = await fetch(url2);
      j = await r.json();
      list = j.data || [];
      // Filter by date if needed
      if (date) {
        const filtered = list.filter(m => m.matchTime && m.matchTime.startsWith(date));
        if (filtered.length > 0) list = filtered;
      }
    }

    const games = list.map(m => ({
      country: (m.countryName || 'WORLD').toUpperCase(),
      league: m.leagueName || 'League',
      homeTeam: m.homeName || 'Home',
      awayTeam: m.awayName || 'Away',
      homeScore: m.homeScore?? 0,
      awayScore: m.awayScore?? 0,
      minute: m.status==1? 'LIVE' : m.status==0? 'FT' : m.matchTime? m.matchTime.split(' ')[1]?.substring(0,5) : '15:00',
      isLive: m.status==1,
      isFinished: m.status==0
    }));

    res.status(200).json({ data: games });
  } catch (e) {
    res.status(200).json({ data: [] });
  }
}
