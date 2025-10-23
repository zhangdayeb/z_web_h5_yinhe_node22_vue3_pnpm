<template>
  <div class="m-language">
    <div class="m-current" @click="popLangHandler">
      <img :src="currLang.icon" :alt="currLang.label" class="m-lang" />
    </div>
    <van-popup v-model:show="langShow" position="top" class="m-lang-pop">
      <van-space wrap class="m-pop-space" :size="0">
        <div
          class="m-lang-item"
          v-for="(item, idx) in langList"
          :key="idx"
          @click.stop="selectLanguage(item)"
        >
          <van-image :src="item.icon" fit="contain" class="m-lang2"></van-image>
          <span class="m-lang-txt">{{ item.label }}</span>
        </div>
      </van-space>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getLanguage, setLanguage } from '@/lang'

import zhCnImg from '@/assets/mobile/lang/zh_cn.png'
import zhTwImg from '@/assets/mobile/lang/zh_tw.png'
import enUsImg from '@/assets/mobile/lang/en_us.png'
import thThImg from '@/assets/mobile/lang/th_th.png'
import viVnImg from '@/assets/mobile/lang/vi_vn.png'
import koKrImg from '@/assets/mobile/lang/ko_kr.png'

// 语言项类型定义
interface LanguageItem {
  icon: string
  lang: 'en-US' | 'zh-CN' | 'zh-TW' | 'th-TH' | 'vi-VN' | 'ko-KR'
  label: string
}

defineOptions({ name: 'LanguageVue' })

const langList = ref<LanguageItem[]>([
  { icon: zhCnImg, lang: 'zh-CN', label: '中文' },
  { icon: koKrImg, lang: 'ko-KR', label: '한국인' },
  { icon: enUsImg, lang: 'en-US', label: 'English' },
  { icon: thThImg, lang: 'th-TH', label: 'ภาษาไทย' },
  { icon: viVnImg, lang: 'vi-VN', label: 'ViệtName' },
  { icon: zhTwImg, lang: 'zh-TW', label: '繁體中文' },
])

const langShow = ref(false)

// 初始化语言 - 改用更简洁的方式
const initLang = (): LanguageItem => {
  const lang = getLanguage()
  const curr = langList.value.find(item => item.lang === lang)
  return curr || langList.value[0]
}

const currLang = ref(initLang())

function popLangHandler() {
  langShow.value = true
}

function selectLanguage(lang: LanguageItem) {
  langShow.value = false
  setLanguage(lang.lang)
  currLang.value = lang
  location.reload()
}
</script>

<style lang="less" scoped>
.m-language {
  position: fixed;
  right: 0;
  top: 40px;
  z-index: 90;
  .m-current {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 34px;
    height: 31px;
    background-color: hsla(0, 0%, 100%, 0.8);
    border-top-left-radius: 62px;
    border-bottom-left-radius: 62px;
    -webkit-animation: slideRight 0.35s ease;
    animation: slideRight 0.35s ease;

    .m-lang {
      width: 26px;
      height: 26px;
      margin-left: 3px;
    }
  }
  .m-lang-pop {
    padding: 16px;
    //height: 100vh;
    .m-pop-space {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      place-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-top: 10px;
      .m-lang-item {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 6px;

        .m-lang2 {
          width: 30px;
          height: 30px;
        }
        .m-lang-txt {
          font-size: 14px;
          color: var(--van-text-color);
        }
      }
    }
  }
}
</style>
