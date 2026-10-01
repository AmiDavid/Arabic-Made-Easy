'use client';
import { useEffect, useRef, useState } from 'react';
import { Mic, Loader2, Volume2, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; ar: string; en?: string };

export default function VoicePage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState<'stt' | 'chat' | 'tts' | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    // Seed with a friendly opener
    setMessages([{ role: 'assistant', ar: 'مَرحَبَا! كِيف حَالَك اليَوم؟', en: 'Hello! How are you today?' }]);
  }, []);

  async function startRec() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      await handleUserAudio(blob);
    };
    rec.start();
    mediaRecRef.current = rec;
    setRecording(true);
  }

  function stopRec() {
    mediaRecRef.current?.stop();
    setRecording(false);
  }

  async function handleUserAudio(blob: Blob) {
    setBusy('stt');
    const form = new FormData();
    form.append('audio', blob, 'user.webm');
    const sttResp = await fetch('/api/stt', { method: 'POST', body: form });
    const sttJson = await sttResp.json();
    const userText = sttJson.text || '';
    if (!userText.trim()) { setBusy(null); return; }

    const userMsg: Msg = { role: 'user', ar: userText };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);

    setBusy('chat');
    const chatResp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: nextMsgs.map((m) => ({
          role: m.role,
          content: m.ar,
        })),
      }),
    });
    const chatJson = await chatResp.json();
    const aiMsg: Msg = { role: 'assistant', ar: chatJson.arabic, en: chatJson.english };
    setMessages([...nextMsgs, aiMsg]);

    // TTS
    setBusy('tts');
    await speak(chatJson.arabic);
    setBusy(null);
  }

  async function speak(text: string) {
    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) return;
      const buf = await resp.arrayBuffer();
      const url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
      }
    } catch (e) { console.error('speak failed', e); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
      <h1 className="text-2xl font-bold mb-1">Voice chat</h1>
      <p className="text-sm text-gray-400 mb-4">Practice Palestinian Arabic. Hold the mic, speak in either language.</p>

      <div className="space-y-3 mb-6">
        {messages.map((m, i) => (
          <div key={i} className={cn('rounded-2xl p-3 pop', m.role === 'user' ? 'bg-brand-500/10 ml-8' : 'bg-white/[0.03] mr-8')}>
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
              {m.role === 'user' ? 'You' : 'Claude'}
            </div>
            <div className="arabic text-right">{m.ar}</div>
            {m.en && <div className="text-sm text-gray-400 mt-2 border-t hairline pt-2">{m.en}</div>}
            {m.role === 'assistant' && (
              <button onClick={() => speak(m.ar)} className="mt-2 text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> Play again
              </button>
            )}
          </div>
        ))}
        {busy && (
          <div className="text-center text-gray-400 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> {busy === 'stt' ? 'Transcribing…' : busy === 'chat' ? 'Thinking…' : 'Speaking…'}
          </div>
        )}
      </div>

      <div className="fixed bottom-24 inset-x-0 flex justify-center z-40">
        <button
          onMouseDown={startRec}
          onMouseUp={stopRec}
          onTouchStart={(e) => { e.preventDefault(); startRec(); }}
          onTouchEnd={(e) => { e.preventDefault(); stopRec(); }}
          disabled={!!busy}
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition',
            recording ? 'bg-rose-500 scale-110 shadow-rose-500/50' : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/40',
            busy && 'opacity-50'
          )}
        >
          {recording ? <StopCircle className="w-9 h-9 text-white" /> : <Mic className="w-9 h-9 text-white" />}
        </button>
      </div>

      <div className="fixed bottom-20 inset-x-0 text-center text-[10px] text-gray-500">
        Hold to speak, release to send
      </div>
    </div>
  );
}
