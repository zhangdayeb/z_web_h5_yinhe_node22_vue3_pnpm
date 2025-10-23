import 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    // 自定义配置
    noNeedToken?: boolean  // 不需要token
    noNeedTip?: boolean    // 不需要错误提示
    showLoading?: boolean  // 显示loading
    [key: string]: any
  }
}
