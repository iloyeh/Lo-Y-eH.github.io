var searchFunc = function (path, search_id, content_id) {
    'use strict';

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    $.ajax({
        url: path,
        dataType: "xml",
        timeout: 5000,

        success: function (xmlResponse) {

            // 预处理搜索数据
            var datas = $("entry", xmlResponse).map(function () {

                var title = $("title", this).text();
                var content = $("content", this).text();
                var url = $("url", this).text();

                var cleanContent = content
                    .replace(/<[^>]+>/g, "")
                    .trim();

                return {
                    title: title,
                    url: url,
                    content: cleanContent,
                    lowerTitle: title.toLowerCase(),
                    lowerContent: cleanContent.toLowerCase()
                };
            }).get();

            var input = document.getElementById(search_id);
            var resultContent = document.getElementById(content_id);

            if (!input || !resultContent) {
                console.error('Search element not found');
                return;
            }

            var debounceTimer = null;

            input.addEventListener('input', function () {

                var value = this.value.trim();

                clearTimeout(debounceTimer);

                debounceTimer = setTimeout(function () {

                    resultContent.innerHTML = '';

                    if (!value) {
                        return;
                    }

                    var keywords = value
                        .toLowerCase()
                        .split(/[\s\-]+/)
                        .filter(Boolean);

                    var results = [];

                    datas.forEach(function (data) {

                        var score = 0;
                        var matched = true;
                        var firstOccur = -1;

                        keywords.forEach(function (keyword) {

                            var titleIndex = data.lowerTitle.indexOf(keyword);
                            var contentIndex = data.lowerContent.indexOf(keyword);

                            if (titleIndex < 0 && contentIndex < 0) {
                                matched = false;
                                return;
                            }

                            // 标题权重更高
                            if (titleIndex >= 0) {
                                score += 100;
                            }

                            if (contentIndex >= 0) {
                                score += 10;

                                if (firstOccur === -1) {
                                    firstOccur = contentIndex;
                                }
                            }
                        });

                        if (matched) {
                            results.push({
                                data: data,
                                score: score,
                                firstOccur: firstOccur
                            });
                        }
                    });

                    // 按评分排序
                    results.sort(function (a, b) {
                        return b.score - a.score;
                    });

                    var html = '<ul class="search-result-list">';

                    results.forEach(function (item) {

                        var data = item.data;

                        var snippet = '';

                        if (item.firstOccur >= 0) {

                            var start = Math.max(0, item.firstOccur - 20);
                            var end = Math.min(
                                data.content.length,
                                item.firstOccur + 80
                            );

                            if (start === 0) {
                                end = Math.min(
                                    data.content.length,
                                    100
                                );
                            }

                            snippet = data.content.substring(start, end);

                            keywords.forEach(function (keyword) {

                                var reg = new RegExp(
                                    '(' + escapeRegExp(keyword) + ')',
                                    'gi'
                                );

                                snippet = snippet.replace(
                                    reg,
                                    '<em class="search-keyword">$1</em>'
                                );
                            });

                            snippet =
                                '<p class="search-result">' +
                                snippet +
                                '...</p>';
                        }

                        html +=
                            '<li>' +
                            '<a href="' + data.url + '" class="search-result-title">' +
                            escapeHtml(data.title) +
                            '</a>' +
                            snippet +
                            '</li>';
                    });

                    html += '</ul>';

                    resultContent.innerHTML = html;

                }, 150);
            });
        },

        error: function () {
            console.error('Failed to load search.xml');
        }
    });
};