/**
 * Vista 1 — Pantalla de Inicio / Selección de Comandante (Mockup 1).
 * Integra los 6 Pilares de k12-edugame-web-architect:
 *  - Cuadrante superior izquierdo: Branding "ASTRO" inclinado + "Your little big commander"
 *  - Esquina superior derecha: Controles de Audio en 3 Capas (BGM, SFX, TTS) + Guía Docente
 *  - Centro: Selector con campo "your name" (COPPA Stateless), marco central del comandante,
 *    botones `< Button` y `Button >` (Hitbox >= 64x64 px), Andamiaje por Habilidad (Niveles 1 a 5)
 *    y botón inferior "Start" con presión física.
 */
import { COMMANDERS, SKILL_LEVELS, STORAGE_KEYS } from '../config.js';
import { $, $$, animate, escapeHTML, haptic, storage } from '../util.js';
import { astronautSVG } from '../art/astronaut.js';
import { startBackdropSVG } from '../art/backdrops.js';
import { sfx } from '../audio.js';
import { educatorModal } from './educator-modal.js';

export class StartView {
  /** @param {{ root: HTMLElement, onStart: (payload:{commander:object, name:string, skillLevel:number})=>void }} opts */
  constructor({ root, onStart }) {
    this.root = root;
    this.onStart = onStart;
    const savedId = storage.get(STORAGE_KEYS.commander, COMMANDERS[0].id);
    this.index = Math.max(0, COMMANDERS.findIndex((c) => c.id === savedId));
    this.savedName = storage.get(STORAGE_KEYS.name, '');
    this.skillLevel = Number(storage.get(STORAGE_KEYS.skillLevel, 3)) || 3;
    this.best = storage.get(STORAGE_KEYS.best, null);
  }

  mount() {
    this.root.innerHTML = `
      <div class="start-backdrop" aria-hidden="true">${startBackdropSVG()}</div>

      <header class="start-brand" aria-label="ASTRO - Your little big commander">
        <h1 class="start-brand__title">ASTRO</h1>
        <p class="start-brand__subtitle">¡Tu pequeño gran comandante!</p>
      </header>

      <!-- Barra superior de Accesibilidad Multimodal (Audio 3 Capas + Guía Docente) -->
      <nav class="top-utility-bar" aria-label="Controles de audio, voz y guía docente">
        <button type="button" class="hud-icon-btn" id="start-bgm-btn"
          aria-label="Activar o silenciar música de fondo" title="Música">
          <span id="start-bgm-icon">🎵</span>
        </button>
        <button type="button" class="hud-icon-btn" id="start-sound-btn"
          aria-label="Activar o silenciar efectos de sonido" title="Sonidos">
          <span id="start-sound-icon">🔊</span>
        </button>
        <button type="button" class="hud-icon-btn" id="start-tts-btn"
          aria-label="Activar o desactivar lectura en voz alta" title="Voz">
          <span id="start-tts-icon">🗣️</span>
        </button>
        <button type="button" class="hud-icon-btn hud-icon-btn--edu" id="start-edu-btn"
          aria-label="Abrir Guía Docente y para Padres" title="Guía para adultos">
          <span aria-hidden="true">🎓</span>
        </button>
      </nav>

      <main class="start-stage" aria-label="Selección de comandante">
        <form class="commander-selector" id="commander-form" novalidate>
          <div class="name-field-wrap">
            <label class="sr-only" for="commander-name">Tu apodo de comandante (sin datos personales)</label>
            <input
              id="commander-name"
              class="name-input glass-pill"
              type="text"
              name="commanderName"
              maxlength="18"
              autocomplete="off"
              spellcheck="false"
              placeholder="✏️ Tu apodo"
              value="${escapeHTML(this.savedName)}"
            />
          </div>

          <div class="selector-carousel">
            <button type="button" class="nav-btn nav-btn--prev glass-surface" id="prev-commander"
              aria-label="Comandante anterior">
              <span class="nav-btn__chevron" aria-hidden="true">◀</span>
            </button>

            <div class="avatar-frame glass-card" id="avatar-frame" tabindex="0"
              role="region" aria-live="polite" aria-label="Vista previa del comandante">
              <div class="avatar-frame__glow" id="avatar-glow"></div>
              <div class="avatar-frame__grid" aria-hidden="true"></div>
              <div class="avatar-frame__stage" id="avatar-stage"></div>
              <div class="avatar-frame__meta">
                <div class="avatar-frame__identity">
                  <span class="avatar-frame__name" id="avatar-name"></span>
                  <span class="avatar-frame__trait" id="avatar-trait"></span>
                </div>
                <div class="avatar-dots" id="avatar-dots" role="tablist" aria-label="Comandantes"></div>
              </div>
            </div>

            <button type="button" class="nav-btn nav-btn--next glass-surface" id="next-commander"
              aria-label="Siguiente comandante">
              <span class="nav-btn__chevron" aria-hidden="true">▶</span>
            </button>
          </div>

          <!-- Andamiaje por Habilidad (Niveles 1 a 5 — sin etiquetas rígidas de edad) -->
          <div class="skill-selector glass-pill" role="radiogroup" aria-label="Nivel de habilidad (1 a 5)">
            <div class="skill-selector__pills" id="skill-pills">
              ${SKILL_LEVELS.map(
                (l) => `
                <button type="button"
                  class="skill-pill ${l.level === this.skillLevel ? 'is-active' : ''}"
                  data-level="${l.level}"
                  role="radio"
                  aria-checked="${l.level === this.skillLevel}"
                  aria-label="Nivel ${l.level}: ${l.kid}"
                  title="${l.title}">
                  <span class="skill-pill__emoji" aria-hidden="true">${l.emoji}</span>
                  <span class="skill-pill__num">${l.level}</span>
                </button>`,
              ).join('')}
            </div>
            <span class="skill-selector__desc" id="skill-desc"></span>
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
    this.renderSkillLevel();
    this.refreshBest();
    this.syncAudioButtons();
    this.bindEvents();
  }

  renderDots() {
    this.dotsEl.innerHTML = COMMANDERS.map(
      (c, i) => `<button type="button" class="avatar-dot" data-idx="${i}" role="tab"
        aria-label="${c.name} (${c.trait})" aria-selected="${i === this.index}"></button>`,
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
      dot.setAttribute('aria-selected', String(i === this.index));
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

  renderSkillLevel() {
    const cfg = SKILL_LEVELS.find((l) => l.level === this.skillLevel) ?? SKILL_LEVELS[2];
    $$('.skill-pill', this.root).forEach((btn) => {
      const active = Number(btn.dataset.level) === cfg.level;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-checked', String(active));
    });
    $('#skill-desc', this.root).textContent = `${cfg.emoji} Nivel ${cfg.level} · ${cfg.kid}`;
    storage.set(STORAGE_KEYS.skillLevel, cfg.level);
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

    // Affordance sonoro < 100 ms al pasar el cursor sobre controles
    $$('button', this.root).forEach((btn) => {
      btn.addEventListener('pointerenter', () => sfx.play('hover'));
    });

    this.dotsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-idx]');
      if (!btn) return;
      const idx = Number(btn.dataset.idx);
      if (idx === this.index) return;
      const dir = idx > this.index ? 1 : -1;
      this.index = idx;
      sfx.unlock();
      sfx.play('tap');
      this.renderCommander(dir);
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
        sfx.speak('Voz activada. Elige tu comandante y toca Jugar.');
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
      this.onStart?.({ commander, name, skillLevel: this.skillLevel });
    });
  }

  refreshBest() {
    this.best = storage.get(STORAGE_KEYS.best, null);
    const el = $('#start-best-line', this.root);
    if (!el) return;
    if (this.best) {
      el.textContent = `🏆 Récord: ${'⭐'.repeat(this.best.stars)} en ${this.best.sols} días`;
    } else {
      el.textContent = '☀️ ¡Protege tu estación del Sol!';
    }
  }
}
