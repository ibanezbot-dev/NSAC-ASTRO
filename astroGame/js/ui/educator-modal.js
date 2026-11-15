/**
 * Modal de Guía Docente / Padres + Panel de Telemetría de Ganancia de Aprendizaje
 * (Cumple Pasos 6 y 7 de k12-edugame-web-architect).
 */
import { EDUCATOR_GUIDE } from '../config.js';
import { $, escapeHTML } from '../util.js';
import { telemetry } from '../telemetry.js';
import { sfx } from '../audio.js';

export class EducatorModal {
  constructor() {
    this.el = null;
  }

  mount(parent = document.body) {
    if (this.el) return;
    const wrap = document.createElement('div');
    wrap.className = 'educator-modal';
    wrap.id = 'educator-modal';
    wrap.hidden = true;
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'edu-modal-title');

    wrap.innerHTML = `
      <div class="educator-modal__card glass-card">
        <header class="educator-modal__header">
          <div>
            <span class="educator-modal__tag">STEM · NGSS · NASA KIDS ARCHITECTURE</span>
            <h2 class="educator-modal__title" id="edu-modal-title">🎓 Guía Docente / Padres y Telemetría</h2>
          </div>
          <button type="button" class="hud-icon-btn educator-modal__close" id="edu-close-btn"
            aria-label="Cerrar Guía Docente">✕</button>
        </header>

        <div class="educator-tabs" role="tablist" aria-label="Secciones de la Guía Docente">
          <button type="button" class="educator-tab is-active" data-tab="guide" role="tab" aria-selected="true">
            📚 Estándares y Preguntas
          </button>
          <button type="button" class="educator-tab" data-tab="telemetry" role="tab" aria-selected="false">
            📈 Ganancia de Aprendizaje (Telemetry)
          </button>
        </div>

        <div class="educator-panel" id="edu-panel-guide" role="tabpanel">
          <section class="edu-section">
            <h3>🎯 Estándares Curriculares (NGSS / STEM)</h3>
            <div class="edu-standards">
              ${EDUCATOR_GUIDE.standards
                .map(
                  (s) => `
                <article class="edu-standard-card">
                  <strong>${escapeHTML(s.code)} — ${escapeHTML(s.title)}</strong>
                  <p>${escapeHTML(s.desc)}</p>
                </article>`,
                )
                .join('')}
            </div>
          </section>

          <section class="edu-section">
            <h3>🧠 Habilidades Cognitivas Entrenadas</h3>
            <ul class="edu-list">
              ${EDUCATOR_GUIDE.cognitiveSkills.map((c) => `<li>${escapeHTML(c)}</li>`).join('')}
            </ul>
          </section>

          <section class="edu-section">
            <h3>💬 3 Preguntas Detonadoras para Conversar en Casa o en el Aula</h3>
            <div class="edu-prompts">
              ${EDUCATOR_GUIDE.discussionPrompts.map((p) => `<p class="edu-prompt">${escapeHTML(p)}</p>`).join('')}
            </div>
          </section>
        </div>

        <div class="educator-panel" id="edu-panel-telemetry" role="tabpanel" hidden>
          <div class="edu-telemetry-body" id="edu-telemetry-body"></div>
          <div class="edu-telemetry-actions">
            <button type="button" class="edu-export-btn" id="edu-export-json">
              ⬇ Exportar Telemetría JSON (COPPA Stateless)
            </button>
          </div>
        </div>
      </div>
    `;

    parent.appendChild(wrap);
    this.el = wrap;

    $('#edu-close-btn', wrap).addEventListener('click', () => this.close());
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap) this.close();
    });

    wrap.querySelectorAll('.educator-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        sfx.play('tap');
        const tab = btn.dataset.tab;
        wrap.querySelectorAll('.educator-tab').forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', String(active));
        });
        $('#edu-panel-guide', wrap).hidden = tab !== 'guide';
        $('#edu-panel-telemetry', wrap).hidden = tab !== 'telemetry';
        if (tab === 'telemetry') this.renderTelemetry();
      });
    });

    $('#edu-export-json', wrap).addEventListener('click', () => {
      sfx.play('tap');
      const blob = new Blob([telemetry.exportJSON()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `astro-learning-telemetry-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  renderTelemetry() {
    const sum = telemetry.summary();
    const labels = {
      calma: '🟢 ● Calma Solar (Producción)',
      claseM: '🟠 ▲ Llamarada Clase M (Escudo)',
      claseX: '🔴 ◆ Tormenta Clase X (Pared de Agua)',
    };
    const body = $('#edu-telemetry-body', this.el);
    body.innerHTML = `
      <div class="edu-kpis">
        <div class="edu-kpi"><span>Soles Jugados</span><strong>${sum.totalSols}</strong></div>
        <div class="edu-kpi"><span>Misiones Completadas</span><strong>${sum.missionsCompleted}</strong></div>
        <div class="edu-kpi"><span>Latencia Media Decisión</span><strong>${sum.avgLatencySec} s</strong></div>
        <div class="edu-kpi"><span>Drones Safe-to-Fail</span><strong>${sum.rescuesUsed}</strong></div>
      </div>

      <section class="edu-section">
        <h3>📉 Curva de Reducción de Errores por Concepto</h3>
        <div class="edu-concept-rows">
          ${sum.concepts
            .map(
              (c) => `
            <div class="edu-concept-row">
              <div class="edu-concept-row__head">
                <strong>${labels[c.id] || c.id}</strong>
                <span>${c.attempts} intentos · Reducción de error: <b>-${c.reduction}%</b></span>
              </div>
              <div class="edu-concept-row__bars">
                <span>1ª mitad: ${c.errFirst}% error</span>
                <span>2ª mitad: ${c.errLast}% error</span>
              </div>
            </div>`,
            )
            .join('')}
        </div>
      </section>

      <section class="edu-section">
        <h3>🏅 Dominio por Nivel sin Pistas Asistidas (Niveles 1 a 5)</h3>
        <div class="edu-levels-grid">
          ${sum.levels
            .map(
              (l) => `
            <div class="edu-level-chip">
              <span>Nivel ${l.level}</span>
              <strong>${l.masteryPct}%</strong>
              <small>${l.attempts} soles</small>
            </div>`,
            )
            .join('')}
        </div>
      </section>
    `;
  }

  open() {
    this.mount();
    sfx.play('tap');
    this.renderTelemetry();
    this.el.hidden = false;
  }

  close() {
    if (!this.el) return;
    sfx.play('tap');
    this.el.hidden = true;
  }
}

export const educatorModal = new EducatorModal();
