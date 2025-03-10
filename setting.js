// 获取元素
const shellInput = document.getElementById('shell');
const codeInput = document.getElementById('code');
const dbInput = document.getElementById('db');
const storageInput = document.getElementById('storage');
const timeoutInput = document.getElementById('timeout');
const saveBtn = document.getElementById('saveBtn');
const messageEl = document.getElementById('message');

// 显示消息
function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'message message-' + type;
    messageEl.style.display = 'block';
    
    // 3秒后自动消失
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

// 加载设置
function loadSettings() {
    try {
        // 从uTools获取配置
        shellInput.value = window.utools.dbStorage.getItem('shell') || '';
        codeInput.value = window.utools.dbStorage.getItem('code') || 'code';
        dbInput.value = window.utools.dbStorage.getItem('db') || '';
        storageInput.value = window.utools.dbStorage.getItem('storage') || '';
        timeoutInput.value = window.utools.dbStorage.getItem('timeout') || '3000';
        
        console.log('设置已加载');
        // 调试信息
        if (window.preload && window.preload.debug) {
            window.preload.debug('设置已加载', {
                shell: shellInput.value,
                code: codeInput.value,
                db: dbInput.value,
                storage: storageInput.value,
                timeout: timeoutInput.value
            });
        }
    } catch (error) {
        console.error('加载设置失败:', error);
        showMessage('加载设置失败: ' + error.message, 'error');
    }
}

// 保存设置
saveBtn.addEventListener('click', () => {
    try {
        // 保存所有配置
        window.utools.dbStorage.setItem('shell', shellInput.value);
        window.utools.dbStorage.setItem('code', codeInput.value);
        window.utools.dbStorage.setItem('db', dbInput.value);
        window.utools.dbStorage.setItem('storage', storageInput.value);
        window.utools.dbStorage.setItem('timeout', timeoutInput.value);
        
        console.log('设置已保存');
        showMessage('设置已保存', 'success');
        
        // 调试信息
        if (window.preload && window.preload.debug) {
            window.preload.debug('设置已保存', {
                shell: shellInput.value,
                code: codeInput.value,
                db: dbInput.value,
                storage: storageInput.value,
                timeout: timeoutInput.value
            });
        }
    } catch (error) {
        console.error('保存设置失败:', error);
        showMessage('保存设置失败: ' + error.message, 'error');
    }
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 确保uTools API可用
    if (typeof window.utools === 'undefined' && window.parent && window.parent.utools) {
        window.utools = window.parent.utools;
    }
    
    loadSettings();
});
