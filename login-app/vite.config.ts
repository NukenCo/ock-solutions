import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `npm run dev` serve o protótipo localmente; `npm run build` gera ../login/, publicado como /login/ no site estático.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../login',
    emptyOutDir: true,
  },
});
