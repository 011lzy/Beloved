/* tarot.js - 从 app.js 拆分 */



(function(){
'use strict';

var TAROT_DATA = [
  {id:0,name:'愚者',keyword:'新的开始、自由、冒险',upright:'放下恐惧，踏上未知旅程。相信直觉，拥抱可能性。',reversed:'冲动、缺乏计划、逃避责任。建议先想清楚再行动。',symbol:'自由灵魂，踏上悬崖边的旅程'},
  {id:1,name:'魔术师',keyword:'创造、能力、显化',upright:'你拥有实现目标所需的一切资源。专注意图，采取行动。',reversed:'操控、缺乏信心、资源浪费。需要重新聚焦。',symbol:'四元素齐备，点化现实'},
  {id:2,name:'女祭司',keyword:'直觉、秘密、内在智慧',upright:'倾听内在声音，答案在你心中。保持静默与观察。',reversed:'忽视直觉、表面化、情绪封闭。给自己独处时间。',symbol:'月亮之下，掌握神秘知识'},
  {id:3,name:'皇后',keyword:'丰饶、母性、创造',upright:'享受丰盛与滋养，关爱自己和他人。创造力旺盛。',reversed:'过度依赖、缺乏自我价值、创造力受阻。先爱自己。',symbol:'大地之母，生命丰饶'},
  {id:4,name:'皇帝',keyword:'权威、结构、掌控',upright:'建立秩序与规则，以稳定和责任感领导局面。',reversed:'专横、僵化、滥用权力。学会灵活与信任。',symbol:'王座之上，建立法则'},
  {id:5,name:'教皇',keyword:'传统、信仰、教导',upright:'遵循传统智慧，寻求导师指引，重视精神成长。',reversed:'盲从、反叛、价值观冲突。找到适合自己的信念。',symbol:'精神导师，传递智慧'},
  {id:6,name:'恋人',keyword:'爱情、选择、和谐',upright:'真诚的关系与重要的选择。跟随内心，选择爱。',reversed:'不和谐、错误选择、逃避承诺。审视真实需求。',symbol:'天使祝福，灵魂伴侣'},
  {id:7,name:'战车',keyword:'意志、胜利、前进',upright:'以坚定意志克服困难，朝着目标全力前进。',reversed:'失控、方向不明、内部冲突。先整合对立力量。',symbol:'驭狮前行，无往不利'},
  {id:8,name:'力量',keyword:'勇气、耐心、内在力量',upright:'以柔克刚，用耐心和同理心驾驭内在力量。',reversed:'软弱、情绪失控、失去信心。相信自己足够强大。',symbol:'安抚雄狮，内在刚强'},
  {id:9,name:'隐士',keyword:'独处、内省、指引',upright:'退一步寻找答案，内在智慧会照亮前路。',reversed:'孤独、逃避、迷失方向。适度社交，别封闭自己。',symbol:'提灯独行，寻找真理'},
  {id:10,name:'命运之轮',keyword:'变化、命运、周期',upright:'命运正在转动，顺应变化，好运即将来临。',reversed:'抗拒改变、厄运、循环卡顿。接受无常，顺势而为。',symbol:'轮盘转动，命运无常'},
  {id:11,name:'正义',keyword:'公平、真理、责任',upright:'公正对待自己和他人，承担行为的后果。',reversed:'不公、逃避责任、偏见。诚实面对真相。',symbol:'天秤与剑，衡量因果'},
  {id:12,name:'倒吊人',keyword:'牺牲、暂停、新视角',upright:'换个角度看问题，甘愿暂停以换取更深的领悟。',reversed:'抗拒、无效牺牲、固执。放手让事情自然发生。',symbol:'倒立悬空，心甘情愿'},
  {id:13,name:'死神',keyword:'结束、转变、重生',upright:'旧阶段结束，为新生腾出空间。放下才能前进。',reversed:'停滞、恐惧改变、沉溺过去。勇敢告别。',symbol:'死亡与新生，循环不息'},
  {id:14,name:'节制',keyword:'平衡、调和、耐心',upright:'保持中庸与耐心，融合对立，找到内在平静。',reversed:'失衡、过度、急躁。调整节奏，适度而为。',symbol:'天使调和水火'},
  {id:15,name:'恶魔',keyword:'欲望、束缚、阴影',upright:'觉察束缚你的模式，正视欲望才能解脱。',reversed:'挣脱枷锁、摆脱依赖、重获自由。',symbol:'锁链束缚，也可挣脱'},
  {id:16,name:'塔',keyword:'突变、觉醒、崩塌',upright:'剧烈改变揭示真相，旧结构崩塌带来觉醒。',reversed:'逃避灾难、延迟崩溃、内在混乱。接受必要的破坏。',symbol:'雷火击塔，真相大白'},
  {id:17,name:'星星',keyword:'希望、疗愈、灵感',upright:'黑暗后的希望，相信自己，梦想正在显化。',reversed:'失去信心、绝望、自我怀疑。重新点燃希望。',symbol:'夜空繁星，希望之光'},
  {id:18,name:'月亮',keyword:'幻觉、潜意识、不安',upright:'面对恐惧与未知，信任直觉穿越迷雾。',reversed:' clarity、驱散恐惧、走出迷惑。事实会浮出水面。',symbol:'月光朦胧，潜藏幻象'},
  {id:19,name:'太阳',keyword:'快乐、成功、活力',upright:'光明与喜悦笼罩一切，成功与纯真带来好运。',reversed:'暂时的阴霾、过度乐观、失去童心。保持真诚。',symbol:'阳光普照，万物生长'},
  {id:20,name:'审判',keyword:'重生、觉醒、评价',upright:'听到内心的召唤，从过去觉醒，迎接新生。',reversed:'自我批判、逃避召唤、拒绝改变。宽恕自己。',symbol:'天使号角，灵魂觉醒'},
  {id:21,name:'世界',keyword:'完成、圆满、成就',upright:'一个循环圆满完成，达成目标，享受成就感。',reversed:'未完成、拖延、缺乏closure。再坚持一下。',symbol:'舞者入环，圆满合一'},
  /* ===== 小阿尔卡那 Minor Arcana ===== */
  {id:22,name:'权杖王牌',keyword:'热情、冒险、新机遇',upright:'新的热情与灵感涌现，勇敢迈出第一步。',reversed:'冲动、缺乏方向、热情消退。需要重新找到动力。',symbol:'权杖萌芽，生机勃发'},
  {id:23,name:'权杖二',keyword:'规划、抉择、远见',upright:'站在十字路口展望未来，做出长远规划。',reversed:'犹豫不决、目光短浅、错失良机。',symbol:'手持权杖眺望远方'},
  {id:24,name:'权杖三',keyword:'扩展、机遇、远眺',upright:'计划开始展开，机遇从远方来临。',reversed:'延迟、阻碍、目光受限。需要调整策略。',symbol:'眺望出海船只'},
  {id:25,name:'权杖四',keyword:'庆祝、团聚、稳定',upright:'欢庆成就，家园稳固，共享喜悦。',reversed:'不安定、矛盾、过渡期。需要重新稳固根基。',symbol:'权杖交织搭成花门'},
  {id:26,name:'权杖五',keyword:'竞争、冲突、磨合',upright:'多方竞争与意见冲突，需要协调磨合。',reversed:'内耗、逃避冲突、化解分歧。',symbol:'众人持杖争斗'},
  {id:27,name:'权杖六',keyword:'胜利、认可、荣耀',upright:'取得成功，获得众人认可与赞誉。',reversed:'失败、名誉受损、迟来的肯定。',symbol:'骑马戴冠凯旋'},
  {id:28,name:'权杖七',keyword:'捍卫、挑战、坚守',upright:'面对挑战坚守立场，捍卫自己的成果。',reversed:'压力过大、立场动摇、力不从心。',symbol:'单人持杖抵御上方'},
  {id:29,name:'权杖八',keyword:'迅速、行动、消息',upright:'事情快速推进，消息与行动齐飞。',reversed:'延迟、混乱、计划受阻。',symbol:'权杖凌空飞驰'},
  {id:30,name:'权杖九',keyword:'坚韧、警觉、坚持',upright:'经历磨难仍不放弃，最后的坚持即将见效。',reversed:'疲惫、防御过度、力竭。需要适当休整。',symbol:'负伤者倚杖而立'},
  {id:31,name:'权杖十',keyword:'重担、压力、责任',upright:'承担过多责任与压力，负担沉重。',reversed:'放下重担、释放压力、委托他人。',symbol:'负重前行十根权杖'},
  {id:32,name:'权杖侍从',keyword:'探索、好奇、灵感',upright:'充满好奇与热情，积极探索新方向。',reversed:'三分钟热度、方向不明、缺乏恒心。',symbol:'少年举杖仰望'},
  {id:33,name:'权杖骑士',keyword:'冒险、冲劲、热情',upright:'勇敢追逐目标，以热情驱动行动。',reversed:'鲁莽、急躁、虎头蛇尾。',symbol:'骑士策马举杖冲锋'},
  {id:34,name:'权杖皇后',keyword:'自信、魅力、热情',upright:'自信从容，以热情与魅力感染他人。',reversed:'嫉妒、专横、自我怀疑。',symbol:'皇后持杖端坐'},
  {id:35,name:'权杖国王',keyword:'领导、远见、魄力',upright:'具备远见与魄力，引领团队走向成功。',reversed:'专横、急功近利、刚愎自用。',symbol:'国王持杖威严端坐'},
  {id:36,name:'圣杯王牌',keyword:'新感情、爱意、灵感',upright:'情感涌动，新的爱与灵感如泉涌出。',reversed:'情感压抑、空虚、灵感枯竭。',symbol:'圣杯溢出清水'},
  {id:37,name:'圣杯二',keyword:'结合、吸引、伙伴',upright:'两人心意相通，建立深厚的情感联结。',reversed:'关系破裂、误解、分离。',symbol:'两人举杯相交'},
  {id:38,name:'圣杯三',keyword:'友谊、欢庆、分享',upright:'与朋友欢聚庆祝，分享喜悦与成就。',reversed:'过度享乐、社交疲劳、绯闻。',symbol:'三人举杯共庆'},
  {id:39,name:'圣杯四',keyword:'倦怠、冷漠、犹豫',upright:'对眼前机会视而不见，陷入倦怠与不满。',reversed:'觉醒、新兴趣、抓住机遇。',symbol:'双臂交叉面对三杯'},
  {id:40,name:'圣杯五',keyword:'失落、悲伤、遗憾',upright:'为失去的东西悲伤，忽略仍拥有的。',reversed:'释怀、接受、重新振作。',symbol:'披黑衣面对倾倒之杯'},
  {id:41,name:'圣杯六',keyword:'怀旧、童年、纯真',upright:'回忆温暖过往，重温纯真与美好。',reversed:'沉溺过去、停滞不前、放下回忆。',symbol:'孩童赠花于圣杯'},
  {id:42,name:'圣杯七',keyword:'幻想、迷惘、诱惑',upright:'面对众多选择与幻想，难以分辨真伪。',reversed:'清醒、做出选择、看清现实。',symbol:'云中浮现七杯幻象'},
  {id:43,name:'圣杯八',keyword:'离开、寻找、放下',upright:'放下已有的，踏上寻找内心满足的旅程。',reversed:'回归、害怕改变、徘徊不前。',symbol:'转身离去遗留八杯'},
  {id:44,name:'圣杯九',keyword:'满足、愿望、幸福',upright:'愿望成真，心满意足，享受丰盈。',reversed:'不满足、贪心、表面幸福。',symbol:'交叉双臂环抱九杯'},
  {id:45,name:'圣杯十',keyword:'和谐、家庭、圆满',upright:'家庭和睦，情感圆满，幸福长存。',reversed:'家庭矛盾、表面和谐、价值观分歧。',symbol:'彩虹下十杯排列'},
  {id:46,name:'圣杯侍从',keyword:'直觉、灵感、觉醒',upright:'情感与直觉萌芽，收到来自内心的信息。',reversed:'情绪化、不成熟、逃避真实感受。',symbol:'少年捧杯凝视杯中鱼'},
  {id:47,name:'圣杯骑士',keyword:'浪漫、追求、理想',upright:'带着浪漫与理想主动追求心中所想。',reversed:'不切实际、情绪化、虚假承诺。',symbol:'骑士骑马举杯前行'},
  {id:48,name:'圣杯皇后',keyword:'温柔、同理、包容',upright:'温柔而深情，以同理心理解他人。',reversed:'情绪波动、过度依赖、情感失控。',symbol:'皇后凝视装饰圣杯'},
  {id:49,name:'圣杯国王',keyword:'成熟、平衡、包容',upright:'情感成熟而稳重，以智慧平衡理智与感情。',reversed:'压抑情绪、阴郁、情绪操纵。',symbol:'国王端坐于波涛之上'},
  {id:50,name:'宝剑王牌',keyword:'清晰、突破、真理',upright:'思维清晰，突破困境，看清真相。',reversed:'混乱、错误判断、言语伤人。',symbol:'单剑悬空持冠'},
  {id:51,name:'宝剑二',keyword:'僵局、抉择、平衡',upright:'陷入两难僵局，需要冷静做出抉择。',reversed:'做出决定、信息澄清、打破僵局。',symbol:'蒙眼女子双手持剑'},
  {id:52,name:'宝剑三',keyword:'心碎、悲伤、痛苦',upright:'经历情感伤痛，心碎与悲伤袭来。',reversed:'疗愈、释怀、走出痛苦。',symbol:'三剑刺穿红心'},
  {id:53,name:'宝剑四',keyword:'休息、恢复、静思',upright:'需要暂停休息，恢复身心能量。',reversed:'倦怠、被迫休息、重新行动。',symbol:'骑士卧于三剑之上'},
  {id:54,name:'宝剑五',keyword:'冲突、争执、得失',upright:'卷入冲突与争斗，胜利却得不偿失。',reversed:'和解、反思、放下争端。',symbol:'拾剑者面对败者离去'},
  {id:55,name:'宝剑六',keyword:'过渡、转移、平息',upright:'离开困境，平稳过渡到新的阶段。',reversed:'抗拒改变、停滞、问题未解。',symbol:'乘船渡水载剑'},
  {id:56,name:'宝剑七',keyword:'策略、隐秘、欺瞒',upright:'运用策略与智谋，小心隐藏的欺瞒。',reversed:'坦白、真相揭露、良心发现。',symbol:'悄悄搬走营帐之剑'},
  {id:57,name:'宝剑八',keyword:'困境、束缚、限制',upright:'感到被困与束缚，多是自我设限。',reversed:'解脱、觉醒、挣脱束缚。',symbol:'蒙眼女子被剑围绕'},
  {id:58,name:'宝剑九',keyword:'焦虑、忧愁、噩梦',upright:'深夜焦虑与忧愁，被恐惧困扰。',reversed:'希望、走出焦虑、面对恐惧。',symbol:'惊醒者坐于床上'},
  {id:59,name:'宝剑十',keyword:'终结、低谷、谷底',upright:'痛苦达到尽头，一个篇章的终结。',reversed:'复苏、最坏已过、重生。',symbol:'倒地者身中十剑'},
  {id:60,name:'宝剑侍从',keyword:'好奇、机敏、求知',upright:'思维敏捷好奇，积极探求真相与新知。',reversed:'八卦、轻率、言多必失。',symbol:'少年举剑迎风'},
  {id:61,name:'宝剑骑士',keyword:'果断、直率、行动',upright:'思维敏捷行动果断，直率地推进目标。',reversed:'鲁莽、冲动、言辞伤人。',symbol:'骑士策马举剑冲锋'},
  {id:62,name:'宝剑皇后',keyword:'理性、独立、清醒',upright:'理性而独立，以清醒的判断看透事物。',reversed:'冷酷、苛刻、刻薄挑剔。',symbol:'皇后举剑端坐'},
  {id:63,name:'宝剑国王',keyword:'权威、公正、智慧',upright:'以智慧与公正做出决断，彰显权威。',reversed:'专制、冷酷、判断失误。',symbol:'国王举剑威严端坐'},
  {id:64,name:'星币王牌',keyword:'机遇、财富、新始',upright:'物质与机遇降临，新的财富旅程开启。',reversed:'错失机会、财务损失、计划拖延。',symbol:'手掌托起一枚星币'},
  {id:65,name:'星币二',keyword:'平衡、灵活、兼顾',upright:'灵活应对多重事务，在两端保持平衡。',reversed:'失衡、应接不暇、顾此失彼。',symbol:'双手抛接两枚星币'},
  {id:66,name:'星币三',keyword:'合作、技艺、团队',upright:'团队协作各展所长，共同打造精品。',reversed:'缺乏配合、意见分歧、质量不佳。',symbol:'匠人于教堂讨论技艺'},
  {id:67,name:'星币四',keyword:'守财、稳定、占有',upright:'稳固守护已有财富，追求安全感。',reversed:'吝啬、过度紧抓、贪恋物质。',symbol:'紧抱星币者坐于城上'},
  {id:68,name:'星币五',keyword:'匮乏、困境、艰难',upright:'物质与精神陷入困境，感到被遗弃。',reversed:'恢复、援助到来、困境缓解。',symbol:'两人于风雪中行经教堂'},
  {id:69,name:'星币六',keyword:'慷慨、给予、互助',upright:'慷慨分享财富，给予与接受保持平衡。',reversed:'不平等、施舍心态、账目失衡。',symbol:'商人以天平衡量施予'},
  {id:70,name:'星币七',keyword:'耐心、等待、评估',upright:'耐心等待成果成熟，审视付出的收获。',reversed:'无果、急躁、投入与回报不符。',symbol:'农夫凝视藤上星币'},
  {id:71,name:'星币八',keyword:'专注、精进、勤勉',upright:'专注打磨技艺，勤勉精进日有所成。',reversed:'敷衍、缺乏专注、粗制滥造。',symbol:'匠人专心雕刻星币'},
  {id:72,name:'星币九',keyword:'富足、独立、成就',upright:'享受独立与富足，收获自我成就。',reversed:'依赖、虚假富足、忽视内在。',symbol:'女子立于丰饶花园'},
  {id:73,name:'星币十',keyword:'传承、富裕、稳固',upright:'家族财富稳固传承，长久积累的富足。',reversed:'财产纠纷、家族矛盾、失去传承。',symbol:'老者与家族于城门前'},
  {id:74,name:'星币侍从',keyword:'学习、务实、目标',upright:'踏实学习新技能，认真规划现实目标。',reversed:'懒惰、好高骛远、缺乏进步。',symbol:'少年凝视手中星币'},
  {id:75,name:'星币骑士',keyword:'勤恳、踏实、稳健',upright:'勤恳踏实稳步前行，可靠地推进目标。',reversed:'固执、保守、进展缓慢。',symbol:'骑士骑马缓行持币'},
  {id:76,name:'星币皇后',keyword:'丰盛、滋养、关怀',upright:'以务实与温柔滋养周围，营造丰盛生活。',reversed:'过度操劳、物质焦虑、忽视自我。',symbol:'皇后端坐于花园之中'},
  {id:77,name:'星币国王',keyword:'富有、稳重、掌控',upright:'稳重而富有，以智慧掌控物质与事业。',reversed:'贪婪、顽固、物质至上。',symbol:'国王端坐于宝座之上'}
];

var SPREAD_INFO = {
  '1': {name:'单张牌 · 今日运势', positions:['今日指引']},
  '3': {name:'三张牌 · 过去现在未来', positions:['过去','现在','未来']},
  '5': {name:'五张牌 · 爱情指引', positions:['你','对方','关系','阻碍','建议']}
};

var STORAGE_KEY = 'tarot_history_v1';
var state = {
  question: '',
  spread: null,
  deck: [],
  drawn: [],
  selectedCount: 0,
  shuffleCards: []
};

function $(id){ return document.getElementById(id); }
function toast(msg){
  var el=$('tarot-toast'); el.textContent=msg; el.classList.add('show');
  setTimeout(function(){ el.classList.remove('show'); }, 2200);
}
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ===== Phase 1: 输入问题 + 选择牌阵 ===== */
function bindSpreadSelection(){
  document.querySelectorAll('.tarot-spread-card').forEach(function(el){
    el.onclick = function(){
      document.querySelectorAll('.tarot-spread-card').forEach(function(c){ c.classList.remove('selected'); });
      el.classList.add('selected');
      state.spread = el.dataset.spread;
      $('tarot-start').disabled = false;
    };
  });
  $('tarot-start').onclick = function(){
    if(!state.spread){ toast('请先选择牌阵'); return; }
    state.question = ($('tarot-question').value || '').trim();
    enterShufflePhase();
  };
}

/* ===== Phase 2: 洗牌（交互式拖拽） ===== */
function initShuffleCards(){
  state.shuffleCards = [];
  var area = $('tarot-shuffle-area');
  area.innerHTML = '';
  var w = area.clientWidth || 360;
  var h = area.clientHeight || 400;
  var cx = w / 2;
  var cy = h / 2;
  var radius = Math.min(w, h) * 0.32;

  TAROT_DATA.forEach(function(card, i){
    var angle = (i / TAROT_DATA.length) * Math.PI * 2;
    var r = radius * (0.6 + Math.random() * 0.4);
    var x = cx + Math.cos(angle) * r - 25;
    var y = cy + Math.sin(angle) * r - 40;
    var rot = Math.random() * 360;

    var cardData = { card: card, reversed: Math.random() < 0.5, x: x, y: y, rotation: rot, el: null };
    state.shuffleCards.push(cardData);

    var el = document.createElement('div');
    el.className = 'tarot-scatter-card';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.transform = 'rotate(' + rot + 'deg)';
    cardData.el = el;
    bindCardDrag(el, cardData, area);
    area.appendChild(el);
  });
}

/* Bug8修复：共享拖拽状态，document 级监听器只注册一次，避免反复洗牌累积监听器 */
var _tarotDrag = { el: null, cardData: null, startX: 0, startY: 0, origX: 0, origY: 0, startAngle: 0, origRot: 0, dragging: false, isTouch: false, _init: false };

function _tarotDragInit() {
  if (_tarotDrag._init) return;
  _tarotDrag._init = true;
  document.addEventListener('mousemove', function(e){
    if(!_tarotDrag.dragging || _tarotDrag.isTouch) return;
    _tarotDragMove(e.clientX, e.clientY);
  });
  document.addEventListener('mouseup', function(e){
    if(!_tarotDrag.dragging || _tarotDrag.isTouch) return;
    _tarotDragUp();
  });
}
function _tarotDragMove(cx, cy){
  if(!_tarotDrag.dragging || !_tarotDrag.el) return;
  var el = _tarotDrag.el, cardData = _tarotDrag.cardData;
  var dx = cx - _tarotDrag.startX;
  var dy = cy - _tarotDrag.startY;
  cardData.x = _tarotDrag.origX + dx;
  cardData.y = _tarotDrag.origY + dy;
  var r = el.getBoundingClientRect();
  var center = { x: r.left + r.width/2, y: r.top + r.height/2 };
  var curAngle = Math.atan2(cy - center.y, cx - center.x);
  var angleDiff = (curAngle - _tarotDrag.startAngle) * 180 / Math.PI;
  cardData.rotation = _tarotDrag.origRot + angleDiff;
  el.style.left = cardData.x + 'px';
  el.style.top = cardData.y + 'px';
  el.style.transform = 'rotate(' + cardData.rotation + 'deg)';
}
function _tarotDragUp(){
  if(!_tarotDrag.dragging) return;
  _tarotDrag.dragging = false;
  if(_tarotDrag.el) _tarotDrag.el.style.zIndex = 10;
  _tarotDrag.el = null;
  _tarotDrag.cardData = null;
}

function bindCardDrag(el, cardData, area){
  _tarotDragInit();
  function down(cx, cy){
    _tarotDrag.el = el;
    _tarotDrag.cardData = cardData;
    _tarotDrag.dragging = true;
    _tarotDrag.startX = cx; _tarotDrag.startY = cy;
    _tarotDrag.origX = cardData.x; _tarotDrag.origY = cardData.y;
    var r = el.getBoundingClientRect();
    var center = { x: r.left + r.width/2, y: r.top + r.height/2 };
    _tarotDrag.startAngle = Math.atan2(cy - center.y, cx - center.x);
    _tarotDrag.origRot = cardData.rotation;
    el.style.zIndex = 100;
  }

  el.addEventListener('touchstart', function(e){
    _tarotDrag.isTouch = true;
    e.preventDefault();
    var t = e.touches[0];
    down(t.clientX, t.clientY);
  }, { passive: false });
  el.addEventListener('touchmove', function(e){
    if(!_tarotDrag.dragging || _tarotDrag.el !== el) return;
    e.preventDefault();
    var t = e.touches[0];
    _tarotDragMove(t.clientX, t.clientY);
  }, { passive: false });
  el.addEventListener('touchend', function(e){ _tarotDrag.isTouch = false; _tarotDragUp(); });

  el.addEventListener('mousedown', function(e){
    _tarotDrag.isTouch = false;
    e.preventDefault();
    down(e.clientX, e.clientY);
  });
}

function enterShufflePhase(){
  $('tarot-input-section').style.display = 'none';
  $('tarot-shuffle-section').style.display = '';
  $('tarot-draw-section').style.display = 'none';
  $('tarot-result-section').style.display = 'none';
  setTimeout(function(){ initShuffleCards(); }, 50);
}

/* 转动洗牌：整体旋转 */
function rotateShuffle(){
  var area = $('tarot-shuffle-area');
  if(!area || !state.shuffleCards.length) return;
  var w = area.clientWidth || 360;
  var h = area.clientHeight || 400;
  var cx = w / 2, cy = h / 2;
  var isRotating = area.dataset.rotating === '1';
  if(isRotating) return;
  area.dataset.rotating = '1';
  var duration = 1500;
  var startTime = Date.now();
  var startAngles = state.shuffleCards.map(function(sc){ return sc.rotation; });
  var startPositions = state.shuffleCards.map(function(sc){ return {x:sc.x, y:sc.y}; });
  /* 随机交换目标位置 */
  var indices = state.shuffleCards.map(function(_,i){ return i; });
  for(var i = indices.length-1; i>0; i--){
    var j = Math.floor(Math.random()*(i+1));
    var tmp = indices[i]; indices[i]=indices[j]; indices[j]=tmp;
  }
  var targetPositions = indices.map(function(idx){ return startPositions[idx]; });
  function animate(){
    var elapsed = Date.now() - startTime;
    var t = Math.min(1, elapsed / duration);
    var ease = 1 - Math.pow(1 - t, 3);
    var totalRotation = 360 * ease;
    state.shuffleCards.forEach(function(sc, i){
      var sp = startPositions[i], tp = targetPositions[i];
      sc.x = sp.x + (tp.x - sp.x) * ease;
      sc.y = sp.y + (tp.y - sp.y) * ease;
      sc.rotation = startAngles[i] + totalRotation;
      if(sc.el){
        sc.el.style.transition = 'none';
        sc.el.style.left = sc.x + 'px';
        sc.el.style.top = sc.y + 'px';
        sc.el.style.transform = 'rotate(' + sc.rotation + 'deg)';
      }
    });
    if(t < 1){
      requestAnimationFrame(animate);
    } else {
      /* restore transitions */
      state.shuffleCards.forEach(function(sc){
        if(sc.el) sc.el.style.transition = '';
      });
      area.dataset.rotating = '';
    }
  }
  requestAnimationFrame(animate);
}

/* ===== Phase 3: 抽牌（扇形摊开 + 滑动选择） ===== */
function enterDrawPhase(){
  /* 从洗牌结果构建抽牌牌组 */
  state.deck = state.shuffleCards.map(function(sc){
    return { card: sc.card, reversed: sc.reversed };
  });
  /* 随机打乱顺序 */
  for(var i = state.deck.length - 1; i > 0; i--){
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = state.deck[i]; state.deck[i] = state.deck[j]; state.deck[j] = tmp;
  }

  state.drawn = [];
  state.selectedCount = 0;

  $('tarot-shuffle-section').style.display = 'none';
  $('tarot-draw-section').style.display = '';
  $('tarot-result-section').style.display = 'none';

  var need = parseInt(state.spread, 10);
  $('tarot-need-count').textContent = need;
  $('tarot-selected-count').textContent = '0';

  /* 等待容器布局完成后渲染扇形，确保尺寸计算正确 */
  requestAnimationFrame(function(){
    renderFan();
    /* 二次校准：部分机型首帧尺寸仍不准确 */
    setTimeout(function(){ if(state.deck.filter(function(i){return !i._selected;}).length > 0) renderFan(); }, 80);
  });
}

function renderFan(){
  var container = $('tarot-fan-scroll');
  container.innerHTML = '';
  var visibleDeck = state.deck.filter(function(item){ return !item._selected; });
  var total = visibleDeck.length;
  if (total === 0) return;

  var containerEl = $('tarot-fan-container');
  var cw = containerEl ? containerEl.clientWidth : 320;
  var ch = containerEl ? containerEl.clientHeight : 450;

  /* 竖向扇形：骨架长度基于宽度，角度基于高度 */
  var cardW = 52;
  var ribLength = Math.max(120, cw - cardW - 28);

  /* 动态计算最大展开角度，确保扇形高度不超过容器 */
  var sinVal = (ch - 12) / (2 * (ribLength + cardW));
  var maxAngle = sinVal >= 1 ? 80 : Math.asin(Math.min(0.98, sinVal)) * 180 / Math.PI;
  maxAngle = Math.max(15, Math.min(78, maxAngle));

  var angleStep = total > 1 ? (maxAngle * 2) / (total - 1) : 0;

  visibleDeck.forEach(function(item, idx){
    var angle = total > 1 ? (maxAngle - idx * angleStep) : 0;

    var el = document.createElement('div');
    el.className = 'tarot-fan-card';
    el.style.setProperty('--fa', angle + 'deg');
    el.style.setProperty('--fr', ribLength + 'px');
    el.style.zIndex = idx;
    el.dataset.idx = state.deck.indexOf(item);
    el.onclick = function(){
      selectFanCard(parseInt(el.dataset.idx), el);
    };
    container.appendChild(el);
  });

  /* 设置滚动区域高度，允许上下滑动一丢丢 */
  var fanHeight = 2 * (ribLength + cardW) * Math.sin(maxAngle * Math.PI / 180) + 82;
  container.style.minHeight = Math.max(ch, fanHeight + 40) + 'px';
}

function selectFanCard(idx, el){
  var need = parseInt(state.spread, 10);
  if(state.selectedCount >= need){
    toast('已选够牌数');
    return;
  }
  var item = state.deck[idx];
  if(!item || item._selected) return;
  item._selected = true;
  state.drawn.push(item);
  state.selectedCount++;

  el.classList.add('selected');
  $('tarot-selected-count').textContent = state.selectedCount;
  toast('选中第 ' + state.selectedCount + ' 张');

  if(state.selectedCount >= need){
    setTimeout(function(){ enterResultPhase(); }, 600);
  }
}

/* ===== Phase 4: 展示牌面（翻转动画） ===== */
function enterResultPhase(){
  $('tarot-draw-section').style.display = 'none';
  $('tarot-result-section').style.display = '';

  var info = SPREAD_INFO[state.spread];
  $('tarot-result-title').textContent = info.name;
  $('tarot-result-question').textContent = state.question ? '"' + state.question + '"' : '';

  var box = $('tarot-cards-result');
  box.innerHTML = '';

  state.drawn.forEach(function(item, idx){
    var wrap = document.createElement('div');
    wrap.className = 'tarot-result-item';

    var pos = document.createElement('div');
    pos.className = 'tarot-result-position';
    pos.textContent = info.positions[idx] || ('第' + (idx+1) + '张');

    var slot = document.createElement('div');
    slot.className = 'tarot-card-slot';

    var flipper = document.createElement('div');
    flipper.className = 'tarot-card-flipper';

    /* 背面 */
    var backSide = document.createElement('div');
    backSide.className = 'tarot-card-back-side';
    backSide.innerHTML = '<div class="tarot-card-back"></div>';

    /* 正面 */
    var frontSide = document.createElement('div');
    frontSide.className = 'tarot-card-front-side';
    frontSide.innerHTML = cardFaceHtml(item, true);

    flipper.appendChild(backSide);
    flipper.appendChild(frontSide);
    slot.appendChild(flipper);

    /* 点击翻转 */
    slot.onclick = function(){
      flipper.classList.add('flipped');
    };

    wrap.appendChild(pos);
    wrap.appendChild(slot);
    box.appendChild(wrap);

    /* 依次自动翻转 */
    setTimeout(function(){
      flipper.classList.add('flipped');
    }, 300 + idx * 400);
  });
}

function cardFaceHtml(item, showReverse){
  var card = item.card;
  var isRev = showReverse ? item.reversed : false;
  var cls = 'tarot-card-face' + (isRev ? ' reversed' : '');
  var meaning = isRev ? card.reversed : card.upright;
  var dirLabel = isRev ? '逆位' : '正位';
  return '<div class="'+cls+'">' +
    '<div class="tarot-card-frame">' +
      '<div class="tarot-card-num">' + (card.id<10?'0':'') + card.id + '</div>' +
      '<div class="tarot-card-name">' + escapeHtml(card.name) + '</div>' +
      '<div class="tarot-card-symbol">' + escapeHtml(card.symbol) + '</div>' +
      '<div class="tarot-card-keyword">' + escapeHtml(card.keyword) + '</div>' +
      '<div class="tarot-card-dir">' + dirLabel + '</div>' +
    '</div>' +
    '<div class="tarot-card-meaning">' + escapeHtml(meaning) + '</div>' +
  '</div>';
}

/* ===== 保存 / 再占一次 ===== */
function saveReading(){
  if(!state.drawn.length){ toast('请先抽牌'); return; }
  var list = [];
  state.drawn.forEach(function(item, idx){
    list.push({
      name: item.card.name,
      reversed: item.reversed,
      position: (SPREAD_INFO[state.spread].positions[idx] || '')
    });
  });
  var history = loadHistory();
  history.unshift({
    id: Date.now(),
    time: Date.now(),
    question: state.question,
    spread: state.spread,
    spreadName: SPREAD_INFO[state.spread].name,
    cards: list
  });
  if(history.length > 50) history = history.slice(0, 50);
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); }catch(e){ toast('保存失败'); return; }
  toast('已保存到我的牌局');
}

function startAgain(){
  state.question = '';
  state.spread = null;
  state.drawn = [];
  state.selectedCount = 0;
  state.shuffleCards = [];
  state.deck = [];

  $('tarot-question').value = '';
  document.querySelectorAll('.tarot-spread-card').forEach(function(c){ c.classList.remove('selected'); });
  $('tarot-start').disabled = true;

  $('tarot-result-section').style.display = 'none';
  $('tarot-input-section').style.display = '';
}

/* ===== 历史记录 ===== */
function loadHistory(){
  try{
    var v = localStorage.getItem(STORAGE_KEY);
    if(v) return JSON.parse(v);
  }catch(e){}
  return [];
}

function renderHistory(){
  var box = $('tarot-history-list');
  box.innerHTML = '';
  var history = loadHistory();
  if(!history.length){ box.innerHTML = '<div class="tarot-empty">还没有占卜记录</div>'; return; }
  history.forEach(function(h){
    var d = document.createElement('div');
    d.className = 'tarot-history-item';
    var dt = new Date(h.time);
    var timeStr = (dt.getMonth()+1) + '月' + dt.getDate() + '日 ' +
                  String(dt.getHours()).padStart(2,'0') + ':' + String(dt.getMinutes()).padStart(2,'0');
    var cardsStr = h.cards.map(function(c){ return c.name + (c.reversed ? '·逆' : '·正'); }).join('，');
    var qStr = h.question ? '问：' + escapeHtml(h.question) + ' | ' : '';
    d.innerHTML = '<div class="tarot-history-title">' + escapeHtml(h.spreadName) + '</div>' +
                  (h.question ? '<div class="tarot-history-cards" style="margin-bottom:2px;font-style:italic;">' + qStr + '</div>' : '') +
                  '<div class="tarot-history-cards">' + escapeHtml(cardsStr) + '</div>' +
                  '<div class="tarot-history-time">' + timeStr + '</div>';
    box.appendChild(d);
  });
}

/* ===== 初始化 ===== */
function bindEvents(){
  $('tarot-back').onclick = closeTarotApp;
  $('tarot-history-btn').onclick = function(){ renderHistory(); $('tarot-history-modal').style.display = 'flex'; };
  $('tarot-history-close').onclick = function(){ $('tarot-history-modal').style.display = 'none'; };
  $('tarot-history-modal').onclick = function(e){ if(e.target === $('tarot-history-modal')) $('tarot-history-modal').style.display = 'none'; };

  $('tarot-reshuffle').onclick = function(){ initShuffleCards(); };
  $('tarot-rotate-shuffle').onclick = rotateShuffle;
  $('tarot-shuffle-done').onclick = enterDrawPhase;
  $('tarot-save').onclick = saveReading;
  $('tarot-again').onclick = startAgain;

  bindSpreadSelection();
}

function openTarotApp(){
  $('tarot-app').style.display = 'flex';
  state.question = '';
  state.spread = null;
  state.drawn = [];
  state.selectedCount = 0;
  $('tarot-question').value = '';
  document.querySelectorAll('.tarot-spread-card').forEach(function(c){ c.classList.remove('selected'); });
  $('tarot-start').disabled = true;
  $('tarot-input-section').style.display = '';
  $('tarot-shuffle-section').style.display = 'none';
  $('tarot-draw-section').style.display = 'none';
  $('tarot-result-section').style.display = 'none';
}
function closeTarotApp(){ $('tarot-app').style.display = 'none'; }

/* 屏幕旋转/尺寸变化时重新渲染扇形 */
var _tarotResizeTimer = null;
window.addEventListener('resize', function(){
  if($('tarot-app').style.display === 'none') return;
  if($('tarot-draw-section').style.display === 'none') return;
  if(_tarotResizeTimer) clearTimeout(_tarotResizeTimer);
  _tarotResizeTimer = setTimeout(function(){
    if(state.deck.filter(function(i){return !i._selected;}).length > 0) renderFan();
  }, 150);
});
window.addEventListener('orientationchange', function(){
  if($('tarot-app').style.display === 'none') return;
  if($('tarot-draw-section').style.display === 'none') return;
  setTimeout(function(){
    if(state.deck.filter(function(i){return !i._selected;}).length > 0) renderFan();
  }, 300);
});

window.openTarotApp = openTarotApp;
window.closeTarotApp = closeTarotApp;

bindEvents();
})();
