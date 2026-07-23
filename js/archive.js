// 高性能归档页面管理器
const ArchivePerformance = {
    isTimelineLoaded: false,
    imageObserver: null,
    timelineObserver: null,
    postsData: null,
    featureImages: null,
    jsDelivrUrl: '',
    batchSize: 10,
    loadedBatches: 0,

    // 节流函数 - 性能优化
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },

    // 防抖函数
    debounce: function(func, wait) {
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

    // 初始化数据
    initData: function() {
        const timelineContent = document.getElementById('timeline-content');
        if (timelineContent) {
            this.postsData = JSON.parse(timelineContent.getAttribute('data-posts') || '[]');
            this.featureImages = JSON.parse(timelineContent.getAttribute('data-feature-images') || '[]');
            this.jsDelivrUrl = timelineContent.getAttribute('data-jsdelivr-url') || '';
        }
    },

    // 高性能时间轴内容创建
    createTimelineHTML: function(posts, startIndex, endIndex) {
        const fragment = document.createDocumentFragment();
        let currentYear = '';
        let currentMonth = '';

        for (let i = startIndex; i < Math.min(endIndex, posts.length); i++) {
            const post = posts[i];
            const timelineBlock = document.createElement('div');
            timelineBlock.className = 'cd-timeline-block lazy-timeline-item';
            timelineBlock.setAttribute('data-aos', 'fade-up');
            timelineBlock.setAttribute('data-aos-delay', Math.min((i % 8) * 120, 800));
            timelineBlock.setAttribute('data-aos-duration', '800');
            timelineBlock.setAttribute('data-index', i);
            timelineBlock.setAttribute('data-loaded', 'false');

            let html = '';

            // 年份
            if (post.year !== currentYear) {
                currentYear = post.year;
                html += `<div class="cd-timeline-img year" data-aos="zoom-in-up" data-aos-delay="${Math.min(i * 60 + 100, 600)}" data-aos-duration="600">
                            <a href="/archives/${currentYear}/" title="查看 ${currentYear} 年的文章">${currentYear}</a>
                        </div>`;
            }

            // 月份
            const yearMonth = `${post.year}-${post.month}`;
            if (yearMonth !== currentMonth) {
                currentMonth = yearMonth;
                html += `<div class="cd-timeline-img month" data-aos="zoom-in-up" data-aos-delay="${Math.min(i * 60 + 150, 700)}" data-aos-duration="600">
                            <a href="/archives/${post.year}/${post.month}/" title="查看 ${post.year}年${post.month}月的文章">${post.month}</a>
                        </div>`;
            }

            // 日期和内容
            const featureImg = post.img || this.featureImages[this.hashCode(post.title) % this.featureImages.length];
            const imgSrc = post.img ? post.img : `${this.jsDelivrUrl}${featureImg}`;

            html += `
                        <div class="cd-timeline-img day" data-aos="zoom-in-up" data-aos-delay="${Math.min(i * 60 + 200, 800)}" data-aos-duration="600">
                            <span>${post.day}</span>
                        </div>
                        <article class="cd-timeline-content" data-aos="fade-left" data-aos-delay="${Math.min(i * 60 + 250, 900)}" data-aos-duration="800">
                            <div class="article col s12 m6">
                                <div class="card timeline-card">
                                    <a href="${post.path}" title="${post.title}">
                                        <div class="card-image">
                                            <div class="box-content">
                                                <p class="title">阅读全文</p>
                                                <span class="post" style="width:180px; color: rgb(98, 169, 232); font-size: 22px; margin-top: 10px">${post.title}</span>
                                            </div>
                                            <img class="responsive-img lazy-image"
                                                 data-src="${imgSrc}"
                                                 src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3E加载中...%3C/text%3E%3C/svg%3E"
                                                 alt="${post.title}"
                                                 loading="lazy">
                                            <span class="card-title">${post.title}</span>
                                        </div>
                                    </a>
                                    <div class="card-content article-content">
                                        <div class="summary block-with-text">
                                            ${post.summary}...
                                        </div>
                                        <div class="publish-info">
                                            <span class="publish-date">
                                                <i class="far fa-clock fa-fw icon-date" aria-hidden="true"></i>
                                                <time datetime="${post.dateStr}">${post.dateStr}</time>
                                            </span>
                                            <span class="publish-author">
                                                ${post.hasCategories ?
                `<i class="fas fa-bookmark fa-fw icon-category" aria-hidden="true"></i>
                                                     <a href="${post.categoryPath}" class="post-category" title="${post.categoryName}">${post.categoryName}</a>` :
                `<i class="fas fa-user fa-fw" aria-hidden="true"></i>${post.author || '<%- config.author %>'}`
            }
                                            </span>
                                        </div>
                                    </div>
                                    ${post.tags && post.tags.length ?
                `<div class="card-action article-tags">
                                            ${post.tags.map(tag => `<a href="${tag.path}" title="${tag.name}"><span class="chip bg-color">${tag.name}</span></a>`).join('')}
                                         </div>` : ''
            }
                                </div>
                            </div>
                        </article>
                    `;

            timelineBlock.innerHTML = html;
            fragment.appendChild(timelineBlock);
        }

        return fragment;
    },

    // 虚拟滚动加载时间轴内容
    loadTimelineContent: function() {
        if (!this.postsData || this.postsData.length === 0) return;

        const timelineContent = document.getElementById('timeline-content');
        const loadBatch = () => {
            const start = this.loadedBatches * this.batchSize;
            const end = Math.min(start + this.batchSize, this.postsData.length);

            if (start >= this.postsData.length) return;

            const fragment = this.createTimelineHTML(this.postsData, start, end);
            timelineContent.appendChild(fragment);

            this.loadedBatches++;

            // 继续加载下一批
            if (end < this.postsData.length) {
                setTimeout(loadBatch, 100);
            } else {
                this.initLazyImages();
                console.log('时间轴内容加载完成');
            }
        };

        loadBatch();
    },

    // 优化的hashCode函数
    hashCode: function(str) {
        if (!str || str.length === 0) return 0;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    },

    // 高性能图片懒加载
    initLazyImages: function() {
        if (!('IntersectionObserver' in window)) return;

        const options = {
            root: null,
            rootMargin: '50px 0px',
            threshold: 0.1
        };

        this.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');

                    if (src) {
                        // 使用requestAnimationFrame优化性能
                        requestAnimationFrame(() => {
                            img.src = src;
                            img.classList.add('fade-in');
                            img.classList.remove('lazy-image');
                        });

                        this.imageObserver.unobserve(img);
                    }
                }
            });
        }, options);

        // 观察所有懒加载图片
        document.querySelectorAll('img.lazy-image').forEach(img => {
            this.imageObserver.observe(img);
        });
    }
};

// 视图状态管理
const ViewStateManager = {
    // 存储视图状态的key
    STORAGE_KEY: 'archive_view_state',

    // 保存当前视图状态
    saveViewState: function(viewType) {
        try {
            localStorage.setItem(this.STORAGE_KEY, viewType);
        } catch (e) {
            // 如果localStorage不可用，使用sessionStorage作为备选
            try {
                sessionStorage.setItem(this.STORAGE_KEY, viewType);
            } catch (e) {
                console.warn('无法保存视图状态');
            }
        }
    },

    // 获取保存的视图状态
    getViewState: function() {
        try {
            return localStorage.getItem(this.STORAGE_KEY) ||
                   sessionStorage.getItem(this.STORAGE_KEY) ||
                   'table'; // 默认显示时间列表
        } catch (e) {
            return 'table';
        }
    },

    // 恢复视图状态
    restoreViewState: function() {
        const viewState = this.getViewState();
        if (viewState === 'timeline') {
            showTime();
        } else {
            showTable();
        }
    }
};

// 修改原有的切换函数，添加状态保存
const showTime = ArchivePerformance.throttle(function() {
    $("#cd-timeline").show();
    $("#cd-table").hide();
    $("#sp-timeline").removeClass('inactive-chip').addClass('active-chip');
    $("#sp-table").removeClass('active-chip').addClass('inactive-chip');

    // 保存当前视图状态
    ViewStateManager.saveViewState('timeline');

    if (!ArchivePerformance.isTimelineLoaded) {
        ArchivePerformance.loadTimelineContent();
        ArchivePerformance.isTimelineLoaded = true;
    }

    // 延迟执行AOS刷新
    setTimeout(() => {
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }, 100);
}, 200);

const showTable = ArchivePerformance.throttle(function() {
    $("#cd-timeline").hide();
    $("#cd-table").show();
    $("#sp-table").removeClass('inactive-chip').addClass('active-chip');
    $("#sp-timeline").removeClass('active-chip').addClass('inactive-chip');

    // 保存当前视图状态
    ViewStateManager.saveViewState('table');

    setTimeout(() => {
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }, 100);
}, 200);

// 分页导航处理函数
function handlePageNavigation(url) {
    // 获取当前视图状态
    const currentViewState = ViewStateManager.getViewState();

    // 在URL中添加视图状态参数
    const separator = url.includes('?') ? '&' : '?';
    const newUrl = url + separator + 'view=' + currentViewState;

    // 跳转到新页面
    window.location.href = newUrl;
}

// 页面加载完成后的初始化
$(document).ready(function() {
    // 初始化数据
    ArchivePerformance.initData();

    // 检查URL参数中的视图状态
    const urlParams = new URLSearchParams(window.location.search);
    const urlViewState = urlParams.get('view');

    if (urlViewState) {
        // 如果URL中有视图状态参数，使用它并保存
        ViewStateManager.saveViewState(urlViewState);
        // 清理URL参数（可选）
        if (history.replaceState) {
            const cleanUrl = window.location.pathname + window.location.hash;
            history.replaceState(null, '', cleanUrl);
        }
    }

    // 恢复或设置视图状态
    ViewStateManager.restoreViewState();

    // 初始化懒加载图片（对于时间列表视图）
    ArchivePerformance.initLazyImages();
});

// 兼容性处理：确保全局函数可访问
window.showTime = showTime;
window.showTable = showTable;
window.handlePageNavigation = handlePageNavigation;

// 内存清理
window.addEventListener('beforeunload', () => {
    if (ArchivePerformance.imageObserver) {
        ArchivePerformance.imageObserver.disconnect();
    }
});