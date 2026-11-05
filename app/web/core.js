/* Sparplan calculations. The maths is the same as sparplan.html (the published page); here the inputs are passed in
   instead of read from page state, so saved plans can be recalculated with each data update.
   Keep the two in step when a method changes. */
const BANDS=[0.5,2,5,10,15,25];
const hzOf=s=>s<=2?"short":s<=4?"medium":"long";

function metrics(x,rf){
  const p=x.p, n=p.length, lr=[];
  for(let i=1;i<n;i++)lr.push(Math.log(p[i]/p[i-1]));
  const m=lr.reduce((a,b)=>a+b,0)/lr.length;
  const sd=Math.sqrt(lr.reduce((a,b)=>a+(b-m)**2,0)/(lr.length-1));
  const vol=sd*Math.sqrt(52)*100;
  const yrs=(new Date(x.d[n-1])-new Date(x.d[0]))/31557600000;
  const cagr=(Math.pow(p[n-1]/p[0],1/yrs)-1)*100;
  const back=w=>n>w?(p[n-1]/p[n-1-w]-1)*100:null;
  let peak=p[0],mdd=0,peakI=0,maxUw=0;
  for(let i=0;i<n;i++){if(p[i]>=peak){peak=p[i];peakI=i}else maxUw=Math.max(maxUw,i-peakI);mdd=Math.min(mdd,(p[i]/peak-1)*100)}
  let worst=Infinity;for(let i=52;i<n;i++)worst=Math.min(worst,(p[i]/p[i-52]-1)*100);
  const srri=1+BANDS.filter(b=>vol>=b).length;
  return {...x,vol,cagr,r1:back(52),r3m:back(13),mdd,worst,maxUw,srri,hz:hzOf(srri),sharpe:(cagr-rf)/vol,grow:p[n-1]/p[0]*100};
}

function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* spread limits shared by My plan and Monthly saving */
const UNITS=20; // weights move in 5% steps
const capUnits=a=>a.group==="Cash"?UNITS:a.group==="Single share"?2:a.group==="Investment company"?3:6; // 10% / 15% / 30% caps
const IC_TOTAL=3, SE_TOTAL=4; // investment companies 15% combined, Swedish-listed holdings 20% combined
const isSE=a=>a.cur==="SEK"&&a.group!=="Cash";
function limitPenalty(A){const ic=A.map(a=>a.group==="Investment company"),se=A.map(isSE);
 return u=>{let x=0,y=0;for(let i=0;i<u.length;i++){if(ic[i])x+=u[i];if(se[i])y+=u[i]}return Math.max(0,x-IC_TOTAL)+Math.max(0,y-SE_TOTAL)}}
const seWeight=hold=>hold.filter(isSE).reduce((a,h)=>a+h.w,0);

/* My plan: rules-based target-risk mix (highest return with swings under the chosen risk level's ceiling) */
const PLAN_HZ={short:{risk:2,yrs:[1,2,2]},medium:{risk:4,yrs:[2,5,4]},long:{risk:5,yrs:[5,30,10]}};
const volCap=l=>BANDS[l-1]*0.95; // stay just inside the SRRI band's upper edge
const planGroups=(l,shares)=>["Bond fund","Index fund"].concat(l>=5?["Investment company"]:[],l>=5&&shares?["Single share"]:[]);
function optimisePlan(ROWS,rates,prisk,shares){
 const cap=volCap(prisk), rfAvg=rates.tbill5yAvg, groups=planGroups(prisk,shares);
 const C=ROWS.filter(r=>groups.includes(r.group)&&r.sharpe>0).sort((a,b)=>b.sharpe-a.sharpe).slice(0,16);
 if(!C.length)return null;
 const n=Math.min(...C.map(r=>r.p.length)), T=n-1;
 const rets=C.map(r=>{const p=r.p.slice(-n),o=[];for(let i=1;i<n;i++)o.push(p[i]/p[i-1]-1);return o});
 rets.push(Array(T).fill(rfAvg/100/52));
 const A=[...C,{sym:"CASH",name:"Savings account or money-market fund",group:"Cash",srri:1,hz:"short",sharpe:0,cur:"SEK"}], K=A.length;
 const mean=rets.map(r=>r.reduce((a,b)=>a+b,0)/T), mu=mean.map(m=>m*52*100);
 const cov=A.map((_,i)=>A.map((_,j)=>{let s=0;for(let t=0;t<T;t++)s+=(rets[i][t]-mean[i])*(rets[j][t]-mean[j]);return s/(T-1)*52*1e4}));
 const cu=A.map(capUnits);
 const pen=limitPenalty(A);
 const score=u=>{const e=pen(u);if(e)return -1000-e;let m=0,v=0;for(let i=0;i<K;i++){if(!u[i])continue;m+=u[i]*mu[i];for(let j=0;j<K;j++)if(u[j])v+=u[i]*u[j]*cov[i][j]}
  m/=UNITS;v=Math.sqrt(Math.max(0,v))/UNITS;return v>cap?-100-(v-cap):m-0.01*v}; // highest return under the risk ceiling; tiny tie-break toward lower swings
 const rnd=mulberry(7);let best=null,bs=-Infinity;
 for(let s=0;s<60;s++){ // random starts, then move 5% at a time while the score improves
  const u=Array(K).fill(0);let left=UNITS,g=0;
  while(left>0&&g++<500){const i=Math.floor(rnd()*K);if(u[i]<cu[i]){u[i]++;left--}}
  u[K-1]+=left;
  let sc=score(u),imp=true;
  while(imp){imp=false;for(let i=0;i<K;i++)for(let j=0;j<K;j++){if(i===j||!u[i]||u[j]>=cu[j])continue;u[i]--;u[j]++;const ns=score(u);if(ns>sc+1e-9){sc=ns;imp=true}else{u[i]++;u[j]--}}}
  if(sc>bs){bs=sc;best=u.slice()}
 }
 const hold=A.map((a,i)=>({...a,w:best[i]/UNITS,ri:i})).filter(h=>h.w>0).sort((a,b)=>(a.group==="Cash")-(b.group==="Cash")||b.w-a.w);
 const p=[100],cash=[100];for(let t=0;t<T;t++){p.push(p[t]*(1+hold.reduce((s,h)=>s+h.w*rets[h.ri][t],0)));cash.push(cash[t]*(1+rets[K-1][t]))}
 const d=C[0].d.slice(-n), m=metrics({p,d},rfAvg);
 return {hold,p,cash,d,m,cand:C.length};
}
function grow(amount,rate,years,isk){let b=amount;for(let y=0;y<years;y++){b*=1+rate;b-=Math.max(0,b-300000)*isk/100}return b}

/* normalise My plan inputs the same way the page does, then compute the report figures */
function planInputs(i){
 const o={amt:100000,phz:"long",pyrs:10,prisk:5,pshares:false,...i};
 if(!PLAN_HZ[o.phz])o.phz="long";
 const y=PLAN_HZ[o.phz].yrs;
 o.prisk=Math.min(6,Math.max(1,o.prisk||PLAN_HZ[o.phz].risk));o.pyrs=Math.min(y[1],Math.max(y[0],o.pyrs));
 o.sharesOk=o.prisk>=5;return o;
}
const PLAN_CACHE={};
function planResult(ROWS,rates,inp,isk){
 const o=planInputs(inp), key=o.prisk+"|"+(o.sharesOk&&o.pshares);
 if(!(key in PLAN_CACHE))PLAN_CACHE[key]=optimisePlan(ROWS,rates,o.prisk,o.sharesOk&&o.pshares);
 const plan=PLAN_CACHE[key];if(!plan)return {o,plan:null};
 const A=o.amt,N=o.pyrs,{hold,m}=plan;
 const expOf=h=>h.group==="Cash"?rates.tbill3m:h.group==="Bond fund"?rates.gov5y:7;
 const cautious=hold.reduce((s,h)=>s+h.w*expOf(h),0)/100, band=m.vol/100/Math.sqrt(N);
 return {o,plan,A,N,mid:grow(A,cautious,N,isk),lo:grow(A,cautious-band,N,isk),hi:grow(A,cautious+band,N,isk),rep:grow(A,m.cagr/100,N,isk),lvl:m.srri,m};
}

/* Monthly saving: the user sets the stock/bond split; inside each part the max-Sharpe fund mix is picked from the data */
function pickSleeve(ROWS,rates,groups){
 const rf=rates.tbill5yAvg, all=ROWS.filter(r=>groups.includes(r.group)).sort((a,b)=>b.sharpe-a.sharpe);
 let C=all.filter(r=>r.sharpe>0).slice(0,12);if(!C.length)C=all.slice(0,3);
 const n=Math.min(...C.map(r=>r.p.length)),T=n-1,K=C.length;
 const rets=C.map(r=>{const p=r.p.slice(-n),o=[];for(let i=1;i<n;i++)o.push(p[i]/p[i-1]-1);return o});
 const mean=rets.map(r=>r.reduce((a,b)=>a+b,0)/T), mu=mean.map(m=>m*52*100);
 const cov=C.map((_,i)=>C.map((_,j)=>{let s=0;for(let t=0;t<T;t++)s+=(rets[i][t]-mean[i])*(rets[j][t]-mean[j]);return s/(T-1)*52*1e4}));
 const cu=C.map(a=>Math.max(capUnits(a),Math.ceil(UNITS/K))); // same spread limits as My plan, loosened only if too few funds qualify
 const pen=limitPenalty(C);
 const score=u=>{const e=pen(u);if(e)return -1000-e;let m=0,v=0;for(let i=0;i<K;i++){if(!u[i])continue;m+=u[i]*mu[i];for(let j=0;j<K;j++)if(u[j])v+=u[i]*u[j]*cov[i][j]}
  m/=UNITS;v=Math.sqrt(Math.max(0,v))/UNITS;return v<1e-9?0:(m-rf)/v};
 const rnd=mulberry(11);let best=null,bs=-Infinity;
 for(let s=0;s<40;s++){
  const u=Array(K).fill(0);let left=UNITS,g=0;
  while(left>0&&g++<2000){const i=Math.floor(rnd()*K);if(u[i]<cu[i]){u[i]++;left--}}
  let sc=score(u),imp=true;
  while(imp){imp=false;for(let i=0;i<K;i++)for(let j=0;j<K;j++){if(i===j||!u[i]||u[j]>=cu[j])continue;u[i]--;u[j]++;const ns=score(u);if(ns>sc+1e-9){sc=ns;imp=true}else{u[i]++;u[j]--}}}
  if(sc>bs){bs=sc;best=u.slice()}
 }
 return {C,w:best.map(x=>x/UNITS),rets,n,qualified:all.filter(r=>r.sharpe>0).length};
}
function projectMonthly(inp,rate){let bal=inp.start,paid=inp.start;const pts=[{bal,paid}];
 for(let t=1;t<=inp.years;t++){for(let m=0;m<12;m++){bal=bal*(1+rate/12)+inp.monthly;paid+=inp.monthly}
  bal-=Math.max(0,bal-300000)*inp.isk/100;pts.push({bal,paid})}return pts}
function monthlyResult(SLV,rates,inp){
 const s=inp.sstocks/100,b=1-s,M=inp.monthly;
 // combine the two data-picked sleeves at the chosen split
 const T=Math.min(SLV.s.n,SLV.b.n)-1, tail=a=>a.slice(-T);
 const hold=[...SLV.s.C.map((a,i)=>({...a,part:"Stocks",w:s*SLV.s.w[i],r:tail(SLV.s.rets[i])})),
             ...SLV.b.C.map((a,i)=>({...a,part:"Bonds",w:b*SLV.b.w[i],r:tail(SLV.b.rets[i])}))].filter(h=>h.w>0.001)
            .sort((x,y)=>(x.part>y.part?-1:x.part<y.part?1:0)||y.w-x.w);
 const r=Array.from({length:T},(_,t)=>hold.reduce((a,h)=>a+h.w*h.r[t],0));
 const p=[100];r.forEach((x,t)=>p.push(p[t]*(1+x)));
 const d=SLV.s.C[0].d.slice(-(T+1)), m=metrics({p,d},rates.tbill5yAvg), lvl=m.srri;
 // what this exact plan would have done: monthly deposits into the weekly-rebalanced mix
 let V=inp.start,paid=inp.start;for(let t=0;t<T;t++){V*=1+r[t];if(Math.floor((t+1)*12/52)>Math.floor(t*12/52)){V+=M;paid+=M}}
 // looking ahead: bonds at today's 5-year government yield, stocks at the 7% long-run convention; range from measured swings
 const cautious=(s*7+b*rates.gov5y-inp.fee)/100, repeat=(m.cagr-inp.fee)/100, band=m.vol/100/Math.sqrt(Math.max(1,inp.years));
 const mid=projectMonthly(inp,cautious),lo=projectMonthly(inp,cautious-band),hi=projectMonthly(inp,cautious+band),end=mid.at(-1),rep=projectMonthly(inp,repeat).at(-1).bal;
 return {hold,d,m,lvl,V,paid,mid,lo,hi,end,rep};
}
