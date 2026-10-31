// menu.js — KOSMIK UNDERTALE (полная версия)
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const menuScreen = $('#menu-screen') || $('#menu') || document.body;

  // ---------- КАНВАСЫ ----------
  function ensureCanvas(id) {
    let c = document.getElementById(id);
    if (!c) {
      c = document.createElement('canvas');
      c.id = id;
      menuScreen.prepend(c);
    }
    c.style.position = 'fixed';
    c.style.inset = '0';
    c.style.width = '100%';
    c.style.height = '100%';
    c.style.pointerEvents = 'none';
    return c;
  }

  const starsCanvas = ensureCanvas('stars-canvas');
  starsCanvas.style.zIndex = '0';
  const bhCanvas = ensureCanvas('blackhole-canvas');
  bhCanvas.style.zIndex = '1';

  let W = 0, H = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    [starsCanvas, bhCanvas].forEach(c => {
      c.width = W * dpr;
      c.height = H * dpr;
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }
  resize();
  window.addEventListener('resize', resize);

  // ---------- ЗВЁЗДЫ ----------
  const STAR_COUNT = Math.max(120, Math.floor((W * H) / 4000));
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.6 + 0.2,
      a: Math.random() * 0.6 + 0.3,
      tw: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2
    });
  }

  // ---------- ЧЁРНАЯ ДЫРА ----------
  const bh = { x: W / 2, y: H * 0.45, r: Math.min(W, H) * 0.18, angle: 0 };

  const starsCtx = starsCanvas.getContext('2d');
  const bhCtx = bhCanvas.getContext('2d');

  function drawStars(t) {
    starsCtx.clearRect(0, 0, W, H);
    for (const s of stars) {
      starsCtx.globalAlpha = Math.max(0.05, Math.min(1, s.a + Math.sin(t * s.tw + s.phase) * 0.3));
      starsCtx.fillStyle = '#fff';
      starsCtx.beginPath();
      starsCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      starsCtx.fill();
    }
    starsCtx.globalAlpha = 1;
  }

  function drawBlackHole() {
    bhCtx.clearRect(0, 0, W, H);
    bh.x = W / 2;
    bh.y = H * 0.45;
    bh.angle += 0.01;

    // аккреционный диск
    for (let i = 0; i < 6; i++) {
      const rr = bh.r * (1.2 + i * 0.15);
      bhCtx.beginPath();
      bhCtx.strokeStyle = `rgba(150, 80, 255, ${0.15 - i * 0.02})`;
      bhCtx.lineWidth = 2 + i;
      bhCtx.ellipse(bh.x, bh.y, rr, rr * 0.35, bh.angle + i * 0.3, 0, Math.PI * 2);
      bhCtx.stroke();
    }

    // свечение
    const glow = bhCtx.createRadialGradient(bh.x, bh.y, bh.r * 0.8, bh.x, bh.y, bh.r * 2.2);
    glow.addColorStop(0, 'rgba(120, 60, 255, 0.35)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    bhCtx.fillStyle = glow;
    bhCtx.beginPath();
    bhCtx.arc(bh.x, bh.y, bh.r * 2.2, 0, Math.PI * 2);
    bhCtx.fill();

    // горизонт событий
    bhCtx.fillStyle = '#000';
    bhCtx.beginPath();
    bhCtx.arc(bh.x, bh.y, bh.r, 0, Math.PI * 2);
    bhCtx.fill();

    // световое кольцо
    bhCtx.strokeStyle = 'rgba(200, 140, 255, 0.9)';
    bhCtx.lineWidth = 2;
    bhCtx.beginPath();
    bhCtx.arc(bh.x, bh.y, bh.r + 2, 0, Math.PI * 2);
    bhCtx.stroke();
  }

  function loop(t) {
    const ts = t / 1000;
    drawStars(ts);
    drawBlackHole();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---------- АУДИО + ФИЛЬТР ----------
  let audio = $('#menu-audio') || $('audio');
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'menu-audio';
    audio.src = 'horror (online-audio-converter.com).mp3';
    document.body.appendChild(audio);
  }
  audio.loop = true;
  audio.volume = 0.5;

  let audioCtx, source, filter;
  function setupAudioFilter() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      source = audioCtx.createMediaElementSource(audio);
      filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 1;
      source.connect(filter).connect(audioCtx.destination);
    } catch (e) {
      console.warn('Audio filter failed:', e);
    }
  }

  function playMusic() {
    setupAudioFilter();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    audio.play().catch(() => {});
  }

  // ---------- ТРЯСКА ----------
  if (!document.getElementById('kosmik-shake-style')) {
    const st = document.createElement('style');
    st.id = 'kosmik-shake-style';
    st.textContent = `@keyframes shake {
      0%{transform:translate(0,0)}
      25%{transform:translate(-4px,3px)}
      50%{transform:translate(3px,-4px)}
      75%{transform:translate(-3px,-2px)}
      100%{transform:translate(0,0)}
    }`;
    document.head.appendChild(st);
  }

  // ---------- ПЕРЕХОД ----------
  function showTitleAndStart() {
    let overlay = $('#transition-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'transition-overlay';
      overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        background: #000; color: #fff;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Press Start 2P', monospace, sans-serif;
        font-size: clamp(14px, 3vw, 28px);
        letter-spacing: 2px; text-align: center;
        opacity: 0; transition: opacity 0.6s;
        padding: 20px;
      `;
      document.body.appendChild(overlay);
    }
    overlay.textContent = 'Maksimozo представляет';
    overlay.style.opacity = '1';
    document.body.style.animation = 'shake 0.4s linear infinite';

    setTimeout(() => {
      document.body.style.animation = '';
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        if (typeof window.startGame === 'function') {
          window.startGame();
        } else {
          const room = $('#room-screen') || $('#room');
          if (menuScreen) menuScreen.style.display = 'none';
          if (room) room.style.display = 'block';
          window.dispatchEvent(new CustomEvent('kosmik:start'));
        }
      }, 600);
    }, 2200);
  }

  // ---------- КНОПКИ ----------
  function bindButtons() {
    document.addEventListener('pointerdown', playMusic, { once: true });

    const startBtn =
      $('#btn-start') || $('#start-btn') || $('.btn-start') ||
      $('.start') || $('[data-action="start"]') || $('#play') ||
      $$('button').find(b => /играть|старт|start|play/i.test(b.textContent));

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        playMusic();
        showTitleAndStart();
      });
    } else {
      console.warn('Кнопка старта не найдена. Добавь id="btn-start".');
    }

    const settingsBtn = $('#btn-settings') || $('.btn-settings');
    if (settingsBtn) settingsBtn.addEventListener('click', () => {
      const p = $('#settings-panel');
      if (p) p.style.display = (p.style.display === 'none') ? 'flex' : 'none';
    });

    const aboutBtn = $('#btn-about') || $('.btn-about');
    if (aboutBtn) aboutBtn.addEventListener('click', () => {
      alert('KOSMIK UNDERTALE\nКосмонавт просыпается на неизвестной планете...');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindButtons);
  } else {
    bindButtons();
  }
})();
