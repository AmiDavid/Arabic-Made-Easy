'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Flame, Sun, ArrowRight } from 'lucide-react';
import { readDaily, todayKey } from '@/lib/practice';

/** Home-screen call to action for today's practice, with the streak. */
export function DailyCard() {
  const [state, setState] = useState<{ streak: number; done: boolean } | null>(null);
  useEffect(() => {
    const d = readDaily();
    setState({ streak: d.streak, done: d.last === todayKey() });
  }, []);

  return (
    <Link
      href="/daily"
      className="relative overflow-hidden flex items-center gap-3 rounded-2xl border border-gold-500/40 bg-gradient-to-br from-gold-500/20 to-terracotta-500/10 p-4 mb-3"
    >
      <Sun className="w-7 h-7 text-gold-500 shrink-0" />
      <div className="flex-1">
        <div className="font-semibold text-stone-50">
          {state?.done ? 'Done today — practise again?' : "Today's practice · 5 min"}
        </div>
        <div className="text-xs text-stone-200/70">Words · match · a concept · write · talk</div>
      </div>
      {state && state.streak > 0 && (
        <div className="flex items-center gap-0.5 text-gold-500 text-sm font-semibold">
          <Flame className="w-4 h-4" /> {state.streak}
        </div>
      )}
      <ArrowRight className="w-4 h-4 text-gold-500" />
    </Link>
  );
}
