<template>
  <div class="m-mine">
    <!-- 简单的加载状态 -->
    <div class="loading-container">
      <van-loading size="24px" color="#1989fa">正在跳转...</van-loading>
      <p class="loading-text">即将跳转到用户中心</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { getLanguage } from '@/lang'
import { showToast } from 'vant'

defineOptions({ name: 'Mine' })

const store = useAppStore() as any

// 获取根域名
function getRootDomain(): string {
  const hostname = window.location.hostname

  // 如果是IP地址，直接返回
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return hostname
  }

  // 如果是localhost，直接返回
  if (hostname === 'localhost') {
    return hostname
  }

  // 分割域名部分
  const parts = hostname.split('.')

  // 如果只有一部分或两部分，直接返回
  if (parts.length <= 2) {
    return hostname
  }

  // 获取根域名（最后两部分）
  return parts.slice(-2).join('.')
}

// 获取X-Token值
function getXToken(): string {
  return localStorage.getItem('X-Token') || ''
}

// 构造跳转URL
function buildRedirectUrl(): string {
  const rootDomain = getRootDomain()
  const currentLang = getLanguage()
  const xToken = getXToken()

  const protocol = window.location.protocol // http: 或 https:
  const targetUrl = `${protocol}//userh5.${rootDomain}/?lang=${currentLang}&token=${xToken}`

  console.log('构造的跳转URL:', targetUrl)
  return targetUrl
}

// 执行跳转或返回主页
function performRedirect() {
  try {
    const xToken = getXToken()

    // 检查是否有X-Token
    if (!xToken) {
      console.warn('X-Token为空，跳转回主页')

      // 跳转回主页并提示登录
      showToast('请先登录')

      // 延迟跳转到主页，让用户看到提示
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)

      return
    }

    // 有token才构造跳转URL
    const redirectUrl = buildRedirectUrl()

    // 执行跳转
    console.log('即将跳转到:', redirectUrl)
    window.location.href = redirectUrl

  } catch (error) {
    console.error('跳转失败:', error)
    showToast('跳转失败，请稍后重试')

    // 出错时也跳转回主页
    setTimeout(() => {
      window.location.href = '/'
    }, 1000)
  }
}

onMounted(() => {
  // 稍微延迟一下再跳转，让用户看到加载状态
  setTimeout(() => {
    performRedirect()
  }, 500)
})
</script>

<style lang="less" scoped>
.m-mine {
  display: flex;
  flex-direction: column;
  height: 100vh;
  justify-content: center;
  align-items: center;

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;

    .loading-text {
      margin: 0;
      font-size: 14px;
      color: #666;
      text-align: center;
    }
  }
}
</style>
