/**
 * Vista 2 — Escenario Principal de la Estación Espacial (Mockup 2 - Interfaz Diegética).
 *  - Red completa de tuberías y túneles presurizados que conectan Agua, Comida,
 *    Escudos y Oxígeno a través de válvulas y un Nodo Central de Intercambio.
 *  - 5 astronautas que se desplazan con movimientos naturales a lo largo de las
 *    tuberías hacia las plataformas de acoplamiento sin tapar jamás el texto.
 *  - Micro-interacción táctil sutil (estilo Apple HIG) al tocar cada módulo.
 */
import { MISSION, MODULE_IDS, MODULES, STORAGE_KEYS } from '../config.js';
import { $, $$, animate, clamp, haptic, storage, toneFor, wait } from '../util.js';
import { stationBackdropSVG } from '../art/backdrops.js';
import { BOLT_SVG, MODULE_ART, WRENCH_SVG } from '../art/modules.js';
import { CrewLayer } from './crew.js';
import { StormFX } from './fx.js';
import { sfx } from '../audio.js';
import { educatorModal } from './educator-modal.js';
import { predict } from '../ml-bridge.js';
import { telemetry } from '../telemetry.js';

export class StationView {
  /** @param {{ root: HTMLElement, game: import('../engine.js').Game, onExit: ()=>void }} opts */
  constructor({ root, game, onExit }) {
    this.root = root;
    this.game = game;
    this.onExit = onExit;
    this.modEls = {};
    this.crewLayer = null;
    this.stormFX = null;
    this.resizeObs = null;
    this.highCeilingOpen = false;
  }

  mount() {
    this.root.innerHTML = `
      <div class="station-backdrop" aria-hidden="true">${stationBackdropSVG()}</div>

      <!-- Cielo y Sol (clima espacial NASA DONKI) -->
      <div class="space-sky" id="space-sky" data-event="calma" aria-hidden="true">
        <div class="solar-orb" id="solar-orb">
          <div class="solar-orb__corona"></div>
          <div class="solar-orb__core"></div>
        </div>
      </div>

      <!-- Canvas de partículas solares SEP (Retina) -->
      <canvas class="storm-canvas" id="storm-canvas" aria-hidden="true"></canvas>

      <!-- HUD Superior (Apple HIG Glassmorphism + Audio 3 Capas + Guía Docente) -->
      <header class="station-hud" aria-label="Estado de la misión">
        <div class="hud-cluster hud-cluster--left glass-pill">
          <button type="button" class="hud-home-btn" id="hud-home-btn"
            aria-label="Volver al inicio" title="Inicio">
            <span aria-hidden="true">🏠</span>
          </button>
          <div class="hud-commander">
            <span class="hud-commander__sol" id="hud-sol">☀️ Día 1/${MISSION.maxSols}</span>
            <span class="hud-commander__name" id="hud-name">Comandante</span>
          </div>
          <div class="vitals-chips" aria-label="Estado del equipo y las plantas">
            <span class="vital-chip" id="chip-crew" title="Energía del equipo" aria-label="Energía del equipo">👩‍🚀 <b id="val-crew">100%</b></span>
            <span class="vital-chip" id="chip-crops" title="Salud de las plantas" aria-label="Salud de las plantas">🌱 <b id="val-crops">75%</b></span>
          </div>
        </div>

        <!-- Señal visual de Clima Espacial (con icono geométrico para daltonismo) -->
        <div class="weather-banner glass-pill" id="weather-banner" role="status" aria-live="polite">
          <span class="weather-banner__signal" id="weather-signal" aria-hidden="true">😎</span>
          <div class="weather-banner__copy">
            <strong class="weather-banner__title" id="weather-title">Sol tranquilo</strong>
            <span class="weather-banner__tip" id="weather-tip">Toca 🌱 y 🫧</span>
          </div>
        </div>

        <div class="hud-cluster hud-cluster--right glass-pill">
          <button type="button" class="hud-icon-btn" id="station-lab-btn" hidden
            aria-label="Abrir laboratorio científico" aria-expanded="false" title="Laboratorio">
            <span aria-hidden="true">🔬</span>
          </button>
          <button type="button" class="hud-icon-btn hud-icon-btn--bgm" id="station-bgm-btn"
            aria-label="Activar o silenciar música de fondo" title="Música">
            <span id="station-bgm-icon">🎵</span>
          </button>
          <button type="button" class="hud-icon-btn" id="station-sound-btn"
            aria-label="Activar o silenciar efectos de sonido" title="Sonidos">
            <span id="station-sound-icon">🔊</span>
          </button>
          <button type="button" class="hud-icon-btn" id="station-tts-btn"
            aria-label="Activar o desactivar lectura en voz alta" title="Voz">
            <span id="station-tts-icon">🗣️</span>
          </button>
          <button type="button" class="hud-icon-btn hud-icon-btn--edu" id="station-edu-btn"
            aria-label="Abrir Guía Docente y Telemetría de Aprendizaje" title="Guía para adultos">
            <span aria-hidden="true">🎓</span>
          </button>
        </div>
      </header>

      <!-- Panel Desplegable de Techo Alto (High Ceiling + Sandbox Astro-Matic bajo demanda) -->
      <aside class="high-ceiling-drawer glass-card" id="high-ceiling-drawer" hidden
        aria-label="Laboratorio científico">
        <div class="hc-header">
          <strong>🔬 Laboratorio</strong>
          <button type="button" class="hc-close-btn" id="hc-close-btn" aria-label="Cerrar laboratorio">✕</button>
        </div>
        <div class="hc-sandbox">
          <span class="hc-sandbox__label">Elige el clima:</span>
          <div class="hc-weather-btns" id="hc-weather-btns">
            <button type="button" class="hc-weather-btn" data-event="calma">😎 Calma<small>0.8 mSv</small></button>
            <button type="button" class="hc-weather-btn" data-event="claseM">🔥 Clase M<small>16 mSv</small></button>
            <button type="button" class="hc-weather-btn" data-event="claseX">🌪️ Clase X<small>50 mSv</small></button>
          </div>
        </div>
        <div class="hc-metrics" id="hc-metrics">
          <div class="hc-metric"><span>🛡️ Escudo</span><strong id="hc-val-shield">Nivel 1</strong></div>
          <div class="hc-metric"><span>💡 Luz</span><strong id="hc-val-light">35%</strong></div>
          <div class="hc-metric"><span>🧬 Daño</span><strong id="hc-val-damage">—</strong></div>
          <div class="hc-metric"><span>👩‍🚀 Energía</span><strong id="hc-val-eff">—</strong></div>
          <div class="hc-metric"><span>🌱 Plantas</span><strong id="hc-val-crops">—</strong></div>
        </div>
      </aside>

      <!-- Escenario Diegético de la Estación Espacial (Mockup 2) -->
      <main class="station-stage" id="station-stage" aria-label="Estación espacial interactiva">
        <div class="station-board" id="station-board">

          <!-- Red de Conductos Lunares Presurizados entre las 4 bases (viewBox 1200x720) -->
          <svg class="station-architecture" viewBox="0 0 1200 720" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="tube-glass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#5B78D6" stop-opacity=".55"/>
                <stop offset=".5" stop-color="#141E46" stop-opacity=".88"/>
                <stop offset="1" stop-color="#3C56B0" stop-opacity=".62"/>
              </linearGradient>
              <linearGradient id="water-flow-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#5AC8FA"/>
                <stop offset=".5" stop-color="#C2F5FF"/>
                <stop offset="1" stop-color="#0A84FF"/>
              </linearGradient>
              <linearGradient id="bio-flow-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#30D158"/>
                <stop offset="1" stop-color="#64D2FF"/>
              </linearGradient>
              <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0" stop-color="#64D2FF" stop-opacity=".55"/>
                <stop offset="1" stop-color="#0A84FF" stop-opacity="0"/>
              </radialGradient>
            </defs>

            <!-- Sombra proyectada sobre el suelo de la Luna por los conductos -->
            <g class="tube-shadows" stroke="#0C1128" stroke-opacity=".55" stroke-width="50" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(0 8)">
              <path d="M 240 168 L 326 168 L 600 168 L 874 168 L 960 168"/>
              <path d="M 326 168 L 258 316 L 326 410 L 394 504 L 445 565"/>
              <path d="M 874 168 L 990 316 L 990 364 L 990 410 L 990 465"/>
              <path d="M 990 410 L 876 540 L 842 540 L 806 540 L 740 540"/>
              <path d="M 326 168 L 600 285 L 874 168"/>
              <path d="M 394 504 L 600 285 L 876 540"/>
              <path d="M 600 168 L 600 285 L 600 378 L 600 465"/>
            </g>

            <!-- TÚNELES PRESURIZADOS LUNARES (Borde metálico exterior) -->
            <g class="tube-outer" stroke="#6E8CE6" stroke-opacity=".55" stroke-width="44" stroke-linecap="round" stroke-linejoin="round" fill="none">
              <path d="M 240 168 L 326 168 L 600 168 L 874 168 L 960 168"/>
              <path d="M 326 168 L 258 316 L 326 410 L 394 504 L 445 565"/>
              <path d="M 874 168 L 990 316 L 990 364 L 990 410 L 990 465"/>
              <path d="M 990 410 L 876 540 L 842 540 L 806 540 L 740 540"/>
              <path d="M 326 168 L 600 285 L 874 168"/>
              <path d="M 394 504 L 600 285 L 876 540"/>
              <path d="M 600 168 L 600 285 L 600 378 L 600 465"/>
            </g>

            <!-- TÚNELES INTERIORES DE CRISTAL PRESURIZADO (por donde caminan los astronautas) -->
            <g class="transit-tubes" stroke="url(#tube-glass)" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" fill="none">
              <path d="M 240 168 L 326 168 L 600 168 L 874 168 L 960 168"/>
              <path d="M 326 168 L 258 316 L 326 410 L 394 504 L 445 565"/>
              <path d="M 874 168 L 990 316 L 990 364 L 990 410 L 990 465"/>
              <path d="M 990 410 L 876 540 L 842 540 L 806 540 L 740 540"/>
              <path d="M 326 168 L 600 285 L 874 168"/>
              <path d="M 394 504 L 600 285 L 876 540"/>
              <path d="M 600 168 L 600 285 L 600 378 L 600 465"/>
            </g>

            <!-- Pasarela peatonal interna (rejilla/piso del túnel para los astronautas) -->
            <g class="tube-walkway" stroke="#8CE0FF" stroke-opacity=".22" stroke-width="16" stroke-dasharray="4 10" stroke-linecap="butt" stroke-linejoin="round" fill="none">
              <path d="M 250 168 L 950 168"/>
              <path d="M 326 168 L 258 316 L 394 504 L 435 555"/>
              <path d="M 874 168 L 990 316 L 990 455"/>
              <path d="M 990 410 L 876 540 L 750 540"/>
              <path d="M 326 168 L 600 285 L 874 168"/>
              <path d="M 394 504 L 600 285 L 876 540"/>
              <path d="M 600 168 L 600 455"/>
            </g>

            <!-- CONDUCTOS DE FLUJO CAUSA-EFECTO (muestran cómo priorizar uno ayuda o afecta a los demás) -->
            <!-- 1. Agua -> Comida (Riego superior: brilla en azul/verde si riega, cambia a ámbar si el agua se desvía al escudo) -->
            <path class="pipe pipe--water-crops" id="pipe-water-crops"
              d="M 270 168 L 600 168 L 930 168"/>

            <!-- 2. Agua -> Escudos (Pared de Agua antirradiación por el conducto izquierdo y central) -->
            <path class="pipe pipe--water-shield" id="pipe-water-shield"
              d="M 258 316 L 326 410 L 394 504 L 440 560 M 326 168 L 600 285 L 600 430"/>

            <!-- 3. Comida <-> Oxígeno (Fotosíntesis y Bio-vitaminas por el conducto derecho) -->
            <path class="pipe pipe--bio-o2" id="pipe-bio-o2"
              d="M 990 280 L 990 364 L 990 445 M 874 168 L 600 285 L 876 540"/>

            <!-- 4. Escudos <-> Oxígeno / Todas las bases (Soporte vital y protección del escudo) -->
            <path class="pipe pipe--o2-habitat" id="pipe-o2-habitat"
              d="M 920 540 L 842 540 L 760 540 M 394 504 L 600 285 L 600 168"/>

            <!-- Esclusas (Airlocks) y Nodo Central Lunar (Hub) -->
            <g class="tube-flanges" fill="#182556" stroke="#8CE0FF" stroke-opacity=".75" stroke-width="2.4">
              <circle cx="600" cy="168" r="15"/>
              <circle cx="326" cy="410" r="15"/>
              <circle cx="990" cy="364" r="15"/>
              <circle cx="842" cy="540" r="15"/>
              <circle cx="600" cy="378" r="16"/>
              <!-- Nodo Central de Intercambio Lunar (Hub) -->
              <circle cx="600" cy="285" r="48" fill="url(#node-glow)" stroke="none"/>
              <circle cx="600" cy="285" r="25" fill="#15204C" stroke="#64D2FF" stroke-width="3.2"/>
              <circle cx="600" cy="285" r="11" fill="#5AC8FA" opacity=".85"/>
            </g>

            <!-- Esclusas de acoplamiento en las puertas de cada base (donde paran los astronautas) -->
            <g class="crew-docks" fill="#131E48" stroke="#9BE7FF" stroke-opacity=".8" stroke-width="2.5">
              <!-- Agua airlocks -->
              <circle cx="326" cy="168" r="17"/><circle cx="258" cy="316" r="16"/>
              <!-- Comida airlocks -->
              <circle cx="874" cy="168" r="17"/><circle cx="990" cy="316" r="16"/>
              <!-- Escudos airlocks -->
              <circle cx="394" cy="504" r="17"/><circle cx="806" cy="540" r="17"/>
              <!-- Oxígeno airlocks -->
              <circle cx="876" cy="540" r="17"/><circle cx="990" cy="410" r="16"/>
            </g>
          </svg>

          <!-- Etiquetas visuales sobre cada conducto: muestran cómo un elemento ayuda (➕) o afecta (⚠️) al otro -->
          <div class="conduit-badges" aria-hidden="true">
            <div class="conduit-tag conduit-tag--top" id="tag-water-crops" data-tone="help">
              💧 ➔ 🌱 Riega
            </div>
            <div class="conduit-tag conduit-tag--left" id="tag-water-shield" data-tone="idle">
              💧 ➔ 🛡️ Escudo
            </div>
            <div class="conduit-tag conduit-tag--right" id="tag-bio-o2" data-tone="idle">
              🌱 ↔ 🫧 Aire
            </div>
            <div class="conduit-tag conduit-tag--bottom" id="tag-shield-o2" data-tone="idle">
              🛡️ ↔ 🫧 Equipo
            </div>
          </div>

          <!-- Etiqueta flotante de pista o sinergia principal -->
          <div class="pipe-callout" id="pipe-callout" aria-live="polite">
            <span class="pipe-callout__text" id="pipe-callout-text">💧 ➜ 🛡️</span>
          </div>

          <!-- Capa de los 5 Astronautas (caminan exclusivamente dentro de los conductos) -->
          <div class="crew-layer" id="crew-layer" aria-label="Tripulación de 5 astronautas en los conductos"></div>

          <!-- Las 4 Bases Lunares Diegéticas -->
          ${MODULE_IDS.map((id) => this.renderModuleCard(id)).join('')}
        </div>
      </main>

      <!-- Dock Inferior de Control por Turno (Rayos ⚡ + Misión + ¡Listo!) -->
      <footer class="station-dock" aria-label="Controles del turno">
        <div class="dock-bar glass-pill">
          <div class="ap-tray" id="ap-tray" aria-label="Rayos de energía disponibles">
            <div class="ap-bolts" id="ap-bolts" role="group" aria-label="Rayos disponibles"></div>
          </div>

          <div class="mission-meter" title="Avance de la misión">
            <span class="mission-meter__label" aria-hidden="true">🚀</span>
            <div class="mission-meter__track" role="progressbar" aria-label="Avance de la misión"
              aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="hud-progress-bar">
              <div class="mission-meter__fill" id="hud-progress-fill"></div>
            </div>
            <strong class="mission-meter__val" id="hud-progress">0%</strong>
            <span class="mission-meter__goal" aria-hidden="true">🏁</span>
          </div>

          <div class="dock-actions">
            <button type="button" class="undo-btn" id="undo-btn" aria-label="Deshacer" title="Deshacer" disabled>
              ↩
            </button>
            <button type="button" class="launch-btn" id="launch-btn">
              <span class="launch-btn__icon" id="launch-icon" aria-hidden="true">🚀</span>
              <span class="launch-btn__text" id="launch-text">¡Listo!</span>
            </button>
          </div>
        </div>
      </footer>

      <!-- Tarjeta corta de Fin de Día + Dato NASA -->
      <aside class="sol-toast" id="sol-toast" hidden aria-live="polite">
        <div class="sol-toast__card glass-card">
          <div class="sol-toast__top">
            <span class="sol-toast__badge" id="toast-badge">✅ ¡Día 1 listo!</span>
            <span class="sol-toast__gain" id="toast-gain">+8% 🚀</span>
          </div>
          <p class="sol-toast__lesson" id="toast-lesson">¡Buen trabajo!</p>
          <div class="sol-toast__metrics" id="toast-metrics"></div>
          <div class="sol-toast__spinoff" id="toast-spinoff"></div>
          <button type="button" class="sol-toast__btn" id="next-sol-btn">
            Seguir ▶
          </button>
        </div>
      </aside>

      <!-- Modal de Fin de Misión (Victoria o Entorno Safe-to-Fail con Dron de Rescate) -->
      <div class="end-modal" id="end-modal" hidden role="dialog" aria-modal="true" aria-labelledby="end-title">
        <div class="end-modal__card glass-card">
          <div class="end-modal__icon" id="end-icon" aria-hidden="true">🏆</div>
          <h2 class="end-modal__title" id="end-title">¡Misión cumplida!</h2>
          <p class="end-modal__subtitle" id="end-subtitle"></p>
          <div class="end-modal__stars" id="end-stars" aria-label="Estado de la misión"></div>
          <div class="end-modal__stats" id="end-stats"></div>
          <div class="end-modal__actions">
            <button type="button" class="start-btn end-modal__rescue" id="rescue-btn" hidden>
              <span class="start-btn__shine" aria-hidden="true"></span>
              <span class="start-btn__label">🛸 ¡Seguir aquí!</span>
            </button>
            <button type="button" class="start-btn end-modal__retry" id="retry-btn">
              <span class="start-btn__shine" aria-hidden="true"></span>
              <span class="start-btn__label" id="retry-label">🔁 Otra vez</span>
            </button>
            <button type="button" class="end-modal__secondary glass-pill" id="change-cmd-btn">
              🏠 Inicio
            </button>
          </div>
        </div>
      </div>
    `;

    MODULE_IDS.forEach((id) => {
      this.modEls[id] = $(`#mod-${id}`, this.root);
    });
    this.boardEl = $('#station-board', this.root);
    this.skyEl = $('#space-sky', this.root);
    this.orbEl = $('#solar-orb', this.root);
    this.crewLayer = new CrewLayer($('#crew-layer', this.root));
    this.stormFX = new StormFX($('#storm-canvas', this.root));

    this.bindUIEvents();
    this.bindGameEvents();
    this.syncAudioButtons();

    this.resizeObs = new ResizeObserver(() => {
      this.stormFX.resize();
      this.updateCrewAnchors();
    });
    this.resizeObs.observe(this.boardEl);
  }

  renderModuleCard(id) {
    const m = MODULES[id];
    const subtitles = {
      agua: 'Reserva llena',
      escudos: 'En espera',
      comida: 'Plantas',
      oxigeno: 'Aire estable',
    };
    return `
      <button type="button"
        class="station-module station-module--${id}"
        id="mod-${id}"
        data-module="${id}"
        style="--mod-accent:${m.accent}; --level:0.78; --plant:#30D158; --growth:0.9; --light:0.5; --shield:0.25; --water-wall:0; --air:0.85"
        aria-label="${m.label} (tecla ${m.key}). Toca para darle energía.">
        <div class="station-module__art">${MODULE_ART[id]()}</div>

        <!-- Banda inferior de información protegida (nunca es cubierta por astronautas) -->
        <div class="station-module__info">
          <div class="station-module__hud">
            <div class="station-module__header">
              <span class="station-module__icon" aria-hidden="true">${m.icon}</span>
              <span class="station-module__title">${m.label}</span>
            </div>
            <div class="station-module__bolts" data-bolts="${id}" aria-label="Rayos asignados">
              <span class="mod-bolt">${BOLT_SVG}</span>
              <span class="mod-bolt">${BOLT_SVG}</span>
              <span class="mod-bolt">${BOLT_SVG}</span>
            </div>
          </div>
          <span class="station-module__sub" id="sub-${id}">${subtitles[id]}</span>
        </div>

        <!-- Indicador de avería (chispas 🔧) -->
        <div class="station-module__break" aria-hidden="true">
          <span class="break-wrench">${WRENCH_SVG}</span>
          <span class="break-text">¡Arréglame! ⚡</span>
        </div>

        <!-- Insignia de impacto cruzado (muestra cómo priorizar otro módulo ayuda ➕ o afecta ⚠️ a este) -->
        <span class="mod-impact" id="impact-${id}" hidden aria-hidden="true"></span>

        ${id === 'escudos' ? '<span class="shelter-badge" id="shelter-badge" hidden>🏠 ¡Todos a salvo!</span>' : ''}
      </button>
    `;
  }

  bindUIEvents() {
    MODULE_IDS.forEach((id) => {
      const el = this.modEls[id];
      el.addEventListener('click', () => this.handleModuleTap(id));
      el.addEventListener('pointerenter', () => sfx.play('hover'));
    });

    $$('button', this.root).forEach((btn) => {
      if (!btn.classList.contains('station-module')) {
        btn.addEventListener('pointerenter', () => sfx.play('hover'));
      }
    });

    $('#undo-btn', this.root).addEventListener('click', () => {
      sfx.unlock();
      if (this.game.undo()) {
        sfx.play('undo');
        haptic(6);
      }
    });

    $('#launch-btn', this.root).addEventListener('click', () => this.handlePrimaryAction());
    $('#next-sol-btn', this.root).addEventListener('click', () => {
      sfx.unlock();
      sfx.play('tap');
      $('#sol-toast', this.root).hidden = true;
      this.game.next();
    });

    $('#hud-home-btn', this.root).addEventListener('click', () => {
      sfx.unlock();
      sfx.play('tap');
      this.onExit?.();
    });

    $('#station-lab-btn', this.root).addEventListener('click', () => {
      sfx.unlock();
      sfx.play('tap');
      this.toggleHighCeiling();
    });
    $('#hc-close-btn', this.root).addEventListener('click', () => {
      sfx.play('tap');
      this.toggleHighCeiling(false);
    });
    $('#hc-weather-btns', this.root).addEventListener('click', (e) => {
      const btn = e.target.closest('[data-event]');
      if (!btn) return;
      sfx.unlock();
      sfx.play('tap');
      this.game.setWeatherEvent(btn.dataset.event);
    });

    $('#station-bgm-btn', this.root).addEventListener('click', () => {
      sfx.unlock();
      sfx.setBGMMuted(!sfx.isBGMMuted());
      this.syncAudioButtons();
      sfx.play('tap');
    });

    $('#station-sound-btn', this.root).addEventListener('click', () => {
      sfx.unlock();
      sfx.setSFXMuted(!sfx.isSFXMuted());
      this.syncAudioButtons();
      if (!sfx.isSFXMuted()) sfx.play('tap');
    });

    $('#station-tts-btn', this.root).addEventListener('click', () => {
      sfx.unlock();
      sfx.setTTSEnabled(!sfx.isTTSEnabled());
      this.syncAudioButtons();
      sfx.play('tap');
      if (sfx.isTTSEnabled() && this.game.state?.event) {
        sfx.speak(`${this.game.state.event.label}. ${this.game.state.event.tip}`);
      }
    });

    $('#station-edu-btn', this.root).addEventListener('click', () => {
      sfx.unlock();
      educatorModal.open();
    });

    $('#rescue-btn', this.root).addEventListener('click', () => {
      sfx.unlock();
      sfx.play('go');
      $('#end-modal', this.root).hidden = true;
      this.game.rescueContinue();
      sfx.speak('¡Dron de ayuda! Todo reparado. ¡Sigamos!');
    });

    $('#retry-btn', this.root).addEventListener('click', () => {
      sfx.unlock();
      sfx.play('go');
      $('#end-modal', this.root).hidden = true;
      const { commander, name, skillLevel } = this.game.state;
      this.game.start({ commander, name, skillLevel });
    });

    $('#change-cmd-btn', this.root).addEventListener('click', () => {
      sfx.unlock();
      sfx.play('tap');
      $('#end-modal', this.root).hidden = true;
      this.onExit?.();
    });

    window.addEventListener('keydown', (e) => {
      if (this.root.hidden) return;
      if (e.target.matches('input, textarea')) return;
      if (!$('#educator-modal')?.hidden && $('#educator-modal')) return;
      const keyMap = { 1: 'agua', 2: 'comida', 3: 'escudos', 4: 'oxigeno' };
      if (keyMap[e.key]) {
        e.preventDefault();
        this.handleModuleTap(keyMap[e.key]);
      } else if (e.key === 'Backspace' || e.key === 'z' || e.key === 'Z') {
        if (this.game.state?.phase === 'planning' && this.game.undo()) {
          sfx.play('undo');
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (document.activeElement?.classList.contains('station-module')) return;
        e.preventDefault();
        this.handlePrimaryAction();
      }
    });
  }

  bindGameEvents() {
    this.game.addEventListener('mission:start', ({ detail: { state } }) => {
      $('#end-modal', this.root).hidden = true;
      $('#sol-toast', this.root).hidden = true;
      $('#hud-name', this.root).textContent = state.name;
      const labBtn = $('#station-lab-btn', this.root);
      if (labBtn) labBtn.hidden = !state.skill?.sandboxAllowed;
      this.crewLayer.mount(state.crew);
      this.toggleHighCeiling(state.skillLevel === 5);
      requestAnimationFrame(() => {
        this.stormFX.resize();
        this.updateCrewAnchors();
      });
    });

    this.game.addEventListener('sol:start', ({ detail: { state } }) => {
      $('#sol-toast', this.root).hidden = true;
      this.renderHUD(state);
      this.renderWeather(state.event);
      this.renderModulesAndPipes(state);
      this.renderScaffolding(state);
      this.syncCrew(state);
      this.updateHighCeilingPreview(state);
      if (state.event.id === 'claseX') sfx.play('alarm');
      sfx.speak(`Día ${state.sol}. ${state.event.label}. ${state.event.tip}`);
    });

    this.game.addEventListener('weather:change', ({ detail: { state } }) => {
      this.renderHUD(state);
      this.renderWeather(state.event);
      this.renderModulesAndPipes(state);
      this.renderScaffolding(state);
      this.updateHighCeilingPreview(state);
      sfx.speak(`Simulando ${state.event.label}`);
    });

    this.game.addEventListener('plan:change', ({ detail: { state, id } }) => {
      this.renderHUD(state);
      this.renderModulesAndPipes(state, id);
      this.renderScaffolding(state);
      this.syncCrew(state);
      this.updateHighCeilingPreview(state);
    });

    this.game.addEventListener('turn:resolved', async ({ detail: { state, report } }) => {
      await this.playResolutionSequence(state, report);
    });
  }

  toggleHighCeiling(force) {
    const drawer = $('#high-ceiling-drawer', this.root);
    const btn = $('#station-lab-btn', this.root);
    this.highCeilingOpen = typeof force === 'boolean' ? force : !this.highCeilingOpen;
    drawer.hidden = !this.highCeilingOpen;
    btn.setAttribute('aria-expanded', String(this.highCeilingOpen));
    btn.classList.toggle('is-on', this.highCeilingOpen);
    if (this.highCeilingOpen && this.game.state) {
      this.updateHighCeilingPreview(this.game.state);
    }
  }

  async updateHighCeilingPreview(state) {
    if (!this.highCeilingOpen || !state?.event) return;
    const plan = this.game.plan();
    const transMap = {
      1: 'Básico',
      2: 'Magnético',
      3: '💧 Pared de Agua',
    };
    $('#hc-val-shield', this.root).textContent = transMap[plan.blindaje];
    $('#hc-val-light', this.root).textContent = `${Math.round(plan.energiaInvernadero)}%`;

    $$('.hc-weather-btn', this.root).forEach((b) => {
      b.classList.toggle('is-active', b.dataset.event === state.event.id);
    });

    try {
      const out = await predict({
        intensidad: state.event.intensidad,
        mSv: state.event.mSv,
        blindaje: plan.blindaje,
        actividad: plan.actividad,
        contramedidas: plan.contramedidas,
        energiaInvernadero: plan.energiaInvernadero,
      });
      $('#hc-val-damage', this.root).textContent = `${Math.round(out.danoCelular)}%`;
      $('#hc-val-eff', this.root).textContent = `${Math.round(out.eficienciaTripulacion)}%`;
      $('#hc-val-crops', this.root).textContent = `${Math.round(out.saludCultivos)}%`;
    } catch {
      /* ignore preview error */
    }
  }

  handleModuleTap(id) {
    sfx.unlock();
    const s = this.game.state;
    if (!s) return;

    if (s.phase === 'report') {
      $('#sol-toast', this.root).hidden = true;
      this.game.next();
      return;
    }

    const res = this.game.tap(id);
    const el = this.modEls[id];
    const boltsRow = el.querySelector('.station-module__bolts');
    const artEl = el.querySelector('.station-module__art');

    if (!res.ok) {
      sfx.play('deny');
      haptic([10, 30, 10]);
      // Micro-vibración sutil solo en los rayos del módulo, sin sacudir toda la tarjeta
      animate(
        boltsRow,
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-3px)' },
          { transform: 'translateX(3px)' },
          { transform: 'translateX(0)' },
        ],
        { duration: 180 },
      );
      if (res.reason === 'no-ap') {
        animate(
          $('#ap-bolts', this.root),
          [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }],
          { duration: 200 },
        );
      }
      return;
    }

    sfx.play(res.action === 'repair' ? 'repair' : 'bolt');
    haptic(8);
    // Respuesta táctil suave y natural solo sobre el arte interno (1.5% de presión)
    animate(
      artEl,
      [
        { transform: 'scale(1)' },
        { transform: 'scale(0.982)' },
        { transform: 'scale(1.01)' },
        { transform: 'scale(1)' },
      ],
      { duration: 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  }

  handlePrimaryAction() {
    sfx.unlock();
    const s = this.game.state;
    if (!s) return;
    if (s.phase === 'planning') {
      sfx.play('go');
      haptic(12);
      this.game.resolve();
    } else if (s.phase === 'report') {
      sfx.play('tap');
      $('#sol-toast', this.root).hidden = true;
      this.game.next();
    }
  }

  renderHUD(state) {
    $('#hud-sol', this.root).textContent = `☀️ Día ${state.sol}/${state.maxSols}`;
    const pct = Math.round(state.progress);
    $('#hud-progress', this.root).textContent = `${pct}%`;
    $('#hud-progress-fill', this.root).style.width = `${pct}%`;
    $('#hud-progress-bar', this.root).setAttribute('aria-valuenow', String(pct));

    const eff = Math.round(state.eficiencia);
    const crops = Math.round(state.cultivos);
    $('#val-crew', this.root).textContent = `${eff}%`;
    $('#val-crops', this.root).textContent = `${crops}%`;
    $('#chip-crew', this.root).dataset.tone = toneFor(eff);
    $('#chip-crops', this.root).dataset.tone = toneFor(crops);

    const boltsEl = $('#ap-bolts', this.root);
    let boltsHTML = '';
    for (let i = 0; i < 3; i++) {
      const stateClass = i < state.ap ? 'is-ready' : i < state.apMax ? 'is-spent' : 'is-locked';
      boltsHTML += `<span class="ap-bolt ${stateClass}" title="${
        i < state.ap ? 'Rayo listo' : i < state.apMax ? 'Rayo usado' : 'Cansado'
      }">${BOLT_SVG}</span>`;
    }
    boltsEl.innerHTML = boltsHTML;

    $('#undo-btn', this.root).disabled = state.phase !== 'planning' || state.actions.length === 0;
    const launchBtn = $('#launch-btn', this.root);
    const launchText = $('#launch-text', this.root);
    const launchIcon = $('#launch-icon', this.root);
    launchBtn.disabled = state.phase === 'resolving';
    launchBtn.classList.toggle('is-ready-pulse', state.phase === 'planning' && state.ap === 0);

    if (state.phase === 'planning') {
      launchIcon.textContent = state.event.id === 'calma' ? '🚀' : '🛡️';
      launchText.textContent = state.ap > 0 ? `¡Listo! (${state.ap}⚡)` : '¡Despegar!';
    } else if (state.phase === 'resolving') {
      launchIcon.textContent = '⏳';
      launchText.textContent = '¡Vamos!';
    } else if (state.phase === 'report') {
      launchIcon.textContent = '▶';
      launchText.textContent = 'Seguir';
    }
  }

  renderWeather(event) {
    this.skyEl.dataset.event = event.id;
    const banner = $('#weather-banner', this.root);
    banner.dataset.event = event.id;
    $('#weather-signal', this.root).textContent = `${event.emoji || event.signal} ${event.shape || ''}`;
    $('#weather-title', this.root).textContent = event.label;
    $('#weather-tip', this.root).textContent = event.tip;
  }

  renderModulesAndPipes(state) {
    const alloc = this.game.allocation();
    const plan = this.game.plan();

    MODULE_IDS.forEach((id) => {
      const m = state.modules[id];
      const el = this.modEls[id];
      el.dataset.bolts = String(m.bolts);
      el.classList.toggle('is-broken', m.broken);
      el.classList.toggle('is-boosted', m.bolts > 0);

      const boltNodes = $$('.mod-bolt', el);
      boltNodes.forEach((b, i) => b.classList.toggle('is-on', i < m.bolts));
    });

    const waterLevel = plan.aguaDesviada ? clamp(0.54 + alloc.agua * 0.08, 0.45, 0.78) : 0.82;
    this.modEls.agua.style.setProperty('--level', waterLevel.toFixed(2));
    $('#sub-agua', this.root).textContent = plan.aguaDesviada ? '💧 Al escudo' : '💧 Reserva llena';

    const shieldStrength = plan.blindaje === 3 ? 1 : plan.blindaje === 2 ? 0.68 : 0.22;
    this.modEls.escudos.style.setProperty('--shield', String(shieldStrength));
    this.modEls.escudos.style.setProperty('--water-wall', plan.blindaje === 3 ? '1' : '0');
    this.modEls.escudos.classList.toggle('has-water-wall', plan.blindaje === 3);
    $('#sub-escudos', this.root).textContent =
      plan.blindaje === 3
        ? '🛡️💧 ¡Súper escudo!'
        : plan.blindaje === 2
          ? '🛡️ ¡Activo!'
          : '🛡️ En espera';

    const shelterBadge = $('#shelter-badge', this.root);
    if (shelterBadge) {
      shelterBadge.hidden = !plan.emergencia;
      shelterBadge.textContent = '🏠 ¡Todos a salvo!';
    }

    const crops = state.cultivos;
    const plantColor = crops >= 70 ? '#30D158' : crops >= 42 ? '#FFD60A' : '#FF7A45';
    const growth = clamp(0.58 + (crops / 100) * 0.48 + alloc.comida * 0.06, 0.52, 1.12);
    const light = clamp((plan.energiaInvernadero - 35) / 65, 0.18, 1);
    this.modEls.comida.style.setProperty('--plant', plantColor);
    this.modEls.comida.style.setProperty('--growth', growth.toFixed(2));
    this.modEls.comida.style.setProperty('--light', light.toFixed(2));
    $('#sub-comida', this.root).textContent =
      alloc.comida > 0
        ? '🌱 ¡Creciendo!'
        : plan.aguaDesviada
          ? '🌱 Poca agua'
          : `🌱 ${Math.round(crops)}% sanas`;

    const o2Speed = clamp(2.4 - alloc.oxigeno * 0.55, 0.85, 2.4);
    const airLevel = clamp(state.eficiencia / 100 + alloc.oxigeno * 0.12, 0.25, 1);
    this.modEls.oxigeno.style.setProperty('--o2-speed', `${o2Speed.toFixed(2)}s`);
    this.modEls.oxigeno.style.setProperty('--air', airLevel.toFixed(2));
    $('#sub-oxigeno', this.root).textContent = plan.contramedidas
      ? '🫧 ¡Súper aire! 🫐'
      : alloc.oxigeno > 0
        ? '🫧 Aire extra'
        : '🫧 Aire limpio';

    // Conductos y etiquetas visuales de Causa-Efecto (ayuda ➕ vs. sacrificio ⚠️)
    const pipeWaterShield = $('#pipe-water-shield', this.root);
    const pipeWaterCrops = $('#pipe-water-crops', this.root);
    const pipeBioO2 = $('#pipe-bio-o2', this.root);
    const pipeO2Habitat = $('#pipe-o2-habitat', this.root);

    const waterShieldActive = alloc.agua > 0 || alloc.escudos > 0;
    const stormNeedWater = state.event.id === 'claseX' && alloc.escudos > 0 && alloc.agua === 0;
    const stormUnshielded = state.event.id !== 'calma' && plan.blindaje === 1;

    pipeWaterShield.classList.toggle('is-active', waterShieldActive);
    pipeWaterShield.classList.toggle('is-max', plan.blindaje === 3);
    pipeWaterShield.classList.toggle('is-danger', stormNeedWater);

    pipeWaterCrops.classList.toggle('is-active', !plan.aguaDesviada && alloc.comida > 0);
    pipeWaterCrops.classList.toggle('is-diverted', plan.aguaDesviada);

    pipeBioO2.classList.toggle('is-active', (alloc.comida > 0 || alloc.oxigeno > 0) && !plan.emergencia);
    pipeBioO2.classList.toggle('is-max', plan.contramedidas === 1 && !plan.emergencia);
    pipeBioO2.classList.toggle('is-diverted', plan.emergencia);

    pipeO2Habitat.classList.toggle('is-active', alloc.oxigeno > 0 || plan.blindaje >= 2);
    pipeO2Habitat.classList.toggle('is-danger', stormUnshielded);

    // 1. Etiqueta del conducto superior: 💧 Agua <-> 🌱 Comida
    const tagTop = $('#tag-water-crops', this.root);
    if (tagTop) {
      if (plan.aguaDesviada) {
        tagTop.dataset.tone = 'warn';
        tagTop.textContent = '⚠️ -💧 Menos riego a 🌱';
      } else if (alloc.comida > 0) {
        tagTop.dataset.tone = 'help';
        tagTop.textContent = '➕ 💧 Riega a 🌱 (+Crece)';
      } else {
        tagTop.dataset.tone = 'idle';
        tagTop.textContent = '💧 ➔ 🌱 Riega plantas';
      }
    }

    // 2. Etiqueta del conducto izquierdo: 💧 Agua -> 🛡️ Escudos
    const tagLeft = $('#tag-water-shield', this.root);
    if (tagLeft) {
      if (plan.blindaje === 3) {
        tagLeft.dataset.tone = 'synergy';
        tagLeft.textContent = '✨ 💧+🛡️ ¡Súper escudo!';
      } else if (alloc.agua > 0) {
        tagLeft.dataset.tone = 'help';
        tagLeft.textContent = '➕ 💧 refuerza a 🛡️';
      } else if (stormNeedWater) {
        tagLeft.dataset.tone = 'danger';
        tagLeft.textContent = '⚠️ ¡Falta 💧 en 🛡️!';
      } else {
        tagLeft.dataset.tone = 'idle';
        tagLeft.textContent = '💧 ➔ 🛡️ Escudo de agua';
      }
    }

    // 3. Etiqueta del conducto derecho: 🌱 Comida <-> 🫧 Oxígeno
    const tagRight = $('#tag-bio-o2', this.root);
    if (tagRight) {
      if (plan.emergencia) {
        tagRight.dataset.tone = 'warn';
        tagRight.textContent = '⏸️ Pausa (en 🛡️)';
      } else if (plan.contramedidas) {
        tagRight.dataset.tone = 'synergy';
        tagRight.textContent = '✨ 🌱+🫧 ¡Vitaminas 🫐!';
      } else if (alloc.comida > 0) {
        tagRight.dataset.tone = 'help';
        tagRight.textContent = '➕ 🌱 da aire a 🫧';
      } else if (alloc.oxigeno > 0) {
        tagRight.dataset.tone = 'help';
        tagRight.textContent = '➕ 🫧 impulsa a 🌱';
      } else {
        tagRight.dataset.tone = 'idle';
        tagRight.textContent = '🌱 ↔ 🫧 Aire y plantas';
      }
    }

    // 4. Etiqueta del conducto inferior: 🛡️ Escudos <-> 🫧 Oxígeno / Bases
    const tagBottom = $('#tag-shield-o2', this.root);
    if (tagBottom) {
      if (stormUnshielded) {
        tagBottom.dataset.tone = 'danger';
        tagBottom.textContent = '⚠️ ¡Sin 🛡️! 🔧';
      } else if (plan.blindaje >= 2 && alloc.oxigeno > 0) {
        tagBottom.dataset.tone = 'synergy';
        tagBottom.textContent = '✨ 🛡️ + 🫧 Equipo';
      } else if (plan.blindaje >= 2) {
        tagBottom.dataset.tone = 'help';
        tagBottom.textContent = '➕ 🛡️ Protege';
      } else if (alloc.oxigeno > 0) {
        tagBottom.dataset.tone = 'help';
        tagBottom.textContent = '➕ 🫧 da ⚡';
      } else {
        tagBottom.dataset.tone = 'idle';
        tagBottom.textContent = '🛡️ ↔ 🫧 Equipo';
      }
    }

    // 5. Insignias de impacto cruzado en cada una de las 4 bases
    const setImpact = (id, tone, text) => {
      const el = $(`#impact-${id}`, this.root);
      if (!el) return;
      if (!text) {
        el.hidden = true;
        return;
      }
      el.hidden = false;
      el.dataset.tone = tone;
      el.textContent = text;
    };

    // Impacto sobre Agua
    if (alloc.agua > 0) {
      setImpact('agua', 'help', '📤 Da 💧 a 🛡️ (-🌱)');
    } else if (plan.blindaje >= 2 && state.event.id !== 'calma') {
      setImpact('agua', 'help', '🛡️ Protegida');
    } else {
      setImpact('agua', '', '');
    }

    // Impacto sobre Comida (muestra cómo priorizar Agua o Refugio la afecta, o cómo Oxígeno/Agua la ayudan)
    if (plan.aguaDesviada) {
      setImpact('comida', 'warn', '⚠️ -💧 (agua en 🛡️)');
    } else if (plan.emergencia) {
      setImpact('comida', 'warn', '⏸️ En pausa');
    } else if (plan.contramedidas) {
      setImpact('comida', 'synergy', '✨ +🫧 Súper cultivo');
    } else if (alloc.oxigeno > 0) {
      setImpact('comida', 'help', '➕ Recibe 🫧 (+15%)');
    } else if (alloc.comida > 0) {
      setImpact('comida', 'help', '➕ Recibe 💧 riego');
    } else {
      setImpact('comida', '', '');
    }

    // Impacto sobre Escudos
    if (plan.blindaje === 3) {
      setImpact('escudos', 'synergy', '✨ +💧 Escudo máximo');
    } else if (alloc.agua > 0 && alloc.escudos === 0) {
      setImpact('escudos', 'help', '➕ Recibe 💧 de Agua');
    } else if (alloc.escudos > 0 && stormNeedWater) {
      setImpact('escudos', 'warn', '⚠️ Pide 💧 a Agua');
    } else if (alloc.escudos > 0) {
      setImpact('escudos', 'help', '➕ Cuida a 💧🌱🫧');
    } else if (stormUnshielded) {
      setImpact('escudos', 'danger', '⚠️ ¡Actívame!');
    } else {
      setImpact('escudos', '', '');
    }

    // Impacto sobre Oxígeno
    if (plan.contramedidas) {
      setImpact('oxigeno', 'synergy', '✨ +🌱 Vitaminas 🫐');
    } else if (alloc.comida > 0 && alloc.oxigeno === 0) {
      setImpact('oxigeno', 'help', '➕ Recibe O₂ de 🌱');
    } else if (alloc.oxigeno > 0) {
      setImpact('oxigeno', 'help', '➕ Da ⚡ a 👩‍🚀 y 🌱');
    } else {
      setImpact('oxigeno', '', '');
    }

    const callout = $('#pipe-callout', this.root);
    const calloutText = $('#pipe-callout-text', this.root);
    const evalNow = telemetry.evaluateDecision(state.event, plan, state.apMax);

    if (state.hintLevel >= 1 && !evalNow.optimal && state.ap > 0) {
      callout.dataset.tone = 'warn';
      calloutText.textContent = `💡 ${evalNow.hint || evalNow.reason}`;
      callout.classList.add('is-visible');
    } else if (plan.blindaje === 3) {
      callout.dataset.tone = 'shield';
      calloutText.textContent = '💧 + 🛡️ = ¡Súper escudo! (⚠️ menos 💧 en 🌱)';
      callout.classList.add('is-visible');
    } else if (alloc.agua > 0) {
      callout.dataset.tone = 'water';
      calloutText.textContent = '💧 va a 🛡️ (⚠️ resta 💧 a 🌱) · ¡Toca 🛡️!';
      callout.classList.add('is-visible');
    } else if (alloc.escudos > 0 && state.event.id === 'claseX') {
      callout.dataset.tone = 'warn';
      calloutText.textContent = '🌪️ ¡Toca también 💧 para el Súper Escudo!';
      callout.classList.add('is-visible');
    } else if (plan.contramedidas) {
      callout.dataset.tone = 'bio';
      calloutText.textContent = '🌱 + 🫧 = ¡Súper equipo y más plantas! 🫐';
      callout.classList.add('is-visible');
    } else {
      callout.classList.remove('is-visible');
    }
  }

  renderScaffolding(state) {
    MODULE_IDS.forEach((id) => {
      this.modEls[id].classList.remove('is-scaffold', 'is-dimmed');
    });
    if (state.phase !== 'planning') return;

    const alloc = this.game.allocation();
    const plan = this.game.plan();

    const brokenIds = MODULE_IDS.filter((id) => state.modules[id].broken);
    if (brokenIds.length && state.ap > 0) {
      brokenIds.forEach((id) => this.modEls[id].classList.add('is-scaffold'));
      return;
    }

    const evalNow = telemetry.evaluateDecision(state.event, plan, state.apMax);
    if (state.hintLevel >= 2 && !evalNow.optimal && state.ap > 0) {
      evalNow.targetModules.forEach((id) => this.modEls[id].classList.add('is-scaffold'));
      evalNow.distractorModules.forEach((id) => this.modEls[id].classList.add('is-dimmed'));
      return;
    }

    const guideActive = state.skill?.alwaysScaffold || state.sol <= 2;
    if (!guideActive || state.ap <= 0) return;

    if (state.event.id === 'calma') {
      if (alloc.comida === 0) this.modEls.comida.classList.add('is-scaffold');
      if (alloc.oxigeno === 0) this.modEls.oxigeno.classList.add('is-scaffold');
    } else if (state.event.id === 'claseM') {
      if (alloc.escudos === 0) this.modEls.escudos.classList.add('is-scaffold');
    } else if (state.event.id === 'claseX') {
      if (plan.blindaje < 3) {
        if (alloc.escudos === 0) this.modEls.escudos.classList.add('is-scaffold');
        if (alloc.agua === 0) this.modEls.agua.classList.add('is-scaffold');
      }
    }
  }

  updateCrewAnchors() {
    if (!this.boardEl) return;
    const b = this.boardEl.getBoundingClientRect();
    if (!b.width || !b.height) return;
    this.crewLayer.setAnchors({ board: { w: b.width, h: b.height } });
  }

  syncCrew(state) {
    const plan = this.game.plan();
    this.crewLayer.update({
      allocation: this.game.allocation(),
      sheltered: plan.emergencia,
      energies: state.crew.map((c) => c.energia),
    });
  }

  async playResolutionSequence(state, report) {
    this.renderHUD(state);

    const canvasRect = $('#storm-canvas', this.root).getBoundingClientRect();
    const orbRect = this.orbEl.getBoundingClientRect();
    const shieldRect = this.modEls.escudos.getBoundingClientRect();

    const origin = {
      x: orbRect.left - canvasRect.left + orbRect.width / 2,
      y: orbRect.top - canvasRect.top + orbRect.height / 2,
    };
    const shield = {
      x: shieldRect.left - canvasRect.left,
      y: shieldRect.top - canvasRect.top,
      w: shieldRect.width,
      h: shieldRect.height,
    };

    if (report.event.id !== 'calma') sfx.play('storm');

    await this.stormFX.burst({
      eventId: report.event.id,
      origin,
      shield,
      blindaje: report.inputs.blindaje,
      duration: report.event.id === 'calma' ? 650 : 1200,
    });

    this.renderHUD(state);
    this.renderModulesAndPipes(state);
    this.syncCrew(state);

    if (report.newBreaks.length > 0) {
      sfx.play('break');
      haptic([16, 30, 20]);
      report.newBreaks.forEach((id) => {
        const artEl = this.modEls[id].querySelector('.station-module__art');
        animate(
          artEl,
          [
            { transform: 'translate(0, 0)' },
            { transform: 'translate(-3px, 1px)' },
            { transform: 'translate(3px, -1px)' },
            { transform: 'translate(0, 0)' },
          ],
          { duration: 240 },
        );
      });
    }

    const hardHit = report.output.danoCelular >= 28 || report.newBreaks.length > 0;
    this.crewLayer.react(hardHit ? 'hit' : 'happy');

    if (report.outcome === 'won') {
      storage.set(STORAGE_KEYS.tutorialDone, true);
      const stars = this.game.stars();
      const prevBest = storage.get(STORAGE_KEYS.best, null);
      if (!prevBest || stars > prevBest.stars || (stars === prevBest.stars && state.sol < prevBest.sols)) {
        storage.set(STORAGE_KEYS.best, { sols: state.sol, stars });
      }
      sfx.play('success');
      await wait(350);
      this.showEndModal('won', state, report);
      return;
    }

    if (report.outcome === 'evacuated') {
      sfx.play('soft');
      await wait(350);
      this.showEndModal('evacuated', state, report);
      return;
    }

    this.showSolToast(report);
  }

  showSolToast(report) {
    const toast = $('#sol-toast', this.root);
    $('#toast-badge', this.root).textContent = `${report.event.emoji || report.event.signal} ¡Día ${report.sol} listo!`;
    $('#toast-gain', this.root).textContent = `+${Math.round(report.gain)}% 🚀`;
    $('#toast-lesson', this.root).textContent = report.lesson;

    if (report.spinoff) {
      $('#toast-spinoff', this.root).innerHTML = `
        <strong>🛰️ Dato NASA:</strong> ${report.spinoff.text}
      `;
    }

    const breakChip = report.newBreaks.length
      ? `<span class="toast-chip toast-chip--warn">🔧 ${report.newBreaks.map((id) => MODULES[id].icon).join(' ')}</span>`
      : `<span class="toast-chip toast-chip--good">✅ Todo bien</span>`;

    $('#toast-metrics', this.root).innerHTML = `
      <span class="toast-chip">👩‍🚀 ${Math.round(report.eficiencia)}%</span>
      <span class="toast-chip">🌱 ${Math.round(report.cultivos)}%</span>
      <span class="toast-chip">⚡ ${report.apNext} rayos</span>
      ${breakChip}
    `;
    toast.hidden = false;
    sfx.speak(report.lesson);
  }

  showEndModal(kind, state, report) {
    $('#sol-toast', this.root).hidden = true;
    const modal = $('#end-modal', this.root);
    const iconEl = $('#end-icon', this.root);
    const titleEl = $('#end-title', this.root);
    const subEl = $('#end-subtitle', this.root);
    const starsEl = $('#end-stars', this.root);
    const statsEl = $('#end-stats', this.root);
    const rescueBtn = $('#rescue-btn', this.root);
    const retryLabel = $('#retry-label', this.root);

    if (kind === 'won') {
      const stars = this.game.stars();
      iconEl.textContent = '🏆';
      titleEl.textContent = `¡Ganaste, ${state.name}!`;
      subEl.textContent = '¡Llevaste la estación al 100%!';
      starsEl.innerHTML = [1, 2, 3]
        .map((n) => `<span class="end-star ${n <= stars ? 'is-on' : ''}">⭐</span>`)
        .join('');
      rescueBtn.hidden = true;
      retryLabel.textContent = '🚀 Jugar otra vez';
      sfx.speak(`¡Ganaste, ${state.name}! Obtuviste ${stars} estrellas.`);
    } else {
      iconEl.textContent = '🛸';
      titleEl.textContent = '¡Ayuda en camino!';
      const reasons = {
        damage: 'Un dron reparó tus módulos 🔧',
        time: 'Un dron trajo más suministros 📦',
        crew: 'Un dron recargó a tu equipo ⚡',
      };
      subEl.textContent = reasons[report.evacuationReason] || reasons.damage;
      starsEl.innerHTML = '<span class="end-safe-badge">🛡️ No pierdes tu avance</span>';
      rescueBtn.hidden = false;
      retryLabel.textContent = '🔁 Día 1';
      sfx.speak('Ayuda en camino. Toca seguir aquí para continuar.');
    }

    statsEl.innerHTML = `
      <div class="end-stat"><span>🚀 Misión</span><strong>${Math.round(state.progress)}%</strong></div>
      <div class="end-stat"><span>☀️ Día</span><strong>${state.sol}/${state.maxSols}</strong></div>
      <div class="end-stat"><span>👩‍🚀 Equipo</span><strong>${Math.round(state.salud)}%</strong></div>
      <div class="end-stat"><span>🌱 Plantas</span><strong>${Math.round(state.cultivos)}%</strong></div>
    `;
    modal.hidden = false;
  }

  syncAudioButtons() {
    const bgmMuted = sfx.isBGMMuted();
    const sfxMuted = sfx.isSFXMuted();
    const ttsOn = sfx.isTTSEnabled();

    const bgmBtn = $('#station-bgm-btn', this.root);
    const sfxBtn = $('#station-sound-btn', this.root);
    const ttsBtn = $('#station-tts-btn', this.root);

    if (bgmBtn) {
      $('#station-bgm-icon', this.root).textContent = bgmMuted ? '🔕' : '🎵';
      bgmBtn.setAttribute('aria-pressed', String(!bgmMuted));
      bgmBtn.classList.toggle('is-off', bgmMuted);
    }
    if (sfxBtn) {
      $('#station-sound-icon', this.root).textContent = sfxMuted ? '🔇' : '🔊';
      sfxBtn.setAttribute('aria-pressed', String(!sfxMuted));
      sfxBtn.classList.toggle('is-off', sfxMuted);
    }
    if (ttsBtn) {
      $('#station-tts-icon', this.root).textContent = ttsOn ? '🗣️' : '💬';
      ttsBtn.setAttribute('aria-pressed', String(ttsOn));
      ttsBtn.classList.toggle('is-on', ttsOn);
    }
  }

  syncSoundIcon() {
    this.syncAudioButtons();
  }
}
