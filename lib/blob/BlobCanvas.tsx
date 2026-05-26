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
        onCreated={({ gl }) => {
          const canvas = gl.domElement;
          const onLost = (e: Event) => {
            // preventDefault tells the browser we want the context restored.
            e.preventDefault();
            console.warn('[BlobCanvas] WebGL context lost');
          };
          const onRestored = () => {
            console.info('[BlobCanvas] WebGL context restored');
          };
          canvas.addEventListener('webglcontextlost', onLost as EventListener);
          canvas.addEventListener('webglcontextrestored', onRestored as EventListener);
        }}
      >
        <Environment
          preset={config.envPreset}
          environmentIntensity={config.envIntensity}
          background={false}
        />
        <BlobBackground bg={config.background} />
        <GlassBlob config={config} />
      </Canvas>
    </div>
  );
}
