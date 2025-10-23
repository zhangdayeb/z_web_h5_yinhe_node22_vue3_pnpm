<template>
  <div class="mobile-register" >
    <!-- 顶部导航栏 -->
    <van-nav-bar
      :title="$t('user.register')"
      left-arrow
      placeholder
      class="register-navbar"
      @click-left="handleBack"
    />

    <!-- 注册内容区域 -->
    <div class="register-content">
      <!-- 简洁注册头部 -->
      <div class="register-header">
        <h2 class="register-title">{{ $t('register.createAccount') }}</h2>
        <p class="register-subtitle">{{ $t('register.fillInfoToComplete') }}</p>
      </div>

      <!-- 注册表单 -->
      <div class="register-form">
        <van-form ref="registerFormRef" @submit="handleRegister">
          <!-- 用户名 -->
          <van-field
            v-model="frm.name"
            name="name"
            :label="$t('form.username')"
            :placeholder="$t('form.enterUsername')"
            left-icon="contact"
            clearable
            :rules="[
              { required: true, message: $t('form.enterUsername') },
              { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: $t('register.usernameFormat') }
            ]"
          />

          <!-- 登录密码 -->
          <van-field
            v-model="frm.password"
            type="password"
            name="password"
            :label="$t('form.loginPassword')"
            :placeholder="$t('form.enterLoginPassword')"
            left-icon="lock"
            :rules="[
              { required: true, message: $t('form.enterLoginPassword') },
              { pattern: /^.{6,20}$/, message: $t('register.passwordFormat') }
            ]"
          />

          <!-- 确认密码 -->
          <van-field
            v-model="frm.password_confirmation"
            type="password"
            name="password_confirmation"
            :label="$t('form.confirmPassword')"
            :placeholder="$t('form.enterPasswordAgain')"
            left-icon="lock"
            :rules="[
              { required: true, message: $t('form.enterPasswordAgain') },
              { validator: validatePasswordConfirm }
            ]"
          />

          <!-- 真实姓名（条件显示） -->
          <van-field
            v-if="isRealNameRequired"
            v-model="frm.realname"
            name="realname"
            :label="$t('form.realName')"
            :placeholder="$t('form.enterRealName')"
            left-icon="manager-o"
            clearable
            :rules="[
              { required: isRealNameRequired, message: $t('form.enterRealName') },
              { pattern: /^[\u4e00-\u9fa5a-zA-Z\s]{2,20}$/, message: $t('register.realNameFormat') }
            ]"
          />

          <!-- 提现密码 -->
          <van-field
            v-model="frm.qk_pwd"
            type="password"
            name="qk_pwd"
            :label="$t('form.withdrawPassword')"
            :placeholder="$t('form.enterWithdrawPassword')"
            left-icon="key-o"
            :rules="[
              { required: true, message: $t('form.enterWithdrawPassword') },
              { pattern: /^\d{6,20}$/, message: $t('register.withdrawPwdFormat') }
            ]"
          />

          <!-- 手机号码（条件显示） -->
          <van-field
            v-if="isPhoneRequired"
            v-model="frm.phone"
            name="phone"
            :label="$t('form.phoneNumber')"
            :placeholder="$t('form.enterPhoneNumber')"
            left-icon="phone-o"
            clearable
            :rules="[
              { required: isPhoneRequired, message: $t('form.enterPhoneNumber') },
              { pattern: /^1[3-9]\d{9}$/, message: $t('register.phoneFormat') }
            ]"
          />

          <!-- 货币选择 -->
          <van-field
            v-model="currencyDisplay"
            name="currency"
            :label="$t('form.currencyType')"
            :placeholder="$t('form.selectCurrency')"
            left-icon="gold-coin-o"
            readonly
            is-link
            @click="showCurrencyPicker = true"
            :rules="[{ required: true, message: $t('form.selectCurrency') }]"
          />

          <!-- 邀请码 -->
          <van-field
            v-model="frm.invite_code as string"
            name="invite_code"
            :label="$t('form.inviteCode')"
            :placeholder="$t('form.enterInviteCode')"
            left-icon="gift-o"
            clearable
          />

          <!-- 验证码（条件显示） -->
          <van-field
            v-if="isCaptchaRequired"
            v-model="frm.captcha"
            name="captcha"
            :label="$t('form.captcha')"
            :placeholder="$t('form.enterCaptcha')"
            left-icon="shield-o"
            clearable
            :rules="[
              { required: isCaptchaRequired, message: $t('form.enterCaptcha') },
              { pattern: /^[a-zA-Z0-9]{4}$/, message: $t('register.captchaFormat') }
            ]"
          >
            <template #button>
              <div class="captcha-image" @click="refreshCaptcha">
                <img
                  v-if="captchaImg"
                  :src="captchaImg"
                  alt="验证码"
                  class="captcha-img"
                />
                <div v-else class="captcha-loading">
                  <van-icon name="refresh" size="16" />
                  <span>{{ $t('register.clickRefresh') }}</span>
                </div>
              </div>
            </template>
          </van-field>

          <!-- 注册按钮 -->
          <div class="form-footer">
            <van-button
              type="primary"
              size="large"
              :loading="isSubmitting"
              native-type="submit"
              block
              round
              class="register-btn"
            >
              {{ isSubmitting ? $t('register.registerInProgress') : $t('register.immediateRegister') }}
            </van-button>
          </div>
        </van-form>
      </div>

      <!-- 底部链接 -->
      <div class="register-footer">
        <div class="footer-links">
          <span class="footer-text">{{ $t('register.alreadyHaveAccount') }}</span>
          <van-button
            type="default"
            size="small"
            plain
            @click="goToLogin"
          >
            {{ $t('user.login') }}
          </van-button>
        </div>
      </div>
    </div>

    <!-- 货币选择器 -->
    <van-popup v-model:show="showCurrencyPicker" position="bottom">
      <van-picker
        :columns="currencyColumns"
        @confirm="onCurrencyConfirm"
        @cancel="showCurrencyPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import api from '@/api'

defineOptions({ name: 'MobileRegister' })

const store: any = useAppStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const registerFormRef = ref()

// 状态
const captchaImg = ref('')
const isSubmitting = ref(false)
const showCurrencyPicker = ref(false)

// 货币选项
const currencyOptions = [
  { text: `¥ CNY 【${t('currency.cny')}】`, value: 'CNY', lang: 'zh_cn' },
  { text: `$ USD 【${t('currency.usd')}】`, value: 'USD', lang: 'en' },
  { text: `HK$ HKD 【港币】`, value: 'HKD', lang: 'zh_hk' },
  { text: `€ EUR 【${t('currency.eur')}】`, value: 'EUR', lang: 'en' },
  { text: `£ GBP 【英镑】`, value: 'GBP', lang: 'en' },
  { text: `¥ JPY 【${t('currency.jpy')}】`, value: 'JPY', lang: 'ja' },
  { text: `₩ KRW 【${t('currency.krw')}】`, value: 'KRW', lang: 'ko' },
  { text: `฿ THB 【${t('currency.thb')}】`, value: 'THB', lang: 'th' },
  { text: `₫ VND 【${t('currency.vnd')}】`, value: 'VND', lang: 'vi' },
  { text: `S$ SGD 【${t('currency.sgd')}】`, value: 'SGD', lang: 'en' },
]

const currencyColumns = ref(currencyOptions)

const currencyIndex = ref<number>(0)
const currencyDisplay = computed(() => currencyColumns.value[currencyIndex.value]?.text || '')

// 获取邀请码的通用函数
const getInvitationCodeFromUrl = () => {
  const queryParams = route.query || {}
  const routeParams = route.params || {}

  // 优先级顺序：invite_code > agent_code > invite
  const inviteCode = queryParams.invite_code ||
                     queryParams.agent_code ||
                     queryParams.invite ||
                     routeParams.invite_code ||
                     routeParams.agent_code ||
                     routeParams.invite ||
                     ''

  // 开发环境下打印调试信息
  if (import.meta.env.DEV) {
    console.log('移动端邀请码参数检测:', {
      fullUrl: window.location.href,
      query: queryParams,
      params: routeParams,
      detectedInviteCode: inviteCode,
      supportedParams: ['invite_code', 'agent_code', 'invite']
    })
  }

  return inviteCode
}

// 表单数据
const frm = ref({
  name: '',
  password: '',
  password_confirmation: '',
  realname: '',
  qk_pwd: '',
  phone: '',
  currency: currencyOptions[0].value,  // 使用新结构
  captcha: '',
  key: '',
  invite_code: getInvitationCodeFromUrl(),
  lang: currencyOptions[0].lang,  // 使用新结构
  register_site: '',
  sms_code: '',
})

// 监听路由变化，动态更新邀请码
watch(
  () => route.query,
  (newQuery) => {
    const newInviteCode = getInvitationCodeFromUrl()
    if (newInviteCode && newInviteCode !== frm.value.invite_code) {
      frm.value.invite_code = newInviteCode
      console.log('移动端检测到新的邀请码:', newInviteCode)
    }
  },
  { deep: true }
)

// 计算属性：是否需要显示某些字段
const isRealNameRequired = computed(() => {
  return (store.registerConf?.register_setting_json?.isRealNameRequred ?? 0) === '1'
})

const isPhoneRequired = computed(() => {
  return (store.registerConf?.register_setting_json?.isPhoneRequired ?? 0) === '1'
})

const isCaptchaRequired = computed(() => {
  return (store.registerConf?.register_setting_json?.isCaptchaRequired ?? 0) === '1'
})

// 返回登录页面
function handleBack() {
  router.push('/')
}

// 跳转登录页面
function goToLogin() {
  router.push('/')
}

// 确认密码验证
function validatePasswordConfirm(value: string) {
  if (!value) {
    return t('form.enterPasswordAgain')
  }
  if (value !== frm.value.password) {
    return t('register.passwordNotMatch')
  }
  return true
}

// 货币选择确认
function onCurrencyConfirm({ selectedValues }: { selectedValues: string[] }) {
  const selectedOption = currencyColumns.value.find(item => item.value === selectedValues[0])
  if (selectedOption) {
    currencyIndex.value = currencyColumns.value.indexOf(selectedOption)
    frm.value.currency = selectedOption.value  // 使用 value 作为货币代码
    frm.value.lang = selectedOption.lang
  }
  showCurrencyPicker.value = false
}

// 刷新验证码
async function refreshCaptcha() {
  try {
    if (!isCaptchaRequired.value) {
      return
    }
    const resp: any = await api.authCaptcha()
    if (resp && resp.code === 200 && resp.data) {
      captchaImg.value = resp.data?.img ?? ''
      frm.value.key = resp.data?.key
    }
  } catch (err) {
    console.log('获取验证码失败:', err)
    showToast('验证码获取失败')
  }
}

// 提交注册
async function handleRegister() {
  if (isSubmitting.value) return

  isSubmitting.value = true

  try {
    // 更新表单中的货币和语言信息
    frm.value.lang = currencyColumns.value[currencyIndex.value].lang

    const registerData = {
      ...frm.value,
      invitation_code: frm.value.invite_code,
      currency: currencyColumns.value[currencyIndex.value].value,
    }

    const resp: any = await api.register(registerData)

    if (resp && resp.code === 200) {
      if (resp.token) {
        store.setToken(resp.token)
        await store.getMeForApi()
      }

      showToast(resp.message || t('common.success'))
      router.replace('/')
    } else {
      showToast(resp?.message || t('common.operationFailed'))
    }
  } catch (err: any) {
    console.error('注册错误:', err)
    showToast(err?.message || err?.error?.message || t('common.operationFailed'))
  } finally {
    isSubmitting.value = false
  }
}

// 初始化
async function init() {
  await refreshCaptcha()
}

onMounted(async () => {
  init()
})
</script>

<style lang="less" scoped>
.mobile-register {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);

  // 顶部导航栏
  .register-navbar {
    // background: white;
    // border-bottom: 1px solid #ebedf0;

    // :deep(.van-nav-bar__title) {
    //   color: #323233;
    //   font-weight: 600;
    //   font-size: 16px;
    // }

    // :deep(.van-nav-bar__left .van-icon) {
    //   color: #323233;
    //   font-size: 18px;
    // }
    background: transparent !important;
  }

  // 注册内容区域
  .register-content {
    padding: 20px 16px 16px;
    min-height: calc(100vh - 46px);
    display: flex;
    flex-direction: column;
    .register-header {
      flex: 0 0 auto;
      padding: 20px 0 24px;
      text-align: center;

      .register-title {
        font-size: 24px;
        font-weight: 600;
        color: #323233;
        margin: 0 0 8px 0;
      }

      .register-subtitle {
        font-size: 14px;
        color: #969799;
        margin: 0;
      }
    }

    .register-form {
      flex: 1;
      // background: white;
      background: transparent !important;
      border-radius: 12px;
      padding: 24px 16px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      :deep(.van-cell) {
        padding: 12px 0;
        background: transparent;
      }

      :deep(.van-field__label) {
        width: 70px;
        color: #323233;
        font-weight: 500;
        font-size: 14px;
      }

      :deep(.van-field__control) {
        font-size: 14px;
        color: #323233;
        background: transparent;
      }

      :deep(.van-field__left-icon) {
        color: #969799;
        margin-right: 8px;
      }

      .captcha-image {
        width: 100px;
        height: 32px;
        border: 1px solid #ebedf0;
        border-radius: 4px;
        overflow: hidden;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f7f8fa;

        .captcha-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .captcha-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          font-size: 10px;
          color: #969799;
        }
      }

      .form-footer {
        margin-top: 24px;

        .register-btn {
          height: 44px;
          font-size: 15px;
          font-weight: 500;

          &:active {
            opacity: 0.8;
          }
        }
      }
    }

    .register-footer {
      flex: 0 0 auto;
      padding: 16px 0;

      .footer-links {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;

        .footer-text {
          color: #646566;
          font-size: 14px;
        }

        .van-button {
          background: white;
          border: 1px solid #ebedf0;
          color: #1989fa;

          &:active {
            background: #f7f8fa;
          }
        }
      }
    }
  }
}

// 小屏幕适配
@media (max-width: 320px) {
  .mobile-register {
    .register-content {
      padding: 16px 12px 12px;

      .register-header {
        padding: 16px 0 20px;

        .register-title {
          font-size: 20px;
        }

        .register-subtitle {
          font-size: 13px;
        }
      }

      .register-form {
        padding: 20px 12px;
        margin-bottom: 12px;

        :deep(.van-cell) {
          padding: 10px 0;
        }

        :deep(.van-field__label) {
          width: 65px;
          font-size: 13px;
        }

        :deep(.van-field__control) {
          font-size: 13px;
        }

        .form-footer .register-btn {
          height: 42px;
          font-size: 14px;
        }
      }
    }
  }
}

// 横屏适配
@media (orientation: landscape) and (max-height: 500px) {
  .mobile-register {
    .register-content {
      .register-header {
        padding: 12px 0 16px;

        .register-title {
          font-size: 20px;
          margin-bottom: 4px;
        }

        .register-subtitle {
          font-size: 13px;
        }
      }

      .register-form {
        margin-bottom: 8px;
        padding: 16px;
      }
    }
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .mobile-register {
    background: #1a1a1a;

    .register-navbar {
      background: #2d2d2d;
      border-color: #404040;

      :deep(.van-nav-bar__title) {
        color: #ffffff;
      }

      :deep(.van-nav-bar__left .van-icon) {
        color: #ffffff;
      }
    }

    .register-content {
      .register-header {
        .register-title {
          color: #ffffff;
        }

        .register-subtitle {
          color: #a0a0a0;
        }
      }

      .register-form {
        background: #2d2d2d;

        :deep(.van-field__label) {
          color: #ffffff;
        }

        :deep(.van-field__control) {
          color: #ffffff;
        }

        :deep(.van-field__control::placeholder) {
          color: #a0a0a0;
        }

        :deep(.van-cell) {
          border-color: #404040;
        }

        .captcha-image {
          background: #3a3a3a;
          border-color: #404040;

          .captcha-loading {
            color: #a0a0a0;
          }
        }
      }

      .register-footer {
        .footer-links {
          .footer-text {
            color: #a0a0a0;
          }

          .van-button {
            background: #2d2d2d;
            border-color: #404040;
            color: #1989fa;

            &:active {
              background: #3a3a3a;
            }
          }
        }
      }
    }
  }
}
.mobile-register{
  color: #e5e7eb;
  background-image: url('@/assets/mobile/app/background.bmp');
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  background-color: var(--color-m-background);
}

.van-form {

    padding: 24px 20px 16px;
    // background-image: url('@/assets/mobile/home/dly.png');
    :deep(.van-cell) {
      padding: 16px;
      border-radius: 12px;
      border-bottom: none;
      margin-bottom: 16px;
       background: rgba(0, 0, 0, 0.3)!important;
      }
  }
</style>
