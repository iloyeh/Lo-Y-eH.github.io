/* 鼠标点击雪花特效 */
(function fairyDustCursor() {
  const possibleColors = ["#D61C59", "#E7D84B", "#1B8798"];
  let width = window.innerWidth;
  let height = window.innerHeight;
  const cursor = { x: width / 2, y: width / 2 };
  const particles = [];

  function init() {
    bindEvents();
    loop();
  }

  // 绑定所需的事件
  function bindEvents() {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchstart', onTouchMove);
    window.addEventListener('resize', onWindowResize);
  }

  function onWindowResize() {
    width = window.innerWidth;
    height = window.innerHeight;
  }

  function onTouchMove(e) {
    if (e.touches.length > 0) {
      for (const touch of e.touches) {
        addParticle(touch.clientX, touch.clientY, getRandomColor());
      }
    }
  }

  function onMouseMove(e) {
    cursor.x = e.clientX;
    cursor.y = e.clientY;

    addParticle(cursor.x, cursor.y, getRandomColor());
  }

  function addParticle(x, y, color) {
    const particle = new Particle();
    particle.init(x, y, color);
    particles.push(particle);
  }

  function updateParticles() {
    for (const particle of particles) {
      particle.update();
    }

    particles.forEach((particle, index) => {
      if (particle.lifeSpan < 0) {
        particle.die();
        particles.splice(index, 1);
      }
    });
  }

  function loop() {
    requestAnimationFrame(loop);
    updateParticles();
  }

  class Particle {
    constructor() {
      this.character = "*";
      this.lifeSpan = 120; // ms
      this.initialStyles = {
        position: "fixed",
        top: "0",
        display: "block",
        pointerEvents: "none",
        "z-index": "9999",
        fontSize: "20px",
        "will-change": "transform",
      };
    }

    init(x, y, color) {
      this.velocity = {
        x: (Math.random() < 0.5 ? -1 : 1) * (Math.random() / 2),
        y: 1,
      };
      this.position = { x: x - 10, y: y - 20 };
      this.initialStyles.color = color;

      this.element = document.createElement('span');
      this.element.innerHTML = this.character;
      applyProperties(this.element, this.initialStyles);
      this.update();

      document.body.appendChild(this.element);
    }

    update() {
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
      this.lifeSpan--;

      this.element.style.transform = `translate3d(${this.position.x}px, ${this.position.y}px, 0) scale(${this.lifeSpan / 120})`;
    }

    die() {
      this.element.parentNode.removeChild(this.element);
    }
  }

  function applyProperties(target, properties) {
    for (const key in properties) {
      if (Object.hasOwnProperty.call(properties, key)) {
        target.style[key] = properties[key];
      }
    }
  }

  function getRandomColor() {
    return possibleColors[Math.floor(Math.random() * possibleColors.length)];
  }

  init();
})();