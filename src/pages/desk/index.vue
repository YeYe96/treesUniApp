<template>
  <view class="container page-desk">
    <!-- Mist Background Layer -->
    <view class="mist-layer"></view>
    
    <view class="header-side" :class="viewState === 'FOCUS' ? 'fade-away' : ''">
      <view class="header-group">
        <text class="title-en">FOREST</text>
        <view class="divider-v"></view>
        <text class="title-cn">森之语</text>
      </view>
    </view>

    <scroll-view scroll-y class="global-view" :class="viewState === 'FOCUS' ? 'fade-away' : ''">
      <view class="tree-content">
        <!-- New Origin Button (Floating Seed) -->
        <view class="new-origin-anchor" @tap="onNewOrigin">
          <view class="seed-btn">+</view>
          <text class="label-new">播种新信</text>
        </view>

        <LivingTree mode="GLOBAL" :roots="treeData" @node-tap="onNodeTap" />

        <view style="height: 200rpx;"></view>
      </view>
    </scroll-view>

    <view class="focus-overlay" v-if="viewState === 'FOCUS'">
      <view class="custom-nav">
        <view class="btn-back" @tap="popStack">
          <text class="arrow-icon">←</text>
          <text class="back-text">返回森林</text>
        </view>
      </view>

      <view class="anchor-text-container">
        <text class="root-title">{{ currentFocus ? (currentFocus.displayTitle || currentFocus.title) : '' }}</text>
        <text class="root-subtitle">{{ currentFocus ? '点击叶片阅读信件' : '' }}</text>
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
import { callCloudFunction, normalizeDeskTree } from '@/utils/cloud';
import { saveRoutePayload } from '@/utils/route-payload';

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
      try {
        const result = await callCloudFunction('getDeskTree');
        if (result.code === 200) {
          const { tree } = normalizeDeskTree(result);
          this.treeData = this.decorateRoots(tree);
          this.loading = false;
          return;
        }
      } catch (err) {
        // fall through
      }
      this.treeData = [];
      this.loading = false;
    },

    decorateRoots(roots) {
      return (roots || []).map((root) => {
        const originType = root.originType
          || (root.isMe === true ? 'outbound' : root.isMe === false ? 'inbound' : '');
        const label = originType === 'outbound' ? '我发起' : originType === 'inbound' ? '我收到' : '';
        const safeTitle = root.title || '未命名会话';
        return {
          ...root,
          originType,
          displayTitle: label ? `${label} · ${safeTitle}` : safeTitle
        };
      });
    },

    onNodeTap(node) {
      if (!node) return;

      if (node.type === 'letter') {
        uni.vibrateShort({ type: 'medium' });
        const relation = this.findParentOfLetter(node._id);
        if (relation) {
          const parent = relation.connection;
          const payloadKey = saveRoutePayload({
            letters: parent.children || [],
            targetLetterId: node._id
          });
          const connectionId = parent._id;
          const name = parent.title;
          const rootId = parent.rootId || relation.rootId || '';
          const isNewEcho = parent.type === 'new_echo';
          const replyId = parent.sourceId || '';
          uni.navigateTo({
            url: `/pages/desk/detail?id=${connectionId}&payloadKey=${payloadKey}&name=${encodeURIComponent(name)}&rootId=${rootId}&isNewEcho=${isNewEcho ? '1' : '0'}&replyId=${replyId}`
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
              return {
                connection: child,
                rootId: origin._id || ''
              };
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
  background-color: var(--bg-mist); /* Use Tailwind color */
}

.mist-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: radial-gradient(circle at 50% 30%, rgba(255,255,255,0.8) 0%, rgba(240,244,248,0.4) 60%, transparent 100%);
  opacity: 0.6;
  z-index: 0;
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
  font-size: 20rpx;
  letter-spacing: 4rpx;
  transform: rotate(180deg);
  color: var(--tree-trunk);
  font-weight: bold;
  opacity: 0.6;
}

.title-cn {
  font-family: var(--font-serif);
  font-size: 40rpx;
  color: var(--tree-trunk);
  font-weight: 600;
}

.divider-v {
  width: 2rpx;
  height: 40rpx;
  background: var(--tree-trunk);
  opacity: 0.3;
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
  z-index: 1;
}

.new-origin-anchor {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  margin-bottom: 120rpx;
  margin-top: 0;
}

.seed-btn {
  width: 100rpx;
  height: 100rpx;
  background: var(--leaf-me);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50rpx;
  color: #fff;
  box-shadow: 0 10rpx 20rpx rgba(231, 111, 81, 0.3);
  transition: transform 0.2s;
}

.seed-btn:active {
  transform: scale(0.9);
}

.label-new {
  font-family: var(--font-serif);
  font-size: 24rpx;
  color: var(--tree-trunk);
  margin-top: 16rpx;
  opacity: 0.8;
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
  background: rgba(240, 244, 248, 0.9);
  backdrop-filter: blur(10px);
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
  opacity: 0.8;
}

.arrow-icon {
  font-size: 36rpx;
  color: var(--tree-trunk);
  padding-bottom: 4rpx;
}

.back-text {
  font-family: var(--font-serif);
  font-size: 28rpx;
  color: var(--tree-trunk);
}

.anchor-text-container {
  margin-top: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 10;
  animation: springUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
}

.root-title {
  font-family: var(--font-serif);
  font-size: 40rpx;
  color: var(--tree-trunk);
  font-weight: bold;
}

.root-subtitle {
  font-family: var(--font-sans);
  font-size: 20rpx;
  color: var(--leaf-you);
  margin-top: 8rpx;
  letter-spacing: 2rpx;
  text-transform: uppercase;
}

@keyframes springUp {
  from { transform: translateY(100rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>

