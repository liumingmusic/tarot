/*
 * card-svg.js — 运行时参数化生成塔罗牌面 SVG
 * 完全离线、零图片：每张牌由花色主色 + 牌名 + 罗马数字 + 象征符号生成。
 * 同时提供统一的「牌背」SVG（神秘几何 / 星空点阵纹样）。
 */
(function (global) {
  'use strict';

  // 花色 -> 主色（深底金字的描边与辉光基调）
  var SUIT_COLORS = {
    '大阿卡纳': '#7c5cff',
    '权杖': '#e0533d',
    '圣杯': '#3a78c8',
    '宝剑': '#8a94a6',
    '星币': '#2f8f78'
  };

  var GOLD = '#e9c46a';
  var GOLD_SOFT = '#f3dca0';

  function colorFor(card) {
    if (card && card.color) return card.color;
    return SUIT_COLORS[card && card.suit] || '#7c5cff';
  }

  // 角标文字：大阿卡纳用罗马数字，小阿卡纳用 A/数字/侍骑后王
  function cornerLabel(card) {
    if (!card) return '';
    if (card.arcana === 'major') return card.roman || String(card.number);
    var n = card.number;
    if (n === 1) return 'A';
    if (n >= 2 && n <= 10) return String(n);
    if (n === 11) return '侍';
    if (n === 12) return '骑';
    if (n === 13) return '后';
    if (n === 14) return '王';
    return '';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // 生成牌面 SVG。options.uid 用于保证多实例时 defs id 不冲突
  function createCardSVG(card, options) {
    options = options || {};
    var uid = (options.uid != null ? options.uid : (card ? card.id : 'x')) || 'x';
    uid = String(uid).replace(/[^a-zA-Z0-9_-]/g, '');
    var color = colorFor(card);
    var corner = cornerLabel(card);
    var name = esc(card ? card.name : '');
    var nameEn = esc(card ? card.nameEn : '');
    var symbol = esc(card ? card.symbol : '✦');
    var suit = esc(card ? card.suit : '');

    var svg =
      '<svg class="card-svg" viewBox="0 0 300 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + name + '">' +
        '<defs>' +
          '<linearGradient id="bg-' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
            '<stop class="face-stop-1" offset="0"/>' +
            '<stop class="face-stop-2" offset="1"/>' +
          '</linearGradient>' +
          '<radialGradient id="glow-' + uid + '" cx="0.5" cy="0.46" r="0.55">' +
            '<stop offset="0" stop-color="' + color + '" stop-opacity="0.5"/>' +
            '<stop offset="0.6" stop-color="' + color + '" stop-opacity="0.1"/>' +
            '<stop offset="1" stop-color="' + color + '" stop-opacity="0"/>' +
          '</radialGradient>' +
        '</defs>' +
        // 底色（主题色由 CSS 变量驱动，浅色/深色自动切换）
        '<rect x="5" y="5" width="290" height="470" rx="20" fill="url(#bg-' + uid + ')" stroke="' + color + '" stroke-width="3"/>' +
        // 内描边
        '<rect class="face-line" x="13" y="13" width="274" height="454" rx="14" fill="none" stroke-width="1.2" stroke-opacity="0.7"/>' +
        // 中央辉光
        '<circle cx="150" cy="222" r="120" fill="url(#glow-' + uid + ')"/>' +
        // 顶部角标
        '<text class="face-ink" x="26" y="50" font-family="Georgia, \'Times New Roman\', serif" font-size="26" font-weight="700">' + corner + '</text>' +
        // 顶部牌名（中文）
        '<text class="face-ink" x="150" y="46" text-anchor="middle" font-family="\'PingFang SC\',\'Microsoft YaHei\',sans-serif" font-size="24" font-weight="700" letter-spacing="2">' + name + '</text>' +
        // 英文副名
        '<text class="face-ink-soft" x="150" y="68" text-anchor="middle" font-family="Georgia, serif" font-size="12" letter-spacing="0.5" opacity="0.9">' + nameEn + '</text>' +
        // 中央大号象征符号（发光）
        '<text x="150" y="262" text-anchor="middle" font-size="120" dominant-baseline="middle">' + symbol + '</text>' +
        // 底部花色名
        '<text class="face-ink" x="150" y="430" text-anchor="middle" font-family="\'PingFang SC\',\'Microsoft YaHei\',sans-serif" font-size="20" font-weight="600" letter-spacing="3">' + suit + '</text>' +
        // 底部细装饰线
        '<line class="face-line" x1="80" y1="446" x2="220" y2="446" stroke-width="1" stroke-opacity="0.5"/>' +
        // 四角小星点
        '<circle class="face-line-fill" cx="24" cy="456" r="2" opacity="0.7"/>' +
        '<circle class="face-line-fill" cx="276" cy="456" r="2" opacity="0.7"/>' +
        '<circle class="face-line-fill" cx="24" cy="24" r="2" opacity="0.7"/>' +
        '<circle class="face-line-fill" cx="276" cy="24" r="2" opacity="0.7"/>' +
      '</svg>';
    return svg;
  }

  // 统一牌背：午夜蓝紫底 + 金色几何星纹 + 中央光芒
  function createCardBackSVG(uid) {
    uid = (uid != null ? String(uid) : 'back').replace(/[^a-zA-Z0-9_-]/g, '');
    var dots = '';
    // 星空点阵
    for (var i = 0; i < 26; i++) {
      var x = 24 + ((i * 53) % 252);
      var y = 30 + ((i * 97) % 420);
      var r = (i % 3 === 0) ? 1.8 : 1.1;
      dots += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#cdb8ff" opacity="' + (0.25 + (i % 4) * 0.12) + '"/>';
    }
    // 八芒星几何线
    var cx = 150, cy = 240;
    var rays = '';
    for (var a = 0; a < 8; a++) {
      var ang = (a * Math.PI) / 4;
      var x2 = cx + Math.cos(ang) * 92;
      var y2 = cy + Math.sin(ang) * 92;
      rays += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + GOLD + '" stroke-width="1" stroke-opacity="0.45"/>';
    }
    var svg =
      '<svg class="card-back-svg" viewBox="0 0 300 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="牌背">' +
        '<defs>' +
          '<linearGradient id="bbg-' + uid + '" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="#241a47"/>' +
            '<stop offset="1" stop-color="#0e0a26"/>' +
          '</linearGradient>' +
          '<radialGradient id="bglow-' + uid + '" cx="0.5" cy="0.5" r="0.5">' +
            '<stop offset="0" stop-color="#7c5cff" stop-opacity="0.5"/>' +
            '<stop offset="1" stop-color="#7c5cff" stop-opacity="0"/>' +
          '</radialGradient>' +
        '</defs>' +
        '<rect x="5" y="5" width="290" height="470" rx="20" fill="url(#bbg-' + uid + ')" stroke="' + GOLD + '" stroke-width="2.5"/>' +
        '<rect x="13" y="13" width="274" height="454" rx="14" fill="none" stroke="' + GOLD + '" stroke-width="1" stroke-opacity="0.6"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="150" fill="url(#bglow-' + uid + ')"/>' +
        dots +
        rays +
        // 双层八芒星
        '<circle cx="' + cx + '" cy="' + cy + '" r="64" fill="none" stroke="' + GOLD + '" stroke-width="1.4" stroke-opacity="0.85"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="40" fill="none" stroke="' + GOLD_SOFT + '" stroke-width="1" stroke-opacity="0.7"/>' +
        '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" font-size="58" dominant-baseline="middle">🌙</text>' +
        '<text x="150" y="446" text-anchor="middle" fill="' + GOLD_SOFT + '" font-family="\'PingFang SC\',sans-serif" font-size="15" letter-spacing="6" opacity="0.85">TAROT</text>' +
      '</svg>';
    return svg;
  }

  var api = {
    createCardSVG: createCardSVG,
    createCardBackSVG: createCardBackSVG,
    colorFor: colorFor,
    SUIT_COLORS: SUIT_COLORS
  };

  // 浏览器全局
  if (typeof global !== 'undefined') {
    global.CardSVG = api;
  }
  // Node（用于 build-data 校验，可选）
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : this);
