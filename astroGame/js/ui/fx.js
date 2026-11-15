/**
 * Partículas de clima espacial sobre <canvas> (alta densidad / retina).
 * Las partículas SEP salen del Sol; el domo de Escudos las desvía según el blindaje.
 */
import { prefersReducedMotion } from '../util.js';

const PALETTE = {
  calma: { color: [255, 225, 120], count: 14, speed: 0.25 },
  claseM: { color: [255, 170, 60], count: 70, speed: 0.75 },
  claseX: { color: [255, 80, 70], count: 170, speed: 1.0 },
};
const DEFLECT = { 1: 0.05, 2: 0.6, 3: 0.95 };

export class StormFX {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.parts = [];
    this.raf = 0;
    this.w = 0;
    this.h = 0;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /**
   * @param {{eventId:string, origin:{x:number,y:number}, shield:{x,y,w,h}, blindaje:number, duration?:number}} o
   * @returns {Promise<{hits:number, blocked:number}>}
   */
  burst({ eventId, origin, shield, blindaje, duration = 1700 }) {
    const cfg = PALETTE[eventId] ?? PALETTE.calma;
    const reduced = prefersReducedMotion();
    if (!this.w) this.resize();
    const min = Math.min(this.w, this.h);
    const count = reduced ? Math.round(cfg.count / 4) : cfg.count;
    const dome = { cx: shield.x + shield.w / 2, cy: shield.y + shield.h * 0.84, rx: shield.w * 0.47, ry: shield.h * 0.78 };
    const stats = { hits: 0, blocked: 0 };

    for (let i = 0; i < count; i++) {
      const tx = this.w * (0.08 + Math.random() * 0.84);
      const ty = this.h * (0.45 + Math.random() * 0.5);
      const ang = Math.atan2(ty - origin.y, tx - origin.x);
      const sp = min * cfg.speed * (0.7 + Math.random() * 0.6);
      this.parts.push({
        x: origin.x + (Math.random() - 0.5) * min * 0.06,
        y: origin.y + (Math.random() - 0.5) * min * 0.06,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        delay: Math.random() * duration * 0.55,
        life: 1,
        deflected: false,
        willDeflect: Math.random() < DEFLECT[blindaje],
        color: cfg.color,
        size: 1 + Math.random() * (eventId === 'claseX' ? 2.2 : 1.5),
      });
    }

    this.dome = dome;
    this.stats = stats;
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame((t) => this.tick(t));
    }
    return new Promise((resolve) => setTimeout(() => resolve(stats), duration));
  }

  tick(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const { ctx, dome } = this;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.parts) {
      if (p.delay > 0) { p.delay -= dt * 1000; continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (!p.deflected && dome) {
        const nx = (p.x - dome.cx) / dome.rx;
        const ny = (p.y - dome.cy) / dome.ry;
        if (nx * nx + ny * ny < 1 && p.y < dome.cy) {
          if (p.willDeflect) {
            // Reflexión sobre la normal del elipsoide → rebote cian.
            const len = Math.hypot(nx, ny) || 1;
            const ux = nx / len;
            const uy = ny / len;
            const dot = p.vx * ux + p.vy * uy;
            p.vx -= 2 * dot * ux;
            p.vy -= 2 * dot * uy;
            p.vx *= 0.6; p.vy *= 0.6;
            p.color = [120, 220, 255];
            p.deflected = true;
            this.stats.blocked++;
            this.spark(p.x, p.y);
          } else {
            p.deflected = true;
            this.stats.hits++;
          }
        }
      }
      p.life -= dt * (p.deflected ? 1.6 : 0.55);
      if (p.life <= 0) continue;
      const [r, g, b] = p.color;
      const tail = 0.06;
      const grad = ctx.createLinearGradient(p.x, p.y, p.x - p.vx * tail, p.y - p.vy * tail);
      grad.addColorStop(0, `rgba(${r},${g},${b},${0.95 * p.life})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = p.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * tail, p.y - p.vy * tail);
      ctx.stroke();
    }

    if (this.sparks?.length) {
      for (const s of this.sparks) {
        s.life -= dt * 2.4;
        if (s.life <= 0) continue;
        ctx.fillStyle = `rgba(160,235,255,${s.life * 0.8})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, (1 - s.life) * 9 + 1, 0, Math.PI * 2);
        ctx.fill();
      }
      this.sparks = this.sparks.filter((s) => s.life > 0);
    }

    this.parts = this.parts.filter((p) => p.life > 0 && p.x > -50 && p.x < this.w + 50 && p.y < this.h + 50 && p.y > -80);
    ctx.globalCompositeOperation = 'source-over';
    if (this.parts.length || this.sparks?.length) {
      this.raf = requestAnimationFrame((t) => this.tick(t));
    } else {
      this.raf = 0;
      ctx.clearRect(0, 0, this.w, this.h);
    }
  }

  spark(x, y) {
    (this.sparks ??= []).push({ x, y, life: 1 });
  }
}
