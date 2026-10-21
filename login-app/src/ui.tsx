// Componentes de interface do protótipo, seguindo os wireframes do Figma (Auth-Pages, node 82:12091)
// com o look & feel da OCK Solutions: logo OCK e faixas douradas no lugar das azuis.
import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import logoUrl from '../../assets/ock-logo.svg';
import alertIcon from './assets/alert-circle.svg';
import checkIcon from './assets/check-icon.svg';
import closeIcon from './assets/x-close.svg';
import copyIcon from './assets/copy-01.svg';

// ─── Fundo: faixas verticais douradas (mesmo desenho das faixas do Figma) ───

// [início transparente, pico, fim transparente] em %, na ordem das faixas do Figma.
const BAND_PATTERN: [number, number, number][] = [
  [29.8, 50.9, 100], [25.2, 48.5, 100], [20.6, 49.1, 100], [16.1, 52, 100], [11.5, 55.5, 100],
  [7, 57.6, 100], [2.4, 56.5, 99.5], [0, 51.3, 97.7], [0, 44.4, 94.9], [0, 35.9, 91.1],
  [0, 28, 86.2], [0, 22.6, 80.4], [0, 20.4, 74.2], [0, 21.1, 68.3], [0, 23.6, 63.6],
  [0, 26.9, 60.6], [0, 30.4, 60.1], [0, 33.5, 62], [0, 35.3, 66.1], [0, 35.2, 71.6],
  [0, 32.9, 77.7], [0, 29.4, 83.8], [0, 26.4, 89.1], [0, 25.6, 93.4], [0, 28.2, 96.6],
  [0, 34.2, 98.8], [0, 41.9, 100],
];

function Bands({ count, className }: { count: number; className: string }) {
  return (
    <div className={`bands ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        // Metade esquerda segue o padrão; a direita é espelhada, como no Figma.
        const index = i < count * 0.6 ? i % BAND_PATTERN.length : (count - 1 - i) % BAND_PATTERN.length;
        const [from, via, to] = BAND_PATTERN[index];
        return (
          <span
            key={i}
            style={{
              left: `${(i * 100) / count}%`,
              ['--from' as string]: `${from}%`,
              ['--via' as string]: `${via}%`,
              ['--to' as string]: `${to}%`,
              ['--band' as string]: i % 3 === 1 ? 'var(--gold-deep)' : 'var(--gold-light)',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Estrutura da página ─────────────────────────────────────────────────────

interface AuthLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** E-mail externo (A01, C03): mostra remetente e assunto, sem logo de produto. */
  mail?: { to: string; subject: string };
}

export function AuthLayout({ title, subtitle, children, mail }: AuthLayoutProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  // Cada tela nova move o foco para o título, para leitores de tela anunciarem a mudança.
  useEffect(() => heading.current?.focus(), []);

  return (
    <div className="auth">
      <Bands count={68} className="bands--desktop" />
      <Bands count={27} className="bands--mobile" />
      <main className={`auth-card${mail ? ' auth-card--mail' : ''}`} aria-labelledby="screen-title">
        {mail && (
          <div className="mail-meta">
            <span className="mail-chip">E-mail</span>
            <dl>
              <div><dt>De</dt><dd>OCK &lt;nao-responda@ock&gt;</dd></div>
              <div><dt>Para</dt><dd>{mail.to}</dd></div>
              <div><dt>Assunto</dt><dd>{mail.subject}</dd></div>
            </dl>
          </div>
        )}
        <header className="auth-header">
          <img className="auth-logo" src={logoUrl} width="145" height="40" alt="OCK Solutions" />
          <div className="auth-heading">
            <h1 id="screen-title" ref={heading} tabIndex={-1}>{title}</h1>
            {subtitle && <div className="auth-subtitle">{subtitle}</div>}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

export function Stack({ children, gap = 'md' }: { children: ReactNode; gap?: 'sm' | 'md' | 'lg' }) {
  return <div className={`stack stack--${gap}`}>{children}</div>;
}

// ─── Botões ──────────────────────────────────────────────────────────────────

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  type?: 'button' | 'submit';
  disabled?: boolean;
  /** Enquanto verdadeiro, o botão mostra `pendingLabel` e bloqueia novo envio. */
  pending?: boolean;
  pendingLabel?: string;
  icon?: string;
}

export function Button({ children, onClick, variant = 'primary', type = 'button', disabled, pending, pendingLabel = 'Validando…', icon }: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn--${variant}`}
      onClick={onClick}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
    >
      {pending ? pendingLabel : children}
      {icon && !pending && <img src={icon} width="20" height="20" alt="" />}
    </button>
  );
}

export function Actions({ children }: { children: ReactNode }) {
  return <div className="actions">{children}</div>;
}

// ─── Campos ──────────────────────────────────────────────────────────────────

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  error?: string | null;
  hint?: ReactNode;
  trailing?: ReactNode;
}

export function TextField({ label, value, onChange, error, hint, trailing, id, ...input }: TextFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = [error && `${fieldId}-error`, hint && `${fieldId}-hint`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label className="field-label" htmlFor={fieldId}>{label}</label>
      <div className={`input${error ? ' is-error' : ''}${input.readOnly ? ' is-readonly' : ''}`}>
        <input
          id={fieldId}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...input}
        />
        {trailing}
      </div>
      {error && <FieldError id={`${fieldId}-error`}>{error}</FieldError>}
      {hint && <p className="field-hint" id={`${fieldId}-hint`}>{hint}</p>}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p className="field-error" id={id}>
      <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 6.667V10m0 3.333h.008M18.333 10a8.333 8.333 0 1 1-16.666 0 8.333 8.333 0 0 1 16.666 0Z" fill="none" stroke="currentColor" strokeWidth="1.667" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {children}
    </p>
  );
}

export function PasswordField(props: Omit<TextFieldProps, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      autoCapitalize="none"
      spellCheck={false}
      trailing={
        <button type="button" className="input-toggle" onClick={() => setVisible(!visible)} aria-pressed={visible}>
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      }
    />
  );
}

interface OtpFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  hint?: ReactNode;
}

/** Campo único (aceita colar os 6 dígitos, ignora espaços) desenhado como seis caixas. */
export function OtpField({ label, value, onChange, error, hint }: OtpFieldProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label} <span className="field-required" aria-hidden="true">*</span>
      </label>
      <div className={`otp${error ? ' is-error' : ''}${focused ? ' is-focused' : ''}`}>
        <input
          id={id}
          className="otp-input"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          autoFocus
        />
        <div className="otp-cells" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className={`otp-cell${value[i] ? ' is-filled' : ''}${focused && i === Math.min(value.length, 5) ? ' is-active' : ''}`}>
              {value[i] ?? '0'}
            </span>
          ))}
        </div>
      </div>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
      {hint && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
    </div>
  );
}

export function Requirements({ items }: { items: { label: string; met: boolean }[] }) {
  return (
    <ul className="requirements" aria-label="Requisitos da senha">
      {items.map((item) => (
        <li key={item.label} className={item.met ? 'is-met' : undefined}>
          <img src={checkIcon} width="16" height="16" alt="" />
          <span>{item.label}<span className="visually-hidden">{item.met ? ' — atendido' : ' — pendente'}</span></span>
        </li>
      ))}
    </ul>
  );
}

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  const id = useId();
  return (
    <div className="checkbox">
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

// ─── Avisos ──────────────────────────────────────────────────────────────────

interface AlertProps {
  children: ReactNode;
  tone?: 'warning' | 'error';
  dismissible?: boolean;
  /** Erros são anunciados por leitores de tela assim que aparecem. */
  announce?: boolean;
}

export function Alert({ children, tone = 'warning', dismissible, announce }: AlertProps) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className={`alert alert--${tone}`} role={announce ? 'alert' : undefined}>
      <span className="alert-icon"><img src={alertIcon} width="20" height="20" alt="" /></span>
      <div className="alert-text">{children}</div>
      {dismissible && (
        <button type="button" className="alert-close" onClick={() => setOpen(false)} aria-label="Fechar aviso">
          <img src={closeIcon} width="20" height="20" alt="" />
        </button>
      )}
    </div>
  );
}

// ─── Chave, QR e códigos ─────────────────────────────────────────────────────

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return { copied, copy };
}

export function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const { copied, copy } = useCopy();
  return (
    <>
      <Button variant="secondary" icon={copyIcon} onClick={() => copy(text)}>{copied ? copiedLabel : label}</Button>
      <span className="visually-hidden" aria-live="polite">{copied ? copiedLabel : ''}</span>
    </>
  );
}

/** QR ilustrativo e NÃO funcional: padrão determinístico só para representar a tela. */
export function QrIllustration({ seed }: { seed: string }) {
  const size = 25;
  const cells: boolean[] = [];
  let h = 2166136261;
  for (const char of seed) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  for (let i = 0; i < size * size; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    cells.push((h >>> 0) % 100 < 46);
  }
  const finder = (x: number, y: number) => {
    for (const [fx, fy] of [[0, 0], [size - 7, 0], [0, size - 7]]) {
      const dx = x - fx;
      const dy = y - fy;
      if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) {
        const ring = Math.min(dx, dy, 6 - dx, 6 - dy);
        return ring !== 1;
      }
    }
    return null;
  };
  return (
    <div className="qr">
      <svg viewBox={`0 0 ${size} ${size}`} width="132" height="132" shapeRendering="crispEdges" role="img" aria-label="QR code ilustrativo, não funcional">
        {cells.map((on, i) => {
          const x = i % size;
          const y = Math.floor(i / size);
          const fixed = finder(x, y);
          return (fixed ?? on) ? <rect key={i} x={x} y={y} width="1" height="1" fill="#171717" /> : null;
        })}
      </svg>
    </div>
  );
}

export function CodeList({ codes }: { codes: string[] }) {
  return (
    <ul className="code-list" aria-label="Códigos de recuperação">
      {codes.map((code) => <li key={code}>{code}</li>)}
    </ul>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="note">{children}</p>;
}
