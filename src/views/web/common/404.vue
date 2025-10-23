<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <!-- 404 插图 -->
      <div class="error-illustration">
        <van-icon name="warning-o" size="80" />
      </div>

      <!-- 错误代码 -->
      <div class="error-code">404</div>

      <!-- 错误信息 -->
      <div class="error-message">{{ $t('common.pageNotFound') }}</div>
      <div class="error-desc">{{ $t('common.pageNotFoundDesc') }}</div>

      <!-- 操作按钮 -->
      <div class="actions">
        <van-button
          type="primary"
          size="large"
          round
          block
          @click="goHome"
          class="action-btn primary-btn"
        >
          <van-icon name="home-o" />
          {{ $t('common.backToHome') }}
        </van-button>

        <van-button
          type="default"
          size="large"
          round
          block
          @click="goBack"
          class="action-btn secondary-btn"
        >
          <van-icon name="arrow-left" />
          {{ $t('common.backToPrevious') }}
        </van-button>
      </div>

      <!-- 底部装饰 -->
      <div class="decoration">
        <div class="floating-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

defineOptions({ name: 'NotFoundPage' })

const router = useRouter()

// 返回首页
const goHome = () => {
  router.push('/')
}

// 返回上一页
const goBack = () => {
  router.back()
}
</script>

<style scoped lang="less">
.not-found-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  padding: 20px;
  box-sizing: border-box;

  // 背景装饰
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.05)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.08)"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grain)"/></svg>') repeat;
    animation: float 20s ease-in-out infinite;
  }

  .not-found-content {
    text-align: center;
    padding: 40px 20px;
    max-width: 320px;
    width: 100%;
    position: relative;
    z-index: 1;

    .error-illustration {
      margin-bottom: 20px;
      animation: bounce 2s ease-in-out infinite;

      .van-icon {
        color: rgba(255, 255, 255, 0.9);
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
      }
    }

    .error-code {
      font-size: 72px;
      font-weight: 700;
      color: #fff;
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      margin-bottom: 16px;
      letter-spacing: -2px;
      animation: pulse 3s ease-in-out infinite;
    }

    .error-message {
      font-size: 22px;
      color: #fff;
      margin-bottom: 8px;
      font-weight: 600;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .error-desc {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 40px;
      line-height: 1.5;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 30px;

      .action-btn {
        height: 48px;
        font-size: 16px;
        font-weight: 500;
        transition: all 0.3s;
        border: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

        .van-icon {
          margin-right: 8px;
        }

        &.primary-btn {
          background: linear-gradient(45deg, #ff6b6b, #ff8e8e);

          &:active {
            transform: translateY(1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          }
        }

        &.secondary-btn {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);

          &:active {
            transform: translateY(1px);
            background: rgba(255, 255, 255, 0.1);
          }
        }
      }
    }

    .decoration {
      .floating-dots {
        display: flex;
        justify-content: center;
        gap: 8px;

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          animation: floating 2s ease-in-out infinite;

          &:nth-child(1) { animation-delay: 0s; }
          &:nth-child(2) { animation-delay: 0.3s; }
          &:nth-child(3) { animation-delay: 0.6s; }
        }
      }
    }
  }
}

// 动画效果
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes floating {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-8px);
    opacity: 0.8;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateX(0) translateY(0);
  }
  33% {
    transform: translateX(30px) translateY(-30px);
  }
  66% {
    transform: translateX(-20px) translateY(20px);
  }
}

// 小屏幕优化
@media (max-width: 320px) {
  .not-found-container {
    padding: 16px;

    .not-found-content {
      padding: 30px 16px;

      .error-code {
        font-size: 60px;
      }

      .error-message {
        font-size: 18px;
      }

      .error-desc {
        font-size: 13px;
      }

      .actions .action-btn {
        height: 44px;
        font-size: 15px;
      }
    }
  }
}

// 超大屏幕（移动端横屏）
@media (min-width: 768px) and (max-height: 500px) {
  .not-found-container {
    .not-found-content {
      max-width: 400px;
      padding: 20px;

      .error-code {
        font-size: 60px;
        margin-bottom: 12px;
      }

      .error-message {
        font-size: 20px;
        margin-bottom: 6px;
      }

      .error-desc {
        font-size: 13px;
        margin-bottom: 30px;
      }

      .actions {
        flex-direction: row;
        gap: 12px;

        .action-btn {
          height: 44px;
        }
      }
    }
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .not-found-container {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);

    .not-found-content {
      .actions .action-btn.secondary-btn {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.15);

        &:active {
          background: rgba(255, 255, 255, 0.05);
        }
      }
    }
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .not-found-container {
    .not-found-content {
      .error-code,
      .error-message {
        text-shadow: 2px 2px 0 #000;
      }

      .actions .action-btn {
        border: 2px solid rgba(255, 255, 255, 0.5);
      }
    }
  }
}
</style>
