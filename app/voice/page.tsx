'use client';
import { useEffect, useRef, useState } from 'react';
import { Mic, Loader2, Volume2, StopCircle, AlertCircle, Plus, Check, RotateCcw, PencilLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Topic } from '@/types';

type Correction = { wrong: string; right: string; explanation: string };
type NewWord = { arabic: string; english: string };
type Msg = {
  role: 'user' | 'assistant';
  ar: string;
  en?: string;
  corrections?: Correction[];
  new_words?: NewWord[];
};
type Mode = 'idle' | 'listening' | 'speaking' | 'thinking' | 'playing';

const GREETING: Msg = { role: 'assistant', ar: 'مَرحَبَا! كِيف حَالَك اليَوم؟', en: 'Hello! How are you today?' };

export default function VoicePage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [mode, setMode] = useState<Mode>('idle');
  const [conversationActive, setConversationActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string>('');
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [stage, setStage] = useState<string>('');
  const topicRef = useRef<{ id?: string; name?: string }>({});

  // Refs that persist across renders
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const messagesRef = useRef<Msg[]>([]);
  const conversationIdRef = useRef<string | null>(null);  // persistent conversation ID
  const vadStateRef = useRef<{
    isSpeaking: boolean;
    silenceStart: number;
    speechStart: number;
    rafId: number | null;
  }>({ isSpeaking: false, silenceStart: 0, speechStart: 0, rafId: null });
  const conversationActiveRef = useRef(false);

  useEffect(() => {
    audioElRef.current = new Audio();
    audioElRef.current.onended = () => {
      // After AI finishes speaking, resume listening if still in conversation mode
      if (conversationActiveRef.current) {
        startListening();
      } else {
        setMode('idle');
      }
    };
    setMessages([GREETING]);
    messagesRef.current = [GREETING];

    supabase
      .from('topics')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setTopics((data as Topic[]) || []));

    return () => {
      cleanupMic();
    };
  }, []);

  useEffect(() => {
    const t = topics.find((x) => x.id === topicId);
    topicRef.current = t ? { id: t.id, name: t.name_en } : {};
  }, [topicId, topics]);

  function newConversation() {
    stopConversation();
    conversationIdRef.current = null;
    setMessages([GREETING]);
    messagesRef.current = [GREETING];
    setAdded({});
    setError(null);
  }

  async function addToVocab(key: string, items: { arabic: string; english: string; notes?: string }[]) {
    try {
      const resp = await fetch('/api/vocab/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, source: 'conversation' }),
      });
      if (resp.ok) setAdded((m) => ({ ...m, [key]: true }));
    } catch {
      /* ignore */
    }
  }

  function cleanupMic() {
    conversationActiveRef.current = false;
    if (vadStateRef.current.rafId) cancelAnimationFrame(vadStateRef.current.rafId);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
  }

  async function startConversation() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      // Set up audio analysis for VAD
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      conversationActiveRef.current = true;
      setConversationActive(true);
      startListening();
    } catch (err: any) {
      setError(`Microphone access denied or unavailable: ${err.message}`);
      setMode('idle');
    }
  }

  function stopConversation() {
    conversationActiveRef.current = false;
    setConversationActive(false);
    setMode('idle');
    cleanupMic();
  }

  function startListening() {
    if (!streamRef.current || !analyserRef.current) return;
    setMode('listening');

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: pickMimeType(),
    });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      if (blob.size > 500 && vadStateRef.current.speechStart > 0) {
        processUserAudio(blob);
      } else {
        // Too short or no speech detected — resume listening
        if (conversationActiveRef.current) startListening();
      }
    };
    recorder.start(100); // collect data every 100ms
    recorderRef.current = recorder;

    // Reset VAD state
    vadStateRef.current = {
      isSpeaking: false,
      silenceStart: 0,
      speechStart: 0,
      rafId: null,
    };

    detectVoice();
  }

  function detectVoice() {
    if (!analyserRef.current || !conversationActiveRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Calculate average volume in speech frequency range
    const sliceStart = Math.floor(dataArray.length * 0.05);
    const sliceEnd = Math.floor(dataArray.length * 0.5);
    let sum = 0;
    for (let i = sliceStart; i < sliceEnd; i++) sum += dataArray[i];
    const avg = sum / (sliceEnd - sliceStart);
    setAudioLevel(avg);

    const THRESHOLD = 15; // adjust if too sensitive / not sensitive enough
    const SILENCE_MS = 1200; // how long of silence before auto-sending
    const now = Date.now();

    if (avg > THRESHOLD) {
      // Speaking
      if (!vadStateRef.current.isSpeaking) {
        vadStateRef.current.isSpeaking = true;
        vadStateRef.current.speechStart = now;
      }
      vadStateRef.current.silenceStart = 0;
    } else {
      // Silent
      if (vadStateRef.current.isSpeaking) {
        if (vadStateRef.current.silenceStart === 0) {
          vadStateRef.current.silenceStart = now;
        } else if (now - vadStateRef.current.silenceStart > SILENCE_MS) {
          // User stopped speaking — send
          vadStateRef.current.isSpeaking = false;
          if (recorderRef.current?.state === 'recording') {
            recorderRef.current.stop();
          }
          return; // stop the loop; next listen cycle starts after processing
        }
      }
    }

    vadStateRef.current.rafId = requestAnimationFrame(detectVoice);
  }

  async function saveConversation(msgs: Msg[]) {
    try {
      const resp = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: conversationIdRef.current,
          messages: msgs.map((m) => ({
            role: m.role,
            ar: m.ar,
            en: m.en,
            corrections: m.corrections || [],
            new_words: m.new_words || [],
            topic: topicRef.current.name || null,
            ts: new Date().toISOString(),
          })),
        }),
      });
      if (resp.ok) {
        const { id } = await resp.json();
        if (id && !conversationIdRef.current) conversationIdRef.current = id;
      }
    } catch {
      // silent — don't disturb the chat flow if save fails
    }
  }

  async function processUserAudio(blob: Blob) {
    try {
      setMode('thinking');
      setStage('Hearing you…');
      const form = new FormData();
      form.append('audio', blob, `user.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`);
      const sttResp = await fetchWithTimeout('/api/stt', { method: 'POST', body: form }, 35_000, 'Speech recognition');
      if (!sttResp.ok) {
        const errJson = await sttResp.json().catch(() => ({}));
        throw new Error(`STT: ${errJson.error || sttResp.statusText}`);
      }
      const { text, note } = await sttResp.json();
      if (!text?.trim()) {
        // No speech detected or audio too short — just resume listening quietly
        if (conversationActiveRef.current) startListening();
        else setMode('idle');
        return;
      }

      const userMsg: Msg = { role: 'user', ar: text };
      const nextMsgs = [...messagesRef.current, userMsg];
      messagesRef.current = nextMsgs;
      setMessages(nextMsgs);

      setStage('Thinking…');
      const chatResp = await fetchWithTimeout(
        '/api/chat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMsgs.map((m) => ({ role: m.role, content: m.ar })),
            conversationId: conversationIdRef.current,
            topicId: topicRef.current.id,
            topicName: topicRef.current.name,
          }),
        },
        45_000,
        'The teacher'
      );
      if (!chatResp.ok) {
        const errJson = await chatResp.json().catch(() => ({}));
        throw new Error(`Chat: ${errJson.error || chatResp.statusText}`);
      }
      const chatJson = await chatResp.json();
      if (chatJson.error) throw new Error(`Chat: ${chatJson.error}`);

      // Corrections belong to the learner's message; new words to the teacher's reply
      const correctedUser: Msg = { ...userMsg, corrections: chatJson.corrections || [] };
      const aiMsg: Msg = {
        role: 'assistant',
        ar: chatJson.arabic,
        en: chatJson.english,
        new_words: chatJson.new_words || [],
      };
      const withAi = [...nextMsgs.slice(0, -1), correctedUser, aiMsg];
      messagesRef.current = withAi;
      setMessages(withAi);

      // Save to Supabase (fire-and-forget)
      saveConversation(withAi);

      await speak(chatJson.arabic);
    } catch (err: any) {
      // Error during turn — show it, but DON'T kill the continuous conversation
      setError(err.message || String(err));
      if (conversationActiveRef.current) {
        setTimeout(() => startListening(), 1500);  // give user a sec to read error, then resume
      } else {
        setMode('idle');
      }
    }
  }

  async function speak(text: string) {
    try {
      setMode('playing');
      const resp = await fetchWithTimeout(
        '/api/tts',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        },
        30_000,
        'The voice'
      );
      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(`TTS: ${errJson.error || resp.statusText}`);
      }
      const buf = await resp.arrayBuffer();
      const url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
      if (audioElRef.current) {
        audioElRef.current.src = url;
        await audioElRef.current.play();
      }
    } catch (err: any) {
      setError(err.message || String(err));
      // On TTS error, still resume listening — user can read the Arabic/English text on screen
      if (conversationActiveRef.current) {
        setTimeout(() => startListening(), 500);
      } else {
        setMode('idle');
      }
    }
  }

  const statusLabel = {
    idle: conversationActive ? 'Starting…' : 'Tap to start conversation',
    listening: '🎤 Listening — just talk',
    thinking: stage || 'Thinking…',
    playing: '🔊 Teacher speaking…',
    speaking: '',
  }[mode];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-40">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Voice chat</h1>
        {conversationActive && (
          <div className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/40 rounded-full px-3 py-1 text-xs text-rose-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            LIVE
          </div>
        )}
      </div>
      <p className="text-sm text-stone-200/70 mb-4">
        {conversationActive
          ? "Continuous mode. Just speak — I'll reply when you pause. Stays live until you tap stop."
          : "Tap the mic to start. Continuous mode — no need to hold or tap again between messages."}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
        <a href="/history" className="text-xs text-gold-500 hover:text-gold-400">
          Past conversations &amp; weekly recap
        </a>
        <a href="/voice-training" className="text-xs text-gold-500 hover:text-gold-400">
          Train a Bethlehem voice
        </a>
      </div>

      <div className="flex gap-2 mb-4">
        <select
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          className="flex-1 bg-white/5 border hairline rounded-xl px-3 py-2 text-sm"
          aria-label="Conversation topic"
        >
          <option value="">Free conversation</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              Talk about: {t.name_en}
            </option>
          ))}
        </select>
        <button
          onClick={newConversation}
          className="bg-white/5 hover:bg-white/10 border hairline rounded-xl px-3 py-2 text-sm flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-200 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 break-words">{error}</div>
          <button onClick={() => setError(null)} className="text-rose-300 hover:text-rose-100 text-xs">✕</button>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              'rounded-2xl p-3 pop',
              m.role === 'user' ? 'bg-gold-500/10 ml-8' : 'bg-night-800/70 border hairline mr-8'
            )}
          >
            <div className="text-[11px] text-stone-200/50 mb-1">{m.role === 'user' ? 'You' : 'Teacher'}</div>
            <div className="arabic text-right">{m.ar}</div>
            {m.en && <div className="text-sm text-stone-200/70 mt-2 border-t hairline pt-2">{m.en}</div>}

            {/* Corrections on the learner's message */}
            {m.corrections?.map((c, j) => {
              const key = `c-${i}-${j}`;
              return (
                <div key={key} className="mt-2 rounded-xl bg-night-900/60 border border-gold-500/30 p-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-gold-400 mb-1">
                    <PencilLine className="w-3 h-3" /> Correction
                  </div>
                  <div className="text-sm">
                    <span className="arabic line-through text-rose-300/80">{c.wrong}</span>
                    <span className="mx-2 text-stone-200/50">→</span>
                    <span className="arabic text-olive-200">{c.right}</span>
                  </div>
                  <div className="text-xs text-stone-200/70 mt-1">{c.explanation}</div>
                  <button
                    onClick={() =>
                      addToVocab(key, [{ arabic: c.right, english: c.explanation, notes: `You said: ${c.wrong}` }])
                    }
                    disabled={added[key]}
                    className="mt-1.5 text-xs text-gold-500 flex items-center gap-1 disabled:text-olive-300"
                  >
                    {added[key] ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {added[key] ? 'Added to practice' : 'Practise this'}
                  </button>
                </div>
              );
            })}

            {/* New words in the teacher's reply */}
            {m.new_words && m.new_words.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.new_words.map((w, j) => {
                  const key = `w-${i}-${j}`;
                  return (
                    <button
                      key={key}
                      onClick={() => addToVocab(key, [w])}
                      disabled={added[key]}
                      className={cn(
                        'text-xs rounded-full px-2.5 py-1 border flex items-center gap-1',
                        added[key]
                          ? 'border-olive-500/50 text-olive-200 bg-olive-500/10'
                          : 'hairline bg-white/5 hover:bg-white/10'
                      )}
                      title="Add to my vocabulary"
                    >
                      {added[key] ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      <span className="arabic text-[1.05em] leading-none">{w.arabic}</span>
                      <span className="text-stone-200/60">{w.english}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {m.role === 'assistant' && (
              <button
                onClick={() => speak(m.ar)}
                className="mt-2 text-xs text-gold-500 hover:text-gold-400 flex items-center gap-1"
              >
                <Volume2 className="w-3 h-3" /> Play again
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Floating controls */}
      <div className="fixed bottom-24 inset-x-0 flex flex-col items-center z-40 pointer-events-none">
        {statusLabel && (
          <div className="pointer-events-auto mb-3 px-4 py-1.5 rounded-full bg-black/70 backdrop-blur border hairline text-xs text-gray-200">
            {mode === 'thinking' && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
            {statusLabel}
          </div>
        )}

        <button
          onClick={conversationActive ? stopConversation : startConversation}
          className={cn(
            'pointer-events-auto w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition relative',
            conversationActive
              ? 'bg-rose-500 shadow-rose-500/50'
              : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/40'
          )}
        >
          {/* Audio level ring when listening */}
          {mode === 'listening' && (
            <div
              className="absolute inset-0 rounded-full border-2 border-white/60"
              style={{ transform: `scale(${1 + Math.min(audioLevel / 100, 0.4)})`, transition: 'transform 60ms' }}
            />
          )}
          {conversationActive ? (
            <StopCircle className="w-9 h-9 text-white" />
          ) : (
            <Mic className="w-9 h-9 text-white" />
          )}
        </button>
      </div>

      <div className="fixed bottom-20 inset-x-0 text-center text-[10px] text-gray-500 pointer-events-none">
        {conversationActive ? 'Tap to end' : 'Tap to begin'}
      </div>
    </div>
  );
}

// fetch that gives up after `ms` with a clear message instead of hanging forever
async function fetchWithTimeout(url: string, init: RequestInit, ms: number, what: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error(`${what} took too long to answer (${Math.round(ms / 1000)}s). Try again.`);
    throw new Error(`${what}: network problem (${err?.message || err})`);
  } finally {
    clearTimeout(timer);
  }
}

// Pick a MIME type the browser supports and that Whisper accepts
function pickMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  }
  return 'audio/webm';
}
