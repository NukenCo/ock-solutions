// Painel do protótipo: autenticador simulado, caixa de entrada, contas de teste, cenários e atalhos.
// Não faz parte do produto — existe só para conduzir testes do fluxo.
import { useEffect, useState } from 'react';
import { fakeTotp, secondsLeftInStep, TOTP_PERIOD_SECONDS } from './fake';
import { SCREEN_GROUPS, type ScreenId } from './screens';
import {
  ANA, BRUNO, DEMO_PASSWORD, expireSession, jumpTo, openMail, resetPrototype, update, useProto, type InviteStatus,
} from './store';

const OPEN_KEY = 'ock-login-painel-aberto';

function readOpen(): boolean {
  try {
    const saved = localStorage.getItem(OPEN_KEY);
    return saved === null ? window.matchMedia('(min-width: 1280px)').matches : saved === '1';
  } catch {
    return false;
  }
}

function useTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
}

function Authenticator() {
  const s = useProto();
  useTick();
  const left = secondsLeftInStep();
  const entries = Object.values(s.accounts).flatMap((account) => [
    ...(account.secret ? [{ label: account.email, secret: account.secret, tag: '' }] : []),
    ...(account.pendingSecret ? [{ label: account.email, secret: account.pendingSecret, tag: account.secret ? 'novo' : 'configurando' }] : []),
  ]);
  return (
    <section>
      <h2>Autenticador simulado</h2>
      <p className="panel-help">Faz o papel do aplicativo no celular. Use o código atual.</p>
      {entries.length === 0 && <p className="panel-help">Nenhuma conta vinculada ainda.</p>}
      <ul className="panel-totp">
        {entries.map((entry) => (
          <li key={entry.secret}>
            <span className="panel-totp-label">OCK · {entry.label}{entry.tag && <em> ({entry.tag})</em>}</span>
            <strong className="panel-totp-code">{fakeTotp(entry.secret).replace(/(\d{3})/, '$1 ')}</strong>
          </li>
        ))}
      </ul>
      {entries.length > 0 && (
        <div className="panel-timer" aria-label={`Novo código em ${left} segundos`}>
          <span style={{ width: `${(left / TOTP_PERIOD_SECONDS) * 100}%` }} />
        </div>
      )}
    </section>
  );
}

function Accounts() {
  const s = useProto();
  const ana = s.accounts[ANA];
  const bruno = s.accounts[BRUNO];
  return (
    <section>
      <h2>Contas de teste</h2>
      <dl className="panel-dl">
        <dt>Conta ativa</dt>
        <dd>{ANA}<br />Senha: <code>{ana.password === DEMO_PASSWORD ? DEMO_PASSWORD : 'a que você definiu'}</code></dd>
        <dt>Convidado</dt>
        <dd>{BRUNO}<br />{bruno.twoFactorActive ? 'Ativado' : bruno.password ? 'Senha criada, 2FA pendente' : 'Aguardando ativação'}</dd>
      </dl>
      {ana.recoveryCodes.length > 0 && (
        <details>
          <summary>Códigos de recuperação da Ana</summary>
          <ul className="panel-codes">
            {ana.recoveryCodes.map((entry) => <li key={entry.code} className={entry.used ? 'is-used' : undefined}>{entry.code}</li>)}
          </ul>
        </details>
      )}
    </section>
  );
}

function Mailbox() {
  const s = useProto();
  return (
    <section>
      <h2>Caixa de entrada</h2>
      {s.mailbox.length === 0 && <p className="panel-help">Nenhum e-mail.</p>}
      <ul className="panel-mail">
        {s.mailbox.slice(0, 6).map((mail) => (
          <li key={mail.id}>
            {mail.kind === 'notice' ? (
              <div title={mail.body}><strong>{mail.subject}</strong><span>{mail.to}</span></div>
            ) : (
              <button type="button" onClick={() => openMail(mail.id)}><strong>{mail.subject}</strong><span>{mail.to}</span></button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Scenarios() {
  const s = useProto();
  const bruno = s.accounts[BRUNO];
  return (
    <section>
      <h2>Cenários</h2>
      <label className="panel-field">
        Convite do Bruno
        <select value={bruno.invite ?? 'used'} onChange={(event) => update((d) => { d.accounts[BRUNO].invite = event.target.value as InviteStatus; })}>
          <option value="valid">Válido</option>
          <option value="expired">Expirado</option>
          <option value="canceled">Cancelado</option>
          <option value="used">Já usado</option>
        </select>
      </label>
      {s.resetLink && (
        <label className="panel-field">
          Link de nova senha
          <select value={s.resetLink.status} onChange={(event) => update((d) => { d.resetLink!.status = event.target.value as 'valid' | 'expired' | 'used'; })}>
            <option value="valid">Válido</option>
            <option value="expired">Expirado</option>
            <option value="used">Já usado</option>
          </select>
        </label>
      )}
      <label className="panel-check">
        <input type="checkbox" checked={!s.bondActive} onChange={(event) => update((d) => { d.bondActive = !event.target.checked; })} />
        Vínculo com a empresa revogado
      </label>
      <label className="panel-check">
        <input type="checkbox" checked={s.failNext} onChange={(event) => update((d) => { d.failNext = event.target.checked; })} />
        Falhar a próxima ação (conexão)
      </label>
      <div className="panel-buttons">
        <button type="button" onClick={expireSession} disabled={!s.session || s.session.expired}>Expirar sessão atual</button>
        <button type="button" onClick={() => update((d) => { d.lock = d.lock && { ...d.lock, until: 0 }; })} disabled={!s.lock}>Encerrar espera</button>
        <button type="button" onClick={resetPrototype}>Reiniciar protótipo</button>
      </div>
      <p className="panel-help">Sessão: {s.session ? `${labelOf(s.session.kind)}${s.session.expired ? ' (expirada)' : ''}` : 'nenhuma'}</p>
    </section>
  );
}

function labelOf(kind: string): string {
  return { enrollment: 'cadastro pendente', challenge: 'desafio de 2FA', restricted: 'restrita de recuperação', full: 'autorizada' }[kind] ?? kind;
}

function Screens({ current }: { current: ScreenId }) {
  return (
    <section>
      <h2>Ir para a tela</h2>
      {SCREEN_GROUPS.map((group) => (
        <details key={group.title} open={Object.keys(group.screens).includes(current)}>
          <summary>{group.title}</summary>
          <ul className="panel-screens">
            {Object.entries(group.screens).map(([id, name]) => (
              <li key={id}>
                <button type="button" aria-current={id === current ? 'page' : undefined} onClick={() => jumpTo(id as ScreenId)}>
                  <b>{id}</b> {name}
                </button>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </section>
  );
}

export function PrototypePanel() {
  const s = useProto();
  const [open, setOpen] = useState(readOpen);
  const toggle = () => {
    setOpen(!open);
    try {
      localStorage.setItem(OPEN_KEY, open ? '0' : '1');
    } catch {
      // preferência só desta visita
    }
  };
  return (
    <aside className={`panel${open ? ' is-open' : ''}`} aria-label="Painel do protótipo">
      <button type="button" className="panel-toggle" onClick={toggle} aria-expanded={open}>
        <span>Protótipo · {s.screen}</span>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="panel-body">
          <Authenticator />
          <Accounts />
          <Mailbox />
          <Scenarios />
          <Screens current={s.screen} />
        </div>
      )}
    </aside>
  );
}
