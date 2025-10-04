# AI伴聊 (CompanionAI)

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-AGPL--3.0-green.svg)
![Platform](https://img.shields.io/badge/platform-Android-brightgreen.svg)

**您的智能AI陪伴聊天助手**

[English](./README_EN.md) | 简体中文

</div>

---

## 📱 应用简介

AI伴聊是一款免费开源的AI聊天应用，支持多种主流AI模型（OpenAI、Claude、Gemini等），提供流畅的对话体验。

### ✨ 主要特性

- 🤖 **多模型支持**：OpenAI、Anthropic Claude、Google Gemini等
- 💬 **角色扮演**：自定义AI角色，打造专属聊天伙伴
- 🎨 **精美界面**：Material Design设计，支持深色模式
- 🚀 **144Hz优化**：流畅动画，丝滑体验
- 🔒 **隐私安全**：本地存储，数据不上传服务器
- 🌍 **完全开源**：AGPL-3.0协议，透明可信

---

## 📥 下载安装

### Android

- **最新版本**：[v1.0.0](https://github.com/ldl672773-ship-it/CompanionAI/releases/latest)
- **系统要求**：Android 7.0+ (API 24+)
- **推荐配置**：Android 11+，支持144Hz屏幕

### iOS

暂不支持（欢迎贡献）

---

## 🚀 快速开始

### 1. 安装应用

下载APK文件，在Android设备上安装

### 2. 配置API密钥

- 打开应用 → 设置 → 连接管理
- 选择您的AI服务提供商
- 输入API密钥

### 3. 开始聊天

- 创建新角色或使用默认角色
- 开始您的AI对话之旅！

---

## ⚖️ 法律声明

### 用户协议

**本应用完全免费，仅供个人学习、娱乐使用。**

- ✅ 允许：个人使用、学习、研究
- ❌ 禁止：违法用途、商业牟利（未经授权）
- ⚠️ 免责：AI生成内容不代表开发者立场

详细条款请查看：[用户协议与免责声明](./LEGAL_DOCS.md)

### 赞助说明

- 💖 **完全自愿**：无任何强制要求
- 🚫 **无回报承诺**：不提供特权或付费功能
- ⚠️ **风险提示**：通过个人微信收款，无法提供发票，赞助后无法退款

---

## 🛠️ 技术栈

- **框架**：React Native 0.79.5 + Expo SDK 53
- **架构**：React Native New Architecture (Fabric)
- **JS引擎**：Hermes
- **动画**：React Native Reanimated 3.17.4
- **数据库**：Expo SQLite + Drizzle ORM
- **状态管理**：Zustand
- **国际化**：i18next

---

## 📦 从源码构建

### 环境要求

- Node.js 18+
- JDK 17+
- Android SDK
- Bun / npm / yarn

### 克隆仓库

```bash
git clone https://github.com/ldl672773-ship-it/CompanionAI.git
cd CompanionAI
```

### 安装依赖

```bash
bun install
# 或
npm install
```

### 运行开发版本

```bash
bun run android
# 或
npm run android
```

### 构建发布版本

```bash
cd android
export NODE_ENV=production
./gradlew assembleRelease
```

APK位置：`android/app/build/outputs/apk/release/app-release.apk`

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 如何贡献

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交Pull Request

### 代码规范

- 使用ESLint + Prettier
- 遵循项目现有代码风格
- 添加必要的注释（第三人称，客观中立）

---

## 📜 开源协议

本项目采用 **AGPL-3.0** 开源协议。

### 基于项目

本项目基于 [ChatterUI](https://github.com/Vali-98/ChatterUI) 开发

- **原作者**：Vali-98
- **原项目协议**：AGPL-3.0
- **致谢**：感谢原作者的开源贡献！

### 协议要点

- ✅ 允许商业使用、修改、分发
- ✅ 必须开源修改后的代码
- ✅ 必须保留原作者版权声明
- ✅ 必须声明修改内容

详细条款：[LICENSE](./LICENSE)

---

## 📞 联系方式

- **开发者**：LDL
- **GitHub**：https://github.com/ldl672773-ship-it/CompanionAI
- **问题反馈**：[GitHub Issues](https://github.com/ldl672773-ship-it/CompanionAI/issues)

---

## 🙏 致谢

- [ChatterUI](https://github.com/Vali-98/ChatterUI) - 原始项目
- [Expo](https://expo.dev) - React Native开发框架
- [React Native](https://reactnative.dev) - 跨平台移动开发框架
- 所有开源贡献者

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=ldl672773-ship-it/CompanionAI&type=Date)](https://star-history.com/#ldl672773-ship-it/CompanionAI&Date)

---

<div align="center">

**如果您喜欢这个项目，请给个⭐Star支持一下！**

Made with ❤️ by LDL

</div>
