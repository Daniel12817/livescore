// HIGHLIGHTLY BASIC $0 - FREE - 100/day - CACHED
export default async function handler(req, res) {
  // Cache for 5 minutes so you don't waste your 100 requests
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const date = req.query.date || new Date().toISOString().split('T')[0];
  const API_KEY = process.env.HIGHLIGHTLY_API_KEY || process.env.HIGHLIGHTLY_KEY;

  if (!API_KEY) {
    return res.status(200).json({ data: [], error: "No API key" });
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

    // For debugging - if you get limit error
    if (json.message && json.message.includes("limit")) {
      return res.status(200).json({ data: [], error: "Daily limit reached (100/day on FREE)" });
    }

    const raw = json.data || json.matches || json || [];

    if (raw.length === 0) {
      return res.status(200).json({ data: [] });
    }

    const data = raw.map(item => {
      const m = item.match || item;
      let hs = 0, as = 0;
      const sc = m.state?.score?.current || m.score?.current || "";
      if (sc && sc.includes("-")) {
        const parts = sc.split("-");
        hs = parseInt(parts[0].trim()) || 0;
        as = parseInt(parts[1].trim()) || 0;
      }
      const desc = (m.state?.description || m.status || "").toLowerCase();
      const isLive = desc.includes("live") || desc.includes("1st") || desc.includes("2nd") || desc.includes("progress");
      const isHT = desc.includes("half");
      const isFinished = desc.includes("finish") || desc.includes("ft") || desc.includes("full");

      return {
        country: m.country?.name || m.league?.country || "WORLD",
        league: m.league?.name || "LEAGUE",
        leagueId: m.league?.id || 1,
        season: 2025,
        homeTeam: m.homeTeam?.name || m.homeTeam || "Home",
        awayTeam: m.awayTeam?.name || m.awayTeam || "Away",
        homeScore: hs,
        awayScore: as,
        timeEU: m.date? new Date(m.date).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit', hour12:false}) : "00:00",
        status: isLive? "LIVE" : isHT? "HT" : isFinished? "FT" : "NS",
        isLive, isHT, isFinished,
        elapsed: m.state?.description || ""
      };
    });

    res.status(200).json({ data });
  } catch (e) {
    res.status(200).json({ data: [] });
  }
}
