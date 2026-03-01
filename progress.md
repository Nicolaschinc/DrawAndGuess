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
