<template>
  <view class="container page-postbox">
    <!-- Mist Layer -->
    <view class="mist-layer"></view>
    
    <view class="header-side">
      <view class="header-group">
        <text class="title-en">RECEIVER</text>
        <view class="divider-v"></view>
        <text class="title-cn">取信</text>
      </view>
    </view>

    <view class="ritual-content" :animation="ritualAnimation">
      <view class="input-section">
        <text class="code-label">ENTER KEY</text>
        
        <input
          class="code-input"
          placeholder-class="placeholder"
          :value="code"
          maxlength="6"
          confirm-type="go"
          @input="onInput"
          @confirm="onSubmit"
        />
        
        <view class="input-line" :class="code.length > 0 ? 'active' : ''"></view>

        <text class="instruction">Input the key to find a seed.</text>
      </view>

      <view class="action-section">
        <view class="btn-open" :class="code.length > 0 ? 'active' : ''" :animation="openBtnAnimation" @tap="onSubmit">
          <view class="geo-btn-inner">
            <text>FIND SEED</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Retrieval Animation Layer -->
    <view class="anim-retrieval-layer" v-if="isRetrieving" @touchmove.stop.prevent>
      <view class="falling-seed" :animation="retrievalSeedAnimation">
        <view class="seed-core"></view>
        <view class="seed-aura"></view>
      </view>
      <view class="retrieval-text" :animation="retrievalTextAnimation">Searching the forest...</view>
    </view>
  </view>
</template>

<script>
import { callCloudFunction } from '@/utils/cloud';
import { saveRoutePayload } from '@/utils/route-payload';

export default {
  data() {
    return {
      code: '',
      isRetrieving: false,
      ritualAnimation: {},
      openBtnAnimation: {},
      retrievalSeedAnimation: {},
      retrievalTextAnimation: {}
    };
  },
  onReady() {
    this.runIntroAnimation();
  },
  methods: {
    onInput(e) {
      this.code = (e.detail.value || '').trim().toUpperCase();
    },

    onSubmit() {
      if (!this.code) return;
      const tapAnim = uni.createAnimation({ duration: 120, timingFunction: 'ease-out' });
      tapAnim.scale(0.95).step().scale(1).step({ duration: 180 });
      this.openBtnAnimation = tapAnim.export();

      uni.vibrateShort({ type: 'light' });
      this.fetchLetter(this.code);
    },

    runIntroAnimation() {
      const intro = uni.createAnimation({ duration: 800, timingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)' });
      intro.opacity(0).translateY(40).step({ duration: 0 });
      intro.opacity(1).translateY(0).step();
      this.ritualAnimation = intro.export();
    },

    runRetrievalAnimation() {
      const seedAnim = uni.createAnimation({ duration: 1500, timingFunction: 'ease-in-out' });
      seedAnim.top('-20%').opacity(0).scale(0.5).step({ duration: 0 });
      seedAnim.top('50%').opacity(1).scale(1.2).step({ duration: 1000 });
      seedAnim.scale(1).step({ duration: 500 });
      this.retrievalSeedAnimation = seedAnim.export();

      const textAnim = uni.createAnimation({ duration: 800, timingFunction: 'ease-out' });
      textAnim.opacity(0).step({ duration: 0 });
      textAnim.opacity(1).step({ duration: 500, delay: 500 });
      this.retrievalTextAnimation = textAnim.export();
    },

    async fetchLetter(code) {
      this.isRetrieving = true;
      this.$nextTick(() => {
        this.runRetrievalAnimation();
      });
      uni.vibrateShort({ type: 'medium' });

      try {
        const fetchPromise = callCloudFunction('getLetter', { code });
        const animPromise = new Promise((resolve) => setTimeout(resolve, 2000));
        const [result] = await Promise.all([fetchPromise, animPromise]);

        if (result.code === 200) {
          const letter = result.data || {};
          const payloadKey = saveRoutePayload({
            letterId: letter._id,
            rootId: letter.rootId || '',
            content: letter.content,
            createTime: letter.createTime,
            fromAlias: letter.fromAlias || '',
            direction: letter.direction || ''
          });
          uni.vibrateShort({ type: 'light' });

          setTimeout(() => {
            this.isRetrieving = false;
            uni.navigateTo({
              url: `/pages/postbox/open/index?payloadKey=${payloadKey}`
            });
          }, 300);
        } else {
          this.isRetrieving = false;
          uni.showToast({ title: result.msg || 'Seed not found', icon: 'none' });
        }
      } catch (err) {
        this.isRetrieving = false;
        uni.showToast({ title: err.message || 'Connection lost', icon: 'none' });
      }
    }
  }
};
</script>

<style scoped>
.page-postbox {
  display: flex;
  flex-direction: row;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: var(--bg-mist);
}

.mist-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: radial-gradient(circle at 50% 30%, rgba(255,255,255,0.8) 0%, rgba(240,244,248,0.4) 60%, transparent 100%);
  z-index: 0;
}

.header-side {
  width: 120rpx;
  padding-top: 100rpx;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 10;
  border-right: 1px solid rgba(0,0,0,0.05);
}

.header-group {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.title-en {
  font-family: var(--font-sans);
  font-size: 20rpx;
  letter-spacing: 4rpx;
  color: var(--ui-primary);
  opacity: 0.5;
  transform: rotate(180deg);
  font-weight: bold;
}

.divider-v {
  width: 2rpx;
  height: 40rpx;
  background-color: var(--ui-primary);
  opacity: 0.3;
}

.title-cn {
  font-family: var(--font-serif);
  font-size: 32rpx;
  color: var(--ui-primary);
  font-weight: 600;
}

.ritual-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 10;
}

.input-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 100rpx;
}

.code-label {
  font-family: var(--font-sans);
  font-size: 20rpx;
  letter-spacing: 6rpx;
  color: var(--ui-primary);
  opacity: 0.5;
  margin-bottom: 40rpx;
  font-weight: bold;
}

.code-input {
  width: 400rpx;
  height: 100rpx;
  text-align: center;
  font-family: var(--font-sans);
  font-size: 60rpx;
  color: var(--ui-primary);
  letter-spacing: 12rpx;
  background: transparent;
  padding: 0;
  margin-bottom: 10rpx;
}

.input-line {
  width: 100rpx;
  height: 4rpx;
  background: var(--ui-primary);
  opacity: 0.2;
  transition: width 0.3s, opacity 0.3s;
  margin-bottom: 40rpx;
}

.input-line.active {
  width: 400rpx;
  opacity: 0.8;
}

.instruction {
  font-family: var(--font-sans);
  font-size: 20rpx;
  color: var(--ui-primary);
  opacity: 0.4;
  letter-spacing: 2rpx;
}

.action-section {
  display: flex;
  justify-content: center;
}

.btn-open {
  opacity: 0.5;
  pointer-events: none;
  transition: opacity 0.3s;
}

.btn-open.active {
  opacity: 1;
  pointer-events: auto;
}

.geo-btn-inner {
  padding: 20rpx 60rpx;
  border: 2rpx solid var(--ui-primary);
  border-radius: 4rpx;
  background: transparent;
  transition: all 0.2s;
}

.btn-open.active .geo-btn-inner {
  background: var(--ui-primary);
}

.geo-btn-inner text {
  font-family: var(--font-sans);
  font-size: 24rpx;
  letter-spacing: 4rpx;
  color: var(--ui-primary);
  font-weight: bold;
}

.btn-open.active .geo-btn-inner text {
  color: #fff;
}

/* Retrieval Animation */
.anim-retrieval-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.9);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.falling-seed {
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60rpx;
  height: 60rpx;
}

.seed-core {
  width: 100%;
  height: 100%;
  background: var(--leaf-you);
  transform: rotate(45deg);
  border-radius: 4rpx;
  box-shadow: 0 10rpx 40rpx rgba(42, 157, 143, 0.4);
}

.seed-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200%;
  height: 200%;
  transform: translate(-50%, -50%);
  border: 2rpx solid var(--leaf-you);
  border-radius: 50%;
  opacity: 0.2;
  animation: pulse 2s infinite;
}

.retrieval-text {
  margin-top: 100rpx;
  font-family: var(--font-sans);
  font-size: 24rpx;
  letter-spacing: 4rpx;
  color: var(--ui-primary);
  opacity: 0.6;
}

@keyframes pulse {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.2; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0; }
  100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.2; }
}
</style>
