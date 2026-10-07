export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const API_KEY = process.env.HIGHLIGHTLY_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "API Key missing in Vercel" });
  }
  try {
    const response = await fetch(`https://soccer.highlightly.net/matches?date=${date}`, {
      headers: { "x-rapidapi-key": API_KEY }
    });
    const data = await response.json();
    res.status(200).json(data.data || data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
