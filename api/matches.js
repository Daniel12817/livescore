<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nielking LiveScore</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial, sans-serif;background:#f1f1f1;color:#000}
.header-top{background:#0b1a2a;color:white;text-align:center;padding:15px;font-size:20px;font-weight:bold}
.country-header{background:#37404e;color:white;padding:7px 10px;font-weight:bold;font-size:13px;display:flex;justify-content:space-between}
.country-header span{color:#aaa;font-weight:normal;font-size:12px;text-decoration:underline}
.match-row{background:white;border-bottom:1px solid #ddd;padding:6px 10px;display:flex;justify-content:space-between;font-size:14px}
.match-row:nth-child(even){background:#f8f8f8}
.match-time{width:45px;color:#666;font-size:13px}
.match-teams{flex:1}
.match-score{width:50px;text-align:center;font-weight:bold;color:#0066cc}
.match-score.live{color:#cc0000}
.match-score.ft{color:#0066cc}
.live-text{color:#cc0000;font-weight:bold;font-size:12px}
.half-time{background:#ffe6e6;padding:3px 10px;font-size:13px;color:#cc0000;font-weight:bold}
</style>
</head>
<body>
<div class="header-top">⚽ NIELKING LIVESCORE <span style="font-size:12px;display:block;color:#00ff88;font-weight:normal" id="update"></span></div>
<div id="scores">Loading...</div>

<script>
async function load(){
  const r = await fetch('/api/matches');
  const j = await r.json();
  document.getElementById('update').innerText = j.count + ' matches - Europe Time (Berlin) - ' + new Date().toLocaleTimeString();

  // Group by country + league
  const groups = {};
  j.data.forEach(m=>{
    const key = `${m.country}: ${m.league}`;
    if(!groups[key]) groups[key]=[];
    groups[key].push(m);
  });

  let html='';
  for(let group in groups){
    const parts = group.split(':');
    const country = parts[0];
    const league = parts.slice(1).join(':');
    html+=`<div class="country-header"><div>${country.toUpperCase()}: ${league}</div><span>Standings</span></div>`;

    groups[group].forEach(m=>{
      let scoreClass = m.isLive?'live':'ft';
      let timeDisplay = m.isLive? `<span class="live-text">${m.status}</span>` : m.timeEU;
      if(m.status.includes('HT')) timeDisplay = 'Half Time';

      html+=`
      <div class="match-row">
        <div class="match-time">${timeDisplay}</div>
        <div class="match-teams">${m.homeTeam} - ${m.awayTeam}</div>
        <div class="match-score ${scoreClass}">${m.homeScore}-${m.awayScore}${m.homeScore==0&&m.awayScore==0&&!m.isLive?' -':''}</div>
      </div>`;

      if(m.status.includes('HT')){
        html+=`<div class="half-time">Half Time</div>`;
      }
    });
  }
  document.getElementById('scores').innerHTML = html || 'No matches today';
}
load();
setInterval(load,30000);
</script>
</body>
</html>
