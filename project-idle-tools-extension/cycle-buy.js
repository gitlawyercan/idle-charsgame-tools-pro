'use strict';

// ============================================================
// ★★★ 循环购买 — 基于 CycleRunner 基类 ★★★
// ============================================================

var CB_runner = new CycleRunner({
    tag: 'CycleBuy',
    urlParam: 'cbuy',
    stateKey: 'project_idle_cycle_buy_state',
    piStateKey: 'buyRunning',
    btnId: 'cb-float-btn',
    btnEmoji: '💰',
    btnClass: 'pi-float-btn-buy',
    btnBottom: '188px',
    btnTitle: '循环购买',
    execute: async function(state) {
        console.log('[CycleBuy] 创建买单: ' + window.SHARED_UTILS.getItemName(state.itemId) + ' x' + state.qty + ' @ ' + state.price);
        var result = await window.SHARED_UTILS.apiRequest('/api/v1/market/orders', {
            itemId: state.itemId, side: 'buy', price: state.price, qty: state.qty,
            clientRequestId: 'market-order-buy-' + state.itemId + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8)
        });
        if (result && result.code === 20000) {
            console.log('[CycleBuy] ✅ 买单创建成功: 订单ID ' + (result.data?.orderId || '未知'));
        } else {
            console.log('[CycleBuy] ❌ 买单创建失败: ' + (result?.message || '未知错误'));
        }
        await window.SHARED_UTILS.sleep(1000);
    }
});

// ============================================================
// ★★★ 弹窗 ★★★
// ============================================================
function showCbDialog() {
    if (CB_runner.running) {
        if (!confirm('💰 循环购买正在运行，是否先停止？')) return;
        CB_runner.stop();
        setTimeout(function() { showCbDialog(); }, 300);
        return;
    }

    var token = window.SHARED_UTILS.getAuthToken();
    if (!token) { alert('❌ 请先登录游戏'); return; }

    var gnList = Object.keys(window.SHARED_ACCOUNTS).filter(function(gn) { return window.SHARED_ACCOUNTS[gn] && window.SHARED_ACCOUNTS[gn].length > 0; });
    if (gnList.length === 0) { alert('❌ 没有可用的账号'); return; }

    var overlay = document.createElement('div');
    overlay.className = 'pi-overlay';
    var dlg = document.createElement('div');
    dlg.className = 'pi-dialog pi-dialog-500';

    var groupHTML = '';
    gnList.forEach(function(gn) {
        groupHTML += '<label class="pi-label-row"><input type="checkbox" class="cb-group-cb" value="' + gn + '" checked style="accent-color:#ff9800;"><span>' + gn + ' <span style="color:#888;font-size:11px;">(' + window.SHARED_ACCOUNTS[gn].length + ')</span></span></label>';
    });

    var categories = Object.keys(window.PI_ITEMS_BY_CATEGORY || {});
    var catOpts = categories.map(function(c) { return '<option value="' + c + '">' + c + ' (' + (window.PI_ITEMS_BY_CATEGORY[c] || []).length + ')</option>'; }).join('');

    dlg.innerHTML = '' +
        '<div class="pi-dialog-header">' +
            '<span class="pi-dialog-title" style="color:#ff9800;font-size:15px;">💰 循环购买</span>' +
            '<span id="cb-close-x" class="pi-dialog-close">✕</span>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
            '<div style="color:#aaa;font-size:12px;margin-bottom:6px;">① 选择要购买的账号分组：</div>' +
            '<div class="pi-list-box pi-list-box-sm">' + groupHTML + '</div>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
            '<div style="color:#aaa;font-size:12px;margin-bottom:6px;">② 选择要购买的商品：</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">' +
                '<select id="cb-cat" class="pi-select" style="flex:1;">' + catOpts + '</select>' +
                '<input id="cb-search" class="pi-input" placeholder="🔍 搜索..." style="flex:1;min-width:80px;">' +
            '</div>' +
            '<div id="cb-items" class="pi-list-box"></div>' +
        '</div>' +
        '<div class="pi-flex-row">' +
            '<div class="pi-flex-col"><label class="pi-flex-label">购买价格</label><input id="cb-price" type="number" value="1" min="1" class="pi-input"></div>' +
            '<div class="pi-flex-col"><label class="pi-flex-label">购买数量</label><input id="cb-qty" type="number" value="100" min="1" class="pi-input"></div>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
            '<label style="color:#aaa;font-size:11px;">③ 循环轮数（0=无限）：</label>' +
            '<input id="cb-rounds" type="number" value="0" min="0" max="999" class="pi-input" style="margin-top:4px;">' +
        '</div>' +
        '<div class="pi-info-box">📋 流程：登录 → 创建买单（价格x数量）→ 退出 → 登录下一个账号 → 循环</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">' +
            '<button id="cb-cancel" class="pi-btn pi-btn-cancel">取消</button>' +
            '<button id="cb-start" class="pi-btn pi-btn-buy" style="font-size:12px;padding:6px 16px;">💰 开始循环购买</button>' +
        '</div>';

    overlay.appendChild(dlg);
    document.body.appendChild(overlay);

    CB_runner.showDialog = showCbDialog;

    function renderItems(category, search) {
        var container = dlg.querySelector('#cb-items');
        var items = category ? ((window.PI_ITEMS_BY_CATEGORY[category] || [])) : (window.PI_ITEMS || []);
        if (search) { var q = search.toLowerCase(); items = items.filter(function(i) { return i.name.toLowerCase().includes(q) || ('ID ' + i.itemId).toLowerCase().includes(q); }); }
        container.innerHTML = items.map(function(item) {
            return '<label class="pi-label-row" style="padding:3px 0;"><input type="radio" name="cb-item" class="cb-item-radio" value="' + item.itemId + '" style="accent-color:#ff9800;"><span style="font-size:11px;">ID ' + item.itemId + ': ' + item.name + (item.tier ? ' | ' + item.tier : '') + '</span></label>';
        }).join('') || '<span style="color:#555;">无匹配物品</span>';
        var firstRadio = container.querySelector('.cb-item-radio');
        if (firstRadio) firstRadio.checked = true;
    }
    renderItems(categories[0], '');

    dlg.querySelector('#cb-cat').onchange = function() { renderItems(dlg.querySelector('#cb-cat').value, dlg.querySelector('#cb-search').value); };
    dlg.querySelector('#cb-search').oninput = function() { renderItems(dlg.querySelector('#cb-cat').value, dlg.querySelector('#cb-search').value); };
    dlg.querySelector('#cb-close-x').onclick = function() { overlay.remove(); };
    dlg.querySelector('#cb-cancel').onclick = function() { overlay.remove(); };
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

    dlg.querySelector('#cb-start').onclick = function() {
        var checkedCbs = dlg.querySelectorAll('.cb-group-cb:checked');
        if (checkedCbs.length === 0) { alert('⚠️ 请至少选择一个分组'); return; }
        var selectedGroups = [];
        checkedCbs.forEach(function(cb) { selectedGroups.push(cb.value); });
        var allAccs = [];
        selectedGroups.forEach(function(gn) { if (window.SHARED_ACCOUNTS[gn]) window.SHARED_ACCOUNTS[gn].forEach(function(a) { if (a && a.email) allAccs.push(a); }); });
        if (allAccs.length === 0) { alert('❌ 选中分组中没有账号'); return; }

        var selectedRadio = dlg.querySelector('.cb-item-radio:checked');
        if (!selectedRadio) { alert('⚠️ 请选择一个商品'); return; }
        var itemId = parseInt(selectedRadio.value);
        var price = parseInt(dlg.querySelector('#cb-price').value);
        var qty = parseInt(dlg.querySelector('#cb-qty').value);
        if (!price || price < 1) { alert('⚠️ 请输入有效的购买价格（≥1）'); return; }
        if (!qty || qty < 1) { alert('⚠️ 请输入有效的购买数量（≥1）'); return; }
        var rounds = parseInt(dlg.querySelector('#cb-rounds').value) || 0;
        overlay.remove();

        var state = { accounts: allAccs, currentIdx: 0, itemId: itemId, price: price, qty: qty, maxRounds: rounds, round: 1, active: true, startTime: Date.now() };
        CB_runner.saveState(state);
        console.log('[CycleBuy] 启动: ' + allAccs.length + '个账号, 购买 ' + window.SHARED_UTILS.getItemName(itemId) + ' x' + qty + ' @ ' + price + ', 轮数' + (rounds || '无限'));

        setTimeout(function() {
            if (window.location.pathname.includes('/auth')) {
                CB_runner.setRunning(true); CB_runner.abort = false;
                CB_runner.doLogin(allAccs[0]);
            } else {
                window.SHARED_UTILS.clearSiteAuth();
                window.location.href = 'https://idle.charsgame.com/auth?cbuy=1';
            }
        }, 200);
    };
}

CB_runner.showDialog = showCbDialog;
CB_runner.init();
console.log('[CycleBuy] 💰 循环购买模块已加载');
