<template>
  <div class="mobile-gift" :style="{
   backgroundImage: `url(${backgroundImg})`,
   backgroundPosition: 'center center',
   backgroundSize: 'cover',
   backgroundRepeat: 'no-repeat',
   backgroundColor: 'var(--color-m-background)'
 }">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      :title="$t('gift.title')"
      left-arrow
      fixed
      placeholder
      class="gift-navbar"
      @click-left="handleBack"
    />

    <!-- 分类标签 -->
  <!--  <div class="category-tabs">
      <van-tabs
        v-model:active="activeTab"
        @change="handleTabChange"
        sticky
        :offset-top="46"
        class="gift-tabs"
      >
        <van-tab
          v-for="(tab, index) in tabs"
          :key="index"
          :name="index"
          :title="tab.title === 'all' ? $t('gift.all') : tab.title"
        />
      </van-tabs>
    </div> -->

    <!-- 主体内容 -->
    <div class="gift-container">
      <!-- 活动列表 -->
      <div class="activities-content" v-if="filteredList.length > 0">
        <van-list
          v-model:loading="loading"
          v-model:error="error"
          :finished="finished"
          :finished-text="$t('gift.noMore')"
          :error-text="$t('gift.requestFailed')"
          @load="onLoad"
          @reload="onReload"
          class="activity-list"
        >
          <div
            v-for="activity in displayList"
            :key="activity.id"
            class="activity-card"
            @click="goToDetail(activity)"
          >
            <!-- 活动图片 -->
            <div class="card-image">
              <van-image
                :src="activity.thumb_url || ''"
                fit="cover"
                lazy
                class="activity-img"
                :show-loading="true"
                :show-error="true"
              >
                <template #loading>
                  <div class="image-loading">
                    <van-loading type="spinner" size="20" />
                  </div>
                </template>
                <template #error>
                  <div class="image-error">
                    <van-icon name="photo-o" size="24" />
                  </div>
                </template>
              </van-image>

              <!-- 活动标签 -->
              <div class="activity-tag" v-if="getActivityTypeName(activity.type)">
                {{ getActivityTypeName(activity.type) }}
              </div>
            </div>

            <!-- 活动信息 -->
      <!--      <div class="card-content">
              <h3 class="activity-title">{{ activity.title }}</h3>
              <p class="activity-description" v-if="activity.description">
                {{ activity.description }}
              </p>

              <div class="card-footer">
                <div class="footer-left">
                  <span class="activity-date" v-if="activity.created_at">
                    {{ formatDate(activity.created_at) }}
                  </span>
                </div>
                <div class="footer-right">
                  <van-icon name="arrow" size="14" />
                </div>
              </div>
            </div> -->
          </div>

        </van-list>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-else-if="!loading">
        <van-empty
          image="search"
          :description="$t('gift.noActivities')"
        >
          <van-button
            type="primary"
            size="small"
            round
            @click="resetFilters"
          >
            {{ $t('gift.resetFilters') }}
          </van-button>
        </van-empty>
      </div>
    </div>

    <!-- 返回顶部 -->
    <van-back-top />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showToast } from 'vant'
import api from '@/api'
import backgroundImg from '@/assets/mobile/home/background.png'

defineOptions({ name: 'MobileGiftIndex' })

interface ActivityType {
  id: number
  name: string
}

interface ActivityInfo {
  id: number
  type: number
  title: string
  description: string
  thumb_url: string
  created_at: string
  updated_at: string
}

interface TabInfo {
  title: string
  value: number
}

const router = useRouter()
const { t } = useI18n()

// 数据状态
const activeTab = ref(0)
const tabs = ref<TabInfo[]>([])
const list = ref<ActivityInfo[]>([])
const displayList = ref<ActivityInfo[]>([])
const searchKeyword = ref('')

// 列表状态
const loading = ref(false)
const error = ref(false)
const finished = ref(false)
const pageSize = 10
const currentPage = ref(1)

// 计算属性：过滤后的列表
const filteredList = computed(() => {
  let result = [...list.value]

  // 按分类过滤
  if (activeTab.value > 0 && tabs.value[activeTab.value]) {
    const tabValue = tabs.value[activeTab.value].value
    if (tabValue !== -1) {
      result = result.filter(item => item.type === tabValue)
    }
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item =>
      item.title.toLowerCase().includes(keyword) ||
      (item.description && item.description.toLowerCase().includes(keyword))
    )
  }

  return result
})

// 监听过滤条件变化，重置分页
watch([activeTab, searchKeyword], () => {
  resetPagination()
})

// 获取活动类型列表
async function getActivityTypes() {
  try {
    const resp: any = await api.activityTypeList()
    if (resp?.code === 200 || resp?.code === 1 || resp?.code === 0) {
      const types = resp.data?.list || resp.data || []

      // 构建标签页
      const tmp: TabInfo[] = [{ value: -1, title: 'all' }]
      types.forEach((type: ActivityType) => {
        tmp.push({
          title: type.name,
          value: type.id
        })
      })

      tabs.value = tmp
    }
  } catch (err) {
    console.error('获取活动类型失败:', err)
    showToast(t('gift.getTypesFailed'))
  }
}

// 获取活动列表
async function getActivities() {
  try {
    const resp: any = await api.activityList({
      page: 1,
      limit: 100
    })

    if (resp?.code === 200 || resp?.code === 1 || resp?.code === 0) {
      const activities = resp.data?.list || resp.data || []
      list.value = activities
    }
  } catch (err) {
    console.error('获取活动列表失败:', err)
    showToast(t('gift.loadFailed'))
    error.value = true
  }
}

// 获取活动类型名称
function getActivityTypeName(type: number): string {
  const tab = tabs.value.find(t => t.value === type)
  return tab ? tab.title : ''
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return t('gift.today')
  } else if (days === 1) {
    return t('gift.yesterday')
  } else if (days < 7) {
    return `${days}${t('gift.daysAgo')}`
  } else {
    return date.toLocaleDateString(t('common.locale'), {
      month: 'short',
      day: 'numeric'
    })
  }
}

// 切换标签
function handleTabChange(index: number) {
  activeTab.value = index
}

// 下拉加载
function onLoad() {
  if (error.value) {
    error.value = false
  }

  setTimeout(() => {
    const start = (currentPage.value - 1) * pageSize
    const end = start + pageSize
    const newData = filteredList.value.slice(start, end)

    if (newData.length) {
      displayList.value.push(...newData)
      currentPage.value++
    }

    loading.value = false

    // 检查是否加载完毕
    if (displayList.value.length >= filteredList.value.length) {
      finished.value = true
    }
  }, 300)
}

// 重新加载
function onReload() {
  error.value = false
  loading.value = true
  onLoad()
}

// 重置分页
function resetPagination() {
  displayList.value = []
  currentPage.value = 1
  finished.value = false
  loading.value = false

  // 立即加载第一页数据
  if (filteredList.value.length > 0) {
    onLoad()
  }
}

// 跳转详情
function goToDetail(activity: ActivityInfo) {
  router.push({ name: 'activity', params: { id: activity.id } })
}

// 重置筛选
function resetFilters() {
  searchKeyword.value = ''
  activeTab.value = 0
}

// 返回个人中心
function handleBack() {
  router.push({ name: 'main' })
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      getActivityTypes(),
      getActivities()
    ])

    // 初始化第一页数据
    onLoad()
  } catch (error) {
    console.error('初始化失败:', error)
    showToast(t('gift.loadFailedRetry'))
  }
})
</script>

<style lang="less" scoped>
.mobile-gift {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  position: relative;

  // 顶部导航栏 - 改为简洁风格
  .gift-navbar {
    // background: white;
     background: transparent;
    border-bottom: 1px solid #ebedf0;
    z-index: 999 !important;
    color: #FFD700;
    :deep(.van-nav-bar) {
      // background: white;
      background: transparent;
      height: 46px;
    }

    :deep(.van-nav-bar__content) {
      // background: white;
      background: transparent;
      height: 46px;
    }

    :deep(.van-nav-bar__title) {
      color: #FFD700;
      font-weight: 600;
      font-size: 16px;
    }

    :deep(.van-nav-bar__left .van-icon) {
      color: #FFD700;
      font-size: 18px;
    }

    :deep(.van-nav-bar__placeholder) {
      height: 46px;
    }
  }

  // 分类标签
  .category-tabs {
    background: white;
    position: relative;
    z-index: 99;
    border-bottom: 1px solid #f0f1f5;

    .gift-tabs {
      :deep(.van-tabs__nav) {
        padding: 0 16px;
        background: white;
      }

      :deep(.van-tab) {
        padding: 12px 8px;

        .tab-title {
          font-size: 14px;
          font-weight: 500;
        }

        .tab-badge {
          :deep(.van-badge__wrapper) {
            margin-left: 4px;
          }

          :deep(.van-badge) {
            background: #ee0a24;
            font-size: 10px;
            min-width: 14px;
            height: 14px;
            line-height: 14px;
            padding: 0 4px;
          }
        }
      }

      :deep(.van-tabs__line) {
        background: #1989fa;
        height: 3px;
        border-radius: 2px;
      }
    }
  }

  // 主体容器
  .gift-container {
    padding: 8px 16px 16px;

    // 活动列表
    .activities-content {
      .activity-list {
        .activity-card {
          background: white;
          border-radius: 12px;
          margin-bottom: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.3s;
          display: flex;

          &:active {
            transform: scale(0.98);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }

          .card-image {
            position: relative;
            width: 100%;
            height: 130px;
            flex-shrink: 0;

            .activity-img {
              width: 100%;
              height: 100%;
            }

            .image-loading,
            .image-error {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #f5f7fa;
              color: #c8c9cc;
            }

            .activity-tag {
              position: absolute;
              top: 6px;
              left: 6px;
              background: rgba(25, 137, 250, 0.9);
              color: white;
              font-size: 10px;
              padding: 2px 6px;
              border-radius: 4px;
              max-width: 60px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }

          .card-content {
            flex: 1;
            padding: 12px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;

            .activity-title {
              font-size: 15px;
              font-weight: 600;
              color: #FFD700;
              margin: 0 0 6px 0;
              line-height: 1.3;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }

            .activity-description {
              font-size: 12px;
              color: #969799;
              line-height: 1.4;
              margin: 0 0 8px 0;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }

            .card-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;

              .footer-left {
                .activity-date {
                  font-size: 11px;
                  color: #c8c9cc;
                }
              }

              .footer-right {
                .van-icon {
                  color: #c8c9cc;
                  transform: rotate(-90deg);
                }
              }
            }
          }
        }
      }
    }

    // 空状态
    .empty-state {
      padding: 60px 20px;
      text-align: center;

      :deep(.van-empty__description) {
        color: #969799;
        margin: 16px 0 24px;
      }
    }
  }
}

// 小屏幕适配
@media (max-width: 320px) {
  .mobile-gift {
    .gift-container {
      padding: 8px 12px 12px;

      .activities-content .activity-list .activity-card {
        .card-image {
          width: 100px;
          height: 75px;
        }

        .card-content {
          padding: 10px;

          .activity-title {
            font-size: 14px;
          }

          .activity-description {
            font-size: 11px;
          }
        }
      }
    }
  }
}

// 横屏适配
@media (orientation: landscape) and (max-height: 500px) {
  .mobile-gift {
    .gift-container {
      .activities-content .activity-list .activity-card {
        .card-image {
          width: 140px;
          height: 80px;
        }
      }
    }
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .mobile-gift {
    background: #1a1a1a;

    .gift-navbar {
      // background: #2d2d2d;
      border-color: #404040;

      :deep(.van-nav-bar) {
        // background: #2d2d2d;
      }

      :deep(.van-nav-bar__content) {
        // background: #2d2d2d;
      }

      :deep(.van-nav-bar__title) {
          color: #FFD700;
      }

      :deep(.van-nav-bar__left .van-icon) {
        color: #ffffff;
      }
    }

    .category-tabs {
      // background: #2d2d2d;
      border-color: #404040;

      .gift-tabs {
        :deep(.van-tabs__nav) {
          // background: #2d2d2d;
        }
      }
    }

    .gift-container {
      .activities-content .activity-list .activity-card {
        // background: #2d2d2d;

        .card-content {
          .activity-title {
            color: #ffffff;
          }

          .activity-description {
            color: #a0a0a0;
          }
        }
      }

      .empty-state {
        :deep(.van-empty__description) {
          color: #a0a0a0;
        }
      }
    }
  }
}
</style>
