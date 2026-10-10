export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const key1 = process.env.LIVE_FOOTBALL_API_KEY;
  const key2 = process.env.APISPORT_KEY;
  const API_KEY = key1 || key2;

  if (!API_KEY) return res.status(200).json({ data: [], error: "No API key in Vercel" });

  const today = new Date().toISOString().split('T')[0];

  // Try live-football-api.com first (your new 500 free calls key)
  let url, headers;
  if (key1) {
    url = `https://api.live-football-api.com/api/v1/matches?date=${today}`;
    headers = { 'X-API-Key': key1 };
  } else {
    // fallback to apisport.online
    url = `https://api.apisport.online/v1/matches?date=${today}`;
    headers = { 'X-API-Key': key2 };
  }

  try {
    const r = await fetch(url, { headers });
    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text.slice(0,500) }; }

    const matches = json?.data?.matches || json?.data || json?.matches || [];

    return res.status(200).json({
      data: matches,
      count: matches.length,
      date: today,
      source: key1? "live-football-api.com" : "apisport.online",
      status: r.status,
      debug: matches.length === 0? json : undefined
    });

  } catch (e) {
    return res.status(200).json({ data: [], error: "fetch failed: " + e.message, tried: url });
  }
}
