<template>
  <view class="container">
    <view class="opening-scene" :class="isLoading ? '' : 'hidden'">
      <view class="seal-icon">🌿</view>
      <view class="loading-text">拆阅中...</view>
    </view>

    <view class="letter-container" :class="showContent ? 'fade-in' : ''">
      <scroll-view scroll-y class="paper-content">
        <view class="meta-info">
          <text class="date">{{ createTime }}</text>
          <text class="from">来自 远方</text>
        </view>

        <text class="content-text">{{ content }}</text>
      </scroll-view>

      <view class="action-bar">
        <view class="btn-archive" @tap="onArchive">收入案头</view>
        <view class="btn-reply" @tap="onReply">提笔回信</view>
      </view>
    </view>
  </view>
</template>

<script>
import { formatTime } from '@/utils/util';

export default {
  data() {
    return {
      letterId: '',
      content: '',
      createTime: '',
      isLoading: true,
      showContent: false
    };
  },
  onLoad(options) {
    if (options && options.id) {
      this.letterId = options.id;
      this.content = decodeURIComponent(options.content || '');
      this.createTime = formatTime(new Date(options.time || new Date()));
      setTimeout(() => {
        this.isLoading = false;
        this.showContent = true;
      }, 2000);
    }
  },
  methods: {
    onReply() {
      uni.vibrateShort({ type: 'light' });
      uni.navigateTo({
        url: `/pages/windowsill/editor?type=firstReply&to=${this.letterId}`
      });
    },
    onArchive() {
      uni.vibrateShort({ type: 'medium' });
      uni.showToast({
        title: '已收入案头',
        icon: 'success'
      });
      setTimeout(() => {
        uni.switchTab({ url: '/pages/desk/index' });
      }, 1500);
    }
  }
};
</script>

<style scoped>
.container {
  background-color: var(--color-bg-paper);
  height: 100vh;
  padding: 0;
  position: relative;
}

.opening-scene {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  background-color: var(--color-bg-paper);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: opacity 0.8s ease;
}

.opening-scene.hidden {
  opacity: 0;
  pointer-events: none;
}

.seal-icon {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: var(--spacing-lg);
  font-size: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s infinite ease-in-out;
}

.loading-text {
  font-size: 28rpx;
  color: var(--color-text-secondary);
  letter-spacing: 4rpx;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.letter-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transition: opacity 1s ease 0.5s;
}

.letter-container.fade-in {
  opacity: 1;
}

.paper-content {
  flex: 1;
  padding: var(--spacing-xl);
  box-sizing: border-box;
}

.meta-info {
  margin-bottom: var(--spacing-xl);
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: var(--color-text-secondary);
  border-bottom: 2rpx solid rgba(0, 0, 0, 0.05);
  padding-bottom: var(--spacing-sm);
}

.content-text {
  font-size: 32rpx;
  line-height: 1.8;
  color: var(--color-text-primary);
  white-space: pre-wrap;
}

.action-bar {
  padding: var(--spacing-md) var(--spacing-xl);
  padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom));
  display: flex;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.btn-archive,
.btn-reply {
  padding: 20rpx 40rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
}

.btn-archive {
  color: var(--color-text-secondary);
}

.btn-reply {
  background-color: var(--color-accent-rust);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(139, 69, 19, 0.3);
}
</style>
