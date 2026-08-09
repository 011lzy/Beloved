    // ========== 默契生死局 App 逻辑 ==========
/* ==================================================================
 * 模块一：常量定义
 * ================================================================== */

/* 预置10道内置问卷 */
var MLSJ_PRESET_QUESTIONS = [
  { id: 'mlsj_preset_1', question: 'TA最希望你叫TA什么？', options: ['答案不在其中', '宝贝', '哥哥姐姐', 'TA的名字'], correctIndex: -1 },
  { id: 'mlsj_preset_2', question: 'TA最喜欢你用什么方式叫TA起床？', options: ['轻轻摇醒', '亲一口', '捏鼻子', '在耳边小声说"起床啦"'], correctIndex: -1 },
  { id: 'mlsj_preset_3', question: 'TA觉得最甜的情话是哪句？', options: ['我在呢', '想你了', '你是我的', '别怕，有我在'], correctIndex: -1 },
  { id: 'mlsj_preset_4', question: 'TA最希望你主动做的一件事是？', options: ['主动牵TA的手', '主动说"我想你"', '主动抱TA', '主动亲TA一下'], correctIndex: -1 },
  { id: 'mlsj_preset_5', question: 'TA最心动的身体接触是？', options: ['摸头', '十指相扣', '从背后抱住', '靠在肩膀上'], correctIndex: -1 },
  { id: 'mlsj_preset_6', question: 'TA觉得最有安全感的瞬间是？', options: ['你紧紧抱住TA', '你认真听TA说话', '你说"有我在"', '你主动找TA聊天'], correctIndex: -1 },
  { id: 'mlsj_preset_7', question: 'TA最希望你记住关于TA的事是？', options: ['TA的生日', 'TA爱吃和不爱吃的', 'TA说过的一句很重要的话', '你们在一起的纪念日'], correctIndex: -1 },
  { id: 'mlsj_preset_8', question: 'TA最喜欢的亲密时刻是？', options: ['睡前聊天', '一起看剧', '一起吃饭', '什么都不做就待在一起'], correctIndex: -1 },
  { id: 'mlsj_preset_9', question: 'TA最希望你夸TA什么？', options: ['好看', '温柔', '靠谱', '有趣'], correctIndex: -1 },
  { id: 'mlsj_preset_10', question: 'TA觉得自己在你面前最真实的瞬间是？', options: ['刚睡醒头发乱糟糟', '狼狈的时候', '尴尬的时候', '失败的时候'], correctIndex: -1 }
];

/* 甜蜜惩罚句子库（7句指定 + 10句生成） */
var MLSJ_PUNISH_SENTENCES = [
  '我爱你',
  '我喜欢你',
  '我是你一个人的',
  '我不能离开你',
  '我只属于你',
  '你是我的一切',
  '我会一直陪着你',
  '你的眼里只能有我一个',
  '我想赖在你身边永远不走',
  '你是我的专属宝藏谁也不给',
  '我不准你对别人笑得那么甜',
  '这辈子你都别想逃掉我了',
  '你就是我的整个世界',
  '我要把你的心牢牢锁起来',
  '没有我在身边你不许偷偷难过',
  '你的手只能给我一个人牵',
  '我赖定你了这辈子都不许推开我'
];

/* 评语库 */
function mlsjGetComment(acc) {
  if (acc >= 80) return '你们简直是天造地设的一对！心有灵犀，默契满分。';
  if (acc >= 60) return '默契不错，你们很懂彼此，继续加油哦。';
  if (acc >= 40) return '还需要多花点心思了解对方呢，下次会更好。';
  if (acc >= 20) return '看来你们还需要更多相处和磨合呀~';
  return '这默契……建议多聊聊天多陪伴彼此吧！';
}


/* ==================================================================
 * 模块二：状态与计时器管理
 * ================================================================== */

/* 全局运行时状态 */
var mlsjState = {
  screen: 'welcome',          // 当前屏幕
  selectedContact: null,      // 选中的联系人对象
  inviteCount: 0,             // 被拒绝次数
  inviteSeconds: 30,          // 邀请倒计时秒数
  gameLoadSeconds: 60,        // 调取问卷倒计时
  qIndex: 0,                  // 当前题目序号(0-9)
  totalQ: 10,                 // 总题数
  correctCount: 0,            // 正确次数
  punishCount: 0,             // 惩罚次数
  currentQ: null,             // 当前题目对象
  partnerAnswer: -1,          // 对方(系统随机)的答案
  questionSeconds: 30,        // 作答倒计时
  dangerSeconds: 10,          // 危险倒计时
  punishSentence: '',         // 当前惩罚句子
  punishProgress: 0,          // 惩罚已完成遍数
  inDanger: false,            // 是否在危险阶段
  usedQuestionIds: []         // 本局已抽取的问卷ID列表（防止重复）
};

/* 计时器注册表 —— 统一管理，关闭/切换时全部清理 */
var mlsjTimers = [];

function mlsjTimeout(fn, delay) {
  var id = setTimeout(fn, delay);
  mlsjTimers.push(id);
  return id;
}
function mlsjInterval(fn, delay) {
  var id = setInterval(fn, delay);
  mlsjTimers.push(id);
  return id;
}
function mlsjClearTimers() {
  for (var i = 0; i < mlsjTimers.length; i++) {
    try { clearTimeout(mlsjTimers[i]); } catch (e) {}
    try { clearInterval(mlsjTimers[i]); } catch (e) {}
  }
  mlsjTimers = [];
}


/* ==================================================================
 * 模块三：数据初始化与持久化
 * ================================================================== */

function mlsjInitData() {
  try {
    if (typeof appData === 'undefined') { window.appData = {}; }
    if (!appData.lifeDeathData) {
      appData.lifeDeathData = { questionBank: [], history: [], initialized: true };
    }
    if (!appData.lifeDeathData.questionBank) appData.lifeDeathData.questionBank = [];
    if (!appData.lifeDeathData.history) appData.lifeDeathData.history = [];
    /* 首次初始化：灌入预置问卷 */
    if (!appData.lifeDeathData.initialized || appData.lifeDeathData.questionBank.length === 0) {
      appData.lifeDeathData.questionBank = MLSJ_PRESET_QUESTIONS.map(function (q) {
        return { id: q.id, question: q.question, options: q.options.slice(), correctIndex: q.correctIndex };
      });
      appData.lifeDeathData.initialized = true;
      mlsjSave();
    }
  } catch (e) {
    console.error('[默契生死局] 数据初始化失败', e);
  }
}

function mlsjSave() {
  try {
    if (typeof saveData === 'function') { saveData(); }
  } catch (e) {
    console.error('[默契生死局] 保存失败', e);
  }
}

function mlsjGetContacts() {
  try {
    if (typeof appData !== 'undefined' && appData.contactList && appData.contactList.contacts) {
      return appData.contactList.contacts;
    }
  } catch (e) {}
  return [];
}

function mlsjGetBank() {
  try { return appData.lifeDeathData.questionBank || []; } catch (e) { return []; }
}


/* ==================================================================
 * 模块四：App 打开 / 关闭
 * ================================================================== */

function openLifeDeathApp() {
  mlsjInitData();
  mlsjClearTimers();
  mlsjResetState();
  var page = document.getElementById('lifeDeathPage');
  if (page) { page.style.display = 'flex'; }
  mlsjSwitchTab('game');
  mlsjRenderWelcome();
}

function closeLifeDeathApp() {
  mlsjClearTimers();
  var page = document.getElementById('lifeDeathPage');
  if (page) { page.style.display = 'none'; }
}

function mlsjResetState() {
  mlsjState.screen = 'welcome';
  mlsjState.selectedContact = null;
  mlsjState.inviteCount = 0;
  mlsjState.inviteSeconds = 30;
  mlsjState.gameLoadSeconds = 60;
  mlsjState.qIndex = 0;
  mlsjState.correctCount = 0;
  mlsjState.punishCount = 0;
  mlsjState.currentQ = null;
  mlsjState.partnerAnswer = -1;
  mlsjState.questionSeconds = 30;
  mlsjState.dangerSeconds = 10;
  mlsjState.punishSentence = '';
  mlsjState.punishProgress = 0;
  mlsjState.inDanger = false;
  mlsjState.usedQuestionIds = [];
}


/* ==================================================================
 * 模块五：标签切换
 * ================================================================== */

function mlsjSwitchTab(tab) {
  /* 切标签时清理游戏计时器，避免后台跑飞 */
  if (tab !== 'game') { mlsjClearTimers(); }
  var tabs = ['game', 'manage', 'history'];
  for (var i = 0; i < tabs.length; i++) {
    var t = document.getElementById('mlsj' + tabs[i].charAt(0).toUpperCase() + tabs[i].slice(1) + 'Tab');
    if (t) { t.classList.remove('active'); }
    var btn = document.querySelectorAll('.mlsj-tab');
    if (btn[i]) { btn[i].classList.remove('active'); }
  }
  var gameTab = document.getElementById('mlsjGameTab');
  var manageTab = document.getElementById('mlsjManageTab');
  var historyTab = document.getElementById('mlsjHistoryTab');
  var tabBtns = document.querySelectorAll('.mlsj-tab');
  if (tab === 'game') {
    if (gameTab) gameTab.classList.add('active');
    if (tabBtns[0]) tabBtns[0].classList.add('active');
  } else if (tab === 'manage') {
    if (manageTab) manageTab.classList.add('active');
    if (tabBtns[1]) tabBtns[1].classList.add('active');
    mlsjRenderManage();
  } else if (tab === 'history') {
    if (historyTab) historyTab.classList.add('active');
    if (tabBtns[2]) tabBtns[2].classList.add('active');
    mlsjRenderHistory();
  }
}

/* 获取游戏内容容器 */
function mlsjGameContainer() {
  return document.getElementById('mlsjGameTab');
}
/* 安全设置 innerHTML */
function mlsjSetGame(html) {
  var el = mlsjGameContainer();
  if (el) { el.innerHTML = html; }
}


/* ==================================================================
 * 模块六：邀请流程 —— 欢迎页 / 选联系人 / 邀请 / 同意拒绝
 * ================================================================== */

/* 6.1 欢迎页：选择游玩对象 */
function mlsjRenderWelcome() {
  mlsjState.screen = 'welcome';
  mlsjState.inviteCount = 0;
  var contacts = mlsjGetContacts();
  var html = '';
  html += '<div class="mlsj-card">';
  html += '<div class="mlsj-big-title">欢迎进入默契生死局</div>';
  html += '<div class="mlsj-subtitle">请选择你要与之一起游玩的对象</div>';
  if (contacts.length === 0) {
    html += '<div class="mlsj-empty-tip">请先在字卡中添加联系人</div>';
  } else {
    for (var i = 0; i < contacts.length; i++) {
      var c = contacts[i];
      var avatarHtml = mlsjAvatarHtml(c);
      html += '<div class="mlsj-contact-item" onclick="mlsjSelectContact(\'' + (c.id || i) + '\')">';
      html += '<div class="mlsj-avatar">' + avatarHtml + '</div>';
      html += '<div class="mlsj-contact-info">';
      html += '<div class="mlsj-contact-name">' + mlsjEscape(c.name || '未知') + '</div>';
      html += '<div class="mlsj-contact-remark">' + mlsjEscape(c.remark || '点击选择TA') + '</div>';
      html += '</div>';
      html += '</div>';
    }
  }
  html += '</div>';
  mlsjSetGame(html);
}

/* 生成头像 HTML */
function mlsjAvatarHtml(c) {
  if (c && c.avatar) {
    return '<img src="' + mlsjEscape(c.avatar) + '" alt="" onerror="this.style.display=\'none\'">';
  }
  var name = (c && c.name) ? c.name : '?';
  return mlsjEscape(name.charAt(0));
}

/* 6.2 选中联系人后：显示邀请准备页 + 30秒倒计时 */
function mlsjSelectContact(id) {
  var contacts = mlsjGetContacts();
  var found = null;
  for (var i = 0; i < contacts.length; i++) {
    if (String(contacts[i].id) === String(id)) { found = contacts[i]; break; }
  }
  if (!found) { found = contacts[0]; }
  mlsjState.selectedContact = found;
  mlsjState.inviteSeconds = 30;
  mlsjRenderInviteReady();
}

function mlsjRenderInviteReady() {
  mlsjState.screen = 'inviteReady';
  var name = mlsjState.selectedContact ? (mlsjState.selectedContact.name || '对方') : '对方';
  var html = '';
  html += '<div class="mlsj-card">';
  html += '<div class="mlsj-big-title">选择成功</div>';
  html += '<div class="mlsj-msg-strong">你有 30 秒的时间邀请对方与你一起进行游玩</div>';
  html += '<div class="mlsj-subtitle">已选择：' + mlsjEscape(name) + '</div>';
  html += '<div class="mlsj-countdown-sm" id="mlsjInviteCountdown">剩余 30 秒</div>';
  html += '<button class="mlsj-btn mlsj-btn-primary" onclick="mlsjInvite()">邀请</button>';
  html += '<button class="mlsj-btn mlsj-btn-ghost" onclick="mlsjRenderWelcome()">重新选择</button>';
  html += '</div>';
  mlsjSetGame(html);

  /* 30秒邀请时限倒计时 */
  mlsjClearTimers();
  mlsjInterval(function () {
    mlsjState.inviteSeconds--;
    var el = document.getElementById('mlsjInviteCountdown');
    if (el) { el.textContent = '剩余 ' + mlsjState.inviteSeconds + ' 秒'; }
    if (mlsjState.inviteSeconds <= 0) {
      mlsjClearTimers();
      /* 超时视为邀请失败，回到选择界面 */
      mlsjShowTempMsg('邀请超时了，请重新选择对象', 1800, function () { mlsjRenderWelcome(); });
    }
  }, 1000);
}

/* 6.3 点击邀请：发送邀请动画 → 随机同意/拒绝 */
function mlsjInvite() {
  mlsjClearTimers();
  mlsjState.screen = 'inviting';
  var html = '';
  html += '<div class="mlsj-card">';
  html += '<div class="mlsj-fetch-box">';
  html += '<div class="mlsj-fetch-icon">' + mlsjIconHeartSpin() + '</div>';
  html += '<div class="mlsj-fetch-text">正在向对方发送邀请</div>';
  html += '<div class="mlsj-loading-dots"><span>.</span><span>.</span><span>.</span></div>';
  html += '</div>';
  html += '</div>';
  mlsjSetGame(html);

  /* 2-3秒后判定 */
  mlsjTimeout(function () {
    var agree = Math.random() < 0.5;
    if (agree) {
      mlsjInviteAgreed();
    } else {
      mlsjInviteRefused();
    }
  }, 2000 + Math.floor(Math.random() * 1000));
}

/* 6.4 同意：倒计时 3、2、1 → 进入游戏 */
function mlsjInviteAgreed() {
  mlsjState.screen = 'agreed';
  mlsjState.inviteCount = 0;
  var html = '';
  html += '<div class="mlsj-card">';
  html += '<div class="mlsj-msg-strong">已同意你的邀请，即将进入……</div>';
  html += '<div class="mlsj-countdown" id="mlsjAgreedCountdown">3</div>';
  html += '</div>';
  mlsjSetGame(html);

  var n = 3;
  var el = document.getElementById('mlsjAgreedCountdown');
  if (el) { el.textContent = n; }
  mlsjInterval(function () {
    n--;
    var e = document.getElementById('mlsjAgreedCountdown');
    if (e) { e.textContent = n > 0 ? n : '进入'; }
    if (n <= 0) {
      mlsjClearTimers();
      mlsjEnterGame();
    }
  }, 1000);
}

/* 6.5 拒绝：判断是否三次 */
function mlsjInviteRefused() {
  mlsjState.inviteCount++;
  mlsjState.screen = 'refused';
  if (mlsjState.inviteCount >= 3) {
    mlsjInviteRefused3x();
  } else {
    var html = '';
    html += '<div class="mlsj-card">';
    html += '<div class="mlsj-msg-strong">对方拒绝了邀请，非常不听话！</div>';
    html += '<div class="mlsj-msg">让我们再邀请一次！</div>';
    html += '<div class="mlsj-subtitle">（已拒绝 ' + mlsjState.inviteCount + ' 次）</div>';
    html += '<button class="mlsj-btn mlsj-btn-primary" onclick="mlsjRenderInviteReady()">再次邀请</button>';
    html += '<button class="mlsj-btn mlsj-btn-ghost" onclick="mlsjRenderWelcome()">换个对象</button>';
    html += '</div>';
    mlsjSetGame(html);
  }
}

/* 6.6 拒绝三次：倒计时3、2、1 → 强制退出 */
function mlsjInviteRefused3x() {
  var html = '';
  html += '<div class="mlsj-card">';
  html += '<div class="mlsj-msg-strong">你邀请了对方三次，对方竟然都拒绝了！</div>';
  html += '<div class="mlsj-msg">这概率！天啊！快去买张彩票吧……</div>';
  html += '<div class="mlsj-countdown" id="mlsjExitCountdown">3</div>';
  html += '</div>';
  mlsjSetGame(html);

  var n = 3;
  mlsjInterval(function () {
    n--;
    if (n > 0) {
      var e = document.getElementById('mlsjExitCountdown');
      if (e) { e.textContent = n; }
    } else {
      mlsjClearTimers();
      mlsjShowForceExit();
    }
  }, 1000);
}

function mlsjShowForceExit() {
  var html = '';
  html += '<div class="mlsj-card">';
  html += '<div class="mlsj-msg-strong">你即将被系统强制退出</div>';
  html += '<div class="mlsj-loading-dots mlsj-center"><span>.</span><span>.</span><span>.</span></div>';
  html += '</div>';
  mlsjSetGame(html);
  mlsjTimeout(function () { closeLifeDeathApp(); }, 2000);
}

/* 临时消息提示，结束后回调 */
function mlsjShowTempMsg(msg, duration, callback) {
  var html = '';
  html += '<div class="mlsj-card">';
  html += '<div class="mlsj-msg">' + mlsjEscape(msg) + '</div>';
  html += '</div>';
  mlsjSetGame(html);
  mlsjTimeout(function () { if (typeof callback === 'function') callback(); }, duration);
}


/* ==================================================================
 * 模块七：游戏流程 —— 调取问卷 / 作答 / 判定
 * ================================================================== */

/* 7.1 进入游戏：欢迎语 + 60秒调取问卷倒计时 */
function mlsjEnterGame() {
  mlsjState.screen = 'gameLoad';
  mlsjState.qIndex = 0;
  mlsjState.correctCount = 0;
  mlsjState.punishCount = 0;
  mlsjState.usedQuestionIds = [];
  mlsjState.gameLoadSeconds = 60;

  var html = '';
  html += '<div class="mlsj-card">';
  html += '<div class="mlsj-big-title">恭喜你进入游玩界面！</div>';
  html += '<div class="mlsj-msg-strong">请等待对方调取问卷……</div>';
  html += '<div class="mlsj-countdown-sm" id="mlsjGameLoadCountdown">剩余 60 秒</div>';
  html += '</div>';
  mlsjSetGame(html);

  /* 60秒调取问卷倒计时（仅显示，动画驱动实际流程） */
  mlsjInterval(function () {
    mlsjState.gameLoadSeconds--;
    var el = document.getElementById('mlsjGameLoadCountdown');
    if (el) { el.textContent = '剩余 ' + Math.max(0, mlsjState.gameLoadSeconds) + ' 秒'; }
  }, 1000);

  /* 1.5秒后开始调取问卷动画 */
  mlsjTimeout(function () { mlsjStartFetching(); }, 1500);
}

/* 7.2 对方调取问卷动画：三段式 */
function mlsjStartFetching() {
  mlsjRenderFetch('对方正在调取问卷');
  mlsjTimeout(function () {
    mlsjRenderFetch('对方正在作出答案');
    mlsjTimeout(function () {
      mlsjRenderFetch('对方即将发送问卷');
      mlsjTimeout(function () {
        /* 抽题 + 随机对方答案 */
        mlsjPickQuestion();
        mlsjRenderFetch('发送问卷成功！', true);
        mlsjTimeout(function () {
          mlsjRenderQuestion();
        }, 1200);
      }, 2000 + Math.floor(Math.random() * 2000));
    }, 2000 + Math.floor(Math.random() * 2000));
  }, 2000 + Math.floor(Math.random() * 2000));
}

function mlsjRenderFetch(text, success) {
  var icon = success ? mlsjIconCheck() : mlsjIconHeartSpin();
  var html = '';
  html += '<div class="mlsj-card">';
  html += '<div class="mlsj-fetch-box">';
  html += '<div class="mlsj-fetch-icon">' + icon + '</div>';
  html += '<div class="mlsj-fetch-text">' + mlsjEscape(text) + '</div>';
  if (!success) {
    html += '<div class="mlsj-loading-dots"><span>.</span><span>.</span><span>.</span></div>';
  }
  html += '</div>';
  html += '</div>';
  mlsjSetGame(html);
}

/* 7.3 抽题：从问卷库随机抽一道（同局不重复），系统随机选对方答案 */
function mlsjPickQuestion() {
  var bank = mlsjGetBank();
  if (bank.length === 0) {
    /* 没有问卷则用预置兜底 */
    bank = MLSJ_PRESET_QUESTIONS;
  }
  /* 过滤掉本局已抽取过的问卷 */
  var available = bank.filter(function(q) {
    return mlsjState.usedQuestionIds.indexOf(q.id) === -1;
  });
  /* 如果所有题目都用过了，重置记录重新开始 */
  if (available.length === 0) {
    available = bank;
    mlsjState.usedQuestionIds = [];
  }
  var idx = Math.floor(Math.random() * available.length);
  var q = available[idx];
  mlsjState.currentQ = q;
  mlsjState.usedQuestionIds.push(q.id);
  /* 系统随机选一个选项作为对方答案 */
  mlsjState.partnerAnswer = Math.floor(Math.random() * q.options.length);
}

/* 7.4 显示题目：用户30秒作答 */
function mlsjRenderQuestion() {
  mlsjState.screen = 'question';
  mlsjState.questionSeconds = 30;
  mlsjState.inDanger = false;
  var q = mlsjState.currentQ;
  if (!q) { mlsjEnterGame(); return; }

  var letters = ['A', 'B', 'C', 'D'];
  var html = '';
  html += '<div class="mlsj-card">';
  html += '<div class="mlsj-subtitle">第 ' + (mlsjState.qIndex + 1) + ' / ' + mlsjState.totalQ + ' 题</div>';
  html += '<div class="mlsj-msg-strong">你要回答的问卷是……</div>';
  html += '<div class="mlsj-question-text">' + mlsjEscape(q.question) + '</div>';
  for (var i = 0; i < q.options.length; i++) {
    html += '<button class="mlsj-option" onclick="mlsjAnswerQuestion(' + i + ')">';
    html += '<span class="mlsj-option-letter">' + letters[i] + '</span>';
    html += mlsjEscape(q.options[i]);
    html += '</button>';
  }
  html += '<div class="mlsj-countdown-sm" id="mlsjQuestionCountdown">剩余 30 秒</div>';
  html += '</div>';
  mlsjSetGame(html);

  /* 30秒作答倒计时 */
  mlsjInterval(function () {
    mlsjState.questionSeconds--;
    var el = document.getElementById('mlsjQuestionCountdown');
    if (el) { el.textContent = '剩余 ' + Math.max(0, mlsjState.questionSeconds) + ' 秒'; }
    if (mlsjState.questionSeconds <= 0) {
      mlsjClearTimers();
      /* 超时视为答错 → 进入危险判定 */
      mlsjEnterDanger();
    }
  }, 1000);
}

/* 7.5 用户作答判定 */
function mlsjAnswerQuestion(index) {
  if (mlsjState.screen !== 'question') return;
  mlsjClearTimers();
  if (index === mlsjState.partnerAnswer) {
    mlsjAnswerCorrect();
  } else {
    mlsjEnterDanger();
  }
}

/* 7.6 答对：进入下一题 */
function mlsjAnswerCorrect() {
  mlsjState.screen = 'correct';
  mlsjState.correctCount++;
  var html = '';
  html += '<div class="mlsj-card">';
  html += '<div class="mlsj-fetch-box">';
  html += '<div class="mlsj-fetch-icon">' + mlsjIconCheck() + '</div>';
  html += '<div class="mlsj-msg-strong">恭喜你！作出了正确的选择，可喜可贺！</div>';
  html += '<div class="mlsj-msg">让我们进入下一题吧！</div>';
  html += '</div>';
  html += '</div>';
  mlsjSetGame(html);
  mlsjTimeout(function () { mlsjNextQuestion(); }, 1500);
}

/* 7.7 下一题或结束 */
function mlsjNextQuestion() {
  mlsjState.qIndex++;
  if (mlsjState.qIndex >= mlsjState.totalQ) {
    mlsjRenderGameEnd();
  } else {
    mlsjEnterGameLoadOnly();
  }
}

/* 下一题的调取问卷流程（复用 60s 显示 + 动画） */
function mlsjEnterGameLoadOnly() {
  mlsjState.screen = 'gameLoad';
  mlsjState.gameLoadSeconds = 60;
  var html = '';
  html += '<div class="mlsj-card">';
  html += '<div class="mlsj-msg-strong">请等待对方调取问卷……</div>';
  html += '<div class="mlsj-countdown-sm" id="mlsjGameLoadCountdown">剩余 60 秒</div>';
  html += '</div>';
  mlsjSetGame(html);
  mlsjInterval(function () {
    mlsjState.gameLoadSeconds--;
    var el = document.getElementById('mlsjGameLoadCountdown');
    if (el) { el.textContent = '剩余 ' + Math.max(0, mlsjState.gameLoadSeconds) + ' 秒'; }
  }, 1000);
  mlsjTimeout(function () { mlsjStartFetching(); }, 1200);
}


/* ==================================================================
 * 模块八：危险判定阶段（选错后）
 * ================================================================== */

function mlsjEnterDanger() {
  mlsjState.screen = 'danger';
  mlsjState.inDanger = true;
  mlsjState.dangerSeconds = 10;
  var html = '';
  html += '<div class="mlsj-card mlsj-danger-card">';
  html += '<div class="mlsj-danger-msg">天啊‼️你的答案与对方不同！</div>';
  html += '<div class="mlsj-danger-msg">这究竟是为什么！究竟是系统的错误还是系统错误还是他……他……他……</div>';
  html += '<div class="mlsj-danger-msg">快快快，快重新选择！</div>';
  html += '<div class="mlsj-danger-timer" id="mlsjDangerTimer">10</div>';
  html += '</div>';
  /* 重新显示题目选项 */
  html += '<div class="mlsj-card">';
  var q = mlsjState.currentQ;
  if (q) {
    html += '<div class="mlsj-question-text">' + mlsjEscape(q.question) + '</div>';
    var letters = ['A', 'B', 'C', 'D'];
    for (var i = 0; i < q.options.length; i++) {
      html += '<button class="mlsj-option" onclick="mlsjDangerAnswer(' + i + ')">';
      html += '<span class="mlsj-option-letter">' + letters[i] + '</span>';
      html += mlsjEscape(q.options[i]);
      html += '</button>';
    }
  }
  html += '<div class="mlsj-msg" id="mlsjDangerHint" style="color:#8B2A3D;">请重新选择正确答案</div>';
  html += '</div>';
  mlsjSetGame(html);

  /* 10秒危险倒计时 */
  mlsjInterval(function () {
    mlsjState.dangerSeconds--;
    var el = document.getElementById('mlsjDangerTimer');
    if (el) { el.textContent = Math.max(0, mlsjState.dangerSeconds); }
    if (mlsjState.dangerSeconds <= 0) {
      mlsjClearTimers();
      /* 归零进入甜蜜惩罚 */
      mlsjEnterPunishment();
    }
  }, 1000);
}

function mlsjDangerAnswer(index) {
  if (mlsjState.screen !== 'danger') return;
  if (index === mlsjState.partnerAnswer) {
    /* 选对：危险解除 */
    mlsjClearTimers();
    mlsjState.inDanger = false;
    var html = '';
    html += '<div class="mlsj-card">';
    html += '<div class="mlsj-fetch-box">';
    html += '<div class="mlsj-fetch-icon">' + mlsjIconCheck() + '</div>';
    html += '<div class="mlsj-msg-strong">天呀……危险解除了……</div>';
    html += '</div>';
    html += '</div>';
    mlsjSetGame(html);
    mlsjTimeout(function () { mlsjNextQuestion(); }, 1500);
  } else {
    /* 选错：继续倒计时提示 */
    var hint = document.getElementById('mlsjDangerHint');
    if (hint) {
      hint.textContent = '还是不对！他到底怎么想的呀！快重选一个';
      hint.style.color = '#8B2A3D';
    }
  }
}


/* ==================================================================
 * 模块九：甜蜜惩罚
 * ================================================================== */

function mlsjEnterPunishment() {
  mlsjState.screen = 'punishment';
  mlsjState.inDanger = false;
  mlsjState.punishCount++;
  mlsjState.punishProgress = 0;
  /* 随机抽一句惩罚句子 */
  mlsjState.punishSentence = MLSJ_PUNISH_SENTENCES[Math.floor(Math.random() * MLSJ_PUNISH_SENTENCES.length)];
  mlsjRenderPunishment();
}

function mlsjRenderPunishment() {
  var s = mlsjState.punishSentence;
  var html = '';
  html += '<div class="mlsj-card">';
  html += '<div class="mlsj-punish-title">惩罚</div>';
  html += '<div class="mlsj-msg">请输入 10 遍下面这句话：</div>';
  html += '<div class="mlsj-punish-sentence">「' + mlsjEscape(s) + '」</div>';
  html += '<input type="text" class="mlsj-input" id="mlsjPunishInput" placeholder="在这里输入…" autocomplete="off" onkeydown="if(event.key===\'Enter\'){mlsjSubmitPunishment();}">';
  html += '<button class="mlsj-btn mlsj-btn-primary" onclick="mlsjSubmitPunishment()">提交</button>';
  html += '<div class="mlsj-progress" id="mlsjPunishProgress">已完成 ' + mlsjState.punishProgress + ' / 10 遍</div>';
  html += '<div class="mlsj-progress-bar"><div class="mlsj-progress-fill" id="mlsjPunishFill" style="width:' + (mlsjState.punishProgress * 10) + '%"></div></div>';
  html += '</div>';
  mlsjSetGame(html);
  var inp = document.getElementById('mlsjPunishInput');
  if (inp) { inp.focus(); }
}

function mlsjSubmitPunishment() {
  var inp = document.getElementById('mlsjPunishInput');
  if (!inp) return;
  var val = (inp.value || '').trim();
  if (val.length === 0) return;
  /* 包含句子关键词即可算一遍 */
  if (val.indexOf(mlsjState.punishSentence) !== -1) {
    mlsjState.punishProgress++;
    inp.value = '';
    var prog = document.getElementById('mlsjPunishProgress');
    if (prog) { prog.textContent = '已完成 ' + mlsjState.punishProgress + ' / 10 遍'; }
    var fill = document.getElementById('mlsjPunishFill');
    if (fill) { fill.style.width = (mlsjState.punishProgress * 10) + '%'; }
    if (mlsjState.punishProgress >= 10) {
      /* 惩罚结束 */
      var html = '';
      html += '<div class="mlsj-card">';
      html += '<div class="mlsj-fetch-box">';
      html += '<div class="mlsj-fetch-icon">' + mlsjIconHeart() + '</div>';
      html += '<div class="mlsj-msg-strong">惩罚结束</div>';
      html += '</div>';
      html += '</div>';
      mlsjSetGame(html);
      mlsjTimeout(function () { mlsjNextQuestion(); }, 1500);
    } else {
      inp.focus();
    }
  } else {
    /* 不包含关键词，提示 */
    inp.value = '';
    var prog2 = document.getElementById('mlsjPunishProgress');
    if (prog2) {
      prog2.textContent = '已完成 ' + mlsjState.punishProgress + ' / 10 遍（内容不对哦，重新输入）';
      prog2.style.color = '#8B2A3D';
      mlsjTimeout(function () {
        var p = document.getElementById('mlsjPunishProgress');
        if (p) { p.style.color = '#D4C9C6'; p.textContent = '已完成 ' + mlsjState.punishProgress + ' / 10 遍'; }
      }, 1500);
    }
    inp.focus();
  }
}


/* ==================================================================
 * 模块十：游戏结束 —— 结果页 + 存档
 * ================================================================== */

function mlsjRenderGameEnd() {
  mlsjState.screen = 'gameEnd';
  mlsjClearTimers();
  var correct = mlsjState.correctCount;
  var total = mlsjState.totalQ;
  var acc = total > 0 ? Math.round((correct / total) * 100) : 0;
  var punish = mlsjState.punishCount;
  var comment = mlsjGetComment(acc);

  /* 存档到历史记录 */
  try {
    var record = {
      date: Date.now(),
      contactName: mlsjState.selectedContact ? (mlsjState.selectedContact.name || '对方') : '对方',
      correctCount: correct,
      totalCount: total,
      punishCount: punish,
      accuracy: acc
    };
    appData.lifeDeathData.history.unshift(record);
    if (appData.lifeDeathData.history.length > 50) {
      appData.lifeDeathData.history = appData.lifeDeathData.history.slice(0, 50);
    }
    mlsjSave();
  } catch (e) { console.error('[默契生死局] 存档失败', e); }

  var html = '';
  html += '<div class="mlsj-card">';
  html += '<div class="mlsj-result-big">游戏结束</div>';
  html += '<div class="mlsj-result-num">' + acc + '%</div>';
  html += '<div class="mlsj-subtitle">正确率</div>';
  html += '<div class="mlsj-result-row">';
  html += '<div class="mlsj-result-cell"><div class="mlsj-result-cell-val">' + correct + '/' + total + '</div><div class="mlsj-result-cell-label">正确题数</div></div>';
  html += '<div class="mlsj-result-cell"><div class="mlsj-result-cell-val">' + punish + '</div><div class="mlsj-result-cell-label">惩罚次数</div></div>';
  html += '</div>';
  html += '<div class="mlsj-comment">' + mlsjEscape(comment) + '</div>';
  html += '<button class="mlsj-btn mlsj-btn-primary" onclick="mlsjPlayAgain()">再玩一次</button>';
  html += '<button class="mlsj-btn mlsj-btn-ghost" onclick="closeLifeDeathApp()">返回桌面</button>';
  html += '</div>';
  mlsjSetGame(html);
}

function mlsjPlayAgain() {
  mlsjClearTimers();
  mlsjResetState();
  mlsjRenderWelcome();
}


/* ==================================================================
 * 模块十一：问卷管理 —— 查看 / 添加 / 删除
 * ================================================================== */

function mlsjRenderManage() {
  var el = document.getElementById('mlsjManageTab');
  if (!el) return;
  var bank = mlsjGetBank();
  var letters = ['A', 'B', 'C', 'D'];
  var html = '';

  /* 添加问卷表单 */
  html += '<div class="mlsj-card">';
  html += '<div class="mlsj-section-title">' + mlsjIconPlus() + ' 添加问卷</div>';
  html += '<div class="mlsj-form-group">';
  html += '<label class="mlsj-form-label">题目</label>';
  html += '<input type="text" class="mlsj-input" id="mlsjNewQuestion" placeholder="输入问卷题目">';
  html += '</div>';
  for (var i = 0; i < 4; i++) {
    html += '<div class="mlsj-form-group">';
    html += '<div class="mlsj-opt-row">';
    html += '<input type="text" class="mlsj-input" id="mlsjNewOpt' + i + '" placeholder="选项 ' + letters[i] + '">';
    html += '</div>';
    html += '</div>';
  }
  html += '<div class="mlsj-correct-mark">正确答案由对方在调取问卷时随机选择，无需预设</div>';
  html += '<button class="mlsj-btn mlsj-btn-primary" onclick="mlsjAddQuestion()">添加问卷</button>';
  html += '</div>';

  /* 已有问卷列表 */
  html += '<div class="mlsj-section-title" style="margin-top:8px;">' + mlsjIconList() + ' 问卷库（' + bank.length + ' 道）</div>';
  if (bank.length === 0) {
    html += '<div class="mlsj-empty-tip">问卷库为空，请添加问卷</div>';
  } else {
    for (var j = 0; j < bank.length; j++) {
      var q = bank[j];
      var isPreset = q.id && q.id.indexOf('mlsj_preset_') === 0;
      html += '<div class="mlsj-q-item">';
      html += '<div class="mlsj-q-item-q">' + (j + 1) + '. ' + mlsjEscape(q.question) + (isPreset ? ' <span style="font-size:11px;color:#6A5854;">（内置）</span>' : '') + '</div>';
      for (var k = 0; k < q.options.length; k++) {
        html += '<div class="mlsj-q-item-opt">' + letters[k] + '. ' + mlsjEscape(q.options[k]) + '</div>';
      }
      html += '<div style="margin-top:8px;">';
      html += '<button class="mlsj-q-item-edit" onclick="mlsjEditQuestion(\'' + q.id + '\')">编辑</button>';
      html += '<button class="mlsj-q-item-del" onclick="mlsjDeleteQuestion(\'' + q.id + '\')">删除</button>';
      html += '</div>';
      html += '</div>';
    }
  }
  el.innerHTML = html;
}

function mlsjAddQuestion() {
  var qInput = document.getElementById('mlsjNewQuestion');
  if (!qInput) return;
  var question = qInput.value.trim();
  if (!question) { alert('请输入题目'); return; }
  var opts = [];
  for (var i = 0; i < 4; i++) {
    var inp = document.getElementById('mlsjNewOpt' + i);
    if (inp && inp.value.trim()) { opts.push(inp.value.trim()); }
  }
  if (opts.length < 2) { alert('请至少填写2个选项'); return; }
  /* 正确答案不预设，由对方调取问卷时随机选择 */
  var newQ = {
    id: 'mlsj_user_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    question: question,
    options: opts,
    correctIndex: -1  // -1 表示未预设答案，调取时随机选择
  };
  appData.lifeDeathData.questionBank.push(newQ);
  mlsjSave();
  mlsjRenderManage();
}

function mlsjDeleteQuestion(id) {
  if (!confirm('确定删除这道问卷吗？')) return;
  var bank = appData.lifeDeathData.questionBank;
  for (var i = 0; i < bank.length; i++) {
    if (bank[i].id === id) { bank.splice(i, 1); break; }
  }
  mlsjSave();
  mlsjRenderManage();
}

/* 编辑问卷（支持内置问卷） */
var mlsjEditingQId = null;
function mlsjEditQuestion(id) {
  var bank = mlsjGetBank();
  var q = null;
  for (var i = 0; i < bank.length; i++) {
    if (bank[i].id === id) { q = bank[i]; break; }
  }
  if (!q) return;
  mlsjEditingQId = id;
  var letters = ['A', 'B', 'C', 'D'];
  var html = '';
  html += '<div class="mlsj-card">';
  html += '<div class="mlsj-section-title">编辑问卷</div>';
  html += '<div class="mlsj-form-group">';
  html += '<label class="mlsj-form-label">题目</label>';
  html += '<input type="text" class="mlsj-input" id="mlsjEditQuestion" value="' + mlsjEscapeAttr(q.question) + '">';
  html += '</div>';
  for (var i = 0; i < q.options.length; i++) {
    html += '<div class="mlsj-form-group">';
    html += '<div class="mlsj-opt-row">';
    html += '<input type="text" class="mlsj-input" id="mlsjEditOpt' + i + '" value="' + mlsjEscapeAttr(q.options[i]) + '" placeholder="选项 ' + letters[i] + '">';
    html += '</div>';
    html += '</div>';
  }
  /* 允许添加更多选项（最多6个） */
  for (var j = q.options.length; j < Math.max(q.options.length + 2, 4); j++) {
    if (j >= 6) break;
    html += '<div class="mlsj-form-group">';
    html += '<div class="mlsj-opt-row">';
    html += '<input type="text" class="mlsj-input" id="mlsjEditOpt' + j + '" placeholder="选项 ' + letters[j] + '（可选）">';
    html += '</div>';
    html += '</div>';
  }
  html += '<div class="mlsj-correct-mark">正确答案由对方在调取问卷时随机选择，无需预设</div>';
  html += '<button class="mlsj-btn mlsj-btn-primary" onclick="mlsjSaveEditQuestion()">保存修改</button>';
  html += '<button class="mlsj-btn mlsj-btn-ghost" onclick="mlsjRenderManage()">取消</button>';
  html += '</div>';
  /* 替换管理区域内容 */
  var el = document.getElementById('mlsjManageTab');
  if (el) el.innerHTML = html;
}

function mlsjSaveEditQuestion() {
  if (!mlsjEditingQId) return;
  var qInput = document.getElementById('mlsjEditQuestion');
  if (!qInput) return;
  var question = qInput.value.trim();
  if (!question) { alert('请输入题目'); return; }
  var opts = [];
  for (var i = 0; i < 6; i++) {
    var inp = document.getElementById('mlsjEditOpt' + i);
    if (inp && inp.value.trim()) { opts.push(inp.value.trim()); }
  }
  if (opts.length < 2) { alert('请至少填写2个选项'); return; }
  /* 正确答案不预设，由对方调取问卷时随机选择 */
  var correctIdx = -1;

  /* 查找并更新问卷（包括内置问卷） */
  var bank = appData.lifeDeathData.questionBank;
  var found = false;
  for (var i = 0; i < bank.length; i++) {
    if (bank[i].id === mlsjEditingQId) {
      bank[i].question = question;
      bank[i].options = opts;
      bank[i].correctIndex = correctIdx;
      found = true;
      break;
    }
  }
  /* 如果是内置问卷，也检查预设问卷列表 */
  if (!found) {
    for (var i = 0; i < MLSJ_PRESET_QUESTIONS.length; i++) {
      if (MLSJ_PRESET_QUESTIONS[i].id === mlsjEditingQId) {
        MLSJ_PRESET_QUESTIONS[i].question = question;
        MLSJ_PRESET_QUESTIONS[i].options = opts;
        MLSJ_PRESET_QUESTIONS[i].correctIndex = correctIdx;
        found = true;
        break;
      }
    }
  }
  mlsjEditingQId = null;
  mlsjSave();
  mlsjRenderManage();
}

function mlsjEscapeAttr(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}


/* ==================================================================
 * 模块十二：历史记录
 * ================================================================== */

function mlsjRenderHistory() {
  var el = document.getElementById('mlsjHistoryTab');
  if (!el) return;
  var history = [];
  try { history = appData.lifeDeathData.history || []; } catch (e) {}
  var html = '';
  html += '<div class="mlsj-section-title">' + mlsjIconClock() + ' 游戏记录</div>';
  if (history.length === 0) {
    html += '<div class="mlsj-empty-tip">还没有游戏记录<br>快去玩一局吧~</div>';
  } else {
    for (var i = 0; i < history.length; i++) {
      var h = history[i];
      var d = new Date(h.date);
      var dateStr = d.getFullYear() + '-' + mlsjPad(d.getMonth() + 1) + '-' + mlsjPad(d.getDate()) + ' ' + mlsjPad(d.getHours()) + ':' + mlsjPad(d.getMinutes());
      html += '<div class="mlsj-history-item">';
      html += '<div class="mlsj-history-top">';
      html += '<span class="mlsj-history-name">' + mlsjEscape(h.contactName) + '</span>';
      html += '<span class="mlsj-history-date">' + dateStr + '</span>';
      html += '</div>';
      html += '<div class="mlsj-history-stats">';
      html += '正确：' + h.correctCount + '/' + h.totalCount + '　';
      html += '正确率：<span class="mlsj-history-acc">' + h.accuracy + '%</span>　';
      html += '惩罚：' + h.punishCount + ' 次';
      html += '</div>';
      html += '</div>';
    }
    html += '<button class="mlsj-btn mlsj-btn-danger" onclick="mlsjClearHistory()">清空记录</button>';
  }
  el.innerHTML = html;
}

function mlsjClearHistory() {
  if (!confirm('确定清空所有历史记录吗？')) return;
  appData.lifeDeathData.history = [];
  mlsjSave();
  mlsjRenderHistory();
}


/* ==================================================================
 * 模块十三：工具函数 —— 转义 / 补零 / SVG 图标
 * ================================================================== */

function mlsjEscape(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function mlsjPad(n) { return n < 10 ? '0' + n : '' + n; }

/* SVG 图标 —— 全部纯 SVG，禁止 emoji */
function mlsjIconHeartSpin() {
  return '<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#8B2A3D" stroke-width="1.6">' +
    '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="rgba(139,42,61,0.3)"/>' +
    '</svg>';
}
function mlsjIconCheck() {
  return '<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#F0EAE6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="12" cy="12" r="10" fill="rgba(139,42,61,0.3)" stroke="#8B2A3D"/>' +
    '<polyline points="8 12 11 15 16 9"/>' +
    '</svg>';
}
function mlsjIconHeart() {
  return '<svg viewBox="0 0 24 24" width="56" height="56" fill="#8B2A3D" stroke="#F0EAE6" stroke-width="1">' +
    '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>' +
    '</svg>';
}
function mlsjIconPlus() {
  return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#D4C9C6" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
}
function mlsjIconList() {
  return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#D4C9C6" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
}
function mlsjIconClock() {
  return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#D4C9C6" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
}


/* ==================================================================
 * 模块十四：自动初始化（页面加载时确保数据结构存在）
 * ================================================================== */
(function mlsjAutoInit() {
  try { mlsjInitData(); } catch (e) { console.error('[默契生死局] 自动初始化异常', e); }
})();


(function(){
  'use strict';

  /* ============ SVG 图标 ============ */
  var ICON = {
    back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><path d="M15 18l-6-6 6-6"/></svg>',
    more:'<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    moreH:'<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
    play:'<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M7 5v14l12-7z"/></svg>',
    pause:'<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    prev:'<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M18 5v14l-9-7z"/><rect x="4" y="5" width="2.5" height="14" rx="1"/></svg>',
    next:'<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M6 5l9 7-9 7z"/><rect x="17.5" y="5" width="2.5" height="14" rx="1"/></svg>',
    heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><path d="M12 21s-7-4.5-9.5-9C1 8.5 3.5 5 6.8 5c2 0 3.4 1.1 5.2 3 1.8-1.9 3.2-3 5.2-3 3.3 0 5.8 3.5 4.3 7-2.5 4.5-9.5 9-9.5 9z"/></svg>',
    heartFill:'<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" width="100%" height="100%"><path d="M12 21s-7-4.5-9.5-9C1 8.5 3.5 5 6.8 5c2 0 3.4 1.1 5.2 3 1.8-1.9 3.2-3 5.2-3 3.3 0 5.8 3.5 4.3 7-2.5 4.5-9.5 9-9.5 9z"/></svg>',
    comment:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/></svg>',
    share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.6" x2="15.4" y2="6.4"/><line x1="8.6" y1="13.4" x2="15.4" y2="17.6"/></svg>',
    download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    loopList:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    loopOne:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="12" y="15.5" font-size="8" fill="currentColor" stroke="none" text-anchor="middle" font-family="sans-serif" font-weight="700">1</text></svg>',
    shuffle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
    list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    person:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    music:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
  };
  function icon(n){return ICON[n]||'';}

  /* ============ 存储 ============ */
  var K = {
    songs:'lt_songs', fav:'lt_favorites', comments:'lt_comments',
    play:'lt_playstate', timer:'lt_timer', reject:'lt_rejectCount', other:'lt_otherName',
    together:'lt_togetherActive', replies:'lt_scheduledReplies', played:'lt_playedSongs',
    settings:'lt_settings', bg:'lt_bgImage', cumTime:'lt_cumulativeTime',
    ltFontColor:'lt_fontColor', ltFontSize:'lt_fontSize', ltBgColor:'lt_bgColor', ltBgImage:'lt_bgImg',
    ltHomeFontColor:'lt_homeFontColor',
    ltProfileBg:'lt_profileBg',
    ltAvatar1:'lt_avatar1', ltAvatar2:'lt_avatar2',
    mwBg:'lt_mwBgImg', mwFontColor:'lt_mwFontColor', mwAvatar1:'lt_mwAvatar1', mwAvatar2:'lt_mwAvatar2',
    togetherAv:'lt_togetherAv',
    profile:'lt_profileData',
    contactId:'lt_contactId'
  };
  function load(key,def){
    /* 先查内存缓存，再查 localStorage */
    if(_ltCache[key]!==undefined) return _ltCache[key];
    try{var v=localStorage.getItem(key);return v===null?def:JSON.parse(v);}catch(e){return def;}
  }
  function save(key,val){
    _ltCache[key]=val;
    var json;
    try{ json=JSON.stringify(val); }catch(e){ return; }
    try{
      localStorage.setItem(key,json);
    }catch(e){
      /* localStorage 空间不足，存入 IndexedDB（30GB配额） */
      if(window.saveImgDB){ window.saveImgDB(key, json); }
      return;
    }
    /* 大数据同步备份到 IndexedDB，确保刷新后可恢复 */
    if(json.length > 5000 && window.saveImgDB){ window.saveImgDB(key, json); }
  }
  var _ltCache={};
  /* 异步从 IndexedDB 恢复数据到内存缓存 */
  function restoreLTFromIDB(){
    if(!window.loadImgDB) return;
    /* 清理可能被 DEFAULT_SONGS 污染的 lt_songs，让 loadImgDB 能从 IDB 恢复真实数据（含MP3链接） */
    try {
      var lsSongs = localStorage.getItem(K.songs);
      if (lsSongs) {
        var parsed = JSON.parse(lsSongs);
        if (Array.isArray(parsed) && parsed.length === 5 && parsed[0] && parsed[0].id === 's1' && !parsed[0].url) {
          localStorage.removeItem(K.songs);
        }
      }
    } catch(e) {}
    Object.keys(K).forEach(function(k){
      var key=K[k];
      window.loadImgDB(key, function(val){
        if(val){
          try{
            var parsed=JSON.parse(val);
            _ltCache[key]=parsed;
            /* 恢复后更新界面 */
            _ltIDBRestored=true;
            try{ _applyIDBRestored(); }catch(e){}
          }catch(e){}
        }
      });
    });
  }
  var _ltIDBRestored=false;
  function _applyIDBRestored(){
    if(!_ltIDBRestored) return;
    /* 更新关键变量 */
    if(_ltCache[K.songs]){ songs=_ltCache[K.songs]; try{localStorage.setItem(K.songs,JSON.stringify(songs));}catch(e){} }
    if(_ltCache[K.settings]){ settings=_ltCache[K.settings]; otherName=settings.otherName||'对方'; }
    if(_ltCache[K.contactId]!==undefined){ ltContactId=_ltCache[K.contactId]; }
    if(_ltCache[K.cumTime]!==undefined){ cumulativeTime=_ltCache[K.cumTime]; }
    if(_ltCache[K.play]){ playstate=_ltCache[K.play]; }
    if(_ltCache[K.comments]){ comments=_ltCache[K.comments]; }
    if(_ltCache[K.fav]){ favorites=_ltCache[K.fav]; }
    if(_ltCache[K.together]!==undefined){ together=_ltCache[K.together]; }
    if(_ltCache[K.played] && !_ltPlayedModified){ playedSongs=_ltCache[K.played]; }
    if(_ltCache[K.profile]){ profileData=_ltCache[K.profile]; }
    /* 恢复头像、背景等大图片数据（base64 数据量大，常被存入 IndexedDB） */
    if(_ltCache[K.bg]!==undefined){ bgImage=_ltCache[K.bg]; }
    if(_ltCache[K.ltFontColor]!==undefined){ ltFontColor=_ltCache[K.ltFontColor]; }
    if(_ltCache[K.ltHomeFontColor]!==undefined){ ltHomeFontColor=_ltCache[K.ltHomeFontColor]; }
    if(_ltCache[K.ltFontSize]!==undefined){ ltFontSize=_ltCache[K.ltFontSize]; }
    if(_ltCache[K.ltBgColor]!==undefined){ ltBgColor=_ltCache[K.ltBgColor]; }
    if(_ltCache[K.ltBgImage]!==undefined){ ltBgImage=_ltCache[K.ltBgImage]; }
    if(_ltCache[K.ltProfileBg]!==undefined){ ltProfileBg=_ltCache[K.ltProfileBg]; }
    if(_ltCache[K.ltAvatar1]!==undefined){ ltAvatar1=_ltCache[K.ltAvatar1]; }
    if(_ltCache[K.ltAvatar2]!==undefined){ ltAvatar2=_ltCache[K.ltAvatar2]; }
    if(_ltCache[K.mwBg]!==undefined){ mwBgImg=_ltCache[K.mwBg]; }
    if(_ltCache[K.mwFontColor]!==undefined){ mwFontColor=_ltCache[K.mwFontColor]; }
    if(_ltCache[K.mwAvatar1]!==undefined){ mwAvatar1=_ltCache[K.mwAvatar1]; }
    if(_ltCache[K.mwAvatar2]!==undefined){ mwAvatar2=_ltCache[K.mwAvatar2]; }
    /* 重新渲染界面 */
    try{ renderProfileCard(); renderPlayer(); renderMini(); updateCenter(); renderList(); updateEndTogetherBtn(); applyLtAppearance(); renderComments(); }catch(e){}
  }

  var DEFAULT_SONGS=[
    {id:'s1',name:'晴天',artist:'周杰伦',url:'',cover:null,duration:269},
    {id:'s2',name:'夜曲',artist:'周杰伦',url:'',cover:null,duration:226},
    {id:'s3',name:'小幸运',artist:'田馥甄',url:'',cover:null,duration:293},
    {id:'s4',name:'起风了',artist:'买辣椒也用券',url:'',cover:null,duration:325},
    {id:'s5',name:'稻香',artist:'周杰伦',url:'',cover:null,duration:223}
  ];
  var LT_FALLBACK_REPLIES=['这首歌好好听','想到你了','今天也在一起听歌呢','旋律一响就想起你','单曲循环了一整天','听到这句就笑了','你是不是也在听','想和你一起看演唱会','这首歌的副歌太绝了','安静的时候听最合适','耳机分你一半','今天的天气适合这首歌','听到前奏就沦陷了','你也喜欢这句歌词吗','一起听到天黑','节奏刚好踩在心跳上','想把这首歌设成你的来电铃声','又是一个听歌的夜晚','这首歌藏着一个故事','陪你听完整张专辑'];

  /* ============ 状态 ============ */
  var songs=load(K.songs,null); if(!songs){songs=DEFAULT_SONGS.slice();}
  var favorites=load(K.fav,[]);
  var comments=load(K.comments,[]);
  var playstate=load(K.play,{currentSongId:null,currentTime:0,isPlaying:false,loopMode:'list'});
  var timerState=load(K.timer,{startTs:null});
  var rejectCount=load(K.reject,0);
  var otherName=load(K.other,'对方');
  var ltContactId=load(K.contactId,null);
  var together=load(K.together,false);
  var scheduledReplies=load(K.replies,[]);
  var playedSongs=load(K.played,[]);
  var _ltPlayedModified=false;
  var settings=load(K.settings,{myName:'我',distance:null,replyDelayMin:1});
  var bgImage=load(K.bg,null);
  var cumulativeTime=load(K.cumTime,0); /* total together time across sessions (seconds) */
  var ltFontColor=load(K.ltFontColor,null);
  var ltHomeFontColor=load(K.ltHomeFontColor,null);
  var ltFontSize=load(K.ltFontSize,null);
  var ltBgColor=load(K.ltBgColor,null);
  var ltBgImage=load(K.ltBgImage,null);
  var ltProfileBg=load(K.ltProfileBg,null);
  var ltAvatar1=load(K.ltAvatar1,null);
  var ltAvatar2=load(K.ltAvatar2,null);
  var mwBgImg=load(K.mwBg,null);
  var mwFontColor=load(K.mwFontColor,null);
  var mwAvatar1=load(K.mwAvatar1,null);
  var mwAvatar2=load(K.mwAvatar2,null);
  if(!settings.distance){settings.distance=Math.floor(Math.random()*1980)+20;save(K.settings,settings);}

  /* 异步从 IndexedDB 恢复大数据（图片等），避免 localStorage 配额不足导致数据丢失 */
  setTimeout(restoreLTFromIDB, 500);

  /* ============ 运行时 ============ */
  var audio=new Audio();
  audio.preload='auto';
  var simTimer=null, timerInterval=null, inviteTimer=null, probScheduled={};
  var currentView='list', listTab='all', listView='home', replyTarget=null, fileCallback=null;
  var inited=false;

  /* ============ DOM ============ */
  function $(id){return document.getElementById(id);}
  function currentSong(){return songs.find(function(s){return s.id===playstate.currentSongId;});}

  /* ============ 工具 ============ */
  function randId(){return 'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
  function pad(n){n=Math.max(0,Math.floor(n));return n<10?'0'+n:''+n;}
  function fmtTime(sec){return pad(sec/60)+':'+pad(sec%60);}
  function escapeHTML(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function randPick(arr){return arr.length?arr[Math.floor(Math.random()*arr.length)]:'';}

  /* ============ toast ============ */
  var toastTimer=null;
  function toast(msg){
    var wrap=$('lt-toast');
    var el=document.createElement('div');
    el.className='lt-toast';
    el.textContent=msg;
    wrap.appendChild(el);
    setTimeout(function(){el.style.transition='opacity .3s,transform .3s';el.style.opacity='0';el.style.transform='translateY(-8px)';setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},300);},2200);
  }

  /* ============ action sheet ============ */
  function promptText(title,defaultVal,cb){
    $('lt-text-title').textContent=title||'输入';
    var inp=$('lt-text-input'); inp.value=defaultVal||'';
    $('lt-text-modal').style.display='flex';
    setTimeout(function(){inp.focus();inp.select();},50);
    var ok=$('lt-text-ok'),cancel=$('lt-text-cancel');
    function cleanup(){
      $('lt-text-modal').style.display='none';
      ok.onclick=null; cancel.onclick=null; inp.onkeydown=null;
    }
    ok.onclick=function(){ var v=inp.value; cleanup(); if(cb)cb(v); };
    cancel.onclick=function(){ cleanup(); };
    inp.onkeydown=function(e){ if(e.key==='Enter'){e.preventDefault();var v=inp.value;cleanup();if(cb)cb(v);} if(e.key==='Escape'){cleanup();} };
  }
  function showSheet(title,items){
    $('lt-sheet-title').textContent=title||'';
    var box=$('lt-sheet-items');box.innerHTML='';
    items.forEach(function(it){
      var d=document.createElement('div');
      d.className='lt-sheet-item'+(it.danger?' danger':'');
      d.textContent=it.label;
      d.onclick=function(){$('lt-sheet').style.display='none';if(it.onClick)it.onClick();};
      box.appendChild(d);
    });
    $('lt-sheet').style.display='flex';
  }
  function hideSheet(){$('lt-sheet').style.display='none';}

  /* ============ 渲染：歌单 ============ */
  function renderList(){
    var box=$('lt-songlist');box.innerHTML='';
    var list=songs;
    if(listTab==='fav') list=songs.filter(function(s){return favorites.indexOf(s.id)>=0;});
    if(!list.length){box.innerHTML='<div class="lt-empty">'+(listTab==='fav'?'还没有收藏的歌曲':'还没有歌曲，点击右上角添加')+'</div>';}
    list.forEach(function(s,i){
      var row=document.createElement('div');
      row.className='lt-song';row.dataset.id=s.id;
      var favDot=favorites.indexOf(s.id)>=0?'<span class="lt-fav-dot"></span>':'';
      var coverInner=s.cover?'<img src="'+escapeHTML(s.cover)+'">':icon('music');
      row.innerHTML='<div class="lt-song-no">'+(i+1)+'</div>'+
        '<div class="lt-song-cover">'+coverInner+'</div>'+
        '<div class="lt-song-info"><div class="lt-song-name">'+favDot+escapeHTML(s.name)+'</div>'+
        '<div class="lt-song-artist">'+escapeHTML(s.artist||'未知歌手')+(s.url?'':' · 模拟')+'</div></div>'+
        '<button class="lt-song-more">'+icon('moreH')+'</button>';
      box.appendChild(row);
    });
    $('lt-playall-count').textContent='共 '+songs.length+' 首';
    /* update entry card subtitles */
    var favSub=$('lt-entry-fav-sub');
    if(favSub) favSub.textContent='共 '+favorites.length+' 首收藏';
    var allSub=$('lt-entry-all-sub');
    if(allSub) allSub.textContent='共 '+songs.length+' 首歌曲';
  }

  /* ============ 渲染：关系卡 ============ */
  /* ============ 仿网易云主页详情：渲染 & 交互 ============ */
  var K_PROFILE=K.profile;
  var profileData=load(K_PROFILE,{name:'你的昵称',date:'点击即可替换文案',follow:32,fans:43,level:8,avatar:null,imgs:[null,null,null,null],bg:null});
  function saveProfileData(){ save(K_PROFILE,profileData); }
  function renderProfileCard(){
    if(!profileData) profileData={name:'你的昵称',date:'点击即可替换文案',follow:32,fans:43,level:8,avatar:null,imgs:[null,null,null,null]};
    var nm=$('lt-profile-name'); if(nm) nm.textContent=profileData.name||'你的昵称';
    var dt=$('lt-profile-date'); if(dt) dt.textContent=profileData.date||'点击即可替换文案';
    var fn=$('lt-stat-follow-num'); if(fn) fn.textContent=profileData.follow!=null?profileData.follow:23;
    var fa=$('lt-stat-fans-num'); if(fa) fa.textContent=profileData.fans!=null?profileData.fans:65;
    var lv=$('lt-stat-level-num'); if(lv) lv.textContent='Lv.'+(profileData.level!=null?profileData.level:8);
    /* avatar handled by applyLtAvatars() */
    var imgs=$('lt-profile-imgs'); if(imgs){
      imgs.querySelectorAll('.lt-profile-img').forEach(function(box,idx){
        var ph=box.querySelector('.lt-profile-img-ph');
        var im=box.querySelector('img');
        if(profileData.imgs&&profileData.imgs[idx]){
          im.src=profileData.imgs[idx].replace(/"/g,'');
          im.style.display='block';
          if(ph) ph.style.display='none';
        }else{
          im.style.display='none';
          im.src='';
          if(ph) ph.style.display='';
        }
      });
    }
  }

  /* ============ 渲染：播放界面 ============ */
  function renderPlayer(){
    var s=currentSong();
    $('lt-player-title').textContent=s?s.name:'未在播放';
    // cover
    $('lt-coverimg').style.backgroundImage=s&&s.cover?'url("'+s.cover.replace(/"/g,'')+'")':'none';
    $('lt-cover-hint').style.display=together?'none':'block';
    updateCenter();
    updatePlayUI();
    updateProgress();
    updateLoopIcon();
    updateLikeIcon();
    renderProfileCard();
  }
  function updateCenter(){
    var center=$('lt-center');
    if(together){center.classList.add('lt-mode-together');
      var comp='0小时0分0秒';
      if(timerState.startTs){
        var el=Math.floor((Date.now()-timerState.startTs)/1000);
        var h=Math.floor(el/3600),m=Math.floor((el%3600)/60),s=el%60;
        comp=h+'小时'+m+'分'+s+'秒';
      }
      $('lt-t-name').textContent=(settings.myName||'我')+'和'+otherName+'一起听歌'+comp;
    }
    else{center.classList.remove('lt-mode-together');}
    $('lt-playerbg').style.backgroundImage=bgImage?'url("'+bgImage.replace(/"/g,'')+'")':'none';
  }
  function updatePlayUI(){
    var s=currentSong();
    var playing=playstate.isPlaying;
    $('lt-play').innerHTML=playing?icon('pause'):icon('play');
    var cover=$('lt-cover');
    if(playing)cover.classList.add('playing');else cover.classList.remove('playing');
    // mini
    var mp=$('lt-mini-play');if(mp)mp.innerHTML=playing?icon('pause'):icon('play');
    renderMini();
  }
  function updateLoopIcon(){
    var m=playstate.loopMode;
    $('lt-loop').innerHTML=m==='single'?icon('loopOne'):m==='random'?icon('shuffle'):icon('loopList');
  }
  function updateLikeIcon(){
    var s=currentSong();
    var on=s&&favorites.indexOf(s.id)>=0;
    $('lt-act-like-icon').innerHTML=on?icon('heartFill'):icon('heart');
    $('lt-act-like').classList.toggle('active',!!on);
  }
  function updateProgress(){
    var s=currentSong();
    var dur=s?s.duration||0:0;
    var cur=playstate.currentTime||0;
    if(s&&s.url&&audio.duration&&!isNaN(audio.duration)) dur=audio.duration;
    $('lt-curtime').textContent=fmtTime(cur);
    $('lt-durtime').textContent=fmtTime(dur);
    var pct=dur?Math.min(100,cur/dur*100):0;
    $('lt-bar-fill').style.width=pct+'%';
    $('lt-bar-dot').style.left=pct+'%';
  }
  function renderMini(){
    var s=currentSong();
    var show=currentView!=='player' && currentView!=='comments' && s;
    $('lt-mini').style.display=show?'flex':'none';
    if(!show)return;
    $('lt-mini-cover').innerHTML=s.cover?'<img src="'+escapeHTML(s.cover)+'">':icon('music');
    $('lt-mini-name').textContent=s.name;
    $('lt-mini-artist').textContent=s.artist||'';
    $('lt-mini-play').innerHTML=playstate.isPlaying?icon('pause'):icon('play');
  }

  /* ============ song list popup (menu button) ============ */
  function showSongPopup(){
    var old=$('lt-song-popup'); if(old) old.remove();
    var popup=document.createElement('div');
    popup.className='lt-song-popup'; popup.id='lt-song-popup';
    var box=document.createElement('div');
    box.className='lt-song-popup-box';
    var title=document.createElement('div');
    title.className='lt-song-popup-title'; title.textContent='歌单 ('+songs.length+'首)';
    box.appendChild(title);
    var list=document.createElement('div');
    list.className='lt-song-popup-list';
    if(!songs.length){ list.innerHTML='<div class="lt-empty">还没有歌曲</div>'; }
    songs.forEach(function(s,i){
      var item=document.createElement('div');
      item.className='lt-song-popup-item'+(s.id===playstate.currentSongId?' active':'');
      item.innerHTML='<div class="lt-song-no">'+(i+1)+'</div><div class="lt-song-name">'+escapeHTML(s.name)+(s.artist?' - '+escapeHTML(s.artist):'')+'</div>';
      item.onclick=function(){ popup.remove(); playSong(s.id,true); };
      list.appendChild(item);
    });
    box.appendChild(list);
    popup.appendChild(box);
    $('lt-app').querySelector('.lt-phone').appendChild(popup);
    popup.addEventListener('click',function(e){ if(e.target===popup) popup.remove(); });
  }

  /* ============ 渲染：评论 ============ */
  function renderComments(){
    var s=currentSong();
    $('lt-cmt-cover').innerHTML=s&&s.cover?'<img src="'+escapeHTML(s.cover)+'">':icon('music');
    $('lt-cmt-songname').textContent=s?s.name:'未在播放';
    $('lt-cmt-songartist').textContent=s?(s.artist||''):'';
    var list=$('lt-cmt-list');list.innerHTML='';
    var cur=playstate.currentSongId;
    var tops=comments.filter(function(c){return c.songId===cur&&!c.parentId;}).sort(function(a,b){return b.time-a.time;});
    var reps={};
    comments.forEach(function(c){if(c.parentId){(reps[c.parentId]=reps[c.parentId]||[]).push(c);}});
    $('lt-cmt-count').textContent='评论 '+(comments.filter(function(c){return c.songId===cur;}).length);
    if(!toppsExist(tops)){list.innerHTML='<div class="lt-empty">还没有评论，写下第一条吧</div>';return;}
    tops.forEach(function(t){
      list.appendChild(buildCmt(t,false));
      (reps[t.id]||[]).sort(function(a,b){return a.time-b.time;}).forEach(function(r){list.appendChild(buildCmt(r,true));});
    });
  }
  function toppsExist(t){return t.length>0;}
  function buildCmt(c,indent){
    var d=document.createElement('div');
    d.className='lt-cmt'+(indent?' lt-cmt-indent':'');
    var avClass=c.isMe?'':'other';
    var nickClass=c.isMe?'me':'';
    var nick=c.isMe?(settings.myName||'我'):otherName;
    var avImg=c.isMe?(ltAvatar1?'<img src="'+escapeHTML(ltAvatar1)+'">':icon('person')):(ltAvatar2?'<img src="'+escapeHTML(ltAvatar2)+'">':icon('person'));
    d.innerHTML='<div class="lt-cmt-avatar '+avClass+'">'+avImg+'</div>'+
      '<div class="lt-cmt-body">'+
        '<div class="lt-cmt-nick '+nickClass+'">'+escapeHTML(nick)+(c.isOther?'<span style="color:#8a8a90;font-weight:400"> · 对方</span>':'')+'</div>'+
        '<div class="lt-cmt-text">'+escapeHTML(c.content)+'</div>'+
        '<div class="lt-cmt-meta">'+
          '<span class="lt-cmt-time">'+timeAgo(c.time)+'</span>'+
          '<div class="lt-cmt-actions">'+
            '<button class="lt-cmt-like'+(c.liked?' on':'')+'" data-id="'+c.id+'">'+icon('heart')+'<span>'+(c.likes||0)+'</span></button>'+
            '<button class="lt-cmt-reply" data-id="'+c.id+'">回复</button>'+
            '<button class="lt-cmt-del" data-id="'+c.id+'">删除</button>'+
          '</div>'+
        '</div>'+
      '</div>';
    return d;
  }
  function timeAgo(ts){
    var d=Math.floor((Date.now()-ts)/1000);
    if(d<60)return '刚刚';
    if(d<3600)return Math.floor(d/60)+'分钟前';
    if(d<86400)return Math.floor(d/3600)+'小时前';
    if(d<2592000)return Math.floor(d/86400)+'天前';
    var dt=new Date(ts);
    return (dt.getMonth()+1)+'月'+dt.getDate()+'日';
  }

  /* ============ 屏幕切换 ============ */
  function showScreen(name){
    currentView=name;
    ['list','player','comments'].forEach(function(n){
      $('lt-screen-'+n).classList.toggle('active',n===name);
    });
    if(name==='list'){ showListView(listView); if(listView==='songs')renderList(); else renderProfileCard(); }
    if(name==='player')renderPlayer();
    if(name==='comments')renderComments();
    renderMini();
  }
  function showListView(v){
    listView=v;
    var home=$('lt-list-home'), songsEl=$('lt-list-songs'), title=$('lt-list-title');
    if(v==='songs'){
      home.style.display='none';
      songsEl.style.display='flex';
    } else {
      home.style.display='';
      songsEl.style.display='none';
      title.textContent='';
      renderProfileCard();
      updateEndTogetherBtn();
    }
  }
  function updateEndTogetherBtn(){
    var btn=$('lt-end-together');
    if(btn) btn.style.display = together ? 'block' : 'none';
  }

  /* ============ 播放逻辑 ============ */
  function setupAudioListeners(){
    audio.addEventListener('timeupdate',function(){
      var s=currentSong();
      if(s&&s.url&&!isNaN(audio.currentTime)){
        playstate.currentTime=audio.currentTime;
        updateProgress();
        save(K.play,playstate);
      }
    });
    audio.addEventListener('loadedmetadata',function(){
      if(playstate.currentTime){try{audio.currentTime=playstate.currentTime;}catch(e){}}
      updateProgress();
    });
    audio.addEventListener('ended',handleEnded);
    audio.addEventListener('play',function(){playstate.isPlaying=true;updatePlayUI();});
    audio.addEventListener('pause',function(){playstate.isPlaying=false;updatePlayUI();save(K.play,playstate);});
    audio.addEventListener('error',function(){ /* 静默，模拟回退 */ });
  }
  function startSim(){
    stopSim();
    simTimer=setInterval(function(){
      if(!playstate.isPlaying)return;
      var s=currentSong();if(!s)return;
      playstate.currentTime+=1;
      if(s.duration&&playstate.currentTime>=s.duration){playstate.currentTime=s.duration;handleEnded();return;}
      updateProgress();
      save(K.play,playstate);
    },1000);
  }
  function stopSim(){if(simTimer){clearInterval(simTimer);simTimer=null;}}
  function play(){
    var s=currentSong();if(!s)return;
    playstate.isPlaying=true;
    if(s.url){try{audio.play().catch(function(){playstate.isPlaying=false;updatePlayUI();});}catch(e){playstate.isPlaying=false;}}
    else{startSim();}
    save(K.play,playstate);updatePlayUI();
  }
  function pause(){
    playstate.isPlaying=false;
    var s=currentSong();
    if(s&&s.url){try{audio.pause();}catch(e){}}
    stopSim();
    save(K.play,playstate);updatePlayUI();
  }
  function togglePlay(){if(playstate.isPlaying)pause();else play();}
  function playSong(id,fromStart){
    var s=songs.find(function(x){return x.id===id;});if(!s)return;
    if(playstate.currentSongId!==id){playstate.currentTime=0;}
    if(fromStart)playstate.currentTime=0;
    playstate.currentSongId=id;
    if(!s.duration&&!s.url)s.duration=180+Math.floor(Math.random()*120);
    playedSongs.push(id);_ltPlayedModified=true;save(K.played,playedSongs);
    stopSim();
    if(s.url){
      audio.src=s.url;
      try{audio.load();}catch(e){}
      if(playstate.isPlaying||fromStart===false){
        // will play via play()
      }
    }else{
      try{audio.pause();audio.removeAttribute('src');}catch(e){}
    }
    save(K.play,playstate);
    renderPlayer();renderProfileCard();renderMini();
    // 自动播放（用户手势触发可生效）
    if(fromStart!==false){
      if(s.url){try{audio.play().then(function(){playstate.isPlaying=true;updatePlayUI();}).catch(function(){playstate.isPlaying=false;updatePlayUI();});}catch(e){}}
      else{playstate.isPlaying=true;startSim();updatePlayUI();}
      save(K.play,playstate);
    }
    maybeScheduleProb(s);
  }
  function nextSong(){
    if(!songs.length)return;
    var idx=songs.findIndex(function(s){return s.id===playstate.currentSongId;});
    var next;
    if(playstate.loopMode==='random'){
      if(songs.length===1)next=songs[0];
      else{do{next=songs[Math.floor(Math.random()*songs.length)];}while(next.id===playstate.currentSongId);}
    }else{
      next=songs[(idx+1)%songs.length];
    }
    playSong(next.id,true);
  }
  function prevSong(){
    if(!songs.length)return;
    var idx=songs.findIndex(function(s){return s.id===playstate.currentSongId;});
    var p=songs[(idx-1+songs.length)%songs.length];
    playSong(p.id,true);
  }
  function handleEnded(){
    var s=currentSong();
    if(playstate.loopMode==='single'){
      playstate.currentTime=0;
      if(s&&s.url){try{audio.currentTime=0;audio.play();}catch(e){}}
      else{playstate.isPlaying=true;startSim();}
      updateProgress();updatePlayUI();
      return;
    }
    nextSong();
  }

  /* ============ 概率事件 ============ */
  function maybeScheduleProb(song){
    if(!together)return;
    if(probScheduled[song.id])return;
    probScheduled[song.id]=true;
    // 1) 切歌（单曲循环不触发）
    if(playstate.loopMode!=='single' && Math.random()<0.05){
      setTimeout(function(){
        if(!together||playstate.currentSongId!==song.id)return;
        toast('对方切歌了，已为你切换下一首');
        setTimeout(nextSong,800);
      },6000+Math.random()*8000);
      return; // 切歌后不再判收藏/评论
    }
    // 2) 收藏 5%
    if(Math.random()<0.05){
      setTimeout(function(){
        if(!together||playstate.currentSongId!==song.id)return;
        if(favorites.indexOf(song.id)<0){favorites.push(song.id);save(K.fav,favorites);}
        toast('对方收藏了这首歌');
        updateLikeIcon();renderList();
      },5000+Math.random()*10000);
    }
    // 3) 评论 10%
    if(Math.random()<0.10){
      setTimeout(function(){
        if(!together||playstate.currentSongId!==song.id)return;
        addOtherComment(song);
      },8000+Math.random()*14000);
    }
  }
  function addOtherComment(song){
    var allCards=getAllWordCards();
    var content=allCards.length>0?allCards[Math.floor(Math.random()*allCards.length)].text:randPick(LT_FALLBACK_REPLIES);
    if(!content)return;
    var c={id:randId(),songId:song.id,nickname:otherName,isMe:false,isOther:true,content:content,time:Date.now(),likes:0,liked:false,parentId:null};
    comments.push(c);save(K.comments,comments);
    toast(otherName+' 评论了「'+song.name+'」');
    if(currentView==='comments'&&playstate.currentSongId===song.id)renderComments();
  }

  /* ============ 评论交互 ============ */
  function postComment(){
    var inp=$('lt-cmt-input');
    var text=inp.value.trim();
    if(!text){toast('请输入评论内容');return;}
    var s=currentSong();
    var pid=replyTarget;
    var parent=pid?comments.find(function(c){return c.id===pid;}):null;
    var content=text;
    if(parent && !text.toLowerCase().indexOf('@')){
      // 已带 @ 前缀
    }
    var c={id:randId(),songId:playstate.currentSongId,nickname:settings.myName||'我',isMe:true,isOther:false,content:content,time:Date.now(),likes:0,liked:false,parentId:pid};
    comments.push(c);save(K.comments,comments);
    inp.value='';replyTarget=null;inp.placeholder='写下你的评论...';
    renderComments();
    // 评论后自动安排对方在设置时间后回复
    scheduleAutoReply(c);
  }
  function scheduleAutoReply(myComment){
    var delayMin=settings.replyDelayMin||1;
    var targetTs=Date.now()+delayMin*60*1000;
    var sch={id:randId(),parentId:myComment.id,songId:myComment.songId,targetTs:targetTs,replied:false};
    scheduledReplies.push(sch);save(K.replies,scheduledReplies);
    /* 轮询机制会自动检测并执行到期的回复 */
  }
  /* 轮询检查到期回复，每3秒检查一次，比单次setTimeout更可靠 */
  var _replyPollTimer=null;
  function startReplyPolling(){
    if(_replyPollTimer) return;
    _replyPollTimer=setInterval(function(){
      checkDueReplies();
    },3000);
    /* 立即检查一次 */
    checkDueReplies();
  }
  function checkDueReplies(){
    var now=Date.now();
    var changed=false;
    for(var i=0;i<scheduledReplies.length;i++){
      var sch=scheduledReplies[i];
      if(!sch.replied && sch.targetTs<=now){
        doReply(sch);
        changed=true;
      }
    }
    if(changed) save(K.replies,scheduledReplies);
  }
  function doReply(sch){
    if(sch.replied)return;
    sch.replied=true;
    var allCards=getAllWordCards();
    var content=allCards.length>0?allCards[Math.floor(Math.random()*allCards.length)].text:randPick(LT_FALLBACK_REPLIES);
    if(!content)content=randPick(LT_FALLBACK_REPLIES);
    var c={id:randId(),songId:sch.songId,nickname:otherName,isMe:false,isOther:true,content:content,time:Date.now(),likes:0,liked:false,parentId:sch.parentId};
    comments.push(c);save(K.comments,comments);
    toast(otherName+' 回复了你');
    if(currentView==='comments'&&playstate.currentSongId===sch.songId)renderComments();
  }
  function processScheduledReplies(){
    /* 启动轮询，由轮询统一检查到期回复 */
    startReplyPolling();
    /* 立即检查一次过期回复 */
    checkDueReplies();
  }
  function delComment(id){
    var idx=comments.findIndex(function(c){return c.id===id;});
    if(idx<0)return;
    /* 同时删除该评论的所有子回复 */
    comments=comments.filter(function(c){return c.id!==id && c.parentId!==id;});
    save(K.comments,comments);
    /* 清理关联的定时回复 */
    scheduledReplies=scheduledReplies.filter(function(s){return s.parentId!==id;});
    save(K.replies,scheduledReplies);
    renderComments();
    toast('已删除');
  }
  function toggleCommentLike(id){
    var c=comments.find(function(x){return x.id===id;});if(!c)return;
    if(c.liked){c.liked=false;c.likes=Math.max(0,(c.likes||0)-1);}
    else{c.liked=true;c.likes=(c.likes||0)+1;}
    save(K.comments,comments);renderComments();
  }
  function setReplyTarget(id){
    var c=comments.find(function(x){return x.id===id;});
    var nick=c?(c.isMe?(settings.myName||'我'):otherName):'';
    replyTarget=id;
    var inp=$('lt-cmt-input');
    inp.placeholder='回复 @'+nick;
    inp.focus();
  }

  /* ============ 邀请 ============ */
  function openInvite(){
    var s=currentSong();
    if(!s){toast('请先选择一首歌');return;}
    /* get contacts from the main app */
    var contacts=[];
    try{
      if(typeof appData!=='undefined'&&appData&&appData.contactList&&Array.isArray(appData.contactList.contacts)){
        contacts=appData.contactList.contacts;
      }
    }catch(e){}
    if(!contacts.length){ toast('没有可邀请的联系人'); return; }
    /* show contact picker */
    var old=$('lt-contact-picker'); if(old) old.remove();
    var picker=document.createElement('div');
    picker.className='lt-contact-picker'; picker.id='lt-contact-picker';
    picker.innerHTML='<div class="lt-cp-header">'+
      '<button class="lt-icon-btn" id="lt-cp-back">'+icon('back')+'</button>'+
      '<div class="lt-cp-title">选择联系人邀请</div>'+
      '<div style="width:38px"></div>'+
      '</div>'+
      '<div class="lt-cp-list" id="lt-cp-list"></div>';
    $('lt-app').querySelector('.lt-phone').appendChild(picker);
    var listEl=picker.querySelector('#lt-cp-list');
    if(!contacts.length){
      listEl.innerHTML='<div class="lt-cp-empty">没有联系人</div>';
    } else {
      contacts.forEach(function(c){
        var item=document.createElement('div');
        item.className='lt-cp-item';
        var avHtml=c.avatar?'<img src="'+escapeHTML(c.avatar)+'">':icon('person');
        item.innerHTML='<div class="lt-cp-avatar">'+avHtml+'</div><div class="lt-cp-name">'+escapeHTML(c.nickname||'联系人')+'</div>';
        item.onclick=function(){ picker.remove(); sendInviteToContact(c, s); };
        listEl.appendChild(item);
      });
    }
    picker.querySelector('#lt-cp-back').onclick=function(){ picker.remove(); };
  }
  function sendInviteToContact(contact, song){
    /* 记录当前一起听歌的联系人ID，用于后续调取专属字卡 */
    ltContactId=contact.id;save(K.contactId,ltContactId);
    /* 同步对方昵称 */
    if(contact.nickname){ otherName=contact.nickname;save(K.other,otherName); }
    /* check if this song has been rejected 3 times this round */
    var songRejectKey='lt_songReject_'+song.id;
    var songRejectCount=0;
    try{ songRejectCount=parseInt(localStorage.getItem(songRejectKey)||'0',10); }catch(e){}
    if(songRejectCount>=3){ toast('该歌曲已被拒绝3次，本轮不再生成邀请卡片'); return; }
    /* send invite card to the contact's chat */
    var inviteId=Date.now();
    try{
      var savedActive = (typeof _activeContactId!=='undefined') ? _activeContactId : null;
      if(typeof _activeContactId!=='undefined') _activeContactId = contact.id;
      if(typeof addMessage==='function'){
        addMessage({
          id: inviteId,
          type: 'system',
          subtype: 'lt-invite',
          content: '一起听歌邀请：'+song.name+(song.artist?' - '+song.artist:''),
          contactId: contact.id,
          ltInvite: {
            songId: song.id,
            name: song.name,
            artist: song.artist||'',
            cover: song.cover||'',
            status: 'pending',
            sentAt: Date.now(),
            rejectCount: 0
          }
        });
      }
      if(typeof _activeContactId!=='undefined') _activeContactId = savedActive;
      if(typeof saveData==='function') saveData();
    }catch(e){}
    toast('已向'+(contact.nickname||'对方')+'发送一起听歌邀请');
    /* auto-respond with 90% accept / 10% reject after delay */
    var waitMs=3000+Math.random()*5000;
    setTimeout(function(){
      var accept=Math.random()<0.9;
      /* update invite card status in the correct contact's chat history */
      var savedActive=null;
      try{
        if(typeof _activeContactId!=='undefined'){ savedActive=_activeContactId; }
        if(typeof _activeContactId!=='undefined' && contact && contact.id){ _activeContactId=contact.id; }
        if(typeof appData!=='undefined'&&appData.chatHistory){
          appData.chatHistory.forEach(function(m){
            if(m.id===inviteId && m.ltInvite){ m.ltInvite.status=accept?'accepted':'rejected'; if(!accept){ m.ltInvite.rejectCount=(m.ltInvite.rejectCount||0)+1; } }
          });
          if(typeof saveData==='function') saveData();
          if(typeof renderMessages==='function') renderMessages(false);
        }
      }catch(e){}
      finally{
        if(typeof _activeContactId!=='undefined'){ _activeContactId=savedActive; }
      }
      if(accept){
        /* start together — NO chat bubble message */
        together=true;save(K.together,true);
        timerState.startTs=Date.now();save(K.timer,timerState);
        startTimer();
        updateCenter();renderMini();renderPlayer();renderProfileCard();updateEndTogetherBtn();
        toast(contact.nickname+' 接受了邀请，开始一起听');
      } else {
        /* NO chat bubble message — just update reject count */
        rejectCount++;save(K.reject,rejectCount);
        /* increment per-song reject count */
        try{
          var srKey='lt_songReject_'+song.id;
          var srCnt=parseInt(localStorage.getItem(srKey)||'0',10)+1;
          localStorage.setItem(srKey,String(srCnt));
        }catch(e){}
        toast(contact.nickname+' 拒绝了一起听歌邀请');
      }
    }, waitMs);
  }
  function closeInvite(){if(inviteTimer){clearInterval(inviteTimer);inviteTimer=null;}$('lt-invite').style.display='none';}
  function acceptInvite(){
    closeInvite();
    together=true;save(K.together,true);
    timerState.startTs=Date.now();save(K.timer,timerState);
    showScreen('player');
    startTimer();
    updateCenter();renderMini();renderPlayer();renderProfileCard();updateEndTogetherBtn();
    toast(otherName+' 接受了邀请，开始一起听');
  }
  function rejectInvite(){
    closeInvite();
    rejectCount++;save(K.reject,rejectCount);
    var texts=['系统抽疯！再邀请对方一次试试。','嗯？不管了，面子大过天，再邀请一次。','？我不中了，去买彩票吧。'];
    toast(texts[Math.min(rejectCount-1,2)]);
  }
  function endTogether(){
    together=false;save(K.together,false);
    stopTimer();
    /* preserve cumulativeTime - it persists across sessions */
    timerState.startTs=null;save(K.timer,timerState);
    updateCenter();renderMini();renderPlayer();renderProfileCard();updateEndTogetherBtn();
    toast('已结束一起听歌');
  }
  function acceptInviteFromChat(inv, msgId){
    if(!inv)return;
    try{
      if(typeof appData!=='undefined' && appData && appData.chatHistory){
        appData.chatHistory.forEach(function(m){ if(m.id===msgId && m.ltInvite){ m.ltInvite.status='accepted'; } });
        if(typeof saveData==='function')saveData();
        if(typeof renderMessages==='function')renderMessages(false);
      }
    }catch(e){}
    together=true;save(K.together,true);
    timerState.startTs=Date.now();save(K.timer,timerState);
    startTimer();
    if(inv.songId && songs.some(function(s){return s.id===inv.songId;})){
      playstate.currentSongId=inv.songId;save(K.play,playstate);
    }
    if(!playstate.currentSongId && songs.length){ playstate.currentSongId=songs[0].id; save(K.play,playstate); }
    updateCenter();renderMini();renderPlayer();renderProfileCard();updateEndTogetherBtn();
    toast('已开始一起听');
  }
  function rejectInviteFromChat(inv, msgId){
    if(!inv)return;
    try{
      if(typeof appData!=='undefined' && appData && appData.chatHistory){
        appData.chatHistory.forEach(function(m){ if(m.id===msgId && m.ltInvite){ m.ltInvite.status='rejected'; m.ltInvite.rejectCount=(m.ltInvite.rejectCount||0)+1; } });
        if(typeof saveData==='function')saveData();
        if(typeof renderMessages==='function')renderMessages(false);
      }
    }catch(e){}
    rejectCount++;save(K.reject,rejectCount);
    /* increment per-song reject count */
    if(inv.songId){
      try{
        var srKey='lt_songReject_'+inv.songId;
        var srCnt=parseInt(localStorage.getItem(srKey)||'0',10)+1;
        localStorage.setItem(srKey,String(srCnt));
      }catch(e){}
    }
    var texts=['系统抽疯！再邀请对方一次试试。','嗯？不管了，面子大过天，再邀请一次。','？我不中了，去买彩票吧。'];
    toast(texts[Math.min(rejectCount-1,2)]);
  }

  /* ============ 一起听计时器 ============ */
  /* sessionTimer = current session (resets each invite); cumulativeTime = total across all sessions */
  function getCumulativeTime(){ return cumulativeTime; }
  function startTimer(){
    if(!together)return;
    if(!timerState.startTs){timerState.startTs=Date.now();save(K.timer,timerState);}
    stopTimer();
    timerInterval=setInterval(updateTimer,1000);
    updateTimer();
  }
  function stopTimer(){if(timerInterval){clearInterval(timerInterval);timerInterval=null;}}
  function updateTimer(){
    if(!timerState.startTs)return;
    updateCenter();
    /* accumulate into cumulativeTime */
    cumulativeTime++; save(K.cumTime,cumulativeTime);
    renderProfileCard();
  }

  /* ============ 图片上传（封面/背景） ============ */
  function pickImage(cb){
    fileCallback=cb;
    $('lt-file').value='';
    $('lt-file').click();
  }
  function compressImage(dataUrl, opts, cb){
    opts=opts||{};
    var maxW=opts.maxWidth||1200, maxH=opts.maxHeight||1200, quality=opts.quality||0.82;
    var img=new Image();
    img.onload=function(){
      var w=img.width, h=img.height;
      if(w>maxW||h>maxH){
        var ratio=Math.min(maxW/w, maxH/h);
        w=Math.floor(w*ratio); h=Math.floor(h*ratio);
      }
      var canvas=document.createElement('canvas');
      canvas.width=w; canvas.height=h;
      var ctx=canvas.getContext('2d');
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h);
      ctx.drawImage(img,0,0,w,h);
      var out=canvas.toDataURL('image/jpeg', quality);
      cb(out);
    };
    img.onerror=function(){ cb(dataUrl); };
    img.src=dataUrl;
  }
  function onFileChange(){
    var f=$('lt-file').files[0];if(!f)return;
    if(f.size>8*1024*1024){toast('图片过大，请选 8MB 以内的图片');return;}
    var r=new FileReader();
    r.onload=function(){
      compressImage(r.result, {maxWidth:1200, maxHeight:1200, quality:0.82}, function(compressed){
        if(fileCallback){fileCallback(compressed);fileCallback=null;}
      });
    };
    r.readAsDataURL(f);
  }

  /* ============ 模态：上传歌曲 ============ */
  function openUpload(){
    $('lt-up-name').value='';$('lt-up-artist').value='';$('lt-up-url').value='';
    $('lt-upload-modal').style.display='flex';
    setTimeout(function(){$('lt-up-name').focus();},50);
  }
  function submitUpload(){
    var name=$('lt-up-name').value.trim();
    if(!name){toast('请输入歌曲名');return;}
    var artist=$('lt-up-artist').value.trim();
    var url=$('lt-up-url').value.trim();
    songs.push({id:randId(),name:name,artist:artist,url:url,cover:null,duration:0});
    save(K.songs,songs);
    $('lt-upload-modal').style.display='none';
    renderList();
    toast('已添加「'+name+'」');
  }
  /* ============ 模态：设置 ============ */
  function openSettings(){
    $('lt-set-other').value=otherName;
    $('lt-set-me').value=settings.myName||'我';
    $('lt-set-dist').value=settings.distance||'';
    $('lt-set-replydelay').value=settings.replyDelayMin||1;
    $('lt-set-fontcolor').value=ltFontColor||'#1a1a1a';
    $('lt-set-homefontcolor').value=ltHomeFontColor||'#1a1a1a';
    $('lt-set-fontsize').value=ltFontSize||14;
    $('lt-set-fontsize-val').textContent=ltFontSize||14;
    $('lt-set-bgcolor').value=ltBgColor||'#f6f7f9';
    $('lt-settings-modal').style.display='flex';
  }
  function submitSettings(){
    otherName=$('lt-set-other').value.trim()||'对方';save(K.other,otherName);
    settings.myName=$('lt-set-me').value.trim()||'我';
    var dv=parseInt($('lt-set-dist').value,10);if(!isNaN(dv)&&dv>=0)settings.distance=dv;
    var rd=parseInt($('lt-set-replydelay').value,10);if(!isNaN(rd)&&rd>=1)settings.replyDelayMin=rd;else settings.replyDelayMin=1;
    save(K.settings,settings);
    ltFontColor=$('lt-set-fontcolor').value;save(K.ltFontColor,ltFontColor);
    ltHomeFontColor=$('lt-set-homefontcolor').value;save(K.ltHomeFontColor,ltHomeFontColor);
    ltFontSize=parseInt($('lt-set-fontsize').value,10);save(K.ltFontSize,ltFontSize);
    ltBgColor=$('lt-set-bgcolor').value;save(K.ltBgColor,ltBgColor);
    $('lt-settings-modal').style.display='none';
    applyLtAppearance();
    renderProfileCard();renderPlayer();renderMini();renderComments();
    toast('设置已保存');
  }
  function applyLtAppearance(){
    var phone=document.querySelector('#lt-app .lt-phone');
    if(!phone)return;
    /* font color - affects entire app */
    var fc=ltFontColor||'#1a1a1a';
    phone.style.setProperty('--lt-text',fc);
    phone.style.setProperty('--lt-sub',hexToRgbaLt(fc,0.58));
    phone.style.setProperty('--lt-faint',hexToRgbaLt(fc,0.4));
    /* homepage font color - affects nickname and stats numbers */
    var hfc=ltHomeFontColor||fc;
    var pn=$('lt-profile-name'); if(pn) pn.style.color=hfc;
    phone.querySelectorAll('.lt-stat-num').forEach(function(el){ el.style.color=hfc; });
    /* font size */
    if(ltFontSize){ phone.style.fontSize=ltFontSize+'px'; }
    /* background color/image (list + comments screens, NOT player screen) */
    var screens=[$('lt-screen-list'),$('lt-screen-comments')];
    screens.forEach(function(sc){
      if(!sc)return;
      if(ltBgColor) sc.style.background=ltBgColor;
      else sc.style.background='';
      if(ltBgImage){
        sc.style.backgroundImage='url("'+ltBgImage+'")';
        sc.style.backgroundSize='cover';
        sc.style.backgroundPosition='center';
      } else {
        sc.style.backgroundImage='';
        sc.style.backgroundSize='';
        sc.style.backgroundPosition='';
      }
    });
    /* profile card background (independent, clickable to replace) */
    /* 同时把背景延伸到顶栏区域，使整个上半部分填满 */
    var pc=$('lt-profile-card');
    var tb=document.querySelector('#lt-app .lt-screen-list .lt-topbar');
    if(pc){
      if(ltProfileBg){
        pc.style.setProperty('--lt-profile-bg','url("'+ltProfileBg+'")');
        pc.style.borderRadius='0 0 0 0';
        pc.style.margin='0';
        pc.style.paddingTop='calc(60px + env(safe-area-inset-top, 0px))'; /* 为顶栏留出空间（含刘海安全区） */
        if(tb){
          tb.style.background='url("'+ltProfileBg+'")';
          tb.style.backgroundSize='cover';
          tb.style.backgroundPosition='center';
          tb.style.position='absolute';
          tb.style.top='0';
          tb.style.left='0';
          tb.style.right='0';
          tb.style.zIndex='2';
        }
      }else{
        pc.style.setProperty('--lt-profile-bg','transparent');
        pc.style.borderRadius='22px';
        pc.style.margin='0 16px 2px';
        pc.style.paddingTop='4px';
        if(tb){
          tb.style.background='';
          tb.style.backgroundSize='';
          tb.style.backgroundPosition='';
          tb.style.position='';
          tb.style.top='';
          tb.style.left='';
          tb.style.right='';
          tb.style.zIndex='';
        }
      }
    }
    applyLtAvatars();
  }
  function hexToRgbaLt(hex,alpha){
    hex=hex.replace('#','');
    if(hex.length===3) hex=hex.split('').map(function(c){return c+c;}).join('');
    var r=parseInt(hex.slice(0,2),16)||0, g=parseInt(hex.slice(2,4),16)||0, b=parseInt(hex.slice(4,6),16)||0;
    return 'rgba('+r+','+g+','+b+','+alpha+')';
  }
  function applyLtAvatars(){
    var av1=$('lt-rel-av1'), av2=$('lt-rel-av2');
    var t1=$('lt-t-av1'), t2=$('lt-t-av2');
    [av1,t1].forEach(function(el){ if(!el)return; if(ltAvatar1){ el.innerHTML='<img src="'+escapeHTML(ltAvatar1)+'" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">'; } else { el.innerHTML=icon('person'); } });
    [av2,t2].forEach(function(el){ if(!el)return; if(ltAvatar2){ el.innerHTML='<img src="'+escapeHTML(ltAvatar2)+'" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">'; } else { el.innerHTML=icon('person'); } });
  }
  function pickLtAvatar(which){
    pickImage(function(data){
      if(which==='me'){ ltAvatar1=data;save(K.ltAvatar1,ltAvatar1); }
      else { ltAvatar2=data;save(K.ltAvatar2,ltAvatar2); }
      applyLtAvatars();
      toast('头像已更新');
    });
  }
  /* ============ 字卡调取（仅引用字卡App，不内置） ============ */
  function getAllWordCards(){
    /* 仅调取字卡App的共用字卡 + 当前联系人的专属字卡，不内置任何字卡 */
    var all=[];
    /* 主App共用字卡 */
    try{
      if(typeof appData!=='undefined' && appData && appData.wordCards){
        for(var g in appData.wordCards){
          (appData.wordCards[g]||[]).forEach(function(c){
            if(!c.hidden && c.text) all.push({text:c.text,source:'shared'});
          });
        }
      }
    }catch(e){}
    /* 当前联系人的专属字卡：优先用 ltContactId，其次按 otherName 匹配 */
    try{
      if(typeof appData!=='undefined' && appData && appData.contactWordCards){
        var matchedId=ltContactId;
        /* 如果没有 ltContactId，尝试按 otherName 匹配联系人 */
        if(!matchedId && appData.contactList){
          var contacts=appData.contactList.contacts||[];
          for(var ci=0;ci<contacts.length;ci++){
            if(contacts[ci].nickname===otherName){ matchedId=contacts[ci].id; break; }
          }
        }
        /* 如果匹配到联系人，使用其专属字卡；否则遍历所有联系人 */
        var cids=matchedId?[matchedId]:Object.keys(appData.contactWordCards);
        cids.forEach(function(cid){
          var cw=appData.contactWordCards[cid];
          if(cw && cw.cards){
            for(var g2 in cw.cards){
              (cw.cards[g2]||[]).forEach(function(c){
                if(!c.hidden && c.text) all.push({text:c.text,source:'exclusive'});
              });
            }
          }
        });
      }
    }catch(e){}
    return all;
  }

  /* ============ 事件绑定 ============ */
  function wire(){
    // 静态图标
    $('lt-list-back').innerHTML=icon('back');
    $('lt-list-settings').innerHTML=icon('more');
    $('lt-add-song').innerHTML=icon('plus');
    $('lt-playall-icon').innerHTML=icon('play');
    $('lt-player-back').innerHTML=icon('back');
    $('lt-player-more').innerHTML=icon('moreH');
    $('lt-rel-av1').innerHTML=icon('person'); if($('lt-rel-av2'))$('lt-rel-av2').innerHTML=icon('person');
    $('lt-t-av1').innerHTML=icon('person');$('lt-t-av2').innerHTML=icon('person');
    $('lt-entry-fav-icon').innerHTML=icon('heart');
    $('lt-entry-all-icon').innerHTML=icon('music');
    $('lt-entry-fav-arrow').innerHTML=icon('back').replace('M15 18l-6-6 6-6','M9 18l6-6-6-6');
    $('lt-entry-all-arrow').innerHTML=icon('back').replace('M15 18l-6-6 6-6','M9 18l6-6-6-6');
    $('lt-act-dl-icon').innerHTML=icon('download');
    $('lt-act-cmt-icon').innerHTML=icon('comment');
    $('lt-act-share-icon').innerHTML=icon('share');
    $('lt-act-more-icon').innerHTML=icon('moreH');
    $('lt-prev').innerHTML=icon('prev');
    $('lt-next').innerHTML=icon('next');
    $('lt-tolist').innerHTML=icon('list');
    $('lt-cmt-back').innerHTML=icon('back');
    $('lt-cmt-send').innerHTML=icon('send');
    $('lt-mini-next').innerHTML=icon('next');
    $('lt-mini-list').innerHTML=icon('list');

    // list
    $('lt-list-back').onclick=function(){
      if(listView==='songs'){ showListView('home'); }
      else { closeLTApp(); }
    };
    $('lt-list-settings').onclick=openSettings;
    $('lt-add-song').onclick=openUpload;
    $('lt-playall').onclick=function(){if(songs.length)playSong(songs[0].id,true);showScreen('player');};
    document.querySelectorAll('.lt-tab').forEach(function(t){
      t.onclick=function(){listTab=t.dataset.tab;document.querySelectorAll('.lt-tab').forEach(function(x){x.classList.toggle('active',x===t);});renderList();};
    });
    $('lt-songlist').addEventListener('click',function(e){
      var row=e.target.closest('.lt-song');if(!row)return;
      var id=row.dataset.id;
      if(e.target.closest('.lt-song-more')){
        var s=songs.find(function(x){return x.id===id;});
        var isFav=favorites.indexOf(id)>=0;
        showSheet(s.name,[{label:isFav?'取消收藏':'收藏',onClick:function(){toggleFav(id);renderList();}},{label:'删除歌曲',danger:true,onClick:function(){delSong(id);}}]);
        return;
      }
      playSong(id,true);showScreen('player');
    });
    // entry cards
    $('lt-entry-fav').onclick=function(){ listTab='fav'; document.querySelectorAll('.lt-tab').forEach(function(x){x.classList.toggle('active',x.dataset.tab==='fav');}); showListView('songs'); $('lt-list-title').textContent='我喜欢的'; renderList(); };
    $('lt-entry-all').onclick=function(){ listTab='all'; document.querySelectorAll('.lt-tab').forEach(function(x){x.classList.toggle('active',x.dataset.tab==='all');}); showListView('songs'); $('lt-list-title').textContent='我的歌单'; renderList(); };
    // end together
    $('lt-end-together').onclick=function(){
      showSheet('结束一起听歌',[{label:'确认结束',danger:true,onClick:function(){ endTogether(); }}]);
    };
    // rel-card avatar click handlers
    $('lt-rel-av1').onclick=function(e){ e.stopPropagation(); showSheet('我的头像',[{label:'上传头像',onClick:function(){ pickLtAvatar('me'); }},{label:'恢复默认',onClick:function(){ ltAvatar1=null;save(K.ltAvatar1,null);applyLtAvatars();toast('已恢复默认'); }}]); };
    if($('lt-rel-av2'))$('lt-rel-av2').onclick=function(e){ e.stopPropagation(); showSheet('对方头像',[{label:'上传头像',onClick:function(){ pickLtAvatar('other'); }},{label:'恢复默认',onClick:function(){ ltAvatar2=null;save(K.ltAvatar2,null);applyLtAvatars();toast('已恢复默认'); }}]); };

    /* ===== 仿网易云主页详情：交互 ===== */
    // 昵称可点击修改
    $('lt-profile-name').onclick=function(e){ e.stopPropagation();
      promptText('修改昵称',profileData.name||'你的昵称',function(v){ if(v&&v.trim()){profileData.name=v.trim();saveProfileData();renderProfileCard();} });
    };
    // 文案可点击修改
    $('lt-profile-date').onclick=function(e){ e.stopPropagation();
      promptText('修改文案',profileData.date||'点击即可替换文案',function(v){ if(v&&v.trim()){profileData.date=v.trim();saveProfileData();renderProfileCard();} });
    };
    // 关注可点击修改
    $('lt-stat-follow').onclick=function(e){ e.stopPropagation();
      promptText('修改关注数',String(profileData.follow!=null?profileData.follow:23),function(v){ var n=parseInt(v);if(!isNaN(n)){profileData.follow=n;saveProfileData();renderProfileCard();} });
    };
    // 粉丝可点击修改
    $('lt-stat-fans').onclick=function(e){ e.stopPropagation();
      promptText('修改粉丝数',String(profileData.fans!=null?profileData.fans:65),function(v){ var n=parseInt(v);if(!isNaN(n)){profileData.fans=n;saveProfileData();renderProfileCard();} });
    };
    // 等级可点击修改
    $('lt-stat-level').onclick=function(e){ e.stopPropagation();
      promptText('修改等级',String(profileData.level!=null?profileData.level:8),function(v){ var n=parseInt(v);if(!isNaN(n)&&n>=0){profileData.level=n;saveProfileData();renderProfileCard();} });
    };
    // 四张图片可点击替换
    $('lt-profile-imgs').addEventListener('click',function(e){
      var box=e.target.closest('.lt-profile-img'); if(!box)return;
      e.stopPropagation();
      var idx=parseInt(box.dataset.idx);
      showSheet('替换图片',[{label:'上传图片',onClick:function(){
        pickImage(function(data){
          if(!profileData.imgs)profileData.imgs=[null,null,null,null];
          profileData.imgs[idx]=data;saveProfileData();renderProfileCard();toast('图片已更新');
        });
      }},{label:'清除图片',onClick:function(){
        if(!profileData.imgs)profileData.imgs=[null,null,null,null];
        profileData.imgs[idx]=null;saveProfileData();renderProfileCard();
      }}]);
    });
    // 点击profile-card空白区域替换背景
    $('lt-profile-card').addEventListener('click',function(e){
      /* 子元素的点击都已 stopPropagation，这里只处理空白区域 */
      showSheet('替换背景',[{label:'上传背景图片',onClick:function(){
        pickImage(function(data){
          ltProfileBg=data;save(K.ltProfileBg,ltProfileBg);
          applyLtAppearance();toast('背景已更新');
        });
      }},{label:'清除背景',onClick:function(){
        ltProfileBg=null;save(K.ltProfileBg,null);
        applyLtAppearance();toast('已清除背景');
      }}]);
    });
    // 初始化渲染
    renderProfileCard();

    // player
    $('lt-player-back').onclick=function(){ showListView('home'); showScreen('list'); };
    $('lt-player-more').onclick=openSettings;
    $('lt-cover').onclick=function(){
      var s=currentSong();if(!s){toast('请先选择歌曲');return;}
      showSheet('更换封面',[{label:'上传封面图片',onClick:function(){pickImage(function(data){s.cover=data;save(K.songs,songs);renderPlayer();renderList();});}},{label:'恢复默认封面',onClick:function(){s.cover=null;save(K.songs,songs);renderPlayer();renderList();}}]);
    };
    $('lt-playerbg').onclick=function(){
      showSheet('更换背景',[{label:'上传背景图片',onClick:function(){pickImage(function(data){bgImage=data;save(K.bg,bgImage);updateCenter();});}},{label:'恢复默认背景',onClick:function(){bgImage=null;save(K.bg,null);updateCenter();}}]);
    };
    // 点击播放器空白区域也可更换背景
    $('lt-center').addEventListener('click',function(e){
      if(e.target.closest('.lt-t-avatar')) return;
      if(e.target.closest('.lt-cover')) return;
      if(e.target.closest('.lt-cover-hint')) return;
      showSheet('更换背景',[{label:'上传背景图片',onClick:function(){pickImage(function(data){bgImage=data;save(K.bg,bgImage);updateCenter();});}},{label:'恢复默认背景',onClick:function(){bgImage=null;save(K.bg,null);updateCenter();}}]);
    });
    $('lt-together').onclick=function(e){
      if(!together)return;
      var av1=$('lt-t-av1'), av2=$('lt-t-av2');
      if(e.target===av1||av1.contains(e.target)){
        e.stopPropagation();
        showSheet('更换我的头像',[{label:'上传头像图片',onClick:function(){ pickLtAvatar('me'); }},{label:'恢复默认头像',onClick:function(){ ltAvatar1=null;save(K.ltAvatar1,null);applyLtAvatars(); }}]);
      } else if(e.target===av2||av2.contains(e.target)){
        e.stopPropagation();
        showSheet('更换对方头像',[{label:'上传头像图片',onClick:function(){ pickLtAvatar('other'); }},{label:'恢复默认头像',onClick:function(){ ltAvatar2=null;save(K.ltAvatar2,null);applyLtAvatars(); }}]);
      }
    };
    $('lt-act-like').onclick=function(){var s=currentSong();if(s)toggleFav(s.id);};
    $('lt-act-dl').onclick=function(){toast('暂不支持下载');};
    $('lt-act-cmt').onclick=function(){showScreen('comments');};
    $('lt-act-share').onclick=openInvite;
    $('lt-act-more').onclick=openSettings;
    $('lt-loop').onclick=function(){
      var order=['list','single','random'];
      var i=order.indexOf(playstate.loopMode);
      playstate.loopMode=order[(i+1)%order.length];
      save(K.play,playstate);updateLoopIcon();
      toast(playstate.loopMode==='single'?'单曲循环':playstate.loopMode==='random'?'随机播放':'顺序播放');
    };
    $('lt-prev').onclick=prevSong;
    $('lt-play').onclick=togglePlay;
    $('lt-next').onclick=nextSong;
    $('lt-tolist').onclick=function(){ showSongPopup(); };

    // progress bar 拖动
    (function(){
      var bar=$('lt-bar');var dragging=false;
      function seek(clientX){
        var r=bar.getBoundingClientRect();var p=Math.max(0,Math.min(1,(clientX-r.left)/r.width));
        var s=currentSong();if(!s)return;
        var dur=s.duration||0;
        if(s.url&&audio.duration&&!isNaN(audio.duration))dur=audio.duration;
        playstate.currentTime=dur*p;
        if(s.url){try{audio.currentTime=playstate.currentTime;}catch(e){}}
        updateProgress();save(K.play,playstate);
      }
      bar.addEventListener('mousedown',function(e){dragging=true;seek(e.clientX);});
      window.addEventListener('mousemove',function(e){if(dragging)seek(e.clientX);});
      window.addEventListener('mouseup',function(){dragging=false;});
      bar.addEventListener('touchstart',function(e){dragging=true;seek(e.touches[0].clientX);},{passive:true});
      bar.addEventListener('touchmove',function(e){if(dragging)seek(e.touches[0].clientX);},{passive:true});
      bar.addEventListener('touchend',function(){dragging=false;});
    })();

    // comments
    $('lt-cmt-back').onclick=function(){showScreen('player');};
    $('lt-cmt-send').onclick=postComment;
    $('lt-cmt-input').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();postComment();}});
    $('lt-cmt-list').addEventListener('click',function(e){
      var lk=e.target.closest('.lt-cmt-like');if(lk){toggleCommentLike(lk.dataset.id);return;}
      var rp=e.target.closest('.lt-cmt-reply');if(rp){setReplyTarget(rp.dataset.id);return;}
      var dl=e.target.closest('.lt-cmt-del');if(dl){delComment(dl.dataset.id);return;}
    });

    // mini
    $('lt-mini-play').onclick=togglePlay;
    $('lt-mini-next').onclick=nextSong;
    $('lt-mini-list').onclick=function(){showScreen('list');};
    $('lt-mini').querySelector('.lt-mini-info').onclick=function(){ if(currentSong()) showScreen('player'); };
    $('lt-mini').querySelector('.lt-mini-cover').onclick=function(){ if(currentSong()) showScreen('player'); };

    // invite
    $('lt-invite-accept').onclick=acceptInvite;
    $('lt-invite-reject').onclick=rejectInvite;
    $('lt-invite').addEventListener('click',function(e){if(e.target===$('lt-invite')){closeInvite();toast('已取消邀请');}});

    // modals
    $('lt-up-cancel').onclick=function(){$('lt-upload-modal').style.display='none';};
    $('lt-up-ok').onclick=submitUpload;
    $('lt-set-cancel').onclick=function(){$('lt-settings-modal').style.display='none';};
    $('lt-set-ok').onclick=submitSettings;
    $('lt-set-fontsize').addEventListener('input',function(){$('lt-set-fontsize-val').textContent=this.value;});
    $('lt-set-bgimg-btn').onclick=function(){ pickImage(function(data){ ltBgImage=data;save(K.ltBgImage,ltBgImage);applyLtAppearance();toast('背景图片已更新'); }); };
    $('lt-set-bgimg-reset').onclick=function(){ ltBgImage=null;save(K.ltBgImage,null);applyLtAppearance();toast('已恢复默认背景'); };

    // sheet
    $('lt-sheet-cancel').onclick=hideSheet;
    $('lt-sheet').addEventListener('click',function(e){if(e.target===$('lt-sheet'))hideSheet();});

    // file
    $('lt-file').addEventListener('change',onFileChange);

    setupAudioListeners();
  }

  function toggleFav(id){
    var i=favorites.indexOf(id);
    if(i>=0){favorites.splice(i,1);toast('已取消收藏');}
    else{favorites.push(id);toast('已收藏');}
    save(K.fav,favorites);updateLikeIcon();renderList();
  }
  function delSong(id){
    songs=songs.filter(function(x){return x.id!==id;});save(K.songs,songs);
    if(playstate.currentSongId===id){
      stopSim();try{audio.pause();audio.removeAttribute('src');}catch(e){}
      playstate.currentSongId=songs.length?songs[0].id:null;playstate.currentTime=0;playstate.isPlaying=false;
      save(K.play,playstate);
    }
    renderList();renderPlayer();renderMini();
    toast('已删除');
  }

  /* ============ 初始化 / 恢复 ============ */
  function restore(){
    renderList();
    if(playstate.currentSongId){
      var s=currentSong();
      if(s){
        if(s.url){audio.src=s.url;try{audio.load();}catch(e){}}
        // currentTime 在 loadedmetadata 里恢复
        renderPlayer();renderProfileCard();renderMini();
        if(playstate.isPlaying){
          if(s.url){try{audio.play().catch(function(){playstate.isPlaying=false;updatePlayUI();});}catch(e){playstate.isPlaying=false;}}
          else{startSim();}
        }
        maybeScheduleProb(s);
      }
    }
    if(together){startTimer();updateCenter();}
    updateEndTogetherBtn();
    applyLtAppearance();
    processScheduledReplies();
    showListView('home');
    showScreen('list');
  }

  /* ============ 入口 ============ */
  function openLTApp(){
    // 在打开app前先应用全局设置，避免颜色闪烁
    if(typeof applyGlobalSettings === 'function'){
        try{ applyGlobalSettings(); }catch(e){}
    }
    // 隐藏桌面层和底栏，防止第三页桌面穿透重叠
    var dw = document.getElementById('desktopWrapper');
    if (dw) dw.style.display = 'none';
    var dock = document.querySelector('.dock-bar');
    if (dock) dock.style.display = 'none';
    $('lt-app').style.display='flex';
    if(!inited){wire();inited=true;}
    restore();
  }
  function closeLTApp(){
    /* do NOT pause music - it should continue playing in background */
    $('lt-app').style.display='none';
    // 恢复桌面层和底栏显示
    var dw = document.getElementById('desktopWrapper');
    if (dw) dw.style.display = '';
    var dock = document.querySelector('.dock-bar');
    if (dock) dock.style.display = '';
  }
  window.openLTApp=openLTApp;
  window.closeLTApp=closeLTApp;

  window.LTBridge={
    play:play, pause:pause, toggle:togglePlay, next:nextSong, prev:prevSong,
    fav:function(){ if(playstate.currentSongId) toggleFav(playstate.currentSongId); },
    seek:function(frac){ var cur=currentSong(); if(cur&&cur.duration){ var t=cur.duration*frac; playstate.currentTime=t; try{if(audio&&audio.duration)audio.currentTime=t;}catch(e){} save(K.play,playstate); } },
    acceptInviteFromChat:acceptInviteFromChat,
    rejectInviteFromChat:rejectInviteFromChat,
    getState:function(){ return {songs:songs,playstate:playstate,together:together,settings:settings,timer:timerState,favorites:favorites,audioDuration:(audio.duration&&!isNaN(audio.duration)?audio.duration:0),cumulativeTime:getCumulativeTime()}; }
  };
  // 不再自动打开：嵌入桌面后由用户点击触发，避免页面加载即弹窗遮挡桌面
})();

