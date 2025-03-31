/**
 * 用户配置模块 - 管理用户特定配置
 */

// 用户配置对象
const userConfig = {
  /**
   * 获取WindSurf路径
   * @returns {string} WindSurf路径
   */
  getWindSurfPath() {
    // 首先从数据库获取用户设置的路径
    const storedPath = window.utools.dbStorage.getItem('windSurfPath');
    if (storedPath) {
      return storedPath;
    }
    
    // 如果没有用户设置，尝试查找系统中的WindSurf路径
    try {
      // 使用utools API查找可执行文件
      const command = window.utools.isWindows() ? 'where windsurf' : 'which windsurf';
      
      // 使用utools.shellExec执行命令
      const result = window.utools.shellExec(command);
      
      if (result.exitCode === 0 && result.stdout) {
        // 处理可能的多行结果（Windows上）
        const path = result.stdout.trim().split('\n')[0];
        return path;
      }
    } catch (error) {
      console.error('查找WindSurf路径失败:', error);
    }
    
    // 如果都失败了，返回默认值
    return 'windsurf';
  },

  /**
   * 设置WindSurf路径
   * @param {string} value WindSurf路径
   */
  setWindSurfPath(value) {
    return window.utools.dbStorage.setItem('windSurfPath', value)
  },

  /**
   * 获取超时时间
   * @returns {number} 超时时间(毫秒)
   */
  getTimeout() {
    return window.utools.dbStorage.getItem('timeout') || 10000
  },

  /**
   * 设置超时时间
   * @param {number} value 超时时间(毫秒)
   */
  setTimeout(value) {
    return window.utools.dbStorage.setItem('timeout', value)
  },

  /**
   * 获取数据库路径
   * @returns {string} 数据库路径
   */
  getDBPath() {
    return window.utools.dbStorage.getItem('dbPath') || ''
  },

  /**
   * 设置数据库路径
   * @param {string} value 数据库路径
   */
  setDBPath(value) {
    return window.utools.dbStorage.setItem('dbPath', value)
  },

  /**
   * 获取存储路径
   * @returns {string} 存储路径
   */
  getStoragePath() {
    return window.utools.dbStorage.getItem('storagePath') || ''
  },

  /**
   * 设置存储路径
   * @param {string} value 存储路径
   */
  setStoragePath(value) {
    return window.utools.dbStorage.setItem('storagePath', value)
  }
}

// 导出用户配置对象
module.exports = {
  userConfig
}
