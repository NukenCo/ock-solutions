import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `npm run dev` abre a página de demonstração (index.html).
// `npm run build` gera um único módulo ES em ../assets/hero-bg/, carregado pelo site estático,
// para que a Vercel continue publicando o site sem etapa de build.
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: '../assets/hero-bg',
    emptyOutDir: true,
    minify: true,
    // Em modo biblioteca o Vite não minifica módulos ES por padrão.
    rolldownOptions: { output: { minify: true } },
    lib: {
      entry: 'src/mount.tsx',
      formats: ['es'],
      fileName: () => 'ock-hero-bg.js',
      cssFileName: 'ock-hero-bg',
    },
  },
});
