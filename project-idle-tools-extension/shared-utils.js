'use strict';

// ============================================================
// ★★★ 共享工具函数（所有功能模块共用）★★★
// 此文件必须放在 manifest.json 的 js 数组最前面
// ============================================================

window.SHARED_UTILS = {};

// 睡眠
window.SHARED_UTILS.sleep = function(ms) {
    return new Promise(r => setTimeout(r, ms));
};

// 获取Token
window.SHARED_UTILS.getAuthToken = function() {
    try {
        const d = JSON.parse(localStorage.getItem('project-idle-auth'));
        if (d?.state?.token) return d.state.token;
    } catch (e) {}
    return null;
};

// 存储
window.SHARED_UTILS.storageGet = function(key, fallback) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
};
window.SHARED_UTILS.storageSet = function(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

// 填写输入框
window.SHARED_UTILS.fillInput = async function(inp, val) {
    if (!inp) return;
    inp.focus(); inp.click();
    const ns = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (ns) ns.call(inp, val); else inp.value = val;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    inp.blur(); inp.focus();
};

// 查找登录输入框
window.SHARED_UTILS.findLoginInputs = function() {
    const es = [
        'input[type="email"]', 'input[name="email"]',
        'input[placeholder*="邮箱" i]', 'input[placeholder*="email" i]',
        'input[placeholder*="账号" i]', 'input[placeholder*="username" i]',
        'input[name="username"]', 'input[autocomplete="username"]',
        'input:not([type="hidden"]):not([type="password"])'
    ];
    const ps = [
        'input[type="password"]', 'input[name="password"]',
        'input[placeholder*="密码" i]', 'input[placeholder*="password" i]',
        'input[autocomplete="current-password"]'
    ];
    let ei = null, pi = null;
    const form = document.querySelector('form');
    if (form) {
        for (const s of es) { ei = form.querySelector(s); if (ei && ei.type !== 'password') break; }
        for (const s of ps) { pi = form.querySelector(s); if (pi) break; }
    }
    if (!ei) { for (const s of es) { ei = document.querySelector(s); if (ei && ei.type !== 'password') break; } }
    if (!pi) { for (const s of ps) { pi = document.querySelector(s); if (pi) break; } }
    return { emailInput: ei, passInput: pi };
};

// 提交登录
window.SHARED_UTILS.submitLogin = async function() {
    const bs = [
        'button[type="submit"]', 'button[class*="login" i]',
        'button[class*="submit" i]', 'button[class*="signin" i]',
        'button:has(svg)', 'button:last-of-type',
        'input[type="submit"]', '[role="button"]'
    ];
    for (const s of bs) {
        const b = document.querySelector(s);
        if (b) {
            if (b.disabled) { b.disabled = false; b.classList.remove('ant-btn-disabled', 'Mui-disabled'); }
            b.click();
            return true;
        }
    }
    return false;
};

// 清除登录状态
window.SHARED_UTILS.clearSiteAuth = function() {
    document.cookie.split(';').forEach(c => {
        const e = c.indexOf('='), n = e > -1 ? c.substr(0, e).trim() : c.trim();
        if (n) {
            document.cookie = n + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
            document.cookie = n + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.' + location.hostname;
        }
    });
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.toLowerCase().includes('token') || k.toLowerCase().includes('auth') || k.toLowerCase().includes('session') || k.toLowerCase().includes('charsgame')))
            localStorage.removeItem(k);
    }
};

// API请求
window.SHARED_UTILS.apiRequest = async function(endpoint, body) {
    const token = window.SHARED_UTILS.getAuthToken();
    if (!token) { return { code: -1, message: '未登录' }; }
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
    } catch (e) {
        return { code: -1, message: e.message };
    }
};

// 获取物品名称（从统一物品数据库 items-database.js 获取）
window.SHARED_UTILS.getItemName = function(itemId) {
    if (window.PI_getItemName) return window.PI_getItemName(itemId);
    return '未知(' + itemId + ')';
};

// 共享账号列表（从 accounts-config.js 加载）
window.SHARED_ACCOUNTS = window.PI_ACCOUNTS || {};

console.log('[SharedUtils] 📦 共享工具模块已加载');
