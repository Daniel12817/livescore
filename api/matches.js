export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.LIVE_FOOTBALL_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "Missing LIVE_FOOTBALL_API_KEY in Vercel Env Vars", data: [] });
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    const r = await fetch(`https://api.live-football-api.com/api/v1/matches?date=${today}&lang=en`, {
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json'
      }
    });

    const json = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: json.message || "API error", data: [], raw: json });
    }

    const matches = json?.data?.matches || json?.data || [];

    return res.status(200).json({
      data: matches,
      count: matches.length,
      date: today,
      credits: json?.credits_remaining || json?.data?.credits_remaining
    });

  } catch (e) {
    return res.status(500).json({ data: [], error: e.message });
  }
}
