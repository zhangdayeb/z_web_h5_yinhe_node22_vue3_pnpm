import { createI18n } from 'vue-i18n'
import { Locale } from 'vant'

// 导入 Vant 语言包
import vantZhCN from 'vant/es/locale/lang/zh-CN'
import vantZhTW from 'vant/es/locale/lang/zh-TW'
import vantEnUS from 'vant/es/locale/lang/en-US'
import vantThTH from 'vant/es/locale/lang/th-TH'
import vantViVN from 'vant/es/locale/lang/vi-VN'
import vantKoKR from 'vant/es/locale/lang/ko-KR'

// 导入语言包文件
import zhCNLocale from './zh-CN.json'
import zhTWLocale from './zh-TW.json'
import enUSLocale from './en-US.json'
import thTHLocale from './th-TH.json'
import viVNLocale from './vi-VN.json'
import koKRLocale from './ko-KR.json'

// 语言类型
export type Language = 'zh-CN' | 'zh-TW' | 'en-US' | 'th-TH' | 'vi-VN' | 'ko-KR'

// 默认语言
const DEFAULT_LANG: Language = 'zh-CN'

// Vant 语言映射
const vantLocaleMap = {
  'zh-CN': vantZhCN,
  'zh-TW': vantZhTW,
  'en-US': vantEnUS,
  'th-TH': vantThTH,
  'vi-VN': vantViVN,
  'ko-KR': vantKoKR,
}

// 消息映射
const messages = {
  'zh-CN': zhCNLocale,
  'zh-TW': zhTWLocale,
  'en-US': enUSLocale,
  'th-TH': thTHLocale,
  'vi-VN': viVNLocale,
  'ko-KR': koKRLocale,
}

// 获取语言
export function getLanguage(): Language {
  const saved = localStorage.getItem('lang') as Language
  if (saved && messages[saved]) {
    return saved
  }
  return DEFAULT_LANG
}

// 设置语言
export function setLanguage(lang: Language) {
  localStorage.setItem('lang', lang)
  i18n.global.locale.value = lang

  // 设置 Vant 语言
  const vantLocale = vantLocaleMap[lang]
  if (vantLocale) {
    Locale.use(lang, vantLocale)
  }

  window.dispatchEvent(new CustomEvent('language-change', { detail: lang }))
}

// 获取 Vant 语言配置
export function getVantLocale() {
  const lang = getLanguage()
  return vantLocaleMap[lang] || vantZhCN
}

// 获取服务端语言代码
export function getServerLanguage(): string {
  const lang = getLanguage()
  const serverLangMap: Record<Language, string> = {
    'zh-CN': 'zh',
    'zh-TW': 'hk',
    'en-US': 'en',
    'th-TH': 'th',
    'vi-VN': 'vi',
    'ko-KR': 'ko',
  }
  return serverLangMap[lang] || 'zh'
}

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false,
  locale: getLanguage(),
  fallbackLocale: DEFAULT_LANG,
  messages,
})

// 初始化时设置 Vant 语言
const initialLang = getLanguage()
const initialVantLocale = vantLocaleMap[initialLang]
if (initialVantLocale) {
  Locale.use(initialLang, initialVantLocale)
}

// 翻译函数快捷方式
export const t = i18n.global.t

export default i18n
