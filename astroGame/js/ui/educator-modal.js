/**
 * Modal de Guía Docente / Padres + Panel de Telemetría y Bitácora + Tabla de Fuentes
 * (Cumple Pasos 6, 7 y 8 de k12-edugame-web-architect).
 */
import { DESIGN_SOURCES, EDUCATOR_GUIDE, MEDALS } from '../config.js';
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
            <span class="educator-modal__tag">STEM · NGSS · NASA KIDS ARCHITECTURE · COPPA STATELESS</span>
            <h2 class="educator-modal__title" id="edu-modal-title">🎓 Guía Docente / Padres, Telemetría y Fuentes</h2>
          </div>
          <button type="button" class="hud-icon-btn educator-modal__close" id="edu-close-btn"
            aria-label="Cerrar Guía Docente">✕</button>
        </header>

        <div class="educator-tabs" role="tablist" aria-label="Secciones de la Guía Docente">
          <button type="button" class="educator-tab is-active" data-tab="guide" role="tab" aria-selected="true">
            📚 Guía y 3 Preguntas
          </button>
          <button type="button" class="educator-tab" data-tab="telemetry" role="tab" aria-selected="false">
            📈 Telemetría y Bitácora
          </button>
          <button type="button" class="educator-tab" data-tab="sources" role="tab" aria-selected="false">
            🏛️ Tabla de Fuentes (Paso 8)
          </button>
        </div>

        <!-- TAB 1: Guía Docente / Padres (Paso 6) -->
        <div class="educator-panel" id="edu-panel-guide" role="tabpanel">
          <section class="edu-section">
            <h3>🎯 Estándares Curriculares Trabajados (NGSS / STEM)</h3>
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
            <h3>🧠 Habilidades Cognitivas que Entrena el Módulo</h3>
            <ul class="edu-list">
              ${EDUCATOR_GUIDE.cognitiveSkills.map((c) => `<li>${escapeHTML(c)}</li>`).join('')}
            </ul>
          </section>

          <section class="edu-section">
            <h3>💬 3 Preguntas Detonadoras para Conversar Después de Jugar</h3>
            <div class="edu-prompts">
              ${EDUCATOR_GUIDE.discussionPrompts.map((p) => `<p class="edu-prompt">${escapeHTML(p)}</p>`).join('')}
            </div>
          </section>
        </div>

        <!-- TAB 2: Telemetría de Ganancia de Aprendizaje + Bitácora Docente (Paso 7) -->
        <div class="educator-panel" id="edu-panel-telemetry" role="tabpanel" hidden>
          <div class="edu-telemetry-body" id="edu-telemetry-body"></div>
          <div class="edu-telemetry-actions">
            <button type="button" class="edu-export-btn" id="edu-export-json"
              aria-label="Exportar Telemetría y Bitácora en formato JSON (COPPA Stateless)">
              ⬇ Exportar Telemetría y Bitácora JSON (COPPA Stateless)
            </button>
          </div>
        </div>

        <!-- TAB 3: Justificación de Decisiones con Fuente en Tabla de 3 Columnas (Paso 8) -->
        <div class="educator-panel" id="edu-panel-sources" role="tabpanel" hidden>
          <section class="edu-section">
            <h3>🏛️ Justificación Científica, Pedagógica y Técnica (Paso 8)</h3>
            <p class="edu-note">
              Cada mecánica, pauta de diseño o cifra registra su fuente verificada con URL. Las referencias sin fuente primaria verificada aún (como la inspiración <em>Astro-Matic</em>) se marcan explícitamente como <strong>Pendiente</strong>.
            </p>
            <div class="edu-table-wrap">
              <table class="edu-sources-table" aria-label="Tabla de tres columnas: decisión, fuente y URL">
                <thead>
                  <tr>
                    <th scope="col">Decisión</th>
                    <th scope="col">Fuente</th>
                    <th scope="col">URL</th>
                  </tr>
                </thead>
                <tbody>
                  ${DESIGN_SOURCES.map((row) => {
                    const isUrl = row.url.startsWith('http');
                    return `
                      <tr>
                        <td>${escapeHTML(row.decision)}</td>
                        <td>${escapeHTML(row.fuente)}</td>
                        <td>${
                          isUrl
                            ? `<a href="${escapeHTML(row.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(row.url)}</a>`
                            : `<span class="edu-pending-badge">⏳ ${escapeHTML(row.url)}</span>`
                        }</td>
                      </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </section>
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
        $('#edu-panel-sources', wrap).hidden = tab !== 'sources';
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

    const medalsHTML = MEDALS.map((m) => {
      const unlocked = sum.medals.includes(m.id);
      return `
        <div class="edu-medal-chip ${unlocked ? 'is-unlocked' : 'is-locked'}">
          <span class="edu-medal-chip__icon">${m.icon}</span>
          <div>
            <strong>${escapeHTML(m.title)}</strong>
            <small>${unlocked ? '✅ Desbloqueada (localStorage)' : '🔒 Pendiente'}</small>
          </div>
        </div>`;
    }).join('');

    const bitacoraHTML = sum.bitacora.length
      ? sum.bitacora
          .slice(0, 20)
          .map((entry) => {
            const isUrl = String(entry.url || '').startsWith('http');
            return `
              <article class="edu-log-entry">
                <div class="edu-log-entry__head">
                  <strong>${escapeHTML(entry.reto || 'Evento de telemetría')}</strong>
                  <small>${escapeHTML(entry.accion || '')}</small>
                </div>
                <p class="edu-log-entry__decision"><b>Decisión:</b> ${escapeHTML(entry.decision || '')}</p>
                <p class="edu-log-entry__source">
                  <b>Fuente:</b> ${escapeHTML(entry.fuente || '')} ·
                  ${
                    isUrl
                      ? `<a href="${escapeHTML(entry.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(entry.url)}</a>`
                      : `<span class="edu-pending-badge">${escapeHTML(entry.url || 'Pendiente')}</span>`
                  }
                </p>
              </article>`;
          })
          .join('')
      : `<p class="edu-empty-log">Juega al menos un Día (Sol) o ajusta variables en el Laboratorio 🔬 para ver las entradas de bitácora con su decisión y fuente.</p>`;

    body.innerHTML = `
      <div class="edu-kpis">
        <div class="edu-kpi"><span>Soles Jugados</span><strong>${sum.totalSols}</strong></div>
        <div class="edu-kpi"><span>Misiones Completadas</span><strong>${sum.missionsCompleted}</strong></div>
        <div class="edu-kpi"><span>Latencia Acción Correcta</span><strong>${sum.avgLatencySec} s</strong></div>
        <div class="edu-kpi"><span>Drones Safe-to-Fail</span><strong>${sum.rescuesUsed}</strong></div>
      </div>

      <section class="edu-section">
        <h3>🏅 Medallas Guardadas Localmente (COPPA Stateless)</h3>
        <div class="edu-medals-grid">${medalsHTML}</div>
      </section>

      <section class="edu-section">
        <h3>📉 Curva de Reducción de Errores por Concepto (1ª Ronda vs. Posteriores)</h3>
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
                <span>1ª ronda/mitad: ${c.errFirst}% error</span>
                <span>Rondas posteriores: ${c.errLast}% error</span>
              </div>
            </div>`,
            )
            .join('')}
        </div>
      </section>

      <section class="edu-section">
        <h3>🎯 Dominio por Nivel sin Pistas Asistidas (Niveles 1 a 5)</h3>
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

      <section class="edu-section">
        <h3>📓 Bitácora Docente de Telemetría (Evento + Decisión + Fuente)</h3>
        <div class="edu-log-list">${bitacoraHTML}</div>
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
