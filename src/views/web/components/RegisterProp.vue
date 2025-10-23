<template>
  <van-popup
    v-model:show="visible"
    position="center"
    round
    :close-on-click-overlay="true"
    :style="{ width: '90%', maxWidth: '400px' }"
  >
    <div class="register-popup">
      <!-- 头部 -->
      <div class="register-header">
        <h3 class="register-title">{{ $t('register.createAccount') }}</h3>
        <van-icon
          name="cross"
          class="close-icon"
          @click="closePopup"
        />
      </div>

      <!-- 注册表单 -->
      <div class="register-form">
        <van-form @submit="handleRegister">
          <!-- 用户名 -->
          <van-field
            v-model="registerForm.name"
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
            v-model="registerForm.password"
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
            v-model="registerForm.password_confirmation"
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

          <!-- 提现密码 -->
          <van-field
            v-model="registerForm.qk_pwd"
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
            v-model="registerForm.invite_code"
            name="invite_code"
            :label="$t('form.inviteCode')"
            :placeholder="$t('form.enterInviteCode')"
            left-icon="gift-o"
            clearable
          />

          <!-- 注册按钮 -->
          <div class="form-actions">
            <van-button
              type="primary"
              size="large"
              :loading="loading"
              native-type="submit"
              block
              round
              class="register-btn"
            >
              {{ loading ? $t('register.registerInProgress') : $t('register.immediateRegister') }}
            </van-button>
          </div>
        </van-form>
      </div>

      <!-- 底部操作 -->
      <div class="register-footer">
        <div class="footer-actions">
          <span class="footer-text">{{ $t('register.alreadyHaveAccount') }}</span>
          <van-button
            type="primary"
            plain
            size="small"
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
  </van-popup>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import api from '@/api'

defineOptions({ name: 'RegisterProp' })

const props = defineProps<{
  modelValue?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'register-success': []
  'show-login': []
}>()

const router = useRouter()
const { t } = useI18n()
const appStore = useAppStore()

// 控制弹窗显示
const visible = ref(props.modelValue)

// 监听props变化
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
})

// 监听visible变化，同步到父组件
watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 货币选项
const currencyOptions = [
  { text: `¥ CNY 【人民币】`, value: 'CNY', lang: 'zh_cn' },
  { text: `$ USD 【美元】`, value: 'USD', lang: 'en' },
  { text: `HK$ HKD 【港币】`, value: 'HKD', lang: 'zh_hk' },
  { text: `€ EUR 【欧元】`, value: 'EUR', lang: 'en' },
  { text: `£ GBP 【英镑】`, value: 'GBP', lang: 'en' },
  { text: `¥ JPY 【日元】`, value: 'JPY', lang: 'ja' },
  { text: `₩ KRW 【韩元】`, value: 'KRW', lang: 'ko' },
  { text: `฿ THB 【泰铢】`, value: 'THB', lang: 'th' },
  { text: `₫ VND 【越南盾】`, value: 'VND', lang: 'vi' },
  { text: `S$ SGD 【新加坡元】`, value: 'SGD', lang: 'en' },
]

const currencyColumns = ref(currencyOptions)

const currencyIndex = ref<number>(0)
const currencyDisplay = computed(() => currencyColumns.value[currencyIndex.value]?.text || '')
const showCurrencyPicker = ref(false)

// 注册表单
const registerForm = reactive({
  name: '',
  password: '',
  password_confirmation: '',
  qk_pwd: '',
  invite_code: '',
  currency: currencyOptions[0].value,  // 使用新结构
  lang: currencyOptions[0].lang,  // 使用新结构
})

// 加载状态
const loading = ref(false)

// 关闭弹窗
const closePopup = () => {
  visible.value = false
}

// 确认密码验证
const validatePasswordConfirm = (value: string) => {
  if (!value) {
    return t('form.enterPasswordAgain')
  }
  if (value !== registerForm.password) {
    return t('register.passwordNotMatch')
  }
  return true
}

// 货币选择确认
const onCurrencyConfirm = ({ selectedValues }: { selectedValues: string[] }) => {
  const selectedOption = currencyColumns.value.find(item => item.value === selectedValues[0])
  if (selectedOption) {
    currencyIndex.value = currencyColumns.value.indexOf(selectedOption)
    registerForm.currency = selectedOption.value  // 使用 value 作为货币代码
    registerForm.lang = selectedOption.lang
  }
  showCurrencyPicker.value = false
}

// 存储Token到localStorage
const storeTokens = (jwtToken: string, simpleToken?: string) => {
  try {
    localStorage.setItem('access_token', jwtToken)
    console.log('JWT Token存储成功:', jwtToken.substring(0, 20) + '...')

    if (simpleToken) {
      localStorage.setItem('X-Token', simpleToken)
      console.log('Simple Token存储成功:', simpleToken.substring(0, 8) + '...')
    } else {
      localStorage.removeItem('X-Token')
      console.log('未收到Simple Token，已清除旧值')
    }

    appStore.setToken(jwtToken)
  } catch (error) {
    console.error('Token存储失败:', error)
    throw error
  }
}

// 清除Token
const clearTokens = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('X-Token')
  console.log('所有Token已清除')
}

// 注册处理
const handleRegister = async () => {
  loading.value = true

  try {
    const registerData = {
      name: registerForm.name,
      password: registerForm.password,
      password_confirmation: registerForm.password_confirmation,
      qk_pwd: registerForm.qk_pwd,
      invitation_code: registerForm.invite_code,
      currency: registerForm.currency,
      lang: registerForm.lang,
    }

    const res: any = await api.register(registerData)

    if (res?.code === 200 || res?.code === 1 || res?.code === 0) {
      const {
        access_token,
        simple_token,
        x_token,
        token,
        user_info
      } = res.data || {}

      // 处理token（可能在不同字段中）
      const finalToken = access_token || token
      if (finalToken) {
        const finalSimpleToken = x_token || simple_token
        storeTokens(finalToken, finalSimpleToken)

        // 设置用户信息
        if (user_info) {
          const userForStore = {
            id: user_info.id,
            name: user_info.name,
            nick_name: user_info.nick_name,
            money: user_info.money,
            money_rebate: user_info.money_rebate || 0,
            level: user_info.vip_grade,
            vip_grade: user_info.vip_grade || 0,
            status: user_info.status || 1,
            created_at: user_info.created_at || '',
            updated_at: user_info.updated_at || ''
          }

          appStore.setUser(userForStore)
          console.log('用户信息设置成功:', userForStore)
        }
      }

      // 成功提示
      showToast(res.message || t('register.registerSuccess'))

      // 关闭弹窗并触发成功事件
      visible.value = false
      emit('register-success')

      // 重置表单
      Object.assign(registerForm, {
        name: '',
        password: '',
        password_confirmation: '',
        qk_pwd: '',
        invite_code: '',
        currency: currencyOptions[0].value,
        lang: currencyOptions[0].lang,
      })

    } else {
      showToast(res?.message || t('register.registerFailed'))
    }
  } catch (error: any) {
    console.error('Register process error:', error)
    showToast(error?.message || t('register.registerError'))
    clearTokens()
  } finally {
    loading.value = false
  }
}

// 跳转到登录
const goToLogin = () => {
  visible.value = false
  // 触发显示登录弹窗事件
  emit('show-login')
}
</script>

<style lang="less" scoped>
// 深色主题适配
@media (prefers-color-scheme: dark) {
  .register-popup {
    .register-header {
      color: #fff;

      .close-icon {
        color: #999;

        &:hover {
          color: #fff;
        }
      }
    }

    .register-form {
      :deep(.van-field__label) {
        color: rgba(255, 255, 255, 0.9);
      }

      :deep(.van-field__control) {
        color: rgba(255, 255, 255, 0.95);
        background: transparent;

        &::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
      }

      :deep(.van-cell) {
        background: rgba(0, 0, 0, 0.3);
      }

      :deep(.van-field__left-icon) {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
}

.register-popup {
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
  background-image: url('@/assets/mobile/app/dly.bmp') !important;
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  background-color: #1a1a1a;

  .register-header {
    position: relative;
    padding: 20px;
    color: #333;
    text-align: center;

    .register-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #fff;
    }

    .close-icon {
      position: absolute;
      top: 20px;
      right: 20px;
      font-size: 18px;
      cursor: pointer;
      color: #999;
      transition: color 0.2s;

      &:hover {
        color: #333;
      }
    }
  }

  .register-form {
    padding: 24px 20px 16px;

    :deep(.van-cell) {
      padding: 16px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      border-bottom: none;
      margin-bottom: 16px;

      &:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }
    }

    :deep(.van-field__label) {
      width: 80px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
    }

    :deep(.van-field__control) {
      font-size: 15px;
      color: rgba(255, 255, 255, 0.95);
      background: transparent;

      &::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }
    }

    :deep(.van-field__left-icon) {
      color: rgba(255, 255, 255, 0.8);
      margin-right: 8px;
    }

    .form-actions {
      margin-top: 24px;
      .register-btn {
        height: 44px;
        font-size: 16px;
        font-weight: 500;
        background-image: url('@/assets/mobile/home/btn.png');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        border: none;

        :deep(.van-button__content) {
          position: relative;
          z-index: 1;
        }

        &:active {
          transform: translateY(1px);
        }
      }

      // 覆盖 Vant 按钮的默认背景色
      :deep(.register-btn) {
        background-color: transparent !important;
        background-image: url('@/assets/mobile/home/btn.png') !important;
        background-size: cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
        border: none !important;
      }
    }
  }

  .register-footer {
    padding: 16px 20px 24px;
    border-top: 1px solid #f5f5f5;

    .footer-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;

      .footer-text {
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
      }

      .van-button {
        height: 32px;
        font-size: 14px;
        color: #1989fa;
        border-color: #1989fa;

        &:active {
          background: rgba(25, 137, 250, 0.1);
        }
      }
    }
  }
}
</style>