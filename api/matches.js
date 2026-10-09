<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nielking Livescore - Complete</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Arial;background:#0d5a3a}
.top{background:#0d5a3a;color:#fff;text-align:center;padding:12px;font-weight:bold;font-size:18px}
.ad1{display:block;background:#ffcc00;color:#000;text-align:center;padding:12px;font-weight:bold;text-decoration:none;width:100%}
.ad2{display:block;background:#e6004c;color:#fff;text-align:center;padding:12px;font-weight:bold;text-decoration:none;width:100%}
.bar{display:flex;gap:6px;padding:8px;background:#073422;overflow:auto}
.bar button{padding:8px 14px;border-radius:20px;border:none;font-weight:bold;background:#1a5a3a;color:#fff}
.bar.active{background:#00d084;color:#000}
.bar2{display:flex;gap:6px;padding:8px;background:#0f2942;width:100%}
.bar2 button{padding:7px 12px;border-radius:10px;border:none;font-weight:bold;background:#222;color:#fff;font-size:13px}
.bar2.active{background:#00d4ff;color:#000}
#box{width:100%;background:#f5f5f5;min-height:600px}
.league{background:#222;color:#fff;padding:8px 10px;font-weight:bold;font-size:13px;display:flex;justify-content:space-between;position:sticky;top:0}
.league span:last-child{color:#00d084;font-size:11px}
.match{display:flex;justify-content:space-between;align-items:center;padding:10px 10px;border-bottom:1px solid #e0e0e0;background:#fff;color:#111;font-size:14px;width:100%}
.match span:first-child{flex:1;white-space:normal;word-break:break-word;padding-right:10px}
.t{color:#0044ff;font-weight:bold;margin-right:6px}
.s{color:#e60000;font-weight:bold;min-width:35px;text-align:right}
</style></head><body>
<div class="top">⚽ NIELKING LIVESCORE ⚽</div>
<a class="ad1" href="https://wa.me/2349130441227?text=Advertise">📢 ADVERTISE HERE - 150x300 - WhatsApp Us</a>
<a class="ad2" href="https://wa.me/2349130441227?text=Advertise">📢 ADVERTISE HERE - 728x90 - WhatsApp Us</a>
<div class="bar"><button id="t1" class="active" onclick="setD('today')">Today</button><button id="t2" onclick="setD('yesterday')">Yesterday</button><button id="t3" onclick="setD('tomorrow')">Tomorrow</button></div>
<div class="bar2"><button id="b1" class="active" onclick="setF('all')">All Games</button><button onclick="setF('live')">LIVE</button><button onclick="setF('finished')">Finished</button><button onclick="loadData()" style="margin-left:auto;background:#00d4ff;color:#000">↻ REFRESH</button></div>
<div id="box">Loading...</div>
<script>
let curD='today', curF='all', all=[];
function getDS(t){let d=new Date(); if(t=='yesterday')d.setDate(d.getDate()-1); if(t=='tomorrow')d.setDate(d.getDate()+1); return d.toISOString().split('T')[0];}
function setD(t){curD=t; document.querySelectorAll('.bar button').forEach(b=>b.classList.remove('active')); document.getElementById(t=='today'?'t1':t=='yesterday'?'t2':'t3').classList.add('active'); loadData();}
function setF(f){curF=f; render();}
async function loadData(){document.getElementById('box').innerHTML='<div style="padding:30px;text-align:center;color:#333">Loading matches... ⚽</div>'; let ds=getDS(curD); try{let r=await fetch('/api/matches?date='+ds); let j=await r.json(); all=j.data||[]; render();}catch(e){document.getElementById('box').innerHTML='<div style="padding:30px;color:red;text-align:center">No data. Refresh.</div>';}}
function render(){let box=document.getElementById('box'); if(!all.length){box.innerHTML='<div style="padding:30px;text-align:center;color:#333">No matches for this day. Try Yesterday/Tomorrow</div>';return;} let f=all; if(curF=='live')f=all.filter(m=>m.isLive); if(curF=='finished')f=all.filter(m=>m.isFinished); let g={}; f.forEach(m=>{let k=m.country+': '+m.league; if(!g[k])g[k]=[]; g[k].push(m);}); let h=''; for(let lg in g){h+='<div class="league"><span>'+lg+'</span><span>Standings</span></div>'; g[lg].forEach(m=>{let score=(m.homeScore||m.homeScore==0)? m.homeScore+' - '+m.awayScore : '-'; let tc=m.isLive?'color:red':''; h+='<div class="match"><span><span class="t" style="'+tc+'">'+m.timeEU+'</span> '+m.homeTeam+' - '+m.awayTeam+'</span><span class="s">'+score+'</span></div>';});} box.innerHTML=h;}
loadData();
</script></body></html>
