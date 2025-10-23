<template>
  <div class="mobile-support" :style="{
   backgroundImage: `url(${backgroundImg})`,
   backgroundPosition: 'center center',
   backgroundSize: 'cover',
   backgroundRepeat: 'no-repeat',
   backgroundColor: 'var(--color-m-background)'
 }">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      :title="$t('support.title')"
      left-arrow
      fixed
      placeholder
      class="support-navbar"
      @click-left="handleBack"
    />

    <!-- 头部区域 -->
    <div class="support-header" :style="{
      backgroundImage: `url(${kefuBgImg})`,
      backgroundPosition: 'center center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat'
    }">
      <div class="header-avatar">
        <van-image
          src="/src/assets/mobile/avatar.png"
          fit="contain"
          class="avatar-img"
          :show-error="false"
          :show-loading="false"
        />
      </div>
      <div class="header-content">
        <h2 class="header-title">{{ $t('support.welcome') }}</h2>
        <p class="header-subtitle">{{ $t('support.serviceDesc') }}</p>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="support-content">
      <!-- 配置项列表 -->
      <div v-if="configList.length > 0" class="config-list" :style="{
        backgroundImage: `url(${kfbgImg})`,
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat'
      }">
        <div
          v-for="(config, index) in configList"
          :key="index"
          class="config-item"
          @click="openConfigUrl(config)"
        >
          <div class="item-left">
            <div class="item-icon">
              <van-icon :name="getConfigIcon(config.name)" size="20" />
            </div>
            <div class="item-info">
              <div class="item-title">{{ getConfigName(config) }}</div>
              <div class="item-subtitle">{{ getConfigSubtitle(config) }}</div>
            </div>
          </div>
          <div class="item-right">
            <van-icon name="arrow" size="16" />
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-else-if="loading" class="loading-container">
        <van-loading type="spinner" size="24" color="#1989fa" />
        <p class="loading-text">{{ $t('support.loading') }}</p>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-container">
        <van-empty
          image="search"
          :description="$t('support.noConfig')"
        >
          <van-button
            type="primary"
            size="small"
            round
            @click="getConfigList"
          >
            {{ $t('support.reload') }}
          </van-button>
        </van-empty>
      </div>
    </div>

    <!-- 底部提示 -->
    <div class="support-footer" v-if="configList.length > 0">
      <div class="footer-content">
        <van-icon name="info-o" size="14" />
        <span>{{ $t('support.clickToContact') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showToast } from 'vant'
import api from '@/api'
import backgroundImg from '@/assets/mobile/home/background.png'
import kefuBgImg from '@/assets/mobile/home/kefu_bg.png'
import kfbgImg from '@/assets/mobile/home/kfbg.png'

defineOptions({ name: 'MobileSupportIndex' })

// 配置项类型定义
interface ConfigItem {
  name: string
  value: string
  remark?: string
  name_i18n?: { [key: string]: string }
}

// 游戏配置响应类型
interface GameConfigResponse {
  configs?: {
    [key: string]: string
  }
  raw_configs?: Array<{
    id: number
    group_prefix: string
    name: string
    value: string
    remark: string
    name_i18n?: string
  }>
}

const router = useRouter()
const { t } = useI18n()

// 响应式数据
const configList = ref<ConfigItem[]>([])
const loading = ref(false)

// 返回个人中心
function handleBack() {
  router.push({ name: 'main' })
}

// 获取配置项图标
function getConfigIcon(name: string): string {
  const iconMap: { [key: string]: string } = {
    '客服地址': 'service',
    '财务地址': 'balance-pay',
    '热线电话': 'phone',
    '在线客服': 'chat',
    'VIP客服': 'diamond',
    '代理合作': 'friends',
    '投诉建议': 'edit',
    'Telegram': 'chat',
    'WhatsApp': 'chat',
    '主线客服': 'service',
    '客户服务代表': 'manager',
    // 英文映射
    'Customer Service': 'service',
    'Finance Service': 'balance-pay',
    'Hotline': 'phone',
    'Online Service': 'chat',
    'VIP Service': 'diamond',
    'Agent Cooperation': 'friends',
    'Complaints': 'edit'
  }
  return iconMap[name] || 'service'
}

// 客服名称映射
const serviceNameMap: { [key: string]: string } = {
  '客服地址': 'support.customerService',
  '财务地址': 'support.financeService',
  '热线电话': 'support.hotline',
  '在线客服': 'support.onlineService',
  'VIP客服': 'support.vipService',
  '代理合作': 'support.agentCooperation',
  '投诉建议': 'support.complaints',
  'Telegram': 'support.telegram',
  'WhatsApp': 'support.whatsapp',
  '主线客服': 'support.mainService',
  '客户服务代表': 'support.customerRep'
}

// 获取配置项名称
function getConfigName(config: ConfigItem): string {
  // 首先检查是否有多语言支持
  if (config.name_i18n) {
    const currentLocale = t('common.locale') || 'zh-CN'
    if (config.name_i18n[currentLocale]) {
      return config.name_i18n[currentLocale]
    }
  }

  // 使用预定义的映射
  if (serviceNameMap[config.name]) {
    return t(serviceNameMap[config.name])
  }

  // 回退到原始名称
  return config.name
}

// 获取配置项副标题
function getConfigSubtitle(config: ConfigItem): string {
  if (config.value.startsWith('http')) {
    return t('support.clickToVisit')
  } else if (config.value.includes('@')) {
    return t('support.emailContact')
  } else if (/^\+?\d+/.test(config.value)) {
    return t('support.phoneContact')
  }
  return t('support.clickToView')
}

// 打开配置链接
function openConfigUrl(config: ConfigItem) {
  if (!config.value || config.value.length === 0) {
    showToast(`${getConfigName(config)}${t('support.linkNotConfigured')}`)
    return
  }

  try {
    // 如果是电话号码，使用 tel: 协议
    if (/^\+?\d+/.test(config.value)) {
      window.location.href = `tel:${config.value}`
      return
    }

    // 如果是邮箱，使用 mailto: 协议
    if (config.value.includes('@')) {
      window.location.href = `mailto:${config.value}`
      return
    }

    // 其他情况在新窗口打开
    window.open(config.value, '_blank')
  } catch (error) {
    console.error('打开链接失败:', error)
    showToast(`${t('support.openFailed')}${getConfigName(config)}`)
  }
}

// 获取配置数据
async function getConfigList() {
  loading.value = true

  try {
    const resp: any = await api.gameConfig()

    if (resp?.code === 200 || resp?.code === 1 || resp?.code === 0) {
      const configData = resp.data as GameConfigResponse
      const tempList: ConfigItem[] = []

      // 方式1：从 configs 对象中获取
      if (configData.configs) {
        Object.entries(configData.configs).forEach(([name, value]) => {
          if (value && value.trim().length > 0) {
            let nameI18n = undefined
            try {
              const rawConfig = configData.raw_configs?.find(item => item.name === name)
              if (rawConfig?.name_i18n) {
                nameI18n = JSON.parse(rawConfig.name_i18n)
              }
            } catch (e) {
              // 忽略解析错误
            }

            tempList.push({
              name: name,
              value: value.trim(),
              name_i18n: nameI18n
            })
          }
        })
      }

      // 方式2：如果 configs 为空，从 raw_configs 获取
      if (tempList.length === 0 && configData.raw_configs) {
        configData.raw_configs.forEach(item => {
          if (item.value && item.value.trim().length > 0) {
            let nameI18n = undefined
            try {
              if (item.name_i18n) {
                nameI18n = JSON.parse(item.name_i18n)
              }
            } catch (e) {
              // 忽略解析错误
            }

            tempList.push({
              name: item.name,
              value: item.value.trim(),
              remark: item.remark,
              name_i18n: nameI18n
            })
          }
        })
      }

      configList.value = tempList
    } else {
      throw new Error(resp?.message || t('support.loadFailed'))
    }
  } catch (error) {
    console.error('获取配置出错:', error)
    showToast(t('support.loadFailed'))
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取配置
onMounted(() => {
  getConfigList()
})
</script>

<style lang="less" scoped>
.mobile-support {
  min-height: 100vh;
  // background: #f7f8fa;
  background: transparent;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);

  // 顶部导航栏 - 改为简洁风格
  .support-navbar {
    //background: white;
    background: transparent !important;
    border-bottom: none;

    :deep(.van-nav-bar) {
      background: transparent !important;
      border-bottom: none;
    }

    :deep(.van-nav-bar__title) {
      color: #ffffff;
      font-weight: 600;
      font-size: 16px;
    }

    :deep(.van-nav-bar__left .van-icon) {
      color: #ffffff;
      font-size: 18px;
    }
  }

  // 头部区域 - 改为简洁风格
  .support-header {
    // background: white;
    // background: transparent;
    // background: url(/src/assets/mobile/home/kefu_bg.png);
    padding: 24px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    // border-bottom: 1px solid #f0f1f5;
    border-radius: 16px;

    .header-avatar {
      .avatar-img {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid #f0f1f5;
        // background: #f7f8fa;
        background: transparent;
      }
    }

    .header-content {
      flex: 1;
      color: #ffffff;

      .header-title {
        margin: 0 0 6px 0;
        font-size: 20px;
        font-weight: 600;
      }

      .header-subtitle {
        margin: 0;
        font-size: 14px;
        color: #969799;
        line-height: 1.4;
      }
    }
  }

  // 主体内容
  .support-content {
    padding: 16px;

    .config-list {
      // background: white;
      background: transparent;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      .config-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        transition: all 0.3s;
        position: relative;

        &:not(:last-child)::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 60px;
          right: 20px;
          height: 1px;
          background: #f0f1f5;
        }

        &:active {
          background: #f8f9fa;
        }

        .item-left {
          display: flex;
          align-items: center;
          flex: 1;

          .item-icon {
            width: 40px;
            height: 40px;
            background: #1989fa;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;

            .van-icon {
              color: white;
            }
          }

          .item-info {
            flex: 1;

            .item-title {
              font-size: 16px;
              font-weight: 500;
              color: #ffffff;
              margin-bottom: 2px;
              line-height: 1.3;
            }

            .item-subtitle {
              font-size: 13px;
              color: #969799;
              line-height: 1.3;
            }
          }
        }

        .item-right {
          .van-icon {
            color: #c8c9cc;
            transform: rotate(-90deg);
          }
        }
      }
    }

    // 加载状态
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
      text-align: center;

      .loading-text {
        margin-top: 12px;
        font-size: 14px;
        color: #969799;
      }
    }

    // 空状态
    .empty-container {
      background: white;
      border-radius: 12px;
      padding: 40px 20px;
      text-align: center;

      :deep(.van-empty__description) {
        color: #969799;
        margin: 16px 0 24px;
      }
    }
  }

  // 底部提示
  .support-footer {
    padding: 0 16px 20px;

    .footer-content {
      background: rgba(25, 137, 250, 0.08);
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #1989fa;

      .van-icon {
        flex-shrink: 0;
      }
    }
  }
}

// 小屏幕适配
@media (max-width: 320px) {
  .mobile-support {
    .support-header {
      padding: 16px;
      gap: 12px;

      .header-avatar .avatar-img {
        width: 50px;
        height: 50px;
      }

      .header-content {
        .header-title {
          font-size: 18px;
        }

        .header-subtitle {
          font-size: 13px;
        }
      }
    }

    .support-content {
      padding: 12px;

      .config-list .config-item {
        padding: 14px 16px;

        .item-left .item-icon {
          width: 36px;
          height: 36px;
          margin-right: 10px;

          .van-icon {
            font-size: 18px;
          }
        }

        .item-left .item-info {
          .item-title {
            font-size: 15px;
          }

          .item-subtitle {
            font-size: 12px;
          }
        }
      }
    }
  }
}

// 横屏适配
@media (orientation: landscape) and (max-height: 500px) {
  .mobile-support {
    .support-header {
      padding: 16px 20px;

      .header-avatar .avatar-img {
        width: 50px;
        height: 50px;
      }

      .header-content {
        .header-title {
          font-size: 18px;
        }

        .header-subtitle {
          font-size: 13px;
        }
      }
    }
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .mobile-support {
    // background: #1a1a1a;
 background: transparent;
    .support-navbar {
      background: transparent !important;
      border-bottom: none;

      :deep(.van-nav-bar) {
        background: transparent !important;
        border-bottom: none;
      }

      :deep(.van-nav-bar__title) {
        color: #ffffff;
      }

      :deep(.van-nav-bar__left .van-icon) {
        color: #ffffff;
      }
    }

    .support-header {
      // background: #2d2d2d;
      background: transparent;
      border-color: #404040;
      border-radius: 16px;

      .header-content {
        color: #ffffff;

        .header-subtitle {
          color: #a0a0a0;
        }
      }

      .header-avatar .avatar-img {
        border-color: #404040;
        background: #3a3a3a;
      }
    }

    .support-content {
      .config-list {
        // background: #2d2d2d;

        .config-item {
          &:active {
            background: #3a3a3a;
          }

          &:not(:last-child)::after {
            background: #404040;
          }

          .item-left .item-info {
            .item-title {
              color: #ffffff;
            }

            .item-subtitle {
              color: #a0a0a0;
            }
          }
        }
      }

      .loading-container,
      .empty-container {
        background: #2d2d2d;
      }

      .loading-container .loading-text {
        color: #a0a0a0;
      }
    }

    .support-footer .footer-content {
      background: rgba(25, 137, 250, 0.15);
      color: #4dabf7;
    }
  }
}
</style>
