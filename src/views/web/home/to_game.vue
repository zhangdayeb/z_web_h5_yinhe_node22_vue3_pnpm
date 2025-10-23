<template>
  <div class="m-toGame-par">
    <van-nav-bar
      left-arrow
      :title="$t('mine.toGame')"
      @click-left="onClickLeft"
    >
      <!-- 右侧收藏按钮 -->
      <template #right>
        <div
          v-if="(store as any).isLogin()"
          class="nav-favorite-btn"
          @click="toggleFavorite"
        >
          <van-icon
            :name="isFavorite ? 'star' : 'star-o'"
            :color="isFavorite ? '#ff6b6b' : '#666'"
            size="20"
          />
        </div>
      </template>
    </van-nav-bar>

    <div class="m-toGame">
      <!-- 页面初始加载状态 -->
      <div class="m-loading" v-if="loading">
        <van-loading size="24" color="#fff">{{ $t('common.loading') }}</van-loading>
      </div>

      <!-- 主内容区域 -->
      <div class="m-game-info" v-else>
        <div class="m-title">
          {{ gameInfo.name || $t('game.enterGame') }}
          <!-- 收藏状态指示器 -->
          <van-icon
            v-if="(store as any).isLogin() && isFavorite"
            name="star"
            color="#ff6b6b"
            size="18"
            class="title-favorite-icon"
          />
        </div>

        <div class="m-content">
          <!-- 游戏启动加载状态 -->
          <div v-if="entering" class="m-entering-overlay">
            <div class="m-entering-content">
              <van-loading type="spinner" size="32" color="#fff" />
              <div class="m-entering-text">
                <p class="main-text">{{ currentLoadingText }}</p>
                <p class="sub-text">{{ $t('common.pleaseWait') }}</p>
              </div>
              <div class="m-progress-bar">
                <div class="progress-fill" :style="{ width: progress + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- 游戏信息展示区域 -->
          <div class="m-game-details">
            <!-- 游戏基本信息 -->
            <div class="m-game-basic-info">
              <div class="info-item" v-if="gameInfo.provider">
                <span class="label">{{ $t('game.gameProvider') }}</span>
                <span class="value">{{ gameInfo.provider }}</span>
              </div>
              <div class="info-item" v-if="gameInfo.type">
                <span class="label">{{ $t('game.gameType') }}</span>
                <span class="value">{{ gameInfo.type }}</span>
              </div>
              <div class="info-item" v-if="gameInfo.status">
                <span class="label">{{ $t('game.gameStatus') }}</span>
                <van-tag
                  :type="gameInfo.status === 'online' ? 'success' : 'warning'"
                  :size="'small' as any"
                >
                  {{ gameInfo.status === 'online' ? $t('game.statusOnline') : $t('game.statusMaintenance') }}
                </van-tag>
              </div>
            </div>

            <!-- 收藏操作区域 -->
            <div v-if="(store as any).isLogin()" class="m-favorite-section">
              <van-button
                :type="isFavorite ? 'danger' : 'default'"
                :plain="!isFavorite"
                size="small"
                :loading="favoriteLoading"
                @click="toggleFavorite"
                class="favorite-button"
              >
                <van-icon
                  :name="isFavorite ? 'star' : 'star-o'"
                  :color="isFavorite ? '#fff' : '#ff6b6b'"
                  size="16"
                />
                {{ isFavorite ? $t('game.favorited') : $t('game.addToFavorite') }}
              </van-button>
            </div>
          </div>

          <!-- 进入游戏按钮 -->
          <van-button
            size="large"
            color="#8b0000"
            class="m-enter-btn"
            @click="enterGame"
            :loading="entering"
            :disabled="entering || gameInfo.status === 'maintenance'"
          >
            {{ entering ? currentLoadingText : (gameInfo.status === 'maintenance' ? $t('common.maintenance') : $t('game.enterGame')) }}
          </van-button>
        </div>
      </div>
    </div>
    <a ref="gameLink" href="" target="_self" style="display: none"></a>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { showDialog, showToast } from 'vant'
import { onMounted, ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'

const lobbyUrl = window.location.origin;
defineOptions({ name: 'ToGame' })

const { t } = useI18n()
const store = useAppStore() as any
const route = useRoute()
const router = useRouter()
const gameLink = ref<HTMLAnchorElement | null>(null)
const loading = ref(false)
const entering = ref(false)

// 收藏相关状态
const isFavorite = ref(false)
const favoriteLoading = ref(false)

// 游戏信息
const gameInfo = ref({
  id: route.params.game,
  code: route.params.code,
  name: '',
  provider: '',
  type: '',
  status: 'online', // online, maintenance
  supplier_code: route.params.code,
  game_code: route.params.game
})

// 加载进度相关
const progress = ref(0)
const loadingStep = ref(0)
let progressTimer: number | null = null

// 加载步骤文案 - 支持多语言
const loadingSteps = computed(() => [
  t('game.loadingSteps.verifyingUser'),
  t('game.loadingSteps.syncingData'),
  t('game.loadingSteps.connectingServer'),
  t('game.loadingSteps.startingEnvironment'),
  t('game.loadingSteps.completing')
])

// 当前加载文案
const currentLoadingText = computed(() => {
  return loadingSteps.value[loadingStep.value] || t('game.processing')
})

// 模拟加载进度
function startLoadingProgress() {
  progress.value = 0
  loadingStep.value = 0

  progressTimer = window.setInterval(() => {
    if (progress.value < 90) {
      // 前90%进度较快
      progress.value += Math.random() * 15 + 5

      // 根据进度更新加载步骤
      const stepIndex = Math.floor(progress.value / 20)
      if (stepIndex < loadingSteps.value.length) {
        loadingStep.value = stepIndex
      }
    }
  }, 300)
}

// 完成加载进度
function completeLoadingProgress() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }

  loadingStep.value = loadingSteps.value.length - 1
  progress.value = 100
}

// 返回
function onClickLeft() {
  router.back()
}

// 收藏/取消收藏功能
async function toggleFavorite() {
  if (!(store as any).isLogin()) {
    showToast(t('game.loginRequired'))
    return
  }

  favoriteLoading.value = true

  try {
    const apiCall = isFavorite.value ? api.userGameLoveDel : api.userGameLoveAdd
    const params = {
      game_code: gameInfo.value.game_code,
      supplier_code: gameInfo.value.supplier_code
    }

    const resp: any = await apiCall(params)

    if (resp && resp.code === 200) {
      isFavorite.value = !isFavorite.value
      showToast(isFavorite.value ? t('game.addedToFavorite') : t('game.removedFromFavorite'))
    } else {
      throw new Error(resp?.message || t('game.operationFailed'))
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
    showToast((error as Error).message || t('game.operationFailedRetry'))
  } finally {
    favoriteLoading.value = false
  }
}

// 自动添加到最近游戏 - 页面进入时立即调用
async function addToRecentGames() {
  if (!(store as any).isLogin()) {
    console.log('用户未登录，跳过添加到最近游戏')
    return
  }

  try {
    const params = {
      game_code: gameInfo.value.game_code,
      supplier_code: gameInfo.value.supplier_code
    }

    console.log('正在添加到最近游戏:', params)

    const resp: any = await api.userGameRecentAdd(params)

    if (resp && resp.code === 200) {
      console.log('已成功添加到最近游戏')
    } else {
      console.warn('添加到最近游戏失败:', resp?.message || t('common.unknownError'))
    }
  } catch (error) {
    console.error('添加到最近游戏异常:', error)
    // 这里不显示错误提示，因为是后台自动操作
  }
}

// 检查游戏是否已收藏
async function checkFavoriteStatus() {
  if (!(store as any).isLogin()) {
    return
  }

  try {
    // 获取收藏游戏列表，检查当前游戏是否在其中
    const resp: any = await api.userGameLoveList({
      page: 1,
      limit: 100 // 获取足够多的数据来检查
    })

    if (resp && resp.code === 200 && resp.data?.list) {
      const favoriteGames = resp.data.list
      isFavorite.value = favoriteGames.some((game: any) =>
        game.game_code === gameInfo.value.game_code &&
        game.supplier_code === gameInfo.value.supplier_code
      )
      console.log('收藏状态检查完成:', isFavorite.value)
    }
  } catch (error) {
    console.error('检查收藏状态失败:', error)
  }
}

// 获取游戏基本信息
async function getGameInfo() {
  try {
    // 这里可以调用API获取游戏详细信息
    // 目前使用路由参数的基本信息
    gameInfo.value = {
      ...gameInfo.value,
      name: t('game.gameTitle', { name: route.params.game }),
      provider: t('game.defaultProvider'),
      type: t('game.defaultType')
    }

    console.log('游戏信息初始化完成:', gameInfo.value)
  } catch (error) {
    console.error('获取游戏信息失败:', error)
  }
}

async function enterGame() {
  if (entering.value) return

  entering.value = true
  startLoadingProgress()

  try {
    const resp: any = await api.gameUrl({
      gameCode: route.params.game,
      api_code: route.params.code,
      ismobile: route.params.mobile,
      lobby: lobbyUrl
    })

    if (resp) {
      const gameUrl = resp?.data?.game_url?.toString() ?? ''
      if (gameUrl) {
        // 完成进度条动画
        completeLoadingProgress()

        // 等待进度条完成动画后直接跳转
        setTimeout(() => {
          // 移动端直接跳转
          window.location.href = gameUrl
        }, 800)
      } else {
        if (progressTimer) {
          clearInterval(progressTimer)
          progressTimer = null
        }
        entering.value = false
        showDialog({ message: t('game.getGameUrlFailed') })
      }
    } else {
      if (progressTimer) {
        clearInterval(progressTimer)
        progressTimer = null
      }
      entering.value = false
      showDialog({ message: resp?.message || t('game.gameStartFailed') })
    }
  } catch (error) {
    if (progressTimer) {
      clearInterval(progressTimer)
      progressTimer = null
    }
    entering.value = false
    console.error('游戏启动异常:', error)
    showDialog({ message: t('game.gameStartFailedRetry') })
  }
}

onMounted(async () => {
  loading.value = true

  try {
    // 并行执行初始化任务
    await Promise.all([
      getGameInfo(),
      checkFavoriteStatus()
    ])

    // 初始化完成后立即添加到最近游戏
    await addToRecentGames()

  } catch (error) {
    console.error('初始化失败:', error)
  } finally {
    setTimeout(() => {
      loading.value = false
    }, 500)
  }
})

onUnmounted(() => {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
})
</script>

<style lang="less" scoped>
.m-toGame-par {
  display: flex;
  flex-direction: column;
  height: 100%;

  // 导航栏收藏按钮
  .nav-favorite-btn {
    padding: 4px 8px;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.95);
    }
  }

  .m-toGame {
    display: flex;
    flex-direction: column;
    flex: 1;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.6);

    .m-loading {
      color: #fff;
      text-align: center;
    }

    .m-game-info {
      margin: 0px 16px;
      width: calc(100% - 32px);
      max-width: 400px;
      display: flex;
      flex-direction: column;
      background-color: #fff;
      border-radius: 8px;
      overflow: hidden;
      position: relative;

      .m-title {
        background-color: #333;
        color: #fff;
        height: 42px;
        text-align: center;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        font-weight: 500;
        position: relative;

        .title-favorite-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
        }
      }

      .m-content {
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;

        // 游戏详情区域
        .m-game-details {
          width: 100%;
          margin-bottom: 20px;

          .m-game-basic-info {
            margin-bottom: 16px;

            .info-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #f5f5f5;

              &:last-child {
                border-bottom: none;
              }

              .label {
                font-size: 14px;
                color: #666;
                font-weight: 500;
              }

              .value {
                font-size: 14px;
                color: #333;
              }
            }
          }

          .m-favorite-section {
            display: flex;
            justify-content: center;
            padding: 12px 0;

            .favorite-button {
              min-width: 120px;
              height: 36px;
              border-radius: 18px;
              font-size: 14px;
              font-weight: 500;
              transition: all 0.3s ease;

              &:active {
                transform: scale(0.98);
              }
            }
          }
        }

        .m-enter-btn {
          width: 200px;
          height: 44px;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.3s ease;

          &:disabled {
            opacity: 0.7;
          }

          &:active:not(:disabled) {
            transform: scale(0.98);
          }
        }

        // 游戏启动加载遮罩
        .m-entering-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg,
            rgba(139, 0, 0, 0.95) 0%,
            rgba(70, 0, 0, 0.95) 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: #fff;
          border-radius: inherit;
          z-index: 10;

          .m-entering-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            max-width: 280px;
            padding: 20px;

            .m-entering-text {
              margin-top: 20px;
              margin-bottom: 20px;

              .main-text {
                font-size: 16px;
                font-weight: 500;
                margin: 0 0 8px 0;
                color: #fff;
              }

              .sub-text {
                font-size: 14px;
                opacity: 0.8;
                margin: 0;
                color: #fff;
              }
            }

            .m-progress-bar {
              width: 200px;
              height: 4px;
              background-color: rgba(255, 255, 255, 0.2);
              border-radius: 2px;
              overflow: hidden;
              position: relative;

              .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #fff 0%, #f0f0f0 100%);
                border-radius: 2px;
                transition: width 0.3s ease;
                position: relative;

                &::after {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: linear-gradient(90deg,
                    transparent 0%,
                    rgba(255, 255, 255, 0.3) 50%,
                    transparent 100%);
                  animation: shimmer 1.5s infinite;
                }
              }
            }
          }
        }
      }
    }
  }
}

// 进度条光效动画
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// 加载点动画
@keyframes loading-dots {
  0%, 20% {
    color: rgba(255, 255, 255, 0.4);
  }
  50% {
    color: rgba(255, 255, 255, 1);
  }
  80%, 100% {
    color: rgba(255, 255, 255, 0.4);
  }
}
</style>
