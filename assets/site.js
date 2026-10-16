/* ===== 提示词块一键复制 ===== */
document.querySelectorAll('.prompt').forEach(function (box) {
  var btn = box.querySelector('.copy-btn');
  var pre = box.querySelector('pre');
  if (!btn || !pre) return;

  btn.addEventListener('click', function () {
    var text = pre.innerText;

    function done() {
      btn.textContent = '已复制';
      setTimeout(function () { btn.textContent = '复制'; }, 1600);
    }
    function fail() {
      btn.textContent = '复制失败';
      setTimeout(function () { btn.textContent = '复制'; }, 1600);
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy') ? done() : fail();
      } catch (e) {
        fail();
      }
      document.body.removeChild(ta);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  });
});

/* ===== Mermaid 流程图（学习路线） ===== */
if (window.mermaid) {
  mermaid.initialize({
    startOnLoad: true,
    theme: 'neutral',
    securityLevel: 'loose',
    flowchart: { htmlLabels: true }
  });
}

/* ===== 网页版 PPT：翻页 + 侧边目录 ===== */
(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total = slides.length;
  var cur = 0;
  var lock = false;

  var pager = document.getElementById('pager');
  var progress = document.getElementById('progress');
  var tocEl = document.getElementById('toc');
  var tocToggle = document.getElementById('tocToggle');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');

  /* 目录数据：[分组标题, [[页码, 标题], ...]] */
  var TOC = [
    ['开篇', [[0, '封面'], [1, '四个基本操作'], [2, '完整路线'], [3, '前置概念']]],
    ['第0章 · 环境准备', [[4, '下载与安装'], [5, '认识界面'], [6, '打开文件夹与项目']]],
    ['第1章 · 准备内容', [[7, '整理已有材料'], [8, '可选 · AI 润色简历 ①'], [9, '素材命名与压缩']]],
    ['第2章 · 生成第一版', [[10, '核心提示词 ②'], [11, '让文件真正落盘'], [12, '预览与验收']]],
    ['第3章 · 迭代打磨', [[13, '把"不好看"说具体'], [14, '三类常用修改'], [15, '动效与整体风格'], [16, '5 套 UI 风格总览'], [17, '风格 1·2'], [18, '风格 3·4'], [19, '风格 5 与灵感库'], [20, '让 AI 帮写提示词'], [21, '移动端适配 ③']]],
    ['第4章 · 照片与文件', [[22, '嵌入照片 ④'], [23, '三个注意事项']]],
    ['第5章 · 检查与修复', [[24, 'F12 两种用法'], [25, '自查与排查顺序'], [26, '故障报告 ⑤']]],
    ['第6章 · 部署上线', [[27, '方案A Netlify'], [28, '方案B 注册与建仓库'], [29, '方案B 上传与开启 Pages'], [30, '二维码与更新']]],
    ['附录', [[31, '提示词合集 ①②'], [32, '提示词合集 ③④'], [33, '提示词合集 ⑤'], [34, 'FAQ（上）'], [35, 'FAQ（下）'], [36, '结语']]]
  ];

  var pageGroup = []; // pageGroup[slideIndex] = toc group element
  var pageBtn = [];   // pageBtn[slideIndex] = toc item button

  TOC.forEach(function (group) {
    var gEl = document.createElement('div');
    gEl.className = 'toc-group';
    var tEl = document.createElement('button');
    tEl.className = 'toc-group-title';
    tEl.innerHTML = '<span>' + group[0] + '</span><span class="chev">›</span>';
    tEl.addEventListener('click', function () {
      gEl.classList.toggle('expanded');
    });
    var itemsEl = document.createElement('div');
    itemsEl.className = 'toc-items';
    group[1].forEach(function (item) {
      var b = document.createElement('button');
      b.textContent = item[1];
      b.addEventListener('click', function () {
        go(item[0]);
        if (window.innerWidth < 860) tocEl.classList.remove('open');
      });
      itemsEl.appendChild(b);
      pageBtn[item[0]] = b;
      pageGroup[item[0]] = gEl;
    });
    gEl.appendChild(tEl);
    gEl.appendChild(itemsEl);
    tocEl.appendChild(gEl);
  });

  function inner() {
    return slides[cur].querySelector('.slide-inner');
  }

  function updateUI() {
    pager.textContent = (cur + 1) + ' / ' + total;
    progress.style.width = ((cur + 1) / total * 100) + '%';
    for (var i = 0; i < total; i++) {
      if (pageBtn[i]) pageBtn[i].classList.toggle('current', i === cur);
    }
    if (pageGroup[cur] && !pageGroup[cur].classList.contains('expanded')) {
      pageGroup[cur].classList.add('expanded');
    }
    if (window.history && history.replaceState) {
      history.replaceState(null, '', '#' + (cur + 1));
    }
  }

  function go(i) {
    if (i < 0 || i >= total || i === cur) return;
    slides[cur].classList.remove('active');
    cur = i;
    var s = slides[cur];
    s.classList.add('active');
    var si = s.querySelector('.slide-inner');
    if (si) si.scrollTop = 0;
    updateUI();
    lock = true;
    setTimeout(function () { lock = false; }, 600);
  }

  /* 滚轮翻页：页内还能滚动时先滚动页内 */
  window.addEventListener('wheel', function (e) {
    if (tocEl.classList.contains('open') && tocEl.contains(e.target)) return;
    var si = inner();
    if (si) {
      var canDown = si.scrollTop + si.clientHeight < si.scrollHeight - 2;
      var canUp = si.scrollTop > 2;
      if (e.deltaY > 0 && canDown) return;
      if (e.deltaY < 0 && canUp) return;
    }
    e.preventDefault();
    if (lock) return;
    if (e.deltaY > 0) go(cur + 1);
    else if (e.deltaY < 0) go(cur - 1);
  }, { passive: false });

  /* 键盘：↑↓/PgUp/PgDn/空格 优先滚动页内内容，滚到底/顶才翻页；← → 直接翻页 */
  window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') {
      e.preventDefault(); go(cur + 1); return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault(); go(cur - 1); return;
    }
    if (e.key === 'Home') {
      e.preventDefault(); go(0); return;
    }
    if (e.key === 'End') {
      e.preventDefault(); go(total - 1); return;
    }
    var scrollKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '];
    if (scrollKeys.indexOf(e.key) === -1) return;
    e.preventDefault();
    var down = (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ');
    var si = inner();
    if (si) {
      var canDown = si.scrollTop + si.clientHeight < si.scrollHeight - 2;
      var canUp = si.scrollTop > 2;
      var step = (e.key === 'ArrowDown' || e.key === 'ArrowUp') ? 56 : si.clientHeight * 0.85;
      if (down && canDown) { si.scrollTop += step; return; }
      if (!down && canUp) { si.scrollTop -= step; return; }
    }
    go(down ? cur + 1 : cur - 1);
  });

  /* 触摸滑动翻页 */
  var touchY = null;
  window.addEventListener('touchstart', function (e) {
    touchY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchend', function (e) {
    if (touchY === null) return;
    var dy = touchY - e.changedTouches[0].clientY;
    touchY = null;
    if (Math.abs(dy) < 48) return;
    var si = inner();
    if (si) {
      var canDown = si.scrollTop + si.clientHeight < si.scrollHeight - 2;
      var canUp = si.scrollTop > 2;
      if (dy > 0 && canDown) return;
      if (dy < 0 && canUp) return;
    }
    if (dy > 0) go(cur + 1); else go(cur - 1);
  }, { passive: true });

  /* 目录开关与上下页按钮 */
  tocToggle.addEventListener('click', function () {
    tocEl.classList.toggle('open');
  });
  prevBtn.addEventListener('click', function () { go(cur - 1); });
  nextBtn.addEventListener('click', function () { go(cur + 1); });

  /* 从 URL 锚点恢复页码 */
  var m = (location.hash || '').match(/^#(\d+)$/);
  var start = m ? Math.min(Math.max(parseInt(m[1], 10) - 1, 0), total - 1) : 0;
  slides[0].classList.remove('active');
  slides[start].classList.add('active');
  cur = start;
  updateUI();
})();
