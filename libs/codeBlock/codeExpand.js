const expandCode = function () {
    this.classList.toggle('expand-done');
}

$(function () {
    let articleContent_CodeArea = document.getElementById('articleContent').getElementsByClassName('code-area');

    for (let CodeArea of articleContent_CodeArea) {

        // 总高度超过 300px 就添加展开按钮
        // 但是 64 是为了防止展开高度不足
        // 展开按钮高度应设置为 32px
        if (CodeArea.offsetHeight > 300 + 64) { 
            let $code_expand = document.createElement('div');
            $code_expand.className = 'code-expand-btn';
            $code_expand.style.width = CodeArea.offsetWidth + 'px';
            $code_expand.innerHTML = '<i class="fa-solid fa-angles-down"></i>';
            $code_expand.addEventListener('click', expandCode);
            CodeArea.insertAdjacentElement('afterbegin', $code_expand);
        }
        
    }
});