/* wordcard.js - 从 app.js 拆分 */

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
    let timeOffset = appData.timeOffset !== undefined ? appData.timeOffset : -9;
    let timeEditTarget = null;
    var _wcContactScope = null; // null=共用字卡, 'c_xxx'=联系人专属字卡
    function _wcGetScopeData() {
        if (!_wcContactScope) return null;
        if (!appData.contactWordCards) appData.contactWordCards = {};
        if (!appData.contactWordCards[_wcContactScope]) {
            appData.contactWordCards[_wcContactScope] = { groups: ['default'], currentGroup: 'default', cards: { default: [] } };
        }
        return appData.contactWordCards[_wcContactScope];
    }
    function _wcGetGroups() {
        if (!_wcContactScope) return appData.wordGroups;
        var sd = _wcGetScopeData();
        return sd.groups;
    }
    function _wcSetGroups(val) {
        if (!_wcContactScope) { appData.wordGroups = val; return; }
        _wcGetScopeData().groups = val;
    }
    function _wcGetCurrentGroup() {
        if (!_wcContactScope) return appData.currentGroup;
        return _wcGetScopeData().currentGroup;
    }
    function _wcSetCurrentGroup(val) {
        if (!_wcContactScope) { appData.currentGroup = val; return; }
        _wcGetScopeData().currentGroup = val;
    }
    function _wcGetCards() {
        if (!_wcContactScope) return appData.wordCards;
        return _wcGetScopeData().cards;
    }
    function _wcGetCardsByGroup(group) {
        var cards = _wcGetCards();
        return cards[group] || [];
    }
    function toggleContactScopeBar() {
        var bar = document.getElementById('wordcardContactBar');
        if (bar) bar.classList.toggle('show');
        if (bar && bar.classList.contains('show')) renderContactScopeBar();
    }
    function renderContactScopeBar() {
        var bar = document.getElementById('wordcardContactBar');
        if (!bar) return;
        var contacts = (appData.contactList && appData.contactList.contacts) ? appData.contactList.contacts : [];
        var h = '';
        h += '<div class="wc-scope-chip' + (_wcContactScope === null ? ' active' : '') + '" onclick="switchContactScope(null)">共用字卡</div>';
        contacts.forEach(function(c) {
            h += '<div class="wc-scope-chip' + (_wcContactScope === c.id ? ' active' : '') + '" onclick="switchContactScope(\'' + c.id + '\')">' + (c.name || '未命名') + '</div>';
        });
        bar.innerHTML = h;
        var btn = document.getElementById('wordcardContactBtn');
        if (btn) {
            if (_wcContactScope) {
                var ct = contacts.find(function(c){return c.id===_wcContactScope;});
                btn.textContent = ct ? ct.name : '联系人';
                btn.classList.add('active');
            } else {
                btn.textContent = '共用字卡';
                btn.classList.remove('active');
            }
        }
    }
    function switchContactScope(contactId) {
        _wcContactScope = contactId || null;
        appData.selectedCards = [];
        var si = document.getElementById('wordcardSearchInput');
        if (si) si.value = '';
        renderContactScopeBar();
        renderWordGroups();
        renderWordCardList();
        saveData();
    }

    function updateReplySettings() {
        const s = appData.chatSettings;
        function safeInt(id, fallback) { const v = parseInt(document.getElementById(id).value); return isNaN(v) ? fallback : v; }
        s.replyTimeMin = safeInt('replyTimeMin', s.replyTimeMin);
        s.replyTimeMax = safeInt('replyTimeMax', s.replyTimeMax);
        s.replyCountMin = safeInt('replyCountMin', s.replyCountMin);
        s.replyCountMax = safeInt('replyCountMax', s.replyCountMax);
        s.enableSplice = document.getElementById('enableSplice').checked;
        s.nudgeProb = safeInt('nudgeProb', s.nudgeProb);
        s.emojiProb = safeInt('emojiProb', s.emojiProb);
        s.callAnswerProb = safeInt('callAnswerProb', s.callAnswerProb);
        s.callInitProb = safeInt('callInitProb', s.callInitProb);
        s.transferProb = Math.max(0, Math.min(100, safeInt('transferProb', s.transferProb !== undefined ? s.transferProb : 5)));
        s.allowZeroTransfer = document.getElementById('allowZeroTransfer') ? document.getElementById('allowZeroTransfer').checked : false;
        s.momentCount = safeInt('momentCount', s.momentCount);
        s.momentSplice = document.getElementById('momentSplice').checked;
        s.momentCommentProb = Math.max(0, Math.min(100, safeInt('momentCommentProb', s.momentCommentProb !== undefined ? s.momentCommentProb : 80)));
        s.momentLikeProb = Math.max(0, Math.min(100, safeInt('momentLikeProb', s.momentLikeProb !== undefined ? s.momentLikeProb : 80)));
        s.momentReplyDelayMin = Math.max(1, safeInt('momentReplyDelayMin', s.momentReplyDelayMin !== undefined ? s.momentReplyDelayMin : 10));
        s.diaryReplyTime = safeInt('diaryReplyTime', s.diaryReplyTime);
        s.letterReplyMin = safeInt('letterReplyMin', s.letterReplyMin);
        s.letterReplyMax = safeInt('letterReplyMax', s.letterReplyMax);
        s.letterCountMin = safeInt('letterCountMin', s.letterCountMin);
        s.letterCountMax = safeInt('letterCountMax', s.letterCountMax);
        s.letterFavProb = Math.max(0, Math.min(100, safeInt('letterFavProb', s.letterFavProb !== undefined ? s.letterFavProb : 30)));
        // 对方主动发消息
        s.proactiveEnable = document.getElementById('proactiveEnable').checked;
        s.proactiveMinSec = safeInt('proactiveMinSec', s.proactiveMinSec);
        s.proactiveMaxMin = safeInt('proactiveMaxMin', s.proactiveMaxMin);
        // 已读不回
        s.readNoReplyProb = safeInt('readNoReplyProb', s.readNoReplyProb);
        
        saveData();
        // 重新调度主动发消息定时器
        scheduleProactiveMessage();
    }
    function clearChatHistory() {
        if (confirm('确定清空所有聊天记录吗？')) {
            appData.chatHistory = [];
            saveData();
            renderMessages();
        }
    }

    // ========== 字卡APP ==========
    function openWordCard() {
        closeAllModals();
        document.getElementById('wordcardPage').style.display = 'flex';
        _wcContactScope = null; // 默认显示共用字卡
        var bar = document.getElementById('wordcardContactBar');
        if (bar) bar.classList.remove('show');
        var btn = document.getElementById('wordcardContactBtn');
        if (btn) { btn.textContent = '共用字卡'; btn.classList.remove('active'); }
        // 清空搜索框
        const si = document.getElementById('wordcardSearchInput');
        if (si) si.value = '';
        renderWordGroups();
        renderWordCardList();
        renderSpecialSettings();
        renderNudgeCardList();
        renderEmojiCardList();
        renderKaomojiCardList();
        renderImageCards();
        renderShoppingCardList();
    }
    function closeWordCard() {
        document.getElementById('wordcardPage').style.display = 'none';
    }
    function renderWordGroups() {
        const container = document.getElementById('wordcardTabs');
        container.innerHTML = '';
        var groups = _wcGetGroups();
        var curGroup = _wcGetCurrentGroup();
        
        groups.forEach(group => {
            const tab = document.createElement('div');
            tab.className = 'wordcard-tab' + (group === curGroup ? ' active' : '');
            tab.dataset.group = group;
            tab.textContent = group === 'default' ? '未分组' : group;
            tab.onclick = () => switchWordGroup(group);

            // 非"未分组"的分组显示删除按钮
            if (group !== 'default') {
                const del = document.createElement('span');
                del.className = 'wordcard-tab-del';
                del.textContent = '×';
                del.title = '删除分组';
                del.onclick = (e) => { e.stopPropagation(); deleteWordGroup(group); };
                tab.appendChild(del);
            }
            container.appendChild(tab);
        });
        
        const addTab = document.createElement('div');
        addTab.className = 'wordcard-tab add-tab';
        addTab.textContent = '+ 添加分组';
        addTab.onclick = addGroup;
        container.appendChild(addTab);
    }
    function switchWordGroup(group) {
        _wcSetCurrentGroup(group);
        appData.selectedCards = [];
        // 清空搜索框
        const si = document.getElementById('wordcardSearchInput');
        if (si) si.value = '';
        saveDataSync();
        // 切换分组只改标签栏激活状态，不重建标签栏（规则1/例外）
        document.querySelectorAll('.wordcard-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.group === group);
        });

        // 局部差量更新：复用已渲染卡片节点就地更新，不清空容器、不调用 renderWordCardList()（规则1）。
        // 不能用 display 显隐切换：目标分组独有的卡片尚未在 DOM 中（renderWordCardList 仅渲染当前分组），
        // 且已渲染节点保留的 data-card-index/onclick 属于旧分组，直接显隐会漏卡并导致索引错乱、误删误改。
        const container = document.getElementById('wordcardList');
        if (!container) return;
        const cards = _wcGetCardsByGroup(group);
        const existing = container.querySelectorAll('.wordcard-item');

        // 按位置复用已有节点：存在则就地更新，不足则新建追加（结构与 renderWordCardList 一致）
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            let item = existing[i];
            if (!item) {
                item = document.createElement('div');
                item.className = 'wordcard-item';
                const newCb = document.createElement('input');
                newCb.type = 'checkbox';
                newCb.className = 'wordcard-checkbox';
                item.appendChild(newCb);
                const newTextEl = document.createElement('div');
                newTextEl.className = 'wordcard-text';
                item.appendChild(newTextEl);
                const newOps = document.createElement('div');
                newOps.className = 'wordcard-ops';
                item.appendChild(newOps);
                container.appendChild(item);
            }
            // 就地更新节点状态：索引、隐藏样式、勾选、文字、操作按钮均对齐当前分组
            item.dataset.cardIndex = i;
            item.classList.toggle('hidden-card', !!card.hidden);
            const cb = item.querySelector('.wordcard-checkbox');
            if (cb) {
                cb.checked = appData.selectedCards.includes(card.text);
                // 重新绑定 onchange，确保引用当前分组的卡片（复用节点时旧闭包已失效）
                cb.onchange = function () {
                    if (cb.checked) {
                        if (!appData.selectedCards.includes(card.text)) appData.selectedCards.push(card.text);
                    } else {
                        appData.selectedCards = appData.selectedCards.filter(t => t !== card.text);
                    }
                    saveDataSync();
                };
            }
            const textEl = item.querySelector('.wordcard-text');
            if (textEl) textEl.textContent = card.text;
            const ops = item.querySelector('.wordcard-ops');
            if (ops) {
                ops.innerHTML =
                    '<span onclick="editWordCard(' + i + ')">修改</span>' +
                    '<span onclick="toggleHideCard(' + i + ')">' + (card.hidden ? '显示' : '隐藏') + '</span>' +
                    '<span onclick="deleteWordCard(' + i + ')">删除</span>';
            }
        }

        // 新分组卡片较少时，移除多余的旧节点
        for (let i = cards.length; i < existing.length; i++) {
            if (existing[i] && existing[i].parentNode) existing[i].parentNode.removeChild(existing[i]);
        }
    }
    function deleteWordGroup(gn){
        if(gn==='default') return;
        if(!confirm('删除分组"'+gn+'"？该分组内的字卡将自动归类到"未分组"。')) return;
        var cards = _wcGetCards();
        var groupCards = cards[gn]||[];
        // 将原分组字卡移至默认分组(default=未分组)
        if(!cards['default']) cards['default']=[];
        cards['default']=cards['default'].concat(groupCards);
        delete cards[gn];
        var groups = _wcGetGroups().filter(g=>g!==gn);
        _wcSetGroups(groups);
        if(_wcGetCurrentGroup()===gn) _wcSetCurrentGroup('default');
        saveDataSync();
        renderWordGroups();
        renderWordCardList();
    }
    function addGroup() {
        const name = prompt('输入分组名称');
        if (!name || !name.trim()) return;
        var groups = _wcGetGroups();
        if (groups.includes(name.trim())) {
            alert('分组已存在');
            return;
        }
        groups.push(name.trim());
        _wcSetGroups(groups);
        var cards = _wcGetCards();
        cards[name.trim()] = [];
        _wcSetCurrentGroup(name.trim());
        saveDataSync();
        renderWordGroups();
        renderWordCardList();
    }
    function renderWordCardList() {
        const container = document.getElementById('wordcardList');
        const group = _wcGetCurrentGroup();
        const cards = _wcGetCardsByGroup(group);
        
        // 获取搜索关键词
        const searchInput = document.getElementById('wordcardSearchInput');
        const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
        
        container.innerHTML = '';
        
        let visibleCount = 0;
        cards.forEach((card, index) => {
            // 搜索过滤
            if (keyword && !card.text.toLowerCase().includes(keyword)) return;
            visibleCount++;
            const item = document.createElement('div');
            item.className = 'wordcard-item' + (card.hidden ? ' hidden-card' : '');
            item.dataset.cardIndex = index;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'wordcard-checkbox';
            // Bug3：selectedCards 改存文本匹配，搜索过滤后批量操作也不会错乱
            checkbox.checked = appData.selectedCards.includes(card.text);
            checkbox.onchange = () => {
                if (checkbox.checked) {
                    if (!appData.selectedCards.includes(card.text)) appData.selectedCards.push(card.text);
                } else {
                    appData.selectedCards = appData.selectedCards.filter(t => t !== card.text);
                }
                saveDataSync();
            };
            item.appendChild(checkbox);
            
            const text = document.createElement('div');
            text.className = 'wordcard-text';
            text.textContent = card.text;
            item.appendChild(text);
            
            const ops = document.createElement('div');
            ops.className = 'wordcard-ops';
            ops.innerHTML = `
                <span onclick="editWordCard(${index})">修改</span>
                <span onclick="toggleHideCard(${index})">${card.hidden ? '显示' : '隐藏'}</span>
                <span onclick="deleteWordCard(${index})">删除</span>
            `;
            item.appendChild(ops);
            
            container.appendChild(item);
        });
    }
    function batchUploadWord() {
        appData.batchUploadType = 'word';
        document.getElementById('batchUploadTextarea').value = '';
        document.getElementById('batchUploadTextarea').placeholder = '一句一行';
        document.getElementById('batchUploadModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
    }
    function closeBatchUpload() {
        document.getElementById('batchUploadModal').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }
    function confirmBatchUpload() {
        const text = document.getElementById('batchUploadTextarea').value;
        const type = appData.batchUploadType;
        // 字卡(word)导入支持 JSON 格式，仅提取纯字卡内容；其余类型保持"一句一行"
        const lines = (type === 'word') ? parseCardTexts(text) : text.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length === 0) return;

        if (type === 'word') {
            const group = _wcGetCurrentGroup();
            var cardsObj = _wcGetCards();
            if (!cardsObj[group]) cardsObj[group] = [];
            const seen = new Set(cardsObj[group].map(c => (c.text || '').trim()));
            let duplicateCount = 0;
            const newItems = [];

            lines.forEach(line => {
                const key = line.trim();
                if (seen.has(key)) {
                    duplicateCount++;
                } else {
                    seen.add(key);
                    cardsObj[group].push({ text: line, hidden: false });
                    newItems.push(line);
                }
            });
            saveDataSync();

            // 使用 DocumentFragment 批量插入新节点（规则5）
            var container = document.getElementById('wordcardList');
            if (container && newItems.length > 0) {
                var searchInput = document.getElementById('wordcardSearchInput');
                var keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
                var startIndex = cardsObj[group].length - newItems.length;
                var fragment = document.createDocumentFragment();

                newItems.forEach(function(line, i) {
                    if (keyword && !line.toLowerCase().includes(keyword)) return;
                    var index = startIndex + i;
                    var item = document.createElement('div');
                    item.className = 'wordcard-item';
                    item.dataset.cardIndex = index;

                    var checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'wordcard-checkbox';
                    checkbox.checked = appData.selectedCards.includes(line);
                    (function(cardText) {
                        checkbox.onchange = function() {
                            if (checkbox.checked) {
                                if (!appData.selectedCards.includes(cardText)) appData.selectedCards.push(cardText);
                            } else {
                                appData.selectedCards = appData.selectedCards.filter(function(t) { return t !== cardText; });
                            }
                            saveDataSync();
                        };
                    })(line);
                    item.appendChild(checkbox);

                    var textDiv = document.createElement('div');
                    textDiv.className = 'wordcard-text';
                    textDiv.textContent = line;
                    item.appendChild(textDiv);

                    var ops = document.createElement('div');
                    ops.className = 'wordcard-ops';
                    ops.innerHTML = '<span onclick="editWordCard(' + index + ')">修改</span>' +
                        '<span onclick="toggleHideCard(' + index + ')">隐藏</span>' +
                        '<span onclick="deleteWordCard(' + index + ')">删除</span>';
                    item.appendChild(ops);

                    fragment.appendChild(item);
                });
                container.appendChild(fragment);
            }

            if (duplicateCount > 0) {
                alert('已添加 ' + (lines.length - duplicateCount) + ' 张，重复 ' + duplicateCount + ' 张已自动去重');
            }
        } else if (type === 'emoji') {
            var seen = new Set(appData.specialCards.emoji.map(function(c) { return (c.text || '').trim(); }));
            var newItems = [];
            lines.forEach(function(line) {
                var key = line.trim();
                if (!seen.has(key)) { seen.add(key); appData.specialCards.emoji.push({text: line, hidden: false}); newItems.push(line); }
            });
            saveDataSync();
            _appendSpecialCardItems('emojiCardList', appData.specialCards.emoji, newItems, 'editEmojiCard', 'toggleEmojiHide', 'deleteEmojiCard');
        } else if (type === 'kaomoji') {
            var seen = new Set(appData.specialCards.kaomoji.map(function(c) { return (c.text || '').trim(); }));
            var newItems = [];
            lines.forEach(function(line) {
                var key = line.trim();
                if (!seen.has(key)) { seen.add(key); appData.specialCards.kaomoji.push({text: line, hidden: false}); newItems.push(line); }
            });
            saveDataSync();
            _appendSpecialCardItems('kaomojiCardList', appData.specialCards.kaomoji, newItems, 'editKaomojiCard', 'toggleKaomojiHide', 'deleteKaomojiCard');
        } else if (type === 'nudge') {
            var seen = new Set(appData.specialCards.nudge.map(function(c) { return (c.text || '').trim(); }));
            var newItems = [];
            lines.forEach(function(line) {
                var key = line.trim();
                if (!seen.has(key)) { seen.add(key); appData.specialCards.nudge.push({text: line, hidden: false}); newItems.push(line); }
            });
            saveDataSync();
            _appendSpecialCardItems('nudgeCardList', appData.specialCards.nudge, newItems, 'editNudgeCard', 'toggleNudgeHide', 'deleteNudgeCard');
        } else if (type === 'shopping') {
            if (!appData.specialCards.shopping) appData.specialCards.shopping = [];
            var seen = new Set(appData.specialCards.shopping.map(function(c) { return (c.text || '').trim(); }));
            var newItems = [];
            lines.forEach(function(line) {
                var key = line.trim();
                if (!seen.has(key)) { seen.add(key); appData.specialCards.shopping.push({text: line, hidden: false}); newItems.push(line); }
            });
            saveDataSync();
            _appendSpecialCardItems('shoppingCardList', appData.specialCards.shopping, newItems, 'editShoppingCard', 'toggleShoppingHide', 'deleteShoppingCard');
        }

        closeBatchUpload();
    }
    // 辅助函数：使用 DocumentFragment 批量追加特殊字卡新节点（规则5）
    function _appendSpecialCardItems(containerId, fullArray, newItems, editFn, toggleFn, deleteFn) {
        var container = document.getElementById(containerId);
        if (!container || newItems.length === 0) return;
        var startIndex = fullArray.length - newItems.length;
        var fragment = document.createDocumentFragment();
        newItems.forEach(function(text, i) {
            var index = startIndex + i;
            var item = document.createElement('div');
            item.className = 'special-card-item';
            item.innerHTML = '<div class="card-text">' + _escapeHtml(text) + '</div>' +
                '<div class="card-ops">' +
                '<span onclick="' + editFn + '(' + index + ')">修改</span>' +
                '<span onclick="' + toggleFn + '(' + index + ')">隐藏</span>' +
                '<span onclick="' + deleteFn + '(' + index + ')">删除</span>' +
                '</div>';
            fragment.appendChild(item);
        });
        container.appendChild(fragment);
    }
    function _escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    // 解析导入文件为“纯字卡文本”数组。
    // 仅提取真正的字卡内容，不导入其他任何东西（不导入 emoji、拍一拍、状态、格言，
    // 也不导入 ]、exportDate、_note 等语法符号与元数据），不在文字上添加引号或符号。
    // 字卡网站不做拍一拍/emoji 兼容——那些是别的字卡处理器的格式，不使用。
    function parseCardTexts(rawText) {
        var out = [];
        if (!rawText) return out;
        var trimmed = String(rawText).trim();
        if (!trimmed) return out;
        var parsed = undefined;
        try { parsed = JSON.parse(trimmed); } catch (e) { parsed = undefined; }

        if (parsed !== undefined && parsed !== null) {
            // 基本类型（单行 JSON 字符串/数字）直接作为一张字卡
            if (typeof parsed === 'string' || typeof parsed === 'number' || typeof parsed === 'boolean') {
                var ps = String(parsed).trim();
                if (ps) out.push(ps);
                return out;
            }
            // 纯字符串数组 → 全部作为字卡
            if (Array.isArray(parsed)) {
                parsed.forEach(function(item) {
                    if (typeof item === 'string') { var s = item.trim(); if (s) out.push(s); }
                    else if (item && typeof item === 'object' && typeof item.text === 'string') { var s2 = item.text.trim(); if (s2) out.push(s2); }
                });
                return out;
            }
            if (typeof parsed === 'object') {
                // 仅提取字卡内容：优先 customReplies（系统预设备份中的字卡字段）；
                // 其次 wordCards（本站字卡备份格式）。其余字段（customEmojis/customPokes/
                // customStatuses/customMottos/exportDate/_note 等）一律忽略，不导入。
                var _pushStrings = function(arr) {
                    if (!Array.isArray(arr)) return;
                    arr.forEach(function(item) {
                        if (typeof item === 'string') { var s = item.trim(); if (s) out.push(s); }
                        else if (item && typeof item === 'object' && typeof item.text === 'string') { var s2 = item.text.trim(); if (s2) out.push(s2); }
                    });
                };
                if (Array.isArray(parsed.customReplies)) {
                    _pushStrings(parsed.customReplies);
                    return out;
                }
                if (parsed.wordCards && typeof parsed.wordCards === 'object') {
                    Object.keys(parsed.wordCards).forEach(function(g) { _pushStrings(parsed.wordCards[g]); });
                    return out;
                }
                // 既无 customReplies 也无 wordCards：返回空，不盲目提取其他字段
                return out;
            }
        }
        // 非 JSON 纯文本：一句一行（保持原有行为）
        trimmed.split(/\r?\n/).forEach(function(line) {
            var s = line.trim();
            if (s) out.push(s);
        });
        return out;
    }
    function uploadWordFile() {
        currentEditType = 'wordFile';
        document.getElementById('textFileInput').click();
    }
    function handleTextFileUpload(e) {
        if (currentEditType === 'wordFile') {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const text = ev.target.result;
                const lines = parseCardTexts(text);
                /* 自动分组：按文件名创建新分组 */
                var fileName = file.name.replace(/\.[^/.]+$/, '').trim() || '导入字卡';
                var groupName = fileName;
                /* 确保分组名不重复 */
                var groups = _wcContactScope ? (_wcGetScopeData().groups || []) : appData.wordGroups;
                var suffix = 1;
                while (groups.indexOf(groupName) >= 0) {
                    suffix++;
                    groupName = fileName + '_' + suffix;
                }
                /* 创建新分组并切换 */
                var cardsObj = _wcGetCards();
                if (!cardsObj[groupName]) cardsObj[groupName] = [];
                if (_wcContactScope) {
                    var sd = _wcGetScopeData();
                    if (!sd.groups) sd.groups = [];
                    sd.groups.push(groupName);
                    sd.currentGroup = groupName;
                } else {
                    appData.wordGroups.push(groupName);
                    appData.currentGroup = groupName;
                }
                /* 组内去重 */
                const seen = new Set(cardsObj[groupName].map(c => (c.text || '').trim()));
                let duplicateCount = 0;

                lines.forEach(line => {
                    const key = line.trim();
                    if (seen.has(key)) {
                        duplicateCount++;
                    } else {
                        seen.add(key);
                        cardsObj[groupName].push({ text: line, hidden: false });
                    }
                });

                saveDataSync();
                // 新建分组需要重建标签栏（增删分组允许调用 renderWordGroups）
                renderWordGroups();
                renderWordCardList();

                if (duplicateCount > 0) {
                    alert('已创建分组"' + groupName + '"并添加 ' + (lines.length - duplicateCount) + ' 张，重复 ' + duplicateCount + ' 张已自动去重');
                } else {
                    alert('已创建分组"' + groupName + '"并添加 ' + lines.length + ' 张字卡');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        } else if (currentEditType === 'emojiTextFile') {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const lines = ev.target.result.split(/\r?\n/).map(l => l.trim()).filter(l => l);
                const seen = new Set(appData.specialCards.emoji.map(c => (c.text || '').trim()));
                var newItems = [];
                lines.forEach(line => {
                    const key = line.trim();
                    if (!seen.has(key)) { seen.add(key); appData.specialCards.emoji.push({text: line, hidden: false}); newItems.push(line); }
                });
                saveDataSync();
                _appendSpecialCardItems('emojiCardList', appData.specialCards.emoji, newItems, 'editEmojiCard', 'toggleEmojiHide', 'deleteEmojiCard');
            };
            reader.readAsText(file);
            e.target.value = '';
        } else if (currentEditType === 'kaomojiTextFile') {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const lines = ev.target.result.split(/\r?\n/).map(l => l.trim()).filter(l => l);
                const seen = new Set(appData.specialCards.kaomoji.map(c => (c.text || '').trim()));
                var newItems = [];
                lines.forEach(line => {
                    const key = line.trim();
                    if (!seen.has(key)) { seen.add(key); appData.specialCards.kaomoji.push({text: line, hidden: false}); newItems.push(line); }
                });
                saveDataSync();
                _appendSpecialCardItems('kaomojiCardList', appData.specialCards.kaomoji, newItems, 'editKaomojiCard', 'toggleKaomojiHide', 'deleteKaomojiCard');
            };
            reader.readAsText(file);
            e.target.value = '';
        } else if (currentEditType === 'nudgeTextFile') {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const lines = ev.target.result.split(/\r?\n/).map(l => l.trim()).filter(l => l);
                const seen = new Set(appData.specialCards.nudge.map(c => (c.text || '').trim()));
                var newItems = [];
                lines.forEach(line => {
                    const key = line.trim();
                    if (!seen.has(key)) { seen.add(key); appData.specialCards.nudge.push({text: line, hidden: false}); newItems.push(line); }
                });
                saveDataSync();
                _appendSpecialCardItems('nudgeCardList', appData.specialCards.nudge, newItems, 'editNudgeCard', 'toggleNudgeHide', 'deleteNudgeCard');
            };
            reader.readAsText(file);
            e.target.value = '';
        }
    }

    function deleteSelectedCards() {
        const group = _wcGetCurrentGroup();
        if (appData.selectedCards.length === 0) {
            alert('请先勾选要删除的字卡');
            return;
        }
        if (!confirm(`确定删除选中的 ${appData.selectedCards.length} 张字卡吗？`)) return;

        var cardsObj = _wcGetCards();
        const list = cardsObj[group] || [];
        const selectedTexts = new Set(appData.selectedCards);
        // Bug3：按文本匹配删除，与渲染顺序/搜索过滤无关，绝不会删错
        cardsObj[group] = list.filter(c => !selectedTexts.has(c.text));
        appData.selectedCards = [];
        // 使用同步保存，避免快速连续删除时防抖导致数据丢失/白屏
        saveDataSync();
        // 局部更新：移除选中字卡对应的 DOM 节点，修正后续索引（规则1/2/3）
        var _delContainer = document.getElementById('wordcardList');
        if (_delContainer) {
            var _delItems = _delContainer.querySelectorAll('.wordcard-item');
            _delItems.forEach(function(el) {
                var _textEl = el.querySelector('.wordcard-text');
                var _txt = _textEl ? _textEl.textContent.trim() : '';
                if (selectedTexts.has(_txt)) el.remove();
            });
            // 修正剩余卡片的 data-card-index 和 onclick 索引
            var _remaining = _delContainer.querySelectorAll('.wordcard-item');
            _remaining.forEach(function(el, i) {
                el.dataset.cardIndex = i;
                var ops = el.querySelector('.wordcard-ops');
                if (ops) {
                    if (ops.children[0]) ops.children[0].setAttribute('onclick', 'editWordCard(' + i + ')');
                    if (ops.children[1]) ops.children[1].setAttribute('onclick', 'toggleHideCard(' + i + ')');
                    if (ops.children[2]) ops.children[2].setAttribute('onclick', 'deleteWordCard(' + i + ')');
                }
            });
        } else { renderWordCardList(); }
    }
    function hideSelectedCards() {
        const group = _wcGetCurrentGroup();
        if (appData.selectedCards.length === 0) {
            alert('请先勾选要隐藏的字卡');
            return;
        }
        var cardsObj = _wcGetCards();
        const selectedTexts = new Set(appData.selectedCards);
        // Bug3：按文本匹配隐藏
        if (cardsObj[group]) {
            cardsObj[group].forEach(c => { if (selectedTexts.has(c.text)) c.hidden = true; });
        }
        appData.selectedCards = [];
        saveDataSync();
        // 局部更新：只切换对应卡片的隐藏状态和按钮文字（规则1/2）
        var _hideContainer = document.getElementById('wordcardList');
        if (_hideContainer) {
            var _hideItems = _hideContainer.querySelectorAll('.wordcard-item');
            _hideItems.forEach(function(el) {
                var _textEl = el.querySelector('.wordcard-text');
                var _txt = _textEl ? _textEl.textContent.trim() : '';
                if (selectedTexts.has(_txt)) {
                    el.classList.add('hidden-card');
                    var ops = el.querySelector('.wordcard-ops');
                    if (ops && ops.children[1]) ops.children[1].textContent = '显示';
                }
                // 取消勾选
                var chk = el.querySelector('.wordcard-checkbox');
                if (chk) chk.checked = false;
            });
        } else { renderWordCardList(); }
    }
    function clearAllCards() {
        const group = _wcGetCurrentGroup();
        var cardsObj = _wcGetCards();
        const cards = cardsObj[group] || [];
        if (cards.length === 0) return;
        if (confirm(`确定清空当前分组所有 ${cards.length} 张字卡吗？`)) {
            cardsObj[group] = [];
            appData.selectedCards = [];
            saveDataSync();
            // 局部更新：清空列表容器，不重建整个页面（规则1/2）
            var container = document.getElementById('wordcardList');
            if (container) container.innerHTML = '';
        }
    }
    // 手动去重：删除当前分组内重复的字卡（仅保留首次出现）
    function dedupWordCards() {
        const group = _wcGetCurrentGroup();
        var cardsObj = _wcGetCards();
        const cards = cardsObj[group] || [];
        if (cards.length === 0) { alert('当前分组没有字卡'); return; }
        const seen = {};
        const unique = [];
        let dupCount = 0;
        cards.forEach(card => {
            const key = (card.text || '').trim();
            if (seen[key]) { dupCount++; }
            else { seen[key] = true; unique.push(card); }
        });
        if (dupCount === 0) { alert('当前分组没有重复字卡'); return; }
        cardsObj[group] = unique;
        appData.selectedCards = [];
        saveDataSync();
        // 局部更新：按文本移除重复项对应的 DOM 节点，修正后续索引（规则1/2/3）
        var container = document.getElementById('wordcardList');
        if (container) {
            var seenText = {};
            var items = container.querySelectorAll('.wordcard-item');
            items.forEach(function(el){
                var textEl = el.querySelector('.wordcard-text');
                var txt = textEl ? textEl.textContent.trim() : '';
                if (seenText[txt]) { el.remove(); }
                else { seenText[txt] = true; }
            });
            // 修正剩余卡片的 data-card-index 和 onclick 索引
            var remaining = container.querySelectorAll('.wordcard-item');
            remaining.forEach(function(el, i){
                el.dataset.cardIndex = i;
                var ops = el.querySelector('.wordcard-ops');
                if (ops) {
                    if (ops.children[0]) ops.children[0].setAttribute('onclick', 'editWordCard(' + i + ')');
                    if (ops.children[1]) ops.children[1].setAttribute('onclick', 'toggleHideCard(' + i + ')');
                    if (ops.children[2]) ops.children[2].setAttribute('onclick', 'deleteWordCard(' + i + ')');
                }
            });
        }
        alert(`已去重，删除重复字卡 ${dupCount} 张`);
    }

    function editWordCard(index) {
        const group = _wcGetCurrentGroup();
        var cardsObj = _wcGetCards();
        const card = cardsObj[group][index];
        const newText = prompt('修改字卡内容', card.text);
        if (newText !== null && newText.trim()) {
            card.text = newText.trim();
            saveDataSync();
            // 局部更新：只改对应卡片的文字
            var container = document.getElementById('wordcardList');
            var item = container && container.querySelector('.wordcard-item[data-card-index="' + index + '"]');
            if (item) {
                var textEl = item.querySelector('.wordcard-text');
                if (textEl) textEl.textContent = newText.trim();
            } else { renderWordCardList(); }
        }
    }
    function toggleHideCard(index) {
        const group = _wcGetCurrentGroup();
        var cardsObj = _wcGetCards();
        cardsObj[group][index].hidden = !cardsObj[group][index].hidden;
        saveDataSync();
        // 局部更新：只改对应卡片的隐藏状态
        var container = document.getElementById('wordcardList');
        var item = container && container.querySelector('.wordcard-item[data-card-index="' + index + '"]');
        if (item) {
            item.classList.toggle('hidden-card', cardsObj[group][index].hidden);
            var ops = item.querySelector('.wordcard-ops');
            if (ops) ops.children[1].textContent = cardsObj[group][index].hidden ? '显示' : '隐藏';
        } else { renderWordCardList(); }
    }
    function deleteWordCard(index){
        var cardsObj=_wcGetCards();
        var list=cardsObj[_wcGetCurrentGroup()];
        if(list&&index>=0&&index<list.length){
            list.splice(index,1);
            saveDataSync();
            // 局部更新：移除对应 DOM 元素，修正后续索引
            var container=document.getElementById('wordcardList');
            var item=container&&container.querySelector('.wordcard-item[data-card-index="'+index+'"]');
            if(item){
                container.removeChild(item);
                // 修正后续卡片的 data-card-index 和 onclick 索引
                var remaining=container.querySelectorAll('.wordcard-item');
                remaining.forEach(function(el){
                    var ci=parseInt(el.dataset.cardIndex,10);
                    if(ci>index){
                        var ni=ci-1;
                        el.dataset.cardIndex=ni;
                        var ops=el.querySelector('.wordcard-ops');
                        if(ops){
                            ops.children[0].setAttribute('onclick','editWordCard('+ni+')');
                            ops.children[1].setAttribute('onclick','toggleHideCard('+ni+')');
                            ops.children[2].setAttribute('onclick','deleteWordCard('+ni+')');
                        }
                    }
                });
            }else{renderWordCardList();}
        }
    }

    // 特殊字卡
    function renderSpecialSettings() {
        const s = appData.specialSettings;
        document.getElementById('enableEmoji').checked = s.enableEmoji;
        document.getElementById('emojiSendProb').value = s.emojiSendProb;
        document.getElementById('emojiSendProbVal').textContent = s.emojiSendProb;
        document.getElementById('emojiSplice').checked = s.emojiSplice;
        document.getElementById('enableKaomoji').checked = s.enableKaomoji;
        document.getElementById('kaomojiProb').value = s.kaomojiProb;
        document.getElementById('kaomojiProbVal').textContent = s.kaomojiProb;
        document.getElementById('kaomojiSplice').checked = s.kaomojiSplice;
    }
    function saveSpecialSettings() {
        const s = appData.specialSettings;
        s.enableEmoji = document.getElementById('enableEmoji').checked;
        s.emojiSendProb = parseInt(document.getElementById('emojiSendProb').value);
        s.emojiSplice = document.getElementById('emojiSplice').checked;
        s.enableKaomoji = document.getElementById('enableKaomoji').checked;
        s.kaomojiProb = parseInt(document.getElementById('kaomojiProb').value);
        s.kaomojiSplice = document.getElementById('kaomojiSplice').checked;
        
        document.getElementById('emojiSendProbVal').textContent = s.emojiSendProb;
        document.getElementById('kaomojiProbVal').textContent = s.kaomojiProb;
        saveData();
    }

    function renderEmojiCardList() {
        const container = document.getElementById('emojiCardList');
        container.innerHTML = '';
        appData.specialCards.emoji.forEach((card, index) => {
            const item = document.createElement('div');
            item.className = 'special-card-item' + (card.hidden ? ' hidden' : '');
            item.innerHTML = `
                <div class="card-text">${card.text}</div>
                <div class="card-ops">
                    <span onclick="editEmojiCard(${index})">修改</span>
                    <span onclick="toggleEmojiHide(${index})">${card.hidden ? '显示' : '隐藏'}</span>
                    <span onclick="deleteEmojiCard(${index})">删除</span>
                </div>
            `;
            container.appendChild(item);
        });
    }
    function editEmojiCard(index) {
        const newText = prompt('修改emoji', appData.specialCards.emoji[index].text);
        if (newText !== null && newText.trim()) {
            appData.specialCards.emoji[index].text = newText.trim();
            saveDataSync();
            // 局部更新：只改对应卡片的文字
            var container = document.getElementById('emojiCardList');
            var item = container && container.children[index];
            if (item) {
                var textEl = item.querySelector('.card-text');
                if (textEl) textEl.textContent = newText.trim();
            } else { renderEmojiCardList(); }
        }
    }
    function toggleEmojiHide(index) {
        appData.specialCards.emoji[index].hidden = !appData.specialCards.emoji[index].hidden;
        saveDataSync();
        // 局部更新：只改对应卡片的隐藏状态
        var container = document.getElementById('emojiCardList');
        var item = container && container.children[index];
        if (item) {
            item.classList.toggle('hidden', appData.specialCards.emoji[index].hidden);
            var ops = item.querySelector('.card-ops');
            if (ops) ops.children[1].textContent = appData.specialCards.emoji[index].hidden ? '显示' : '隐藏';
        } else { renderEmojiCardList(); }
    }
    function deleteEmojiCard(index) {
        if (confirm('确定删除这条emoji吗？')) {
            appData.specialCards.emoji.splice(index, 1);
            saveDataSync();
            // 局部更新：移除对应 DOM 元素，修正后续索引
            var container = document.getElementById('emojiCardList');
            if (container && container.children[index]) {
                container.removeChild(container.children[index]);
                for (var i = index; i < container.children.length; i++) {
                    var ops = container.children[i].querySelector('.card-ops');
                    if (ops) {
                        ops.children[0].setAttribute('onclick', 'editEmojiCard(' + i + ')');
                        ops.children[1].setAttribute('onclick', 'toggleEmojiHide(' + i + ')');
                        ops.children[2].setAttribute('onclick', 'deleteEmojiCard(' + i + ')');
                    }
                }
            } else { renderEmojiCardList(); }
        }
    }
    function batchUploadEmoji() {
        appData.batchUploadType = 'emoji';
        document.getElementById('batchUploadTextarea').value = '';
        document.getElementById('batchUploadTextarea').placeholder = '一行一个emoji';
        document.getElementById('batchUploadModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
    }
    function uploadEmojiFile() {
        currentEditType = 'emojiTextFile';
        document.getElementById('textFileInput').click();
    }

    function renderKaomojiCardList() {
        const container = document.getElementById('kaomojiCardList');
        container.innerHTML = '';
        appData.specialCards.kaomoji.forEach((card, index) => {
            const item = document.createElement('div');
            item.className = 'special-card-item' + (card.hidden ? ' hidden' : '');
            item.innerHTML = `
                <div class="card-text">${card.text}</div>
                <div class="card-ops">
                    <span onclick="editKaomojiCard(${index})">修改</span>
                    <span onclick="toggleKaomojiHide(${index})">${card.hidden ? '显示' : '隐藏'}</span>
                    <span onclick="deleteKaomojiCard(${index})">删除</span>
                </div>
            `;
            container.appendChild(item);
        });
    }
    function editKaomojiCard(index) {
        const newText = prompt('修改颜文字', appData.specialCards.kaomoji[index].text);
        if (newText !== null && newText.trim()) {
            appData.specialCards.kaomoji[index].text = newText.trim();
            saveDataSync();
            var container = document.getElementById('kaomojiCardList');
            var item = container && container.children[index];
            if (item) {
                var textEl = item.querySelector('.card-text');
                if (textEl) textEl.textContent = newText.trim();
            } else { renderKaomojiCardList(); }
        }
    }
    function toggleKaomojiHide(index) {
        appData.specialCards.kaomoji[index].hidden = !appData.specialCards.kaomoji[index].hidden;
        saveDataSync();
        var container = document.getElementById('kaomojiCardList');
        var item = container && container.children[index];
        if (item) {
            item.classList.toggle('hidden', appData.specialCards.kaomoji[index].hidden);
            var ops = item.querySelector('.card-ops');
            if (ops) ops.children[1].textContent = appData.specialCards.kaomoji[index].hidden ? '显示' : '隐藏';
        } else { renderKaomojiCardList(); }
    }
    function deleteKaomojiCard(index) {
        if (confirm('确定删除这条颜文字吗？')) {
            appData.specialCards.kaomoji.splice(index, 1);
            saveDataSync();
            var container = document.getElementById('kaomojiCardList');
            if (container && container.children[index]) {
                container.removeChild(container.children[index]);
                for (var i = index; i < container.children.length; i++) {
                    var ops = container.children[i].querySelector('.card-ops');
                    if (ops) {
                        ops.children[0].setAttribute('onclick', 'editKaomojiCard(' + i + ')');
                        ops.children[1].setAttribute('onclick', 'toggleKaomojiHide(' + i + ')');
                        ops.children[2].setAttribute('onclick', 'deleteKaomojiCard(' + i + ')');
                    }
                }
            } else { renderKaomojiCardList(); }
        }
    }
    function batchUploadKaomoji() {
        appData.batchUploadType = 'kaomoji';
        document.getElementById('batchUploadTextarea').value = '';
        document.getElementById('batchUploadTextarea').placeholder = '一行一个颜文字';
        document.getElementById('batchUploadModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
    }
    function uploadKaomojiFile() {
        currentEditType = 'kaomojiTextFile';
        document.getElementById('textFileInput').click();
    }

    // ===== 次元购物城字卡 =====
    function renderShoppingCardList() {
        const container = document.getElementById('shoppingCardList');
        if (!container) return;
        container.innerHTML = '';
        if (!appData.specialCards.shopping) appData.specialCards.shopping = [];
        appData.specialCards.shopping.forEach((card, index) => {
            const item = document.createElement('div');
            item.className = 'special-card-item' + (card.hidden ? ' hidden' : '');
            item.innerHTML = `
                <div class="card-text">${card.text}</div>
                <div class="card-ops">
                    <span onclick="editShoppingCard(${index})">修改</span>
                    <span onclick="toggleShoppingHide(${index})">${card.hidden ? '显示' : '隐藏'}</span>
                    <span onclick="deleteShoppingCard(${index})">删除</span>
                </div>
            `;
            container.appendChild(item);
        });
    }
    function editShoppingCard(index) {
        const newText = prompt('修改留言内容', appData.specialCards.shopping[index].text);
        if (newText !== null && newText.trim()) {
            appData.specialCards.shopping[index].text = newText.trim();
            saveDataSync();
            var container = document.getElementById('shoppingCardList');
            var item = container && container.children[index];
            if (item) {
                var textEl = item.querySelector('.card-text');
                if (textEl) textEl.textContent = newText.trim();
            } else { renderShoppingCardList(); }
        }
    }
    function toggleShoppingHide(index) {
        appData.specialCards.shopping[index].hidden = !appData.specialCards.shopping[index].hidden;
        saveDataSync();
        var container = document.getElementById('shoppingCardList');
        var item = container && container.children[index];
        if (item) {
            item.classList.toggle('hidden', appData.specialCards.shopping[index].hidden);
            var ops = item.querySelector('.card-ops');
            if (ops) ops.children[1].textContent = appData.specialCards.shopping[index].hidden ? '显示' : '隐藏';
        } else { renderShoppingCardList(); }
    }
    function deleteShoppingCard(index) {
        if (confirm('确定删除这条留言吗？')) {
            appData.specialCards.shopping.splice(index, 1);
            saveDataSync();
            var container = document.getElementById('shoppingCardList');
            if (container && container.children[index]) {
                container.removeChild(container.children[index]);
                for (var i = index; i < container.children.length; i++) {
                    var ops = container.children[i].querySelector('.card-ops');
                    if (ops) {
                        ops.children[0].setAttribute('onclick', 'editShoppingCard(' + i + ')');
                        ops.children[1].setAttribute('onclick', 'toggleShoppingHide(' + i + ')');
                        ops.children[2].setAttribute('onclick', 'deleteShoppingCard(' + i + ')');
                    }
                }
            } else { renderShoppingCardList(); }
        }
    }
    function batchUploadShopping() {
        appData.batchUploadType = 'shopping';
        document.getElementById('batchUploadTextarea').value = '';
        document.getElementById('batchUploadTextarea').placeholder = '一行一条购物城留言';
        document.getElementById('batchUploadModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
    }

    function uploadImageCards() {
        normalizeMediaCards();
        currentEditType = 'imageCard';
        document.getElementById('multiFileInput').click();
    }
    function normalizeMediaCards() {
        if (!appData.specialCards) appData.specialCards = {};
        ['image','video'].forEach(function(type) {
            if (!Array.isArray(appData.specialCards[type])) appData.specialCards[type] = [];
            appData.specialCards[type] = appData.specialCards[type].map(function(item) {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object') return item.src || item.data || item.url || '';
                return '';
            }).filter(function(src) {
                // 保留所有非空字符串，不再仅过滤 data: 开头的项
                // 防止因 localStorage 截断导致 data URI 损坏后被静默删除
                return typeof src === 'string' && src.length > 0;
            });
        });
    }
    function renderImageCards() {
        const grid = document.getElementById('imageCardGrid');
        normalizeMediaCards();
        grid.innerHTML = '';
        appData.specialCards.image.forEach((src, idx) => {
            const item = document.createElement('div');
            item.className = 'image-card-item';
            item.style.position = 'relative';
            item.innerHTML = `<img src="${src}" alt="" onerror="this.style.display='none';this.parentElement.style.background='#f0f0f0';this.parentElement.innerHTML+='<div style=\'display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#ccc;font-size:11px;\'>图片加载失败</div>';"><div class="publish-media-del" onclick="event.stopPropagation();deleteImageCard(${idx})" style="position:absolute;top:2px;right:2px;width:18px;height:18px;background:rgba(0,0,0,0.5);color:white;border-radius:50%;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2;">×</div>`;
            grid.appendChild(item);
        });
    }
    function deleteImageCard(idx) {
        // 边界检查，防止越界
        if (idx < 0 || idx >= appData.specialCards.image.length) {
            renderImageCards();
            return;
        }
        // 记录被删除的图片，用于清理朋友圈中的悬挂引用
        const deletedSrc = appData.specialCards.image[idx];
        appData.specialCards.image.splice(idx, 1);
        // 清理朋友圈中引用了该图片的媒体条目，避免悬挂引用导致渲染异常
        if (deletedSrc && appData.moments && appData.moments.list) {
            appData.moments.list.forEach(m => {
                if (m && m.media && m.media.length) {
                    m.media = m.media.filter(mediaItem => mediaItem.src !== deletedSrc);
                }
            });
        }
        // 使用同步保存，避免快速连续删除时防抖导致数据丢失/白屏
        saveDataSync();
        // 局部更新：移除对应 DOM 元素，修正后续索引
        var grid = document.getElementById('imageCardGrid');
        if (grid && grid.children[idx]) {
            grid.removeChild(grid.children[idx]);
            for (var i = idx; i < grid.children.length; i++) {
                var delBtn = grid.children[i].querySelector('.publish-media-del');
                if (delBtn) delBtn.setAttribute('onclick', 'event.stopPropagation();deleteImageCard(' + i + ')');
            }
        } else {
            renderImageCards();
        }
    }
    // 特殊字卡手动去重：nudge/emoji/kaomoji 按 text 去重，image 按图片数据去重
    function dedupSpecialCards(type) {
        const list = appData.specialCards[type];
        if (!list || list.length === 0) { alert('没有可去重的内容'); return; }
        const seen = {};
        const unique = [];
        let dupCount = 0;
        if (type === 'image' || type === 'video') {
            list.forEach(src => {
                if (seen[src]) { dupCount++; }
                else { seen[src] = true; unique.push(src); }
            });
        } else {
            list.forEach(card => {
                const key = (card.text || '').trim();
                if (seen[key]) { dupCount++; }
                else { seen[key] = true; unique.push(card); }
            });
        }
        if (dupCount === 0) { alert('没有重复内容'); return; }
        appData.specialCards[type] = unique;
        saveDataSync();
        // 局部更新：移除重复项对应的 DOM 节点，修正后续索引（规则1/2/3）
        if (type === 'image' || type === 'video') {
            var _imgGrid = document.getElementById('imageCardGrid');
            if (_imgGrid) {
                var _imgSeen = {};
                var _imgItems = _imgGrid.querySelectorAll('.image-card-item');
                _imgItems.forEach(function(el) {
                    var _im = el.querySelector('img');
                    var _src = _im ? _im.getAttribute('src') : '';
                    if (_imgSeen[_src]) el.remove();
                    else _imgSeen[_src] = true;
                });
                var _imgRemain = _imgGrid.querySelectorAll('.image-card-item');
                _imgRemain.forEach(function(el, i) {
                    var _delBtn = el.querySelector('.publish-media-del');
                    if (_delBtn) _delBtn.setAttribute('onclick', 'event.stopPropagation();deleteImageCard(' + i + ')');
                });
            } else { renderImageCards(); }
        } else {
            var _capType = type.charAt(0).toUpperCase() + type.slice(1);
            var _ddContainer = document.getElementById(type + 'CardList');
            if (_ddContainer) {
                var _ddSeen = {};
                var _ddItems = _ddContainer.querySelectorAll('.special-card-item');
                _ddItems.forEach(function(el) {
                    var _textEl = el.querySelector('.card-text');
                    var _txt = _textEl ? _textEl.textContent.trim() : '';
                    if (_ddSeen[_txt]) el.remove();
                    else _ddSeen[_txt] = true;
                });
                var _ddRemain = _ddContainer.querySelectorAll('.special-card-item');
                _ddRemain.forEach(function(el, i) {
                    var ops = el.querySelector('.card-ops');
                    if (ops) {
                        if (ops.children[0]) ops.children[0].setAttribute('onclick', 'edit' + _capType + 'Card(' + i + ')');
                        if (ops.children[1]) ops.children[1].setAttribute('onclick', 'toggle' + _capType + 'Hide(' + i + ')');
                        if (ops.children[2]) ops.children[2].setAttribute('onclick', 'delete' + _capType + 'Card(' + i + ')');
                    }
                });
            } else {
                if (type === 'nudge') renderNudgeCardList();
                else if (type === 'emoji') renderEmojiCardList();
                else if (type === 'kaomoji') renderKaomojiCardList();
                else if (type === 'shopping') renderShoppingCardList();
            }
        }
        alert(`已去重，删除重复 ${dupCount} 项`);
    }



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
/* 保存第三页四个输入框文字到 localStorage + IndexedDB(appData)，防止刷新/退出后消失 */
window.saveP3InputTexts=function(){
  var inputs=document.querySelectorAll('.p3-glass-input');
  var texts=[];
  inputs.forEach(function(inp){ texts.push(inp.value||''); });
  /* 1. localStorage 快速缓存 */
  try{ localStorage.setItem('p3_input_texts',JSON.stringify(texts)); }catch(e){}
  /* 2. 写入 appData（IndexedDB 持久存储，iOS PWA 下比 localStorage 更可靠） */
  try{
    if(typeof appData!=='undefined'){
      appData.p3InputTexts=texts.slice();
      if(typeof saveData==='function') saveData();
    }
  }catch(e){}
};
/* 恢复第三页四个输入框文字：优先 appData(IndexedDB)，回退 localStorage */
window.restoreP3InputTexts=function(){
  var inputs=document.querySelectorAll('.p3-glass-input');
  if(!inputs||!inputs.length) return;
  var saved=null;
  try{
    if(typeof appData!=='undefined'&&Array.isArray(appData.p3InputTexts)){
      saved=appData.p3InputTexts;
    }
  }catch(e){}
  if(!saved){
    try{
      var ls=JSON.parse(localStorage.getItem('p3_input_texts'));
      if(Array.isArray(ls)) saved=ls;
    }catch(e){}
  }
  if(!saved) return;
  inputs.forEach(function(inp){
    try{
      var idx=parseInt(inp.dataset.p3Input,10);
      if(!isNaN(idx)&&saved[idx]!==undefined&&saved[idx]!==''){
        inp.value=saved[idx];
      }
    }catch(e){}
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
    /* 初始化所有 p3-glass-input 的自动宽度 */
    document.querySelectorAll('.p3-glass-input').forEach(function(inp){
      if(typeof window.autoSizeInput==='function') window.autoSizeInput(inp);
    });
    /* 恢复已保存的文字（localStorage 快速缓存；IDB 加载后由 restoreP3InputTexts 再次恢复） */
    if(typeof window.restoreP3InputTexts==='function') window.restoreP3InputTexts();
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{
    init();
  }
  /* 保险：load 事件与延迟再次恢复，覆盖异步加载时序差异 */
  window.addEventListener('load',function(){ if(typeof window.restoreP3InputTexts==='function') window.restoreP3InputTexts(); });
  setTimeout(function(){ if(typeof window.restoreP3InputTexts==='function') window.restoreP3InputTexts(); },800);
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
