import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import { showLoadingToast, closeToast } from 'vant'
import api from '@/api'
import type { ApiUser } from '@/types'

// 常量定义
const TOKEN_KEY = 'access_token'
const USER_KEY = 'current_user'

export const useAppStore = defineStore('app', () => {
  // ========== 状态定义 ==========
  const token = ref<string | null>(null)
  const me = ref<ApiUser | null>(null)
  const systemConf = ref<unknown>(null)
  const registerConf = ref<object>({})
  const isLoading = ref<boolean>(false)

  // 🔥 添加登录弹窗状态
  const loginShow = ref<boolean>(false)
  // 🔥 添加注册弹窗状态
  const registerShow = ref<boolean>(false)

  // ========== Token 管理 ==========

  /**
   * 获取Token
   */
  function getToken(): string | null {
    if (!token.value) {
      token.value = localStorage.getItem(TOKEN_KEY)
    }
    return token.value
  }

  /**
   * 设置Token
   */
  function setToken(tk: string): void {
    token.value = tk
    localStorage.setItem(TOKEN_KEY, tk)
  }

  /**
   * 清除Token
   */
  function clearToken(): void {
    token.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  // ========== 用户信息管理 ==========

  /**
   * 获取用户信息
   */
  function getUser(): ApiUser | null {
    if (!me.value) {
      const tmp = localStorage.getItem(USER_KEY)
      if (tmp) {
        try {
          const p = JSON.parse(tmp)
          me.value = p
        } catch (err) {
          console.log('解析用户信息出错:', err)
          localStorage.removeItem(USER_KEY)
        }
      }
    }
    return me.value
  }

  /**
   * 设置用户信息
   */
  function setUser(u: ApiUser): void {
    me.value = u
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  }

  /**
   * 从API获取用户信息
   */
  async function getMeForApi(): Promise<void> {
    try {
      const resp: any = await api.getUserInfo()
      if (resp && resp.code === 200 && resp.data) {
        me.value = resp.data
        localStorage.setItem(USER_KEY, JSON.stringify(resp.data))
      }
    } catch (err) {
      localStorage.clear()
      token.value = null
      me.value = null
      console.warn('服务器错误，已清除本地存储')
      console.log('获取用户信息出错:', err)
    }
  }

  /**
   * 清除用户信息
   */
  function clearUser(): void {
    me.value = null
    localStorage.removeItem(USER_KEY)
  }

  // ========== 登录状态管理 ==========

  /**
   * 检查是否登录
   */
  function isLogin(): boolean {
    return getUser() != null
  }

  /**
   * 登出 - 清除本地数据
   */
  function logout(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    token.value = null
    me.value = null
  }

  // ========== Loading 管理 (移动端使用Vant) ==========

  /**
   * 显示Loading - 移动端使用 Vant Toast
   */
  function loading(message?: string): void {
    if (isLoading.value) return // 防止重复显示

    const loadingText = message || '加载中...'
    isLoading.value = true

    showLoadingToast({
      message: loadingText,
      forbidClick: true,
      duration: 0, // 不自动关闭
    })
  }

  /**
   * 停止Loading
   */
  function stopLoad(): void {
    if (isLoading.value) {
      closeToast()
      isLoading.value = false
    }
  }

  // ========== 配置管理 ==========

  /**
   * 设置系统配置
   */
  function setSystemConf(conf: unknown): void {
    systemConf.value = conf
  }

  /**
   * 获取系统配置
   */
  function getSystemConf(): unknown {
    return systemConf.value
  }

  /**
   * 设置注册配置
   */
  function setRegisterConf(conf: object): void {
    registerConf.value = conf
  }

  /**
   * 获取注册配置
   */
  function getRegisterConf(): object {
    return registerConf.value
  }

  // ========== 实用功能方法 ==========

  /**
   * 强制刷新用户信息
   */
  async function refreshUserInfo(): Promise<boolean> {
    try {
      await getMeForApi()
      return true
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      return false
    }
  }

  /**
   * 获取用户信息 - 兼容方法
   */
  const fetchUserInfo = async (): Promise<boolean> => {
    return await refreshUserInfo()
  }

  /**
   * 设置用户信息 - 兼容方法
   */
  const setUserInfo = (info: ApiUser): void => {
    setUser(info)
  }

  /**
   * 检查Token有效性
   */
  function hasValidToken(): boolean {
    const token = getToken()
    return !!token && token.length > 0
  }

  /**
   * 重置所有状态
   */
  function resetAll(): void {
    clearToken()
    clearUser()
    systemConf.value = null
    registerConf.value = {}
    loginShow.value = false // 🔥 添加重置登录弹窗状态
    registerShow.value = false // 🔥 添加重置注册弹窗状态
    stopLoad()
  }

  // ========== 移动端专用方法 ==========

  /**
   * 移动端网络状态检查
   */
  function checkNetworkStatus(): boolean {
    return navigator.onLine
  }

  /**
   * 移动端用户反馈
   */
  function showMobileMessage(message: string, type: 'success' | 'fail' | 'loading' = 'success'): void {
    if (type === 'loading') {
      loading(message)
    } else {
      // 使用 Vant 的 Toast 组件
      import('vant').then(({ showToast }) => {
        showToast({
          message,
          type: type === 'success' ? 'success' : 'fail',
        })
      })
    }
  }

  // ========== 兼容$patch方法 ==========
  /**
   * 批量更新状态 - 兼容Pinia的$patch方法
   */
  function $patch(updates: Partial<{
    loginShow: boolean
    registerShow: boolean
    isLoading: boolean
    [key: string]: any
  }>): void {
    if (updates.hasOwnProperty('loginShow')) {
      loginShow.value = updates.loginShow!
    }
    if (updates.hasOwnProperty('registerShow')) {
      registerShow.value = updates.registerShow!
    }
    if (updates.hasOwnProperty('isLoading')) {
      isLoading.value = updates.isLoading!
    }
  }

  // ========== 初始化 ==========

  /**
   * 初始化Store
   */
  function init(): void {
    // 初始化时获取token和用户信息
    getToken()
    getUser()

    console.log('App Store (Mobile) 初始化完成')
  }

  // 自动初始化
  init()

  // ========== 返回公共API ==========
  return {
    // 状态 (只读保护)
    token: readonly(token),
    me: readonly(me),
    userInfo: readonly(me), // 兼容 userInfo
    systemConf: readonly(systemConf),
    registerConf: readonly(registerConf),
    isLoading: readonly(isLoading),
    loginShow, // 🔥 添加登录弹窗状态（注意：这里不用readonly，因为需要v-model双向绑定）
    registerShow, // 🔥 添加注册弹窗状态

    // 核心方法 (保持与原版一致)
    loading,
    stopLoad,
    isLogin,
    getToken,
    setToken,
    getMeForApi,
    getUser,
    setUser,
    logout,

    // 兼容方法
    fetchUserInfo,
    setUserInfo,
    $patch, // 🔥 添加$patch方法

    // 扩展功能方法
    clearToken,
    clearUser,
    setSystemConf,
    getSystemConf,
    setRegisterConf,
    getRegisterConf,
    refreshUserInfo,
    hasValidToken,
    resetAll,

    // 移动端专用方法
    checkNetworkStatus,
    showMobileMessage,
  }
})
