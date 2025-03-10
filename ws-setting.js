// 获取DOM元素
const shellInput = document.getElementById('shell-input');
const codeInput = document.getElementById('code-input');
const dbInput = document.getElementById('db-input');
const storageInput = document.getElementById('storage-input');
const timeoutInput = document.getElementById('timeout-input');
const saveButton = document.getElementById('save-button');

// 初始化配置
document.addEventListener('DOMContentLoaded', () => {
    // 从uTools获取设置
    loadSettings();
});

// 加载设置
function loadSettings() {
    try {
        // 通过preload获取配置
        const shell = window.preload.getConfig('shell', '');
        const code = window.preload.getConfig('code', 'code');
        const db = window.preload.getConfig('db', getDefaultDbPath());
        const storage = window.preload.getConfig('storage', getDefaultStoragePath());
        const timeout = window.preload.getConfig('timeout', 3000);

        // 填充表单
        shellInput.value = shell;
        codeInput.value = code;
        dbInput.value = db;
        storageInput.value = storage;
        timeoutInput.value = timeout;

        console.log('设置已加载:', { shell, code, db, storage, timeout });
    } catch (error) {
        console.error('加载设置失败:', error);
        alert('加载设置失败: ' + error.message);
    }
}

// 获取默认数据库路径
function getDefaultDbPath() {
    try {
        // 根据不同操作系统获取默认路径
        if (window.preload.isWindows()) {
            return window.preload.joinPath(
                window.preload.getAppDataPath(),
                'Code',
                'User',
                'globalStorage',
                'state.vscdb'
            );
        } else if (window.preload.isMac()) {
            return window.preload.joinPath(
                window.preload.getHomePath(),
                'Library',
                'Application Support',
                'Code',
                'User',
                'globalStorage',
                'state.vscdb'
            );
        } else {
            // Linux等其他系统
            return window.preload.joinPath(
                window.preload.getHomePath(),
                '.config',
                'Code',
                'User',
                'globalStorage',
                'state.vscdb'
            );
        }
    } catch (error) {
        console.error('获取默认数据库路径失败:', error);
        return '';
    }
}

// 获取默认存储路径
function getDefaultStoragePath() {
    try {
        // 根据不同操作系统获取默认路径
        if (window.preload.isWindows()) {
            return window.preload.joinPath(
                window.preload.getAppDataPath(),
                'Code',
                'User',
                'globalStorage',
                'storage.json'
            );
        } else if (window.preload.isMac()) {
            return window.preload.joinPath(
                window.preload.getHomePath(),
                'Library',
                'Application Support',
                'Code',
                'User',
                'globalStorage',
                'storage.json'
            );
        } else {
            // Linux等其他系统
            return window.preload.joinPath(
                window.preload.getHomePath(),
                '.config',
                'Code',
                'User',
                'globalStorage',
                'storage.json'
            );
        }
    } catch (error) {
        console.error('获取默认存储路径失败:', error);
        return '';
    }
}

// 保存设置
saveButton.addEventListener('click', () => {
    try {
        // 获取表单值
        const shell = shellInput.value.trim();
        const code = codeInput.value.trim();
        const db = dbInput.value.trim();
        const storage = storageInput.value.trim();
        const timeout = parseInt(timeoutInput.value.trim()) || 3000;

        // 通过preload保存配置
        window.preload.setConfig('shell', shell);
        window.preload.setConfig('code', code);
        window.preload.setConfig('db', db);
        window.preload.setConfig('storage', storage);
        window.preload.setConfig('timeout', timeout);

        console.log('设置已保存:', { shell, code, db, storage, timeout });
        alert('设置已保存');
    } catch (error) {
        console.error('保存设置失败:', error);
        alert('保存设置失败: ' + error.message);
    }
});
