// --- 1. КОСМОС И ЧЕРНАЯ ДЫРА ---
const canvas = document.getElementById('space-canvas');
const ctx = canvas.getContext('2d');
let stars = [], width, height, time = 0;

function resizeCanvas() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; createStars(); }
function createStars() {
    stars = []; const starCount = Math.floor((width * height) / 8000); 
    for (let i = 0; i < starCount; i++) { stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5, speed: Math.random() * 0.5 + 0.1, alpha: Math.random() * 0.8 + 0.2, twinkleSpeed: Math.random() * 0.02 + 0.01 }); }
}
function animate() {
    if (canvas.style.display === 'none') { requestAnimationFrame(animate); return; } // во время игры космос не виден — не тратим батарею
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
    time += 0.005; const cx = width / 2, cy = height / 2, r = Math.min(width, height) * 0.18;
    let glow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 3);
    glow.addColorStop(0, 'rgba(255, 120, 0, 0.4)'); glow.addColorStop(0.4, 'rgba(255, 50, 0, 0.1)'); glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, r * 3, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 12); ctx.scale(1, 0.3);
    let diskGrad = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 2.5);
    diskGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)'); diskGrad.addColorStop(0.2, 'rgba(255, 200, 50, 0.8)'); diskGrad.addColorStop(0.6, 'rgba(255, 80, 0, 0.3)'); diskGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath(); ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2); ctx.fillStyle = diskGrad; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.02, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255, 240, 200, 0.9)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 12); ctx.scale(1, 0.3);
    ctx.beginPath(); ctx.arc(0, 0, r * 1.3, 0, Math.PI); ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)'; ctx.lineWidth = 15; ctx.stroke(); ctx.restore();
    for (let i = 0; i < 40; i++) {
        const angle = time * 2 + (i * Math.PI * 2) / 40; const dist = r * (1.1 + Math.sin(time * 3 + i) * 0.2);
        const px = Math.cos(angle) * dist, py = Math.sin(angle) * dist * 0.3;
        const finalX = cx + px * Math.cos(Math.PI / 12) - py * Math.sin(Math.PI / 12); const finalY = cy + px * Math.sin(Math.PI / 12) + py * Math.cos(Math.PI / 12);
        ctx.beginPath(); ctx.arc(finalX, finalY, Math.random() * 1.5 + 0.5, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 180, 50, ${Math.max(0, 1 - (dist / (r * 2)))})`; ctx.fill();
    }
    stars.forEach(star => {
        star.x -= star.speed; star.alpha += star.twinkleSpeed;
        if (star.alpha > 1 || star.alpha < 0.2) star.twinkleSpeed *= -1;
        if (star.x < 0) { star.x = width; star.y = Math.random() * height; }
        ctx.beginPath(); ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`; ctx.fill();
    });
    requestAnimationFrame(animate);
}
window.addEventListener('resize', resizeCanvas); resizeCanvas(); animate();

// --- 2. МУЗЫКА И МЕНЮ ---
const music = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-btn');
const MUSIC_VOL = 1;
music.preload = 'auto'; // чтобы после первого касания музыка стартовала сразу, а не догружалась

// Выключил звук — помним это и после перезагрузки
let musicOn = true;
try { musicOn = localStorage.getItem('kosmik_music') !== 'off'; } catch (e) {}
let musicPlaying = false, inGame = false, fadeTimer = null;

// Плавная громкость вместо резкого обрыва (на iPhone громкость из кода не меняется — там просто пауза)
function fadeMusic(to, ms, done) {
    clearInterval(fadeTimer);
    const from = music.volume, t0 = performance.now();
    fadeTimer = setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        music.volume = from + (to - from) * k;
        if (k === 1) { clearInterval(fadeTimer); if (done) done(); }
    }, 30);
}

function updateMusicBtn() { musicBtn.textContent = (musicOn && musicPlaying) ? '🎤' : '🔇'; }

function startMusic() {
    if (!musicOn || inGame || document.hidden) return;
    if (!music.paused) { fadeMusic(MUSIC_VOL, 500); return; }
    music.volume = 0;
    music.play().then(() => {
        // пока браузер думал, игрок мог уже начать игру или выключить звук
        if (!musicOn || inGame) { music.pause(); return; }
        fadeMusic(MUSIC_VOL, 2500);
    }).catch(() => {}); // браузер не дал играть без касания — запустим на первом касании
}

function toggleMusic() {
    if (musicOn && musicPlaying) {
        musicOn = false;
        fadeMusic(0, 400, () => music.pause());
    } else {
        musicOn = true;
        startMusic();
    }
    try { localStorage.setItem('kosmik_music', musicOn ? 'on' : 'off'); } catch (e) {}
    updateMusicBtn();
}

music.addEventListener('playing', () => { musicPlaying = true; updateMusicBtn(); });
music.addEventListener('pause', () => { musicPlaying = false; updateMusicBtn(); });

// Браузеры запрещают звук, пока игрок не коснулся страницы, — поэтому стартуем на первом касании, клике или клавише
function unlockMusic(e) {
    if (!music.paused || (e.target.closest && e.target.closest('#music-btn'))) return;
    startMusic();
}
['touchend', 'mousedown', 'keydown', 'click'].forEach(ev => document.addEventListener(ev, unlockMusic));
// Свернул вкладку — музыка не играет в фоне
document.addEventListener('visibilitychange', () => { if (document.hidden) music.pause(); else startMusic(); });
updateMusicBtn();
startMusic(); // некоторые браузеры разрешают звук сразу

// Общее для «Начать новую» и «Продолжить»: убираем меню, глушим музыку, разворачиваем на весь экран
function enterGame() {
    inGame = true;
    fadeMusic(0, 1200, () => music.pause());
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(e => console.log(e));
    if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(e => console.log(e));
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('music-info').style.display = 'none';
    document.getElementById('music-btn').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    canvas.style.display = 'none';
    shipUnlockAudio(); // звуки корабля можно включить только по нажатию — оно как раз сейчас
}

function action(command) {
    if (command === 'new_game') {
        enterGame();
        say(dialogueLines, endIntro);
    } else if (command === 'continue') {
        const save = loadShipSave();
        if (!save) { alert("Сохранений нет!"); return; }
        enterGame();
        document.getElementById('scene-awake').style.display = 'none';
        startShip(save);
    } else { alert("В разработке!"); }
}

// --- 3. ДИАЛОГИ ---
// Текст печатается по буквам (функция say в ship.js). Z, Enter или касание — дальше, X — допечатать сразу
const dialogueLines = [
    "Вы медленно открываете глаза. Всё тело ломит от боли. Вокруг темно, слышен только скрип металла и тихое шипение воздуха...",
    "Вы пытаетесь вспомнить, что произошло. Вспышка. Черная дыра. Крик команды. А потом — тишина.",
    "Вы с трудом поднимаетесь на ноги. Кажется, вы на какой-то неизвестной планете. В иллюминаторе виден странный, фиолетовый свет.",
    "Внезапно, вы слышите странный звук за спиной. Вы не одни..."
];

// После вступления: вспышка, титры — и карта корабля
function endIntro() {
    const gameScreen = document.getElementById('game-screen');
    setTimeout(() => {
        gameScreen.classList.add('flash-effect');
        setTimeout(() => {
            gameScreen.classList.remove('flash-effect');
            document.getElementById('splash-screen').style.display = 'flex';
            setTimeout(() => {
                document.getElementById('splash-screen').style.display = 'none';
                startShip(null);
            }, 2500);
        }, 1500);
    }, 600);
}

// Карта, движение, джойстик и сохранения теперь в ship.js

// --- 6. БОЕВАЯ СИСТЕМА (С ЛОВУШКОЙ И СИМБИОТОМ) ---
let playerHP = 20, enemyHP = 100, isPlayerTurn = true;
let isSymbiote = false; 

function startRatEncounter() {
    document.getElementById('controls').style.display = 'none';
    document.getElementById('map-container').style.display = 'none';
    document.getElementById('battle-screen').style.display = 'flex';
    
    playerHP = 20; enemyHP = 100;
    isSymbiote = false;
    document.getElementById('player-hp').textContent = playerHP;
    
    const enemyEl = document.getElementById('enemy');
    enemyEl.className = ''; 
    enemyEl.src = "1000098981-removebg-preview.png"; // Базовая стойка
    document.getElementById('enemy-hp-fill').style.width = '100%';
    document.getElementById('enemy-hp-fill').style.background = '#00ff00';
    
    document.getElementById('battle-text').textContent = "Вы подходите к зараженной крысе...";
    isPlayerTurn = true;

    setTimeout(() => {
        document.getElementById('battle-text').textContent = "Это была ловушка! Крыса начинает мутировать...";
        setTimeout(() => {
            enemyEl.src = "1000098981-removebg-preview.png"; // Базовая стойка
            enemyEl.classList.add('symbiote-form');
            document.getElementById('enemy-hp-fill').style.background = '#8a2be2'; 
            document.getElementById('battle-text').textContent = "Перед вами настоящий Симбиот. Он кажется неуязвимым!";
            isSymbiote = true;
        }, 2000);
    }, 1500);
}

function playerAttack() {
    if (!isPlayerTurn) return;
    isPlayerTurn = false;
    
    const attackBtn = document.querySelector('.battle-btn:nth-child(1)');
    attackBtn.textContent = "⚔️ РАЗРЕЗ!";
    document.getElementById('battle-text').textContent = "Нажмите РАЗРЕЗ, чтобы атаковать!";
    
    attackBtn.onclick = function() {
        attackBtn.onclick = playerAttack;
        attackBtn.textContent = "⚔️ АТАКА";
        
        const slash = document.getElementById('slash-effect');
        slash.classList.remove('active');
        void slash.offsetWidth; 
        slash.classList.add('active');
        setTimeout(() => { slash.classList.remove('active'); }, 500);

        if (isSymbiote) {
            const enemyEl = document.getElementById('enemy');
            
            // 1. Разрез
            enemyEl.src = '1000098982-removebg-preview.png'; 
            enemyEl.classList.remove('symbiote-hit');
            void enemyEl.offsetWidth; 
            enemyEl.classList.add('symbiote-hit');
            
            let damage = Math.floor(Math.random() * 20) + 15; 
            let tempHP = enemyHP - damage;
            document.getElementById('enemy-hp-fill').style.width = `${tempHP}%`;
            document.getElementById('battle-text').textContent = `Вы разрубили его пополам! Урон: ${damage}.`;
            
            // 2. После разреза (развалился)
            setTimeout(() => {
                enemyEl.src = '1000098980-removebg-preview.png'; 
                document.getElementById('battle-text').textContent = "Тело симбиота распалось на две части!";
                
                // 3. 1 этап сборки
                setTimeout(() => {
                    enemyEl.src = '1000098979-removebg-preview.png'; 
                    document.getElementById('battle-text').textContent = "Щупальца начали стягивать части обратно...";
                    
                    // 4. 2 этап сборки (почти восстановился)
                    setTimeout(() => {
                        enemyEl.src = '1000098978-removebg-preview.png'; 
                        document.getElementById('battle-text').textContent = "Он почти восстановился!";
                        
                        // 5. Возврат в стойку
                        setTimeout(() => {
                            enemyEl.src = '1000098981-removebg-preview.png'; 
                            document.getElementById('enemy-hp-fill').style.width = '100%'; 
                            document.getElementById('battle-text').textContent = "Урон не прошел! Симбиот полностью восстановился.";
                            
                            setTimeout(enemyTurn, 1500);
                        }, 1000); 
                    }, 800); 
                }, 800); 
            }, 1200); 
        } else {
            let damage = Math.floor(Math.random() * 20) + 15; 
            enemyHP -= damage;
            if (enemyHP < 0) enemyHP = 0;
            document.getElementById('enemy-hp-fill').style.width = `${enemyHP}%`;
            document.getElementById('battle-text').textContent = `Вы ударили крысу! Урон: ${damage}.`;
            
            if (enemyHP <= 0) {
                setTimeout(() => {
                    document.getElementById('battle-screen').style.display = 'none';
                    resumeShip({ ratGone: true }); // обратно на карту, крысы там больше нет
                    say(['* Вы победили!']);
                }, 2000);
                return;
            }
            setTimeout(enemyTurn, 1500);
        }
    };
}

function showBattleText(text) {
    document.getElementById('battle-text').textContent = text;
}

function enemyTurn() {
    if (isSymbiote) {
        document.getElementById('battle-text').textContent = "Симбиот пронзает вас щупальцами!";
        
        const enemyEl = document.getElementById('enemy');
        enemyEl.classList.remove('enemy-attacking');
        void enemyEl.offsetWidth;
        enemyEl.classList.add('enemy-attacking');

        setTimeout(() => {
            playerHP = 0;
            document.getElementById('player-hp').textContent = playerHP;
            document.getElementById('battle-text').textContent = "Это было слишком сильно...";
            
            setTimeout(() => {
                document.getElementById('battle-ui').style.display = 'none';
                document.getElementById('enemy-area').style.display = 'none';
                document.getElementById('slash-effect').style.display = 'none';
                document.getElementById('death-screen').style.display = 'flex';
                setTimeout(() => { location.reload(); }, 7000); 
            }, 1000);
        }, 500); 

    } else {
        document.getElementById('battle-text').textContent = "Крыса кусает вас!";
        setTimeout(() => {
            const damage = Math.floor(Math.random() * 5) + 2;
            playerHP -= damage; if (playerHP < 0) playerHP = 0;
            document.getElementById('player-hp').textContent = playerHP;
            document.getElementById('battle-text').textContent = `Крыса нанесла вам ${damage} урона!`;
            
            if (playerHP <= 0) {
                document.getElementById('battle-ui').style.display = 'none';
                document.getElementById('enemy-area').style.display = 'none';
                document.getElementById('death-screen').style.display = 'flex';
                setTimeout(() => { location.reload(); }, 7000);
                return;
            }
            isPlayerTurn = true;
            setTimeout(() => { document.getElementById('battle-text').textContent = "Ваш ход!"; }, 1000);
        }, 1000);
    }
                }
