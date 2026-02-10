<template>
  <view class="container page-postbox">
    <view class="header-side">
      <view class="header-group">
        <text class="title-en">取信邮箱</text>
        <view class="divider-v"></view>
        <text class="title-cn">输入取信码</text>
        <text class="cycle-tag">查看来信</text>
      </view>
    </view>

    <view class="ritual-content" :animation="ritualAnimation">
      <view class="decoration-area">
        <view class="decor-icon left">🌿</view>
        <view class="decor-icon right">🌿</view>
      </view>

      <view class="input-section">
        <text class="code-label">取 信 码</text>
        <view class="underline-deco"></view>

        <input
          class="code-input"
          placeholder=""
          :value="code"
          maxlength="6"
          confirm-type="go"
          @input="onInput"
          @confirm="onSubmit"
        />

        <text class="instruction">输入对方分享给你的取信码，
即可拆阅信件。</text>
      </view>

      <view class="action-section">
        <view class="leaf-mark">🍃</view>

        <view class="btn-open" :class="code.length > 0 ? 'active' : ''" :animation="openBtnAnimation" @tap="onSubmit">
          <text>拆 开 信 封</text>
          <view class="icon-arrow">→</view>
        </view>
      </view>
    </view>

    <view class="anim-retrieval-layer" v-if="isRetrieving" @touchmove.stop.prevent>
      <view class="falling-envelope" :animation="retrievalEnvelopeAnimation">
        <view class="envelope-back"></view>
        <view class="envelope-seal">🌿</view>
      </view>
      <view class="retrieval-text" :animation="retrievalTextAnimation">正在取信...</view>
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
      retrievalEnvelopeAnimation: {},
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
      tapAnim.scale(0.94).step().scale(1).step({ duration: 180 });
      this.openBtnAnimation = tapAnim.export();

      uni.vibrateShort({ type: 'light' });
      this.fetchLetter(this.code);
    },


    runIntroAnimation() {
      const intro = uni.createAnimation({ duration: 700, timingFunction: 'ease-out' });
      intro.opacity(0).translateY(36).step({ duration: 0 });
      intro.opacity(1).translateY(0).step();
      this.ritualAnimation = intro.export();
    },

    runRetrievalAnimation() {
      const envelopeAnim = uni.createAnimation({ duration: 900, timingFunction: 'ease-in-out' });
      envelopeAnim.opacity(0).translateY(-20).scale(0.86).step({ duration: 0 });
      envelopeAnim.opacity(1).translateY(0).scale(1).step();
      this.retrievalEnvelopeAnimation = envelopeAnim.export();

      const textAnim = uni.createAnimation({ duration: 700, timingFunction: 'ease-in-out' });
      textAnim.opacity(0).step({ duration: 0 });
      textAnim.opacity(1).step({ duration: 500, delay: 260 });
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
        const animPromise = new Promise((resolve) => setTimeout(resolve, 2500));
        const [result] = await Promise.all([fetchPromise, animPromise]);

        if (result.code === 200) {
          const letter = result.data || {};
          const payloadKey = saveRoutePayload({
            letterId: letter._id,
            content: letter.content,
            createTime: letter.createTime
          });
          uni.vibrateShort({ type: 'light' });

          setTimeout(() => {
            this.isRetrieving = false;
            uni.navigateTo({
              url: `/pages/postbox/open/index?payloadKey=${payloadKey}`
            });
          }, 500);
        } else {
          this.isRetrieving = false;
          uni.showToast({
            title: result.msg || '查无此信',
            icon: 'none'
          });
        }
      } catch (err) {
        this.isRetrieving = false;
        uni.showToast({
          title: err.message || '取信失败',
          icon: 'none'
        });
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
  overflow: hidden;
}

.header-side {
  width: 140rpx;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 100rpx;
  display: flex;
  justify-content: center;
}

.header-group {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.title-en {
  font-family: var(--font-sans);
  font-size: 24rpx;
  letter-spacing: 6rpx;
  color: var(--trunk);
  font-weight: bold;
  transform: rotate(180deg);
}

.title-cn {
  font-family: var(--font-serif);
  font-size: 36rpx;
  color: var(--trunk);
  font-style: italic;
  font-weight: 500;
}

.divider-v {
  width: 2rpx;
  height: 60rpx;
  background-color: var(--sage);
}

.cycle-tag {
  font-size: 18rpx;
  color: var(--sage);
  letter-spacing: 2rpx;
  margin-top: 20rpx;
}

.ritual-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.decoration-area {
  display: flex;
  justify-content: space-between;
  width: 60%;
  margin-bottom: 80rpx;
  opacity: 0.5;
}

.decor-icon {
  font-size: 40rpx;
  color: var(--ink-light);
}

.input-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-bottom: 120rpx;
}

.code-label {
  font-family: var(--font-serif);
  font-size: 48rpx;
  letter-spacing: 12rpx;
  color: var(--sage);
  font-style: italic;
  margin-bottom: 20rpx;
}

.underline-deco {
  width: 200rpx;
  height: 2rpx;
  background: var(--sage);
  margin-bottom: 40rpx;
}

.code-input {
  width: 300rpx;
  height: 80rpx;
  text-align: center;
  font-family: var(--font-sans);
  font-size: 40rpx;
  color: var(--ink);
  letter-spacing: 8rpx;
  border-bottom: 1px dashed var(--ink-light);
  margin-bottom: 40rpx;
}

.instruction {
  font-family: var(--font-serif);
  font-size: 24rpx;
  color: var(--ink-light);
  text-align: center;
  line-height: 1.6;
  font-style: italic;
}

.action-section {
  display: flex;
  align-items: center;
  gap: 30rpx;
  width: 100%;
  padding-left: 40rpx;
}

.leaf-mark {
  font-size: 32rpx;
  opacity: 0.6;
}

.btn-open {
  border: 1px solid var(--trunk);
  border-radius: 40rpx;
  padding: 20rpx 60rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  font-family: var(--font-sans);
  font-size: 24rpx;
  letter-spacing: 4rpx;
  color: var(--trunk);
  opacity: 0.5;
  transition: all 0.3s;
}

.btn-open.active {
  background-color: var(--trunk);
  color: var(--paper-light);
  opacity: 1;
}

.icon-arrow {
  font-size: 24rpx;
}

.anim-retrieval-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  perspective: 1000px;
}

.falling-envelope {
  width: 400rpx;
  height: 280rpx;
  background-color: #f2efe9;
  box-shadow: 0 20rpx 50rpx rgba(0, 0, 0, 0.3);
  position: relative;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fallDown 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

.envelope-seal {
  font-size: 60rpx;
  text-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.2);
}

.retrieval-text {
  margin-top: 100rpx;
  color: #fff;
  font-family: var(--font-serif);
  font-style: italic;
  opacity: 0;
  animation: fadeIn 0.5s ease 0.5s forwards;
  letter-spacing: 4rpx;
}

@keyframes fallDown {
  0% { transform: translateY(-120vh) rotate(15deg) scale(0.5); opacity: 0; }
  30% { transform: translateY(-20vh) rotate(-10deg) scale(0.8); opacity: 1; }
  60% { transform: translateY(5vh) rotate(5deg) scale(0.9); }
  80% { transform: translateY(-2vh) rotate(-2deg) scale(0.95); }
  100% { transform: translateY(0) rotate(0) scale(1); opacity: 1; }
}

@keyframes fadeIn {
  to { opacity: 0.8; }
}
</style>
