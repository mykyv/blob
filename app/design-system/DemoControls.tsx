'use client';

import { useControls, useCreateStore, LevaPanel, folder } from 'leva';
import { useState } from 'react';

export function DemoControls() {
  const store = useCreateStore();

  useControls(
    {
      Booleans: folder({
        followEnabled: { value: true, label: 'followEnabled' },
        clickEnabled: { value: false, label: 'clickEnabled' },
      }),
      Numbers: folder({
        amplitude: { value: 0.55, min: 0, max: 2, step: 0.05, label: 'amplitude' },
        decay: { value: 1.15, min: 0.1, max: 5, step: 0.05, label: 'decay' },
      }),
      Pickers: folder({
        effect: { value: 'ripple', options: ['ripple', 'burst'], label: 'effect' },
        color: { value: '#f4f4f5', label: 'color' },
      }),
    },
    { store },
  );

  return (
    <LevaPanel
      store={store}
      fill
      flat
      titleBar={false}
      hideCopyButton
      theme={{
        colors: {
          elevation1: 'rgba(255,255,255,0.08)',
          elevation2: 'transparent',
          elevation3: 'rgba(255,255,255,0.06)',
          accent1: '#f4f4f5',
          accent2: '#f4f4f5',
          accent3: '#ffffff',
        },
        space: {
          sm: '14px',
          md: '14px',
          rowGap: '10px',
        },
        sizes: {
          controlWidth: '200px',
          numberInputMinWidth: '52px',
        },
      }}
    />
  );
}

export function DemoDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>Open dialog</button>
      {open && (
        <div className="dialog-backdrop" onClick={() => setOpen(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Dialog title</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 var(--space-3)' }}>
              A short description of what this dialog does.
            </p>
            <div className="tabs">
              <button className="active">Tab one</button>
              <button>Tab two</button>
            </div>
            <pre>{`<code>example</code>`}</pre>
            <div className="dialog-actions">
              <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setOpen(false)}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
