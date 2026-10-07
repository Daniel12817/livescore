export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const API_KEY = "afad9a68-c248-429b-8aa7-b7626bb56744";
  try {
    const response = await fetch(`https://soccer.highlightly.net/matches?date=${date}`, {
      headers: { "x-rapidapi-key": API_KEY, "x-api-key": API_KEY }
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
