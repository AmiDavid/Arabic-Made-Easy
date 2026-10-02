'use client';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { readGuestFromUrl, guestName } from '@/lib/guest';

/** Welcome note for a guest (?guest=Name), explaining which parts use AI credits. */
export function GuestBanner() {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    readGuestFromUrl();
    setName(guestName());
  }, []);
  if (!name) return null;
  return (
    <div className="mb-4 rounded-2xl border border-gold-500/40 bg-gold-500/10 p-4 text-sm">
      <div className="font-semibold text-gold-200">
        أَهلًا وسَهلًا {name}! 👋
      </div>
      <p className="text-stone-200/85 mt-1">
        This is Amichai&apos;s notebook from your lessons, turned into an app. Look around and play.
      </p>
      <p className="text-stone-200/70 mt-2 flex gap-1.5">
        <Sparkles className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
        <span>
          Parts marked <b className="text-gold-300">AI</b> (Voice chat, Scan, Translate sentences, AI check, pronunciation)
          run on a small, limited budget for now, so they may stop working at some point. Everything else is free and
          unlimited. Your voice chats stay out of Amichai&apos;s history.
        </span>
      </p>
    </div>
  );
}
