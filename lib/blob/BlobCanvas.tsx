'use client';

import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import type { BlobConfig } from './types';
import { GlassBlob } from './GlassBlob';
import { BlobBackground } from './BlobBackground';

interface Props {
  config: BlobConfig;
  className?: string;
  style?: React.CSSProperties;
}

export function BlobCanvas({ config, className, style }: Props) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, config.cameraZ], fov: config.cameraFov }}
        style={{ position: 'absolute', inset: 0, background: 'transparent' }}
        dpr={[1, 2]}
        gl={{ alpha: true, premultipliedAlpha: false }}
      >
        <ambientLight intensity={config.ambientIntensity} />
        <directionalLight position={[3, 2, 5]} intensity={config.directionalIntensity} />
        <directionalLight position={[-3, -2, -5]} intensity={config.fillIntensity} />
        <Environment preset="studio" background={false} />
        <BlobBackground bg={config.background} />
        <GlassBlob config={config} />
      </Canvas>
    </div>
  );
}
