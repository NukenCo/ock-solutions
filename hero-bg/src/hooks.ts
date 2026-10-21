import { useEffect, useState, type RefObject } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Verdadeiro só quando a aba está visível e o elemento está na tela. */
export function usePlayback(ref: RefObject<HTMLElement | null>): boolean {
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState === 'visible');
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const onChange = () => setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return pageVisible && inView;
}

/** O Three.js r163+ exige WebGL 2. */
export function supportsWebGL(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}
