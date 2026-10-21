// Entrada do build para o site estático: monta o fundo em cada elemento [data-ock-hero-bg].
// Valores iniciais opcionais vão no próprio atributo, em JSON: data-ock-hero-bg='{"speed":0.8}'.
// Um botão [data-ock-hero-bg-toggle] na página pausa e retoma a animação (WCAG 2.2.2).
// Com ?ajustes na URL, o painel de ajustes aparece.
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { HeroBackgroundConfig } from './config';
import { HeroBackground } from './HeroBackground';
import { supportsWebGL } from './hooks';
import './hero-background.css';

const PAUSED_KEY = 'ock-hero-bg-pausado';
const showControls = new URLSearchParams(window.location.search).has('ajustes');
const toggle = document.querySelector<HTMLButtonElement>('[data-ock-hero-bg-toggle]');

function readPaused(): boolean {
  try {
    return localStorage.getItem(PAUSED_KEY) === '1';
  } catch {
    return false;
  }
}

function Root({ config }: { config: Partial<HeroBackgroundConfig> }) {
  const [paused, setPaused] = useState(readPaused);

  useEffect(() => {
    if (!toggle) return;
    const label = toggle.querySelector('[data-label]') ?? toggle;
    label.textContent = paused ? 'Retomar animação' : 'Pausar animação';
    toggle.dataset.state = paused ? 'paused' : 'playing';
    const onClick = () => {
      const next = !paused;
      try {
        localStorage.setItem(PAUSED_KEY, next ? '1' : '0');
      } catch {
        // preferência só desta visita
      }
      setPaused(next);
    };
    toggle.addEventListener('click', onClick);
    return () => toggle.removeEventListener('click', onClick);
  }, [paused]);

  return <HeroBackground config={config} showControls={showControls} paused={paused} />;
}

// Sem WebGL o fundo é estático e o botão não tem o que pausar.
if (toggle && supportsWebGL()) toggle.hidden = false;

document.querySelectorAll<HTMLElement>('[data-ock-hero-bg]').forEach((element) => {
  let config: Partial<HeroBackgroundConfig> = {};
  try {
    config = JSON.parse(element.dataset.ockHeroBg || '{}');
  } catch {
    console.warn('[ock-hero-bg] data-ock-hero-bg não é um JSON válido; usando os valores padrão.');
  }
  createRoot(element).render(
    <StrictMode>
      <Root config={config} />
    </StrictMode>,
  );
});
