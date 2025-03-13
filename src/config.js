/**
 * 配置模块 - 处理配置的读取和保存
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const debug = require('./debug')

// 配置管理对象
const config = {
  /**
   * 获取配置项
   * @param {string} key 配置键
   * @param {any} defaultValue 默认值
   * @returns {any} 配置值
   */
  get(key, defaultValue) {
    try {
      // 检查是否已加载配置
      if (!global.pluginConfig) {
        const dataPath = path.join(global.utools.getPath('userData'), 'windsurf-plugin-config.json')
        try {
          if (fs.existsSync(dataPath)) {
            global.pluginConfig = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
          } else {
            global.pluginConfig = {}
          }
        } catch (e) {
          console.error('读取配置文件失败:', e)
          global.pluginConfig = {}
        }
      }
      
      // 返回配置或默认值
      return global.pluginConfig[key] !== undefined ? global.pluginConfig[key] : defaultValue
    } catch (e) {
      console.error('获取配置失败:', e)
      return defaultValue
    }
  },
  
  /**
   * 设置配置项
   * @param {string} key 配置键
   * @param {any} value 配置值
   */
  set(key, value) {
    try {
      // 确保配置对象已初始化
      if (!global.pluginConfig) {
        global.pluginConfig = {}
      }
      
      // 设置配置
      global.pluginConfig[key] = value
      
      // 保存到文件
      const dataPath = path.join(global.utools.getPath('userData'), 'windsurf-plugin-config.json')
      fs.writeFileSync(dataPath, JSON.stringify(global.pluginConfig, null, 2), 'utf8')
      
      return true
    } catch (e) {
      console.error('保存配置失败:', e)
      return false
    }
  }
}

// 导出配置对象
module.exports = config
