/**
 * 主入口模块 - 整合其他模块并提供入口点
 */

// 导入依赖
const debug = require('./debug')
const config = require('./config')
const userConfig = require('./userConfig')
const { projects, initSqlJs } = require('./projects')
const helpers = require('./helpers')

// 初始化
initSqlJs()

// 暴露接口供preload.js使用
module.exports = {
  // 配置相关
  config,
  userConfig,
  
  // 项目管理
  projects,
  
  // 辅助函数
  helpers,
  
  // 调试功能
  debug,
  
  // 插件入口
  plugin: {
    // 项目搜索功能
    'windsurf-search': {
      mode: 'list',
      args: {
        // 进入插件应用时调用
        async enter(action, callbackSetList) {
          try {
            // 获取项目列表
            const projectList = await projects.getWindSurfProjects()
            
            // 设置列表项
            callbackSetList(
              projectList.map(project => ({
                title: project.name,
                description: project.uri,
                icon: 'logo.png',
                data: project
              }))
            )
          } catch (error) {
            console.error('搜索项目失败:', error)
            callbackSetList([])
          }
        },
        
        // 搜索处理
        async search(action, searchWord, callbackSetList) {
          try {
            // 获取项目列表
            const projectList = await projects.getWindSurfProjects()
            
            // 过滤项目
            const result = projectList.filter(project => {
              return project.name.toLowerCase().includes(searchWord.toLowerCase()) ||
                     project.uri.toLowerCase().includes(searchWord.toLowerCase())
            })
            
            // 设置列表项
            callbackSetList(
              result.map(project => ({
                title: project.name,
                description: project.uri,
                icon: 'logo.png',
                data: project
              }))
            )
          } catch (error) {
            console.error('搜索项目失败:', error)
            callbackSetList([])
          }
        },
        
        // 用户选择条目时调用
        select(action, itemData) {
          try {
            // 打开项目
            projects.openProject(itemData.data.uri, itemData.data.isWorkspace)
            return { type: 'success' }
          } catch (error) {
            console.error('打开项目失败:', error)
            return { type: 'error', message: `打开项目失败: ${error.message}` }
          }
        },
        
        // 插件设置
        placeholder: '搜索WindSurf项目'
      }
    },
    
    // 打开设置
    'open-setting': {
      mode: 'none',
      args: {
        // 进入插件时调用
        enter(action) {
          // 打开设置窗口
          utools.showNotification('打开设置', 'WindSurf项目管理')
          utools.redirect('windsurf-setting-page', '打开设置')
        }
      }
    },
    
    // 设置页面
    'windsurf-setting-page': {
      mode: 'list',
      args: {
        // 进入设置页面
        enter(action) {
          try {
            // 创建设置窗口
            utools.showNotification('进入设置', 'WindSurf项目管理')
            
            const windowOptions = {
              title: 'WindSurf项目管理设置',
              width: 800,
              height: 600,
              webPreferences: {
                preload: 'preload.js'
              }
            }
            
            const settingWindow = utools.createBrowserWindow(
              'ws-setting.html',
              windowOptions,
              () => {
                debug('设置窗口已关闭')
                utools.outPlugin()
              }
            )
          } catch (error) {
            console.error('打开设置窗口失败:', error)
          }
        }
      }
    }
  }
}
