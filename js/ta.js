    // ========== Ta的传讯 App 逻辑 ==========
    (function(){
        /* ---------- 拼音映射表（300+） ---------- */
        const PINYIN_TABLE = {
            'a':'啊','ai':'爱','an':'安','ang':'昂','ao':'奥',
            'ba':'八','bai':'白','ban':'半','bang':'帮','bao':'宝','bei':'北','ben':'本','beng':'崩','bi':'比','bian':'变','biao':'表','bie':'别','bin':'宾','bing':'病','bo':'波','bu':'不',
            'ca':'擦','cai':'才','can':'参','cang':'藏','cao':'草','ce':'测','cen':'森','ceng':'层','ci':'次','cong':'从','cou':'凑','cu':'促','cuan':'窜','cui':'催','cun':'存','cuo':'错',
            'cha':'查','chai':'柴','chan':'产','chang':'长','chao':'朝','che':'车','chen':'辰','cheng':'城','chi':'吃','chong':'重','chou':'抽','chu':'出','chuai':'揣','chuan':'穿','chuang':'窗','chui':'吹','chun':'春','chuo':'戳',
            'da':'大','dai':'代','dan':'但','dang':'当','dao':'到','de':'的','dei':'得','deng':'等','di':'地','dian':'点','diao':'掉','die':'蝶','ding':'定','diu':'丢','dong':'东','dou':'都','du':'读','duan':'短','dui':'对','dun':'顿','duo':'多',
            'e':'额','en':'恩','er':'而',
            'fa':'发','fan':'反','fang':'方','fei':'飞','fen':'分','feng':'风','fo':'佛','fou':'否','fu':'服',
            'ga':'嘎','gai':'该','gan':'干','gang':'刚','gao':'高','ge':'个','gei':'给','gen':'跟','geng':'更','gong':'共','gou':'够','gu':'古','gua':'挂','guai':'乖','guan':'关','guang':'光','gui':'归','gun':'滚','guo':'过',
            'ha':'哈','hai':'还','han':'含','hang':'行','hao':'好','he':'和','hei':'黑','hen':'很','heng':'横','hong':'红','hou':'后','hu':'呼','hua':'花','huai':'坏','huan':'换','huang':'黄','hui':'回','hun':'婚','huo':'火',
            'ji':'几','jia':'家','jian':'见','jiang':'将','jiao':'叫','jie':'接','jin':'今','jing':'经','jiong':'窘','jiu':'就','ju':'句','juan':'卷','jue':'觉','jun':'军',
            'ka':'卡','kai':'开','kan':'看','kang':'康','kao':'考','ke':'可','ken':'肯','keng':'坑','kong':'空','kou':'口','ku':'苦','kua':'跨','kuai':'快','kuan':'宽','kuang':'矿','kui':'亏','kun':'困','kuo':'阔',
            'la':'拉','lai':'来','lan':'蓝','lang':'浪','lao':'老','le':'了','lei':'泪','leng':'冷','li':'里','lia':'俩','lian':'连','liang':'两','liao':'聊','lie':'列','lin':'临','ling':'零','liu':'留','long':'龙','lou':'楼','lu':'路','lv':'绿','luan':'乱','lun':'论','luo':'落',
            'ma':'吗','mai':'买','man':'满','mang':'忙','mao':'猫','me':'么','mei':'每','men':'门','meng':'梦','mi':'米','mian':'面','miao':'秒','mie':'灭','min':'民','ming':'明','miu':'谬','mo':'没','mou':'某','mu':'目',
            'na':'那','nai':'奶','nan':'南','nang':'囊','nao':'脑','ne':'呢','nei':'内','nen':'嫩','neng':'能','ni':'你','nian':'年','niang':'娘','niao':'鸟','nie':'捏','nin':'您','ning':'宁','niu':'牛','nong':'农','nu':'努','nv':'女','nuan':'暖','nuo':'诺',
            'ou':'欧',
            'pa':'怕','pai':'拍','pan':'盘','pang':'旁','pao':'跑','pei':'陪','pen':'盆','peng':'朋','pi':'皮','pian':'片','piao':'飘','pie':'撇','pin':'品','ping':'平','po':'破','pou':'剖','pu':'普',
            'qi':'七','qia':'恰','qian':'前','qiang':'强','qiao':'桥','qie':'切','qin':'亲','qing':'情','qiong':'穷','qiu':'秋','qu':'去','quan':'全','que':'却','qun':'群',
            'ran':'然','rang':'让','rao':'绕','re':'热','ren':'人','reng':'仍','ri':'日','rong':'容','rou':'肉','ru':'如','ruan':'软','rui':'锐','run':'润','ruo':'若',
            'sa':'撒','sai':'赛','san':'三','sang':'桑','sao':'扫','se':'色','sen':'森','seng':'僧','si':'四','song':'送','sou':'搜','su':'素','suan':'算','sui':'岁','sun':'孙','suo':'所',
            'sha':'沙','shai':'晒','shan':'山','shang':'上','shao':'少','she':'她','shei':'谁','shen':'深','sheng':'生','shi':'是','shou':'手','shu':'书','shua':'刷','shuai':'帅','shuan':'栓','shuang':'双','shui':'水','shun':'顺','shuo':'说',
            'ta':'他','tai':'太','tan':'谈','tang':'糖','tao':'逃','te':'特','teng':'疼','ti':'提','tian':'天','tiao':'条','tie':'贴','ting':'听','tong':'同','tou':'头','tu':'图','tuan':'团','tui':'推','tun':'吞','tuo':'脱',
            'wa':'瓦','wai':'外','wan':'完','wang':'望','wei':'为','wen':'问','weng':'翁','wo':'我','wu':'无',
            'xi':'西','xia':'下','xian':'先','xiang':'想','xiao':'小','xie':'写','xin':'心','xing':'星','xiong':'胸','xiu':'修','xu':'许','xuan':'选','xue':'学','xun':'寻',
            'ya':'呀','yan':'眼','yang':'阳','yao':'要','ye':'也','yi':'一','yin':'音','ying':'影','yo':'哟','yong':'永','you':'有','yu':'雨','yuan':'远','yue':'月','yun':'云',
            'za':'杂','zai':'在','zan':'赞','zang':'脏','zao':'早','ze':'则','zei':'贼','zen':'怎','zeng':'增','zi':'字','zong':'总','zou':'走','zu':'组','zuan':'钻','zui':'最','zun':'尊','zuo':'做',
            'zha':'扎','zhai':'摘','zhan':'展','zhang':'张','zhao':'找','zhe':'这','zhei':'这','zhen':'真','zheng':'正','zhi':'只','zhong':'中','zhou':'周','zhu':'住','zhua':'抓','zhuai':'拽','zhuan':'转','zhuang':'装','zhui':'追','zhun':'准','zhuo':'桌'
        };
        const PINYIN_KEYS = Object.keys(PINYIN_TABLE);
        const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const TIPS = [
            'Ta正在向你赶来中……','穿越次元中请稍候……','正在寻找TA的位置……',
            '信号不稳定正在增强，请耐心等待……','TA好像也在等你，好棒！',
            '链接宇宙信号中……','接收宇宙频率中……'
        ];

        /* ---------- 状态变量 ---------- */
        let taTimers = [];        // 所有需要清除的计时器
        let taState = 'idle';     // idle | loading | result | chatting
        let taPartnerName = '';
        let taCountdown = 0;      // 剩余秒数
        let taReplyLocked = true;
        let taCooldown = false;
        let taTypingActive = false;
        let taUsedTips = [];

        /* ---------- 工具函数 ---------- */
        function taClearAllTimers() {
            taTimers.forEach(id => { clearTimeout(id); clearInterval(id); });
            taTimers = [];
        }
        function taRand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
        function taEl(id) { return document.getElementById(id); }

        /* ---------- 星空粒子生成 ---------- */
        function taGenerateStars() {
            const container = taEl('taStarsBg');
            if (!container) return;
            container.innerHTML = '';
            for (let i = 0; i < 60; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.animationDelay = (Math.random() * 4) + 's';
                star.style.animationDuration = (2 + Math.random() * 3) + 's';
                const size = 1 + Math.random() * 2;
                star.style.width = size + 'px';
                star.style.height = size + 'px';
                container.appendChild(star);
            }
        }

        /* ---------- 摩斯密码表 ---------- */
        const MORSE_TABLE = {
            'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....',
            'I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.',
            'Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-',
            'Y':'-.--','Z':'--..',
            '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-',
            '5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'
        };
        /* 英文回复短语池（系统生成英文回复，转为摩斯密码发送） */
        const MORSE_PHRASES = [
            'I LOVE YOU','I MISS YOU','YOU ARE MY WORLD','FOREVER YOURS',
            'MY HEART IS YOURS','YOU COMPLETE ME','TOGETHER FOREVER',
            'YOU ARE MY SUNSHINE','ALWAYS BY YOUR SIDE','MY ONE AND ONLY',
            'I NEED YOU','YOU ARE BEAUTIFUL','HOLD MY HAND','NEVER LET GO',
            'DREAM OF YOU','YOU ARE MY EVERYTHING','STAY WITH ME',
            'I CHOOSE YOU','YOU ARE MY HOME','LOVE CONQUERS ALL',
            'BE MY VALENTINE','YOU LIGHT UP MY LIFE','I AM YOURS',
            'YOU MAKE ME HAPPY','THINKING OF YOU','YOU ARE MY STAR',
            'I CANNOT STOP LOVING YOU','YOU ARE MY DESTINY','MY LOVE GROWS',
            'WITH ALL MY HEART','YOU ARE MY ANGEL'
        ];

        /* ---------- 随机句子生成（词库拼接，上万种组合） ---------- */
        /* 按词性分库，每条消息从各词库随机抽词，按模板拼成有意义的英文句子 */
        /* 预设词库（不可删除），用户自定义词库通过词库管理 App 添加到 appData.taWordLib */
        const MW_PRESET = {
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
        /* 运行时获取合并后的词库（预设 + 用户自定义），每次调用都读取最新数据 */
        const MW = new Proxy({}, {
            get: function(target, prop) {
                var preset = MW_PRESET[prop] || [];
                var user = [];
                try {
                    if (typeof appData !== 'undefined' && appData.taWordLib && appData.taWordLib[prop]) {
                        user = appData.taWordLib[prop];
                    }
                } catch(e) {}
                return preset.concat(user);
            }
        });
        function mwPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
        /* 随机选一个模板填词，每个模板产生不同句式 */
        function taGenRandomSentence() {
            var templates = [
                function() { return mwPick(MW.subj) + ' ' + mwPick(MW.verb) + ' ' + mwPick(MW.obj) + ' ' + mwPick(MW.adv); },
                function() { return 'YOU ARE ' + mwPick(MW.adj); },
                function() { return 'YOU ARE ' + mwPick(MW.poss) + ' ' + mwPick(MW.noun); },
                function() { return mwPick(MW.adv).toUpperCase() + ' ' + mwPick(MW.verb) + ' YOU'; },
                function() { return 'LET US ' + mwPick(MW.verb) + ' ' + mwPick(MW.adv); },
                function() { return 'NEVER ' + mwPick(MW.verb) + ' ' + mwPick(MW.obj); },
                function() { return 'I WILL ' + mwPick(MW.verb) + ' YOU ' + mwPick(MW.adv); },
                function() { return mwPick(MW.poss).toUpperCase() + ' ' + mwPick(MW.noun) + ' IS ' + mwPick(MW.adj); },
                function() { return 'EVERY ' + mwPick(MW.noun) + ' WHISPERS ' + mwPick(MW.obj); },
                function() { return mwPick(MW.greet) + ' ' + mwPick(MW.subj) + ' ' + mwPick(MW.verb) + ' ' + mwPick(MW.obj); },
                function() { return 'YOU MAKE ME ' + mwPick(MW.adj).toUpperCase(); },
                function() { return mwPick(MW.subj) + ' KNOWS ' + mwPick(MW.obj); },
                function() { return 'STAY ' + mwPick(MW.adv) + ' WITH ' + mwPick(MW.obj); },
                function() { return 'THE ' + mwPick(MW.noun) + ' ' + mwPick(MW.verb) + ' ' + mwPick(MW.adv); },
                function() { return mwPick(MW.poss).toUpperCase() + ' ' + mwPick(MW.noun) + ' ' + mwPick(MW.verb) + ' ' + mwPick(MW.adv); },
                function() { return 'IN ' + mwPick(MW.poss).toUpperCase() + ' ' + mwPick(MW.noun) + ' I ' + mwPick(MW.verb); },
                function() { return 'COME ' + mwPick(MW.adv) + ' TO ' + mwPick(MW.obj); },
                function() { return mwPick(MW.obj).toUpperCase() + ' IS ' + mwPick(MW.poss) + ' ' + mwPick(MW.noun); }
            ];
            return templates[Math.floor(Math.random() * templates.length)]();
        }

        /* 将英文文本转为摩斯密码字符串，单词间用 / 分隔，字符间用空格分隔 */
        function taTextToMorse(text) {
            return text.split(' ').map(function(word) {
                return word.split('').map(function(ch) {
                    return MORSE_TABLE[ch.toUpperCase()] || '';
                }).filter(function(s){return s;}).join(' ');
            }).filter(function(s){return s;}).join(' / ');
        }

        /* ---------- 消息生成（摩斯密码） ---------- */
        /* 60% 随机拼接，30% 固定短语池，10% 双句拼接，保证强随机性 */
        function taGenMessage() {
            var english = '';
            var r = Math.random();
            if (r < 0.6) {
                /* 随机拼接：单句或双句 */
                english = taGenRandomSentence();
                if (Math.random() < 0.25) {
                    english += ' AND ' + taGenRandomSentence();
                }
            } else if (r < 0.9) {
                /* 固定短语池 */
                english = MORSE_PHRASES[Math.floor(Math.random() * MORSE_PHRASES.length)];
            } else {
                /* 双句拼接：短语 + 随机句 */
                english = MORSE_PHRASES[Math.floor(Math.random() * MORSE_PHRASES.length)]
                        + ' AND ' + taGenRandomSentence();
            }
            return { english: english, morse: taTextToMorse(english) };
        }

        /* ---------- 摩斯密码打字动画 ---------- */
        /* 点（.）短闪200ms，划（-）长闪600ms，字符间隔400ms，单词间隔（/）800ms */
        function taTypeMessage(msgData, callback) {
            taTypingActive = true;
            const typingEl = taEl('taTyping');
            const typingTextEl = taEl('taTypingText');
            typingEl.style.display = 'block';
            typingTextEl.textContent = '';
            const container = taEl('taMsgContainer');
            // 创建气泡
            const row = document.createElement('div');
            row.className = 'ta-msg-row them';
            const bubble = document.createElement('div');
            bubble.className = 'ta-msg-bubble ta-morse-bubble';
            const timeEl = document.createElement('div');
            timeEl.className = 'ta-msg-time';
            const now = new Date();
            timeEl.textContent = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
            row.appendChild(bubble);
            row.appendChild(timeEl);
            container.insertBefore(row, typingEl);

            var morse = msgData.morse || '';
            var english = msgData.english || '';
            var morseEl = document.createElement('span');
            morseEl.className = 'ta-morse-text';
            bubble.appendChild(morseEl);
            // 闪烁指示器
            var flashEl = document.createElement('span');
            flashEl.className = 'ta-morse-flash';
            bubble.appendChild(flashEl);

            var idx = 0;
            function flashNext() {
                if (idx >= morse.length) {
                    // 动画完成，隐藏打字指示器，添加解码按钮
                    typingEl.style.display = 'none';
                    taTypingActive = false;
                    flashEl.style.display = 'none';
                    // 解码按钮
                    var decodeBtn = document.createElement('button');
                    decodeBtn.className = 'ta-decode-btn';
                    decodeBtn.textContent = '解码';
                    decodeBtn.onclick = function() {
                        // 替换气泡内容为英文原文
                        bubble.innerHTML = '';
                        var decodedEl = document.createElement('span');
                        decodedEl.className = 'ta-morse-decoded';
                        decodedEl.textContent = english;
                        bubble.appendChild(decodedEl);
                    };
                    bubble.appendChild(decodeBtn);
                    // 存储摩斯密码（未解码状态）
                    taSaveMsg('them', morse, english);
                    taScrollToBottom();
                    if (callback) callback();
                    return;
                }
                var ch = morse[idx];
                if (ch === '.') {
                    morseEl.textContent += ch;
                    flashEl.classList.add('on');
                    var t = setTimeout(function() {
                        flashEl.classList.remove('on');
                        idx++;
                        var t2 = setTimeout(flashNext, 200); // 点短闪200ms后间隔
                        taTimers.push(t2);
                    }, 200);
                    taTimers.push(t);
                } else if (ch === '-') {
                    morseEl.textContent += ch;
                    flashEl.classList.add('on');
                    var t = setTimeout(function() {
                        flashEl.classList.remove('on');
                        idx++;
                        var t2 = setTimeout(flashNext, 200); // 划长闪600ms后间隔
                        taTimers.push(t2);
                    }, 600);
                    taTimers.push(t);
                } else if (ch === ' ') {
                    morseEl.textContent += ' ';
                    idx++;
                    var t = setTimeout(flashNext, 400); // 字符间隔400ms
                    taTimers.push(t);
                } else if (ch === '/') {
                    morseEl.textContent += ' / ';
                    idx++;
                    var t = setTimeout(flashNext, 800); // 单词间隔800ms
                    taTimers.push(t);
                } else {
                    idx++;
                    flashNext();
                }
            }
            flashNext();
        }

        /* ---------- 自动发消息循环 ---------- */
        function taStartAutoMsg() {
            if (taState !== 'chatting') return;
            const delay = taRand(10000, 15000);
            const t = setTimeout(() => {
                if (taState !== 'chatting') return;
                const msg = taGenMessage();
                taTypeMessage(msg, () => {
                    if (taState === 'chatting') taStartAutoMsg();
                });
            }, delay);
            taTimers.push(t);
        }

        /* ---------- 存储消息 ---------- */
        function taSaveMsg(from, text, extra) {
            try {
                const key = 'ta_chat_' + taPartnerName;
                let history = JSON.parse(localStorage.getItem(key) || '[]');
                var entry = { from: from, text: text, time: Date.now() };
                if (extra) entry.extra = extra; // extra: 摩斯密码原文或英文原文
                history.push(entry);
                // 最多保留200条
                if (history.length > 200) history = history.slice(-200);
                localStorage.setItem(key, JSON.stringify(history));
            } catch(e) {}
        }
        function taLoadHistory() {
            try {
                const key = 'ta_chat_' + taPartnerName;
                return JSON.parse(localStorage.getItem(key) || '[]');
            } catch(e) { return []; }
        }

        /* ---------- 渲染历史记录 ---------- */
        function taRenderHistory() {
            const container = taEl('taMsgContainer');
            const typingEl = taEl('taTyping');
            const history = taLoadHistory();
            history.forEach(m => {
                const row = document.createElement('div');
                row.className = 'ta-msg-row ' + (m.from === 'me' ? 'me' : 'them');
                const bubble = document.createElement('div');
                bubble.className = 'ta-msg-bubble';
                if (m.from === 'me') {
                    bubble.textContent = m.text;
                } else {
                    // 对方消息：显示摩斯密码 + 解码按钮
                    bubble.className = 'ta-msg-bubble ta-morse-bubble';
                    if (m.extra) {
                        // 有 extra = 摩斯密码消息
                        var morseEl = document.createElement('span');
                        morseEl.className = 'ta-morse-text';
                        morseEl.textContent = m.text;
                        bubble.appendChild(morseEl);
                        var decodeBtn = document.createElement('button');
                        decodeBtn.className = 'ta-decode-btn';
                        decodeBtn.textContent = '解码';
                        decodeBtn.onclick = function() {
                            bubble.innerHTML = '';
                            var decodedEl = document.createElement('span');
                            decodedEl.className = 'ta-morse-decoded';
                            decodedEl.textContent = m.extra;
                            bubble.appendChild(decodedEl);
                        };
                        bubble.appendChild(decodeBtn);
                    } else {
                        // 无 extra = 普通文本
                        bubble.textContent = m.text;
                    }
                }
                const timeEl = document.createElement('div');
                timeEl.className = 'ta-msg-time';
                const d = new Date(m.time);
                timeEl.textContent = d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
                row.appendChild(bubble);
                row.appendChild(timeEl);
                container.insertBefore(row, typingEl);
            });
            container.scrollTop = container.scrollHeight;
        }

        /* ---------- 倒计时 ---------- */
        function taStartCountdown(seconds) {
            taCountdown = seconds;
            taUpdateTimerDisplay();
            const t = setInterval(() => {
                if (taState !== 'chatting') return;
                taCountdown--;
                if (taCountdown <= 0) {
                    taCountdown = 0;
                    taUpdateTimerDisplay();
                    taDisconnect();
                    return;
                }
                taUpdateTimerDisplay();
            }, 1000);
            taTimers.push(t);
        }
        function taUpdateTimerDisplay() {
            const el = taEl('taTimerDisplay');
            if (!el) return;
            const h = Math.floor(taCountdown / 3600);
            const m = Math.floor((taCountdown % 3600) / 60);
            const s = taCountdown % 60;
            if (h > 0) {
                el.textContent = '剩余' + h + '小时' + m + '分';
            } else if (m > 0) {
                el.textContent = '剩余' + m + '分' + s.toString().padStart(2,'0') + '秒';
            } else {
                el.textContent = '剩余' + s + '秒';
            }
            if (taCountdown <= 10 && taCountdown > 0) {
                el.classList.add('warning');
            } else {
                el.classList.remove('warning');
            }
        }

        /* ---------- 断开 ---------- */
        function taDisconnect() {
            taState = 'disconnecting';
            taEl('taDisconnect').style.display = 'flex';
            const t = setTimeout(() => taCloseApp(), 2000);
            taTimers.push(t);
        }

        /* ---------- 请求宇宙允许回复 ---------- */
        window.taRequestReply = function() {
            if (taCooldown || !taReplyLocked || taState !== 'chatting') return;
            const btn = taEl('taRequestBtn');
            const cosmicMsg = taEl('taCosmicMsg');
            // 80% 被拒
            if (Math.random() < 0.8) {
                cosmicMsg.className = 'ta-cosmic-msg wait';
                cosmicMsg.textContent = '宇宙说再等等';
                const cd = taRand(15, 30);
                taCooldown = true;
                btn.classList.add('cooldown');
                let remaining = cd;
                btn.textContent = '再等' + remaining + '秒';
                const cdTimer = setInterval(() => {
                    remaining--;
                    if (remaining <= 0) {
                        clearInterval(cdTimer);
                        taCooldown = false;
                        btn.classList.remove('cooldown');
                        btn.textContent = '请求宇宙允许回复';
                        cosmicMsg.textContent = '';
                    } else {
                        btn.textContent = '再等' + remaining + '秒';
                    }
                }, 1000);
                taTimers.push(cdTimer);
            } else {
                // 20% 成功
                cosmicMsg.className = 'ta-cosmic-msg allow';
                cosmicMsg.textContent = '宇宙允许了';
                btn.classList.add('success-flash');
                setTimeout(() => btn.classList.remove('success-flash'), 600);
                taReplyLocked = false;
                taEl('taChatInput').disabled = false;
                taEl('taSendBtn').disabled = false;
                taEl('taChatInput').focus();
                // 隐藏请求按钮（可选：保留但不显示）
                btn.style.display = 'none';
            }
        };

        /* ---------- 发送消息 ---------- */
        window.taSendMsg = function() {
            const input = taEl('taChatInput');
            const text = input.value.trim();
            if (!text) return;
            input.value = '';
            // 重新锁定
            taReplyLocked = true;
            taEl('taChatInput').disabled = true;
            taEl('taSendBtn').disabled = true;
            // 恢复请求按钮
            const btn = taEl('taRequestBtn');
            btn.style.display = '';
            taEl('taCosmicMsg').textContent = '';
            // 创建气泡
            const container = taEl('taMsgContainer');
            const typingEl = taEl('taTyping');
            const row = document.createElement('div');
            row.className = 'ta-msg-row me';
            const bubble = document.createElement('div');
            bubble.className = 'ta-msg-bubble';
            bubble.textContent = text;
            const timeEl = document.createElement('div');
            timeEl.className = 'ta-msg-time';
            const now = new Date();
            timeEl.textContent = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
            row.appendChild(bubble);
            row.appendChild(timeEl);
            container.insertBefore(row, typingEl);
            taScrollToBottom();
            taSaveMsg('me', text);
            // 发送后系统生成摩斯密码回复
            const replyDelay = taRand(2000, 4000);
            const rt = setTimeout(() => {
                if (taState !== 'chatting') return;
                const msgData = taGenMessage();
                taTypeMessage(msgData, () => {
                    if (taState === 'chatting') taStartAutoMsg();
                });
            }, replyDelay);
            taTimers.push(rt);
        };

        /* ---------- 滚动管理：不自动跳转 + 回到最新按钮 ---------- */
        function taIsNearBottom() {
            var c = taEl('taMsgContainer');
            if (!c) return true;
            return c.scrollHeight - c.scrollTop - c.clientHeight < 80;
        }
        function taScrollToBottom(force) {
            var c = taEl('taMsgContainer');
            if (!c) return;
            if (force || taIsNearBottom()) {
                c.scrollTop = c.scrollHeight;
                var btn = taEl('taScrollBottomBtn');
                if (btn) btn.classList.remove('show');
            }
        }
        function taInitScrollListener() {
            var c = taEl('taMsgContainer');
            if (!c || c.dataset.scrollBound === '1') return;
            c.dataset.scrollBound = '1';
            c.addEventListener('scroll', function() {
                var btn = taEl('taScrollBottomBtn');
                if (!btn) return;
                if (taIsNearBottom()) {
                    btn.classList.remove('show');
                } else {
                    btn.classList.add('show');
                }
            });
        }

        /* ---------- 输入框监听 ---------- */
        function taInitInputListener() {
            const input = taEl('taNameInput');
            const btn = taEl('taStartBtn');
            input.addEventListener('input', function() {
                if (this.value.trim().length > 0) {
                    btn.classList.add('active');
                    btn.style.cursor = 'pointer';
                } else {
                    btn.classList.remove('active');
                    btn.style.cursor = 'not-allowed';
                }
            });
            // 发送框回车
            const chatInput = taEl('taChatInput');
            chatInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !this.disabled) {
                    e.preventDefault();
                    taSendMsg();
                }
            });
            // BlackBerry物理键盘点击事件
            const keyboard = taEl('taKeyboard');
            if (keyboard && !keyboard.dataset.bound) {
                keyboard.dataset.bound = '1';
                let shiftMode = false;
                keyboard.querySelectorAll('.ta-key').forEach(key => {
                    const handler = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const k = key.dataset.key;
                        if (!k) return;
                        // 找到当前焦点的输入框
                        let targetInput = null;
                        if (taState === 'chatting' && !taEl('taChatInput').disabled) {
                            targetInput = taEl('taChatInput');
                        } else if (taEl('taInputPage').style.display !== 'none') {
                            targetInput = taEl('taNameInput');
                        }
                        if (k === 'shift') {
                            shiftMode = !shiftMode;
                            key.style.background = shiftMode ? 'linear-gradient(180deg, #b8d8f0 0%, #a0c8e8 100%)' : '';
                            return;
                        }
                        if (k === 'back') {
                            if (targetInput) {
                                const pos = targetInput.selectionStart || targetInput.value.length;
                                if (pos > 0) {
                                    targetInput.value = targetInput.value.slice(0, pos - 1) + targetInput.value.slice(pos);
                                    targetInput.selectionStart = targetInput.selectionEnd = pos - 1;
                                    targetInput.dispatchEvent(new Event('input'));
                                }
                            }
                            return;
                        }
                        if (k === 'enter') {
                            if (taState === 'chatting' && !taEl('taChatInput').disabled) {
                                taSendMsg();
                            } else if (taEl('taInputPage').style.display !== 'none') {
                                if (taEl('taStartBtn').classList.contains('active')) taStartLink();
                            }
                            return;
                        }
                        if (k === 'home') {
                            // HOME键 - 关闭传讯app
                            taCloseApp();
                            return;
                        }
                        // 普通字符键
                        let char = k;
                        if (shiftMode) {
                            char = char.toUpperCase();
                            shiftMode = false;
                            const shiftKey = keyboard.querySelector('[data-key="shift"]');
                            if (shiftKey) shiftKey.style.background = '';
                        } else {
                            char = char.toLowerCase();
                        }
                        if (targetInput && !targetInput.disabled) {
                            const pos = targetInput.selectionStart || targetInput.value.length;
                            targetInput.value = targetInput.value.slice(0, pos) + char + targetInput.value.slice(pos);
                            targetInput.selectionStart = targetInput.selectionEnd = pos + 1;
                            targetInput.dispatchEvent(new Event('input'));
                            // 如果是名字输入框，触发按钮状态更新
                            if (targetInput.id === 'taNameInput') {
                                if (targetInput.value.trim().length > 0) {
                                    btn.classList.add('active');
                                    btn.style.cursor = 'pointer';
                                } else {
                                    btn.classList.remove('active');
                                    btn.style.cursor = 'not-allowed';
                                }
                            }
                        }
                    };
                    key.addEventListener('click', handler);
                });
            }
        }

        /* ---------- 开始链接流程 ---------- */
        window.taStartLink = function() {
            const input = taEl('taNameInput');
            const name = input.value.trim();
            if (!name) return;
            taPartnerName = name;
            taState = 'loading';
            // 隐藏输入页，显示加载页
            taEl('taInputPage').style.display = 'none';
            taEl('taLoadingPage').style.display = 'flex';
            taEl('taLoadName').textContent = name;
            // 进度条动画 11-23秒
            const duration = taRand(11, 23) * 1000;
            let progress = 0;
            taEl('taProgressFill').style.width = '0%';
            taEl('taProgressText').textContent = '0%';
            // 随机提示语
            taUsedTips = [];
            taShowRandomTip();
            const startTime = Date.now();
            const progressTimer = setInterval(() => {
                const elapsed = Date.now() - startTime;
                // 非线性增长
                // Bug17修复：用 Math.max 确保进度只增不减，避免随机因子导致卡在99%
                var _newProgress = Math.min(100, (elapsed / duration) * 100 * (0.8 + Math.random() * 0.4));
                progress = Math.max(progress, Math.min(100, Math.floor(_newProgress)));
                taEl('taProgressFill').style.width = progress + '%';
                taEl('taProgressText').textContent = progress + '%';
                // 随机更换提示语
                if (Math.random() < 0.15) taShowRandomTip();
                if (elapsed >= duration) {
                    clearInterval(progressTimer);
                    progress = 100;
                    taEl('taProgressFill').style.width = '100%';
                    taEl('taProgressText').textContent = '100%';
                    setTimeout(() => taShowResult(), 500);
                }
            }, 200);
            taTimers.push(progressTimer);
        };

        /* ---------- 随机提示语 ---------- */
        function taShowRandomTip() {
            if (taUsedTips.length >= TIPS.length) taUsedTips = [];
            let tip;
            do {
                tip = TIPS[Math.floor(Math.random() * TIPS.length)];
            } while (taUsedTips.includes(tip));
            taUsedTips.push(tip);
            taEl('taLoadingTip').textContent = tip;
        }

        /* ---------- 链接判定 ---------- */
        function taShowResult() {
            taState = 'result';
            taEl('taLoadingPage').style.display = 'none';
            taEl('taResultPage').style.display = 'flex';
            const resultText = taEl('taResultText');
            if (Math.random() < 0.5) {
                // 成功
                resultText.className = 'ta-result-text success';
                resultText.textContent = '链接成功';
                const t = setTimeout(() => taEnterChat(), 3000);
                taTimers.push(t);
            } else {
                // 失败
                resultText.className = 'ta-result-text fail';
                resultText.textContent = '链接失败，请重试';
                const t = setTimeout(() => taCloseApp(), 3000);
                taTimers.push(t);
            }
        }

        /* ---------- 进入聊天 ---------- */
        function taEnterChat() {
            taState = 'chatting';
            taEl('taResultPage').style.display = 'none';
            taEl('taChatPage').style.display = 'flex';
            taEl('taChatPartnerName').textContent = taPartnerName;
            // 加载历史
            taRenderHistory();
            // 重置回复状态
            taReplyLocked = true;
            taCooldown = false;
            taEl('taChatInput').disabled = true;
            taEl('taSendBtn').disabled = true;
            taEl('taRequestBtn').style.display = '';
            taEl('taRequestBtn').classList.remove('cooldown');
            taEl('taRequestBtn').textContent = '请求宇宙允许回复';
            taEl('taCosmicMsg').textContent = '';
            taEl('taCosmicMsg').className = 'ta-cosmic-msg';
            // 随机链接时长
            const tier = Math.random();
            let seconds;
            if (tier < 0.33) {
                seconds = taRand(5, 15);
            } else if (tier < 0.66) {
                seconds = taRand(60, 1200);
            } else {
                seconds = taRand(3600, 10800);
            }
            taStartCountdown(seconds);
            // 初始化滚动监听
            taInitScrollListener();
            // 开始自动发消息
            taStartAutoMsg();
        }

        /* ---------- 打开/关闭 ---------- */
        window.openTaApp = function() {
            taState = 'idle';
            taClearAllTimers();
            const page = taEl('taAppPage');
            page.style.display = 'flex';
            taEl('taInputPage').style.display = 'flex';
            taEl('taLoadingPage').style.display = 'none';
            taEl('taResultPage').style.display = 'none';
            taEl('taChatPage').style.display = 'none';
            taEl('taDisconnect').style.display = 'none';
            taEl('taNameInput').value = '';
            taEl('taStartBtn').classList.remove('active');
            taEl('taStartBtn').style.cursor = 'not-allowed';
            taEl('taChatInput').value = '';
            taEl('taChatInput').disabled = true;
            taEl('taSendBtn').disabled = true;
            taEl('taRequestBtn').style.display = '';
            taEl('taRequestBtn').classList.remove('cooldown');
            taEl('taRequestBtn').textContent = '请求宇宙允许回复';
            taEl('taCosmicMsg').textContent = '';
            taEl('taCosmicMsg').className = 'ta-cosmic-msg';
            // 清空聊天区（保留历史加载）
            const container = taEl('taMsgContainer');
            const typingEl = taEl('taTyping');
            container.innerHTML = '';
            container.appendChild(typingEl);
            typingEl.style.display = 'none';
            taGenerateStars();
            taInitInputListener();
            taEl('taNameInput').focus();
        };
        window.taCloseApp = function() {
            taState = 'idle';
            taClearAllTimers();
            taTypingActive = false;
            taReplyLocked = true;
            taCooldown = false;
            taEl('taAppPage').style.display = 'none';
        };

        /* ---------- 初始化事件绑定 ---------- */
        // 延迟到DOM加载后绑定Dock栏点击
        setTimeout(function() {
            const taDockItem = document.querySelector('[data-app="ta"]');
            if (taDockItem) {
                taDockItem.addEventListener('click', openTaApp);
            }
        }, 100);
    })();

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


