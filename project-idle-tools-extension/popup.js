'use strict';

// 获取当前活动标签页
async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
}

// 向 content script 发送消息
async function sendToContent(action, data) {
    try {
        const tab = await getActiveTab();
        if (!tab || !tab.id) return { success: false, error: '无活动标签页' };
        const response = await chrome.tabs.sendMessage(tab.id, { action, data });
        return response || { success: false, error: '无响应' };
    } catch(e) {
        return { success: false, error: e.message };
    }
}

// 更新状态显示
function updateStatus(runningStates) {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    const isAnyRunning = runningStates && (
        runningStates.switchRunning ||
        runningStates.collectRunning ||
        runningStates.sellRunning ||
        runningStates.buyRunning ||
        runningStates.claimRunning ||
        runningStates.inventoryRunning ||
        runningStates.warehouseRunning ||
        runningStates.skillRunning
    );
    if (isAnyRunning) {
        dot.className = 'status-dot';
        dot.style.background = '#00c8c8';
        text.textContent = '功能运行中...';
    } else if (runningStates && runningStates.panelLoaded) {
        dot.className = 'status-dot';
        dot.style.background = '#6dd66d';
        text.textContent = '面板已加载';
    } else {
        dot.className = 'status-dot inactive';
        text.textContent = '面板未加载';
    }
}

// 更新各功能状态标签
function updateFunctionStatus(states) {
    const updateLabel = (id, running) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (running) {
            el.textContent = '运行中';
            el.className = 'running-indicator running';
        } else {
            el.textContent = '停止';
            el.className = 'running-indicator stopped';
        }
    };
    updateLabel('switchStatus', states?.switchRunning);
    updateLabel('collectStatus', states?.collectRunning);
    updateLabel('sellStatus', states?.sellRunning);
    updateLabel('buyStatus', states?.buyRunning);
    updateLabel('claimStatus', states?.claimRunning);
    updateLabel('inventoryStatus', states?.inventoryRunning);
    updateLabel('warehouseStatus', states?.warehouseRunning);
    updateLabel('skillStatus', states?.skillRunning);
}

// 初始化：查询 content script 状态
async function init() {
    const result = await sendToContent('getStatus');
    if (result && result.success) {
        updateStatus(result.states);
        updateFunctionStatus(result.states);
    } else {
        updateStatus(null);
        updateFunctionStatus(null);
    }
}

// 绑定按钮事件
document.getElementById('btnSwitch').addEventListener('click', async () => {
    await sendToContent('showCycleSwitch');
    setTimeout(init, 500);
});

document.getElementById('btnCollect').addEventListener('click', async () => {
    await sendToContent('showCycleCollect');
    setTimeout(init, 500);
});

document.getElementById('btnSell').addEventListener('click', async () => {
    await sendToContent('showCycleSell');
    setTimeout(init, 500);
});

document.getElementById('btnBuy').addEventListener('click', async () => {
    await sendToContent('showCycleBuy');
    setTimeout(init, 500);
});

document.getElementById('btnClaim').addEventListener('click', async () => {
    await sendToContent('showCycleClaim');
    setTimeout(init, 500);
});

document.getElementById('btnInventory').addEventListener('click', async () => {
    await sendToContent('showCycleInventory');
    setTimeout(init, 500);
});

document.getElementById('btnWarehouse').addEventListener('click', async () => {
    await sendToContent('showCycleWarehouse');
    setTimeout(init, 500);
});

document.getElementById('btnSkill').addEventListener('click', async () => {
    await sendToContent('showCycleSkill');
    setTimeout(init, 500);
});

document.getElementById('btnStats').addEventListener('click', async () => {
    await sendToContent('showStats');
});

document.getElementById('btnPanel').addEventListener('click', async () => {
    const result = await sendToContent('reloadPanel');
    if (result && result.success) {
        updateStatus({ panelLoaded: true });
    }
});

document.getElementById('btnToken').addEventListener('click', async () => {
    await sendToContent('showToken');
});

document.getElementById('btnLogs').addEventListener('click', async () => {
    await sendToContent('showLogs');
});

document.getElementById('btnLogout').addEventListener('click', async () => {
    await sendToContent('logout');
    setTimeout(init, 1000);
});

// 监听来自 content script 的状态更新
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'statusUpdate') {
        updateStatus(message.states);
        updateFunctionStatus(message.states);
        sendResponse({ success: true });
    }
});

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init);

// 每3秒自动刷新状态
setInterval(init, 3000);
