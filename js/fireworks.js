"use strict";

/**
 * 烟花效果脚本 - 适配 anime.js 4.0.2
 * 优化版本 - 提高性能和可读性
 */

class FireworksEffect {
    constructor() {
        this.canvas = document.querySelector(".fireworks");
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext("2d");
        this.numberOfParticles = 30;
        this.pointerX = 0;
        this.pointerY = 0;
        this.colors = ["#FF1461", "#18FF92", "#5A87FF", "#FBF38C"];

        this.init();
    }

    init() {
        // 设置canvas样式
        this.canvas.style.zIndex = "1";

        // 初始化渲染器 - 适配 anime.js 4.0.2
        this.render = anime({
            duration: Infinity,
            update: () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
        });

        // 绑定事件
        this.bindEvents();

        // 设置初始canvas大小
        this.setCanvasSize();
    }

    bindEvents() {
        // 防抖的窗口大小调整事件
        const debouncedResize = this.debounce(() => this.setCanvasSize(), 500);
        window.addEventListener("resize", debouncedResize, false);

        // 点击事件
        document.addEventListener("mousedown", (e) => this.handleClick(e), false);

        // 触摸事件支持
        document.addEventListener("touchstart", (e) => this.handleClick(e), false);
    }

    handleClick(e) {
        const target = e.target;

        // 排除特定元素
        if (this.shouldIgnoreTarget(target)) {
            return;
        }

        this.render.play();
        this.updateCoords(e);
        this.animateParticles(this.pointerX, this.pointerY);
    }

    shouldIgnoreTarget(target) {
        return target.id === "sidebar" ||
               target.id === "toggle-sidebar" ||
               target.nodeName === "A" ||
               target.nodeName === "IMG";
    }

    updateCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        this.pointerX = clientX - rect.left;
        this.pointerY = clientY - rect.top;
    }

    setCanvasSize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.canvas.width = width * 2;
        this.canvas.height = height * 2;
        this.canvas.style.width = width + "px";
        this.canvas.style.height = height + "px";

        // 设置高DPI支持
        this.ctx.scale(2, 2);
    }

    // 使用简单的随机数生成函数替代 anime.random
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getParticleDirection(particle) {
        const angle = this.random(0, 360) * Math.PI / 180;
        const distance = this.random(50, 180);
        const direction = [-1, 1][this.random(0, 1)] * distance;

        return {
            x: particle.x + direction * Math.cos(angle),
            y: particle.y + direction * Math.sin(angle)
        };
    }

    createParticle(x, y) {
        const particle = {
            x: x,
            y: y,
            color: this.colors[this.random(0, this.colors.length - 1)],
            radius: this.random(16, 32)
        };

        particle.endPos = this.getParticleDirection(particle);
        particle.draw = () => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, 2 * Math.PI, true);
            this.ctx.fillStyle = particle.color;
            this.ctx.fill();
        };

        return particle;
    }

    createCircle(x, y) {
        const circle = {
            x: x,
            y: y,
            color: "#F00",
            radius: 0.1,
            alpha: 0.5,
            lineWidth: 6
        };

        circle.draw = () => {
            this.ctx.globalAlpha = circle.alpha;
            this.ctx.beginPath();
            this.ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI, true);
            this.ctx.lineWidth = circle.lineWidth;
            this.ctx.strokeStyle = circle.color;
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        };

        return circle;
    }

    renderParticle(animation) {
        // 适配 anime.js 4.0.2 的新 API
        if (animation.animations) {
            animation.animations.forEach(anim => {
                if (anim.animatable && anim.animatable.target && anim.animatable.target.draw) {
                    anim.animatable.target.draw();
                }
            });
        }
    }

    animateParticles(x, y) {
        const circle = this.createCircle(x, y);
        const particles = [];

        // 创建粒子
        for (let i = 0; i < this.numberOfParticles; i++) {
            particles.push(this.createParticle(x, y));
        }

        // 粒子动画 - 适配 anime.js 4.0.2
        particles.forEach(particle => {
            anime({
                targets: particle,
                x: particle.endPos.x,
                y: particle.endPos.y,
                radius: 0.1,
                duration: this.random(1200, 1800),
                easing: 'easeOutExpo',
                update: () => {
                    particle.draw();
                }
            });
        });

        // 圆圈动画 - 适配 anime.js 4.0.2
        anime({
            targets: circle,
            radius: this.random(80, 160),
            lineWidth: 0,
            alpha: 0,
            duration: this.random(1200, 1800),
            easing: 'easeOutExpo',
            update: () => {
                circle.draw();
            }
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// 等待 anime.js 加载完成后再初始化烟花效果
function initFireworks() {
    // 检查 anime 是否已定义
    if (typeof anime !== 'undefined') {
        new FireworksEffect();
    } else {
        // 如果 anime 还未加载，延迟重试
        setTimeout(initFireworks, 100);
    }
}

// 初始化烟花效果 - 确保 anime.js 已加载
document.addEventListener('DOMContentLoaded', () => {
    initFireworks();
});

// 如果DOM已经加载完成，直接初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initFireworks();
    });
} else {
    initFireworks();
}
