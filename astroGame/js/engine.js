/**
 * Motor del juego (sin DOM). Gestiona modos de edad (7–9 y 10–12 años),
 * niveles de habilidad (1–5, Zona de Desarrollo Próximo), turnos, rayos ⚡,
 * traducción silenciosa de módulos a las entradas del modelo ML,
 * personalización de variables en vivo (Astro-Matic), entorno Safe-to-Fail
 * (Cero Game Over punitivo + Pistas Progresivas en 1er y 2do intento) y Telemetría.
 */
import {
  AGE_MODES, MISSION, SKILL_LEVELS, AP_RULES, MAX_BOLTS_PER_MODULE, PROGRESS_BASE,
  BROKEN_EFFICIENCY_PENALTY, SPACE_EVENTS, EVENT_WEIGHTS, SCRIPTED_EVENTS,
  BREAK_CHANCE, SHIELD_BREAK_FACTOR, MAX_BREAKS_PER_SOL, MODULE_IDS,
  COMMANDERS, CREW_SIZE, CREW_ENERGY_OFFSETS, CREW_HOMES, NASA_SPINOFF_FACTS,
  STORAGE_KEYS,
} from './config.js';
import { clamp, createRng, storage } from './util.js';
import { telemetry } from './telemetry.js';

export const apFromEfficiency = (eff) =>
  (AP_RULES.find((r) => eff >= r.min) ?? AP_RULES[AP_RULES.length - 1]).ap;

export const getSkillConfig = (level = 3) =>
  SKILL_LEVELS.find((l) => l.level === Number(level)) ?? SKILL_LEVELS[2];

export const getAgeModeConfig = (ageMode = '10-12') =>
  AGE_MODES[ageMode] ?? AGE_MODES['10-12'];

/**
 * Traducción silenciosa: rayos por módulo → entradas del modelo ML.
 *  - Modo 7-9 años (3 módulos primarios): 'comida' actúa como 🌱🫧 Bio-Invernadero unificado
 *    (acopla cultivo y bio-oxígeno para respetar el límite de <= 3 módulos de Wouters et al., 2008).
 *  - Modo 10-12 años (4 módulos primarios): Agua, Comida, Escudos y Oxígeno independientes.
 */
export function translateToModelInputs(alloc, ageMode = '10-12') {
  const a = { agua: 0, comida: 0, escudos: 0, oxigeno: 0, ...alloc };
  const isYoungMode = ageMode === '7-9';

  const defense = a.escudos + a.agua;
  const production = isYoungMode ? a.comida * 1.5 : a.comida + a.oxigeno;

  let blindaje = 1;
  if (defense >= 1) blindaje = 2;
  if (a.agua >= 1 && defense >= 2) blindaje = 3;

  const emergencia = blindaje === 3;
  const actividad = emergencia ? 0 : production > defense ? 2 : 1;

  const energiaInvernadero = isYoungMode
    ? clamp(35 + 32 * a.comida - 12 * a.agua, 35, 100)
    : clamp(35 + 25 * a.comida + 15 * a.oxigeno - 12 * a.agua, 35, 100);

  const contramedidas = isYoungMode
    ? (a.comida >= 2 ? 1 : 0)
    : (a.oxigeno >= 2 || (a.oxigeno >= 1 && a.comida >= 1) ? 1 : 0);

  const aguaDesviada = a.agua > 0;

  return {
    blindaje,
    actividad,
    contramedidas,
    energiaInvernadero,
    emergencia,
    aguaDesviada,
    defense,
    production,
  };
}

export function progressGain(actividad, eficiencia, cultivos, boost = 1) {
  const g = PROGRESS_BASE[actividad] * (eficiencia / 100) * (0.55 + 0.45 * (cultivos / 100)) * boost;
  return Math.round(g * 10) / 10;
}

/**
 * Punto de No Retorno: simula el MEJOR futuro posible. Si incluso así no se llega
 * a la meta, activa la Asistencia Safe-to-Fail (Dron de Suministros sin Game Over punitivo).
 */
export function checkPointOfNoReturn({ progress, sol, maxSols = MISSION.maxSols, eficiencia, broken, salud, boost = 1 }) {
  if (salud <= 0) return { impossible: true, reason: 'crew' };
  const remaining = MISSION.goal - progress;
  if (remaining <= 0) return { impossible: false };
  const solsLeft = maxSols - sol;
  if (solsLeft <= 0) return { impossible: true, reason: 'time' };

  let eff = eficiencia;
  let pending = broken;
  let best = 0;
  for (let i = 0; i < solsLeft; i++) {
    let ap = apFromEfficiency(eff);
    const fix = Math.min(ap, pending);
    pending -= fix;
    ap -= fix;
    const actividad = ap > 0 ? 2 : 1;
    const crops = ap >= 2 ? 100 : ap === 1 ? 80 : 60;
    const effNow = Math.max(0, eff - BROKEN_EFFICIENCY_PENALTY * pending);
    best += progressGain(actividad, effNow, crops, boost);
    eff = Math.min(100, eff + 30);
  }
  if (best + 1e-6 < remaining) return { impossible: true, reason: broken > 0 ? 'damage' : 'time', best, remaining };
  return { impossible: false, best, remaining };
}

/** Mensaje pedagógico formativo según lo que ocurrió en el día. */
export function lessonFor({ event, inputs, output, ageMode = '10-12' }) {
  const { blindaje, actividad, contramedidas, aguaDesviada } = inputs;
  const bioIcon = ageMode === '7-9' ? '🌱🫧' : '🌱';
  if (event.id === 'claseX') {
    if (blindaje === 3) return '¡El agua frenó la tormenta! 💧🛡️';
    return 'La tormenta pasó el escudo. Usa 🛡️ + 💧 juntos.';
  }
  if (event.id === 'claseM') {
    if (blindaje >= 2) return '¡Escudo arriba! Llamarada desviada 🛡️';
    return 'Sin 🛡️ la radiación cansa al equipo.';
  }
  if (output.saludCultivos < 45) return `Tus plantas tienen sed. Toca ${bioIcon}`;
  if (aguaDesviada) return 'Sol tranquilo: guarda 💧 para las plantas.';
  if (actividad === 2) return '¡Sol tranquilo, misión rápida! 🚀';
  if (contramedidas) return `${bioIcon} = ¡vitaminas para el equipo! 🫐`;
  return '¡Buen trabajo, comandante! ⭐';
}

/** Selecciona una cápsula de Ciencia Real NASA / Spinoff contextualizada al turno. */
export function pickSpinoffFact({ event, inputs }) {
  if (inputs.blindaje === 3) return NASA_SPINOFF_FACTS.waterShield;
  if (inputs.contramedidas) return NASA_SPINOFF_FACTS.arabidopsis;
  if (inputs.aguaDesviada) return NASA_SPINOFF_FACTS.spinoffWater;
  if (event.id !== 'calma') return NASA_SPINOFF_FACTS.donkiWeather;
  return NASA_SPINOFF_FACTS.spinoffLED;
}

function buildCrew(commander) {
  const start = Math.max(0, COMMANDERS.findIndex((c) => c.id === commander.id));
  return Array.from({ length: CREW_SIZE }, (_, i) => ({
    ...COMMANDERS[(start + i) % COMMANDERS.length],
    index: i,
    isCommander: i === 0,
    home: CREW_HOMES[i],
    energia: 100,
  }));
}

export class Game extends EventTarget {
  /** @param {{ predict: Function, seed?: number }} opts */
  constructor({ predict, seed = Date.now() }) {
    super();
    this.predict = predict;
    this.seed = seed;
    this.rng = createRng(seed);
    this.state = null;
  }

  emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail: { ...detail, state: this.state } }));
  }

  start({ commander, name, ageMode, skillLevel }) {
    this.rng = createRng(this.seed++);
    const modeId = ageMode ?? storage.get(STORAGE_KEYS.ageMode, '10-12');
    const modeCfg = getAgeModeConfig(modeId);
    const lvl = skillLevel ?? storage.get(STORAGE_KEYS.skillLevel, 3);
    const skill = getSkillConfig(lvl);
    this.state = {
      commander,
      name,
      ageMode: modeCfg.id,
      ageModeCfg: modeCfg,
      skillLevel: skill.level,
      skill,
      sandboxMode: skill.level === 5 || modeCfg.highCeilingDefault,
      sol: 0,
      maxSols: MISSION.maxSols,
      progress: 0,
      phase: 'idle',
      eficiencia: 100,
      cultivos: 75,
      salud: 100,
      ap: 3,
      apMax: 3,
      event: null,
      prevEventId: null,
      modules: Object.fromEntries(MODULE_IDS.map((id) => [id, { bolts: 0, broken: false, repaired: false }])),
      actions: [],
      crew: buildCrew(commander),
      history: [],
      totalBreaks: 0,
      hintLevel: 0,
      solSnapshot: null,
    };
    this.emit('mission:start');
    this.beginSol();
  }

  setAgeMode(ageMode) {
    const modeCfg = getAgeModeConfig(ageMode);
    storage.set(STORAGE_KEYS.ageMode, modeCfg.id);
    if (!this.state) return;
    this.state.ageMode = modeCfg.id;
    this.state.ageModeCfg = modeCfg;
    // Si pasa a 7-9 y había rayos o avería en oxígeno, transferirlos a comida
    if (modeCfg.id === '7-9' && this.state.modules.oxigeno) {
      this.state.modules.oxigeno.broken = false;
      if (this.state.modules.oxigeno.bolts > 0) {
        this.state.ap += this.state.modules.oxigeno.bolts;
        this.state.modules.oxigeno.bolts = 0;
        this.state.actions = this.state.actions.filter((a) => a.id !== 'oxigeno');
      }
    }
    this.emit('mode:change', { ageMode: modeCfg.id });
    this.emit('plan:change', { id: null, action: 'mode' });
  }

  setSkillLevel(level) {
    const skill = getSkillConfig(level);
    storage.set(STORAGE_KEYS.skillLevel, skill.level);
    if (!this.state) return;
    this.state.skillLevel = skill.level;
    this.state.skill = skill;
    this.emit('plan:change', { id: null, action: 'level' });
  }

  /**
   * Permite seleccionar un evento predefinido en vivo (Laboratorio Astro-Matic / Sandbox).
   */
  setWeatherEvent(eventId) {
    const s = this.state;
    if (!s || s.phase !== 'planning' || !SPACE_EVENTS[eventId]) return false;
    s.event = { ...SPACE_EVENTS[eventId] };
    s.hintLevel = telemetry.progressiveHintState(s.event.id);
    this.emit('weather:change', { event: s.event });
    return true;
  }

  /**
   * Personalización de Variables en tiempo real (Paso 2 — inspiración Astro-Matic):
   * Permite al estudiante ingresar o controlar parámetros propios de intensidad solar (0-10)
   * y dosis de radiación (0.5-60 mSv/día) para observar relaciones de causa y efecto en vivo.
   */
  setCustomWeatherParams({ intensidad, mSv }) {
    const s = this.state;
    if (!s || s.phase !== 'planning') return false;
    const intVal = clamp(Number(intensidad ?? s.event.intensidad), 0.2, 10.0);
    const mSvVal = clamp(Number(mSv ?? s.event.mSv), 0.4, 60.0);
    const baseKey = intVal >= 7.5 || mSvVal >= 32 ? 'claseX' : intVal >= 3.5 || mSvVal >= 8 ? 'claseM' : 'calma';
    const base = SPACE_EVENTS[baseKey];
    s.event = {
      ...base,
      intensidad: Math.round(intVal * 10) / 10,
      mSv: Math.round(mSvVal * 10) / 10,
      custom: true,
    };
    telemetry.recordCustomVariables({
      ageMode: s.ageMode,
      level: s.skillLevel,
      intensidad: s.event.intensidad,
      mSv: s.event.mSv,
    });
    this.emit('weather:change', { event: s.event });
    return true;
  }

  rollEvent(sol) {
    const s = this.state;
    const scripted = SCRIPTED_EVENTS[sol];
    if (scripted && s.skillLevel <= 3) return { ...SPACE_EVENTS[scripted] };
    const weights = s.skill?.weights ?? EVENT_WEIGHTS;
    let r = this.rng();
    let id = 'calma';
    for (const [key, w] of Object.entries(weights)) {
      if ((r -= w) <= 0) { id = key; break; }
    }
    if (id === 'claseX' && s.prevEventId === 'claseX') id = 'claseM';
    return { ...SPACE_EVENTS[id] };
  }

  beginSol({ keepEvent = null, forcedHintLevel = null } = {}) {
    const s = this.state;
    if (!keepEvent) {
      s.sol += 1;
      s.event = this.rollEvent(s.sol);
    } else {
      s.event = { ...keepEvent };
    }
    s.apMax = apFromEfficiency(s.eficiencia);
    s.ap = s.apMax;
    s.actions = [];
    for (const m of Object.values(s.modules)) { m.bolts = 0; m.repaired = false; }
    // Snapshot para permitir reintento formativo en el 2do intento (Paso 4)
    s.solSnapshot = {
      progress: s.progress,
      eficiencia: s.eficiencia,
      cultivos: s.cultivos,
      salud: s.salud,
      totalBreaks: s.totalBreaks,
      brokenMap: Object.fromEntries(MODULE_IDS.map((id) => [id, s.modules[id].broken])),
      event: { ...s.event },
    };
    s.hintLevel = forcedHintLevel !== null ? forcedHintLevel : telemetry.progressiveHintState(s.event.id);
    s.phase = 'planning';
    telemetry.markSolStart();
    this.emit('sol:start');
  }

  /**
   * Reintenta el mismo Sol activando la Pista Progresiva Nivel 2 (Paso 4):
   * Resalta la zona correcta y reduce/atenúa las opciones distractoras para guiar el descubrimiento autónomo.
   */
  retryCurrentSolWithHint() {
    const s = this.state;
    if (!s || !s.solSnapshot) return false;
    const snap = s.solSnapshot;
    s.progress = snap.progress;
    s.eficiencia = snap.eficiencia;
    s.cultivos = snap.cultivos;
    s.salud = snap.salud;
    s.totalBreaks = snap.totalBreaks;
    MODULE_IDS.forEach((id) => {
      s.modules[id].broken = !!snap.brokenMap[id];
      s.modules[id].bolts = 0;
      s.modules[id].repaired = false;
    });
    s.crew.forEach((c, i) => {
      c.energia = clamp(s.eficiencia + CREW_ENERGY_OFFSETS[i], 0, 100);
    });
    if (s.history.length && s.history[s.history.length - 1]?.sol === s.sol) {
      s.history.pop();
    }
    this.beginSol({ keepEvent: snap.event, forcedHintLevel: 2 });
    return true;
  }

  /** Toque del jugador sobre un módulo. Devuelve qué pasó para el feedback visual. */
  tap(id) {
    const s = this.state;
    if (!s || s.phase !== 'planning') return { ok: false, reason: 'busy' };
    if (s.ageMode === '7-9' && id === 'oxigeno') return { ok: false, reason: 'hidden-in-mode' };
    const m = s.modules[id];
    if (!m) return { ok: false, reason: 'unknown' };
    if (s.ap <= 0) return { ok: false, reason: 'no-ap' };

    telemetry.markFirstTap();

    let action;
    if (m.broken) {
      m.broken = false;
      m.repaired = true;
      action = 'repair';
    } else if (m.bolts >= MAX_BOLTS_PER_MODULE) {
      return { ok: false, reason: 'max' };
    } else {
      m.bolts += 1;
      action = 'boost';
    }
    s.ap -= 1;
    s.actions.push({ id, action });

    const evalNow = telemetry.evaluateDecision(s.event, this.plan(), s.apMax, s.ageMode);
    telemetry.markPlanEvaluated(evalNow.optimal);

    this.emit('plan:change', { id, action });
    return { ok: true, action };
  }

  undo() {
    const s = this.state;
    if (!s || s.phase !== 'planning' || !s.actions.length) return false;
    const { id, action } = s.actions.pop();
    const m = s.modules[id];
    if (action === 'repair') { m.broken = true; m.repaired = false; } else { m.bolts -= 1; }
    s.ap += 1;

    const evalNow = telemetry.evaluateDecision(s.event, this.plan(), s.apMax, s.ageMode);
    telemetry.markPlanEvaluated(evalNow.optimal);

    this.emit('plan:change', { id, action: 'undo' });
    return true;
  }

  allocation() {
    const s = this.state;
    return Object.fromEntries(MODULE_IDS.map((id) => [id, s.modules[id].bolts]));
  }

  plan() {
    return translateToModelInputs(this.allocation(), this.state?.ageMode ?? '10-12');
  }

  async resolve() {
    const s = this.state;
    if (!s || s.phase !== 'planning') return null;
    s.phase = 'resolving';
    const inputs = this.plan();
    const event = s.event;
    this.emit('turn:resolving', { inputs, event });

    let output;
    try {
      output = await this.predict({
        intensidad: event.intensidad,
        mSv: event.mSv,
        blindaje: inputs.blindaje,
        actividad: inputs.actividad,
        contramedidas: inputs.contramedidas,
        energiaInvernadero: inputs.energiaInvernadero,
      });
    } catch (err) {
      console.error('[ASTRO] Error del modelo', err);
      s.phase = 'planning';
      this.emit('turn:error', { error: err });
      return null;
    }

    // Registrar en Telemetría de Ganancia de Aprendizaje y Bitácora (Paso 7)
    const evalTelemetry = telemetry.recordSol({
      ageMode: s.ageMode,
      level: s.skillLevel,
      sol: s.sol,
      event,
      inputs,
      apMax: s.apMax,
      hintAssisted: s.hintLevel >= 2,
    });

    // Averías sin reparar restan eficiencia (soporte vital degradado).
    const activeIds = s.ageModeCfg?.activeModules ?? MODULE_IDS;
    const brokenBefore = activeIds.filter((id) => s.modules[id].broken);
    const eficiencia = clamp(output.eficienciaTripulacion - BROKEN_EFFICIENCY_PENALTY * brokenBefore.length, 0, 100);
    const cultivos = output.saludCultivos;

    // Salud acumulada de la tripulación (radiación recibida vs. recuperación).
    const prevSalud = s.salud;
    let salud = s.salud - output.danoCelular * 0.35;
    if (inputs.contramedidas) salud += 6;
    if (event.id === 'calma') salud += 3;
    salud = clamp(salud, 0, 100);

    const boost = s.skill?.progressBoost ?? 1;
    const gain = progressGain(inputs.actividad, eficiencia, cultivos, boost);
    const prevProgress = s.progress;
    const prevEficiencia = s.eficiencia;
    const prevCultivos = s.cultivos;
    s.progress = clamp(Math.round((s.progress + gain) * 10) / 10, 0, MISSION.goal);
    s.eficiencia = eficiencia;
    s.cultivos = cultivos;
    s.salud = salud;

    const newBreaks = this.rollBreakdowns({ event, inputs, eficiencia, cultivos });
    s.totalBreaks += newBreaks.length;

    s.crew.forEach((c, i) => { c.energia = clamp(eficiencia + CREW_ENERGY_OFFSETS[i], 0, 100); });

    const broken = activeIds.filter((id) => s.modules[id].broken).length;
    let outcome = 'continue';
    let pnr = { impossible: false };
    if (s.progress >= MISSION.goal) {
      outcome = 'won';
      telemetry.recordMissionWin({ ageMode: s.ageMode, level: s.skillLevel, sol: s.sol });
    } else {
      pnr = checkPointOfNoReturn({
        progress: s.progress,
        sol: s.sol,
        maxSols: s.maxSols,
        eficiencia,
        broken,
        salud,
        boost,
      });
      if (pnr.impossible) outcome = 'evacuated';
    }

    const report = {
      sol: s.sol,
      ageMode: s.ageMode,
      event,
      inputs,
      output,
      eficiencia,
      cultivos,
      salud,
      prev: { eficiencia: prevEficiencia, cultivos: prevCultivos, salud: prevSalud, progress: prevProgress },
      gain: Math.round((s.progress - prevProgress) * 10) / 10,
      progress: s.progress,
      newBreaks,
      brokenUnrepaired: brokenBefore,
      apNext: apFromEfficiency(eficiencia),
      lesson: lessonFor({ event, inputs, output, ageMode: s.ageMode }),
      spinoff: pickSpinoffFact({ event, inputs }),
      telemetry: evalTelemetry,
      outcome,
      evacuationReason: pnr.reason ?? null,
    };
    s.history.push(report);
    s.prevEventId = event.id;
    s.lastReport = report;
    s.phase = outcome === 'continue' ? 'report' : outcome;
    this.emit('turn:resolved', { report });
    return report;
  }

  rollBreakdowns({ event, inputs, eficiencia, cultivos }) {
    const s = this.state;
    if (s.sol <= 1) return []; // el primer sol es guiado y sin sustos
    const scale = s.skill?.breakScale ?? 1;
    const base = BREAK_CHANCE[event.id] * SHIELD_BREAK_FACTOR[inputs.blindaje] * scale;
    const activeIds = s.ageModeCfg?.activeModules ?? MODULE_IDS;
    const candidates = activeIds
      .filter((id) => !s.modules[id].broken)
      .map((id) => {
        let p = base;
        if (id === 'escudos' && event.id !== 'calma') p *= 1.3;
        if (id === 'comida' && cultivos < 35) p += 0.22 * scale;
        if (id === 'oxigeno' && eficiencia < 40) p += 0.18 * scale;
        if (id === 'agua' && s.modules.agua.bolts > 1) p += 0.05 * scale;
        return { id, roll: this.rng(), p };
      })
      .filter((c) => c.roll < c.p)
      .sort((a, b) => a.roll / a.p - b.roll / b.p)
      .slice(0, MAX_BREAKS_PER_SOL);
    candidates.forEach(({ id }) => { s.modules[id].broken = true; });
    return candidates.map((c) => c.id);
  }

  /**
   * Entorno Seguro para Fallar (Safe-to-Fail — Paso 4):
   * Cero Game Over punitivo: el Dron de Suministros repara módulos, recupera energía
   * y amplía los suministros sin perder el progreso ni obligar a reiniciar desde cero.
   */
  rescueContinue() {
    const s = this.state;
    if (!s) return false;
    telemetry.recordRescue({ ageMode: s.ageMode, level: s.skillLevel, sol: s.sol });
    for (const m of Object.values(s.modules)) {
      m.broken = false;
      m.repaired = true;
    }
    s.eficiencia = Math.max(82, s.eficiencia);
    s.salud = Math.max(75, s.salud);
    s.cultivos = Math.max(70, s.cultivos);
    s.maxSols = Math.max(s.maxSols, s.sol + 4);
    s.crew.forEach((c, i) => {
      c.energia = clamp(s.eficiencia + CREW_ENERGY_OFFSETS[i], 0, 100);
    });
    // Rebobinar el sol actual con pista progresiva activa para que aplique lo aprendido de inmediato
    s.sol = Math.max(0, s.sol - 1);
    this.beginSol();
    return true;
  }

  next() {
    if (this.state?.phase === 'report') this.beginSol();
  }

  stars() {
    const s = this.state;
    if (!s) return 0;
    return s.salud >= 75 ? 3 : s.salud >= 45 ? 2 : 1;
  }
}
