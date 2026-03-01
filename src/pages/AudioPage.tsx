import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Types ──────────────────────────────────────────────────────────────────────
type SoundType = 'click' | 'tone' | 'drop' | 'bowl';
type Side = 'left' | 'right';

interface Preset {
  name: string;
  bpm: number;
  frequency: number;
  volume: number;
  duration: number; // minutes
}

const PRESETS: Record<string, Preset> = {
  relaxation: { name: 'Relaxation', bpm: 40, frequency: 440, volume: 0.6, duration: 10 },
  emdr:       { name: 'Standard EMDR', bpm: 60, frequency: 600, volume: 0.7, duration: 20 },
  fast:       { name: 'Rapide', bpm: 90, frequency: 800, volume: 0.65, duration: 5 },
  meditation: { name: 'Méditation', bpm: 24, frequency: 320, volume: 0.5, duration: 15 },
};

const SOUND_LABELS: Record<SoundType, string> = {
  click: 'Click doux',
  tone:  'Tonalité pure',
  drop:  'Goutte d\'eau',
  bowl:  'Bol tibétain',
};

// ── Web Audio synthesis helpers ────────────────────────────────────────────────
function playClick(ctx: AudioContext, side: Side, volume: number, freq: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const pan = ctx.createStereoPanner();

  pan.pan.value = side === 'left' ? -1 : 1;
  osc.connect(gain);
  gain.connect(pan);
  pan.connect(ctx.destination);

  osc.frequency.value = freq;
  osc.type = 'sine';

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.start(now);
  osc.stop(now + 0.08);
}

function playTone(ctx: AudioContext, side: Side, volume: number, freq: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const pan = ctx.createStereoPanner();

  pan.pan.value = side === 'left' ? -1 : 1;
  osc.connect(gain);
  gain.connect(pan);
  pan.connect(ctx.destination);

  osc.frequency.value = freq;
  osc.type = 'sine';

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.02);
  gain.gain.setValueAtTime(volume * 0.5, now + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.start(now);
  osc.stop(now + 0.22);
}

function playDrop(ctx: AudioContext, side: Side, volume: number, freq: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const pan = ctx.createStereoPanner();

  pan.pan.value = side === 'left' ? -1 : 1;
  osc.connect(gain);
  gain.connect(pan);
  pan.connect(ctx.destination);

  osc.type = 'sine';
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(freq * 1.5, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.18);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume * 0.6, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.start(now);
  osc.stop(now + 0.2);
}

function playBowl(ctx: AudioContext, side: Side, volume: number, freq: number) {
  // Tibetan bowl: fundamental + harmonics with slow decay
  const fundamentals = [freq, freq * 2.756, freq * 5.404];
  const amplitudes   = [0.6, 0.3, 0.15];

  for (let i = 0; i < fundamentals.length; i++) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const pan  = ctx.createStereoPanner();

    pan.pan.value = side === 'left' ? -1 : 1;
    osc.connect(gain);
    gain.connect(pan);
    pan.connect(ctx.destination);

    osc.frequency.value = fundamentals[i];
    osc.type = 'sine';

    const now = ctx.currentTime;
    const amp = volume * amplitudes[i];
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(amp, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.start(now);
    osc.stop(now + 0.8);
  }
}

function playSound(ctx: AudioContext, type: SoundType, side: Side, volume: number, freq: number) {
  switch (type) {
    case 'click': playClick(ctx, side, volume, freq); break;
    case 'tone':  playTone (ctx, side, volume, freq); break;
    case 'drop':  playDrop (ctx, side, volume, freq); break;
    case 'bowl':  playBowl (ctx, side, volume, freq); break;
  }
}

// ── Disclaimer modal ───────────────────────────────────────────────────────────
const Disclaimer = ({ onAccept }: { onAccept: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div className="bg-[#0f0f20] border border-violet-700/50 rounded-2xl max-w-md w-full p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">🎧</span>
        <h2 className="text-xl font-bold text-white">SBA Audio</h2>
      </div>
      <div className="space-y-3 text-sm text-slate-300 leading-relaxed mb-6">
        <p>
          Cet outil génère des sons alternés gauche/droite pour une stimulation bilatérale audio.
          <strong className="text-white"> Un casque stéréo est indispensable</strong> pour en bénéficier.
        </p>
        <div className="bg-amber-950/40 border border-amber-700/40 rounded-xl p-3 text-amber-200/80">
          <strong className="text-amber-300">Important :</strong> Cet outil est proposé à titre de
          soutien au bien-être uniquement. Il ne remplace pas un suivi thérapeutique EMDR avec un
          professionnel de santé agréé.
        </div>
        <p>Évitez d'utiliser cet outil si vous conduisez ou utilisez des machines.</p>
      </div>
      <button
        onClick={onAccept}
        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
      >
        J'ai compris, démarrer
      </button>
    </div>
  </div>
);

// ── Main AudioPage ─────────────────────────────────────────────────────────────
export const AudioPage = () => {
  const navigate = useNavigate();
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [activeSide, setActiveSide]   = useState<Side>('left');
  const [soundType, setSoundType]     = useState<SoundType>('tone');
  const [bpm, setBpm]                 = useState(60);
  const [frequency, setFrequency]     = useState(600);
  const [volume, setVolume]           = useState(0.7);
  const [duration, setDuration]       = useState(20); // minutes
  const [elapsed, setElapsed]         = useState(0);  // seconds

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const sideRef     = useRef<Side>('left');
  const paramsRef   = useRef({ soundType, volume, frequency });

  // Keep paramsRef in sync so the interval always uses latest values
  useEffect(() => {
    paramsRef.current = { soundType, volume, frequency };
  }, [soundType, volume, frequency]);

  const stopAll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current)    clearInterval(timerRef.current);
    intervalRef.current = null;
    timerRef.current    = null;
    setIsPlaying(false);
    setActiveSide('left');
    sideRef.current = 'left';
  }, []);

  const startSession = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    setElapsed(0);
    setIsPlaying(true);

    // Alternation interval
    const ms = (60 / bpm) * 1000;
    intervalRef.current = setInterval(() => {
      const { soundType: st, volume: vol, frequency: fr } = paramsRef.current;
      const side = sideRef.current;
      playSound(ctx, st, side, vol, fr);
      sideRef.current = side === 'left' ? 'right' : 'left';
      setActiveSide(sideRef.current);
    }, ms);

    // Timer
    const totalSec = duration * 60;
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= totalSec) {
          stopAll();
        }
        return next;
      });
    }, 1000);
  }, [bpm, duration, stopAll]);

  // Cleanup on unmount
  useEffect(() => () => stopAll(), [stopAll]);

  const applyPreset = (key: string) => {
    const p = PRESETS[key];
    setBpm(p.bpm);
    setFrequency(p.frequency);
    setVolume(p.volume);
    setDuration(p.duration);
  };

  const totalSec  = duration * 60;
  const progress  = totalSec > 0 ? (elapsed / totalSec) * 100 : 0;
  const remaining = totalSec - elapsed;
  const fmtTime   = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!disclaimerAccepted) return <Disclaimer onAccept={() => setDisclaimerAccepted(true)} />;

  return (
    <div className="min-h-screen bg-[#080818] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_#1e1040_0%,_#080818_70%)]" />

      <div className="relative z-10 max-w-xl mx-auto px-5 py-10">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-8 transition-colors"
        >
          ← Retour
        </button>

        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
          SBA Audio
        </h1>
        <p className="text-slate-500 text-sm mb-8">Stimulation bilatérale par sons alternés gauche/droite</p>

        {/* Visual indicator */}
        <div className="flex justify-center items-center gap-12 mb-8 h-20">
          {(['left', 'right'] as Side[]).map(side => (
            <div
              key={side}
              className={`relative flex flex-col items-center gap-2 transition-all duration-100 ${isPlaying && activeSide === side ? 'scale-110' : 'scale-100'}`}
            >
              <div className={`w-14 h-14 rounded-full border-2 transition-all duration-100 flex items-center justify-center text-xs font-bold ${
                isPlaying && activeSide === side
                  ? 'bg-violet-600 border-violet-400 shadow-lg shadow-violet-500/50 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}>
                {side === 'left' ? 'G' : 'D'}
              </div>
              <span className={`text-xs ${isPlaying && activeSide === side ? 'text-violet-300' : 'text-slate-600'}`}>
                {side === 'left' ? 'Gauche' : 'Droite'}
              </span>
            </div>
          ))}
        </div>

        {/* Timer & progress */}
        <div className="mb-8 bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-400 text-sm">Progression</span>
            <span className="text-slate-300 font-mono text-sm">
              {isPlaying ? fmtTime(remaining) : fmtTime(totalSec)} restant
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-violet-600 to-indigo-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-right mt-1.5 text-slate-600 text-xs">{Math.round(progress)}%</div>
        </div>

        {/* Presets */}
        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-2 block">Presets</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(PRESETS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                disabled={isPlaying}
                className="py-2 px-3 rounded-lg text-xs font-medium border border-slate-700 bg-slate-900/60 hover:border-violet-600 hover:text-violet-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 space-y-5 mb-8">
          {/* Sound type */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Type de son</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(SOUND_LABELS) as SoundType[]).map(st => (
                <button
                  key={st}
                  onClick={() => setSoundType(st)}
                  disabled={isPlaying}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    soundType === st
                      ? 'bg-violet-700/50 border-violet-500 text-violet-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-violet-600 hover:text-violet-300'
                  }`}
                >
                  {SOUND_LABELS[st]}
                </button>
              ))}
            </div>
          </div>

          {/* BPM */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm text-slate-400">Vitesse alternance</label>
              <span className="text-sm text-slate-300 font-mono">{bpm} bpm</span>
            </div>
            <input
              type="range" min={10} max={120} step={1} value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              disabled={isPlaying}
              className="w-full accent-violet-500 disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-0.5">
              <span>Lent (10)</span><span>Rapide (120)</span>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm text-slate-400">Fréquence</label>
              <span className="text-sm text-slate-300 font-mono">{frequency} Hz</span>
            </div>
            <input
              type="range" min={200} max={1200} step={10} value={frequency}
              onChange={e => setFrequency(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-0.5">
              <span>Grave (200)</span><span>Aigu (1200)</span>
            </div>
          </div>

          {/* Volume */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm text-slate-400">Volume</label>
              <span className="text-sm text-slate-300 font-mono">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range" min={0.05} max={1} step={0.05} value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
          </div>

          {/* Duration */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm text-slate-400">Durée session</label>
              <span className="text-sm text-slate-300 font-mono">{duration} min</span>
            </div>
            <input
              type="range" min={1} max={60} step={1} value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              disabled={isPlaying}
              className="w-full accent-violet-500 disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-0.5">
              <span>1 min</span><span>60 min</span>
            </div>
          </div>
        </div>

        {/* Start / Stop */}
        <button
          onClick={isPlaying ? stopAll : startSession}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            isPlaying
              ? 'bg-rose-700/70 hover:bg-rose-600 text-white border border-rose-600'
              : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40'
          }`}
        >
          {isPlaying ? '⏹ Arrêter la session' : '▶ Démarrer la session'}
        </button>

        {/* Reminder */}
        <p className="mt-4 text-center text-xs text-slate-600">
          Portez votre casque stéréo pour ressentir l'alternance gauche/droite
        </p>
      </div>
    </div>
  );
};
