/**
 * Fondos ilustrados vectoriales — Escenario Lunar (Base Lunar en la superficie de la Luna).
 * Escalan sin pérdida de 4.6" a 32" 4K con preserveAspectRatio="xMidYMid slice".
 */
import { createRng } from '../util.js';

function stars(rng, count, w, h, { minR = 0.6, maxR = 2.2, avoid = null } = {}) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = rng() * w;
    const y = rng() * h;
    if (avoid && avoid(x, y)) continue;
    const r = minR + rng() ** 3 * (maxR - minR);
    const o = (0.35 + rng() * 0.65).toFixed(2);
    const tw = rng() < 0.18 ? ` class="twinkle" style="animation-delay:${(rng() * 4).toFixed(2)}s"` : '';
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" opacity="${o}"${tw}/>`;
  }
  return out;
}

/** Cráter lunar elíptico con borde iluminado y sombra interior. */
function crater(cx, cy, rx, ry = rx * 0.52, rot = 0) {
  return `
  <g transform="translate(${cx} ${cy}) rotate(${rot})">
    <ellipse cx="0" cy="${(ry * 0.12).toFixed(1)}" rx="${(rx * 1.08).toFixed(1)}" ry="${(ry * 1.1).toFixed(1)}" fill="#5E6E9E" opacity=".35"/>
    <ellipse cx="0" cy="0" rx="${rx}" ry="${ry}" fill="url(#lunar-crater-in)" stroke="#6B7CAE" stroke-opacity=".45" stroke-width="2"/>
    <path d="M ${(-rx * 0.85).toFixed(1)} ${(-ry * 0.15).toFixed(1)} A ${rx} ${ry} 0 0 1 ${(rx * 0.85).toFixed(1)} ${(-ry * 0.15).toFixed(1)}"
      fill="none" stroke="#141A36" stroke-opacity=".65" stroke-width="${Math.max(2, rx * 0.08).toFixed(1)}" stroke-linecap="round"/>
    <path d="M ${(-rx * 0.78).toFixed(1)} ${(ry * 0.25).toFixed(1)} A ${rx} ${ry} 0 0 0 ${(rx * 0.78).toFixed(1)} ${(ry * 0.25).toFixed(1)}"
      fill="none" stroke="#9FB2E8" stroke-opacity=".38" stroke-width="${Math.max(1.5, rx * 0.05).toFixed(1)}" stroke-linecap="round"/>
  </g>`;
}

/** Vista 1: Domo de comando en la Luna con vista al suelo lunar y la Tierra en el cielo. */
export function startBackdropSVG() {
  const rng = createRng(11);
  const VP = { x: 800, y: 440 };
  let rings = '';
  for (let i = 0; i < 5; i++) {
    const s = 1.12 - i * 0.17;
    const w = 1680 * s;
    const h = 1120 * s;
    const op = (0.1 + i * 0.06).toFixed(2);
    rings += `<rect x="${VP.x - w / 2}" y="${VP.y - h / 2}" width="${w}" height="${h}" rx="${150 * s}"
      fill="none" stroke="#7FA8FF" stroke-opacity="${(0.05 + i * 0.03).toFixed(2)}" stroke-width="${42 * s}"/>
      <rect x="${VP.x - w / 2}" y="${VP.y - h / 2}" width="${w}" height="${h}" rx="${150 * s}"
      fill="none" stroke="#64D2FF" stroke-opacity="${op}" stroke-width="2.2" stroke-dasharray="${i % 2 ? '18 22' : 'none'}"/>`;
  }

  return `
<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="sb-bg" cx="50%" cy="35%" r="78%">
      <stop offset="0" stop-color="#1D275E"/><stop offset=".5" stop-color="#0E1438"/><stop offset="1" stop-color="#04071A"/>
    </radialGradient>
    <linearGradient id="sb-moon-ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4B5989"/><stop offset=".35" stop-color="#333E68"/><stop offset="1" stop-color="#192040"/>
    </linearGradient>
    <radialGradient id="sb-earth" cx="35%" cy="30%" r="75%">
      <stop offset="0" stop-color="#9BE7FF"/><stop offset=".4" stop-color="#2F8FE0"/><stop offset=".78" stop-color="#1A4FA8"/><stop offset="1" stop-color="#0B1E55"/>
    </radialGradient>
    <radialGradient id="sb-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#64D2FF" stop-opacity=".42"/><stop offset="1" stop-color="#64D2FF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="lunar-crater-in" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1B2347"/><stop offset="1" stop-color="#3B4775"/>
    </linearGradient>
  </defs>

  <!-- Cielo estrellado lunar -->
  <rect width="1600" height="1000" fill="url(#sb-bg)"/>
  <g>${stars(rng, 160, 1600, 560)}</g>

  <!-- La Tierra vista desde la Luna -->
  <g transform="translate(1240 190)">
    <circle r="86" fill="#64D2FF" opacity=".15"/>
    <circle r="70" fill="url(#sb-earth)"/>
    <path d="M-38 -18 q22 -18 46 -4 t34 10 q12 18 -8 30 t-52 -4Z M10 26 q26 -10 44 8 q-14 22 -40 16Z" fill="#34C77B" opacity=".65"/>
    <path d="M-45 8 q30 -12 65 4" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45" fill="none"/>
    <circle r="72" fill="none" stroke="#9BE7FF" stroke-opacity=".55" stroke-width="4"/>
  </g>

  <!-- Cordilleras lunares en el horizonte -->
  <path d="M0 540 L140 465 L290 515 L470 440 L640 505 L810 450 L980 510 L1160 445 L1350 495 L1490 455 L1600 520 V1000 H0Z" fill="#273157"/>
  <path d="M0 575 Q260 515 540 555 T1100 545 T1600 570 V1000 H0Z" fill="url(#sb-moon-ground)"/>

  <!-- Cráteres lunares visibles alrededor -->
  ${crater(210, 680, 95, 44, -6)}
  ${crater(390, 820, 64, 30, 4)}
  ${crater(1340, 700, 105, 48, 8)}
  ${crater(1190, 845, 70, 32, -5)}
  ${crater(800, 890, 130, 52, 0)}

  <!-- Estructura de ventana del domo lunar -->
  ${rings}
  <circle cx="${VP.x}" cy="${VP.y}" r="310" fill="url(#sb-glow)"/>
  <circle cx="${VP.x}" cy="${VP.y}" r="252" fill="none" stroke="#64D2FF" stroke-opacity=".65" stroke-width="4"/>
  <circle cx="${VP.x}" cy="${VP.y}" r="268" fill="none" stroke="#FFFFFF" stroke-opacity=".12" stroke-width="12"/>
</svg>`;
}

/**
 * Vista 2: Superficie de la Luna donde están asentadas las 4 bases y sus conductos.
 * Incluye cielo estrellado en la franja superior, la Tierra en el horizonte,
 * montañas lunares, suelo gris-azulado con cráteres, rocas, huellas y rover lunar.
 */
export function stationBackdropSVG() {
  const rng = createRng(29);
  return `
<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#04071B"/><stop offset=".6" stop-color="#0D153B"/><stop offset="1" stop-color="#1C2859"/>
    </linearGradient>
    <radialGradient id="st-moon-lit" cx="50%" cy="38%" r="72%">
      <stop offset="0" stop-color="#4B5886"/>
      <stop offset=".48" stop-color="#36426C"/>
      <stop offset=".82" stop-color="#252E52"/>
      <stop offset="1" stop-color="#171D38"/>
    </radialGradient>
    <linearGradient id="st-ridge-far" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3C4978"/><stop offset="1" stop-color="#232B4E"/>
    </linearGradient>
    <linearGradient id="st-ridge-near" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#516092"/><stop offset="1" stop-color="#303B64"/>
    </linearGradient>
    <linearGradient id="lunar-crater-in" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1A2244"/><stop offset="1" stop-color="#3C4978"/>
    </linearGradient>
    <radialGradient id="st-earth" cx="35%" cy="30%" r="70%">
      <stop offset="0" stop-color="#A8ECFF"/><stop offset=".42" stop-color="#2E8CE0"/><stop offset=".8" stop-color="#15479E"/><stop offset="1" stop-color="#091B4E"/>
    </radialGradient>
    <radialGradient id="st-pad" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#1B2348" stop-opacity=".85"/>
      <stop offset=".75" stop-color="#26315E" stop-opacity=".65"/>
      <stop offset="1" stop-color="#4E5F94" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Cielo lunar estrellado (parte superior) -->
  <rect width="1600" height="320" fill="url(#st-sky)"/>
  <g>${stars(rng, 130, 1600, 250)}</g>

  <!-- Planeta Tierra brillando sobre el horizonte lunar -->
  <g transform="translate(495 104)">
    <circle r="58" fill="#64D2FF" opacity=".16"/>
    <circle r="44" fill="url(#st-earth)"/>
    <path d="M-23 -10 q14 -12 30 -3 t21 7 q7 12 -5 19 t-33 -3Z M5 15 q15 -7 26 5 q-9 14 -24 9Z" fill="#32D17D" opacity=".68"/>
    <path d="M-28 4 q19 -8 42 3" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".5" fill="none"/>
    <circle r="45.5" fill="none" stroke="#9BE7FF" stroke-opacity=".6" stroke-width="2.5"/>
  </g>

  <!-- Cordilleras y montañas de la Luna en el horizonte -->
  <path d="M0 245 L95 190 L210 228 L355 168 L490 222 L620 182 L760 225 L910 175 L1065 224 L1215 165 L1365 218 L1495 178 L1600 225 V320 H0Z"
    fill="url(#st-ridge-far)"/>
  <path d="M0 268 L150 222 L310 256 L460 212 L650 254 L830 216 L1010 256 L1185 214 L1380 254 L1520 224 L1600 252 V340 H0Z"
    fill="url(#st-ridge-near)"/>

  <!-- Suelo de la Luna (Regolito lunar donde se asienta toda la estación) -->
  <path d="M0 258 Q400 232 800 232 Q1200 232 1600 258 V1000 H0Z" fill="url(#st-moon-lit)"/>
  <!-- Brillo del horizonte lunar -->
  <path d="M0 258 Q400 232 800 232 Q1200 232 1600 258" fill="none" stroke="#8FA5DE" stroke-opacity=".45" stroke-width="3"/>

  <!-- Huellas sutiles de rover sobre el polvo lunar -->
  <g fill="none" stroke="#1E2649" stroke-opacity=".45" stroke-width="3" stroke-dasharray="6 8">
    <path d="M 120 790 Q 320 735 540 760"/>
    <path d="M 124 802 Q 324 747 544 772"/>
    <path d="M 600 295 Q 800 330 1050 290"/>
  </g>

  <!-- Cráteres lunares repartidos por la superficie -->
  ${crater(585, 290, 56, 25, -4)}
  ${crater(1015, 295, 48, 22, 6)}
  ${crater(155, 585, 78, 36, -8)}
  ${crater(290, 745, 92, 42, 5)}
  ${crater(1445, 560, 74, 34, 9)}
  ${crater(1055, 765, 58, 27, -6)}
  ${crater(445, 455, 44, 20, 3)}
  ${crater(1145, 445, 46, 21, -5)}
  ${crater(790, 865, 85, 36, 0)}
  ${crater(85, 860, 52, 24, 4)}
  ${crater(1510, 875, 64, 28, -7)}

  <!-- Plataformas lunares de anclaje bajo las 4 bases y el nodo central -->
  <ellipse cx="220" cy="340" rx="195" ry="90" fill="url(#st-pad)"/>
  <ellipse cx="1380" cy="340" rx="195" ry="90" fill="url(#st-pad)"/>
  <ellipse cx="800" cy="790" rx="260" ry="110" fill="url(#st-pad)"/>
  <ellipse cx="1380" cy="790" rx="195" ry="90" fill="url(#st-pad)"/>
  <ellipse cx="800" cy="495" rx="125" ry="62" fill="url(#st-pad)"/>

  <!-- Rocas lunares decorativas -->
  <g fill="#2B355E" stroke="#6E80B5" stroke-opacity=".4" stroke-width="1.5">
    <path d="M110 680 l14 -11 l18 4 l6 12 l-22 6Z"/>
    <path d="M138 686 l9 -6 l11 3 l3 7 l-14 3Z"/>
    <path d="M685 330 l12 -8 l15 3 l4 9 l-18 4Z"/>
    <path d="M1480 470 l16 -10 l19 5 l5 11 l-24 5Z"/>
  </g>

  <!-- Rover Lunar y Bandera junto al cráter inferior izquierdo -->
  <g transform="translate(215 795)" aria-hidden="true">
    <!-- Bandera lunar -->
    <line x1="-58" y1="8" x2="-58" y2="-34" stroke="#DCE6FF" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="-58" y="-34" width="28" height="17" rx="3" fill="#0A84FF" stroke="#8CE0FF" stroke-width="1.5"/>
    <circle cx="-44" cy="-25.5" r="4" fill="#FFD60A"/>
    <!-- Rover -->
    <ellipse cx="0" cy="14" rx="30" ry="7" fill="#10152E" opacity=".55"/>
    <rect x="-20" y="-6" width="40" height="14" rx="5" fill="#DCE6F5" stroke="#5AC8FA" stroke-width="1.8"/>
    <rect x="-8" y="-13" width="18" height="8" rx="3" fill="#0A84FF"/>
    <line x1="12" y1="-6" x2="20" y2="-22" stroke="#DCE6F5" stroke-width="2"/>
    <path d="M13 -25 Q20 -18 27 -25" fill="none" stroke="#FFD60A" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="-14" cy="10" r="6.5" fill="#1E2442" stroke="#8CE0FF" stroke-width="2"/>
    <circle cx="0" cy="10" r="6.5" fill="#1E2442" stroke="#8CE0FF" stroke-width="2"/>
    <circle cx="14" cy="10" r="6.5" fill="#1E2442" stroke="#8CE0FF" stroke-width="2"/>
  </g>
</svg>`;
}
