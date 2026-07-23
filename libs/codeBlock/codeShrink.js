// 代码块收缩

// $(function () {
//   var $code_expand = $('<i class="fas fa-angle-up code-expand" aria-hidden="true"></i>');

//   $('.code-area').prepend($code_expand);
//   $('.code-expand').on('click', function () {
//     if ($(this).parent().hasClass('code-closed')) {
//       $(this).siblings('pre').find('code').show();
//       $(this).parent().removeClass('code-closed');
//     } else {
//       $(this).siblings('pre').find('code').hide();
//       $(this).parent().addClass('code-closed');
//     }
//   });
// });

$(function () {
  var $code_expand = $('<i class="fas fa-angle-up code-expand" aria-hidden="true"></i>');

  $('.code-area').each(function() { // 对每个.code-area元素进行操作
    var $pre = $(this).children('pre');
    var lines = $pre.text().split('\n').length; // 计算代码的行数

    if (lines > 10) {
      $(this).addClass('code-closed'); // 如果代码行数超过10，则默认折叠
      $pre.find('code').hide(); // 隐藏代码
    }

    $(this).prepend($code_expand.clone(true)); // 在每个.code-area前添加展开图标，使用clone确保每个元素都有独立的实例
  });

  $('.code-expand').on('click', function () {
    var $codeBlock = $(this).siblings('pre').find('code');
    var $codeArea = $(this).parent();

    if ($codeArea.hasClass('code-closed')) {
      $codeBlock.show();
      $codeArea.removeClass('code-closed');
      $(this).removeClass('fa-angle-up').addClass('fa-angle-down'); // 更改图标，表示已展开
    } else {
      $codeBlock.hide();
      $codeArea.addClass('code-closed');
      $(this).removeClass('fa-angle-down').addClass('fa-angle-up'); // 更改图标，表示已折叠
    }
  });
});


