<template>
  <view class="container page-editor" :class="isSealing ? 'sealing-mode' : ''">
    <!-- Mist Layer -->
    <view class="mist-layer"></view>

    <view class="editor-main">
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
        <view class="btn-group">
          <view class="btn-cancel" @tap="onCancel">
            <text>ABANDON</text>
          </view>
          
          <view class="btn-seal" :class="content.length > 0 ? 'active' : ''" @tap="onSubmit">
            <view class="cube-btn">
              <text class="btn-text">SEND</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Geometric Animation Overlay -->
    <view class="anim-overlay" v-if="isSealing" @touchmove.stop.prevent>
      <view class="geo-scene">
        <!-- The Paper Folding into a Prism -->
        <view class="geo-paper" :animation="paperAnimation"></view>
        
        <!-- The Seed/Prism Result -->
        <view class="geo-prism" :animation="prismAnimation">
          <view class="prism-face face-1"></view>
          <view class="prism-face face-2"></view>
          <view class="prism-face face-3"></view>
          <view class="prism-glow"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { callCloudFunction } from '@/utils/cloud';
import { saveRoutePayload } from '@/utils/route-payload';

export default {
  data() {
    return {
      content: '',
      maxLen: 1000,
      currentDate: '',
      isSealing: false,
      mode: 'root',
      replyTo: '',
      recipientName: '',
      headerLabel: 'NEW ORIGIN',
      placeholder: 'Plant a thought...',
      paperAnimation: {},
      prismAnimation: {}
    };
  },
  onLoad(options) {
    const { type, to, name } = options || {};
    let mode = 'root';
    let headerLabel = 'NEW ORIGIN'; // 写新信
    let placeholder = 'Begin the conversation...';

    if (type === 'firstReply') {
      mode = 'firstReply';
      headerLabel = 'FIRST ECHO'; // 首回
      placeholder = 'Reply to the unknown...';
    } else if (type === 'reply') {
      mode = 'reply';
      const rName = decodeURIComponent(name || 'Unknown');
      headerLabel = `REPLY TO ${rName}`;
      placeholder = 'Continue the story...';
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

    this.mode = mode;
    this.replyTo = to || '';
    this.recipientName = name ? decodeURIComponent(name) : '';
    this.headerLabel = headerLabel;
    this.placeholder = placeholder;
    this.currentDate = dateStr;
  },
  methods: {
    onInput(e) {
      this.content = e.detail.value;
    },

    onCancel() {
      uni.navigateBack();
    },

    runSealingTimeline() {
      // Step 1: Paper folds (Shrink & Rotate)
      const paperAnim = uni.createAnimation({ duration: 600, timingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)' });
      paperAnim.opacity(1).scale(1).step({ duration: 0 });
      paperAnim.opacity(0).scale(0.1).rotateZ(180).step();
      this.paperAnimation = paperAnim.export();

      // Step 2: Prism appears and floats up
      const prismAnim = uni.createAnimation({ duration: 800, timingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
      prismAnim.opacity(0).scale(0).translateY(50).step({ duration: 0 });
      
      // Delay slightly
      setTimeout(() => {
        prismAnim.opacity(1).scale(1).translateY(0).step({ duration: 600 });
        // Fly away
        prismAnim.translateY(-600).opacity(0).scale(0.5).step({ duration: 600, delay: 400 });
        this.prismAnimation = prismAnim.export();
      }, 400);
    },

    async onSubmit() {
      if (!this.content.trim()) return;
      if ((this.mode === 'firstReply' || this.mode === 'reply') && !this.replyTo) {
        uni.showToast({ title: 'Missing reply target', icon: 'none' });
        return;
      }

      this.isSealing = true;
      uni.vibrateShort({ type: 'medium' });
      this.runSealingTimeline();

      try {
        // Wait for animation part 1
        await new Promise(r => setTimeout(r, 800));
        
        const sendData = {
          content: this.content,
          type: this.mode === 'root' ? 'root' : 'reply',
          parentId: (this.mode === 'firstReply' || this.mode === 'reply') ? this.replyTo : null,
          parentKind: this.mode === 'firstReply'
            ? 'letter'
            : this.mode === 'reply'
              ? 'root'
              : undefined
        };

        const result = await callCloudFunction('sendLetter', sendData);

        if (result.code === 200) {
          // Wait for fly away animation
          setTimeout(() => {
            this.handleSubmitSuccess(result);
          }, 800);
        } else {
          throw new Error(result.msg);
        }
      } catch (err) {
        this.isSealing = false;
        uni.showToast({ title: err.message || 'Failed to send', icon: 'none' });
      }
    },

    handleSubmitSuccess(result) {
      if (this.mode === 'root') {
        const payloadKey = saveRoutePayload({
          content: this.content,
          code: result.codeValue || ''
        });
        uni.redirectTo({
          url: `/pages/windowsill/sealed/index?payloadKey=${payloadKey}`
        });
        return;
      }

      uni.showToast({ title: 'Sent', icon: 'success' });
      setTimeout(() => {
        uni.switchTab({ url: '/pages/desk/index' });
      }, 1000);
    }
  }
};
</script>

<style scoped>
.page-editor {
  display: flex;
  flex-direction: column;
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
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(240,244,248,0.6) 100%);
  z-index: 0;
}

.editor-main {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 60rpx;
  transition: transform 0.6s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.6s;
}

.page-editor.sealing-mode .editor-main {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
  pointer-events: none;
}

.editor-header {
  margin-bottom: 40rpx;
  border-bottom: 2rpx solid rgba(0,0,0,0.05);
  padding-bottom: 20rpx;
}

.header-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label, .date {
  font-family: var(--font-sans);
  font-size: 20rpx;
  color: var(--ui-primary);
  letter-spacing: 2rpx;
  font-weight: bold;
  opacity: 0.5;
}

.letter-input {
  flex: 1;
  width: 100%;
  font-family: var(--font-serif);
  font-size: 36rpx;
  line-height: 1.8;
  color: var(--ui-primary);
  background: transparent;
  padding: 0;
}

.placeholder-style {
  color: rgba(38, 70, 83, 0.2);
  font-style: italic;
}

.editor-footer {
  padding-top: 40rpx;
}

.btn-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-cancel {
  padding: 20rpx;
}

.btn-cancel text {
  font-family: var(--font-sans);
  font-size: 20rpx;
  letter-spacing: 2rpx;
  color: #999;
  font-weight: bold;
}

.btn-seal {
  opacity: 0.5;
  pointer-events: none;
  transition: all 0.3s;
}

.btn-seal.active {
  opacity: 1;
  pointer-events: auto;
}

.cube-btn {
  background: var(--ui-primary);
  padding: 20rpx 60rpx;
  border-radius: 4rpx; /* Slight round, keeping it geometric */
  box-shadow: 0 10rpx 0 rgba(20, 40, 50, 0.8); /* 3D push effect */
  transition: all 0.1s;
}

.btn-seal:active .cube-btn {
  transform: translateY(10rpx);
  box-shadow: 0 0 0 rgba(20, 40, 50, 0.8);
}

.btn-text {
  font-family: var(--font-sans);
  font-size: 24rpx;
  color: #fff;
  letter-spacing: 4rpx;
  font-weight: bold;
}

/* Animation Layer */
.anim-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1000px;
}

.geo-scene {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
}

.geo-paper {
  position: absolute;
  width: 400rpx;
  height: 500rpx;
  background: #fff;
  box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.1);
}

.geo-prism {
  position: absolute;
  width: 100rpx;
  height: 100rpx;
  transform-style: preserve-3d;
  animation: float 3s ease-in-out infinite;
}

/* Simple CSS Pyramid/Prism approximation */
.prism-face {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 50rpx solid transparent;
  border-right: 50rpx solid transparent;
  border-bottom: 86.6rpx solid var(--leaf-me); /* Triangle */
  transform-origin: 50% 100%;
}

.face-1 { transform: rotateY(0deg) translateZ(28.8rpx) rotateX(30deg); filter: brightness(1.1); }
.face-2 { transform: rotateY(120deg) translateZ(28.8rpx) rotateX(30deg); filter: brightness(0.9); }
.face-3 { transform: rotateY(240deg) translateZ(28.8rpx) rotateX(30deg); filter: brightness(0.8); }

.prism-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100rpx;
  height: 100rpx;
  background: radial-gradient(circle, rgba(233, 196, 106, 0.8) 0%, transparent 70%);
  transform: translate(-50%, -50px) rotateX(90deg);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
