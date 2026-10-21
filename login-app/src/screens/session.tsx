// E. Sessão autorizada, logout, expiração e falhas globais.
import { accountOf, go, leaveToLogin, logout, retryAfterNetworkError, useProto } from '../proto/store';
import { Actions, Alert, AuthLayout, Button, Note } from '../ui';
import { usePending } from './shared';

export function E01() {
  const s = useProto();
  const account = accountOf(s, s.session?.email)!;
  return (
    <AuthLayout title={`Olá, ${account.name}`} subtitle={<p>Você entrou na OCK CRM por {account.company}.</p>}>
      <Note>O dashboard está fora do escopo deste protótipo. Esta tela só confirma que o acesso foi liberado depois da senha, do código e da autorização.</Note>
      <Actions>
        <Button variant="secondary" onClick={() => go('E06')}>Segurança da conta</Button>
        <Button variant="link" onClick={() => go('E02')}>Sair da conta</Button>
      </Actions>
    </AuthLayout>
  );
}

export function E02() {
  const { pending, run } = usePending();
  return (
    <AuthLayout title="Sair da sua conta?" subtitle={<p>Para entrar de novo, você vai precisar da senha e do código do aplicativo.</p>}>
      <Actions>
        <Button onClick={() => run(logout)} pending={pending} pendingLabel="Saindo…">Sair</Button>
        <Button variant="secondary" onClick={() => go('E01')}>Continuar na OCK</Button>
      </Actions>
    </AuthLayout>
  );
}

export function E03() {
  return (
    <AuthLayout title="Você saiu da OCK" subtitle={<p>Sua sessão foi encerrada neste dispositivo.</p>}>
      <Actions>
        <Button onClick={() => leaveToLogin()}>Entrar novamente</Button>
      </Actions>
    </AuthLayout>
  );
}

export function E04() {
  return (
    <AuthLayout title="Sua sessão expirou" subtitle={<p>Sua sessão expirou. Entre novamente para continuar com segurança.</p>}>
      <Note>Depois de entrar com senha e código, você volta para onde estava, se o acesso ainda estiver autorizado.</Note>
      <Actions>
        <Button onClick={() => leaveToLogin()}>Entrar novamente</Button>
      </Actions>
    </AuthLayout>
  );
}

export function E05() {
  const s = useProto();
  const logoutFailed = s.netError?.kind === 'logout';
  return (
    <AuthLayout title="Não foi possível continuar" subtitle={<p>Não foi possível continuar. Confira sua conexão e tente novamente.</p>}>
      {logoutFailed && (
        <Alert>Removemos o acesso neste dispositivo, mas não conseguimos confirmar o encerramento da sessão no servidor.</Alert>
      )}
      <Actions>
        <Button onClick={retryAfterNetworkError}>Tentar novamente</Button>
        <Button variant="link" onClick={() => leaveToLogin()}>Voltar ao login</Button>
      </Actions>
    </AuthLayout>
  );
}

export function E06() {
  const s = useProto();
  const account = accountOf(s, s.session?.email)!;
  const available = account.recoveryCodes.filter((entry) => !entry.used).length;
  return (
    <AuthLayout title="Segurança da conta" subtitle={<p>{account.email}</p>}>
      <dl className="security-list">
        <div><dt>Autenticação em duas etapas</dt><dd>Ativa · obrigatória</dd></div>
        <div><dt>Aplicativo autenticador</dt><dd>Vinculado{account.activatedAt ? ` em ${account.activatedAt}` : ''}</dd></div>
        <div><dt>Códigos de recuperação</dt><dd>{available} de {account.recoveryCodes.length} disponíveis</dd></div>
      </dl>
      <Note>A chave do autenticador e os códigos já emitidos não são exibidos novamente. A troca voluntária de autenticador ainda será especificada.</Note>
      <Actions>
        <Button onClick={() => go('E01')}>Voltar ao início</Button>
        <Button variant="link" onClick={() => go('E02')}>Sair da conta</Button>
      </Actions>
    </AuthLayout>
  );
}
