const fs = require('fs')
const path = require('path')
const os = require('os')
const { exec, execSync } = require('child_process')


// 导入已重构的模块
const debug = require('./src/debug')
const config = require('./src/config')
const userConfig = require('./src/userConfig')
const plugin = require('./src/plugin')

global.utools = utools

/**
 * 从系统中查找WindSurf可执行文件的路径
 * @returns {string} WindSurf可执行文件的路径，如果未找到则返回默认值
 */
function findWindSurfPath() {
  try {
    const env = Object.assign({}, process.env, { PATH: process.env.PATH + ':/usr/local/bin:/usr/bin' });
    const result = utools.isWindows()
      ? execSync('where windsurf', { env }).toString().trim().split('\n')[0]
      : execSync('which windsurf', { env }).toString().trim();
    
    return result || 'windsurf';
  } catch (error) {
    debug('查找WindSurf路径失败: ' + error.message);
    return 'windsurf';
  }
}

window.preload = {
  config: {
    get: config.get,
    set: config.set
  },
  // 用户配置
  userConfig: {
    getWindSurfPath: userConfig.getWindSurfPath,
    setWindSurfPath: userConfig.setWindSurfPath,
    getTimeout: userConfig.getTimeout,
    setTimeout: userConfig.setTimeout
  },

  // 系统功能
  system: {
    findWindSurfPath: findWindSurfPath
  },

  // 调试函数
  debug: debug
}

// 导出uTools插件
window.exports = plugin
