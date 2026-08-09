    // ===== 字卡联系人范围管理 =====
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


    // ===== 今日穿搭字卡管理 =====
    var _outfitDefaults = {
        tops: ['黑色皮夹克','深蓝赛车服','白色衬衫','黑色高领毛衣','军绿色工装外套','深灰卫衣','藏青色风衣','黑色机车夹克','白色T恤','深蓝牛仔外套','黑色棒球服','灰色针织衫'],
        bottoms: ['黑色机车裤','深蓝牛仔裤','卡其色工装裤','黑色运动裤','灰色休闲裤','深灰束脚裤','黑色皮裤','藏青色西裤','迷彩工装裤','黑色哈伦裤'],
        shoes: ['黑色机车靴','白色运动鞋','黑色马丁靴','赛车手套靴','切尔西靴','黑色高帮帆布鞋','深棕皮靴','白色板鞋','黑色老爹鞋','军靴'],
        bedtime: ['晚安，想你','今晚月色真美','睡前记得想我','盖好被子别着凉','梦里见','今天也很喜欢你','早点睡，明天见','抱不到你就抱枕头吧','睡前吻你一下','今天辛苦啦，晚安']
    };
    // 初始化（仅首次）：字段不存在时填充内置默认；用户删空后不再补齐
    function initOutfitCards() {
        const s = appData.diary.settings;
        if (!s.outfitCards || typeof s.outfitCards !== 'object' || Array.isArray(s.outfitCards)) {
            s.outfitCards = {
                tops: _outfitDefaults.tops.map(function(t){ return {text:t, hidden:false}; }),
                bottoms: _outfitDefaults.bottoms.map(function(t){ return {text:t, hidden:false}; }),
                shoes: _outfitDefaults.shoes.map(function(t){ return {text:t, hidden:false}; }),
                bedtime: _outfitDefaults.bedtime.map(function(t){ return {text:t, hidden:false}; })
            };
            return;
        }
        // 确保四个分类 key 都是数组（防止部分缺失）， bedtime 首次出现时补齐内置默认
        ['tops','bottoms','shoes','bedtime'].forEach(function(k){
            if (!Array.isArray(s.outfitCards[k])) {
                if (k === 'bedtime' && _outfitDefaults[k]) {
                    s.outfitCards[k] = _outfitDefaults[k].map(function(t){ return {text:t, hidden:false}; });
                } else {
                    s.outfitCards[k] = [];
                }
            }
        });
    }
    function outfitEsc(s) {
        return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    // 渲染穿搭/睡前字卡列表
    function renderOutfitCardSettings() {
        initOutfitCards();
        renderOutfitCategoryCards('outfitCardSettingsWrap', [
            {key:'tops', label:'上衣字卡'},
            {key:'bottoms', label:'下衣字卡'},
            {key:'shoes', label:'鞋子字卡'}
        ]);
        renderOutfitCategoryCards('bedtimeCardSettingsWrap', [
            {key:'bedtime', label:'睡前想告诉你字卡'}
        ]);
    }
    function renderOutfitCategoryCards(wrapId, types) {
        const wrap = document.getElementById(wrapId);
        if (!wrap) return;
        const s = appData.diary.settings;
        let html = '';
        types.forEach(function(t){
            const cards = (s.outfitCards && Array.isArray(s.outfitCards[t.key])) ? s.outfitCards[t.key] : [];
            const visibleCount = cards.filter(function(c){return !c.hidden;}).length;
            html += '<div style="margin-bottom:12px;">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">';
            html += '<span style="font-size:13px;color:#4a90d9;font-weight:600;font-family:var(--font-family);">'+t.label+'</span>';
            html += '<span style="font-size:11px;color:#999;font-family:var(--font-family);">共'+cards.length+'条 · 可用'+visibleCount+'</span>';
            html += '</div>';
            html += '<div style="display:flex;gap:4px;margin-bottom:6px;">';
            html += '<button onclick="batchUploadOutfitCards(\''+t.key+'\')" style="flex:1;padding:6px;border:1px solid #c8ddf0;border-radius:8px;background:#fff;font-size:12px;cursor:pointer;font-family:var(--font-family);">批量上传</button>';
            html += '<button onclick="addOutfitCard(\''+t.key+'\')" style="flex:1;padding:6px;border:1px solid #c8ddf0;border-radius:8px;background:#fff;font-size:12px;cursor:pointer;font-family:var(--font-family);">+ 添加</button>';
            html += '</div>';
            if (cards.length === 0) {
                html += '<div style="font-size:12px;color:#bbb;padding:8px 0;text-align:center;font-family:var(--font-family);">暂无字卡，点击上方添加</div>';
            } else {
                cards.forEach(function(c, i){
                    const hidden = !!c.hidden;
                    html += '<div style="display:flex;align-items:center;gap:4px;padding:5px 8px;background:'+(hidden?'#f2f2f2':'#f7fbff')+';border:1px solid '+(hidden?'#e0e0e0':'#e0eef9')+';border-radius:8px;margin-bottom:4px;">';
                    html += '<span style="flex:1;font-size:12px;color:'+(hidden?'#bbb':'#333')+';font-family:var(--font-family);'+(hidden?'text-decoration:line-through;':'')+'">'+outfitEsc(c.text)+'</span>';
                    html += '<button onclick="toggleHideOutfitCard(\''+t.key+'\','+i+')" title="'+(hidden?'显示':'隐藏')+'" style="padding:3px 8px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:11px;cursor:pointer;font-family:var(--font-family);">'+(hidden?'显示':'隐藏')+'</button>';
                    html += '<button onclick="editOutfitCard(\''+t.key+'\','+i+')" title="编辑" style="padding:3px 8px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:11px;cursor:pointer;font-family:var(--font-family);">编辑</button>';
                    html += '<button onclick="deleteOutfitCard(\''+t.key+'\','+i+')" title="删除" style="padding:3px 8px;border:1px solid #f0d0d0;border-radius:6px;background:#fff;font-size:11px;cursor:pointer;color:#d00;font-family:var(--font-family);">删除</button>';
                    html += '</div>';
                });
            }
            html += '</div>';
        });
        wrap.innerHTML = html;
    }
    // 添加单条
    function addOutfitCard(type) {
        const text = prompt('请输入字卡内容：');
        if (!text || !text.trim()) return;
        const s = appData.diary.settings;
        initOutfitCards();
        const val = text.trim();
        if (!s.outfitCards[type].some(function(c){return c.text === val;})) {
            s.outfitCards[type].push({text:val, hidden:false});
            saveData();
        }
        renderOutfitCardSettings();
    }
    // 批量上传（一句一行）
    function batchUploadOutfitCards(type) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:10001;display:flex;align-items:center;justify-content:center;';
        const box = document.createElement('div');
        box.style.cssText = 'background:#fff;border-radius:16px;padding:16px;width:86%;max-width:360px;box-shadow:0 4px 20px rgba(0,0,0,0.15);font-family:var(--font-family);';
        const title = document.createElement('div');
        title.style.cssText = 'font-size:15px;font-weight:600;margin-bottom:8px;color:#4a90d9;';
        title.textContent = '批量上传字卡';
        const hint = document.createElement('div');
        hint.style.cssText = 'font-size:11px;color:#999;margin-bottom:8px;';
        hint.textContent = '一句一行，每行一个字卡（重复的会自动跳过）';
        const ta = document.createElement('textarea');
        ta.style.cssText = 'width:100%;box-sizing:border-box;min-height:150px;border:1px solid #c8ddf0;border-radius:8px;padding:8px;font-size:13px;outline:none;resize:vertical;font-family:var(--font-family);';
        ta.placeholder = '一句一行\n例如：\n白色衬衫\n黑色T恤\n卡其色风衣';
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:8px;margin-top:10px;';
        const cancel = document.createElement('button');
        cancel.textContent = '取消';
        cancel.style.cssText = 'flex:1;padding:9px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font-size:13px;font-family:var(--font-family);';
        const ok = document.createElement('button');
        ok.textContent = '上传';
        ok.style.cssText = 'flex:1;padding:9px;border:none;border-radius:8px;background:#4a90d9;color:#fff;cursor:pointer;font-size:13px;font-family:var(--font-family);';
        btnRow.appendChild(cancel); btnRow.appendChild(ok);
        box.appendChild(title); box.appendChild(hint); box.appendChild(ta); box.appendChild(btnRow);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        cancel.onclick = function(){ document.body.removeChild(overlay); };
        ok.onclick = function(){
            const lines = ta.value.split(/\n/).map(function(l){return l.trim();}).filter(function(l){return l.length > 0;});
            if (lines.length === 0){ document.body.removeChild(overlay); return; }
            const s = appData.diary.settings;
            initOutfitCards();
            lines.forEach(function(l){
                if (!s.outfitCards[type].some(function(c){return c.text === l;})) {
                    s.outfitCards[type].push({text:l, hidden:false});
                }
            });
            saveData();
            renderOutfitCardSettings();
            document.body.removeChild(overlay);
        };
    }
    // 编辑
    function editOutfitCard(type, idx) {
        const s = appData.diary.settings;
        const cards = s.outfitCards[type] || [];
        if (!cards[idx]) return;
        const text = prompt('编辑字卡内容：', cards[idx].text);
        if (text === null) return;
        if (!text.trim()) return;
        const val = text.trim();
        // 避免与其他项重复
        if (cards.some(function(c,i){return i !== idx && c.text === val;})) {
            alert('已存在相同内容的字卡');
            return;
        }
        cards[idx].text = val;
        saveData();
        renderOutfitCardSettings();
    }
    // 删除
    function deleteOutfitCard(type, idx) {
        const s = appData.diary.settings;
        const cards = s.outfitCards[type] || [];
        if (!cards[idx]) return;
        if (!confirm('确定删除字卡「'+cards[idx].text+'」吗？')) return;
        cards.splice(idx, 1);
        saveData();
        renderOutfitCardSettings();
    }
    // 隐藏/显示
    function toggleHideOutfitCard(type, idx) {
        const s = appData.diary.settings;
        const cards = s.outfitCards[type] || [];
        if (!cards[idx]) return;
        cards[idx].hidden = !cards[idx].hidden;
        saveData();
        renderOutfitCardSettings();
    }
    // 生成穿搭字符串：从三类穿搭字卡随机选取（隐藏的不参与；某类全隐藏或删空则该项省略）
    function buildOutfitString() {
        const s = appData.diary.settings;
        initOutfitCards();
        const types = ['tops','bottoms','shoes'];
        const parts = [];
        types.forEach(function(k){
            const cards = (s.outfitCards && s.outfitCards[k]) ? s.outfitCards[k] : [];
            const pool = cards.filter(function(c){return !c.hidden;}).map(function(c){return c.text;});
            if (pool.length > 0) parts.push(pool[Math.floor(Math.random() * pool.length)]);
        });
        return parts.join(' + ');
    }
    // 生成睡前想告诉你语句：从睡前字卡随机选取（隐藏/删空时返回默认语句）
    function buildBedtimeString() {
        const s = appData.diary.settings;
        initOutfitCards();
        const cards = (s.outfitCards && Array.isArray(s.outfitCards.bedtime)) ? s.outfitCards.bedtime : [];
        const pool = cards.filter(function(c){return !c.hidden;}).map(function(c){return c.text;});
        if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
        return '晚安，想你';
    }
    function closeDiarySettings() {
        document.getElementById('diarySettingsModal').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }
    // 防抖：日记/信封设置滑杆拖动时避免每次 input 都全量重建列表导致卡顿/崩溃
    var _diaryListRenderTimer = null;
    var _letterListRenderTimer = null;
    function _debouncedDiaryListRender() {
        if (_diaryListRenderTimer) clearTimeout(_diaryListRenderTimer);
        _diaryListRenderTimer = setTimeout(function () {
            _diaryListRenderTimer = null;
            try { renderDiaryList(); } catch (e) { console.error('renderDiaryList失败:', e); }
        }, 200);
    }
    function _debouncedLetterListRender() {
        if (_letterListRenderTimer) clearTimeout(_letterListRenderTimer);
        _letterListRenderTimer = setTimeout(function () {
            _letterListRenderTimer = null;
            try { renderLetterList(); } catch (e) { console.error('renderLetterList失败:', e); }
        }, 200);
    }
    function saveDiarySettings() {
      try {
        const s = appData.diary.settings;
        s.pageBg = document.getElementById('diaryPageBg').value;
        s.cardBg = document.getElementById('diaryCardBg').value;
        s.cardBorderColor = document.getElementById('diaryCardBorderColor').value;
        s.textColor = document.getElementById('diaryTextColor').value;
        s.fontSize = parseInt(document.getElementById('diaryFontSize').value);
        s.spliceMin = parseInt(document.getElementById('diarySpliceMin').value);
        s.spliceMax = parseInt(document.getElementById('diarySpliceMax').value);
        s.urgeProb = parseInt(document.getElementById('diaryUrgeProb').value);
        s.replyProb = parseInt(document.getElementById('diaryReplyProb').value);
        s.modalWidth = parseInt(document.getElementById('diaryModalWidth').value);
        s.modalHeight = parseInt(document.getElementById('diaryModalHeight').value);
        s.modalBg = document.getElementById('diaryModalBg').value;
        s.modalBorderColor = document.getElementById('diaryModalBorderColor').value;
        s.rulerEnabled = document.getElementById('diaryRulerEnabled').checked;
        s.rulerThickness = parseFloat(document.getElementById('diaryRulerThickness').value);
        s.rulerColor = hexToRgba(document.getElementById('diaryRulerColor').value, 0.15);
        s.sentenceMode = document.getElementById('diarySentenceMode').checked;
        const diaryCssTextarea = document.getElementById('diaryCustomCss');
        if (diaryCssTextarea) s.customCss = diaryCssTextarea.value;
        const fsVal = document.getElementById('diaryFontSizeVal');
        if (fsVal) fsVal.textContent = s.fontSize;
        document.getElementById('diaryModalWidthVal').textContent = s.modalWidth + '%';
        document.getElementById('diaryModalHeightVal').textContent = s.modalHeight + 'vh';
        document.getElementById('diaryRulerThicknessVal').textContent = s.rulerThickness + 'px';
        saveData();
        applyDiaryCustomCss();
        applyDiaryTheme();
        markCustomColor(document.getElementById('diaryPage'));
        _debouncedDiaryListRender();
      } catch (e) { console.error('saveDiarySettings失败:', e); }
    }
    function applyDiaryCustomCss() {
        const s = appData.diary.settings;
        let styleEl = document.getElementById('diaryCustomStyle');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'diaryCustomStyle';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = s.customCss || '';
    }
    function applyDiaryTheme() {
        const s = appData.diary.settings;
        const page = document.getElementById('diaryPage');
        if (!page) return;
        if (s.pageBg) {
            page.style.setProperty('background', s.pageBg, 'important');
        } else {
            page.style.removeProperty('background');
        }
        if (s.textColor) {
            page.style.setProperty('color', s.textColor, 'important');
            page.style.setProperty('--diary-text-color', s.textColor);
        } else {
            page.style.removeProperty('color');
            page.style.removeProperty('--diary-text-color');
        }
    }
    function resetDiaryAppearance() {
        if (!confirm('确定恢复日记外观为默认设置？所有外观修改将被重置。')) return;
        var s = appData.diary.settings;
        s.cardBg = '#ffffff';
        s.pageBg = '#e8f4fd';
        s.textColor = '#1a1a1a';
        s.fontFamily = '';
        s.fontData = '';
        s.fontSize = 14;
        s.bgImage = '';
        s.rulerEnabled = false;
        s.rulerThickness = 1;
        s.rulerColor = '#e0e0e0';
        s.sentenceMode = false;
        s.customCss = '';
        // 移除自定义字体样式
        var oldStyle = document.getElementById('diaryFontStyle');
        if (oldStyle) oldStyle.remove();
        saveData();
        applyDiaryTheme();
        renderDiaryList();
        // 刷新设置面板
        try { loadDiarySettings(); } catch(e) {}
        toast('日记外观已恢复默认');
    }
    function uploadDiaryBg() {
        currentEditType = 'diaryBg';
        document.getElementById('fileInput').click();
    }
    function resetDiaryBg() {
        appData.diary.settings.bgImage = '';
        saveData();
        renderDiaryList();
    }
    function uploadDiaryFont() {
        currentEditType = 'diaryFont';
        document.getElementById('fontFileInput').click();
    }
    function resetDiaryFont() {
        appData.diary.settings.fontFamily = '';
        appData.diary.settings.fontData = '';
        const oldStyle = document.getElementById('diaryFontStyle');
        if (oldStyle) oldStyle.remove();
        saveData();
        renderDiaryList();
    }
    function uploadLetterBg() {
        currentEditType = 'letterBg';
        document.getElementById('fileInput').click();
    }
    function resetLetterBg() {
        appData.letter.settings.bgImage = '';
        saveData();
        renderLetterList();
    }
    function uploadLetterFont() {
        currentEditType = 'letterFont';
        document.getElementById('fontFileInput').click();
    }
    function resetLetterFont() {
        appData.letter.settings.fontFamily = '';
        appData.letter.settings.fontData = '';
        const oldStyle = document.getElementById('letterFontStyle');
        if (oldStyle) oldStyle.remove();
        saveData();
        renderLetterList();
    }
    function saveLetterSettings() {
      try {
        const s = appData.letter.settings;
        s.pageBg = document.getElementById('letterPageBg').value;
        s.cardBg = document.getElementById('letterCardBg').value;
        s.cardBorderColor = document.getElementById('letterCardBorderColor').value;
        s.textColor = document.getElementById('letterTextColor').value;
        s.fontSize = parseInt(document.getElementById('letterFontSize').value);
        s.modalWidth = parseInt(document.getElementById('letterModalWidth').value);
        s.modalHeight = parseInt(document.getElementById('letterModalHeight').value);
        s.modalBg = document.getElementById('letterModalBg').value;
        s.modalBorderColor = document.getElementById('letterModalBorderColor').value;
        s.rulerEnabled = document.getElementById('letterRulerEnabled').checked;
        s.rulerThickness = parseFloat(document.getElementById('letterRulerThickness').value);
        s.rulerColor = hexToRgba(document.getElementById('letterRulerColor').value, 0.15);
        s.sentenceMode = document.getElementById('letterSentenceMode').checked;
        const letterCssTextarea = document.getElementById('letterCustomCss');
        if (letterCssTextarea) s.customCss = letterCssTextarea.value;
        document.getElementById('letterFontSizeVal').textContent = s.fontSize;
        document.getElementById('letterModalWidthVal').textContent = s.modalWidth + '%';
        document.getElementById('letterModalHeightVal').textContent = s.modalHeight + 'vh';
        document.getElementById('letterRulerThicknessVal').textContent = s.rulerThickness + 'px';
        saveData();
        applyLetterCustomCss();
        applyLetterTheme();
        markCustomColor(document.getElementById('letterPage'));
        _debouncedLetterListRender();
      } catch (e) { console.error('saveLetterSettings失败:', e); }
    }
    function applyLetterCustomCss() {
        const s = appData.letter.settings;
        let styleEl = document.getElementById('letterCustomStyle');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'letterCustomStyle';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = s.customCss || '';
    }
    function applyLetterTheme() {
        const s = appData.letter.settings;
        const page = document.getElementById('letterPage');
        if (!page) return;
        if (s.pageBg) {
            page.style.setProperty('background', s.pageBg, 'important');
        } else {
            page.style.removeProperty('background');
        }
        if (s.textColor) {
            page.style.setProperty('color', s.textColor, 'important');
            page.style.setProperty('--letter-text-color', s.textColor);
        } else {
            page.style.removeProperty('color');
            page.style.removeProperty('--letter-text-color');
        }
    }
    function resetLetterAppearance() {
        if (!confirm('确定恢复信封外观为默认设置？所有外观修改将被重置。')) return;
        var s = appData.letter.settings;
        s.cardBg = '#ffffff';
        s.pageBg = '#85DBF9';
        s.cardBorderColor = '#85DBF9';
        s.textColor = '#1a1a1a';
        s.fontFamily = '';
        s.fontData = '';
        s.fontSize = 14;
        s.bgImage = '';
        s.rulerEnabled = true;
        s.rulerThickness = 1;
        s.rulerColor = 'rgba(133,219,249,0.25)';
        s.sentenceMode = false;
        s.customCss = '';
        s.modalWidth = 86;
        s.modalHeight = 70;
        s.modalNoGlass = false;
        s.modalBg = '';
        s.modalBorderColor = '';
        // 移除自定义字体样式
        var oldStyle = document.getElementById('letterFontStyle');
        if (oldStyle) oldStyle.remove();
        saveData();
        applyLetterTheme();
        applyLetterCustomCss();
        renderLetterList();
        // 刷新设置面板
        try { loadLetterSettings(); } catch(e) {}
        toast('信封外观已恢复默认');
    }
    function handleFontUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        // 如果是自定义字体管理上传
        if (currentEditType && currentEditType.startsWith('customFont_')) {
            const target = currentEditType.replace('customFont_', '');
            handleCustomFontUpload(event, target);
            return;
        }
        try {
            const reader = new FileReader();
            reader.onload = function(ev) {
            const base64 = ev.target.result;
            const fontName = 'customFont_' + Date.now();
            // 使用 @font-face 方式加载字体（兼容性更好，不会导致界面重启）
            let styleId = '';
            if (currentEditType === 'diaryFont') styleId = 'diaryFontStyle';
            else if (currentEditType === 'letterFont') styleId = 'letterFontStyle';
            else if (currentEditType === 'globalFont') styleId = 'globalFontStyle';
            applyFontFace(styleId, fontName, base64);
            if (currentEditType === 'diaryFont') {
                appData.diary.settings.fontFamily = fontName;
                appData.diary.settings.fontData = base64;
                saveData();
                renderDiaryList();
                alert('日记字体上传成功！');
            } else if (currentEditType === 'letterFont') {
                appData.letter.settings.fontFamily = fontName;
                appData.letter.settings.fontData = base64;
                saveData();
                renderLetterList();
                alert('信封字体上传成功！');
            } else if (currentEditType === 'globalFont') {
                appData.globalSettings.fontFamily = fontName;
                appData.globalSettings.fontData = base64;
                applyGlobalSettings();
                saveData();
                alert('全局字体上传成功！');
            }
        };
        reader.onerror = function() {
            alert('字体文件读取失败，请重试');
        };
        reader.readAsDataURL(file);
        event.target.value = '';
        } catch(e) { console.error('handleFontUpload error:', e); alert('字体上传失败'); event.target.value = ''; }
    }
    function checkDailyAutoLetter(){
        const today=new Date().toDateString();
        var lastDate=appData.letter.lastAutoLetterDate||appData._lastAutoLetterDate||'';
        if(lastDate===today)return;
        const s=appData.chatSettings;
        /* 使用 !== undefined 判断，避免 0 被 || 吞掉；默认值与初始化保持一致 (1, 3) */
        const mn=(s.letterCountMin!==undefined)?s.letterCountMin:1;
        const mx=(s.letterCountMax!==undefined)?s.letterCountMax:3;
        if(mn===0&&mx===0)return;
        /* 先检查字卡是否可用，再标记日期——字卡为空时不设标记，下次轮询自动重试 */
        const ac=getAllVisibleWordCards();
        if(ac.length===0)return;
        /* 字卡可用，标记今天已处理 */
        appData.letter.lastAutoLetterDate=today;
        appData._lastAutoLetterDate=today;
        const cnt=Math.floor(Math.random()*(mx-mn+1))+mn;
        for(let i=0;i<cnt;i++){
            const sh=ac.slice().sort(()=>0.5-Math.random());
            const t=sh.slice(0,Math.min(Math.floor(Math.random()*8)+3,ac.length)).join(' ');
            appData.letter.inbox.unshift({
                id:Date.now()+i,
                title:'来自'+(appData.chatSettings.otherNickname||'对方')+'的信',
                content:t,
                sender:'other',
                time:Date.now()-i*3600000,
                favorite:false
            });
        }
        saveData();
        // 在聊天界面提醒对方写了信
        if (typeof addSystemMsg === 'function' && cnt > 0) {
            addSystemMsg((appData.chatSettings.otherNickname || '对方') + '给你写了' + cnt + '封信，快去信封查看吧');
        }
        if(document.getElementById('letterPage').style.display==='flex')renderLetterList();
    }


