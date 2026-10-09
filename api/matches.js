export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const dateParam = req.query.date || new Date().toISOString().split('T')[0];
  const ymd = dateParam.replace(/-/g, '');

  try {
    // Use ESPN - 100% free and no key needed
    const espnRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${ymd}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const espnData = await espnRes.json();
    let games = [];

    (espnData.events || []).forEach(ev => {
      const comp = ev.competitions?.[0];
      if (!comp) return;

      const home = comp.competitors?.find(c => c.homeAway === 'home');
      const away = comp.competitors?.find(c => c.homeAway === 'away');
      const status = comp.status?.type?.state; // pre, in, post, halftime
      const clock = comp.status?.displayClock || "";
      const detail = comp.status?.type?.shortDetail || "";

      // Build minute display
      let minute = "";
      if (status === 'in') {
        if (clock) minute = clock + "'";
        else if (comp.status.clock) minute = Math.floor(comp.status.clock / 60) + "'";
        else minute = detail.includes("'")? detail.match(/\d+'/)?.[0] || "LIVE" : "LIVE";
      } else if (status === 'halftime') {
        minute = "HT";
      } else if (status === 'post') {
        minute = "FT";
      } else {
        // Not started - show time in EU
        try {
          const d = new Date(ev.date);
          minute = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Madrid' });
        } catch { minute = "20:00"; }
      }

      // Clean minute - remove LIVE word, just 47', 26', HT, FT
      minute = minute.replace('LIVE', '').trim();
      if (minute === "") minute = "LIVE";

      games.push({
        country: (ev.league?.name?.split(' - ')[0] || "WORLD").toUpperCase().substring(0, 20),
        league: (comp.league?.name || ev.league?.name || "ALL LEAGUES").toUpperCase(),
        homeTeam: home?.team?.displayName || "Home",
        awayTeam: away?.team?.displayName || "Away",
        homeScore: parseInt(home?.score) || 0,
        awayScore: parseInt(away?.score) || 0,
        timeEU: minute,
        minute: minute,
        isLive: status === 'in' || status === 'halftime',
        isFinished: status === 'post'
      });
    });

    // Sort - LIVE first
    games.sort((a,b) => {
      if (a.isLive &&!b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return 0;
    });

    return res.status(200).json({ data: games, date: dateParam, count: games.length });

  } catch (e) {
    return res.status(200).json({ data: [], error: e.message, date: dateParam });
  }
}
