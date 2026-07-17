/*
 * build-data.js — tarot.json 校验 / 整理（可选）
 * 用法: node scripts/build-data.js
 * 校验项: 总数=78、22 大阿卡纳 + 56 小阿卡纳、id 唯一、字段完整、正逆位与关键词齐备。
 * 通过则打印统计；发现问题打印明细并以非零码退出。
 */
'use strict';

var fs = require('fs');
var path = require('path');

var FILE = path.join(__dirname, '..', 'data', 'tarot.json');

function fail(msg) {
  console.error('❌ ' + msg);
  process.exit(1);
}

var raw;
try {
  raw = fs.readFileSync(FILE, 'utf8');
} catch (e) {
  fail('读取失败: ' + FILE + ' (' + e.message + ')');
}

var data;
try {
  data = JSON.parse(raw);
} catch (e) {
  fail('JSON 解析失败: ' + e.message);
}

if (!Array.isArray(data)) fail('tarot.json 顶层应为数组');

var errors = [];
var ids = {};

var REQUIRED = ['id', 'name', 'nameEn', 'arcana', 'suit', 'element', 'symbol', 'upright', 'reversed', 'keywordsUp', 'keywordsRev'];

data.forEach(function (c, i) {
  var at = '第 ' + (i + 1) + ' 张';
  REQUIRED.forEach(function (k) {
    if (c[k] == null || c[k] === '') errors.push(at + ' 缺少字段 ' + k);
  });
  if (c.arcana !== 'major' && c.arcana !== 'minor') {
    errors.push(at + ' (' + (c.id || '?') + ') arcana 非法: ' + c.arcana);
  }
  if (c.arcana === 'major') {
    if (typeof c.number !== 'number' || c.number < 0 || c.number > 21) errors.push(at + ' 大阿卡纳 number 越界: ' + c.number);
    if (!c.roman) errors.push(at + ' (' + c.name + ') 大阿卡纳缺少 roman');
  } else {
    if (typeof c.number !== 'number' || c.number < 1 || c.number > 14) errors.push(at + ' 小阿卡纳 number 越界: ' + c.number);
  }
  if (ids[c.id]) errors.push('id 重复: ' + c.id);
  ids[c.id] = true;
  if (!Array.isArray(c.keywordsUp) || c.keywordsUp.length === 0) errors.push(at + ' (' + c.name + ') keywordsUp 为空');
  if (!Array.isArray(c.keywordsRev) || c.keywordsRev.length === 0) errors.push(at + ' (' + c.name + ') keywordsRev 为空');
});

var major = data.filter(function (c) { return c.arcana === 'major'; }).length;
var minor = data.filter(function (c) { return c.arcana === 'minor'; }).length;
var suits = {};
data.forEach(function (c) { if (c.arcana === 'minor') suits[c.suit] = (suits[c.suit] || 0) + 1; });

if (data.length !== 78) errors.push('总数应为 78，实际 ' + data.length);
if (major !== 22) errors.push('大阿卡纳应为 22，实际 ' + major);
if (minor !== 56) errors.push('小阿卡纳应为 56，实际 ' + minor);
Object.keys(suits).forEach(function (s) {
  if (suits[s] !== 14) errors.push('花色 ' + s + ' 应为 14 张，实际 ' + suits[s]);
});

if (errors.length) {
  console.error('校验未通过，问题 ' + errors.length + ' 项:');
  errors.forEach(function (e) { console.error('  - ' + e); });
  process.exit(1);
}

console.log('✅ 校验通过');
console.log('   总数: ' + data.length + ' (大阿卡纳 ' + major + ' + 小阿卡纳 ' + minor + ')');
console.log('   花色: ' + Object.keys(suits).map(function (s) { return s + ' ' + suits[s]; }).join(' / '));
console.log('   所有牌均含 正位/逆位 释义与关键词，id 唯一。');
