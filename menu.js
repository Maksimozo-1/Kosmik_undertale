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

let time = 0;

function animate() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // === ЧЕРНАЯ ДЫРА ПО ЦЕНТРУ ===
    time += 0.02;
    const centerX = width / 2;
    const centerY = height / 2;
    const holeRadius = Math.min(width, height) * 0.15;

    // 1. Оранжевое свечение
    const gradient = ctx.createRadialGradient(centerX, centerY, holeRadius, centerX, centerY, holeRadius * 2.5);
    gradient.addColorStop(0, 'rgba(255, 100, 0, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, holeRadius * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 2. Вращающееся кольцо
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

    // 3. Сама дыра (черный круг)
    ctx.beginPath();
    ctx.arc(centerX, centerY, holeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    // 4. Яркая граница
    ctx.beginPath();
    ctx.arc(centerX, centerY, holeRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // === ЗВЕЗДЫ ===
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
