// Entrada do build para o site estático: monta o fundo em cada elemento [data-ock-hero-bg].
// Valores iniciais opcionais vão no próprio atributo, em JSON: data-ock-hero-bg='{"speed":0.8}'.
// Com ?ajustes na URL, o painel de ajustes aparece.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { HeroBackgroundConfig } from './config';
import { HeroBackground } from './HeroBackground';
import './hero-background.css';

const showControls = new URLSearchParams(window.location.search).has('ajustes');

document.querySelectorAll<HTMLElement>('[data-ock-hero-bg]').forEach((element) => {
  let config: Partial<HeroBackgroundConfig> = {};
  try {
    config = JSON.parse(element.dataset.ockHeroBg || '{}');
  } catch {
    console.warn('[ock-hero-bg] data-ock-hero-bg não é um JSON válido; usando os valores padrão.');
  }
  createRoot(element).render(
    <StrictMode>
      <HeroBackground config={config} showControls={showControls} />
    </StrictMode>,
  );
});
