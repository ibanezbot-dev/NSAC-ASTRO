/**
 * Motor del juego (sin DOM). Gestiona turnos, rayos ⚡, niveles de habilidad (1-5),
 * traducción silenciosa de los 4 módulos visuales a las entradas del modelo ML,
 * entorno Safe-to-Fail (Dron de Rescate sin reinicio punitivo), modo Sandbox
 * y conexión con la Telemetría de Ganancia de Aprendizaje.
 */
import {
  MISSION, SKILL_LEVELS, AP_RULES, MAX_BOLTS_PER_MODULE, PROGRESS_BASE,
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

/**
 * Traducción silenciosa: rayos por módulo → entradas del modelo.
 *  - Escudos + Agua → nivel_blindaje (1 básico · 2 escudo activo · 3 refugio pared de agua)
 *  - Refugio (3) = emergencia total → actividad 0 (todos al refugio)
 *  - Comida + Oxígeno → energia_invernadero (35-100) y contramedidas (0/1)
 *  - El agua desviada al escudo compite con el invernadero (−12 % por rayo)
 *  - Producción > defensa → actividad 2 (trabajo intenso), si no → 1
 */
export function translateToModelInputs(alloc) {
  const a = { agua: 0, comida: 0, escudos: 0, oxigeno: 0, ...alloc };
  const defense = a.escudos + a.agua;
  const production = a.comida + a.oxigeno;

  let blindaje = 1;
  if (defense >= 1) blindaje = 2;
  if (a.agua >= 1 && defense >= 2) blindaje = 3;

  const emergencia = blindaje === 3;
  const actividad = emergencia ? 0 : production > defense ? 2 : 1;
  const energiaInvernadero = clamp(35 + 25 * a.comida + 15 * a.oxigeno - 12 * a.agua, 35, 100);
  const contramedidas = a.oxigeno >= 2 || (a.oxigeno >= 1 && a.comida >= 1) ? 1 : 0;
  const aguaDesviada = a.agua > 0;

  return { blindaje, actividad, contramedidas, energiaInvernadero, emergencia, aguaDesviada, defense, production };
}

export function progressGain(actividad, eficiencia, cultivos, boost = 1) {
  const g = PROGRESS_BASE[actividad] * (eficiencia / 100) * (0.55 + 0.45 * (cultivos / 100)) * boost;
  return Math.round(g * 10) / 10;
}

/**
 * Punto de No Retorno: simula el MEJOR futuro posible (soles en calma, rayos
 * usados primero para reparar y luego para producir, eficiencia recuperándose
 * +30/sol). Si incluso así no se llega a la meta, activa la Evacuación Preventiva
 * o el Dron de Suministros Safe-to-Fail.
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

/** Mensaje pedagógico formativo (corto, para niños) según lo que pasó en el día. */
export function lessonFor({ event, inputs, output }) {
  const { blindaje, actividad, contramedidas, aguaDesviada } = inputs;
  if (event.id === 'claseX') {
    if (blindaje === 3) return '¡El agua frenó la tormenta! 💧🛡️';
    return 'La tormenta pasó el escudo. Usa 🛡️ + 💧 juntos.';
  }
  if (event.id === 'claseM') {
    if (blindaje >= 2) return '¡Escudo arriba! Llamarada desviada 🛡️';
    return 'Sin 🛡️ la radiación cansa al equipo.';
  }
  if (output.saludCultivos < 45) return 'Tus plantas tienen sed. Toca 🌱';
  if (aguaDesviada) return 'Sol tranquilo: guarda 💧 para las plantas.';
  if (actividad === 2) return '¡Sol tranquilo, misión rápida! 🚀';
  if (contramedidas) return '🌱 + 🫧 = ¡vitaminas para el equipo! 🫐';
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

  start({ commander, name, skillLevel }) {
    this.rng = createRng(this.seed++);
    const lvl = skillLevel ?? storage.get(STORAGE_KEYS.skillLevel, 3);
    const skill = getSkillConfig(lvl);
    this.state = {
      commander,
      name,
      skillLevel: skill.level,
      skill,
      sandboxMode: skill.level === 5,
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
    };
    this.emit('mission:start');
    this.beginSol();
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
   * Permite personalizar el clima espacial en vivo (Laboratorio Astro-Matic / Sandbox).
   */
  setWeatherEvent(eventId) {
    const s = this.state;
    if (!s || s.phase !== 'planning' || !SPACE_EVENTS[eventId]) return false;
    s.event = SPACE_EVENTS[eventId];
    s.hintLevel = telemetry.progressiveHintState(s.event.id);
    this.emit('weather:change', { event: s.event });
    return true;
  }

  rollEvent(sol) {
    const s = this.state;
    const scripted = SCRIPTED_EVENTS[sol];
    if (scripted && s.skillLevel <= 3) return SPACE_EVENTS[scripted];
    const weights = s.skill?.weights ?? EVENT_WEIGHTS;
    let r = this.rng();
    let id = 'calma';
    for (const [key, w] of Object.entries(weights)) {
      if ((r -= w) <= 0) { id = key; break; }
    }
    if (id === 'claseX' && s.prevEventId === 'claseX') id = 'claseM';
    return SPACE_EVENTS[id];
  }

  beginSol() {
    const s = this.state;
    s.sol += 1;
    s.event = this.rollEvent(s.sol);
    s.apMax = apFromEfficiency(s.eficiencia);
    s.ap = s.apMax;
    s.actions = [];
    for (const m of Object.values(s.modules)) { m.bolts = 0; m.repaired = false; }
    s.hintLevel = telemetry.progressiveHintState(s.event.id);
    s.phase = 'planning';
    telemetry.markSolStart();
    this.emit('sol:start');
  }

  /** Toque del jugador sobre un módulo. Devuelve qué pasó para el feedback visual. */
  tap(id) {
    const s = this.state;
    if (!s || s.phase !== 'planning') return { ok: false, reason: 'busy' };
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
    this.emit('plan:change', { id, action: 'undo' });
    return true;
  }

  allocation() {
    const s = this.state;
    return Object.fromEntries(MODULE_IDS.map((id) => [id, s.modules[id].bolts]));
  }

  plan() {
    return translateToModelInputs(this.allocation());
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

    // Registrar en Telemetría de Ganancia de Aprendizaje (Paso 7)
    const evalTelemetry = telemetry.recordSol({
      level: s.skillLevel,
      event,
      inputs,
      apMax: s.apMax,
      hintAssisted: s.hintLevel >= 2,
    });

    // Averías sin reparar restan eficiencia (soporte vital degradado).
    const brokenBefore = MODULE_IDS.filter((id) => s.modules[id].broken);
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

    const broken = MODULE_IDS.filter((id) => s.modules[id].broken).length;
    let outcome = 'continue';
    let pnr = { impossible: false };
    if (s.progress >= MISSION.goal) {
      outcome = 'won';
      telemetry.recordMissionWin();
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
      lesson: lessonFor({ event, inputs, output }),
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
    const candidates = MODULE_IDS
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
   * Si se activa la Evacuación Preventiva, el niño puede pedir un Dron de Suministros
   * que repara los módulos, recupera la energía de la tripulación y amplía los suministros
   * para continuar aprendiendo sin perder su progreso ni reiniciar desde cero.
   */
  rescueContinue() {
    const s = this.state;
    if (!s) return false;
    telemetry.recordRescue();
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
    // Rebobinar el sol actual para que aplique lo aprendido de inmediato
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
