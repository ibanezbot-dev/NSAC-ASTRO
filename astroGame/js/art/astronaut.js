/**
 * Astronauta vectorial paramétrico (comandantes y tripulación).
 * Las clases internas (.eye, .astro-leg, .astro-arm…) permiten animar
 * fatiga, caminar y saludar solo con CSS.
 */
import { uid } from '../util.js';

const BADGES = {
  star: '<path d="M0,-9 L2.6,-3 9,-2.8 4,1.4 5.6,8 0,4.4 -5.6,8 -4,1.4 -9,-2.8 -2.6,-3Z"/>',
  bolt: '<path d="M2,-10 L-6,1 -1,1 -3,10 6,-2 1,-2Z"/>',
  moon: '<path d="M3,-9 A9,9 0 1,0 3,9 A7,7 0 1,1 3,-9Z"/>',
  leaf: '<path d="M-7,7 C-8,-4 0,-9 8,-8 C8,1 3,8 -7,7Z"/>',
  heart: '<path d="M0,8 C-12,0 -8,-9 0,-4 C8,-9 12,0 0,8Z"/>',
  planet: '<circle r="6"/><ellipse rx="11" ry="3.6" fill="none" stroke-width="2.2" transform="rotate(-20)"/>',
};

export function astronautSVG(c, { label = c.name, decorative = false } = {}) {
  const id = uid('as');
  const a11y = decorative ? 'aria-hidden="true"' : `role="img" aria-label="${label}"`;
  return `
<svg class="astro-svg" viewBox="0 0 200 240" ${a11y} focusable="false">
  <defs>
    <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="${c.suit}"/>
    </linearGradient>
    <linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.visor}" stop-opacity=".95"/>
      <stop offset=".55" stop-color="#16204A"/><stop offset="1" stop-color="#070B22"/>
    </linearGradient>
  </defs>
  <ellipse class="astro-shadow" cx="100" cy="230" rx="50" ry="8" fill="#000" opacity=".28"/>
  <g class="astro-figure">
    <rect x="50" y="96" width="100" height="88" rx="24" fill="${c.accent}"/>
    <g class="astro-leg astro-leg--l">
      <rect x="70" y="174" width="26" height="46" rx="13" fill="url(#${id}s)"/>
      <rect x="65" y="206" width="35" height="19" rx="9.5" fill="${c.accent}"/>
    </g>
    <g class="astro-leg astro-leg--r">
      <rect x="104" y="174" width="26" height="46" rx="13" fill="url(#${id}s)"/>
      <rect x="100" y="206" width="35" height="19" rx="9.5" fill="${c.accent}"/>
    </g>
    <g class="astro-arm astro-arm--l">
      <rect x="36" y="110" width="26" height="60" rx="13" fill="url(#${id}s)" transform="rotate(16 49 116)"/>
      <circle cx="36" cy="166" r="13" fill="${c.accent}"/>
    </g>
    <g class="astro-arm astro-arm--r">
      <rect x="138" y="110" width="26" height="60" rx="13" fill="url(#${id}s)" transform="rotate(-16 151 116)"/>
      <circle cx="164" cy="166" r="13" fill="${c.accent}"/>
    </g>
    <rect x="56" y="100" width="88" height="90" rx="36" fill="url(#${id}s)"/>
    <rect x="80" y="124" width="40" height="26" rx="9" fill="#1C2347"/>
    <circle cx="90" cy="137" r="4" fill="#30D158"/><circle cx="100" cy="137" r="4" fill="#FFD60A"/><circle cx="110" cy="137" r="4" fill="${c.accent}"/>
    <g transform="translate(100 168)" fill="${c.accent}" stroke="${c.accent}">${BADGES[c.badge] ?? BADGES.star}</g>
    <ellipse cx="100" cy="112" rx="42" ry="11" fill="${c.accent}"/>
    <line x1="140" y1="26" x2="152" y2="7" stroke="${c.accent}" stroke-width="4.5" stroke-linecap="round"/>
    <circle class="astro-antenna" cx="153" cy="6" r="6.5" fill="${c.accent}"/>
    <circle cx="100" cy="66" r="58" fill="url(#${id}s)" stroke="rgba(0,0,0,.08)" stroke-width="2"/>
    <rect x="57" y="37" width="86" height="64" rx="32" fill="url(#${id}v)"/>
    <g class="astro-face">
      <ellipse class="eye" cx="85" cy="70" rx="6.5" ry="9" fill="#fff"/>
      <ellipse class="eye" cx="115" cy="70" rx="6.5" ry="9" fill="#fff"/>
      <path class="astro-mouth" d="M90 87 Q100 94 110 87" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </g>
    <path d="M67 56 Q72 43 90 41" stroke="#fff" stroke-width="5" opacity=".55" stroke-linecap="round" fill="none"/>
  </g>
</svg>`;
}
