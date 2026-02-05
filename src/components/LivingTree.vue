<template>
  <view class="living-tree" :class="modeClass" :style="{ height: `${svgHeight}px` }">
    <svg
      class="tree-svg"
      :width="canvasWidth"
      :height="svgHeight"
      :viewBox="`0 0 ${canvasWidth} ${svgHeight}`"
      :key="`tree-${growthSeed}`"
    >
      <line
        v-if="mode === 'GLOBAL' && trunk"
        class="tree-trunk"
        :x1="trunk.x"
        :y1="trunk.y1"
        :x2="trunk.x"
        :y2="trunk.y2"
        :style="trunkStyle"
        pathLength="1"
      />
      <path
        v-for="edge in edges"
        :key="`${edge.key}-${growthSeed}`"
        class="tree-branch"
        :d="edge.d"
        :style="edgeStyle(edge)"
        pathLength="1"
      />
    </svg>

    <view
      v-for="node in nodes"
      :key="`${node.key}-${growthSeed}`"
      class="node"
      :class="nodeClass(node)"
      :style="nodeStyle(node)"
      @tap="emitTap(node)"
    >
      <view class="node-inner">
        <template v-if="mode === 'GLOBAL'">
          <view class="node-dot"></view>
          <view class="node-info">
            <text class="node-title">{{ node.title }}</text>
            <text class="node-date">{{ node.createTime }}</text>
          </view>
        </template>

        <template v-else>
          <view v-if="node.type === 'letter'" class="letter-card">
            <view class="paper-clip"></view>
            <text class="letter-summary">{{ node.summary }}</text>
            <text class="letter-date">{{ node.date }}</text>
          </view>

          <view v-else class="branch-node" :class="node.type === 'new_echo' ? 'branch-echo' : 'branch-bond'">
            <view v-if="node.type === 'new_echo'" class="echo-icon">🌱</view>
            <view v-else class="knot-connector"></view>
            <text class="branch-title">{{ node.type === 'new_echo' ? '新回复' : node.title }}</text>
          </view>
        </template>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { buildTreeLayout, getCanvasWidth } from '@/utils/tree-growth';

const props = defineProps({
  mode: {
    type: String,
    default: 'GLOBAL'
  },
  roots: {
    type: Array,
    default: () => []
  },
  focus: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['node-tap']);

const canvasWidth = computed(() => getCanvasWidth());

const growthSeed = ref(0);
watch(
  () => [props.mode, props.roots, props.focus],
  () => {
    growthSeed.value += 1;
  },
  { deep: true }
);

const layout = computed(() => buildTreeLayout({
  mode: props.mode,
  roots: props.roots,
  focus: props.focus,
  width: canvasWidth.value
}));

const nodes = computed(() => layout.value.nodes);
const edges = computed(() => layout.value.edges);
const trunk = computed(() => layout.value.trunk);
const svgHeight = computed(() => layout.value.height);

const modeClass = computed(() => (props.mode === 'FOCUS' ? 'mode-focus' : 'mode-global'));

const nodeStyle = (node) => {
  const translate = node.type === 'letter' ? 'translate(-50%, 0)' : 'translate(-50%, -50%)';
  const duration = 420 + (node.depth || 0) * 140;
  return {
    left: `${node.x}px`,
    top: `${node.y}px`,
    transform: translate,
    '--node-delay': `${Math.round(node.delay || 0)}ms`,
    '--node-duration': `${duration}ms`
  };
};

const nodeClass = (node) => {
  return {
    'node-global': props.mode === 'GLOBAL',
    'node-branch': props.mode === 'FOCUS' && node.type !== 'letter',
    'node-letter': props.mode === 'FOCUS' && node.type === 'letter'
  };
};

const trunkStyle = computed(() => {
  if (!trunk.value) return {};
  return {
    '--grow-delay': `${Math.round(trunk.value.delay || 0)}ms`,
    '--grow-duration': `${Math.round(trunk.value.duration || 900)}ms`
  };
});

const edgeStyle = (edge) => {
  return {
    '--grow-delay': `${Math.round(edge.delay || 0)}ms`,
    '--grow-duration': `${Math.round(edge.duration || 900)}ms`
  };
};

const emitTap = (node) => {
  emit('node-tap', node);
};
</script>

<style scoped>
.living-tree {
  position: relative;
  width: 100%;
  min-height: 480px;
}

.tree-svg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.tree-trunk {
  stroke: var(--ink);
  stroke-width: 2;
  opacity: 0.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
  animation: draw-line var(--grow-duration, 1000ms) ease forwards;
  animation-delay: var(--grow-delay, 0ms);
}

.tree-branch {
  stroke: var(--ink);
  stroke-width: 1.4;
  fill: none;
  opacity: 0.55;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
  animation: draw-line var(--grow-duration, 900ms) ease forwards;
  animation-delay: var(--grow-delay, 0ms);
}

.node {
  position: absolute;
  z-index: 2;
}

.node-inner {
  opacity: 0;
  transform-origin: center;
  animation: node-grow var(--node-duration, 520ms) cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
  animation-delay: var(--node-delay, 0ms);
}

.node-global {
  display: flex;
  align-items: center;
}

.node-dot {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: var(--ink);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.node-info {
  margin-left: 20rpx;
  width: 320rpx;
}

.node-title {
  font-family: var(--font-serif);
  font-size: 32rpx;
  color: var(--ink);
  display: block;
}

.node-date {
  font-family: var(--font-sans);
  font-size: 20rpx;
  color: var(--ink-light);
  margin-top: 6rpx;
  display: block;
}

.branch-node {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: rgba(255, 255, 255, 0.2);
  padding: 10rpx 16rpx;
  border-radius: 40rpx;
}

.branch-title {
  font-family: var(--font-serif);
  font-size: 28rpx;
  color: var(--ink);
}

.branch-echo .branch-title {
  color: var(--moss);
  font-style: italic;
}

.echo-icon {
  font-size: 24rpx;
}

.knot-connector {
  width: 8rpx;
  height: 8rpx;
  background: var(--ink);
  border-radius: 50%;
}

.letter-card {
  background: #fdfdfd;
  padding: 24rpx;
  width: 280rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  position: relative;
  background-image: url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z'/%3E%3C/g%3E%3C/svg%3E");
}

.paper-clip {
  position: absolute;
  top: -28rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 6rpx;
  height: 32rpx;
  background: #999;
  border-radius: 4rpx;
  z-index: 2;
  box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
}

.letter-summary {
  font-size: 22rpx;
  color: var(--ink);
  line-height: 1.5;
  margin-bottom: 8rpx;
  display: block;
}

.letter-date {
  font-size: 18rpx;
  color: var(--sage);
  display: block;
  text-align: right;
}

@keyframes draw-line {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}

@keyframes node-grow {
  0% { opacity: 0; transform: scale(0.6); }
  60% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}
</style>
