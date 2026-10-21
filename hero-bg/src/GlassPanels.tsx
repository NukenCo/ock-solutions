import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Vector2, Vector3 } from 'three';
import type { ShaderMaterial } from 'three';
import { palette, type ConfigStore } from './config';
import vertexShader from './shaders/glass.vert.glsl?raw';
import fragmentShader from './shaders/glass.frag.glsl?raw';

// Ponto do ciclo usado no primeiro quadro e no quadro estático (prefers-reduced-motion).
const STATIC_PHASE = 0.18;
// Evita saltos ao voltar de uma aba em segundo plano.
const MAX_DELTA = 1 / 20;

interface GlassPanelsProps {
  store: ConfigStore;
  reducedMotion: boolean;
}

export function GlassPanels({ store, reducedMotion }: GlassPanelsProps) {
  const material = useRef<ShaderMaterial>(null);
  const invalidate = useThree((state) => state.invalidate);
  const elapsed = useRef(store.get().loopDuration * STATIC_PHASE);
  const pointerTarget = useRef(new Vector2());
  const pointer = useRef(new Vector2());

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLoop: { value: 1 },
      uResolution: { value: new Vector2(1, 1) },
      uPointer: { value: new Vector2() },
      uIntensity: { value: 1 },
      uSaturation: { value: 1 },
      uPanelCount: { value: 1 },
      uPanelOpacity: { value: 0 },
      uSpacing: { value: 0 },
      uBlur: { value: 0 },
      uParallax: { value: 0 },
      uDarkness: { value: 0 },
      uBackground: { value: new Vector3(...palette.background) },
      uCharcoal: { value: new Vector3(...palette.charcoal) },
      uDarkBronze: { value: new Vector3(...palette.darkBronze) },
      uMutedGold: { value: new Vector3(...palette.mutedGold) },
      uChampagne: { value: new Vector3(...palette.champagne) },
      uHighlight: { value: new Vector3(...palette.highlight) },
    }),
    [],
  );

  // No modo sob demanda (movimento reduzido), mudanças no painel de ajustes pedem um novo quadro.
  useEffect(() => store.subscribe(() => invalidate()), [store, invalidate]);

  useEffect(() => {
    if (reducedMotion) {
      pointerTarget.current.set(0, 0);
      return;
    }
    const onMove = (event: PointerEvent) => {
      pointerTarget.current.set((event.clientX / window.innerWidth) * 2 - 1, 1 - (event.clientY / window.innerHeight) * 2);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reducedMotion]);

  useFrame((state, delta) => {
    const shader = material.current;
    if (!shader) return;
    const config = store.get();
    const dt = Math.min(delta, MAX_DELTA);

    if (!reducedMotion) {
      elapsed.current = (elapsed.current + dt * config.speed) % config.loopDuration;
      pointer.current.lerp(pointerTarget.current, 1 - Math.exp(-dt * 1.2));
    }

    const u = shader.uniforms;
    u.uTime.value = elapsed.current;
    u.uLoop.value = config.loopDuration;
    u.uResolution.value.set(state.size.width, state.size.height);
    u.uPointer.value.copy(pointer.current);
    u.uIntensity.value = config.lightIntensity;
    u.uSaturation.value = config.goldSaturation;
    u.uPanelCount.value = config.panelCount;
    u.uPanelOpacity.value = config.panelOpacity;
    u.uSpacing.value = config.panelSpacing;
    u.uBlur.value = config.blur;
    u.uParallax.value = config.parallax;
    u.uDarkness.value = config.darkness;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
