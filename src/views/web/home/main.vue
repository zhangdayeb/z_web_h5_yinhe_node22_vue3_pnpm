<template>
  <div class="m-main" :style="{
   backgroundImage: `url(${backgroundImg})`,
   backgroundPosition: 'center center',
   backgroundSize: 'cover',
   backgroundRepeat: 'no-repeat',
   backgroundColor: 'var(--color-m-background)'
 }">
    <!-- i18n -->
    <LanguageVue />

    <!-- 用户信息区域 -->
    <div class="m-col m-col-top">
      <div class="m-header-container">
        <!-- Logo -->
        <van-image :src="logoImg" fit="contain" class="m-logo-img"></van-image>

        <!-- 登录状态信息 -->
        <div class="m-user-section">
          <div class="m-row" v-if="(store as any).getUser() === null">
            <span>{{ $t('main.noLogin') }}</span>
            <span class="m-link" @click.stop="showLoginPopup">{{
              $t('main.loginCheck')
            }}</span>
          </div>
          <div class="m-row" v-else>
            <div class="m-row m-user">
              <span class="m-user-name">{{ (store as any).getUser()?.name ?? '' }}</span>
              <div class="m-user-level">
                <div class="m-img-bg">VIP</div>
                <span class="m-level-txt">{{ (store as any).getUser()?.level }}</span>
              </div>
              <van-button v-if="false" type="danger" :size="'small' as any" class="m-btn"
                @click="signDailyHandler">{{ $t('mine.daliySign') }}</van-button>
            </div>
            <div class="m-balance-row">
              <span class="m-balance-text">${{
                Number((store as any).getUser()?.money ?? '0.00') <= 0
                  ? '0.00'
                  : Number((store as any).getUser()?.money).toFixed(2)
              }}</span>
              <div class="m-balance-actions">
                <van-button type="primary" size="mini" class="m-action-btn" @click="refreshBalanceHandler">
                  <van-image :src="sxImg" fit="contain" class="m-refresh-img"></van-image>
                </van-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- banner -->
    <van-swipe class="my-swipe" :autoplay="3000" indicator-color="white">
      <van-swipe-item v-for="item in banners" :key="item.id">
        <van-image :src="item.url" style="height: 100%;"></van-image>
      </van-swipe-item>
    </van-swipe>

    <!-- 通知栏 -->
    <div class="m-notice" v-if="notices.length > 0">
      <div class="m-notice-icon">
        <i class="van-badge__wrapper van-icon van-icon-volume-o van-notice-bar__left-icon"></i>
      </div>
      <div class="m-notice-content">
        <van-swipe :autoplay="5000" :show-indicators="false" vertical class="notice-swipe" :touchable="false"
          :stop-propagation="true" ref="noticeSwipe">
          <van-swipe-item v-for="notice in notices" :key="notice.id">
            <div class="notice-text-wrapper">
              <div class="notice-text notice-text-scroll" v-html="notice.content"></div>
            </div>
          </van-swipe-item>
        </van-swipe>
      </div>
    </div>

    <!-- 中奖信息区域 - 完全修复版本 -->
    <div class="m-winner-section">
      <div class="m-winner-scroll-container">
        <div class="m-winner-scroll-content">
          <!-- 第一组数据 -->
          <div class="m-winner-item" v-for="(winner, index) in winnerList" :key="'first-' + index">
            <van-image :src="winner.gameImage" class="m-game-image"></van-image>
            <div class="m-winner-username">{{ winner.username }}</div>
            <div class="m-winner-amount">{{ winner.amount }}</div>
          </div>
          <!-- 复制一份数据用于无缝循环 -->
          <div class="m-winner-item" v-for="(winner, index) in winnerList" :key="'second-' + index">
            <van-image :src="winner.gameImage" class="m-game-image"></van-image>
            <div class="m-winner-username">{{ winner.username }}</div>
            <div class="m-winner-amount">{{ winner.amount }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 卡片区域 -->
    <div class="m-col">
      <div class="m-row">
        <div class="m-row-item m-start" @click="operatHandler(1)">
          <van-image :src="depositImg" fit="contain" class="m-img"></van-image>
          <span class="m-label">{{ $t('mine.deposit') }}</span>
        </div>
        <div class="m-row-item" @click="operatHandler(2)">
          <van-image :src="withdrawImg" fit="contain" class="m-img"></van-image>
          <span class="m-label">{{ $t('mine.withdraw') }}</span>
        </div>
        <div class="m-row-item" @click="operatHandler(4)">
          <van-image :src="jiaoyiImg" fit="contain" class="m-img"></van-image>
          <span class="m-label">{{ $t('mine.moneyjiaoyi') }}</span>
        </div>
        <div class="m-row-item m-end" @click="operatHandler(3)">
          <van-image :src="vipImg" fit="contain" class="m-img"></van-image>
          <span class="m-label">VIP</span>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="m-main-contain">
      <!-- 左侧游戏类型导航 -->
      <div class="m-con-left">
        <div class="m-scroll-wrapper">
          <div class="m-scroll-content">
            <div class="m-scroll-list-wrapper">
              <div class="m-gameNav-container">
                <div class="m-gameNav-item" v-for="item in gameTypes" :key="item.id"
                  :class="{ active: item.id === currentGameType?.id }" @click.stop="selectGameHandler(item)">
                  <van-image :src="
                      currentGameType?.id === item.id
                        ? item.icon_after
                        : item.icon_before
                    " class="m-item-img"></van-image>
                  <div class="m-item-txt">{{ item.title }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容区域 -->
      <div class="m-con-right">
        <div class="m-scroll-wrapper" ref="scrollContainer">
          <div class="m-scroll-content">
            <div class="m-scroll-list-wrapper">
              <div class="m-gameNav-container-list">
                <!-- 热门游戏类型 - 显示选项卡和对应内容 -->
                <div v-if="isHotGameType" class="m-hot-games-section">
                  <!-- 热门游戏选项卡 -->
                  <div class="m-hot-tabs">
                    <div class="m-hot-tab-item" :class="{ active: activeHotTab === 'hot' }"
                      @click="switchHotTab('hot')">
                      {{ $t('game.hot') }}
                    </div>
                    <div class="m-hot-tab-item" :class="{ active: activeHotTab === 'recent' }"
                      @click="switchHotTab('recent')">
                      {{ $t('game.recent') }}
                    </div>
                    <div class="m-hot-tab-item" :class="{ active: activeHotTab === 'favorite' }"
                      @click="switchHotTab('favorite')">
                      {{ $t('game.favorite') }}
                    </div>
                  </div>

                  <!-- 热门游戏内容区域 -->
                  <div class="m-hot-content">
                    <!-- 未登录提示 -->
                    <div v-if="!(store as any).isLogin() && (activeHotTab === 'recent' || activeHotTab === 'favorite')"
                      class="m-login-tip">
                      <div class="m-login-tip-content">
                        <van-icon name="warning-o" size="24" color="#999" />
                        <p>{{ $t(activeHotTab === 'recent' ? 'game.loginToViewRecent' : 'game.loginToViewFavorite') }}
                        </p>
                        <van-button type="primary" size="small" @click="showLoginPopup">
                          {{ $t('game.loginNow') }}
                        </van-button>
                      </div>
                    </div>

                    <!-- 游戏列表 -->
                    <div v-else class="m-content-games">
                      <div class="m-game-item" v-for="item in currentGameList" :key="item.id"
                        @click.stop="playGameHandler(item)">
                        <van-image :src="item.game_img_url" class="m-game-img" fit="fill">
                          <template v-slot:error>
                            <van-icon name="warning-o" class="m-ico" size="22" />
                          </template>
                        </van-image>
                        <div class="m-game-name">{{ item.game_name }}</div>
                        <div v-if="item.is_hot_text" class="m-game-tag">{{ item.is_hot_text }}</div>
                        <!-- 游戏维护状态标识 -->
                        <div v-if="item.is_can_run === 0" class="m-game-status">{{ $t('mine.maintenance') }}</div>
                      </div>
                    </div>

                    <!-- 空数据状态 -->
                    <div v-if="currentGameList.length === 0 && !loading && (store as any).isLogin()" class="m-empty">
                      <van-empty :description="getEmptyDescription()" />
                    </div>
                  </div>
                </div>

                <!-- 其他类型：厂商列表 - 每行1个，纯大图 -->
                <div v-else class="m-content-suppliers">
                  <div class="m-supplier-item" v-for="supplier in supplierList" :key="supplier.id"
                    @click.stop="selectSupplierHandler(supplier)">
                    <van-image :src="supplier.img_url" class="m-supplier-img" fit="fill">
                      <template v-slot:error>
                        <van-icon name="warning-o" class="m-ico" size="22" />
                      </template>
                    </van-image>
                    <!-- 供应商名称显示在图片底部 -->
                    <div class="m-supplier-name">{{ supplier.name }}</div>
                    <div v-if="supplier.is_can_run === 0" class="m-supplier-status">{{ $t('mine.maintenance') }}</div>
                  </div>
                </div>

                <!-- 加载更多状态 -->
                <div v-if="loadingMore" class="m-loading-more">
                  <van-loading>{{ $t('common.loading') }}</van-loading>
                </div>

                <!-- 没有更多数据 -->
                <div v-else-if="!hasMore && (currentGameList.length > 0 || supplierList.length > 0)" class="m-no-more">
                  {{ $t('common.noMore') }}
                </div>

                <!-- 空数据状态 -->
                <div v-if="!isHotGameType && gameList.length === 0 && supplierList.length === 0 && !loading"
                  class="m-empty">
                  <van-empty :description="$t('common.noData')" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知弹窗 -->
    <NoticesPop />

    <!-- 登录弹窗 -->
    <LoginProp v-model="store.loginShow" @login-success="handleLoginSuccess" @show-register="showRegisterPopup" />

    <!-- 注册弹窗 -->
    <RegisterProp v-model="store.registerShow" @register-success="handleRegisterSuccess" @show-login="showLoginPopup" />

    <!-- 底部导航 -->
    <div class="m-main-footer">
      <TabBar />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, ref, nextTick, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { showToast, showConfirmDialog } from 'vant'

  // 组件导入
  import LanguageVue from '@/views/web/components/language.vue'
  import NoticesPop from '@/views/web/components/notices.vue'
  import LoginProp from '@/views/web/components/loginProp.vue'
  import RegisterProp from '@/views/web/components/RegisterProp.vue'
  import TabBar from '@/views/web/components/tab_bar.vue'

  // 工具和API导入
  import api from '@/api'
  import { useAppStore } from '@/stores/app'

  // 图片资源导入
  import logoImg from '@/assets/mobile/app/logo.png'
  import depositImg from '@/assets/mobile/home/tx.png'
  import sxImg from '@/assets/mobile/home/sx2.png'
  import withdrawImg from '@/assets/mobile/home/wdsr.png'
  import vipImg from '@/assets/mobile/home/fl.png'
  import jiaoyiImg from '@/assets/mobile/home/tz.png'
  import noticeImg from '@/assets/mobile/newhome/icon_msg.avif'
  import backgroundImg from '@/assets/mobile/app/background.bmp'
  import { getWinnerList } from '@/api/lunbo.ts'

  defineOptions({ name: 'HomeMain' })

  const router = useRouter()
  const store = useAppStore() as any
  const { t } = useI18n()

  // ==================== 响应式数据 ====================
  const banners = ref([] as any[])
  const notices = ref([] as any[])
  const gameTypes = ref([] as any[])
  const currentGameType = ref(null as any)

  // 中奖用户列表数据
  const winnerList = ref<any[]>([])

  // 游戏列表数据
  const gameList = ref([] as any[])
  const hotGameList = ref([] as any[])      // 热门游戏列表
  const recentGameList = ref([] as any[])   // 最近游戏列表
  const favoriteGameList = ref([] as any[]) // 收藏游戏列表
  const supplierList = ref([] as any[])

  // 状态控制
  const loading = ref(false)
  const loadingMore = ref(false)
  const hasMore = ref(true)
  const currentPage = ref(1)
  const scrollContainer = ref(null)
  const noticeSwipe = ref(null)

  // 热门游戏选项卡状态
  const activeHotTab = ref('hot')

 // ==================== 中奖列表相关计算属性 ====================
 // 计算显示的数据（原数据 + 复制数据用于无缝滚动）
 const winnerDisplayData = computed(() => {
   if (winnerList.value.length === 0) return []

   // 复制2次数据确保无缝滚动效果
   const displayData = []
   for (let i = 0; i < 2; i++) {
     displayData.push(...winnerList.value.map((item, index) => ({
       ...item,
       uniqueKey: `winner-${i}-${index}`
     })))
   }

   return displayData
 })

 // 计算动画时长（根据数据量动态调整）
 const scrollAnimationDuration = computed(() => {
   const itemCount = winnerList.value.length
   // 根据项目数量调整动画时长
   return 30 + (itemCount * 1.5) // 单位：秒
 })

 // 滚动内容样式
 const scrollContentStyle = computed(() => {
   return {
     animation: `scroll-left ${scrollAnimationDuration.value}s linear infinite`
   }
 })

  // ==================== 计算属性 ====================
  const isHotGameType = computed(() => {
    return currentGameType.value?.game_type === 'HOT'
  })

  // 根据当前选中的选项卡返回对应的游戏列表
  const currentGameList = computed(() => {
    switch (activeHotTab.value) {
      case 'hot':
        return hotGameList.value
      case 'recent':
        return recentGameList.value
      case 'favorite':
        return favoriteGameList.value
      default:
        return hotGameList.value
    }
  })

  // 获取空数据描述文本
  const getEmptyDescription = () => {
    switch (activeHotTab.value) {
      case 'hot':
        return t('game.noHotGames')
      case 'recent':
        return t('game.noRecentGames')
      case 'favorite':
        return t('game.noFavoriteGames')
      default:
        return t('common.noData')
    }
  }

  // ==================== 中奖列表相关方法 ====================
  function initWinnerList() {
    winnerList.value = getWinnerList()
  }

  // ==================== 统一登录检查函数 ====================
  function checkLoginAndExecute(callback: () => void): boolean {
    if (!(store as any).isLogin()) {
      showLoginPopup()
      return false
    }
    callback()
    return true
  }

  // 显示登录弹窗
  function showLoginPopup() {
    store.$patch({ loginShow: true, registerShow: false })
  }

  // 显示注册弹窗
  function showRegisterPopup() {
    store.$patch({ registerShow: true, loginShow: false })
  }

  // 登录成功回调处理
  async function handleLoginSuccess() {
    console.log(t('home.loginSuccess') + '，开始处理后续逻辑')
    await refreshUserInfo()
    if (isHotGameType.value && (activeHotTab.value === 'recent' || activeHotTab.value === 'favorite')) {
      if (activeHotTab.value === 'recent') {
        await getRecentGames(1, false)
      } else if (activeHotTab.value === 'favorite') {
        await getFavoriteGames(1, false)
      }
    }
    showToast(t('home.loginSuccess'))
  }

  // 注册成功回调处理
  async function handleRegisterSuccess() {
    console.log('注册成功，开始处理后续逻辑')
    await refreshUserInfo()
    if (isHotGameType.value && (activeHotTab.value === 'recent' || activeHotTab.value === 'favorite')) {
      if (activeHotTab.value === 'recent') {
        await getRecentGames(1, false)
      } else if (activeHotTab.value === 'favorite') {
        await getFavoriteGames(1, false)
      }
    }
    showToast(t('register.registerSuccess'))
  }

  // ==================== 新增：刷新余额处理函数 ====================
  async function refreshBalanceHandler() {
    try {
      showToast(t('common.loading'))
      await refreshUserInfo()
      showToast(t('mine.balanceUpdated'))
    } catch (error) {
      console.error('刷新余额失败:', error)
      showToast(t('mine.refreshFailed'))
    }
  }

  // ==================== 热门游戏选项卡切换 ====================
  async function switchHotTab(tab: string) {
    if (activeHotTab.value === tab) {
      return
    }

    // 检查登录状态（仅针对需要登录的选项卡）
    if ((tab === 'recent' || tab === 'favorite') && !(store as any).isLogin()) {
      showLoginPopup()
      return
    }

    activeHotTab.value = tab
    hasMore.value = true
    currentPage.value = 1

    // 根据选项卡加载对应数据
    switch (tab) {
      case 'hot':
        if (hotGameList.value.length === 0) {
          await getHotGames(1, false)
        }
        break
      case 'recent':
        await getRecentGames(1, false)
        break
      case 'favorite':
        await getFavoriteGames(1, false)
        break
    }
  }

  // ==================== 通知相关方法 ====================
  async function getNotices() {
    try {
      const resp: any = await api.notices({ page: 1, limit: 5 })
      console.log('notices resp:', resp)
      if (resp && resp.code === 200 && Array.isArray(resp.data)) {
        notices.value = resp.data
        console.log(t('home.noticeLoadSuccess') + ':', notices.value)
      } else {
        console.warn(t('home.noticeDataError') + ':', resp)
      }
    } catch (error) {
      console.error(t('home.getNoticesFailed') + ':', error)
    }
  }

  // ==================== 游戏类型相关方法 ====================
  async function getGameTypes() {
    try {
      const resp: any = await api.gameTypeList()
      if (resp && resp.code === 200 && resp.data) {
        gameTypes.value = resp.data
        gameTypes.value.sort((a: any, b: any) => a.sort_weight - b.sort_weight)
      }
    } catch (error) {
      console.error(t('home.getGameTypesFailed') + ':', error)
      showToast(t('home.getGameTypesFailed'))
    }
  }

  // ==================== 热门游戏相关方法 ====================
  async function getHotGames(page = 1, isLoadMore = false) {
    if (isLoadMore) {
      loadingMore.value = true
    } else {
      loading.value = true
    }

    try {
      const params = {
        page: page,
        limit: 20
      }

      const resp: any = await api.gameHotList(params)
      if (resp && resp.code === 200 && resp.data) {
        const newGames = resp.data.list || []

        if (isLoadMore) {
          hotGameList.value.push(...newGames)
        } else {
          hotGameList.value = newGames
          currentPage.value = 1
        }

        const pagination = resp.data.pagination
        hasMore.value = pagination?.has_more || false
        currentPage.value = pagination?.current_page || page
      }
    } catch (error) {
      console.error(t('game.getHotGamesFailed') + ':', error)
      showToast(t('game.getHotGamesFailed'))
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  // ==================== 最近游戏相关方法 ====================
  async function getRecentGames(page = 1, isLoadMore = false) {
    if (!(store as any).isLogin()) {
      recentGameList.value = []
      return
    }

    if (isLoadMore) {
      loadingMore.value = true
    } else {
      loading.value = true
    }

    try {
      const params = {
        page: page,
        limit: 20
      }

      const resp: any = await api.userGameRecentList(params)
      if (resp && resp.code === 200 && resp.data) {
        const newGames = resp.data.list || []

        if (isLoadMore) {
          recentGameList.value.push(...newGames)
        } else {
          recentGameList.value = newGames
          currentPage.value = 1
        }

        const pagination = resp.data.pagination
        hasMore.value = pagination?.has_more || false
        currentPage.value = pagination?.current_page || page
      }
    } catch (error) {
      console.error(t('game.getRecentGamesFailed') + ':', error)
      showToast(t('game.getRecentGamesFailed'))
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  // ==================== 收藏游戏相关方法 ====================
  async function getFavoriteGames(page = 1, isLoadMore = false) {
    if (!(store as any).isLogin()) {
      favoriteGameList.value = []
      return
    }

    if (isLoadMore) {
      loadingMore.value = true
    } else {
      loading.value = true
    }

    try {
      const params = {
        page: page,
        limit: 20
      }

      const resp: any = await api.userGameLoveList(params)
      if (resp && resp.code === 200 && resp.data) {
        const newGames = resp.data.list || []

        if (isLoadMore) {
          favoriteGameList.value.push(...newGames)
        } else {
          favoriteGameList.value = newGames
          currentPage.value = 1
        }

        const pagination = resp.data.pagination
        hasMore.value = pagination?.has_more || false
        currentPage.value = pagination?.current_page || page
      }
    } catch (error) {
      console.error(t('game.getFavoriteGamesFailed') + ':', error)
      showToast(t('game.getFavoriteGamesFailed'))
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  // ==================== 厂商列表相关方法 ====================
  async function getSuppliers(categoryCode: any, page = 1, isLoadMore = false) {
    if (isLoadMore) {
      loadingMore.value = true
    } else {
      loading.value = true
    }

    try {
      const params = {
        category_code: categoryCode,
        page: page,
        limit: 20,
        show_status: 1
      }

      const resp: any = await api.supplierList(params)
      if (resp && resp.code === 200 && resp.data) {
        const newSuppliers = resp.data.list || []

        newSuppliers.forEach((supplier: any) => {
          supplier.is_can_run = supplier.run_status
        })

        if (isLoadMore) {
          supplierList.value.push(...newSuppliers)
        } else {
          supplierList.value = newSuppliers
          currentPage.value = 1
        }

        const pagination = resp.data.pagination
        hasMore.value = pagination?.has_more || false
        currentPage.value = pagination?.current_page || page
      } else {
        throw new Error(resp?.message || t('home.getSupplierListFailed'))
      }
    } catch (error) {
      console.error(t('home.getSupplierListFailed') + ':', error)
      showToast(t('home.getSupplierListFailed'))
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  // ==================== 交互逻辑方法 ====================
  async function selectGameHandler(gameItem: any) {
    if (currentGameType.value?.id === gameItem.id) {
      return
    }

    currentGameType.value = gameItem
    gameList.value = []
    hotGameList.value = []
    recentGameList.value = []
    favoriteGameList.value = []
    supplierList.value = []

    hasMore.value = true
    currentPage.value = 1

    if (gameItem.game_type === 'HOT') {
      activeHotTab.value = 'hot'
      await getHotGames(1, false)
    } else {
      await getSuppliers(gameItem.game_type, 1, false)
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) {
      return
    }

    const nextPage = currentPage.value + 1

    if (isHotGameType.value) {
      switch (activeHotTab.value) {
        case 'hot':
          await getHotGames(nextPage, true)
          break
        case 'recent':
          await getRecentGames(nextPage, true)
          break
        case 'favorite':
          await getFavoriteGames(nextPage, true)
          break
      }
    } else {
      await getSuppliers(currentGameType.value.game_type, nextPage, true)
    }
  }

  // 整页滚动监听 - 支持滚动和上拉加载
  function setupScrollListener() {
    let startY = 0
    let isLoading = false

    // 监听滚动事件（距离底部80px触发）
    const handleScroll = () => {
      if (isLoading) return

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight

      // 距离底部80px时加载
      if (scrollTop + clientHeight >= scrollHeight - 80) {
        isLoading = true
        loadMore().finally(() => {
          setTimeout(() => {
            isLoading = false
          }, 500) // 防抖500ms
        })
      }
    }

    // 监听触摸事件（上拉加载检测）
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].pageY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isLoading) return

      const currentY = e.touches[0].pageY
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight

      // 向上滑动（上拉）且接近底部
      if (currentY < startY && scrollTop + clientHeight >= scrollHeight - 100) {
        isLoading = true
        loadMore().finally(() => {
          setTimeout(() => {
            isLoading = false
          }, 500)
        })
      }
    }

    // 添加事件监听
    window.addEventListener('scroll', handleScroll)
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })

    // 组件卸载时移除监听
    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
    })
  }

  // ==================== 游戏和厂商点击处理 ====================
  function playGameHandler(gameItem: any) {
    checkLoginAndExecute(() => {
      if (gameItem.is_can_run === 0 || gameItem.is_can_run === '0' || gameItem.is_can_run === false) {
        showToast(t('home.gameInMaintenance'))
        return
      }

      if (gameItem.is_can_run === undefined || gameItem.is_can_run === null) {
        showToast(t('home.gameStatusError'))
        return
      }

      try {
        router.push({
          name: 'to_game',
          params: {
            game: gameItem.game_code,
            code: gameItem.supplier_code,
          },
          query: {
            mobile: mobileFunc() ? 1 : 0,
          }
        })
      } catch (error) {
        console.error('游戏跳转失败:', error)
        showToast(t('home.gameStartFailed'))
      }
    })
  }

  function selectSupplierHandler(supplier: any) {
    checkLoginAndExecute(() => {
      if (supplier.is_can_run === 0 || supplier.is_can_run === '0' || supplier.is_can_run === false) {
        showToast(t('home.supplierInMaintenance'))
        return
      }

      if (supplier.is_can_run === undefined || supplier.is_can_run === null) {
        showToast(t('home.supplierStatusError'))
        return
      }

      try {
        router.push({
          name: 'supplier',
          params: {
            supplier_code: supplier.code,
            category_code: supplier.category_code || currentGameType.value?.game_type || 'SLOT'
          },
          query: {
            supplier_name: supplier.name,
            supplier_id: supplier.id,
            currency_code: supplier.currency_code || 'CNY',
            is_can_run: supplier.is_can_run
          }
        })
      } catch (error) {
        console.error('厂商跳转失败:', error)
        showToast(t('home.navigationFailed'))
      }
    })
  }

  // ==================== 用户相关方法 ====================
  function signDailyHandler() {
    console.log(t('home.signInFeatureNotReady'))
  }

  function operatHandler(operationType: any) {
    checkLoginAndExecute(() => {
      router.push({ name: 'mine' })
    })
  }

  // ==================== Banner相关方法 ====================
  async function getBanners() {
    try {
      const resp: any = await api.bannerList({ group: 'mobile1' })
      if (resp && resp.data && Array.isArray(resp.data)) {
        banners.value = resp.data
      }
    } catch (error) {
      console.error(t('home.getBannerFailed') + ':', error)
    }
  }

  // ==================== 用户信息刷新 ====================
  async function refreshUserInfo() {
    if (!(store as any).isLogin()) {
      return
    }

    try {
      const resp: any = await api.getUserInfo()
      if (resp && resp.data) {
        (store as any).setUser(resp.data)
        if (isHotGameType.value && (activeHotTab.value === 'recent' || activeHotTab.value === 'favorite')) {
          if (activeHotTab.value === 'recent') {
            await getRecentGames(1, false)
          } else if (activeHotTab.value === 'favorite') {
            await getFavoriteGames(1, false)
          }
        }
      }
    } catch (error) {
      console.error(t('home.getUserInfoFailed') + ':', error)
    }
  }

  // ==================== 移动端检测函数 ====================
  function mobileFunc() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
  }

  // ==================== 初始化方法 ====================
  async function init() {
    try {
      (store as any).$patch({ loginShow: false, registerShow: false })
      ;(store as any).loading()

      // 初始化中奖列表
      initWinnerList()

      const promises = [
        getNotices(),
        getBanners(),
        getGameTypes(),
      ]

      await Promise.allSettled(promises)

      const hotGameType = gameTypes.value.find((type: any) => type.game_type === 'HOT')
      if (hotGameType) {
        currentGameType.value = hotGameType
        activeHotTab.value = 'hot'
        await getHotGames(1, false)
      } else if (gameTypes.value.length > 0) {
        const firstType = gameTypes.value[0]
        currentGameType.value = firstType
        if (firstType.game_type === 'HOT') {
          activeHotTab.value = 'hot'
          await getHotGames(1, false)
        } else {
          await getSuppliers(firstType.game_type, 1, false)
        }
      }

      if ((store as any).getUser()) {
        await refreshUserInfo()
      }

      nextTick(() => {
        setupScrollListener()
      })
    } catch (error) {
      console.error(t('home.homeInitFailed') + ':', error)
      showToast(t('home.pageLoadFailed'))
    } finally {
      ;(store as any).stopLoad()
    }
  }

  // ==================== 生命周期 ====================
  onMounted(() => {
    init()
  })
</script>

<style lang="less" scoped>
  .m-main {
    background: url('../../../assets/mobile/app/background.bmp') center/cover no-repeat, var(--color-m-background);
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;

    // Banner样式
    .my-swipe {
      background-color: #1989fa;
      height: 140px;

      .van-swipe-item {
        color: var(--m-label-gb);
        font-size: 20px;
        height: 200px;
        text-align: center;
        background-color: #39a9ed;
      }
    }

    // 通知栏样式
    .m-notice {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      border-bottom: 1px solid #f0f0f0;
      gap: 10px;

      .m-notice-icon {
        .van-badge__wrapper {
          color: white !important;
        }
      }

      .m-notice-content {
        flex: 1;
        height: 24px;
        overflow: hidden;

        .notice-swipe {
          height: 24px;

          .notice-text-wrapper {
            width: 100%;
            height: 24px;
            overflow: hidden;
            position: relative;
          }

          .notice-text {
            font-size: 14px;
            color: #fff;
            line-height: 24px;
            white-space: nowrap;
            display: inline-block;
          }

          .notice-text-scroll {
            animation: notice-scroll-left 15s linear infinite;

            &:hover {
              animation-play-state: paused;
            }
          }
        }
      }
    }

    // 通知栏文字滚动动画
    @keyframes notice-scroll-left {
      0% {
        transform: translateX(0);
      }

      100% {
        transform: translateX(-100%);
      }
    }

    // 用户信息区域样式
    .m-col {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 0 16px;
      color: var(--van-field-label-color);
      background: var(--color-m-background);
      box-shadow: 0 0.08rem 0.32rem 0 rgba(209, 221, 242, 0.4), 0 -0.05333rem 0 0 hsla(0, 0%, 100%, 0.5);
      border-radius: 0 0 0.13333rem 0.13333rem;

      .m-link {
        color: #3ea4f7;
        cursor: pointer;
        &:hover {
          color: #1989fa;
        }
      }
    }

    // 头部容器样式
    .m-header-container {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 50px;

      .m-logo-img {
        height: 40px;
        width: auto;
        max-width: 100px;
        flex-shrink: 0;
      }

      .m-user-section {
        flex: 1;
        min-width: 0;

        .m-row {
          height: 100%;
          margin: 0;
        }
      }
    }

    .m-col-top {
      height: 50px;

      .m-row {
        height: 50px;
      }
    }

    .m-row {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      height: 70px;
      font-size: 16px;

      .m-row-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        gap: 8px;
        cursor: pointer;
        transition: opacity 0.2s;

        &:hover {
          opacity: 0.8;
        }

        .m-img {
          width: 34px;
          height: 32px;
        }

        .m-label {
          color: #fff;
          font-size: 14px;
        }
      }

      .m-start {
        justify-content: flex-start;
      }

      .m-end {
        justify-content: flex-end;
      }
    }

    .m-user {
      gap: 10px;

      .m-user-name {
        color: #FFD700;
        font-weight: 500;
      }

      .m-user-level {
        height: 20px;
        background-image: url('../../../assets/mobile/level_bg.png');
        background-repeat: no-repeat;
        background-size: 100% 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 2px;
        padding: 0 5px;
        justify-content: flex-start;

        .m-img-bg {
          color: #fff;
          font-size: 14px;
        }

        .m-level-txt {
          color: #fff;
          font-size: 14px;
        }
      }

      .m-btn {
        height: 20px;
      }
    }

    // 余额行样式
    .m-balance-row {
      display: flex;
      align-items: center;
      gap: 8px;

      .m-balance-text {
        font-size: 16px;
        font-weight: 500;
        color: #FFD700;
      }

      .m-balance-actions {
        display: flex;
        align-items: center;
        gap: 8px;

        .m-action-btn {
          height: 24px;
          padding: 0 4px;
          font-size: 12px;
          border-radius: 4px;
          transition: all 0.2s ease;
          background: transparent !important;
          border: none !important;

          &:hover {
            opacity: 0.8;
          }

          &:active {
            transform: scale(0.95);
          }

          .m-refresh-img {
            width: 25px;
            height: 25px;
          }
        }
      }
    }

   /* ==================== 修复后的中奖信息区域样式 ==================== */
   .m-winner-section {
     margin: 8px 16px;
     background: url('/hot/d0.avif') no-repeat center;
     background-size: cover;
     background-position: center;
     background-repeat: no-repeat;
     border-radius: 12px;
     overflow: hidden;
     position: relative;
     padding: 16px 12px 20px 12px;

     .m-winner-scroll-container {
       height: 160px;
       overflow: hidden;
       position: relative;

       .m-winner-scroll-content {
         display: flex;
         flex-direction: row;
         gap: 8px;
         padding-top: 13%;
         /* 关键修复：确保动画正常工作 */
         animation: winner-scroll 30s linear infinite;
         width: max-content; /* 重要：确保内容宽度足够 */

         &:hover {
           animation-play-state: paused;
         }

         .m-winner-item {
           display: flex;
           flex-direction: column;
           align-items: center;
           gap: 4px;
           width: 80px;
           flex-shrink: 0;
           min-width: 0;

           .m-game-image {
             width: 100%;
             aspect-ratio: 1;
             border-radius: 8px;
             background: #f5f5f5;
             border: 2px solid rgba(255, 215, 0, 0.3);
             box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
           }

           .m-winner-username {
             font-size: 11px;
             color: #fff;
             font-weight: 400;
             text-align: center;
             line-height: 1.2;
             white-space: nowrap;
           }

           .m-winner-amount {
             font-size: 13px;
             font-weight: bold;
             color: #ffd700;
             text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
             line-height: 1.2;
           }
         }
       }
     }
   }

   /* 修复滚动动画 - 关键修改 */
   @keyframes winner-scroll {
     0% {
       transform: translateX(0);
     }
     100% {
       /* 滚动到第一组数据的开始位置 */
       transform: translateX(-50%);
     }
   }

    // 主内容区域样式
    .m-main-contain {
      display: flex;
      flex-direction: row;
      flex: none;
      background-color: var(--color-m-background);
      gap: 10px;
      padding-bottom: 60px;

      .m-con-left {
        display: flex;
        flex-direction: column;
        width: 70px;
        height: 100%;
        background-color: var(--color-m-background);

        .m-gameNav-container {
          padding-top: 10px;
          padding-bottom: 10px;

          .m-gameNav-item {
            width: 60px;
            height: 67.5px;
            background-image: var(--m-label-gb);
            box-shadow: 0 0.08rem 0.32rem 0 rgba(209, 221, 242, 0.5);
            font-size: 14px;
            transition: 0.35s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: var(--m-left-menu-color);
            cursor: pointer;

            .m-item-img {
              width: 24px;
              height: 24px;
              filter: brightness(1.8);
              transition: filter 0.3s ease;
            }

            .m-item-txt {
              font-size: 10px;
              color: rgba(255, 255, 255, 0.9);
              transition: color 0.3s ease;
            }

            &:hover {
              opacity: 0.8;
            }
          }

          .active {
            width: 60px;
            height: 67.5px;
            color: #fff;
            background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
            transition: all 0.3s ease;

            .m-item-img {
              filter: brightness(1);
            }

            .m-item-txt {
              color: #fff;
            }
          }
        }
      }

      .m-con-right {
        display: flex;
        flex-direction: column;
        flex: 1;

        .m-gameNav-container-list {
          padding: 10px 10px 10px 0px;

          // 热门游戏区域样式
          .m-hot-games-section {
            .m-hot-tabs {
              display: flex;
              color: #fff;
              border-radius: 8px;
              padding: 4px;
              margin-bottom: 12px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

              .m-hot-tab-item {
                flex: 1;
                text-align: center;
                padding: 8px 12px;
                font-size: 14px;
                font-weight: 500;
                color: #666;
                border-radius: 6px;
                transition: all 0.3s ease;
                cursor: pointer;

                &.active {
                  background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%);
                  color: #fff;
                  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
                }

                &:hover:not(.active) {
                  background: #f5f5f5;
                  color: #333;
                }
              }
            }

            .m-hot-content {
              .m-login-tip {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 40px 20px;

                .m-login-tip-content {
                  text-align: center;
                  color: #999;

                  p {
                    margin: 12px 0 16px 0;
                    font-size: 14px;
                  }
                }
              }
            }
          }

          // 热门游戏列表样式
          .m-content-games {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: space-between;
            padding: 0 4px;

            .m-game-item {
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              width: calc(33.333% - 6px);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              border-radius: 8px;
              padding: 5px;
              margin-bottom: 8px;
              cursor: pointer;
              transition: transform 0.2s, box-shadow 0.2s;

              &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              }

              .m-game-img {
                width: 100%;
                aspect-ratio: 1;
                border-radius: 6px;
                margin-bottom: 6px;
                background: #f5f5f5;
              }

              .m-game-name {
                color: #fff;
                font-size: 11px;
                text-align: center;
                font-weight: 400;
                line-height: 14px;
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .m-game-tag {
                position: absolute;
                top: 4px;
                right: 4px;
                font-size: 8px;
                color: #fff;
                background: #ff4444;
                border-radius: 8px;
                padding: 2px 4px;
                min-width: 12px;
                text-align: center;
              }

              .m-game-status {
                position: absolute;
                top: 4px;
                left: 4px;
                font-size: 8px;
                color: #fff;
                background: rgba(255, 0, 0, 0.9);
                border-radius: 8px;
                padding: 2px 4px;
                font-weight: 500;
                z-index: 2;
              }
            }
          }

          // 厂商列表样式
          .m-content-suppliers {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 0 4px;

            .m-supplier-item {
              position: relative;
              width: 100%;
              height: 120px;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              cursor: pointer;
              transition: transform 0.2s, box-shadow 0.2s;

              &:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
              }

              .m-supplier-img {
                width: 100%;
                height: 100%;
                border-radius: 12px;
              }

              .m-supplier-name {
                position: absolute;
                bottom: 8px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 14px;
                color: #fff;
                background: rgba(0, 0, 0, 0.6);
                border-radius: 6px;
                padding: 4px 8px;
                font-weight: 500;
                z-index: 2;
                max-width: calc(100% - 16px);
                text-align: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .m-supplier-status {
                position: absolute;
                top: 8px;
                right: 8px;
                font-size: 10px;
                color: #fff;
                background: rgba(255, 0, 0, 0.9);
                border-radius: 4px;
                padding: 2px 6px;
                font-weight: 500;
                z-index: 2;
              }
            }
          }

          // 加载状态样式
          .m-loading-more {
            width: 100%;
            text-align: center;
            padding: 20px;
            color: #999;
          }

          .m-no-more {
            width: 100%;
            text-align: center;
            padding: 20px;
            color: #999;
            font-size: 14px;
          }

          .m-empty {
            width: 100%;
            text-align: center;
            padding: 40px 20px;
          }
        }
      }

      .m-scroll-wrapper {
        position: relative;
        overflow-y: visible;

        .m-scroll-content {
          position: relative;

          .m-scroll-list-wrapper {
            overflow: visible;
          }
        }
      }
    }

    .m-main-footer {
      display: flex;
      height: 50px;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      z-index: 100;
    }
  }
</style>

<style lang="less">
  .m-main {
    /* Webkit浏览器(Chrome, Safari, Edge)滚动条隐藏 */
    ::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
    }

    /* Firefox浏览器滚动条隐藏 */
    scrollbar-width: none;

    /* 通用滚动条隐藏 */
    .m-scroll-wrapper {
      /* Firefox滚动条隐藏 */
      scrollbar-width: none;
      /* IE滚动条隐藏 */
      -ms-overflow-style: none;

      /* Webkit浏览器滚动条隐藏 */
      &::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
      }
    }
  }
</style>
