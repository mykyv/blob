'use client';

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useBlobStore } from '@/lib/store';
import type { BackgroundConfig } from './types';

const PLANE_Z = -10;

interface FullscreenPlaneProps {
  children: React.ReactNode;
}

function FullscreenPlane({ children }: FullscreenPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { camera, size } = useThree();

  useFrame(() => {
    const persp = camera as THREE.PerspectiveCamera;
    const dist = Math.abs(camera.position.z - PLANE_Z);
    const fovRad = (persp.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fovRad / 2) * dist;
    const aspect = size.width / size.height;
    meshRef.current.scale.set(height * aspect, height, 1);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, PLANE_Z]} renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      {children}
    </mesh>
  );
}

function ColorBg({ color }: { color: string }) {
  return (
    <FullscreenPlane>
      <meshBasicMaterial color={color} toneMapped={false} depthWrite={false} />
    </FullscreenPlane>
  );
}

function GradientBg({ from, to, angle }: { from: string; to: string; angle: number }) {
  const { size } = useThree();
  const aspect = size.width / size.height || 1;

  const texture = useMemo(() => {
    const w = 1024;
    const h = Math.max(1, Math.round(w / aspect));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    // CSS linear-gradient angle: 0deg points up (to top), increasing clockwise.
    const rad = (angle * Math.PI) / 180;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    const cx = w / 2;
    const cy = h / 2;
    // Span the bounding box along the gradient axis so colors reach the corners.
    const halfSpan = Math.abs(dx) * (w / 2) + Math.abs(dy) * (h / 2);
    const grad = ctx.createLinearGradient(
      cx - dx * halfSpan,
      cy - dy * halfSpan,
      cx + dx * halfSpan,
      cy + dy * halfSpan,
    );
    grad.addColorStop(0, from);
    grad.addColorStop(1, to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [from, to, angle, aspect]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <FullscreenPlane>
      <meshBasicMaterial map={texture} toneMapped={false} depthWrite={false} />
    </FullscreenPlane>
  );
}

function ImageBg({ url }: { url: string }) {
  const texture = useLoader(THREE.TextureLoader, url);
  const { size } = useThree();

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const img = texture.image as HTMLImageElement | undefined;
    if (!img || !img.width || !img.height) return;
    const imgAspect = img.width / img.height;
    const viewAspect = size.width / size.height || 1;
    if (imgAspect > viewAspect) {
      const r = viewAspect / imgAspect;
      texture.repeat.set(r, 1);
      texture.offset.set((1 - r) / 2, 0);
    } else {
      const r = imgAspect / viewAspect;
      texture.repeat.set(1, r);
      texture.offset.set(0, (1 - r) / 2);
    }
    texture.needsUpdate = true;
  }, [texture, size.width, size.height]);

  return (
    <FullscreenPlane>
      <meshBasicMaterial map={texture} toneMapped={false} depthWrite={false} />
    </FullscreenPlane>
  );
}

function DomSnapshotBg() {
  const { gl } = useThree();
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let alive = true;
    let pending = false;
    let lastTexture: THREE.CanvasTexture | null = null;

    const capture = async () => {
      if (pending) return;
      const wrapper = gl.domElement.parentElement as HTMLElement | null;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      pending = true;
      try {
        const html2canvas = (await import('html2canvas')).default;
        const snapshot = await html2canvas(document.body, {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
          backgroundColor: null,
          ignoreElements: (node) => wrapper === node || wrapper.contains(node),
          scale: 1,
          logging: false,
          useCORS: true,
        });
        if (!alive) return;
        const tex = new THREE.CanvasTexture(snapshot);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        if (lastTexture) lastTexture.dispose();
        lastTexture = tex;
        setTexture(tex);
      } catch (err) {
        console.warn('[BlobBackground] DOM snapshot failed:', err);
      } finally {
        pending = false;
      }
    };

    const initialTimer = window.setTimeout(capture, 300);

    let resizeTimer: number | undefined;
    const onResize = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(capture, 300);
    };
    window.addEventListener('resize', onResize);

    return () => {
      alive = false;
      window.clearTimeout(initialTimer);
      if (resizeTimer) window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      if (lastTexture) lastTexture.dispose();
    };
  }, [gl]);

  return (
    <FullscreenPlane>
      {texture ? (
        <meshBasicMaterial map={texture} toneMapped={false} depthWrite={false} />
      ) : (
        <meshBasicMaterial color="#ffffff" toneMapped={false} depthWrite={false} transparent opacity={0} />
      )}
    </FullscreenPlane>
  );
}

interface ImageBoundaryProps {
  onError: (message: string) => void;
  fallback: ReactNode;
  children: ReactNode;
}

class ImageErrorBoundary extends Component<ImageBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    const raw = error instanceof Error ? error.message : String(error ?? '');
    const msg = /could not load/i.test(raw)
      ? "Couldn't load image. The host may not allow cross-origin access — try a CORS-friendly URL (e.g. Unsplash, imgur direct links)."
      : raw || 'Image failed to load.';
    // Defer so we don't update a sibling store during the catch phase of another render.
    queueMicrotask(() => this.props.onError(msg));
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface Props {
  bg: BackgroundConfig;
}

export function BlobBackground({ bg }: Props) {
  const setImageError = useBlobStore((s) => s.setImageError);

  if (bg.mode === 'color') return <ColorBg color={bg.color} />;
  if (bg.mode === 'gradient') return <GradientBg from={bg.from} to={bg.to} angle={bg.angle} />;
  if (bg.mode === 'image') {
    if (!bg.url) return <ColorBg color="#ffffff" />;
    return (
      <ImageErrorBoundary key={bg.url} onError={setImageError} fallback={<ColorBg color="#ffffff" />}>
        <Suspense fallback={<ColorBg color="#ffffff" />}>
          <ImageBg url={bg.url} />
        </Suspense>
      </ImageErrorBoundary>
    );
  }
  if (bg.mode === 'dom-snapshot') return <DomSnapshotBg />;
  return null;
}
