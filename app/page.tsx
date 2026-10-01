import Link from 'next/link';
import { BookOpen, Layers, Grid3x3, Camera, Mic, BookMarked, Image as ImageIcon } from 'lucide-react';

const TILES = [
  { href: '/catalog', title: 'Vocabulary', ar: 'الكَلِمَات', desc: 'Browse & search 2,000+ words', icon: BookOpen, accent: 'from-stone-200/15 to-stone-500/5' },
  { href: '/grammar', title: 'Grammar', ar: 'القَوَاعِد', desc: 'Rules, patterns & examples', icon: BookMarked, accent: 'from-olive-500/20 to-olive-700/5' },
  { href: '/flashcards', title: 'Flashcards', ar: 'البِطَاقَات', desc: 'Spaced repetition practice', icon: Layers, accent: 'from-gold-500/20 to-gold-600/5' },
  { href: '/match', title: 'Matching game', ar: 'التَوفِيق', desc: 'Pair Arabic ↔ English', icon: Grid3x3, accent: 'from-terracotta-400/20 to-terracotta-600/5' },
  { href: '/scan', title: 'Scan a page', ar: 'المَسح', desc: 'Add new notebook pages', icon: Camera, accent: 'from-night-500/25 to-night-700/5' },
  { href: '/voice', title: 'Voice chat', ar: 'المُحَادَثَة', desc: 'Practice speaking Palestinian', icon: Mic, accent: 'from-gold-400/20 to-terracotta-500/10' },
  { href: '/pages-viewer', title: 'Notebook pages', ar: 'الدَفتَر', desc: 'Browse original scans', icon: ImageIcon, accent: 'from-stone-500/15 to-stone-700/5' },
];

export default function Home() {
  return (
    <div>
      {/* HERO — Jerusalem + Bethlehem at night */}
      <div className="relative overflow-hidden">
        <img
          src="/art/jerusalem-bethlehem.svg"
          alt="Jerusalem and Bethlehem at night"
          className="w-full h-[260px] sm:h-[320px] object-cover object-bottom select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-night-900/10 via-night-900/40 to-night-900"></div>
        <div className="absolute inset-x-0 bottom-0 px-4 pb-6 max-w-5xl mx-auto">
          <div className="text-[10px] tracking-[0.3em] text-gold-500 font-semibold mb-2">ARABIC MADE EASY</div>
          <h1 className="display text-4xl sm:text-5xl font-semibold text-stone-50">
            أَهلًا فِيك
          </h1>
          <p className="text-stone-200/80 mt-2 text-sm max-w-md">
            From a notebook of Palestinian Arabic — now in your pocket.
          </p>
        </div>
      </div>

      {/* TILES */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {TILES.map(({ href, title, ar, desc, icon: Icon, accent }) => (
            <Link
              key={href}
              href={href}
              className="group relative overflow-hidden rounded-2xl border hairline bg-stone-900/40 p-4 hover:bg-stone-800/50 transition"
            >
              <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${accent} blur-2xl group-hover:scale-110 transition`} />
              <div className="relative">
                <Icon className="w-5 h-5 mb-3 text-gold-500" />
                <div className="font-semibold text-stone-50">{title}</div>
                <div className="arabic text-right text-gold-500/70 text-[0.85em] mt-0.5 leading-tight">{ar}</div>
                <div className="text-xs text-stone-300/70 mt-1">{desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Olive-branch footer accent */}
        <div className="flex justify-center mt-8 opacity-60 text-olive-500">
          <img src="/art/olive-branch.svg" alt="" className="w-56" />
        </div>

        {/* Attribution */}
        <div className="mt-6 mb-4 text-center">
          <div className="arabic text-sm text-stone-200/80 leading-relaxed">
            نِظَام تَعلِيم اللُغَة العَرَبِيَّة
          </div>
          <div className="arabic text-base text-gold-500 mt-1">
            مِن تَأليف الأُستَاذ باسِل زبون
          </div>
          <div className="text-[11px] text-stone-200/60 mt-2 max-w-sm mx-auto">
            Content, curriculum &amp; teaching method
            <br />
            © Basil Zboun. All rights reserved.
          </div>
          <div className="text-[10px] text-stone-200/40 mt-2">
            App built by Amichai with Claude.
          </div>
        </div>
      </div>
    </div>
  );
}
