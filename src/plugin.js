/**
 * 插件模块 - 定义插件的各种操作模式和功能
 */

const debug = require('./debug')
const { projects } = require('./projects')
const userConfig = require('./userConfig')
const config = require('./config')
const fs = require('fs')
const path = require('path')
const os = require('os')


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
          debug('搜索项目失败:', error)
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
          debug('搜索项目失败:', error)
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
          debug('打开项目失败:', error)
          return { type: 'error', message: `打开项目失败: ${error.message}` }
        }
      },
      
      // 插件设置
      placeholder: '搜索WindSurf项目'
    }
  },
  
  // 设置功能
  "windsurf-settings": {
    mode: "none",
    args: {
      enter: () => {
        const ubWindow = utools.createBrowserWindow(
          "setting.html",
          {
            show: false,
            title: "设置",
            width: 1000,
            height: 600,
            webPreferences: {
              preload: "preload.js",
            },
          },
          () => {
            // 显示
            ubWindow.show();
          }
        );
      },
    },
  },
}

// 导出插件定义
module.exports = plugin
