// --- ЗВЕЗДНЫЙ ФОН ---
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

function animate() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

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

// --- ЛОГИКА КНОПОК ---
function action(command) {
    const menu = document.getElementById('main-menu');
    const gameScreen = document.getElementById('game-screen');

    switch(command) {
        case 'continue':
            if (localStorage.getItem('save_game')) {
                startGame();
            } else {
                alert("Сохранений нет! Начните новую игру.");
            }
            break;

        case 'new_game':
            localStorage.removeItem('save_game');
            startGame();
            break;

        case 'settings':
            alert("Настройки пока в разработке!");
            break;
    }
}

function startGame() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    canvas.style.display = 'none'; 
    console.log("Игра запущена!");
}
