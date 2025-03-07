const fs = require('fs')
const path = require('path')
const os = require('os')
const { exec } = require('child_process')

// 初始化SQL.js
const initSqlJs = async function() {
  try {
    const sqlJsPath = path.join(__dirname, 'sqljs', 'sql-wasm.js')

    if (fs.existsSync(sqlJsPath)) {
      // 设置SQL.js加载配置
      return require(sqlJsPath)({
        locateFile: file => path.join(__dirname, 'sqljs', file)
      })
    }

    // 尝试直接加载
    return require('sql.js')
  } catch (error) {
    console.error('加载sql.js失败:', error)
    throw error
  }
}

// 调试函数
function debug(message, data) {
  // 在uTools中显示通知
  try {
    if (utools && typeof utools.showNotification === 'function') {
      let dataStr = '';
      try {
        if (data !== undefined) {
          dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
          // 限制长度，避免通知过长
          if (dataStr.length > 100) {
            dataStr = dataStr.substring(0, 97) + '...';
          }
        }
      } catch (e) {
        dataStr = '无法显示数据';
      }
      
      utools.showNotification(`${message} ${dataStr}`, 'WindSurf项目管理');
    }
  } catch (e) {
    console.error('显示uTools通知失败:', e);
  }
}

// 配置管理
const config = {
  get: (key, defaultValue) => {
    try {
      const value = utools.dbStorage.getItem(key)
      return value === null ? defaultValue : value
    } catch (e) {
      return defaultValue
    }
  },
  set: (key, value) => {
    try {
      utools.dbStorage.setItem(key, value)
      return true
    } catch (e) {
      return false
    }
  }
}

// 用户配置
const userConfig = {
  get windSurfPath() {
    return config.get('windSurfPath', '')
  },
  set windSurfPath(value) {
    config.set('windSurfPath', value)
  },
  get timeout() {
    return config.get('timeout', 5000)
  },
  set timeout(value) {
    config.set('timeout', value)
  }
}

// 项目管理
const projects = {
  // 获取可能的数据库路径
  getPossibleDBPaths() {
    const paths = []
    const homeDir = os.homedir()
    
    // 可能存在数据库的目录
    const appDataDirs = [
      // Windows
      path.join(homeDir, 'AppData', 'Roaming', 'WindSurf'),
      path.join(homeDir, 'AppData', 'Local', 'WindSurf'),
      path.join(homeDir, '.windsurf'),
      // macOS
      path.join(homeDir, 'Library', 'Application Support', 'WindSurf'),
      // Linux
      path.join(homeDir, '.config', 'windsurf')
    ]
    
    // 可能的数据库文件名
    const dbFiles = [
      'state.vscdb',
      'storage.json',
      'state.json',
      path.join('User', 'globalStorage', 'state.vscdb'),
      path.join('user-data', 'User', 'globalStorage', 'state.vscdb')
    ]
    
    // 组合可能的路径
    appDataDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        // 检查该目录下的所有文件和子目录
        this.scanDirectoryForDB(dir, paths)
        
        // 检查特定文件名
        dbFiles.forEach(file => {
          const fullPath = path.join(dir, file)
          if (fs.existsSync(fullPath)) {
            paths.push(fullPath)
          }
        })
      }
    })
    
    return paths
  },
  
  // 递归扫描目录寻找数据库文件
  scanDirectoryForDB(dirPath, result) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        try {
          const entryName = entry.name
          const fullPath = path.join(dirPath, entryName)
          
          if (entry.isFile()) {
            // 如果是数据库文件，添加到结果中
            if (entryName.endsWith('.vscdb') || 
              entry.endsWith('.json') || 
              entryName === 'storage.json' || 
              entryName === 'state.json') {
              result.push(fullPath)
            } 
          } 
          // 如果是目录，继续递归
          else if (entry.isDirectory() && !entryName.startsWith('.')) {
            this.scanDirectoryForDB(fullPath, result)
          }
        } catch (error) {
          // 忽略单个文件操作错误
        }
      }
    } catch (error) {
      // 忽略目录访问错误
    }
  },
  
  // 从SQLite数据库获取WindSurf项目
  async getWindSurfProjects() {
    // 获取可能的数据库路径
    const dbPaths = this.getPossibleDBPaths()

    if (!dbPaths || dbPaths.length === 0) {
      return []
    }
  
    // 尝试所有可能的数据库文件
    for (const dbPath of dbPaths) {
      // 检查文件扩展名
      const ext = path.extname(dbPath)
  
      if (ext === '.vscdb') {
        // SQLite 数据库文件
        try {
          // 初始化SQL.js
          const SQL = await initSqlJs()
          
          // 读取数据库文件
          const dbBuffer = fs.readFileSync(dbPath)
          
          // 创建数据库对象
          const db = new SQL.Database(dbBuffer)
          
          // 查询最近打开的项目列表
          const sql = "SELECT value FROM ItemTable WHERE key = 'history.recentlyOpenedPathsList' OR key LIKE '%openedPathsList%'"
          
          try {
            const results = db.exec(sql)
            
            // 检查是否有结果
            if (!results || results.length === 0 || !results[0] || !results[0].values || !results[0].values[0]) {
              continue
            }
            
            // 获取结果值
            const resultValue = results[0].values[0].toString()
            let historyData
            try {
              historyData = JSON.parse(resultValue)
            } catch (parseError) {
              continue
            }
            
            // 提取项目路径
            let projectPaths = []
            
            if (historyData.entries && Array.isArray(historyData.entries)) {
              projectPaths = historyData.entries.map(entry => {
                if (typeof entry === 'string') return entry
                  
                  // 尝试提取URI
                  const uri = entry.uri || entry.fileUri || entry.folderUri || entry.workspace || entry.path
                  if (!uri) return null
                  
                  return uri
              }).filter(Boolean)
            } else {
              // 尝试使用正则表达式提取
              try {
                const regex = /"uri":"file:\/\/\/(.*?)"/g
                let match
                const entries = []
                
                while ((match = regex.exec(resultValue)) !== null) {
                  const filePath = match[1].replace(/\\/g, '/')
                  if (filePath && !filePath.includes('\\\\')) {
                    entries.push(`file:///${filePath}`)
                  }
                }
                
                if (entries.length > 0) {
                  // 处理项目路径并返回
                  const processedProjects = entries.map(uri => {
                    try {
                      uri = uri.replace(/^file:\/\/\//, '')
                      const decodedUri = decodeURIComponent(uri)
                      const name = path.basename(decodedUri)
                      const isWorkspace = decodedUri.endsWith('.code-workspace')
                      
                      return {
                        title: name,
                        description: decodedUri,
                        icon: isWorkspace ? 'folder' : 'file',
                        isWorkspace
                      }
                    } catch (itemError) {
                      return null
                    }
                  }).filter(Boolean)
                  
                  if (processedProjects.length > 0) {
                    return processedProjects
                  }
                }
                
                continue
              } catch (regexError) {
                // 正则表达式提取失败，继续尝试其他方法
                continue
              }
            }
              
            try {
              // 处理项目路径
              const projectPaths = historyData.entries.map(entry => {
                if (typeof entry === 'string') return entry
                    
                    // 尝试提取URI
                    const uri = entry.uri || entry.fileUri || entry.folderUri || entry.workspace || entry.path
                    if (!uri) return null
                    
                    return uri
                  }).filter(Boolean)
                  
                  // 处理项目路径并返回
                  const processedProjects = projectPaths.map(uri => {

                    uri = uri.replace(/^file:\/\/\//, '')
                    const decodedUri = decodeURIComponent(uri)
                    const name = path.basename(decodedUri)
                    const isWorkspace = decodedUri.endsWith('.code-workspace')
                    return {
                      title: name,
                      description: decodedUri,
                      icon: isWorkspace ? 'folder' : 'file',
                      isWorkspace
                    }
                  }).filter(Boolean)
                
                if (processedProjects.length > 0) {
                  return processedProjects
                }
              } catch (jsonError) {
                // 忽略JSON解析错误
              }
            } catch (queryError) {
              // 关闭数据库连接
              try {
                db.close()
              } catch (closeError) {
                // 忽略关闭错误
              }
            }
          
        } catch (error) {
            // 忽略数据库读取错误
        }
      } else if (ext === '.json') {
          // 处理JSON文件
          try {
            const content = fs.readFileSync(dbPath, { encoding: 'utf-8' })
            let jsonData
            
            try {
              jsonData = JSON.parse(content)
            } catch (parseError) {
              // 尝试使用正则表达式提取
              try {
                const regex = /"uri":"file:\/\/\/(.*?)"/g
                let match
                const entries = []
                
                while ((match = regex.exec(content)) !== null) {
                  const filePath = match[1].replace(/\\/g, '/')
                  if (filePath && !filePath.includes('\\\\')) {
                    entries.push(`file:///${filePath}`)
                  }
                }
                
                if (entries.length > 0) {
                  // 处理项目路径并返回
                  const processedProjects = entries.map(uri => {
                    try {
                      uri = uri.replace(/^file:\/\/\//, '')
                      const decodedUri = decodeURIComponent(uri)
                      const name = path.basename(decodedUri)
                      const isWorkspace = decodedUri.endsWith('.code-workspace')
                      
                      return {
                        title: name,
                        description: decodedUri,
                        icon: isWorkspace ? 'folder' : 'file',
                        isWorkspace
                      }
                    } catch (itemError) {
                      return null
                    }
                  }).filter(Boolean)
                  
                  if (processedProjects.length > 0) {
                    return processedProjects
                  }
                }
                
                continue
              } catch (regexError) {
                // 正则表达式提取失败，继续尝试其他方法
                continue
              }
            }

            // 处理项目路径
            const projectPaths = jsonData.entries ? jsonData.entries.map(entry => {
              if (typeof entry === 'string') return entry
                  
                  // 尝试提取URI
                  const uri = entry.uri || entry.fileUri || entry.folderUri || entry.workspace || entry.path
                  if (!uri) return null
                  
                  return uri
                }).filter(Boolean) : [];
                
                // 处理项目路径并返回
                const processedProjects = projectPaths.map(uri => {
                  try {
                    uri = uri.replace(/^file:\/\/\//, '')
                    const decodedUri = decodeURIComponent(uri)
                    const name = path.basename(decodedUri)
                    const isWorkspace = decodedUri.endsWith('.code-workspace')
                    return {
                      title: name,
                      description: decodedUri,
                      icon: isWorkspace ? 'folder' : 'file',
                      isWorkspace
                    }
                  } catch (itemError) {
                    return null
                  }
                }).filter(Boolean)
                
                if (processedProjects.length > 0) {
                  return processedProjects
                }


          } catch (fileError) {
            // 忽略文件读取错误
          }
        }
      }

      // 所有方法都失败了
      return []

  },

  // 打开项目
  openProject(projectUri, isWorkspace) {
    try {
      // 获取配置
      const execPath = userConfig.windSurfPath || 'windsurf'

      // 构建命令 - 修复引号格式问题
      let cmd
      // 对路径进行规范化处理
      const normalizedPath = projectUri.replace(/\//g, '\\')

      cmd = `${execPath} "${normalizedPath}"`

      debug('执行命令:', cmd)
      // 设置超时
      const timeout = userConfig.timeout || 5000

      exec(cmd, { timeout, windowsHide: true }, (error) => {
        if (error) {
            debug('打开项目失败:', error)
            debug('命令:', cmd)
            debug('错误代码:', error.code)
        }
      })

      // 退出插件
      utools.outPlugin()
    } catch (error) {
      console.error('打开项目失败:', error)
    }
  }
}

// 导出uTools插件
window.exports = {
  'windsurf-projects': {
    mode: 'list',
    args: {
      // 进入插件应用时调用
      enter: async (action, callbackSetList) => {
        try {
          // 加载所有WindSurf项目并显示
          callbackSetList([
            {
              title: '正在加载项目...',
              description: '请稍候'
            }
          ])
          
          // 异步加载项目
          try {
            const projectsList = await projects.getWindSurfProjects()
            
            if (projectsList.length === 0) {
              callbackSetList([
                {
                  title: '未找到项目',
                  description: '请确保WindSurf已经安装并使用过'
                }
              ])
            } else {
              callbackSetList(projectsList)
            }
          } catch (innerError) {
            callbackSetList([
              {
                title: '加载失败',
                description: innerError.message
              }
            ])
          }
          
        } catch (error) {
          console.error('加载项目失败:', error)
          callbackSetList([
            {
              title: '加载失败',
              description: error.message
            }
          ])
        }
      },
      
      // 搜索处理
      search: async (action, searchWord, callbackSetList) => {
        try {
          // 获取所有项目
          const projectsList = await projects.getWindSurfProjects()
          
          // 如果没有搜索词，显示所有项目
          if (!searchWord) {
            if (projectsList.length === 0) {
              return callbackSetList([
                {
                  title: '未找到项目',
                  description: '请确保WindSurf已经安装并使用过'
                }
              ])
            }
            return callbackSetList(projectsList)
          }
          
          // 按名称和路径搜索
          const searchTerms = searchWord.toLowerCase().split(/\s+/)
          
          const filteredProjects = projectsList.filter(project => {
            return searchTerms.every(term => 
              project.title.toLowerCase().includes(term) || project.description.toLowerCase().includes(term)
            )
          })
          
          // 显示过滤后的项目
          if (filteredProjects.length === 0) {
            callbackSetList([
              {
                title: '未找到匹配项目',
                description: `没有找到包含 "${searchWord}" 的项目`
              }
            ])
          } else {
            callbackSetList(filteredProjects)
          }
        } catch (error) {
          console.error('搜索项目失败:', error)
          callbackSetList([
            {
              title: '搜索失败',
              description: error.message
            }
          ])
        }
      },
      
      // 用户选择条目时调用
      select: (action, itemData) => {
        // 如果是错误或提示项，不执行任何操作
        if (itemData.title === '未找到项目' || 
            itemData.title === '未找到匹配项目' ||
            itemData.title === '加载失败' ||
            itemData.title === '搜索失败' ||
            itemData.title === '正在加载项目...') {
          return
        }
        
        // 打开项目
        projects.openProject(itemData.description, itemData.isWorkspace)
      },
      
      // 插件设置
      placeholder: '搜索WindSurf项目'
    }
  }
}
