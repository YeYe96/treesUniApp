<template>
  <view class="container">
    <view class="header-simple">
      <text class="page-title">MY LETTERS</text>
      <view class="underline-short"></view>
    </view>

    <scroll-view scroll-y class="content-area">
      <view class="letter-list">
        <view v-for="item in myLetters" :key="item._id" class="letter-card">
          <view class="letter-body">
            <text class="letter-preview">{{ item.content }}</text>
          </view>
          <view class="letter-footer">
            <text class="date">{{ item.createTime }}</text>
            <view class="status">
              <text v-if="item.replyCount > 0">{{ item.replyCount }} 封回音</text>
              <text v-else>等待回音...</text>
            </view>
          </view>
        </view>

        <view v-if="myLetters.length === 0" class="empty-state">
          <text>窗边空空如也</text>
          <text>写下第一封信吧。</text>
        </view>
      </view>
    </scroll-view>

    <view class="fab" @tap="onFabClick">
      <text class="fab-text">+</text>
    </view>

    <view class="anim-connection-layer" v-if="isConnecting" @touchmove.stop.prevent>
      <view class="leaf-left">🍃</view>
      <view class="leaf-right">🍃</view>
      <view class="sapling-grow">🌱</view>
      <view class="connection-text">New Connection Established</view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      myLetters: [],
      isConnecting: false
    };
  },
  onShow() {
    this.fetchMyLetters();
  },
  methods: {
    async fetchMyLetters() {
      // #ifdef MP-WEIXIN
      try {
        const res = await wx.cloud.callFunction({
          name: 'getDeskTree'
        });
        if (res.result.code === 200) {
          this.myLetters = res.result.data.roots || [];
          return;
        }
      } catch (err) {
        // fall through
      }
      // #endif
      this.myLetters = [];
    },

    onFabClick() {
      uni.vibrateShort({ type: 'light' });
      uni.navigateTo({ url: '/pages/windowsill/editor' });
    },

    simulateNewConnection() {
      this.isConnecting = true;
      uni.vibrateShort({ type: 'medium' });

      setTimeout(() => {
        uni.vibrateShort({ type: 'heavy' });
      }, 1200);

      setTimeout(() => {
        this.isConnecting = false;
        uni.showToast({ title: '新笔友已连接', icon: 'none' });
      }, 3500);
    }
  }
};
</script>

<style scoped>
.container {
  padding: 0;
  height: 100vh;
  background-color: var(--paper-aged);
  display: flex;
  flex-direction: column;
}

.header-simple {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0 20rpx;
  background-color: var(--paper-aged);
}

.page-title {
  font-family: var(--font-sans);
  font-size: 28rpx;
  letter-spacing: 6rpx;
  color: var(--ink);
}

.underline-short {
  width: 80rpx;
  height: 2rpx;
  background-color: var(--moss);
  margin-top: 16rpx;
}

.content-area {
  flex: 1;
  padding: 40rpx;
  box-sizing: border-box;
}

.letter-list {
  padding-bottom: 200rpx;
}

.letter-card {
  background-color: rgba(255, 255, 255, 0.6);
  margin-bottom: 32rpx;
  padding: 32rpx;
  border-radius: 4rpx;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 2rpx 4rpx 10rpx rgba(0, 0, 0, 0.03);
}

.letter-preview {
  font-family: var(--font-serif);
  font-size: 30rpx;
  color: var(--ink);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  line-height: 1.8;
}

.letter-footer {
  margin-top: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-sans);
  font-size: 22rpx;
  color: var(--ink-light);
  opacity: 0.8;
}

.status {
  color: var(--moss);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 200rpx;
  opacity: 0.5;
}

.empty-state text {
  font-family: var(--font-serif);
  font-size: 30rpx;
  color: var(--ink-light);
  margin-bottom: 8rpx;
}

.fab {
  position: fixed;
  bottom: 60rpx;
  right: 48rpx;
  width: 100rpx;
  height: 100rpx;
  background-color: var(--rust);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(154, 78, 64, 0.4);
  transition: transform 0.1s ease;
  z-index: 100;
}

.fab:active {
  transform: scale(0.95);
}

.fab-text {
  color: #fff;
  font-size: 56rpx;
  font-weight: 300;
  margin-top: -6rpx;
}

.anim-connection-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.leaf-left,
.leaf-right {
  font-size: 80rpx;
  position: absolute;
  opacity: 0;
}

.leaf-left {
  animation: leafLeftIn 1.5s ease-out forwards;
}

.leaf-right {
  animation: leafRightIn 1.5s ease-out forwards;
}

.sapling-grow {
  font-size: 120rpx;
  opacity: 0;
  transform-origin: bottom center;
  animation: saplingGrow 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1.2s forwards;
}

.connection-text {
  margin-top: 60rpx;
  color: #fff;
  font-family: var(--font-serif);
  letter-spacing: 4rpx;
  font-size: 32rpx;
  opacity: 0;
  animation: fadeInText 1s ease 2s forwards;
}

@keyframes leafLeftIn {
  0% { transform: translate(-300rpx, -200rpx) rotate(-45deg); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translate(-20rpx, 0) rotate(0); opacity: 0; }
}

@keyframes leafRightIn {
  0% { transform: translate(300rpx, -200rpx) rotate(45deg); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translate(20rpx, 0) rotate(0); opacity: 0; }
}

@keyframes saplingGrow {
  0% { transform: scale(0); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fadeInText {
  to { opacity: 1; }
}
</style>
