/**
 * Vista 1 — Pantalla de Inicio / Selección de Comandante (Mockup 1).
 * Integra los Pilares de k12-edugame-web-architect:
 *  - Cuadrante superior izquierdo: Branding "ASTRO" + subtítulo amigable
 *  - Esquina superior derecha: Controles de Audio en 3 Capas independientes (BGM, SFX, TTS)
 *    + Botón explícito "🎓 Guía Docente / Padres" (Todos con Hitbox >= 64x64 px)
 *  - Centro: Indicativo / Apodo espacial anónimo (COPPA Stateless, cero nombres reales ni cuentas),
 *    carrusel de comandante, Selector de Modo de Edad (7–9 años vs. 10–12 años) +
 *    Andamiaje por Habilidad (Niveles 1 a 5 dentro de cada modo, Zona de Desarrollo Próximo),
 *    medallas guardadas en localStorage y botón "Start" con presión física.
 */
import { AGE_MODES, COMMANDERS, MEDALS, SKILL_LEVELS, STORAGE_KEYS } from '../config.js';
import { $, $$, animate, escapeHTML, haptic, storage } from '../util.js';
import { astronautSVG } from '../art/astronaut.js';
import { startBackdropSVG } from '../art/backdrops.js';
import { sfx } from '../audio.js';
import { educatorModal } from './educator-modal.js';
import { telemetry } from '../telemetry.js';

const SAFE_CALLSIGNS = [
  'Astro-7',
  'Cometa-3',
  'Artemis-9',
  'Quásar-5',
  'Supernova-1',
  'Apolo-11',
  'Nebulosa-8',
  'Púlsar-4',
];

export class StartView {
  /** @param {{ root: HTMLElement, onStart: (payload:{commander:object, name:string, ageMode:string, skillLevel:number})=>void }} opts */
  constructor({ root, onStart }) {
    this.root = root;
    this.onStart = onStart;
    const savedId = storage.get(STORAGE_KEYS.commander, COMMANDERS[0].id);
    this.index = Math.max(0, COMMANDERS.findIndex((c) => c.id === savedId));
    this.savedName = storage.get(STORAGE_KEYS.name, '');
    const savedMode = storage.get(STORAGE_KEYS.ageMode, '10-12');
    this.ageMode = AGE_MODES[savedMode] ? savedMode : '10-12';
    this.skillLevel = Number(storage.get(STORAGE_KEYS.skillLevel, 3)) || 3;
    this.best = storage.get(STORAGE_KEYS.best, null);
  }

  mount() {
    this.root.innerHTML = `
      <div class="start-backdrop" aria-hidden="true">${startBackdropSVG()}</div>

      <header class="start-brand" aria-label="ASTRO - Your little big commander">
        <span class="start-brand__badge">NASA STEM · COPPA STATELESS</span>
        <h1 class="start-brand__title">ASTRO</h1>
        <p class="start-brand__subtitle">¡Tu pequeño gran comandante!</p>
      </header>

      <!-- Barra superior de Accesibilidad Multimodal (Audio 3 Capas + Guía Docente / Padres) -->
      <nav class="top-utility-bar" aria-label="Controles de audio en 3 capas, voz y guía docente">
        <button type="button" class="hud-icon-btn hud-icon-btn--bgm" id="start-bgm-btn"
          aria-label="Activar o silenciar música de fondo (BGM)" title="Música de fondo (BGM)">
          <span id="start-bgm-icon">🎵</span>
        </button>
        <button type="button" class="hud-icon-btn" id="start-sound-btn"
          aria-label="Activar o silenciar efectos de sonido (SFX)" title="Efectos de sonido (SFX)">
          <span id="start-sound-icon">🔊</span>
        </button>
        <button type="button" class="hud-icon-btn" id="start-tts-btn"
          aria-label="Activar o desactivar lectura en voz alta (TTS)" title="Lectura en voz alta (TTS)">
          <span id="start-tts-icon">🗣️</span>
        </button>
        <button type="button" class="hud-pill-btn glass-pill hud-icon-btn--edu" id="start-edu-btn"
          aria-label="Abrir Guía Docente y para Padres" title="Guía Docente / Padres">
          <span aria-hidden="true">🎓</span>
          <span class="hud-pill-btn__text">Guía Docente / Padres</span>
        </button>
      </nav>

      <main class="start-stage" aria-label="Selección de comandante, modo de edad y nivel">
        <form class="commander-selector" id="commander-form" novalidate>
          <div class="name-field-wrap">
            <label class="sr-only" for="commander-name">Indicativo o apodo espacial (COPPA Stateless: no ingreses tu nombre real ni correo)</label>
            <div class="callsign-row">
              <input
                id="commander-name"
                class="name-input glass-pill"
                type="text"
                name="commanderName"
                maxlength="16"
                autocomplete="off"
                spellcheck="false"
                aria-label="Indicativo o apodo espacial anónimo (sin nombre real)"
                placeholder="🛰️ Apodo espacial (ej. Astro-7)"
                value="${escapeHTML(this.savedName)}"
              />
              <button type="button" class="callsign-dice-btn glass-pill" id="random-callsign-btn"
                aria-label="Generar apodo espacial aleatorio seguro (COPPA)" title="Apodo espacial aleatorio">
                🎲
              </button>
            </div>
          </div>

          <div class="selector-carousel">
            <button type="button" class="nav-btn nav-btn--prev glass-surface" id="prev-commander"
              aria-label="Comandante anterior">
              <span class="nav-btn__chevron" aria-hidden="true">◀</span>
            </button>

            <div class="avatar-frame glass-card" id="avatar-frame" tabindex="0"
              role="region" aria-live="polite" aria-label="Vista previa del comandante espacial">
              <div class="avatar-frame__glow" id="avatar-glow"></div>
              <div class="avatar-frame__grid" aria-hidden="true"></div>
              <div class="avatar-frame__stage" id="avatar-stage"></div>
              <div class="avatar-frame__meta">
                <div class="avatar-frame__identity">
                  <span class="avatar-frame__name" id="avatar-name"></span>
                  <span class="avatar-frame__trait" id="avatar-trait"></span>
                </div>
                <div class="avatar-dots" id="avatar-dots" aria-hidden="true"></div>
              </div>
            </div>

            <button type="button" class="nav-btn nav-btn--next glass-surface" id="next-commander"
              aria-label="Siguiente comandante">
              <span class="nav-btn__chevron" aria-hidden="true">▶</span>
            </button>
          </div>

          <!-- Selector de Modo de Edad (7-9 años vs 10-12 años) + Niveles 1 a 5 (Paso 2 y Paso 3) -->
          <div class="scaffolding-panel glass-card" role="group" aria-label="Configuración de modo de edad y nivel de dificultad">
            <div class="age-mode-selector" role="radiogroup" aria-label="Modo de edad (fija carga cognitiva e interacción)">
              ${Object.values(AGE_MODES)
                .map(
                  (m) => `
                  <button type="button"
                    class="age-mode-btn ${m.id === this.ageMode ? 'is-active' : ''}"
                    data-age-mode="${m.id}"
                    role="radio"
                    aria-checked="${m.id === this.ageMode}"
                    aria-label="Modo ${m.label}: ${m.desc}">
                    <span class="age-mode-btn__title">${m.badge}</span>
                  </button>`,
                )
                .join('')}
            </div>

            <div class="skill-selector" role="radiogroup" aria-label="Nivel de habilidad del 1 al 5 (Zona de Desarrollo Próximo)">
              <div class="skill-selector__pills" id="skill-pills">
                ${SKILL_LEVELS.map(
                  (l) => `
                  <button type="button"
                    class="skill-pill ${l.level === this.skillLevel ? 'is-active' : ''}"
                    data-level="${l.level}"
                    role="radio"
                    aria-checked="${l.level === this.skillLevel}"
                    aria-label="Nivel ${l.level}: ${l.kid} (${l.title})"
                    title="${l.title}">
                    <span class="skill-pill__emoji" aria-hidden="true">${l.emoji}</span>
                    <span class="skill-pill__num">N${l.level}</span>
                  </button>`,
                ).join('')}
              </div>
              <span class="skill-selector__desc" id="skill-desc"></span>
            </div>
          </div>

          <div class="start-cta-wrap">
            <button type="submit" class="start-btn" id="start-btn" aria-label="¡Jugar! Iniciar misión espacial">
              <span class="start-btn__shine" aria-hidden="true"></span>
              <span class="start-btn__label">¡JUGAR! 🚀</span>
            </button>
            <p class="start-best" id="start-best-line" aria-live="polite"></p>
          </div>
        </form>
      </main>
    `;

    this.stageEl = $('#avatar-stage', this.root);
    this.glowEl = $('#avatar-glow', this.root);
    this.nameEl = $('#avatar-name', this.root);
    this.traitEl = $('#avatar-trait', this.root);
    this.dotsEl = $('#avatar-dots', this.root);
    this.inputEl = $('#commander-name', this.root);
    this.frameEl = $('#avatar-frame', this.root);

    this.renderDots();
    this.renderCommander(0);
    this.renderAgeMode();
    this.renderSkillLevel();
    this.refreshBest();
    this.syncAudioButtons();
    this.bindEvents();
  }

  renderDots() {
    this.dotsEl.innerHTML = COMMANDERS.map(
      (_, i) => `<span class="avatar-dot ${i === this.index ? 'is-active' : ''}"></span>`,
    ).join('');
  }

  renderCommander(dir = 0) {
    const c = COMMANDERS[this.index];
    this.stageEl.innerHTML = astronautSVG(c, { label: `Comandante ${c.name}, ${c.trait}` });
    this.nameEl.textContent = c.name;
    this.traitEl.textContent = c.trait;
    this.frameEl.style.setProperty('--cmd-accent', c.accent);
    this.frameEl.style.setProperty('--cmd-visor', c.visor);
    this.glowEl.style.background = `radial-gradient(circle, ${c.accent}55 0%, ${c.visor}22 48%, transparent 72%)`;

    [...this.dotsEl.children].forEach((dot, i) => {
      dot.classList.toggle('is-active', i === this.index);
    });

    if (dir !== 0) {
      animate(
        this.stageEl,
        [
          { opacity: 0, transform: `translateX(${dir * 26}px) scale(0.92)` },
          { opacity: 1, transform: 'translateX(0) scale(1)' },
        ],
        { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      );
      sfx.speak(`${c.name}, ${c.trait}`);
    }
    storage.set(STORAGE_KEYS.commander, c.id);
  }

  renderAgeMode() {
    const mode = AGE_MODES[this.ageMode] ?? AGE_MODES['10-12'];
    $$('.age-mode-btn', this.root).forEach((btn) => {
      const active = btn.dataset.ageMode === mode.id;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-checked', String(active));
    });
    storage.set(STORAGE_KEYS.ageMode, mode.id);
    this.updateScaffoldingSummary();
  }

  renderSkillLevel() {
    const cfg = SKILL_LEVELS.find((l) => l.level === this.skillLevel) ?? SKILL_LEVELS[2];
    $$('.skill-pill', this.root).forEach((btn) => {
      const active = Number(btn.dataset.level) === cfg.level;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-checked', String(active));
    });
    storage.set(STORAGE_KEYS.skillLevel, cfg.level);
    this.updateScaffoldingSummary();
  }

  updateScaffoldingSummary() {
    const mode = AGE_MODES[this.ageMode] ?? AGE_MODES['10-12'];
    const cfg = SKILL_LEVELS.find((l) => l.level === this.skillLevel) ?? SKILL_LEVELS[2];
    const descEl = $('#skill-desc', this.root);
    if (descEl) {
      descEl.textContent = `${mode.short} (${mode.maxModules} módulos) · ${cfg.emoji} Nivel ${cfg.level}: ${cfg.kid}`;
    }
  }

  step(delta) {
    sfx.unlock();
    sfx.play('tap');
    haptic(6);
    this.index = (this.index + delta + COMMANDERS.length) % COMMANDERS.length;
    this.renderCommander(delta);
  }

  syncAudioButtons() {
    const bgmMuted = sfx.isBGMMuted();
    const sfxMuted = sfx.isSFXMuted();
    const ttsOn = sfx.isTTSEnabled();

    const bgmBtn = $('#start-bgm-btn', this.root);
    const sfxBtn = $('#start-sound-btn', this.root);
    const ttsBtn = $('#start-tts-btn', this.root);

    if (bgmBtn) {
      $('#start-bgm-icon', this.root).textContent = bgmMuted ? '🔕' : '🎵';
      bgmBtn.setAttribute('aria-pressed', String(!bgmMuted));
      bgmBtn.classList.toggle('is-off', bgmMuted);
    }
    if (sfxBtn) {
      $('#start-sound-icon', this.root).textContent = sfxMuted ? '🔇' : '🔊';
      sfxBtn.setAttribute('aria-pressed', String(!sfxMuted));
      sfxBtn.classList.toggle('is-off', sfxMuted);
    }
    if (ttsBtn) {
      $('#start-tts-icon', this.root).textContent = ttsOn ? '🗣️' : '💬';
      ttsBtn.setAttribute('aria-pressed', String(ttsOn));
      ttsBtn.classList.toggle('is-on', ttsOn);
    }
  }

  syncSoundIcon() {
    this.syncAudioButtons();
  }

  bindEvents() {
    $('#prev-commander', this.root).addEventListener('click', () => this.step(-1));
    $('#next-commander', this.root).addEventListener('click', () => this.step(1));

    // Generador de apodo espacial anónimo (COPPA Stateless)
    $('#random-callsign-btn', this.root).addEventListener('click', () => {
      sfx.unlock();
      sfx.play('tap');
      const pick = SAFE_CALLSIGNS[Math.floor(Math.random() * SAFE_CALLSIGNS.length)];
      this.inputEl.value = pick;
      storage.set(STORAGE_KEYS.name, pick);
      sfx.speak(`Indicativo ${pick}`);
    });

    // Affordance sonoro < 100 ms al pasar el cursor sobre controles
    $$('button', this.root).forEach((btn) => {
      btn.addEventListener('pointerenter', () => sfx.play('hover'));
    });

    // Selector de Modo de Edad (7-9 vs 10-12 años)
    $$('.age-mode-btn', this.root).forEach((btn) => {
      btn.addEventListener('click', () => {
        sfx.unlock();
        sfx.play('tap');
        this.ageMode = btn.dataset.ageMode;
        this.renderAgeMode();
        const mode = AGE_MODES[this.ageMode];
        if (mode) sfx.speak(`Modo ${mode.label}. ${mode.maxModules} módulos en pantalla.`);
      });
    });

    $('#skill-pills', this.root).addEventListener('click', (e) => {
      const btn = e.target.closest('[data-level]');
      if (!btn) return;
      sfx.unlock();
      sfx.play('tap');
      this.skillLevel = Number(btn.dataset.level);
      this.renderSkillLevel();
      const cfg = SKILL_LEVELS.find((l) => l.level === this.skillLevel);
      if (cfg) sfx.speak(`Nivel ${cfg.level}. ${cfg.kid}`);
    });

    // Audio 3 Capas + Guía Docente
    $('#start-bgm-btn', this.root).addEventListener('click', () => {
      sfx.unlock();
      sfx.setBGMMuted(!sfx.isBGMMuted());
      this.syncAudioButtons();
      sfx.play('tap');
    });

    $('#start-sound-btn', this.root).addEventListener('click', () => {
      sfx.unlock();
      sfx.setSFXMuted(!sfx.isSFXMuted());
      this.syncAudioButtons();
      if (!sfx.isSFXMuted()) sfx.play('tap');
    });

    $('#start-tts-btn', this.root).addEventListener('click', () => {
      sfx.unlock();
      sfx.setTTSEnabled(!sfx.isTTSEnabled());
      this.syncAudioButtons();
      sfx.play('tap');
      if (sfx.isTTSEnabled()) {
        sfx.speak('Voz activada. Elige tu modo de edad, nivel y toca Jugar.');
      }
    });

    $('#start-edu-btn', this.root).addEventListener('click', () => {
      sfx.unlock();
      educatorModal.open();
    });

    // Swipe táctil sobre el marco central
    let startX = null;
    this.frameEl.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    this.frameEl.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 36) this.step(dx < 0 ? 1 : -1);
    });

    window.addEventListener('keydown', (e) => {
      if (this.root.hidden) return;
      if (document.activeElement === this.inputEl && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.step(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); this.step(1); }
    });

    $('#commander-form', this.root).addEventListener('submit', (e) => {
      e.preventDefault();
      sfx.unlock();
      sfx.play('go');
      haptic([10, 30, 14]);
      const commander = COMMANDERS[this.index];
      const rawName = this.inputEl.value.trim();
      const name = rawName || commander.name;
      storage.set(STORAGE_KEYS.name, rawName);
      storage.set(STORAGE_KEYS.commander, commander.id);
      storage.set(STORAGE_KEYS.ageMode, this.ageMode);
      storage.set(STORAGE_KEYS.skillLevel, this.skillLevel);
      this.onStart?.({ commander, name, ageMode: this.ageMode, skillLevel: this.skillLevel });
    });
  }

  refreshBest() {
    this.best = storage.get(STORAGE_KEYS.best, null);
    const unlocked = telemetry.getUnlockedMedals();
    const medalIcons = MEDALS
      .filter((m) => unlocked.includes(m.id))
      .map((m) => m.icon)
      .join(' ');
    const el = $('#start-best-line', this.root);
    if (!el) return;
    if (this.best) {
      el.textContent = `🏆 Récord: ${'⭐'.repeat(this.best.stars)} en ${this.best.sols} días${medalIcons ? ` · Medallas: ${medalIcons}` : ''}`;
    } else if (medalIcons) {
      el.textContent = `🏅 Medallas en localStorage: ${medalIcons}`;
    } else {
      el.textContent = '☀️ ¡Protege tu estación lunar del Sol! (100% privado en tu navegador)';
    }
  }
}
