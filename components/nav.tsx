'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Layers, Grid3x3, Camera, Mic, BookMarked, Image as ImageIcon, Home, HelpCircle, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/catalog', label: 'Words', icon: BookOpen },
  { href: '/grammar', label: 'Grammar', icon: BookMarked },
  { href: '/flashcards', label: 'Cards', icon: Layers },
  { href: '/quiz', label: 'Quiz', icon: HelpCircle },
  { href: '/match', label: 'Match', icon: Grid3x3 },
  { href: '/write', label: 'Write', icon: PenLine },
  { href: '/scan', label: 'Scan', icon: Camera },
  { href: '/voice', label: 'Voice', icon: Mic },
  { href: '/pages-viewer', label: 'Pages', icon: ImageIcon },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t hairline bg-night-900/95 backdrop-blur">
      <div className="max-w-5xl mx-auto grid grid-cols-10 gap-0.5 px-2 py-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[9px] transition',
                active ? 'text-gold-500 bg-gold-500/10' : 'text-stone-200/60 hover:text-stone-100'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
