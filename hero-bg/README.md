# Fundo animado do hero

Instalação abstrata de lâminas horizontais de vidro fumê e bronze, com luz dourada deslizando na horizontal por trás delas. Tudo é gerado em WebGL (React Three Fiber + GLSL), sem vídeo nem imagens.

## Comandos

```sh
npm install
npm run dev     # demonstração em http://localhost:5173 com o painel de ajustes
npm run build   # gera ../assets/hero-bg/ock-hero-bg.{js,css}, que o site carrega
```

O site continua estático: o build é feito aqui e o resultado é commitado em `assets/hero-bg/`. Depois de mudar qualquer coisa em `src/`, rode `npm run build` antes do commit. A pasta `hero-bg/` não vai para a Vercel (`.vercelignore`).

## Ajustes

- No site publicado, acrescente `?ajustes` à URL para abrir o painel. "Copiar valores" copia o JSON da configuração.
- Para fixar os novos valores, troque `defaultConfig` em `src/config.ts` e rode o build, ou passe só as diferenças no HTML: `<div data-ock-hero-bg='{"speed":0.8}'>`.
- Na demonstração, os parâmetros também funcionam pela URL (`?lightIntensity=1.5&overlay=0`), e `?limpo` mostra só o fundo.

## Estrutura

| Arquivo | Papel |
|---|---|
| `src/HeroBackground.tsx` | Componente: canvas, fallback estático, camada escura, pausa fora da tela ou com a aba oculta, movimento reduzido |
| `src/GlassPanels.tsx` | Plano em tela cheia com o shader; atualiza os uniforms a cada quadro sem re-render do React |
| `src/shaders/glass.frag.glsl` | Luz procedural, três camadas de lâminas horizontais com refração e parallax, dither contra banding |
| `src/config.ts` | Parâmetros, valores padrão, paleta e o store de configuração |
| `src/ControlPanel.tsx` | Painel de ajustes |
| `src/mount.tsx` | Entrada do build para o site estático |
| `src/demo.tsx` | Hero de demonstração com título e CTA |

## Comportamento

- O loop é contínuo: o tempo vira uma fase de 0 a 2π e todo movimento usa seno e cosseno com frequências inteiras.
- A animação é contínua para todos. Com `prefers-reduced-motion`, ela fica mais lenta (35% da velocidade) e sem parallax.
- Sem WebGL 2, ou se o contexto WebGL for perdido, fica o degradê estático em CSS.
- O DPR fica entre 1 e 1,5 no desktop e em 1 nas telas de toque.
