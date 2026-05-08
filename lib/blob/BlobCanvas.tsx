'use client';

import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import type { BlobConfig, BackgroundConfig } from './types';
import { GlassBlob } from './GlassBlob';

function backgroundStyle(bg: BackgroundConfig): React.CSSProperties {
  switch (bg.mode) {
    case 'color':
      return { background: bg.color };
    case 'gradient':
      return { background: `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})` };
    case 'image':
      return {
        backgroundImage: `url(${bg.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    default:
      return { background: '#000' };
  }
}

interface Props {
  config: BlobConfig;
  className?: string;
  style?: React.CSSProperties;
}

export function BlobCanvas({ config, className, style }: Props) {
  const bgStyle = useMemo(() => backgroundStyle(config.background), [config.background]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...bgStyle,
        ...style,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, config.cameraZ], fov: config.cameraFov }}
        style={{ position: 'absolute', inset: 0 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={config.ambientIntensity} />
        <directionalLight position={[3, 2, 5]} intensity={config.directionalIntensity} />
        <directionalLight position={[-3, -2, -5]} intensity={config.fillIntensity} />
        <GlassBlob config={config} />
      </Canvas>
    </div>
  );
}
