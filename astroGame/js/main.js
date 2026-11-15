/**
 * ASTRO — Your little big commander (`https://astro-training.com`)
 * Punto de entrada principal (Client-Side ES6).
 * Gestiona el Preloader Visual (0%-100%), el aviso de orientación, las 2 vistas
 * principales, el motor por turnos, la telemetría K-12 y el modelo ML `modelo_simulacion_espacial.js`.
 */
import { $, wait } from './util.js';
import { loadModel, modelSource, predict } from './ml-bridge.js';
import { Game } from './engine.js';
import { StartView } from './ui/start-view.js';
import { StationView } from './ui/station-view.js';
import { educatorModal } from './ui/educator-modal.js';
import { telemetry } from './telemetry.js';

const viewStartEl = $('#view-start');
const viewStationEl = $('#view-station');
const preloaderEl = $('#astro-preloader');
const preloaderFill = $('#preloader-fill');
const preloaderPct = $('#preloader-pct');
const preloaderBar = $('#preloader-bar');

const game = new Game({ predict });

let startView;
let stationView;

function setPreloadProgress(pct) {
  const v = Math.min(100, Math.max(0, Math.round(pct)));
  if (preloaderFill) preloaderFill.style.width = `${v}%`;
  if (preloaderPct) preloaderPct.textContent = `${v}%`;
  if (preloaderBar) preloaderBar.setAttribute('aria-valuenow', String(v));
}

function showView(target) {
  const isStart = target === 'start';
  viewStartEl.hidden = !isStart;
  viewStationEl.hidden = isStart;
  viewStartEl.classList.toggle('is-active', isStart);
  viewStationEl.classList.toggle('is-active', !isStart);

  if (isStart) {
    startView?.refreshBest();
    startView?.syncAudioButtons();
  } else {
    stationView?.syncAudioButtons();
    requestAnimationFrame(() => stationView?.updateCrewAnchors());
  }
}

async function bootstrap() {
  setPreloadProgress(18);

  // 1. Cargar modelo ML Client-Side
  const { source } = await loadModel();
  document.documentElement.dataset.mlSource = source;
  setPreloadProgress(55);

  // 2. Montar vistas y modal docente
  startView = new StartView({
    root: viewStartEl,
    onStart: ({ commander, name, ageMode, skillLevel }) => {
      showView('station');
      game.start({ commander, name, ageMode, skillLevel });
    },
  });

  stationView = new StationView({
    root: viewStationEl,
    game,
    onExit: () => showView('start'),
  });

  startView.mount();
  setPreloadProgress(80);
  stationView.mount();
  educatorModal.mount();
  showView('start');

  // 3. Aviso de orientación descartable
  const dismissBtn = $('#dismiss-orientation-btn');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      document.body.classList.add('orientation-dismissed');
    });
  }

  setPreloadProgress(100);
  await wait(160);
  if (preloaderEl) {
    preloaderEl.classList.add('is-done');
    setTimeout(() => { preloaderEl.hidden = true; }, 260);
  }

  // Exponer referencia ligera para depuración/inspección académica
  window.__ASTRO__ = { game, predict, modelSource, telemetry };
}

bootstrap();
