<template>
  <div class="m-tab-bar">
    <van-tabbar
      v-model="active"
      :safe-area-inset-bottom="true"
      :before-change="tabChangeHandler"
      >
      <template v-for="(item, idx) in tabList" :key="idx">
        <van-tabbar-item :to="item.url">
          <span class="m-tab-txt">{{ $t(item.label) }}</span>
          <template #icon>
            <img :src="getImage(item, active, idx)" class="m-tab-icon" />
          </template>
        </van-tabbar-item>
      </template>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'TabBar' })
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import backgroundImg from '@/assets/mobile/home/botton_b.png'

// Tab项类型定义
interface TabItem {
  icon: string
  url: string
  label: string
}

const router = useRouter()
const route = useRoute()
const active = ref(0)
const tabList = ref<TabItem[]>([
  { icon: 'main', url: '/', label: 'main.index' },
  { icon: 'gift', url: '/gift', label: 'main.gift' },
  { icon: 'kf', url: '/kf', label: 'main.kf' },
  { icon: 'mine', url: '/mine', label: 'main.mine' },
])

// Tab切换处理函数 - 添加类型注解
const tabChangeHandler = (n: number | string): boolean => {
  switch (n) {
    case 0:
      router.push({ name: 'main' })
      break
    case 1:
      router.push({ name: 'gift' })
      break
    case 2:
      router.push({ name: 'kf' })
      break
    case 3:
      router.push({ name: 'mine' })
      break
    default:
      break
  }
  return true
}

// 图片资源映射
const images = import.meta.glob('@/assets/mobile/tabbar/*.png', { eager: true })

// 获取图片函数 - 添加类型注解和改进实现
const getImage = (item: TabItem, active: number, idx: number): string => {
  const imagePath = active === idx
    ? `/src/assets/mobile/tabbar/${item.icon}.act.png`
    : `/src/assets/mobile/tabbar/${item.icon}.png`

  const imageModule = images[imagePath] as { default: string } | undefined
  return imageModule?.default || imagePath
}

// 初始化当前激活的tab - 改用更简洁的方式
const initActiveTab = (): number => {
  const currentTabIndex = tabList.value.findIndex(item => item.url === route.path)
  return currentTabIndex >= 0 ? currentTabIndex : 0
}

onMounted(() => {
  active.value = initActiveTab()
})
</script>

<style lang="less" scoped>
.m-tab-bar {
  .m-tab-txt {
    font-size: 10px;
  }
  .m-tab-icon {
    width: 25px;
    height: 25px;
  }
}
</style>

<!-- 全局样式，不使用 scoped -->
<style lang="less">
.van-tabbar {
  color: #e5e7eb;
  background-image: url('@/assets/mobile/home/botton_b.png');
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  background-color: var(--color-m-background);
}
</style>
<style scoped>
.van-tabbar-item {
   color: #ffffff82;
  background: transparent !important;
  --van-tabbar-item-icon-margin-bottom: 1px; /* 调整图标和文本之间的间距 */
}
.van-tabbar-item--active{
  color: #fff;
}
</style>
