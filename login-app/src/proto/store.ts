// Estado simulado do protótipo: contas, sessões, links e cenários.
// Cada ação "de servidor" passa por `server()`, que espera um pouco e pode simular falha de conexão (E05).
import { useSyncExternalStore } from 'react';
import { fakeTotp, newRecoveryCodes, newSecret, normalizeRecoveryCode, verifyFakeTotp } from './fake';
import { isScreenId, type ScreenId } from './screens';

export const MAX_ATTEMPTS = 5;
export const LOCK_BASE_SECONDS = 30; // espera progressiva: 30 s, 60 s, 90 s…
export const RESEND_COOLDOWN_SECONDS = 60;
const SERVER_DELAY_MS = 650;
const STORAGE_KEY = 'ock-login-prototipo';

export type InviteStatus = 'valid' | 'expired' | 'canceled' | 'used';
export type SessionKind = 'enrollment' | 'challenge' | 'restricted' | 'full';

export interface Account {
  email: string;
  name: string;
  company: string;
  password: string | null;
  twoFactorActive: boolean;
  secret: string | null;
  /** Segredo em configuração (ativação ou recuperação), ainda sem efeito. */
  pendingSecret: string | null;
  pendingConfirmed: boolean;
  /** Códigos gerados após confirmar o novo segredo; só valem ao concluir. */
  pendingCodes: string[] | null;
  recoveryCodes: { code: string; used: boolean }[];
  lastTotpStep: number;
  invite: InviteStatus | null;
  activatedAt: string | null;
}

export interface Session {
  kind: SessionKind;
  email: string;
  expired: boolean;
}

export interface Mail {
  id: string;
  kind: 'invite' | 'reset' | 'notice';
  to: string;
  subject: string;
  body: string;
  at: number;
}

export interface ProtoState {
  screen: ScreenId;
  accounts: Record<string, Account>;
  session: Session | null;
  /** Conta cujo convite foi aberto (A02). */
  inviteEmail: string | null;
  resetLink: { email: string; status: 'valid' | 'expired' | 'used' } | null;
  bondActive: boolean;
  failNext: boolean;
  failures: number;
  lockLevel: number;
  lock: { until: number; origin: ScreenId } | null;
  mailbox: Mail[];
  openMailId: string | null;
  netError: { origin: ScreenId; kind: 'request' | 'logout' } | null;
  resumeAfterLogin: ScreenId | null;
  loginEmail: string;
  ackCodes: boolean;
  cooldownUntil: { invite: number; reset: number };
  notice: string | null;
}

export const DEMO_PASSWORD = 'Prototipo-OCK-2026';
export const ANA = 'ana@empresaexemplo.com.br';
export const BRUNO = 'bruno@empresaexemplo.com.br';
const COMPANY = 'Empresa Exemplo Ltda.';

function inviteMail(to: string): Mail {
  return {
    id: crypto.randomUUID(),
    kind: 'invite',
    to,
    subject: 'Seu convite para a OCK',
    body: `${COMPANY} convidou você para acessar a OCK CRM.`,
    at: Date.now(),
  };
}

function initialState(): ProtoState {
  return {
    screen: 'B01',
    accounts: {
      [ANA]: {
        email: ANA,
        name: 'Ana',
        company: COMPANY,
        password: DEMO_PASSWORD,
        twoFactorActive: true,
        secret: newSecret(),
        pendingSecret: null,
        pendingConfirmed: false,
        pendingCodes: null,
        recoveryCodes: newRecoveryCodes().map((code) => ({ code, used: false })),
        lastTotpStep: 0,
        invite: 'used',
        activatedAt: '21/10/2026',
      },
      [BRUNO]: {
        email: BRUNO,
        name: 'Bruno',
        company: COMPANY,
        password: null,
        twoFactorActive: false,
        secret: null,
        pendingSecret: null,
        pendingConfirmed: false,
        pendingCodes: null,
        recoveryCodes: [],
        lastTotpStep: 0,
        invite: 'valid',
        activatedAt: null,
      },
    },
    session: null,
    inviteEmail: null,
    resetLink: null,
    bondActive: true,
    failNext: false,
    failures: 0,
    lockLevel: 0,
    lock: null,
    mailbox: [inviteMail(BRUNO)],
    openMailId: null,
    netError: null,
    resumeAfterLogin: null,
    loginEmail: '',
    ackCodes: false,
    cooldownUntil: { invite: 0, reset: 0 },
    notice: null,
  };
}

function load(): ProtoState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProtoState) : null;
  } catch {
    return null;
  }
}

let state: ProtoState = load() ?? initialState();
const listeners = new Set<() => void>();

function save() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sem storage (aba privada etc.): o protótipo segue só em memória.
  }
}

export function getState(): ProtoState {
  return state;
}

export function update(recipe: (draft: ProtoState) => void) {
  const draft = structuredClone(state);
  recipe(draft);
  state = draft;
  save();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useProto(): ProtoState {
  return useSyncExternalStore(subscribe, getState);
}

export function accountOf(s: ProtoState, email: string | null | undefined): Account | null {
  return email ? s.accounts[email.trim().toLowerCase()] ?? null : null;
}

// ─── Navegação e guardas ────────────────────────────────────────────────────

function live(s: ProtoState, kind: SessionKind): boolean {
  return s.session?.kind === kind && !s.session.expired;
}

/** Regras de acesso de cada tela. Devolve a própria tela ou para onde redirecionar. */
function guard(s: ProtoState, target: ScreenId): ScreenId {
  const account = accountOf(s, s.session?.email);
  switch (target) {
    case 'A02':
      return accountOf(s, s.inviteEmail)?.invite === 'valid' ? target : 'A03';
    case 'A06': case 'A07': case 'A08': case 'A09': case 'A10': case 'A11': case 'A12': case 'B06':
      return live(s, 'enrollment') ? target : 'B01';
    case 'A13': case 'A14':
      return live(s, 'enrollment') && account?.pendingConfirmed ? target : 'B01';
    case 'A15':
      return live(s, 'full') ? target : 'B01';
    case 'B04': case 'B05': case 'D01': case 'D02': case 'D03':
      return live(s, 'challenge') ? target : 'B01';
    case 'C04': case 'C07':
      return s.resetLink?.status === 'valid' ? target : 'C05';
    case 'D04':
      return live(s, 'restricted') && account?.pendingSecret ? target : 'B01';
    case 'D07':
      return live(s, 'restricted') && account?.pendingSecret ? target : 'B01';
    case 'D08':
      return live(s, 'restricted') && account?.pendingConfirmed ? target : 'B01';
    case 'E01': case 'E02': case 'E06':
      if (live(s, 'full')) return target;
      return s.session?.kind === 'full' && s.session.expired ? 'E04' : 'B01';
    default:
      return target;
  }
}

function resolveInto(s: ProtoState, target: ScreenId) {
  const resolved = guard(s, target);
  if (resolved === 'E04' && target !== 'E04') s.resumeAfterLogin = target;
  if (resolved === 'B01' && s.session?.expired && s.session.kind !== 'full') {
    s.notice = s.session.kind === 'restricted'
      ? 'A sessão de recuperação expirou. Entre novamente para recomeçar.'
      : 'Por segurança, informe sua senha novamente.';
    s.session = null;
  }
  s.screen = resolved;
}

function syncUrl(replace = false) {
  const hash = `#/${state.screen}`;
  if (location.hash === hash) return;
  if (replace) history.replaceState(null, '', hash);
  else history.pushState(null, '', hash);
}

export function go(target: ScreenId) {
  update((s) => resolveInto(s, target));
  syncUrl();
}

/** Botão voltar/avançar do navegador: as mesmas guardas valem, então voltar não restaura sessão encerrada. */
function fromLocation() {
  const id = location.hash.replace(/^#\/?/, '').toUpperCase();
  const target = isScreenId(id) ? id : state.screen;
  update((s) => resolveInto(s, target));
  syncUrl(true);
}

export function startRouting() {
  window.addEventListener('popstate', fromLocation);
  fromLocation();
}

export function clearNotice() {
  if (state.notice) update((s) => { s.notice = null; });
}

// ─── Simulação de servidor, limites e falhas ────────────────────────────────

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Executa `work` como se fosse no servidor. Em falha simulada, nada muda e a pessoa vai para E05. */
export async function server(origin: ScreenId, work: () => void): Promise<void> {
  await delay(SERVER_DELAY_MS);
  if (state.failNext) {
    update((s) => {
      s.failNext = false;
      s.netError = { origin, kind: 'request' };
    });
    go('E05');
    return;
  }
  work();
}

export function isLocked(): boolean {
  return state.lock !== null && state.lock.until > Date.now();
}

function guardLock(): boolean {
  if (!isLocked()) return false;
  go('B03');
  return true;
}

/** Conta uma falha. No limite, aplica espera progressiva e leva para B03. */
function registerFailure(origin: ScreenId): boolean {
  let locked = false;
  update((s) => {
    s.failures += 1;
    if (s.failures >= MAX_ATTEMPTS) {
      s.lockLevel += 1;
      s.failures = 0;
      s.lock = { until: Date.now() + LOCK_BASE_SECONDS * s.lockLevel * 1000, origin };
      locked = true;
    }
  });
  if (locked) go('B03');
  return locked;
}

function resetFailures(s: ProtoState) {
  s.failures = 0;
}

export function retryAfterLock() {
  const origin = state.lock?.origin ?? 'B01';
  update((s) => { s.lock = null; });
  go(origin);
}

// ─── A. Ativação por convite ────────────────────────────────────────────────

export async function openInvite(email: string) {
  await server('A01', () => {
    update((s) => { s.inviteEmail = email; });
    go(accountOf(state, email)?.invite === 'valid' ? 'A02' : 'A03');
  });
}

export function startActivation() {
  update((s) => {
    if (s.inviteEmail) s.session = { kind: 'enrollment', email: s.inviteEmail, expired: false };
  });
  go('A06');
}

export async function savePassword(origin: ScreenId, password: string) {
  await server(origin, () => {
    update((s) => {
      const account = accountOf(s, s.session?.email);
      if (account) account.password = password;
    });
    go('A08');
  });
}

/** Retomar não gera outro segredo: o pendente continua o mesmo até ser confirmado. */
export function startEnrollment() {
  update((s) => {
    const account = accountOf(s, s.session?.email);
    if (account && !account.pendingSecret) account.pendingSecret = newSecret();
  });
  go('A09');
}

export function postponeEnrollment() {
  update((s) => {
    s.session = null;
    s.notice = 'Seu progresso foi salvo. No próximo acesso, você retoma a configuração do autenticador.';
  });
  go('B01');
}

/** Confirma o código do segredo pendente (A11 na ativação, D07 na recuperação). */
export async function confirmPendingCode(origin: ScreenId, code: string): Promise<boolean> {
  if (guardLock()) return false;
  if (state.session?.expired) {
    go(origin);
    return false;
  }
  let accepted = false;
  await server(origin, () => {
    const account = accountOf(state, state.session?.email);
    const step = account?.pendingSecret ? verifyFakeTotp(account.pendingSecret, code, account.lastTotpStep) : null;
    if (step === null) return;
    accepted = true;
    update((s) => {
      const draft = accountOf(s, s.session?.email)!;
      draft.pendingConfirmed = true;
      draft.lastTotpStep = step;
      draft.pendingCodes ??= newRecoveryCodes(); // recarregar não duplica a lista
      s.ackCodes = false;
      resetFailures(s);
    });
  });
  if (!accepted && state.screen !== 'E05') registerFailure(origin);
  return accepted;
}

export function setAckCodes(value: boolean) {
  update((s) => { s.ackCodes = value; });
}

export async function completeActivation() {
  await server('A14', () => {
    const account = accountOf(state, state.session?.email);
    if (!account || !state.bondActive || account.invite !== 'valid') {
      update((s) => { s.session = null; });
      go('B07');
      return;
    }
    update((s) => {
      const draft = accountOf(s, s.session?.email)!;
      draft.secret = draft.pendingSecret;
      draft.recoveryCodes = (draft.pendingCodes ?? []).map((code) => ({ code, used: false }));
      draft.pendingSecret = null;
      draft.pendingConfirmed = false;
      draft.pendingCodes = null;
      draft.twoFactorActive = true;
      draft.invite = 'used';
      draft.activatedAt = new Date().toLocaleDateString('pt-BR');
      s.session = { kind: 'full', email: draft.email, expired: false };
      s.ackCodes = false;
    });
    go('A15');
  });
}

export async function requestInvite(email: string) {
  await server('A04', () => {
    update((s) => {
      s.cooldownUntil.invite = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
      const account = accountOf(s, email);
      // Só reenvia para vínculo elegível; convite cancelado não é reativado. A resposta é sempre a mesma.
      if (account && s.bondActive && (account.invite === 'valid' || account.invite === 'expired')) {
        account.invite = 'valid';
        s.mailbox.unshift(inviteMail(account.email));
      }
    });
    go('A05');
  });
}

// ─── B. Login recorrente ────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  update((s) => { s.loginEmail = email; s.notice = null; });
  if (guardLock()) return;
  let failed = false;
  await server('B01', () => {
    const account = accountOf(state, email);
    if (!account || !account.password || account.password !== password) {
      failed = true;
      return;
    }
    update((s) => {
      resetFailures(s);
      s.session = { kind: account.twoFactorActive ? 'challenge' : 'enrollment', email: account.email, expired: false };
    });
    if (account.twoFactorActive) go('B04');
    else if (account.invite === 'canceled' || !state.bondActive) {
      update((s) => { s.session = null; });
      go('B07');
    } else go('B06');
  });
  if (failed && !registerFailure('B01')) go('B02');
}

export async function verifyLoginCode(code: string) {
  if (guardLock()) return;
  if (state.session?.expired) return go('B04'); // a guarda leva ao B01 pedindo a senha de novo
  let failed = false;
  await server('B04', () => {
    const account = accountOf(state, state.session?.email);
    const step = account?.secret ? verifyFakeTotp(account.secret, code, account.lastTotpStep) : null;
    if (step === null) {
      failed = true;
      return;
    }
    if (!state.bondActive) {
      update((s) => { s.session = null; });
      go('B07');
      return;
    }
    const resume = state.resumeAfterLogin;
    update((s) => {
      accountOf(s, s.session?.email)!.lastTotpStep = step;
      s.session = { kind: 'full', email: s.session!.email, expired: false };
      s.resumeAfterLogin = null;
      resetFailures(s);
    });
    go(resume ?? 'E01');
  });
  if (failed && !registerFailure('B04')) go('B05');
}

export function leaveToLogin(notice: string | null = null) {
  update((s) => {
    s.session = null;
    s.notice = notice;
  });
  go('B01');
}

// ─── C. Recuperação de senha ────────────────────────────────────────────────

export async function requestPasswordReset(email: string) {
  await server('C01', () => {
    update((s) => {
      s.cooldownUntil.reset = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
      const account = accountOf(s, email);
      if (account?.password) {
        s.resetLink = { email: account.email, status: 'valid' };
        s.mailbox.unshift({
          id: crypto.randomUUID(),
          kind: 'reset',
          to: account.email,
          subject: 'Redefina sua senha da OCK',
          body: 'Recebemos um pedido para redefinir a senha da sua conta.',
          at: Date.now(),
        });
      }
    });
    go('C02');
  });
}

export async function openResetLink() {
  await server('C03', () => go(state.resetLink?.status === 'valid' ? 'C04' : 'C05'));
}

export async function saveNewPassword(origin: ScreenId, password: string) {
  await server(origin, () => {
    if (state.resetLink?.status !== 'valid') {
      go('C05');
      return;
    }
    update((s) => {
      const account = accountOf(s, s.resetLink!.email)!;
      account.password = password;
      s.resetLink!.status = 'used';
      s.session = null; // sessões existentes revogadas
      s.mailbox.unshift({
        id: crypto.randomUUID(),
        kind: 'notice',
        to: account.email,
        subject: 'Sua senha da OCK foi alterada',
        body: 'A senha da sua conta foi alterada. Se não foi você, procure o suporte.',
        at: Date.now(),
      });
    });
    go('C06');
  });
}

// ─── D. Recuperação do autenticador ─────────────────────────────────────────

export async function redeemRecoveryCode(input: string) {
  if (guardLock()) return;
  if (state.session?.expired) return go('D02');
  let failed = false;
  await server('D02', () => {
    const code = normalizeRecoveryCode(input);
    const account = accountOf(state, state.session?.email);
    const match = account?.recoveryCodes.find((entry) => entry.code === code && !entry.used);
    if (!match) {
      failed = true;
      return;
    }
    update((s) => {
      const draft = accountOf(s, s.session?.email)!;
      draft.recoveryCodes.find((entry) => entry.code === code)!.used = true; // consumido uma única vez
      draft.pendingSecret = newSecret();
      draft.pendingConfirmed = false;
      draft.pendingCodes = null;
      s.session = { kind: 'restricted', email: draft.email, expired: false };
      resetFailures(s);
    });
    go('D04');
  });
  if (failed && !registerFailure('D02')) go('D03');
}

export async function requestAssistedRecovery() {
  await server('D05', () => {
    update((s) => { s.session = null; });
    go('D06');
  });
}

export async function completeRecovery() {
  await server('D08', () => {
    update((s) => {
      const account = accountOf(s, s.session?.email)!;
      account.secret = account.pendingSecret;
      account.recoveryCodes = (account.pendingCodes ?? []).map((code) => ({ code, used: false }));
      account.pendingSecret = null;
      account.pendingConfirmed = false;
      account.pendingCodes = null;
      s.session = null; // encerra a sessão restrita e as demais
      s.ackCodes = false;
      s.mailbox.unshift({
        id: crypto.randomUUID(),
        kind: 'notice',
        to: account.email,
        subject: 'Seu autenticador da OCK foi atualizado',
        body: 'Um novo aplicativo autenticador foi vinculado à sua conta. Se não foi você, procure o suporte.',
        at: Date.now(),
      });
    });
    go('D09');
  });
}

// ─── E. Sessão ──────────────────────────────────────────────────────────────

export async function logout() {
  await delay(SERVER_DELAY_MS);
  const failed = state.failNext;
  update((s) => {
    s.session = null; // o acesso local sai de qualquer forma
    s.failNext = false;
    s.netError = failed ? { origin: 'E02', kind: 'logout' } : null;
  });
  go(failed ? 'E05' : 'E03');
}

export function retryAfterNetworkError() {
  const error = state.netError;
  update((s) => { s.netError = null; });
  go(error && error.kind === 'request' ? error.origin : 'B01');
}

// ─── Painel do protótipo ────────────────────────────────────────────────────

export function resetPrototype() {
  state = initialState();
  save();
  listeners.forEach((listener) => listener());
  syncUrl();
}

export function expireSession() {
  update((s) => { if (s.session) s.session.expired = true; });
}

export function openMail(id: string) {
  const mail = state.mailbox.find((entry) => entry.id === id);
  if (!mail) return;
  update((s) => { s.openMailId = id; });
  go(mail.kind === 'invite' ? 'A01' : mail.kind === 'reset' ? 'C03' : 'B01');
}

/** Prepara o contexto mínimo para abrir qualquer tela direto pelo painel. */
export function jumpTo(target: ScreenId) {
  update((s) => {
    const ana = s.accounts[ANA];
    const bruno = s.accounts[BRUNO];
    const enroll = (confirmed: boolean) => {
      if (bruno.twoFactorActive) {
        Object.assign(bruno, { twoFactorActive: false, secret: null, recoveryCodes: [], activatedAt: null });
      }
      bruno.invite = 'valid';
      bruno.password ??= DEMO_PASSWORD;
      bruno.pendingSecret ??= newSecret();
      bruno.pendingConfirmed = confirmed;
      bruno.pendingCodes = confirmed ? bruno.pendingCodes ?? newRecoveryCodes() : null;
      s.inviteEmail = BRUNO;
      s.session = { kind: 'enrollment', email: BRUNO, expired: false };
    };
    const as = (kind: SessionKind, expired = false) => { s.session = { kind, email: ANA, expired }; };
    s.lock = null;
    s.netError = null;
    s.notice = null;
    switch (target) {
      case 'A01': case 'A02':
        bruno.invite = 'valid';
        s.inviteEmail = BRUNO;
        if (!s.mailbox.some((mail) => mail.kind === 'invite')) s.mailbox.unshift(inviteMail(BRUNO));
        s.openMailId = s.mailbox.find((mail) => mail.kind === 'invite')!.id;
        break;
      case 'A03': bruno.invite = 'expired'; s.inviteEmail = BRUNO; break;
      case 'A06': case 'A07': case 'A08': case 'A09': case 'A10': case 'A11': case 'A12': case 'B06': enroll(false); break;
      case 'A13': case 'A14': enroll(true); s.ackCodes = target === 'A14'; break;
      case 'A15': as('full'); break;
      case 'B01': case 'B02': s.session = null; break;
      case 'B03': s.lock = { until: Date.now() + LOCK_BASE_SECONDS * 1000, origin: 'B01' }; break;
      case 'B04': case 'B05': case 'D01': case 'D02': case 'D03': as('challenge'); break;
      case 'C03': case 'C04': case 'C07':
        s.resetLink = { email: ANA, status: 'valid' };
        if (!s.mailbox.some((mail) => mail.kind === 'reset')) {
          s.mailbox.unshift({ id: crypto.randomUUID(), kind: 'reset', to: ANA, subject: 'Redefina sua senha da OCK', body: 'Recebemos um pedido para redefinir a senha da sua conta.', at: Date.now() });
        }
        break;
      case 'C05': s.resetLink = { email: ANA, status: 'expired' }; break;
      case 'D04': case 'D07': case 'D08':
        as('restricted');
        ana.pendingSecret ??= newSecret();
        ana.pendingConfirmed = target === 'D08';
        ana.pendingCodes = target === 'D08' ? ana.pendingCodes ?? newRecoveryCodes() : null;
        break;
      case 'E01': case 'E02': case 'E06': as('full'); break;
      case 'E04': as('full', true); break;
      case 'E05': s.netError = { origin: 'B01', kind: 'request' }; break;
    }
  });
  go(target);
}

/** Código atual do "aplicativo" para o segredo informado, usado pelo autenticador simulado. */
export { fakeTotp };
