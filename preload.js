const fs = require('fs')
const path = require('path')
const os = require('os')
const { exec } = require('child_process')


// 导入已重构的模块
const debug = require('./src/debug')
const config = require('./src/config')
const userConfig = require('./src/userConfig')
const projects = require('./src/projects').projects
const helpers = require('./src/helpers')
const plugin = require('./src/plugin')

global.utools = utools

window.preload = {
  config: {
    get: config.get,
    set: config.set
  },
  isWindows: helpers.isWindows,
  isMac: helpers.isMac,
  isLinux: helpers.isLinux,
  getHomePath: helpers.getHomePath,
  getAppDataPath: helpers.getAppDataPath,
  fileExists: helpers.fileExists,

  // 用户配置
  userConfig: {
    getWindSurfPath: userConfig.getWindSurfPath,
    setWindSurfPath: userConfig.setWindSurfPath,
    getTimeout: userConfig.getTimeout,
    setTimeout: userConfig.setTimeout
  },

  // 调试函数
  debug: debug
}

// 导出uTools插件
window.exports = plugin
