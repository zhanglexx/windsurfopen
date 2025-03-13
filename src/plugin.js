/**
 * 插件模块 - 定义插件的各种操作模式和功能
 */

const debug = require('./debug')
const { projects } = require('./projects')

// 插件定义
const plugin = {
  // 项目搜索功能
  'windsurf-projects': {
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
  'windsurf-settings': {
    mode: 'none',
    args: {
      // 进入插件时调用
      enter(action) {
        // 打开设置窗口
        global.utools.showNotification('打开设置', 'WindSurf项目管理')
        global.utools.redirect('windsurf-setting-page', '打开设置')
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
          global.utools.showNotification('进入设置', 'WindSurf项目管理')
          
          const windowOptions = {
            title: 'WindSurf项目管理设置',
            width: 800,
            height: 600,
            webPreferences: {
              preload: 'preload.js'
            }
          }
          
          const settingWindow = global.utools.createBrowserWindow(
            'ws-setting.html',
            windowOptions,
            () => {
              debug('设置窗口已关闭')
              global.utools.outPlugin()
            }
          )
        } catch (error) {
          console.error('打开设置窗口失败:', error)
        }
      }
    }
  }
}

// 导出插件定义
module.exports = plugin
