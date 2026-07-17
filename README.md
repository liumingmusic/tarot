# 塔罗牌 · 照见内心的趣味指引

一个**纯静态、零构建、完全离线**的塔罗牌小站，定位为**自我觉察 / 心理投射的趣味指引工具**（非宿命式占卜）。

- 经典 78 张塔罗牌义（22 大阿卡纳 + 56 小阿卡纳），全部内置、离线可用。
- 运行时**参数化 SVG 牌面**：深底金字、象征符号发光，**不引用任何外部图片、不依赖任何 API / key**。
- 四种牌阵：每日一牌 / 三张牌 / 关系牌阵 / 凯尔特十字（10 张）。
- 洗牌 → 抽牌 → 翻牌动画（CSS 3D flip）→ 正位 / 逆位解读 → 牌义详情浮层。
- 深色神秘学主题，桌面与手机端（≤720px）均良好适配，手机端禁缩放、无横向溢出。
- 支持将本次结果保存到 `localStorage` 历史。

## 目录结构

```
tarot/
├── index.html
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── app.js          # 主逻辑：选阵、洗牌、抽牌、翻牌、解读渲染
│       └── card-svg.js     # 参数化生成牌面 SVG（牌名/数字/花色象征/主色）
├── data/
│   └── tarot.json          # 78 张牌义（核心数据集）
├── scripts/
│   └── build-data.js       # 校验/整理 tarot.json
├── package.json
├── .gitignore
└── README.md
```

## 本地运行

需要通过本地服务器访问（浏览器对 `file://` 下的 `fetch` 有跨域限制）：

```bash
cd tarot
npm run start          # = python3 -m http.server 8080
# 然后浏览器打开 http://localhost:8080
```

或任选静态服务器：`npx serve` / `php -S localhost:8080` 等。

## 校验数据

```bash
npm run validate       # = node scripts/build-data.js
```

会检查总数 = 78、22 大阿卡纳 + 56 小阿卡纳、各花色 14 张、id 唯一、字段完整、正逆位与关键词齐备。

## 技术要点

- **牌面生成**：`card-svg.js` 接收 `{name, nameEn, roman|number, suit, symbol, color}` 返回 SVG 牌面；大阿卡纳主色统一神秘紫 `#7c5cff`，四花色按元素取色（权杖🔥橙红 / 圣杯🍷蓝 / 宝剑⚔️银灰 / 星币🌟金绿）。翻牌由 CSS `rotateY(180deg)` 实现，逆位牌面额外 `rotate(180deg)`。
- **抽牌**：`fetch('data/tarot.json')` 载入 → Fisher–Yates 洗牌 → 按牌阵取前 N 张 → 每张约 50% 概率判定逆位。
- **响应式**：`viewport` 设 `maximum-scale=1, user-scalable=no, viewport-fit=cover`；`html, body { overflow-x: hidden }`；牌面 `aspect-ratio` 自适应；触控件 ≥ 44px；凯尔特十字在手机端改为横向滚动不挤压。

## 部署

本应用完全前端驱动、无需构建，可直接托管到任意静态空间（GitHub Pages / Vercel / Netlify / 对象存储）。

GitHub Pages 步骤：
1. 将本目录推送到仓库（如 `tarot`）的 `main` 分支根目录。
2. 仓库 Settings → Pages → Source 选择 `main` / `root` → Save。
3. 等待构建完成后访问 `https://<用户名>.github.io/tarot/`。

## 免责声明

本工具用于娱乐与自我反思，不构成任何专业建议（心理、医疗、财务等）。牌义整理自经典塔罗知识，请带着开放与好奇去体会，而非作为命运定论。
