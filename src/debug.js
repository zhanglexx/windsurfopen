/**
 * 调试模块 - 处理调试功能
 */

/**
 * 调试函数 - 用于记录调试信息并显示通知
 * @param {string} message 调试消息
 * @param {any} data 调试数据（可选）
 */
function debug(message, data) {
  try {
    console.log(`[DEBUG] ${message}`, data !== undefined ? data : '')
    
    // 检查是否需要显示通知
    if (global.utools) {
      let dataStr = ''
      
      if (data !== undefined) {
        try {
          if (typeof data === 'object') {
            dataStr = JSON.stringify(data)
          } else {
            dataStr = String(data)
          }
          
          // 限制长度，避免通知过长
          if (dataStr.length > 100) {
            dataStr = dataStr.substring(0, 97) + '...'
          }
        } catch (e) {
          dataStr = '无法显示数据'
        }
        global.utools.showNotification(`${message} ${dataStr}`, 'WindSurf项目管理')
      } else {
        global.utools.showNotification(message, 'WindSurf项目管理')
      }
    }
  } catch (e) {
    console.error('显示调试信息失败:', e)
  }
}

// 导出调试函数
module.exports = debug
