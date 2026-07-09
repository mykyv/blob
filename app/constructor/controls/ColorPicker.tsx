'use client';

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker } from 'react-colorful';

/* ─── Color conversion helpers ──────────────────────────────────────────── */

interface RGB {
  r: number;
  g: number;
  b: number;
}
interface HSL {
  h: number;
  s: number;
  l: number;
}

function hexToRgb(hex: string): RGB {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h || '0', 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }: RGB): string {
  const to = (x: number) =>
    Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const H = h / 360;
  const S = s / 100;
  const L = l / 100;
  if (S === 0) return { r: L * 255, g: L * 255, b: L * 255 };
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
  const p = 2 * L - q;
  return {
    r: hue2rgb(p, q, H + 1 / 3) * 255,
    g: hue2rgb(p, q, H) * 255,
    b: hue2rgb(p, q, H - 1 / 3) * 255,
  };
}

/* ─── A single numeric channel field ────────────────────────────────────── */

function ChannelField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  return (
    <div className="cp-field">
      <input
        value={text ?? String(value)}
        inputMode="numeric"
        onChange={(e) => setText(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onCommit(n);
          setText(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') {
            setText(null);
            e.currentTarget.blur();
          }
        }}
      />
      <label>{label}</label>
    </div>
  );
}

/* ─── The picker popover ────────────────────────────────────────────────── */

export function ColorPicker({
  value,
  onChange,
  onClose,
  anchorEl,
}: {
  value: string;
  onChange: (hex: string) => void;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}) {
  const popRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'rgb' | 'hsl'>('hsl');
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [hexText, setHexText] = useState<string | null>(null);

  const place = useCallback(() => {
    if (!anchorEl) return;
    const a = anchorEl.getBoundingClientRect();
    const pw = popRef.current?.offsetWidth || 232;
    const ph = popRef.current?.offsetHeight || 312;
    let left = a.left - pw - 10; // prefer opening to the left of the swatch
    if (left < 8) left = a.right + 10; // fall back to the right
    left = Math.min(left, window.innerWidth - pw - 8);
    left = Math.max(8, left);
    let top = Math.min(a.top, window.innerHeight - ph - 8);
    top = Math.max(8, top);
    setPos({ left, top });
  }, [anchorEl]);

  useLayoutEffect(() => {
    place();
  }, [place]);

  // Reposition on scroll/resize; close on Escape. Outside clicks are handled
  // by the backdrop element below (robust against react-colorful's pointer
  // capture, which makes document-level containment checks unreliable).
  useEffect(() => {
    const onScrollResize = () => place();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('scroll', onScrollResize, true);
    window.addEventListener('resize', onScrollResize);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onScrollResize, true);
      window.removeEventListener('resize', onScrollResize);
      document.removeEventListener('keydown', onKey);
    };
  }, [place, onClose]);

  const rgb = hexToRgb(value);
  const hsl = rgbToHsl(rgb);

  const commitHex = (raw: string) => {
    let hex = raw.trim();
    if (hex && !hex.startsWith('#')) hex = `#${hex}`;
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) onChange(hex);
    setHexText(null);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div className="cp-backdrop" onMouseDown={onClose} />
      <div
        className="cp-pop"
        ref={popRef}
        style={pos ? { left: pos.left, top: pos.top } : { opacity: 0 }}
      >
      <HexColorPicker color={value} onChange={onChange} />

      <div className="cp-controls">
        <select
          className="cp-mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as 'rgb' | 'hsl')}
        >
          <option value="hsl">HSL</option>
          <option value="rgb">RGB</option>
        </select>
        <div className="cp-fields">
          {mode === 'rgb' ? (
            <>
              <ChannelField label="R" value={rgb.r} onCommit={(v) => onChange(rgbToHex({ ...rgb, r: v }))} />
              <ChannelField label="G" value={rgb.g} onCommit={(v) => onChange(rgbToHex({ ...rgb, g: v }))} />
              <ChannelField label="B" value={rgb.b} onCommit={(v) => onChange(rgbToHex({ ...rgb, b: v }))} />
            </>
          ) : (
            <>
              <ChannelField label="H" value={hsl.h} onCommit={(v) => onChange(rgbToHex(hslToRgb({ ...hsl, h: v })))} />
              <ChannelField label="S" value={hsl.s} onCommit={(v) => onChange(rgbToHex(hslToRgb({ ...hsl, s: v })))} />
              <ChannelField label="L" value={hsl.l} onCommit={(v) => onChange(rgbToHex(hslToRgb({ ...hsl, l: v })))} />
            </>
          )}
        </div>
      </div>

      <div className="cp-hex-row">
        <span className="cp-hex-swatch" style={{ background: value }} />
        <input
          className="cp-hex-input"
          value={hexText ?? value}
          spellCheck={false}
          onChange={(e) => setHexText(e.target.value)}
          onBlur={(e) => commitHex(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              setHexText(null);
              e.currentTarget.blur();
            }
          }}
        />
      </div>
      </div>
    </>,
    document.body,
  );
}
