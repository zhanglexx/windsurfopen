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

// 在全局暴露utools对象，供其他模块使用
global.utools = utools

// 初始化SQL.js - 使用已移至src/projects.js的实现
// 这里调用导入的initSqlJs函数以保持兼容
initSqlJs()

// 用户配置 - 使用已移至src/userConfig.js的实现，这里保持引用以兼容现有代码
// const userConfig = {
//   get windSurfPath() {
//     return config.get('windSurfPath', '')
//   },
//   set windSurfPath(value) {
//     return config.set('windSurfPath', value)
//   },
//   get timeout() {
//     return config.get('timeout', 5000)
//   },
//   set timeout(value) {
//     return config.set('timeout', value)
//   }
// }

// 项目管理
// const projects = {
//   // 获取可能的数据库路径
//   getPossibleDBPaths() {
//     const paths = []
    
//     // 使用配置中指定的数据库路径，如果为空则使用默认路径
//     let dbPath = config.get('db')
//     // debug('配置的数据库路径:', dbPath)
    
//     // 如果dbPath为空，使用默认路径
//     if (!dbPath) {
//       dbPath = path.join(
//         utools.getPath("appData"),
//         "WindSurf",
//         "User",
//         "globalStorage",
//         "state.vscdb"
//       )
//       // debug('使用默认数据库路径:', dbPath)
//     }
    
//     if (fs.existsSync(dbPath)) {
//       paths.push(dbPath)
//     }
    
//     // 使用配置中指定的storage路径，如果为空则使用默认路径
//     let storagePath = config.get('storage')
    
//     // 如果storagePath为空，使用默认路径
//     if (!storagePath) {
//       storagePath = path.join(
//         utools.getPath("appData"), 
//         "WindSurf", 
//         "storage.json"
//       )
//     }
    
//     if (fs.existsSync(storagePath)) {
//       paths.push(storagePath)
//     }
    
//     return paths
//   },
  
//   // 递归扫描目录寻找数据库文件
//   scanDirectoryForDB(dirPath, result) {
//     try {
//       const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      
//       for (const entry of entries) {
//         try {
//           const entryName = entry.name
//           const fullPath = path.join(dirPath, entryName)
          
//           if (entry.isFile()) {
//             // 如果是数据库文件，添加到结果中
//             if (entryName.endsWith('.vscdb') || 
//               entry.endsWith('.json') || 
//               entryName === 'storage.json' || 
//               entryName === 'state.json') {
//               result.push(fullPath)
//             } 
//           } 
//           // 如果是目录，继续递归
//           else if (entry.isDirectory() && !entryName.startsWith('.')) {
//             this.scanDirectoryForDB(fullPath, result)
//           }
//         } catch (error) {
//           // 忽略单个文件操作错误
//         }
//       }
//     } catch (error) {
//       // 忽略目录访问错误
//     }
//   },
  
//   // 从SQLite数据库获取WindSurf项目
//   async getWindSurfProjects() {
//     // 获取可能的数据库路径
//     const dbPaths = this.getPossibleDBPaths()
//     if (!dbPaths || dbPaths.length === 0) {
//       return []
//     }
  
//     // 尝试所有可能的数据库文件
//     for (const dbPath of dbPaths) {
//       // 检查文件扩展名
//       const ext = path.extname(dbPath)
  
//       if (ext === '.vscdb') {
//         // SQLite 数据库文件
//         try {
//           // 初始化SQL.js
//           const SQL = await initSqlJs()
          
//           // 读取数据库文件
//           const dbBuffer = fs.readFileSync(dbPath)
          
//           // 创建数据库对象
//           const db = new SQL.Database(dbBuffer)
          
//           // 查询最近打开的项目列表
//           const sql = "SELECT value FROM ItemTable WHERE key = 'history.recentlyOpenedPathsList' OR key LIKE '%openedPathsList%'"
          
//           try {
//             const results = db.exec(sql)
            
//             // 检查是否有结果
//             if (!results || results.length === 0 || !results[0] || !results[0].values || !results[0].values[0]) {
//               continue
//             }
            
//             // 获取结果值
//             const resultValue = results[0].values[0].toString()
//             let historyData
//             try {
//               historyData = JSON.parse(resultValue)
//             } catch (parseError) {
//               continue
//             }
            
//             // 提取项目路径
//             let projectPaths = []
            
//             if (historyData.entries && Array.isArray(historyData.entries)) {
//               projectPaths = historyData.entries.map(entry => {
//                 if (typeof entry === 'string') return entry
                  
//                   // 尝试提取URI
//                   const uri = entry.uri || entry.fileUri || entry.folderUri || entry.workspace || entry.path
//                   if (!uri) return null
                  
//                   return uri
//               }).filter(Boolean)
//             } else {
//               // 尝试使用正则表达式提取
//               try {
//                 const regex = /"uri":"file:\/\/\/(.*?)"/g
//                 let match
//                 const entries = []
                
//                 while ((match = regex.exec(resultValue)) !== null) {
//                   const filePath = match[1].replace(/\\/g, '/')
//                   if (filePath && !filePath.includes('\\\\')) {
//                     entries.push(`file:///${filePath}`)
//                   }
//                 }
                
//                 if (entries.length > 0) {
//                   // 处理项目路径并返回
//                   const processedProjects = entries.map(uri => {
//                     try {
//                       uri = uri.replace(/^file:\/\/\//, '')
//                       const decodedUri = decodeURIComponent(uri)
//                       const name = path.basename(decodedUri)
//                       const isWorkspace = decodedUri.endsWith('.code-workspace')
                      
//                       return {
//                         title: name,
//                         description: decodedUri,
//                         icon: isWorkspace ? 'folder' : 'file',
//                         isWorkspace
//                       }
//                     } catch (itemError) {
//                       return null
//                     }
//                   }).filter(Boolean)
                  
//                   if (processedProjects.length > 0) {
//                     return processedProjects
//                   }
//                 }
                
//                 continue
//               } catch (regexError) {
//                 // 正则表达式提取失败，继续尝试其他方法
//                 continue
//               }
//             }
              
//             try {
//               // 处理项目路径
//               const projectPaths = historyData.entries.map(entry => {
//                 if (typeof entry === 'string') return entry
                    
//                     // 尝试提取URI
//                     const uri = entry.uri || entry.fileUri || entry.folderUri || entry.workspace || entry.path
//                     if (!uri) return null
                    
//                     return uri
//                   }).filter(Boolean)
                  
//                   // 处理项目路径并返回
//                   const processedProjects = projectPaths.map(uri => {

//                     uri = uri.replace(/^file:\/\/\//, '')
//                     const decodedUri = decodeURIComponent(uri)
//                     const name = path.basename(decodedUri)
//                     const isWorkspace = decodedUri.endsWith('.code-workspace')
//                     return {
//                       title: name,
//                       description: decodedUri,
//                       icon: isWorkspace ? 'folder' : 'file',
//                       isWorkspace
//                     }
//                   }).filter(Boolean)
                
//                 if (processedProjects.length > 0) {
//                   return processedProjects
//                 }
//               } catch (jsonError) {
//                 // 忽略JSON解析错误
//               }
//             } catch (queryError) {
//               // 关闭数据库连接
//               try {
//                 db.close()
//               } catch (closeError) {
//                 // 忽略关闭错误
//               }
//             }
          
//       } catch (error) {
//           // 忽略数据库读取错误
//       }
//     } else if (ext === '.json') {
//         // 处理JSON文件
//         try {
//           const content = fs.readFileSync(dbPath, { encoding: 'utf-8' })
//           let jsonData
            
//           try {
//             jsonData = JSON.parse(content)
//           } catch (parseError) {
//             // 尝试使用正则表达式提取
//             try {
//               const regex = /"uri":"file:\/\/\/(.*?)"/g
//               let match
//               const entries = []
              
//               while ((match = regex.exec(content)) !== null) {
//                 const filePath = match[1].replace(/\\/g, '/')
//                 if (filePath && !filePath.includes('\\\\')) {
//                   entries.push(`file:///${filePath}`)
//                 }
//               }
              
//               if (entries.length > 0) {
//                 // 处理项目路径并返回
//                 const processedProjects = entries.map(uri => {
//                   try {
//                     uri = uri.replace(/^file:\/\/\//, '')
//                     const decodedUri = decodeURIComponent(uri)
//                     const name = path.basename(decodedUri)
//                     const isWorkspace = decodedUri.endsWith('.code-workspace')
                    
//                     return {
//                       title: name,
//                       description: decodedUri,
//                       icon: isWorkspace ? 'folder' : 'file',
//                       isWorkspace
//                     }
//                   } catch (itemError) {
//                     return null
//                   }
//                 }).filter(Boolean)
                
//                 if (processedProjects.length > 0) {
//                   return processedProjects
//                 }
//               }
              
//               continue
//             } catch (regexError) {
//               // 正则表达式提取失败，继续尝试其他方法
//               continue
//             }
//           }

//           // 处理项目路径
//           const projectPaths = jsonData.entries ? jsonData.entries.map(entry => {
//             if (typeof entry === 'string') return entry
                
//                 // 尝试提取URI
//                 const uri = entry.uri || entry.fileUri || entry.folderUri || entry.workspace || entry.path
//                 if (!uri) return null
                
//                 return uri
//               }).filter(Boolean) : [];
                
//               // 处理项目路径并返回
//               const processedProjects = projectPaths.map(uri => {
//                 try {
//                   uri = uri.replace(/^file:\/\/\//, '')
//                   const decodedUri = decodeURIComponent(uri)
//                   const name = path.basename(decodedUri)
//                   const isWorkspace = decodedUri.endsWith('.code-workspace')
//                   return {
//                     title: name,
//                     description: decodedUri,
//                     icon: isWorkspace ? 'folder' : 'file',
//                     isWorkspace
//                   }
//                 } catch (itemError) {
//                   return null
//                 }
//               }).filter(Boolean)
                
//               if (processedProjects.length > 0) {
//                 return processedProjects
//               }


//         } catch (fileError) {
//           // 忽略文件读取错误
//         }
//       }
//     }

//     // 所有方法都失败了
//     return []

//   },

//   // 打开项目
//   openProject(projectUri, isWorkspace) {
//     try {
//       // 获取配置
//       const execPath = userConfig.windSurfPath || 'windsurf'

//       // 构建命令 - 修复引号格式问题
//       let cmd
//       // 对路径进行规范化处理
//       const normalizedPath = projectUri.replace(/\//g, '\\')

//       cmd = `${execPath}  "${normalizedPath}"`

//       // debug('执行命令:', cmd)
//       // 设置超时
//       const timeout = userConfig.timeout || 10000  // 延长超时时间到10秒

//       // 使用不同的方式启动进程
//       const { spawn } = require('child_process');
//       const cmdParts = cmd.split(' ');
//       const command = cmdParts[0];
//       const args = cmdParts.slice(1);
      
//       // debug('启动进程:', command, args);
      
//       const child = spawn(command, args, { 
//         detached: true,  // 使子进程独立于父进程
//         shell: true,     // 使用shell解释命令
//         stdio: 'ignore', // 忽略stdin/stdout/stderr
//         windowsHide: false // 显示窗口
//       });
      
//       // 分离子进程，使其可以在父进程退出后继续运行
//       child.unref();
      
//       // 延迟一段时间后退出插件，给进程启动一些时间
//       setTimeout(() => {
//         // 退出插件
//         utools.outPlugin();
//       }, 1000);  // 延迟1秒退出
//     } catch (error) {
//       console.error('打开项目失败:', error);
//       debug('打开项目失败:', error);
//     }
//   }
// }

// 暴露utools API给webview
window.preload = {
  // 暴露config对象
  config: {
    get: helpers.getConfig,
    set: helpers.setConfig
  },
  
  // 暴露辅助函数
  isWindows: helpers.isWindows,
  isMac: helpers.isMac,
  isLinux: helpers.isLinux,
  getHomePath: helpers.getHomePath,
  getAppDataPath: helpers.getAppDataPath,
  joinPath: helpers.joinPath,
  fileExists: helpers.fileExists,
  
  // 暴露getPossibleDBPaths方法
  getPossibleDBPaths: () => projects.getPossibleDBPaths(),
  
  // 暴露调试函数
  debug: debug
}

// 导出uTools插件 
// 注意：我们暂时保留现有的导出结构，但内部使用新模块的实现
window.exports = plugin // 使用新的插件模块实现

// 导出uTools插件
// window.exports = {
//   'windsurf-projects': {
//     mode: 'list',
//     args: {
//       // 进入插件应用时调用
//       enter: async (action, callbackSetList) => {
//         try {
//           // 加载所有WindSurf项目并显示
//           callbackSetList([
//             {
//               title: '正在加载项目...',
//               description: '请稍候'
//             }
//           ])
          
//           // 异步加载项目
//           try {
//             const projectsList = await projects.getWindSurfProjects()
            
//             if (projectsList.length === 0) {
//               callbackSetList([
//                 {
//                   title: '未找到项目',
//                   description: '请确保WindSurf已经安装并使用过'
//                 }
//               ])
//             } else {
//               callbackSetList(projectsList)
//             }
//           } catch (innerError) {
//             callbackSetList([
//               {
//                 title: '加载失败',
//                 description: innerError.message
//               }
//             ])
//           }
          
//         } catch (error) {
//           console.error('加载项目失败:', error)
//           callbackSetList([
//             {
//               title: '加载失败',
//               description: error.message
//             }
//           ])
//         }
//       },
      
//       // 搜索处理
//       search: async (action, searchWord, callbackSetList) => {
//         try {
//           // 获取所有项目
//           const projectsList = await projects.getWindSurfProjects()
          
//           // 如果没有搜索词，显示所有项目
//           if (!searchWord) {
//             if (projectsList.length === 0) {
//               return callbackSetList([
//                 {
//                   title: '未找到项目',
//                   description: '请确保WindSurf已经安装并使用过'
//                 }
//               ])
//             }
//             return callbackSetList(projectsList)
//           }
          
//           // 按名称和路径搜索
//           const searchTerms = searchWord.toLowerCase().split(/\s+/)
          
//           const filteredProjects = projectsList.filter(project => {
//             return searchTerms.every(term => 
//               project.title.toLowerCase().includes(term) || project.description.toLowerCase().includes(term)
//             )
//           })
          
//           // 显示过滤后的项目
//           if (filteredProjects.length === 0) {
//             callbackSetList([
//               {
//                 title: '未找到匹配项目',
//                 description: `没有找到包含 "${searchWord}" 的项目`
//               }
//             ])
//           } else {
//             callbackSetList(filteredProjects)
//           }
//         } catch (error) {
//           console.error('搜索项目失败:', error)
//           callbackSetList([
//             {
//               title: '搜索失败',
//               description: error.message
//             }
//           ])
//         }
//       },
      
//       // 用户选择条目时调用
//       select: (action, itemData) => {
//         // 如果是错误或提示项，不执行任何操作
//         if (itemData.title === '未找到项目' || 
//             itemData.title === '未找到匹配项目' ||
//             itemData.title === '加载失败' ||
//             itemData.title === '搜索失败' ||
//             itemData.title === '正在加载项目...') {
//           return
//         }
        
//         // 打开项目
//         projects.openProject(itemData.description, itemData.isWorkspace)
//       },
      
//       // 插件设置
//       placeholder: '搜索WindSurf项目'
//     }
//   },
//   'windsurf-settings': {
//     mode: 'none',
//     args: {
//       // 进入插件时调用
//       enter: (action) => {
//         try {
//           // 使用redirect跳转到设置页面功能
//           utools.redirect('windsurf-setting-page');
//         } catch (error) {
//           console.error('打开设置页面失败:', error);
//           utools.showNotification('打开设置页面失败: ' + error.message);
//         }
//       }
//     }
//   },
//   'windsurf-setting-page': {
//     mode: 'list',
//     args: {
//       // 进入设置页面
//       enter: (action) => {
//         // 先确保主窗口显示
//         utools.showMainWindow();
        
//         // 读取设置表单HTML
//         const settingHTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        
//         // 创建设置表单DOM
//         const parser = new DOMParser();
//         const settingDoc = parser.parseFromString(settingHTML, 'text/html');
        
//         // 清空当前内容
//         document.body.innerHTML = '';
        
//         // 添加设置页面内容
//         document.body.innerHTML = settingHTML;
        
//         // 添加脚本
//         const script = document.createElement('script');
//         script.src = './setting.js';
//         document.body.appendChild(script);
        
//         // 返回空列表，这样就不会显示搜索结果
//         return [];
//       }
//     }
//   }
// }
