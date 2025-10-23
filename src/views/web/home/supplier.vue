<template>
  <div class="m-supplier-games">
    <van-nav-bar left-arrow :title="title" @click-left="onClickLeft" />

    <!-- 简化的供应商信息头部 - 只显示名字 -->
    <div class="m-supplier-header" v-if="supplierInfo.name">
      <div class="m-supplier-banner">
        <div class="m-supplier-details">
          <h3 class="m-supplier-name">{{ supplierInfo.name }}</h3>
          <div class="m-supplier-info">
            <span class="m-category-name">{{ categoryName }}</span>
            <van-tag
              :type="supplierInfo.is_can_run === 1 ? 'success' : 'danger'"
              :size="'small' as any"
            >
              {{ supplierInfo.is_can_run === 1 ? $t('supplier.normalRunning') : $t('supplier.maintenance') }}
            </van-tag>
            <span class="m-game-count">{{ $t('supplier.gameCount', { count: totalGames }) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏列表区域 -->
    <div class="m-games-container">
      <!-- 筛选栏 -->
      <div class="m-filter-bar">
        <div class="m-filter-info">
          <span class="m-filter-text">{{ supplierInfo.name }} - {{ categoryName }}</span>
        </div>
        <!-- 可以添加更多筛选选项，如排序等 -->
      </div>

      <!-- 游戏网格 -->
      <div class="m-games-content" ref="scrollContainer">
        <!-- 空数据状态 -->
        <van-empty
          v-if="gameList.length === 0 && !loading && !initialLoading"
          :description="$t('supplier.noGameData')"
          class="m-empty-state"
        />

        <!-- 初始加载状态 -->
        <div v-if="initialLoading" class="m-initial-loading">
          <van-loading size="32px">{{ $t('supplier.loadingGames') }}</van-loading>
        </div>

        <!-- 游戏列表 -->
        <div v-else-if="gameList.length > 0" class="m-games-grid">
          <div
            class="m-game-item"
            v-for="game in gameList"
            :key="game.id"
            @click.stop="enterGame(game)"
          >
            <div class="m-game-card">
              <!-- 游戏图片 -->
              <van-image :src="game.game_img_url" class="m-game-img" fit="fill">
                <template v-slot:error>
                  <van-icon name="warning-o" class="m-ico" size="24" />
                </template>
              </van-image>

              <!-- 游戏标签层 -->
              <div class="m-game-overlay">
                <!-- 供应商标签 -->
                <div class="m-supplier-tag">{{ game.supplier_code || supplierInfo.code }}</div>

                <!-- 热门标签 -->
                <div v-if="game.is_hot_text" class="m-hot-tag">{{ game.is_hot_text }}</div>

                <!-- 维护状态遮罩 -->
                <div v-if="game.is_can_run === 0" class="m-maintenance-overlay">
                  <div class="m-maintenance-content">
                    <van-icon name="warning-o" size="24" color="#fff" />
                    <div class="m-maintenance-text">{{ $t('supplier.maintenance') }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 游戏信息底部 -->
            <div class="m-game-footer">
              <span class="m-game-name" :title="game.game_name">
                {{ game.game_name || game.name }}
              </span>
              <!-- 维护状态指示器 -->
              <van-tag
                v-if="game.is_can_run === 0"
                type="danger"
                :size="'small' as any"
                class="m-maintenance-indicator"
              >
                {{ $t('supplier.maintenanceStatus') }}
              </van-tag>
            </div>
          </div>
        </div>

        <!-- 加载更多状态 -->
        <div v-if="loadingMore" class="m-loading-more">
          <van-loading size="20px">{{ $t('supplier.loadingMore') }}</van-loading>
        </div>

        <!-- 没有更多数据 -->
        <div v-else-if="!hasMore && gameList.length > 0" class="m-no-more">
          {{ $t('supplier.noMoreGames') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'SupplierGameList' })
import { onMounted, ref, computed, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { showToast } from 'vant'

import api from '@/api'
import { useI18n } from 'vue-i18n'
import { getLanguage } from '@/lang'

// 接收路由传递的 props
interface SupplierProps {
  name: string
  type: string
  supplier_code: string
  category_code?: string
  supplier_name?: string
  supplier_id?: string
  currency_code?: string
}

const props = defineProps<SupplierProps>()

const { t } = useI18n()
const store = useAppStore() as any
const route = useRoute()
const router = useRouter()

console.log('Supplier props:', props)
console.log('Supplier route params:', route.params)
console.log('Supplier route query:', route.query)

// ==================== 响应式数据 ====================
const initialLoading = ref(true)  // 初始加载状态
const loading = ref(false)        // 常规加载状态
const loadingMore = ref(false)    // 加载更多状态
const hasMore = ref(true)         // 是否还有更多数据
const currentPage = ref(1)        // 当前页码
const totalGames = ref(0)         // 游戏总数
const scrollContainer = ref(null) // 滚动容器引用

const title = ref<string>(
  props.supplier_name ||
  route.query?.supplier_name?.toString() ||
  props.name ||
  t('supplier.games')
)

// 供应商信息
const supplierInfo = ref({
  code: props.supplier_code || props.name,
  name: props.supplier_name || route.query?.supplier_name?.toString() || props.name || '',
  categoryCode: props.category_code || route.query?.category_code?.toString() || 'SLOT',
  currencyCode: props.currency_code || route.query?.currency_code?.toString() || 'CNY', // 保留作为fallback
  id: props.supplier_id || route.query?.supplier_id?.toString() || '',
  description: route.query?.supplier_desc?.toString() || '',
  is_can_run: Number(route.query?.is_can_run) || 1
})

// 游戏数据
const gameList = ref<any[]>([])      // 游戏列表

// 计算属性
const categoryName = computed(() => {
  return supplierInfo.value.categoryCode
})

// ==================== 导航方法 ====================
function onClickLeft() {
  router.back()
}

// ==================== 游戏相关方法 ====================
function enterGame(game: any) {
  console.log('enterGame:', game)
  if (!(store as any).isLogin()) {
    (store as any).$patch({ loginShow: true })
    return
  }

  // 检查游戏维护状态
  if (game.is_can_run === 0) {
    showToast(t('supplier.gameInMaintenance'))
    return
  }

  // 检查供应商维护状态
  if (supplierInfo.value.is_can_run === 0) {
    showToast(t('supplier.supplierInMaintenance'))
    return
  }

  router.push({
    name: 'to_game',
    params: {
      game: game.game_code,
      code: game.api_name || game.supplier_code || supplierInfo.value.code,
      mobile: 1,
    },
  })
}

// ==================== 数据获取方法 ====================
// 获取游戏列表
async function getGameList(page = 1, isLoadMore = false) {
  console.log(`${t('supplier.gameList')} - 页码: ${page}, 加载更多: ${isLoadMore}`)

  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    if (page === 1) {
      initialLoading.value = true
    }
  }

  try {
    // 获取用户货币类型
    const userInfo = (store as any).getUser()
    const userCurrency = userInfo?.currency || 'CNY' // 默认人民币

    console.log(t('currency.currencyType') + ':', userCurrency)
    console.log(t('supplier.supplierInfo') + ':', supplierInfo.value)

    // 然后修改 getGameList 函数中的请求参数部分：
    const requestParams = {
      // ==================== 🔥 1. 分页相关 ====================
      page: page,
      limit: 20,

      // ==================== 🔥 2. 厂商代码 ====================
      supplier_code: supplierInfo.value.code,

      // ==================== 🔥 3. 游戏类型 ====================
      game_type: supplierInfo.value.categoryCode,

      // ==================== 🔥 4. 货币类型 ====================
      currency: userCurrency,

      // ==================== 🔥 5. 语言 ====================
      language: getLanguage(),
    }

    console.log(t('supplier.gameList') + ' 请求参数:', requestParams)
    const resp: any = await api.gameList(requestParams)
    console.log(t('supplier.gameList') + ' 响应:', resp)

    if (resp && resp.code === 200) {
      // 处理不同的响应格式
      let newGames = []
      let pagination = null

      if (resp.data && Array.isArray(resp.data)) {
        // 简单数组格式
        newGames = resp.data
        hasMore.value = newGames.length === 20 // 假设满页就还有更多
      } else if (resp.data && resp.data.list && Array.isArray(resp.data.list)) {
        // 分页格式
        newGames = resp.data.list
        pagination = resp.data.pagination
        totalGames.value = resp.data.total || 0
        hasMore.value = pagination?.has_more || false
        currentPage.value = pagination?.current_page || page
      } else {
        newGames = []
      }

      // 数据处理
      newGames.forEach((game: any) => {
        // 确保必要字段存在
        if (!game.supplier_code) {
          game.supplier_code = supplierInfo.value.code
        }
        if (!game.api_name) {
          game.api_name = supplierInfo.value.code
        }
      })

      if (isLoadMore) {
        // 加载更多：追加数据
        gameList.value.push(...newGames)
      } else {
        // 首次加载：替换数据
        gameList.value = newGames
        currentPage.value = page
      }

      console.log(`${t('supplier.gameList')} 加载成功: 新增${newGames.length}个, 总计${gameList.value.length}个, 还有更多:${hasMore.value}`)

    } else {
      throw new Error(resp?.message || t('supplier.getGameListFailed'))
    }
  } catch (error) {
    console.error(t('supplier.getGameListFailed') + ':', error)
    showToast((error as Error)?.message || t('supplier.getGameListFailed'))
    if (!isLoadMore) {
      gameList.value = []
    }
  } finally {
    loading.value = false
    loadingMore.value = false
    initialLoading.value = false
  }
}

// 加载更多游戏
async function loadMoreGames() {
  if (!hasMore.value || loadingMore.value || loading.value) {
    console.log('跳过加载更多:', { hasMore: hasMore.value, loadingMore: loadingMore.value, loading: loading.value })
    return
  }

  const nextPage = currentPage.value + 1
  console.log('准备加载更多，页码:', nextPage)
  await getGameList(nextPage, true)
}

// 滚动监听
function setupScrollListener() {
  const container = scrollContainer.value
  if (!container) {
    console.log('滚动容器未找到')
    return
  }

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = container as HTMLElement
    const threshold = 100 // 距离底部100px时开始加载

    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      console.log('触发加载更多')
      loadMoreGames()
    }
  }

  ;(container as HTMLElement).addEventListener('scroll', handleScroll, { passive: true })

  // 组件卸载时清理监听器
  onUnmounted(() => {
    ;(container as HTMLElement).removeEventListener('scroll', handleScroll)
  })
}

// ==================== 初始化方法 ====================
async function init() {
  console.log('初始化供应商游戏页面...')
  console.log(t('supplier.supplierInfo') + ':', supplierInfo.value)

  try {
    // 获取游戏列表
    await getGameList(1, false)

    // 设置滚动监听
    nextTick(() => {
      setupScrollListener()
    })

    console.log('供应商游戏页面初始化完成')
  } catch (error) {
    console.error('供应商游戏页面初始化失败:', error)
    showToast(t('supplier.pageLoadFailed'))
  }
}

onMounted(async () => {
  await init()
})
</script>

<style lang="less" scoped>
.m-supplier-games {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f6f7;

  // 供应商信息头部
  .m-supplier-header {
    background: #fff;
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .m-supplier-banner {
      display: flex;
      align-items: center;

      .m-supplier-details {
        flex: 1;

        .m-supplier-name {
          margin: 0 0 8px 0;
          font-size: 22px;
          font-weight: 600;
          color: #333;
          line-height: 1.3;
        }

        .m-supplier-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;

          .m-category-name {
            font-size: 14px;
            color: #666;
            background: #f0f0f0;
            padding: 4px 8px;
            border-radius: 4px;
          }

          .m-game-count {
            font-size: 13px;
            color: #999;
          }
        }
      }
    }
  }

  // 游戏容器
  .m-games-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    // 筛选栏
    .m-filter-bar {
      background: #fff;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;

      .m-filter-info {
        .m-filter-text {
          font-size: 16px;
          color: #333;
          font-weight: 500;
        }
      }
    }

    // 游戏内容区域
    .m-games-content {
      flex: 1;
      padding: 12px;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;

      // 空状态
      .m-empty-state {
        margin-top: 80px;
      }

      // 初始加载状态
      .m-initial-loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 200px;
        color: #666;
      }

      // 游戏网格 - 修改为3列布局
      .m-games-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;

        .m-game-item {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;

          &:active {
            transform: scale(0.98);
          }

          .m-game-card {
            position: relative;
            width: 100%;
            padding-bottom: 100%; // 1:1 比例
            overflow: hidden;

            .m-game-img {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: #f8f9fa;
            }

            .m-game-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(
                to bottom,
                transparent 0%,
                transparent 60%,
                rgba(0, 0, 0, 0.7) 100%
              );
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
              padding: 6px;

              .m-supplier-tag {
                align-self: flex-start;
                background: rgba(40, 203, 147, 0.9);
                color: #fff;
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 9px;
                margin-bottom: auto;
              }

              .m-hot-tag {
                position: absolute;
                top: 6px;
                right: 6px;
                background: rgba(255, 107, 107, 0.9);
                color: #fff;
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 9px;
              }

              // 新的维护状态遮罩
              .m-maintenance-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;

                .m-maintenance-content {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 6px;

                  .m-maintenance-text {
                    color: #fff;
                    font-size: 12px;
                    font-weight: 500;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                  }
                }
              }
            }
          }

          .m-game-footer {
            padding: 8px 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;

            .m-game-name {
              flex: 1;
              font-size: 12px;
              color: #333;
              font-weight: 500;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: 1.3;
            }

            // 新的维护状态指示器
            .m-maintenance-indicator {
              flex-shrink: 0;
              font-size: 10px;
              padding: 1px 4px;
            }
          }
        }
      }

      // 加载更多状态
      .m-loading-more {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        color: #666;
      }

      // 没有更多数据
      .m-no-more {
        text-align: center;
        padding: 20px;
        color: #999;
        font-size: 14px;
      }
    }
  }
}

// 隐藏滚动条
::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
}

// 解决iOS滚动卡顿
.m-games-content {
  -webkit-overflow-scrolling: touch;
}

// 响应式设计 - 平板和大屏幕
@media screen and (min-width: 768px) {
  .m-games-grid {
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 12px !important;
  }

  .m-games-content {
    padding: 16px !important;
  }
}

@media screen and (min-width: 1024px) {
  .m-games-grid {
    grid-template-columns: repeat(5, 1fr) !important;
    gap: 16px !important;
  }
}
</style>
