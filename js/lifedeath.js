/* lifedeath.js - 从 app.js 拆分 */

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

