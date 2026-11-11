// ===================== КОРАБЛЬ =====================
// Карта корабля: ходьба, свет, двери, предметы, крыса, звуки и сохранение.
// Всё, что хочется поменять (карта, тексты, предметы, свет), лежит в начале файла.
(() => {
'use strict';

const T = 32;                  // размер клетки в пикселях игры
const VIEW = 10;               // столько клеток видно по короткой стороне экрана
const WALK = 110, RUN = 180;   // скорость героя, пикс/сек

// Легенда карты (одна буква = одна клетка):
//   #  стена            .  пол             ,  решётка в полу      ~  фиолетовая слизь
//   =  иллюминатор      D  дверь (открывается, когда подходишь)     d  боковая дверь
//   K  запертая дверь   L  шлюз            x  завал               пробел — снаружи корабля
//   s  тайный проход: выглядит как стена, но сквозь него можно пройти
// Стена над полом сама рисуется «фасадом» в 2 клетки, как в Undertale.
const MAP = [
    "                                           ",
    "              ##############################",
    "              ##===##======##===############",
    "              ##===##======##===############",
    "              #..................###.......#",
    "              #..................###.......#",
    "              #..................###..#....#",
    "              #..................###..#....#",
    " ###########  #..................###..#....#",
    " ######==###  #..................###..######",
    " ######==##############DD###########..#####",
    " #.........##=#########DD###########KK#==##",
    " #.........##=#########DD###########KK#==##",
    " #.........d.......,,........,,...,,......L",
    " #.........d.......,,........,,...,,......L",
    " #.........############DD############xx####",
    " #.........# ##########DD##########        ",
    " #.........# ##########DD##########        ",
    " #############..........~~~.......#        ",
    "        ######.............~~.....#        ",
    "        #....#..............~.....#        ",
    "        #....s............~~......#        ",
    "        #....#....................#        ",
    "        #....#....................#        ",
    "        ######....................#        ",
    "             #....................#        ",
    "             #....................#        ",
    "             ######################        ",
    "                                           ",
];

// Отсеки: название, темнота (0 — светло, 1 — кромешная тьма) и границы в клетках
const ROOMS = [
    { name: 'МЕДОТСЕК',       dark: 0.86, x: 2,  y: 9,  w: 9,  h: 9 },
    { name: 'КОРИДОР',        dark: 0.87, x: 11, y: 11, w: 32, h: 5 },
    { name: 'МОСТИК',         dark: 0.80, x: 15, y: 2,  w: 18, h: 9 },
    { name: 'ГРУЗОВОЙ ОТСЕК', dark: 0.93, x: 14, y: 16, w: 20, h: 11 },
    { name: 'ЖИЛОЙ ОТСЕК',    dark: 0.92, x: 36, y: 1,  w: 8,  h: 9 },   // за дверью K: погоня волны слизи
    { name: '???',            dark: 0.95, x: 9,  y: 18, w: 5,  h: 6 },   // тайник за стеной грузового отсека
];

const START = { x: 10.5, y: 12.9, dir: 'down' };   // где герой просыпается (клетки)
const RAT_START = { x: 25.5, y: 24 };

const CRATE = ['* Ящики с припасами. Почти все вскрыты.'];
const NAV = ['* Пульт навигации.', '* «КООРДИНАТЫ: НЕ ОПРЕДЕЛЕНЫ».'];
const COM = ['* Пульт связи.', '* «СИГНАЛ: НЕТ». Кнопка вызова не нажимается.'];

// Предметы: t — тип, x/y — левая верхняя клетка, say — текст при осмотре (Z).
// item — вещь, которую тут можно взять (список вещей — ITEMS в battle.js), take — текст, когда берёшь
const PROPS = [
    // медотсек
    { t: 'cabinet', x: 2, y: 11, say: ['* Аптечка. Пусто.', '* Кто-то выгреб всё до последнего бинта.'] },
    { t: 'pod', v: 'broken', x: 3, y: 11, say: ['* Криокапсула №1. Стекло разбито...', '* ...изнутри.'] },
    { t: 'pod', v: 'frost', x: 5, y: 11, say: ['* Криокапсула №2. Стекло покрыто инеем.', '* Вы протираете его рукавом. Внутри пусто.'],
      item: 'cryo', take: ['* Криокапсула №2. Стекло покрыто инеем.', '* Внутри пусто. Только баллон с хладагентом в держателе.', '* Вы взяли КРИОБАЛЛОН.'] },
    { t: 'pod', v: 'open', x: 10, y: 11, say: ['* Ваша криокапсула. Внутри ещё держится холод.', '* На панели мигает: «АВАРИЙНОЕ ПРОБУЖДЕНИЕ».'] },
    { t: 'table', x: 3, y: 15, say: ['* Операционный стол.', '* Ремни разорваны.'] },
    { t: 'pad', x: 8, y: 16, say: ['* Планшет медика. Последняя запись:', '* «Крыса из грузового отсека укусила механика. Рана светится. Это ненормально.»'] },
    // коридор
    { t: 'save', x: 15, y: 13 },
    { t: 'helmet', x: 33, y: 14, say: ['* Чей-то шлем. Стекло треснуло.', '* На затылке маркером: «МЕХАНИК».'],
      item: 'borsch', take: ['* Чей-то шлем. На затылке маркером: «МЕХАНИК».', '* Внутри спрятан тюбик. Механик знал толк в заначках.', '* Вы взяли ТЮБИК БОРЩА.'] },
    // мостик
    { t: 'console', v: 'nav', x: 16, y: 4, say: NAV }, { t: 'console', v: 'nav', x: 17, y: 4, say: NAV },
    { t: 'console', v: 'nav', x: 18, y: 4, say: NAV },
    { t: 'console', v: 'com', x: 29, y: 4, say: COM }, { t: 'console', v: 'com', x: 30, y: 4, say: COM },
    { t: 'console', v: 'com', x: 31, y: 4, say: COM },
    { t: 'chair', x: 23.5, y: 5, say: ['* Кресло капитана. Пустое.', '* Ремни безопасности расстёгнуты.'],
      item: 'bar', take: ['* Кресло капитана. Пустое.', '* В подлокотнике — чья-то заначка.', '* Вы взяли КОСМО-БАТОНЧИК.'] },
    { t: 'holo', x: 23, y: 7, say: ['* Голографическая карта.', '* Мигает точка «ВЫ ЗДЕСЬ». Вокруг — ни одной знакомой звезды.'] },
    { t: 'terminal', x: 32, y: 6, say: ['* Терминал искрит.', '* На экране мигает надпись: «ОШИБКА КУРСА. МЫ НЕ ДОЛЖНЫ БЫЛИ ЛЕТЕТЬ СЮДА...»'] },
    { t: 'log', x: 15, y: 7, say: ['* Бортжурнал. Последняя запись капитана:', '* «Нас затягивает в аномалию. Двигатели не справляются.»', '* «Если кто-то это читает — не открывайте груз №7».'] },
    // грузовой отсек
    { t: 'container', x: 15, y: 18, say: ['* Грузовой контейнер. Заперт.'] },
    { t: 'container', x: 15, y: 22, say: ['* Грузовой контейнер. Заперт.'] },
    { t: 'container', v: 'broken', x: 29, y: 18, say: ['* Контейнер для биообразцов.', '* Его вскрыли изнутри. Края металла вывернуты наружу.'] },
    { t: 'crate', v: 'bio', x: 18, y: 18, say: ['* На ящике надпись: «ОСТОРОЖНО: БИООБРАЗЦЫ».', '* Пломба сорвана.'] },
    { t: 'crate', x: 19, y: 18, say: CRATE,
      item: 'card', take: ['* Под пустыми коробками что-то блестит.', '* Ключ-карта. На ней выцарапано: «КАЮТЫ».', '* Вы взяли КЛЮЧ-КАРТУ.'] }, { t: 'crate', x: 18, y: 19, say: CRATE },
    { t: 'crate', x: 20, y: 23, say: CRATE }, { t: 'crate', v: 'open', x: 21, y: 23, say: ['* Ящик с камбуза. Пусто, только крошки.'],
      item: 'fork', take: ['* Ящик с камбуза. Посуда, салфетки...', '* Среди всего — железная тарелка и вилка. Звенят на весь отсек.', '* Вы взяли ВИЛКУ И ТАРЕЛКУ.'] },
    { t: 'crate', x: 20, y: 24, say: CRATE },
    { t: 'crate', x: 32, y: 18, say: CRATE }, { t: 'crate', x: 33, y: 18, say: CRATE }, { t: 'crate', x: 33, y: 19, say: CRATE },
    { t: 'crate', x: 31, y: 25, say: CRATE }, { t: 'crate', x: 32, y: 25, say: CRATE }, { t: 'crate', x: 32, y: 24, say: ['* Аварийный ящик. Пустой.'],
      item: 'flare', take: ['* Аварийный ящик с красной полосой.', '* Внутри — сигнальный факел. Горит даже в вакууме.', '* Вы взяли СИГНАЛЬНЫЙ ФАКЕЛ.'] },
    { t: 'save', x: 41, y: 7 },
    // тайник: проход в левой стене грузового отсека (клетка 13,21)
    { t: 'crate', v: 'open', x: 9, y: 20, say: ['* Пустой ящик. Кто-то здесь уже был.'],
      item: 'claws', take: ['* Старый ящик, задвинутый в самый угол.', '* Внутри, в промасленной тряпке, — железные когти.', '* Вы взяли ЖЕЛЕЗНЫЕ КОГТИ.'] },
    { t: 'pad', x: 31, y: 20.4, say: ['* Накладная: «Образец №7. Хранить при −200°. НЕ ВСКРЫВАТЬ».', '* Датчик температуры показывает +12°.'] },
];

// Тексты для клеток карты: по букве и по точным координатам "x,y"
const TILE_SAY = {
    K: ['* Дверь в каюты экипажа. Заблокирована.', '* Изнутри что-то скребётся.'],
    L: ['* Шлюз заблокирован.', '* На табло: «ДАВЛЕНИЕ СНАРУЖИ: НОРМА. АТМОСФЕРА: НЕИЗВЕСТНА».'],
    x: ['* Проход в двигательный отсек завален обломками.', '* Из-под них тянет холодом.'],
    '=': ['* За стеклом — чужая планета.', '* Корабль рухнул прямо в фиолетовый песок. Вокруг дымятся обломки обшивки.'],
};
const PUDDLE = ['* Лужа фиолетовой слизи растеклась по всему коридору.', '* Пути назад нет.'];
const SPOT_SAY = { '31,12': ['* Из разбитого щитка сыплются искры.', '* Лучше не трогать.'] };
SPOT_SAY['7,10'] = SPOT_SAY['8,10'] = ['* По стеклу ползёт трещина. На полу — осколки.', '* Снаружи фиолетовый песок. Из него торчат куски нашей обшивки.'];
for (let y = 4; y <= 10; y++) SPOT_SAY['38,' + y] = SPOT_SAY['37,' + y] = SPOT_SAY['36,' + y] = PUDDLE;
const CRACKED = [8, 22, 39];   // в этих клетках (по x) стекло иллюминатора треснуло при падении
for (let x = 21; x <= 26; x++) for (const y of [2, 3]) SPOT_SAY[x + ',' + y] = ['* Над горизонтом висит чёрная дыра.', '* Та самая.'];
const SAVE_SAY = ['* (Звезда мерцает в темноте.)', '* Вы чувствуете, как ваша решимость крепнет.', '* (HP восстановлено. Игра сохранена.)'];

// Свет: x/y — центр пятна (клетки), r — радиус (пикс), c — цвет, g — сила цветного свечения,
// fx — поведение: alarm (мигалка), flicker (барахлит), dying (почти умерла), spark (искры), breath, holo
// lamp — где нарисовать сам светильник на стене
const LIGHTS = [
    { x: 7.9, y: 11.4, r: 120, c: '#9b4dff', g: 0.22 },
    { x: 6.5, y: 13.6, r: 135, c: '#cfe8ff', g: 0.07, fx: 'flicker', lamp: { x: 6.5, y: 9.45, k: 'cold' } },
    { x: 10.5, y: 11.9, r: 60, c: '#4fc3ff', g: 0.25 },
    { x: 17.5, y: 13.1, r: 105, c: '#ff2a2a', g: 0.2, fx: 'alarm', lamp: { x: 17.5, y: 11.35, k: 'alarm' } },
    { x: 27.5, y: 13.1, r: 105, c: '#ff2a2a', g: 0.2, fx: 'alarm', ph: 1.7, lamp: { x: 27.5, y: 11.35, k: 'alarm' } },
    { x: 34.5, y: 13.1, r: 105, c: '#ff2a2a', g: 0.2, fx: 'alarm', ph: 3.1, lamp: { x: 34.5, y: 11.35, k: 'alarm' } },
    { x: 13.5, y: 13.3, r: 70, c: '#9b4dff', g: 0.18 },
    { x: 40, y: 13.3, r: 85, c: '#9b4dff', g: 0.18 },
    { x: 41.5, y: 13.9, r: 60, c: '#ff3030', g: 0.25, fx: 'blink' },
    { x: 31.5, y: 13.1, r: 85, c: '#ffcc66', g: 0.32, fx: 'spark', id: 'panel' },
    { x: 17.5, y: 4.7, r: 130, c: '#9b4dff', g: 0.2 },
    { x: 24, y: 4.7, r: 190, c: '#a65cff', g: 0.24 },
    { x: 30, y: 4.7, r: 130, c: '#9b4dff', g: 0.2 },
    { x: 17.5, y: 5.2, r: 70, c: '#3de0ff', g: 0.16 },
    { x: 30, y: 5.2, r: 70, c: '#4dff9a', g: 0.14 },
    { x: 24, y: 7.5, r: 95, c: '#3de0ff', g: 0.2, fx: 'holo' },
    { x: 32.4, y: 7, r: 75, c: '#ff5533', g: 0.26, fx: 'spark', id: 'term' },
    { x: 15.6, y: 7.7, r: 50, c: '#4dff9a', g: 0.16 },
    { x: 19.5, y: 18.8, r: 150, c: '#ffcf7a', g: 0.12, fx: 'dying', lamp: { x: 19.5, y: 16.4, k: 'warm' } },
    { x: 26.5, y: 24.8, r: 130, c: '#ff2a2a', g: 0.14, fx: 'alarm', ph: 0.6 },
    { x: 29.9, y: 19.7, r: 75, c: '#b366ff', g: 0.3, fx: 'breath' },
    { x: 37, y: 6.5, r: 110, c: '#ff2a2a', g: 0.2, fx: 'alarm', ph: 2.2, lamp: { x: 37, y: 2.35, k: 'alarm' } },
    { x: 40.9, y: 6, r: 120, c: '#cfe8ff', g: 0.07, fx: 'flicker', lamp: { x: 40.9, y: 2.45, k: 'cold' } },
];

// ---------- служебное ----------
const MH = MAP.length, MW = Math.max(...MAP.map(r => r.length));
const tileAt = (x, y) => (y < 0 || y >= MH || x < 0 || x >= MW) ? ' ' : (MAP[y][x] || ' ');
const isFloor = ch => ch === '.' || ch === ',' || ch === '~';
const isOpenCh = ch => isFloor(ch) || ch === 'D' || ch === 'd';
const isWallCh = ch => ch === '#' || ch === '=' || ch === 'K' || ch === 's';
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
function hash(x, y, s = 0) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}
function mk(w, h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return x;
}
function R(c, col, x, y, w, h) { c.fillStyle = col; c.fillRect(x, y, w, h); }
// Эллипс и скруглённый прямоугольник «по пикселям», чтобы не было размытых краёв
function pxEll(c, cx, cy, rx, ry, col) {
    c.fillStyle = col;
    for (let dy = -Math.floor(ry); dy <= Math.floor(ry); dy++) {
        const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
        if (hw > 0) c.fillRect(Math.round(cx - hw), Math.round(cy + dy), hw * 2, 1);
    }
}
function pxRRect(c, x, y, w, h, r, col) {
    c.fillStyle = col;
    for (let i = 0; i < h; i++) {
        const k = i < r ? r - i - 0.5 : (i >= h - r ? i - (h - r) + 0.5 : -1);
        const inset = k < 0 ? 0 : r - Math.round(Math.sqrt(Math.max(0, r * r - k * k)));
        c.fillRect(x + inset, y + i, w - inset * 2, 1);
    }
}
function hazard(c, x, y, w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++)
        R(c, ((i + j) >> 2) & 1 ? '#c9a227' : '#17171a', x + i, y + j, 1, 1);
}
function sprite(rows, pal) {
    const c = mk(rows[0].length, rows.length);
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) R(c, pal[ch], x, y, 1, 1); }));
    return c.canvas;
}
function flipped(cv) {
    const c = mk(cv.width, cv.height); c.translate(cv.width, 0); c.scale(-1, 1); c.drawImage(cv, 0, 0); return c.canvas;
}

// ---------- разбор карты: двери и окна ----------
function groups(chars) {
    const seen = new Set(), out = [];
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        if (!chars.includes(tileAt(x, y)) || seen.has(x + ',' + y)) continue;
        const ch = tileAt(x, y), q = [[x, y]], g = { ch, x0: x, y0: y, x1: x, y1: y };
        seen.add(x + ',' + y);
        while (q.length) {
            const [cx, cy] = q.pop();
            g.x0 = Math.min(g.x0, cx); g.x1 = Math.max(g.x1, cx); g.y0 = Math.min(g.y0, cy); g.y1 = Math.max(g.y1, cy);
            for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]])
                if (tileAt(nx, ny) === ch && !seen.has(nx + ',' + ny)) { seen.add(nx + ',' + ny); q.push([nx, ny]); }
        }
        out.push(g);
    }
    return out;
}
const DOORS = groups('DdKL').map(g => ({ ...g, open: 0, want: 0, locked: g.ch === 'K' || g.ch === 'L' }));
const doorAt = {};
DOORS.forEach(d => { for (let y = d.y0; y <= d.y1; y++) for (let x = d.x0; x <= d.x1; x++) doorAt[x + ',' + y] = d; });
const WINDOWS = groups('=');

// Стена над полом — фасад (нижний/верхний ряд), остальное — «крыша» стены
function faceKind(x, y) {
    if (!isWallCh(tileAt(x, y))) return null;
    if (isOpenCh(tileAt(x, y + 1))) return 'lower';
    if (isWallCh(tileAt(x, y + 1)) && isOpenCh(tileAt(x, y + 2))) return 'upper';
    return null;
}

// ---------- рисуем клетки ----------
const PAL = {
    roof: '#0d0e13', roofIn: '#101117', lip: '#3a404c', lipLo: '#22262e', hull: '#1b1e26',
    floor: '#252932', plate: '#2b3039', plateHi: '#343a45', plateLo: '#1d2027', seam: '#15171c', rivet: '#3f4552',
    wallTop: '#14161c', wall1: '#363c49', wall2: '#3b4150', wallSeam: '#272b35', wallHi: '#48505f', wallLo: '#2c313b',
    pipe: '#4b5363', pipeHi: '#6b7487', pipeLo: '#262a33', base: '#1a1c22', baseHi: '#4a5060', strip: '#1b4f5c',
    frame: '#59627a', frameHi: '#7c869f', frameLo: '#2c313c', glass: '#05030a',
};

function drawFloor(c, ox, oy, x, y, ch) {
    if (ch === ',') {
        R(c, '#121419', ox, oy, T, T); R(c, PAL.seam, ox, oy, T, 1); R(c, PAL.seam, ox, oy, 1, T);
        R(c, '#30353f', ox + 2, oy + 2, T - 4, 1); R(c, '#30353f', ox + 2, oy + 2, 1, T - 4);
        for (let i = 5; i < T - 3; i += 4) { R(c, '#2a2e37', ox + 3, oy + i, T - 6, 2); R(c, '#0a0b0e', ox + 3, oy + i + 2, T - 6, 1); }
        return;
    }
    R(c, PAL.floor, ox, oy, T, T);
    R(c, PAL.plate, ox + 1, oy + 1, T - 2, T - 2);
    R(c, PAL.plateHi, ox + 1, oy + 1, T - 2, 1); R(c, PAL.plateHi, ox + 1, oy + 1, 1, T - 2);
    R(c, PAL.plateLo, ox + 1, oy + T - 2, T - 2, 1); R(c, PAL.plateLo, ox + T - 2, oy + 1, 1, T - 2);
    R(c, PAL.seam, ox, oy, T, 1); R(c, PAL.seam, ox, oy, 1, T);
    for (const [rx, ry] of [[3, 3], [T - 5, 3], [3, T - 5], [T - 5, T - 5]]) { R(c, PAL.rivet, ox + rx, oy + ry, 2, 2); R(c, PAL.plateLo, ox + rx, oy + ry + 2, 2, 1); }
    const h = hash(x, y);
    if (h < 0.2) {
        for (let i = 0; i < 5; i++) R(c, 'rgba(0,0,0,0.28)', ox + 4 + (hash(x, y, i) * 22 | 0), oy + 4 + (hash(x, y, i + 9) * 22 | 0), 2 + (hash(x, y, i + 3) * 6 | 0), 1);
    } else if (h > 0.88) {
        for (let yy = 7; yy < T - 6; yy += 5) for (let xx = 7 + ((yy / 5) & 1) * 2; xx < T - 6; xx += 5) R(c, PAL.plateHi, ox + xx, oy + yy, 2, 1);
    }
    if (ch === '~') {
        const n = 3 + (hash(x, y, 5) * 3 | 0);
        for (let i = 0; i < n; i++) {
            const bx = ox + 5 + hash(x, y, i * 3) * 22, by = oy + 6 + hash(x, y, i * 3 + 1) * 20, r = 3 + hash(x, y, i * 3 + 2) * 5;
            pxEll(c, bx, by + 1, r * 1.35, r * 0.75, '#22093a');
            pxEll(c, bx, by, r * 1.2, r * 0.6, '#4d1577');
            R(c, '#b366ff', Math.round(bx - r * 0.5), Math.round(by - 1), 2, 1);
        }
    }
}

function vent(c, x, y, w, h) {
    R(c, '#1a1d23', x, y, w, h); R(c, PAL.wallHi, x, y + h, w, 1);
    for (let i = 2; i < h - 1; i += 2) R(c, '#2e333d', x + 1, y + i, w - 2, 1);
}

function drawFace(c, ox, oy, x, y, kind) {
    const h = hash(x, y, 7);
    if (kind === 'upper') {
        R(c, PAL.wall1, ox, oy, T, T);
        R(c, PAL.wallTop, ox, oy, T, 4); R(c, PAL.wallHi, ox, oy + 4, T, 1);
        R(c, PAL.pipeLo, ox, oy + 9, T, 7); R(c, PAL.pipe, ox, oy + 10, T, 4); R(c, PAL.pipeHi, ox, oy + 10, T, 1);
        if ((x & 1) === 0) R(c, PAL.pipeLo, ox + 13, oy + 8, 4, 9);
        R(c, PAL.wallSeam, ox + T - 1, oy + 17, 1, T - 17); R(c, PAL.wallHi, ox, oy + 17, 1, T - 17);
        if (h < 0.18) vent(c, ox + 8, oy + 20, 16, 8);
        else if (h < 0.26) { R(c, '#c9a227', ox + 10, oy + 21, 12, 6); R(c, '#17171a', ox + 12, oy + 23, 8, 2); }
        else if (h > 0.9) { R(c, '#22262e', ox + 6, oy + 19, 2, T - 19); R(c, '#2f3440', ox + 9, oy + 19, 2, T - 19); }
    } else {
        R(c, PAL.wall2, ox, oy, T, T);
        R(c, '#14161b', ox, oy + 4, T, 4); R(c, PAL.strip, ox, oy + 5, T, 2);
        R(c, PAL.wallLo, ox, oy + 12, T, 15); R(c, PAL.wallHi, ox, oy + 12, T, 1);
        R(c, PAL.wallSeam, ox + T - 1, oy, 1, T - 5);
        R(c, PAL.base, ox, oy + T - 5, T, 5); R(c, PAL.baseHi, ox, oy + T - 5, T, 1);
        if (h > 0.8) vent(c, ox + 6, oy + 15, 20, 8);
        else if (h > 0.72) { R(c, '#59627a', ox + 12, oy + 15, 8, 8); R(c, '#2d6f88', ox + 13, oy + 16, 6, 3); }
    }
}

function drawRoof(c, ox, oy, x, y) {
    R(c, PAL.roof, ox, oy, T, T);
    if ((x + y) & 1) R(c, PAL.roofIn, ox + 3, oy + 3, T - 6, T - 6);
    const n = tileAt(x, y - 1), s = tileAt(x, y + 1), w = tileAt(x - 1, y), e = tileAt(x + 1, y);
    if (n === ' ') R(c, PAL.hull, ox, oy, T, 2);
    if (s === ' ') R(c, PAL.hull, ox, oy + T - 2, T, 2);
    if (w === ' ') R(c, PAL.hull, ox, oy, 2, T);
    if (e === ' ') R(c, PAL.hull, ox + T - 2, oy, 2, T);
    if (isOpenCh(n)) { R(c, PAL.lip, ox, oy, T, 3); R(c, PAL.lipLo, ox, oy + 3, T, 2); }   // верх стены за полом
    if (faceKind(x, y + 1)) R(c, '#2b2f39', ox, oy + T - 2, T, 2);                       // край над фасадом
    if (isOpenCh(w) || faceKind(x - 1, y)) R(c, '#2a2e38', ox, oy, 2, T);
    if (isOpenCh(e) || faceKind(x + 1, y)) R(c, '#2a2e38', ox + T - 2, oy, 2, T);
}

// Стёкла окон: сюда каждый кадр рисуется вид на планету
const PANES = [];
function drawWindows(c) {
    for (const g of WINDOWS) {
        const top = faceKind(g.x0, g.y0) === 'upper' ? 5 : 2;
        const X = g.x0 * T + 2, Y = g.y0 * T + top, W = (g.x1 - g.x0 + 1) * T - 4, H = (g.y1 + 1) * T - 6 - Y;
        R(c, PAL.frameLo, X - 1, Y - 1, W + 2, H + 2); R(c, PAL.frame, X, Y, W, H);
        R(c, PAL.frameHi, X, Y, W, 1); R(c, PAL.frameHi, X, Y, 1, H);
        const n = g.x1 - g.x0 + 1;
        for (let k = 0; k < n; k++) {
            const px0 = k === 0 ? X + 3 : (g.x0 + k) * T + 2, px1 = k === n - 1 ? X + W - 3 : (g.x0 + k + 1) * T - 2;
            const pane = { x: px0, y: Y + 3, w: px1 - px0, h: H - 6, g };
            R(c, PAL.frameLo, pane.x - 1, pane.y - 1, pane.w + 2, pane.h + 2); R(c, PAL.glass, pane.x, pane.y, pane.w, pane.h);
            PANES.push(pane);
        }
    }
}

function drawDoorsStatic(c) {
    for (const d of DOORS) {
        if (d.ch === 'D' || d.ch === 'K') {
            // проём с рамой занимает два нижних ряда, выше — порог
            for (let y = d.y0; y <= d.y1 - 2; y++) for (let x = d.x0; x <= d.x1; x++) {
                R(c, '#1b1e25', x * T, y * T, T, T); R(c, '#262a33', x * T + 3, y * T, T - 6, T);
                for (let i = 4; i < T; i += 6) R(c, '#1b1e25', x * T + 3, y * T + i, T - 6, 1);
            }
            const X = d.x0 * T, Y = (d.y1 - 1) * T, W = (d.x1 - d.x0 + 1) * T, H = 2 * T;
            R(c, PAL.frameLo, X, Y, W, H); R(c, '#4d5567', X + 1, Y, W - 2, 6); R(c, '#4d5567', X + 1, Y, 3, H); R(c, '#4d5567', X + W - 4, Y, 3, H);
            R(c, PAL.frameHi, X + 1, Y, W - 2, 1);
            R(c, '#07080b', X + 4, Y + 6, W - 8, H - 6); R(c, '#111318', X + 4, Y + H - 9, W - 8, 9);
            d.rect = { x: X + 4, y: Y + 6, w: W - 8, h: H - 6 }; d.light = { x: X + W / 2 - 3, y: Y + 1 };
            if (d.ch === 'K') { d.open = 0; }
        } else if (d.ch === 'd') {
            for (let y = d.y0; y <= d.y1; y++) drawFloor(c, d.x0 * T, y * T, d.x0, y, '.');
            const X = d.x0 * T, Y = d.y0 * T, H = (d.y1 - d.y0 + 1) * T;
            R(c, '#1b1e25', X + 9, Y, 14, H); R(c, '#2a2e38', X + 9, Y, 1, H); R(c, '#2a2e38', X + 22, Y, 1, H);
            d.rect = { x: X + 10, y: Y, w: 12, h: H }; d.light = { x: X + 13, y: Y - 7 };
        } else if (d.ch === 'L') {
            const X = d.x0 * T, Y = d.y0 * T, H = (d.y1 - d.y0 + 1) * T;
            R(c, '#24272f', X, Y, T, H); R(c, '#3a3f4a', X + 2, Y + 2, T - 4, H - 4); hazard(c, X + 2, Y + 2, T - 4, 5); hazard(c, X + 2, Y + H - 7, T - 4, 5);
            pxEll(c, X + 16, Y + H / 2, 11, 11, '#1c1f26'); pxEll(c, X + 16, Y + H / 2, 9, 9, '#4a5160'); pxEll(c, X + 16, Y + H / 2, 4, 4, '#2c3039');
            R(c, '#6b7487', X + 15, Y + H / 2 - 8, 2, 16); R(c, '#6b7487', X + 8, Y + H / 2 - 1, 16, 2);
            d.light = { x: X + 13, y: Y + 9 };
        }
    }
}

function drawRubble(c, x, y) {
    const ox = x * T, oy = y * T;
    R(c, '#08090c', ox, oy, T, T);
    for (let i = 0; i < 9; i++) {
        const w = 5 + hash(x, y, i) * 12 | 0, h = 3 + hash(x, y, i + 20) * 8 | 0;
        const px = ox + (hash(x, y, i + 40) * (T - w)) | 0, py = oy + 6 + (hash(x, y, i + 60) * (T - h - 6)) | 0;
        const col = ['#2b2f38', '#3a3f4a', '#4f5665', '#22252c'][i & 3];
        R(c, col, px, py, w, h); R(c, '#5d6677', px, py, w, 1);
    }
    for (let i = 0; i < T; i++) R(c, '#4f5665', ox + i, oy + 24 - (i * 0.6 | 0), 3, 3);
}

function buildLayer() {
    const c = mk(MW * T, MH * T);
    R(c, '#000', 0, 0, MW * T, MH * T);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        const ch = tileAt(x, y), ox = x * T, oy = y * T;
        if (ch === ' ' || ch === 'D' || ch === 'd' || ch === 'L') continue;
        if (isFloor(ch)) drawFloor(c, ox, oy, x, y, ch);
        else if (ch === 'x') drawRubble(c, x, y);
        else { const k = faceKind(x, y); if (k) drawFace(c, ox, oy, x, y, k); else drawRoof(c, ox, oy, x, y); }
    }
    drawWindows(c);
    drawDoorsStatic(c);
    // мягкая тень у стен и полосы у дверей — без них пол выглядит плоским
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        if (!isFloor(tileAt(x, y))) continue;
        const ox = x * T, oy = y * T, up = tileAt(x, y - 1), dn = tileAt(x, y + 1);
        if (!isFloor(up)) for (let i = 0; i < 7; i++) R(c, `rgba(0,0,0,${0.34 - i * 0.045})`, ox, oy + i, T, 1);
        if (!isOpenCh(tileAt(x - 1, y))) for (let i = 0; i < 4; i++) R(c, `rgba(0,0,0,${0.26 - i * 0.06})`, ox + i, oy, 1, T);
        if (!isOpenCh(tileAt(x + 1, y))) for (let i = 0; i < 4; i++) R(c, `rgba(0,0,0,${0.26 - i * 0.06})`, ox + T - 1 - i, oy, 1, T);
        if (up === 'D') hazard(c, ox, oy + 1, T, 4);
        if (dn === 'D') hazard(c, ox, oy + T - 4, T, 4);
        if (tileAt(x - 1, y) === 'd') hazard(c, ox + 1, oy, 4, T);
        if (tileAt(x + 1, y) === 'd') hazard(c, ox + T - 4, oy, 4, T);
    }
    return c.canvas;
}

// ---------- предметы: рисуем один раз в маленькие картинки ----------
const ART = {};
function artPod(v) {
    const c = mk(32, 64);
    pxRRect(c, 3, 1, 26, 59, 11, '#2a2f39'); pxRRect(c, 4, 2, 24, 57, 10, '#5c6575');
    R(c, '#7c8698', 5, 12, 1, 40); R(c, '#454c5a', 26, 12, 1, 40);
    pxRRect(c, 7, 8, 18, 42, 8, '#1b2029');
    if (v === 'frost') {
        pxRRect(c, 8, 9, 16, 40, 7, '#8fb8cc');
        for (let i = 0; i < 70; i++) R(c, hash(i, 1) > 0.5 ? '#d9eef7' : '#b4d4e3', 9 + (hash(i, 2) * 14 | 0), 10 + (hash(i, 3) * 37 | 0), 1, 1);
        R(c, '#eaf7fc', 10, 12, 2, 10);
    } else if (v === 'broken') {
        pxRRect(c, 8, 9, 16, 40, 7, '#0b0f15');
        for (const [x, y, w, h] of [[8, 14, 3, 5], [21, 11, 3, 7], [9, 34, 2, 8], [20, 30, 4, 4], [14, 9, 4, 2]]) R(c, '#9fc3d6', x, y, w, h);
        R(c, '#cfe7f2', 21, 11, 1, 3); R(c, '#cfe7f2', 8, 14, 1, 2);
    } else {
        pxRRect(c, 8, 9, 16, 40, 7, '#0f1a26'); pxRRect(c, 10, 12, 12, 34, 5, '#16283a');
        R(c, '#a8cfe0', 26, 10, 2, 36); R(c, '#d6eef8', 26, 12, 1, 8);
    }
    R(c, '#2d323c', 2, 56, 28, 8); R(c, '#454c5a', 2, 56, 28, 1); R(c, '#15171c', 2, 63, 28, 1);
    return c.canvas;
}
function artConsole(v) {
    const c = mk(32, 42);
    R(c, '#20242c', 1, 14, 30, 28); R(c, '#3c4352', 2, 15, 28, 26); R(c, '#4a5263', 2, 15, 28, 1);
    for (let i = 0; i < 6; i++) R(c, '#2a2f3a', 4 + i * 4, 30, 2, 2);
    R(c, '#2a2f3a', 3, 2, 26, 13); R(c, '#4a5263', 3, 2, 26, 1);
    R(c, '#081218', 5, 4, 22, 9);
    R(c, '#15171c', 2, 40, 28, 2);
    return c.canvas;
}
function artChair() {
    const c = mk(32, 46);
    R(c, '#2b2f38', 14, 36, 4, 8); pxEll(c, 16, 43, 9, 2, '#1d2027');
    R(c, '#2a1414', 5, 24, 22, 12); R(c, '#4a2222', 6, 25, 20, 10);
    pxRRect(c, 8, 4, 16, 26, 4, '#3a1a1a'); pxRRect(c, 9, 5, 14, 24, 3, '#6b2b2b');
    R(c, '#8c3a3a', 10, 6, 2, 20); R(c, '#4f1f1f', 15, 8, 2, 18);
    pxRRect(c, 11, 0, 10, 6, 2, '#5b2626'); R(c, '#3a4050', 3, 22, 4, 9); R(c, '#3a4050', 25, 22, 4, 9);
    return c.canvas;
}
function artHolo() {
    const c = mk(64, 40);
    pxEll(c, 32, 33, 28, 6, '#15171c'); R(c, '#2a2f3a', 6, 22, 52, 12);
    pxEll(c, 32, 22, 26, 8, '#3b4252'); pxEll(c, 32, 21, 24, 7, '#495163'); pxEll(c, 32, 21, 8, 3, '#1d5664');
    return c.canvas;
}
function artTerminal() {
    const c = mk(32, 52);
    R(c, '#1c1f26', 3, 8, 26, 44); R(c, '#3a404d', 4, 9, 24, 42); R(c, '#4a5160', 4, 9, 24, 1);
    R(c, '#120606', 7, 12, 18, 16);
    for (const [x, y] of [[9, 14], [10, 15], [11, 17], [12, 18], [12, 19], [13, 21]]) R(c, '#5a5f6b', x, y, 1, 1);
    vent(c, 8, 34, 16, 8); R(c, '#2a2f3a', 4, 46, 24, 5);
    return c.canvas;
}
function artCabinet() {
    const c = mk(32, 52);
    R(c, '#5b616c', 3, 4, 26, 48); R(c, '#b9bec7', 4, 5, 24, 46); R(c, '#d8dce2', 4, 5, 24, 1);
    R(c, '#7b818c', 15, 6, 2, 44); R(c, '#1b1d22', 27, 8, 1, 40);
    R(c, '#c0392b', 13, 12, 6, 2); R(c, '#c0392b', 15, 10, 2, 6);
    R(c, '#7b818c', 4, 30, 24, 1); R(c, '#2a2d33', 3, 50, 26, 2);
    return c.canvas;
}
function artTable() {
    const c = mk(64, 40);
    R(c, '#2a2f3a', 8, 22, 4, 16); R(c, '#2a2f3a', 52, 22, 4, 16);
    R(c, '#5d6573', 2, 16, 60, 10); R(c, '#8d95a4', 2, 8, 60, 10); R(c, '#aab1bd', 2, 8, 60, 1);
    for (const x of [16, 40]) { R(c, '#4a2f22', x, 7, 4, 12); R(c, '#4a2f22', x - 2, 18, 2, 3); R(c, '#4a2f22', x + 4, 4, 2, 3); }
    return c.canvas;
}
function artCrate(v) {
    const c = mk(32, 42);
    R(c, '#1d2027', 1, 6, 30, 36);
    R(c, v === 'open' ? '#111318' : '#5a6272', 2, 6, 28, 12); R(c, '#717a8c', 2, 6, 28, 1);
    R(c, '#454c5a', 2, 18, 28, 22); for (let y = 22; y < 38; y += 5) R(c, '#3a404c', 3, y, 26, 1);
    R(c, '#2a2f39', 2, 18, 28, 1); R(c, '#2a2f39', 2, 18, 2, 22); R(c, '#2a2f39', 28, 18, 2, 22);
    if (v === 'bio') { R(c, '#c9a227', 9, 23, 14, 10); pxEll(c, 16, 28, 3, 3, '#17171a'); R(c, '#c9a227', 15, 27, 2, 2); }
    if (v === 'open') { R(c, '#5a6272', 6, 0, 24, 5); R(c, '#2a2f39', 6, 5, 24, 1); }
    return c.canvas;
}
function artContainer(v) {
    const c = mk(64, 72);
    R(c, '#1a1e19', 0, 6, 64, 66);
    R(c, '#56664f', 1, 6, 62, 14); R(c, '#6c7d64', 1, 6, 62, 1);
    R(c, '#3c4739', 1, 20, 62, 50);
    for (let x = 4; x < 62; x += 4) R(c, '#2f382d', x, 22, 1, 46);
    R(c, '#25301f', 31, 20, 2, 50); R(c, '#8a8f7a', 26, 40, 2, 8); R(c, '#8a8f7a', 36, 40, 2, 8);
    if (v === 'broken') {
        pxEll(c, 30, 44, 14, 16, '#14051f'); pxEll(c, 30, 44, 11, 13, '#2d0b47');
        for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; R(c, '#7d8a72', 30 + Math.cos(a) * 15 | 0, 44 + Math.sin(a) * 17 | 0, 3, 3); }
        R(c, '#4d1577', 18, 58, 6, 12); R(c, '#4d1577', 34, 60, 4, 10);
    }
    R(c, '#121410', 0, 70, 64, 2);
    return c.canvas;
}
function artPad() {
    const c = mk(14, 9); R(c, '#111318', 0, 1, 14, 8); R(c, '#2a2f3a', 0, 0, 14, 8); R(c, '#0b1a22', 2, 2, 10, 4); return c.canvas;
}
function artHelmet() {
    const c = mk(18, 15);
    pxEll(c, 9, 13, 8, 2, 'rgba(0,0,0,0.35)'); pxEll(c, 9, 7, 8, 7, '#2a2d33'); pxEll(c, 9, 7, 7, 6, '#d6d3cc');
    pxEll(c, 10, 7, 5, 4, '#1b2130'); R(c, '#6a7a99', 8, 5, 2, 1); R(c, '#9aa7bf', 11, 6, 1, 3); R(c, '#9aa7bf', 12, 8, 1, 2);
    return c.canvas;
}

// Крыса (смотрит вправо). Буквы — цвета из палитры ниже, точка — пусто
const RAT_ROWS = [[
    "..............aa......",
    "..........bbbbaPb.....",
    ".......bbbBBBBbbbb....",
    "....bbbBBBvBBBBbbebb..",
    "tt.bbBBBvvvBBBBbbbbbn.",
    ".ttbbbbbvBbbbbbbbbbb..",
    "..ttbbbwwwwwwwwbbbb...",
    "....l..l......l..l....",
], [
    "..............aa......",
    "..........bbbbaPb.....",
    ".......bbbBBBBbbbb....",
    "....bbbBBBvBBBBbbebb..",
    "...bbBBBvvvBBBBbbbbbn.",
    "tttbbbbbvBbbbbbbbbbb..",
    "...bbbbwwwwwwwwbbbb...",
    ".....l..l....l..l.....",
]];
const RAT_PAL = { a: '#9a6b6b', P: '#d49a9a', b: '#3e3431', B: '#5d5048', v: '#8a2be2', e: '#ff2020', n: '#d49a9a', t: '#b8817a', w: '#7a6a5f', l: '#2a2220' };

const STAR_ROWS = [
    ".....#.....", ".....#.....", "....###....", "....#o#....", "###########", ".####o####.",
    "..#######..", "...#####...", "...##.##...", "..##...##..", "..#.....#..",
];
const HEART_ROWS = [".##...##.", "####.####", "#########", "#########", ".#######.", "..#####..", "...###...", "....#...."];
const BANG_ROWS = [
    ".#######.", "#WWWWWWW#", "#WWWrWWW#", "#WWWrWWW#", "#WWWrWWW#", "#WWWrWWW#", "#WWWWWWW#", "#WWWrWWW#", "#WWWWWWW#", ".###.###.", "....#....",
];

function buildArt() {
    ART.pod = { open: artPod('open'), frost: artPod('frost'), broken: artPod('broken') };
    ART.console = artConsole(); ART.chair = artChair(); ART.holo = artHolo(); ART.terminal = artTerminal();
    ART.cabinet = artCabinet(); ART.table = artTable(); ART.pad = artPad(); ART.helmet = artHelmet();
    ART.crate = { '': artCrate(''), bio: artCrate('bio'), open: artCrate('open') };
    ART.container = { '': artContainer(''), broken: artContainer('broken') };
    ART.rat = RAT_ROWS.map(r => sprite(r, RAT_PAL)); ART.ratL = ART.rat.map(flipped);
    ART.star = [sprite(STAR_ROWS, { '#': '#ffd84a', o: '#fff6c2' }), sprite(STAR_ROWS, { '#': '#fff0a0', o: '#ffffff' })];
    ART.heart = sprite(HEART_ROWS, { '#': '#ff0000' });
    ART.bang = sprite(BANG_ROWS, { '#': '#000000', W: '#ffffff', r: '#ff2020' });
    ART.panel = [-1, 1].map(side => {
        const w = 28, h = 58, c = mk(w, h);
        R(c, '#59617a', 0, 0, w, h); R(c, '#6d7690', 0, 0, w, 1); R(c, '#3a4050', 0, h - 1, w, 1);
        for (let y = 8; y < h - 4; y += 10) R(c, '#4a5166', 2, y, w - 4, 1);
        hazard(c, side < 0 ? w - 4 : 0, 0, 4, h);
        R(c, '#14161c', side < 0 ? 6 : w - 14, 12, 8, 14); R(c, '#2d6f88', side < 0 ? 7 : w - 13, 13, 6, 3);
        return c.canvas;
    });
    ART.pano = makePano();
}

// Вид из иллюминаторов: корабль упал на чужую планету. Фиолетовое небо, чёрная дыра из меню,
// горы, кристаллы и дымящиеся обломки нашей обшивки в песке
const PW = 960, PH = 64;
function makePano() {
    const c = mk(PW, PH);
    const g = c.createLinearGradient(0, 0, 0, PH);
    g.addColorStop(0, '#04020a'); g.addColorStop(0.3, '#12062a'); g.addColorStop(0.5, '#3b1269');
    g.addColorStop(0.6, '#9440d8'); g.addColorStop(0.65, '#2c0d47'); g.addColorStop(1, '#0b0413');
    c.fillStyle = g; c.fillRect(0, 0, PW, PH);
    for (let i = 0; i < 300; i++) R(c, `rgba(255,${200 + hash(i, 7) * 55 | 0},255,${0.25 + hash(i, 8) * 0.75})`, hash(i, 5) * PW | 0, hash(i, 6) * 34 | 0, 1, 1);
    // чёрная дыра
    const bx = 470, by = 22;
    const glow = c.createRadialGradient(bx, by, 5, bx, by, 34);
    glow.addColorStop(0, 'rgba(255,140,40,0.6)'); glow.addColorStop(1, 'rgba(255,60,0,0)');
    c.fillStyle = glow; c.fillRect(bx - 34, by - 34, 68, 68);
    pxEll(c, bx, by, 21, 5, '#ff9a3c'); pxEll(c, bx, by, 16, 3, '#ffd27a');
    pxEll(c, bx, by, 8, 8, '#000000'); R(c, '#fff1c9', bx - 7, by - 9, 14, 1);
    pxEll(c, bx, by + 2, 18, 2, '#ff8a2a'); pxEll(c, bx, by + 2, 8, 1, '#000');
    // луна
    pxEll(c, 760, 17, 6, 6, '#c9a6ff'); pxEll(c, 763, 16, 6, 6, '#14082c');
    // горы: шум из целых гармоник, чтобы панорама бесшовно повторялась по кругу
    const ridge = (base, amp, col, s) => {
        c.fillStyle = col;
        for (let x = 0; x < PW; x++) {
            const t = x / PW * Math.PI * 2;
            const h = Math.sin(t * 3 + s) * 0.5 + Math.sin(t * 8 + s * 2) * 0.3 + Math.sin(t * 21 + s * 3) * 0.2;
            const y = Math.round(base - amp * (0.5 + 0.5 * h));
            c.fillRect(x, y, 1, PH - y);
        }
    };
    ridge(41, 9, '#2a0f47', 1); ridge(45, 5, '#170828', 2);
    // фиолетовый песок с барханами
    R(c, '#0d0517', 0, 46, PW, PH - 46);
    for (let x = 0; x < PW; x++) { const t = x / PW * Math.PI * 2; R(c, '#1c0c30', x, Math.round(48 + Math.sin(t * 13) * 1.5 + Math.sin(t * 31) * 0.8), 1, 2); }
    for (let i = 0; i < 60; i++) {   // кристаллы
        const x = hash(i, 11) * PW | 0, y = 47 + (hash(i, 12) * 10 | 0), h = 2 + (hash(i, 13) * 5 | 0);
        R(c, 'rgba(179,102,255,0.25)', x - 1, y - h, 3, h + 1); R(c, '#7b3fd1', x, y - h, 1, h); R(c, '#e6c6ff', x, y - h, 1, 1);
    }
    // обломки корабля: наклонные куски обшивки, края ещё тлеют, над ними дым
    for (const [x, w, h, y, sl] of [[60, 14, 4, 52, 1], [190, 22, 5, 54, -1], [300, 12, 3, 51, 1], [535, 30, 7, 55, 1], [650, 16, 4, 52, -1], [830, 20, 5, 54, 1], [905, 10, 3, 51, -1]]) {
        for (let k = 0; k < 24; k++) {
            const sw = 2 + (k / 5 | 0), sx = x + w / 2 + Math.round(k * 0.45 * sl + Math.sin(k * 0.5 + x) * 1.5);
            R(c, `rgba(115,95,135,${(0.3 - k * 0.011).toFixed(3)})`, sx - (sw >> 1), y - h - k, sw, 1);
        }
        for (let r = 0; r < h; r++) R(c, r === h - 1 ? '#4a5160' : '#2b2f38', x + r * sl, y - r, w, 1);
        R(c, '#ff8a2a', sl > 0 ? x + w + h - 2 : x - h + 1, y - h + 1, 1, 1); R(c, '#ffcf7a', x + 2, y, 2, 1);
    }
    return c.canvas;
}

// ---------- мир: предметы, свет, герой, крыса ----------
const PT = {   // размер в клетках и твёрдая часть (пикс от левого верхнего угла)
    pod: { w: 1, h: 1, box: [2, 0, 28, 30] }, cabinet: { w: 1, h: 1, box: [2, 0, 28, 30] },
    console: { w: 1, h: 1, box: [1, 0, 30, 30] }, log: { w: 1, h: 1, box: [1, 0, 30, 30] },
    chair: { w: 1, h: 1, box: [6, 8, 20, 20] }, holo: { w: 2, h: 1, box: [6, 6, 52, 22] },
    terminal: { w: 1, h: 1, box: [3, 0, 26, 30] }, table: { w: 2, h: 1, box: [2, 6, 60, 22] },
    crate: { w: 1, h: 1, box: [1, 4, 30, 28] }, container: { w: 2, h: 2, box: [0, 6, 64, 58] },
    save: { w: 1, h: 1, box: [8, 12, 16, 14] }, pad: { w: 1, h: 1, box: null }, helmet: { w: 1, h: 1, box: null },
};
const DIRV = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const ROOMS_PX = ROOMS.map(r => ({ ...r, px: r.x * T, py: r.y * T, pw: r.w * T, ph: r.h * T }));
const roomAt = (x, y) => ROOMS_PX.find(r => x >= r.px && x < r.px + r.pw && y >= r.py && y < r.py + r.ph) || null;
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

let props = [], flats = [], LIGHTS_ALL = [], STRIPS = [], layer = null;
function buildWorld() {
    props = PROPS.map((p, i) => {
        const d = PT[p.t], X = p.x * T, Y = p.y * T, W = d.w * T, H = d.h * T;
        const o = { ...p, i, X, Y, W, H, box: d.box && { x: X + d.box[0], y: Y + d.box[1], w: d.box[2], h: d.box[3] } };
        o.ibox = o.box ? { x: o.box.x - 6, y: o.box.y - 6, w: o.box.w + 12, h: o.box.h + 12 } : { x: X - 4, y: Y - 4, w: W + 8, h: H + 8 };
        const art = ART[p.t === 'log' ? 'console' : p.t];
        o.img = p.t === 'save' ? null : (art instanceof HTMLCanvasElement ? art : art[p.v || ''] || art.open);
        if (o.img) { o.dx = Math.round(X + (W - o.img.width) / 2); o.dy = p.t === 'pad' || p.t === 'helmet' ? Math.round(Y + (H - o.img.height) / 2) : Y + H - o.img.height; }
        o.sy = Y + H;
        return o;
    });
    flats = props.filter(p => !p.box);
    LIGHTS_ALL = LIGHTS.map((L, i) => ({ ...L, i, px: L.x * T, py: L.y * T, a: L.a || 0.85, rgb: hex(L.c), room: roomAt(L.x * T, L.y * T) }));
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        if (tileAt(x, y) === '~') LIGHTS_ALL.push({ px: x * T + 16, py: y * T + 16, r: 34, a: 0.38, c: '#b366ff', rgb: hex('#b366ff'), g: 0.1, fx: 'breath', i: x * 7 + y, room: roomAt(x * T + 16, y * T + 16) });
        if (faceKind(x, y) === 'lower' && (tileAt(x, y) === '#' || tileAt(x, y) === 's')) {
            const r = roomAt(x * T + 16, y * T + 16), h = hash(x, y, 3);
            if (r && r.name !== 'ГРУЗОВОЙ ОТСЕК' && h > 0.22) STRIPS.push({ x, y, fl: h < 0.32 });
        }
    }
    layer = buildLayer();
    drawBrokenPanel(layer.getContext('2d'), 31, 12);
    makeCracks(layer.getContext('2d'));
}
// Трещины на стёклах (рисуются поверх вида из окна) и осколки на полу под ними
function makeCracks(c) {
    for (const p of PANES) {
        const tx = Math.floor((p.x + p.w / 2) / T);
        if (!CRACKED.includes(tx)) continue;
        const px = [], x0 = p.x + 6 + (hash(tx, 1) * (p.w - 12) | 0), y0 = p.y + 8 + (hash(tx, 2) * (p.h - 16) | 0), n = 6 + (hash(tx, 3) * 3 | 0);
        for (let k = 0; k < n; k++) {
            let a = k / n * Math.PI * 2 + hash(tx, k + 10) * 0.6, x = x0, y = y0;
            const len = 8 + hash(tx, k + 20) * 22;
            for (let i = 0; i < len; i++) {
                a += (hash(tx, k * 50 + i) - 0.5) * 0.35; x += Math.cos(a); y += Math.sin(a);
                const ix = Math.round(x), iy = Math.round(y);
                if (ix < p.x || ix >= p.x + p.w || iy < p.y || iy >= p.y + p.h) break;
                px.push([ix, iy]);
            }
        }
        p.crack = { px, x: x0, y: y0 };
        const fy = (p.g.y1 + 1) * T;   // первая клетка пола под окном
        for (let i = 0; i < 14; i++) R(c, i % 3 ? '#9fc3d6' : '#d6eef8', p.x - 4 + (hash(tx, i + 70) * (p.w + 8) | 0), fy + 3 + (hash(tx, i + 90) * 18 | 0), 1 + (i & 1), 1);
    }
}
function drawBrokenPanel(c, x, y) {
    const ox = x * T, oy = y * T;
    R(c, '#0b0c10', ox + 7, oy + 12, 18, 12); R(c, '#59627a', ox + 5, oy + 10, 22, 2); R(c, '#2a2f3a', ox + 18, oy + 22, 9, 6);
    for (const [cx, col] of [[10, '#c0392b'], [14, '#c9a227'], [19, '#2d6f88']]) R(c, col, ox + cx, oy + 14, 1, 7 + (cx % 3));
}

const P = { x: 0, y: 0, dir: 'down', frame: 0, animT: 0, stepT: 0, moving: false, face: Math.PI / 2 };
const rat = { x: 0, y: 0, alive: true, chase: false, tx: 0, ty: 0, wait: 0, stuck: 0, frame: 0, animT: 0, right: false, calm: 0 };
const EMIT = { panel: { x: 31.5 * T, y: 12 * T + 14, next: 1, flash: 0 }, term: { x: 32 * T + 24, y: 6 * T - 12, next: 2, flash: 0 } };
const parts = [];
let state = 'off', amb = 0.86, curRoom = null, enc = null, fadeA = 1, clock = 0, events = [];

// ---------- столкновения ----------
function solidTile(tx, ty) {
    const ch = tileAt(tx, ty);
    if (HERO.flags.chaseDone && tx >= 36 && tx <= 37 && ty >= 4 && ty <= 10) return true;   // лужа слизи — назад не пройти
    if (isFloor(ch) || ch === 's') return false;   // тайный проход
    if (ch === 'D' || ch === 'd' || ch === 'K') { const d = doorAt[tx + ',' + ty]; return !d || d.open < 0.75; }
    return true;
}
function blocked(x0, y0, x1, y1, skipProps) {
    for (let ty = Math.floor(y0 / T); ty <= Math.floor((y1 - 0.01) / T); ty++)
        for (let tx = Math.floor(x0 / T); tx <= Math.floor((x1 - 0.01) / T); tx++)
            if (solidTile(tx, ty)) return true;
    if (!skipProps) for (const p of props) { const b = p.box; if (b && x1 > b.x && x0 < b.x + b.w && y1 > b.y && y0 < b.y + b.h) return true; }
    return false;
}
const heroHit = (x, y) => blocked(x - 9, y - 8, x + 9, y);
const ratHit = (x, y) => blocked(x - 6, y - 5, x + 6, y);
function tryMove(dx, dy) {
    if (!dx && !dy) return;
    if (!heroHit(P.x + dx, P.y + dy)) { P.x += dx; P.y += dy; return; }
    // упёрся в угол — чуть подталкиваем вбок, чтобы не застревать в дверях
    const step = Math.abs(dx || dy);
    for (let o = 1; o <= 10; o++) for (const s of [-1, 1]) {
        const ox = dy ? o * s : 0, oy = dx ? o * s : 0;
        if (!heroHit(P.x + ox, P.y + oy) && !heroHit(P.x + ox + dx, P.y + oy + dy)) {
            const k = Math.min(step, o) / o;
            if (!heroHit(P.x + ox * k, P.y + oy * k)) { P.x += ox * k; P.y += oy * k; }
            return;
        }
    }
}

// ---------- обновление кадра ----------
function update(dt) {
    clock += dt;
    fadeA = Math.max(0, fadeA - dt * 1.4);
    for (let i = events.length - 1; i >= 0; i--) if (clock >= events[i].at) { const e = events.splice(i, 1)[0]; e.fn(); }
    if (state === 'enc') return updateEncounter(dt);
    let ix = 0, iy = 0;
    if (state === 'play') {
        if (keyDown('ArrowLeft', 'KeyA')) ix -= 1; if (keyDown('ArrowRight', 'KeyD')) ix += 1;
        if (keyDown('ArrowUp', 'KeyW')) iy -= 1; if (keyDown('ArrowDown', 'KeyS')) iy += 1;
        if (!ix && !iy && joy.on) { ix = joy.x; iy = joy.y; }
    }
    const len = Math.hypot(ix, iy);
    P.moving = len > 0.2;
    if (P.moving) {
        const sp = (running() ? RUN : WALK) * Math.min(1, len * 1.6);   // джойстик не обязательно жать до упора
        ix /= len; iy /= len;
        tryMove(ix * sp * dt, 0); tryMove(0, iy * sp * dt);
        P.dir = Math.abs(ix) > Math.abs(iy) ? (ix > 0 ? 'right' : 'left') : (iy > 0 ? 'down' : 'up');
        let da = Math.atan2(iy, ix) - P.face; da = Math.atan2(Math.sin(da), Math.cos(da)); P.face += da * Math.min(1, dt * 12);
        P.animT += dt * (running() ? 1.5 : 1);
        const f = [1, 0, 2, 0][Math.floor(P.animT / 0.14) % 4];
        if (f !== P.frame && f) SFX.step(f === 2);
        P.frame = f;
    } else { P.frame = 0; P.animT = 0; }

    const room = roomAt(P.x, P.y - 4);
    if (room && room !== curRoom) { curRoom = room; showRoom(room.name); }
    if (curRoom) amb += (curRoom.dark - amb) * Math.min(1, dt * 3);

    for (const d of DOORS) {
        if (d.locked) continue;
        const want = nearDoor(d) ? 1 : 0;
        if (want !== d.want) { d.want = want; SFX.door(); }
        d.open = clamp(d.open + (want ? 1 : -1) * dt * 3.5, 0, 1);
    }
    updateChase(dt);
    updateRat(dt);
    updateFx(dt);
    updateCam(dt);
}
function nearDoor(d) {
    return P.x > d.x0 * T - 40 && P.x < (d.x1 + 1) * T + 40 && P.y > d.y0 * T - 40 && P.y < (d.y1 + 1) * T + 44;
}

function updateRat(dt) {
    if (!rat.alive) return;
    if (rat.calm > 0) rat.calm -= dt;   // сбежал из боя — крыса даёт пару секунд уйти
    const dx = P.x - rat.x, dy = P.y - 2 - rat.y, dist = Math.hypot(dx, dy);
    const hunt = rat.calm <= 0 && state === 'play' && curRoom && curRoom.name === 'ГРУЗОВОЙ ОТСЕК' && dist < 170;
    let tx, ty, sp;
    if (hunt) {
        if (!rat.chase) { rat.chase = true; SFX.squeak(); }
        tx = P.x; ty = P.y - 2; sp = 74;
    } else {
        if (rat.chase) { rat.chase = false; rat.wait = 1; }
        rat.wait -= dt;
        if (rat.wait <= 0 && (Math.hypot(rat.tx - rat.x, rat.ty - rat.y) < 4 || rat.stuck > 0.4)) {
            rat.tx = (14.6 + Math.random() * 18.8) * T; rat.ty = (18.7 + Math.random() * 7.9) * T;
            rat.wait = 0.4 + Math.random() * 1.8; rat.stuck = 0;
        }
        tx = rat.tx; ty = rat.ty; sp = rat.wait > 0 ? 0 : 40;
    }
    const l = Math.hypot(tx - rat.x, ty - rat.y);
    if (l > 1 && sp > 0) {
        const vx = (tx - rat.x) / l * sp * dt, vy = (ty - rat.y) / l * sp * dt, ox = rat.x, oy = rat.y;
        if (!ratHit(rat.x + vx, rat.y)) rat.x += vx;
        if (!ratHit(rat.x, rat.y + vy)) rat.y += vy;
        if (Math.abs(rat.x - ox) + Math.abs(rat.y - oy) < 0.05) rat.stuck += dt;
        if (Math.abs(vx) > 0.02) rat.right = vx > 0;
        rat.animT += dt; rat.frame = Math.floor(rat.animT / (rat.chase ? 0.08 : 0.14)) % 2;
    }
    if (hunt && dist < 18) startEncounter();
}
// Куда отбегает крыса, когда ты сбежал из боя: точка в грузовом отсеке подальше от героя
function ratAway() {
    let best = null, bd = -1;
    for (let i = 0; i < 40; i++) {
        const x = (14.6 + Math.random() * 18.8) * T, y = (18.7 + Math.random() * 7.9) * T;
        if (ratHit(x, y)) continue;
        const d = Math.hypot(x - P.x, y - P.y);
        if (d > bd) { bd = d; best = { x, y }; }
    }
    return best || { x: RAT_START.x * T, y: RAT_START.y * T };
}

function updateFx(dt) {
    for (const k in EMIT) {
        const e = EMIT[k]; e.flash -= dt; e.next -= dt;
        if (e.next <= 0) {
            e.next = 1.2 + Math.random() * 2.8; e.flash = 0.12;
            for (let i = 0; i < 7 + Math.random() * 8; i++) parts.push({ k: 'spark', x: e.x, y: e.y, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 90, life: 0.3 + Math.random() * 0.6, g: 320 });
            const d = Math.hypot(e.x - P.x, e.y - P.y);
            if (d < 320) SFX.spark(1 - d / 320);
        }
    }
    if (Math.random() < dt * 9) parts.push({ k: 'mist', x: 10 * T + 8 + Math.random() * 16, y: 12 * T - 2 + Math.random() * 6, vx: -(3 + Math.random() * 12), vy: 2 + Math.random() * 7, life: 2.6, max: 2.6, g: 0 });   // холодный пар стекает из капсулы на пол
    if (parts.filter(p => p.k === 'dust').length < 26) { const l = 6 + Math.random() * 6; parts.push({ k: 'dust', x: (15 + Math.random() * 18) * T, y: (4 + Math.random() * 6) * T, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 4, life: l, max: l, g: 0 }); }
    for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.life <= 0) parts.splice(i, 1);
    }
}

// ---------- встреча с крысой: «!», мигание сердца — и в бой ----------
function startEncounter() {
    if (state !== 'play') return;
    state = 'enc'; enc = { t: 0, beeps: 0 }; joyReset(); SFX.alert();
    roomLabel.classList.remove('show'); hint.classList.remove('show');
}
function updateEncounter(dt) {
    enc.t += dt;
    const beepAt = [0.62, 0.84, 1.06];
    if (enc.beeps < 3 && enc.t >= beepAt[enc.beeps]) { enc.beeps++; SFX.heart(); }
    if (enc.t >= 1.3) {
        state = 'off'; enc = null; pauseShip();
        if (typeof startRatEncounter === 'function') startRatEncounter();
    }
}

// ---------- осмотр (Z) ----------
function interact() {
    const v = DIRV[P.dir];
    const qx = P.dir === 'up' || P.dir === 'down' ? P.x : P.x + v[0] * 17;
    const qy = P.dir === 'up' ? P.y - 20 : P.dir === 'down' ? P.y + 12 : P.y - 4;
    const inBox = (b, x, y) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
    const hitProp = props.find(p => (p.say || p.t === 'save') && (inBox(p.ibox, qx, qy) || (!p.box && inBox(p.ibox, P.x, P.y - 4))));
    if (hitProp) {
        if (hitProp.t === 'save') { SFX.save(); HERO.hp = HERO.maxHp; saveGame(); return say(SAVE_SAY); }
        if (hitProp.item && !HERO.found[hitProp.item]) {   // нашёл вещь: кладём в карманы, на последней фразе — «дзынь»
            HERO.found[hitProp.item] = true; HERO.items.push(hitProp.item);
            const t = hitProp.take;
            return say(t.slice(0, -1), () => { SFX.item(); say(t[t.length - 1]); });
        }
        return say(hitProp.say);
    }
    const tx = Math.floor(qx / T), ty = Math.floor(qy / T), ch = tileAt(tx, ty);
    if (SPOT_SAY[tx + ',' + ty]) return say(SPOT_SAY[tx + ',' + ty]);
    if (ch === 'K' && !HERO.flags.cardUsed && HERO.items.includes('card')) return openCabins(doorAt[tx + ',' + ty]);
    if (ch === 'K' && HERO.flags.cardUsed) return say(['* Дверь заклинило.', '* Из-под неё сочится слизь.']);
    if (TILE_SAY[ch]) { if (ch === 'K' || ch === 'L') SFX.locked(); return say(TILE_SAY[ch]); }
}

// ---------- погоня: волна слизи за дверью кают ----------
// Ключ-карта открывает дверь, сзади из вентиляции хлещет волна. Беги вверх (держи X) и резко сверни направо —
// волна врежется в стену и растечётся. Догнала — начинаешь забег заново от двери.
let chase = null;
function openCabins(d) {
    HERO.flags.cardUsed = true; SFX.item();
    say(['* Вы прикладываете ключ-карту. Замок пищит.', '* Дверь медленно разъезжается...'], () => {
        d.locked = false;
        say(['* За спиной что-то хлюпает.', '* Из вентиляции хлещет волна слизи!', '* БЕГИТЕ! (держи X)'], startChase);
    });
}
function startChase() {
    chase = { y: P.y + 110, v: 70, done: false };
    events.push({ at: clock + 0.2, fn: () => SFX.door() });
}
function updateChase(dt) {
    if (!chase || chase.done) return;
    if (state !== 'play') return;
    chase.v = Math.min(168, chase.v + dt * 140);   // разгоняется — пешком не уйти, только бегом
    chase.y -= chase.v * dt;
    if (Math.random() < dt * 8) noise(0.12, 0.03, 'lowpass', 300, 0, 1.2);
    const inLane = P.x < 38.1 * T;
    if (inLane && chase.y - P.y < 4) {   // догнала
        chase.y = 12.6 * T; chase.v = 60; P.x = 37 * T; P.y = 10.4 * T; P.dir = 'up';
        return say(['* Слизь накрывает вас с головой!', '* ...Вы вырываетесь и откатываетесь к двери.', '* Бегите, не оглядываясь! (держи X)']);
    }
    if (chase.y <= 4 * T + 4) {          // врезалась в стену
        chase.y = 4 * T; chase.done = true; HERO.flags.chaseDone = true;
        const d = doorAt['36,11']; if (d) { d.locked = true; d.open = 0; d.want = 0; }
        if (inLane) { P.x = 39.6 * T; P.y = 5.6 * T; }   // свернул в последний миг
        SFX.locked(); noise(0.5, 0.09, 'lowpass', 220, 0, 0.8);
        chase = null;
        say(['* ШЛЁП!', '* Волна врезается в стену и растекается по полу.', '* Коридор позади залит слизью. Пути назад нет.']);
    }
}
function drawSlime(c, t) {
    const done = HERO.flags.chaseDone, top = chase ? chase.y : done ? 4 * T : null;
    if (top === null) return;
    const x0 = 36 * T - 2, x1 = 38 * T + 2, bot = done ? 11 * T : 14 * T;
    c.save();
    c.beginPath(); c.moveTo(x0, bot);
    for (let x = x0; x <= x1; x += 4) c.lineTo(x, top - 6 * Math.abs(Math.sin(x * 0.09 + t * (done ? 1.5 : 7))) - (done ? 0 : 10 * Math.sin((x - x0) / (x1 - x0) * Math.PI)));
    c.lineTo(x1, bot); c.closePath();
    c.fillStyle = 'rgba(92, 20, 150, 0.92)'; c.fill();
    c.globalAlpha = 0.55; c.fillStyle = '#c27bff'; c.fillRect(x0 + 6, top + 4, x1 - x0 - 12, 3);
    for (let i = 0; i < 6; i++) { const bx = x0 + 8 + ((i * 37 + t * 20) % (x1 - x0 - 16)), by = top + 14 + ((i * 53 + t * 30) % Math.max(10, bot - top - 20)); c.fillRect(bx, by, 3, 3); }
    if (done) { c.globalAlpha = 0.85; c.fillStyle = 'rgba(92, 20, 150, 0.9)'; c.beginPath(); c.ellipse(37 * T, 4 * T + 4, 46, 12, 0, 0, Math.PI * 2); c.fill(); }
    c.restore();
    halos.push([37 * T, top + 16, 70, '#b366ff', done ? 0.25 : 0.55]);
}

// ---------- экран и камера ----------
let cv = null, cx = null, lc = null, sc = null, ec = null, VW = 320, VH = 320;
const cam = { x: 0, y: 0 };
const heroImg = new Image();   // картинка героя — в самом конце файла
const HERO_ROW = { down: 0, up: 1, left: 2, right: 3 };
const halos = [];

// cx — экран, lc — темнота со светом, sc — предметы и герой, ec — всё, что светится само
function setupCanvas() {
    cv = document.getElementById('ship-canvas');
    cx = cv.getContext('2d');
    lc = mk(1, 1); sc = mk(1, 1); ec = mk(1, 1);
    window.addEventListener('resize', resize);
}
// Один пиксель игры — целое число пикселей экрана, иначе пиксель-арт «плывёт»
function resize() {
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1, w = window.innerWidth, h = window.innerHeight;
    const s = Math.max(1, Math.round(Math.min(w, h) * dpr / (VIEW * T)));
    VW = Math.ceil(w * dpr / s); VH = Math.ceil(h * dpr / s);
    for (const c of [cx, lc, sc, ec]) { c.canvas.width = VW; c.canvas.height = VH; c.imageSmoothingEnabled = false; }
    cv.style.width = (VW * s / dpr) + 'px'; cv.style.height = (VH * s / dpr) + 'px';
    updateCam();
}
// Камера держит героя в центре, но не уезжает за край карты
function updateCam() {
    const mw = MW * T, mh = MH * T;
    cam.x = mw <= VW ? (mw - VW) / 2 : clamp(P.x - VW / 2, 0, mw - VW);
    cam.y = mh <= VH ? (mh - VH) / 2 : clamp(P.y - 22 - VH / 2, 0, mh - VH);
}
const inView = (x, y, r, ox, oy) => x + r > ox && x - r < ox + VW && y + r > oy && y - r < oy + VH;

// ---------- свет ----------
// Яркость лампы во времени. Мигание плавное и не чаще 3 раз в секунду — так безопасно для глаз
function lightK(L, t) {
    switch (L.fx) {
        case 'alarm': { const s = 0.5 + 0.5 * Math.sin(t * 2.4 + (L.ph || 0)); return 0.3 + 0.7 * s * s; }
        case 'flicker': { const n = hash(Math.floor(t * 8), L.i, 3); return n < 0.06 ? 0.25 : n < 0.11 ? 0.65 : 1; }
        case 'dying': { const n = hash(Math.floor(t * 4), L.i, 5); return n < 0.12 ? 0.15 : 0.55 + 0.2 * Math.sin(t * 1.7) + 0.1 * n; }
        case 'blink': return 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 3.4));
        case 'spark': return Math.min(1.2, 0.3 + 0.1 * Math.sin(t * 9) + (EMIT[L.id].flash > 0 ? 0.9 : 0));
        case 'breath': return 0.7 + 0.3 * Math.sin(t * 1.3 + L.i);
        case 'holo': return 0.85 + 0.1 * Math.sin(t * 6) + 0.05 * hash(Math.floor(t * 10), 4);
        default: return 1;
    }
}
function clipRooms(c, rooms) {
    if (!rooms || !rooms.length) return;
    c.beginPath(); for (const r of rooms) c.rect(r.px, r.py, r.pw, r.ph); c.clip();
}
// «Дырка» в темноте: в центре светло, к краю плавно темнеет. Свет не проходит сквозь стены в соседний отсек
function hole(c, x, y, r, a, rooms) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.5, `rgba(0,0,0,${a * 0.6})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.save(); clipRooms(c, rooms);
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    c.restore();
}
const heroRooms = () => ROOMS_PX.filter(r => P.x + 40 > r.px && P.x - 40 < r.px + r.pw && P.y + 12 > r.py && P.y - 52 < r.py + r.ph);
function drawLights(t, ox, oy) {
    const c = lc;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, VW, VH);
    c.fillStyle = `rgba(5,3,12,${amb.toFixed(3)})`; c.fillRect(0, 0, VW, VH);
    c.setTransform(1, 0, 0, 1, -ox, -oy);
    c.globalCompositeOperation = 'destination-out';
    for (const L of LIGHTS_ALL) {
        L.vis = inView(L.px, L.py, L.r, ox, oy);
        if (!L.vis) continue;
        L.k = lightK(L, t);
        hole(c, L.px, L.py, L.r, Math.min(1, L.a * L.k), L.room && [L.room]);
    }
    // фонарь на шлеме: мягкий ореол вокруг героя и луч туда, куда он смотрит (три клина дают мягкий край)
    const hx = P.x, hy = P.y - 30, rooms = heroRooms();
    hole(c, P.x, P.y - 14, 64, 0.5, rooms);
    c.save(); clipRooms(c, rooms);
    for (const [w, a] of [[0.56, 0.2], [0.4, 0.24], [0.25, 0.3]]) {
        const g = c.createRadialGradient(hx, hy, 6, hx, hy, 190);
        g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(hx, hy); c.arc(hx, hy, 190, P.face - w, P.face + w); c.closePath(); c.fill();
    }
    c.restore();
    c.globalCompositeOperation = 'source-over';
}
// Цветной отсвет ламп поверх всего (режим 'lighter' — цвета складываются, как настоящий свет)
function drawGlows() {
    cx.globalCompositeOperation = 'lighter';
    for (const L of LIGHTS_ALL) {
        if (!L.vis || !L.g) continue;
        const a = L.g * Math.min(1.2, L.k), g = cx.createRadialGradient(L.px, L.py, 0, L.px, L.py, L.r);
        g.addColorStop(0, `rgba(${L.rgb},${a})`); g.addColorStop(1, `rgba(${L.rgb},0)`);
        cx.save(); clipRooms(cx, L.room && [L.room]);
        cx.fillStyle = g; cx.fillRect(L.px - L.r, L.py - L.r, L.r * 2, L.r * 2);
        cx.restore();
    }
    cx.globalCompositeOperation = 'source-over';
}
// Маленькие ореолы вокруг ярких точек: экраны, глаза крысы, звезда сохранения
function drawHalos() {
    cx.globalCompositeOperation = 'lighter';
    for (const [x, y, r, col, a] of halos) {
        if (a <= 0.003) continue;
        const rgb = typeof col === 'string' ? hex(col) : col, g = cx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
        cx.fillStyle = g; cx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    cx.globalCompositeOperation = 'source-over';
}

// ---------- двери и лампы (рисуются каждый кадр) ----------
function slab(c, x, y, w, h, top) {
    R(c, '#59617a', x, y, w, h); R(c, '#6d7690', x, y, 1, h); R(c, '#3a4050', x + w - 1, y, 1, h);
    const k = Math.min(4, h); hazard(c, x, top ? y + h - k : y, w, k);
}
function tape(c, r) {   // крест из ленты на запертой двери
    for (let i = 0; i < r.w; i++) {
        const col = ((i >> 2) & 1) ? '#c9a227' : '#17171a', d = Math.round(i * (r.h - 24) / r.w);
        R(c, col, r.x + i, r.y + 8 + d, 1, 4); R(c, col, r.x + i, r.y + r.h - 16 - d, 1, 4);
    }
}
function drawDoors(c) {
    for (const d of DOORS) {
        const r = d.rect;
        if (d.ch === 'D' || d.ch === 'K') {
            const s = Math.round(d.open * 28);   // створки уезжают в стену
            c.save(); c.beginPath(); c.rect(r.x, r.y, r.w, r.h); c.clip();
            c.drawImage(ART.panel[0], r.x - s, r.y); c.drawImage(ART.panel[1], r.x + 28 + s, r.y);
            c.restore();
            if (d.ch === 'K' && !HERO.flags.cardUsed) tape(c, r);
        } else if (d.ch === 'd') {
            const h = Math.round(r.h / 2 * (1 - d.open));
            if (h > 0) { slab(c, r.x, r.y, r.w, h, true); slab(c, r.x, r.y + r.h - h, r.w, h, false); }
        }
    }
}
function drawLampBases(c) {
    for (const L of LIGHTS_ALL) {
        if (!L.lamp) continue;
        const x = Math.round(L.lamp.x * T), y = Math.round(L.lamp.y * T);
        if (L.lamp.k === 'cold') { R(c, '#1c1f26', x - 10, y - 2, 20, 6); R(c, '#3a404c', x - 10, y - 2, 20, 1); R(c, '#4a5263', x - 8, y, 16, 2); }
        else if (L.lamp.k === 'alarm') { R(c, '#1c1f26', x - 5, y + 1, 10, 4); R(c, '#3a404c', x - 5, y + 1, 10, 1); R(c, '#4a1010', x - 3, y - 3, 6, 4); }
        else { R(c, '#1c1f26', x - 1, y - 7, 2, 5); R(c, '#2a2e38', x - 4, y - 2, 8, 7); }
    }
}

// ---------- то, что светится само ----------
const PANO_SHIFT = 470 - 24.5 * T + 24 * T * 0.85;   // из центра мостика чёрная дыра видна в среднем окне
function emitBackground(t, ox, oy) {
    const c = ec, ccx = ox + VW / 2;
    // иллюминаторы: вид на планету чуть сдвигается, когда идёшь, — так кажется, что она далеко
    for (const p of PANES) {
        if (!inView(p.x + p.w / 2, p.y + p.h / 2, p.w + p.h, ox, oy)) continue;
        const u = (((p.x - ccx * 0.85 + PANO_SHIFT) % PW) + PW) % PW | 0, v = Math.max(0, PH - p.h - 5), w1 = Math.min(p.w, PW - u);
        c.drawImage(ART.pano, u, v, w1, p.h, p.x, p.y, w1, p.h);
        if (w1 < p.w) c.drawImage(ART.pano, 0, v, p.w - w1, p.h, p.x + w1, p.y, p.w - w1, p.h);
        c.fillStyle = 'rgba(255,255,255,0.07)';   // блик на стекле
        for (let i = 0; i < p.h; i++) {
            const sx = Math.round(p.x + p.w * 0.7 - i * 0.55);
            for (const [o, w] of [[0, 3], [5, 1]]) { const a = Math.max(p.x, sx + o), b = Math.min(p.x + p.w, sx + o + w); if (b > a) c.fillRect(a, p.y + i, b - a, 1); }
        }
        if (p.crack) {   // трещина
            c.fillStyle = 'rgba(225,225,255,0.5)'; for (const [x, y] of p.crack.px) c.fillRect(x, y, 1, 1);
            c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(p.crack.x - 1, p.crack.y - 1, 2, 2);
        }
    }
    // светящиеся полосы на стенах, некоторые барахлят
    for (const s of STRIPS) {
        if (!inView(s.x * T + 16, s.y * T + 6, 32, ox, oy)) continue;
        if (s.fl && hash(Math.floor(t * 4), s.x, s.y) < 0.4) continue;
        R(c, 'rgba(61,224,255,0.5)', s.x * T, s.y * T + 5, T, 2);
    }
    // лампы на стенах
    for (const L of LIGHTS_ALL) {
        if (!L.lamp || !L.vis) continue;
        const x = Math.round(L.lamp.x * T), y = Math.round(L.lamp.y * T), k = Math.min(1, L.k);
        c.globalAlpha = 0.3 + 0.7 * k;
        if (L.lamp.k === 'cold') { R(c, '#dff4ff', x - 8, y, 16, 2); halos.push([x, y + 1, 20, L.rgb, 0.3 * k]); }
        else if (L.lamp.k === 'alarm') { R(c, '#ff3030', x - 3, y - 3, 6, 4); R(c, '#ffd0d0', x - 3 + Math.floor(t * 5 + (L.ph || 0) * 3) % 6, y - 3, 1, 2); halos.push([x, y - 1, 16, L.rgb, 0.55 * k]); }
        else { R(c, '#ffe2a8', x - 2, y - 1, 4, 4); halos.push([x, y + 1, 16, L.rgb, 0.4 * k]); }
        c.globalAlpha = 1;
        if (L.lamp.k === 'warm') { R(c, '#2a2e38', x - 3, y, 6, 1); R(c, '#2a2e38', x - 1, y - 2, 1, 6); }   // решётка на лампочке
    }
    // огоньки над дверями: красный — заперто, жёлтый — закрыто, зелёный — открыто
    for (const d of DOORS) {
        if (!d.light) continue;
        const col = d.locked ? '#ff3030' : d.open > 0.5 ? '#3dff8a' : '#ffb03d';
        R(c, col, d.light.x, d.light.y, 6, 2); halos.push([d.light.x + 3, d.light.y + 1, 9, col, 0.35]);
    }
    // планшеты на полу
    for (const p of flats) if (p.t === 'pad') {
        const col = p.y > 20 ? '#ffb03d' : '#3dff9a', on = Math.sin(t * 2.2 + p.i) > -0.4;
        c.globalAlpha = on ? 0.85 : 0.35; R(c, col, p.dx + 2, p.dy + 2, 10, 4); c.globalAlpha = 1;
        R(c, '#0b1a22', p.dx + 3, p.dy + 3, 6, 1);
        halos.push([p.dx + 7, p.dy + 4, 12, col, on ? 0.2 : 0.07]);
    }
}

function screenConsole(t, p, x, y) {   // экран пульта 22×9
    const c = ec, log = p.t === 'log', col = log || p.v === 'com' ? '#4dff9a' : '#3de0ff';
    R(c, log || p.v === 'com' ? '#06281a' : '#06303a', x, y, 22, 9);
    if (log) {   // строки журнала
        const s = Math.floor(t * 1.5);
        for (let i = 0; i < 3; i++) R(c, col, x + 2, y + 1 + i * 2, 4 + (hash(s + i, p.i) * 15 | 0), 1);
        if (Math.floor(t * 2) % 2) R(c, col, x + 2, y + 7, 3, 1);
    } else if (p.v === 'com') {   // ровная линия «нет сигнала» с редкими всплесками
        for (let i = 0; i < 20; i++) { const n = hash(i + Math.floor(t * 10), p.i, 9); R(c, col, x + 1 + i, y + 4 + (n > 0.93 ? -2 : n < 0.05 ? 2 : 0), 1, 1); }
        if (Math.floor(t * 1.5) % 2) R(c, '#ff3030', x + 18, y + 1, 2, 2);
    } else {   // навигация: сетка, бегущая линия и мигающий «?»
        c.globalAlpha = 0.35; for (let i = 3; i < 22; i += 5) R(c, col, x + i, y, 1, 9); R(c, col, x, y + 4, 22, 1); c.globalAlpha = 1;
        R(c, col, x + Math.floor((t * 8 + p.i * 5) % 22), y, 1, 9);
        if (Math.floor(t * 1.2 + p.i) % 2) { R(c, '#fff', x + 10, y + 1, 3, 1); R(c, '#fff', x + 12, y + 2, 1, 2); R(c, '#fff', x + 11, y + 4, 1, 2); R(c, '#fff', x + 11, y + 7, 1, 1); }
    }
    halos.push([x + 11, y + 5, 22, col, 0.16]);
}
function screenTerminal(t, x, y) {   // экран терминала 18×16, сбоит
    const c = ec, f = EMIT.term.flash > 0, on = f || hash(Math.floor(t * 5), 77) > 0.12;
    R(c, on ? '#3a0606' : '#1a0303', x, y, 18, 16);
    if (on) {
        for (let i = 0; i < 5; i++) R(c, '#ff5533', x + 2 + (f ? (hash(i, Math.floor(t * 30)) * 4 | 0) - 2 : 0), y + 2 + i * 3, 3 + (hash(i, 3) * 7 | 0), 1);
        if (Math.floor(t * 1.6) % 2) { R(c, '#ffd0c0', x + 14, y + 3, 2, 7); R(c, '#ffd0c0', x + 14, y + 11, 2, 2); }
    }
    for (const [a, b] of [[9, 14], [10, 15], [11, 17], [12, 18], [12, 19], [13, 21]]) R(c, '#5a5f6b', x - 7 + a, y - 12 + b, 1, 1);   // трещина
    halos.push([x + 9, y + 8, 26, '#ff5533', on ? 0.2 : 0.06]);
}
function podLights(t, p, x, y) {
    const c = ec;
    if (p.v === 'open') {
        c.globalAlpha = 0.16 + 0.04 * Math.sin(t * 1.5); pxRRect(c, x + 10, y + 12, 12, 34, 5, '#7fd8ff'); c.globalAlpha = 1;
        const on = Math.floor(t * 1.6) % 2 === 0;
        R(c, on ? '#ff3030' : '#4a1010', x + 13, y + 3, 6, 2); if (on) halos.push([x + 16, y + 4, 10, '#ff3030', 0.4]);
    } else if (p.v === 'frost') {
        c.globalAlpha = 0.12; pxRRect(c, x + 8, y + 9, 16, 40, 7, '#cfefff'); c.globalAlpha = 1;
        R(c, '#3de0ff', x + 13, y + 3, 6, 2); halos.push([x + 16, y + 4, 10, '#3de0ff', 0.3]);
    } else if (hash(Math.floor(t * 3), p.i) > 0.75) { R(c, '#ff8a2a', x + 13, y + 3, 6, 2); halos.push([x + 16, y + 4, 8, '#ff8a2a', 0.3]); }
}
function containerGlow(t, x, y) {   // из дыры в контейнере сочится фиолетовый свет
    const c = ec, k = 0.7 + 0.3 * Math.sin(t * 1.3);
    c.globalAlpha = 0.35 * k; pxEll(c, x + 30, y + 44, 10, 12, '#9b4dff');
    c.globalAlpha = 0.6 * k; pxEll(c, x + 30, y + 46, 5, 6, '#c58cff');
    c.globalAlpha = 1;
    for (let i = 0; i < 6; i++) if (Math.sin(t * 2 + i * 1.7) > 0.3) R(c, '#efd9ff', x + 22 + (hash(i, 41) * 16 | 0), y + 34 + (hash(i, 42) * 20 | 0), 1, 1);
}
function hologram(t, x, y) {   // вращающаяся планета над столом
    const c = ec, k = 0.85 + 0.1 * Math.sin(t * 6), hx = x + 32, hy = y - 8, r = 13;
    c.globalAlpha = 0.16 * k;
    for (let i = 0; i < 16; i++) { const hw = Math.round(3 + i * 0.6); R(c, '#3de0ff', hx - hw, y + 20 - i, hw * 2, 1); }
    c.globalAlpha = 0.8 * k;
    for (let a = 0; a < 72; a++) { const an = a / 72 * Math.PI * 2; R(c, '#8ff6ff', Math.round(hx + Math.cos(an) * r), Math.round(hy + Math.sin(an) * r), 1, 1); }
    c.globalAlpha = 0.5 * k;
    for (let m = 0; m < 3; m++) {
        const rx = Math.abs(Math.cos(t * 0.9 + m * Math.PI / 3)) * r;
        for (let a = 0; a < 48; a++) { const an = a / 48 * Math.PI * 2; R(c, '#3de0ff', Math.round(hx + Math.cos(an) * rx), Math.round(hy + Math.sin(an) * r), 1, 1); }
    }
    for (const f of [-0.5, 0, 0.5]) { const hw = Math.round(Math.sqrt(1 - f * f) * r); R(c, '#3de0ff', hx - hw, Math.round(hy + f * r), hw * 2 + 1, 1); }
    const dy = (t * 14) % (r * 2) - r, hw = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
    c.globalAlpha = 0.3 * k; R(c, '#bffaff', hx - hw, Math.round(hy + dy), hw * 2 + 1, 1);
    c.globalAlpha = 1;
    if (Math.floor(t * 2) % 2) R(c, '#ffdd55', hx + 5, hy - 3, 2, 2);   // «ВЫ ЗДЕСЬ»
    halos.push([hx, hy, 34, '#3de0ff', 0.12 * k]);
}

// ---------- предметы, герой и крыса ----------
// Рисуем по глубине: кто ниже на экране, тот ближе и перекрывает остальных.
// Светящиеся детали лежат в отдельном слое — предмет спереди стирает их, иначе они просвечивали бы сквозь него
function cut(img, sx, sy, w, h, x, y) {
    ec.globalCompositeOperation = 'destination-out';
    ec.drawImage(img, sx, sy, w, h, x, y, w, h);
    ec.globalCompositeOperation = 'source-over';
}
let SPR = null;
function drawSprites(t) {
    if (!SPR) SPR = props.filter(p => p.box && (p.img || p.t === 'save'));
    const list = SPR.slice();
    list.push({ hero: true, sy: P.y });
    if (rat.alive) list.push({ ratS: true, sy: rat.y });
    list.sort((a, b) => a.sy - b.sy);
    for (const it of list) {
        if (it.hero) drawHero();
        else if (it.ratS) drawRat();
        else if (it.t === 'save') drawStar(t, it);
        else drawProp(t, it);
    }
}
// Вещь, которую ещё не взяли, иногда поблёскивает — чтобы игрок её заметил
function drawGlints(t) {
    for (const p of props) {
        if (!p.item || HERO.found[p.item] || !p.img) continue;
        const ph = (t * 0.8 + p.i * 0.37) % 2.4;
        if (ph > 0.5) continue;
        const k = Math.sin(ph / 0.5 * Math.PI), s = Math.round(1 + k * 3);
        const x = Math.round(p.dx + p.img.width * 0.72), y = Math.round(p.dy + Math.min(10, p.img.height * 0.3));
        R(ec, '#ffffff', x - s, y, s * 2 + 1, 1); R(ec, '#ffffff', x, y - s, 1, s * 2 + 1);
        halos.push([x + 0.5, y + 0.5, 12, '#ffffff', 0.35 * k]);
    }
}
function drawProp(t, p) {
    sc.drawImage(p.img, p.dx, p.dy);
    cut(p.img, 0, 0, p.img.width, p.img.height, p.dx, p.dy);
    if (p.t === 'console' || p.t === 'log') screenConsole(t, p, p.dx + 5, p.dy + 4);
    else if (p.t === 'terminal') screenTerminal(t, p.dx + 7, p.dy + 12);
    else if (p.t === 'pod') podLights(t, p, p.dx, p.dy);
    else if (p.t === 'container' && p.v === 'broken') containerGlow(t, p.dx, p.dy);
    else if (p.t === 'holo') hologram(t, p.dx, p.dy);
}
function drawHero() {
    const x = Math.round(P.x), y = Math.round(P.y);
    pxEll(sc, x, y - 1, 9, 3, 'rgba(0,0,0,0.4)');
    if (heroImg.complete && heroImg.naturalWidth) {
        const sx = P.frame * 28, sy = HERO_ROW[P.dir] * 46;
        sc.drawImage(heroImg, sx, sy, 28, 46, x - 14, y - 45, 28, 46);
        cut(heroImg, sx, sy, 28, 46, x - 14, y - 45);
    } else R(sc, '#d8d8e0', x - 8, y - 40, 16, 38);   // картинка героя не загрузилась — хотя бы силуэт
}
function drawRat() {
    const img = (rat.right ? ART.rat : ART.ratL)[rat.frame], x = Math.round(rat.x) - 11, y = Math.round(rat.y) - 8;
    pxEll(sc, x + 11, y + 7, 9, 2, 'rgba(0,0,0,0.45)');
    sc.drawImage(img, x, y); cut(img, 0, 0, img.width, img.height, x, y);
    const ex = x + (rat.right ? 17 : 4), ey = y + 3;   // глаз светится в темноте
    R(ec, '#ff3a3a', ex, ey, 1, 1);
    halos.push([ex + 0.5, ey + 0.5, 9, '#ff2020', rat.chase ? 0.6 : 0.4]);
}
function drawStar(t, p) {
    const x = p.X + 16, y = p.Y + 8 + Math.round(Math.sin(t * 2.2) * 2);
    pxEll(sc, x, p.Y + 27, 6, 2, 'rgba(0,0,0,0.35)');
    ec.drawImage(ART.star[Math.floor(t * 2.5) % 2], x - 5, y);
    halos.push([x, y + 5, 30, '#ffd84a', 0.32 + 0.08 * Math.sin(t * 3)]);
}
function drawAir() {   // искры, холодный пар из капсулы, пыль на мостике
    for (const p of parts) {
        const x = Math.round(p.x), y = Math.round(p.y);
        if (p.k === 'spark') R(cx, p.life > 0.25 ? '#fff3b0' : '#ff9a3c', x, y, 1, 1);
        else if (p.k === 'mist') R(cx, `rgba(190,230,255,${(0.09 * Math.sin(Math.PI * p.life / p.max)).toFixed(3)})`, x - 3, y - 1, 7, 3);
        else R(cx, `rgba(210,190,255,${(0.22 * Math.sin(Math.PI * p.life / p.max)).toFixed(3)})`, x, y, 1, 1);
    }
}
function drawOverlay(ox, oy) {
    cx.setTransform(1, 0, 0, 1, 0, 0);
    if (enc) {   // «!» над головой, потом темнота и мигающее сердце — как в Undertale
        const hx = Math.round(P.x - ox), hy = Math.round(P.y - oy);
        if (enc.t < 0.55) cx.drawImage(ART.bang, hx - 4, hy - 60);
        else {
            cx.fillStyle = '#000'; cx.fillRect(0, 0, VW, VH);
            let x = hx - 4, y = hy - 26;
            if (enc.t > 1.1) { const k = Math.min(1, (enc.t - 1.1) / 0.2); x += (VW / 2 - 4 - x) * k; y += (VH - 40 - y) * k; }
            if (enc.t > 1.1 || Math.floor((enc.t - 0.55) / 0.11) % 2 === 0) cx.drawImage(ART.heart, Math.round(x), Math.round(y));
        }
    }
    if (fadeA > 0) { cx.fillStyle = `rgba(0,0,0,${Math.min(1, fadeA).toFixed(3)})`; cx.fillRect(0, 0, VW, VH); }
}

function render() {
    const t = clock, ox = Math.round(cam.x), oy = Math.round(cam.y);
    halos.length = 0;
    // 1) пол, стены, двери, лампы, вещи на полу
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalCompositeOperation = 'source-over'; cx.globalAlpha = 1;
    cx.fillStyle = '#000'; cx.fillRect(0, 0, VW, VH);
    cx.setTransform(1, 0, 0, 1, -ox, -oy);
    cx.drawImage(layer, 0, 0);
    drawDoors(cx); drawLampBases(cx);
    for (const p of flats) cx.drawImage(p.img, p.dx, p.dy);
    // 2) накрываем темнотой с пятнами света
    drawLights(t, ox, oy);
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.drawImage(lc.canvas, 0, 0);
    // 3) предметы, герой и крыса — их затеняем той же темнотой; светящееся — нет
    for (const c of [sc, ec]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, VW, VH); c.setTransform(1, 0, 0, 1, -ox, -oy); }
    emitBackground(t, ox, oy);
    drawSprites(t); drawGlints(t);
    sc.setTransform(1, 0, 0, 1, 0, 0); sc.globalCompositeOperation = 'source-atop'; sc.drawImage(lc.canvas, 0, 0); sc.globalCompositeOperation = 'source-over';
    cx.drawImage(sc.canvas, 0, 0);
    // 4) цветной свет, светящиеся детали, ореолы, частицы
    cx.setTransform(1, 0, 0, 1, -ox, -oy); drawGlows();
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.drawImage(ec.canvas, 0, 0);
    cx.setTransform(1, 0, 0, 1, -ox, -oy);
    for (const k in EMIT) if (EMIT[k].flash > 0) halos.push([EMIT[k].x, EMIT[k].y, 26, '#ffcc66', 0.5]);
    drawSlime(cx, t);
    drawHalos(); drawAir();
    // 5) встреча с крысой и затемнение при входе
    drawOverlay(ox, oy);
}

// ---------- диалоги ----------
const ui = {
    game: document.getElementById('game-screen'),
    scene: document.getElementById('scene-awake'),
    text: document.getElementById('dialogue-text'),
    next: document.getElementById('next-btn'),
    map: document.getElementById('map-container'),
    controls: document.getElementById('controls'),
};
let talk = null;   // открытый диалог
// Печатает реплики по буквам, как в Undertale. lines — строка или массив строк, done — что сделать после последней
function say(lines, done) {
    if (talk) clearTimeout(talk.timer);
    talk = { lines: [].concat(lines), i: 0, done, opened: performance.now() };
    if (state === 'play') state = 'say';
    joyReset();
    ui.controls.style.visibility = 'hidden';
    ui.scene.style.display = 'flex';
    showLine();
}
function showLine() {
    talk.full = String(talk.lines[talk.i]); talk.n = 0; talk.typing = true;
    // невидимый хвост текста держит размер рамки — она не прыгает, пока буквы печатаются
    talk.vis = document.createElement('span'); talk.hid = document.createElement('span');
    talk.hid.style.visibility = 'hidden'; talk.hid.textContent = talk.full;
    ui.text.textContent = ''; ui.text.append(talk.vis, talk.hid);
    ui.next.style.visibility = 'hidden';
    typeNext();
}
function typeNext() {
    if (!talk || !talk.typing) return;
    const full = talk.full, ch = full[talk.n], nx = full[talk.n + 1];
    talk.n++;
    talk.vis.textContent = full.slice(0, talk.n); talk.hid.textContent = full.slice(talk.n);
    if (ch && ch.trim() && talk.n % 2) SFX.blip();
    if (talk.n >= full.length) return finishLine();
    const end = nx === undefined || nx === ' ' || nx === '\n';
    const pause = '.!?…'.includes(ch) && end ? 220 : (',:;—'.includes(ch) && end ? 90 : 0);
    talk.timer = setTimeout(typeNext, 28 + pause);
}
function finishLine() {
    clearTimeout(talk.timer); talk.typing = false;
    talk.vis.textContent = talk.full; talk.hid.textContent = '';
    ui.next.style.visibility = 'visible';
}
function advance() {
    if (!talk || performance.now() - talk.opened < 150) return;   // то же касание, что открыло диалог, — не считаем
    if (talk.typing) return finishLine();
    if (++talk.i < talk.lines.length) return showLine();
    const done = talk.done; talk = null;
    ui.scene.style.display = 'none';
    ui.controls.style.visibility = '';
    if (state === 'say') state = 'play';
    if (done) done();
}
// Коснулся экрана в любом месте — следующая реплика
ui.game.addEventListener('pointerdown', e => { if (talk && e.button <= 0) advance(); });

// ---------- управление ----------
const keys = new Set();
const keyDown = (...codes) => codes.some(c => keys.has(c));
let xHeld = false;
const running = () => xHeld || keyDown('KeyX', 'ShiftLeft', 'ShiftRight');
const CONFIRM = ['KeyZ', 'Enter', 'NumpadEnter', 'Space'], CANCEL = ['KeyX', 'ShiftLeft', 'ShiftRight'];
function confirmKey() { if (talk) advance(); else if (state === 'play') interact(); }
function cancelKey() { if (talk && talk.typing) finishLine(); }
function menuKey() {
    if (talk || state !== 'play') return;
    const names = HERO.items.map(id => typeof ITEMS !== 'undefined' && ITEMS[id] ? ITEMS[id].name : id);
    say([`* ${HERO.name}   LV ${HERO.lv}   HP ${HERO.hp}/${HERO.maxHp}\n* Отсек: ${curRoom ? curRoom.name : '???'}`,
        names.length ? '* В карманах: ' + names.join(', ') + '.' : '* Карманы пусты.',
        '* Z — осмотреть.\n* X (держать) — бежать.']);
}
// e.code — это физическая клавиша, поэтому Z работает и на русской раскладке
document.addEventListener('keydown', e => {
    if (state === 'off' && !talk) return;   // в главном меню клавиши не трогаем
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    keys.add(e.code);
    if (e.repeat) return;
    if (CONFIRM.includes(e.code)) confirmKey();
    else if (CANCEL.includes(e.code)) cancelKey();
    else if (e.code === 'KeyC') menuKey();
});
document.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => { keys.clear(); xHeld = false; joyReset(); });

// Джойстик: палец можно вести куда угодно, пока не отпустишь
const joy = { on: false, x: 0, y: 0, id: null };
const joyArea = document.getElementById('joystick-area'), joyBase = document.getElementById('joystick-base'), joyStick = document.getElementById('joystick-stick');
function joyMove(e) {
    const r = joyBase.getBoundingClientRect(), max = r.width * 0.3;
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > max) { dx *= max / d; dy *= max / d; }
    joy.x = dx / max; joy.y = dy / max; joy.on = true;
    joyStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
function joyReset() {
    joy.on = false; joy.x = joy.y = 0; joy.id = null;
    if (joyStick) joyStick.style.transform = 'translate(-50%, -50%)';
}
if (joyArea) {
    joyArea.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation(); joy.id = e.pointerId;
        try { joyArea.setPointerCapture(e.pointerId); } catch (_) {}
        joyMove(e);
    });
    joyArea.addEventListener('pointermove', e => { if (e.pointerId === joy.id) { e.preventDefault(); joyMove(e); } });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) joyArea.addEventListener(ev, e => { if (e.pointerId === joy.id) joyReset(); });
}
// Кнопки на экране: Z — осмотреть / дальше, X (держать) — бежать, C — меню
function pad(id, down, up) {
    const b = document.getElementById(id); if (!b) return;
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); down(); });
    if (up) for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, up);
}
pad('btn-z', confirmKey);
pad('btn-x', () => { xHeld = true; cancelKey(); }, () => { xHeld = false; });
pad('btn-c', menuKey);

// ---------- надписи поверх карты ----------
const roomLabel = document.createElement('div'); roomLabel.id = 'room-label';
const hint = document.createElement('div'); hint.id = 'ship-hint';
hint.textContent = 'Стрелки — идти   Z — осмотреть   X — бежать   C — меню';
ui.map.append(roomLabel, hint);
let roomTimer = 0, hintTimer = 0;
function showRoom(name) {
    roomLabel.textContent = name; roomLabel.classList.add('show');
    clearTimeout(roomTimer); roomTimer = setTimeout(() => roomLabel.classList.remove('show'), 2200);
}

// ---------- звук ----------
// Короткие звуки собираем прямо в браузере (WebAudio) — не нужно загружать файлы
let actx = null, noiseBuf = null;
const ambient = document.getElementById('ship-ambient');
const AMB_VOL = 0.55;
let ambTimer = 0;
// Вызывать по касанию или клику: браузеры разрешают звук только после действия игрока
function shipUnlockAudio() {
    try {
        if (!actx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) {
                actx = new AC();
                noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
                const d = noiseBuf.getChannelData(0);
                for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            }
        }
        if (actx && actx.state === 'suspended') actx.resume();
    } catch (e) {}
    // iPhone потом не даст включить фон без касания — поэтому «разблокируем» его сейчас
    if (ambient && ambient.paused && state === 'off') {
        ambient.muted = true; ambient.volume = 0;
        const p = ambient.play();
        const stop = () => { if (state === 'off') ambient.pause(); ambient.muted = false; };
        if (p && p.then) p.then(stop, stop); else stop();
    }
}
function ambientTo(to, ms) {
    if (!ambient) return;
    clearInterval(ambTimer);
    if (to > 0) {
        if ((typeof musicOn !== 'undefined' && !musicOn) || document.hidden) return;   // музыку выключили в меню — фон тоже молчит
        ambient.muted = false;
        if (ambient.paused) { ambient.volume = 0; ambient.play().catch(() => {}); }
    }
    const from = ambient.volume, t0 = performance.now();
    ambTimer = setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        ambient.volume = clamp(from + (to - from) * k, 0, 1);
        if (k === 1) { clearInterval(ambTimer); if (to === 0) ambient.pause(); }
    }, 40);
}
const live = () => actx && actx.state === 'running';
function tone(type, f0, f1, dur, vol, when = 0) {
    if (!live()) return;
    try {
        const t = actx.currentTime + when, o = actx.createOscillator(), g = actx.createGain();
        o.type = type; o.frequency.setValueAtTime(f0, t);
        if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.03);
    } catch (e) {}
}
function noise(dur, vol, type, freq, when = 0, q = 1, freq2 = 0) {
    if (!live()) return;
    try {
        const t = actx.currentTime + when, s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
        s.buffer = noiseBuf; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t);
        if (freq2) f.frequency.exponentialRampToValueAtTime(freq2, t + dur);
        g.gain.setValueAtTime(Math.max(0.0002, vol), t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(f); f.connect(g); g.connect(actx.destination);
        s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03);
    } catch (e) {}
}
const SFX = {
    blip: () => tone('square', 540 + Math.random() * 40, 540, 0.035, 0.03),
    step: alt => noise(0.05, 0.045, 'bandpass', alt ? 950 : 720, 0, 2.5),
    door: () => { noise(0.42, 0.06, 'bandpass', 420, 0, 0.9, 2400); tone('sine', 95, 55, 0.18, 0.06, 0.32); },
    locked: () => { tone('square', 150, 150, 0.09, 0.04); tone('square', 118, 118, 0.13, 0.04, 0.12); },
    save: () => [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.22, 0.07, i * 0.07)),
    item: () => [1047, 1319, 1568].forEach((f, i) => tone('square', f, f, 0.09, 0.03, i * 0.07)),
    alert: () => { tone('square', 880, 1320, 0.07, 0.05); tone('square', 1320, 1320, 0.09, 0.045, 0.07); },
    heart: () => tone('square', 450, 450, 0.07, 0.045),
    spark: v => { noise(0.08 + Math.random() * 0.1, 0.06 * v, 'highpass', 3000, 0, 0.7); noise(0.04, 0.05 * v, 'highpass', 5200, 0.06 + Math.random() * 0.06, 0.7); },
    squeak: (v = 1) => { tone('triangle', 2300, 3300, 0.08, 0.035 * v); tone('triangle', 3200, 2500, 0.1, 0.03 * v, 0.09); },
};

// ---------- сохранение ----------
const SAVE_KEY = 'kosmik_save';
function saveGame() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ x: Math.round(P.x), y: Math.round(P.y), dir: P.dir, ratGone: !rat.alive,
            hp: HERO.hp, maxHp: HERO.maxHp, lv: HERO.lv, exp: HERO.exp, items: HERO.items, found: HERO.found, flags: HERO.flags }));
    } catch (e) {}
    markContinue();
}
function loadShipSave() {
    try {
        const s = JSON.parse(localStorage.getItem(SAVE_KEY));
        if (s && isFinite(s.x) && isFinite(s.y) && isFloor(tileAt(Math.floor(s.x / T), Math.floor((s.y - 4) / T)))) return s;
    } catch (e) {}
    return null;
}
// Нет сохранения — кнопка «Продолжить игру» бледнее
function markContinue() {
    const b = document.querySelector('.menu-btn[onclick*="continue"]');
    if (b) b.classList.toggle('no-save', !loadShipSave());
}

// ---------- запуск и пауза ----------
let raf = 0, last = 0, built = false;
function loop(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;   // после сворачивания вкладки не «телепортируемся»
    update(dt); render();
    raf = requestAnimationFrame(loop);
}
function runLoop() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }
function stopLoop() { cancelAnimationFrame(raf); raf = 0; }

// save — из loadShipSave() или null для новой игры
function startShip(save) {
    if (!built) { buildArt(); buildWorld(); setupCanvas(); built = true; }
    const s = save || null;
    HERO.maxHp = s && s.maxHp > 0 ? s.maxHp : 20;
    HERO.hp = s && s.hp > 0 ? Math.min(s.hp, HERO.maxHp) : HERO.maxHp;
    HERO.lv = (s && s.lv) || 1; HERO.exp = (s && s.exp) || 0;
    HERO.items = s && Array.isArray(s.items) ? s.items.slice() : [];
    HERO.found = s && s.found ? { ...s.found } : {};
    HERO.flags = s && s.flags ? { ...s.flags } : {};
    P.x = s ? s.x : START.x * T; P.y = s ? s.y : START.y * T;
    P.dir = s && DIRV[s.dir] ? s.dir : START.dir;
    P.face = Math.atan2(DIRV[P.dir][1], DIRV[P.dir][0]); P.frame = 0; P.moving = false;
    Object.assign(rat, { alive: !(s && s.ratGone), x: RAT_START.x * T, y: RAT_START.y * T, tx: RAT_START.x * T, ty: RAT_START.y * T, chase: false, wait: 1, stuck: 0, calm: 0 });
    for (const d of DOORS) { d.want = !d.locked && nearDoor(d) ? 1 : 0; d.open = d.want; }
    curRoom = roomAt(P.x, P.y - 4); amb = curRoom ? curRoom.dark : 0.86;
    parts.length = 0; enc = null; clock = 0; fadeA = 1;
    events = [{ at: 4, fn: () => { if (rat.alive) SFX.squeak(0.35); } }];   // где-то вдалеке пищит...
    ui.map.style.display = 'block'; ui.controls.style.display = 'flex';
    resize();
    state = talk ? 'say' : 'play';
    if (curRoom) showRoom(curRoom.name);
    hint.classList.add('show'); clearTimeout(hintTimer); hintTimer = setTimeout(() => hint.classList.remove('show'), 8000);
    ambientTo(AMB_VOL, 2500);
    runLoop();
}
function pauseShip() {
    state = 'off'; enc = null; stopLoop();
    joyReset(); keys.clear(); xHeld = false;
    ambientTo(0, 600);
}
// После боя: resumeShip({ ratGone: true }) — крыса исчезает с карты, resumeShip({ fled: true }) — сбежал, крыса отбегает
function resumeShip(opts) {
    if (!built) return;
    if (opts && opts.ratGone) rat.alive = false;
    if (opts && opts.fled) {
        const p = ratAway();
        Object.assign(rat, { x: p.x, y: p.y, tx: p.x, ty: p.y, chase: false, wait: 1, stuck: 0, calm: 4 });
    }
    ui.map.style.display = 'block'; ui.controls.style.display = 'flex';
    state = talk ? 'say' : 'play'; fadeA = 1;
    if (curRoom) showRoom(curRoom.name);
    ambientTo(AMB_VOL, 1500);
    runLoop();
}
document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (ambient) ambient.pause(); keys.clear(); xHeld = false; }
    else if (state !== 'off') ambientTo(AMB_VOL, 800);
});

window.say = say;
window.startShip = startShip;
window.pauseShip = pauseShip;
window.resumeShip = resumeShip;
window.shipUnlockAudio = shipUnlockAudio;
window.loadShipSave = loadShipSave;
window.shipArt = ART;   // бой (battle.js) берёт отсюда крысу
window.shipSound = { tone, noise, ctx: () => actx };   // ...и звуки
// для проверки: открой игру с ?debug — в консоли появится window.ship
if (/[?&]debug/.test(location.search)) window.ship = { P, rat, DOORS, props, get state() { return state; }, get room() { return curRoom && curRoom.name; }, get chase() { return chase; }, interact, startEncounter };
markContinue();

// Космонавт для карты: 4 стороны (вниз, вверх, влево, вправо) × 3 кадра ходьбы, кадр 28×46.
// Картинка встроена прямо в код, чтобы на GitHub не нужно было загружать лишний файл
heroImg.src = 'data:image/png;base64,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';
})();
