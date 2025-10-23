// 导出所有API类型
export * from './api'

// Vue全局属性扩展
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $filters: {
      formatMoney: (value: number | string) => string
      formatDate: (value: string | Date) => string
    }
  }
}

// 环境变量类型
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
