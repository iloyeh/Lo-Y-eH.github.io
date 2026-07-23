// 添加鼠标样式
var CURSOR;

Math.lerp = (a, b, n) => (1 - n) * a + n * b;

const getStyle = (el, attr) => {
    try {
        return window.getComputedStyle
            ? window.getComputedStyle(el)[attr]
            : el.currentStyle[attr];
    } catch (e) {}
    return "";
};

class Cursor {
    constructor() {
        this.pos = { curr: null, prev: null };
        this.pt = [];
        this.create();
        this.init();
        this.render();
    }

    move(left, top) {
        this.cursor.style.left = `${left}px`;
        this.cursor.style.top = `${top}px`;
    }

    create() {
        if (!this.cursor) {
            this.cursor = document.createElement("div");
            this.cursor.id = "cursor";
            this.cursor.classList.add("hidden");
            document.body.append(this.cursor);
        }

        this.pt = Array.from(document.querySelectorAll('*[style*="cursor:pointer"]')).map(el => el.outerHTML);

        document.body.appendChild((this.scr = document.createElement("style")));
        this.scr.innerHTML = `* {cursor: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12px' height='12px'><circle cx='6' cy='6' r='6' opacity='1.0' fill='rgb(57, 197, 187)'/></svg>") 6 6, auto}`;
    }

    refresh() {
        this.scr.remove();
        this.cursor.classList.remove("hover");
        this.cursor.classList.remove("active");
        this.pos = { curr: null, prev: null };
        this.pt = [];

        this.create();
        this.init();
        this.render();
    }

    init() {
        document.body.addEventListener('mouseover', e => {
            if (this.pt.includes(e.target.outerHTML)) {
                this.cursor.classList.add("hover");
            }
        });

        document.body.addEventListener('mouseout', e => {
            if (this.pt.includes(e.target.outerHTML)) {
                this.cursor.classList.remove("hover");
            }
        });

        document.body.addEventListener('mousemove', e => {
            if (!this.pos.curr) {
                this.move(e.clientX - 8, e.clientY - 8);
            }
            this.pos.curr = { x: e.clientX - 8, y: e.clientY - 8 };
            this.cursor.classList.remove("hidden");
        });

        document.body.addEventListener('mouseenter', e => {
            this.cursor.classList.remove("hidden");
        });

        document.body.addEventListener('mouseleave', e => {
            this.cursor.classList.add("hidden");
        });

        document.body.addEventListener('mousedown', e => {
            this.cursor.classList.add("active");
        });

        document.body.addEventListener('mouseup', e => {
            this.cursor.classList.remove("active");
        });
    }

    render() {
        if (this.pos.prev) {
            this.pos.prev.x = Math.lerp(this.pos.prev.x, this.pos.curr.x, 0.15);
            this.pos.prev.y = Math.lerp(this.pos.prev.y, this.pos.curr.y, 0.15);
            this.move(this.pos.prev.x, this.pos.prev.y);
        } else {
            this.pos.prev = this.pos.curr;
        }
        requestAnimationFrame(() => this.render());
    }
}

(() => {
    CURSOR = new Cursor();
    CURSOR.refresh();
})();