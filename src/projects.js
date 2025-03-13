/**
 * 项目管理模块 - 处理项目的搜索和打开
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const { exec } = require('child_process')
const debug = require('./debug')
const config = require('./config')
const userConfig = require('./userConfig')

// SQL.js 初始化
let SQL

/**
 * 初始化SQL.js
 */
// 使用简化的SQL.js加载方式
const initSqlJs = require('../sqljs/sql-wasm')

// 项目管理对象
const projects = {
  /**
   * 获取数据库路径
   * 只处理config中的路径和WindSurf的路径
   * @returns {string} 数据库文件路径
   */
  getDBPath() {
    
    // 首先尝试从配置获取路径
    let dbPath = config.get('dbPath')
    
    if (dbPath && fs.existsSync(dbPath)) {
      return dbPath
    }
    
    // 如果配置中没有或路径不存在，使用WindSurf默认路径
    dbPath = path.join(
      os.homedir(),
      "AppData", "Roaming", "WindSurf",
      "User", "globalStorage",
      "state.vscdb"
    )
    
    if (fs.existsSync(dbPath)) {
      return dbPath
    } else {
      debug('WindSurf默认路径不存在 请使用ws-setting配置路径')
    }

    // 最后尝试使用VS Code的路径
    dbPath = path.join(
      os.homedir(),
      "AppData", "Roaming", "Code",
      "User", "globalStorage",
      "state.vscdb"
    )

    if (fs.existsSync(dbPath)) {
      return dbPath
    } else {
    }
    
    return null
  },
  
  /**
   * 从数据库获取项目列表
   * 参考TypeScript实现方法
   * @param {string} dbPath 数据库路径
   * @returns {Promise<Array>} 项目列表
   */
  async getProjectsFromDB(dbPath) {

    
    try {
      // 初始化SQL.js
      const SQL = await initSqlJs()
      if (!SQL) {
        return []
      }
      
      // 读取数据库文件
      const filebuffer = fs.readFileSync(dbPath)
      const db = new SQL.Database(filebuffer)
      
      // 使用单一SQL查询获取数据
      const sql = "SELECT value FROM ItemTable WHERE key = 'history.recentlyOpenedPathsList'"
      
      const results = db.exec(sql)
      if (!results || results.length === 0 || !results[0].values || results[0].values.length === 0) {
        db.close()
        return []
      }
      
      const res = results[0].values[0].toString()
      
      if (!res) {
        db.close()
        return []
      }
      
      // 解析结果
      const data = JSON.parse(res)
      
      if (!data.entries || !Array.isArray(data.entries)) {
        db.close()
        return []
      }
      
      // 处理每个条目
      const projectList = []
      
      for (const entry of data.entries) {
        try {
          let uri = null
          let name = null
          let isWorkspace = false
          
          if (typeof entry === 'string') {
            uri = entry
          } else {
            // 获取路径
            uri = entry.fileUri || entry.folderUri || (entry.workspace ? entry.workspace.configPath : null)
            
            // 判断是否为工作区
            isWorkspace = !!entry.workspace || (uri && uri.endsWith('.code-workspace'))
          }
          
          // 处理URI格式
          if (uri && typeof uri === 'string') {
            // 移除file://前缀
            if (uri.startsWith('file://')) {
              uri = uri.replace('file://', '')
              
              // 处理Windows路径
              if (os.platform() === 'win32' && uri.startsWith('/')) {
                uri = uri.substring(1)
              }
              
              // URI解码
              uri = decodeURIComponent(uri)
            }
            
            // 获取名称
            name = entry.label || path.basename(uri, isWorkspace ? path.extname(uri) : '')
            
            // 添加到项目列表
            projectList.push({
              name: name,
              uri: uri,
              isWorkspace: isWorkspace,
              lastOpened: entry.timestamp || Date.now(),
              source: 'WindSurf/VSCode'
            })
          }
        } catch (e) {
          debug('处理项目条目出错: ' + e.message)
        }
      }
      
      // 关闭数据库连接
      db.close()
      
      return projectList
    } catch (error) {
      debug('从数据库获取项目时出错: ' + error.message)
      return []
    }
  },
  
  /**
   * 从SQLite数据库获取WindSurf项目
   * @returns {Promise<Array>} 项目列表
   */
  async getWindSurfProjects() {
    try {
      // 获取数据库路径
      const dbPath = this.getDBPath()
      
      if (!dbPath) {
        return sampleProjects
      }
      
      // 从数据库获取项目
      const projects = await this.getProjectsFromDB(dbPath)
      
      if (projects && projects.length > 0) {
        return projects
      } else {
        return sampleProjects
      }
    } catch (error) {
      return sampleProjects
    }
  },
  
  /**
   * 递归扫描目录寻找数据库文件
   * @param {string} dirPath 目录路径
   * @param {string[]} result 结果数组
   * @returns {string[]} 数据库文件路径列表
   */
  scanDirectoryForDB(dirPath, result = []) {
    if (!fs.existsSync(dirPath)) {
      return result
    }
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        
        if (entry.isDirectory()) {
          // 递归扫描子目录
          this.scanDirectoryForDB(fullPath, result)
        } else if (entry.isFile()) {
          // 检查文件扩展名
          if (
            entry.name.endsWith('.vscdb') || 
            entry.name.endsWith('.db') ||
            entry.name === 'state.vscdb' ||
            entry.name === 'storage.json'
          ) {
            result.push(fullPath)
          }
        }
      }
    } catch (error) {
      console.error(`扫描目录失败 ${dirPath}:`, error)
    }
    
    return result
  },
  
  /**
   * 使用exec执行命令
   * @param {string} command 要执行的命令
   * @param {object} options 执行选项
   * @returns {Promise<string>} 命令执行结果
   */
  execCmd(command, options = {}) {
    return new Promise((resolve, reject) => {
      const defaultOptions = {
        encoding: 'utf8',
        timeout: 10000,
        windowsHide: true
      };
      
      const execOptions = { ...defaultOptions, ...options };
      
      
      exec(command, execOptions, (error, stdout, stderr) => {
        if (error) {
          debug('命令执行错误: ' + error.message);
          return reject(error);
        }
        
        if (stderr && stderr.length > 0) {
          debug('命令错误输出: ' + stderr);
          return reject(new Error(stderr));
        }
        
        resolve(stdout);
      });
    });
  },
  
  /**
   * 打开项目
   * @param {string} projectUri 项目URI
   * @param {boolean} isWorkspace 是否为工作区
   */
  async openProject(projectUri, isWorkspace) {
    try {
      // 获取编辑器路径，确保是字符串
      let execPath = 'windsurf';

      const configPath = userConfig.windSurfPath();
      if (configPath && typeof configPath === 'string' && configPath.length > 0) {
        execPath = configPath;
      }

      // 避免使用trim，直接判断路径中是否有空格
      if (execPath.indexOf(' ') >= 0) {
        execPath = `"${execPath}"`;
      }

      // 如果项目路径中包含空格，添加引号
      if (projectUri.indexOf(' ') >= 0) {
        projectUri = `"${projectUri}"`;
      }

      // 构建命令
      const cmd = `${execPath} ${projectUri}`;

      // 获取超时设置
      let timeout = 3000; // 默认3秒
      try {
        const configTimeout = userConfig.timeout();
        if (configTimeout && typeof configTimeout === 'number' && configTimeout >= 1000) {
          timeout = configTimeout;
        }
      } catch (e) {
        debug('获取超时配置失败: ' + e.message);
      }

      // 执行命令
      await this.execCmd(cmd, {
        timeout: timeout,
        windowsHide: true,
        encoding: 'utf8'
      });
      
      // 隐藏主窗口
      if (global.utools) {
        global.utools.hideMainWindow();
      }
      
      return true;
    } catch (error) {
      debug('打开项目失败: ' + error.message);
      return false;
    }
  },
  
  /**
   * 解析命令行字符串
   * @param {string} commandLine 命令行字符串
   * @returns {string[]} 命令行参数数组
   */
  parseCommand(commandLine) {
    try {
      let result = [];
      let current = '';
      let inQuotes = false;
      let quoteChar = '';
      
      // 遍历命令行字符
      for (let i = 0; i < commandLine.length; i++) {
        const char = commandLine[i];
        
        // 处理引号
        if ((char === '"' || char === "'") && (i === 0 || commandLine[i-1] !== '\\')) {
          if (!inQuotes) {
            inQuotes = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuotes = false;
            quoteChar = '';
          } else {
            current += char;
          }
        }
        // 处理空格
        else if (char === ' ' && !inQuotes) {
          if (current) {
            result.push(current);
            current = '';
          }
        }
        // 处理其他字符
        else {
          current += char;
        }
      }
      
      // 添加最后一个参数
      if (current) {
        result.push(current);
      }
      
      // 去除所有参数中的引号
      result = result.map(arg => {
        if ((arg.startsWith('"') && arg.endsWith('"')) || 
            (arg.startsWith("'") && arg.endsWith("'"))) {
          return arg.substring(1, arg.length - 1);
        }
        return arg;
      });
      
      return result;
    } catch (e) {
      debug('解析命令失败:', e.message);
      return [];
    }
  },
}

// 导出项目管理对象
module.exports = {
  projects,
  initSqlJs
}
