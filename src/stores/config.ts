import { ref, computed, readonly } from 'vue'
import { defineStore } from 'pinia'
import { showLoadingToast, closeToast, showToast } from 'vant'
import api from '@/api'

// 站点配置接口定义
interface SiteConfig {
  site_name?: string
  site_wap_logo?: string
  site_description?: string
  customer_service_url?: string
  group_prefix?: string
  group_name?: string
  web_url?: string
  admin_url?: string
  agent_url?: string
  lobby_url?: string
  promotion_url?: string
  primary_color?: string
  [key: string]: any // 允许其他动态字段
}

// 配置加载错误接口
interface ConfigLoadError {
  code: number
  message: string
  timestamp: number
}

export const useConfigStore = defineStore('config', () => {
  // ========== 状态定义 ==========

  // 系统配置
  const groupPrefix = ref<string>('')
  const siteConfig = ref<SiteConfig>({})
  const primaryColor = ref<string>('#1989fa') // 移动端默认使用 Vant 主题色

  // 状态控制
  const isConfigLoaded = ref<boolean>(false)
  const isConfigLoading = ref<boolean>(false)
  const configLoadError = ref<ConfigLoadError | null>(null)

  // 初始化状态
  const isAppReady = ref<boolean>(false)

  // ========== 计算属性 ==========

  // 配置是否可用
  const isConfigAvailable = computed(() =>
    isConfigLoaded.value && Object.keys(siteConfig.value).length > 0 && !configLoadError.value
  )

  // 是否显示加载状态
  const shouldShowLoading = computed(() =>
    isConfigLoading.value && !isConfigLoaded.value
  )

  // 站点名称（带默认值）
  const siteName = computed(() =>
    siteConfig.value?.site_name || '会员中心'
  )

  // 移动端站点Logo（带默认值）
  const siteLogo = computed(() =>
    siteConfig.value?.site_wap_logo || '/src/assets/logo.png'
  )

  // 客服链接
  const customerServiceUrl = computed(() =>
    siteConfig.value?.customer_service_url || ''
  )

  // ========== 私有方法 ==========

  /**
   * 显示移动端加载状态
   */
  function showLoading(message: string = '加载配置中...') {
    if (isConfigLoading.value) return // 防止重复显示

    showLoadingToast({
      message,
      forbidClick: true,
      duration: 0, // 不自动关闭
    })
  }

  /**
   * 隐藏移动端加载状态
   */
  function hideLoading() {
    closeToast()
  }

  /**
   * 显示移动端错误提示
   */
  function showError(message: string) {
    showToast({
      message,
      type: 'fail',
      duration: 3000,
    })
  }

  /**
   * 显示成功提示
   */
  function showSuccess(message: string) {
    showToast({
      message,
      type: 'success',
      duration: 2000,
    })
  }

  /**
   * 获取当前页面URL
   */
  function getCurrentUrl(): string {
    return window.location.href
  }

  /**
   * 调用配置API
   */
  async function fetchSiteConfig(url?: string): Promise<SiteConfig> {
    try {
      const params: any = {
        group: 'system',
        is_mobile: 1 // 移动端固定为1
      }

      // 如果提供了URL参数，则添加到请求中
      if (url) {
        params.url = url
      }

      const response: any = await api.sysConfig(params)

      if (response && (response.code === 200 || response.code === 1 || response.code === 0) && response.data) {
        return response.data as SiteConfig
      } else {
        throw new Error(response?.message || '获取配置失败')
      }
    } catch (error: any) {
      console.error('配置API调用失败:', error)
      throw error
    }
  }

  // ========== 公共方法 ==========

  /**
   * 加载站点配置（主要方法）
   */
  async function loadSiteConfig(url?: string, showLoadingUI: boolean = true): Promise<boolean> {
    // 防止重复加载
    if (isConfigLoading.value) {
      console.warn('配置正在加载中，跳过重复请求')
      return false
    }

    try {
      // 设置加载状态
      isConfigLoading.value = true
      configLoadError.value = null

      if (showLoadingUI) {
        showLoading('正在加载站点配置...')
      }

      // 获取URL
      const targetUrl = url || getCurrentUrl()
      console.log('开始加载站点配置:', targetUrl)

      // 调用API
      const config = await fetchSiteConfig(targetUrl)

      // 更新状态
      updateSiteConfig(config)

      console.log('站点配置加载成功:', config)
      return true

    } catch (error: any) {
      // 错误处理
      const errorInfo: ConfigLoadError = {
        code: error.code || 500,
        message: error.message || '配置加载失败',
        timestamp: Date.now()
      }

      configLoadError.value = errorInfo
      isConfigLoaded.value = false
      isAppReady.value = false

      console.error('站点配置加载失败:', errorInfo)

      if (showLoadingUI) {
        showError(errorInfo.message)
      }

      return false

    } finally {
      isConfigLoading.value = false
      if (showLoadingUI) {
        hideLoading()
      }
    }
  }

  /**
   * 更新站点配置
   */
  function updateSiteConfig(config: SiteConfig): void {
    siteConfig.value = config

    // 设置 group_prefix
    if (config.group_prefix) {
      groupPrefix.value = config.group_prefix
      localStorage.setItem('group_prefix', config.group_prefix)
    }

    // 设置移动端主题色
    if (config.primary_color) {
      primaryColor.value = config.primary_color
      // 移动端设置 CSS 变量（Vant 主题）
      document.documentElement.style.setProperty('--van-primary-color', config.primary_color)
      // 同时设置 meta theme-color
      updateThemeColor(config.primary_color)
    }

    // 设置页面标题
    if (config.site_name) {
      document.title = config.site_name
    }

    // 更新状态
    isConfigLoaded.value = true
    configLoadError.value = null
    isAppReady.value = true

    console.log('移动端配置状态已更新:', {
      groupPrefix: groupPrefix.value,
      siteName: config.site_name,
      primaryColor: primaryColor.value,
      isAppReady: isAppReady.value
    })
  }

  /**
   * 更新移动端主题色
   */
  function updateThemeColor(color: string): void {
    // 更新 meta theme-color
    let themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta')
      themeColorMeta.setAttribute('name', 'theme-color')
      document.head.appendChild(themeColorMeta)
    }
    themeColorMeta.setAttribute('content', color)

    // 更新状态栏颜色（iOS Safari）
    const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (statusBarMeta) {
      // 根据主题色亮度决定状态栏样式
      const isLightColor = isLightColorValue(color)
      statusBarMeta.setAttribute('content', isLightColor ? 'default' : 'black-translucent')
    }
  }

  /**
   * 判断颜色是否为浅色
   */
  function isLightColorValue(color: string): boolean {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128
  }

  /**
   * 重置配置
   */
  function resetConfig(): void {
    groupPrefix.value = ''
    siteConfig.value = {}
    primaryColor.value = '#1989fa'
    isConfigLoaded.value = false
    configLoadError.value = null
    isAppReady.value = false

    // 重置移动端DOM相关
    document.documentElement.style.removeProperty('--van-primary-color')
    localStorage.removeItem('group_prefix')

    console.log('移动端配置已重置')
  }

  /**
   * 重试加载配置
   */
  async function retryLoadConfig(url?: string): Promise<boolean> {
    console.log('重试加载配置')
    resetConfig()
    return await loadSiteConfig(url)
  }

  /**
   * 手动设置 group_prefix
   */
  function setGroupPrefix(prefix: string): void {
    groupPrefix.value = prefix
    localStorage.setItem('group_prefix', prefix)
    console.log('手动设置 group_prefix:', prefix)
  }

  /**
   * 设置移动端主题色
   */
  function setPrimaryColor(color: string): void {
    primaryColor.value = color
    document.documentElement.style.setProperty('--van-primary-color', color)
    updateThemeColor(color)
    console.log('设置移动端主题色:', color)
  }

  /**
   * 获取配置字段值（带默认值）
   */
  function getConfigValue<T>(key: string, defaultValue: T): T {
    if (!siteConfig.value || Object.keys(siteConfig.value).length === 0) return defaultValue
    const value = siteConfig.value[key]
    return value !== undefined ? (value as T) : defaultValue
  }

  /**
   * 简化的获取配置值方法（兼容旧版本）
   */
  function getConfig(key: string, defaultValue: any = ''): any {
    return getConfigValue(key, defaultValue)
  }

  // ========== 移动端专用方法 ==========

  /**
   * 检查移动端网络状态
   */
  function checkMobileNetwork(): boolean {
    return navigator.onLine
  }

  /**
   * 移动端震动反馈（如果支持）
   */
  function vibrate(pattern: number | number[] = 100): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  /**
   * 获取移动端设备信息
   */
  function getMobileDeviceInfo(): {
    userAgent: string
    isIOS: boolean
    isAndroid: boolean
    isWeChat: boolean
  } {
    const ua = navigator.userAgent
    return {
      userAgent: ua,
      isIOS: /iPhone|iPad|iPod/i.test(ua),
      isAndroid: /Android/i.test(ua),
      isWeChat: /MicroMessenger/i.test(ua),
    }
  }

  // ========== 初始化 ==========

  /**
   * 移动端初始化
   */
  function init(): void {
    // 恢复 group_prefix
    const storedPrefix = localStorage.getItem('group_prefix')
    if (storedPrefix) {
      groupPrefix.value = storedPrefix
    }

    // 移动端特定初始化
    const deviceInfo = getMobileDeviceInfo()
    console.log('移动端设备信息:', deviceInfo)

    console.log('配置 Store (Mobile) 初始化完成')
  }

  // 自动初始化
  init()

  // ========== 返回公共API ==========
  return {
    // 状态（只读保护）
    groupPrefix: readonly(groupPrefix),
    siteConfig: readonly(siteConfig),
    primaryColor: readonly(primaryColor),
    isConfigLoaded: readonly(isConfigLoaded),
    isConfigLoading: readonly(isConfigLoading),
    configLoadError: readonly(configLoadError),
    isAppReady: readonly(isAppReady),

    // 计算属性
    isConfigAvailable,
    shouldShowLoading,
    siteName,
    siteLogo,
    customerServiceUrl,

    // 核心方法
    loadSiteConfig,
    updateSiteConfig,
    resetConfig,
    retryLoadConfig,

    // 配置操作方法
    setGroupPrefix,
    setPrimaryColor,
    getConfigValue,
    getConfig, // 兼容方法

    // 移动端专用方法
    checkMobileNetwork,
    vibrate,
    getMobileDeviceInfo,
    showSuccess,
    showError,
  }
})
