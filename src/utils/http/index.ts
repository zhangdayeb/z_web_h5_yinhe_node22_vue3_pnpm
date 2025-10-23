import axios from 'axios'
import { showToast } from 'vant'

// 获取服务端语言代码
function getServerLanguage(): string {
  const lang = localStorage.getItem('lang') || 'zh-CN'
  const langMap: Record<string, string> = {
    'zh-CN': 'zh',
    'zh-TW': 'hk',
    'en-US': 'en',
    'th-TH': 'th',
    'vi-VN': 'vi',
    'ko-KR': 'ko',
  }
  return langMap[lang] || 'zh'
}

// 移动端错误提示
function showMobileError(message: string): void {
  showToast({
    message,
    type: 'fail',
    duration: 3000,
    forbidClick: true,
  })
}

// 移动端成功提示
function showMobileSuccess(message: string): void {
  showToast({
    message,
    type: 'success',
    duration: 2000,
  })
}

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  // 移动端专用配置
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 1. 添加语言参数
    config.params = {
      ...config.params,
      lang: getServerLanguage()
    }

    // 2. 添加移动端标识
    config.params = {
      ...config.params,
      is_mobile: 1
    }

    // 3. 添加 JWT Token
    const jwtToken = localStorage.getItem('access_token')
    if (jwtToken && config.headers) {
      config.headers.Authorization = `Bearer ${jwtToken}`
    }

    // 4. 添加 Simple Token
    const simpleToken = localStorage.getItem('X-Token')
    if (simpleToken && config.headers) {
      config.headers['X-Token'] = simpleToken
    }

    // 5. 添加 group-prefix
    const groupPrefix = localStorage.getItem('group_prefix')
    if (groupPrefix && config.headers) {
      config.headers['group-prefix'] = groupPrefix
    }

    return config
  },
  (error) => {
    console.error('请求配置错误:', error)
    showMobileError('请求配置错误')
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 检查是否有JWT Token续期
    const newJwtToken = response.headers['authorization']
    if (newJwtToken && newJwtToken.startsWith('Bearer ')) {
      const token = newJwtToken.replace('Bearer ', '')
      localStorage.setItem('access_token', token)
      console.log('🔄 JWT Token已自动续期')
    }

    // 检查是否有Simple Token续期
    const newSimpleToken = response.headers['x-token']
    if (newSimpleToken) {
      localStorage.setItem('X-Token', newSimpleToken)
      console.log('🔄 Simple Token已自动续期')
    }

    // 检查JWT Token续期标识
    const tokenExtended = response.headers['x-token-extended']
    if (tokenExtended === '1') {
      console.log('✅ JWT Token续期成功')
    }

    // 移动端网络状态检查
    if (!navigator.onLine) {
      showMobileError('网络连接已断开，请检查网络设置')
      return Promise.reject(new Error('Network offline'))
    }

    const { data } = response

    // 开发环境响应调试
    if (import.meta.env.DEV) {
      console.log('📥 移动端响应:', {
        url: response.config.url,
        status: response.status,
        code: data?.code,
        message: data?.message,
        hasData: !!data?.data
      })
    }

    // 成功：code 为 200 或 1 或 0
    if (data.code === 200 || data.code === 1 || data.code === 0) {
      return data
    }

    // 失败：移动端友好提示
    const errorMessage = data.message || '服务器错误，请稍后重试'
    showMobileError(errorMessage)
    return Promise.reject(data)
  },
  (error) => {
    console.error('API响应错误:', error)

    // 网络离线检查
    if (!navigator.onLine) {
      showMobileError('网络连接已断开，请检查网络设置')
      return Promise.reject(error)
    }

    // 处理不同的HTTP状态码
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 401:
          // 清除过期的token
          localStorage.removeItem('access_token')
          localStorage.removeItem('X-Token')
          console.warn('🔐 Token已过期，已清除本地存储')
          showMobileError('登录已过期，请重新登录')

          // 移动端跳转逻辑（如果需要）
          // window.location.href = '/login'
          break

        case 403:
          showMobileError('没有访问权限')
          break

        case 404:
          showMobileError('请求的资源不存在')
          break

        case 422:
          // 表单验证错误
          const message = data?.message || '数据验证失败'
          showMobileError(message)
          break

        case 429:
          showMobileError('请求过于频繁，请稍后再试')
          break

        case 500:
          showMobileError('服务器内部错误')
          break

        case 502:
        case 503:
        case 504:
          showMobileError('服务器暂时不可用，请稍后重试')
          break

        default:
          showMobileError(data?.message || '网络请求失败')
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      if (error.code === 'ECONNABORTED') {
        showMobileError('请求超时，请稍后重试')
      } else {
        showMobileError('网络连接失败，请检查网络设置')
      }
    } else {
      // 请求配置错误
      showMobileError('请求配置错误')
    }

    return Promise.reject(error)
  }
)

// 移动端专用工具方法
export const mobileApiUtils = {
  /**
   * 检查网络状态
   */
  checkNetworkStatus(): boolean {
    return navigator.onLine
  },

  /**
   * 显示网络状态提示
   */
  showNetworkStatus(): void {
    if (navigator.onLine) {
      showMobileSuccess('网络连接正常')
    } else {
      showMobileError('网络连接已断开')
    }
  },

  /**
   * 获取移动端设备信息
   */
  getMobileDeviceInfo(): {
    userAgent: string
    isIOS: boolean
    isAndroid: boolean
    isWeChat: boolean
    screenWidth: number
    screenHeight: number
  } {
    const ua = navigator.userAgent
    return {
      userAgent: ua,
      isIOS: /iPhone|iPad|iPod/i.test(ua),
      isAndroid: /Android/i.test(ua),
      isWeChat: /MicroMessenger/i.test(ua),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    }
  },

  /**
   * 移动端请求重试逻辑
   */
  async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn()
      } catch (error) {
        if (i === maxRetries - 1) throw error

        console.log(`请求失败，${delay}ms后重试 (${i + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 2 // 指数退避
      }
    }
    throw new Error('重试次数已达上限')
  }
}

// 网络状态监听（移动端专用）
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('📶 网络已连接')
    showMobileSuccess('网络连接已恢复')
  })

  window.addEventListener('offline', () => {
    console.log('📵 网络已断开')
    showMobileError('网络连接已断开')
  })
}

export default request
