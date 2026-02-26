# 你画我猜 (Draw & Guess) - 多人实时在线版

一个基于 React + Node.js + Socket.IO 构建的实时多人在线「你画我猜」游戏。

---

## 🏗 项目架构

项目采用前后端分离架构，通过 WebSocket (Socket.IO) 实现全双工实时通信。

### 核心架构图
```mermaid
graph TD
    subgraph Client (React + Vite)
        UI[React Components] --> Hooks[Custom Hooks: useRoomSocket]
        Hooks --> SIOC[Socket.io-client]
    end

    subgraph Server (Node.js + Socket.io)
        SIOS[Socket.io Server] --> Handlers[registerHandlers.js]
        Handlers --> Engine[engine.js: Game Lifecycle]
        Engine --> Logic[gameLogic.js: Pure Logic]
        Engine --> Store[roomStore.js: State]
        Engine --> WM[wordManager.js: Vocabulary]
        WM --> AI[aiService.js: AI Hot Words]
    end

    SIOC <-- WebSocket (events.mjs) --> SIOS
```

### 模块说明
- **`client/`**: 基于 Vite 的 React 前端，使用 Tailwind/SCSS 进行样式管理。
- **`server/`**: 后端核心逻辑。
    - `index.js`: 服务启动入口。
    - `app.js`: Express 与 Socket.io 初始化。
    - `registerHandlers.js`: 集中管理所有 Socket 事件监听。
    - `engine.js`: 驱动游戏流程（回合切换、定时器管理）。
    - `gameLogic.js`: 纯逻辑层（得分计算、状态初始化），便于单元测试。
    - `roomStore.js`: 内存级房间状态管理。
    - `wordManager.js`: 词库管理，支持本地 JSON 与 AI 动态生成。
- **`shared/`**: 前后端共享的常量定义（如 `events.mjs`）。

---

## 📡 事件流 (Event Flow)

游戏核心流程遵循以下事件序列：

1. **加入房间**: `JOIN_ROOM` -> 服务端回传 `ROOM_STATE` 同步当前房间快照。
2. **开始游戏**: 房主发送 `START_GAME` -> 服务端广播 `CLEAR_CANVAS` + `SYSTEM_MESSAGE`。
3. **绘画同步**: 画家发送 `DRAW` -> 服务端广播 `DRAW` 给所有非画家玩家。
4. **猜词互动**: 玩家发送 `CHAT_MESSAGE` -> 服务端校验：
    - 猜对：广播 `SYSTEM_MESSAGE` 并触发 `ROOM_STATE` 更新分数。
    - 普通聊天：广播 `CHAT_MESSAGE`。
5. **回合切换**: 定时器触发或全员猜对 -> `engine.js` 自动切换 `drawerId` 并启动新回合。

---

## 🚀 快速开始

### 1. 环境准备
确保已安装 Node.js (建议 v18+)。

### 2. 安装与运行
在根目录下执行以下命令：

```bash
# 安装所有依赖 (根目录、Server、Client)
npm install && npm --prefix server install && npm --prefix client install

# 启动开发环境 (同时启动前后端)
npm run dev
```

- **前端地址**: `http://localhost:5173`
- **后端地址**: `http://localhost:3001`

### 3. 运行测试
项目已配置 Vitest 进行回归测试：

```bash
# 运行后端核心逻辑测试
npm run test
```

---

## 🛠 开发脚本

| 命令 | 说明 | 运行位置 |
| :--- | :--- | :--- |
| `npm run dev` | 启动前后端并发开发模式 | 根目录 |
| `npm run test` | 运行后端单元与集成测试 | 根目录 |
| `npm run build` | 构建前端生产版本 | 根目录 |
| `npm --prefix server run dev` | 仅启动后端服务 | 根目录 |
| `npm --prefix client run dev` | 仅启动前端服务 | 根目录 |

---

## 📝 开发者备注
- **状态管理**: 房间状态存储在服务端的 `roomStore.js` 中，客户端通过 `ROOM_STATE` 事件进行全量/增量更新。
- **扩展性**: 如需增加新的游戏规则，应优先在 `gameLogic.js` 中编写纯函数测试通过后，再集成到 `engine.js`。
