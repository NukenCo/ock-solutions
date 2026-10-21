// Parâmetros ajustáveis do fundo animado. Os valores padrão são os aprovados para o site;
// o painel de ajustes (?ajustes na URL) altera uma cópia em tempo real.

export interface HeroBackgroundConfig {
  /** Multiplicador da velocidade do tempo. 1 = um ciclo a cada `loopDuration` segundos. */
  speed: number;
  /** Força das fontes de luz dourada. */
  lightIntensity: number;
  /** 0 = monocromático, 1 = paleta original, >1 = dourado mais vivo. */
  goldSaturation: number;
  /** Quantidade aproximada de painéis num enquadramento 16:9. */
  panelCount: number;
  /** Quanto o vidro fumê escurece a luz que passa pelos painéis. */
  panelOpacity: number;
  /** Fração de cada célula que fica vazia entre painéis. */
  panelSpacing: number;
  /** Suavidade da luz e das bordas dos painéis. */
  blur: number;
  /** Amplitude do deslocamento lateral entre as camadas. */
  parallax: number;
  /** Escurece a cena inteira, sem mudar o contraste interno. */
  darkness: number;
  /** Duração do ciclo completo, em segundos. O loop é matematicamente contínuo. */
  loopDuration: number;
  /** Opacidade da camada escura sobre o canvas, para legibilidade do texto. */
  overlay: number;
}

export const defaultConfig: HeroBackgroundConfig = {
  speed: 1,
  lightIntensity: 1.25,
  goldSaturation: 1,
  panelCount: 14,
  panelOpacity: 0.55,
  panelSpacing: 0.08,
  blur: 0.5,
  parallax: 0.5,
  darkness: 0.15,
  loopDuration: 90,
  overlay: 0.3,
};

export interface ConfigField {
  key: keyof HeroBackgroundConfig;
  label: string;
  min: number;
  max: number;
  step: number;
}

export const configFields: ConfigField[] = [
  { key: 'speed', label: 'Velocidade', min: 0, max: 4, step: 0.05 },
  { key: 'lightIntensity', label: 'Intensidade da luz', min: 0, max: 2.5, step: 0.05 },
  { key: 'goldSaturation', label: 'Saturação do dourado', min: 0, max: 2, step: 0.05 },
  { key: 'panelCount', label: 'Quantidade de painéis', min: 4, max: 40, step: 1 },
  { key: 'panelOpacity', label: 'Opacidade dos painéis', min: 0, max: 1, step: 0.01 },
  { key: 'panelSpacing', label: 'Espaçamento', min: 0, max: 0.6, step: 0.01 },
  { key: 'blur', label: 'Desfoque', min: 0, max: 1, step: 0.01 },
  { key: 'parallax', label: 'Profundidade (parallax)', min: 0, max: 1.5, step: 0.05 },
  { key: 'darkness', label: 'Escuridão do fundo', min: 0, max: 1, step: 0.01 },
  { key: 'loopDuration', label: 'Duração do loop (s)', min: 20, max: 240, step: 5 },
  { key: 'overlay', label: 'Camada escura', min: 0, max: 0.9, step: 0.01 },
];

/** Paleta em sRGB 0–1, passada crua ao shader (sem gestão de cor do Three). */
export const palette = {
  background: hex('#0B0B0B'),
  charcoal: hex('#191919'),
  darkBronze: hex('#493625'),
  mutedGold: hex('#A88752'),
  champagne: hex('#D5B77A'),
  highlight: hex('#E8C990'),
};

function hex(value: string): [number, number, number] {
  const n = parseInt(value.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Store mínimo: o canvas lê `get()` a cada quadro, sem re-renderizar React. */
export interface ConfigStore {
  get(): HeroBackgroundConfig;
  set(patch: Partial<HeroBackgroundConfig>): void;
  subscribe(listener: (config: HeroBackgroundConfig) => void): () => void;
}

export function createConfigStore(initial: Partial<HeroBackgroundConfig> = {}): ConfigStore {
  let config: HeroBackgroundConfig = { ...defaultConfig, ...initial };
  const listeners = new Set<(config: HeroBackgroundConfig) => void>();
  return {
    get: () => config,
    set(patch) {
      config = { ...config, ...patch };
      listeners.forEach((listener) => listener(config));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
