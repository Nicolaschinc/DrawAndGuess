Original prompt: 优化一下当前项目移动端的样式，主要是布局显的不合理，有些地方表现得在很小的区域展示很多信息，你自己思考下怎么优化

- 使用技能: develop-web-game
- 初步发现: 移动端顶部信息层过密（房间/规则/分享/状态/玩家列表/词条），并且 chat-box 固定 35vh 导致画布空间不足。
- 计划: 1) 去掉移动端浮动词条并收敛到顶部信息区；2) 玩家列表默认折叠可展开；3) 移动端 chat 和 canvas 高度重新分配。
- 已完成改动:
  1) 移除移动端 floating word overlay，避免顶部信息叠加。
  2) 新增移动端玩家榜折叠按钮，默认折叠，按需展开。
  3) 移动端顶部改为垂直信息流（房间头部 -> 状态 -> 词条 -> 开始按钮 -> 玩家榜），降低单屏密度。
  4) 将头部规则按钮在移动端改为图标态，减少占位。
  5) 将移动端 chat-box 高度从固定 35vh 调整为 clamp(170px, 30dvh, 250px)，并允许画布占据更多空间（canvas min-height 0）。
- 验证:
  - `npm run build` 通过。
  - 尝试运行技能 Playwright 客户端失败：环境缺少 `playwright` 包（ERR_MODULE_NOT_FOUND）。
- 根据反馈追加优化:
  1) 将“开始游戏”和“玩家榜”合并到同一行（移动端双列，非房主时玩家榜单列）。
  2) 移动端道具特效改为前半段动效：在起点位置放大后淡出，不再飞向画家目标。
- 再次验证:
  - `npm run build` 通过。

- 2026-02-25（CSS Modules + Sass 重构）:
  1) 将 `client/src/styles.css` 迁移为 `client/src/styles.module.scss`，并将页面/组件全部改为模块化 class 引用。
  2) `main.jsx` 改为引入 `styles.module.scss`；`Home.jsx`、`GameRoom.jsx`、`ShareRedirect.jsx`、`GameUI.jsx` 完成 `className` 迁移到 `styles[...]`。
  3) 清理非必要行内样式：加载态卡片、Toast 弹窗布局等静态样式改为 CSS 类；保留颜色/尺寸/动画坐标等必要动态内联样式。
  4) `client/package.json` devDependencies 新增 `sass`，并同步更新 `client/package-lock.json`。
- 验证:
  - `npm --prefix client run build` 通过（Sass 编译正常）。

- 2026-02-25（房间退出功能）:
  1) 在 `GameRoom` 顶部操作区新增“退出房间”按钮（桌面文字+图标，移动端图标化）。
  2) 新增 `leaveRoom()`：二次确认后主动 `socket.disconnect()` 并 `navigate("/")` 返回首页。
  3) 在 `styles.module.scss` 增加 `leave-btn` 样式，包含移动端适配。
- 验证:
  - `npm --prefix client run build` 通过。

- 2026-02-25（头部操作按钮样式整理）:
  1) 将“分享 / 游戏规则 / 退出”统一为 `room-action-btn` 风格，统一尺寸、间距、描边和悬停反馈。
  2) 桌面端统一为图标+文字；移动端统一收敛为 34x34 图标按钮，减少拥挤。
  3) `退出` 按钮使用 `room-action-danger`，与普通操作按钮区分风险语义但保持版式一致。
- 验证:
  - `npm --prefix client run build` 通过。

- 2026-02-25（头部功能统一入口）:
  1) 将“分享 / 游戏规则 / 退出”改为一个统一入口按钮（`...`），点击后弹出功能面板。
  2) 面板内包含三项操作：分享房间、游戏规则、退出房间；保留退出危险态。
  3) 增加点击外部自动关闭，菜单行为与画布左上角工具栏一致（触发器 + 浮层）。
  4) 移动端收敛弹层尺寸与按钮高度，避免遮挡和拥挤。
- 验证:
  - `npm --prefix client run build` 通过。

- 2026-02-25（退出确认弹窗组件化）:
  1) 在 `GameUI.jsx` 抽象通用 `ConfirmModal`（复用项目现有 modal 样式体系）。
  2) 房间退出从 `window.confirm` 改为 `ConfirmModal`：支持自定义标题/文案/确认与取消按钮文本。
  3) 新增 `danger-btn` 样式用于危险确认动作（退出房间）。
- 验证:
  - `npm --prefix client run build` 通过。

- 2026-02-26（移动端全屏黑边 + AI 按钮显示时机）:
  1) 修复原生全屏时画布容器圆角/边框导致的四角黑色缝隙：为 `.canvas-wrap:fullscreen` 与 `-webkit-full-screen` 增加去圆角、去边框、去阴影与白底样式，并让全屏态 `.canvas` 去圆角。
  2) AI 参考图按钮去除“前 10 秒后才显示”限制，改为“当前玩家正在作画时立即显示”（`canDraw && word`）。
  3) 清理 `CanvasPanel` 中不再使用的 `roundEndsAt/roundDuration` 传参。
- 验证:
  - `npm --prefix client run build` 通过。
  - 按技能流程尝试 Playwright 客户端验证失败：缺少 `playwright` 依赖（`ERR_MODULE_NOT_FOUND`）。

- 2026-03-01（路由国际化重构）:
  1) 路由结构改为 `/:lang/*`，支持 `en/zh` 语言前缀；新增无前缀旧链接自动重定向（如 `/room/:id` -> `/:lang/room/:id`）。
  2) 新增 `client/src/utils/localeRoutes.js`，统一处理语言规范化、路径加前缀、路径换语言。
  3) 改造关键跳转与链接：Home 创建/加入房间、ShareRedirect、GameRoom 退出与加入失败回跳、Footer、静态页返回链接均保留当前语言。
  4) 语言切换器改为“切语言 + 切 URL”，确保 URL、i18n 状态和页面内容一致。
  5) 房间分享链接改为携带语言路径（`/:lang/share/:hash`）。
- 验证:
  - `npm --prefix client run build` 通过。
  - 按技能流程检查 Playwright 客户端可用性失败：运行 `$WEB_GAME_CLIENT --help` 报错缺少 `playwright` 包（`ERR_MODULE_NOT_FOUND`）。

- 2026-03-01（平台发行构建）:
  1) 新增 `build:platform` 构建脚本：`VITE_ROUTER_BASE=/ vite build --base=./`，确保平台发行时资源使用相对路径且路由以根路径为基准。
  2) `App.jsx` 增加 `VITE_ROUTER_BASE` 覆盖支持，并在 `BASE_URL` 为 `./` 时自动回退到 `/` 以避免路由基准异常。
- 验证:
  - 按技能流程检查 Playwright 客户端可用性失败：运行 `$WEB_GAME_CLIENT --help` 报错缺少 `playwright` 包（`ERR_MODULE_NOT_FOUND`）。

- 2026-03-06（TDD 优化前端参考图加载）:
  - 当前用户请求: 用 TDD 的方法来优化当前项目的前端部分。
  1) 为 `client/src/pages/GameRoom/referenceImagesState.js` 新增纯函数状态机，拆出词语规范化、是否应发起请求、缓存复用和请求结果归并逻辑。
  2) 为上述逻辑补充 Node 原生测试 `client/src/pages/GameRoom/referenceImagesState.test.js`，先以失败用例定义行为，再完成实现。
  3) `CanvasPanel.jsx` 改为延迟加载 AI 参考图：只有画家真正打开参考图弹窗时才请求接口，不再在每次拿到 `word` 后立即请求。
  4) 新增同词缓存复用：同一轮或切回相同词语时直接复用已加载图片，避免重复请求。
  5) 处理过期/中断请求：关闭弹窗或切词时中止当前请求，并避免旧请求覆盖当前词语的展示结果。
  6) 为前端测试补最小命令入口：`client/package.json` 新增 `npm run test`（`node --test`），根目录新增 `npm run test:client`。
- 验证:
  - `node --test client/src/pages/GameRoom/referenceImagesState.test.js` 先失败（缺少实现）后通过。
  - `npm --prefix client run test` 通过。
  - `npm --prefix client run build` 通过。
  - 按技能流程再次检查 Playwright 客户端失败：本机仍缺少 `playwright` 包，`$WEB_GAME_CLIENT` 无法启动（`ERR_MODULE_NOT_FOUND`）。
- TODO / 建议:
  - 若要继续按技能要求做端到端回归，需要先补齐 `playwright` 依赖。
  - 可继续把 `CanvasPanel` 的参考图请求提炼成独立 hook，并为 UI 层补组件测试（当前先覆盖了核心状态逻辑）。

- 2026-03-07（补齐 Playwright + 浏览器回归链路）:
  1) 按 `develop-web-game` 技能要求，为共享脚本可解析路径安装 `playwright`：`npm install playwright --prefix ~/.codex`。
  2) 下载 Playwright Chromium / headless shell：`npx --prefix ~/.codex playwright install chromium`，使 `$WEB_GAME_CLIENT` 可真实启动浏览器。
  3) 以 `http://127.0.0.1:5174/drawguess/zh/room/<roomId>` 为目标，使用技能客户端验证“加入房间 -> 截图 -> 收集控制台错误”链路。
  4) 额外跑了一条原生 Playwright DOM smoke：验证房间标题、菜单项、玩家数、画布可见且无 console/page error；产物在 `output/playwright-dom-smoke/`。
  5) 为提高后续 E2E 可观察性，新增 `client/src/pages/GameRoom/renderGameToText.js` 与测试 `renderGameToText.test.js`，在 `GameRoom/index.jsx` 暴露 `window.render_game_to_text` 与一个简单的 `window.advanceTime(ms)` 等待钩子。
  6) 浏览器回归第一次命中了真实回归：新增 `useEffect` 放在条件返回之后，触发 React hooks 顺序错误；随后已将该 effect 移回所有条件返回之前并修复。
- 验证:
  - `npm --prefix client run test` 通过（6 个 Node 测试）。
  - `npm --prefix client run build` 通过。
  - 技能客户端 smoke 产物：
    - `output/web-game-smoke/shot-0.png`：成功加入房间后抓到画布截图。
    - `output/web-game-state/state-0.json`：成功输出结构化房间状态，无 `errors-0.json`。
  - 原生 Playwright smoke 产物：
    - `output/playwright-dom-smoke/room-page.png`
    - `output/playwright-dom-smoke/summary.json`
- TODO / 建议:
  - 现在 Playwright 基础环境已就绪，后续可以继续补“多玩家 join/start/guess”场景，而不是只停留在单人入房 smoke。
  - `window.advanceTime(ms)` 当前只是等待钩子，不是确定性模拟时钟；若后续要做更强的交互回归，可继续为房间状态或画布更新补更可控的测试接口。

- 2026-03-07（修复参考图跨域加载失败）:
  1) 定位到参考图接口 `/api/reference-images` 返回的是相对路径 `/api/proxy-image?...`，当前端与后端分域部署时，浏览器会错误地向前端域名请求图片，导致“参考图一直无法生成”。
  2) 在 `client/src/pages/GameRoom/referenceImagesState.js` 新增 `resolveReferenceImageUrls()`，统一把相对图片地址解析为基于 `SERVER_URL` 的绝对地址，同时保留已是绝对地址的返回值。
  3) `CanvasPanel.jsx` 在消费 `/api/reference-images` 响应时改为先做 URL 归一化，再写入参考图状态。
  4) 为该行为补充测试，覆盖“相对代理图地址在跨域部署下必须指向后端域名”的场景。
- 验证:
  - `npm --prefix client run test` 通过（7 个 Node 测试）。
  - `npm --prefix client run build` 通过。
- TODO / 建议:
  - 这次修复解决的是前端地址解析问题；如果线上后端本身拿不到 Bing 图片，需再看服务端 `/api/proxy-image` 日志。

- 2026-03-07（修复参考图请求被前端 effect 自己中断）:
  1) 复现结果：画家点击“AI 参考图”后，弹窗会一直停在“正在生成参考图...”，但 `/api/reference-images` 已经返回成功。
  2) 根因定位：`CanvasPanel.jsx` 的参考图请求 `useEffect` 把 `referenceState.loading` 放进依赖数组；`request-start` 触发后组件立即重渲染，effect cleanup 先执行并中止了刚发出的 fetch，导致请求被自己取消，界面永久卡在 loading。
  3) 修复方式：`shouldFetchReferenceImages()` 不再把 `loading` 当作是否可发起请求的条件；同时将 `referenceState.loading` 从参考图请求 effect 的依赖中移除，避免 `request-start` 造成自取消。
  4) 为该行为补了回归测试：未缓存词语在请求进行中仍保持“应当拉取”的资格，避免再次引入同类 effect 依赖回归。
- 验证:
  - `npm --prefix client run test` 通过（8 个 Node 测试）。
  - `npm --prefix client run build` 通过。
  - 本地 Playwright 双端验证通过：一名浏览器玩家 + 一名 `socket.io-client` 模拟玩家进入同房，房主开始游戏后点击参考图按钮，弹窗成功显示 3 张图片。
  - 验证产物:
    - `output/reference-debug/host-reference-modal.png`
    - `output/reference-debug/events.json`
  - 额外跑了技能客户端 smoke，产物在 `output/web-game-reference-smoke/shot-0.png`。

- 2026-03-07（SEO 基础优化）:
  1) 新增 `client/src/components/SeoHead.jsx`，统一输出页面级 `title`、`description`、`canonical`、`hreflang`、`og:*`、`twitter:*` 和可选 `JSON-LD`。
  2) 首页与静态页（About / Privacy / Contact）接入新的 SEO 头部；分享跳转页保留 `noindex,nofollow`，避免无意义路由被抓取。
  3) 首页新增结构化数据：`VideoGame` + `FAQPage`，提升搜索结果对产品类型和常见问题的理解。
  4) 统一站点公开域名到 `https://playflowpulse.com/drawguess`，修复旧的 `drawandguess.com` canonical / og / sitemap 残留。
  5) 更新 `client/public/robots.txt` 与 `client/public/sitemap.xml`：加入 sitemap 声明，并按当前 `en/zh` 国际化路由输出可抓取地址与 alternate 语言映射。
- 验证:
  - `npm --prefix client run build` 通过。
- TODO / 建议:
  - 当前仍是 CSR SPA。若目标是显著提升搜索流量，下一步应补预渲染或静态落地页，而不是只停留在 meta 标签层。

- 2026-03-07（方案 A：静态预渲染）:
  1) 新增 `client/src/entry-server.jsx`，使用 React SSR + `MemoryRouter` + `HelmetProvider` + 独立 i18n 实例，对首页和静态页做构建时渲染。
  2) 新增 `client/scripts/prerender.mjs`：在客户端构建完成后，读取 `dist/index.html` 模板并为以下路由生成静态 HTML：
     - `/en`
     - `/zh`
     - `/en/about`
     - `/zh/about`
     - `/en/privacy`
     - `/zh/privacy`
     - `/en/contact`
     - `/zh/contact`
  3) `client/package.json` 的 `build` 已升级为三段式流水线：`build:client -> build:ssr -> prerender`。
  4) 新增 `client/src/i18nResources.js`，让浏览器 i18n 和 prerender SSR 共享同一份翻译资源，避免双份文案配置漂移。
  5) `vite.config.js` 为 SSR 构建声明 `noExternal`，确保 `react-helmet-async` / `react-i18next` / `i18next` 在预渲染阶段可正常执行。
- 验证:
  - `npm --prefix client run build` 通过。
  - 生成文件存在：
    - `client/dist/en/index.html`
    - `client/dist/zh/index.html`
    - `client/dist/en/about/index.html`
    - `client/dist/zh/about/index.html`
    - `client/dist/en/privacy/index.html`
    - `client/dist/zh/privacy/index.html`
    - `client/dist/en/contact/index.html`
    - `client/dist/zh/contact/index.html`
  - `vite preview` 下访问 `/drawguess/en/` 可返回带正文和页面级 meta 的完整 HTML。
- TODO / 建议:
  - 若线上对 `/drawguess/en`（无尾斜杠）没有自动落到目录 `index.html`，应在 Nginx 加一个补充重定向或目录回落规则，避免请求落回 SPA 根壳。

- 2026-03-07（Agent Skills 文章实践：营销增长 / SEO 方法验证）:
  1) 根据文章建议，新增仓库级营销上下文文件 `.agents/product-marketing-context.md`，明确产品定位、目标用户、SEO 目标、话术边界和当前能力，避免后续代理产出泛化营销文案。
  2) 新增本地 skill `.agents/skills/drawguess-home-seo-refresh/SKILL.md`，把首页 SEO/转化优化流程沉淀为可复用步骤：先读项目上下文，再审首页可见内容、schema 对齐、内链、双语文案和构建验证。
  3) 将该流程直接实践到首页：`Home.jsx` 增加首屏说明文案、Why play / How it works / FAQ / Learn more 四块可抓取内容；FAQ 可见文案与既有 FAQ JSON-LD 对齐；补 About / Privacy / Contact 内链；同步更新中英文 locale 与首页样式。
  4) 产出总结文档 `docs/skills-practice-validation.md`，记录这次实践验证了什么、哪些点确实有用、哪些结论还需要真实搜索流量数据才能证明。
- 验证:
  - `npm --prefix client run build` 通过。
  - 预渲染产物 `client/dist/en/index.html` 与 `client/dist/zh/index.html` 已包含新增首页正文区块，说明这次改动对爬虫可见，不只是 CSR 运行时内容。
- 结论:
  - 文章里“Skill + 项目上下文 + 可复用工作流”的方法在这个项目上是实用的，尤其适合把一次性的 SEO/营销判断沉淀成后续可重复执行的流程。
  - 目前能验证的是“内容质量和工程落地效率提升”；还不能验证“自然流量增长 / 排名提升 / 搜索转化提升”，这些需要上线后结合 Search Console 与分析数据继续看。

- 2026-03-07（整站 SEO 扩展：features / use-cases / faq）:
  1) 新增三类可索引静态页：`/:lang/features`、`/:lang/use-cases`、`/:lang/faq`，分别承接功能意图、场景意图和问答意图。
  2) 更新首页 “Learn more” 区块与 Footer 内链，把新页面纳入站内链接结构，不再只依赖首页 + 关于/隐私/联系三页。
  3) 更新 prerender 路由与 `sitemap.xml`，保证新增页面能被构建成静态 HTML 并进入站点地图。
  4) 新增 `docs/sitewide-seo-strategy.md`，记录整站 SEO 扩展思路和上线后的观察指标。
- 验证:
  - 待本轮 `npm --prefix client run build` 完成后检查 `client/dist/en/features/index.html`、`client/dist/en/use-cases/index.html`、`client/dist/en/faq/index.html` 以及对应中文页面是否生成。
- 结果补充:
  - `npm --prefix client run build` 已通过。
  - 新增预渲染产物已确认存在：`client/dist/en/features/index.html`、`client/dist/en/use-cases/index.html`、`client/dist/en/faq/index.html` 及中文对应页面。
  - 新增 `docs/launch-metrics-playbook.md`，整理上线后通过 Search Console / GA4 观察索引、查询、CTR、自然流量和从 SEO 到开房/开局的转化路径。

- 2026-03-08（UI 试点：按技能链路验证移动端房间布局）:
  1) 按 `web-design-guidelines` 审视房间页相关文件，优先锁定一个结构问题：移动端玩家面板和聊天同时占位，导致画布舞台感不足；同时补记两个基础可访问性问题：全局 focus ring 被移除、多个 icon-only 关闭按钮缺少 `aria-label`。
  2) 按 `vercel-react-best-practices` 的“小范围、避免状态重复”思路做试点重构：在 `GameRoom` 顶层增加 `mobilePanel` 单一状态，移动端玩家按钮切换 `chat / players` 两个面板；当玩家面板打开时隐藏聊天区，把垂直空间还给画布。
  3) 同轮顺手修复基础可访问性：为全局 `:focus-visible` 补回可见焦点样式；为规则/确认/参考图/加入房间弹窗关闭按钮补 `aria-label`。
- 验证:
  - `npm --prefix client run build` 通过。
  - `develop-web-game` 技能客户端已跑通房间 smoke：`output/web-game-mobile-layout-smoke/shot-0.png`、`output/web-game-mobile-layout-smoke/state-0.json`。
  - 由于技能客户端默认更偏画布截图，额外补了最小 Playwright 移动端整页验证：`output/mobile-room-trial/chat-default.png`、`output/mobile-room-trial/players-open.png`、`output/mobile-room-trial/summary.json`。
  - 移动端验证结果：
    - 初始聊天面板可见
    - 点击玩家按钮后聊天面板隐藏
    - 玩家列表保持可见
- 结论:
  - 这条“先审视 -> 小范围重构 -> 真页验证”的流程是有效的，适合继续扩到房间页其它块，而不是一次性大改全站。

- 2026-03-08（UI 第二试点：桌面端房间页信息层级）:
  1) 延续同一技能链路，只做桌面端结构，不改核心行为逻辑：把左侧信息区拆成两张卡片（房间状态卡、玩家信息卡），把右侧聊天区单独包装为卡片，并增加简短上下文文案，强化“画布是主舞台、聊天是辅面板”的层级。
  2) `PlayerList` 增加桌面端 panel heading 和玩家数量摘要；`GameRoom` 在桌面端为聊天面板增加说明文案（画家/猜词者视角不同）。
  3) `room.module.scss` 为桌面端补卡片容器、spacing 和 grid 调整：左侧列更像 sidebar，聊天列更像 secondary panel，画布继续保持最大面积。
- 验证:
  - `npm --prefix client run build` 通过。
  - 桌面端 Playwright 整页截图产物：
    - `output/desktop-room-trial/desktop-room.png`
    - `output/desktop-room-trial/summary.json`
  - 验证摘要：
    - `sidebarCards = 2`
    - `chatCards = 1`
    - panel headers: `Players`, `Chat Messages`
- 结论:
  - 第二个试点同样有效，说明这条技能流程不仅适用于移动端压缩布局，也适用于桌面端信息层级优化。

- 2026-03-08（UI 第三试点：跨页面视觉语言统一）:
  1) 不改业务逻辑，只统一视觉语气：收窄强个性 display font 的使用范围，让首页、静态页、弹窗、页脚、工具栏回到同一套更中性的国际化字体与卡片语义。
  2) 首页保留现有暖色品牌方向，但提升一致性：hero 标题字重/字号更稳，卡片阴影和 hover 更统一，banner 区背景更像产品容器而不是单独贴图区域。
  3) 静态页从“文档页气质”往“同品牌落地页气质”靠：统一边框、圆角、阴影、正文色、链接色、表单边框和主按钮样式。
  4) 弹窗与工具栏同步收敛到同一视觉系统：边框、背景、关闭按钮、面板底色和悬停反馈更接近首页/房间页。
- 验证:
  - `npm --prefix client run build` 通过。
  - 跨页面截图产物：
    - `output/visual-language-pass/home.png`
    - `output/visual-language-pass/features.png`
    - `output/visual-language-pass/room.png`
- 结论:
  - 第三个试点也成立，说明当前这套技能流程不仅能处理局部布局问题，也能逐步把整站视觉语言收敛成一个更统一、更加全球化的产品形象。

- 2026-03-08（UI 继续阶段：语言切换器 / 工具栏 / 页脚统一补丁）:
  1) 继续按 `web-design-guidelines` 收尾剩余的系统级不一致点，优先挑三个跨页面反复出现的元素：语言切换器、画布工具栏浮层、页脚链接区。
  2) 按 `vercel-react-best-practices` 的低风险原则，只改视觉语义和可访问性，不改页面数据流或游戏逻辑：语言切换器按钮与下拉菜单回到同一套边框/阴影/hover 体系；工具栏弹层和关闭按钮与全站 modal/card 语义对齐；页脚增加更稳定的分隔和悬停反馈；为画布工具栏弹层关闭按钮补 `aria-label`。
- 验证:
  - `npm --prefix client run build` 通过。
  - 本地 Playwright 截图产物：
    - `output/visual-language-pass-2/home.png`
    - `output/visual-language-pass-2/features.png`
    - `output/visual-language-pass-2/room.png`
    - `output/visual-language-pass-2/room-mobile.png`
    - `output/visual-language-pass-2/summary.json`
  - 摘要结果确认首页、Features 页和房间页都已成功加载；移动端聊天面板可见。`playerToggleVisible` 在本轮摘要里为 `false`，更像是验证脚本选择器过窄，未见对应布局回归证据。
- 结论:
  - 这轮补丁稳定，说明当前流程适合继续从“结构性问题”转向“系统级细节统一”；后续可以继续精修房间页状态栏、首页 hero 和中英文排版细节，而不用再怀疑方法本身。
