import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GlassBlob — animated glass blob constructor',
  description:
    'Design and embed a customizable WebGL glass blob: live shape, transparency, motion, and click effects. Open source, copy-paste embed, no framework lock-in.',
  keywords: [
    'animated blob',
    'WebGL blob',
    'glass blob generator',
    'three.js blob',
    'blob constructor',
    'website background animation',
  ],
  openGraph: {
    title: 'GlassBlob — animated glass blob constructor',
    description:
      'Design and embed a customizable WebGL glass blob. Open source, copy-paste embed, no framework lock-in.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
