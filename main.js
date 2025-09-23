(function () {
  /** @type {HTMLDivElement} */
  const viewerEl = document.getElementById('viewer');
  /** @type {HTMLButtonElement} */
  const openButton = document.getElementById('openButton');
  /** @type {HTMLInputElement} */
  const fileInput = document.getElementById('fileInput');
  /** @type {HTMLButtonElement} */
  const serverPickerButton = document.getElementById('serverPickerButton');
  /** @type {HTMLButtonElement} */
  const playPauseButton = document.getElementById('playPauseButton');
  /** @type {HTMLButtonElement} */
  const stopButton = document.getElementById('stopButton');
  /** @type {HTMLInputElement} */
  const seekBar = document.getElementById('seekBar');
  /** @type {HTMLSpanElement} */
  const timeCurrent = document.getElementById('timeCurrent');
  /** @type {HTMLSpanElement} */
  const timeTotal = document.getElementById('timeTotal');
  /** @type {HTMLDivElement} */
  const serverPicker = document.getElementById('serverPicker');
  /** @type {HTMLButtonElement} */
  const serverPickerClose = document.getElementById('serverPickerClose');
  /** @type {HTMLInputElement} */
  const serverBaseInput = document.getElementById('serverBaseInput');
  /** @type {HTMLButtonElement} */
  const loadManifestBtn = document.getElementById('loadManifestBtn');
  /** @type {HTMLUListElement} */
  const mediaList = document.getElementById('mediaList');
  /** @type {HTMLInputElement} */
  const directUrlInput = document.getElementById('directUrlInput');
  /** @type {HTMLButtonElement} */
  const openDirectUrlBtn = document.getElementById('openDirectUrlBtn');
  // Sidebar elements
  /** @type {HTMLInputElement} */
  const sidebarBaseInput = document.getElementById('sidebarBaseInput');
  /** @type {HTMLButtonElement} */
  const sidebarLoadBtn = document.getElementById('sidebarLoadBtn');
  /** @type {HTMLButtonElement} */
  const tabVideos = document.getElementById('tabVideos');
  /** @type {HTMLButtonElement} */
  const tabImages = document.getElementById('tabImages');
  /** @type {HTMLUListElement} */
  const videoList = document.getElementById('videoList');
  /** @type {HTMLUListElement} */
  const imageList = document.getElementById('imageList');
  /** @type {HTMLSelectElement} */
  const qualitySelector = document.getElementById('qualitySelector');
  /** @type {HTMLDivElement} */
  const loadingProgress = document.getElementById('loadingProgress');
  /** @type {HTMLDivElement} */
  const playerControls = document.getElementById('playerControls');
  /** @type {HTMLDivElement} */
  const seekTooltip = document.getElementById('seekTooltip');
  /** @type {HTMLButtonElement} */
  const fullscreenButton = document.getElementById('fullscreenButton');
  /** @type {HTMLButtonElement} */
  const muteButton = document.getElementById('muteButton');

  let scene, camera, renderer;
  let sphereMesh = null;
  let currentTexture = null;
  /** @type {HTMLVideoElement|null} */
  let videoEl = null;
  /** @type {HTMLDivElement|null} */
  const hintEl = document.querySelector('.hint');
  
  // 性能监控
  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 60;

  // View state
  let isPointerDown = false;
  let startX = 0, startY = 0;
  let lon = 0, lat = 0;
  let targetLon = 0, targetLat = 0;
  let fov = 75;
  
  // 移动端手势状态
  let isMobile = false;
  let touchStartTime = 0;
  let touchStartDistance = 0;
  let lastTouchDistance = 0;
  let isGestureActive = false;
  
  // 网络优化状态
  let networkSpeed = 'unknown';
  let currentQuality = 'auto';
  let loadingProgressValue = 0;
  let isStreamingMode = false;
  
  // 音量控制状态
  let isMuted = false;
  let lastVolume = 40; // 默认音量40%
  
  // 全屏状态
  let isFullscreen = false;
  
  // 浏览器检测
  let isMIUI = false;
  let isXiaomi = false;
  let isIOS = false;
  let isSafari = false;
  let isMacOSSafari = false;

  init();
  animate();

  function init() {
    // 检测移动端
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 检测iOS设备
    isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // 检测Safari浏览器（包括macOS Safari）
    isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/i.test(navigator.userAgent);
    
    // 检测macOS Safari
    isMacOSSafari = isSafari && /Macintosh/i.test(navigator.userAgent);
    
    // 检测安卓设备
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    // 检测MIUI浏览器和小米设备
    isMIUI = /MiuiBrowser|MIUI/i.test(navigator.userAgent) || 
             (isMobile && /Xiaomi|Redmi/i.test(navigator.userAgent));
    isXiaomi = /Xiaomi|Redmi|MIUI/i.test(navigator.userAgent);
    
    console.log('设备检测:', { isMobile, isIOS, isAndroid, isSafari, isMacOSSafari, isMIUI, isXiaomi, userAgent: navigator.userAgent });
    
    // 安卓设备特殊提示
    if (isAndroid) {
      console.log('检测到安卓设备，应用安卓优化设置');
      
      // 显示安卓用户提示
      setTimeout(() => {
        const tip = document.createElement('div');
        tip.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 20px;
          border-radius: 10px;
          z-index: 10000;
          text-align: center;
          max-width: 300px;
          font-size: 14px;
        `;
        tip.innerHTML = `
          <div>检测到安卓设备</div>
          <div style="margin-top: 10px; font-size: 12px;">
            安卓优化已启用：<br>
            1. 视频纹理优化<br>
            2. WebGL渲染优化<br>
            3. 视频属性适配<br>
            4. 性能优化设置
          </div>
          <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 5px;">知道了</button>
        `;
        document.body.appendChild(tip);
        
        // 5秒后自动关闭
        setTimeout(() => {
          if (tip.parentElement) tip.remove();
        }, 5000);
      }, 2000);
    }
    
    // Safari浏览器特殊提示（包括iOS和macOS）
    if (isIOS || isMacOSSafari) {
      if (isIOS) {
        console.log('检测到iOS设备，应用iOS优化设置');
      } else if (isMacOSSafari) {
        console.log('检测到macOS Safari浏览器，应用Safari优化设置');
      }
      
      // 显示Safari用户提示
      setTimeout(() => {
        const tip = document.createElement('div');
        tip.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 20px;
          border-radius: 10px;
          z-index: 10000;
          text-align: center;
          max-width: 300px;
          font-size: 14px;
        `;
        const deviceType = isIOS ? 'iOS设备' : 'macOS Safari';
        tip.innerHTML = `
          <div>检测到${deviceType}</div>
          <div style="margin-top: 10px; font-size: 12px;">
            Safari优化已启用：<br>
            1. 视频内联播放<br>
            2. 触摸手势优化<br>
            3. 自动播放策略适配<br>
            4. 右侧边栏优化
          </div>
          <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 5px;">知道了</button>
        `;
        document.body.appendChild(tip);
        
        // 5秒后自动关闭
        setTimeout(() => {
          if (tip.parentElement) tip.remove();
        }, 5000);
      }, 2000);
    }
    
    // MIUI浏览器特殊提示
    if (isMIUI || isXiaomi) {
      console.log('检测到MIUI浏览器，建议设置：');
      console.log('1. 在浏览器设置中关闭"视频加速"');
      console.log('2. 在浏览器设置中关闭"硬件加速"');
      console.log('3. 在浏览器设置中开启"强制使用H5播放器"');
      
      // 显示用户提示
      setTimeout(() => {
        const tip = document.createElement('div');
        tip.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 20px;
          border-radius: 10px;
          z-index: 10000;
          text-align: center;
          max-width: 300px;
          font-size: 14px;
        `;
        tip.innerHTML = `
          <div>检测到MIUI浏览器</div>
          <div style="margin-top: 10px; font-size: 12px;">
            如果视频调用系统播放器，请在浏览器设置中：<br>
            1. 关闭"视频加速"<br>
            2. 关闭"硬件加速"<br>
            3. 开启"强制使用H5播放器"
          </div>
          <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 5px;">知道了</button>
        `;
        document.body.appendChild(tip);
        
        // 5秒后自动关闭
        setTimeout(() => {
          if (tip.parentElement) tip.remove();
        }, 5000);
      }, 2000);
    }
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(fov, viewerEl.clientWidth / viewerEl.clientHeight, 0.1, 1100);
    camera.target = new THREE.Vector3(0, 0, 0);

    // iOS设备特殊WebGL设置
    const webglOptions = {
      antialias: !isMobile, // 移动端关闭抗锯齿提高性能
      alpha: true,
      powerPreference: isMobile ? "low-power" : "high-performance",
      preserveDrawingBuffer: false
    };
    
    // iOS设备特殊处理
    if (isIOS) {
      webglOptions.antialias = false; // iOS设备关闭抗锯齿
      webglOptions.powerPreference = "low-power"; // iOS设备使用低功耗模式
      webglOptions.preserveDrawingBuffer = true; // iOS设备保持绘制缓冲区
    }
    
    // 安卓设备特殊处理
    if (isAndroid) {
      webglOptions.antialias = false; // 安卓设备关闭抗锯齿
      webglOptions.preserveDrawingBuffer = true; // 安卓设备保持绘制缓冲区
      webglOptions.alpha = false; // 安卓设备关闭alpha通道
    }
    
    renderer = new THREE.WebGLRenderer(webglOptions);
    
    // 移动端优化像素比
    let pixelRatio = isMobile ? Math.min(window.devicePixelRatio || 1, 1.5) : Math.min(window.devicePixelRatio || 1, 2);
    
    // iOS设备特殊像素比处理
    if (isIOS) {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1); // iOS设备限制像素比
    }
    
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(viewerEl.clientWidth, viewerEl.clientHeight);
    
    // 优化渲染设置
    renderer.shadowMap.enabled = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    
    // iOS设备特殊渲染设置
    if (isIOS) {
      renderer.sortObjects = false; // iOS设备禁用对象排序
      renderer.autoClear = true; // iOS设备启用自动清除
    }
    
    viewerEl.appendChild(renderer.domElement);

    // 移动端优化球体几何体 - 进一步减少面数
    let sphereSegments = isMobile ? 24 : 32;
    let sphereRings = isMobile ? 16 : 24;
    
    // iOS设备特殊优化
    if (isIOS) {
      sphereSegments = 16; // iOS设备进一步减少面数
      sphereRings = 12;
    }
    
    const sphere = new THREE.SphereGeometry(500, sphereSegments, sphereRings);
    // 反转法线，用 BackSide 在内侧查看
    const material = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
    sphereMesh = new THREE.Mesh(sphere, material);
    scene.add(sphereMesh);
    
    console.log('球体几何体创建完成，面数:', sphere.attributes.position.count / 3);
    console.log('移动端模式:', isMobile);

    bindInteractions();
    window.addEventListener('resize', onResize);
    onResize();
    
    // Safari浏览器特殊resize处理
    if (isIOS || isMacOSSafari) {
      window.addEventListener('resize', () => {
        setTimeout(() => {
          const sidebar = document.getElementById('sidebar');
          if (sidebar && sidebar.offsetWidth === 0) {
            console.log('Safari浏览器resize后修复sidebar');
            sidebar.style.display = 'flex';
            sidebar.style.width = 'clamp(200px, 35vw, 300px)';
          }
        }, 100);
      });
    }
    
    // 初始化网络优化
    initNetworkOptimization();
    
    // Safari浏览器特殊初始化（包括iOS和macOS）
    if (isIOS || isMacOSSafari) {
      initSafariOptimizations();
    }
  }

  function bindInteractions() {
    // Open button
    openButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      loadFile(file);
      // reset input to allow reselecting same file
      fileInput.value = '';
    });

    // Drag & drop
    ;['dragenter','dragover'].forEach(evt => viewerEl.addEventListener(evt, e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }));
    ;['dragleave','drop'].forEach(evt => viewerEl.addEventListener(evt, e => { e.preventDefault(); }));
    viewerEl.addEventListener('drop', e => {
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) loadFile(file);
    });

    // Pointer controls (支持触摸)
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    
    // 移动端触摸支持 - 使用专门的手势处理
    if (isMobile) {
      renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
      renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
      renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: false });
    }

    // Wheel zoom
    viewerEl.addEventListener('wheel', e => {
      e.preventDefault();
      const delta = e.deltaY * 0.05;
      fov = THREE.MathUtils.clamp(fov + delta, 30, 100);
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }, { passive: false });

    // Keyboard
    viewerEl.addEventListener('keydown', e => {
      if (e.code === 'Space') togglePlayPause();
    });

    // Playback buttons
    playPauseButton.addEventListener('click', togglePlayPause);
    stopButton.addEventListener('click', stopPlayback);
    // Seek bar
    if (seekBar) {
      let isSeeking = false;
      seekBar.addEventListener('input', () => {
        if (!videoEl) return;
        isSeeking = true;
        const t = (seekBar.valueAsNumber / 1000) * (videoEl.duration || 0);
        timeCurrent.textContent = formatTime(t);
      });
      seekBar.addEventListener('change', () => {
        if (!videoEl) return;
        const t = (seekBar.valueAsNumber / 1000) * (videoEl.duration || 0);
        try { videoEl.currentTime = t; } catch {}
        isSeeking = false;
      });
      // 同步渲染时更新（如果没有在拖动）
      const _render = renderer.render.bind(renderer);
      renderer.render = (sc, cam) => {
        if (videoEl && !isSeeking && isFinite(videoEl.duration) && videoEl.duration > 0) {
          const ratio = videoEl.currentTime / videoEl.duration;
          seekBar.value = String(Math.max(0, Math.min(1000, Math.round(ratio * 1000))));
          timeCurrent.textContent = formatTime(videoEl.currentTime);
          timeTotal.textContent = formatTime(videoEl.duration);
        }
        _render(sc, cam);
      };
    }

    // Server picker UI（容错绑定）
    if (serverPickerButton) serverPickerButton.addEventListener('click', openServerPicker);
    if (serverPickerClose) serverPickerClose.addEventListener('click', closeServerPicker);
    if (serverPicker) serverPicker.addEventListener('click', (e) => { if (e.target === serverPicker) closeServerPicker(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !isServerPickerHidden()) closeServerPicker(); });
    if (loadManifestBtn) loadManifestBtn.addEventListener('click', async () => {
      const base = (serverBaseInput.value || '/media/').replace(/\/$/, '') + '/';
      try {
        const resp = await fetch(base + 'manifest.json', { cache: 'no-cache' });
        if (!resp.ok) throw new Error('manifest not found');
        const data = await resp.json();
        renderMediaList(base, Array.isArray(data) ? data : (data.items || []));
      } catch (e) {
        alert('加载清单失败：' + (e && e.message ? e.message : 'unknown'));
      }
    });
    if (openDirectUrlBtn) openDirectUrlBtn.addEventListener('click', () => {
      const url = (directUrlInput.value || '').trim();
      if (!url) return;
      openServerUrl(url);
      closeServerPicker();
    });

    // Sidebar tabs
    if (tabVideos && tabImages && videoList && imageList) {
      tabVideos.addEventListener('click', () => switchTab('video'));
      tabImages.addEventListener('click', () => switchTab('image'));
    }
    if (sidebarLoadBtn) {
      sidebarLoadBtn.addEventListener('click', () => loadSidebar(sidebarBaseInput.value || '/media/'));
    }
    
    // 画质选择器
    if (qualitySelector) {
      qualitySelector.addEventListener('change', (e) => {
        currentQuality = e.target.value;
        console.log('画质选择:', currentQuality);
        // 如果当前有媒体在加载，重新加载
        if (currentTexture) {
          const currentUrl = videoEl ? videoEl.src : (currentTexture.image ? currentTexture.image.src : '');
          if (currentUrl) {
            if (videoEl) {
              loadVideo(currentUrl);
            } else {
              loadImage(currentUrl);
            }
          }
        }
      });
    }
    
    // 全屏按钮
    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', toggleFullscreen);
    }
    
    // 静音按钮
    if (muteButton) {
      muteButton.addEventListener('click', toggleMute);
    }
    
    // 进度条悬停提示
    if (seekBar && seekTooltip) {
      seekBar.addEventListener('mousemove', (e) => {
        if (!videoEl || !videoEl.duration) return;
        
        const rect = seekBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const time = percent * videoEl.duration;
        
        seekTooltip.textContent = formatTime(time);
        seekTooltip.style.left = (percent * 100) + '%';
      });
    }
    
    // 音量控制
    const volumeSlider = document.querySelector('.volume-slider');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        if (videoEl) {
          const volume = e.target.value / 100;
          videoEl.volume = volume;
          videoEl.muted = volume == 0;
          
          // 更新静音状态
          isMuted = volume == 0;
          lastVolume = e.target.value;
          updateMuteButton();
        }
      });
    }
  }

  function isServerPickerHidden() {
    return !serverPicker || serverPicker.hasAttribute('hidden') || serverPicker.style.display === 'none';
  }

  function openServerPicker() {
    if (!serverPicker) return;
    serverPicker.removeAttribute('hidden');
    serverPicker.style.display = 'flex';
    if (serverBaseInput) serverBaseInput.value = serverBaseInput.value || '/media/';
    if (mediaList) mediaList.innerHTML = '';
  }

  function closeServerPicker() {
    if (!serverPicker) return;
    serverPicker.setAttribute('hidden', '');
    serverPicker.style.display = 'none';
  }

  function setHintVisible(visible) {
    if (!hintEl) return;
    hintEl.style.display = visible ? 'block' : 'none';
  }

  function updatePlayButtonIcon(isPlaying) {
    if (!playPauseButton) return;
    
    const svg = playPauseButton.querySelector('svg');
    if (!svg) return;
    
    if (isPlaying) {
      // 暂停图标
      svg.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    } else {
      // 播放图标
      svg.innerHTML = '<path d="M8 5v14l11-7z"/>';
    }
  }

  function showPlayerControls(show) {
    if (!playerControls) return;
    // 播放控制栏始终显示，但根据媒体类型调整可用性
    playerControls.style.display = 'block';
    
    // 根据媒体类型调整控制栏状态
    if (show && videoEl) {
      // 视频模式：启用所有控制
      playPauseButton.disabled = false;
      stopButton.disabled = false;
      if (seekBar) seekBar.disabled = false;
    } else {
      // 图片模式：禁用播放控制
      playPauseButton.disabled = true;
      stopButton.disabled = true;
      if (seekBar) seekBar.disabled = true;
    }
  }

  function updateMuteButton() {
    if (!muteButton) return;
    
    const svg = muteButton.querySelector('svg');
    if (!svg) return;
    
    if (isMuted) {
      // 静音图标
      svg.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
      muteButton.classList.add('muted');
    } else {
      // 正常音量图标
      svg.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
      muteButton.classList.remove('muted');
    }
  }

  function toggleMute() {
    if (!videoEl) return;
    
    isMuted = !isMuted;
    
    if (isMuted) {
      // 静音
      lastVolume = videoEl.volume * 100;
      videoEl.muted = true;
      const volumeSlider = document.querySelector('.volume-slider');
      if (volumeSlider) volumeSlider.value = 0;
    } else {
      // 取消静音
      videoEl.muted = false;
      videoEl.volume = lastVolume / 100;
      const volumeSlider = document.querySelector('.volume-slider');
      if (volumeSlider) volumeSlider.value = lastVolume;
    }
    
    updateMuteButton();
  }

  function updateFullscreenButton() {
    if (!fullscreenButton) return;
    
    const enterIcon = fullscreenButton.querySelector('.player-icon--enter');
    const exitIcon = fullscreenButton.querySelector('.player-icon--exit');
    
    if (isFullscreen) {
      if (enterIcon) enterIcon.style.display = 'none';
      if (exitIcon) exitIcon.style.display = 'block';
    } else {
      if (enterIcon) enterIcon.style.display = 'block';
      if (exitIcon) exitIcon.style.display = 'none';
    }
  }

  // Safari浏览器特殊优化初始化（包括iOS和macOS）
  function initSafariOptimizations() {
    console.log('初始化Safari浏览器优化');
    
    // 确保sidebar在iOS设备上可见
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.style.display = 'flex';
      sidebar.style.visibility = 'visible';
      sidebar.style.opacity = '1';
      sidebar.style.position = 'absolute';
      sidebar.style.right = '0';
      sidebar.style.top = '0';
      sidebar.style.bottom = '0';
      sidebar.style.zIndex = '100';
      sidebar.style.width = 'clamp(200px, 35vw, 300px)';
      
      // 强制重绘
      sidebar.style.transform = 'translateZ(0)';
      sidebar.style.webkitTransform = 'translateZ(0)';
    }
    
    // 延迟检查sidebar是否可见
    setTimeout(() => {
      if (sidebar && sidebar.offsetWidth === 0) {
        console.warn('Safari浏览器sidebar不可见，尝试修复');
        sidebar.style.display = 'flex';
        sidebar.style.width = '250px';
        sidebar.style.minWidth = '200px';
      }
    }, 100);
  }

  // 网络优化相关函数
  function initNetworkOptimization() {
    // 检测网络连接
    if ('connection' in navigator) {
      const connection = navigator.connection;
      networkSpeed = connection.effectiveType || 'unknown';
      console.log('网络类型:', networkSpeed, '下行速度:', connection.downlink, 'Mbps');
      
      // 根据网络速度自动选择画质
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        currentQuality = 'low';
        if (qualitySelector) qualitySelector.value = 'low';
      } else if (connection.effectiveType === '3g') {
        currentQuality = 'medium';
        if (qualitySelector) qualitySelector.value = 'medium';
      } else {
        currentQuality = 'high';
        if (qualitySelector) qualitySelector.value = 'high';
      }
    }
    
    // 监听网络变化
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        const connection = navigator.connection;
        networkSpeed = connection.effectiveType || 'unknown';
        console.log('网络状态变化:', networkSpeed);
        
        // 自动调整画质
        if (currentQuality === 'auto') {
          if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            currentQuality = 'low';
          } else if (connection.effectiveType === '3g') {
            currentQuality = 'medium';
          } else {
            currentQuality = 'high';
          }
          if (qualitySelector) qualitySelector.value = currentQuality;
        }
      });
    }
  }

  function showLoadingProgress(show, progress = 0, text = '加载中...') {
    if (!loadingProgress) return;
    
    if (show) {
      loadingProgress.style.display = 'flex';
      const progressFill = loadingProgress.querySelector('.progress-fill');
      const progressText = loadingProgress.querySelector('.progress-text');
      if (progressFill) progressFill.style.width = progress + '%';
      if (progressText) progressText.textContent = text;
    } else {
      loadingProgress.style.display = 'none';
    }
  }

  function getOptimizedUrl(originalUrl, quality = currentQuality) {
    if (!originalUrl) return originalUrl;
    
    // 如果是本地文件或已经包含质量参数的URL，直接返回
    if (originalUrl.startsWith('blob:') || originalUrl.startsWith('file:')) {
      return originalUrl;
    }
    
    try {
      // 尝试解析URL，如果是相对路径则转换为绝对路径
      let url;
      if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
        url = new URL(originalUrl);
      } else {
        // 相对路径，使用当前页面作为base
        url = new URL(originalUrl, window.location.origin);
      }
      
      // 根据画质选择添加参数
      switch (quality) {
        case 'low':
          url.searchParams.set('quality', 'low');
          url.searchParams.set('width', '1024');
          break;
        case 'medium':
          url.searchParams.set('quality', 'medium');
          url.searchParams.set('width', '2048');
          break;
        case 'high':
          url.searchParams.set('quality', 'high');
          url.searchParams.set('width', '4096');
          break;
        case 'auto':
          // 根据网络速度自动选择
          if (networkSpeed === 'slow-2g' || networkSpeed === '2g') {
            url.searchParams.set('quality', 'low');
            url.searchParams.set('width', '1024');
          } else if (networkSpeed === '3g') {
            url.searchParams.set('quality', 'medium');
            url.searchParams.set('width', '2048');
          } else {
            url.searchParams.set('quality', 'high');
            url.searchParams.set('width', '4096');
          }
          break;
      }
      
      return url.toString();
    } catch (error) {
      console.warn('URL解析失败，使用原始URL:', error);
      return originalUrl;
    }
  }

  function onPointerDown(e) {
    // 移动端使用专门的触摸处理
    if (isMobile) return;
    
    isPointerDown = true;
    startX = e.clientX;
    startY = e.clientY;
  }
  
  function onPointerMove(e) {
    // 移动端使用专门的触摸处理
    if (isMobile) return;
    
    if (!isPointerDown) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    startX = e.clientX;
    startY = e.clientY;
    
    // 优化旋转灵敏度，减少卡顿
    const sensitivity = 0.08; // 降低灵敏度
    targetLon -= dx * sensitivity;
    targetLat += dy * sensitivity;
    targetLat = THREE.MathUtils.clamp(targetLat, -85, 85);
  }
  
  function onPointerUp() {
    // 移动端使用专门的触摸处理
    if (isMobile) return;
    
    isPointerDown = false;
  }

  // 移动端专用触摸事件处理
  function onTouchStart(e) {
    e.preventDefault();
    
    const touch = e.touches[0];
    if (!touch) return;
    
    touchStartTime = Date.now();
    startX = touch.clientX;
    startY = touch.clientY;
    
    // iOS设备特殊处理
    if (isIOS) {
      // iOS设备禁用默认的触摸行为
      e.stopPropagation();
    }
    
    // 检测多点触控（双指缩放）
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      touchStartDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      lastTouchDistance = touchStartDistance;
      isGestureActive = true;
      return;
    }
    
    isPointerDown = true;
    isGestureActive = false;
  }
  
  function onTouchMove(e) {
    e.preventDefault();
    
    // iOS设备特殊处理
    if (isIOS) {
      e.stopPropagation();
    }
    
    if (e.touches.length === 2) {
      // 双指缩放
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (isGestureActive && lastTouchDistance > 0) {
        const scale = currentDistance / lastTouchDistance;
        // iOS设备调整缩放灵敏度
        const sensitivity = isIOS ? 15 : 20;
        const deltaFov = (scale - 1) * sensitivity;
        fov = THREE.MathUtils.clamp(fov - deltaFov, 30, 100);
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      
      lastTouchDistance = currentDistance;
      return;
    }
    
    if (!isPointerDown || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    
    // 检查是否为滑动操作（快速移动）
    const moveDistance = Math.sqrt(dx * dx + dy * dy);
    const timeElapsed = Date.now() - touchStartTime;
    
    // iOS设备调整滑动检测阈值
    const threshold = isIOS ? 30 : 50;
    const timeThreshold = isIOS ? 150 : 100;
    
    // 如果是快速滑动（可能是页面滚动），不触发视角变化
    if (timeElapsed < timeThreshold && moveDistance > threshold) {
      return;
    }
    
    startX = touch.clientX;
    startY = touch.clientY;
    
    // 移动端降低灵敏度，减少卡顿
    const sensitivity = isIOS ? 0.03 : 0.05; // iOS设备进一步降低灵敏度
    targetLon -= dx * sensitivity;
    targetLat += dy * sensitivity;
    targetLat = THREE.MathUtils.clamp(targetLat, -85, 85);
  }
  
  function onTouchEnd(e) {
    e.preventDefault();
    
    // iOS设备特殊处理
    if (isIOS) {
      e.stopPropagation();
    }
    
    isPointerDown = false;
    isGestureActive = false;
    touchStartDistance = 0;
    lastTouchDistance = 0;
  }

  function onResize() {
    const w = viewerEl.clientWidth;
    const h = viewerEl.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }

  function animate() {
    requestAnimationFrame(animate);
    
    // 性能监控
    frameCount++;
    const currentTime = performance.now();
    if (currentTime - lastTime >= 1000) {
      fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      frameCount = 0;
      lastTime = currentTime;
      
      // 自适应性能调整
      if (fps < 30 && currentTexture) {
        console.warn('性能较低，FPS:', fps);
        // 移动端性能优化
        if (isMobile && fps < 20) {
          // 降低渲染质量
          renderer.setPixelRatio(Math.min(renderer.getPixelRatio() * 0.8, 1));
        }
      }
    }
    
    // 移动端优化插值，减少卡顿
    let baseLerpFactor = isMobile ? 0.08 : 0.15;
    
    // iOS设备特殊插值优化
    if (isIOS) {
      baseLerpFactor = 0.05; // iOS设备使用更低的插值因子
    }
    
    const lerpFactor = Math.min(baseLerpFactor, fps / 400); // 根据FPS调整插值速度
    lon += (targetLon - lon) * lerpFactor;
    lat += (targetLat - lat) * lerpFactor;

    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon);

    camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
    camera.target.y = 500 * Math.cos(phi);
    camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(camera.target);

    // 只在需要时更新纹理
    if (currentTexture && currentTexture.needsUpdate) {
      currentTexture.needsUpdate = false;
    }
    
    // 移动端减少渲染频率
    if (isIOS) {
      // iOS设备特殊渲染策略
      if (fps < 25) {
        // iOS设备低FPS时跳帧渲染
        if (frameCount % 2 === 0) {
          renderer.render(scene, camera);
        }
      } else {
        renderer.render(scene, camera);
      }
    } else if (isMobile && fps < 30) {
      // 其他移动端跳帧渲染
      if (frameCount % 2 === 0) {
        renderer.render(scene, camera);
      }
    } else {
      renderer.render(scene, camera);
    }
  }

  function disposeCurrentMedia() {
    // Dispose texture/material for previous media
    if (sphereMesh && sphereMesh.material) {
      const mat = sphereMesh.material;
      if (mat.map && mat.map.dispose) mat.map.dispose();
      if (mat.dispose) mat.dispose();
    }
    sphereMesh.material = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
    currentTexture = null;

    if (videoEl) {
      try { videoEl.pause(); } catch {}
      videoEl.src = '';
      videoEl.removeAttribute('src');
      videoEl.load();
      videoEl = null;
    }

    playPauseButton.disabled = true;
    stopButton.disabled = true;
    updatePlayButtonIcon(false);
    if (seekBar) {
      seekBar.disabled = true;
      seekBar.value = '0';
    }
    if (timeCurrent) timeCurrent.textContent = '00:00';
    if (timeTotal) timeTotal.textContent = '00:00';

    setHintVisible(true);
  }

  function loadFile(file) {
    const objectUrl = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) {
      loadImage(objectUrl);
    } else if (file.type.startsWith('video/')) {
      loadVideo(objectUrl);
    } else {
      alert('不支持的文件类型：' + file.type);
      URL.revokeObjectURL(objectUrl);
    }
  }

  function openServerUrl(url) {
    // 猜测类型：根据扩展名
    const lower = url.toLowerCase();
    const isImage = /(\.jpg|\.jpeg|\.png|\.webp|\.gif|\.bmp)(\?|#|$)/.test(lower);
    const isVideo = /(\.mp4|\.webm|\.ogv|\.ogg|\.mov|\.m3u8)(\?|#|$)/.test(lower);
    if (isImage) {
      loadImage(url);
    } else if (isVideo) {
      loadVideo(url);
    } else {
      // 无法判断时，优先按视频尝试
      loadVideo(url);
    }
  }

  function renderMediaList(base, items) {
    mediaList.innerHTML = '';
    if (!items || items.length === 0) {
      const li = document.createElement('li');
      li.textContent = '清单为空';
      mediaList.appendChild(li);
      return;
    }
    for (const item of items) {
      // 支持两种格式：字符串或对象 { title, path, type }
      const title = typeof item === 'string' ? item : (item.title || item.path || '未命名');
      const path = typeof item === 'string' ? item : (item.path || '');
      const type = typeof item === 'string' ? undefined : item.type;
      
      // 安全地构建URL
      let url;
      if (path.startsWith('http://') || path.startsWith('https://')) {
        url = path;
      } else {
        // 确保base以/结尾，path不以/开头
        const cleanBase = base.endsWith('/') ? base : base + '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        url = cleanBase + cleanPath;
      }

      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = title;
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = '打开';
      btn.addEventListener('click', () => {
        if (type === 'image') loadImage(url); else if (type === 'video') loadVideo(url); else openServerUrl(url);
        serverPicker.hidden = true;
      });
      li.appendChild(span);
      li.appendChild(btn);
      mediaList.appendChild(li);
    }
  }

  function switchTab(kind) {
    if (!tabVideos || !tabImages || !videoList || !imageList) return;
    const toVideo = kind === 'video';
    tabVideos.classList.toggle('active', toVideo);
    tabImages.classList.toggle('active', !toVideo);
    videoList.hidden = !toVideo;
    imageList.hidden = toVideo;
  }

  async function loadSidebar(baseInput) {
    const inputPath = (baseInput || '/media/').trim();
    console.log('=== 开始加载侧边栏 ===');
    console.log('输入路径:', inputPath);
    console.log('当前页面URL:', window.location.href);
    console.log('当前域名:', window.location.hostname);
    console.log('当前端口:', window.location.port);
    
    // 检测是否为 Windows 文件路径
    const isWindowsPath = /^[A-Za-z]:[\\/]/.test(inputPath) || /^\\\\/.test(inputPath);
    
    if (isWindowsPath) {
      // Windows 路径：转换为 file:// URL 格式
      const normalizedPath = inputPath.replace(/\\/g, '/');
      const base = normalizedPath.endsWith('/') ? normalizedPath : normalizedPath + '/';
      const fileUrl = 'file:///' + base.replace(/^\/+/, '');
      
      try {
        // 尝试读取 manifest.json
        const manifestUrl = fileUrl + 'manifest.json';
        console.log('尝试加载 manifest:', manifestUrl);
        const resp = await fetch(manifestUrl, { cache: 'no-cache' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        const data = await resp.json();
        const list = Array.isArray(data) ? data : (data.items || []);
        const vids = [];
        const imgs = [];
        for (const item of list) {
          const path = typeof item === 'string' ? item : (item.path || '');
          const title = typeof item === 'string' ? item : (item.title || path);
          const type = typeof item === 'string' ? undefined : item.type;
          
          // 安全地构建URL
          let url;
          if (path.startsWith('http') || path.startsWith('file://')) {
            url = path;
          } else {
            // 确保fileUrl以/结尾，path不以/开头
            const cleanFileUrl = fileUrl.endsWith('/') ? fileUrl : fileUrl + '/';
            const cleanPath = path.startsWith('/') ? path.substring(1) : path;
            url = cleanFileUrl + cleanPath;
          }
          
          const lower = url.toLowerCase();
          const isImage = type === 'image' || /(\.jpg|\.jpeg|\.png|\.webp|\.gif|\.bmp)(\?|#|$)/.test(lower);
          const isVideo = type === 'video' || /(\.mp4|\.webm|\.ogv|\.ogg|\.mov|\.m3u8)(\?|#|$)/.test(lower);
          if (isVideo) vids.push({ title, url });
          else if (isImage) imgs.push({ title, url });
        }
        fillList(videoList, vids, 'video');
        fillList(imageList, imgs, 'image');
      } catch (e) {
        console.error('Windows 路径加载失败:', e);
        alert('Windows 路径加载失败：' + (e && e.message ? e.message : 'unknown') + '\n\n注意：浏览器安全策略可能限制访问本地文件，建议使用 HTTP 服务器访问。');
      }
    } else {
      // HTTP/HTTPS 路径或相对路径
      const base = inputPath.replace(/\/$/, '') + '/';
      console.log('尝试加载 HTTP 路径:', base);
      try {
        // 先尝试 manifest.json
        const manifestUrl = base + 'manifest.json';
        console.log('尝试加载 manifest:', manifestUrl);
        console.log('完整URL:', new URL(manifestUrl, window.location.origin).href);
        
        const resp = await fetch(manifestUrl, { cache: 'no-cache' });
        console.log('响应状态:', resp.status, resp.statusText);
        console.log('响应头:', Object.fromEntries(resp.headers.entries()));
        
        if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        const data = await resp.json();
        console.log('成功加载 manifest:', data);
        const list = Array.isArray(data) ? data : (data.items || []);
        const vids = [];
        const imgs = [];
        for (const item of list) {
          const path = typeof item === 'string' ? item : (item.path || '');
          const title = typeof item === 'string' ? item : (item.title || path);
          const type = typeof item === 'string' ? undefined : item.type;
          
          // 安全地构建URL
          let url;
          if (path.startsWith('http')) {
            url = path;
          } else {
            // 确保base以/结尾，path不以/开头
            const cleanBase = base.endsWith('/') ? base : base + '/';
            const cleanPath = path.startsWith('/') ? path.substring(1) : path;
            url = cleanBase + cleanPath;
          }
          
          const lower = url.toLowerCase();
          const isImage = type === 'image' || /(\.jpg|\.jpeg|\.png|\.webp|\.gif|\.bmp)(\?|#|$)/.test(lower);
          const isVideo = type === 'video' || /(\.mp4|\.webm|\.ogv|\.ogg|\.mov|\.m3u8)(\?|#|$)/.test(lower);
          if (isVideo) vids.push({ title, url });
          else if (isImage) imgs.push({ title, url });
        }
        fillList(videoList, vids, 'video');
        fillList(imageList, imgs, 'image');
      } catch (e) {
        console.error('manifest 加载失败:', e);
        // 若没有清单且启用了 autoindex，可以尝试简单解析目录索引（HTML），否则提示
        try {
          console.log('尝试加载目录索引:', base);
          console.log('完整URL:', new URL(base, window.location.origin).href);
          
          const resp = await fetch(base, { cache: 'no-cache' });
          console.log('目录索引响应状态:', resp.status, resp.statusText);
          console.log('目录索引响应头:', Object.fromEntries(resp.headers.entries()));
          
          if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
          const html = await resp.text();
          console.log('成功加载目录索引，HTML长度:', html.length);
          console.log('目录索引HTML预览:', html.substring(0, 500));
          const urls = Array.from(html.matchAll(/href=\"([^\"]+)\"/g)).map(m => m[1]).filter(u => !u.startsWith('?'));
          const vids = [];
          const imgs = [];
          for (const u of urls) {
            // 安全地构建URL
            let full;
            if (u.startsWith('http')) {
              full = u;
            } else {
              // 确保base以/结尾，u不以/开头
              const cleanBase = base.endsWith('/') ? base : base + '/';
              const cleanPath = u.startsWith('/') ? u.substring(1) : u;
              full = cleanBase + cleanPath;
            }
            
            const name = decodeURIComponent(u.split('/').filter(Boolean).pop() || u);
            const lower = full.toLowerCase();
            const isImage = /(\.jpg|\.jpeg|\.png|\.webp|\.gif|\.bmp)(\?|#|$)/.test(lower);
            const isVideo = /(\.mp4|\.webm|\.ogv|\.ogg|\.mov|\.m3u8)(\?|#|$)/.test(lower);
            if (isVideo) vids.push({ title: name, url: full });
            else if (isImage) imgs.push({ title: name, url: full });
          }
          fillList(videoList, vids, 'video');
          fillList(imageList, imgs, 'image');
        } catch (err) {
          console.error('目录索引加载失败:', err);
          alert('加载列表失败：' + (err && err.message ? err.message : 'unknown') + '\n\n请检查：\n1. 路径是否正确\n2. 服务器是否支持 CORS\n3. 网络连接是否正常');
        }
      }
    }
  }

  function fillList(listEl, items, kind) {
    if (!listEl) return;
    listEl.innerHTML = '';
    if (!items || items.length === 0) {
      const li = document.createElement('li');
      li.textContent = '（无文件）';
      listEl.appendChild(li);
      return;
    }
    for (const it of items) {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.className = 'file-list__name';
      name.textContent = it.title || it.url;
      
      // 创建加载媒体文件的函数
      const loadMedia = () => {
        console.log('加载媒体文件:', { kind, url: it.url, title: it.title });
        if (kind === 'video') {
          console.log('加载视频:', it.url);
          loadVideo(it.url);
        } else {
          console.log('加载图片:', it.url);
          loadImage(it.url);
        }
      };
      
      if (isMacOSSafari) {
        // macOS Safari特殊处理：添加播放按钮
        const playBtn = document.createElement('button');
        playBtn.className = 'play-btn';
        playBtn.innerHTML = kind === 'video' ? '▶' : '📷';
        playBtn.style.cssText = `
          background: var(--brand);
          color: white;
          border: none;
          border-radius: 3px;
          padding: 2px 6px;
          font-size: 12px;
          cursor: pointer;
          margin-left: 8px;
        `;
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log('macOS Safari播放按钮点击');
          loadMedia();
        });
        
        // 将播放按钮添加到列表项
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.justifyContent = 'space-between';
        container.style.alignItems = 'center';
        container.appendChild(name);
        container.appendChild(playBtn);
        li.appendChild(container);
        
        // 保留双击事件作为备选
        li.addEventListener('dblclick', () => {
          console.log('macOS Safari双击事件触发');
          loadMedia();
        });
      } else {
        // 非macOS Safari的原有逻辑
        li.appendChild(name);
        li.addEventListener('dblclick', () => {
          console.log('双击事件触发');
          loadMedia();
        });
      }
      listEl.appendChild(li);
    }
  }

  function loadImage(url) {
    disposeCurrentMedia();
    
    // 显示加载进度
    showLoadingProgress(true, 0, '正在加载图片...');
    
    // 获取优化后的URL
    const optimizedUrl = getOptimizedUrl(url);
    console.log('原始URL:', url);
    console.log('优化URL:', optimizedUrl);
    console.log('当前画质:', currentQuality);
    console.log('iOS设备:', isIOS);
    console.log('Safari浏览器:', isSafari);
    
    const loader = new THREE.TextureLoader();
    
    // Safari浏览器特殊处理（包括iOS和macOS）
    if (isIOS || isMacOSSafari) {
      // Safari浏览器使用更保守的加载策略
      loader.setCrossOrigin('anonymous');
    }
    
    // 添加进度监听
    loader.load(
      optimizedUrl,
      (texture) => {
        console.log('图片加载完成，尺寸:', texture.image.width, 'x', texture.image.height);
        
        // 优化纹理设置
        texture.colorSpace = THREE.SRGBColorSpace;
        
        // Safari浏览器特殊纹理设置（包括iOS和macOS）
        if (isIOS || isMacOSSafari) {
          texture.generateMipmaps = false; // Safari浏览器禁用mipmaps提高性能
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = 1; // Safari浏览器限制各向异性
        } else {
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        }
        
        // 修正镜像：水平翻转
        texture.wrapS = THREE.RepeatWrapping;
        texture.center.set(0.5, 0.5);
        texture.repeat.x = -1;
        texture.needsUpdate = true;
        
        currentTexture = texture;
        
        // 使用更高效的材质
        const material = new THREE.MeshBasicMaterial({ 
          map: texture, 
          side: THREE.BackSide,
          transparent: false,
          alphaTest: 0
        });
        sphereMesh.material = material;
        
        URL.revokeObjectURL(url);
        setHintVisible(false);
        showLoadingProgress(false);
        
        // 图片不需要播放控制栏
        showPlayerControls(false);
        
        console.log('图片材质应用完成');
        
        // 如果是低画质，提示用户可以升级
        if (currentQuality === 'low') {
          setTimeout(() => {
            console.log('提示：当前为低画质模式，可在画质选择器中切换到更高画质');
          }, 2000);
        }
      },
      (progress) => {
        // 加载进度回调
        const percent = Math.round((progress.loaded / progress.total) * 100);
        showLoadingProgress(true, percent, `加载图片中... ${percent}%`);
        console.log('图片加载进度:', percent + '%');
      },
      (err) => {
        console.error('图片加载失败:', err);
        console.error('Safari浏览器:', isSafari);
        console.error('iOS设备:', isIOS);
        showLoadingProgress(false);
        
        let errorMessage = '图片加载失败: ' + (err.message || '未知错误');
        if (isMacOSSafari) {
          errorMessage += '\n\nmacOS Safari浏览器提示：\n1. 检查图片URL是否可访问\n2. 确认图片格式是否支持\n3. 检查CORS设置';
        } else if (isIOS) {
          errorMessage += '\n\niOS Safari浏览器提示：\n1. 检查图片URL是否可访问\n2. 确认图片格式是否支持\n3. 检查CORS设置';
        }
        
        alert(errorMessage);
        URL.revokeObjectURL(url);
      }
    );
  }

  function loadVideo(url) {
    disposeCurrentMedia();
    
    // 显示加载进度
    showLoadingProgress(true, 0, '正在加载视频...');
    
    // 获取优化后的URL
    const optimizedUrl = getOptimizedUrl(url);
    console.log('原始视频URL:', url);
    console.log('优化视频URL:', optimizedUrl);
    console.log('当前画质:', currentQuality);
    console.log('流式模式:', isStreamingMode);
    
    videoEl = document.createElement('video');
    videoEl.src = optimizedUrl;
    videoEl.crossOrigin = 'anonymous';
    videoEl.loop = true;
    videoEl.muted = false; // 允许声音播放
    videoEl.playsInline = true;
    videoEl.volume = lastVolume / 100; // 设置默认音量为40%
    
    // Safari浏览器特殊视频属性（包括iOS和macOS）
    if (isIOS || isMacOSSafari) {
      videoEl.setAttribute('webkit-playsinline', 'true');
      videoEl.setAttribute('playsinline', 'true');
      videoEl.setAttribute('x-webkit-airplay', 'deny');
      videoEl.setAttribute('controls', 'false');
      videoEl.setAttribute('disablepictureinpicture', 'true');
      videoEl.setAttribute('preload', 'metadata');
      
      // iOS设备默认静音以避免自动播放限制
      if (isIOS) {
        videoEl.muted = true;
      }
    }
    
    // 根据画质和网络状况调整预加载策略
    if (currentQuality === 'low' || networkSpeed === 'slow-2g' || networkSpeed === '2g') {
      videoEl.preload = 'metadata'; // 低画质时只预加载元数据
      isStreamingMode = true;
    } else if (currentQuality === 'medium' || networkSpeed === '3g') {
      videoEl.preload = 'auto'; // 中画质时预加载部分
      isStreamingMode = true;
    } else {
      videoEl.preload = 'auto'; // 高画质时预加载全部
      isStreamingMode = false;
    }
    
    // 安卓设备特殊视频属性
    if (isAndroid) {
      console.log('安卓设备检测到，应用特殊视频属性');
      videoEl.setAttribute('webkit-playsinline', 'true');
      videoEl.setAttribute('playsinline', 'true');
      videoEl.setAttribute('x5-video-player-type', 'h5');
      videoEl.setAttribute('x5-video-player-fullscreen', 'false');
      videoEl.setAttribute('x5-video-orientation', 'portrait');
      videoEl.setAttribute('x5-video-player-mode', 'h5');
      videoEl.setAttribute('preload', 'auto');
      // 安卓设备可能需要特殊的渲染设置
      videoEl.style.position = 'absolute';
      videoEl.style.top = '-9999px';
      videoEl.style.left = '-9999px';
      videoEl.style.width = '1px';
      videoEl.style.height = '1px';
      videoEl.style.opacity = '0';
      videoEl.style.pointerEvents = 'none';
      videoEl.style.zIndex = '-1';
    }
    
    // 其他移动端兼容性设置
    if (!isIOS && !isMacOSSafari && !isAndroid) {
      videoEl.setAttribute('webkit-playsinline', 'true');
      videoEl.setAttribute('playsinline', 'true');
      videoEl.setAttribute('x5-video-player-type', 'h5');
      videoEl.setAttribute('x5-video-player-fullscreen', 'false');
      videoEl.setAttribute('x5-video-orientation', 'portrait');
    }
    
    // 移动端视频优化
    if (isMobile) {
      videoEl.preload = 'metadata'; // 减少初始加载
      
      // Safari浏览器特殊处理（包括iOS和macOS）
      if (isIOS || isMacOSSafari) {
        console.log('检测到Safari浏览器，应用Safari视频优化');
        videoEl.setAttribute('webkit-playsinline', 'true');
        videoEl.setAttribute('playsinline', 'true');
        videoEl.setAttribute('x-webkit-airplay', 'deny');
        videoEl.setAttribute('controls', 'false');
        videoEl.setAttribute('disablepictureinpicture', 'true');
        videoEl.setAttribute('preload', 'metadata');
        
        // iOS设备默认静音
        if (isIOS) {
          videoEl.muted = true;
        }
      }
      // MIUI浏览器特殊处理
      else if (isMIUI || isXiaomi) {
        console.log('检测到MIUI浏览器，应用特殊设置');
        videoEl.setAttribute('x5-video-player-type', 'h5');
        videoEl.setAttribute('x5-video-player-fullscreen', 'false');
        videoEl.setAttribute('x5-video-player-mode', 'h5');
        videoEl.setAttribute('x5-video-orientation', 'portrait');
        videoEl.setAttribute('x5-video-player-quicktype', 'false');
        videoEl.setAttribute('x5-video-player-scalemode', 'contain');
        videoEl.setAttribute('x5-video-player-type', 'h5-page');
        // 强制禁用系统播放器
        videoEl.setAttribute('webkit-playsinline', 'true');
        videoEl.setAttribute('playsinline', 'true');
        videoEl.setAttribute('muted', 'true'); // 先静音避免自动播放问题
      } else {
        videoEl.setAttribute('x5-video-player-type', 'h5-page');
        videoEl.setAttribute('x5-video-orientation', 'portrait');
      }
      
      // 确保视频在移动设备上正确显示
      videoEl.style.position = 'absolute';
      videoEl.style.top = '-9999px';
      videoEl.style.left = '-9999px';
      videoEl.style.width = '1px';
      videoEl.style.height = '1px';
      videoEl.style.opacity = '0';
      videoEl.style.pointerEvents = 'none';
      videoEl.style.zIndex = '-1';
      isStreamingMode = true;
    }
    
    // 确保视频在移动设备上正确显示
    if (!isMobile) {
      videoEl.style.width = '100%';
      videoEl.style.height = '100%';
      videoEl.style.objectFit = 'cover';
    }

    const onCanPlay = () => {
      const vtex = new THREE.VideoTexture(videoEl);
      vtex.colorSpace = THREE.SRGBColorSpace;
      vtex.minFilter = THREE.LinearFilter;
      vtex.magFilter = THREE.LinearFilter;
      vtex.format = THREE.RGBAFormat;
      
      // 安卓设备特殊纹理设置
      if (isAndroid) {
        console.log('安卓设备检测到，应用特殊视频纹理设置');
        vtex.generateMipmaps = false; // 安卓设备禁用mipmaps
        vtex.minFilter = THREE.LinearFilter;
        vtex.magFilter = THREE.LinearFilter;
        vtex.anisotropy = 1; // 安卓设备限制各向异性
        vtex.flipY = false; // 安卓设备可能需要特殊处理
      }
      
      // 修正镜像：水平翻转
      vtex.wrapS = THREE.RepeatWrapping;
      vtex.center.set(0.5, 0.5);
      vtex.repeat.x = -1;
      vtex.needsUpdate = true;
      currentTexture = vtex;
      const material = new THREE.MeshBasicMaterial({ map: vtex, side: THREE.BackSide });
      sphereMesh.material = material;
      playPauseButton.disabled = false;
      stopButton.disabled = false;
      if (seekBar) {
        seekBar.disabled = false;
      }
      
      // 显示播放器控制栏
      showPlayerControls(true);
      
      // 同步音量滑块和静音按钮
      const volumeSlider = document.querySelector('.volume-slider');
      if (volumeSlider) {
        volumeSlider.value = Math.round(videoEl.volume * 100);
      }
      updateMuteButton();
      
      // 隐藏加载进度
      showLoadingProgress(false);
      
      // 自动播放策略
      if (isIOS) {
        // iOS设备：不自动播放，等待用户点击
        updatePlayButtonIcon(false);
        console.log('iOS设备检测到，等待用户手动播放');
        // iOS设备保持静音状态，用户点击播放后可以手动开启声音
        videoEl.muted = true;
        const volumeSlider = document.querySelector('.volume-slider');
        if (volumeSlider) {
          volumeSlider.value = 0;
        }
        updateMuteButton();
      } else if (isMacOSSafari) {
        // macOS Safari：尝试自动播放（静音模式）
        updatePlayButtonIcon(false);
        console.log('macOS Safari检测到，尝试自动播放');
        videoEl.muted = true; // 先静音播放
        videoEl.play().then(() => {
          updatePlayButtonIcon(true);
          console.log('macOS Safari自动播放成功');
          // 播放成功后，恢复音量
          setTimeout(() => {
            videoEl.muted = false;
            videoEl.volume = lastVolume / 100;
            const volumeSlider = document.querySelector('.volume-slider');
            if (volumeSlider) {
              volumeSlider.value = lastVolume;
            }
            updateMuteButton();
          }, 100);
        }).catch((error) => {
          updatePlayButtonIcon(false);
          console.log('macOS Safari自动播放失败，等待用户手动播放:', error);
          // 如果自动播放失败，恢复音量设置
          videoEl.muted = false;
          videoEl.volume = lastVolume / 100;
          updateMuteButton();
        });
      } else if (isMobile) {
        // 其他移动端：不自动播放，等待用户点击
        updatePlayButtonIcon(false);
        console.log('移动端检测到，等待用户手动播放');
      } else {
        // 其他桌面端：尝试自动播放（静音模式）
        videoEl.muted = true; // 先静音播放
        videoEl.play().then(() => {
          updatePlayButtonIcon(true);
          // 播放成功后，恢复音量
          setTimeout(() => {
            videoEl.muted = false;
            videoEl.volume = lastVolume / 100;
            const volumeSlider = document.querySelector('.volume-slider');
            if (volumeSlider) {
              volumeSlider.value = lastVolume;
            }
            updateMuteButton();
          }, 100);
        }).catch(() => {
          updatePlayButtonIcon(false);
          // 如果自动播放失败，恢复音量设置
          videoEl.muted = false;
          videoEl.volume = lastVolume / 100;
          updateMuteButton();
        });
      }
      setHintVisible(false);
      
      // 如果是低画质，提示用户可以升级
      if (currentQuality === 'low') {
        setTimeout(() => {
          console.log('提示：当前为低画质模式，可在画质选择器中切换到更高画质');
        }, 2000);
      }
    };
    
    // 视频加载进度监听
    videoEl.addEventListener('loadstart', () => {
      console.log('视频开始加载:', optimizedUrl);
      showLoadingProgress(true, 0, '正在加载视频...');
    });
    
    videoEl.addEventListener('progress', () => {
      if (videoEl.buffered.length > 0) {
        const bufferedEnd = videoEl.buffered.end(videoEl.buffered.length - 1);
        const duration = videoEl.duration;
        if (duration > 0) {
          const percent = Math.round((bufferedEnd / duration) * 100);
          showLoadingProgress(true, percent, `缓冲中... ${percent}%`);
          console.log('视频缓冲进度:', percent + '%');
        }
      }
    });
    
    videoEl.addEventListener('loadeddata', () => {
      console.log('视频数据加载完成');
      showLoadingProgress(true, 50, '视频数据加载完成');
    });
    
    videoEl.addEventListener('loadedmetadata', () => {
      console.log('视频元数据加载完成');
      showLoadingProgress(true, 25, '视频元数据加载完成');
    });
    
    videoEl.addEventListener('canplay', onCanPlay, { once: true });
    
    videoEl.addEventListener('canplaythrough', () => {
      console.log('视频可以完整播放');
      showLoadingProgress(false);
    });
    
    videoEl.addEventListener('error', (e) => {
      console.error('视频加载错误:', e);
      console.error('视频URL:', optimizedUrl);
      console.error('错误详情:', videoEl.error);
      console.error('Safari浏览器:', isSafari);
      console.error('iOS设备:', isIOS);
      showLoadingProgress(false);
      
      let errorMessage = '视频加载失败: ' + (videoEl.error ? videoEl.error.message : '未知错误');
      if (isMacOSSafari) {
        errorMessage += '\n\nmacOS Safari浏览器提示：\n1. 检查视频URL是否可访问\n2. 确认视频格式是否支持（推荐MP4）\n3. 检查CORS设置\n4. 尝试刷新页面';
      } else if (isIOS) {
        errorMessage += '\n\niOS Safari浏览器提示：\n1. 检查视频URL是否可访问\n2. 确认视频格式是否支持（推荐MP4）\n3. 检查CORS设置\n4. 尝试刷新页面';
      }
      
      alert(errorMessage);
      URL.revokeObjectURL(url);
    }, { once: true });
    
    // 触发加载
    videoEl.load();
  }

  function togglePlayPause() {
    if (!videoEl) return;
    if (videoEl.paused) {
      videoEl.play().then(() => {
        updatePlayButtonIcon(true);
        console.log('视频播放成功');
      }).catch((error) => {
        console.error('视频播放失败:', error);
        alert('视频播放失败，请检查视频格式是否支持');
      });
    } else {
      videoEl.pause();
      updatePlayButtonIcon(false);
      console.log('视频已暂停');
    }
  }

  function formatTime(t) {
    if (!isFinite(t) || t < 0) return '00:00';
    const s = Math.floor(t % 60);
    const m = Math.floor((t / 60) % 60);
    const h = Math.floor(t / 3600);
    const ss = String(s).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  function stopPlayback() {
    if (!videoEl) return;
    videoEl.pause();
    videoEl.currentTime = 0;
    updatePlayButtonIcon(false);
  }

  function toggleFullscreen() {
    // 兼容不同浏览器的全屏状态检测
    const fullscreenElement = document.fullscreenElement || 
                             document.webkitFullscreenElement || 
                             document.mozFullScreenElement || 
                             document.msFullscreenElement;
    
    if (!fullscreenElement) {
      // 进入全屏
      if (isMobile) {
        // 移动端特殊处理，防止调用系统播放器
        if (videoEl) {
          // MIUI浏览器特殊处理
          if (isMIUI || isXiaomi) {
            console.log('MIUI浏览器进入全屏，强化H5模式');
            videoEl.setAttribute('x5-video-player-type', 'h5');
            videoEl.setAttribute('x5-video-player-fullscreen', 'false');
            videoEl.setAttribute('x5-video-player-mode', 'h5');
            videoEl.setAttribute('x5-video-player-quicktype', 'false');
            videoEl.setAttribute('webkit-playsinline', 'true');
            videoEl.setAttribute('playsinline', 'true');
          } else {
            videoEl.setAttribute('x5-video-player-type', 'h5');
            videoEl.setAttribute('x5-video-player-fullscreen', 'false');
            videoEl.setAttribute('x5-video-player-mode', 'h5');
          }
        }
      }
      
      if (viewerEl.requestFullscreen) {
        viewerEl.requestFullscreen();
      } else if (viewerEl.webkitRequestFullscreen) {
        viewerEl.webkitRequestFullscreen();
      } else if (viewerEl.msRequestFullscreen) {
        viewerEl.msRequestFullscreen();
      }
      isFullscreen = true;
    } else {
      // 退出全屏
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      isFullscreen = false;
    }
    updateFullscreenButton();
  }

  // 监听全屏状态变化
  function handleFullscreenChange() {
    // 兼容不同浏览器的全屏状态检测
    const fullscreenElement = document.fullscreenElement || 
                             document.webkitFullscreenElement || 
                             document.mozFullScreenElement || 
                             document.msFullscreenElement;
    isFullscreen = !!fullscreenElement;
    
    console.log('全屏状态变化:', { isFullscreen, fullscreenElement });
    
    const sidebar = document.getElementById('sidebar');
    
    if (sidebar) {
      if (isFullscreen) {
        console.log('进入全屏，隐藏sidebar');
        sidebar.style.display = 'none';
        sidebar.style.visibility = 'hidden';
        sidebar.style.opacity = '0';
      } else {
        console.log('退出全屏，显示sidebar');
        sidebar.style.display = 'flex';
        sidebar.style.visibility = 'visible';
        sidebar.style.opacity = '1';
        // Safari浏览器特殊处理：确保sidebar可见
        if (isIOS || isMacOSSafari) {
          sidebar.style.position = 'absolute';
          sidebar.style.right = '0';
          sidebar.style.top = '0';
          sidebar.style.bottom = '0';
          sidebar.style.zIndex = '100';
        }
      }
    }
    
    updateFullscreenButton();
    
    // 移动端全屏时添加额外的退出按钮
    if (isMobile) {
      if (isFullscreen) {
        addMobileExitButton();
      } else {
        removeMobileExitButton();
      }
    }
  }
  
  function addMobileExitButton() {
    // 移除可能存在的旧按钮
    removeMobileExitButton();
    
    const exitBtn = document.createElement('div');
    exitBtn.className = 'exit-fullscreen-overlay';
    exitBtn.innerHTML = '✕';
    exitBtn.onclick = () => {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    };
    document.body.appendChild(exitBtn);
  }
  
  function removeMobileExitButton() {
    const existingBtn = document.querySelector('.exit-fullscreen-overlay');
    if (existingBtn) {
      existingBtn.remove();
    }
  }

  // 添加全屏状态监听器
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
})();


