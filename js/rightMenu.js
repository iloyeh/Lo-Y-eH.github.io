// Claude优化后的 rightMenu.js，2025年8月9日

// ===== 工具函数模块 =====
const Utils = {
  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // 节流函数
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // 安全的 DOM 查询
  safeQuery(selector) {
    try {
      return document.querySelector(selector);
    } catch (e) {
      console.warn(`Invalid selector: ${selector}`);
      return null;
    }
  },

  // 安全的 jQuery 查询
  safe$(selector) {
    try {
      return $(selector);
    } catch (e) {
      console.warn(`jQuery selector error: ${selector}`);
      return $();
    }
  },

  // 复制文本到剪贴板（支持新旧 API）
  async copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('Modern clipboard API failed, falling back to legacy method');
      }
    }

    // 降级到传统方法
    try {
      const input = document.createElement('input');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      input.value = text;
      document.body.appendChild(input);
      input.select();
      input.setSelectionRange(0, input.value.length);
      const success = document.execCommand('copy');
      document.body.removeChild(input);
      return success;
    } catch (err) {
      console.error('Failed to copy text:', err);
      return false;
    }
  },

  // 安全的 Toast 显示
  showToast(message, duration = 5000) {
    if (typeof M !== 'undefined' && M.toast) {
      M.toast({ html: `<span>${message}</span>` }, duration);
    } else {
      console.log(message); // 降级方案
    }
  }
};

// ===== 常量定义 =====
const CONSTANTS = {
  MENU_OFFSET: 10,
  HEADER_OFFSET: 70,
  DEFAULT_SCROLL_TIME: 500,
  DOWNLOAD_TIMEOUT: 10000,
  TOAST_DURATION: 5000,
  MOBILE_BREAKPOINT: 768,
  SELECTORS: {
    rightMenu: '#rightMenu',
    rightMenuMask: '#rightmenu-mask',
    rightMenuOther: '.rightMenuOther',
    rightMenuPlugin: '.rightMenuPlugin'
  }
};

// ===== 初始化全局对象 =====
let rm = {};

// ===== BTF 模块 - 滚动功能 =====
const btf = {
  scrollToDest: (pos, time = CONSTANTS.DEFAULT_SCROLL_TIME) => {
    // 参数验证
    if (typeof pos !== 'number' || typeof time !== 'number' || pos < 0 || time < 0) {
      console.warn('Invalid parameters for scrollToDest');
      return;
    }

    const currentPos = window.pageYOffset || window.scrollY || document.documentElement.scrollTop;
    const targetPos = Math.max(0, pos - CONSTANTS.HEADER_OFFSET);

    // 使用现代浏览器的 smooth scroll
    if (window.CSS && CSS.supports('scroll-behavior', 'smooth')) {
      window.scrollTo({
        top: targetPos,
        behavior: 'smooth'
      });
      return;
    }

    // 降级到自定义动画
    let start = null;
    const step = (currentTime) => {
      start = start || currentTime;
      const progress = currentTime - start;
      const progressRatio = Math.min(progress / time, 1);

      // 使用 easeOutQuad 缓动函数
      const easeOutQuad = progressRatio * (2 - progressRatio);
      const newPos = currentPos + (targetPos - currentPos) * easeOutQuad;

      window.scrollTo(0, newPos);

      if (progress < time) {
        requestAnimationFrame(step);
      } else {
        window.scrollTo(0, targetPos);
      }
    };

    requestAnimationFrame(step);
  }
};

// ===== HEO 模块 - 增强功能 =====
const heo = {
  // 下载状态管理
  _downloadState: {
    inProgress: false
  },

  // 下载图片功能
  async downloadImage(imgsrc, name = 'photo') {
    if (!imgsrc) {
      Utils.showToast('图片地址无效');
      return;
    }

    rm.hideRightMenu();

    if (this._downloadState.inProgress) {
      Utils.showToast('有正在进行中的下载，请稍后再试');
      return;
    }

    this._downloadState.inProgress = true;
    Utils.showToast('正在下载中，请稍后', CONSTANTS.DOWNLOAD_TIMEOUT);

    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // 短暂延迟以显示 toast

      const image = new Image();
      image.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = imgsrc;
      });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;

      context.drawImage(image, 0, 0);
      const dataURL = canvas.toDataURL('image/png');

      const link = document.createElement('a');
      link.download = name;
      link.href = dataURL;

      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Utils.showToast('图片已添加盲水印，请遵守版权协议');

    } catch (error) {
      console.error('Download failed:', error);
      Utils.showToast('下载失败，请重试');
    } finally {
      this._downloadState.inProgress = false;
    }
  },

  // 音乐控制功能（预留接口）
  musicToggle() {
    console.log('音乐切换功能待开发...');
    rm.hideRightMenu();
  },

  musicSkipBack() {
    console.log('上一曲功能待开发...');
    rm.hideRightMenu();
  },

  musicSkipForward() {
    console.log('下一曲功能待开发...');
    rm.hideRightMenu();
  },

  musicGetName() {
    console.log('获取音乐名称功能待开发...');
    return '';
  }
};

// ===== 右键菜单核心模块 =====
const RightMenuCore = {
  // 状态管理
  state: {
    width: 0,
    height: 0,
    domHref: '',
    domImgSrc: '',
    globalEvent: null,
    selectTextNow: '',
    isVisible: false
  },

  // 缓存 DOM 元素
  elements: {},

  // 初始化 DOM 缓存
  initElements() {
    const selectors = {
      rightMenu: CONSTANTS.SELECTORS.rightMenu,
      rightMenuMask: CONSTANTS.SELECTORS.rightMenuMask,
      rightMenuOther: CONSTANTS.SELECTORS.rightMenuOther,
      rightMenuPlugin: CONSTANTS.SELECTORS.rightMenuPlugin,
      menuCopyText: '#menu-copytext',
      menuPasteText: '#menu-pastetext',
      menuCommentText: '#menu-commenttext',
      menuNewWindow: '#menu-newwindow',
      menuCopyLink: '#menu-copylink',
      menuCopyImg: '#menu-copyimg',
      menuDownloadImg: '#menu-downloadimg',
      menuSearch: '#menu-search',
      menuSearchBing: '#menu-searchBing',
      menuMusicToggle: '#menu-music-toggle',
      menuMusicBack: '#menu-music-back',
      menuMusicForward: '#menu-music-forward',
      menuMusicPlaylist: '#menu-music-playlist',
      menuMusicCopyName: '#menu-music-copyMusicName'
    };

    // 缓存所有元素
    Object.entries(selectors).forEach(([key, selector]) => {
      this.elements[key] = Utils.safe$(selector);
    });

    this.updateSize();
  },

  // 更新菜单尺寸
  updateSize() {
    const $menu = this.elements.rightMenu;
    if ($menu.length) {
      this.state.width = $menu.width() || 200;
      this.state.height = $menu.height() || 300;
    }
  },

  // 显示/隐藏菜单
  showMenu(show, x = 0, y = 0) {
    const $menu = this.elements.rightMenu;
    const $mask = this.elements.rightMenuMask;

    if (!$menu.length) return;

    if (show) {
      // 调整位置防止溢出
      const adjustedX = this.adjustPosition(x, y).x;
      const adjustedY = this.adjustPosition(x, y).y;

      $menu.css({
        top: adjustedY + 'px',
        left: adjustedX + 'px',
        display: 'block'
      });
      $mask.css('display', 'flex');
      this.state.isVisible = true;
      this.stopMaskScroll();
    } else {
      $menu.hide();
      $mask.hide();
      this.state.isVisible = false;
    }
  },

  // 调整菜单位置防止溢出
  adjustPosition(x, y) {
    let adjustedX = x;
    let adjustedY = y;

    // 防止右侧溢出
    if (x + this.state.width > window.innerWidth) {
      adjustedX = x - this.state.width - CONSTANTS.MENU_OFFSET;
    }

    // 防止底部溢出
    if (y + this.state.height > window.innerHeight) {
      adjustedY = y - (y + this.state.height - window.innerHeight);
    }

    return { x: Math.max(0, adjustedX), y: Math.max(0, adjustedY) };
  },

  // 阻止遮罩滚动
  stopMaskScroll() {
    const handleWheel = () => this.hideMenu();

    [this.elements.rightMenuMask, this.elements.rightMenu].forEach($el => {
      if ($el.length) {
        $el.off('wheel.rightmenu').on('wheel.rightmenu', handleWheel);
      }
    });
  },

  // 隐藏菜单
  hideMenu() {
    this.showMenu(false);
  },

  // 处理右键菜单逻辑
  handleContextMenu(event) {
    // 移动端不显示右键菜单
    if (document.body.clientWidth <= CONSTANTS.MOBILE_BREAKPOINT) {
      return true; // 允许默认行为
    }

    // 阻止默认右键菜单
    event.preventDefault();
    event.stopPropagation();

    const pageX = event.clientX + CONSTANTS.MENU_OFFSET;
    const pageY = event.clientY;

    this.state.globalEvent = event;
    this.updateMenuItems(event.target);
    this.updateSize();
    this.showMenu(true, pageX, pageY);

    return false; // 阻止默认行为
  },

  // 更新菜单项显示状态
  updateMenuItems(target) {
    const href = target.href;
    const imgsrc = target.currentSrc;
    const isInput = ['input', 'textarea'].includes(target.tagName?.toLowerCase());
    const isMusicPlayer = target.nodeName === 'METING-JS';
    const hasSelectedText = Boolean(this.state.selectTextNow && window.getSelection());

    // 更新状态
    this.state.domHref = href || '';
    this.state.domImgSrc = imgsrc || '';

    let pluginMode = false;

    // 文本选择相关菜单
    this.toggleMenuItems(['menuCopyText', 'menuCommentText', 'menuSearch', 'menuSearchBing'], hasSelectedText);
    if (hasSelectedText) pluginMode = true;

    // 链接相关菜单
    this.toggleMenuItems(['menuNewWindow', 'menuCopyLink'], Boolean(href));
    if (href) pluginMode = true;

    // 图片相关菜单
    this.toggleMenuItems(['menuCopyImg', 'menuDownloadImg'], Boolean(imgsrc));
    if (imgsrc) pluginMode = true;

    // 输入框相关菜单
    this.toggleMenuItems(['menuPasteText'], isInput);
    if (isInput) pluginMode = true;

    // 音乐播放器相关菜单
    this.toggleMenuItems([
      'menuMusicToggle', 'menuMusicBack', 'menuMusicForward',
      'menuMusicPlaylist', 'menuMusicCopyName'
    ], isMusicPlayer);
    if (isMusicPlayer) pluginMode = true;

    // 切换基础/扩展模式
    this.elements.rightMenuOther.toggle(!pluginMode);
    this.elements.rightMenuPlugin.toggle(pluginMode);
  },

  // 批量切换菜单项显示状态
  toggleMenuItems(itemKeys, show) {
    itemKeys.forEach(key => {
      if (this.elements[key]) {
        this.elements[key].toggle(show);
      }
    });
  }
};

// ===== 图片处理模块 =====
const ImageHandler = {
  // 下载状态
  downloadInProgress: false,

  // 复制图片到剪贴板
  async copyImageToClipboard(imgsrc) {
    if (!imgsrc) {
      Utils.showToast('图片地址无效');
      return;
    }

    rm.hideRightMenu();

    if (this.downloadInProgress) {
      Utils.showToast('正在处理中，请稍后');
      return;
    }

    this.downloadInProgress = true;
    Utils.showToast('正在处理中，请稍后', CONSTANTS.DOWNLOAD_TIMEOUT);

    try {
      const blob = await this.imageToBlob(imgsrc);

      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        Utils.showToast('复制成功！图片已添加盲水印，请遵守版权协议');
      } else {
        Utils.showToast('您的浏览器不支持图片复制功能');
      }
    } catch (error) {
      console.error('Copy image failed:', error);
      Utils.showToast('复制图片失败，请重试');
    } finally {
      this.downloadInProgress = false;
    }
  },

  // 将图片转换为 Blob
  async imageToBlob(imageURL) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.crossOrigin = 'anonymous';
      img.onload = function() {
        canvas.width = this.naturalWidth;
        canvas.height = this.naturalHeight;
        ctx.drawImage(this, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png', 0.75);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageURL;
    });
  }
};

// ===== 文本处理模块 =====
const TextHandler = {
  // 选中文本追踪
  init() {
    const updateSelection = Utils.debounce(() => {
      let selectedText = '';
      if (document.selection) {
        selectedText = document.selection.createRange().text;
      } else if (window.getSelection) {
        selectedText = window.getSelection().toString();
      }
      RightMenuCore.state.selectTextNow = selectedText;
    }, 100);

    document.addEventListener('mouseup', updateSelection);
    document.addEventListener('keyup', updateSelection);
  },

  // 复制选中文本
  async copySelectedText() {
    const text = RightMenuCore.state.selectTextNow;
    if (!text) return;

    const success = await Utils.copyToClipboard(text);
    if (success) {
      Utils.showToast('复制成功，复制或转载请标注文本位置');
    } else {
      Utils.showToast('复制失败，请重试');
    }
    rm.hideRightMenu();
  },

  // 粘贴文本到焦点元素
  async pasteText() {
    const target = RightMenuCore.state.globalEvent?.target;
    if (!target || !['INPUT', 'TEXTAREA'].includes(target.tagName)) {
      Utils.showToast('请在输入框中使用粘贴功能');
      rm.hideRightMenu();
      return;
    }

    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        this.insertAtCaret(target, text);
      } else {
        Utils.showToast('您的浏览器不支持读取剪贴板');
      }
    } catch (error) {
      console.error('Paste failed:', error);
      Utils.showToast('粘贴失败');
    }

    rm.hideRightMenu();
  },

  // 在光标位置插入文本
  insertAtCaret(element, value) {
    const startPos = element.selectionStart;
    const endPos = element.selectionEnd;
    const scrollTop = element.scrollTop;

    if (typeof startPos === 'number') {
      element.value = element.value.substring(0, startPos) +
          value +
          element.value.substring(endPos);
      element.focus();
      element.selectionStart = element.selectionEnd = startPos + value.length;
      element.scrollTop = scrollTop;
    } else {
      element.value += value;
      element.focus();
    }
  },

  // 引用文本到评论
  quoteToComment(text) {
    rm.hideRightMenu();

    const editor = Utils.safeQuery('#veditor');
    if (!editor) {
      Utils.showToast('未找到评论框');
      return;
    }

    const quotedText = '> ' + text.replace(/\n/g, '\n> ') + '\n\n';
    editor.value = quotedText;

    // 触发 input 事件
    const inputEvent = new Event('input', { bubbles: true });
    editor.dispatchEvent(inputEvent);

    // 滚动到评论区
    const commentsSection = Utils.safeQuery('#vcomments');
    if (commentsSection) {
      const offsetTop = commentsSection.offsetTop;
      btf.scrollToDest(offsetTop);
    }

    editor.focus();
    editor.setSelectionRange(quotedText.length, quotedText.length);
  }
};

// ===== 事件处理器 =====
const EventHandlers = {
  // 初始化所有事件监听器
  init() {
    // 注释掉 addEventListener 方式，使用原始的 window.oncontextmenu 方式
    // this.initContextMenu();
    this.initClickEvents();
    this.initImageDragPrevention();
  },

  // 初始化右键菜单
  initContextMenu() {
    window.addEventListener('contextmenu', (event) => {
      const result = RightMenuCore.handleContextMenu(event);
      if (result === false) {
        event.preventDefault();
        event.stopPropagation();
      }
      return result;
    });
  },

  // 初始化点击事件
  initClickEvents() {
    const handlers = {
      '#menu-backward': () => { window.history.back(); rm.hideRightMenu(); },
      '#menu-forward': () => { window.history.forward(); rm.hideRightMenu(); },
      '#menu-refresh': () => window.location.reload(),
      '#menu-top': () => { btf.scrollToDest(0); rm.hideRightMenu(); },
      '#menu-darkmode': () => { this.switchDarkMode(); rm.hideRightMenu(); },
      '#menu-home': () => { window.location.href = window.location.origin; },
      '#menu-randomPost': () => { if (typeof toRandomPost === 'function') toRandomPost(); },
      '#menu-copy': () => { this.copyPageUrl(); },
      '#menu-pastetext': () => TextHandler.pasteText(),
      '#menu-copytext': () => TextHandler.copySelectedText(),
      '#menu-commenttext': () => TextHandler.quoteToComment(RightMenuCore.state.selectTextNow),
      '#menu-newwindow': () => { window.open(RightMenuCore.state.domHref); rm.hideRightMenu(); },
      '#menu-copylink': () => this.copyLink(),
      '#menu-downloadimg': () => heo.downloadImage(RightMenuCore.state.domImgSrc, 'SeaYJImageDownload'),
      '#menu-copyimg': () => ImageHandler.copyImageToClipboard(RightMenuCore.state.domImgSrc),
      '#menu-search': () => this.performSearch(),
      '#menu-searchBing': () => this.searchBing(),
      '#menu-music-toggle': () => heo.musicToggle(),
      '#menu-music-back': () => heo.musicSkipBack(),
      '#menu-music-forward': () => heo.musicSkipForward(),
      '#menu-music-copyMusicName': () => this.copyMusicName(),
      '#rightmenu-mask': () => rm.hideRightMenu(),
      '.menu-link': () => rm.hideRightMenu()
    };

    // 批量绑定事件
    Object.entries(handlers).forEach(([selector, handler]) => {
      $(document).on('click', selector, handler);
    });

    // 右键菜单遮罩右键事件
    $(document).on('contextmenu', '#rightmenu-mask', (e) => {
      rm.hideRightMenu();
      return false;
    });
  },

  // 防止图片拖拽
  initImageDragPrevention() {
    $(document).on('dragstart', 'img', () => false);
  },

  // 切换深色模式
  switchDarkMode() {
    if (typeof switchNightMode === 'function') {
      switchNightMode();
    } else {
      console.warn('switchNightMode function not found');
    }
  },

  // 复制页面链接
  async copyPageUrl() {
    const url = window.location.href;
    const success = await Utils.copyToClipboard(url);
    if (success) {
      Utils.showToast('复制本页链接地址成功', 2000);
    } else {
      Utils.showToast('复制失败，请重试');
    }
    rm.hideRightMenu();
  },

  // 复制链接
  async copyLink() {
    const success = await Utils.copyToClipboard(RightMenuCore.state.domHref);
    if (success) {
      Utils.showToast('已复制链接地址');
    } else {
      Utils.showToast('复制失败，请重试');
    }
    rm.hideRightMenu();
  },

  // 执行搜索
  performSearch() {
    rm.hideRightMenu();
    const searchIcon = Utils.safeQuery('#searchIcon');
    const searchInput = Utils.safeQuery('#searchInput');

    if (searchIcon) searchIcon.click();
    if (searchInput) {
      searchInput.value = RightMenuCore.state.selectTextNow;
      const inputEvent = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(inputEvent);
    }
  },

  // 必应搜索
  searchBing() {
    Utils.showToast('即将跳转到必应搜索', 2000);
    setTimeout(() => {
      const query = encodeURIComponent(RightMenuCore.state.selectTextNow);
      window.open(`https://cn.bing.com/search?q=${query}`);
    }, 1000);
    rm.hideRightMenu();
  },

  // 复制音乐名称
  async copyMusicName() {
    const musicName = heo.musicGetName();
    if (musicName) {
      const success = await Utils.copyToClipboard(musicName);
      if (success) {
        Utils.showToast('复制歌曲名称成功', 3000);
      } else {
        Utils.showToast('复制失败，请重试');
      }
    } else {
      Utils.showToast('未获取到歌曲名称');
    }
    rm.hideRightMenu();
  }
};

// ===== 导出的 RM 对象（保持向后兼容）=====
Object.assign(rm, {
  // 菜单控制
  showRightMenu: (isTrue, x = 0, y = 0) => RightMenuCore.showMenu(isTrue, x, y),
  hideRightMenu: () => RightMenuCore.hideMenu(),
  reloadrmSize: () => RightMenuCore.updateSize(),

  // 图片处理
  writeClipImg: (imgsrc) => ImageHandler.copyImageToClipboard(imgsrc),
  downloadimging: false, // 保持兼容性

  // 文本处理
  rightmenuCopyText: (txt) => Utils.copyToClipboard(txt),
  copyPageUrl: () => EventHandlers.copyPageUrl(),
  sharePage: () => EventHandlers.copyPageUrl(), // 别名
  readClipboard: () => TextHandler.pasteText(),
  insertAtCaret: (element, value) => TextHandler.insertAtCaret(element, value),
  pasteText: () => TextHandler.pasteText(),
  rightMenuCommentText: (txt) => TextHandler.quoteToComment(txt),

  // 搜索功能
  searchBing: () => EventHandlers.searchBing(),
  copyLink: () => EventHandlers.copyLink(),

  // 模式切换
  switchDarkMode: () => EventHandlers.switchDarkMode(),

  // 工具函数
  copyUrl: (text) => Utils.copyToClipboard(text), // 向后兼容

  // 禁用图片拖拽（保持向后兼容）
  stopdragimg: $("img")
});

// ===== 向后兼容的原始事件处理器 =====
window.oncontextmenu = function (event) {
  if (document.body.clientWidth > CONSTANTS.MOBILE_BREAKPOINT) {
    event.preventDefault();
    event.stopPropagation();

    const pageX = event.clientX + CONSTANTS.MENU_OFFSET;
    const pageY = event.clientY;

    RightMenuCore.state.globalEvent = event;
    RightMenuCore.updateMenuItems(event.target);
    RightMenuCore.updateSize();
    RightMenuCore.showMenu(true, pageX, pageY);

    return false;
  }
  return true;
};

// ===== 初始化 =====
$(document).ready(() => {
  // 初始化各个模块
  RightMenuCore.initElements();
  TextHandler.init();
  EventHandlers.init();

  console.log('Right menu system initialized successfully');
});

// ===== 向后兼容的函数 =====
function addRightMenuClickEvent() {
  // 这个函数现在由 EventHandlers.init() 自动调用
  console.log('addRightMenuClickEvent is deprecated, events are now auto-initialized');
}