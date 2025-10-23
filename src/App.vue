<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useConfigStore } from '@/stores/config'
import { getLanguage } from '@/lang'
import { ConfigProvider } from 'vant'

// 获取应用配置
const appStore = useAppStore()
const configStore = useConfigStore()

// Vant 主题配置
const themeVars = computed(() => ({
  '--van-primary-color': configStore.primaryColor || '#1989fa',
  '--van-success-color': '#07c160',
  '--van-warning-color': '#ff976a',
  '--van-danger-color': '#ee0a24',
  '--van-info-color': '#909399',
}))

// 初始化应用
const initApp = async () => {
  try {
    console.log('开始移动端应用初始化...')

    // 加载系统配置
    await configStore.loadSiteConfig()

    // 检查用户登录状态
    const jwtToken = localStorage.getItem('access_token')
    const simpleToken = localStorage.getItem('X-Token')

    console.log('检查Token状态:', {
      hasJwtToken: !!jwtToken,
      hasSimpleToken: !!simpleToken,
      jwtPreview: jwtToken ? jwtToken.substring(0, 20) + '...' : null,
      simplePreview: simpleToken ? simpleToken.substring(0, 8) + '...' : null
    })

    // 如果有任意一种token，都尝试获取用户信息
    if (jwtToken || simpleToken) {
      console.log('发现Token，开始获取用户信息...')

      try {
        // 如果只有Simple Token但没有JWT Token，先将Simple Token设置为主要Token
        if (simpleToken && !jwtToken) {
          console.log('只有Simple Token，将其设置为主要Token')
          localStorage.setItem('access_token', simpleToken)
          appStore.setToken(simpleToken)
        }

        // 尝试获取用户信息
        const userInfoResult = await appStore.fetchUserInfo()

        if (userInfoResult) {
          console.log('用户信息获取成功，自动登录完成')
        } else {
          console.log('用户信息获取失败，Token可能无效')
          // 清理无效Token
          localStorage.removeItem('access_token')
          localStorage.removeItem('X-Token')
          appStore.logout()
        }
      } catch (error) {
        console.error('获取用户信息时出错:', error)
        // 清理可能无效的Token
        localStorage.removeItem('access_token')
        localStorage.removeItem('X-Token')
        appStore.logout()
      }
    } else {
      console.log('未发现任何Token，保持未登录状态')
    }

    // 初始化语言设置
    const currentLang = getLanguage()
    console.log('当前语言设置:', currentLang)
    console.log('移动端应用初始化完成')

  } catch (error) {
    console.error('移动端应用初始化失败:', error)
  }
}

// 应用加载状态
const appLoading = ref(true)

onMounted(async () => {
  await initApp()
  appLoading.value = false
})
</script>

<template>
  <ConfigProvider :theme-vars="themeVars">
    <div id="app">
      <!-- 应用加载动画 -->
      <div v-if="appLoading" class="app-loading">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-text">正在加载...</div>
        </div>
      </div>

      <!-- 主应用内容 -->
      <RouterView v-else v-slot="{ Component, route }">
        <transition name="slide" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </RouterView>
    </div>
  </ConfigProvider>
</template>

<style lang="less">
// 移动端全局样式
#app {
  width: 100%;
  min-height: 100vh;
  background-color: #f7f8fa;
  overflow-x: hidden;

  /* 隐藏垂直滚动条但保留滚动功能 */
  /* Webkit浏览器(Chrome, Safari, Edge) */
  &::-webkit-scrollbar {
    width: 0px;
    background: transparent;
  }

  /* Firefox浏览器 */
  scrollbar-width: none;

  /* IE浏览器 */
  -ms-overflow-style: none;
}

.app-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: #f7f8fa;
  z-index: 9999;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #1989fa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #969799;
  font-size: 14px;
  text-align: center;
}

// 移动端页面切换动画
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

// 重置 Vant 组件样式以适应移动端
:deep(.van-nav-bar) {
  background-color: #fff;
  border-bottom: 1px solid #ebedf0;
}

:deep(.van-tabbar) {
  border-top: 1px solid #ebedf0;
}

// 安全区域适配
:deep(.van-nav-bar) {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

:deep(.van-tabbar) {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

// 移动端输入框样式优化
:deep(.van-field__control) {
  font-size: 16px; // 防止 iOS Safari 缩放
}

// 移动端按钮样式优化
:deep(.van-button) {
  min-height: 44px; // iOS 推荐的最小触摸区域
}
</style>
