<template>
  <view class="container page-editor" :style="{ backgroundColor: textures[bgIndex] }">
    <view class="editor-header">
      <view class="header-line">
        <text class="label">{{ headerLabel }}</text>
        <text class="date">{{ currentDate }}</text>
      </view>
    </view>

    <textarea
      class="letter-input"
      :placeholder="placeholder"
      placeholder-class="placeholder-style"
      :maxlength="maxLen"
      :value="content"
      auto-focus
      :show-confirm-bar="false"
      @input="onInput"
    ></textarea>

    <view class="editor-footer">
      <view class="texture-selector">
        <view
          v-for="(item, index) in textures"
          :key="item"
          class="dot"
          :class="bgIndex === index ? 'selected' : ''"
          :style="{ backgroundColor: item }"
          @tap="onSelectTexture(index)"
        ></view>
      </view>
      <view class="btn-seal" :class="content.length > 0 ? 'active' : ''" @tap="onSubmit">
        <text>{{ submitBtnText }}</text>
      </view>
    </view>

    <view class="animation-layer" v-if="isSealing" @touchmove.stop.prevent>
      <view class="anim-paper" :class="step >= 1 ? 'folding' : ''" :style="{ backgroundColor: textures[bgIndex] }"></view>

      <view class="anim-envelope" v-if="step >= 2" :class="step >= 4 ? 'flying' : ''">
        <view class="anim-wax-drop" v-if="step === 2" :class="step === 2 ? 'dropping' : ''"></view>
        <view class="anim-stamp" v-if="step === 3" :class="step === 3 ? 'pressing' : ''">
          <view class="stamp-body"></view>
        </view>
        <view class="anim-seal-result" v-if="step >= 3">🌿</view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      content: '',
      bgIndex: 0,
      maxLen: 1000,
      currentDate: '',
      textures: ['#f4f6f3', '#f0e6d2', '#e0e0e0'],
      isSealing: false,
      step: 0,
      mode: 'root',
      replyTo: '',
      recipientName: '',
      headerLabel: 'FROM: THE WINDOWSILL',
      placeholder: 'Sowing the seed...',
      submitBtnText: 'SEAL'
    };
  },
  onLoad(options) {
    const { type, to, name } = options || {};
    let mode = 'root';
    let headerLabel = 'FROM: THE WINDOWSILL';
    let placeholder = 'Sowing the seed...';
    let submitBtnText = 'SEAL';
    let recipientName = '';

    if (type === 'firstReply') {
      mode = 'firstReply';
      headerLabel = '致远方来信';
      placeholder = '写下你的回信...';
      submitBtnText = '封缄寄出';
    } else if (type === 'reply') {
      mode = 'reply';
      recipientName = decodeURIComponent(name || '笔友');
      headerLabel = `致 ${recipientName} 的回信`;
      placeholder = '写下你的回信...';
      submitBtnText = '封缄寄出';
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

    this.mode = mode;
    this.replyTo = to || '';
    this.recipientName = recipientName;
    this.headerLabel = headerLabel;
    this.placeholder = placeholder;
    this.submitBtnText = submitBtnText;
    this.currentDate = dateStr;
  },
  methods: {
    onSelectTexture(index) {
      this.bgIndex = index;
      uni.vibrateShort({ type: 'light' });
    },

    onInput(e) {
      this.content = e.detail.value;
    },

    async onSubmit() {
      if (!this.content.trim()) return;

      this.isSealing = true;
      this.step = 0;

      setTimeout(() => {
        this.step = 1;
      }, 100);

      setTimeout(() => {
        this.step = 2;
      }, 600);

      setTimeout(() => {
        this.step = 3;
        uni.vibrateShort({ type: 'heavy' });
      }, 1400);

      try {
        uni.showLoading({ title: '递送中...', mask: true });

        const sendData = {
          content: this.content,
          theme: this.bgIndex,
          type: this.mode === 'root' ? 'root' : 'reply',
          parentId: (this.mode === 'firstReply' || this.mode === 'reply') ? this.replyTo : null
        };

        let res = null;
        // #ifdef MP-WEIXIN
        res = await wx.cloud.callFunction({
          name: 'sendLetter',
          data: sendData
        });
        // #endif
        // #ifndef MP-WEIXIN
        res = { result: { code: 500, msg: '当前平台不支持云函数' } };
        // #endif

        uni.hideLoading();

        if (res.result.code === 200) {
          this.step = 4;
          setTimeout(() => {
            this.handleSubmitSuccess(res.result.id, res.result.codeValue);
          }, 1000);
        } else {
          throw new Error(res.result.msg);
        }
      } catch (err) {
        uni.hideLoading();
        this.isSealing = false;
        this.step = 0;
        uni.showToast({
          title: err.message || '投递失败',
          icon: 'none'
        });
      }
    },

    handleSubmitSuccess(letterId, codeValue) {
      if (this.mode === 'root') {
        const finalCode = codeValue || (letterId ? letterId.slice(-4) : '8420');
        uni.showToast({
          title: '信笺已封缄',
          icon: 'success',
          duration: 1500
        });
        setTimeout(() => {
          uni.navigateTo({
            url: `/pages/windowsill/sealed/index?content=${encodeURIComponent(this.content)}&code=${finalCode}`
          });
        }, 1000);
        return;
      }

      if (this.mode === 'firstReply') {
        uni.showToast({
          title: '回信已寄出，静待对方回音',
          icon: 'none',
          duration: 2000
        });
        setTimeout(() => {
          uni.navigateBack();
        }, 2000);
        return;
      }

      uni.showToast({
        title: '信已寄出，静候回音',
        icon: 'none',
        duration: 2000
      });
      setTimeout(() => {
        uni.switchTab({ url: '/pages/desk/index' });
      }, 2000);
    }
  }
};
</script>

<style scoped>
.page-editor {
  display: flex;
  flex-direction: column;
  padding: 60rpx 48rpx;
  background-color: var(--paper-aged);
  height: 100vh;
  box-sizing: border-box;
}

.editor-header {
  margin-bottom: 40rpx;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding-bottom: 24rpx;
}

.header-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label,
.date {
  font-family: var(--font-sans);
  font-size: 22rpx;
  color: var(--ink-light);
  letter-spacing: 2rpx;
  text-transform: uppercase;
  font-weight: 500;
}

.letter-input {
  flex: 1;
  width: 100%;
  font-family: var(--font-serif);
  font-size: 36rpx;
  line-height: 1.8;
  color: var(--ink);
  background: transparent;
  padding: 0;
}

.placeholder-style {
  color: rgba(45, 45, 45, 0.2);
  font-style: italic;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 32rpx;
}

.texture-selector {
  display: flex;
  gap: 20rpx;
}

.dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  border: 1px solid var(--ink-light);
  opacity: 0.3;
  transition: all 0.2s;
}

.dot.selected {
  background-color: var(--ink);
  opacity: 0.8;
  transform: scale(1.1);
}

.btn-seal {
  background-color: #ccc;
  color: #fff;
  border-radius: 4rpx;
  font-family: var(--font-sans);
  font-weight: bold;
  letter-spacing: 6rpx;
  font-size: 26rpx;
  padding: 16rpx 48rpx;
  box-shadow: none;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  opacity: 0.5;
  pointer-events: none;
}

.btn-seal.active {
  background-color: var(--rust);
  opacity: 1;
  pointer-events: auto;
  box-shadow: 0 4rpx 12rpx rgba(154, 78, 64, 0.3);
}

.btn-seal:active {
  transform: scale(0.98);
}

.animation-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.anim-paper {
  width: 600rpx;
  height: 800rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  transition: all 0.5s ease;
}

.anim-paper.folding {
  width: 300rpx;
  height: 200rpx;
  background-color: #fff !important;
  opacity: 0;
}

.anim-envelope {
  width: 320rpx;
  height: 220rpx;
  background-color: #fff;
  border-radius: 8rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.2);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.anim-wax-drop {
  width: 20rpx;
  height: 20rpx;
  background-color: #9a4e40;
  border-radius: 50%;
  position: absolute;
  top: -100rpx;
  animation: waxDrop 0.8s ease-in forwards;
}

@keyframes waxDrop {
  0% { top: -100rpx; transform: scale(1); }
  60% { top: 80rpx; transform: scale(0.8); }
  80% { top: 90rpx; transform: scale(1.5); opacity: 0.8; }
  100% { top: 90rpx; transform: scale(3); opacity: 0; }
}

.anim-stamp {
  position: absolute;
  z-index: 10;
  animation: stampPress 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.stamp-body {
  width: 100rpx;
  height: 120rpx;
  background: #5d5548;
  border-radius: 10rpx;
  box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.3);
}

@keyframes stampPress {
  0% { transform: scale(1.5) translateY(-50rpx); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

.anim-seal-result {
  width: 60rpx;
  height: 60rpx;
  background-color: #9a4e40;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  box-shadow: 0 2rpx 5rpx rgba(0, 0, 0, 0.3);
  animation: sealAppear 0.3s ease-out;
}

@keyframes sealAppear {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

.anim-envelope.flying {
  animation: flyAway 1.2s ease-in forwards;
}

@keyframes flyAway {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  30% { transform: translateY(20rpx) scale(0.95); }
  100% { transform: translateY(-800rpx) scale(0.5); opacity: 0; }
}
</style>
