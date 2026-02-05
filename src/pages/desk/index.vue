<template>
  <view class="container page-desk">
    <view class="header-side" :class="viewState === 'FOCUS' ? 'fade-away' : ''">
      <view class="header-group">
        <text class="title-en">MAILBOX</text>
        <view class="divider-v"></view>
        <text class="title-cn">我的存档</text>
        <text class="cycle-tag">CYCLE 4</text>
      </view>
    </view>

    <scroll-view scroll-y class="global-view" :class="viewState === 'FOCUS' ? 'fade-away' : ''">
      <view class="tree-content">
        <view class="new-origin-anchor" @tap="onNewOrigin">
          <view class="dashed-circle-plus">+</view>
          <text class="label-new">写新信</text>
        </view>

        <LivingTree mode="GLOBAL" :roots="treeData" @node-tap="onNodeTap" />

        <view style="height: 200rpx;"></view>
      </view>
    </scroll-view>

    <view class="focus-overlay" v-if="viewState === 'FOCUS'">
      <view class="custom-nav">
        <view class="btn-back" @tap="popStack">
          <text class="arrow-icon">←</text>
          <text class="back-text">Back</text>
        </view>
      </view>

      <view class="anchor-text-container">
        <text class="root-title">{{ currentFocus ? currentFocus.title : '' }}</text>
        <text class="root-date">{{ currentFocus ? currentFocus.createTime : '' }}</text>
      </view>

      <scroll-view scroll-y class="children-scroll" enable-flex="true">
        <LivingTree mode="FOCUS" :focus="currentFocus" @node-tap="onNodeTap" />
        <view style="height: 250rpx;"></view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import LivingTree from '@/components/LivingTree.vue';

export default {
  components: {
    LivingTree
  },
  data() {
    return {
      treeData: [],
      loading: true,
      viewState: 'GLOBAL',
      focusStack: [],
      currentFocus: null,
      nextChildren: []
    };
  },
  onShow() {
    uni.showTabBar();
    this.fetchTreeData();
  },
  methods: {
    async fetchTreeData() {
      this.loading = true;
      // #ifdef MP-WEIXIN
      try {
        const res = await wx.cloud.callFunction({
          name: 'getDeskTree'
        });
        if (res.result.code === 200) {
          this.treeData = res.result.data.tree || [];
          this.loading = false;
          return;
        }
      } catch (err) {
        // fall through
      }
      // #endif
      this.treeData = [];
      this.loading = false;
    },

    onNodeTap(node) {
      if (!node) return;

      if (node.type === 'letter') {
        uni.vibrateShort({ type: 'medium' });
        const parent = this.findParentOfLetter(node._id);
        if (parent) {
          const connectionId = parent._id;
          const name = parent.title;
          const rootId = parent.rootId || '';
          const isNewEcho = parent.type === 'new_echo';
          const replyId = parent.sourceId || '';
          uni.navigateTo({
            url: `/pages/desk/detail?id=${connectionId}&targetLetterId=${node._id}&name=${encodeURIComponent(name)}&rootId=${rootId}&isNewEcho=${isNewEcho ? '1' : '0'}&replyId=${replyId}`
          });
        }
        return;
      }

      const source = this.viewState === 'GLOBAL'
        ? this.treeData.find((item) => item._id === node._id)
        : this.nextChildren.find((item) => item._id === node._id);

      if (source) {
        this.pushStack(source);
      }
    },

    pushStack(node) {
      uni.vibrateShort({ type: 'medium' });
      uni.hideTabBar();

      const newStack = [...this.focusStack, node];
      const nextChildren = (node.children || []).map((child, index) => ({ ...child, index }));

      this.viewState = 'FOCUS';
      this.focusStack = newStack;
      this.currentFocus = node;
      this.nextChildren = nextChildren;
    },

    popStack() {
      uni.vibrateShort({ type: 'light' });

      const newStack = [...this.focusStack];
      newStack.pop();

      if (newStack.length === 0) {
        uni.showTabBar();
        this.viewState = 'GLOBAL';
        this.focusStack = [];
        this.currentFocus = null;
        this.nextChildren = [];
      } else {
        const parent = newStack[newStack.length - 1];
        this.focusStack = newStack;
        this.currentFocus = parent;
        this.nextChildren = (parent.children || []).map((child, index) => ({ ...child, index }));
      }
    },

    onNewOrigin() {
      uni.vibrateShort({ type: 'medium' });
      uni.navigateTo({ url: '/pages/windowsill/editor' });
    },

    findParentOfLetter(letterId) {
      for (const origin of this.treeData) {
        if (origin.children) {
          for (const child of origin.children) {
            if (child.children && child.children.some((l) => l._id === letterId)) {
              return child;
            }
          }
        }
      }
      return null;
    }
  }
};
</script>

<style scoped>
/* pages/desk/index.wxss */
.page-desk {
  position: relative;
  height: 100vh;
  overflow: hidden;
  display: block;
}

.header-side {
  position: absolute;
  left: 40rpx;
  top: 100rpx;
  z-index: 10;
  transition: opacity 0.4s ease;
}

.header-side.fade-away {
  opacity: 0;
  pointer-events: none;
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
  letter-spacing: 4rpx;
  transform: rotate(180deg);
  color: var(--trunk);
  font-weight: bold;
}

.title-cn {
  font-family: var(--font-serif);
  font-size: 44rpx;
  font-style: italic;
  color: var(--trunk);
}

.divider-v {
  width: 2rpx;
  height: 60rpx;
  background: var(--sage);
}

.cycle-tag {
  font-size: 18rpx;
  color: var(--sage);
  letter-spacing: 2rpx;
  margin-top: 20rpx;
}

.global-view {
  height: 100vh;
  width: 100%;
  transition: opacity 0.5s cubic-bezier(0.19, 1, 0.22, 1), transform 0.5s;
}

.global-view.fade-away {
  opacity: 0;
  transform: translateY(100rpx);
  pointer-events: none;
}

.tree-content {
  padding-top: calc(env(safe-area-inset-top) + 120rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.new-origin-anchor {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  margin-bottom: 150rpx;
  margin-top: 0;
}

.dashed-circle-plus {
  width: 100rpx;
  height: 100rpx;
  border: 2rpx dashed var(--ink);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50rpx;
  font-weight: 200;
  color: var(--ink);
  margin-bottom: 16rpx;
}

.label-new {
  font-family: var(--font-serif);
  font-size: 24rpx;
  color: var(--ink-light);
  font-style: italic;
}

.focus-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.custom-nav {
  width: 100%;
  padding-left: 40rpx;
  position: relative;
  z-index: 100;
  display: flex;
  align-items: center;
  height: 80rpx;
  padding-top: env(safe-area-inset-top);
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 10rpx;
  opacity: 0.6;
}

.arrow-icon {
  font-size: 36rpx;
  color: var(--ink);
  padding-bottom: 4rpx;
}

.back-text {
  font-family: var(--font-serif);
  font-size: 24rpx;
  color: var(--ink);
}

.anchor-text-container {
  margin-top: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 10;
  animation: springUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
}

.root-title {
  font-family: var(--font-serif);
  font-size: 48rpx;
  color: var(--ink);
  font-weight: bold;
  letter-spacing: 2rpx;
}

.root-date {
  font-family: var(--font-sans);
  font-size: 20rpx;
  color: var(--sage);
  margin-top: 8rpx;
  letter-spacing: 1rpx;
}

@keyframes springUp {
  from { transform: translateY(100rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
