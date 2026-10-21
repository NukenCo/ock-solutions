// Sobreposição dos cards de "Nossas soluções" no mobile: cada card tem a altura da tela e o mockup
// é reduzido para caber entre o título e o texto. Se precisaria encolher demais, mantém a rolagem normal.
(()=>{
const stack=document.querySelector('.product-stack');if(!stack)return;
const cards=[...stack.querySelectorAll('.product-card')];
const mobile=matchMedia('(max-width:760px)');
const MIN_SCALE=.5,GAP=12;
function reset(){stack.classList.remove('is-stacked');cards.forEach(card=>{card.style.removeProperty('--visual-top');card.style.removeProperty('--visual-scale');});}
function fit(){
 reset();if(!mobile.matches)return;
 stack.classList.add('is-stacked');
 const layout=cards.map(card=>{
  const box=card.getBoundingClientRect();
  const title=card.querySelector('.product-top').getBoundingClientRect();
  const copy=card.querySelector('.product-copy').getBoundingClientRect();
  const visual=card.querySelector('.product-visual');
  // Altura real do desenho (o mockup pode passar da caixa .product-visual), medida em escala 1.
  const origin=visual.getBoundingClientRect().top;
  const drawn=Math.max(visual.offsetHeight,...[...visual.querySelectorAll('*')].map(el=>el.getBoundingClientRect().bottom-origin));
  const top=title.bottom-box.top+GAP;
  return{card,top,scale:Math.min(1,(copy.top-box.top-GAP-top)/drawn)};
 });
 if(layout.some(item=>item.scale<MIN_SCALE))return reset();
 layout.forEach(({card,top,scale})=>{card.style.setProperty('--visual-top',`${Math.round(top)}px`);card.style.setProperty('--visual-scale',scale.toFixed(3));});
}
let width=innerWidth,height=innerHeight,frame=0;
function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;fit();});}
// Barras do navegador no celular mudam a altura ao rolar; só recalcula quando a mudança é real.
addEventListener('resize',()=>{if(innerWidth!==width||Math.abs(innerHeight-height)>120){width=innerWidth;height=innerHeight;schedule();}});
mobile.addEventListener('change',schedule);
document.fonts?.ready.then(schedule);
fit();
})();
