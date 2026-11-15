/**
 * Sistema de Audio en 3 Capas Independientes + Lectura en Voz Alta (TTS)
 * (Cumple Paso 6 de k12-edugame-web-architect):
 *  1. BGM (Música ambiental espacial generativa via WebAudio API)
 *  2. SFX (Efectos de sonido + affordance sonoro < 100 ms en hover/touch)
 *  3. TTS (Locución por voz con window.speechSynthesis para prelectores/baja visión)
 */
import { storage } from './util.js';
import { STORAGE_KEYS } from './config.js';

let ctx = null;
let sfxGain = null;
let bgmGain = null;
let bgmRunning = false;
let bgmOscs = [];

let bgmMuted = storage.get(STORAGE_KEYS.bgmMuted, false);
let sfxMuted = storage.get(STORAGE_KEYS.sfxMuted, false);
let ttsEnabled = storage.get(STORAGE_KEYS.ttsEnabled, false);

let lastHoverAt = 0;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.22;
  sfxGain.connect(ctx.destination);

  bgmGain = ctx.createGain();
  bgmGain.gain.value = bgmMuted ? 0.0001 : 0.06;
  bgmGain.connect(ctx.destination);
  return ctx;
}

function startAmbientBGM() {
  const c = ensure();
  if (!c || bgmRunning) return;
  bgmRunning = true;
  // Acorde espacial cálido (Do mayor novena espacial: C3, G3, D4, E4)
  const freqs = [130.81, 196.0, 293.66, 329.63];
  bgmOscs = freqs.map((f, i) => {
    const osc = c.createOscillator();
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    const voiceGain = c.createGain();
    const filter = c.createBiquadFilter();

    osc.type = i % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.value = f;

    lfo.type = 'sine';
    lfo.frequency.value = 0.08 + i * 0.03;
    lfoGain.gain.value = 1.4;
    lfo.connect(lfoGain).connect(osc.frequency);

    filter.type = 'lowpass';
    filter.frequency.value = 520;
    voiceGain.gain.value = 0.25;

    osc.connect(filter).connect(voiceGain).connect(bgmGain);
    osc.start();
    lfo.start();
    return { osc, lfo };
  });
}

function syncBGMGain() {
  if (!ctx || !bgmGain) return;
  const target = bgmMuted ? 0.0001 : 0.06;
  bgmGain.gain.setTargetAtTime(target, ctx.currentTime, 0.18);
}

function tone({ f0, f1 = f0, dur = 0.12, type = 'sine', vol = 1, delay = 0 }) {
  const c = ensure();
  if (!c || sfxMuted) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(sfxGain);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise({ dur = 0.8, vol = 0.5, freq = 900 }) {
  const c = ensure();
  if (!c || sfxMuted) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(filter).connect(g).connect(sfxGain);
  src.start();
}

const SOUNDS = {
  hover: () => {
    const now = performance.now();
    if (now - lastHoverAt < 65) return;
    lastHoverAt = now;
    tone({ f0: 780, f1: 920, dur: 0.035, type: 'sine', vol: 0.18 });
  },
  tap: () => tone({ f0: 620, f1: 900, dur: 0.07, vol: 0.6 }),
  bolt: () => {
    tone({ f0: 520, f1: 1100, dur: 0.1, type: 'triangle', vol: 0.7 });
    tone({ f0: 1300, dur: 0.06, delay: 0.06, vol: 0.3 });
  },
  repair: () => {
    tone({ f0: 440, dur: 0.06, type: 'square', vol: 0.25 });
    tone({ f0: 660, dur: 0.08, type: 'square', vol: 0.25, delay: 0.08 });
  },
  deny: () => tone({ f0: 240, f1: 180, dur: 0.16, type: 'triangle', vol: 0.6 }),
  undo: () => tone({ f0: 800, f1: 500, dur: 0.09, vol: 0.5 }),
  go: () => [523, 659, 784].forEach((f, i) => tone({ f0: f, dur: 0.14, type: 'triangle', vol: 0.5, delay: i * 0.07 })),
  storm: () => noise({ dur: 1.2, vol: 0.55, freq: 700 }),
  alarm: () => {
    tone({ f0: 880, dur: 0.14, type: 'square', vol: 0.18 });
    tone({ f0: 660, dur: 0.14, type: 'square', vol: 0.18, delay: 0.18 });
  },
  break: () => {
    noise({ dur: 0.25, vol: 0.5, freq: 3000 });
    tone({ f0: 300, f1: 90, dur: 0.25, type: 'sawtooth', vol: 0.25 });
  },
  success: () => [523, 659, 784, 1047].forEach((f, i) => tone({ f0: f, dur: 0.35, type: 'sine', vol: 0.45, delay: i * 0.09 })),
  soft: () => [440, 392].forEach((f, i) => tone({ f0: f, dur: 0.3, vol: 0.4, delay: i * 0.16 })),
};

function cleanForSpeech(text) {
  return String(text || '')
    .replace(/[🟢🟠🔴⚡🛡️💧🌱🫧👩‍🚀🚀🏆🛸🔧✅🫐★⭐●▲◆]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const sfx = {
  unlock() {
    const c = ensure();
    if (c?.state === 'suspended') c.resume();
    if (!bgmMuted) startAmbientBGM();
  },
  play(name) {
    try {
      SOUNDS[name]?.();
    } catch {
      /* audio no disponible */
    }
  },

  // Capa 1: BGM
  isBGMMuted: () => bgmMuted,
  setBGMMuted(v) {
    bgmMuted = !!v;
    storage.set(STORAGE_KEYS.bgmMuted, bgmMuted);
    if (!bgmMuted) startAmbientBGM();
    syncBGMGain();
  },

  // Capa 2: SFX
  isSFXMuted: () => sfxMuted,
  setSFXMuted(v) {
    sfxMuted = !!v;
    storage.set(STORAGE_KEYS.sfxMuted, sfxMuted);
  },

  // Compatibilidad con llamadas existentes
  isMuted: () => sfxMuted,
  setMuted(v) {
    this.setSFXMuted(v);
  },

  // Capa 3: TTS (Lectura en voz alta)
  isTTSEnabled: () => ttsEnabled,
  setTTSEnabled(v) {
    ttsEnabled = !!v;
    storage.set(STORAGE_KEYS.ttsEnabled, ttsEnabled);
    if (!ttsEnabled) {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* sin soporte */
      }
    }
  },
  speak(text, { interrupt = true } = {}) {
    if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const clean = cleanForSpeech(text);
    if (!clean) return;
    try {
      if (interrupt) window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'es-ES';
      u.rate = 1.02;
      u.pitch = 1.05;
      window.speechSynthesis.speak(u);
    } catch {
      /* speechSynthesis bloqueado o no disponible */
    }
  },
};
