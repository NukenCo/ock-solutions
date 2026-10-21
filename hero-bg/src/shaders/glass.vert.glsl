// Plano 2×2 desenhado direto em clip space: cobre a tela inteira sem depender da câmera.
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
