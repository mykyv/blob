import type { Metadata } from 'next';
import { DemoControls, DemoDialogTrigger } from './DemoControls';

export const metadata: Metadata = {
  title: 'Design system — GlassBlob',
  robots: { index: false, follow: false },
};

const COLORS: { token: string; value: string }[] = [
  { token: '--bg', value: '#0a0418' },
  { token: '--bg-panel', value: 'rgba(10,4,24,0.85)' },
  { token: '--surface-1', value: '#14082a' },
  { token: '--surface-2', value: 'rgba(255,255,255,0.06)' },
  { token: '--surface-3', value: 'rgba(255,255,255,0.12)' },
  { token: '--border', value: 'rgba(255,255,255,0.08)' },
  { token: '--border-strong', value: 'rgba(255,255,255,0.18)' },
  { token: '--text', value: '#f4f1ff' },
  { token: '--text-muted', value: 'rgba(244,241,255,0.6)' },
  { token: '--text-faint', value: 'rgba(244,241,255,0.4)' },
  { token: '--accent', value: '#f4f4f5' },
  { token: '--accent-hover', value: '#e4e4e7' },
  { token: '--on-accent', value: '#0a0418' },
];

const SPACING = [
  { token: '--space-1', px: '4px' },
  { token: '--space-2', px: '8px' },
  { token: '--space-3', px: '13.6px' },
  { token: '--space-4', px: '16px' },
  { token: '--space-5', px: '24px' },
  { token: '--space-6', px: '32px' },
];

const RADII = [
  { token: '--radius-sm', px: '6px' },
  { token: '--radius-md', px: '8px' },
  { token: '--radius-lg', px: '12px' },
  { token: '--radius-pill', px: '999px' },
];

export default function DesignSystemPage() {
  return (
    <main className="ds">
      <h1>Design system</h1>
      <p className="ds-lede">
        Tokens and components used across GlassBlob. This page is for internal alignment;
        it is not linked from the site.
      </p>

      <section className="ds-section">
        <h2>Colors</h2>
        <div className="ds-grid">
          {COLORS.map(({ token, value }) => (
            <div key={token} className="ds-card">
              <div className="ds-swatch" style={{ background: `var(${token})` }} />
              <span className="ds-token">{token}</span>
              <span className="ds-label">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ds-section">
        <h2>Typography</h2>
        <div>
          <p className="ds-type-sample" style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
            Heading 1 — 2rem / 700
          </p>
          <p className="ds-type-sample" style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
            Heading 3 — 1.125rem / 600
          </p>
          <p className="ds-type-sample" style={{ fontSize: 'var(--font-size-md)' }}>
            Body — 1rem. The quick brown fox jumps over the lazy dog.
          </p>
          <p className="ds-type-sample" style={{ fontSize: 'var(--font-size-sm)' }}>
            Small — 0.875rem. Used for buttons, labels.
          </p>
          <p className="ds-type-sample" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Eyebrow — 0.75rem, muted, uppercase
          </p>
          <p className="ds-type-sample" style={{ color: 'var(--text-muted)' }}>
            Muted body text — secondary information.
          </p>
        </div>
      </section>

      <section className="ds-section">
        <h2>Spacing</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {SPACING.map(({ token, px }) => (
            <div key={token} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <span className="ds-token" style={{ minWidth: 110 }}>{token}</span>
              <span className="ds-label" style={{ minWidth: 60 }}>{px}</span>
              <div className="ds-spacing-bar" style={{ width: `var(${token})` }} />
            </div>
          ))}
        </div>
      </section>

      <section className="ds-section">
        <h2>Radii</h2>
        <div className="ds-row">
          {RADII.map(({ token, px }) => (
            <div key={token} className="ds-card" style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: 'var(--accent)',
                  borderRadius: `var(${token})`,
                  margin: '0 auto var(--space-2)',
                }}
              />
              <span className="ds-token">{token}</span>
              <span className="ds-label">{px}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ds-section">
        <h2>Buttons</h2>
        <div className="ds-row">
          <button className="btn">Default</button>
          <button className="btn btn-primary">Primary</button>
          <button className="btn" disabled>Disabled</button>
        </div>
      </section>

      <section className="ds-section">
        <h2>Surface card</h2>
        <div className="ds-card" style={{ maxWidth: 360 }}>
          <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-md)' }}>Card title</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Cards use <code>--surface-2</code> over a <code>--border</code> outline.
          </p>
        </div>
      </section>

      <section className="ds-section">
        <h2>Dialog</h2>
        <DemoDialogTrigger />
      </section>

      <section className="ds-section">
        <h2>Form controls (Leva panel)</h2>
        <p className="ds-lede" style={{ margin: '0 0 var(--space-3)' }}>
          Checkbox, number slider, dropdown and color picker — the same theme used in the constructor panel.
        </p>
        <div
          className="controls-leva"
          style={{
            maxWidth: 420,
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
          }}
        >
          <DemoControls />
        </div>
      </section>
    </main>
  );
}
