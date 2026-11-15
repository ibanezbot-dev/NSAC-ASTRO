/**
 * Telemetría de Ganancia de Aprendizaje (Learning Gain Analytics — Paso 7).
 * Registra de forma anónima y 100% local (COPPA Stateless):
 *  1. Curva de reducción de errores (primeras exposiciones vs. rondas posteriores).
 *  2. Tiempo de toma de decisión (latencia desde inicio del Sol hasta acción/resolución).
 *  3. Dominio por Nivel (Niveles 1 a 5) sin requerir pistas asistidas.
 *  4. Estado de Pistas Progresivas Automatizadas (1er y 2do error conceptual).
 */
import { STORAGE_KEYS } from './config.js';
import { storage } from './util.js';

function defaultStore() {
  return {
    version: 1,
    totalSols: 0,
    missionsCompleted: 0,
    rescuesUsed: 0,
    byConcept: {
      calma: { attempts: 0, firstHalfErrors: 0, secondHalfErrors: 0, history: [] },
      claseM: { attempts: 0, firstHalfErrors: 0, secondHalfErrors: 0, history: [] },
      claseX: { attempts: 0, firstHalfErrors: 0, secondHalfErrors: 0, history: [] },
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
  };
}

class LearningTelemetry {
  constructor() {
    this.data = { ...defaultStore(), ...(storage.get(STORAGE_KEYS.telemetry, null) || {}) };
    this.solStartTime = performance.now();
    this.firstTapTime = null;
  }

  save() {
    storage.set(STORAGE_KEYS.telemetry, this.data);
  }

  markSolStart() {
    this.solStartTime = performance.now();
    this.firstTapTime = null;
  }

  markFirstTap() {
    if (this.firstTapTime === null) {
      this.firstTapTime = performance.now();
    }
  }

  /**
   * Evalúa si la decisión del estudiante en este Sol fue científicamente óptima
   * para el evento de clima espacial actual.
   */
  evaluateDecision(event, inputs, apMax) {
    if (event.id === 'claseX') {
      // En Tormenta X se requiere blindaje 3 (Escudos + Agua) si hay >=2 AP, o blindaje >=2 con 1 AP
      const ok = apMax >= 2 ? inputs.blindaje === 3 : inputs.blindaje >= 2;
      return {
        optimal: ok,
        reason: ok
          ? null
          : 'En una Tormenta Clase X 🔴 las partículas atraviesan el casco si no combinas 🛡️ Escudos + 💧 Agua.',
        hint: '¡Tormenta X! Usa 🛡️ + 💧',
        targetModules: ['escudos', 'agua'],
        distractorModules: ['comida', 'oxigeno'],
      };
    }
    if (event.id === 'claseM') {
      const ok = inputs.blindaje >= 2;
      return {
        optimal: ok,
        reason: ok
          ? null
          : 'En una Llamarada Clase M 🟠 necesitas activar al menos 🛡️ Escudos para desviar la radiación.',
        hint: '¡Llamarada! Toca 🛡️',
        targetModules: ['escudos'],
        distractorModules: ['comida'],
      };
    }
    // Calma solar: lo óptimo es priorizar producción (Comida / Oxígeno) sin desperdiciar toda el agua en refugio
    const ok = !inputs.emergencia && inputs.production >= 1;
    return {
      optimal: ok,
      reason: ok
        ? null
        : 'Con el Sol en Calma 🟢 no hace falta encerrarse en el refugio: usa tus ⚡ en 🌱 Comida y 🫧 Oxígeno.',
      hint: 'Sol tranquilo: usa 🌱 y 🫧',
      targetModules: ['comida', 'oxigeno'],
      distractorModules: ['agua', 'escudos'],
    };
  }

  /**
   * Registra el resultado de un Sol y actualiza las curvas de aprendizaje.
   */
  recordSol({ level, event, inputs, apMax, hintAssisted }) {
    const now = performance.now();
    const latencyMs = Math.round((this.firstTapTime ?? now) - this.solStartTime);
    const evalResult = this.evaluateDecision(event, inputs, apMax);

    this.data.totalSols += 1;
    this.data.decisionTimesMs.push(Math.min(60000, Math.max(120, latencyMs)));
    if (this.data.decisionTimesMs.length > 60) this.data.decisionTimesMs.shift();

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

    this.save();
    return {
      ...evalResult,
      latencyMs,
      consecutiveFailures: this.data.consecutiveConceptFailures[cid],
    };
  }

  recordMissionWin() {
    this.data.missionsCompleted += 1;
    this.save();
  }

  recordRescue() {
    this.data.rescuesUsed += 1;
    this.save();
  }

  /**
   * Devuelve el nivel de pista progresiva para el evento actual:
   *  0 = sin fallos previos en este concepto
   *  1 = 1 fallo previo → mostrar feedback formativo explicando la causa física
   *  2 = 2+ fallos previos → resaltar módulos correctos y atenuar distractores
   */
  progressiveHintState(eventId) {
    const fails = this.data.consecutiveConceptFailures?.[eventId] || 0;
    if (fails >= 2) return 2;
    if (fails === 1) return 1;
    return 0;
  }

  /**
   * Calcula métricas resumidas de Ganancia de Aprendizaje (Learning Gain).
   */
  summary() {
    const concepts = Object.entries(this.data.byConcept).map(([id, c]) => {
      const h = c.history || [];
      const half = Math.max(1, Math.floor(h.length / 2));
      const first = h.slice(0, half);
      const last = h.slice(half);
      const errFirst = first.length ? Math.round((1 - first.reduce((a, b) => a + b, 0) / first.length) * 100) : 0;
      const errLast = last.length ? Math.round((1 - last.reduce((a, b) => a + b, 0) / last.length) * 100) : errFirst;
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
    };
  }

  exportJSON() {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        coppaCompliant: true,
        summary: this.summary(),
        raw: this.data,
      },
      null,
      2,
    );
  }
}

export const telemetry = new LearningTelemetry();
