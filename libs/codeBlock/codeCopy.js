// 代码块一键复制

$(function () {
    const $copyIcon = $('<i class="fas fa-copy code_copy" title="复制代码" aria-hidden="true"></i>');
    const $noticeTemplate = $('<div class="codecopy_notice"></div>');
    
    $('.code-area').prepend($copyIcon, $noticeTemplate.clone()); // 克隆通知元素以复用模板

    function showNotice($notice, message, isSuccess = true) {
        const animationProps = {
            opacity: 1,
            top: isSuccess ? 30 : 0 // 根据成功与否调整初始top值
        };
        
        $notice.text(message)
              .css('opacity', 0) // 初始化透明度以确保动画效果
              .animate(animationProps, 450)
              .delay(400) // 使用delay代替setTimeout以链式调用
              .animate({ opacity: 0, top: isSuccess ? 0 : -30 }, 650); // 动画结束后适当调整位置
    }

    $('.code-area .fa-copy').on('click', function () {
        const $codeBlock = $(this).siblings('pre').find('code');
        const range = document.createRange();
        range.selectNodeContents($codeBlock[0]);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        try {
            document.execCommand('copy');
            showNotice($copyIcon.prev('.codecopy_notice'), "复制成功", true);
        } catch (ex) {
            showNotice($copyIcon.prev('.codecopy_notice'), "复制失败", false);
        } finally {
            selection.removeAllRanges();
        }
    });
});