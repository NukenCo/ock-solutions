// Página de demonstração (npm run dev): o fundo atrás de um título e um CTA, com o painel de ajustes aberto.
// Parâmetros da URL sobrescrevem a configuração (?lightIntensity=1.4&overlay=0);
// ?limpo mostra só o fundo, para comparar com a referência.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { defaultConfig, type HeroBackgroundConfig } from './config';
import { HeroBackground } from './HeroBackground';
import './hero-background.css';
import './demo.css';

const params = new URLSearchParams(window.location.search);
const clean = params.has('limpo');
const overrides: Partial<HeroBackgroundConfig> = {};
for (const key of Object.keys(defaultConfig) as (keyof HeroBackgroundConfig)[]) {
  const value = params.get(key);
  if (value !== null && !Number.isNaN(Number(value))) overrides[key] = Number(value);
}

function DemoHero() {
  return (
    <section className="demo-hero">
      <HeroBackground config={overrides} showControls={!clean} />
      <div className="demo-hero__content" hidden={clean}>
        <p className="demo-hero__eyebrow">OCK Solutions</p>
        <h1>
          Relacionamentos mais próximos.
          <br />
          Uma operação mais inteligente.
        </h1>
        <p className="demo-hero__support">
          Produtos que aplicam IA para captar, fidelizar e se relacionar com clientes. Com menos esforço operacional.
        </p>
        <a className="demo-hero__cta" href="#solucoes">
          Explore as soluções <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DemoHero />
  </StrictMode>,
);
