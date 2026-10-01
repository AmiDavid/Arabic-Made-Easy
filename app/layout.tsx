import type { Metadata, Viewport } from 'next';
import './globals.css';
import Nav from '@/components/nav';

export const metadata: Metadata = {
  title: 'Arabic Made Easy',
  description: 'Learn Palestinian Arabic — content & teaching system by Basil Zboun',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#d4a64a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        {/* Night-sky base so stars read; the scene sits on top of this */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-20 bg-gradient-to-b from-night-900 via-night-800 to-night-900"
        />
        {/* The Jerusalem/Bethlehem horizon — floats above the nav so it's visible */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 -z-10"
          style={{
            bottom: '112px',  // above the nav (72px) + credit pill
            backgroundImage: "url('/art/horizon.svg')",
            backgroundSize: '100% auto',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
            height: '220px',
            opacity: 0.85,
            maskImage: 'linear-gradient(to top, black 55%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 55%, transparent 100%)',
          }}
        />
        {/* Subtle star field (CSS-only radial dots) upper area */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[40vh] opacity-50"
          style={{
            backgroundImage: `
              radial-gradient(circle at 15% 20%, #f0e6c8 0.5px, transparent 1px),
              radial-gradient(circle at 85% 15%, #f0e6c8 0.5px, transparent 1px),
              radial-gradient(circle at 50% 35%, #f0e6c8 0.4px, transparent 1px),
              radial-gradient(circle at 30% 50%, #f0e6c8 0.5px, transparent 1px),
              radial-gradient(circle at 75% 45%, #f0e6c8 0.4px, transparent 1px),
              radial-gradient(circle at 20% 70%, #f0e6c8 0.3px, transparent 1px)
            `,
            backgroundSize: '280px 280px, 220px 220px, 320px 320px, 180px 180px, 260px 260px, 300px 300px',
          }}
        />

        {/* Solid dark band behind the nav + credit so horizon doesn't fight it */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 bg-gradient-to-t from-night-900 via-night-900/95 to-night-900/0"
          style={{ height: '112px' }}
        />

        <div className="min-h-dvh flex flex-col relative">
          <main className="flex-1 pb-28">{children}</main>
          <Credits />
          <Nav />
        </div>
      </body>
    </html>
  );
}

function Credits() {
  return (
    <div className="fixed bottom-[72px] inset-x-0 z-40 text-center pointer-events-none">
      <div className="inline-block pointer-events-auto bg-night-900/80 backdrop-blur border hairline rounded-full px-3 py-1 text-[9px] text-stone-200/60">
        نِظَام العَرَبِي السَهِل · <span className="text-gold-500/80">Basil Zboun</span>
      </div>
    </div>
  );
}
