# Protótipo do login com 2FA obrigatório

Protótipo navegável do fluxo de autenticação do contratante: convite, criação de senha, configuração do autenticador, login, recuperação de senha e do autenticador, sessão e logout. **Nada é real**: não há servidor, as senhas e os códigos são fictícios e nenhum e-mail é enviado.

- Referência visual: Figma *OCK — Autenticação mobile · 2FA obrigatório*, página Auth-Pages (node 82:12091). A estrutura é a mesma; as cores e a logo seguem a OCK Solutions.
- IDs das telas: os mesmos da documentação do fluxo (A01 a E06). D10 e D11 ficam de fora, porque o procedimento de aprovação da recuperação assistida ainda não existe.

## Comandos

```sh
npm install
npm run dev     # protótipo em http://localhost:5173
npm run build   # gera ../login/, publicado como /login/ no site
```

O build é commitado em `login/`, como o fundo do hero. A pasta `login-app/` não vai para a Vercel (`.vercelignore`).

## Como testar

O **painel do protótipo** fica no canto inferior direito e não faz parte do produto. Nele estão:

- **Autenticador simulado**: mostra o código atual de cada conta, que muda a cada 30 s.
- **Contas de teste**:
  - Ana (`ana@empresaexemplo.com.br`, senha `Prototipo-OCK-2026`) já está ativa, com 2FA e códigos de recuperação.
  - Bruno (`bruno@empresaexemplo.com.br`) tem um convite pendente.
- **Caixa de entrada**: os e-mails simulados (convite, link de nova senha, avisos).
- **Cenários**:
  - convite expirado, cancelado ou já usado;
  - link de nova senha expirado;
  - vínculo com a empresa revogado;
  - falha de conexão na próxima ação;
  - sessão expirada;
  - encerrar a espera por excesso de tentativas;
  - reiniciar tudo.
- **Ir para a tela**: abre qualquer uma das 44 telas, já com o contexto mínimo necessário.

O estado fica no `sessionStorage` da aba, então recarregar a página não perde o progresso nem gera códigos novos.

## Regras simuladas

- Senha válida sozinha nunca libera o início (E01). As guardas de cada tela também valem para o botão voltar do navegador.
- Valores adotados da seção 14 da documentação:
  - senha com mínimo de 12 caracteres, sem senhas comuns;
  - 5 tentativas e depois espera progressiva de 30 s, 60 s e assim por diante;
  - reenvio de e-mail a cada 60 s;
  - 10 códigos de recuperação de uso único;
  - o mesmo código TOTP não é aceito duas vezes.
- Redefinir a senha e recuperar o autenticador encerram as sessões abertas.
- A recuperação com código abre só uma sessão restrita. Os códigos antigos deixam de valer ao concluir, e é preciso entrar de novo.
