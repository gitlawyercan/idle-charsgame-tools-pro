'use strict';

// ============================================================
// ★★★ 共享 CSS — 注入全局样式表，消除内联 CSS 重复 ★★★
// ============================================================

(function injectSharedStyles() {
    if (document.getElementById('pi-shared-styles')) return;

    const css = `
/* === 基础变量 === */
.pi-theme {
    --pi-bg: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    --pi-border: rgba(255,255,255,0.12);
    --pi-text: #eee;
    --pi-text-dim: #888;
    --pi-accent-gold: #f0a500;
    --pi-color-switch: #b388ff;
    --pi-color-collect: #f0a500;
    --pi-color-sell: #00e676;
    --pi-color-claim: #7c7cff;
    --pi-color-buy: #ff9800;
    --pi-color-inventory: #4fc3f7;
    --pi-color-warehouse: #81c784;
    --pi-color-api: #00c8c8;
    --pi-color-price: #6d9fff;
    --pi-color-danger: #ff6b6b;
    --pi-font: 'Segoe UI', Arial, sans-serif;
}

/* === 遮罩层 === */
.pi-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: rgba(0,0,0,0.7) !important;
    z-index: 10000010 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

/* === 对话框主体 === */
.pi-dialog {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) !important;
    border: 1px solid var(--pi-border, rgba(255,255,255,0.12)) !important;
    border-radius: 14px !important;
    padding: 22px !important;
    max-width: 90vw !important;
    box-shadow: 0 16px 48px rgba(0,0,0,0.6) !important;
    color: var(--pi-text, #eee) !important;
    font-family: var(--pi-font, 'Segoe UI', Arial, sans-serif) !important;
    font-size: 13px !important;
    max-height: 85vh !important;
    overflow-y: auto !important;
}

.pi-dialog-wide { width: 560px; }
.pi-dialog-md   { width: 480px; }
.pi-dialog-sm   { width: 400px; }
.pi-dialog-460  { width: 460px; }
.pi-dialog-500  { width: 500px; }
.pi-dialog-520  { width: 520px; }
.pi-dialog-650  { width: 650px; }
.pi-dialog-700  { width: 700px; }

/* === 对话框头部 === */
.pi-dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}
.pi-dialog-title {
    font-weight: bold;
    font-size: 15px;
}
.pi-dialog-close {
    cursor: pointer;
    color: var(--pi-text-dim, #888);
    font-size: 18px;
    padding: 2px 4px;
}
.pi-dialog-close:hover { color: #fff; }

/* === 通用按钮 === */
.pi-btn {
    padding: 6px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
    border: 1px solid;
    transition: all 0.15s;
    font-family: var(--pi-font, 'Segoe UI', Arial, sans-serif);
}
.pi-btn:active { transform: scale(0.97); }

.pi-btn-cancel {
    background: rgba(255,255,255,0.06);
    color: #aaa;
    border-color: rgba(255,255,255,0.1);
}
.pi-btn-cancel:hover {
    background: rgba(255,255,255,0.12);
    color: #ddd;
}

/* 主题色按钮 */
.pi-btn-switch  { background: rgba(120,80,200,0.15); color: #b388ff; border-color: #b388ff; }
.pi-btn-switch:hover  { background: rgba(120,80,200,0.25); color: #d0b0ff; }
.pi-btn-collect { background: rgba(200,150,50,0.15);  color: #f0a500; border-color: #f0a500; }
.pi-btn-collect:hover { background: rgba(200,150,50,0.25);  color: #ffc107; }
.pi-btn-sell    { background: rgba(0,200,100,0.15);   color: #00e676; border-color: #00e676; }
.pi-btn-sell:hover    { background: rgba(0,200,100,0.25);   color: #69f0ae; }
.pi-btn-claim   { background: rgba(100,100,255,0.15);  color: #7c7cff; border-color: #7c7cff; }
.pi-btn-claim:hover   { background: rgba(100,100,255,0.25);  color: #9f9fff; }
.pi-btn-buy     { background: rgba(255,152,0,0.15);    color: #ff9800; border-color: #ff9800; }
.pi-btn-buy:hover     { background: rgba(255,152,0,0.25);    color: #ffb74d; }
.pi-btn-inventory { background: rgba(79,195,247,0.15);  color: #4fc3f7; border-color: #4fc3f7; }
.pi-btn-inventory:hover { background: rgba(79,195,247,0.25);  color: #81d4fa; }
.pi-btn-warehouse { background: rgba(129,199,132,0.15); color: #81c784; border-color: #81c784; }
.pi-btn-warehouse:hover { background: rgba(129,199,132,0.25); color: #a5d6a7; }
.pi-btn-api     { background: rgba(0,200,200,0.15);    color: #00c8c8; border-color: #00c8c8; }
.pi-btn-api:hover     { background: rgba(0,200,200,0.25);    color: #00e8e8; }
.pi-btn-price   { background: rgba(100,150,255,0.15);  color: #6d9fff; border-color: rgba(100,150,255,0.25); }
.pi-btn-price:hover   { background: rgba(100,150,255,0.25);  color: #8ab4ff; }
.pi-btn-danger  { background: rgba(255,80,80,0.15);    color: #ff6b6b; border-color: rgba(255,80,80,0.25); }
.pi-btn-danger:hover  { background: rgba(255,80,80,0.25);    color: #ff4444; }

/* === 表单控件 === */
.pi-input {
    width: 100%;
    padding: 6px 8px;
    background: rgba(255,255,255,0.06);
    color: #eee;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    font-size: 12px;
    box-sizing: border-box;
    font-family: var(--pi-font, 'Segoe UI', Arial, sans-serif);
}
.pi-input:focus {
    outline: none;
    border-color: var(--pi-accent-gold, #f0a500);
}
.pi-select {
    width: 100%;
    padding: 5px;
    background: rgba(0,0,0,0.3);
    color: #eee;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    font-size: 12px;
}
.pi-select optgroup { color: #aaa; background: #1a1a2e; }
.pi-select option   { color: #eee; background: #1a1a2e; }

/* === 列表容器 === */
.pi-list-box {
    max-height: 150px;
    overflow-y: auto;
    background: rgba(0,0,0,0.15);
    border-radius: 6px;
    padding: 6px 8px;
    font-size: 12px;
}
.pi-list-box-sm { max-height: 100px; }
.pi-list-box-lg { max-height: 200px; }

/* === 标签行（checkbox label） === */
.pi-label-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    cursor: pointer;
}
.pi-label-row:hover { background: rgba(255,255,255,0.03); border-radius: 4px; }

/* === 信息框 === */
.pi-info-box {
    color: var(--pi-text-dim, #888);
    font-size: 10px;
    background: rgba(0,0,0,0.15);
    border-radius: 6px;
    padding: 6px 8px;
    line-height: 1.5;
}

/* === 浮动按钮 === */
.pi-float-btn {
    position: fixed !important;
    z-index: 9999999 !important;
    width: 36px !important;
    height: 36px !important;
    border-radius: 50% !important;
    background: linear-gradient(135deg, #1a1a2e, #16213e) !important;
    font-size: 16px !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
    transition: all 0.2s !important;
    user-select: none !important;
    font-family: var(--pi-font, 'Segoe UI', Arial, sans-serif) !important;
    opacity: 0.9 !important;
}
.pi-float-btn:hover {
    transform: scale(1.1) !important;
    box-shadow: 0 6px 24px rgba(0,0,0,0.4) !important;
    opacity: 1 !important;
}
.pi-float-btn-switch    { border: 2px solid #b388ff !important; color: #b388ff !important; }
.pi-float-btn-collect   { border: 2px solid #f0a500 !important; color: #f0a500 !important; }
.pi-float-btn-buy       { border: 2px solid #ff9800 !important; color: #ff9800 !important; }
.pi-float-btn-inventory { border: 2px solid #4fc3f7 !important; color: #4fc3f7 !important; }
.pi-float-btn-claim     { border: 2px solid #7c7cff !important; color: #7c7cff !important; }
.pi-float-btn-warehouse { border: 2px solid #81c784 !important; color: #81c784 !important; }
.pi-float-btn-manual    { border: 2px solid #6d9fff !important; color: #6d9fff !important; }
.pi-float-btn-skill     { border: 2px solid #ce93d8 !important; color: #ce93d8 !important; }
.pi-float-btn-market    { border: 2px solid #6d9fff !important; color: #6d9fff !important; }
.pi-float-btn-stats     { border: 2px solid #f0a500 !important; color: #f0a500 !important; }
.pi-float-btn-addacc    { border: 2px solid #6dd66d !important; color: #6dd66d !important; }
.pi-float-btn-log       { border: 2px solid #aaa !important; color: #aaa !important; }
.pi-float-btn-panel     { border: 2px solid #6d9fff !important; color: #6d9fff !important; }

.pi-float-btn-switch:hover    { box-shadow: 0 6px 24px rgba(179,136,255,0.3) !important; }
.pi-float-btn-collect:hover   { box-shadow: 0 6px 24px rgba(240,165,0,0.3) !important; }
.pi-float-btn-buy:hover       { box-shadow: 0 6px 24px rgba(255,152,0,0.3) !important; }
.pi-float-btn-inventory:hover { box-shadow: 0 6px 24px rgba(79,195,247,0.3) !important; }
.pi-float-btn-claim:hover     { box-shadow: 0 6px 24px rgba(124,124,255,0.3) !important; }
.pi-float-btn-warehouse:hover { box-shadow: 0 6px 24px rgba(129,199,132,0.3) !important; }
.pi-float-btn-manual:hover    { box-shadow: 0 6px 24px rgba(109,159,255,0.3) !important; }
.pi-float-btn-skill:hover     { box-shadow: 0 6px 24px rgba(206,147,216,0.3) !important; }
.pi-float-btn-market:hover    { box-shadow: 0 6px 24px rgba(100,150,255,0.3) !important; }
.pi-float-btn-stats:hover     { box-shadow: 0 6px 24px rgba(240,165,0,0.3) !important; }
.pi-float-btn-addacc:hover    { box-shadow: 0 6px 24px rgba(100,200,100,0.3) !important; }
.pi-float-btn-log:hover       { box-shadow: 0 6px 24px rgba(255,255,255,0.15) !important; }
.pi-float-btn-panel:hover     { box-shadow: 0 6px 24px rgba(109,159,255,0.3) !important; }

/* === Toast === */
.pi-toast {
    position: fixed;
    top: 60px;
    right: 10px;
    z-index: 9999999;
    padding: 8px 16px;
    background: rgba(100,200,100,0.15);
    border: 1px solid rgba(100,200,100,0.3);
    border-radius: 8px;
    font-size: 12px;
    font-family: var(--pi-font, 'Segoe UI', Arial, sans-serif);
    font-weight: bold;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    transition: opacity 0.5s;
}

/* === Timer / 状态 === */
.pi-btn-tiny {
    padding: 1px 6px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 9px;
    background: rgba(255,80,80,0.12);
    color: #ff6b6b;
    border: 1px solid rgba(255,80,80,0.25);
}

/* === 内联Flex行 === */
.pi-flex-row {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    flex-wrap: wrap;
}
.pi-flex-col {
    flex: 1;
    min-width: 80px;
}
.pi-flex-label {
    color: #aaa;
    font-size: 11px;
}

/* === 运行指示器 === */
.pi-indicator {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 9px;
    margin-left: 6px;
}
.pi-indicator-running { background: rgba(0,200,200,0.15); color: #00c8c8; }
.pi-indicator-stopped { background: rgba(255,255,255,0.05); color: #888; }

/* === 结果表格行 === */
.pi-result-row {
    display: flex;
    padding: 3px 0;
    border-bottom: 1px solid rgba(255,255,255,0.03);
}
.pi-result-header {
    display: flex;
    padding: 4px 0;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    color: #888;
}
.pi-result-col-idx { width: 40px; color: #888; }
.pi-result-col-name { flex: 1; color: #ddd; }
.pi-result-col-qty { width: 80px; text-align: right; }
.pi-result-col-qty-lg { width: 100px; text-align: right; }
.pi-result-col-acc { width: 60px; text-align: right; color: #888; }

/* === 滚动条美化 === */
.pi-scroll-thin::-webkit-scrollbar { width: 4px; }
.pi-scroll-thin::-webkit-scrollbar-track { background: transparent; }
.pi-scroll-thin::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
.pi-scroll-thin { scrollbar-width: thin; }

/* === 账号面板专用 === */
.pi-panel-btn {
    width: 100%;
    padding: 7px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
    border: 1px solid;
    box-sizing: border-box;
    font-family: var(--pi-font, 'Segoe UI', Arial, sans-serif);
    transition: all 0.15s;
}
.pi-panel-btn:active { transform: scale(0.97); }

.account-btn {
    padding: 5px 8px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 11px;
    text-align: left;
    border: 1px solid;
    font-family: var(--pi-font, 'Segoe UI', Arial, sans-serif);
}
.account-btn:active { transform: scale(0.97); }
.account-btn:hover { opacity: 0.9; }
`;

    const style = document.createElement('style');
    style.id = 'pi-shared-styles';
    style.textContent = css;
    document.head.appendChild(style);
    console.log('[SharedStyles] CSS 注入完成');
})();
