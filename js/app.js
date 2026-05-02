'use strict';

// ===== 定数 =====
const SAVE_KEY_V1 = 'teddy_save_v1';
const SAVE_KEY    = 'teddy_save_v2';
const DIARY_MAX   = 50;
const GAUGE_DECAY_MS = 60000;

// ===== シーンデータ =====
const SCENES = {
  room:    { name: 'おへや',   emoji: '🏠', unlockStars: 0,  bgClass: 's-room',    desc: 'いつものおへや' },
  park:    { name: 'こうえん', emoji: '🌳', unlockStars: 5,  bgClass: 's-park',    desc: 'そとであそぼう' },
  bath:    { name: 'おふろば', emoji: '🛁', unlockStars: 10, bgClass: 's-bath',    desc: 'きれいになろう' },
  kitchen: { name: 'キッチン', emoji: '🍳', unlockStars: 20, bgClass: 's-kitchen', desc: 'いっしょにりょうり' },
  season:  { name: 'きせつ',   emoji: '🌸', unlockStars: 30, bgClass: 's-season',  desc: 'きせつのおまつり' },
  beach:   { name: 'うみ',     emoji: '🏖️', unlockStars: 50, bgClass: 's-beach',  desc: 'なみとあそぼう' },
};

// ===== 季節イベント =====
const SEASON_EVENTS = {
  1:  { name: 'おしょうがつ', items: ['🎍','🎋','⛩️','🎎'], bg: '#FFF5E0' },
  2:  { name: 'バレンタイン', items: ['💝','🍫','💕','🌹'], bg: '#FFE0EE' },
  3:  { name: 'おはなみ',     items: ['🌸','🌸','🌺','🌷'], bg: '#FFD6E8' },
  4:  { name: 'はる',         items: ['🌼','🦋','🌻','🐝'], bg: '#EEFFD6' },
  5:  { name: 'こどもの日',   items: ['🎏','🎠','🌈','⛩️'], bg: '#D6F0FF' },
  6:  { name: 'あめのひ',     items: ['☂️','🐸','🌧️','🌈'], bg: '#D6E8FF' },
  7:  { name: 'なつまつり',   items: ['🎆','🎇','🏮','🍉'], bg: '#FFE8D6' },
  8:  { name: 'なつ',         items: ['🍧','🌊','🏄','☀️'], bg: '#FFF3D6' },
  9:  { name: 'おつきみ',     items: ['🌕','🍡','🐰','🍁'], bg: '#EEE8D6' },
  10: { name: 'ハロウィン',   items: ['🎃','🦇','🕷️','👻'], bg: '#FFE8C8' },
  11: { name: 'あき',         items: ['🍁','🍂','🌰','🦔'], bg: '#FFEEDD' },
  12: { name: 'クリスマス',   items: ['🎄','⛄','🎁','🔔'], bg: '#E0F5E0' },
};

// ===== 成長段階 =====
const GROWTH = {
  baby:   { stars: 0,   next: 30,  scale: 0.85, name: 'あかちゃん', icon: '🐣' },
  normal: { stars: 30,  next: 100, scale: 1.0,  name: 'こども',     icon: '🧸' },
  big:    { stars: 100, next: 999, scale: 1.15, name: 'おとな',     icon: '🌟' },
};

// ===== コレクションアイテム =====
const COLL_ITEMS = {
  room:    ['🧸','📚','🎀','🌟','🎵'],
  park:    ['🌰','🍂','🌸','🦋','🌻','🍄'],
  kitchen: ['🍰','🍪','🍩','🎂','🍡'],
  beach:   ['🐚','⭐','🦀','🐠','💎'],
};

// ===== 表情データ =====
const EXPRESSIONS = {
  normal:  { mouth: 'M93 110 Q100 117 107 110', cheeks: 0.0, eyes: 'open'    },
  happy:   { mouth: 'M88 108 Q100 123 112 108', cheeks: 0.5, eyes: 'crescent' },
  sleepy:  { mouth: 'M97 112 Q100 115 103 112', cheeks: 0.0, eyes: 'half'    },
  hungry:  { mouth: 'M90 113 Q100 108 110 113', cheeks: 0.0, eyes: 'droopy'  },
  sick:    { mouth: 'M90 115 Q100 110 110 115', cheeks: 0.0, eyes: 'x'       },
  love:    { mouth: 'M88 108 Q100 123 112 108', cheeks: 0.8, eyes: 'heart'   },
};

// ===== 衣装データ =====
const OUTFITS = [
  { id: 'none',        category: 'all',     label: 'なし',      emoji: '❌', svg: null },
  { id: 'hat_red',     category: 'hat',     label: 'あかいぼうし', emoji: '🎩',
    svg: `<ellipse cx="100" cy="65" rx="36" ry="8" fill="#CC3333"/>
          <rect x="72" y="34" width="56" height="32" rx="8" fill="#CC3333"/>
          <ellipse cx="100" cy="34" rx="20" ry="6" fill="#AA2222"/>` },
  { id: 'hat_flower',  category: 'hat',     label: 'おはなぼうし', emoji: '🌸',
    svg: `<ellipse cx="100" cy="65" rx="36" ry="8" fill="#FFB7C5"/>
          <rect x="72" y="34" width="56" height="32" rx="8" fill="#FFB7C5"/>
          <circle cx="100" cy="34" r="12" fill="#FF6B9D"/>
          <circle cx="86" cy="30" r="7" fill="#FF6B9D"/>
          <circle cx="114" cy="30" r="7" fill="#FF6B9D"/>
          <circle cx="100" cy="30" r="6" fill="#FFD700"/>` },
  { id: 'hat_crown',   category: 'hat',     label: 'おうかん',    emoji: '👑',
    svg: `<path d="M70 70 L80 44 L100 58 L120 44 L130 70 Z" fill="#FFD700"/>
          <circle cx="80" cy="44" r="5" fill="#FF4444"/>
          <circle cx="100" cy="58" r="5" fill="#44AAFF"/>
          <circle cx="120" cy="44" r="5" fill="#FF44FF"/>` },
  { id: 'ribbon_red',  category: 'ribbon',  label: 'あかリボン',  emoji: '🎀',
    svg: `<path d="M72 76 Q83 68 90 76 Q83 84 72 76Z" fill="#FF3366"/>
          <path d="M128 76 Q117 68 110 76 Q117 84 128 76Z" fill="#FF3366"/>
          <circle cx="100" cy="76" r="7" fill="#CC0044"/>` },
  { id: 'ribbon_blue', category: 'ribbon',  label: 'あおリボン',  emoji: '💙',
    svg: `<path d="M72 76 Q83 68 90 76 Q83 84 72 76Z" fill="#3399FF"/>
          <path d="M128 76 Q117 68 110 76 Q117 84 128 76Z" fill="#3399FF"/>
          <circle cx="100" cy="76" r="7" fill="#0055CC"/>` },
  { id: 'ribbon_star', category: 'ribbon',  label: 'ほしリボン',  emoji: '⭐',
    svg: `<path d="M72 76 Q83 68 90 76 Q83 84 72 76Z" fill="#FFD700"/>
          <path d="M128 76 Q117 68 110 76 Q117 84 128 76Z" fill="#FFD700"/>
          <circle cx="100" cy="76" r="7" fill="#FFA500"/>` },
  { id: 'clothes_pink',category: 'clothes', label: 'ぴんくふく',  emoji: '👗',
    svg: `<path d="M60 145 Q75 130 100 128 Q125 130 140 145 L148 200 Q100 210 52 200Z" fill="#FFB7C5"/>
          <path d="M60 145 Q70 138 80 145" stroke="#FF6B9D" stroke-width="2" fill="none"/>
          <path d="M120 145 Q130 138 140 145" stroke="#FF6B9D" stroke-width="2" fill="none"/>` },
  { id: 'clothes_blue',category: 'clothes', label: 'あおふく',    emoji: '👕',
    svg: `<path d="M60 145 Q75 130 100 128 Q125 130 140 145 L148 200 Q100 210 52 200Z" fill="#87CEEB"/>
          <path d="M80 128 L75 145 M120 128 L125 145" stroke="#5AA0D0" stroke-width="2"/>` },
  { id: 'muffler',     category: 'acc',     label: 'マフラー',   emoji: '🧣',
    svg: `<path d="M65 128 Q100 118 135 128 Q138 136 135 140 Q100 130 65 140 Q62 136 65 128Z" fill="#FF6633"/>
          <rect x="130" y="128" width="16" height="30" rx="5" fill="#FF6633"/>` },
];

// ===== デフォルト状態 =====
const DEFAULT_STATE = {
  version: 2,
  bearName: 'ぽんた',
  gauges: { food: 75, clean: 50, sleep: 70, happy: 90 },
  outfit: { hat: null, ribbon: null, clothes: null, acc: null },
  skinTone: '#F5C5A3',
  diary: [],
  lastSaved: null,
  stars: 0,
  growthStage: 'baby',
  currentScene: 'room',
  unlockedScenes: ['room'],
  collections: { room: [], park: [], kitchen: [], beach: [] },
  loginStreak: 0,
  lastLoginDate: null,
  unlockedItems: [],
};

let state = JSON.parse(JSON.stringify(DEFAULT_STATE));
let currentExpression = 'normal';
let expressionTimer = null;
let decayTimer = null;

// ===== 初期化 =====
function init() {
  loadState();
  checkLoginStreak();
  renderAll();
  updateHandSkin();
  applyScene(state.currentScene, false);
  updateTimeOfDay();
  startGaugeDecay();
  setInterval(updateTimeOfDay, 60000);
  registerServiceWorker();
}

// ===== セーブ・ロード =====
function saveState() {
  state.lastSaved = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  const el = document.getElementById('save-time');
  if (el) {
    const d = new Date(state.lastSaved);
    el.textContent = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
}

function loadState() {
  // v2を試みる
  let raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      mergeState(saved);
      showToast(`おかえり！${state.bearName}がまってたよ💕`);
      return;
    } catch(e) { /* fallthrough */ }
  }
  // v1マイグレーション
  raw = localStorage.getItem(SAVE_KEY_V1);
  if (raw) {
    try {
      const v1 = JSON.parse(raw);
      mergeState(migrateV1(v1));
      saveState();
      localStorage.removeItem(SAVE_KEY_V1);
      showToast('セーブデータをアップグレードしたよ！⭐');
    } catch(e) { /* ignore */ }
  }
}

function mergeState(saved) {
  state = { ...DEFAULT_STATE, ...saved };
  state.gauges      = { ...DEFAULT_STATE.gauges,      ...saved.gauges };
  state.outfit      = { ...DEFAULT_STATE.outfit,      ...saved.outfit };
  state.collections = { ...DEFAULT_STATE.collections, ...saved.collections };
}

function migrateV1(v1) {
  return {
    ...DEFAULT_STATE,
    bearName: v1.bearName  || DEFAULT_STATE.bearName,
    gauges:   { ...DEFAULT_STATE.gauges,  ...v1.gauges  },
    outfit:   { ...DEFAULT_STATE.outfit,  ...v1.outfit  },
    skinTone: v1.skinTone  || DEFAULT_STATE.skinTone,
    diary:    v1.diary     || [],
    version: 2,
  };
}

// ===== ログインストリーク =====
function checkLoginStreak() {
  const today = new Date().toDateString();
  if (!state.lastLoginDate) {
    state.loginStreak = 1;
  } else if (state.lastLoginDate === today) {
    return; // 同日2回目
  } else {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    state.loginStreak = (state.lastLoginDate === yesterday) ? state.loginStreak + 1 : 1;
  }
  state.lastLoginDate = today;

  // ログインボーナス
  const bonus = Math.min(state.loginStreak * 2, 20);
  awardStars(bonus);
  if (state.loginStreak > 1) showToast(`🔥 ${state.loginStreak}にちれんぞく！ ⭐+${bonus}`);
  saveState();
}

// ===== レンダリング =====
function renderAll() {
  renderGauges();
  renderBearName();
  renderOutfitSVG('bear-svg');
  renderOutfitSVG('outfit-preview-svg');
  renderOutfitGrid();
  renderDiary();
  renderCollection();
  renderSettings();
  updateSpeech();
  updateExpression(true);
  updateStarDisplay();
  updateGrowthDisplay();
}

function renderBearName() {
  const h = document.getElementById('bear-name-header');
  if (h) h.textContent = state.bearName;
  const i = document.getElementById('input-bear-name');
  if (i) i.value = state.bearName;
}

function renderGauges() {
  const MAP = { food:'gauge-food', clean:'gauge-clean', sleep:'gauge-sleep', happy:'gauge-happy' };
  const ICO = { food:'icon-food',  clean:'icon-clean',  sleep:'icon-sleep',  happy:'icon-happy'  };
  Object.keys(state.gauges).forEach(k => {
    const val = Math.max(0, Math.min(100, state.gauges[k]));
    const bar = document.getElementById(MAP[k]);
    const ico = document.getElementById(ICO[k]);
    if (bar) bar.style.width = val + '%';
    if (ico) ico.classList.toggle('blink', val <= 20);
  });
}

function renderOutfitSVG(svgId) {
  const frontId = svgId === 'bear-svg' ? 'outfit-front' : 'outfit-front-preview';
  const backId  = svgId === 'bear-svg' ? 'outfit-back'  : 'outfit-back-preview';
  const front   = document.getElementById(frontId);
  const back    = document.getElementById(backId);
  if (!front || !back) return;
  front.innerHTML = '';
  back.innerHTML  = '';
  Object.values(state.outfit).forEach(id => {
    if (!id) return;
    const item = OUTFITS.find(o => o.id === id);
    if (!item?.svg) return;
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.innerHTML = item.svg;
    (item.category === 'clothes' ? back : front).appendChild(g);
  });
}

function renderOutfitGrid() {
  const grid = document.getElementById('outfit-grid');
  if (!grid) return;
  grid.innerHTML = '';
  OUTFITS.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'outfit-item' + (item.id === 'none' ? ' none-item' : '');
    const selected = item.id === 'none'
      ? Object.values(state.outfit).every(v => !v)
      : Object.values(state.outfit).includes(item.id);
    if (selected) btn.classList.add('selected');
    btn.innerHTML = `<span class="outfit-emoji">${item.emoji}</span><span class="outfit-label">${item.label}</span>`;
    btn.addEventListener('click', () => selectOutfit(item));
    grid.appendChild(btn);
  });
}

function renderDiary() {
  const list = document.getElementById('diary-list');
  if (!list) return;
  if (!state.diary.length) {
    list.innerHTML = '<div class="diary-empty">まだきろくがないよ<br>くまのおせわをしてみよう！</div>';
    return;
  }
  list.innerHTML = state.diary.slice(0,30).map(e =>
    `<div class="diary-entry">
       <span class="diary-time">${e.time}</span>
       <span class="diary-text">${e.text}</span>
       <span class="diary-icon">${e.icon}</span>
     </div>`
  ).join('');
}

function renderCollection() {
  const grid = document.getElementById('collection-grid');
  if (!grid) return;
  grid.innerHTML = '';
  Object.entries(COLL_ITEMS).forEach(([scene, items]) => {
    const sceneData = SCENES[scene];
    const title = document.createElement('div');
    title.className = 'collection-scene-title';
    title.textContent = `${sceneData.emoji} ${sceneData.name}`;
    grid.appendChild(title);
    items.forEach(emoji => {
      const cell = document.createElement('div');
      cell.className = 'collection-cell' + (state.collections[scene]?.includes(emoji) ? '' : ' locked');
      cell.textContent = emoji;
      grid.appendChild(cell);
    });
  });
}

function renderSettings() {
  document.querySelectorAll('.swatch').forEach(el =>
    el.classList.toggle('selected', el.dataset.skin === state.skinTone)
  );
  updateGrowthDisplay();
  const streakEl = document.getElementById('login-streak');
  if (streakEl) streakEl.textContent = state.loginStreak;
}

// ===== スター・成長 =====
function awardStars(count) {
  const oldStage = state.growthStage;
  state.stars = (state.stars || 0) + count;

  const newStage = calcGrowthStage(state.stars);
  if (newStage !== oldStage) {
    state.growthStage = newStage;
    onGrowthUp(newStage);
  }

  updateStarDisplay();
  updateGrowthDisplay();
  updateBearScale();
}

function calcGrowthStage(stars) {
  if (stars >= 100) return 'big';
  if (stars >= 30)  return 'normal';
  return 'baby';
}

function updateStarDisplay() {
  const el = document.getElementById('star-count');
  if (el) el.textContent = state.stars || 0;
}

function updateGrowthDisplay() {
  const g = GROWTH[state.growthStage] || GROWTH.baby;
  const icon = document.getElementById('growth-icon');
  const name = document.getElementById('growth-name');
  const sub  = document.getElementById('growth-sub');
  const bar  = document.getElementById('growth-bar-fill');
  if (icon) icon.textContent = g.icon;
  if (name) name.textContent = g.name;
  const isMax = state.growthStage === 'big';
  if (sub) sub.textContent = isMax ? 'さいこうのおとな！🌟' : `⭐ ${g.next}こでつぎのだんかいへ`;
  if (bar) {
    const pct = isMax ? 100 : Math.min(100, ((state.stars - g.stars) / (g.next - g.stars)) * 100);
    bar.style.width = pct + '%';
  }
}

function updateBearScale() {
  const outer = document.getElementById('bear-outer');
  if (outer) {
    const scale = GROWTH[state.growthStage]?.scale || 1.0;
    outer.style.transform = `scale(${scale})`;
  }
}

function onGrowthUp(stage) {
  const g = GROWTH[stage];
  showToast(`${g.icon} ${g.name}になったよ！おめでとう！`);
  setTimeout(() => spawnConfetti(window.innerWidth / 2, 200, 30), 200);
  setExpression('love');
}

// ===== 表情システム =====
function setExpression(name, duration = 0) {
  if (expressionTimer) { clearTimeout(expressionTimer); expressionTimer = null; }
  currentExpression = name;
  const expr = EXPRESSIONS[name] || EXPRESSIONS.normal;

  // 口
  const mouthPath = document.getElementById('bear-mouth-path');
  if (mouthPath) mouthPath.setAttribute('d', expr.mouth);

  // ほっぺ
  ['cheek-l','cheek-r'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('opacity', expr.cheeks);
  });

  // 目
  const eyes = document.getElementById('bear-eyes');
  if (eyes) eyes.innerHTML = getEyesSVG(expr.eyes);

  if (duration > 0) {
    expressionTimer = setTimeout(() => updateExpression(), duration);
  }
}

function getEyesSVG(type) {
  switch(type) {
    case 'crescent':
      return `<path d="M77 88 Q84 81 91 88 Q84 85 77 88Z" fill="#3E2000"/>
              <path d="M109 88 Q116 81 123 88 Q116 85 109 88Z" fill="#3E2000"/>`;
    case 'half':
      return `<circle cx="84" cy="88" r="7" fill="#3E2000"/>
              <circle cx="116" cy="88" r="7" fill="#3E2000"/>
              <rect x="77" y="82" width="14" height="7" fill="#C8885A"/>
              <rect x="109" y="82" width="14" height="7" fill="#C8885A"/>
              <circle cx="86" cy="91" r="2" fill="white" opacity="0.5"/>
              <circle cx="118" cy="91" r="2" fill="white" opacity="0.5"/>`;
    case 'droopy':
      return `<circle cx="84" cy="90" r="7" fill="#3E2000"/>
              <circle cx="116" cy="90" r="7" fill="#3E2000"/>
              <circle cx="86" cy="88" r="2.5" fill="white"/>
              <circle cx="118" cy="88" r="2.5" fill="white"/>
              <path d="M78 84 Q84 80 90 84" stroke="#3E2000" stroke-width="1.5" fill="none"/>
              <path d="M110 84 Q116 80 122 84" stroke="#3E2000" stroke-width="1.5" fill="none"/>`;
    case 'x':
      return `<path d="M79 83 L89 93 M89 83 L79 93" stroke="#3E2000" stroke-width="3" stroke-linecap="round"/>
              <path d="M111 83 L121 93 M121 83 L111 93" stroke="#3E2000" stroke-width="3" stroke-linecap="round"/>`;
    case 'heart':
      return `<path d="M80 87 C80 83 84 81 84 85 C84 81 88 83 88 87 C88 91 84 94 84 94 C84 94 80 91 80 87Z" fill="#FF4466"/>
              <path d="M112 87 C112 83 116 81 116 85 C116 81 120 83 120 87 C120 91 116 94 116 94 C116 94 112 91 112 87Z" fill="#FF4466"/>`;
    default: // open
      return `<circle cx="84" cy="88" r="7" fill="#3E2000"/>
              <circle cx="116" cy="88" r="7" fill="#3E2000"/>
              <circle cx="86" cy="86" r="2.5" fill="white"/>
              <circle cx="118" cy="86" r="2.5" fill="white"/>`;
  }
}

function updateExpression(force = false) {
  const vals = Object.values(state.gauges);
  const lowEntry = Object.entries(state.gauges).find(([,v]) => v <= 20);
  const sickCount = vals.filter(v => v <= 10).length;

  let expr = 'normal';
  if (sickCount >= 2)     expr = 'sick';
  else if (lowEntry) {
    if (lowEntry[0] === 'sleep') expr = 'sleepy';
    else                          expr = 'hungry';
  } else if (Math.min(...vals) > 75) {
    expr = 'happy';
  }

  if (force || (expr !== currentExpression && currentExpression === 'normal')) {
    setExpression(expr);
  }
}

// ===== シーンシステム =====
function applyScene(sceneId, animate = true) {
  const scene = SCENES[sceneId] || SCENES.room;
  const el = document.getElementById('scene');
  if (!el) return;

  if (animate) {
    const flash = document.getElementById('scene-flash');
    if (flash) {
      flash.classList.remove('hidden','flash-out');
      flash.classList.add('flash-in');
      setTimeout(() => {
        applySceneClasses(el, scene, sceneId);
        flash.classList.remove('flash-in');
        flash.classList.add('flash-out');
        setTimeout(() => flash.classList.add('hidden'), 300);
      }, 280);
    }
  } else {
    applySceneClasses(el, scene, sceneId);
  }
}

function applySceneClasses(el, scene, sceneId) {
  // 既存シーンクラス除去
  Object.values(SCENES).forEach(s => el.classList.remove(s.bgClass));
  el.classList.add(scene.bgClass);

  // シーン装飾
  renderSceneDecor(sceneId);
  // 夜のシーンデコも更新
  updateTimeOfDay();
  // コレクタブル
  if (['park','kitchen','beach'].includes(sceneId)) {
    setTimeout(() => spawnCollectibles(sceneId), 400);
  } else {
    const c = document.getElementById('collectibles');
    if (c) c.innerHTML = '';
  }
}

function renderSceneDecor(sceneId) {
  const decor = document.getElementById('scene-decor');
  if (!decor) return;
  decor.innerHTML = '';

  const props = {
    park:    [['🌳',5,20],['🌳',75,15],['🌻',40,70],['☁️',25,5],['☁️',65,3]],
    bath:    [['🫧',10,20],['🫧',80,40],['🫧',50,10],['🚿',70,60]],
    kitchen: [['🍳',5,60],['🧁',75,55],['☕',15,20],['🌿',60,10]],
    beach:   [['🌊',0,65],['🌊',40,72],['☀️',70,5],['🦀',15,70]],
    season:  [],
  };

  const month = new Date().getMonth() + 1;
  if (sceneId === 'season') {
    const ev = SEASON_EVENTS[month] || SEASON_EVENTS[3];
    ev.items.forEach((emoji, i) => {
      props.season.push([emoji, 10 + i * 22, 10 + (i % 2) * 20]);
    });
  }

  (props[sceneId] || []).forEach(([emoji, x, y]) => {
    const el = document.createElement('div');
    el.className = 'scene-decor-item';
    el.textContent = emoji;
    el.style.cssText = `left:${x}%;top:${y}%;animation-delay:${Math.random()}s`;
    decor.appendChild(el);
  });
}

function spawnCollectibles(sceneId) {
  const container = document.getElementById('collectibles');
  if (!container) return;
  container.innerHTML = '';

  const items = COLL_ITEMS[sceneId] || [];
  const collected = state.collections[sceneId] || [];
  const uncollected = items.filter(i => !collected.includes(i));

  // 未収集アイテムを最大2個表示
  const toShow = uncollected.slice(0, 2);
  toShow.forEach((emoji, i) => {
    const el = document.createElement('div');
    el.className = 'collectible-item';
    el.textContent = emoji;
    el.style.cssText = `left:${15 + i * 55}%;bottom:30px;animation-delay:${i * 0.3}s`;
    el.addEventListener('click', () => onCollectItem(emoji, sceneId, el));
    container.appendChild(el);
  });
}

function onCollectItem(emoji, sceneId, el) {
  if (!state.collections[sceneId]) state.collections[sceneId] = [];
  if (state.collections[sceneId].includes(emoji)) return;

  el.classList.add('collected');
  state.collections[sceneId].push(emoji);
  awardStars(1);
  addDiaryEntry(`${emoji}をみつけたよ！`, '🗃️');
  showToast(`${emoji} ゲット！⭐+1`);
  saveState();
  renderCollection();

  setTimeout(() => {
    el.remove();
    spawnCollectibles(sceneId);
  }, 400);
}

function openSceneModal() {
  const list = document.getElementById('scene-list');
  if (!list) return;
  list.innerHTML = '';

  Object.entries(SCENES).forEach(([id, scene]) => {
    const unlocked = state.unlockedScenes.includes(id) || state.stars >= scene.unlockStars;
    if (unlocked && !state.unlockedScenes.includes(id)) state.unlockedScenes.push(id);

    const btn = document.createElement('button');
    btn.className = 'scene-btn' +
      (id === state.currentScene ? ' active' : '') +
      (unlocked ? '' : ' locked');
    btn.innerHTML = `
      <span class="scene-btn-emoji">${scene.emoji}</span>
      <span class="scene-btn-name">${scene.name}</span>
      <span class="scene-btn-lock">${unlocked ? scene.desc : `⭐${scene.unlockStars}こで かいほう`}</span>
    `;
    if (unlocked) {
      btn.addEventListener('click', () => {
        state.currentScene = id;
        saveState();
        closeSceneModal();
        applyScene(id, true);
        showToast(`${scene.emoji} ${scene.name}にきたよ！`);
      });
    }
    list.appendChild(btn);
  });

  document.getElementById('scene-modal').classList.remove('hidden');
}

function closeSceneModal() {
  document.getElementById('scene-modal').classList.add('hidden');
}

// ===== 時間帯 =====
function updateTimeOfDay() {
  const h = new Date().getHours();
  const overlay = document.getElementById('time-overlay');
  const decor   = document.getElementById('scene-decor');
  if (!overlay) return;

  overlay.classList.remove('morning','evening','night');

  if (h >= 5 && h < 9)       overlay.classList.add('morning');
  else if (h >= 17 && h < 20) overlay.classList.add('evening');
  else if (h >= 20 || h < 5) {
    overlay.classList.add('night');
    addNightStars();
  }
}

function addNightStars() {
  const decor = document.getElementById('scene-decor');
  if (!decor) return;
  // 既存の星は除去してから追加
  decor.querySelectorAll('.night-star').forEach(el => el.remove());
  for (let i = 0; i < 12; i++) {
    const star = document.createElement('div');
    star.className = 'night-star';
    star.textContent = '★';
    star.style.cssText = `left:${Math.random()*90+5}%;top:${Math.random()*60}%;animation-delay:${Math.random()*2}s;font-size:${8+Math.random()*8}px`;
    decor.appendChild(star);
  }
}

// ===== タブ切替 =====
function switchTab(tab) {
  document.querySelectorAll('.tab-panel').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  const panelId = ['outfit','diary','settings'].includes(tab) ? tab : 'home';
  document.getElementById('tab-' + panelId)?.classList.add('active');
  document.getElementById('nav-' + panelId)?.classList.add('active');
  if (tab === 'outfit') { renderOutfitGrid(); renderOutfitSVG('outfit-preview-svg'); }
  if (tab === 'diary') renderDiary();
}

function switchSubtab(name) {
  document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('subtab-' + name)?.classList.add('active');
  document.getElementById('subpanel-diary').style.display       = name === 'diary'      ? '' : 'none';
  document.getElementById('subpanel-collection').style.display  = name === 'collection' ? '' : 'none';
  if (name === 'collection') renderCollection();
}

// ===== アクション報酬（ミニゲームから呼ばれる） =====
function applyMinigameReward(type, score) {
  const CONFIGS = {
    food:     { gauge: 'food',  base: 30, speech: 'おいしい〜！もぐもぐ🍯' },
    clean:    { gauge: 'clean', base: 35, speech: 'さっぱりした〜！✨' },
    sleep:    { gauge: 'sleep', base: 40, speech: 'ぐっすりねたよ💤' },
    play:     { gauge: 'happy', base: 20, speech: 'たのしかった〜！🎵' },
    medicine: { gauge: null,    base: 15, speech: 'ありがとう💕げんきになるね' },
  };
  const cfg = CONFIGS[type];
  if (!cfg) return;

  const bonus = Math.floor(score * 10);
  const amount = cfg.base + bonus;

  if (cfg.gauge) {
    state.gauges[cfg.gauge] = Math.min(100, state.gauges[cfg.gauge] + amount);
  } else {
    Object.keys(state.gauges).forEach(k => {
      state.gauges[k] = Math.min(100, state.gauges[k] + cfg.base);
    });
  }

  const stars = score >= 1 ? 2 : 1;
  awardStars(stars);
  if (score >= 1) spawnConfetti(window.innerWidth / 2, 200, 15);

  addDiaryEntry(getActionText(type), getActionIcon(type));
  setExpression('happy', 3000);
  playHappyAnim(cfg.speech);
  reachHand();

  renderGauges();
  updateSpeech();
  saveState();
}

function getActionText(type) {
  const map = { food:'ごはんをあげたよ', clean:'おふろにいれたよ', sleep:'おやすみさせたよ', play:'いっしょにあそんだよ', medicine:'おくすりをのんだよ' };
  return map[type] || type;
}
function getActionIcon(type) {
  const map = { food:'🍯', clean:'🛁', sleep:'💤', play:'🎵', medicine:'🩹' };
  return map[type] || '🌟';
}

// ===== アニメーション =====
function playHappyAnim(speech) {
  const wrapper = document.getElementById('bear-wrapper');
  if (wrapper) {
    wrapper.classList.add('action-happy');
    setTimeout(() => wrapper.classList.remove('action-happy'), 1200);
  }
  setSpeech(speech);
  spawnHearts();
}

function spawnHearts() {
  const container = document.getElementById('heart-effects');
  if (!container) return;
  const emojis = ['💕','💖','💗','✨','⭐'];
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const el = document.createElementNS('http://www.w3.org/2000/svg','text');
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.setAttribute('x', 40 + Math.random() * 120);
      el.setAttribute('y', 60 + Math.random() * 80);
      el.setAttribute('font-size', '18');
      el.style.animation = 'heart-fly 1.5s ease-out forwards';
      container.appendChild(el);
      setTimeout(() => el.remove(), 1500);
    }, i * 140);
  }
}

function reachHand() {
  const hand = document.getElementById('hand-wrapper');
  if (!hand) return;
  hand.classList.add('hand-reach');
  setTimeout(() => hand.classList.remove('hand-reach'), 800);
}

// ===== 吹き出し =====
function updateSpeech() {
  const lowEntry = Object.entries(state.gauges).find(([,v]) => v <= 20);
  const sickCount = Object.values(state.gauges).filter(v => v <= 10).length;
  const allHigh  = Object.values(state.gauges).every(v => v > 75);

  let text = 'あそぼ〜！';
  if (sickCount >= 2) {
    text = 'うぅ…きもちわるいよ…';
  } else if (lowEntry) {
    const map = { food:'おなかすいたよ🍯', clean:'おふろはいりたい🛁', sleep:'ねむい〜💤', happy:'あそんで〜！🎵' };
    text = map[lowEntry[0]] || text;
  } else if (allHigh) {
    const hour = new Date().getHours();
    if (hour < 9)       text = 'おはよう！きょうもあそぼ！';
    else if (hour >= 20) text = 'ねむくなってきたな〜💤';
    else                 text = 'きょうもたのしいね！💕';
  }
  setSpeech(text);
}

function setSpeech(text) {
  const el = document.getElementById('speech-text');
  if (el) el.textContent = text;
}

// ===== 衣装 =====
function selectOutfit(item) {
  if (item.id === 'none') {
    state.outfit = { hat: null, ribbon: null, clothes: null, acc: null };
  } else {
    const cat = item.category;
    state.outfit[cat] = state.outfit[cat] === item.id ? null : item.id;
  }
  renderOutfitSVG('bear-svg');
  renderOutfitSVG('outfit-preview-svg');
  renderOutfitGrid();
  addDiaryEntry(`おしゃれしたよ (${item.label})`, '🎀');
  awardStars(1);
  saveState();
}

// ===== 日記 =====
function addDiaryEntry(text, icon) {
  const now = new Date();
  const time = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  state.diary.unshift({ time, text, icon, ts: now.toISOString() });
  if (state.diary.length > DIARY_MAX) state.diary.length = DIARY_MAX;
}

// ===== せってい =====
function saveBearName() {
  const inp = document.getElementById('input-bear-name');
  const name = inp?.value.trim() || 'ぽんた';
  state.bearName = name || 'ぽんた';
  renderBearName();
  saveState();
  showToast(`なまえを「${state.bearName}」にかえたよ！`);
}

function setSkin(color) {
  state.skinTone = color;
  updateHandSkin();
  renderSettings();
  saveState();
}

function updateHandSkin() {
  const ids = ['hand-arm','hand-palm','finger-thumb','finger-1','finger-2','finger-3','finger-4'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('fill', state.skinTone);
  });
}

function resetGame() {
  if (!confirm('さいしょからはじめますか？\nセーブデータがけされます。')) return;
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(SAVE_KEY_V1);
  state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  renderAll();
  updateHandSkin();
  updateBearScale();
  applyScene('room', false);
  showToast('さいしょからはじめるよ！');
}

// ===== ゲージ経過 =====
function startGaugeDecay() {
  if (decayTimer) clearInterval(decayTimer);
  decayTimer = setInterval(() => {
    state.gauges.food  = Math.max(0, state.gauges.food  - 2);
    state.gauges.clean = Math.max(0, state.gauges.clean - 1);
    state.gauges.sleep = Math.max(0, state.gauges.sleep - 1.5);
    state.gauges.happy = Math.max(0, state.gauges.happy - 1);
    renderGauges();
    updateSpeech();
    updateExpression();
    saveState();
  }, GAUGE_DECAY_MS);
}

// ===== 紙吹雪 =====
function spawnConfetti(cx, cy, count = 12) {
  const container = document.getElementById('confetti-container');
  if (!container) return;
  const colors = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF6B9D','#C77DFF'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const dx = (Math.random() - 0.5) * 180;
    el.style.cssText = `
      left:${cx}px; top:${cy}px;
      background:${colors[i % colors.length]};
      --dx:${dx}px;
      animation-delay:${Math.random() * 0.3}s;
      animation-duration:${0.8 + Math.random() * 0.6}s;
      transform:rotate(${Math.random()*360}deg);
    `;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }
}

// ===== ユーティリティ =====
function pad2(n) { return String(n).padStart(2,'0'); }

function lightenColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
  const b = Math.min(255, (num & 0xFF) + amount);
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  clearTimeout(toastTimer);
  el.textContent = msg;
  el.classList.add('show');
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ===== Service Worker =====
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

// ===== 起動 =====
document.addEventListener('DOMContentLoaded', init);
