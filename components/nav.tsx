'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Layers, Grid3x3, Camera, Mic, BookMarked, Image as ImageIcon, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/catalog', label: 'Words', icon: BookOpen },
  { href: '/grammar', label: 'Grammar', icon: BookMarked },
  { href: '/flashcards', label: 'Cards', icon: Layers },
  { href: '/match', label: 'Match', icon: Grid3x3 },
  { href: '/scan', label: 'Scan', icon: Camera },
  { href: '/voice', label: 'Voice', icon: Mic },
  { href: '/pages-viewer', label: 'Pages', icon: ImageIcon },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t hairline bg-[#0a0a12]/95 backdrop-blur">
      <div className="max-w-5xl mx-auto grid grid-cols-8 gap-1 px-2 py-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] transition',
                active ? 'text-brand-500 bg-brand-500/10' : 'text-gray-400 hover:text-gray-100'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
