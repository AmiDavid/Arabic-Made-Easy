'use client';
import { useEffect, useRef, useState } from 'react';
import { Mic, Loader2, Volume2, StopCircle, Play, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; ar: string; en?: string };
type Mode = 'idle' | 'listening' | 'speaking' | 'thinking' | 'playing';

export default function VoicePage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [mode, setMode] = useState<Mode>('idle');
  const [conversationActive, setConversationActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs that persist across renders
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const messagesRef = useRef<Msg[]>([]);
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
    setMessages([{ role: 'assistant', ar: 'مَرحَبَا! كِيف حَالَك اليَوم؟', en: 'Hello! How are you today?' }]);
    messagesRef.current = [{ role: 'assistant', ar: 'مَرحَبَا! كِيف حَالَك اليَوم؟', en: 'Hello! How are you today?' }];

    return () => {
      cleanupMic();
    };
  }, []);

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

  async function processUserAudio(blob: Blob) {
    try {
      setMode('thinking');
      const form = new FormData();
      form.append('audio', blob, `user.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`);
      const sttResp = await fetch('/api/stt', { method: 'POST', body: form });
      if (!sttResp.ok) {
        const err = await sttResp.text();
        throw new Error(`STT failed: ${err}`);
      }
      const { text } = await sttResp.json();
      if (!text?.trim()) {
        if (conversationActiveRef.current) startListening();
        return;
      }

      const userMsg: Msg = { role: 'user', ar: text };
      const nextMsgs = [...messagesRef.current, userMsg];
      messagesRef.current = nextMsgs;
      setMessages(nextMsgs);

      const chatResp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMsgs.map((m) => ({ role: m.role, content: m.ar })) }),
      });
      if (!chatResp.ok) {
        const err = await chatResp.text();
        throw new Error(`Chat failed: ${err}`);
      }
      const chatJson = await chatResp.json();
      if (chatJson.error) throw new Error(`Chat: ${chatJson.error}`);

      const aiMsg: Msg = { role: 'assistant', ar: chatJson.arabic, en: chatJson.english };
      const withAi = [...nextMsgs, aiMsg];
      messagesRef.current = withAi;
      setMessages(withAi);

      await speak(chatJson.arabic);
    } catch (err: any) {
      setError(err.message || String(err));
      setMode('idle');
    }
  }

  async function speak(text: string) {
    try {
      setMode('playing');
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`TTS failed: ${err}`);
      }
      const buf = await resp.arrayBuffer();
      const url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
      if (audioElRef.current) {
        audioElRef.current.src = url;
        await audioElRef.current.play();
      }
    } catch (err: any) {
      setError(err.message || String(err));
      setMode('idle');
    }
  }

  const statusLabel = {
    idle: conversationActive ? 'Starting…' : 'Tap to start conversation',
    listening: '🎤 Listening — speak now',
    thinking: '💭 Thinking…',
    playing: '🔊 Speaking…',
    speaking: '',
  }[mode];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-40">
      <h1 className="text-2xl font-bold mb-1">Voice chat</h1>
      <p className="text-sm text-gray-400 mb-4">
        {conversationActive
          ? "I'm listening — just talk, I'll reply when you pause."
          : "Tap the mic to start a continuous conversation in Palestinian Arabic."}
      </p>

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
            className={cn('rounded-2xl p-3 pop', m.role === 'user' ? 'bg-brand-500/10 ml-8' : 'bg-white/[0.03] mr-8')}
          >
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
              {m.role === 'user' ? 'You' : 'Teacher'}
            </div>
            <div className="arabic text-right">{m.ar}</div>
            {m.en && <div className="text-sm text-gray-400 mt-2 border-t hairline pt-2">{m.en}</div>}
            {m.role === 'assistant' && (
              <button
                onClick={() => speak(m.ar)}
                className="mt-2 text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1"
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

// Pick a MIME type the browser supports and that Whisper accepts
function pickMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  }
  return 'audio/webm';
}
