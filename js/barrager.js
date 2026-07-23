/**
 *@name     jquery.barrager.js
 *@version  1.1
 *@author   yaseng@uauc.net
 *@url      https://github.com/yaseng/jquery.barrager.js
 */
(function($) {
	$.fn.barrager = function(barrage) {
		barrage = $.extend({
			close: true,
			max: 10,
			speed: 16,
			color: '#ffffff',
		}, barrage || {});

		const time = new Date().getTime();
		const barrager_id = 'barrage_' + time;
		const id = '#' + barrager_id;
		const div_barrager = $("<div class='barrage' id='" + barrager_id + "'></div>").appendTo($(this));
		const this_height = $(window).height() * 0.35;
		const this_width = $(window).width() + 100;
		const array = [
			(this_height / 5) + $(window).height() * 0.5,
			2*(this_height / 5) + $(window).height() * 0.5,
			3*(this_height / 5) + $(window).height() * 0.5,
			4*(this_height / 5) + $(window).height() * 0.5,
			5*(this_height / 5)   + $(window).height() * 0.5
		]
		const bottom =array[Math.floor(Math.random()*5)];

		div_barrager.css("bottom", bottom + "px");
		div_barrager_box = $("<div class='barrage_box cl'></div>").appendTo(div_barrager);
		if(barrage.img){
			div_barrager_box.append("<a class='portrait z' href='javascript:;'></a>");
			const img = $("<img src='' >").appendTo(id + " .barrage_box .portrait");
			img.attr('src', barrage.img);
		}
		div_barrager_box.append(" <div class='z p'></div>");
		if(barrage.close){
			div_barrager_box.append(" <div class='close z'></div>");
		}

		const content = $("<a title='' href='' target='_blank'></a>").appendTo(id + " .barrage_box .p");
		content.attr({
			'href': barrage.href,
			'id': barrage.id
		}).empty().append(barrage.info);
		content.css('color', barrage.color);

		const i = 0;
		div_barrager.css('margin-right', 0);
		
 		$(id).animate({right:this_width},barrage.speed*1000,function()
		{
			$(id).remove();
		});

		div_barrager_box.mouseover(function()
		{
		     $(id).stop(true);
		});

		div_barrager_box.mouseout(function()
		{
			$(id).animate({right:this_width},barrage.speed*1000,function()
			{
				$(id).remove();
			});
 		});

		$(id+'.barrage .barrage_box .close').click(function()
		{
			$(id).remove();
		})
	}


	$.fn.barrager.removeAll=function()
	{
		 $('.barrage').remove();
	}

})(jQuery);



// ========== 联系页面弹幕功能扩展 ==========

// 全局变量控制弹幕状态
let barrageEnabled = true;
let barrageTimer = null;

/**
 * 弹幕模态框控制函数
 */
function openBarrageModal() {
    const modal = document.getElementById('barrageModal');
    modal.classList.add('show');
    // 清空输入框
    document.getElementById('barrage-info').value = '';
    document.getElementById('barrage-href').value = '';
    document.getElementById('barrage-speed').value = '15';
    // 聚焦到第一个输入框
    setTimeout(() => {
        document.getElementById('barrage-info').focus();
    }, 100);
}

function closeBarrageModal() {
    const modal = document.getElementById('barrageModal');
    modal.classList.remove('show');
}

function sendBarrage() {
    const info = document.getElementById('barrage-info').value.trim();
    const href = document.getElementById('barrage-href').value.trim();
    const speed = parseInt(document.getElementById('barrage-speed').value);

    // 验证输入
    if (!info) {
        alert('请输入弹幕内容！');
        return;
    }

    if (speed < 5 || speed > 20) {
        alert('弹幕速度必须在5-20之间！');
        return;
    }

    // 使用原有的弹幕发送逻辑
    const finalInfo = info || "hello world";
    const finalHref = href || "https://iloyeh.github.io/404";
    const finalSpeed = (speed < 5 || speed > 20) ? Math.floor(10 * Math.random()) + 5 : speed;

    const r = AV.Object.extend("barrager");
    const t = new r;
    t.set("href", finalHref);
    t.set("info", finalInfo);
    t.set("speed", finalSpeed);

    t.save().then(e => {
        // 显示成功消息
        showMessage('弹幕发送成功！', 'success');
        closeBarrageModal();
    }).catch(error => {
        showMessage('弹幕发送失败，请重试！', 'error');
        console.error('发送弹幕失败:', error);
    });
}

function closeAllBarrage() {
    if (barrageEnabled) {
        // 关闭弹幕
        if (confirm('确定要关闭弹幕显示吗？关闭后将不再自动显示新弹幕。')) {
            barrageEnabled = false;
            // 清除当前所有弹幕
            $.fn.barrager.removeAll();
            // 停止定时器
            if (barrageTimer) {
                clearInterval(barrageTimer);
                barrageTimer = null;
            }
            // 保存状态到 localStorage
            localStorage.setItem('barrageEnabled', 'false');
            showMessage('弹幕已关闭！', 'success');
            // 更新按钮文字
            updateBarrageButton();
            closeBarrageModal();
        }
    } else {
        // 开启弹幕
        barrageEnabled = true;
        localStorage.setItem('barrageEnabled', 'true');
        showMessage('弹幕已开启！', 'success');
        // 更新按钮文字
        updateBarrageButton();
        // 重新启动弹幕
        if (typeof AV !== 'undefined' && document.getElementById('contact')) {
            startBarrager();
        }
        closeBarrageModal();
    }
}

// 更新按钮文字和图标
function updateBarrageButton() {
    const btn = document.querySelector('.barrage-btn-secondary');
    if (btn) {
        const icon = btn.querySelector('i');
        const textNodes = Array.from(btn.childNodes).filter(node => node.nodeType === 3);

        if (barrageEnabled) {
            icon.className = 'fas fa-eye-slash';
            btn.innerHTML = '<i class="fas fa-eye-slash"></i> 关闭';
        } else {
            icon.className = 'fas fa-eye';
            btn.innerHTML = '<i class="fas fa-eye"></i> 开启';
        }
    }
}

// 显示消息提示
function showMessage(text, type = 'info') {
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 3000;
        animation: messageSlideIn 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;

    if (type === 'success') {
        messageDiv.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
    } else if (type === 'error') {
        messageDiv.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
    } else {
        messageDiv.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
    }

    messageDiv.textContent = text;
    document.body.appendChild(messageDiv);

    // 自动移除消息
    setTimeout(() => {
        messageDiv.style.animation = 'messageSlideOut 0.3s ease-in';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// 原有的表单弹幕发送功能（兼容性保留）
function run() {
    let e = $("input[name=info]").val()
        , n = (e = "" === e ? "hello world" : e,
            $("input[name=href]").val())
        , a = (n = "" === n ? "https://iloyeh.github.io/404" : n,
            parseInt($("input[name=speed]").val()));
    (20 < a || a < 5) && (a = Math.floor(10 * Math.random()) + 5);
    const r = AV.Object.extend("barrager")
        , t = new r;
    t.set("href", n),
        t.set("info", e),
        t.set("speed", a),
        t.save().then(e => {
            $(" input[ name='info' ] ").val(""),
                $(" input[ name='href' ] ").val(""),
                $(" input[ name='speed' ] ").val("")
        }
        )
}

function clear_barrage() {
    $.fn.barrager.removeAll()
}

// DOM加载完成后初始化
$(document).ready(function() {
    // 从 localStorage 读取弹幕状态
    const savedBarrageEnabled = localStorage.getItem('barrageEnabled');
    if (savedBarrageEnabled === 'false') {
        barrageEnabled = false;
    } else {
        barrageEnabled = true;
    }

    // 添加消息动画样式
    const messageStyle = document.createElement('style');
    messageStyle.textContent = `
        @keyframes messageSlideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes messageSlideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(messageStyle);

    // 如果在联系页面，初始化弹幕相关事件
    if (document.getElementById('barrageModal')) {
        // 初始化滑块功能
        initSpeedSlider();

        // 更新按钮状态
        updateBarrageButton();

        // 点击模态框外部关闭
        document.getElementById('barrageModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeBarrageModal();
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const modal = document.getElementById('barrageModal');
                if (modal.classList.contains('show')) {
                    closeBarrageModal();
                }
            }
        });

        // 回车键发送弹幕
        const barrageInfo = document.getElementById('barrage-info');
        if (barrageInfo) {
            barrageInfo.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendBarrage();
                }
            });
        }
    }

    // 初始化弹幕显示（如果在联系页面且有弹幕数据）
    if (typeof AV !== 'undefined' && document.getElementById('contact')) {
        if (barrageEnabled) {
            startBarrager();
        }
    }
});

/**
 * 初始化速度滑块功能
 */
function initSpeedSlider() {
    const slider = document.getElementById('barrage-speed');
    const display = document.getElementById('speed-display');

    if (!slider || !display) return;

    // 更新显示值和滑块进度
    function updateSlider(value) {
        display.textContent = value;
        // 计算百分比并更新CSS变量
        const percent = ((value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.setProperty('--slider-percent', percent + '%');

        // 添加动画效果
        display.style.transform = 'scale(1.1)';
        setTimeout(() => {
            display.style.transform = 'scale(1)';
        }, 200);
    }

    // 初始化滑块进度
    updateSlider(slider.value);

    // 滑块值改变时更新显示
    slider.addEventListener('input', function() {
        updateSlider(this.value);
    });

    // 鼠标滚轮支持
    slider.addEventListener('wheel', function(e) {
        e.preventDefault();

        let currentValue = parseInt(this.value);
        const step = 1;

        // 向上滚动增加速度，向下滚动减少速度
        if (e.deltaY < 0) {
            currentValue = Math.min(parseInt(this.max), currentValue + step);
        } else {
            currentValue = Math.max(parseInt(this.min), currentValue - step);
        }

        this.value = currentValue;
        updateSlider(currentValue);
    }, { passive: false });

    // 键盘支持（左右箭头）
    slider.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            setTimeout(() => {
                updateSlider(this.value);
            }, 0);
        }
    });
}

// 启动弹幕显示
function startBarrager() {
    if (typeof AV === 'undefined' || !document.getElementById('contact')) return;

    async function do_barrager() {
        let lists = [];
        const query = new AV.Query("barrager")
            , barrager = await query.find().then(e => {
                lists = e
            }
            );
        let length = lists.length
            , index = 0;
        barrageTimer = setInterval(() => {
            if (index === length)
                clearInterval(barrageTimer),
                    do_barrager();
            else {
                let obj = lists[index]
                    , jsonObject = eval("(" + JSON.stringify(obj) + ")");
                $("body").barrager({
                    img: "/medias/barrager/" + Math.floor(10 * Math.random()) + ".png",
                    href: jsonObject.href,
                    info: jsonObject.info,
                    speed: jsonObject.speed - 5
                }),
                    index++
            }
        }
            , 900)
    }

    do_barrager();
}
