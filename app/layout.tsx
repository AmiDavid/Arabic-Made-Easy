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
        {/* Subtle fixed background scene — Jerusalem/Bethlehem horizon on every page */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            backgroundImage: "url('/art/jerusalem-bethlehem.svg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
            opacity: 0.14,
          }}
        />
        {/* Gradient to keep text legible */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-night-900/80 via-night-900/50 to-night-900/95"
        />

        <div className="min-h-dvh flex flex-col relative">
          <main className="flex-1 pb-24">{children}</main>
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
