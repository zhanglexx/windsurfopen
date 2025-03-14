const fs = require('fs')
const path = require('path')
const os = require('os')
const { exec } = require('child_process')

// 导入已重构的模块
const debug = require('./src/debug')
const config = require('./src/config')
const userConfig = require('./src/userConfig')
const { projects, initSqlJs } = require('./src/projects')
const helpers = require('./src/helpers')
const plugin = require('./src/plugin')

global.utools = utools

// 初始化SQL.js
initSqlJs()

window.preload = {
  config: {
    get: helpers.getConfig,
    set: helpers.setConfig
  },
  isWindows: helpers.isWindows,
  isMac: helpers.isMac,
  isLinux: helpers.isLinux,
  getHomePath: helpers.getHomePath,
  getAppDataPath: helpers.getAppDataPath,
  joinPath: helpers.joinPath,
  fileExists: helpers.fileExists,

  getPossibleDBPaths: () => projects.getPossibleDBPaths(),
  // 调试函数
  debug: debug
}

// 导出uTools插件
window.exports = plugin
