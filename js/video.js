/* Video mode: set the length, set time per slide, set when each box lights up, then Play.
   Plays the deck by itself (auto-next + box highlights) so it can be screen-recorded. */
(function(){
const KEY='riftVideoV2', NS='http://www.w3.org/2000/svg';
const stageEl=document.getElementById('stage');
const NOBOX=new Set([0,4]);                 // title + live-map slides have no boxes to animate
const SEL='.c,.tile,.out';
const targets=i=>NOBOX.has(i)?[]:[...S[i].querySelectorAll(SEL)];
const cur=()=>Math.max(0,S.findIndex(s=>s.classList.contains('on')));
const fmt=t=>{t=Math.max(0,Math.round(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const titleOf=i=>{const h=S[i].querySelector('h2');return h?h.textContent:(i===0?'Title slide':'Slide '+(i+1))};

/* ---------- saved settings ---------- */
const weights=()=>S.map((_,i)=>i===0?5:i===4?16:6+3*targets(i).length);
function split(total){const w=weights(),sum=w.reduce((a,b)=>a+b,0);const d=w.map(x=>Math.max(3,Math.round(total*x/sum)));d[4]=Math.max(3,d[4]+total-d.reduce((a,b)=>a+b,0));return d}
const N=S.length;
const cum=d=>{let a=0;return d.map(x=>{const r=a;a+=x;return r})};
let cfg;try{cfg=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!cfg||!Array.isArray(cfg.st)||cfg.st.length!==N){cfg={total:180,st:cum(split(180)),base:180,marks:{}}}
if(typeof cfg.vol!=='number')cfg.vol=.8;
if(typeof cfg.load!=='number')cfg.load=5;   // intro loading bar length in seconds (0 = off)
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(cfg))}catch(e){}};
/* ---------- music (optional mp3, remembered in this browser) ---------- */
const AU=new Audio();AU.preload='auto';AU.loop=true;let audName='';
function idb(mode,fn){return new Promise((res,rej)=>{const r=indexedDB.open('riftVideo',1);r.onupgradeneeded=()=>r.result.createObjectStore('a');
 r.onsuccess=()=>{const db=r.result,tx=db.transaction('a',mode),q=fn(tx.objectStore('a'));tx.oncomplete=()=>{res(q&&q.result);db.close()};tx.onerror=()=>rej(tx.error)};r.onerror=()=>rej(r.error)})}
function useBlob(blob,name){if(AU.src)URL.revokeObjectURL(AU.src);if(!blob){AU.removeAttribute('src');AU.load();audName='';return}AU.src=URL.createObjectURL(blob);audName=name||'music';AU.volume=cfg.vol}
try{idb('readonly',st=>st.get('bgm')).then(v=>{if(v&&v.blob){useBlob(v.blob,v.name);const f=document.getElementById('m-fn');if(f)f.textContent=audName}}).catch(()=>{})}catch(e){}
const hasAudio=()=>!!AU.getAttribute('src');
/* every slide has a START TIME on the whole video's clock (slide 1 = 0:00). A slide lasts until the next one starts; the last one lasts until the end. */
const endOf=i=>i<N-1?cfg.st[i+1]:cfg.total;
const durOf=i=>endOf(i)-cfg.st[i];
const fmtT=t=>{t=Math.max(0,t);const m=Math.floor(t/60),x=+(t-m*60).toFixed(1);return m+':'+(x<10?'0':'')+x};
const parseT=v=>{v=String(v).trim().replace(',','.');if(!v)return NaN;if(v.includes(':')){const [a,b]=v.split(':');const m=parseFloat(a),x=parseFloat(b||0);return isNaN(m)||isNaN(x)?NaN:m*60+x}return parseFloat(v)};
function fixStarts(){const MIN=3;cfg.st[0]=0;for(let i=1;i<N;i++){cfg.st[i]=Math.round(clamp(cfg.st[i],cfg.st[i-1]+MIN,cfg.total-MIN*(N-i)))}}
function defaults(n,D){const a=Math.min(1.4,D*.2),b=Math.max(a,D-Math.min(1.2,D*.25));return Array.from({length:n},(_,j)=>+(a+(b-a)*j/Math.max(n,1)).toFixed(1))}
function marks(i){const n=targets(i).length,m=cfg.marks[i],a=cfg.st[i],D=durOf(i),hi=a+Math.max(0,D-.5);   // absolute times (whole-video clock)
 if(!m||!m.custom||m.t.length!==n)return defaults(n,D).map(x=>+(a+x).toFixed(1));
 return m.t.map(t=>clamp(t,a,hi))}
function setMark(i,j,t){const m=marks(i),a=cfg.st[i];m[j]=+clamp(t,a,a+Math.max(0,durOf(i)-.5)).toFixed(1);cfg.marks[i]={custom:true,t:m};save()}

/* ---------- DOM ---------- */
const mk=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
const layer=mk('div');layer.id='vlayer';stageEl.appendChild(layer);
const nav=document.getElementById('nav');
const btn=mk('button',null,'&#9654; VIDEO');btn.id='vd';btn.title='Video mode (V)';nav.insertBefore(btn,nav.firstChild);
const modal=mk('div','vm');document.body.appendChild(modal);
const vl=mk('div','vload','<span class="lb"></span><div class="tr"><i class="fl"></i></div>');S[0].appendChild(vl);
const vfl=vl.querySelector('.fl'),vlb=vl.querySelector('.lb');
/* realistic loading: quick start, bursts, slow crawls and a couple of short stalls, always landing on 100% exactly when the time is up */
const LC=[[0,0],[.05,.07],[.14,.19],[.19,.2],[.3,.41],[.36,.43],[.40,.43],[.43,.44],[.55,.69],[.62,.71],[.70,.71],[.74,.72],[.84,.9],[.92,.94],[.95,.95],[.975,.99],[1,1]];
const loadCurve=p=>{for(let k=1;k<LC.length;k++){if(p<=LC[k][0]){const [x0,y0]=LC[k-1],[x1,y1]=LC[k],u=(p-x0)/(x1-x0);return y0+(y1-y0)*(u*u*(3-2*u)*.35+u*.65)}}return 1};
function loadUpdate(t){const L=Math.min(cfg.load,durOf(0));if(!(L>0)){vl.classList.remove('on');return}
 const p=clamp(t/L,0,1),e=loadCurve(p),n=Math.floor(e*100);vfl.style.width=(e*100)+'%';
 vlb.innerHTML=n>=100?'READY &middot; ENTER THE RIFT':'LOADING THE RIFT &middot; '+n+'%';vl.classList.toggle('on',t<L+.9)}
function loadHide(){vl.classList.remove('on');vfl.style.width='0'}
const bar=mk('div');bar.id='vbar';document.body.appendChild(bar);
const cd=mk('div');cd.id='vcd';document.body.appendChild(cd);
const toastEl=mk('div');toastEl.id='vtoast';document.body.appendChild(toastEl);
let tT;function toast(m){toastEl.textContent=m;toastEl.classList.add('on');clearTimeout(tT);tT=setTimeout(()=>toastEl.classList.remove('on'),2600)}

/* ---------- state ---------- */
const V={mode:'idle',ret:'idle',paused:false,fsEntered:false};
const isInput=t=>t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);

/* ---------- setup panel (step 1: length, step 2: time per slide) ---------- */
function openSetup(){
 AU.pause();V.mode='setup';clearHL(true);layer.querySelectorAll('.hot,.vpop').forEach(x=>x.remove());bar.classList.remove('on');
 const tm=Math.floor(cfg.total/60),ts=cfg.total%60;
 modal.innerHTML=`<div class="vcard">
  <button class="vbtn vx" id="m-x" title="Close (Esc)">&#10005;</button>
  <h2>Video setup</h2><div class="sub">Set the length, split it across the slides, then play the deck as an auto-run video you can screen-record.</div>
  <h4><span>1</span>HOW LONG IS THE VIDEO?</h4>
  <div class="tot"><input type="number" id="m-min" min="0" max="59" value="${tm}"><em>min</em><input type="number" id="m-sec" min="0" max="59" value="${ts}"><em>sec</em></div>
  <h4><span>2</span>WHEN DOES EACH SLIDE START? (m:ss ON THE VIDEO CLOCK)</h4>
  <div class="vrows" id="m-rows"></div>
  <h4><span>&#8987;</span>INTRO LOADING BAR</h4>
  <div class="tot"><input type="number" id="m-load" min="0" max="120" step="1" value="${cfg.load}"><em>sec</em><span class="fn" id="m-lh" style="color:var(--mut);font-size:12px"></span></div>
  <h4><span>&#9835;</span>MUSIC (OPTIONAL)</h4>
  <div class="vmusic"><label class="vbtn" for="m-file">Choose MP3&hellip;</label><input type="file" id="m-file" accept="audio/*,.mp3" hidden>
   <span class="fn" id="m-fn">${audName||'No music chosen'}</span><button class="vbtn" id="m-prev">&#9654; Preview</button><button class="vbtn" id="m-rm">Remove</button>
   <label class="vlv">Volume <input type="range" id="m-vol" min="0" max="100" value="${Math.round(cfg.vol*100)}"></label></div>
  <div class="vsum"><span id="m-sum"></span><button class="vbtn" id="m-split">Auto-split</button><button class="vbtn" id="m-fit">Scale to total</button></div>
  <div class="vfoot"><label><input type="checkbox" id="m-fs" checked> Go fullscreen when playing</label>
   <button class="vbtn" id="m-hl">3 &nbsp;Set box highlights &rarr;</button><button class="vbtn pri" id="m-play">&#9654; Play now</button></div></div>`;
 const rows=modal.querySelector('#m-rows');
 const bx=i=>{const n=targets(i).length;return n?n+' box'+(n>1?'es':''):i===4?'live 3D map':'no boxes'};
 S.forEach((_,i)=>{
  const r=mk('div','vrow',`<span class="n">${i+1}</span><span class="t">${titleOf(i)}<small></small></span><input type="text" inputmode="decimal" value="${fmtT(cfg.st[i])}" ${i===0?'disabled':''}><u>start</u>`);
  r.querySelector('input').onchange=e=>{const v=parseT(e.target.value);if(!isNaN(v)){cfg.st[i]=Math.round(v);fixStarts();save()}sync()};
  rows.appendChild(r)});
 const inputs=()=>[...rows.querySelectorAll('input')];
 function refresh(){
  modal.querySelector('#m-sum').innerHTML=`Video length <b>${fmt(cfg.total)}</b> &nbsp;&middot;&nbsp; last slide ends at the end`;
  modal.querySelector('#m-lh').textContent='Fills across the title slide (max '+durOf(0)+'s, the title slide\'s length). 0 = off.';
  [...rows.children].forEach((r,i)=>{r.querySelector('small').textContent=bx(i)+' \u00b7 '+fmt(cfg.st[i])+'\u2013'+fmt(endOf(i))+' ('+durOf(i)+'s)'})}
 function setTotal(){const m=clamp(Math.round(+modal.querySelector('#m-min').value)||0,0,59),s=clamp(Math.round(+modal.querySelector('#m-sec').value)||0,0,59);cfg.total=Math.max(N*3,m*60+s);fixStarts();save();sync()}
 modal.querySelector('#m-load').oninput=e=>{cfg.load=clamp(Math.round(+e.target.value)||0,0,120);save()};
 modal.querySelector('#m-min').oninput=setTotal;modal.querySelector('#m-sec').oninput=setTotal;
 const sync=()=>{inputs().forEach((x,i)=>x.value=fmtT(cfg.st[i]));refresh();save()};
 modal.querySelector('#m-split').onclick=()=>{setTotal();cfg.st=cum(split(cfg.total));cfg.base=cfg.total;fixStarts();sync()};
 modal.querySelector('#m-fit').onclick=()=>{const f=cfg.total/(cfg.base||cfg.total);cfg.st=cfg.st.map(x=>x*f);cfg.base=cfg.total;fixStarts();sync()};
 const fnEl=modal.querySelector('#m-fn'),pv=modal.querySelector('#m-prev');
 const lab=()=>{fnEl.textContent=audName||'No music chosen';pv.style.display=audName?'':'none';modal.querySelector('#m-rm').style.display=audName?'':'none'};
 modal.querySelector('#m-file').onchange=e=>{const f=e.target.files[0];if(!f)return;useBlob(f,f.name);lab();try{idb('readwrite',st=>st.put({blob:f,name:f.name},'bgm')).catch(()=>{})}catch(x){}toast('Music added: '+f.name)};
 modal.querySelector('#m-rm').onclick=()=>{AU.pause();useBlob(null);try{idb('readwrite',st=>st.delete('bgm')).catch(()=>{})}catch(x){}lab()};
 modal.querySelector('#m-vol').oninput=e=>{cfg.vol=+e.target.value/100;AU.volume=cfg.vol;save()};
 pv.onclick=()=>{if(AU.paused){AU.currentTime=0;AU.volume=cfg.vol;AU.play().catch(()=>{});pv.innerHTML='&#9632; Stop'}else{AU.pause();pv.innerHTML='&#9654; Preview'}};
 lab();
 modal.querySelector('#m-x').onclick=closeAll;
 modal.querySelector('#m-hl').onclick=()=>{setTotal();openEdit(cur()===0?1:cur())};
 modal.querySelector('#m-play').onclick=()=>{setTotal();startPlay(0,S.length-1,{cd:true,fs:modal.querySelector('#m-fs').checked,ret:'setup'})};
 refresh();modal.classList.add('on')}
function closeAll(){AU.pause();V.mode='idle';modal.classList.remove('on');bar.classList.remove('on');layer.querySelectorAll('.hot,.vpop').forEach(x=>x.remove());clearHL(true)}

/* ---------- highlight: thin outline draws itself + the box zooms a little ---------- */
const colorOf=el=>el.classList.contains('a')?'#e6cf8a':el.classList.contains('g')?'#6fd08c':'#3ddbc0';
const box=(el)=>{const r=el.getBoundingClientRect(),sr=stageEl.getBoundingClientRect(),k=sr.width/1280;return{x:(r.left-sr.left)/k,y:(r.top-sr.top)/k,w:r.width/k,h:r.height/k}};
let hl=null;
function clearHL(instant){if(!hl)return;const {el,ol,dim}=hl;hl=null;
 dim.forEach(d=>{d.classList.remove('vdim');d.classList.add('vundim');setTimeout(()=>d.classList.remove('vundim'),800)});
 el.classList.remove('vhl');if(el._vp){el.style.position='';el._vp=false}
 if(instant){ol.remove();return}
 ol.classList.add('out');setTimeout(()=>ol.remove(),320)}
function setHL(el){clearHL(false);if(!el)return;
 if(getComputedStyle(el).position==='static'){el.style.position='relative';el._vp=true}
 const cs=getComputedStyle(el),acc=parseFloat(cs.borderLeftWidth)>=4;      // card with a coloured bar on its left side
 const b=box(el),Z=.0175,gx=b.w*Z+(acc?0:7),gy=b.h*Z+(acc?0:7),x=b.x-gx,y=b.y-gy,w=b.w+2*gx,h=b.h+2*gy;
 const rad=(parseFloat(cs.borderTopLeftRadius)||20)*(acc?1.035:1)+(acc?0:8);
 const svg=document.createElementNS(NS,'svg');svg.setAttribute('class','vol');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
 Object.assign(svg.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px',color:acc?cs.borderLeftColor:colorOf(el)});
 const x0=1,y0=1,x1=w-1,y1=h-1,r=Math.min(rad,(h-2)/2-1),ym=h/2;
 /* accent cards: the left bar is the card's own and stays as it is; the thin outline starts where its top and bottom curves end and spreads right.
    other boxes: a thick line draws on the left first, then the thin outline runs out of it. */
 const sx=x0+r*.134,sy=r*.5;   // start 30deg up the corner, where the card's own bar is still ~4px thick, so the outline grows out of it with no gap
 const D=acc?{t:`M${sx} ${y0+r-sy}A${r} ${r} 0 0 1 ${x0+r} ${y0}L${x1-r} ${y0}A${r} ${r} 0 0 1 ${x1} ${y0+r}L${x1} ${ym}`,
              b:`M${sx} ${y1-r+sy}A${r} ${r} 0 0 0 ${x0+r} ${y1}L${x1-r} ${y1}A${r} ${r} 0 0 0 ${x1} ${y1-r}L${x1} ${ym}`}
  :{l1:`M${x0} ${ym}L${x0} ${y0+r}`,l2:`M${x0} ${ym}L${x0} ${y1-r}`,
  t:`M${x0} ${y0+r}A${r} ${r} 0 0 1 ${x0+r} ${y0}L${x1-r} ${y0}A${r} ${r} 0 0 1 ${x1} ${y0+r}L${x1} ${ym}`,
  b:`M${x0} ${y1-r}A${r} ${r} 0 0 0 ${x0+r} ${y1}L${x1-r} ${y1}A${r} ${r} 0 0 0 ${x1} ${y1-r}L${x1} ${ym}`};
 Object.entries(D).forEach(([k,d])=>{const q=document.createElementNS(NS,'path');q.setAttribute('d',d);q.setAttribute('pathLength',1);q.setAttribute('class',k[0]+(acc?' acc':''));svg.appendChild(q)});
 if(acc)svg.style.transform='scale('+(1/1.035)+')';   // same start size as the un-zoomed card
 layer.appendChild(svg);
 if(acc){void svg.getBoundingClientRect();svg.style.transition='transform .55s cubic-bezier(.2,.8,.2,1)';svg.style.transform='scale(1)'}   // zooms exactly with the card
 el.classList.add('vhl');
 const dim=targets(cur()).filter(x=>x!==el);dim.forEach(d=>{d.classList.remove('vundim');d.classList.add('vdim')});   // the other boxes shrink a little while this one zooms
 hl={el,ol:svg,dim}}

/* ---------- step 3: pick a box, set its timestamp ---------- */
let sel=-1,editIdx=1,tmr=[],hots=[],trk=0;
function openEdit(i){
 V.mode='edit';modal.classList.remove('on');editIdx=i;if(cur()!==i)go(i);
 bar.innerHTML=`<button class="vbtn" id="b-back">&larr; Timing</button><span class="info" id="b-info"></span><button class="vbtn" id="b-test">&#9654; Test slide</button><button class="vbtn pri" id="b-play">&#9654; Play video</button><button class="vbtn" id="b-x" title="Close">&#10005;</button>`;
 bar.classList.add('on');
 bar.querySelector('#b-back').onclick=openSetup;
 bar.querySelector('#b-x').onclick=closeAll;
 bar.querySelector('#b-test').onclick=()=>startPlay(cur(),cur(),{cd:false,fs:false,ret:'edit'});
 bar.querySelector('#b-play').onclick=()=>startPlay(0,S.length-1,{cd:true,fs:true,ret:'edit'});
 renderEdit()}
function renderEdit(){
 if(V.mode!=='edit')return;
 layer.querySelectorAll('.hot,.vpop').forEach(x=>x.remove());sel=-1;hots=[];
 const i=cur(),ts=targets(i),m=marks(i),n=ts.length;
 bar.querySelector('#b-info').innerHTML=`Slide <b>${i+1}/${S.length}</b> &middot; ${n?n+' box'+(n>1?'es':''):'no boxes'} &middot; <b>${fmt(cfg.st[i])}&ndash;${fmt(endOf(i))}</b> &nbsp; <small>(&larr; &rarr; to change slide)</small>`;
 ts.forEach((el,j)=>{const b=box(el),d=mk('div','hot',`<span class="bd"><i>${j+1}</i><span>${fmtT(m[j])}</span></span>`);
  Object.assign(d.style,{left:b.x+'px',top:b.y+'px',width:b.w+'px',height:b.h+'px',borderRadius:(parseFloat(getComputedStyle(el).borderTopLeftRadius)||20)+'px'});
  d.onclick=e=>{e.stopPropagation();openPop(j,d,el)};layer.appendChild(d);hots.push([d,el])});
 if(!trk)trk=requestAnimationFrame(follow);
 if(!n)toast(i===4?'Slide 5 is the live 3D map: it just uses its time':'This slide has no boxes: it just uses its time')}
function follow(){trk=0;if(V.mode!=='edit')return;
 hots.forEach(([d,el])=>{if(el===(hl&&hl.el))return;const b=box(el);d.style.left=b.x+'px';d.style.top=b.y+'px';d.style.width=b.w+'px';d.style.height=b.h+'px'});
 trk=requestAnimationFrame(follow)}
function openPop(j,d,el){
 layer.querySelectorAll('.vpop').forEach(x=>x.remove());layer.querySelectorAll('.hot').forEach(x=>x.classList.remove('sel'));d.classList.add('sel');sel=j;
 const i=cur(),b=box(el),m=marks(i);
 const p=mk('div','vpop',`<b>BOX ${j+1}</b><label>Animate at <input type="text" inputmode="decimal" value="${fmtT(m[j])}"></label><small style="display:block;margin-top:6px;color:#8a98ad">m:ss &middot; this slide runs ${fmtT(cfg.st[i])}&ndash;${fmtT(endOf(i))}</small><div class="row"><button class="vbtn" data-a="pv">&#9654; Preview</button><button class="vbtn pri" data-a="ok">Done</button></div>`);
 p.style.left=clamp(b.x+b.w/2-118,10,1280-246)+'px';p.style.top=clamp(b.y+b.h/2-50,10,720-140)+'px';
 const inp=p.querySelector('input');
 inp.oninput=()=>{const v=parseT(inp.value);if(isNaN(v))return;setMark(i,j,v);d.querySelector('.bd span').textContent=fmtT(marks(i)[j])};
 inp.onchange=()=>{inp.value=fmtT(marks(i)[j])};
 p.querySelector('[data-a=pv]').onclick=()=>{setHL(el);setTimeout(()=>{if(V.mode==='edit')clearHL(false)},2600)};
 p.querySelector('[data-a=ok]').onclick=()=>{clearHL(true);p.remove();d.classList.remove('sel');sel=-1};
 p.onclick=e=>e.stopPropagation();layer.appendChild(p);inp.focus();inp.select()}
// when the slide changes (arrows / buttons) rebuild the boxes for the new slide
const after=()=>{tmr.forEach(clearTimeout);tmr=[];if(V.mode!=='edit')return;clearHL(true);layer.querySelectorAll('.hot,.vpop').forEach(x=>x.remove());hots=[];tmr=[setTimeout(renderEdit,250),setTimeout(renderEdit,1300)]};
let lastOn=cur();
new MutationObserver(()=>{const c=cur();if(c!==lastOn){lastOn=c;after()}}).observe(stageEl,{attributes:true,subtree:true,attributeFilter:['class']});
addEventListener('resize',()=>{if(V.mode==='edit')setTimeout(renderEdit,120)});

/* ---------- play: auto-next + fire highlights on their timestamps ---------- */
let P=null;
function startPlay(from,to,o){
 V.ret=o.ret;V.mode='play';V.paused=false;modal.classList.remove('on');bar.classList.remove('on');
 layer.querySelectorAll('.hot,.vpop').forEach(x=>x.remove());clearHL(true);document.body.classList.add('vplay');
 if(o.fs&&!document.fullscreenElement&&document.documentElement.requestFullscreen){try{document.documentElement.requestFullscreen().then(()=>V.fsEntered=true).catch(()=>{})}catch(e){}}
 const starts=[];let acc=0;for(let k=from;k<=to;k++){starts.push(acc);acc+=durOf(k)}
 P={from,to,starts,total:acc,k:-1,e:0,last:0,evs:[],hi:-2,raf:0,aud:hasAudio()&&from===0&&to===S.length-1};
 if(P.aud&&o.cd){AU.volume=0;AU.play().then(()=>{AU.pause();AU.currentTime=0}).catch(()=>{})}   // unlock audio while the click is fresh
 go(from);
 const begin=()=>{ // restart the first slide's entrance animation so the video opens cleanly
  S[from].classList.remove('on');void S[from].offsetWidth;go(from);
  if(P.aud){AU.pause();AU.currentTime=0;AU.volume=cfg.vol;AU.play().catch(()=>toast('Audio was blocked by the browser. Click the page once and replay.'))}
  P.k=0;P.evs=evsFor(from);P.hi=-2;P.last=performance.now();P.raf=requestAnimationFrame(tick)};
 if(o.cd){let n=5;cd.className='on';cd.innerHTML=`<b>${n}</b><small>PRESS RECORD &middot; ESC TO STOP &middot; SPACE TO PAUSE</small>`;
  const t=setInterval(()=>{n--;if(n>0){cd.querySelector('b').textContent=n;return}clearInterval(t);cd.classList.add('fade');setTimeout(()=>{cd.className=''},380);begin()},1000);P.cdTimer=t}
 else begin()}
function evsFor(i){const ts=targets(i),m=marks(i);return ts.map((el,j)=>({el,t:m[j]-cfg.st[i]})).sort((a,b)=>a.t-b.t)}
function tick(now){
 if(V.mode!=='play'||!P)return;
 if(!V.paused)P.e+=(now-P.last)/1000;P.last=now;
 if(P.e>=P.total){finish();return}
 if(P.aud&&!V.paused){const left=P.total-P.e;AU.volume=cfg.vol*Math.min(1,left/2)}   // fade out over the last 2 s
 let k=0;while(k<P.starts.length-1&&P.e>=P.starts[k+1])k++;
 if(k!==P.k){P.k=k;clearHL(false);go(P.from+k);P.evs=evsFor(P.from+k);P.hi=-2}
 const local=P.e-P.starts[k];if(P.from+k===0)loadUpdate(local);else loadHide();let h=-1;P.evs.forEach((v,j)=>{if(v.t<=local)h=j});
 if(h!==P.hi){P.hi=h;setHL(h>=0?P.evs[h].el:null)}
 P.raf=requestAnimationFrame(tick)}
function stopPlay(){loadHide();if(P){cancelAnimationFrame(P.raf);clearInterval(P.cdTimer)}P=null;AU.pause();AU.currentTime=0;AU.volume=cfg.vol;cd.className='';clearHL(true);document.body.classList.remove('vplay');
 if(V.fsEntered&&document.fullscreenElement){try{document.exitFullscreen()}catch(e){}}V.fsEntered=false}
function finish(){const r=V.ret;setTimeout(()=>{if(V.mode!=='play')return;stopPlay();back(r)},900);cancelAnimationFrame(P.raf);P.raf=0}
function back(r){if(r==='edit')openEdit(cur());else if(r==='setup')openSetup();else V.mode='idle'}
function abort(){const r=V.ret;stopPlay();back(r)}
document.addEventListener('fullscreenchange',()=>{if(V.mode==='play'&&V.fsEntered&&!document.fullscreenElement){V.fsEntered=false;abort()}});

/* ---------- keys / touch ---------- */
btn.onclick=e=>{e.stopPropagation();openSetup()};
addEventListener('keydown',e=>{
 if(isInput(e.target)){if(e.key==='Escape'||e.key==='Enter')e.target.blur();e.stopPropagation();return}
 if(V.mode==='idle'){if((e.key==='v'||e.key==='V')&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.stopImmediatePropagation();e.preventDefault();openSetup()}return}
 if(V.mode==='play'){e.stopImmediatePropagation();e.preventDefault();
  if(e.key==='Escape')abort();else if(e.key===' '){V.paused=!V.paused;if(!V.paused&&P)P.last=performance.now();if(P&&P.aud&&P.k>=0){V.paused?AU.pause():AU.play().catch(()=>{})}}return}
 if(V.mode==='setup'){e.stopImmediatePropagation();if(e.key==='Escape')closeAll();return}
 if(V.mode==='edit'){if(e.key==='Escape'){const p=layer.querySelector('.vpop');if(p){clearHL(true);p.remove();layer.querySelectorAll('.hot').forEach(x=>x.classList.remove('sel'))}else openSetup();e.stopImmediatePropagation();return}
  if(e.key===' '||e.key==='f'||e.key==='F'){e.stopImmediatePropagation();e.preventDefault()}}
},true);
['touchstart','touchend'].forEach(t=>addEventListener(t,e=>{if(V.mode==='play'||V.mode==='setup')e.stopPropagation()},true));
window.__video={cfg,startPlay,openSetup,openEdit,AU};   // handy for testing from the console
})();
