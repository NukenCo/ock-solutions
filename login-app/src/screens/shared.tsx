import { useEffect, useState } from 'react';
import { checkPassword, PASSWORD_MIN_LENGTH } from '../proto/fake';
import { PasswordField, Requirements } from '../ui';

/** Executa uma ação assíncrona marcando o estado de processamento, sem permitir duplo envio. */
export function usePending() {
  const [pending, setPending] = useState(false);
  const run = async (action: () => Promise<unknown>) => {
    if (pending) return;
    setPending(true);
    try {
      await action();
    } finally {
      setPending(false);
    }
  };
  return { pending, run };
}

/** Contagem regressiva em segundos até `until` (timestamp). */
export function useCountdown(until: number): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (until <= now) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [until, now]);
  return Math.max(0, Math.ceil((until - now) / 1000));
}

export const CODE_ERROR = 'Não foi possível validar este código. Use o código atual do seu aplicativo autenticador.';

interface NewPasswordProps {
  password: string;
  confirmation: string;
  onPassword: (value: string) => void;
  onConfirmation: (value: string) => void;
  /** Mostra os erros por campo (estados A07 e C07). */
  showErrors: boolean;
  labels: { password: string; confirmation: string };
}

export function passwordIsValid(password: string, confirmation: string): boolean {
  const check = checkPassword(password, confirmation);
  return check.length && check.notCommon && check.matches;
}

/** Senha + confirmação com requisitos ao vivo (A06/A07 e C04/C07). */
export function NewPasswordFields({ password, confirmation, onPassword, onConfirmation, showErrors, labels }: NewPasswordProps) {
  const check = checkPassword(password, confirmation);
  const passwordError = !showErrors
    ? null
    : !password
      ? 'Informe a nova senha.'
      : !check.length
        ? `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
        : !check.notCommon
          ? 'Esta senha é comum ou já apareceu em vazamentos. Escolha outra.'
          : null;
  const confirmationError = showErrors && !check.matches ? 'As senhas não são iguais.' : null;

  return (
    <>
      <PasswordField
        label={labels.password}
        value={password}
        onChange={onPassword}
        autoComplete="new-password"
        error={passwordError}
        placeholder="••••••••••••"
      />
      <PasswordField
        label={labels.confirmation}
        value={confirmation}
        onChange={onConfirmation}
        autoComplete="new-password"
        error={confirmationError}
        placeholder="••••••••••••"
      />
      <Requirements
        items={[
          { label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`, met: check.length },
          { label: 'Não pode ser uma senha comum ou vazada', met: check.length && check.notCommon },
          { label: 'As duas senhas são iguais', met: check.matches },
        ]}
      />
    </>
  );
}
