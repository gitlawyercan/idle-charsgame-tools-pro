'use strict';

// ============================================================
// ★★★ 使用共享工具函数 ★★★
// ============================================================
const ML_sleep = window.SHARED_UTILS.sleep;
const ML_fillInput = window.SHARED_UTILS.fillInput;
const ML_findLoginInputs = window.SHARED_UTILS.findLoginInputs;
const ML_getItemName = window.SHARED_UTILS.getItemName;
const ML_ACCOUNTS = window.SHARED_ACCOUNTS;

// ============================================================
// ★★★ 浮动按钮 ★★★
// ============================================================
function createMLButton() {
    const old = document.getElementById('ml-float-btn');
    if (old) old.remove();

    const btn = document.createElement('div');
    btn.id = 'ml-float-btn';
    btn.textContent = '👤';
    btn.title = '手动选择账号登录';
    btn.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        z-index: 9999999 !important;
        width: 36px !important;
        height: 36px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, #1a1a2e, #16213e) !important;
        border: 2px solid #6d9fff !important;
        color: #6d9fff !important;
        font-size: 16px !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
        transition: all 0.2s !important;
        user-select: none !important;
        font-family: 'Segoe UI', Arial, sans-serif !important;
        opacity: 0.9 !important;
    `;
    btn.onmouseover = () => {
        btn.style.transform = 'scale(1.1)';
        btn.style.boxShadow = '0 6px 24px rgba(109,159,255,0.3)';
        btn.style.opacity = '1';
    };
    btn.onmouseout = () => {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.5)';
        btn.style.opacity = '0.9';
    };
    btn.onclick = showMLDialog;
    document.body.appendChild(btn);
    console.log('[ManualLogin] 👤 浮动按钮已创建');
}

// ============================================================
// ★★★ 手动选择登录弹窗 ★★★
// ============================================================
function showMLDialog() {
    const { emailInput, passInput } = ML_findLoginInputs();
    if (!emailInput || !passInput) {
        if (confirm('❌ 未找到登录表单。是否跳转到登录页？')) {
            window.location.href = 'https://idle.charsgame.com/auth';
        }
        return;
    }

    const gnList = Object.keys(ML_ACCOUNTS).filter(gn => ML_ACCOUNTS[gn] && ML_ACCOUNTS[gn].length > 0);

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:10000020;display:flex;align-items:center;justify-content:center;';

    const dlg = document.createElement('div');
    dlg.style.cssText = 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:22px;width:400px;max-width:90vw;box-shadow:0 16px 48px rgba(0,0,0,0.6);color:#eee;font-family:\'Segoe UI\',Arial,sans-serif;font-size:13px;max-height:85vh;overflow-y:auto;';

    let listHTML = `<input id="ml-search-input" placeholder="🔍 搜索账号名称或邮箱..." style="width:100%;padding:8px;background:rgba(255,255,255,0.06);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:6px;box-sizing:border-box;font-size:12px;margin-bottom:10px;">`;

    gnList.forEach(gn => {
        const accs = ML_ACCOUNTS[gn];
        listHTML += `<div class="ml-group" data-group="${gn}">`;
        listHTML += `<div style="color:#f0a500;font-size:12px;font-weight:bold;padding:6px 0 4px;border-top:1px solid rgba(255,255,255,0.05);">📁 ${gn} <span style="color:#888;font-weight:normal;font-size:10px;">(${accs.length})</span></div>`;
        accs.forEach(acc => {
            listHTML += `<div class="ml-item" data-email="${acc.email}" data-pass="${acc.password}" style="display:flex;align-items:center;gap:6px;padding:7px 8px;cursor:pointer;border-radius:6px;margin:2px 0;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);transition:all 0.15s;">`;
            listHTML += `<span style="flex:1;color:#ddd;font-size:12px;"><span style="color:#f0a500;font-weight:bold;">${acc.name}</span> <span style="color:#888;font-size:10px;">${acc.email}</span></span>`;
            listHTML += `<span style="color:#6d9fff;font-size:10px;flex-shrink:0;">填充</span>`;
            listHTML += `</div>`;
        });
        listHTML += `</div>`;
    });

    dlg.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span style="font-weight:bold;color:#6d9fff;font-size:15px;">👤 选择账号填充</span>
            <span id="ml-close-x" style="cursor:pointer;color:#888;font-size:18px;">✕</span>
        </div>
        <div style="color:#aaa;font-size:11px;margin-bottom:10px;background:rgba(100,150,255,0.08);border-radius:6px;padding:6px 8px;line-height:1.5;">
            💡 点击账号 → 自动填充邮箱和密码<br>请<strong style="color:#f0a500;">手动点击</strong>网站登录按钮提交
        </div>
        ${listHTML}
        <div style="text-align:center;margin-top:8px;">
            <button id="ml-close-btn" style="padding:6px 16px;background:rgba(255,255,255,0.06);color:#aaa;border:1px solid rgba(255,255,255,0.1);border-radius:6px;cursor:pointer;font-size:12px;">关闭</button>
        </div>`;

    overlay.appendChild(dlg);
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    dlg.querySelector('#ml-close-x').onclick = close;
    dlg.querySelector('#ml-close-btn').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    const searchInput = dlg.querySelector('#ml-search-input');
    searchInput.oninput = () => {
        const q = searchInput.value.toLowerCase().trim();
        dlg.querySelectorAll('.ml-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(q) ? 'flex' : 'none';
        });
        dlg.querySelectorAll('.ml-group').forEach(group => {
            const visible = Array.from(group.querySelectorAll('.ml-item')).some(i => i.style.display !== 'none');
            group.style.display = visible ? 'block' : 'none';
        });
    };
    setTimeout(() => searchInput.focus(), 100);

    dlg.querySelectorAll('.ml-item').forEach(item => {
        item.onmouseover = () => {
            item.style.background = 'rgba(100,150,255,0.12)';
            item.style.borderColor = 'rgba(100,150,255,0.25)';
        };
        item.onmouseout = () => {
            item.style.background = 'rgba(255,255,255,0.04)';
            item.style.borderColor = 'rgba(255,255,255,0.06)';
        };
        item.onclick = async () => {
            const email = item.dataset.email;
            const password = item.dataset.pass;
            const nameEl = item.querySelector('span:first-child span:first-child');
            const name = nameEl ? nameEl.textContent : email;
            await ML_fillInput(emailInput, email);
            await ML_sleep(100);
            await ML_fillInput(passInput, password);
            close();
            const toast = document.createElement('div');
            toast.textContent = `✅ 已填充 ${name}`;
            toast.style.cssText = 'position:fixed;top:60px;right:10px;z-index:9999999;padding:8px 16px;background:rgba(100,200,100,0.15);color:#6dd66d;border:1px solid rgba(100,200,100,0.3);border-radius:8px;font-size:12px;font-family:\'Segoe UI\',Arial,sans-serif;font-weight:bold;box-shadow:0 4px 16px rgba(0,0,0,0.4);transition:opacity 0.5s;';
            document.body.appendChild(toast);
            setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 2500);
        };
    });
}

// ============================================================
// ★★★ 初始化 ★★★
// ============================================================
function initML() {
    console.log('[ManualLogin] 👤 模块初始化...');

    function ensureButton() {
        if (!document.getElementById('ml-float-btn')) {
            createMLButton();
        }
    }

    if (document.body) {
        ensureButton();
    } else {
        document.addEventListener('DOMContentLoaded', ensureButton);
    }

    if (document.body) {
        const observer = new MutationObserver(() => { ensureButton(); });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    setInterval(ensureButton, 2000);
}

initML();
console.log('[ManualLogin] 👤 手动选择登录模块已加载');
