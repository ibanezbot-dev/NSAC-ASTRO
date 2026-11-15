/**
 * Telemetría de Ganancia de Aprendizaje (Learning Gain Analytics — Paso 7 y Paso 8).
 * Registra de forma anónima y 100% local (COPPA Stateless en localStorage):
 *  1. Curva de reducción de errores (primera ronda vs. rondas posteriores del mismo concepto).
 *  2. Tiempo de toma de decisión (latencia entre la aparición del reto y la acción correcta).
 *  3. Dominio por Nivel (Niveles 1 a 5 dentro de cada modo de edad) sin requerir pistas asistidas.
 *  4. Estado de Pistas Progresivas Automatizadas (1er y 2do intento fallido).
 *  5. Conexión con la Bitácora Docente: cada evento de telemetría se registra y muestra al
 *     maestro como entrada de bitácora con su decisión pedagógica/científica y su fuente verificada.
 */
import { DESIGN_SOURCES, MEDALS, STORAGE_KEYS } from './config.js';
import { storage } from './util.js';

const SOURCE_BY_KEY = Object.fromEntries(DESIGN_SOURCES.map((s) => [s.key, s]));

function defaultStore() {
  return {
    version: 2,
    totalSols: 0,
    missionsCompleted: 0,
    rescuesUsed: 0,
    byConcept: {
      calma: { attempts: 0, firstRoundError: null, history: [] },
      claseM: { attempts: 0, firstRoundError: null, history: [] },
      claseX: { attempts: 0, firstRoundError: null, history: [] },
    },
    byLevel: {
      1: { attempts: 0, optimalWithoutHint: 0 },
      2: { attempts: 0, optimalWithoutHint: 0 },
      3: { attempts: 0, optimalWithoutHint: 0 },
      4: { attempts: 0, optimalWithoutHint: 0 },
      5: { attempts: 0, optimalWithoutHint: 0 },
    },
    decisionTimesMs: [],
    consecutiveConceptFailures: { calma: 0, claseM: 0, claseX: 0 },
    bitacora: [],
  };
}

class LearningTelemetry {
  constructor() {
    const saved = storage.get(STORAGE_KEYS.telemetry, null) || {};
    const def = defaultStore();
    this.data = {
      ...def,
      ...saved,
      byConcept: { ...def.byConcept, ...(saved.byConcept || {}) },
      byLevel: { ...def.byLevel, ...(saved.byLevel || {}) },
      consecutiveConceptFailures: {
        ...def.consecutiveConceptFailures,
        ...(saved.consecutiveConceptFailures || {}),
      },
      bitacora: Array.isArray(saved.bitacora) ? saved.bitacora : [],
    };
    this.solStartTime = performance.now();
    this.firstTapTime = null;
    this.correctActionTime = null;
  }

  save() {
    storage.set(STORAGE_KEYS.telemetry, this.data);
  }

  /** Desbloquea y guarda medallas en localStorage (COPPA Stateless — Paso 5). */
  getUnlockedMedals() {
    return storage.get(STORAGE_KEYS.medals, []);
  }

  unlockMedal(medalId) {
    const current = this.getUnlockedMedals();
    if (current.includes(medalId)) return false;
    const medal = MEDALS.find((m) => m.id === medalId);
    if (!medal) return false;
    const next = [...current, medalId];
    storage.set(STORAGE_KEYS.medals, next);
    this.appendBitacora({
      type: 'medal',
      reto: `Medalla desbloqueada: ${medal.icon} ${medal.title}`,
      accion: medal.desc,
      decision: 'Persistencia local de logros y medallas sin cuentas externas (COPPA Stateless)',
      sourceKey: 'coppa',
    });
    return true;
  }

  /**
   * Añade una entrada a la Bitácora Docente vinculando el evento con su decisión y su fuente (Paso 7 y 8).
   */
  appendBitacora({ type, sol = null, ageMode = null, level = null, reto, accion, decision, sourceKey = 'donki' }) {
    const src = SOURCE_BY_KEY[sourceKey] || SOURCE_BY_KEY.donki;
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      sol,
      ageMode,
      level,
      reto,
      accion,
      decision: decision || src.decision,
      fuente: src.fuente,
      url: src.url,
    };
    this.data.bitacora.unshift(entry);
    if (this.data.bitacora.length > 60) {
      this.data.bitacora.length = 60;
    }
    this.save();
    return entry;
  }

  markSolStart() {
    this.solStartTime = performance.now();
    this.firstTapTime = null;
    this.correctActionTime = null;
  }

  markFirstTap() {
    if (this.firstTapTime === null) {
      this.firstTapTime = performance.now();
    }
  }

  /** Registra el instante exacto en que el jugador alcanza la configuración correcta (Paso 7). */
  markPlanEvaluated(isOptimal) {
    if (isOptimal) {
      if (this.correctActionTime === null) {
        this.correctActionTime = performance.now();
      }
    } else {
      this.correctActionTime = null;
    }
  }

  /**
   * Evalúa si la decisión del estudiante en este Sol fue científicamente óptima
   * para el evento de clima espacial actual, considerando el modo de edad (7-9 vs 10-12).
   */
  evaluateDecision(event, inputs, apMax, ageMode = '10-12') {
    const bioLabel = ageMode === '7-9' ? '🌱🫧 Bio-Invernadero' : '🌱 Comida y 🫧 Oxígeno';
    const bioTargets = ageMode === '7-9' ? ['comida'] : ['comida', 'oxigeno'];

    if (event.id === 'claseX') {
      const ok = apMax >= 2 ? inputs.blindaje === 3 : inputs.blindaje >= 2;
      return {
        optimal: ok,
        reason: ok
          ? '¡Excelente! La masa rica en hidrógeno del agua (💧) junto al campo magnético (🛡️) frenó las partículas energéticas solares (SEP) Clase X.'
          : 'Causa física del fallo: En una Tormenta Clase X 🔴 las partículas energéticas solares atraviesan el blindaje básico; necesitas combinar 🛡️ Escudos + 💧 Agua para crear la pared de absorción.',
        hint: '¡Tormenta X! Combina 🛡️ Escudos + 💧 Agua',
        targetModules: ['escudos', 'agua'],
        distractorModules: bioTargets,
        sourceKey: 'spinoff',
      };
    }
    if (event.id === 'claseM') {
      const ok = inputs.blindaje >= 2;
      return {
        optimal: ok,
        reason: ok
          ? '¡Bien hecho! El escudo activo (🛡️) desvió la radiación de la llamarada Clase M manteniendo a salvo a la tripulación.'
          : 'Causa física del fallo: En una Llamarada Clase M 🟠 el flujo de rayos X y protones fatiga las células si no activas al menos 🛡️ Escudos.',
        hint: '¡Llamarada M! Activa 🛡️ Escudos',
        targetModules: ['escudos'],
        distractorModules: ['comida'],
        sourceKey: 'donki',
      };
    }
    // Calma solar: lo óptimo es priorizar producción (Comida / Oxígeno) sin encerrarse en refugio de agua
    const ok = !inputs.emergencia && inputs.production >= 1;
    return {
      optimal: ok,
      reason: ok
        ? `¡Óptimo! Con el Sol en Calma 🟢 aprovechaste la energía en ${bioLabel} para impulsar fotosíntesis y soporte vital.`
        : `Causa lógica del fallo: Con el Sol en Calma 🟢 desviar agua al refugio quita riego al invernadero sin necesidad; asigna tus ⚡ a ${bioLabel}.`,
      hint: `Sol tranquilo: impulsa ${bioLabel}`,
      targetModules: bioTargets,
      distractorModules: ['agua', 'escudos'],
      sourceKey: 'osdr',
    };
  }

  /**
   * Registra el resultado de un Sol, actualiza las curvas de aprendizaje y escribe en la Bitácora.
   */
  recordSol({ ageMode = '10-12', level, sol = 1, event, inputs, apMax, hintAssisted }) {
    const now = performance.now();
    const evalResult = this.evaluateDecision(event, inputs, apMax, ageMode);
    const actionPerfTime = evalResult.optimal
      ? (this.correctActionTime ?? this.firstTapTime ?? now)
      : (this.firstTapTime ?? now);
    const latencyMs = Math.round(Math.max(120, actionPerfTime - this.solStartTime));

    this.data.totalSols += 1;
    if (evalResult.optimal) {
      this.data.decisionTimesMs.push(Math.min(60000, latencyMs));
      if (this.data.decisionTimesMs.length > 60) this.data.decisionTimesMs.shift();
    }

    const cid = event.id;
    const concept = this.data.byConcept[cid] || (this.data.byConcept[cid] = { attempts: 0, history: [] });
    concept.attempts += 1;
    concept.history.push(evalResult.optimal ? 1 : 0);
    if (concept.history.length > 30) concept.history.shift();

    // Seguimiento de fallos consecutivos para las Pistas Progresivas Automatizadas (Paso 4)
    if (evalResult.optimal) {
      this.data.consecutiveConceptFailures[cid] = 0;
    } else {
      this.data.consecutiveConceptFailures[cid] = (this.data.consecutiveConceptFailures[cid] || 0) + 1;
    }

    // Dominio por Nivel (1 a 5) sin requerir pista asistida de nivel 2
    const lvlSlot = this.data.byLevel[level] || (this.data.byLevel[level] = { attempts: 0, optimalWithoutHint: 0 });
    lvlSlot.attempts += 1;
    if (evalResult.optimal && !hintAssisted) {
      lvlSlot.optimalWithoutHint += 1;
    }

    const fails = this.data.consecutiveConceptFailures[cid];
    const latencySec = (latencyMs / 1000).toFixed(1);

    // Entrada de bitácora para el docente (Paso 7: evento + decisión + fuente)
    this.appendBitacora({
      type: evalResult.optimal ? 'sol_optimal' : 'sol_error',
      sol,
      ageMode,
      level,
      reto: `Día ${sol} (${ageMode} · N${level}) · ${event.label} (${event.mSv} mSv/día)`,
      accion: `${evalResult.optimal ? '✅ Decisión óptima' : `⚠️ Intento fallido #${fails}`} en ${latencySec} s · Blindaje N${inputs.blindaje}, Invernadero ${Math.round(inputs.energiaInvernadero)}%${hintAssisted ? ' (con pista N2)' : ''}`,
      decision: evalResult.optimal
        ? evalResult.reason
        : `${evalResult.reason} ${fails >= 2 ? '→ Se activa Pista Progresiva Nivel 2 (resaltado y reducción de distractores).' : '→ Se entrega retroalimentación formativa de 1er intento.'}`,
      sourceKey: evalResult.optimal ? evalResult.sourceKey : (fails >= 2 ? 'scaffolding' : evalResult.sourceKey),
    });

    // Medallas por logros científicos
    if (event.id === 'claseX' && inputs.blindaje === 3) {
      this.unlockMedal('water_shield');
    }
    if (inputs.contramedidas === 1) {
      this.unlockMedal('bio_synergy');
    }

    this.save();
    return {
      ...evalResult,
      latencyMs,
      consecutiveFailures: fails,
    };
  }

  recordCustomVariables({ ageMode = '10-12', level = 3, intensidad, mSv }) {
    this.unlockMedal('astro_lab');
    this.appendBitacora({
      type: 'custom_vars',
      ageMode,
      level,
      reto: `Laboratorio Astro-Matic (${ageMode} · N${level})`,
      accion: `Usuario personalizó parámetros: Intensidad=${Number(intensidad).toFixed(1)}, Dosis=${Number(mSv).toFixed(1)} mSv/día`,
      decision: 'Personalización de variables en tiempo real para observar causa y efecto (inspiración Astro-Matic)',
      sourceKey: 'astromatic',
    });
  }

  recordMissionWin({ ageMode = '10-12', level = 3, sol = 1 } = {}) {
    this.data.missionsCompleted += 1;
    this.unlockMedal('mission_commander');
    this.appendBitacora({
      type: 'mission_win',
      sol,
      ageMode,
      level,
      reto: `Misión completada al 100% en ${sol} días (${ageMode} · N${level})`,
      accion: '🏆 Meta científica alcanzada sin reinicio punitivo',
      decision: 'Diseño inverso y progresión por Zona de Desarrollo Próximo (Niveles 1 a 5)',
      sourceKey: 'scaffolding',
    });
    this.save();
  }

  recordRescue({ ageMode = '10-12', level = 3, sol = 1 } = {}) {
    this.data.rescuesUsed += 1;
    this.appendBitacora({
      type: 'rescue',
      sol,
      ageMode,
      level,
      reto: `Asistencia Safe-to-Fail activada en Día ${sol}`,
      accion: '🛸 Dron de suministros reparó módulos y recargó soporte vital sin perder progreso',
      decision: 'Entorno seguro para fallar (Cero Game Over punitivo) para sostener la exploración científica',
      sourceKey: 'scaffolding',
    });
    this.save();
  }

  /**
   * Devuelve el nivel de pista progresiva para el evento actual (Paso 4):
   *  0 = sin fallos previos en este concepto
   *  1 = 1 fallo previo → mostrar feedback formativo explicando la causa física/lógica
   *  2 = 2+ fallos previos → resaltar la zona correcta y reducir/atenuar opciones distractoras
   */
  progressiveHintState(eventId) {
    const fails = this.data.consecutiveConceptFailures?.[eventId] || 0;
    if (fails >= 2) return 2;
    if (fails === 1) return 1;
    return 0;
  }

  /**
   * Calcula métricas resumidas de Ganancia de Aprendizaje (Learning Gain):
   * Comparativa de intentos fallidos en la primera ronda frente a las rondas posteriores.
   */
  summary() {
    const concepts = Object.entries(this.data.byConcept).map(([id, c]) => {
      const h = c.history || [];
      let errFirst = 0;
      let errLast = 0;
      if (h.length === 1) {
        errFirst = h[0] === 0 ? 100 : 0;
        errLast = errFirst;
      } else if (h.length > 1) {
        // Comparativa entre primera ronda (o primera mitad) y rondas posteriores (Paso 7)
        const split = Math.max(1, Math.floor(h.length / 2));
        const first = h.slice(0, split);
        const last = h.slice(split);
        errFirst = Math.round((1 - first.reduce((a, b) => a + b, 0) / first.length) * 100);
        errLast = Math.round((1 - last.reduce((a, b) => a + b, 0) / last.length) * 100);
      }
      return { id, attempts: h.length, errFirst, errLast, reduction: Math.max(0, errFirst - errLast) };
    });

    const times = this.data.decisionTimesMs || [];
    const avgLatencySec = times.length
      ? (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(1)
      : '—';

    const levels = Object.entries(this.data.byLevel).map(([lvl, d]) => ({
      level: Number(lvl),
      attempts: d.attempts,
      masteryPct: d.attempts ? Math.round((d.optimalWithoutHint / d.attempts) * 100) : 0,
    }));

    return {
      totalSols: this.data.totalSols,
      missionsCompleted: this.data.missionsCompleted,
      rescuesUsed: this.data.rescuesUsed,
      avgLatencySec,
      concepts,
      levels,
      medals: this.getUnlockedMedals(),
      bitacora: this.data.bitacora || [],
    };
  }

  exportJSON() {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        coppaCompliant: true,
        summary: this.summary(),
        sourcesTable: DESIGN_SOURCES,
        raw: this.data,
      },
      null,
      2,
    );
  }
}

export const telemetry = new LearningTelemetry();
