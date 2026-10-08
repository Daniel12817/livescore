export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
  const API_KEY = process.env.RAPIDAPI_KEY || process.env.HIGHLIGHTLY_KEY;
  if (!API_KEY) return res.status(500).json({ error: "Missing RAPIDAPI_KEY" });
  try {
    const r = await fetch(`https://soccer-highlightly-api.p.rapidapi.com/matches?date=${date}`, {
      headers: { "X-RapidAPI-Key": API_KEY, "X-RapidAPI-Host": "soccer-highlightly-api.p.rapidapi.com" }
    });
    const j = await r.json();
    let list = [];
    if (Array.isArray(j)) list = j;
    else if (Array.isArray(j.data)) list = j.data;
    else if (Array.isArray(j.matches)) list = j.matches;
    else if (j.data && Array.isArray(j.data.data)) list = j.data.data;
    else list = [];
    
    return res.status(200).json({ dateUsed: date, timeZone: "Europe/Berlin", count: list.length, data: list });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
