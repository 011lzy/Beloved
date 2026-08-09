    // ========== 信封功能 ==========
    // 安全打开信封设置：即使 openLetterSettings 内部出错，也强制显示弹窗
    function safeOpenLetterSettings() {
        try {
            openLetterSettings();
        } catch (err) {
            console.error('openLetterSettings 出错，使用兜底方案:', err);
            var modal = document.getElementById('letterSettingsModal');
            var overlay = document.getElementById('overlay');
            if (modal) modal.classList.add('show');
            if (overlay) overlay.classList.add('show');
        }
        var modal2 = document.getElementById('letterSettingsModal');
        if (modal2 && !modal2.classList.contains('show')) {
            modal2.classList.add('show');
            var ov = document.getElementById('overlay');
            if (ov) ov.classList.add('show');
        }
    }
    function bindLetterMenuEvents() {
        const letterMenu = document.querySelector('#letterPage .letter-page-menu');
        if (!letterMenu) return;
        letterMenu.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            safeOpenLetterSettings();
            return false;
        };
    }
    function openLetter() {
      try {
        // 关闭所有残留的弹窗和遮罩层，防止overlay覆盖页面导致菜单按钮无法点击
        closeAllModals();
        document.getElementById('letterPage').style.display = 'flex';
        // 修复菜单键无反应：绑定点击事件
        bindLetterMenuEvents();
        applyLetterTheme();
        renderLetterList();
      } catch (e) { console.error('openLetter失败:', e); }
    }
    function closeLetter() {
        document.getElementById('letterPage').style.display = 'none';
    }
    function switchLetterTab(tab) {
      try {
        closeAllModals();
        appData.letter.currentTab = tab;
        saveData();
        document.querySelectorAll('.letter-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        renderLetterList();
      } catch (e) { console.error('switchLetterTab失败:', e); }
    }
    function renderLetterList() {
      try {
        const container = document.getElementById('letterList');
        if (!container) return;
        container.innerHTML = '';
        const tab = appData.letter.currentTab;
        const s = appData.letter.settings;
        // 防御：确保各信箱数组存在
        if (!appData.letter.inbox) appData.letter.inbox = [];
        if (!appData.letter.reply) appData.letter.reply = [];
        if (!appData.letter.sent) appData.letter.sent = [];
        if (!appData.letter.favorite) appData.letter.favorite = [];
        let list;
        if (tab === 'inbox') list = appData.letter.inbox;
        else if (tab === 'reply') list = appData.letter.reply;
        else if (tab === 'sent') list = appData.letter.sent;
        else list = appData.letter.favorite;
        if (!Array.isArray(list)) list = [];

        list.forEach((letter, index) => {
            const item = document.createElement('div');
            item.className = 'letter-item' + (letter.favorite ? ' favorite' : '');
            item.dataset.letterId = letter.id;
            item.style.backgroundColor = s.cardBg || '#ffffff';
            if (s.cardBorderColor) item.style.borderColor = s.cardBorderColor;
            if (s.textColor) item.style.color = s.textColor;
            if (s.fontFamily) item.style.fontFamily = s.fontFamily;
            if (s.fontSize) item.style.fontSize = s.fontSize + 'px';
            item.style.transition = 'transform 0.3s ease';
            const title = document.createElement('div');
            title.className = 'letter-title';
            title.textContent = letter.title;
            const preview = document.createElement('div');
            preview.className = 'letter-preview';
            preview.textContent = (letter.content || '').substring(0, 50);
            const date = document.createElement('div');
            date.className = 'letter-date';
            date.textContent = new Date(letter.time).toLocaleString('zh-CN');
            item.appendChild(title);
            item.appendChild(preview);
            item.appendChild(date);

            // Swipe to delete
            let swipeStartX = 0, swipeStartY = 0, isSwiping = false, isSwipedOpen = false;
            const deleteBtn = document.createElement('div');
            deleteBtn.textContent = '删除';
            deleteBtn.style.cssText = 'position:absolute;right:0;top:0;bottom:0;width:60px;background:#ff4444;color:#fff;display:none;align-items:center;justify-content:center;font-size:14px;cursor:pointer;z-index:1;';
            item.appendChild(deleteBtn);
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (!confirm('确定删除这封信吗？')) return;
                /* Bug14修复：删除前重置滑动状态，避免重新渲染后删除按钮残留或列表跳动 */
                isSwiping = false;
                isSwipedOpen = false;
                item.style.transition = 'none';
                item.style.transform = 'translateX(0)';
                deleteBtn.style.display = 'none';
                /* 规则3：用 ID 定位索引，避免删除后索引错位 */
                var currentIdx = list.findIndex(l => l.id === letter.id);
                if (currentIdx < 0) return;
                var deletedLetter = list[currentIdx];
                list.splice(currentIdx, 1);
                /* Bug4：从收藏列表删除时，同步把原信的 favorite 标记取消 */
                if (tab === 'favorite' && deletedLetter) {
                    deletedLetter.favorite = false;
                    // 按引用 + id 双重同步（导入数据可能是副本，引用不同）
                    ['inbox', 'reply', 'sent'].forEach(function(_tab) {
                        var _list = appData.letter[_tab];
                        if (_list) {
                            _list.forEach(function(l) {
                                if (l === deletedLetter || (l.id && deletedLetter.id && l.id === deletedLetter.id)) {
                                    l.favorite = false;
                                }
                            });
                        }
                    });
                    appData.letter.favorite = appData.letter.favorite.filter(function(l) {
                        return l !== deletedLetter && !(l.id && deletedLetter.id && l.id === deletedLetter.id);
                    });
                }
                saveDataSync();
                /* Bug2：删除后不全量重建列表，仅移除当前 DOM 项，保持滚动位置不跳动 */
                if (item.parentNode) item.remove();
            };

            item.addEventListener('touchstart', (e) => {
                swipeStartX = e.touches[0].clientX;
                swipeStartY = e.touches[0].clientY;
                isSwiping = true;
                item.style.transition = 'none';
            }, {passive: true});
            item.addEventListener('touchmove', (e) => {
                if (!isSwiping) return;
                const dx = e.touches[0].clientX - swipeStartX;
                const dy = e.touches[0].clientY - swipeStartY;
                if (Math.abs(dy) > Math.abs(dx)) { isSwiping = false; return; }
                if (dx < 0) {
                    const offset = Math.max(-60, dx);
                    item.style.transform = 'translateX(' + offset + 'px)';
                    if (offset < -10) {
                        deleteBtn.style.display = 'flex';
                    } else {
                        deleteBtn.style.display = 'none';
                    }
                } else if (isSwipedOpen && dx > 0) {
                    const offset = Math.min(0, -60 + dx);
                    item.style.transform = 'translateX(' + offset + 'px)';
                    if (offset > -30) {
                        deleteBtn.style.display = 'none';
                    }
                }
            }, {passive: true});
            item.addEventListener('touchend', () => {
                isSwiping = false;
                item.style.transition = 'transform 0.3s ease';
                const currentTransform = getComputedStyle(item).transform;
                if (currentTransform && currentTransform !== 'none') {
                  try {
                    const matrix = new DOMMatrix(currentTransform);
                    if (matrix.m41 < -30) {
                        item.style.transform = 'translateX(-60px)';
                        deleteBtn.style.display = 'flex';
                        isSwipedOpen = true;
                    } else {
                        item.style.transform = 'translateX(0)';
                        deleteBtn.style.display = 'none';
                        isSwipedOpen = false;
                    }
                  } catch (mErr) {
                    item.style.transform = 'translateX(0)';
                    deleteBtn.style.display = 'none';
                    isSwipedOpen = false;
                  }
                } else {
                    item.style.transform = 'translateX(0)';
                    deleteBtn.style.display = 'none';
                    isSwipedOpen = false;
                }
            });

            item.addEventListener('click', (e) => {
                if (isSwipedOpen) {
                    item.style.transition = 'transform 0.3s ease';
                    item.style.transform = 'translateX(0)';
                    deleteBtn.style.display = 'none';
                    isSwipedOpen = false;
                    return;
                }
                /* 规则3：用 ID 定位索引，避免删除后索引错位 */
                var currentIdx = list.findIndex(l => l.id === letter.id);
                if (currentIdx >= 0) openLetterDetail(currentIdx);
            });
            container.appendChild(item);
        });

        const cssBox = document.getElementById('letterCssPreview');
        if (cssBox) {
            cssBox.innerHTML = '<div style="font-size:11px;color:#666;line-height:1.6;white-space:pre-wrap;">' +
                '/* 信件卡片样式参考 */\n' +
                '.letter-item {\n' +
                '  background: ' + s.cardBg + ';\n' +
                '  color: ' + s.textColor + ';\n' +
                (s.fontFamily ? '  font-family: ' + s.fontFamily + ';\n' : '') +
                '  font-size: ' + s.fontSize + 'px;\n' +
                '  border: 2px solid ' + (s.cardBorderColor || '#4a6a8a') + ';\n' +
                '  border-radius: 16px;\n' +
                '  padding: 16px 20px;\n' +
                '}\n\n' +
                '/* 可自定义CSS类名 */\n' +
                '.letter-title { color: #2a7ab5; font-weight: 600; }\n' +
                '.letter-preview { color: #5a9ec4; }\n' +
                '.letter-date { color: #7ab5d8; }\n' +
                '.letter-page { background: ' + (s.pageBg || 'linear-gradient(180deg,#85DBF9,#e8f7fe,#85DBF9)') + '; }\n' +
                '.letter-tab { color: #5a9ec4; }\n' +
                '.letter-tab.active { color: #2a7ab5; border-bottom-color: #2a7ab5; }\n' +
                '.letter-detail-modal .modal-content { border: 2px solid ' + (s.cardBorderColor || '#85DBF9') + '; }' +
                '</div>';
        }
        // 应用自定义CSS
        applyLetterCustomCss();
      } catch (e) { console.error('renderLetterList失败:', e); }
    }
    function openLetterDetail(index) {
      try {
        const tab = appData.letter.currentTab;
        let list;
        if (tab === 'inbox') list = appData.letter.inbox;
        else if (tab === 'reply') list = appData.letter.reply;
        else if (tab === 'sent') list = appData.letter.sent;
        else list = appData.letter.favorite;
        if (!Array.isArray(list)) return;
        const letter = list[index];
        if (!letter) return;
        appData.currentViewingLetter = { index: index, tab: tab };
        const senderNick = letter.sender === 'mine' ? appData.chatSettings.myNickname : appData.chatSettings.otherNickname;
        const senderAvatar = letter.sender === 'mine' ? (appData.chatSettings.myAvatar || '') : (appData.chatSettings.otherAvatar || '');
        document.getElementById('letterDetailTitle').textContent = letter.title || '信件详情';
        const detailContent = document.getElementById('letterDetailContent');
        const s = appData.letter.settings;
        if (detailContent) {
            detailContent.innerHTML =
                '<div id="letterDetailText" class="'+(s.rulerEnabled!==false?'letter-detail-ruled':'')+'" style="color:'+(s.textColor||'#1a1a1a')+';'+(s.fontFamily?'font-family:'+s.fontFamily+';':'')+'font-size:'+(s.fontSize||14)+'px;--ruler-gap:'+(s.rulerGap||32)+'px;--ruler-thickness:'+(s.rulerThickness||1)+'px;--ruler-color:'+(s.rulerColor||'rgba(0,0,0,0.15)')+';">'+renderDetailTextHtml(letter.content, s)+'</div>';
        } else {
            document.getElementById('letterDetailText').textContent = letter.content;
        }
        const favBtn = document.getElementById('toggleFavBtn');
        favBtn.textContent = letter.favorite ? '取消收藏' : '收藏';
        document.getElementById('letterDetailModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
        const letterModalContent = document.querySelector('#letterDetailModal .modal-content');
        applyDetailModalStyle(letterModalContent, s);
        if (letterModalContent) {
            if (s.bgImage) { letterModalContent.style.background = 'url('+s.bgImage+') center/cover no-repeat'; }
            else if (!s.modalBg) { letterModalContent.style.background = s.cardBg || 'var(--color-white)'; }
            letterModalContent.style.color = s.textColor || '#1a1a1a';
            if (s.fontFamily) letterModalContent.style.fontFamily = s.fontFamily;
        }
        const nextBtn = document.getElementById('letterNextSentenceBtn');
        if (nextBtn) {
            nextBtn.style.display = (s.sentenceMode && splitSentences(letter.content).length > 1) ? 'inline' : 'none';
        }
      } catch (e) { console.error('openLetterDetail失败:', e); }
    }
    function showNextLetterSentence() {
        const textEl = document.getElementById('letterDetailText');
        if (!textEl) return;
        const spans = textEl.querySelectorAll('.detail-sentence');
        for (let i = 0; i < spans.length; i++) {
            if (spans[i].style.display === 'none') {
                spans[i].style.display = 'inline';
                break;
            }
        }
        let allVisible = true;
        for (let i = 0; i < spans.length; i++) {
            if (spans[i].style.display === 'none') { allVisible = false; break; }
        }
        if (allVisible) {
            const btn = document.getElementById('letterNextSentenceBtn');
            if (btn) btn.style.display = 'none';
        }
    }
    function closeLetterDetail() {
        document.getElementById('letterDetailModal').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }
    function deleteCurrentLetter() {
        const info = appData.currentViewingLetter;
        if (!info) return;
        if (!confirm('确定删除这封信吗？')) return;
        let list;
        if (info.tab === 'inbox') list = appData.letter.inbox;
        else if (info.tab === 'reply') list = appData.letter.reply;
        else if (info.tab === 'sent') list = appData.letter.sent;
        else list = appData.letter.favorite;
        var deletedLetter = list[info.index];
        list.splice(info.index, 1);
        // 如果在收藏列表中删除，同时取消原信件的收藏标记
        if (info.tab === 'favorite' && deletedLetter) {
            deletedLetter.favorite = false;
            // 从所有列表中查找并取消收藏标记
            ['inbox', 'reply', 'sent'].forEach(function(tab) {
                var tabList = appData.letter[tab];
                if (tabList) {
                    tabList.forEach(function(l) {
                        if (l === deletedLetter || (l.id && l.id === deletedLetter.id)) {
                            l.favorite = false;
                        }
                    });
                }
            });
            // 从收藏列表中移除引用
            appData.letter.favorite = appData.letter.favorite.filter(function(l) { return l !== deletedLetter; });
        }
        saveDataSync();
        /* 局部更新：直接移除对应的 .letter-item（规则2），不调用 renderLetterList */
        var _letterId = deletedLetter ? deletedLetter.id : null;
        if (_letterId) {
            var _itemToRemove = document.querySelector('.letter-item[data-letter-id="' + _letterId + '"]');
            if (_itemToRemove) {
                _itemToRemove.remove();
            } else {
                renderLetterList();
            }
        } else {
            renderLetterList();
        }
        closeLetterDetail();
    }
    function toggleFavoriteLetter() {
        const info = appData.currentViewingLetter;
        if (!info) return;
        let list;
        if (info.tab === 'inbox') list = appData.letter.inbox;
        else if (info.tab === 'reply') list = appData.letter.reply;
        else if (info.tab === 'sent') list = appData.letter.sent;
        else list = appData.letter.favorite;
        const letter = list[info.index];
        if (!letter) return;
        letter.favorite = !letter.favorite;
        if (letter.favorite) {
            if (!appData.letter.favorite.find(f => f.id === letter.id)) {
                appData.letter.favorite.push(letter);
            }
        } else {
            appData.letter.favorite = appData.letter.favorite.filter(f => f.id !== letter.id);
        }
        saveDataSync();
        const favBtn = document.getElementById('toggleFavBtn');
        favBtn.textContent = letter.favorite ? '取消收藏' : '收藏';
        /* 局部更新：只切换对应的 .letter-item 的 favorite 类（规则2） */
        var _letterEl = document.querySelector('.letter-item[data-letter-id="' + letter.id + '"]');
        if (_letterEl) {
            _letterEl.classList.toggle('favorite', letter.favorite);
        }
    }
    function openLetterSettings() {
      try {
        const s = appData.letter.settings;
        document.getElementById('letterPageBg').value = s.pageBg || '#85DBF9';
        document.getElementById('letterCardBg').value = s.cardBg || '#ffffff';
        document.getElementById('letterCardBorderColor').value = s.cardBorderColor || '#85DBF9';
        document.getElementById('letterTextColor').value = s.textColor || '#1a1a1a';
        document.getElementById('letterFontSize').value = s.fontSize || 14;
        document.getElementById('letterFontSizeVal').textContent = s.fontSize || 14;
        document.getElementById('letterModalWidth').value = Math.min(s.modalWidth || 86, 95);
        document.getElementById('letterModalWidthVal').textContent = Math.min(s.modalWidth || 86, 95) + '%';
        document.getElementById('letterModalHeight').value = Math.min(s.modalHeight || 70, 90);
        document.getElementById('letterModalHeightVal').textContent = Math.min(s.modalHeight || 70, 90) + 'vh';
        document.getElementById('letterModalBg').value = s.modalBg || s.cardBg || '#ffffff';
        document.getElementById('letterModalBorderColor').value = s.modalBorderColor || '#e0e0e0';
        document.getElementById('letterRulerEnabled').checked = s.rulerEnabled !== false;
        document.getElementById('letterRulerThickness').value = s.rulerThickness || 1;
        document.getElementById('letterRulerThicknessVal').textContent = (s.rulerThickness || 1) + 'px';
        document.getElementById('letterRulerColor').value = rgbToHexForColorInput(s.rulerColor || 'rgba(0,0,0,0.15)');
        document.getElementById('letterSentenceMode').checked = !!s.sentenceMode;
        const letterCssTextarea = document.getElementById('letterCustomCss');
        if (letterCssTextarea) letterCssTextarea.value = s.customCss || '';
        renderCustomFontList('letter');
        document.getElementById('letterSettingsModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
      } catch (e) { console.error('openLetterSettings失败:', e); }
    }
    function closeLetterSettings() {
        document.getElementById('letterSettingsModal').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }
    function openSendLetter() {
        document.getElementById('letterTitle').value = '';
        document.getElementById('letterContent').value = '';
        document.getElementById('sendLetterModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
    }
    function closeSendLetter() {
        document.getElementById('sendLetterModal').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }
    function sendLetter() {
        const title = document.getElementById('letterTitle').value.trim();
        const content = document.getElementById('letterContent').value.trim();
        if (!title || !content) return;
        const letter = {
            id: Date.now(),
            title: title,
            content: content,
            sender: 'mine',
            time: Date.now(),
            favorite: false
        };
        appData.letter.sent.push(letter);
        saveDataSync();
        closeSendLetter();
        // 局部更新：如果信封页面可见且当前在"已发"标签，插入新信件节点（规则5）
        var _letterPage = document.getElementById('letterPage');
        if (_letterPage && _letterPage.style.display === 'flex' && appData.letter.currentTab === 'sent') {
            var _container = document.getElementById('letterList');
            if (_container) {
                var _s = appData.letter.settings;
                var _newItem = document.createElement('div');
                _newItem.className = 'letter-item';
                _newItem.dataset.letterId = letter.id;
                _newItem.style.backgroundColor = _s.cardBg || '#ffffff';
                if (_s.cardBorderColor) _newItem.style.borderColor = _s.cardBorderColor;
                if (_s.textColor) _newItem.style.color = _s.textColor;
                if (_s.fontFamily) _newItem.style.fontFamily = _s.fontFamily;
                if (_s.fontSize) _newItem.style.fontSize = _s.fontSize + 'px';
                _newItem.style.transition = 'transform 0.3s ease';
                _newItem.innerHTML = '<div class="letter-title">' + _escapeHtml(letter.title) + '</div>' +
                    '<div class="letter-preview">' + _escapeHtml((letter.content || '').substring(0, 50)) + '</div>' +
                    '<div class="letter-date">' + new Date(letter.time).toLocaleString('zh-CN') + '</div>';
                _newItem.addEventListener('click', function() {
                    var idx = appData.letter.sent.findIndex(function(l) { return l.id === letter.id; });
                    if (idx >= 0) openLetterDetail(idx);
                });
                _container.appendChild(_newItem);
            }
        }
        // 对方回信模拟
        var replyMin = Math.max(0, appData.chatSettings.letterReplyMin || 0);
        var replyMax = Math.max(replyMin, appData.chatSettings.letterReplyMax || 0);
        const replyDelay = (Math.floor(Math.random() * (replyMax - replyMin + 1)) + replyMin) * 3600000;
        // 持久化回信计划，防止页面刷新后丢失
        if (!appData.letter.pendingReplies) appData.letter.pendingReplies = [];
        var pendingReply = {
            originalTitle: title,
            scheduledAt: Date.now() + replyDelay
        };
        appData.letter.pendingReplies.push(pendingReply);
        saveDataSync();
        scheduleLetterReply(pendingReply);
    }
    function scheduleLetterReply(pending) {
        // 防止重复调度
        if (pending._scheduled) return;
        pending._scheduled = true;
        var delay = Math.max(0, pending.scheduledAt - Date.now());
        setTimeout(() => {
            const allCards = getAllVisibleWordCards();
            if(allCards.length===0){
                // 字卡为空：移除 pending 条目，避免无限重试
                if (appData.letter.pendingReplies) {
                    appData.letter.pendingReplies = appData.letter.pendingReplies.filter(function(p){ return p !== pending; });
                }
                saveDataSync();
                return;
            }
            const replyContent=allCards.sort(()=>0.5-Math.random()).slice(0,Math.min(Math.floor(Math.random()*10)+5,allCards.length)).join(' ');
            appData.letter.reply.unshift({
                id: Date.now(),
                title: '回信：' + pending.originalTitle,
                content: replyContent,
                sender: 'other',
                time: Date.now(),
                favorite: false
            });
            // 对方有概率收藏用户写的信
            var favProb = appData.chatSettings.letterFavProb !== undefined ? appData.chatSettings.letterFavProb : 30;
            if (Math.random() * 100 < favProb) {
                // 标记原信被对方收藏
                for (var i = 0; i < appData.letter.sent.length; i++) {
                    if (appData.letter.sent[i].title === pending.originalTitle && !appData.letter.sent[i].otherFavorited) {
                        appData.letter.sent[i].otherFavorited = true;
                        appData.letter.sent[i].otherFavoritedTime = Date.now();
                        break;
                    }
                }
                // 在聊天界面提醒
                if (typeof addSystemMsg === 'function') {
                    addSystemMsg((appData.chatSettings.otherNickname || '对方') + '收藏了你的信件「' + pending.originalTitle + '」');
                }
            }
            // 从待处理列表中移除
            if (appData.letter.pendingReplies) {
                appData.letter.pendingReplies = appData.letter.pendingReplies.filter(function(p){ return p !== pending; });
            }
            saveDataSync();
            // 在聊天界面提醒对方回了信
            if (typeof addSystemMsg === 'function') {
                addSystemMsg((appData.chatSettings.otherNickname || '对方') + '回了你的信「' + pending.originalTitle + '」，快去信封查看吧');
            }
            /* 局部更新：如果信封页面可见且在"回信"标签，插入新回信节点（规则5） */
            var _letterPage2 = document.getElementById('letterPage');
            if (_letterPage2 && _letterPage2.style.display === 'flex' && appData.letter.currentTab === 'reply') {
                var _container2 = document.getElementById('letterList');
                if (_container2 && appData.letter.reply.length > 0) {
                    var _replyLetter = appData.letter.reply[0];
                    var _s2 = appData.letter.settings;
                    var _newReplyItem = document.createElement('div');
                    _newReplyItem.className = 'letter-item';
                    _newReplyItem.dataset.letterId = _replyLetter.id;
                    _newReplyItem.style.backgroundColor = _s2.cardBg || '#ffffff';
                    if (_s2.cardBorderColor) _newReplyItem.style.borderColor = _s2.cardBorderColor;
                    if (_s2.textColor) _newReplyItem.style.color = _s2.textColor;
                    if (_s2.fontFamily) _newReplyItem.style.fontFamily = _s2.fontFamily;
                    if (_s2.fontSize) _newReplyItem.style.fontSize = _s2.fontSize + 'px';
                    _newReplyItem.style.transition = 'transform 0.3s ease';
                    _newReplyItem.innerHTML = '<div class="letter-title">' + _escapeHtml(_replyLetter.title) + '</div>' +
                        '<div class="letter-preview">' + _escapeHtml((_replyLetter.content || '').substring(0, 50)) + '</div>' +
                        '<div class="letter-date">' + new Date(_replyLetter.time).toLocaleString('zh-CN') + '</div>';
                    _newReplyItem.addEventListener('click', function() {
                        var idx = appData.letter.reply.findIndex(function(l) { return l.id === _replyLetter.id; });
                        if (idx >= 0) openLetterDetail(idx);
                    });
                    if (_container2.firstChild) {
                        _container2.insertBefore(_newReplyItem, _container2.firstChild);
                    } else {
                        _container2.appendChild(_newReplyItem);
                    }
                }
            }
        }, delay);
    }
    // 检查未完成的信封回信（页面刷新后恢复）
    function checkPendingLetterReplies() {
        if (!appData.letter.pendingReplies) return;
        appData.letter.pendingReplies.forEach(function(pending) {
            scheduleLetterReply(pending);
        });
    }


