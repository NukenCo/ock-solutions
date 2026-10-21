// A. Primeiro acesso por convite: A01 → A02 → A06 → A08 → A09 → A11 → A13 → A14 → A15.
import { useState, type FormEvent } from 'react';
import { formatSecret } from '../proto/fake';
import {
  accountOf, completeActivation, confirmPendingCode, getState, go, leaveToLogin, openInvite, postponeEnrollment,
  requestInvite, savePassword, setAckCodes, startActivation, startEnrollment, useProto,
} from '../proto/store';
import type { ScreenId } from '../proto/screens';
import { Actions, Alert, AuthLayout, Button, Checkbox, CodeList, CopyButton, Note, OtpField, QrIllustration, Stack, TextField } from '../ui';
import { CODE_ERROR, NewPasswordFields, passwordIsValid, useCountdown, usePending } from './shared';

export function A01() {
  const s = useProto();
  const mail = s.mailbox.find((entry) => entry.id === s.openMailId && entry.kind === 'invite') ?? s.mailbox.find((entry) => entry.kind === 'invite');
  const { pending, run } = usePending();
  if (!mail) return <A03 />;
  const account = accountOf(s, mail.to);
  return (
    <AuthLayout title="Seu convite para a OCK" mail={{ to: mail.to, subject: mail.subject }}>
      <Stack>
        <p className="body">Olá! {account?.company} convidou você para acessar a <strong>OCK CRM</strong> com o e-mail {mail.to}.</p>
        <p className="body">Este convite é individual. Você vai criar sua senha e configurar a autenticação em duas etapas. Nunca enviamos senhas por e-mail.</p>
      </Stack>
      <Actions>
        <Button onClick={() => run(() => openInvite(mail.to))} pending={pending}>Aceitar convite</Button>
      </Actions>
    </AuthLayout>
  );
}

export function A02() {
  const s = useProto();
  const account = accountOf(s, s.inviteEmail)!;
  return (
    <AuthLayout title="Ative seu acesso" subtitle={<p>Você foi convidado para a OCK CRM por {account.company}</p>}>
      <Alert dismissible>Este convite confirma seu e-mail. Para entrar, você precisará criar uma senha e configurar a autenticação em duas etapas.</Alert>
      <TextField label="E-mail" value={account.email} readOnly type="email" hint="O e-mail do convite não pode ser alterado." />
      <Actions>
        <Button onClick={startActivation}>Começar a ativação</Button>
        <Button variant="link" onClick={() => leaveToLogin()}>Já tenho acesso à OCK</Button>
      </Actions>
    </AuthLayout>
  );
}

export function A03() {
  return (
    <AuthLayout title="Convite indisponível" subtitle={<p>Este link pode ter expirado, já ter sido usado ou ter sido cancelado.</p>}>
      <Note>Se o problema continuar, procure o administrador da sua empresa.</Note>
      <Actions>
        <Button onClick={() => go('A04')}>Solicitar novo convite</Button>
        <Button variant="link" onClick={() => leaveToLogin()}>Já ativei minha conta</Button>
      </Actions>
    </AuthLayout>
  );
}

export function A04() {
  const s = useProto();
  const [email, setEmail] = useState(s.inviteEmail ?? '');
  const [error, setError] = useState<string | null>(null);
  const { pending, run } = usePending();
  const wait = useCountdown(s.cooldownUntil.invite);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Informe um e-mail válido.');
    setError(null);
    run(() => requestInvite(email));
  };
  return (
    <AuthLayout title="Solicitar novo convite" subtitle={<p>Informe o e-mail que recebeu o convite. Se o vínculo com a empresa ainda estiver ativo, enviaremos um novo link.</p>}>
      <form className="form" onSubmit={submit} noValidate>
        <TextField label="E-mail" type="email" value={email} onChange={setEmail} error={error} autoComplete="email" autoCapitalize="none" inputMode="email" placeholder="email@empresa.com" />
        <Actions>
          <Button type="submit" pending={pending} pendingLabel="Enviando…" disabled={wait > 0}>
            {wait > 0 ? `Solicitar convite (${wait} s)` : 'Solicitar convite'}
          </Button>
          <Button variant="link" onClick={() => leaveToLogin()}>Voltar ao login</Button>
        </Actions>
      </form>
    </AuthLayout>
  );
}

export function A05() {
  const s = useProto();
  const wait = useCountdown(s.cooldownUntil.invite);
  return (
    <AuthLayout title="Solicitação recebida" subtitle={<p>Se houver um convite disponível para este e-mail, você receberá um novo link. O link anterior deixa de valer.</p>}>
      <Actions>
        <Button onClick={() => leaveToLogin()}>Voltar ao login</Button>
        <Button variant="secondary" onClick={() => go('A04')} disabled={wait > 0}>
          {wait > 0 ? `Solicitar novamente em ${wait} s` : 'Solicitar novamente'}
        </Button>
      </Actions>
    </AuthLayout>
  );
}

/** A06 e o estado de erro A07. */
export function A06({ screen }: { screen: ScreenId }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const showErrors = screen === 'A07';
  const { pending, run } = usePending();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!passwordIsValid(password, confirmation)) return go('A07');
    run(() => savePassword(screen, password));
  };
  return (
    <AuthLayout title="Crie sua senha" subtitle={<p>Configure uma senha exclusiva para sua conta OCK CRM.</p>}>
      <form className="form" onSubmit={submit} noValidate>
        <NewPasswordFields
          password={password}
          confirmation={confirmation}
          onPassword={setPassword}
          onConfirmation={setConfirmation}
          showErrors={showErrors}
          labels={{ password: 'Nova senha', confirmation: 'Confirmar senha' }}
        />
        {showErrors && <span className="visually-hidden" role="alert">Revise sua senha.</span>}
        <Actions>
          <Button type="submit" pending={pending} pendingLabel="Salvando…">{showErrors ? 'Corrigir e continuar' : 'Salvar e continuar'}</Button>
        </Actions>
      </form>
    </AuthLayout>
  );
}

export function A08() {
  return (
    <AuthLayout
      title="Proteja sua conta"
      subtitle={
        <>
          <p>A autenticação em duas etapas é obrigatória para todos.</p>
          <p>Além da senha, você usará um código de 6 dígitos gerado no seu aplicativo autenticador.</p>
          <p>Tenha um <strong>aplicativo compatível com códigos temporários</strong> instalado no celular.</p>
        </>
      }
    >
      <Alert>Não há opção de pular. Seu acesso só será liberado após a confirmação.</Alert>
      <Actions>
        <Button onClick={startEnrollment}>Configurar autenticador</Button>
        <Button variant="link" onClick={postponeEnrollment}>Continuar mais tarde</Button>
      </Actions>
    </AuthLayout>
  );
}

/** Configuração manual da chave: A09 (ativação) e D04 (recuperação). */
export function SecretSetup({ title, intro, next, qr }: { title: string; intro: string; next: ScreenId; qr?: ScreenId }) {
  const s = useProto();
  const account = accountOf(s, s.session?.email)!;
  const secret = account.pendingSecret ?? '';
  return (
    <AuthLayout
      title={title}
      subtitle={
        <>
          <p>{intro}</p>
          <p>No autenticador, escolha adicionar conta por chave de configuração.</p>
        </>
      }
    >
      <div className="form">
        <TextField label="Nome da conta" value={`OCK · ${account.email}`} readOnly />
        <TextField label="Chave de configuração" value={formatSecret(secret)} readOnly className="mono" />
        <CopyButton text={secret} label="Copiar chave" copiedLabel="Chave copiada" />
      </div>
      <Note>Escolha o tipo baseado em tempo. Volte à OCK após adicionar a conta.</Note>
      <Actions>
        <Button onClick={() => go(next)}>Já adicionei a conta</Button>
        {qr && <Button variant="link" onClick={() => go(qr)}>Usar QR code em outro dispositivo</Button>}
      </Actions>
    </AuthLayout>
  );
}

export function A09() {
  return <SecretSetup title="Vincule o autenticador" intro="No mesmo celular, adicione a conta usando uma chave." next="A11" qr="A10" />;
}

export function A10() {
  const s = useProto();
  const account = accountOf(s, s.session?.email)!;
  return (
    <AuthLayout title="Escaneie o QR code" subtitle={<p>Use o autenticador em outro dispositivo.</p>}>
      <QrIllustration seed={account.pendingSecret ?? account.email} />
      <Note>Abra o autenticador e escaneie este código. Depois retorne à OCK.</Note>
      <Actions>
        <Button onClick={() => go('A11')}>Já escaneei o código</Button>
        <Button variant="link" onClick={() => go('A09')}>Usar chave no mesmo celular</Button>
      </Actions>
    </AuthLayout>
  );
}

/** Confirmação do código do segredo pendente: A11/A12 (ativação) e D07 (recuperação). */
export function ConfirmCode({ screen, title, back, backLabel, errorScreen, success }: {
  screen: ScreenId;
  title: string;
  back: ScreenId;
  backLabel: string;
  /** Tela de erro dedicada (A12); sem ela, o erro aparece na própria tela (D07). */
  errorScreen?: ScreenId;
  success: ScreenId;
}) {
  const [code, setCode] = useState('');
  const [inlineError, setInlineError] = useState(false);
  const { pending, run } = usePending();
  const showError = screen === errorScreen || inlineError;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(async () => {
      const accepted = await confirmPendingCode(screen, code);
      if (accepted) return go(success);
      const now = getState().screen;
      if (now === screen || now === errorScreen) {
        setCode('');
        if (errorScreen) go(errorScreen);
        else setInlineError(true);
      }
    });
  };
  return (
    <AuthLayout title={title} subtitle={<p>Digite o código mostrado no aplicativo autenticador.</p>}>
      <form className="form" onSubmit={submit} noValidate>
        <OtpField
          label="Código de 6 dígitos"
          value={code}
          onChange={(value) => { setCode(value); setInlineError(false); }}
          error={showError ? `${CODE_ERROR} Confira também se o horário do celular está automático.` : null}
          hint="O código muda automaticamente. Use o que aparece agora no aplicativo."
        />
        <Actions>
          <Button type="submit" disabled={code.length !== 6} pending={pending}>Confirmar código</Button>
          <Button variant="link" onClick={() => go(back)}>{backLabel}</Button>
        </Actions>
      </form>
    </AuthLayout>
  );
}

export function A11({ screen }: { screen: ScreenId }) {
  return <ConfirmCode screen={screen} title="Confirme o autenticador" back="A09" backLabel="Voltar à configuração" errorScreen="A12" success="A13" />;
}

/** Guarda dos códigos: A13/A14 (ativação) e D08 (recuperação). */
export function SaveCodes({ title, action, onComplete, origin }: { title: string; action: string; onComplete: () => Promise<void>; origin: ScreenId }) {
  const s = useProto();
  const account = accountOf(s, s.session?.email)!;
  const codes = account.pendingCodes ?? [];
  const { pending, run } = usePending();
  const toggle = (value: boolean) => {
    setAckCodes(value);
    if (origin === 'A13' || origin === 'A14') go(value ? 'A14' : 'A13');
  };
  return (
    <AuthLayout title={title} subtitle={<p>Eles permitem recuperar o acesso se você perder o autenticador.</p>}>
      <Alert>Cada código só poderá ser usado uma vez. Guarde fora do celular que pode ser perdido.</Alert>
      <CodeList codes={codes} />
      <Actions>
        <CopyButton text={codes.join('\n')} label="Copiar códigos" copiedLabel="Códigos copiados" />
        <Checkbox label="Guardei os códigos em local seguro" checked={s.ackCodes} onChange={toggle} />
        <Button onClick={() => run(onComplete)} disabled={!s.ackCodes} pending={pending} pendingLabel="Concluindo…">{action}</Button>
      </Actions>
    </AuthLayout>
  );
}

export function A13({ screen }: { screen: ScreenId }) {
  return <SaveCodes title="Guarde seus códigos" action="Concluir ativação" onComplete={completeActivation} origin={screen} />;
}

export function A15() {
  return (
    <AuthLayout title="Conta ativada" subtitle={<p>Seu acesso está protegido por senha e autenticador.</p>}>
      <Alert>Nos próximos acessos, use sua senha e o código do autenticador.</Alert>
      <Actions>
        <Button onClick={() => go('E01')}>Acessar a OCK CRM</Button>
      </Actions>
    </AuthLayout>
  );
}
