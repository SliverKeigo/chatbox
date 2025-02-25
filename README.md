# ChatBox - 现代化聊天应用

ChatBox是一个基于React和Tauri构建的现代化聊天应用，支持与AI助手进行对话。应用采用了流式响应技术，提供了流畅的用户体验和美观的界面设计。

![ChatBox应用截图](./screenshot.png)

## 功能特点

- 🚀 **流式响应** - 实时显示AI回复，无需等待完整响应
- 🌓 **亮暗主题切换** - 支持亮色和暗色主题，自动适配系统主题
- 📝 **Markdown支持** - 完整支持Markdown格式，包括代码高亮
- 💬 **多对话管理** - 创建和管理多个独立对话
- ✏️ **对话重命名** - 点击对话名称可以进行重命名
- 📋 **代码复制** - 一键复制代码块内容
- 🔄 **上下文记忆** - AI助手能够记住对话上下文
- 📱 **响应式设计** - 适配不同屏幕尺寸的设备
- 📜 **自动滚动** - 新消息到达时自动滚动到最新位置

## 技术栈

- **前端框架**: React + TypeScript
- **构建工具**: Vite
- **桌面应用**: Tauri
- **样式**: Tailwind CSS + DaisyUI
- **AI集成**: Vercel AI SDK
- **代码高亮**: React Syntax Highlighter
- **Markdown渲染**: React Markdown

## 快速开始

### 前提条件

- Node.js 16+
- Rust (用于Tauri)
- Bun (推荐，但可选)

### 安装

1. 克隆仓库

```bash
git clone https://github.com/yourusername/chatbox.git
cd chatbox
```

2. 安装依赖

```bash
# 使用npm
npm install

# 或使用bun
bun install
```

3. 创建环境变量文件

复制`.env.example`文件为`.env`，并填入您的API密钥：

```
API_KEY=your_api_key_here
```

### 开发

启动开发服务器：

```bash
# 使用npm
npm run dev

# 或使用bun
bun run dev
```

### 构建

构建生产版本：

```bash
# 使用npm
npm run build

# 或使用bun
bun run build
```

构建Tauri桌面应用：

```bash
# 使用npm
npm run tauri build

# 或使用bun
bun run tauri build
```

## 使用指南

### 创建新对话

点击侧边栏顶部的"+"按钮创建新对话。

### 发送消息

在底部输入框中输入消息，按回车键发送。

### 修改对话名称

点击对话标题可以编辑对话名称，按回车保存或按ESC取消。

### 切换主题

点击右上角的主题切换按钮可以在亮色和暗色主题之间切换。

### 复制代码

代码块右上角有复制按钮，点击即可复制代码内容。

## 贡献指南

欢迎贡献代码、报告问题或提出新功能建议！请遵循以下步骤：

1. Fork本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个Pull Request

## 许可证

本项目采用MIT许可证 - 详情请参见[LICENSE](LICENSE)文件。

## 致谢

- [Vercel AI SDK](https://sdk.vercel.ai/)
- [Tailwind CSS](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)
- [Tauri](https://tauri.app/)
- [React](https://reactjs.org/)
