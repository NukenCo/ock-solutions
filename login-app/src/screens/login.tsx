// B. Login recorrente: B01 → B04 → E01, com as exceções B02, B03, B05, B06 e B07.
import { useState, type FormEvent } from 'react';
import { clearNotice, go, leaveToLogin, login, retryAfterLock, useProto, verifyLoginCode } from '../proto/store';
import type { ScreenId } from '../proto/screens';
import { Actions, Alert, AuthLayout, Button, Note, OtpField, PasswordField, TextField } from '../ui';
import { CODE_ERROR, useCountdown, usePending } from './shared';

/** B01 e o estado de erro B02. */
export function B01({ screen }: { screen: ScreenId }) {
  const s = useProto();
  const [email, setEmail] = useState(s.loginEmail);
  const [password, setPassword] = useState('');
  const { pending, run } = usePending();
  const failed = screen === 'B02';
  const submit = (event: FormEvent) => {
    event.preventDefault();
    clearNotice();
    run(async () => {
      await login(email, password);
      setPassword(''); // a senha nunca é preservada após uma tentativa
    });
  };
  return (
    <AuthLayout title="Entre na OCK" subtitle={<p>Use seu e-mail e senha para acessar a OCK CRM.</p>}>
      {s.notice && <Alert>{s.notice}</Alert>}
      {failed && <Alert tone="error" announce>Não foi possível entrar. Confira seu e-mail e senha.</Alert>}
      <form className="form" onSubmit={submit} noValidate>
        <TextField
          label="E-mail"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="email"
          placeholder="email@empresa.com"
          required
        />
        <PasswordField label="Senha" value={password} onChange={setPassword} autoComplete="current-password" required />
        <div className="form-row">
          <Button variant="link" onClick={() => go('C01')}>Esqueci minha senha</Button>
        </div>
        <Actions>
          <Button type="submit" disabled={!email || !password} pending={pending}>{failed ? 'Tentar novamente' : 'Continuar'}</Button>
          <Button variant="link" onClick={() => go('A01')}>Recebi um convite</Button>
        </Actions>
      </form>
    </AuthLayout>
  );
}

export function B03() {
  const s = useProto();
  const wait = useCountdown(s.lock?.until ?? 0);
  const fromCode = s.lock && s.lock.origin !== 'B01';
  return (
    <AuthLayout title="Aguarde para tentar" subtitle={<p>Por segurança, novas tentativas estão pausadas por alguns instantes.</p>}>
      <p className="countdown" aria-live="polite">
        {wait > 0 ? `Você poderá tentar de novo em ${wait} s.` : 'Você já pode tentar novamente.'}
      </p>
      <Actions>
        <Button onClick={retryAfterLock} disabled={wait > 0}>Tentar novamente</Button>
        {fromCode
          ? <Button variant="link" onClick={() => go('D01')}>Perdi acesso ao autenticador</Button>
          : <Button variant="link" onClick={() => go('C01')}>Esqueci minha senha</Button>}
      </Actions>
    </AuthLayout>
  );
}

/** B04 e o estado de erro B05. */
export function B04({ screen }: { screen: ScreenId }) {
  const [code, setCode] = useState('');
  const { pending, run } = usePending();
  const failed = screen === 'B05';
  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(async () => {
      await verifyLoginCode(code);
      setCode('');
    });
  };
  return (
    <AuthLayout title="Confirme que é você" subtitle={<p>Digite o código de 6 dígitos do seu aplicativo autenticador.</p>}>
      <form className="form" onSubmit={submit} noValidate>
        <OtpField
          label="Código de 6 dígitos"
          value={code}
          onChange={setCode}
          error={failed ? CODE_ERROR : null}
          hint="O código muda a cada 30 segundos. Ele não é enviado por SMS nem e-mail."
        />
        <Actions>
          <Button type="submit" disabled={code.length !== 6} pending={pending}>Verificar e entrar</Button>
          <Button variant="link" onClick={() => go('D01')}>Perdi acesso ao autenticador</Button>
          <Button variant="link" onClick={() => leaveToLogin()}>Usar outra conta</Button>
        </Actions>
      </form>
    </AuthLayout>
  );
}

export function B06() {
  return (
    <AuthLayout
      title="Conclua a proteção"
      subtitle={<p>Sua conta ainda não tem a autenticação em duas etapas. Ela é obrigatória para acessar a OCK CRM.</p>}
    >
      <Alert>Você retoma do ponto em que parou. Nenhum conteúdo da empresa é liberado antes da confirmação.</Alert>
      <Actions>
        <Button onClick={() => go('A08')}>Retomar configuração</Button>
        <Button variant="link" onClick={() => leaveToLogin()}>Sair desta conta</Button>
      </Actions>
    </AuthLayout>
  );
}

export function B07() {
  return (
    <AuthLayout title="Acesso indisponível" subtitle={<p>Seu acesso à empresa está indisponível. Procure o administrador para verificar sua autorização.</p>}>
      <Note>Por segurança, não mostramos detalhes sobre a empresa ou o motivo.</Note>
      <Actions>
        <Button onClick={() => leaveToLogin()}>Voltar ao login</Button>
      </Actions>
    </AuthLayout>
  );
}
