'use strict';

// ===== ミニゲーム管理 =====
let mgType = null;
let mgTimerRaf = null;
let mgTimerStart = null;
let mgTimerDuration = 0;
let mgCleanup = null;
let mgFinished = false;

const MG_TITLES = {
  food:     '🍯 ごはんをあげよう',
  clean:    '🛁 おふろにいれよう',
  sleep:    '💤 おやすみしよう',
  play:     '🎵 あそぼう！',
  medicine: '🩹 おくすりをぬろう',
};

function startMinigame(type) {
  mgType     = type;
  mgFinished = false;

  const overlay = document.getElementById('mg-overlay');
  const title   = document.getElementById('mg-title');
  const stage   = document.getElementById('mg-stage');
  const hint    = document.getElementById('mg-hint');
  const skipBtn = document.getElementById('mg-skip-btn');
  const timerBar = document.getElementById('mg-timer-bar');

  if (!overlay || !stage) return;

  title.textContent   = MG_TITLES[type] || type;
  stage.innerHTML     = '';
  hint.textContent    = '';
  timerBar.style.width = '100%';

  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  skipBtn.onclick = () => finishMinigame(type, 0);

  const INITS = {
    food:     initFoodGame,
    clean:    initBathGame,
    sleep:    initSleepGame,
    play:     initPlayGame,
    medicine: initMedicineGame,
  };
  (INITS[type] || (() => finishMinigame(type, 0)))(stage, hint);
}

function finishMinigame(type, score) {
  if (mgFinished) return;
  mgFinished = true;

  if (mgTimerRaf)    { cancelAnimationFrame(mgTimerRaf); mgTimerRaf = null; }
  if (mgCleanup)     { mgCleanup(); mgCleanup = null; }

  // 成功エフェクト表示から少し後にオーバーレイを閉じる
  const stage = document.getElementById('mg-stage');
  if (stage && score > 0) {
    const success = document.createElement('div');
    success.className = 'mg-success-overlay';
    success.innerHTML = '<div class="mg-success-text">やったー！⭐</div>';
    stage.appendChild(success);
  }

  setTimeout(() => {
    const overlay = document.getElementById('mg-overlay');
    if (overlay) overlay.classList.add('hidden');
    document.body.style.overflow = '';
    if (typeof applyMinigameReward === 'function') {
      applyMinigameReward(type, score);
    }
  }, score > 0 ? 900 : 200);
}

function startTimer(durationMs, onTick, onExpire) {
  mgTimerStart    = performance.now();
  mgTimerDuration = durationMs;

  function tick(now) {
    if (mgFinished) return;
    const elapsed = now - mgTimerStart;
    const pct     = Math.max(0, 1 - elapsed / durationMs);
    const bar     = document.getElementById('mg-timer-bar');
    if (bar) bar.style.width = (pct * 100) + '%';
    if (onTick) onTick(elapsed);
    if (elapsed >= durationMs) { onExpire(); return; }
    mgTimerRaf = requestAnimationFrame(tick);
  }
  mgTimerRaf = requestAnimationFrame(tick);
}

function rectsOverlap(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

// ===== ごはんミニゲーム =====
function initFoodGame(stage, hint) {
  hint.textContent = 'スプーンをくまのくちまでもっていってね🥄';

  stage.innerHTML = `
    <div class="mg-food-scene" id="food-scene">
      <div class="mg-bear-face-area" id="food-bear-area">
        <svg viewBox="0 0 160 150" width="160" height="150">
          <!-- 耳 -->
          <circle cx="40" cy="52" r="16" fill="#C8885A"/>
          <circle cx="40" cy="52" r="9"  fill="#E5AC7A"/>
          <circle cx="120" cy="52" r="16" fill="#C8885A"/>
          <circle cx="120" cy="52" r="9"  fill="#E5AC7A"/>
          <!-- 頭 -->
          <circle cx="80" cy="75" r="42" fill="#C8885A"/>
          <ellipse cx="80" cy="88" rx="24" ry="18" fill="#E5AC7A"/>
          <!-- 目 -->
          <circle cx="65" cy="68" r="6" fill="#3E2000"/>
          <circle cx="95" cy="68" r="6" fill="#3E2000"/>
          <circle cx="67" cy="66" r="2" fill="white"/>
          <circle cx="97" cy="66" r="2" fill="white"/>
          <!-- 鼻 -->
          <ellipse cx="80" cy="82" rx="6" ry="4" fill="#3E2000"/>
          <!-- 口（開いている） -->
          <path id="food-bear-mouth" d="M70 92 Q80 98 90 92" stroke="#3E2000" stroke-width="2" fill="none" stroke-linecap="round"/>
          <ellipse id="food-mouth-open" cx="80" cy="97" rx="10" ry="0" fill="#CC4444" opacity="0"/>
        </svg>
        <!-- ゴールゾーン -->
        <div class="mg-goal-ring" id="food-goal"></div>
      </div>
      <div class="mg-spoon-zone">
        <div id="food-spoon" class="mg-spoon" style="touch-action:none">🥄</div>
      </div>
    </div>
  `;

  const spoon   = document.getElementById('food-spoon');
  const goal    = document.getElementById('food-goal');
  const mouth   = document.getElementById('food-bear-mouth');
  const mouthOpen = document.getElementById('food-mouth-open');
  const foodScene = document.getElementById('food-scene');

  let dragging = false, offsetX = 0, offsetY = 0;
  let spoonX = 0, spoonY = 0;

  spoon.addEventListener('pointerdown', e => {
    e.preventDefault();
    spoon.setPointerCapture(e.pointerId);
    dragging = true;
    const r = spoon.getBoundingClientRect();
    offsetX = e.clientX - r.left - r.width / 2;
    offsetY = e.clientY - r.top  - r.height / 2;
  });

  spoon.addEventListener('pointermove', e => {
    if (!dragging) return;
    e.preventDefault();
    const pr = foodScene.getBoundingClientRect();
    spoonX = e.clientX - pr.left - 30 - offsetX;
    spoonY = e.clientY - pr.top  - 30 - offsetY;
    spoon.style.transform = `translate(${spoonX}px, ${spoonY}px)`;

    // ゴール判定
    const sr = spoon.getBoundingClientRect();
    const gr = goal.getBoundingClientRect();
    const hit = rectsOverlap(sr, gr);
    goal.classList.toggle('hit', hit);

    // 口を開く (近づくとopen)
    const dist = Math.hypot(sr.left + 30 - (gr.left + gr.width/2), sr.top + 30 - (gr.top + gr.height/2));
    const openRy = Math.max(0, Math.min(8, (80 - dist) / 10));
    if (mouthOpen) mouthOpen.setAttribute('ry', openRy);
    if (mouthOpen) mouthOpen.setAttribute('opacity', openRy > 0 ? '1' : '0');
    if (mouth && openRy > 4) mouth.setAttribute('opacity', '0');
    else if (mouth) mouth.setAttribute('opacity', '1');
  });

  spoon.addEventListener('pointerup', e => {
    if (!dragging) return;
    dragging = false;
    const sr = spoon.getBoundingClientRect();
    const gr = goal.getBoundingClientRect();
    if (rectsOverlap(sr, gr)) {
      spoon.style.transition = 'transform 0.3s';
      spoon.style.transform  = `translate(${spoonX - 10}px, ${spoonY - 20}px) scale(0)`;
      setTimeout(() => finishMinigame('food', 1), 300);
    }
  });

  startTimer(12000, null, () => {
    hint.textContent = 'もういちどやってみよう！';
    // タイムアップでも優しく終了
    setTimeout(() => finishMinigame('food', 0), 800);
  });
}

// ===== おふろミニゲーム =====
function initBathGame(stage, hint) {
  hint.textContent = 'くまのからだをぐるぐるこすってね🧽';

  const GRID = 10;
  const SIZE = 220;
  const touched = new Set();
  let validCount = 0;

  // 有効セル（楕円型ベアシルエット）
  const validCells = new Set();
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const nx = (i + 0.5) / GRID - 0.5;  // -0.5..0.5
      const ny = (j + 0.5) / GRID - 0.5;
      if (nx*nx/0.20 + ny*ny/0.22 < 1) {
        const key = `${i},${j}`;
        validCells.add(key);
        validCount++;
      }
    }
  }

  stage.innerHTML = `
    <div class="mg-bath-container">
      <div class="mg-bath-display" style="position:relative;width:${SIZE}px;height:${SIZE}px;">
        <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 200 200" style="position:absolute;top:0;left:0">
          <!-- くまの体 -->
          <circle cx="100" cy="65" r="42" fill="#C8885A"/>
          <ellipse cx="100" cy="78" rx="24" ry="18" fill="#E5AC7A"/>
          <circle cx="64" cy="40" r="16" fill="#C8885A"/>
          <circle cx="136" cy="40" r="16" fill="#C8885A"/>
          <ellipse cx="100" cy="145" rx="50" ry="44" fill="#C8885A"/>
          <ellipse cx="100" cy="150" rx="28" ry="26" fill="#E5AC7A"/>
          <!-- 目・鼻 -->
          <circle cx="88" cy="60" r="5.5" fill="#3E2000"/>
          <circle cx="112" cy="60" r="5.5" fill="#3E2000"/>
          <ellipse cx="100" cy="74" rx="5.5" ry="4" fill="#3E2000"/>
          <path d="M90 82 Q100 88 110 82" stroke="#3E2000" stroke-width="2" fill="none" stroke-linecap="round"/>
          <!-- 湯船 -->
          <rect x="10" y="175" width="180" height="25" rx="10" fill="#89CFF0" opacity="0.6"/>
          <ellipse cx="100" cy="175" rx="90" ry="12" fill="#B0E0FF" opacity="0.5"/>
        </svg>
        <canvas id="bath-canvas" width="${SIZE}" height="${SIZE}"
          style="position:absolute;top:0;left:0;border-radius:12px;touch-action:none;cursor:none;"></canvas>
      </div>
      <div class="mg-bath-meter">
        <div class="mg-bath-meter-fill" id="bath-fill" style="width:0%"></div>
        <span id="bath-pct">0%</span>
      </div>
    </div>
  `;

  const canvas = document.getElementById('bath-canvas');
  const ctx    = canvas.getContext('2d');
  let isDrawing = false;

  function getBubblePos(e) {
    const rect  = canvas.getBoundingClientRect();
    const scaleX = SIZE / rect.width;
    const scaleY = SIZE / rect.height;
    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY];
  }

  function drawBubble(x, y) {
    // バブルエフェクト描画
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120, 210, 255, 0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 240, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 小さなシャボン玉
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(x + (Math.random()-0.5)*20, y + (Math.random()-0.5)*20, 4, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(200, 240, 255, 0.4)';
      ctx.fill();
    }

    // グリッドセル計算
    const gi = Math.floor(x / SIZE * GRID);
    const gj = Math.floor(y / SIZE * GRID);
    const key = `${gi},${gj}`;
    if (validCells.has(key) && !touched.has(key)) {
      touched.add(key);
      const pct = Math.round(touched.size / validCount * 100);
      const fill = document.getElementById('bath-fill');
      const pctEl = document.getElementById('bath-pct');
      if (fill) fill.style.width = pct + '%';
      if (pctEl) pctEl.textContent = pct + '%';
      if (pct >= 65 && !mgFinished) {
        setTimeout(() => finishMinigame('clean', 1), 400);
      }
    }
  }

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    isDrawing = true;
    drawBubble(...getBubblePos(e));
  });
  canvas.addEventListener('pointermove', e => {
    if (!isDrawing) return;
    e.preventDefault();
    drawBubble(...getBubblePos(e));
  });
  canvas.addEventListener('pointerup',   () => { isDrawing = false; });
  canvas.addEventListener('pointerout',  () => { isDrawing = false; });

  mgCleanup = () => { isDrawing = false; };

  startTimer(20000, null, () => {
    const pct = Math.round(touched.size / validCount * 100);
    finishMinigame('clean', pct >= 40 ? 0.5 : 0);
  });
}

// ===== おやすみミニゲーム =====
function initSleepGame(stage, hint) {
  hint.textContent = 'おつきさまをそーっとおしてね…🌙';

  stage.innerHTML = `
    <div class="mg-sleep-scene" id="sleep-scene"
         style="background:linear-gradient(180deg,#0d0d2b,#1a1a4a,#0a0a20);width:100%;height:100%;border-radius:12px;">
      <div class="mg-sleep-stars" id="sleep-stars"></div>
      <div id="sleep-press" class="mg-sleep-press-area" style="touch-action:none">
        🌙
      </div>
      <div id="sleep-result" style="font-size:28px;color:white;font-weight:700;height:36px;text-align:center;"></div>
    </div>
  `;

  // 星を散りばめる
  const starContainer = document.getElementById('sleep-stars');
  for (let i = 0; i < 20; i++) {
    const star = document.createElement('div');
    star.style.cssText = `
      position:absolute;color:white;font-size:${8+Math.random()*10}px;
      left:${Math.random()*90+5}%;top:${Math.random()*80+5}%;
      animation:twinkle ${1+Math.random()*2}s ease-in-out ${Math.random()*2}s infinite;
      opacity:0.5;
    `;
    star.textContent = '★';
    starContainer.appendChild(star);
  }

  const pressArea = document.getElementById('sleep-press');
  const resultEl  = document.getElementById('sleep-result');
  let pressStart = 0;
  let surprises  = 0;

  pressArea.addEventListener('pointerdown', e => {
    e.preventDefault();
    pressArea.setPointerCapture(e.pointerId);
    pressArea.classList.add('pressing');
    pressStart = performance.now();
  });

  pressArea.addEventListener('pointerup', e => {
    e.preventDefault();
    pressArea.classList.remove('pressing');
    if (!pressStart) return;
    const duration = performance.now() - pressStart;
    pressStart = 0;

    const threshold = surprises >= 2 ? 200 : 320; // 失敗2回以上は優しく

    if (duration >= threshold) {
      spawnZzz(pressArea);
      resultEl.textContent = 'ぐっすり〜 💤';
      setTimeout(() => finishMinigame('sleep', 1), 700);
    } else if (duration < 150) {
      surprises++;
      pressArea.textContent = '😱';
      resultEl.textContent = `びっくり！もっとゆっくり… (${surprises}/3)`;
      setTimeout(() => {
        pressArea.textContent = '🌙';
        resultEl.textContent = '';
        if (surprises >= 3) {
          hint.textContent = 'もっとゆっくりおしてね、ながくね…';
        }
      }, 800);
    } else {
      resultEl.textContent = 'もうちょっと ながくおしてね…';
      setTimeout(() => { resultEl.textContent = ''; }, 800);
    }
  });

  startTimer(15000, null, () => {
    finishMinigame('sleep', surprises <= 1 ? 0.5 : 0);
  });
}

function spawnZzz(parent) {
  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      const z = document.createElement('div');
      z.className = 'zzz';
      z.textContent = ['z','Z','Z','💤'][i];
      z.style.cssText = `
        left:${40+i*15}px; bottom:${60+i*30}px;
        font-size:${16+i*8}px;
      `;
      parent.parentElement.appendChild(z);
      setTimeout(() => z.remove(), 2000);
    }, i * 200);
  }
}

// ===== あそぶミニゲーム =====
function initPlayGame(stage, hint) {
  hint.textContent = 'とびだすものをタップしてね！🎵';

  stage.innerHTML = `
    <div class="mg-play-scene" id="play-scene">
      <div class="mg-score-display" id="play-score">0 / 10こ</div>
    </div>
  `;

  const scene    = document.getElementById('play-scene');
  const scoreEl  = document.getElementById('play-score');
  const ITEMS    = ['🫧','🎈','⭐','🍭','🌟','🎵','💖','🏀'];
  let score      = 0;
  let combo      = 0;
  let lastCatch  = 0;
  let active     = [];
  let spawnTimer = null;
  let rafId      = null;
  let gameOver   = false;

  function spawnItem() {
    if (gameOver) return;
    const rect = scene.getBoundingClientRect();
    const w    = rect.width  || 300;
    const h    = rect.height || 300;
    const el   = document.createElement('div');
    el.className = 'mg-bubble';
    el.textContent = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    const x    = 20 + Math.random() * (w - 80);
    const vy   = 0.8 + Math.random() * 1.2;
    let   y    = -50;
    el.style.left = x + 'px';
    el.style.top  = y + 'px';

    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (el.classList.contains('popped')) return;
      el.classList.add('popped');

      score++;
      const now   = performance.now();
      const rapid = now - lastCatch < 600;
      lastCatch   = now;
      combo       = rapid ? combo + 1 : 1;

      if (combo >= 3) {
        const comboEl = document.createElement('div');
        comboEl.className = 'mg-combo';
        comboEl.textContent = `${combo}COMBO! ×2`;
        comboEl.style.left = (x + 20) + 'px';
        comboEl.style.top  = y + 'px';
        scene.appendChild(comboEl);
        score++; // ボーナス
        setTimeout(() => comboEl.remove(), 800);
      }

      scoreEl.textContent = `${Math.min(score, 99)} / 10こ`;
      setTimeout(() => {
        el.remove();
        active = active.filter(a => a !== item);
      }, 300);
    });

    const item = { el, y, vy };
    active.push(item);
    scene.appendChild(el);
  }

  function gameLoop() {
    if (gameOver) return;
    const rect = scene.getBoundingClientRect();
    const h    = rect.height || 300;
    active = active.filter(item => {
      if (!item.el.parentElement) return false;
      item.y += item.vy;
      if (item.y > h + 20) {
        item.el.remove();
        return false;
      }
      item.el.style.top = item.y + 'px';
      return true;
    });
    rafId = requestAnimationFrame(gameLoop);
  }

  spawnTimer = setInterval(() => { if (!gameOver) spawnItem(); }, 700);
  rafId = requestAnimationFrame(gameLoop);

  mgCleanup = () => {
    gameOver = true;
    clearInterval(spawnTimer);
    if (rafId) cancelAnimationFrame(rafId);
    active.forEach(i => i.el.remove());
    active = [];
  };

  startTimer(10000, null, () => {
    gameOver = true;
    clearInterval(spawnTimer);
    if (rafId) cancelAnimationFrame(rafId);
    const finalScore = score >= 8 ? 2 : score >= 4 ? 1 : 0.3;
    finishMinigame('play', finalScore);
  });
}

// ===== おくすりミニゲーム =====
function initMedicineGame(stage, hint) {
  hint.textContent = 'ばんそうこうをきずにはってあげよう🩹';

  // 3か所のキズの位置（SVG viewBox=160x190基準）
  const SPOTS = [
    { id: 'spot0', svgX: 74,  svgY: 65  },  // 額
    { id: 'spot1', svgX: 32,  svgY: 140 },  // 左腕
    { id: 'spot2', svgX: 100, svgY: 155 },  // おなか
  ];
  let healed = 0;

  stage.innerHTML = `
    <div class="mg-medicine-scene" id="med-scene">
      <div class="mg-bear-medical" id="med-bear">
        <svg viewBox="0 0 160 190" width="160" height="190" overflow="visible">
          <!-- 体 -->
          <ellipse cx="80" cy="145" rx="50" ry="44" fill="#C8885A"/>
          <ellipse cx="80" cy="150" rx="28" ry="26" fill="#E5AC7A"/>
          <!-- 耳 -->
          <circle cx="38" cy="46" r="16" fill="#C8885A"/>
          <circle cx="38" cy="46" r="9"  fill="#E5AC7A"/>
          <circle cx="122" cy="46" r="16" fill="#C8885A"/>
          <circle cx="122" cy="46" r="9"  fill="#E5AC7A"/>
          <!-- 頭 -->
          <circle cx="80" cy="70" r="42" fill="#C8885A"/>
          <ellipse cx="80" cy="83" rx="24" ry="18" fill="#E5AC7A"/>
          <!-- 目（びょうきかお） -->
          <path d="M65 63 L71 69 M71 63 L65 69" stroke="#3E2000" stroke-width="3" stroke-linecap="round"/>
          <path d="M89 63 L95 69 M95 63 L89 69" stroke="#3E2000" stroke-width="3" stroke-linecap="round"/>
          <ellipse cx="80" cy="79" rx="6" ry="4" fill="#3E2000"/>
          <path d="M70 90 Q80 84 90 90" stroke="#3E2000" stroke-width="2" fill="none" stroke-linecap="round"/>
          <!-- 腕 -->
          <ellipse cx="30" cy="138" rx="13" ry="28" fill="#C8885A" transform="rotate(-15 30 138)"/>
          <ellipse cx="130" cy="138" rx="13" ry="28" fill="#C8885A" transform="rotate(15 130 138)"/>
          <!-- 足 -->
          <ellipse cx="60" cy="186" rx="17" ry="10" fill="#C8885A"/>
          <ellipse cx="100" cy="186" rx="17" ry="10" fill="#C8885A"/>
        </svg>
        <!-- キズスポット（絶対配置） -->
        ${SPOTS.map(s =>
          `<div id="${s.id}" class="mg-bandage-spot"
            style="left:${s.svgX - 18}px;top:${s.svgY - 18}px;position:absolute;"></div>`
        ).join('')}
      </div>
      <div class="mg-spoon-zone">
        <div id="med-bandage" class="mg-bandage" style="touch-action:none">🩹</div>
      </div>
    </div>
  `;

  const bandage = document.getElementById('med-bandage');
  const medScene = document.getElementById('med-scene');
  const bearDiv  = document.getElementById('med-bear');

  let dragging = false, offsetX = 0, offsetY = 0;
  let bandX = 0, bandY = 0;

  bandage.addEventListener('pointerdown', e => {
    e.preventDefault();
    bandage.setPointerCapture(e.pointerId);
    dragging = true;
    const r = bandage.getBoundingClientRect();
    offsetX = e.clientX - r.left - r.width / 2;
    offsetY = e.clientY - r.top  - r.height / 2;
  });

  bandage.addEventListener('pointermove', e => {
    if (!dragging) return;
    e.preventDefault();
    const pr = medScene.getBoundingClientRect();
    bandX = e.clientX - pr.left - 26 - offsetX;
    bandY = e.clientY - pr.top  - 26 - offsetY;
    bandage.style.transform = `translate(${bandX}px, ${bandY}px)`;

    // いずれかのスポットに重なっているかチェック
    SPOTS.forEach(s => {
      if (!document.getElementById(s.id)) return;
      const spot = document.getElementById(s.id);
      if (spot.classList.contains('healed')) return;
      const br = bandage.getBoundingClientRect();
      const sr = spot.getBoundingClientRect();
      spot.style.borderColor = rectsOverlap(br, sr) ? 'rgba(100,200,100,0.9)' : '';
    });
  });

  bandage.addEventListener('pointerup', e => {
    if (!dragging) return;
    dragging = false;
    const br = bandage.getBoundingClientRect();

    SPOTS.forEach(s => {
      const spot = document.getElementById(s.id);
      if (!spot || spot.classList.contains('healed')) return;
      const sr = spot.getBoundingClientRect();
      if (rectsOverlap(br, sr)) {
        spot.classList.add('healed');
        spot.textContent = '🩹';
        spot.style.fontSize = '22px';
        spot.style.display  = 'flex';
        spot.style.alignItems = 'center';
        spot.style.justifyContent = 'center';
        healed++;

        if (healed >= SPOTS.length) {
          setTimeout(() => finishMinigame('medicine', 1), 300);
        } else {
          // バンドを戻してリセット
          bandage.style.transition = 'transform 0.3s';
          bandage.style.transform  = '';
          bandX = 0; bandY = 0;
          setTimeout(() => { bandage.style.transition = ''; }, 300);
        }
      }
    });
  });

  startTimer(18000, null, () => {
    finishMinigame('medicine', healed > 0 ? 0.5 : 0);
  });
}
