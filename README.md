# 全景播放器（纯前端）

一个无需后端的纯前端全景播放器，支持加载本地与服务器上的 360° 全景图片或视频（等距柱状/equirect）。**已针对iOS设备进行全面优化**。

## ✨ 主要功能
- 📱 **跨平台支持** - 完美支持桌面端、移动端和iOS设备
- 🎬 **媒体播放** - 支持本地和服务器上的全景图片/视频
- 🎮 **交互控制** - 鼠标拖动、触摸滑动、滚轮缩放
- 🎵 **音频控制** - 音量调节、静音切换
- 🖥️ **全屏模式** - 支持全屏观看体验
- 🎨 **画质选择** - 自动/低/中/高画质切换
- 📊 **性能优化** - 网络自适应、设备检测、性能监控
- 🔄 **镜像修正** - 自动修正常见左右镜像问题
- 📋 **媒体管理** - 支持manifest清单和直接URL输入

## 🚀 快速开始

### 本地使用
1. 直接双击 `index.html` 本地打开即可使用
2. **本地加载**：点击"打开图片/视频"，或将文件拖入页面中间区域
3. **服务器加载**：点击"从服务器选择"，默认读取 `/media/manifest.json`；也可直接输入完整 URL

### 操作指南
- **桌面端**：鼠标拖动浏览，滚轮缩放，空格键播放/暂停
- **移动端**：触摸滑动浏览，双指缩放，点击播放按钮
- **iOS设备**：已优化触摸交互，支持内联播放
- **快捷键**：Esc 关闭弹窗，空格键播放/暂停

### 支持的格式
- **图片**：jpg、jpeg、png、webp、gif、bmp（等距柱状/equirect 全景）
- **视频**：mp4、webm、ogv、ogg、mov、m3u8（取决于浏览器解码能力）

## 📋 服务器媒体与清单格式

### Manifest 清单
- **默认路径**：`/media/manifest.json`（可在弹窗中更改根路径）
- **格式**：JSON数组，支持字符串或对象格式

```json
[
  "samples/pano1.jpg",
  { "title": "样例全景视频", "path": "samples/pano-video.mp4", "type": "video" },
  { "title": "样例全景图片", "path": "https://cdn.example.com/pano2.jpg", "type": "image" }
]
```

### 目录索引
- 若没有清单，可启用目录索引（autoindex）
- 从浏览器复制文件 URL 后粘贴到"打开 URL"

## 🎛️ 界面与交互

### 弹窗与提示
- **服务器选择弹窗**：支持三种关闭方式（点击关闭、点击遮罩、按Esc）
- **智能提示**：成功加载媒体后自动隐藏中间提示；释放/停止时恢复显示
- **设备检测**：自动检测iOS、MIUI等设备并显示优化提示

### 镜像方向修正
- **自动修正**：对图片与视频纹理默认应用水平翻转修正
- **技术实现**：`wrapS=RepeatWrapping`、`center=(0.5,0.5)`、`repeat.x=-1`
- **自定义支持**：如需其他投影模式，可提供素材信息进行定制

## 🚀 部署指南

### Nginx 部署
1. **复制文件**：将项目所有静态文件复制到 Nginx 站点根目录（如 `/usr/share/nginx/html`）
2. **配置参考**：参考 `nginx.conf` 添加相应的 `server` 配置块
3. **媒体目录**：暴露服务器媒体目录

```nginx
location /media/ {
    autoindex on; # 若不想列目录可 off，并仅提供 manifest.json
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
    add_header Access-Control-Allow-Headers "*" always;
}
```

4. **重载服务**：
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Docker 部署
- 可通过 Docker 将宿主机目录挂载到 `/usr/share/nginx/html/media/`
- 确保 `root` 路径指向实际部署目录

## 📱 iOS设备优化

### 特殊优化
- **WebGL渲染**：针对iOS设备的特殊渲染设置
- **触摸交互**：优化触摸手势和滑动体验
- **视频播放**：支持内联播放，避免跳转系统播放器
- **性能优化**：降低渲染复杂度，提高流畅度
- **自动播放**：适配iOS的媒体播放限制

### 技术特性
- 设备自动检测（iOS、Safari、MIUI等）
- 智能画质选择（根据网络状况自动调整）
- 触摸事件优化（防止页面滚动冲突）
- 硬件加速支持

详细优化说明请参考 [IOS_OPTIMIZATION.md](./IOS_OPTIMIZATION.md)

## 🔧 技术说明

### 核心技术
- **Three.js**：通过 `TextureLoader`/`VideoTexture` 将全景资源贴在内表面球体上实现 360° 观看
- **WebGL**：硬件加速的3D渲染
- **纯前端**：完全静态资源，无需任何打包与构建流程

### 性能特性
- **自适应渲染**：根据设备性能自动调整渲染质量
- **网络优化**：根据网络状况自动选择画质
- **内存管理**：智能释放纹理和媒体资源
- **FPS监控**：实时性能监控和优化

### 兼容性
- **桌面端**：Chrome、Firefox、Safari、Edge
- **移动端**：iOS Safari、Android Chrome、MIUI浏览器
- **格式支持**：主流图片和视频格式

## 📁 项目结构

```
├── index.html          # 主页面
├── main.js            # 核心JavaScript代码
├── styles.css         # 样式文件
├── nginx.conf         # Nginx配置示例
├── docker-compose.yml # Docker部署配置
├── README.md          # 项目说明
├── IOS_OPTIMIZATION.md # iOS优化详细说明
└── media/             # 媒体文件目录
    └── manifest.json  # 媒体清单文件
```

## 🎯 使用场景

- **虚拟旅游**：展示景点、酒店、房产等全景内容
- **教育培训**：沉浸式学习体验
- **产品展示**：360°产品展示
- **娱乐体验**：全景视频观看
- **VR内容**：WebVR应用开发

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！


