/**
 * Puente con el modelo ML `modelo_simulacion_espacial.js`.
 *  - Carga el modelo como ES module o, si no exporta nada, como script clásico.
 *  - Normaliza la salida (objeto / array / escala 0-1) a porcentajes 0-100.
 *  - Si el modelo no puede cargarse, usa un respaldo mínimo para no romper la partida.
 */
import { clamp } from './util.js';

const MODEL_URL = new URL('../modelo_simulacion_espacial.js', import.meta.url).href;
const NAME = 'predecirEventoEspacial';

let predictor = null;
let source = 'pending';
let loading = null;

function pickFunction(mod) {
  if (!mod) return null;
  if (typeof mod[NAME] === 'function') return mod[NAME];
  if (typeof mod.default === 'function') return mod.default;
  if (mod.default && typeof mod.default[NAME] === 'function') return mod.default[NAME];
  return null;
}

function injectClassicScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `${src}${src.includes('?') ? '&' : '?'}classic=1`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(s);
  });
}

/** Respaldo de emergencia (solo si el archivo del modelo falta o falla). */
function fallbackPredict(intensidad, mSv, blindaje, actividad, contramedidas, energia) {
  const t = { 1: 1, 2: 0.55, 3: 0.2 }[blindaje] ?? 1;
  const exp = [0.6, 1, 1.25][actividad] ?? 1;
  let dano = 100 * (1 - Math.exp((-mSv * t * exp) / 35)) * (contramedidas ? 0.65 : 1);
  const eficiencia = 100 - 0.85 * dano - (100 - energia) * 0.18 + (contramedidas ? 6 : 0) - (actividad === 2 ? 6 : 0);
  const cultivos = energia * 0.75 + 25 - intensidad * 3 * (0.5 + 0.5 * t);
  return { danoCelular: dano, eficienciaTripulacion: eficiencia, saludCultivos: cultivos };
}

export function loadModel() {
  if (loading) return loading;
  loading = (async () => {
    try {
      const mod = await import(MODEL_URL);
      const fn = pickFunction(mod) ?? (typeof globalThis[NAME] === 'function' ? globalThis[NAME] : null);
      if (fn) { predictor = fn; source = 'module'; return { source }; }
    } catch (err) {
      console.info('[ASTRO] El modelo no es un ES module; se cargará como script clásico.', err?.message);
    }
    try {
      await injectClassicScript(MODEL_URL);
      if (typeof globalThis[NAME] === 'function') { predictor = globalThis[NAME]; source = 'classic'; return { source }; }
      throw new Error(`${NAME} no está definido`);
    } catch (err) {
      console.warn('[ASTRO] Usando modelo de respaldo:', err?.message);
      predictor = fallbackPredict; source = 'fallback';
      return { source };
    }
  })();
  return loading;
}

const KEYS = {
  danoCelular: ['danoCelular', 'dañoCelular', 'dano_celular', 'daño_celular', 'cellDamage'],
  eficienciaTripulacion: ['eficienciaTripulacion', 'eficiencia_tripulacion', 'eficiencia', 'crewEfficiency'],
  saludCultivos: ['saludCultivos', 'salud_cultivos', 'cultivos', 'cropHealth'],
};

export function normalizeOutput(raw) {
  let r = raw;
  if (Array.isArray(r) || ArrayBuffer.isView(r)) {
    r = { danoCelular: r[0], eficienciaTripulacion: r[1], saludCultivos: r[2] };
  }
  if (!r || typeof r !== 'object') throw new TypeError('Salida del modelo no válida');
  const pick = (keys) => {
    for (const k of keys) if (r[k] !== undefined && r[k] !== null) return Number(r[k]);
    return NaN;
  };
  let d = pick(KEYS.danoCelular);
  let e = pick(KEYS.eficienciaTripulacion);
  let s = pick(KEYS.saludCultivos);
  if ([d, e, s].some((v) => !Number.isFinite(v))) throw new TypeError('Salida del modelo incompleta');
  // Escala fraccional (0-1) detectada conjuntamente para no confundir 0.8 % con 80 %.
  if (e <= 1 && s <= 1 && d <= 1) { d *= 100; e *= 100; s *= 100; }
  return {
    danoCelular: clamp(d, 0, 100),
    eficienciaTripulacion: clamp(e, 0, 100),
    saludCultivos: clamp(s, 0, 100),
  };
}

/**
 * Invoca al modelo con la firma oficial:
 * predecirEventoEspacial(intensidad, mSv, blindaje, actividad, contramedidas, energiaInvernadero)
 */
export async function predict({ intensidad, mSv, blindaje, actividad, contramedidas, energiaInvernadero }) {
  await loadModel();
  const raw = await Promise.resolve(
    predictor(intensidad, mSv, blindaje, actividad, contramedidas, energiaInvernadero),
  );
  return normalizeOutput(raw);
}

export const modelSource = () => source;
