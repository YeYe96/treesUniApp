<template>
  <view class="container">
    <view class="reading-view active">
      <view class="paper-container">
        <view class="nav-header" :style="{ paddingTop: `${statusBarHeight}px` }">
          <view class="nav-content">
            <view class="back-area" @tap="onNavigateBack">
              <text class="back-icon">←</text>
              <text>返回</text>
            </view>
            <text class="title">与 {{ pseudonym }} 的往来</text>
            <view style="width: 80rpx;"></view>
          </view>
        </view>

        <view class="letter-paper">
          <scroll-view scroll-y class="paper-content">
            <view class="paper-header">
              <text class="paper-date">{{ readingLetter ? readingLetter.timeLabel : '' }}</text>
            </view>

            <view class="paper-body">
              <text selectable>{{ readingLetter ? readingLetter.content : '' }}</text>
            </view>

            <view class="paper-footer">
              <text>—— {{ readingLetter && readingLetter.isMe ? '我' : pseudonym }}</text>
            </view>

            <view class="reply-section" @tap="onReply">
              <text class="reply-icon">✎</text>
              <text>提笔回信</text>
            </view>
          </scroll-view>

          <view class="paper-nav">
            <view class="nav-btn" :class="readingIndex <= 0 ? 'disabled' : ''" @tap="onPrevLetter">
              <text>‹ 上一封</text>
            </view>
            <view class="nav-indicator">
              <text>{{ readingIndex + 1 }} / {{ letters.length }}</text>
            </view>
            <view class="nav-btn" :class="readingIndex >= letters.length - 1 ? 'disabled' : ''" @tap="onNextLetter">
              <text>下一封 ›</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { formatTimePoetic, getWaitingText } from '@/utils/util';

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

    const initialData = {
      connectionId: options.id,
      rootId: options.rootId || '',
      replyId: options.replyId || '',
      pseudonym: decodeURIComponent(options.name || ''),
      waitingText: getWaitingText()
    };

    const letters = this.getMockLetters();

    let targetIndex = 0;
    if (options.targetLetterId) {
      const idx = letters.findIndex((l) => l._id === options.targetLetterId);
      if (idx !== -1) {
        targetIndex = idx;
      }
    }

    if (letters[targetIndex] && letters[targetIndex].status === 'unread') {
      letters[targetIndex].status = 'read';
    }

    this.connectionId = initialData.connectionId;
    this.rootId = initialData.rootId;
    this.replyId = initialData.replyId;
    this.pseudonym = initialData.pseudonym;
    this.waitingText = initialData.waitingText;
    this.isNewEcho = options.isNewEcho === '1';
    this.letters = letters;
    this.readingLetter = letters[targetIndex];
    this.readingIndex = targetIndex;

    uni.vibrateShort({ type: 'medium' });
  },
  methods: {
    onNavigateBack() {
      uni.navigateBack();
    },

    getMockLetters() {
      const letterData = [
        {
          _id: 'l_latest',
          content: '关于那个案子，我有一些新的想法...\n\n最近我一直在思考，如果我们从另一个角度切入，是否会看到完全不同的景象？\n\n(此处省略一千字)...',
          createTime: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000),
          isMe: false,
          status: 'unread'
        },
        {
          _id: 'l3',
          content: '很高兴遇到懂我的人。那一刻我也在看雨，感觉我们共享了同一个时空。\n\n关于你提到的时间旅行，我也曾无数次幻想过...',
          createTime: new Date(new Date().getTime() - 13 * 24 * 60 * 60 * 1000),
          isMe: true,
          status: 'read'
        },
        {
          _id: 'l2',
          content: '海的那边是另一片陆地。我也很喜欢海，尤其是黄昏时的海。\n\n那种层层叠叠的金色浪花，就像时间的褶皱。',
          createTime: new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000),
          isMe: false,
          status: 'read'
        },
        {
          _id: 'l1',
          content: '今天天气真好，想去海边走走。不知道海的那边是什么样的？',
          createTime: new Date(new Date().getTime() - 15 * 24 * 60 * 60 * 1000),
          isMe: true,
          status: 'read'
        }
      ];

      return letterData.map((l) => ({
        ...l,
        timeLabel: formatTimePoetic(l.createTime)
      }));
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
      const replyTo = this.rootId || this.connectionId;

      if (this.isNewEcho && this.replyId) {
        // #ifdef MP-WEIXIN
        try {
          await wx.cloud.callFunction({
            name: 'reviewReply',
            data: { replyId: this.replyId, action: 'accept' }
          });
        } catch (err) {
          // ignore to keep flow smooth
        }
        // #endif
      }

      uni.navigateTo({
        url: `/pages/windowsill/editor?type=${replyType}&to=${replyTo}&name=${encodeURIComponent(this.pseudonym)}`
      });
    }
  }
};
</script>

<style scoped>
/* pages/desk/detail.wxss */
.container {
  background-color: #F2EFE9;
  height: 100vh;
  padding: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.reading-view {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  animation: fadeIn 0.4s ease forwards;
}

.paper-container {
  width: 90%;
  height: 85%;
  position: relative;
  z-index: 101;
}

.nav-header {
  width: 100%;
  box-sizing: border-box;
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
}

.back-area {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #5D5548;
}

.back-icon {
  font-size: 36rpx;
}

.letter-paper {
  width: 100%;
  height: 100%;
  background-color: #FFFCF7;
  border-radius: 4rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  transform: translateY(100px);
  opacity: 0;
  animation: paperSlideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  animation-delay: 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes paperSlideUp {
  from {
    transform: translateY(60px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.paper-content {
  flex: 1;
  padding: 60rpx 50rpx;
  box-sizing: border-box;
}

.paper-header {
  margin-bottom: 60rpx;
  text-align: right;
}

.paper-date {
  font-size: 26rpx;
  color: #8C867A;
  font-style: italic;
}

.paper-body {
  font-size: 34rpx;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
  letter-spacing: 1rpx;
}

.paper-footer {
  margin-top: 80rpx;
  text-align: right;
  font-size: 30rpx;
  color: #5D5548;
}

.paper-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 40rpx;
  border-top: 1rpx solid #E8E4DC;
  background: #FDFCFA;
}

.nav-btn {
  padding: 16rpx 24rpx;
  font-size: 28rpx;
  color: #5D5548;
  transition: opacity 0.2s;
}

.nav-btn:active {
  opacity: 0.6;
}

.nav-btn.disabled {
  color: #CCC;
  pointer-events: none;
}

.nav-indicator {
  font-size: 24rpx;
  color: #A39E93;
}

.reply-section {
  margin-top: 60rpx;
  padding-top: 40rpx;
  border-top: 1px dashed #E0DCD4;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5D5548;
  font-size: 28rpx;
  opacity: 0.8;
}

.reply-icon {
  margin-right: 12rpx;
  font-size: 32rpx;
}
</style>
