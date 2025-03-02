# ChatBox - 现代化聊天应用

ChatBox是一个基于React和Tauri构建的现代化聊天应用，支持与AI助手进行对话。应用采用了流式响应技术，提供了流畅的用户体验和美观的界面设计。

- ✨ **多主题支持** - 现在支持32种精美主题，包括明亮、暗黑、赛博朋克等风格
- 👤 **用户个性化** - 添加用户名显示和头像上传功能
- 🖼️ **头像预览** - 优化的头像上传界面，支持实时预览
- ⚙️ **快捷设置** - 新增设置按钮，方便快速访问系统设置
- 🔄 **即时主题切换** - 主题切换后立即生效，无需刷新页面
- 🤖 **多AI提供商** - 支持OpenAI服务提供商

## 功能特点

- 🚀 **流式响应** - 实时显示AI回复，无需等待完整响应
- 🌓 **丰富主题** - 支持32种精美主题，满足不同用户的审美需求
- 📝 **Markdown支持** - 完整支持Markdown格式，包括代码高亮
- 💬 **多对话管理** - 创建和管理多个独立对话
- ✏️ **对话重命名** - 点击对话名称可以进行重命名
- 📋 **代码复制** - 一键复制代码块内容
- 🔄 **上下文记忆** - AI助手能够记住对话上下文
- 📱 **响应式设计** - 适配不同屏幕尺寸的设备
- 📜 **自动滚动** - 新消息到达时自动滚动到最新位置
- 👤 **用户个性化** - 自定义用户名和头像，增强个人体验
- 🔌 **多服务提供商** - 支持OpenAIAI服务提供商
- 🔍 **模型自动获取** - 自动获取并列出各服务提供商的可用模型
- 🔄 **动态切换模型** - 在对话过程中随时切换不同的AI模型

## 技术栈

- **前端框架**: React + TypeScript
- **构建工具**: Vite
- **桌面应用**: Tauri
- **样式**: Tailwind CSS + DaisyUI
- **AI集成**: AI SDK
- **代码高亮**: React Syntax Highlighter
- **Markdown渲染**: React Markdown

## 快速开始

### 前提条件

- Node.js 16+
- Rust (用于Tauri)
- Bun (推荐，但可选)

### 安装

克隆仓库

```bash
git clone https://github.com/SliverKeigo/chatbox.git
cd chatbox
```

安装依赖

```bash
# 使用npm
npm install

# 或使用bun
bun install
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

## 许可证

本项目采用MIT许可证 - 详情请参见[LICENSE](LICENSE)文件。

## 致谢

- [AI SDK](https://sdk.vercel.ai/)
- [Tailwind CSS](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)
- [Tauri](https://tauri.app/)
- [React](https://reactjs.org/)
- [Groq](https://groq.com/)
- [Ollama](https://ollama.ai/)
