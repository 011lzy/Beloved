    // ========== 余额应用 ==========
    function openBalanceApp() {
        document.getElementById('balanceAppPage').style.display = 'flex';
        // 恢复上次选择的联系人（持久化在 balanceData 中）
        if (!_balanceContactId && appData.balanceData && appData.balanceData._balanceContactId) {
            var _saved = appData.balanceData._balanceContactId;
            var _contacts = (appData.contactList && appData.contactList.contacts) || [];
            var _found = false;
            for (var i = 0; i < _contacts.length; i++) {
                if (_contacts[i].id === _saved) { _found = true; break; }
            }
            if (_found) _balanceContactId = _saved;
        }
        // Initialize _balanceContactId to first contact if still empty
        if (!_balanceContactId) {
            var contacts = (appData.contactList && appData.contactList.contacts) || [];
            if (contacts.length > 0) _balanceContactId = contacts[0].id || '';
        }
        /* 持久化当前选择 */
        if (appData.balanceData) {
            appData.balanceData._balanceContactId = _balanceContactId;
            if (typeof saveData === 'function') saveData();
        }
        renderBalanceApp();
    }




