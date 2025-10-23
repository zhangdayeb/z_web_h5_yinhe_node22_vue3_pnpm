import api from '@/api'
import { useAppStore } from '@/stores/app'
import { showToast, showLoadingToast, closeToast } from 'vant'
// ==================== API 调用相关 ====================

/**
 * 统一的API调用方法
 */
export async function invokeApi(
  method: string,
  data: object = {},
  id: string | number = '',
  isLoad: boolean = true,
): Promise<any | null> {
  const store = useAppStore()

  if (isLoad) {
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      duration: 0
    })
    store.loading()
  }

  try {
    let resp: any = null

    if (typeof (api as any)[method] === 'function') {
      if (id !== '') {
        resp = await (api as any)[method](id, data)
      } else {
        resp = await (api as any)[method](data)
      }
    } else {
      console.error(`API方法 ${method} 不存在`)
      if (isLoad) {
        closeToast()
        store.stopLoad()
      }
      showToast('系统错误：接口不存在')
      return null
    }

    if (resp && resp.code === 200) {
      if (isLoad) {
        closeToast()
        store.stopLoad()
      }
      return resp
    } else {
      if (isLoad) {
        closeToast()
        store.stopLoad()
      }

      const msg = resp?.message || '操作失败'
      showToast(msg)
      return resp
    }
  } catch (err: any) {
    console.error('API调用错误:', err)
    if (isLoad) {
      closeToast()
      store.stopLoad()
    }

    if (err.message.includes('Network')) {
      showToast('网络连接失败，请检查网络设置')
    } else if (err.message.includes('timeout')) {
      showToast('请求超时，请稍后重试')
    } else {
      showToast('系统错误，请稍后重试')
    }

    return null
  }
}

// ==================== 移动端工具函数 ====================

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      showToast('复制成功')
      return true
    }

    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)

    textArea.focus()
    textArea.select()

    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)

    if (successful) {
      showToast('复制成功')
      return true
    } else {
      showToast('复制失败')
      return false
    }
  } catch (err) {
    console.error('复制失败:', err)
    showToast('复制失败')
    return false
  }
}

/**
 * 触发手机震动
 */
export function vibrate(duration: number = 200): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration)
  }
}

/**
 * 防止页面滚动
 */
export function preventScroll(): void {
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.width = '100%'
}

/**
 * 恢复页面滚动
 */
export function restoreScroll(): void {
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
}

// ==================== 格式化函数 ====================

/**
 * 格式化金额显示
 */
export function formatMoney(
  amount: number | string,
  currency: string = '¥',
  decimals: number = 2
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return `${currency}0.00`

  return `${currency}${num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

/**
 * 格式化日期时间
 */
export function formatDateTime(
  date: Date | string | number,
  format: 'full' | 'date' | 'time' | 'relative' = 'full'
): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (format === 'relative') {
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return d.toLocaleDateString('zh-CN')
  }

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours24 = String(d.getHours()).padStart(2, '0')
  const minutesStr = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`
    case 'time':
      return `${hours24}:${minutesStr}`
    case 'full':
    default:
      return `${year}-${month}-${day} ${hours24}:${minutesStr}:${seconds}`
  }
}

// ==================== 基础工具函数 ====================

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any
  }

  if (obj instanceof Array) {
    const clonedArr: any[] = []
    for (const item of obj) {
      clonedArr.push(deepClone(item))
    }
    return clonedArr as any
  }

  if (obj instanceof Object) {
    const clonedObj: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }

  return obj
}

/**
 * 获取URL参数
 */
export function getUrlParam(name: string): string | null {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(name)
}

/**
 * 设置页面标题
 */
export function setPageTitle(title: string): void {
  document.title = title ? `${title} - 会员中心` : '会员中心'
}

/**
 * 校验邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 校验手机号格式
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 存储到本地存储
 */
export function setStorageItem(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error('存储失败:', error)
    return false
  }
}

/**
 * 从本地存储读取
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('读取存储失败:', error)
    return defaultValue
  }
}

/**
 * 移除本地存储项
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('移除存储项失败:', error)
  }
}
