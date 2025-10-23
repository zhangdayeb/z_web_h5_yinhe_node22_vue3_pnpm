<template>
  <div class="mobile-activity-detail" :style="{
   backgroundImage: `url(${backgroundImg})`,
   backgroundPosition: 'center center',
   backgroundSize: 'cover',
   backgroundRepeat: 'no-repeat',
   backgroundColor: 'transparent'
 }">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      :title="activityDetail.title || $t('activity.detail')"
      left-arrow
      @click-left="onClickBack"
      class="detail-navbar"
    />

    <!-- 主体内容 -->
    <div class="activity-container">
      <!-- 封面图片 -->
      <div class="article-cover" v-if="activityDetail.thumb_url">
        <van-image
          :src="activityDetail.thumb_url"
          fit="cover"
          class="cover-image"
          :show-loading="true"
          :show-error="true"
        >
          <template #loading>
            <div class="image-loading">
              <van-loading type="spinner" size="24" />
            </div>
          </template>
          <template #error>
            <div class="image-error">
              <van-icon name="photo-o" size="40" />
              <span>{{ $t('activity.imageLoadFailed') }}</span>
            </div>
          </template>
        </van-image>
      </div>

      <!-- 文章头部信息 -->
      <div class="article-header">
        <h1 class="article-title">{{ activityDetail.title }}</h1>
        <div class="article-meta">
          <div class="meta-item" v-if="activityDetail.created_at">
            <van-icon name="clock-o" size="14" />
            <span>{{ formatDate(activityDetail.created_at) }}</span>
          </div>
          <div class="meta-item">
            <van-icon name="eye-o" size="14" />
            <span>{{ viewCount }} {{ $t('activity.viewsCount') }}</span>
          </div>
        </div>
      </div>

      <!-- 正文内容 -->
      <div class="article-content" v-if="activityDetail.content">
        <div class="content-wrapper" v-html="activityDetail.content"></div>
      </div>

      <!-- 底部操作区 -->
      <div class="article-footer">
        <van-button
          type="primary"
          size="large"
          round
          block
          @click="handleShare"
          class="share-btn"
        >
          <van-icon name="share-o" />
          {{ $t('activity.shareActivity') }}
        </van-button>

        <van-button
          :type="isCollected ? 'success' : 'default'"
          size="large"
          round
          block
          @click="handleCollect"
          class="collect-btn"
        >
          <van-icon :name="isCollected ? 'star' : 'star-o'" />
          {{ isCollected ? $t('activity.collected') : $t('activity.collect') }}
        </van-button>
      </div>
    </div>

    <!-- 分享面板 -->
    <van-share-sheet
      v-model:show="showShareSheet"
      :title="$t('share.title')"
      :options="shareOptions"
      @select="onShareSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showToast, showDialog } from 'vant'
import api from '@/api'
import { useAppStore } from '@/stores/app'

defineOptions({ name: 'MobileActivityDetail' })

interface ActivityDetail {
  id: number
  type: number
  title: string
  description: string
  content: string
  thumb_url: string
  created_at: string
  updated_at: string
}

const { t } = useI18n()
const store = useAppStore()
const route = useRoute()
const router = useRouter()

// 数据状态
const activityDetail = ref<ActivityDetail>({
  id: 0,
  type: 0,
  title: '',
  description: '',
  content: '',
  thumb_url: '',
  created_at: '',
  updated_at: ''
})

const viewCount = ref(Math.floor(Math.random() * 10000) + 1000)
const isCollected = ref(false)
const showShareSheet = ref(false)

// 分享选项 - 支持多语言
const shareOptions = computed(() => [
  { name: t('share.wechat'), icon: 'wechat' },
  { name: t('share.moments'), icon: 'wechat-moments' },
  { name: t('share.weibo'), icon: 'weibo' },
  { name: t('share.copyLink'), icon: 'link' }
])

// 获取活动详情
async function getActivityDetail() {
  store.loading(t('common.loading'))
  try {
    const id = route.params?.id
    if (!id) {
      showToast(t('activity.invalidId'))
      router.back()
      return
    }

    const resp: any = await api.activityDetail({ id })
    if (resp?.code === 200 || resp?.code === 1 || resp?.code === 0) {
      activityDetail.value = resp.data
    } else {
      showToast(t('activity.getDetailFailed'))
      router.back()
    }
  } catch (err) {
    console.error('获取活动详情失败:', err)
    showToast(t('activity.networkError'))
    router.back()
  } finally {
    store.stopLoad()
  }
}

// 格式化日期 - 支持多语言
function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30))
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365))

  if (minutes < 1) {
    return t('date.justNow')
  } else if (minutes < 60) {
    return t('date.minutesAgo', { minutes })
  } else if (hours < 24) {
    return t('date.hoursAgo', { hours })
  } else if (days === 0) {
    return t('date.today')
  } else if (days === 1) {
    return t('date.yesterday')
  } else if (days < 30) {
    return t('date.daysAgo', { days })
  } else if (months < 12) {
    return t('date.monthsAgo', { months })
  } else if (years >= 1) {
    return t('date.yearsAgo', { years })
  } else {
    return date.toLocaleDateString(t('common.locale'), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

// 返回
function onClickBack() {
  router.back()
}

// 分享
function handleShare() {
  showShareSheet.value = true
}

// 分享选择
function onShareSelect(option: any) {
  showShareSheet.value = false

  switch (option.name) {
    case t('share.copyLink'):
      const url = window.location.href
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          showToast(t('activity.linkCopied'))
        }).catch(() => {
          showToast(t('activity.copyFailed'))
        })
      } else {
        showToast(t('activity.browserNotSupport'))
      }
      break
    default:
      showToast(t('activity.shareToApp', { name: option.name }))
  }
}

// 收藏
function handleCollect() {
  isCollected.value = !isCollected.value
  if (isCollected.value) {
    showToast({
      message: t('activity.favoriteSuccess'),
      icon: 'success'
    })
  } else {
    showToast(t('activity.unfavoriteSuccess'))
  }
}

onMounted(() => {
  getActivityDetail()
})
</script>

<style lang="less" scoped>
.mobile-activity-detail {
  min-height: 100vh;
  background: transparent;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);

  .detail-navbar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    :deep(.van-nav-bar__title) {
      color: white;
      font-weight: 600;
    }

    :deep(.van-nav-bar__arrow) {
      color: white;
    }
  }

  .activity-container {
    // 封面图片
    .article-cover {
      .cover-image {
        width: 100%;
        height: 240px;

        .image-loading,
        .image-error {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f5f7fa;
          color: #969799;
          gap: 8px;

          span {
            font-size: 14px;
          }
        }
      }
    }

    // 文章头部
    .article-header {
      background: white;
      padding: 20px;
      margin-bottom: 8px;

      .article-title {
        font-size: 20px;
        font-weight: 600;
        color: #323233;
        line-height: 1.4;
        margin: 0 0 16px 0;
      }

      .article-meta {
        display: flex;
        gap: 20px;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #969799;

          .van-icon {
            color: #c8c9cc;
          }
        }
      }
    }

    // 正文内容
    .article-content {
      background: white;
      padding: 20px;
      margin-bottom: 8px;

      .content-wrapper {
        line-height: 1.6;
        color: #323233;
        font-size: 15px;
        word-wrap: break-word;

        :deep(h1), :deep(h2), :deep(h3) {
          margin: 20px 0 12px 0;
          color: #323233;
          font-weight: 600;
          line-height: 1.3;
        }

        :deep(h1) { font-size: 20px; }
        :deep(h2) { font-size: 18px; }
        :deep(h3) { font-size: 16px; }

        :deep(p) {
          margin: 12px 0;
          line-height: 1.6;
        }

        :deep(img) {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
          display: block;
        }

        :deep(ul), :deep(ol) {
          padding-left: 20px;
          margin: 12px 0;
        }

        :deep(li) {
          margin: 8px 0;
        }

        :deep(blockquote) {
          margin: 16px 0;
          padding: 12px 16px;
          background: #f7f8fa;
          border-left: 4px solid #1989fa;
          border-radius: 0 4px 4px 0;
        }

        :deep(code) {
          background: #f2f3f5;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 14px;
        }

        :deep(pre) {
          background: #f2f3f5;
          padding: 12px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 16px 0;
        }
      }
    }

    // 底部操作区
    .article-footer {
      background: white;
      padding: 20px;
      display: flex;
      gap: 12px;

      .share-btn,
      .collect-btn {
        height: 50px;
        font-size: 16px;
        font-weight: 500;
        border: none;

        .van-icon {
          margin-right: 6px;
        }
      }

      .share-btn {
        background: linear-gradient(45deg, #1989fa, #40a9ff);
      }

      .collect-btn {
        &.van-button--success {
          background: linear-gradient(45deg, #07c160, #39d374);
        }

        &.van-button--default {
          background: #f7f8fa;
          color: #646566;

          &:active {
            background: #f2f3f5;
          }
        }
      }
    }
  }
}

// 小屏幕适配
@media (max-width: 320px) {
  .mobile-activity-detail {
    .activity-container {
      .article-cover .cover-image {
        height: 200px;
      }

      .article-header {
        padding: 16px;

        .article-title {
          font-size: 18px;
        }
      }

      .article-content {
        padding: 16px;

        .content-wrapper {
          font-size: 14px;
        }
      }

      .article-footer {
        padding: 16px;

        .share-btn,
        .collect-btn {
          height: 46px;
          font-size: 15px;
        }
      }
    }
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .mobile-activity-detail {
    background: transparent;

    .article-header,
    .article-content,
    .article-footer {
      background: #2d2d2d;
    }

    .article-header .article-title {
      color: #ffffff;
    }

    .article-content .content-wrapper {
      color: #e8e8e8;

      :deep(h1), :deep(h2), :deep(h3) {
        color: #ffffff;
      }

      :deep(blockquote) {
        background: #3a3a3a;
      }

      :deep(code), :deep(pre) {
        background: #3a3a3a;
        color: #e8e8e8;
      }
    }
  }
}
</style>
