export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  // FOREVER AUTOMATIC EUROPE TIME - always today in Europe/Berlin
  const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
  
  // Use the key you added in Vercel (RAPIDAPI_KEY)
  const API_KEY = process.env.RAPIDAPI_KEY || process.env.HIGHLIGHTLY_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "API Key missing in Vercel - Add RAPIDAPI_KEY" });
  }
  try {
    const response = await fetch(`https://soccer-highlightly-api.p.rapidapi.com/matches?date=${date}`, {
      headers: { 
        "X-RapidAPI-Key": API_KEY,
        "X-RapidAPI-Host": "soccer-highlightly-api.p.rapidapi.com"
      }
    });
    const data = await response.json();
    res.status(200).json({ dateUsed: date, timeZone: "Europe/Berlin", forever: true, ...(data.data ? data : {data: data}) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
