// Segredos, códigos e senhas FICTÍCIOS. Nada aqui é TOTP real nem criptografia:
// o protótipo só imita o comportamento para validar o fluxo com pessoas.

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O e 1/I

export const TOTP_PERIOD_SECONDS = 30;
export const RECOVERY_CODE_COUNT = 10;
export const PASSWORD_MIN_LENGTH = 12;

function random(alphabet: string, length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export function newSecret(): string {
  return random(BASE32, 16);
}

/** Chave exibida em grupos de 4, como nos aplicativos autenticadores. */
export function formatSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') ?? secret;
}

export function newRecoveryCodes(): string[] {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const raw = random(RECOVERY_ALPHABET, 8);
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  });
}

/** Aceita colagem com espaços, minúsculas ou sem o hífen. */
export function normalizeRecoveryCode(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
}

export function currentStep(now = Date.now()): number {
  return Math.floor(now / 1000 / TOTP_PERIOD_SECONDS);
}

export function secondsLeftInStep(now = Date.now()): number {
  return TOTP_PERIOD_SECONDS - (Math.floor(now / 1000) % TOTP_PERIOD_SECONDS);
}

/** "Código do aplicativo" simulado: hash FNV-1a do segredo com a janela de tempo. */
export function fakeTotp(secret: string, step = currentStep()): string {
  let hash = 2166136261;
  for (const char of `${secret}:${step}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return String((hash >>> 0) % 1_000_000).padStart(6, '0');
}

/**
 * Aceita a janela atual e a anterior (tolerância de relógio), nunca uma janela já usada:
 * o mesmo código não entra duas vezes. Devolve a janela aceita ou null.
 */
export function verifyFakeTotp(secret: string, code: string, lastUsedStep: number): number | null {
  const now = currentStep();
  for (const step of [now, now - 1]) {
    if (step > lastUsedStep && fakeTotp(secret, step) === code) return step;
  }
  return null;
}

// Amostra de senhas comuns ou vazadas (a política real consultaria uma base como a do Have I Been Pwned).
const COMMON_PASSWORDS = new Set([
  '123456789012', '1234567890123', 'senha1234567', 'senhasenha12', 'password1234', 'qwertyuiop12',
  'qwerty123456', 'abcdef123456', 'ocksolutions', 'ocksolutions1', 'admin1234567', 'mudar1234567',
]);

export interface PasswordCheck {
  length: boolean;
  notCommon: boolean;
  matches: boolean;
}

export function checkPassword(password: string, confirmation: string): PasswordCheck {
  return {
    length: password.length >= PASSWORD_MIN_LENGTH,
    notCommon: password.length > 0 && !COMMON_PASSWORDS.has(password.toLowerCase()),
    matches: password.length > 0 && password === confirmation,
  };
}
