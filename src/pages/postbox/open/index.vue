<template>
  <view class="container page-open">
    <view class="mist-layer"></view>

    <!-- The Blooming Animation -->
    <view class="opening-scene" :class="isLoading ? '' : 'hidden'">
      <view class="seed-wrapper" :animation="seedScaleAnim">
        <view class="geo-seed"></view>
        <view class="ring ring-1"></view>
        <view class="ring ring-2"></view>
      </view>
    </view>

    <!-- Content Card -->
    <view class="letter-container" :class="showContent ? 'fade-in' : ''">
      <view class="geo-card" :animation="cardAnimation">
        <scroll-view scroll-y class="card-scroll">
          <view class="card-inner">
            <view class="meta-header">
              <text class="date">{{ createTime }}</text>
              <view class="tag">FROM SOMEONE</view>
            </view>
            
            <view class="body-content">
              <text selectable>{{ content }}</text>
            </view>

            <view class="footer-gap"></view>
          </view>
        </scroll-view>

        <view class="action-bar" :animation="barAnimation">
          <view class="btn-archive" @tap="onArchive">
            <text>KEEP SEED</text>
          </view>
          <view class="btn-reply" @tap="onReply">
            <text>REPLY</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { formatTime } from '@/utils/util';
import { consumeRoutePayload } from '@/utils/route-payload';

export default {
  data() {
    return {
      letterId: '',
      rootId: '',
      content: '',
      createTime: '',
      isLoading: true,
      showContent: false,
      seedScaleAnim: {},
      cardAnimation: {},
      barAnimation: {}
    };
  },
  onLoad(options) {
    const payload = consumeRoutePayload(options.payloadKey);
    if (payload && payload.letterId) {
      this.letterId = payload.letterId;
      this.rootId = payload.rootId || '';
      this.content = payload.content || '';
      this.createTime = formatTime(new Date(payload.createTime || new Date()));
      
      // Start Animation
      this.$nextTick(() => {
        this.runBloomingSequence();
      });
      return;
    }

    this.isLoading = false;
    uni.showModal({
      title: '提示',
      content: '信件数据已失效，可返回上一页重试。',
      confirmText: '返回',
      showCancel: false,
      success: () => uni.navigateBack()
    });
  },
  methods: {
    runBloomingSequence() {
      // Step 1: Seed pulses and expands
      const seedAnim = uni.createAnimation({ duration: 1200, timingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)' });
      seedAnim.scale(1).rotate(0).step({ duration: 0 });
      seedAnim.scale(50).rotate(45).opacity(0).step({ duration: 1200 }); // Expands to fill screen
      this.seedScaleAnim = seedAnim.export();

      // Step 2: Reveal Content
      setTimeout(() => {
        this.isLoading = false;
        this.showContent = true;
        
        const cardAnim = uni.createAnimation({ duration: 800, timingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)' });
        cardAnim.opacity(0).scale(0.9).translateY(40).step({ duration: 0 });
        cardAnim.opacity(1).scale(1).translateY(0).step();
        this.cardAnimation = cardAnim.export();

        const barAnim = uni.createAnimation({ duration: 600, timingFunction: 'ease-out' });
        barAnim.opacity(0).translateY(20).step({ duration: 0 });
        barAnim.opacity(1).translateY(0).step({ delay: 300 });
        this.barAnimation = barAnim.export();
      }, 600);
    },

    onReply() {
      if (!this.letterId) return;
      uni.vibrateShort({ type: 'medium' });
      uni.navigateTo({
        url: `/pages/windowsill/editor?type=firstReply&to=${this.letterId}`
      });
    },
    
    onArchive() {
      uni.vibrateShort({ type: 'light' });
      uni.showToast({ title: 'Saved to Forest', icon: 'success' });
      setTimeout(() => {
        uni.switchTab({ url: '/pages/desk/index' });
      }, 1000);
    }
  }
};
</script>

<style scoped>
.page-open {
  background-color: var(--bg-mist);
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.mist-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 30%, rgba(255,255,255,0.9) 0%, rgba(240,244,248,0.5) 70%);
}

.opening-scene {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.opening-scene.hidden {
  opacity: 0;
  pointer-events: none;
}

.seed-wrapper {
  position: relative;
  width: 100rpx;
  height: 100rpx;
}

.geo-seed {
  width: 100%;
  height: 100%;
  background: var(--leaf-you);
  transform: rotate(45deg);
  border-radius: 4rpx;
}

.ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 4rpx solid var(--leaf-you);
  border-radius: 50%;
  opacity: 0.3;
}

.ring-1 { width: 140%; height: 140%; animation: pulseRing 2s infinite; }
.ring-2 { width: 220%; height: 220%; animation: pulseRing 2s infinite 0.5s; opacity: 0.1; }

@keyframes pulseRing {
  0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.3; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0; }
}

.letter-container {
  width: 100%;
  height: 100%;
  position: relative;
  opacity: 0;
  z-index: 10;
  padding: 40rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.letter-container.fade-in {
  opacity: 1;
}

.geo-card {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 4rpx;
  box-shadow: 0 30rpx 80rpx rgba(38, 70, 83, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  border-top: 8rpx solid var(--leaf-you);
}

.card-scroll {
  flex: 1;
  overflow: hidden;
}

.card-inner {
  padding: 60rpx;
}

.meta-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 60rpx;
  border-bottom: 2rpx solid rgba(0,0,0,0.05);
  padding-bottom: 30rpx;
}

.date {
  font-family: var(--font-sans);
  font-size: 20rpx;
  color: #999;
}

.tag {
  font-family: var(--font-sans);
  font-size: 20rpx;
  background: var(--leaf-you);
  color: #fff;
  padding: 8rpx 16rpx;
  border-radius: 4rpx;
  letter-spacing: 2rpx;
}

.body-content {
  font-family: var(--font-serif);
  font-size: 34rpx;
  line-height: 2;
  color: var(--ui-primary);
  white-space: pre-wrap;
}

.footer-gap {
  height: 100rpx;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  padding: 40rpx;
  background: rgba(240, 244, 248, 0.6);
  border-top: 1px solid rgba(0,0,0,0.05);
}

.btn-archive, .btn-reply {
  padding: 20rpx 40rpx;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.btn-archive text {
  font-family: var(--font-sans);
  font-size: 22rpx;
  color: #999;
  letter-spacing: 2rpx;
}

.btn-reply {
  border: 2rpx solid var(--leaf-you);
  border-radius: 4rpx;
}

.btn-reply text {
  font-family: var(--font-sans);
  font-size: 22rpx;
  color: var(--leaf-you);
  letter-spacing: 2rpx;
  font-weight: bold;
}

.btn-reply:active {
  background: var(--leaf-you);
}

.btn-reply:active text {
  color: #fff;
}
</style>
