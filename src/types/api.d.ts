// ========== 基础响应类型 ==========
export interface ApiResponse<T = any> {
  code: number
  message?: string
  data?: T
}

// ========== 系统配置 ==========
export interface SiteConfig {
  site_name?: string
  site_logo?: string
  site_title?: string
  site_keyword?: string
  site_description?: string
  customer_service_url?: string
  group_prefix?: string
  primary_color?: string
  [key: string]: any
}

// ========== 用户相关 ==========
export interface ApiUser {
  id: number
  name: string
  nickname?: string
  realname?: string
  phone?: string
  email?: string
  money: number
  level: number
  level_name?: string
  invite_code?: string
  status: number
  created_at: string
  updated_at: string
  [key: string]: any
}

// ========== 银行卡 ==========
export interface ApiMemberBank {
  id: number
  card_no: string
  bank_type: string
  bank_type_text?: string
  bank_address?: string
  owner_name: string
  phone?: string
  remark?: string
  created_at: string
  updated_at: string
}

// ========== 资金记录 ==========
export interface ApiMoneyLog {
  id: number
  member_id: number
  money: string
  money_before: string
  money_after: string
  money_type: string
  operate_type: number
  operate_type_text?: string
  money_type_text?: string
  description?: string
  remark?: string
  created_at: string
  updated_at: string
}

// ========== 充值/提现 ==========
export interface ApiPaymentItem {
  id: number
  type: string
  type_text?: string
  account: string
  name: string
  desc?: string
  qrcode?: string
  min: number
  max: number
  rate?: string
  is_open: number
  created_at: string
  updated_at: string
}

// ========== VIP等级 ==========
export interface ApiLevel {
  id: number
  level: number
  level_name: string
  deposit_money: string
  bet_money: string
  day_bonus?: string
  week_bonus?: string
  month_bonus?: string
  year_bonus?: string
  level_bonus?: string
  created_at: string
  updated_at: string
}

// ========== 游戏相关 ==========
export interface ApiGame {
  id: number
  api_name: string
  name: string
  en_name?: string
  game_type: number
  game_code: string
  img_url: string
  full_image_url?: string
  platform?: string
  is_open: number
  weight: number
  tags?: string
  created_at: string
  updated_at: string
}

export interface ApiGameType {
  key: number
  value: string
}

// ========== 通知公告 ==========
export interface ApiNotice {
  id?: number
  title: string
  content: string
  url?: string
  type?: string
  created_at?: string
  updated_at?: string
}

// ========== Banner ==========
export interface ApiBanner {
  id?: number
  title: string
  url: string
  jump_link?: string
  is_new_window?: number
  weight?: number
  created_at?: string
  updated_at?: string
}

// ========== 分页数据 ==========
export interface ApiPageData<T = any> {
  current_page?: number
  total?: number
  per_page?: number
  last_page?: number
  data: T[]
}

// ========== 活动文章 ==========
export interface ApiActivity {
  id: number
  title: string
  content: string
  type?: string
  img_url?: string
  start_time?: string
  end_time?: string
  is_open?: number
  created_at: string
  updated_at: string
}

export interface ApiArticle {
  id: number
  title: string
  content: string
  type?: string
  author?: string
  view_count?: number
  created_at: string
  updated_at: string
}
