export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const KEY = process.env.LIVE_FOOTBALL_API_KEY || process.env.APISPORT_KEY;
  if(!KEY) {
    return res.status(200).json({ data: [], error: "Missing LIVE_FOOTBALL_API_KEY in Vercel Settings -> Env Variables" });
  }

  const date = new Date().toISOString().split('T')[0];

  try {
    const r = await fetch(`https://api.live-football-api.com/v1/matches?date=${date}&lang=en`, {
      headers: {
        "Authorization": "Bearer " + KEY,
        "X-Auth-Token": KEY,
        "Accept": "application/json"
      }
    });

    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch {
      return res.status(200).json({ data: [], error: "Not JSON: " + text.slice(0,500), date });
    }

    if(!r.ok){
      return res.status(200).json({ data: [], error: `API ${r.status}: ${text.slice(0,400)}`, date });
    }

    const matches = json?.data?.matches || json?.data || json?.matches || [];
    return res.status(200).json({
      data: matches,
      count: matches.length,
      date: date,
      source: "live-football-api.com"
    });

  } catch(e) {
    return res.status(200).json({ data: [], error: e.message, date: new Date().toISOString() });
  }
}
