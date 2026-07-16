'use strict';

// ============================================================
// ★★★ 循环检测背包 — 基于 CycleRunner 基类 ★★★
// ============================================================

var CI_runner = new CycleRunner({
    tag: 'CycleInventory',
    urlParam: 'ci',
    stateKey: 'project_idle_cycle_inventory_state',
    piStateKey: 'inventoryRunning',
    btnId: 'ci-float-btn',
    btnEmoji: '🎒',
    btnClass: 'pi-float-btn-inventory',
    btnBottom: '356px',
    btnTitle: '循环检测背包',
    execute: async function(state) {
        var U = window.SHARED_UTILS;
        var currentAcc = state.accounts[state.currentIdx];
        var result = await U.apiRequest('/api/v1/inventory', {});
        var inv = (result && result.code === 20000 && result.data) ? (result.data.inventory || []) : [];
        state.results[currentAcc.email] = { name: currentAcc.name, items: inv.map(function(i) { return { itemId: i.itemId, qty: i.qty }; }) };
        CI_runner.saveState(state);
        await U.sleep(500);
    },
    onComplete: function(state) {
        if (window.PI_STATS) {
            window.PI_STATS.inventory = { time: new Date().toLocaleString('zh-CN'), data: state.results };
            try { localStorage.setItem('project_idle_stats_data', JSON.stringify(window.PI_STATS)); } catch(e) {}
        }
        showCiResults(state.results);
    }
});

// 重写 nextAccount：背包/仓库的切号逻辑不同（round wrap 方式不同）
CI_runner.nextAccount = function() {
    var state = CI_runner.getState();
    if (!state || !state.active || CI_runner.abort) { CI_runner.stop(); return; }
    var nextIdx = state.currentIdx + 1;
    if (nextIdx >= state.accounts.length) {
        if (state.maxRounds > 0 && state.round >= state.maxRounds) {
            console.log('[CycleInventory] ✅ 全部完成，共运行 ' + state.round + ' 轮');
            if (CI_runner.onComplete) CI_runner.onComplete(state);
            CI_runner.clearState(); CI_runner.running = false;
            return;
        }
        state.round++;
        state.currentIdx = 0;
    } else {
        state.currentIdx = nextIdx;
    }
    CI_runner.saveState(state);
    var nextAcc = state.accounts[state.currentIdx];
    window.SHARED_UTILS.clearSiteAuth();
    window.location.href = 'https://idle.charsgame.com/auth?ci=1';
};

// ============================================================
// ★★★ 弹窗 ★★★
// ============================================================
function showCiDialog() {
    if (CI_runner.running) {
        if (!confirm('🎒 循环检测背包正在运行，是否先停止？')) return;
        CI_runner.stop();
        setTimeout(function() { showCiDialog(); }, 300);
        return;
    }

    var token = window.SHARED_UTILS.getAuthToken();
    if (!token) { alert('❌ 请先登录游戏'); return; }

    var gnList = Object.keys(window.SHARED_ACCOUNTS).filter(function(gn) { return window.SHARED_ACCOUNTS[gn] && window.SHARED_ACCOUNTS[gn].length > 0; });
    if (gnList.length === 0) { alert('❌ 没有可用的账号'); return; }

    var overlay = document.createElement('div');
    overlay.className = 'pi-overlay';
    var dlg = document.createElement('div');
    dlg.className = 'pi-dialog pi-dialog-md';

    var groupHTML = '';
    gnList.forEach(function(gn) {
        groupHTML += '<label class="pi-label-row"><input type="checkbox" class="ci-group-cb" value="' + gn + '" checked style="accent-color:#4fc3f7;"><span>' + gn + ' <span style="color:#888;font-size:11px;">(' + window.SHARED_ACCOUNTS[gn].length + ')</span></span></label>';
    });

    dlg.innerHTML = '' +
        '<div class="pi-dialog-header">' +
            '<span class="pi-dialog-title" style="color:#4fc3f7;font-size:15px;">🎒 循环检测背包</span>' +
            '<span id="ci-close-x" class="pi-dialog-close">✕</span>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
            '<div style="color:#aaa;font-size:12px;margin-bottom:6px;">① 选择要检测的账号分组：</div>' +
            '<div class="pi-list-box pi-list-box-sm">' + groupHTML + '</div>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
            '<label style="color:#aaa;font-size:11px;">② 循环轮数（0=无限）：</label>' +
            '<input id="ci-rounds" type="number" value="1" min="0" max="999" class="pi-input" style="margin-top:4px;">' +
        '</div>' +
        '<div class="pi-info-box">📋 流程：登录 → 查询背包 → 记录物品数量 → 退出 → 登录下一个账号 → 循环<br>完成后自动弹出汇总结果</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
            '<button id="ci-cancel" class="pi-btn pi-btn-cancel">取消</button>' +
            '<button id="ci-history" style="display:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold;background:rgba(79,195,247,0.15);color:#4fc3f7;border:1px solid #4fc3f7;">📋 查看上次结果</button>' +
            '<button id="ci-start" class="pi-btn pi-btn-inventory" style="font-size:12px;padding:6px 16px;">🎒 开始检测背包</button>' +
        '</div>';

    overlay.appendChild(dlg);
    document.body.appendChild(overlay);

    CI_runner.showDialog = showCiDialog;

    var ciSaved = window.PI_STATS && window.PI_STATS.inventory;
    if (ciSaved) {
        dlg.querySelector('#ci-history').style.display = 'inline-block';
        var infoBox = dlg.querySelector('.pi-info-box');
        if (infoBox) {
            infoBox.innerHTML = infoBox.innerHTML + '<br><span style="color:#4fc3f7;">📋 上次检测: ' + ciSaved.time + ' (' + Object.keys(ciSaved.data).length + '个账号)</span>';
        }
    }
    dlg.querySelector('#ci-history').onclick = function() { overlay.remove(); setTimeout(function() { showCiResults(window.PI_STATS.inventory.data); }, 100); };

    var close = function() { overlay.remove(); };
    dlg.querySelector('#ci-close-x').onclick = close;
    dlg.querySelector('#ci-cancel').onclick = close;
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

    dlg.querySelector('#ci-start').onclick = function() {
        var checkedCbs = dlg.querySelectorAll('.ci-group-cb:checked');
        if (checkedCbs.length === 0) { alert('⚠️ 请至少选择一个分组'); return; }
        var selectedGroups = [];
        checkedCbs.forEach(function(cb) { selectedGroups.push(cb.value); });
        var allAccs = [];
        selectedGroups.forEach(function(gn) { if (window.SHARED_ACCOUNTS[gn]) window.SHARED_ACCOUNTS[gn].forEach(function(a) { if (a && a.email) allAccs.push(a); }); });
        if (allAccs.length === 0) { alert('❌ 选中分组中没有账号'); return; }
        var rounds = parseInt(dlg.querySelector('#ci-rounds').value) || 1;
        close();

        var state = { accounts: allAccs, currentIdx: 0, maxRounds: rounds, round: 1, active: true, startTime: Date.now(), results: {} };
        CI_runner.saveState(state);

        setTimeout(function() {
            if (window.location.pathname.includes('/auth')) {
                CI_runner.setRunning(true); CI_runner.abort = false;
                CI_runner.doLogin(allAccs[0]);
            } else {
                window.SHARED_UTILS.clearSiteAuth();
                window.location.href = 'https://idle.charsgame.com/auth?ci=1';
            }
        }, 200);
    };
}

// ============================================================
// ★★★ 结果展示弹窗 ★★★
// ============================================================
function showCiResults(results) {
    var accEmails = Object.keys(results);
    if (accEmails.length === 0) { alert('📭 没有检测结果'); return; }

    var overlay = document.createElement('div');
    overlay.className = 'pi-overlay';
    var dlg = document.createElement('div');
    dlg.className = 'pi-dialog pi-dialog-700';
    dlg.style.display = 'flex';
    dlg.style.flexDirection = 'column';

    var allItemTotals = {};
    var accItemMap = {};
    accEmails.forEach(function(email) {
        var r = results[email];
        if (!r || !r.items) return;
        accItemMap[email] = {};
        r.items.forEach(function(item) {
            accItemMap[email][item.itemId] = item.qty;
            if (!allItemTotals[item.itemId]) allItemTotals[item.itemId] = { name: window.PI_getItemName ? window.PI_getItemName(item.itemId) : ('未知(' + item.itemId + ')'), totalQty: 0, accCount: 0 };
            allItemTotals[item.itemId].totalQty += item.qty;
            allItemTotals[item.itemId].accCount++;
        });
    });

    var sortedItems = Object.keys(allItemTotals).sort(function(a, b) { return allItemTotals[b].totalQty - allItemTotals[a].totalQty; });

    var accOptions = '<option value="__all__">📊 所有账号汇总</option>';
    accEmails.forEach(function(email) { accOptions += '<option value="' + email + '">' + results[email].name + '</option>'; });

    dlg.innerHTML = '' +
        '<div class="pi-dialog-header" style="flex-shrink:0;">' +
            '<span class="pi-dialog-title" style="color:#4fc3f7;font-size:15px;">🎒 背包检测结果</span>' +
            '<span id="cir-close" class="pi-dialog-close">✕</span>' +
        '</div>' +
        '<div style="margin-bottom:8px;flex-shrink:0;"><select id="cir-acc-select" class="pi-select">' + accOptions + '</select></div>' +
        '<div id="cir-content" style="flex:1;overflow-y:auto;background:rgba(0,0,0,0.15);border-radius:6px;padding:8px 10px;font-size:11px;font-family:monospace;line-height:1.6;"></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;flex-shrink:0;">' +
            '<button id="cir-close2" class="pi-btn pi-btn-cancel">关闭</button>' +
            '<button id="cir-export" class="pi-btn pi-btn-inventory" style="font-size:12px;">📋 复制</button>' +
        '</div>';

    overlay.appendChild(dlg);
    document.body.appendChild(overlay);

    function renderCi(email) {
        var container = dlg.querySelector('#cir-content');
        if (email === '__all__') {
            var html = '<div style="color:#4fc3f7;font-weight:bold;margin-bottom:6px;">📊 所有账号汇总 (' + accEmails.length + '个账号)</div>';
            html += '<div class="pi-result-header"><span class="pi-result-col-idx">#</span><span class="pi-result-col-name">物品</span><span style="width:80px;text-align:right;color:#888;">总数量</span><span class="pi-result-col-acc">账号数</span></div>';
            sortedItems.forEach(function(itemId, idx) {
                var t = allItemTotals[itemId];
                html += '<div class="pi-result-row"><span class="pi-result-col-idx">' + (idx+1) + '</span><span class="pi-result-col-name">' + t.name + '</span><span style="width:80px;text-align:right;color:#4fc3f7;">' + t.totalQty.toLocaleString() + '</span><span class="pi-result-col-acc">' + t.accCount + '</span></div>';
            });
            container.innerHTML = html;
        } else {
            var r = results[email];
            if (!r || !r.items || r.items.length === 0) { container.innerHTML = '<div style="color:#888;">📭 该账号背包为空</div>'; return; }
            var html = '<div style="color:#4fc3f7;font-weight:bold;margin-bottom:6px;">👤 ' + r.name + '</div>';
            html += '<div class="pi-result-header"><span class="pi-result-col-idx">#</span><span class="pi-result-col-name">物品</span><span class="pi-result-col-qty-lg" style="color:#888;">数量</span></div>';
            r.items.sort(function(a, b) { return b.qty - a.qty; }).forEach(function(item, idx) {
                html += '<div class="pi-result-row"><span class="pi-result-col-idx">' + (idx+1) + '</span><span class="pi-result-col-name">' + (window.PI_getItemName ? window.PI_getItemName(item.itemId) : ('未知(' + item.itemId + ')')) + '</span><span class="pi-result-col-qty-lg" style="color:#4fc3f7;">' + item.qty.toLocaleString() + '</span></div>';
            });
            container.innerHTML = html;
        }
    }

    renderCi('__all__');
    dlg.querySelector('#cir-acc-select').onchange = function() { renderCi(this.value); };

    var close = function() { overlay.remove(); };
    dlg.querySelector('#cir-close').onclick = close;
    dlg.querySelector('#cir-close2').onclick = close;
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

    dlg.querySelector('#cir-export').onclick = function() {
        var text = '🎒 背包检测结果\n检测时间: ' + new Date().toLocaleString('zh-CN') + '\n' + '='.repeat(40) + '\n\n📊 所有账号汇总\n';
        sortedItems.forEach(function(itemId, idx) { var t = allItemTotals[itemId]; text += (idx+1) + '. ' + t.name + ': ' + t.totalQty.toLocaleString() + ' (' + t.accCount + '个账号)\n'; });
        text += '\n' + '='.repeat(40) + '\n\n';
        accEmails.forEach(function(email) {
            var r = results[email];
            if (!r || !r.items) return;
            text += '👤 ' + r.name + '\n';
            r.items.sort(function(a, b) { return b.qty - a.qty; }).forEach(function(item) { text += '  ' + (window.PI_getItemName ? window.PI_getItemName(item.itemId) : ('未知(' + item.itemId + ')')) + ': ' + item.qty.toLocaleString() + '\n'; });
            text += '\n';
        });
        navigator.clipboard.writeText(text).then(function() {
            dlg.querySelector('#cir-export').textContent = '✅ 已复制';
            setTimeout(function() { dlg.querySelector('#cir-export').textContent = '📋 复制'; }, 2000);
        });
    };
}

CI_runner.showDialog = showCiDialog;
CI_runner.init();
console.log('[CycleInventory] 🎒 循环检测背包模块已加载');
