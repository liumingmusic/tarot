/*
 * app.js — 塔罗牌小站主逻辑
 * 选阵 → 洗牌(Fisher–Yates) → 抽牌(正/逆位判定) → 翻牌动画 → 解读渲染 → 详情浮层 → 历史
 * 纯前端、零构建、完全离线。
 */
(function () {
  'use strict';

  var CardSVG = window.CardSVG;

  // ---------- 牌阵定义 ----------
  var SPREADS = {
    daily: {
      key: 'daily', name: '每日一牌', desc: '单张今日指引',
      positions: [
        { key: 'today', name: '今日指引', hint: '今天可以带着的能量与提醒' }
      ]
    },
    three: {
      key: 'three', name: '三张牌', desc: '过去 / 现在 / 未来',
      positions: [
        { key: 'past', name: '过去', hint: '已经过去、仍在影响现状的能量' },
        { key: 'present', name: '现在', hint: '当下最核心的课题' },
        { key: 'future', name: '未来', hint: '自然展开的可能方向' }
      ]
    },
    relationship: {
      key: 'relationship', name: '关系牌阵', desc: '你 / 对方 / 关系走向',
      positions: [
        { key: 'you', name: '你', hint: '你在这段关系中的状态与心意' },
        { key: 'other', name: '对方', hint: '对方的状态与心意' },
        { key: 'trend', name: '关系走向', hint: '这段关系可能的发展' }
      ]
    },
    celtic: {
      key: 'celtic', name: '凯尔特十字', desc: '10 张进阶牌阵',
      positions: [
        { key: 'present', name: '现状', hint: '你目前所处的情境' },
        { key: 'challenge', name: '挑战', hint: '横在面前需要面对的考验' },
        { key: 'past', name: '过去', hint: '形成现状的过往因缘' },
        { key: 'future', name: '未来', hint: '短期内将要发生的事' },
        { key: 'above', name: '上方·理想', hint: '你意识中追求的目标与期许' },
        { key: 'below', name: '下方·根基', hint: '潜意识里真正的动因' },
        { key: 'advice', name: '建议', hint: '此刻最该采取的应对' },
        { key: 'environment', name: '环境', hint: '外在环境与他人的眼光' },
        { key: 'hopes', name: '希望与恐惧', hint: '内心隐秘的期盼与担忧' },
        { key: 'outcome', name: '最终结果', hint: '顺其发展可能抵达的结局' }
      ]
    }
  };

  var HISTORY_KEY = 'tarot_history_v1';
  var THEME_KEY = 'tarot_theme';

  // ---------- 主题（浅色 / 深色） ----------
  function getTheme() {
    try { return localStorage.getItem(THEME_KEY) || 'light'; } catch (e) { return 'light'; }
  }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0d0b1f' : '#f3ecdd');
  }
  function toggleTheme() {
    var t = getTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    applyTheme(t);
    updateThemeBtn();
    toast(t === 'dark' ? '已切换到深色 🌙' : '已切换到浅色 ☀️');
  }
  function makeThemeBtn() {
    var b = el('button', 'btn btn-ghost theme-btn');
    b.textContent = getTheme() === 'dark' ? '☀️ 浅色' : '🌙 深色';
    b.addEventListener('click', toggleTheme);
    return b;
  }
  function updateThemeBtn() {
    var label = getTheme() === 'dark' ? '☀️ 浅色' : '🌙 深色';
    var btns = document.querySelectorAll('.theme-btn');
    Array.prototype.forEach.call(btns, function (b) { b.textContent = label; });
  }

  // ---------- 使用说明浮层 ----------
  function buildGuide() {
    if (document.getElementById('guide-overlay')) return;
    var ov = el('div', 'guide-overlay');
    ov.id = 'guide-overlay';
    ov.innerHTML =
      '<div class="guide-modal">' +
        '<button class="guide-close" aria-label="关闭">×</button>' +
        '<h2>使用说明</h2>' +
        '<p class="guide-lead">塔罗牌是一种用来「照见内心」的趣味工具。这里的每一张牌都不是预言，而是一面镜子——它用图像与象征，帮你把平时没注意到的想法、情绪和选择看得更清楚。把它当作一次安静的自我对话就好。</p>' +
        '<h3>怎么玩（三步）</h3>' +
        '<div class="guide-steps-col">' +
          '<div class="guide-row"><span class="num">1</span><div><b>选牌阵</b>：根据想探索的问题，挑一个牌阵（每日一牌 / 三张 / 关系 / 凯尔特十字）。</div></div>' +
          '<div class="guide-row"><span class="num">2</span><div><b>洗牌 + 抽牌</b>：点「洗牌」集中意念，再点「抽牌」，牌会一张张就位。</div></div>' +
          '<div class="guide-row"><span class="num">3</span><div><b>翻牌看解读</b>：轻点每张牌背，牌面翻开，下方显示这张牌在你所选位置上的含义（正位 / 逆位）。</div></div>' +
        '</div>' +
        '<h3>正位 vs 逆位</h3>' +
        '<p>抽牌时约一半几率出现「逆位」（牌面旋转 180°）。<b>正位</b>代表能量顺畅、自然呈现；<b>逆位</b>通常表示这股能量被阻滞、过度，或提醒你反过来想一想。两者没有好坏，都是线索。</p>' +
        '<h3>四种牌阵适合什么</h3>' +
        '<ul class="guide-list">' +
          '<li><b>每日一牌</b>：不知道问什么时，给今天一个关键词与提醒。</li>' +
          '<li><b>三张牌（过去 / 现在 / 未来）</b>：看清一件事的发展脉络。</li>' +
          '<li><b>关系牌阵（你 / 对方 / 关系走向）</b>：梳理一段关系里双方的视角。</li>' +
          '<li><b>凯尔特十字（10 张）</b>：深入、复杂的问题，做一次全面展开。</li>' +
        '</ul>' +
        '<h3>小提示</h3>' +
        '<ul class="guide-list">' +
          '<li>同一个问题不要反复抽，先让答案沉淀。</li>' +
          '<li>读牌义时，相信你第一眼被击中的那句话。</li>' +
          '<li>结果会自动保存在本机「历史」，可随时回看，<b>不上传任何数据</b>。</li>' +
        '</ul>' +
      '</div>';
    document.body.appendChild(ov);
    ov.querySelector('.guide-close').addEventListener('click', closeGuide);
    ov.addEventListener('click', function (e) { if (e.target === ov) closeGuide(); });
  }
  function openGuide() { buildGuide(); document.getElementById('guide-overlay').classList.add('open'); }
  function closeGuide() { var g = document.getElementById('guide-overlay'); if (g) g.classList.remove('open'); }

  // ---------- 全局状态 ----------
  var state = {
    deck: [],
    spreadKey: null,
    drawn: [],        // [{card, reversed}]
    phase: 'home',    // home | spread
    shuffled: false,
    slotsWrap: null,
    noScroll: false
  };

  var $app = document.getElementById('app');

  // ---------- 工具 ----------
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function todayStr() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  // ---------- 数据载入 ----------
  function loadDeck() {
    return fetch('data/tarot.json')
      .then(function (r) {
        if (!r.ok) throw new Error('无法载入 tarot.json: ' + r.status);
        return r.json();
      })
      .then(function (data) {
        state.deck = data;
        return data;
      });
  }

  // ---------- 首页 ----------
  function renderHome() {
    state.phase = 'home';
    state.spreadKey = null;
    $app.innerHTML = '';

    var hero = el('section', 'hero');
    hero.appendChild(el('h1', 'site-title', '塔罗牌'));
    hero.appendChild(el('p', 'site-sub', '照见内心的趣味指引'));
    hero.appendChild(el('p', 'site-note', '本工具用于自我反思与趣味指引，并非宿命式占卜。牌义由经典塔罗知识整理，请带着开放与好奇去体会。'));

    var actions = el('div', 'hero-actions');
    var guideBtn = el('button', 'btn btn-ghost', '❔ 使用说明');
    guideBtn.addEventListener('click', openGuide);
    var themeBtn = makeThemeBtn();
    var historyBtn = el('button', 'btn btn-ghost history-open', '📜 查看历史');
    historyBtn.addEventListener('click', openHistory);
    actions.appendChild(guideBtn);
    actions.appendChild(themeBtn);
    actions.appendChild(historyBtn);
    hero.appendChild(actions);

    var steps = el('div', 'guide-steps');
    steps.innerHTML =
      '<div class="guide-step"><span class="num">1</span><span>选<strong>牌阵</strong></span></div>' +
      '<div class="guide-step"><span class="num">2</span><span>洗牌 · <strong>抽牌</strong></span></div>' +
      '<div class="guide-step"><span class="num">3</span><span>翻牌看<strong>解读</strong></span></div>';
    hero.appendChild(steps);

    $app.appendChild(hero);

    var wrap = el('section', 'spread-select');
    wrap.appendChild(el('h2', 'section-title', '选择牌阵'));
    var grid = el('div', 'spread-grid');

    Object.keys(SPREADS).forEach(function (k) {
      var sp = SPREADS[k];
      var card = el('button', 'spread-card');
      card.innerHTML =
        '<div class="spread-card-name">' + escapeHtml(sp.name) + '</div>' +
        '<div class="spread-card-desc">' + escapeHtml(sp.desc) + '</div>' +
        '<div class="spread-card-count">' + sp.positions.length + ' 张</div>';
      card.addEventListener('click', function () { selectSpread(k); });
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    $app.appendChild(wrap);

    // 历史抽屉
    var drawer = el('div', 'history-drawer');
    drawer.id = 'history-drawer';
    drawer.innerHTML = '<div class="history-inner"><div class="history-head"><span>历史记录</span><button class="btn btn-ghost" id="history-close">收起</button></div><div id="history-list"></div></div>';
    $app.appendChild(drawer);
    drawer.querySelector('#history-close').addEventListener('click', closeHistory);
  }

  function openHistory() {
    var list = document.getElementById('history-list');
    var raw = [];
    try { raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { raw = []; }
    if (!raw.length) {
      list.innerHTML = '<p class="history-empty">还没有保存的记录。抽一卦，点「保存本次」试试。</p>';
    } else {
      list.innerHTML = raw.map(function (h) {
        var cards = h.cards.map(function (c) {
          return escapeHtml(c.name) + (c.reversed ? '(逆)' : '');
        }).join(' · ');
        return '<div class="history-item"><div class="history-meta">' + escapeHtml(h.spreadName) + ' · ' + escapeHtml(h.date) + '</div><div class="history-cards">' + cards + '</div></div>';
      }).join('');
    }
    document.getElementById('history-drawer').classList.add('open');
  }
  function closeHistory() {
    var d = document.getElementById('history-drawer');
    if (d) d.classList.remove('open');
  }

  // ---------- 牌阵视图 ----------
  function selectSpread(key) {
    state.spreadKey = key;
    state.shuffled = false;
    state.drawn = [];
    renderSpread();
  }

  function renderSpread() {
    state.phase = 'spread';
    var sp = SPREADS[state.spreadKey];
    $app.innerHTML = '';

    // 顶栏
    var bar = el('div', 'topbar');
    var back = el('button', 'topbar-back', '← 牌阵');
    back.addEventListener('click', renderHome);
    bar.appendChild(back);
    var titleWrap = el('div', 'topbar-title-wrap');
    var title = el('div', 'topbar-title', escapeHtml(sp.name) + ' <span class="topbar-sub">' + escapeHtml(sp.desc) + '</span>');
    titleWrap.appendChild(title);
    bar.appendChild(titleWrap);
    var topTheme = makeThemeBtn();
    topTheme.classList.add('topbar-theme');
    bar.appendChild(topTheme);
    $app.appendChild(bar);

    // 牌阵切换 chips
    var chips = el('div', 'spread-chips');
    Object.keys(SPREADS).forEach(function (k) {
      var c = el('button', 'chip' + (k === state.spreadKey ? ' active' : ''), escapeHtml(SPREADS[k].name));
      c.addEventListener('click', function () { selectSpread(k); });
      chips.appendChild(c);
    });
    $app.appendChild(chips);

    // 牌桌
    var table = el('section', 'table-area');

    // 牌堆 + 控制
    var deckZone = el('div', 'deck-zone');
    var deck = el('div', 'deck');
    for (var i = 0; i < 5; i++) {
      var dback = el('div', 'deck-card');
      dback.innerHTML = CardSVG.createCardBackSVG('deck' + i);
      deck.appendChild(dback);
    }
    deckZone.appendChild(deck);

    var controls = el('div', 'deck-controls');
    var shuffleBtn = el('button', 'btn btn-primary', '🔀 洗牌');
    var drawBtn = el('button', 'btn btn-gold', '✨ 抽牌');
    drawBtn.disabled = true;
    shuffleBtn.addEventListener('click', function () {
      doShuffle(deck, shuffleBtn, drawBtn);
    });
    drawBtn.addEventListener('click', function () {
      doDraw(sp, slotsWrap, drawBtn, shuffleBtn);
    });
    controls.appendChild(shuffleBtn);
    controls.appendChild(drawBtn);
    deckZone.appendChild(controls);

    table.appendChild(deckZone);

    // 牌位网格
    var slotsWrap = el('div', 'slots spread-' + sp.key);
    state.slotsWrap = slotsWrap;
    table.appendChild(slotsWrap);

    $app.appendChild(table);

    // 底部操作
    var actions = el('div', 'bottom-actions');
    var reshuffle = el('button', 'btn btn-ghost', '🔀 重新洗牌');
    reshuffle.addEventListener('click', function () {
      state.shuffled = false; state.drawn = [];
      renderSpread();
    });
    var saveBtn = el('button', 'btn btn-ghost', '💾 保存本次');
    saveBtn.addEventListener('click', saveResult);
    actions.appendChild(reshuffle);
    actions.appendChild(saveBtn);
    $app.appendChild(actions);
  }

  function doShuffle(deckEl, shuffleBtn, drawBtn) {
    shuffleBtn.disabled = true;
    drawBtn.disabled = true;
    deckEl.classList.add('shuffling');
    setTimeout(function () {
      deckEl.classList.remove('shuffling');
      state.shuffled = true;
      shuffleBtn.disabled = false;
      drawBtn.disabled = false;
    }, 750);
  }

  function doDraw(sp, slotsWrap, drawBtn, shuffleBtn) {
    if (drawBtn) drawBtn.disabled = true;
    if (shuffleBtn) shuffleBtn.disabled = true;

    var picked = shuffle(state.deck).slice(0, sp.positions.length);
    state.drawn = picked.map(function (card) {
      return { card: card, reversed: Math.random() < 0.5 };
    });

    slotsWrap.innerHTML = '';
    sp.positions.forEach(function (pos, i) {
      var d = state.drawn[i];
      var slot = el('div', 'slot');
      slot.setAttribute('data-i', String(i));

      var posLabel = el('div', 'slot-pos');
      posLabel.innerHTML = '<span class="slot-pos-name">' + escapeHtml(pos.name) + '</span><span class="slot-pos-hint">' + escapeHtml(pos.hint) + '</span>';
      slot.appendChild(posLabel);

      var flip = el('div', 'flip-card');
      var inner = el('div', 'flip-inner');
      var front = el('div', 'flip-front');
      front.innerHTML = CardSVG.createCardBackSVG('slot' + i + 'f');
      var back = el('div', 'flip-back' + (d.reversed ? ' reversed' : ''));
      back.innerHTML = CardSVG.createCardSVG(d.card, { uid: 'slot' + i + 'b' });
      inner.appendChild(front);
      inner.appendChild(back);
      flip.appendChild(inner);
      flip.addEventListener('click', function () {
        if (flip.classList.contains('flipped')) return;
        flip.classList.add('flipped');
        revealRead(slot, i, pos);
      });
      slot.appendChild(flip);

      var read = el('div', 'slot-read');
      read.setAttribute('hidden', '');
      slot.appendChild(read);

      slotsWrap.appendChild(slot);
    });
  }

  function revealRead(slot, i, pos) {
    var d = state.drawn[i];
    var read = slot.querySelector('.slot-read');
    var meaning = d.reversed ? d.card.reversed : d.card.upright;
    var kws = d.reversed ? d.card.keywordsRev : d.card.keywordsUp;
    var orientation = d.reversed ? '逆位' : '正位';

    read.innerHTML =
      '<div class="read-card-head">' +
        '<span class="read-name">' + escapeHtml(d.card.name) + '</span>' +
        '<span class="read-orientation ' + (d.reversed ? 'rev' : 'up') + '">' + orientation + '</span>' +
      '</div>' +
      '<p class="read-meaning">' + escapeHtml(meaning) + '</p>' +
      '<div class="read-kw">' + kws.map(function (k) { return '<span class="kw">' + escapeHtml(k) + '</span>'; }).join('') + '</div>' +
      '<button class="btn btn-link detail-open">查看牌义详情 →</button>';

    read.querySelector('.detail-open').addEventListener('click', function () {
      openDetail(d.card, d.reversed);
    });
    read.removeAttribute('hidden');

    // 自动滚动到该张牌（手机端体验）
    if (!state.noScroll && window.matchMedia('(max-width: 720px)').matches) {
      slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ---------- 详情浮层 ----------
  function openDetail(card, reversed) {
    var overlay = document.getElementById('detail-overlay');
    if (!overlay) {
      overlay = el('div', 'detail-overlay');
      overlay.id = 'detail-overlay';
      document.body.appendChild(overlay);
    }
    var meaning = reversed ? card.reversed : card.upright;
    overlay.innerHTML =
      '<div class="detail-modal">' +
        '<button class="detail-close" aria-label="关闭">×</button>' +
        '<div class="detail-face">' + CardSVG.createCardSVG(card, { uid: 'detail' }) + '</div>' +
        '<div class="detail-body">' +
          '<h3>' + escapeHtml(card.name) + ' <span class="detail-en">' + escapeHtml(card.nameEn) + '</span></h3>' +
          '<div class="detail-meta">' +
            '<span>花色：' + escapeHtml(card.suit) + '</span>' +
            '<span>元素：' + escapeHtml(card.element) + '</span>' +
            (card.roman ? '<span>序号：' + escapeHtml(card.roman) + '</span>' : '') +
          '</div>' +
          '<div class="detail-block">' +
            '<h4 class="up">正位</h4>' +
            '<p>' + escapeHtml(card.upright) + '</p>' +
            '<div class="read-kw">' + card.keywordsUp.map(function (k) { return '<span class="kw">' + escapeHtml(k) + '</span>'; }).join('') + '</div>' +
          '</div>' +
          '<div class="detail-block">' +
            '<h4 class="rev">逆位</h4>' +
            '<p>' + escapeHtml(card.reversed) + '</p>' +
            '<div class="read-kw">' + card.keywordsRev.map(function (k) { return '<span class="kw">' + escapeHtml(k) + '</span>'; }).join('') + '</div>' +
          '</div>' +
          '<div class="detail-current">当前抽取：<b class="' + (reversed ? 'rev' : 'up') + '">' + (reversed ? '逆位' : '正位') + '</b> — ' + escapeHtml(meaning) + '</div>' +
        '</div>' +
      '</div>';
    overlay.classList.add('open');
    overlay.querySelector('.detail-close').addEventListener('click', function () {
      overlay.classList.remove('open');
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  }

  // ---------- 历史保存 ----------
  function saveResult() {
    if (!state.drawn.length) {
      toast('还没有抽牌，先洗牌抽牌再保存吧～');
      return;
    }
    var sp = SPREADS[state.spreadKey];
    var rec = {
      spreadName: sp.name,
      date: todayStr(),
      ts: Date.now(),
      cards: state.drawn.map(function (d, i) {
        return { name: d.card.name, reversed: d.reversed, position: sp.positions[i].name };
      })
    };
    var raw = [];
    try { raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { raw = []; }
    raw.unshift(rec);
    if (raw.length > 30) raw = raw.slice(0, 30);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(raw));
      toast('已保存到本地历史 ✦');
    } catch (e) {
      toast('保存失败：浏览器存储不可用');
    }
  }

  // ---------- 轻提示 ----------
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById('toast');
    if (!t) {
      t = el('div', 'toast');
      t.id = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  // ---------- 自动演示（用于截图 / 分享预设，?demo=three|celtic|...） ----------
  function autoDemo(key) {
    if (!SPREADS[key]) { renderHome(); return; }
    selectSpread(key);
    state.noScroll = true;
    state.shuffled = true;
    doDraw(SPREADS[key], state.slotsWrap, null, null);
    var flips = state.slotsWrap.querySelectorAll('.flip-card');
    Array.prototype.forEach.call(flips, function (f) { f.click(); });
    window.scrollTo(0, 0);
    state.noScroll = false;
  }

  // ---------- 启动 ----------
  function boot() {
    if (!CardSVG) {
      $app.innerHTML = '<p class="error">加载失败：card-svg.js 未就绪。</p>';
      return;
    }
    applyTheme(getTheme());
    try {
      var tp = new URLSearchParams(window.location.search).get('theme');
      if (tp === 'dark' || tp === 'light') { applyTheme(tp); try { localStorage.setItem(THEME_KEY, tp); } catch (e) {} }
    } catch (e) {}
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeGuide(); closeHistory(); }
    });
    var demoKey = null;
    try {
      var p = new URLSearchParams(window.location.search);
      var d = p.get('demo');
      if (d && SPREADS[d]) demoKey = d;
    } catch (e) { /* 忽略 */ }

    loadDeck()
      .then(function () {
        if (demoKey) autoDemo(demoKey);
        else renderHome();
      })
      .catch(function (err) {
        $app.innerHTML = '<p class="error">数据加载失败：' + escapeHtml(err.message) +
          '<br>请通过本地服务器访问（如 <code>python3 -m http.server</code>），勿直接用 file:// 打开。</p>';
      });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
