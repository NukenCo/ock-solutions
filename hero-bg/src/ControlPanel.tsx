import { useEffect, useState } from 'react';
import { configFields, defaultConfig, type ConfigStore } from './config';

// Painel de ajuste para desenvolvimento. No site, aparece com ?ajustes na URL.
export function ControlPanel({ store }: { store: ConfigStore }) {
  const [config, setConfig] = useState(store.get);
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => store.subscribe(setConfig), [store]);

  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(store.get(), null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <aside className="ock-controls" aria-label="Ajustes do fundo animado">
      <button type="button" className="ock-controls__toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        Ajustes do fundo {open ? '−' : '+'}
      </button>
      {open && (
        <div className="ock-controls__body">
          {configFields.map((field) => (
            <label key={field.key} className="ock-controls__field">
              <span>
                {field.label}
                <output>{config[field.key]}</output>
              </span>
              <input
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={config[field.key]}
                onChange={(event) => store.set({ [field.key]: Number(event.target.value) })}
              />
            </label>
          ))}
          <div className="ock-controls__actions">
            <button type="button" onClick={copy}>{copied ? 'Copiado' : 'Copiar valores'}</button>
            <button type="button" onClick={() => store.set(defaultConfig)}>Restaurar</button>
          </div>
        </div>
      )}
    </aside>
  );
}
