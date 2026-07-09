'use client';

import {
  useState,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { ColorPicker } from './ColorPicker';

/* ─── InfoHint — the "?" affordance with a portal tooltip ───────────────── */

export function InfoHint({ hint }: { hint: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  const show = () => {
    const el = iconRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ left: r.left + r.width / 2, top: r.top });
    setOpen(true);
  };
  const hide = () => setOpen(false);

  return (
    <>
      <span
        ref={iconRef}
        className="ctrl-hint"
        aria-label={hint}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
      >
        ?
      </span>
      {open && pos && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="ctrl-tooltip"
              style={{ left: pos.left, top: pos.top - 8 }}
            >
              {hint}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/* ─── Section — uppercase header + grouped rows ─────────────────────────── */

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="ctrl-section">
      <h3 className="ctrl-section-title">{title}</h3>
      {children}
    </section>
  );
}

function RowLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <span className="ctrl-label">
      {label}
      {hint ? <InfoHint hint={hint} /> : null}
    </span>
  );
}

/* ─── Numeric helpers ───────────────────────────────────────────────────── */

function decimalsForStep(step: number) {
  if (step >= 1) return 0;
  const s = String(step);
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}

function formatVal(value: number, step: number) {
  return value.toFixed(decimalsForStep(step));
}

/* ─── Slider — label + editable readout + pill track ────────────────────── */

interface SliderProps {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

export function Slider({ label, hint, value, min, max, step, onChange }: SliderProps) {
  const [text, setText] = useState<string | null>(null);
  const display = text ?? formatVal(value, step);
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const commit = (raw: string) => {
    const n = parseFloat(raw);
    if (!Number.isNaN(n)) {
      onChange(Math.min(max, Math.max(min, n)));
    }
    setText(null);
  };

  return (
    <div className="ctrl-row ctrl-row--slider">
      <div className="ctrl-row-head">
        <RowLabel label={label} hint={hint} />
        <input
          className="ctrl-num"
          value={display}
          inputMode="decimal"
          onChange={(e) => setText(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              setText(null);
              e.currentTarget.blur();
            }
          }}
        />
      </div>
      <input
        type="range"
        className="ctrl-range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ '--fill': `${pct}%` } as CSSProperties}
      />
    </div>
  );
}

/* ─── ColorRow — label + hex + swatch (native color input) ──────────────── */

interface ColorRowProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}

export function ColorRow({ label, hint, value, onChange }: ColorRowProps) {
  const [text, setText] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const swatchRef = useRef<HTMLButtonElement>(null);
  const display = text ?? value;

  const commitHex = (raw: string) => {
    let hex = raw.trim();
    if (hex && !hex.startsWith('#')) hex = `#${hex}`;
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) onChange(hex);
    setText(null);
  };

  return (
    <div className="ctrl-row ctrl-row--color">
      <div className="ctrl-color-meta">
        <RowLabel label={label} hint={hint} />
        <input
          className="ctrl-hex"
          value={display}
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commitHex(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              setText(null);
              e.currentTarget.blur();
            }
          }}
        />
      </div>
      <button
        ref={swatchRef}
        type="button"
        className="ctrl-swatch"
        aria-label={`${label} color`}
        aria-expanded={open}
        style={{ background: value }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="ctrl-swatch-chevron" aria-hidden>
          ⌄
        </span>
      </button>
      {open && (
        <ColorPicker
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
          anchorEl={swatchRef.current}
        />
      )}
    </div>
  );
}

/* ─── SelectRow — label + styled native <select> ────────────────────────── */

interface SelectRowProps<T extends string> {
  label: string;
  hint?: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}

export function SelectRow<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: SelectRowProps<T>) {
  return (
    <div className="ctrl-row ctrl-row--select">
      <RowLabel label={label} hint={hint} />
      <div className="ctrl-select-wrap">
        <select
          className="ctrl-select"
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <span className="ctrl-select-chevron" aria-hidden>
          ⌄
        </span>
      </div>
    </div>
  );
}

/* ─── Toggle — pill on/off switch ───────────────────────────────────────── */

interface ToggleProps {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ label, hint, value, onChange }: ToggleProps) {
  return (
    <div className="ctrl-row ctrl-row--toggle">
      <RowLabel label={label} hint={hint} />
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        className={`ctrl-switch${value ? ' is-on' : ''}`}
        onClick={() => onChange(!value)}
      >
        <span className="ctrl-switch-knob" />
      </button>
    </div>
  );
}

/* ─── TextRow — label + free-text input (e.g. image URL) ────────────────── */

interface TextRowProps {
  label: string;
  hint?: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}

export function TextRow({ label, hint, value, placeholder, onChange }: TextRowProps) {
  const [text, setText] = useState<string | null>(null);
  const display = text ?? value;
  return (
    <div className="ctrl-row ctrl-row--text">
      <RowLabel label={label} hint={hint} />
      <input
        className="ctrl-text"
        value={display}
        placeholder={placeholder}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value);
        }}
        onBlur={() => setText(null)}
      />
    </div>
  );
}
