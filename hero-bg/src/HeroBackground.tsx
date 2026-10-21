import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createConfigStore, type ConfigStore, type HeroBackgroundConfig } from './config';
import { ControlPanel } from './ControlPanel';
import { GlassPanels } from './GlassPanels';
import { supportsWebGL, usePlayback, useReducedMotion } from './hooks';

export interface HeroBackgroundProps {
  /** Valores iniciais; ignorado quando `store` é passado. */
  config?: Partial<HeroBackgroundConfig>;
  /** Store compartilhado, para controlar o fundo de fora do componente. */
  store?: ConfigStore;
  /** Mostra o painel de ajustes. */
  showControls?: boolean;
  className?: string;
}

const GL_OPTIONS = {
  antialias: false,
  alpha: false,
  depth: false,
  stencil: false,
  powerPreference: 'high-performance',
} as const;

export function HeroBackground({ config, store: externalStore, showControls = false, className }: HeroBackgroundProps) {
  // `config` só define o estado inicial; depois, mudanças passam pelo store, sem re-render.
  const [ownStore] = useState(() => createConfigStore(config));
  const store = externalStore ?? ownStore;

  const root = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const [webgl] = useState(supportsWebGL);
  const [contextLost, setContextLost] = useState(false);
  const [ready, setReady] = useState(false);
  const reducedMotion = useReducedMotion();
  const playing = usePlayback(root);

  // Telas de toque costumam ter DPR 3: como a imagem é suave, 1× basta e poupa bateria.
  const dpr = useMemo<[number, number]>(
    () => (window.matchMedia('(pointer: coarse)').matches ? [1, 1] : [1, 1.5]),
    [],
  );

  useEffect(() => {
    const apply = ({ overlay: value }: HeroBackgroundConfig) => overlay.current?.style.setProperty('--ock-overlay', String(value));
    apply(store.get());
    return store.subscribe(apply);
  }, [store]);

  const frameloop = reducedMotion ? 'demand' : playing ? 'always' : 'never';
  const classes = ['ock-hero-bg', ready && 'is-ready', className].filter(Boolean).join(' ');

  return (
    <>
      <div ref={root} className={classes} aria-hidden="true">
        <div className="ock-hero-bg__fallback" />
        {webgl && !contextLost && (
          <Canvas
            className="ock-hero-bg__canvas"
            style={{ position: 'absolute', inset: 0 }}
            frameloop={frameloop}
            dpr={dpr}
            gl={GL_OPTIONS}
            flat
            linear
            onCreated={({ gl }) => {
              gl.domElement.addEventListener('webglcontextlost', (event) => {
                event.preventDefault();
                setContextLost(true);
              });
              requestAnimationFrame(() => setReady(true));
            }}
          >
            <GlassPanels store={store} reducedMotion={reducedMotion} />
          </Canvas>
        )}
        <div ref={overlay} className="ock-hero-bg__overlay" />
      </div>
      {showControls && createPortal(<ControlPanel store={store} />, document.body)}
    </>
  );
}
