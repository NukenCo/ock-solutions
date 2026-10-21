// D. Recuperação do autenticador.
// Com código: D01 → D02 → D04 → D07 → D08 → D09 → B01 (sessão restrita, sem acesso a produtos).
// Sem códigos: D01 → D05 → D06. A aprovação (D10/D11) depende de procedimento ainda não definido.
import { useState, type FormEvent } from 'react';
import { completeRecovery, go, leaveToLogin, requestAssistedRecovery, useProto, redeemRecoveryCode } from '../proto/store';
import type { ScreenId } from '../proto/screens';
import { Actions, Alert, AuthLayout, Button, Note, TextField } from '../ui';
import { ConfirmCode, SaveCodes, SecretSetup } from './activation';
import { usePending } from './shared';

export function D01() {
  return (
    <AuthLayout title="Recupere o autenticador" subtitle={<p>Sem o aplicativo, você pode usar um dos códigos de recuperação que guardou na ativação.</p>}>
      <Actions>
        <Button onClick={() => go('D02')}>Tenho um código de recuperação</Button>
        <Button variant="secondary" onClick={() => go('D05')}>Não tenho os códigos</Button>
        <Button variant="link" onClick={() => go('B04')}>Voltar ao código do aplicativo</Button>
      </Actions>
    </AuthLayout>
  );
}

/** D02 e o estado de erro D03. Um erro de digitação não consome nenhum código. */
export function D02({ screen }: { screen: ScreenId }) {
  const [code, setCode] = useState('');
  const { pending, run } = usePending();
  const failed = screen === 'D03';
  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(async () => {
      await redeemRecoveryCode(code);
      setCode('');
    });
  };
  return (
    <AuthLayout title="Use um código de recuperação" subtitle={<p>Digite um dos códigos que você guardou. Cada código funciona uma única vez.</p>}>
      <form className="form" onSubmit={submit} noValidate>
        <TextField
          label="Código de recuperação"
          value={code}
          onChange={setCode}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="XXXX-XXXX"
          className="mono"
          error={failed ? 'Este código não pode ser aceito. Ele pode estar incorreto ou já ter sido usado.' : null}
          hint="Pode colar o código, com ou sem hífen."
        />
        <Actions>
          <Button type="submit" disabled={code.replace(/[^A-Za-z0-9]/g, '').length !== 8} pending={pending}>
            {failed ? 'Tentar outro código' : 'Validar código'}
          </Button>
          <Button variant="link" onClick={() => go('D05')}>{failed ? 'Não tenho outros códigos' : 'Não tenho os códigos'}</Button>
        </Actions>
      </form>
    </AuthLayout>
  );
}

export function D04() {
  return <SecretSetup title="Vincule um novo autenticador" intro="Esta é uma sessão restrita: ela só permite configurar o novo autenticador." next="D07" />;
}

export function D05() {
  const s = useProto();
  const [email, setEmail] = useState(s.loginEmail);
  const [company, setCompany] = useState('');
  const [errors, setErrors] = useState<{ email?: string; company?: string }>({});
  const { pending, run } = usePending();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = {
      email: /^\S+@\S+\.\S+$/.test(email) ? undefined : 'Informe um e-mail válido.',
      company: company.trim() ? undefined : 'Informe a empresa.',
    };
    setErrors(next);
    if (next.email || next.company) return;
    run(requestAssistedRecovery);
  };
  return (
    <AuthLayout title="Solicite ajuda para recuperar" subtitle={<p>Sem o autenticador e sem os códigos, a equipe OCK precisa verificar sua identidade antes de liberar um novo vínculo.</p>}>
      <Alert>O pedido não desativa a autenticação em duas etapas. Seu acesso continua protegido durante a análise.</Alert>
      <form className="form" onSubmit={submit} noValidate>
        <TextField label="E-mail da conta" type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" autoCapitalize="none" inputMode="email" />
        <TextField label="Empresa" value={company} onChange={setCompany} error={errors.company} autoComplete="organization" />
        <Actions>
          <Button type="submit" pending={pending} pendingLabel="Enviando…">Solicitar análise</Button>
          <Button variant="link" onClick={() => leaveToLogin()}>Voltar ao login</Button>
        </Actions>
      </form>
    </AuthLayout>
  );
}

export function D06() {
  return (
    <AuthLayout title="Solicitação recebida" subtitle={<p>Registramos seu pedido. A equipe OCK vai entrar em contato para verificar sua identidade.</p>}>
      <Alert>Seu acesso continua bloqueado e protegido enquanto a análise estiver pendente.</Alert>
      <Note>Protótipo: o procedimento de verificação e o prazo de atendimento ainda estão em definição. Por isso a aprovação não é simulada.</Note>
      <Actions>
        <Button onClick={() => leaveToLogin()}>Voltar ao login</Button>
      </Actions>
    </AuthLayout>
  );
}

export function D07({ screen }: { screen: ScreenId }) {
  return <ConfirmCode screen={screen} title="Confirme o novo autenticador" back="D04" backLabel="Voltar à nova configuração" success="D08" />;
}

export function D08({ screen }: { screen: ScreenId }) {
  return <SaveCodes title="Guarde os novos códigos" action="Concluir recuperação" onComplete={completeRecovery} origin={screen} />;
}

export function D09() {
  return (
    <AuthLayout title="Autenticador atualizado" subtitle={<p>Seu novo autenticador está ativo e os códigos anteriores deixaram de valer.</p>}>
      <Alert>Enviamos um aviso para o seu e-mail. Se você não reconhece essa alteração, procure o suporte.</Alert>
      <Actions>
        <Button onClick={() => leaveToLogin()}>Entrar novamente</Button>
      </Actions>
    </AuthLayout>
  );
}
