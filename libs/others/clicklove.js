/**
 * 点击页面生成爱心特效
 * 点击页面任意位置会在鼠标位置生成随机颜色的爱心并上浮消失
 */
(function(win, doc) {
  'use strict';

  const hearts = [];
  let rafId = null;
  let running = false;

  const raf = win.requestAnimationFrame
    || win.webkitRequestAnimationFrame
    || (cb => setTimeout(cb, 1000 / 60));

  /** 注入样式 */
  function injectStyles() {
    const css = `
      .heart {
        width: 10px; height: 10px;
        position: fixed;         /* 自身仍 fixed，跟随鼠标 */
        transform-origin: center;
        pointer-events: none;
      }
      .heart::after, .heart::before {
        content: '';
        width: 10px; height: 10px;
        background: inherit;
        border-radius: 50%;
        position: absolute;
      }
      .heart::after  { top: -5px; left: 0; }
      .heart::before { left: -5px; top: 0; }
    `;
    const style = doc.createElement('style');
    try { style.appendChild(doc.createTextNode(css)); }
    catch (e) { style.styleSheet.cssText = css; }
    doc.head.appendChild(style);
  }

  /** 随机颜色，位运算截断小数 */
  const randColor = () =>
    `rgb(${Math.random()*256|0},${Math.random()*256|0},${Math.random()*256|0})`;

  /** 创建爱心，不变样式只设一次 */
  function createHeart(x, y) {
    const el = doc.createElement('div');
    el.className = 'heart';
    const color = randColor();
    /* 不变属性：创建时设定，动画循环不再碰 */
    el.style.cssText =
      `background:${color};z-index:99999;` +
      `left:${x - 5}px;top:${y - 5}px;`;
    doc.body.appendChild(el);
    hearts.push({ el, x: x - 5, y: y - 5,
                  scale: 1, alpha: 1 });
  }

  /** 动画循环，每帧只更新 3 个变化属性 */
  function animate() {
    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i];
      h.alpha -= 0.013;
      if (h.alpha <= 0) {
        h.el.remove();
        hearts.splice(i, 1);
        continue;
      }
      h.y     -= 1;
      h.scale += 0.004;
      h.el.style.top       = h.y + 'px';
      h.el.style.opacity   = h.alpha;
      h.el.style.transform =
        `scale(${h.scale}) rotate(45deg)`;
    }
    rafId = raf(animate);
  }

  function handleClick(e) {
    createHeart(e.clientX, e.clientY);
  }

  /** 初始化 */
  function init() {
    if (running) return;
    running = true;
    injectStyles();
    /* addEventListener，不影响其他监听器 */
    doc.addEventListener('click', handleClick);
    animate();
  }

  /** 销毁（SPA 路由切换时调用） */
  function destroy() {
    doc.removeEventListener('click', handleClick);
    cancelAnimationFrame(rafId);
    hearts.forEach(h => h.el.remove());
    hearts.length = 0;
    running = false;
  }

  doc.readyState === 'loading'
    ? doc.addEventListener('DOMContentLoaded', init)
    : init();

  /* 暴露 destroy，方便 SPA 卸载 */
  win.clickLove = { destroy };

})(window, document);