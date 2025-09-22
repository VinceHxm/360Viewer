# 全景播放器（纯前端）

一个功能丰富的纯前端全景播放器，支持加载本地与服务器上的 360° 全景图片或视频（等距柱状/equirect）。无需后端支持，可直接部署为静态网站。

## ✨ 主要功能

### 📁 媒体加载
- **本地文件支持**：点击按钮或拖拽方式加载本地图片/视频
- **服务器媒体**：支持 manifest 清单文件与直接 URL 输入
- **格式支持**：
  - 图片：JPG、PNG、WebP（等距柱状/equirect 全景）
  - 视频：MP4、WebM、OGG（取决于浏览器解码能力）

### 🎮 交互控制
- **360° 视角**：鼠标拖动/触摸滑动浏览全景
- **缩放功能**：滚轮缩放，支持 30°-100° 视野范围
- **移动端优化**：完整的手势支持，包括双指缩放和单指拖拽
- **键盘快捷键**：空格键播放/暂停，Esc 关闭弹窗

### 🎬 视频播放控制
- **播放控制**：播放/暂停/停止按钮
- **进度条**：可拖拽的进度条，支持跳转到指定时间
- **时间显示**：当前时间/总时长显示
- **音量控制**：音量滑块和静音按钮
- **全屏模式**：支持全屏播放，移动端优化

### 🎨 画质与性能
- **智能画质选择**：自动/低/中/高画质选项
- **网络自适应**：根据网络速度自动调整画质
- **加载进度**：实时显示加载进度条
- **性能优化**：FPS 监控和渲染优化

### 📱 移动端特性
- **响应式设计**：完美适配各种屏幕尺寸
- **触摸手势**：支持单指拖拽、双指缩放
- **移动端优化**：隐藏不必要的控制元素，优化触摸体验
- **全屏支持**：移动端全屏播放优化

## 🚀 快速开始

### 本地使用
1. **直接打开**：双击 `index.html` 即可在浏览器中运行
2. **本地文件**：
   - 点击"打开图片/视频"按钮选择文件
   - 或直接将文件拖拽到页面中央区域
3. **操作方式**：
   - 🖱️ **桌面端**：鼠标拖动浏览，滚轮缩放
   - 📱 **移动端**：单指拖拽浏览，双指缩放
   - ⌨️ **快捷键**：空格键播放/暂停，Esc 关闭弹窗

### 服务器部署
1. **清单模式**：点击"从服务器选择"，默认读取 `/media/manifest.json`
2. **直接 URL**：在弹窗中输入完整的图片/视频 URL
3. **目录浏览**：启用 Nginx autoindex，复制文件 URL 使用

### 画质选择
- **自动画质**：根据网络速度自动调整（推荐）
- **低画质**：快速加载，适合慢速网络
- **中画质**：平衡画质与加载速度
- **高画质**：最佳画质，需要良好网络

## 📋 服务器媒体与清单格式

### Manifest 清单文件
默认请求路径：`/media/manifest.json`（可在弹窗中更改根路径）

清单为 JSON 数组格式，支持两种元素类型：

**简单格式**（字符串）：
```json
[
  "samples/pano1.jpg",
  "samples/pano-video.mp4",
  "https://cdn.example.com/pano2.jpg"
]
```

**详细格式**（对象）：
```json
[
  {
    "title": "样例全景视频",
    "path": "samples/pano-video.mp4",
    "type": "video"
  },
  {
    "title": "样例全景图片",
    "path": "https://cdn.example.com/pano2.jpg",
    "type": "image"
  }
]
```

### 目录浏览模式
若没有清单文件，可启用 Nginx 目录索引（autoindex），从浏览器复制文件 URL 后粘贴到"打开 URL"输入框。

## 🎛️ 用户界面特性

### 弹窗与提示
- **服务器选择弹窗**：支持三种关闭方式
  - 点击右上角"关闭"按钮
  - 点击遮罩空白区域
  - 按 Esc 键
- **智能提示**：
  - 成功加载媒体后，中间提示自动隐藏
  - 停止播放或释放资源时，提示重新显示
  - 加载过程中显示进度条和状态信息

### 镜像方向修正
- **自动修正**：对图片与视频纹理默认应用水平翻转修正
  - `wrapS=RepeatWrapping`
  - `center=(0.5,0.5)`
  - `repeat.x=-1`
- **避免左右颠倒**：自动处理常见的镜像问题
- **自定义支持**：如发现方向仍不符合预期，可根据素材来源与格式进行定制调整

## 🚀 部署指南

### Nginx 部署
1. **复制文件**：将项目所有静态文件复制到 Nginx 站点根目录
   ```bash
   cp -r * /usr/share/nginx/html/
   ```

2. **配置 Nginx**：添加或修改站点配置
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /usr/share/nginx/html;
       index index.html;
       
       # 媒体文件配置
       location /media/ {
           autoindex on; # 启用目录浏览
           add_header Access-Control-Allow-Origin "*" always;
           add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
           add_header Access-Control-Allow-Headers "*" always;
       }
       
       # 静态文件缓存
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

3. **重启服务**：
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

### Docker 部署
```bash
# 使用 Docker 挂载媒体目录
docker run -d \
  --name nginx-panorama \
  -p 80:80 \
  -v /path/to/media:/usr/share/nginx/html/media \
  -v /path/to/project:/usr/share/nginx/html \
  nginx:alpine
```

### 其他部署方式
- **Apache**：配置虚拟主机，启用 mod_rewrite
- **CDN**：上传到 CDN 服务，配置 CORS 头
- **静态托管**：支持 GitHub Pages、Netlify、Vercel 等

## 🔧 技术架构

### 核心技术
- **Three.js**：WebGL 3D 图形库，版本 0.160.0
- **全景渲染**：通过 `TextureLoader`/`VideoTexture` 将全景资源贴在内表面球体上
- **纯前端**：无需后端支持，完全静态资源部署

### 技术特性
- **WebGL 渲染**：硬件加速的 3D 渲染
- **响应式设计**：CSS Grid + Flexbox 布局
- **移动端优化**：触摸事件处理和手势识别
- **性能监控**：FPS 监控和渲染优化
- **网络优化**：智能画质选择和加载进度显示

### 浏览器兼容性
- **现代浏览器**：Chrome 60+、Firefox 55+、Safari 12+、Edge 79+
- **移动浏览器**：iOS Safari 12+、Android Chrome 60+
- **WebGL 支持**：需要 WebGL 1.0 或 2.0 支持

### 文件结构
```
360Video/
├── index.html          # 主页面
├── main.js            # 核心逻辑
├── styles.css         # 样式文件
├── test.html          # 测试页面
└── README.md          # 说明文档
```

## 📄 许可证
本项目采用 MIT 许可证，可自由使用、修改和分发。

## 🤝 贡献
欢迎提交 Issue 和 Pull Request 来改进项目！

## 📞 支持
如有问题或建议，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件反馈
