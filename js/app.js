const IMG={s01:'assets/img/s01.jpg',s02:'assets/img/s02.jpg',s03:'assets/img/s03.jpg',s04:'assets/img/s04.jpg',s05:'assets/img/s05.jpg',s06:'assets/img/s06.jpg',s07:'assets/img/s07.jpg',s08:'assets/img/s08.jpg',s09:'assets/img/s09.jpg',s10:'assets/img/s10.jpg',s11:'assets/img/s11.jpg',s12:'assets/img/s12.jpg',s13:'assets/img/s13.jpg',s14:'assets/img/s14.jpg',bg:'assets/img/bg.jpg',c_talvyr:'assets/img/c_talvyr.jpg',c_seraphel:'assets/img/c_seraphel.jpg',c_vael:'assets/img/c_vael.jpg',c_auren9:'assets/img/c_auren9.jpg',c_durgan:'assets/img/c_durgan.jpg',c_thorne:'assets/img/c_thorne.jpg',c_nyxara:'assets/img/c_nyxara.jpg',c_brakka:'assets/img/c_brakka.jpg',c_ghurol:'assets/img/c_ghurol.jpg',c_grumm:'assets/img/c_grumm.jpg'};
const $=s=>document.querySelector(s);
document.querySelectorAll('[data-k]').forEach(e=>e.src=IMG[e.dataset.k]);
document.querySelectorAll('.anim').forEach(sec=>{const f=document.createElement('div');f.className='fx';let h='<span class="fog a"></span><span class="fog b"></span><span class="sweep"></span>';
 for(let n=0;n<26;n++){const z=(1.5+Math.random()*3).toFixed(1),c=Math.random()<.6?'#f5c46a':'#6fe3d6';h+=`<i style="left:${(Math.random()*100).toFixed(1)}%;--z:${z}px;--c:${c};--x:${(Math.random()*160-80).toFixed(0)}px;--d:${(9+Math.random()*10).toFixed(1)}s;--l:-${(Math.random()*18).toFixed(1)}s"></i>`}
 f.innerHTML=h;const sh=sec.querySelector('.shade');sh?sh.after(f):sec.prepend(f)});
document.querySelectorAll('[data-bg]').forEach(e=>e.style.backgroundImage=`url(${IMG[e.dataset.bg]})`);
// loading screen
const BL=[['John Eric','talvyr',['Flash','Heal']],['Aubrey Ace','seraphel',['Flash','Cleanse']],['John Lhoel','vael',['Flash','Ignite']],['Zaldy','auren9',['Flash','Barrier']],['Corinne Miles','durgan',['Exhaust','Barrier']]];
const RD=[['Pestaño','thorne',['Flash','Ignite']],['Morales','nyxara',['Flash','Ghost']],['Morillo','brakka',['Flash','Smite']],['Maomay','ghurol',['Smite','Ghost']],['Orap','grumm',['Flash','Exhaust']]];
const IC={
Flash:'<path d="M13 2 5 13h6l-1 9 9-12h-6z"/>',
Ignite:'<path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z"/>',
Heal:'<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
Barrier:'<path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z"/>',
Smite:'<path d="M14 3h7v7L10 21l-3-3-3-1 1-3z M4 20l3-3"/>',
Cleanse:'<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z M9.5 14a2.5 2.5 0 0 0 2.5 2.5"/>',
Exhaust:'<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
Ghost:'<path d="M5 21V11a7 7 0 0 1 14 0v10l-3-2-2 2-2-2-2 2-2-2z M9.5 11h.01M14.5 11h.01"/>'};
const card=(p,k)=>`<div class="pc" style="--i:${k}"><img src="${IMG['c_'+p[1]]}" alt=""><div class="ov"></div><span class="pp">0%</span><div class="plate"><div class="spells">${p[2].map(s=>`<span class="sp" style="--i:${k}"><svg viewBox="0 0 24 24">${IC[s]}</svg></span>`).join('')}</div><div class="ign">${p[0]}</div><div class="hero">${p[1].replace('auren9','auren-9').toUpperCase()}</div><div class="pb"><i></i></div></div></div>`;
function ld(){const d=document.createElement('div');d.className='ld';
 d.innerHTML=`<div class="bgi" style="background-image:url(${IMG.bg})"></div><div class="vig"></div><h1>BATTLE FOR THE RIFT</h1><div class="row t">${BL.map((p,k)=>card(p,k)).join('')}</div><div class="row b">${RD.map((p,k)=>card(p,k)).join('')}</div><div class="ft">Loading the Rift... <em>0%</em></div>`;return d}
document.querySelectorAll('.mini').forEach(m=>m.appendChild(ld()));
// live loading screen + map fx
(function(){
 document.querySelectorAll('.ld').forEach(d=>{const f=document.createElement('div');f.className='fx';let h='<span class="sweep"></span>';
  for(let n=0;n<30;n++){const z=(2+Math.random()*4).toFixed(1),c=Math.random()<.6?'#f5c46a':'#6fe3d6';h+=`<i style="left:${(Math.random()*100).toFixed(1)}%;--z:${z}px;--c:${c};--x:${(Math.random()*160-80).toFixed(0)}px;--d:${(8+Math.random()*8).toFixed(1)}s;--l:-${(Math.random()*16).toFixed(1)}s"></i>`}
  f.innerHTML=h;d.querySelector('.vig').after(f)});
 const mp=document.getElementById('mapph');if(mp){
  const T=[[72,125],[170,95],[267,75],[390,97],[481,128]],B=[[72,125],[156,219],[256,288],[400,225],[481,128]];
  const pth=a=>'M'+a.map(p=>p.join(' ')).join(' L');
  const dots=(id,col,rev,n)=>{let o='';for(let k=0;k<n;k++){o+=`<circle class="mn" r="3.2" fill="${col}" style="color:${col}"><animateMotion dur="9s" begin="-${(k*9/n).toFixed(1)}s" repeatCount="indefinite" keyPoints="${rev?'1;0':'0;1'}" keyTimes="0;1" calcMode="linear"><mpath href="#${id}"/></animateMotion></circle>`}return o};
  mp.insertAdjacentHTML('beforeend',`<svg viewBox="0 0 556 313" preserveAspectRatio="none">
   <circle class="ring" cx="261" cy="201" r="9" stroke="#f5c46a" style="animation-delay:-.6s"/>
   </svg>`);
  const f=document.createElement('div');f.className='fx';let h='<span class="sweep"></span>';for(let n=0;n<14;n++){h+=`<i style="left:${(Math.random()*100).toFixed(1)}%;--z:${(2+Math.random()*3).toFixed(1)}px;--c:#f5c46a;--x:${(Math.random()*100-50).toFixed(0)}px;--d:${(8+Math.random()*7).toFixed(1)}s;--l:-${(Math.random()*14).toFixed(1)}s"></i>`}f.innerHTML=h;mp.appendChild(f)}
 let T0=null;const lsec=document.querySelector('.mini')?.closest('.s');if(lsec)new MutationObserver(()=>{T0=lsec.classList.contains('on')?performance.now()+1000:null}).observe(lsec,{attributes:true,attributeFilter:['class']});
 const TM=[5.2,6.8,4.6,7.4,5.9,6.3,4.9,7.0,5.5,6.6],FR=TM.map(t=>.7+.3*(t-4.6)/2.8);   // each card finishes a little apart; the last one lands exactly at 18 s
 const LD=[...document.querySelectorAll('.ld')].map(d=>({pb:[...d.querySelectorAll('.pb i')],pp:[...d.querySelectorAll('.pp')],ft:d.querySelector('.ft')}));
 (function tick(){const n=performance.now(),p=(T0==null||n<T0)?0:Math.min(100,((n-T0)%32000)/18000*100);
  LD.forEach(L=>{let sum=0;L.pb.forEach((e,j)=>{const v=Math.round(Math.min(100,p/FR[j]));e.style.width=v+'%';L.pp[j].textContent=v+'%';sum+=v});
   const a=Math.round(sum/L.pb.length);L.ft.innerHTML=a>=100?'Everyone is ready. <em>Enter the Rift</em>':'Loading the Rift... <em>'+a+'%</em>'});
  requestAnimationFrame(tick)})();
})();
// live 3D map showcase on slide 5: map/index.html?showcase=1 flies a 37 s drone tour. Needs a web server (GitHub Pages / python -m http.server); from file:// the still image stays.
(function(){const ph=document.getElementById('mapph');let fr=null,ready=false,on=false;
 const msg=c=>{try{fr.contentWindow.postMessage({rift:'show',cmd:c},'*')}catch(e){}};
 function mk(){if(fr||location.protocol==='file:'||!ph)return;fr=document.createElement('iframe');fr.src='map/index.html?showcase=1';fr.title='Live 3D map showcase';fr.setAttribute('aria-hidden','true');fr.tabIndex=-1;ph.appendChild(fr)}
 addEventListener('message',e=>{if(fr&&e.source===fr.contentWindow&&e.data&&e.data.rift==='ready'){ready=true;ph.classList.add('live');if(on)msg('start')}});
 window.mapSync=function(i){if(i>=3)mk();const now=i===4;if(now&&!on){on=true;if(ready)msg('start')}else if(!now&&on){on=false;if(ready)msg('stop')}}})();
// deck
const S=[...document.querySelectorAll('.s')],st=$('#stage');let i=0;
function fit(){const k=Math.min(innerWidth/1280,innerHeight/720);st.style.transform=`translate(${(innerWidth-1280*k)/2}px,${(innerHeight-720*k)/2}px) scale(${k})`}
function go(n){i=Math.max(0,Math.min(S.length-1,n));S.forEach((s,k)=>s.classList.toggle('on',k===i));
 S[i].querySelectorAll('.rise').forEach((e,k)=>e.style.setProperty('--i',k));
 $('#cnt').textContent=String(i+1).padStart(2,'0')+' / '+String(S.length).padStart(2,'0');
 $('#chrome').classList.toggle('hide',S[i].dataset.chrome==='0');$('#bar').style.width=(i+1)/S.length*100+'%';history.replaceState(null,'','#'+(i+1));window.mapSync&&mapSync(i)}
addEventListener('resize',fit);fit();
addEventListener('keydown',e=>{if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();go(i+1)}else if(['ArrowLeft','PageUp'].includes(e.key))go(i-1);else if(e.key==='Home')go(0);else if(e.key==='End')go(S.length-1);else if(e.key==='f'||e.key==='F')fs()});
function fs(){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}
$('#pv').onclick=()=>go(i-1);$('#nx').onclick=()=>go(i+1);$('#fs').onclick=fs;
let tx=0;addEventListener('touchstart',e=>tx=e.touches[0].clientX);addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-tx;if(Math.abs(d)>50)go(i+(d<0?1:-1))});
go((parseInt(location.hash.slice(1))||1)-1);
