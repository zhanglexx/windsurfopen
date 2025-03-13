/**
 * WindSurf项目管理 - 新架构入口点
 * 
 * 该文件作为新架构的入口点，整合所有模块
 */

// 导入模块
const debug = require('./debug')
const config = require('./config')
const userConfig = require('./userConfig')
const { projects, initSqlJs } = require('./projects')
const helpers = require('./helpers')
const plugin = require('./plugin')

// 初始化
initSqlJs()

// 导出所有模块
module.exports = {
  // 调试功能
  debug,
  
  // 配置相关
  config,
  userConfig,
  
  // 项目管理
  projects,
  
  // 辅助函数
  helpers,
  
  // 插件定义
  plugin
}
