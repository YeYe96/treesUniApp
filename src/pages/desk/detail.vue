<template>
  <view class="container page-detail">
    <view class="mist-layer"></view>

    <view class="reading-view active">
      <view class="nav-header" :style="{ paddingTop: `${statusBarHeight}px` }">
        <view class="nav-content">
          <view class="btn-back" @tap="onNavigateBack">
            <text class="arrow-icon">←</text>
            <text>BACK</text>
          </view>
          <text class="title">MEMORIES WITH {{ pseudonym }}</text>
        </view>
      </view>

      <view class="card-container">
        <!-- Letter Card (Geometric Panel) -->
        <view class="geo-card">
          <scroll-view scroll-y class="card-scroll">
            <view class="card-inner">
              <view class="meta-header">
                <view class="sender-tag" :class="readingLetter && readingLetter.isMe ? 'is-me' : 'is-you'">
                  {{ readingLetter && readingLetter.isMe ? 'ME' : 'YOU' }}
                </view>
                <text class="date-label">{{ readingLetter ? readingLetter.timeLabel : '' }}</text>
              </view>

              <view class="body-content">
                <text selectable>{{ readingLetter ? readingLetter.content : '' }}</text>
              </view>

              <view class="footer-action" @tap="onReply">
                <view class="reply-btn">
                  <text class="icon">✎</text>
                  <text>WRITE BACK</text>
                </view>
              </view>
            </view>
          </scroll-view>

          <!-- Navigation (Bottom Bar) -->
          <view class="nav-bar">
            <view class="nav-arrow left" :class="readingIndex <= 0 ? 'disabled' : ''" @tap="onPrevLetter">
              <text>←</text>
            </view>
            <view class="nav-indicator">
              <text class="curr">{{ readingIndex + 1 }}</text>
              <text class="sep">/</text>
              <text class="total">{{ letters.length }}</text>
            </view>
            <view class="nav-arrow right" :class="readingIndex >= letters.length - 1 ? 'disabled' : ''" @tap="onNextLetter">
              <text>→</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { formatTimePoetic, getWaitingText } from '@/utils/util';
import { callCloudFunction } from '@/utils/cloud';
import { consumeRoutePayload } from '@/utils/route-payload';

export default {
  data() {
    return {
      connectionId: '',
      rootId: '',
      replyId: '',
      pseudonym: '',
      letters: [],
      readingLetter: null,
      readingIndex: -1,
      replyMode: false,
      waitingText: '',
      statusBarHeight: 0,
      isNewEcho: false
    };
  },
  onLoad(options) {
    const info = uni.getSystemInfoSync ? uni.getSystemInfoSync() : { statusBarHeight: 0 };
    this.statusBarHeight = info.statusBarHeight || 0;

    const payload = consumeRoutePayload(options.payloadKey);
    const initialData = {
      connectionId: options.id,
      rootId: options.rootId || '',
      replyId: options.replyId || '',
      pseudonym: decodeURIComponent(options.name || ''),
      waitingText: getWaitingText()
    };

    const letters = this.normalizeLetters(payload ? payload.letters : []);
    let targetIndex = 0;
    if (payload && payload.targetLetterId) {
      const idx = letters.findIndex((l) => l._id === payload.targetLetterId);
      if (idx !== -1) targetIndex = idx;
    }

    this.connectionId = initialData.connectionId;
    this.rootId = initialData.rootId;
    this.replyId = initialData.replyId;
    this.pseudonym = initialData.pseudonym;
    this.waitingText = initialData.waitingText;
    this.isNewEcho = options.isNewEcho === '1';
    this.letters = letters;
    this.readingLetter = letters[targetIndex] || null;
    this.readingIndex = letters.length > 0 ? targetIndex : -1;

    if (!payload || letters.length === 0) {
      uni.showModal({
        title: '提示',
        content: '信件数据已失效，可返回上一页重试，或回到信件列表。',
        confirmText: '返回上一页',
        cancelText: '回到Desk',
        success: (res) => {
          if (res.confirm) {
            uni.navigateBack();
            return;
          }
          uni.switchTab({ url: '/pages/desk/index' });
        }
      });
    }

    uni.vibrateShort({ type: 'medium' });
  },
  methods: {
    onNavigateBack() {
      uni.navigateBack();
    },

    normalizeLetters(list) {
      return (list || []).map((l, index) => {
        const time = l.createTime || l.date || new Date();
        return {
          _id: l._id || `letter-${index}`,
          content: l.content || l.summary || '',
          createTime: time,
          isMe: !!l.isMe,
          status: l.status || 'read',
          timeLabel: formatTimePoetic(time)
        };
      });
    },

    switchLetter(index) {
      const letters = this.letters;
      const letter = letters[index];

      let shouldUpdateLetters = false;
      if (letter.status === 'unread') {
        letters[index].status = 'read';
        shouldUpdateLetters = true;
      }

      this.readingLetter = letter;
      this.readingIndex = index;
      if (shouldUpdateLetters) {
        this.letters = letters;
      }
    },

    onPrevLetter() {
      if (this.readingIndex > 0) {
        uni.vibrateShort({ type: 'light' });
        this.switchLetter(this.readingIndex - 1);
      }
    },

    onNextLetter() {
      if (this.readingIndex < this.letters.length - 1) {
        uni.vibrateShort({ type: 'light' });
        this.switchLetter(this.readingIndex + 1);
      }
    },

    async onReply() {
      uni.vibrateShort({ type: 'light' });
      const replyType = this.isNewEcho ? 'firstReply' : 'reply';
      const replyTo = this.isNewEcho ? this.replyId || this.connectionId : this.rootId;

      if (!replyTo) {
        uni.showToast({ title: '回信目标缺失，请返回列表重试', icon: 'none' });
        return;
      }

      if (this.isNewEcho && this.replyId) {
        // #ifdef MP-WEIXIN
        try {
          await callCloudFunction('reviewReply', { replyId: this.replyId, action: 'accept' });
        } catch (err) {
          console.warn('reviewReply failed', err);
          uni.showToast({ title: '已跳过审核确认，继续回信', icon: 'none' });
        }
        // #endif
      }

      if (!this.isNewEcho && !this.rootId) {
        console.warn('Missing rootId for reply flow', {
          connectionId: this.connectionId,
          replyId: this.replyId
        });
        uni.showToast({ title: '会话数据未就绪，请返回重试', icon: 'none' });
        return;
      }

      uni.navigateTo({
        url: `/pages/windowsill/editor?type=${replyType}&to=${replyTo}&name=${encodeURIComponent(this.pseudonym)}`
      });
    }
  }
};
</script>

<style scoped>
.container {
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
  background: radial-gradient(circle at 50% 30%, rgba(255,255,255,0.8) 0%, rgba(240,244,248,0.4) 60%, transparent 100%);
  opacity: 0.8;
  z-index: 0;
}

.reading-view {
  position: relative;
  z-index: 10;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav-header {
  padding: 40rpx;
  padding-bottom: 20rpx;
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 10rpx;
  color: var(--ui-primary);
  opacity: 0.6;
}

.arrow-icon {
  font-size: 32rpx;
  font-weight: bold;
}

.btn-back text {
  font-family: var(--font-sans);
  font-size: 24rpx;
  letter-spacing: 2rpx;
  font-weight: bold;
}

.title {
  font-family: var(--font-sans);
  font-size: 20rpx;
  letter-spacing: 2rpx;
  color: var(--ui-primary);
  opacity: 0.4;
  text-transform: uppercase;
}

.card-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40rpx;
  padding-bottom: 80rpx;
}

.geo-card {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 4rpx;
  box-shadow: 0 20rpx 60rpx rgba(38, 70, 83, 0.15);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  /* Geometric border accent on top */
  border-top: 8rpx solid var(--ui-primary);
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

.sender-tag {
  font-family: var(--font-sans);
  font-size: 20rpx;
  font-weight: bold;
  letter-spacing: 2rpx;
  padding: 8rpx 16rpx;
  border-radius: 4rpx;
  color: #fff;
}

.sender-tag.is-me {
  background-color: var(--leaf-me);
}

.sender-tag.is-you {
  background-color: var(--leaf-you);
}

.date-label {
  font-family: var(--font-sans);
  font-size: 22rpx;
  color: #999;
  font-style: italic;
}

.body-content {
  font-family: var(--font-serif);
  font-size: 34rpx;
  line-height: 2;
  color: var(--ui-primary);
  white-space: pre-wrap;
}

.footer-action {
  margin-top: 100rpx;
  display: flex;
  justify-content: center;
}

.reply-btn {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 40rpx;
  border: 2rpx solid var(--ui-primary);
  border-radius: 50rpx;
  opacity: 0.8;
  transition: all 0.2s;
}

.reply-btn:active {
  background: var(--ui-primary);
  color: #fff;
}

.reply-btn text {
  font-family: var(--font-sans);
  font-size: 24rpx;
  letter-spacing: 4rpx;
  font-weight: bold;
}

/* Nav Bar */
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 60rpx;
  background: rgba(240, 244, 248, 0.5);
  border-top: 1px solid rgba(0,0,0,0.05);
}

.nav-arrow {
  font-size: 40rpx;
  color: var(--ui-primary);
  opacity: 0.6;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-arrow.disabled {
  opacity: 0.1;
  pointer-events: none;
}

.nav-indicator {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  font-family: var(--font-sans);
}

.curr {
  font-size: 36rpx;
  font-weight: bold;
  color: var(--ui-primary);
}

.sep {
  font-size: 24rpx;
  color: #ccc;
}

.total {
  font-size: 24rpx;
  color: #ccc;
}
</style>
