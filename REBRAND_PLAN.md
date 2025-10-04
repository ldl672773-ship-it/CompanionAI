# AI伴聊 (CompanionAI) 品牌重塑计划

## 修改清单

### 1. Android包名和目录结构
- [x] 修改 package.json: chatterui → companionai, 0.8.8 → 1.0.0
- [x] 修改 android/app/build.gradle: 
  - namespace: com.Vali98.ChatterUI → com.ldl.companionai
  - applicationId: com.Vali98.ChatterUI → com.ldl.companionai
  - versionName: 0.8.8 → 1.0.0
- [ ] 创建新包目录: android/app/src/main/java/com/ldl/companionai/
- [ ] 移动 MainActivity.kt 并修改 package 声明
- [ ] 修改 AndroidManifest.xml 中的包名引用

### 2. 应用名称
- [ ] 修改 app.json/app.config.ts 中的应用名称
- [ ] 修改 AndroidManifest.xml 中的 app_name
- [ ] 修改 strings.xml 中的应用名称

### 3. 关于页面
- [ ] 修改开发者信息为 LDL
- [ ] 添加原作者致谢（Vali-98/ChatterUI）
- [ ] 更新版本信息
- [ ] 添加开源协议声明

### 4. 法律合规
- [ ] 首次启动用户协议弹窗
- [ ] 赞助/打赏页面（合规声明）
- [ ] 免责声明页面
- [ ] 隐私政策页面

### 5. 开源合规
- [ ] 创建 LICENSE 文件（AGPL-3.0）
- [ ] 创建 README.md（中文）
- [ ] 添加原作者版权声明
- [ ] 准备 GitHub 仓库

---

**注意**: 由于包名修改，需要完全重新构建并卸载旧版本再安装新版本。
