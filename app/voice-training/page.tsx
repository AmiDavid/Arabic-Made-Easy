'use client';
import { useRef, useState } from 'react';
import { Mic, StopCircle, Play, Trash2, Upload, Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Record 5-10 Palestinian/Bethlehem Arabic clips, upload them to ElevenLabs
 * to clone a voice, get back a voice_id to drop into ELEVENLABS_VOICE_ID.
 */

// Palestinian sample sentences to read aloud — varied in prosody
const PROMPTS = [
  { ar: 'مَرحَبَا كِيف حَالَك اليَوم؟ أَنَا مَبسُوط لَأَشُوفَك.', en: 'Hello, how are you today? I\'m happy to see you.' },
  { ar: 'بَيتنَا في بِيت لَحم، قَرِيب مِن كَنِيسَة المَهد.', en: 'Our house is in Bethlehem, near the Church of the Nativity.' },
  { ar: 'الطَقس اليَوم حِلو كَتِير، نِقدِر نِطلَع عَلَى الحَدِيقَة.', en: 'The weather today is really nice, we can go out to the garden.' },
  { ar: 'بِحِب القَهوَة مَع الهِيل في الصُبح.', en: 'I love coffee with cardamom in the morning.' },
  { ar: 'شُو رَأيَك نِرُوح نَاكُل مَنَاقِيش في السُوق؟', en: 'What do you think, let\'s go eat man\'ousheh at the market?' },
  { ar: 'جَدِّي بِيحكِي قِصَص عَن القُدس القَدِيمَة.', en: 'My grandfather tells stories about old Jerusalem.' },
  { ar: 'الاِنتِخَابَات القَادمَة مُهِمَّة لِكُل مُوَاطِن.', en: 'The upcoming elections are important for every citizen.' },
  { ar: 'كُنَّا نِلعَب في الحَارَة لَمَّا كُنَّا صِغَار.', en: 'We used to play in the neighborhood when we were little.' },
];

type ClipState = 'empty' | 'recording' | 'ready';

type Clip = { blob: Blob | null; url: string | null; state: ClipState };

export default function VoiceTrainingPage() {
  const [clips, setClips] = useState<Clip[]>(PROMPTS.map(() => ({ blob: null, url: null, state: 'empty' })));
  const [recordingIdx, setRecordingIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ voice_id: string; instructions: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState('Palestinian Bethlehem voice');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording(i: number) {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setClips((cs) => cs.map((c, j) => j === i ? { blob, url, state: 'ready' } : c));
        setRecordingIdx(null);
      };
      rec.start();
      recorderRef.current = rec;
      setClips((cs) => cs.map((c, j) => j === i ? { ...c, state: 'recording' } : c));
      setRecordingIdx(i);
    } catch (err: any) {
      setError('Mic access denied: ' + err.message);
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  function deleteClip(i: number) {
    setClips((cs) => cs.map((c, j) => j === i ? { blob: null, url: null, state: 'empty' } : c));
  }

  function play(url: string) {
    new Audio(url).play();
  }

  async function cloneVoice() {
    const ready = clips.filter((c) => c.state === 'ready');
    if (ready.length < 3) {
      setError('Need at least 3 clips. More is better (5–10 ideal).');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('name', voiceName);
      form.append('description', 'Palestinian Arabic (Bethlehem / West Bank area) — cloned from user recordings');
      clips.forEach((c, i) => {
        if (c.blob) form.append('samples', c.blob, `sample-${i + 1}.webm`);
      });
      const resp = await fetch('/api/voice-clone', { method: 'POST', body: form });
      const json = await resp.json();
      if (json.error) setError(json.error);
      else setResult(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  const readyCount = clips.filter((c) => c.state === 'ready').length;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
      <h1 className="text-2xl font-bold mb-1">Train your Palestinian voice</h1>
      <p className="text-sm text-stone-200/70 mb-4">
        Record yourself (or a Bethlehem-area speaker) reading these sentences aloud. The voice chat will then
        reply in that voice. Need Starter plan on ElevenLabs ($5/mo) for cloning.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-200 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 break-words">{error}</div>
          <button onClick={() => setError(null)} className="text-rose-300 hover:text-rose-100 text-xs">✕</button>
        </div>
      )}

      {result ? (
        <div className="p-5 rounded-2xl bg-olive-900/40 border border-olive-700/50">
          <div className="flex items-center gap-2 text-olive-300 font-semibold mb-2">
            <Check className="w-5 h-5" /> Voice cloned successfully
          </div>
          <div className="text-sm text-stone-200 mb-3">
            Voice ID: <code className="text-gold-500">{result.voice_id}</code>
          </div>
          <div className="text-sm text-stone-200/80 mb-2">To activate it:</div>
          <ol className="text-sm text-stone-200/80 list-decimal pl-5 space-y-1">
            <li>Go to Vercel → arabic-made-easy project → Settings → Environment Variables</li>
            <li>Edit <code className="text-gold-500">ELEVENLABS_VOICE_ID</code></li>
            <li>Paste the ID above as the value → Save</li>
            <li>Redeploy (Deployments → latest → Redeploy)</li>
          </ol>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="text-xs text-stone-200/60">Voice name</label>
            <input
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              className="w-full bg-white/5 border hairline rounded-xl px-3 py-2 text-sm mt-1"
            />
          </div>

          <ul className="space-y-3 mb-6">
            {PROMPTS.map((p, i) => {
              const c = clips[i];
              const isRecording = recordingIdx === i;
              return (
                <li key={i} className="p-3 rounded-xl bg-white/[0.03] border hairline">
                  <div className="arabic text-right mb-1">{p.ar}</div>
                  <div className="text-xs text-stone-200/60 mb-3">{p.en}</div>
                  <div className="flex items-center gap-2">
                    {c.state === 'ready' ? (
                      <>
                        <button onClick={() => play(c.url!)} className="flex items-center gap-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg px-3 py-1.5">
                          <Play className="w-3.5 h-3.5" /> Play
                        </button>
                        <button onClick={() => deleteClip(i)} className="flex items-center gap-1 text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg px-3 py-1.5">
                          <Trash2 className="w-3.5 h-3.5" /> Rerecord
                        </button>
                        <Check className="w-4 h-4 text-olive-300 ml-auto" />
                      </>
                    ) : isRecording ? (
                      <button onClick={stopRecording} className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 rounded-lg px-4 py-1.5 text-sm text-white">
                        <StopCircle className="w-4 h-4" /> Stop recording
                      </button>
                    ) : (
                      <button
                        onClick={() => startRecording(i)}
                        disabled={recordingIdx !== null}
                        className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-night-900 rounded-lg px-4 py-1.5 text-sm disabled:opacity-50"
                      >
                        <Mic className="w-4 h-4" /> Record
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="sticky bottom-28 bg-night-900/90 backdrop-blur border hairline rounded-2xl p-4 shadow-xl">
            <div className="text-sm text-stone-200 mb-2">
              <strong>{readyCount}</strong> of {PROMPTS.length} clips recorded
              {readyCount < 3 && <span className="text-stone-200/60"> — need 3+ to clone</span>}
            </div>
            <button
              onClick={cloneVoice}
              disabled={uploading || readyCount < 3}
              className="w-full bg-olive-500 hover:bg-olive-600 text-night-900 rounded-xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Cloning…</> : <><Upload className="w-4 h-4" /> Clone voice</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
