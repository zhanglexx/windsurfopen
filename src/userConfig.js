/**
 * 用户配置模块 - 管理用户特定配置
 */

const config = require('./config')

// 用户配置对象
const userConfig = {
  /**
   * 获取WindSurf路径
   * @returns {string} WindSurf路径
   */
  getWindSurfPath() {
    return config.get('windSurfPath', '')
  },
  
  /**
   * 设置WindSurf路径
   * @param {string} value WindSurf路径
   */
  setWindSurfPath(value) {
    return config.set('windSurfPath', value)
  },
  
  /**
   * 获取超时时间
   * @returns {number} 超时时间(毫秒)
   */
  getTimeout() {
    return config.get('timeout', 10000)
  },
  
  /**
   * 设置超时时间
   * @param {number} value 超时时间(毫秒)
   */
  setTimeout(value) {
    return config.set('timeout', value)
  }
}

// 导出用户配置对象
module.exports = userConfig
