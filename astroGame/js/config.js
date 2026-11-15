/**
 * ASTRO · Configuración central del juego y contenidos pedagógicos K-12.
 * Incluye los 5 niveles de andamiaje por habilidad (Zona de Desarrollo Próximo),
 * eventos reales NASA DONKI/OSDR, cápsulas Spinoff y Guía Docente NGSS.
 */

export const MISSION = Object.freeze({
  goal: 100,      // % de misión para ganar
  maxSols: 16,    // los suministros duran 16 soles
});

/**
 * Andamiaje por Habilidad (Niveles 1 a 5) — Sin etiquetas rígidas de edad.
 * Protege la autoestima de alumnos mayores en nivel básico y permite avanzar
 * a niños pequeños sobresalientes (Low Floor, High Ceiling).
 */
export const SKILL_LEVELS = Object.freeze([
  {
    level: 1,
    code: 'N1',
    title: 'Nivel 1 · Órbita Guiada',
    short: 'Nivel 1',
    emoji: '🐣',
    kid: 'Fácil',
    desc: 'Pistas luminosas activas, clima suave y energía extra.',
    weights: { calma: 0.68, claseM: 0.24, claseX: 0.08 },
    breakScale: 0.45,
    progressBoost: 1.2,
    alwaysScaffold: true,
    sandboxAllowed: false,
  },
  {
    level: 2,
    code: 'N2',
    title: 'Nivel 2 · Cadete Solar',
    short: 'Nivel 2',
    emoji: '🙂',
    kid: 'Tranquilo',
    desc: 'Tormentas moderadas con recordatorios de escudo.',
    weights: { calma: 0.56, claseM: 0.30, claseX: 0.14 },
    breakScale: 0.75,
    progressBoost: 1.08,
    alwaysScaffold: false,
    sandboxAllowed: false,
  },
  {
    level: 3,
    code: 'N3',
    title: 'Nivel 3 · Comandante ISS',
    short: 'Nivel 3',
    emoji: '🚀',
    kid: 'Normal',
    desc: 'Equilibrio estándar entre producción científica y defensa.',
    weights: { calma: 0.50, claseM: 0.32, claseX: 0.18 },
    breakScale: 1.0,
    progressBoost: 1.0,
    alwaysScaffold: false,
    sandboxAllowed: false,
  },
  {
    level: 4,
    code: 'N4',
    title: 'Nivel 4 · Misión Artemis',
    short: 'Nivel 4',
    emoji: '🔥',
    kid: 'Difícil',
    desc: 'Clima espacial intenso en espacio profundo sin pistas iniciales.',
    weights: { calma: 0.38, claseM: 0.36, claseX: 0.26 },
    breakScale: 1.15,
    progressBoost: 0.96,
    alwaysScaffold: false,
    sandboxAllowed: true,
  },
  {
    level: 5,
    code: 'N5',
    title: 'Nivel 5 · Laboratorio Astro-Matic',
    short: 'Nivel 5',
    emoji: '🧪',
    kid: 'Científico',
    desc: 'Techo alto + Sandbox: controla el Sol en vivo y analiza telemetría ML.',
    weights: { calma: 0.34, claseM: 0.36, claseX: 0.30 },
    breakScale: 1.2,
    progressBoost: 0.95,
    alwaysScaffold: false,
    sandboxAllowed: true,
  },
]);

/** Rayos ⚡ disponibles según la eficienciaTripulacion del turno anterior. */
export const AP_RULES = Object.freeze([
  { min: 75, ap: 3 },
  { min: 40, ap: 2 },
  { min: 0, ap: 1 },
]);

export const MAX_BOLTS_PER_MODULE = 3;

/** Avance base de misión por sol según el nivel de `actividad` (0, 1, 2). */
export const PROGRESS_BASE = Object.freeze([4, 8, 13]);

/** Penalización de eficiencia por cada módulo averiado sin reparar. */
export const BROKEN_EFFICIENCY_PENALTY = 6;

/**
 * Eventos de clima espacial (valores derivados de NASA DONKI / OSDR).
 * Incluye iconos geométricos (`shape`) además de color para accesibilidad en daltonismo.
 */
export const SPACE_EVENTS = Object.freeze({
  calma: {
    id: 'calma',
    label: 'Sol tranquilo',
    emoji: '😎',
    signal: '🟢',
    shape: '●',
    pattern: 'solid',
    intensidad: 1.2,
    mSv: 0.8,
    tip: 'Toca 🌱 y 🫧',
  },
  claseM: {
    id: 'claseM',
    label: '¡Llamarada M!',
    emoji: '🔥',
    signal: '🟠',
    shape: '▲',
    pattern: 'stripe',
    intensidad: 5.8,
    mSv: 16.0,
    tip: 'Toca 🛡️',
  },
  claseX: {
    id: 'claseX',
    label: '¡Tormenta X!',
    emoji: '🌪️',
    signal: '🔴',
    shape: '◆',
    pattern: 'grid',
    intensidad: 9.2,
    mSv: 50.0,
    tip: 'Toca 🛡️ + 💧',
  },
});

export const EVENT_WEIGHTS = Object.freeze({ calma: 0.5, claseM: 0.32, claseX: 0.18 });

/** Andamiaje: los primeros soles están guionizados para enseñar paso a paso. */
export const SCRIPTED_EVENTS = Object.freeze({ 1: 'calma', 2: 'claseM', 3: 'calma', 4: 'claseX' });

/** Probabilidad base de avería por módulo según el evento. */
export const BREAK_CHANCE = Object.freeze({ calma: 0.03, claseM: 0.12, claseX: 0.26 });
export const SHIELD_BREAK_FACTOR = Object.freeze({ 1: 1, 2: 0.6, 3: 0.3 });
export const MAX_BREAKS_PER_SOL = 2;

export const MODULE_IDS = Object.freeze(['agua', 'comida', 'escudos', 'oxigeno']);

export const MODULES = Object.freeze({
  agua: { id: 'agua', label: 'Agua', icon: '💧', key: '1', accent: '#5AC8FA' },
  comida: { id: 'comida', label: 'Comida', icon: '🌱', key: '2', accent: '#30D158' },
  escudos: { id: 'escudos', label: 'Escudos', icon: '🛡️', key: '3', accent: '#0A84FF' },
  oxigeno: { id: 'oxigeno', label: 'Oxígeno', icon: '🫧', key: '4', accent: '#64D2FF' },
});

/**
 * Cápsulas de Anclaje con el Mundo Real (NASA DONKI, OSDR & Spinoffs cotidianos).
 */
export const NASA_SPINOFF_FACTS = Object.freeze({
  waterShield: {
    tag: 'NASA Artemis',
    text: 'En la nave Orion, el agua protege a los astronautas del Sol. 💧',
  },
  arabidopsis: {
    tag: 'NASA OSDR',
    text: 'En la Estación Espacial cultivan plantas que cuidan las células. 🌱',
  },
  spinoffLED: {
    tag: 'NASA Spinoff',
    text: 'La NASA inventó luces LED para plantas. ¡Hoy se usan en granjas! 💡',
  },
  spinoffWater: {
    tag: 'NASA Spinoff',
    text: 'La NASA recicla 9 de cada 10 gotas. ¡Y limpia agua en la Tierra! 🌍',
  },
  donkiWeather: {
    tag: 'NASA DONKI',
    text: 'Satélites de la NASA vigilan al Sol para avisar a los astronautas. 🛰️',
  },
});

/**
 * Contenido del Modal para Padres y Maestros (Guía Docente K-12).
 */
export const EDUCATOR_GUIDE = Object.freeze({
  standards: [
    {
      code: 'NGSS MS-ESS1-1 / HS-ESS1-1',
      title: 'Clima Espacial y Actividad Solar',
      desc: 'Comprende cómo las fulguraciones solares (Clase M y X) y las partículas energéticas solares (SEP) interactúan con el entorno espacial y los sistemas tecnológicos.',
    },
    {
      code: 'NGSS 3-5-ETS1-2 / MS-ETS1-2',
      title: 'Diseño de Ingeniería bajo Restricciones',
      desc: 'Evalúa soluciones de diseño en competencia (usar agua como blindaje antirradiación vs. riego hidropónico) considerando recursos energéticos limitados (⚡ AP).',
    },
    {
      code: 'NGSS MS-LS1-5 · NASA OSDR',
      title: 'Biología Espacial y Soporte Vital',
      desc: 'Analiza cómo los factores ambientales (luz del invernadero, radiación, bio-suplementos) influyen en el crecimiento de Arabidopsis y la salud fisiológica.',
    },
  ],
  cognitiveSkills: [
    'Pensamiento sistémico: equilibrar subsistemas acoplados (Agua ↔ Escudos ↔ Comida ↔ Oxígeno).',
    'Toma de decisiones basada en evidencia: leer señales tempranas del Sol antes de asignar recursos.',
    'Autorregulación y flexibilidad cognitiva: adaptarse a averías imprevistas sin frustración (entorno Safe-to-Fail).',
  ],
  discussionPrompts: [
    '1. ¿Por qué el agua sirve tanto para cuidar las plantas como para frenar la radiación de una tormenta solar Clase X, y qué pasa si usamos toda el agua en los escudos durante un día soleado?',
    '2. Cuando la tripulación se cansa y bajan tus rayos ⚡ disponibles, ¿qué módulo priorizaste recuperar primero y por qué?',
    '3. ¿Cómo se parecen las tecnologías de reciclaje de agua y cultivo LED de tu estación espacial a las soluciones que necesitamos para cuidar los recursos en la Tierra?',
  ],
});

/** Comandantes seleccionables en la Vista 1. */
export const COMMANDERS = Object.freeze([
  { id: 'nova', name: 'Nova', trait: 'Exploradora', suit: '#DCE6F5', accent: '#FF7A45', visor: '#5AC8FA', badge: 'star' },
  { id: 'orion', name: 'Orión', trait: 'Ingeniero', suit: '#D6E4FF', accent: '#0A84FF', visor: '#FFD60A', badge: 'bolt' },
  { id: 'luna', name: 'Luna', trait: 'Científica', suit: '#E6DCFF', accent: '#BF5AF2', visor: '#64D2FF', badge: 'moon' },
  { id: 'atlas', name: 'Atlas', trait: 'Botánico', suit: '#D5F5E0', accent: '#30D158', visor: '#FF9F0A', badge: 'leaf' },
  { id: 'vega', name: 'Vega', trait: 'Médica', suit: '#FFE1E6', accent: '#FF375F', visor: '#5E5CE6', badge: 'heart' },
  { id: 'cosmo', name: 'Cosmo', trait: 'Piloto', suit: '#FFF1C9', accent: '#FF9F0A', visor: '#30D158', badge: 'planet' },
]);

export const CREW_SIZE = 5;
export const CREW_ENERGY_OFFSETS = Object.freeze([0, 6, -5, 3, -8]);
export const CREW_HOMES = Object.freeze(['escudos', 'agua', 'comida', 'oxigeno', 'escudos']);

export const STORAGE_KEYS = Object.freeze({
  name: 'name',
  commander: 'commander',
  skillLevel: 'skillLevel',
  bgmMuted: 'bgmMuted',
  sfxMuted: 'sfxMuted',
  ttsEnabled: 'ttsEnabled',
  tutorialDone: 'tutorialDone',
  best: 'best',
  telemetry: 'telemetry',
});
