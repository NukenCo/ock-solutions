(()=>{
const preference=matchMedia('(prefers-reduced-motion: reduce)');
const manifesto=document.querySelector('.manifesto');const heading=manifesto.querySelector('h2');
const original=heading.innerHTML;const label=heading.textContent.trim();
let stop=()=>{};
function setup(){stop();if(preference.matches)return;
 const wrapper=document.createElement('div');wrapper.className='manifesto-inner';
 while(manifesto.firstChild)wrapper.appendChild(manifesto.firstChild);manifesto.appendChild(wrapper);
 heading.setAttribute('aria-label',label);heading.innerHTML='';
 const visual=document.createElement('span');visual.setAttribute('aria-hidden','true');
 const words=label.split(/\s+/).map(word=>{const span=document.createElement('span');span.className='reading-word';span.textContent=word;visual.append(span,document.createTextNode(' '));return span;});heading.appendChild(visual);
 const targets=[...document.querySelectorAll('.products-heading,.features>h2,.principles>h2,.principle-grid article,.faq>h2,.faq details,footer>h2,.workspace')];
 let observer;if('IntersectionObserver'in window){targets.forEach((node,i)=>{node.classList.add('scroll-reveal');node.style.transitionDelay=node.closest('.principle-grid')?(i%3)*70+'ms':'0ms';});observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.12,rootMargin:'0px 0px -35px 0px'});targets.forEach(node=>observer.observe(node));}
 document.body.classList.add('motion-ready');
 let frame=0;
 function render(){frame=0;const bounds=manifesto.getBoundingClientRect();const distance=Math.max(1,bounds.height-innerHeight);const progress=Math.max(0,Math.min(1,(innerHeight*.12-bounds.top)/(distance+innerHeight*.12)));const count=Math.round(progress*words.length);words.forEach((word,i)=>word.classList.toggle('is-read',i<count));}
 function schedule(){if(!frame)frame=requestAnimationFrame(render);}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);render();
 stop=()=>{removeEventListener('scroll',schedule);removeEventListener('resize',schedule);if(frame)cancelAnimationFrame(frame);observer?.disconnect();targets.forEach(node=>{node.classList.remove('scroll-reveal','is-visible');node.style.removeProperty('transition-delay');});document.body.classList.remove('motion-ready');heading.innerHTML=original;heading.removeAttribute('aria-label');while(wrapper.firstChild)manifesto.insertBefore(wrapper.firstChild,wrapper);wrapper.remove();};
}
preference.addEventListener('change',setup);setup();
})();
