// Portão de senha do site (Vercel Routing Middleware).
// A senha vem da variável de ambiente SITE_PASSWORD, configurada no painel da Vercel.
// Sem cookie válido, toda rota protegida redireciona para /acesso/.

const COOKIE = 'ock_acesso';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

export const config = {
  // Fica de fora só o que a tela de senha precisa para renderizar.
  matcher: ['/((?!acesso/|assets/ock-logo\\.svg|assets/Inter-|robots\\.txt|favicon).*)'],
};

async function tokenFor(password) {
  const data = new TextEncoder().encode(`ock-site:${password}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  const match = header.split(/;\s*/).find((c) => c.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

// Só aceita caminhos internos, para não virar redirecionador aberto.
function safeNext(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

function redirect(location, cookie) {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' });
  if (cookie) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 303, headers });
}

export default async function middleware(request) {
  const password = process.env.SITE_PASSWORD;
  if (!password) {
    return new Response('Acesso indisponível: senha não configurada.', { status: 503 });
  }

  const url = new URL(request.url);
  const expected = await tokenFor(password);

  if (url.pathname === '/entrar' && request.method === 'POST') {
    const form = await request.formData();
    const next = safeNext(form.get('next'));
    const attempt = String(form.get('senha') || '');
    if ((await tokenFor(attempt)) === expected) {
      return redirect(next, `${COOKIE}=${expected}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`);
    }
    return redirect(`/acesso/?erro=1&next=${encodeURIComponent(next)}`);
  }

  if (url.pathname === '/sair') {
    return redirect('/acesso/', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  }

  if (readCookie(request, COOKIE) === expected) return; // segue para o arquivo estático

  return redirect(`/acesso/?next=${encodeURIComponent(url.pathname + url.search)}`);
}
