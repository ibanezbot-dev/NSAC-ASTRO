/**
 * Ilustraciones vectoriales de los 4 módulos diegéticos.
 * Su estado visual se controla con variables CSS en el botón contenedor:
 *   Agua     → --level (0-1)
 *   Comida   → --plant (color), --growth (0.5-1), --light (0-1)
 *   Escudos  → --shield (0-1), --water-wall (0-1)
 *   Oxígeno  → --o2-speed (s), --air (0-1)
 */

const HULL_DEFS = (p) => `
  <linearGradient id="${p}-hull" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3A4475"/><stop offset=".5" stop-color="#232A55"/><stop offset="1" stop-color="#151A3A"/>
  </linearGradient>
  <linearGradient id="${p}-rim" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".06"/>
  </linearGradient>`;

const hull = (p, x, y, w, h, r) =>
  `<rect class="mod-hull" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#${p}-hull)" stroke="url(#${p}-rim)" stroke-width="2.5"/>`;

function agua() {
  const p = 'mag';
  return `
<svg class="mod-svg" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <defs>${HULL_DEFS(p)}
    <linearGradient id="${p}-w" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8FE3FF"/><stop offset=".4" stop-color="#2FA8F5"/><stop offset="1" stop-color="#0A4FB0"/>
    </linearGradient>
    <clipPath id="${p}-clip"><rect x="52" y="24" width="96" height="100" rx="28"/></clipPath>
  </defs>
  ${hull(p, 12, 8, 176, 134, 34)}
  <rect x="22" y="56" width="22" height="10" rx="5" fill="#4C5A94"/><rect x="156" y="98" width="34" height="10" rx="5" fill="#4C5A94"/>
  <g class="mod-ticks" stroke="#9BB4FF" stroke-opacity=".5" stroke-width="2" stroke-linecap="round">
    <line x1="30" y1="32" x2="40" y2="32"/><line x1="30" y1="50" x2="36" y2="50"/><line x1="30" y1="74" x2="40" y2="74"/>
    <line x1="30" y1="98" x2="36" y2="98"/><line x1="30" y1="118" x2="40" y2="118"/>
  </g>
  <rect x="48" y="20" width="104" height="108" rx="32" fill="#0A1434" stroke="rgba(255,255,255,.28)" stroke-width="2"/>
  <g clip-path="url(#${p}-clip)">
    <g class="water-level">
      <path class="water-wave water-wave--back" d="M-100 24 Q-75 16 -50 24 T0 24 T50 24 T100 24 T150 24 T200 24 T250 24 V200 H-100Z" fill="#5AC8FA" opacity=".45"/>
      <path class="water-wave" d="M-100 28 Q-75 20 -50 28 T0 28 T50 28 T100 28 T150 28 T200 28 T250 28 V200 H-100Z" fill="url(#${p}-w)"/>
      <circle class="bubble" cx="80" cy="110" r="3.5" fill="#fff" opacity=".55"/>
      <circle class="bubble bubble--2" cx="112" cy="116" r="2.5" fill="#fff" opacity=".5"/>
      <circle class="bubble bubble--3" cx="96" cy="120" r="4" fill="#fff" opacity=".4"/>
    </g>
  </g>
  <rect x="58" y="30" width="12" height="78" rx="6" fill="#fff" opacity=".12"/>
  <path class="drop-icon" d="M100 52 C92 64 88 70 88 76 a12 12 0 0 0 24 0 c0 -6 -4 -12 -12 -24Z" fill="#fff" opacity=".9"/>
</svg>`;
}

function plant(cx, cy, s = 1, delay = 0) {
  let leaves = '';
  const n = 7;
  for (let i = 0; i < n; i++) {
    const ang = -90 + (i - (n - 1) / 2) * 26;
    leaves += `<ellipse cx="0" cy="-9" rx="4.6" ry="10" transform="rotate(${ang + 90})"/>`;
  }
  return `
  <g transform="translate(${cx} ${cy}) scale(${s})">
    <g class="plant" style="animation-delay:${delay}s">
      <path class="plant-stem" d="M0 0 C-2 -14 2 -24 0 -36" stroke="#5FAE6E" stroke-width="2" fill="none"/>
      <g class="plant-flowers" fill="#FFFFFF"><circle cx="0" cy="-37" r="2.4"/><circle cx="-3.5" cy="-31" r="1.8"/><circle cx="3.2" cy="-27" r="1.8"/></g>
      <g class="plant-leaves">${leaves}</g>
    </g>
  </g>`;
}

function comida() {
  const p = 'mco';
  return `
<svg class="mod-svg" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <defs>${HULL_DEFS(p)}
    <linearGradient id="${p}-light" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FF7AE0" stop-opacity=".55"/><stop offset="1" stop-color="#FF7AE0" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${p}-glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#B8FFE0" stop-opacity=".22"/><stop offset="1" stop-color="#64D2FF" stop-opacity=".06"/>
    </linearGradient>
  </defs>
  ${hull(p, 12, 92, 176, 50, 22)}
  <path d="M28 120 L28 80 Q28 22 100 18 Q172 22 172 80 L172 120Z" fill="url(#${p}-glass)" stroke="rgba(190,255,230,.6)" stroke-width="2.5"/>
  <path d="M100 18 V120 M62 28 Q50 70 52 120 M138 28 Q150 70 148 120 M30 70 H170" stroke="rgba(190,255,230,.22)" stroke-width="1.6" fill="none"/>
  <polygon class="grow-cone" points="56,44 144,44 166,116 34,116" fill="url(#${p}-light)"/>
  <rect class="grow-light" x="56" y="38" width="88" height="7" rx="3.5" fill="#FF7AE0"/>
  <rect x="32" y="108" width="136" height="16" rx="7" fill="#6B4430"/>
  <rect x="32" y="108" width="136" height="4" rx="2" fill="#8A5A3E"/>
  <g class="plants">
    ${plant(52, 110, 1.05, 0)}${plant(76, 110, 0.9, 0.4)}${plant(100, 110, 1.15, 0.8)}${plant(124, 110, 0.95, 0.2)}${plant(148, 110, 1.0, 0.6)}
  </g>
</svg>`;
}

function escudos() {
  const p = 'mes';
  return `
<svg class="mod-svg" viewBox="0 0 240 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <defs>${HULL_DEFS(p)}
    <pattern id="${p}-hex" width="14" height="24" patternUnits="userSpaceOnUse">
      <path d="M7 0 L14 4 L14 12 L7 16 L0 12 L0 4Z M7 16 V24" fill="none" stroke="#8AD8FF" stroke-width="1.1"/>
    </pattern>
    <radialGradient id="${p}-dome" cx="50%" cy="100%" r="100%">
      <stop offset="0" stop-color="#0A84FF" stop-opacity=".05"/><stop offset=".7" stop-color="#0A84FF" stop-opacity=".28"/>
      <stop offset="1" stop-color="#64D2FF" stop-opacity=".7"/>
    </radialGradient>
  </defs>
  <g class="shield-field">
    <path d="M22 126 A98 106 0 0 1 218 126Z" fill="url(#${p}-dome)"/>
    <path d="M22 126 A98 106 0 0 1 218 126Z" fill="url(#${p}-hex)" opacity=".7"/>
    <path class="shield-rim" d="M22 126 A98 106 0 0 1 218 126" fill="none" stroke="#9BE7FF" stroke-width="3"/>
  </g>
  <path class="water-wall" d="M38 126 A82 90 0 0 1 202 126" fill="none" stroke="#5AC8FA" stroke-width="9" stroke-linecap="round"/>
  <path class="water-wall water-wall--shine" d="M38 126 A82 90 0 0 1 202 126" fill="none" stroke="#E0F7FF" stroke-width="2" stroke-dasharray="6 14" stroke-linecap="round"/>
  ${hull(p, 58, 70, 124, 58, 24)}
  <circle cx="80" cy="94" r="8" fill="#0A1434" stroke="#9BE7FF" stroke-opacity=".6" stroke-width="2"/>
  <circle cx="160" cy="94" r="8" fill="#0A1434" stroke="#9BE7FF" stroke-opacity=".6" stroke-width="2"/>
  <rect class="shelter-door" x="106" y="86" width="28" height="42" rx="12" fill="#0A1434" stroke="#FFD60A" stroke-opacity=".7" stroke-width="2"/>
  <rect class="shelter-light" x="111" y="91" width="18" height="6" rx="3" fill="#FFD60A"/>
  <rect x="16" y="124" width="208" height="20" rx="10" fill="url(#${p}-hull)" stroke="url(#${p}-rim)" stroke-width="2"/>
  <g fill="#64D2FF" opacity=".7"><circle cx="40" cy="134" r="2.5"/><circle cx="70" cy="134" r="2.5"/><circle cx="170" cy="134" r="2.5"/><circle cx="200" cy="134" r="2.5"/></g>
</svg>`;
}

function oxigeno() {
  const p = 'mox';
  const tank = (x, label = '') => `
    <rect x="${x}" y="30" width="34" height="88" rx="17" fill="url(#${p}-tank)" stroke="rgba(255,255,255,.5)" stroke-width="2"/>
    <rect x="${x + 9}" y="22" width="16" height="10" rx="4" fill="#9BB4FF"/>
    <g clip-path="url(#${p}-c${x})">
      <circle class="o2-bubble" cx="${x + 11}" cy="112" r="3" fill="#fff"/>
      <circle class="o2-bubble o2-bubble--2" cx="${x + 22}" cy="116" r="2.2" fill="#fff"/>
      <circle class="o2-bubble o2-bubble--3" cx="${x + 17}" cy="118" r="3.6" fill="#fff"/>
    </g>
    ${label}`;
  return `
<svg class="mod-svg" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <defs>${HULL_DEFS(p)}
    <linearGradient id="${p}-tank" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#BDEBFF" stop-opacity=".35"/><stop offset=".45" stop-color="#E9FAFF" stop-opacity=".55"/><stop offset="1" stop-color="#64D2FF" stop-opacity=".3"/>
    </linearGradient>
    ${[44, 83, 122].map((x) => `<clipPath id="${p}-c${x}"><rect x="${x}" y="30" width="34" height="88" rx="17"/></clipPath>`).join('')}
  </defs>
  ${hull(p, 12, 10, 176, 132, 34)}
  ${tank(44)}${tank(83, `<text x="100" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="15" fill="#0A3D73">O₂</text>`)}${tank(122)}
  <rect x="40" y="124" width="120" height="8" rx="4" fill="#0A1434"/>
  <rect class="air-bar" x="40" y="124" width="120" height="8" rx="4" fill="#64D2FF"/>
</svg>`;
}

export const MODULE_ART = { agua, comida, escudos, oxigeno };

/** Llave inglesa para el indicador de avería. */
export const WRENCH_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M22.7 19.3l-8.6-8.6c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3l4.4 4.4-3 3-4.5-4.4C1 7.9 1.4 10.9 3.4 12.9c1.9 1.9 4.6 2.4 6.9 1.5l8.6 8.6c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1 .1-1.4z"/></svg>`;

export const BOLT_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.4 2.2 4.6 13.3c-.4.5 0 1.2.6 1.2h5.4l-1.3 7.1c-.1.7.8 1.1 1.2.5l8.8-11.1c.4-.5 0-1.2-.6-1.2h-5.4l1.3-7.1c.1-.7-.8-1.1-1.2-.5z"/></svg>`;
