// FULL LEAGUE + FULL CLUB + LOGOS + EUROPE TIME - BASIC $0 FREE
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const date = req.query.date || new Date().toISOString().split('T')[0];
  const API_KEY = process.env.HIGHLIGHTLY_API_KEY || process.env.HIGHLIGHTLY_KEY;

  if (!API_KEY) {
    return res.status(200).json({ data: [], error: "No API Key" });
  }

  try {
    const r = await fetch(`https://soccer.highlightly.net/matches?date=${date}`, {
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-api-key": API_KEY,
        "x-rapidapi-host": "soccer.highlightly.net"
      }
    });

    const json = await r.json();
    const raw = json.data || json.matches || [];

    const data = raw.map(item => {
      const m = item.match || item;

      let hs = 0, as = 0;
      const sc = m.state?.score?.current || m.score?.current || "";
      if (sc.includes("-")) {
        const p = sc.split("-");
        hs = parseInt(p[0]) || 0;
        as = parseInt(p[1]) || 0;
      }

      let timeEU = "00:00";
      if (m.date) {
        timeEU = new Date(m.date).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Europe/Madrid'
        });
      }

      const desc = (m.state?.description || "").toLowerCase();

      return {
        country: (m.country?.name || "WORLD").toUpperCase(),
        league: (m.league?.name || "LEAGUE").toUpperCase(),
        leagueLogo: m.league?.logo || "",
        countryLogo: m.country?.logo || "",
        homeTeam: m.homeTeam?.name || "Home",
        awayTeam: m.awayTeam?.name || "Away",
        homeLogo: m.homeTeam?.logo || "",
        awayLogo: m.awayTeam?.logo || "",
        homeScore: hs,
        awayScore: as,
        timeEU,
        isLive: desc.includes("live"),
        isFinished: desc.includes("finish") || desc.includes("final"),
        isHT: desc.includes("half"),
        status: m.state?.description || "NS"
      };
    });

    // Show ALL - no slice
    res.status(200).json({ data });
