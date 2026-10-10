export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');

  const KEY = process.env.APISPORT_KEY;
  const date = req.query.date;

  if (!KEY) return res.status(200).json({ data: [], error: "Missing APISPORT_KEY" });

  try {
    // Use YOUR exact working endpoint from screenshot
    const url = `https://api.apisport.online/api/v1/fixtures/live${date? `?date=${date}` : ''}`;

    const r = await fetch(url, {
      headers: {
        'x-api-key': KEY,
        'X-API-Key': KEY,
        'Authorization': `Bearer ${KEY}`,
        'apikey': KEY
      }
    });

    const j = await r.json();

    // Your API returns { s: 1, d: [...] } <-- THIS IS IT!
    let list = j.d || j.data || j.fixtures || [];

    if (!Array.isArray(list) || list.length === 0) {
      return res.status(200).json({ data: [], raw: j, count: 0, note: "No live games at this moment" });
    }

    const games = list.map(m => {
      const status = (m.s || "").toUpperCase();
      return {
        id: m.i,
        country: "WORLD",
        league: "Live Match",
        homeTeam: m.h?.n || "Home",
        awayTeam: m.a?.n || "Away",
        homeScore: m.sc?.[0]?? 0,
        awayScore: m.sc?.[1]?? 0,
        minute: status,
        isLive: ["1H","2H","LIVE","HT","ET","P"].includes(status),
        isFinished: status === "FT",
        timestamp: m.t
      };
    });

    return res.status(200).json({ data: games, count: games.length, source: "apisport.online - LIVE", raw_sample: games[0] });

  } catch (e) {
    return res.status(200).json({ data: [], error: e.message });
  }
}
