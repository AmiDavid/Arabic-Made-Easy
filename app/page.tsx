import Link from 'next/link';
import { BookOpen, Layers, Grid3x3, Camera, Mic, BookMarked, Image as ImageIcon } from 'lucide-react';

const TILES = [
  { href: '/catalog', title: 'Vocabulary', desc: 'Browse & search 2,000+ words', icon: BookOpen, color: 'from-purple-500 to-fuchsia-600' },
  { href: '/grammar', title: 'Grammar', desc: 'Rules, patterns & examples', icon: BookMarked, color: 'from-blue-500 to-cyan-600' },
  { href: '/flashcards', title: 'Flashcards', desc: 'Spaced repetition practice', icon: Layers, color: 'from-emerald-500 to-teal-600' },
  { href: '/match', title: 'Matching game', desc: 'Pair Arabic ↔ English', icon: Grid3x3, color: 'from-amber-500 to-orange-600' },
  { href: '/scan', title: 'Scan a page', desc: 'Add new notebook pages', icon: Camera, color: 'from-pink-500 to-rose-600' },
  { href: '/voice', title: 'Voice chat', desc: 'Practice speaking Palestinian', icon: Mic, color: 'from-indigo-500 to-violet-600' },
  { href: '/pages-viewer', title: 'Notebook pages', desc: 'Browse original scans', icon: ImageIcon, color: 'from-slate-500 to-gray-600' },
];

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 pb-4">
      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-brand-500 font-semibold mb-1">Arabic Made Easy</div>
        <h1 className="text-3xl font-bold">أَهلًا فِيك 👋</h1>
        <p className="text-gray-400 mt-1">Pick where to start today.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {TILES.map(({ href, title, desc, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="group relative overflow-hidden rounded-2xl border hairline bg-white/[0.02] p-4 hover:bg-white/[0.05] transition"
          >
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-20 blur-xl group-hover:opacity-40 transition`} />
            <Icon className="w-6 h-6 mb-3 text-brand-500" />
            <div className="font-semibold">{title}</div>
            <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
