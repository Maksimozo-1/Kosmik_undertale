// ==========================================
// KOSMIK UNDERTALE - ПОЛНЫЙ СКРИПТ
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
  console.log("=== СКРИПТ ЗАГРУЖЕН ===");

  // 1. НАСТРОЙКА КАНВАСА (ФОН)
  const canvas = document.getElementById('space-canvas');
  let W, H;
  
  // Делаем канвас фоном на весь экран
  if (canvas) {
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '-1'; // Уводим на задний план
    canvas.style.pointerEvents = 'none';
    
    const ctx = canvas.getContext('2d');
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;

    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.2, a: Math.random() * 0.6 + 0.3,
      tw: Math.random() * 0.02 + 0.005, phase: Math.random() * Math.PI * 2
    }));

    let bhAngle = 0;
    function drawSpace() {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        ctx.globalAlpha = Math.max(0.05, Math.min(1, s.a + Math.sin(Date.now() * 0.001 * s.tw + s.phase) * 0.3));
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      const bhX = W / 2, bhY = H * 0.4, bhR = Math.min(W, H) * 0.18;
      bhAngle += 0.01;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(150, 80, 255, ${0.15 - i * 0.02})`;
        ctx.lineWidth = 2 + i;
        ctx.ellipse(bhX, bhY, bhR * (1.2 + i * 0.15), bhR * 0.35 * (1.2 + i * 0.15), bhAngle + i * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      }
      const glow = ctx.createRadialGradient(bhX, bhY, bhR * 0.8, bhX, bhY, bhR * 2.2);
      glow.addColorStop(0, 'rgba(120, 60, 255, 0.35)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(bhX, bhY, bhR * 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(bhX, bhY, bhR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(200, 140, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(bhX, bhY, bhR + 2, 0, Math.PI * 2); ctx.stroke();

      requestAnimationFrame(drawSpace);
    }
    requestAnimationFrame(drawSpace);
    
    window.addEventListener('resize', () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    });
  }

  // 2. МУЗЫКА
  const audio = document.getElementById('bg-music');
  const musicBtn = document.getElementById('music-toggle');
  let audioCtx, source, filter;

  if (musicBtn) {
    musicBtn.onclick = null; // Убираем старый onclick из HTML
    musicBtn.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          source = audioCtx.createMediaElementSource(audio);
          filter = audioCtx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 800;
          source.connect(filter).connect(audioCtx.destination);
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        if (audio.paused) {
          audio.play();
          musicBtn.textContent = '🔊 Выключить звук';
        } else {
          audio.pause();
          musicBtn.textContent = '🔇 Включить звук';
        }
      } catch (err) {
        console.log("Ошибка аудио:", err);
      }
    });
  }

  // 3. ПЕРЕХОД ИЗ МЕНЮ В ИГРУ
  const mainMenu = document.getElementById('main-menu');
  const gameScreen = document.getElementById('game-screen');
  const splashScreen = document.getElementById('splash-screen');
  const mapContainer = document.getElementById('map-container');
  const controls = document.getElementById('controls');

  // Добавляем CSS-анимацию тряски
  if (!document.getElementById('shake-style')) {
    const st = document.createElement('style');
    st.id = 'shake-style';
    st.textContent = `@keyframes shake { 0%{transform:translate(0,0)} 25%{transform:translate(-4px,3px)} 50%{transform:translate(3px,-4px)} 75%{transform:translate(-3px,-2px)} 100%{transform:translate(0,0)} }`;
    document.head.appendChild(st);
  }

  // Ищем все кнопки меню (Начать, Продолжить)
  const menuButtons = document.querySelectorAll('.menu-btn');
  
  menuButtons.forEach(btn => {
    btn.onclick = null; // Убираем встроенный onclick, чтобы он не перезагружал страницу
    btn.setAttribute('type', 'button'); // Защита от отправки формы

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Останавливаем всплытие событий
      
      console.log("Нажата кнопка меню!");

      // Включаем музыку при первом клике (если выключена)
      if (audio && audio.paused) {
        audio.play().catch(()=>{});
        if (musicBtn) musicBtn.textContent = '🔊 Выключить звук';
      }

      // СКРЫВАЕМ МЕНЮ
      if (mainMenu) mainMenu.style.display = 'none';

      // ПОКАЗЫВАЕМ КОНТЕЙНЕР ИГРЫ И ЗАСТАВКУ
      if (gameScreen) gameScreen.style.display = 'block';
      if (splashScreen) splashScreen.style.display = 'flex';
      
      document.body.style.animation = 'shake 0.4s linear infinite';

      // ЧЕРЕЗ 2 СЕКУНДЫ УБИРАЕМ ЗАСТАВКУ И ПОКАЗЫВАЕМ КАРТУ
      setTimeout(() => {
        console.log("Показываем карту...");
        document.body.style.animation = '';
        
        if (splashScreen) splashScreen.style.display = 'none';
        if (mapContainer) mapContainer.style.display = 'block';
        
        // Показываем джойстик и кнопки
        if (controls) controls.style.display = 'flex'; 
      }, 2000);
    });
  });

  // 4. БОЙ (КЛИК ПО КРЫСЕ)
  const rat = document.getElementById('rat');
  const battleScreen = document.getElementById('battle-screen');
  
  if (rat && battleScreen && mapContainer) {
    rat.addEventListener('click', () => {
      mapContainer.style.display = 'none';
      battleScreen.style.display = 'flex';
    });
  }

  // 5. АТАКА (РАЗРЕЗ)
  const battleBtns = document.querySelectorAll('.battle-btn');
  const slashEffect = document.getElementById('slash-effect');

  battleBtns.forEach(btn => {
    btn.onclick = null;
    if (btn.textContent.includes('Атака') || btn.textContent.includes('АТАКА')) {
      btn.addEventListener('click', () => {
        if (slashEffect) {
          slashEffect.style.display = 'block';
          slashEffect.style.opacity = '1';
          setTimeout(() => {
            slashEffect.style.opacity = '0';
            setTimeout(() => slashEffect.style.display = 'none', 300);
          }, 300);
        }
      });
    }
  });

});
