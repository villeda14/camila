/* Garabatos de crayón que aparecen "de la nada" encima de las fotos */
import { CONFIG } from './config.js';

const NS = 'http://www.w3.org/2000/svg';
const COLORES = ['#ff5d8f', '#ff3b5c', '#ffd23f', '#ff9f1c', '#5bc0eb', '#8ac926', '#c77dff', '#ffffff', '#ff8fab'];
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* Cada forma vive en una caja de 100x100. "trazos" se dibujan uno tras otro; "relleno" es un garabato con clip. */
const FORMAS = {
  corazon: {
    trazos: ['M50 88 C20 66 8 46 13 29 C19 12 41 12 50 31 C59 12 81 12 87 29 C92 46 80 66 50 88 Z'],
    relleno: 'M22 30 L78 24 L20 40 L84 34 L24 50 L80 46 L32 60 L72 58 L40 70 L62 69 L50 80',
    clip: 'M50 88 C20 66 8 46 13 29 C19 12 41 12 50 31 C59 12 81 12 87 29 C92 46 80 66 50 88 Z'
  },
  estrella: { trazos: ['M50 8 L62 38 L94 40 L69 60 L78 92 L50 74 L22 92 L31 60 L6 40 L38 38 Z'] },
  destello: { trazos: ['M50 4 Q54 46 96 50 Q54 54 50 96 Q46 54 4 50 Q46 46 50 4 Z'] },
  flor: {
    trazos: [0, 72, 144, 216, 288].map((r) => ({ d: 'M50 50 C30 32 30 6 50 6 C70 6 70 32 50 50', rot: r })).concat([{ d: 'M44 50 C44 42 56 42 56 50 C56 58 44 58 44 50', rot: 0 }])
  },
  espiral: { trazos: ['M50 50 C50 44 58 44 58 50 C58 60 42 60 42 48 C42 33 63 31 67 48 C71 68 38 76 30 52 C23 30 50 18 72 30'] },
  ola: { trazos: ['M4 50 Q14 28 24 50 T44 50 T64 50 T84 50 T98 50'], vb: [100, 100] },
  sol: {
    trazos: ['M50 34 C60 34 66 40 66 50 C66 60 60 66 50 66 C40 66 34 60 34 50 C34 40 40 34 50 34']
      .concat([0, 45, 90, 135, 180, 225, 270, 315].map((r) => ({ d: 'M50 16 L50 6', rot: r })))
  },
  corazonChico: { trazos: ['M50 84 C26 66 16 50 20 36 C25 22 43 22 50 38 C57 22 75 22 80 36 C84 50 74 66 50 84 Z'] },
  flecha: { trazos: ['M8 70 C30 20 60 20 90 56', 'M74 50 L91 58 L84 38'] }
};

function crearSVG(forma, color) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('aria-hidden', 'true'); svg.classList.add('doodle-svg');
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('fill', 'none'); g.setAttribute('stroke', color); g.setAttribute('stroke-linecap', 'round'); g.setAttribute('stroke-linejoin', 'round');
  g.setAttribute('stroke-width', '4.6'); g.style.filter = 'url(#crayon)';
  const mk = (d, delay, extra) => {
    const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('pathLength', '1');
    p.classList.add('stroke'); p.style.animationDelay = delay + 's'; if (extra) Object.entries(extra).forEach(([k, v]) => p.setAttribute(k, v));
    return p;
  };
  let delay = 0;
  forma.trazos.forEach((t) => {
    const d = typeof t === 'string' ? t : t.d; const p = mk(d, delay);
    if (t.rot) p.setAttribute('transform', `rotate(${t.rot} 50 50)`);
    g.appendChild(p); delay += 0.22;
  });
  if (forma.relleno) {
    const cg = document.createElementNS(NS, 'g');
    const id = 'clip' + Math.random().toString(36).slice(2, 8);
    const cp = document.createElementNS(NS, 'clipPath'); cp.setAttribute('id', id);
    const cpp = document.createElementNS(NS, 'path'); cpp.setAttribute('d', forma.clip); cp.appendChild(cpp); svg.appendChild(cp);
    cg.setAttribute('clip-path', `url(#${id})`);
    const f = mk(forma.relleno, delay + .1, { 'stroke-width': '7', opacity: '.72' }); f.style.animationDuration = '1.1s';
    cg.appendChild(f); g.appendChild(cg);
  }
  svg.appendChild(g); return svg;
}

function crearTexto(texto, color) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 220 70'); svg.setAttribute('aria-hidden', 'true'); svg.classList.add('doodle-svg', 'doodle-text');
  const g = document.createElementNS(NS, 'g'); g.style.filter = 'url(#crayon)';
  const t = document.createElementNS(NS, 'text'); t.setAttribute('x', '110'); t.setAttribute('y', '46'); t.setAttribute('text-anchor', 'middle');
  t.setAttribute('fill', color); t.setAttribute('font-size', '40'); t.setAttribute('font-family', "'Caveat Brush', 'Comic Sans MS', cursive"); t.textContent = texto;
  g.appendChild(t); svg.appendChild(g); return svg;
}

const ultimos = [];
export function lanzarGarabato(contenedor) {
  const esTexto = CONFIG.garabatosTexto && CONFIG.garabatosTexto.length && Math.random() < .22;
  const color = pick(COLORES);
  const el = document.createElement('div'); el.className = 'doodle';
  const ancho = esTexto ? rand(24, 34) : rand(11, 20);
  el.style.width = ancho + '%';
  // evita que se amontonen
  let x, y, tries = 0;
  do {
    // 70% de las veces en los costados para no tapar las caras
    const borde = Math.random() < .7;
    x = borde ? (Math.random() < .5 ? rand(2, 24) : rand(98 - ancho - 22, 98 - ancho)) : rand(3, 97 - ancho);
    y = rand(4, 76); tries++;
  } while (tries < 12 && ultimos.some(([ux, uy]) => Math.hypot(ux - x, (uy - y) * 1.6) < 24));
  ultimos.push([x, y]); if (ultimos.length > 3) ultimos.shift();
  el.style.left = x + '%'; el.style.top = y + '%';
  el.style.setProperty('--rot', rand(-22, 22).toFixed(1) + 'deg');
  el.appendChild(esTexto ? crearTexto(pick(CONFIG.garabatosTexto), color) : crearSVG(FORMAS[pick(Object.keys(FORMAS))], color));
  contenedor.appendChild(el);
  const vida = rand(2600, 4200);
  setTimeout(() => el.classList.add('out'), vida);
  setTimeout(() => el.remove(), vida + 700);
}

/* Reparte los garabatos a lo largo del tiempo que dura la foto */
export function programarGarabatos(contenedor, duracionMs) {
  if (CONFIG.garabatos === false) return;
  const n = Math.max(2, Math.min(6, Math.round(duracionMs / 2800)));
  const margenIni = 900, margenFin = Math.min(2400, duracionMs * .3);
  const ventana = Math.max(600, duracionMs - margenIni - margenFin);
  for (let i = 0; i < n; i++) {
    const t = margenIni + (ventana * i) / n + rand(0, ventana / n * .6);
    setTimeout(() => { if (contenedor.isConnected) lanzarGarabato(contenedor); }, t);
  }
}
