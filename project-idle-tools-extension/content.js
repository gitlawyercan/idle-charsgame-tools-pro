'use strict';

// ============================================================
// ★★★ 账号列表（内置分组 — 请在 accounts-config.js 中添加）★★★
// ============================================================
const BUILTIN_ACCOUNT_GROUPS = {};

const DEFAULT_EXPANDED_GROUPS = ['默认分组'];
const ENABLE_REMEMBER_LAST = true;

// ============================================================
// ★★★ 完整物品数据（使用统一数据库 items-database.js）★★★
// ============================================================
const ALL_ITEMS = window.PI_ITEMS || [];
const ITEMS_BY_CATEGORY = window.PI_ITEMS_BY_CATEGORY || {};
// getItemName / getItemDisplay 统一使用 PI 版本

const SKILL_RESOURCES = {
    1: { name: '砍伐', pageUrl: '/game/woodcutting', resources: [
        { actionId: 1, itemId: 1, name: '松木', tier: 'T1' },
        { actionId: 2, itemId: 2, name: '橡木', tier: 'T2' },
        { actionId: 3, itemId: 3, name: '月桂木', tier: 'T3' },
        { actionId: 4, itemId: 4, name: '符纹木', tier: 'T4' },
        { actionId: 101, itemId: 101, name: '松林莓', tier: '副' },
        { actionId: 102, itemId: 102, name: '橡蜜果', tier: '副' },
        { actionId: 103, itemId: 103, name: '月桂银果', tier: '副' },
        { actionId: 104, itemId: 104, name: '符纹星果', tier: '副' },
    ]},
    2: { name: '采矿', pageUrl: '/game/mining', resources: [
        { actionId: 5, itemId: 5, name: '铜矿', tier: 'T1' },
        { actionId: 6, itemId: 6, name: '铁矿', tier: 'T2' },
        { actionId: 7, itemId: 7, name: '银矿', tier: 'T3' },
        { actionId: 8, itemId: 8, name: '秘银矿', tier: 'T4' },
    ]},
    4: { name: '打猎', pageUrl: '/game/hunting', resources: [
        { actionId: 9, itemId: 9, name: '轻皮', tier: 'T1' },
        { actionId: 10, itemId: 10, name: '厚皮', tier: 'T2' },
        { actionId: 11, itemId: 11, name: '月纹皮', tier: 'T3' },
        { actionId: 12, itemId: 12, name: '雪纹皮', tier: 'T4' },
    ]},
    5: { name: '种植', pageUrl: '/game/farming', resources: [
        { actionId: 13, itemId: 13, name: '亚麻', tier: 'T1-纤维' },
        { actionId: 15, itemId: 15, name: '棉花', tier: 'T2-纤维' },
        { actionId: 17, itemId: 17, name: '月麻', tier: 'T3-纤维' },
        { actionId: 19, itemId: 19, name: '符藤', tier: 'T4-纤维' },
        { actionId: 14, itemId: 14, name: '麦穗', tier: 'T1-粮食' },
        { actionId: 16, itemId: 16, name: '蜜糖麦', tier: 'T2-粮食' },
        { actionId: 18, itemId: 18, name: '月露果', tier: 'T3-粮食' },
        { actionId: 20, itemId: 20, name: '香米', tier: 'T4-粮食' },
    ]},
};

function getSkillIdFromUrl() {
    const path = window.location.pathname;
    for (const [skillId, skill] of Object.entries(SKILL_RESOURCES)) {
        if (path.includes(skill.pageUrl)) return parseInt(skillId);
    }
    return null;
}

function getItemName(itemId) {
    return window.PI_getItemName ? window.PI_getItemName(itemId) : '未知(' + itemId + ')';
}

function getItemDisplay(itemId) {
    return window.PI_getItemDisplay ? window.PI_getItemDisplay(itemId) : '未知(' + itemId + ')';
}

// ============================================================
// ★★★ 常量 ★★★
// ============================================================
const SK = {
    LAST_ACCOUNT: 'project_idle_last_account',
    PANEL_COLLAPSED: 'project_idle_panel_collapsed',
    PANEL_LEFT: 'project_idle_panel_left',
    PANEL_TOP: 'project_idle_panel_top',
    CUSTOM_ACCOUNTS: 'project_idle_custom_accounts',
    DELETED_ACCOUNTS: 'project_idle_deleted_accounts',
    DELETED_GROUPS: 'project_idle_deleted_groups',
    GROUP_RENAMES: 'project_idle_group_renames',
    ACCOUNT_RENAMES: 'project_idle_account_renames',
    LOGS: 'project_idle_logs',
    // ★ 四个独立功能的状态key ★
    CYCLE_SWITCH_STATE: 'project_idle_cycle_switch_state',
    CYCLE_COLLECT_STATE: 'project_idle_cycle_collect_state',
    CYCLE_SELL_STATE: 'project_idle_cycle_sell_state',
    CYCLE_CLAIM_STATE: 'project_idle_cycle_claim_state',
};

function isInventoryPage() { return window.location.pathname.includes('/game/inventory'); }
function isAuthPage() { return window.location.pathname.includes('/auth'); }
function isGamePage() { return window.location.pathname.startsWith('/game') && !isAuthPage(); }

function getAuthToken() {
    try { const d = JSON.parse(localStorage.getItem('project-idle-auth')); if (d?.state?.token) return d.state.token; } catch(e) {}
    return null;
}

function getLogs() { return storageGet(SK.LOGS, []); }
function saveLogs(d) { storageSet(SK.LOGS, d); }
function clearLogs() { localStorage.removeItem(SK.LOGS); }

function addLog(level, message, data) {
    try {
        const logs = getLogs();
        logs.push({
            timestamp: Date.now(),
            timeStr: new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'}),
            level: level,
            message: message,
            data: data ? (typeof data === 'object' ? JSON.stringify(data).slice(0,200) : String(data).slice(0,200)) : null
        });
        if (logs.length > 500) logs.splice(0, logs.length - 500);
        saveLogs(logs);
        if (level === 'ERROR') console.error(`[ProjectIdle][${level}]`, message, data);
        else console.log(`[ProjectIdle][${level}]`, message);
    } catch(e) { console.error('[ProjectIdle][LOG_ERROR]', e); }
}
function addInfoLog(msg, d) { addLog('INFO', msg, d); }
function addWarnLog(msg, d) { addLog('WARN', msg, d); }
function addErrorLog(msg, d) { addLog('ERROR', msg, d); }

function storageGet(key, fallback) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; } }
function storageSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

// ============================================================
// ★★★ 工具函数 ★★★
// ============================================================
function downloadFile(c,f,m) { const b=new Blob([c],{type:m}),u=URL.createObjectURL(b),a=document.createElement('a'); a.href=u;a.download=f;a.click();URL.revokeObjectURL(u); }
function dateStr() { return new Date().toISOString().slice(0,10); }
function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }

// ============================================================
// ★★★ 账号分组管理 ★★★
// ============================================================
function loadCustomAccounts() { return storageGet(SK.CUSTOM_ACCOUNTS, {}); }
function saveCustomAccounts(g) { storageSet(SK.CUSTOM_ACCOUNTS, g); }
function addCustomAccount(gn, acc) {
    const c=loadCustomAccounts(); if(!c[gn])c[gn]=[];
    if(c[gn].some(a=>a.email===acc.email)) return false;
    c[gn].push(acc); saveCustomAccounts(c); return true;
}
function deleteCustomAccount(gn, email) {
    const c=loadCustomAccounts(); if(c[gn]){c[gn]=c[gn].filter(a=>a.email!==email); if(!c[gn].length)delete c[gn]; saveCustomAccounts(c); return true;} return false;
}
function deleteCustomGroup(gn) { const c=loadCustomAccounts(); if(c[gn]){delete c[gn]; saveCustomAccounts(c); return true;} return false; }

function getGroupRenames() { return storageGet(SK.GROUP_RENAMES, {}); }
function saveGroupRenames(d) { storageSet(SK.GROUP_RENAMES, d); }
function getDisplayGroupName(on) { const r=getGroupRenames(); return r[on]||on; }
function setGroupRename(on, nn) { if(!on||!nn||on===nn) return false; const r=getGroupRenames(); r[on]=nn; saveGroupRenames(r); return true; }
function getAccountRenames() { return storageGet(SK.ACCOUNT_RENAMES, {}); }
function saveAccountRenames(d) { storageSet(SK.ACCOUNT_RENAMES, d); }
function getDisplayAccountName(email, def) { if(!email) return def||'未知'; const r=getAccountRenames(); return r[email]||def||'未知'; }
function setAccountRename(email, nn) { if(!email||!nn) return false; const r=getAccountRenames(); r[email]=nn; saveAccountRenames(r); return true; }

function getDeletedAccounts() { return storageGet(SK.DELETED_ACCOUNTS, {}); }
function saveDeletedAccounts(d) { storageSet(SK.DELETED_ACCOUNTS, d); }
function isAccountDeleted(gn, email) { if(!email) return true; const d=getDeletedAccounts(); return d[gn]&&d[gn].includes(email); }
function markAccountDeleted(gn, email) { if(!email) return; const d=getDeletedAccounts(); if(!d[gn])d[gn]=[]; if(!d[gn].includes(email))d[gn].push(email); saveDeletedAccounts(d); }
function getDeletedGroups() { return storageGet(SK.DELETED_GROUPS, []); }
function saveDeletedGroups(d) { storageSet(SK.DELETED_GROUPS, d); }
function isGroupDeleted(gn) { return getDeletedGroups().includes(gn); }
function markGroupDeleted(gn) { const d=getDeletedGroups(); if(!d.includes(gn))d.push(gn); saveDeletedGroups(d); }

function moveAccountToGroup(sg, email, tg) {
    if(sg===tg||!email) return false; const c=loadCustomAccounts(); let acc=null;
    if(c[sg]){const idx=c[sg].findIndex(a=>a.email===email); if(idx!==-1){[acc]=c[sg].splice(idx,1); if(!c[sg].length)delete c[sg];}}
    if(!acc&&BUILTIN_ACCOUNT_GROUPS[sg]){const ba=BUILTIN_ACCOUNT_GROUPS[sg].find(a=>a.email===email); if(ba)acc={...ba};}
    if(!acc) return false;
    const d=getDeletedAccounts(); if(d[sg]){d[sg]=d[sg].filter(e=>e!==email); if(!d[sg].length)delete d[sg]; saveDeletedAccounts(d);}
    if(!c[tg])c[tg]=[]; if(c[tg].some(a=>a.email===email)){if(!c[sg])c[sg]=[]; c[sg].push(acc); saveCustomAccounts(c); return false;}
    c[tg].push(acc); saveCustomAccounts(c); return true;
}

function getAllAccountGroups() {
    const m={}; Object.keys(BUILTIN_ACCOUNT_GROUPS).forEach(k=>{if(!isGroupDeleted(k))m[k]=[...(BUILTIN_ACCOUNT_GROUPS[k]||[])].filter(a=>a&&a.email&&!isAccountDeleted(k,a.email))});
    const c=loadCustomAccounts(); Object.keys(c).forEach(k=>{if(isGroupDeleted(k))return; if(m[k]){const es=new Set(m[k].map(a=>a.email));c[k].forEach(a=>{if(a&&a.email&&!es.has(a.email)){m[k].push(a);es.add(a.email)}})}else m[k]=[...c[k]]}); return m;
}
function isCustomAccount(gn, email) { const c=loadCustomAccounts(); return c[gn]&&c[gn].some(a=>a.email===email); }
function isPureCustomGroup(gn) { return !(BUILTIN_ACCOUNT_GROUPS[gn]&&BUILTIN_ACCOUNT_GROUPS[gn].length>0); }

function saveLastAccount(a) { try{localStorage.setItem(SK.LAST_ACCOUNT,JSON.stringify({name:a.name,email:a.email}))}catch(e){} }
function loadLastAccount() { try{const r=localStorage.getItem(SK.LAST_ACCOUNT); if(r){const p=JSON.parse(r); if(p&&p.email)return p}}catch(e){} return null; }
function clearLastAccount() { localStorage.removeItem(SK.LAST_ACCOUNT); }
function getPanelCollapsed() { return localStorage.getItem(SK.PANEL_COLLAPSED)==='true'; }
function setPanelCollapsed(v) { localStorage.setItem(SK.PANEL_COLLAPSED,v?'true':'false'); }
function getPanelPosition() { return {left:localStorage.getItem(SK.PANEL_LEFT)||'10px',top:localStorage.getItem(SK.PANEL_TOP)||'10px'}; }
function setPanelPosition(l,t) { localStorage.setItem(SK.PANEL_LEFT,l); localStorage.setItem(SK.PANEL_TOP,t); }

let isCollapsed=getPanelCollapsed(), lastUsedAccount=loadLastAccount(), panelRef=null, titleSpanRef=null, contentRef=null;

// ============================================================
// ★★★ 自动填表登录 ★★★
// ============================================================
async function fillInput(inp, val) {
    if(!inp)return; inp.focus();inp.click();
    const ns=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value')?.set; if(ns)ns.call(inp,val); else inp.value=val;
    inp.dispatchEvent(new Event('input',{bubbles:true})); inp.dispatchEvent(new Event('change',{bubbles:true})); inp.blur();inp.focus();
}
function findInputs() {
    const es=['input[type="email"]','input[name="email"]','input[placeholder*="邮箱" i]','input[placeholder*="email" i]','input[placeholder*="账号" i]','input[placeholder*="username" i]','input[name="username"]','input[autocomplete="username"]','input:not([type="hidden"]):not([type="password"])'];
    const ps=['input[type="password"]','input[name="password"]','input[placeholder*="密码" i]','input[placeholder*="password" i]','input[autocomplete="current-password"]'];
    let ei=null,pi=null,form=document.querySelector('form');
    if(form){for(const s of es){ei=form.querySelector(s);if(ei&&ei.type!=='password')break}for(const s of ps){pi=form.querySelector(s);if(pi)break}}
    if(!ei){for(const s of es){ei=document.querySelector(s);if(ei&&ei.type!=='password')break}}
    if(!pi){for(const s of ps){pi=document.querySelector(s);if(pi)break}}
    return{emailInput:ei,passInput:pi,form};
}
async function submitLogin() {
    const bs=['button[type="submit"]','button[class*="login" i]','button[class*="submit" i]','button[class*="signin" i]','button:has(svg)','button:last-of-type','input[type="submit"]','input[type="button"][value*="登录" i]','input[type="button"][value*="log" i]','[role="button"]'];
    for(const s of bs){const b=document.querySelector(s);if(b){if(b.disabled){b.disabled=false;b.classList.remove('ant-btn-disabled','Mui-disabled')}b.click();return true}}
    const{form}=findInputs(); if(form){form.dispatchEvent(new Event('submit',{bubbles:true})); return true} return false;
}
function findAndClickLogoutButton(fo) {
    const all=document.querySelectorAll('a,button,span,div,li');
    for(const el of all){const t=(el.textContent||'').trim().toLowerCase(); if(t==='退出'||t==='退出登录'||t==='注销'||t==='logout'||t==='sign out'||t==='log out'||t==='登出'||t.includes('退出登录')||t.includes('注销')){const s=window.getComputedStyle(el); if(s.display!=='none'&&s.visibility!=='hidden'){if(!fo)el.click();return true}}}
    return false;
}
function clearSiteAuth() {
    document.cookie.split(';').forEach(c=>{const e=c.indexOf('='),n=e>-1?c.substr(0,e).trim():c.trim(); if(n){document.cookie=n+'=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';document.cookie=n+'=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.'+location.hostname;document.cookie=n+'=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain='+location.hostname}});
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i); if(k&&(k.toLowerCase().includes('token')||k.toLowerCase().includes('auth')||k.toLowerCase().includes('session')||k.toLowerCase().includes('login')||k.toLowerCase().includes('user')||k.toLowerCase().includes('charsgame')))localStorage.removeItem(k)}
    clearLastAccount();
}
async function logout() {
    if(typeof stopCycleSwitch==='function'){stopCycleSwitch();addInfoLog('🔄 循环切号已停止')}
    if(typeof stopCycleCollect==='function'){stopCycleCollect();addInfoLog('⛏️ 循环采集已停止')}
    if(typeof stopCycleSell==='function'){stopCycleSell();addInfoLog('💰 循环出售已停止')}
    if(typeof stopCycleClaim==='function'){stopCycleClaim();addInfoLog('📦 循环领取已停止')}
    updateStatus('🚪 退出中...'); findAndClickLogoutButton(); clearSiteAuth(); lastUsedAccount=null; refreshPanelHighlight(); updateStatus('✅ 已退出'); await sleep(300); window.location.href='https://idle.charsgame.com/auth';
}
async function switchAccount(acc) {
    updateStatus(`🔄 切换到 ${acc.name}...`);
    if(findAndClickLogoutButton(true)){clearSiteAuth(); saveLastAccount(acc); lastUsedAccount={name:acc.name,email:acc.email}; refreshPanelHighlight(); const{emailInput,passInput}=findInputs(); if(!emailInput||!passInput){updateStatus('📄 跳转到登录页...');window.location.href='https://idle.charsgame.com/auth?switch='+encodeURIComponent(acc.email);return} await fillInput(emailInput,acc.email);await sleep(100);await fillInput(passInput,acc.password);await sleep(200);updateStatus(`✅ 已填入 ${acc.name}，正在登录...`);await sleep(200);await submitLogin();}
    else{const{emailInput,passInput}=findInputs(); if(!emailInput||!passInput){alert('❌ 未找到登录表单');updateStatus('❌ 未找到表单');return} await fillInput(emailInput,acc.email);await sleep(100);await fillInput(passInput,acc.password);await sleep(150); if(ENABLE_REMEMBER_LAST){saveLastAccount(acc);lastUsedAccount={name:acc.name,email:acc.email};refreshPanelHighlight()} updateStatus(`✅ 正在登录 ${acc.name}...`);await sleep(300);await submitLogin()}
}
function checkSwitchParam() {
    const p=new URLSearchParams(window.location.search), se=p.get('switch');
    if(se){const ag=getAllAccountGroups(); for(const g of Object.values(ag)){for(const a of g){if(a.email===se){setTimeout(async()=>{await sleep(500);const{emailInput,passInput}=findInputs(); if(emailInput&&passInput){await fillInput(emailInput,a.email);await sleep(100);await fillInput(passInput,a.password);await sleep(200);await submitLogin()}},1000);return true}}} return false}
}

// ============================================================
// ★★★ Token 提取弹窗 ★★★
// ============================================================
function showTokenDialog() {
    const token = getAuthToken();
    const la = loadLastAccount();
    const accountName = la ? getDisplayAccountName(la.email, la.name) : '未登录';
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:100010;display:flex;align-items:center;justify-content:center;';
    const maskedToken = token ? token.slice(0, 20) + '...' + token.slice(-10) : '未找到 Token';
    const fullToken = token || '未找到 Token';
    overlay.innerHTML = `<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:1px solid rgba(255,255,255,0.12);border-radius:14px;width:520px;max-width:90vw;box-shadow:0 16px 48px rgba(0,0,0,0.6);color:#eee;font-family:'Segoe UI',Arial,sans-serif;font-size:13px;overflow:hidden;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(0,0,0,0.3);border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="font-weight:bold;color:#00c8c8;font-size:15px;">🔑 API Token</span>
            <span id="token-close" style="cursor:pointer;color:#888;font-size:18px;padding:2px 4px;">✕</span>
        </div>
        <div style="padding:16px;">
            <div style="margin-bottom:12px;"><span style="color:#aaa;font-size:12px;">当前账号：</span><span style="color:#f0a500;font-weight:bold;">${accountName}</span>${la ? `<span style="color:#888;font-size:11px;margin-left:8px;">(${la.email})</span>` : ''}</div>
            <div style="margin-bottom:8px;"><span style="color:#aaa;font-size:12px;">Token：</span></div>
            <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px;font-family:monospace;font-size:11px;word-break:break-all;color:#6dd66d;max-height:120px;overflow-y:auto;margin-bottom:12px;" id="token-display">${maskedToken}</div>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button id="token-toggle" style="padding:7px 14px;border-radius:6px;cursor:pointer;font-size:11px;background:rgba(100,150,255,0.1);color:#6d9fff;border:1px solid rgba(100,150,255,0.25);font-weight:bold;">👁 显示完整</button>
                <button id="token-copy" style="padding:7px 14px;border-radius:6px;cursor:pointer;font-size:11px;background:rgba(100,200,100,0.1);color:#6dd66d;border:1px solid rgba(100,200,100,0.25);font-weight:bold;">📋 复制</button>
            </div>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    let visible = false;
    const displayEl = overlay.querySelector('#token-display');
    overlay.querySelector('#token-toggle').onclick = () => { visible = !visible; displayEl.textContent = visible ? fullToken : maskedToken; overlay.querySelector('#token-toggle').textContent = visible ? '🙈 隐藏' : '👁 显示完整'; };
    overlay.querySelector('#token-copy').onclick = async () => {
        try { await navigator.clipboard.writeText(fullToken); overlay.querySelector('#token-copy').textContent = '✅ 已复制！'; overlay.querySelector('#token-copy').style.color = '#6dd66d'; addInfoLog('Token 已复制到剪贴板'); setTimeout(() => { overlay.querySelector('#token-copy').textContent = '📋 复制'; }, 2000); } catch(e) { alert('复制失败，请手动选中复制'); addErrorLog('复制Token失败', e.message); }
    };
    overlay.querySelector('#token-close').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ============================================================
// ★★★ 日志查看弹窗 ★★★
// ============================================================
function showLogsDialog() {
    const logs = getLogs();
    if (!logs.length) { alert('📭 暂无日志'); return; }
    const overlay = document.createElement('div'); overlay.id = 'logs-panel';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:100009;display:flex;align-items:center;justify-content:center;';
    const reversed = [...logs].reverse();
    overlay.innerHTML = `<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:1px solid rgba(255,255,255,0.12);border-radius:14px;width:700px;max-width:95vw;max-height:85vh;box-shadow:0 16px 48px rgba(0,0,0,0.6);color:#eee;font-family:'Segoe UI',Arial,sans-serif;font-size:12px;display:flex;flex-direction:column;overflow:hidden;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(0,0,0,0.3);border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;"><span style="font-weight:bold;color:#f0a500;font-size:15px;">📋 运行日志 <span style="font-size:11px;color:#888;font-weight:normal;">${logs.length} 条</span></span><div style="display:flex;gap:6px;"><button id="logs-clear" style="padding:4px 10px;border-radius:4px;cursor:pointer;font-size:10px;background:rgba(255,80,80,0.12);color:#ff6b6b;border:1px solid rgba(255,80,80,0.25);">🗑️ 清除</button><span id="logs-close" style="cursor:pointer;color:#888;font-size:18px;padding:2px 4px;">✕</span></div></div>
        <div style="padding:6px 14px;display:flex;gap:4px;flex-shrink:0;">
            <button class="log-filter active" data-level="all" style="padding:3px 8px;border-radius:10px;cursor:pointer;font-size:10px;border:1px solid #f0a500;background:rgba(240,165,0,0.2);color:#f0a500;font-weight:bold;">全部</button>
            <button class="log-filter" data-level="ERROR" style="padding:3px 8px;border-radius:10px;cursor:pointer;font-size:10px;border:1px solid rgba(255,80,80,0.25);background:rgba(255,80,80,0.1);color:#ff6b6b;">❌ ERROR</button>
            <button class="log-filter" data-level="WARN" style="padding:3px 8px;border-radius:10px;cursor:pointer;font-size:10px;border:1px solid rgba(240,165,0,0.25);background:rgba(240,165,0,0.1);color:#f0a500;">⚠️ WARN</button>
            <button class="log-filter" data-level="INFO" style="padding:3px 8px;border-radius:10px;cursor:pointer;font-size:10px;border:1px solid rgba(100,200,100,0.25);background:rgba(100,200,100,0.1);color:#6dd66d;">✅ INFO</button>
        </div>
        <div id="logs-container" style="flex:1;overflow-y:auto;padding:8px 14px 12px;scrollbar-width:thin;font-family:monospace;font-size:11px;line-height:1.6;"></div>
    </div>`;
    document.body.appendChild(overlay);
    const container = overlay.querySelector('#logs-container');
    function renderLogs(filter) {
        const filtered = filter === 'all' ? reversed : reversed.filter(l => l.level === filter);
        if (!filtered.length) { container.innerHTML = '<div style="color:#888;text-align:center;padding:20px;">📭 无匹配日志</div>'; return; }
        let h = '';
        filtered.forEach(l => { const color = l.level === 'ERROR' ? '#ff6b6b' : l.level === 'WARN' ? '#f0a500' : '#6dd66d'; h += `<div style="padding:3px 6px;border-bottom:1px solid rgba(255,255,255,0.03);display:flex;gap:8px;"><span style="color:#666;white-space:nowrap;flex-shrink:0;">${l.timeStr||'---'}</span><span style="color:${color};font-weight:bold;flex-shrink:0;">[${l.level}]</span><span style="color:#ddd;flex:1;">${l.message}</span>${l.data ? `<span style="color:#888;font-size:10px;">${l.data}</span>` : ''}</div>`; });
        container.innerHTML = h;
        container.scrollTop = 0;
    }
    renderLogs('all');
    overlay.querySelectorAll('.log-filter').forEach(btn => {
        btn.onclick = () => {
            overlay.querySelectorAll('.log-filter').forEach(b => { b.classList.remove('active'); b.style.borderColor = 'rgba(255,255,255,0.15)'; b.style.background = 'rgba(255,255,255,0.05)'; b.style.color = '#aaa'; b.style.fontWeight = 'normal'; });
            btn.classList.add('active');
            const level = btn.dataset.level;
            if (level === 'all') { btn.style.borderColor = '#f0a500'; btn.style.background = 'rgba(240,165,0,0.2)'; btn.style.color = '#f0a500'; btn.style.fontWeight = 'bold'; }
            else if (level === 'ERROR') { btn.style.borderColor = 'rgba(255,80,80,0.25)'; btn.style.background = 'rgba(255,80,80,0.12)'; btn.style.color = '#ff6b6b'; btn.style.fontWeight = 'bold'; }
            else if (level === 'WARN') { btn.style.borderColor = 'rgba(240,165,0,0.25)'; btn.style.background = 'rgba(240,165,0,0.12)'; btn.style.color = '#f0a500'; btn.style.fontWeight = 'bold'; }
            else if (level === 'INFO') { btn.style.borderColor = 'rgba(100,200,100,0.25)'; btn.style.background = 'rgba(100,200,100,0.12)'; btn.style.color = '#6dd66d'; btn.style.fontWeight = 'bold'; }
            renderLogs(level);
        };
    });
    overlay.querySelector('#logs-clear').onclick = () => { if (confirm('⚠️ 确定清除所有日志？')) { clearLogs(); overlay.remove(); } };
    overlay.querySelector('#logs-close').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ============================================================
// ★★★ 账号面板功能 ★★★
// ============================================================
function refreshPanelHighlight() {
    if(!panelRef)return; if(titleSpanRef)titleSpanRef.innerHTML=`📋 账号${lastUsedAccount?' · '+getDisplayAccountName(lastUsedAccount.email,lastUsedAccount.name):''}`;
    panelRef.querySelectorAll('button.account-btn').forEach(btn=>{const e=btn.getAttribute('data-email'),lu=lastUsedAccount&&lastUsedAccount.email===e; btn.style.background=lu?'rgba(240,165,0,0.15)':'rgba(255,255,255,0.04)'; btn.style.borderColor=lu?'#f0a500':'rgba(255,255,255,0.08)'; let b=btn.querySelector('.last-used-badge'); if(lu&&!b){b=document.createElement('span');b.className='last-used-badge';b.textContent='✓';b.style.cssText='margin-left:auto;color:#f0a500;font-size:11px;font-weight:bold;';btn.appendChild(b)}else if(!lu&&b)b.remove()});
}
function rebuildPanel() { if(panelRef){panelRef.remove();panelRef=null;titleSpanRef=null;contentRef=null} createPanel(); }

function makeDraggable(p,h){
    let d=false,sx,sy,ox,oy;
    h.style.cursor='grab';
    h.addEventListener('mousedown',e=>{if(e.target.closest('#panel-menu')||e.target.closest('.more-btn'))return; d=true;sx=e.clientX;sy=e.clientY;ox=p.offsetLeft;oy=p.offsetTop;h.style.cursor='grabbing'});
    document.addEventListener('mousemove',e=>{if(!d)return;p.style.left=(ox+e.clientX-sx)+'px';p.style.top=(oy+e.clientY-sy)+'px'});
    document.addEventListener('mouseup',()=>{if(d){d=false;h.style.cursor='grab';setPanelPosition(p.style.left,p.style.top)}});
}
function showMenu(m){m.style.display=m.style.display==='block'?'none':'block';}

function showAddAccountDialog() {
    const gl=getAllGroupNamesForSelect(), o=document.createElement('div'); o.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:100001;display:flex;align-items:center;justify-content:center;';
    const d=document.createElement('div'); d.style.cssText='background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:24px;width:360px;max-width:90vw;box-shadow:0 16px 48px rgba(0,0,0,0.6);color:#eee;';
    let gs='<option value="__new__">── 新建分组 ──</option>'; gl.forEach(g=>{gs+=`<option value="${g.name}">${g.name}</option>`});
    d.innerHTML=`<div style="font-size:16px;font-weight:bold;color:#f0a500;margin-bottom:18px;display:flex;justify-content:space-between;"><span>➕ 添加账号</span><span id="da-close" style="cursor:pointer;color:#888;font-size:18px;">✕</span></div>
        <style>#da-group option, #da-group optgroup { background:#1a1a2e; color:#eee; padding:4px; } #da-group optgroup { color:#f0a500; }</style>
        <div style="margin-bottom:12px;"><label style="color:#aaa;font-size:12px;">选择分组</label><select id="da-group" style="width:100%;padding:8px;background:#2a2a4e;color:#eee;border:1px solid rgba(255,255,255,0.2);border-radius:6px;">${gs}</select></div>
        <div id="da-new-wrap" style="margin-bottom:12px;display:none;"><label style="color:#aaa;font-size:12px;">新分组名称</label><input id="da-new-group" type="text" placeholder="输入新分组名称..." style="width:100%;padding:8px;background:rgba(255,255,255,0.06);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:6px;box-sizing:border-box;"></div>
        <div style="margin-bottom:12px;"><label style="color:#aaa;font-size:12px;">账号名称</label><input id="da-name" type="text" placeholder="名称" style="width:100%;padding:8px;background:rgba(255,255,255,0.06);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:6px;box-sizing:border-box;"></div>
        <div style="margin-bottom:12px;"><label style="color:#aaa;font-size:12px;">邮箱</label><input id="da-email" type="text" placeholder="example@qq.com" style="width:100%;padding:8px;background:rgba(255,255,255,0.06);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:6px;box-sizing:border-box;"></div>
        <div style="margin-bottom:18px;"><label style="color:#aaa;font-size:12px;">密码</label><input id="da-pass" type="password" placeholder="密码" style="width:100%;padding:8px;background:rgba(255,255,255,0.06);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:6px;box-sizing:border-box;"></div>
        <div id="da-err" style="color:#ff6b6b;font-size:11px;margin-bottom:8px;display:none;"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;"><button id="da-cancel" style="padding:8px 18px;background:rgba(255,255,255,0.06);color:#aaa;border:1px solid rgba(255,255,255,0.1);border-radius:6px;cursor:pointer;">取消</button><button id="da-confirm" style="padding:8px 18px;background:rgba(240,165,0,0.2);color:#f0a500;border:1px solid #f0a500;border-radius:6px;cursor:pointer;font-weight:bold;">✅ 确认添加</button></div>`;
    o.appendChild(d); document.body.appendChild(o);
    d.querySelector('#da-close').onclick=()=>o.remove(); d.querySelector('#da-cancel').onclick=()=>o.remove(); o.addEventListener('click',e=>{if(e.target===o)o.remove()});
    d.querySelector('#da-group').addEventListener('change',function(){d.querySelector('#da-new-wrap').style.display=this.value==='__new__'?'block':'none'});
    d.querySelector('#da-confirm').onclick=()=>{
        let gn=d.querySelector('#da-group').value; if(gn==='__new__'){gn=d.querySelector('#da-new-group').value.trim(); if(!gn){d.querySelector('#da-err').textContent='请输入分组名';d.querySelector('#da-err').style.display='block';return}}
        const n=d.querySelector('#da-name').value.trim(),e=d.querySelector('#da-email').value.trim(),p=d.querySelector('#da-pass').value.trim();
        if(!n||!e||!p){d.querySelector('#da-err').textContent='请填写完整信息';d.querySelector('#da-err').style.display='block';return}
        if(!addCustomAccount(gn,{name:n,email:e,password:p})){d.querySelector('#da-err').textContent=`分组中已存在该邮箱`;d.querySelector('#da-err').style.display='block';return}
        o.remove(); rebuildPanel(); updateStatus(`✅ 已添加 ${n}`); addInfoLog(`添加账号: ${n} (${e})`);
    };
}
function showDeleteAccountConfirm(gn,acc,cb){
    const o=document.createElement('div');o.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:100002;display:flex;align-items:center;justify-content:center;';
    const d=document.createElement('div');d.style.cssText='background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:24px;width:320px;max-width:90vw;box-shadow:0 16px 48px rgba(0,0,0,0.6);color:#eee;text-align:center;';
    d.innerHTML=`<div style="font-size:36px;margin-bottom:12px;">🗑️</div><div style="font-size:15px;font-weight:bold;margin-bottom:8px;">确认删除</div><div style="color:#aaa;margin-bottom:16px;">从「${gn}」删除<br><strong style="color:#f0a500;">${acc.name}</strong>（${acc.email}）？</div><div style="display:flex;gap:8px;justify-content:center;"><button id="dc-cancel" style="padding:8px 18px;background:rgba(255,255,255,0.06);color:#aaa;border:1px solid rgba(255,255,255,0.1);border-radius:6px;cursor:pointer;">取消</button><button id="dc-confirm" style="padding:8px 18px;background:rgba(255,80,80,0.2);color:#ff6b6b;border:1px solid #ff6b6b;border-radius:6px;cursor:pointer;font-weight:bold;">🗑️ 确认删除</button></div>`;
    o.appendChild(d);document.body.appendChild(o); d.querySelector('#dc-cancel').onclick=()=>o.remove(); d.querySelector('#dc-confirm').onclick=()=>{o.remove();if(cb)cb()}; o.addEventListener('click',e=>{if(e.target===o)o.remove()});
}
function showEditNameDialog(t,c,onC){
    const o=document.createElement('div');o.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:100004;display:flex;align-items:center;justify-content:center;';
    const d=document.createElement('div');d.style.cssText='background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:24px;width:340px;max-width:90vw;box-shadow:0 16px 48px rgba(0,0,0,0.6);color:#eee;';
    d.innerHTML=`<div style="font-size:15px;font-weight:bold;color:#f0a500;margin-bottom:16px;display:flex;justify-content:space-between;"><span>✏️ ${t}</span><span id="ec-close" style="cursor:pointer;color:#888;font-size:18px;">✕</span></div><input id="ec-input" type="text" value="${c.replace(/\"/g,'&quot;')}" style="width:100%;padding:10px;background:rgba(255,255,255,0.06);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:6px;font-size:14px;box-sizing:border-box;margin-bottom:16px;"><div style="display:flex;gap:8px;justify-content:flex-end;"><button id="ec-cancel" style="padding:8px 18px;background:rgba(255,255,255,0.06);color:#aaa;border:1px solid rgba(255,255,255,0.1);border-radius:6px;cursor:pointer;">取消</button><button id="ec-confirm" style="padding:8px 18px;background:rgba(240,165,0,0.2);color:#f0a500;border:1px solid #f0a500;border-radius:6px;cursor:pointer;font-weight:bold;">✅ 确认</button></div><div id="ec-err" style="color:#ff6b6b;font-size:11px;margin-top:8px;text-align:center;display:none;"></div>`;
    o.appendChild(d);document.body.appendChild(o);const inp=d.querySelector('#ec-input'),err=d.querySelector('#ec-err');
    d.querySelector('#ec-close').onclick=()=>o.remove();d.querySelector('#ec-cancel').onclick=()=>o.remove();o.addEventListener('click',e=>{if(e.target===o)o.remove()});
    d.querySelector('#ec-confirm').onclick=()=>{const v=inp.value.trim();if(!v){err.textContent='名称不能为空';err.style.display='block';return}o.remove();onC(v)};inp.focus();inp.select();
}
function getAllGroupNamesForSelect() { const ag=getAllAccountGroups(), r=[]; Object.keys(ag).forEach(n=>{const c=loadCustomAccounts(); r.push({name:n,isCustom:!!c[n]&&!BUILTIN_ACCOUNT_GROUPS[n]})}); return r; }

// ============================================================
// ★★★ API请求工具 ★★★
// ============================================================
async function apiRequest(endpoint, body) {
    const token = getAuthToken();
    if (!token) { addErrorLog('API请求失败：未找到Token'); return null; }
    try {
        const res = await fetch('https://idle.charsgame.com' + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch(e) {
        addErrorLog(`API请求失败: ${endpoint}`, e.message);
        return null;
    }
}

// ============================================================
// ★★★ 市场工具函数 ★★★
// ============================================================
async function fetchBuyOrder(itemId) {
    const res = await apiRequest('/api/v1/market/order-book', { itemId });
    if (!res || res.code !== 20000 || !res.data) return null;
    return res.data.buyOrders || null;
}
// 获取完整订单簿（买单+卖单）
async function fetchOrderBook(itemId) {
    const res = await apiRequest('/api/v1/market/order-book', { itemId });
    if (!res || res.code !== 20000 || !res.data) return null;
    return { buyOrders: res.data.buyOrders || [], sellOrders: res.data.sellOrders || [] };
}
async function executeSell(itemId, price, qty) {
    const clientRequestId = `market-order-sell-${itemId}-${Date.now()}-${Math.random().toString(36).substr(2,8)}`;
    const res = await apiRequest('/api/v1/market/orders', {
        itemId, side: 'sell', price, qty, clientRequestId
    });
    return res;
}
async function fetchInventoryQty(itemId) {
    const res = await apiRequest('/api/v1/inventory', {});
    if (!res || res.code !== 20000 || !res.data) return 0;
    const inv = res.data.inventory;
    const item = inv.find(i => i.itemId === itemId);
    return item ? item.qty : 0;
}
// ★★★ 新增：查询我的订单（用于领取功能）★★★
async function fetchMyOrders() {
    const res = await apiRequest('/api/v1/market/orders/mine', {});
    if (!res || res.code !== 20000 || !res.data) return [];
    return res.data.orders || [];
}
// ★★★ 新增：领取已成交的买入订单 ★★★
async function collectOrderItems(orderId) {
    const clientRequestId = `market-order-action-collect-items-${orderId}-${Date.now()}-${Math.random().toString(36).substr(2,6)}`;
    const res = await apiRequest('/api/v1/market/orders/collect-items', { orderId, clientRequestId });
    return res;
}

// ============================================================
// ★★★ 📊 手动提取价格 ★★★
// ============================================================
function showManualPriceDialog() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:100015;display:flex;align-items:center;justify-content:center;';
    const dlg = document.createElement('div');
    dlg.style.cssText = 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:22px;width:480px;max-width:90vw;box-shadow:0 16px 48px rgba(0,0,0,0.6);color:#eee;font-family:\'Segoe UI\',Arial,sans-serif;font-size:13px;max-height:85vh;overflow-y:auto;';
    let itemsHTML = '';
    for (const [cat, items] of Object.entries(ITEMS_BY_CATEGORY)) {
        itemsHTML += `<optgroup label="${cat}">`;
        items.forEach(item => {
            const code = 'ID ' + item.itemId;
            itemsHTML += `<option value=\"${item.itemId}\" data-search=\"${code} ${item.name} ${item.category}\">${code}: ${item.name}${item.tier ? ` | ${item.tier}` : ''}</option>`;
        });
        itemsHTML += `</optgroup>`;
    }
    dlg.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <span style="font-weight:bold;color:#00c8c8;font-size:16px;">📊 手动提取买入价</span>
            <span id="mp-close" style="cursor:pointer;color:#888;font-size:18px;">✕</span>
        </div>
        <div style="margin-bottom:12px;">
            <div style="color:#aaa;font-size:12px;margin-bottom:6px;">选择要查询的商品（可多选）：</div>
            <select id="mp-item-select" multiple size="10" style="width:100%;background:rgba(0,0,0,0.3);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:4px;font-size:11px;scrollbar-width:thin;">${itemsHTML}</select>
            <div style="display:flex;gap:4px;margin-top:4px;">
                <button id="mp-select-all" style="padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10px;background:rgba(0,200,200,0.1);color:#00c8c8;border:1px solid rgba(0,200,200,0.2);">全选</button>
                <button id="mp-deselect-all" style="padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10px;background:rgba(255,80,80,0.1);color:#ff6b6b;border:1px solid rgba(255,80,80,0.2);">清空</button>
            </div>
        </div>
        <div id="mp-result" style="margin-bottom:12px;max-height:200px;overflow-y:auto;background:rgba(0,0,0,0.2);border-radius:8px;padding:8px 10px;font-size:11px;line-height:1.6;display:none;"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button id="mp-cancel" style="padding:8px 18px;background:rgba(255,255,255,0.06);color:#aaa;border:1px solid rgba(255,255,255,0.1);border-radius:6px;cursor:pointer;">关闭</button>
            <button id="mp-query" style="padding:8px 18px;background:rgba(0,200,200,0.15);color:#00c8c8;border:1px solid #00c8c8;border-radius:6px;cursor:pointer;font-weight:bold;">📊 查询价格</button>
        </div>`;
    overlay.appendChild(dlg); document.body.appendChild(overlay);
    const close = () => overlay.remove();
    dlg.querySelector('#mp-close').onclick = close; dlg.querySelector('#mp-cancel').onclick = close; overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    dlg.querySelector('#mp-select-all').onclick = () => { const sel = dlg.querySelector('#mp-item-select'); Array.from(sel.options).forEach(o => o.selected = true); };
    dlg.querySelector('#mp-deselect-all').onclick = () => { const sel = dlg.querySelector('#mp-item-select'); Array.from(sel.options).forEach(o => o.selected = false); };
    dlg.querySelector('#mp-query').onclick = async () => {
        const sel = dlg.querySelector('#mp-item-select');
        const selectedItems = [];
        Array.from(sel.options).forEach(o => { if (o.selected) selectedItems.push(parseInt(o.value)); });
        if (selectedItems.length === 0) { alert('⚠️ 请至少选择一个商品'); return; }
        const resultDiv = dlg.querySelector('#mp-result');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '⏳ 查询中...';
        dlg.querySelector('#mp-query').disabled = true;
        dlg.querySelector('#mp-query').textContent = '⏳ 查询中...';
        let html = '';
        for (const itemId of selectedItems) {
            try {
                const ob = await fetchOrderBook(itemId);
                const itemName = getItemDisplay(itemId);
                if (ob) {
                    html += `<div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:10px;">`;
                    html += `<div style="color:#f0a500;font-weight:bold;margin-bottom:2px;">${itemName}</div>`;
                    // 卖单（最低价在前）
                    if (ob.sellOrders.length > 0) {
                        const bestSell = ob.sellOrders[0];
                        html += `<div style="display:flex;justify-content:space-between;color:#ff6b6b;"><span>🟢 卖单(最低)</span><span>💰 ${bestSell.price} (可买${bestSell.qty})</span></div>`;
                        if (ob.sellOrders.length > 1) {
                            const rest = ob.sellOrders.slice(0, 3);
                            html += `<div style="color:#888;padding-left:10px;">${rest.map(o => `价格${o.price}(${o.qty})`).join(' ')}</div>`;
                        }
                    } else {
                        html += `<div style="color:#888;">🟢 暂无卖出订单</div>`;
                    }
                    // 买单（最高价在前）
                    if (ob.buyOrders.length > 0) {
                        const bestBuy = ob.buyOrders[0];
                        html += `<div style="display:flex;justify-content:space-between;color:#6dd66d;margin-top:2px;"><span>🔴 买单(最高)</span><span>💰 ${bestBuy.price} (可卖${bestBuy.qty})</span></div>`;
                        if (ob.buyOrders.length > 1) {
                            const rest = ob.buyOrders.slice(0, 3);
                            html += `<div style="color:#888;padding-left:10px;">${rest.map(o => `价格${o.price}(${o.qty})`).join(' ')}</div>`;
                        }
                    } else {
                        html += `<div style="color:#888;">🔴 暂无买入订单</div>`;
                    }
                    html += `</div>`;
                } else {
                    html += `<div style="padding:3px 0;color:#888;font-size:10px;">${itemName}: 查询失败</div>`;
                }
                await sleep(200);
            } catch(e) {
                html += `<div style="display:flex;justify-content:space-between;padding:3px 0;color:#ff6b6b;"><span style="font-size:10px;">${getItemDisplay(itemId)}</span><span>查询失败</span></div>`;
            }
            resultDiv.innerHTML = html;
        }
        dlg.querySelector('#mp-query').disabled = false;
        dlg.querySelector('#mp-query').textContent = '📊 查询价格';
        addInfoLog(`📊 手动价格查询完成: ${selectedItems.length}个商品`);
    };
}

// ============================================================
// ★★★ 📊 一键市场全价查询 ★★★
// ============================================================
const MARKET_WATCH_ITEMS = [
    1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,
    21,22,23,24,25,26,27,28,29,30,31,32,
    63,76,79,89,90,91,92,101,102,103,104
];

async function showMarketPriceDialog() {
    const token = getAuthToken();
    if (!token) { alert('❌ 请先登录游戏'); return; }

    const overlay = document.createElement('div');
    overlay.className = 'pi-overlay';
    const dlg = document.createElement('div');
    dlg.className = 'pi-dialog pi-dialog-700';
    dlg.style.display = 'flex';
    dlg.style.flexDirection = 'column';
    dlg.style.maxHeight = '90vh';

    // 打开时加载已有数据
    var savedData = window.PI_STATS && window.PI_STATS.marketPrices;

    dlg.innerHTML = `
        <div class="pi-dialog-header" style="flex-shrink:0;">
            <span class="pi-dialog-title" style="color:#6d9fff;font-size:15px;">📊 全量市场价格</span>
            <span id="mpa-close" class="pi-dialog-close">✕</span>
        </div>
        <div style="margin-bottom:8px;flex-shrink:0;display:flex;gap:8px;align-items:center;">
            <span id="mpa-status" style="color:#888;font-size:12px;">${savedData ? savedData.time + ' · ' + savedData.data.length + '个商品' : MARKET_WATCH_ITEMS.length + ' 个商品，点击查询'}</span>
            <button id="mpa-refresh" class="pi-btn pi-btn-price" style="margin-left:auto;padding:4px 12px;">${savedData ? '🔄 更新数据' : '🔄 查询全部'}</button>
        </div>
        <div id="mpa-content" style="flex:1;overflow-y:auto;background:rgba(0,0,0,0.15);border-radius:6px;padding:6px 8px;font-size:11px;font-family:monospace;line-height:1.6;min-height:200px;">
            <div style="color:#888;text-align:center;padding:40px 0;">${savedData ? '加载已有数据...' : '点击「查询全部」获取市场价格'}</div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;flex-shrink:0;">
            <button id="mpa-close2" class="pi-btn pi-btn-cancel">关闭</button>
            <button id="mpa-export" class="pi-btn pi-btn-price" style="font-size:12px;">📋 复制</button>
        </div>`;

    overlay.appendChild(dlg);
    document.body.appendChild(overlay);

    let resultsData = null;

    // 如果已有数据，立即渲染
    if (savedData) {
        resultsData = savedData.data;
        renderResults(resultsData, 'all');
    }

    async function doQuery() {
        const statusEl = dlg.querySelector('#mpa-status');
        const contentEl = dlg.querySelector('#mpa-content');
        const refreshBtn = dlg.querySelector('#mpa-refresh');
        refreshBtn.disabled = true;
        refreshBtn.textContent = '⏳ 查询中...';
        contentEl.innerHTML = '<div style="color:#888;text-align:center;padding:20px;">⏳ 查询中...</div>';

        const results = [];
        for (let i = 0; i < MARKET_WATCH_ITEMS.length; i++) {
            const itemId = MARKET_WATCH_ITEMS[i];
            statusEl.textContent = `查询中 ${i + 1}/${MARKET_WATCH_ITEMS.length}: ${PI_getItemName(itemId)}...`;
            const ob = await fetchOrderBook(itemId);
            const itemName = PI_getItemName(itemId);
            const bestBuy = ob && ob.buyOrders.length > 0 ? ob.buyOrders[0] : null;
            const bestSell = ob && ob.sellOrders.length > 0 ? ob.sellOrders[0] : null;
            results.push({ itemId, name: itemName, bestBuy, bestSell, buyDepth: (ob ? ob.buyOrders : []), sellDepth: (ob ? ob.sellOrders : []) });
            await sleep(150);
            // 每10个刷新一次界面
            if (i % 10 === 9 || i === MARKET_WATCH_ITEMS.length - 1) {
                statusEl.textContent = `查询中 ${i + 1}/${MARKET_WATCH_ITEMS.length}...`;
            }
        }

        resultsData = results;
        renderResults(results, 'all');
        statusEl.textContent = `✅ 完成 (${results.length}个)`;
        refreshBtn.disabled = false;
        refreshBtn.textContent = '🔄 重新查询';
        // 保存到共享统计
        window.PI_STATS.marketPrices = { time: new Date().toLocaleString('zh-CN'), data: results };
        saveStatsToDisk();
        addInfoLog(`📊 全量市场价格查询完成: ${results.length}个商品`);
    }

    function renderResults(results, filter) {
        const contentEl = dlg.querySelector('#mpa-content');
        let html = '<div style="display:flex;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.1);color:#888;font-weight:bold;"><span style="width:30px;">#</span><span style="flex:1;">物品</span><span style="width:70px;text-align:right;">买价</span><span style="width:70px;text-align:right;">买量</span><span style="width:70px;text-align:right;">卖价</span><span style="width:70px;text-align:right;">卖量</span></div>';

        results.forEach((r, idx) => {
            const buyPrice = r.bestBuy ? r.bestBuy.price.toLocaleString() : '-';
            const buyQty = r.bestBuy ? r.bestBuy.qty.toLocaleString() : '-';
            const sellPrice = r.bestSell ? r.bestSell.price.toLocaleString() : '-';
            const sellQty = r.bestSell ? r.bestSell.qty.toLocaleString() : '-';

            // 价差颜色：卖价>买价正常绿，卖价<=买价(套利)红色
            let spreadColor = '#888';
            if (r.bestSell && r.bestBuy) {
                if (r.bestSell.price <= r.bestBuy.price) spreadColor = '#ff6b6b';
                else if (r.bestSell.price < r.bestBuy.price * 1.1) spreadColor = '#f0a500';
            }

            html += `<div class="pi-result-row" style="font-size:10px;">
                <span style="width:30px;color:#888;">${idx+1}</span>
                <span style="flex:1;color:#ddd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${r.name}">${r.name}</span>
                <span style="width:70px;text-align:right;color:#6dd66d;">${buyPrice}</span>
                <span style="width:70px;text-align:right;color:#888;">${buyQty}</span>
                <span style="width:70px;text-align:right;color:#ff6b6b;">${sellPrice}</span>
                <span style="width:70px;text-align:right;color:#888;">${sellQty}</span>
            </div>`;
        });
        contentEl.innerHTML = html;
    }

    dlg.querySelector('#mpa-refresh').onclick = doQuery;
    const close = () => overlay.remove();
    dlg.querySelector('#mpa-close').onclick = close;
    dlg.querySelector('#mpa-close2').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    dlg.querySelector('#mpa-export').onclick = () => {
        if (!resultsData) { alert('⚠️ 请先查询'); return; }
        let text = `📊 全量市场价格 (${resultsData.length}个商品)\n查询时间: ${new Date().toLocaleString('zh-CN')}\n${'═'.repeat(50)}\n`;
        text += '#  物品                买价      买量      卖价      卖量\n';
        resultsData.forEach((r, idx) => {
            const buyPrice = r.bestBuy ? r.bestBuy.price.toLocaleString() : '-';
            const buyQty = r.bestBuy ? r.bestBuy.qty.toLocaleString() : '-';
            const sellPrice = r.bestSell ? r.bestSell.price.toLocaleString() : '-';
            const sellQty = r.bestSell ? r.bestSell.qty.toLocaleString() : '-';
            text += `${String(idx+1).padEnd(3)} ${r.name.padEnd(16)} ${buyPrice.padEnd(8)} ${buyQty.padEnd(8)} ${sellPrice.padEnd(8)} ${sellQty}\n`;
        });
        navigator.clipboard.writeText(text).then(() => {
            dlg.querySelector('#mpa-export').textContent = '✅ 已复制';
            setTimeout(() => { dlg.querySelector('#mpa-export').textContent = '📋 复制'; }, 2000);
        });
    };
}


// ============================================================
// ★★★ 📊 数据统计汇总面板 ★★★
// ============================================================
function showStatsDialog() {
    loadStatsFromDisk();
    var stats = window.PI_STATS;
    var hasSkill = stats.skill && stats.skill.data;
    var hasInv = stats.inventory && stats.inventory.data;
    var hasWh = stats.warehouse && stats.warehouse.data;
    var hasMarket = stats.marketPrices && stats.marketPrices.data;

    var overlay = document.createElement('div');
    overlay.className = 'pi-overlay';
    var dlg = document.createElement('div');
    dlg.className = 'pi-dialog pi-dialog-700';
    dlg.style.display = 'flex';
    dlg.style.flexDirection = 'column';
    dlg.style.maxHeight = '90vh';

    // ---- 技能等级汇总 ----
    var skillHtml = '';
    if (hasSkill) {
        var emails = Object.keys(stats.skill.data);
        var sorted = emails.sort(function(a,b){ return (stats.skill.data[b].totalLevel||0) - (stats.skill.data[a].totalLevel||0); });
        var totalLv = 0, totalGold = 0;
        sorted.forEach(function(e){ var r=stats.skill.data[e]; totalLv += r.totalLevel||0; totalGold += r.gold||0; });
        var avgLv = (totalLv / sorted.length).toFixed(1);
        skillHtml += '<div style="background:rgba(206,147,216,0.08);border-radius:8px;padding:8px 10px;margin-bottom:8px;">';
        skillHtml += '<div style="color:#ce93d8;font-weight:bold;font-size:12px;margin-bottom:4px;">📊 技能等级 <span style="color:#888;font-weight:normal;font-size:10px;">' + stats.skill.time + '</span></div>';
        skillHtml += '<div style="font-size:10px;color:#aaa;margin-bottom:4px;">' + sorted.length + '个账号 | 平均总等级 ' + avgLv + ' | 总金币 ' + totalGold.toLocaleString() + '</div>';
        skillHtml += '<div style="font-size:10px;">';
        // Show top 5 skills across all accounts
        var allSkills = {};
        sorted.forEach(function(e){
            var r = stats.skill.data[e];
            if (r && r.skills) {
                r.skills.forEach(function(s){
                    if (!allSkills[s.name]) allSkills[s.name] = { total: 0, count: 0 };
                    allSkills[s.name].total += s.level;
                    allSkills[s.name].count++;
                });
            }
        });
        var skillList = Object.keys(allSkills).sort(function(a,b){ return allSkills[b].total - allSkills[a].total; }).slice(0, 8);
        skillList.forEach(function(sk){
            var info = allSkills[sk];
            var avg = (info.total / info.count).toFixed(1);
            skillHtml += '<span style="display:inline-block;margin:1px 6px 1px 0;color:#ddd;">' + sk + ': <span style="color:#ce93d8;">' + avg + '</span></span>';
        });
        skillHtml += '</div>';
        skillHtml += '<div style="margin-top:4px;"><button class="pi-btn pi-btn-cancel" style="font-size:9px;padding:2px 8px;" onclick="showCslResults(window.PI_STATS.skill.data)">查看详情</button></div>';
        skillHtml += '</div>';
    } else {
        skillHtml += '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:8px 10px;margin-bottom:8px;color:#888;font-size:11px;">📊 技能等级 — 暂无数据，请先运行「检测技能等级」</div>';
    }

    // ---- 背包/仓库汇总 ----
    var invHtml = '';
    function buildInvSection(type, label, color, icon) {
        var detailFn = type === 'inventory' ? 'showCiResults' : 'showCwResults';
        var d = type === 'inventory' ? stats.inventory : stats.warehouse;
        var has = (type === 'inventory' ? hasInv : hasWh);
        if (has && d && d.data) {
            var emails = Object.keys(d.data);
            var totalItems = 0, totalTypes = 0;
            var allItems = {};
            emails.forEach(function(e){
                var r = d.data[e];
                if (r && r.items) {
                    r.items.forEach(function(item){
                        totalItems += item.qty || 0;
                        if (!allItems[item.itemId]) allItems[item.itemId] = { name: PI_getItemName(item.itemId), qty: 0 };
                        allItems[item.itemId].qty += item.qty || 0;
                        totalTypes++;
                    });
                }
            });
            var topItems = Object.keys(allItems).sort(function(a,b){ return allItems[b].qty - allItems[a].qty; }).slice(0, 6);
            invHtml += '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:8px 10px;margin-bottom:8px;">';
            invHtml += '<div style="color:' + color + ';font-weight:bold;font-size:12px;margin-bottom:4px;">' + icon + ' ' + label + ' <span style="color:#888;font-weight:normal;font-size:10px;">' + d.time + '</span></div>';
            invHtml += '<div style="font-size:10px;color:#aaa;margin-bottom:4px;">' + emails.length + '个账号 | ' + Object.keys(allItems).length + '种物品 | 总数量 ' + totalItems.toLocaleString() + '</div>';
            invHtml += '<div style="font-size:10px;">';
            topItems.forEach(function(itemId){
                var info = allItems[itemId];
                invHtml += '<span style="display:inline-block;margin:1px 6px 1px 0;color:#ddd;">' + info.name + ': <span style="color:' + color + ';">' + info.qty.toLocaleString() + '</span></span>';
            });
            invHtml += '</div>';
            invHtml += '<div style="margin-top:4px;"><button class="pi-btn pi-btn-cancel" style="font-size:9px;padding:2px 8px;" onclick="' + detailFn + '(window.PI_STATS.' + type + '.data)">查看详情</button></div>';
            invHtml += '</div>';
        }
        return invHtml;
    }
    invHtml += buildInvSection('inventory', '背包', '#4fc3f7', '🎒');
    invHtml += buildInvSection('warehouse', '仓库', '#81c784', '🏪');

    // ---- 市场价格汇总 ----
    var mktHtml = '';
    if (hasMarket) {
        var prices = stats.marketPrices.data;
        var totalVal = 0, profitable = 0, inverted = 0;
        prices.forEach(function(p){
            if (p.bestBuy && p.bestSell) {
                totalVal++;
                if (p.bestSell.price > p.bestBuy.price) profitable++;
                if (p.bestSell.price <= p.bestBuy.price) inverted++;
            }
        });
        // Top 5 by volume
        var byVolume = prices.filter(function(p){ return p.bestSell; }).sort(function(a,b){ return (b.bestSell?b.bestSell.qty:0) - (a.bestSell?a.bestSell.qty:0); }).slice(0, 5);
        mktHtml += '<div style="background:rgba(100,150,255,0.08);border-radius:8px;padding:8px 10px;margin-bottom:8px;">';
        mktHtml += '<div style="color:#6d9fff;font-weight:bold;font-size:12px;margin-bottom:4px;">💹 市场价格 <span style="color:#888;font-weight:normal;font-size:10px;">' + stats.marketPrices.time + '</span></div>';
        mktHtml += '<div style="font-size:10px;color:#aaa;margin-bottom:4px;">' + prices.length + '个商品 | 正常价差 ' + profitable + ' | 倒挂 ' + inverted + '</div>';
        mktHtml += '<div style="font-size:10px;">';
        mktHtml += '<div style="color:#888;margin-bottom:2px;">卖量前5:</div>';
        byVolume.forEach(function(p){
            mktHtml += '<span style="display:inline-block;margin:1px 6px 1px 0;color:#ddd;">' + p.name + ': <span style="color:#6dd66d;">' + (p.bestBuy?p.bestBuy.price:'-') + '</span>|<span style="color:#ff6b6b;">' + (p.bestSell?p.bestSell.price:'-') + '</span> <span style="color:#888;">(' + (p.bestSell?p.bestSell.qty.toLocaleString():'0') + ')</span></span>';
        });
        mktHtml += '</div>';
        mktHtml += '<div style="margin-top:4px;"><button class="pi-btn pi-btn-cancel" style="font-size:9px;padding:2px 8px;" onclick="showMarketPriceDialog()">查看详情</button></div>';
        mktHtml += '</div>';
    } else {
        mktHtml += '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:8px 10px;color:#888;font-size:11px;">💹 市场价格 — 暂无数据，请先运行「全量市场价格」</div>';
    }

    dlg.innerHTML = '\
        <div class="pi-dialog-header" style="flex-shrink:0;">\
            <span class="pi-dialog-title" style="color:#f0a500;font-size:16px;">📊 数据总览</span>\
            <span id="st-close" class="pi-dialog-close">✕</span>\
        </div>\
        <div id="st-content" style="flex:1;overflow-y:auto;font-size:12px;padding:0 2px;line-height:1.5;">' +
            skillHtml + invHtml + mktHtml + '\
        </div>\
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;flex-shrink:0;">\
            <button id="st-close2" class="pi-btn pi-btn-cancel">关闭</button>\
            <button id="st-refresh" class="pi-btn pi-btn-price" style="font-size:12px;">🔄 刷新数据</button>\
        </div>';

    overlay.appendChild(dlg);
    document.body.appendChild(overlay);

    var close = function() { overlay.remove(); };
    dlg.querySelector('#st-close').onclick = close;
    dlg.querySelector('#st-close2').onclick = close;
    dlg.querySelector('#st-refresh').onclick = function() { overlay.remove(); setTimeout(showStatsDialog, 100); };
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    addInfoLog('📊 数据统计面板已打开');
}

// ============================================================
// ★★★ 创建面板 ★★★
// ============================================================
async function createPanel() {
    if(panelRef)return;
    const p=document.createElement('div'); p.id='account-panel-enhanced'; panelRef=p;
    const pos=getPanelPosition();
    p.style.cssText=`position:fixed;top:${pos.top};left:${pos.left};z-index:99999;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);color:#eee;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.5);font-family:'Segoe UI',Arial,sans-serif;font-size:13px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-height:85vh;min-width:200px;`;
    const h=document.createElement('div'); h.id='panel-header'; h.style.cssText=`display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(0,0,0,0.3);border-bottom:${isCollapsed?'none':'1px solid rgba(255,255,255,0.06)'};user-select:none;flex-wrap:wrap;`;
    const ts=document.createElement('span'); ts.style.cssText='font-weight:bold;color:#f0a500;font-size:14px;'; ts.innerHTML=`📋 账号${lastUsedAccount?' · '+getDisplayAccountName(lastUsedAccount.email,lastUsedAccount.name):''}`;
    titleSpanRef=ts;
    const ra=document.createElement('span'); ra.style.cssText='display:flex;align-items:center;gap:6px;';
    const mb=document.createElement('span'); mb.textContent='⚙';mb.title='更多';mb.className='more-btn';mb.style.cssText='cursor:pointer;font-size:16px;color:#aaa;padding:2px 4px;border-radius:4px;';mb.onmouseover=()=>mb.style.background='rgba(255,255,255,0.1)';mb.onmouseout=()=>mb.style.background='transparent';
    const ti=document.createElement('span'); ti.id='toggle-icon';ti.textContent=isCollapsed?'▶':'▼';ti.style.cssText='font-size:14px;color:#aaa;cursor:pointer;padding:2px 4px;border-radius:4px;';ti.onmouseover=()=>ti.style.background='rgba(255,255,255,0.1)';ti.onmouseout=()=>ti.style.background='transparent';
    ra.appendChild(mb);ra.appendChild(ti); h.appendChild(ts);h.appendChild(ra); p.appendChild(h);
    const m=document.createElement('div'); m.id='panel-menu';m.style.cssText='display:none;position:absolute;top:44px;right:8px;background:#1a1a2e;border:1px solid #333;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.6);z-index:100000;min-width:190px;padding:4px 0;';
    mb.onclick=e=>{e.stopPropagation();showMenu(m)};
    [
        ['📦 导出配置',()=>{downloadFile(JSON.stringify(getAllAccountGroups(),null,2),'account_groups.json','application/json');m.style.display='none';updateStatus('✅ 已导出')}],
        ['📥 导入配置',()=>{const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=e=>{const f=e.target.files[0];if(!f)return;new FileReader().onload=ev=>{try{const j=JSON.parse(ev.target.result);if(typeof j==='object'&&!Array.isArray(j)){saveCustomAccounts(j);rebuildPanel();updateStatus('✅ 已导入');addInfoLog('配置已导入')}else alert('格式错误')}catch(err){alert('JSON解析失败');addErrorLog('配置导入失败',err.message)}};};i.click();m.style.display='none'}],
        ['🔄 重置位置',()=>{p.style.left='10px';p.style.top='10px';setPanelPosition('10px','10px');m.style.display='none'}],
        ['🧹 清除记住的账号',()=>{clearLastAccount();lastUsedAccount=null;ts.innerHTML='📋 账号';refreshPanelHighlight();m.style.display='none'}],
        ['divider'],
        ['🔑 提取API Token',()=>{m.style.display='none';showTokenDialog()}],
        ['📋 查看日志',()=>{m.style.display='none';showLogsDialog()}],
        ['📊 手动提取价格', () => { m.style.display='none'; showManualPriceDialog(); }],
        ['📊 全量市场价格', () => { m.style.display='none'; showMarketPriceDialog(); }],
        ['📊 数据统计', () => { m.style.display='none'; showStatsDialog(); }],
        ['divider'],
        ['🔄 循环切号', () => { m.style.display='none'; showCycleSwitchDialog(); }],
        ['⛏️ 循环采集', () => { m.style.display='none'; showCycleCollectDialog(); }],
        ['💰 循环出售', () => { m.style.display='none'; showCycleSellDialog(); }],
        ['📦 循环领取', () => { m.style.display='none'; showCycleClaimDialog(); }],
        ['divider'],
        ['🚪 退出登录',()=>{m.style.display='none';logout()}]
    ].forEach((item,idx)=>{
        if(item[0]==='divider'){const d=document.createElement('div');d.style.cssText='height:1px;background:rgba(255,255,255,0.08);margin:4px 0;';m.appendChild(d);return}
        if(item[0]==='🚪 退出登录'||item[0]==='🔑 提取API Token'||item[0]==='📋 查看日志'){const d=document.createElement('div');d.style.cssText='height:1px;background:rgba(255,255,255,0.08);margin:4px 0;';m.appendChild(d)}
        const mi=document.createElement('div');mi.textContent=item[0];mi.style.cssText=`padding:8px 16px;cursor:pointer;color:${item[0].includes('清除')||item[0].includes('退出')?'#ff6b6b':'#ccc'};font-size:13px;`;mi.onmouseover=()=>mi.style.background='rgba(255,255,255,0.06)';mi.onmouseout=()=>mi.style.background='transparent';mi.onclick=item[1];m.appendChild(mi)
    }); p.appendChild(m);
    document.addEventListener('click',e=>{if(!m.contains(e.target)&&e.target!==mb)m.style.display='none'});
    const c=document.createElement('div');c.id='panel-content';contentRef=c;c.style.cssText=`padding:8px 12px 12px 12px;max-height:calc(85vh-50px);overflow-y:auto;display:${isCollapsed?'none':'block'};scrollbar-width:thin;`;
    const ss=document.createElement('style');ss.textContent='#panel-content::-webkit-scrollbar{width:4px}#panel-content::-webkit-scrollbar-track{background:transparent}#panel-content::-webkit-scrollbar-thumb{background:#444;border-radius:4px}#account-panel-enhanced button:active{transform:scale(0.97)}';document.head.appendChild(ss);
    const AG=getAllAccountGroups(),gns=Object.keys(AG);
    gns.forEach((gn,gi)=>{
        const aa=AG[gn];if(!aa||!aa.length)return;
        const dgn=getDisplayGroupName(gn),gh=document.createElement('div'),ie=DEFAULT_EXPANDED_GROUPS.includes(gn);
        gh.style.cssText=`display:flex;align-items:center;gap:6px;padding:6px 0 4px 0;margin-top:${gi>0?'6px':'0'};color:#f0a500;font-size:12px;font-weight:bold;cursor:pointer;user-select:none;border-top:${gi>0?'1px solid rgba(255,255,255,0.05)':'none'};`;
        gh.innerHTML=`<span style="font-size:10px;">${ie?'▼':'▶'}</span><span class="group-name-edit" title="双击编辑分组名称">${dgn}</span><span style="color:#666;font-weight:normal;font-size:11px;">(${aa.length})</span>`;
        const gns2=gh.querySelector('.group-name-edit');
        gns2.addEventListener('dblclick',e=>{e.stopPropagation();showEditNameDialog('修改分组名称',dgn,(nn)=>{if(setGroupRename(gn,nn)){rebuildPanel();showToast(`✅ 分组已更名为「${nn}」`,'#6dd66d');addInfoLog(`分组 ${gn} 更名为 ${nn}`)}})});
        gh.dataset.groupName=gn;
        gh.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move';gh.style.background='rgba(240,165,0,0.25)';gh.style.borderRadius='6px';gh.style.outline='1px solid #f0a500'});
        gh.addEventListener('dragleave',()=>{gh.style.background='';gh.style.borderRadius='';gh.style.outline=''});
        gh.addEventListener('drop',e=>{e.preventDefault();gh.style.background='';gh.style.borderRadius='';gh.style.outline='';try{const d=JSON.parse(e.dataTransfer.getData('text/plain'));if(moveAccountToGroup(d.sourceGroup,d.email,gn)){rebuildPanel();showToast(`✅ 已移至「${getDisplayGroupName(gn)}」`,'#6dd66d');addInfoLog(`账号 ${d.email} 移至 ${gn}`)}else showToast('⚠️ 移动失败','#ff6b6b')}catch(err){console.error(err)}});
        const gb=document.createElement('div');gb.style.cssText=`display:${ie?'block':'none'};padding-left:6px;`;
        aa.forEach(acc=>{
            if(!acc||!acc.email)return;
            const ic=isCustomAccount(gn,acc.email),dn=getDisplayAccountName(acc.email,acc.name),w=document.createElement('div');
            w.style.cssText='display:flex;align-items:center;gap:3px;margin:3px 0;';
            const btn=document.createElement('button');btn.className='account-btn';btn.setAttribute('data-email',acc.email);btn.draggable=true;
            btn.style.cssText=`flex:1;padding:5px 8px;border-radius:6px;cursor:pointer;font-size:11px;text-align:left;background:${lastUsedAccount&&lastUsedAccount.email===acc.email?'rgba(240,165,0,0.15)':'rgba(255,255,255,0.04)'};color:#ddd;border:1px solid ${lastUsedAccount&&lastUsedAccount.email===acc.email?'#f0a500':'rgba(255,255,255,0.08)'};`;
            btn.innerHTML=`<span style="color:#f0a500;font-weight:bold;">${dn}</span>${ic?' <span style="color:#6d9fff;font-size:9px;">✏️</span>':''}${lastUsedAccount&&lastUsedAccount.email===acc.email?' <span class="last-used-badge" style="color:#f0a500;font-size:11px;font-weight:bold;margin-left:auto;">✓</span>':''}`;
            btn.onmouseover=()=>{if(btn.style.background.indexOf('0.15')===-1)btn.style.background='rgba(255,255,255,0.08)'};
            btn.onmouseout=()=>{if(btn.style.background.indexOf('0.15')===-1)btn.style.background='rgba(255,255,255,0.04)'};
            btn.onclick=()=>switchAccount(acc);
            btn.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',JSON.stringify({email:acc.email,sourceGroup:gn}));btn.style.opacity='0.5'});
            btn.addEventListener('dragend',e=>{btn.style.opacity='1'});
            w.appendChild(btn);
            if(ic){
                const db=document.createElement('span');db.textContent='🗑️';db.title='删除账号';db.style.cssText='cursor:pointer;font-size:13px;color:#888;padding:2px 4px;border-radius:4px;';
                db.onmouseover=()=>db.style.background='rgba(255,80,80,0.2)';db.onmouseout=()=>db.style.background='transparent';
                db.onclick=e=>{e.stopPropagation();showDeleteAccountConfirm(gn,acc,()=>{deleteCustomAccount(gn,acc.email);rebuildPanel();updateStatus(`🗑️ 已删除 ${acc.name}`);addInfoLog(`删除账号: ${acc.name}`)})};
                w.appendChild(db);
                const eb=document.createElement('span');eb.textContent='✏️';eb.title='重命名';eb.style.cssText='cursor:pointer;font-size:13px;color:#888;padding:2px 4px;border-radius:4px;';
                eb.onmouseover=()=>eb.style.background='rgba(240,165,0,0.2)';eb.onmouseout=()=>eb.style.background='transparent';
                eb.onclick=e=>{e.stopPropagation();showEditNameDialog('修改显示名称',dn,(nn)=>{if(setAccountRename(acc.email,nn)){rebuildPanel();showToast(`✅ 已更名为「${nn}」`,'#6dd66d');addInfoLog(`账号 ${acc.email} 更名为 ${nn}`)}})};
                w.appendChild(eb);
            }
            gb.appendChild(w);
        });
        gh.onclick=()=>{const d=gb.style.display==='block'?'none':'block';gb.style.display=d;gh.querySelector('span:first-child').textContent=d==='block'?'▼':'▶'};
        c.appendChild(gh);c.appendChild(gb);
    });
    const tb=document.createElement('div');tb.style.cssText='display:flex;flex-direction:column;gap:4px;padding:8px 0 2px 0;border-top:1px solid rgba(255,255,255,0.05);';
    // ★★★ 底部按钮：全部功能 ★★★
    const btns = [
        {t:'➕ 添加账号', c:'add', a:()=>showAddAccountDialog()},
        {t:'🔑 提取API Token', c:'api', a:()=>showTokenDialog()},
        {t:'📋 日志', c:'log', a:()=>showLogsDialog()},
        {t:'📊 手动提取价格', c:'price', a:()=>{ showManualPriceDialog(); }},
        {t:'🔄 循环切号', c:'switch', a:()=>{ showCycleSwitchDialog(); }},
        {t:'⛏️ 循环采集', c:'collect', a:()=>{ showCycleCollectDialog(); }},
        {t:'💰 循环出售', c:'sell', a:()=>{ showCycleSellDialog(); }},
        {t:'💰 循环购买', c:'buy', a:()=>{ if(typeof showCbDialog==='function')showCbDialog(); }},
        {t:'📦 循环领取', c:'claim', a:()=>{ showCycleClaimDialog(); }},
        {t:'🎒 循环检测背包', c:'inventory', a:()=>{ if(typeof showCiDialog==='function')showCiDialog(); }},
        {t:'🏪 循环检测仓库', c:'warehouse', a:()=>{ if(typeof showCwDialog==='function')showCwDialog(); }},
        {t:'📊 检测技能等级', c:'skill', a:()=>{ if(typeof showCslDialog==='function')showCslDialog(); }},
        {t:'📊 全量市场价格', c:'mprices', a:()=>{ showMarketPriceDialog(); }},
        {t:'📊 数据统计', c:'stats', a:()=>{ showStatsDialog(); }},
        {t:'🚪 退出登录', c:'danger', a:()=>logout()}
    ];
    btns.forEach(({t:text,c:cls,a:action})=>{
        const btn=document.createElement('button');btn.textContent=text;
        const cs={
            add:{bg:'rgba(100,200,100,0.1)',cl:'#6dd66d',bd:'rgba(100,200,100,0.2)'},
            danger:{bg:'rgba(255,80,80,0.12)',cl:'#ff6b6b',bd:'rgba(255,80,80,0.25)'},
            api:{bg:'rgba(0,200,200,0.1)',cl:'#00c8c8',bd:'rgba(0,200,200,0.2)'},
            price:{bg:'rgba(100,150,255,0.1)',cl:'#6d9fff',bd:'rgba(100,150,255,0.25)'},
            switch:{bg:'rgba(120,80,200,0.12)',cl:'#b388ff',bd:'rgba(120,80,200,0.25)'},
            collect:{bg:'rgba(200,150,50,0.12)',cl:'#f0a500',bd:'rgba(200,150,50,0.25)'},
            sell:{bg:'rgba(0,200,100,0.12)',cl:'#00e676',bd:'rgba(0,200,100,0.25)'},
            buy:{bg:'rgba(255,152,0,0.12)',cl:'#ff9800',bd:'rgba(255,152,0,0.25)'},
            claim:{bg:'rgba(100,100,255,0.12)',cl:'#7c7cff',bd:'rgba(100,100,255,0.25)'},
            inventory:{bg:'rgba(79,195,247,0.12)',cl:'#4fc3f7',bd:'rgba(79,195,247,0.25)'},
            warehouse:{bg:'rgba(129,199,132,0.12)',cl:'#81c784',bd:'rgba(129,199,132,0.25)'},
            skill:{bg:'rgba(206,147,216,0.12)',cl:'#ce93d8',bd:'rgba(206,147,216,0.25)'},
            mprices:{bg:'rgba(100,150,255,0.12)',cl:'#6d9fff',bd:'rgba(100,150,255,0.25)'},
            stats:{bg:'rgba(240,165,0,0.12)',cl:'#f0a500',bd:'rgba(240,165,0,0.25)'},
            log:{bg:'rgba(255,255,255,0.05)',cl:'#aaa',bd:'rgba(255,255,255,0.06)'}
        };
        const s=cs[cls]||cs.log;
        btn.style.cssText=`width:100%;padding:7px 10px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold;background:${s.bg};color:${s.cl};border:1px solid ${s.bd};box-sizing:border-box;`;
        const obg=s.bg,ocl=s.cl;
        btn.onmouseover=()=>{
            const hoverMap={add:'rgba(100,200,100,0.2)','switch':'rgba(120,80,200,0.25)',collect:'rgba(200,150,50,0.25)','sell':'rgba(0,200,100,0.25)',buy:'rgba(255,152,0,0.25)','claim':'rgba(100,100,255,0.25)',inventory:'rgba(79,195,247,0.25)',warehouse:'rgba(129,199,132,0.25)',skill:'rgba(206,147,216,0.25)',mprices:'rgba(100,150,255,0.25)',stats:'rgba(240,165,0,0.25)',price:'rgba(100,150,255,0.25)',api:'rgba(0,200,200,0.2)',danger:'rgba(255,80,80,0.25)'};
            btn.style.background=hoverMap[cls]||'rgba(240,165,0,0.15)';
            const colorMap={add:'#8ae88a','switch':'#d0b0ff',collect:'#ffc107','sell':'#69f0ae',buy:'#ffb74d','claim':'#9f9fff',inventory:'#81d4fa',warehouse:'#a5d6a7',skill:'#e1bee7',mprices:'#8ab4ff',stats:'#ffc107',price:'#8ab4ff',api:'#00e8e8',danger:'#ff4444'};
            btn.style.color=colorMap[cls]||'#eee';
        };
        btn.onmouseout=()=>{btn.style.background=obg;btn.style.color=ocl};
        btn.onclick=action;
        tb.appendChild(btn);
    });
    const sr=document.createElement('div');sr.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:2px 2px 0;';
    const ss2=document.createElement('span');ss2.id='panel-status';ss2.style.cssText='color:#666;font-size:10px;';ss2.textContent='就绪';
    sr.appendChild(ss2);
    const csBox=document.createElement('span');csBox.id='cycle-status-box';csBox.style.cssText='display:none;align-items:center;gap:4px;';
    csBox.innerHTML=`<span id="cycle-info" style="color:#00c8c8;font-size:10px;"></span><button id="cycle-stop-btn" style="padding:1px 6px;border-radius:4px;cursor:pointer;font-size:9px;background:rgba(255,80,80,0.12);color:#ff6b6b;border:1px solid rgba(255,80,80,0.25);">⏹ 停止</button>`;
    sr.appendChild(csBox);
    tb.appendChild(sr);
    c.appendChild(tb);p.appendChild(c);
    function togglePanel(){isCollapsed=!isCollapsed;c.style.display=isCollapsed?'none':'block';h.style.borderBottom=isCollapsed?'none':'1px solid rgba(255,255,255,0.06)';ti.textContent=isCollapsed?'▶':'▼';setPanelCollapsed(isCollapsed)}
    ti.onclick=togglePanel;h.ondblclick=togglePanel;
    makeDraggable(p,h);
    document.body.appendChild(p);
}

function updateStatus(msg){const el=document.getElementById('panel-status');if(el)el.textContent=msg;}
function showToast(msg,color){
    const t=document.createElement('div');t.textContent=msg;
    t.style.cssText=`position:fixed;top:60px;right:10px;z-index:99999;padding:8px 16px;background:rgba(100,200,100,0.15);color:${color};border:1px solid rgba(100,200,100,0.3);border-radius:8px;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;font-weight:bold;box-shadow:0 4px 16px rgba(0,0,0,0.4);transition:opacity 0.5s;`;
    document.body.appendChild(t);setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),500)},2500)
}
let panelCreated=false;
function tryCreatePanel(){
    if(panelCreated)return;
    if(isGamePage()||isInventoryPage()){
        setTimeout(()=>{if(!panelCreated){createPanel();panelCreated=true;addInfoLog('面板已创建(游戏页)')}},1500)
    }else if(isAuthPage()){
        const hasSwitch = new URLSearchParams(window.location.search).get('switchCycle')==='1';
        const hasCollect = new URLSearchParams(window.location.search).get('collectCycle')==='1';
        const hasSell = new URLSearchParams(window.location.search).get('sellCycle')==='1';
        const hasClaim = new URLSearchParams(window.location.search).get('claimCycle')==='1';
        if(hasSwitch || hasCollect || hasSell || hasClaim){
            setTimeout(()=>{if(!panelCreated){const cf=setInterval(()=>{const{emailInput,passInput}=findInputs();if(emailInput&&passInput&&!panelCreated){clearInterval(cf);createPanel();panelCreated=true;addInfoLog('面板已创建(登录页-循环)')}},500)}},2000)
        }else{
            const cf=setInterval(()=>{const{emailInput,passInput}=findInputs();if(emailInput&&passInput&&!panelCreated){clearInterval(cf);createPanel();panelCreated=true;addInfoLog('面板已创建(登录页)')}},500);
            setTimeout(()=>{if(!panelCreated){clearInterval(cf);createPanel();panelCreated=true;addInfoLog('面板已创建(超时)')}},10000)
        }
    }
}

// ============================================================
// ★★★ 四个独立功能的运行状态 ★★★
// ============================================================
let cycleSwitchRunning = false, cycleSwitchAbort = false;
let cycleCollectRunning = false, cycleCollectAbort = false;
let cycleSellRunning = false, cycleSellAbort = false;
let cycleClaimRunning = false, cycleClaimAbort = false;
// 独立 cycle-* 文件的运行状态（由对应文件更新）
window.PI_RUNNING_STATES = { buyRunning: false, inventoryRunning: false, warehouseRunning: false, skillRunning: false };
// 共享数据统计存储（各功能完成时写入）
window.PI_STATS = { skill: null, inventory: null, warehouse: null, marketPrices: null };
var PI_STATS_KEY = 'project_idle_stats_data';
function saveStatsToDisk() {
    try { localStorage.setItem(PI_STATS_KEY, JSON.stringify(window.PI_STATS)); } catch(e) {}
}
function loadStatsFromDisk() {
    try {
        var d = JSON.parse(localStorage.getItem(PI_STATS_KEY));
        if (d) { window.PI_STATS.skill = d.skill || null; window.PI_STATS.inventory = d.inventory || null; window.PI_STATS.warehouse = d.warehouse || null; window.PI_STATS.marketPrices = d.marketPrices || null; }
    } catch(e) {}
}
loadStatsFromDisk();

function updateCycleUI(info) {
    const box = document.getElementById('cycle-status-box');
    const el = document.getElementById('cycle-info');
    const btn = document.getElementById('cycle-stop-btn');
    if (!box || !el || !btn) return;
    const isAnyRunning = cycleSwitchRunning || cycleCollectRunning || cycleSellRunning || cycleClaimRunning ||
        (window.PI_RUNNING_STATES && (window.PI_RUNNING_STATES.buyRunning || window.PI_RUNNING_STATES.inventoryRunning ||
         window.PI_RUNNING_STATES.warehouseRunning || window.PI_RUNNING_STATES.skillRunning));
    if (isAnyRunning) {
        box.style.display = 'inline-flex';
        el.textContent = info || '运行中...';
        btn.onclick = () => {
            if (cycleSwitchRunning) { stopCycleSwitch(); addInfoLog('🔄 循环切号已手动停止'); }
            if (cycleCollectRunning) { stopCycleCollect(); addInfoLog('⛏️ 循环采集已手动停止'); }
            if (cycleSellRunning) { stopCycleSell(); addInfoLog('💰 循环出售已手动停止'); }
            if (cycleClaimRunning) { stopCycleClaim(); addInfoLog('📦 循环领取已手动停止'); }
            if (window.PI_RUNNING_STATES) {
                if (window.PI_RUNNING_STATES.buyRunning && typeof stopCb === 'function') { stopCb(); addInfoLog('💰 循环购买已手动停止'); }
                if (window.PI_RUNNING_STATES.inventoryRunning && typeof stopCi === 'function') { stopCi(); addInfoLog('🎒 检测背包已手动停止'); }
                if (window.PI_RUNNING_STATES.warehouseRunning && typeof stopCw === 'function') { stopCw(); addInfoLog('🏪 检测仓库已手动停止'); }
                if (window.PI_RUNNING_STATES.skillRunning && typeof stopCsl === 'function') { stopCsl(); addInfoLog('📊 检测技能等级已手动停止'); }
            }
        };
    } else {
        box.style.display = 'none';
        el.textContent = '';
    }
}
function updateStatusWithCycle(msg) { updateStatus(msg); updateCycleUI(msg); }

// ============================================================
// ★★★ 🔄 循环切号（独立功能1）★★★
// ============================================================
function getCycleSwitchState() { return storageGet(SK.CYCLE_SWITCH_STATE, null); }
function saveCycleSwitchState(s) { storageSet(SK.CYCLE_SWITCH_STATE, s); }
function clearCycleSwitchState() { localStorage.removeItem(SK.CYCLE_SWITCH_STATE); }
function stopCycleSwitch() { cycleSwitchAbort = true; cycleSwitchRunning = false; clearCycleSwitchState(); updateCycleUI(''); updateStatus('⏹ 循环切号已停止'); }

// ============================================================
// ★★★ ⛏️ 循环采集（独立功能2）★★★
// ============================================================
function getCycleCollectState() { return storageGet(SK.CYCLE_COLLECT_STATE, null); }
function saveCycleCollectState(s) { storageSet(SK.CYCLE_COLLECT_STATE, s); }
function clearCycleCollectState() { localStorage.removeItem(SK.CYCLE_COLLECT_STATE); }
function stopCycleCollect() { cycleCollectAbort = true; cycleCollectRunning = false; clearCycleCollectState(); updateCycleUI(''); updateStatus('⏹ 循环采集已停止'); }

// ============================================================
// ★★★ 💰 循环出售（独立功能3）★★★
// ============================================================
function getCycleSellState() { return storageGet(SK.CYCLE_SELL_STATE, null); }
function saveCycleSellState(s) { storageSet(SK.CYCLE_SELL_STATE, s); }
function clearCycleSellState() { localStorage.removeItem(SK.CYCLE_SELL_STATE); }
function stopCycleSell() { cycleSellAbort = true; cycleSellRunning = false; clearCycleSellState(); updateCycleUI(''); updateStatus('⏹ 循环出售已停止'); }

// ============================================================
// ★★★ 📦 循环领取收购订单（独立功能4）★★★
// ============================================================
function getCycleClaimState() { return storageGet(SK.CYCLE_CLAIM_STATE, null); }
function saveCycleClaimState(s) { storageSet(SK.CYCLE_CLAIM_STATE, s); }
function clearCycleClaimState() { localStorage.removeItem(SK.CYCLE_CLAIM_STATE); }

function stopCycleClaim() {
    cycleClaimAbort = true; cycleClaimRunning = false;
    clearCycleClaimState();
    updateCycleUI(''); updateStatus('⏹ 循环领取已停止');
}

function showCycleClaimDialog() {
    if (cycleClaimRunning) { if (!confirm('📦 循环领取正在运行，是否先停止？')) return; stopCycleClaim(); setTimeout(() => showCycleClaimDialog(), 300); return; }
    const token = getAuthToken();
    if (!token) { alert('❌ 请先登录游戏后再使用循环领取'); return; }
    const AG = getAllAccountGroups();
    const gnList = Object.keys(AG).filter(gn => AG[gn] && AG[gn].length > 0);
    if (gnList.length === 0) { alert('❌ 没有可用的账号分组'); return; }
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:100012;display:flex;align-items:center;justify-content:center;';
    const dlg = document.createElement('div');
    dlg.style.cssText = 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:22px;width:460px;max-width:90vw;box-shadow:0 16px 48px rgba(0,0,0,0.6);color:#eee;font-family:\'Segoe UI\',Arial,sans-serif;font-size:13px;max-height:85vh;overflow-y:auto;';
    let groupHTML = '';
    gnList.forEach(gn => { const dgn = getDisplayGroupName(gn); groupHTML += `<label style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;"><input type="checkbox" class="cc-group-cb" value="${gn}" checked style="accent-color:#7c7cff;"><span>${dgn} <span style="color:#888;font-size:11px;">(${AG[gn].length})</span></span></label>`; });
    dlg.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-weight:bold;color:#7c7cff;font-size:15px;">📦 循环领取收购订单</span>
            <span id="ccl-close" style="cursor:pointer;color:#888;font-size:18px;">✕</span>
        </div>
        <div style="margin-bottom:12px;">
            <div style="color:#aaa;font-size:12px;margin-bottom:6px;">① 选择要领取的账号分组：</div>
            <div style="max-height:120px;overflow-y:auto;background:rgba(0,0,0,0.2);border-radius:8px;padding:8px 10px;font-size:12px;">${groupHTML}</div>
        </div>
        <div style="margin-bottom:12px;">
            <label style="color:#aaa;font-size:11px;">② 循环轮数（0=无限）：</label>
            <input id="ccl-rounds" type="number" value="0" min="0" max="999" style="width:100%;padding:6px;background:rgba(255,255,255,0.06);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:6px;box-sizing:border-box;font-size:12px;margin-top:4px;">
        </div>
        <div style="color:#888;font-size:10px;background:rgba(0,0,0,0.15);border-radius:6px;padding:6px 8px;margin-bottom:12px;line-height:1.5;">
            📋 流程：登录 → 查询所有买入订单 → 领取已成交的物品（pendingItems>0）→ 退出 → 登录下一个账号 → 循环
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button id="ccl-cancel" style="padding:6px 16px;background:rgba(255,255,255,0.06);color:#aaa;border:1px solid rgba(255,255,255,0.1);border-radius:6px;cursor:pointer;font-size:12px;">取消</button>
            <button id="ccl-start" style="padding:6px 16px;background:rgba(100,100,255,0.15);color:#7c7cff;border:1px solid #7c7cff;border-radius:6px;cursor:pointer;font-weight:bold;font-size:12px;">📦 开始循环领取</button>
        </div>`;
    overlay.appendChild(dlg); document.body.appendChild(overlay);
    const close = () => overlay.remove();
    dlg.querySelector('#ccl-close').onclick = close; dlg.querySelector('#ccl-cancel').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    dlg.querySelector('#ccl-start').onclick = () => {
        const checkedCbs = dlg.querySelectorAll('.cc-group-cb:checked');
        if (checkedCbs.length === 0) { alert('⚠️ 请至少选择一个分组'); return; }
        const selectedGroups = []; checkedCbs.forEach(cb => selectedGroups.push(cb.value));
        const allAccs = []; selectedGroups.forEach(gn => { if (AG[gn]) AG[gn].forEach(a => { if (a && a.email) allAccs.push(a); }); });
        if (allAccs.length === 0) { alert('❌ 选中分组中没有账号'); return; }
        const rounds = parseInt(dlg.querySelector('#ccl-rounds').value) || 0;
        close();
        const state = { accounts: allAccs, currentIdx: 0, maxRounds: rounds, round: 1, active: true, startTime: Date.now() };
        saveCycleClaimState(state);
        setTimeout(() => {
            if (isAuthPage()) {
                cycleClaimRunning = true; cycleClaimAbort = false;
                addInfoLog(`📦 循环领取启动: ${allAccs.length}个账号, 轮数${rounds||'无限'}`);
                updateStatusWithCycle(`📦 启动中...`);
                switchAccount(allAccs[0]);
            } else { clearSiteAuth(); window.location.href = 'https://idle.charsgame.com/auth?claimCycle=1'; }
        }, 200);
    };
}

function checkCycleClaimOnAuthPage() {
    const p = new URLSearchParams(window.location.search);
    if (p.get('claimCycle') !== '1') return false;
    const state = getCycleClaimState();
    if (!state || !state.active) return false;
    cycleClaimRunning = true; cycleClaimAbort = false;
    const currentAcc = state.accounts[state.currentIdx];
    if (!currentAcc) { clearCycleClaimState(); cycleClaimRunning = false; return false; }
    addInfoLog(`📦 循环领取自动登录: ${getDisplayAccountName(currentAcc.email, currentAcc.name)} (${state.currentIdx+1}/${state.accounts.length})`);
    updateStatusWithCycle(`📦 登录 ${getDisplayAccountName(currentAcc.email, currentAcc.name)}...`);
    setTimeout(async () => {
        let retries = 0;
        const tryFill = async () => {
            const { emailInput, passInput } = findInputs();
            if (emailInput && passInput) {
                await fillInput(emailInput, currentAcc.email); await sleep(100);
                await fillInput(passInput, currentAcc.password); await sleep(200);
                updateStatusWithCycle(`📦 登录中...`);
                await sleep(300); await submitLogin();
                addInfoLog(`📦 登录成功`);
            } else if (retries < 30) { retries++; setTimeout(tryFill, 500); }
            else { addErrorLog('循环领取：等待登录表单超时'); updateStatusWithCycle('❌ 登录超时'); }
        };
        tryFill();
    }, 1000);
    return true;
}

async function autoCollectOrders() {
    try {
        const orders = await fetchMyOrders();
        if (!orders || orders.length === 0) { addInfoLog('📦 没有待领取的订单'); updateStatusWithCycle('📦 无待领取订单'); return; }
        const claimable = orders.filter(o => o.type === 'buy' && o.status === 'filled' && (o.pendingItems || 0) > 0);
        if (claimable.length === 0) { addInfoLog('📦 没有已成交未领取的买入订单'); updateStatusWithCycle('📦 无待领取订单'); return; }
        addInfoLog(`📦 找到 ${claimable.length} 个可领取的订单`);
        for (const order of claimable) {
            if (cycleClaimAbort) { addInfoLog('📦 领取已中止'); return; }
            const itemName = getItemName(order.itemId);
            addInfoLog(`📦 领取订单 #${order.id}: ${itemName} x${order.pendingItems}`);
            updateStatusWithCycle(`📦 领取 ${itemName} x${order.pendingItems}...`);
            const result = await collectOrderItems(order.id);
            if (result && result.code === 20000) {
                addInfoLog(`✅ 领取成功: ${itemName} x${result.data?.collectedQty || order.pendingItems}`);
            } else {
                addErrorLog(`❌ 领取失败: ${itemName}`, result?.message || '未知错误');
            }
            await sleep(500);
        }
        addInfoLog(`📦 全部领取完成: ${claimable.length}个订单`);
    } catch(e) {
        addErrorLog('📦 领取过程出错', e.message);
    }
}

function checkCycleClaimOnGamePage() {
    const state = getCycleClaimState();
    if (!state || !state.active) return;
    cycleClaimRunning = true; cycleClaimAbort = false;
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/game/inventory') && !isGamePage()) {
        addInfoLog(`📦 跳转到游戏页...`);
        updateStatusWithCycle(`📦 跳转...`);
        window.location.href = 'https://idle.charsgame.com/game/inventory?claimCycle=1';
        return;
    }
    const currentAcc = state.accounts[state.currentIdx];
    addInfoLog(`📦 开始领取: ${getDisplayAccountName(currentAcc.email, currentAcc.name)}`);
    updateStatusWithCycle(`📦 开始领取...`);
    autoCollectOrders().then(() => {
        addInfoLog(`📦 领取完成: ${getDisplayAccountName(currentAcc.email, currentAcc.name)}`);
        const nextIdx = state.currentIdx + 1;
        let nextRound = state.round;
        if (nextIdx >= state.accounts.length) {
            if (state.maxRounds > 0 && nextRound >= state.maxRounds) {
                addInfoLog(`📦 循环领取完成，共运行 ${nextRound} 轮`);
                updateStatusWithCycle(`✅ 领取完成 (${nextRound}轮)`);
                clearCycleClaimState(); cycleClaimRunning = false;
                setTimeout(() => updateStatus('就绪'), 3000);
                return;
            }
            nextRound++;
            addInfoLog(`📦 第 ${nextRound-1} 轮完成，进入第 ${nextRound} 轮`);
        }
        const nextAccount = state.accounts[nextIdx % state.accounts.length];
        state.currentIdx = nextIdx % state.accounts.length;
        state.round = nextRound;
        saveCycleClaimState(state);
        addInfoLog(`📦 切换到: ${getDisplayAccountName(nextAccount.email, nextAccount.name)}`);
        updateStatusWithCycle(`📦 切换账号...`);
        setTimeout(() => { clearSiteAuth(); window.location.href = 'https://idle.charsgame.com/auth?claimCycle=1'; }, 500);
    });
}

// ============================================================
// ★★★ SPA 路由变化检测 + 初始化 ★★★
// ============================================================
let lastPath = window.location.pathname;
let lastSearch = window.location.search;
window.addEventListener('popstate', onUrlChange);
const origPush = history.pushState;
const origReplace = history.replaceState;
history.pushState = function(...args) { origPush.apply(this, args); onUrlChange(); };
history.replaceState = function(...args) { origReplace.apply(this, args); onUrlChange(); };
function onUrlChange() {
    const curPath = window.location.pathname;
    const curSearch = window.location.search;
    if (curPath !== lastPath || curSearch !== lastSearch) { const oldPath = lastPath; lastPath = curPath; lastSearch = curSearch; handleRouteChange(oldPath); }
}
setInterval(() => {
    const curPath = window.location.pathname;
    const curSearch = window.location.search;
    if (curPath !== lastPath || curSearch !== lastSearch) { const oldPath = lastPath; lastPath = curPath; lastSearch = curSearch; handleRouteChange(oldPath); }
}, 1000);
function handleRouteChange(oldPath) {
    addInfoLog(`📄 路由变化: ${oldPath || '?'} → ${window.location.pathname}`);
    if (isGamePage() || isInventoryPage()) {
        if (!panelCreated) { panelCreated = false; panelRef = null; setTimeout(() => tryCreatePanel(), 500); }
        const swState = getCycleSwitchState();
        const ccState = getCycleCollectState();
        const csState = getCycleSellState();
        const clState = getCycleClaimState();
        if (swState && swState.active) { setTimeout(() => checkCycleSwitchOnGamePage(), 1500); }
        else if (ccState && ccState.active) { setTimeout(() => checkCycleCollectOnGamePage(), 1500); }
        else if (csState && csState.active) { setTimeout(() => checkCycleSellOnGamePage(), 1500); }
        else if (clState && clState.active) { setTimeout(() => checkCycleClaimOnGamePage(), 1500); }
    } else if (isAuthPage()) {
        if (!panelCreated) { panelCreated = false; panelRef = null; setTimeout(() => tryCreatePanel(), 500); }
        checkCycleSwitchOnAuthPage();
        checkCycleCollectOnAuthPage();
        checkCycleSellOnAuthPage();
        checkCycleClaimOnAuthPage();
    }
}

if (isAuthPage()) {
    checkCycleSwitchOnAuthPage();
    checkCycleCollectOnAuthPage();
    checkCycleSellOnAuthPage();
    checkCycleClaimOnAuthPage();
} else if (isGamePage() || isInventoryPage()) {
    setTimeout(() => {
        checkCycleSwitchOnGamePage();
        checkCycleCollectOnGamePage();
        checkCycleSellOnGamePage();
        checkCycleClaimOnGamePage();
    }, 2000);
}

tryCreatePanel();
const ob = new MutationObserver(() => {
    if (!panelCreated) { tryCreatePanel(); return; }
    if (panelRef && !document.getElementById('account-panel-enhanced')) { panelRef = null; panelCreated = false; tryCreatePanel(); }
});
ob.observe(document.body, { childList: true, subtree: true });

// ============================================================
// ★★★ 📋 操作日志窗口（可拖动+可调整大小）★★★
// ============================================================
var PI_LOG_WINDOW = null;

function toggleLogWindow() {
    if (PI_LOG_WINDOW) {
        var show = PI_LOG_WINDOW.style.display === 'none';
        PI_LOG_WINDOW.style.display = show ? 'flex' : 'none';
        try { localStorage.setItem('pi_log_window_open', show ? 'true' : 'false'); } catch(e) {}
        return;
    }
    createLogWindow();
}
function closeLogWindow() {
    if (PI_LOG_WINDOW) { PI_LOG_WINDOW.style.display = 'none'; }
    try { localStorage.setItem('pi_log_window_open', 'false'); } catch(e) {}
}
function createLogWindow() {
    if (document.getElementById('pi-log-window')) { document.getElementById('pi-log-window').style.display = 'flex'; return; }
    var w = document.createElement('div');
    w.id = 'pi-log-window';
    w.style.cssText = 'position:fixed;top:60px;right:80px;z-index:100000;width:500px;height:350px;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:1px solid rgba(255,255,255,0.12);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,0.6);color:#eee;font-family:\'Segoe UI\',Arial,sans-serif;font-size:12px;display:flex;flex-direction:column;overflow:hidden;resize:both;min-width:300px;min-height:200px;';
    var h = document.createElement('div');
    h.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:rgba(0,0,0,0.3);border-bottom:1px solid rgba(255,255,255,0.06);cursor:move;flex-shrink:0;user-select:none;';
    h.innerHTML = '<span style="font-weight:bold;color:#f0a500;font-size:13px;">📋 操作日志</span><span id="plw-close" style="cursor:pointer;color:#888;font-size:16px;padding:0 4px;">✕</span>';
    w.appendChild(h);
    var b = document.createElement('div');
    b.id = 'plw-body';
    b.style.cssText = 'flex:1;overflow-y:auto;padding:6px 8px;font-size:11px;font-family:monospace;line-height:1.5;scrollbar-width:thin;';
    b.innerHTML = '<div style="color:#888;text-align:center;padding:20px;font-family:\'Segoe UI\',Arial,sans-serif;">等待日志...</div>';
    w.appendChild(b);
    var f = document.createElement('div');
    f.style.cssText = 'display:flex;gap:4px;padding:4px 8px;border-top:1px solid rgba(255,255,255,0.05);flex-shrink:0;background:rgba(0,0,0,0.15);';
    f.innerHTML = '<span style="color:#888;font-size:10px;"><span style="color:#6dd66d;">●</span> 成功 <span style="color:#f0a500;margin-left:6px;">●</span> 运行中 <span style="color:#ff6b6b;margin-left:6px;">●</span> 失败</span><button id="plw-clear" style="margin-left:auto;padding:1px 8px;border-radius:3px;cursor:pointer;font-size:9px;background:rgba(255,80,80,0.1);color:#ff6b6b;border:1px solid rgba(255,80,80,0.2);">清除</button>';
    w.appendChild(f);
    document.body.appendChild(w);

    // 拖拽
    makeDraggable(w, h);

    // 关闭
    w.querySelector('#plw-close').onclick = function() { w.style.display = 'none'; try { localStorage.setItem('pi_log_window_open', 'false'); } catch(e) {} };
    w.querySelector('#plw-clear').onclick = function() { clearLogs(); w.querySelector('#plw-body').innerHTML = "<div style=\"color:#888;text-align:center;padding:20px;font-family:'Segoe UI',Arial,sans-serif;\">日志已清除</div>"; };

    // 标记已打开
    try { localStorage.setItem('pi_log_window_open', 'true'); } catch(e) {}

    // 实时刷新
    var refreshTimer = setInterval(function() {
        if (!document.getElementById('pi-log-window') || w.style.display === 'none') { clearInterval(refreshTimer); return; }
        renderLogsToWindow(w);
    }, 1500);
    setTimeout(function() { renderLogsToWindow(w); }, 200);
}

function renderLogsToWindow(w) {
    var logs = getLogs();
    var body = w.querySelector('#plw-body');
    if (!body || !logs.length) { body.innerHTML = '<div style="color:#888;text-align:center;padding:20px;font-family:\'Segoe UI\',Arial,sans-serif;">暂无日志</div>'; return; }
    var reversed = logs.slice().reverse().slice(0, 100);
    var html = '';
    reversed.forEach(function(l) {
        var color = l.level === 'ERROR' ? '#ff6b6b' : l.level === 'WARN' ? '#f0a500' : '#6dd66d';
        var msg = l.message || '';
        var time = (l.timeStr || '').slice(-8);
        // 提取账号名
        var accMatch = msg.match(/(?:[:：])\s*([^：:：()（）\s]+?)/);
        var accName = accMatch ? accMatch[1].trim() : '';
        var statusDot = l.level === 'ERROR' ? '<span style="color:#ff6b6b;">✕</span>' : (l.level === 'WARN' ? '<span style="color:#f0a500;">⚠</span>' : '<span style="color:#6dd66d;">●</span>');
        html += '<div style="display:flex;gap:4px;padding:2px 4px;border-bottom:1px solid rgba(255,255,255,0.03);">';
        html += '<span style="color:#555;flex-shrink:0;width:50px;">' + time + '</span>';
        if (accName) html += '<span style="color:#f0a500;flex-shrink:0;font-weight:bold;width:70px;overflow:hidden;text-overflow:ellipsis;" title="' + accName + '">' + accName + '</span>';
        html += '<span style="color:' + color + ';flex-shrink:0;">' + statusDot + '</span>';
        html += '<span style="color:#ddd;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + msg.replace(/"/g,'&quot;') + '">' + msg + '</span>';
        if (l.data) html += '<span style="color:#888;flex-shrink:0;font-size:9px;max-width:100px;overflow:hidden;text-overflow:ellipsis;">' + l.data + '</span>';
        html += '</div>';
    });
    body.innerHTML = html;
    // 清理太老的日志防止内存问题
    var allLogs = getLogs();
    if (allLogs.length > 500) { saveLogs(allLogs.slice(-300)); }
}

// ★★★ 面板显示切换 ★★★
var PANEL_VISIBLE = true;
function toggleAccountPanel() {
    var panel = document.getElementById('account-panel-enhanced');
    if (!panel) { tryCreatePanel(); return; }
    PANEL_VISIBLE = !PANEL_VISIBLE;
    panel.style.display = PANEL_VISIBLE ? '' : 'none';
    showToast(PANEL_VISIBLE ? '✅ 面板已显示' : '✅ 面板已隐藏', '#f0a500');
}

// ★★★ 浮动按钮 ★★★
// ============================================================
function createPiFloatBtn(id, emoji, cls, clickFn, bottom) {
    let btn = document.getElementById(id);
    if (btn) return;
    btn = document.createElement('div');
    btn.id = id;
    btn.textContent = emoji;
    btn.className = 'pi-float-btn ' + cls;
    btn.style.right = '20px';
    btn.style.bottom = bottom;
    btn.title = emoji + ' ' + (cls.includes('switch') ? '循环切号' : cls.includes('collect') ? '循环采集' : cls.includes('claim') ? '循环领取' : cls.includes('skill') ? '检测技能等级' : cls.includes('market') ? '全量市场价格' : cls.includes('stats') ? '数据统计' : cls.includes('addacc') ? '添加账号' : cls.includes('log') ? '操作日志' : cls.includes('panel') ? '显示/隐藏面板' : '');
    btn.addEventListener('click', clickFn);
    document.body.appendChild(btn);
}

function ensurePiFloatBtns() {
    if (isAuthPage() || isGamePage() || isInventoryPage()) {
        createPiFloatBtn('pi-float-switch', '🔄', 'pi-float-btn-switch', () => { if (typeof showCycleSwitchDialog === 'function') showCycleSwitchDialog(); }, '76px');
        createPiFloatBtn('pi-float-collect', '⛏️', 'pi-float-btn-collect', () => { if (typeof showCycleCollectDialog === 'function') showCycleCollectDialog(); }, '132px');
        createPiFloatBtn('pi-float-claim', '📦', 'pi-float-btn-claim', () => { if (typeof showCycleClaimDialog === 'function') showCycleClaimDialog(); }, '244px');
        createPiFloatBtn('pi-float-market', '💹', 'pi-float-btn-market', () => { showMarketPriceDialog(); }, '468px');
        createPiFloatBtn('pi-float-stats', '📊', 'pi-float-btn-stats', () => { showStatsDialog(); }, '524px');
        createPiFloatBtn('pi-float-addacc', '➕', 'pi-float-btn-addacc', () => { if (typeof showAddAccountDialog === 'function') showAddAccountDialog(); }, '580px');
        createPiFloatBtn('pi-float-log', '📋', 'pi-float-btn-log', () => { toggleLogWindow(); }, '636px');
        createPiFloatBtn('pi-float-panel', '🪟', 'pi-float-btn-panel', () => { toggleAccountPanel(); }, '692px');
    }
}

// 初始创建 + 观察 DOM 变化确保按钮存在
setTimeout(ensurePiFloatBtns, 2000);
setInterval(ensurePiFloatBtns, 3000);

// 自动恢复操作日志窗口（跨页面切换）
setTimeout(function() {
    try {
        if (localStorage.getItem('pi_log_window_open') === 'true' && !document.getElementById('pi-log-window')) {
            createLogWindow();
        }
    } catch(e) {}
}, 3000);

addInfoLog('脚本已加载(扩展版)', { version: '11.0-ext' });
// ============================================================
// ★★★ 与 popup 通信的消息监听器 ★★★
// ============================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        switch (message.action) {
            case 'getStatus':
                sendResponse({
                    success: true,
                    states: {
                        panelLoaded: !!panelRef,
                        switchRunning: !!cycleSwitchRunning,
                        collectRunning: !!cycleCollectRunning,
                        sellRunning: !!cycleSellRunning,
                        claimRunning: !!cycleClaimRunning,
                        buyRunning: !!(window.PI_RUNNING_STATES && window.PI_RUNNING_STATES.buyRunning),
                        inventoryRunning: !!(window.PI_RUNNING_STATES && window.PI_RUNNING_STATES.inventoryRunning),
                        warehouseRunning: !!(window.PI_RUNNING_STATES && window.PI_RUNNING_STATES.warehouseRunning),
                        skillRunning: !!(window.PI_RUNNING_STATES && window.PI_RUNNING_STATES.skillRunning)
                    }
                });
                break;
            case 'showCycleSwitch':
                if (typeof showCycleSwitchDialog === 'function') showCycleSwitchDialog();
                sendResponse({ success: true });
                break;
            case 'showCycleCollect':
                if (typeof showCycleCollectDialog === 'function') showCycleCollectDialog();
                sendResponse({ success: true });
                break;
            case 'showCycleSell':
                if (typeof showCycleSellDialog === 'function') showCycleSellDialog();
                sendResponse({ success: true });
                break;
            case 'showCycleClaim':
                if (typeof showCycleClaimDialog === 'function') showCycleClaimDialog();
                sendResponse({ success: true });
                break;
            case 'showCycleBuy':
                if (typeof showCbDialog === 'function') showCbDialog();
                sendResponse({ success: true });
                break;
            case 'showCycleInventory':
                if (typeof showCiDialog === 'function') showCiDialog();
                sendResponse({ success: true });
                break;
            case 'showCycleWarehouse':
                if (typeof showCwDialog === 'function') showCwDialog();
                sendResponse({ success: true });
                break;
            case 'showCycleSkill':
                if (typeof showCslDialog === 'function') showCslDialog();
                sendResponse({ success: true });
                break;
            case 'showMarketPrices':
                if (typeof showMarketPriceDialog === 'function') showMarketPriceDialog();
                sendResponse({ success: true });
                break;
            case 'showStats':
                if (typeof showStatsDialog === 'function') showStatsDialog();
                sendResponse({ success: true });
                break;
            case 'reloadPanel':
                rebuildPanel();
                sendResponse({ success: true });
                break;
            case 'showToken':
                if (typeof showTokenDialog === 'function') showTokenDialog();
                sendResponse({ success: true });
                break;
            case 'showLogs':
                if (typeof showLogsDialog === 'function') showLogsDialog();
                sendResponse({ success: true });
                break;
            case 'logout':
                if (typeof logout === 'function') logout();
                sendResponse({ success: true });
                break;
            default:
                sendResponse({ success: false, error: '未知操作' });
        }
    } catch(e) {
        sendResponse({ success: false, error: e.message });
    }
    return true; // 保持消息通道开放
});

console.log('[ProjectIdle] 🚀 v11.0-ext 已加载（四个独立功能: 循环切号 / 循环采集 / 循环出售 / 循环领取）');
// ============================================================
// ★★★ 🔄 循环切号（独立功能1）- 完整实现 ★★★
// ============================================================

function showCycleSwitchDialog() {
    if (cycleSwitchRunning) {
        if (!confirm('🔄 循环切号正在运行，是否先停止？')) return;
        stopCycleSwitch(); setTimeout(() => showCycleSwitchDialog(), 300); return;
    }
    const AG = getAllAccountGroups();
    const gnList = Object.keys(AG).filter(gn => AG[gn] && AG[gn].length > 0);
    if (gnList.length === 0) { alert('❌ 没有可用的账号分组'); return; }
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:100012;display:flex;align-items:center;justify-content:center;';
    const dlg = document.createElement('div');
    dlg.style.cssText = 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:22px;width:460px;max-width:90vw;box-shadow:0 16px 48px rgba(0,0,0,0.6);color:#eee;font-family:\'Segoe UI\',Arial,sans-serif;font-size:13px;max-height:85vh;overflow-y:auto;';
    let groupHTML = '';
    gnList.forEach(gn => { const dgn = getDisplayGroupName(gn); groupHTML += `<label style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;"><input type="checkbox" class="switch-group-cb" value="${gn}" checked style="accent-color:#b388ff;"><span>${dgn} <span style="color:#888;font-size:11px;">(${AG[gn].length})</span></span></label>`; });
    dlg.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-weight:bold;color:#b388ff;font-size:15px;">🔄 循环切号</span>
            <span id="cs-close" style="cursor:pointer;color:#888;font-size:18px;">✕</span>
        </div>
        <div style="margin-bottom:12px;">
            <div style="color:#aaa;font-size:12px;margin-bottom:6px;">① 选择要循环的账号分组：</div>
            <div style="max-height:140px;overflow-y:auto;background:rgba(0,0,0,0.2);border-radius:8px;padding:8px 10px;font-size:12px;">${groupHTML}</div>
        </div>
        <div style="margin-bottom:12px;">
            <label style="color:#aaa;font-size:11px;">② 每个账号停留时间（秒）：</label>
            <input id="cs-interval" type="number" value="30" min="3" max="3600" style="width:100%;padding:6px;background:rgba(255,255,255,0.06);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:6px;box-sizing:border-box;font-size:12px;margin-top:4px;">
        </div>
        <div style="margin-bottom:12px;">
            <label style="color:#aaa;font-size:11px;">③ 循环轮数（0=无限）：</label>
            <input id="cs-rounds" type="number" value="0" min="0" max="999" style="width:100%;padding:6px;background:rgba(255,255,255,0.06);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:6px;box-sizing:border-box;font-size:12px;margin-top:4px;">
        </div>
        <div style="color:#888;font-size:10px;background:rgba(0,0,0,0.15);border-radius:6px;padding:6px 8px;margin-bottom:12px;line-height:1.5;">
            📋 流程：登录 → 等待设定时间 → 退出 → 登录下一个账号 → 循环
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button id="cs-cancel" style="padding:6px 16px;background:rgba(255,255,255,0.06);color:#aaa;border:1px solid rgba(255,255,255,0.1);border-radius:6px;cursor:pointer;font-size:12px;">取消</button>
            <button id="cs-start" style="padding:6px 16px;background:rgba(120,80,200,0.15);color:#b388ff;border:1px solid #b388ff;border-radius:6px;cursor:pointer;font-weight:bold;font-size:12px;">🔄 开始循环切号</button>
        </div>`;
    overlay.appendChild(dlg); document.body.appendChild(overlay);
    const close = () => overlay.remove();
    dlg.querySelector('#cs-close').onclick = close; dlg.querySelector('#cs-cancel').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    dlg.querySelector('#cs-start').onclick = () => {
        const checkedCbs = dlg.querySelectorAll('.switch-group-cb:checked');
        if (checkedCbs.length === 0) { alert('⚠️ 请至少选择一个分组'); return; }
        const selectedGroups = []; checkedCbs.forEach(cb => selectedGroups.push(cb.value));
        const allAccs = []; selectedGroups.forEach(gn => { if (AG[gn]) AG[gn].forEach(a => { if (a && a.email) allAccs.push(a); }); });
        if (allAccs.length === 0) { alert('❌ 选中分组中没有账号'); return; }
        const interval = parseInt(dlg.querySelector('#cs-interval').value) || 30;
        if (interval < 3) { alert('⚠️ 停留时间不能少于3秒'); return; }
        const rounds = parseInt(dlg.querySelector('#cs-rounds').value) || 0;
        close();
        const state = { accounts: allAccs, currentIdx: 0, intervalSec: interval, maxRounds: rounds, round: 1, active: true, startTime: Date.now() };
        saveCycleSwitchState(state);
        setTimeout(() => {
            if (isAuthPage()) {
                cycleSwitchRunning = true; cycleSwitchAbort = false;
                addInfoLog(`🔄 循环切号启动: ${allAccs.length}个账号, 每账号${interval}秒, 轮数${rounds||'无限'}`);
                updateStatusWithCycle(`🔄 启动中...`);
                switchAccount(allAccs[0]);
            } else { clearSiteAuth(); window.location.href = 'https://idle.charsgame.com/auth?switchCycle=1'; }
        }, 200);
    };
}

function checkCycleSwitchOnAuthPage() {
    const p = new URLSearchParams(window.location.search);
    if (p.get('switchCycle') !== '1') return false;
    const state = getCycleSwitchState();
    if (!state || !state.active) return false;
    cycleSwitchRunning = true; cycleSwitchAbort = false;
    const currentAcc = state.accounts[state.currentIdx];
    if (!currentAcc) { clearCycleSwitchState(); cycleSwitchRunning = false; return false; }
    addInfoLog(`🔄 循环切号自动登录: ${getDisplayAccountName(currentAcc.email, currentAcc.name)} (${state.currentIdx+1}/${state.accounts.length})`);
    updateStatusWithCycle(`🔄 登录 ${getDisplayAccountName(currentAcc.email, currentAcc.name)}...`);
    setTimeout(async () => {
        let retries = 0;
        const tryFill = async () => {
            const { emailInput, passInput } = findInputs();
            if (emailInput && passInput) {
                await fillInput(emailInput, currentAcc.email); await sleep(100);
                await fillInput(passInput, currentAcc.password); await sleep(200);
                updateStatusWithCycle(`🔄 登录中...`);
                await sleep(300); await submitLogin();
                addInfoLog(`🔄 登录成功`);
            } else if (retries < 30) { retries++; setTimeout(tryFill, 500); }
            else { addErrorLog('循环切号：等待登录表单超时'); updateStatusWithCycle('❌ 登录超时'); }
        };
        tryFill();
    }, 1000);
    return true;
}

function checkCycleSwitchOnGamePage() {
    const state = getCycleSwitchState();
    if (!state || !state.active) return;
    cycleSwitchRunning = true; cycleSwitchAbort = false;
    const intervalSec = state.intervalSec || 30;
    const currentIdx = state.currentIdx || 0;
    const accounts = state.accounts || [];
    if (accounts.length === 0 || currentIdx >= accounts.length) {
        addErrorLog('循环切号状态异常'); clearCycleSwitchState(); cycleSwitchRunning = false; return;
    }
    const currentAcc = accounts[currentIdx];
    addInfoLog(`🔄 循环切号: ${getDisplayAccountName(currentAcc.email, currentAcc.name)} 登录成功, 等待 ${intervalSec}秒`);
    updateStatusWithCycle(`🔄 ${getDisplayAccountName(currentAcc.email, currentAcc.name)} (${intervalSec}秒)`);
    let elapsed = 0;
    const checkInterval = setInterval(() => {
        if (cycleSwitchAbort) { clearInterval(checkInterval); cycleSwitchRunning = false; updateCycleUI(''); updateStatus('⏹ 已停止'); return; }
        elapsed++;
        const remain = intervalSec - elapsed;
        if (remain <= 0) {
            clearInterval(checkInterval);
            const nextIdx = currentIdx + 1;
            let nextRound = state.round;
            if (nextIdx >= accounts.length) {
                if (state.maxRounds > 0 && nextRound >= state.maxRounds) {
                    addInfoLog(`🔄 循环切号完成，共运行 ${nextRound} 轮`);
                    updateStatusWithCycle(`✅ 全部完成 (${nextRound}轮)`);
                    clearCycleSwitchState(); cycleSwitchRunning = false;
                    setTimeout(() => updateStatus('就绪'), 3000);
                    return;
                }
                nextRound++;
                addInfoLog(`🔄 第 ${nextRound-1} 轮完成，进入第 ${nextRound} 轮`);
            }
            const nextAccount = accounts[nextIdx % accounts.length];
            state.currentIdx = nextIdx % accounts.length;
            state.round = nextRound;
            saveCycleSwitchState(state);
            addInfoLog(`🔄 切换到: ${getDisplayAccountName(nextAccount.email, nextAccount.name)}`);
            updateStatusWithCycle(`🔄 切换账号...`);
            setTimeout(() => { clearSiteAuth(); window.location.href = 'https://idle.charsgame.com/auth?switchCycle=1'; }, 500);
        } else {
            updateStatusWithCycle(`🔄 ${getDisplayAccountName(currentAcc.email, currentAcc.name)} (${remain}秒)`);
        }
    }, 1000);
}

// ============================================================
// ★★★ ⛏️ 循环采集（独立功能2）- 完整实现 ★★★
// ============================================================

function showCycleCollectDialog() {
    if (cycleCollectRunning) {
        if (!confirm('⛏️ 循环采集正在运行，是否先停止？')) return;
        stopCycleCollect(); setTimeout(() => showCycleCollectDialog(), 300); return;
    }
    const AG = getAllAccountGroups();
    const gnList = Object.keys(AG).filter(gn => AG[gn] && AG[gn].length > 0);
    if (gnList.length === 0) { alert('❌ 没有可用的账号分组'); return; }
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:100012;display:flex;align-items:center;justify-content:center;';
    const dlg = document.createElement('div');
    dlg.style.cssText = 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:22px;width:500px;max-width:90vw;box-shadow:0 16px 48px rgba(0,0,0,0.6);color:#eee;font-family:\'Segoe UI\',Arial,sans-serif;font-size:13px;max-height:85vh;overflow-y:auto;';
    let groupHTML = '';
    gnList.forEach(gn => { const dgn = getDisplayGroupName(gn); groupHTML += `<label style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;"><input type="checkbox" class="cc-group-cb" value="${gn}" checked style="accent-color:#f0a500;"><span>${dgn} <span style="color:#888;font-size:11px;">(${AG[gn].length})</span></span></label>`; });
    const collectOptions = [];
    for (const [skillId, skill] of Object.entries(SKILL_RESOURCES)) {
        skill.resources.forEach(r => { collectOptions.push({ value: `${skillId}:${r.actionId}`, label: `${skill.name} → ${r.name} (${r.tier})` }); });
    }
    dlg.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-weight:bold;color:#f0a500;font-size:15px;">⛏️ 循环采集</span>
            <span id="cc-close" style="cursor:pointer;color:#888;font-size:18px;">✕</span>
        </div>
        <div style="margin-bottom:12px;">
            <div style="color:#aaa;font-size:12px;margin-bottom:6px;">① 选择要采集的账号分组：</div>
            <div style="max-height:120px;overflow-y:auto;background:rgba(0,0,0,0.2);border-radius:8px;padding:8px 10px;font-size:12px;">${groupHTML}</div>
        </div>
        <div style="margin-bottom:12px;">
            <div style="color:#aaa;font-size:12px;margin-bottom:6px;">② 选择采集资源：</div>
            <select id="cc-resource" style="width:100%;padding:6px;background:rgba(0,0,0,0.3);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:6px;font-size:12px;">
                ${collectOptions.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
            </select>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap;">
            <div style="flex:1;min-width:100px;"><label style="color:#aaa;font-size:11px;">采集时间（秒）</label><input id="cc-interval" type="number" value="120" min="10" max="3600" style="width:100%;padding:6px;background:rgba(255,255,255,0.06);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:6px;box-sizing:border-box;font-size:12px;"></div>
            <div style="flex:1;min-width:100px;"><label style="color:#aaa;font-size:11px;">循环次数（0=无限）</label><input id="cc-rounds" type="number" value="0" min="0" max="999" style="width:100%;padding:6px;background:rgba(255,255,255,0.06);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:6px;box-sizing:border-box;font-size:12px;"></div>
        </div>
        <div style="color:#888;font-size:10px;background:rgba(0,0,0,0.15);border-radius:6px;padding:6px 8px;margin-bottom:12px;line-height:1.5;">
            📋 流程：登录 → 跳转到采集页 → 采集设定时间 → 退出 → 登录下一个账号 → 循环
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button id="cc-cancel" style="padding:6px 16px;background:rgba(255,255,255,0.06);color:#aaa;border:1px solid rgba(255,255,255,0.1);border-radius:6px;cursor:pointer;font-size:12px;">取消</button>
            <button id="cc-start" style="padding:6px 16px;background:rgba(200,150,50,0.15);color:#f0a500;border:1px solid #f0a500;border-radius:6px;cursor:pointer;font-weight:bold;font-size:12px;">⛏️ 开始循环采集</button>
        </div>`;
    overlay.appendChild(dlg); document.body.appendChild(overlay);
    const close = () => overlay.remove();
    dlg.querySelector('#cc-close').onclick = close; dlg.querySelector('#cc-cancel').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    dlg.querySelector('#cc-start').onclick = () => {
        const checkedCbs = dlg.querySelectorAll('.cc-group-cb:checked');
        if (checkedCbs.length === 0) { alert('⚠️ 请至少选择一个分组'); return; }
        const selectedGroups = []; checkedCbs.forEach(cb => selectedGroups.push(cb.value));
        const selVal = dlg.querySelector('#cc-resource').value;
        if (!selVal) { alert('⚠️ 请选择一个采集资源'); return; }
        const [skillIdStr, actionIdStr] = selVal.split(':');
        const duration = parseInt(dlg.querySelector('#cc-interval').value) || 120;
        if (duration < 10) { alert('⚠️ 采集时间不能少于10秒'); return; }
        const rounds = parseInt(dlg.querySelector('#cc-rounds').value) || 0;
        const allAccs = []; selectedGroups.forEach(gn => { if (AG[gn]) AG[gn].forEach(a => { if (a && a.email) allAccs.push(a); }); });
        if (allAccs.length === 0) { alert('❌ 选中分组中没有账号'); return; }
        const skillId = parseInt(skillIdStr);
        const skill = SKILL_RESOURCES[skillId];
        const pageUrl = skill ? skill.pageUrl : '/game/woodcutting';
        close();
        const state = { accounts: allAccs, currentIdx: 0, skillId, actionId: parseInt(actionIdStr), pageUrl, durationSec: duration, maxRounds: rounds, round: 1, active: true, startTime: Date.now() };
        saveCycleCollectState(state);
        setTimeout(() => {
            if (isAuthPage()) {
                cycleCollectRunning = true; cycleCollectAbort = false;
                addInfoLog(`⛏️ 循环采集启动: ${allAccs.length}个账号, 每次${duration}秒, 轮数${rounds||'无限'}`);
                updateStatusWithCycle(`⛏️ 启动中...`);
                switchAccount(allAccs[0]);
            } else { clearSiteAuth(); window.location.href = 'https://idle.charsgame.com/auth?collectCycle=1'; }
        }, 200);
    };
}

function checkCycleCollectOnAuthPage() {
    const p = new URLSearchParams(window.location.search);
    if (p.get('collectCycle') !== '1') return false;
    const state = getCycleCollectState();
    if (!state || !state.active) return false;
    cycleCollectRunning = true; cycleCollectAbort = false;
    const currentAcc = state.accounts[state.currentIdx];
    if (!currentAcc) { clearCycleCollectState(); cycleCollectRunning = false; return false; }
    addInfoLog(`⛏️ 循环采集自动登录: ${getDisplayAccountName(currentAcc.email, currentAcc.name)} (${state.currentIdx+1}/${state.accounts.length})`);
    updateStatusWithCycle(`⛏️ 登录 ${getDisplayAccountName(currentAcc.email, currentAcc.name)}...`);
    setTimeout(async () => {
        let retries = 0;
        const tryFill = async () => {
            const { emailInput, passInput } = findInputs();
            if (emailInput && passInput) {
                await fillInput(emailInput, currentAcc.email); await sleep(100);
                await fillInput(passInput, currentAcc.password); await sleep(200);
                updateStatusWithCycle(`⛏️ 登录中...`);
                await sleep(300); await submitLogin();
                addInfoLog(`⛏️ 登录成功，跳转到采集页`);
            } else if (retries < 30) { retries++; setTimeout(tryFill, 500); }
            else { addErrorLog('循环采集：等待登录表单超时'); updateStatusWithCycle('❌ 登录超时'); }
        };
        tryFill();
    }, 1000);
    return true;
}

function checkCycleCollectOnGamePage() {
    const state = getCycleCollectState();
    if (!state || !state.active) return;
    cycleCollectRunning = true; cycleCollectAbort = false;
    const currentPath = window.location.pathname;
    if (!currentPath.includes(state.pageUrl)) {
        addInfoLog(`⛏️ 跳转到采集页...`);
        updateStatusWithCycle(`⛏️ 跳转采集页...`);
        window.location.href = `https://idle.charsgame.com${state.pageUrl}?collectCycle=1`;
        return;
    }
    const currentAcc = state.accounts[state.currentIdx];
    const durationSec = state.durationSec || 120;
    addInfoLog(`⛏️ 开始采集: ${getDisplayAccountName(currentAcc.email, currentAcc.name)} (${durationSec}秒)`);
    updateStatusWithCycle(`⛏️ 采集 ${durationSec}秒...`);
    let elapsed = 0;
    const checkInterval = setInterval(() => {
        if (cycleCollectAbort) { clearInterval(checkInterval); cycleCollectRunning = false; updateCycleUI(''); updateStatus('⏹ 采集已停止'); return; }
        elapsed++;
        const remain = durationSec - elapsed;
        if (remain <= 0) {
            clearInterval(checkInterval);
            addInfoLog(`⛏️ 采集完成: ${getDisplayAccountName(currentAcc.email, currentAcc.name)} (${durationSec}秒)`);
            const nextIdx = state.currentIdx + 1;
            let nextRound = state.round;
            if (nextIdx >= state.accounts.length) {
                if (state.maxRounds > 0 && nextRound >= state.maxRounds) {
                    addInfoLog(`⛏️ 循环采集完成，共运行 ${nextRound} 轮`);
                    updateStatusWithCycle(`✅ 采集完成 (${nextRound}轮)`);
                    clearCycleCollectState(); cycleCollectRunning = false;
                    setTimeout(() => updateStatus('就绪'), 3000);
                    return;
                }
                nextRound++;
                addInfoLog(`⛏️ 第 ${nextRound-1} 轮完成，进入第 ${nextRound} 轮`);
            }
            const nextAccount = state.accounts[nextIdx % state.accounts.length];
            state.currentIdx = nextIdx % state.accounts.length;
            state.round = nextRound;
            saveCycleCollectState(state);
            addInfoLog(`⛏️ 切换到: ${getDisplayAccountName(nextAccount.email, nextAccount.name)}`);
            updateStatusWithCycle(`⛏️ 切换账号...`);
            setTimeout(() => { clearSiteAuth(); window.location.href = 'https://idle.charsgame.com/auth?collectCycle=1'; }, 500);
        } else {
            updateStatusWithCycle(`⛏️ ${getDisplayAccountName(currentAcc.email, currentAcc.name)} (${remain}秒)`);
        }
    }, 1000);
}

// ============================================================
// ★★★ 💰 循环出售（独立功能3）- 完整实现 ★★★
// ============================================================

function showCycleSellDialog() {
    if (cycleSellRunning) {
        if (!confirm('💰 循环出售正在运行，是否先停止？')) return;
        stopCycleSell(); setTimeout(() => showCycleSellDialog(), 300); return;
    }
    const token = getAuthToken();
    if (!token) { alert('❌ 请先登录游戏后再使用循环出售'); return; }
    const AG = getAllAccountGroups();
    const gnList = Object.keys(AG).filter(gn => AG[gn] && AG[gn].length > 0);
    if (gnList.length === 0) { alert('❌ 没有可用的账号分组'); return; }
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:100012;display:flex;align-items:center;justify-content:center;';
    const dlg = document.createElement('div');
    dlg.style.cssText = 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:22px;width:560px;max-width:90vw;box-shadow:0 16px 48px rgba(0,0,0,0.6);color:#eee;font-family:\'Segoe UI\',Arial,sans-serif;font-size:13px;max-height:85vh;overflow-y:auto;';
    let groupHTML = '';
    gnList.forEach(gn => { const dgn = getDisplayGroupName(gn); groupHTML += `<label style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;"><input type="checkbox" class="css-group-cb" value="${gn}" checked style="accent-color:#00e676;"><span>${dgn} <span style="color:#888;font-size:11px;">(${AG[gn].length})</span></span></label>`; });
    const categories = Object.keys(ITEMS_BY_CATEGORY);
    let catOpts = categories.map(c => `<option value="${c}">${c} (${ITEMS_BY_CATEGORY[c].length})</option>`).join('');
    dlg.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-weight:bold;color:#00e676;font-size:15px;">💰 循环出售</span>
            <span id="css-close" style="cursor:pointer;color:#888;font-size:18px;">✕</span>
        </div>
        <div style="margin-bottom:12px;">
            <div style="color:#aaa;font-size:12px;margin-bottom:6px;">① 选择要出售的账号分组：</div>
            <div style="max-height:100px;overflow-y:auto;background:rgba(0,0,0,0.2);border-radius:8px;padding:8px 10px;font-size:12px;">${groupHTML}</div>
        </div>
        <div style="margin-bottom:12px;">
            <div style="color:#aaa;font-size:12px;margin-bottom:6px;">② 选择要出售的商品（支持多选）：</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
                <select id="css-cat" style="flex:1;padding:5px;background:rgba(0,0,0,0.3);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:6px;font-size:12px;">${catOpts}</select>
                <input id="css-search" placeholder="🔍 搜索..." style="flex:1;padding:5px;background:rgba(255,255,255,0.06);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:6px;font-size:12px;min-width:80px;">
                <button id="css-select-all" style="padding:5px 10px;background:rgba(0,200,100,0.1);color:#00e676;border:1px solid rgba(0,200,100,0.2);border-radius:6px;cursor:pointer;font-size:11px;">全选</button>
                <button id="css-deselect-all" style="padding:5px 10px;background:rgba(255,255,255,0.05);color:#aaa;border:1px solid rgba(255,255,255,0.08);border-radius:6px;cursor:pointer;font-size:11px;">清空</button>
            </div>
            <div id="css-items" style="max-height:200px;overflow-y:auto;background:rgba(0,0,0,0.15);border-radius:6px;padding:6px 8px;font-size:12px;"></div>
        </div>
        <div style="margin-bottom:12px;">
            <label style="color:#aaa;font-size:11px;">③ 循环轮数（0=无限）：</label>
            <input id="css-rounds" type="number" value="0" min="0" max="999" style="width:100%;padding:6px;background:rgba(255,255,255,0.06);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:6px;box-sizing:border-box;font-size:12px;margin-top:4px;">
        </div>
        <div style="color:#888;font-size:10px;background:rgba(0,0,0,0.15);border-radius:6px;padding:6px 8px;margin-bottom:12px;line-height:1.5;">
            📋 流程：登录 → 背包页 → 依次出售所有选中的商品（按最高买入价）→ 退出 → 登录下一个账号 → 循环
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button id="css-cancel" style="padding:6px 16px;background:rgba(255,255,255,0.06);color:#aaa;border:1px solid rgba(255,255,255,0.1);border-radius:6px;cursor:pointer;font-size:12px;">取消</button>
            <button id="css-start" style="padding:6px 16px;background:rgba(0,200,100,0.15);color:#00e676;border:1px solid #00e676;border-radius:6px;cursor:pointer;font-weight:bold;font-size:12px;">💰 开始循环出售</button>
        </div>`;
    overlay.appendChild(dlg); document.body.appendChild(overlay);
    function renderSellItems(category, search) {
        const container = dlg.querySelector('#css-items');
        let items = category ? (ITEMS_BY_CATEGORY[category] || []) : ALL_ITEMS;
        if (search) { const q = search.toLowerCase(); items = items.filter(i => i.name.toLowerCase().includes(q) || ('ID ' + i.itemId).toLowerCase().includes(q)); }
        container.innerHTML = items.map(item => {
            const code = 'ID ' + item.itemId;
            return `<label style=\"display:flex;align-items:center;gap:6px;padding:3px 0;cursor:pointer;\"><input type=\"checkbox\" class=\"css-item-cb\" value=\"${item.itemId}\" style=\"accent-color:#00e676;\"><span>${code}: ${item.name}</span><span style=\"color:#888;font-size:10px;\">${item.tier||''}</span></label>`;
        }).join('') || '<span style=\"color:#555;\">无匹配物品</span>';
    }
    renderSellItems(categories[0], '');
    dlg.querySelector('#css-cat').onchange = () => { renderSellItems(dlg.querySelector('#css-cat').value, dlg.querySelector('#css-search').value); };
    dlg.querySelector('#css-search').oninput = () => { renderSellItems(dlg.querySelector('#css-cat').value, dlg.querySelector('#css-search').value); };
    dlg.querySelector('#css-select-all').onclick = () => { dlg.querySelectorAll('.css-item-cb').forEach(cb => cb.checked = true); };
    dlg.querySelector('#css-deselect-all').onclick = () => { dlg.querySelectorAll('.css-item-cb').forEach(cb => cb.checked = false); };
    const close = () => overlay.remove();
    dlg.querySelector('#css-close').onclick = close; dlg.querySelector('#css-cancel').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    dlg.querySelector('#css-start').onclick = () => {
        const checkedCbs = dlg.querySelectorAll('.css-group-cb:checked');
        if (checkedCbs.length === 0) { alert('⚠️ 请至少选择一个分组'); return; }
        const selectedGroups = []; checkedCbs.forEach(cb => selectedGroups.push(cb.value));
        const allAccs = []; selectedGroups.forEach(gn => { if (AG[gn]) AG[gn].forEach(a => { if (a && a.email) allAccs.push(a); }); });
        if (allAccs.length === 0) { alert('❌ 选中分组中没有账号'); return; }
        const checkedItems = dlg.querySelectorAll('.css-item-cb:checked');
        if (checkedItems.length === 0) { alert('⚠️ 请至少选择一种要出售的商品'); return; }
        const sellItemIds = []; checkedItems.forEach(cb => sellItemIds.push(parseInt(cb.value)));
        const rounds = parseInt(dlg.querySelector('#css-rounds').value) || 0;
        close();
        const state = { accounts: allAccs, currentIdx: 0, sellItemIds, maxRounds: rounds, round: 1, active: true, startTime: Date.now() };
        saveCycleSellState(state);
        setTimeout(() => {
            if (isAuthPage()) {
                cycleSellRunning = true; cycleSellAbort = false;
                addInfoLog(`💰 循环出售启动: ${allAccs.length}个账号, 出售${sellItemIds.length}种商品, 轮数${rounds||'无限'}`);
                updateStatusWithCycle(`💰 启动中...`);
                switchAccount(allAccs[0]);
            } else { clearSiteAuth(); window.location.href = 'https://idle.charsgame.com/auth?sellCycle=1'; }
        }, 200);
    };
}

function checkCycleSellOnAuthPage() {
    const p = new URLSearchParams(window.location.search);
    if (p.get('sellCycle') !== '1') return false;
    const state = getCycleSellState();
    if (!state || !state.active) return false;
    cycleSellRunning = true; cycleSellAbort = false;
    const currentAcc = state.accounts[state.currentIdx];
    if (!currentAcc) { clearCycleSellState(); cycleSellRunning = false; return false; }
    addInfoLog(`💰 循环出售自动登录: ${getDisplayAccountName(currentAcc.email, currentAcc.name)} (${state.currentIdx+1}/${state.accounts.length})`);
    updateStatusWithCycle(`💰 登录 ${getDisplayAccountName(currentAcc.email, currentAcc.name)}...`);
    setTimeout(async () => {
        let retries = 0;
        const tryFill = async () => {
            const { emailInput, passInput } = findInputs();
            if (emailInput && passInput) {
                await fillInput(emailInput, currentAcc.email); await sleep(100);
                await fillInput(passInput, currentAcc.password); await sleep(200);
                updateStatusWithCycle(`💰 登录中...`);
                await sleep(300); await submitLogin();
                addInfoLog(`💰 登录成功，跳转到背包页`);
            } else if (retries < 30) { retries++; setTimeout(tryFill, 500); }
            else { addErrorLog('循环出售：等待登录表单超时'); updateStatusWithCycle('❌ 登录超时'); }
        };
        tryFill();
    }, 1000);
    return true;
}

async function autoSellMultipleItems(sellItemIds) {
    for (const itemId of sellItemIds) {
        if (cycleSellAbort) { addInfoLog('💰 出售已中止'); return; }
        updateStatusWithCycle(`💰 查询 ${getItemName(itemId)}...`);
        await sleep(500);
        const qty = await fetchInventoryQty(itemId);
        if (!qty || qty <= 0) { addInfoLog(`💰 跳过 ${getItemName(itemId)}: 库存为0`); continue; }
        const order = await fetchBuyOrder(itemId);
        if (!order) { addWarnLog(`💰 跳过 ${getItemName(itemId)}: 无买入订单`); continue; }
        addInfoLog(`💰 出售 ${getItemName(itemId)} x${qty} @ ${order.price}`);
        updateStatusWithCycle(`💰 出售 ${getItemName(itemId)} x${qty}...`);
        const success = await executeSell(itemId, order.price, qty);
        if (success) { await sleep(300); } else { addErrorLog(`💰 出售失败 ${getItemName(itemId)}`); await sleep(500); }
    }
}

function checkCycleSellOnGamePage() {
    const state = getCycleSellState();
    if (!state || !state.active) return;
    cycleSellRunning = true; cycleSellAbort = false;
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/game/inventory')) {
        addInfoLog(`💰 跳转到背包页...`);
        updateStatusWithCycle(`💰 跳转背包页...`);
        window.location.href = 'https://idle.charsgame.com/game/inventory?sellCycle=1';
        return;
    }
    const currentAcc = state.accounts[state.currentIdx];
    const sellItemIds = state.sellItemIds || [];
    addInfoLog(`💰 开始出售: ${getDisplayAccountName(currentAcc.email, currentAcc.name)} → ${sellItemIds.length}种商品`);
    updateStatusWithCycle(`💰 开始出售...`);
    autoSellMultipleItems(sellItemIds).then(() => {
        addInfoLog(`💰 出售完成: ${getDisplayAccountName(currentAcc.email, currentAcc.name)}`);
        const nextIdx = state.currentIdx + 1;
        let nextRound = state.round;
        if (nextIdx >= state.accounts.length) {
            if (state.maxRounds > 0 && nextRound >= state.maxRounds) {
                addInfoLog(`💰 循环出售完成，共运行 ${nextRound} 轮`);
                updateStatusWithCycle(`✅ 出售完成 (${nextRound}轮)`);
                clearCycleSellState(); cycleSellRunning = false;
                setTimeout(() => updateStatus('就绪'), 3000);
                return;
            }
            nextRound++;
            addInfoLog(`💰 第 ${nextRound-1} 轮完成，进入第 ${nextRound} 轮`);
        }
        const nextAccount = state.accounts[nextIdx % state.accounts.length];
        state.currentIdx = nextIdx % state.accounts.length;
        state.round = nextRound;
        saveCycleSellState(state);
        addInfoLog(`💰 切换到: ${getDisplayAccountName(nextAccount.email, nextAccount.name)}`);
        updateStatusWithCycle(`💰 切换账号...`);
        setTimeout(() => { clearSiteAuth(); window.location.href = 'https://idle.charsgame.com/auth?sellCycle=1'; }, 500);
    });
}
