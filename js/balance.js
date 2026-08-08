/* balance.js - 从 app.js 拆分 */


    function closeBalanceApp() {
        document.getElementById('balanceAppPage').style.display = 'none';
    }
    var _balanceContactId = '';
    var _balanceRendering = false;
    function switchBalanceContact() {
        if (_balanceRendering) return;
        var sel = document.getElementById('balanceContactSelector');
        _balanceContactId = sel ? sel.value : '';
        /* 持久化当前选择的联系人，刷新后可恢复 */
        if (appData.balanceData) appData.balanceData._balanceContactId = _balanceContactId;
        if (typeof saveData === 'function') saveData();
        renderBalanceApp();
    }
    // 余额模型：我方余额全局共享，对方余额按联系人独立
    function getBalanceData() {
        var globalBd = appData.balanceData;
        if (!globalBd) globalBd = appData.balanceData = { mine: 100, other: 100, records: [] };
        if (_balanceContactId) {
            var c = _findContactById(_balanceContactId);
            if (c) {
                // 初始化联系人余额：other 继承全局值（而非固定100），确保历史操作可见
                if (!c.balanceData || typeof c.balanceData.other !== 'number') {
                    var _initOther = (typeof globalBd.other === 'number') ? globalBd.other : 100;
                    c.balanceData = { other: _initOther, records: [] };
                    /* 同步全局历史记录到新联系人 */
                    if (Array.isArray(globalBd.records)) {
                        globalBd.records.forEach(function(r) {
                            c.balanceData.records.push(r);
                        });
                    }
                }
                return {
                    mine: globalBd.mine,
                    other: c.balanceData.other,
                    records: c.balanceData.records || [],
                    _contact: c,
                    _global: globalBd
                };
            }
        }
        return globalBd;
    }
    /* 获取指定联系人的对方余额（不传则使用 _balanceContactId，再退回全局） */
    function getOtherBalance(contactId) {
        var globalBd = appData.balanceData;
        if (!globalBd) return 100;
        var cid = (contactId !== undefined && contactId !== null && contactId !== '') ? contactId : _balanceContactId;
        if (cid) {
            var c = _findContactById(cid);
            if (c) {
                if (!c.balanceData || typeof c.balanceData.other !== 'number') {
                    var _initOther = (typeof globalBd.other === 'number') ? globalBd.other : 100;
                    c.balanceData = { other: _initOther, records: [] };
                    if (Array.isArray(globalBd.records)) {
                        globalBd.records.forEach(function(r) { c.balanceData.records.push(r); });
                    }
                }
                return c.balanceData.other;
            }
        }
        return globalBd.other;
    }
    function renderBalanceApp() {
        _balanceRendering = true;
        try {
        const bd = getBalanceData();
        const container = document.getElementById('balanceAppContent');
        let html = '';
        // Populate header selector — only rebuild if contacts changed
        var sel = document.getElementById('balanceContactSelector');
        if (sel) {
            var contacts = (appData.contactList && appData.contactList.contacts) || [];
            var currentVal = sel.value;
            var needsRebuild = false;
            if (sel.options.length !== contacts.length || sel.options.length === 0) {
                needsRebuild = true;
            } else {
                for (var i = 0; i < contacts.length; i++) {
                    if (sel.options[i] && sel.options[i].value !== (contacts[i].id || '')) {
                        needsRebuild = true; break;
                    }
                }
            }
            if (needsRebuild) {
                var selHtml = '';
                contacts.forEach(function(c) {
                    selHtml += '<option value="' + (c.id || '') + '"' + (_balanceContactId === (c.id||'') ? ' selected' : '') + '>' + escapeHtml(c.name || c.nickname || '联系人') + '</option>';
                });
                if (contacts.length === 0) {
                    selHtml = '<option value="">暂无联系人</option>';
                    sel.disabled = true;
                } else {
                    sel.disabled = false;
                }
                sel.innerHTML = selHtml;
            } else {
                // Just update the selected option without rebuilding
                for (var j = 0; j < sel.options.length; j++) {
                    sel.options[j].selected = (_balanceContactId === sel.options[j].value);
                }
            }
        }
        // Balance box
        /* Bug20修复：parseFloat(bd.other) || 0 对负数无效（-5 是 truthy），改用 isNaN 显式检查 */
        var _otherVal = parseFloat(bd.other);
        if (isNaN(_otherVal)) _otherVal = 0;
        var _mineVal = parseFloat(bd.mine);
        if (isNaN(_mineVal)) _mineVal = 0;
        html += '<div class="bal-box">';
        html += '<div class="bal-side"><div class="lbl">对方余额</div><div class="val">¥' + _otherVal.toFixed(2) + '</div></div>';
        html += '<div class="bal-side"><div class="lbl">我方余额</div><div class="val">¥' + _mineVal.toFixed(2) + '</div></div>';
        html += '</div>';
        // Records container
        html += '<div style="background:#f5f5f5;border-radius:12px;padding:16px;">';
        html += '<div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#333;">记录</div>';
        var records = bd.records || [];
        if (records.length === 0) {
            html += '<div style="color:#999;font-size:13px;text-align:center;padding:20px;">暂无记录</div>';
        }
        records.slice().reverse().forEach(r => {
            html += '<div class="bal-rec">' + r.text + '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
        } finally { _balanceRendering = false; }
    }
    function addBalanceRecord(target, amount, desc, contactId) {
        var globalBd = appData.balanceData;
        if (!globalBd) globalBd = appData.balanceData = { mine: 100, other: 100, records: [] };
        /* 支持显式传入 contactId（转账等场景需要按聊天上下文定位联系人） */
        var _cid = (contactId !== undefined && contactId !== null && contactId !== '') ? contactId : _balanceContactId;
        var c = _cid ? _findContactById(_cid) : null;
        // 初始化联系人余额：other 继承全局值（而非固定100）
        if (c && (!c.balanceData || typeof c.balanceData.other !== 'number')) {
            var _initOther = (typeof globalBd.other === 'number') ? globalBd.other : 100;
            c.balanceData = { other: _initOther, records: [] };
            if (Array.isArray(globalBd.records)) {
                globalBd.records.forEach(function(r) { c.balanceData.records.push(r); });
            }
        }

        if (target === 'mine') {
            globalBd.mine += amount;
        } else if (target === 'other') {
            if (c) c.balanceData.other += amount;
            else globalBd.other += amount;
        } else if (target === 'both') {
            globalBd.mine += amount;
            if (c) c.balanceData.other += amount;
            else globalBd.other += amount;
        }
        const sign = amount >= 0 ? '+' : '';
        const who = target === 'mine' ? '我方' : (target === 'other' ? '对方' : '双方');
        var record = { text: desc + '（' + who + sign + amount + '）', time: Date.now() };
        globalBd.records.push(record);
        if (globalBd.records.length > 100) globalBd.records = globalBd.records.slice(-100);
        if (c) {
            c.balanceData.records.push(record);
            if (c.balanceData.records.length > 100) c.balanceData.records = c.balanceData.records.slice(-100);
        }
        saveData();
        if (document.getElementById('balanceAppPage').style.display === 'flex') renderBalanceApp();
    }
