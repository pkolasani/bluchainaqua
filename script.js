const intro=document.getElementById('siteIntro');
const introVideo=document.getElementById('introVideo');
const introSkip=document.getElementById('introSkip');
const introProgress=intro?.querySelector('.site-intro-progress span');
const soundGate=document.getElementById('introSoundGate');
const soundBtn=document.getElementById('introSoundBtn');
const silentBtn=document.getElementById('introSilentBtn');

function finishIntro(){if(!intro||intro.classList.contains('is-done'))return;intro.classList.add('is-done');document.body.classList.remove('intro-active');setTimeout(()=>intro.remove(),950)}
function hideSoundGate(){soundGate?.classList.add('hidden')}
function showSoundGate(){soundGate?.classList.remove('hidden')}

if(introVideo){
  introVideo.addEventListener('timeupdate',()=>{if(introVideo.duration&&introProgress)introProgress.style.width=Math.min(100,introVideo.currentTime/introVideo.duration*100)+'%'});
  introVideo.addEventListener('ended',finishIntro);
  introVideo.addEventListener('error',finishIntro);
  introVideo.muted=false;
  const p=introVideo.play();
  if(p?.catch)p.catch(()=>{introVideo.muted=true;introVideo.play().catch(()=>{});showSoundGate()});
}
soundBtn?.addEventListener('click',()=>{if(!introVideo)return;introVideo.muted=false;introVideo.volume=1;introVideo.play().catch(()=>{});hideSoundGate()});
silentBtn?.addEventListener('click',()=>{if(introVideo)introVideo.muted=true;hideSoundGate()});
introSkip?.addEventListener('click',finishIntro);

const steps=[
 {n:'01',k:'SITE • WATER • VIABILITY',t:'Water<br><em>Selection</em>',p:'Start with the right water, land and environmental conditions. We assess the site before capital is committed.',scene:'scene-water'},
 {n:'02',k:'LAND • DESIGN • INFRASTRUCTURE',t:'Pond<br><em>Preparation</em>',p:'Turn a site into a production-ready pond system with layout, depth, aeration and infrastructure planning.',scene:'scene-pond'},
 {n:'03',k:'SEED • BIOSECURITY • QUALITY',t:'<em>Hatchery</em>',p:'Build a reliable seed pathway through broodstock, spawning, hatchery care and quality seed supply.',scene:'scene-hatchery'},
 {n:'04',k:'FEED • WATER • GROWTH',t:'Grow-out<br><em>Farming</em>',p:'Operate the farm with disciplined feeding, water monitoring, disease control and growth tracking.',scene:'scene-farm'},
 {n:'05',k:'QUALITY • TIMING • VALUE',t:'<em>Harvesting</em>',p:'Plan the harvest around optimal size, market timing, quality handling and better returns.',scene:'scene-harvest'},
 {n:'06',k:'PROCESS • COLD • VALUE',t:'Processing<br><em>& Value Addition</em>',p:'Move beyond raw output with grading, processing, cold storage and value-added products.',scene:'scene-processing'},
 {n:'07',k:'MARKETS • EXPORT • LOGISTICS',t:'Market &<br><em>Supply Chain</em>',p:'Connect production to domestic and global markets through coordinated logistics and market access.',scene:'scene-market'},
 {n:'08',k:'FARMERS • COMMUNITIES • PLANET',t:'The <em>Blue Economy</em>',p:'A connected aquaculture value chain that strengthens farmers, communities, sustainable fisheries and the wider blue economy.',scene:'scene-blue'}
];
const sticky=document.querySelector('.sequence-sticky');
const sequence=document.querySelector('.sequence');
const title=document.getElementById('stepTitle'),text=document.getElementById('stepText'),kicker=document.getElementById('stepKicker'),num=document.getElementById('stepNumber');
const dots=[...document.querySelectorAll('.progress-dot')];
let current=-1, ticking=false;
function renderStep(i){
  if(i===current)return;
  current=i;const s=steps[i];
  title.innerHTML=s.t;text.textContent=s.p;kicker.textContent=s.k;num.textContent=s.n;
  document.querySelectorAll('.scene-object').forEach(x=>x.classList.remove('active'));
  document.querySelector('.'+s.scene)?.classList.add('active');
  document.querySelectorAll('.stage-video').forEach((v,j)=>{
    if(j===i){v.currentTime=0; v.play().catch(()=>{});}
    else {v.pause();}
  });
  dots.forEach((d,j)=>d.classList.toggle('active',j===i));
  document.querySelector('.sequence-copy')?.animate([{opacity:.25,transform:'translateY(-45%) translateX(16px)'},{opacity:1,transform:'translateY(-48%) translateX(0)'}],{duration:600,easing:'cubic-bezier(.2,.75,.2,1)'});
}
function updateSequence(){
  const rect=sequence.getBoundingClientRect();
  const total=sequence.offsetHeight-sticky.offsetHeight;
  const progress=Math.min(1,Math.max(0,-rect.top/Math.max(1,total)));
  const i=Math.min(steps.length-1,Math.floor(progress*steps.length));
  renderStep(i);ticking=false;
}
window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(updateSequence);ticking=true}},{passive:true});
dots.forEach((d,i)=>d.addEventListener('click',()=>{const y=sequence.offsetTop+(sequence.offsetHeight-sticky.offsetHeight)*(i/(steps.length-1));window.scrollTo({top:y,behavior:'smooth'})}));
renderStep(0);

const menu=document.querySelector('.menu'),nav=document.querySelector('.header nav');
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu')});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu?.setAttribute('aria-expanded','false')}));
const reveal=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');reveal.unobserve(e.target)}}),{threshold:.1});
document.querySelectorAll('.journey-intro,.section,.service-grid article,.planning-card,.planning-strip>div,.step,.ops-grid>*,.cta-box').forEach(x=>{x.classList.add('reveal');reveal.observe(x)});
document.querySelector('.sequence-bg-video')?.addEventListener('canplay',e=>e.target.play().catch(()=>{}));
document.getElementById('year').textContent=new Date().getFullYear();
