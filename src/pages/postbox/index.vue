<template>
  <view class="container page-postbox">
    <view class="header-side">
      <view class="header-group">
        <text class="title-en">THE POSTBOX</text>
        <view class="divider-v"></view>
        <text class="title-cn">Retrieval Ritual</text>
        <text class="cycle-tag">CYCLE 4: WAITING</text>
      </view>
    </view>

    <view class="ritual-content">
      <view class="decoration-area">
        <view class="decor-icon left">🌿</view>
        <view class="decor-icon right">🌿</view>
      </view>

      <view class="input-section">
        <text class="code-label">C O D E</text>
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

        <text class="instruction">Enter the code inscribed on the\nfallen leaf to reveal its message.</text>
      </view>

      <view class="action-section">
        <view class="leaf-mark">🍃</view>

        <view class="btn-open" :class="code.length > 0 ? 'active' : ''" @tap="onSubmit">
          <text>OPEN SEAL</text>
          <view class="icon-arrow">→</view>
        </view>
      </view>
    </view>

    <view class="anim-retrieval-layer" v-if="isRetrieving" @touchmove.stop.prevent>
      <view class="falling-envelope">
        <view class="envelope-back"></view>
        <view class="envelope-seal">🌿</view>
      </view>
      <view class="retrieval-text">Fetching from afar...</view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      code: '',
      isRetrieving: false
    };
  },
  methods: {
    onInput(e) {
      this.code = (e.detail.value || '').trim().toUpperCase();
    },

    onSubmit() {
      if (!this.code) return;
      uni.vibrateShort({ type: 'light' });
      this.fetchLetter(this.code);
    },

    async fetchLetter(code) {
      this.isRetrieving = true;
      uni.vibrateShort({ type: 'medium' });

      try {
        const fetchPromise = new Promise((resolve, reject) => {
          // #ifdef MP-WEIXIN
          try {
            if (!wx.cloud) {
              reject(new Error('云能力未初始化'));
              return;
            }
            wx.cloud.callFunction({
              name: 'getLetter',
              data: { code }
              success: resolve,
              fail: reject
            });
          } catch (err) {
            reject(err);
          }
          // #endif
          // #ifndef MP-WEIXIN
          reject(new Error('当前平台不支持云函数'));
          // #endif
        });

        const animPromise = new Promise((resolve) => setTimeout(resolve, 2500));
        const [res] = await Promise.all([fetchPromise, animPromise]);

        if (res.result.code === 200) {
          const letter = res.result.data;
          uni.vibrateShort({ type: 'light' });

          setTimeout(() => {
            this.isRetrieving = false;
            uni.navigateTo({
              url: `/pages/postbox/open/index?id=${letter._id}&content=${encodeURIComponent(letter.content)}&time=${letter.createTime}`
            });
          }, 500);
        } else {
          this.isRetrieving = false;
          uni.showToast({
            title: '查无此信',
            icon: 'none'
          });
        }
      } catch (err) {
        this.isRetrieving = false;
        uni.showToast({
          title: '取信失败',
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
