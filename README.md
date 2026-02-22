# 多人你画我猜 (React)

一个可多人连线的「你画我猜」小游戏，采用 React + Socket.IO。

## 功能
- 多人加入同一房间
- 房主可开始游戏
- 轮流画图、其他玩家猜词（简体中文词条）
- 即时画布同步
- 即时计分与排行榜
- 聊天消息与系统通知

## 项目结构
- `client/` React (Vite) 前端
- `server/` Node + Express + Socket.IO 后端

## 安装与启动
在项目根目录执行：

```bash
npm install
npm --prefix server install
npm --prefix client install
npm run dev
```

启动后：
- 前端: http://localhost:5173
- 后端: http://localhost:3001

可开两个以上浏览器分页，使用相同房间 ID 测试多人连线。·
