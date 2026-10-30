// --- ЗВЕЗДНЫЙ ФОН И ЧЕРНАЯ ДЫРА ---
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
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.5 + 0.5,
            speed: Math.random() * 0.5 + 0.1,
            alpha: Math.random() * 0.8 + 0.2,
            twinkleSpeed: Math.random() * 0.02 + 0.01
        });
    }
}

function animate() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    // Черная дыра
    time += 0.02;
    const centerX = width / 2;
    const centerY = height / 2;
    const holeRadius = Math.min(width, height) * 0.15;
    const gradient = ctx.createRadialGradient(centerX, centerY, holeRadius, centerX, centerY, holeRadius * 2.5);
    gradient.addColorStop(0, 'rgba(255, 100, 0, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath(); ctx.arc(centerX, centerY, holeRadius * 2.5, 0, Math.PI * 2); ctx.fillStyle = gradient; ctx.fill();

    for (let i = 0; i < 50; i++) {
        const angle = (i / 50) * Math.PI * 2 + time;
        const x = centerX + Math.cos(angle) * (holeRadius * 1.3);
        const y = centerY + Math.sin(angle) * (holeRadius * 0.6);
        ctx.beginPath(); ctx.arc(x, y, Math.random() * 2 + 1, 0, Math.PI * 2); ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 200, 50, 0.9)' : 'rgba(255, 100, 0, 0.7)'; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(centerX, centerY, holeRadius, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill();
    ctx.beginPath(); ctx.arc(centerX, centerY, holeRadius, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)'; ctx.lineWidth = 3; ctx.stroke();

    // Звезды
    stars.forEach(star => {
        star.x -= star.speed;
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 1 || star.alpha < 0.2) star.twinkleSpeed *= -1;
        if (star.x < 0) { star.x = width; star.y = Math.random() * height; }
        ctx.beginPath(); ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`; ctx.fill();
    });
    requestAnimationFrame(animate);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
animate();

// --- МУЗЫКА ---
const music = document.getElementById('bg-music');
let isPlaying = false;
document.body.addEventListener('click', () => {
    if (!isPlaying && music) {
        music.volume = 0.5;
        music.play().then(() => isPlaying = true).catch(e => console.log(e));
    }
}, { once: true });

// --- МЕНЮ ---
function action(command) {
    if (command === 'new_game') {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        canvas.style.display = 'none';
    } else if (command === 'continue') {
        alert("Сохранений нет!");
    } else {
        alert("В разработке!");
    }
}

// --- ДИАЛОГИ И КАТ-СЦЕНА ---
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
        
        // Тряска
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

// --- КАРТА И ДВИЖЕНИЕ ---
const mapWidth = 10;
const mapHeight = 10;
let playerPos = { x: 5, y: 5 };
const playerElement = document.getElementById('player');

const mapGrid = [
    [1,1,1,1,1,1,1,1,1,1], 
    [1,0,0,1,0,0,1,0,0,1],
    [1,0,0,0,0,1,0,0,1,1],
    [1,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1]
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
}

function updatePlayerPosition() {
    const cellW = 100 / mapWidth;
    const cellH = 100 / mapHeight;
    playerElement.style.left = `${(playerPos.x * cellW) + (cellW / 2)}%`;
    playerElement.style.top = `${(playerPos.y * cellH) + (cellH / 2)}%`;
}

function move(direction) {
    let newX = playerPos.x;
    let newY = playerPos.y;

    if (direction === 'up') newY--;
    if (direction === 'down') newY++;
    if (direction === 'left') newX--;
    if (direction === 'right') newX++;

    if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
        if (mapGrid[newY][newX] === 0) {
            playerPos.x = newX;
            playerPos.y = newY;
            updatePlayerPosition();
        }
    }
}
