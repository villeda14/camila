import { CONFIG } from './config.js';
import { programarGarabatos } from './garabatos.js';

const $ = (s) => document.querySelector(s);
const SKIP = Symbol('skip');

export function initCinema({ audio }) {
  const room = $('#room'), film = $('#film'), screen = $('#screen'), beam = $('#beam');
  const sconces = [...document.querySelectorAll('.sconce')];
  const order = ['.l1', '.r1', '.l2', '.r2', '.l3', '.r3'].map((s) => $('.sconce' + s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let light = 0, lightRaf = 0, running = false, over = false, hasSong = false;

  audio.loop = false;
  audio.src = CONFIG.cancion;

  /* ---------- Asientos (con una pareja en primera fila) ---------- */
  const seats = $('#seats');
  const mkRow = (cls, n, extra) => {
    const r = document.createElement('div'); r.className = 'srow ' + cls;
    for (let i = 0; i < n; i++) { const s = document.createElement('div'); s.className = 'seat' + ((extra && extra(i, n)) || ''); r.appendChild(s); }
    seats.appendChild(r);
  };
  mkRow('back', 9);
  mkRow('front', 7, (i) => (i === 3 ? ' heads a' : i === 4 ? ' heads b' : ''));

  /* ---------- Utilidades ---------- */
  const wait = (ms) => new Promise((res) => setTimeout(res, reduce ? Math.min(ms, 60) : ms));
  function setLight(to, ms) {
    cancelAnimationFrame(lightRaf);
    const from = light, t0 = performance.now();
    (function tick(now) {
      const k = Math.min(1, (now - t0) / Math.max(ms, 1)), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      light = from + (to - from) * e; room.style.setProperty('--l', light.toFixed(3));
      if (k < 1) lightRaf = requestAnimationFrame(tick);
    })(t0);
  }
  function fadeVolume(to, ms) {
    const from = audio.volume, t0 = performance.now();
    (function tick(now) {
      const k = Math.min(1, (now - t0) / ms); audio.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ---------- La película ---------- */
  // Duraciones fijas (ms)
  const T_CARD_OPEN = 4200, T_CARD_NAME = 4200, T_CARD_END = 5200, T_OUTRO = 5200;

  function buildScenes(photoMs) {
    const sc = [];
    sc.push({ type: 'card', lines: [CONFIG.tituloPelicula[0]], big: CONFIG.tituloPelicula[1], t: T_CARD_OPEN });
    sc.push({ type: 'card', big: CONFIG.nombre.toUpperCase(), small: CONFIG.subtituloPelicula, t: T_CARD_NAME });
    const fotos = CONFIG.fotos.length ? CONFIG.fotos : CONFIG.pieEjemplo.map((pie) => ({ src: null, pie }));
    fotos.forEach((f) => sc.push({ type: 'photo', src: f.src, cap: f.pie, t: photoMs }));
    sc.push({ type: 'card', big: CONFIG.finPelicula[0], small: CONFIG.finPelicula[1], t: T_CARD_END });
    return sc;
  }
  function makeSlide(s) {
    const el = document.createElement('div'); el.className = 'slide';
    if (s.type === 'card') {
      el.classList.add('card');
      if (s.lines) s.lines.forEach((l) => { const p = document.createElement('p'); p.textContent = l; el.appendChild(p); });
      if (s.big) { const h = document.createElement('h3'); h.textContent = s.big; el.appendChild(h); }
      if (s.small) { const sm = document.createElement('small'); sm.textContent = s.small; el.appendChild(sm); }
    } else {
      if (s.src) { const bg = document.createElement('div'); bg.className = 'bg'; bg.style.backgroundImage = `url("${s.src}")`; el.appendChild(bg); }
      const img = document.createElement('div'); img.className = 'img' + (s.src ? '' : ' ph');
      if (s.src) img.style.backgroundImage = `url("${s.src}")`;
      const dir = [[2, -2], [-2, -2], [2, 2], [-2, 2]][Math.floor(Math.random() * 4)];
      img.style.setProperty('--tx', dir[0] + '%'); img.style.setProperty('--ty', dir[1] + '%'); img.style.setProperty('--dur', (s.t / 1000 + 1.5) + 's');
      el.appendChild(img);
      if (s.cap) { const c = document.createElement('div'); c.className = 'cap'; c.textContent = s.cap; el.appendChild(c); }
    }
    return el;
  }
  async function playFilm(photoMs) {
    film.innerHTML = '';
    for (const s of buildScenes(photoMs)) {
      const el = makeSlide(s); film.appendChild(el);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
      if (s.type === 'photo') programarGarabatos(el, s.t);
      await wait(s.t);
      el.classList.remove('on');
      setTimeout(() => el.remove(), 1600);
    }
    await wait(1600);
  }

  /* ---------- Audio obligatorio ---------- */
  function songDuration() {
    return new Promise((resolve) => {
      const done = () => { audio.removeEventListener('loadedmetadata', done); audio.removeEventListener('error', fail); resolve(isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null); };
      const fail = () => { audio.removeEventListener('loadedmetadata', done); audio.removeEventListener('error', fail); resolve(null); };
      if (audio.readyState >= 1) return done();
      audio.addEventListener('loadedmetadata', done); audio.addEventListener('error', fail);
      setTimeout(fail, 6000);
    });
  }
  const songEnded = () => new Promise((resolve) => {
    if (!hasSong || audio.ended) return resolve();
    audio.addEventListener('ended', resolve, { once: true });
    audio.addEventListener('error', resolve, { once: true });
  });

  // Si la música se pausa (otra pestaña, auriculares, etc.), pedimos continuar
  audio.addEventListener('pause', () => { if (running && !over && hasSong && !audio.ended) $('#resume').hidden = false; });
  $('#resumeBtn').addEventListener('click', () => { audio.play().then(() => { $('#resume').hidden = true; }).catch(() => {}); });
  audio.addEventListener('play', () => { $('#resume').hidden = true; });

  /* ---------- Línea de tiempo ---------- */
  async function run(dur) {
    const t0 = performance.now();
    running = true;

    // 1. Las luces se encienden poco a poco
    await wait(1400);
    for (let i = 0; i < order.length; i++) {
      order[i].classList.add('on');
      if (i === 1) setLight(.18, 5000);
      await wait(1000);
    }
    await wait(800);
    setLight(1, 3500);
    await wait(1500);
    $('#marquee').textContent = CONFIG.nombre.toUpperCase();
    $('#marquee').classList.add('show');
    await wait(4800);

    // 2. Se apagan las luces, se abre el telón
    sconces.forEach((s, i) => setTimeout(() => s.classList.remove('on'), i * 250));
    setLight(.1, 3000);
    await wait(3200);
    beam.classList.add('on'); screen.classList.add('lit');
    await wait(1200);
    $('#curtainL').classList.add('open'); $('#curtainR').classList.add('open');
    await wait(3000);

    // 3. La película: sus fotos se reparten para llenar exactamente la canción
    const nPhotos = CONFIG.fotos.length || CONFIG.pieEjemplo.length;
    let photoMs;
    if (dur) {
      const elapsed = performance.now() - t0;
      const fixed = T_CARD_OPEN + T_CARD_NAME + T_CARD_END + 1600 + 2800 + T_OUTRO * .4; // tarjetas + cierre de telón
      photoMs = Math.max(3000, (dur * 1000 - elapsed - fixed) / nPhotos);
    } else photoMs = CONFIG.segundosPorFotoSinCancion * 1000;
    await playFilm(photoMs);

    // 4. Cierra el telón, suben las luces; se espera a que termine la canción
    beam.classList.remove('on'); screen.classList.remove('lit');
    $('#curtainL').classList.remove('open'); $('#curtainR').classList.remove('open');
    await wait(2800);
    sconces.forEach((s) => s.classList.add('on'));
    setLight(.7, 4000);
    await songEnded();
    over = true; running = false;
    await wait(800);
    $('#finalMsg').textContent = CONFIG.mensajeFinal;
    $('#finale').hidden = false; $('#replay').focus({ preventScroll: true });
  }

  /* ---------- Inicio ---------- */
  $('#start').addEventListener('click', async () => {
    $('#intro').hidden = true;
    audio.volume = 0;
    // play() dentro del gesto del usuario para que el navegador lo permita
    let playing = false;
    try { await audio.play(); playing = true; } catch (e) { playing = false; }
    const dur = await songDuration();
    hasSong = !!dur;
    if (hasSong && !playing) {
      // El navegador bloqueó el audio: la música es obligatoria, así que pedimos un toque
      $('#resume').hidden = false;
      await new Promise((r) => audio.addEventListener('play', r, { once: true }));
    }
    if (hasSong) fadeVolume(1, 4000); else $('#songMissing').hidden = false;
    run(dur);
  });
  $('#replay').addEventListener('click', () => location.reload());
}
