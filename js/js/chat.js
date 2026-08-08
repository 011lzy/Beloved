/* chat.js - 从 app.js 拆分 */

    function openChat() {
      try {
        refreshCustomIcons();
        openContactList();
      } catch (e) { console.error('openChat失败:', e); }
    }
    function closeChat() {
        _activeContactId = null;
        document.getElementById('chatPage').style.display = 'none';
        // 清理免打扰/拉黑弹窗
        var dndMask = document.getElementById('dnd-card-mask');
        if (dndMask) dndMask.remove();
        var unblockMask = document.getElementById('unblock-popup-mask');
        if (unblockMask) unblockMask.remove();
        // 显示底栏
        var _dockBar = document.querySelector('.dock-bar');
        if (_dockBar) _dockBar.style.display = '';
        // 同时关闭联系人列表
        var clPage = document.getElementById('contactListPage');
        if (clPage) clPage.classList.remove('active');
        if (!isTyping) {
            document.getElementById('chatTitle').textContent = appData.chatSettings.otherNickname;
        }
    }
    function initChatPage() {
        // 进入聊天界面时隐藏底栏
        try {
            var _dockBar = document.querySelector('.dock-bar');
            if (_dockBar) _dockBar.style.display = 'none';
        } catch(e) {}
        const s = appData.chatSettings;
        // 复位键盘自适应状态，清除可能残留的 keyboard-open 类和 --keyboard-height
        if (typeof resetChatKeyboard === 'function') resetChatKeyboard();
        document.getElementById('chatTitle').textContent = isTyping ? '对方正在输入中...' : s.otherNickname;
        document.getElementById('otherNicknameValue').textContent = s.otherNickname;
        document.getElementById('myNicknameValue').textContent = s.myNickname;
        document.getElementById('videoName').textContent = s.otherNickname;
        
        updateAvatarPreview('other', s.otherAvatar);
        updateAvatarPreview('my', s.myAvatar);
        
        document.documentElement.style.setProperty('--avatar-size', s.avatarSize + 'px');
        document.documentElement.style.setProperty('--avatar-radius', s.avatarRadius + 'px');
        document.documentElement.style.setProperty('--other-avatar-size', (s.otherAvatarSize||s.avatarSize) + 'px');
        document.documentElement.style.setProperty('--my-avatar-size', (s.myAvatarSize||s.avatarSize) + 'px');
        document.documentElement.style.setProperty('--other-avatar-radius', (s.otherAvatarRadius||s.avatarRadius) + 'px');
        document.documentElement.style.setProperty('--my-avatar-radius', (s.myAvatarRadius||s.avatarRadius) + 'px');
        document.documentElement.style.setProperty('--bubble-radius', s.bubbleRadius + 'px');
        document.documentElement.style.setProperty('--bubble-font-size', s.bubbleFontSize + 'px');
        document.documentElement.style.setProperty('--bubble-padding', (s.bubblePadding || 8) + 'px');
        document.documentElement.style.setProperty('--other-bubble-font-size', (s.otherBubbleFontSize||s.bubbleFontSize) + 'px');
        document.documentElement.style.setProperty('--my-bubble-font-size', (s.myBubbleFontSize||s.bubbleFontSize) + 'px');
        document.documentElement.style.setProperty('--other-bubble-padding', (s.otherBubblePadding||s.bubblePadding||8) + 'px');
        document.documentElement.style.setProperty('--my-bubble-padding', (s.myBubblePadding||s.bubblePadding||8) + 'px');
        document.documentElement.style.setProperty('--my-bubble-bg', s.myBubbleBg);
        document.documentElement.style.setProperty('--my-bubble-text', s.myBubbleText);
        document.documentElement.style.setProperty('--my-bubble-border', s.myBubbleBorder);
        document.documentElement.style.setProperty('--other-bubble-bg', s.otherBubbleBg);
        document.documentElement.style.setProperty('--other-bubble-text', s.otherBubbleText);
        document.documentElement.style.setProperty('--other-bubble-border', s.otherBubbleBorder);
        applyBubbleRadiusVars(s);
        applyTransferStyleVars(s);
        applyBubbleFont();
        
        if (s.chatWallpaper) {
            document.querySelector('.chat-messages').style.backgroundImage = `url(${s.chatWallpaper})`;
            // 同时将壁纸应用到 chat-page，使顶底栏圆角空余处能透出壁纸
            const chatPage = document.getElementById('chatPage');
            if (chatPage) { chatPage.style.backgroundImage = `url(${s.chatWallpaper})`; chatPage.style.backgroundSize = 'cover'; chatPage.style.backgroundPosition = 'center'; }
        } else {
            document.querySelector('.chat-messages').style.backgroundImage = '';
            const chatPage = document.getElementById('chatPage');
            if (chatPage) { chatPage.style.backgroundImage = ''; }
        }
        
        document.querySelector('.chat-header').style.backgroundColor = s.topBgColor;
        if(s.topBgImage){document.querySelector('.chat-header').style.backgroundImage='url('+s.topBgImage+')';document.querySelector('.chat-header').style.backgroundSize='cover';}else{document.querySelector('.chat-header').style.backgroundImage='';}
        document.querySelector('.chat-header').style.borderRadius = '0 0 ' + (s.topBgRadius || 0) + 'px ' + (s.topBgRadius || 0) + 'px';
        document.querySelector('.chat-footer').style.backgroundColor = s.bottomBgColor;
        if(s.bottomBgImage){document.querySelector('.chat-footer').style.backgroundImage='url('+s.bottomBgImage+')';document.querySelector('.chat-footer').style.backgroundSize='cover';}else{document.querySelector('.chat-footer').style.backgroundImage='';}
        document.querySelector('.chat-footer').style.borderRadius = (s.bottomBgRadius || 0) + 'px ' + (s.bottomBgRadius || 0) + 'px 0 0';
        document.querySelector('.emoji-panel').style.backgroundColor = s.bottomBgColor;
        document.querySelector('.plus-panel').style.backgroundColor = s.bottomBgColor;
        
        // 恢复内边距设置
        const chatHeader = document.querySelector('.chat-header');
        const chatFooter = document.querySelector('.chat-footer');
        if (s.topBgPadding) {
            chatHeader.style.paddingTop = 'calc(env(safe-area-inset-top, 0px) + ' + s.topBgPadding + 'vh)';
            chatHeader.style.paddingBottom = s.topBgPadding + 'vh';
        } else {
            chatHeader.style.paddingTop = '';
            chatHeader.style.paddingBottom = '';
        }
        if (s.bottomBgPadding) {
            chatFooter.style.paddingTop = '';
        } else {
            chatFooter.style.paddingTop = '';
        }
        if (s.footerPosOffset) {
            chatFooter.style.marginTop = '';
        } else {
            chatFooter.style.marginTop = '';
        }
        
        document.getElementById('otherAvatarSizeSlider').value = s.otherAvatarSize || s.avatarSize;
        document.getElementById('otherAvatarSizeVal').textContent = s.otherAvatarSize || s.avatarSize;
        document.getElementById('myAvatarSizeSlider').value = s.myAvatarSize || s.avatarSize;
        document.getElementById('myAvatarSizeVal').textContent = s.myAvatarSize || s.avatarSize;
        document.getElementById('otherAvatarRadiusSlider').value = s.otherAvatarRadius || s.avatarRadius;
        document.getElementById('otherAvatarRadiusVal').textContent = s.otherAvatarRadius || s.avatarRadius;
        document.getElementById('myAvatarRadiusSlider').value = s.myAvatarRadius || s.avatarRadius;
        document.getElementById('myAvatarRadiusVal').textContent = s.myAvatarRadius || s.avatarRadius;
        document.getElementById('myBubbleBg').value = s.myBubbleBg;
        document.getElementById('otherBubbleBg').value = s.otherBubbleBg;
        document.getElementById('myBubbleBorder').value = s.myBubbleBorder;
        document.getElementById('otherBubbleBorder').value = s.otherBubbleBorder;
        document.getElementById('myBubbleText').value = s.myBubbleText;
        document.getElementById('otherBubbleText').value = s.otherBubbleText;
        document.getElementById('bubbleRadius').value = s.bubbleRadius;
        document.getElementById('otherBubbleFontSize').value = s.otherBubbleFontSize || s.bubbleFontSize;
        document.getElementById('myBubbleFontSize').value = s.myBubbleFontSize || s.bubbleFontSize;
        document.getElementById('otherBubblePadding').value = s.otherBubblePadding || s.bubblePadding || 8;
        document.getElementById('myBubblePadding').value = s.myBubblePadding || s.bubblePadding || 8;
        document.getElementById('bubbleTail').checked = s.bubbleTail;
        // 小尾巴细分开关
        document.getElementById('otherTailEnabled').checked = s.otherTailEnabled !== false;
        document.getElementById('myTailEnabled').checked = s.myTailEnabled !== false;
        document.getElementById('otherFirstTailOnly').checked = s.otherFirstTailOnly || false;
        document.getElementById('myFirstTailOnly').checked = s.myFirstTailOnly || false;
        // 圆角进阶
        document.getElementById('dualBubbleRadiusEnabled').checked = s.dualBubbleRadiusEnabled;
        document.getElementById('otherBubbleRadius').value = s.otherBubbleRadius >= 0 ? s.otherBubbleRadius : s.bubbleRadius;
        document.getElementById('myBubbleRadius').value = s.myBubbleRadius >= 0 ? s.myBubbleRadius : s.bubbleRadius;
        const _dbr = document.getElementById('dualBubbleRadiusGrid'); if (_dbr) _dbr.style.display = s.dualBubbleRadiusEnabled ? 'grid' : 'none';
        // 对方四角
        document.getElementById('otherCornersEnabled').checked = s.otherCornersEnabled;
        document.getElementById('otherTL').value = s.otherTL;
        document.getElementById('otherTR').value = s.otherTR;
        document.getElementById('otherBR').value = s.otherBR;
        document.getElementById('otherBL').value = s.otherBL;
        const _ocg = document.getElementById('otherCornersGrid'); if (_ocg) _ocg.style.display = s.otherCornersEnabled ? 'grid' : 'none';
        // 我方四角
        document.getElementById('myCornersEnabled').checked = s.myCornersEnabled;
        document.getElementById('myTL').value = s.myTL;
        document.getElementById('myTR').value = s.myTR;
        document.getElementById('myBR').value = s.myBR;
        document.getElementById('myBL').value = s.myBL;
        const _mcg = document.getElementById('myCornersGrid'); if (_mcg) _mcg.style.display = s.myCornersEnabled ? 'grid' : 'none';
        // 昵称
        document.getElementById('showNicknames').checked = s.showNicknames;
        document.getElementById('otherNicknameSize').value = s.otherNicknameSize;
        document.getElementById('myNicknameSize').value = s.myNicknameSize;
        document.getElementById('otherNicknameColor').value = s.otherNicknameColor;
        document.getElementById('myNicknameColor').value = s.myNicknameColor;
        // 已读与双对号
        document.getElementById('showRead').checked = s.showRead;
        document.getElementById('showDoubleCheck').checked = s.showDoubleCheck;
        document.getElementById('readPosition').value = s.readPosition;
        document.getElementById('onlyLastRead').checked = s.onlyLastRead;
        document.getElementById('onlyFirstRead').checked = s.onlyFirstRead;
        document.getElementById('readColor').value = s.readColor;
        // 分条圆角
        document.getElementById('msgRadiusEnabled').checked = s.msgRadiusEnabled;
        const _mrg = document.getElementById('msgRadiusGrid'); if (_mrg) _mrg.style.display = s.msgRadiusEnabled ? 'grid' : 'none';
        document.getElementById('otherMsg1Radius').value = s.otherMsg1Radius >= 0 ? s.otherMsg1Radius : s.bubbleRadius;
        document.getElementById('otherMsg2Radius').value = s.otherMsg2Radius >= 0 ? s.otherMsg2Radius : s.bubbleRadius;
        document.getElementById('otherMsg3Radius').value = s.otherMsg3Radius >= 0 ? s.otherMsg3Radius : s.bubbleRadius;
        document.getElementById('myMsg1Radius').value = s.myMsg1Radius >= 0 ? s.myMsg1Radius : s.bubbleRadius;
        document.getElementById('myMsg2Radius').value = s.myMsg2Radius >= 0 ? s.myMsg2Radius : s.bubbleRadius;
        document.getElementById('myMsg3Radius').value = s.myMsg3Radius >= 0 ? s.myMsg3Radius : s.bubbleRadius;
        // 分条四角圆方（新增）
        document.getElementById('msgCornersEnabled').checked = s.msgCornersEnabled || false;
        const _mcgInit = document.getElementById('msgCornersGrid'); if (_mcgInit) _mcgInit.style.display = (s.msgCornersEnabled || false) ? 'block' : 'none';
        document.getElementById('otherMsg1TL').value = s.otherMsg1TL !== undefined ? s.otherMsg1TL : 8;
        document.getElementById('otherMsg1TR').value = s.otherMsg1TR !== undefined ? s.otherMsg1TR : 8;
        document.getElementById('otherMsg1BR').value = s.otherMsg1BR !== undefined ? s.otherMsg1BR : 8;
        document.getElementById('otherMsg1BL').value = s.otherMsg1BL !== undefined ? s.otherMsg1BL : 8;
        document.getElementById('otherMsg2TL').value = s.otherMsg2TL !== undefined ? s.otherMsg2TL : 8;
        document.getElementById('otherMsg2TR').value = s.otherMsg2TR !== undefined ? s.otherMsg2TR : 8;
        document.getElementById('otherMsg2BR').value = s.otherMsg2BR !== undefined ? s.otherMsg2BR : 8;
        document.getElementById('otherMsg2BL').value = s.otherMsg2BL !== undefined ? s.otherMsg2BL : 8;
        document.getElementById('otherMsg3TL').value = s.otherMsg3TL !== undefined ? s.otherMsg3TL : 8;
        document.getElementById('otherMsg3TR').value = s.otherMsg3TR !== undefined ? s.otherMsg3TR : 8;
        document.getElementById('otherMsg3BR').value = s.otherMsg3BR !== undefined ? s.otherMsg3BR : 8;
        document.getElementById('otherMsg3BL').value = s.otherMsg3BL !== undefined ? s.otherMsg3BL : 8;
        document.getElementById('myMsg1TL').value = s.myMsg1TL !== undefined ? s.myMsg1TL : 8;
        document.getElementById('myMsg1TR').value = s.myMsg1TR !== undefined ? s.myMsg1TR : 8;
        document.getElementById('myMsg1BR').value = s.myMsg1BR !== undefined ? s.myMsg1BR : 8;
        document.getElementById('myMsg1BL').value = s.myMsg1BL !== undefined ? s.myMsg1BL : 8;
        document.getElementById('myMsg2TL').value = s.myMsg2TL !== undefined ? s.myMsg2TL : 8;
        document.getElementById('myMsg2TR').value = s.myMsg2TR !== undefined ? s.myMsg2TR : 8;
        document.getElementById('myMsg2BR').value = s.myMsg2BR !== undefined ? s.myMsg2BR : 8;
        document.getElementById('myMsg2BL').value = s.myMsg2BL !== undefined ? s.myMsg2BL : 8;
        document.getElementById('myMsg3TL').value = s.myMsg3TL !== undefined ? s.myMsg3TL : 8;
        document.getElementById('myMsg3TR').value = s.myMsg3TR !== undefined ? s.myMsg3TR : 8;
        document.getElementById('myMsg3BR').value = s.myMsg3BR !== undefined ? s.myMsg3BR : 8;
        document.getElementById('myMsg3BL').value = s.myMsg3BL !== undefined ? s.myMsg3BL : 8;
        // 分条气泡颜色（新增）
        document.getElementById('msgColorEnabled').checked = s.msgColorEnabled || false;
        const _mclrInit = document.getElementById('msgColorGrid'); if (_mclrInit) _mclrInit.style.display = (s.msgColorEnabled || false) ? 'grid' : 'none';
        document.getElementById('otherMsg1Bg').value = s.otherMsg1Bg || '#4a4a4a';
        document.getElementById('otherMsg2Bg').value = s.otherMsg2Bg || '#4a4a4a';
        document.getElementById('otherMsg3Bg').value = s.otherMsg3Bg || '#4a4a4a';
        document.getElementById('myMsg1Bg').value = s.myMsg1Bg || '#1a1a1a';
        document.getElementById('myMsg2Bg').value = s.myMsg2Bg || '#1a1a1a';
        document.getElementById('myMsg3Bg').value = s.myMsg3Bg || '#1a1a1a';
        // 分条气泡边框色（新增）
        document.getElementById('msgBorderEnabled').checked = s.msgBorderEnabled || false;
        var _mbgInit = document.getElementById('msgBorderGrid'); if (_mbgInit) _mbgInit.style.display = (s.msgBorderEnabled || false) ? 'grid' : 'none';
        document.getElementById('otherMsg1Border').value = s.otherMsg1Border || '#4a4a4a';
        document.getElementById('otherMsg2Border').value = s.otherMsg2Border || '#4a4a4a';
        document.getElementById('otherMsg3Border').value = s.otherMsg3Border || '#4a4a4a';
        document.getElementById('myMsg1Border').value = s.myMsg1Border || '#1a1a1a';
        document.getElementById('myMsg2Border').value = s.myMsg2Border || '#1a1a1a';
        document.getElementById('myMsg3Border').value = s.myMsg3Border || '#1a1a1a';
        // 分条气泡大小（新增）
        document.getElementById('msgSizeEnabled').checked = s.msgSizeEnabled || false;
        var _msgInit = document.getElementById('msgSizeGrid'); if (_msgInit) _msgInit.style.display = (s.msgSizeEnabled || false) ? 'grid' : 'none';
        document.getElementById('otherMsg1Size').value = s.otherMsg1Size !== undefined ? s.otherMsg1Size : 8;
        document.getElementById('otherMsg2Size').value = s.otherMsg2Size !== undefined ? s.otherMsg2Size : 8;
        document.getElementById('otherMsg3Size').value = s.otherMsg3Size !== undefined ? s.otherMsg3Size : 8;
        document.getElementById('myMsg1Size').value = s.myMsg1Size !== undefined ? s.myMsg1Size : 8;
        document.getElementById('myMsg2Size').value = s.myMsg2Size !== undefined ? s.myMsg2Size : 8;
        document.getElementById('myMsg3Size').value = s.myMsg3Size !== undefined ? s.myMsg3Size : 8;
        // 分条气泡字体大小（新增）
        document.getElementById('msgFontEnabled').checked = s.msgFontEnabled || false;
        var _mfgInit = document.getElementById('msgFontGrid'); if (_mfgInit) _mfgInit.style.display = (s.msgFontEnabled || false) ? 'grid' : 'none';
        document.getElementById('otherMsg1Font').value = s.otherMsg1Font !== undefined ? s.otherMsg1Font : 14;
        document.getElementById('otherMsg2Font').value = s.otherMsg2Font !== undefined ? s.otherMsg2Font : 14;
        document.getElementById('otherMsg3Font').value = s.otherMsg3Font !== undefined ? s.otherMsg3Font : 14;
        document.getElementById('myMsg1Font').value = s.myMsg1Font !== undefined ? s.myMsg1Font : 14;
        document.getElementById('myMsg2Font').value = s.myMsg2Font !== undefined ? s.myMsg2Font : 14;
        document.getElementById('myMsg3Font').value = s.myMsg3Font !== undefined ? s.myMsg3Font : 14;
        // 转账样式
        document.getElementById('transferBgColor').value = s.transferBgColor || '#E8913A';
        document.getElementById('transferTextColor').value = s.transferTextColor || '#ffffff';
        document.getElementById('transferRemarkColor').value = s.transferRemarkColor || '#ffffff';
        document.getElementById('transferBgClaimed').value = s.transferBgClaimed || '#999999';
        document.getElementById('transferTextClaimed').value = s.transferTextClaimed || '#ffffff';
        document.getElementById('transferRemarkClaimed').value = s.transferRemarkClaimed || '#ffffff';
        document.getElementById('transferRadius').value = s.transferRadius !== undefined ? s.transferRadius : 8;
        const _trVal = document.getElementById('transferRadiusVal'); if (_trVal) _trVal.textContent = s.transferRadius !== undefined ? s.transferRadius : 8;
        const _oVal = document.getElementById('otherBubbleRadiusVal'); if (_oVal) _oVal.textContent = (s.otherBubbleRadius >= 0 ? s.otherBubbleRadius : s.bubbleRadius) + ' px';
        const _mVal = document.getElementById('myBubbleRadiusVal'); if (_mVal) _mVal.textContent = (s.myBubbleRadius >= 0 ? s.myBubbleRadius : s.bubbleRadius) + ' px';
        document.getElementById('otherAvatarPosition').value = s.otherAvatarPosition || s.avatarPosition || 'middle';
        document.getElementById('myAvatarPosition').value = s.myAvatarPosition || s.avatarPosition || 'middle';
        document.getElementById('hideAvatar').checked = s.hideAvatar;
        document.getElementById('hideMyAvatar').checked = s.hideMyAvatar || false;
        document.getElementById('hideOtherAvatar').checked = s.hideOtherAvatar || false;
        document.getElementById('onlyFirstAvatar').checked = s.onlyFirstAvatar;
        document.getElementById('onlyLastAvatar').checked = s.onlyLastAvatar;
        // 恢复新增的分方头像显示开关
        document.getElementById('onlyOtherFirstAvatar').checked = s.onlyOtherFirstAvatar || false;
        document.getElementById('onlyMyFirstAvatar').checked = s.onlyMyFirstAvatar || false;
        document.getElementById('onlyOtherLastAvatar').checked = s.onlyOtherLastAvatar || false;
        document.getElementById('onlyMyLastAvatar').checked = s.onlyMyLastAvatar || false;
        document.getElementById('topBgColor').value = s.topBgColor;
        document.getElementById('bottomBgColor').value = s.bottomBgColor;
        document.getElementById('replyTimeMin').value = s.replyTimeMin;
        document.getElementById('replyTimeMax').value = s.replyTimeMax;
        document.getElementById('replyCountMin').value = s.replyCountMin;
        document.getElementById('replyCountMax').value = s.replyCountMax;
        document.getElementById('enableSplice').checked = s.enableSplice;
        document.getElementById('nudgeProb').value = s.nudgeProb;
        document.getElementById('emojiProb').value = s.emojiProb;
        document.getElementById('callAnswerProb').value = s.callAnswerProb || 80;
        document.getElementById('callInitProb').value = s.callInitProb || 5;
        if (document.getElementById('transferProb')) document.getElementById('transferProb').value = s.transferProb !== undefined ? s.transferProb : 5;
        if (document.getElementById('allowZeroTransfer')) document.getElementById('allowZeroTransfer').checked = s.allowZeroTransfer || false;
        document.getElementById('momentCount').value = s.momentCount;
        document.getElementById('momentSplice').checked = s.momentSplice;
        if (document.getElementById('momentCommentProb')) document.getElementById('momentCommentProb').value = s.momentCommentProb !== undefined ? s.momentCommentProb : 80;
        if (document.getElementById('momentLikeProb')) document.getElementById('momentLikeProb').value = s.momentLikeProb !== undefined ? s.momentLikeProb : 80;
        if (document.getElementById('momentReplyDelayMin')) document.getElementById('momentReplyDelayMin').value = s.momentReplyDelayMin !== undefined ? s.momentReplyDelayMin : 10;
        document.getElementById('diaryReplyTime').value = s.diaryReplyTime;
        document.getElementById('letterReplyMin').value = s.letterReplyMin;
        document.getElementById('letterReplyMax').value = s.letterReplyMax;
        document.getElementById('letterCountMin').value = s.letterCountMin;
        document.getElementById('letterCountMax').value = s.letterCountMax;
        if (document.getElementById('letterFavProb')) document.getElementById('letterFavProb').value = s.letterFavProb !== undefined ? s.letterFavProb : 30;
        // 对方主动发消息
        document.getElementById('proactiveEnable').checked = s.proactiveEnable || false;
        document.getElementById('proactiveMinSec').value = s.proactiveMinSec || 30;
        document.getElementById('proactiveMaxMin').value = s.proactiveMaxMin || 5;
        // 已读不回
        document.getElementById('readNoReplyProb').value = s.readNoReplyProb || 0;
        document.getElementById('readNoReplyProbVal').textContent = s.readNoReplyProb || 0;
        
        renderEmojis();
        renderFrames();
        // 加载设置后更新气泡设置预览
        updateBubbleSettingsPreview();
    }
    function renderFrames() { ['other','my'].forEach(type=>{const grid=document.getElementById(type==='other'?'otherFrameGrid':'myFrameGrid');const frames=type==='other'?appData.chatSettings.otherFrames:appData.chatSettings.myFrames;const current=type==='other'?appData.chatSettings.otherFrame:appData.chatSettings.myFrame;const items=grid.querySelectorAll('.frame-item');items.forEach(el=>{if(el.dataset.frame&&el.dataset.frame!=='none')el.remove();});for(const[id,fd]of Object.entries(frames)){const src=typeof fd==='object'?fd.src:fd;const item=document.createElement('div');item.className='frame-item'+(current===id?' active':'');item.dataset.frame=id;item.style.backgroundImage='url('+src+')';item.style.backgroundSize='cover';item.style.position='relative';const db=document.createElement('div');db.style.cssText='position:absolute;top:-4px;right:-4px;width:16px;height:16px;background:red;color:#fff;border-radius:50%;font-size:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:1;';db.textContent='×';db.onclick=(e)=>{e.stopPropagation();deleteFrame(type,id);};item.appendChild(db);item.onclick=()=>selectFrame(type,id);grid.insertBefore(item,grid.querySelector('.frame-add'));}}); }
    function updateAvatarPreview(type, src) {
        const el = document.getElementById(type === 'other' ? 'otherAvatarPreview' : 'myAvatarPreview');
        const videoEl = document.getElementById('videoAvatar');
        el.innerHTML = '';
        if (src) {
            const img = document.createElement('img');
            img.src = src;
            el.appendChild(img);
            if (type === 'other') {
                videoEl.innerHTML = `<img src="${src}" alt="">`;
            }
        }
    }
    function renderMessages(onlyNew) {
      try {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        const history = appData.chatHistory;
        // Bug17修复：聊天界面可见时实时标记已读时间戳，避免返回前台时重复提醒已看过的消息
        if (document.getElementById('chatPage').style.display === 'flex' && history.length > 0) {
            try { _lastSeenMsgTime = history[history.length - 1].id || Date.now(); } catch(_e17) {}
        }
        const s = appData.chatSettings;
        const BATCH_SIZE = 100;
        const GAP_MS = 5 * 60 * 1000; // 5分钟

        // 修复：开启"仅显示最后/第一条消息头像"时，新增消息需要全量重渲染
        if (onlyNew && (s.onlyLastAvatar || s.onlyFirstAvatar || s.onlyOtherFirstAvatar || s.onlyMyFirstAvatar || s.onlyOtherLastAvatar || s.onlyMyLastAvatar)) {
            onlyNew = false;
        }

        // 预计算对方/我方在整条历史中的第一条与最后一条消息索引（用于分方头像显示控制）
        let _otherFirstIdx = -1, _otherLastIdx = -1, _myFirstIdx = -1, _myLastIdx = -1;
        for (let i = 0; i < history.length; i++) {
            const sd = history[i].sender;
            if (sd === 'other') {
                if (_otherFirstIdx === -1) _otherFirstIdx = i;
                _otherLastIdx = i;
            } else if (sd === 'mine') {
                if (_myFirstIdx === -1) _myFirstIdx = i;
                _myLastIdx = i;
            }
        }

        const expandedBatches = container._expandedBatches || 0;
        // 仅在没有展开旧批次且总消息数不超过批次大小时才做纯增量渲染，
        // 否则全量渲染以保证100条折叠逻辑正确
        if (onlyNew && container.children.length > 0 && container._renderedCount && expandedBatches === 0 && history.length <= BATCH_SIZE) {
            const startIdx = Math.min(container._renderedCount, history.length);
            const prevMsg = startIdx > 0 ? history[startIdx - 1] : null;
            let lastSender = prevMsg ? prevMsg.sender : null;
            let otherMsgCount = 0, myMsgCount = 0;
            for (let i = 0; i < startIdx; i++) {
                if (history[i].sender === 'other') otherMsgCount++;
                else if (history[i].sender === 'mine') myMsgCount++;
            }
            let prevTime = prevMsg ? prevMsg.time : 0;
            for (let i = startIdx; i < history.length; i++) {
                const msg = history[i];
                if (prevTime && msg.time - prevTime > GAP_MS) {
                    container.appendChild(buildTimeSeparator(msg.time));
                }
                prevTime = msg.time;
                const isFirst = msg.sender !== lastSender;
                lastSender = msg.sender;
                if (msg.sender === 'other') otherMsgCount++;
                else if (msg.sender === 'mine') myMsgCount++;
                const isLast = i === history.length - 1 || (history[i + 1] && history[i + 1].sender !== msg.sender);
                container.appendChild(buildMessageRow(msg, i, isFirst, isLast, otherMsgCount, myMsgCount, s, _otherFirstIdx, _otherLastIdx, _myFirstIdx, _myLastIdx));
            }
            container._renderedCount = history.length;
            return;
        }

        // 全量渲染：按批次折叠，默认只显示最新一批
        container.innerHTML = '';
        const visibleCount = BATCH_SIZE * (1 + expandedBatches);
        const startIdx = Math.max(0, history.length - visibleCount);
        container._renderedCount = history.length;

        let lastSender = null;
        let otherMsgCount = 0, myMsgCount = 0;
        let prevTime = 0;

        // 先跳过未渲染的消息，计数保持
        for (let i = 0; i < startIdx; i++) {
            if (history[i].sender === 'other') otherMsgCount++;
            else if (history[i].sender === 'mine') myMsgCount++;
        }

        // 使用 DocumentFragment 批量插入，减少重排
        const fragment = document.createDocumentFragment();

        // 如果还有更早的消息，显示"查看更多"按钮
        if (startIdx > 0) {
            const remaining = startIdx;
            const loadMore = document.createElement('div');
            loadMore.className = 'load-more-row';
            loadMore.innerHTML = `<span class="load-more-btn" onclick="expandChatHistory()">查看剩余聊天记录 (${remaining}条)</span>`;
            fragment.appendChild(loadMore);
        }

        for (let i = startIdx; i < history.length; i++) {
            const msg = history[i];
            if (prevTime && msg.time - prevTime > GAP_MS) {
                fragment.appendChild(buildTimeSeparator(msg.time));
            }
            prevTime = msg.time;
            const isFirst = msg.sender !== lastSender;
            const isLast = i === history.length - 1 || (history[i + 1] && history[i + 1].sender !== msg.sender);
            lastSender = msg.sender;
            if (msg.sender === 'other') otherMsgCount++;
            else if (msg.sender === 'mine') myMsgCount++;

            fragment.appendChild(buildMessageRow(msg, i, isFirst, isLast, otherMsgCount, myMsgCount, s, _otherFirstIdx, _otherLastIdx, _myFirstIdx, _myLastIdx));
        }
        container.appendChild(fragment);
      } catch (e) { console.error('renderMessages失败:', e); }
    }

    function buildTimeSeparator(timestamp) {
        const row = document.createElement('div');
        row.className = 'time-separator';
        const date = new Date(timestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const month = date.getMonth() + 1;
        const day = date.getDate();
        row.innerHTML = `<span>${month}月${day}日 ${hours}:${minutes}</span>`;
        return row;
    }

    function expandChatHistory() {
        const container = document.getElementById('chatMessages');
        container._expandedBatches = (container._expandedBatches || 0) + 1;
        renderMessages(false);
    }
    
    function buildMessageRow(msg, index, isFirst, isLast, otherMsgCount, myMsgCount, s, otherFirstIdx, otherLastIdx, myFirstIdx, myLastIdx) {
        if (msg.type === 'system') {
            /* 一起听歌邀请卡片 */
            if (msg.subtype === 'lt-invite' && msg.ltInvite) {
                const inv = msg.ltInvite;
                const coverHtml = inv.cover ? '<img src="' + inv.cover.replace(/"/g, '') + '">' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
                const rejectTexts = ['系统抽疯！再邀请对方一次试试。','嗯？不管了，面子大过天，再邀请一次。','？我不中了，去买彩票吧。'];
                const rejectIdx = (typeof inv.rejectCount === 'number') ? Math.min(inv.rejectCount - 1, 2) : -1;
                const isExpired = inv.status === 'expired';
                const showBtns = inv.status === 'pending' && !isExpired;
                const row = document.createElement('div');
                row.className = 'system-msg lt-invite-chat-card' + (isExpired ? ' expired' : '');
                row.dataset.id = msg.id;
                /* countdown top-right */
                var countdownHtml = '';
                if (inv.status === 'pending' && inv.sentAt) {
                    var elapsed = Math.floor((Date.now() - inv.sentAt) / 1000);
                    var remain = Math.max(0, 30 - elapsed);
                    countdownHtml = '<div class="lt-icc-countdown" data-sent-at="' + inv.sentAt + '">剩余 ' + remain + 's</div>';
                }
                /* status text below buttons */
                var statusHtml = '';
                if (inv.status === 'accepted') {
                    statusHtml = '<div class="lt-icc-status-text">已接受邀请，开始一起听歌</div>';
                } else if (inv.status === 'rejected') {
                    statusHtml = '<div class="lt-icc-status-text">已拒绝邀请</div>';
                    if (rejectIdx >= 0) statusHtml += '<div class="lt-icc-status-text">' + escapeHtml(rejectTexts[rejectIdx]) + '</div>';
                } else if (isExpired) {
                    statusHtml = '<div class="lt-icc-status-text">邀请已超时</div>';
                }
                /* buttons: always show, disabled when not pending */
                var btnsHtml = '<div class="lt-icc-btns">' +
                    '<button class="lt-icc-btn accept" data-act="accept"' + (showBtns ? '' : ' disabled') + '>接受邀请</button>' +
                    '<button class="lt-icc-btn reject" data-act="reject"' + (showBtns ? '' : ' disabled') + '>拒绝邀请</button>' +
                    '</div>';
                row.innerHTML = countdownHtml +
                    '<div class="lt-icc-invite-text">邀请你一起听歌</div>' +
                    '<div class="lt-icc-name">' + escapeHtml(inv.name) + '</div>' +
                    (inv.artist ? '<div class="lt-icc-artist">' + escapeHtml(inv.artist) + '</div>' : '') +
                    '<div class="lt-icc-cover-wrap"><div class="lt-icc-cover">' + coverHtml + '</div></div>' +
                    btnsHtml +
                    statusHtml;
                /* countdown timer */
                if (showBtns && inv.sentAt) {
                    var cdEl = row.querySelector('.lt-icc-countdown');
                    if (cdEl) {
                        var cdTimer = setInterval(function(){
                            var el2 = Math.floor((Date.now() - inv.sentAt) / 1000);
                            var rem = Math.max(0, 30 - el2);
                            if (cdEl && cdEl.isConnected) {
                                cdEl.textContent = '剩余 ' + rem + 's';
                                if (rem <= 0) {
                                    clearInterval(cdTimer);
                                    inv.status = 'expired';
                                    try { if (typeof saveData === 'function') saveData(); } catch(e){}
                                    if (typeof renderMessages === 'function') renderMessages(false);
                                }
                            } else { clearInterval(cdTimer); }
                        }, 1000);
                    }
                }
                row.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    showMsgOpsMenu(e, msg.id, row, e.clientX, e.clientY);
                });
                if (showBtns) {
                    row.querySelector('[data-act="accept"]').addEventListener('click', function(e){
                        e.stopPropagation();
                        if (window.LTBridge && window.LTBridge.acceptInviteFromChat) {
                            window.LTBridge.acceptInviteFromChat(inv, msg.id);
                        }
                    });
                    row.querySelector('[data-act="reject"]').addEventListener('click', function(e){
                        e.stopPropagation();
                        if (window.LTBridge && window.LTBridge.rejectInviteFromChat) {
                            window.LTBridge.rejectInviteFromChat(inv, msg.id);
                        }
                    });
                } else if (inv.status === 'accepted') {
                    row.addEventListener('click', function(){
                        if (window.openLTApp) window.openLTApp();
                    });
                }
                row.addEventListener('touchstart', (e) => {
                    const rowEl = e.currentTarget;
                    const touch = e.touches[0];
                    const touchX = touch ? touch.clientX : 0;
                    const touchY = touch ? touch.clientY : 0;
                    row._ltLongPress = false;
                    let timer = setTimeout(() => {
                        if (!rowEl || !rowEl.isConnected) return;
                        rowEl._ltLongPress = true;
                        try { showMsgOpsMenu(e, msg.id, rowEl, touchX, touchY); } catch(err) { console.error('消息菜单失败:', err); }
                    }, 600);
                    const end = () => { clearTimeout(timer); };
                    rowEl.addEventListener('touchend', end, {once: true});
                    rowEl.addEventListener('touchmove', end, {once: true});
                }, { passive: true });
                return row;
            }
            const row = document.createElement('div');
            row.className = 'system-msg' + (msg.subtype ? ' ' + msg.subtype : '');
            row.dataset.id = msg.id;
            row.innerHTML = `<span>${msg.content}</span>`;
            row.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showMsgOpsMenu(e, msg.id, row, e.clientX, e.clientY);
            });
            row.addEventListener('touchstart', (e) => {
                const rowEl = e.currentTarget;
                const touch = e.touches[0];
                const touchX = touch ? touch.clientX : 0;
                const touchY = touch ? touch.clientY : 0;
                let timer = setTimeout(() => {
                    if (!rowEl || !rowEl.isConnected) return;
                    try { showMsgOpsMenu(e, msg.id, rowEl, touchX, touchY); } catch(err) { console.error('消息菜单失败:', err); }
                }, 600);
                const end = () => { clearTimeout(timer); };
                rowEl.addEventListener('touchend', end, {once: true});
                rowEl.addEventListener('touchmove', end, {once: true});
            }, { passive: true });
            return row;
        }
        if (msg.type === 'shopShareCard') {
            const _scRow = document.createElement('div');
            _scRow.className = 'msg-row shop-share-row';
            _scRow.dataset.id = msg.id;
            _scRow.innerHTML = (typeof shopRenderShareCard === 'function') ? shopRenderShareCard(msg) : '';
            _scRow.addEventListener('contextmenu', (e) => { e.preventDefault(); showMsgOpsMenu(e, msg.id, _scRow, e.clientX, e.clientY); });
            _scRow.addEventListener('touchstart', (e) => {
                const rowEl = e.currentTarget; const touch = e.touches[0];
                const tx = touch ? touch.clientX : 0, ty = touch ? touch.clientY : 0;
                let timer = setTimeout(() => { if (!rowEl || !rowEl.isConnected) return; try { showMsgOpsMenu(e, msg.id, rowEl, tx, ty); } catch(err){} }, 600);
                const end = () => { clearTimeout(timer); };
                rowEl.addEventListener('touchend', end, {once:true});
                rowEl.addEventListener('touchmove', end, {once:true});
            }, { passive: true });
            return _scRow;
        }
            
        const row = document.createElement('div');
        const _avatarPos = msg.sender === 'mine' ? (s.myAvatarPosition || s.avatarPosition) : (s.otherAvatarPosition || s.avatarPosition);
        row.className = `msg-row ${msg.sender === 'mine' ? 'mine' : 'other'} ${_avatarPos !== 'middle' ? 'avatar-' + _avatarPos : ''} ${isMultiDeleteMode ? 'multi-select-mode' : ''}`;
        row.dataset.id = msg.id;

        if (isMultiDeleteMode && msg.type !== 'system') {
            const chk = document.createElement('div');
            chk.className = 'multi-check';
            chk.onclick = (e) => { e.stopPropagation(); toggleMultiSelect(msg.id); };
            row.appendChild(chk);
        }

            // 头像显示逻辑：综合已有的全局开关与新增的分方开关
            // - hideAvatar：关闭所有头像
            // - onlyFirstAvatar / onlyLastAvatar：仅显示第一条/最后一条（不分方）
            // - onlyOtherFirstAvatar / onlyMyFirstAvatar：只显示某方第一条
            // - onlyOtherLastAvatar / onlyMyLastAvatar：只显示某方最后一条
            // 各开关相互叠加（AND 关系）：开启越多，显示条件越严格
            let showAvatar = !s.hideAvatar;
            // 分方隐藏头像：单独隐藏我方/对方头像
            if (showAvatar && msg.sender === 'mine' && s.hideMyAvatar) showAvatar = false;
            if (showAvatar && msg.sender === 'other' && s.hideOtherAvatar) showAvatar = false;
            if (showAvatar && (s.onlyFirstAvatar || s.onlyOtherFirstAvatar || s.onlyMyFirstAvatar)) {
                // 第一条相关开关：对方需是对方第一条，我方需是我方第一条
                if (msg.sender === 'other') {
                    if (s.onlyFirstAvatar && !isFirst) showAvatar = false;
                    if (s.onlyOtherFirstAvatar && index !== otherFirstIdx) showAvatar = false;
                } else {
                    if (s.onlyFirstAvatar && !isFirst) showAvatar = false;
                    if (s.onlyMyFirstAvatar && index !== myFirstIdx) showAvatar = false;
                }
            }
            if (showAvatar && (s.onlyLastAvatar || s.onlyOtherLastAvatar || s.onlyMyLastAvatar)) {
                // 最后一条相关开关
                if (msg.sender === 'other') {
                    if (s.onlyLastAvatar && !isLast) showAvatar = false;
                    if (s.onlyOtherLastAvatar && index !== otherLastIdx) showAvatar = false;
                } else {
                    if (s.onlyLastAvatar && !isLast) showAvatar = false;
                    if (s.onlyMyLastAvatar && index !== myLastIdx) showAvatar = false;
                }
            }
            const isVerticalAvatar = _avatarPos === 'top' || _avatarPos === 'bottom';
            if (msg.sender === 'other') {
                if (showAvatar) {
                    if (s.showNicknames && isVerticalAvatar) {
                        var _nw = document.createElement('div');
                        _nw.className = 'msg-avatar-name';
                        _nw.appendChild(createAvatarElement('other'));
                        var _nick = document.createElement('span');
                        _nick.className = 'msg-nickname';
                        _nick.textContent = s.otherNickname || '对方';
                        _nick.style.fontSize = s.otherNicknameSize + 'px';
                        _nick.style.color = s.otherNicknameColor;
                        _nw.appendChild(_nick);
                        row.appendChild(_nw);
                    } else {
                        row.appendChild(createAvatarElement('other'));
                    }
                } else if (!isVerticalAvatar && !s.hideAvatar && !s.hideOtherAvatar) {
                    const ph = document.createElement('div');
                    ph.style.width = 'var(--avatar-size)';
                    ph.style.height = 'var(--avatar-size)';
                    ph.style.flexShrink = '0';
                    ph.style.visibility = 'hidden';
                    ph.style.marginRight = '8px';
                    row.appendChild(ph);
                }
            }
            
            const wrap = document.createElement('div');
            wrap.className = 'msg-bubble-wrap';
            if (isVerticalAvatar) {
                wrap.style.maxWidth = '100%';
            }
            
            if (msg.quote) {
                const quote = document.createElement('div');
                quote.className = 'msg-quote';
                quote.textContent = msg.quote;
                wrap.appendChild(quote);
            }
            
            const bubble = document.createElement('div');
            bubble.className = 'msg-bubble';
            if (s.bubbleTail) {
                const isMine = msg.sender === 'mine';
                const tailOn = isMine ? (s.myTailEnabled !== false) : (s.otherTailEnabled !== false);
                const firstOnly = isMine ? (s.myFirstTailOnly) : (s.otherFirstTailOnly);
                // 仅首条小尾巴：只在每组连续消息的第一条显示尾巴
                if (tailOn && (!firstOnly || isFirst)) {
                    bubble.classList.add(isMine ? 'tail-right' : 'tail-left');
                }
            }
            
            if (msg.type === 'diary-card') {
                const _dcRow = document.createElement('div');
                _dcRow.className = 'msg-row diary-share-row';
                _dcRow.dataset.id = msg.id;
                var _dcHtml = '<div class="diary-share-card">';
                _dcHtml += '<div class="dsc-title">' + escapeHtml(msg.cardTitle || '日记分享') + '</div>';
                _dcHtml += '<div class="dsc-body">' + escapeHtml(msg.content) + '</div>';
                _dcHtml += '<div class="dsc-footer">\u270E</div>';
                _dcHtml += '</div>';
                _dcRow.innerHTML = _dcHtml;
                _dcRow.addEventListener('contextmenu', (e) => { e.preventDefault(); showMsgOpsMenu(e, msg.id, _dcRow, e.clientX, e.clientY); });
                _dcRow.addEventListener('touchstart', (e) => {
                    const rowEl = e.currentTarget; const touch = e.touches[0];
                    const tx = touch ? touch.clientX : 0, ty = touch ? touch.clientY : 0;
                    let timer = setTimeout(() => { if (!rowEl || !rowEl.isConnected) return; try { showMsgOpsMenu(e, msg.id, rowEl, tx, ty); } catch(err){} }, 600);
                    const end = () => { clearTimeout(timer); };
                    rowEl.addEventListener('touchend', end, {once:true});
                    rowEl.addEventListener('touchmove', end, {once:true});
                }, { passive: true });
                return _dcRow;
            } else if (msg.type === 'text') {
                bubble.textContent = msg.content;
            } else if (msg.type === 'image') {
                bubble.className += ' media-msg';
                bubble.innerHTML = `<img src="${msg.content}" alt="" onclick="event.stopPropagation();viewMomentImage(this.src)" style="cursor:pointer;">`;
            } else if (msg.type === 'video') {
                bubble.className += ' media-msg';
                bubble.innerHTML = `<video src="${msg.content}" controls playsinline webkit-playsinline preload="auto"></video>`;
            } else if (msg.type === 'emoji') {
                bubble.innerHTML = `<img src="${msg.content}" style="width:80px;">`;
                bubble.style.background = 'transparent';
                bubble.style.border = 'none';
                bubble.style.padding = '0';
            } else if (msg.type === 'transfer') {
                const statusText = {
                    pending: '待领取',
                    claimed: '已领取',
                    refunded: '已退回'
                }[msg.status] || '';
                bubble.className += ' transfer-msg ' + (msg.status || 'pending');
                bubble.innerHTML = `
                    <div class="transfer-amount">¥${msg.amount}</div>
                    <div class="transfer-desc">${msg.remark || '转账'}</div>
                    <div class="transfer-status">转账（${statusText}）</div>
                `;
                // 转账形状独立于气泡圆角设置，强制使用转账自己的border-radius
                const _tr = appData.chatSettings.transferRadius !== undefined ? appData.chatSettings.transferRadius : 8;
                bubble.style.borderRadius = _tr + 'px';
                bubble.style.setProperty('border-radius', _tr + 'px', 'important');
                // 确保转账消息固定宽度，防止avatar-top/bottom布局下被fit-content覆盖
                bubble.style.width = '200px';
                bubble.style.setProperty('width', '200px', 'important');
                // status class already applied
                bubble.onclick = () => handleTransferClick(msg);
            } else if (msg.type === 'blindCard') {
                bubble.className += ' blind-card-msg';
                let modeText = '';
                if (msg.correctIndexes && msg.correctIndexes.length === 1) modeText = '单选 · 选 1 张';
                else if (msg.correctIndexes && msg.correctIndexes.length > 1) modeText = '多选 · 选 ' + msg.correctIndexes.length + ' 张';
                else modeText = '自由选择';
                let optionsHtml = msg.options.map((opt, i) =>
                    `<span class="blind-card-option-tag">${String.fromCharCode(65+i)}. ${opt}</span>`
                ).join('');
                bubble.innerHTML = `
                    <div class="blind-card-question">${msg.question}</div>
                    <div class="blind-card-tip">${modeText}</div>
                    <div class="blind-card-options">${optionsHtml}</div>
                `;
                bubble.onclick = () => openBcPlay(msg.id);
            }
            
            // 分条气泡圆角：根据消息序号覆盖圆角
            // 优先级：分条四角圆方（msgCornersEnabled）> 分条圆角（msgRadiusEnabled）> CSS变量
            // -1 表示沿用对应方的CSS变量（含四角圆角），>=0 时用具体值覆盖
            // 转账消息形状独立，跳过分条圆角逻辑
            var _msgR = -1;
            if (s.msgRadiusEnabled && msg.type !== 'transfer' && msg.type !== 'image' && msg.type !== 'video' && msg.type !== 'blindCard') {
                if (msg.sender === 'other') {
                    _msgR = otherMsgCount === 1 ? s.otherMsg1Radius : (otherMsgCount === 2 ? s.otherMsg2Radius : s.otherMsg3Radius);
                } else {
                    _msgR = myMsgCount === 1 ? s.myMsg1Radius : (myMsgCount === 2 ? s.myMsg2Radius : s.myMsg3Radius);
                }
            }
            if (_msgR >= 0) {
                // 分条圆角指定了具体值，直接覆盖（不使用四角圆角）
                bubble.style.borderRadius = _msgR + 'px';
            }
            // 当 _msgR === -1 时，不设置 inline borderRadius，CSS变量自动生效（含四角）

            // 分条四角圆方（新增）：优先级最高，按消息序号设置四角
            // 仅当开启分条四角圆方且非转账消息时生效
            if (s.msgCornersEnabled && msg.type !== 'transfer' && msg.type !== 'image' && msg.type !== 'video' && msg.type !== 'blindCard') {
                var _tl = 8, _tr = 8, _br = 8, _bl = 8;
                if (msg.sender === 'other') {
                    if (otherMsgCount === 1) { _tl = s.otherMsg1TL; _tr = s.otherMsg1TR; _br = s.otherMsg1BR; _bl = s.otherMsg1BL; }
                    else if (otherMsgCount === 2) { _tl = s.otherMsg2TL; _tr = s.otherMsg2TR; _br = s.otherMsg2BR; _bl = s.otherMsg2BL; }
                    else { _tl = s.otherMsg3TL; _tr = s.otherMsg3TR; _br = s.otherMsg3BR; _bl = s.otherMsg3BL; }
                } else {
                    if (myMsgCount === 1) { _tl = s.myMsg1TL; _tr = s.myMsg1TR; _br = s.myMsg1BR; _bl = s.myMsg1BL; }
                    else if (myMsgCount === 2) { _tl = s.myMsg2TL; _tr = s.myMsg2TR; _br = s.myMsg2BR; _bl = s.myMsg2BL; }
                    else { _tl = s.myMsg3TL; _tr = s.myMsg3TR; _br = s.myMsg3BR; _bl = s.myMsg3BL; }
                }
                bubble.style.borderRadius = _tl + 'px ' + _tr + 'px ' + _br + 'px ' + _bl + 'px';
            }

            // 分条气泡颜色（新增）：按消息序号覆盖背景色
            // 仅当开启分条气泡颜色且非转账消息时生效
            if (s.msgColorEnabled && msg.type !== 'transfer' && msg.type !== 'image' && msg.type !== 'video' && msg.type !== 'blindCard') {
                var _msgBg = '';
                if (msg.sender === 'other') {
                    _msgBg = otherMsgCount === 1 ? s.otherMsg1Bg : (otherMsgCount === 2 ? s.otherMsg2Bg : s.otherMsg3Bg);
                } else {
                    _msgBg = myMsgCount === 1 ? s.myMsg1Bg : (myMsgCount === 2 ? s.myMsg2Bg : s.myMsg3Bg);
                }
                if (_msgBg) {
                    bubble.style.backgroundColor = _msgBg;
                    // 同步小尾巴内层颜色，使尾巴背景与分条气泡背景融合
                    bubble.style.setProperty('--tail-color', _msgBg);
                }
            }

            // 分条气泡边框色（新增）：按消息序号覆盖边框色
            // 仅当开启分条气泡边框色且非转账消息时生效
            if (s.msgBorderEnabled && msg.type !== 'transfer' && msg.type !== 'image' && msg.type !== 'video' && msg.type !== 'blindCard') {
                var _msgBorder = '';
                if (msg.sender === 'other') {
                    _msgBorder = otherMsgCount === 1 ? s.otherMsg1Border : (otherMsgCount === 2 ? s.otherMsg2Border : s.otherMsg3Border);
                } else {
                    _msgBorder = myMsgCount === 1 ? s.myMsg1Border : (myMsgCount === 2 ? s.myMsg2Border : s.myMsg3Border);
                }
                if (_msgBorder) {
                    bubble.style.borderColor = _msgBorder;
                    // 同步小尾巴外层颜色，使尾巴边框与分条气泡边框融合
                    bubble.style.setProperty('--tail-border-color', _msgBorder);
                }
            }

            // 分条气泡大小（新增）：按消息序号覆盖padding
            // 仅当开启分条气泡大小且非转账消息时生效
            if (s.msgSizeEnabled && msg.type !== 'transfer' && msg.type !== 'image' && msg.type !== 'video' && msg.type !== 'blindCard') {
                var _msgPad = -1;
                if (msg.sender === 'other') {
                    _msgPad = otherMsgCount === 1 ? s.otherMsg1Size : (otherMsgCount === 2 ? s.otherMsg2Size : s.otherMsg3Size);
                } else {
                    _msgPad = myMsgCount === 1 ? s.myMsg1Size : (myMsgCount === 2 ? s.myMsg2Size : s.myMsg3Size);
                }
                if (_msgPad >= 0) {
                    bubble.style.padding = _msgPad + 'px ' + (_msgPad + 4) + 'px';
                }
            }

            // 分条气泡字体大小（新增）：按消息序号覆盖字号
            // 仅当开启分条气泡字体大小且非转账消息时生效
            if (s.msgFontEnabled && msg.type !== 'transfer' && msg.type !== 'image' && msg.type !== 'video' && msg.type !== 'blindCard') {
                var _msgFont = -1;
                if (msg.sender === 'other') {
                    _msgFont = otherMsgCount === 1 ? s.otherMsg1Font : (otherMsgCount === 2 ? s.otherMsg2Font : s.otherMsg3Font);
                } else {
                    _msgFont = myMsgCount === 1 ? s.myMsg1Font : (myMsgCount === 2 ? s.myMsg2Font : s.myMsg3Font);
                }
                if (_msgFont > 0) {
                    bubble.style.fontSize = _msgFont + 'px';
                }
            }

            // 已读 / 双对号
            var _showReadThis = (s.showRead || s.showDoubleCheck) && (msg.type === 'text' || msg.type === 'emoji');
            if (_showReadThis && s.onlyLastRead && s.onlyFirstRead) {
                _showReadThis = isLast || isFirst;
            } else if (_showReadThis && s.onlyLastRead) {
                _showReadThis = isLast;
            } else if (_showReadThis && s.onlyFirstRead) {
                _showReadThis = isFirst;
            }
            if (_showReadThis) {
                var _readText = '';
                if (s.showRead) _readText += '已读';
                if (s.showDoubleCheck) _readText += (s.showRead ? ' ' : '') + '✓✓';
                if (s.readPosition === 'inside') {
                    if (msg.type === 'text') {
                        // 行内格式：对方「文字内容  已读/双对号」，我方「已读/双对号 文字内容」
                        var _rs = document.createElement('span');
                        _rs.style.cssText = 'color:' + s.readColor + ';font-size:11px;margin:0 4px;white-space:nowrap;line-height:1.2;';
                        _rs.textContent = _readText;
                        if (msg.sender === 'other') {
                            // 文字内容  已读/双对号
                            bubble.appendChild(document.createTextNode(' '));
                            bubble.appendChild(_rs);
                        } else {
                            // 已读/双对号 文字内容
                            bubble.insertBefore(_rs, bubble.firstChild);
                            bubble.insertBefore(document.createTextNode(' '), _rs.nextSibling);
                        }
                    } else {
                        // 非文字消息：已读标记独占一行显示在内容下方
                        var _ri = document.createElement('div');
                        _ri.style.cssText = 'color:' + s.readColor + ';font-size:11px;display:block;width:100%;clear:both;margin-top:4px;line-height:1.2;';
                        _ri.style.textAlign = msg.sender === 'other' ? 'right' : 'left';
                        _ri.textContent = _readText;
                        bubble.appendChild(_ri);
                    }
                }
            }

            wrap.appendChild(bubble);

            // 已读 / 双对号（外部）
            if (_showReadThis && s.readPosition === 'outside') {
                var _ro = document.createElement('div');
                _ro.style.cssText = 'color:' + s.readColor + ';font-size:11px;margin-top:3px;line-height:1.2;';
                _ro.style.textAlign = msg.sender === 'other' ? 'left' : 'right';
                _ro.textContent = (s.showRead ? '已读' : '') + (s.showDoubleCheck ? (s.showRead ? ' ' : '') + '✓✓' : '');
                wrap.appendChild(_ro);
            }

            row.appendChild(wrap);
            
            // 拉黑消息标记 - 红色感叹号SVG（显示在气泡外部，气泡右侧）
            if (msg.blocked && msg.sender === 'other') {
                try { addBlockedIndicator(row, msg); } catch(e) {}
            }
            
            if (msg.sender === 'mine') {
                if (showAvatar) {
                    if (s.showNicknames && isVerticalAvatar) {
                        var _nw2 = document.createElement('div');
                        _nw2.className = 'msg-avatar-name';
                        var _nick2 = document.createElement('span');
                        _nick2.className = 'msg-nickname';
                        _nick2.textContent = s.myNickname || '我';
                        _nick2.style.fontSize = s.myNicknameSize + 'px';
                        _nick2.style.color = s.myNicknameColor;
                        _nw2.appendChild(_nick2);
                        _nw2.appendChild(createAvatarElement('mine'));
                        row.appendChild(_nw2);
                    } else {
                        row.appendChild(createAvatarElement('mine'));
                    }
                } else if (!isVerticalAvatar && !s.hideAvatar && !s.hideMyAvatar) {
                    const ph = document.createElement('div');
                    ph.style.width = 'var(--avatar-size)';
                    ph.style.height = 'var(--avatar-size)';
                    ph.style.flexShrink = '0';
                    ph.style.visibility = 'hidden';
                    ph.style.marginLeft = '8px';
                    row.appendChild(ph);
                }
            }
            
            row.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showMsgOpsMenu(e, msg.id, row, e.clientX, e.clientY);
            });
            row.addEventListener('touchstart', (e) => {
                const rowEl = e.currentTarget;
                const touch = e.touches[0];
                const touchX = touch ? touch.clientX : 0;
                const touchY = touch ? touch.clientY : 0;
                let timer = setTimeout(() => {
                    if (!rowEl || !rowEl.isConnected) return;
                    try { showMsgOpsMenu(e, msg.id, rowEl, touchX, touchY); } catch(err) { console.error('消息菜单失败:', err); }
                }, 600);
                const end = () => { clearTimeout(timer); };
                rowEl.addEventListener('touchend', end, {once: true});
                rowEl.addEventListener('touchmove', end, {once: true});
            }, { passive: true });
            
            return row;
    }
    function createAvatarElement(type) {
        const s = appData.chatSettings;
        const div = document.createElement('div');
        div.className = 'msg-avatar';
        
        const avatarSrc = type === 'other' ? s.otherAvatar : s.myAvatar;
        if (avatarSrc) {
            const img = document.createElement('img');
            img.src = avatarSrc;
            div.appendChild(img);
        }
        
        const frame = type === 'other' ? s.otherFrame : s.myFrame;
        const frames = type === 'other' ? s.otherFrames : s.myFrames;
        if (frame && frame !== 'none' && frames[frame]) {
            const overlay = document.createElement('div');
            overlay.className = 'frame-overlay';
            let frameData = frames[frame]; const frameSrc = typeof frameData === 'object' ? frameData.src : frameData;
            overlay.style.backgroundImage = `url(${frameSrc})`;
            const sz = (typeof frameData==='object' && frameData.size) ? frameData.size : 130;
            const offset = (sz - 100) / 2;
            overlay.style.width = sz + '%';
            overlay.style.height = sz + '%';
            overlay.style.top = (-offset) + '%';
            overlay.style.left = (-offset) + '%';
            if(typeof frameData==='object'&&frameData.offsetX!==undefined){overlay.style.transform='translate('+frameData.offsetX+'px,'+frameData.offsetY+'px)';}
            div.appendChild(overlay);
        }
        
        return div;
    }
    /* ===== 局部 DOM 更新辅助函数（避免全量重渲染） ===== */
    // 更新聊天消息中指定类型(other/mine)的头像图片 src
    function updateChatAvatarDOM(type) {
        var s = appData.chatSettings;
        var src = type === 'other' ? s.otherAvatar : s.myAvatar;
        var selector = type === 'other' ? '.msg-row.other .msg-avatar img' : '.msg-row.mine .msg-avatar img';
        var container = document.getElementById('chatMessages');
        if (!container) return;
        container.querySelectorAll(selector).forEach(function(img) {
            if (src) {
                img.src = src;
                img.style.display = '';
            } else {
                img.style.display = 'none';
            }
        });
    }
    // 更新聊天消息中指定类型(other/mine)的头像框 overlay
    function updateChatAvatarFrameDOM(type) {
        var s = appData.chatSettings;
        var frameId = type === 'other' ? s.otherFrame : s.myFrame;
        var frames = type === 'other' ? s.otherFrames : s.myFrames;
        var selector = type === 'other' ? '.msg-row.other .msg-avatar' : '.msg-row.mine .msg-avatar';
        var container = document.getElementById('chatMessages');
        if (!container) return;
        container.querySelectorAll(selector).forEach(function(avDiv) {
            // 移除旧 frame-overlay
            var oldOverlay = avDiv.querySelector('.frame-overlay');
            if (oldOverlay) oldOverlay.remove();
            // 添加新 frame-overlay
            if (frameId && frameId !== 'none' && frames && frames[frameId]) {
                var overlay = document.createElement('div');
                overlay.className = 'frame-overlay';
                var frameData = frames[frameId];
                var frameSrc = typeof frameData === 'object' ? frameData.src : frameData;
                overlay.style.backgroundImage = 'url(' + frameSrc + ')';
                var sz = (typeof frameData === 'object' && frameData.size) ? frameData.size : 130;
                var offset = (sz - 100) / 2;
                overlay.style.width = sz + '%';
                overlay.style.height = sz + '%';
                overlay.style.top = (-offset) + '%';
                overlay.style.left = (-offset) + '%';
                if (typeof frameData === 'object' && frameData.offsetX !== undefined) {
                    overlay.style.transform = 'translate(' + frameData.offsetX + 'px,' + frameData.offsetY + 'px)';
                }
                avDiv.appendChild(overlay);
            }
        });
    }
    // 更新朋友圈中指定类型(mine/other)的头像图片
    function updateMomentsAvatarDOM(type) {
        var s = appData.chatSettings;
        var src = type === 'other' ? s.otherAvatar : s.myAvatar;
        var container = document.getElementById('momentsList');
        if (!container) return;
        container.querySelectorAll('.moment-item').forEach(function(item) {
            var id = item.dataset.id;
            var moment = appData.moments.list.find(function(m) { return String(m.id) === String(id); });
            if (moment && moment.sender === type) {
                var avDiv = item.querySelector('.moment-avatar');
                if (avDiv) {
                    if (src) {
                        avDiv.innerHTML = '<img src="' + src + '" alt="">';
                    } else {
                        avDiv.innerHTML = '';
                    }
                }
            }
        });
    }
    // 更新朋友圈中指定类型(mine/other)的昵称文字
    function updateMomentsNicknameDOM(type, nickname) {
        var container = document.getElementById('momentsList');
        if (!container) return;
        container.querySelectorAll('.moment-item').forEach(function(item) {
            var id = item.dataset.id;
            var moment = appData.moments.list.find(function(m) { return String(m.id) === String(id); });
            if (moment && moment.sender === type) {
                var nickEl = item.querySelector('.moment-nickname');
                if (nickEl) nickEl.textContent = nickname;
            }
        });
    }
    // 局部刷新某条朋友圈的点赞评论区（不重建整个列表）
    function refreshMomentLikeComment(momentId) {
        var moment = appData.moments.list.find(function(m) { return String(m.id) === String(momentId); });
        if (!moment) return;
        var likeComment = document.getElementById('likeComment_' + momentId);
        if (!likeComment) { renderMomentsList(); return; }
        // 保留评论输入框
        var commentInput = document.getElementById('commentInput_' + momentId);
        // 移除旧的 like-list 和 comment-list
        var oldLikeList = likeComment.querySelector('.like-list');
        var oldCommentList = likeComment.querySelector('.comment-list');
        if (oldLikeList) oldLikeList.remove();
        if (oldCommentList) oldCommentList.remove();
        // 重建 like-list
        if (moment.likes.length > 0) {
            var likeList = document.createElement('div');
            likeList.className = 'like-list';
            likeList.textContent = moment.likes.map(function(l) { return l.nickname; }).join('、');
            likeComment.insertBefore(likeList, likeComment.firstChild);
        }
        // 重建 comment-list
        if (moment.comments.length > 0) {
            var commentList = document.createElement('div');
            commentList.className = 'comment-list';
            moment.comments.forEach(function(c, idx) {
                if (!c.id) c.id = 'c_' + moment.id + '_' + idx + '_' + Math.random().toString(36).slice(2, 6);
                var cItem = document.createElement('div');
                cItem.className = 'comment-item';
                var nickSpan = document.createElement('span');
                nickSpan.className = 'comment-nick';
                nickSpan.textContent = c.nickname;
                cItem.appendChild(nickSpan);
                if (c.replyTo) {
                    cItem.appendChild(document.createTextNode(' 回复 '));
                    var replySpan = document.createElement('span');
                    replySpan.className = 'comment-nick';
                    replySpan.textContent = c.replyTo;
                    cItem.appendChild(replySpan);
                    cItem.appendChild(document.createTextNode('：'));
                } else {
                    cItem.appendChild(document.createTextNode('：'));
                }
                var textSpan = document.createElement('span');
                textSpan.className = 'comment-text';
                textSpan.textContent = c.content;
                cItem.appendChild(textSpan);
                cItem.onclick = function(e) {
                    e.stopPropagation();
                    startReplyComment(moment.id, c.id, c.nickname);
                };
                commentList.appendChild(cItem);
            });
            // 插入到 commentInput 之前
            if (commentInput) {
                likeComment.insertBefore(commentList, commentInput);
            } else {
                likeComment.appendChild(commentList);
            }
        }
        // 更新 show 状态
        if (moment.likes.length > 0 || moment.comments.length > 0) {
            likeComment.classList.add('show');
        } else {
            likeComment.classList.remove('show');
        }
    }
    var _scrollRafPending = false;
    function scrollToBottom() {
        if (_scrollRafPending) return;
        _scrollRafPending = true;
        requestAnimationFrame(function() {
            _scrollRafPending = false;
            const el = document.getElementById('chatMessages');
            if (el) el.scrollTop = el.scrollHeight;
        });
    }
    // 平滑滚动到底部（下滑键点击）
    function scrollToBottomSmooth() {
        const el = document.getElementById('chatMessages');
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        const btn = document.getElementById('scrollBottomBtn');
        if (btn) btn.style.display = 'none';
    }
    // 聊天滚动监听：上滑超过30条显示下滑键
    function setupChatScrollListener() {
        const el = document.getElementById('chatMessages');
        if (!el) return;
        let scrollTimer = null;
        el.addEventListener('scroll', function() {
            if (scrollTimer) clearTimeout(scrollTimer);
            scrollTimer = setTimeout(function() {
                const history = appData.chatHistory;
                const btn = document.getElementById('scrollBottomBtn');
                if (!btn) return;
                // 只在聊天页面可见时处理
                if (document.getElementById('chatPage').style.display !== 'flex') {
                    btn.style.display = 'none';
                    return;
                }
                // 计算距离底部的距离
                const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                // 超过30条消息且不在底部附近时显示
                if (history.length > 30 && distFromBottom > 200) {
                    btn.style.display = 'flex';
                } else {
                    btn.style.display = 'none';
                }
            }, 100);
        }, { passive: true });
    }
    function handleChatEnter(e) {
        if (e.key === 'Enter') {
            sendTextMessage();
        }
    }
    function sendTextMessage() {
      try {
        const input = document.getElementById('chatInput');
        if (!input) return;
        // 拉黑状态下禁止发送
        if (_activeContactId) {
            var _c = _findContactById(_activeContactId);
            if (_c && _c.isBlocked) { toast('你已拉黑对方'); return; }
        }
        const text = input.value.trim();
        if (!text) return;

        addMessage({
            id: Date.now(),
            sender: 'mine',
            type: 'text',
            content: text,
            quote: currentQuoteMsg ? (currentQuoteMsg.type === 'text' ? currentQuoteMsg.content : (currentQuoteMsg.type === 'image' ? '[图片]' : (currentQuoteMsg.type === 'video' ? '[视频]' : (currentQuoteMsg.type === 'emoji' ? '[表情]' : (currentQuoteMsg.type === 'transfer' ? '[转账]' : (currentQuoteMsg.type === 'system' ? '[系统消息]' : currentQuoteMsg.content)))))) : null
        });

        input.value = '';
        currentQuoteMsg = null;
      } catch (e) { console.error('sendTextMessage失败:', e); }
    }
    var _batchRendering = false;
    function addMessage(msg) {
      try {
        // 记录消息所属的联系人 ID，用于通知恢复时定位正确的聊天记录
        if (!msg.contactId) msg.contactId = _activeContactId || _lastChatContactId || null;
        // 如果当前不在该联系人聊天上下文中，临时切换以确保消息写入正确的聊天记录
        var _msgContactId = msg.contactId;
        var _needRestoreContext = _msgContactId && _activeContactId !== _msgContactId;
        var _savedAddMsgId = _activeContactId;
        if (_needRestoreContext) {
            _activeContactId = _msgContactId;
        }
        appData.chatHistory.push(msg);
        // 限制消息历史数量，防止内存占用过大导致卡顿
        const MAX_HISTORY = 500;
        if (appData.chatHistory.length > MAX_HISTORY) {
            appData.chatHistory = appData.chatHistory.slice(-MAX_HISTORY);
        }
        if (_needRestoreContext) {
            _activeContactId = _savedAddMsgId;
        }
        // 批量模式下不立即渲染，由调用方统一触发
        if (_batchRendering) return;
        saveDataSync();
        renderMessages(true);
        scrollToBottom();
        // 触发站内消息通知（仅对方发来的消息）
        if (msg.sender === 'other') {
            showChatNotification(msg);
        }
      } catch (e) { console.error('addMessage失败:', e); }
    }
    function triggerReceive() {
        // 免打扰模式下对方不主动回复
        if (_activeContactId) {
            var _c = _findContactById(_activeContactId);
            if (_c && _c.doNotDisturb) return;
        }
        if (replyTimer) clearTimeout(replyTimer);
        const s = appData.chatSettings;
        // 已读不回：按概率决定对方是否回复
        if (Math.random() * 100 < (s.readNoReplyProb || 0)) {
            // 对方已读但决定不回复
            return;
        }
        isTyping = true;
        document.getElementById('chatTitle').textContent = '对方正在输入中...';
        const delay = Math.floor(Math.random() * (s.replyTimeMax - s.replyTimeMin + 1) + s.replyTimeMin) * 1000;

        // 捕获当前的联系人上下文，确保退出聊天后定时器触发时消息仍写入正确的聊天记录
        var _replyContactId = _activeContactId;

        replyTimer = setTimeout(() => {
            isTyping = false;
            document.getElementById('chatTitle').textContent = appData.chatSettings.otherNickname;
            // 恢复触发时的联系人上下文，使回复消息写入正确的聊天记录
            var _savedContactId = _activeContactId;
            _activeContactId = _replyContactId;
            try {
                generateReply();
            } catch(e) { console.error('generateReply失败:', e); }
            _activeContactId = _savedContactId;
            // 如果聊天页可见但当前联系人与回复目标不同，需要重新渲染当前聊天
            if (document.getElementById('chatPage').style.display === 'flex' && _savedContactId !== _replyContactId) {
                try { renderMessages(); scrollToBottom(); } catch(e) {}
            }
        }, delay);
    }
    function generateReply() {
        const s = appData.chatSettings;
        const count = Math.floor(Math.random() * (s.replyCountMax - s.replyCountMin + 1)) + s.replyCountMin;
        
        if (Math.random() * 100 < s.nudgeProb && appData.specialCards.nudge.length > 0) {
            const visible = appData.specialCards.nudge.filter(c => !c.hidden);
            if (visible.length > 0) {
                const nudgeText = visible[Math.floor(Math.random() * visible.length)].text;
                addSystemMsg(`${appData.chatSettings.otherNickname} ${nudgeText}`);
            }
        }
        
        if (Math.random() * 100 < s.emojiProb && appData.emojis.other.length > 0) {
            const emoji = appData.emojis.other[Math.floor(Math.random() * appData.emojis.other.length)];
            addMessage({
                id: Date.now(),
                sender: 'other',
                type: 'emoji',
                content: emoji
            });
            return;
        }
        
        const allCards = getAllVisibleWordCards();
        if (allCards.length === 0) return;
        
        /* 批量模式：循环内只 push 数据，循环结束后统一渲染一次，避免多次全量重排 */
        _batchRendering = true;
        try {
        for (let i = 0; i < count; i++) {
            let text;
            if (s.enableSplice && Math.random() > 0.5) {
                const spliceCount = Math.min(Math.floor(Math.random() * 3) + 1, allCards.length);
                const shuffled = [...allCards].sort(() => 0.5 - Math.random());
                text = shuffled.slice(0, spliceCount).join(' ');
            } else {
                text = allCards[Math.floor(Math.random() * allCards.length)];
            }
            
            if (appData.specialSettings.enableEmoji && Math.random() < (appData.specialSettings.emojiSendProb||10)/100 && appData.specialCards.emoji.length > 0) {
                const visible = appData.specialCards.emoji.filter(c => !c.hidden);
                if (visible.length > 0) {
                    if (appData.specialSettings.emojiSplice) {
                        text += visible[Math.floor(Math.random() * visible.length)].text;
                    } else {
                        /* 独立发送emoji消息 */
                        addMessage({ id: Date.now()+Math.random(), sender:'other', type:'text', content: visible[Math.floor(Math.random() * visible.length)].text });
                    }
                }
            }
            if (appData.specialSettings.enableKaomoji && Math.random() < (appData.specialSettings.kaomojiProb||10)/100 && appData.specialCards.kaomoji.length > 0) {
                const visible = appData.specialCards.kaomoji.filter(c => !c.hidden);
                if (visible.length > 0) {
                    if (appData.specialSettings.kaomojiSplice) {
                        text += visible[Math.floor(Math.random() * visible.length)].text;
                    } else {
                        /* 独立发送颜文字消息 */
                        addMessage({ id: Date.now()+Math.random(), sender:'other', type:'text', content: visible[Math.floor(Math.random() * visible.length)].text });
                    }
                }
            }
            
            let quote = null;
            if (Math.random() > 0.95 && appData.chatHistory.length > 0) {
                const mineMsgs = appData.chatHistory.filter(m => m.sender === 'mine' && m.type === 'text');
                if (mineMsgs.length > 0) {
                    const randomMsg = mineMsgs[Math.floor(Math.random() * mineMsgs.length)];
                    quote = randomMsg.content;
                }
            }
            
            addMessage({
                id: Date.now() + i,
                sender: 'other',
                type: 'text',
                content: text,
                quote: quote
            });
        }
        } finally {
        /* 批量结束：统一渲染一次（try/finally 确保异常时也能重置标志） */
        _batchRendering = false;
        }
        saveData();
        renderMessages(true);
        scrollToBottom();
        /* 批量模式下 addMessage 提前返回未触发通知，此处补发：仅当不在聊天界面时通知最后一条消息 */
        var _hist = appData.chatHistory;
        if (_hist && _hist.length > 0) {
            var _lastMsg = _hist[_hist.length - 1];
            if (_lastMsg && _lastMsg.sender === 'other') {
                showChatNotification(_lastMsg);
            }
        }

        if (Math.random() * 100 < (s.transferProb !== undefined ? s.transferProb : 5)) {
            /* 捕获当前聊天联系人上下文（generateReply 内 _activeContactId 已临时设为回复目标） */
            var _autoTransferCid = _activeContactId || null;
            setTimeout(() => {
                /* 临时恢复聊天上下文，确保转账消息和系统消息写入正确的聊天记录 */
                var _savedAutoCid = _activeContactId;
                _activeContactId = _autoTransferCid;
                try {
                /* 使用 getOtherBalance 按联系人上下文读取对方余额 */
                var _otherBal = getOtherBalance(_autoTransferCid);
                // Check if other party has balance
                if (_otherBal > 0) {
                    const amount = Math.min((Math.random() * 100 + 1).toFixed(2), _otherBal);
                    const remark = getRandomWordCard() || '转账';
                    // Deduct from other's balance via addBalanceRecord（按联系人上下文）
                    addBalanceRecord('other', -parseFloat(amount), '对方向你转账 ¥' + parseFloat(amount).toFixed(2), _autoTransferCid);
                    addMessage({
                        id: Date.now(),
                        sender: 'other',
                        type: 'transfer',
                        amount: amount,
                        remark: remark,
                        status: 'pending'
                    });
                } else if (s.allowZeroTransfer) {
                    // 零余额转账：允许转账并附带留言
                    const amount = (Math.random() * 100 + 1).toFixed(2);
                    const remark = getRandomWordCard() || '转账';
                    addMessage({
                        id: Date.now(),
                        sender: 'other',
                        type: 'transfer',
                        amount: amount,
                        remark: remark,
                        status: 'pending'
                    });
                } else {
                    // Other party has no money
                    addSystemMsg('对方想为你转账，但奈何余额空空，快一起去赚钱吧！');
                }
                } finally { _activeContactId = _savedAutoCid; }
            }, 1000);
        }
        
        if (Math.random() * 100 < (s.callInitProb || 5)) {
            setTimeout(() => {
                incomingVideoCall();
            }, 2000);
        }
    }
    function getRandomWordCard() {
        const all = getAllVisibleWordCards();
        if (all.length === 0) return '';
        return all[Math.floor(Math.random() * all.length)];
    }
    function addSystemMsg(text, subtype) {
        addMessage({
            id: Date.now(),
            type: 'system',
            subtype: subtype || '',
            content: text
        });
    }
    // 添加系统消息到【主聊天】（不受当前联系人上下文影响）
    // 日记、相册等全局功能的提醒应始终出现在主聊天界面。
    // 旧实现直接调用 addSystemMsg → addMessage，msg.contactId 会被自动赋值为
    // _activeContactId || _lastChatContactId，若用户刚从联系人聊天进入日记页，
    // 系统消息会被写入该联系人的独立记录，导致主聊天界面看不到提醒。
    function addSystemMsgToMain(text, subtype) {
        // 日记/信封等全局提醒：优先发送到最近聊天的联系人窗口，确保用户可见
        var targetId = _activeContactId || _lastChatContactId || null;
        var _savedActive = _activeContactId;
        _activeContactId = targetId;
        try {
            addMessage({
                id: Date.now(),
                type: 'system',
                subtype: subtype || '',
                content: text
            });
        } catch (e) { console.error('addSystemMsgToMain失败:', e); }
        _activeContactId = _savedActive;
    }

    // ===== 表情面板 =====
    function toggleEmojiPanel() {
        const panel = document.getElementById('emojiPanel');
        const plusPanel = document.getElementById('plusPanel');
        plusPanel.classList.remove('show');
        panel.classList.toggle('show');
    }
    function switchEmojiTab(tab) {
        document.querySelectorAll('.emoji-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        document.getElementById('emojiGridMine').style.display = tab === 'mine' ? 'grid' : 'none';
        document.getElementById('emojiGridOther').style.display = tab === 'other' ? 'grid' : 'none';
    }
    function renderEmojis() {
        renderEmojiGrid('mine', appData.emojis.mine);
        renderEmojiGrid('other', appData.emojis.other);
    }
    function renderEmojiGrid(type, list) {
        const grid = document.getElementById(type === 'mine' ? 'emojiGridMine' : 'emojiGridOther');
        const existingEmojis = grid.querySelectorAll('.emoji-item');
        existingEmojis.forEach(el => el.remove());
        let addBtn = grid.querySelector('.emoji-add');
        if (!addBtn) {
            addBtn = document.createElement('div');
            addBtn.className = 'emoji-add';
            addBtn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
            addBtn.onclick = () => addEmoji(type);
            grid.appendChild(addBtn);
        }
        list.forEach((src, index) => {
            const item = document.createElement('div');
            item.className = 'emoji-item';
            item.style.position = 'relative';
            item.innerHTML = `<img src="${src}" alt="">`;
            // 删除按钮（右上角小×号）
            const delBtn = document.createElement('div');
            delBtn.style.cssText = 'position:absolute;top:-4px;right:-4px;width:16px;height:16px;background:rgba(255,0,0,0.7);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:10px;color:#fff;line-height:1;z-index:2;opacity:0;transition:opacity 0.2s;pointer-events:none;';
            delBtn.textContent = '×';
            delBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                if (confirm('确定删除这个表情包吗？')) {
                    // 边界检查，防止索引越界
                    if (index < 0 || index >= appData.emojis[type].length) {
                        renderEmojis();
                        return;
                    }
                    appData.emojis[type].splice(index, 1);
                    // 使用同步保存，避免快速连续删除时防抖导致数据丢失/白屏
                    saveDataSync();
                    renderEmojis();
                }
            });
            item.appendChild(delBtn);
            // 鼠标悬停/触摸时显示删除按钮
            item.addEventListener('mouseenter', function() { delBtn.style.opacity = '1'; delBtn.style.pointerEvents = 'auto'; });
            item.addEventListener('mouseleave', function() { delBtn.style.opacity = '0'; delBtn.style.pointerEvents = 'none'; });
            let showDelTimer = null;
            item.addEventListener('touchstart', function(e) {
                showDelTimer = setTimeout(function() { delBtn.style.opacity = '1'; delBtn.style.pointerEvents = 'auto'; }, 400);
            }, { passive: true });
            item.addEventListener('touchend', function() { clearTimeout(showDelTimer); }, { passive: true });
            item.addEventListener('touchmove', function() { clearTimeout(showDelTimer); }, { passive: true });
            item.addEventListener('click', function(e) {
                e.preventDefault();
                sendEmoji(type, src);
            });
            grid.insertBefore(item, addBtn);
        });
    }
    function addEmoji(type) {
        currentEditType = 'emoji';
        currentEditTarget = type;
        document.getElementById('multiFileInput').click();
    }
    function sendEmoji(type, src) {
        addMessage({
            id: Date.now(),
            sender: 'mine',
            type: 'emoji',
            content: src
        });
        document.getElementById('emojiPanel').classList.remove('show');
    }

    // ===== +号面板 =====
    function togglePlusPanel() {
        const panel = document.getElementById('plusPanel');
        const emojiPanel = document.getElementById('emojiPanel');
        emojiPanel.classList.remove('show');
        panel.classList.toggle('show');
    }

    // ===== 转账功能 =====
    function openTransferModal() {
        document.getElementById('transferModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
        document.getElementById('plusPanel').classList.remove('show');
    }
    function closeTransferModal() {
        document.getElementById('transferModal').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }
    function sendTransfer() {
        const amount = document.getElementById('transferAmount').value;
        const remark = document.getElementById('transferRemark').value;
        if (!amount || parseFloat(amount) <= 0) return;
        const amt = parseFloat(amount);
        /* 捕获当前聊天联系人上下文，确保转账记录写入正确的联系人余额 */
        var transferCid = _activeContactId || null;
        // Check balance (mine is global)
        if (!appData.balanceData || (appData.balanceData.mine || 0) < amt) {
            alert('余额不足');
            return;
        }
        
        // Deduct from my balance + write record via addBalanceRecord（按聊天上下文定位联系人）
        addBalanceRecord('mine', -amt, '你向对方转账 ¥' + amt.toFixed(2), transferCid);
        
        const transferId = Date.now();
        addMessage({
            id: transferId,
            sender: 'mine',
            type: 'transfer',
            amount: amt.toFixed(2),
            remark: remark || '转账',
            status: 'pending'
        });
        
        closeTransferModal();
        
        // For "mine" transfers, auto-accept after a delay (simulates other party receiving)
        const sentTransferId = transferId;
        setTimeout(() => {
            /* 临时恢复聊天上下文，确保系统消息写入正确的聊天记录 */
            var _savedTransferCid = _activeContactId;
            _activeContactId = transferCid;
            try {
            /* 在正确的聊天记录中查找转账消息（_activeContactId 可能已变化） */
            var _searchHist = transferCid ? (function(){ var _c = _findContactById(transferCid); return _c ? (_c.chatHistory || []) : []; })() : _actualChatHistory;
            if (!_searchHist) _searchHist = _actualChatHistory || [];
            const msg = _searchHist.find(m => m.type === 'transfer' && m.sender === 'mine' && m.status === 'pending' && m.id === sentTransferId);
            if (msg) {
                const accept = Math.random() > 0.3;
                msg.status = accept ? 'claimed' : 'refunded';
                if (accept) {
                    // Add to other's balance (per-contact if chatting with a contact)
                    addBalanceRecord('other', amt, '对方领取了你的转账 ¥' + amt.toFixed(2), transferCid);
                } else {
                    // Refund to my balance
                    addBalanceRecord('mine', amt, '对方退回了转账 ¥' + amt.toFixed(2), transferCid);
                }
                renderMessages();
                addSystemMsg(accept ? '对方已领取转账' : '对方已退回转账');
            }
            } finally { _activeContactId = _savedTransferCid; }
        }, 60000); // 1 minute delay - user must wait, simulates real behavior
    }
    function handleTransferClick(msg) {
        if (msg.sender !== 'other' || msg.status !== 'pending') return;
        currentOpsMsgId = msg.id;
        document.getElementById('transferHandleTitle').textContent = `${appData.chatSettings.otherNickname} 转账给你`;
        document.getElementById('transferHandleAmount').textContent = `¥${msg.amount}`;
        document.getElementById('transferHandleRemark').textContent = msg.remark;
        document.getElementById('transferHandleModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
    }
    function claimTransfer() {
        const msg = appData.chatHistory.find(m => m.id === currentOpsMsgId);
        if (msg) {
            msg.status = 'claimed';
            const amt = parseFloat(msg.amount);
            // Add to my balance (mine is global; use msg.contactId for record placement)
            addBalanceRecord('mine', amt, '你领取了对方的转账 ¥' + amt.toFixed(2), msg.contactId || null);
            renderMessages();
            addSystemMsg('你已领取转账');
        }
        closeTransferHandle();
    }
    function refundTransfer() {
        const msg = appData.chatHistory.find(m => m.id === currentOpsMsgId);
        if (msg) {
            msg.status = 'refunded';
            const amt = parseFloat(msg.amount);
            // Refund to other's balance (per-contact via msg.contactId)
            addBalanceRecord('other', amt, '你退回了对方的转账 ¥' + amt.toFixed(2), msg.contactId || null);
            renderMessages();
            addSystemMsg('你已退回转账');
        }
        closeTransferHandle();
    }
    function closeTransferHandle() {
        document.getElementById('transferHandleModal').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }

    // ===== 拍一拍 =====
    // 发送拍一拍
    function sendNudge() {
        const s = appData.chatSettings;
        var nudgeCards = (appData.specialCards && appData.specialCards.nudge) ? appData.specialCards.nudge.filter(function(c){return !c.hidden && c.text;}) : [];
        if (nudgeCards.length > 0) {
            var pick = nudgeCards[Math.floor(Math.random() * nudgeCards.length)];
            addSystemMsg(pick.text);
        } else {
            addSystemMsg('你拍了拍' + s.otherNickname);
        }
        document.getElementById('plusPanel').classList.remove('show');
    }
    function openNudgeModal() {
        document.getElementById('nudgeModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
        document.getElementById('plusPanel').classList.remove('show');
        document.getElementById('nudgeTextInput').value = appData.specialCards.nudge.map(c => c.text).join('\n');
    }
    function closeNudgeModal() {
        document.getElementById('nudgeModal').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }
    function saveNudgeCards() {
        const text = document.getElementById('nudgeTextInput').value;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        const seen = new Set(appData.specialCards.nudge.map(c => (c.text || '').trim()));
        lines.forEach(line => {
            const key = line.trim();
            if (!seen.has(key)) { seen.add(key); appData.specialCards.nudge.push({text: line, hidden: false}); }
        });
        saveData();
        renderNudgeCardList();
        closeNudgeModal();
    }
    function renderNudgeCardList() {
        const container = document.getElementById('nudgeCardList');
        container.innerHTML = '';
        appData.specialCards.nudge.forEach((card, index) => {
            const item = document.createElement('div');
            item.className = 'special-card-item' + (card.hidden ? ' hidden' : '');
            item.innerHTML = `
                <div class="card-text">${card.text}</div>
                <div class="card-ops">
                    <span onclick="editNudgeCard(${index})">修改</span>
                    <span onclick="toggleNudgeHide(${index})">${card.hidden ? '显示' : '隐藏'}</span>
                    <span onclick="deleteNudgeCard(${index})">删除</span>
                </div>
            `;
            container.appendChild(item);
        });
    }
    function editNudgeCard(index) {
        const newText = prompt('修改拍一拍内容', appData.specialCards.nudge[index].text);
        if (newText && newText.trim()) {
            appData.specialCards.nudge[index].text = newText.trim();
            saveDataSync();
            var container = document.getElementById('nudgeCardList');
            var item = container && container.children[index];
            if (item) {
                var textEl = item.querySelector('.card-text');
                if (textEl) textEl.textContent = newText.trim();
            } else { renderNudgeCardList(); }
        }
    }
    function toggleNudgeHide(index) {
        appData.specialCards.nudge[index].hidden = !appData.specialCards.nudge[index].hidden;
        saveDataSync();
        var container = document.getElementById('nudgeCardList');
        var item = container && container.children[index];
        if (item) {
            item.classList.toggle('hidden', appData.specialCards.nudge[index].hidden);
            var ops = item.querySelector('.card-ops');
            if (ops) ops.children[1].textContent = appData.specialCards.nudge[index].hidden ? '显示' : '隐藏';
        } else { renderNudgeCardList(); }
    }
    function deleteNudgeCard(index) {
        if (confirm('确定删除这条拍一拍吗？')) {
            appData.specialCards.nudge.splice(index, 1);
            saveDataSync();
            var container = document.getElementById('nudgeCardList');
            if (container && container.children[index]) {
                container.removeChild(container.children[index]);
                for (var i = index; i < container.children.length; i++) {
                    var ops = container.children[i].querySelector('.card-ops');
                    if (ops) {
                        ops.children[0].setAttribute('onclick', 'editNudgeCard(' + i + ')');
                        ops.children[1].setAttribute('onclick', 'toggleNudgeHide(' + i + ')');
                        ops.children[2].setAttribute('onclick', 'deleteNudgeCard(' + i + ')');
                    }
                }
            } else { renderNudgeCardList(); }
        }
    }
    function batchUploadNudge() {
        appData.batchUploadType = 'nudge';
        document.getElementById('batchUploadTextarea').value = '';
        document.getElementById('batchUploadTextarea').placeholder = '一行一句拍一拍文案';
        document.getElementById('batchUploadModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
    }
    function uploadNudgeFile() {
        currentEditType = 'nudgeTextFile';
        document.getElementById('textFileInput').click();
    }

    // ===== 盲选抽牌 =====
    var _blindCardState = {
        msgId: null,
        options: [],
        correctIndexes: [],
        selected: [],
        mode: 'single',
        countdown: 30,
        timer: null,
        flipped: false,
        otherSelected: false,
        otherSelection: [],
        otherSelectTimer: null,
        expired: false
    };

    function openBlindCardModal() {
        document.getElementById('blindCardModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
        document.getElementById('plusPanel').classList.remove('show');
        renderBlindCardEditor();
        setTimeout(() => document.getElementById('blindCardQuestion').focus(), 100);
    }

    function closeBlindCardModal() {
        document.getElementById('blindCardModal').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }

    function renderBlindCardEditor() {
        const wrap = document.getElementById('blindCardOptionsWrap');
        let html = '';
        const defaultOpts = ['', '', ''];
        defaultOpts.forEach((text, idx) => {
            html += blindCardOptionRowHtml(idx, text);
        });
        html += `<div onclick="addBlindCardOption()" style="display:flex;align-items:center;gap:6px;color:#7BA7CC;font-size:13px;cursor:pointer;margin:8px 0 12px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>添加选项</div>`;
        html += `<div style="font-size:12px;color:#999;margin-bottom:6px;">勾选正确答案；勾1个为单选，勾多个为多选，不勾为自由选择</div>`;
        wrap.innerHTML = html;
    }

    function blindCardOptionRowHtml(idx, text) {
        return `<div class="blind-card-opt-row" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;" data-idx="${idx}">
            <input type="text" class="modal-input" id="blindCardOpt${idx}" placeholder="选项 ${String.fromCharCode(65+idx)}" value="${text}" style="flex:1;margin-bottom:0;">
            <div onclick="removeBlindCardOption(${idx})" style="width:22px;height:22px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#999;flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
            <input type="checkbox" class="blind-card-cb wordcard-checkbox" id="blindCardCb${idx}" title="设为正确答案" style="flex-shrink:0;">
        </div>`;
    }

    function addBlindCardOption() {
        const wrap = document.getElementById('blindCardOptionsWrap');
        const rows = wrap.querySelectorAll('.blind-card-opt-row');
        if (rows.length >= 16) { alert('最多16个选项'); return; }
        const idx = rows.length;
        const div = document.createElement('div');
        div.innerHTML = blindCardOptionRowHtml(idx, '');
        const addBtn = wrap.querySelector('[onclick="addBlindCardOption()"]');
        wrap.insertBefore(div.firstElementChild, addBtn);
    }

    function removeBlindCardOption(idx) {
        const wrap = document.getElementById('blindCardOptionsWrap');
        const rows = Array.from(wrap.querySelectorAll('.blind-card-opt-row'));
        if (rows.length <= 2) { alert('至少保留2个选项'); return; }
        const target = rows.find(r => parseInt(r.dataset.idx) === idx);
        if (target) target.remove();
        const remaining = Array.from(wrap.querySelectorAll('.blind-card-opt-row'));
        remaining.forEach((r, i) => {
            r.dataset.idx = i;
            const cb = r.querySelector('.blind-card-cb');
            const inp = r.querySelector('input[type="text"]');
            const del = r.querySelector('div[onclick^="removeBlindCardOption"]');
            cb.id = 'blindCardCb' + i;
            inp.id = 'blindCardOpt' + i;
            inp.placeholder = '选项 ' + String.fromCharCode(65 + i);
            del.setAttribute('onclick', 'removeBlindCardOption(' + i + ')');
        });
    }

    function collectBlindCardData() {
        const question = document.getElementById('blindCardQuestion').value.trim();
        const wrap = document.getElementById('blindCardOptionsWrap');
        const rows = Array.from(wrap.querySelectorAll('.blind-card-opt-row'));
        const options = [];
        const correctIndexes = [];
        rows.forEach((r, i) => {
            const text = r.querySelector('input[type="text"]').value.trim();
            if (text) {
                const realIdx = options.length;
                options.push(text);
                if (r.querySelector('.blind-card-cb').checked) correctIndexes.push(realIdx);
            }
        });
        const countdown = parseInt(document.getElementById('bcCountdownInput').value) || 30;
        return { question, options, correctIndexes, countdown };
    }

    function sendBlindCard() {
        const data = collectBlindCardData();
        if (!data.question) { alert('请输入问题'); return; }
        if (data.options.length < 2) { alert('请至少填写2个选项'); return; }
        const msgId = Date.now();
        // 先关闭创建模态框
        closeBlindCardModal();
        // 添加消息到历史（不立即渲染聊天，避免显示多余的界面）
        appData.chatHistory.push({
            id: msgId,
            sender: 'mine',
            type: 'blindCard',
            question: data.question,
            options: data.options,
            correctIndexes: data.correctIndexes,
            countdown: data.countdown,
            result: null
        });
        saveData();
        // 直接打开抽牌界面（图二）
        openBcPlay(msgId);
    }

    function getBlindCardGridClass(count) {
        if (count <= 2) return 'grid-template-columns: repeat(2, 1fr);';
        if (count <= 4) return 'grid-template-columns: repeat(2, 1fr);';
        if (count <= 9) return 'grid-template-columns: repeat(3, 1fr);';
        return 'grid-template-columns: repeat(4, 1fr);';
    }

    function openBcPlay(msgId) {
        const msg = appData.chatHistory.find(m => m.id === msgId);
        if (!msg || msg.type !== 'blindCard') return;
        const overlay = document.getElementById('blindCardOverlay');
        const grid = document.getElementById('blindCardGrid');
        const title = document.getElementById('blindCardOverlayTitle');
        const tip = document.getElementById('blindCardOverlayTip');

        _blindCardState.msgId = msgId;
        _blindCardState.options = msg.options.slice();
        _blindCardState.correctIndexes = (msg.correctIndexes || []).slice();
        _blindCardState.selected = [];
        _blindCardState.flipped = false;
        _blindCardState.otherSelected = false;
        _blindCardState.otherSelection = [];

        if (_blindCardState.correctIndexes.length === 0) _blindCardState.mode = 'free';
        else if (_blindCardState.correctIndexes.length === 1) _blindCardState.mode = 'single';
        else _blindCardState.mode = 'multi';

        title.textContent = msg.question;

        grid.style.cssText = getBlindCardGridClass(_blindCardState.options.length);

        // 如果已有结果，直接显示翻开的卡面（查看模式）
        if (msg.result) {
            _blindCardState.selected = (msg.result.selectedIndexes || []).slice();
            _blindCardState.flipped = true;
            _blindCardState.otherSelected = true;

            tip.textContent = '对方选择：' + (msg.result.selectedLabels || '无') + ' · ' + (msg.result.statusText || '');

            let html = '';
            _blindCardState.options.forEach((opt, i) => {
                const isSel = _blindCardState.selected.includes(i);
                html += `<div class="blind-card${isSel ? ' flipped selected' : ''}" id="bcard${i}">
                    <div class="blind-card-inner" id="bcardInner${i}">
                        <div class="blind-card-back">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        </div>
                        <div class="blind-card-front" id="bcardFront${i}">${opt}</div>
                    </div>
                </div>`;
            });
            grid.innerHTML = html;

            document.getElementById('blindCardConfirmBtn').disabled = true;
            document.getElementById('blindCardConfirmBtn').textContent = '已翻开';
            document.getElementById('blindCardResultTip').classList.remove('show');

            overlay.classList.add('show');
        } else {
            // 新问卷：对方自动选择，用户不能选
            tip.textContent = '等待对方选择...';

            let html = '';
            _blindCardState.options.forEach((opt, i) => {
                html += `<div class="blind-card" id="bcard${i}">
                    <div class="blind-card-inner" id="bcardInner${i}">
                        <div class="blind-card-back">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        </div>
                        <div class="blind-card-front" id="bcardFront${i}">${opt}</div>
                    </div>
                </div>`;
            });
            grid.innerHTML = html;

            document.getElementById('blindCardConfirmBtn').disabled = true;
            document.getElementById('blindCardConfirmBtn').textContent = '确定';
            document.getElementById('blindCardResultTip').classList.remove('show');

            overlay.classList.add('show');
            startBlindCardCountdown(msg.countdown || 30);
            // 对方必须等设置时间到达后才会作出选择；不能提前启用确定。
        }
    }

    // 模拟对方以平均概率自动选择
    function chooseBlindCardSelection(msg) {
        const count = msg.options.length;
        const correct = msg.correctIndexes || [];
        let selected = [];
        if (correct.length === 1) {
            selected = [Math.floor(Math.random() * count)];
        } else if (correct.length > 1) {
            const pool = Array.from({length: count}, (_, i) => i);
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            selected = pool.slice(0, correct.length).sort((a, b) => a - b);
        } else {
            const pickCount = Math.floor(Math.random() * count) + 1;
            const pool = Array.from({length: count}, (_, i) => i);
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            selected = pool.slice(0, pickCount).sort((a, b) => a - b);
        }
        return selected;
    }

    function simulateOtherSelection(msg) {
        if (msg && msg._forceImmediate) {
            const selected = chooseBlindCardSelection(msg);
            _blindCardState.otherSelected = true;
            _blindCardState.otherSelection = selected;
            const tipEl = document.getElementById('blindCardOverlayTip');
            if (tipEl) tipEl.textContent = '对方已选择，点击确定翻开卡面';
            const confirmBtn = document.getElementById('blindCardConfirmBtn');
            if (confirmBtn) confirmBtn.disabled = false;
            return;
        }
        const cd = msg.countdown || 30;
        // 对方只能在设定的倒计时时间到达后才作出选择，不可提前
        const delay = cd;

        _blindCardState.otherSelectTimer = setTimeout(() => {
            // 如果已过期、已关闭或已翻开，不执行
            if (_blindCardState.expired || _blindCardState.flipped) return;

            const count = msg.options.length;
            const correct = msg.correctIndexes || [];
            let selected = [];

            if (correct.length === 1) {
                // 单选：每个选项平均概率
                selected = [Math.floor(Math.random() * count)];
            } else if (correct.length > 1) {
                // 多选：随机选 correct.length 个，每个组合等概率
                const pool = Array.from({length: count}, (_, i) => i);
                for (let i = pool.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [pool[i], pool[j]] = [pool[j], pool[i]];
                }
                selected = pool.slice(0, correct.length).sort((a, b) => a - b);
            } else {
                // 自由选择：随机选 1~count 个
                const pickCount = Math.floor(Math.random() * count) + 1;
                const pool = Array.from({length: count}, (_, i) => i);
                for (let i = pool.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [pool[i], pool[j]] = [pool[j], pool[i]];
                }
                selected = pool.slice(0, pickCount).sort((a, b) => a - b);
            }

            _blindCardState.otherSelected = true;
            _blindCardState.otherSelection = selected;

            // 更新提示，启用确定按钮
            const tipEl = document.getElementById('blindCardOverlayTip');
            if (tipEl) tipEl.textContent = '对方已选择，点击确定翻开卡面';
            const confirmBtn = document.getElementById('blindCardConfirmBtn');
            if (confirmBtn) confirmBtn.disabled = false;
        }, delay * 1000);
    }

    function closeBlindCardOverlay() {
        const overlay = document.getElementById('blindCardOverlay');
        overlay.classList.remove('show');
        stopBlindCardCountdown();
        if (_blindCardState.otherSelectTimer) {
            clearTimeout(_blindCardState.otherSelectTimer);
            _blindCardState.otherSelectTimer = null;
        }
        _blindCardState.expired = true;
        // 渲染聊天界面，显示消息
        renderMessages();
        scrollToBottom();
    }

    function startBlindCardCountdown(cd) {
        stopBlindCardCountdown();
        _blindCardState.countdown = cd || 30;
        _blindCardState.expired = false;
        document.getElementById('blindCardCountdown').textContent = _blindCardState.countdown;
        _blindCardState.timer = setInterval(() => {
            _blindCardState.countdown--;
            document.getElementById('blindCardCountdown').textContent = Math.max(0, _blindCardState.countdown);
            if (_blindCardState.countdown <= 0) {
                stopBlindCardCountdown();
                blindCardTimeout();
            }
        }, 1000);
    }

    function stopBlindCardCountdown() {
        if (_blindCardState.timer) { clearInterval(_blindCardState.timer); _blindCardState.timer = null; }
    }

    function updateBlindCardTip() {
        const tip = document.getElementById('blindCardOverlayTip');
        const s = _blindCardState;
        if (s.otherSelected) {
            tip.textContent = '对方已选择，点击确定翻开卡面';
        } else {
            tip.textContent = '等待对方选择...';
        }
    }

    function toggleBlindCard(idx) {
        // 用户不能选牌，只有对方可以选
        return;
    }

    function confirmBlindCard() {
        const s = _blindCardState;
        if (s.flipped) return;
        if (!s.otherSelected) {
            showBlindCardTip('对方还未选择，请稍候');
            return;
        }
        stopBlindCardCountdown();
        if (s.otherSelectTimer) {
            clearTimeout(s.otherSelectTimer);
            s.otherSelectTimer = null;
        }
        // 使用对方的选择翻开卡面
        s.selected = s.otherSelection.slice();
        flipBlindCardSelection();
    }

    function showBlindCardTip(text) {
        const el = document.getElementById('blindCardResultTip');
        el.textContent = text;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 1600);
    }

    function flipBlindCardSelection() {
        const s = _blindCardState;
        s.flipped = true;
        document.getElementById('blindCardConfirmBtn').disabled = true;
        document.getElementById('blindCardConfirmBtn').textContent = '已翻开';

        s.selected.forEach(idx => {
            const card = document.getElementById('bcard' + idx);
            if (card) card.classList.add('flipped');
        });

        setTimeout(() => {
            finishBlindCardRound(s.selected);
        }, 650);
    }

    function blindCardTimeout() {
        const s = _blindCardState;
        // Bug15修复：不再依赖 appData.chatHistory.find 查找消息（切换联系人后可能找不到），
        // 直接使用 _blindCardState 中已存储的数据，确保确定按钮始终被启用
        if (s.otherSelectTimer) {
            clearTimeout(s.otherSelectTimer);
            s.otherSelectTimer = null;
        }
        s.expired = true;
        if (!s.otherSelected) {
            s.otherSelection = chooseBlindCardSelection({ options: s.options, correctIndexes: s.correctIndexes });
            s.otherSelected = true;
        }
        const tipEl = document.getElementById('blindCardOverlayTip');
        if (tipEl) tipEl.textContent = '时间已到，对方已选择，点击确定翻开卡面';
        const confirmBtn = document.getElementById('blindCardConfirmBtn');
        if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '确定'; }
        showBlindCardTip('时间已到，对方已选择');
    }

    function finishBlindCardRound(selectedIndexes) {
        const s = _blindCardState;
        const msg = appData.chatHistory.find(m => m.id === s.msgId);
        if (!msg) { closeBlindCardOverlay(); return; }

        const selectedSorted = selectedIndexes.slice().sort((a, b) => a - b);
        const correctSorted = s.correctIndexes.slice().sort((a, b) => a - b);
        const labels = selectedIndexes.map(i => String.fromCharCode(65 + i) + '. ' + s.options[i]).join('、');

        let status = '';
        let statusText = '';
        let correct = false;

        if (s.mode === 'free') {
            status = 'free';
            statusText = '自由选择';
        } else if (s.mode === 'single') {
            if (selectedSorted.length === 0) {
                status = 'unanswered';
                statusText = '未作答';
            } else {
                correct = selectedSorted[0] === correctSorted[0];
                status = correct ? 'correct' : 'wrong';
                statusText = correct ? '一致' : '不一致';
            }
        } else {
            correct = selectedSorted.length === correctSorted.length && selectedSorted.every((v, i) => v === correctSorted[i]);
            status = correct ? 'correct' : 'wrong';
            statusText = correct ? '完全一致' : '不完全一致';
        }

        msg.result = {
            selectedIndexes: selectedIndexes.slice(),
            selectedLabels: labels || '无',
            status: status,
            statusText: statusText,
            correct: correct
        };
        saveData();
        renderMessages();

        addSystemMsg('盲选抽牌记录：对方选择了 ' + labels + ' · ' + statusText, 'blind-card-record');
        showBlindCardTip('对方选择了 ' + labels + ' · ' + statusText);

        setTimeout(() => {
            closeBlindCardOverlay();
        }, 1800);
    }

    // ===== 图片压缩：减少 Base64 内存占用 =====
    function compressImage(dataUrl, maxWidth, maxHeight, quality) {
        return new Promise((resolve) => {
            try {
                const img = new Image();
                img.onload = () => {
                    try {
                        let w = img.width, h = img.height;
                        if (w > maxWidth) { h = h * maxWidth / w; w = maxWidth; }
                        if (h > maxHeight) { w = w * maxHeight / h; h = maxHeight; }
                        const canvas = document.createElement('canvas');
                        canvas.width = Math.max(1, Math.round(w));
                        canvas.height = Math.max(1, Math.round(h));
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL('image/jpeg', quality));
                    } catch(e) { resolve(dataUrl); }
                };
                img.onerror = () => resolve(dataUrl);
                img.src = dataUrl;
            } catch(e) { resolve(dataUrl); }
        });
    }

    // ===== 发送图片/视频 =====
    function sendImageMsg() {
        currentEditType = 'chatImage';
        document.getElementById('multiFileInput').click();
        document.getElementById('plusPanel').classList.remove('show');
    }
    function handleVideoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (currentEditType === 'momentsVideoWallpaper') {
                appData.moments.videoWallpaper = ev.target.result;
                appData.moments.wallpaper = '';
                saveDataSync();
                // 局部更新：只替换朋友圈头部视频壁纸，不重建整个朋友圈页面（规则1/2）
                var _mh = document.getElementById('momentsHeader');
                if (_mh) {
                    var _bv = _mh.querySelector('video.moments-bg-video');
                    if (!_bv) {
                        _bv = document.createElement('video');
                        _bv.className = 'moments-bg-video';
                        _bv.muted = true; _bv.autoplay = true; _bv.loop = true; _bv.playsInline = true;
                        _bv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;';
                        _mh.style.position = 'relative';
                        _mh.insertBefore(_bv, _mh.firstChild);
                    }
                    _bv.src = ev.target.result;
                    _bv.play().catch(()=>{});
                    _mh.style.backgroundImage = 'none';
                }
            }
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }
    function handleMultiFileUpload(e) {
        const files = e.target.files;
        if (!files.length) return;
        
        if (currentEditType === 'emoji') {
            const type = currentEditTarget;
            const totalFiles = files.length;
            let processedCount = 0;
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    var imgSrc = ev.target.result;
                    // 安卓图片压缩（规则7）
                    try { imgSrc = await _compressImgIfAndroid(imgSrc); } catch(_ce){}
                    try {
                        appData.emojis[type].push(imgSrc);
                    } catch(e) {
                        console.error('表情包添加失败:', e);
                    }
                    processedCount++;
                    if (processedCount === totalFiles) {
                        saveDataSync();
                        renderEmojis();
                    }
                };
                reader.onerror = function() { processedCount++; };
                reader.readAsDataURL(file);
            });
        } else if (currentEditType === 'chatImage') {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    // 安卓必须压缩图片后再存储（规则7），iOS 保留原图
                    var compressed = ev.target.result;
                    try { compressed = await _compressImgIfAndroid(compressed); } catch(_ce){}
                    addMessage({
                        id: Date.now() + Math.random(),
                        sender: 'mine',
                        type: 'image',
                        content: compressed
                    });
                };
                reader.readAsDataURL(file);
            });
        } else if (currentEditType === 'imageCard') {
            let imgDupCount = 0;
            let processed = 0;
            const total = files.length;
            const newSrcs = [];
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    var src = ev.target.result;
                    // 安卓图片必须压缩（规则7）
                    try { src = await _compressImgIfAndroid(src); } catch(_ce){}
                    // 自动去重：相同图片不重复添加
                    if (appData.specialCards.image.includes(src)) {
                        imgDupCount++;
                    } else {
                        appData.specialCards.image.push(src);
                        newSrcs.push(src);
                    }
                    processed++;
                    if (processed === total) {
                        saveDataSync();
                        // 局部更新：只追加新图片卡片，不重建网格（规则5）
                        var grid = document.getElementById('imageCardGrid');
                        if (grid) {
                            var startIndex = appData.specialCards.image.length - newSrcs.length;
                            var fragment = document.createDocumentFragment();
                            newSrcs.forEach(function(srcVal, i) {
                                var idx = startIndex + i;
                                var item = document.createElement('div');
                                item.className = 'image-card-item';
                                item.style.position = 'relative';
                                item.innerHTML = '<img src="' + srcVal + '" alt="" onerror="this.style.display=\'none\';this.parentElement.style.background=\'#f0f0f0\';this.parentElement.innerHTML+=\'<div style=\\\'display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#ccc;font-size:11px;\\\'>图片加载失败</div>\';"><div class="publish-media-del" onclick="event.stopPropagation();deleteImageCard(' + idx + ')" style="position:absolute;top:2px;right:2px;width:18px;height:18px;background:rgba(0,0,0,0.5);color:white;border-radius:50%;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2;">×</div>';
                                fragment.appendChild(item);
                            });
                            grid.appendChild(fragment);
                        }
                        if (imgDupCount > 0) {
                            alert('已添加 ' + (total - imgDupCount) + ' 张，重复 ' + imgDupCount + ' 张已自动去重');
                        }
                    }
                };
                reader.readAsDataURL(file);
            });
        } else if (currentEditType === 'publishMedia') {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    if (appData.publishMediaList.length < 9) {
                        var src = ev.target.result;
                        // 安卓图片必须压缩（规则7），视频不压缩
                        if (file.type.startsWith('image')) {
                            try { src = await _compressImgIfAndroid(src); } catch(_ce){}
                        }
                        appData.publishMediaList.push({
                            type: file.type.startsWith('video') ? 'video' : 'image',
                            src: src
                        });
                        renderPublishMedia();
                    }
                };
                reader.readAsDataURL(file);
            });
        }
        e.target.value = '';
    }

    // ===== 视频通话 =====
    function setupVideoLongPress() {
        const container = document.getElementById('videoContainer');
        container.addEventListener('touchstart', function(e) {
            try {
                if (!e.target || !e.target.closest) return;
                if (e.target.closest('.video-btn') || e.target.closest('.video-minimize')) return;
            } catch(err) { return; }
            videoLongPressTimer = setTimeout(() => {
                try {
                    const menu = document.getElementById('videoBgMenu');
                    if (menu) menu.classList.toggle('show');
                } catch(err) { console.error('视频菜单失败:', err); }
            }, 600);
        }, { passive: true });
        container.addEventListener('touchend', () => {
            if (videoLongPressTimer) { clearTimeout(videoLongPressTimer); videoLongPressTimer = null; }
        }, { passive: true });
        container.addEventListener('touchmove', () => {
            if (videoLongPressTimer) { clearTimeout(videoLongPressTimer); videoLongPressTimer = null; }
        }, { passive: true });
        container.addEventListener('mousedown', function(e) {
            if (!e.target || !e.target.closest) return;
            if (e.target.closest('.video-btn') || e.target.closest('.video-minimize')) return;
            videoLongPressTimer = setTimeout(() => {
                try {
                    const menu = document.getElementById('videoBgMenu');
                    if (menu) menu.classList.toggle('show');
                } catch(err) { console.error('视频菜单失败:', err); }
            }, 600);
        });
        container.addEventListener('mouseup', () => {
            if (videoLongPressTimer) { clearTimeout(videoLongPressTimer); videoLongPressTimer = null; }
        });
        container.addEventListener('mouseleave', () => {
            if (videoLongPressTimer) { clearTimeout(videoLongPressTimer); videoLongPressTimer = null; }
        });

        // 最小化状态点击恢复
        container.addEventListener('click', function(e) {
            if (isMinimized && !e.target.closest('.video-btn') && !e.target.closest('.video-minimize')) {
                toggleMinimizeVideo();
            }
        });
    }

    function startVideoCall() {
        document.getElementById('plusPanel').classList.remove('show');
        isIncomingCall = false;
        document.getElementById('answerBtn').style.display = 'none';
        ensureVideoCallPageInBody();
        document.getElementById('videoCallPage').classList.add('show');
        document.getElementById('videoStatus').textContent = '等待对方接听...';
        isMinimized = false;
        document.getElementById('videoContainer').classList.remove('minimized');
        resetVideoContainerStyle();
        document.getElementById('videoBgMenu').classList.remove('show');
        
        const s = appData.chatSettings;
        const answerDelay = Math.floor(Math.random() * 7000) + 3000;
        
        callTimer = setTimeout(() => {
            if (Math.random() * 100 < (s.callAnswerProb || 80)) {
                answerCall();
            } else {
                document.getElementById('videoStatus').textContent = '对方拒接了通话';
                setTimeout(() => {
                    endCall();
                    addSystemMsg('对方拒接了视频通话');
                }, 1500);
            }
        }, answerDelay);
    }
    function incomingVideoCall() {
        isIncomingCall = true;
        document.getElementById('answerBtn').style.display = 'flex';
        ensureVideoCallPageInBody();
        document.getElementById('videoCallPage').classList.add('show');
        document.getElementById('videoStatus').textContent = '对方邀请你视频通话';
        isMinimized = false;
        document.getElementById('videoContainer').classList.remove('minimized');
        resetVideoContainerStyle();
        document.getElementById('videoBgMenu').classList.remove('show');
        
        callTimer = setTimeout(() => {
            endCall();
            addSystemMsg('未接来电');
        }, 40000);
    }
    function answerCall() {
        clearTimeout(callTimer);
        document.getElementById('answerBtn').style.display = 'none';
        document.getElementById('videoStatus').textContent = '通话中 00:00';
        callStartTime = Date.now();
        
        callDurationTimer = setInterval(() => {
            const diff = Math.floor((Date.now() - callStartTime) / 1000);
            const mins = Math.floor(diff / 60).toString().padStart(2, '0');
            const secs = (diff % 60).toString().padStart(2, '0');
            document.getElementById('videoStatus').textContent = `通话中 ${mins}:${secs}`;
        }, 1000);
    }
    function endCall() {
        clearTimeout(callTimer);
        clearInterval(callDurationTimer);
        
        let durationText = '';
        if (callStartTime > 0) {
            const diff = Math.floor((Date.now() - callStartTime) / 1000);
            const mins = Math.floor(diff / 60);
            const secs = diff % 60;
            durationText = `${mins}分${secs}秒`;
        }
        
        document.getElementById('videoCallPage').classList.remove('show');
        document.getElementById('videoContainer').classList.remove('minimized');
        resetVideoContainerStyle();
        isMinimized = false;
        callStartTime = 0;
        
        if (durationText) {
            addSystemMsg(`通话时长 ${durationText}`);
        }
    }
    function makeVideoDraggable(el){
        if(!el||el._ds)return;el._ds=true;
        let isDragging=false,sx,sy,ox,oy,raf=null;
        function start(x,y){
            // 仅在最小化状态下允许拖动，避免正常模式下大窗口被拖出屏幕、遮挡聊天界面
            if(!isMinimized){isDragging=false;return false;}
            isDragging=true;sx=x;sy=y;
            const r=el.getBoundingClientRect();ox=r.left;oy=r.top;
            return true;
        }
        function move(cx,cy){
            if(!isDragging)return;
            if(raf)cancelAnimationFrame(raf);
            raf=requestAnimationFrame(()=>{
                el.style.transition='none';
                let nl=ox+cx-sx, nt=oy+cy-sy;
                const r=el.getBoundingClientRect();
                const w=r.width||100, h=r.height||100;
                // 限制小窗始终在视口内，左右滑动不会消失
                const maxX=window.innerWidth-w-4, maxY=window.innerHeight-h-4;
                if(nl<4)nl=4; else if(maxX>4&&nl>maxX)nl=maxX;
                if(nt<4)nt=4; else if(maxY>4&&nt>maxY)nt=maxY;
                el.style.left=nl+'px';el.style.top=nt+'px';
                el.style.right='auto';el.style.bottom='auto';
                raf=null;
            });
        }
        function end(){isDragging=false;if(raf){cancelAnimationFrame(raf);raf=null;}}
        el.addEventListener('mousedown',e=>{
            if(!isMinimized)return;
            e.preventDefault();
            if(!start(e.clientX,e.clientY))return;
            const mv=e2=>move(e2.clientX,e2.clientY);
            const up=()=>{end();document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};
            document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
        });
        el.addEventListener('touchstart',e=>{
            if(!isMinimized)return; // 正常模式不响应拖动，防止滑动导致窗口消失/界面卡死
            if(!start(e.touches[0].clientX,e.touches[0].clientY))return;
            const mv=e2=>{e2.preventDefault();move(e2.touches[0].clientX,e2.touches[0].clientY);};
            const up=()=>{end();document.removeEventListener('touchmove',mv);document.removeEventListener('touchend',up);};
            document.addEventListener('touchmove',mv,{passive:false});
            document.addEventListener('touchend',up);
        },{passive:false});
    }
    // 清除拖动残留的内联定位样式，让视频窗口回到 CSS 定义的默认位置
    function resetVideoContainerStyle(){
        const c=document.getElementById('videoContainer');
        if(!c)return;
        c.style.left='';c.style.top='';c.style.right='';c.style.bottom='';c.style.transition='';
    }
    // 将视频通话页面移至 body 直接子节点，确保 position:fixed 始终相对视口定位，
    // 不受任何祖先 transform / will-change 影响（放大版模态框始终居中，不会一半在屏幕外）
    function ensureVideoCallPageInBody(){
        var p=document.getElementById('videoCallPage');
        if(p&&p.parentNode!==document.body){ document.body.appendChild(p); }
    }
    function toggleMinimizeVideo() {
        const container = document.getElementById('videoContainer');
        isMinimized = !isMinimized;
        if (isMinimized) {
            container.classList.add('minimized');
            makeVideoDraggable(container);
        } else {
            container.classList.remove('minimized');
            resetVideoContainerStyle();
        }
    }
    function changeVideoBg() {
        currentEditType = 'videoBg';
        document.getElementById('fileInput').click();
    }

    // ===== 消息操作菜单 =====
    function showMsgOpsMenu(e, msgId, targetEl, touchX, touchY) {
        currentOpsMsgId = msgId;
        try { e.stopPropagation(); } catch(err) {}
        const menu = document.getElementById('msgOpsMenu');
        menu.classList.add('show');
        menu.style.left = '0px';
        menu.style.top = '0px';

        // 测量菜单实际尺寸
        const menuRect = menu.getBoundingClientRect();
        const menuW = menuRect.width || 130;
        const menuH = menuRect.height || 140;

        let left = 0, top = 0;

        // 策略1：使用触摸/鼠标坐标（最准确）
        let clientX = null, clientY = null;
        if (typeof touchX === 'number' && typeof touchY === 'number') {
            clientX = touchX; clientY = touchY;
        } else if (e && e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
        } else if (e && e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY;
        } else if (e && typeof e.clientX === 'number' && typeof e.clientY === 'number' && (e.clientX > 0 || e.clientY > 0)) {
            clientX = e.clientX; clientY = e.clientY;
        }

        if (clientX !== null && clientY !== null) {
            // 以触摸点为中心水平居中，菜单在触摸点上方
            left = clientX - menuW / 2;
            top = clientY - menuH - 12;
            // 上方空间不足时翻转到下方
            if (top < 10) top = clientY + 20;
        } else if (targetEl && targetEl.isConnected) {
            // 策略2：回退到气泡元素的位置（而非整行）
            var bubble = targetEl.querySelector('.msg-bubble') || targetEl;
            try {
                var rect = bubble.getBoundingClientRect();
                var msg = appData.chatHistory.find(function(m){ return m.id === msgId; });
                // 我方消息靠右对齐，对方消息靠左对齐
                if (msg && msg.sender === 'me') {
                    left = rect.right - menuW;
                } else {
                    left = rect.left;
                }
                top = rect.top - menuH - 8;
                if (top < 10) top = rect.bottom + 8;
            } catch(err) { left = 10; top = 10; }
        } else {
            left = 10; top = 10;
        }

        // 边界检查：确保菜单不超出屏幕
        left = Math.max(10, Math.min(left, window.innerWidth - menuW - 10));
        top = Math.max(10, Math.min(top, window.innerHeight - menuH - 10));

        menu.style.left = left + 'px';
        menu.style.top = top + 'px';

        // 移除上一次的 click 监听器，防止多次调用导致监听器累积
        document.removeEventListener('click', closeMsgOpsMenu);
        setTimeout(() => {
            document.addEventListener('click', closeMsgOpsMenu, {once: true});
        }, 0);
    }
    function closeMsgOpsMenu() {
        document.getElementById('msgOpsMenu').classList.remove('show');
    }
    function quoteMessage() {
        const msg = appData.chatHistory.find(m => m.id === currentOpsMsgId);
        if (msg) {
            currentQuoteMsg = msg;
            document.getElementById('chatInput').focus();
        }
        closeMsgOpsMenu();
    }
    /* 局部切换多选模式：给已有消息行添加/移除多选勾选框，不重建列表（规则1/2） */
    function _applyMultiSelectMode(on) {
        var container = document.getElementById('chatMessages');
        if (!container) return;
        var rows = container.querySelectorAll('.msg-row');
        rows.forEach(function(row){
            if (on) {
                row.classList.add('multi-select-mode');
                if (!row.querySelector('.multi-check')) {
                    var chk = document.createElement('div');
                    chk.className = 'multi-check';
                    var mid = parseFloat(row.dataset.id);
                    chk.onclick = function(e){ e.stopPropagation(); toggleMultiSelect(mid); };
                    row.insertBefore(chk, row.firstChild);
                }
            } else {
                row.classList.remove('multi-select-mode');
                var chk = row.querySelector('.multi-check');
                if (chk) chk.remove();
            }
        });
    }
    function deleteMessage() {
        appData.chatHistory = appData.chatHistory.filter(m => m.id !== currentOpsMsgId);
        saveDataSync();
        // 局部移除：只删除对应消息行，不重建列表（规则1/2）
        var container = document.getElementById('chatMessages');
        if (container) {
            var rows = container.querySelectorAll('.msg-row');
            for (var i = 0; i < rows.length; i++) {
                if (parseFloat(rows[i].dataset.id) === currentOpsMsgId || String(rows[i].dataset.id) === String(currentOpsMsgId)) {
                    rows[i].remove();
                    // 同步修正已渲染计数，避免后续增量渲染错位
                    if (container._renderedCount) container._renderedCount = Math.max(0, container._renderedCount - 1);
                    break;
                }
            }
        }
        closeMsgOpsMenu();
    }
    function multiDeleteMode() {
        closeMsgOpsMenu();
        isMultiDeleteMode = !isMultiDeleteMode;
        multiDeleteSelected.clear();
        // 只切换多选模式类与勾选框，不重绘（规则1/2）
        _applyMultiSelectMode(isMultiDeleteMode);
        updateMultiDeleteUI();
    }
    function toggleMultiSelect(msgId) {
        if (multiDeleteSelected.has(msgId)) multiDeleteSelected.delete(msgId); else multiDeleteSelected.add(msgId);
        document.querySelectorAll('.multi-check').forEach(ch => {
            const row = ch.closest('.msg-row');
            if (row && multiDeleteSelected.has(parseFloat(row.dataset.id))) { ch.classList.add('checked'); ch.textContent = '✓'; }
            else { ch.classList.remove('checked'); ch.textContent = ''; }
        });
        updateMultiDeleteUI();
    }
    function updateMultiDeleteUI() {
        const bar = document.getElementById('multiDeleteBar');
        if (isMultiDeleteMode) { bar.classList.add('show'); document.getElementById('multiDeleteCount').textContent = '已选' + multiDeleteSelected.size + '条'; }
        else bar.classList.remove('show');
    }
    function confirmMultiDelete() {
        if (multiDeleteSelected.size === 0) return;
        if (!confirm('确定删除选中的' + multiDeleteSelected.size + '条消息？')) return;
        // 先收集要删除的 id，再清理数据
        var _toRemove = new Set(multiDeleteSelected);
        appData.chatHistory = appData.chatHistory.filter(m => !_toRemove.has(m.id));
        isMultiDeleteMode = false;
        saveDataSync();
        // 局部移除选中的消息行，不重建列表（规则1/2）
        var container = document.getElementById('chatMessages');
        if (container) {
            var removed = 0;
            var rows = container.querySelectorAll('.msg-row');
            rows.forEach(function(row){
                var mid = parseFloat(row.dataset.id);
                if (_toRemove.has(mid) || _toRemove.has(row.dataset.id)) {
                    row.remove(); removed++;
                }
            });
            if (removed && container._renderedCount) container._renderedCount = Math.max(0, container._renderedCount - removed);
        }
        multiDeleteSelected.clear();
        _applyMultiSelectMode(false);
        updateMultiDeleteUI();
    }
    function cancelMultiDelete() {
        isMultiDeleteMode = false; multiDeleteSelected.clear();
        // 只移除多选模式类与勾选框，不重绘（规则1/2）
        _applyMultiSelectMode(false);
        updateMultiDeleteUI();
    }

    // ===== 聊天设置 =====
    function openChatSettings() {
        try { updateChatSettingsDndBlock(); } catch(e) {}
        document.getElementById('settingsPage').style.display = 'flex';
        applyChatDisplaySettings();
        renderCustomFontList('chat');
        /* 渲染字卡统计（对方最爱字卡 + 频率排行 + 消息条数），确保进入设置即可见最新数据 */
        try {
            renderWordCloudStats();
            renderWordFreqRank();
            renderMessageCountStats();
        } catch(e) {}
    }
    /* 更新聊天设置中的免打扰/拉黑区域 */
    function updateChatSettingsDndBlock() {
        var section = document.getElementById('chatDndBlockSection');
        if (!section) return;
        if (_activeContactId) {
            section.style.display = 'block';
            if (typeof updateDndBlockToggles === 'function') {
                updateDndBlockToggles(_activeContactId);
            }
        } else {
            section.style.display = 'none';
        }
    }
    function closeChatSettings() {
        var sp = document.getElementById('settingsPage');
        if (sp) {
            sp.style.display = 'none';
            sp.style.transform = '';
            sp.style.transition = '';
        }
        // 修复 Android 右滑退出后底部输入框空白变形
        _fixAndroidChatFooter();
    }
    /* 修复 Android 右滑退出后底部输入框空白变形 */
    function _fixAndroidChatFooter() {
        try {
            var chatFooter = document.querySelector('.chat-footer');
            if (chatFooter) {
                chatFooter.style.marginTop = '';
                chatFooter.style.transform = '';
                chatFooter.style.paddingTop = '';
                chatFooter.style.height = '';
                chatFooter.style.position = '';
            }
            var chatPage = document.getElementById('chatPage');
            if (chatPage) {
                chatPage.style.paddingBottom = '';
            }
            // 触发 resize 让聊天布局重新计算
            setTimeout(function() {
                window.dispatchEvent(new Event('resize'));
            }, 50);
        } catch(e) {}
    }
    function editOtherNickname() {
        const name = prompt('输入对方昵称', appData.chatSettings.otherNickname);
        if (name && name.trim()) {
            appData.chatSettings.otherNickname = name.trim();
            // 同步更新当前联系人的名称到列表界面
            if (_activeContactId) {
                var _c = _findContactById(_activeContactId);
                if (_c) { _c.name = name.trim(); }
            }
            saveDataSync();
            // 局部更新：只改对应的昵称 DOM，不触发全量重绘（规则1/2）
            var titleEl = document.getElementById('chatTitle');
            if (titleEl && !isTyping) titleEl.textContent = name.trim();
            // 更新聊天消息中对方昵称
            document.querySelectorAll('.msg-row.other .msg-nickname').forEach(function(el){ el.textContent = name.trim(); });
            // 更新设置页预览
            var preview = document.getElementById('otherNicknameValue');
            if (preview) preview.textContent = name.trim();
            // 局部更新联系人列表名称，不调用 renderContactList()
            if (_activeContactId) _updateContactNameDOM(_activeContactId, name.trim());
            // 更新朋友圈对方昵称
            updateMomentsNicknameDOM('other', name.trim());
        }
    }
    function editMyNickname() {
        const name = prompt('输入我方昵称', appData.chatSettings.myNickname);
        if (name && name.trim()) {
            appData.chatSettings.myNickname = name.trim();
            saveDataSync();
            // 局部更新：只改对应的昵称 DOM，不触发 initChatPage() 全量重绘（规则1/2）
            document.querySelectorAll('.msg-row.mine .msg-nickname').forEach(function(el){ el.textContent = name.trim(); });
            var mn = document.getElementById('momentMyNick'); if (mn) mn.textContent = name.trim();
            var preview = document.getElementById('myNicknameValue');
            if (preview) preview.textContent = name.trim();
            updateMomentsNicknameDOM('mine', name.trim());
        }
    }
    function changeOtherAvatar() {
        currentEditType = 'otherAvatar';
        document.getElementById('fileInput').click();
    }
    function changeMyAvatar() {
        currentEditType = 'myAvatar';
        document.getElementById('fileInput').click();
    }
    function updateOtherAvatarSize(v) {
        appData.chatSettings.otherAvatarSize = parseInt(v);
        appData.chatSettings.avatarSize = parseInt(v); // 保持兼容
        document.getElementById('otherAvatarSizeVal').textContent = v;
        document.documentElement.style.setProperty('--other-avatar-size', v + 'px');
        document.documentElement.style.setProperty('--avatar-size', v + 'px');
        saveData();
        // 头像尺寸由 CSS 变量驱动，无需全量重渲染
    }
    function updateMyAvatarSize(v) {
        appData.chatSettings.myAvatarSize = parseInt(v);
        document.getElementById('myAvatarSizeVal').textContent = v;
        document.documentElement.style.setProperty('--my-avatar-size', v + 'px');
        saveData();
        // 头像尺寸由 CSS 变量驱动，无需全量重渲染
    }
    /* 气泡设置动态预览：显示3对方+我方气泡，完整反映所有设置 */
    function updateBubbleSettingsPreview() {
        const container = document.getElementById('bubbleSettingsPreview');
        if (!container) return;
        const s = appData.chatSettings;
        const oBase = s.otherBubbleRadius >= 0 ? s.otherBubbleRadius : s.bubbleRadius;
        const mBase = s.myBubbleRadius >= 0 ? s.myBubbleRadius : s.bubbleRadius;
        // 计算每条气泡的圆角值
        function getMsgRadius(sender, msgIdx) {
            // 分条圆角（仅当开启时生效）
            let perMsgR = -1;
            if (s.msgRadiusEnabled) {
                if (sender === 'other') {
                    perMsgR = msgIdx === 0 ? s.otherMsg1Radius : (msgIdx === 1 ? s.otherMsg2Radius : s.otherMsg3Radius);
                } else {
                    perMsgR = msgIdx === 0 ? s.myMsg1Radius : (msgIdx === 1 ? s.myMsg2Radius : s.myMsg3Radius);
                }
            }
            if (perMsgR >= 0) return perMsgR + 'px';
            // 优先级：四角 > 双方圆方 > 通用
            if (sender === 'other') {
                if (s.otherCornersEnabled) {
                    return s.otherTL + 'px ' + s.otherTR + 'px ' + s.otherBR + 'px ' + s.otherBL + 'px';
                }
                if (s.dualBubbleRadiusEnabled && s.otherBubbleRadius >= 0) return s.otherBubbleRadius + 'px';
                return s.bubbleRadius + 'px';
            } else {
                if (s.myCornersEnabled) {
                    return s.myTL + 'px ' + s.myTR + 'px ' + s.myBR + 'px ' + s.myBL + 'px';
                }
                if (s.dualBubbleRadiusEnabled && s.myBubbleRadius >= 0) return s.myBubbleRadius + 'px';
                return s.bubbleRadius + 'px';
            }
        }
        // 已读文本
        function getReadText(sender) {
            let txt = '';
            if (s.showRead) txt += '已读';
            if (s.showDoubleCheck) txt += (s.showRead ? ' ' : '') + '✓✓';
            return txt;
        }
        function buildBubble(sender, msgIdx) {
            const isOther = sender === 'other';
            const bg = isOther ? s.otherBubbleBg : s.myBubbleBg;
            const color = isOther ? s.otherBubbleText : s.myBubbleText;
            const border = isOther ? s.otherBubbleBorder : s.myBubbleBorder;
            const radius = getMsgRadius(sender, msgIdx);
            const padding = isOther ? (s.otherBubblePadding||s.bubblePadding) : (s.myBubblePadding||s.bubblePadding);
            const fontSize = (isOther ? (s.otherBubbleFontSize||s.bubbleFontSize) : (s.myBubbleFontSize||s.bubbleFontSize)) + 'px';
            const _tailOn = s.bubbleTail ? (isOther ? (s.otherTailEnabled !== false) : (s.myTailEnabled !== false)) : false;
            const _firstOnly = isOther ? (s.otherFirstTailOnly) : (s.myFirstTailOnly);
            const tailClass = (_tailOn && (!_firstOnly || msgIdx === 0)) ? (isOther ? 'tail-left' : 'tail-right') : '';
            const readText = getReadText(sender);
            const label = isOther ? '对方气泡' + (msgIdx + 1) : '我方气泡' + (msgIdx + 1);
            // 气泡内部时：行内已读标记。对方「文字内容  已读/双对号」，我方「已读/双对号 文字内容」
            let innerContent = label;
            if (readText && s.readPosition === 'inside') {
                const readSpan = '<span style="color:' + s.readColor + ';font-size:11px;margin:0 4px;white-space:nowrap;line-height:1.2;">' + readText + '</span>';
                innerContent = isOther ? (label + ' ' + readSpan) : (readSpan + ' ' + label);
            }
            const bubbleHtml = '<div class="msg-bubble ' + tailClass + '" style="padding:' + padding + 'px ' + (padding + 4) + 'px;border-radius:' + radius + ';font-size:' + fontSize + ';background:' + bg + ';color:' + color + ';border:1px solid ' + border + ';--tail-color:' + bg + ';--tail-border-color:' + border + ';">' + innerContent + '</div>';
            return bubbleHtml;
        }
        let html = '';
        // 3对方 + 3我方 气泡
        for (let i = 0; i < 3; i++) {
            html += '<div class="msg-row other" style="display:flex;margin-bottom:8px;align-items:flex-start;">';
            html += '<div class="avatar-small"></div>';
            html += '<div class="msg-bubble-wrap" style="max-width:70%;">' + buildBubble('other', i) + '</div>';
            html += '</div>';
        }
        for (let i = 0; i < 3; i++) {
            html += '<div class="msg-row mine" style="display:flex;margin-bottom:8px;align-items:flex-start;justify-content:flex-end;">';
            html += '<div class="msg-bubble-wrap" style="max-width:70%;">' + buildBubble('mine', i) + '</div>';
            html += '<div class="avatar-small"></div>';
            html += '</div>';
        }
        container.innerHTML = html;
    }
    function updateOtherAvatarRadius(v) {
        appData.chatSettings.otherAvatarRadius = parseInt(v);
        appData.chatSettings.avatarRadius = parseInt(v); // 保持兼容
        document.getElementById('otherAvatarRadiusVal').textContent = v;
        document.documentElement.style.setProperty('--other-avatar-radius', v + 'px');
        document.documentElement.style.setProperty('--avatar-radius', v + 'px');
        saveData();
        // 头像圆角由 CSS 变量驱动，无需全量重渲染
    }
    function updateMyAvatarRadius(v) {
        appData.chatSettings.myAvatarRadius = parseInt(v);
        document.getElementById('myAvatarRadiusVal').textContent = v;
        document.documentElement.style.setProperty('--my-avatar-radius', v + 'px');
        saveData();
        // 头像圆角由 CSS 变量驱动，无需全量重渲染
    }
    function selectFrame(type, frame) {
        if (type === 'other') {
            appData.chatSettings.otherFrame = frame;
            document.querySelectorAll('#otherFrameGrid .frame-item').forEach(el => {
                el.classList.toggle('active', el.dataset.frame === frame);
            });
        } else {
            appData.chatSettings.myFrame = frame;
            document.querySelectorAll('#myFrameGrid .frame-item').forEach(el => {
                el.classList.toggle('active', el.dataset.frame === frame);
            });
        }
        saveDataSync();
        updateChatAvatarFrameDOM(type === 'other' ? 'other' : 'mine');
    }
    function uploadFrame(type) { currentEditType = 'frame_preview'; currentEditTarget = type; document.getElementById('fileInput').click(); }
    function showFrameAdjust(type, src) { let m = document.getElementById('frameAdjModal'); if(!m){m=document.createElement('div');m.id='frameAdjModal';m.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;z-index:9999;background:rgba(0,0,0,0.3);';m.innerHTML='<div style="background:#fff;border-radius:16px;padding:20px;width:280px;"><div style="text-align:center;margin-bottom:12px;font-size:15px;">调整头像框</div><div style="display:flex;justify-content:center;margin-bottom:16px;"><div id="frameAdjBox" style="width:60px;height:60px;border-radius:8px;overflow:visible;position:relative;background:#ccc;"><img id="frameAdjAvatar" style="width:100%;height:100%;object-fit:cover;border-radius:8px;position:relative;z-index:1;"><img id="frameAdjFrame" style="position:absolute;top:-15%;left:-15%;width:130%;height:130%;object-fit:fill;pointer-events:none;z-index:2;"></div></div><div style="margin-bottom:8px;font-size:13px;">大小: <input type="range" id="frameSize" min="100" max="200" value="130" oninput="updFAdj()" style="width:55%;"><span id="frameSizeV">130</span>%</div><div style="margin-bottom:8px;font-size:13px;">水平: <input type="range" id="frameOX" min="-20" max="20" value="0" oninput="updFAdj()" style="width:60%;"><span id="frameOXV">0</span>px</div><div style="margin-bottom:16px;font-size:13px;">垂直: <input type="range" id="frameOY" min="-20" max="20" value="0" oninput="updFAdj()" style="width:60%;"><span id="frameOYV">0</span>px</div><div style="display:flex;gap:8px;justify-content:center;"><button onclick="confirmFr()" style="padding:8px 20px;background:#1a1a1a;color:#fff;border:none;border-radius:6px;cursor:pointer;">确认</button><button onclick="cancelFr()" style="padding:8px 20px;background:#f0f0f0;border:1px solid #e0e0e0;border-radius:6px;cursor:pointer;">取消</button></div></div>';document.body.appendChild(m);}m.style.display='flex';document.getElementById('frameAdjAvatar').src=appData.chatSettings[type==='other'?'otherAvatar':'myAvatar']||'';document.getElementById('frameAdjFrame').src=src;document.getElementById('frameOX').value=0;document.getElementById('frameOY').value=0;document.getElementById('frameSize').value=130;document.getElementById('frameOXV').textContent='0';document.getElementById('frameOYV').textContent='0';document.getElementById('frameSizeV').textContent='130';updFAdj();window._pFrT=type;window._pFrS=src;}
    function updFAdj(){const x=document.getElementById('frameOX').value,y=document.getElementById('frameOY').value,sz=document.getElementById('frameSize').value;document.getElementById('frameOXV').textContent=x;document.getElementById('frameOYV').textContent=y;document.getElementById('frameSizeV').textContent=sz;const offset=(sz-100)/2;document.getElementById('frameAdjFrame').style.width=sz+'%';document.getElementById('frameAdjFrame').style.height=sz+'%';document.getElementById('frameAdjFrame').style.top=(-offset)+'%';document.getElementById('frameAdjFrame').style.left=(-offset)+'%';document.getElementById('frameAdjFrame').style.transform='translate('+x+'px,'+y+'px)';}
    function confirmFr(){const t=window._pFrT,s=window._pFrS,id='fr_'+Date.now();const frames=t==='other'?appData.chatSettings.otherFrames:appData.chatSettings.myFrames;frames[id]={src:s,offsetX:parseInt(document.getElementById('frameOX').value),offsetY:parseInt(document.getElementById('frameOY').value),size:parseInt(document.getElementById('frameSize').value)};if(t==='other')appData.chatSettings.otherFrame=id;else appData.chatSettings.myFrame=id;saveData();renderFrames();updateChatAvatarFrameDOM(t);cancelFr();}
    function cancelFr(){const m=document.getElementById('frameAdjModal');if(m)m.style.display='none';}
    function deleteFrame(type,fid){const frames=type==='other'?appData.chatSettings.otherFrames:appData.chatSettings.myFrames;delete frames[fid];if(type==='other'&&appData.chatSettings.otherFrame===fid)appData.chatSettings.otherFrame='none';if(type==='my'&&appData.chatSettings.myFrame===fid)appData.chatSettings.myFrame='none';saveData();renderFrames();updateChatAvatarFrameDOM(type);}
    function applyBubbleRadiusVars(s) {
        // 优先级：四角（独立开关）> 双方圆方（开关）> 通用 bubbleRadius
        // 关闭对应开关时，该项设置不再影响气泡
        let oR, mR;
        // 对方
        if (s.otherCornersEnabled) {
            oR = s.otherTL + 'px ' + s.otherTR + 'px ' + s.otherBR + 'px ' + s.otherBL + 'px';
        } else if (s.dualBubbleRadiusEnabled && s.otherBubbleRadius >= 0) {
            oR = s.otherBubbleRadius + 'px';
        } else {
            oR = s.bubbleRadius + 'px';
        }
        // 我方
        if (s.myCornersEnabled) {
            mR = s.myTL + 'px ' + s.myTR + 'px ' + s.myBR + 'px ' + s.myBL + 'px';
        } else if (s.dualBubbleRadiusEnabled && s.myBubbleRadius >= 0) {
            mR = s.myBubbleRadius + 'px';
        } else {
            mR = s.bubbleRadius + 'px';
        }
        document.documentElement.style.setProperty('--other-bubble-radius', oR);
        document.documentElement.style.setProperty('--my-bubble-radius', mR);
    }
    function applyTransferStyleVars(s) {
        const root = document.documentElement.style;
        root.setProperty('--transfer-bg', s.transferBgColor || '#E8913A');
        root.setProperty('--transfer-text-color', s.transferTextColor || '#fff');
        root.setProperty('--transfer-remark-color', s.transferRemarkColor || 'rgba(255,255,255,0.85)');
        root.setProperty('--transfer-bg-claimed', s.transferBgClaimed || '#999');
        root.setProperty('--transfer-text-color-claimed', s.transferTextClaimed || '#fff');
        root.setProperty('--transfer-remark-color-claimed', s.transferRemarkClaimed || 'rgba(255,255,255,0.85)');
        root.setProperty('--transfer-radius', (s.transferRadius !== undefined ? s.transferRadius : 8) + 'px');
    }
    function resetTransferStyle() {
        const s = appData.chatSettings;
        s.transferBgColor = '#E8913A';
        s.transferTextColor = '#ffffff';
        s.transferRemarkColor = '#ffffff';
        s.transferBgClaimed = '#999999';
        s.transferTextClaimed = '#ffffff';
        s.transferRemarkClaimed = '#ffffff';
        s.transferRadius = 8;
        document.getElementById('transferBgColor').value = '#E8913A';
        document.getElementById('transferTextColor').value = '#ffffff';
        document.getElementById('transferRemarkColor').value = '#ffffff';
        document.getElementById('transferBgClaimed').value = '#999999';
        document.getElementById('transferTextClaimed').value = '#ffffff';
        document.getElementById('transferRemarkClaimed').value = '#ffffff';
        document.getElementById('transferRadius').value = 8;
        document.getElementById('transferRadiusVal').textContent = '8';
        saveData();
        applyTransferStyleVars(s);
        renderMessages();
    }
    // 防抖：滑杆拖动时只在松手后重渲染聊天记录，避免每次 input 都全量重建DOM导致卡顿/崩溃
    let _bubbleRenderTimer = null;
    function _debouncedBubbleRender() {
        if (_bubbleRenderTimer) clearTimeout(_bubbleRenderTimer);
        _bubbleRenderTimer = setTimeout(function () {
            _bubbleRenderTimer = null;
            try { renderMessages(); } catch (e) { console.error('renderMessages失败:', e); }
        }, 180);
    }
    function updateBubbleStyle() {
      try {
        const s = appData.chatSettings;
        s.myBubbleBg = document.getElementById('myBubbleBg').value;
        s.otherBubbleBg = document.getElementById('otherBubbleBg').value;
        s.myBubbleBorder = document.getElementById('myBubbleBorder').value;
        s.otherBubbleBorder = document.getElementById('otherBubbleBorder').value;
        s.myBubbleText = document.getElementById('myBubbleText').value;
        s.otherBubbleText = document.getElementById('otherBubbleText').value;
        s.bubbleRadius = parseInt(document.getElementById('bubbleRadius').value);
        s.otherBubbleFontSize = parseInt(document.getElementById('otherBubbleFontSize').value);
        s.myBubbleFontSize = parseInt(document.getElementById('myBubbleFontSize').value);
        s.bubbleFontSize = s.otherBubbleFontSize; // 保持兼容
        s.otherBubblePadding = parseInt(document.getElementById('otherBubblePadding').value);
        s.myBubblePadding = parseInt(document.getElementById('myBubblePadding').value);
        s.bubblePadding = s.otherBubblePadding; // 保持兼容
        s.bubbleTail = document.getElementById('bubbleTail').checked;
        // 小尾巴细分控制
        s.otherTailEnabled = document.getElementById('otherTailEnabled').checked;
        s.myTailEnabled = document.getElementById('myTailEnabled').checked;
        s.otherFirstTailOnly = document.getElementById('otherFirstTailOnly').checked;
        s.myFirstTailOnly = document.getElementById('myFirstTailOnly').checked;
        // 圆角进阶
        s.dualBubbleRadiusEnabled = document.getElementById('dualBubbleRadiusEnabled').checked;
        // 当 slider 值等于 bubbleRadius 时存 -1（沿用上方），否则存实际值
        const oBRSVal = parseInt(document.getElementById('otherBubbleRadius').value);
        s.otherBubbleRadius = (oBRSVal === s.bubbleRadius) ? -1 : oBRSVal;
        const mBRSVal = parseInt(document.getElementById('myBubbleRadius').value);
        s.myBubbleRadius = (mBRSVal === s.bubbleRadius) ? -1 : mBRSVal;
        // 对方四角
        s.otherCornersEnabled = document.getElementById('otherCornersEnabled').checked;
        s.otherTL = parseInt(document.getElementById('otherTL').value);
        s.otherTR = parseInt(document.getElementById('otherTR').value);
        s.otherBR = parseInt(document.getElementById('otherBR').value);
        s.otherBL = parseInt(document.getElementById('otherBL').value);
        // 我方四角
        s.myCornersEnabled = document.getElementById('myCornersEnabled').checked;
        s.myTL = parseInt(document.getElementById('myTL').value);
        s.myTR = parseInt(document.getElementById('myTR').value);
        s.myBR = parseInt(document.getElementById('myBR').value);
        s.myBL = parseInt(document.getElementById('myBL').value);
        // 昵称
        s.showNicknames = document.getElementById('showNicknames').checked;
        s.otherNicknameSize = parseInt(document.getElementById('otherNicknameSize').value);
        s.myNicknameSize = parseInt(document.getElementById('myNicknameSize').value);
        s.otherNicknameColor = document.getElementById('otherNicknameColor').value;
        s.myNicknameColor = document.getElementById('myNicknameColor').value;
        // 已读与双对号
        s.showRead = document.getElementById('showRead').checked;
        s.showDoubleCheck = document.getElementById('showDoubleCheck').checked;
        s.readPosition = document.getElementById('readPosition').value;
        s.onlyLastRead = document.getElementById('onlyLastRead').checked;
        s.onlyFirstRead = document.getElementById('onlyFirstRead').checked;
        s.readColor = document.getElementById('readColor').value;
        // 分条圆角：当 slider 值等于对应方圆角时存 -1（沿用），否则存实际值
        s.msgRadiusEnabled = document.getElementById('msgRadiusEnabled').checked;
        const omR = s.otherBubbleRadius >= 0 ? s.otherBubbleRadius : s.bubbleRadius;
        const mmR = s.myBubbleRadius >= 0 ? s.myBubbleRadius : s.bubbleRadius;
        // 修复：在读取分条滑块值前，先将存储值为 -1（沿用基础圆角）的滑块显示同步为新的基础圆角值，
        // 否则当用户调节基础圆角时，旧滑块显示值会与新的 omR/mmR 不匹配，导致 -1 被错误地存为旧值，
        // 进而用 inline style 覆盖掉新的基础圆角，使气泡看起来无变化。
        if (s.otherMsg1Radius === -1) document.getElementById('otherMsg1Radius').value = omR;
        if (s.otherMsg2Radius === -1) document.getElementById('otherMsg2Radius').value = omR;
        if (s.otherMsg3Radius === -1) document.getElementById('otherMsg3Radius').value = omR;
        if (s.myMsg1Radius === -1) document.getElementById('myMsg1Radius').value = mmR;
        if (s.myMsg2Radius === -1) document.getElementById('myMsg2Radius').value = mmR;
        if (s.myMsg3Radius === -1) document.getElementById('myMsg3Radius').value = mmR;
        s.otherMsg1Radius = (parseInt(document.getElementById('otherMsg1Radius').value) === omR) ? -1 : parseInt(document.getElementById('otherMsg1Radius').value);
        s.otherMsg2Radius = (parseInt(document.getElementById('otherMsg2Radius').value) === omR) ? -1 : parseInt(document.getElementById('otherMsg2Radius').value);
        s.otherMsg3Radius = (parseInt(document.getElementById('otherMsg3Radius').value) === omR) ? -1 : parseInt(document.getElementById('otherMsg3Radius').value);
        s.myMsg1Radius = (parseInt(document.getElementById('myMsg1Radius').value) === mmR) ? -1 : parseInt(document.getElementById('myMsg1Radius').value);
        s.myMsg2Radius = (parseInt(document.getElementById('myMsg2Radius').value) === mmR) ? -1 : parseInt(document.getElementById('myMsg2Radius').value);
        s.myMsg3Radius = (parseInt(document.getElementById('myMsg3Radius').value) === mmR) ? -1 : parseInt(document.getElementById('myMsg3Radius').value);
        // 分条四角圆方（新增）
        s.msgCornersEnabled = document.getElementById('msgCornersEnabled').checked;
        s.otherMsg1TL = parseInt(document.getElementById('otherMsg1TL').value);
        s.otherMsg1TR = parseInt(document.getElementById('otherMsg1TR').value);
        s.otherMsg1BR = parseInt(document.getElementById('otherMsg1BR').value);
        s.otherMsg1BL = parseInt(document.getElementById('otherMsg1BL').value);
        s.otherMsg2TL = parseInt(document.getElementById('otherMsg2TL').value);
        s.otherMsg2TR = parseInt(document.getElementById('otherMsg2TR').value);
        s.otherMsg2BR = parseInt(document.getElementById('otherMsg2BR').value);
        s.otherMsg2BL = parseInt(document.getElementById('otherMsg2BL').value);
        s.otherMsg3TL = parseInt(document.getElementById('otherMsg3TL').value);
        s.otherMsg3TR = parseInt(document.getElementById('otherMsg3TR').value);
        s.otherMsg3BR = parseInt(document.getElementById('otherMsg3BR').value);
        s.otherMsg3BL = parseInt(document.getElementById('otherMsg3BL').value);
        s.myMsg1TL = parseInt(document.getElementById('myMsg1TL').value);
        s.myMsg1TR = parseInt(document.getElementById('myMsg1TR').value);
        s.myMsg1BR = parseInt(document.getElementById('myMsg1BR').value);
        s.myMsg1BL = parseInt(document.getElementById('myMsg1BL').value);
        s.myMsg2TL = parseInt(document.getElementById('myMsg2TL').value);
        s.myMsg2TR = parseInt(document.getElementById('myMsg2TR').value);
        s.myMsg2BR = parseInt(document.getElementById('myMsg2BR').value);
        s.myMsg2BL = parseInt(document.getElementById('myMsg2BL').value);
        s.myMsg3TL = parseInt(document.getElementById('myMsg3TL').value);
        s.myMsg3TR = parseInt(document.getElementById('myMsg3TR').value);
        s.myMsg3BR = parseInt(document.getElementById('myMsg3BR').value);
        s.myMsg3BL = parseInt(document.getElementById('myMsg3BL').value);
        // 分条气泡颜色（新增）
        s.msgColorEnabled = document.getElementById('msgColorEnabled').checked;
        s.otherMsg1Bg = document.getElementById('otherMsg1Bg').value;
        s.otherMsg2Bg = document.getElementById('otherMsg2Bg').value;
        s.otherMsg3Bg = document.getElementById('otherMsg3Bg').value;
        s.myMsg1Bg = document.getElementById('myMsg1Bg').value;
        s.myMsg2Bg = document.getElementById('myMsg2Bg').value;
        s.myMsg3Bg = document.getElementById('myMsg3Bg').value;
        // 分条气泡边框色（新增）
        s.msgBorderEnabled = document.getElementById('msgBorderEnabled').checked;
        s.otherMsg1Border = document.getElementById('otherMsg1Border').value;
        s.otherMsg2Border = document.getElementById('otherMsg2Border').value;
        s.otherMsg3Border = document.getElementById('otherMsg3Border').value;
        s.myMsg1Border = document.getElementById('myMsg1Border').value;
        s.myMsg2Border = document.getElementById('myMsg2Border').value;
        s.myMsg3Border = document.getElementById('myMsg3Border').value;
        // 分条气泡大小（新增）
        s.msgSizeEnabled = document.getElementById('msgSizeEnabled').checked;
        s.otherMsg1Size = parseInt(document.getElementById('otherMsg1Size').value);
        s.otherMsg2Size = parseInt(document.getElementById('otherMsg2Size').value);
        s.otherMsg3Size = parseInt(document.getElementById('otherMsg3Size').value);
        s.myMsg1Size = parseInt(document.getElementById('myMsg1Size').value);
        s.myMsg2Size = parseInt(document.getElementById('myMsg2Size').value);
        s.myMsg3Size = parseInt(document.getElementById('myMsg3Size').value);
        // 分条气泡字体大小（新增）
        s.msgFontEnabled = document.getElementById('msgFontEnabled').checked;
        s.otherMsg1Font = parseInt(document.getElementById('otherMsg1Font').value);
        s.otherMsg2Font = parseInt(document.getElementById('otherMsg2Font').value);
        s.otherMsg3Font = parseInt(document.getElementById('otherMsg3Font').value);
        s.myMsg1Font = parseInt(document.getElementById('myMsg1Font').value);
        s.myMsg2Font = parseInt(document.getElementById('myMsg2Font').value);
        s.myMsg3Font = parseInt(document.getElementById('myMsg3Font').value);
        // 转账样式
        s.transferBgColor = document.getElementById('transferBgColor').value;
        s.transferTextColor = document.getElementById('transferTextColor').value;
        s.transferRemarkColor = document.getElementById('transferRemarkColor').value;
        s.transferBgClaimed = document.getElementById('transferBgClaimed').value;
        s.transferTextClaimed = document.getElementById('transferTextClaimed').value;
        s.transferRemarkClaimed = document.getElementById('transferRemarkClaimed').value;
        s.transferRadius = parseInt(document.getElementById('transferRadius').value);
        
        document.documentElement.style.setProperty('--bubble-radius', s.bubbleRadius + 'px');
        document.documentElement.style.setProperty('--bubble-font-size', s.bubbleFontSize + 'px');
        document.documentElement.style.setProperty('--bubble-padding', s.bubblePadding + 'px');
        document.documentElement.style.setProperty('--other-bubble-font-size', s.otherBubbleFontSize + 'px');
        document.documentElement.style.setProperty('--my-bubble-font-size', s.myBubbleFontSize + 'px');
        document.documentElement.style.setProperty('--other-bubble-padding', s.otherBubblePadding + 'px');
        document.documentElement.style.setProperty('--my-bubble-padding', s.myBubblePadding + 'px');
        document.documentElement.style.setProperty('--my-bubble-bg', s.myBubbleBg);
        document.documentElement.style.setProperty('--my-bubble-text', s.myBubbleText);
        document.documentElement.style.setProperty('--my-bubble-border', s.myBubbleBorder);
        document.documentElement.style.setProperty('--other-bubble-bg', s.otherBubbleBg);
        document.documentElement.style.setProperty('--other-bubble-text', s.otherBubbleText);
        document.documentElement.style.setProperty('--other-bubble-border', s.otherBubbleBorder);
        applyBubbleRadiusVars(s);
        // 应用转账样式CSS变量
        applyTransferStyleVars(s);
        const _dbr2 = document.getElementById('dualBubbleRadiusGrid');
        if (_dbr2) _dbr2.style.display = s.dualBubbleRadiusEnabled ? 'grid' : 'none';
        const _ocg2 = document.getElementById('otherCornersGrid');
        if (_ocg2) _ocg2.style.display = s.otherCornersEnabled ? 'grid' : 'none';
        const _mcg2 = document.getElementById('myCornersGrid');
        if (_mcg2) _mcg2.style.display = s.myCornersEnabled ? 'grid' : 'none';
        const _mrg2 = document.getElementById('msgRadiusGrid');
        if (_mrg2) _mrg2.style.display = s.msgRadiusEnabled ? 'grid' : 'none';
        // 新增：分条四角圆方与分条气泡颜色的显隐
        const _mcg3 = document.getElementById('msgCornersGrid');
        if (_mcg3) _mcg3.style.display = s.msgCornersEnabled ? 'block' : 'none';
        const _mclr = document.getElementById('msgColorGrid');
        if (_mclr) _mclr.style.display = s.msgColorEnabled ? 'grid' : 'none';
        // 新增：分条边框色、大小、字体大小 的显隐
        const _mbg = document.getElementById('msgBorderGrid');
        if (_mbg) _mbg.style.display = s.msgBorderEnabled ? 'grid' : 'none';
        const _msg = document.getElementById('msgSizeGrid');
        if (_msg) _msg.style.display = s.msgSizeEnabled ? 'grid' : 'none';
        const _mfg = document.getElementById('msgFontGrid');
        if (_mfg) _mfg.style.display = s.msgFontEnabled ? 'grid' : 'none';
        const oVal = document.getElementById('otherBubbleRadiusVal');
        if (oVal) oVal.textContent = (s.otherBubbleRadius >= 0 ? s.otherBubbleRadius : s.bubbleRadius) + ' px';
        const mVal = document.getElementById('myBubbleRadiusVal');
        if (mVal) mVal.textContent = (s.myBubbleRadius >= 0 ? s.myBubbleRadius : s.bubbleRadius) + ' px';
        
        saveData();
        _debouncedBubbleRender();
        // 更新气泡设置预览
        try { updateBubbleSettingsPreview(); } catch (e) { console.error('预览更新失败:', e); }
      } catch (e) { console.error('updateBubbleStyle失败:', e); }
    }
    // ===== 气泡字体上传 =====
    function uploadBubbleFont() {
        document.getElementById('bubbleFontInput').click();
    }
    function handleBubbleFontUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        try {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const fontData = ev.target.result;
            const fontName = 'BubbleCustomFont_' + Date.now();
            // 使用统一的 @font-face 加载方式（兼容 ttf/otf）
            applyFontFace('bubbleFontStyle', fontName, fontData);
            // 应用到气泡
            document.documentElement.style.setProperty('--bubble-font-family', fontName);
            appData.chatSettings.bubbleFont = fontData;
            appData.chatSettings.bubbleFontName = fontName;
            saveData();
            const nameEl = document.getElementById('bubbleFontName');
            if (nameEl) nameEl.textContent = '当前字体: ' + file.name;
            renderMessages();
            updateBubbleSettingsPreview();
            alert('气泡字体上传成功！');
        };
        reader.onerror = function() {
            alert('字体文件读取失败，请重试');
        };
        reader.readAsDataURL(file);
        event.target.value = '';
        } catch(e) { console.error('handleFontUpload error:', e); alert('字体上传失败'); event.target.value = ''; }
    }
    function resetBubbleFont() {
        const oldStyle = document.getElementById('bubbleFontStyle');
        if (oldStyle) oldStyle.remove();
        document.documentElement.style.removeProperty('--bubble-font-family');
        appData.chatSettings.bubbleFont = '';
        appData.chatSettings.bubbleFontName = '';
        saveData();
        const nameEl = document.getElementById('bubbleFontName');
        if (nameEl) nameEl.textContent = '';
        renderMessages();
        updateBubbleSettingsPreview();
    }
    function applyBubbleFont() {
        const fontData = appData.chatSettings.bubbleFont;
        if (fontData) {
            const fontName = appData.chatSettings.bubbleFontName || 'BubbleCustomFont_Loaded';
            applyFontFace('bubbleFontStyle', fontName, fontData);
            document.documentElement.style.setProperty('--bubble-font-family', fontName);
            // 更新字体名称显示
            const nameEl = document.getElementById('bubbleFontName');
            if (nameEl && !nameEl.textContent) nameEl.textContent = '已加载自定义气泡字体';
        }
    }
    function updateDisplaySettings() {
      try {
        const s = appData.chatSettings;
        s.otherAvatarPosition = document.getElementById('otherAvatarPosition').value;
        s.myAvatarPosition = document.getElementById('myAvatarPosition').value;
        s.avatarPosition = s.otherAvatarPosition; // 保持兼容
        s.hideAvatar = document.getElementById('hideAvatar').checked;
        s.hideMyAvatar = document.getElementById('hideMyAvatar').checked;
        s.hideOtherAvatar = document.getElementById('hideOtherAvatar').checked;
        s.onlyFirstAvatar = document.getElementById('onlyFirstAvatar').checked;
        s.onlyLastAvatar = document.getElementById('onlyLastAvatar').checked;
        // 新增：分方头像显示控制
        s.onlyOtherFirstAvatar = document.getElementById('onlyOtherFirstAvatar').checked;
        s.onlyMyFirstAvatar = document.getElementById('onlyMyFirstAvatar').checked;
        s.onlyOtherLastAvatar = document.getElementById('onlyOtherLastAvatar').checked;
        s.onlyMyLastAvatar = document.getElementById('onlyMyLastAvatar').checked;
        saveData();
        _debouncedBubbleRender();
      } catch (e) { console.error('updateDisplaySettings失败:', e); }
    }
    function changeChatWallpaper() {
        currentEditType = 'chatWallpaper';
        document.getElementById('fileInput').click();
    }
    function resetChatWallpaper() {
        appData.chatSettings.chatWallpaper = '';
        document.querySelector('.chat-messages').style.backgroundImage = '';
        const chatPage = document.getElementById('chatPage');
        if (chatPage) { chatPage.style.backgroundImage = ''; }
        saveData();
    }
    function updateTopBgColor() {
        const color = document.getElementById('topBgColor').value;
        appData.chatSettings.topBgColor = color;
        document.querySelector('.chat-header').style.backgroundColor = color;
        saveData();
    }
    function updateBottomBgColor() {
        const color = document.getElementById('bottomBgColor').value;
        appData.chatSettings.bottomBgColor = color;
        document.querySelector('.chat-footer').style.backgroundColor = color;
        document.querySelector('.emoji-panel').style.backgroundColor = color;
        document.querySelector('.plus-panel').style.backgroundColor = color;
        saveData();
    }
    function resetTopBgColor(){appData.chatSettings.topBgColor='#f0f0f0';document.getElementById('topBgColor').value='#f0f0f0';document.querySelector('.chat-header').style.backgroundColor='#f0f0f0';saveData();}
    function resetBottomBgColor(){appData.chatSettings.bottomBgColor='#f0f0f0';document.getElementById('bottomBgColor').value='#f0f0f0';document.querySelector('.chat-footer').style.backgroundColor='#f0f0f0';document.querySelector('.emoji-panel').style.backgroundColor='#f0f0f0';document.querySelector('.plus-panel').style.backgroundColor='#f0f0f0';saveData();}
    function uploadTopBgImage(){currentEditType='topBgImage';document.getElementById('fileInput').click();}
    function resetTopBgImage(){appData.chatSettings.topBgImage='';document.querySelector('.chat-header').style.backgroundImage='';saveData();}
    function uploadBottomBgImage(){currentEditType='bottomBgImage';document.getElementById('fileInput').click();}
    function resetBottomBgImage(){appData.chatSettings.bottomBgImage='';document.querySelector('.chat-footer').style.backgroundImage='';saveData();}
    function customizeIcon(name) {
        currentEditType = 'customIcon';
        currentEditTarget = name;
        document.getElementById('fileInput').click();
    }
    function refreshCustomIcons() {
        renderDefaultIcons();
        const icons = appData.chatSettings.customIcons || {};
        // 更新聊天底部按钮
        document.querySelectorAll('.chat-btn').forEach(btn => {
            const iconKey = btn.dataset.icon;
            if(iconKey && icons[iconKey]) {
                btn.innerHTML = '<img src="'+icons[iconKey]+'" style="width:22px;height:22px;object-fit:contain;">';
            }
        });
        document.querySelectorAll('.chat-btn[data-icon="back"]').forEach(btn => {
            if(icons.back) btn.innerHTML = '<img src="'+icons.back+'" style="width:24px;height:24px;object-fit:contain;">';
        });
        document.querySelectorAll('.page-menu').forEach(btn => {
            if(icons.menu) btn.innerHTML = '<img src="'+icons.menu+'" style="width:20px;height:20px;object-fit:contain;">';
        });
        // 更新收纳区域(plus-panel)图标
        document.querySelectorAll('.plus-item').forEach(item => {
            const iconKey = item.dataset.icon;
            if(iconKey && icons[iconKey]) {
                var iconBox = item.querySelector('.plus-icon');
                if(iconBox) iconBox.innerHTML = '<img src="'+icons[iconKey]+'" style="width:24px;height:24px;object-fit:contain;">';
            }
        });
        // 更新设置页面图标预览
        document.querySelectorAll('.icon-item').forEach(item => {
            const iconKey = item.dataset.icon;
            if(iconKey && icons[iconKey]) {
                var span = item.querySelector('span');
                var spanText = span ? span.textContent : '';
                item.innerHTML = '<img src="'+icons[iconKey]+'" style="width:22px;height:22px;object-fit:contain;"><span>'+spanText+'</span>';
            }
        });
        applyCustomIconColor();
    }
    function resetAllCustomIcons() { appData.chatSettings.customIcons = {}; saveData(); refreshCustomIcons(); renderDefaultIcons(); }
    function renderDefaultIcons() {
        // Restore default SVG icons for chat buttons
        const defaultIcons = {
            'plus': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
            'receive': '<svg viewBox="0 0 24 24"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
            'back': '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>',
            'menu': '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>',
            'video': '<svg viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
            'image': '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
            'emoji': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
            'nudge': '<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7 3 9 3 14h6c0-5 3-7 3-14z"/><line x1="12" y1="2" x2="12" y2="3"/></svg>',
            'blindCard': '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" ry="3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 9l2 2-2 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="12" r="1" fill="currentColor"/><circle cx="16" cy="12" r="1" fill="currentColor"/></svg>',
            'transfer': '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="12" y1="10" x2="12" y2="14"/><path d="M8 12h8"/></svg>',
            'randomFood': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M2 11h20"/><path d="M12 7V4"/><path d="M8 5h8"/></svg>'
        };
        const color = appData.chatSettings.customIconColor || '#999999';
        const icons = appData.chatSettings.customIcons || {};
        // 恢复聊天底部按钮默认SVG
        document.querySelectorAll('.chat-btn').forEach(btn => {
            const key = btn.dataset.icon;
            if (key && defaultIcons[key] && !icons[key]) {
                const svg = defaultIcons[key].replace('<svg', '<svg style="stroke:'+color+'"');
                btn.innerHTML = svg;
            }
        });
        document.querySelectorAll('.page-menu').forEach(btn => {
            if(!icons.menu) btn.innerHTML = '<svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:'+color+';fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>';
        });
        // 恢复收纳区域(plus-panel)图标默认SVG
        document.querySelectorAll('.plus-item').forEach(item => {
            const key = item.dataset.icon;
            if (key && defaultIcons[key] && !icons[key]) {
                var iconBox = item.querySelector('.plus-icon');
                if(iconBox) iconBox.innerHTML = defaultIcons[key].replace('<svg', '<svg style="stroke:'+color+'"');
            }
        });
        // 恢复设置页面图标预览默认SVG
        document.querySelectorAll('.icon-item').forEach(item => {
            const key = item.dataset.icon;
            if (key && defaultIcons[key] && !icons[key]) {
                var span = item.querySelector('span');
                var spanText = span ? span.textContent : '';
                var svgHtml = defaultIcons[key];
                if(key === 'blindCard' || key === 'randomFood') {
                    svgHtml = svgHtml.replace('<svg', '<svg style="color:'+color+'"');
                } else {
                    svgHtml = svgHtml.replace('<svg', '<svg style="stroke:'+color+'"');
                }
                item.innerHTML = svgHtml + '<span>'+spanText+'</span>';
            }
        });
        // 聊天界面的返回键和菜单键也受图标颜色影响
        document.querySelectorAll('.chat-back').forEach(el => { if(!icons.back) el.style.color = color; });
        document.querySelectorAll('.chat-menu').forEach(el => { if(!icons.menu) el.style.color = color; });
    }
    function updateCustomIconColor(color) {
        appData.chatSettings.customIconColor = color;
        saveData();
        applyCustomIconColor();
    }
    function resetCustomIconColor() {
        appData.chatSettings.customIconColor = '#999999';
        document.getElementById('customIconColor').value = '#999999';
        saveData();
        applyCustomIconColor();
    }
    function applyCustomIconColor() {
        const color = appData.chatSettings.customIconColor || '#999999';
        const icons = appData.chatSettings.customIcons || {};
        // 聊天底部按钮
        document.querySelectorAll('.chat-btn').forEach(btn => {
            const key = btn.dataset.icon;
            if (key && !icons[key]) {
                btn.querySelectorAll('svg').forEach(svg => { svg.style.stroke = color; });
            }
        });
        document.querySelectorAll('.page-menu').forEach(btn => {
            if (!icons.menu) {
                btn.querySelectorAll('svg').forEach(svg => { svg.style.stroke = color; });
            }
        });
        // 收纳区域(plus-panel)图标也受颜色影响
        document.querySelectorAll('.plus-item').forEach(item => {
            const key = item.dataset.icon;
            if (key && !icons[key]) {
                item.querySelectorAll('svg').forEach(svg => {
                    svg.style.stroke = color;
                    svg.style.color = color;
                });
            }
        });
        // 设置页面图标预览也受颜色影响
        document.querySelectorAll('.icon-item').forEach(item => {
            const key = item.dataset.icon;
            if (key && !icons[key]) {
                item.querySelectorAll('svg').forEach(svg => {
                    svg.style.stroke = color;
                    svg.style.color = color;
                });
            }
        });
        // 聊天界面的返回键和菜单键也受图标颜色影响
        document.querySelectorAll('.chat-back').forEach(el => {
            if (!icons.back) {
                el.style.color = color;
            }
        });
        document.querySelectorAll('.chat-menu').forEach(el => {
            if (!icons.menu) {
                el.style.color = color;
            }
        });
    }

    // ===== 字卡联系人范围管理 =====
    let _notifTimer = null;
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

    // ===== 词云与消息条数统计 =====
    // 停用词表（高频无意义词，统计时忽略）
    const WORD_CLOUD_STOPWORDS = new Set([
        '的','了','是','我','你','他','她','它','们','在','也','都','就','还','又','把','被','让','给','和','与','或','但','而','则','啊','呀','哦','嗯','嘛','吧','呢','啦','哈','嘿','哎','哟','哇',
        '这','那','这个','那个','这些','那些','什么','怎么','为什么','哪里','哪儿','谁','哪','吗','呢','吧','啊','哦','呀',
        '一个','一些','一种','一样','一直','一定','只是','只有','只要','已经','还是','或者','因为','所以','如果','虽然','但是','然后','不过','其实','真的','真的吗','可以','可能','应该','觉得','感觉',
        '现在','今天','明天','昨天','以后','以前','刚才','马上','然后','一下','一直','一定','也许','大概','而且','然后','没有','不是','不会','不能','不要','不用','不用了','不行','没事','没关系',
        '很','非常','太','最','更','再','也','又','还','只','才','就','都','已','曾','将','要','想','说','看','听','做','吃','喝','玩','走','来','去','到','给','对','向','从','跟','和','与','为','按','照','据','依',
        '有','无','没','非','未','别','莫','勿','休','',' ','the','a','an','is','are','was','were','be','been','to','of','in','on','at','and','or','but','if','for','with','i','you','he','she','it','we','they','me','him','her','us','them','my','your','his','its','our','their','this','that','these','those','do','does','did','have','has','had','will','would','can','could','should','no','not','yes','ok','okay'
    ]);

    // 分词：中英文混合简单分词
    function tokenizeText(text) {
        if (!text || typeof text !== 'string') return [];
        text = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ');
        const tokens = [];
        // 英文/数字单词
        const enParts = text.match(/[a-zA-Z0-9]+/g) || [];
        enParts.forEach(w => {
            const lw = w.toLowerCase();
            if (lw.length > 1 && !WORD_CLOUD_STOPWORDS.has(lw)) tokens.push(lw);
        });
        // 中文：移除英文数字后，按 2-3 字滑窗提取候选词
        const cnText = text.replace(/[a-zA-Z0-9]+/g, ' ').replace(/\s+/g, '');
        for (let i = 0; i < cnText.length; i++) {
            // 2-gram
            if (i + 2 <= cnText.length) {
                const g2 = cnText.substring(i, i + 2);
                if (!WORD_CLOUD_STOPWORDS.has(g2)) tokens.push(g2);
            }
            // 3-gram
            if (i + 3 <= cnText.length) {
                const g3 = cnText.substring(i, i + 3);
                if (!WORD_CLOUD_STOPWORDS.has(g3)) tokens.push(g3);
            }
        }
        return tokens;
    }

    function renderWordCloudStats() {
        const container = document.getElementById('wordCloudStats');
        if (!container) return;
        // 收集对方发送的所有文本消息（字卡内容）
        // 使用 _actualChatHistory 而非 appData.chatHistory（getter 在 _activeContactId 非空时会重定向到联系人记录）
        var otherMessages = [];
        try {
            var mainHistory = (typeof _actualChatHistory !== 'undefined') ? _actualChatHistory : (appData.chatHistory || []);
            (mainHistory || []).forEach(function(m) {
                if (m && m.sender === 'other' && m.content) {
                    otherMessages.push(String(m.content));
                }
            });
        } catch(e) {}
        // 也收集联系人聊天中的对方消息
        try {
            var contacts = (appData.contactList && appData.contactList.contacts) || [];
            contacts.forEach(function(c) {
                try { (c.chatHistory || []).forEach(function(m) {
                    if (m && m.sender === 'other' && m.content) otherMessages.push(String(m.content));
                }); } catch(e) {}
            });
        } catch(e) {}
        
        if (otherMessages.length === 0) {
            container.innerHTML = '<div class="word-cloud-empty">暂无对方发送的消息</div>';
            return;
        }
        
        // 统计每条消息出现的次数（按完整消息内容计数，即字卡频率）
        var freq = {};
        otherMessages.forEach(function(text) {
            var t = text.trim();
            if (t) freq[t] = (freq[t] || 0) + 1;
        });
        
        // 按频次排序
        var sorted = Object.entries(freq)
            .sort(function(a, b) { return b[1] - a[1]; })
            .slice(0, 20);
        
        if (sorted.length === 0) {
            container.innerHTML = '<div class="word-cloud-empty">暂无数据</div>';
            return;
        }
        
        var html = '';
        // 显示最爱字卡
        if (sorted[0]) {
            html += '<div style="background:linear-gradient(135deg,#f0f7ff,#ffffff);border:1.5px solid #c8ddf0;border-radius:12px;padding:16px;text-align:center;">';
            html += '<div style="font-size:13px;color:#7baad8;margin-bottom:6px;">★ 对方最爱发送的字卡</div>';
            html += '<div style="font-size:16px;font-weight:600;color:#2c3e50;">' + escapeHtml(sorted[0][0]) + '</div>';
            html += '<div style="font-size:12px;color:#999;margin-top:4px;">共发送 ' + sorted[0][1] + ' 次</div>';
            html += '</div>';
        }
        
        container.innerHTML = html;
        
        // 渲染频率排行到独立容器
        var rankContainer = document.getElementById('wordFreqRank');
        if (rankContainer) {
            var rankHtml = '';
            if (sorted.length > 1) {
                rankHtml += '<div style="display:flex;flex-direction:column;gap:6px;">';
                sorted.slice(1).forEach(function(item, idx) {
                    var rank = idx + 2;
                    rankHtml += '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(0,0,0,0.03);border-radius:8px;">';
                    rankHtml += '<span style="font-size:12px;color:#999;min-width:20px;">' + rank + '</span>';
                    rankHtml += '<span style="flex:1;font-size:13px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(item[0]) + '</span>';
                    rankHtml += '<span style="font-size:11px;color:#999;">' + item[1] + '次</span>';
                    rankHtml += '</div>';
                });
                rankHtml += '</div>';
            } else {
                rankHtml = '<div class="word-cloud-empty">暂无排行数据</div>';
            }
            rankContainer.innerHTML = rankHtml;
        }
    }
    function renderWordFreqRank() {
        // 频率排行已由 renderWordCloudStats 内部统一渲染到 #wordFreqRank 容器
        // 如果 wordCloudStats 尚未渲染，则补充渲染一次
        var rankContainer = document.getElementById('wordFreqRank');
        if (rankContainer && !rankContainer.innerHTML.trim()) {
            renderWordCloudStats();
        }
    }

    function renderMessageCountStats() {
        const container = document.getElementById('messageCountStats');
        if (!container) return;
        // Bug21修复（订正）：统计全部联系人的消息之和（主聊天 + 各联系人专属记录）
        let mineCount = 0, otherCount = 0;
        var _seenMsgIds = {};
        function _countMsg(m) {
            if (!m || _seenMsgIds[m.id]) return;
            _seenMsgIds[m.id] = true;
            if (m.sender === 'mine') mineCount++;
            else if (m.sender === 'other') otherCount++;
        }
        // 主聊天记录
        try { (_actualChatHistory || []).forEach(_countMsg); } catch(e) {}
        // 各联系人专属聊天记录
        try {
            var contacts = (appData.contactList && appData.contactList.contacts) || [];
            contacts.forEach(function(c){
                if (c && Array.isArray(c.chatHistory)) c.chatHistory.forEach(_countMsg);
            });
        } catch(e) {}
        const s = appData.chatSettings || {};
        const myName = s.myNickname || '我';
        const otherName = s.otherNickname || '对方';
        const total = mineCount + otherCount;
        container.innerHTML = '';
        const rows = [
            { name: '全部联系人 · ' + otherName + ' 发送', count: otherCount },
            { name: '全部联系人 · ' + myName + ' 发送', count: mineCount }
        ];
        rows.forEach(r => {
            const row = document.createElement('div');
            row.className = 'msg-count-row';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'msg-count-name';
            nameSpan.textContent = r.name;
            const valSpan = document.createElement('span');
            valSpan.className = 'msg-count-val';
            valSpan.textContent = r.count + ' 条';
            row.appendChild(nameSpan);
            row.appendChild(valSpan);
            container.appendChild(row);
        });
        // 合计行
        const totalRow = document.createElement('div');
        totalRow.className = 'msg-count-row';
        totalRow.style.borderTop = '2px solid #e0e0e0';
        totalRow.style.marginTop = '4px';
        totalRow.style.paddingTop = '14px';
        const totalName = document.createElement('span');
        totalName.className = 'msg-count-name';
        totalName.textContent = '合计';
        const totalVal = document.createElement('span');
        totalVal.className = 'msg-count-val';
        totalVal.textContent = total + ' 条';
        totalRow.appendChild(totalName);
        totalRow.appendChild(totalVal);
        container.appendChild(totalRow);
        if (total === 0) {
            container.innerHTML = '<div class="word-cloud-empty">暂无聊天消息</div>';
        }
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
    let _proactiveTimer = null;
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

    // ===== 聊天页键盘自适应 =====
    var resetChatKeyboard = null; // 全局引用，供 initChatPage 等调用
    (function initChatKeyboard() {
        const chatPage = document.getElementById('chatPage');
        if (!chatPage) return;
        let inputFocused = false;
        let pollTimer = null;
        let lastAppliedKH = 0; // 上次应用的键盘高度，用于稳定性检测
        let cachedLayoutH = 0; // 缓存布局视口高度（键盘未打开时的全屏高度）
        let applyTimer = null; // 防抖定时器
        /* 缓存布局视口高度：仅在键盘未打开时更新，避免 Android 浏览器
           在键盘弹出时缩小 innerHeight 导致计算错误。
           Bug3修复：iOS 上 innerHeight 也会随键盘缩小，改用 visualViewport
           与已缓存高度比较，仅在视口接近全屏时更新 */
        function updateCachedLayoutH() {
            const vv = window.visualViewport;
            if (!vv) { cachedLayoutH = window.innerHeight; return; }
            // 仅当 visualViewport 高度接近已缓存的全屏高度时才更新（键盘未打开）
            if (cachedLayoutH === 0 || vv.height > cachedLayoutH * 0.85) {
                cachedLayoutH = Math.max(window.innerHeight, document.documentElement.clientHeight || 0);
            }
        }
        updateCachedLayoutH();
        // 初始缓存
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', updateCachedLayoutH);
        }
        window.addEventListener('resize', updateCachedLayoutH);
        window.addEventListener('orientationchange', function() { cachedLayoutH = 0; setTimeout(updateCachedLayoutH, 200); });

        /* 键盘高度：layout 视口与 visual 视口的差值。
           使用缓存的全屏高度，避免 Android 键盘弹出时 innerHeight 缩小导致误判。
           阈值 100px：真实键盘通常 200px+，浏览器地址栏伸缩通常 <80px，避免误判 */
        function keyboardHeight() {
            const vv = window.visualViewport;
            if (!vv) return 0;
            const layoutH = cachedLayoutH || Math.max(window.innerHeight, document.documentElement.clientHeight || 0);
            const visualH = vv.height;
            const offsetTop = vv.offsetTop || 0;
            return Math.max(0, layoutH - visualH - Math.max(0, offsetTop));
        }
        /* 防抖应用：避免键盘动画过程中频繁修改样式导致闪烁/错位 */
        function applyDebounced() {
            if (applyTimer) clearTimeout(applyTimer);
            applyTimer = setTimeout(apply, 30);
        }
        /* 核心修复：聊天页始终保持全屏覆盖（top:0; bottom:0），不缩小高度。
           通过 padding-bottom 将 footer 和消息区域上推至键盘上方，
           彻底消除键盘弹出/收起时闪现桌面的问题。 */
        var _lastKbH = -1, _wasOpen = false;
        function apply() {
            applyTimer = null;
            const vv = window.visualViewport;
            if (!vv) return false;
            if (chatPage.style.display === 'none') return false;
            const layoutH = cachedLayoutH || Math.max(window.innerHeight, document.documentElement.clientHeight || 0);
            const open = (layoutH - vv.height) > 100;
            const kbH = Math.max(0, Math.round(layoutH - vv.height - (vv.offsetTop || 0)));
            // 只在键盘高度变化时写 DOM，减少回流
            if (kbH !== _lastKbH) {
                _lastKbH = kbH;
                chatPage.style.paddingBottom = open ? kbH + 'px' : '0px';
            }
            if (open) {
                chatPage.classList.add('keyboard-open');
                const footer = chatPage.querySelector('.chat-footer');
                if (footer) footer.style.removeProperty('margin-top');
                document.querySelectorAll('.emoji-panel.show, .plus-panel.show').forEach(function(p) { p.classList.remove('show'); });
                if (!_wasOpen) { _wasOpen = true; setTimeout(function() { if (typeof scrollToBottom === 'function') scrollToBottom(); }, 80); }
            } else {
                chatPage.classList.remove('keyboard-open');
                _wasOpen = false;
            }
            return open;
        }
        /* 复位：移除键盘相关样式，并从 chatSettings 重新应用底部位置，避免与 initChatPage 不同步 */
        function reset() {
            if (applyTimer) { clearTimeout(applyTimer); applyTimer = null; } // 取消待执行的 apply
            chatPage.classList.remove('keyboard-open');
            chatPage.style.removeProperty('padding-bottom');
            chatPage.style.removeProperty('--keyboard-height');
            _lastKbH = -1; _wasOpen = false;
            lastAppliedKH = 0;
            var s = (typeof appData !== 'undefined' && appData.chatSettings) || {};
            var footer = chatPage.querySelector('.chat-footer');
            if (footer) {
                if (s.footerPosOffset) {
                    // 已去除底部输入框位置调节，不再应用旧值
                    footer.style.marginTop = '';
                } else {
                    footer.style.marginTop = '';
                }
            }
        }
        resetChatKeyboard = reset; // 暴露全局引用
        // 轮询：键盘弹出有动画过程，短时间内多次检测以捕捉到真实高度
        function startPolling() {
            stopPolling();
            let attempts = 0;
            pollTimer = setInterval(function() {
                attempts++;
                if (apply() || attempts > 12) {
                    stopPolling();
                }
            }, 80);
        }
        function stopPolling() {
            if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
        }
        // ===== iOS 输入辅助工具栏隐藏 =====
    (function() {
        // 创建虚拟input用于转移焦点，骗过iOS键盘的辅助栏
        var _dummyInput = document.createElement('input');
        _dummyInput.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;border:none;font-size:16px;';
        _dummyInput.setAttribute('autocomplete','off');
        _dummyInput.setAttribute('autocorrect','off');
        _dummyInput.setAttribute('autocapitalize','off');
        _dummyInput.setAttribute('spellcheck','false');
        _dummyInput.setAttribute('readonly','true');
        _dummyInput.setAttribute('aria-hidden','true');
        document.body.appendChild(_dummyInput);
        var _isTransfering = false;

        // 监听chatInput的focus事件，在获得焦点时先快速切换到虚拟input再切回
        var chatInputEl = document.getElementById('chatInput');
        if (chatInputEl) {
            chatInputEl.addEventListener('focus', function() {
                if (_isTransfering) return;
                // 短暂转移焦点到虚拟input，再转回，可触发iOS重新渲染键盘（不带辅助栏）
                _isTransfering = true;
                try {
                    _dummyInput.focus({preventScroll:true});
                    setTimeout(function() {
                        chatInputEl.focus({preventScroll:true});
                        _isTransfering = false;
                    }, 0);
                } catch(e) {
                    _isTransfering = false;
                }
            }, true);
            // blur时也转移焦点到虚拟input，防止辅助栏残留
            chatInputEl.addEventListener('blur', function() {
                setTimeout(function() {
                    if (document.activeElement !== chatInputEl) {
                        try { _dummyInput.focus({preventScroll:true}); _dummyInput.blur(); } catch(e){}
                    }
                }, 50);
            }, true);
        }
    })();

    if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', function() {
                apply();
                if (inputFocused) {
                    const active = document.activeElement;
                    if (!active || !chatPage.contains(active) || !active.closest('.chat-input-wrap, .chat-input, .chat-footer input, .chat-footer textarea')) {
                        reset();
                    }
                }
            });
            // 同步可见区域偏移：键盘弹出时 visualViewport.offsetTop 可能变化，
            // apply() 内部有缓存比对，仅在数值变化时写 DOM，开销可控
            window.visualViewport.addEventListener('scroll', function() { apply(); });
        }
        chatPage.addEventListener('focusin', function(e) {
            if (e.target.closest('.chat-input-wrap, .chat-input, .chat-footer input, .chat-footer textarea')) {
                inputFocused = true;
                updateCachedLayoutH();
                apply();
                startPolling();
            }
        });
        chatPage.addEventListener('focusout', function(e) {
            setTimeout(function() {
                const active = document.activeElement;
                if (!active || !chatPage.contains(active) || !active.closest('.chat-input-wrap, .chat-input, .chat-footer input, .chat-footer textarea')) {
                    inputFocused = false;
                    stopPolling();
                    reset();
                }
            }, 150);
        });
        window.addEventListener('resize', function() { if (inputFocused) applyDebounced(); });
        // 页面可见性变化时复位，防止后台切回时键盘状态残留
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                updateCachedLayoutH();
                const active = document.activeElement;
                if (!active || !chatPage.contains(active) || !active.closest('.chat-input-wrap, .chat-input, .chat-footer input, .chat-footer textarea')) {
                    inputFocused = false;
                    stopPolling();
                    reset();
                }
            }
        });
    })();
