/* Translations. The English text is the key; DICT.<code> holds each language (Swedish here, the rest in lang/*.js).
   Placeholders like {n} are filled in by t(). A missing string falls back to English and is logged once in the console. */
let LANG="en";
// code: [name shown in the picker, locale used for numbers, dates and amounts]
const LANGS={sv:["Svenska","sv-SE"],en:["English","en-GB"],de:["Deutsch","de-DE"],fr:["Français","fr-FR"],es:["Español","es-ES"]};
const DICT={},MISSING=new Set();
function t(s,v){
 let o=s;const d=DICT[LANG];
 if(d){if(s in d)o=d[s];else if(!MISSING.has(LANG+s)){MISSING.add(LANG+s);console.warn(LANG+" missing:",s)}}
 return v?o.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m):o;
}
DICT.sv={
 "Built for saving in Sweden: amounts are in Swedish kronor (SEK), and the accounts and taxes described are Swedish.":"Byggd för sparande i Sverige: beloppen är i svenska kronor (SEK), och kontona och skatterna som beskrivs är svenska.",
 // navigation and shell
 "Sections":"Avsnitt","Overview":"Översikt","Plan":"Planera","My plan":"Min plan","Monthly saving":"Månadssparande","Saved plans":"Sparade planer",
 "Explore":"Utforska","Ranking":"Rankning","Watchlist":"Bevakningslista","What's moving":"Vad som rör sig","Risk map":"Riskkarta","Learn":"Lär dig",
 "Accounts & glossary":"Konton och ordlista","Language":"Språk","Theme":"Tema","System":"System","Light":"Ljust","Dark":"Mörkt",
 "Update data now":"Uppdatera data nu","Data from":"Data från","Updates every weekday evening after the Stockholm close.":"Uppdateras varje vardagskväll efter att Stockholmsbörsen stängt.",
 "Updating prices and rates. This takes a few minutes, and you can keep using the app.":"Uppdaterar kurser och räntor. Det tar några minuter, och du kan fortsätta använda appen under tiden.",
 "The last update failed, so the figures are from the previous update. Try again later.":"Den senaste uppdateringen misslyckades, så siffrorna är från uppdateringen innan. Försök igen senare.",
 "Prices: Yahoo Finance · Rates: Riksbank":"Kurser: Yahoo Finance · Räntor: Riksbanken","Data updated.":"Data uppdaterad.","Couldn't start the update.":"Uppdateringen kunde inte startas.",
 "The market data did not load.":"Marknadsdata kunde inte laddas.","Use “Update data now” in the sidebar to fetch it.":"Hämta den med ”Uppdatera data nu” i sidofältet.",
 "Check your internet connection, then reload the app.":"Kontrollera internetanslutningen och ladda om appen.","Loading data…":"Laddar data…",
 "Undo":"Ångra","Name":"Namn","Save":"Spara","Cancel":"Avbryt","Back":"Tillbaka","Open":"Öppna","Rename":"Byt namn","Delete":"Ta bort","See all":"Visa alla","Compare all":"Jämför alla",

 // risk, horizons, groups, regions
 "Very low":"Mycket låg","Low":"Låg","Low–medium":"Låg–medel","Medium":"Medel","Medium–high":"Medel–hög","High":"Hög","Very high":"Mycket hög",
 "Short term":"Kort sikt","Medium term":"Medellång sikt","Long term":"Lång sikt","Short":"Kort","Long":"Lång",
 "under 2 years":"under 2 år","2–5 years":"2–5 år","5 years or more":"5 år eller mer",
 "Risk":"Risk","risk":"risk","Risk level":"Risknivå","a year":"per år","a month":"i månaden","{n} year":"{n} år","{n} years":"{n} år","{n} months":"{n} månader",
 "Bond fund":"Räntefond","Index fund":"Indexfond","Investment company":"Investmentbolag","Single share":"Enskild aktie","Cash":"Kontanter",
 "Bond funds":"Räntefonder","Index funds":"Indexfonder","Investment companies":"Investmentbolag","Single shares":"Enskilda aktier",
 "Global":"Globalt","US":"USA","Europe":"Europa","UK":"Storbritannien","Japan":"Japan","Asia-Pacific":"Asien och Stillahavet","Emerging markets":"Tillväxtmarknader",
 "India":"Indien","Sweden":"Sverige","China":"Kina","Taiwan":"Taiwan","Denmark":"Danmark","Netherlands":"Nederländerna","United States":"USA",
 "Stocks":"Aktier","Bonds":"Räntor","stocks":"aktier",

 // overview
 "Your savings options, ranked by real risk. Each fund and share is scored from its actual price history over the last 5 years.":"Dina sparalternativ, rankade efter verklig risk. Varje fond och aktie bedöms utifrån hur kursen faktiskt har rört sig de senaste 5 åren.",
 "How to read risk":"Så läser du risken","Risk uses the official EU 1–7 scale, the same number printed on every fund's fact sheet.":"Risken anges på EU:s officiella skala 1–7, samma siffra som står i varje fonds faktablad.",
 "Risk scale 1 to 7. Levels 1 and 2 suit money needed within 2 years, 3 and 4 suit 2 to 5 years, 5 to 7 suit 5 years or more.":"Riskskala 1 till 7. Nivå 1 och 2 passar pengar du behöver inom 2 år, 3 och 4 passar 2 till 5 år, 5 till 7 passar 5 år eller mer.",
 "← barely moves":"← rör sig knappt","swings a lot →":"svänger mycket →",
 "Matched to when you need the money":"Efter när du behöver pengarna",
 "In each group, the best reward for the risk taken comes first (the Sharpe ratio, the industry's standard measure).":"I varje grupp kommer bäst avkastning i förhållande till risken först (Sharpekvoten, branschens standardmått).",
 "Short term: keep it safe":"Kort sikt: håll det tryggt","Medium term: steady growth":"Medellång sikt: stadig tillväxt","Long term: growth, with bumps":"Lång sikt: tillväxt, med gupp",
 "{n} tracked funds qualify.":"{n} av de bevakade fonderna passar.","None of the tracked funds swung little enough in SEK, so cash-like options fit here.":"Ingen av de bevakade fonderna svängde tillräckligt lite i kronor, så kontoliknande alternativ passar här.",
 "Paying today, from the Riksbank":"Räntan i dag, enligt Riksbanken","Savings account, roughly":"Sparkonto, ungefär","3-month T-bill / money market":"3-månaders statsskuldväxel / penningmarknad","2-year government bond":"2-årig statsobligation",
 "Savings accounts are covered by the state deposit guarantee up to 1 050 000 kr per bank.":"Sparkonton omfattas av den statliga insättningsgarantin upp till 1 050 000 kr per bank.",
 "{n} instruments qualify, mostly bond funds.":"{n} värdepapper passar, mest räntefonder.","{n} instruments qualify: stock funds and shares.":"{n} värdepapper passar: aktiefonder och aktier.",
 "Best reward for risk first":"Bäst avkastning i förhållande till risk först","biggest drop":"största fall",
 "last 12 months":"senaste 12 mån","Star funds and shares in the ranking or on a fund's page to follow them here.":"Stjärnmarkera fonder och aktier i rankningen eller på en fonds sida för att följa dem här.",
 "Browse the ranking":"Bläddra i rankningen","cautious estimate":"försiktig uppskattning",
 "Build a plan under My plan or Monthly saving and save it to compare it here. Saved plans are recalculated after every data update.":"Gör en plan under Min plan eller Månadssparande och spara den för att jämföra här. Sparade planer räknas om efter varje datauppdatering.",
 "Make a plan":"Gör en plan",

 // ranking
 "Everything, from steadiest to bumpiest. Star a row to add it to your watchlist, or open it to see its history.":"Allt, från stadigast till mest svängigt. Stjärnmarkera en rad för att bevaka den, eller öppna den för att se historiken.",
 "Time horizon":"Tidshorisont","Type":"Typ","All":"Alla","Sort by":"Sortera efter","Show all figures":"Visa alla siffror",
 "Risk level, lowest first":"Risknivå, lägst först","Average per year, highest first":"Snitt per år, högst först","Biggest drop, smallest first":"Största fall, minst först",
 "Reward for risk, best first":"Avkastning mot risk, bäst först","Swings per year, lowest first":"Svängningar per år, minst först","Last 3 months, highest first":"Senaste 3 mån, högst först","Name, A–Z":"Namn, A–Ö",
 "Last 5 years":"Senaste 5 åren","Avg per year":"Snitt per år","Biggest drop":"Största fall","Reward for risk":"Avkastning mot risk",
 "Swings / yr":"Sväng. / år","Last 3 mo":"3 mån","Last 12 mo":"12 mån","Worst 12 mo":"Sämsta 12 mån",
 "average yearly gain over 5 years, dividends included":"genomsnittlig årlig ökning över 5 år, utdelningar inräknade","largest fall from a high to a later low":"största fallet från en topp till en senare botten",
 "return above T-bills per unit of swing; above 0.5 is good":"avkastning utöver statsskuldväxlar per enhet svängning; över 0,5 är bra",
 "Nothing in this group. Pick “All” to see everything.":"Inget i den här gruppen. Välj ”Alla” för att se allt.","for money needed in {h}":"för pengar du behöver om {h}",
 "Add to watchlist":"Bevaka","Remove from watchlist":"Sluta bevaka","Added {name} to your watchlist.":"{name} har lagts till i bevakningslistan.","Removed {name} from your watchlist.":"{name} har tagits bort från bevakningslistan.",

 // fund page
 "Not in the latest data":"Finns inte i senaste datan","This fund or share is not in the latest data. It may have been dropped from the tracked list.":"Fonden eller aktien finns inte i den senaste datan. Den kan ha tagits bort från listan som följs.",
 "Back to the ranking":"Tillbaka till rankningen","ticker":"kortnamn","latest price":"senaste kurs","On your watchlist":"Bevakas",
 "If you had put <b>10 000 kr</b> in 5 years ago, it would be worth about <b>{v}</b> today. At its worst point it was down <b>{d}</b> from its previous high":"Om du hade satt in <b>10 000 kr</b> för 5 år sedan skulle det vara värt ungefär <b>{v}</b> i dag. Som sämst låg det <b>{d}</b> under sin tidigare topp",
 ", and the longest wait to get back to a high was <b>{w}</b>":", och den längsta väntan på att nå en ny topp var <b>{w}</b>",
 "Value of 100 kr invested 5 years ago":"Värdet av 100 kr investerade för 5 år sedan","Value of 100 kr invested 5 years ago, dividends reinvested. Hover over the chart to see any week.":"Värdet av 100 kr investerade för 5 år sedan, med utdelningar återinvesterade. För muspekaren över diagrammet för att se en viss vecka.",
 "Distance below previous high":"Avstånd under tidigare topp","Shaded red: how far below its previous high it was at each point.":"Rött fält: hur långt under sin tidigare topp den låg vid varje tidpunkt.",
 "Swings per year":"Svängningar per år","Avg per year, 5 yrs":"Snitt per år, 5 år","Last 12 months":"Senaste 12 månaderna","Last 3 months":"Senaste 3 månaderna","Worst 12 months":"Sämsta 12 månaderna","Traded in":"Handlas i",

 // watchlist
 "Follow the funds and shares you care about, and compare them side by side.":"Följ de fonder och aktier du är intresserad av och jämför dem sida vid sida.",
 "Nothing on your watchlist yet":"Inget på bevakningslistan än",
 "Press the star next to any fund or share in the ranking, or on its own page. It stays here between sessions, on this computer only.":"Tryck på stjärnan vid en fond eller aktie i rankningen eller på dess egen sida. Den ligger kvar här mellan gångerna, bara på den här datorn.",
 "Growth of 100 kr, compared":"Tillväxt för 100 kr, jämförd","Each line starts at 100 kr on the first date all of them share, in SEK with dividends reinvested. Hover to compare any week.":"Varje linje börjar på 100 kr det första datum som alla har gemensamt, i kronor med utdelningar återinvesterade. För muspekaren över diagrammet för att jämföra en viss vecka.",
 "Growth of 100 kr for each fund on the watchlist":"Tillväxt för 100 kr för varje fond på bevakningslistan","The chart has room for 8 lines. Remove a fund to make room for the others.":"Diagrammet har plats för 8 linjer. Ta bort en fond för att ge plats åt de andra.",
 "{n} starred holdings are no longer in the tracked data and are hidden.":"{n} stjärnmarkerade innehav finns inte längre i datan och visas inte.",

 // my plan
 "Where the data says to put a lump sum. Enter an amount, when you'll need it and how much risk you'll accept. The app searches mixes of the tracked funds and shares for the one that earned the most over the last 5 years while keeping the whole mix inside your risk level.":"Var datan säger att en klumpsumma ska placeras. Ange ett belopp, när du behöver pengarna och hur mycket risk du accepterar. Appen söker bland blandningar av de bevakade fonderna och aktierna efter den som tjänade mest de senaste 5 åren, med hela blandningen inom din risknivå.",
 "Save plan":"Spara plan","Save this plan":"Spara planen","Amount to invest":"Belopp att investera","When will you need it?":"När behöver du pengarna?","Years invested":"År investerat",
 "Risk you're willing to take":"Risk du är beredd att ta","← steadier":"← stadigare","more growth, bigger drops →":"mer tillväxt, större fall →","Include individual shares":"Ta med enskilda aktier",
 "Yearly swings kept under {b}.":"Årliga svängningar hålls under {b}.",
 "That's above the usual level {u} for money needed in {h}: a bad year near the end could force you to sell at a loss.":"Det är över den vanliga nivån {u} för pengar du behöver om {h}: ett dåligt år nära slutet kan tvinga dig att sälja med förlust.",
 "That's below the usual level {u} for {h}: steadier, but likely less growth.":"Det är under den vanliga nivån {u} för {h}: stadigare, men troligen mindre tillväxt.",
 "That's the usual level for money needed in {h}.":"Det är den vanliga nivån för pengar du behöver om {h}.",
 "Individual shares are only used at risk level 5 or higher":"Enskilda aktier används bara på risknivå 5 eller högre",
 "No tracked instrument beat T-bills over the last 5 years at this risk level, so the data points to a savings account.":"Inget bevakat värdepapper slog statsskuldväxlarna de senaste 5 åren på den här risknivån, så datan pekar på ett sparkonto.",
 "Holds the mix inside its risk limit":"Håller blandningen inom riskgränsen","Steadies the mix":"Stabiliserar blandningen","Drives growth":"Driver tillväxten",
 "Savings account or money-market fund":"Sparkonto eller penningmarknadsfond",
 "{a} for {n} · risk level {l} chosen · cautious estimate":"{a} i {n} · vald risknivå {l} · försiktig uppskattning",
 "Likely range <b>{lo} – {hi}</b>. If the last 5 years repeated: <b>{rep}</b>.":"Troligt spann <b>{lo} – {hi}</b>. Om de senaste 5 åren upprepades: <b>{rep}</b>.",
 "Risk level of this mix":"Risknivå för blandningen","Average a year, last 5 years":"Snitt per år, senaste 5 åren","Biggest drop, last 5 years":"Största fall, senaste 5 åren",
 "How the data splits {a}":"Så delar datan upp {a}",
 "Listed in Sweden: <b>{p}</b> of this mix (limit 20%). Sweden is about 1% of the world stock market.":"Noterat i Sverige: <b>{p}</b> av blandningen (gräns 20 %). Sverige är ungefär 1 % av världens aktiemarknad.",
 "Holding":"Innehav","Share":"Andel","Amount":"Belopp","Role":"Roll","trades in {c}":"handlas i {c}",
 "What this mix would have done over the last 5 years":"Vad blandningen skulle ha gjort de senaste 5 åren","Value of the plan over the last 5 years compared with cash":"Planens värde de senaste 5 åren jämfört med kontanter",
 "This mix":"Blandningen","Cash at the T-bill rate":"Kontanter till statsskuldväxelräntan","Things the data can't tell you":"Det här kan datan inte säga",
 "This mix is the best fit for the last 5 years, which had no crash as deep as 2008 (global stocks fell about 40% in SEK). A different 5 years would give a different mix. Funds can overlap: Nasdaq 100, S&P 500 and World IT all hold the same big US tech companies, so a mix of them is less spread out than it looks. Keep an emergency buffer in a savings account first. Hold everything in an ISK to avoid tax on gains. All of these can be bought at Avanza or Nordnet by searching for the ticker.":"Blandningen passar bäst för de senaste 5 åren, som inte hade någon krasch lika djup som 2008 (då globala aktier föll ungefär 40 % i kronor). En annan femårsperiod skulle ge en annan blandning. Fonder kan överlappa: Nasdaq 100, S&P 500 och World IT äger alla samma stora amerikanska teknikbolag, så en blandning av dem är mindre spridd än den ser ut. Ha en buffert på ett sparkonto först. Lägg allt i ett ISK för att slippa skatt på vinster. Alla kan köpas hos Avanza eller Nordnet genom att söka på kortnamnet.",
 "How this plan was built":"Så byggdes planen",
 "<b>Universe:</b> {g}, Swedish and worldwide, that beat Swedish T-bills over 5 years ({n} used, best first), plus cash. Investment companies and individual shares only enter at risk level 5 or higher.":"<b>Urval:</b> {g}, svenska och globala, som slog svenska statsskuldväxlar över 5 år ({n} används, bäst först), plus kontanter. Investmentbolag och enskilda aktier kommer bara med på risknivå 5 eller högre.",
 "<b>Goal:</b> the highest average return the whole mix earned, with its yearly swings kept under {c}. That holds it at your chosen risk level {l} or lower. Swings are measured with each pair's co-movement in weekly SEK prices. This is target-risk mean-variance optimisation, the standard method behind risk-profiled model portfolios.":"<b>Mål:</b> den högsta genomsnittliga avkastningen för hela blandningen, med årliga svängningar under {c}. Det håller den på din valda risknivå {l} eller lägre. Svängningarna mäts med hur varje par rör sig tillsammans i veckokurser i kronor. Det här är medelvärde–varians-optimering mot en målrisk, standardmetoden bakom riskprofilerade modellportföljer.",
 "<b>Spread limits:</b> at most 30% in any one fund and 10% in any single share. Investment companies are limited to 15% combined, because they hold many of the same companies. Swedish-listed holdings are limited to 20% combined, so a home-market category can't dominate the mix. All in 5% steps.":"<b>Spridningsgränser:</b> högst 30 % i en enskild fond och 10 % i en enskild aktie. Investmentbolag får vara högst 15 % tillsammans, eftersom de äger många av samma bolag. Svenskt noterade innehav får vara högst 20 % tillsammans, så att hemmamarknaden inte dominerar. Allt i steg om 5 %.",
 "<b>Cautious estimate:</b> instead of repeating the last 5 years, it assumes cash earns today's T-bill rate ({tb}), bond funds today's 5-year government yield ({g5}) and stocks 7% a year. The range is ±1 standard deviation of the mix's measured swings over {n}. ISK tax is deducted on the balance above 300 000 kr. Fund fees are not deducted.":"<b>Försiktig uppskattning:</b> i stället för att upprepa de senaste 5 åren antas kontanter ge dagens statsskuldväxelränta ({tb}), räntefonder dagens 5-åriga statsobligationsränta ({g5}) och aktier 7 % per år. Spannet är ±1 standardavvikelse av blandningens uppmätta svängningar över {n}. ISK-skatt dras på det som överstiger 300 000 kr. Fondavgifter är inte avdragna.",
 "Copy report as text":"Kopiera rapporten som text","Copied.":"Kopierat.","Copy didn't work here. Select the table text instead.":"Kopieringen fungerade inte här. Markera tabelltexten i stället.",
 "Sparplan report ({d})":"Sparplan-rapport ({d})","{a} for {n}, needed in {h}, chosen risk level {l}":"{a} i {n}, behövs om {h}, vald risknivå {l}",
 "Risk level {l} ({w}). Cautious estimate {m}, range {lo}–{hi}.":"Risknivå {l} ({w}). Försiktig uppskattning {m}, spann {lo}–{hi}.","Last 5 years: {c} a year, biggest drop {d}.":"Senaste 5 åren: {c} per år, största fall {d}.",
 "Based on past data only. Not financial advice.":"Bygger bara på historisk data. Inte finansiell rådgivning.",

 // monthly saving
 "Choose how much you save each month and how to split it between stocks and bonds. Inside each part, the funds are picked by the data: the combination with the best reward for risk over the last 5 years.":"Välj hur mycket du sparar varje månad och hur det ska fördelas mellan aktier och räntor. Inom varje del väljer datan fonderna: den kombination som gav bäst avkastning i förhållande till risk de senaste 5 åren.",
 "Already saved, to invest now":"Redan sparat, att investera nu","Years of saving":"År av sparande","Stocks and bonds":"Aktier och räntor","← all bonds":"← bara räntor","all stocks →":"bara aktier →",
 "Fees and tax":"Avgifter och skatt","Fund fees":"Fondavgifter","Index ETFs like these typically charge 0.05–0.4% a year.":"Index-ETF:er som de här tar oftast 0,05–0,4 % per år.",
 "ISK flat tax":"ISK-schablonskatt","Charged on the balance above 300 000 kr, the 2026 tax-free level.":"Tas ut på det som överstiger 300 000 kr, den skattefria nivån 2026.",
 "Fund":"Fond","Part":"Del","Each month":"Varje månad","Looking ahead":"Framåt","Projected balance over time":"Beräknat värde över tid",
 "Cautious estimate":"Försiktig uppskattning","Likely range":"Troligt spann","What you paid in":"Det du har satt in","How the funds were picked":"Så valdes fonderna",
 "Past results are not a forecast. The last 5 years had no crash as deep as 2008, when global stocks fell about 40% in SEK, so a real bad year could be worse than shown.":"Historisk avkastning är ingen prognos. De senaste 5 åren hade ingen krasch lika djup som 2008, då globala aktier föll ungefär 40 % i kronor, så ett verkligt dåligt år kan bli sämre än det som visas.",
 "{s}% stocks · {b}% bonds":"{s} % aktier · {b} % räntor","{v} a year":"{v} per år",
 "This split measured <b>{v}</b> swings a year over 5 years: risk level <b>{l} · {w}</b>, usually suited to money needed in {h}.":"Den här fördelningen svängde <b>{v}</b> per år över 5 år: risknivå <b>{l} · {w}</b>, som brukar passa pengar du behöver om {h}.",
 "{m} a month for {n} · cautious estimate":"{m} i månaden i {n} · försiktig uppskattning","You pay in":"Du sätter in","Worst 12 months at the end":"Sämsta 12 månaderna i slutet",
 "Each month, put {m} into":"Sätt in {m} varje månad i",
 "Listed in Sweden: <b>{p}</b> of this mix (limit 20% of each part). Sweden is about 1% of the world stock market.":"Noterat i Sverige: <b>{p}</b> av blandningen (gräns 20 % av varje del). Sverige är ungefär 1 % av världens aktiemarknad.",
 "Tested on real prices":"Testat på verkliga kurser",
 "Saving {m} a month into exactly this mix from {d}{x} would have meant paying in <b>{p}</b>. Today it would be worth <b>{v}</b> ({c}), before fees and tax.":"Att spara {m} i månaden i exakt den här blandningen från {d}{x} hade betytt insättningar på <b>{p}</b>. I dag skulle det vara värt <b>{v}</b> ({c}), före avgifter och skatt.",
 ", plus {s} at the start,":", plus {s} från start,",
 "<b>Your choice:</b> the split between stocks and bonds. Everything else comes from the data.":"<b>Ditt val:</b> fördelningen mellan aktier och räntor. Allt annat kommer från datan.",
 "<b>Stock part:</b> index funds and investment companies, Swedish and worldwide, that beat Swedish T-bills over 5 years ({n} did, best 12 used).":"<b>Aktiedelen:</b> indexfonder och investmentbolag, svenska och globala, som slog svenska statsskuldväxlar över 5 år ({n} gjorde det, de 12 bästa används).",
 "<b>Bond part:</b> bond funds that beat T-bills over 5 years ({n} did{x}).":"<b>Räntedelen:</b> räntefonder som slog statsskuldväxlarna över 5 år ({n} gjorde det{x}).",
 ", so the best 3 overall were used":", så de 3 bästa totalt används",
 "<b>Picking inside each part:</b> the combination with the highest reward for risk (Sharpe ratio), using each pair's co-movement in weekly SEK prices. At most 30% of a part in one fund, 15% in investment companies combined and 20% in Swedish-listed holdings combined, in 5% steps. The per-fund limit is loosened only when too few funds qualify.":"<b>Urval inom varje del:</b> den kombination som ger högst avkastning i förhållande till risk (Sharpekvot), utifrån hur varje par rör sig tillsammans i veckokurser i kronor. Högst 30 % av en del i en fond, 15 % i investmentbolag tillsammans och 20 % i svenskt noterade innehav tillsammans, i steg om 5 %. Gränsen per fond lättas bara när för få fonder kvalificerar sig.",
 "<b>Looking ahead:</b> bonds earn today's 5-year Swedish government yield ({g5}) and stocks 7% a year, the common long-run figure, minus fees. The range is ±1 standard deviation of this mix's measured swings. ISK tax is taken on the balance above 300 000 kr.":"<b>Framåt:</b> räntor ger dagens 5-åriga svenska statsobligationsränta ({g5}) och aktier 7 % per år, den vanliga långsiktiga siffran, minus avgifter. Spannet är ±1 standardavvikelse av blandningens uppmätta svängningar. ISK-skatt tas på det som överstiger 300 000 kr.",
 "year {n}":"år {n}","Year {i}: {v} (paid in {p})":"År {i}: {v} (insatt {p})",

 // saved plans
 "Saved “{n}”. Find it under Saved plans.":"”{n}” är sparad. Du hittar den under Sparade planer.","Rename plan":"Byt namn på planen","Deleted “{n}”.":"”{n}” är borttagen.",
 "{a} lump sum · {n} · risk {l}":"{a} engångsbelopp · {n} · risk {l}","with shares":"med aktier","{m} a month · {n} · {s}% stocks":"{m} i månaden · {n} · {s} % aktier","{s} to start":"{s} från start",
 "Your saved plans side by side. The inputs are kept and the figures are recalculated with the latest data, so they can change after each update.":"Dina sparade planer sida vid sida. Det du angav sparas och siffrorna räknas om med senaste datan, så de kan ändras efter varje uppdatering.",
 "No saved plans yet":"Inga sparade planer än","Build a plan under My plan or Monthly saving, then press “Save plan” to keep it and compare it with others.":"Gör en plan under Min plan eller Månadssparande och tryck sedan på ”Spara plan” för att spara den och jämföra med andra.",
 "Saved plan":"Sparad plan","Biggest drop, 5 yrs":"Största fall, 5 år","Saved {d}":"Sparad {d}",
 "Cautious estimate: bonds at today's 5-year government yield, stocks at 7% a year, cash at today's T-bill rate. For a lump sum, “You pay in” is the amount invested.":"Försiktig uppskattning: räntor till dagens 5-åriga statsobligationsränta, aktier 7 % per år, kontanter till dagens statsskuldväxelränta. För ett engångsbelopp är ”Du sätter in” det investerade beloppet.",

 // what's moving
 "Where company insiders put their own money in the last 30 days, from the public insider registers, and which tracked funds and shares rose most recently. Neither predicts the future. Insiders can be wrong, and a rise can reverse.":"Var bolagens insynspersoner har lagt sina egna pengar de senaste 30 dagarna, enligt de offentliga insynsregistren, och vilka bevakade fonder och aktier som har stigit mest på sistone. Inget av det förutsäger framtiden. Insynspersoner kan ha fel, och en uppgång kan vända.",
 "What insiders are doing":"Vad insynspersonerna gör","Country":"Land","Company":"Bolag","Net bought":"Nettoköpt","Insiders buying":"Insynspersoner som köper",
 "Rising most, last 3 months":"Stigit mest, senaste 3 månaderna","3 months":"3 mån","12 months":"12 mån",
 "From the same price data as the rest of the app, in SEK, with dividends included.":"Från samma kursdata som resten av appen, i kronor, med utdelningar inräknade.",
 "{n} selling":"{n} säljer","{p} in 3 months":"{p} på 3 månader",
 "United States · {f} to {to} · {n} insider reports for the {c} tracked US companies":"USA · {f} till {to} · {n} insynsrapporter för de {c} bevakade amerikanska bolagen",
 "No open-market insider trades: {l}.":"Inga insynsaffärer på öppna marknaden: {l}.",
 "Source: SEC Form 4 filings. Insiders at large US companies mostly sell, for pay and diversification, so a purchase is rarer and says more. Covers open-market purchases and sales only. Foreign companies with US listings, such as TSMC and Toyota, don't file these reports.":"Källa: SEC Form 4-rapporter. Insynspersoner i stora amerikanska bolag säljer oftast, som lön och för att sprida risken, så ett köp är ovanligare och säger mer. Omfattar bara köp och försäljningar på öppna marknaden. Utländska bolag noterade i USA, som TSMC och Toyota, lämnar inte de här rapporterna.",
 "Sweden · {f} to {to} · {n} reported trades, all listed companies":"Sverige · {f} till {to} · {n} rapporterade affärer, alla noterade bolag",
 "Tracked here as {n} · {p} in 3 months":"Bevakas här som {n} · {p} på 3 månader","Most net selling: {l}.":"Mest nettoförsäljning: {l}.",
 "Source: Finansinspektionen's insider register (insynsregistret). Counts only open-market share trades in SEK. Share-programme grants are excluded. One large buyer, such as a holding company, can dominate the amount, so check how many insiders are buying.":"Källa: Finansinspektionens insynsregister. Räknar bara aktieaffärer på öppna marknaden i kronor. Tilldelningar i aktieprogram är inte med. En enda stor köpare, till exempel ett ägarbolag, kan dominera beloppet, så titta på hur många insynspersoner som köper.",
 "Insider data did not load in the last refresh.":"Insynsdatan laddades inte vid senaste uppdateringen.",

 // risk map
 "Did more risk pay off? Further right means bumpier, higher up means more return per year. The best spots are toward the top left. Click a dot to open it; ringed dots are on your watchlist.":"Lönade sig mer risk? Längre till höger betyder mer svängigt, högre upp betyder mer avkastning per år. Bäst är uppe till vänster. Klicka på en prick för att öppna den; prickar med ring bevakas av dig.",
 "Average return per year against yearly swings for each instrument":"Genomsnittlig avkastning per år mot årliga svängningar för varje värdepapper",
 "Short term · risk 1–2":"Kort sikt · risk 1–2","Medium term · risk 3–4":"Medellång sikt · risk 3–4","Long term · risk 5–7":"Lång sikt · risk 5–7",
 "Swings per year →":"Svängningar per år →","Average return per year":"Genomsnittlig avkastning per år",

 // accounts, glossary, method
 "Where to hold your savings in Sweden, and what the numbers in this app mean.":"Var du kan ha ditt sparande i Sverige, och vad siffrorna i appen betyder.",
 "Where to hold it in Sweden":"Var du kan ha det i Sverige","Account":"Konto","How it's taxed":"Så beskattas det","Typical use":"Passar ofta för","Watch out for":"Tänk på",
 "No tax on gains or dividends. Instead a yearly flat tax on the account value, roughly 1% a year. From 2026 the first 300 000 kr is tax-free.":"Ingen skatt på vinster eller utdelningar. I stället en årlig schablonskatt på kontots värde, ungefär 1 % per år. Från 2026 är de första 300 000 kronorna skattefria.",
 "Stocks, funds and ETFs held over time.":"Aktier, fonder och ETF:er som du äger länge.","The tax is due even in a losing year.":"Skatten betalas även ett år med förlust.",
 "Same flat-tax idea as ISK, paid by the insurer.":"Samma schablonskatt som ISK, betalas av försäkringsbolaget.","Foreign dividends, naming beneficiaries.":"Utländska utdelningar, att utse förmånstagare.","Formally owned by the insurer.":"Ägs formellt av försäkringsbolaget.",
 "30% tax on gains and dividends. Losses are 70% deductible.":"30 % skatt på vinster och utdelningar. Förluster är avdragsgilla till 70 %.","Bonds when yields are below the ISK tax rate.":"Räntor när räntan är lägre än ISK-skatten.","K4 paperwork every time you sell.":"K4-blankett varje gång du säljer.",
 "30% tax on interest. State guarantee up to 1 050 000 kr per bank.":"30 % skatt på räntan. Statlig garanti upp till 1 050 000 kr per bank.","Emergency buffer, money needed within ~2 years.":"Buffert, pengar du behöver inom ungefär 2 år.","Inflation can outpace the interest.":"Inflationen kan bli högre än räntan.",
 "Taxed as income when paid out.":"Beskattas som inkomst när den betalas ut.","Very long-term. See minpension.se.":"Mycket långsiktigt. Se minpension.se.","Locked until retirement age.":"Låst till pensionsåldern.",
 "What the numbers mean":"Vad siffrorna betyder",
 "Risk level (1–7)":"Risknivå (1–7)",
 "The EU's standard scale (ESMA SRRI). It's set by how much the price swung each year over 5 years: 1 under 0.5%, 2 under 2%, 3 under 5%, 4 under 10%, 5 under 15%, 6 under 25%, 7 at 25% or more.":"EU:s standardskala (ESMA SRRI). Den bestäms av hur mycket kursen svängde per år över 5 år: 1 under 0,5 %, 2 under 2 %, 3 under 5 %, 4 under 10 %, 5 under 15 %, 6 under 25 %, 7 vid 25 % eller mer.",
 "Swings per year (volatility)":"Svängningar per år (volatilitet)",
 "How far the price typically moves up or down in a year. 15% means a normal year can easily land 15% above or below average.":"Hur långt kursen brukar röra sig upp eller ner under ett år. 15 % betyder att ett vanligt år lätt kan hamna 15 % över eller under snittet.",
 "The largest fall from a high point to a later low. It's the loss you'd have seen if you bought at the worst moment.":"Det största fallet från en topp till en senare botten. Det är förlusten du hade sett om du köpt vid sämsta tänkbara tillfälle.",
 "Reward for risk (Sharpe ratio)":"Avkastning mot risk (Sharpekvot)",
 "Return above what risk-free Swedish T-bills paid (avg {rf}), divided by the swings. Above 0.5 is good, below 0 means T-bills did better.":"Avkastningen utöver vad riskfria svenska statsskuldväxlar gav (snitt {rf}), delat med svängningarna. Över 0,5 är bra, under 0 betyder att statsskuldväxlarna gick bättre.",
 "Follows from the risk level. Levels 1–2 are short (under 2 years), 3–4 medium (2–5 years), 5–7 long (5 years or more), the time usually needed to recover from a bad drop.":"Följer av risknivån. Nivå 1–2 är kort (under 2 år), 3–4 medellång (2–5 år), 5–7 lång (5 år eller mer), den tid det brukar ta att återhämta sig från ett stort fall.",
 "Currency effect":"Valutaeffekt",
 "Holdings traded in EUR or USD are measured in SEK, so currency moves are part of their swings. The funds trade in EUR because EU rules generally let Swedish savers buy only EU-registered (UCITS) funds. Each one is labelled with where its money is invested, such as Global, US or Japan, not where it trades. That's why euro bond funds land at level 4 here.":"Innehav som handlas i euro eller dollar mäts i kronor, så valutarörelser är en del av svängningarna. Fonderna handlas i euro eftersom EU-reglerna i regel bara låter svenska sparare köpa EU-registrerade fonder (UCITS). Varje innehav är märkt med var pengarna placeras, som Globalt, USA eller Japan, inte var det handlas. Därför hamnar euroräntefonderna på nivå 4 här.",
 "Method: weekly dividend-adjusted closes for 5 years from Yahoo Finance, converted to SEK at the Riksbank's official EUR/SEK and USD/SEK fixings. Volatility is the standard deviation of weekly log returns × √52. Sharpe uses the 5-year average 3-month T-bill rate. Past results are not forecasts. The official SRI on a fund's KID also adds credit risk and may differ.":"Metod: utdelningsjusterade veckokurser för 5 år från Yahoo Finance, omräknade till kronor med Riksbankens officiella EUR/SEK- och USD/SEK-kurser. Volatiliteten är standardavvikelsen för veckovisa logaritmiska avkastningar × √52. Sharpekvoten använder snittet av 3-månaders statsskuldväxelränta över 5 år. Historisk avkastning är ingen prognos. Den officiella riskindikatorn i en fonds faktablad (KID) väger också in kreditrisk och kan skilja sig.",
 "This app is for learning, not a recommendation to buy anything. Places to buy these in Sweden: Avanza, Nordnet, or your bank. Compare fees before you choose.":"Appen är till för att lära sig, inte en rekommendation att köpa något. Här kan du köpa dem i Sverige: Avanza, Nordnet eller din bank. Jämför avgifterna innan du väljer."
};
