import Link from 'next/link';
import { LandingBlob } from './LandingBlob';

export default function HomePage() {
  return (
    <main className="landing">
      <div className="landing-hero">
        <div className="landing-blob"><LandingBlob /></div>
        <div>
          <h1>Animated glass blobs, made yours.</h1>
          <p>
            Design a WebGL glass blob in your browser — shape, transparency, motion,
            click reactivity. Copy a one-line embed and drop it into any site. Open source.
          </p>
          <Link href="/constructor" className="landing-cta">
            Open the constructor →
          </Link>
        </div>
      </div>
      <footer className="landing-footer">
        <p>
          Open source · <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          {' · '}
          <Link href="/about">How it works</Link>
        </p>
      </footer>
    </main>
  );
}
