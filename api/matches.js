// HIGHLIGHTLY BASIC $0 - FIXED NIGERIA TIME + FULL NAMES
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const date = req.query.date || new Date().toISOString().split('T')[0];
  const API_KEY = process.env.HIGHLIGHTLY_API_KEY || process.env.HIGHLIGHTLY_KEY;

  if (!API_KEY) return res.status(200).json({ data: [] });

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
      const sc = m.state?.score?.current || "";
      if (sc && sc.includes("-")) {
        const p = sc.split("-");
        hs = parseInt(p[0]) || 0;
        as = parseInt(p[1]) || 0;
      }

      // FIXED TIME: Convert to Nigeria / Lagos time (WAT UTC+1) - same as flashscore.mobi
      let timeEU = "00:00";
      if (m.date) {
        const d = new Date(m.date);
        timeEU = d.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Africa/Lagos' // <-- FIX: Nigeria time, so 21:00 go match flashscore
        });
      }

      const desc = (m.state?.description || "").toLowerCase();
      return {
        country: m.country?.name || m.league?.country || "WORLD",
        league: m.league?.name || "LEAGUE",
        leagueId: m.league?.id || 1,
        season: 2025,
        // FIXED FULL CLUB NAME: use full name, not short
        homeTeam: m.homeTeam?.name || m.homeTeam?.fullName || m.homeTeam || "Home",
        awayTeam: m.awayTeam?.name || m.awayTeam?.fullName || m.awayTeam || "Away",
        homeLogo: m.homeTeam?.logo || "",
        awayLogo: m.awayTeam?.logo || "",
        homeScore: hs,
        awayScore: as,
        timeEU: timeEU,
        status: desc.includes("live")? "LIVE" : desc.includes("finish")? "FT" : "NS",
        isLive: desc.includes("live"),
        isHT: desc.includes("half"),
        isFinished: desc.includes("finish"),
        elapsed: m.state?.description || ""
      };
    });

    res.status(200).json({ data });
  } catch (e) {
    res.status(200).json({ data: [] });
  }
}
