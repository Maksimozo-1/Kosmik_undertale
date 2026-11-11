// ===================== БОЙ =====================
// Бой как в Undertale.
//   Ход врага: сердце (это ты) в рамке уворачивается от атак.
//     Компьютер — стрелки или WASD. Телефон — води пальцем по экрану, сердце повторяет движение.
//   Твой ход — четыре кнопки:
//     АТАКА    — по мишени бежит полоска: жми Z (или коснись экрана), когда она в центре;
//     ДЕЙСТВИЕ — проверить врага, поговорить и т. д. (у каждого врага свои);
//     ПРЕДМЕТ  — вылечиться или использовать сюжетную вещь;
//     ПОЩАДА   — пощадить (если враг готов, его имя жёлтое) или сбежать.
// Тексты, предметы и атаки лежат в начале файла — меняй как хочешь.
// Герой (HP, вещи) — в menu.js, сохранение — в ship.js.

// ---------- ПРЕДМЕТЫ ----------
// name — название, heal — сколько HP лечит, use — текст, когда используешь.
// Где их найти на корабле — смотри item в PROPS в ship.js
const ITEMS = {
    bar:    { name: 'Космо-батончик', heal: 8,  use: '* Вы съели космо-батончик.\n* Хрустит, как картон.' },
    borsch: { name: 'Тюбик борща',    heal: 15, use: '* Вы выдавили в рот тюбик борща.\n* Вкус как дома!' },
    // сюжетная вещь: против симбиота у неё особое действие (см. useItem ниже)
    // против симбиота: громкий звон и огонь (см. scare ниже). Вилка с тарелкой не тратится, факел — да
    fork:   { name: 'Вилка и тарелка', use: '* Вы стучите вилкой по тарелке.\n* ДЗЫНЬ! Громко.' },
    flare:  { name: 'Сигнальный факел', use: '* Вы зажигаете факел.\n* Красный огонь шипит и трещит.' },
    cryo:   { name: 'Криобаллон', use: '* Вы крутите вентиль. Шипит холод.\n* Ничего не происходит.' },
    // оружие из тайника в грузовом отсеке: надел один раз — удары сильнее до конца игры
    claws:  { name: 'Железные когти', use: '* Вы надели железные когти.\n* Пальцы стали тяжёлыми и острыми.\n* АТАКА +8.' },
};

// ---------- ВРАГ: СИМБИОТ ----------
// В лоб его не победить: после удара он срастается обратно.
// Но на накладной в грузовом отсеке написано «Хранить при −200°»...
const SYMBIOTE = {
    name: 'Симбиот',
    hp: 100,
    dmg: 3,   // сколько HP отнимает одно попадание
    img: {
        stand: '1000098981-removebg-preview.png',   // стойка
        cut:   '1000098982-removebg-preview.png',   // разрез
        split: '1000098980-removebg-preview.png',   // распался на две части
        join1: '1000098979-removebg-preview.png',   // собирается
        join2: '1000098978-removebg-preview.png',   // почти собрался
    },
    intro: '* Вы подходите к заражённой крысе...',
    trap: '* Это была ловушка!\n* Крыса начинает мутировать...',
    again: '* Крыса снова мутирует!',
    appear: '* Перед вами настоящий Симбиот.\n* Он кажется неуязвимым!',
    // фразы в рамке, пока выбираешь кнопку
    flavor: [
        '* Симбиот облизывается.',
        '* Пахнет озоном и мокрой шерстью.',
        '* Щупальца нетерпеливо подрагивают.',
        '* От симбиота веет теплом.\n* Ему здесь явно нравится.',
        '* Где-то внутри слизи пищит крыса.',
    ],
    lowHp: '* Вы еле держитесь на ногах.',
    frozen: '* Симбиот скован льдом.\n* Теперь его можно пощадить.',
    // что он говорит перед атакой (облачко)
    talk: ['Ш-Ш-Ш-Ш...', 'ТЁПЛЫЙ...', 'МЫ... ГОЛОДНЫ.', 'ОТДАЙ... ТЕПЛО...', 'ХОЛОДНО... БЫЛО... ДОЛГО...'],
    angry: ['БЕСПОЛЕЗНО.', 'МЫ... ЦЕЛЫ.', 'ЕЩЁ РАЗ... И ТЫ... НАШ.'],   // после твоего удара
    ratTalk: 'КРЫСА... НАША...',
    // ДЕЙСТВИЕ: у каждого пункта варианты по порядку (последний потом повторяется),
    // в каждом варианте — страницы текста
    acts: {
        'Проверить': [
            ['* СИМБИОТ — АТК 8  ЗАЩ ∞\n* Тот самый образец №7 из груза.', '* «Хранить при −200°».\n* А здесь ему явно слишком тепло...', '* Ещё в накладной приписка от руки:\n* «Боится громких звуков и огня».'],
        ],
        'Поговорить': [
            ['* Вы рассказываете анекдот про космонавтов.\n* Симбиот не смеётся. Тяжёлая публика.'],
            ['* Вы спрашиваете, откуда он взялся.\n* «ХОЛОДНО... БЫЛО... ДОЛГО...»'],
            ['* Вы говорите, что не хотите драться.\n* Симбиот наклоняет голову... и шипит.'],
        ],
        'Позвать крысу': [
            ['* Вы зовёте крысу: «Кис-кис-кис!»', '* ...Это же крыса.\n* Но внутри слизи что-то слабо пискнуло.'],
            ['* Вы снова зовёте крысу.\n* Писк стал громче. Она ещё жива!'],
        ],
    },
    // удар по симбиоту: он разваливается и срастается ({dmg} — урон)
    hit: [
        '* Вы разрубили его пополам! Урон: {dmg}.',
        '* Тело симбиота распалось на две части!',
        '* Щупальца начали стягивать части обратно...',
        '* Он почти восстановился!',
        '* Урон не прошёл!\n* Симбиот полностью восстановился.',
    ],
    freeze: ['* Вы срываете вентиль криобаллона.\n* Ледяная струя бьёт прямо в симбиота!', '* Симбиот покрывается инеем...\n* ...и замирает.'],
    // громкий звук и огонь: если пугнуть и тем, и другим — сбегает, бросив крысу
    loud: ['* Вы изо всех сил колотите вилкой по тарелке!\n* ДЗЫНЬ! ДЗЫНЬ! ДЗЫНЬ!', '* Симбиот визжит и сжимается.\n* Громкие звуки ему не по нраву!'],
    fire: ['* Вы чиркаете сигнальным факелом.\n* Вспыхивает яркий красный огонь!', '* Симбиот шипит и отползает от пламени.\n* Огня он боится!'],
    fearOne: '* Симбиот дрожит. Ещё чуть-чуть — и он сдастся...',
    scared: ['* Звон и огонь — это слишком для него!', '* Симбиот бросает крысу и с воплем удирает в вентиляцию.', '* Крыса свободна — живая и невредимая!'],
    noSpare: '* Вы предлагаете мир.\n* Симбиот не хочет мириться.',
    spare: [
        '* Вы опускаете оружие.',
        '* Лёд трескается. Из него выскальзывает крыса — живая и невредимая!',
        '* А чёрная слизь утекает в щель вентиляции.',
    ],
    shatter: ['* Вы бьёте по ледяной статуе...', '* Симбиот разлетается на тысячи осколков.'],
    flee: '* Вы бежите со всех ног...',
    fleeFail: '* Вы пытаетесь сбежать...\n* Но щупальце хватает вас за ногу!',
    winSpare: ['* ВЫ ПОБЕДИЛИ!\n* Вы получили 0 ОП и 0 монет.'],
    winKill: ['* ВЫ ПОБЕДИЛИ!\n* Вы получили 30 ОП и 0 монет.', '* Ваш LV повысился.'],
    afterSpare: ['* Где-то за ящиками благодарно пискнула крыса.'],   // текст на карте после боя
    afterKill: ['* Под ногами хрустят осколки льда.'],
    // атаки по порядку (описаны в PATTERNS ниже), потом — вперемешку
    patterns: ['drip', 'tentacles', 'teeth', 'blobs', 'ring'],
};

(() => {
'use strict';

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const FONT = '"Press Start 2P", monospace';
const SPEED = 110;         // скорость сердца с клавиатуры, пикс/сек
const TOUCH_SPEED = 230;   // предел скорости, когда ведёшь пальцем

// ---------- АТАКИ ВРАГА ----------
// box — размер рамки, dur — сколько секунд длится, k — злость врага (1 — обычная, больше — быстрее).
// I — внутренняя часть рамки: x0, y0 (левый верх), x1, y1 (правый низ), w, h, cx, cy (центр)
const PATTERNS = {
    // капли слизи падают сверху
    drip: { box: [200, 160], dur: 5.5, heart: 'low', update(S, I, dt, k) {
        S.t = (S.t === undefined ? 0.3 : S.t) - dt;
        if (S.t <= 0) { S.t = 0.42 / k; shot({ kind: 'drop', x: rnd(I.x0 + 8, I.x1 - 8), y: I.y0 - 12, vy: 30, ay: 210 * k, r: 5 }); }
    } },
    // щупальца бьют из стен; перед ударом мигает пунктир — там будет щупальце
    tentacles: { box: [240, 150], dur: 6, update(S, I, dt, k) {
        S.t = (S.t === undefined ? 0.3 : S.t) - dt;
        if (S.t <= 0) {
            S.t = 1.0 / k;
            const y = Math.random() < 0.5 ? H.y : rnd(I.y0 + 10, I.y1 - 10);
            shot({ kind: 'tent', y: clamp(y, I.y0 + 9, I.y1 - 9), side: Math.random() < 0.5 ? -1 : 1, warn: 1.0 / Math.sqrt(k), len: 0 });
        }
    } },
    // пасть: клыки едут справа налево, между верхним и нижним — щель
    teeth: { box: [280, 150], dur: 6.5, update(S, I, dt, k) {
        if (S.t === undefined) { S.t = 0; S.gap = I.cy; }
        S.t -= dt;
        if (S.t <= 0) {
            S.t = 1.2 / k;
            S.gap = clamp(S.gap + rnd(-50, 50), I.y0 + 32, I.y1 - 32);
            shot({ kind: 'tooth', x: I.x1 + 14, gap: S.gap, g: 66, w: 18, vx: -95 * k });
        }
    } },
    // сгустки появляются у стен и летят туда, где сердце
    blobs: { box: [190, 190], dur: 5.5, update(S, I, dt, k) {
        S.t = (S.t === undefined ? 0.2 : S.t) - dt;
        if (S.t <= 0) {
            S.t = 0.8 / k;
            const side = Math.floor(Math.random() * 4), u = Math.random();
            const x = side === 0 ? I.x0 + 8 : side === 1 ? I.x1 - 8 : I.x0 + 8 + u * (I.w - 16);
            const y = side === 2 ? I.y0 + 8 : side === 3 ? I.y1 - 8 : I.y0 + 8 + u * (I.h - 16);
            if (Math.hypot(x - H.x, y - H.y) > 45) shot({ kind: 'blob', x, y, grow: 0.5, sp: 135 * k, r: 0 });
            else S.t = 0.05;
        }
    } },
    // кольцо капель сжимается вокруг сердца — выход только через щель
    ring: { box: [200, 190], dur: 6, update(S, I, dt, k) {
        S.t = (S.t === undefined ? 0.2 : S.t) - dt;
        if (S.t <= 0) {
            S.t = 2.0 / k;
            const n = 16, gap = Math.floor(Math.random() * n), rot = Math.random() * TAU;
            for (let i = 0; i < n; i++) {
                if ((i - gap + n) % n < 3) continue;   // три капли пропускаем — это выход
                shot({ kind: 'pel', cx: H.x, cy: H.y, a: rot + i / n * TAU, rad: 112, vr: -55 * k, r: 5 });
            }
        }
    } },
};

// ---------- экран ----------
const scr = document.getElementById('battle-screen');
const cv = document.getElementById('battle-canvas');
const c = cv.getContext('2d');
const deathScr = document.getElementById('death-screen');
let VW = 640, VH = 480, K = 1, OX = 0, OY = 0;
const L = {};   // раскладка экрана в «пикселях игры» (высота 480, как в Undertale)

function resize() {
    const r = scr.getBoundingClientRect();
    const w = Math.max(1, r.width || window.innerWidth), h = Math.max(1, r.height || window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    if (w >= h) { VH = 480; VW = Math.round(clamp(480 * w / h, 640, 900)); }
    else { VW = 640; VH = Math.round(clamp(640 * h / w, 480, 1000)); }
    K = Math.min(cv.width / VW, cv.height / VH);
    OX = (cv.width - VW * K) / 2; OY = (cv.height - VH * K) / 2;
    const cx0 = L.cx, bot0 = L.boxBot;
    const tall = VH > 560;
    L.cx = VW / 2;
    L.btnH = tall ? 62 : 46;
    L.btnY = VH - L.btnH - 8;
    L.statY = L.btnY - 32;
    L.boxW = Math.min(VW - 40, 600); L.boxH = 140;
    L.boxBot = L.statY - 8;
    L.left = L.cx - L.boxW / 2;
    const top = 34, bot = L.boxBot - L.boxH - 10;
    L.eS = Math.min(bot - top, tall ? 300 : 230);
    L.eCY = (top + bot) / 2;
    L.hpY = 12;
    const TW = Math.min(VW - 32, 740), gap = 14;
    L.bw = (TW - gap * 3) / 4; L.bx = L.cx - TW / 2; L.bgap = gap;
    L.bfont = Math.max(10, Math.min(16, Math.floor((L.bw - 36) / 8)));
    if (bt.on && bt.box === 'text') boxTo(L.boxW, L.boxH, true);
    if (TX.lay) relayout();
    // повернул телефон посреди атаки — сердце и пули едут вместе с рамкой
    const dx = cx0 === undefined ? 0 : L.cx - cx0, dy = bot0 === undefined ? 0 : L.boxBot - bot0;
    if (dx || dy) {
        H.x += dx; H.y += dy;
        for (const u of BUL) {
            if ('x' in u) u.x += dx;
            if ('y' in u) u.y += dy;
            if ('cx' in u) { u.cx += dx; u.cy += dy; }
            if ('gap' in u) u.gap += dy;
        }
        if (bt.pat && bt.pat.S.gap !== undefined) bt.pat.S.gap += dy;
        for (const q of [...(H.shards || []), ...((E.shards && E.shards.list) || []), ...PFX]) { q.x += dx; q.y += dy; }
    }
}

// ---------- картинки ----------
function mk(w, h) { const e = document.createElement('canvas'); e.width = w; e.height = h; return e; }
function spr(rows, col) {
    const e = mk(rows[0].length, rows.length), x = e.getContext('2d');
    x.fillStyle = col;
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') x.fillRect(i, j, 1, 1); });
    return e;
}
const HEART = spr(['.##...##.', '####.####', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'], '#ff0000');
const ICONS = [
    ['.........#', '........##', '.......##.', '......##..', '..#..##...', '...###....', '...##.....', '..#.#.....', '.#........', '#.........'],   // меч
    ['.####.....', '#....#....', '#....#....', '#....#....', '#....#....', '.####.....', '.....##...', '......##..', '.......##.', '........##'],   // лупа
    ['...####...', '..#....#..', '.########.', '#........#', '#.######.#', '#.#....#.#', '#.######.#', '#........#', '#........#', '.########.'],   // сумка
    ['##......##', '.##....##.', '..##..##..', '...####...', '....##....', '...####...', '..##..##..', '.##....##.', '##......##', '..........'],   // крест
];
const ICON = { '#ff7f27': ICONS.map(r => spr(r, '#ff7f27')), '#ffff00': ICONS.map(r => spr(r, '#ffff00')) };

const IMG = {};
for (const k in SYMBIOTE.img) { const im = new Image(); im.src = SYMBIOTE.img[k]; IMG[k] = im; }
// Экран смерти (index.html) показывает ту же стойку — там тоже прячем надпись в углу.
// На GitHub Pages сработает; если браузер не даст (файл открыт с диска) — останется как было
IMG.stand.addEventListener('load', () => {
    try {
        const im = IMG.stand, e = mk(im.naturalWidth, im.naturalHeight), x = e.getContext('2d');
        x.drawImage(im, 0, 0); x.clearRect(0.82 * e.width, 0.912 * e.height, 0.15 * e.width, 0.048 * e.height);
        const k = document.getElementById('killer-symbiote'); if (k) k.src = e.toDataURL();
    } catch (err) {}
});
const RES = 112;    // во столько точек ужимаем картинку врага — получается пиксельно, как в Undertale
const GP = 18;      // запас по краям для свечения
const ART = {};
function art(k) {
    if (ART[k]) return ART[k];
    const im = IMG[k];
    if (!im || !im.complete || !im.naturalWidth) return null;
    const base = mk(RES, RES), b = base.getContext('2d');
    b.imageSmoothingEnabled = true; b.imageSmoothingQuality = 'high';
    b.drawImage(im, 0, 0, RES, RES);
    b.clearRect(0.82 * RES, 0.912 * RES, 0.15 * RES, 0.048 * RES);   // в правом нижнем углу картинок — надпись нейросети, прячем
    // фиолетовое свечение вокруг силуэта (рисуем только тень)
    const glow = mk(RES + GP * 2, RES + GP * 2), g = glow.getContext('2d');
    g.shadowColor = '#8a2be2'; g.shadowBlur = 9; g.shadowOffsetX = 1000;
    g.drawImage(base, GP - 1000, GP); g.drawImage(base, GP - 1000, GP);
    // он же во льду
    const ice = mk(RES, RES), q = ice.getContext('2d');
    q.drawImage(base, 0, 0);
    q.globalCompositeOperation = 'source-atop';
    q.fillStyle = 'rgba(160,215,255,0.62)'; q.fillRect(0, 0, RES, RES);
    q.fillStyle = '#ffffff';
    for (let i = 0; i < 170; i++) q.fillRect(Math.floor(Math.random() * RES), Math.floor(Math.random() * RES), 1, 1);
    return (ART[k] = { base, glow, ice });
}
const ratBlack = new Map();
function blackOf(img) {
    if (!ratBlack.has(img)) {
        const e = mk(img.width, img.height), x = e.getContext('2d');
        x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#100616'; x.fillRect(0, 0, e.width, e.height);
        ratBlack.set(img, e);
    }
    return ratBlack.get(img);
}

// ---------- звук ----------
// Короткие звуки берём у корабля (ship.js), музыку боя собираем прямо в браузере
const snd = () => window.shipSound || null;
function tone(...a) { const s = snd(); if (s) s.tone(...a); }
function noise(...a) { const s = snd(); if (s) s.noise(...a); }
const S = {
    blip: () => tone('square', 540 + Math.random() * 40, 540, 0.035, 0.03),
    voice: () => tone('square', 140 + Math.random() * 30, 110, 0.06, 0.04),
    move: () => tone('square', 660, 660, 0.03, 0.025),
    select: () => { tone('square', 880, 880, 0.04, 0.03); tone('square', 1320, 1320, 0.05, 0.025, 0.04); },
    bar: () => tone('square', 1046, 1046, 0.05, 0.03),
    slash: () => noise(0.28, 0.1, 'bandpass', 5000, 0, 1.2, 500),
    hitE: () => { noise(0.2, 0.1, 'lowpass', 1800, 0, 0.8, 200); tone('square', 180, 60, 0.2, 0.06); },
    squelch: () => noise(0.18, 0.06, 'bandpass', 600, 0, 3, 250),
    regen: () => { tone('sawtooth', 90, 160, 0.4, 0.04); noise(0.4, 0.05, 'lowpass', 500, 0, 1, 1500); },
    miss: () => tone('square', 220, 150, 0.14, 0.04),
    hurt: () => { tone('square', 320, 90, 0.18, 0.07); noise(0.14, 0.07, 'bandpass', 1100, 0, 1); },
    heal: () => [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.14, 0.06, i * 0.06)),
    whip: () => noise(0.12, 0.05, 'highpass', 1800, 0, 0.8, 5000),
    rumble: d => { noise(d, 0.08, 'lowpass', 160, 0, 1, 420); tone('sine', 50, 90, d, 0.06); },
    roar: () => { noise(0.9, 0.12, 'lowpass', 900, 0, 1, 120); tone('sawtooth', 110, 45, 0.8, 0.07); },
    freeze: () => noise(1.1, 0.09, 'highpass', 1500, 0, 0.7, 6000),
    ice: () => [1760, 2349, 2637, 3520].forEach((f, i) => tone('sine', f, f, 0.3, 0.035, i * 0.1)),
    crack: () => { noise(0.07, 0.14, 'highpass', 2500, 0, 0.7); tone('square', 140, 70, 0.1, 0.06); },
    shatter: () => { noise(0.6, 0.12, 'highpass', 3500, 0, 0.6, 900); for (let i = 0; i < 7; i++) tone('triangle', 1800 + Math.random() * 2600, 1500, 0.09, 0.03, i * 0.05); },
    flee: () => [0, 0.1, 0.2, 0.3, 0.4].forEach(w => noise(0.05, 0.06, 'bandpass', 850, w, 2.5)),
    squeak: () => { tone('triangle', 2300, 3300, 0.08, 0.04); tone('triangle', 3200, 2500, 0.1, 0.035, 0.09); },
    clang: () => [0, 0.13, 0.26].forEach(w => { tone('square', 2100, 1900, 0.18, 0.06, w); tone('triangle', 3150, 3000, 0.28, 0.045, w); }),
    fire: () => { noise(1.1, 0.1, 'bandpass', 900, 0, 0.6, 2600); noise(0.7, 0.05, 'highpass', 4000, 0.1, 1); },
    win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone('square', f, f, 0.12, 0.035, i * 0.09)),
};

// Музыка боя: 8 тактов ля минора по кругу — бас, арпеджио, мелодия и барабаны.
// Не играет, если музыку выключили в меню
const MUSIC = (() => {
    const BPM = 156, SD = 60 / BPM / 4, VOL = 0.9;   // VOL — громкость музыки боя
    const CH = [[62, 65, 69], [62, 65, 69], [58, 62, 65], [60, 64, 67], [62, 65, 69], [55, 58, 62], [58, 62, 65], [57, 61, 64]];   // Dm Dm Bb C Dm Gm Bb A
    const BASS = [38, 38, 34, 36, 38, 43, 34, 33];
    const MEL = [   // [шаг из 16, нота, длина в шагах]
        [[0, 74, 2], [2, 74, 2], [4, 77, 2], [6, 74, 2], [8, 81, 4], [12, 79, 2], [14, 77, 2]],
        [[0, 76, 4], [4, 74, 2], [6, 72, 2], [8, 74, 6], [14, 69, 2]],
        [[0, 70, 2], [2, 74, 2], [4, 77, 4], [8, 82, 4], [12, 81, 2], [14, 79, 2]],
        [[0, 79, 4], [4, 76, 4], [8, 72, 4], [12, 76, 2], [14, 79, 2]],
        [[0, 81, 2], [2, 81, 2], [4, 84, 2], [6, 81, 2], [8, 86, 4], [12, 84, 2], [14, 82, 2]],
        [[0, 82, 4], [4, 79, 4], [8, 74, 4], [12, 77, 2], [14, 79, 2]],
        [[0, 77, 2], [2, 79, 2], [4, 81, 4], [8, 82, 2], [10, 81, 2], [12, 79, 2], [14, 77, 2]],
        [[0, 76, 4], [4, 73, 4], [8, 76, 2], [10, 79, 2], [12, 81, 4]],
    ];
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    let ac = null, out = null, timer = 0, next = 0, step = 0, W = null, playing = false;
    function prep(ctx) {
        if (W && W.ctx === ctx) return;
        const pulse = d => {
            const n = 40, re = new Float32Array(n), im = new Float32Array(n);
            for (let i = 1; i < n; i++) re[i] = 2 / (i * Math.PI) * Math.sin(i * Math.PI * d);
            return ctx.createPeriodicWave(re, im);
        };
        const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = nb.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        W = { ctx, p12: pulse(0.125), p25: pulse(0.25), nb };
    }
    function osc(ctx, dst, wave, f, t, dur, vol, dec) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        if (typeof wave === 'string') o.type = wave; else o.setPeriodicWave(wave);
        o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.005);
        if (dec) g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
        else { g.gain.setValueAtTime(vol, Math.max(t + 0.006, t + dur - 0.03)); g.gain.linearRampToValueAtTime(0.0001, t + dur); }
        o.connect(g); g.connect(dst); o.start(t); o.stop(t + dur + 0.05);
    }
    function hiss(ctx, dst, t, dur, vol, type, f) {
        const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
        s.buffer = W.nb; fl.type = type; fl.frequency.value = f;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(fl); fl.connect(g); g.connect(dst); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    }
    function kick(ctx, dst, t) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        g.gain.setValueAtTime(0.45, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.connect(g); g.connect(dst); o.start(t); o.stop(t + 0.2);
    }
    function play(ctx, dst, i, t) {
        const bar = Math.floor(i / 16) % 8, s = i % 16, ch = CH[bar], R = BASS[bar];
        if (s % 2 === 0) osc(ctx, dst, 'triangle', hz(R + (s % 4 === 2 ? 12 : 0)), t, SD * 1.85, 0.22);
        osc(ctx, dst, W.p12, hz(ch[[0, 1, 2, 1][s % 4]]), t, SD, 0.04, SD * 0.9);
        for (const [st, m, len] of MEL[bar]) if (st === s) osc(ctx, dst, W.p25, hz(m), t, SD * len * 0.95, 0.07);
        if (s === 0 || s === 8 || (s === 10 && bar % 2 === 1)) kick(ctx, dst, t);
        if (s === 4 || s === 12) hiss(ctx, dst, t, 0.13, 0.1, 'bandpass', 1900);
        if (s % 4 === 2) hiss(ctx, dst, t, 0.04, 0.035, 'highpass', 7000);
        if ((bar === 3 || bar === 7) && s >= 13) hiss(ctx, dst, t, 0.07, 0.07, 'bandpass', 2400);
    }
    function tick() { while (ac && next < ac.currentTime + 0.2) { play(ac, out, step, next); next += SD; step++; } }
    return {
        start() {
            if (playing || (typeof musicOn !== 'undefined' && !musicOn) || document.hidden) return;
            const s = snd(), ctx = s && s.ctx();
            if (!ctx || ctx.state !== 'running') return;
            try {
                ac = ctx; prep(ctx);
                out = ctx.createGain();
                out.gain.setValueAtTime(0.0001, ctx.currentTime); out.gain.linearRampToValueAtTime(VOL, ctx.currentTime + 0.6);
                out.connect(ctx.destination);
                next = ctx.currentTime + 0.06; step = 0; playing = true;
                tick(); timer = setInterval(tick, 40);
            } catch (e) { playing = false; }
        },
        stop(fade = 0.4) {
            if (!playing) return;
            playing = false; clearInterval(timer);
            try {
                const g = out, t = ac.currentTime;
                g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + Math.max(0.02, fade));
                setTimeout(() => { try { g.disconnect(); } catch (e) {} }, (fade + 0.5) * 1000);
            } catch (e) {}
        },
        get on() { return playing; },
        render(ctx, dst, steps) { prep(ctx); for (let i = 0; i < steps; i++) play(ctx, dst, i, 0.05 + i * SD); },   // для проверки
    };
})();

// ---------- состояние боя ----------
const bt = { on: false, mode: 'off', box: 'text', sel: 0, list: null, t: 0, hinted: {} };
const E = {};   // враг на экране
const H = { x: 0, y: 0, inv: 0, show: false, broken: false, shards: null };   // сердце
const BUL = [];    // пули врага (и брызги в рамке)
const PFX = [];    // частицы над врагом: слизь, лёд, иней
const timers = [], tweens = [];
const wait = s => new Promise(res => timers.push({ t: s, res }));
function tween(obj, key, to, sec) {
    for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].obj === obj && tweens[i].key === key) tweens.splice(i, 1);
    return new Promise(res => tweens.push({ obj, key, from: obj[key], to, t: 0, sec: Math.max(0.001, sec), res }));
}

// рамка: в обычном виде — широкая, для текста; в ход врага сжимается в квадрат с сердцем
const box = { w: 600, h: 140, tw: 600, th: 140 };
function boxTo(w, h, now) { box.tw = w; box.th = h; if (now) { box.w = w; box.h = h; } }
const boxRect = () => ({ x: L.cx - box.w / 2, y: L.boxBot - box.h, w: box.w, h: box.h });
function inner() {
    const r = boxRect();
    return { x0: r.x + 5, y0: r.y + 5, x1: r.x + r.w - 5, y1: r.y + r.h - 5, w: r.w - 10, h: r.h - 10, cx: r.x + r.w / 2, cy: r.y + r.h / 2 };
}
const boxReady = () => Math.abs(box.w - box.tw) < 0.5 && Math.abs(box.h - box.th) < 0.5;
async function boxWait() { while (bt.on && !boxReady()) await wait(0.02); }

// ---------- текст в рамке, по буквам ----------
// show — фоновая фраза; say — ждёт нажатия после каждой страницы; line — уходит сама через hold секунд
const TX = { mode: 'none', pages: [], i: 0, n: 0, acc: 0, lay: null, done: true, hold: 0, res: null };
function wrapText(str, px, maxW) {
    c.font = px + 'px ' + FONT;
    const ind = c.measureText('* ').width, out = [];
    for (const para of String(str).split('\n')) {
        const bullet = para.startsWith('* '), words = (bullet ? para.slice(2) : para).split(' ');
        const w = maxW - (bullet ? ind : 0);
        let line = '', first = true;
        for (const word of words) {
            const test = line ? line + ' ' + word : word;
            if (line && c.measureText(test).width > w) { out.push({ bullet: bullet && first, ind: bullet ? ind : 0, s: line }); first = false; line = word; }
            else line = test;
        }
        out.push({ bullet: bullet && first, ind: bullet ? ind : 0, s: line });
    }
    return out;
}
function layoutText(str) {
    const maxW = L.boxW - 44, maxH = L.boxH - 30;
    for (const px of [18, 16, 14, 12]) {
        const lines = wrapText(str, px, maxW), lh = Math.round(px * 1.6);
        if (lines.length * lh - (lh - px) <= maxH || px === 12) {
            const flat = lines.map(l => (l.bullet ? '* ' : '') + l.s).join('');
            return { lines, px, lh, flat, total: flat.length };
        }
    }
}
function setPage(str) { TX.lay = layoutText(str); TX.n = 0; TX.acc = 0; TX.done = false; }
function relayout() { const n = TX.n; TX.lay = layoutText(TX.pages[TX.i]); TX.n = Math.min(n, TX.lay.total); }
function settle() { if (TX.res) { const r = TX.res; TX.res = null; r(); } }
function txShow(str, instant) {
    settle(); TX.mode = 'show'; TX.pages = [str]; TX.i = 0; setPage(str);
    if (instant) { TX.n = TX.lay.total; TX.done = true; }
}
function txSay(pages) {
    settle();
    return new Promise(res => { TX.mode = 'say'; TX.pages = [].concat(pages); TX.i = 0; TX.res = res; setPage(TX.pages[0]); });
}
function txLine(str, hold) {
    settle();
    return new Promise(res => { TX.mode = 'line'; TX.pages = [str]; TX.i = 0; TX.hold = hold; TX.res = res; setPage(str); });
}
function txClear() { settle(); TX.mode = 'none'; TX.lay = null; }
function txConfirm() {   // true — нажатие ушло в текст
    if (!TX.lay || TX.mode === 'none' || TX.mode === 'show') return false;
    if (!TX.done) { TX.n = TX.lay.total; TX.done = true; return true; }
    if (TX.mode === 'line') { TX.hold = 0; return true; }
    if (++TX.i < TX.pages.length) { setPage(TX.pages[TX.i]); return true; }
    TX.mode = 'none'; TX.lay = null; settle();
    return true;
}
function txUpdate(dt) {
    if (!TX.lay) return;
    if (TX.done) {
        if (TX.mode === 'line') { TX.hold -= dt; if (TX.hold <= 0) { TX.mode = 'none'; TX.lay = null; settle(); } }
        return;
    }
    TX.acc += dt;
    while (!TX.done && TX.acc >= 0) {
        const ch = TX.lay.flat[TX.n], nx = TX.lay.flat[TX.n + 1];
        TX.n++;
        if (ch && ch.trim() && ch !== '*' && TX.n % 2) S.blip();
        if (TX.n >= TX.lay.total) { TX.done = true; break; }
        const end = nx === undefined || nx === ' ';
        TX.acc -= 0.032 + ('.!?…'.includes(ch) && end ? 0.2 : (',:;—'.includes(ch) && end ? 0.08 : 0));
    }
}

// облачко с репликой врага
function bubble(text) { return new Promise(res => { E.bubble = { text, n: 0, acc: 0, hold: 1.1, res, lay: null }; }); }
function bubbleSkip() {
    const B = E.bubble; if (!B) return;
    if (B.n < B.text.length) B.n = B.text.length; else { E.bubble = null; B.res(); }
}
function bubbleUpdate(dt) {
    const B = E.bubble; if (!B) return;
    if (B.n < B.text.length) {
        B.acc += dt;
        while (B.acc >= 0.055 && B.n < B.text.length) { B.acc -= 0.055; B.n++; if (B.n % 2 && B.text[B.n - 1].trim()) S.voice(); }
    } else { B.hold -= dt; if (B.hold <= 0) { E.bubble = null; B.res(); } }
}

// ---------- пули ----------
function shot(o) { BUL.push(Object.assign({ t: 0, vx: 0, vy: 0 }, o)); }
function splash(x, y) { for (let i = 0; i < 4; i++) BUL.push({ kind: 'fx', x, y, vx: rnd(-60, 60), vy: rnd(-110, -40), t: 0, life: rnd(0.25, 0.45) }); }
function updBullets(dt, I) {
    for (let i = BUL.length - 1; i >= 0; i--) {
        const u = BUL[i]; let dead = false;
        u.t += dt;
        switch (u.kind) {
            case 'drop':
                u.vy += u.ay * dt; u.y += u.vy * dt;
                if (u.y > I.y1 - 3) { splash(u.x, I.y1 - 2); dead = true; }
                break;
            case 'tent': {
                const t1 = u.warn, t2 = t1 + 0.12, t3 = t2 + 0.28, t4 = t3 + 0.22, full = I.w * 0.9;
                u.len = u.t < t1 ? 0 : u.t < t2 ? full * (u.t - t1) / 0.12 : u.t < t3 ? full : full * Math.max(0, 1 - (u.t - t3) / 0.22);
                if (u.t >= t1 && !u.snd) { u.snd = true; S.whip(); }
                if (u.t >= t4) dead = true;
                break;
            }
            case 'tooth':
                u.x += u.vx * dt;
                if (u.x < I.x0 - 30) dead = true;
                break;
            case 'blob':
                if (u.t < u.grow) u.r = 7 * u.t / u.grow;
                else {
                    if (!u.go) { const dx = H.x - u.x, dy = H.y - u.y, d = Math.hypot(dx, dy) || 1; u.vx = dx / d * u.sp; u.vy = dy / d * u.sp; u.go = true; u.r = 7; }
                    u.x += u.vx * dt; u.y += u.vy * dt;
                    if (u.x < I.x0 - 20 || u.x > I.x1 + 20 || u.y < I.y0 - 20 || u.y > I.y1 + 20) dead = true;
                }
                break;
            case 'pel':
                u.rad += u.vr * dt; u.a += 0.5 * dt;
                u.x = u.cx + Math.cos(u.a) * u.rad; u.y = u.cy + Math.sin(u.a) * u.rad;
                if (u.rad < 8) dead = true;
                break;
            case 'fx':
                u.vy += 300 * dt; u.x += u.vx * dt; u.y += u.vy * dt;
                if (u.t > u.life) dead = true;
                break;
        }
        if (dead) BUL.splice(i, 1);
    }
}
function hits(u, I) {
    const R = 4;   // сердце для попаданий меньше картинки — так честнее
    switch (u.kind) {
        case 'drop': case 'pel': return Math.hypot(u.x - H.x, u.y - H.y) < u.r + R;
        case 'blob': return u.go && Math.hypot(u.x - H.x, u.y - H.y) < u.r + R;
        case 'tent': {
            if (u.len < 6) return false;
            const x0 = u.side < 0 ? I.x0 : I.x1 - u.len, x1 = u.side < 0 ? I.x0 + u.len : I.x1;
            return H.x > x0 - R && H.x < x1 + R && Math.abs(H.y - u.y) < 5 + R;
        }
        case 'tooth':
            return Math.abs(H.x - u.x) < u.w / 2 + R - 2 && (H.y < u.gap - u.g / 2 + R - 1 || H.y > u.gap + u.g / 2 - R + 1);
    }
    return false;
}

// ---------- сам бой ----------
function startRatEncounter() {
    if (bt.on) return;
    document.getElementById('controls').style.display = 'none';
    document.getElementById('map-container').style.display = 'none';
    deathScr.style.display = 'none';
    scr.style.display = 'block';
    Object.assign(bt, { on: true, mode: 'intro', box: 'text', sel: 0, list: null, turn: 0, anger: 0, last: null, patI: 0, t: 0,
        fade: 1, flash: 0, shake: 0, hint: null, acts: {}, ratCalled: false, fight: null, pat: null, spray: 0, flavor: '', hitSeen: false });
    Object.assign(E, { img: 'stand', showRat: true, showSym: false, mut: 0, pop: 1, hp: SYMBIOTE.hp, hpShown: SYMBIOTE.hp, shake: 0, ice: 0, fear: {},
        alpha: 1, dy: 0, ratA: 1, ratRun: -1, slash: -1, fx: null, shards: null, bubble: null });
    Object.assign(H, { show: false, broken: false, shards: null, inv: 0 });
    BUL.length = 0; PFX.length = 0; timers.length = 0; tweens.length = 0; TX.mode = 'none'; TX.lay = null; TX.res = null;
    keys.clear(); drag.id = null; drag.dx = drag.dy = 0;
    resize();
    boxTo(L.boxW, L.boxH, true);
    if (document.fonts && document.fonts.load) document.fonts.load('16px "Press Start 2P"').then(() => { if (TX.lay) relayout(); }).catch(() => {});
    last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    intro();
}
async function intro() {
    tween(bt, 'fade', 0, 0.35);
    const again = !!HERO.flags.metSymbiote;
    HERO.flags.metSymbiote = true;
    if (!again) await txSay([SYMBIOTE.intro]);
    if (!bt.on) return;
    txShow(again ? SYMBIOTE.again : SYMBIOTE.trap);
    S.rumble(again ? 1.1 : 1.9);
    await tween(E, 'mut', 1, again ? 1.1 : 1.9);
    if (!bt.on) return;
    bt.flash = 1; bt.shake = 0.45; S.roar();
    E.showRat = false; E.showSym = true; E.pop = 0.55; tween(E, 'pop', 1, 0.35);
    await wait(0.6);
    if (!bt.on) return;
    MUSIC.start();
    playerTurn(SYMBIOTE.appear);
}

function playerTurn(text) {
    if (!bt.on) return;
    bt.mode = 'menu'; bt.list = null; bt.box = 'text'; boxTo(L.boxW, L.boxH);
    bt.flavor = text || (E.ice >= 1 ? SYMBIOTE.frozen : HERO.hp <= 5 ? SYMBIOTE.lowHp : pick(SYMBIOTE.flavor));
    txShow(bt.flavor);
}

const BTN = ['АТАКА', 'ДЕЙСТВИЕ', 'ПРЕДМЕТ', 'ПОЩАДА'];
function pressButton(i) {
    if (bt.mode !== 'menu' && bt.mode !== 'list') return;
    if (bt.mode === 'list' && bt.list.btn === i) { closeList(); S.move(); return; }   // нажал ту же кнопку — закрыть
    bt.sel = i; S.select();
    if (i === 0) return startFight();
    if (i === 1) return openList(1, actOpts());
    if (i === 2) {
        if (!HERO.items.length) { bt.mode = 'menu'; bt.list = null; bt.box = 'text'; txShow('* У вас нет предметов.'); return; }
        return openList(2, itemOpts());
    }
    return openList(3, mercyOpts());
}
function openList(btn, opts) { bt.mode = 'list'; bt.list = { btn, opts, sel: 0 }; bt.box = 'list'; txClear(); }
function closeList() { bt.mode = 'menu'; bt.list = null; bt.box = 'text'; txShow(bt.flavor, true); }
async function choose(o) {
    if (bt.mode !== 'list') return;
    S.select();
    bt.mode = 'busy'; bt.list = null; bt.box = 'text';
    const r = await o.run();
    if (!bt.on || r === 'end') return;
    await enemyTurn();
}

function actOpts() {
    return Object.keys(SYMBIOTE.acts).map(name => ({ label: name, run: async () => {
        const v = SYMBIOTE.acts[name], k = bt.acts[name] = (bt.acts[name] || 0) + 1;
        if (name === 'Позвать крысу') bt.ratCalled = true;
        await txSay(v[Math.min(k, v.length) - 1]);
    } }));
}
function itemOpts() { return HERO.items.map(id => ({ label: ITEMS[id] ? ITEMS[id].name : id, run: () => useItem(id) })); }
function mercyOpts() { return [{ label: 'Пощадить', color: E.ice >= 1 ? '#ffff00' : '#ffffff', run: spare }, { label: 'Бежать', run: flee }]; }

function takeItem(id) { const i = HERO.items.indexOf(id); if (i >= 0) HERO.items.splice(i, 1); }
async function useItem(id) {
    const it = ITEMS[id] || { name: id, use: '* Ничего не происходит.' };
    if (id === 'cryo' && E.showSym && E.ice < 1) { takeItem(id); return freeze(); }
    if ((id === 'fork' || id === 'flare') && E.showSym && E.ice < 1) { if (id === 'flare') takeItem(id); return scare(id); }
    if (id === 'claws') {
        if (HERO.flags.claws) return txSay(['* Когти уже на вас.']);
        HERO.flags.claws = true; S.bar(); return txSay([it.use]);
    }
    if (it.heal) {
        takeItem(id);
        const before = HERO.hp;
        HERO.hp = Math.min(HERO.maxHp, HERO.hp + it.heal); S.heal();
        await txSay([it.use + (HERO.hp >= HERO.maxHp ? '\n* HP полностью восстановлено.' : `\n* Восстановлено ${HERO.hp - before} HP.`)]);
        return;
    }
    await txSay([it.use]);
}
async function freeze() {
    S.freeze(); bt.spray = 1.2;
    await txSay([SYMBIOTE.freeze[0]]);
    S.ice(); tween(E, 'ice', 1, 0.9);
    await txSay([SYMBIOTE.freeze[1]]);
    E.ice = 1; HERO.flags.froze = true;
}
async function scare(id) {
    E.fear = E.fear || {};
    const first = !E.fear[id];
    E.fear[id] = true;
    if (id === 'fork') { S.clang(); E.shake = 0.6; } else { S.fire(); E.shake = 0.4; }
    await txSay(id === 'fork' ? SYMBIOTE.loud : SYMBIOTE.fire);
    if (E.fear.fork && E.fear.flare) return scaredAway();
    if (first) await txSay([SYMBIOTE.fearOne]);
}
async function scaredAway() {
    MUSIC.stop(1.2); HERO.flags.scared = true;
    await txSay([SYMBIOTE.scared[0]]);
    tween(E, 'alpha', 0, 1.2); tween(E, 'dy', -40, 1.2);   // слизь уползает вверх, в вентиляцию
    E.showRat = true; E.mut = 0; E.ratA = 0; tween(E, 'ratA', 1, 0.5); S.squeak();
    await txSay([SYMBIOTE.scared[1]]);
    E.ratRun = 0; tween(E, 'ratRun', 1, 0.9); S.squeak();
    await txSay([SYMBIOTE.scared[2]]);
    E.showSym = false; S.win();
    await txSay(SYMBIOTE.winSpare);
    endBattle('spared');
    return 'end';
}
async function spare() {
    if (E.ice < 1) { await txSay([SYMBIOTE.noSpare]); return; }
    MUSIC.stop(1.2);
    await txSay([SYMBIOTE.spare[0]]);
    S.crack(); E.shake = 0.4;
    tween(E, 'alpha', 0, 1.5); tween(E, 'dy', 30, 1.5);   // лёд тает, слизь стекает
    E.showRat = true; E.mut = 0; E.ratA = 0; tween(E, 'ratA', 1, 0.5); S.squeak();
    await txSay([SYMBIOTE.spare[1]]);
    E.ratRun = 0; tween(E, 'ratRun', 1, 0.9); S.squeak();
    await txSay([SYMBIOTE.spare[2]]);
    E.showSym = false; S.win();
    await txSay(SYMBIOTE.winSpare);
    endBattle('spared');
    return 'end';
}
async function flee() {
    if (!(E.ice >= 1 || Math.random() < 0.5)) { await txSay([SYMBIOTE.fleeFail]); return; }
    MUSIC.stop(0.5); S.flee();
    await txSay([SYMBIOTE.flee]);
    endBattle('fled');
    return 'end';
}

// АТАКА: полоска бежит по мишени, чем ближе к центру — тем сильнее удар
function startFight() {
    bt.mode = 'fight'; bt.list = null; bt.box = 'fight'; txClear();
    bt.fight = { t: 0, dur: 1.4, stopped: false, blink: 0 };
    if (!bt.hinted.fight) { bt.hinted.fight = true; bt.hint = { text: touchMode ? 'Нажми, когда полоска в центре' : 'Жми Z, когда полоска в центре', t: 2.6 }; }
}
function fightStop(hit) {
    const f = bt.fight;
    if (bt.mode !== 'fight' || !f || f.stopped) return;
    f.stopped = true; bt.mode = 'busy'; bt.hint = null;
    const I = inner(), rx = I.w / 2 - 10, bx = -rx + 2 * rx * Math.min(1, f.t / f.dur);
    const acc = hit ? Math.max(0, 1 - Math.abs(bx) / rx) : -1;
    if (hit) S.bar();
    (async () => { const r = await fightResolve(acc); if (bt.on && r !== 'end') await enemyTurn(); })();
}
async function fightResolve(acc) {
    if (acc < 0) {
        S.miss(); E.fx = { text: 'ПРОМАХ', col: '#c8c8c8', t: 0 };
        await wait(1.1); bt.fight = null; bt.box = 'text';
        return;
    }
    await wait(0.15);
    S.slash(); E.slash = 0;
    await wait(0.4);
    bt.fight = null; bt.box = 'text';
    if (E.ice >= 1) return shatter();
    const dmg = Math.max(1, Math.round((8 + 24 * acc + (HERO.flags.claws ? 8 : 0)) * rnd(0.9, 1.1)));
    E.img = 'cut'; E.shake = 0.45; S.hitE();
    E.hp = Math.max(0, E.hp - dmg); E.fx = { text: String(dmg), col: '#ff3030', t: 0 };
    const HT = SYMBIOTE.hit;
    if (!bt.hitSeen) {   // в первый раз — подробно, как он срастается
        bt.hitSeen = true;
        await txLine(HT[0].replace('{dmg}', dmg), 0.8);
        E.img = 'split'; S.squelch(); await txLine(HT[1], 0.6);
        E.img = 'join1'; S.squelch(); await txLine(HT[2], 0.5);
        E.img = 'join2'; S.squelch(); await txLine(HT[3], 0.5);
    } else {             // потом — быстрее, чтобы не ждать каждый раз
        txShow(HT[0].replace('{dmg}', dmg));
        await wait(0.8);
        for (const k of ['split', 'join1', 'join2']) { if (!bt.on) return; E.img = k; S.squelch(); await wait(0.4); }
    }
    E.img = 'stand'; E.hp = SYMBIOTE.hp; S.regen(); await txLine(HT[4], 1.0);
    bt.anger = 2;   // бить его бесполезно — только злится
}
async function shatter() {
    MUSIC.stop(0.3);
    S.hitE(); E.shake = 0.3;
    await txLine(SYMBIOTE.shatter[0], 0.5);
    S.shatter(); bt.shake = 0.3;
    const a = art(E.img), s = L.eS, n = 8, x0 = L.cx - s / 2, y0 = L.eCY + s / 2 - s, list = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++)
        list.push({ sx: i * RES / n, sy: j * RES / n, x: x0 + (i + 0.5) * s / n, y: y0 + (j + 0.5) * s / n, vx: (i - n / 2 + 0.5) * rnd(12, 40), vy: rnd(-160, -20), r: 0, vr: rnd(-6, 6) });
    E.shards = a ? { list, src: a.ice, w: s / n, t: 0 } : null;
    E.showSym = false;
    await wait(1.0);
    await txSay([SYMBIOTE.shatter[1]]);
    HERO.exp = (HERO.exp || 0) + 30; HERO.lv = Math.max(HERO.lv, 2);
    if (HERO.maxHp < 24) { HERO.hp += 24 - HERO.maxHp; HERO.maxHp = 24; }
    S.win();
    await txSay(SYMBIOTE.winKill);
    endBattle('killed');
    return 'end';
}

// ход врага: реплика, потом атака — сердце уворачивается в рамке
function nextPattern() {
    const list = SYMBIOTE.patterns;
    const n = bt.patI < list.length ? list[bt.patI] : pick(list.filter(p => p !== bt.last));
    bt.patI++; bt.last = n;
    return n;
}
async function enemyTurn() {
    if (!bt.on) return;
    bt.turn++;
    if (E.ice >= 1) { playerTurn(SYMBIOTE.frozen); return; }   // во льду — не атакует
    const name = nextPattern(), def = PATTERNS[name];
    bt.mode = 'dodge'; bt.box = 'board'; txClear();
    H.show = false; BUL.length = 0;
    boxTo(def.box[0], def.box[1]);
    await boxWait();
    if (!bt.on) return;
    const I = inner();
    H.x = I.cx; H.y = def.heart === 'low' ? I.y1 - 24 : I.cy; H.show = true; H.inv = 0; drag.dx = drag.dy = 0;
    const line = bt.ratCalled ? SYMBIOTE.ratTalk : bt.anger > 0 ? pick(SYMBIOTE.angry) : pick(SYMBIOTE.talk);
    bt.ratCalled = false;
    await bubble(line);
    if (!bt.on) return;
    if (!bt.hinted.dodge) { bt.hinted.dodge = true; bt.hint = { text: touchMode ? 'Джойстик слева — двигать сердце' : 'Стрелки — двигать сердце', t: 3.2 }; }
    const k = Math.min(1.4, 1 + 0.05 * Math.min(bt.turn - 1, 6) + (bt.anger > 0 ? 0.2 : 0)) * (E.fear && Object.keys(E.fear).length ? 0.8 : 1);   // напуганный — бьёт слабее
    const ok = await new Promise(res => { bt.pat = { def, S: {}, t: 0, k, res, over: false }; });
    bt.pat = null;
    bt.anger = Math.max(0, bt.anger - 1);
    if (!bt.on) return;
    if (!ok) return death();
    BUL.length = 0; H.show = false;
    playerTurn();
}
function dodgeUpdate(dt) {
    const I = inner();
    let mx = 0, my = 0;
    if (kd('ArrowLeft', 'KeyA')) mx--;
    if (kd('ArrowRight', 'KeyD')) mx++;
    if (kd('ArrowUp', 'KeyW')) my--;
    if (kd('ArrowDown', 'KeyS')) my++;
    if (mx || my) { const l = Math.hypot(mx, my); H.x += mx / l * SPEED * dt; H.y += my / l * SPEED * dt; }
    if (bj.id !== null) { H.x += bj.x * SPEED * 1.3 * dt; H.y += bj.y * SPEED * 1.3 * dt; }   // джойстик: чем дальше палец, тем быстрее
    if (drag.dx || drag.dy) {
        const l = Math.hypot(drag.dx, drag.dy), m = Math.min(l, TOUCH_SPEED * dt);
        H.x += drag.dx / l * m; H.y += drag.dy / l * m;
        drag.dx -= drag.dx / l * m; drag.dy -= drag.dy / l * m;
        if (Math.abs(drag.dx) < 0.01 && Math.abs(drag.dy) < 0.01) drag.dx = drag.dy = 0;
    }
    H.x = clamp(H.x, I.x0 + 9, I.x1 - 9); H.y = clamp(H.y, I.y0 + 8, I.y1 - 8);
    const P = bt.pat;
    if (P && !P.over) {
        P.t += dt;
        if (P.t < P.def.dur - 0.7) P.def.update(P.S, I, dt, P.k);
        if (P.t >= P.def.dur) { P.over = true; P.res(true); }
    }
    updBullets(dt, I);
    if (P && !P.over && H.inv <= 0) for (const u of BUL) if (u.kind !== 'fx' && hits(u, I)) { hurt(); break; }
}
function hurt() {
    HERO.hp = Math.max(0, HERO.hp - SYMBIOTE.dmg);
    H.inv = 1; bt.shake = 0.22; S.hurt();
    if (HERO.hp <= 0 && bt.pat && !bt.pat.over) { bt.pat.over = true; bt.pat.res(false); }
}

// смерть: сердце трескается и разлетается, потом экран смерти (index.html)
async function death() {
    bt.mode = 'dead'; MUSIC.stop(0); BUL.length = 0; E.bubble = null; bt.hint = null; txClear();
    H.show = true; H.inv = 0;
    await wait(0.8);
    H.broken = true; S.crack();
    await wait(1.1);
    H.show = false; S.shatter();
    H.shards = Array.from({ length: 6 }, () => ({ x: H.x + rnd(-4, 4), y: H.y + rnd(-4, 4), vx: rnd(-120, 120), vy: rnd(-220, -60) }));
    await wait(1.7);
    if (!bt.on) return;
    bt.mode = 'deathscreen';
    deathScr.style.display = 'none'; void deathScr.offsetWidth; deathScr.style.display = 'flex';   // анимации экрана смерти — заново
    bt.deadAt = performance.now();
}
function deathContinue() {
    if (bt.mode !== 'deathscreen' || performance.now() - bt.deadAt < 3200) return;
    deathScr.style.display = 'none';
    closeBattle();
    const s = typeof loadShipSave === 'function' ? loadShipSave() : null;
    if (s && typeof startShip === 'function') {   // с последней звезды
        startShip(s);
        HERO.flags.metSymbiote = true;   // во второй раз крыса мутирует сразу, без долгого вступления
    } else location.reload();            // сохранений нет — в главное меню
}
deathScr.addEventListener('pointerdown', e => { if (bt.mode === 'deathscreen') { e.preventDefault(); deathContinue(); } });

function closeBattle() {
    bt.on = false; bt.mode = 'off'; cancelAnimationFrame(raf); raf = 0;
    scr.style.display = 'none';
    timers.length = 0; tweens.length = 0; BUL.length = 0; PFX.length = 0;
    keys.clear(); drag.id = null;
}
async function endBattle(res) {
    bt.mode = 'end';
    await tween(bt, 'fade', 1, 0.45);
    closeBattle();
    if (res === 'fled') resumeShip({ fled: true });
    else { HERO.flags.symbiote = res; resumeShip({ ratGone: true }); }
    const after = res === 'spared' ? SYMBIOTE.afterSpare : res === 'killed' ? SYMBIOTE.afterKill : null;
    if (after && typeof say === 'function') say(after);
}

// ---------- кадр ----------
let raf = 0, last = 0;
function loop(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    update(dt); draw();
    if (bt.on) raf = requestAnimationFrame(loop);
}
function update(dt) {
    bt.t += dt;
    for (let i = timers.length - 1; i >= 0; i--) { const tm = timers[i]; tm.t -= dt; if (tm.t <= 0) { timers.splice(i, 1); tm.res(); } }
    for (let i = tweens.length - 1; i >= 0; i--) {
        const w = tweens[i]; w.t += dt; const k = Math.min(1, w.t / w.sec);
        w.obj[w.key] = w.from + (w.to - w.from) * k;
        if (k >= 1) { tweens.splice(i, 1); w.res(); }
    }
    const sp = 1500 * dt;
    box.w += clamp(box.tw - box.w, -sp, sp); box.h += clamp(box.th - box.h, -sp, sp);
    txUpdate(dt); bubbleUpdate(dt);
    bt.flash = Math.max(0, bt.flash - dt * 2); bt.shake = Math.max(0, bt.shake - dt);
    E.shake = Math.max(0, E.shake - dt); H.inv = Math.max(0, H.inv - dt);
    if (E.slash >= 0) { E.slash += dt; if (E.slash > 0.5) E.slash = -1; }
    if (E.fx) { E.fx.t += dt; if (E.fx.t > 1.2) E.fx = null; }
    E.hpShown += clamp(E.hp - E.hpShown, -150 * dt, 150 * dt);
    if (bt.hint) { bt.hint.t -= dt; if (bt.hint.t <= 0) bt.hint = null; }
    if (bt.mode === 'fight' && bt.fight && !bt.fight.stopped) { bt.fight.t += dt; if (bt.fight.t >= bt.fight.dur) fightStop(false); }
    if (bt.fight && bt.fight.stopped) bt.fight.blink += dt;
    if (bt.mode === 'dodge') dodgeUpdate(dt);
    // частицы: слизь при мутации, ледяная струя, иней
    if (E.showRat && E.mut > 0 && E.ratRun < 0 && Math.random() < dt * 45 * E.mut)
        PFX.push({ x: L.cx + rnd(-66, 66), y: L.eCY + L.eS * 0.3 - rnd(0, 40), vx: rnd(-30, 30), vy: rnd(-110, -30), t: 0, life: rnd(0.4, 0.9), col: Math.random() < 0.5 ? '#8a2be2' : '#1a0a24', s: rnd(3, 6) });
    if (bt.spray > 0) {
        bt.spray -= dt;
        for (let i = 0; i < 3; i++) { const x = L.cx + rnd(-26, 26), y = L.boxBot - L.boxH - 4; PFX.push({ x, y, vx: (L.cx - x) * 0.8 + rnd(-50, 50), vy: rnd(-330, -230), t: 0, life: rnd(0.45, 0.7), col: Math.random() < 0.5 ? '#dff4ff' : '#7fd4ff', s: rnd(3, 6) }); }
    }
    if (E.showSym && E.ice >= 1 && E.alpha > 0.5 && Math.random() < dt * 7)
        PFX.push({ x: L.cx + rnd(-0.35, 0.35) * L.eS, y: L.eCY + rnd(-0.4, 0.45) * L.eS, vx: 0, vy: 0, t: 0, life: 0.5, col: '#ffffff', s: 2, star: true });
    for (let i = PFX.length - 1; i >= 0; i--) { const p = PFX[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.t > p.life) PFX.splice(i, 1); }
    if (E.shards) { E.shards.t += dt; for (const q of E.shards.list) { q.vy += 520 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt; } if (E.shards.t > 1.8) E.shards = null; }
    if (H.shards) for (const q of H.shards) { q.vy += 600 * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
}

// ---------- рисуем ----------
function draw() {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
    let sx = 0, sy = 0;
    if (bt.shake > 0) { const a = 6 * Math.min(1, bt.shake / 0.25); sx = rnd(-a, a); sy = rnd(-a, a); }
    c.setTransform(K, 0, 0, K, OX + sx * K, OY + sy * K);
    c.textBaseline = 'top';
    if (bt.mode === 'dead' || bt.mode === 'deathscreen') { drawDeathHeart(); return; }
    drawEnemy(); drawPfx(); drawEnemyHp(); drawSlash(); drawDmg(); drawBubble();
    drawBox(); drawStats(); drawButtons(); drawHint();
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (bt.flash > 0) { c.fillStyle = `rgba(255,255,255,${bt.flash.toFixed(3)})`; c.fillRect(0, 0, cv.width, cv.height); }
    if (bt.fade > 0) { c.fillStyle = `rgba(0,0,0,${Math.min(1, bt.fade).toFixed(3)})`; c.fillRect(0, 0, cv.width, cv.height); }
}
function drawEnemy() {
    const s = L.eS, cx = L.cx, cy = L.eCY;
    const ga = E.showSym ? 0.55 * E.alpha : E.showRat && E.ratRun < 0 ? 0.15 + 0.4 * E.mut : 0;
    if (ga > 0.01) {
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, s * 0.62);
        g.addColorStop(0, `rgba(138,43,226,${ga.toFixed(3)})`); g.addColorStop(1, 'rgba(138,43,226,0)');
        c.fillStyle = g; c.fillRect(cx - s, cy - s, s * 2, s * 2);
    }
    const ox = E.shake > 0 ? Math.sin(bt.t * 70) * 7 * Math.min(1, E.shake / 0.3) : 0;
    if (E.showSym && E.alpha > 0.01) {
        const a = art(E.img);
        if (a) {
            const bob = E.ice >= 0.5 ? 0 : Math.sin(bt.t * 2.2) * 0.018;
            const w = s * E.pop, h = s * E.pop * (1 + bob), x = cx - w / 2 + ox, y = cy + s / 2 - h + E.dy;
            const pw = w * GP / RES, ph = h * GP / RES;
            c.globalAlpha = E.alpha;
            c.imageSmoothingEnabled = true;
            c.drawImage(a.glow, x - pw, y - ph, w + pw * 2, h + ph * 2);
            c.imageSmoothingEnabled = false;
            c.drawImage(a.base, x, y, w, h);
            if (E.ice > 0) { c.globalAlpha = E.alpha * Math.min(1, E.ice); c.drawImage(a.ice, x, y, w, h); }
            c.globalAlpha = 1;
        }
    }
    if (E.showRat) {
        const art2 = window.shipArt && window.shipArt.rat;
        if (art2) {
            const img = art2[Math.floor(bt.t * 3) % 2], sc = 6, w = img.width * sc, h = img.height * sc;
            let x = cx - w / 2 + ox, y = cy + s * 0.32 - h;
            if (E.mut > 0 && E.ratRun < 0) { const a = 1 + E.mut * 7; x += rnd(-a, a); y += rnd(-a, a) * 0.5; }
            if (E.ratRun >= 0) x += E.ratRun * (VW * 0.6);
            c.globalAlpha = E.ratA; c.imageSmoothingEnabled = false;
            c.drawImage(img, x, y, w, h);
            if (E.mut > 0 && E.ratRun < 0) { c.globalAlpha = E.ratA * Math.min(0.92, E.mut); c.drawImage(blackOf(img), x, y, w, h); }
            c.globalAlpha = 1;
        }
    }
    if (E.shards) {
        const Q = E.shards, al = Math.max(0, 1 - Q.t / 1.8);
        c.globalAlpha = al; c.imageSmoothingEnabled = false;
        for (const q of Q.list) {
            c.save(); c.translate(q.x, q.y); c.rotate(q.r);
            c.drawImage(Q.src, q.sx, q.sy, RES / 8, RES / 8, -Q.w / 2, -Q.w / 2, Q.w, Q.w);
            c.restore();
        }
        c.globalAlpha = 1;
    }
}
function drawPfx() {
    for (const p of PFX) {
        const a = 1 - p.t / p.life;
        c.globalAlpha = Math.max(0, a); c.fillStyle = p.col;
        if (p.star) { c.fillRect(p.x - 3, p.y - 0.5, 6, 1); c.fillRect(p.x - 0.5, p.y - 3, 1, 6); }
        else c.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }
    c.globalAlpha = 1;
}
function drawEnemyHp() {
    const w = 200, x = L.cx - w / 2, y = L.hpY;
    c.fillStyle = '#333'; c.fillRect(x, y, w, 12);
    c.fillStyle = E.showRat && !E.showSym && E.ratRun < 0 ? '#00ff00' : E.ice >= 0.5 ? '#7fd4ff' : '#8a2be2';
    c.fillRect(x, y, w * clamp(E.hpShown / SYMBIOTE.hp, 0, 1), 12);
    c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(x - 1, y - 1, w + 2, 14);
}
function drawSlash() {
    if (E.slash < 0) return;
    const s = L.eS, x0 = L.cx + s * 0.3, y0 = L.eCY - s * 0.36, x1 = L.cx - s * 0.3, y1 = L.eCY + s * 0.34;
    const p = Math.min(1, E.slash / 0.22), a = E.slash < 0.25 ? 1 : Math.max(0, 1 - (E.slash - 0.25) / 0.25);
    c.save();
    c.globalAlpha = a; c.strokeStyle = '#ff2020'; c.lineWidth = 7; c.lineCap = 'round';
    c.shadowColor = '#ff0000'; c.shadowBlur = 14 * K;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + (x1 - x0) * p, y0 + (y1 - y0) * p); c.stroke();
    c.restore();
}
function drawDmg() {
    const f = E.fx; if (!f) return;
    const up = Math.sin(Math.min(1, f.t / 0.5) * Math.PI) * 26, a = f.t < 0.8 ? 1 : Math.max(0, 1 - (f.t - 0.8) / 0.4);
    c.globalAlpha = a; c.font = '24px ' + FONT; c.textAlign = 'center';
    c.fillStyle = '#000'; c.fillText(f.text, L.cx + 2, L.eCY - L.eS * 0.36 - up + 2);
    c.fillStyle = f.col; c.fillText(f.text, L.cx, L.eCY - L.eS * 0.36 - up);
    c.textAlign = 'left'; c.globalAlpha = 1;
}
function rrect(x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function drawBubble() {
    const B = E.bubble; if (!B) return;
    const x = L.cx + L.eS * 0.36, y = Math.max(8, L.eCY - L.eS * 0.46), w = Math.min(210, VW - x - 10);
    if (!B.lay) B.lay = wrapText(B.text, 12, w - 24);
    const h = B.lay.length * 20 + 18;
    c.fillStyle = '#fff'; rrect(x, y, w, h, 7); c.fill();
    c.beginPath(); c.moveTo(x + 1, y + 14); c.lineTo(x - 14, y + 22); c.lineTo(x + 1, y + 28); c.closePath(); c.fill();
    c.fillStyle = '#000'; c.font = '12px ' + FONT;
    let left = B.n;
    B.lay.forEach((ln, i) => { if (left > 0) { c.fillText(ln.s.slice(0, left), x + 12, y + 11 + i * 20); left -= ln.s.length + 1; } });
}
function drawBox() {
    const r = boxRect();
    c.fillStyle = '#000'; c.fillRect(r.x, r.y, r.w, r.h);
    c.strokeStyle = '#fff'; c.lineWidth = 5; c.strokeRect(r.x + 2.5, r.y + 2.5, r.w - 5, r.h - 5);
    if (bt.box === 'text') { if (boxReady()) drawTx(r); }
    else if (bt.box === 'list') { if (boxReady()) drawList(); }
    else if (bt.box === 'fight') { if (bt.fight) drawFight(); }
    else if (bt.box === 'board') { drawBullets(); if (H.show) drawSoul(); }
}
function drawTx(r) {
    const T = TX.lay; if (!T) return;
    const x = r.x + 22, y = r.y + 18;
    c.font = T.px + 'px ' + FONT; c.fillStyle = '#fff';
    let left = TX.n;
    for (let i = 0; i < T.lines.length && left > 0; i++) {
        const ln = T.lines[i], yy = y + i * T.lh;
        if (ln.bullet) { c.fillText('*', x, yy); left -= 2; }
        if (left > 0) { c.fillText(ln.s.slice(0, left), x + ln.ind, yy); left -= ln.s.length; }
    }
    if (TX.mode === 'say' && TX.done && Math.floor(bt.t * 2.5) % 2 === 0) {   // ▼ — нажми, чтобы дальше
        const ax = r.x + r.w - 26, ay = r.y + r.h - 22;
        c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + 10, ay); c.lineTo(ax + 5, ay + 6); c.closePath(); c.fill();
    }
}
function optRect(i) {
    const r = boxRect(), colW = (r.w - 44) / 2;
    return { x: r.x + 22 + (i % 2) * colW, y: r.y + 20 + Math.floor(i / 2) * 36, w: colW, h: 30 };
}
function drawList() {
    const l = bt.list; if (!l) return;
    c.font = '16px ' + FONT;
    l.opts.forEach((o, i) => {
        const q = optRect(i);
        if (i === l.sel) drawHeartAt(q.x + 8, q.y + 8);
        else { c.fillStyle = '#fff'; c.fillText('*', q.x + 2, q.y); }
        c.fillStyle = o.color || '#fff'; c.fillText(o.label, q.x + 28, q.y);
    });
}
function drawFight() {
    const I = inner(), f = bt.fight, cx = I.cx, cy = I.cy, rx = I.w / 2 - 10, ry = I.h / 2 - 8;
    c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.clip();
    c.fillStyle = '#0c0c0c'; c.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
    for (let i = -10; i <= 10; i++) {
        const x = cx + i * rx / 10.5, mid = i === 0;
        c.fillStyle = mid ? '#2fdc2f' : (i % 2 ? '#262626' : '#454545');
        c.fillRect(x - (mid ? 3 : 2), cy - ry, mid ? 6 : 4, ry * 2);
    }
    c.restore();
    c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.stroke();
    const bx = cx - rx + 2 * rx * Math.min(1, f.t / f.dur);
    const vis = !f.stopped || Math.floor(f.blink * 14) % 2 === 0;
    c.fillStyle = vis ? '#fff' : '#000'; c.fillRect(bx - 6, cy - ry - 6, 12, ry * 2 + 12);
    c.strokeStyle = vis ? '#000' : '#fff'; c.lineWidth = 2; c.strokeRect(bx - 3, cy - ry - 3, 6, ry * 2 + 6);
}
function drawBullets() {
    const I = inner();
    c.save(); c.beginPath(); c.rect(I.x0, I.y0, I.w, I.h); c.clip();
    for (const u of BUL) {
        switch (u.kind) {
            case 'drop': {
                const tail = Math.min(14, 4 + u.vy * 0.03);
                c.beginPath(); c.moveTo(u.x, u.y - u.r - tail);
                c.quadraticCurveTo(u.x + u.r, u.y - u.r * 0.3, u.x + u.r, u.y); c.arc(u.x, u.y, u.r, 0, Math.PI);
                c.quadraticCurveTo(u.x - u.r, u.y - u.r * 0.3, u.x, u.y - u.r - tail);
                c.fillStyle = '#120818'; c.fill(); c.strokeStyle = '#b366ff'; c.lineWidth = 2; c.stroke();
                c.fillStyle = '#fff'; c.fillRect(u.x - 2, u.y - 2, 2, 2);
                break;
            }
            case 'tent': {
                if (u.len < 1) {   // предупреждение
                    c.globalAlpha = 0.35 + 0.45 * (Math.floor(u.t * 10) % 2);
                    c.strokeStyle = '#b366ff'; c.lineWidth = 2; c.setLineDash([6, 6]);
                    c.beginPath(); c.moveTo(I.x0, u.y); c.lineTo(I.x1, u.y); c.stroke();
                    c.setLineDash([]); c.globalAlpha = 1;
                    break;
                }
                const base = u.side < 0 ? I.x0 - 4 : I.x1 + 4, dir = -u.side, N = 14, top = [], bot = [];
                for (let j = 0; j <= N; j++) {
                    const p = j / N, x = base + dir * (u.len + 4) * p, th = 7 * (1 - p * 0.8), wob = Math.sin(j * 0.9 + u.t * 22) * 2 * p;
                    top.push([x, u.y - th + wob]); bot.push([x, u.y + th + wob]);
                }
                c.beginPath(); c.moveTo(top[0][0], top[0][1]);
                for (const q of top) c.lineTo(q[0], q[1]);
                for (let j = bot.length - 1; j >= 0; j--) c.lineTo(bot[j][0], bot[j][1]);
                c.closePath(); c.fillStyle = '#120818'; c.fill(); c.strokeStyle = '#b366ff'; c.lineWidth = 2; c.stroke();
                break;
            }
            case 'tooth': {
                const x0 = u.x - u.w / 2, gt = u.gap - u.g / 2, gb = u.gap + u.g / 2;
                c.fillStyle = '#f4f4f4';
                c.fillRect(x0, I.y0 - 4, u.w, gt - 8 - I.y0 + 4);
                c.beginPath(); c.moveTo(x0, gt - 8); c.lineTo(x0 + u.w, gt - 8); c.lineTo(u.x, gt); c.closePath(); c.fill();
                c.fillRect(x0, gb + 8, u.w, I.y1 + 4 - gb - 8);
                c.beginPath(); c.moveTo(x0, gb + 8); c.lineTo(x0 + u.w, gb + 8); c.lineTo(u.x, gb); c.closePath(); c.fill();
                c.fillStyle = '#a9a9bb'; c.fillRect(x0 + u.w - 4, I.y0 - 4, 4, gt - 8 - I.y0 + 4); c.fillRect(x0 + u.w - 4, gb + 8, 4, I.y1 + 4 - gb - 8);
                break;
            }
            case 'blob': {
                if (!u.go) { c.globalAlpha = 0.5 + 0.5 * Math.sin(u.t * 30); }
                c.beginPath(); c.arc(u.x, u.y, Math.max(1, u.r), 0, TAU);
                c.fillStyle = '#120818'; c.fill(); c.strokeStyle = '#b366ff'; c.lineWidth = 2; c.stroke();
                c.globalAlpha = 1;
                if (u.go) { c.fillStyle = '#fff'; c.fillRect(u.x - 2, u.y - 3, 2, 2); }
                break;
            }
            case 'pel':
                c.beginPath(); c.arc(u.x, u.y, u.r, 0, TAU);
                c.fillStyle = '#b366ff'; c.fill(); c.fillStyle = '#120818'; c.beginPath(); c.arc(u.x, u.y, u.r - 2, 0, TAU); c.fill();
                break;
            case 'fx':
                c.fillStyle = '#b366ff'; c.fillRect(u.x - 1, u.y - 1, 3, 3);
                break;
        }
    }
    c.restore();
}
function drawHeartAt(x, y) { c.imageSmoothingEnabled = false; c.drawImage(HEART, Math.round(x - 9), Math.round(y - 8), 18, 16); }
function drawSoul() { if (H.inv <= 0 || Math.floor(H.inv * 12) % 2 === 0) drawHeartAt(H.x, H.y); }
function drawDeathHeart() {
    if (H.show) {
        if (!H.broken) drawHeartAt(H.x, H.y);
        else {   // две половинки и трещина
            c.imageSmoothingEnabled = false;
            const x = Math.round(H.x - 9), y = Math.round(H.y - 8);
            c.drawImage(HEART, 0, 0, 4, 8, x - 2, y, 8, 16);
            c.drawImage(HEART, 5, 0, 4, 8, x + 12, y, 8, 16);
            c.fillStyle = '#ff0000'; c.fillRect(x + 7, y + 4, 2, 4); c.fillRect(x + 9, y + 8, 2, 4); c.fillRect(x + 7, y + 12, 2, 2);
        }
    }
    if (H.shards) { c.fillStyle = '#ff0000'; for (const q of H.shards) c.fillRect(Math.round(q.x), Math.round(q.y), 4, 4); }
}
function drawStats() {
    const y = L.statY, x = L.left;
    c.font = '15px ' + FONT; c.fillStyle = '#fff';
    const name = HERO.name + '   LV ' + HERO.lv;
    c.fillText(name, x, y + 3);
    let bx = x + c.measureText(name).width + 30;
    c.font = '11px ' + FONT; c.fillText('HP', bx, y + 6); bx += 32;
    const bw = HERO.maxHp * 2.6;
    c.fillStyle = '#c00000'; c.fillRect(bx, y, bw, 20);
    c.fillStyle = '#ffff00'; c.fillRect(bx, y, bw * HERO.hp / HERO.maxHp, 20);
    c.font = '15px ' + FONT; c.fillStyle = '#fff'; c.fillText(`${HERO.hp} / ${HERO.maxHp}`, bx + bw + 14, y + 3);
}
function btnRect(i) { return { x: L.bx + i * (L.bw + L.bgap), y: L.btnY, w: L.bw, h: L.btnH }; }
function drawButtons() {
    const active = bt.mode === 'menu' || bt.mode === 'list';
    for (let i = 0; i < 4; i++) {
        const r = btnRect(i), on = active && bt.sel === i, col = on ? '#ffff00' : '#ff7f27';
        c.strokeStyle = col; c.lineWidth = 3; c.strokeRect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3);
        c.font = L.bfont + 'px ' + FONT;
        const tw = c.measureText(BTN[i]).width, gw = 20 + 8 + tw, x0 = r.x + (r.w - gw) / 2, cy = r.y + r.h / 2;
        if (on) drawHeartAt(x0 + 10, cy);
        else { c.imageSmoothingEnabled = false; c.drawImage(ICON[col][i], Math.round(x0), Math.round(cy - 10), 20, 20); }
        c.fillStyle = col; c.textBaseline = 'middle'; c.fillText(BTN[i], x0 + 28, cy + 1); c.textBaseline = 'top';
    }
}
function drawHint() {
    const h = bt.hint; if (!h) return;
    const r = boxRect(), a = Math.min(1, h.t / 0.4);
    c.font = '11px ' + FONT; c.textAlign = 'center';
    const w = c.measureText(h.text).width + 16;
    c.globalAlpha = 0.75 * a; c.fillStyle = '#000'; c.fillRect(L.cx - w / 2, r.y - 26, w, 20);
    c.globalAlpha = a; c.fillStyle = '#d0d0d0'; c.fillText(h.text, L.cx, r.y - 21);
    c.globalAlpha = 1; c.textAlign = 'left';
}

// ---------- управление ----------
const keys = new Set();
const kd = (...k) => k.some(x => keys.has(x));
const drag = { id: null, x: 0, y: 0, dx: 0, dy: 0 };
let touchMode = window.matchMedia ? !window.matchMedia('(hover: hover) and (pointer: fine)').matches : true;
function confirmKey() {
    if (bt.mode === 'deathscreen') return deathContinue();
    if (E.bubble) return bubbleSkip();
    if (txConfirm()) return;
    if (bt.mode === 'menu') return pressButton(bt.sel);
    if (bt.mode === 'list') { const o = bt.list.opts[bt.list.sel]; if (o) choose(o); return; }
    if (bt.mode === 'fight') return fightStop(true);
}
function cancelKey() {
    if ((TX.mode === 'say' || TX.mode === 'line') && TX.lay && !TX.done) { TX.n = TX.lay.total; TX.done = true; return; }
    if (bt.mode === 'list') { closeList(); S.move(); }
}
function nav(dx, dy) {
    if (bt.mode === 'menu' && dx) { bt.sel = (bt.sel + dx + 4) % 4; S.move(); }
    else if (bt.mode === 'list') {
        const s = bt.list.sel + dx + dy * 2;
        if (s >= 0 && s < bt.list.opts.length && (dx === 0 || Math.floor(s / 2) === Math.floor(bt.list.sel / 2))) { bt.list.sel = s; S.move(); }
    }
}
document.addEventListener('keydown', e => {
    if (!bt.on) return;
    touchMode = false;
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    keys.add(e.code);
    if (e.repeat) return;
    if (['KeyZ', 'Enter', 'NumpadEnter', 'Space'].includes(e.code)) confirmKey();
    else if (['KeyX', 'ShiftLeft', 'ShiftRight', 'Escape', 'Backspace'].includes(e.code)) cancelKey();
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') nav(-1, 0);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') nav(1, 0);
    else if (e.code === 'ArrowUp' || e.code === 'KeyW') nav(0, -1);
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') nav(0, 1);
});
document.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => { keys.clear(); drag.id = null; drag.dx = drag.dy = 0; });

function toV(e) {
    const r = cv.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * (cv.width / r.width) - OX) / K, y: ((e.clientY - r.top) * (cv.height / r.height) - OY) / K };
}
const inRect = (p, r, m = 0) => p.x >= r.x - m && p.x <= r.x + r.w + m && p.y >= r.y - m && p.y <= r.y + r.h + m;
cv.addEventListener('pointerdown', e => {
    if (!bt.on) return;
    e.preventDefault();
    touchMode = e.pointerType !== 'mouse';
    if (typeof shipUnlockAudio === 'function') shipUnlockAudio();
    if (bt.mode === 'dodge') {   // сердце — только джойстиком, тап по экрану лишь пропускает реплику
        if (E.bubble) bubbleSkip();
        return;
    }
    const p = toV(e);
    if (bt.mode === 'menu' || bt.mode === 'list') {
        for (let i = 0; i < 4; i++) if (inRect(p, btnRect(i), 6)) return pressButton(i);
        if (bt.mode === 'list') for (let i = 0; i < bt.list.opts.length; i++) if (inRect(p, optRect(i), 6)) { bt.list.sel = i; return choose(bt.list.opts[i]); }
        if (TX.mode === 'show' && TX.lay && !TX.done) { TX.n = TX.lay.total; TX.done = true; }
        return;
    }
    if (bt.mode === 'fight') return fightStop(true);
    confirmKey();
});
cv.addEventListener('pointermove', e => {
    if (e.pointerId === drag.id) {
        const s = cv.width / cv.getBoundingClientRect().width / K;   // пиксели экрана → пиксели игры
        drag.dx = clamp(drag.dx + (e.clientX - drag.x) * s, -48, 48); drag.dy = clamp(drag.dy + (e.clientY - drag.y) * s, -48, 48);
        drag.x = e.clientX; drag.y = e.clientY;
        return;
    }
    if (e.pointerType === 'mouse' && bt.on) {   // мышкой: кнопка под курсором подсвечивается
        const p = toV(e);
        if (bt.mode === 'menu') for (let i = 0; i < 4; i++) if (inRect(p, btnRect(i)) && bt.sel !== i) { bt.sel = i; S.move(); }
        if (bt.mode === 'list') for (let i = 0; i < bt.list.opts.length; i++) if (inRect(p, optRect(i)) && bt.list.sel !== i) { bt.list.sel = i; S.move(); }
    }
});
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) cv.addEventListener(ev, e => { if (e.pointerId === drag.id) { drag.id = null; drag.dx = drag.dy = 0; } });
window.addEventListener('resize', () => { if (bt.on) resize(); });
if (window.ResizeObserver) new ResizeObserver(() => { if (bt.on) resize(); }).observe(scr);   // панель браузера на телефоне спряталась или вылезла
document.addEventListener('visibilitychange', () => {
    if (!bt.on) return;
    if (document.hidden) { bt.music = MUSIC.on; MUSIC.stop(0.05); keys.clear(); }
    else if (bt.music) MUSIC.start();
});

// джойстик в бою (как на карте): палец можно увести за круг, пока не отпустишь
const bj = { x: 0, y: 0, id: null };
const bjArea = document.getElementById('battle-joy'), bjBase = document.getElementById('bj-base'), bjStick = document.getElementById('bj-stick');
function bjMove(e) {
    const r = bjBase.getBoundingClientRect(), max = r.width * 0.3;
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > max) { dx *= max / d; dy *= max / d; }
    bj.x = dx / max; bj.y = dy / max;
    bjStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
function bjReset() { bj.x = bj.y = 0; bj.id = null; if (bjStick) bjStick.style.transform = 'translate(-50%, -50%)'; }
if (bjArea) {
    bjArea.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (!bt.on) return; touchMode = true; bj.id = e.pointerId; try { bjArea.setPointerCapture(e.pointerId); } catch (_) {} bjMove(e); });
    bjArea.addEventListener('pointermove', e => { if (e.pointerId === bj.id) { e.preventDefault(); bjMove(e); } });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) bjArea.addEventListener(ev, e => { if (e.pointerId === bj.id) bjReset(); });
}
window.addEventListener('blur', bjReset);

window.startRatEncounter = startRatEncounter;
// для проверки: открой игру с ?debug — в консоли появится window.battle
if (/[?&]debug/.test(location.search)) window.battle = { bt, E, H, TX, BUL, L, box, MUSIC, PATTERNS, get K() { return K; } };
})();