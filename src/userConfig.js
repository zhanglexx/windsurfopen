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
    return window.utools.dbStorage.getItem('windSurfPath') || ''
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
