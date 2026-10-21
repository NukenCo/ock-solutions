// C. Recuperação de senha: C01 → C02 → C03 → C04 → C06 → B01. Não inicia sessão e não remove o 2FA.
import { useState, type FormEvent } from 'react';
import { go, leaveToLogin, openResetLink, requestPasswordReset, saveNewPassword, useProto } from '../proto/store';
import type { ScreenId } from '../proto/screens';
import { Actions, Alert, AuthLayout, Button, Note, Stack, TextField } from '../ui';
import { NewPasswordFields, passwordIsValid, useCountdown, usePending } from './shared';

export function C01() {
  const s = useProto();
  const [email, setEmail] = useState(s.loginEmail);
  const [error, setError] = useState<string | null>(null);
  const { pending, run } = usePending();
  const wait = useCountdown(s.cooldownUntil.reset);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Informe um e-mail válido.');
    setError(null);
    run(() => requestPasswordReset(email));
  };
  return (
    <AuthLayout title="Recupere sua senha" subtitle={<p>Informe seu e-mail. Se ele estiver cadastrado, enviaremos um link para criar uma nova senha.</p>}>
      <form className="form" onSubmit={submit} noValidate>
        <TextField label="E-mail" type="email" value={email} onChange={setEmail} error={error} autoComplete="email" autoCapitalize="none" inputMode="email" placeholder="email@empresa.com" />
        <Actions>
          <Button type="submit" pending={pending} pendingLabel="Enviando…" disabled={wait > 0}>
            {wait > 0 ? `Enviar link de recuperação (${wait} s)` : 'Enviar link de recuperação'}
          </Button>
          <Button variant="link" onClick={() => leaveToLogin()}>Voltar ao login</Button>
        </Actions>
      </form>
    </AuthLayout>
  );
}

export function C02() {
  const s = useProto();
  const wait = useCountdown(s.cooldownUntil.reset);
  return (
    <AuthLayout title="Confira seu e-mail" subtitle={<p>Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha.</p>}>
      <Alert>A recuperação da senha não desativa a autenticação em duas etapas.</Alert>
      <Actions>
        <Button onClick={() => leaveToLogin()}>Voltar ao login</Button>
        <Button variant="secondary" onClick={() => go('C01')} disabled={wait > 0}>
          {wait > 0 ? `Solicitar outro link em ${wait} s` : 'Solicitar outro link'}
        </Button>
      </Actions>
    </AuthLayout>
  );
}

export function C03() {
  const s = useProto();
  const mail = s.mailbox.find((entry) => entry.id === s.openMailId && entry.kind === 'reset') ?? s.mailbox.find((entry) => entry.kind === 'reset');
  const { pending, run } = usePending();
  if (!mail) return <C05 />;
  return (
    <AuthLayout title="Redefina sua senha" mail={{ to: mail.to, subject: mail.subject }}>
      <Stack>
        <p className="body">Recebemos um pedido para redefinir a senha da sua conta OCK. O link vale por 1 hora e pode ser usado uma única vez.</p>
        <p className="body">Se você não fez esse pedido, ignore esta mensagem. Sua senha continua a mesma.</p>
      </Stack>
      <Actions>
        <Button onClick={() => run(openResetLink)} pending={pending}>Criar nova senha</Button>
      </Actions>
    </AuthLayout>
  );
}

/** C04 e o estado de erro C07. Uma validação que falha não consome o link. */
export function C04({ screen }: { screen: ScreenId }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const showErrors = screen === 'C07';
  const { pending, run } = usePending();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!passwordIsValid(password, confirmation)) return go('C07');
    run(() => saveNewPassword(screen, password));
  };
  return (
    <AuthLayout title="Crie uma nova senha" subtitle={<p>Ela substitui a senha atual. Seu autenticador continua vinculado.</p>}>
      <form className="form" onSubmit={submit} noValidate>
        <NewPasswordFields
          password={password}
          confirmation={confirmation}
          onPassword={setPassword}
          onConfirmation={setConfirmation}
          showErrors={showErrors}
          labels={{ password: 'Nova senha', confirmation: 'Confirmar nova senha' }}
        />
        {showErrors && <span className="visually-hidden" role="alert">Revise a nova senha.</span>}
        <Actions>
          <Button type="submit" pending={pending} pendingLabel="Salvando…">{showErrors ? 'Corrigir e salvar' : 'Salvar nova senha'}</Button>
        </Actions>
      </form>
    </AuthLayout>
  );
}

export function C05() {
  return (
    <AuthLayout title="Link indisponível" subtitle={<p>Este link pode ter expirado ou já ter sido usado.</p>}>
      <Actions>
        <Button onClick={() => go('C01')}>Solicitar novo link</Button>
        <Button variant="link" onClick={() => leaveToLogin()}>Voltar ao login</Button>
      </Actions>
    </AuthLayout>
  );
}

export function C06() {
  return (
    <AuthLayout title="Senha atualizada" subtitle={<p>Por segurança, encerramos as sessões abertas e enviamos um aviso para o seu e-mail.</p>}>
      <Alert>A autenticação em duas etapas continua ativa. No próximo acesso, use a nova senha e o código do aplicativo.</Alert>
      <Note>Se você também perdeu o autenticador, entre com a nova senha e escolha “Perdi acesso ao autenticador”.</Note>
      <Actions>
        <Button onClick={() => leaveToLogin()}>Ir para o login</Button>
      </Actions>
    </AuthLayout>
  );
}
