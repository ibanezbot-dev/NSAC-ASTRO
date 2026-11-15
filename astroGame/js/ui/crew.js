/**
 * Tripulación en escena (5 Astronautas) — Movimiento exclusivo por los conductos lunares presurizados:
 *  - Grafo de nodos y esclusas (airlocks) alineado al píxel con los túneles del SVG (.station-architecture 1200x720).
 *  - Los astronautas caminan únicamente por dentro de los conductos transparentes entre Agua, Comida,
 *    Escudos, Oxígeno y el Nodo Central Lunar (Hub), sin pisar jamás fuera de las tuberías ni tapar textos.
 */
import { astronautSVG } from '../art/astronaut.js';
import { clamp, lerp, prefersReducedMotion } from '../util.js';

/**
 * Coordenadas exactas en el viewBox 1200×720 convertidas a 0..1 del tablero (#station-board).
 * Cada nodo coincide exactamente con el eje central de un conducto o esclusa lunar.
 */
const pt = (x, y) => ({ x: x / 1200, y: y / 720 });

const GRAPH_NODES = {
  // Esclusas (Airlocks) de cada una de las 4 bases lunares
  agua_0:    pt(326, 168), // Esclusa Este de Agua (conducto superior y diagonal al Hub)
  agua_1:    pt(258, 316), // Esclusa Sur de Agua (conducto izquierdo hacia Escudos)
  comida_0:  pt(874, 168), // Esclusa Oeste de Comida (conducto superior y diagonal al Hub)
  comida_1:  pt(990, 316), // Esclusa Sur de Comida (conducto vertical hacia Oxígeno)
  escudos_0: pt(394, 504), // Esclusa Oeste de Escudos (conducto desde Agua y desde Hub)
  escudos_2: pt(600, 378), // Esclusa Norte de Escudos (conducto central desde Hub)
  escudos_1: pt(806, 540), // Esclusa Este de Escudos (conducto inferior hacia Oxígeno)
  oxigeno_1: pt(990, 410), // Esclusa Norte de Oxígeno (conducto vertical desde Comida)
  oxigeno_0: pt(876, 540), // Esclusa Oeste de Oxígeno (conducto inferior y diagonal al Hub)
  shelter:   pt(600, 465), // Interior del domo de Escudos (refugio)

  // Nodos intermedios sobre los ejes de los conductos presurizados
  top_mid:   pt(600, 168), // Conducto superior Agua <-> Comida
  hub:       pt(600, 285), // Nodo Central Lunar de distribución (conecta las 4 bases)
  left_mid:  pt(326, 410), // Conducto izquierdo Agua <-> Escudos
  right_mid: pt(990, 364), // Conducto derecho Comida <-> Oxígeno
  bot_mid:   pt(842, 540), // Conducto inferior Escudos <-> Oxígeno
};

/**
 * Cada arista de GRAPH_EDGES corresponde 1 a 1 con un conducto dibujado en el SVG.
 * Así los astronautas SOLO caminan dentro de los túneles presurizados.
 */
const GRAPH_EDGES = {
  agua_0:    ['top_mid', 'hub', 'agua_1'],
  agua_1:    ['agua_0', 'left_mid'],
  top_mid:   ['agua_0', 'comida_0', 'hub'],
  comida_0:  ['top_mid', 'hub', 'comida_1'],
  comida_1:  ['comida_0', 'right_mid'],
  right_mid: ['comida_1', 'oxigeno_1'],
  oxigeno_1: ['right_mid', 'oxigeno_0'],
  oxigeno_0: ['oxigeno_1', 'bot_mid', 'hub'],
  bot_mid:   ['oxigeno_0', 'escudos_1'],
  escudos_1: ['bot_mid', 'shelter'],
  escudos_2: ['hub', 'shelter'],
  escudos_0: ['left_mid', 'hub', 'shelter'],
  left_mid:  ['agua_1', 'escudos_0'],
  hub:       ['agua_0', 'top_mid', 'comida_0', 'escudos_0', 'escudos_2', 'oxigeno_0'],
  shelter:   ['escudos_2', 'escudos_0', 'escudos_1'],
};

const MODULE_SLOTS = {
  agua:    ['agua_0', 'agua_1', 'left_mid'],
  comida:  ['comida_0', 'comida_1', 'top_mid'],
  escudos: ['escudos_2', 'escudos_0', 'escudos_1'],
  oxigeno: ['oxigeno_0', 'oxigeno_1', 'bot_mid'],
};

const HOME_NODES = ['escudos_0', 'agua_0', 'comida_0', 'oxigeno_0', 'hub'];

const PATROL_NEIGHBORS = {
  escudos_0: ['left_mid', 'hub', 'escudos_2'],
  agua_0:    ['top_mid', 'hub', 'agua_1'],
  comida_0:  ['top_mid', 'hub', 'comida_1'],
  oxigeno_0: ['bot_mid', 'oxigeno_1', 'hub'],
  hub:       ['top_mid', 'agua_0', 'comida_0', 'escudos_2', 'oxigeno_0'],
};

/** Búsqueda BFS de camino más corto exclusivamente por la red de conductos. */
function findTubePath(fromNode, toNode) {
  if (!fromNode || !toNode || fromNode === toNode) return [toNode];
  const queue = [[fromNode]];
  const visited = new Set([fromNode]);
  while (queue.length > 0) {
    const path = queue.shift();
    const curr = path[path.length - 1];
    const neighbors = GRAPH_EDGES[curr] || [];
    for (const next of neighbors) {
      if (next === toNode) return [...path, next];
      if (!visited.has(next)) {
        visited.add(next);
        queue.push([...path, next]);
      }
    }
  }
  return [fromNode, toNode];
}

export class CrewLayer {
  constructor(container) {
    this.container = container;
    this.members = [];
    this.boardSize = { w: 1200, h: 720 };
    this.lastState = null;
    this.raf = 0;
    this.lastTick = 0;
  }

  mount(crew) {
    this.stopLoop();
    this.container.innerHTML = '';
    this.members = crew.map((c, i) => {
      const el = document.createElement('div');
      el.className = `astro${c.isCommander ? ' is-commander' : ''}`;
      el.style.setProperty('--i', i);
      el.innerHTML = `
        <div class="astro__inner">${astronautSVG(c, { decorative: true })}</div>
        <span class="astro__bubble" aria-hidden="true"></span>
        ${c.isCommander ? '<span class="astro__star" aria-hidden="true">★</span>' : ''}`;
      this.container.appendChild(el);

      const startNode = HOME_NODES[i % HOME_NODES.length];
      const n = GRAPH_NODES[startNode];
      return {
        data: c,
        el,
        index: i,
        homeNode: startNode,
        currentNode: startNode,
        targetNode: startNode,
        x: n.x,
        y: n.y,
        face: i % 2 === 0 ? 1 : -1,
        tilt: 0,
        waypoints: [],
        segFrom: { x: n.x, y: n.y },
        segTo: { x: n.x, y: n.y },
        segProgress: 1,
        segDuration: 0.6,
        mode: 'home',
        inside: false,
        patrolTimer: 2.0 + i * 1.1,
        phaseOffset: i * 1.35,
      };
    });
    this.startLoop();
  }

  setAnchors(anchors) {
    if (anchors?.board) {
      this.boardSize = { w: anchors.board.w, h: anchors.board.h };
    } else if (this.container.clientWidth && this.container.clientHeight) {
      this.boardSize = { w: this.container.clientWidth, h: this.container.clientHeight };
    }
    this.renderPositions(0);
  }

  update(s, { instant = false } = {}) {
    this.lastState = s;
    const assign = new Array(this.members.length).fill(null);

    if (!s.sheltered) {
      const order = Object.entries(s.allocation || {})
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1]);

      for (const [modId, count] of order) {
        const slots = MODULE_SLOTS[modId] || ['hub'];
        for (let k = 0; k < count; k++) {
          const slotNode = slots[k % slots.length];
          let pick = this.members.findIndex((m, idx) => assign[idx] === null && m.data.home === modId);
          if (pick < 0) {
            pick = this.members.findIndex((_, idx) => assign[idx] === null);
          }
          if (pick < 0) break;
          assign[pick] = { modId, node: slotNode };
        }
      }
    }

    this.members.forEach((m, i) => {
      const energy = s.energies?.[i] ?? 100;
      m.el.classList.toggle('is-tired', energy < 40);
      m.el.classList.toggle('is-ok', energy >= 40 && energy < 75);
      const bubble = m.el.querySelector('.astro__bubble');
      if (bubble) bubble.textContent = energy < 40 ? '💤' : '';

      const isYoung = s.ageMode === '7-9';
      let destNode = isYoung && m.homeNode === 'oxigeno_0' ? 'comida_0' : m.homeNode;
      let mode = 'home';

      if (s.sheltered) {
        destNode = 'shelter';
        mode = 'shelter';
      } else if (assign[i]) {
        destNode = assign[i].node;
        mode = 'work';
      }

      m.mode = mode;
      if (mode !== 'shelter' && m.inside) {
        m.inside = false;
        m.el.classList.remove('is-inside');
      }

      this.routeMemberTo(m, destNode, instant);
    });
  }

  routeMemberTo(m, destNode, instant = false) {
    if (!GRAPH_NODES[destNode]) return;
    m.targetNode = destNode;

    if (instant || prefersReducedMotion()) {
      const p = GRAPH_NODES[destNode];
      m.currentNode = destNode;
      m.x = p.x;
      m.y = p.y;
      m.waypoints = [];
      m.segProgress = 1;
      m.el.classList.remove('is-walking');
      m.el.classList.toggle('is-working', m.mode === 'work');
      if (m.mode === 'shelter') {
        m.inside = true;
        m.el.classList.add('is-inside');
      }
      return;
    }

    const startKey = m.currentNode || m.homeNode;
    const pathKeys = findTubePath(startKey, destNode);

    m.waypoints = pathKeys.slice(1).map((key) => {
      const base = GRAPH_NODES[key];
      return {
        key,
        x: base.x,
        y: base.y,
      };
    });

    if (m.waypoints.length > 0 && m.segProgress >= 1) {
      this.advanceSegment(m);
    }
  }

  advanceSegment(m) {
    const next = m.waypoints.shift();
    if (!next) {
      m.segProgress = 1;
      m.tilt = 0;
      m.el.classList.remove('is-walking');
      m.el.classList.toggle('is-working', m.mode === 'work');
      if (m.mode === 'shelter') {
        m.inside = true;
        m.el.classList.add('is-inside');
      }
      return;
    }

    m.segFrom = { x: m.x, y: m.y };
    m.segTo = { x: next.x, y: next.y };
    m.currentNode = next.key;
    m.segProgress = 0;

    const dx = m.segTo.x - m.segFrom.x;
    const dy = m.segTo.y - m.segFrom.y;
    const dist = Math.hypot(dx, dy);
    const speed = m.mode === 'shelter' ? 0.42 : 0.28;
    m.segDuration = clamp(dist / speed, 0.35, 1.35);

    if (Math.abs(dx) > 0.004) {
      m.face = dx < 0 ? -1 : 1;
      m.tilt = dx < 0 ? -3.5 : 3.5;
    }
    m.el.classList.add('is-walking');
    m.el.classList.remove('is-working');
  }

  startLoop() {
    if (this.raf) return;
    this.lastTick = performance.now();
    const step = (now) => {
      const dt = Math.min(0.06, (now - this.lastTick) / 1000);
      this.lastTick = now;
      this.tick(dt, now / 1000);
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  stopLoop() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  tick(dt, timeSec) {
    const reduced = prefersReducedMotion();
    for (const m of this.members) {
      if (m.segProgress < 1) {
        m.segProgress = Math.min(1, m.segProgress + dt / m.segDuration);
        // Movimiento estrictamente lineal sobre el eje del conducto (sin salirse del tubo)
        const t = m.segProgress * m.segProgress * (3 - 2 * m.segProgress);
        m.x = lerp(m.segFrom.x, m.segTo.x, t);
        m.y = lerp(m.segFrom.y, m.segTo.y, t);

        if (m.segProgress >= 1) {
          this.advanceSegment(m);
        }
      } else if (!reduced && m.mode === 'home' && !m.inside) {
        m.patrolTimer -= dt;
        if (m.patrolTimer <= 0) {
          m.patrolTimer = 4.0 + Math.random() * 3.2;
          const options = PATROL_NEIGHBORS[m.homeNode] || ['hub'];
          const pick = options[Math.floor(Math.random() * options.length)];
          const dest = m.currentNode === m.homeNode ? pick : m.homeNode;
          this.routeMemberTo(m, dest, false);
        }
      }
    }
    this.renderPositions(timeSec);
  }

  renderPositions(timeSec) {
    const { w, h } = this.boardSize;
    if (!w || !h) return;
    const reduced = prefersReducedMotion();

    for (const m of this.members) {
      const idleBob = reduced || m.inside ? 0 : Math.sin(timeSec * 2.4 + m.phaseOffset) * 1.4;
      const px = m.x * w;
      const py = m.y * h + idleBob;

      m.el.style.setProperty('--px', `${px.toFixed(1)}px`);
      m.el.style.setProperty('--py', `${py.toFixed(1)}px`);
      m.el.style.setProperty('--face', String(m.face));
      m.el.style.setProperty('--tilt', `${m.segProgress < 1 ? m.tilt : 0}deg`);
    }
  }

  react(kind) {
    this.members.forEach((m, i) => {
      if (m.inside) return;
      m.el.classList.remove('react-happy', 'react-hit');
      void m.el.offsetWidth;
      m.el.classList.add(kind === 'hit' ? 'react-hit' : 'react-happy');
      m.el.style.setProperty('--react-delay', `${i * 60}ms`);
    });
  }

  insideCount() {
    return this.members.filter((m) => m.mode === 'shelter').length;
  }
}
