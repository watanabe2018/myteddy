'use strict';

// ===== 定数 =====
const SAVE_KEY = 'teddy_save_v1';
const GAUGE_DECAY_INTERVAL = 60000; // 1分
const DIARY_MAX = 30;

// ===== 衣装データ =====
const OUTFITS = [
  { id: 'none',    category: 'all',       label: 'なし',    emoji: '❌', svg: null },
  { id: 'hat_red', category: 'hat',       label: 'あかいぼうし', emoji: '🎩',
    svg: `<ellipse cx="100" cy="65" rx="36" ry="8" fill="#CC3333"/>
          <rect x="72" y="34" width="56" height="32" rx="8" fill="#CC3333"/>
          <ellipse cx="100" cy="34" rx="20" ry="6" fill="#AA2222"/>` },
  { id: 'hat_flower', category: 'hat',    label: 'おはなぼうし', emoji: '🌸',
    svg: `<ellipse cx="100" cy="65" rx="36" ry="8" fill="#FFB7C5"/>
          <rect x="72" y="34" width="56" height="32" rx="8" fill="#FFB7C5"/>
          <circle cx="100" cy="34" r="12" fill="#FF6B9D"/>
          <circle cx="86" cy="30" r="7" fill="#FF6B9D"/>
          <circle cx="114" cy="30" r="7" fill="#FF6B9D"/>
          <circle cx="100" cy="30" r="6" fill="#FFD700"/>` },
  { id: 'ribbon_red', category: 'ribbon', label: 'あかリボン', emoji: '🎀',
    svg: `<path d="M72 76 Q83 68 90 76 Q83 84 72 76Z" fill="#FF3366"/>
          <path d="M128 76 Q117 68 110 76 Q117 84 128 76Z" fill="#FF3366"/>
          <circle cx="100" cy="76" r="7" fill="#CC0044"/>` },
  { id: 'ribbon_blue', category: 'ribbon', label: 'あおリボン', emoji: '💙',
    svg: `<path d="M72 76 Q83 68 90 76 Q83 84 72 76Z" fill="#3399FF"/>
          <path d="M128 76 Q117 68 110 76 Q117 84 128 76Z" fill="#3399FF"/>
          <circle cx="100" cy="76" r="7" fill="#0055CC"/>` },
  { id: 'clothes_pink', category: 'clothes', label: 'ぴんくふく', emoji: '👗',
    svg: `<path d="M60 145 Q75 130 100 128 Q125 130 140 145 L148 200 Q100 210 52 200Z" fill="#FFB7C5"/>
          <path d="M60 145 Q70 138 80 145" stroke="#FF6B9D" stroke-width="2" fill="none"/>
          <path d="M120 145 Q130 138 140 145" stroke="#FF6B9D" stroke-width="2" fill="none"/>` },
  { id: 'clothes_blue', category: 'clothes', label: 'あおふく', emoji: '👕',
    svg: `<path d="M60 145 Q75 130 100 128 Q125 130 140 145 L148 200 Q100 210 52 200Z" fill="#87CEEB"/>
          <path d="M80 128 L75 145 M120 128 L125 145" stroke="#5AA0D0" stroke-width="2"/>` },
  { id: 'muffler', category: 'acc',      label: 'マフラー', emoji: '🧣',
    svg: `<path d="M65 128 Q100 118 135 128 Q138 136 135 140 Q100 130 65 140 Q62 136 65 128Z" fill="#FF6633"/>
          <rect x="130" y="128" width="16" height="30" rx="5" fill="#FF6633"/>` },
];

// ===== 状態 =====
let state = {
  bearName: 'ぽんた',
  gauges: { food: 75, clean: 50, sleep: 70, happy: 90 },
  outfit: { hat: null, ribbon: null, clothes: null, acc: null },
  skinTone: '#F5C5A3',
  diary: [],
  lastSaved: null,
};

// ===== 初期化 =====
function init() {
  loadState();
  renderAll();
  updateHandSkin();
  startGaugeDecay();
  registerServiceWorker();
}

// ===== セーブ・ロード =====
function saveState() {
  state.lastSaved = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  const badge = document.getElementById('save-time');
  if (badge) {
    const d = new Date(state.lastSaved);
    badge.textContent = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  }
}

function loadState() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    state = { ...state, ...saved };
    state.gauges = { ...{ food:75, clean:50, sleep:70, happy:90 }, ...saved.gauges };
    state.outfit = { ...{ hat:null, ribbon:null, clothes:null, acc:null }, ...saved.outfit };
    showToast(`おかえり！${state.bearName}がまってたよ💕`);
  } catch(e) { /* ignore */ }
}

// ===== レンダリング =====
function renderAll() {
  renderGauges();
  renderBearName();
  renderOutfitSVG('bear-svg');
  renderOutfitSVG('outfit-preview-svg');
  renderOutfitGrid();
  renderDiary();
  renderSettings();
  updateSpeech();
}

function renderBearName() {
  const el = document.getElementById('bear-name-header');
  if (el) el.textContent = state.bearName;
  const inp = document.getElementById('input-bear-name');
  if (inp) inp.value = state.bearName;
}

function renderGauges() {
  const keys = ['food','clean','sleep','happy'];
  const ids   = ['gauge-food','gauge-clean','gauge-sleep','gauge-happy'];
  const icons = ['icon-food','icon-clean','icon-sleep','icon-happy'];
  keys.forEach((k, i) => {
    const bar = document.getElementById(ids[i]);
    const ico = document.getElementById(icons[i]);
    const val = Math.max(0, Math.min(100, state.gauges[k]));
    if (bar) bar.style.width = val + '%';
    if (ico) ico.classList.toggle('blink', val <= 20);
  });
}

function renderOutfitSVG(svgId) {
  const svg = document.getElementById(svgId);
  if (!svg) return;

  const frontId = svgId === 'bear-svg' ? 'outfit-front' : 'outfit-front-preview';
  const backId  = svgId === 'bear-svg' ? 'outfit-back'  : 'outfit-back-preview';

  const front = document.getElementById(frontId);
  const back  = document.getElementById(backId);
  if (!front || !back) return;

  front.innerHTML = '';
  back.innerHTML  = '';

  Object.values(state.outfit).forEach(id => {
    if (!id) return;
    const item = OUTFITS.find(o => o.id === id);
    if (!item || !item.svg) return;
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.innerHTML = item.svg;
    // 帽子・リボンは front、服は back に（重なり順）
    if (item.category === 'clothes') {
      back.appendChild(g);
    } else {
      front.appendChild(g);
    }
  });
}

function renderOutfitGrid() {
  const grid = document.getElementById('outfit-grid');
  if (!grid) return;
  grid.innerHTML = '';

  OUTFITS.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'outfit-item' + (item.id === 'none' ? ' none-item' : '');
    btn.innerHTML = `<span class="outfit-emoji">${item.emoji}</span><span class="outfit-label">${item.label}</span>`;

    // 選択状態
    const isSelected = item.id === 'none'
      ? Object.values(state.outfit).every(v => !v)
      : Object.values(state.outfit).includes(item.id);
    if (isSelected) btn.classList.add('selected');

    btn.addEventListener('click', () => selectOutfit(item));
    grid.appendChild(btn);
  });
}

function renderDiary() {
  const list = document.getElementById('diary-list');
  if (!list) return;

  if (state.diary.length === 0) {
    list.innerHTML = '<div class="diary-empty">まだきろくがないよ<br>くまのおせわをしてみよう！</div>';
    return;
  }

  list.innerHTML = state.diary.slice().reverse().map(entry => `
    <div class="diary-entry">
      <span class="diary-time">${entry.time}</span>
      <span class="diary-text">${entry.text}</span>
      <span class="diary-icon">${entry.icon}</span>
    </div>
  `).join('');
}

function renderSettings() {
  // スキントーン
  document.querySelectorAll('.swatch').forEach(el => {
    el.classList.toggle('selected', el.dataset.skin === state.skinTone);
  });
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

// ===== アクション =====
const ACTION_CONFIG = {
  food:     { gauge: 'food',  amount: 30, text: 'ごはんをあげたよ',   icon: '🍯', speech: 'おいしいね！もぐもぐ🍯', anim: true },
  clean:    { gauge: 'clean', amount: 35, text: 'おふろにいれたよ',   icon: '🛁', speech: 'きれいきれい！✨',       anim: true },
  sleep:    { gauge: 'sleep', amount: 40, text: 'おやすみしたよ',     icon: '💤', speech: 'ぐっすりねたよ💤',       anim: true },
  play:     { gauge: 'happy', amount: 25, text: 'いっしょにあそんだよ', icon: '🎵', speech: 'たのしいね！🎵',        anim: true },
  medicine: { gauge: null,    amount: 15, text: 'おくすりをのんだよ',  icon: '🩹', speech: 'げんきになるね🩹',      anim: true },
};

function doAction(actionKey) {
  const cfg = ACTION_CONFIG[actionKey];
  if (!cfg) return;

  if (cfg.gauge) {
    state.gauges[cfg.gauge] = Math.min(100, state.gauges[cfg.gauge] + cfg.amount);
  } else {
    // medicine: 全ゲージ少し回復
    Object.keys(state.gauges).forEach(k => {
      state.gauges[k] = Math.min(100, state.gauges[k] + cfg.amount);
    });
  }

  // 日記追加
  addDiaryEntry(cfg.text, cfg.icon);

  // アニメーション
  if (cfg.anim) playHappyAnim(cfg.speech);

  // 手のアニメーション
  reachHand();

  renderGauges();
  saveState();
}

function playHappyAnim(speech) {
  // 笑顔
  const normal = document.getElementById('bear-mouth-normal');
  const happy  = document.getElementById('bear-mouth-happy');
  if (normal) normal.style.display = 'none';
  if (happy)  happy.style.display  = 'block';

  // ベアアニメーション
  const wrapper = document.getElementById('bear-wrapper');
  if (wrapper) {
    wrapper.classList.add('action-happy');
    setTimeout(() => wrapper.classList.remove('action-happy'), 1200);
  }

  // 吹き出し
  setSpeech(speech);

  // ハート
  spawnHearts();

  // 2秒後に戻す
  setTimeout(() => {
    if (normal) normal.style.display = 'block';
    if (happy)  happy.style.display  = 'none';
    updateSpeech();
  }, 2000);
}

function spawnHearts() {
  const container = document.getElementById('heart-effects');
  if (!container) return;
  const hearts = ['💕','💖','💗','✨'];
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const span = document.createElementNS('http://www.w3.org/2000/svg','text');
      span.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      span.setAttribute('x', 50 + Math.random() * 100);
      span.setAttribute('y', 80 + Math.random() * 60);
      span.setAttribute('font-size', '20');
      span.style.animation = `heart-fly 1.5s ease-out forwards`;
      container.appendChild(span);
      setTimeout(() => span.remove(), 1500);
    }, i * 150);
  }
}

function reachHand() {
  const hand = document.getElementById('hand-wrapper');
  if (!hand) return;
  hand.classList.add('hand-reach');
  setTimeout(() => hand.classList.remove('hand-reach'), 800);
}

function updateSpeech() {
  const min = Math.min(...Object.values(state.gauges));
  const speeches = {
    hungry:  `おなかすいたよ〜🍯 ごはんほしいな`,
    dirty:   `おふろにはいりたいな〜🛁`,
    tired:   `ねむいよ〜💤 おやすみしたい`,
    bored:   `あそぼ〜！いっしょにあそんで🎵`,
    happy:   `きょうもたのしいね！💕`,
    neutral: `あそぼ〜！`,
  };
  const low = Object.entries(state.gauges).find(([,v]) => v <= 20);
  let text = speeches.neutral;
  if (low) {
    if (low[0] === 'food')  text = speeches.hungry;
    if (low[0] === 'clean') text = speeches.dirty;
    if (low[0] === 'sleep') text = speeches.tired;
    if (low[0] === 'happy') text = speeches.bored;
  } else if (min > 70) {
    text = speeches.happy;
  }
  setSpeech(text);
}

function setSpeech(text) {
  const el = document.getElementById('speech-text');
  if (el) el.textContent = text;
}

// ===== 衣装選択 =====
function selectOutfit(item) {
  if (item.id === 'none') {
    state.outfit = { hat: null, ribbon: null, clothes: null, acc: null };
  } else {
    // 同カテゴリは排他
    const cat = item.category;
    const current = state.outfit[cat];
    state.outfit[cat] = current === item.id ? null : item.id;
  }
  renderOutfitSVG('bear-svg');
  renderOutfitSVG('outfit-preview-svg');
  renderOutfitGrid();
  addDiaryEntry(`おしゃれしたよ (${item.label})`, '🎀');
  saveState();
}

// ===== 日記 =====
function addDiaryEntry(text, icon) {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  state.diary.unshift({ time, text, icon, ts: now.toISOString() });
  if (state.diary.length > DIARY_MAX) state.diary = state.diary.slice(0, DIARY_MAX);
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
  // ハイライト（少し明るく）
  const highlights = document.querySelectorAll('#hand-svg rect[fill="#FFD4B8"]');
  const light = lightenColor(state.skinTone, 30);
  highlights.forEach(el => el.setAttribute('fill', light));
}

function lightenColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
  const b = Math.min(255, (num & 0xFF) + amount);
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

function resetGame() {
  if (!confirm(`さいしょからはじめますか？\nセーブデータがけされます。`)) return;
  localStorage.removeItem(SAVE_KEY);
  state = {
    bearName: 'ぽんた',
    gauges: { food: 75, clean: 50, sleep: 70, happy: 90 },
    outfit: { hat: null, ribbon: null, clothes: null, acc: null },
    skinTone: '#F5C5A3',
    diary: [],
    lastSaved: null,
  };
  renderAll();
  updateHandSkin();
  showToast('さいしょからはじめるよ！');
}

// ===== ゲージ時間経過 =====
function startGaugeDecay() {
  setInterval(() => {
    state.gauges.food  = Math.max(0, state.gauges.food  - 2);
    state.gauges.clean = Math.max(0, state.gauges.clean - 1);
    state.gauges.sleep = Math.max(0, state.gauges.sleep - 1.5);
    state.gauges.happy = Math.max(0, state.gauges.happy - 1);
    renderGauges();
    updateSpeech();
    saveState();
  }, GAUGE_DECAY_INTERVAL);
}

// ===== トースト =====
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  clearTimeout(toastTimer);
  el.textContent = msg;
  el.classList.add('show');
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ===== Service Worker =====
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

// ===== 起動 =====
document.addEventListener('DOMContentLoaded', init);
