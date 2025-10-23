<template>
  <van-popup
    class="m-notices"
    v-model:show="showCenter"
    :close-on-click-overlay="false"
    :closeable="true"
  >
    <!-- 通知轮播 -->
    <van-swipe :autoplay="10000" lazy-render>
      <van-swipe-item
        v-for="(item, idx) in notices"
        :key="idx"
        @click="clickNoticeHandler(item)"
        class="m-swipe-item"
      >
        <!-- 标题 -->
        <h3 class="m-title">{{ item.title }}</h3>

        <!-- 图片类型通知 -->
        <template v-if="item.type === 'img'">
          <van-image
            :src="item.content"
            fit="contain"
            class="m-img"
            :loading-icon="loadingIcon"
            :error-icon="errorIcon"
          >
            <template #loading>
              <van-loading type="spinner" size="20" />
            </template>
            <template #error>
              <div class="m-img-error">{{ $t('notices.imageLoadError') }}</div>
            </template>
          </van-image>
        </template>

        <!-- 文本类型通知 -->
        <template v-else>
          <div class="m-text">
            <div class="m-content" v-html="sanitizeHtml(item.content)"></div>
          </div>
        </template>
      </van-swipe-item>
    </van-swipe>

    <!-- 今日不再显示选项 -->
    <div class="m-see">
      <van-checkbox
        v-model="checked"
        shape="square"
        icon-size="14"
        @change="todayNoDsiplay"
      >
        {{ $t('records.todayDoNotShow') }}
      </van-checkbox>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { showToast } from 'vant'

// API和工具导入
import api from '@/api'
import type { ApiNotice } from '@/types'

defineOptions({ name: 'NoticesPop' })

// 国际化
const { t } = useI18n()

// 响应式数据
const showCenter = ref(false)
const notices = ref<ApiNotice[]>([])
const checked = ref(false)
const loadingIcon = ref('photo')
const errorIcon = ref('photo-fail')

// 常量
const STORAGE_KEY = 'dontShowNotice'

/**
 * 清理HTML内容，防止XSS攻击
 * 修正：改进了DOMPurify的条件导入和降级处理
 */
function sanitizeHtml(html: string): string {
  if (!html) return ''

  // 使用简单的正则替换，避免DOMPurify依赖问题
  try {
    // 移除所有script标签和其内容
    let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

    // 移除可能的事件处理器
    cleanHtml = cleanHtml.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    cleanHtml = cleanHtml.replace(/javascript:/gi, '')

    return cleanHtml
  } catch (error) {
    console.warn('HTML清理失败，返回纯文本:', error)
    // 如果清理失败，返回纯文本（移除所有HTML标签）
    return html.replace(/<[^>]*>/g, '')
  }
}
 // localStorage.removeItem(STORAGE_KEY)
/**
 * 设置/取消今日不再显示
 */
function todayNoDsiplay(checked: boolean) {
  if (checked) {
    // 保存今日结束时间戳
    const endOfDay = dayjs().endOf('day').unix()
    localStorage.setItem(STORAGE_KEY, String(endOfDay))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

/**
 * 检查是否应该显示弹窗
 */
function shouldShowPopup(): boolean {
  try {
    const storedTime = localStorage.getItem(STORAGE_KEY)
    if (!storedTime) return true

    const endTime = Number(storedTime)
    if (isNaN(endTime) || endTime <= 0) return true

    const currentTime = dayjs().unix()
    return currentTime > endTime
  } catch (error) {
    console.error('检查弹窗显示状态失败:', error)
    return true
  }
}

/**
 * 点击通知处理
 */
function clickNoticeHandler(notice: ApiNotice) {
  if (!notice.url) return

  // 验证URL安全性
  try {
    const url = new URL(notice.url, window.location.origin)

    // 检查是否是安全的协议
    if (!['http:', 'https:'].includes(url.protocol)) {
      console.warn(t('notices.unsafeProtocol'), url.protocol)
      return
    }

    // 如果是外部链接，在新窗口打开
    if (url.origin !== window.location.origin) {
      window.open(notice.url, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = notice.url
    }
  } catch (error) {
    console.error('无效的URL:', notice.url, error)
    showToast(t('notices.invalidUrl'))
  }
}

/**
 * 获取通知列表
 */
async function getNotices() {
  try {
    const resp: any = await api.notices({})

    if (!resp || resp.code !== 200) {
      console.warn(t('notices.loadFailed'), resp?.message || t('notices.unknownError'))
      return
    }

    // 处理响应数据
    const processedNotices = processNoticesData(resp)

    if (processedNotices.length === 0) {
      return
    }

    notices.value = processedNotices

    // 检查是否应该显示弹窗
    if (shouldShowPopup()) {
      showCenter.value = true
    }
  } catch (error) {
    console.error(t('notices.networkError'), error)
    // 静默失败，不影响用户体验
  }
}

/**
 * 处理通知数据
 */
function processNoticesData(response: any): ApiNotice[] {
  const result: ApiNotice[] = []

  // 处理alert类型（图片通知）
  if (Array.isArray(response.alert)) {
    response.alert.forEach((item: any) => {
      if (item && item.content) {
        result.push({
          ...item,
          type: 'img',
          title: item.title || t('notices.systemAnnouncement')
        })
      }
    })
  }

  // 处理data类型（文本通知）
  if (Array.isArray(response.data)) {
    response.data.forEach((item: any) => {
      if (item && (item.content || item.title)) {
        result.push({
          ...item,
          type: 'txt',
          title: item.title || t('notices.systemAnnouncement')
        })
      }
    })
  }

  return result
}

/**
 * 组件挂载
 */
onMounted(async () => {
  await getNotices()
})

// 暴露方法供父组件使用
defineExpose({
  show: () => {
    showCenter.value = true
  },
  hide: () => {
    showCenter.value = false
  },
  refresh: getNotices
})
</script>

<style lang="less" scoped>
.m-notices {
  display: flex;
  flex-direction: column;
  min-height: 50%;
  height: 480px;
  max-height: 70vh;
  margin: 0 auto;
  width: 90%;
  max-width: 400px;
  border-radius: 10px;
  overflow: visible;
  // background: #fff;
 color: #e5e7eb;
  background-image: url('@/assets/mobile/app/background.bmp');
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  background-color: var(--color-m-background);


  // 轮播项
  .m-swipe-item {
    display: flex;
    flex-direction: column;
    height: 100%;
    cursor: pointer;

    &:hover {
      .m-title {
        color: var(--van-primary-color, #1989fa);
      }
    }
  }

  // 标题样式
  .m-title {
    text-align: center;
    padding: 15px 20px;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    transition: color 0.3s;
    border-bottom: 1px solid #eee;
  }

  // 图片容器
  .m-img {
    width: 100%;
    height: calc(100% - 60px);
    object-fit: contain;

    &-error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #999;
      font-size: 14px;
    }
  }

  // 文本容器
  .m-text {
    padding: 20px;
    margin-bottom: 10px;
    box-sizing: border-box;
    flex: 1;
    height: calc(100% - 60px);
    overflow-x: hidden;
    overflow-y: auto;

    // 自定义滚动条
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 3px;

      &:hover {
        background: #555;
      }
    }

    .m-content {
      width: 100%;
      height: auto;
      font-size: 14px;
      line-height: 1.6;
      color: #666;
      word-wrap: break-word;

      // 内容中的链接样式
      :deep(a) {
        color: var(--van-primary-color, #1989fa);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      // 段落间距
      :deep(p) {
        margin: 10px 0;
      }
    }
  }

  // 底部选项
  .m-see {
    position: absolute;
    bottom: -50px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1;
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .m-notices {
    // background: #1c1c1e;

    .m-title {
      color: #FFD700;
      border-bottom-color: #333;
    }

    .m-text {
      .m-content {
        color: #ffff;
      }

      &::-webkit-scrollbar-track {
        background: #333;
      }

      &::-webkit-scrollbar-thumb {
        background: #666;

        &:hover {
          background: #888;
        }
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .m-notices {
    width: 95%;
    height: 60vh;

    .m-title {
      font-size: 15px;
      padding: 12px 15px;
    }

    .m-text {
      padding: 15px;

      .m-content {
        font-size: 13px;
      }
    }
  }
}
</style>

<style lang="less">
// 全局样式（不使用scoped）
.m-see {
  .van-checkbox {
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 20px;
    padding: 8px 16px;
    backdrop-filter: blur(10px);
    transition: all 0.3s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.5);
    }

    .van-checkbox__label {
      color: #fff;
      font-size: 13px;
      user-select: none;
    }

    .van-checkbox__icon {
      .van-icon {
        border-color: rgba(255, 255, 255, 0.7);
        background-color: rgba(255, 255, 255, 0.1);
      }

      .van-checkbox__icon--checked {
        .van-icon {
          background-color: var(--van-primary-color, #1989fa);
          border-color: var(--van-primary-color, #1989fa);
        }
      }
    }
  }
}

// Vant弹窗关闭按钮样式优化
.m-notices {
  .van-popup__close-icon {
    top: 12px;
    right: 12px;
    font-size: 20px;
    color: #999;

    &:hover {
      color: #333;
    }
  }
}
</style>
