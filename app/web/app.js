/* Sparplan desktop app UI. One view at a time in the main pane, chosen by the sidebar (hash routes).
   Views render HTML into #view; charts register a redraw so they are drawn at the real width and follow window resizes.
   Everything personal (watchlist, saved plans, inputs, language, theme) stays in this app's own browser profile. */
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const RISK=["","Very low","Low","Low–medium","Medium","Medium–high","High","Very high"];
const HZ={short:"Short term",medium:"Medium term",long:"Long term"}, HZR={short:"1–2",medium:"3–4",long:"5–7"};
const HZT={short:"under 2 years",medium:"2–5 years",long:"5 years or more"};
const tRisk=s=>t(RISK[s]), tHzT=h=>t(HZT[h]);
const loc=()=>LANG==="sv"?"sv-SE":"en-GB";
const num=(v,d=1)=>v.toLocaleString(loc(),{minimumFractionDigits:d,maximumFractionDigits:d});
const PC=()=>LANG==="sv"?" %":"%";
const pct=(v,d=1)=>v==null||!isFinite(v)?"–":(v>0?"+":v<0?"−":"")+num(Math.abs(v),d)+PC();
const pctA=v=>v.toLocaleString(loc())+PC();
const pcf=(v,d)=>num(v,d)+PC();
const drop=v=>"−"+num(Math.abs(v),0)+PC();
const sek=v=>Math.round(v).toLocaleString("sv-SE")+" kr";
const short=n=>n.split(" (")[0];
const where=r=>r.region?" · "+esc(t(r.region)):"";
const yrs=n=>t(n===1?"{n} year":"{n} years",{n});
const ticker=s=>s.replace(/\.[A-Z]{2}$/,"");
const meter=s=>`<span class="meter" aria-hidden="true">${[1,2,3,4,5,6,7].map(i=>`<i class="${i<=s?"on":""}" style="--c:var(--h-${hzOf(i)})"></i>`).join("")}</span>`;
const riskPill=s=>`<span class="risk"><b>${s}</b>${meter(s)}<span class="w">${tRisk(s)}</span></span>`;
const fundHref=sym=>"#/fund/"+encodeURIComponent(sym);

const ICON={
 overview:'<path d="M3 11 12 4l9 7"/><path d="M5.5 9.5V20h13V9.5"/>',
 plan:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>',
 monthly:'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
 saved:'<path d="M6 3.5h12v17l-6-4-6 4z"/>',
 ranking:'<path d="M4 6h16M4 12h11M4 18h6"/>',
 watchlist:'<path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
 moving:'<path d="M3 12h4l3-7 4 14 3-7h4"/>',
 map:'<path d="M4 4v16h16"/><circle cx="9" cy="14" r="1.4"/><circle cx="13" cy="9" r="1.4"/><circle cx="17.5" cy="12.5" r="1.4"/>',
 learn:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5"/>',
 back:'<path d="M15 5l-7 7 7 7"/>',
 refresh:'<path d="M20 11.5a8 8 0 1 1-2.4-5.7L20 8"/><path d="M20 3.5V8h-4.5"/>',
 bookmark:'<path d="M6 3.5h12v17l-6-4-6 4z"/><path d="M12 7.5v6M9 10.5h6"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
 edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
 open:'<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v6H4V6h6"/>',
 copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>'
};
const svgI=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
const starSvg=on=>`<svg viewBox="0 0 24 24" fill="${on?"currentColor":"none"}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true">${ICON.watchlist}</svg>`;

/* ---------- state ---------- */
const KEY="sparplan-app";
const DEF={lang:(navigator.language||"").toLowerCase().startsWith("sv")?"sv":"en",theme:"system",hz:"all",type:"all",sort:"srri",dir:1,all:false,
 plan:{amt:100000,phz:"long",pyrs:10,prisk:5,pshares:false},mon:{start:0,monthly:2000,years:20,sstocks:70,fee:.2,isk:1.05},
 watch:[],slot:{},plans:[],ins:"us"};
const st=(()=>{try{const s=JSON.parse(localStorage.getItem(KEY)||"{}");return {...DEF,...s,plan:{...DEF.plan,...s.plan},mon:{...DEF.mon,...s.mon}}}
 catch(e){return JSON.parse(JSON.stringify(DEF))}})();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}};
LANG=st.lang;

function applyTheme(){if(st.theme==="system")document.documentElement.removeAttribute("data-theme");else document.documentElement.dataset.theme=st.theme}
applyTheme();

/* ---------- data ---------- */
let DATA=null,ROWS=[],BY={},SLV=null,LOADERR=null;
async function loadData(){
 const r=await fetch("market-data.json",{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);
 DATA=await r.json();const rf=DATA.rates.tbill5yAvg;
 ROWS=DATA.instruments.map(x=>metrics(x,rf));BY=Object.fromEntries(ROWS.map(r=>[r.sym,r]));
 for(const k in PLAN_CACHE)delete PLAN_CACHE[k];SLV=null;
}
const sleeves=()=>SLV||(SLV={s:pickSleeve(ROWS,DATA.rates,["Index fund","Investment company"]),b:pickSleeve(ROWS,DATA.rates,["Bond fund"])});
const watched=()=>st.watch.map(s=>BY[s]).filter(Boolean);

/* ---------- local server (when launched as the desktop app) ---------- */
const TOKEN=(document.querySelector('meta[name="sparplan-token"]')||{}).content||"";
const SERVED=/^[0-9a-f]{32}$/.test(TOKEN);
let STATUS=null,DATATIME=null;
async function api(p){const r=await fetch("/api/"+p,{method:"POST",headers:{"X-Sparplan-Token":TOKEN}});if(!r.ok)throw new Error(r.status);return r.json()}
async function poll(){
 if(!SERVED)return;
 try{const s=await api("status"),was=STATUS;STATUS=s;
  const fresh=s.dataTime&&DATATIME&&s.dataTime!==DATATIME&&!s.running;
  if(DATATIME==null)DATATIME=s.dataTime;
  if(fresh||(was&&was.running&&!s.running&&s.ok)){DATATIME=s.dataTime;await loadData();renderSide();render();toast(t("Data updated."))}
  renderStatus();
 }catch(e){}
 setTimeout(poll,STATUS&&STATUS.running?4000:20000);
}
addEventListener("pagehide",()=>{if(SERVED)navigator.sendBeacon("/api/bye?t="+TOKEN)});

/* hosted on the web: the data is refreshed by the scheduled GitHub workflow, so look for a newer file now and then */
async function checkHosted(){
 try{const r=await fetch("market-data.json",{cache:"no-store"});if(!r.ok)return;const d=await r.json();
  if(DATA&&d.generated!==DATA.generated){await loadData();renderSide();render();toast(t("Data updated."))}}catch(e){}
}
if(!SERVED){
 if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
 setInterval(checkHosted,30*60*1000);
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&DATA)checkHosted()});
}

/* ---------- shell ---------- */
const NAV=[[null,[["overview","Overview"]]],["Plan",[["plan","My plan"],["monthly","Monthly saving"],["saved","Saved plans"]]],
 ["Explore",[["ranking","Ranking"],["watchlist","Watchlist"],["moving","What's moving"],["map","Risk map"]]],["Learn",[["learn","Accounts & glossary"]]]];
function renderSide(){
 document.documentElement.lang=LANG;
 $("side").innerHTML=`<div class="brand"><img src="icon.png" alt=""><span>Sparplan</span></div>
 <nav class="nav" aria-label="${t("Sections")}">${NAV.map(([g,items])=>(g?`<div class="grp">${t(g)}</div>`:"")+items.map(([k,l])=>
  `<a href="#/${k}" data-v="${k}" title="${t(l)}">${svgI(k)}<span>${t(l)}</span>${k==="watchlist"||k==="saved"?`<b class="count" id="cnt-${k}"></b>`:""}</a>`).join("")).join("")}</nav>
 <div class="side-foot"><div class="dstat hide-narrow" id="dstat"></div>
  <button class="btn" id="refreshBtn" hidden title="${t("Update data now")}">${svgI("refresh")}<span class="hide-narrow">${t("Update data now")}</span></button>
  <div class="prefs hide-narrow">
   <div class="row">${t("Language")}<div class="seg sm" id="langSeg" role="group" aria-label="${t("Language")}"><button data-l="sv" aria-pressed="${LANG==="sv"}" lang="sv">Svenska</button><button data-l="en" aria-pressed="${LANG==="en"}" lang="en">English</button></div></div>
   <div class="row"><label for="themeSel">${t("Theme")}</label><select class="sm" id="themeSel"><option value="system">${t("System")}</option><option value="light">${t("Light")}</option><option value="dark">${t("Dark")}</option></select></div>
  </div>
  <div class="prefs-mini"><button class="btn quiet" id="langMini" lang="${LANG==="sv"?"en":"sv"}" aria-label="${LANG==="sv"?"Switch to English":"Byt till svenska"}">${LANG==="sv"?"EN":"SV"}</button>
   <button class="btn quiet" id="themeMini" aria-label="${t("Theme")}: ${t({system:"System",light:"Light",dark:"Dark"}[st.theme])}" title="${t("Theme")}: ${t({system:"System",light:"Light",dark:"Dark"}[st.theme])}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg></button></div></div>`;
 $("langMini").onclick=()=>{st.lang=LANG=LANG==="sv"?"en":"sv";save();renderSide();render()};
 $("themeMini").onclick=()=>{st.theme={system:"light",light:"dark",dark:"system"}[st.theme];save();applyTheme();renderSide();render()};
 $("langSeg").querySelectorAll("button").forEach(b=>b.onclick=()=>{st.lang=LANG=b.dataset.l;save();renderSide();render()});
 $("themeSel").value=st.theme;$("themeSel").onchange=e=>{st.theme=e.target.value;save();applyTheme();render()};
 $("refreshBtn").onclick=async()=>{try{STATUS=await api("refresh");renderStatus();setTimeout(poll,3000)}catch(e){toast(t("Couldn't start the update."))}};
 markNav();counts();renderStatus();
}
function markNav(){const v=CUR.v==="fund"?null:CUR.v;document.querySelectorAll(".nav a").forEach(a=>a.dataset.v===v?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current"))}
function counts(){const w=$("cnt-watchlist"),s=$("cnt-saved");if(w)w.textContent=watched().length||"";if(s)s.textContent=st.plans.length||""}
function renderStatus(){
 const el=$("dstat");if(!el)return;
 const g=DATA&&new Date(DATA.generated),when=g&&!isNaN(g)?g.toLocaleString(loc(),{dateStyle:"medium",timeStyle:"short"}):"–";
 let cls="",line=t("Updates every weekday evening after the Stockholm close.");
 if(STATUS&&STATUS.running){cls="busy";line=t("Updating prices and rates. This takes a few minutes, and you can keep using the app.")}
 else if(STATUS&&STATUS.ok===false){cls="err";line=t("The last update failed, so the figures are from the previous update. Try again later.")}
 el.innerHTML=`<span><span class="live ${cls}"></span>${t("Data from")} <b>${when}</b></span><span>${line}</span><span>${t("Prices: Yahoo Finance · Rates: Riksbank")}</span>`;
 const b=$("refreshBtn");if(b){b.hidden=!SERVED;b.disabled=!!(STATUS&&STATUS.running)}
}

/* ---------- routing ---------- */
let CUR={v:"overview",arg:""},REDRAW=[];
function route(){
 const [v,...rest]=location.hash.replace(/^#\/?/,"").split("/");
 CUR={v:VIEWS[v]?v:"overview",arg:decodeURIComponent(rest.join("/"))};
 render();$("main").scrollTop=0;
}
function render(){
 markNav();REDRAW=[];
 if(!DATA){$("vhead").innerHTML=`<div class="t"><h1>Sparplan</h1></div>`;
  $("view").innerHTML=LOADERR?`<div class="blank"><p>${t("The market data did not load.")} ${SERVED?t("Use “Update data now” in the sidebar to fetch it."):t("Check your internet connection, then reload the app.")}</p></div>`:`<div class="empty">${t("Loading data…")}</div>`;return}
 const o=VIEWS[CUR.v](CUR.arg);
 $("vhead").innerHTML=`<div class="t">${o.kicker?`<span class="sub">${o.kicker}</span>`:""}<h1>${o.title}</h1>${o.sub?`<p class="muted">${o.sub}</p>`:""}</div>${o.actions?`<div class="actions">${o.actions}</div>`:""}`;
 $("view").innerHTML=o.html;
 document.title=o.title.replace(/<[^>]+>/g,"").replace(/&amp;/g,"&")+" · Sparplan";
 if(o.after)o.after();
 REDRAW.forEach(f=>f());
}
const chart=f=>REDRAW.push(f);
let lastW=0,rq=0;
new ResizeObserver(()=>{cancelAnimationFrame(rq);rq=requestAnimationFrame(()=>{const w=$("view").clientWidth;if(w===lastW)return;lastW=w;REDRAW.forEach(f=>f())})}).observe($("view"));

/* clicks shared by every view: stars, table rows that open a fund, back buttons */
$("main").addEventListener("click",e=>{
 const s=e.target.closest("[data-star]");if(s){e.stopPropagation();toggleWatch(s.dataset.star);return}
 if(e.target.closest("[data-back]")){if(history.length>1)history.back();else location.hash="#/ranking";return}
 const tr=e.target.closest("tr[data-href]");if(tr&&!e.target.closest("a,button,input"))location.hash=tr.dataset.href;
});
$("main").addEventListener("keydown",e=>{const tr=e.target.closest&&e.target.closest("tr[data-href]");if(tr&&e.target===tr&&(e.key==="Enter"||e.key===" ")){e.preventDefault();location.hash=tr.dataset.href}});
document.addEventListener("keydown",e=>{if(e.altKey&&/^[1-9]$/.test(e.key)){const k=NAV.flatMap(g=>g[1])[+e.key-1];if(k){e.preventDefault();location.hash="#/"+k[0]}}});

/* ---------- watchlist ---------- */
function toggleWatch(sym){
 const i=st.watch.indexOf(sym);
 if(i>=0){st.watch.splice(i,1);delete st.slot[sym]}
 else{st.watch.push(sym);const used=new Set(Object.values(st.slot));let s=0;while(used.has(s))s++;st.slot[sym]=s} // a fund keeps its colour while it stays on the list
 save();counts();
 const on=st.watch.includes(sym),r=BY[sym];
 if(CUR.v==="watchlist"||CUR.v==="overview"||CUR.v==="fund")render();
 else document.querySelectorAll(`[data-star="${CSS.escape(sym)}"]`).forEach(b=>{b.setAttribute("aria-pressed",on);b.innerHTML=starSvg(on);b.title=on?t("Remove from watchlist"):t("Add to watchlist")});
 toast(on?t("Added {name} to your watchlist.",{name:short(r.name)}):t("Removed {name} from your watchlist.",{name:short(r.name)}),on?null:()=>toggleWatch(sym));
}
const starBtn=sym=>{const on=st.watch.includes(sym),n=short(BY[sym].name);return `<button class="star" data-star="${esc(sym)}" aria-pressed="${on}" title="${on?t("Remove from watchlist"):t("Add to watchlist")}" aria-label="${esc((on?t("Remove from watchlist"):t("Add to watchlist"))+": "+n)}">${starSvg(on)}</button>`};

/* ---------- small UI pieces ---------- */
let toastT=0;
function toast(msg,undo){const el=$("toast");el.innerHTML=`<span>${esc(msg)}</span>${undo?`<button>${t("Undo")}</button>`:""}`;el.hidden=false;clearTimeout(toastT);
 if(undo)el.querySelector("button").onclick=()=>{el.hidden=true;undo()};toastT=setTimeout(()=>el.hidden=true,undo?7000:3500)}
function askName(title,def,ok){
 const d=$("dlg");d.innerHTML=`<form method="dialog"><h2>${title}</h2><div class="field"><label for="dlgName">${t("Name")}</label><input type="text" id="dlgName" maxlength="60" value="${esc(def)}"></div>
  <div class="actions" style="flex-direction:row-reverse;justify-content:flex-start"><button class="btn primary" value="ok">${t("Save")}</button><button class="btn" value="cancel" formnovalidate>${t("Cancel")}</button></div></form>`;
 d.returnValue="";d.onclose=()=>{if(d.returnValue==="ok")ok($("dlgName").value.trim()||def)};d.showModal();$("dlgName").select();
}
function seg(el,opts,cur,on){el.innerHTML="";Object.entries(opts).forEach(([k,v])=>{const b=document.createElement("button");b.type="button";b.textContent=v;
 b.setAttribute("aria-pressed",cur===k);b.onclick=()=>{el.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));on(k)};el.append(b)})}
function scaleKey(){
 const cells=[1,2,3,4,5,6,7].map(i=>{const h=hzOf(i);return `<div class="cell" style="--c:var(--h-${h});--soft:var(--h-${h}-soft)">${i}</div>`}).join("");
 const zone=(h,span)=>`<div class="zone" style="grid-column:span ${span};--c:var(--h-${h})"><b>${t(HZ[h])}</b>${tHzT(h)}</div>`;
 return `<div class="scalekey" role="img" aria-label="${t("Risk scale 1 to 7. Levels 1 and 2 suit money needed within 2 years, 3 and 4 suit 2 to 5 years, 5 to 7 suit 5 years or more.")}">${cells+zone("short",2)+zone("medium",2)+zone("long",3)}</div>`;
}
function niceStep(x){const e=Math.pow(10,Math.floor(Math.log10(x)));const f=x/e;return (f<1.5?1:f<3?2:f<7?5:10)*e}
function tipper(box){let el=box.querySelector(".tip");if(!el){el=document.createElement("div");el.className="tip";el.hidden=true;box.append(el)}return el}
const boxW=id=>Math.max(300,Math.round($(id).clientWidth));
function spark(p,w=110,h=30){const mn=Math.min(...p),mx=Math.max(...p),X=i=>i/(p.length-1)*w,Y=v=>h-3-(v-mn)/(mx-mn||1)*(h-6);
 const up=p[p.length-1]>=p[0];return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" style="display:block"><path d="${p.map((v,i)=>(i?"L":"M")+X(i).toFixed(1)+","+Y(v).toFixed(1)).join("")}" fill="none" stroke="var(${up?"--ink":"--neg"})" stroke-opacity="${up?.7:1}" stroke-width="1.5" stroke-linejoin="round"/></svg>`}
const yearTicks=(d,X,n,H)=>{let s="",last="";d.forEach((x,i)=>{const y=x.slice(0,4);if(y!==last&&i>4&&i<n-10)s+=`<text x="${X(i)}" y="${H-6}" text-anchor="middle">${y}</text>`;last=y});return s};

/* ---------- views ---------- */
const VIEWS={overview:vOverview,plan:vPlan,monthly:vMonthly,saved:vSaved,ranking:vRanking,watchlist:vWatch,moving:vMoving,map:vMap,learn:vLearn,fund:vFund};

function glanceCards(){
 const R=DATA.rates;
 const pickList=list=>list.map(r=>`<a class="pick" href="${fundHref(r.sym)}" style="color:inherit;text-decoration:none">
   <span><span class="pn">${esc(short(r.name))}</span><span class="ps">${esc(t(r.group))}${where(r)}</span>
   <span class="ps">${t("Risk")} ${r.srri} · ${tRisk(r.srri)} · ${t("biggest drop")} ${drop(r.mdd)}</span></span>
   <span class="pv"><b class="${r.cagr<0?"neg":""}">${pct(r.cagr)}</b><span>${t("a year")}</span></span></a>`).join("");
 const by=h=>ROWS.filter(r=>r.hz===h).sort((a,b)=>b.sharpe-a.sharpe);
 const sh=by("short"),med=by("medium"),lng=by("long");
 const card=(h,title,desc,body)=>{const w=tHzT(h);return `<article class="hcard" style="--h:var(--h-${h})"><div class="top"><span class="when">${w[0].toUpperCase()+w.slice(1)} · ${t("risk")} ${HZR[h]}</span><h3>${title}</h3><p class="sub">${desc}</p></div><div class="body">${body}</div></article>`};
 return card("short",t("Short term: keep it safe"),sh.length?t("{n} tracked funds qualify.",{n:sh.length}):t("None of the tracked funds swung little enough in SEK, so cash-like options fit here."),
   `<span class="lbl">${t("Paying today, from the Riksbank")}</span>
   <div>${[["Savings account, roughly",R.policy],["3-month T-bill / money market",R.tbill3m],["2-year government bond",R.gov2y]].map(([k,v])=>`<div class="rateline"><span>${t(k)}</span><b>${pcf(+v,2)}</b></div>`).join("")}</div>
   ${sh.length?pickList(sh.slice(0,3)):""}
   <p class="note">${t("Savings accounts are covered by the state deposit guarantee up to 1 050 000 kr per bank.")}</p>`)+
  card("medium",t("Medium term: steady growth"),t("{n} instruments qualify, mostly bond funds.",{n:med.length}),`<span class="lbl">${t("Best reward for risk first")}</span><div>${pickList(med.slice(0,4))}</div>`)+
  card("long",t("Long term: growth, with bumps"),t("{n} instruments qualify: stock funds and shares.",{n:lng.length}),`<span class="lbl">${t("Best reward for risk first")}</span><div>${pickList(lng.slice(0,5))}</div>`);
}

function vOverview(){
 const W=watched();
 const watchBox=W.length?`<div class="mini">${W.slice(0,6).map(r=>`<a href="${fundHref(r.sym)}"><span><span class="nm">${esc(short(r.name))}</span><span class="sub" style="display:block">${t("Risk")} ${r.srri} · ${tRisk(r.srri)}${where(r)}</span></span>
   <span style="text-align:right"><b class="${r.r1<0?"neg":""}">${pct(r.r1)}</b><span class="sub" style="display:block">${t("last 12 months")}</span></span></a>`).join("")}</div>`
  :`<p class="sub">${t("Star funds and shares in the ranking or on a fund's page to follow them here.")}</p><div><a class="btn" href="#/ranking">${t("Browse the ranking")}</a></div>`;
 const P=st.plans.slice(-4).reverse();
 const savedBox=P.length?`<div class="mini">${P.map(p=>{const r=savedResult(p);return `<a href="#/saved"><span><span class="nm">${esc(p.name)}</span><span class="sub" style="display:block">${savedWhat(p)}</span></span>
   <span style="text-align:right"><b>${r?sek(r.est):"–"}</b><span class="sub" style="display:block">${t("cautious estimate")}</span></span></a>`}).join("")}</div>`
  :`<p class="sub">${t("Build a plan under My plan or Monthly saving and save it to compare it here. Saved plans are recalculated after every data update.")}</p><div><a class="btn" href="#/plan">${t("Make a plan")}</a></div>`;
 return {title:t("Overview"),sub:t("Your savings options, ranked by real risk. Each fund and share is scored from its actual price history over the last 5 years."),
  html:`<section class="panel"><div class="sec-head"><h2>${t("How to read risk")}</h2><p class="sub">${t("Risk uses the official EU 1–7 scale, the same number printed on every fund's fact sheet.")}</p></div>
   ${scaleKey()}<div class="scalecap" aria-hidden="true"><span>${t("← barely moves")}</span><span>${t("swings a lot →")}</span></div></section>
  <section><div class="sec-head"><h2>${t("Matched to when you need the money")}</h2><p class="muted">${t("In each group, the best reward for the risk taken comes first (the Sharpe ratio, the industry's standard measure).")}</p></div>
   <div class="glance">${glanceCards()}</div></section>
  <div class="cols"><section class="panel"><div class="sec-head" style="grid-template-columns:1fr auto;align-items:baseline"><h2>${t("Watchlist")}</h2>${W.length?`<a href="#/watchlist">${t("Compare all")}</a>`:""}</div>${watchBox}</section>
   <section class="panel"><div class="sec-head" style="grid-template-columns:1fr auto;align-items:baseline"><h2>${t("Saved plans")}</h2>${P.length?`<a href="#/saved">${t("See all")}</a>`:""}</div>${savedBox}</section></div>`};
}

/* ranking */
const visible=()=>ROWS.filter(r=>(st.hz==="all"||r.hz===st.hz)&&(st.type==="all"||r.group===st.type));
const GROUPS_PL={"Bond fund":"Bond funds","Index fund":"Index funds","Investment company":"Investment companies","Single share":"Single shares"};
const SORTS=[["srri:1","Risk level, lowest first"],["cagr:-1","Average per year, highest first"],["mdd:-1","Biggest drop, smallest first"],["sharpe:-1","Reward for risk, best first"],["vol:1","Swings per year, lowest first"],["r3m:-1","Last 3 months, highest first"],["name:1","Name, A–Z"]];
function vRanking(){
 return {title:t("Ranking"),sub:t("Everything, from steadiest to bumpiest. Star a row to add it to your watchlist, or open it to see its history."),
  html:`<div class="bar">
    <div class="ctl"><span>${t("Time horizon")}</span><div class="seg" id="fHz" role="group" aria-label="${t("Time horizon")}"></div></div>
    <div class="ctl"><span>${t("Type")}</span><div class="seg" id="fType" role="group" aria-label="${t("Type")}"></div></div>
    <label class="ctl"><span>${t("Sort by")}</span><select id="sortSel">${SORTS.map(([v,l])=>`<option value="${v}">${t(l)}</option>`).join("")}</select></label>
    <label class="toggle"><input type="checkbox" id="allCols"> ${t("Show all figures")}</label></div>
   <div class="tbl-wrap" style="max-height:calc(100vh - 290px)"><table id="rank"><thead><tr>
    <th class="c-star"><span class="sub" style="font-weight:600">★</span></th><th data-k="srri">${t("Risk level")}</th><th data-k="name">${t("Name")}</th><th>${t("Last 5 years")}</th>
    <th class="n" data-k="cagr">${t("Avg per year")}</th><th class="n" data-k="mdd">${t("Biggest drop")}</th><th class="n" data-k="sharpe">${t("Reward for risk")}</th>
    <th class="n x" data-k="vol">${t("Swings / yr")}</th><th class="n x" data-k="r3m">${t("Last 3 mo")}</th><th class="n x" data-k="r1">${t("Last 12 mo")}</th><th class="n x" data-k="worst">${t("Worst 12 mo")}</th>
   </tr></thead><tbody></tbody></table></div>
   <p class="colhelp"><span><b>${t("Avg per year")}</b> ${t("average yearly gain over 5 years, dividends included")}</span><span><b>${t("Biggest drop")}</b> ${t("largest fall from a high to a later low")}</span><span><b>${t("Reward for risk")}</b> ${t("return above T-bills per unit of swing; above 0.5 is good")}</span></p>`,
  after(){
   seg($("fHz"),{all:t("All"),short:t("Short"),medium:t("Medium"),long:t("Long")},st.hz,k=>{st.hz=k;save();renderTable()});
   const groups={all:t("All")};ROWS.forEach(r=>groups[r.group]=t(GROUPS_PL[r.group]||r.group));seg($("fType"),groups,st.type,k=>{st.type=k;save();renderTable()});
   $("allCols").checked=st.all;$("rank").classList.toggle("all",st.all);
   $("allCols").onchange=e=>{st.all=e.target.checked;$("rank").classList.toggle("all",st.all);save()};
   $("sortSel").onchange=e=>{const [k,d]=e.target.value.split(":");setSort(k,+d)};
   document.querySelectorAll("#rank th[data-k]").forEach(th=>th.onclick=()=>{const k=th.dataset.k;setSort(k,st.sort===k?-st.dir:(k==="name"||k==="srri"||k==="vol"?1:-1))});
   renderTable();
  }};
}
function setSort(k,d){st.sort=k;st.dir=d;save();renderTable()}
function renderTable(){
 const k=st.sort,d=st.dir,sel=$("sortSel"),v=k+":"+d;sel.value=[...sel.options].some(o=>o.value===v)?v:"";
 const rows=visible().sort((a,b)=>(k==="name"?a.name.localeCompare(b.name):(a[k]??-1e9)-(b[k]??-1e9))*d||a.vol-b.vol);
 document.querySelectorAll("#rank th").forEach(th=>{const on=th.dataset.k===k;th.classList.toggle("sorted",on);if(on)th.dataset.arrow=d>0?"↑":"↓";if(th.dataset.k)th.setAttribute("aria-sort",on?(d>0?"ascending":"descending"):"none")});
 const tb=document.querySelector("#rank tbody");
 if(!rows.length){tb.innerHTML=`<tr><td colspan="11" class="empty">${t("Nothing in this group. Pick “All” to see everything.")}</td></tr>`;return}
 const maxS=Math.max(...ROWS.map(r=>r.sharpe),0.01);
 let last=null,html="";
 rows.forEach(r=>{
  if(k==="srri"&&r.hz!==last){last=r.hz;html+=`<tr class="groupRow" style="--h-soft:var(--h-${r.hz}-soft)"><td colspan="11">${t(HZ[r.hz])} · ${t("risk")} ${HZR[r.hz]} <span>· ${t("for money needed in {h}",{h:tHzT(r.hz)})}</span></td></tr>`}
  html+=`<tr class="link" data-href="${fundHref(r.sym)}" tabindex="0">
  <td class="c-star">${starBtn(r.sym)}</td><td>${riskPill(r.srri)}</td>
  <td><div class="nm">${esc(r.name)}</div><div class="sub">${esc(t(r.group))}${where(r)}</div></td>
  <td>${spark(r.p)}</td>
  <td class="n ${r.cagr<0?"neg":""}">${pct(r.cagr)}</td><td class="n">${drop(r.mdd)}</td>
  <td class="n">${num(r.sharpe,2)}<span class="sbar"><i style="width:${Math.max(0,r.sharpe/maxS*100)}%"></i></span></td>
  <td class="n x">${pcf(r.vol,1)}</td><td class="n x ${r.r3m<0?"neg":""}">${pct(r.r3m)}</td><td class="n x ${r.r1<0?"neg":""}">${pct(r.r1)}</td><td class="n x ${r.worst<0?"neg":""}">${pct(r.worst,0)}</td></tr>`});
 tb.innerHTML=html;
}

/* fund page */
function vFund(sym){
 const r=BY[sym];
 if(!r)return {title:t("Not in the latest data"),html:`<div class="blank"><p>${t("This fund or share is not in the latest data. It may have been dropped from the tracked list.")}</p><a class="btn" href="#/ranking">${t("Back to the ranking")}</a></div>`};
 const on=st.watch.includes(sym),end=Math.round(r.p[r.p.length-1]/r.p[0]*100);
 const wait=r.maxUw>=26?(r.maxUw>=52?t("{n} years",{n:num(r.maxUw/52,1)}):t("{n} months",{n:Math.round(r.maxUw/4.3)})):null;
 const plain=t("If you had put <b>10 000 kr</b> in 5 years ago, it would be worth about <b>{v}</b> today. At its worst point it was down <b>{d}</b> from its previous high",{v:sek(end*100),d:pcf(Math.abs(r.mdd),0)})
  +(wait?t(", and the longest wait to get back to a high was <b>{w}</b>",{w:wait}):"")+".";
 return {kicker:`${esc(t(r.group))}${where(r)} · ${t("ticker")} ${esc(ticker(r.sym))} · ${t("latest price")} ${(+r.price).toLocaleString(loc())} ${esc(r.cur)}`,title:esc(r.name),
  actions:`<button class="btn quiet" data-back>${svgI("back")}${t("Back")}</button><button class="btn${on?"":" primary"}" data-star="${esc(sym)}" aria-pressed="${on}">${starSvg(on)}${on?t("On your watchlist"):t("Add to watchlist")}</button>`,
  html:`<div class="fhead"><div style="display:grid;gap:4px">${riskPill(r.srri)}<span class="sub">${t(HZ[r.hz])} · ${tHzT(r.hz)}</span></div></div>
  <p class="plain">${plain}</p>
  <div class="two"><div class="panel">
    <div class="chartbox" id="dBox"><svg id="dSvg" role="img" aria-label="${t("Value of 100 kr invested 5 years ago")}"></svg></div>
    <span class="sub">${t("Value of 100 kr invested 5 years ago, dividends reinvested. Hover over the chart to see any week.")}</span>
    <div class="chartbox" id="ddBox"><svg id="ddSvg" role="img" aria-label="${t("Distance below previous high")}"></svg></div>
    <span class="sub">${t("Shaded red: how far below its previous high it was at each point.")}</span></div>
   <dl class="kv">
    <div><dt>${t("Risk level")}</dt><dd>${r.srri} · ${tRisk(r.srri)}</dd></div><div><dt>${t("Swings per year")}</dt><dd>${pcf(r.vol,1)}</dd></div>
    <div><dt>${t("Avg per year, 5 yrs")}</dt><dd class="${r.cagr<0?"neg":""}">${pct(r.cagr)}</dd></div><div><dt>${t("Last 12 months")}</dt><dd class="${r.r1<0?"neg":""}">${pct(r.r1)}</dd></div>
    <div><dt>${t("Last 3 months")}</dt><dd class="${r.r3m<0?"neg":""}">${pct(r.r3m)}</dd></div><div><dt>${t("Biggest drop")}</dt><dd>${drop(r.mdd)}</dd></div>
    <div><dt>${t("Worst 12 months")}</dt><dd class="${r.worst<0?"neg":""}">${pct(r.worst,0)}</dd></div><div><dt>${t("Reward for risk")}</dt><dd>${num(r.sharpe,2)}</dd></div>
    <div><dt>${t("Time horizon")}</dt><dd>${t(HZ[r.hz])}</dd></div><div><dt>${t("Traded in")}</dt><dd>${esc(r.cur)}</dd></div>
   </dl></div>`,
  after(){chart(()=>drawDetailCharts(r))}};
}
function drawDetailCharts(r){
 const W=boxW("dBox"),H=Math.round(Math.min(300,Math.max(220,W*.42))),P={l:44,r:12,t:12,b:28},w=W-P.l-P.r,h=H-P.t-P.b,n=r.p.length;
 const idx=r.p.map(v=>v/r.p[0]*100);
 let peak=idx[0];const dd=idx.map(v=>{peak=Math.max(peak,v);return (v/peak-1)*100});
 const mn=Math.min(...idx),mx=Math.max(...idx),X=i=>P.l+i/(n-1)*w,Y=v=>P.t+h-(v-mn)/(mx-mn||1)*h;
 const step=niceStep((mx-mn)/4);let g="";
 for(let v=Math.ceil(mn/step)*step;v<=mx;v+=step)g+=`<line x1="${P.l}" x2="${W-P.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${P.l-8}" y="${Y(v)+4}" text-anchor="end">${Math.round(v)}</text>`;
 if(mn<100&&mx>100)g+=`<line x1="${P.l}" x2="${W-P.r}" y1="${Y(100)}" y2="${Y(100)}" style="stroke:var(--muted)" stroke-dasharray="4 4"/>`;
 const path=idx.map((v,i)=>(i?"L":"M")+X(i).toFixed(1)+","+Y(v).toFixed(1)).join("");
 const area=path+`L${X(n-1)},${P.t+h}L${X(0)},${P.t+h}Z`, col=`var(--h-${r.hz})`;
 const svg=$("dSvg");svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
 svg.innerHTML=`<g class="grid">${g}</g>${yearTicks(r.d,X,n,H)}<path d="${area}" fill="${col}" fill-opacity=".1"/><path d="${path}" fill="none" stroke="${col}" stroke-width="2.25" stroke-linejoin="round"/>
    <circle cx="${X(n-1)}" cy="${Y(idx[n-1])}" r="4" fill="${col}"/>
    <line id="dX" y1="${P.t}" y2="${P.t+h}" stroke="var(--muted)" stroke-dasharray="3 3" visibility="hidden"/><circle id="dC" r="5" fill="${col}" stroke="var(--surface)" stroke-width="2" visibility="hidden"/>
    <rect id="dHit" x="${P.l}" y="${P.t}" width="${w}" height="${h}" fill="transparent"/>`;
 const DH=100,dmin=Math.min(-1,...dd),DY=v=>8+(v/dmin)*(DH-22);
 const ddp="M"+X(0)+",8"+dd.map((v,i)=>"L"+X(i).toFixed(1)+","+DY(v).toFixed(1)).join("")+"L"+X(n-1)+",8Z";
 const ds=$("ddSvg");ds.setAttribute("viewBox",`0 0 ${W} ${DH}`);
 ds.innerHTML=`<line x1="${P.l}" x2="${W-P.r}" y1="8" y2="8" stroke="var(--line-strong)"/><path d="${ddp}" fill="var(--neg)" fill-opacity=".2" stroke="var(--neg)" stroke-width="1"/>
    <text x="${P.l-8}" y="12" text-anchor="end">0${PC()}</text><text x="${P.l-8}" y="${DY(dmin)+4}" text-anchor="end">${drop(dmin)}</text>`;
 const box=$("dBox"),tip=tipper(box),line=$("dX"),dot=$("dC");tip.hidden=true;
 const move=e=>{const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const loc=pt.matrixTransform(svg.getScreenCTM().inverse());
  const i=Math.max(0,Math.min(n-1,Math.round((loc.x-P.l)/w*(n-1))));
  line.setAttribute("x1",X(i));line.setAttribute("x2",X(i));line.setAttribute("visibility","visible");
  dot.setAttribute("cx",X(i));dot.setAttribute("cy",Y(idx[i]));dot.setAttribute("visibility","visible");
  const c=dot.getBoundingClientRect(),b=box.getBoundingClientRect();
  tip.textContent=`${r.d[i]} · ${idx[i].toFixed(0)} kr`;tip.style.left=Math.min(b.width-70,Math.max(70,c.left-b.left+c.width/2))+"px";tip.style.top=(c.top-b.top)+"px";tip.hidden=false};
 $("dHit").onpointermove=move;$("dHit").onpointerdown=move;
 $("dHit").onpointerleave=()=>{tip.hidden=true;line.setAttribute("visibility","hidden");dot.setAttribute("visibility","hidden")};
}

/* watchlist with comparison chart */
function vWatch(){
 const W=watched(),missing=st.watch.length-W.length;
 if(!W.length)return {title:t("Watchlist"),sub:t("Follow the funds and shares you care about, and compare them side by side."),
  html:`<div class="blank">${starSvg(false)}<h2>${t("Nothing on your watchlist yet")}</h2><p>${t("Press the star next to any fund or share in the ranking, or on its own page. It stays here between sessions, on this computer only.")}</p><a class="btn primary" href="#/ranking">${t("Browse the ranking")}</a></div>`};
 const inChart=W.filter(r=>st.slot[r.sym]<8);
 return {title:t("Watchlist"),sub:t("Follow the funds and shares you care about, and compare them side by side."),
  html:`<section class="panel"><div class="sec-head"><h2>${t("Growth of 100 kr, compared")}</h2><p class="sub">${t("Each line starts at 100 kr on the first date all of them share, in SEK with dividends reinvested. Hover to compare any week.")}</p></div>
   <div class="chartbox" id="cmpBox"><svg id="cmpSvg" role="img" aria-label="${t("Growth of 100 kr for each fund on the watchlist")}"></svg></div>
   <div class="legend">${inChart.map(r=>`<span><i class="ln" style="background:var(--c${st.slot[r.sym]+1})"></i>${esc(short(r.name))}</span>`).join("")}</div>
   ${W.length>inChart.length?`<p class="sub">${t("The chart has room for 8 lines. Remove a fund to make room for the others.")}</p>`:""}</section>
  <div class="tbl-wrap"><table><thead><tr><th class="c-star"></th><th>${t("Name")}</th><th>${t("Risk level")}</th><th class="n">${t("Avg per year")}</th><th class="n">${t("Last 12 mo")}</th><th class="n">${t("Last 3 mo")}</th><th class="n">${t("Biggest drop")}</th><th class="n">${t("Reward for risk")}</th></tr></thead><tbody>
   ${W.map(r=>`<tr class="link" data-href="${fundHref(r.sym)}" tabindex="0"><td class="c-star">${starBtn(r.sym)}</td>
    <td><div class="nm" style="display:flex;align-items:center">${st.slot[r.sym]<8?`<i class="sw" style="background:var(--c${st.slot[r.sym]+1})"></i>`:""}${esc(r.name)}</div><div class="sub">${esc(t(r.group))}${where(r)}</div></td>
    <td>${riskPill(r.srri)}</td><td class="n ${r.cagr<0?"neg":""}">${pct(r.cagr)}</td><td class="n ${r.r1<0?"neg":""}">${pct(r.r1)}</td><td class="n ${r.r3m<0?"neg":""}">${pct(r.r3m)}</td><td class="n">${drop(r.mdd)}</td><td class="n">${num(r.sharpe,2)}</td></tr>`).join("")}
  </tbody></table></div>
  ${missing?`<p class="sub">${t("{n} starred holdings are no longer in the tracked data and are hidden.",{n:missing})}</p>`:""}`,
  after(){chart(()=>drawCompare(inChart))}};
}
function drawCompare(list){
 const box=$("cmpBox"),svg=$("cmpSvg");if(!box||!list.length)return;
 const W=boxW("cmpBox"),label=list.length<=4,H=Math.round(Math.min(400,Math.max(260,W*.4))),P={l:48,r:label?170:16,t:14,b:30},w=W-P.l-P.r,h=H-P.t-P.b;
 const t0=Math.max(...list.map(r=>+new Date(r.d[0]))),t1=Math.max(...list.map(r=>+new Date(r.d[r.d.length-1])));
 const ser=list.map(r=>{const i0=Math.max(0,r.d.findIndex(d=>+new Date(d)>=t0)),base=r.p[i0],pts=[];for(let i=i0;i<r.p.length;i++)pts.push([+new Date(r.d[i]),r.p[i]/base*100]);return {r,c:`var(--c${st.slot[r.sym]+1})`,pts}});
 const all=ser.flatMap(s=>s.pts.map(p=>p[1])),mn=Math.min(100,...all),mx=Math.max(100,...all);
 const X=tm=>P.l+(tm-t0)/(t1-t0||1)*w,Y=v=>P.t+h-(v-mn)/(mx-mn||1)*h;
 const step=niceStep((mx-mn)/5);let g="";
 for(let v=Math.ceil(mn/step)*step;v<=mx;v+=step)g+=`<line x1="${P.l}" x2="${P.l+w}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${P.l-8}" y="${Y(v)+4}" text-anchor="end">${Math.round(v)}</text>`;
 let yl="";for(let y=new Date(t0).getFullYear()+1;y<=new Date(t1).getFullYear();y++){const x=X(+new Date(y,0,1));if(x>P.l+20&&x<P.l+w-20)yl+=`<text x="${x}" y="${H-6}" text-anchor="middle">${y}</text>`}
 // direct labels at line ends (≤4 series), nudged apart so they never overlap; text stays in ink, the line carries the colour
 let labels="";
 if(label){const ends=ser.map(s=>({s,y:Y(s.pts[s.pts.length-1][1])})).sort((a,b)=>a.y-b.y);
  for(let i=1;i<ends.length;i++)if(ends[i].y-ends[i-1].y<18)ends[i].y=ends[i-1].y+18;
  labels=ends.map(e=>{const v=e.s.pts[e.s.pts.length-1][1];return `<text x="${P.l+w+10}" y="${e.y+4}" style="fill:var(--ink);font-weight:600">${esc(short(e.s.r.name).slice(0,20))} <tspan style="fill:var(--muted);font-weight:400">${Math.round(v)}</tspan></text>`}).join("")}
 svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
 svg.innerHTML=`<g class="grid">${g}</g>${yl}<line x1="${P.l}" x2="${P.l+w}" y1="${Y(100)}" y2="${Y(100)}" stroke="var(--muted)" stroke-dasharray="4 4"/>
  ${ser.map(s=>`<path d="${s.pts.map((p,i)=>(i?"L":"M")+X(p[0]).toFixed(1)+","+Y(p[1]).toFixed(1)).join("")}" fill="none" stroke="${s.c}" stroke-width="2" stroke-linejoin="round"/>`).join("")}
  ${ser.map(s=>{const p=s.pts[s.pts.length-1];return `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="4" fill="${s.c}" stroke="var(--surface)" stroke-width="2"/>`}).join("")}
  ${labels}<line id="cX" y1="${P.t}" y2="${P.t+h}" stroke="var(--muted)" stroke-dasharray="3 3" visibility="hidden"/><g id="cDots"></g>
  <rect id="cHit" x="${P.l}" y="${P.t}" width="${w}" height="${h}" fill="transparent"/>`;
 const tip=tipper(box);tip.className="tip list";tip.hidden=true;
 const near=(pts,tm)=>{let lo=0,hi=pts.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(pts[m][0]<=tm)lo=m;else hi=m-1}return pts[lo]};
 const move=e=>{const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const l=pt.matrixTransform(svg.getScreenCTM().inverse());
  const tm=t0+(Math.max(P.l,Math.min(P.l+w,l.x))-P.l)/w*(t1-t0),x=X(tm),vals=ser.map(s=>({s,p:near(s.pts,tm)})).sort((a,b)=>b.p[1]-a.p[1]);
  $("cX").setAttribute("x1",x);$("cX").setAttribute("x2",x);$("cX").setAttribute("visibility","visible");
  $("cDots").innerHTML=vals.map(v=>`<circle cx="${X(v.p[0])}" cy="${Y(v.p[1])}" r="4.5" fill="${v.s.c}" stroke="var(--surface)" stroke-width="2"/>`).join("");
  const day=new Date(vals[0].p[0]).toLocaleDateString(loc(),{dateStyle:"medium"});
  tip.innerHTML=`<span class="h">${day}</span>${vals.map(v=>`<div><span class="sw" style="background:${v.s.c};margin:0"></span><span>${esc(short(v.s.r.name))}</span><span>${Math.round(v.p[1])} kr</span></div>`).join("")}`;
  const sc=svg.getBoundingClientRect().width/W;tip.style.left=x*sc+"px";tip.style.top=(P.t+h/2)*sc+"px";tip.classList.toggle("flip",x>W/2);tip.hidden=false};
 $("cHit").onpointermove=move;$("cHit").onpointerdown=move;
 $("cHit").onpointerleave=()=>{tip.hidden=true;$("cX").setAttribute("visibility","hidden");$("cDots").innerHTML=""};
}

/* my plan */
function vPlan(){
 return {title:t("My plan"),sub:t("Where the data says to put a lump sum. Enter an amount, when you'll need it and how much risk you'll accept. The app searches mixes of the tracked funds and shares for the one that earned the most over the last 5 years while keeping the whole mix inside your risk level."),
  actions:`<button class="btn primary" id="savePlan">${svgI("bookmark")}${t("Save plan")}</button>`,
  html:`<div class="split"><div class="panel">
    <div class="field"><label for="pAmt">${t("Amount to invest")} <span>kr</span></label><input type="number" id="pAmt" min="1000" step="1000" inputmode="numeric"></div>
    <div class="ctl"><span>${t("When will you need it?")}</span><div class="seg" id="pHz" role="group" aria-label="${t("Time horizon")}"></div></div>
    <div class="field"><label for="pYrs">${t("Years invested")} <span id="pYrsOut"></span></label><input type="range" id="pYrs"></div>
    <div class="field"><label for="pRisk">${t("Risk you're willing to take")} <span id="pRiskOut"></span></label><input type="range" id="pRisk" min="1" max="6" step="1">
     <div class="scalecap" aria-hidden="true"><span>${t("← steadier")}</span><span>${t("more growth, bigger drops →")}</span></div><span class="src" id="pRiskSrc"></span></div>
    <label class="toggle" id="pSharesL"><input type="checkbox" id="pShares"> ${t("Include individual shares")}</label>
   </div><div class="panel" id="report" aria-live="polite"></div></div>`,
  after(){
   const p=st.plan;$("pAmt").value=p.amt;$("pShares").checked=p.pshares;
   seg($("pHz"),Object.fromEntries(Object.keys(PLAN_HZ).map(k=>{const w=tHzT(k);return [k,w[0].toUpperCase()+w.slice(1)]})),p.phz,k=>{p.phz=k;p.pyrs=PLAN_HZ[k].yrs[2];p.prisk=PLAN_HZ[k].risk;save();renderPlan()});
   $("pAmt").oninput=e=>{p.amt=Math.max(0,+e.target.value||0);save();renderPlan()};
   $("pYrs").oninput=e=>{p.pyrs=+e.target.value;save();renderPlan()};
   $("pRisk").oninput=e=>{p.prisk=+e.target.value;save();renderPlan()};
   $("pShares").onchange=e=>{p.pshares=e.target.checked;save();renderPlan()};
   $("savePlan").onclick=()=>{const o=planInputs(p);askName(t("Save this plan"),`${sek(o.amt)} · ${yrs(o.pyrs)} · ${t("risk")} ${o.prisk}`,name=>addSaved(name,"lump",{...o,isk:st.mon.isk}))};
   renderPlan();
  }};
}
function renderPlan(){
 const R=DATA.rates,res=planResult(ROWS,R,st.plan,st.mon.isk),o=res.o;Object.assign(st.plan,{phz:o.phz,prisk:o.prisk,pyrs:o.pyrs});save();
 const hz=PLAN_HZ[o.phz],y=hz.yrs,L=o.prisk,hl=tHzT(o.phz);
 Object.assign($("pYrs"),{min:y[0],max:y[1],value:o.pyrs});$("pYrsOut").textContent=yrs(o.pyrs);
 $("pRisk").value=L;$("pRisk").style.accentColor=`var(--h-${hzOf(L)})`;$("pRiskOut").textContent=`${L} · ${tRisk(L)}`;
 $("pRiskSrc").textContent=t("Yearly swings kept under {b}.",{b:pctA(BANDS[L-1])})+" "+(L>hz.risk?t("That's above the usual level {u} for money needed in {h}: a bad year near the end could force you to sell at a loss.",{u:hz.risk,h:hl})
  :L<hz.risk?t("That's below the usual level {u} for {h}: steadier, but likely less growth.",{u:hz.risk,h:hl}):t("That's the usual level for money needed in {h}.",{h:hl}));
 $("pShares").disabled=!o.sharesOk;$("pSharesL").style.opacity=o.sharesOk?1:.5;$("pSharesL").title=o.sharesOk?"":t("Individual shares are only used at risk level 5 or higher");
 if(!res.plan){$("report").innerHTML=`<div class="empty">${t("No tracked instrument beat T-bills over the last 5 years at this risk level, so the data points to a savings account.")}</div>`;return}
 const {plan,A,N,mid,lo,hi,rep,lvl,m}=res,hold=plan.hold,col=h=>`var(--h-${h.hz})`;
 const opac=(()=>{const seen={};return h=>{seen[h.hz]=(seen[h.hz]||0)+1;return [1,.78,.6,.45,.35][Math.min(4,seen[h.hz]-1)]}})();
 const segs=hold.map(h=>({h,o:opac(h)}));
 const role=h=>h.group==="Cash"?t("Holds the mix inside its risk limit"):h.srri<=4?t("Steadies the mix"):t("Drives growth");
 const hname=h=>h.group==="Cash"?t(h.name):h.name;
 $("report").innerHTML=`
  <div class="hero"><span class="lbl">${t("{a} for {n} · risk level {l} chosen · cautious estimate",{a:sek(A),n:yrs(N),l:L})}</span>
   <span class="big">${sek(mid)}</span>
   <span class="rng">${t("Likely range <b>{lo} – {hi}</b>. If the last 5 years repeated: <b>{rep}</b>.",{lo:sek(lo),hi:sek(hi),rep:sek(rep)})}</span></div>
  <dl class="kpis">
   <div class="kpi"><dt>${t("Risk level of this mix")}</dt><dd>${riskPill(lvl)}</dd></div>
   <div class="kpi"><dt>${t("Average a year, last 5 years")}</dt><dd class="${m.cagr<0?"neg":""}">${pct(m.cagr)}</dd></div>
   <div class="kpi"><dt>${t("Biggest drop, last 5 years")}</dt><dd class="neg">${drop(m.mdd)} ≈ ${sek(A*m.mdd/100)}</dd></div>
   <div class="kpi"><dt>${t("Reward for risk")}</dt><dd>${num(m.sharpe,2)}</dd></div></dl>
  <div style="display:grid;gap:10px"><h3>${t("How the data splits {a}",{a:sek(A)})}</h3>
   <div class="alloc" aria-hidden="true">${segs.map(({h,o})=>`<span style="flex-grow:${h.w};background:${col(h)};opacity:${o}">${h.w>=.1?Math.round(h.w*100)+"%":""}</span>`).join("")}</div>
   <p class="sub">${t("Listed in Sweden: <b>{p}</b> of this mix (limit 20%). Sweden is about 1% of the world stock market.",{p:Math.round(seWeight(hold)*100)+"%"})}</p></div>
  <div class="tbl-wrap"><table><thead><tr><th>${t("Holding")}</th><th class="n">${t("Share")}</th><th class="n">${t("Amount")}</th><th>${t("Risk level")}</th><th class="n">${t("Reward for risk")}</th><th>${t("Role")}</th></tr></thead><tbody>
   ${segs.map(({h,o})=>`<tr${h.group!=="Cash"?` class="link" data-href="${fundHref(h.sym)}" tabindex="0"`:""}><td><div class="nm" style="display:flex;align-items:center"><i class="sw" style="background:${col(h)};opacity:${o}"></i>${esc(hname(h))}</div><div class="sub">${esc(t(h.group))}${h.group!=="Cash"?where(h)+" · "+t("ticker")+" "+esc(ticker(h.sym))+(h.cur!=="SEK"?" ("+t("trades in {c}",{c:esc(h.cur)})+")":""):""}</div></td>
    <td class="n">${Math.round(h.w*100)}%</td><td class="n">${sek(A*h.w)}</td><td>${riskPill(h.srri)}</td><td class="n">${h.group==="Cash"?"–":num(h.sharpe,2)}</td><td>${role(h)}</td></tr>`).join("")}
  </tbody></table></div>
  <div style="display:grid;gap:8px"><h3>${t("What this mix would have done over the last 5 years")}</h3>
   <div class="chartbox" id="pBox"><svg id="pSvg" role="img" aria-label="${t("Value of the plan over the last 5 years compared with cash")}"></svg></div>
   <div class="legend"><span><i style="background:var(--accent)"></i>${t("This mix")}</span><span><i style="background:var(--muted);height:3px;vertical-align:3px"></i>${t("Cash at the T-bill rate")}</span></div></div>
  <div class="callout"><b>${t("Things the data can't tell you")}</b><span class="sub">${t("This mix is the best fit for the last 5 years, which had no crash as deep as 2008 (global stocks fell about 40% in SEK). A different 5 years would give a different mix. Funds can overlap: Nasdaq 100, S&P 500 and World IT all hold the same big US tech companies, so a mix of them is less spread out than it looks. Keep an emergency buffer in a savings account first. Hold everything in an ISK to avoid tax on gains. All of these can be bought at Avanza or Nordnet by searching for the ticker.")}</span></div>
  <details class="more"><summary>${t("How this plan was built")}</summary><ol class="method">
   <li>${t("<b>Universe:</b> {g}, Swedish and worldwide, that beat Swedish T-bills over 5 years ({n} used, best first), plus cash. Investment companies and individual shares only enter at risk level 5 or higher.",{g:planGroups(L,o.sharesOk&&o.pshares).map(x=>t(GROUPS_PL[x]).toLowerCase()).join(", "),n:plan.cand})}</li>
   <li>${t("<b>Goal:</b> the highest average return the whole mix earned, with its yearly swings kept under {c}. That holds it at your chosen risk level {l} or lower. Swings are measured with each pair's co-movement in weekly SEK prices. This is target-risk mean-variance optimisation, the standard method behind risk-profiled model portfolios.",{c:pcf(volCap(L),1),l:L})}</li>
   <li>${t("<b>Spread limits:</b> at most 30% in any one fund and 10% in any single share. Investment companies are limited to 15% combined, because they hold many of the same companies. Swedish-listed holdings are limited to 20% combined, so a home-market category can't dominate the mix. All in 5% steps.")}</li>
   <li>${t("<b>Cautious estimate:</b> instead of repeating the last 5 years, it assumes cash earns today's T-bill rate ({tb}), bond funds today's 5-year government yield ({g5}) and stocks 7% a year. The range is ±1 standard deviation of the mix's measured swings over {n}. ISK tax is deducted on the balance above 300 000 kr. Fund fees are not deducted.",{tb:pcf(R.tbill3m,2),g5:pcf(R.gov5y,2),n:yrs(N)})}</li>
  </ol></details>
  <div><button class="btn" id="copyPlan">${svgI("copy")}${t("Copy report as text")}</button> <span class="sub" id="copyMsg"></span></div>`;
 REDRAW=[()=>drawPlanChart(plan,A)];drawPlanChart(plan,A);
 $("copyPlan").onclick=()=>{const g=new Date(DATA.generated);
  const txt=[t("Sparplan report ({d})",{d:g.toLocaleString(loc(),{dateStyle:"medium",timeStyle:"short"})}),t("{a} for {n}, needed in {h}, chosen risk level {l}",{a:sek(A),n:yrs(N),h:hl,l:L}),
   t("Risk level {l} ({w}). Cautious estimate {m}, range {lo}–{hi}.",{l:lvl,w:tRisk(lvl),m:sek(mid),lo:sek(lo),hi:sek(hi)}),t("Last 5 years: {c} a year, biggest drop {d}.",{c:pct(m.cagr),d:drop(m.mdd)}),"",
   ...hold.map(h=>`${Math.round(h.w*100)}%  ${sek(A*h.w)}  ${hname(h)}${h.group!=="Cash"?" ("+h.sym+")":""}`),"",t("Based on past data only. Not financial advice.")].join("\n");
  const msg=$("copyMsg");navigator.clipboard.writeText(txt).then(()=>msg.textContent=t("Copied."),()=>msg.textContent=t("Copy didn't work here. Select the table text instead."))};
}
function drawPlanChart(P,amt){
 const box=$("pBox");if(!box)return;
 const W=boxW("pBox"),H=Math.round(Math.min(260,Math.max(200,W*.4))),pd={l:44,r:12,t:12,b:28},w=W-pd.l-pd.r,h=H-pd.t-pd.b,n=P.p.length;
 const all=P.p.concat(P.cash),mn=Math.min(...all),mx=Math.max(...all),X=i=>pd.l+i/(n-1)*w,Y=v=>pd.t+h-(v-mn)/(mx-mn||1)*h;
 const step=niceStep((mx-mn)/4);let g="";
 for(let v=Math.ceil(mn/step)*step;v<=mx;v+=step)g+=`<line x1="${pd.l}" x2="${W-pd.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${pd.l-8}" y="${Y(v)+4}" text-anchor="end">${Math.round(v)}</text>`;
 const path=a=>a.map((v,i)=>(i?"L":"M")+X(i).toFixed(1)+","+Y(v).toFixed(1)).join("");
 const svg=$("pSvg");svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
 svg.innerHTML=`<g class="grid">${g}</g>${yearTicks(P.d,X,n,H)}<path d="${path(P.cash)}" fill="none" stroke="var(--muted)" stroke-dasharray="4 4" stroke-width="1.5"/>
  <path d="${path(P.p)}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${X(n-1)}" cy="${Y(P.p[n-1])}" r="4.5" fill="var(--accent)"/>
  <line id="pX" y1="${pd.t}" y2="${pd.t+h}" stroke="var(--muted)" stroke-dasharray="3 3" visibility="hidden"/><rect id="pHit" x="${pd.l}" y="${pd.t}" width="${w}" height="${h}" fill="transparent"/>`;
 const tip=tipper(box),ln=$("pX");tip.hidden=true;
 const move=e=>{const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const l=pt.matrixTransform(svg.getScreenCTM().inverse());
  const i=Math.max(0,Math.min(n-1,Math.round((l.x-pd.l)/w*(n-1))));ln.setAttribute("x1",X(i));ln.setAttribute("x2",X(i));ln.setAttribute("visibility","visible");
  const sc=svg.getBoundingClientRect().width/W;
  tip.textContent=`${P.d[i]} · ${sek(amt*P.p[i]/100)}`;tip.style.left=Math.min(box.clientWidth-90,Math.max(90,X(i)*sc))+"px";tip.style.top=(Y(P.p[i])*sc)+"px";tip.hidden=false};
 $("pHit").onpointermove=move;$("pHit").onpointerdown=move;$("pHit").onpointerleave=()=>{tip.hidden=true;ln.setAttribute("visibility","hidden")};
}

/* monthly saving */
const MON_IDS={monthly:"monthly",start:"start",years:"years",sStocks:"sstocks",fee:"fee",isk:"isk"};
function vMonthly(){
 return {title:t("Monthly saving"),sub:t("Choose how much you save each month and how to split it between stocks and bonds. Inside each part, the funds are picked by the data: the combination with the best reward for risk over the last 5 years."),
  actions:`<button class="btn primary" id="saveMon">${svgI("bookmark")}${t("Save plan")}</button>`,
  html:`<div class="split"><div class="panel">
    <div class="field"><label for="monthly">${t("Monthly saving")} <span>kr</span></label><input type="number" id="monthly" min="0" step="100" inputmode="numeric"></div>
    <div class="field"><label for="start">${t("Already saved, to invest now")} <span>kr</span></label><input type="number" id="start" min="0" step="1000" inputmode="numeric"></div>
    <div class="field"><label for="years">${t("Years of saving")} <span id="yearsOut"></span></label><input type="range" id="years" min="1" max="40"></div>
    <div class="mix">
     <div class="mixbar" id="mixbar" aria-hidden="true"><span style="background:var(--h-long)"></span><span style="background:var(--h-medium)"></span></div>
     <div class="field"><label for="sStocks"><span style="color:var(--ink)">${t("Stocks and bonds")}</span><span id="splitOut"></span></label><input type="range" id="sStocks" min="0" max="100" step="5">
      <div class="scalecap" aria-hidden="true"><span>${t("← all bonds")}</span><span>${t("all stocks →")}</span></div></div>
     <span class="src" id="splitRisk"></span></div>
    <details class="more"><summary>${t("Fees and tax")}</summary><div style="display:grid;gap:16px">
     <div class="field"><label for="fee">${t("Fund fees")} <span id="feeOut"></span></label><input type="range" id="fee" min="0" max="1" step="0.05"><span class="src">${t("Index ETFs like these typically charge 0.05–0.4% a year.")}</span></div>
     <div class="field"><label for="isk">${t("ISK flat tax")} <span id="iskOut"></span></label><input type="range" id="isk" min="0" max="2" step="0.05"><span class="src">${t("Charged on the balance above 300 000 kr, the 2026 tax-free level.")}</span></div>
    </div></details>
   </div><div class="panel">
    <div class="hero" id="hero" aria-live="polite"></div>
    <dl class="kpis" id="kpis"></dl>
    <div style="display:grid;gap:10px"><h3 id="monthHead"></h3>
     <div class="tbl-wrap"><table id="monthTbl"><thead><tr><th>${t("Fund")}</th><th>${t("Part")}</th><th class="n">${t("Share")}</th><th class="n">${t("Each month")}</th><th>${t("Risk level")}</th><th class="n">${t("Reward for risk")}</th></tr></thead><tbody></tbody></table></div><p class="sub" id="seShare"></p></div>
    <div class="callout" id="backtest"></div>
    <div style="display:grid;gap:8px"><h3>${t("Looking ahead")}</h3>
     <div class="chartbox" id="chartBox"><svg id="chart" role="img" aria-label="${t("Projected balance over time")}"></svg></div>
     <div class="legend"><span><i style="background:var(--accent)"></i>${t("Cautious estimate")}</span><span><i style="background:var(--accent-soft);box-shadow:inset 0 0 0 1px var(--accent)"></i>${t("Likely range")}</span><span><i style="background:var(--muted);height:3px;vertical-align:3px"></i>${t("What you paid in")}</span></div></div>
    <details class="more"><summary>${t("How the funds were picked")}</summary><ol class="method" id="simMethod"></ol></details>
    <p class="sub">${t("Past results are not a forecast. The last 5 years had no crash as deep as 2008, when global stocks fell about 40% in SEK, so a real bad year could be worse than shown.")}</p>
   </div></div>`,
  after(){
   Object.entries(MON_IDS).forEach(([id,k])=>{$(id).value=st.mon[k];$(id).oninput=e=>{st.mon[k]=Math.max(0,+e.target.value||0);calcMonthly()}});
   $("saveMon").onclick=()=>askName(t("Save this plan"),`${sek(st.mon.monthly)} ${t("a month")} · ${yrs(st.mon.years)} · ${st.mon.sstocks}% ${t("stocks")}`,name=>addSaved(name,"monthly",{...st.mon}));
   calcMonthly();
  }};
}
function calcMonthly(){
 const R=DATA.rates,S=sleeves(),inp=st.mon,M=inp.monthly,res=monthlyResult(S,R,inp),{hold,d,m,lvl,V,paid,mid,lo,hi,end,rep}=res;
 $("yearsOut").textContent=yrs(inp.years);
 $("splitOut").textContent=t("{s}% stocks · {b}% bonds",{s:inp.sstocks,b:100-inp.sstocks});
 $("feeOut").textContent=t("{v} a year",{v:pcf(+inp.fee,2)});$("iskOut").textContent=t("{v} a year",{v:pcf(+inp.isk,2)});
 const sp=$("mixbar").children;sp[0].style.flexGrow=inp.sstocks;sp[1].style.flexGrow=100-inp.sstocks;
 $("splitRisk").innerHTML=t("This split measured <b>{v}</b> swings a year over 5 years: risk level <b>{l} · {w}</b>, usually suited to money needed in {h}.",{v:pcf(m.vol,1),l:lvl,w:tRisk(lvl),h:tHzT(hzOf(lvl))});
 $("hero").innerHTML=`<span class="lbl">${t("{m} a month for {n} · cautious estimate",{m:sek(M),n:yrs(inp.years)})}</span><span class="big">${sek(end.bal)}</span>
  <span class="rng">${t("Likely range <b>{lo} – {hi}</b>. If the last 5 years repeated: <b>{rep}</b>.",{lo:sek(lo.at(-1).bal),hi:sek(hi.at(-1).bal),rep:sek(rep)})}</span>`;
 $("kpis").innerHTML=`<div class="kpi"><dt>${t("You pay in")}</dt><dd>${sek(end.paid)}</dd></div>
  <div class="kpi"><dt>${t("Risk level of this mix")}</dt><dd>${riskPill(lvl)}</dd></div>
  <div class="kpi"><dt>${t("Biggest drop, last 5 years")}</dt><dd class="neg">${drop(m.mdd)}</dd></div>
  <div class="kpi"><dt>${t("Worst 12 months at the end")}</dt><dd class="neg">${pct(m.worst,0)} ≈ ${sek(end.bal*m.worst/100)}</dd></div>`;
 $("monthHead").textContent=t("Each month, put {m} into",{m:sek(M)});
 $("monthTbl").tBodies[0].innerHTML=hold.map(h=>`<tr class="link" data-href="${fundHref(h.sym)}" tabindex="0"><td><div class="nm" style="display:flex;align-items:center"><i class="sw" style="background:var(--h-${h.part==="Stocks"?"long":"medium"})"></i>${esc(h.name)}</div><div class="sub">${esc(t(h.group))}${where(h)} · ${t("ticker")} ${esc(ticker(h.sym))}${h.cur!=="SEK"?" ("+t("trades in {c}",{c:esc(h.cur)})+")":""}</div></td>
   <td>${t(h.part)}</td><td class="n">${Math.round(h.w*100)}%</td><td class="n">${sek(M*h.w)}</td><td>${riskPill(h.srri)}</td><td class="n">${num(h.sharpe,2)}</td></tr>`).join("");
 $("seShare").innerHTML=t("Listed in Sweden: <b>{p}</b> of this mix (limit 20% of each part). Sweden is about 1% of the world stock market.",{p:Math.round(seWeight(hold)*100)+"%"});
 $("backtest").innerHTML=`<b>${t("Tested on real prices")}</b><span class="sub">${t("Saving {m} a month into exactly this mix from {d}{x} would have meant paying in <b>{p}</b>. Today it would be worth <b>{v}</b> ({c}), before fees and tax.",{m:sek(M),d:esc(d[0]),x:inp.start?t(", plus {s} at the start,",{s:sek(inp.start)}):"",p:sek(paid),v:sek(V),c:pct((V/paid-1)*100)})}</span>`;
 $("simMethod").innerHTML=`<li>${t("<b>Your choice:</b> the split between stocks and bonds. Everything else comes from the data.")}</li>
  <li>${t("<b>Stock part:</b> index funds and investment companies, Swedish and worldwide, that beat Swedish T-bills over 5 years ({n} did, best 12 used).",{n:S.s.qualified})}</li>
  <li>${t("<b>Bond part:</b> bond funds that beat T-bills over 5 years ({n} did{x}).",{n:S.b.qualified,x:S.b.qualified<3?t(", so the best 3 overall were used"):""})}</li>
  <li>${t("<b>Picking inside each part:</b> the combination with the highest reward for risk (Sharpe ratio), using each pair's co-movement in weekly SEK prices. At most 30% of a part in one fund, 15% in investment companies combined and 20% in Swedish-listed holdings combined, in 5% steps. The per-fund limit is loosened only when too few funds qualify.")}</li>
  <li>${t("<b>Looking ahead:</b> bonds earn today's 5-year Swedish government yield ({g5}) and stocks 7% a year, the common long-run figure, minus fees. The range is ±1 standard deviation of this mix's measured swings. ISK tax is taken on the balance above 300 000 kr.",{g5:pcf(R.gov5y,2)})}</li>`;
 REDRAW=[()=>drawSimChart(lo,mid,hi)];drawSimChart(lo,mid,hi);save();
}
function fmtK(v){return v>=1e6?(v/1e6).toLocaleString(loc(),{maximumFractionDigits:v%1e6?1:0})+" M":v>=1e3?Math.round(v/1e3)+" k":"0"}
function drawSimChart(lo,mid,hi){const W0=boxW("chartBox"),H0=Math.round(Math.min(300,Math.max(220,W0*.42))),p={l:52,r:14,t:14,b:30},w=W0-p.l-p.r,h=H0-p.t-p.b,n=mid.length-1;
 const max=Math.max(...hi.map(x=>x.bal))*1.05||1,X=i=>p.l+(n?i/n*w:0),Y=v=>p.t+h-v/max*h,step=niceStep(max/4);let g="";
 for(let v=0;v<=max;v+=step)g+=`<line x1="${p.l}" x2="${W0-p.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${p.l-8}" y="${Y(v)+4}" text-anchor="end">${fmtK(v)}</text>`;
 const xl=[...new Set([0,Math.round(n/4),Math.round(n/2),Math.round(3*n/4),n])].map(i=>`<text x="${X(i)}" y="${H0-8}" text-anchor="middle">${t("year {n}",{n:i})}</text>`).join("");
 const line=(a,k)=>a.map((d,i)=>`${i?"L":"M"}${X(i).toFixed(1)},${Y(d[k]).toFixed(1)}`).join("");
 const bandP=line(hi,"bal")+lo.slice().reverse().map((d,j)=>`L${X(n-j).toFixed(1)},${Y(d.bal).toFixed(1)}`).join("")+"Z";
 const svg=$("chart");svg.setAttribute("viewBox",`0 0 ${W0} ${H0}`);
 svg.innerHTML=`<g class="grid">${g}</g>${xl}<path d="${bandP}" fill="var(--accent-soft)" stroke="var(--accent)" stroke-opacity=".35"/>
  <path d="${line(mid,"paid")}" fill="none" stroke="var(--muted)" stroke-dasharray="4 4" stroke-width="1.5"/>
  <path d="${line(mid,"bal")}" fill="none" stroke="var(--accent)" stroke-width="2.5"/><circle cx="${X(n)}" cy="${Y(mid[n].bal)}" r="4.5" fill="var(--accent)"/>
  <line id="sX" y1="${p.t}" y2="${p.t+h}" stroke="var(--muted)" stroke-dasharray="3 3" visibility="hidden"/>
  <rect id="sHit" x="${p.l}" y="${p.t}" width="${w}" height="${h}" fill="transparent"/>`;
 const box=$("chartBox"),tip=tipper(box),ln=$("sX");tip.hidden=true;
 const move=e=>{const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const l=pt.matrixTransform(svg.getScreenCTM().inverse());
  const i=Math.max(0,Math.min(n,Math.round((l.x-p.l)/w*n)));ln.setAttribute("x1",X(i));ln.setAttribute("x2",X(i));ln.setAttribute("visibility","visible");
  const sc=svg.getBoundingClientRect().width/W0;
  tip.textContent=t("Year {i}: {v} (paid in {p})",{i,v:sek(mid[i].bal),p:sek(mid[i].paid)});
  tip.style.left=Math.min(box.clientWidth-140,Math.max(140,X(i)*sc))+"px";tip.style.top=(Y(mid[i].bal)*sc)+"px";tip.hidden=false};
 $("sHit").onpointermove=move;$("sHit").onpointerdown=move;
 $("sHit").onpointerleave=()=>{tip.hidden=true;ln.setAttribute("visibility","hidden")};
}

/* saved plans: inputs are stored, figures are recalculated with the current data */
function addSaved(name,kind,inp){
 st.plans.push({id:Date.now().toString(36),name:name.slice(0,60),kind,inp,at:new Date().toISOString()});save();counts();
 toast(t("Saved “{n}”. Find it under Saved plans.",{n:name}));
}
function savedResult(p){
 try{if(p.kind==="lump"){const r=planResult(ROWS,DATA.rates,p.inp,p.inp.isk??st.mon.isk);return r.plan?{est:r.mid,lo:r.lo,hi:r.hi,lvl:r.lvl,mdd:r.m.mdd,paid:r.A}:null}
  const r=monthlyResult(sleeves(),DATA.rates,{...DEF.mon,...p.inp});return {est:r.end.bal,lo:r.lo.at(-1).bal,hi:r.hi.at(-1).bal,lvl:r.lvl,mdd:r.m.mdd,paid:r.end.paid}}
 catch(e){return null}
}
function savedWhat(p){const i=p.inp;return p.kind==="lump"?t("{a} lump sum · {n} · risk {l}",{a:sek(i.amt),n:yrs(i.pyrs),l:i.prisk})+(i.pshares&&i.prisk>=5?" · "+t("with shares"):"")
 :t("{m} a month · {n} · {s}% stocks",{m:sek(i.monthly),n:yrs(i.years),s:i.sstocks})+(i.start?" · "+t("{s} to start",{s:sek(i.start)}):"")}
function vSaved(){
 const head={title:t("Saved plans"),sub:t("Your saved plans side by side. The inputs are kept and the figures are recalculated with the latest data, so they can change after each update.")};
 if(!st.plans.length)return {...head,html:`<div class="blank">${svgI("saved")}<h2>${t("No saved plans yet")}</h2><p>${t("Build a plan under My plan or Monthly saving, then press “Save plan” to keep it and compare it with others.")}</p><div style="display:flex;gap:8px"><a class="btn primary" href="#/plan">${t("My plan")}</a><a class="btn" href="#/monthly">${t("Monthly saving")}</a></div></div>`};
 const rows=st.plans.map(p=>({p,r:savedResult(p)}));
 return {...head,
  html:`<div class="tbl-wrap"><table><thead><tr><th>${t("Saved plan")}</th><th class="n">${t("Cautious estimate")}</th><th class="n">${t("Likely range")}</th><th class="n">${t("You pay in")}</th><th>${t("Risk level")}</th><th class="n">${t("Biggest drop, 5 yrs")}</th><th></th></tr></thead><tbody>
   ${rows.map(({p,r})=>`<tr><td class="c-plan"><div class="nm">${esc(p.name)}</div><div class="sub">${p.kind==="lump"?t("My plan"):t("Monthly saving")} · ${savedWhat(p)}</div><div class="sub">${t("Saved {d}",{d:new Date(p.at).toLocaleDateString(loc(),{dateStyle:"medium"})})}</div></td>
    <td class="n">${r?sek(r.est):"–"}</td><td class="n" style="font-weight:400">${r?sek(r.lo)+" – "+sek(r.hi):"–"}</td><td class="n" style="font-weight:400">${r?sek(r.paid):"–"}</td>
    <td>${r?riskPill(r.lvl):"–"}</td><td class="n">${r?drop(r.mdd):"–"}</td>
    <td><div class="rowact"><button class="btn" data-open="${p.id}">${svgI("open")}${t("Open")}</button><button class="btn quiet" data-ren="${p.id}" title="${t("Rename")}" aria-label="${esc(t("Rename")+": "+p.name)}">${svgI("edit")}</button><button class="btn quiet" data-del="${p.id}" title="${t("Delete")}" aria-label="${esc(t("Delete")+": "+p.name)}">${svgI("trash")}</button></div></td></tr>`).join("")}
  </tbody></table></div>
  <p class="sub">${t("Cautious estimate: bonds at today's 5-year government yield, stocks at 7% a year, cash at today's T-bill rate. For a lump sum, “You pay in” is the amount invested.")}</p>`,
  after(){
   const find=id=>st.plans.find(p=>p.id===id);
   $("view").querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{const p=find(b.dataset.open);if(p.kind==="lump"){const {isk,sharesOk,...i}=p.inp;Object.assign(st.plan,i);if(isk!=null)st.mon.isk=isk;save();location.hash="#/plan"}else{Object.assign(st.mon,p.inp);save();location.hash="#/monthly"}});
   $("view").querySelectorAll("[data-ren]").forEach(b=>b.onclick=()=>{const p=find(b.dataset.ren);askName(t("Rename plan"),p.name,n=>{p.name=n.slice(0,60);save();render()})});
   $("view").querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{const i=st.plans.findIndex(p=>p.id===b.dataset.del),[p]=st.plans.splice(i,1);save();counts();render();
    toast(t("Deleted “{n}”.",{n:p.name}),()=>{st.plans.splice(i,0,p);save();counts();render()})});
  }};
}

/* what's moving: insider trades + 3-month momentum */
function vMoving(){
 const mom=ROWS.filter(r=>r.r3m!=null).sort((a,b)=>b.r3m-a.r3m).slice(0,10);
 return {title:t("What's moving"),sub:t("Where company insiders put their own money in the last 30 days, from the public insider registers, and which tracked funds and shares rose most recently. Neither predicts the future. Insiders can be wrong, and a rise can reverse."),
  html:`<div class="cols">
   <section class="panel"><div style="display:grid;gap:8px"><h2>${t("What insiders are doing")}</h2><div class="seg" id="insSeg" role="group" aria-label="${t("Country")}" hidden></div><span class="sub" id="insFrom"></span></div>
    <div class="tbl-wrap"><table id="insTbl"><thead><tr><th>${t("Company")}</th><th class="n">${t("Net bought")}</th><th class="n">${t("Insiders buying")}</th></tr></thead><tbody></tbody></table></div>
    <p class="sub" id="insSells"></p><p class="sub" id="insSrc"></p></section>
   <section class="panel"><h2>${t("Rising most, last 3 months")}</h2>
    <div class="tbl-wrap"><table><thead><tr><th>${t("Name")}</th><th class="n">${t("3 months")}</th><th class="n">${t("12 months")}</th><th>${t("Risk level")}</th></tr></thead><tbody>
     ${mom.map(r=>`<tr class="link" data-href="${fundHref(r.sym)}" tabindex="0"><td><div class="nm">${esc(r.name)}</div><div class="sub">${esc(t(r.group))}${where(r)}</div></td>
      <td class="n ${r.r3m<0?"neg":""}">${pct(r.r3m)}</td><td class="n ${r.r1<0?"neg":""}">${pct(r.r1)}</td><td>${riskPill(r.srri)}</td></tr>`).join("")}</tbody></table></div>
    <p class="sub">${t("From the same price data as the rest of the app, in SEK, with dividends included.")}</p></section></div>`,
  after:renderInsiders};
}
function renderInsiders(){
 const mkr=v=>{const a=Math.abs(v);return (v<0?"−":"")+(a>=1e6?(a/1e6).toLocaleString(loc(),{maximumFractionDigits:a>=1e8?0:1})+" M kr":sek(a))};
 const US=DATA.usInsiders&&DATA.usInsiders.companies&&DATA.usInsiders.companies.length?DATA.usInsiders:null, SE=DATA.insiders&&DATA.insiders.buys?DATA.insiders:null;
 const row=(name,sub,b,href)=>`<tr${href?` class="link" data-href="${href}" tabindex="0"`:""}><td><div class="nm">${esc(name)}</div>${sub?`<div class="sub">${sub}</div>`:""}</td>
  <td class="n ${b.net<0?"neg":""}">${mkr(b.net)}</td><td class="n">${+b.nb||0}${b.ns?` <span class="sub">(${t("{n} selling",{n:+b.ns||0})})</span>`:""}</td></tr>`;
 const first=s=>s.toLowerCase().split(/[\s(]/)[0];
 const show=c=>{
  if(c==="us"){const nm=s=>(BY[s]||{name:s}).name,rows=US.companies.filter(b=>b.buy||b.sell).sort((a,b)=>b.buy-a.buy||b.net-a.net),quiet=US.companies.filter(b=>!b.buy&&!b.sell);
   $("insFrom").textContent=t("United States · {f} to {to} · {n} insider reports for the {c} tracked US companies",{f:US.from,to:US.to,n:US.filings,c:US.companies.length});
   $("insTbl").tBodies[0].innerHTML=rows.map(b=>{const m=BY[b.sym];return row(m?m.name:b.sym,m?t("{p} in 3 months",{p:pct(m.r3m)}):"",b,m?fundHref(m.sym):null)}).join("");
   $("insSells").textContent=quiet.length?t("No open-market insider trades: {l}.",{l:quiet.map(b=>short(nm(b.sym))).join(", ")}):"";
   $("insSrc").textContent=t("Source: SEC Form 4 filings. Insiders at large US companies mostly sell, for pay and diversification, so a purchase is rarer and says more. Covers open-market purchases and sales only. Foreign companies with US listings, such as TSMC and Toyota, don't file these reports.");return}
  const match=co=>ROWS.find(r=>r.cur==="SEK"&&first(r.name)===first(co)); // first-word name match, as on the page
  $("insFrom").textContent=t("Sweden · {f} to {to} · {n} reported trades, all listed companies",{f:SE.from,to:SE.to,n:SE.trades});
  $("insTbl").tBodies[0].innerHTML=SE.buys.map(b=>{const m=match(b.co);return row(b.co,m?t("Tracked here as {n} · {p} in 3 months",{n:esc(short(m.name)),p:pct(m.r3m)}):"",b,m?fundHref(m.sym):null)}).join("");
  $("insSells").textContent=SE.sells&&SE.sells.length?t("Most net selling: {l}.",{l:SE.sells.slice(0,3).map(s=>`${s.co} (${mkr(-s.net)})`).join(", ")}):"";
  $("insSrc").textContent=t("Source: Finansinspektionen's insider register (insynsregistret). Counts only open-market share trades in SEK. Share-programme grants are excluded. One large buyer, such as a holding company, can dominate the amount, so check how many insiders are buying.");
 };
 if(!US&&!SE){$("insTbl").tBodies[0].innerHTML=`<tr><td colspan="3" class="empty">${t("Insider data did not load in the last refresh.")}</td></tr>`;return}
 const opts=Object.fromEntries([US&&["us",t("United States")],SE&&["se",t("Sweden")]].filter(Boolean)),el=$("insSeg");
 if(!opts[st.ins])st.ins=Object.keys(opts)[0];
 el.hidden=Object.keys(opts).length<2;seg(el,opts,st.ins,k=>{st.ins=k;save();show(k)});show(st.ins);
}

/* risk map */
function vMap(){
 return {title:t("Risk map"),sub:t("Did more risk pay off? Further right means bumpier, higher up means more return per year. The best spots are toward the top left. Click a dot to open it; ringed dots are on your watchlist."),
  html:`<section class="panel"><div class="chartbox" id="scatterBox"><svg id="scatter" role="img" aria-label="${t("Average return per year against yearly swings for each instrument")}"></svg></div>
   <div class="legend"><span><i style="background:var(--h-short)"></i>${t("Short term · risk 1–2")}</span><span><i style="background:var(--h-medium)"></i>${t("Medium term · risk 3–4")}</span><span><i style="background:var(--h-long)"></i>${t("Long term · risk 5–7")}</span><span><i style="background:none;box-shadow:inset 0 0 0 2px var(--ink);border-radius:50%"></i>${t("On your watchlist")}</span></div></section>`,
  after(){chart(renderScatter)}};
}
function renderScatter(){
 const W=boxW("scatterBox"),H=Math.round(Math.min(560,Math.max(380,W*.5))),P={l:56,r:14,t:30,b:50},w=W-P.l-P.r,h=H-P.t-P.b;
 const svg=$("scatter");svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
 const vmax=Math.max(40,...ROWS.map(r=>r.vol))*1.05, X=v=>P.l+Math.sqrt(v/vmax)*w;
 const ys=ROWS.map(r=>r.cagr),ymin=Math.min(-5,...ys)-2,ymax=Math.max(10,...ys)+2,Y=v=>P.t+h-(v-ymin)/(ymax-ymin)*h;
 const edges=[0,...BANDS,vmax];let s="";
 [["short",0,2],["medium",2,10],["long",10,vmax]].forEach(([z,a,b])=>s+=`<rect x="${X(a)}" y="${P.t}" width="${X(b)-X(a)}" height="${h}" fill="var(--h-${z}-soft)"/>
  <text x="${X(a)+6}" y="${P.t+18}" style="fill:var(--h-${z});font-weight:700">${t({short:"Short",medium:"Medium",long:"Long"}[z])}</text>`);
 BANDS.forEach(b=>s+=`<line x1="${X(b)}" x2="${X(b)}" y1="${P.t-16}" y2="${P.t+h}" stroke="var(--line-strong)" stroke-dasharray="2 3"/>`);
 for(let i=0;i<7;i++)s+=`<text x="${(X(edges[i])+X(edges[i+1]))/2}" y="${P.t-8}" text-anchor="middle" style="font-weight:700;fill:var(--ink)">${i+1}</text>`;
 const step=niceStep((ymax-ymin)/5);let g="";
 for(let v=Math.ceil(ymin/step)*step;v<=ymax;v+=step)g+=`<line x1="${P.l}" x2="${W-P.r}" y1="${Y(v)}" y2="${Y(v)}"${Math.abs(v)<1e-9?' style="stroke:var(--muted)"':""}/><text x="${P.l-8}" y="${Y(v)+4}" text-anchor="end">${v>0?"+":""}${v}${PC()}</text>`;
 [2,5,10,15,25,40].filter(v=>v<vmax).forEach(v=>g+=`<text x="${X(v)}" y="${H-P.b+18}" text-anchor="middle">${v}${PC()}</text>`);
 const W8=new Set(st.watch),order=ROWS.slice().sort((a,b)=>W8.has(a.sym)-W8.has(b.sym));
 const dots=order.map(r=>{const cx=X(r.vol),cy=Y(r.cagr),on=W8.has(r.sym);
  return `<a href="${fundHref(r.sym)}" class="dot" data-s="${esc(r.sym)}" aria-label="${esc(r.name)}"><circle cx="${cx}" cy="${cy}" r="14" fill="transparent"/>
  <circle cx="${cx}" cy="${cy}" r="${on?7:5.5}" fill="var(--h-${r.hz})" stroke="${on?"var(--ink)":"var(--surface)"}" stroke-width="2"/></a>`}).join("");
 svg.innerHTML=`${s}<g class="grid">${g}</g><text x="${P.l+w/2}" y="${H-10}" text-anchor="middle">${t("Swings per year →")}</text>
  <text transform="rotate(-90)" x="${-(P.t+h/2)}" y="14" text-anchor="middle">${t("Average return per year")}</text>
  <text x="${P.l}" y="${P.t-8}" text-anchor="end" style="font-size:12px">${t("Risk")}</text>${dots}`;
 const box=$("scatterBox"),tip=tipper(box);tip.hidden=true;
 svg.querySelectorAll(".dot").forEach(d=>{const r=BY[d.dataset.s];
  const show=()=>{const c=d.querySelectorAll("circle")[1].getBoundingClientRect(),b=box.getBoundingClientRect();
   tip.textContent=`${short(r.name)} · ${t("risk")} ${r.srri} ${tRisk(r.srri)} · ${pct(r.cagr)} ${t("a year")}`;
   tip.style.left=Math.min(b.width-110,Math.max(110,c.left-b.left+c.width/2))+"px";tip.style.top=(c.top-b.top)+"px";tip.hidden=false};
  d.onpointerenter=show;d.onfocus=show;d.onpointerleave=d.onblur=()=>tip.hidden=true});
}

/* accounts, glossary and method */
function vLearn(){
 const acc=[["ISK","Investeringssparkonto","No tax on gains or dividends. Instead a yearly flat tax on the account value, roughly 1% a year. From 2026 the first 300 000 kr is tax-free.","Stocks, funds and ETFs held over time.","The tax is due even in a losing year."],
  ["KF","Kapitalförsäkring","Same flat-tax idea as ISK, paid by the insurer.","Foreign dividends, naming beneficiaries.","Formally owned by the insurer."],
  ["AF","Aktie- och fondkonto","30% tax on gains and dividends. Losses are 70% deductible.","Bonds when yields are below the ISK tax rate.","K4 paperwork every time you sell."],
  ["Sparkonto","","30% tax on interest. State guarantee up to 1 050 000 kr per bank.","Emergency buffer, money needed within ~2 years.","Inflation can outpace the interest."],
  ["Pension","PPM / tjänstepension","Taxed as income when paid out.","Very long-term. See minpension.se.","Locked until retirement age."]];
 const gl=[["Risk level (1–7)","The EU's standard scale (ESMA SRRI). It's set by how much the price swung each year over 5 years: 1 under 0.5%, 2 under 2%, 3 under 5%, 4 under 10%, 5 under 15%, 6 under 25%, 7 at 25% or more."],
  ["Swings per year (volatility)","How far the price typically moves up or down in a year. 15% means a normal year can easily land 15% above or below average."],
  ["Biggest drop","The largest fall from a high point to a later low. It's the loss you'd have seen if you bought at the worst moment."],
  ["Reward for risk (Sharpe ratio)","Return above what risk-free Swedish T-bills paid (avg {rf}), divided by the swings. Above 0.5 is good, below 0 means T-bills did better."],
  ["Time horizon","Follows from the risk level. Levels 1–2 are short (under 2 years), 3–4 medium (2–5 years), 5–7 long (5 years or more), the time usually needed to recover from a bad drop."],
  ["Currency effect","Holdings traded in EUR or USD are measured in SEK, so currency moves are part of their swings. The funds trade in EUR because EU rules generally let Swedish savers buy only EU-registered (UCITS) funds. Each one is labelled with where its money is invested, such as Global, US or Japan, not where it trades. That's why euro bond funds land at level 4 here."]];
 return {title:t("Accounts & glossary"),sub:t("Where to hold your savings in Sweden, and what the numbers in this app mean."),
  html:`<section id="accounts"><h2>${t("Where to hold it in Sweden")}</h2><div class="tbl-wrap"><table><thead><tr><th>${t("Account")}</th><th>${t("How it's taxed")}</th><th>${t("Typical use")}</th><th>${t("Watch out for")}</th></tr></thead><tbody>
   ${acc.map(a=>`<tr><td>${a[0]}${a[1]?`<br><span class="sub" style="font-weight:400">${a[1]}</span>`:""}</td><td>${t(a[2])}</td><td>${t(a[3])}</td><td>${t(a[4])}</td></tr>`).join("")}</tbody></table></div></section>
  <section><h2>${t("What the numbers mean")}</h2><dl class="gloss">${gl.map(g=>`<div><dt>${t(g[0])}</dt><dd>${t(g[1],{rf:pcf(DATA.rates.tbill5yAvg,2)})}</dd></div>`).join("")}</dl></section>
  <footer class="method"><span>${t("Method: weekly dividend-adjusted closes for 5 years from Yahoo Finance, converted to SEK at the Riksbank's official EUR/SEK and USD/SEK fixings. Volatility is the standard deviation of weekly log returns × √52. Sharpe uses the 5-year average 3-month T-bill rate. Past results are not forecasts. The official SRI on a fund's KID also adds credit risk and may differ.")}</span>
   <span>${t("This app is for learning, not a recommendation to buy anything. Places to buy these in Sweden: Avanza, Nordnet, or your bank. Compare fees before you choose.")}</span></footer>`};
}

/* ---------- start ---------- */
window.addEventListener("hashchange",route);
(async()=>{
 CUR.v=(location.hash.replace(/^#\/?/,"").split("/")[0])||"overview";
 renderSide();render();
 try{await loadData()}catch(e){LOADERR=e}
 renderSide();route();poll();
})();
