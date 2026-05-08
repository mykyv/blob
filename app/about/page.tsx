export const metadata = {
  title: 'How GlassBlob works',
  description:
    'GlassBlob is built on React Three Fiber, drei MeshTransmissionMaterial, and simplex-noise. Per-frame vertex deformation, SDF-based morph targets, and rate-limited cursor follow.',
};

export default function AboutPage() {
  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '4rem 2rem', lineHeight: 1.7 }}>
      <h1>How GlassBlob works</h1>
      <p>
        GlassBlob is an open-source generator for animated WebGL glass blobs. Pick a shape,
        dial the transparency and motion, choose how it reacts to clicks, and copy a one-line
        embed that drops into any website — React, Vue, plain HTML, WordPress, Webflow.
      </p>
      <h2>The tech</h2>
      <ul>
        <li><strong>React Three Fiber + drei</strong> — physically-based glass refraction via <code>MeshTransmissionMaterial</code></li>
        <li><strong>Icosahedron geometry</strong>, detail level 18 — avoids pole pinching when deforming</li>
        <li><strong>simplex-noise</strong> — two layers (low + high frequency) for organic motion, plus a trail-bias layer keyed off cursor velocity</li>
        <li><strong>Signed distance functions</strong> — composite SDFs for laptop/camera/pen/book/Fuji morph targets, sampled by ray-from-origin march</li>
        <li><strong>Two-stage cursor lerp + dead zone + rate-limited rotation</strong> — what makes the follow feel alive, not jittery</li>
      </ul>
      <h2>Why an embed snippet?</h2>
      <p>
        The constructor outputs a tiny <code>&lt;script&gt;</code> tag plus a JSON config in a{' '}
        <code>data-glassblob</code> attribute. No npm install, no framework lock-in. The same
        bundle works wherever you can paste HTML.
      </p>
      <p>
        For React users, the JSON config plugs straight into the <code>BlobCanvas</code> component
        from the source repo.
      </p>
      <p>
        <a href="/constructor">→ Open the constructor</a>
      </p>
    </main>
  );
}
