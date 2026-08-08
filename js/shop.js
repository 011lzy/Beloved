/* shop.js - 从 app.js 拆分 */


// ========== 次元购物城 ==========

// ===== 模块内部状态 =====
var shopCurrentTab = 'shop';     // 当前标签：shop / cart / orders / mine
var shopSearchKeyword = '';      // 商店搜索关键词
var shopCurrentCat = 'all';      // 商店当前分类
var shopAppOpen = false;         // 购物城是否打开
var shopInDetail = false;        // 是否处于详情视图（订单/商品详情）

// 3 天毫秒数：发货后 3 天自动签收
var SHOP_SHIP_DURATION = 3 * 24 * 60 * 60 * 1000; // 259200000

// ===== 分类定义 =====
var SHOP_CATEGORIES = [
    { key: 'clothing',  name: '服装' },
    { key: 'shoes',     name: '鞋靴' },
    { key: 'accessory', name: '配饰' },
    { key: 'life',      name: '生活' },
    { key: 'food',      name: '食品' }
];

// ===== 25 件预设商品 =====
var SHOP_PRESET_PRODUCTS = [
    // 服装 5
    { name: '银河星光婚纱',       price: 399, category: 'clothing',  desc: '缀满星光的梦幻婚纱，宛如把整片夜空披在身上。' },
    { name: '雾霾蓝收腰西装',     price: 259, category: 'clothing',  desc: '高级雾霾蓝，收腰剪裁，干练中透着温柔。' },
    { name: '奶油白廓形西装',     price: 229, category: 'clothing',  desc: '奶油白廓形设计，慵懒随性，气质拉满。' },
    { name: '复古蕾丝旗袍',       price: 189, category: 'clothing',  desc: '复古蕾丝刺绣，东方韵味十足。' },
    { name: '梦幻泡泡袖连衣裙',   price: 159, category: 'clothing',  desc: '蓬松泡泡袖，少女感满分。' },
    // 鞋靴 5
    { name: '水晶高跟凉鞋',       price: 169, category: 'shoes',     desc: '透明水晶跟，悄悄拉长腿部线条。' },
    { name: '缎面蝴蝶结平底鞋',   price: 139, category: 'shoes',     desc: '丝滑缎面搭配甜美蝴蝶结。' },
    { name: '复古方头粗跟靴',     price: 199, category: 'shoes',     desc: '方头粗跟，复古又稳当。' },
    { name: '珍珠装饰玛丽珍鞋',   price: 119, category: 'shoes',     desc: '珍珠搭扣，优雅玛丽珍。' },
    { name: '学院风厚底乐福鞋',   price: 149, category: 'shoes',     desc: '厚底乐福，学院风百搭。' },
    // 配饰 5
    { name: '星月锁骨链',         price: 99,  category: 'accessory', desc: '星月吊坠，恰到好处地点缀锁骨。' },
    { name: '珍珠手链',           price: 79,  category: 'accessory', desc: '淡水珍珠，温润光泽。' },
    { name: '钻戒',               price: 299, category: 'accessory', desc: '璀璨闪耀，承载永恒之约。' },
    { name: '蝴蝶结珍珠耳环',     price: 69,  category: 'accessory', desc: '蝴蝶结配珍珠，灵动可爱。' },
    { name: '心形项链',           price: 89,  category: 'accessory', desc: '心形吊坠，贴心的动意。' },
    // 生活 5
    { name: '玫瑰香薰蜡烛',       price: 69,  category: 'life',      desc: '玫瑰花香，营造浪漫氛围。' },
    { name: '毛绒小熊',           price: 49,  category: 'life',      desc: '柔软治愈，陪伴每一刻。' },
    { name: '复古相框',           price: 59,  category: 'life',      desc: '木质复古，留住美好瞬间。' },
    { name: '马克杯',             price: 39,  category: 'life',      desc: '日常温暖，一杯在手。' },
    { name: '干花摆件',           price: 79,  category: 'life',      desc: '永生干花，装点生活角落。' },
    // 食品 5
    { name: '草莓蛋糕',           price: 39,  category: 'food',      desc: '新鲜草莓配绵密奶油。' },
    { name: '巧克力礼盒',         price: 59,  category: 'food',      desc: '醇厚巧克力，浓情蜜意。' },
    { name: '马卡龙礼盒',         price: 49,  category: 'food',      desc: '色彩缤纷，法式甜美。' },
    { name: '花茶礼盒',           price: 45,  category: 'food',      desc: '花香四溢，舒缓身心。' },
    { name: '星空棒棒糖',         price: 29,  category: 'food',      desc: '星空糖艺，颜值与美味并存。' }
];

// ===== 像素 SVG 图标（纯 rect 拼接，不使用 emoji）=====
var SHOP_PIXEL_ICONS = {
    clothing: {
        color: '#ff5a8a',
        rows: [
            '................',
            '................',
            '.....######.....',
            '....########....',
            '...####..####...',
            '...####..####...',
            '....########....',
            '....########....',
            '.....######.....',
            '....########....',
            '...##########...',
            '..############..',
            '.##############.',
            '.##############.',
            '..############..',
            '................'
        ]
    },
    shoes: {
        color: '#8d6e63',
        rows: [
            '................',
            '######..........',
            '######..........',
            '######..........',
            '######..........',
            '######..........',
            '######..........',
            '######..........',
            '######..........',
            '###############.',
            '###############.',
            '###############.',
            '###############.',
            '###############.',
            '................',
            '................'
        ]
    },
    accessory: {
        color: '#f2b705',
        rows: [
            '................',
            '................',
            '....########....',
            '...##########...',
            '..############..',
            '.##############.',
            '.##############.',
            '################',
            '################',
            '.##############.',
            '..############..',
            '...##########...',
            '....########....',
            '.....######.....',
            '......####......',
            '................'
        ]
    },
    life: {
        color: '#4fc3f7',
        rows: [
            '................',
            '................',
            '..########...##.',
            '..########...##.',
            '..########...##.',
            '..########...##.',
            '..##########....',
            '..##########....',
            '..##########....',
            '..##########....',
            '..##########....',
            '..##########....',
            '..##########....',
            '..##########....',
            '................',
            '................'
        ]
    },
    food: {
        color: '#ff8a65',
        rows: [
            '................',
            '.......##.......',
            '......####......',
            '.....######.....',
            '....########....',
            '...##########...',
            '..############..',
            '.##############.',
            '.##############.',
            '..############..',
            '...##########...',
            '....########....',
            '................',
            '................',
            '................',
            '................'
        ]
    }
};

// 返回像素风 SVG 字符串（5 种分类各有不同图标）
function shopPixelIcon(category, size) {
    size = size || 48;
    var def = SHOP_PIXEL_ICONS[category] || SHOP_PIXEL_ICONS.life;
    var rows = def.rows;
    var h = rows.length;
    var w = rows[0].length;
    var color = def.color;
    var rects = '';
    for (var y = 0; y < h; y++) {
        var line = rows[y];
        for (var x = 0; x < w; x++) {
            if (line.charAt(x) === '#') {
                rects += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + color + '"/>';
            }
        }
    }
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + w + ' ' + h +
        '" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" style="display:block;">' + rects + '</svg>';
}

// ===== 工具函数 =====
function shopEscape(s) {
    s = (s === undefined || s === null) ? '' : String(s);
    return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
}

function shopCatName(key) {
    for (var i = 0; i < SHOP_CATEGORIES.length; i++) {
        if (SHOP_CATEGORIES[i].key === key) return SHOP_CATEGORIES[i].name;
    }
    return '其他';
}

function shopStatusName(s) {
    return ({ pending: '待发货', shipping: '运输中', done: '已签收' })[s] || s;
}

function shopStatusClass(s) {
    return ({ pending: 'pending', shipping: 'shipping', done: 'done' })[s] || '';
}

function shopFindProduct(id) {
    var sd = appData.shopData;
    if (!sd || !sd.products) return null;
    for (var i = 0; i < sd.products.length; i++) {
        if (sd.products[i].id === id) return sd.products[i];
    }
    return null;
}

function shopAddrText(a) {
    if (!a || (!a.name && !a.phone && !a.addr)) return '点击设置';
    return shopEscape(a.name || '') + ' ' + shopEscape(a.phone || '') + ' ' + shopEscape(a.addr || '');
}

function shopFormatTime(t) {
    if (!t) return '';
    var d = new Date(t);
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
        ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// 轻量 Toast 提示
function shopToast(msg) {
    var t = document.getElementById('shopToast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'shopToast';
        t.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);' +
            'background:rgba(0,0,0,.78);color:#fff;padding:10px 18px;border-radius:10px;' +
            'font-size:13px;z-index:99999;pointer-events:none;opacity:0;transition:opacity .25s;' +
            'max-width:80%;text-align:center;line-height:1.5;';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.style.opacity = '0'; }, 1400);
}

// 确保 balanceData 存在（与 app.html 中的懒初始化保持一致）
function shopEnsureBalance() {
    if (!appData.balanceData) {
        appData.balanceData = {
            mine: 100,
            other: 100,
            records: [{ text: '系统为你们各自赠送了一百元作为起始资金！', time: Date.now() }],
            initialized: true
        };
    }
}

// ===== 数据初始化 =====
function shopInitData() {
    if (!appData.shopData) {
        appData.shopData = {
            products: [],
            cart: [],
            orders: [],
            myAddr: { name: '', phone: '', addr: '' },
            otherAddr: { name: '', phone: '', addr: '' },
            lastAutoOrderDate: ''
        };
    }
    var sd = appData.shopData;
    var changed = false;
    if (!sd.products) { sd.products = []; changed = true; }
    if (!sd.cart) { sd.cart = []; changed = true; }
    if (!sd.orders) { sd.orders = []; changed = true; }
    if (!sd.myAddr) { sd.myAddr = { name: '', phone: '', addr: '' }; changed = true; }
    if (!sd.otherAddr) { sd.otherAddr = { name: '', phone: '', addr: '' }; changed = true; }
    if (sd.lastAutoOrderDate === undefined) { sd.lastAutoOrderDate = ''; changed = true; }

    // 首次初始化时填入 25 件预设商品
    if (sd.products.length === 0) {
        SHOP_PRESET_PRODUCTS.forEach(function (p, i) {
            sd.products.push({
                id: 'shop_preset_' + (i + 1),
                name: p.name,
                price: p.price,
                category: p.category,
                desc: p.desc,
                listed: true,
                preset: true
            });
        });
        changed = true;
    }

    // 确保 specialCards.shopping 区域存在
    if (!appData.specialCards) {
        appData.specialCards = { nudge: [], emoji: [], kaomoji: [], image: [], video: [], shopping: [] };
        changed = true;
    }
    if (!appData.specialCards.shopping) {
        appData.specialCards.shopping = [];
        changed = true;
    }

    if (changed) saveData();
}

// ===== 打开 / 关闭 =====
function openShopApp() {
    shopInitData();
    shopInjectStyle();
    shopEnsureBackButton();
    document.getElementById('shopAppPage').style.display = 'flex';
    shopAppOpen = true;
    shopSwitchTab(shopCurrentTab || 'shop');
}

function closeShopApp() {
    document.getElementById('shopAppPage').style.display = 'none';
    shopAppOpen = false;
    shopCloseModal();
}

// 给 header 注入返回按钮（HTML 中 header 默认无返回按钮）
function shopEnsureBackButton() {
    var header = document.querySelector('#shopAppPage .shop-header');
    if (!header) return;
    if (header.querySelector('.shop-back')) {
        // Bug5：已存在的返回按钮重新绑定智能回退逻辑（避免旧绑定仍指向 closeShopApp）
        var old = header.querySelector('.shop-back');
        var fresh = old.cloneNode(true);
        old.parentNode.replaceChild(fresh, old);
        fresh.addEventListener('click', shopHandleBack);
        return;
    }
    var back = document.createElement('div');
    back.className = 'shop-back';
    back.innerHTML = '&#8249;';
    back.addEventListener('click', shopHandleBack);
    header.appendChild(back);
}
// Bug5：返回按钮智能回退——商品详情回商店、订单详情回订单列表，否则关闭购物城
function shopHandleBack() {
    if (shopInDetail) {
        shopInDetail = false;
        shopSwitchTab(shopCurrentTab || 'shop');
    } else {
        closeShopApp();
    }
}

// ===== 标签切换 =====
function shopSwitchTab(tab) {
    shopCurrentTab = tab;
    shopInDetail = false;
    var tabs = document.querySelectorAll('#shopAppPage .shop-tab');
    var idxMap = { shop: 0, cart: 1, orders: 2, mine: 3 };
    var idx = idxMap[tab];
    for (var i = 0; i < tabs.length; i++) {
        if (i === idx) tabs[i].classList.add('active');
        else tabs[i].classList.remove('active');
    }
    if (tab === 'shop') shopRenderShop();
    else if (tab === 'cart') shopRenderCart();
    else if (tab === 'orders') shopRenderOrders();
    else if (tab === 'mine') shopRenderMine();
}

function shopRefreshCurrent() {
    if (shopCurrentTab === 'shop') shopRenderShop();
    else if (shopCurrentTab === 'cart') shopRenderCart();
    else if (shopCurrentTab === 'orders') shopRenderOrders();
    else if (shopCurrentTab === 'mine') shopRenderMine();
}

// ===== 商店页 =====
function shopRenderShop() {
    shopInDetail = false;
    var html = '';
    // 搜索框
    html += '<div class="shop-search"><input id="shopSearchInput" type="text" ' +
        'placeholder="搜索商品..." value="' + shopEscape(shopSearchKeyword) + '" ' +
        'oninput="shopOnSearch(this.value)"></div>';
    // 分类切换
    html += '<div class="shop-cats" id="shopCats">';
    var cats = [{ key: 'all', name: '全部' }].concat(SHOP_CATEGORIES);
    cats.forEach(function (c) {
        html += '<div class="shop-cat' + (shopCurrentCat === c.key ? ' active' : '') + '" ' +
            'data-cat="' + c.key + '" onclick="shopSelectCat(\'' + c.key + '\')">' + c.name + '</div>';
    });
    html += '</div>';
    // 商品网格
    html += '<div class="shop-grid" id="shopGrid">' + shopBuildGridHtml() + '</div>';
    document.getElementById('shopContent').innerHTML = html;
}

function shopBuildGridHtml() {
    var sd = appData.shopData;
    var list = (sd.products || []).filter(function (p) {
        if (p.listed === false) return false;
        if (shopCurrentCat !== 'all' && p.category !== shopCurrentCat) return false;
        if (shopSearchKeyword) {
            var kw = shopSearchKeyword.toLowerCase();
            if ((p.name || '').toLowerCase().indexOf(kw) < 0 &&
                (p.desc || '').toLowerCase().indexOf(kw) < 0) return false;
        }
        return true;
    });
    if (list.length === 0) {
        return '<div class="shop-empty" style="grid-column:1/3;">暂无商品</div>';
    }
    var html = '';
    list.forEach(function (p) {
        html += '<div class="shop-card" onclick="shopProductDetail(\'' + p.id + '\')">';
        html += '<div class="shop-card-img">' + shopPixelIcon(p.category, 56) + '</div>';
        html += '<div class="shop-card-info">';
        html += '<div class="shop-card-name">' + shopEscape(p.name) + '</div>';
        html += '<div class="shop-card-price">¥' + p.price + '</div>';
        html += '<div class="shop-card-tag">' + shopCatName(p.category) + '</div>';
        html += '</div></div>';
    });
    return html;
}

function shopOnSearch(v) {
    shopSearchKeyword = v;
    var grid = document.getElementById('shopGrid');
    if (grid) grid.innerHTML = shopBuildGridHtml();
    else shopRenderShop();
}

function shopSelectCat(c) {
    shopCurrentCat = c;
    var catEls = document.querySelectorAll('#shopCats .shop-cat');
    for (var i = 0; i < catEls.length; i++) {
        if (catEls[i].getAttribute('data-cat') === c) catEls[i].classList.add('active');
        else catEls[i].classList.remove('active');
    }
    var grid = document.getElementById('shopGrid');
    if (grid) grid.innerHTML = shopBuildGridHtml();
    else shopRenderShop();
}

// ===== 商品详情 =====
function shopProductDetail(id) {
    var p = shopFindProduct(id);
    if (!p) { shopToast('商品不存在'); return; }
    shopInDetail = true;
    var html = '';
    html += '<div class="shop-detail">';
    html += '<div class="shop-detail-img">' + shopPixelIcon(p.category, 120) + '</div>';
    html += '<div style="font-size:11px;color:#999;margin-bottom:4px;">' + shopCatName(p.category) + '</div>';
    html += '<div style="font-size:18px;font-weight:700;color:#333;margin-bottom:6px;">' + shopEscape(p.name) + '</div>';
    html += '<div style="font-size:22px;font-weight:700;color:#ff6b35;margin-bottom:12px;">¥' + p.price + '</div>';
    if (p.desc) {
        html += '<div style="font-size:13px;color:#666;line-height:1.6;margin-bottom:18px;">' + shopEscape(p.desc) + '</div>';
    }
    html += '<button class="shop-mine-btn" onclick="shopAddToCart(\'' + p.id + '\')">加入购物车</button>';
    html += '<button class="shop-mine-btn" style="background:#fff;color:#666;border:1px solid #eee;margin-top:8px;" onclick="shopSwitchTab(\'shop\')">返回商店</button>';
    html += '</div>';
    document.getElementById('shopContent').innerHTML = html;
}

// ===== 购物车 =====
function shopCartTotal() {
    var sd = appData.shopData;
    var t = 0;
    (sd.cart || []).forEach(function (ci) {
        var p = shopFindProduct(ci.productId);
        if (p) t += p.price * ci.qty;
    });
    return t;
}

function shopRenderCart() {
    shopInDetail = false;
    var sd = appData.shopData;
    var items = sd.cart || [];
    var html = '';

    if (items.length === 0) {
        html += '<div class="shop-empty">购物车空空如也</div>';
    } else {
        items.forEach(function (ci, idx) {
            var p = shopFindProduct(ci.productId);
            var name = p ? p.name : '(商品已下架)';
            var price = p ? p.price : 0;
            html += '<div class="shop-cart-item">';
            html += '<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:#fafafa;border-radius:8px;flex-shrink:0;">' +
                shopPixelIcon(p ? p.category : 'life', 34) + '</div>';
            html += '<div class="sci-info">';
            html += '<div class="sci-name">' + shopEscape(name) + '</div>';
            html += '<div class="sci-price">¥' + price + '</div>';
            html += '<div class="sci-qty">数量：';
            html += '<span class="shop-qty-btn" onclick="shopChangeQty(' + idx + ',-1)">－</span>';
            html += '<span style="margin:0 8px;font-weight:600;color:#333;">' + ci.qty + '</span>';
            html += '<span class="shop-qty-btn" onclick="shopChangeQty(' + idx + ',1)">＋</span>';
            html += '</div>';
            html += '</div>';
            html += '<div class="sci-del" onclick="shopRemoveFromCart(' + idx + ')">删除</div>';
            html += '</div>';
        });
    }

    var total = shopCartTotal();
    shopEnsureBalance();
    /* Bug20修复：otherBal 可能为 NaN（算术运算产生），直接 .toFixed(2) 会显示 ¥NaN */
    var otherBal = parseFloat(getOtherBalance());
    if (isNaN(otherBal)) otherBal = 0;
    var balHtml = '对方余额 ¥' + otherBal.toFixed(2) +
        (otherBal < 0 ? ' <span class="shop-owe-tag">赊账中</span>' : '');

    // 结算栏 sticky 固定底部
    html += '<div class="shop-cart-footer" style="position:-webkit-sticky;position:sticky;bottom:0;z-index:5;">';
    html += '<div><div class="shop-cart-total">合计 ¥' + total.toFixed(2) + '</div>';
    html += '<div style="font-size:11px;color:#999;margin-top:2px;">' + balHtml + '</div></div>';
    var disabled = items.length === 0;
    html += '<button class="shop-checkout-btn"' + (disabled ? ' disabled style="opacity:.5;"' : '') +
        ' onclick="shopCheckout()">结算</button>';
    html += '</div>';

    document.getElementById('shopContent').innerHTML = html;
}

function shopAddToCart(id) {
    shopInitData();
    var sd = appData.shopData;
    var p = shopFindProduct(id);
    if (!p) return;
    for (var i = 0; i < sd.cart.length; i++) {
        if (sd.cart[i].productId === id) { sd.cart[i].qty++; saveData(); shopToast('已加入购物车'); if (shopCurrentTab === 'cart') shopRenderCart(); return; }
    }
    sd.cart.push({ productId: id, qty: 1 });
    saveData();
    shopToast('已加入购物车');
    if (shopCurrentTab === 'cart') shopRenderCart();
}

function shopRemoveFromCart(index) {
    var sd = appData.shopData;
    if (index < 0 || index >= sd.cart.length) return;
    sd.cart.splice(index, 1);
    saveData();
    shopRenderCart();
}

function shopChangeQty(index, delta) {
    var sd = appData.shopData;
    if (index < 0 || index >= sd.cart.length) return;
    sd.cart[index].qty += delta;
    if (sd.cart[index].qty <= 0) {
        sd.cart.splice(index, 1);
    }
    saveData();
    shopRenderCart();
}

// ===== 结算 =====
function shopCheckout() {
    shopInitData();
    var sd = appData.shopData;
    if (!sd.cart || sd.cart.length === 0) { shopToast('购物车为空'); return; }

    var total = shopCartTotal();
    // 快照订单商品（防止后续商品被删/改影响历史订单）
    var items = sd.cart.map(function (ci) {
        var p = shopFindProduct(ci.productId);
        return {
            productId: ci.productId,
            name: p ? p.name : '(已下架)',
            price: p ? p.price : 0,
            qty: ci.qty
        };
    });

    var desc = '次元购物城消费：' + items.map(function (it) { return it.name + '×' + it.qty; }).join('、');
    // 结算时扣对方余额（余额不足则变负数 -> 赊账）
    shopEnsureBalance();
    addBalanceRecord('other', -total, desc);
    var debt = getOtherBalance() < 0;

    var oid = 'o_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    sd.orders.push({
        id: oid,
        items: items,
        total: total,
        status: 'pending',
        createTime: Date.now(),
        shipTime: 0,
        signTime: 0,
        address: {
            name: sd.myAddr ? sd.myAddr.name : '',
            phone: sd.myAddr ? sd.myAddr.phone : '',
            addr: sd.myAddr ? sd.myAddr.addr : ''
        },
        message: '',
        buyer: 'me',
        paid: true,
        debt: debt
    });
    sd.cart = [];
    saveData();
    shopToast('下单成功，对方已扣款¥' + total.toFixed(2) + (debt ? '（赊账）' : ''));
    shopSwitchTab('orders');
}

// ===== 订单页 =====
function shopRenderOrders() {
    shopInDetail = false;
    var sd = appData.shopData;
    var html = '';
    var orders = (sd.orders || []).slice().reverse(); // 倒序
    if (orders.length === 0) {
        html += '<div class="shop-empty">还没有订单</div>';
    } else {
        orders.forEach(function (o) {
            var first = o.items[0] ? o.items[0].name : '';
            var more = o.items.length > 1 ? ' 等' + o.items.length + '件' : '';
            html += '<div class="shop-order-item" onclick="shopOrderDetail(\'' + o.id + '\')">';
            html += '<div class="soi-name">' + shopEscape(first) + more + '</div>';
            if (o.message) {
                html += '<div style="font-size:11px;color:#a0845a;margin-top:2px;">留言：' + shopEscape(o.message) + '</div>';
            }
            html += '<div class="soi-price">¥' + o.total.toFixed(2) + '</div>';
            html += '<div><span class="soi-status ' + shopStatusClass(o.status) + '">' + shopStatusName(o.status) + '</span>';
            if (o.debt) html += ' <span class="shop-owe-tag">赊账</span>';
            html += '</div>';
            html += '<div class="soi-time">' + shopFormatTime(o.createTime) + '</div>';
            if (o.status === 'pending') {
                html += '<button style="margin-top:8px;padding:6px 14px;background:#ff6b35;color:#fff;border:none;border-radius:8px;font-size:12px;" ' +
                    'onclick="event.stopPropagation();shopShipOrder(\'' + o.id + '\')">发货</button>';
            }
            html += '</div>';
        });
    }
    document.getElementById('shopContent').innerHTML = html;
}

// ===== 订单详情 =====
function shopOrderDetail(id) {
    var sd = appData.shopData;
    var order = null;
    for (var i = 0; i < sd.orders.length; i++) {
        if (sd.orders[i].id === id) { order = sd.orders[i]; break; }
    }
    if (!order) { shopToast('订单不存在'); return; }
    shopInDetail = true;

    var html = '';
    html += '<div class="shop-detail">';

    // 商品明细
    html += '<div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:12px;">';
    html += '<div style="font-size:14px;font-weight:700;margin-bottom:8px;">商品明细</div>';
    order.items.forEach(function (it) {
        html += '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">';
        html += '<span>' + shopEscape(it.name) + ' ×' + it.qty + '</span>';
        html += '<span style="color:#ff6b35;">¥' + (it.price * it.qty).toFixed(2) + '</span>';
        html += '</div>';
    });
    html += '<div style="border-top:1px solid #eee;margin-top:6px;padding-top:8px;display:flex;justify-content:space-between;font-size:14px;font-weight:700;">';
    html += '<span>合计</span><span style="color:#ff6b35;">¥' + order.total.toFixed(2) + '</span></div>';
    html += '</div>';

    // 状态 + 物流时间线
    html += '<div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:12px;">';
    html += '<div style="font-size:14px;font-weight:700;margin-bottom:10px;">订单状态：' + shopStatusName(order.status) + '</div>';
    if (order.debt) {
        html += '<div class="shop-owe-tag" style="margin-bottom:8px;">本次消费对方余额不足，已赊账</div>';
    }
    html += '<div class="shop-timeline">';
    html += shopTimelineItem(true, '已下单', order.createTime);
    var shipped = order.status === 'shipping' || order.status === 'done';
    html += shopTimelineItem(shipped, '已发货', order.shipTime);
    html += shopTimelineItem(order.status === 'done', '已签收', order.signTime);
    html += '</div>';

    // 运输进度条
    if (order.status === 'shipping' && order.shipTime) {
        var elapsed = Date.now() - order.shipTime;
        var pct = Math.min(100, Math.round(elapsed / SHOP_SHIP_DURATION * 100));
        var remain = Math.max(0, SHOP_SHIP_DURATION - elapsed);
        var days = Math.ceil(remain / 86400000);
        html += '<div style="margin-top:12px;font-size:12px;color:#666;">运输进度：' + pct + '%</div>';
        html += '<div style="height:6px;background:#eee;border-radius:3px;margin-top:4px;overflow:hidden;">' +
            '<div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#ff6b35,#ff8e53);"></div></div>';
        html += '<div style="font-size:11px;color:#999;margin-top:4px;">预计 ' + days + ' 天后送达</div>';
    }
    html += '</div>';

    // 收货地址
    if (order.address) {
        html += '<div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:12px;">';
        html += '<div style="font-size:14px;font-weight:700;margin-bottom:8px;">收货地址</div>';
        html += '<div style="font-size:13px;color:#333;font-weight:600;">' +
            shopEscape(order.address.name || '') + ' ' + shopEscape(order.address.phone || '') + '</div>';
        html += '<div style="font-size:12px;color:#666;margin-top:3px;">' + shopEscape(order.address.addr || '') + '</div>';
        html += '</div>';
    }

    // 买家留言
    if (order.message) {
        html += '<div class="shop-msg-card"><div class="smc-label">买家留言</div>' + shopEscape(order.message) + '</div>';
    }

    // 操作
    html += '<div style="margin-top:8px;">';
    if (order.status === 'pending') {
        html += '<button class="shop-mine-btn" onclick="shopShipOrder(\'' + order.id + '\')">发货</button>';
    }
    html += '<button class="shop-mine-btn" style="background:#fff;color:#666;border:1px solid #eee;margin-top:8px;" onclick="shopSwitchTab(\'orders\')">返回订单列表</button>';
    html += '</div>';

    html += '</div>';
    document.getElementById('shopContent').innerHTML = html;
}

function shopTimelineItem(active, text, time) {
    var t = time ? shopFormatTime(time) : '';
    var dotCls = active ? 'shop-tl-dot active' : 'shop-tl-dot';
    var txtCls = active ? 'shop-tl-text active' : 'shop-tl-text';
    return '<div class="shop-tl-item">' +
        '<div class="' + dotCls + '"></div>' +
        '<div><div class="' + txtCls + '">' + text + '</div>' +
        '<div class="shop-tl-time">' + (active && t ? t : '待处理') + '</div></div>' +
        '</div>';
}

// ===== 发货 =====
function shopShipOrder(id) {
    shopInitData();
    var sd = appData.shopData;
    var order = null;
    for (var i = 0; i < sd.orders.length; i++) {
        if (sd.orders[i].id === id) { order = sd.orders[i]; break; }
    }
    if (!order) { shopToast('订单不存在'); return; }
    if (order.status !== 'pending') { shopToast('该订单当前状态无法发货'); return; }

    var pre = order.address || (sd.otherAddr || { name: '', phone: '', addr: '' });
    shopOpenAddrModal('填写发货地址', pre, function (addr) {
        order.address = addr;
        order.status = 'shipping';
        order.shipTime = Date.now();

        // 未付款的订单（对方自动下单）在发货时扣对方余额；
        // 已在结算时付款的订单不重复扣款。
        if (!order.paid) {
            shopEnsureBalance();
            addBalanceRecord('other', -order.total, '次元购物城消费');
            order.paid = true;
            order.debt = getOtherBalance() < 0;
        }
        saveData();
        shopToast('已发货，预计 3 天送达');
        // 发货后回到订单详情刷新
        shopOrderDetail(order.id);
    });
}

// ===== 我的页 =====
function shopRenderMine() {
    shopInDetail = false;
    var sd = appData.shopData;
    var html = '';

    // 地址设置
    html += '<div class="shop-mine-section">';
    html += '<div class="shop-mine-title">收货地址</div>';
    html += '<div class="shop-addr-card" onclick="shopEditAddr(\'my\')">';
    html += '<div class="sac-name">我的地址 ' + (sd.myAddr && sd.myAddr.name ? '' : '<span style="color:#bbb;font-size:11px;">（未设置）</span>') + '</div>';
    html += '<div class="sac-detail">' + shopAddrText(sd.myAddr) + '</div>';
    html += '</div>';
    html += '<div class="shop-addr-card" onclick="shopEditAddr(\'other\')">';
    html += '<div class="sac-name">对方地址 ' + (sd.otherAddr && sd.otherAddr.name ? '' : '<span style="color:#bbb;font-size:11px;">（未设置）</span>') + '</div>';
    html += '<div class="sac-detail">' + shopAddrText(sd.otherAddr) + '</div>';
    html += '</div>';
    html += '<div class="shop-mine-hint">下单时自动填充对应收货地址</div>';
    html += '</div>';

    // 上架商品
    html += '<div class="shop-mine-section">';
    html += '<div class="shop-mine-title">上架商品</div>';
    html += '<button class="shop-mine-btn" onclick="shopAddProduct()">+ 上架新商品</button>';
    html += '</div>';

    // 商品管理
    html += '<div class="shop-product-mgmt">';
    html += '<div class="shop-mine-title">商品管理</div>';
    var products = sd.products || [];
    if (products.length === 0) {
        html += '<div style="color:#999;font-size:13px;text-align:center;padding:16px 0;">暂无商品</div>';
    } else {
        products.forEach(function (p) {
            html += '<div class="shop-product-item">';
            html += '<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:#fafafa;border-radius:8px;flex-shrink:0;">' +
                shopPixelIcon(p.category, 30) + '</div>';
            html += '<div class="spi-info">';
            html += '<div class="spi-name">' + shopEscape(p.name);
            if (p.listed === false) html += ' <span style="color:#999;font-size:11px;">[已下架]</span>';
            if (p.preset) html += ' <span style="color:#bbb;font-size:10px;">预设</span>';
            html += '</div>';
            html += '<div class="spi-price">¥' + p.price + ' · ' + shopCatName(p.category) + '</div>';
            html += '</div>';
            html += '<div class="spi-actions">';
            html += '<span class="spi-act" onclick="event.stopPropagation();shopEditProduct(\'' + p.id + '\')">编辑</span>';
            if (p.listed !== false) {
                html += '<span class="spi-act" onclick="event.stopPropagation();shopUnlistProduct(\'' + p.id + '\')">下架</span>';
            } else {
                html += '<span class="spi-act" onclick="event.stopPropagation();shopRelistProduct(\'' + p.id + '\')">上架</span>';
            }
            html += '<span class="spi-act" style="color:#e74c3c;border-color:#ffd5d5;" onclick="event.stopPropagation();shopDeleteProduct(\'' + p.id + '\')">删除</span>';
            html += '</div>';
            html += '</div>';
        });
    }
    html += '</div>';

    document.getElementById('shopContent').innerHTML = html;
}

// ===== 地址编辑 / 保存 =====
function shopEditAddr(type) {
    shopInitData();
    var sd = appData.shopData;
    var a = type === 'my' ? sd.myAddr : sd.otherAddr;
    var title = type === 'my' ? '编辑我的地址' : '编辑对方地址';
    shopOpenAddrModal(title, a || { name: '', phone: '', addr: '' }, function (addr) {
        if (type === 'my') sd.myAddr = addr;
        else sd.otherAddr = addr;
        saveData();
        shopToast('地址已保存');
        shopRenderMine();
    });
}

// 通用地址弹窗（也用于发货地址填写）
function shopOpenAddrModal(title, pre, onSave) {
    shopCloseModal();
    var overlay = shopModalOverlay();
    var html = '<div class="shop-modal-card" onclick="event.stopPropagation();">';
    html += '<div class="shop-modal-title">' + shopEscape(title) + '</div>';
    html += '<div class="shop-mine-row"><label>姓名</label><input id="shopAddrName" type="text" value="' + shopEscape(pre.name || '') + '" placeholder="收货人姓名"></div>';
    html += '<div class="shop-mine-row"><label>电话</label><input id="shopAddrPhone" type="tel" value="' + shopEscape(pre.phone || '') + '" placeholder="联系电话"></div>';
    html += '<div class="shop-mine-row"><label>地址</label><input id="shopAddrDetail" type="text" value="' + shopEscape(pre.addr || '') + '" placeholder="详细地址"></div>';
    html += '<div style="display:flex;gap:8px;margin-top:14px;">';
    html += '<button class="shop-mine-btn" style="background:#fff;color:#666;border:1px solid #eee;margin-top:0;flex:1;" onclick="shopCloseModal()">取消</button>';
    html += '<button class="shop-mine-btn" style="margin-top:0;flex:1;" onclick="shopSaveAddr()">保存</button>';
    html += '</div>';
    html += '</div>';
    overlay.innerHTML = html;
    overlay._onSave = onSave;
    document.body.appendChild(overlay);
    setTimeout(function () {
        var i = document.getElementById('shopAddrName');
        if (i) i.focus();
    }, 80);
}

function shopSaveAddr() {
    var overlay = document.getElementById('shopModalOverlay');
    if (!overlay) return;
    var nameEl = document.getElementById('shopAddrName');
    var phoneEl = document.getElementById('shopAddrPhone');
    var addrEl = document.getElementById('shopAddrDetail');
    if (!nameEl || !phoneEl || !addrEl) return;
    var addr = {
        name: (nameEl.value || '').trim(),
        phone: (phoneEl.value || '').trim(),
        addr: (addrEl.value || '').trim()
    };
    var cb = overlay._onSave;
    shopCloseModal();
    if (cb) cb(addr);
}

// ===== 商品上架 / 编辑 / 删除 / 上下架 =====
function shopAddProduct() {
    shopInitData();
    shopOpenProductModal(null);
}

function shopEditProduct(id) {
    var p = shopFindProduct(id);
    if (!p) { shopToast('商品不存在'); return; }
    shopOpenProductModal(p);
}

function shopOpenProductModal(p) {
    shopCloseModal();
    var overlay = shopModalOverlay();
    var title = p ? '编辑商品' : '上架新商品';
    var html = '<div class="shop-modal-card" onclick="event.stopPropagation();">';
    html += '<div class="shop-modal-title">' + title + '</div>';
    html += '<div class="shop-mine-row"><label>名称</label><input id="shopProdName" type="text" value="' + (p ? shopEscape(p.name) : '') + '" placeholder="商品名称"></div>';
    html += '<div class="shop-mine-row"><label>价格</label><input id="shopProdPrice" type="number" inputmode="decimal" value="' + (p ? p.price : '') + '" placeholder="价格"></div>';
    html += '<div class="shop-mine-row"><label>分类</label><select id="shopProdCat" style="flex:1;padding:6px 10px;border:1px solid #eee;border-radius:8px;font-size:13px;outline:none;background:#fff;">';
    SHOP_CATEGORIES.forEach(function (c) {
        html += '<option value="' + c.key + '"' + (p && p.category === c.key ? ' selected' : '') + '>' + c.name + '</option>';
    });
    html += '</select></div>';
    html += '<div class="shop-mine-row" style="align-items:flex-start;"><label>描述</label>' +
        '<textarea id="shopProdDesc" placeholder="商品描述" style="flex:1;padding:6px 10px;border:1px solid #eee;border-radius:8px;font-size:13px;outline:none;min-height:54px;resize:none;font-family:inherit;">' +
        (p ? shopEscape(p.desc || '') : '') + '</textarea></div>';
    html += '<div style="display:flex;gap:8px;margin-top:14px;">';
    html += '<button class="shop-mine-btn" style="background:#fff;color:#666;border:1px solid #eee;margin-top:0;flex:1;" onclick="shopCloseModal()">取消</button>';
    html += '<button class="shop-mine-btn" style="margin-top:0;flex:1;" onclick="shopSaveProduct(' + (p ? '\'' + p.id + '\'' : 'null') + ')">保存</button>';
    html += '</div>';
    html += '</div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    setTimeout(function () {
        var i = document.getElementById('shopProdName');
        if (i) i.focus();
    }, 80);
}

function shopSaveProduct(id) {
    shopInitData();
    var sd = appData.shopData;
    var nameEl = document.getElementById('shopProdName');
    var priceEl = document.getElementById('shopProdPrice');
    var catEl = document.getElementById('shopProdCat');
    var descEl = document.getElementById('shopProdDesc');
    if (!nameEl || !priceEl || !catEl) return;
    var name = (nameEl.value || '').trim();
    var price = parseFloat(priceEl.value);
    var cat = catEl.value;
    var desc = descEl ? (descEl.value || '').trim() : '';
    if (!name) { shopToast('请输入商品名称'); return; }
    if (isNaN(price) || price < 0) { shopToast('请输入有效价格'); return; }

    shopCloseModal();
    if (id) {
        var p = shopFindProduct(id);
        if (p) {
            p.name = name;
            p.price = price;
            p.category = cat;
            p.desc = desc;
        }
    } else {
        // 新商品 ID = Date.now() + 随机数
        var pid = 'p_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
        sd.products.push({
            id: pid,
            name: name,
            price: price,
            category: cat,
            desc: desc,
            listed: true,
            preset: false
        });
    }
    saveData();
    shopToast(id ? '已更新' : '已上架');
    shopRenderMine();
}

function shopDeleteProduct(id) {
    var sd = appData.shopData;
    if (!confirm('确定删除该商品吗？删除后不可恢复。')) return;
    for (var i = 0; i < sd.products.length; i++) {
        if (sd.products[i].id === id) { sd.products.splice(i, 1); break; }
    }
    saveData();
    shopToast('已删除');
    shopRenderMine();
}

function shopUnlistProduct(id) {
    var p = shopFindProduct(id);
    if (!p) return;
    p.listed = false;
    saveData();
    shopToast('已下架');
    shopRenderMine();
}

function shopRelistProduct(id) {
    var p = shopFindProduct(id);
    if (!p) return;
    p.listed = true;
    saveData();
    shopToast('已重新上架');
    shopRenderMine();
}

// ===== 通用弹窗 =====
function shopModalOverlay() {
    var ov = document.createElement('div');
    ov.id = 'shopModalOverlay';
    ov.className = 'shop-modal-overlay';
    ov.addEventListener('click', function (e) {
        if (e.target === ov) shopCloseModal();
    });
    return ov;
}

function shopCloseModal() {
    var ov = document.getElementById('shopModalOverlay');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
}

// ===== 留言获取 =====
function shopGetShopMessage() {
    shopInitData();
    var msg = '';
    if (Math.random() < 0.8) {
        // 80% 从特殊字卡 shopping 区域调取
        var pool = (appData.specialCards.shopping || []).filter(function (c) {
            return c && c.text && !c.hidden;
        });
        if (pool.length > 0) {
            msg = pool[Math.floor(Math.random() * pool.length)].text;
        }
    } else {
        // 20% 从共用字卡调取
        if (typeof getAllVisibleWordCards === 'function') {
            var all = getAllVisibleWordCards();
            if (all && all.length > 0) {
                msg = all[Math.floor(Math.random() * all.length)];
            }
        }
    }
    if (!msg) msg = '他默默下单了，没有留下话';
    return msg;
}

// ===== 每日自动下单 + 自动签收 =====
function shopCheckAutoOrder() {
    // 等待 IndexedDB 真实数据加载完毕，避免用默认数据创建订单
    if (typeof _idbReady !== 'undefined' && !_idbReady) return;

    shopInitData();
    var sd = appData.shopData;
    var now = Date.now();
    var changed = false;

    // 1. 自动签收：运输中且发货超过 3 天 -> 已签收
    (sd.orders || []).forEach(function (o) {
        if (o.status === 'shipping' && o.shipTime && (now - o.shipTime) >= SHOP_SHIP_DURATION) {
            o.status = 'done';
            o.signTime = now;
            changed = true;
        }
    });

    // 2. 每日 10% 概率自动下单（每天只判定一次）
    var today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    if (sd.lastAutoOrderDate !== today) {
        sd.lastAutoOrderDate = today; // 无论成败都标记今日已判定
        changed = true;
        if (Math.random() < 0.10) {
            var pool = (sd.products || []).filter(function (p) { return p.listed !== false; });
            if (pool.length > 0) {
                var p = pool[Math.floor(Math.random() * pool.length)];
                var msg = shopGetShopMessage();
                var oid = 'o_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                sd.orders.push({
                    id: oid,
                    items: [{ productId: p.id, name: p.name, price: p.price, qty: 1 }],
                    total: p.price,
                    status: 'pending',
                    createTime: now,
                    shipTime: 0,
                    signTime: 0,
                    address: {
                        name: sd.otherAddr ? sd.otherAddr.name : '',
                        phone: sd.otherAddr ? sd.otherAddr.phone : '',
                        addr: sd.otherAddr ? sd.otherAddr.addr : ''
                    },
                    message: msg,
                    buyer: 'other',
                    paid: false,
                    debt: false
                });
            }
        }
    }

    if (changed) {
        saveData();
        // 若订单列表正打开且不在详情视图，刷新以反映自动签收/新订单
        if (shopAppOpen && shopCurrentTab === 'orders' && !shopInDetail) {
            shopRenderOrders();
        }
    }
}

// ===== 注入样式（弹窗 / 返回键 / 数量按钮等）=====
function shopInjectStyle() {
    if (document.getElementById('shopModalStyle')) return;
    var s = document.createElement('style');
    s.id = 'shopModalStyle';
    s.textContent =
        '.shop-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);' +
            'z-index:360;display:flex;align-items:flex-end;justify-content:center;}' +
        '.shop-modal-card{background:#fff;width:100%;max-width:480px;border-radius:16px 16px 0 0;' +
            'padding:18px 16px calc(16px + env(safe-area-inset-bottom));box-sizing:border-box;' +
            'animation:shopModalUp .25s ease;max-height:90vh;overflow-y:auto;-webkit-overflow-scrolling:touch;}' +
        '@keyframes shopModalUp{from{transform:translateY(100%);}to{transform:translateY(0);}}' +
        '.shop-modal-title{font-size:16px;font-weight:700;color:#333;margin-bottom:14px;text-align:center;}' +
        '.shop-qty-btn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;' +
            'border-radius:50%;background:#fff0f0;color:#ff6b35;font-size:15px;font-weight:700;cursor:pointer;' +
            'border:1px solid #ffd5d5;user-select:none;-webkit-tap-highlight-color:transparent;vertical-align:middle;}' +
        '.shop-back{position:absolute;left:0;top:0;bottom:0;width:48px;display:flex;align-items:center;' +
            'justify-content:center;padding-top:env(safe-area-inset-top);box-sizing:border-box;' +
            'font-size:30px;color:#fff;line-height:1;font-weight:300;cursor:pointer;' +
            '-webkit-tap-highlight-color:transparent;}' +
        '.shop-empty{padding:60px 20px;}' +
        '.shop-product-item .spi-act{cursor:pointer;-webkit-tap-highlight-color:transparent;}' +
        '#shopAppPage .shop-mine-btn{-webkit-tap-highlight-color:transparent;}' +
        '#shopAppPage .shop-card,#shopAppPage .shop-order-item,#shopAppPage .shop-addr-card{' +
            '-webkit-tap-highlight-color:transparent;}';
    document.head.appendChild(s);
}

// ===== 启动：接线 + hook runDailyChecks + 定时自动签收 =====
function shopBootstrap() {
    shopInitData();
    shopInjectStyle();

    // 1. 接线 app 图标点击 -> 打开购物城
    var el = document.querySelector('[data-app="shop"]');
    if (el && !el._shopBound) {
        el._shopBound = true;
        el.addEventListener('click', openShopApp);
    }

    // 2. 安全 hook runDailyChecks：原逻辑执行后再跑 shopCheckAutoOrder
    if (typeof window.runDailyChecks === 'function' && !window.runDailyChecks._shopHooked) {
        var orig = window.runDailyChecks;
        var wrapped = function () {
            orig.apply(this, arguments);
            try { shopCheckAutoOrder(); } catch (e) { console.error('[shop] shopCheckAutoOrder error:', e); }
        };
        wrapped._shopHooked = true;
        window.runDailyChecks = wrapped;
    }

    // 3. 定时检查自动签收（每 60s），保证 App 长开也能在 3 天后自动签收
    setInterval(function () {
        try { shopCheckAutoOrder(); } catch (e) { console.error('[shop] interval error:', e); }
    }, 60000);

    // 4. 兜底：若 hook 错过了首次 runDailyChecks，延迟再补一次
    setTimeout(function () {
        try { shopCheckAutoOrder(); } catch (e) { console.error('[shop] delayed check error:', e); }
    }, 3000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', shopBootstrap);
} else {
    shopBootstrap();
}





// ===== 次元购物城扩展：爱意专属 / 确认收货 / 求购代付 / 分享卡片 / 商品编辑 =====
// 此脚本在主脚本之后执行，对原有 shop 函数进行覆盖与扩展。

// 1. 新增「爱意专属」分类与像素图标
if (typeof SHOP_CATEGORIES !== 'undefined' && !SHOP_CATEGORIES.some(function (c) { return c.key === 'love'; })) {
    SHOP_CATEGORIES.push({ key: 'love', name: '爱意专属' });
}
if (typeof SHOP_PIXEL_ICONS !== 'undefined' && !SHOP_PIXEL_ICONS.love) {
    SHOP_PIXEL_ICONS.love = {
        color: '#ff4d88',
        rows: [
            '................',
            '................',
            '...##....##.....',
            '..####..####....',
            '.############...',
            '.############...',
            '.############...',
            '.############...',
            '..############..',
            '...##########...',
            '....########....',
            '.....######.....',
            '......####......',
            '.......##.......',
            '................',
            '................'
        ]
    };
}

// 2. 注入分享卡片样式
(function () {
    if (document.getElementById('shopShareCardStyle')) return;
    var s = document.createElement('style');
    s.id = 'shopShareCardStyle';
    s.textContent =
        '.shop-share-row{display:flex;justify-content:center;padding:6px 0;width:100%;}' +
        '.shop-share-card{background:#fff;border-radius:14px;box-shadow:0 4px 16px rgba(0,0,0,0.10);width:86%;max-width:300px;padding:14px;box-sizing:border-box;animation:shopCardFadeIn .3s ease;font-family:inherit;}' +
        '@keyframes shopCardFadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}' +
        '.ssc-title{font-size:13px;color:#888;text-align:center;margin-bottom:10px;font-weight:600;}' +
        '.ssc-body{display:flex;align-items:center;gap:10px;background:#fafafa;border-radius:10px;padding:10px;}' +
        '.ssc-icon{width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:8px;flex-shrink:0;}' +
        '.ssc-icon img{max-width:48px;max-height:48px;border-radius:6px;}' +
        '.ssc-info{flex:1;min-width:0;}' +
        '.ssc-name{font-size:14px;font-weight:600;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
        '.ssc-price{font-size:15px;font-weight:700;color:#ff6b35;margin-top:2px;}' +
        '.ssc-footer{display:flex;gap:8px;margin-top:12px;}' +
        '.ssc-btn{flex:1;padding:9px 0;border:none;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;text-align:center;font-family:inherit;}' +
        '.ssc-btn.agree{background:#4caf50;color:#fff;}' +
        '.ssc-btn.reject{background:#eee;color:#666;}' +
        '.ssc-count{flex:1;text-align:center;font-size:12px;color:#999;padding:9px 0;}' +
        '.ssc-result{text-align:center;font-size:13px;padding:9px 0;border-radius:10px;font-weight:600;}' +
        '.ssc-result.ok{background:#e8f5e9;color:#2e7d32;}' +
        '.ssc-result.no{background:#fbe9e7;color:#c62828;}' +
        '.ssc-gift{font-size:12px;color:#a0845a;background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:6px 8px;margin-top:8px;line-height:1.5;}' +
        '.ssc-hint{font-size:13px;color:#555;line-height:1.6;margin-bottom:8px;padding:0 2px;}' +
        '.ssc-contact-tag{font-size:12px;color:#999;text-align:center;margin-bottom:8px;padding:3px 10px;background:#f5f5f5;border-radius:10px;display:inline-block;margin-left:50%;transform:translateX(-50%);}';
    document.head.appendChild(s);
})();

// 3. 商品图标 helper（有自定义图片则用图片，否则像素图标）
function shopProductIcon(p, size) {
    size = size || 48;
    if (p && p.image) {
        return '<img src="' + shopEscape(p.image) + '" style="max-width:' + size + 'px;max-height:' + size + 'px;border-radius:8px;">';
    }
    return shopPixelIcon(p ? p.category : 'life', size);
}

// 4. 状态名 / 样式扩展
shopStatusName = function (s) {
    return ({ pending: '待发货', shipping: '运输中', delivered: '已送达', done: '已签收', refunding: '退款中', refunded: '已退款', cancelled: '已取消' })[s] || s;
};
shopStatusClass = function (s) {
    return ({ pending: 'pending', shipping: 'shipping', delivered: 'shipping', done: 'done', refunding: 'pending', refunded: 'done', cancelled: 'pending' })[s] || '';
};

// 5. 商品列表（支持自定义图片 + 爱意标签）
shopBuildGridHtml = function () {
    var sd = appData.shopData;
    var list = (sd.products || []).filter(function (p) {
        if (p.listed === false) return false;
        if (shopCurrentCat !== 'all' && p.category !== shopCurrentCat) return false;
        if (shopSearchKeyword) {
            var kw = shopSearchKeyword.toLowerCase();
            if ((p.name || '').toLowerCase().indexOf(kw) < 0 && (p.desc || '').toLowerCase().indexOf(kw) < 0) return false;
        }
        return true;
    });
    if (list.length === 0) return '<div class="shop-empty" style="grid-column:1/3;">暂无商品</div>';
    var html = '';
    list.forEach(function (p) {
        html += '<div class="shop-card" onclick="shopProductDetail(\'' + p.id + '\')">';
        html += '<div class="shop-card-img">' + shopProductIcon(p, 56) + '</div>';
        html += '<div class="shop-card-info">';
        html += '<div class="shop-card-name">' + shopEscape(p.name) + '</div>';
        html += '<div class="shop-card-price">¥' + p.price + '</div>';
        var tag = p.category === 'love' ? '爱意专属' : shopCatName(p.category);
        html += '<div class="shop-card-tag">' + tag + '</div>';
        html += '</div></div>';
    });
    return html;
};

// 6. 商品详情（爱意专属显示「为他下单」，其它显示购物车/求购/代付）
shopProductDetail = function (id) {
    var p = shopFindProduct(id);
    if (!p) { shopToast('商品不存在'); return; }
    shopInDetail = true;
    var isLove = p.category === 'love';
    var html = '<div class="shop-detail">';
    html += '<div class="shop-detail-img">' + (p.image ? '<img src="' + shopEscape(p.image) + '" style="max-width:100%;max-height:200px;border-radius:12px;">' : shopPixelIcon(p.category, 120)) + '</div>';
    html += '<div style="font-size:11px;color:#999;margin-bottom:4px;">' + (isLove ? '爱意专属' : shopCatName(p.category)) + '</div>';
    html += '<div style="font-size:18px;font-weight:700;color:#333;margin-bottom:6px;">' + shopEscape(p.name) + '</div>';
    html += '<div style="font-size:22px;font-weight:700;color:#ff6b35;margin-bottom:12px;">¥' + p.price + '</div>';
    if (p.desc) html += '<div style="font-size:13px;color:#666;line-height:1.6;margin-bottom:18px;">' + shopEscape(p.desc) + '</div>';
    if (isLove) {
        html += '<button class="shop-mine-btn" onclick="shopOpenLoveModal(\'' + p.id + '\')">为他下单</button>';
    } else {
        html += '<button class="shop-mine-btn" onclick="shopAddToCart(\'' + p.id + '\')">加入购物车</button>';
        html += '<button class="shop-mine-btn" style="background:#fff;color:#ff6b35;border:1px solid #ff6b35;margin-top:8px;" onclick="shopRequestBuy(\'' + p.id + '\')">求购（他付款）</button>';
        html += '<button class="shop-mine-btn" style="background:#fff;color:#ff6b35;border:1px solid #ff6b35;margin-top:8px;" onclick="shopHelpPay(\'' + p.id + '\')">找人代付</button>';
    }
    html += '<button class="shop-mine-btn" style="background:#fff;color:#666;border:1px solid #eee;margin-top:8px;" onclick="shopSwitchTab(\'shop\')">返回商店</button>';
    html += '</div>';
    document.getElementById('shopContent').innerHTML = html;
};

// 7. 爱意专属：为他下单
function shopOpenLoveModal(productId) {
    shopInitData();
    var p = shopFindProduct(productId);
    if (!p) { shopToast('商品不存在'); return; }
    shopCloseModal();
    var overlay = shopModalOverlay();
    var html = '<div class="shop-modal-card" onclick="event.stopPropagation();">';
    html += '<div class="shop-modal-title">为他下单</div>';
    html += '<div style="font-size:13px;color:#666;margin-bottom:10px;">' + shopEscape(p.name) + ' · ¥' + p.price + '</div>';
    html += '<div class="shop-mine-row" style="align-items:flex-start;"><label>留言</label><textarea id="shopLoveMsg" placeholder="礼物留言（选填）" style="flex:1;padding:6px 10px;border:1px solid #eee;border-radius:8px;font-size:13px;outline:none;min-height:50px;resize:none;font-family:inherit;"></textarea></div>';
    html += '<div class="shop-mine-row"><label>支付</label><select id="shopLovePay" style="flex:1;padding:6px 10px;border:1px solid #eee;border-radius:8px;font-size:13px;background:#fff;"><option value="self">自己付款</option><option value="help">找人代付（分享给他）</option></select></div>';
    html += '<div style="display:flex;gap:8px;margin-top:14px;">';
    html += '<button class="shop-mine-btn" style="background:#fff;color:#666;border:1px solid #eee;margin-top:0;flex:1;" onclick="shopCloseModal()">取消</button>';
    html += '<button class="shop-mine-btn" style="margin-top:0;flex:1;" onclick="shopConfirmLove(\'' + productId + '\')">确认下单</button>';
    html += '</div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
}
function shopConfirmLove(productId) {
    shopInitData();
    var sd = appData.shopData;
    var p = shopFindProduct(productId);
    if (!p) { shopToast('商品不存在'); return; }
    var giftMsg = '';
    var msgEl = document.getElementById('shopLoveMsg');
    if (msgEl) giftMsg = (msgEl.value || '').trim();
    var payEl = document.getElementById('shopLovePay');
    var payMethod = payEl ? payEl.value : 'self';
    shopCloseModal();
    var oid = 'o_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    sd.orders.push({
        id: oid, items: [{ productId: p.id, name: p.name, price: p.price, qty: 1, image: p.image || '' }],
        total: p.price, status: 'pending', createTime: Date.now(), shipTime: 0, signTime: 0, deliverTime: 0,
        address: sd.otherAddr || { name: '', phone: '', addr: '' },
        message: '', giftMessage: giftMsg,
        orderType: 'love', buyer: 'me', payer: (payMethod === 'self' ? 'me' : 'other'),
        payStage: (payMethod === 'self' ? 'ship' : 'agree'),
        paid: false, debt: false, deliveryCardSent: false
    });
    if (payMethod === 'help') {
        /* 找人代付：先选择联系人，再发送卡片 */
        shopOpenLoveContactPicker(productId, oid, giftMsg);
        saveData();
        shopToast('请选择代付联系人');
        return;
    }
    saveData();
    shopToast(payMethod === 'self' ? '已下单，发货时扣除你的余额' : '已下单，等待对方代付');
    shopSwitchTab('orders');
}
/* 爱意专属代付：联系人选择弹窗 */
function shopOpenLoveContactPicker(productId, oid, giftMsg) {
    shopInitData();
    var p = shopFindProduct(productId);
    if (!p) { shopToast('商品不存在'); return; }
    var contacts = [];
    try { contacts = (appData.contactList && appData.contactList.contacts) || []; } catch(e) {}
    var overlay = shopModalOverlay();
    var html = '<div class="shop-modal-card" onclick="event.stopPropagation();" style="max-width:360px;">';
    html += '<div class="shop-modal-title">选择代付联系人</div>';
    html += '<div style="font-size:13px;color:#888;margin-bottom:12px;text-align:center;">把代付请求发给谁？</div>';
    html += '<div style="max-height:320px;overflow-y:auto;">';
    if (contacts.length > 0) {
        for (var i = 0; i < contacts.length; i++) {
            var c = contacts[i];
            if (!c || !c.id) continue;
            var cname = c.name || c.nickname || '联系人';
            var avatarHtml = c.avatar ? '<img src="' + shopEscape(c.avatar) + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>' : '<div style="width:40px;height:40px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg viewBox="0 0 24 24" width="22" height="22" fill="#999"><circle cx="12" cy="8" r="4"/><path d="M12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z"/></svg></div>';
            html += '<div class="shop-contact-pick" onclick="shopDoSendLoveCard(\'' + productId + '\',\'' + oid + '\',\'' + shopEscape(giftMsg).replace(/'/g,"\\'") + '\',\'' + c.id + '\',\'' + shopEscape(cname) + '\')" style="display:flex;align-items:center;gap:10px;padding:12px;border:1px solid #eee;border-radius:10px;cursor:pointer;margin-bottom:8px;transition:background .15s;" onmouseover="this.style.background=\'#f8f8f8\'" onmouseout="this.style.background=\'#fff\'">';
            html += avatarHtml;
            html += '<div style="flex:1;font-size:14px;color:#333;">' + shopEscape(cname) + '</div>';
            html += '</div>';
        }
    } else {
        html += '<div style="text-align:center;padding:30px 0;color:#999;font-size:13px;">还没有联系人，请先在聊天中添加联系人</div>';
    }
    html += '</div>';
    html += '<div style="display:flex;gap:8px;margin-top:14px;">';
    html += '<button class="shop-mine-btn" style="background:#fff;color:#666;border:1px solid #eee;margin-top:0;flex:1;" onclick="shopCloseModal();shopSwitchTab(\'orders\');">取消</button>';
    html += '</div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
}
/* 爱意专属代付：发送卡片到选定联系人 */
function shopDoSendLoveCard(productId, oid, giftMsg, contactId, contactName) {
    shopCloseModal();
    shopInitData();
    var p = shopFindProduct(productId);
    if (!p) { shopToast('商品不存在'); return; }
    var msg = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        type: 'shopShareCard',
        sender: 'me',
        cardType: 'loveGift',
        orderId: oid,
        product: { name: p.name, price: p.price, category: p.category, image: p.image || '' },
        title: '分享给你的礼物',
        giftMessage: giftMsg || '',
        status: 'pending',
        respondAt: Date.now() + 15000,
        contactId: contactId || null,
        contactName: contactName || ''
    };
    if (contactId) msg.contactId = contactId;
    addMessage(msg);
    saveData();
    shopToast('代付请求已发送给' + (contactName || '对方'));
    shopSwitchTab('orders');
}

// 8. 求购（我求购，他付款）— 点击后不创建订单，仅发卡片，对方同意后才下单扣款
function shopRequestBuy(productId) {
    shopOpenContactPicker(productId, 'request');
}

// 9. 我下单找他代付 — 点击后不创建订单，仅发卡片，对方同意后才下单扣款
function shopHelpPay(productId) {
    shopOpenContactPicker(productId, 'helpPay');
}

// 8a/9a. 联系人选择弹窗 — 多联系人时选择发给谁
function shopOpenContactPicker(productId, action) {
    shopInitData();
    var p = shopFindProduct(productId);
    if (!p) { shopToast('商品不存在'); return; }
    var contacts = [];
    try { contacts = (appData.contactList && appData.contactList.contacts) || []; } catch(e) {}
    var overlay = shopModalOverlay();
    var html = '<div class="shop-modal-card" onclick="event.stopPropagation();" style="max-width:360px;">';
    html += '<div class="shop-modal-title">选择联系人</div>';
    html += '<div style="font-size:13px;color:#888;margin-bottom:12px;text-align:center;">' + (action === 'request' ? '求购请求发给谁？' : '代付请求发给谁？') + '</div>';
    html += '<div style="max-height:320px;overflow-y:auto;">';
    /* 已有联系人：有几个显示几个，不再额外添加「默认对方」 */
    if (contacts.length > 0) {
        for (var i = 0; i < contacts.length; i++) {
            var c = contacts[i];
            if (!c || !c.id) continue;
            var cname = c.name || c.nickname || '联系人';
            var avatarHtml = c.avatar ? '<img src="' + shopEscape(c.avatar) + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>' : '<div style="width:40px;height:40px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg viewBox="0 0 24 24" width="22" height="22" fill="#999"><circle cx="12" cy="8" r="4"/><path d="M12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z"/></svg></div>';
            html += '<div class="shop-contact-pick" onclick="shopDoSendCard(\'' + productId + '\',\'' + action + '\',\'' + c.id + '\',\'' + shopEscape(cname) + '\')" style="display:flex;align-items:center;gap:10px;padding:12px;border:1px solid #eee;border-radius:10px;cursor:pointer;margin-bottom:8px;transition:background .15s;" onmouseover="this.style.background=\'#f8f8f8\'" onmouseout="this.style.background=\'#fff\'">';
            html += avatarHtml;
            html += '<div style="flex:1;font-size:14px;color:#333;">' + shopEscape(cname) + '</div>';
            html += '</div>';
        }
    } else {
        html += '<div style="text-align:center;padding:30px 0;color:#999;font-size:13px;">还没有联系人，请先在聊天中添加联系人</div>';
    }
    html += '</div>';
    html += '<div style="display:flex;gap:8px;margin-top:14px;">';
    html += '<button class="shop-mine-btn" style="background:#fff;color:#666;border:1px solid #eee;margin-top:0;flex:1;" onclick="shopCloseModal()">取消</button>';
    html += '</div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
}

// 实际发送卡片到选定的联系人
function shopDoSendCard(productId, action, contactId, contactName) {
    shopCloseModal();
    shopInitData();
    var sd = appData.shopData;
    var p = shopFindProduct(productId);
    if (!p) { shopToast('商品不存在'); return; }
    var cardType = action; // 'request' or 'helpPay'
    var title = action === 'request' ? '求购请求' : '代付请求';
    var msg = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        type: 'shopShareCard',
        sender: 'me',
        cardType: cardType,
        orderId: null,
        product: { name: p.name, price: p.price, category: p.category, image: p.image || '' },
        title: title,
        giftMessage: '',
        status: 'pending',
        respondAt: Date.now() + 15000,
        contactId: contactId || null,
        contactName: contactName || ''
    };
    /* 设置 contactId 让 addMessage 路由到正确的联系人聊天记录 */
    if (contactId) msg.contactId = contactId;
    addMessage(msg);
    saveData();
    shopToast((action === 'request' ? '求购' : '代付') + '卡片已发送给' + (contactName || '对方'));
    shopSwitchTab('orders');
}

// 10. 普通购物车结算：发货时扣款（不在结算时扣款）
shopCheckout = function () {
    shopInitData();
    var sd = appData.shopData;
    if (!sd.cart || sd.cart.length === 0) { shopToast('购物车为空'); return; }
    var total = shopCartTotal();
    var items = sd.cart.map(function (ci) {
        var p = shopFindProduct(ci.productId);
        return { productId: ci.productId, name: p ? p.name : '(已下架)', price: p ? p.price : 0, qty: ci.qty, image: (p && p.image) || '' };
    });
    var oid = 'o_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    sd.orders.push({
        id: oid, items: items, total: total, status: 'pending', createTime: Date.now(),
        shipTime: 0, signTime: 0, deliverTime: 0,
        address: { name: sd.myAddr ? sd.myAddr.name : '', phone: sd.myAddr ? sd.myAddr.phone : '', addr: sd.myAddr ? sd.myAddr.addr : '' },
        message: '', giftMessage: '',
        orderType: 'normal', buyer: 'me', payer: 'other', payStage: 'ship',
        paid: false, debt: false, deliveryCardSent: false
    });
    sd.cart = [];
    saveData();
    shopToast('下单成功，发货时将扣除对方余额');
    shopSwitchTab('orders');
};

// 11. 发货：按付款方在发货时扣款
shopShipOrder = function (id) {
    shopInitData();
    var sd = appData.shopData;
    var order = null;
    for (var i = 0; i < sd.orders.length; i++) { if (sd.orders[i].id === id) { order = sd.orders[i]; break; } }
    if (!order) { shopToast('订单不存在'); return; }
    if (order.status !== 'pending') { shopToast('该订单当前状态无法发货'); return; }
    var pre = order.address || (sd.otherAddr || { name: '', phone: '', addr: '' });
    shopOpenAddrModal('填写发货地址', pre, function (addr) {
        order.address = addr;
        order.status = 'shipping';
        order.shipTime = Date.now();
        // ship 阶段订单在发货时扣款；agree 阶段订单已在同意时扣款
        if (!order.paid && (order.payStage === 'ship' || !order.payStage)) {
            shopEnsureBalance();
            var payer = order.payer === 'me' ? 'mine' : 'other';
            addBalanceRecord(payer, -order.total, '次元购物城消费');
            order.paid = true;
            order.debt = appData.balanceData[payer] < 0;
        }
        saveData();
        shopToast('已发货，预计 3 天送达');
        shopOrderDetail(order.id);
    });
};

// 12. 退款申请
function shopApplyRefund(orderId, reason) {
    shopInitData();
    var sd = appData.shopData;
    var order = null;
    for (var i = 0; i < sd.orders.length; i++) { if (sd.orders[i].id === orderId) { order = sd.orders[i]; break; } }
    if (!order) return;
    if (order.confirmResult !== 'notDelivered' || (order.notDeliveredCount || 0) < 2) { shopToast('需对方连续两次未送达后才可退款'); return; }
    order.status = 'refunding';
    order.refundReason = reason;
    order.refundTime = Date.now();
    saveData();
    shopToast('退款申请已提交，1 天内退款到账');
    shopOrderDetail(orderId);
}
function shopOpenRefundModal(orderId) {
    shopCloseModal();
    var overlay = shopModalOverlay();
    var html = '<div class="shop-modal-card" onclick="event.stopPropagation();">';
    html += '<div class="shop-modal-title">申请退款</div>';
    html += '<div class="shop-mine-row"><label>理由</label><select id="shopRefundReason" style="flex:1;padding:6px 10px;border:1px solid #eee;border-radius:8px;font-size:13px;background:#fff;"><option>商品未收到</option><option>损坏</option><option>发错</option><option>其他</option></select></div>';
    html += '<div style="display:flex;gap:8px;margin-top:14px;">';
    html += '<button class="shop-mine-btn" style="background:#fff;color:#666;border:1px solid #eee;margin-top:0;flex:1;" onclick="shopCloseModal()">取消</button>';
    html += '<button class="shop-mine-btn" style="margin-top:0;flex:1;" onclick="shopSubmitRefund(\'' + orderId + '\')">提交</button>';
    html += '</div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
}
function shopSubmitRefund(orderId) {
    var el = document.getElementById('shopRefundReason');
    var reason = el ? el.value : '其他';
    shopCloseModal();
    shopApplyRefund(orderId, reason);
}
function shopReshareDelivery(orderId) {
    var sd = appData.shopData;
    var order = null;
    for (var i = 0; i < sd.orders.length; i++) { if (sd.orders[i].id === orderId) { order = sd.orders[i]; break; } }
    if (!order) return;
    order.deliveryCardSent = true;
    var first = order.items[0] || {};
    shopShareCardToChat({
        sender: 'me', cardType: 'delivery', orderId: order.id,
        product: { name: first.name, price: first.price, category: first.category || 'life', image: first.image || '' },
        title: '商品已送达', giftMessage: order.giftMessage || '',
        respondAt: Date.now() + 30000
    });
    saveData();
    shopToast('已分享已送达卡片');
    shopOrderDetail(orderId);
}

// 确认收到（自己确认收货）
function shopConfirmReceive(orderId) {
    shopInitData();
    var sd = appData.shopData;
    var order = null;
    for (var i = 0; i < sd.orders.length; i++) { if (sd.orders[i].id === orderId) { order = sd.orders[i]; break; } }
    if (!order) return;
    if (order.status !== 'delivered') { shopToast('当前订单状态不可确认'); return; }
    order.status = 'done';
    order.signTime = Date.now();
    order.confirmResult = 'confirmed';
    saveData();
    shopToast('已确认收到');
    shopOrderDetail(orderId);
}

// 发送对方确认（爱意专属订单：选择联系人并发送确认卡片）
function shopSendDeliveryConfirm(orderId) {
    shopInitData();
    var sd = appData.shopData;
    var order = null;
    for (var i = 0; i < sd.orders.length; i++) { if (sd.orders[i].id === orderId) { order = sd.orders[i]; break; } }
    if (!order) return;
    if (order.status !== 'delivered') { shopToast('订单尚未送达'); return; }
    var ndCount = order.notDeliveredCount || 0;
    if (ndCount >= 2) { shopToast('对方连续两次未送达，无法再次发送'); return; }
    shopCloseModal();
    var contacts = [];
    try { contacts = (appData.contactList && appData.contactList.contacts) || []; } catch(e) {}
    var overlay = shopModalOverlay();
    var html = '<div class="shop-modal-card" onclick="event.stopPropagation();" style="max-width:360px;">';
    html += '<div class="shop-modal-title">选择确认联系人</div>';
    html += '<div style="font-size:13px;color:#888;margin-bottom:12px;text-align:center;">把送达确认发给谁？</div>';
    html += '<div style="max-height:320px;overflow-y:auto;">';
    if (contacts.length > 0) {
        for (var i = 0; i < contacts.length; i++) {
            var c = contacts[i];
            if (!c || !c.id) continue;
            var cname = c.name || c.nickname || '联系人';
            var avatarHtml = c.avatar ? '<img src="' + shopEscape(c.avatar) + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>' : '<div style="width:40px;height:40px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg viewBox="0 0 24 24" width="22" height="22" fill="#999"><circle cx="12" cy="8" r="4"/><path d="M12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z"/></svg></div>';
            html += '<div class="shop-contact-pick" onclick="shopDoSendDeliveryCard(\'' + orderId + '\',\'' + c.id + '\',\'' + shopEscape(cname).replace(/'/g,"\\'") + '\')" style="display:flex;align-items:center;gap:10px;padding:12px;border:1px solid #eee;border-radius:10px;cursor:pointer;margin-bottom:8px;" onmouseover="this.style.background=\'#f8f8f8\'" onmouseout="this.style.background=\'#fff\'">';
            html += avatarHtml;
            html += '<div style="flex:1;font-size:14px;color:#333;">' + shopEscape(cname) + '</div>';
            html += '</div>';
        }
    } else {
        html += '<div style="text-align:center;padding:30px 0;color:#999;font-size:13px;">还没有联系人，请先在聊天中添加联系人</div>';
    }
    html += '</div>';
    html += '<div style="display:flex;gap:8px;margin-top:14px;">';
    html += '<button class="shop-mine-btn" style="background:#fff;color:#666;border:1px solid #eee;margin-top:0;flex:1;" onclick="shopCloseModal();">取消</button>';
    html += '</div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
}

// 发送送达确认卡片到选定联系人
function shopDoSendDeliveryCard(orderId, contactId, contactName) {
    shopInitData();
    var sd = appData.shopData;
    var order = null;
    for (var i = 0; i < sd.orders.length; i++) { if (sd.orders[i].id === orderId) { order = sd.orders[i]; break; } }
    if (!order) return;
    shopCloseModal();
    // 重置确认状态以便重新等待回复
    order.deliveryCardSent = true;
    order.confirmResult = null; // 清除之前的 notDelivered，重新等待
    order.deliveryConfirmContactId = contactId;
    order.deliveryConfirmContactName = contactName;
    var first = order.items[0] || {};
    shopShareCardToChat({
        sender: 'me', cardType: 'delivery', orderId: order.id,
        product: { name: first.name, price: first.price, category: first.category || 'life', image: first.image || '' },
        title: '商品已送达', giftMessage: order.giftMessage || '',
        respondAt: Date.now() + 30000,
        contactId: contactId,
        contactName: contactName
    });
    saveData();
    shopToast('已发送送达确认卡片给 ' + contactName);
    shopOrderDetail(orderId);
}

// 13. 订单列表
shopRenderOrders = function () {
    shopInDetail = false;
    var sd = appData.shopData;
    var html = '';
    var orders = (sd.orders || []).slice().reverse();
    if (orders.length === 0) {
        html += '<div class="shop-empty">还没有订单</div>';
    } else {
        orders.forEach(function (o) {
            var first = o.items[0] ? o.items[0].name : '';
            var more = o.items.length > 1 ? ' 等' + o.items.length + '件' : '';
            var typeLabel = ({ normal: '普通', love: '爱意专属', request: '求购', helpPay: '代付', heHelpPay: '他代付' })[o.orderType] || '';
            html += '<div class="shop-order-item" onclick="shopOrderDetail(\'' + o.id + '\')">';
            html += '<div class="soi-name">' + shopEscape(first) + more + (typeLabel ? ' <span style="font-size:10px;color:#aaa;">' + typeLabel + '</span>' : '') + '</div>';
            if (o.giftMessage) html += '<div style="font-size:11px;color:#a0845a;margin-top:2px;">礼物留言：' + shopEscape(o.giftMessage) + '</div>';
            else if (o.message) html += '<div style="font-size:11px;color:#a0845a;margin-top:2px;">留言：' + shopEscape(o.message) + '</div>';
            html += '<div class="soi-price">¥' + o.total.toFixed(2) + '</div>';
            html += '<div><span class="soi-status ' + shopStatusClass(o.status) + '">' + shopStatusName(o.status) + '</span>';
            if (o.debt) html += ' <span class="shop-owe-tag">赊账</span>';
            if (o.confirmResult === 'notDelivered' && (o.notDeliveredCount || 0) >= 2) html += ' <span class="soi-status pending">未送达</span>';
            html += '</div>';
            html += '<div class="soi-time">' + shopFormatTime(o.createTime) + '</div>';
            if (o.status === 'pending') {
                html += '<button style="margin-top:8px;padding:6px 14px;background:#ff6b35;color:#fff;border:none;border-radius:8px;font-size:12px;" onclick="event.stopPropagation();shopShipOrder(\'' + o.id + '\')">发货</button>';
            }
            html += '</div>';
        });
    }
    document.getElementById('shopContent').innerHTML = html;
};

// 14. 订单详情
shopOrderDetail = function (id) {
    var sd = appData.shopData;
    var order = null;
    for (var i = 0; i < sd.orders.length; i++) { if (sd.orders[i].id === id) { order = sd.orders[i]; break; } }
    if (!order) { shopToast('订单不存在'); return; }
    shopInDetail = true;
    var html = '<div class="shop-detail">';
    // 商品明细
    html += '<div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:12px;">';
    html += '<div style="font-size:14px;font-weight:700;margin-bottom:8px;">商品明细</div>';
    order.items.forEach(function (it) {
        html += '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">';
        html += '<span>' + shopEscape(it.name) + ' ×' + it.qty + '</span>';
        html += '<span style="color:#ff6b35;">¥' + (it.price * it.qty).toFixed(2) + '</span></div>';
    });
    html += '<div style="border-top:1px solid #eee;margin-top:6px;padding-top:8px;display:flex;justify-content:space-between;font-size:14px;font-weight:700;"><span>合计</span><span style="color:#ff6b35;">¥' + order.total.toFixed(2) + '</span></div>';
    html += '</div>';
    // 状态 + 时间线
    html += '<div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:12px;">';
    html += '<div style="font-size:14px;font-weight:700;margin-bottom:10px;">订单状态：' + shopStatusName(order.status) + '</div>';
    if (order.debt) html += '<div class="shop-owe-tag" style="margin-bottom:8px;">本次购买赊账 ¥' + order.total.toFixed(2) + '</div>';
    html += '<div class="shop-timeline">';
    html += shopTimelineItem(true, '已下单', order.createTime);
    var shipped = order.status === 'shipping' || order.status === 'delivered' || order.status === 'done';
    html += shopTimelineItem(shipped, '已发货', order.shipTime);
    var delivered = order.status === 'delivered' || order.status === 'done';
    html += shopTimelineItem(delivered, '已送达', order.deliverTime);
    html += shopTimelineItem(order.status === 'done', '已签收', order.signTime);
    html += '</div>';
    if (order.status === 'shipping' && order.shipTime) {
        var elapsed = Date.now() - order.shipTime;
        var pct = Math.min(100, Math.round(elapsed / SHOP_SHIP_DURATION * 100));
        var remain = Math.max(0, SHOP_SHIP_DURATION - elapsed);
        var days = Math.ceil(remain / 86400000);
        html += '<div style="margin-top:12px;font-size:12px;color:#666;">运输进度：' + pct + '%</div>';
        html += '<div style="height:6px;background:#eee;border-radius:3px;margin-top:4px;overflow:hidden;"><div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#ff6b35,#ff8e53);"></div></div>';
        html += '<div style="font-size:11px;color:#999;margin-top:4px;">预计 ' + days + ' 天后送达</div>';
    }
    html += '</div>';
    // 地址
    if (order.address) {
        html += '<div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:12px;">';
        html += '<div style="font-size:14px;font-weight:700;margin-bottom:8px;">收货地址</div>';
        html += '<div style="font-size:13px;color:#333;font-weight:600;">' + shopEscape(order.address.name || '') + ' ' + shopEscape(order.address.phone || '') + '</div>';
        html += '<div style="font-size:12px;color:#666;margin-top:3px;">' + shopEscape(order.address.addr || '') + '</div>';
        html += '</div>';
    }
    if (order.giftMessage) html += '<div class="shop-msg-card"><div class="smc-label">礼物留言</div>' + shopEscape(order.giftMessage) + '</div>';
    if (order.message) html += '<div class="shop-msg-card"><div class="smc-label">回礼留言</div>' + shopEscape(order.message) + '</div>';
    if (order.refundReason) html += '<div class="shop-msg-card"><div class="smc-label">退款理由</div>' + shopEscape(order.refundReason) + '</div>';
    // 操作
    html += '<div style="margin-top:8px;">';
    if (order.status === 'pending') html += '<button class="shop-mine-btn" onclick="shopShipOrder(\'' + order.id + '\')">发货</button>';
    // 已送达且未最终确认
    if (order.status === 'delivered' && order.confirmResult !== 'confirmed') {
        // 申请退款：连续两次未送达才可退款
        if (order.confirmResult === 'notDelivered' && (order.notDeliveredCount || 0) >= 2 && order.status !== 'refunding' && order.status !== 'refunded') {
            html += '<button class="shop-mine-btn" style="background:#fff;color:#e74c3c;border:1px solid #ffd5d5;margin-top:8px;" onclick="shopOpenRefundModal(\'' + order.id + '\')">申请退款</button>';
        }
        // 确认收到（自己确认收货，所有已送达订单均可确认）
        html += '<button class="shop-mine-btn" style="margin-top:8px;" onclick="shopConfirmReceive(\'' + order.id + '\')">确认收到</button>';
        // 爱意专属订单：发送对方确认
        if (order.orderType === 'love') {
            var _ndCount = order.notDeliveredCount || 0;
            if (_ndCount >= 2) {
                // 连续两次未送达，不再发送
            } else if (order.deliveryCardSent && order.confirmResult === 'notDelivered') {
                html += '<button class="shop-mine-btn" style="background:#fff;color:#ff6b35;border:1px solid #ff6b35;margin-top:8px;" onclick="shopSendDeliveryConfirm(\'' + order.id + '\')">再次发送对方确认</button>';
            } else if (!order.deliveryCardSent) {
                html += '<button class="shop-mine-btn" style="background:#fff;color:#ff6b35;border:1px solid #ff6b35;margin-top:8px;" onclick="shopSendDeliveryConfirm(\'' + order.id + '\')">发送对方确认</button>';
            } else {
                // 已发送卡片，等待对方确认
                html += '<div style="margin-top:8px;padding:8px 12px;background:#fff8f0;border-radius:8px;font-size:12px;color:#ff6b35;text-align:center;">已发送确认卡片，等待对方回复...</div>';
            }
        }
    }
    html += '<button class="shop-mine-btn" style="background:#fff;color:#666;border:1px solid #eee;margin-top:8px;" onclick="shopSwitchTab(\'orders\')">返回订单列表</button>';
    html += '</div></div>';
    document.getElementById('shopContent').innerHTML = html;
};

// 15. 商品编辑：支持上传图片 + 恢复默认
shopOpenProductModal = function (p) {
    shopCloseModal();
    var overlay = shopModalOverlay();
    var title = p ? '编辑商品' : '上架新商品';
    var html = '<div class="shop-modal-card" onclick="event.stopPropagation();">';
    html += '<div class="shop-modal-title">' + title + '</div>';
    html += '<div class="shop-mine-row"><label>名称</label><input id="shopProdName" type="text" value="' + (p ? shopEscape(p.name) : '') + '" placeholder="商品名称"></div>';
    html += '<div class="shop-mine-row"><label>价格</label><input id="shopProdPrice" type="number" inputmode="decimal" value="' + (p ? p.price : '') + '" placeholder="价格"></div>';
    html += '<div class="shop-mine-row"><label>分类</label><select id="shopProdCat" style="flex:1;padding:6px 10px;border:1px solid #eee;border-radius:8px;font-size:13px;outline:none;background:#fff;">';
    SHOP_CATEGORIES.forEach(function (c) {
        html += '<option value="' + c.key + '"' + (p && p.category === c.key ? ' selected' : '') + '>' + c.name + '</option>';
    });
    html += '</select></div>';
    html += '<div class="shop-mine-row" style="align-items:flex-start;"><label>描述</label><textarea id="shopProdDesc" placeholder="商品描述" style="flex:1;padding:6px 10px;border:1px solid #eee;border-radius:8px;font-size:13px;outline:none;min-height:54px;resize:none;font-family:inherit;">' + (p ? shopEscape(p.desc || '') : '') + '</textarea></div>';
    html += '<div class="shop-mine-row" style="align-items:center;"><label>图片</label><div style="flex:1;display:flex;align-items:center;gap:8px;">';
    html += '<input type="file" id="shopProdImage" accept="image/*" style="font-size:12px;flex:1;" onchange="shopPreviewProductImage(this)">';
    html += '<img id="shopProdImagePreview" src="' + (p && p.image ? shopEscape(p.image) : '') + '" style="width:40px;height:40px;object-fit:cover;border-radius:8px;' + (p && p.image ? '' : 'display:none;') + '"></div></div>';
    html += '<div style="display:flex;gap:8px;margin-top:14px;">';
    html += '<button class="shop-mine-btn" style="background:#fff;color:#666;border:1px solid #eee;margin-top:0;flex:1;" onclick="shopCloseModal()">取消</button>';
    if (p && p.preset) html += '<button class="shop-mine-btn" style="background:#fff;color:#ff6b35;border:1px solid #ff6b35;margin-top:0;flex:1;" onclick="shopRestorePresetProduct(\'' + p.id + '\')">恢复默认</button>';
    html += '<button class="shop-mine-btn" style="margin-top:0;flex:1;" onclick="shopSaveProduct(' + (p ? '\'' + p.id + '\'' : 'null') + ')">保存</button>';
    html += '</div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    setTimeout(function () { var i = document.getElementById('shopProdName'); if (i) i.focus(); }, 80);
};
function shopPreviewProductImage(input) {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
        var prev = document.getElementById('shopProdImagePreview');
        if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
    };
    reader.readAsDataURL(file);
}
shopSaveProduct = function (id) {
    shopInitData();
    var sd = appData.shopData;
    var nameEl = document.getElementById('shopProdName');
    var priceEl = document.getElementById('shopProdPrice');
    var catEl = document.getElementById('shopProdCat');
    var descEl = document.getElementById('shopProdDesc');
    var imgPrev = document.getElementById('shopProdImagePreview');
    if (!nameEl || !priceEl || !catEl) return;
    var name = (nameEl.value || '').trim();
    var price = parseFloat(priceEl.value);
    var cat = catEl.value;
    var desc = descEl ? (descEl.value || '').trim() : '';
    var image = imgPrev ? imgPrev.src : '';
    if (image.indexOf('data:') !== 0) image = '';
    if (!name) { shopToast('请输入商品名称'); return; }
    if (isNaN(price) || price < 0) { shopToast('请输入有效价格'); return; }
    shopCloseModal();
    if (id) {
        var p = shopFindProduct(id);
        if (p) { p.name = name; p.price = price; p.category = cat; p.desc = desc; p.image = image; }
    } else {
        var pid = 'p_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
        sd.products.push({ id: pid, name: name, price: price, category: cat, desc: desc, image: image, listed: true, preset: false });
    }
    saveData();
    shopToast(id ? '已更新' : '已上架');
    shopRenderMine();
};
function shopRestorePresetProduct(id) {
    var p = shopFindProduct(id);
    if (!p || !p.preset) { shopToast('仅预设商品可恢复'); return; }
    var idx = -1;
    var m = id.match(/shop_preset_(\d+)/);
    if (m) idx = parseInt(m[1]) - 1;
    var preset = (idx >= 0 && idx < SHOP_PRESET_PRODUCTS.length) ? SHOP_PRESET_PRODUCTS[idx] : null;
    if (preset) {
        p.name = preset.name; p.price = preset.price; p.category = preset.category; p.desc = preset.desc; p.image = '';
        saveData();
        shopCloseModal();
        shopToast('已恢复默认');
        shopRenderMine();
    } else {
        shopToast('未找到预设信息');
    }
}

// 16. 分享卡片渲染
function shopRenderShareCard(msg) {
    var p = msg.product || {};
    var icon = (p.image ? '<img src="' + shopEscape(p.image) + '">' : shopPixelIcon(p.category || 'life', 40));
    /* 顶部标题：求购请求 / 代付请求 / 他找你代付 */
    var cardTitle = msg.title || '';
    if (msg.cardType === 'request') cardTitle = '求购请求';
    else if (msg.cardType === 'helpPay') cardTitle = '代付请求';
    else if (msg.cardType === 'heHelpPay') cardTitle = '他找你代付';
    else if (msg.cardType === 'delivery') cardTitle = msg.title || '商品已送达';
    else if (msg.cardType === 'loveGift') cardTitle = msg.title || '爱意礼物';
    /* 获取卡片关联的联系人名称 */
    var cardContactName = msg.contactName || '';
    if (!cardContactName) {
        cardContactName = (appData.chatSettings && appData.chatSettings.otherNickname) || '对方';
    }
    var html = '<div class="shop-share-card">';
    html += '<div class="ssc-title">' + shopEscape(cardTitle) + '</div>';
    /* 显示发给谁 */
    if (msg.sender === 'me' && (msg.cardType === 'request' || msg.cardType === 'helpPay')) {
        html += '<div class="ssc-contact-tag">发给：' + shopEscape(cardContactName) + '</div>';
    }
    /* 他找你代付：显示提示语 */
    if (msg.cardType === 'heHelpPay' && msg.sender === 'other') {
        html += '<div class="ssc-hint">' + shopEscape(cardContactName) + ' 想给你买 ' + shopEscape(p.name || '') + '，金额 ¥' + (p.price || 0) + '，你可以帮他代付吗？</div>';
    }
    html += '<div class="ssc-body"><div class="ssc-icon">' + icon + '</div>';
    html += '<div class="ssc-info"><div class="ssc-name">' + shopEscape(p.name || '') + '</div>';
    html += '<div class="ssc-price">¥' + (p.price || 0) + '</div></div></div>';
    if (msg.giftMessage) html += '<div class="ssc-gift">留言：' + shopEscape(msg.giftMessage) + '</div>';
    html += '<div class="ssc-footer">';
    var st = msg.status || 'pending';
    if (st === 'pending') {
        if (msg.sender === 'other') {
            // 他找我代付：我来点击选择
            html += '<button class="ssc-btn agree" onclick="shopCardAction(' + msg.id + ',\'agree\')">同意代付</button>';
            html += '<button class="ssc-btn reject" onclick="shopCardAction(' + msg.id + ',\'reject\')">拒绝代付</button>';
        } else {
            // 我发出的求购/代付：对方自动选择，显示倒计时 + 按钮（仅展示）
            var left = Math.max(0, Math.ceil(((msg.respondAt || 0) - Date.now()) / 1000));
            html += '<button class="ssc-btn agree" disabled style="opacity:0.6;cursor:default;">同意</button>';
            html += '<button class="ssc-btn reject" disabled style="opacity:0.6;cursor:default;">拒绝</button>';
            html += '</div><div class="ssc-count" data-respondat="' + (msg.respondAt || 0) + '">' + shopEscape(cardContactName) + ' 考虑中... ' + left + 's</div>';
        }
    } else if (st === 'confirmed') {
        html += '<div class="ssc-result ok">' + shopEscape(cardContactName) + ' 已确认收货</div>';
    } else if (st === 'accepted') {
        html += '<div class="ssc-result ok">' + (msg.sender === 'other' ? '你已同意代付' : shopEscape(cardContactName) + ' 已同意') + '</div>';
    } else if (st === 'rejected') {
        html += '<div class="ssc-result no">' + (msg.sender === 'other' ? '你已拒绝代付' : shopEscape(cardContactName) + ' 已拒绝') + '</div>';
    } else if (st === 'notDelivered') {
        html += '<div class="ssc-result no">' + shopEscape(cardContactName) + ' 反馈未送达</div>';
    }
    if (st !== 'pending' || msg.sender === 'other') html += '</div>';
    html += '</div>';
    return html;
}

// 17. 卡片加入聊天
function shopShareCardToChat(card) {
    var msg = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        type: 'shopShareCard',
        sender: card.sender || 'me',
        cardType: card.cardType,
        orderId: card.orderId,
        product: card.product,
        title: card.title,
        giftMessage: card.giftMessage || '',
        status: 'pending',
        respondAt: card.respondAt || 0,
        contactId: card.contactId || null,
        contactName: card.contactName || ''
    };
    if (card.contactId) msg.contactId = card.contactId;
    addMessage(msg);
    return msg.id;
}

// 18. 我点击卡片（他找我代付）
function shopCardAction(msgId, action) {
    var msg = null;
    for (var i = 0; i < appData.chatHistory.length; i++) { if (appData.chatHistory[i].id === msgId) { msg = appData.chatHistory[i]; break; } }
    if (!msg || msg.type !== 'shopShareCard' || msg.status !== 'pending') return;
    var sd = appData.shopData;
    if (action === 'agree') {
        msg.status = 'accepted';
        /* 我同意代付：此时创建订单并从我的余额扣款 */
        var _p = msg.product || {};
        var _oid = 'o_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        /* Bug23修复：根据 msg.cardType 确定正确的 orderType，loveGift 不再被当作 heHelpPay */
        var _orderType = msg.cardType === 'request' ? 'request' : (msg.cardType === 'helpPay' ? 'helpPay' : (msg.cardType === 'loveGift' ? 'loveGift' : 'heHelpPay'));
        var _descLabel = msg.cardType === 'loveGift' ? '爱意礼物代付' : '次元购物城代付';
        sd.orders.push({
            id: _oid, items: [{ productId: _p.id || '', name: _p.name || '', price: _p.price || 0, qty: 1, image: _p.image || '' }],
            total: _p.price || 0, status: 'pending', createTime: Date.now(), shipTime: 0, signTime: 0, deliverTime: 0,
            address: sd.otherAddr || { name: '', phone: '', addr: '' },
            message: '', giftMessage: msg.giftMessage || '',
            orderType: _orderType, buyer: 'other', payer: 'me', payStage: 'agree',
            paid: true, debt: false, deliveryCardSent: false
        });
        msg.orderId = _oid;
        shopEnsureBalance();
        addBalanceRecord('mine', -(_p.price || 0), _descLabel);
        sd.orders[sd.orders.length - 1].debt = appData.balanceData.mine < 0;
        addSystemMsg('你已同意代付，¥' + (_p.price || 0) + ' 已从你的余额扣除' + (msg.giftMessage ? '（留言：' + msg.giftMessage + '）' : ''));
    } else {
        msg.status = 'rejected';
        addSystemMsg('你已拒绝代付');
    }
    saveData();
    renderMessages();
    if (shopAppOpen) shopRefreshCurrent();
}

// 19. 自动处理待响应卡片（无需点击接收消息按钮；离线后上线补发）
function shopProcessPendingCards() {
    if (typeof _idbReady !== 'undefined' && !_idbReady) return;
    if (!appData.shopData) return;
    var sd = appData.shopData;
    var now = Date.now();
    var changed = false;
    var snapshot = appData.chatHistory.slice();
    for (var i = 0; i < snapshot.length; i++) {
        var msg = snapshot[i];
        if (!msg || msg.type !== 'shopShareCard' || msg.status !== 'pending') continue;
        if (msg.sender === 'other') continue; // 他找我代付：由我点击
        if (!msg.respondAt || msg.respondAt > now) continue;
        var order = null;
        for (var k = 0; k < sd.orders.length; k++) { if (sd.orders[k].id === msg.orderId) { order = sd.orders[k]; break; } }
        /* 获取卡片关联的联系人名称 */
        var _cardContactName = msg.contactName || ((appData.chatSettings && appData.chatSettings.otherNickname) || '对方');
        /* 临时切换聊天上下文，让系统消息发到正确的联系人聊天记录 */
        var _savedContactId = _activeContactId;
        if (msg.contactId) { _activeContactId = msg.contactId; }
        if (msg.cardType === 'delivery') {
            if (Math.random() < 0.5) {
                msg.status = 'confirmed';
                if (order) { order.status = 'done'; order.signTime = now; order.confirmResult = 'confirmed'; order.message = shopGetShopMessage(); }
                addSystemMsg(_cardContactName + ' 已确认收货' + (order && order.message ? '并留言：' + order.message : ''));
            } else {
                msg.status = 'notDelivered';
                if (order) {
                    order.notDeliveredCount = (order.notDeliveredCount || 0) + 1;
                    order.confirmResult = 'notDelivered';
                    // 连续两次未送达才允许退款，第一次可以再次发送
                    if (order.notDeliveredCount >= 2) {
                        addSystemMsg(_cardContactName + ' 连续两次反馈未收到商品，可在次元购物城申请退款');
                    } else {
                        // 第一次未送达，重置 deliveryCardSent 以便用户可以再次发送
                        order.deliveryCardSent = false;
                        addSystemMsg(_cardContactName + ' 反馈未收到商品，可再次发送确认');
                    }
                }
            }
            changed = true;
        } else if (msg.cardType === 'request' || msg.cardType === 'helpPay' || msg.cardType === 'loveGift') {
            if (Math.random() < 0.5) {
                msg.status = 'accepted';
                /* 对方同意：此时创建订单并扣款 */
                var _p = msg.product || {};
                var _oid = 'o_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                var _orderType = msg.cardType === 'request' ? 'request' : (msg.cardType === 'helpPay' ? 'helpPay' : 'loveGift');
                sd.orders.push({
                    id: _oid, items: [{ productId: '', name: _p.name || '', price: _p.price || 0, qty: 1, image: _p.image || '' }],
                    total: _p.price || 0, status: 'pending', createTime: Date.now(), shipTime: 0, signTime: 0, deliverTime: 0,
                    address: sd.otherAddr || { name: '', phone: '', addr: '' },
                    message: '', giftMessage: msg.giftMessage || '',
                    orderType: _orderType, buyer: 'me', payer: 'other', payStage: 'agree',
                    paid: true, debt: false, deliveryCardSent: false
                });
                msg.orderId = _oid;
                shopEnsureBalance();
                addBalanceRecord('other', -(_p.price || 0), '次元购物城代付/求购', msg.contactId || null);
                sd.orders[sd.orders.length - 1].debt = getOtherBalance(msg.contactId || null) < 0;
                addSystemMsg(_cardContactName + ' 已同意，¥' + (_p.price || 0) + ' 已从对方余额扣除');
            } else {
                msg.status = 'rejected';
                /* 根据对方余额显示不同留言 */
                shopEnsureBalance();
                var _otherBal = getOtherBalance(msg.contactId || null);
                var _rejectMsg = '';
                if (_otherBal < 0) {
                    _rejectMsg = '天啊‼️陛下！对方已经负债了呀❗️❗️';
                } else if (_otherBal === 0) {
                    _rejectMsg = '现在立刻马上去看看他的余额！';
                } else {
                    _rejectMsg = '看来系统又占了上风，系统跪下！ 系统跪下：（一个人机痛哭😭）';
                }
                addSystemMsg(_cardContactName + ' 拒绝了付款请求，留言：' + _rejectMsg);
            }
            changed = true;
        }
        /* 恢复聊天上下文 */
        _activeContactId = _savedContactId;
    }
    if (changed) {
        saveData();
        renderMessages();
        if (shopAppOpen) shopRefreshCurrent();
    }
}

// 20. 他找我代付（每日 3% 事件）— 不创建订单，仅发卡片，我同意后才下单扣款
function shopMaybeHeHelpPay() {
    shopInitData();
    var sd = appData.shopData;
    var pool = (sd.products || []).filter(function (p) { return p.listed !== false && p.category !== 'love'; });
    if (pool.length === 0) return;
    /* 没有联系人时不触发代付事件 */
    var _contacts = [];
    try { _contacts = (appData.contactList && appData.contactList.contacts) || []; } catch(e) {}
    if (_contacts.length === 0) return;
    var p = pool[Math.floor(Math.random() * pool.length)];
    /* 从联系人中随机选一个发起代付请求 */
    var _pick = _contacts[Math.floor(Math.random() * _contacts.length)];
    var _heContactId = _pick.id;
    var _heContactName = _pick.name || _pick.nickname || '联系人';
    var msg = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        type: 'shopShareCard',
        sender: 'other', cardType: 'heHelpPay', orderId: null,
        product: { name: p.name, price: p.price, category: p.category, image: p.image || '' },
        title: '他找你代付',
        giftMessage: '',
        status: 'pending',
        respondAt: 0,
        contactId: _heContactId,
        contactName: _heContactName
    };
    if (_heContactId) msg.contactId = _heContactId;
    addMessage(msg);
    saveData();
}

// 21. 覆盖每日检查：已送达 / 退款 / 卡片响应 / 每日事件
shopCheckAutoOrder = function () {
    if (typeof _idbReady !== 'undefined' && !_idbReady) return;
    shopInitData();
    var sd = appData.shopData;
    var now = Date.now();
    var changed = false;

    // 运输中 -> 已送达（3 天）
    (sd.orders || []).forEach(function (o) {
        if (o.status === 'shipping' && o.shipTime && (now - o.shipTime) >= SHOP_SHIP_DURATION) {
            o.status = 'delivered'; o.deliverTime = now; changed = true;
        }
    });
    // 已送达 -> 不再自动发卡片，由用户手动「发送对方确认」或「确认收到」
    // 退款中 -> 已退款（1 天），退款返还付款方
    (sd.orders || []).forEach(function (o) {
        if (o.status === 'refunding' && o.refundTime && (now - o.refundTime) >= 86400000) {
            shopEnsureBalance();
            addBalanceRecord(o.payer === 'me' ? 'mine' : 'other', o.total, '次元购物城退款');
            o.status = 'refunded'; o.refundDoneTime = now; changed = true;
        }
    });
    // 处理待响应卡片
    try { shopProcessPendingCards(); } catch (e) { console.error('[shop] processPendingCards error:', e); }

    // 每日事件：10% 他为我购买 / 10% 他找我代付（互斥，每日最多触发其一）
    var today = new Date().toISOString().slice(0, 10);
    if (sd.lastAutoOrderDate !== today) {
        sd.lastAutoOrderDate = today; changed = true;
        var aTriggered = false;
        var pool = (sd.products || []).filter(function (p) { return p.listed !== false && p.category !== 'love'; });
        if (pool.length > 0 && Math.random() < 0.10) {
            var p = pool[Math.floor(Math.random() * pool.length)];
            var msg = shopGetShopMessage();
            var oid = 'o_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            sd.orders.push({
                id: oid, items: [{ productId: p.id, name: p.name, price: p.price, qty: 1, image: p.image || '' }],
                total: p.price, status: 'pending', createTime: now, shipTime: 0, signTime: 0, deliverTime: 0,
                address: sd.otherAddr || { name: '', phone: '', addr: '' },
                message: msg, giftMessage: '',
                orderType: 'normal', buyer: 'other', payer: 'other', payStage: 'ship',
                paid: false, debt: false, deliveryCardSent: false
            });
            aTriggered = true;
        }
        if (!aTriggered && Math.random() < 0.10) {
            shopMaybeHeHelpPay();
        }
    }

    if (changed) {
        saveData();
        if (shopAppOpen && shopCurrentTab === 'orders' && !shopInDetail) shopRenderOrders();
    }
};

// 22. 倒计时刷新 + 待响应卡片定时处理（离线后上线补发）
setInterval(function () {
    try {
        document.querySelectorAll('.ssc-count[data-respondat]').forEach(function (el) {
            var t = parseInt(el.getAttribute('data-respondat'));
            var left = Math.max(0, Math.ceil((t - Date.now()) / 1000));
            el.textContent = '对方考虑中... ' + left + 's';
        });
    } catch (e) {}
}, 1000);
setInterval(function () { try { shopProcessPendingCards(); } catch (e) {} }, 3000);


(function(){
  'use strict';
  var STORAGE_KEY = 'randomfood_data';
  var PRESET = ['黄焖鸡米饭','猪脚饭','煲仔饭','烧腊饭','兰州拉面','沙县拌面','螺蛳粉','热干面','麦当劳','肯德基','华莱士','塔斯汀','桂林米粉','云南米线','酸辣粉','麻辣烫','杨国福','饺子','馄饨','手抓饼','煎饼果子','烤冷面'];
  var PALETTE = ['#FFB3D1','#FFC288','#FFE699','#B8E6C9','#C9B8E6','#A8D8F0','#FF9E9E','#D4E89E','#FFD6B0','#A8E6E0','#F4A7C0','#F0D878'];

  var overlay = document.getElementById('randomFoodOverlay');
  if(!overlay) return;
  var canvasEl = document.getElementById('randomFoodCanvas');
  var spinBtn = document.getElementById('randomFoodSpinBtn');
  var againBtn = document.getElementById('randomFoodAgainBtn');
  var resultWrap = document.getElementById('randomFoodResultWrap');
  var resultEl = document.getElementById('randomFoodResult');
  var manageBtn = document.getElementById('randomFoodManageBtn');
  var managePanel = document.getElementById('randomFoodManagePanel');
  var manageListEl = document.getElementById('randomFoodManageList');
  var manageClose = document.getElementById('randomFoodManageClose');
  var closeBtn = document.getElementById('randomFoodClose');
  var newInput = document.getElementById('randomFoodNewInput');
  var addBtn = document.getElementById('randomFoodAddBtn');
  var plusBtn = document.getElementById('randomFoodPlusBtn');

  var items = loadData();
  var currentRotation = 0;
  var spinning = false;

  function loadData(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if(raw !== null){
        var d = JSON.parse(raw);
        if(d && Array.isArray(d.items)) return d.items.slice();
      }
    } catch(e){}
    return PRESET.slice();
  }
  function saveData(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: items })); } catch(e){}
  }

  function drawWheel(highlightIdx){
    var ctx = canvasEl.getContext('2d');
    var W = canvasEl.width, H = canvasEl.height;
    var cx = W / 2, cy = H / 2;
    var radius = Math.min(cx, cy) - 4;
    ctx.clearRect(0, 0, W, H);
    var N = items.length;
    if(N === 0){
      ctx.fillStyle = '#f0f0f0';
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#999'; ctx.font = '14px -apple-system,"PingFang SC",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('请先添加选项', cx, cy);
      return;
    }
    var seg = 2 * Math.PI / N;
    for(var i = 0; i < N; i++){
      var start = -Math.PI / 2 + i * seg;
      var end = start + seg;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = PALETTE[i % PALETTE.length];
      ctx.fill();
      ctx.lineWidth = (i === highlightIdx) ? 4 : 1;
      ctx.strokeStyle = (i === highlightIdx) ? '#ffffff' : 'rgba(255,255,255,0.5)';
      ctx.stroke();
      // 文字
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + seg / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px -apple-system,"PingFang SC",sans-serif';
      var label = items[i];
      if(label.length > 6) label = label.substring(0, 6);
      ctx.fillText(label, radius - 10, 0);
      ctx.restore();
    }
    // 中心圆
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  function spin(){
    if(spinning) return;
    var N = items.length;
    if(N === 0) return;
    spinning = true;
    spinBtn.disabled = true;
    againBtn.disabled = true;
    resultWrap.style.display = 'none';
    var seg = 360 / N;
    var target = Math.floor(Math.random() * N);
    var jitter = (Math.random() - 0.5) * seg * 0.7;
    var targetCenter = target * seg + seg / 2 + jitter;
    var desiredMod = ((360 - (targetCenter % 360)) % 360 + 360) % 360;
    var currentMod = ((currentRotation % 360) + 360) % 360;
    var delta = desiredMod - currentMod;
    if(delta < 0) delta += 360;
    var fullTurns = 5;
    var duration = 3000 + Math.random() * 2000;
    currentRotation += fullTurns * 360 + delta;
    canvasEl.style.transition = 'transform ' + duration + 'ms cubic-bezier(0.17,0.67,0.12,0.99)';
    canvasEl.style.transform = 'rotate(' + currentRotation + 'deg)';
    setTimeout(function(){
      spinning = false;
      spinBtn.disabled = false;
      againBtn.disabled = false;
      var finalMod = ((currentRotation % 360) + 360) % 360;
      var pointerAngle = (360 - finalMod) % 360;
      var landed = Math.floor(pointerAngle / seg) % N;
      resultEl.textContent = '今天吃：' + items[landed];
      resultWrap.style.display = 'flex';
      drawWheel(landed);
    }, duration);
  }

  function renderManage(){
    manageListEl.innerHTML = '';
    items.forEach(function(it, idx){
      var row = document.createElement('div');
      row.className = 'randomfood_manage_row';
      var text = document.createElement('span');
      text.className = 'randomfood_manage_text';
      text.textContent = it;
      text.addEventListener('click', function(){
        var v = prompt('修改选项', it);
        if(v !== null && v.trim()){
          items[idx] = v.trim();
          saveData();
          renderManage();
          drawWheel(-1);
        }
      });
      var del = document.createElement('span');
      del.className = 'randomfood_manage_del';
      del.textContent = '\u00d7';
      del.addEventListener('click', function(){
        items.splice(idx, 1);
        saveData();
        renderManage();
        drawWheel(-1);
      });
      row.appendChild(text);
      row.appendChild(del);
      manageListEl.appendChild(row);
    });
  }

  function openWheel(){
    items = loadData();
    overlay.classList.add('show');
    managePanel.classList.remove('show');
    resultWrap.style.display = 'none';
    canvasEl.style.transition = 'none';
    canvasEl.style.transform = 'rotate(0deg)';
    currentRotation = 0;
    drawWheel(-1);
  }
  function closeWheel(){
    overlay.classList.remove('show');
    managePanel.classList.remove('show');
  }
  function openManage(){
    renderManage();
    managePanel.classList.add('show');
  }
  function closeManage(){
    managePanel.classList.remove('show');
    drawWheel(-1);
  }
  function addItem(){
    var v = newInput.value.trim();
    if(!v) return;
    items.push(v);
    saveData();
    newInput.value = '';
    renderManage();
    drawWheel(-1);
  }

  // 事件绑定（全部用 addEventListener，不污染全局）
  if(plusBtn) plusBtn.addEventListener('click', function(e){ e.stopPropagation(); openWheel(); });
  spinBtn.addEventListener('click', spin);
  againBtn.addEventListener('click', spin);
  manageBtn.addEventListener('click', openManage);
  manageClose.addEventListener('click', closeManage);
  closeBtn.addEventListener('click', closeWheel);
  addBtn.addEventListener('click', addItem);
  newInput.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ addItem(); } });
  // 点击遮罩空白处关闭（点弹窗内部不关）
  overlay.addEventListener('click', function(e){
    if(e.target === overlay) closeWheel();
  });
  // 管理面板内点击不冒泡到 overlay
  managePanel.addEventListener('click', function(e){ e.stopPropagation(); });
  document.getElementById('randomFoodModal').addEventListener('click', function(e){ e.stopPropagation(); });
})();
