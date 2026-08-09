    // ========== 朋友圈功能 ==========
    function openMoments() {
        closeAllModals();
        document.getElementById('momentsPage').style.display = 'flex';
        /* 强制发送键透明，避免首次进入显示灰色 */
        var sendBtn = document.querySelector('.moments-header .page-send');
        if (sendBtn) {
            sendBtn.style.background = 'transparent';
            sendBtn.style.webkitTapHighlightColor = 'transparent';
            sendBtn.style.outline = 'none';
        }
        initMomentsPage();
    }
    function closeMoments() {
        document.getElementById('momentsPage').style.display = 'none';
    }
    function initMomentsPage() {
        const s = appData.chatSettings;
        document.getElementById('momentMyNick').textContent = s.myNickname;
        const avatarEl = document.getElementById('momentMyAvatar');
        avatarEl.innerHTML = '';
        if (s.myAvatar) {
            avatarEl.innerHTML = `<img src="${s.myAvatar}" alt="">`;
        }
        const momentsHeader = document.getElementById('momentsHeader');
        if (appData.moments.videoWallpaper) {
            let bgVideo = momentsHeader.querySelector('video.moments-bg-video');
            if (!bgVideo) {
                bgVideo = document.createElement('video');
                bgVideo.className = 'moments-bg-video';
                bgVideo.muted = true;
                bgVideo.autoplay = true;
                bgVideo.loop = true;
                bgVideo.playsInline = true;
                bgVideo.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;';
                momentsHeader.style.position = 'relative';
                momentsHeader.insertBefore(bgVideo, momentsHeader.firstChild);
            }
            bgVideo.src = appData.moments.videoWallpaper;
            bgVideo.play().catch(()=>{});
            momentsHeader.style.backgroundImage = 'none';
        } else {
            const bgVideo = momentsHeader.querySelector('video.moments-bg-video');
            if (bgVideo) bgVideo.remove();
            if (appData.moments.wallpaper) {
                momentsHeader.style.backgroundImage = `url(${appData.moments.wallpaper})`;
            }
        }
        checkDailyMoments();
        processPendingMomentActions();
        renderMomentsList();
    }
    function changeMomentsWallpaper() {
        const choice = confirm('点击「确定」上传图片壁纸\n点击「取消」上传视频壁纸');
        if (choice) {
            currentEditType = 'momentsWallpaper';
            document.getElementById('fileInput').click();
        } else {
            currentEditType = 'momentsVideoWallpaper';
            document.getElementById('videoInput').click();
        }
    }
    function resetMomentsWallpaper() {
        appData.moments.wallpaper = '';
        if (appData.moments.videoWallpaper !== undefined) appData.moments.videoWallpaper = '';
        saveDataSync();
        const header = document.getElementById('momentsHeader');
        // 移除旧的视频元素
        const oldVideo = header.querySelector('video.moments-bg-video');
        if (oldVideo) oldVideo.remove();
        header.style.backgroundImage = '';
        header.style.backgroundColor = 'var(--color-light-gray)';
    }

    function checkDailyMoments() {
        const today = new Date().toDateString();
        if (appData.moments.lastDailyDate === today) return;
        
        appData.moments.lastDailyDate = today;
        const count = appData.chatSettings.momentCount;
        const allCards = getAllVisibleWordCards();
        const images = appData.specialCards.image;
        const videos = appData.specialCards.video;
        
        for (let i = 0; i < count; i++) {
            let text = '';
            if (allCards.length > 0) {
                if (appData.chatSettings.momentSplice) {
                    const spliceCount = Math.min(Math.floor(Math.random() * 3) + 1, allCards.length);
                    const shuffled = [...allCards].sort(() => 0.5 - Math.random());
                    text = shuffled.slice(0, spliceCount).join(' ');
                } else {
                    text = allCards[Math.floor(Math.random() * allCards.length)];
                }
            }
            
            let media = [];
            const hasMedia = Math.random() > 0.5;
            if (hasMedia) {
                const useVideo = videos.length > 0 && Math.random() > 0.6;
                if (useVideo) {
                    const video = videos[Math.floor(Math.random() * videos.length)];
                    media = [{type: 'video', src: video}];
                } else if (images.length > 0) {
                    const imgCount = Math.min(Math.floor(Math.random() * 9) + 1, images.length);
                    const shuffled = [...images].sort(() => 0.5 - Math.random());
                    media = shuffled.slice(0, imgCount).map(src => ({type: 'image', src: src}));
                }
            }
            
            appData.moments.list.unshift({
                id: Date.now() + i,
                sender: 'other',
                text: text,
                media: media,
                likes: [],
                comments: [],
                time: Date.now() - i * 3600000
            });
        }
        
        // 20%概率删除旧朋友圈
        if (appData.moments.list.length > 3 && Math.random() < 0.2) {
            const delIndex = Math.floor(Math.random() * appData.moments.list.length);
            appData.moments.list.splice(delIndex, 1);
        }
        
        // 对方自主点赞和评论用户的朋友圈
        const myMoments = appData.moments.list.filter(m => m.sender === 'mine');
        const otherNick = appData.chatSettings.otherNickname;
        myMoments.forEach(m => {
            if (Math.random() * 100 < (appData.chatSettings.momentLikeProb !== undefined ? appData.chatSettings.momentLikeProb : 80) && !m.likes.find(l => l.nickname === otherNick)) {
                m.likes.push({nickname: otherNick});
            }
            if (Math.random() * 100 < (appData.chatSettings.momentCommentProb !== undefined ? appData.chatSettings.momentCommentProb : 80) && !m.comments.find(c => c.nickname === otherNick)) {
                m.comments.push({
                    nickname: otherNick,
                    content: getReplyContent(),
                    time: Date.now()
                });
            }
        });
        
        saveData();
    }

    function renderMomentsList() {
        const container = document.getElementById('momentsList');
        container.innerHTML = '';
        const s = appData.chatSettings;
        
        appData.moments.list.slice().sort((a, b) => (b.time || 0) - (a.time || 0)).forEach(moment => {
            const item = document.createElement('div');
            item.className = 'moment-item';
            item.dataset.id = moment.id;
            
            const avatar = document.createElement('div');
            avatar.className = 'moment-avatar';
            const avatarSrc = moment.sender === 'mine' ? s.myAvatar : s.otherAvatar;
            if (avatarSrc) avatar.innerHTML = `<img src="${avatarSrc}" alt="">`;
            item.appendChild(avatar);
            
            const content = document.createElement('div');
            content.className = 'moment-content';
            
            const nickname = document.createElement('div');
            nickname.className = 'moment-nickname';
            nickname.textContent = moment.sender === 'mine' ? s.myNickname : s.otherNickname;
            content.appendChild(nickname);
            
            if (moment.text) {
                const text = document.createElement('div');
                text.className = 'moment-text';
                text.textContent = moment.text;
                content.appendChild(text);
            }
            
            if (moment.media && moment.media.length > 0) {
                const imgWrap = document.createElement('div');
                imgWrap.className = 'moment-images' + (moment.media.length === 1 ? ' single' : '');
                moment.media.forEach(m => {
                    if (m.type === 'image') {
                        imgWrap.innerHTML += `<img src="${m.src}" alt="" onclick="event.stopPropagation();viewMomentImage('${m.src}')" style="cursor:pointer;">`;
                    } else {
                        imgWrap.innerHTML += `<video src="${m.src}" controls playsinline="playsinline" webkit-playsinline="webkit-playsinline" preload="auto" style="width:100%;max-height:300px;object-fit:cover;"></video>`;
                    }
                });
                content.appendChild(imgWrap);
            }
            
            const footer = document.createElement('div');
            footer.className = 'moment-footer';
            footer.innerHTML = `
                <div class="moment-time">${formatTime(moment.time)}</div>
                <div class="moment-ops-wrapper">
                    <div class="moment-more" onclick="toggleMomentOps(${moment.id})">⋯</div>
                    <div class="moment-ops" id="momentOps_${moment.id}">
                        <span onclick="likeMoment(${moment.id})">
                            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            赞
                        </span>
                        <span onclick="toggleCommentInput(${moment.id})">
                            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            评论
                        </span>
                        <span class="danger" onclick="deleteMoment(${moment.id})" style="color:#ff3b30;">删除</span>
                    </div>
                </div>
            `;
            content.appendChild(footer);
            
            // 点赞评论区
            const likeComment = document.createElement('div');
            likeComment.className = 'like-comment-area';
            likeComment.id = `likeComment_${moment.id}`;
            
            if (moment.likes.length > 0) {
                const likeList = document.createElement('div');
                likeList.className = 'like-list';
                likeList.textContent = moment.likes.map(l => l.nickname).join('、');
                likeComment.appendChild(likeList);
            }
            
            if (moment.comments.length > 0) {
                const commentList = document.createElement('div');
                commentList.className = 'comment-list';
                moment.comments.forEach((c, idx) => {
                    if (!c.id) c.id = 'c_' + moment.id + '_' + idx + '_' + Math.random().toString(36).slice(2, 6);
                    const cItem = document.createElement('div');
                    cItem.className = 'comment-item';
                    const nickSpan = document.createElement('span');
                    nickSpan.className = 'comment-nick';
                    nickSpan.textContent = c.nickname;
                    cItem.appendChild(nickSpan);
                    if (c.replyTo) {
                        cItem.appendChild(document.createTextNode(' 回复 '));
                        const replySpan = document.createElement('span');
                        replySpan.className = 'comment-nick';
                        replySpan.textContent = c.replyTo;
                        cItem.appendChild(replySpan);
                        cItem.appendChild(document.createTextNode('：'));
                    } else {
                        cItem.appendChild(document.createTextNode('：'));
                    }
                    const textSpan = document.createElement('span');
                    textSpan.className = 'comment-text';
                    textSpan.textContent = c.content;
                    cItem.appendChild(textSpan);
                    cItem.onclick = function(e) {
                        e.stopPropagation();
                        startReplyComment(moment.id, c.id, c.nickname);
                    };
                    commentList.appendChild(cItem);
                });
                likeComment.appendChild(commentList);
            }
            
            // 评论输入框
            const commentInputRow = document.createElement('div');
            commentInputRow.className = 'comment-input-row';
            commentInputRow.id = `commentInput_${moment.id}`;
            commentInputRow.style.display = 'none';
            commentInputRow.innerHTML = `
                <input type="text" placeholder="评论..." id="commentInputVal_${moment.id}" onkeydown="if(event.key==='Enter')submitComment(${moment.id})">
                <button onclick="submitComment(${moment.id})">发送</button>
            `;
            likeComment.appendChild(commentInputRow);
            
            if (moment.likes.length > 0 || moment.comments.length > 0) {
                likeComment.classList.add('show');
            }
            
            content.appendChild(likeComment);
            item.appendChild(content);
            container.appendChild(item);
        });
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff/60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff/3600000) + '小时前';
        return (date.getMonth()+1) + '月' + date.getDate() + '日';
    }

    function toggleMomentOps(id) {
        const ops = document.getElementById('momentOps_' + id);
        document.querySelectorAll('.moment-ops').forEach(el => {
            if (el.id !== 'momentOps_' + id) el.classList.remove('show');
        });
        ops.classList.toggle('show');
        setTimeout(() => {
            document.addEventListener('click', function closeOps(e) {
                if (!e.target.closest('.moment-ops') && !e.target.closest('.moment-more')) {
                    ops.classList.remove('show');
                    document.removeEventListener('click', closeOps);
                }
            });
        }, 0);
    }

    function likeMoment(id) {
        const moment = appData.moments.list.find(m => m.id === id);
        if (!moment) return;
        const myNick = appData.chatSettings.myNickname;
        const liked = moment.likes.find(l => l.nickname === myNick);
        
        if (liked) {
            moment.likes = moment.likes.filter(l => l.nickname !== myNick);
        } else {
            moment.likes.push({nickname: myNick});
            // 按设置概率安排对方点赞，上线后会补发
            if (moment.sender === 'mine') scheduleOtherMomentReaction(id, {like:true, comment:false});
        }
        
        var opsEl = document.getElementById('momentOps_' + id);
        if (opsEl) opsEl.classList.remove('show');
        saveData();
        // 局部更新：只刷新该条朋友圈的点赞评论区
        refreshMomentLikeComment(id);
    }

    var _replyingComment = { momentId: null, commentId: null, replyTo: null };

    function toggleCommentInput(id) {
        _replyingComment = { momentId: id, commentId: null, replyTo: null };
        const likeComment = document.getElementById('likeComment_' + id);
        if (likeComment) likeComment.classList.add('show');
        const input = document.getElementById('commentInput_' + id);
        input.style.display = 'flex';
        const valInput = document.getElementById('commentInputVal_' + id);
        valInput.placeholder = '评论...';
        document.getElementById('momentOps_' + id).classList.remove('show');
        valInput.focus();
    }

    function startReplyComment(momentId, commentId, nickname) {
        _replyingComment = { momentId: momentId, commentId: commentId, replyTo: nickname };
        const likeComment = document.getElementById('likeComment_' + momentId);
        if (likeComment) likeComment.classList.add('show');
        const input = document.getElementById('commentInput_' + momentId);
        input.style.display = 'flex';
        const valInput = document.getElementById('commentInputVal_' + momentId);
        valInput.placeholder = '回复 ' + nickname + '：';
        valInput.focus();
    }

    // 默认评论回复语，当没有字卡时使用
    var defaultCommentReplies = [
        '嗯嗯～', '哈哈', '好呀', '我也觉得', '是吗', ' wow ', '真的吗', '好可爱',
        '想你啦', '嘿嘿', '么么', '收到啦', '好哒', '爱你', '在呢', '嘻嘻',
        '我也想你了', '今天怎么样', '抱抱', '开心'
    ];
    function getReplyContent() {
        const allCards = getAllVisibleWordCards();
        if (allCards.length > 0 && Math.random() < 0.6) {
            return allCards[Math.floor(Math.random() * allCards.length)];
        }
        return defaultCommentReplies[Math.floor(Math.random() * defaultCommentReplies.length)];
    }

    function scheduleMomentAction(momentId, action) {
        if (!appData.moments.pendingActions) appData.moments.pendingActions = [];
        action.id = action.id || ('ma_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7));
        action.momentId = momentId;
        appData.moments.pendingActions.push(action);
        saveData();
        const delay = Math.max(0, (action.dueAt || Date.now()) - Date.now());
        setTimeout(processPendingMomentActions, Math.min(delay, 2147483647));
    }
    function processPendingMomentActions() {
        if (!appData.moments.pendingActions) appData.moments.pendingActions = [];
        const now = Date.now();
        let changed = false;
        const remain = [];
        appData.moments.pendingActions.forEach(function(action) {
            if (!action || !action.dueAt || action.dueAt > now) { remain.push(action); return; }
            const m = appData.moments.list.find(x => x.id === action.momentId);
            if (!m) { changed = true; return; }
            const otherNick = appData.chatSettings.otherNickname;
            if (action.type === 'like') {
                if (!m.likes.find(l => l.nickname === otherNick)) m.likes.push({nickname: otherNick});
            } else if (action.type === 'comment') {
                m.comments.push({
                    id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
                    nickname: otherNick,
                    content: getReplyContent(),
                    parentId: action.parentId || null,
                    replyTo: action.replyTo || null,
                    time: Date.now()
                });
            }
            changed = true;
        });
        appData.moments.pendingActions = remain;
        if (changed) {
            saveData();
            if (document.getElementById('momentsPage') && document.getElementById('momentsPage').style.display === 'flex') renderMomentsList();
        }
    }
    function scheduleOtherMomentReaction(momentId, opts) {
        const s = appData.chatSettings;
        const delayMin = Math.max(1, s.momentReplyDelayMin !== undefined ? s.momentReplyDelayMin : 10);
        const dueAt = Date.now() + delayMin * 60 * 1000;
        if (!opts) opts = {};
        if (opts.like && Math.random() * 100 < (s.momentLikeProb !== undefined ? s.momentLikeProb : 80)) {
            scheduleMomentAction(momentId, {type:'like', dueAt: dueAt});
        }
        if (opts.comment && Math.random() * 100 < (s.momentCommentProb !== undefined ? s.momentCommentProb : 80)) {
            scheduleMomentAction(momentId, {type:'comment', dueAt: dueAt, parentId: opts.parentId || null, replyTo: opts.replyTo || null});
        }
    }

    function submitComment(id) {
        const input = document.getElementById('commentInputVal_' + id);
        const text = input.value.trim();
        if (!text) return;

        const moment = appData.moments.list.find(m => m.id === id);
        if (!moment) return;

        const myNick = appData.chatSettings.myNickname;
        let parentId = null;
        let replyTo = null;
        if (_replyingComment.momentId === id && _replyingComment.commentId) {
            parentId = _replyingComment.commentId;
            replyTo = _replyingComment.replyTo;
        }

        moment.comments.push({
            id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            nickname: myNick,
            content: text,
            parentId: parentId,
            replyTo: replyTo,
            time: Date.now()
        });

        input.value = '';
        _replyingComment = { momentId: null, commentId: null, replyTo: null };
        input.placeholder = '评论...';
        saveData();
        // 局部更新：只刷新该条朋友圈的点赞评论区
        refreshMomentLikeComment(id);

        // 只要我回复/评论，对方就会在设置时间到达后回复；离线后上线会补发
        scheduleMomentAction(id, {
            type: 'comment',
            dueAt: Date.now() + Math.max(1, appData.chatSettings.momentReplyDelayMin || 10) * 60 * 1000,
            parentId: 'c_' + Date.now(),
            replyTo: myNick
        });
    }

    function deleteMoment(id) {
        if (!confirm('确定删除这条朋友圈吗？')) return;
        appData.moments.list = appData.moments.list.filter(m => m.id !== id);
        // 使用同步保存，避免快速连续删除时防抖导致数据丢失/白屏
        saveDataSync();
        // 局部更新：移除对应 DOM 元素
        var item = document.querySelector('.moment-item[data-id="' + id + '"]');
        if (item) {
            item.remove();
        } else {
            renderMomentsList();
        }
    }

    // 发朋友圈
    function openPublishMoment() {
        appData.publishMediaList = [];
        document.getElementById('publishMomentText').value = '';
        renderPublishMedia();
        document.getElementById('publishMomentModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
    }
    function closePublishMoment() {
        document.getElementById('publishMomentModal').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }
    function addPublishMedia() {
        currentEditType = 'publishMedia';
        document.getElementById('publishMediaInput').click();
    }
    function handlePublishMediaUpload(e) {
        const files = e.target.files;
        if (!files.length) return;
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
        e.target.value = '';
    }
    function renderPublishMedia() {
        const grid = document.getElementById('publishMediaGrid');
        grid.innerHTML = '';
        appData.publishMediaList.forEach((m, index) => {
            const item = document.createElement('div');
            item.className = 'publish-media-item';
            if (m.type === 'image') {
                item.innerHTML = `<img src="${m.src}" alt=""><div class="publish-media-del" onclick="removePublishMedia(${index})">×</div>`;
            } else {
                item.innerHTML = `<video src="${m.src}" playsinline webkit-playsinline preload="auto"></video><div class="publish-media-del" onclick="removePublishMedia(${index})">×</div>`;
            }
            grid.appendChild(item);
        });
        if (appData.publishMediaList.length < 9) {
            const add = document.createElement('div');
            add.className = 'publish-media-add';
            add.innerHTML = `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
            add.onclick = addPublishMedia;
            grid.appendChild(add);
        }
    }
    function removePublishMedia(index) {
        appData.publishMediaList.splice(index, 1);
        renderPublishMedia();
    }
    function publishMoment() {
        const text = document.getElementById('publishMomentText').value.trim();
        if (!text && appData.publishMediaList.length === 0) {
            alert('请输入内容或添加图片/视频');
            return;
        }
        const momentId = Date.now();
        var newMoment = {
            id: momentId,
            sender: 'mine',
            text: text,
            media: [...appData.publishMediaList],
            likes: [],
            comments: [],
            time: Date.now()
        };
        appData.moments.list.unshift(newMoment);
        saveDataSync();
        closePublishMoment();

        // 局部更新：只插入新动态节点，不重建列表（规则5）
        var container = document.getElementById('momentsList');
        if (container) {
            var newItem = _buildMomentItemEl(newMoment);
            if (container.firstChild) {
                container.insertBefore(newItem, container.firstChild);
            } else {
                container.appendChild(newItem);
            }
        }

        // 按设置概率安排对方主动评论/点赞；页面离开后上线也会补发
        scheduleOtherMomentReaction(momentId, {like:true, comment:true});
    }
    // 辅助函数：构建单条朋友圈 DOM 元素（供 publishMoment 局部插入使用）
    function _buildMomentItemEl(moment) {
        var s = appData.chatSettings;
        var item = document.createElement('div');
        item.className = 'moment-item';
        item.dataset.id = moment.id;

        var avatar = document.createElement('div');
        avatar.className = 'moment-avatar';
        var avatarSrc = moment.sender === 'mine' ? s.myAvatar : s.otherAvatar;
        if (avatarSrc) avatar.innerHTML = '<img src="' + avatarSrc + '" alt="">';
        item.appendChild(avatar);

        var content = document.createElement('div');
        content.className = 'moment-content';

        var nickname = document.createElement('div');
        nickname.className = 'moment-nickname';
        nickname.textContent = moment.sender === 'mine' ? s.myNickname : s.otherNickname;
        content.appendChild(nickname);

        if (moment.text) {
            var textEl = document.createElement('div');
            textEl.className = 'moment-text';
            textEl.textContent = moment.text;
            content.appendChild(textEl);
        }

        if (moment.media && moment.media.length > 0) {
            var imgWrap = document.createElement('div');
            imgWrap.className = 'moment-images' + (moment.media.length === 1 ? ' single' : '');
            moment.media.forEach(function(m) {
                if (m.type === 'image') {
                    imgWrap.innerHTML += '<img src="' + m.src + '" alt="" onclick="event.stopPropagation();viewMomentImage(\'' + m.src + '\')" style="cursor:pointer;">';
                } else {
                    imgWrap.innerHTML += '<video src="' + m.src + '" controls playsinline="playsinline" webkit-playsinline="webkit-playsinline" preload="auto" style="width:100%;max-height:300px;object-fit:cover;"></video>';
                }
            });
            content.appendChild(imgWrap);
        }

        var footer = document.createElement('div');
        footer.className = 'moment-footer';
        footer.innerHTML =
            '<div class="moment-time">' + formatTime(moment.time) + '</div>' +
            '<div class="moment-ops-wrapper">' +
            '<div class="moment-more" onclick="toggleMomentOps(' + moment.id + ')">⋯</div>' +
            '<div class="moment-ops" id="momentOps_' + moment.id + '">' +
            '<span onclick="likeMoment(' + moment.id + ')"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>赞</span>' +
            '<span onclick="toggleCommentInput(' + moment.id + ')"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>评论</span>' +
            '<span class="danger" onclick="deleteMoment(' + moment.id + ')" style="color:#ff3b30;">删除</span>' +
            '</div></div>';
        content.appendChild(footer);

        var likeComment = document.createElement('div');
        likeComment.className = 'like-comment-area';
        likeComment.id = 'likeComment_' + moment.id;

        var commentInputRow = document.createElement('div');
        commentInputRow.className = 'comment-input-row';
        commentInputRow.id = 'commentInput_' + moment.id;
        commentInputRow.style.display = 'none';
        commentInputRow.innerHTML =
            '<input type="text" placeholder="评论..." id="commentInputVal_' + moment.id + '" onkeydown="if(event.key===\'Enter\')submitComment(' + moment.id + ')">' +
            '<button onclick="submitComment(' + moment.id + ')">发送</button>';
        likeComment.appendChild(commentInputRow);

        content.appendChild(likeComment);
        item.appendChild(content);
        return item;
    }
    // 单人日记对方字卡回复触发器
    function triggerDiaryReply(diaryId) {
        const s = appData.diary.settings;
        const allCards = getAllVisibleWordCards();
        if (allCards.length === 0) return;
        // 有概率回复（概率由设置中的replyProb决定，默认80%）
        const replyProb = s.replyProb !== undefined ? s.replyProb : 80;
        // 按概率决定对方是否主动回复
        if (Math.random() * 100 >= replyProb) return;
        const replyTime = appData.chatSettings.diaryReplyTime || 30;
        // 持久化计划回复时间，防止页面刷新后丢失
        const diary = appData.diary.singleList.find(d => d.id === diaryId);
        if (diary) {
            diary.pendingReplyAt = Date.now() + replyTime * 60 * 1000;
            saveData();
        }
        scheduleDiaryReply(diaryId, replyTime * 60 * 1000);
    }
    function scheduleDiaryReply(diaryId, delay) {
        // 防止重复调度
        var diary = appData.diary.singleList.find(d => d.id === diaryId);
        if (diary && diary._replyScheduled) return;
        if (diary) diary._replyScheduled = true;
        setTimeout(() => {
            const s = appData.diary.settings;
            const allCards = getAllVisibleWordCards();
            if (allCards.length === 0) {
                // 字卡为空：清除 pendingReplyAt，避免无限重试
                var d = appData.diary.singleList.find(d => d.id === diaryId);
                if (d) { delete d.pendingReplyAt; delete d._replyScheduled; saveData(); }
                return;
            }
            const spliceCount = Math.floor(Math.random() * (s.spliceMax - s.spliceMin + 1)) + s.spliceMin;
            const shuffled = [...allCards].sort(() => 0.5 - Math.random());
            const replyText = shuffled.slice(0, Math.min(spliceCount, allCards.length)).join('\n');
            const targetDiary = appData.diary.singleList.find(d => d.id === diaryId);
            if (targetDiary) {
                targetDiary.reply = replyText;
                targetDiary.replyTime = Date.now();
                delete targetDiary.pendingReplyAt;
                delete targetDiary._replyScheduled;
                targetDiary.summoned = false;
                saveData();
                // 在聊天界面提醒对方已回复日记
                addSystemMsgToMain((appData.chatSettings.otherNickname || '对方') + '已回复你的日记，快去看看吧');
                if (document.getElementById('diaryPage').style.display === 'flex') renderDiaryList();
            }
        }, delay);
    }
    // 检查未完成的日记回复（页面刷新后恢复）
    function checkPendingDiaryReplies() {
        const now = Date.now();
        appData.diary.singleList.forEach(diary => {
            if (diary.pendingReplyAt && !diary.reply) {
                const remaining = diary.pendingReplyAt - now;
                if (remaining <= 0) {
                    // 已过期，立即回复
                    scheduleDiaryReply(diary.id, 0);
                } else {
                    // 还未到期，重新调度
                    scheduleDiaryReply(diary.id, remaining);
                }
            }
        });
    }

    // dd对方回复单人日记
    function summonSingleDiaryReply(diaryId, btn) {
        const diary = appData.diary.singleList.find(d => d.id === diaryId);
        if (!diary) return;
        if (diary.reply) return; // 已有回复
        if (diary.summoned) return; // 已dd过
        const replyTime = appData.chatSettings.diaryReplyTime || 30;
        diary.summoned = true;
        diary.pendingReplyAt = Date.now() + replyTime * 60 * 1000;
        saveData();
        if (btn) {
            btn.classList.add('summoned');
            btn.textContent = '已dd';
        }
        addSystemMsgToMain('已dd' + (appData.chatSettings.otherNickname || '对方') + '回复日记，预计' + replyTime + '分钟后回复');
               scheduleDiaryReply(diaryId, replyTime * 60 * 1000);
    }

    // ===== 朋友圈图片点击查看 =====
    function viewMomentImage(src) {
        let viewer = document.getElementById('momentImageViewer');
        if (!viewer) {
            viewer = document.createElement('div');
            viewer.id = 'momentImageViewer'; 'momentImageViewer';
            viewer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;';
            viewer.innerHTML = '<img style="max-width:95%;max-height:95%;object-fit:contain;border-radius:4px;">';
            viewer.onclick = function() { this.style.display = 'none'; };
            document.body.appendChild(viewer);
        }
        viewer.querySelector('img').src = src;
        viewer.style.display = 'flex';
    }


