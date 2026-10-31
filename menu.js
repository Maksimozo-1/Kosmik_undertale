// --- 1. КОСМОС И РЕАЛИСТИЧНАЯ ЧЕРНАЯ ДЫРА ---
const canvas = document.getElementById('space-canvas');
const ctx = canvas.getContext('2d');
let stars = [];
let width, height, time = 0;

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    createStars();
}

function createStars() {
    stars = [];
    const starCount = Math.floor((width * height) / 8000); 
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * width, y: Math.random() * height,
            radius: Math.random() * 1.5 + 0.5, speed: Math.random() * 0.5 + 0.1,
            alpha: Math.random() * 0.8 + 0.2, twinkleSpeed: Math.random() * 0.02 + 0.01
        });
    }
}

function animate() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    time += 0.005;
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) * 0.18;

    let glow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 3);
    glow.addColorStop(0, 'rgba(255, 120, 0, 0.4)'); glow.addColorStop(0.4, 'rgba(255, 50, 0, 0.1)'); glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, r * 3, 0, Math.PI * 2); ctx.fill();

    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 12); ctx.scale(1, 0.3);
    let diskGrad = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 2.5);
    diskGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)'); diskGrad.addColorStop(0.2, 'rgba(255, 200, 50, 0.8)'); diskGrad.addColorStop(0.6, 'rgba(255, 80, 0, 0.3)'); diskGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath(); ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2); ctx.fillStyle = diskGrad; ctx.fill();
    ctx.restore();

    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.02, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255, 240, 200, 0.9)'; ctx.lineWidth = 2; ctx.stroke();

    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 12); ctx.scale(1, 0.3);
    ctx.beginPath(); ctx.arc(0, 0, r * 1.3, 0, Math.PI); ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)'; ctx.lineWidth = 15; ctx.stroke();
    ctx.restore();

    for (let i = 0; i < 40; i++) {
        const angle = time * 2 + (i * Math.PI * 2) / 40;
        const dist = r * (1.1 + Math.sin(time * 3 + i) * 0.2);
        const px = Math.cos(angle) * dist, py = Math.sin(angle) * dist * 0.3;
        const finalX = cx + px * Math.cos(Math.PI / 12) - py * Math.sin(Math.PI / 12);
        const finalY = cy + px * Math.sin(Math.PI / 12) + py * Math.cos(Math.PI / 12);
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
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
animate();

// --- 2. МУЗЫКА С ФИЛЬТРОМ ---
const music = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-toggle');
let audioCtx, sourceNode, filterNode, isPlaying = false;

function toggleMusic() {
    if (isPlaying) {
        music.pause(); musicBtn.textContent = '🔇 Включить звук'; isPlaying = false;
    } else {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            sourceNode = audioCtx.createMediaElementSource(music);
            filterNode = audioCtx.createBiquadFilter();
            filterNode.type = 'lowpass'; filterNode.frequency.value = 1200;
            sourceNode.connect(filterNode); filterNode.connect(audioCtx.destination);
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        music.volume = 1.0;
        music.play().then(() => { musicBtn.textContent = '🔊 Выключить звук'; isPlaying = true; }).catch(e => alert("Ошибка звука: " + e.message));
    }
}

// --- 3. МЕНЮ ---
function action(command) {
    if (command === 'new_game') {
        if (music) music.pause(); 
        
        if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(e => console.log(e));
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(e => console.log(e));

        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('game-screen').style.display = 'flex'; // Включаем flex для горизонта
        canvas.style.display = 'none';
    } else if (command === 'continue') { alert("Сохранений нет!"); } 
    else { alert("В разработке!"); }
}

// --- 4. ДИАЛОГИ ---
const dialogueLines = [
    "Вы медленно открываете глаза. Всё тело ломит от боли. Вокруг темно, слышен только скрип металла и тихое шипение воздуха...",
    "Вы пытаетесь вспомнить, что произошло. Вспышка. Черная дыра. Крик команды. А потом — тишина.",
    "Вы с трудом поднимаетесь на ноги. Кажется, вы на какой-то неизвестной планете. В иллюминаторе виден странный, фиолетовый свет.",
    "Внезапно, вы слышите странный звук за спиной. Вы не одни..."
];
let currentLine = 0;
const textElement = document.getElementById('dialogue-text');
const btn = document.getElementById('next-btn');

function nextDialogue() {
    currentLine++;
    if (currentLine < dialogueLines.length) {
        textElement.textContent = dialogueLines[currentLine];
    } else {
        textElement.textContent = "Продолжение следует...";
        btn.style.display = 'none';
        const gameScreen = document.getElementById('game-screen');
        setTimeout(() => {
            gameScreen.classList.add('flash-effect', 'shake-effect');
            setTimeout(() => {
                gameScreen.classList.remove('flash-effect', 'shake-effect');
                document.getElementById('scene-awake').style.display = 'none';
                document.getElementById('splash-screen').style.display = 'flex';
                setTimeout(() => {
                    document.getElementById('splash-screen').style.display = 'none';
                    document.getElementById('map-container').style.display = 'block';
                    document.getElementById('controls').style.display = 'grid';
                    drawMap();
                }, 2500);
            }, 1500);
        }, 1000);
    }
}

// --- 5. КАРТА И ДВИЖЕНИЕ ---
const mapWidth = 10, mapHeight = 10;
let playerPos = { x: 5, y: 5 };
let ratPos = { x: 2, y: 7 }; 
const playerElement = document.getElementById('player');
const ratElement = document.getElementById('rat');

const mapGrid = [
    [1,1,1,1,1,1,1,1,1,1], [1,0,0,1,0,0,1,0,0,1], [1,0,0,0,0,1,0,0,1,1], [1,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1], [1,1,1,0,1,1,1,1,0,1], [1,0,0,0,1,0,0,0,0,1], [1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1], [1,1,1,1,1,1,1,1,1,1]
];

function drawMap() {
    const mapDiv = document.getElementById('map');
    mapDiv.innerHTML = ''; 
    mapDiv.style.gridTemplateColumns = `repeat(${mapWidth}, 1fr)`;
    mapDiv.style.gridTemplateRows = `repeat(${mapHeight}, 1fr)`;
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            const cell = document.createElement('div');
            cell.className = mapGrid[y][x] === 1 ? 'wall' : 'floor';
            mapDiv.appendChild(cell);
        }
    }
    updatePlayerPosition();
    updateRatPosition();
}

function updatePlayerPosition() {
    const cellW = 100 / mapWidth, cellH = 100 / mapHeight;
    playerElement.style.left = `${(playerPos.x * cellW) + (cellW / 2)}%`;
    playerElement.style.top = `${(playerPos.y * cellH) + (cellH / 2)}%`;
}

function updateRatPosition() {
    const cellW = 100 / mapWidth, cellH = 100 / mapHeight;
    ratElement.style.left = `${(ratPos.x * cellW) + (cellW / 2)}%`;
    ratElement.style.top = `${(ratPos.y * cellH) + (cellH / 2)}%`;
}

function move(direction) {
    let newX = playerPos.x, newY = playerPos.y;
    if (direction === 'up') newY--;
    if (direction === 'down') newY++;
    if (direction === 'left') newX--;
    if (direction === 'right') newX++;
    
    if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
        if (mapGrid[newY][newX] === 0) {
            if (newX === ratPos.x && newY === ratPos.y) {
                startRatEncounter();
            } else {
                playerPos.x = newX; playerPos.y = newY; updatePlayerPosition();
            }
        }
    }
}

// --- 6. ВСТРЕЧА С КРЫСОЙ ---
function startRatEncounter() {
    document.getElementById('controls').style.display = 'none';
    document.getElementById('scene-awake').style.display = 'flex';
    const textElement = document.getElementById('dialogue-text');
    const btn = document.getElementById('next-btn');
    
    textElement.textContent = "Из темноты на вас бросается зараженная крыса! Её глаза светятся красным, а движения неестественны...";
    btn.style.display = 'block';
    btn.textContent = "В БОЙ! ⚔️";
    
    btn.onclick = function() { alert("Тут будет битва! (Скоро)"); };
    }
