/* wordlib.js - 从 app.js 拆分 */


// ========== 词库管理 App ==========
/* 预设词库引用（与 Ta的传讯 MW_PRESET 共享，不可删除） */
var WORDLIB_PRESET = (typeof MW_PRESET !== 'undefined') ? MW_PRESET : {
    subj:  ['I','YOU','WE','MY HEART','MY SOUL','THE MOON','THE STARS',
            'TIME','LOVE','DESTINY','THE WIND','THE OCEAN','EVERY STAR'],
    verb:  ['LOVE','MISS','NEED','WANT','HOLD','DREAM','CHERISH','ADMIRE',
            'DESIRE','TREASURE','EMBRACE','FOLLOW','TRUST','BELIEVE',
            'SEEK','GUIDE','PROTECT','REMEMBER','WAIT','SING'],
    obj:   ['YOU','ME','US','FOREVER','ALWAYS','YOUR SMILE','YOUR EYES',
            'YOUR HEART','YOUR HAND','OUR LOVE','THIS MOMENT','TONIGHT',
            'YOU DEEPLY','YOUR VOICE','YOUR SOUL'],
    adj:   ['BEAUTIFUL','WONDERFUL','PERFECT','ENDLESS','ETERNAL','GENTLE',
            'SWEET','DEAR','PRECIOUS','WARM','BRIGHT','RADIANT','TENDER',
            'FLAWLESS','DIVINE','MAGICAL','PURE','SHINING','LOVELY'],
    adv:   ['ALWAYS','FOREVER','DEEPLY','TRULY','MADLY','COMPLETELY',
            'TENDERLY','ENDLESSLY','SILENTLY','BRAVELY','SOFTLY',
            'CLOSELY','STEADFASTLY'],
    noun:  ['HEART','SOUL','WORLD','STAR','DREAM','HOME','ANGEL','DESTINY',
            'LIGHT','LIFE','SUNSHINE','RAINBOW','MELODY','OCEAN','FLAME',
            'BLOSSOM','HORIZON','SYMPHONY','COMFORT','SANCTUARY'],
    poss:  ['MY','YOUR','OUR'],
    greet: ['HELLO','DEAR','DARLING','SWEETHEART','BELOVED']
};
var WORDLIB_CATS = [
    { key: 'subj',  name: '主语' },
    { key: 'verb',  name: '动词' },
    { key: 'obj',   name: '宾语' },
    { key: 'adj',   name: '形容词' },
    { key: 'adv',   name: '副词' },
    { key: 'noun',  name: '名词' },
    { key: 'poss',  name: '物主代词' },
    { key: 'greet', name: '问候语' }
];
var _wordlibCurCat = 'subj';

/* 初始化词库数据（用户自定义词存储在 appData.taWordLib） */
function wordlibInitData() {
    try {
        if (!appData.taWordLib) appData.taWordLib = {};
        var w = appData.taWordLib;
        for (var i = 0; i < WORDLIB_CATS.length; i++) {
            var k = WORDLIB_CATS[i].key;
            if (!w[k] || !Array.isArray(w[k])) w[k] = [];
        }
    } catch(e) { console.error('[词库管理] init error:', e); }
}

/* 获取某分类的完整词库（预设 + 用户自定义） */
function wordlibGetMerged(catKey) {
    var preset = WORDLIB_PRESET[catKey] || [];
    var user = (appData.taWordLib && appData.taWordLib[catKey]) || [];
    return preset.concat(user);
}

/* 打开/关闭 */
function openWordLibApp() {
    wordlibInitData();
    document.getElementById('wordlibAppPage').style.display = 'flex';
    _wordlibCurCat = 'subj';
    wordlibRenderCats();
    wordlibRenderContent();
}
function closeWordLibApp() {
    document.getElementById('wordlibAppPage').style.display = 'none';
}

/* 渲染分类标签 */
function wordlibRenderCats() {
    var html = '';
    for (var i = 0; i < WORDLIB_CATS.length; i++) {
        var c = WORDLIB_CATS[i];
        var count = wordlibGetMerged(c.key).length;
        var cls = c.key === _wordlibCurCat ? 'wordlib-cat active' : 'wordlib-cat';
        html += '<div class="' + cls + '" onclick="wordlibSwitchCat(\'' + c.key + '\')">';
        html += c.name + '<span class="cat-count">' + count + '</span></div>';
    }
    document.getElementById('wordlibCats').innerHTML = html;
}

/* 切换分类 */
function wordlibSwitchCat(key) {
    _wordlibCurCat = key;
    wordlibRenderCats();
    wordlibRenderContent();
}

/* 渲染内容区 */
function wordlibRenderContent() {
    var cat = WORDLIB_CATS.find(function(c){ return c.key === _wordlibCurCat; });
    var preset = WORDLIB_PRESET[_wordlibCurCat] || [];
    var user = (appData.taWordLib && appData.taWordLib[_wordlibCurCat]) || [];
    var html = '';

    /* 添加单个词 */
    html += '<div class="wordlib-section">';
    html += '<div class="wordlib-section-title">添加词汇到「' + cat.name + '」</div>';
    html += '<div class="wordlib-add-row">';
    html += '<input class="wordlib-add-input" id="wordlibAddInput" placeholder="输入一个词，回车添加" maxlength="30" onkeydown="if(event.key===\'Enter\')wordlibAddOne()"/>';
    html += '<button class="wordlib-add-btn" onclick="wordlibAddOne()">添加</button>';
    html += '</div>';
    html += '</div>';

    /* 批量导入 */
    html += '<div class="wordlib-batch-area">';
    html += '<div class="wordlib-batch-toggle" onclick="wordlibToggleBatch()">';
    html += '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>';
    html += ' 批量导入</div>';
    html += '<div class="wordlib-batch-box" id="wordlibBatchBox">';
    html += '<textarea class="wordlib-batch-textarea" id="wordlibBatchText" placeholder="一行一个词，批量导入到「' + cat.name + '」&#10;例如：&#10;CAT&#10;COFFEE&#10;SUNSET"></textarea>';
    html += '<div class="wordlib-batch-hint">每行一个词，系统会自动归入当前分类「' + cat.name + '」</div>';
    html += '<button class="wordlib-batch-btn" onclick="wordlibBatchImport()">导入</button>';
    html += '</div>';
    html += '</div>';

    /* 词汇列表 */
    html += '<div class="wordlib-section">';
    var totalCount = preset.length + user.length;
    html += '<div class="wordlib-section-title">词汇列表 <span style="font-weight:400;color:#999;font-size:12px;">（共 ' + totalCount + ' 个，预设 ' + preset.length + ' + 自定义 ' + user.length + '）</span></div>';
    html += '<div class="wordlib-word-list">';
    /* 预设词 */
    for (var i = 0; i < preset.length; i++) {
        html += '<div class="wordlib-word preset">' + wordlibEscape(preset[i]) + '<span class="wordlib-word-del" title="预设词不可删除"></span></div>';
    }
    /* 用户词 */
    for (var j = 0; j < user.length; j++) {
        html += '<div class="wordlib-word">' + wordlibEscape(user[j]) + '<span class="wordlib-word-del" onclick="wordlibDeleteOne(' + j + ')" title="删除"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></div>';
    }
    if (totalCount === 0) {
        html += '<div class="wordlib-empty">暂无词汇，请添加</div>';
    }
    html += '</div>';
    /* 清空自定义词 */
    if (user.length > 0) {
        html += '<button class="wordlib-clear-btn" onclick="wordlibClearUser()">清空自定义词汇（' + user.length + ' 个）</button>';
    }
    html += '</div>';

    document.getElementById('wordlibContent').innerHTML = html;
}

/* 添加单个词 */
function wordlibAddOne() {
    var inp = document.getElementById('wordlibAddInput');
    var v = (inp.value || '').trim().toUpperCase();
    if (!v) return;
    wordlibInitData();
    var arr = appData.taWordLib[_wordlibCurCat];
    /* 去重：检查预设和用户词 */
    var merged = wordlibGetMerged(_wordlibCurCat);
    for (var i = 0; i < merged.length; i++) {
        if (merged[i].toUpperCase() === v) {
            inp.value = '';
            return;
        }
    }
    arr.push(v);
    saveData();
    inp.value = '';
    wordlibRenderCats();
    wordlibRenderContent();
    /* 即时更新 Ta的传讯 的合并词库缓存 */
    wordlibSyncToTa();
}

/* 删除单个用户词 */
function wordlibDeleteOne(idx) {
    wordlibInitData();
    var arr = appData.taWordLib[_wordlibCurCat];
    if (idx >= 0 && idx < arr.length) {
        arr.splice(idx, 1);
        saveData();
        wordlibRenderCats();
        wordlibRenderContent();
        wordlibSyncToTa();
    }
}

/* 清空当前分类的自定义词 */
function wordlibClearUser() {
    wordlibInitData();
    appData.taWordLib[_wordlibCurCat] = [];
    saveData();
    wordlibRenderCats();
    wordlibRenderContent();
    wordlibSyncToTa();
}

/* 批量导入切换 */
function wordlibToggleBatch() {
    var box = document.getElementById('wordlibBatchBox');
    if (box) box.classList.toggle('show');
}

/* 批量导入 */
function wordlibBatchImport() {
    var ta = document.getElementById('wordlibBatchText');
    if (!ta) return;
    var lines = ta.value.split('\n');
    var added = 0;
    var existing = {};
    var merged = wordlibGetMerged(_wordlibCurCat);
    for (var i = 0; i < merged.length; i++) existing[merged[i].toUpperCase()] = true;
    wordlibInitData();
    var arr = appData.taWordLib[_wordlibCurCat];
    for (var j = 0; j < lines.length; j++) {
        var w = lines[j].trim().toUpperCase();
        if (w && !existing[w]) {
            arr.push(w);
            existing[w] = true;
            added++;
        }
    }
    saveData();
    ta.value = '';
    document.getElementById('wordlibBatchBox').classList.remove('show');
    wordlibRenderCats();
    wordlibRenderContent();
    wordlibSyncToTa();
    if (added > 0) {
        var hint = document.querySelector('.wordlib-batch-hint');
        if (hint) hint.textContent = '成功导入 ' + added + ' 个词汇';
    }
}

/* 转义 */
function wordlibEscape(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* 即时同步到 Ta的传讯 的词库缓存 */
/* MW 是 Proxy，每次访问都会动态读取 appData.taWordLib，无需手动同步 */
function wordlibSyncToTa() {
    /* MW Proxy 自动读取最新数据，此处仅用于兼容旧调用 */
}

/* 页面加载后初始化词库缓存 */
wordlibInitData();
