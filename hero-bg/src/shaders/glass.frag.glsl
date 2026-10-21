// Instalação de painéis verticais de vidro fumê e bronze escovado, com luz dourada por trás.
//
// Tudo acontece numa única passada: um campo de luz procedural (lightField) é visto
// diretamente nas frestas e, através de cada painel, refratado — comprimido na horizontal
// e deslocado na vertical —, o que cria os destaques escalonados entre as pregas.
//
// Loop contínuo: o tempo vira uma fase 0–2π e todo movimento usa sin/cos dessa fase com
// frequências inteiras, então o último quadro do ciclo é idêntico ao primeiro.

varying vec2 vUv;

uniform float uTime;         // segundos dentro do ciclo, 0..uLoop
uniform float uLoop;         // duração do ciclo
uniform vec2 uResolution;    // px
uniform vec2 uPointer;       // -1..1, suavizado na CPU

uniform float uIntensity;
uniform float uSaturation;
uniform float uPanelCount;
uniform float uPanelOpacity;
uniform float uSpacing;
uniform float uBlur;
uniform float uParallax;
uniform float uDarkness;

uniform vec3 uBackground;
uniform vec3 uCharcoal;
uniform vec3 uDarkBronze;
uniform vec3 uMutedGold;
uniform vec3 uChampagne;
uniform vec3 uHighlight;

#define TAU 6.28318530718
#define PI 3.14159265359
#define LAYERS 3
#define REFERENCE_ASPECT 1.7777778

float hash11(float n) {
  return fract(sin(n * 127.1 + 311.7) * 43758.5453123);
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Fonte de luz gaussiana anisotrópica — alongada na vertical, como reflexos em vidro canelado.
float glow(vec2 q, vec2 center, vec2 radius) {
  vec2 d = (q - center) / radius;
  return exp(-dot(d, d));
}

// Luz atrás dos painéis. `q` está normalizado pela altura (y em -1..1).
float lightField(vec2 q, float ph) {
  float soft = mix(0.7, 1.4, uBlur);
  float l = 0.0;

  // Cada fonte orbita devagar e pulsa — surge, se move e se dissolve.
  l += glow(q, vec2(-0.75 + 0.40 * sin(ph + 0.4), 0.35 + 0.20 * sin(2.0 * ph + 1.3)), vec2(0.70, 0.52) * soft)
     * (0.70 + 0.30 * sin(ph + 2.0));
  l += glow(q, vec2(0.55 + 0.35 * sin(ph + 2.6), -0.05 + 0.25 * cos(ph + 0.7)), vec2(0.60, 0.46) * soft)
     * (0.60 + 0.40 * sin(2.0 * ph + 4.1));
  l += glow(q, vec2(-0.05 + 0.60 * sin(ph + 4.3), -0.55 + 0.18 * sin(3.0 * ph)), vec2(0.50, 0.38) * soft)
     * (0.45 + 0.55 * sin(ph + 5.2) * sin(ph + 5.2));
  l += glow(q, vec2(1.35 + 0.30 * cos(2.0 * ph + 1.1), 0.50 + 0.22 * sin(ph + 3.3)), vec2(0.62, 0.50) * soft)
     * (0.55 + 0.45 * cos(ph + 1.7));

  // Faixa diagonal larga que atravessa a cena, como na referência.
  float diagonal = q.y + 0.45 * q.x - 0.40 * sin(ph + 0.9);
  l += 0.38 * exp(-diagonal * diagonal / (0.08 * soft)) * (0.60 + 0.40 * sin(ph + 3.0));

  return l * uIntensity;
}

// Mapeia energia de luz para a paleta: preto → carvão → bronze → ouro → champanhe → brilho.
vec3 ramp(float v) {
  v = max(v, 0.0);
  vec3 c = mix(uBackground, uCharcoal, smoothstep(0.00, 0.08, v));
  c = mix(c, uDarkBronze, smoothstep(0.05, 0.32, v));
  c = mix(c, uMutedGold, smoothstep(0.25, 0.65, v));
  c = mix(c, uChampagne, smoothstep(0.58, 1.00, v));
  c = mix(c, uHighlight, smoothstep(0.95, 1.55, v));
  return c;
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float ph = TAU * uTime / uLoop;

  // Espaço dos painéis: proporção física preservada, para a largura dos painéis não variar com a tela.
  vec2 q = (vUv - 0.5) * vec2(aspect, 1.0) * 2.0;
  // Espaço da luz: em telas estreitas a luz é parcialmente comprimida, para o celular ver a composição.
  float lightScaleX = mix(1.0, REFERENCE_ASPECT / aspect, 0.6);

  vec3 col = ramp(lightField(vec2(q.x * lightScaleX, q.y), ph));

  // Painéis por unidade de q.x, calibrados para `uPanelCount` num quadro 16:9.
  float baseDensity = uPanelCount / (2.0 * REFERENCE_ASPECT);

  for (int j = 0; j < LAYERS; j++) {
    float fj = float(j);
    float depth = 0.45 + 0.275 * fj;                  // 0 = fundo, 2 = frente
    float density = baseDensity * (1.15 - 0.15 * fj); // painéis da frente são mais largos

    // Parallax: deriva lenta no tempo + leve resposta ao ponteiro, maior nas camadas da frente.
    float drift = uParallax * depth * (0.06 * sin(ph + fj * 2.1) + 0.035 * uPointer.x);
    float s = (q.x + drift) * density + fj * 0.37;
    // Distorção monotônica (derivada sempre > 0): larguras variadas sem padrão repetitivo.
    s += 0.18 * sin(s * 2.1 + fj * 1.7) + 0.05 * sin(s * 5.3 + fj * 4.1);

    float id = floor(s);
    float f = fract(s);
    float h1 = hash11(id + fj * 31.7);
    float h2 = hash11(id * 1.31 + fj * 7.3 + 3.1);
    float h3 = hash11(id * 2.17 + fj * 13.1 + 9.4);

    float present = step(0.20 * fj, h3);              // fundo contínuo; a frente tem menos painéis
    float gap = clamp(uSpacing * (0.4 + 1.2 * h2), 0.0, 0.9);
    float aa = fwidth(s) * 1.5 + uBlur * 0.015;
    float mask = smoothstep(0.0, aa, f) * smoothstep(0.0, aa, (1.0 - gap) - f) * present;
    float u = clamp(f / (1.0 - gap), 0.0, 1.0);       // 0..1 na largura do painel

    // Refração: o painel mostra uma fatia estreita da luz (comprimida em direção ao centro)
    // e deslocada na vertical — cada prega acende numa altura diferente.
    vec2 rq = q;
    rq.x += (0.5 - u) * (0.65 + 0.25 * h1) / density;
    rq.y += (u - 0.5) * (h2 - 0.5) * 0.8 + (h1 - 0.5) * 1.10 * depth;
    rq.y += uParallax * depth * 0.04 * sin(ph + fj * 1.3 + h1 * TAU);
    float light = lightField(vec2(rq.x * lightScaleX, rq.y), ph);

    // Bronze escovado: estrias verticais muito finas, só na largura do painel.
    float brushed = 0.94 + 0.06 * sin(u * 61.0 + h1 * 20.0) * sin(u * 23.0 + h2 * 9.0);
    // Perfil canelado: centro do painel recebe mais luz que as bordas.
    float curve = sin(u * PI);
    vec3 glass = ramp(light * (0.55 + 0.45 * curve) * brushed);

    // Vidro fumê com tom de bronze.
    float smoke = uPanelOpacity * (0.6 + 0.4 * h2);
    glass = mix(glass, glass * vec3(0.92, 0.74, 0.55) * 0.7, smoke);

    // Aresta iluminada à esquerda, reflexo mais fraco à direita, vinco escuro nas extremidades.
    float edgeWidth = 0.012 + aa;
    float rim = exp(-pow(u / edgeWidth, 2.0)) + 0.35 * exp(-pow((1.0 - u) / (edgeWidth * 0.7), 2.0));
    glass += ramp(light * 1.3) * rim * 0.6 * (0.5 + 0.5 * h1);
    glass *= mix(0.55, 1.0, smoothstep(0.0, 0.08, u) * smoothstep(0.0, 0.08, 1.0 - u));

    col = mix(col, glass, mask * (0.55 + 0.35 * depth));
  }

  // Difusão atmosférica: névoa bronze quase imperceptível na base, vinheta suave.
  col += uDarkBronze * 0.05 * smoothstep(0.2, -1.0, q.y);
  vec2 v = vUv - 0.5;
  col *= 1.0 - 0.45 * dot(v, v);

  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(luma), col, uSaturation), 0.0);
  col = mix(col, uBackground, uDarkness * 0.85);
  col = col / (1.0 + max(col - 0.9, 0.0));             // ombro suave, sem estourar

  // Dither estático contra banding nos degradês.
  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
