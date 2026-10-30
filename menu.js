// --- КОСМОС И ЧЕРНАЯ ДЫРА ---
const canvas = document.getElementById('space-canvas');
const ctx = canvas.getContext('2d');
let stars = [];
let width, height;

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

let time = 0;

function animate() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // ЧЕРНАЯ ДЫРА
    time += 0.02;
    const centerX = width / 2;
    const centerY = height / 2;
    const holeRadius = Math.min(width, height) * 0.15;

    const gradient = ctx.createRadialGradient(centerX, centerY, holeRadius, centerX, centerY, holeRadius * 2.5);
    gradient.addColorStop(0, 'rgba(255, 100, 0, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, holeRadius * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    for (let i = 0; i < 50; i++) {
        const angle = (i / 50) * Math.PI * 2 + time;
        const x = centerX + Math.cos(angle) * (holeRadius * 1.3);
        const y = centerY + Math.sin(angle) * (holeRadius * 0.6);
        const dotSize = Math.random() * 2 + 1;
        
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 200, 50, 0.9)' : 'rgba(255, 100, 0, 0.7)';
        ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, holeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, holeRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // ЗВЕЗДЫ
    stars.forEach(star => {
        star.x -= star.speed;
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 1 || star.alpha < 0.2) star.twinkleSpeed *= -1;
        if (star.x < 0) { star.x = width; star.y = Math.random() * height; }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();
    });
    
    requestAnimationFrame(animate);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
animate();

// --- КНОПКИ ---
function action(command) {
    const menu = document.getElementById('main-menu');
    const gameScreen = document.getElementById('game-screen');

    switch(command) {
        case 'continue':
            if (localStorage.getItem('save_game')) { startGame(); } 
            else { alert("Сохранений нет!"); }
            break;
        case 'new_game':
            localStorage.removeItem('save_game');
            startGame();
            break;
        case 'settings':
            alert("Настройки в разработке!");
            break;
    }
}

function startGame() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    canvas.style.display = 'none'; 
}

// --- СЛУЧАЙНЫЙ ЗВУК (ИНТЕРВАЛ) ---
const music = document.getElementById('bg-music');
let isPlaying = false;

// Этот код включает звук при первом клике по экрану (требование браузеров)
document.body.addEventListener('click', () => {
    if (!isPlaying) {
        isPlaying = true; // Разрешаем проигрывание
        playRandomSound(); // Запускаем цикл
    }
}, { once: true });

function playRandomSound() {
    if (isPlaying && music) {
        music.currentTime = 0;
        music.volume = 0.7; // Громкость (от 0 до 1)
        music.play().catch(e => console.log("Ждем клика..."));
        
        // Звук играет 3 секунды, потом пауза (измени 3000, если звук длиннее)
        setTimeout(() => {
            music.pause();
        }, 3000); 
    }

    // Следующий звук через случайное время (от 10 до 30 секунд)
    const nextInterval = Math.random() * (30000 - 10000) + 10000;
    setTimeout(playRandomSound, nextInterval);
                  }
// --- СЮЖЕТ ИГРЫ (ДИАЛОГИ) ---
const dialogueLines = [
    "Вы медленно открываете глаза. Всё тело ломит от боли. Вокруг темно, слышен только скрип металла и тихое шипение воздуха...",
    "Вы пытаетесь вспомнить, что произошло. Вспышка. Черная дыра. Крик команды. А потом — тишина.",
    "Вы с трудом поднимаетесь на ноги. Кажется, вы на какой-то неизвестной планете. В иллюминаторе виден странный, фиолетовый свет.",
    "Внезапно, вы слышите странный звук за спиной. Вы не одни..."
];

let currentLine = 0;

function nextDialogue() {
    const textElement = document.getElementById('dialogue-text');
    const btn = document.getElementById('next-btn');
    
    currentLine++;
    
    if (currentLine < dialogueLines.length) {
        textElement.textContent = dialogueLines[currentLine];
    } else {
        textElement.textContent = "Продолжение следует...";
        btn.style.display = 'none'; // Прячем кнопку, когда текст закончился
    }
}
