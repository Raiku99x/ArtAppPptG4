/* Video mode: set the length, set time per slide, set when each box lights up, then Play.
   Plays the deck by itself (auto-next + box highlights) so it can be screen-recorded. */
(function(){
const KEY='riftVideoV1', NS='http://www.w3.org/2000/svg';
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
let cfg;try{cfg=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!cfg||!Array.isArray(cfg.dur)||cfg.dur.length!==S.length)cfg={total:180,dur:split(180),marks:{}};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(cfg))}catch(e){}};
const sum=()=>cfg.dur.reduce((a,b)=>a+b,0);
function defaults(n,D){const a=Math.min(1.4,D*.2),b=Math.max(a,D-Math.min(1.2,D*.25));return Array.from({length:n},(_,j)=>+(a+(b-a)*j/Math.max(n,1)).toFixed(1))}
function marks(i){const n=targets(i).length,m=cfg.marks[i],D=cfg.dur[i];
 if(!m||!m.custom||m.t.length!==n)return defaults(n,D);
 return m.t.map(t=>clamp(t,0,Math.max(0,D-.5)))}
function setMark(i,j,t){const m=marks(i);m[j]=+clamp(t,0,Math.max(0,cfg.dur[i]-.5)).toFixed(1);cfg.marks[i]={custom:true,t:m};save()}

/* ---------- DOM ---------- */
const mk=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
const layer=mk('div');layer.id='vlayer';stageEl.appendChild(layer);
const nav=document.getElementById('nav');
const btn=mk('button',null,'&#9654; VIDEO');btn.id='vd';btn.title='Video mode (V)';nav.insertBefore(btn,nav.firstChild);
const modal=mk('div','vm');document.body.appendChild(modal);
const bar=mk('div');bar.id='vbar';document.body.appendChild(bar);
const cd=mk('div');cd.id='vcd';document.body.appendChild(cd);
const toastEl=mk('div');toastEl.id='vtoast';document.body.appendChild(toastEl);
let tT;function toast(m){toastEl.textContent=m;toastEl.classList.add('on');clearTimeout(tT);tT=setTimeout(()=>toastEl.classList.remove('on'),2600)}

/* ---------- state ---------- */
const V={mode:'idle',ret:'idle',paused:false,fsEntered:false};
const isInput=t=>t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);

/* ---------- setup panel (step 1: length, step 2: time per slide) ---------- */
function openSetup(){
 V.mode='setup';clearHL(true);layer.querySelectorAll('.hot,.vpop').forEach(x=>x.remove());bar.classList.remove('on');
 const tm=Math.floor(cfg.total/60),ts=cfg.total%60;
 modal.innerHTML=`<div class="vcard">
  <button class="vbtn vx" id="m-x" title="Close (Esc)">&#10005;</button>
  <h2>Video setup</h2><div class="sub">Set the length, split it across the slides, then play the deck as an auto-run video you can screen-record.</div>
  <h4><span>1</span>HOW LONG IS THE VIDEO?</h4>
  <div class="tot"><input type="number" id="m-min" min="0" max="59" value="${tm}"><em>min</em><input type="number" id="m-sec" min="0" max="59" value="${ts}"><em>sec</em></div>
  <h4><span>2</span>TIME PER SLIDE (SECONDS)</h4>
  <div class="vrows" id="m-rows"></div>
  <div class="vsum"><span id="m-sum"></span><span class="st" id="m-st"></span><button class="vbtn" id="m-split">Auto-split</button><button class="vbtn" id="m-fit">Fit to total</button></div>
  <div class="vfoot"><label><input type="checkbox" id="m-fs" checked> Go fullscreen when playing</label>
   <button class="vbtn" id="m-hl">3 &nbsp;Set box highlights &rarr;</button><button class="vbtn pri" id="m-play">&#9654; Play now</button></div></div>`;
 const rows=modal.querySelector('#m-rows');
 S.forEach((_,i)=>{const n=targets(i).length;
  const r=mk('div','vrow',`<span class="n">${i+1}</span><span class="t">${titleOf(i)}<small>${n?n+' box'+(n>1?'es':''):i===4?'live 3D map':'no boxes'}</small></span><input type="number" min="3" max="600" step="1" value="${cfg.dur[i]}"><u>s</u>`);
  r.querySelector('input').oninput=e=>{cfg.dur[i]=clamp(Math.round(+e.target.value)||3,3,600);save();refresh()};
  rows.appendChild(r)});
 const inputs=()=>[...rows.querySelectorAll('input')];
 function refresh(){const s=sum(),d=s-cfg.total;
  modal.querySelector('#m-sum').innerHTML=`Slides add up to <b>${fmt(s)}</b> &nbsp;&middot;&nbsp; target <b>${fmt(cfg.total)}</b>`;
  const st=modal.querySelector('#m-st');st.className='st '+(d===0?'ok':'bad');
  st.textContent=d===0?'MATCHES':(d>0?'+'+d+'s OVER':(-d)+'s SHORT')}
 function setTotal(){const m=clamp(Math.round(+modal.querySelector('#m-min').value)||0,0,59),s=clamp(Math.round(+modal.querySelector('#m-sec').value)||0,0,59);cfg.total=Math.max(S.length*3,m*60+s);save();refresh()}
 modal.querySelector('#m-min').oninput=setTotal;modal.querySelector('#m-sec').oninput=setTotal;
 const sync=()=>{inputs().forEach((x,i)=>x.value=cfg.dur[i]);refresh();save()};
 modal.querySelector('#m-split').onclick=()=>{setTotal();cfg.dur=split(cfg.total);sync()};
 modal.querySelector('#m-fit').onclick=()=>{setTotal();const s=sum(),f=cfg.total/s;cfg.dur=cfg.dur.map(x=>Math.max(3,Math.round(x*f)));const k=cfg.dur.indexOf(Math.max(...cfg.dur));cfg.dur[k]=Math.max(3,cfg.dur[k]+cfg.total-sum());sync()};
 modal.querySelector('#m-x').onclick=closeAll;
 modal.querySelector('#m-hl').onclick=()=>{setTotal();openEdit(cur()===0?1:cur())};
 modal.querySelector('#m-play').onclick=()=>{setTotal();startPlay(0,S.length-1,{cd:true,fs:modal.querySelector('#m-fs').checked,ret:'setup'})};
 refresh();modal.classList.add('on')}
function closeAll(){V.mode='idle';modal.classList.remove('on');bar.classList.remove('on');layer.querySelectorAll('.hot,.vpop').forEach(x=>x.remove());clearHL(true)}

/* ---------- highlight: thin outline draws itself + the box zooms a little ---------- */
const colorOf=el=>el.classList.contains('a')?'#e6cf8a':el.classList.contains('g')?'#6fd08c':'#3ddbc0';
const box=(el)=>{const r=el.getBoundingClientRect(),sr=stageEl.getBoundingClientRect(),k=sr.width/1280;return{x:(r.left-sr.left)/k,y:(r.top-sr.top)/k,w:r.width/k,h:r.height/k}};
let hl=null;
function clearHL(instant){if(!hl)return;const {el,ol}=hl;hl=null;
 el.classList.remove('vhl');if(el._vp){el.style.position='';el._vp=false}
 if(instant){ol.remove();return}
 ol.classList.add('out');setTimeout(()=>ol.remove(),320)}
function setHL(el){clearHL(false);if(!el)return;
 if(getComputedStyle(el).position==='static'){el.style.position='relative';el._vp=true}
 const b=box(el),gx=b.w*.0175+7,gy=b.h*.0175+7,x=b.x-gx,y=b.y-gy,w=b.w+2*gx,h=b.h+2*gy;
 const rad=(parseFloat(getComputedStyle(el).borderTopLeftRadius)||20)+8;
 const svg=document.createElementNS(NS,'svg');svg.setAttribute('class','vol');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
 Object.assign(svg.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px',color:colorOf(el)});
 const r=document.createElementNS(NS,'rect');[['x',1.5],['y',1.5],['width',w-3],['height',h-3],['rx',rad],['pathLength',1]].forEach(([k,v])=>r.setAttribute(k,v));
 svg.appendChild(r);layer.appendChild(svg);
 el.classList.add('vhl');hl={el,ol:svg}}

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
 bar.querySelector('#b-info').innerHTML=`Slide <b>${i+1}/${S.length}</b> &middot; ${n?n+' box'+(n>1?'es':''):'no boxes'} &middot; <b>${cfg.dur[i]}s</b> &nbsp; <small>(&larr; &rarr; to change slide)</small>`;
 ts.forEach((el,j)=>{const b=box(el),d=mk('div','hot',`<span class="bd"><i>${j+1}</i><span>${m[j].toFixed(1)}s</span></span>`);
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
 const p=mk('div','vpop',`<b>BOX ${j+1}</b><label>Animate at <input type="number" min="0" max="${cfg.dur[i]}" step="0.5" value="${m[j]}"> s</label><div class="row"><button class="vbtn" data-a="pv">&#9654; Preview</button><button class="vbtn pri" data-a="ok">Done</button></div>`);
 p.style.left=clamp(b.x+b.w/2-118,10,1280-246)+'px';p.style.top=clamp(b.y+b.h/2-50,10,720-140)+'px';
 const inp=p.querySelector('input');
 inp.oninput=()=>{const v=parseFloat(inp.value);if(isNaN(v))return;setMark(i,j,v);d.querySelector('.bd span').textContent=marks(i)[j].toFixed(1)+'s'};
 inp.onchange=()=>{inp.value=marks(i)[j]};
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
 const starts=[];let acc=0;for(let k=from;k<=to;k++){starts.push(acc);acc+=cfg.dur[k]}
 P={from,to,starts,total:acc,k:-1,e:0,last:0,evs:[],hi:-2,raf:0};
 go(from);
 const begin=()=>{ // restart the first slide's entrance animation so the video opens cleanly
  S[from].classList.remove('on');void S[from].offsetWidth;go(from);
  P.k=0;P.evs=evsFor(from);P.hi=-2;P.last=performance.now();P.raf=requestAnimationFrame(tick)};
 if(o.cd){let n=3;cd.className='on';cd.innerHTML=`<b>${n}</b><small>PRESS RECORD &middot; ESC TO STOP &middot; SPACE TO PAUSE</small>`;
  const t=setInterval(()=>{n--;if(n>0){cd.querySelector('b').textContent=n;return}clearInterval(t);cd.classList.add('fade');setTimeout(()=>{cd.className=''},380);begin()},1000);P.cdTimer=t}
 else begin()}
function evsFor(i){const ts=targets(i),m=marks(i);return ts.map((el,j)=>({el,t:m[j]})).sort((a,b)=>a.t-b.t)}
function tick(now){
 if(V.mode!=='play'||!P)return;
 if(!V.paused)P.e+=(now-P.last)/1000;P.last=now;
 if(P.e>=P.total){finish();return}
 let k=0;while(k<P.starts.length-1&&P.e>=P.starts[k+1])k++;
 if(k!==P.k){P.k=k;clearHL(false);go(P.from+k);P.evs=evsFor(P.from+k);P.hi=-2}
 const local=P.e-P.starts[k];let h=-1;P.evs.forEach((v,j)=>{if(v.t<=local)h=j});
 if(h!==P.hi){P.hi=h;setHL(h>=0?P.evs[h].el:null)}
 P.raf=requestAnimationFrame(tick)}
function stopPlay(){if(P){cancelAnimationFrame(P.raf);clearInterval(P.cdTimer)}P=null;cd.className='';clearHL(true);document.body.classList.remove('vplay');
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
  if(e.key==='Escape')abort();else if(e.key===' '){V.paused=!V.paused;if(!V.paused&&P)P.last=performance.now()}return}
 if(V.mode==='setup'){e.stopImmediatePropagation();if(e.key==='Escape')closeAll();return}
 if(V.mode==='edit'){if(e.key==='Escape'){const p=layer.querySelector('.vpop');if(p){clearHL(true);p.remove();layer.querySelectorAll('.hot').forEach(x=>x.classList.remove('sel'))}else openSetup();e.stopImmediatePropagation();return}
  if(e.key===' '||e.key==='f'||e.key==='F'){e.stopImmediatePropagation();e.preventDefault()}}
},true);
['touchstart','touchend'].forEach(t=>addEventListener(t,e=>{if(V.mode==='play'||V.mode==='setup')e.stopPropagation()},true));
window.__video={cfg,startPlay,openSetup,openEdit};   // handy for testing from the console
})();
