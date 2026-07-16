'use strict';

// ============================================================
// ★★★ 循环检测仓库 — 基于 CycleRunner 基类 ★★★
// ============================================================

var CW_runner = new CycleRunner({
    tag: 'CycleWarehouse',
    urlParam: 'cw',
    stateKey: 'project_idle_cycle_warehouse_state',
    piStateKey: 'warehouseRunning',
    btnId: 'cw-float-btn',
    btnEmoji: '🏪',
    btnClass: 'pi-float-btn-warehouse',
    btnBottom: '300px',
    btnTitle: '循环检测仓库',
    execute: async function(state) {
        var U = window.SHARED_UTILS;
        var currentAcc = state.accounts[state.currentIdx];
        var result = await U.apiRequest('/api/v1/warehouse', {});
        var items = [];
        if (result && result.code === 20000 && result.data) {
            var pages = result.data.pages || [];
            pages.forEach(function(page) { if (page.items) page.items.forEach(function(item) { items.push(item); }); });
        }
        state.results[currentAcc.email] = { name: currentAcc.name, items: items.map(function(i) { return { itemId: i.itemId, qty: i.qty }; }) };
        CW_runner.saveState(state);
        await U.sleep(500);
    },
    onComplete: function(state) {
        if (window.PI_STATS) {
            window.PI_STATS.warehouse = { time: new Date().toLocaleString('zh-CN'), data: state.results };
            try { localStorage.setItem('project_idle_stats_data', JSON.stringify(window.PI_STATS)); } catch(e) {}
        }
        showCwResults(state.results);
    }
});

// 重写 nextAccount（同背包：round wrap 方式不同）
CW_runner.nextAccount = function() {
    var state = CW_runner.getState();
    if (!state || !state.active || CW_runner.abort) { CW_runner.stop(); return; }
    var nextIdx = state.currentIdx + 1;
    if (nextIdx >= state.accounts.length) {
        if (state.maxRounds > 0 && state.round >= state.maxRounds) {
            console.log('[CycleWarehouse] ✅ 全部完成，共运行 ' + state.round + ' 轮');
            if (CW_runner.onComplete) CW_runner.onComplete(state);
            CW_runner.clearState(); CW_runner.running = false;
            return;
        }
        state.round++;
        state.currentIdx = 0;
    } else {
        state.currentIdx = nextIdx;
    }
    CW_runner.saveState(state);
    var nextAcc = state.accounts[state.currentIdx];
    window.SHARED_UTILS.clearSiteAuth();
    window.location.href = 'https://idle.charsgame.com/auth?cw=1';
};

// ============================================================
// ★★★ 弹窗 ★★★
// ============================================================
function showCwDialog() {
    if (CW_runner.running) {
        if (!confirm('🏪 循环检测仓库正在运行，是否先停止？')) return;
        CW_runner.stop();
        setTimeout(function() { showCwDialog(); }, 300);
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
        groupHTML += '<label class="pi-label-row"><input type="checkbox" class="cw-group-cb" value="' + gn + '" checked style="accent-color:#81c784;"><span>' + gn + ' <span style="color:#888;font-size:11px;">(' + window.SHARED_ACCOUNTS[gn].length + ')</span></span></label>';
    });

    dlg.innerHTML = '' +
        '<div class="pi-dialog-header">' +
            '<span class="pi-dialog-title" style="color:#81c784;font-size:15px;">🏪 循环检测仓库</span>' +
            '<span id="cw-close-x" class="pi-dialog-close">✕</span>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
            '<div style="color:#aaa;font-size:12px;margin-bottom:6px;">① 选择要检测的账号分组：</div>' +
            '<div class="pi-list-box pi-list-box-sm">' + groupHTML + '</div>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
            '<label style="color:#aaa;font-size:11px;">② 循环轮数（0=无限）：</label>' +
            '<input id="cw-rounds" type="number" value="1" min="0" max="999" class="pi-input" style="margin-top:4px;">' +
        '</div>' +
        '<div class="pi-info-box">📋 流程：登录 → 查询仓库所有页面 → 记录物品数量 → 退出 → 登录下一个账号 → 循环</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
            '<button id="cw-cancel" class="pi-btn pi-btn-cancel">取消</button>' +
            '<button id="cw-history" style="display:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold;background:rgba(129,199,132,0.15);color:#81c784;border:1px solid #81c784;">📋 查看上次结果</button>' +
            '<button id="cw-start" class="pi-btn pi-btn-warehouse" style="font-size:12px;padding:6px 16px;">🏪 开始检测仓库</button>' +
        '</div>';

    overlay.appendChild(dlg);
    document.body.appendChild(overlay);

    CW_runner.showDialog = showCwDialog;

    var cwSaved = window.PI_STATS && window.PI_STATS.warehouse;
    if (cwSaved) {
        dlg.querySelector('#cw-history').style.display = 'inline-block';
        var infoBox = dlg.querySelector('.pi-info-box');
        if (infoBox) {
            infoBox.innerHTML = infoBox.innerHTML + '<br><span style="color:#81c784;">📋 上次检测: ' + cwSaved.time + ' (' + Object.keys(cwSaved.data).length + '个账号)</span>';
        }
    }
    dlg.querySelector('#cw-history').onclick = function() { overlay.remove(); setTimeout(function() { showCwResults(window.PI_STATS.warehouse.data); }, 100); };

    var close = function() { overlay.remove(); };
    dlg.querySelector('#cw-close-x').onclick = close;
    dlg.querySelector('#cw-cancel').onclick = close;
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

    dlg.querySelector('#cw-start').onclick = function() {
        var checkedCbs = dlg.querySelectorAll('.cw-group-cb:checked');
        if (checkedCbs.length === 0) { alert('⚠️ 请至少选择一个分组'); return; }
        var selectedGroups = [];
        checkedCbs.forEach(function(cb) { selectedGroups.push(cb.value); });
        var allAccs = [];
        selectedGroups.forEach(function(gn) { if (window.SHARED_ACCOUNTS[gn]) window.SHARED_ACCOUNTS[gn].forEach(function(a) { if (a && a.email) allAccs.push(a); }); });
        if (allAccs.length === 0) { alert('❌ 选中分组中没有账号'); return; }
        var rounds = parseInt(dlg.querySelector('#cw-rounds').value) || 1;
        close();

        var state = { accounts: allAccs, currentIdx: 0, maxRounds: rounds, round: 1, active: true, startTime: Date.now(), results: {} };
        CW_runner.saveState(state);

        setTimeout(function() {
            if (window.location.pathname.includes('/auth')) {
                CW_runner.setRunning(true); CW_runner.abort = false;
                CW_runner.doLogin(allAccs[0]);
            } else {
                window.SHARED_UTILS.clearSiteAuth();
                window.location.href = 'https://idle.charsgame.com/auth?cw=1';
            }
        }, 200);
    };
}

// ============================================================
// ★★★ 结果展示弹窗 ★★★
// ============================================================
function showCwResults(results) {
    var accEmails = Object.keys(results);
    if (accEmails.length === 0) { alert('📭 没有检测结果'); return; }

    var overlay = document.createElement('div');
    overlay.className = 'pi-overlay';
    var dlg = document.createElement('div');
    dlg.className = 'pi-dialog pi-dialog-650';
    dlg.style.display = 'flex';
    dlg.style.flexDirection = 'column';

    var accOptions = '';
    accEmails.forEach(function(email) { accOptions += '<option value="' + email + '">' + results[email].name + '</option>'; });

    dlg.innerHTML = '' +
        '<div class="pi-dialog-header" style="flex-shrink:0;">' +
            '<span class="pi-dialog-title" style="color:#81c784;font-size:15px;">🏪 仓库检测结果</span>' +
            '<span id="cwr-close" class="pi-dialog-close">✕</span>' +
        '</div>' +
        '<div style="margin-bottom:8px;flex-shrink:0;"><select id="cwr-acc-select" class="pi-select">' + accOptions + '</select></div>' +
        '<div id="cwr-content" style="flex:1;overflow-y:auto;background:rgba(0,0,0,0.15);border-radius:6px;padding:8px 10px;font-size:11px;font-family:monospace;line-height:1.6;"></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;flex-shrink:0;">' +
            '<button id="cwr-close2" class="pi-btn pi-btn-cancel">关闭</button>' +
            '<button id="cwr-export" class="pi-btn pi-btn-warehouse" style="font-size:12px;">📋 复制</button>' +
        '</div>';

    overlay.appendChild(dlg);
    document.body.appendChild(overlay);

    function renderCw(email) {
        var container = dlg.querySelector('#cwr-content');
        var r = results[email];
        if (!r || !r.items || r.items.length === 0) { container.innerHTML = '<div style="color:#888;">📭 该账号仓库为空</div>'; return; }
        var html = '<div style="color:#81c784;font-weight:bold;margin-bottom:6px;">👤 ' + r.name + '</div>';
        html += '<div class="pi-result-header"><span class="pi-result-col-idx">#</span><span class="pi-result-col-name">物品</span><span class="pi-result-col-qty-lg" style="color:#888;">数量</span></div>';
        r.items.sort(function(a, b) { return b.qty - a.qty; }).forEach(function(item, idx) {
            html += '<div class="pi-result-row"><span class="pi-result-col-idx">' + (idx+1) + '</span><span class="pi-result-col-name">' + (window.PI_getItemName ? window.PI_getItemName(item.itemId) : ('未知(' + item.itemId + ')')) + '</span><span class="pi-result-col-qty-lg" style="color:#81c784;">' + item.qty.toLocaleString() + '</span></div>';
        });
        container.innerHTML = html;
    }

    renderCw(accEmails[0]);
    dlg.querySelector('#cwr-acc-select').onchange = function() { renderCw(this.value); };

    var close = function() { overlay.remove(); };
    dlg.querySelector('#cwr-close').onclick = close;
    dlg.querySelector('#cwr-close2').onclick = close;
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

    dlg.querySelector('#cwr-export').onclick = function() {
        var email = dlg.querySelector('#cwr-acc-select').value;
        var r = results[email];
        if (!r || !r.items) return;
        var text = '🏪 仓库检测结果 - ' + r.name + '\n检测时间: ' + new Date().toLocaleString('zh-CN') + '\n' + '='.repeat(30) + '\n\n';
        r.items.sort(function(a, b) { return b.qty - a.qty; }).forEach(function(item) { text += (window.PI_getItemName ? window.PI_getItemName(item.itemId) : ('未知(' + item.itemId + ')')) + ': ' + item.qty.toLocaleString() + '\n'; });
        navigator.clipboard.writeText(text).then(function() {
            dlg.querySelector('#cwr-export').textContent = '✅ 已复制';
            setTimeout(function() { dlg.querySelector('#cwr-export').textContent = '📋 复制'; }, 2000);
        });
    };
}

CW_runner.showDialog = showCwDialog;
CW_runner.init();
console.log('[CycleWarehouse] 🏪 循环检测仓库模块已加载');
