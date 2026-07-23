/**
 * 友链页面功能模块
 * @description 处理友链搜索、过滤、样式切换、随机访问等功能
 * @author GitHub Copilot
 * @version 1.0.0
 */

class FriendsManager {
    constructor(friendsData = []) {
        this.originalFriendsData = this.shuffleArray([...friendsData]);
        this.filteredFriends = [...this.originalFriendsData];
        this.currentStyle = 'butterfly';
        this.isSearching = false;
        this.debounceTimer = null;

        this.init();
    }

    /**
     * 初始化友链管理器
     */
    init() {
        this.initSearch();
        this.initKeyboardShortcuts();
        this.initCountAnimation();
        this.bindEvents();
    }

    /**
     * 数组随机排序
     * @param {Array} array - 需要排序的数组
     * @returns {Array} 随机排序后的数组
     */
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    /**
     * 初始化搜索功能
     */
    initSearch() {
        const searchInput = document.getElementById('friends-search');
        const clearIcon = document.getElementById('clear-search');

        if (!searchInput) return;

        // 搜索输入事件
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            this.handleSearchInput(value, clearIcon);
        });

        // 回车键搜索
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.filterFriends(e.target.value.toLowerCase().trim());
            }
        });
    }

    /**
     * 处理搜索输入
     * @param {string} value - 搜索关键词
     * @param {HTMLElement} clearIcon - 清除按钮元素
     */
    handleSearchInput(value, clearIcon) {
        // 显示/隐藏清除按钮
        if (value) {
            clearIcon.style.display = 'block';
            this.isSearching = true;

            // 防抖搜索
            this.debounce(() => {
                this.filterFriends(value.toLowerCase());
            }, 300);
        } else {
            clearIcon.style.display = 'none';
            this.isSearching = false;
            this.resetToOriginalList();
        }
    }

    /**
     * 防抖函数
     * @param {Function} func - 需要防抖的函数
     * @param {number} wait - 等待时间
     */
    debounce(func, wait) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(func, wait);
    }

    /**
     * 过滤友链
     * @param {string} keyword - 搜索关键词
     */
    filterFriends(keyword) {
        const noResults = document.querySelector('.no-search-results');
        const friendsList = document.getElementById('friends-list');

        if (!keyword) {
            this.resetToOriginalList();
            return;
        }

        // 过滤匹配的友链
        this.filteredFriends = this.originalFriendsData.filter(friend =>
            friend.name.toLowerCase().includes(keyword) ||
            (friend.introduction && friend.introduction.toLowerCase().includes(keyword)) ||
            (friend.title && friend.title.toLowerCase().includes(keyword))
        );

        // 显示结果
        if (this.filteredFriends.length === 0) {
            noResults.style.display = 'block';
            friendsList.style.display = 'none';
        } else {
            noResults.style.display = 'none';
            friendsList.style.display = '';
            this.renderFilteredFriends();
        }
    }

    /**
     * 重置到原始列表
     */
    resetToOriginalList() {
        this.filteredFriends = [...this.originalFriendsData];
        document.querySelector('.no-search-results').style.display = 'none';
        document.getElementById('friends-list').style.display = '';
        this.renderFilteredFriends();
    }

    /**
     * 清除搜索
     */
    clearSearch() {
        const searchInput = document.getElementById('friends-search');
        const clearIcon = document.getElementById('clear-search');

        if (searchInput) searchInput.value = '';
        if (clearIcon) clearIcon.style.display = 'none';

        this.isSearching = false;
        this.resetToOriginalList();
    }

    /**
     * 渲染过滤后的友链
     */
    renderFilteredFriends() {
        const friendsList = document.getElementById('friends-list');
        if (!friendsList) return;

        friendsList.innerHTML = this.filteredFriends.map((friend, index) =>
            this.createFriendCard(friend, index, this.currentStyle)
        ).join('');

        // 重新初始化AOS动画
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }

    /**
     * 创建友链卡片
     * @param {Object} friend - 友链信息
     * @param {number} index - 索引
     * @param {string} style - 样式类型
     * @returns {string} HTML字符串
     */
    createFriendCard(friend, index, style) {
        const safeTitle = this.escapeHtml(friend.introduction || friend.title || '');
        const safeName = this.escapeHtml(friend.name);

        if (style === 'butterfly') {
            return this.createButterflyCard(friend, index, safeName, safeTitle);
        } else {
            return this.createFlexCard(friend, index, safeName, safeTitle);
        }
    }

    /**
     * 创建传统风格卡片
     * @param {Object} friend - 友链信息
     * @param {number} index - 索引
     * @param {string} safeName - 安全的名称
     * @param {string} safeTitle - 安全的标题
     * @returns {string} HTML字符串
     */
    createButterflyCard(friend, index, safeName, safeTitle) {
        return `
            <div class="flink-list-item" data-aos="zoom-in-up" data-aos-delay="${index * 50}">
                <a href="${friend.url}" target="_blank" rel="noopener"
                   title="${safeName} - ${safeTitle}"
                   onclick="friendsManager.recordFriendClick('${safeName}')">
                    <div class="flink-item-icon">
                        <img src="${friend.avatar}"
                             alt="${safeName}"
                             loading="lazy"
                             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                        <div class="avatar-fallback" style="display:none;">
                            <i class="fas fa-user"></i>
                        </div>
                    </div>
                    <div class="flink-item-info">
                        <div class="flink-item-name">${friend.name}</div>
                        <div class="flink-item-desc">${friend.introduction || friend.title || '暂无描述'}</div>
                    </div>
                </a>
            </div>
        `;
    }

    /**
     * 创建封面风格卡片
     * @param {Object} friend - 友链信息
     * @param {number} index - 索引
     * @param {string} safeName - 安全的名称
     * @param {string} safeTitle - 安全的标题
     * @returns {string} HTML字符串
     */
    createFlexCard(friend, index, safeName, safeTitle) {
        return `
            <a href="${friend.url}"
               target="_blank"
               rel="noopener"
               data-title="${safeName}"
               title="${safeName} - ${safeTitle}"
               onclick="friendsManager.recordFriendClick('${safeName}')">
                <div class="wrapper">
                    <img src="${friend.avatar}"
                         alt="${safeName}"
                         loading="lazy"
                         class="cover"
                         onerror="this.style.display='none';this.parentElement.classList.add('img-error');">
                </div>
                <div class="info">
                    <img src="${friend.avatar}"
                         alt="${safeName}"
                         loading="lazy"
                         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                    <div class="avatar-fallback" style="display:none;">
                        <i class="fas fa-user"></i>
                    </div>
                    <span>${friend.name}</span>
                </div>
            </a>
        `;
    }

    /**
     * 切换友链样式
     */
    switchStyle() {
        const friendsList = document.getElementById('friends-list');
        const switchBtn = document.getElementById('switch-btn');

        if (!friendsList || !switchBtn || this.filteredFriends.length === 0) return;

        // 添加切换动画
        friendsList.style.opacity = '0';
        friendsList.style.transform = 'translateY(20px)';

        setTimeout(() => {
            if (this.currentStyle === 'butterfly') {
                friendsList.className = 'flexcard-flink-list';
                this.currentStyle = 'flexcard';
                switchBtn.innerHTML = '<i class="fas fa-th-list"></i><span class="btn-text">传统风格</span><span class="shortcut-hint">Ctrl+S</span>';
            } else {
                friendsList.className = 'butterfly-flink-list';
                this.currentStyle = 'butterfly';
                switchBtn.innerHTML = '<i class="fas fa-th-large"></i><span class="btn-text">封面风格</span><span class="shortcut-hint">Ctrl+S</span>';
            }

            this.renderFilteredFriends();

            setTimeout(() => {
                friendsList.style.opacity = '1';
                friendsList.style.transform = 'translateY(0)';
            }, 50);
        }, 300);
    }

    /**
     * 随机访问友链
     */
    randomVisit() {
        if (this.filteredFriends.length === 0) return;

        const randomIndex = Math.floor(Math.random() * this.filteredFriends.length);
        const randomFriend = this.filteredFriends[randomIndex];

        // 记录访问
        this.recordFriendClick(randomFriend.name);

        // 打开链接
        window.open(randomFriend.url, '_blank');

        // 显示提示
        this.showToast(`正在访问：${randomFriend.name}`);
    }

    /**
     * 记录友链点击
     * @param {string} friendName - 友链名称
     */
    recordFriendClick(friendName) {
        console.log(`访问友链：${friendName}`);

        // 这里可以添加统计代码，比如Google Analytics或百度统计
        if (typeof gtag !== 'undefined') {
            gtag('event', 'friend_click', {
                'friend_name': friendName,
                'page_title': document.title
            });
        }
    }

    /**
     * 复制申请模板到剪贴板
     */
    copyTemplate() {
        const templateContent = document.getElementById('friend-template');
        if (!templateContent) return;

        const templateRows = templateContent.querySelectorAll('[data-template-line]');
        const text = templateRows.length > 0
            ? Array.from(templateRows)
                .map(row => row.getAttribute('data-template-line'))
                .join('\n')
            : templateContent.textContent.trim();

        // 使用现代 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('申请模板已复制到剪贴板！', 'success');
            }).catch(() => {
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    }

    /**
     * 备用复制方法（兼容旧浏览器）
     * @param {string} text - 要复制的文本
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            this.showToast('申请模板已复制到剪贴板！', 'success');
        } catch (err) {
            this.showToast('复制失败，请手动复制', 'error');
        }

        document.body.removeChild(textArea);
    }

    /**
     * 显示提示消息
     * @param {string} message - 提示消息
     * @param {string} type - 消息类型 success/error/info
     */
    showToast(message, type = 'info') {
        // 移除已存在的toast
        const existingToast = document.querySelector('.friends-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `friends-toast friends-toast-${type}`;
        toast.textContent = message;

        // 设置不同类型的样式
        switch (type) {
            case 'success':
                toast.style.background = '#4caf50';
                break;
            case 'error':
                toast.style.background = '#f44336';
                break;
            default:
                toast.style.background = 'var(--theme-color)';
        }

        document.body.appendChild(toast);

        // 添加进入动画
        toast.style.animation = 'slideInRight 0.3s ease-out';

        // 3秒后自动移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 3000);
    }

    /**
     * 初始化键盘快捷键
     */
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + S 虽然也是浏览器快捷键（保存页面），但可以被 preventDefault() 阻止
            if (e.ctrlKey && e.key === 's' && this.originalFriendsData.length > 0) {
                e.preventDefault();
                this.switchStyle();
            }
            // Ctrl + W 是浏览器的内置快捷键，用于关闭当前标签页，无法被 JavaScript 阻止
            // 浏览器对某些关键快捷键（如关闭标签页）有更高的安全优先级，JavaScript 无法覆盖这些操作。
            // 将 Ctrl + W 改为 Ctrl + F
            if (e.ctrlKey && e.key === 'f' && this.originalFriendsData.length > 0) {
                e.preventDefault();
                this.randomVisit();
            }
        });
    }

    /**
     * 初始化计数动画
     */
    initCountAnimation() {
        const countElement = document.getElementById('friends-count');
        if (!countElement || this.originalFriendsData.length === 0) return;

        let start = 0;
        const end = this.originalFriendsData.length;
        const duration = 1000;
        const increment = end / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                countElement.textContent = end;
                clearInterval(timer);
            } else {
                countElement.textContent = Math.floor(start);
            }
        }, 16);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 可以在这里添加其他需要绑定的事件
    }

    /**
     * HTML转义
     * @param {string} text - 需要转义的文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 获取当前过滤的友链数量
     * @returns {number} 友链数量
     */
    getFilteredCount() {
        return this.filteredFriends.length;
    }

    /**
     * 获取总友链数量
     * @returns {number} 总友链数量
     */
    getTotalCount() {
        return this.originalFriendsData.length;
    }
}

// 全局变量和函数（为了向后兼容）
let friendsManager;

// 向后兼容的全局函数
function switchFriendsStyle() {
    if (friendsManager) {
        friendsManager.switchStyle();
    }
}

function randomVisitFriend() {
    if (friendsManager) {
        friendsManager.randomVisit();
    }
}

function clearSearch() {
    if (friendsManager) {
        friendsManager.clearSearch();
    }
}

function recordFriendClick(friendName) {
    if (friendsManager) {
        friendsManager.recordFriendClick(friendName);
    }
}

// 全局复制模板函数（为了支持HTML中的onclick调用）
function copyTemplate() {
    if (friendsManager) {
        friendsManager.copyTemplate();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 从页面获取友链数据（由EJS模板注入）
    const friendsData = window.FRIENDS_DATA || [];
    friendsManager = new FriendsManager(friendsData);
});

// 添加必要的CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }

    .friends-toast {
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);
