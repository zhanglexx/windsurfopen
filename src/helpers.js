/**
 * 辅助函数模块 - 提供各种工具函数
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

// 辅助函数对象
const helpers = {
  /**
   * 获取配置
   * @param {string} key 配置键
   * @param {any} defaultValue 默认值
   * @returns {any} 配置值
   */
  getConfig(key, defaultValue) {
    const config = require('./config')
    return config.get(key, defaultValue)
  },
  
  /**
   * 设置配置
   * @param {string} key 配置键
   * @param {any} value 配置值
   * @returns {boolean} 是否成功
   */
  setConfig(key, value) {
    const config = require('./config')
    return config.set(key, value)
  },
  
  /**
   * 检查是否为Windows系统
   * @returns {boolean} 是否为Windows系统
   */
  isWindows() {
    return os.platform() === 'win32'
  },
  
  /**
   * 检查是否为Mac系统
   * @returns {boolean} 是否为Mac系统
   */
  isMac() {
    return os.platform() === 'darwin'
  },
  
  /**
   * 检查是否为Linux系统
   * @returns {boolean} 是否为Linux系统
   */
  isLinux() {
    return os.platform() === 'linux'
  },
  
  /**
   * 获取用户主目录
   * @returns {string} 用户主目录
   */
  getHomePath() {
    return os.homedir()
  },
  
  /**
   * 获取AppData目录
   * @returns {string} AppData目录
   */
  getAppDataPath() {
    if (this.isWindows()) {
      return path.join(os.homedir(), 'AppData', 'Roaming')
    } else if (this.isMac()) {
      return path.join(os.homedir(), 'Library', 'Application Support')
    } else {
      return path.join(os.homedir(), '.config')
    }
  },
  
  /**
   * 连接路径
   * @param {string} args 路径片段
   * @returns {string} 连接后的路径
   */
  joinPath(...args) {
    return path.join(...args)
  },
  
  /**
   * 检查文件是否存在
   * @param {string} filePath 文件路径
   * @returns {boolean} 文件是否存在
   */
  fileExists(filePath) {
    return fs.existsSync(filePath)
  }
}

// 导出辅助函数对象
module.exports = helpers
