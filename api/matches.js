// FREE LIVESCORE - NO API KEY, NO PAYMENT - $0/month
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const dateParam = req.query.date || new Date().toISOString().split('T')[0];
  const espnDate = dateParam.replace(/-/g, '');

  try {
    // ESPN FREE API - gives all leagues at once
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${espnDate}`;
    const r = await fetch(url);
    const j = await r.json();

    let data = [];
    if (j.events && j.events.length > 0) {
      j.events.forEach(ev => {
        try {
          const comp = ev.competitions[0];
          if (!comp) return;
          const home = comp.competitors.find(c => c.homeAway === 'home');
          const away = comp.competitors.find(c => c.homeAway === 'away');

          const statusType = comp.status.type.name; // SCHEDULED, IN_PROGRESS, STATUS_FINAL
          const shortDetail = comp.status.type.shortDetail || "";

          let isLive = statusType === "STATUS_IN_PROGRESS" || shortDetail.includes("'") || statusType === "IN_PROGRESS";
          let isHT = shortDetail.toLowerCase().includes("half");
          let isFinished = statusType === "STATUS_FINAL" || statusType === "FINAL";

          // League name fix
          let leagueName = "FRIENDLY";
          if (comp.notes && comp.notes[0]) leagueName = comp.notes[0];
          else if (ev.leagues && ev.leagues[0]) leagueName = ev.leagues[0].name;

          let countryName = "WORLD";
          if (leagueName.includes("English")) countryName = "ENGLAND";
          else if (leagueName.includes("Spanish")) countryName = "SPAIN";
          else if (leagueName.includes("Italian")) countryName = "ITALY";
          else if (leagueName.includes("German")) countryName = "GERMANY";
          else if (leagueName.includes("French")) countryName = "FRANCE";
          else countryName = leagueName.split(" ")[0];

          data.push({
            country: countryName,
            league: leagueName,
            leagueId: 1,
            season: 2025,
            homeTeam: home?.team?.shortDisplayName || home?.team?.displayName || "Home",
            awayTeam: away?.team?.shortDisplayName || away?.team?.displayName || "Away",
            homeScore: parseInt(home?.score) || 0,
            awayScore: parseInt(away?.score) || 0,
            timeEU: new Date(ev.date).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit', hour12: false}),
            status: isLive? "LIVE" : isHT? "HT" : isFinished? "FT" : "NS",
            isLive: isLive,
            isHT: isHT,
            isFinished: isFinished,
            elapsed: shortDetail || (isLive? "LIVE" : "")
          });
        } catch(e) {}
      });
    }

    // Sort like Flashscore - top leagues first
    res.status(200).json({ data });
  } catch (e) {
    console.error(e);
    res.status(200).json({ data: [] });
  }
}
