'use client';
import { guestName } from '@/lib/guest';
import { useEffect, useRef, useState } from 'react';
import { Mic, Loader2, Volume2, StopCircle, AlertCircle, Plus, Check, RotateCcw, PencilLine, Info } from 'lucide-react';
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
type Mode = 'idle' | 'listening' | 'thinking' | 'playing';
type Engine = 'phone' | 'whisper';

const GREETING: Msg = { role: 'assistant', ar: 'مَرحَبَا! كِيف حَالَك اليَوم؟', en: 'Hello! How are you today?' };

export default function VoicePage() {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [mode, setMode] = useState<Mode>('idle');
  const [conversationActive, setConversationActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string>('');
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [stage, setStage] = useState<string>('');
  const [interim, setInterim] = useState('');
  const [engine, setEngine] = useState<Engine>('phone');
  const [phoneSupported, setPhoneSupported] = useState(true);

  // Refs (survive re-renders; used inside async callbacks)
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const messagesRef = useRef<Msg[]>([GREETING]);
  const conversationIdRef = useRef<string | null>(null);
  const conversationActiveRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const engineRef = useRef<Engine>('phone');
  const recogErrorsRef = useRef(0);
  const topicRef = useRef<{ id?: string; name?: string }>({});
  const vadStateRef = useRef({ isSpeaking: false, silenceStart: 0, speechStart: 0, rafId: 0 as number });

  // ---------- setup ----------
  useEffect(() => {
    audioElRef.current = new Audio();
    audioElRef.current.onended = afterSpeaking;

    const SR = getSpeechRecognition();
    const supported = !!SR;
    setPhoneSupported(supported);
    let saved: Engine | null = null;
    try {
      saved = localStorage.getItem('voice-engine') as Engine | null;
    } catch {}
    const initial: Engine = saved === 'whisper' || !supported ? 'whisper' : 'phone';
    setEngine(initial);
    engineRef.current = initial;

    // Load phone voices early (Chrome loads them async)
    try {
      window.speechSynthesis?.getVoices();
    } catch {}

    supabase
      .from('topics')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setTopics((data as Topic[]) || []));

    return () => stopEverything();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = topics.find((x) => x.id === topicId);
    topicRef.current = t ? { id: t.id, name: t.name_en } : {};
  }, [topicId, topics]);

  function chooseEngine(e: Engine) {
    if (conversationActiveRef.current) stopConversation();
    setEngine(e);
    engineRef.current = e;
    try {
      localStorage.setItem('voice-engine', e);
    } catch {}
  }

  // ---------- conversation lifecycle ----------
  async function startConversation() {
    setError(null);
    recogErrorsRef.current = 0;
    conversationActiveRef.current = true;
    setConversationActive(true);

    if (engineRef.current === 'whisper') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        streamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.3;
        ctx.createMediaStreamSource(stream).connect(analyser);
        audioContextRef.current = ctx;
        analyserRef.current = analyser;
      } catch (err: any) {
        setError(`Microphone access denied or unavailable: ${err.message}`);
        stopConversation();
        return;
      }
    }
    startListening();
  }

  function stopConversation() {
    conversationActiveRef.current = false;
    setConversationActive(false);
    setMode('idle');
    setInterim('');
    stopEverything();
  }

  function stopEverything() {
    try {
      recognitionRef.current?.abort();
    } catch {}
    recognitionRef.current = null;
    if (vadStateRef.current.rafId) cancelAnimationFrame(vadStateRef.current.rafId);
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    audioElRef.current?.pause();
  }

  function newConversation() {
    stopConversation();
    conversationIdRef.current = null;
    setMessages([GREETING]);
    messagesRef.current = [GREETING];
    setAdded({});
    setError(null);
  }

  function afterSpeaking() {
    if (conversationActiveRef.current) startListening();
    else setMode('idle');
  }

  function startListening() {
    if (!conversationActiveRef.current) return;
    setMode('listening');
    setInterim('');
    if (engineRef.current === 'phone') startPhoneRecognition();
    else startRecorder();
  }

  // ---------- engine 1: the phone's own speech recognition ----------
  function startPhoneRecognition() {
    const SR = getSpeechRecognition();
    if (!SR) {
      setNotice("This browser has no built-in speech recognition, switched to Whisper.");
      chooseEngine('whisper');
      return;
    }
    const rec = new SR();
    rec.lang = 'ar-PS';
    rec.interimResults = true;
    rec.continuous = false; // ends by itself when you stop talking
    rec.maxAlternatives = 1;

    let finalText = '';
    rec.onresult = (e: any) => {
      let live = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else live += r[0].transcript;
      }
      setInterim((finalText + ' ' + live).trim());
    };
    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('Microphone permission is blocked. In Chrome: tap the lock icon → Permissions → Microphone → Allow.');
        stopConversation();
      } else if (e.error === 'network') {
        recogErrorsRef.current++;
        if (recogErrorsRef.current >= 3) {
          setError('Speech recognition needs a working internet connection. Stopped after 3 tries.');
          stopConversation();
        }
      } else if (e.error === 'language-not-supported') {
        rec.lang = 'ar-JO';
      }
      // 'no-speech' and 'aborted' are normal: onend restarts listening
    };
    rec.onend = () => {
      recognitionRef.current = null;
      if (!conversationActiveRef.current) return;
      const text = finalText.trim();
      if (text) {
        recogErrorsRef.current = 0;
        handleUserText(text);
      } else {
        setTimeout(() => {
          if (conversationActiveRef.current && !recognitionRef.current) startListening();
        }, 250);
      }
    };
    try {
      rec.start();
      recognitionRef.current = rec;
    } catch {
      // start() throws if one is already running; retry shortly
      setTimeout(() => conversationActiveRef.current && startListening(), 400);
    }
  }

  // ---------- engine 2: record + Whisper (needs OpenAI credit) ----------
  function startRecorder() {
    if (!streamRef.current || !analyserRef.current) return;
    const recorder = new MediaRecorder(streamRef.current, { mimeType: pickMimeType() });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      if (blob.size > 500 && vadStateRef.current.speechStart > 0) processUserAudio(blob);
      else if (conversationActiveRef.current) startListening();
    };
    recorder.start(100);
    recorderRef.current = recorder;
    vadStateRef.current = { isSpeaking: false, silenceStart: 0, speechStart: 0, rafId: 0 };
    detectVoice();
  }

  function detectVoice() {
    const analyser = analyserRef.current;
    if (!analyser || !conversationActiveRef.current) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const a = Math.floor(data.length * 0.05);
    const b = Math.floor(data.length * 0.5);
    let sum = 0;
    for (let i = a; i < b; i++) sum += data[i];
    const avg = sum / (b - a);
    setAudioLevel(avg);

    const now = Date.now();
    const v = vadStateRef.current;
    if (avg > 15) {
      if (!v.isSpeaking) {
        v.isSpeaking = true;
        v.speechStart = now;
      }
      v.silenceStart = 0;
    } else if (v.isSpeaking) {
      if (!v.silenceStart) v.silenceStart = now;
      else if (now - v.silenceStart > 1200) {
        v.isSpeaking = false;
        if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
        return;
      }
    }
    v.rafId = requestAnimationFrame(detectVoice);
  }

  async function processUserAudio(blob: Blob) {
    try {
      setMode('thinking');
      setStage('Hearing you…');
      const form = new FormData();
      form.append('audio', blob, `user.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`);
      const resp = await fetchWithTimeout('/api/stt', { method: 'POST', body: form }, 35_000, 'Speech recognition');
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg = String(json.error || resp.statusText);
        if (/credit|quota|429/i.test(msg) && phoneSupported) {
          setNotice("Whisper needs credit on your OpenAI account, so I switched to your phone's speech recognition.");
          stopConversation();
          chooseEngine('phone');
          return;
        }
        throw new Error(`Speech recognition: ${msg}`);
      }
      if (!json.text?.trim()) {
        if (conversationActiveRef.current) startListening();
        else setMode('idle');
        return;
      }
      await handleUserText(json.text);
    } catch (err: any) {
      setError(err.message || String(err));
      if (conversationActiveRef.current) setTimeout(startListening, 1500);
      else setMode('idle');
    }
  }

  // ---------- one turn: learner text → teacher reply ----------
  async function handleUserText(text: string) {
    try {
      setMode('thinking');
      setStage('Thinking…');
      setInterim('');
      const userMsg: Msg = { role: 'user', ar: text };
      const nextMsgs = [...messagesRef.current, userMsg];
      messagesRef.current = nextMsgs;
      setMessages(nextMsgs);

      const resp = await fetchWithTimeout(
        '/api/chat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMsgs.map((m) => ({ role: m.role, content: m.ar })),
            conversationId: conversationIdRef.current,
            guest: !!guestName(),
            topicId: topicRef.current.id,
            topicName: topicRef.current.name,
          }),
        },
        45_000,
        'The teacher'
      );
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json.error) throw new Error(`Teacher: ${json.error || resp.statusText}`);

      const correctedUser: Msg = { ...userMsg, corrections: json.corrections || [] };
      const aiMsg: Msg = { role: 'assistant', ar: json.arabic, en: json.english, new_words: json.new_words || [] };
      const withAi = [...nextMsgs.slice(0, -1), correctedUser, aiMsg];
      messagesRef.current = withAi;
      setMessages(withAi);
      saveConversation(withAi);

      await speak(json.arabic);
    } catch (err: any) {
      setError(err.message || String(err));
      if (conversationActiveRef.current) setTimeout(startListening, 1500);
      else setMode('idle');
    }
  }

  // ---------- speaking ----------
  async function speak(text: string) {
    try {
      recognitionRef.current?.abort();
    } catch {}
    setMode('playing');
    try {
      const resp = await fetchWithTimeout(
        '/api/tts',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) },
        30_000,
        'The voice'
      );
      if (!resp.ok) {
        const json = await resp.json().catch(() => ({}));
        explainVoiceFallback((json.details || []).join(' | ') || json.error || '');
        speakWithPhone(text);
        return;
      }
      const buf = await resp.arrayBuffer();
      const url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
      const el = audioElRef.current!;
      el.src = url;
      await el.play();
    } catch {
      speakWithPhone(text);
    }
  }

  function speakWithPhone(text: string) {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!synth) {
      afterSpeaking();
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const arabic = voices.find((v) => /^ar[-_]?(PS|JO|LB|SY)/i.test(v.lang)) || voices.find((v) => /^ar/i.test(v.lang));
    if (arabic) u.voice = arabic;
    u.lang = arabic?.lang || 'ar';
    u.rate = 0.95;
    u.onend = afterSpeaking;
    u.onerror = afterSpeaking;
    synth.speak(u);
  }

  const warnedRef = useRef(false);
  function explainVoiceFallback(details: string) {
    if (warnedRef.current) return;
    warnedRef.current = true;
    let why = 'the cloud voice is not available right now';
    if (/permission/i.test(details)) why = "your ElevenLabs API key doesn't have the Text to Speech permission";
    else if (/credit|quota/i.test(details)) why = 'the voice service is out of credit';
    setNotice(`Using your phone's built-in Arabic voice, because ${why}.`);
  }

  // ---------- saving + vocab ----------
  async function saveConversation(msgs: Msg[]) {
    if (guestName()) return; // a guest's chats stay out of your history and recap
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
      /* saving must never interrupt the conversation */
    }
  }

  async function addToVocab(key: string, items: { arabic: string; english: string; notes?: string }[]) {
    try {
      const resp = await fetch('/api/vocab/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, source: 'conversation' }),
      });
      if (resp.ok) setAdded((m) => ({ ...m, [key]: true }));
    } catch {}
  }

  // ---------- UI ----------
  const statusLabel =
    mode === 'listening'
      ? engine === 'phone'
        ? 'Listening… speak in Arabic'
        : 'Listening… just talk'
      : mode === 'thinking'
        ? stage || 'Thinking…'
        : mode === 'playing'
          ? 'Teacher speaking…'
          : conversationActive
            ? 'Starting…'
            : 'Tap to start the conversation';

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-48">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Voice chat</h1>
        {conversationActive && (
          <div className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/40 rounded-full px-3 py-1 text-xs text-rose-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            Live
          </div>
        )}
      </div>
      <p className="text-sm text-stone-200/70 mb-3">
        Tap the mic once and talk. The teacher answers when you pause, then listens again. Tap again to stop.
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
        <a href="/history" className="text-xs text-gold-500 hover:text-gold-400">
          Past conversations &amp; weekly recap
        </a>
        <a href="/voice-training" className="text-xs text-gold-500 hover:text-gold-400">
          Train a Bethlehem voice
        </a>
      </div>

      <div className="flex gap-2 mb-2">
        <select
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          className="flex-1 min-w-0 bg-white/5 border hairline rounded-xl px-3 py-2 text-sm"
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

      <div className="flex items-center gap-2 mb-4 text-xs">
        <span className="text-stone-200/60">Hearing you with:</span>
        <div className="flex rounded-lg border hairline overflow-hidden">
          <button
            onClick={() => chooseEngine('phone')}
            disabled={!phoneSupported}
            className={cn(
              'px-2.5 py-1 disabled:opacity-40',
              engine === 'phone' ? 'bg-gold-500/20 text-gold-400' : 'text-stone-200/70'
            )}
          >
            Phone (free)
          </button>
          <button
            onClick={() => chooseEngine('whisper')}
            className={cn('px-2.5 py-1', engine === 'whisper' ? 'bg-gold-500/20 text-gold-400' : 'text-stone-200/70')}
          >
            Whisper
          </button>
        </div>
      </div>

      {notice && (
        <div className="mb-3 p-3 rounded-xl bg-gold-500/10 border border-gold-500/30 text-stone-100 text-sm flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-gold-400" />
          <div className="flex-1">{notice}</div>
          <button onClick={() => setNotice(null)} className="text-stone-200/60 hover:text-stone-100 text-xs" aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-200 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 break-words">{error}</div>
          <button onClick={() => setError(null)} className="text-rose-300 hover:text-rose-100 text-xs" aria-label="Dismiss">
            ✕
          </button>
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
                    onClick={() => addToVocab(key, [{ arabic: c.right, english: c.explanation, notes: `You said: ${c.wrong}` }])}
                    disabled={added[key]}
                    className="mt-1.5 text-xs text-gold-500 flex items-center gap-1 disabled:text-olive-300"
                  >
                    {added[key] ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {added[key] ? 'Added to practice' : 'Practise this'}
                  </button>
                </div>
              );
            })}

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
                        added[key] ? 'border-olive-500/50 text-olive-200 bg-olive-500/10' : 'hairline bg-white/5 hover:bg-white/10'
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

        {/* What the phone is hearing right now */}
        {mode === 'listening' && interim && (
          <div className="rounded-2xl p-3 bg-gold-500/5 border border-dashed border-gold-500/30 ml-8">
            <div className="text-[11px] text-stone-200/50 mb-1">You (hearing…)</div>
            <div className="arabic text-right text-stone-200/80">{interim}</div>
          </div>
        )}
      </div>

      {/* Floating controls */}
      <div className="fixed bottom-24 inset-x-0 flex flex-col items-center z-40 pointer-events-none">
        <div className="pointer-events-auto mb-3 px-4 py-1.5 rounded-full bg-night-900/90 backdrop-blur border hairline text-xs text-stone-100 flex items-center gap-1.5">
          {mode === 'thinking' && <Loader2 className="w-3 h-3 animate-spin" />}
          {statusLabel}
        </div>
        <button
          onClick={conversationActive ? stopConversation : startConversation}
          aria-label={conversationActive ? 'Stop conversation' : 'Start conversation'}
          className={cn(
            'pointer-events-auto w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition relative',
            conversationActive ? 'bg-rose-500 shadow-rose-500/50' : 'bg-gold-500 hover:bg-gold-600 shadow-gold-500/40'
          )}
        >
          {mode === 'listening' && engine === 'whisper' && (
            <div
              className="absolute inset-0 rounded-full border-2 border-white/60"
              style={{ transform: `scale(${1 + Math.min(audioLevel / 100, 0.4)})`, transition: 'transform 60ms' }}
            />
          )}
          {mode === 'listening' && engine === 'phone' && (
            <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping" />
          )}
          {conversationActive ? <StopCircle className="w-9 h-9 text-white" /> : <Mic className="w-9 h-9 text-night-900" />}
        </button>
      </div>
    </div>
  );
}

// ---------- helpers ----------
function getSpeechRecognition(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

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

function pickMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  }
  return 'audio/webm';
}
