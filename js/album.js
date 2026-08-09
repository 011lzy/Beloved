    // ========== 相册寄语 App 逻辑 ==========
(function () {
  "use strict";

  /* =========================================================
   * 模块一：内部状态（IIFE 私有，避免污染全局）
   * ========================================================= */
  var albumTimer = null;          // 自动留言检查定时器
  var toastTimer = null;          // toast 计时器
  var currentDetailId = null;     // 当前查看详情的照片 id
  var recatPhotoId = null;        // 当前待重新分类的照片 id
  var editingChannel = null;      // 正在编辑的留言通道 'his' | 'my' | null
  var wallBound = false;          // 墙面交互是否已绑定（防止重复绑定）

  // 长按判定相关
  var longPressTimer = null;
  var longPressTriggered = false;
  var pressStartX = 0, pressStartY = 0;
  var pressTargetId = null;

  /* =========================================================
   * 模块二：数据初始化与存取
   * ========================================================= */
  // 初始化 albumData 结构，确保字段存在
  function initAlbumData() {
    if (typeof appData === "undefined" || !appData) { window.appData = {}; }
    if (!appData.albumData) appData.albumData = {};
    var d = appData.albumData;
    if (!Array.isArray(d.photos)) d.photos = [];
    if (!Array.isArray(d.categories) || d.categories.length === 0) {
      d.categories = ["日常", "风景", "食物", "合照", "他拍的", "我拍的"];
    }
    if (!d.currentCategory || d.categories.indexOf(d.currentCategory) === -1) {
      d.currentCategory = d.categories[0];
    }
    /* 相册自定义设置 */
    if (!d.settings) d.settings = {};
    var s = d.settings;
    if (typeof s.textColor === "undefined") s.textColor = "";
    if (typeof s.fontFamily === "undefined") s.fontFamily = "";
    if (typeof s.bgImage === "undefined") s.bgImage = "";
    if (typeof s.bgColor === "undefined") s.bgColor = "";
    if (typeof s.polaroidColor === "undefined") s.polaroidColor = "";
    if (typeof s.backBtnImage === "undefined") s.backBtnImage = "";
    if (typeof s.menuBtnImage === "undefined") s.menuBtnImage = "";
    // 为旧数据补齐字段，保证向后兼容
    d.photos.forEach(function (p) {
      if (typeof p.hisMessageManual === "undefined") p.hisMessageManual = false;
      if (typeof p.autoGenScheduled === "undefined") p.autoGenScheduled = !p.hisMessage;
      if (!p.hisMessageTime) p.hisMessageTime = Date.now();
      if (typeof p.summonTime === "undefined") p.summonTime = null;
      if (typeof p.myMessage === "undefined") p.myMessage = "";
      if (typeof p.hisMessage === "undefined") p.hisMessage = "";
    });
  }

  // 安全保存
  function albumSave() {
    if (typeof saveData === "function") { try { saveData(); } catch (e) {} }
  }

  // 判断 app 是否处于打开状态
  function isAlbumOpen() {
    var p = document.getElementById("albumPage");
    return !!(p && p.style.display !== "none");
  }

  /* =========================================================
   * 模块三：通用工具函数
   * ========================================================= */
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }
  function escapeAttr(s) {
    return String(s == null ? "" : s).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  function formatDate(d) {
    return d.getFullYear() + "." + pad2(d.getMonth() + 1) + "." + pad2(d.getDate());
  }
  function getPhotoById(id) {
    var photos = (appData && appData.albumData && appData.albumData.photos) || [];
    for (var i = 0; i < photos.length; i++) { if (photos[i].id === id) return photos[i]; }
    return null;
  }
  function getCurrentPhoto() { return currentDetailId ? getPhotoById(currentDetailId) : null; }

  // 从字卡库随机抽取一条（字卡库为空返回 null）
  function getRandomWordCard() {
    if (typeof getAllVisibleWordCards !== "function") return null;
    var cards;
    try { cards = getAllVisibleWordCards(); } catch (e) { cards = null; }
    if (!cards || !cards.length) return null;
    return cards[Math.floor(Math.random() * cards.length)];
  }

  /* =========================================================
   * 模块四：图片压缩（canvas，最大宽度 800px，jpeg 0.8）
   * ========================================================= */
  function compressImage(file, cb) {
    if (!window.FileReader) { cb(null); return; }
    /* 安全限制：图片文件最大10MB */
    if (file.size > 10 * 1024 * 1024) { cb(null); return; }
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var maxW = 800;
        var w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        if (w < 1) w = 1; if (h < 1) h = 1;
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        try {
          cb(canvas.toDataURL("image/jpeg", 0.8));
        } catch (err) { cb(e.target.result); } // 压缩失败则用原图
      };
      img.onerror = function () { cb(null); };
      img.src = e.target.result;
    };
    reader.onerror = function () { cb(null); };
    reader.readAsDataURL(file);
  }

  /* =========================================================
   * 模块五：Toast 提示
   * ========================================================= */
  function showToast(msg) {
    var t = document.getElementById("xcyjToast");
    if (!t) return;
    t.textContent = msg;
    t.style.display = "block";
    // 强制重排以触发过渡
    void t.offsetWidth;
    t.style.opacity = "1";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.style.opacity = "0";
      setTimeout(function () { t.style.display = "none"; }, 250);
    }, 1800);
  }

  /* =========================================================
   * 模块六：分类渲染与切换
   * ========================================================= */
  function renderCategories() {
    var box = document.getElementById("xcyjCats");
    if (!box) return;
    var cats = appData.albumData.categories || [];
    var cur = appData.albumData.currentCategory;
    var html = "";
    cats.forEach(function (c) {
      var active = c === cur ? " xcyj-cat-active" : "";
      html += '<div class="xcyj-cat' + active + '" onclick="selectCategory(\'' + escapeAttr(c) + '\')">' +
              escapeHtml(c) + "</div>";
    });
    html += '<div class="xcyj-cat-add" onclick="showAddCategory()">＋</div>';
    box.innerHTML = html;
    var curEl = document.getElementById("xcyjCurCat");
    if (curEl) curEl.textContent = cur;
  }

  function selectCategory(c) {
    if (!appData.albumData.categories || appData.albumData.categories.indexOf(c) === -1) return;
    appData.albumData.currentCategory = c;
    albumSave();
    renderCategories();
    renderAlbumPhotos();
    var wall = document.getElementById("xcyjWall");
    if (wall) wall.scrollLeft = 0; // 切换分类回到起点（右滑回原位的初始态）
  }

  // 添加分类（内联输入）
  function showAddCategory() {
    var box = document.getElementById("xcyjCats");
    if (!box) return;
    if (document.getElementById("xcyjCatInput")) {
      document.getElementById("xcyjCatInput").focus();
      return;
    }
    var wrap = document.createElement("div");
    wrap.className = "xcyj-cat-input-wrap";
    wrap.innerHTML = '<input id="xcyjCatInput" class="xcyj-cat-input" placeholder="分类名" maxlength="10">' +
                     '<button class="xcyj-cat-ok" onclick="confirmAddCategory()">确定</button>';
    box.appendChild(wrap);
    var inp = document.getElementById("xcyjCatInput");
    if (inp) {
      inp.focus();
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); confirmAddCategory(); }
        if (e.key === "Escape") { cancelAddCategory(); }
      });
    }
  }
  function confirmAddCategory() {
    var inp = document.getElementById("xcyjCatInput");
    if (!inp) return;
    var name = inp.value.trim();
    if (!name) { cancelAddCategory(); return; }
    var cats = appData.albumData.categories;
    if (cats.indexOf(name) !== -1) { showToast("分类已存在"); return; }
    cats.push(name);
    appData.albumData.currentCategory = name;
    albumSave();
    renderCategories();
    renderAlbumPhotos();
    showToast("已添加分类");
  }
  function cancelAddCategory() {
    var w = document.querySelector("#albumPage .xcyj-cat-input-wrap");
    if (w) w.remove();
  }

  /* =========================================================
   * 模块七：照片墙渲染
   * ========================================================= */
  function renderAlbumPhotos() {
    var wall = document.getElementById("xcyjWall");
    if (!wall) return;
    var cat = appData.albumData.currentCategory;
    var photos = (appData.albumData.photos || []).filter(function (p) { return p.category === cat; });

    var html = '<div class="xcyj-rope"></div><div class="xcyj-row" id="xcyjRow">';
    if (photos.length === 0) {
      html += '<div class="xcyj-empty">这里还没有照片<br>点击「上传照片」挂上第一张吧</div>';
    } else {
      // 错落悬挂高度（细线长度），循环使用，营造高低参差
      var heights = [6, 22, 10, 28, 14, 24, 8, 20];
      photos.forEach(function (p, i) {
        var h = heights[i % heights.length];
        var msg;
        if (p.hisMessage) msg = escapeHtml(p.hisMessage);
        else if (p.myMessage) msg = escapeHtml(p.myMessage);
        else msg = '<span class="xcyj-dim">他的留言待生成…</span>';
        html +=
          '<div class="xcyj-photo" data-id="' + escapeAttr(p.id) + '">' +
            '<div class="xcyj-string" style="height:' + h + 'px"></div>' +
            '<div class="xcyj-clip"></div>' +
            '<div class="xcyj-polaroid" data-id="' + escapeAttr(p.id) + '">' +
              '<img class="xcyj-polaroid-img" src="' + p.image + '" alt="照片">' +
              '<div class="xcyj-polaroid-msg">' + msg + "</div>" +
              '<div class="xcyj-polaroid-date">' + escapeHtml(p.date) + "</div>" +
            "</div>" +
          "</div>";
      });
    }
    html += "</div>";
    wall.innerHTML = html;
  }

  /* =========================================================
   * 模块八：照片墙交互（点击=查看详情，长按=重新分类）
   * 使用事件委托，墙面元素持久，渲染只改 innerHTML，无需重绑。
   * ========================================================= */
  function attachWallInteraction() {
    var wall = document.getElementById("xcyjWall");
    if (!wall) return;
    wall.addEventListener("pointerdown", onWallPointerDown);
    wall.addEventListener("pointermove", onWallPointerMove);
    wall.addEventListener("pointerup", onWallPointerUp);
    wall.addEventListener("pointercancel", onWallPointerUp);
    wall.addEventListener("click", onWallClick);
  }

  function onWallPointerDown(e) {
    longPressTriggered = false;
    var target = e.target.closest ? e.target.closest(".xcyj-polaroid") : null;
    if (!target) return;
    pressStartX = e.clientX; pressStartY = e.clientY;
    pressTargetId = target.getAttribute("data-id");
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(function () {
      longPressTriggered = true;
      longPressTimer = null;
      if (pressTargetId) showRecategorize(pressTargetId);
    }, 600);
  }
  function onWallPointerMove(e) {
    if (longPressTimer == null) return;
    var dx = Math.abs(e.clientX - pressStartX);
    var dy = Math.abs(e.clientY - pressStartY);
    // 移动超过阈值视为滑动，取消长按（不影响原生横向滚动）
    if (dx > 10 || dy > 10) { clearTimeout(longPressTimer); longPressTimer = null; }
  }
  function onWallPointerUp() {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  function onWallClick(e) {
    if (longPressTriggered) { longPressTriggered = false; return; } // 长按已处理，吞掉 click
    var target = e.target.closest ? e.target.closest(".xcyj-polaroid") : null;
    if (!target) return;
    var id = target.getAttribute("data-id");
    if (id) showPhotoDetail(id);
  }

  /* =========================================================
   * 模块九：上传照片
   * ========================================================= */
  function albumUploadClick() {
    var input = document.getElementById("xcyjFileInput");
    if (!input) return;
    input.value = ""; // 重置，便于重复选择同一文件
    input.click();
  }
  function albumFileChanged(e) {
    var file = e && e.target && e.target.files && e.target.files[0];
    if (!file) return;
    showToast("处理中…");
    compressImage(file, function (base64) {
      if (!base64) { showToast("图片读取失败"); return; }
      var dateStr = formatDate(new Date());
      var photo = {
        id: "p_" + Date.now() + "_" + Math.floor(Math.random() * 100000),
        image: base64,
        category: appData.albumData.currentCategory,
        date: dateStr,
        hisMessage: "",
        myMessage: "",
        hisMessageTime: Date.now(),
        summonTime: null,
        autoGenScheduled: true,
        hisMessageManual: false
      };
      appData.albumData.photos.push(photo);
      albumSave();
      renderAlbumPhotos();
      // 立即检查一次（字卡库为空时给提示）
      var card = getRandomWordCard();
      if (!card) showToast("照片已挂上（字卡库为空，请先添加字卡以生成他的留言）");
      else showToast("照片已挂上，对方将在约2小时后留言");
    });
  }

  /* =========================================================
   * 模块十：放大详情视图
   * ========================================================= */
  function showPhotoDetail(id) {
    var photo = getPhotoById(id);
    if (!photo) return;
    currentDetailId = id;
    editingChannel = null;
    renderDetail(id);
    var ov = document.getElementById("xcyjDetailOverlay");
    if (ov) ov.style.display = "flex";
  }
  function closePhotoDetail() {
    var ov = document.getElementById("xcyjDetailOverlay");
    if (ov) ov.style.display = "none";
    currentDetailId = null;
    editingChannel = null;
  }

  // 渲染详情卡内容
  function renderDetail(id) {
    var photo = getPhotoById(id);
    if (!photo) return;
    currentDetailId = id;

    var img = document.getElementById("xcyjDetailImg");
    if (img) img.src = photo.image;
    var dateEl = document.getElementById("xcyjDetailDate");
    if (dateEl) dateEl.textContent = photo.date;

    // 他的留言（未编辑时显示文本）
    var hisEl = document.getElementById("xcyjDetailHis");
    if (hisEl && editingChannel !== "his") {
      hisEl.innerHTML = photo.hisMessage ? escapeHtml(photo.hisMessage) : '<span class="xcyj-dim">暂无留言</span>';
    }
    // 我的留言
    var myEl = document.getElementById("xcyjDetailMy");
    if (myEl && editingChannel !== "my") {
      myEl.innerHTML = photo.myMessage ? escapeHtml(photo.myMessage) : '<span class="xcyj-dim">暂无留言</span>';
    }

    // dd按钮与状态
    var sBtn = document.getElementById("xcyjSummonBtn");
    var st = document.getElementById("xcyjSummonStatus");
    if (photo.summonTime) {
      var left = 10 * 60 * 1000 - (Date.now() - photo.summonTime);
      if (sBtn) { sBtn.textContent = "dd中…"; sBtn.disabled = true; }
      if (st) st.textContent = left > 0 ? "对方正在赶来，约 " + Math.ceil(left / 60000) + " 分钟" : "留言已送达";
    } else if (photo.autoGenScheduled) {
      if (sBtn) { sBtn.textContent = "dd对方留言"; sBtn.disabled = false; }
      if (st) {
        var left2 = 2 * 3600 * 1000 - (Date.now() - photo.hisMessageTime);
        st.textContent = left2 > 0 ? "对方将在约 " + Math.ceil(left2 / 3600000) + " 小时后留言" : "对方即将留言";
      }
    } else {
      if (sBtn) { sBtn.textContent = "dd对方留言"; sBtn.disabled = !!photo.hisMessageManual; }
      if (st) st.textContent = photo.hisMessageManual ? "（已手动编辑）" : "";
    }
  }

  /* =========================================================
   * 模块十一：留言编辑
   * ========================================================= */
  function editMyMessage() { startEdit("my"); }
  function editHisMessage() { startEdit("his"); }

  function startEdit(which) {
    var photo = getCurrentPhoto();
    if (!photo) return;
    editingChannel = which;
    var container = document.getElementById(which === "his" ? "xcyjDetailHis" : "xcyjDetailMy");
    if (!container) return;
    var val = which === "his" ? (photo.hisMessage || "") : (photo.myMessage || "");
    container.innerHTML =
      '<textarea class="xcyj-edit-area" id="xcyjEditArea" placeholder="写下留言…">' + escapeHtml(val) + "</textarea>" +
      '<div class="xcyj-edit-actions">' +
        '<button class="xcyj-mini-btn" onclick="saveEdit()">保存</button>' +
        '<button class="xcyj-mini-btn" onclick="cancelEdit()">取消</button>' +
      "</div>";
    var area = document.getElementById("xcyjEditArea");
    if (area) { area.focus(); area.value = val; }
  }

  function saveEdit() {
    var photo = getCurrentPhoto();
    if (!photo || !editingChannel) return;
    var area = document.getElementById("xcyjEditArea");
    var val = area ? area.value : "";
    if (editingChannel === "his") {
      photo.hisMessage = val;
      photo.hisMessageManual = true;   // 手动编辑后不再被自动覆盖
      photo.autoGenScheduled = false;
      photo.summonTime = null;
    } else {
      photo.myMessage = val;
    }
    editingChannel = null;
    albumSave();
    renderDetail(photo.id);
    renderAlbumPhotos();
    showToast("已保存");
  }
  function cancelEdit() {
    editingChannel = null;
    var photo = getCurrentPhoto();
    if (photo) renderDetail(photo.id);
  }

  /* =========================================================
   * 模块十二：dd对方留言（10 分钟内送达）
   * ========================================================= */
  function summonHisMessage() {
    var photo = getCurrentPhoto();
    if (!photo) return;
    if (photo.summonTime) { showToast("已在dd中，请稍候"); return; }
    var card = getRandomWordCard();
    if (!card) { showToast("字卡库为空，请先添加字卡"); return; }
    photo.summonTime = Date.now();
    photo.autoGenScheduled = false; // dd后取消 2h 自动流程
    albumSave();
    renderDetail(photo.id);
    showToast("已dd，约10分钟内送达");
    // 在聊天界面小字区域提醒
    if (typeof addSystemMsg === 'function') {
        addSystemMsg('已dd' + (appData.chatSettings.otherNickname || '对方') + '留言相册寄语，预计10分钟内回复');
    }
    // 定时器会在 10 分钟后自动填充（见 checkAutoMessages）
  }

  /* =========================================================
   * 模块十三：自动留言检查（2h 自动 / 10min dd）
   * ========================================================= */
  function checkAutoMessages() {
    var photos = (appData && appData.albumData && appData.albumData.photos) || [];
    if (!photos.length) return;
    var now = Date.now();
    var changed = false;

    photos.forEach(function (photo) {
      // 规则一：上传 2h 后自动生成（仅当未被手动编辑且无留言）
      if (photo.autoGenScheduled && photo.hisMessageTime &&
          (now - photo.hisMessageTime > 2 * 3600 * 1000)) {
        if (photo.hisMessageManual || photo.hisMessage) {
          // 已有留言或已手动编辑，结束自动流程
          photo.autoGenScheduled = false;
        } else {
          var c1 = getRandomWordCard();
          if (c1) {
            photo.hisMessage = c1;
            photo.autoGenScheduled = false;
            changed = true;
          }
          // 字卡库为空时保留 autoGenScheduled=true，待后续补充字卡后重试
        }
      }
      // 规则二：dd 10 分钟后送达（仅当未被手动编辑）
      if (photo.summonTime && (now - photo.summonTime > 10 * 60 * 1000)) {
        if (photo.hisMessageManual) {
          photo.summonTime = null; // 已手动编辑，取消dd
        } else {
          var c2 = getRandomWordCard();
          if (c2) { photo.hisMessage = c2; photo.summonTime = null; changed = true; }
          // 字卡库为空时保留 summonTime，待后续补充字卡后重试
        }
      }
    });

    if (changed) {
      albumSave();
      if (isAlbumOpen()) {
        renderAlbumPhotos();
        if (currentDetailId) renderDetail(currentDetailId);
      }
      // 在聊天界面提醒对方已留言相册寄语
      if (typeof addSystemMsg === 'function') {
        addSystemMsg((appData.chatSettings.otherNickname || '对方') + '已留言你的相册寄语，快去看看吧');
      }
    }
  }

  /* =========================================================
   * 模块十四：删除与重新分类
   * ========================================================= */
  function deleteCurrentPhoto() {
    if (!currentDetailId) return;
    if (!window.confirm("确定删除这张照片吗？")) return;
    var photos = appData.albumData.photos;
    for (var i = 0; i < photos.length; i++) {
      if (photos[i].id === currentDetailId) { photos.splice(i, 1); break; }
    }
    albumSave();
    closePhotoDetail();
    renderAlbumPhotos();
    showToast("已删除");
  }

  function showRecategorize(id) {
    var photo = getPhotoById(id);
    if (!photo) return;
    recatPhotoId = id;
    var box = document.getElementById("xcyjRecatList");
    if (!box) return;
    var cats = appData.albumData.categories || [];
    var html = "";
    cats.forEach(function (c) {
      var cur = c === photo.category ? " xcyj-recat-cur" : "";
      html += '<div class="xcyj-recat-item' + cur + '" onclick="doRecategorize(\'' + escapeAttr(c) + '\')">' + escapeHtml(c) + "</div>";
    });
    box.innerHTML = html;
    var ov = document.getElementById("xcyjRecatOverlay");
    if (ov) ov.style.display = "flex";
  }
  function doRecategorize(c) {
    var photo = recatPhotoId ? getPhotoById(recatPhotoId) : null;
    if (photo) {
      photo.category = c;
      albumSave();
      // 若详情打开的正是这张，保持；否则仅刷新墙面
      renderAlbumPhotos();
      if (currentDetailId === photo.id) renderDetail(photo.id);
      showToast("已移动到「" + c + "」");
    }
    closeRecategorize();
  }
  function closeRecategorize() {
    var ov = document.getElementById("xcyjRecatOverlay");
    if (ov) ov.style.display = "none";
    recatPhotoId = null;
  }

  /* =========================================================
   * 模块十五：打开 / 关闭 App
   * ========================================================= */
  function openAlbumApp() {
    initAlbumData();
    var page = document.getElementById("albumPage");
    if (page) page.style.display = "flex";
    renderCategories();
    renderAlbumPhotos();
    applyAlbumSettings();
    // 绑定墙面交互（仅一次）
    if (!wallBound) { attachWallInteraction(); wallBound = true; }
    // 启动自动留言定时器（每 30s 检查一次）
    checkAutoMessages();
    if (albumTimer) clearInterval(albumTimer);
    albumTimer = setInterval(checkAutoMessages, 30000);
  }

  function closeAlbumApp() {
    var page = document.getElementById("albumPage");
    if (page) page.style.display = "none";
    // 清理所有计时器，避免内存泄漏与重复触发
    if (albumTimer) { clearInterval(albumTimer); albumTimer = null; }
    clearTimeout(longPressTimer); longPressTimer = null;
    clearTimeout(toastTimer); toastTimer = null;
    // 关闭所有弹层与编辑态
    closePhotoDetail();
    closeRecategorize();
    cancelAddCategory();
    currentDetailId = null;
    recatPhotoId = null;
    editingChannel = null;
    longPressTriggered = false;
  }

  /* =========================================================
   * 模块十七：相册设置（菜单功能）
   * ========================================================= */

  /* 安全字体管理 —— 全局唯一，防止多处字体冲突 */
  var _albumFontStyleEl = null;
  function safeLoadFont(base64data, fontName) {
    try {
      /* 移除旧字体元素 */
      if (_albumFontStyleEl) { _albumFontStyleEl.remove(); _albumFontStyleEl = null; }
      if (!base64data) return;
      var style = document.createElement('style');
      style.id = 'album-custom-font';
      style.textContent = '@font-face { font-family: "' + fontName + '"; src: url(' + base64data + ') format("truetype"); }';
      document.head.appendChild(style);
      _albumFontStyleEl = style;
    } catch(e) { console.error('safeLoadFont error:', e); }
  }

  /* 安全图片压缩 —— 防止过大图片导致卡顿 */
  function safeCompressImage(dataUrl, maxDim, quality, callback) {
    try {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = h * maxDim / w; w = maxDim; }
          else { w = w * maxDim / h; h = maxDim; }
        }
        canvas.width = Math.round(w);
        canvas.height = Math.round(h);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        var result = canvas.toDataURL('image/jpeg', quality || 0.8);
        /* 如果压缩后反而更大，返回原图 */
        if (result.length > dataUrl.length) { callback(dataUrl); }
        else { callback(result); }
      };
      img.onerror = function() { callback(null); };
      img.src = dataUrl;
    } catch(e) { console.error('safeCompressImage error:', e); callback(null); }
  }

  /* 安全文件读取 —— 限制大小 */
  function safeReadFile(file, maxMB, callback) {
    try {
      if (!file) { callback(null); return; }
      /* maxMB=0 表示不限制大小 */
      if (maxMB && maxMB > 0) {
        var maxSize = maxMB * 1024 * 1024;
        if (file.size > maxSize) {
          showToast("文件过大，请选择小于" + maxMB + "MB的文件");
          callback(null);
          return;
        }
      }
      var reader = new FileReader();
      reader.onload = function(e) { callback(e.target.result); };
      reader.onerror = function() { callback(null); };
      reader.readAsDataURL(file);
    } catch(e) { console.error('safeReadFile error:', e); callback(null); }
  }

  function openAlbumSettings() {
    var ov = document.getElementById('xcyjSettingsOverlay');
    if (!ov) return;
    var s = (appData.albumData && appData.albumData.settings) || {};
    /* 初始化颜色选择器 */
    var tcp = document.getElementById('xcyjTextColorPicker');
    if (tcp) tcp.value = s.textColor || '#3F3F46';
    var bcp = document.getElementById('xcyjBgColorPicker');
    if (bcp) bcp.value = s.bgColor || '#F4F4F5';
    var pcp = document.getElementById('xcyjPolaroidColorPicker');
    if (pcp) pcp.value = s.polaroidColor || '#FFFFFF';
    ov.style.display = 'flex';
    /* 渲染相册字体预设列表 */
    if (typeof renderCustomFontList === 'function') renderCustomFontList('album');
  }
  function closeAlbumSettings() {
    var ov = document.getElementById('xcyjSettingsOverlay');
    if (ov) ov.style.display = 'none';
  }

  /* 应用所有相册设置到DOM */
  function applyAlbumSettings() {
    try {
      var s = (appData.albumData && appData.albumData.settings) || {};
      var page = document.getElementById('albumPage');
      if (!page) return;

      /* 背景颜色和背景图片 —— 使用 background 简写确保覆盖 CSS */
      /* 需要同时设置 page、header、content 的背景，因为它们各有自己的 CSS 背景 */
      var contentEl = page.querySelector('.xcyj-content');
      if (s.bgImage && s.bgColor) {
        /* 同时有背景图和颜色 */
        page.style.setProperty('background', s.bgColor + ' url(' + s.bgImage + ') center/cover no-repeat', 'important');
        var header = document.getElementById('xcyjHeader');
        if (header) header.style.setProperty('background', 'transparent', 'important');
        if (contentEl) contentEl.style.setProperty('background', 'transparent', 'important');
      } else if (s.bgImage) {
        /* 只有背景图 */
        page.style.setProperty('background', 'url(' + s.bgImage + ') center/cover no-repeat', 'important');
        var header = document.getElementById('xcyjHeader');
        if (header) header.style.setProperty('background', 'transparent', 'important');
        if (contentEl) contentEl.style.setProperty('background', 'transparent', 'important');
      } else if (s.bgColor) {
        /* 只有背景颜色 */
        page.style.setProperty('background', s.bgColor, 'important');
        var header = document.getElementById('xcyjHeader');
        if (header) header.style.setProperty('background', s.bgColor, 'important');
        if (contentEl) contentEl.style.setProperty('background', s.bgColor, 'important');
      } else {
        /* 恢复默认 */
        page.style.removeProperty('background');
        page.style.background = '';
        var header = document.getElementById('xcyjHeader');
        if (header) header.style.background = '';
        if (contentEl) contentEl.style.background = '';
      }
      /* 返回键按钮 —— 先渲染内部 DOM，便于后续文字颜色生效 */
      var backBtn = document.getElementById('xcyjBackBtn');
      if (backBtn) {
        if (s.backBtnImage) {
          backBtn.innerHTML = '<img src="' + s.backBtnImage + '" style="width:28px;height:28px;border-radius:6px;object-fit:cover;">';
        } else {
          backBtn.innerHTML = '‹';
        }
      }
      /* 菜单按钮 —— 先渲染内部 DOM（含 svg），避免后面重置 innerHTML 时清掉已设置的颜色 */
      var menuBtn = document.getElementById('xcyjMenuBtn');
      if (menuBtn) {
        if (s.menuBtnImage) {
          menuBtn.innerHTML = '<img src="' + s.menuBtnImage + '">';
        } else {
          menuBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
        }
      }
      /* 文字颜色 —— 此时菜单按钮 svg 已存在，颜色可正确生效（修复菜单键颜色不随文字颜色变化） */
      var _textColorTargets = '.xcyj-title, .xcyj-cur-cat, .xcyj-upload-btn, .xcyj-back, .xcyj-menu-btn, .xcyj-menu-btn svg, .xcyj-polaroid-msg, .xcyj-polaroid-date, .xcyj-detail-label, .xcyj-detail-text, .xcyj-detail-date, .xcyj-mini-btn, .xcyj-setting-label, .xcyj-setting-btn, .xcyj-settings-title, .xcyj-cat, .xcyj-upload-btn svg';
      if (s.textColor) {
        page.style.color = s.textColor;
        var els = page.querySelectorAll(_textColorTargets);
        els.forEach(function(el) { el.style.color = s.textColor; });
      } else {
        page.style.color = '';
        /* 清除之前设置的按钮/图标内联颜色，恢复 CSS 默认 */
        var clrEls = page.querySelectorAll(_textColorTargets);
        clrEls.forEach(function(el) { el.style.color = ''; });
      }
      /* 字体 */
      if (s.fontFamily) {
        applyFontFace('albumFontStyle', 'AlbumCustomFont', s.fontFamily);
        page.style.fontFamily = 'AlbumCustomFont, -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
      } else {
        var oldFont = document.getElementById('albumFontStyle');
        if (oldFont) oldFont.remove();
        page.style.fontFamily = '';
      }
      /* 拍立得边框颜色 */
      if (s.polaroidColor) {
        var polaroids = page.querySelectorAll('.xcyj-polaroid');
        polaroids.forEach(function(el) { el.style.background = s.polaroidColor; });
      } else {
        var polaroids = page.querySelectorAll('.xcyj-polaroid');
        polaroids.forEach(function(el) { el.style.background = ''; });
      }
    } catch(e) { console.error('applyAlbumSettings error:', e); }
  }

  /* 文字颜色 */
  function albumSetTextColor(color) {
    if (!appData.albumData.settings) appData.albumData.settings = {};
    appData.albumData.settings.textColor = color;
    albumSave();
    markCustomColor(document.getElementById('albumPage'));
    applyAlbumSettings();
  }
  function albumResetTextColor() {
    if (!appData.albumData.settings) return;
    appData.albumData.settings.textColor = '';
    albumSave();
    applyAlbumSettings();
    var picker = document.getElementById('xcyjTextColorPicker');
    if (picker) picker.value = '#3F3F46';
    showToast("已恢复默认");
  }

  /* 字体上传 */
  function albumUploadFont() {
    document.getElementById('xcyjFontInput').click();
  }
  function albumFontChanged(e) {
    var file = e && e.target && e.target.files && e.target.files[0];
    if (!file) return;
    /* 不限制字体文件大小 */
    safeReadFile(file, 0, function(data) {
      if (!data) { showToast("字体读取失败"); return; }
      if (!appData.albumData.settings) appData.albumData.settings = {};
      appData.albumData.settings.fontFamily = data;
      appData.albumData.settings.fontName = file.name || 'custom';
      albumSave();
      applyAlbumSettings();
      showToast("字体已应用");
    });
  }
  function albumUploadFontByUrl() {
    var url = prompt('请输入字体文件的URL链接（支持.ttf/.otf）：');
    if (!url || !url.trim()) return;
    url = url.trim();
    if (!appData.albumData.settings) appData.albumData.settings = {};
    appData.albumData.settings.fontFamily = url;
    appData.albumData.settings.fontName = 'url_font';
    albumSave();
    applyAlbumSettings();
    showToast("字体URL已应用");
  }
  function albumResetFont() {
    if (!appData.albumData.settings) return;
    appData.albumData.settings.fontFamily = '';
    albumSave();
    applyAlbumSettings();
    showToast("已恢复默认字体");
  }

  /* 背景图片 */
  function albumUploadBg() {
    document.getElementById('xcyjBgInput').click();
  }
  function albumBgChanged(e) {
    var file = e && e.target && e.target.files && e.target.files[0];
    if (!file) return;
    safeReadFile(file, 5, function(data) {
      if (!data) { showToast("图片读取失败"); return; }
      /* 压缩背景图片 */
      safeCompressImage(data, 1920, 0.85, function(compressed) {
        if (!appData.albumData.settings) appData.albumData.settings = {};
        appData.albumData.settings.bgImage = compressed || data;
        albumSave();
        applyAlbumSettings();
        showToast("背景已应用");
      });
    });
  }
  function albumResetBg() {
    if (!appData.albumData.settings) return;
    appData.albumData.settings.bgImage = '';
    albumSave();
    applyAlbumSettings();
    showToast("已恢复默认背景");
  }

  /* 背景颜色 */
  function albumSetBgColor(color) {
    if (!appData.albumData.settings) appData.albumData.settings = {};
    appData.albumData.settings.bgColor = color;
    albumSave();
    applyAlbumSettings();
  }
  function albumResetBgColor() {
    if (!appData.albumData.settings) return;
    appData.albumData.settings.bgColor = '';
    albumSave();
    applyAlbumSettings();
    var picker = document.getElementById('xcyjBgColorPicker');
    if (picker) picker.value = '#F4F4F5';
    showToast("已恢复默认");
  }

  /* 拍立得边框颜色 */
  function albumSetPolaroidColor(color) {
    if (!appData.albumData.settings) appData.albumData.settings = {};
    appData.albumData.settings.polaroidColor = color;
    albumSave();
    applyAlbumSettings();
  }
  function albumResetPolaroidColor() {
    if (!appData.albumData.settings) return;
    appData.albumData.settings.polaroidColor = '';
    albumSave();
    applyAlbumSettings();
    var picker = document.getElementById('xcyjPolaroidColorPicker');
    if (picker) picker.value = '#FFFFFF';
    showToast("已恢复默认");
  }

  /* 返回键按钮 */
  function albumUploadBackBtn() {
    document.getElementById('xcyjBackBtnInput').click();
  }
  function albumBackBtnChanged(e) {
    var file = e && e.target && e.target.files && e.target.files[0];
    if (!file) return;
    safeReadFile(file, 2, function(data) {
      if (!data) { showToast("图片读取失败"); return; }
      safeCompressImage(data, 128, 0.9, function(compressed) {
        if (!appData.albumData.settings) appData.albumData.settings = {};
        appData.albumData.settings.backBtnImage = compressed || data;
        albumSave();
        applyAlbumSettings();
        showToast("返回键已更新");
      });
    });
  }
  function albumResetBackBtn() {
    if (!appData.albumData.settings) return;
    appData.albumData.settings.backBtnImage = '';
    albumSave();
    applyAlbumSettings();
    showToast("已恢复默认");
  }

  /* 菜单按钮 */
  function albumUploadMenuBtn() {
    document.getElementById('xcyjMenuBtnInput').click();
  }
  function albumMenuBtnChanged(e) {
    var file = e && e.target && e.target.files && e.target.files[0];
    if (!file) return;
    safeReadFile(file, 2, function(data) {
      if (!data) { showToast("图片读取失败"); return; }
      safeCompressImage(data, 128, 0.9, function(compressed) {
        if (!appData.albumData.settings) appData.albumData.settings = {};
        appData.albumData.settings.menuBtnImage = compressed || data;
        albumSave();
        applyAlbumSettings();
        showToast("菜单按钮已更新");
      });
    });
  }
  function albumResetMenuBtn() {
    if (!appData.albumData.settings) return;
    appData.albumData.settings.menuBtnImage = '';
    albumSave();
    applyAlbumSettings();
    showToast("已恢复默认");
  }

  /* =========================================================
   * 模块十六：暴露给内联事件的全局函数
   * ========================================================= */
  window.openAlbumApp = openAlbumApp;
  window.closeAlbumApp = closeAlbumApp;
  window.albumUploadClick = albumUploadClick;
  window.albumFileChanged = albumFileChanged;
  window.openAlbumSettings = openAlbumSettings;
  window.closeAlbumSettings = closeAlbumSettings;
  window.albumSetTextColor = albumSetTextColor;
  window.albumResetTextColor = albumResetTextColor;
  window.albumUploadFont = albumUploadFont;
  window.albumFontChanged = albumFontChanged;
  window.albumResetFont = albumResetFont;
  window.albumApplySettings = applyAlbumSettings;
  window.albumUploadBg = albumUploadBg;
  window.albumBgChanged = albumBgChanged;
  window.albumResetBg = albumResetBg;
  window.albumSetBgColor = albumSetBgColor;
  window.albumResetBgColor = albumResetBgColor;
  window.albumSetPolaroidColor = albumSetPolaroidColor;
  window.albumResetPolaroidColor = albumResetPolaroidColor;
  window.albumUploadBackBtn = albumUploadBackBtn;
  window.albumBackBtnChanged = albumBackBtnChanged;
  window.albumResetBackBtn = albumResetBackBtn;
  window.albumUploadMenuBtn = albumUploadMenuBtn;
  window.albumMenuBtnChanged = albumMenuBtnChanged;
  window.albumResetMenuBtn = albumResetMenuBtn;
  window.selectCategory = selectCategory;
  window.showAddCategory = showAddCategory;
  window.confirmAddCategory = confirmAddCategory;
  window.cancelAddCategory = cancelAddCategory;
  window.summonHisMessage = summonHisMessage;
  window.editHisMessage = editHisMessage;
  window.editMyMessage = editMyMessage;
  window.saveEdit = saveEdit;
  window.cancelEdit = cancelEdit;
  window.deleteCurrentPhoto = deleteCurrentPhoto;
  window.closePhotoDetail = closePhotoDetail;
  window.showRecategorize = showRecategorize;
  window.doRecategorize = doRecategorize;
  window.closeRecategorize = closeRecategorize;

  // 页面卸载时兜底清理
  window.addEventListener("beforeunload", function () {
    if (albumTimer) clearInterval(albumTimer);
    clearTimeout(longPressTimer);
    clearTimeout(toastTimer);
  });
})();


