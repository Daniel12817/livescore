// NIELKING SUPER LIVE - BRINGS ALL LIVE LIKE FLASHSCORE
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=10');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const ymd = date.replace(/-/g,'');
  const KEY = process.env.HIGHLIGHTLY_API_KEY || process.env.HIGHLIGHTLY_KEY || "";
  let allGames = [];

  // 1. TRY HIGHLIGHTLY FIRST (best for live)
  try {
    if(KEY){
      const r = await fetch(`https://soccer.highlightly.net/matches?date=${date}`, {
        headers: {"x-rapidapi-key":KEY,"x-api-key":KEY,"x-rapidapi-host":"soccer.highlightly.net"}
      });
      if(r.ok){
        const j = await r.json();
        const raw = j.data || j.matches || [];
        raw.forEach(item=>{
          const m=item.match||item;
          let hs=0,as=0; const sc=m.state?.score?.current||"";
          if(sc.includes("-")){const p=sc.split("-"); hs=parseInt(p[0])||0; as=parseInt(p[1])||0;}
          let timeEU="00:00"; if(m.date){timeEU=new Date(m.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Europe/Madrid'});}
          const desc=(m.state?.description||"").toLowerCase();
          const live = desc.includes("live") || desc.includes("half") || desc.includes("1st") || desc.includes("2nd");
          allGames.push({
            country:(m.country?.name||"WORLD").toUpperCase(),
            league:(m.league?.name||"LEAGUE").toUpperCase(),
            leagueLogo:m.league?.logo||"",
            homeTeam:m.homeTeam?.name||"Home",
            awayTeam:m.awayTeam?.name||"Away",
            homeLogo:m.homeTeam?.logo||"",
            awayLogo:m.awayTeam?.logo||"",
            homeScore:hs, awayScore:as, timeEU,
            isLive: live, isFinished: desc.includes("finish")||desc.includes("final"), minute: m.state?.description||"",
            source:"highlightly"
          });
        });
      }
    }
  }catch(e){}

  // 2. ALSO FETCH ESPN ALL LEAGUES LIVE - THIS BRINGS ALGERIA, ANGOLA, CROATIA etc
  try{
    // Use ALL leagues endpoint, not just misc
    const espnLeagues = ["eng.1","esp.1","ita.1","ger.1","fra.1","ned.1","por.1","tur.1","mex.1","usa.1","arg.1","bra.1","qatar.1","sau.1","ind.1","chn.1","jpn.1","alg.2","ang.1","bul.2","cro.2","cze.2","est.2","fin.1","irn.1","irq.1"];
    const fetches = espnLeagues.map(lg =>
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${lg}/scoreboard?dates=${ymd}`).then(r=>r.json()).catch(()=>null)
    );
    const results = await Promise.all(fetches);

    // Also fetch general ALL scoreboard
    const allRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${ymd}`).then(r=>r.json()).catch(()=>null);
    if(allRes) results.push(allRes);

    results.forEach(j=>{
      if(!j ||!j.events) return;
      j.events.forEach(ev=>{
        const c=ev.competitions?.[0]; if(!c) return;
        const home=c.competitors?.find(x=>x.homeAway==='home');
        const away=c.competitors?.find(x=>x.homeAway==='away');
        let timeEU="00:00"; if(ev.date){timeEU=new Date(ev.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Europe/Madrid'});}
        const isLive = c.status?.type?.state==='in';
        const isFinished = c.status?.type?.state==='post';
        const minute = c.status?.type?.shortDetail||"";

        // Avoid duplicate
        if(allGames.find(g=>g.homeTeam===home?.team?.displayName && g.awayTeam===away?.team?.displayName)) return;

        allGames.push({
          country:(j.leagues?.[0]?.abbreviation||ev.league?.name||"WORLD").toUpperCase(),
          league:(j.leagues?.[0]?.name||ev.league?.name||"LEAGUE").toUpperCase(),
          leagueLogo:j.leagues?.[0]?.logos?.[0]?.href||"",
          homeTeam:home?.team?.displayName||"Home",
          awayTeam:away?.team?.displayName||"Away",
          homeLogo:home?.team?.logo||"",
          awayLogo:away?.team?.logo||"",
          homeScore:parseInt(home?.score)||0,
          awayScore:parseInt(away?.score)||0,
          timeEU,
          isLive, isFinished, minute,
          source:"espn"
        });
      });
    });
  }catch(e){}

  // Sort: Live first
  allGames.sort((a,b)=>{
    if(a.isLive &&!b.isLive) return -1;
    if(!a.isLive && b.isLive) return 1;
    return 0;
  });

  return res.status(200).json({ data: allGames, total: allGames.length });
}
