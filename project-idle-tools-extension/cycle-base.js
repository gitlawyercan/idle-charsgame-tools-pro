'use strict';

// ============================================================
// ★★★ 循环模块基类 — 消除 cycle-*.js 中大段重复的登录/切号/初始化代码 ★★★
// ============================================================

// 使用方式：
//   var runner = new CycleRunner({
//       tag: 'CycleBuy',        // 日志标签
//       urlParam: 'cbuy',       // URL 参数名（自动登录用）
//       stateKey: 'project_idle_cycle_buy_state',
//       piStateKey: 'buyRunning',
//       btnId: 'cb-float-btn',
//       btnEmoji: '💰',
//       btnClass: 'pi-float-btn-buy',
//       btnBottom: '188px',
//       btnTitle: '循环购买',
//       execute: async function(state) { ... },  // 执行具体任务
//       onComplete: function(results) {}          // 全部完成回调（可选）
//   });

function CycleRunner(config) {
    var self = this;
    var U = window.SHARED_UTILS;

    self.tag = config.tag;
    self.urlParam = config.urlParam;
    self.stateKey = config.stateKey;
    self.piStateKey = config.piStateKey;
    self.btnId = config.btnId;
    self.btnEmoji = config.btnEmoji;
    self.btnClass = config.btnClass;
    self.btnBottom = config.btnBottom;
    self.btnTitle = config.btnTitle;
    self.execute = config.execute;
    self.onComplete = config.onComplete;

    // === 状态 ===
    self.running = false;
    self.abort = false;

    self.getState = function() {
        try { return JSON.parse(localStorage.getItem(self.stateKey)); } catch(e) { return null; }
    };
    self.saveState = function(s) {
        try { localStorage.setItem(self.stateKey, JSON.stringify(s)); } catch(e) {}
    };
    self.clearState = function() {
        localStorage.removeItem(self.stateKey);
    };

    self.stop = function() {
        self.abort = true;
        self.running = false;
        self.clearState();
        if (window.PI_RUNNING_STATES && self.piStateKey) window.PI_RUNNING_STATES[self.piStateKey] = false;
        console.log('[' + self.tag + '] ⏹ 已停止');
    };

    self.setRunning = function(v) {
        self.running = v;
        if (window.PI_RUNNING_STATES && self.piStateKey) window.PI_RUNNING_STATES[self.piStateKey] = v;
    };

    // === 浮动按钮 ===
    self.createButton = function() {
        var old = document.getElementById(self.btnId);
        if (old) old.remove();
        var btn = document.createElement('div');
        btn.id = self.btnId;
        btn.textContent = self.btnEmoji;
        btn.title = self.btnTitle;
        btn.className = 'pi-float-btn ' + self.btnClass;
        btn.style.bottom = self.btnBottom;
        btn.style.right = '20px';
        btn.addEventListener('click', function() { if (self.showDialog) self.showDialog(); });
        document.body.appendChild(btn);
        console.log('[' + self.tag + '] ' + self.btnEmoji + ' 浮动按钮已创建');
    };

    self.ensureButton = function() {
        if (!document.getElementById(self.btnId)) self.createButton();
    };

    // === 登录 ===
    self.doLogin = function(acc) {
        if (!acc || self.abort) { self.stop(); return Promise.resolve(); }
        var inputs = U.findLoginInputs();
        if (inputs.emailInput && inputs.passInput) {
            return Promise.resolve().then(function() {
                return U.fillInput(inputs.emailInput, acc.email);
            }).then(function() { return U.sleep(100); }).then(function() {
                return U.fillInput(inputs.passInput, acc.password);
            }).then(function() { return U.sleep(200); }).then(function() {
                return U.submitLogin();
            }).then(function() {
                self.waitGamePage();
            });
        } else {
            U.clearSiteAuth();
            window.location.href = 'https://idle.charsgame.com/auth?' + self.urlParam + '=1';
            return Promise.resolve();
        }
    };

    self.waitGamePage = function() {
        var tries = 0;
        var interval = setInterval(function() {
            if (self.abort) { clearInterval(interval); return; }
            tries++;
            var path = window.location.pathname;
            if (path.includes('/game') && !path.includes('/auth')) {
                clearInterval(interval);
                setTimeout(function() {
                    self.onArrive();
                }, 1500);
            } else if (tries > 60) {
                clearInterval(interval);
                console.log('[' + self.tag + '] 等待游戏页面超时');
                self.nextAccount();
            }
        }, 1000);
    };

    // 子类重写此方法：到达游戏页面后的操作
    self.onArrive = function() {
        var state = self.getState();
        if (!state || !state.active || self.abort) { self.stop(); return; }
        if (self.execute) {
            Promise.resolve(self.execute(state)).then(function() {
                self.nextAccount();
            });
        } else {
            self.nextAccount();
        }
    };

    // === 切号 ===
    self.nextAccount = function() {
        var state = self.getState();
        if (!state || !state.active || self.abort) { self.stop(); return; }
        var nextIdx = state.currentIdx + 1;
        var nextRound = state.round;
        if (nextIdx >= state.accounts.length) {
            if (state.maxRounds > 0 && nextRound >= state.maxRounds) {
                console.log('[' + self.tag + '] ✅ 全部完成，共运行 ' + nextRound + ' 轮');
                if (self.onComplete) self.onComplete(state);
                self.clearState(); self.running = false;
                return;
            }
            nextRound++;
            console.log('[' + self.tag + '] 第 ' + (nextRound - 1) + ' 轮完成，进入第 ' + nextRound + ' 轮');
        }
        var nextAcc = state.accounts[nextIdx % state.accounts.length];
        state.currentIdx = nextIdx % state.accounts.length;
        state.round = nextRound;
        self.saveState(state);
        console.log('[' + self.tag + '] 切换到: ' + nextAcc.name);
        U.clearSiteAuth();
        window.location.href = 'https://idle.charsgame.com/auth?' + self.urlParam + '=1';
    };

    // === 自动登录检测 ===
    self.checkAutoLogin = function() {
        var p = new URLSearchParams(window.location.search);
        if (p.get(self.urlParam) !== '1') return false;
        var state = self.getState();
        if (!state || !state.active) return false;
        self.setRunning(true); self.abort = false;
        var currentAcc = state.accounts[state.currentIdx];
        if (!currentAcc) { self.clearState(); self.running = false; return false; }
        console.log('[' + self.tag + '] 自动登录: ' + currentAcc.name + ' (' + (state.currentIdx + 1) + '/' + state.accounts.length + ')');
        setTimeout(function() {
            var retries = 0;
            var tryFill = function() {
                if (self.abort) return;
                var inputs = U.findLoginInputs();
                if (inputs.emailInput && inputs.passInput) {
                    U.fillInput(inputs.emailInput, currentAcc.email).then(function() { return U.sleep(100); })
                    .then(function() { return U.fillInput(inputs.passInput, currentAcc.password); })
                    .then(function() { return U.sleep(200); })
                    .then(function() { return U.submitLogin(); })
                    .then(function() { console.log('[' + self.tag + '] 登录成功'); self.waitGamePage(); });
                } else if (retries < 30) { retries++; setTimeout(tryFill, 500); }
                else { console.log('[' + self.tag + '] 等待登录表单超时'); }
            };
            tryFill();
        }, 1000);
        return true;
    };

    // === 初始化 ===
    self.init = function() {
        console.log('[' + self.tag + '] ' + self.btnEmoji + ' 模块初始化...');
        if (document.body) { self.ensureButton(); } else { document.addEventListener('DOMContentLoaded', function() { self.ensureButton(); }); }
        if (document.body) {
            var observer = new MutationObserver(function() { self.ensureButton(); });
            observer.observe(document.body, { childList: true, subtree: true });
        }
        setInterval(function() { self.ensureButton(); }, 2000);
        if (window.location.pathname.includes('/auth')) { self.checkAutoLogin(); }
        var state = self.getState();
        if (state && state.active && !window.location.pathname.includes('/auth')) {
            self.setRunning(true); self.abort = false;
            self.waitGamePage();
        }
    };

    // === 更新manifest.json中引用的文件顺序：在cycle-*.js前加载 ===
    console.log('[CycleRunner] 🔄 基类已加载');
}
