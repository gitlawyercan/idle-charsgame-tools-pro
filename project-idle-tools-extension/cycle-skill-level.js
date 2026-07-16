'use strict';

// ============================================================
// ★★★ 循环检测技能等级 — 基于 CycleRunner 基类 ★★★
// ============================================================

var CSL_runner = new CycleRunner({
    tag: 'CycleSkillLevel',
    urlParam: 'csl',
    stateKey: 'project_idle_cycle_skill_state',
    piStateKey: 'skillRunning',
    btnId: 'csl-float-btn',
    btnEmoji: '📊',
    btnClass: 'pi-float-btn-skill',
    btnBottom: '412px',
    btnTitle: '循环检测技能等级',
    execute: async function(state) {
        var U = window.SHARED_UTILS;
        var currentAcc = state.accounts[state.currentIdx];
        var result = await U.apiRequest('/api/v1/player/profile', {});
        var skills = [], totalLevel = 0, gold = 0;
        if (result && result.code === 20000 && result.data && result.data.player) {
            var p = result.data.player;
            skills = p.actionSkills || [];
            totalLevel = p.totalLevel || 0;
            gold = p.gold || 0;
        }
        var activeSkills = skills.filter(function(s) { return s.level > 0; }).map(function(s) {
            return { id: s.actionSkillId, name: getCslSkillName(s.actionSkillId), level: s.level, xp: s.xp, totalXp: s.totalXp, xpNext: s.xpNext };
        });
        state.results[currentAcc.email] = { name: currentAcc.name, totalLevel: totalLevel, gold: gold, skills: activeSkills };
        CSL_runner.saveState(state);
        await U.sleep(500);
    },
    onComplete: function(state) {
        if (window.PI_STATS) {
            window.PI_STATS.skill = { time: new Date().toLocaleString('zh-CN'), data: state.results };
            try { localStorage.setItem('project_idle_stats_data', JSON.stringify(window.PI_STATS)); } catch(e) {}
        }
        showCslResults(state.results);
    }
});

// 重写 nextAccount（同背包/仓库）
CSL_runner.nextAccount = function() {
    var state = CSL_runner.getState();
    if (!state || !state.active || CSL_runner.abort) { CSL_runner.stop(); return; }
    var nextIdx = state.currentIdx + 1;
    if (nextIdx >= state.accounts.length) {
        if (state.maxRounds > 0 && state.round >= state.maxRounds) {
            console.log('[CycleSkillLevel] ✅ 全部完成，共运行 ' + state.round + ' 轮');
            if (CSL_runner.onComplete) CSL_runner.onComplete(state);
            CSL_runner.clearState(); CSL_runner.running = false;
            return;
        }
        state.round++;
        state.currentIdx = 0;
    } else {
        state.currentIdx = nextIdx;
    }
    CSL_runner.saveState(state);
    var nextAcc = state.accounts[state.currentIdx];
    window.SHARED_UTILS.clearSiteAuth();
    window.location.href = 'https://idle.charsgame.com/auth?csl=1';
};

// ============================================================
// ★★★ 技能 ID → 名称映射 ★★★
// ============================================================
var CSL_SKILL_NAMES = {
    1: '伐木', 2: '采矿', 3: '未知(3)', 4: '狩猎', 5: '种植',
    6: '烹饪', 7: '锻造', 8: '炼金', 9: '强化', 10: '裁缝',
    11: '未知(11)', 12: '铭文', 13: '强壮', 14: '近战', 15: '远程',
    16: '法术', 17: '长剑', 18: '剑盾', 19: '长矛', 20: '弓箭',
    21: '火焰', 22: '冰霜', 23: '闪电', 24: '神圣',
    25: '布甲', 26: '皮甲', 27: '重甲'
};

function getCslSkillName(id) { return CSL_SKILL_NAMES[id] || '未知(' + id + ')'; }

// ============================================================
// ★★★ 弹窗 ★★★
// ============================================================
function showCslDialog() {
    if (CSL_runner.running) {
        if (!confirm('📊 循环检测技能等级正在运行，是否先停止？')) return;
        CSL_runner.stop();
        setTimeout(function() { showCslDialog(); }, 300);
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
        groupHTML += '<label class="pi-label-row"><input type="checkbox" class="csl-group-cb" value="' + gn + '" checked style="accent-color:#ce93d8;"><span>' + gn + ' <span style="color:#888;font-size:11px;">(' + window.SHARED_ACCOUNTS[gn].length + ')</span></span></label>';
    });

    dlg.innerHTML = '' +
        '<div class="pi-dialog-header">' +
            '<span class="pi-dialog-title" style="color:#ce93d8;">📊 循环检测技能等级</span>' +
            '<span id="csl-close-x" class="pi-dialog-close">✕</span>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
            '<div style="color:#aaa;font-size:12px;margin-bottom:6px;">① 选择要检测的账号分组：</div>' +
            '<div class="pi-list-box pi-list-box-sm">' + groupHTML + '</div>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
            '<label style="color:#aaa;font-size:11px;">② 循环轮数（0=无限）：</label>' +
            '<input id="csl-rounds" type="number" value="1" min="0" max="999" class="pi-input" style="margin-top:4px;">' +
        '</div>' +
        '<div class="pi-info-box">📋 流程：登录 → 查询技能等级 → 记录 → 退出 → 下一个账号 → 循环<br>包含：全部技能等级 + totalLevel + gold</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">' +
            '<button id="csl-cancel" class="pi-btn pi-btn-cancel">取消</button>' +
            '<button id="csl-history" style="display:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold;background:rgba(206,147,216,0.15);color:#ce93d8;border:1px solid #ce93d8;">📋 查看上次结果</button>' +
            '<button id="csl-start" class="pi-btn" style="background:rgba(206,147,216,0.15);color:#ce93d8;border-color:#ce93d8;">📊 开始检测</button>' +
        '</div>';

    overlay.appendChild(dlg);
    document.body.appendChild(overlay);

    CSL_runner.showDialog = showCslDialog;

    var cslSaved = window.PI_STATS && window.PI_STATS.skill;
    if (cslSaved) {
        dlg.querySelector('#csl-history').style.display = 'inline-block';
        var infoBox = dlg.querySelector('.pi-info-box');
        if (infoBox) {
            infoBox.innerHTML = infoBox.innerHTML + '<br><span style="color:#ce93d8;">📋 上次检测: ' + cslSaved.time + ' (' + Object.keys(cslSaved.data).length + '个账号)</span>';
        }
    }
    dlg.querySelector('#csl-history').onclick = function() { overlay.remove(); setTimeout(function() { showCslResults(window.PI_STATS.skill.data); }, 100); };

    var close = function() { overlay.remove(); };
    dlg.querySelector('#csl-close-x').onclick = close;
    dlg.querySelector('#csl-cancel').onclick = close;
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

    dlg.querySelector('#csl-start').onclick = function() {
        var checkedCbs = dlg.querySelectorAll('.csl-group-cb:checked');
        if (checkedCbs.length === 0) { alert('⚠️ 请至少选择一个分组'); return; }
        var selectedGroups = [];
        checkedCbs.forEach(function(cb) { selectedGroups.push(cb.value); });
        var allAccs = [];
        selectedGroups.forEach(function(gn) { if (window.SHARED_ACCOUNTS[gn]) window.SHARED_ACCOUNTS[gn].forEach(function(a) { if (a && a.email) allAccs.push(a); }); });
        if (allAccs.length === 0) { alert('❌ 选中分组中没有账号'); return; }
        var rounds = parseInt(dlg.querySelector('#csl-rounds').value) || 1;
        close();

        var state = { accounts: allAccs, currentIdx: 0, maxRounds: rounds, round: 1, active: true, startTime: Date.now(), results: {} };
        CSL_runner.saveState(state);

        setTimeout(function() {
            if (window.location.pathname.includes('/auth')) {
                CSL_runner.setRunning(true); CSL_runner.abort = false;
                CSL_runner.doLogin(allAccs[0]);
            } else {
                window.SHARED_UTILS.clearSiteAuth();
                window.location.href = 'https://idle.charsgame.com/auth?csl=1';
            }
        }, 200);
    };
}

// ============================================================
// ★★★ 结果展示弹窗 ★★★
// ============================================================
function showCslResults(results) {
    var accEmails = Object.keys(results);
    if (accEmails.length === 0) { alert('📭 没有检测结果'); return; }

    var overlay = document.createElement('div');
    overlay.className = 'pi-overlay';
    var dlg = document.createElement('div');
    dlg.className = 'pi-dialog pi-dialog-650';
    dlg.style.display = 'flex';
    dlg.style.flexDirection = 'column';

    var accOptions = '<option value="__all__">📊 所有账号汇总</option>';
    accEmails.forEach(function(email) { accOptions += '<option value="' + email + '">' + results[email].name + '</option>'; });

    dlg.innerHTML = '' +
        '<div class="pi-dialog-header" style="flex-shrink:0;">' +
            '<span class="pi-dialog-title" style="color:#ce93d8;font-size:15px;">📊 技能等级检测结果</span>' +
            '<span id="cslr-close" class="pi-dialog-close">✕</span>' +
        '</div>' +
        '<div style="margin-bottom:8px;flex-shrink:0;"><select id="cslr-acc-select" class="pi-select">' + accOptions + '</select></div>' +
        '<div id="cslr-content" style="flex:1;overflow-y:auto;background:rgba(0,0,0,0.15);border-radius:6px;padding:8px 10px;font-size:11px;font-family:monospace;line-height:1.6;"></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;flex-shrink:0;">' +
            '<button id="cslr-close2" class="pi-btn pi-btn-cancel">关闭</button>' +
            '<button id="cslr-export" class="pi-btn" style="background:rgba(206,147,216,0.15);color:#ce93d8;border-color:rgba(206,147,216,0.25);font-size:12px;">📋 复制</button>' +
        '</div>';

    overlay.appendChild(dlg);
    document.body.appendChild(overlay);

    function renderCsl(email) {
        var container = dlg.querySelector('#cslr-content');
        if (email === '__all__') {
            var sortedEmails = accEmails.slice().sort(function(a, b) { return results[b].totalLevel - results[a].totalLevel; });
            var html = '<div style="color:#ce93d8;font-weight:bold;margin-bottom:6px;">📊 所有账号汇总 (' + accEmails.length + '个)</div>';
            html += '<div class="pi-result-header"><span class="pi-result-col-idx">#</span><span class="pi-result-col-name">账号</span><span style="width:60px;text-align:right;color:#888;">总等级</span><span style="width:80px;text-align:right;color:#888;">金币</span></div>';
            sortedEmails.forEach(function(email, idx) {
                var r = results[email];
                html += '<div class="pi-result-row"><span class="pi-result-col-idx">' + (idx+1) + '</span><span class="pi-result-col-name">' + r.name + '</span><span style="width:60px;text-align:right;color:#ce93d8;">' + r.totalLevel + '</span><span style="width:80px;text-align:right;color:#f0a500;">' + (r.gold || 0).toLocaleString() + '</span></div>';
            });
            container.innerHTML = html;
        } else {
            var r = results[email];
            if (!r || !r.skills || r.skills.length === 0) { container.innerHTML = '<div style="color:#888;">📭 该账号没有技能数据</div>'; return; }
            var html = '<div style="color:#ce93d8;font-weight:bold;margin-bottom:4px;">👤 ' + r.name + '</div>';
            html += '<div style="color:#888;margin-bottom:6px;font-size:10px;">总等级: <span style="color:#ce93d8;font-weight:bold;">' + r.totalLevel + '</span> | 金币: <span style="color:#f0a500;">' + (r.gold || 0).toLocaleString() + '</span></div>';
            html += '<div class="pi-result-header"><span class="pi-result-col-idx">#</span><span class="pi-result-col-name">技能</span><span style="width:50px;text-align:right;color:#888;">等级</span><span style="width:60px;text-align:right;color:#888;">当前经验</span><span style="width:60px;text-align:right;color:#888;">下一级</span><span style="width:40px;text-align:right;color:#888;">进度</span></div>';
            r.skills.sort(function(a, b) { return b.level - a.level; }).forEach(function(s, idx) {
                var pct = s.xpNext > 0 ? Math.round((s.xp / s.xpNext) * 100) : 0;
                html += '<div class="pi-result-row"><span class="pi-result-col-idx">' + (idx+1) + '</span><span class="pi-result-col-name">' + s.name + '</span><span style="width:50px;text-align:right;color:#ce93d8;">' + s.level + '</span><span style="width:60px;text-align:right;color:#888;">' + s.xp.toLocaleString() + '</span><span style="width:60px;text-align:right;color:#888;">' + s.xpNext.toLocaleString() + '</span><span style="width:40px;text-align:right;color:#6dd66d;">' + pct + '%</span></div>';
            });
            container.innerHTML = html;
        }
    }

    renderCsl('__all__');
    dlg.querySelector('#cslr-acc-select').onchange = function() { renderCsl(this.value); };

    var close = function() { overlay.remove(); };
    dlg.querySelector('#cslr-close').onclick = close;
    dlg.querySelector('#cslr-close2').onclick = close;
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

    dlg.querySelector('#cslr-export').onclick = function() {
        var text = '📊 技能等级检测结果\n检测时间: ' + new Date().toLocaleString('zh-CN') + '\n' + '='.repeat(40) + '\n\n';
        var sortedEmails = accEmails.slice().sort(function(a, b) { return results[b].totalLevel - results[a].totalLevel; });
        sortedEmails.forEach(function(email) {
            var r = results[email];
            text += '👤 ' + r.name + ' | 总等级: ' + r.totalLevel + ' | 金币: ' + (r.gold || 0).toLocaleString() + '\n';
            r.skills.sort(function(a, b) { return b.level - a.level; }).forEach(function(s) {
                var pct = s.xpNext > 0 ? Math.round((s.xp / s.xpNext) * 100) : 0;
                text += '  ' + s.name + ': Lv.' + s.level + ' (' + s.xp.toLocaleString() + '/' + s.xpNext.toLocaleString() + ' ' + pct + '%)\n';
            });
            text += '\n';
        });
        navigator.clipboard.writeText(text).then(function() {
            dlg.querySelector('#cslr-export').textContent = '✅ 已复制';
            setTimeout(function() { dlg.querySelector('#cslr-export').textContent = '📋 复制'; }, 2000);
        });
    };
}

CSL_runner.showDialog = showCslDialog;
CSL_runner.init();
console.log('[CycleSkillLevel] 📊 循环检测技能等级模块已加载');
