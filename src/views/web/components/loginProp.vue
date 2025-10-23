<template>
  <van-popup
    v-model:show="visible"
    position="center"
    round
    :close-on-click-overlay="true"
    :style="{ width: '90%', maxWidth: '400px' }"
  >
    <div class="login-popup">
      <!-- 头部 -->
      <div class="login-header">
        <h3 class="login-title">{{ $t('login.loginTitle') }}</h3>
        <van-icon
          name="cross"
          class="close-icon"
          @click="closePopup"
        />
      </div>

      <!-- 登录表单 -->
      <div class="login-form">
        <van-form @submit="handleLogin">
          <!-- 用户名 -->
          <van-field
            v-model="loginForm.username"
            name="username"
            :label="$t('login.username')"
            :placeholder="$t('login.enterUsername')"
            left-icon="user-o"
            clearable
            :rules="[
              { required: true, message: $t('login.usernameRequired') },
              { pattern: /^.{3,20}$/, message: $t('login.usernameLength') }
            ]"
          />

          <!-- 密码 -->
          <van-field
            v-model="loginForm.password"
            type="password"
            name="password"
            :label="$t('login.password')"
            :placeholder="$t('login.enterPassword')"
            left-icon="lock"
            :rules="[
              { required: true, message: $t('login.passwordRequired') },
              { pattern: /^.{6,20}$/, message: $t('login.passwordLength') }
            ]"
          />

          <!-- 登录按钮 -->
          <div class="form-actions">
            <van-button
              type="primary"
              size="large"
              :loading="loading"
              native-type="submit"
              block
              round
              class="login-btn"
            >
              {{ loading ? $t('login.loggingIn') : $t('login.login') }}
            </van-button>
          </div>
        </van-form>
      </div>

      <!-- 底部操作 -->
      <div class="login-footer">
        <div class="footer-actions">
          <van-button
            type="default"
            plain
            size="small"
            @click="handleForgotPassword"
          >
            {{ $t('login.forgetPwd') }}
          </van-button>
          <van-button
            type="primary"
            plain
            size="small"
            @click="goToRegister"
          >
            {{ $t('login.registerNow') }}
          </van-button>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import api from '@/api'

defineOptions({ name: 'LoginProp' })

const props = defineProps<{
  modelValue?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'login-success': []
  'show-register': []
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

// 登录表单
const loginForm = reactive({
  username: '',
  password: ''
})

// 加载状态
const loading = ref(false)

// 关闭弹窗
const closePopup = () => {
  visible.value = false
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

// 登录处理
const handleLogin = async () => {
  loading.value = true

  try {
    const params = {
      name: loginForm.username,
      password: loginForm.password
    }

    const res: any = await api.login(params)

    if (res?.code === 200 || res?.code === 1 || res?.code === 0) {
      const {
        access_token,
        simple_token,
        x_token,
        user_info
      } = res.data || {}

      if (!access_token) {
        showToast(t('user.loginNoToken'))
        return
      }

      // 存储双Token
      const finalSimpleToken = x_token || simple_token
      storeTokens(access_token, finalSimpleToken)

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

      // 成功提示
      showToast(t('login.loginSuccessWelcome'))

      // 关闭弹窗并触发成功事件
      visible.value = false
      emit('login-success')

      // 重置表单
      loginForm.username = ''
      loginForm.password = ''

    } else {
      showToast(res?.message || t('login.loginFailed'))
    }
  } catch (error: any) {
    console.error('Login process error:', error)
    showToast(error?.message || t('login.loginError'))
    clearTokens()
  } finally {
    loading.value = false
  }
}

// 忘记密码
const handleForgotPassword = () => {
  showToast(t('login.resetpwdForCustomer'))
}

// 修复注册页面跳转
const goToRegister = () => {
  visible.value = false
  // 触发显示注册弹窗事件
  emit('show-register')
}
</script>

<style lang="less" scoped>


  // 深色主题适配
  @media (prefers-color-scheme: dark) {
    .login-popup {
      .login-header {
        // background: #2c2c2c;
        color: #fff;
        // border-color: #404040;

        .close-icon {
          color: #999;

          &:hover {
            color: #fff;
          }
        }
      }

      .login-form {
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

      .login-footer {
        // border-color: #404040;
      }
    }
  }

.login-popup {
  padding: 0;
  //background: white;
  border-radius: 12px;
  overflow: hidden;
  background-image: url('@/assets/mobile/app/dly.bmp') !important;
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  background-color: #1a1a1a;
  .login-header {
    position: relative;
    padding: 20px;
    //background: #fff;
    color: #333;
    text-align: center;
    // border-bottom: 1px solid #f5f5f5;

    .login-title {
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

  .login-form {
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
      .login-btn {
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
      :deep(.login-btn) {
        background-color: transparent !important;
        background-image: url('@/assets/mobile/home/btn.png') !important;
        background-size: cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
        border: none !important;
      }
    }
  }

  .login-footer {
    padding: 16px 20px 24px;
    border-top: 1px solid #f5f5f5;

    .footer-actions {
      display: flex;
      justify-content: space-between;
      gap: 16px;

      .van-button {
        flex: 1;
        height: 36px;
        font-size: 14px;

        &:first-child {
          color: #666;
          border-color: #d9d9d9;

          &:active {
            background: #f5f5f5;
          }
        }

        &:last-child {
          color: #1989fa;
          border-color: #1989fa;

          &:active {
            // background: rgba(25, 137, 250, 0.1);
          }
        }
      }
    }
  }
}


</style>
