    // ===== 全局错误捕获：防止未处理异常导致页面白屏崩溃 =====
    window.addEventListener('error', function(e) {
        console.error('全局错误捕获:', e.message, e.error);
    });
    window.addEventListener('unhandledrejection', function(e) {
        console.error('未处理的 Promise 错误:', e.reason);
    });
    window.addEventListener('beforeunload', function() { try { if (_idbReady) saveDataSync(); } catch(e) {} });
    window.addEventListener('pageshow', function() {
        setTimeout(function() {
            try { processPendingMomentActions(); } catch(e) {}
            try { checkPendingDiaryReplies(); } catch(e) {}
            try { checkPendingSummons(); } catch(e) {}
            try { checkDoubleDiaryNotification(); } catch(e) {}
            try { if (typeof checkAutoMessages === 'function') checkAutoMessages(); } catch(e) {}
        }, 300);
    });
        // ===== iOS standalone PWA 视口修复：后台返回/冷启动时强制恢复全屏高度 =====
    (function() {
        function isStandalone() {
            return navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
        }
        function isKeyboardOpen() {
            if (!window.visualViewport) return false;
            var screenH = window.screen.height;
            var vvH = window.visualViewport.height;
            return vvH < screenH * 0.85;
        }
        function syncAppHeight() {
            if (!isStandalone()) return;
            // 子App（一起听歌/塔罗）打开时，不修改 --app-height，避免键盘弹出导致顶部白屏
            var _ltAppEl = document.getElementById('lt-app');
            if (_ltAppEl && _ltAppEl.style.display === 'flex') return;
            var _tarotAppEl = document.getElementById('tarot-app');
            if (_tarotAppEl && _tarotAppEl.style.display === 'flex') return;
            // 聊天页面可见时，不修改 --app-height，聊天页有自己的键盘自适应逻辑（apply()）
            // 避免 --app-height 变化导致 .phone-container 缩小而闪现桌面
            var chatPageEl = document.getElementById('chatPage');
            if (chatPageEl && chatPageEl.style.display === 'flex') {
                document.documentElement.style.setProperty('--app-height', '100vh');
                return;
            }
            // 没有键盘时，始终用 100vh，避免后台返回/冷启动拿到错误高度
            if (!isKeyboardOpen()) {
                document.documentElement.style.setProperty('--app-height', '100vh');
                return;
            }
            // 键盘打开时，用 visualViewport 高度
            var h = window.visualViewport
                ? window.visualViewport.height
                : window.innerHeight;
            document.documentElement.style.setProperty('--app-height', h + 'px');
        }
        function resetScroll() {
            // 子App打开时不干预滚动，避免键盘弹出时页面跳动
            var _ltAppEl = document.getElementById('lt-app');
            if (_ltAppEl && _ltAppEl.style.display === 'flex') return;
            var _tarotAppEl = document.getElementById('tarot-app');
            if (_tarotAppEl && _tarotAppEl.style.display === 'flex') return;
            if (window.scrollY !== 0) {
                window.scrollTo(0, 0);
            }
        }
        function forceRecalc() {
            // 子App打开时不做强制重算，避免闪烁
            var _ltAppEl = document.getElementById('lt-app');
            if (_ltAppEl && _ltAppEl.style.display === 'flex') return;
            var _tarotAppEl = document.getElementById('tarot-app');
            if (_tarotAppEl && _tarotAppEl.style.display === 'flex') return;
            // 强制触发 WebKit 重算视口
            document.body.style.display = 'none';
            document.body.offsetHeight;
            document.body.style.display = '';
            syncAppHeight();
            resetScroll();
        }
        if (isStandalone()) {
            document.documentElement.style.setProperty('--app-height', '100vh');
            syncAppHeight();
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', function() { syncAppHeight(); setTimeout(resetScroll, 0); });
                window.visualViewport.addEventListener('scroll', resetScroll);
            }
            window.addEventListener('resize', function() { syncAppHeight(); setTimeout(resetScroll, 50); });
            window.addEventListener('orientationchange', function() { setTimeout(syncAppHeight, 100); setTimeout(resetScroll, 150); });
            window.addEventListener('focusin', function() { setTimeout(function() { resetScroll(); syncAppHeight(); }, 50); });
            window.addEventListener('focusout', function() { setTimeout(function() { resetScroll(); syncAppHeight(); }, 100); });
            window.addEventListener('pageshow', function() { syncAppHeight(); resetScroll(); });
            // 关键：从后台切回前台时强制恢复
            document.addEventListener('visibilitychange', function() {
                if (!document.hidden) {
                    setTimeout(syncAppHeight, 50);
                    setTimeout(forceRecalc, 100);
                    setTimeout(resetScroll, 150);
                }
            });
            setInterval(syncAppHeight, 500);
        }
    })();
    // ===== 阻止浏览器长按复制/蓝色选区 =====
    document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
    document.addEventListener('selectstart', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
        e.preventDefault();
    });
    document.addEventListener('dragstart', function(e) { e.preventDefault(); });
    // 阻止 iOS 多指手势缩放，防止渲染崩溃白屏
    document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
    document.addEventListener('gesturechange', function(e) { e.preventDefault(); });

    // ===== 全局状态 & 存储 =====
    var currentEditTarget = null;
    var currentEditType = null;
    var currentPage = 0;
    var desktopWrapper = document.getElementById('desktopWrapper');
    var pageDots = document.querySelectorAll('.page-dot');
    var longPressTimer = null;
    var isMultiDeleteMode = false;
    var multiDeleteSelected = new Set();
    var startX = 0, isDragging = false;
    var STORAGE_KEY = 'qianyi_data_v8';
    var STORAGE_QUOTA = 30 * 1024 * 1024 * 1024; // 30GB 内置存储
    // ===== IndexedDB 存储层（支持大容量存储） =====
    var IDB_NAME = 'qianyi_db_v8';
    var IDB_STORE = 'appdata';
    var IDB_BLOB_STORE = 'blobs'; // 二进制（图片/音频/视频）独立仓库
    var _idbDB = null;
    function idbOpen() {
        if (_idbDB) return Promise.resolve(_idbDB);
        return new Promise((resolve, reject) => {
            // 版本 2：新增 blobs 仓库，用于把二进制从 localStorage 抽离到 IndexedDB
            const req = indexedDB.open(IDB_NAME, 2);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
                if (!db.objectStoreNames.contains(IDB_BLOB_STORE)) db.createObjectStore(IDB_BLOB_STORE);
            };
            req.onsuccess = (e) => { _idbDB = e.target.result; resolve(_idbDB); };
            req.onerror = (e) => reject(e.target.error);
        });
    }
    async function idbGet(key) {
        try {
            const db = await idbOpen();
            return await new Promise((resolve) => {
                const tx = db.transaction(IDB_STORE, 'readonly');
                const req = tx.objectStore(IDB_STORE).get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(undefined);
            });
        } catch(e) { return undefined; }
    }
    async function idbSet(key, value) {
        try {
            const db = await idbOpen();
            await new Promise((resolve) => {
                const tx = db.transaction(IDB_STORE, 'readwrite');
                tx.objectStore(IDB_STORE).put(value, key);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            });
            return true;
        } catch(e) { return false; }
    }
    // ===== 旧数据兼容层 =====
    // 新版直接存储完整 appData（含图片）到 IndexedDB，不再 tokenize。
    // 以下 _BLOB_TOKEN_PREFIX / collectTokenKeys / resolveTokensInObj / blobGetMany
    // 仅用于从旧版 IndexedDB（tokenized 数据）一次性恢复图片，恢复后以新格式重写。
    var _BLOB_TOKEN_PREFIX = '__BLOB__:';
    // 收集对象中所有 __BLOB__:<key> 引用的 key（用于批量拉取）
    function collectTokenKeys(obj, keysSet) {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
            for (var i = 0; i < obj.length; i++) {
                if (typeof obj[i] === 'string' && obj[i].indexOf(_BLOB_TOKEN_PREFIX) === 0) {
                    keysSet.add(obj[i].slice(_BLOB_TOKEN_PREFIX.length));
                } else if (obj[i] && typeof obj[i] === 'object') {
                    collectTokenKeys(obj[i], keysSet);
                }
            }
        } else {
            for (var k in obj) {
                if (!obj.hasOwnProperty(k)) continue;
                var v = obj[k];
                if (typeof v === 'string' && v.indexOf(_BLOB_TOKEN_PREFIX) === 0) {
                    keysSet.add(v.slice(_BLOB_TOKEN_PREFIX.length));
                } else if (v && typeof v === 'object') {
                    collectTokenKeys(v, keysSet);
                }
            }
        }
    }
    // 用 blobMap（key->原值）把引用还原为真实数据；找不到的引用置为空串（安全降级）
    function resolveTokensInObj(obj, blobMap) {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
            for (var i = 0; i < obj.length; i++) {
                if (typeof obj[i] === 'string' && obj[i].indexOf(_BLOB_TOKEN_PREFIX) === 0) {
                    var key = obj[i].slice(_BLOB_TOKEN_PREFIX.length);
                    obj[i] = (blobMap && blobMap[key] != null) ? blobMap[key] : '';
                } else if (obj[i] && typeof obj[i] === 'object') {
                    resolveTokensInObj(obj[i], blobMap);
                }
            }
        } else {
            for (var k in obj) {
                if (!obj.hasOwnProperty(k)) continue;
                var v = obj[k];
                if (typeof v === 'string' && v.indexOf(_BLOB_TOKEN_PREFIX) === 0) {
                    var key2 = v.slice(_BLOB_TOKEN_PREFIX.length);
                    obj[k] = (blobMap && blobMap[key2] != null) ? blobMap[key2] : '';
                } else if (v && typeof v === 'object') {
                    resolveTokensInObj(v, blobMap);
                }
            }
        }
    }
    // 批量从 blobs 仓库拉取（单事务，避免逐条 get 的事务开销）—— 仅用于恢复旧版数据
    function blobGetMany(keys) {
        return new Promise(function(resolve) {
            if (!keys || keys.length === 0) { resolve({}); return; }
            idbOpen().then(function(db) {
                if (!db) { resolve({}); return; }
                try {
                    var result = {};
                    var remaining = keys.length;
                    if (remaining === 0) { resolve({}); return; }
                    var tx = db.transaction([IDB_BLOB_STORE], 'readonly');
                    var store = tx.objectStore(IDB_BLOB_STORE);
                    keys.forEach(function(key) {
                        var req = store.get(key);
                        req.onsuccess = function() { if (req.result != null) result[key] = req.result; remaining--; if (remaining === 0) resolve(result); };
                        req.onerror = function() { remaining--; if (remaining === 0) resolve(result); };
                    });
                } catch(e) { resolve({}); }
            }).catch(function() { resolve({}); });
        });
    }
    // ===== IndexedDB 图片存储层（绕过 localStorage 5MB 限制）=====
    var _imgDB = null;
    var IDB_IMG_NAME = 'qianyi_img_db_v1';
    var IDB_IMG_STORE = 'images';
    function imgDBOpen() {
        if (_imgDB) return Promise.resolve(_imgDB);
        return new Promise((resolve) => {
            try {
                const req = indexedDB.open(IDB_IMG_NAME, 1);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(IDB_IMG_STORE)) db.createObjectStore(IDB_IMG_STORE);
                };
                req.onsuccess = (e) => { _imgDB = e.target.result; resolve(_imgDB); };
                req.onerror = () => resolve(null);
            } catch(e) { resolve(null); }
        });
    }
    // 全局图片存储：saveImgDB(key, dataUrl) / loadImgDB(key, callback) / removeImgDB(key)
    window.saveImgDB = async function(key, dataUrl) {
        try {
            if (!dataUrl || dataUrl.length < 100) { // 小数据直接存 localStorage
                try { localStorage.setItem(key, dataUrl || ''); } catch(e) {}
                return true;
            }
            const db = await imgDBOpen();
            if (!db) { try { localStorage.setItem(key, dataUrl); } catch(e) { return false; } return true; }
            return new Promise((resolve) => {
                const tx = db.transaction(IDB_IMG_STORE, 'readwrite');
                tx.objectStore(IDB_IMG_STORE).put(dataUrl, key);
                tx.oncomplete = () => { try { localStorage.removeItem(key); } catch(e) {} resolve(true); };
                tx.onerror = () => resolve(false);
            });
        } catch(e) { console.error('saveImgDB error:', e); return false; }
    };
    window.loadImgDB = async function(key, callback) {
        try {
            // 先查 localStorage（兼容旧数据）
            var lsVal = null;
            try { lsVal = localStorage.getItem(key); } catch(e) {}
            if (lsVal) { callback(lsVal); return; }
            // 再查 IndexedDB
            const db = await imgDBOpen();
            if (!db) { callback(null); return; }
            const tx = db.transaction(IDB_IMG_STORE, 'readonly');
            const req = tx.objectStore(IDB_IMG_STORE).get(key);
            req.onsuccess = () => callback(req.result || null);
            req.onerror = () => callback(null);
        } catch(e) { callback(null); }
    };
    window.removeImgDB = async function(key) {
        try { localStorage.removeItem(key); } catch(e) {}
        const db = await imgDBOpen();
        if (db) {
            const tx = db.transaction(IDB_IMG_STORE, 'readwrite');
            tx.objectStore(IDB_IMG_STORE).delete(key);
        }
    };
    // 迁移旧的 localStorage 图片数据到 IndexedDB
    window.migrateImgToIDB = function() {
        var imgKeys = ['p3_polaroid_img_0', 'p3_polaroid_img_1', 'p3_polaroid_img_2',
                       'lt_mwBgImg', 'lt_mwAvatar1', 'lt_mwAvatar2',
                       'p3_student_id', '_swCustomBackImg', '_swCustomMenuImg',
                       'lt_bgImg', 'lt_bgImage', 'lt_avatar1', 'lt_avatar2',
                       'lt_profileBg', 'lt_togetherAv',
                       'p3_center_avatar', 'p3_rectangle_img',
                       'lt_settings', 'lt_songs', 'lt_comments'];
        imgKeys.forEach(function(key) {
            try {
                var val = localStorage.getItem(key);
                if (val && val.length > 5000) {
                    // 大数据迁移到 IndexedDB
                    window.saveImgDB(key, val);
                }
            } catch(e) {}
        });
    };
    // 页面加载后延迟迁移
    if (document.readyState === 'complete') setTimeout(window.migrateImgToIDB, 2000);
    else window.addEventListener('load', function() { setTimeout(window.migrateImgToIDB, 2000); });
    // 请求持久化存储，防止数据被浏览器清除
    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().catch(()=>{});
    }
    // 导出所有 IndexedDB 图片（用于全局备份）
    // Bug7：改用游标分批读取，每 10 条让出主线程，避免图片多时 getAll 阻塞/事务超时
    window.exportImgDB = async function() {
        try {
            const db = await imgDBOpen();
            if (!db) return {};
            var result = {};
            await new Promise(function(resolve) {
                var tx = db.transaction(IDB_IMG_STORE, 'readonly');
                var store = tx.objectStore(IDB_IMG_STORE);
                var req = store.openCursor();
                var count = 0;
                req.onsuccess = function(e) {
                    var cursor = e.target.result;
                    if (cursor) {
                        if (cursor.value != null) result[cursor.key] = cursor.value;
                        count++;
                        if (count % 10 === 0) {
                            // 每 10 条让出主线程，避免长时间阻塞导致 UI 卡死/事务超时
                            setTimeout(function() { try { cursor.continue(); } catch(_) { resolve(); } }, 0);
                        } else {
                            cursor.continue();
                        }
                    } else {
                        resolve();
                    }
                };
                req.onerror = function() { resolve(); };
                tx.oncomplete = function() { resolve(); };
                tx.onerror = function() { resolve(); };
            });
            return result;
        } catch(e) { return {}; }
    };
    // 导入 IndexedDB 图片（从备份恢复）
    window.importImgDB = async function(imgData) {
        if (!imgData || typeof imgData !== 'object') return;
        try {
            const db = await imgDBOpen();
            if (!db) {
                // 降级到 localStorage
                Object.keys(imgData).forEach(function(key) {
                    try { localStorage.setItem(key, imgData[key]); } catch(e) {}
                });
                return;
            }
            for (const key of Object.keys(imgData)) {
                try {
                    await new Promise((res) => {
                        const tx = db.transaction(IDB_IMG_STORE, 'readwrite');
                        tx.objectStore(IDB_IMG_STORE).put(imgData[key], key);
                        tx.oncomplete = () => res(true);
                        tx.onerror = () => res(false);
                    });
                } catch(e) {}
            }
        } catch(e) {}
    };
    var CURRENT_DATA_VERSION = 7;
    var defaultData = {
        dataVersion: 1,
        periodData: {},
        wordCardText: '☆*:.｡. o(≧▽≦)o .｡.:*☆等待对方更新中……',
        timeOffset: -9,
        anniversary: { title: '我与你相恋已经', date: '2024-01-01' },
        appNames: {},
        widgetImages: {},
        appIconImages: {},
        colors: {},
        p3InputTexts: ['', '', '', ''],
        appNameSize: 12,
        // 聊天相关
        chatSettings: {
            otherNickname: '对方',
            myNickname: '我',
            otherAvatar: '',
            myAvatar: '',
            avatarSize: 40,
            avatarRadius: 8,
            otherAvatarSize: 40,
            myAvatarSize: 40,
            otherAvatarRadius: 8,
            myAvatarRadius: 8,
            otherFrame: 'none',
            myFrame: 'none',
            otherFrames: [],
            myFrames: [],
            myBubbleBg: '#1a1a1a',
            myBubbleText: '#ffffff',
            myBubbleBorder: '#1a1a1a',
            otherBubbleBg: '#4a4a4a',
            otherBubbleText: '#000000',
            otherBubbleBorder: '#4a4a4a',
            bubbleRadius: 8,
            bubbleFontSize: 14,
            bubblePadding: 8,
            otherBubbleFontSize: 14,
            myBubbleFontSize: 14,
            otherBubblePadding: 8,
            myBubblePadding: 8,
            bubbleTail: false,
            // 小尾巴细分控制：默认全部开启（与旧版行为一致），可单独关闭某方/仅首条
            otherTailEnabled: true,
            myTailEnabled: true,
            otherFirstTailOnly: false,
            myFirstTailOnly: false,
            bubbleFont: '',
            // 气泡圆角进阶（-1 表示沿用 bubbleRadius）
            dualBubbleRadiusEnabled: false,
            otherBubbleRadius: -1,
            myBubbleRadius: -1,
            // 分别设置四角（对方/我方独立开关）
            otherCornersEnabled: false,
            otherTL: 8,
            otherTR: 8,
            otherBR: 8,
            otherBL: 8,
            myCornersEnabled: false,
            myTL: 8,
            myTR: 8,
            myBR: 8,
            myBL: 8,
            // 昵称显示
            showNicknames: false,
            otherNicknameSize: 12,
            myNicknameSize: 12,
            otherNicknameColor: '#666666',
            myNicknameColor: '#666666',
            // 已读与双对号
            showRead: false,
            showDoubleCheck: false,
            readPosition: 'inside',
            onlyLastRead: false,
            onlyFirstRead: false,
            readColor: '#999999',
            // 分条气泡圆角（-1 表示沿用对应方圆角）
            msgRadiusEnabled: false,
            otherMsg1Radius: -1,
            otherMsg2Radius: -1,
            otherMsg3Radius: -1,
            myMsg1Radius: -1,
            // 转账样式（独立于气泡）
            transferBgColor: '#E8913A',
            transferTextColor: '#ffffff',
            transferRemarkColor: '#ffffff',
            transferBgClaimed: '#999999',
            transferTextClaimed: '#ffffff',
            transferRemarkClaimed: '#ffffff',
            transferRadius: 8,
            myMsg2Radius: -1,
            myMsg3Radius: -1,
            avatarPosition: 'middle',
            otherAvatarPosition: 'middle',
            myAvatarPosition: 'middle',
            hideAvatar: false,
            // 隐藏头像细分控制：可单独隐藏某方头像
            hideMyAvatar: false,
            hideOtherAvatar: false,
            onlyFirstAvatar: false, onlyLastAvatar: false,
            // 新增：分方头像显示控制（只显示某方第一条/最后一条消息头像）
            onlyOtherFirstAvatar: false,
            onlyMyFirstAvatar: false,
            onlyOtherLastAvatar: false,
            onlyMyLastAvatar: false,
            // 新增：分条气泡四角圆方（-1 表示沿用对应方圆角）
            msgCornersEnabled: false,
            otherMsg1TL: 8, otherMsg1TR: 8, otherMsg1BR: 8, otherMsg1BL: 8,
            otherMsg2TL: 8, otherMsg2TR: 8, otherMsg2BR: 8, otherMsg2BL: 8,
            otherMsg3TL: 8, otherMsg3TR: 8, otherMsg3BR: 8, otherMsg3BL: 8,
            myMsg1TL: 8, myMsg1TR: 8, myMsg1BR: 8, myMsg1BL: 8,
            myMsg2TL: 8, myMsg2TR: 8, myMsg2BR: 8, myMsg2BL: 8,
            myMsg3TL: 8, myMsg3TR: 8, myMsg3BR: 8, myMsg3BL: 8,
            // 新增：分条气泡颜色调节（开关 + 颜色）
            msgColorEnabled: false,
            otherMsg1Bg: '', otherMsg2Bg: '', otherMsg3Bg: '',
            myMsg1Bg: '', myMsg2Bg: '', myMsg3Bg: '',
            // 新增：分条气泡边框色调节（开关 + 颜色）
            msgBorderEnabled: false,
            otherMsg1Border: '', otherMsg2Border: '', otherMsg3Border: '',
            myMsg1Border: '', myMsg2Border: '', myMsg3Border: '',
            // 新增：分条气泡大小调节（开关 + padding值）
            msgSizeEnabled: false,
            otherMsg1Size: 8, otherMsg2Size: 8, otherMsg3Size: 8,
            myMsg1Size: 8, myMsg2Size: 8, myMsg3Size: 8,
            // 新增：分条气泡字体大小调节（开关 + 字号值）
            msgFontEnabled: false,
            otherMsg1Font: 14, otherMsg2Font: 14, otherMsg3Font: 14,
            myMsg1Font: 14, myMsg2Font: 14, myMsg3Font: 14,
            chatWallpaper: '',
            topBgColor: '#f0f0f0',
            bottomBgColor: '#f0f0f0',
            topBgImage: '',
            bottomBgImage: '',
            customIcons: {},
            replyTimeMin: 5,
            replyTimeMax: 10,
            replyCountMin: 1,
            replyCountMax: 3,
            enableSplice: false,
            nudgeProb: 10,
            emojiProb: 10,
            callAnswerProb: 80,
            callInitProb: 5,
            transferProb: 5,
            allowZeroTransfer: false,
            momentCount: 3,
            momentSplice: false,
            momentCommentProb: 80,
            momentLikeProb: 80,
            momentReplyDelayMin: 10,
            diaryReplyTime: 30,
            letterReplyMin: 2,
            letterReplyMax: 48,
            letterCountMin: 1,
            letterCountMax: 3,
            letterFavProb: 30,
            // 对方主动发消息
            proactiveEnable: false,
            proactiveMinSec: 30,
            proactiveMaxMin: 5,
            // 已读不回概率(%)
            readNoReplyProb: 0,
            topBgPadding: 0,
            bottomBgPadding: 0,
            footerPosOffset: 0,
            hideFooterBg: false,
            chatDarkMode: false,
            inputBorderRadius: 0,
            inputBgColor: '#ffffff',
            headerTitleColor: '#1a1a1a',
            topBgRadius: 0,
            bottomBgRadius: 0
        },
        chatHistory: [],
        emojis: { mine: [], other: [] },
        nudgeCards: [],
        // 字卡相关
        wordGroups: ['default'],
        currentGroup: 'default',
        wordCards: { default: [] },
        contactWordCards: {},  // { contactId: { groups: ['default'], currentGroup: 'default', cards: { default: [] } } }
        specialCards: {
            nudge: [],
            emoji: [],
            kaomoji: [],
            image: [],
            video: [],
            shopping: []
        },
        specialSettings: {
            enableEmoji: false,
            emojiSendProb: 10,
            emojiSplice: false,
            enableKaomoji: false,
            kaomojiProb: 10,
            kaomojiSplice: false
        },
        dailyWordUpdate: {
            lastDate: '',
            updates: [],
            currentText: ''
        },
        taWordLib: {
            subj: [], verb: [], obj: [], adj: [], adv: [], noun: [], poss: [], greet: []
        },
        selectedCards: [],
        videoBg: '',
        // 朋友圈
        moments: {
            list: [],
            wallpaper: '',
            lastDailyDate: '',
            todayCount: 0,
            lastMomentDate: '',
            pendingActions: []
        },
        // 日记
        diary: {
            singleList: [],
            doubleList: [],
            currentTab: 'single',
            settings: {
                cardBg: '#ffffff',
                pageBg: '#e8f4fd',
                textColor: '#1a1a1a',
                fontFamily: '',
                fontSize: 14,
                bgImage: '',
                dailyMin: 1,
                dailyMax: 3,
                hideProb: 5,
                spliceMin: 1,
                spliceMax: 20,
                urgeProb: 50,
                lastDailyDate: '',
                lastDoubleDiaryDate: '',
                moodEmojis: ['开心','困倦','甜蜜','低落','生气','思考','酷','哭泣'],
                weatherEmojis: ['晴天','多云','阴天','雨天','雷雨','雪天','雾天','彩虹'],
                moodIcons: {
                    '开心': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
                    '困倦': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
                    '甜蜜': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M12 9l.01 0"/><path d="M9 9l.01 0"/><path d="M15 9l.01 0"/></svg>',
                    '低落': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
                    '生气': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 16s1.5-1 4-1 4 1 4 1"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
                    '思考': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9 14h6"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
                    '酷': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><rect x="7" y="8" width="4" height="3" rx="1"/><rect x="13" y="8" width="4" height="3" rx="1"/></svg>',
                    '哭泣': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><path d="M12 9v3"/><path d="M12 12c0 2-2 3-2 3"/></svg>'
                },
                weatherIcons: {
                    '晴天': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
                    '多云': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="1.5"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
                    '阴天': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="1.5"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
                    '雨天': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="1.5"><path d="M16 13v8"/><path d="M8 13v8"/><path d="M12 15v8"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>',
                    '雷雨': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="1.5"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/></svg>',
                    '雪天': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="1.5"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="8" y1="20" x2="8.01" y2="20"/><line x1="12" y1="18" x2="12.01" y2="18"/><line x1="12" y1="22" x2="12.01" y2="22"/><line x1="16" y1="16" x2="16.01" y2="16"/><line x1="16" y1="20" x2="16.01" y2="20"/></svg>',
                    '雾天': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="1.5"><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="16" x2="21" y2="16"/></svg>',
                    '彩虹': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="1.5"><path d="M22 17a10 10 0 0 0-20 0"/><path d="M6 17a6 6 0 0 1 12 0"/><path d="M10 17a2 2 0 0 1 4 0"/></svg>'
                },
                tags: ['日常','工作','旅行','美食','心情','梦想'],
                replyProb: 80,
                modalWidth: 86,
                modalHeight: 70,
                modalNoGlass: false,
                modalBg: '',
                modalBorderColor: '',
                rulerEnabled: true,
                rulerThickness: 1,
                rulerColor: 'rgba(160,200,240,0.2)',
                rulerGap: 32,
                sentenceMode: false,
                doubleDiaryFields: {
                    appetite: '',
                    goOut: '',
                    taste: '',
                    fruit: '',
                    walkDog: '',
                    walkCat: '',
                    feedCat: '',
                    feedDog: '',
                    bath: '',
                    wakeTime: '',
                    stayUp: '',
                    workStatus: '',
                    outfit: '',
                    colorScheme: '',
                    luckyNumber: '',
                    missLevel: '',
                    comeToMe: '',
                    sleepWithMe: '',
                    bodyTemp: '',
                    songType: '',
                    bedTimeWords: ''
                },
                // 今日穿搭字卡（上衣/下衣/鞋子）+ 睡前想告诉你字卡
                // 对方日记"今日穿搭"和"睡前想告诉你"会从此处字卡随机调取
                outfitCards: {
                    tops: ['黑色皮夹克','深蓝赛车服','白色衬衫','黑色高领毛衣','军绿色工装外套','深灰卫衣','藏青色风衣','黑色机车夹克','白色T恤','深蓝牛仔外套','黑色棒球服','灰色针织衫'].map(function(t){return {text:t,hidden:false};}),
                    bottoms: ['黑色机车裤','深蓝牛仔裤','卡其色工装裤','黑色运动裤','灰色休闲裤','深灰束脚裤','黑色皮裤','藏青色西裤','迷彩工装裤','黑色哈伦裤'].map(function(t){return {text:t,hidden:false};}),
                    shoes: ['黑色机车靴','白色运动鞋','黑色马丁靴','赛车手套靴','切尔西靴','黑色高帮帆布鞋','深棕皮靴','白色板鞋','黑色老爹鞋','军靴'].map(function(t){return {text:t,hidden:false};}),
                    bedtime: ['晚安，想你','今晚月色真美','睡前记得想我','盖好被子别着凉','梦里见','今天也很喜欢你','早点睡，明天见','抱不到你就抱枕头吧','睡前吻你一下','今天辛苦啦，晚安'].map(function(t){return {text:t,hidden:false};})
                }
            }
        },
        // 信封
        letter: {
            currentTab: 'inbox',
            inbox: [],
            reply: [],
            sent: [],
            favorite: [],
            pendingReplies: [],
            lastAutoLetterDate: '',
            settings: {
                cardBg: '#ffffff',
                pageBg: '#85DBF9',
                cardBorderColor: '#85DBF9',
                textColor: '#1a1a1a',
                fontFamily: '',
                fontSize: 14,
                bgImage: '',
                lastDailyDate: '',
                modalWidth: 86,
                modalHeight: 70,
                modalNoGlass: false,
                modalBg: '',
                modalBorderColor: '',
                rulerEnabled: true,
                rulerThickness: 1,
                rulerColor: 'rgba(133,219,249,0.25)',
                rulerGap: 32,
                sentenceMode: false
            }
        },
        currentViewingDiary: null,
        currentViewingLetter: null,
        publishMediaList: [],
        batchUploadType: 'word',
        // 组件垂直位置偏移（上移为负值，下移为正值）
        widgetOffsets: {
            anniversary: 0,      // 第一页：纪念日组件
            appSection: 0,       // 第一页：聊天日记朋友圈信封+正方形组件行
            appSectionBottom: 0, // 第一页：美化字卡默契生死局相册寄语+正方形组件行
            period: 0,           // 第二页：日历组件
            wordCard: 0,         // 第二页：☆*:.｡. o(≧▽≦)o .｡.:*☆组件
            thirdRow: 0,         // 第二页：时间组件+一起写歌五子棋次元购物城余额行
            p3Music: 0,          // 第三页：音乐悬浮框
            p3StudentId: 0,      // 第三页：学生证
            p3MidRow: 0,         // 第三页：吧唧和App入口
            p3Polaroids: 0       // 第三页：拍立得组件
        },
        // 底栏距底部位置（px），持久化保存
        dockBottom: 20,
        // 锁屏设置
        lockScreen: {
            enabled: false,
            passwordEnabled: true,
            password: '080365',
            wallpaper: '',
            textColor: '#ffffff',
            firstLaunchDone: false
        },
        // 默契生死局
        lifeDeathData: {
            questionBank: [],
            history: [],
            initialized: false
        },
        // 相册寄语
        albumData: {
            photos: [],
            categories: ['日常','风景','食物','合照','他拍的','我拍的'],
            currentCategory: '日常'
        },
        // 联系人列表设置
        contactList: {
            background: '#ededed',
            fontColor: '#1a1a1a',
            contacts: [],
            groups: []
        }
    };
    var appData = loadData();
    var currentQuoteMsg = null;
    var currentOpsMsgId = null;
    var replyTimer = null;
    var isTyping = false;
    var callTimer = null;
    var callDurationTimer = null;
    var callStartTime = 0;
    var isIncomingCall = false;
    var isMinimized = false;
    var videoBgSrc = appData.videoBg || '';
    var videoLongPressTimer = null;

    /* ===== 联系人独立聊天记录 =====
       通过 Object.defineProperty 将 appData.chatHistory 变为 getter/setter，
       当进入某联系人的聊天时，自动重定向到该联系人专属的 chatHistory 数组，
       无需修改全部 34 处 appData.chatHistory 引用。 */
    var _actualChatHistory = appData.chatHistory || (appData.chatHistory = []);
    var _activeContactId = null; // 当前聊天对应的联系人 ID，null 表示主聊天
    var _lastChatContactId = null; // 记录最后一次聊天的联系人 ID，用于从通知恢复时还原上下文
    function _findContactById(id) {
        try {
            var contacts = (appData.contactList && appData.contactList.contacts) || [];
            for (var i = 0; i < contacts.length; i++) {
                if (contacts[i].id === id) return contacts[i];
            }
        } catch(e) {}
        return null;
    }
    Object.defineProperty(appData, 'chatHistory', {
        get: function() {
            if (_activeContactId) {
                var c = _findContactById(_activeContactId);
                if (c) {
                    if (!c.chatHistory) c.chatHistory = [];
                    return c.chatHistory;
                }
            }
            return _actualChatHistory;
        },
        set: function(val) {
            if (_activeContactId) {
                var c = _findContactById(_activeContactId);
                if (c) { c.chatHistory = val; return; }
            }
            _actualChatHistory = val;
        },
        configurable: true,
        enumerable: true
    });

    /* ===== 数据迁移系统 =====
       每次加载页面时检查 dataVersion，执行必要的升级。
       升级完成后更新版本号，由调用方负责 saveData()。 */
    function migrateData(data) {
        if (!data || typeof data !== 'object') return data;
        var version = data.dataVersion || 1;
        var upgraded = false;

        /* ---- v1 → v2: 联系人迁移 ----
           如果 contactList.contacts 为空但 chatHistory 有记录，
           自动创建联系人并把 chatHistory 挂上去。 */
        if (version < 2) {
            try {
                if (!data.contactList) data.contactList = { background: '#ededed', fontColor: '#1a1a1a', contacts: [], groups: [] };
                if (!Array.isArray(data.contactList.contacts)) data.contactList.contacts = [];
                if (!data.contactList.groups) data.contactList.groups = [];

                if (data.contactList.contacts.length === 0) {
                    var cs = data.chatSettings || {};
                    var mainHistory = data.chatHistory;
                    if (Array.isArray(mainHistory) && mainHistory.length > 0) {
                        var contactId = 'contact_main_' + Date.now();
                        data.contactList.contacts.push({
                            id: contactId,
                            nickname: cs.otherNickname || '对方',
                            avatar: cs.otherAvatar || '',
                            chatHistory: mainHistory.slice(),
                            createdAt: Date.now()
                        });
                        upgraded = true;
                        console.log('[迁移 v1→v2] 从主聊天记录创建联系人:', contactId, '消息数:', mainHistory.length);
                    }
                    // 兼容旧版直接存 contacts 数组的情况
                    if (data.contacts && Array.isArray(data.contacts) && data.contacts.length > 0) {
                        data.contacts.forEach(function(c) {
                            if (c && c.id && !data.contactList.contacts.find(function(ex) { return ex.id === c.id; })) {
                                if (!c.chatHistory && Array.isArray(mainHistory) && mainHistory.length > 0) {
                                    c.chatHistory = mainHistory.slice();
                                }
                                data.contactList.contacts.push(c);
                            }
                        });
                        upgraded = true;
                    }
                }
            } catch(e) { console.error('[迁移 v1→v2] 失败:', e); }
            version = 2;
        }

        /* ---- v2 → v3: 字卡迁移 ----
           如果 wordCards 默认分组为空，从 contactWordCards 里把字卡迁移过来。 */
        if (version < 3) {
            try {
                if (!data.wordCards) data.wordCards = { default: [] };
                if (!data.wordGroups) data.wordGroups = ['default'];
                if (!data.wordCards.default) data.wordCards.default = [];
                if (!data.currentGroup) data.currentGroup = 'default';

                var hasCards = false;
                for (var g in data.wordCards) {
                    if (Array.isArray(data.wordCards[g]) && data.wordCards[g].length > 0) { hasCards = true; break; }
                }

                if (!hasCards) {
                    // 从 contactWordCards 迁移
                    if (data.contactWordCards && typeof data.contactWordCards === 'object') {
                        for (var cid in data.contactWordCards) {
                            var cw = data.contactWordCards[cid];
                            if (cw && cw.cards && typeof cw.cards === 'object') {
                                for (var cg in cw.cards) {
                                    if (Array.isArray(cw.cards[cg])) {
                                        cw.cards[cg].forEach(function(card) {
                                            if (card && card.text) {
                                                var exists = data.wordCards.default.find(function(c) { return c.text === card.text; });
                                                if (!exists) {
                                                    data.wordCards.default.push({ text: card.text, hidden: card.hidden || false });
                                                }
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                    // 兼容旧版扁平字卡数组
                    ['wordCardList', 'allWordCards', 'wordCardsList'].forEach(function(key) {
                        if (Array.isArray(data[key]) && data[key].length > 0) {
                            data[key].forEach(function(card) {
                                if (card && card.text) {
                                    var exists = data.wordCards.default.find(function(c) { return c.text === card.text; });
                                    if (!exists) data.wordCards.default.push({ text: card.text, hidden: card.hidden || false });
                                }
                            });
                        }
                    });
                    if (data.wordCards.default.length > 0) upgraded = true;
                }
            } catch(e) { console.error('[迁移 v2→v3] 失败:', e); }
            version = 3;
        }

        /* ---- v3 → v4: 日记/信封/朋友圈数据恢复 ----
           如果 diary、letter、moments 的列表为空，
           从 appData 里搜索可能存在的旧数据并迁移，
           同时尝试从 localStorage 旧备份中恢复。 */
        if (version < 4) {
            try {
                // --- 日记 ---
                if (data.diary) {
                    if (!Array.isArray(data.diary.singleList)) data.diary.singleList = [];
                    if (!Array.isArray(data.diary.doubleList)) data.diary.doubleList = [];
                    // 搜索 appData 内可能存在的旧日记数据
                    ['diaryEntries', 'diaries', 'diaryList', 'oldDiaryList', 'oldDiaries'].forEach(function(key) {
                        if (Array.isArray(data[key]) && data[key].length > 0) {
                            data[key].forEach(function(entry) {
                                if (entry && data.diary.singleList.indexOf(entry) === -1) {
                                    data.diary.singleList.push(entry);
                                    upgraded = true;
                                }
                            });
                        }
                    });
                    // 搜索旧双人日记数据
                    ['doubleDiaryList', 'doubleDiaries', 'oldDoubleDiaryList'].forEach(function(key) {
                        if (Array.isArray(data[key]) && data[key].length > 0) {
                            data[key].forEach(function(entry) {
                                if (entry && data.diary.doubleList.indexOf(entry) === -1) {
                                    data.diary.doubleList.push(entry);
                                    upgraded = true;
                                }
                            });
                        }
                    });
                }
                // --- 信封 ---
                if (data.letter) {
                    ['inbox', 'sent', 'reply', 'favorite'].forEach(function(box) {
                        if (!Array.isArray(data.letter[box])) data.letter[box] = [];
                    });
                    // 搜索旧信封数据
                    ['letters', 'letterList', 'allLetters'].forEach(function(key) {
                        if (Array.isArray(data[key]) && data[key].length > 0) {
                            data[key].forEach(function(letter) {
                                if (letter && letter.box && data.letter[letter.box] && data.letter[letter.box].indexOf(letter) === -1) {
                                    data.letter[letter.box].push(letter);
                                    upgraded = true;
                                }
                            });
                        }
                    });
                    // 兼容旧版按信箱分开存的数组
                    var boxMap = { inbox: ['letterInbox', 'inboxList'], sent: ['letterSent', 'sentList'], reply: ['letterReply', 'replyList'], favorite: ['letterFavorite', 'favoriteList'] };
                    for (var box in boxMap) {
                        boxMap[box].forEach(function(key) {
                            if (Array.isArray(data[key]) && data[key].length > 0) {
                                data[key].forEach(function(letter) {
                                    if (letter && data.letter[box].indexOf(letter) === -1) {
                                        data.letter[box].push(letter);
                                        upgraded = true;
                                    }
                                });
                            }
                        });
                    }
                }
                // --- 朋友圈 ---
                if (data.moments) {
                    if (!Array.isArray(data.moments.list)) data.moments.list = [];
                    ['momentsData', 'momentList', 'momentsList', 'oldMoments', 'allMoments'].forEach(function(key) {
                        if (Array.isArray(data[key]) && data[key].length > 0) {
                            data[key].forEach(function(moment) {
                                if (moment && data.moments.list.indexOf(moment) === -1) {
                                    data.moments.list.push(moment);
                                    upgraded = true;
                                }
                            });
                        }
                    });
                }

                /* 尝试从 localStorage 旧备份中恢复缺失的数据 */
                var oldKeys = ['qianyi_data_v7', 'qianyi_data_v7_backup', 'qianyi_data_v6', 'qianyi_data_v6_backup',
                               'qianyi_data_v5', 'qianyi_data_v5_backup', 'qianyi_data', 'qianyi_data_backup',
                               STORAGE_KEY, STORAGE_KEY + '_backup'];
                for (var ki = 0; ki < oldKeys.length; ki++) {
                    try {
                        var oldRaw = localStorage.getItem(oldKeys[ki]);
                        if (!oldRaw) continue;
                        var oldParsed = JSON.parse(oldRaw);
                        if (!oldParsed || typeof oldParsed !== 'object') continue;

                        // 联系人恢复
                        if (data.contactList && (!data.contactList.contacts || data.contactList.contacts.length === 0)) {
                            if (oldParsed.contactList && Array.isArray(oldParsed.contactList.contacts) && oldParsed.contactList.contacts.length > 0) {
                                data.contactList.contacts = oldParsed.contactList.contacts;
                                upgraded = true;
                                console.log('[迁移 v3→v4] 从', oldKeys[ki], '恢复联系人', data.contactList.contacts.length, '个');
                            }
                        }
                        // 字卡恢复
                        var wcEmpty = true;
                        for (var wg in data.wordCards) { if (data.wordCards[wg].length > 0) { wcEmpty = false; break; } }
                        if (wcEmpty && oldParsed.wordCards) {
                            for (var owg in oldParsed.wordCards) {
                                if (Array.isArray(oldParsed.wordCards[owg])) {
                                    if (!data.wordCards[owg]) data.wordCards[owg] = [];
                                    oldParsed.wordCards[owg].forEach(function(card) {
                                        if (card && card.text) {
                                            var exists = data.wordCards[owg].find(function(c) { return c.text === card.text; });
                                            if (!exists) data.wordCards[owg].push(card);
                                        }
                                    });
                                    upgraded = true;
                                }
                            }
                            console.log('[迁移 v3→v4] 从', oldKeys[ki], '恢复字卡');
                        }
                        // 日记恢复
                        if (data.diary && oldParsed.diary) {
                            if (data.diary.singleList.length === 0 && Array.isArray(oldParsed.diary.singleList) && oldParsed.diary.singleList.length > 0) {
                                data.diary.singleList = oldParsed.diary.singleList;
                                upgraded = true;
                                console.log('[迁移 v3→v4] 从', oldKeys[ki], '恢复单人日记', data.diary.singleList.length, '条');
                            }
                            if (data.diary.doubleList.length === 0 && Array.isArray(oldParsed.diary.doubleList) && oldParsed.diary.doubleList.length > 0) {
                                data.diary.doubleList = oldParsed.diary.doubleList;
                                upgraded = true;
                                console.log('[迁移 v3→v4] 从', oldKeys[ki], '恢复双人日记', data.diary.doubleList.length, '条');
                            }
                        }
                        // 信封恢复
                        if (data.letter && oldParsed.letter) {
                            ['inbox', 'sent', 'reply', 'favorite'].forEach(function(box) {
                                if (data.letter[box].length === 0 && Array.isArray(oldParsed.letter[box]) && oldParsed.letter[box].length > 0) {
                                    data.letter[box] = oldParsed.letter[box];
                                    upgraded = true;
                                    console.log('[迁移 v3→v4] 从', oldKeys[ki], '恢复信封', box, data.letter[box].length, '封');
                                }
                            });
                        }
                        // 朋友圈恢复
                        if (data.moments && oldParsed.moments) {
                            if (data.moments.list.length === 0 && Array.isArray(oldParsed.moments.list) && oldParsed.moments.list.length > 0) {
                                data.moments.list = oldParsed.moments.list;
                                upgraded = true;
                                console.log('[迁移 v3→v4] 从', oldKeys[ki], '恢复朋友圈', data.moments.list.length, '条');
                            }
                        }
                    } catch(e) { /* 忽略单个 key 解析失败 */ }
                }
            } catch(e) { console.error('[迁移 v3→v4] 失败:', e); }
            version = 4;
        }

        /* ---- v4 → v5: 一起写歌余额Bug补偿 ----
           因「一起写歌」创作完成后余额未更新的Bug，为每一位用户补发 5200 元，
           双方各自 +5200，网站更新即到账余额。仅在首次升级到 v5 时执行一次。 */
        if (version < 5) {
            try {
                if (!data.balanceData) data.balanceData = { mine: 0, other: 0, records: [] };
                if (!Array.isArray(data.balanceData.records)) data.balanceData.records = [];
                data.balanceData.mine = (data.balanceData.mine || 0) + 5200;
                data.balanceData.other = (data.balanceData.other || 0) + 5200;
                data.balanceData.records.push({
                    text: '一起写歌余额Bug补偿（双方+5200）',
                    time: Date.now()
                });
                upgraded = true;
                console.log('[迁移 v4→v5] 已为双方各补发 5200 元');
            } catch(e) { console.error('[迁移 v4→v5] 失败:', e); }
            version = 5;
        }
        /* ---- v5 → v6: 联系人列表个人主页 + 底部栏自定义 ---- */
        if (version < 6) {
            try {
                if (!data.contactList) data.contactList = { background:'#ededed', fontColor:'#1a1a1a', contacts:[], groups:[] };
                if (!data.contactList.profile) data.contactList.profile = {
                    nickname: '这里点击更换昵称',
                    account: '@这里点击替换账号',
                    bio: '这里点击替换文案',
                    avatar: '',
                    headerImage: '',
                    headerColor: ''
                };
                if (!data.contactList.bottomBar) data.contactList.bottomBar = {
                    bgColor: '',
                    bgImage: '',
                    addBtnColor: '',
                    searchBtnColor: '',
                    addBtnImage: '',
                    searchBtnImage: ''
                };
                upgraded = true;
            } catch(e) { console.error('[迁移 v5→v6] 失败:', e); }
            version = 6;
        }

        /* ---- v6 → v7: 余额记录修复 ----
           1) 将全局 balanceData.records 同步到每个联系人的 balanceData.records（去重），
              使得在余额App中查看任意联系人时都能看到历史记录。
           2) 如果联系人的 other 仍为默认值100且全局 other 已被修改过（有记录），
              则用全局 other 覆盖，避免显示错误的默认余额。
           3) 持久化 _balanceContactId 以便刷新后恢复。 */
        if (version < 7) {
            try {
                if (data.balanceData && Array.isArray(data.balanceData.records)) {
                    var _contacts = (data.contactList && data.contactList.contacts) || [];
                    var _globalRecs = data.balanceData.records;
                    var _globalOther = (typeof data.balanceData.other === 'number') ? data.balanceData.other : 100;
                    var _hasGlobalRecs = _globalRecs.length > 0;
                    _contacts.forEach(function(c) {
                        if (!c.balanceData || typeof c.balanceData.other !== 'number') {
                            /* 初始化联系人余额，other 继承全局值而非固定100 */
                            c.balanceData = { other: _hasGlobalRecs ? _globalOther : 100, records: [] };
                        } else if (c.balanceData.records && c.balanceData.records.length === 0 && _hasGlobalRecs) {
                            /* 联系人无记录但全局有记录：用全局 other 覆盖默认100 */
                            if (c.balanceData.other === 100) {
                                c.balanceData.other = _globalOther;
                            }
                        }
                        /* 同步全局记录到联系人（去重） */
                        if (c.balanceData && Array.isArray(c.balanceData.records)) {
                            var _seen = {};
                            c.balanceData.records.forEach(function(r) {
                                _seen[(r && r.time ? r.time : 0) + '|' + (r && r.text ? r.text : '')] = true;
                            });
                            _globalRecs.forEach(function(r) {
                                var _key = (r && r.time ? r.time : 0) + '|' + (r && r.text ? r.text : '');
                                if (!_seen[_key]) {
                                    _seen[_key] = true;
                                    c.balanceData.records.push(r);
                                }
                            });
                        }
                    });
                }
                upgraded = true;
                console.log('[迁移 v6→v7] 余额记录已同步到联系人');
            } catch(e) { console.error('[迁移 v6→v7] 失败:', e); }
            version = 7;
        }

        data.dataVersion = version;
        // 双人日记：确保每个 entry 都有唯一 id（Bug1：dd 按钮改用 entry.id 标识）
        // 旧数据可能没有 id，这里统一补齐，使后续按 id 查找可靠
        try {
            if (data.diary && Array.isArray(data.diary.doubleList)) {
                var _nowSeed = Date.now();
                data.diary.doubleList.forEach(function(e, i) {
                    if (!e.id) { e.id = _nowSeed + i + 1; upgraded = true; }
                });
            }
        } catch(e) { console.error('[迁移] 补齐双人日记 id 失败:', e); }
        if (upgraded) {
            console.log('[数据迁移] 已升级到版本 ' + version);
        }
        return data;
    }

    function loadData() {
        // 先尝试从 localStorage 读取数据（含备份键和旧版键迁移）
        try {
            let raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) raw = localStorage.getItem(STORAGE_KEY + '_backup');
            // 兼容旧版本key
            if (!raw) raw = localStorage.getItem('qianyi_data_v7');
            if (!raw) raw = localStorage.getItem('qianyi_data_v7_backup');
            if (!raw) raw = localStorage.getItem('qianyi_data_v6');
            if (!raw) raw = localStorage.getItem('qianyi_data_v6_backup');
            if (!raw) raw = localStorage.getItem('qianyi_data_v5');
            if (!raw) raw = localStorage.getItem('qianyi_data_v5_backup');
            if (!raw) raw = localStorage.getItem('qianyi_data');
            if (!raw) raw = localStorage.getItem('qianyi_data_backup');
            if (raw) {
                const parsed = JSON.parse(raw);
                // 新版：localStorage 仅用于一次性迁移，数据可能包含旧版 __BLOB__ 引用，
                // loadDataFromIDB() 会从 IndexedDB 读取完整数据覆盖，无需在此处理引用。
                function mergeDeep(target, source) {
                    for (const key in source) {
                        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                            target[key] = mergeDeep(target[key] || {}, source[key]);
                        } else if (!(key in target)) {
                            target[key] = source[key];
                        }
                    }
                    return target;
                }
                const merged = mergeDeep(parsed, JSON.parse(JSON.stringify(defaultData)));
                // 兼容旧版拍一拍数据
                if (Array.isArray(merged.nudgeCards) && merged.nudgeCards.length > 0 && typeof merged.nudgeCards[0] === 'string') {
                    merged.specialCards.nudge = merged.nudgeCards.map(t => ({text: t, hidden: false}));
                    merged.nudgeCards = [];
                }
                // 迁移旧版头像/气泡统一设置到分方设置
                if (merged.chatSettings) {
                    const cs = merged.chatSettings;
                    if (cs.otherAvatarSize === undefined) cs.otherAvatarSize = cs.avatarSize || 40;
                    if (cs.myAvatarSize === undefined) cs.myAvatarSize = cs.avatarSize || 40;
                    if (cs.otherAvatarRadius === undefined) cs.otherAvatarRadius = cs.avatarRadius || 8;
                    if (cs.myAvatarRadius === undefined) cs.myAvatarRadius = cs.avatarRadius || 8;
                    if (cs.otherBubbleFontSize === undefined) cs.otherBubbleFontSize = cs.bubbleFontSize || 14;
                    if (cs.myBubbleFontSize === undefined) cs.myBubbleFontSize = cs.bubbleFontSize || 14;
                    if (cs.otherBubblePadding === undefined) cs.otherBubblePadding = cs.bubblePadding || 8;
                    if (cs.myBubblePadding === undefined) cs.myBubblePadding = cs.bubblePadding || 8;
                }
                // 迁移旧版emoji心情/天气到新版文字名称+SVG图标
                if (merged.diary && merged.diary.settings) {
                    const ds = merged.diary.settings;
                    const emojiToMoodName = {'😊':'开心','😴':'困倦','🥰':'甜蜜','😔':'低落','😤':'生气','🤔':'思考','😎':'酷','😭':'哭泣'};
                    const emojiToWeatherName = {'☀️':'晴天','🌤️':'多云','☁️':'阴天','🌧️':'雨天','⛈️':'雷雨','❄️':'雪天','🌫️':'雾天','🌈':'彩虹','☀':'晴天','🌤':'多云','☁':'阴天','🌧':'雨天','⛈':'雷雨','❄':'雪天','🌫':'雾天'};
                    function isEmoji(str) { return /[\u{2600}-\u{27BF}\u{1F300}-\u{1F9FF}]/u.test(str); }
                    if (ds.moodEmojis && ds.moodEmojis.length > 0 && isEmoji(ds.moodEmojis[0])) {
                        ds.moodEmojis = ds.moodEmojis.map(e => emojiToMoodName[e] || e).filter(n => !isEmoji(n));
                        if (ds.moodEmojis.length === 0) ds.moodEmojis = ['开心','困倦','甜蜜','低落','生气','思考','酷','哭泣'];
                    }
                    if (ds.weatherEmojis && ds.weatherEmojis.length > 0 && isEmoji(ds.weatherEmojis[0])) {
                        ds.weatherEmojis = ds.weatherEmojis.map(e => emojiToWeatherName[e] || e).filter(n => !isEmoji(n));
                        if (ds.weatherEmojis.length === 0) ds.weatherEmojis = ['晴天','多云','阴天','雨天','雷雨','雪天','雾天','彩虹'];
                    }
                }
                // 执行数据迁移
                migrateData(merged);
                return merged;
            }
        } catch (e) {
            console.error('localStorage数据加载失败，使用默认值:', e);
        }
        var fallback = JSON.parse(JSON.stringify(defaultData));
        migrateData(fallback);
        return fallback;
    }
    // 异步从 IndexedDB 加载数据（支持30G大容量存储）
    var _idbLoaded = false;
    var _idbReady = false; // 标记 IndexedDB 数据是否已加载完毕，防止 init 中的每日检查用默认数据覆盖真实数据
    // 从指定数据库名读取数据（用于旧版数据库迁移）
    async function idbGetFromDb(dbName, key) {
        try {
            return await new Promise((resolve) => {
                const req = indexedDB.open(dbName, 1);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
                };
                req.onsuccess = (e) => {
                    const db = e.target.result;
                    try {
                        const tx = db.transaction(IDB_STORE, 'readonly');
                        const r = tx.objectStore(IDB_STORE).get(key);
                        r.onsuccess = () => { resolve(r.result); db.close(); };
                        r.onerror = () => { resolve(undefined); db.close(); };
                    } catch(err) { resolve(undefined); db.close(); }
                };
                req.onerror = () => resolve(undefined);
            });
        } catch(e) { return undefined; }
    }
    async function loadDataFromIDB() {
        if (_idbLoaded) return;
        _idbLoaded = true;
        try {
            // 优先从主键读取，其次从备份键读取，最后尝试旧版数据库名
            let json = await idbGet('appData');
            if (!json) json = await idbGet('appData_backup');
            if (!json) json = await idbGetFromDb('qianyi_db_v7', 'appData');
            if (!json) json = await idbGetFromDb('qianyi_db_v6', 'appData');
            if (!json) json = await idbGetFromDb('qianyi_db_v5', 'appData');
            if (!json) json = await idbGetFromDb('qianyi_db', 'appData');
            if (json) {
                const parsed = JSON.parse(json);
                // 恢复 IndexedDB 中分离存储的二进制数据（图片/音频/视频等）
                // 旧版数据（无引用）此步为空操作，完全向后兼容
                var _blobKeys = new Set();
                collectTokenKeys(parsed, _blobKeys);
                if (_blobKeys.size > 0) {
                    var _blobMap = await blobGetMany(Array.from(_blobKeys));
                    resolveTokensInObj(parsed, _blobMap);
                }
                function mergeDeep(target, source) {
                    for (const key in source) {
                        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                            target[key] = mergeDeep(target[key] || {}, source[key]);
                        } else if (!(key in target)) {
                            target[key] = source[key];
                        }
                    }
                    return target;
                }
                const merged = mergeDeep(parsed, JSON.parse(JSON.stringify(defaultData)));
                // 迁移旧版统一设置到分方设置
                if (merged.chatSettings) {
                    const cs = merged.chatSettings;
                    if (cs.otherAvatarSize === undefined) cs.otherAvatarSize = cs.avatarSize || 40;
                    if (cs.myAvatarSize === undefined) cs.myAvatarSize = cs.avatarSize || 40;
                    if (cs.otherAvatarRadius === undefined) cs.otherAvatarRadius = cs.avatarRadius || 8;
                    if (cs.myAvatarRadius === undefined) cs.myAvatarRadius = cs.avatarRadius || 8;
                    if (cs.otherBubbleFontSize === undefined) cs.otherBubbleFontSize = cs.bubbleFontSize || 14;
                    if (cs.myBubbleFontSize === undefined) cs.myBubbleFontSize = cs.bubbleFontSize || 14;
                    if (cs.otherBubblePadding === undefined) cs.otherBubblePadding = cs.bubblePadding || 8;
                    if (cs.myBubblePadding === undefined) cs.myBubblePadding = cs.bubblePadding || 8;
                }
                // 迁移旧版emoji心情/天气到新版文字名称+SVG图标
                if (merged.diary && merged.diary.settings) {
                    const ds = merged.diary.settings;
                    const emojiToMoodName = {'😊':'开心','😴':'困倦','🥰':'甜蜜','😔':'低落','😤':'生气','🤔':'思考','😎':'酷','😭':'哭泣'};
                    const emojiToWeatherName = {'☀️':'晴天','🌤️':'多云','☁️':'阴天','🌧️':'雨天','⛈️':'雷雨','❄️':'雪天','🌫️':'雾天','🌈':'彩虹','☀':'晴天','🌤':'多云','☁':'阴天','🌧':'雨天','⛈':'雷雨','❄':'雪天','🌫':'雾天'};
                    function isEmoji(str) { return /[\u{2600}-\u{27BF}\u{1F300}-\u{1F9FF}]/u.test(str); }
                    if (ds.moodEmojis && ds.moodEmojis.length > 0 && isEmoji(ds.moodEmojis[0])) {
                        ds.moodEmojis = ds.moodEmojis.map(e => emojiToMoodName[e] || e).filter(n => !isEmoji(n));
                        if (ds.moodEmojis.length === 0) ds.moodEmojis = ['开心','困倦','甜蜜','低落','生气','思考','酷','哭泣'];
                    }
                    if (ds.weatherEmojis && ds.weatherEmojis.length > 0 && isEmoji(ds.weatherEmojis[0])) {
                        ds.weatherEmojis = ds.weatherEmojis.map(e => emojiToWeatherName[e] || e).filter(n => !isEmoji(n));
                        if (ds.weatherEmojis.length === 0) ds.weatherEmojis = ['晴天','多云','阴天','雨天','雷雨','雪天','雾天','彩虹'];
                    }
                }
                // 执行数据迁移（在复制到 appData 之前，此时 merged 是普通对象）
                migrateData(merged);
                // 将 merged 的属性逐一复制到 appData（而非替换引用），
                // 以保留 chatHistory 上的 getter/setter（联系人独立聊天记录）
                for (var _k in merged) {
                    appData[_k] = merged[_k];
                }
                // 同步 appData.dataVersion
                appData.dataVersion = merged.dataVersion || CURRENT_DATA_VERSION;
                _idbReady = true; // 数据加载完毕，允许 saveData 写入 IndexedDB
                // 确保数据写入主键和备份键（迁移旧数据库时尤为重要）
                saveDataSync();
                // 重新初始化界面以应用IndexedDB数据
                if (typeof reinitAfterIDBLoad === 'function') reinitAfterIDBLoad();
            } else {
                // IndexedDB 没有数据，从 localStorage 一次性迁移到 IndexedDB
                // loadData() 已经执行过迁移，确保版本号正确
                if (!appData.dataVersion) appData.dataVersion = CURRENT_DATA_VERSION;
                _idbReady = true;
                saveDataSync();
                // 迁移完成后，立即删除 localStorage 中的旧数据（不保留冷备份）
                try {
                    localStorage.removeItem(STORAGE_KEY);
                    localStorage.removeItem(STORAGE_KEY + '_backup');
                    // 清理所有旧版本 key
                    var _oldKeys = ['qianyi_data_v7', 'qianyi_data_v7_backup',
                                    'qianyi_data_v6', 'qianyi_data_v6_backup',
                                    'qianyi_data_v5', 'qianyi_data_v5_backup',
                                    'qianyi_data', 'qianyi_data_backup'];
                    _oldKeys.forEach(function(k) { try { localStorage.removeItem(k); } catch(e) {} });
                    console.log('[存储迁移] localStorage 旧数据已清除，数据已迁移至 IndexedDB');
                } catch(e) { console.warn('清除 localStorage 旧数据失败:', e); }
            }
            // 数据就绪后执行每日检查（此时 appData 已是真实数据，saveData 可安全写入）
            runDailyChecks();
            try { processPendingMomentActions(); } catch(e) {}
            try { checkPendingDiaryReplies(); } catch(e) {}
            try { checkPendingSummons(); } catch(e) {}
        } catch(e) {
            _idbReady = true;
            console.error('IndexedDB数据加载失败:', e);
            try { if (typeof reinitAfterIDBLoad === 'function') reinitAfterIDBLoad(); } catch(e2) { console.error('reinitAfterIDBLoad失败:', e2); }
            runDailyChecks();
        }
    }
    // saveData 防抖：避免频繁序列化大对象导致卡顿
    var _saveDataTimer = null;
    var _lastGoodJson = null; // 缓存上次成功序列化的 JSON，用于回滚
    // 同步立即保存：用于删除等不可逆操作，避免防抖导致的数据丢失/白屏
    // 新版：直接存储完整 appData（含图片）到 IndexedDB，不写 localStorage
    /* ===== 安全 toast 提示（主作用域内可用，存储失败等场景反馈用户） ===== */
    var _appToastTimer = null;
    function _showUserToast(msg) {
        try {
            var old = document.getElementById('_appToastTip');
            if (old) old.remove();
            var el = document.createElement('div');
            el.id = '_appToastTip';
            el.textContent = msg;
            el.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:#fff;padding:12px 22px;border-radius:12px;font-size:14px;z-index:100001;max-width:80%;text-align:center;pointer-events:none;line-height:1.4;';
            document.body.appendChild(el);
            if (_appToastTimer) clearTimeout(_appToastTimer);
            _appToastTimer = setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 2600);
        } catch(e) { console.error('toast failed:', e); }
    }
    /* 主作用域内未定义 toast 时补一个，修复既有 toast() 调用静默失败 */
    function toast(msg){ _showUserToast(msg); }
    function saveDataSync() {
        if (_saveDataTimer) { clearTimeout(_saveDataTimer); _saveDataTimer = null; }
        var _savedActiveId = _activeContactId;
        _activeContactId = null; // 序列化时使用主聊天记录，避免联系人记录被误存为主记录
        try {
            var fullJson = JSON.stringify(appData);
            _lastGoodJson = fullJson;
            // 同步写入 localStorage（规则4/10），配额不足时仅警告不阻塞 IndexedDB
            try {
                localStorage.setItem(STORAGE_KEY, fullJson);
            } catch(_lsErr) {
                console.warn('localStorage 写入失败（可能配额不足），数据仍已保存到 IndexedDB:', _lsErr);
            }
            if (_idbReady) {
                idbSet('appData', fullJson);
                idbSet('appData_backup', fullJson);
            }
            return true;
        } catch (e) {
            console.error('数据序列化失败(同步保存):', e);
            // 存储异常必须反馈用户（规则6）
            try { _showUserToast('⚠️ 保存失败，请检查存储空间或重试'); } catch(_t){}
            // 序列化失败时尝试回滚到上次成功的状态，避免损坏数据被写入
            if (_lastGoodJson) {
                try {
                    if (_idbReady) {
                        idbSet('appData', _lastGoodJson);
                        idbSet('appData_backup', _lastGoodJson);
                    }
                    console.warn('已回滚到上次成功保存的数据');
                } catch (e2) {
                    console.error('回滚失败:', e2);
                }
            }
            return false;
        } finally {
            _activeContactId = _savedActiveId; // 恢复
        }
    }
    function saveData() {
        if (_saveDataTimer) clearTimeout(_saveDataTimer);
        _saveDataTimer = setTimeout(() => {
            _saveDataTimer = null;
            var _savedActiveId = _activeContactId;
            _activeContactId = null; // 序列化时使用主聊天记录
            try {
                var fullJson = JSON.stringify(appData);
                _lastGoodJson = fullJson;
                // 同步写入 localStorage（规则4/10），配额不足时仅警告不阻塞 IndexedDB
                try {
                    localStorage.setItem(STORAGE_KEY, fullJson);
                } catch(_lsErr) {
                    console.warn('localStorage 写入失败（可能配额不足），数据仍已保存到 IndexedDB:', _lsErr);
                }
                // 主存储：IndexedDB（直接存储完整 appData，含图片）
                if (_idbReady) {
                    idbSet('appData', fullJson);
                    idbSet('appData_backup', fullJson);
                }
            } catch (e) {
                console.error('数据序列化失败:', e);
                // 序列化失败时回滚到上次成功的状态
                if (_lastGoodJson) {
                    try {
                        if (_idbReady) {
                            idbSet('appData', _lastGoodJson);
                            idbSet('appData_backup', _lastGoodJson);
                        }
                        console.warn('已回滚到上次成功保存的数据');
                    } catch (e2) {
                        console.error('回滚失败:', e2);
                    }
                }
            } finally {
                _activeContactId = _savedActiveId; // 恢复
            }
        }, 300);
    }

    // ===== 页面滑动 =====
    document.querySelector('.phone-container').addEventListener('touchstart', function(e) {
        try {
            if (!e.target || !e.target.closest) return;
            if (e.target.closest('.edit-menu') || e.target.closest('.upload-modal') || e.target.closest('.overlay') ||
                e.target.closest('.chat-page') || e.target.closest('.settings-page') || e.target.closest('.wordcard-page') ||
                e.target.closest('.modal') || e.target.closest('.moments-page') || e.target.closest('.diary-page') ||
                e.target.closest('.letter-page') || e.target.closest('.video-call-page') || e.target.closest('.sv-float') ||
                e.target.closest('.app-item') || e.target.closest('.square-widget') || e.target.closest('.dock-bar') ||
                e.target.closest('.anniversary-widget') || e.target.closest('.period-calendar') ||
                e.target.closest('.word-card') || e.target.closest('.time-widget') || e.target.closest('.p3-music-widget') || e.target.closest('.p3-polaroids') || e.target.closest('.page-dot') ||
                e.target.closest('.shop-page') || e.target.closest('.beautify-page') || e.target.closest('.storage-page') || e.target.closest('.goban-app-page') || e.target.closest('.songwrite-app-page') || e.target.closest('.flip-app-page') || e.target.closest('.challenge-app-page') || e.target.closest('.balance-app-page') || e.target.closest('.lifeDeathPage') || e.target.closest('.album-page') || e.target.closest('.wordlib-app-page') || e.target.closest('.ta-app-page') || e.target.closest('.tarot-overlay') || e.target.closest('.lt-overlay') || e.target.closest('.du-overlay')) return;
            startX = e.touches[0].clientX; isDragging = true;
        } catch(err) { /* 忽略滑动检测错误 */ }
    }, { passive: true });
    document.querySelector('.phone-container').addEventListener('touchend', function(e) {
        try {
            if (!isDragging) return; isDragging = false;
            // 视频通话「正常(非缩小)」状态下禁止左右滑动切页；缩小后允许正常使用桌面/字卡网站
            var _vcp = document.getElementById('videoCallPage');
            if (_vcp && _vcp.classList.contains('show') && !isMinimized) return;
            const endX = e.changedTouches[0].clientX; const diff = startX - endX;
            if (Math.abs(diff) > 50) {
                if (diff > 0 && currentPage < 2) currentPage++; else if (diff < 0 && currentPage > 0) currentPage--;
                updatePage();
            }
        } catch(err) { isDragging = false; }
    });
    function updatePage() {
        document.body.classList.add('desktop-sliding');
        desktopWrapper.style.transform = `translateX(-${currentPage * 33.3333}%)`;
        pageDots.forEach((dot, index) => dot.classList.toggle('active', index === currentPage));
        setTimeout(function(){ document.body.classList.remove('desktop-sliding'); }, 350);
    }

    // ===== 长按编辑 =====
    var container = document.getElementById('phoneContainer');
    function startLongPress(e) {
        try {
            if (!e.target || !e.target.closest) return;
            if (e.target.closest('.app-item') || e.target.closest('.square-widget') ||
                e.target.closest('.dock-bar') || e.target.closest('.edit-menu') || e.target.closest('.upload-modal') || e.target.closest('.overlay') ||
                e.target.closest('.time-widget') ||
                e.target.closest('.chat-page') || e.target.closest('.settings-page') || e.target.closest('.wordcard-page') ||
                e.target.closest('.moments-page') || e.target.closest('.diary-page') || e.target.closest('.letter-page') ||
                e.target.closest('.beautify-page') || e.target.closest('.storage-page') ||
                e.target.closest('.flip-app-page') || e.target.closest('.goban-app-page') ||
                e.target.closest('.challenge-app-page') || e.target.closest('.balance-app-page') ||
                e.target.closest('.video-call-page') || e.target.closest('.sv-float') ||
                e.target.closest('.modal') || e.target.closest('.emoji-panel') || e.target.closest('.plus-panel') ||
                e.target.closest('.anniversary-widget') || e.target.closest('.period-calendar') ||
                e.target.closest('img') || e.target.closest('video') ||
                e.target.closest('.word-card') || e.target.closest('.p3-student-id') ||
                e.target.closest('.p3-center-avatar') || e.target.closest('.p3-glass-input') ||
                e.target.closest('[contenteditable="true"]')) {
                return;
            }
        } catch(err) { return; }
        longPressTimer = setTimeout(() => {
            try {
                showMainEditMenu(); document.body.classList.add('editing-mode');
            } catch(err) { console.error('长按编辑失败:', err); }
        }, 800);
    }
    container.addEventListener('touchstart', startLongPress, { passive: true });
    container.addEventListener('touchend', () => { if(longPressTimer){clearTimeout(longPressTimer); longPressTimer=null;} }, { passive: true });
    container.addEventListener('touchmove', () => { if(longPressTimer){clearTimeout(longPressTimer); longPressTimer=null;} }, { passive: true });
    container.addEventListener('mousedown', startLongPress);
    container.addEventListener('mouseup', () => { if(longPressTimer){clearTimeout(longPressTimer); longPressTimer=null;} });
    container.addEventListener('mouseleave', () => { if(longPressTimer){clearTimeout(longPressTimer); longPressTimer=null;} });

    // ===== 长按图标/组件触发上传 =====

    // ===== 组件位置滑块调节 =====
    var currentWidgetPosKey = null;
    var widgetPosMinOffset = -300;
    var widgetPosMaxOffset = 150;
    var widgetPosZeroSliderValue = 50; // slider中间值=0偏移

    function getWidgetPageInfo(dragKey) {
        const el = document.querySelector('[data-drag-key="' + dragKey + '"]');
        if (!el) return null;
        const page = el.closest('.desktop-page');
        if (!page) return null;
        const pageRect = page.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        // 当前元素顶部相对于页面顶部的位置
        const currentTopInPage = elRect.top - pageRect.top;
        // 上移极限：允许超出页面顶部一定距离（负值），给用户更多上移空间
        const minTop = -100;
        const maxUp = currentTopInPage - minTop; // 上移量（负数）
        // 下移极限：元素底部不超出页面可视区域底部 - 90px（dock栏）
        const maxBottom = window.innerHeight - 90;
        const maxDown = maxBottom - elRect.bottom; // 下移量（正数）
        return { el, page, minOffset: -maxUp, maxOffset: maxDown };
    }

    function openWidgetPosEditor(dragKey, label, pageNum) {
        document.getElementById('mainEditMenu').classList.remove('show');
        currentWidgetPosKey = dragKey;
        document.getElementById('widgetPosTitle').textContent = '第' + pageNum + '页 · ' + label;
        // 计算滑块范围
        const info = getWidgetPageInfo(dragKey);
        if (info) {
            widgetPosMinOffset = Math.round(info.minOffset);
            widgetPosMaxOffset = Math.round(info.maxOffset);
        } else {
            widgetPosMinOffset = -150;
            widgetPosMaxOffset = 150;
        }
        const slider = document.getElementById('widgetPosSlider');
        const totalRange = widgetPosMaxOffset - widgetPosMinOffset;
        slider.min = 0;
        slider.max = totalRange;
        slider.step = 1;
        // 将当前偏移转换为滑块值
        const currentOffset = appData.widgetOffsets[dragKey] || 0;
        const sliderVal = Math.round(currentOffset - widgetPosMinOffset);
        slider.value = Math.max(0, Math.min(totalRange, sliderVal));
        updateWidgetPosDisplay();
        document.getElementById('widgetPosEditor').classList.add('show');
    }

    function applyWidgetPosSlider(sliderVal) {
        if (!currentWidgetPosKey) return;
        const offset = parseInt(sliderVal) + widgetPosMinOffset;
        // 额外安全限制
        const clamped = Math.max(widgetPosMinOffset, Math.min(widgetPosMaxOffset, offset));
        appData.widgetOffsets[currentWidgetPosKey] = clamped;
        const el = document.querySelector('[data-drag-key="' + currentWidgetPosKey + '"]');
        if (el) el.style.marginTop = clamped + 'px';
        updateWidgetPosDisplay();
        saveData();
    }

    function updateWidgetPosDisplay() {
        const currentOffset = appData.widgetOffsets[currentWidgetPosKey] || 0;
        const display = document.getElementById('widgetPosValue');
        if (currentOffset === 0) {
            display.textContent = '偏移: 0px（默认位置）';
        } else if (currentOffset < 0) {
            display.textContent = '上移: ' + Math.abs(currentOffset) + 'px';
        } else {
            display.textContent = '下移: ' + currentOffset + 'px';
        }
    }

    function closeWidgetPosEditor() {
        document.getElementById('widgetPosEditor').classList.remove('show');
        document.getElementById('mainEditMenu').classList.add('show');
        currentWidgetPosKey = null;
    }

    function restoreWidgetOffsets() {
        if (!appData.widgetOffsets) return;
        const groups = document.querySelectorAll('.draggable-group');
        groups.forEach(group => {
            const key = group.dataset.dragKey;
            if (key && appData.widgetOffsets[key] !== undefined) {
                group.style.marginTop = appData.widgetOffsets[key] + 'px';
            }
        });
    }

    // ===== 全局阻止浏览器复制/选择/长按菜单 =====
    document.addEventListener('contextmenu', function(e) {
        if (e.target.closest('[contenteditable="true"]') || e.target.closest('.p3-student-id')) return;
        if (e.target.closest('.desktop-page') || e.target.closest('.dock-bar') ||
            e.target.closest('.app-item') || e.target.closest('.square-widget') ||
            e.target.closest('.anniversary-widget') || e.target.closest('.period-calendar') ||
            e.target.closest('.word-card') || e.target.closest('.time-widget') ||
            e.target.closest('.edit-menu') || e.target.closest('.overlay')) {
            e.preventDefault();
            return false;
        }
    });

    document.addEventListener('selectstart', function(e) {
        if (e.target.closest('[contenteditable="true"]') || e.target.closest('.p3-student-id')) return;
        if (e.target.closest('.desktop-page') || e.target.closest('.dock-bar') ||
            e.target.closest('.app-item') || e.target.closest('.square-widget') ||
            e.target.closest('.anniversary-widget') || e.target.closest('.period-calendar') ||
            e.target.closest('.word-card') || e.target.closest('.time-widget')) {
            e.preventDefault();
            return false;
        }
    });

    // 阻止iOS长按弹出菜单/复制气泡
    document.addEventListener('touchstart', function(e) {
        try {
            if (!e.target || !e.target.closest) return;
            if (e.target.closest('input') || e.target.closest('textarea') || e.target.closest('[contenteditable="true"]')) return;
            // 不对可交互元素阻止默认行为，否则click事件无法触发
            if (e.target.closest('.app-item') || e.target.closest('.anniversary-widget') || e.target.closest('.period-calendar') ||
                e.target.closest('.word-card') || e.target.closest('.time-widget') || e.target.closest('.square-widget') ||
                e.target.closest('.page-dot') || e.target.closest('button') || e.target.closest('a') ||
                e.target.closest('.edit-menu') || e.target.closest('.upload-modal') || e.target.closest('.overlay') ||
                e.target.closest('.modal') || e.target.closest('.chat-page') || e.target.closest('.settings-page') ||
                e.target.closest('.wordcard-page') || e.target.closest('.moments-page') || e.target.closest('.diary-page') ||
                e.target.closest('.letter-page') || e.target.closest('.dock-bar') || e.target.closest('.emoji-panel') ||
                e.target.closest('.plus-panel') || e.target.closest('.beautify-page') || e.target.closest('.storage-page') ||
                e.target.closest('.sv-float') || e.target.closest('.video-call-page') ||
                e.target.closest('.settings-content') || e.target.closest('.settings-header') ||
                e.target.closest('.wordcard-header') || e.target.closest('.wordcard-contact-bar') || e.target.closest('.wordcard-tabs') ||
                e.target.closest('.wordcard-actions') || e.target.closest('.special-section') ||
                e.target.closest('.wordcard-list') || e.target.closest('.special-card-list') ||
                e.target.closest('.batch-upload-modal') || e.target.closest('.transferModal') ||
                e.target.closest('.flip-app-page') || e.target.closest('.goban-app-page') ||
                e.target.closest('.challenge-app-page') || e.target.closest('.balance-app-page') ||
                e.target.closest('.p3-student-id') || e.target.closest('.p3-polaroids') || e.target.closest('.p3-music-widget') ||
                e.target.closest('.p3-sid-photo') || e.target.closest('.p3-center-avatar') || e.target.closest('[contenteditable="true"]')) return;
            // 对桌面区域及 img/video 元素阻止默认行为，防止 iOS 长按弹出保存菜单
            if (e.target.closest('.desktop-page') || e.target.closest('.phone-container') ||
                e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO' || e.target.closest('img') || e.target.closest('video')) {
                e.preventDefault();
            }
        } catch(err) { /* 忽略事件处理错误，防止崩溃 */ }
    }, { passive: false });

    function setupLongPressForElements() {
        const targets = document.querySelectorAll('.app-icon, .square-widget');
        targets.forEach(el => {
            let timer = null;
            const start = (e) => {
                timer = setTimeout(() => {
                    if (!el || !el.isConnected) return;
                    try {
                        if (el.classList.contains('app-icon')) {
                            currentEditTarget = el;
                            currentEditType = 'appIcon';
                        } else if (el.classList.contains('square-widget')) {
                            currentEditTarget = el;
                            currentEditType = 'widget';
                        }
                        const ov = document.getElementById('overlay');
                        const um = document.getElementById('uploadModal');
                        if (ov) ov.classList.add('show');
                        if (um) um.classList.add('show');
                    } catch(err) { console.error('上传菜单失败:', err); }
                }, 600);
            };
            const end = () => { if(timer){ clearTimeout(timer); timer=null; } };
            el.addEventListener('touchstart', start, { passive: true });
            el.addEventListener('touchend', end, { passive: true });
            el.addEventListener('touchmove', end, { passive: true });
            el.addEventListener('mousedown', start);
            el.addEventListener('mouseup', end);
            el.addEventListener('mouseleave', end);
        });
    }
    function showMainEditMenu() { document.getElementById('overlay').classList.add('show'); document.getElementById('mainEditMenu').classList.add('show'); }
    function openSizeEditor() { document.getElementById('mainEditMenu').classList.remove('show'); document.getElementById('sizeEditor').classList.add('show'); }
    function openNameColorEditor() { document.getElementById('mainEditMenu').classList.remove('show'); const cp = document.getElementById('appNameColorPicker'); if (cp && appData.colors && appData.colors.appName) cp.value = appData.colors.appName; document.getElementById('nameColorEditor').classList.add('show'); }
    function openAppNameSizeEditor() { document.getElementById('mainEditMenu').classList.remove('show'); const sl = document.getElementById('appNameSizeSlider'); if (sl) sl.value = appData.appNameSize || 12; document.getElementById('appNameSizeEditor').classList.add('show'); }
    function openStudentIdSizeEditor() {
        document.getElementById('mainEditMenu').classList.remove('show');
        var sl = document.getElementById('studentIdSizeSlider');
        var saved = parseInt(localStorage.getItem('p3_sid_size') || '180', 10);
        if (sl) sl.value = saved;
        var sv = document.getElementById('studentIdSizeValue');
        if (sv) sv.textContent = saved + 'px';
        document.getElementById('studentIdSizeEditor').classList.add('show');
    }
    function updateStudentIdSize(val) {
        var v = parseInt(val, 10) || 180;
        document.documentElement.style.setProperty('--p3-sid-w', v + 'px');
        var sv = document.getElementById('studentIdSizeValue');
        if (sv) sv.textContent = v + 'px';
        try { localStorage.setItem('p3_sid_size', v.toString()); } catch(e) {}
    }
    function updateIconSize(v) {
        document.documentElement.style.setProperty('--app-icon-size', v + 'px');
        appData.iconSize = parseInt(v);
        saveData();
    }
    function updateAppNameSize(v) { 
        document.documentElement.style.setProperty('--app-name-font-size', v + 'px');
        appData.appNameSize = parseFloat(v);
        saveData();
    }
    function setAppNameColor(c) { document.documentElement.style.setProperty('--app-name-color', c); appData.colors.appName = c; saveData(); }
    // 恢复应用名称大小与颜色：刷新后从存储重新应用到 CSS 变量，避免被默认值覆盖
    function applyAppNameStyle() {
        if (appData.appNameSize) {
            document.documentElement.style.setProperty('--app-name-font-size', appData.appNameSize + 'px');
        }
        if (appData.colors && appData.colors.appName) {
            document.documentElement.style.setProperty('--app-name-color', appData.colors.appName);
        }
    }
    function closeAllModals() {
        // 底栏位置编辑器若通过遮罩关闭，需还原 slider/close 事件，避免污染组件位置编辑器
        try {
        if (typeof _dockPosCleanup === 'function') {
            _dockPosCleanup();
        }
        var ov = document.getElementById('overlay');
        if (ov) ov.classList.remove('show');
        document.querySelectorAll('.edit-menu, .upload-modal, .modal').forEach(el => el.classList.remove('show'));
        document.body.classList.remove('editing-mode');
        currentWidgetPosKey = null;
        currentEditTarget = null; currentEditType = null;
        } catch(e) { console.error('closeAllModals失败:', e); }
    }
    document.getElementById('overlay').addEventListener('click', closeAllModals);
    // 点击模态框背景（非内容区域）关闭模态框
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList && e.target.classList.contains('modal') && e.target.classList.contains('show')) {
            // 不关闭需要明确操作的模态框（如填写模态框）
            if (e.target.id === 'doubleDiaryWriteModal' || e.target.id === 'writeDiaryModal') return;
            closeAllModals();
        }
    });
    // 修复日记/信封菜单键点击无反应：使用捕获阶段事件委托，确保菜单按钮一定能响应
    document.addEventListener('click', function(e) {
        var menu = e.target.closest('.diary-page-menu') || e.target.closest('.letter-page-menu');
        if (!menu) return;
        e.stopPropagation();
        e.preventDefault();
        if (menu.classList.contains('diary-page-menu')) safeOpenDiarySettings();
        else safeOpenLetterSettings();
    }, true);
    // 同时绑定 touchend，防止某些移动端 click 事件不触发
    document.addEventListener('touchend', function(e) {
        var menu = e.target.closest('.diary-page-menu') || e.target.closest('.letter-page-menu');
        if (!menu) return;
        e.stopPropagation();
        e.preventDefault();
        if (menu.classList.contains('diary-page-menu')) safeOpenDiarySettings();
        else safeOpenLetterSettings();
    }, true);

    // ===== 通用图片上传 =====
    function triggerUpload() { document.getElementById('fileInput').click(); }
    function handleFileUploadExtended(event){
        const file=event.target.files[0];
        if(!file)return;
        // Handle types that are ONLY in this extended handler
        if(currentEditType==='topBgImage'||currentEditType==='bottomBgImage'||currentEditType==='frame_preview'||currentEditType==='customIcon'){
            const fr=new FileReader();
            fr.onload=async function(ev){
                var b64=ev.target.result;
                // 安卓必须压缩图片后再存储（规则7），iOS 保留原图
                try { b64 = await _compressImgIfAndroid(b64); } catch(_ce){}
                if(currentEditType==='topBgImage'){
                    appData.chatSettings.topBgImage=b64;
                    document.querySelector('.chat-header').style.backgroundImage='url('+b64+')';
                    document.querySelector('.chat-header').style.backgroundSize='cover';
                    saveDataSync();
                }else if(currentEditType==='bottomBgImage'){
                    appData.chatSettings.bottomBgImage=b64;
                    document.querySelector('.chat-footer').style.backgroundImage='url('+b64+')';
                    document.querySelector('.chat-footer').style.backgroundSize='cover';
                    saveDataSync();
                }else if(currentEditType==='frame_preview'){
                    showFrameAdjust(currentEditTarget,b64);
                }else if(currentEditType==='customIcon'){
                    if(!appData.chatSettings.customIcons)appData.chatSettings.customIcons={};
                    appData.chatSettings.customIcons[currentEditTarget]=b64;
                    saveDataSync();
                    refreshCustomIcons();
                }
                event.target.value='';
            };
            fr.readAsDataURL(file);
        }else{
            // Delegate to original handler for all other types
            handleFileUpload(event);
        }
    }
    /* 安卓图片压缩：iOS 保留原图不压缩，Android 压缩到 1200px / 0.8 质量（规则7） */
    function _compressImgIfAndroid(dataUrl) {
        var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) return Promise.resolve(dataUrl);
        if (typeof compressImage === 'function') {
            return compressImage(dataUrl, 1200, 1200, 0.8).catch(function(){ return dataUrl; });
        }
        return Promise.resolve(dataUrl);
    }
    /* 局部更新联系人列表中某个联系人的头像（避免全量 renderContactList） */
    function _updateContactAvatarDOM(id, src) {
        try {
            var container = document.getElementById('contactListItems');
            if (!container) return;
            var wrapper = container.querySelector('.contact-item-wrapper[data-contact-id="' + _cssEscape(id) + '"]');
            if (!wrapper) return;
            var av = wrapper.querySelector('.contact-avatar');
            if (av) {
                av.innerHTML = '';
                if (src) { var im = document.createElement('img'); im.src = src; av.appendChild(im); }
                else {
                    var c = _findContactById(id);
                    av.textContent = ((c && c.name) || '?').charAt(0);
                }
            }
        } catch(e) { console.error('_updateContactAvatarDOM error:', e); }
    }
    /* 局部更新联系人列表中某个联系人的名称 */
    function _updateContactNameDOM(id, name) {
        try {
            var container = document.getElementById('contactListItems');
            if (!container) return;
            var wrapper = container.querySelector('.contact-item-wrapper[data-contact-id="' + _cssEscape(id) + '"]');
            if (!wrapper) return;
            var nameEl = wrapper.querySelector('.contact-name');
            if (nameEl) {
                // 保留可能存在的置顶图标
                var pinIcon = nameEl.querySelector('span');
                nameEl.textContent = name;
                if (pinIcon) nameEl.insertBefore(pinIcon, nameEl.firstChild);
            }
        } catch(e) { console.error('_updateContactNameDOM error:', e); }
    }
    /* 转义字符串以安全用于 CSS 属性选择器 */
    function _cssEscape(s) {
        return String(s).replace(/["\\\[\]]/g, '\\$&');
    }
    function handleFileUpload(e) {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = async function(ev) {
            var src = ev.target.result;
            // 安卓必须压缩图片后再存储（规则7），iOS 保留原图
            try { src = await _compressImgIfAndroid(src); } catch(_ce){}
            if (currentEditType === 'widget') {
                const img = currentEditTarget.querySelector('.widget-image');
                if (img) { img.src = src; appData.widgetImages[currentEditTarget.id] = src; saveDataSync(); }
            } else if (currentEditType === 'appIcon') {
                const img = currentEditTarget.querySelector('.custom-image');
                if (img) {
                    img.src = src;
                    currentEditTarget.classList.add('has-image');
                    const parent = currentEditTarget.closest('.app-item');
                    if (parent) {
                        const key = parent.dataset.app || 'unknown';
                        appData.appIconImages[key] = src;
                        saveDataSync();
                    }
                }
            } else if (currentEditType === 'anniversary') {
                const img = document.getElementById('anniversaryBg');
                if (img) { img.src = src; document.getElementById('anniversaryWidget').classList.add('has-image'); appData.colors.anniversaryBg = src; saveDataSync(); }
            } else if (currentEditType === 'period') {
                const img = document.getElementById('periodBg');
                if (img) { img.src = src; document.getElementById('periodCalendar').classList.add('has-image'); appData.colors.periodBg = src; saveDataSync(); }
            } else if (currentEditType === 'time') {
                const img = currentEditTarget.querySelector('.bg-image');
                if (img) { img.src = src; currentEditTarget.classList.add('has-image'); const key = currentEditTarget.id; appData.colors[key+'_bg'] = src; saveDataSync(); }
            } else if (currentEditType === 'wordCard') {
                const img = document.getElementById('wordCardBg');
                if (img) { img.src = src; document.getElementById('wordCard').classList.add('has-image'); appData.colors.wordCardBg = src; saveDataSync(); }
            } else if (currentEditType === 'otherAvatar') {
                appData.chatSettings.otherAvatar = src;
                updateAvatarPreview('other', src);
                // 同步更新当前联系人的头像到列表界面
                if (_activeContactId) {
                    var _c = _findContactById(_activeContactId);
                    if (_c) { _c.avatar = src; }
                }
                saveDataSync();
                // 只更新聊天消息中的头像 DOM，不触发全量重绘（规则1/2）
                updateChatAvatarDOM('other');
                updateMomentsAvatarDOM('other');
                // 局部更新联系人列表头像，不调用 renderContactList()
                if (_activeContactId) _updateContactAvatarDOM(_activeContactId, src);
                // 更新视频通话头像预览
                var videoAvatar = document.getElementById('videoAvatar');
                if (videoAvatar) videoAvatar.innerHTML = '<img src="' + src + '">';
                closeAllModals();
            } else if (currentEditType === 'myAvatar') {
                appData.chatSettings.myAvatar = src;
                updateAvatarPreview('my', src);
                saveDataSync();
                updateChatAvatarDOM('mine');
                updateMomentsAvatarDOM('mine');
                closeAllModals();
            } else if (currentEditType === 'chatWallpaper') {
                appData.chatSettings.chatWallpaper = src;
                document.querySelector('.chat-messages').style.backgroundImage = `url(${src})`;
                const chatPage = document.getElementById('chatPage');
                if (chatPage) { chatPage.style.backgroundImage = `url(${src})`; chatPage.style.backgroundSize = 'cover'; chatPage.style.backgroundPosition = 'center'; }
                saveDataSync();
                closeAllModals();
            } else if (currentEditType === 'frame') {
                const type = currentEditTarget;
                const frames = type === 'other' ? appData.chatSettings.otherFrames : appData.chatSettings.myFrames;
                const frameId = 'frame_' + Date.now();
                frames[frameId] = src;
                
                const grid = document.getElementById(type === 'other' ? 'otherFrameGrid' : 'myFrameGrid');
                const addBtn = grid.querySelector('.frame-add');
                const frameItem = document.createElement('div');
                frameItem.className = 'frame-item';
                frameItem.dataset.frame = frameId;
                frameItem.style.backgroundImage = `url(${src})`;
                frameItem.style.backgroundSize = 'cover';
                frameItem.onclick = () => selectFrame(type, frameId);
                grid.insertBefore(frameItem, addBtn);
                
                saveDataSync();
                closeAllModals();
            } else if (currentEditType === 'videoBg') {
                appData.videoBg = src;
                document.getElementById('videoBg').src = src;
                saveDataSync();
                closeAllModals();
                document.getElementById('videoBgMenu').classList.remove('show');
            } else if (currentEditType === 'momentsWallpaper') {
                appData.moments.wallpaper = src;
                // 清除可能存在的视频壁纸，避免覆盖
                if (appData.moments.videoWallpaper) appData.moments.videoWallpaper = '';
                var _mh = document.getElementById('momentsHeader');
                if (_mh) {
                    var _oldV = _mh.querySelector('video.moments-bg-video');
                    if (_oldV) _oldV.remove();
                    _mh.style.backgroundImage = `url(${src})`;
                }
                // 同步立即保存（规则4），防止快速切页丢失
                saveDataSync();
            } else if (currentEditType === 'diaryBg') {
                appData.diary.settings.bgImage = src;
                saveDataSync();
                // 局部更新：只改已有卡片的背景，不重建列表（规则1/2）
                var _dCards = document.querySelectorAll('#diaryList .diary-new-card');
                _dCards.forEach(function(card){ card.style.background = 'url(' + src + ') center/cover no-repeat'; });
                closeAllModals();
            } else if (currentEditType === 'letterBg') {
                appData.letter.settings.bgImage = src;
                saveDataSync();
                // 信件列表项不直接使用 bgImage（仅详情弹窗使用），无需重建列表
                // 若详情弹窗打开则更新其背景
                var _lmc = document.querySelector('#letterDetailModal .modal-content');
                if (_lmc) _lmc.style.background = 'url(' + src + ') center/cover no-repeat';
                closeAllModals();
            } else if (currentEditType === 'globalChatWallpaper' || currentEditType === 'globalDesktopWallpaper') {
                appData.globalSettings.chatWallpaper = src;
                saveDataSync();
                applyDesktopWallpaper();
                const wpPreview = document.getElementById('globalWallpaperPreview');
                if (wpPreview) {
                    wpPreview.style.backgroundImage = `url(${src})`;
                    wpPreview.style.display = 'block';
                }
            } else {
                closeAllModals();
            }
            e.target.value = '';
        };
        reader.readAsDataURL(file);
    }
    function resetWidgetImage() {
        if (currentEditType === 'widget') {
            const img = currentEditTarget.querySelector('.widget-image');
            if(img) { img.src = ''; delete appData.widgetImages[currentEditTarget.id]; saveData(); }
        } else if (currentEditType === 'appIcon') {
            const img = currentEditTarget.querySelector('.custom-image');
            if(img) { img.src = ''; currentEditTarget.classList.remove('has-image'); const parent = currentEditTarget.closest('.app-item'); if(parent) { delete appData.appIconImages[parent.dataset.app]; saveData(); } }
        } else if (currentEditType === 'anniversary') {
            const img = document.getElementById('anniversaryBg');
            if(img) { img.src = ''; document.getElementById('anniversaryWidget').classList.remove('has-image'); delete appData.colors.anniversaryBg; saveData(); }
        } else if (currentEditType === 'period') {
            const img = document.getElementById('periodBg');
            if(img) { img.src = ''; document.getElementById('periodCalendar').classList.remove('has-image'); delete appData.colors.periodBg; saveData(); }
        } else if (currentEditType === 'time') {
            const img = currentEditTarget.querySelector('.bg-image');
            if(img) { img.src = ''; currentEditTarget.classList.remove('has-image'); const key = currentEditTarget.id; delete appData.colors[key+'_bg']; saveData(); }
        } else if (currentEditType === 'wordCard') {
            const img = document.getElementById('wordCardBg');
            if(img) { img.src = ''; document.getElementById('wordCard').classList.remove('has-image'); delete appData.colors.wordCardBg; saveData(); }
        }
        closeAllModals();
    }

    // ===== 第一页：纪念日 =====
    function openAnniversaryEdit() {
        currentEditType='anniversary';
        document.getElementById('editTitle').value = appData.anniversary.title || '我与你相恋已经';
        document.getElementById('editDate').value = appData.anniversary.date || '2024-01-01';
        document.getElementById('overlay').classList.add('show');
        document.getElementById('anniversaryEditor').classList.add('show');
    }
    function setAnniversaryColor(c) {
        markCustomColor(document.getElementById('anniversaryWidget'));
        document.getElementById('anniversaryTitle').style.color = c;
        document.getElementById('anniversaryDays').style.color = c;
        document.getElementById('anniversaryDate').style.color = c;
        appData.colors.anniversaryText = c;
        saveData();
    }
    function openAnniversaryBgUpload() { document.getElementById('anniversaryEditor').classList.remove('show'); document.getElementById('uploadModal').classList.add('show'); }
    function calcAnniversaryDays(dateStr) {
        // 兼容iOS Safari: 用split手动解析日期，避免 new Date('YYYY-MM-DD') 时区问题
        const parts = dateStr.split('-');
        const target = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const today = new Date();
        today.setHours(0,0,0,0);
        const diffTime = Math.abs(today.getTime() - target.getTime());
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
    function calcWeekDay(dateStr) {
        const parts = dateStr.split('-');
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const week = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
        return week[d.getDay()];
    }
    function updateAnniversaryDisplay(dateStr) {
        const diffDays = calcAnniversaryDays(dateStr);
        document.getElementById('anniversaryDays').textContent = diffDays + ' Days';
        document.getElementById('anniversaryDate').textContent = dateStr + ' ' + calcWeekDay(dateStr);
    }
    function saveAnniversary() {
        const title = document.getElementById('editTitle').value;
        const dateStr = document.getElementById('editDate').value;
        const color = document.getElementById('anniColorPicker').value;
        if(title) { appData.anniversary.title = title; document.getElementById('anniversaryTitle').textContent = title; }
        if(dateStr) {
            appData.anniversary.date = dateStr;
            updateAnniversaryDisplay(dateStr);
        }
        document.getElementById('anniversaryTitle').style.color = color;
        document.getElementById('anniversaryDays').style.color = color;
        document.getElementById('anniversaryDate').style.color = color;
        appData.colors.anniversaryText = color;
        saveData();
        closeAllModals();
    }
    function initAnniversary() {
        const d = appData.anniversary.date || '2024-01-01';
        const title = appData.anniversary.title || '我与你相恋已经';
        document.getElementById('anniversaryTitle').textContent = title;
        const diffDays = calcAnniversaryDays(d);
        document.getElementById('anniversaryDays').textContent = diffDays + ' Days';
        document.getElementById('anniversaryDate').textContent = d + ' ' + calcWeekDay(d);
        if (appData.colors.anniversaryText) {
            markCustomColor(document.getElementById('anniversaryWidget'));
            document.getElementById('anniversaryTitle').style.color = appData.colors.anniversaryText;
            document.getElementById('anniversaryDays').style.color = appData.colors.anniversaryText;
            document.getElementById('anniversaryDate').style.color = appData.colors.anniversaryText;
        }
        if (appData.colors.anniversaryBg) {
            document.getElementById('anniversaryBg').src = appData.colors.anniversaryBg;
            document.getElementById('anniversaryWidget').classList.add('has-image');
        }
    }
    function editAppName(el) {
        const n = prompt('输入新的应用名称:', el.textContent);
        if(n && n.trim()) {
            el.textContent = n.trim();
            const parent = el.closest('.app-item');
            if(parent) {
                const key = parent.dataset.app || 'unknown';
                appData.appNames[key] = n.trim();
                saveData();
            }
        }
    }

    // ===== 第二页：日历 =====
    function buildCalendar() {
        const now = new Date();
        const year = now.getFullYear(), month = now.getMonth();
        const monthName = year + '年' + (month+1) + '月';
        document.getElementById('calMonth').textContent = monthName;
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month+1, 0).getDate();
        const grid = document.getElementById('calDaysGrid');
        grid.innerHTML = '';
        const weekdays = ['日','一','二','三','四','五','六'];
        for (let wd of weekdays) {
            const d = document.createElement('div');
            d.style.textAlign='center'; d.style.fontSize='12px'; d.style.fontWeight='400'; d.style.opacity='0.6';
            d.textContent = wd;
            d.style.fontFamily = 'var(--font-family)';
            grid.appendChild(d);
        }
        for (let i=0; i<firstDay; i++) {
            const empty = document.createElement('div');
            grid.appendChild(empty);
        }
        const periodData = appData.periodData || {};
        for (let day=1; day<=daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'cal-day-item';
            const dateStr = year + '-' + String(month+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
            cell.dataset.date = dateStr;
            const num = document.createElement('span');
            num.textContent = day;
            cell.appendChild(num);
            const dot = document.createElement('span');
            dot.className = 'dot';
            if (periodData[dateStr] === 'pink') dot.classList.add('pink');
            else if (periodData[dateStr] === 'blue') dot.classList.add('blue');
            cell.appendChild(dot);
            cell.addEventListener('click', function(e) {
                e.stopPropagation();
                const key = this.dataset.date;
                const current = appData.periodData[key] || '';
                if (current === 'pink') { appData.periodData[key] = 'blue'; }
                else if (current === 'blue') { delete appData.periodData[key]; }
                else { appData.periodData[key] = 'pink'; }
                saveData();
                buildCalendar();
            });
            grid.appendChild(cell);
        }
        if (appData.colors.periodText) {
            markCustomColor(document.getElementById('periodCalendar'));
            document.querySelectorAll('.cal-month, .cal-day-item span').forEach(el => el.style.color = appData.colors.periodText);
        }
        if (appData.colors.periodBg) {
            document.getElementById('periodBg').src = appData.colors.periodBg;
            document.getElementById('periodCalendar').classList.add('has-image');
        }
    }
    function openPeriodBgEdit() {
        currentEditType = 'period';
        document.getElementById('overlay').classList.add('show');
        document.getElementById('periodEditMenu').classList.add('show');
    }
    function openPeriodBgUpload() { document.getElementById('periodEditMenu').classList.remove('show'); document.getElementById('uploadModal').classList.add('show'); }
    function resetPeriodBg() { const img = document.getElementById('periodBg'); if(img) { img.src = ''; document.getElementById('periodCalendar').classList.remove('has-image'); delete appData.colors.periodBg; saveData(); } closeAllModals(); }
    function setPeriodColor(c) {
        markCustomColor(document.getElementById('periodCalendar'));
        document.querySelectorAll('.cal-month, .cal-day-item span').forEach(el => el.style.color = c);
        appData.colors.periodText = c;
        saveData();
    }

    // ===== 第二页：字卡展示（每日寄语） =====
    /* 内置字卡 —— 仅使用这几张，不调取用户字卡库 */
    var WORD_CARD_BUILTIN = [
        '宝宝，我现在在忙但也可以回你消息',
        '宝贝，我在线，快来找我聊天吧！',
        '救命……好忙，辛苦你等待我一下'
    ];
    var _wordCardTimer = null;
    function initDailyWord() {
        try {
            /* 每次进入立即随机展示一张内置字卡，避免始终只显示同一张 */
            var immediateText = generateDailyWordText();
            appData.dailyWordUpdate.currentText = immediateText;
            saveData();
            updateWordCardDisplay();
            const today = new Date().toDateString();
            const updateData = appData.dailyWordUpdate;
            
            if (updateData.lastDate !== today) {
                updateData.lastDate = today;
                updateData.currentText = generateDailyWordText();
                /* 每天生成2-4个随机更新时间点 */
                var updateCount = 2 + Math.floor(Math.random() * 3);
                updateData.todayUpdateTimes = [];
                for (var i = 0; i < updateCount; i++) {
                    updateData.todayUpdateTimes.push({
                        hour: Math.floor(Math.random() * 24),
                        minute: Math.floor(Math.random() * 60),
                        applied: false
                    });
                }
                updateData.todayUpdateTimes.sort(function(a, b) {
                    return (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute);
                });
                saveData();
            } else if (!updateData.todayUpdateTimes || updateData.todayUpdateTimes.length === 0) {
                /* 修复：当天已有记录但更新时间点缺失（旧数据/异常），重新生成 */
                var _uc = 2 + Math.floor(Math.random() * 3);
                updateData.todayUpdateTimes = [];
                for (var j = 0; j < _uc; j++) {
                    updateData.todayUpdateTimes.push({ hour: Math.floor(Math.random()*24), minute: Math.floor(Math.random()*60), applied: false });
                }
                updateData.todayUpdateTimes.sort(function(a, b) { return (a.hour*60+a.minute)-(b.hour*60+b.minute); });
                saveData();
            }
            updateWordCardDisplay();
            restoreWordCardStyle();

            /* 立即检查是否有未应用的更新时间点 */
            try {
                var _now = new Date();
                var _nowMin = _now.getHours() * 60 + _now.getMinutes();
                var _changed = false;
                if (updateData.todayUpdateTimes && updateData.todayUpdateTimes.length > 0) {
                    updateData.todayUpdateTimes.forEach(function(_tt) {
                        if (!_tt.applied && _nowMin >= (_tt.hour * 60 + _tt.minute)) {
                            _tt.applied = true;
                            _changed = true;
                        }
                    });
                    if (_changed) {
                        updateData.currentText = generateDailyWordText();
                        saveData();
                        updateWordCardDisplay();
                    }
                }
            } catch(_e) {}

            /* 清理旧定时器，防止重复创建导致崩溃 */
            if (_wordCardTimer) { clearInterval(_wordCardTimer); _wordCardTimer = null; }
            /* 每30秒检查一次，确保字卡及时更新 */
            _wordCardTimer = setInterval(function() {
                try {
                    /* Bug11修复：重新获取引用，避免闭包变量 updateData 指向旧对象导致跨天时 currentText 写入无效 */
                    var _ud = appData.dailyWordUpdate;
                    if (!_ud) return;
                    var now = new Date();
                    var todayStr = now.toDateString();
                    var nowMinutes = now.getHours() * 60 + now.getMinutes();

                    if (_ud.lastDate !== todayStr) {
                        /* 新的一天：先生成 currentText 再刷新显示 */
                        _ud.lastDate = todayStr;
                        _ud.currentText = generateDailyWordText() || '等待对方更新中……';
                        var updateCount = 2 + Math.floor(Math.random() * 3);
                        _ud.todayUpdateTimes = [];
                        for (var i = 0; i < updateCount; i++) {
                            _ud.todayUpdateTimes.push({
                                hour: Math.floor(Math.random() * 24),
                                minute: Math.floor(Math.random() * 60),
                                applied: false
                            });
                        }
                        _ud.todayUpdateTimes.sort(function(a, b) {
                            return (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute);
                        });
                        saveData();
                        updateWordCardDisplay();
                    } else if (_ud.todayUpdateTimes && _ud.todayUpdateTimes.length > 0) {
                        /* 检查是否有未应用的更新时间点已到 */
                        var changed = false;
                        for (var i = 0; i < _ud.todayUpdateTimes.length; i++) {
                            var t = _ud.todayUpdateTimes[i];
                            if (!t.applied && nowMinutes >= (t.hour * 60 + t.minute)) {
                                t.applied = true;
                                changed = true;
                            }
                        }
                        if (changed) {
                            _ud.currentText = generateDailyWordText() || '等待对方更新中……';
                            saveData();
                            updateWordCardDisplay();
                        }
                    }
                } catch(e) { console.error('wordCard interval error:', e); }
            }, 300000); /* 5分钟检查一次 */
            /* 修复：页面加载后2秒立即检查一次，避免5分钟间隔内短暂使用看不到字卡更新 */
            setTimeout(function() {
                try {
                    var _now0 = new Date();
                    var _nowMin0 = _now0.getHours() * 60 + _now0.getMinutes();
                    var _ud = appData.dailyWordUpdate;
                    if (_ud && _ud.todayUpdateTimes && _ud.todayUpdateTimes.length > 0) {
                        var _ch = false;
                        for (var k = 0; k < _ud.todayUpdateTimes.length; k++) {
                            var _tt = _ud.todayUpdateTimes[k];
                            if (!_tt.applied && _nowMin0 >= (_tt.hour * 60 + _tt.minute)) { _tt.applied = true; _ch = true; }
                        }
                        if (_ch) { _ud.currentText = generateDailyWordText(); saveData(); updateWordCardDisplay(); }
                    }
                } catch(_e2) {}
            }, 2000);
        } catch(e) { console.error('initDailyWord error:', e); }
    }
    function updateWordCardDisplay() {
        try {
            /* Bug11修复：增加空值保护，防止 dailyWordUpdate 未初始化时报错 */
            if (!appData.dailyWordUpdate) return;
            var text = appData.dailyWordUpdate.currentText || '等待对方更新中……';
            /* 兼容旧数据：如果存储的是旧默认文本，替换为新默认 */
            if (text === '这里是对方想对我说的话') {
                text = '等待对方更新中……';
                appData.dailyWordUpdate.currentText = text;
            }
            var el = document.getElementById('wordCardContent');
            if (el) el.textContent = '☆*:.｡. o(≧▽≦)o .｡.:*☆' + text;
        } catch(e) { console.error('updateWordCardDisplay error:', e); }
    }
    function restoreWordCardStyle() {
        if (appData.colors.wordCardBg) {
            const img = document.getElementById('wordCardBg');
            if (img) { img.src = appData.colors.wordCardBg; document.getElementById('wordCard').classList.add('has-image'); }
        }
        if (appData.colors.wordCardText) {
            markCustomColor(document.getElementById('wordCard'));
            const el = document.getElementById('wordCardContent');
            if (el) el.style.color = appData.colors.wordCardText;
        }
    }
    function openWordCardEdit() {
        currentEditType = 'wordCard';
        currentEditTarget = document.getElementById('wordCard');
        document.getElementById('overlay').classList.add('show');
        document.getElementById('wordCardEditMenu').classList.add('show');
        document.getElementById('wordCardColorPicker').value = appData.colors.wordCardText || '#1a1a1a';
    }
    function openWordCardBgUpload() {
        document.getElementById('wordCardEditMenu').classList.remove('show');
        document.getElementById('uploadModal').classList.add('show');
    }
    function resetWordCardBg() {
        const img = document.getElementById('wordCardBg');
        if (img) { img.src = ''; document.getElementById('wordCard').classList.remove('has-image'); delete appData.colors.wordCardBg; saveData(); }
        closeAllModals();
    }
    function setWordCardColor(c) {
        markCustomColor(document.getElementById('wordCard'));
        const el = document.getElementById('wordCardContent');
        if (el) el.style.color = c;
        appData.colors.wordCardText = c;
        saveData();
    }
    function generateDailyWordText() {
        /* 仅使用内置字卡，不调取用户字卡库 */
        if (!WORD_CARD_BUILTIN || WORD_CARD_BUILTIN.length === 0) return '等待对方更新中……';
        var current = appData.dailyWordUpdate ? appData.dailyWordUpdate.currentText : '';
        var pool = WORD_CARD_BUILTIN.filter(function(t){ return t !== current; });
        if (pool.length === 0) pool = WORD_CARD_BUILTIN;
        var idx = Math.floor(Math.random() * pool.length);
        return pool[idx];
    }
    function getAllVisibleWordCards() {
        let all = [];
        // 共用字卡：所有联系人都可以调取
        for (const group in appData.wordCards) {
            appData.wordCards[group].forEach(card => {
                if (!card.hidden) all.push(card.text);
            });
        }
        // 联系人专属字卡：仅当前聊天联系人可调取
        if (_activeContactId && appData.contactWordCards && appData.contactWordCards[_activeContactId]) {
            var cw = appData.contactWordCards[_activeContactId];
            if (cw && cw.cards) {
                for (const group in cw.cards) {
                    cw.cards[group].forEach(card => {
                        if (!card.hidden) all.push(card.text);
                    });
                }
            }
        } else if (!_activeContactId && appData.contactWordCards) {
            // 不在特定联系人聊天中时（如日记、信封等功能），包含所有联系人的专属字卡
            for (const contactId in appData.contactWordCards) {
                var cw2 = appData.contactWordCards[contactId];
                if (cw2 && cw2.cards) {
                    for (const group in cw2.cards) {
                        cw2.cards[group].forEach(card => {
                            if (!card.hidden) all.push(card.text);
                        });
                    }
                }
            }
        }
        return all;
    }

    // ===== 第二页：时间组件 =====
    var timeOffset = appData.timeOffset !== undefined ? appData.timeOffset : -9;
    var timeEditTarget = null;
    function updateTimes() {
        const now = new Date();
        const mine = now.toTimeString().slice(0,8);
        document.getElementById('mineTimeDisplay').textContent = mine;
        const his = new Date(now.getTime() + timeOffset * 3600 * 1000);
        document.getElementById('hisTimeDisplay').textContent = his.toTimeString().slice(0,8);
    }
    // 使用 Page Visibility API 优化定时器：页面不可见时暂停更新，减少卡顿
    var _timesTimer = setInterval(updateTimes, 1000);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(_timesTimer);
        } else {
            updateTimes();
            _timesTimer = setInterval(updateTimes, 1000);
        }
    });
    updateTimes();
    function openTimeEdit(el) {
        timeEditTarget = el;
        currentEditTarget = el;
        currentEditType = 'time';
        document.getElementById('overlay').classList.add('show');
        document.getElementById('timeEditMenu').classList.add('show');
        var _absOff = Math.abs(timeOffset);
            var _h = Math.floor(_absOff);
            var _m = Math.floor((_absOff - _h) * 60);
            var _s = Math.round(((_absOff - _h) * 60 - _m) * 60);
            var _sign = timeOffset < 0 ? -1 : 1;
            var _hourInput = document.getElementById('timeOffsetHour');
            var _minInput = document.getElementById('timeOffsetMin');
            var _secInput = document.getElementById('timeOffsetSec');
            if (_hourInput) _hourInput.value = _sign * _h;
            if (_minInput) _minInput.value = _m;
            if (_secInput) _secInput.value = _s;
        const savedText = appData.colors[el.id + '_text'];
        document.getElementById('timeColorPicker').value = savedText || '#1a1a1a';
    }
    function openTimeBgUpload() { document.getElementById('timeEditMenu').classList.remove('show'); document.getElementById('uploadModal').classList.add('show'); }
    function resetTimeBg() {
        if(timeEditTarget) {
            const img = timeEditTarget.querySelector('.bg-image');
            if(img) { img.src = ''; timeEditTarget.classList.remove('has-image'); const key = timeEditTarget.id; delete appData.colors[key+'_bg']; saveData(); }
        }
        closeAllModals();
    }
    function setTimeColor(c) {
        if(timeEditTarget) {
            const key = timeEditTarget.id;
            document.documentElement.style.setProperty('--' + key + '-text', c);
            appData.colors[key+'_text'] = c;
            saveData();
        }
    }
    /* 第三页输入框颜色设置 */
    function setP3InputBg(c) {
        /* 将hex转为半透明rgba用于毛玻璃效果 */
        var rgba = c;
        if(c && c[0]==='#'){
            var hex=c.replace('#','');
            if(hex.length===3) hex=hex.split('').map(function(x){return x+x;}).join('');
            var r=parseInt(hex.slice(0,2),16)||255, g=parseInt(hex.slice(2,4),16)||255, b=parseInt(hex.slice(4,6),16)||255;
            rgba='rgba('+r+','+g+','+b+',0.45)';
        }
        document.documentElement.style.setProperty('--p3-input-bg', rgba);
        document.documentElement.style.setProperty('--p3-input-bg-solid', c);
        if(!appData.colors) appData.colors={};
        appData.colors.p3InputBg=c;
        appData.colors.p3InputBgRgba=rgba;
        saveData();
    }
    function setP3InputColor(c) {
        document.documentElement.style.setProperty('--p3-input-color', c);
        if(!appData.colors) appData.colors={};
        appData.colors.p3InputColor=c;
        saveData();
    }
    function saveTimeOffset() {
        var h = parseFloat(document.getElementById('timeOffsetHour').value) || 0;
        var m = parseFloat(document.getElementById('timeOffsetMin').value) || 0;
        var s = parseFloat(document.getElementById('timeOffsetSec').value) || 0;
        var v = h + m/60 + s/3600;
        if (!isNaN(v)) { timeOffset = v; appData.timeOffset = v; saveData(); updateTimes(); }
        closeAllModals();
    }
    function initTimeWidgets() {
        ['timeHis','timeMine'].forEach(id => {
            const el = document.getElementById(id);
            const key = id;
            if (appData.colors[key+'_text']) {
                document.documentElement.style.setProperty('--' + key + '-text', appData.colors[key+'_text']);
            }
            if (appData.colors[key+'_bg']) {
                el.querySelector('.bg-image').src = appData.colors[key+'_bg'];
                el.classList.add('has-image');
            }
        });
        /* 恢复第三页输入框颜色 */
        if(appData.colors && appData.colors.p3InputBg){
            document.documentElement.style.setProperty('--p3-input-bg', appData.colors.p3InputBgRgba||appData.colors.p3InputBg);
            document.documentElement.style.setProperty('--p3-input-bg-solid', appData.colors.p3InputBg);
            var bgPicker=document.getElementById('p3InputBgPicker');
            if(bgPicker) bgPicker.value=appData.colors.p3InputBg;
        }
        if(appData.colors && appData.colors.p3InputColor){
            document.documentElement.style.setProperty('--p3-input-color', appData.colors.p3InputColor);
            var colorPicker=document.getElementById('p3InputColorPicker');
            if(colorPicker) colorPicker.value=appData.colors.p3InputColor;
        }
    }

    // ===== 恢复存储的图片和名称 =====
    function restoreAppIcons() {
        document.querySelectorAll('.app-item').forEach(item => {
            const key = item.dataset.app;
            if (key && appData.appIconImages && appData.appIconImages[key]) {
                const icon = item.querySelector('.app-icon');
                const img = icon.querySelector('.custom-image');
                if (img) {
                    img.src = appData.appIconImages[key];
                    icon.classList.add('has-image');
                }
            }
            if (key && appData.appNames && appData.appNames[key]) {
                const nameEl = item.querySelector('.app-name');
                if (nameEl) nameEl.textContent = appData.appNames[key];
            }
        });
    }
    function restoreWidgets() {
        document.querySelectorAll('.square-widget').forEach(w => {
            const id = w.id;
            if (id && appData.widgetImages && appData.widgetImages[id]) {
                const img = w.querySelector('.widget-image');
                if (img) img.src = appData.widgetImages[id];
            }
        });
    }


    // ========== 全局设置 (初始化) ==========
    if (!appData.globalSettings) {
        appData.globalSettings = {
            darkMode: false,
            fontFamily: '',
            fontColor: '#1a1a1a',
            iconColor: '#999999',
            globalFontSize: 14,
            chatWallpaper: '',
            disableGlass: false,
            iconBg: '#ffffff',
            anniversaryBg: '#ffffff',
            dockBg: '#ffffff',
            periodBg: '#ffffff',
            timeBg: '#ffffff'
        };
    }
    if (!appData.beautifyPresets) {
        appData.beautifyPresets = { chatGlobal: [], bubble: [], moments: [] };
        if(!appData.beautifyLiveCss) appData.beautifyLiveCss = { chatGlobal: '', bubble: '', moments: '' };
    }
    if (!appData.balanceData) {
        appData.balanceData = {
            mine: 100,
            other: 100,
            records: [{ text: '系统为你们各自赠送了一百元作为起始资金！', time: Date.now() }],
            initialized: true
        };
    }
    saveData();

    function applyChatBgSettings() {
        const b = appData.beautify || {};
        const chatHeader = document.querySelector('.chat-header');
        const chatFooter = document.querySelector('.chat-footer');
        if (chatHeader) {
            chatHeader.style.backgroundColor = b.topBgColor || '';
            if (b.topBgImage) {
                chatHeader.style.backgroundImage = 'url(' + b.topBgImage + ')';
                chatHeader.style.backgroundSize = 'cover';
            } else {
                chatHeader.style.backgroundImage = '';
            }
        }
        if (chatFooter) {
            chatFooter.style.backgroundColor = b.bottomBgColor || '';
            if (b.bottomBgImage) {
                chatFooter.style.backgroundImage = 'url(' + b.bottomBgImage + ')';
                chatFooter.style.backgroundSize = 'cover';
            } else {
                chatFooter.style.backgroundImage = '';
            }
        }
    }
    // ===== 全局字体大小/颜色 JS 覆盖 =====
    var _gtoTimer = null;
    var _gtoObserver = null;
    var _gtoCurrentScale = 1;
    var _gtoCurrentColor = '';
    var _gtoInitialized = false;
    // 标记某区域为「组件自定义字体颜色」，GTO 将不再覆盖该区域，使组件独立颜色生效
    function markCustomColor(container) {
        if (!container) return;
        try { container.setAttribute('data-custom-color', '1'); } catch(e) {}
        try {
            var touched = container.querySelectorAll('[data-_gto-set]');
            for (var i = 0; i < touched.length; i++) {
                touched[i].style.color = '';
                delete touched[i].dataset._gtoSet;
                delete touched[i].dataset._origColor;
                delete touched[i].dataset._gtoColor;
            }
            if (container.dataset._gtoSet) {
                container.style.color = '';
                delete container.dataset._gtoSet;
                delete container.dataset._origColor;
                delete container.dataset._gtoColor;
            }
            // Also clear legacy data-_orig-color
            var legacy = container.querySelectorAll('[data-_orig-color]');
            for (var j = 0; j < legacy.length; j++) {
                legacy[j].style.color = '';
                delete legacy[j].dataset._origColor;
            }
            if (container.dataset._origColor) {
                container.style.color = '';
                delete container.dataset._origColor;
            }
        } catch(e) {}
    }
    function applyGlobalTextOverride(scale, fontColor) {
        _gtoCurrentScale = scale;
        _gtoCurrentColor = ''; // 已禁用 JS 颜色覆盖，仅通过 CSS 变量影响
        _doApplyGTO(_gtoCurrentScale, _gtoCurrentColor);
    }
    function _doApplyGTO(scale, fontColor) {
        // 仅处理字体大小缩放，不覆盖字体颜色
        var applyFn = function() {
            var els = document.querySelectorAll('body *:not(script):not(style):not(link):not(meta):not(input[type="hidden"])');
            for (var i = 0; i < els.length; i++) {
                var el = els[i];
                // --- 字体大小缩放 ---
                var _skipFont = el.closest && (el.closest('#momentsPage'));
                if (_skipFont) {
                    if (el.dataset._origFs) { el.style.fontSize=''; delete el.dataset._origFs; }
                } else if (scale !== 1) {
                    if (!el.dataset._origFs) {
                        var cs = window.getComputedStyle(el);
                        el.dataset._origFs = cs.fontSize;
                    }
                    var origPx = parseFloat(el.dataset._origFs);
                    if (origPx > 0 && origPx < 100) {
                        var newPx = Math.round(origPx * scale * 10) / 10;
                        if (el.style.fontSize !== newPx + 'px') {
                            el.style.fontSize = newPx + 'px';
                        }
                    }
                } else {
                    if (el.dataset._origFs) {
                        el.style.fontSize = '';
                        delete el.dataset._origFs;
                    }
                }
                // --- 清除之前 GTO 可能设置过的颜色 ---
                if (el.dataset._gtoSet) {
                    el.style.color = '';
                    delete el.dataset._gtoSet;
                    delete el.dataset._origColor;
                    delete el.dataset._gtoColor;
                }
            }
        };
        applyFn();
        // 监听 DOM 变化，对新元素仅应用字体大小
        if (!_gtoObserver) {
            _gtoObserver = new MutationObserver(function(mutations) {
                if (_gtoCurrentScale !== 1) {
                    mutations.forEach(function(mutation) {
                        if (mutation.addedNodes) {
                            mutation.addedNodes.forEach(function(node) {
                                if (node.nodeType === 1 && node.querySelectorAll) {
                                    var children = node.querySelectorAll('*:not(script):not(style):not(link):not(meta)');
                                    children.forEach(function(el) {
                                        if (_gtoCurrentScale !== 1) {
                                            if (!el.dataset._origFs) {
                                                el.dataset._origFs = window.getComputedStyle(el).fontSize;
                                            }
                                            var origPx = parseFloat(el.dataset._origFs);
                                            if (origPx > 0 && origPx < 100) {
                                                el.style.fontSize = Math.round(origPx * _gtoCurrentScale * 10) / 10 + 'px';
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
            _gtoObserver.observe(document.body, {childList: true, subtree: true});
        }
    }
    function applyGlobalSettings() {
        const gs = appData.globalSettings || {};
        // 暗黑模式
        if (gs.darkMode) {
            document.documentElement.classList.add('dark-mode');
            document.documentElement.style.setProperty('--color-bg', '#1a1a1a');
            document.documentElement.style.setProperty('--color-white', '#2d2d2d');
            document.documentElement.style.setProperty('--glass-bg', 'rgba(45,45,45,0.28)');
            document.documentElement.style.setProperty('--dock-glass-bg', 'rgba(45,45,45,0.45)');
            document.documentElement.style.setProperty('--color-border-white', 'rgba(255,255,255,0.15)');
            document.body.style.background = '#1a1a1a';
        } else {
            document.documentElement.classList.remove('dark-mode');
            document.documentElement.style.setProperty('--color-bg', '#fafafa');
            document.documentElement.style.setProperty('--color-white', '#ffffff');
            document.documentElement.style.setProperty('--glass-bg', 'rgba(255,255,255,0.28)');
            document.documentElement.style.setProperty('--dock-glass-bg', 'rgba(255,255,255,0.45)');
            document.documentElement.style.setProperty('--color-border-white', 'rgba(255,255,255,0.35)');
            document.body.style.background = '#fafafa';
        }
        /* Bug19修复：全局暗黑模式开启时同步聊天顶部样式，避免聊天顶栏仍为白色 */
        var _chatPageEl = document.getElementById('chatPage');
        if (_chatPageEl) {
            var _chatDark = gs.darkMode || (appData.chatSettings && appData.chatSettings.chatDarkMode);
            if (_chatDark) _chatPageEl.classList.add('chat-dark-mode');
            else _chatPageEl.classList.remove('chat-dark-mode');
        }
        // 毛玻璃效果与组件纯色背景
        if (gs.disableGlass) {
            document.documentElement.classList.add('no-glass');
        } else {
            document.documentElement.classList.remove('no-glass');
        }
        document.documentElement.style.setProperty('--icon-bg', gs.iconBg || '#f9f9f9');
        document.documentElement.style.setProperty('--anniversary-bg', gs.anniversaryBg || '#f9f9f9');
        document.documentElement.style.setProperty('--dock-bg', gs.dockBg || '#f9f9f9');
        document.documentElement.style.setProperty('--period-bg', gs.periodBg || '#f9f9f9');
        document.documentElement.style.setProperty('--time-bg', gs.timeBg || '#f9f9f9');
        document.documentElement.style.setProperty('--word-card-bg', gs.wordCardBg || '#ffffff');

        // 全局字体（跟随系统）
        if (gs.fontFamily) {
            document.documentElement.style.setProperty('--font-family', gs.fontFamily + ', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');
        } else {
            document.documentElement.style.setProperty('--font-family', 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');
        }
        // 全局字体颜色 - 仅通过 CSS 变量影响使用变量的元素，不全局覆盖
        if (gs.fontColor) {
            document.documentElement.style.setProperty('--text-color', gs.fontColor);
            document.documentElement.style.setProperty('--color-deep-black', gs.fontColor);
            document.documentElement.style.setProperty('--color-deep-gray', gs.fontColor);
        } else {
            document.documentElement.style.removeProperty('--text-color');
            document.documentElement.style.removeProperty('--color-deep-black');
            document.documentElement.style.removeProperty('--color-deep-gray');
        }
        // 图标颜色
        if (gs.iconColor) {
            document.querySelectorAll('.app-icon svg').forEach(svg => {
                svg.style.stroke = gs.iconColor;
            });
        }
        // 全局字体大小：JS 遍历缩放所有文字元素
        var _fontScale = gs.globalFontSize ? (gs.globalFontSize / 14) : 1;
        document.documentElement.style.setProperty('--global-font-scale', _fontScale);
        document.documentElement.style.fontSize = (gs.globalFontSize || 14) + 'px';
        document.body.style.fontSize = (gs.globalFontSize || 14) + 'px';
        applyGlobalTextOverride(_fontScale, gs.fontColor || '');
        // 底栏位置恢复
        const dock = document.querySelector('.dock-bar');
        if (dock && appData.dockBottom !== undefined) {
            dock.style.bottom = appData.dockBottom + 'px';
        }
    }


    // ========== 设置APP（完整系统设置） ==========
    function openGlobalSettings() {
        document.getElementById('globalSettingsPage').style.display = 'flex';
        initGlobalSettingsPage();
        renderCustomFontList('global');
    }
    function closeGlobalSettings() {
        document.getElementById('globalSettingsPage').style.display = 'none';
    }

    // ========== 锁屏功能 ==========
    var _lockScreenPwdInput = '';
    var _lockScreenTimer = null;
    var _lockScreenErrTimer = null;
    function initLockScreen() {
        try {
            var ls = appData.lockScreen || {};
            // 首次启动强制锁屏并要求输入密码（无论 enabled 设置）
            if (!ls.firstLaunchDone) {
                // 首次打开：强制锁屏 + 强制密码
                ls.passwordEnabled = true;
                ls.enabled = true;
                if (!ls.password) {
                    // 没有设置密码时，强制要求设置密码
                    showLockScreen();
                    // 显示密码设置提示
                    setTimeout(function() {
                        var errEl = document.getElementById('lockScreenError');
                        if (errEl) {
                            errEl.textContent = '首次使用请设置锁屏密码';
                            errEl.style.display = 'block';
                            errEl.style.color = '#ff9500';
                        }
                        var pwdSection = document.getElementById('lockScreenPasswordSection');
                        if (pwdSection) pwdSection.style.display = 'flex';
                    }, 300);
                } else {
                    showLockScreen();
                }
            } else if (ls.enabled) {
                showLockScreen();
            }
            applyLockScreenStyles();
        } catch(e) { console.error('initLockScreen error:', e); }
    }
    function applyLockScreenStyles() {
        try {
            var ls = appData.lockScreen || {};
            var overlay = document.getElementById('lockScreenOverlay');
            if (!overlay) return;
            // 壁纸
            if (ls.wallpaper) {
                overlay.style.backgroundImage = 'url(' + ls.wallpaper + ')';
            } else {
                overlay.style.backgroundImage = '';
                overlay.style.background = '#1a1a1a';
            }
            // 文字颜色
            document.documentElement.style.setProperty('--lock-text-color', ls.textColor || '#ffffff');
        } catch(e) { console.error('applyLockScreenStyles error:', e); }
    }

    /* ========== 农历转换（公历转农历） ========== */
    var _lunarInfo = [
        0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
        0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
        0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
        0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
        0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
        0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
        0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
        0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
        0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
        0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
        0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
        0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
        0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
        0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
        0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
        0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
        0x0a2e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
        0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
        0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
        0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,
        0x0d520
    ];
    var _lunarGan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    var _lunarZhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    var _lunarMonthName = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'];
    function _lunarYearDays(y) {
        var i, sum = 348;
        for (i = 0x8000; i > 0x8; i >>= 1) {
            sum += (_lunarInfo[y - 1900] & i) ? 1 : 0;
        }
        return sum + _leapDays(y);
    }
    function _leapMonth(y) {
        return _lunarInfo[y - 1900] & 0xf;
    }
    function _leapDays(y) {
        if (_leapMonth(y)) {
            return (_lunarInfo[y - 1900] & 0x10000) ? 30 : 29;
        }
        return 0;
    }
    function _monthDays(y, m) {
        return (_lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
    }
    function _solarToLunar(date) {
        var baseDate = new Date(1900, 0, 31);
        // 规范化到午夜，避免时区导致的小数天偏移
        var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        var offset = Math.floor((d.getTime() - baseDate.getTime()) / 86400000);
        var i, leap = 0, temp = 0;
        for (i = 1900; i < 2101 && offset > 0; i++) {
            temp = _lunarYearDays(i);
            offset -= temp;
        }
        if (offset < 0) {
            offset += temp;
            i--;
        }
        var lunarYear = i;
        leap = _leapMonth(lunarYear);
        var isLeap = false;
        for (i = 1; i < 13 && offset >= 0; i++) {
            if (leap > 0 && i === leap + 1 && !isLeap) {
                --i;
                isLeap = true;
                temp = _leapDays(lunarYear);
            } else {
                temp = _monthDays(lunarYear, i);
            }
            if (isLeap && i === leap + 1) {
                isLeap = false;
            }
            offset -= temp;
        }
        if (offset === 0 && leap > 0 && i === leap + 1) {
            if (isLeap) {
                isLeap = false;
            } else {
                isLeap = true;
                --i;
            }
        }
        if (offset < 0) {
            offset += temp;
            --i;
        }
        var lunarMonth = i;
        var lunarDay = offset + 1;
        var ganIndex = (lunarYear - 4) % 10;
        var zhiIndex = (lunarYear - 4) % 12;
        var ganZhi = _lunarGan[ganIndex] + _lunarZhi[zhiIndex];
        var monthName = (isLeap ? '闰' : '') + _lunarMonthName[lunarMonth - 1];
        var dayName;
        if (lunarDay === 10) {
            dayName = '初十';
        } else if (lunarDay === 20) {
            dayName = '二十';
        } else if (lunarDay === 30) {
            dayName = '三十';
        } else {
            var dayPrefix = ['初','十','廿','卅'];
            var daySuffix = ['一','二','三','四','五','六','七','八','九','十'];
            dayName = dayPrefix[Math.floor(lunarDay / 10)] + daySuffix[(lunarDay % 10) - 1];
        }
        return { ganZhi: ganZhi, monthName: monthName, dayName: dayName };
    }
    function showLockScreen() {
        try {
            var ls = appData.lockScreen || {};
            var overlay = document.getElementById('lockScreenOverlay');
            if (!overlay) return;
            applyLockScreenStyles();
            overlay.classList.add('active');
            _lockScreenPwdInput = '';
            // 动态生成密码点（根据密码长度）
            var pwdLen = (ls.password || '').length || 6;
            var dotsContainer = document.getElementById('lockScreenDots');
            if (dotsContainer) {
                dotsContainer.innerHTML = '';
                for (var i = 0; i < pwdLen; i++) {
                    var dot = document.createElement('div');
                    dot.className = 'lock-screen-dot';
                    dotsContainer.appendChild(dot);
                }
            }
            updateLockScreenDots();
            // 初始只显示时间和日期，隐藏密码输入界面
            var pwdSection = document.getElementById('lockScreenPasswordSection');
            var timeSection = document.getElementById('lockScreenTimeSection');
            var tapHint = document.getElementById('lockScreenTapHint');
            if (pwdSection) pwdSection.style.display = 'none';
            if (timeSection) timeSection.style.display = 'block';
            if (tapHint) {
                tapHint.style.display = 'block';
                tapHint.textContent = (ls.passwordEnabled === false) ? '点击解锁' : '点击输入密码';
            }
            // 开始时间更新
            updateLockScreenTime();
            if (_lockScreenTimer) clearInterval(_lockScreenTimer);
            _lockScreenTimer = setInterval(updateLockScreenTime, 1000);
        } catch(e) { console.error('showLockScreen error:', e); }
    }
    function showLockScreenPassword() {
        try {
            var pwdSection = document.getElementById('lockScreenPasswordSection');
            var timeSection = document.getElementById('lockScreenTimeSection');
            var tapHint = document.getElementById('lockScreenTapHint');
            if (pwdSection) pwdSection.style.display = 'block';
            if (timeSection) timeSection.style.display = 'none';
            if (tapHint) tapHint.style.display = 'none';
            _lockScreenPwdInput = '';
            updateLockScreenDots();
        } catch(e) { console.error('showLockScreenPassword error:', e); }
    }
    // 点击锁屏：有密码才弹出密码界面，无密码则直接解锁（保证进入锁屏时只看到时间，点击后才出现密码）
    function handleLockScreenTap() {
        try {
            var ls = appData.lockScreen || {};
            // 首次启动时强制要求密码，不允许跳过
            if (ls.passwordEnabled === false && ls.firstLaunchDone) {
                hideLockScreen();
            } else {
                showLockScreenPassword();
            }
        } catch(e) { console.error('handleLockScreenTap error:', e); }
    }
    function hideLockScreen() {
        try {
            var overlay = document.getElementById('lockScreenOverlay');
            if (overlay) overlay.classList.remove('active');
            if (_lockScreenTimer) { clearInterval(_lockScreenTimer); _lockScreenTimer = null; }
            // 首次解锁后标记完成并保存
            if (appData.lockScreen && !appData.lockScreen.firstLaunchDone) {
                appData.lockScreen.firstLaunchDone = true;
                if (typeof saveData === 'function') saveData();
            }
        } catch(e) { console.error('hideLockScreen error:', e); }
    }
    function updateLockScreenTime() {
        try {
            // 北京时间 (UTC+8)
            var now = new Date();
            var utc = now.getTime() + now.getTimezoneOffset() * 60000;
            var beijing = new Date(utc + 8 * 3600000);
            var h = String(beijing.getHours()).padStart(2, '0');
            var m = String(beijing.getMinutes()).padStart(2, '0');
            var timeEl = document.getElementById('lockScreenTime');
            var dateEl = document.getElementById('lockScreenDate');
            var lunarEl = document.getElementById('lockScreenLunarDate');
            if (timeEl) timeEl.textContent = h + ':' + m;
            if (dateEl) {
                var month = beijing.getMonth() + 1;
                var day = beijing.getDate();
                var weekdays = ['周日','周一','周二','周三','周四','周五','周六'];
                var wday = weekdays[beijing.getDay()];
                dateEl.textContent = month + '月' + day + '日 ' + wday;
            }
            if (lunarEl) {
                try {
                    var lunar = _solarToLunar(beijing);
                    lunarEl.textContent = lunar.ganZhi + '年' + lunar.monthName + lunar.dayName;
                } catch(le) { lunarEl.textContent = ''; }
            }
        } catch(e) { console.error('updateLockScreenTime error:', e); }
    }
    function lockScreenInput(digit) {
        try {
            var ls = appData.lockScreen || {};
            var pwdLen = (ls.password || '').length || 6;
            if (_lockScreenPwdInput.length >= pwdLen) return;
            _lockScreenPwdInput += digit;
            updateLockScreenDots();
            if (_lockScreenPwdInput.length >= pwdLen) {
                setTimeout(function() {
                    var ls = appData.lockScreen || {};
                    if (_lockScreenPwdInput === ls.password) {
                        hideLockScreen();
                    } else {
                        var errEl = document.getElementById('lockScreenError');
                        var dotsEl = document.getElementById('lockScreenDots');
                        if (errEl) {
                            errEl.textContent = '密码错误，请重试';
                            errEl.style.display = '';
                            errEl.style.color = '';
                            errEl.classList.add('show');
                        }
                        if (dotsEl) dotsEl.classList.add('lock-screen-shake');
                        if (_lockScreenErrTimer) clearTimeout(_lockScreenErrTimer);
                        _lockScreenErrTimer = setTimeout(function() {
                            _lockScreenPwdInput = '';
                            updateLockScreenDots();
                            if (errEl) errEl.classList.remove('show');
                            if (dotsEl) dotsEl.classList.remove('lock-screen-shake');
                            _lockScreenErrTimer = null;
                        }, 600);
                    }
                }, 150);
            }
        } catch(e) { console.error('lockScreenInput error:', e); }
    }
    function lockScreenDelete() {
        try {
            _lockScreenPwdInput = _lockScreenPwdInput.slice(0, -1);
            updateLockScreenDots();
        } catch(e) { console.error('lockScreenDelete error:', e); }
    }
    function updateLockScreenDots() {
        try {
            var dots = document.querySelectorAll('#lockScreenDots .lock-screen-dot');
            for (var i = 0; i < dots.length; i++) {
                if (i < _lockScreenPwdInput.length) {
                    dots[i].classList.add('filled');
                } else {
                    dots[i].classList.remove('filled');
                }
            }
        } catch(e) { console.error('updateLockScreenDots error:', e); }
    }
    function unlockScreen() {
        hideLockScreen();
    }
    // 锁屏设置函数
    function toggleLockScreen() {
        try {
            if (!appData.lockScreen) appData.lockScreen = {};
            appData.lockScreen.enabled = document.getElementById('lockScreenToggle').checked;
            saveData();
            if (appData.lockScreen.enabled) {
                showLockScreen();
            } else {
                hideLockScreen();
            }
        } catch(e) { console.error('toggleLockScreen error:', e); }
    }
    function toggleLockScreenPassword() {
        try {
            if (!appData.lockScreen) appData.lockScreen = {};
            appData.lockScreen.passwordEnabled = document.getElementById('lockScreenPasswordToggle').checked;
            saveData();
            // 如果锁屏当前是显示状态，更新显示
            var overlay = document.getElementById('lockScreenOverlay');
            if (overlay && overlay.classList.contains('active')) {
                showLockScreen();
            }
        } catch(e) { console.error('toggleLockScreenPassword error:', e); }
    }
    function changeLockScreenPassword() {
        document.getElementById('lockScreenPasswordChangeArea').style.display = 'block';
        document.getElementById('lockScreenOldPwd').value = '';
        document.getElementById('lockScreenNewPwd').value = '';
        document.getElementById('lockScreenConfirmPwd').value = '';
        document.getElementById('lockPwdChangeMsg').textContent = '';
        document.getElementById('lockPwdChangeMsg').style.color = '#999';
    }
    function cancelChangeLockPassword() {
        document.getElementById('lockScreenPasswordChangeArea').style.display = 'none';
    }
    function confirmChangeLockPassword() {
        try {
            var oldPwd = document.getElementById('lockScreenOldPwd').value;
            var newPwd = document.getElementById('lockScreenNewPwd').value;
            var confirmPwd = document.getElementById('lockScreenConfirmPwd').value;
            var msgEl = document.getElementById('lockPwdChangeMsg');
            if (!appData.lockScreen) appData.lockScreen = {};
            if (oldPwd !== appData.lockScreen.password) {
                msgEl.textContent = '旧密码不正确';
                msgEl.style.color = '#e8483f';
                return;
            }
            if (!newPwd || newPwd.length < 4) {
                msgEl.textContent = '新密码至少4位';
                msgEl.style.color = '#e8483f';
                return;
            }
            if (newPwd !== confirmPwd) {
                msgEl.textContent = '两次密码不一致';
                msgEl.style.color = '#e8483f';
                return;
            }
            appData.lockScreen.password = newPwd;
            saveData();
            msgEl.textContent = '密码修改成功';
            msgEl.style.color = '#4a90d9';
            setTimeout(function() {
                document.getElementById('lockScreenPasswordChangeArea').style.display = 'none';
            }, 1500);
        } catch(e) { console.error('confirmChangeLockPassword error:', e); }
    }
    function uploadLockWallpaper() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(e) {
            try {
                var file = e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function(ev) {
                    if (!appData.lockScreen) appData.lockScreen = {};
                    appData.lockScreen.wallpaper = ev.target.result;
                    saveData();
                    applyLockScreenStyles();
                    var overlay = document.getElementById('lockScreenOverlay');
                    if (overlay && overlay.classList.contains('active')) {
                        showLockScreen();
                    }
                };
                reader.readAsDataURL(file);
            } catch(e) { console.error('uploadLockWallpaper error:', e); }
        };
        input.click();
    }
    function resetLockWallpaper() {
        try {
            if (!appData.lockScreen) appData.lockScreen = {};
            appData.lockScreen.wallpaper = '';
            saveData();
            applyLockScreenStyles();
            var overlay = document.getElementById('lockScreenOverlay');
            if (overlay && overlay.classList.contains('active')) {
                showLockScreen();
            }
        } catch(e) { console.error('resetLockWallpaper error:', e); }
    }
    function updateLockTextColor(color) {
        try {
            if (!appData.lockScreen) appData.lockScreen = {};
            appData.lockScreen.textColor = color;
            saveData();
            markCustomColor(document.getElementById('lockScreenOverlay'));
            applyLockScreenStyles();
        } catch(e) { console.error('updateLockTextColor error:', e); }
    }
    function resetLockTextColor() {
        try {
            if (!appData.lockScreen) appData.lockScreen = {};
            appData.lockScreen.textColor = '#ffffff';
            saveData();
            document.getElementById('lockTextColorPicker').value = '#ffffff';
            applyLockScreenStyles();
        } catch(e) { console.error('resetLockTextColor error:', e); }
    }


    // ===== 消息通知 =====
    function toggleNotification() {
        const enabled = document.getElementById('notificationToggle').checked;
        appData.globalSettings.notificationEnabled = enabled;
        saveData();
        if (enabled) {
            // 显示测试区域
            document.getElementById('notifTestArea').style.display = 'block';
            // 请求浏览器通知权限
            if ('Notification' in window) {
                if (Notification.permission === 'default') {
                    Notification.requestPermission().then(function(permission) {
                        updateNotifPermissionStatus();
                        if (permission !== 'granted') {
                            var statusEl = document.getElementById('notifPermissionStatus');
                            if (statusEl) statusEl.innerHTML = '<span style="color:#e74c3c;">通知权限被拒绝。请点击浏览器地址栏左侧的锁图标，将通知改为"允许"后重试</span>';
                        }
                    });
                } else {
                    updateNotifPermissionStatus();
                }
            } else {
                var statusEl = document.getElementById('notifPermissionStatus');
                if (statusEl) statusEl.textContent = '当前浏览器不支持系统通知，仅站内弹窗可用';
            }
        } else {
            document.getElementById('notifTestArea').style.display = 'none';
        }
    }
    // 更新通知权限状态显示
    function updateNotifPermissionStatus() {
        var statusEl = document.getElementById('notifPermissionStatus');
        if (!statusEl) return;
        if (!('Notification' in window)) {
            statusEl.textContent = '当前浏览器不支持系统通知';
            return;
        }
        if (Notification.permission === 'granted') {
            statusEl.innerHTML = '<span style="color:#27ae60;">✓ 通知权限已开启，离开网站后也能收到通知</span>';
        } else if (Notification.permission === 'denied') {
            statusEl.innerHTML = '<span style="color:#e74c3c;">通知权限被拒绝。请点击浏览器地址栏左侧图标，将通知改为"允许"</span>';
        } else {
            statusEl.innerHTML = '<span style="color:#f39c12;">点击"测试消息通知"来请求权限</span>';
        }
    }
    // 测试消息通知
    function testNotification() {
        if (!('Notification' in window)) {
            alert('当前浏览器不支持系统通知');
            return;
        }
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(function(permission) {
                updateNotifPermissionStatus();
                if (permission === 'granted') {
                    _doTestNotification();
                } else {
                    alert('通知权限被拒绝。请点击浏览器地址栏左侧的锁图标，将通知改为"允许"后重试');
                }
            });
        } else if (Notification.permission === 'granted') {
            _doTestNotification();
        } else {
            alert('通知权限被拒绝。请点击浏览器地址栏左侧的锁图标，将通知改为"允许"后重试');
        }
    }
    function _doTestNotification() {
        var name = appData.chatSettings.otherNickname || '对方';
        var now = new Date();
        var h = now.getHours();
        var m = now.getMinutes().toString().padStart(2, '0');
        var timeStr = (h < 10 ? '0' + h : h) + ':' + m;
        var title = name;
        var body = '这是一条测试通知消息 ' + timeStr;
        // 优先通过 SW 发送（可在页面关闭时工作）
        if (_swReady && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'NOTIFY',
                title: title,
                body: body,
                tag: 'qianyi-test'
            });
        } else if ('Notification' in window && Notification.permission === 'granted') {
            var n = new Notification(title, {
                body: body,
                tag: 'qianyi-test',
                icon: './icon-192.png',
                badge: './icon-192.png',
                silent: false,
                vibrate: [200, 100, 200]
            });
            n.onclick = function() {
                window.focus();
                n.close();
            };
            setTimeout(function() { n.close(); }, 10000);
        }
        // 同时显示站内弹窗
        showChatNotification({
            id: 'test-' + Date.now(),
            sender: 'other',
            type: 'text',
            content: '这是一条测试通知消息'
        });
    }

    // ===== 后台保活 =====
    // 静音音频保活：通过循环播放静音音频防止浏览器暂停页面
    var _silentAudio = null;
    var _audioKeepAliveStarted = false; // 仅在音频真正播放/running 时才为 true
    var _keepAliveRetryBound = false;
    // 极短的静音 wav 数据 URI，避免依赖外部 silent.wav 文件缺失导致 play 失败
    var _SILENT_WAV_URI = './silent.mp3'; // 15秒静音音频文件，循环播放保活
    function startSilentAudioKeepAlive() {
        // 若已启动且确实在运行，只是从后台切回时确保它恢复运行
        if (_audioKeepAliveStarted) {
            if (_silentAudio) {
                if (_silentAudio._ctx) {
                    if (_silentAudio._ctx.state === 'suspended') {
                        _silentAudio._ctx.resume().catch(function(){});
                    }
                } else if (_silentAudio.paused) {
                    _silentAudio.play().catch(function(){});
                }
            }
            return;
        }
        // 先尝试 HTML Audio（在用户手势 onclick 上下文中调用时成功率最高）
        try {
            var audio = new Audio(_SILENT_WAV_URI);
            audio.loop = true;
            audio.volume = 0.001; // 极低音量（0会被某些浏览器视为静音而不保活）
            var playPromise = audio.play();
            if (playPromise && typeof playPromise.then === 'function') {
                playPromise.then(function() {
                    _silentAudio = audio;
                    _audioKeepAliveStarted = true; // 仅在播放真正成功后才置标志
                    console.log('[保活] 静音音频已启动(HTML Audio)');
                }).catch(function(err) {
                    console.warn('[保活] HTML Audio 播放失败，尝试 Web Audio API:', err);
                    // 不设置 _audioKeepAliveStarted，让重试机制可以工作
                    _tryWebAudioKeepAlive();
                    // 绑定重试：下次用户交互时再试
                    _bindKeepAliveRetry();
                });
            } else {
                _silentAudio = audio;
                _audioKeepAliveStarted = true;
            }
        } catch(e) {
            console.error('[保活] HTML Audio 初始化失败:', e);
            _tryWebAudioKeepAlive();
            _bindKeepAliveRetry();
        }
    }
    // Web Audio API 备选保活方案
    function _tryWebAudioKeepAlive() {
        try {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();
            var gain = ctx.createGain();
            gain.gain.value = 0.001; // 极低音量，避免完全静音被浏览器忽略
            gain.connect(ctx.destination);
            var osc = ctx.createOscillator();
            osc.frequency.value = 1; // 1Hz 极低频率
            osc.connect(gain);
            osc.start();
            _silentAudio = { _ctx: ctx, _osc: osc, _gain: gain };
            // 关键修复：仅在 context 真正 running 时才标记已启动
            // suspended 状态下音频并未实际播放，不能设置标志，否则重试机制失效
            if (ctx.state === 'running') {
                _audioKeepAliveStarted = true;
                console.log('[保活] Web Audio API 保活已启动(running)');
            } else {
                // context 处于 suspended，需要用户手势才能 resume
                console.warn('[保活] Web Audio context 处于 ' + ctx.state + '，等待用户交互后 resume');
                ctx.resume().then(function() {
                    if (ctx.state === 'running') {
                        _audioKeepAliveStarted = true;
                        console.log('[保活] Web Audio context 已恢复(running)');
                    }
                }).catch(function(){});
            }
        } catch(e) {
            console.error('[保活] Web Audio API 也失败:', e);
        }
    }
    // 绑定一次性用户手势重试：autoplay 被阻止时，下次用户点击/触摸即重试播放
    function _bindKeepAliveRetry() {
        if (_keepAliveRetryBound) return;
        _keepAliveRetryBound = true;
        var retry = function() {
            _keepAliveRetryBound = false;
            // 无论 _audioKeepAliveStarted 状态如何，只要没真正running就重试
            if (!_audioKeepAliveStarted) {
                // 先清理可能存在的 suspended context
                if (_silentAudio && _silentAudio._ctx) {
                    try { _silentAudio._ctx.close(); } catch(e){}
                    _silentAudio = null;
                }
                startSilentAudioKeepAlive();
            } else if (_silentAudio && _silentAudio._ctx && _silentAudio._ctx.state === 'suspended') {
                // 已标记启动但 context 挂起了，尝试 resume
                _silentAudio._ctx.resume().catch(function(){});
            }
        };
        document.addEventListener('click', retry, { once: true });
        document.addEventListener('touchend', retry, { once: true, passive: true });
    }
    // 全局用户交互监听：只要开启了保活且音频未运行，任意点击都尝试启动
    // 这是一个持续生效的监听器（非 once），确保即使用户错过了第一次重试也能后续启动
    document.addEventListener('click', function() {
        if (appData.globalSettings && appData.globalSettings.keepAliveEnabled && !_audioKeepAliveStarted) {
            startSilentAudioKeepAlive();
        } else if (_silentAudio && _silentAudio._ctx && _silentAudio._ctx.state === 'suspended') {
            _silentAudio._ctx.resume().catch(function(){});
        }
    }, true);
    function stopSilentAudioKeepAlive() {
        if (_silentAudio) {
            if (_silentAudio._ctx) {
                // Web Audio API 方式
                try { _silentAudio._osc.stop(); } catch(e){}
                try { _silentAudio._ctx.close(); } catch(e){}
            } else {
                // HTML Audio 方式
                _silentAudio.pause();
                _silentAudio.src = '';
            }
            _silentAudio = null;
        }
        _audioKeepAliveStarted = false;
    }
    function toggleKeepAlive() {
        appData.globalSettings.keepAliveEnabled = document.getElementById('keepAliveToggle').checked;
        saveData();
        if (appData.globalSettings.keepAliveEnabled) {
            // 开启时：立即启动静音音频保活（此时在 onclick 用户手势上下文中，成功率最高）
            startSilentAudioKeepAlive();
            requestWakeLock();
        } else {
            // 关闭时：停止静音音频，释放Wake Lock，重置离开时间
            stopSilentAudioKeepAlive();
            if (_wakeLock) {
                _wakeLock.release().catch(function(){});
                _wakeLock = null;
            }
            _lastLeaveTime = null;
        }
    }
    var _notifTimer = null;
    var _notifContactId = null; // 存储通知对应的联系人 ID，用于点击通知时恢复正确的聊天上下文
    function showChatNotification(msg) {
        // 仅在通知开关开启且不在聊天界面时显示
        if (!appData.globalSettings.notificationEnabled) return;
        if (document.getElementById('chatPage').style.display === 'flex') return;
        // 优先使用消息上记录的联系人 ID，其次使用当前活跃联系人 ID，最后使用最后聊天的联系人 ID
        _notifContactId = (msg && msg.contactId) || _activeContactId || _lastChatContactId || null;
        
        const notifEl = document.getElementById('chatNotification');
        /* Bug7修复：将 contactId 存储到通知元素上，避免后续消息覆盖全局变量导致点错聊天 */
        notifEl.dataset.contactId = _notifContactId || '';
        const senderName = document.getElementById('notifSenderName');
        const content = document.getElementById('notifContent');
        const avatarImg = document.getElementById('notifAvatarImg');
        const avatarFallback = document.getElementById('notifAvatarFallback');
        const notifTime = document.getElementById('notifTime');
        
        const name = appData.chatSettings.otherNickname || '对方';
        senderName.textContent = name;
        
        // 设置头像
        const avatar = appData.chatSettings.otherAvatar;
        if (avatar) {
            avatarImg.src = avatar;
            avatarImg.style.display = 'block';
            avatarFallback.style.display = 'none';
        } else {
            avatarImg.style.display = 'none';
            avatarFallback.textContent = name.charAt(0);
            avatarFallback.style.display = 'block';
        }
        
        // 设置时间
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes().toString().padStart(2, '0');
        notifTime.textContent = (h < 10 ? '0' + h : h) + ':' + m;
        
        // 暗色模式适配
        if (document.documentElement.classList.contains('dark-mode')) {
            notifEl.style.background = 'rgba(45,45,45,0.97)';
            senderName.style.color = '#ffffff';
            notifTime.style.color = '#999999';
            content.style.color = '#cccccc';
            document.getElementById('notifAvatar').style.background = '#555';
        } else {
            notifEl.style.background = 'rgba(245,245,245,0.97)';
            senderName.style.color = '#1a1a1a';
            notifTime.style.color = '#999999';
            content.style.color = '#666666';
            document.getElementById('notifAvatar').style.background = '#4a4a4a';
        }
        
        if (msg.type === 'emoji') {
            content.textContent = '[表情包]';
        } else if (msg.type === 'image') {
            content.textContent = '[图片]';
        } else if (msg.type === 'transfer') {
            content.textContent = '微信转账 ¥' + msg.amount;
        } else if (msg.type === 'blindCard') {
            content.textContent = '[盲选抽牌] ' + msg.question;
        } else if (msg.type === 'shopShareCard') {
            content.textContent = '[购物卡片] ' + (msg.title || '');
        } else {
            content.textContent = msg.content || '[消息]';
        }
        
        // 显示弹窗 - 从顶部滑入
        notifEl.style.transform = 'translateY(-120%)';
        notifEl.style.opacity = '1';
        notifEl.style.pointerEvents = 'auto';
        // 触发 reflow 后滑入
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                notifEl.style.transform = 'translateY(0)';
            });
        });
        
        // 3秒后自动隐藏
        if (_notifTimer) clearTimeout(_notifTimer);
        _notifTimer = setTimeout(() => {
            notifEl.style.transform = 'translateY(-120%)';
            notifEl.style.opacity = '0';
            notifEl.style.pointerEvents = 'none';
        }, 3000);
    }
    function openChatFromNotification() {
        if (_notifTimer) clearTimeout(_notifTimer);
        const notifEl = document.getElementById('chatNotification');
        notifEl.style.transform = 'translateY(-120%)';
        notifEl.style.opacity = '0';
        notifEl.style.pointerEvents = 'none';
        // 从通知直接进入聊天页（跳过联系人列表）
        try {
            refreshCustomIcons();
            // Bug7修复：优先使用通知元素上存储的 contactId，避免全局变量被后续消息覆盖
            var targetContactId = (notifEl.dataset && notifEl.dataset.contactId) || _notifContactId || _lastChatContactId;
            if (targetContactId && _findContactById(targetContactId)) {
                _activeContactId = targetContactId;
                var c = _findContactById(targetContactId);
                if (c) {
                    appData.chatSettings.otherAvatar = c.avatar || '';
                    appData.chatSettings.otherNickname = c.name || '对方';
                }
            } else {
                _activeContactId = null;
            }
            _notifContactId = null; // 清除通知联系人 ID
            document.getElementById('chatPage').style.display = 'flex';
            initChatPage();
            // 覆盖聊天标题为联系人自身名称，但保留"正在输入中"状态
            if (_activeContactId && !isTyping) {
                var c2 = _findContactById(_activeContactId);
                if (c2 && c2.name) {
                    var titleEl = document.getElementById('chatTitle');
                    if (titleEl) titleEl.textContent = c2.name;
                }
            }
            var container = document.getElementById('chatMessages');
            if (container) { container.innerHTML = ''; container._expandedBatches = 0; container._renderedCount = 0; }
            renderMessages();
            scrollToBottom();
            var hist = appData.chatHistory;
            if (hist && hist.length > 0) {
                _lastSeenMsgTime = hist[hist.length - 1].id || Date.now();
            } else {
                _lastSeenMsgTime = Date.now();
            }
        } catch(e) { console.error('openChatFromNotification失败:', e); }
    }
    function uploadGlobalWallpaper() {
        currentEditType = 'globalDesktopWallpaper';
        document.getElementById('fileInput').click();
    }
    function applyDesktopWallpaper(){
        const wp = appData.globalSettings.chatWallpaper || '';
        const layer = document.getElementById('desktopWallpaperLayer');
        if (layer) {
            const panels = layer.querySelectorAll('.wp-panel');
            panels.forEach(p => {
                if (wp) {
                    p.style.backgroundImage = 'url(' + wp + ')';
                } else {
                    p.style.backgroundImage = '';
                }
            });
        }
        // 确保 desktop-page 背景透明
        document.querySelectorAll('.desktop-page').forEach(p => {
            p.style.backgroundImage = '';
            p.style.background = 'transparent';
        });
    }
    function resetGlobalWallpaper() {
        appData.globalSettings.chatWallpaper = '';
        document.getElementById('globalWallpaperPreview').style.display = 'none';
        saveData();
        applyDesktopWallpaper();
    }
    // 备份功能
    async function exportAllData(evt) {
        var btn = evt && evt.target;
        if (btn) { var origText = btn.textContent; btn.textContent = '正在备份...'; btn.disabled = true; }
        const exportObj = {};
        saveDataSync();
        // 序列化前强制切换到主聊天上下文
        var _savedActiveId = _activeContactId;
        _activeContactId = null;
        try {
            // 收集选中的导出项
            var checkboxes = document.querySelectorAll('.export-checkbox');
            var selectedKeys = {};
            var hasUnchecked = false;
            checkboxes.forEach(function(cb) {
                if (cb.checked) {
                    selectedKeys[cb.dataset.key] = true;
                } else {
                    hasUnchecked = true;
                }
            });
            // 始终导出完整 appData，确保无遗漏
            var fullData = JSON.parse(JSON.stringify(appData));
            if (hasUnchecked) {
                // 仅移除用户明确取消勾选的大数据块
                var keyMap = {
                    chatSettings: 'chatSettings',
                    emojis: 'emojis',
                    wordCards: 'wordCards',
                    chatHistory: 'chatHistory',
                    diary: 'diary',
                    letter: 'letter',
                    moments: 'moments',
                    specialCards: 'specialCards',
                    globalSettings: 'globalSettings',
                    shopData: 'shopData',
                    balanceData: 'balanceData',
                    songwriteData: 'songwriteData',
                    contactList: 'contactList',
                    ltData: 'ltData',
                    tarotData: 'tarotData'
                };
                Object.keys(keyMap).forEach(function(key) {
                    if (!selectedKeys[key]) {
                        var appKey = keyMap[key] || key;
                        if (fullData[appKey] !== undefined) {
                            delete fullData[appKey];
                        }
                    }
                });
            }
            exportObj.full = fullData;
        } finally {
            _activeContactId = _savedActiveId;
        }

        // 收集 IndexedDB 中的独立图片数据（拍立得、学生证、圆形头像等）
        try {
            if (window.exportImgDB) {
                const imgData = await window.exportImgDB();
                if (imgData && Object.keys(imgData).length > 0) {
                    exportObj.indexedDBImages = imgData;
                }
            }
        } catch(e) { console.warn('IndexedDB 图片导出失败:', e); }

        // 收集一起听歌 app 的独立 localStorage 数据（lt_ 开头的 key）
        try {
            var _includeLT = !hasUnchecked || (selectedKeys && selectedKeys.ltData);
            if (_includeLT) {
                var ltDataCollected = {};
                var _idbKeys = exportObj.indexedDBImages || {};
                for (var _li = 0; _li < localStorage.length; _li++) {
                    var _lk = localStorage.key(_li);
                    if (_lk && _lk.indexOf('lt_') === 0 && !_idbKeys[_lk]) {
                        ltDataCollected[_lk] = localStorage.getItem(_lk);
                    }
                }
                if (Object.keys(ltDataCollected).length > 0) {
                    exportObj.ltData = ltDataCollected;
                }
            }
        } catch(e) { console.warn('听歌数据导出失败:', e); }

        // 收集塔罗 app 的独立 localStorage 数据
        try {
            var _includeTarot = !hasUnchecked || (selectedKeys && selectedKeys.tarotData);
            if (_includeTarot) {
                var _tarotHistory = localStorage.getItem('tarot_history_v1');
                if (_tarotHistory) {
                    exportObj.tarotData = { 'tarot_history_v1': _tarotHistory };
                }
            }
        } catch(e) { console.warn('塔罗数据导出失败:', e); }

        const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'BelovedTime_备份_' + new Date().toISOString().slice(0,10) + '.json';
        a.click();
        URL.revokeObjectURL(url);
        if (btn) { btn.textContent = origText; btn.disabled = false; }
    }
    function exportChatOnly() {
        const blob = new Blob([JSON.stringify(appData.chatHistory, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '聊天记录_' + new Date().toISOString().slice(0,10) + '.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    function exportWordCardsOnly() {
        const blob = new Blob([JSON.stringify({wordCards: appData.wordCards, specialCards: appData.specialCards, wordGroups: appData.wordGroups, currentGroup: appData.currentGroup, contactWordCards: appData.contactWordCards || {}}, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '字卡备份_' + new Date().toISOString().slice(0,10) + '.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    function importData(type) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async function(ev) {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (type === 'full') {
                        function importMergeDeep(target, source) {
                            for (const key in source) {
                                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                                    if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
                                        target[key] = importMergeDeep(target[key], source[key]);
                                    } else {
                                        target[key] = JSON.parse(JSON.stringify(source[key]));
                                    }
                                } else {
                                    target[key] = JSON.parse(JSON.stringify(source[key]));
                                }
                            }
                            return target;
                        }
                        // 读取导入选择：未勾选任何项时恢复全部
                        var importCheckboxes = document.querySelectorAll('.import-checkbox');
                        var selectedKeys = {};
                        var hasSelection = false;
                        importCheckboxes.forEach(function(cb) {
                            if (cb.checked) {
                                selectedKeys[cb.dataset.key] = true;
                                hasSelection = true;
                            }
                        });

                        var srcData = data.full || data;
                        var filteredData = {};
                        if (!hasSelection) {
                            // 未选择：导入全部
                            Object.keys(srcData).forEach(function(k) { filteredData[k] = srcData[k]; });
                        } else {
                            // 按勾选项目过滤
                            var keyMap = {
                                chatSettings: 'chatSettings',
                                emojis: 'emojis',
                                wordCards: 'wordCards',
                                chatHistory: 'chatHistory',
                                diary: 'diary',
                                letter: 'letter',
                                moments: 'moments',
                                specialCards: 'specialCards',
                                globalSettings: 'globalSettings',
                                shopData: 'shopData',
                                balanceData: 'balanceData',
                                songwriteData: 'songwriteData',
                                contactList: 'contactList',
                                ltData: 'ltData',
                                tarotData: 'tarotData'
                            };
                            Object.keys(selectedKeys).forEach(function(key) {
                                var appKey = keyMap[key] || key;
                                if (srcData[appKey] !== undefined) {
                                    filteredData[appKey] = srcData[appKey];
                                }
                            });
                            // 聊天记录需要联系人列表结构
                            if (selectedKeys.chatHistory && srcData.contactList !== undefined) {
                                filteredData.contactList = srcData.contactList;
                            }
                            // 字卡需要分组信息
                            if (selectedKeys.wordCards) {
                                if (srcData.contactWordCards !== undefined) filteredData.contactWordCards = srcData.contactWordCards;
                                if (srcData.wordGroups !== undefined) filteredData.wordGroups = srcData.wordGroups;
                                if (srcData.currentGroup !== undefined) filteredData.currentGroup = srcData.currentGroup;
                            }
                            // 懒初始化字段：即使用户没勾选，也尝试从备份恢复（如果备份里有）
                            ['shopData', 'balanceData', 'songwriteData'].forEach(function(k) {
                                if (srcData[k] !== undefined && filteredData[k] === undefined) {
                                    filteredData[k] = srcData[k];
                                }
                            });
                        }

                        if (Object.keys(filteredData).length > 0) {
                            importMergeDeep(appData, filteredData);
                        }
                        saveDataSync(); // 立即同步保存到 IndexedDB，确保刷新前数据已写入
                        // 恢复 IndexedDB 图片数据
                        if (data.indexedDBImages && window.importImgDB) {
                            try { await window.importImgDB(data.indexedDBImages); } catch(e) {}
                        }
                        // 恢复一起听歌 app 的独立 localStorage 数据
                        if (data.ltData) {
                            var _restoreLT = !hasSelection || (selectedKeys && selectedKeys.ltData);
                            if (_restoreLT) {
                                try {
                                    Object.keys(data.ltData).forEach(function(k) {
                                        try { localStorage.setItem(k, data.ltData[k]); } catch(e) {}
                                    });
                                } catch(e) {}
                            }
                        }
                        // 恢复塔罗 app 的独立 localStorage 数据
                        if (data.tarotData) {
                            var _restoreTarot = !hasSelection || (selectedKeys && selectedKeys.tarotData);
                            if (_restoreTarot) {
                                try {
                                    Object.keys(data.tarotData).forEach(function(k) {
                                        try { localStorage.setItem(k, data.tarotData[k]); } catch(e) {}
                                    });
                                } catch(e) {}
                            }
                        }
                        alert('导入成功，即将刷新页面');
                        setTimeout(() => location.reload(), 500);
                    } else if (type === 'chat') {
                        if (Array.isArray(data)) {
                            appData.chatHistory = data;
                        } else if (data.chatHistory) {
                            appData.chatHistory = data.chatHistory;
                        }
                        saveData();
                        alert('聊天记录导入成功');
                        renderMessages();
                    } else if (type === 'wordcards') {
                        if (!appData.wordCards) appData.wordCards = { default: [] };
                        if (!Array.isArray(appData.wordGroups)) appData.wordGroups = ['default'];
                        if (!appData.specialCards) appData.specialCards = { nudge: [], emoji: [], kaomoji: [], image: [], video: [] };
                        // 导入分组定义，确保自定义分组能在界面中显示
                        if (Array.isArray(data.wordGroups)) {
                            data.wordGroups.forEach(g => {
                                if (g && !appData.wordGroups.includes(g)) appData.wordGroups.push(g);
                            });
                        }
                        if (data.wordCards) {
                            Object.keys(data.wordCards).forEach(group => {
                                if (!appData.wordCards[group]) appData.wordCards[group] = [];
                                // 同步将该分组加入分组列表，否则分组内字卡无法显示
                                if (!appData.wordGroups.includes(group)) appData.wordGroups.push(group);
                                const list = data.wordCards[group];
                                if (Array.isArray(list)) {
                                    list.forEach(card => {
                                        if (!appData.wordCards[group].find(c => c.text === card.text)) {
                                            appData.wordCards[group].push(card);
                                        }
                                    });
                                }
                            });
                        }
                        if (data.specialCards) {
                            Object.keys(data.specialCards).forEach(sType => {
                                if (Array.isArray(data.specialCards[sType])) {
                                    // 防止特殊字卡类型缺失导致 find 崩溃、导入中断
                                    if (!appData.specialCards[sType]) appData.specialCards[sType] = [];
                                    data.specialCards[sType].forEach(card => {
                                        if (typeof card === 'string') {
                                            if (!appData.specialCards[sType].find(c => c.text === card)) {
                                                appData.specialCards[sType].push({text: card, hidden: false});
                                            }
                                        } else if (!appData.specialCards[sType].find(c => c.text === card.text)) {
                                            appData.specialCards[sType].push(card);
                                        }
                                    });
                                }
                            });
                        }
                        // 跳转到备份时的分组，便于立即看到导入的字卡
                        if (data.currentGroup && appData.wordGroups.includes(data.currentGroup)) {
                            appData.currentGroup = data.currentGroup;
                        }
                        // 导入联系人专属字卡
                        if (data.contactWordCards && typeof data.contactWordCards === 'object') {
                            if (!appData.contactWordCards) appData.contactWordCards = {};
                            Object.keys(data.contactWordCards).forEach(function(cid) {
                                if (!appData.contactWordCards[cid]) {
                                    appData.contactWordCards[cid] = data.contactWordCards[cid];
                                } else {
                                    // 合并：按分组去重
                                    var src = data.contactWordCards[cid];
                                    if (src && src.cards) {
                                        if (!appData.contactWordCards[cid].cards) appData.contactWordCards[cid].cards = {};
                                        Object.keys(src.cards).forEach(function(grp) {
                                            if (!appData.contactWordCards[cid].cards[grp]) appData.contactWordCards[cid].cards[grp] = [];
                                            src.cards[grp].forEach(function(card) {
                                                if (!appData.contactWordCards[cid].cards[grp].find(c => c.text === card.text)) {
                                                    appData.contactWordCards[cid].cards[grp].push(card);
                                                }
                                            });
                                        });
                                    }
                                    if (src && Array.isArray(src.groups)) {
                                        src.groups.forEach(function(g) {
                                            if (!appData.contactWordCards[cid].groups.includes(g)) appData.contactWordCards[cid].groups.push(g);
                                        });
                                    }
                                }
                            });
                        }
                        saveData();
                        alert('字卡导入成功');
                        if (typeof renderWordGroups === 'function') renderWordGroups();
                        renderWordCardList();
                    }
                } catch (err) {
                    alert('文件格式错误');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    function compressStoredImages() {
        let compressed = 0;
        const canvas = document.createElement('canvas');
        const processImage = (dataUrl, maxW, maxH, quality) => {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width, h = img.height;
                    if (w > maxW) { h = h * maxW / w; w = maxW; }
                    if (h > maxH) { w = w * maxH / h; h = maxH; }
                    canvas.width = Math.max(1, Math.round(w));
                    canvas.height = Math.max(1, Math.round(h));
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.src = dataUrl;
            });
        };
        const processAll = async () => {
            // 压缩聊天壁纸
            if (appData.chatSettings && appData.chatSettings.chatWallpaper && appData.chatSettings.chatWallpaper.length > 50000) {
                appData.chatSettings.chatWallpaper = await processImage(appData.chatSettings.chatWallpaper, 1080, 1920, 0.7);
                compressed++;
            }
            // 压缩聊天头像
            ['otherAvatar', 'myAvatar'].forEach(k => {
                if (appData.chatSettings && appData.chatSettings[k] && appData.chatSettings[k].length > 30000) {
                    processImage(appData.chatSettings[k], 200, 200, 0.8).then(r => { appData.chatSettings[k] = r; saveData(); });
                    compressed++;
                }
            });
            // 压缩app图标图片
            if (appData.appIconImages) {
                Object.keys(appData.appIconImages).forEach(k => {
                    if (appData.appIconImages[k] && appData.appIconImages[k].length > 30000) {
                        processImage(appData.appIconImages[k], 120, 120, 0.8).then(r => { appData.appIconImages[k] = r; saveData(); });
                        compressed++;
                    }
                });
            }
            // 压缩widget图片
            if (appData.widgetImages) {
                Object.keys(appData.widgetImages).forEach(k => {
                    if (appData.widgetImages[k] && appData.widgetImages[k].length > 50000) {
                        processImage(appData.widgetImages[k], 400, 400, 0.7).then(r => { appData.widgetImages[k] = r; saveData(); });
                        compressed++;
                    }
                });
            }
            saveData();
            setTimeout(() => alert(compressed > 0 ? '已压缩 ' + compressed + ' 张图片' : '没有需要压缩的图片'), 500);
        };
        processAll();
    }
    // 一键压缩所有图片（包括所有组图片：聊天记录图片、朋友圈图片、日记图片、信封图片、相册寄语图片等）
    function compressAllImages() {
        if (!confirm('将压缩所有应用中的图片，可能需要一些时间。继续？')) return;
        let compressed = 0;
        const canvas = document.createElement('canvas');
        const processImage = (dataUrl, maxW, maxH, quality) => {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width, h = img.height;
                    if (w > maxW) { h = h * maxW / w; w = maxW; }
                    if (h > maxH) { w = w * maxH / h; h = maxH; }
                    canvas.width = Math.max(1, Math.round(w));
                    canvas.height = Math.max(1, Math.round(h));
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = () => resolve(dataUrl);
                img.src = dataUrl;
            });
        };
        const isImageData = (s) => typeof s === 'string' && s.indexOf('data:image') === 0 && s.length > 20000;
        const processAll = async () => {
            // 聊天壁纸
            if (appData.chatSettings && isImageData(appData.chatSettings.chatWallpaper)) {
                appData.chatSettings.chatWallpaper = await processImage(appData.chatSettings.chatWallpaper, 1080, 1920, 0.7); compressed++;
            }
            // 聊天头像
            for (const k of ['otherAvatar','myAvatar']) {
                if (appData.chatSettings && isImageData(appData.chatSettings[k])) {
                    appData.chatSettings[k] = await processImage(appData.chatSettings[k], 200, 200, 0.8); compressed++;
                }
            }
            // 聊天记录中的图片
            if (appData.chatHistory) {
                for (const msg of appData.chatHistory) {
                    if (msg.type === 'image' && isImageData(msg.content)) {
                        msg.content = await processImage(msg.content, 1080, 1920, 0.7); compressed++;
                    }
                }
            }
            // app图标图片
            if (appData.appIconImages) {
                for (const k of Object.keys(appData.appIconImages)) {
                    if (isImageData(appData.appIconImages[k])) {
                        appData.appIconImages[k] = await processImage(appData.appIconImages[k], 120, 120, 0.8); compressed++;
                    }
                }
            }
            // widget图片
            if (appData.widgetImages) {
                for (const k of Object.keys(appData.widgetImages)) {
                    if (isImageData(appData.widgetImages[k])) {
                        appData.widgetImages[k] = await processImage(appData.widgetImages[k], 400, 400, 0.7); compressed++;
                    }
                }
            }
            // 朋友圈图片
            if (appData.moments && appData.moments.list) {
                for (const m of appData.moments.list) {
                    if (m.images && Array.isArray(m.images)) {
                        for (let i = 0; i < m.images.length; i++) {
                            if (isImageData(m.images[i])) {
                                m.images[i] = await processImage(m.images[i], 1080, 1080, 0.7); compressed++;
                            }
                        }
                    }
                    if (m.image && isImageData(m.image)) {
                        m.image = await processImage(m.image, 1080, 1080, 0.7); compressed++;
                    }
                }
            }
            // 朋友圈壁纸
            if (appData.moments && isImageData(appData.moments.wallpaper)) {
                appData.moments.wallpaper = await processImage(appData.moments.wallpaper, 1080, 1920, 0.7); compressed++;
            }
            // 日记背景图
            if (appData.diary && appData.diary.settings && isImageData(appData.diary.settings.bgImage)) {
                appData.diary.settings.bgImage = await processImage(appData.diary.settings.bgImage, 1080, 1920, 0.7); compressed++;
            }
            // 日记图片
            if (appData.diary) {
                for (const list of [appData.diary.singleList, appData.diary.doubleList]) {
                    if (list) for (const d of list) {
                        if (d.images && Array.isArray(d.images)) {
                            for (let i = 0; i < d.images.length; i++) {
                                if (isImageData(d.images[i])) { d.images[i] = await processImage(d.images[i], 1080, 1080, 0.7); compressed++; }
                            }
                        }
                    }
                }
            }
            // 信封背景图
            if (appData.letter && appData.letter.settings && isImageData(appData.letter.settings.bgImage)) {
                appData.letter.settings.bgImage = await processImage(appData.letter.settings.bgImage, 1080, 1920, 0.7); compressed++;
            }
            // 聊天顶底栏背景图
            if (appData.chatSettings && isImageData(appData.chatSettings.topBgImage)) { appData.chatSettings.topBgImage = await processImage(appData.chatSettings.topBgImage, 1080, 200, 0.7); compressed++; }
            if (appData.chatSettings && isImageData(appData.chatSettings.bottomBgImage)) { appData.chatSettings.bottomBgImage = await processImage(appData.chatSettings.bottomBgImage, 1080, 200, 0.7); compressed++; }
            // 全局壁纸
            if (appData.globalSettings && isImageData(appData.globalSettings.chatWallpaper)) { appData.globalSettings.chatWallpaper = await processImage(appData.globalSettings.chatWallpaper, 1080, 1920, 0.7); compressed++; }
            // 头像框
            if (appData.chatSettings) {
                for (const fk of ['otherFrames','myFrames']) {
                    const frames = appData.chatSettings[fk];
                    if (Array.isArray(frames)) {
                        for (let i = 0; i < frames.length; i++) {
                            const fd = frames[i];
                            const src = typeof fd === 'object' ? fd.src : fd;
                            if (isImageData(src)) {
                                const newSrc = await processImage(src, 200, 200, 0.8);
                                if (typeof fd === 'object') fd.src = newSrc; else frames[i] = newSrc;
                                compressed++;
                            }
                        }
                    }
                }
            }
            // 相册寄语照片
            if (appData.albumData && Array.isArray(appData.albumData.photos)) {
                for (let i = 0; i < appData.albumData.photos.length; i++) {
                    const p = appData.albumData.photos[i];
                    if (p.src && isImageData(p.src)) {
                        p.src = await processImage(p.src, 1080, 1080, 0.7); compressed++;
                    }
                }
            }
            saveData();
            if (document.getElementById('storagePage').style.display === 'flex') renderStorageList();
            setTimeout(() => alert(compressed > 0 ? '一键压缩完成！共压缩 ' + compressed + ' 张图片' : '没有需要压缩的图片'), 300);
        };
        processAll();
    }


    // ========== 美化APP ==========
    function openBeautifyApp() {
        document.getElementById('beautifyPage').style.display = 'flex';
        initBeautifyApp();
    }
    function closeBeautifyApp() {
        document.getElementById('beautifyPage').style.display = 'none';
    }
    function switchBeautifyTab(tab) {
        document.querySelectorAll('.beautify-main-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        document.getElementById('beautifyChat').style.display = tab === 'chat' ? 'block' : 'none';
        document.getElementById('beautifyBubble').style.display = tab === 'bubble' ? 'block' : 'none';
        document.getElementById('beautifyMoments').style.display = tab === 'moments' ? 'block' : 'none';
        if (tab === 'chat') loadBeautifyPresets('chatGlobal');
        if (tab === 'bubble') loadBeautifyPresets('bubble');
        if (tab === 'moments') loadBeautifyPresets('moments');
    }
    function initBeautifyApp() {
        switchBeautifyTab('chat');
    }
    function saveBeautifyPreset(type) {
        let cssText;
        let name;
        if (type === 'chatGlobal') {
            cssText = document.getElementById('beautifyChatCss').value;
            name = prompt('输入预设名称');
        } else if (type === 'bubble') {
            cssText = document.getElementById('beautifyBubbleCss').value;
            name = prompt('输入预设名称');
        } else if (type === 'moments') {
            cssText = document.getElementById('beautifyMomentsCss').value;
            name = prompt('输入预设名称');
        }
        if (!name || !cssText) return;
        if (!appData.beautifyPresets[type]) appData.beautifyPresets[type] = [];
        appData.beautifyPresets[type].push({ name: name, css: cssText });
        saveData();
        loadBeautifyPresets(type);
    }
    function loadBeautifyPresets(type) {
        let containerId;
        if (type === 'chatGlobal') containerId = 'beautifyChatPresetList';
        else if (type === 'bubble') containerId = 'beautifyBubblePresetList';
        else containerId = 'beautifyMomentsPresetList';
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        const presets = appData.beautifyPresets[type] || [];
        presets.forEach((preset, index) => {
            const item = document.createElement('div');
            item.style.cssText = 'display:inline-flex;align-items:center;gap:8px; padding:10px 14px; background:#ffffff; border-radius:14px; margin:6px; font-size:13px; cursor:pointer; color:#4a4a4a; border:1px solid #e6e6e6; box-shadow:0 4px 14px rgba(0,0,0,0.08); transition:all 0.2s;';
            const nameSpan = document.createElement('span');
            nameSpan.textContent = preset.name;
            item.appendChild(nameSpan);
            item.onclick = () => applyBeautifyPreset(type, preset.css, index);
            item.onmouseenter = () => { item.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; item.style.borderColor = '#4a90d9'; };
            item.onmouseleave = () => { item.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)'; item.style.borderColor = '#e6e6e6'; };
            const edit = document.createElement('span');
            edit.style.cssText = 'color:#4a90d9; cursor:pointer;';
            edit.textContent = '编辑';
            edit.onclick = (e) => { e.stopPropagation(); editBeautifyPreset(type, index); };
            const del = document.createElement('span');
            del.style.cssText = 'color:#ff3b30; cursor:pointer;';
            del.textContent = '删除';
            del.onclick = (e) => { e.stopPropagation(); deleteBeautifyPreset(type, index); };
            item.appendChild(edit);
            item.appendChild(del);
            container.appendChild(item);
        });
    }
    function applyBeautifyPreset(type, css, index) {
        let styleEl = document.getElementById('beautifyCustomStyle_' + type);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'beautifyCustomStyle_' + type;
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = css;
        if (type === 'chatGlobal') {
            document.getElementById('beautifyChatCss').value = css;
        } else if (type === 'bubble') {
            document.getElementById('beautifyBubbleCss').value = css;
            updateBubblePreview();
        } else if (type === 'moments') {
            document.getElementById('beautifyMomentsCss').value = css;
        }
        if (typeof index === 'number' && appData.beautifyPresets && appData.beautifyPresets[type]) {
            appData.beautifyPresets[type].forEach(function(p, i){ p.active = i === index; });
            saveData();
        }
    }
    function deleteBeautifyPreset(type, index) {
        if (!appData.beautifyPresets[type]) return;
        appData.beautifyPresets[type].splice(index, 1);
        saveData();
        loadBeautifyPresets(type);
    }
    function editBeautifyPreset(type, index) {
        const list = appData.beautifyPresets[type] || [];
        const preset = list[index];
        if (!preset) return;
        const newName = prompt('修改预设名称', preset.name);
        if (newName === null) return;
        const newCss = prompt('修改预设内容', preset.css);
        if (newCss === null) return;
        preset.name = newName.trim() || preset.name;
        preset.css = newCss;
        saveData();
        loadBeautifyPresets(type);
    }
    function applyBeautifyLiveCss(type) {
        let cssText;
        if (type === 'chatGlobal') cssText = document.getElementById('beautifyChatCss').value;
        else if (type === 'bubble') cssText = document.getElementById('beautifyBubbleCss').value;
        else cssText = document.getElementById('beautifyMomentsCss').value;
        let styleEl = document.getElementById('beautifyCustomStyle_' + type);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'beautifyCustomStyle_' + type;
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = cssText;
        if (type === 'bubble') updateBubblePreview();
        /* 持久化保存 */
        if(!appData.beautifyLiveCss) appData.beautifyLiveCss = { chatGlobal: '', bubble: '', moments: '' };
        appData.beautifyLiveCss[type] = cssText;
        clearTimeout(window._beautifyLiveSaveTimer);
        window._beautifyLiveSaveTimer = setTimeout(function(){ saveData(); }, 600);
    }
    function updateBubblePreview() {
        const css = document.getElementById('beautifyBubbleCss').value;
        const preview = document.getElementById('beautifyBubblePreviewBox');
        if (!preview) return;
        let styleEl = document.getElementById('bubblePreviewStyle');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'bubblePreviewStyle';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = css;
    }


    // ========== 存储数据APP ==========
    function openStorageApp() {
        document.getElementById('storagePage').style.display = 'flex';
        renderStorageList();
        renderWordCloudStats();
        renderWordFreqRank();
        renderMessageCountStats();
    }
    function closeStorageApp() {
        document.getElementById('storagePage').style.display = 'none';
    }
    function renderStorageList() {
        const container = document.getElementById('storageList');
        container.innerHTML = '';
        const total = JSON.stringify(appData).length;
        // 存储概览（30GB）
        const overview = document.getElementById('storageOverview');
        if (overview) {
            const usedPercent = Math.min(100, (total / STORAGE_QUOTA) * 100);
            overview.innerHTML = '<div style="display:flex;justify-content:space-between;font-size:13px;color:#4a4a4a;margin-bottom:6px;"><span>已使用：' + formatBytes(total) + '</span><span>总容量：30 GB</span></div>' +
                '<div style="width:100%;height:12px;background:#e0e0e0;border-radius:6px;overflow:hidden;"><div style="width:' + usedPercent + '%;height:100%;background:linear-gradient(90deg,#1a1a1a,#666);transition:width 0.3s;"></div></div>' +
                '<div style="font-size:11px;color:#999;margin-top:4px;">剩余可用：' + formatBytes(Math.max(0, STORAGE_QUOTA - total)) + '</div>';
        }
        const items = [
            { key: '聊天记录', dataKey: 'chatHistory', size: JSON.stringify(appData.chatHistory || []).length },
            { key: '字卡', dataKey: 'wordCards', size: (JSON.stringify(appData.wordCards || {}) + JSON.stringify(appData.specialCards || {})).length },
            { key: '日记', dataKey: 'diary', size: JSON.stringify(appData.diary || {}).length },
            { key: '信封', dataKey: 'letter', size: JSON.stringify(appData.letter || {}).length },
            { key: '朋友圈', dataKey: 'moments', size: JSON.stringify(appData.moments || {}).length },
            { key: '设置', dataKey: 'globalSettings', size: JSON.stringify(appData.globalSettings || {}).length },
            { key: '美化预设', dataKey: 'beautifyPresets', size: JSON.stringify(appData.beautifyPresets || {}).length },
            { key: '默契生死局', dataKey: 'lifeDeathData', size: JSON.stringify(appData.lifeDeathData || {}).length },
            { key: '相册寄语', dataKey: 'albumData', size: JSON.stringify(appData.albumData || {}).length },
            { key: '其他', dataKey: 'misc', size: total - JSON.stringify(appData.chatHistory||[]).length - JSON.stringify(appData.wordCards||{}).length - JSON.stringify(appData.specialCards||{}).length - JSON.stringify(appData.diary||{}).length - JSON.stringify(appData.letter||{}).length - JSON.stringify(appData.moments||{}).length - JSON.stringify(appData.globalSettings||{}).length - JSON.stringify(appData.beautifyPresets||{}).length - JSON.stringify(appData.lifeDeathData||{}).length - JSON.stringify(appData.albumData||{}).length }
        ];
        items.forEach(item => {
            const row = document.createElement('div');
            row.style.cssText = 'display:grid; grid-template-columns: 1fr 70px 56px 56px; align-items:center; gap:8px; padding:12px 0; border-bottom:1px solid #f0f0f0; font-size:14px;';
            const nameSpan = document.createElement('span');
            nameSpan.style.color = '#4a4a4a';
            nameSpan.style.cursor = 'pointer';
            nameSpan.style.overflow = 'hidden';
            nameSpan.style.textOverflow = 'ellipsis';
            nameSpan.style.whiteSpace = 'nowrap';
            nameSpan.textContent = item.key;
            nameSpan.onclick = () => showAppDataModal(item);
            const sizeSpan = document.createElement('span');
            sizeSpan.style.color = '#999999';
            sizeSpan.style.fontSize = '12px';
            sizeSpan.style.textAlign = 'right';
            sizeSpan.style.fontVariantNumeric = 'tabular-nums';
            sizeSpan.textContent = formatBytes(item.size);
            const resetBtn = document.createElement('span');
            resetBtn.style.cssText = 'color:#34c759; font-size:12px; cursor:pointer; padding:4px 0; border:1px solid #34c759; border-radius:4px; text-align:center;';
            resetBtn.textContent = '重置';
            resetBtn.onclick = () => {
                if (confirm('确定重置' + item.key + '数据为初始状态？')) {
                    resetStorageData(item.dataKey);
                    renderStorageList();
                }
            };
            const clearBtn = document.createElement('span');
            clearBtn.style.cssText = 'color:#ff3b30; font-size:12px; cursor:pointer; padding:4px 0; border:1px solid #ff3b30; border-radius:4px; text-align:center;';
            clearBtn.textContent = '清除';
            clearBtn.onclick = () => {
                if (confirm('确定清除' + item.key + '数据？')) {
                    clearStorageData(item.dataKey);
                    renderStorageList();
                }
            };
            row.appendChild(nameSpan);
            row.appendChild(sizeSpan);
            row.appendChild(resetBtn);
            row.appendChild(clearBtn);
            container.appendChild(row);
        });
        // 总计
        const totalRow = document.createElement('div');
        totalRow.style.cssText = 'display:flex; justify-content:space-between; padding:16px 0; font-size:15px; font-weight:500; color:#1a1a1a; border-top:2px solid #e0e0e0; margin-top:8px;';
        const totalLabel = document.createElement('span');
        totalLabel.textContent = '已使用';
        const totalSize = document.createElement('span');
        totalSize.textContent = formatBytes(total);
        totalRow.appendChild(totalLabel);
        totalRow.appendChild(totalSize);
        container.appendChild(totalRow);
    }
    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
    function showAppDataModal(item) {
        var modal = document.getElementById('appDataModal');
        var title = document.getElementById('appDataModalTitle');
        var body = document.getElementById('appDataModalBody');
        title.textContent = item.key + ' 数据详情';
        var data = '';
        var count = 0;
        try {
            if (item.dataKey === 'chatHistory') {
                data = appData.chatHistory || [];
                count = data.length;
                body.innerHTML = '<div style="margin-bottom:10px;color:#666;">消息总数：' + count + ' 条</div>' +
                    '<div style="margin-bottom:10px;color:#666;">占用空间：' + formatBytes(item.size) + '</div>' +
                    '<div style="max-height:300px;overflow-y:auto;border:1px solid #eee;border-radius:8px;padding:8px;">' +
                    (count ? data.slice(-20).reverse().map(function(m){
                        var sender = m.sender === 'mine' ? '我' : '对方';
                        var preview = m.text || m.type || '(无内容)';
                        if (typeof preview === 'string' && preview.length > 50) preview = preview.substring(0,50) + '...';
                        return '<div style="padding:4px 0;border-bottom:1px solid #f5f5f5;font-size:12px;"><span style="color:#999;">' + sender + ':</span> ' + preview + '</div>';
                    }).join('') : '<div style="color:#999;text-align:center;padding:20px;">暂无数据</div>') +
                    '</div>' + (count > 20 ? '<div style="text-align:center;color:#999;font-size:11px;margin-top:8px;">仅显示最近20条</div>' : '');
            } else if (item.dataKey === 'wordCards') {
                var wc = appData.wordCards || {};
                var sc = appData.specialCards || {};
                var wcCount = Object.keys(wc).reduce(function(s,k){ return s + (wc[k]||[]).length; }, 0);
                var scCount = Object.keys(sc).reduce(function(s,k){ return s + (sc[k]||[]).length; }, 0);
                body.innerHTML = '<div style="margin-bottom:10px;color:#666;">普通字卡：' + wcCount + ' 张</div>' +
                    '<div style="margin-bottom:10px;color:#666;">特殊字卡：' + scCount + ' 张</div>' +
                    '<div style="margin-bottom:10px;color:#666;">占用空间：' + formatBytes(item.size) + '</div>' +
                    '<div style="max-height:300px;overflow-y:auto;border:1px solid #eee;border-radius:8px;padding:8px;">' +
                    Object.keys(wc).map(function(g){
                        return '<div style="font-weight:600;font-size:12px;margin:6px 0 4px;">分组：' + g + ' (' + (wc[g]||[]).length + ')</div>' +
                            (wc[g]||[]).slice(0,10).map(function(c){ return '<div style="padding:2px 8px;font-size:12px;color:#555;">' + (typeof c === 'string' ? c : (c.text||c.content||'(对象)')) + '</div>'; }).join('');
                    }).join('') + '</div>';
            } else {
                var raw = '';
                switch(item.dataKey) {
                    case 'diary': raw = appData.diary; break;
                    case 'letter': raw = appData.letter; break;
                    case 'moments': raw = appData.moments; break;
                    case 'globalSettings': raw = appData.globalSettings; break;
                    case 'beautifyPresets': raw = appData.beautifyPresets; break;
                    case 'lifeDeathData': raw = appData.lifeDeathData; break;
                    case 'albumData': raw = appData.albumData; break;
                    default: raw = '(其他数据)'; break;
                }
                var json = JSON.stringify(raw, null, 2);
                if (json.length > 2000) json = json.substring(0, 2000) + '\n... (数据过长，已截断)';
                body.innerHTML = '<div style="margin-bottom:10px;color:#666;">占用空间：' + formatBytes(item.size) + '</div>' +
                    '<pre style="white-space:pre-wrap;word-break:break-all;background:#f9f9f9;padding:10px;border-radius:8px;font-size:11px;max-height:300px;overflow-y:auto;">' + json + '</pre>';
            }
        } catch(e) {
            body.innerHTML = '<div style="color:#999;text-align:center;padding:20px;">数据读取失败</div>';
        }
        modal.style.display = 'flex';
    }
    function clearStorageData(key) {
        if (key === 'chatHistory') appData.chatHistory = [];
        else if (key === 'wordCards') { appData.wordCards = { default: [] }; appData.specialCards = { nudge: [], emoji: [], kaomoji: [], image: [], video: [] }; }
        else if (key === 'diary') appData.diary = { singleList: [], doubleList: [], currentTab: 'single', settings: appData.diary.settings };
        else if (key === 'letter') appData.letter = { currentTab: 'inbox', inbox: [], reply: [], sent: [], favorite: [], settings: appData.letter.settings };
        else if (key === 'moments') appData.moments = { list: [], wallpaper: '', lastDailyDate: '' };
        else if (key === 'globalSettings') appData.globalSettings = { darkMode: false, fontFamily: '', fontColor: '#1a1a1a', iconColor: '#999999', globalFontSize: 14, chatWallpaper: '', topBgImage: '', bottomBgImage: '' };
        else if (key === 'beautifyPresets') appData.beautifyPresets = { chatGlobal: [], bubble: [], moments: [] };
        else if (key === 'lifeDeathData') appData.lifeDeathData = { questionBank: [], history: [], initialized: false };
        else if (key === 'albumData') appData.albumData = { photos: [], categories: ['日常','风景','食物','合照','他拍的','我拍的'], currentCategory: '日常' };
        saveData();
    }
    // 重置指定应用数据为初始默认状态（第一次打开网站时的样子）
    function resetStorageData(key) {
        if (key === 'misc') {
            appData.appIconImages = {};
            appData.widgetImages = {};
            appData.colors = {};
            appData.videoBg = '';
            appData.appNames = {};
            appData.widgetOffsets = { anniversary: 0, appSection: 0, appSectionBottom: 0, period: 0, wordCard: 0, thirdRow: 0, p3Music: 0, p3StudentId: 0, p3MidRow: 0, p3Polaroids: 0 };
            appData.dockBottom = 20;
        } else if (key === 'globalSettings') {
            appData.globalSettings = JSON.parse(JSON.stringify({
                darkMode: false, fontFamily: '', fontColor: '#1a1a1a', iconColor: '#999999',
                globalFontSize: 14, chatWallpaper: '', disableGlass: false, iconBg: '#ffffff',
                anniversaryBg: '#ffffff', dockBg: '#ffffff', periodBg: '#ffffff', timeBg: '#ffffff'
            }));
        } else if (key === 'beautifyPresets') {
            appData.beautifyPresets = { chatGlobal: [], bubble: [], moments: [] };
        } else if (defaultData[key] !== undefined) {
            appData[key] = JSON.parse(JSON.stringify(defaultData[key]));
        }
        // 字卡联动重置
        if (key === 'wordCards') {
            appData.specialCards = JSON.parse(JSON.stringify(defaultData.specialCards));
            appData.wordGroups = JSON.parse(JSON.stringify(defaultData.wordGroups));
            appData.currentGroup = defaultData.currentGroup;
            appData.contactWordCards = {};
        }
        saveData();
    }
    // 页面布局重置：仅复原界面位置，不触碰用户数据
    function resetPageLayout() {
        if (!confirm('确定重置页面布局？这将恢复底栏位置、桌面页码、组件位置等界面状态，不会删除任何聊天记录或数据。')) return;
        try {
            // 1. 聊天底部输入框位置归零
            if (appData && appData.chatSettings) appData.chatSettings.footerPosOffset = 0;
            var footerPosInput = document.getElementById('footerPosOffset');
            var footerPosVal = document.getElementById('footerPosVal');
            if (footerPosInput) footerPosInput.value = 0;
            if (footerPosVal) footerPosVal.textContent = '0%';
            var chatFooter = document.querySelector('.chat-footer');
            if (chatFooter) chatFooter.style.marginTop = '';
            // 2. Dock 栏位置复原
            if (appData) appData.dockBottom = 20;
            var dock = document.querySelector('.dock-bar');
            if (dock) dock.style.bottom = '20px';
            // 3. 桌面回到第一页
            if (typeof currentPage !== 'undefined') currentPage = 0;
            var desktopWrapper = document.getElementById('desktopWrapper');
            if (desktopWrapper) desktopWrapper.style.transform = 'translateX(0%)';
            document.querySelectorAll('.page-dot').forEach(function(dot, idx){ dot.classList.toggle('active', idx === 0); });
            // 4. 清除可能残留的键盘状态
            var chatPage = document.getElementById('chatPage');
            if (chatPage) {
                chatPage.classList.remove('keyboard-open');
                chatPage.style.removeProperty('--keyboard-height');
            }
            var chatInput = document.getElementById('chatInput');
            if (chatInput && document.activeElement === chatInput) chatInput.blur();
            // 5. 清除桌面 widget 偏移（可选）
            try { restoreWidgetOffsets(); } catch(e){}
            saveData();
            alert('页面布局已重置');
        } catch(e) { console.error('[页面布局重置] 失败:', e); }
    }
    // 保留数据级重置入口（不再放在显眼的按钮上，防止误触清空全部数据）
    function resetEntireWebsite() {
        if (!confirm('确定重置整个网站数据？此操作不可恢复，所有数据将恢复到初始状态！')) return;
        if (!confirm('再次确认：重置后所有聊天记录、字卡、设置等都将清空，确定继续吗？')) return;
        try { localStorage.clear(); } catch(e) {}
        try {
            var req = indexedDB.deleteDatabase(IDB_NAME);
            req.onsuccess = function(){ location.reload(); };
            req.onerror = function(){ location.reload(); };
            req.onblocked = function(){ location.reload(); };
        } catch(e) {}
        setTimeout(function(){ location.reload(); }, 1500);
    }


    // ===== 数据就绪后执行的每日检查 =====
    function runDailyChecks() {
        initDailyWord();
        checkDailyMoments();
        checkDailyAutoLetter();
        checkPendingDiaryReplies();
        checkPendingLetterReplies();
        checkPendingSummons();
        scheduleProactiveMessage();
        // 恢复拉黑定时器（页面加载后检查被拉黑的联系人）
        try { if (typeof restoreBlockTimers === 'function') restoreBlockTimers(); } catch(e) {}
    }

    // ===== 对方主动发消息：到达设定时间后，对方主动调取字卡发消息 =====
    var _proactiveTimer = null;
    function scheduleProactiveMessage() {
        if (_proactiveTimer) { clearTimeout(_proactiveTimer); _proactiveTimer = null; }
        const s = appData.chatSettings;
        if (!s.proactiveEnable) return;
        // 最低以秒为单位，最高以分钟为单位
        const minMs = Math.max(1, s.proactiveMinSec || 30) * 1000;
        const maxMs = Math.max(minMs, (s.proactiveMaxMin || 5) * 60 * 1000);
        const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
        // 捕获当前联系人上下文，确保退出聊天后定时器触发时消息仍写入正确的聊天记录
        var _proactiveContactId = _activeContactId || _lastChatContactId;
        _proactiveTimer = setTimeout(() => {
            // 恢复触发时的联系人上下文，使主动消息写入正确的聊天记录
            var _savedContactId = _activeContactId;
            _activeContactId = _proactiveContactId;
            // 免打扰模式下对方不主动发消息
            if (_proactiveContactId) {
                var _dndContact = _findContactById(_proactiveContactId);
                if (_dndContact && _dndContact.doNotDisturb) {
                    _activeContactId = _savedContactId;
                    scheduleProactiveMessage();
                    return;
                }
            }
            // 调取字卡给对方主动发消息
            const allCards = getAllVisibleWordCards();
            if (allCards.length > 0) {
                let text;
                if (s.enableSplice && Math.random() > 0.5) {
                    const spliceCount = Math.min(Math.floor(Math.random() * 3) + 1, allCards.length);
                    const shuffled = [...allCards].sort(() => 0.5 - Math.random());
                    text = shuffled.slice(0, spliceCount).join(' ');
                } else {
                    text = allCards[Math.floor(Math.random() * allCards.length)];
                }
                addMessage({
                    id: Date.now(),
                    sender: 'other',
                    type: 'text',
                    content: text
                });
            }
            _activeContactId = _savedContactId;
            // 如果聊天页可见但当前联系人与消息目标不同，需要重新渲染当前聊天
            if (document.getElementById('chatPage').style.display === 'flex' && _savedContactId !== _proactiveContactId) {
                try { renderMessages(); scrollToBottom(); } catch(e) {}
            }
            // 继续调度下一次
            scheduleProactiveMessage();
        }, delay);
    }


    // ========== 字体恢复 ==========
    function applyFontFace(styleId, fontName, fontData) {
        if (!fontData) return;
        try {
            const old = document.getElementById(styleId);
            if (old) old.remove();
            const style = document.createElement('style');
            style.id = styleId;
            // 兼容 ttf/otf 格式（含 URL 的 .otf 判断）
            var _lower = (fontData || '').toLowerCase();
            const isOtf = fontData.indexOf('data:font/opentype') === 0 ||
                          fontData.indexOf('data:application/x-font-otf') === 0 ||
                          fontData.indexOf('data:application/vnd.ms-opentype') === 0 ||
                          fontData.indexOf('data:font/otf') === 0 ||
                          (fontData.indexOf('http') === 0 && _lower.indexOf('.otf') > -1);
            const fmt = isOtf ? 'opentype' : 'truetype';
            style.textContent = '@font-face { font-family: "' + fontName + '"; src: url(' + fontData + ') format("' + fmt + '"); }';
            document.head.appendChild(style);
        } catch(e) { console.error('applyFontFace error:', e); }
    }
    function restoreCustomFonts() {
        // 恢复日记字体
        if (appData.diary && appData.diary.settings && appData.diary.settings.fontData && appData.diary.settings.fontFamily) {
            applyFontFace('diaryFontStyle', appData.diary.settings.fontFamily, appData.diary.settings.fontData);
        }
        // 恢复信封字体
        if (appData.letter && appData.letter.settings && appData.letter.settings.fontData && appData.letter.settings.fontFamily) {
            applyFontFace('letterFontStyle', appData.letter.settings.fontFamily, appData.letter.settings.fontData);
        }
        // 恢复全局字体
        if (appData.globalSettings && appData.globalSettings.fontData && appData.globalSettings.fontFamily) {
            applyFontFace('globalFontStyle', appData.globalSettings.fontFamily, appData.globalSettings.fontData);
        }
        // 恢复相册字体
        if (appData.albumData && appData.albumData.settings && appData.albumData.settings.fontFamily) {
            var albumFontVal = appData.albumData.settings.fontFamily;
            if (albumFontVal.indexOf('data:') === 0 || albumFontVal.indexOf('http') === 0) {
                applyFontFace('albumFontStyle', 'AlbumCustomFont', albumFontVal);
            }
        }
        // 恢复自定义字体列表
        if (appData.customFonts && appData.customFonts.length > 0) {
            appData.customFonts.forEach(function(f) {
                applyFontFace('customFont_' + f.id, f.id, f.data);
            });
            ['global','diary','letter','chat','album'].forEach(function(t) {
                renderCustomFontList(t);
            });
        }
    }

    // ========== IndexedDB 加载后重新初始化 ==========
    // 共享CSS变量恢复函数（init 和 reinitAfterIDBLoad 都使用）
    function applyChatCSSVars(cs) {
        document.documentElement.style.setProperty('--avatar-size', cs.avatarSize + 'px');
        document.documentElement.style.setProperty('--avatar-radius', cs.avatarRadius + 'px');
        document.documentElement.style.setProperty('--other-avatar-size', (cs.otherAvatarSize||cs.avatarSize) + 'px');
        document.documentElement.style.setProperty('--my-avatar-size', (cs.myAvatarSize||cs.avatarSize) + 'px');
        document.documentElement.style.setProperty('--other-avatar-radius', (cs.otherAvatarRadius||cs.avatarRadius) + 'px');
        document.documentElement.style.setProperty('--my-avatar-radius', (cs.myAvatarRadius||cs.avatarRadius) + 'px');
        document.documentElement.style.setProperty('--bubble-radius', cs.bubbleRadius + 'px');
        document.documentElement.style.setProperty('--bubble-font-size', cs.bubbleFontSize + 'px');
        document.documentElement.style.setProperty('--bubble-padding', (cs.bubblePadding || 8) + 'px');
        document.documentElement.style.setProperty('--other-bubble-font-size', (cs.otherBubbleFontSize||cs.bubbleFontSize) + 'px');
        document.documentElement.style.setProperty('--my-bubble-font-size', (cs.myBubbleFontSize||cs.bubbleFontSize) + 'px');
        document.documentElement.style.setProperty('--other-bubble-padding', (cs.otherBubblePadding||cs.bubblePadding||8) + 'px');
        document.documentElement.style.setProperty('--my-bubble-padding', (cs.myBubblePadding||cs.bubblePadding||8) + 'px');
        document.documentElement.style.setProperty('--my-bubble-bg', cs.myBubbleBg);
        document.documentElement.style.setProperty('--my-bubble-text', cs.myBubbleText);
        document.documentElement.style.setProperty('--my-bubble-border', cs.myBubbleBorder);
        document.documentElement.style.setProperty('--other-bubble-bg', cs.otherBubbleBg);
        document.documentElement.style.setProperty('--other-bubble-text', cs.otherBubbleText);
        document.documentElement.style.setProperty('--other-bubble-border', cs.otherBubbleBorder);
    }
    function reinitAfterIDBLoad() {
        // 重新应用 IndexedDB 中加载的真实数据，避免刷新时 localStorage 备份丢失导致桌面恢复默认
        restoreCustomFonts();
        applyGlobalSettings();
        applyDiaryCustomCss();
        applyDiaryTheme();
        applyLetterCustomCss();
        applyLetterTheme();
        applyDesktopWallpaper();
        applyChatCSSVars(appData.chatSettings);
        applyBubbleRadiusVars(appData.chatSettings);
        applyTransferStyleVars(appData.chatSettings);
        applyBubbleFont();
        restoreAppIcons();
        restoreWidgets();
        restoreWidgetOffsets();
        /* 恢复第三页输入框文字（IndexedDB 加载后从 appData 恢复，防止 localStorage 丢失） */
        try{ if(typeof window.restoreP3InputTexts==='function') window.restoreP3InputTexts(); }catch(e){}
        /* 恢复上次选择的余额联系人，确保购物城/写歌/五子棋等操作写入正确的联系人余额 */
        if (typeof _balanceContactId !== 'undefined' && !_balanceContactId && appData.balanceData && appData.balanceData._balanceContactId) {
            var _savedBalCid = appData.balanceData._balanceContactId;
            var _balContacts = (appData.contactList && appData.contactList.contacts) || [];
            for (var _bi = 0; _bi < _balContacts.length; _bi++) {
                if (_balContacts[_bi].id === _savedBalCid) { _balanceContactId = _savedBalCid; break; }
            }
        }
        // 恢复图标大小
        if (appData.iconSize) {
            document.documentElement.style.setProperty('--app-icon-size', appData.iconSize + 'px');
        }
        // 恢复应用名称大小与颜色
        applyAppNameStyle();
        initTimeWidgets();
        restoreWordCardStyle();
        initAnniversary();
        buildCalendar();
        updateTimes();
        updateBubbleSettingsPreview();
        // 恢复美化预设CSS
        ['chatGlobal', 'bubble', 'moments'].forEach(type => {
            if (appData.beautifyPresets && appData.beautifyPresets[type]) {
                const active = appData.beautifyPresets[type].find(p => p.active);
                if (active) {
                    let styleEl = document.getElementById('beautifyCustomStyle_' + type);
                    if (!styleEl) {
                        styleEl = document.createElement('style');
                        styleEl.id = 'beautifyCustomStyle_' + type;
                        document.head.appendChild(styleEl);
                    }
                    styleEl.textContent = active.css;
                }
            }
        });
        // 恢复美化实时CSS（无激活预设时使用）
        ['chatGlobal', 'bubble', 'moments'].forEach(type => {
            if (appData.beautifyLiveCss && appData.beautifyLiveCss[type]) {
                var hasActive = appData.beautifyPresets && appData.beautifyPresets[type] && appData.beautifyPresets[type].some(p => p.active);
                if (!hasActive) {
                    let styleEl = document.getElementById('beautifyCustomStyle_' + type);
                    if (!styleEl) {
                        styleEl = document.createElement('style');
                        styleEl.id = 'beautifyCustomStyle_' + type;
                        document.head.appendChild(styleEl);
                    }
                    styleEl.textContent = appData.beautifyLiveCss[type];
                }
                /* 回填textarea */
                var taId = type==='chatGlobal'?'beautifyChatCss':(type==='bubble'?'beautifyBubbleCss':'beautifyMomentsCss');
                var ta = document.getElementById(taId);
                if (ta && !ta.value) ta.value = appData.beautifyLiveCss[type];
            }
        });
        // 恢复聊天壁纸及顶底栏背景
        const cs = appData.chatSettings;
        if (cs.chatWallpaper) {
            const chatMsgs = document.querySelector('.chat-messages');
            if (chatMsgs) chatMsgs.style.backgroundImage = `url(${cs.chatWallpaper})`;
            const chatPage = document.getElementById('chatPage');
            if (chatPage) { chatPage.style.backgroundImage = `url(${cs.chatWallpaper})`; chatPage.style.backgroundSize = 'cover'; chatPage.style.backgroundPosition = 'center'; }
        }
        const chatHeader = document.querySelector('.chat-header');
        if (chatHeader) {
            chatHeader.style.backgroundColor = cs.topBgColor;
            if (cs.topBgImage) { chatHeader.style.backgroundImage = 'url(' + cs.topBgImage + ')'; chatHeader.style.backgroundSize = 'cover'; }
            chatHeader.style.borderRadius = '0 0 ' + (cs.topBgRadius || 0) + 'px ' + (cs.topBgRadius || 0) + 'px';
        }
        const chatFooter = document.querySelector('.chat-footer');
        if (chatFooter) {
            chatFooter.style.backgroundColor = cs.bottomBgColor;
            if (cs.bottomBgImage) { chatFooter.style.backgroundImage = 'url(' + cs.bottomBgImage + ')'; chatFooter.style.backgroundSize = 'cover'; }
            chatFooter.style.borderRadius = (cs.bottomBgRadius || 0) + 'px ' + (cs.bottomBgRadius || 0) + 'px 0 0';
        }
        // 恢复聊天显示设置（关闭底部背景 / 聊天暗黑模式等），保证刷新后依然生效
        try { applyChatDisplaySettings(); } catch (e) { console.warn('applyChatDisplaySettings failed:', e); }
        if (document.getElementById('chatPage').style.display === 'flex') {
            try { initChatPage(); } catch (e) { console.error('initChatPage失败:', e); }
            try { renderMessages(); } catch (e) { console.error('renderMessages失败:', e); }
        }
        if (document.getElementById('diaryPage').style.display === 'flex') { try { renderDiaryList(); } catch (e) { console.error('renderDiaryList失败:', e); } }
        if (document.getElementById('letterPage').style.display === 'flex') { try { renderLetterList(); } catch (e) { console.error('renderLetterList失败:', e); } }
        // 初始化锁屏（在数据加载完成后）
        try { initLockScreen(); } catch (e) { console.error('initLockScreen失败:', e); }
        // 应用联系人列表样式
        try { applyContactListStyles(); } catch (e) { console.error('applyContactListStyles失败:', e); }
        try { processPendingMomentActions(); } catch(e) {}
        try { checkPendingDiaryReplies(); } catch(e) {}
        try { checkPendingSummons(); } catch(e) {}
    }


    // ========== 页面位置重置（仅 Android 更新后首次进入） ==========
    // 只复原界面位置，绝不触碰用户数据
    function resetPagePositionsOnAndroidUpdate() {
        try {
            var isAndroid = /Android/i.test(navigator.userAgent);
            if (!isAndroid) return;
            var VERSION_KEY = 'qianyi_page_reset_ver';
            var CURRENT_VER = '20260806a'; // 每次需要触发页面重置时递增
            var lastVer = '';
            try { lastVer = localStorage.getItem(VERSION_KEY) || ''; } catch(e) {}
            if (lastVer === CURRENT_VER) return;
            try { localStorage.setItem(VERSION_KEY, CURRENT_VER); } catch(e) {}

            // 1. 聊天底部输入框位置归零
            if (appData && appData.chatSettings) {
                appData.chatSettings.footerPosOffset = 0;
            }
            var footerPosInput = document.getElementById('footerPosOffset');
            var footerPosVal = document.getElementById('footerPosVal');
            if (footerPosInput) footerPosInput.value = 0;
            if (footerPosVal) footerPosVal.textContent = '0%';
            var chatFooter = document.querySelector('.chat-footer');
            if (chatFooter) chatFooter.style.marginTop = '';

            // 2. Dock 栏位置复原
            if (appData) appData.dockBottom = 20;
            var dock = document.querySelector('.dock-bar');
            if (dock) dock.style.bottom = '20px';

            // 3. 桌面回到第一页
            if (typeof currentPage !== 'undefined') currentPage = 0;
            var desktopWrapper = document.getElementById('desktopWrapper');
            if (desktopWrapper) desktopWrapper.style.transform = 'translateX(0%)';
            document.querySelectorAll('.page-dot').forEach(function(dot, idx){ dot.classList.toggle('active', idx === 0); });

            // 4. 清除可能残留的键盘状态
            var chatPage = document.getElementById('chatPage');
            if (chatPage) {
                chatPage.classList.remove('keyboard-open');
                chatPage.style.removeProperty('--keyboard-height');
            }
            var chatInput = document.getElementById('chatInput');
            if (chatInput && document.activeElement === chatInput) chatInput.blur();

            try { saveData(); } catch(e) {}
            console.log('[页面重置] Android 更新后已复原界面位置');
        } catch(e) { console.error('[页面重置] 失败:', e); }
    }


    // ========== 初始化 ==========
    function init() {
        // 先处理 Android 更新后的页面位置重置（数据不动）
        resetPagePositionsOnAndroidUpdate();

        // 异步从 IndexedDB 加载数据（支持30G大容量存储）
        loadDataFromIDB();
        restoreCustomFonts();
        initAnniversary();
        buildCalendar();
        updateTimes();
        restoreAppIcons();
        restoreWidgets();
        restoreWidgetOffsets();
        applyAppNameStyle();
        setupLongPressForElements();
        setupVideoLongPress();
        initTimeWidgets();
        applyGlobalSettings();
        applyDesktopWallpaper();
        // 恢复聊天设置CSS变量（共享函数，避免与 reinitAfterIDBLoad 重复）
        applyChatCSSVars(appData.chatSettings);
        applyBubbleRadiusVars(appData.chatSettings);
        applyTransferStyleVars(appData.chatSettings);
        applyBubbleFont();
        // 初始化气泡设置预览
        updateBubbleSettingsPreview();
        // 恢复美化预设CSS
        ['chatGlobal', 'bubble', 'moments'].forEach(type => {
            if (appData.beautifyPresets && appData.beautifyPresets[type]) {
                const active = appData.beautifyPresets[type].find(p => p.active);
                if (active) {
                    let styleEl = document.getElementById('beautifyCustomStyle_' + type);
                    if (!styleEl) {
                        styleEl = document.createElement('style');
                        styleEl.id = 'beautifyCustomStyle_' + type;
                        document.head.appendChild(styleEl);
                    }
                    styleEl.textContent = active.css;
                }
            }
        });
        // 恢复美化实时CSS（无激活预设时使用）
        ['chatGlobal', 'bubble', 'moments'].forEach(type => {
            if (appData.beautifyLiveCss && appData.beautifyLiveCss[type]) {
                var hasActive = appData.beautifyPresets && appData.beautifyPresets[type] && appData.beautifyPresets[type].some(p => p.active);
                if (!hasActive) {
                    let styleEl = document.getElementById('beautifyCustomStyle_' + type);
                    if (!styleEl) {
                        styleEl = document.createElement('style');
                        styleEl.id = 'beautifyCustomStyle_' + type;
                        document.head.appendChild(styleEl);
                    }
                    styleEl.textContent = appData.beautifyLiveCss[type];
                }
            }
        });
        // 恢复字卡样式
        restoreWordCardStyle();
        // 恢复聊天壁纸
        const cs = appData.chatSettings;
        if (cs.chatWallpaper) {
            const chatMsgs = document.querySelector('.chat-messages');
            if (chatMsgs) chatMsgs.style.backgroundImage = `url(${cs.chatWallpaper})`;
            const chatPage = document.getElementById('chatPage');
            if (chatPage) { chatPage.style.backgroundImage = `url(${cs.chatWallpaper})`; chatPage.style.backgroundSize = 'cover'; chatPage.style.backgroundPosition = 'center'; }
        }
        // 恢复顶底栏背景
        const chatHeader = document.querySelector('.chat-header');
        if (chatHeader) {
            chatHeader.style.backgroundColor = cs.topBgColor;
            if (cs.topBgImage) { chatHeader.style.backgroundImage = 'url(' + cs.topBgImage + ')'; chatHeader.style.backgroundSize = 'cover'; }
            chatHeader.style.borderRadius = '0 0 ' + (cs.topBgRadius || 0) + 'px ' + (cs.topBgRadius || 0) + 'px';
        }
        const chatFooter = document.querySelector('.chat-footer');
        if (chatFooter) {
            chatFooter.style.backgroundColor = cs.bottomBgColor;
            if (cs.bottomBgImage) { chatFooter.style.backgroundImage = 'url(' + cs.bottomBgImage + ')'; chatFooter.style.backgroundSize = 'cover'; }
            chatFooter.style.borderRadius = (cs.bottomBgRadius || 0) + 'px ' + (cs.bottomBgRadius || 0) + 'px 0 0';
        }
        // 恢复聊天显示设置（含顶底栏圆角、内边距、暗黑模式等），保证刷新/离线后依然生效
        try { applyChatDisplaySettings(); } catch (e) { console.warn('applyChatDisplaySettings failed:', e); }
        // 注意：每日检查（initDailyWord / checkDailyMoments / checkDailyAutoLetter）
        // 已移至 loadDataFromIDB 完成后的 runDailyChecks()，避免用默认数据覆盖 IndexedDB 真实数据

        // Dock栏点击（严格限制在 .dock-bar 内，避免误绑桌面 App 导致重复触发）
        var _dockBar = document.querySelector('.dock-bar');
        if (_dockBar) {
            var _dockSettings = _dockBar.querySelector('[data-app="settings"]');
            if (_dockSettings) _dockSettings.addEventListener('click', openGlobalSettings);
            var _dockStorage = _dockBar.querySelector('[data-app="storage"]');
            if (_dockStorage) _dockStorage.addEventListener('click', openStorageApp);
        }
        /* 词库管理：函数定义在后续 script 块，延迟绑定避免 ReferenceError */
        setTimeout(function() {
            var wlEl = document.querySelector('[data-app="wordlib"]');
            if (wlEl) wlEl.addEventListener('click', function() {
                if (typeof openWordLibApp === 'function') openWordLibApp();
            });
        }, 0);
        /* 次元购物城：函数定义在后续 script 块，延迟绑定避免 ReferenceError */
        setTimeout(function() {
            var shopEl = document.querySelector('[data-app="shop"]');
            if (shopEl && !shopEl._shopBound) {
                shopEl._shopBound = true;
                shopEl.addEventListener('click', function() {
                    if (typeof openShopApp === 'function') openShopApp();
                });
            }
        }, 0);

        // 模拟日记回复 + 定时检查朋友圈/信件
        setInterval(() => {
            if (document.getElementById('diaryPage').style.display === 'flex') return;
            if (Math.random() < 0.01) checkDailyDiary();
            checkDailyMoments();
            checkDailyAutoLetter();
        }, 60000);

        // 定时自动保存数据（每2分钟），防止意外退出导致数据丢失
        setInterval(() => {
            try { if (_idbReady) saveData(); } catch(e) {}
        }, 120000);

    }

    init();

    // ================================================================
    // 后台保活系统：SW注册 + 离开补发 + Wake Lock + 系统通知
    // ================================================================
    var _lastVisibleTime = Date.now();   // 上次页面可见的时间戳
    var _lastLeaveTime = null;           // 上次离开聊天的时间戳
    var _lastSeenMsgTime = Date.now();   // 用户最后看到的消息时间戳（用于返回前台时检测未读消息）
    var _notifiedMsgIds = loadNotifiedMsgIds(); // 已通知过的消息ID集合，持久化防止重复通知
    var _wakeLock = null;                // Wake Lock 句柄
    var _swReady = false;                // SW 是否就绪

    function loadNotifiedMsgIds(){
        try{
            var v=localStorage.getItem('qianyi_notified_msg_ids');
            if(v) return new Set(JSON.parse(v));
        }catch(e){}
        return new Set();
    }
    function saveNotifiedMsgIds(){
        try{
            var arr=Array.from(_notifiedMsgIds);
            if(arr.length>300) arr=arr.slice(-200);
            localStorage.setItem('qianyi_notified_msg_ids',JSON.stringify(arr));
        }catch(e){}
    }
    function markMsgNotified(id){
        if(!id) return;
        _notifiedMsgIds.add(id);
        if(_notifiedMsgIds.size>300){
            var arr=Array.from(_notifiedMsgIds);
            _notifiedMsgIds=new Set(arr.slice(-200));
        }
        saveNotifiedMsgIds();
    }
    function isMsgNotified(id){ return id && _notifiedMsgIds.has(id); }

    // ===== 注册 Service Worker =====
    if ('serviceWorker' in navigator) {
        var _swReloaded = false; // 防止 controllerchange 重复刷新
        var _hadControllerAtStart = !!navigator.serviceWorker.controller; // 区分"首次安装"与"有更新"
        // 提前注册消息监听器，确保 SW 发来的消息不会因注册延迟而丢失
        navigator.serviceWorker.addEventListener('message', function(event) {
            var msg = event.data;
            if (!msg) return;
            if (msg.type === 'WAKE_UP') { catchUpBackgroundMessages(); }
            if (msg.type === 'NOTIF_CLICK') {
                // 使用 SW 通知中携带的联系人 ID 恢复正确的聊天上下文
                if (msg.contactId) _notifContactId = msg.contactId;
                // 同步写入通知元素的 dataset，避免旧站内弹窗残留的 contactId 导致点错聊天
                var _ncEl = document.getElementById('chatNotification');
                if (_ncEl && msg.contactId) _ncEl.dataset.contactId = msg.contactId;
                openChatFromNotification();
            }
        });
        // 控制器变更（新 SW 接管）：仅静默接管，【不再自动刷新页面】。
        // 旧逻辑在 controllerchange 时调用 location.reload()，叠加下方无节流的
        // visibilitychange→reg.update()，在安卓上会形成"检测更新→skipWaiting→接管→刷新"
        // 的死循环：界面在旧版/新版间反复闪烁，滑动中途被强制刷新、甚至被踢回桌面。
        // 新 SW 静默激活后，最新前端资源在用户下一次自然访问时由浏览器 HTTP 缓存校验生效。
        navigator.serviceWorker.addEventListener('controllerchange', function() {
            // 仅记录接管事件，不刷新页面，彻底打断刷新死循环
        });
        window.addEventListener('load', function() {
            // 自动时间戳：每个构建版本首次访问时用 Date.now() 生成一次并缓存到 localStorage，
            // 同一构建内复用同一时间戳（避免每次刷新都注册新 SW 导致 iOS 无限刷新）。
            // 发布新版本时修改 _SW_BUILD 即可触发所有用户重新拉取最新 SW，
            // 解决苹果用户因 sw.js 被缓存而必须开梯子才能访问的问题。
            var _SW_BUILD = '20260808a';
            var _SW_TS_KEY = 'swRegTs_' + _SW_BUILD;
            var _SW_TS = '';
            try { _SW_TS = localStorage.getItem(_SW_TS_KEY) || ''; } catch(e) {}
            if (!_SW_TS) {
                _SW_TS = String(Date.now());
                try {
                    localStorage.setItem(_SW_TS_KEY, _SW_TS);
                    for (var _k in localStorage) {
                        if (/^swRegTs_/.test(_k) && _k !== _SW_TS_KEY) { try { localStorage.removeItem(_k); } catch(e){} }
                    }
                } catch(e) {}
            }
            // updateViaCache:'none' 确保每次都向服务器校验 sw.js 是否更新
            navigator.serviceWorker.register('./sw.js?v=' + _SW_TS, { scope: './', updateViaCache: 'none' })
                .then(function(reg) {
                    _swReady = true;
                    // 尝试注册 Periodic Sync（实验性，大部分浏览器不支持也不报错）
                    if ('periodicSync' in reg) {
                        reg.periodicSync.register('qianyi-periodic', {
                            minInterval: 12 * 60 * 60 * 1000  // 最小12小时
                        }).catch(function(){});
                    }

                    // ===== PWA 自动更新（静默模式）=====
                    // SW 在 install 中已调用 self.skipWaiting()，新版本会自动激活；
                    // 配合上方 controllerchange 的"不刷新"策略，整个更新过程在后台静默完成，
                    // 不再打断用户操作。最新前端资源在用户下一次自然访问时由浏览器 HTTP 缓存校验生效。
                    // （移除原先 updatefound→SKIP_WAITING→controllerchange→reload 的链路，
                    //   该链路在安卓上导致反复刷新与强制回桌面；同时移除页面加载即触发的 _triggerSkipWaiting。）
                })
                .catch(function(err) {
                    console.warn('[PWA] SW注册失败:', err);
                });
        });
        // 从后台切回前台时检查更新——【严格节流：每小时最多一次】。
        // 原实现无节流，安卓上频繁的 visibilitychange（输入法弹收、浏览器顶栏显隐、切换应用）
        // 会反复触发 reg.update()，叠加旧的 controllerchange→reload 形成刷新死循环。
        var _SW_LAST_UPDATE_KEY = 'swLastUpdateCheck';
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState !== 'visible' || !navigator.serviceWorker.controller) return;
            try {
                var last = parseInt(localStorage.getItem(_SW_LAST_UPDATE_KEY) || '0', 10);
                if (Date.now() - last < 60 * 60 * 1000) return; // 1 小时内不再检查
                localStorage.setItem(_SW_LAST_UPDATE_KEY, String(Date.now()));
            } catch(e) {}
            navigator.serviceWorker.getRegistration().then(function(reg) {
                if (reg) { try { reg.update(); } catch(e) {} }
            }).catch(function(){});
        });
    }

    // ===== 向 Service Worker 发送通知请求 =====
    function sendSWNotification(title, body, tag) {
        if (!_swReady || !navigator.serviceWorker.controller) return;
        navigator.serviceWorker.controller.postMessage({
            type: 'NOTIFY',
            title: title,
            body: body,
            tag: tag || 'qianyi-msg',
            icon: appData.chatSettings.otherAvatar || undefined,
            data: { contactId: _notifContactId || _lastChatContactId }
        });
    }

    // ===== 页面可见性变化：记录离开/返回时间 =====
    document.addEventListener('visibilitychange', function() {
        // 只要开启了「消息通知」或「后台保活」或「对方主动发消息」，都需记录离开时间以便回来补发通知
        var _needTrack = appData.globalSettings && (appData.globalSettings.keepAliveEnabled || appData.globalSettings.notificationEnabled || (appData.chatSettings && appData.chatSettings.proactiveEnable));
        if (document.hidden) {
            // 页面被隐藏（切后台、最小化、锁屏）—— 立即保存数据，防止后台被系统杀死导致数据丢失
            try { if (_idbReady) saveDataSync(); } catch(e) {}
            if (_needTrack) {
                _lastLeaveTime = Date.now();
                // 记录离开前最后看到的消息时间戳
                var hist = appData.chatHistory;
                if (hist && hist.length > 0) {
                    _lastSeenMsgTime = hist[hist.length - 1].id || Date.now();
                }
            }
        } else {
            // 页面重新可见
            if (appData.globalSettings && appData.globalSettings.keepAliveEnabled) {
                requestWakeLock();
                // 恢复静音音频 / Web Audio
                startSilentAudioKeepAlive();
            }
            if (_needTrack) {
                // 返回前台时补发离开期间应产生的消息（触发顶部通知）
                catchUpBackgroundMessages();
            }
            // 返回前台时检查所有待处理的定时任务（双人日记通知、dd回复、日记/信件回复、每日自动写信、相册寄语自动留言）
            setTimeout(function() {
                try { if (typeof checkDoubleDiaryNotification === 'function') checkDoubleDiaryNotification(); } catch(e) {}
                try { if (typeof checkPendingSummons === 'function') checkPendingSummons(); } catch(e) {}
                try { if (typeof checkPendingDiaryReplies === 'function') checkPendingDiaryReplies(); } catch(e) {}
                try { if (typeof checkPendingLetterReplies === 'function') checkPendingLetterReplies(); } catch(e) {}
                try { if (typeof checkDailyAutoLetter === 'function') checkDailyAutoLetter(); } catch(e) {}
                try { if (typeof processPendingMomentActions === 'function') processPendingMomentActions(); } catch(e) {}
                try { if (typeof checkAutoMessages === 'function') checkAutoMessages(); } catch(e) {}
            }, 500);
        }
    });

    // 备选：pagehide 事件作为 visibilitychange 的补充（部分移动浏览器 visibilitychange 不可靠）
    window.addEventListener('pagehide', function() {
        // 立即保存数据，防止移动端浏览器回收页面导致数据丢失
        try { if (_idbReady) saveDataSync(); } catch(e) {}
        var _needTrack = appData.globalSettings && (appData.globalSettings.keepAliveEnabled || appData.globalSettings.notificationEnabled || (appData.chatSettings && appData.chatSettings.proactiveEnable));
        if (_needTrack && !_lastLeaveTime) {
            _lastLeaveTime = Date.now();
            var hist = appData.chatHistory;
            if (hist && hist.length > 0) {
                _lastSeenMsgTime = hist[hist.length - 1].id || Date.now();
            }
        }
    });

    // ===== 补发后台消息 =====
    // 用户离开期间，根据设置补发消息并触发通知
    function catchUpBackgroundMessages() {
        if (!appData.globalSettings) return;
        var _anyEnabled = appData.globalSettings.keepAliveEnabled || appData.globalSettings.notificationEnabled || (appData.chatSettings && appData.chatSettings.proactiveEnable);
        if (!_anyEnabled) return;
        if (!_lastLeaveTime) {
            _lastLeaveTime = _lastVisibleTime;
        }
        var now = Date.now();
        var awayMs = now - _lastLeaveTime;
        _lastVisibleTime = now;
        _lastLeaveTime = null;

        var s = appData.chatSettings;

        // ===== 第一步：检查离开期间是否有已生成的未读消息（主动消息定时器可能在后台已触发） =====
        // 这一步不依赖 proactiveEnable，只要有通知开启就检查
        if (appData.globalSettings.notificationEnabled) {
            // 临时切换到最后聊天的联系人上下文，检查该联系人的未读消息
            var _savedCatchUpId = _activeContactId;
            if (_lastChatContactId) _activeContactId = _lastChatContactId;
            var hist = appData.chatHistory;
            if (hist && hist.length > 0) {
                // 找出离开期间收到的对方消息
                var unseenMsgs = [];
                for (var i = hist.length - 1; i >= 0; i--) {
                    var m = hist[i];
                    if (m.id && m.id > _lastSeenMsgTime && m.sender === 'other' && !_notifiedMsgIds.has(m.id)) {
                        unseenMsgs.unshift(m);
                    } else if (m.id && m.id <= _lastSeenMsgTime) {
                        break; // 到达已看过的消息，停止
                    }
                }
                // 如果有未读消息，逐条通知（保证每条只通知一次）
                if (unseenMsgs.length > 0) {
                    unseenMsgs.forEach(function(m, idx){
                        // 跳过已通知过的消息
                        if(isMsgNotified(m.id)) return;
                        // 先标记，防止 WAKE_UP 重复触发时重复处理同一条消息
                        markMsgNotified(m.id);
                        // 延迟一点确保页面已渲染，并错开多条通知
                        setTimeout(function() {
                            // 直接调用原始站内通知逻辑（跳过增强版的防重复检查，因为已在此处标记过）
                            if (typeof _originalShowChatNotification === 'function') {
                                _originalShowChatNotification(m);
                            }
                            // 同时发送系统通知（页面在后台时）
                            if (document.hidden && appData.globalSettings && appData.globalSettings.notificationEnabled && ('Notification' in window) && Notification.permission === 'granted') {
                                var _name = (appData.chatSettings && appData.chatSettings.otherNickname) || '对方';
                                var _body = '';
                                if (m.type === 'emoji') _body = '[表情包]';
                                else if (m.type === 'image') _body = '[图片]';
                                else if (m.type === 'transfer') _body = '[转账] ¥' + m.amount;
                                else _body = m.content || '[消息]';
                                if (_swReady && navigator.serviceWorker.controller) {
                                    sendSWNotification(_name, _body, 'qianyi-msg-' + m.id);
                                } else {
                                    try {
                                        var _sn = new Notification(_name, {
                                            body: _body, tag: 'qianyi-msg-' + m.id,
                                            icon: (appData.chatSettings && appData.chatSettings.otherAvatar) || undefined,
                                            data: { contactId: (m && m.contactId) || _notifContactId || _lastChatContactId }
                                        });
                                        _sn.onclick = function() { window.focus(); _notifContactId = (m && m.contactId) || _notifContactId || _lastChatContactId; openChatFromNotification(); _sn.close(); };
                                    } catch(e) {}
                                }
                            }
                        }, 300 + idx * 600);
                    });
                }
            }
            // 更新最后看到的消息时间
            if (hist && hist.length > 0) {
                _lastSeenMsgTime = hist[hist.length - 1].id || Date.now();
            }
            _activeContactId = _savedCatchUpId; // 恢复
        }

        // ===== 第二步：如果开启了主动发消息，根据离开时长补发消息 =====
        if (!s.proactiveEnable) return;
        // 离开不到30秒不补发
        if (awayMs < 30000) return;

        // 计算离开期间应产生多少条主动消息
        var minMs = Math.max(1, s.proactiveMinSec || 30) * 1000;
        var maxMs = Math.max(minMs, (s.proactiveMaxMin || 5) * 60 * 1000);
        var avgInterval = (minMs + maxMs) / 2;
        var catchUpCount = Math.min(Math.floor(awayMs / avgInterval), 5);  // 最多补5条

        if (catchUpCount <= 0) return;

        var allCards = getAllVisibleWordCards();
        if (allCards.length === 0) return;

        var otherName = s.otherNickname || '对方';
        // 捕获联系人上下文，确保补发消息写入正确的聊天记录
        var _catchUpContactId = _activeContactId || _lastChatContactId;
        // 免打扰模式下不补发主动消息
        if (_catchUpContactId) {
            var _catchUpContact = _findContactById(_catchUpContactId);
            if (_catchUpContact && _catchUpContact.doNotDisturb) return;
        }
        // 逐条补发，每条间隔一小段时间模拟真实节奏
        for (var i = 0; i < catchUpCount; i++) {
            (function(idx) {
                setTimeout(function() {
                    // 恢复联系人上下文，使补发消息写入正确的聊天记录
                    var _savedId = _activeContactId;
                    _activeContactId = _catchUpContactId;
                    var text;
                    if (s.enableSplice && Math.random() > 0.5) {
                        var spliceCount = Math.min(Math.floor(Math.random() * 3) + 1, allCards.length);
                        var shuffled = allCards.slice().sort(function() { return 0.5 - Math.random(); });
                        text = shuffled.slice(0, spliceCount).join(' ');
                    } else {
                        text = allCards[Math.floor(Math.random() * allCards.length)];
                    }
                    addMessage({
                        id: Date.now() + idx,
                        sender: 'other',
                        type: 'text',
                        content: text
                    });
                    _activeContactId = _savedId;
                }, idx * 800);
            })(i);
        }
        // 补发后重新调度主动消息定时器，确保后续定时消息继续产生
        scheduleProactiveMessage();
    }

    // ===== Wake Lock：防止屏幕息屏 =====
    async function requestWakeLock() {
        // 后台保活开关未开启则不请求唤醒锁
        if (!appData.globalSettings || !appData.globalSettings.keepAliveEnabled) return;
        if (!('wakeLock' in navigator)) return;
        try {
            _wakeLock = await navigator.wakeLock.request('screen');
            // Wake Lock 释放后（如切换标签页），重新获取
            _wakeLock.addEventListener('release', function() {
                _wakeLock = null;
            });
            console.log('[保活] Wake Lock 已获取');
        } catch (err) {
            // 唤醒锁请求失败（用户未授权或浏览器不支持），静默处理
            console.warn('[保活] Wake Lock 请求失败:', err);
        }
    }

    // 页面重新可见时重新获取 Wake Lock
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && _wakeLock === null && appData.globalSettings && appData.globalSettings.keepAliveEnabled) {
            requestWakeLock();
        }
    });

    // ===== 增强版站内通知：同时触发系统通知 =====
    // 重写 showChatNotification，在原有站内弹窗基础上增加系统通知
    var _originalShowChatNotification = showChatNotification;
    // 重写 showChatNotification：站内通知与系统（后台）通知严格分离
    //   - 前台且不在聊天界面 → 仅显示站内弹窗，【不】发送系统通知
    //   - 前台且在聊天界面 → 不通知（用户正在聊天）
    //   - 后台（document.hidden）→ 仅发送系统通知，【不】显示站内弹窗
    //   （修复此前“站内+站外同时通知”，以及“从聊天页切到后台后回复不通知”的问题）
    showChatNotification = function(msg) {
        // 防重复通知：如果该消息已经通知过，直接跳过
        if (msg && msg.id && isMsgNotified(msg.id)) return;
        // 标记已通知（在调用逻辑前标记，避免并发时重复）
        if (msg && msg.id) markMsgNotified(msg.id);
        // 记录通知对应的联系人 ID，便于点击系统通知时恢复正确的聊天上下文
        _notifContactId = (msg && msg.contactId) || _activeContactId || _lastChatContactId || _notifContactId || null;
        var _hidden = document.hidden;
        var _onChatPage = document.getElementById('chatPage') && document.getElementById('chatPage').style.display === 'flex';
        if (_hidden) {
            // 后台：仅发送系统（站外）通知，不显示站内弹窗
            if (appData.globalSettings && appData.globalSettings.notificationEnabled && ('Notification' in window) && Notification.permission === 'granted') {
                var name = appData.chatSettings.otherNickname || '对方';
                var body = '';
                if (msg.type === 'emoji') body = '[表情包]';
                else if (msg.type === 'image') body = '[图片]';
                else if (msg.type === 'transfer') body = '[转账] ¥' + msg.amount;
                else if (msg.type === 'blindCard') body = '[盲选抽牌] ' + msg.question;
                else if (msg.type === 'shopShareCard') body = '[购物卡片] ' + (msg.title || '');
                else body = msg.content || '[消息]';
                // 优先通过 SW 发送系统通知（支持后台通知和点击跳转）
                if (_swReady && navigator.serviceWorker.controller) {
                    sendSWNotification(name, body, 'qianyi-msg-' + msg.id);
                } else {
                    // SW 不可用时，直接使用 Notification API 发送系统通知
                    try {
                        var sysNotif = new Notification(name, {
                            body: body,
                            tag: 'qianyi-msg-' + msg.id,
                            icon: appData.chatSettings.otherAvatar || undefined,
                            data: { contactId: (msg && msg.contactId) || _notifContactId || _lastChatContactId }
                        });
                        sysNotif.onclick = function() {
                            window.focus();
                            // Bug7修复：使用消息自身的 contactId，不回退到可能被覆盖的全局 _notifContactId
                            _notifContactId = (msg && msg.contactId) || (sysNotif.data && sysNotif.data.contactId) || _lastChatContactId;
                            var _nel = document.getElementById('chatNotification');
                            if (_nel) _nel.dataset.contactId = _notifContactId || '';
                            openChatFromNotification();
                            sysNotif.close();
                        };
                    } catch(e) { console.warn('系统通知发送失败:', e); }
                }
            }
        } else {
            // 前台：仅显示站内弹窗（不在聊天界面时），不发送系统通知
            if (!_onChatPage) {
                _originalShowChatNotification(msg);
            }
        }
    };

    // ===== 保活心跳：每30秒向 SW 发送心跳 =====
    setInterval(function() {
        if (_swReady && navigator.serviceWorker.controller && appData.globalSettings && appData.globalSettings.keepAliveEnabled) {
            navigator.serviceWorker.controller.postMessage({ type: 'ALIVE' });
        }
    }, 30000);

    // ===== 离开聊天页时释放 Wake Lock =====
    var _originalCloseChat = closeChat;
    if (typeof _originalCloseChat === 'function') {
        closeChat = function() {
            _originalCloseChat();
            if (_wakeLock) {
                _wakeLock.release().catch(function(){});
                _wakeLock = null;
            }
        };
    }

    // ===== 打开聊天页时请求 Wake Lock =====
    var _originalOpenChat = openChat;
    if (typeof _originalOpenChat === 'function') {
        openChat = function() {
            _originalOpenChat();
            if (appData.globalSettings && appData.globalSettings.keepAliveEnabled) {
                requestWakeLock();
            }
        };
    }


    // ===== 自定义字体管理 =====
    if (!appData.customFonts) { appData.customFonts = []; }

    function uploadCustomFont(target) {
        currentEditType = 'customFont_' + target;
        document.getElementById('fontFileInput').click();
    }

    function handleCustomFontUpload(event, target) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            const base64 = ev.target.result;
            const fontName = 'customFont_' + Date.now();
            const fontRecord = {
                id: fontName,
                name: file.name,
                data: base64,
                target: 'shared'
            };
            // 检查是否超过10个字体
            if (appData.customFonts.length >= 10) {
                alert('最多保存10个字体，请先删除不需要的字体');
                return;
            }
            appData.customFonts.push(fontRecord);
            applyFontFace('customFont_' + fontName, fontName, base64);
            // 自动应用最新的字体到对应目标
            applyCustomFontToTarget(target, fontName);
            saveData();
            renderCustomFontList('global');
            renderCustomFontList('diary');
            renderCustomFontList('letter');
            renderCustomFontList('chat');
            renderCustomFontList('album');
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    }

    function applyCustomFontToTarget(target, fontName) {
        const font = appData.customFonts.find(f => f.id === fontName);
        if (!font) return;
        if (target === 'global') {
            appData.globalSettings.fontFamily = fontName;
            appData.globalSettings.fontData = font.data;
            applyFontFace('globalFontStyle', fontName, font.data);
            applyGlobalSettings();
            const preview = document.getElementById('globalFontPreview');
            if (preview) preview.textContent = font.name;
        } else if (target === 'diary') {
            appData.diary.settings.fontFamily = fontName;
            appData.diary.settings.fontData = font.data;
            applyFontFace('diaryFontStyle', fontName, font.data);
            renderDiaryList();
        } else if (target === 'letter') {
            appData.letter.settings.fontFamily = fontName;
            appData.letter.settings.fontData = font.data;
            applyFontFace('letterFontStyle', fontName, font.data);
            renderLetterList();
        } else if (target === 'chat') {
            applyFontFace('bubbleFontStyle', fontName, font.data);
            document.documentElement.style.setProperty('--bubble-font-family', fontName);
            appData.chatSettings.bubbleFont = font.data;
            appData.chatSettings.bubbleFontName = fontName;
            const nameEl = document.getElementById('bubbleFontName');
            if (nameEl) nameEl.textContent = '当前字体: ' + font.name;
            renderMessages();
            updateBubbleSettingsPreview();
        } else if (target === 'album') {
            if (!appData.albumData) appData.albumData = {};
            if (!appData.albumData.settings) appData.albumData.settings = {};
            /* 相册字体以原始数据(URL 或 base64)存储，由 applyAlbumSettings 注册 AlbumCustomFont */
            appData.albumData.settings.fontFamily = font.data;
            if (typeof window.albumApplySettings === 'function') window.albumApplySettings();
        }
        saveData();
    }

    function deleteCustomFont(fontId, target) {
        const idx = appData.customFonts.findIndex(f => f.id === fontId);
        if (idx === -1) return;
        const font = appData.customFonts[idx];
        // 如果当前正在使用该字体，重置为默认
        if (appData.globalSettings.fontFamily === fontId) {
            resetGlobalFont();
        }
        if (appData.diary.settings.fontFamily === fontId) {
            resetDiaryFont();
        }
        if (appData.letter.settings.fontFamily === fontId) {
            resetLetterFont();
        }
        if (appData.chatSettings.bubbleFontName === fontId) {
            resetBubbleFont();
        }
        // 相册以原始数据存储字体，匹配 font.data
        if (appData.albumData && appData.albumData.settings && appData.albumData.settings.fontFamily === font.data) {
            if (typeof window.albumResetFont === 'function') window.albumResetFont();
        }
        // 移除 font-face 样式
        const styleEl = document.getElementById('customFont_' + fontId);
        if (styleEl) styleEl.remove();
        appData.customFonts.splice(idx, 1);
        saveData();
        renderCustomFontList('global');
        renderCustomFontList('diary');
        renderCustomFontList('letter');
        renderCustomFontList('chat');
        renderCustomFontList('album');
    }

    function renderCustomFontList(target) {
        const container = document.getElementById('customFontList_' + target);
        if (!container) return;
        const fonts = appData.customFonts.filter(f => f.target === 'shared' || f.target === target);
        if (fonts.length === 0) { container.innerHTML = ''; return; }
        let html = '<div style="display:flex;flex-direction:column;gap:4px;">';
        fonts.forEach(f => {
            const isCurrent = (target === 'global' && appData.globalSettings.fontFamily === f.id) ||
                               (target === 'diary' && appData.diary.settings.fontFamily === f.id) ||
                               (target === 'letter' && appData.letter.settings.fontFamily === f.id) ||
                               (target === 'chat' && appData.chatSettings.bubbleFontName === f.id) ||
                               (target === 'album' && appData.albumData && appData.albumData.settings && appData.albumData.settings.fontFamily === f.data);
            html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px;background:#f8f8f8;border-radius:6px;font-size:12px;">';
            html += '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' + (isCurrent ? 'color:#1a1a1a;font-weight:bold;' : 'color:#666;') + '">' + f.name + (isCurrent ? ' (使用中)' : '') + '</span>';
            html += '<div style="display:flex;gap:4px;flex-shrink:0;">';
            if (!isCurrent) {
                html += '<button onclick="applyCustomFontToTarget(\'' + target + '\',\'' + f.id + '\')" style="padding:2px 8px;background:#e0e0e0;border:none;border-radius:4px;font-size:11px;cursor:pointer;">使用</button>';
            }
            html += '<button onclick="deleteCustomFont(\'' + f.id + '\',\'' + target + '\')" style="padding:2px 8px;background:#ffe0e0;border:none;border-radius:4px;font-size:11px;cursor:pointer;color:#d00;">删除</button>';
            html += '</div></div>';
        });
        html += '</div>';
        container.innerHTML = html;
    }


// ===== iOS 输入辅助栏隐藏 =====
// iOS Safari 在 input/textarea focus 时会显示带"完成"按钮的工具栏
// 此方案通过在 focus 时创建临时 input 转移焦点来阻止 accessory bar 显示
(function() {
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!isIOS) return;
    
    // 监听所有 input/textarea 的 focus 事件
    document.addEventListener('focusin', function(e) {
        var target = e.target;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return;
        // 设置 autocomplete=off 和 autocorrect=off 防止 iOS 弹出额外工具栏
        target.setAttribute('autocomplete', 'off');
        target.setAttribute('autocorrect', 'off');
        target.setAttribute('autocapitalize', 'off');
        target.setAttribute('spellcheck', 'false');
    }, true);
})();


// ===== 写歌App：自定义返回键/菜单键 =====
var _swCustomBackImg = '';
var _swCustomMenuImg = '';
function swUploadCustomBack() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            _swCustomBackImg = ev.target.result;
            if(window.saveImgDB){ window.saveImgDB('_swCustomBackImg', _swCustomBackImg); }
            else { try { localStorage.setItem('_swCustomBackImg', _swCustomBackImg); } catch(e) {} }
            swApplyCustomButtons();
            alert('返回键图片已更新');
        };
        reader.readAsDataURL(file);
    };
    input.click();
}
function swResetCustomBack() {
    _swCustomBackImg = '';
    if(window.removeImgDB){ window.removeImgDB('_swCustomBackImg'); } else { try { localStorage.removeItem('_swCustomBackImg'); } catch(e) {} }
    swApplyCustomButtons();
    alert('返回键已恢复默认');
}
function swUploadCustomMenu() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            _swCustomMenuImg = ev.target.result;
            if(window.saveImgDB){ window.saveImgDB('_swCustomMenuImg', _swCustomMenuImg); }
            else { try { localStorage.setItem('_swCustomMenuImg', _swCustomMenuImg); } catch(e) {} }
            swApplyCustomButtons();
            alert('菜单键图片已更新');
        };
        reader.readAsDataURL(file);
    };
    input.click();
}
function swResetCustomMenu() {
    _swCustomMenuImg = '';
    if(window.removeImgDB){ window.removeImgDB('_swCustomMenuImg'); } else { try { localStorage.removeItem('_swCustomMenuImg'); } catch(e) {} }
    swApplyCustomButtons();
    alert('菜单键已恢复默认');
}
function swApplyCustomButtons() {
    var backEl = document.querySelector('.sw-tb-back');
    var menuEl = document.querySelector('.sw-tb-menu');
    if (backEl) {
        if (_swCustomBackImg) {
            backEl.style.backgroundImage = 'url(' + _swCustomBackImg + ')';
            backEl.style.backgroundSize = 'cover';
            backEl.style.backgroundPosition = 'center';
            backEl.innerHTML = '';
        } else {
            backEl.style.backgroundImage = '';
            backEl.innerHTML = '\u2039';
        }
    }
    if (menuEl) {
        if (_swCustomMenuImg) {
            menuEl.style.backgroundImage = 'url(' + _swCustomMenuImg + ')';
            menuEl.style.backgroundSize = 'cover';
            menuEl.style.backgroundPosition = 'center';
            menuEl.innerHTML = '';
        } else {
            menuEl.style.backgroundImage = '';
            menuEl.innerHTML = '\u22ee';
        }
    }
}
// 初始化：从 localStorage 恢复自定义按钮
try {
    _swCustomBackImg = localStorage.getItem('_swCustomBackImg') || '';
    _swCustomMenuImg = localStorage.getItem('_swCustomMenuImg') || '';
} catch(e) {}
// 异步从 IndexedDB 恢复（如果 localStorage 中没有）
if(window.loadImgDB){
    window.loadImgDB('_swCustomBackImg', function(v){ if(v && !_swCustomBackImg){ _swCustomBackImg=v; swApplyCustomButtons(); } });
    window.loadImgDB('_swCustomMenuImg', function(v){ if(v && !_swCustomMenuImg){ _swCustomMenuImg=v; swApplyCustomButtons(); } });
}



// ===== 通用右滑退出手势 =====
function bindSwipeRightToExit(pageEl, exitFn) {
    if (!pageEl || pageEl.dataset.swipeBound === '1') return;
    pageEl.dataset.swipeBound = '1';
    var sx = 0, sy = 0, tracking = false;
    pageEl.addEventListener('touchstart', function(e) {
        var t = e.touches[0];
        if (t.clientX < 30) { sx = t.clientX; sy = t.clientY; tracking = true; }
    }, { passive: true });
    pageEl.addEventListener('touchmove', function(e) {
        if (!tracking) return;
        var dx = e.touches[0].clientX - sx;
        var dy = e.touches[0].clientY - sy;
        if (Math.abs(dy) > Math.abs(dx)) { tracking = false; return; }
        if (dx > 0) {
            pageEl.style.transform = 'translateX(' + Math.min(dx, 120) + 'px)';
            pageEl.style.transition = 'none';
        }
    }, { passive: true });
    pageEl.addEventListener('touchend', function(e) {
        if (!tracking) return;
        var dx = (e.changedTouches[0].clientX) - sx;
        pageEl.style.transition = 'transform 0.25s ease';
        if (dx > 60) {
            pageEl.style.transform = 'translateX(100%)';
            setTimeout(function() { exitFn(); pageEl.style.transform = ''; pageEl.style.transition = ''; }, 250);
        } else {
            pageEl.style.transform = '';
            setTimeout(function() { pageEl.style.transition = ''; }, 260);
        }
        tracking = false;
    }, { passive: true });
}
// 绑定各App页面右滑退出
(function() {
    function bindAll() {
        var mappings = [
            ['#wordcardPage', 'closeWordCard'],
            ['#wordlibAppPage', 'closeWordLibApp'],
            ['#globalSettingsPage', 'closeGlobalSettings'],
            ['#storagePage', 'closeStorageApp'],
            ['#balanceAppPage', 'closeBalanceApp'],
            ['#contactListPage', 'closeContactList'],
            ['#beautifyPage', 'closeBeautifyApp'],
            ['#gobanAppPage', 'closeGobanApp'],
            ['#settingsPage', 'closeChatSettings']
        ];
        mappings.forEach(function(m) {
            var el = document.querySelector(m[0]);
            if (el && typeof window[m[1]] === 'function') {
                bindSwipeRightToExit(el, window[m[1]]);
            }
        });
    }
    if (document.readyState === 'complete') bindAll();
    else window.addEventListener('load', bindAll);
})();

// ===== 第三页桌面：音乐悬浮框 / 吧唧 / App交换 =====
(function(){
  var P3KEY='p3_layout_v1', BADGEKEY='p3_badge_img';
  // 图片压缩：避免吧唧/音乐组件背景图占满 localStorage
  function compressP3Image(dataUrl, maxWidth, maxHeight, quality, cb){
    maxWidth=maxWidth||800; maxHeight=maxHeight||800; quality=quality||0.82;
    var img=new Image();
    img.onload=function(){
      var w=img.width, h=img.height;
      if(w>maxWidth||h>maxHeight){ var r=Math.min(maxWidth/w,maxHeight/h); w=Math.floor(w*r); h=Math.floor(h*r); }
      var cvs=document.createElement('canvas'); cvs.width=w||1; cvs.height=h||1;
      var ctx=cvs.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,cvs.width,cvs.height); ctx.drawImage(img,0,0,cvs.width,cvs.height);
      cb(cvs.toDataURL('image/jpeg', quality));
    };
    img.onerror=function(){ cb(dataUrl); };
    img.src=dataUrl;
  }
  function loadLayout(){ try{var v=localStorage.getItem(P3KEY); if(v) return JSON.parse(v);}catch(e){} return {order:['listentogether','tarot','ta','wordlib']}; }
  function saveLayout(){ try{localStorage.setItem(P3KEY,JSON.stringify(layout));}catch(e){} }
  var layout=loadLayout();
  var page=document.querySelector('.desktop-page.page-3');
  if(!page) return;
  var music=page.querySelector('#p3MusicWidget');
  var badge=page.querySelector('#p3Polaroids');
  var grid=page.querySelector('#p3AppGrid');
  // 恢复学生证大小
  var _sidSize=parseInt(localStorage.getItem('p3_sid_size')||'180',10);
  if(_sidSize) document.documentElement.style.setProperty('--p3-sid-w',_sidSize+'px');
  // 点击底部小圆点切换页面
  document.querySelectorAll('.page-dot').forEach(function(dot){
    dot.addEventListener('click',function(){ currentPage=parseInt(dot.dataset.page,10)||0; updatePage(); });
  });
  // 恢复App顺序
  if(grid){
    var map={};
    grid.querySelectorAll('.app-item').forEach(function(it){ map[it.dataset.app]=it; });
    layout.order.forEach(function(k){ if(map[k]) grid.appendChild(map[k]); });
  }
  function p3Toast(msg){
    var existing = document.querySelector('.p3-toast');
    if (existing) {
      existing.textContent = msg;
      existing.classList.remove('show');
      void existing.offsetWidth;
      existing.classList.add('show');
      if (existing._p3ToastTimer) clearTimeout(existing._p3ToastTimer);
    } else {
      var t = document.createElement('div');
      t.className = 'p3-toast';
      t.textContent = msg;
      document.body.appendChild(t);
      requestAnimationFrame(function(){ t.classList.add('show'); });
      existing = t;
    }
    existing._p3ToastTimer = setTimeout(function(){
      var el = document.querySelector('.p3-toast');
      if (el) {
        el.classList.remove('show');
        setTimeout(function(){ if (el && el.parentNode) el.remove(); }, 300);
      }
    }, 1500);
  }

  // App交换（在全局 editing-mode 下拖动）
  if(grid){
    grid.querySelectorAll('.app-item').forEach(function(item){
      var dragItem=null,sx,sy,moved;
      item.addEventListener('pointerdown',function(e){
        if(!document.body.classList.contains('editing-mode')) return;
        dragItem=item; sx=e.clientX; sy=e.clientY; moved=false;
        try{item.setPointerCapture(e.pointerId);}catch(err){}
      });
      item.addEventListener('pointermove',function(e){
        if(!dragItem||dragItem!==item) return;
        if(Math.abs(e.clientX-sx)>6||Math.abs(e.clientY-sy)>6){ moved=true; item.classList.add('p3-dragging'); }
        grid.querySelectorAll('.app-item').forEach(function(it){it.classList.remove('p3-drop-target');});
        var over=document.elementFromPoint(e.clientX,e.clientY);
        var tgt=over?over.closest('.p3-app-grid .app-item'):null;
        if(tgt&&tgt!==item) tgt.classList.add('p3-drop-target');
      });
      item.addEventListener('pointerup',function(e){
        if(!dragItem) return;
        item.classList.remove('p3-dragging');
        if(moved){
          var over=document.elementFromPoint(e.clientX,e.clientY);
          var tgt=over?over.closest('.p3-app-grid .app-item'):null;
          if(tgt&&tgt!==item){ swapItems(item,tgt); }
        }
        grid.querySelectorAll('.app-item').forEach(function(it){it.classList.remove('p3-drop-target');});
        dragItem=null;
      });
    });
  }
  function swapItems(a,b){
    var parent=a.parentNode, ph=document.createElement('span');
    parent.insertBefore(ph,a);
    parent.insertBefore(a,b);
    parent.insertBefore(b,ph);
    parent.removeChild(ph);
    layout.order=Array.prototype.map.call(grid.querySelectorAll('.app-item'),function(it){return it.dataset.app;});
    saveLayout(); p3Toast('已交换位置');
  }

  // 拍立得组件：三个独立图片上传 + 改颜色 + 改大小
  if(badge){
    var POLAROIDKEYS=['p3_polaroid_img_0','p3_polaroid_img_1','p3_polaroid_img_2'];
    var POLAROIDCOLORKEY='p3_polaroid_color';
    var POLAROIDSIZEKEY='p3_polaroid_size';
    var polaroidItems=badge.querySelectorAll('.p3-polaroid-item');
    // 恢复颜色
    var savedColor=localStorage.getItem(POLAROIDCOLORKEY);
    if(savedColor){
      document.documentElement.style.setProperty('--p3-polaroid-bg',savedColor);
    }
    // 恢复大小
    var savedSize=parseInt(localStorage.getItem(POLAROIDSIZEKEY)||'140',10);
    if(savedSize){
      document.documentElement.style.setProperty('--p3-polaroid-w',savedSize+'px');
    }
    // 恢复每个拍立得的图片
    function setPolaroidItemImg(idx, src){
      var item=polaroidItems[idx];
      if(!item) return;
      var imgEl=item.querySelector('.p3-polaroid-item-img img');
      var phEl=item.querySelector('.p3-polaroid-item-ph');
      if(src){
        if(imgEl){ imgEl.src=src; imgEl.style.display='block'; }
        if(phEl) phEl.style.display='none';
      } else {
        if(imgEl){ imgEl.src=''; imgEl.style.display='none'; }
        if(phEl) phEl.style.display='';
      }
    }
    POLAROIDKEYS.forEach(function(key, idx){
      var saved=localStorage.getItem(key);
      if(saved) setPolaroidItemImg(idx, saved);
      if(window.loadImgDB){ window.loadImgDB(key, function(v){ if(v) setPolaroidItemImg(idx, v); }); }
    });
    // 点击单个拍立得：点击照片区域上传图片，点击其他区域打开设置
    polaroidItems.forEach(function(item, idx){
      item.addEventListener('click',function(e){
        if(document.body.classList.contains('editing-mode')) return;
        e.stopPropagation();
        // 点击照片区域 → 上传图片
        if(e.target.closest('.p3-polaroid-item-img')){
          var fileInput=document.createElement('input');
          fileInput.type='file'; fileInput.accept='image/*'; fileInput.style.display='none';
          document.body.appendChild(fileInput);
          fileInput.addEventListener('change',function(e){
            var f=e.target.files&&e.target.files[0]; if(!f) return;
            var r=new FileReader();
            r.onload=function(ev){
              compressP3Image(ev.target.result, 800, 800, 0.82, function(compressed){
                if(window.saveImgDB){
                  window.saveImgDB(POLAROIDKEYS[idx],compressed).then(function(ok){
                    if(!ok) p3Toast('图片存储失败，空间可能不足');
                  });
                }
                else {
                  try{localStorage.setItem(POLAROIDKEYS[idx],compressed);}
                  catch(err){
                    /* Bug6修复：localStorage 超限时降级到 IndexedDB，避免刷新后图片丢失 */
                    if(window.indexedDB){
                      try {
                        var _req=indexedDB.open('p3_img_db',1);
                        _req.onupgradeneeded=function(e){ e.target.result.createObjectStore('images'); };
                        _req.onsuccess=function(e){ var _db=e.target.result; var _tx=_db.transaction('images','readwrite'); _tx.objectStore('images').put(compressed,POLAROIDKEYS[idx]); };
                      } catch(e2){ p3Toast('存储空间不足'); return; }
                    } else { p3Toast('存储空间不足'); return; }
                  }
                }
                setPolaroidItemImg(idx, compressed);
              });
            };
            r.readAsDataURL(f);
            fileInput.remove();
          });
          fileInput.click();
        } else {
          // 点击非照片区域（边框、底部等）→ 打开大小和颜色设置
          showPolaroidSettings();
        }
      });
    });
    // 拍立得设置菜单函数
    function showPolaroidSettings(){
      var mask=document.createElement('div');
      mask.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:2500;display:flex;align-items:flex-end;justify-content:center;';
      var sheet=document.createElement('div');
      sheet.style.cssText='width:100%;max-width:430px;background:#fff;border-radius:16px 16px 0 0;padding:8px 0 calc(12px + env(safe-area-inset-bottom,0px));';
      sheet.innerHTML='<div style="padding:14px 18px;font-size:13px;color:#888;">拍立得组件</div>'
        +'<button data-act="color" style="display:block;width:100%;padding:14px 18px;font-size:15px;color:#000;background:none;border:none;text-align:left;cursor:pointer;">修改拍立得颜色</button>'
        +'<button data-act="size" style="display:block;width:100%;padding:14px 18px;font-size:15px;color:#000;background:none;border:none;text-align:left;cursor:pointer;">修改拍立得大小</button>'
        +'<button data-act="reset" style="display:block;width:100%;padding:14px 18px;font-size:15px;color:#000;background:none;border:none;text-align:left;cursor:pointer;">恢复全部默认</button>'
        +'<button data-act="cancel" style="display:block;width:100%;padding:14px 18px;font-size:15px;color:#888;background:none;border:none;text-align:left;cursor:pointer;margin-top:6px;border-top:1px solid #eee;">取消</button>';
      mask.appendChild(sheet); document.body.appendChild(mask);
      sheet.addEventListener('click',function(ev){
        var act=ev.target.getAttribute&&ev.target.getAttribute('data-act');
        if(act==='color'){
          mask.remove();
          var colorMask=document.createElement('div');
          colorMask.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:2500;display:flex;align-items:flex-end;justify-content:center;';
          var colorSheet=document.createElement('div');
          colorSheet.style.cssText='width:100%;max-width:430px;background:#fff;border-radius:16px 16px 0 0;padding:16px 18px calc(16px + env(safe-area-inset-bottom,0px));';
          var curColor=savedColor||'#1a1a1a';
          colorSheet.innerHTML='<div style="font-size:14px;font-weight:600;margin-bottom:12px;text-align:center;">拍立得颜色</div>'
            +'<div style="display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:16px;">'
            +'<input type="color" id="polaroidColorInput" value="'+curColor+'" style="width:50px;height:50px;border:none;border-radius:8px;cursor:pointer;"/>'
            +'<div style="display:flex;gap:6px;flex-wrap:wrap;">'
            +'<button data-c="#ffffff" style="width:32px;height:32px;border-radius:50%;background:#fff;border:2px solid #eee;cursor:pointer;"></button>'
            +'<button data-c="#fff5f5" style="width:32px;height:32px;border-radius:50%;background:#fff5f5;border:2px solid #eee;cursor:pointer;"></button>'
            +'<button data-c="#f0f8ff" style="width:32px;height:32px;border-radius:50%;background:#f0f8ff;border:2px solid #eee;cursor:pointer;"></button>'
            +'<button data-c="#f5fff0" style="width:32px;height:32px;border-radius:50%;background:#f5fff0;border:2px solid #eee;cursor:pointer;"></button>'
            +'<button data-c="#fff0f5" style="width:32px;height:32px;border-radius:50%;background:#fff0f5;border:2px solid #eee;cursor:pointer;"></button>'
            +'<button data-c="#fff9e6" style="width:32px;height:32px;border-radius:50%;background:#fff9e6;border:2px solid #eee;cursor:pointer;"></button>'
            +'<button data-c="#333333" style="width:32px;height:32px;border-radius:50%;background:#333;border:2px solid #eee;cursor:pointer;"></button>'
            +'</div></div>'
            +'<button data-act="confirm" style="display:block;width:100%;padding:12px;font-size:15px;color:#fff;background:#ff6b35;border:none;border-radius:10px;cursor:pointer;">确认</button>';
          colorMask.appendChild(colorSheet); document.body.appendChild(colorMask);
          var ci=document.getElementById('polaroidColorInput');
          colorSheet.querySelectorAll('[data-c]').forEach(function(btn){
            btn.addEventListener('click',function(){ if(ci) ci.value=btn.dataset.c; });
          });
          colorSheet.querySelector('[data-act="confirm"]').addEventListener('click',function(){
            var c=ci?ci.value:'#ffffff';
            savedColor=c;
            try{localStorage.setItem(POLAROIDCOLORKEY,c);}catch(e){}
            document.documentElement.style.setProperty('--p3-polaroid-bg',c);
            colorMask.remove(); p3Toast('已修改颜色');
          });
          colorMask.addEventListener('click',function(ev){ if(ev.target===colorMask) colorMask.remove(); });
        }
        else if(act==='size'){
          mask.remove();
          var sizeMask=document.createElement('div');
          sizeMask.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:2500;display:flex;align-items:flex-end;justify-content:center;';
          var sizeSheet=document.createElement('div');
          sizeSheet.style.cssText='width:100%;max-width:430px;background:#fff;border-radius:16px 16px 0 0;padding:16px 18px calc(16px + env(safe-area-inset-bottom,0px));';
          var curSize=savedSize||140;
          sizeSheet.innerHTML='<div style="font-size:14px;font-weight:600;margin-bottom:12px;text-align:center;">拍立得大小</div>'
            +'<div style="display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:16px;">'
            +'<input type="range" id="polaroidSizeInput" min="80" max="220" value="'+curSize+'" style="flex:1;"/>'
            +'<span id="polaroidSizeVal" style="font-size:14px;width:50px;text-align:right;">'+curSize+'px</span>'
            +'</div>'
            +'<button data-act="confirm" style="display:block;width:100%;padding:12px;font-size:15px;color:#fff;background:#ff6b35;border:none;border-radius:10px;cursor:pointer;">确认</button>';
          sizeMask.appendChild(sizeSheet); document.body.appendChild(sizeMask);
          var si=document.getElementById('polaroidSizeInput');
          var sv=document.getElementById('polaroidSizeVal');
          si.addEventListener('input',function(){ sv.textContent=si.value+'px'; });
          sizeSheet.querySelector('[data-act="confirm"]').addEventListener('click',function(){
            var v=parseInt(si.value,10)||140;
            savedSize=v;
            try{localStorage.setItem(POLAROIDSIZEKEY,v.toString());}catch(e){}
            document.documentElement.style.setProperty('--p3-polaroid-w',v+'px');
            sizeMask.remove(); p3Toast('已修改大小');
          });
          sizeMask.addEventListener('click',function(ev){ if(ev.target===sizeMask) sizeMask.remove(); });
        }
        else if(act==='reset'){
          POLAROIDKEYS.forEach(function(key, idx){
            if(window.removeImgDB){ window.removeImgDB(key); } else { try{localStorage.removeItem(key);}catch(e){} }
            setPolaroidItemImg(idx, null);
          });
          try{localStorage.removeItem(POLAROIDCOLORKEY);}catch(e){}
          try{localStorage.removeItem(POLAROIDSIZEKEY);}catch(e){}
          savedColor=null; savedSize=140;
          document.documentElement.style.setProperty('--p3-polaroid-bg','#1a1a1a');
          document.documentElement.style.setProperty('--p3-polaroid-w','140px');
          mask.remove(); p3Toast('已恢复默认');
        }
        else if(act==='cancel'){ mask.remove(); }
      });
      mask.addEventListener('click',function(ev){ if(ev.target===mask) mask.remove(); });
    }
  }

  // 音乐悬浮框：与「一起听歌」联动
  var mwSong=page.querySelector('#p3MwSong');
  var mwFill=page.querySelector('#p3MwFill');
  var mwKnob=page.querySelector('#p3MwKnob');
  var mwPlay=page.querySelector('#p3MwPlay');
  var mwFav=page.querySelector('#p3MwFav');
  var mwInfo=page.querySelector('#p3MwInfo');
  var mwProgress=page.querySelector('#p3MwProgress');
  var playSVG='<svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"/></svg>';
  var pauseSVG='<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  function updateMw(){
    var st=null;
    try{ if(window.LTBridge&&window.LTBridge.getState) st=window.LTBridge.getState(); }catch(e){}
    /* widget always visible; opacity indicates together state */
    if(st&&st.together){ music.classList.add('lt-active'); }
    else { music.classList.remove('lt-active'); }
    if(st&&st.songs){
      var cur=null;
      for(var i=0;i<st.songs.length;i++){ if(st.songs[i].id===st.playstate.currentSongId){cur=st.songs[i];break;} }
      mwSong.textContent= cur?(cur.name+(cur.artist?' · '+cur.artist:'')):'未在播放';
      var dur=cur?(cur.duration||0):0, t=st.playstate.currentTime||0;
      /* use real audio duration when available (fixes progress not updating for URL songs) */
      if(st.audioDuration&&st.audioDuration>0) dur=st.audioDuration;
      var pct= dur? Math.max(0,Math.min(100,t/dur*100)):0;
      mwFill.style.width=pct+'%'; mwKnob.style.left=pct+'%';
      mwPlay.innerHTML= st.playstate.isPlaying?pauseSVG:playSVG;
      try{ mwFav.classList.toggle('active', st.favorites.indexOf(st.playstate.currentSongId)>-1); }catch(e){}
      var dist=(st.settings&&st.settings.distance!=null)?st.settings.distance:'--';
      /* use cumulative time (persists across sessions) */
      var hrs='--';
      if(st.cumulativeTime!=null&&st.cumulativeTime>0){ var h=Math.floor(st.cumulativeTime/3600),mm=Math.floor(st.cumulativeTime%3600/60); hrs=h+'小时'+mm+'分'; }
      mwInfo.innerHTML='相距 '+dist+' 公里 · 一起听了 '+hrs;
      mwInfo.style.opacity= st.together?1:0.55;
    } else {
      mwSong.textContent='点击进入一起听歌';
      mwInfo.innerHTML='相距 -- 公里 · 一起听了 --';
      mwInfo.style.opacity=0.55;
    }
  }
  setInterval(updateMw,500); setTimeout(updateMw,200);
  mwPlay.addEventListener('click',function(){ try{ if(window.LTBridge)window.LTBridge.toggle(); else if(window.openLTApp)openLTApp(); }catch(e){} setTimeout(updateMw,120); });
  page.querySelector('#p3MwNext').addEventListener('click',function(){ try{ if(window.LTBridge)window.LTBridge.next(); }catch(e){} setTimeout(updateMw,120); });
  page.querySelector('#p3MwPrev').addEventListener('click',function(){ try{ if(window.LTBridge)window.LTBridge.prev(); }catch(e){} setTimeout(updateMw,120); });
  mwFav.addEventListener('click',function(){ try{ if(window.LTBridge)window.LTBridge.fav(); }catch(e){} setTimeout(updateMw,120); });
  mwSong.addEventListener('click',function(){ try{ if(window.openLTApp)openLTApp(); }catch(e){} });
  function seekFromEvent(e){ if(!window.LTBridge) return; var r=mwProgress.getBoundingClientRect(); var p=(e.clientX-r.left)/r.width; p=Math.max(0,Math.min(1,p)); try{ window.LTBridge.seek(p); }catch(err){} }
  var seekDrag=false;
  mwProgress.addEventListener('pointerdown',function(e){ seekDrag=true; try{mwProgress.setPointerCapture(e.pointerId);}catch(err){} seekFromEvent(e); e.preventDefault(); });
  mwProgress.addEventListener('pointermove',function(e){ if(seekDrag) seekFromEvent(e); });
  mwProgress.addEventListener('pointerup',function(e){ seekDrag=false; try{mwProgress.releasePointerCapture(e.pointerId);}catch(err){} });
  mwProgress.addEventListener('pointercancel',function(){ seekDrag=false; });
  /* Bug24修复：添加 window 级 pointerup 兜底，确保 seekDrag 始终被重置 */
  window.addEventListener('pointerup',function(){ seekDrag=false; });

  /* ===== widget background image / font color / avatar upload ===== */
  var MWBG_KEY='lt_mwBgImg', MWFC_KEY='lt_mwFontColor', MWA1_KEY='lt_mwAvatar1', MWA2_KEY='lt_mwAvatar2';
  var mwAvatarMine=page.querySelector('#p3AvatarMine');
  var mwAvatarOther=page.querySelector('#p3AvatarOther');
  var mwFileInput=document.createElement('input');
  mwFileInput.type='file'; mwFileInput.accept='image/*'; mwFileInput.style.display='none';
  document.body.appendChild(mwFileInput);
  var mwFileTarget=null;
  mwFileInput.addEventListener('change',function(e){
    var f=e.target.files&&e.target.files[0]; if(!f) return;
    var r=new FileReader();
    r.onload=function(ev){
      compressP3Image(ev.target.result, 800, 800, 0.82, function(compressed){
        try{
          if(mwFileTarget==='bg'){ if(window.saveImgDB){ window.saveImgDB(MWBG_KEY,compressed); } else { localStorage.setItem(MWBG_KEY,compressed); } applyMwBg(); }
          else if(mwFileTarget==='a1'){ if(window.saveImgDB){ window.saveImgDB(MWA1_KEY,compressed); } else { localStorage.setItem(MWA1_KEY,compressed); } applyMwAvatars(); }
          else if(mwFileTarget==='a2'){ if(window.saveImgDB){ window.saveImgDB(MWA2_KEY,compressed); } else { localStorage.setItem(MWA2_KEY,compressed); } applyMwAvatars(); }
        }catch(err){ if(window.saveImgDB && mwFileTarget){ var _k=mwFileTarget==='bg'?MWBG_KEY:mwFileTarget==='a1'?MWA1_KEY:MWA2_KEY; window.saveImgDB(_k,compressed); } }
        mwFileInput.value='';
      });
    };
    r.readAsDataURL(f);
  });
  function applyMwBg(){
    var bg=localStorage.getItem(MWBG_KEY);
    if(bg){ music.style.backgroundImage='url("'+bg+'")'; music.style.backgroundSize='cover'; music.style.backgroundPosition='center'; music.style.backgroundColor='rgba(255,255,255,0.45)'; music.classList.add('has-bg-image'); }
    else { music.style.backgroundImage=''; music.style.backgroundSize=''; music.style.backgroundPosition=''; music.style.backgroundColor=''; music.classList.remove('has-bg-image'); }
    var fc=localStorage.getItem(MWFC_KEY);
    if(fc){ music.style.color=fc; mwSong.style.color=fc; mwInfo.style.color=fc; }
    else { music.style.color=''; mwSong.style.color=''; mwInfo.style.color=''; }
    /* 异步从 IndexedDB 加载 */
    if(window.loadImgDB){
      window.loadImgDB(MWBG_KEY, function(v){
        if(v){ music.style.backgroundImage='url("'+v+'")'; music.style.backgroundSize='cover'; music.style.backgroundPosition='center'; music.style.backgroundColor='rgba(255,255,255,0.45)'; music.classList.add('has-bg-image'); }
      });
    }
  }
  function applyMwAvatars(){
    var a1=localStorage.getItem(MWA1_KEY), a2=localStorage.getItem(MWA2_KEY);
    if(a1) mwAvatarMine.src=a1; else mwAvatarMine.src='';
    if(a2) mwAvatarOther.src=a2; else mwAvatarOther.src='';
    /* 异步从 IndexedDB 加载 */
    if(window.loadImgDB){
      window.loadImgDB(MWA1_KEY, function(v){ if(v) mwAvatarMine.src=v; });
      window.loadImgDB(MWA2_KEY, function(v){ if(v) mwAvatarOther.src=v; });
    }
  }
  applyMwBg(); applyMwAvatars();
  /* avatar click handlers */
  function showMwAvatarSheet(target){
    var mask=document.createElement('div');
    mask.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:2500;display:flex;align-items:flex-end;justify-content:center;';
    var sheet=document.createElement('div');
    sheet.style.cssText='width:100%;max-width:430px;background:#fff;border-radius:16px 16px 0 0;padding:8px 0 calc(12px + env(safe-area-inset-bottom,0px));';
    sheet.innerHTML='<div style="padding:14px 18px;font-size:13px;color:#888;">更换头像</div>'
      +'<button data-act="upload" style="display:block;width:100%;padding:14px 18px;font-size:15px;color:#000;background:none;border:none;text-align:left;cursor:pointer;">上传图片</button>'
      +'<button data-act="reset" style="display:block;width:100%;padding:14px 18px;font-size:15px;color:#000;background:none;border:none;text-align:left;cursor:pointer;">恢复默认</button>'
      +'<button data-act="cancel" style="display:block;width:100%;padding:14px 18px;font-size:15px;color:#888;background:none;border:none;text-align:left;cursor:pointer;margin-top:6px;border-top:1px solid #eee;">取消</button>';
    mask.appendChild(sheet); document.body.appendChild(mask);
    sheet.addEventListener('click',function(ev){
      var act=ev.target.getAttribute&&ev.target.getAttribute('data-act');
      if(act==='upload'){ mwFileTarget=target; mwFileInput.click(); mask.remove(); }
      else if(act==='reset'){ localStorage.removeItem(target==='a1'?MWA1_KEY:MWA2_KEY); applyMwAvatars(); mask.remove(); p3Toast('已恢复默认'); }
      else if(act==='cancel'){ mask.remove(); }
    });
    mask.addEventListener('click',function(ev){ if(ev.target===mask) mask.remove(); });
  }
  mwAvatarMine.addEventListener('click',function(e){ e.stopPropagation(); showMwAvatarSheet('a1'); });
  mwAvatarOther.addEventListener('click',function(e){ e.stopPropagation(); showMwAvatarSheet('a2'); });
  /* background click handler: click empty area to change font color / background image */
  music.addEventListener('click',function(e){
    if(document.body.classList.contains('editing-mode')) return;
    /* ignore clicks on controls, song text, progress, avatars */
    if(e.target.closest('.p3-mw-btn')||e.target.closest('.p3-mw-song')||e.target.closest('.p3-mw-progress')||e.target.closest('.p3-mw-avatar')) return;
    showMwBgSheet();
  });
  function showMwBgSheet(){
    var mask=document.createElement('div');
    mask.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:2500;display:flex;align-items:flex-end;justify-content:center;';
    var sheet=document.createElement('div');
    sheet.style.cssText='width:100%;max-width:430px;background:#fff;border-radius:16px 16px 0 0;padding:8px 0 calc(12px + env(safe-area-inset-bottom,0px));';
    var curFc=localStorage.getItem(MWFC_KEY)||'#333333';
    sheet.innerHTML='<div style="padding:14px 18px;font-size:13px;color:#888;">音乐组件背景</div>'
      +'<button data-act="upload" style="display:block;width:100%;padding:14px 18px;font-size:15px;color:#000;background:none;border:none;text-align:left;cursor:pointer;">上传背景图片</button>'
      +'<button data-act="reset" style="display:block;width:100%;padding:14px 18px;font-size:15px;color:#000;background:none;border:none;text-align:left;cursor:pointer;">恢复默认背景</button>'
      +'<div style="padding:14px 18px;display:flex;align-items:center;justify-content:space-between;"><span style="font-size:15px;color:#000;">字体颜色</span><input type="color" id="mwFcPicker" value="'+curFc+'" style="width:44px;height:32px;border:1px solid #ddd;border-radius:8px;cursor:pointer;"></div>'
      +'<button data-act="cancel" style="display:block;width:100%;padding:14px 18px;font-size:15px;color:#888;background:none;border:none;text-align:left;cursor:pointer;margin-top:6px;border-top:1px solid #eee;">取消</button>';
    mask.appendChild(sheet); document.body.appendChild(mask);
    var fcPicker=sheet.querySelector('#mwFcPicker');
    fcPicker.addEventListener('input',function(){ localStorage.setItem(MWFC_KEY,fcPicker.value); applyMwBg(); });
    sheet.addEventListener('click',function(ev){
      var act=ev.target.getAttribute&&ev.target.getAttribute('data-act');
      if(act==='upload'){ mwFileTarget='bg'; mwFileInput.click(); mask.remove(); }
      else if(act==='reset'){ localStorage.removeItem(MWBG_KEY); localStorage.removeItem(MWFC_KEY); applyMwBg(); mask.remove(); p3Toast('已恢复默认'); }
      else if(act==='cancel'){ mask.remove(); }
    });
    mask.addEventListener('click',function(ev){ if(ev.target===mask) mask.remove(); });
  }

  /* ===== 学生证卡片（照片替换 + 可编辑信息） ===== */
  var SID_KEY='p3_student_id';
  var sidCard=page.querySelector('#p3StudentId');
  var sidPhoto=page.querySelector('#p3SidPhoto');
  var sidImg=sidPhoto?sidPhoto.querySelector('img'):null;
  var sidPlaceholder=sidPhoto?sidPhoto.querySelector('.p3-sid-photo-placeholder'):null;
  function loadSidData(){
    try{
      var v=localStorage.getItem(SID_KEY);
      if(v) return JSON.parse(v);
    }catch(e){}
    return {photo:''};
  }
  function saveSidData(data){
    var json=JSON.stringify(data);
    try{ localStorage.setItem(SID_KEY,json); }catch(e){
      if(window.saveImgDB){ window.saveImgDB(SID_KEY,json); }
    }
  }
  var sidData=loadSidData();
  /* 异步从 IndexedDB 恢复学生证数据 */
  if(window.loadImgDB){
    window.loadImgDB(SID_KEY, function(v){
      if(v){
        try{
          var parsed=JSON.parse(v);
          if(parsed && (parsed.photo || parsed.fields)){
            sidData=parsed; applySid();
          }
        }catch(e){}
      }
    });
  }
  function applySid(){
    if(sidData.photo){
      if(sidImg){ sidImg.src=sidData.photo; sidImg.style.display='block'; }
      if(sidPlaceholder) sidPlaceholder.style.display='none';
    }else{
      if(sidImg){ sidImg.src=''; sidImg.style.display='none'; }
      if(sidPlaceholder) sidPlaceholder.style.display='';
    }
  }
  applySid();
  var sidFileInput=document.createElement('input');
  sidFileInput.type='file'; sidFileInput.accept='image/*'; sidFileInput.style.display='none';
  document.body.appendChild(sidFileInput);
  sidFileInput.addEventListener('change',function(e){
    var f=e.target.files&&e.target.files[0]; if(!f) return;
    var r=new FileReader();
    r.onload=function(ev){
      compressP3Image(ev.target.result, 800, 800, 0.82, function(compressed){
        sidData.photo=compressed; saveSidData(sidData); applySid();
      });
    };
    r.readAsDataURL(f); sidFileInput.value='';
  });
  function showSidPhotoSheet(){
    var mask=document.createElement('div');
    mask.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:2500;display:flex;align-items:flex-end;justify-content:center;';
    var sheet=document.createElement('div');
    sheet.style.cssText='width:100%;max-width:430px;background:#fff;border-radius:16px 16px 0 0;padding:8px 0 calc(12px + env(safe-area-inset-bottom,0px));';
    sheet.innerHTML='<div style="padding:14px 18px;font-size:13px;color:#888;">学生证照片</div>'
      +'<button data-act="upload" style="display:block;width:100%;padding:14px 18px;font-size:15px;color:#000;background:none;border:none;text-align:left;cursor:pointer;">上传照片</button>'
      +'<button data-act="reset" style="display:block;width:100%;padding:14px 18px;font-size:15px;color:#000;background:none;border:none;text-align:left;cursor:pointer;">恢复默认</button>'
      +'<button data-act="cancel" style="display:block;width:100%;padding:14px 18px;font-size:15px;color:#888;background:none;border:none;text-align:left;cursor:pointer;margin-top:6px;border-top:1px solid #eee;">取消</button>';
    mask.appendChild(sheet); document.body.appendChild(mask);
    sheet.addEventListener('click',function(ev){
      var act=ev.target.getAttribute&&ev.target.getAttribute('data-act');
      if(act==='upload'){ sidFileInput.click(); mask.remove(); }
      else if(act==='reset'){ sidData.photo=''; saveSidData(sidData); applySid(); mask.remove(); p3Toast('已恢复默认'); }
      else if(act==='cancel'){ mask.remove(); }
    });
    mask.addEventListener('click',function(ev){ if(ev.target===mask) mask.remove(); });
  }
  var sidBody=page.querySelector('#p3SidBody');
  if(sidBody){
    sidBody.addEventListener('click',function(e){
      e.stopPropagation();
      if(document.body.classList.contains('editing-mode')) return;
      showSidPhotoSheet();
    });
  }
  // 学生证字体设置功能已删除
  // 点击学生证空白区域不再打开字体设置（已删除该功能）
})();


/* 第三页输入框自动宽度：根据内容自适应 */
window.autoSizeInput=function(el){
  if(!el) return;
  el.style.width='auto';
  var tmp=document.createElement('span');
  tmp.style.visibility='hidden'; tmp.style.position='absolute';
  tmp.style.whiteSpace='pre'; tmp.style.font=window.getComputedStyle(el).font;
  tmp.textContent=el.value||el.placeholder||'';
  document.body.appendChild(tmp);
  var w=tmp.offsetWidth+32; /* padding+border */
  document.body.removeChild(tmp);
  if(w<50) w=50;
  if(w>110) w=110;
  el.style.width=w+'px';
};
/* 保存第三页四个输入框文字（同时写入 localStorage 和 appData，确保刷新后不丢失） */
window.saveP3InputTexts=function(){
  var inputs=document.querySelectorAll('.p3-glass-input');
  var texts=[];
  inputs.forEach(function(inp){ texts.push(inp.value||''); });
  /* 1. localStorage（兼容旧版，容量有限可能失败） */
  try{ localStorage.setItem('p3_input_texts',JSON.stringify(texts)); }catch(e){}
  /* 2. appData → IndexedDB（容量大，可靠性高） */
  try{
    if(typeof appData!=='undefined'){
      appData.p3InputTexts=texts.slice();
      if(typeof saveData==='function') saveData();
    }
  }catch(e){}
};
/* 从 appData / localStorage 恢复第三页四个输入框文字 */
window.restoreP3InputTexts=function(){
  var inputs=document.querySelectorAll('.p3-glass-input');
  if(!inputs||inputs.length===0) return;
  /* 优先从 appData 读取（IndexedDB 加载后的真实数据） */
  var saved=null;
  try{
    if(typeof appData!=='undefined'&&Array.isArray(appData.p3InputTexts)){
      saved=appData.p3InputTexts;
    }
  }catch(e){}
  /* 回退到 localStorage（兼容旧版 / 首次加载 IDB 尚未就绪时） */
  if(!saved||saved.length===0){
    try{
      var ls=JSON.parse(localStorage.getItem('p3_input_texts'));
      if(Array.isArray(ls)) saved=ls;
    }catch(e){}
  }
  if(!saved||!Array.isArray(saved)) return;
  inputs.forEach(function(inp){
    var idx=parseInt(inp.dataset.p3Input,10);
    if(!isNaN(idx)&&saved[idx]!==undefined){
      inp.value=saved[idx];
    }
    if(typeof window.autoSizeInput==='function') window.autoSizeInput(inp);
  });
};
/* 全局函数定义 - 确保在任何情况下都可调用 */
window.replaceP3Avatar=function(e){
  if(e){ e.stopPropagation(); e.preventDefault(); }
  if(window._p3AvatarLock) return;
  window._p3AvatarLock=true;
  setTimeout(function(){ window._p3AvatarLock=false; },300);
  var input=document.createElement('input');
  input.type='file'; input.accept='image/*';
  input.style.cssText='position:absolute;left:-9999px;top:-9999px;opacity:0;width:1px;height:1px;';
  document.body.appendChild(input);
  input.addEventListener('change',function(ev){
    var f=ev.target.files&&ev.target.files[0]; if(!f){ return; }
    var r=new FileReader();
    r.onload=function(ere){
      var data=ere.target.result;
      var avEl=document.getElementById('p3CenterAvatar');
      if(avEl){
        var imgE=avEl.querySelector('img');
        var phE=avEl.querySelector('.p3-avatar-ph');
        if(imgE){ imgE.src=data; imgE.style.display='block'; }
        if(phE) phE.style.display='none';
        avEl.classList.add('has-img');
      }
      try{ if(window.saveImgDB){ window.saveImgDB('p3_center_avatar',data); } else { localStorage.setItem('p3_center_avatar',data); } }catch(err){}
    };
    r.readAsDataURL(f);
    setTimeout(function(){ if(input.parentNode) input.parentNode.removeChild(input); }, 500);
  });
  /* 部分浏览器需要延迟触发 click */
  setTimeout(function(){ input.click(); }, 0);
};
/* 初始化：恢复头像 + 绑定点击事件（双重保险） */
(function(){
  'use strict';
  var AV_KEY='p3_center_avatar';
  function init(){
    var av=document.getElementById('p3CenterAvatar');
    if(!av){ setTimeout(init,200); return; }
    var imgEl=av.querySelector('img');
    var phEl=av.querySelector('.p3-avatar-ph');
    function applyAvatar(src){
      if(src){
        if(imgEl){ imgEl.src=src; imgEl.style.display='block'; }
        if(phEl) phEl.style.display='none';
        av.classList.add('has-img');
      }else{
        if(imgEl){ imgEl.src=''; imgEl.style.display='none'; }
        if(phEl) phEl.style.display='';
        av.classList.remove('has-img');
      }
    }
    /* 绑定点击事件（仅addEventListener，作为onclick的备份） */
    if(!av.dataset.clickBound){
      av.dataset.clickBound='1';
      av.addEventListener('click',function(e){
        if(typeof window.replaceP3Avatar==='function'){
          window.replaceP3Avatar(e);
        }
      });
    }
    /* 恢复头像 */
    if(window.loadImgDB){
      window.loadImgDB(AV_KEY,function(v){ if(v) applyAvatar(v); });
    }else{
      try{ var v=localStorage.getItem(AV_KEY); if(v) applyAvatar(v); }catch(e){}
    }
    /* 初始化所有 p3-glass-input 的自动宽度，并恢复已保存的文字 */
    if(typeof window.restoreP3InputTexts==='function'){
      window.restoreP3InputTexts();
    }else{
      document.querySelectorAll('.p3-glass-input').forEach(function(inp){
        try{
          var saved=JSON.parse(localStorage.getItem('p3_input_texts'));
          if(Array.isArray(saved)){
            var idx=parseInt(inp.dataset.p3Input,10);
            if(!isNaN(idx)&&saved[idx]!==undefined&&saved[idx]!==''){
              inp.value=saved[idx];
            }
          }
        }catch(e){}
        if(typeof window.autoSizeInput==='function') window.autoSizeInput(inp);
      });
    }
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{
    init();
  }
})();

(function(){
  'use strict';
  var RECT_KEY = 'p3_rectangle_img';
  var widget = document.getElementById('p3RectangleWidget');
  if(!widget) return;
  var imgEl = widget.querySelector('.p3-rect-img');
  var phEl = widget.querySelector('.p3-rect-placeholder');

  function applyImage(src){
    if(src){
      if(imgEl){ imgEl.src = src; imgEl.style.display = 'block'; }
      if(phEl) phEl.style.display = 'none';
    } else {
      if(imgEl){ imgEl.src = ''; imgEl.style.display = 'none'; }
      if(phEl) phEl.style.display = '';
    }
  }

  function compressImage(dataUrl, maxDim, quality, cb){
    var img = new Image();
    img.onload = function(){
      var w = img.width, h = img.height;
      var scale = Math.min(1, maxDim / Math.max(w, h));
      var cw = Math.round(w * scale), ch = Math.round(h * scale);
      var cvs = document.createElement('canvas');
      cvs.width = cw; cvs.height = ch;
      var ctx = cvs.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, 0, 0, cw, ch);
      try { cb(cvs.toDataURL('image/jpeg', quality)); }
      catch(e){ cb(dataUrl); }
    };
    img.onerror = function(){ cb(dataUrl); };
    img.src = dataUrl;
  }

  function saveImage(dataUrl){
    try {
      if(window.saveImgDB){ window.saveImgDB(RECT_KEY, dataUrl); }
      else { try { localStorage.setItem(RECT_KEY, dataUrl); } catch(e){} }
    } catch(e){
      if(window.saveImgDB){ try { window.saveImgDB(RECT_KEY, dataUrl); } catch(_){} }
    }
  }

  function loadImage(cb){
    if(window.loadImgDB){
      window.loadImgDB(RECT_KEY, function(v){
        if(v){ cb(v); }
        else { try { cb(localStorage.getItem(RECT_KEY)); } catch(e){ cb(null); } }
      });
    } else {
      try { cb(localStorage.getItem(RECT_KEY)); } catch(e){ cb(null); }
    }
  }

  // 启动时从 IndexedDB 恢复图片
  loadImage(function(v){ if(v) applyImage(v); });

  // 文件选择器
  var fileInput = document.createElement('input');
  fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  fileInput.addEventListener('change', function(e){
    var f = e.target.files && e.target.files[0]; if(!f) return;
    var r = new FileReader();
    r.onload = function(ev){
      compressImage(ev.target.result, 800, 0.82, function(compressed){
        applyImage(compressed);
        saveImage(compressed);
      });
    };
    r.readAsDataURL(f);
    fileInput.value = '';
  });

  // 点击换图（编辑模式下不触发，交由桌面编辑系统）
  widget.addEventListener('click', function(e){
    if(document.body.classList.contains('editing-mode')) return;
    e.stopPropagation();
    fileInput.click();
  });
})();

(function(){
  'use strict';
  var STORAGE_KEY = 'randomfood_data';
  var PRESET = ['黄焖鸡米饭','猪脚饭','煲仔饭','烧腊饭','兰州拉面','沙县拌面','螺蛳粉','热干面','麦当劳','肯德基','华莱士','塔斯汀','桂林米粉','云南米线','酸辣粉','麻辣烫','杨国福','饺子','馄饨','手抓饼','煎饼果子','烤冷面'];
  var PALETTE = ['#FFB3D1','#FFC288','#FFE699','#B8E6C9','#C9B8E6','#A8D8F0','#FF9E9E','#D4E89E','#FFD6B0','#A8E6E0','#F4A7C0','#F0D878'];

  var overlay = document.getElementById('randomFoodOverlay');
  if(!overlay) return;
  var canvasEl = document.getElementById('randomFoodCanvas');
  var spinBtn = document.getElementById('randomFoodSpinBtn');
  var againBtn = document.getElementById('randomFoodAgainBtn');
  var resultWrap = document.getElementById('randomFoodResultWrap');
  var resultEl = document.getElementById('randomFoodResult');
  var manageBtn = document.getElementById('randomFoodManageBtn');
  var managePanel = document.getElementById('randomFoodManagePanel');
  var manageListEl = document.getElementById('randomFoodManageList');
  var manageClose = document.getElementById('randomFoodManageClose');
  var closeBtn = document.getElementById('randomFoodClose');
  var newInput = document.getElementById('randomFoodNewInput');
  var addBtn = document.getElementById('randomFoodAddBtn');
  var plusBtn = document.getElementById('randomFoodPlusBtn');

  var items = loadData();
  var currentRotation = 0;
  var spinning = false;

  function loadData(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if(raw !== null){
        var d = JSON.parse(raw);
        if(d && Array.isArray(d.items)) return d.items.slice();
      }
    } catch(e){}
    return PRESET.slice();
  }
  function saveData(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: items })); } catch(e){}
  }

  function drawWheel(highlightIdx){
    var ctx = canvasEl.getContext('2d');
    var W = canvasEl.width, H = canvasEl.height;
    var cx = W / 2, cy = H / 2;
    var radius = Math.min(cx, cy) - 4;
    ctx.clearRect(0, 0, W, H);
    var N = items.length;
    if(N === 0){
      ctx.fillStyle = '#f0f0f0';
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#999'; ctx.font = '14px -apple-system,"PingFang SC",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('请先添加选项', cx, cy);
      return;
    }
    var seg = 2 * Math.PI / N;
    for(var i = 0; i < N; i++){
      var start = -Math.PI / 2 + i * seg;
      var end = start + seg;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = PALETTE[i % PALETTE.length];
      ctx.fill();
      ctx.lineWidth = (i === highlightIdx) ? 4 : 1;
      ctx.strokeStyle = (i === highlightIdx) ? '#ffffff' : 'rgba(255,255,255,0.5)';
      ctx.stroke();
      // 文字
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + seg / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px -apple-system,"PingFang SC",sans-serif';
      var label = items[i];
      if(label.length > 6) label = label.substring(0, 6);
      ctx.fillText(label, radius - 10, 0);
      ctx.restore();
    }
    // 中心圆
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  function spin(){
    if(spinning) return;
    var N = items.length;
    if(N === 0) return;
    spinning = true;
    spinBtn.disabled = true;
    againBtn.disabled = true;
    resultWrap.style.display = 'none';
    var seg = 360 / N;
    var target = Math.floor(Math.random() * N);
    var jitter = (Math.random() - 0.5) * seg * 0.7;
    var targetCenter = target * seg + seg / 2 + jitter;
    var desiredMod = ((360 - (targetCenter % 360)) % 360 + 360) % 360;
    var currentMod = ((currentRotation % 360) + 360) % 360;
    var delta = desiredMod - currentMod;
    if(delta < 0) delta += 360;
    var fullTurns = 5;
    var duration = 3000 + Math.random() * 2000;
    currentRotation += fullTurns * 360 + delta;
    canvasEl.style.transition = 'transform ' + duration + 'ms cubic-bezier(0.17,0.67,0.12,0.99)';
    canvasEl.style.transform = 'rotate(' + currentRotation + 'deg)';
    setTimeout(function(){
      spinning = false;
      spinBtn.disabled = false;
      againBtn.disabled = false;
      var finalMod = ((currentRotation % 360) + 360) % 360;
      var pointerAngle = (360 - finalMod) % 360;
      var landed = Math.floor(pointerAngle / seg) % N;
      resultEl.textContent = '今天吃：' + items[landed];
      resultWrap.style.display = 'flex';
      drawWheel(landed);
    }, duration);
  }

  function renderManage(){
    manageListEl.innerHTML = '';
    items.forEach(function(it, idx){
      var row = document.createElement('div');
      row.className = 'randomfood_manage_row';
      var text = document.createElement('span');
      text.className = 'randomfood_manage_text';
      text.textContent = it;
      text.addEventListener('click', function(){
        var v = prompt('修改选项', it);
        if(v !== null && v.trim()){
          items[idx] = v.trim();
          saveData();
          renderManage();
          drawWheel(-1);
        }
      });
      var del = document.createElement('span');
      del.className = 'randomfood_manage_del';
      del.textContent = '\u00d7';
      del.addEventListener('click', function(){
        items.splice(idx, 1);
        saveData();
        renderManage();
        drawWheel(-1);
      });
      row.appendChild(text);
      row.appendChild(del);
      manageListEl.appendChild(row);
    });
  }

  function openWheel(){
    items = loadData();
    overlay.classList.add('show');
    managePanel.classList.remove('show');
    resultWrap.style.display = 'none';
    canvasEl.style.transition = 'none';
    canvasEl.style.transform = 'rotate(0deg)';
    currentRotation = 0;
    drawWheel(-1);
  }
  function closeWheel(){
    overlay.classList.remove('show');
    managePanel.classList.remove('show');
  }
  function openManage(){
    renderManage();
    managePanel.classList.add('show');
  }
  function closeManage(){
    managePanel.classList.remove('show');
    drawWheel(-1);
  }
  function addItem(){
    var v = newInput.value.trim();
    if(!v) return;
    items.push(v);
    saveData();
    newInput.value = '';
    renderManage();
    drawWheel(-1);
  }

  // 事件绑定（全部用 addEventListener，不污染全局）
  if(plusBtn) plusBtn.addEventListener('click', function(e){ e.stopPropagation(); openWheel(); });
  spinBtn.addEventListener('click', spin);
  againBtn.addEventListener('click', spin);
  manageBtn.addEventListener('click', openManage);
  manageClose.addEventListener('click', closeManage);
  closeBtn.addEventListener('click', closeWheel);
  addBtn.addEventListener('click', addItem);
  newInput.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ addItem(); } });
  // 点击遮罩空白处关闭（点弹窗内部不关）
  overlay.addEventListener('click', function(e){
    if(e.target === overlay) closeWheel();
  });
  // 管理面板内点击不冒泡到 overlay
  managePanel.addEventListener('click', function(e){ e.stopPropagation(); });
  document.getElementById('randomFoodModal').addEventListener('click', function(e){ e.stopPropagation(); });
})();

