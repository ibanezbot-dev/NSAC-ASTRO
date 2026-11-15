/** Utilidades compartidas, sin dependencias. */

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** PRNG determinista (mulberry32) para poder reproducir partidas en pruebas. */
export function createRng(seed = Date.now()) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let uidCounter = 0;
export const uid = (prefix = 'u') => `${prefix}${(++uidCounter).toString(36)}`;

export function haptic(pattern = 8) {
  try { navigator.vibrate?.(pattern); } catch { /* sin soporte */ }
}

export const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(`astro.${key}`);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(`astro.${key}`, JSON.stringify(value)); } catch { /* modo privado */ }
  },
};

/** Escapa texto de usuario antes de insertarlo como HTML. */
export const escapeHTML = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Color semántico (HIG) según un valor 0-100. */
export const toneFor = (v) => (v >= 75 ? 'good' : v >= 40 ? 'warn' : 'bad');

/** Ejecuta una animación WAAPI y devuelve su promesa (respeta reduced-motion). */
export function animate(el, keyframes, options) {
  if (!el?.animate || prefersReducedMotion()) return Promise.resolve();
  return el.animate(keyframes, options).finished.catch(() => {});
}
