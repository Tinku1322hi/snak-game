// ===== Canvas Setup =====
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const GRID   = 21;       // cell size in px
const COLS   = 20;       // number of columns
const ROWS   = 20;       // number of rows
// canvas is 420x420 = 20 * 21

// ===== Game State =====
let snake, dir, nextDir, food, score, highScore, level, speed;
let gameRunning = false;
let paused      = false;
let animId      = null;
let lastTime    = 0;
let particles   = [];
let foodPulse   = 0;

// ===== DOM =====
const scoreEl     = document.getElementById('score');
const highScoreEl = document.getElementById('highscore');
const levelEl     = document.getElementById('level');
const overlay     = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySub  = document.getElementById('overlay-sub');
const startBtn    = document.getElementById('startBtn');

// ===== Init =====
function initGame() {
  snake   = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir     = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score   = 0;
  level   = 1;
  speed   = 150;
  particles = [];
  foodPulse = 0;
  updateHUD();
  placeFood();
}

// ===== HUD =====
function updateHUD() {
  scoreEl.textContent     = score;
  highScoreEl.textContent = highScore || 0;
  levelEl.textContent     = level;
}

// ===== Food =====
function placeFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS)
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  food = pos;
  foodPulse = 0;
}

// ===== Particles =====
function spawnParticles(gx, gy) {
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 2.5;
    particles.push({
      x:     gx * GRID + GRID / 2,
      y:     gy * GRID + GRID / 2,
      vx:    Math.cos(angle) * speed,
      vy:    Math.sin(angle) * speed,
      life:  1,
      color: Math.random() > 0.5 ? '#fbbf24' : '#f87171'
    });
  }
}

function updateParticles() {
  particles = particles.filter(p => p.life > 0.05);
  particles.forEach(p => {
    p.x   += p.vx;
    p.y   += p.vy;
    p.vy  += 0.1;       // gravity
    p.life -= 0.055;
  });
}

// ===== Game Logic =====
function update() {
  dir = { ...nextDir };

  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  // Wall collision
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    endGame(); return;
  }
  // Self collision
  for (let i = 0; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      endGame(); return;
    }
  }

  snake.unshift(head);

  // Ate food?
  if (head.x === food.x && head.y === food.y) {
    score++;
    if (score > (highScore || 0)) highScore = score;
    spawnParticles(food.x, food.y);
    placeFood();
    // Level up every 5 points
    if (score % 5 === 0) {
      level++;
      speed = Math.max(60, speed - 12);
    }
    updateHUD();
  } else {
    snake.pop();
  }

  foodPulse += 0.12;
}

// ===== Drawing =====
function drawBackground() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath(); ctx.moveTo(i * GRID, 0); ctx.lineTo(i * GRID, canvas.height); ctx.stroke();
  }
  for (let j = 0; j <= ROWS; j++) {
    ctx.beginPath(); ctx.moveTo(0, j * GRID); ctx.lineTo(canvas.width, j * GRID); ctx.stroke();
  }
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

function drawSnake() {
  const len = snake.length;

  for (let i = len - 1; i >= 0; i--) {
    const seg  = snake[i];
    const px   = seg.x * GRID;
    const py   = seg.y * GRID;
    const pad  = 1.5;
    const size = GRID - pad * 2;

    // Color: head is brightest, tail fades
    const t = i / len;
    if (i === 0) {
      ctx.fillStyle = '#16a34a';   // head — dark green
    } else {
      // Body gradient: bright → dark
      const g = Math.round(180 - t * 80);
      ctx.fillStyle = `rgb(22, ${g}, 74)`;
    }

    // Radius: head more rounded, tail narrow
    const r = i === 0 ? 8 : i === len - 1 ? 3 : 6;
    roundRect(px + pad, py + pad, size, size, r);
    ctx.fill();

    // Shine on body segments
    if (i > 0 && i < len - 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.beginPath();
      ctx.arc(px + GRID * 0.3, py + GRID * 0.3, GRID * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- Draw Head Details (eyes + tongue) ----
  const hx = snake[0].x * GRID;
  const hy = snake[0].y * GRID;

  // Eye positions depending on direction
  let eye1, eye2;
  if (dir.x === 1)       { eye1 = [hx+15, hy+5];  eye2 = [hx+15, hy+15]; }
  else if (dir.x === -1) { eye1 = [hx+5,  hy+5];  eye2 = [hx+5,  hy+15]; }
  else if (dir.y === -1) { eye1 = [hx+5,  hy+5];  eye2 = [hx+15, hy+5];  }
  else                   { eye1 = [hx+5,  hy+15]; eye2 = [hx+15, hy+15]; }

  [eye1, eye2].forEach(([ex, ey]) => {
    // White sclera
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ex, ey, 3.8, 0, Math.PI * 2); ctx.fill();
    // Dark pupil — offset toward direction
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(ex + dir.x * 1.2, ey + dir.y * 1.2, 2.1, 0, Math.PI * 2);
    ctx.fill();
    // Tiny highlight
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(ex + dir.x * 0.5 - 0.8, ey + dir.y * 0.5 - 0.8, 0.9, 0, Math.PI * 2);
    ctx.fill();
  });

  // Tongue (only when moving)
  if (dir.x !== 0 || dir.y !== 0) {
    const tx = hx + GRID / 2 + dir.x * (GRID / 2 + 3);
    const ty = hy + GRID / 2 + dir.y * (GRID / 2 + 3);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx + GRID / 2 + dir.x * (GRID / 2 - 2), hy + GRID / 2 + dir.y * (GRID / 2 - 2));
    ctx.lineTo(tx, ty);
    // Fork
    const forkLen = 4;
    const perpX = dir.y, perpY = -dir.x;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + dir.x * forkLen + perpX * forkLen, ty + dir.y * forkLen + perpY * forkLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + dir.x * forkLen - perpX * forkLen, ty + dir.y * forkLen - perpY * forkLen);
    ctx.stroke();
  }
}

function drawFood() {
  const cx = food.x * GRID + GRID / 2;
  const cy = food.y * GRID + GRID / 2;
  const pulse = Math.sin(foodPulse) * 1.8;
  const r = GRID * 0.38 + pulse * 0.2;

  // Outer glow ring
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.stroke();

  // Apple body
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.40)';
  ctx.beginPath(); ctx.arc(cx - 2.5, cy - 2.5, r * 0.32, 0, Math.PI * 2); ctx.fill();

  // Stem
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx + 5, cy - r - 7, cx + 6, cy - r - 5);
  ctx.stroke();

  // Leaf
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(cx + 5, cy - r - 4, 4, 2, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5 * p.life, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function draw() {
  drawBackground();
  drawFood();
  drawSnake();
  drawParticles();
}

// ===== Game Loop =====
function gameLoop(timestamp) {
  if (!paused) {
    if (timestamp - lastTime >= speed) {
      lastTime = timestamp;
      update();
    }
    updateParticles();
    draw();
  }
  if (gameRunning) animId = requestAnimationFrame(gameLoop);
}

// ===== Start / End =====
function startGame() {
  initGame();
  gameRunning = true;
  paused      = false;
  lastTime    = 0;
  overlay.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = '💀 Game Over!';
  overlaySub.textContent   = 'Score: ' + score;
  startBtn.textContent     = '🔄 Play Again';
  overlay.classList.remove('hidden');
}

function togglePause() {
  if (!gameRunning) return;
  paused = !paused;
  if (paused) {
    // Draw pause screen manually
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('⏸  Paused', canvas.width / 2, canvas.height / 2);
    ctx.font = '16px Segoe UI';
    ctx.fillStyle = '#888';
    ctx.fillText('Space dabao resume ke liye', canvas.width / 2, canvas.height / 2 + 36);
    ctx.textAlign = 'left';
  } else {
    lastTime = performance.now();
    animId   = requestAnimationFrame(gameLoop);
  }
}

// ===== Keyboard Input =====
const keyMap = {
  ArrowUp:    { x: 0,  y: -1 },
  ArrowDown:  { x: 0,  y:  1 },
  ArrowLeft:  { x: -1, y:  0 },
  ArrowRight: { x: 1,  y:  0 },
  w:          { x: 0,  y: -1 },
  s:          { x: 0,  y:  1 },
  a:          { x: -1, y:  0 },
  d:          { x: 1,  y:  0 },
};

document.addEventListener('keydown', (e) => {
  // Prevent page scroll on arrow keys
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
    e.preventDefault();
  }

  if (e.key === ' ') { togglePause(); return; }
  if (e.key === 'r' || e.key === 'R') { if (gameRunning || !gameRunning) startGame(); return; }

  const nd = keyMap[e.key];
  if (!nd) return;
  // Prevent reversing direction
  if (nd.x === -dir.x && nd.y === -dir.y) return;
  nextDir = nd;
});

// ===== Button =====
startBtn.addEventListener('click', startGame);

// ===== Initial render (show title screen) =====
draw();
