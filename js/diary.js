    // ========== 日记功能 ==========
    // 安全打开日记设置：即使 openDiarySettings 内部出错，也强制显示弹窗
    function safeOpenDiarySettings() {
        try {
            openDiarySettings();
        } catch (err) {
            console.error('openDiarySettings 出错，使用兜底方案:', err);
            // 兜底：直接强制显示弹窗和遮罩
            var modal = document.getElementById('diarySettingsModal');
            var overlay = document.getElementById('overlay');
            if (modal) modal.classList.add('show');
            if (overlay) overlay.classList.add('show');
        }
        // 最终检查：如果弹窗还是没显示，强制显示
        var modal2 = document.getElementById('diarySettingsModal');
        if (modal2 && !modal2.classList.contains('show')) {
            modal2.classList.add('show');
            var ov = document.getElementById('overlay');
            if (ov) ov.classList.add('show');
        }
        // 最后再尝试渲染字卡区域，避免任何报错导致空白
        setTimeout(function(){
            try { renderOutfitCardSettings(); } catch(e) { console.error('safeOpenDiarySettings兜底renderOutfitCardSettings失败:', e); }
        }, 80);
    }
    function bindDiaryMenuEvents() {
        const diaryMenu = document.querySelector('#diaryPage .diary-page-menu');
        if (!diaryMenu) return;
        diaryMenu.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            safeOpenDiarySettings();
            return false;
        };
    }
    function openDiary() {
      try {
        // 关闭所有残留的弹窗和遮罩层，防止overlay覆盖页面导致菜单按钮无法点击
        closeAllModals();
        document.getElementById('diaryPage').style.display = 'flex';
        checkDailyDiary();
        checkDoubleDiaryNotification();
        // 单人和双人日记都显示 + 号
        const fab = document.getElementById('diaryFab');
        if (fab) fab.style.display = 'flex';
        // 修复菜单键无反应：绑定点击和触摸事件，确保移动端可响应
        bindDiaryMenuEvents();
        applyDiaryTheme();
        renderDiaryList();
      } catch (e) { console.error('openDiary失败:', e); }
    }
    function closeDiary() {
        document.getElementById('diaryPage').style.display = 'none';
    }
    function switchDiaryTab(tab) {
      try {
        // 关闭所有残留弹窗和遮罩，防止overlay阻挡点击
        closeAllModals();
        appData.diary.currentTab = tab;
        saveData();
        document.querySelectorAll('.diary-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        // 单人和双人日记都显示 + 号
        const fab = document.getElementById('diaryFab');
        if (fab) fab.style.display = 'flex';
        renderDiaryList();
      } catch (e) { console.error('switchDiaryTab失败:', e); }
    }

    // + 号按钮统一入口
    function handleDiaryFabClick() {
        if (appData.diary.currentTab === 'double') {
            openDoubleDiaryWriteForToday();
        } else {
            openWriteDiary();
        }
    }

    // 打开今日双人日记填写（没有则自动创建）
    function openDoubleDiaryWriteForToday() {
        let list = appData.diary.doubleList;
        let index = -1;
        const today = new Date().toDateString();
        // 找今天最新的条目
        for (let i = 0; i < list.length; i++) {
            if (list[i].date === today) { index = i; break; }
        }
        if (index < 0) {
            // 没有则新建一个空条目
            const ts = Date.now();
            const entry = {
                id: ts,
                date: today,
                time: ts,
                otherData: null,
                myData: null,
                dateStr: getDiaryDateStr(ts),
                dayStr: getDiaryDayStr(ts)
            };
            list.unshift(entry);
            saveData();
            index = 0;
        }
        // Bug1：改用 entry.id 标识，避免排序后索引错位
        openDoubleDiaryWrite(list[index].id);
    }

    // 判断双人日记数据是否真正填写过（至少一个非空值）
    function hasDoubleDiaryData(data) {
        if (!data || typeof data !== 'object') return false;
        return Object.values(data).some(v => v !== '' && v !== null && v !== undefined);
    }

    // 获取天气/心情图标
    function getDiaryIcon(type, name) {
        const s = appData.diary.settings;
        if (!name) return '';
        const iconMap = type === 'weather' ? (s.weatherIcons || {}) : (s.moodIcons || {});
        if (iconMap[name]) {
            // 将SVG数据URI中的双引号转为单引号，避免与HTML属性引号冲突
            return iconMap[name].replace(/"/g, "'");
        }
        return '';
    }
    function renderDiaryIconImg(type, name) {
        const url = getDiaryIcon(type, name);
        if (url) return '<img class="diary-meta-icon" src="' + url + '" alt="' + name + '">';
        return '';
    }

    // 生成双人日记数据
    function generateDoubleDiaryData() {
        const allCards = getAllVisibleWordCards();
        // 24小时时间段（平均概率）
        const wakeTimes = [];
        for (let h = 0; h < 24; h++) {
            wakeTimes.push(String(h).padStart(2,'0') + ':00-' + String((h+1)%24).padStart(2,'0') + ':00');
        }
        const tasteOptions = ['特辣','中辣','正常辣','淡口味','未吃'];
        const goOutOptions = ['高','低','中等'];
        const workOptions = ['工作','休息','都有'];
        const comeOptions = ['是','否','过段时间'];
        const sleepOptions = ['是','否','等等我','马上来'];
        const tempOptions = ['热','冷','刚好','想抱你'];
        const songTypes = ['流行乐','古典乐','摇滚乐','民谣','电子乐','R&B','说唱','轻音乐','爵士乐','蓝调'];
        const colorSchemes = ['蓝色系','白色系','黑色系','红色系','橙色系','黄色系','绿色系','紫色系','粉色系','灰色系','暖色系','冷色系','大地色','莫兰迪','马卡龙','撞色系'];
        const fruits = ['草莓','蓝莓','芒果','西瓜','葡萄','苹果','橙子','桃子','樱桃','香蕉','火龙果','榴莲','荔枝','哈密瓜','猕猴桃','柚子','梨','圣女果'];
        const luckyNumbers = ['我的幸运数字是你','1','2','3','5','7','8','9','11','13','21','66','88','99','1314','520','521','6','17'];
        // 萧逸风格穿搭字卡（光与夜之恋萧逸人设：熟男/日常款/赛车手风格）
        const outfitTops = ['黑色皮夹克','深蓝赛车服','白色衬衫','黑色高领毛衣','军绿色工装外套','深灰卫衣','藏青色风衣','黑色机车夹克','白色T恤','深蓝牛仔外套','黑色棒球服','灰色针织衫'];
        const outfitBottoms = ['黑色机车裤','深蓝牛仔裤','卡其色工装裤','黑色运动裤','灰色休闲裤','深灰束脚裤','黑色皮裤','藏青色西裤','迷彩工装裤','黑色哈伦裤'];
        const outfitShoes = ['黑色机车靴','白色运动鞋','黑色马丁靴','赛车手套靴','切尔西靴','黑色高帮帆布鞋','深棕皮靴','白色板鞋','黑色老爹鞋','军靴'];

        function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
        function pct() { return Math.floor(Math.random() * 100) + '%'; }

        // 先决定是否有狗/猫，保证遛和喂的一致性
        const hasDog = Math.random() > 0.4;
        const hasCat = Math.random() > 0.4;

        return {
            appetite: pct(),
            goOut: pick(goOutOptions),
            taste: pick(tasteOptions),
            fruit: Math.random() > 0.3 ? pick(fruits) : '未吃',
            walkDog: hasDog ? pick(['是','否']) : '无小狗',
            feedDog: hasDog ? pick(['是','否']) : '无小狗',
            walkCat: hasCat ? pick(['是','否']) : '无小猫',
            feedCat: hasCat ? pick(['是','否']) : '无小猫',
            bath: pick(['是','否','正打算去']),
            wakeTime: pick(wakeTimes),
            stayUp: pick(['是','否','看情况']),
            workStatus: pick(workOptions),
            outfit: buildOutfitString(),
            colorScheme: pick(colorSchemes),
            luckyNumber: pick(luckyNumbers),
            missLevel: pct(),
            comeToMe: pick(comeOptions),
            sleepWithMe: pick(sleepOptions),
            bodyTemp: pick(tempOptions),
            songType: pick(songTypes),
            bedTimeWords: buildBedtimeString()
        };
    }

    function checkDailyDiary() {
        ensureTodayDoubleDiaryEntry();
        const today = new Date().toDateString();
        const s = appData.diary.settings;
        // 单人日记的对方不再主动写日记，只回复
        // 双人日记：对方每日24h内随机时间生成
        ensureTodayDoubleDiaryEntry();
        if (s.lastDoubleDiaryDate !== today) {
            const hasTodayOther = appData.diary.doubleList.some(e => e.date === today && hasDoubleDiaryData(e.otherData));
            if (!hasTodayOther) {
                scheduleDoubleDiaryGeneration(today);
            } else {
                s.lastDoubleDiaryDate = today;
            }
        }
        saveData();
    }

    function scheduleDoubleDiaryGeneration(today) {
        ensureTodayDoubleDiaryEntry();
        const now = new Date();
        const s = appData.diary.settings;
        // 如果已记录了今天的计划生成时间戳，且还没到时间，则继续等待
        if (s.doubleDiaryScheduledTime) {
            const scheduledTime = parseInt(s.doubleDiaryScheduledTime);
            if (scheduledTime > Date.now()) {
                const delay = scheduledTime - Date.now();
                if (delay < 24 * 3600 * 1000) { // 合理范围内才设置定时器
                    setTimeout(() => {
                        generateOtherDoubleDiary();
                    }, delay);
                    return;
                }
            }
        }
        // 对方下午后随时填写；如果已经过了下午，则从当前时间起安排
        const start = new Date();
        start.setHours(12, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const startMs = Math.max(Date.now(), start.getTime());
        const remainingMs = endOfDay.getTime() - startMs;
        if (remainingMs <= 0) return;
        const minDelay = Math.max(0, startMs - Date.now());
        const delay = minDelay + Math.floor(Math.random() * remainingMs);
        // 记录计划生成的时间戳，防止页面刷新后丢失
        s.doubleDiaryScheduledTime = Date.now() + delay;
        saveData();
        setTimeout(() => {
            generateOtherDoubleDiary();
        }, delay);
    }

    function generateOtherDoubleDiary() {
        const s = appData.diary.settings;
        const today = new Date().toDateString();
        if (s.lastDoubleDiaryDate === today) return;
        // 再次检查是否已有今天的对方数据
        const existing = appData.diary.doubleList.find(e => e.date === today);
        if (existing && hasDoubleDiaryData(existing.otherData)) {
            s.lastDoubleDiaryDate = today;
            s.doubleDiaryScheduledTime = '';
            saveData();
            return;
        }
        s.lastDoubleDiaryDate = today;
        s.doubleDiaryScheduledTime = ''; // 清理计划时间戳
        const data = generateDoubleDiaryData();
        const ts = Date.now();
        if (existing) {
            // 更新已有条目
            existing.otherData = data;
            existing.time = ts;
        } else {
            const entry = {
                id: ts,
                date: today,
                time: ts,
                otherData: data,
                myData: null,
                dateStr: getDiaryDateStr(ts),
                dayStr: getDiaryDayStr(ts)
            };
            appData.diary.doubleList.unshift(entry);
        }
        saveDataSync();
        // 在聊天界面提醒（小字区域）
        addSystemMsgToMain(appData.chatSettings.otherNickname + '已更新今日日记，你也快快去吧');
        // 存储通知状态
        appData.diary.settings.doubleDiaryNotifyPending = true;
        saveDataSync();
        // 如果用户在日记页面，刷新
        if (document.getElementById('diaryPage').style.display === 'flex') renderDiaryList();
        // 50%概率催更（可爱蓝色系手帐风格消息）
        if (Math.random() * 100 < s.urgeProb) {
            setTimeout(() => {
                const urgeMessages = [
                    '你怎么还没写日记呀，快去写！',
                    '我写完了哦，轮到你啦~',
                    '今天的日记记得写哦！',
                    '快来填日记，我想看你的！',
                    '日记写了吗？不许偷懒哦~',
                    '我都写完了，你什么时候写呀？'
                ];
                addSystemMsgToMain(appData.chatSettings.otherNickname + '：' + urgeMessages[Math.floor(Math.random() * urgeMessages.length)]);
            }, Math.random() * 7200000 + 1800000); // 30分钟到2.5小时后催更
        }
    }

    // dd对方填写双人日记
    function summonDoubleDiaryOther(id, btn) {
        // Bug1：按 entry.id 标识定位，排序后也不会点错人
        const entry = getDoubleDiaryEntryById(id);
        if (!entry) return;
        if (entry.summoned) return; // 已经dd过
        const replyTime = appData.chatSettings.diaryReplyTime || 30;
        entry.summoned = true;
        entry.summonedAt = Date.now();
        entry.summonReplyAt = Date.now() + replyTime * 60 * 1000;
        saveData();
        // 更新按钮状态
        if (btn) {
            btn.classList.add('summoned');
            btn.textContent = '已dd';
        }
        addSystemMsgToMain('已dd' + (appData.chatSettings.otherNickname || '对方') + '填写日记，预计' + replyTime + '分钟后回复');
        // 定时触发对方填写
        setTimeout(() => {
            generateSummonedDoubleDiary(entry);
        }, replyTime * 60 * 1000);
    }

    // dd后生成对方双人日记数据
    function generateSummonedDoubleDiary(entry) {
        if (!entry || hasDoubleDiaryData(entry.otherData)) return;
        const data = generateDoubleDiaryData();
        entry.otherData = data;
        entry.time = Date.now();
        entry.summoned = false;
        delete entry.summonedAt;
        delete entry.summonReplyAt;
        saveDataSync();
        addSystemMsgToMain(appData.chatSettings.otherNickname + '已响应dd，更新了今日日记');
        // 设置通知待处理状态，使用户重新上线后弹出提醒框
        appData.diary.settings.doubleDiaryNotifyPending = true;
        saveDataSync();
        // 如果用户当前在线且不在日记页面，直接弹出通知
        if (!document.hidden && document.getElementById('diaryPage').style.display !== 'flex') {
            try { checkDoubleDiaryNotification(); } catch(e) {}
        }
        if (document.getElementById('diaryPage').style.display === 'flex') renderDiaryList();
    }

    // 检查未完成的dd（页面刷新后恢复）
    function checkPendingSummons() {
        const now = Date.now();
        appData.diary.doubleList.forEach(entry => {
            if (entry.summoned && entry.summonReplyAt && !hasDoubleDiaryData(entry.otherData)) {
                const remaining = entry.summonReplyAt - now;
                if (remaining <= 0) {
                    generateSummonedDoubleDiary(entry);
                } else {
                    setTimeout(() => {
                        generateSummonedDoubleDiary(entry);
                    }, remaining);
                }
            }
        });
    }

    function checkDoubleDiaryNotification() {
        const s = appData.diary.settings;
        // 补发机制：如果今天还没生成对方日记，但计划时间已过，立即生成
        const today = new Date().toDateString();
        if (s.lastDoubleDiaryDate !== today) {
            const hasTodayOther = appData.diary.doubleList.some(e => e.date === today && hasDoubleDiaryData(e.otherData));
            if (!hasTodayOther) {
                if (s.doubleDiaryScheduledTime && parseInt(s.doubleDiaryScheduledTime) <= Date.now()) {
                    // 计划时间已过，立即生成
                    generateOtherDoubleDiary();
                } else if (!s.doubleDiaryScheduledTime) {
                    // 没有计划，安排生成
                    scheduleDoubleDiaryGeneration(today);
                }
            } else {
                s.lastDoubleDiaryDate = today;
                s.doubleDiaryScheduledTime = '';
                saveData();
            }
        }
        if (s.doubleDiaryNotifyPending) {
            const latest = appData.diary.doubleList[0];
            if (latest && latest.otherData && !latest.myData) {
                showDiaryNotify(
                    appData.chatSettings.otherNickname + '更新了今日日记',
                    '快去看看吧，也别忘了填写你的日记哦~'
                );
            }
            s.doubleDiaryNotifyPending = false;
            saveData();
        }
    }

    function showDiaryNotify(title, text) {
        document.getElementById('diaryNotifyTitle').textContent = title;
        document.getElementById('diaryNotifyText').textContent = text;
        document.getElementById('doubleDiaryNotifyModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
    }
    function closeDiaryNotify() {
        document.getElementById('doubleDiaryNotifyModal').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }

    function renderDiaryList() {
      try {
        const container = document.getElementById('diaryList');
        if (!container) return;
        container.innerHTML = '';
        const tab = appData.diary.currentTab;
        const s = appData.diary.settings;
        // 防御：确保数组存在，避免数据迁移异常导致 undefined 崩溃
        if (!appData.diary.singleList) appData.diary.singleList = [];
        if (!appData.diary.doubleList) appData.diary.doubleList = [];
        container.style.padding = '16px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.gap = '16px';

        if (tab === 'single') {
            // 单人日记 - 保留原有功能，按标签分组
            const list = appData.diary.singleList;
            const tagged = {};
            const untagged = [];
            list.forEach((diary, index) => {
                if (diary.tag) {
                    if (!tagged[diary.tag]) tagged[diary.tag] = [];
                    tagged[diary.tag].push({ diary, index });
                } else {
                    untagged.push({ diary, index });
                }
            });
            Object.keys(tagged).forEach(tag => {
                const header = document.createElement('div');
                header.className = 'diary-tag-group-header';
                header.innerHTML = '<svg class="diary-group-icon" viewBox="0 0 24 24" fill="none" stroke="#4a90d9" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>' + escapeHtml(tag);
                container.appendChild(header);
                tagged[tag].forEach(({ diary, index }) => {
                    container.appendChild(createDiaryCard(diary, index, s));
                });
            });
            if (untagged.length > 0 && Object.keys(tagged).length > 0) {
                const header = document.createElement('div');
                header.className = 'diary-tag-group-header';
                header.innerHTML = '<svg class="diary-group-icon" viewBox="0 0 24 24" fill="none" stroke="#4a90d9" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>未分类';
                container.appendChild(header);
            }
            untagged.forEach(({ diary, index }) => {
                container.appendChild(createDiaryCard(diary, index, s));
            });
            if (list.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#a0b8d0;font-size:14px;padding:40px;">还没有日记，点击右下角按钮开始写吧~</div>';
            }
        } else {
            // 双人日记 - 今日未填写提醒永远置顶，日记越新越靠上
            ensureTodayDoubleDiaryEntry();
            const list = [...appData.diary.doubleList].sort((a,b)=>(b.time||0)-(a.time||0));
            list.forEach((entry) => {
                // Bug1：用 entry.id 标识，排序后也能精准定位，不再依赖易变的数组索引
                container.appendChild(createDoubleDiaryCard(entry, entry.id, s));
            });
        }

        // 更新CSS预览
        const cssBox = document.getElementById('diaryCssPreview');
        if (cssBox) {
            cssBox.innerHTML = '<div style="font-size:11px;color:#666;line-height:1.6;white-space:pre-wrap;">' +
                '/* 日记卡片样式参考 */\n' +
                '.diary-new-card {\n' +
                '  background: ' + (s.bgImage ? 'url(...)' : s.cardBg) + ';\n' +
                '  color: ' + s.textColor + ';\n' +
                (s.fontFamily ? '  font-family: ' + s.fontFamily + ';\n' : '') +
                '  font-size: ' + s.fontSize + 'px;\n' +
                '  border: 2px solid ' + (s.cardBorderColor || '#c8ddf0') + ';\n' +
                '  border-radius: 16px;\n' +
                '  padding: 16px 20px;\n' +
                '}\n\n' +
                '/* 双人日记卡片 */\n' +
                '.double-diary-form {\n' +
                '  border: 2px solid ' + (s.cardBorderColor || '#c8ddf0') + ';\n' +
                '  color: ' + s.textColor + ';\n' +
                '}\n\n' +
                '/* 横线颜色 */\n' +
                '.diary-content-preview {\n' +
                '  background-image: repeating-linear-gradient(...' + (s.rulerColor || 'rgba(160,200,240,0.2)') + ');\n' +
                '}\n\n' +
                '/* 可自定义CSS类名 */\n' +
                '.diary-new-card .diary-tag-line { color: #4a90d9; }\n' +
                '.diary-new-card .diary-meta-row { color: #7a9cc6; }\n' +
                '.diary-reply-section { background: rgba(220,240,255,0.6); }\n' +
                '.dd-title { color: #4a90d9; }\n' +
                '.dd-detail-section { border-color: ' + (s.cardBorderColor || '#c8ddf0') + '; }\n' +
                '.diary-page { background: ' + (s.pageBg || 'linear-gradient(180deg,#e8f4fd,#f0f8ff,#e8f4fd)') + '; }\n' +
                '.diary-tab { color: #7a9cc6; }\n' +
                '.diary-tab.active { color: #4a90d9; border-bottom-color: #4a90d9; }' +
                '</div>';
        }
        // 应用自定义CSS
        applyDiaryCustomCss();
      } catch (e) { console.error('renderDiaryList失败:', e); }
    }

    function createDiaryCard(diary, index, s) {
        const card = document.createElement('div');
        card.className = 'diary-new-card' + (diary.hidden ? ' locked' : '');
        card.dataset.diaryId = diary.id;
        if (s.bgImage) card.style.background = 'url(' + s.bgImage + ') center/cover no-repeat';
        else card.style.background = s.cardBg || '#fff';
        card.style.color = s.textColor || '#333';
        if (s.fontFamily) card.style.fontFamily = s.fontFamily;
        card.style.fontSize = (s.fontSize || 14) + 'px';
        if (s.cardBorderColor) card.style.borderColor = s.cardBorderColor;

        // 标签行
        const tagLine = document.createElement('div');
        tagLine.className = 'diary-tag-line';
        const tagIcon = '<svg class="diary-tag-icon" viewBox="0 0 24 24" fill="none" stroke="#4a90d9" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';
        tagLine.innerHTML = tagIcon + escapeHtml(diary.tag || '未分类');
        card.appendChild(tagLine);

        // 天气、心情、日期行 - 使用图标
        const metaRow = document.createElement('div');
        metaRow.className = 'diary-meta-row';
        const dateStr = diary.dateStr || getDiaryDateStr(diary.time);
        const weatherIcon = renderDiaryIconImg('weather', diary.weather);
        const moodIcon = renderDiaryIconImg('mood', diary.mood);
        metaRow.innerHTML =
            '<span class="diary-meta-item">' + weatherIcon + (diary.weather || '—') + '</span>' +
            '<span class="diary-meta-item">' + moodIcon + (diary.mood || '—') + '</span>' +
            '<span class="diary-meta-item" style="margin-left:auto;">' + dateStr + '</span>';
        card.appendChild(metaRow);

        // 内容预览
        const preview = document.createElement('div');
        preview.className = 'diary-content-preview';
        preview.textContent = diary.content;
        if (diary.hidden) preview.style.filter = 'blur(3px)';
        card.appendChild(preview);

        // 对方回复区域 - 单人日记特有
        if (diary.sender === 'mine') {
            const replySection = document.createElement('div');
            replySection.className = 'diary-reply-section' + (diary.reply ? '' : ' waiting');
            const replyLabel = document.createElement('div');
            replyLabel.className = 'diary-reply-label';
            replyLabel.style.display = 'flex';
            replyLabel.style.alignItems = 'center';
            replyLabel.innerHTML = '<span>' + (diary.reply ? '对方的回复：' : '等待回复...') + '</span>';
            // dd对方按钮 - 没有回复时显示
            if (!diary.reply) {
                const summonBtn = document.createElement('button');
                summonBtn.className = 'diary-summon-btn' + (diary.summoned ? ' summoned' : '');
                const otherNick = appData.chatSettings.otherNickname || '对方';
                summonBtn.textContent = diary.summoned ? '已dd' : 'dd' + otherNick;
                summonBtn.onclick = (e) => {
                    e.stopPropagation();
                    summonSingleDiaryReply(diary.id, summonBtn);
                };
                replyLabel.appendChild(summonBtn);
            }
            replySection.appendChild(replyLabel);
            if (diary.reply) {
                const replyText = document.createElement('div');
                replyText.style.whiteSpace = 'pre-wrap';
                replyText.style.wordBreak = 'break-word';
                replyText.textContent = diary.reply;
                replySection.appendChild(replyText);
            }
            card.appendChild(replySection);
        }

        // 发送者信息
        const senderInfo = document.createElement('div');
        senderInfo.className = 'diary-sender-info';
        const senderNick = diary.sender === 'mine' ? appData.chatSettings.myNickname : appData.chatSettings.otherNickname;
        senderInfo.innerHTML = '<span>' + escapeHtml(senderNick) + '</span><span>' + new Date(diary.time).toLocaleDateString('zh-CN') + '</span>';
        card.appendChild(senderInfo);

        card.onclick = () => {
            /* 规则3：用 ID 定位索引，避免删除后索引错位 */
            var currentIdx = appData.diary.singleList.findIndex(d => d.id === diary.id);
            if (currentIdx >= 0) openDiaryDetail(currentIdx);
        };
        return card;
    }

    // 双人日记卡片：拆分为独立可滚动卡片，dd提示仅在"我写了但对方没写"时出现
    function ensureTodayDoubleDiaryEntry() {
        if (!appData.diary) appData.diary = {singleList:[], doubleList:[], currentTab:'single', settings:{}};
        if (!Array.isArray(appData.diary.doubleList)) appData.diary.doubleList = [];
        const today = new Date().toDateString();
        let entry = appData.diary.doubleList.find(e => e.date === today);
        if (!entry) {
            const ts = Date.now();
            entry = { id: ts, date: today, time: ts, otherData: null, myData: null, dateStr: getDiaryDateStr(ts), dayStr: getDiaryDayStr(ts) };
            appData.diary.doubleList.unshift(entry);
            saveData();
        }
        appData.diary.doubleList.sort((a,b)=>(b.time||0)-(a.time||0));
        return entry;
    }

    // Bug1：双人日记按 entry.id 标识，避免排序后索引对不上
    // 按 id 查找双人日记条目（兼容旧数据：id 缺失时按 date 回退）
    function getDoubleDiaryEntryById(id) {
        if (!appData.diary || !Array.isArray(appData.diary.doubleList)) return null;
        if (id == null) return null;
        // 优先按 id 精确匹配
        var byId = null;
        for (var i = 0; i < appData.diary.doubleList.length; i++) {
            if (appData.diary.doubleList[i].id === id) { byId = appData.diary.doubleList[i]; break; }
        }
        if (byId) return byId;
        // 兜底：若传入的是旧的数字索引（兼容历史调用），按索引取
        if (typeof id === 'number' && id >= 0 && id < appData.diary.doubleList.length) {
            return appData.diary.doubleList[id];
        }
        return null;
    }
    // 按 id 查找条目在 doubleList 中的索引（用于删除等需要索引的场景）
    function getDoubleDiaryIndexById(id) {
        if (!appData.diary || !Array.isArray(appData.diary.doubleList)) return -1;
        for (var i = 0; i < appData.diary.doubleList.length; i++) {
            if (appData.diary.doubleList[i].id === id) return i;
        }
        return -1;
    }

    function createDoubleDiaryCard(entry, index, s) {
        const fragment = document.createDocumentFragment();
        const otherNick = appData.chatSettings.otherNickname || '对方';
        const myNick = appData.chatSettings.myNickname || '我';
        const otherFilled = hasDoubleDiaryData(entry.otherData);
        const myFilled = hasDoubleDiaryData(entry.myData);

        // 未填写提醒始终在双人日记顶部
        if (!otherFilled) {
            fragment.appendChild(createDoubleDiarySummonCard(entry, index, s));
        }
        if (!myFilled) {
            fragment.appendChild(createDoubleDiaryEmptyCard(entry, index, s, '你未填写今日日记'));
        }
        if (otherFilled) {
            fragment.appendChild(createDoubleDiarySectionCard(entry, index, s, false, escapeHtml(otherNick) + '的日记'));
        }
        if (myFilled) {
            fragment.appendChild(createDoubleDiarySectionCard(entry, index, s, true, escapeHtml(myNick) + '的日记'));
        }
        return fragment;
    }

    function _applyDoubleDiaryCardTheme(card, s) {
        // 双人日记使用独立背景，不受日记设置中的功能区域背景影响
        if (s.doubleDiaryBgImage) card.style.background = 'url(' + s.doubleDiaryBgImage + ') center/cover no-repeat';
        if (s.ddCardBorderColor) card.style.borderColor = s.ddCardBorderColor;
        else if (s.cardBorderColor) card.style.borderColor = s.cardBorderColor;
        if (s.textColor) card.style.color = s.textColor;
        if (s.fontFamily) card.style.fontFamily = s.fontFamily;
    }

    function createDoubleDiarySectionCard(entry, index, s, isMyData, titleText) {
        const card = document.createElement('div');
        card.className = 'double-diary-form';
        _applyDoubleDiaryCardTheme(card, s);

        const title = document.createElement('div');
        title.className = 'dd-title';
        title.textContent = titleText;
        card.appendChild(title);

        card.appendChild(createDDDetailSection(titleText, isMyData ? entry.myData : entry.otherData, isMyData));

        const footer = document.createElement('div');
        footer.className = 'dd-footer';
        footer.innerHTML = '<span>' + (entry.dateStr || getDiaryDateStr(entry.time)) + '</span>';
        card.appendChild(footer);

        card.onclick = () => openDoubleDiaryDetail(index);
        return card;
    }

    function createDoubleDiaryEmptyCard(entry, index, s, titleText) {
        const card = document.createElement('div');
        card.className = 'double-diary-form';
        _applyDoubleDiaryCardTheme(card, s);

        const title = document.createElement('div');
        title.className = 'dd-title';
        title.textContent = titleText;
        card.appendChild(title);

        const body = document.createElement('div');
        body.className = 'dd-detail-section';
        body.innerHTML = '<div style="text-align:center;color:#b0c4d8;font-size:13px;padding:16px 0;">你未填写今日日记</div>';
        card.appendChild(body);

        const footer = document.createElement('div');
        footer.className = 'dd-footer';
        const writeBtn = document.createElement('button');
        writeBtn.className = 'dd-write-btn';
        writeBtn.textContent = '填写我的';
        writeBtn.onclick = (e) => {
            e.stopPropagation();
            openDoubleDiaryWrite(index);
        };
        footer.appendChild(writeBtn);
        card.appendChild(footer);

        card.onclick = () => openDoubleDiaryWrite(index);
        return card;
    }

    function createDoubleDiarySummonCard(entry, index, s) {
        const otherNick = appData.chatSettings.otherNickname || '对方';
        const card = document.createElement('div');
        card.className = 'double-diary-form';
        card.style.background = '#fff5f5';
        if (s.cardBorderColor) card.style.borderColor = '#ffd0d0';
        if (s.textColor) card.style.color = s.textColor;
        if (s.fontFamily) card.style.fontFamily = s.fontFamily;

        const title = document.createElement('div');
        title.className = 'dd-title';
        title.textContent = '对方未填写今日日记';
        card.appendChild(title);

        const body = document.createElement('div');
        body.className = 'dd-detail-section';
        body.innerHTML = '<div style="text-align:center;color:#d68a8a;font-size:13px;padding:10px 0;">快dd ' + escapeHtml(otherNick) + ' 来写今日日记吧~</div>';
        card.appendChild(body);

        const footer = document.createElement('div');
        footer.className = 'dd-footer';
        footer.style.justifyContent = 'center';
        const summonBtn = document.createElement('button');
        summonBtn.className = 'dd-summon-btn' + (entry.summoned ? ' summoned' : '');
        summonBtn.textContent = entry.summoned ? '已dd' : 'dd' + otherNick;
        summonBtn.onclick = (e) => {
            e.stopPropagation();
            summonDoubleDiaryOther(index, summonBtn);
        };
        footer.appendChild(summonBtn);
        card.appendChild(footer);

        return card;
    }

    function createDDDetailSection(titleText, data, isMyData) {
        const section = document.createElement('div');
        section.className = 'dd-detail-section';
        const title = document.createElement('div');
        title.className = 'dd-detail-section-title';
        title.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a90d9" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>' + escapeHtml(titleText);
        section.appendChild(title);

        let fields;
        if (isMyData) {
            // 我的填写字段 - 按用户新定义
            fields = [
                ['你的姓名', data.myName],
                ['当前时间', data.currentTime],
                ['你的心情', data.myMood],
                ['喜欢程度', data.loveLevel],
                ['食欲状态', data.appetite],
                ['出门频率', data.goOut],
                ['今日早餐', data.breakfast],
                ['今日午餐', data.lunch],
                ['今日晚餐', data.dinner],
                ['今日水果', data.fruit],
                ['今日遛狗', data.walkDog],
                ['今日遛猫', data.walkCat],
                ['今日喂猫', data.feedCat],
                ['今日喂狗', data.feedDog],
                ['今日洗澡', data.bath],
                ['起床时间', data.wakeTime],
                ['今日熬夜', data.stayUp],
                ['今日状态', data.workStatus],
                ['今日穿搭', data.outfit],
                ['今日色系', data.colorScheme],
                ['幸运数字', data.luckyNumber],
                ['想念程度', data.missLevel],
                ['想我来找你', data.comeToMe],
                ['想对方陪睡', data.sleepWithMe],
                ['气温体感', data.bodyTemp],
                ['今日饮品', data.drink],
                ['单曲循环', data.songLoop],
                ['最想说的话', data.wantToSay],
                ['心情底色', data.moodColor],
                ['睡前想告诉你', data.bedTimeWords]
            ];
        } else {
            // 对方填写字段 - 原有逻辑不变
            fields = [
                ['食欲状态', data.appetite],
                ['出门频率', data.goOut],
                ['今日口味', data.taste],
                ['今日水果', data.fruit],
                ['今日遛狗', data.walkDog],
                ['今日遛猫', data.walkCat],
                ['今日喂猫', data.feedCat],
                ['今日喂狗', data.feedDog],
                ['今日洗澡', data.bath],
                ['起床时间', data.wakeTime],
                ['今日熬夜', data.stayUp],
                ['工作状态', data.workStatus],
                ['今日穿搭', data.outfit],
                ['今日色系', data.colorScheme],
                ['幸运数字', data.luckyNumber],
                ['想念程度', data.missLevel],
                ['是否来找我', data.comeToMe],
                ['是否陪我睡', data.sleepWithMe],
                ['气温体感', data.bodyTemp],
                ['歌曲循环', data.songType],
                ['睡前想告诉你', data.bedTimeWords]
            ];
        }
        fields.forEach(([label, value]) => {
            const field = document.createElement('div');
            field.className = 'dd-detail-field';
            field.innerHTML = '<span class="dd-detail-field-label">' + label + '</span><span class="dd-detail-field-value">' + escapeHtml(value || '—') + '</span>';
            section.appendChild(field);
        });
        return section;
    }

    // 双人日记详情
    function openDoubleDiaryDetail(index) {
      try {
        if (!appData.diary || !Array.isArray(appData.diary.doubleList)) return;
        // Bug1：按 entry.id 标识定位（参数名沿用 index 兼容旧调用，实为 id）
        const entry = getDoubleDiaryEntryById(index);
        if (!entry) return;
        appData.currentViewingDiary = { id: entry.id, tab: 'double' };
        const otherNick = appData.chatSettings.otherNickname || '对方';
        const myNick = appData.chatSettings.myNickname || '我';
        const otherFilled = hasDoubleDiaryData(entry.otherData);
        const myFilled = hasDoubleDiaryData(entry.myData);
        document.getElementById('diaryDetailTitle').textContent = '双人日记 · ' + (entry.dateStr || getDiaryDateStr(entry.time));
        const detailContent = document.getElementById('diaryDetailContent');
        let html = '';
        // 对方区域优先显示
        if (otherFilled) {
            html += createDDDetailSectionHTML(otherNick + '的日记', entry.otherData, false);
        } else {
            html += '<div class="dd-detail-section"><div class="dd-detail-section-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a90d9" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' + escapeHtml(otherNick) + '的日记</div><div class="dd-detail-empty">等待对方填写...</div></div>';
        }
        // 我的区域
        if (myFilled) {
            html += createDDDetailSectionHTML(myNick + '的日记', entry.myData, true);
        }
        detailContent.innerHTML = html;
        document.getElementById('diaryDetailModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
        const doubleModalContent = document.querySelector('#diaryDetailModal .modal-content');
        applyDetailModalStyle(doubleModalContent, appData.diary.settings);
        // 双人日记不支持句子模式，隐藏"下一句"按钮
        var nextBtn = document.getElementById('diaryNextSentenceBtn');
        if (nextBtn) nextBtn.style.display = 'none';
      } catch (e) { console.error('openDoubleDiaryDetail失败:', e); }
    }

    function createDDDetailSectionHTML(titleText, data, isMyData) {
        let fields;
        if (isMyData) {
            // 我的填写字段
            fields = [
                ['你的姓名', data.myName], ['当前时间', data.currentTime], ['你的心情', data.myMood],
                ['喜欢程度', data.loveLevel], ['食欲状态', data.appetite], ['出门频率', data.goOut],
                ['今日早餐', data.breakfast], ['今日午餐', data.lunch], ['今日晚餐', data.dinner],
                ['今日水果', data.fruit], ['今日遛狗', data.walkDog], ['今日遛猫', data.walkCat],
                ['今日喂猫', data.feedCat], ['今日喂狗', data.feedDog], ['今日洗澡', data.bath],
                ['起床时间', data.wakeTime], ['今日熬夜', data.stayUp], ['今日状态', data.workStatus],
                ['今日穿搭', data.outfit], ['今日色系', data.colorScheme], ['幸运数字', data.luckyNumber],
                ['想念程度', data.missLevel], ['想我来找你', data.comeToMe], ['想对方陪睡', data.sleepWithMe],
                ['气温体感', data.bodyTemp], ['今日饮品', data.drink], ['单曲循环', data.songLoop],
                ['最想说的话', data.wantToSay], ['心情底色', data.moodColor], ['睡前想告诉你', data.bedTimeWords]
            ];
        } else {
            // 对方填写字段
            fields = [
                ['食欲状态', data.appetite], ['出门频率', data.goOut], ['今日口味', data.taste],
                ['今日水果', data.fruit], ['今日遛狗', data.walkDog], ['今日遛猫', data.walkCat],
                ['今日喂猫', data.feedCat], ['今日喂狗', data.feedDog], ['今日洗澡', data.bath],
                ['起床时间', data.wakeTime], ['今日熬夜', data.stayUp], ['工作状态', data.workStatus],
                ['今日穿搭', data.outfit], ['今日色系', data.colorScheme], ['幸运数字', data.luckyNumber],
                ['想念程度', data.missLevel], ['是否来找我', data.comeToMe], ['是否陪我睡', data.sleepWithMe],
                ['气温体感', data.bodyTemp], ['歌曲循环', data.songType], ['睡前想告诉你', data.bedTimeWords]
            ];
        }
        let html = '<div class="dd-detail-section"><div class="dd-detail-section-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a90d9" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>' + escapeHtml(titleText) + '</div>';
        fields.forEach(([label, value]) => {
            html += '<div class="dd-detail-field"><span class="dd-detail-field-label">' + label + '</span><span class="dd-detail-field-value">' + escapeHtml(value || '—') + '</span></div>';
        });
        html += '</div>';
        return html;
    }
    function getDiaryDateStr(ts) {
        const d = new Date(ts || Date.now());
        const days = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
        return (d.getMonth()+1) + '月' + d.getDate() + '日 ' + days[d.getDay()];
    }
    function getDiaryDayStr(ts) {
        const d = new Date(ts || Date.now());
        const days = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
        return days[d.getDay()];
    }
    var writeDiarySelectedTag = '';
    var writeDiarySelectedMood = '';
    var writeDiarySelectedWeather = '';
    function openWriteDiary() {
      try {
        const s = appData.diary.settings;
        document.getElementById('writeDiaryText').value = '';
        writeDiarySelectedTag = '';
        writeDiarySelectedMood = '';
        writeDiarySelectedWeather = '';
        // 日期
        document.getElementById('writeDiaryDate').textContent = '日期：' + getDiaryDateStr(Date.now());
        // 标签
        const tagRow = document.getElementById('writeDiaryTagRow');
        tagRow.innerHTML = '';
        (s.tags || []).forEach(tag => {
            const pill = document.createElement('div');
            pill.className = 'diary-write-tag-pill';
            pill.textContent = tag;
            pill.onclick = () => {
                writeDiarySelectedTag = (writeDiarySelectedTag === tag) ? '' : tag;
                renderWriteDiaryTags();
            };
            tagRow.appendChild(pill);
        });
        const addPill = document.createElement('div');
        addPill.className = 'diary-write-tag-pill add-tag';
        addPill.textContent = '+ 添加标签';
        addPill.onclick = () => {
            const newTag = prompt('请输入新标签名称：');
            if (newTag && newTag.trim() && !(s.tags || []).includes(newTag.trim())) {
                s.tags = s.tags || [];
                s.tags.push(newTag.trim());
                saveData();
                writeDiarySelectedTag = newTag.trim();
                renderWriteDiaryTags();
            }
        };
        tagRow.appendChild(addPill);
        renderWriteDiaryTags();
        // 天气 - 使用图标
        renderWriteDiaryIcons('weather', s.weatherEmojis || []);
        // 心情 - 使用图标
        renderWriteDiaryIcons('mood', s.moodEmojis || []);
        document.getElementById('writeDiaryModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
      } catch (e) { console.error('openWriteDiary失败:', e); }
    }
    function renderWriteDiaryTags() {
        const tagRow = document.getElementById('writeDiaryTagRow');
        tagRow.querySelectorAll('.diary-write-tag-pill').forEach(p => {
            p.classList.toggle('selected', p.textContent === writeDiarySelectedTag);
        });
    }
    function renderWriteDiaryIcons(type, list) {
        const container = document.getElementById(type === 'weather' ? 'writeDiaryWeatherPicker' : 'writeDiaryMoodPicker');
        container.innerHTML = '';
        list.forEach(name => {
            const item = document.createElement('div');
            item.className = 'diary-write-icon-item';
            const iconUrl = getDiaryIcon(type, name);
            let innerHtml = '';
            if (iconUrl) innerHtml += '<img src="' + iconUrl + '" alt="' + name + '">';
            innerHtml += name;
            item.innerHTML = innerHtml;
            item.onclick = () => {
                if (type === 'weather') {
                    writeDiarySelectedWeather = (writeDiarySelectedWeather === name) ? '' : name;
                } else {
                    writeDiarySelectedMood = (writeDiarySelectedMood === name) ? '' : name;
                }
                container.querySelectorAll('.diary-write-icon-item').forEach(el => el.classList.remove('selected'));
                if ((type === 'weather' && writeDiarySelectedWeather) || (type === 'mood' && writeDiarySelectedMood)) {
                    item.classList.add('selected');
                }
            };
            container.appendChild(item);
        });
        const addBtn = document.createElement('div');
        addBtn.className = 'diary-write-icon-item';
        addBtn.style.color = '#a0b8d0';
        addBtn.textContent = '+';
        addBtn.title = '添加';
        addBtn.onclick = () => {
            const name = prompt('请输入名称（如：开心、晴天）：');
            if (name && name.trim()) {
                const s = appData.diary.settings;
                if (type === 'weather') {
                    s.weatherEmojis = s.weatherEmojis || [];
                    if (!s.weatherEmojis.includes(name.trim())) { s.weatherEmojis.push(name.trim()); saveData(); }
                    writeDiarySelectedWeather = name.trim();
                } else {
                    s.moodEmojis = s.moodEmojis || [];
                    if (!s.moodEmojis.includes(name.trim())) { s.moodEmojis.push(name.trim()); saveData(); }
                    writeDiarySelectedMood = name.trim();
                }
                renderWriteDiaryIcons(type, type === 'weather' ? s.weatherEmojis : s.moodEmojis);
            }
        };
        container.appendChild(addBtn);
    }
    function closeWriteDiary() {
        document.getElementById('writeDiaryModal').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }
    function saveDiary() {
      try {
        const text = document.getElementById('writeDiaryText').value.trim();
        if (!text) return;
        const tab = appData.diary.currentTab;
        if (tab === 'single') {
            // 单人日记 - 保存并触发对方字卡回复
            const newDiary = {
                id: Date.now(),
                sender: 'mine',
                content: text,
                hidden: false,
                time: Date.now(),
                tag: writeDiarySelectedTag || '',
                mood: writeDiarySelectedMood || '',
                weather: writeDiarySelectedWeather || '',
                reply: '',
                replyTime: null,
                dateStr: getDiaryDateStr(Date.now()),
                dayStr: getDiaryDayStr(Date.now())
            };
            if (!appData.diary.singleList) appData.diary.singleList = [];
            appData.diary.singleList.unshift(newDiary);
            saveDataSync();
            // 局部更新：只插入新日记卡片，不重建列表（规则5）
            var _diaryPage = document.getElementById('diaryPage');
            if (_diaryPage && _diaryPage.style.display === 'flex' && tab === 'single') {
                var _container = document.getElementById('diaryList');
                if (_container) {
                    var _s = appData.diary.settings;
                    var _newCard = createDiaryCard(newDiary, 0, _s);
                    if (newDiary.tag) {
                        // 有标签：找到对应标签组标题，插入其后
                        var _headers = _container.querySelectorAll('.diary-tag-group-header');
                        var _foundHeader = null;
                        for (var h = 0; h < _headers.length; h++) {
                            if (_headers[h].textContent.indexOf(newDiary.tag) >= 0) { _foundHeader = _headers[h]; break; }
                        }
                        if (_foundHeader) {
                            _container.insertBefore(_newCard, _foundHeader.nextSibling);
                        } else {
                            // 标签组不存在：创建新标题并插入到容器最前面
                            var _newHeader = document.createElement('div');
                            _newHeader.className = 'diary-tag-group-header';
                            _newHeader.innerHTML = '<svg class="diary-group-icon" viewBox="0 0 24 24" fill="none" stroke="#4a90d9" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>' + escapeHtml(newDiary.tag);
                            _container.insertBefore(_newHeader, _container.firstChild);
                            _container.insertBefore(_newCard, _newHeader.nextSibling);
                        }
                    } else {
                        // 无标签：插入到末尾
                        _container.appendChild(_newCard);
                    }
                }
            }
            // 触发对方字卡回复（有概率回复，概率由设置中的replyProb决定，默认80%）
            triggerDiaryReply(newDiary.id);
        }
        closeWriteDiary();
      } catch (e) { console.error('saveDiary失败:', e); }
    }
    function openDiaryDetail(index) {
      try {
        const tab = appData.diary.currentTab;
        // 双人日记走专门的详情函数
        if (tab === 'double') {
            openDoubleDiaryDetail(index);
            return;
        }
        const list = tab === 'single' ? appData.diary.singleList : appData.diary.doubleList;
        if (!Array.isArray(list)) return;
        const diary = list[index];
        if (!diary) return;
        appData.currentViewingDiary = { index: index, tab: tab };
        const senderNick = diary.sender === 'mine' ? appData.chatSettings.myNickname : appData.chatSettings.otherNickname;
        const senderAvatar = diary.sender === 'mine' ? (appData.chatSettings.myAvatar || '') : (appData.chatSettings.otherAvatar || '');
        document.getElementById('diaryDetailTitle').textContent = senderNick + ' 的日记';
        const detailContent = document.getElementById('diaryDetailContent');
        const s = appData.diary.settings;
        const dateStr = diary.dateStr || getDiaryDateStr(diary.time);
        if (detailContent) {
            const weatherIcon = renderDiaryIconImg('weather', diary.weather);
            const moodIcon = renderDiaryIconImg('mood', diary.mood);
            let html =
                '<div style="font-size:13px;font-weight:600;color:#4a90d9;padding-bottom:6px;border-bottom:1px dashed #c8ddf0;margin-bottom:6px;display:flex;align-items:center;gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a90d9" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>'+escapeHtml(diary.tag || '未分类')+'</div>' +
                '<div style="display:flex;align-items:center;font-size:12px;color:#7a9cc6;gap:20px;padding-bottom:6px;border-bottom:1px dashed #e0ecf5;margin-bottom:8px;">' +
                '<span style="display:flex;align-items:center;gap:4px;">'+weatherIcon+(diary.weather || '—')+'</span>' +
                '<span style="display:flex;align-items:center;gap:4px;">'+moodIcon+(diary.mood || '—')+'</span>' +
                '<span style="margin-left:auto;">'+dateStr+'</span>' +
                '</div>';
            // 日记正文
            html += '<div class="diary-reply-label" style="margin-bottom:4px;">我的日记内容：</div>';
            html += '<div id="diaryDetailText" class="'+(s.rulerEnabled!==false?'diary-detail-ruled':'')+'" style="color:'+(s.textColor||'#4a5568')+';'+(s.fontFamily?'font-family:'+s.fontFamily+';':'')+'font-size:'+(s.fontSize||14)+'px;--ruler-gap:'+(s.rulerGap||32)+'px;--ruler-thickness:'+(s.rulerThickness||1)+'px;--ruler-color:'+(s.rulerColor||'rgba(160,200,240,0.2)')+';">'+renderDetailTextHtml(diary.content, s)+'</div>';
            // 对方回复区域（单人日记）
            if (diary.sender === 'mine') {
                if (diary.reply) {
                    /* Bug22修复：对方回复也使用 renderDetailTextHtml，使"一句一显示"对回复生效 */
                    html += '<div class="diary-reply-section" style="margin-top:12px;">' +
                        '<div class="diary-reply-label">对方的回复：</div>' +
                        '<div style="word-break:break-word;">'+renderDetailTextHtml(diary.reply, s)+'</div>' +
                        '</div>';
                } else {
                    html += '<div class="diary-reply-section waiting" style="margin-top:12px;">' +
                        '<div class="diary-reply-label">等待回复...</div>' +
                        '</div>';
                }
            }
            detailContent.innerHTML = html;
        }
        document.getElementById('diaryDetailModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
        const modalContent = document.querySelector('#diaryDetailModal .modal-content');
        applyDetailModalStyle(modalContent, s);
        if (modalContent) {
            if (s.bgImage) { modalContent.style.background = 'url('+s.bgImage+') center/cover no-repeat'; }
            else if (!s.modalBg) { modalContent.style.background = s.cardBg || '#fff'; }
            modalContent.style.color = s.textColor || '#4a5568';
            if (s.fontFamily) modalContent.style.fontFamily = s.fontFamily;
        }
        const nextBtn = document.getElementById('diaryNextSentenceBtn');
        if (nextBtn) {
            /* Bug22修复：开启"一句一显示"且有多句时显示"下一句"按钮 */
            nextBtn.style.display = (s.sentenceMode && splitSentences(diary.content).length > 1) ? 'inline' : 'none';
        }
      } catch (e) { console.error('openDiaryDetail失败:', e); }
    }
    function showNextDiarySentence() {
        const textEl = document.getElementById('diaryDetailText');
        if (!textEl) return;
        const spans = textEl.querySelectorAll('.detail-sentence');
        for (let i = 0; i < spans.length; i++) {
            if (spans[i].style.display === 'none') {
                spans[i].style.display = 'inline';
                break;
            }
        }
        // 全部显示后隐藏按钮
        let allVisible = true;
        for (let i = 0; i < spans.length; i++) {
            if (spans[i].style.display === 'none') { allVisible = false; break; }
        }
        if (allVisible) {
            const btn = document.getElementById('diaryNextSentenceBtn');
            if (btn) btn.style.display = 'none';
        }
    }
    function deleteCurrentDiary() {
        const info = appData.currentViewingDiary;
        if (!info) return;
        var deletedDiaryId = null;
        if (info.tab === 'double') {
            // Bug1：双人日记按 entry.id 定位再删除，避免索引错位删错条目
            const idx = getDoubleDiaryIndexById(info.id);
            if (idx < 0) { closeDiaryDetail(); return; }
            deletedDiaryId = appData.diary.doubleList[idx] ? appData.diary.doubleList[idx].id : null;
            appData.diary.doubleList.splice(idx, 1);
        } else {
            const list = appData.diary.singleList;
            deletedDiaryId = list[info.index] ? list[info.index].id : null;
            list.splice(info.index, 1);
        }
        saveDataSync();
        /* 局部更新：直接移除对应的 .diary-new-card（规则2），不调用 renderDiaryList */
        if (deletedDiaryId) {
            var _card = document.querySelector('.diary-new-card[data-diary-id="' + deletedDiaryId + '"]');
            if (_card) {
                // 检查是否需要移除孤立的标签分组标题
                var _prev = _card.previousElementSibling;
                var _next = _card.nextElementSibling;
                _card.remove();
                // 如果前一个是标题且后一个是标题或null（即该分组已无卡片），移除标题
                if (_prev && _prev.classList.contains('diary-tag-group-header') &&
                    (!_next || _next.classList.contains('diary-tag-group-header'))) {
                    _prev.remove();
                }
            } else {
                renderDiaryList();
            }
        } else {
            renderDiaryList();
        }
        closeDiaryDetail();
    }
    function editCurrentDiary(){
        const info=appData.currentViewingDiary;
        if(!info)return;
        // 双人日记：打开填写弹窗编辑结构化数据
        if(info.tab==='double'){
            closeDiaryDetail();
            // Bug1：按 entry.id 标识打开
            openDoubleDiaryWrite(info.id);
            return;
        }
        const list=info.tab==='single'?appData.diary.singleList:appData.diary.doubleList;
        const diary=list[info.index];
        if(!diary)return;
        const textEl=document.getElementById('diaryDetailText');
        if(!textEl)return;
        if(textEl.contentEditable==='true'){
            diary.content=textEl.innerText.trim();
            textEl.contentEditable='false';
            textEl.style.border='none';
            textEl.style.outline='none';
            saveDataSync();
            renderDiaryList();
            // Bug6：编辑完只更新弹窗内容（重新渲染为格式化文本），不关弹窗，让用户立即看到更新
            openDiaryDetail(info.index);
        }else{
            textEl.contentEditable='true';
            textEl.style.border='1px solid #e0e0e0';
            textEl.style.outline='none';
            textEl.style.borderRadius='4px';
            textEl.style.padding='4px';
            textEl.focus();
        }
    }
    function sendDiaryToChat() {
        const info = appData.currentViewingDiary;
        if (!info) return;
        var diary = null;
        if (info.tab === 'double') {
            // Bug1：双人日记按 entry.id 标识定位
            diary = getDoubleDiaryEntryById(info.id);
        } else {
            const list = appData.diary.singleList;
            diary = list[info.index];
        }
        if (!diary) return;
        var sendContent = '';
        var cardTitle = '日记分享';
        if (info.tab === 'double') {
            // 双人日记：将结构化数据格式化为文本
            sendContent = formatDoubleDiaryForChat(diary);
            cardTitle = '双人日记分享';
        } else {
            // 单人日记：直接发送内容
            sendContent = diary.content;
            cardTitle = '单人日记分享';
        }
        if (!sendContent) return;
        addMessage({
            id: Date.now(),
            sender: 'mine',
            type: 'diary-card',
            content: sendContent,
            cardTitle: cardTitle
        });
        closeDiaryDetail();
    }
    function formatDoubleDiaryForChat(entry) {
        var otherNick = appData.chatSettings.otherNickname || '对方';
        var myNick = appData.chatSettings.myNickname || '我';
        var lines = [];
        if (hasDoubleDiaryData(entry.otherData)) {
            lines.push('【' + otherNick + '的日记】');
            var otherFields = [
                ['食欲状态', entry.otherData.appetite], ['出门频率', entry.otherData.goOut],
                ['今日口味', entry.otherData.taste], ['今日水果', entry.otherData.fruit],
                ['起床时间', entry.otherData.wakeTime], ['今日熬夜', entry.otherData.stayUp],
                ['工作状态', entry.otherData.workStatus], ['今日穿搭', entry.otherData.outfit],
                ['今日色系', entry.otherData.colorScheme], ['幸运数字', entry.otherData.luckyNumber],
                ['想念程度', entry.otherData.missLevel], ['气温体感', entry.otherData.bodyTemp],
                ['睡前想告诉你', entry.otherData.bedTimeWords]
            ];
            otherFields.forEach(function(f){ if(f[1]) lines.push(f[0] + '：' + f[1]); });
        }
        if (hasDoubleDiaryData(entry.myData)) {
            lines.push('【' + myNick + '的日记】');
            var myFields = [
                ['你的姓名', entry.myData.myName], ['你的心情', entry.myData.myMood],
                ['喜欢程度', entry.myData.loveLevel], ['食欲状态', entry.myData.appetite],
                ['今日早餐', entry.myData.breakfast], ['今日午餐', entry.myData.lunch],
                ['今日晚餐', entry.myData.dinner], ['今日水果', entry.myData.fruit],
                ['起床时间', entry.myData.wakeTime], ['今日熬夜', entry.myData.stayUp],
                ['今日状态', entry.myData.workStatus], ['今日穿搭', entry.myData.outfit],
                ['今日色系', entry.myData.colorScheme], ['幸运数字', entry.myData.luckyNumber],
                ['想念程度', entry.myData.missLevel], ['最想说的话', entry.myData.wantToSay],
                ['心情底色', entry.myData.moodColor], ['睡前想告诉你', entry.myData.bedTimeWords]
            ];
            myFields.forEach(function(f){ if(f[1]) lines.push(f[0] + '：' + f[1]); });
        }
        return lines.join('\n');
    }
    function closeDiaryDetail() {
        document.getElementById('diaryDetailModal').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }

    // ========== 双人日记填写 ==========
    var ddWriteId = null; // Bug1：双人日记编辑目标改用 entry.id 标识
    var ddWriteData = {};

    function openDoubleDiaryWrite(index) {
      try {
        // Bug1：按 entry.id 标识定位（参数名沿用 index 兼容旧调用，实为 id）
        ddWriteId = index;
        if (!appData.diary || !Array.isArray(appData.diary.doubleList)) return;
        const entry = getDoubleDiaryEntryById(index);
        if (!entry) return;
        // 初始化填写数据 - 如果有对方数据，参考对方格式
        ddWriteData = entry.myData ? { ...entry.myData } : {};
        renderDoubleDiaryWriteFields();
        document.getElementById('doubleDiaryWriteModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
      } catch (e) { console.error('openDoubleDiaryWrite失败:', e); }
    }

    function renderDoubleDiaryWriteFields() {
      try {
        const container = document.getElementById('doubleDiaryWriteFields');
        if (!container) return;
        container.innerHTML = '';

        // 我的填写字段 - 按用户要求定义
        const fieldDefs = [
            { key: 'myName', label: '你的姓名', type: 'text', placeholder: '输入你的姓名' },
            { key: 'currentTime', label: '当前时间', type: 'text', placeholder: '如：14:30' },
            { key: 'myMood', label: '你的心情', type: 'text', placeholder: '如：开心、平静' },
            { key: 'loveLevel', label: '今日对' + (appData.chatSettings.otherNickname || '对方') + '的喜欢程度是', type: 'percent' },
            { key: 'appetite', label: '食欲状态', type: 'text', placeholder: '自由填写' },
            { key: 'goOut', label: '出门频率', type: 'text', placeholder: '自由填写' },
            { key: 'breakfast', label: '今日早餐', type: 'text', placeholder: '输入早餐或"未吃"' },
            { key: 'lunch', label: '今日午餐', type: 'text', placeholder: '输入午餐或"未吃"' },
            { key: 'dinner', label: '今日晚餐', type: 'text', placeholder: '输入晚餐或"未吃"' },
            { key: 'fruit', label: '今日水果', type: 'text', placeholder: '输入水果或"未吃"' },
            { key: 'walkDog', label: '今日遛狗', type: 'choice', options: ['是','否','无小狗'] },
            { key: 'walkCat', label: '今日遛猫', type: 'choice', options: ['是','否','无小猫'] },
            { key: 'feedCat', label: '今日喂猫', type: 'choice', options: ['是','否','无小猫'] },
            { key: 'feedDog', label: '今日喂狗', type: 'choice', options: ['是','否','无小狗'] },
            { key: 'bath', label: '今日洗澡', type: 'choice', options: ['是','否','正打算去'] },
            { key: 'wakeTime', label: '今日起床时间', type: 'text', placeholder: '如：7:30' },
            { key: 'stayUp', label: '今日熬夜', type: 'choiceOrText', options: ['是','否','看情况'] },
            { key: 'workStatus', label: '今日状态', type: 'choiceOrText', options: ['工作','休息','学习'] },
            { key: 'outfit', label: '今日穿搭', type: 'text', placeholder: '上衣+下衣+鞋子' },
            { key: 'colorScheme', label: '今日色系', type: 'text', placeholder: '如：蓝色系' },
            { key: 'luckyNumber', label: '今日幸运数字', type: 'text', placeholder: '数字或"我的幸运数字是你"' },
            { key: 'missLevel', label: '今日想念程度', type: 'percent' },
            { key: 'comeToMe', label: '今日是否想我来找你', type: 'choiceOrText', options: ['是','否','过段时间'] },
            { key: 'sleepWithMe', label: '今日是否想对方陪你睡觉', type: 'choiceOrText', options: ['想','不想','我等你','会来吗'] },
            { key: 'bodyTemp', label: '今日气温体感', type: 'choice', options: ['热','冷','刚好','想抱你'] },
            { key: 'drink', label: '今日饮品', type: 'text', placeholder: '如：奶茶、咖啡' },
            { key: 'songLoop', label: '今日单曲循环', type: 'text', placeholder: '如：歌名' },
            { key: 'wantToSay', label: '今日最想对你说的那句话', type: 'text', placeholder: '想说的话...' },
            { key: 'moodColor', label: '今日心情底色', type: 'text', placeholder: '如：温暖、忧郁' },
            { key: 'bedTimeWords', label: '睡前想告诉你', type: 'text', placeholder: '想说的话...' }
        ];

        fieldDefs.forEach(def => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'dd-write-field';
            const labelDiv = document.createElement('div');
            labelDiv.className = 'dd-write-field-label';
            labelDiv.textContent = def.label;
            fieldDiv.appendChild(labelDiv);

            if (def.type === 'choice') {
                const choicesDiv = document.createElement('div');
                choicesDiv.className = 'dd-write-choices';
                def.options.forEach(opt => {
                    const choice = document.createElement('div');
                    choice.className = 'dd-write-choice' + (ddWriteData[def.key] === opt ? ' selected' : '');
                    choice.textContent = opt;
                    choice.onclick = () => {
                        ddWriteData[def.key] = opt;
                        choicesDiv.querySelectorAll('.dd-write-choice').forEach(c => c.classList.remove('selected'));
                        choice.classList.add('selected');
                    };
                    choicesDiv.appendChild(choice);
                });
                fieldDiv.appendChild(choicesDiv);
            } else if (def.type === 'choiceOrText') {
                // 选项 + 自由填写文本框
                const choicesDiv = document.createElement('div');
                choicesDiv.className = 'dd-write-choices';
                def.options.forEach(opt => {
                    const choice = document.createElement('div');
                    choice.className = 'dd-write-choice' + (ddWriteData[def.key] === opt ? ' selected' : '');
                    choice.textContent = opt;
                    choice.onclick = () => {
                        ddWriteData[def.key] = opt;
                        choicesDiv.querySelectorAll('.dd-write-choice').forEach(c => c.classList.remove('selected'));
                        choice.classList.add('selected');
                        const txtInput = fieldDiv.querySelector('.dd-write-input');
                        if (txtInput) txtInput.value = '';
                    };
                    choicesDiv.appendChild(choice);
                });
                fieldDiv.appendChild(choicesDiv);
                const input = document.createElement('input');
                input.className = 'dd-write-input';
                input.type = 'text';
                input.placeholder = '或自由填写...';
                // 如果当前值不在选项中，显示在输入框
                if (ddWriteData[def.key] && !def.options.includes(ddWriteData[def.key])) {
                    input.value = ddWriteData[def.key];
                }
                input.oninput = () => {
                    ddWriteData[def.key] = input.value;
                    choicesDiv.querySelectorAll('.dd-write-choice').forEach(c => c.classList.remove('selected'));
                };
                fieldDiv.appendChild(input);
            } else if (def.type === 'percent') {
                const input = document.createElement('input');
                input.className = 'dd-write-input';
                input.type = 'number';
                input.min = '0';
                input.max = '100';
                input.placeholder = '0-100';
                input.value = ddWriteData[def.key] ? ddWriteData[def.key].replace('%','') : '';
                input.oninput = () => {
                    ddWriteData[def.key] = input.value + '%';
                };
                fieldDiv.appendChild(input);
            } else {
                const input = document.createElement('input');
                input.className = 'dd-write-input';
                input.type = 'text';
                input.placeholder = def.placeholder || '';
                input.value = ddWriteData[def.key] || '';
                input.oninput = () => {
                    ddWriteData[def.key] = input.value;
                };
                fieldDiv.appendChild(input);
            }
            container.appendChild(fieldDiv);
        });
      } catch (e) { console.error('renderDoubleDiaryWriteFields失败:', e); }
    }

    function closeDoubleDiaryWrite() {
        document.getElementById('doubleDiaryWriteModal').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }

    function saveDoubleDiary() {
      try {
        // Bug1：按 entry.id 标识定位编辑目标
        if (ddWriteId == null) return;
        if (!appData.diary || !Array.isArray(appData.diary.doubleList)) return;
        const entry = getDoubleDiaryEntryById(ddWriteId);
        if (!entry) return;
        entry.myData = { ...ddWriteData };
        entry.myFilled = true;
        entry.myUpdateTime = Date.now();
        // 同步保存（不可逆操作），避免防抖延迟导致数据丢失/白屏
        saveDataSync();
        closeDoubleDiaryWrite();
        renderDiaryList();
      } catch (e) { console.error('saveDoubleDiary失败:', e); }
    }

    function hexToRgba(hex, alpha) {
        const m = hex.replace('#','').match(/(.{2})/g);
        if (!m || m.length < 3) return 'rgba(0,0,0,' + alpha + ')';
        const r = parseInt(m[0], 16), g = parseInt(m[1], 16), b = parseInt(m[2], 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }
    function rgbToHexForColorInput(color) {
        if (!color) return '#e0e0e0';
        if (color.indexOf('#') === 0) return color;
        const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return '#e0e0e0';
        const toHex = (n) => { const h = parseInt(n).toString(16); return h.length === 1 ? '0'+h : h; };
        return '#' + toHex(m[1]) + toHex(m[2]) + toHex(m[3]);
    }
    function escapeHtml(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    }
    function splitSentences(text) {
        // 一句一显示：按字卡（换行符）分割，每个字卡单独一行显示
        // 如果没有换行符，尝试按句号、感叹号、问号分割
        var raw = String(text || '');
        var sentences = raw.split(/\n+/).map(function(s){ return s.trim(); }).filter(function(s){ return s; });
        if (sentences.length <= 1 && raw.trim()) {
            // 没有换行符，尝试按标点分割
            var punctSplit = raw.split(/([。！？!?\n]+)/).filter(function(s){ return s.trim(); });
            if (punctSplit.length > 1) {
                sentences = [];
                for (var i = 0; i < punctSplit.length; i += 2) {
                    var s = punctSplit[i] || '';
                    if (i + 1 < punctSplit.length) s += punctSplit[i + 1];
                    if (s.trim()) sentences.push(s.trim());
                }
            }
        }
        /* Bug22修复：以上方式仍只得到1句时，尝试按分号、逗号分割 */
        if (sentences.length <= 1 && raw.trim()) {
            var subSplit = raw.split(/([；;，,]+)/).filter(function(s){ return s.trim(); });
            if (subSplit.length > 1) {
                sentences = [];
                for (var j = 0; j < subSplit.length; j += 2) {
                    var part = subSplit[j] || '';
                    if (j + 1 < subSplit.length) part += subSplit[j + 1];
                    if (part.trim()) sentences.push(part.trim());
                }
            }
        }
        if (sentences.length === 0 && raw.trim()) sentences.push(raw.trim());
        return sentences;
    }
    function renderDetailTextHtml(text, s) {
        if (!s.sentenceMode) {
            return '<span style="white-space:pre-wrap;">' + escapeHtml(text).replace(/\n/g,'<br>') + '</span>';
        }
        const sentences = splitSentences(text);
        if (sentences.length <= 1) {
            return '<span style="white-space:pre-wrap;">' + escapeHtml(text).replace(/\n/g,'<br>') + '</span>';
        }
        let html = '';
        sentences.forEach((sen, idx) => {
            html += '<span class="detail-sentence" data-idx="' + idx + '" style="display:' + (idx === 0 ? 'block' : 'none') + ';margin-bottom:6px;">' + escapeHtml(sen).replace(/\n/g,'<br>') + '</span>';
        });
        return html;
    }
    function applyDetailModalStyle(modalContent, s) {
        if (!modalContent) return;
        // 应用用户设置的悬浮框宽度/高度（若未设置则使用默认值）
        const w = (s && typeof s.modalWidth === 'number') ? s.modalWidth : 86;
        const h = (s && typeof s.modalHeight === 'number') ? s.modalHeight : 92;
        modalContent.style.height = h + 'vh';
        modalContent.style.maxHeight = h + 'vh';
        modalContent.style.minHeight = h + 'vh';
        modalContent.style.width = w + '%';
        modalContent.style.maxWidth = w + '%';
        modalContent.style.minWidth = '0';
        modalContent.style.aspectRatio = 'auto';
        // 毛玻璃效果由全局设置控制，日记/信封不再单独开关
        modalContent.style.backdropFilter = '';
        modalContent.style.webkitBackdropFilter = '';
        if (s.modalBg) { modalContent.style.background = s.modalBg; }
        if (s.modalBorderColor) {
            modalContent.style.border = '2px solid ' + s.modalBorderColor;
        } else {
            modalContent.style.border = '';
        }
    }

    function openDiarySettings() {
      try {
        const s = appData.diary.settings;
        document.getElementById('diaryPageBg').value = s.pageBg || '#e8f4fd';
        document.getElementById('diaryCardBg').value = s.cardBg || '#ffffff';
        document.getElementById('diaryCardBorderColor').value = s.cardBorderColor || '#c8ddf0';
        document.getElementById('diaryTextColor').value = s.textColor || '#1a1a1a';
        document.getElementById('diaryFontSize').value = s.fontSize || 14;
        document.getElementById('diarySpliceMin').value = s.spliceMin;
        document.getElementById('diarySpliceMax').value = s.spliceMax;
        document.getElementById('diaryUrgeProb').value = s.urgeProb;
        document.getElementById('diaryReplyProb').value = s.replyProb !== undefined ? s.replyProb : 80;
        document.getElementById('diaryModalWidth').value = Math.min(s.modalWidth || 86, 95);
        document.getElementById('diaryModalWidthVal').textContent = Math.min(s.modalWidth || 86, 95) + '%';
        document.getElementById('diaryModalHeight').value = Math.min(s.modalHeight || 70, 90);
        document.getElementById('diaryModalHeightVal').textContent = Math.min(s.modalHeight || 70, 90) + 'vh';
        document.getElementById('diaryModalBg').value = s.modalBg || s.cardBg || '#ffffff';
        document.getElementById('diaryModalBorderColor').value = s.modalBorderColor || '#e0e0e0';
        document.getElementById('diaryRulerEnabled').checked = s.rulerEnabled !== false;
        document.getElementById('diaryRulerThickness').value = s.rulerThickness || 1;
        document.getElementById('diaryRulerThicknessVal').textContent = (s.rulerThickness || 1) + 'px';
        document.getElementById('diaryRulerColor').value = rgbToHexForColorInput(s.rulerColor || 'rgba(0,0,0,0.15)');
        document.getElementById('diarySentenceMode').checked = !!s.sentenceMode;
        const diaryCssTextarea = document.getElementById('diaryCustomCss');
        if (diaryCssTextarea) diaryCssTextarea.value = s.customCss || '';
        try { renderDiaryEmojiSettings('mood', s.moodEmojis || []); } catch(e) { console.error('renderDiaryEmojiSettings失败:', e); }
        try { renderDiaryEmojiSettings('weather', s.weatherEmojis || []); } catch(e) { console.error('renderDiaryEmojiSettings失败:', e); }
        try { renderDiaryTagSettings(); } catch(e) { console.error('renderDiaryTagSettings失败:', e); }
        try { renderCustomFontList('diary'); } catch(e) { console.error('renderCustomFontList失败:', e); }
        try { renderOutfitCardSettings(); } catch(e) { console.error('renderOutfitCardSettings失败:', e); }
        document.getElementById('diarySettingsModal').classList.add('show');
        document.getElementById('overlay').classList.add('show');
      } catch (e) { console.error('openDiarySettings失败:', e); }
      // 兜底：即使前面的步骤报错，也确保字卡区域被渲染
      setTimeout(function(){
          try { renderOutfitCardSettings(); } catch(e) { console.error('兜底renderOutfitCardSettings失败:', e); }
      }, 50);
    }
    function renderDiaryEmojiSettings(type, list) {
        const container = document.getElementById(type === 'mood' ? 'diaryMoodEmojiSettings' : 'diaryWeatherEmojiSettings');
        container.innerHTML = '';
        list.forEach((name, i) => {
            const item = document.createElement('div');
            item.style.cssText = 'cursor:pointer;padding:3px 8px;border-radius:8px;position:relative;display:flex;align-items:center;gap:4px;border:1px solid #c8ddf0;background:#fff;';
            const iconUrl = getDiaryIcon(type, name);
            if (iconUrl) {
                item.innerHTML = '<img src="' + iconUrl + '" style="width:18px;height:18px;" alt="' + name + '">';
            }
            const nameSpan = document.createElement('span');
            nameSpan.style.cssText = 'font-size:12px;color:#5a7a9c;';
            nameSpan.textContent = name;
            item.appendChild(nameSpan);
            item.title = '点击删除';
            item.onclick = () => {
                const s = appData.diary.settings;
                if (type === 'mood') { s.moodEmojis.splice(i, 1); renderDiaryEmojiSettings('mood', s.moodEmojis); }
                else { s.weatherEmojis.splice(i, 1); renderDiaryEmojiSettings('weather', s.weatherEmojis); }
                saveData();
            };
            container.appendChild(item);
        });
        const addBtn = document.createElement('div');
        addBtn.style.cssText = 'font-size:12px;color:#7a9cc6;cursor:pointer;padding:4px 10px;border:1px dashed #c8ddf0;border-radius:8px;background:#fff;';
        addBtn.textContent = '+ 添加';
        addBtn.onclick = () => {
            const name = prompt('请输入图标名称（如：开心、晴天）：');
            if (name && name.trim()) {
                const s = appData.diary.settings;
                if (type === 'mood') {
                    s.moodEmojis = s.moodEmojis || [];
                    if (!s.moodEmojis.includes(name.trim())) s.moodEmojis.push(name.trim());
                    renderDiaryEmojiSettings('mood', s.moodEmojis);
                } else {
                    s.weatherEmojis = s.weatherEmojis || [];
                    if (!s.weatherEmojis.includes(name.trim())) s.weatherEmojis.push(name.trim());
                    renderDiaryEmojiSettings('weather', s.weatherEmojis);
                }
                saveData();
            }
        };
        container.appendChild(addBtn);
    }
    function renderDiaryTagSettings() {
        const container = document.getElementById('diaryTagSettings');
        container.innerHTML = '';
        const s = appData.diary.settings;
        (s.tags || []).forEach((tag, i) => {
            const pill = document.createElement('div');
            pill.style.cssText = 'padding:4px 12px;border-radius:14px;font-size:12px;border:1px solid #ddd;background:#f5f5f5;color:#666;cursor:pointer;';
            pill.textContent = tag + ' ×';
            pill.title = '点击删除';
            pill.onclick = () => {
                s.tags.splice(i, 1);
                saveData();
                renderDiaryTagSettings();
            };
            container.appendChild(pill);
        });
        if ((s.tags || []).length === 0) {
            container.innerHTML = '<span style="font-size:12px;color:#999;">暂无标签</span>';
        }
    }
    function addDiaryTag() {
        const input = document.getElementById('diaryNewTagInput');
        const tag = input.value.trim();
        if (!tag) return;
        const s = appData.diary.settings;
        s.tags = s.tags || [];
        if (!s.tags.includes(tag)) {
            s.tags.push(tag);
            saveData();
            renderDiaryTagSettings();
        }
        input.value = '';
    }

