          </view>
        </view>

        <view class="content-body vertical-text">
          <text>{{ letterContent }}</text>
        </view>

        <view class="card-footer">
          <view class="qr-placeholder">分享取信码</view>
          <view class="stamp-seal">已封缄</view>
        </view>
      </view>
    </view>

    <view class="action-footer">
      <text class="hint-text">信件已封缄，可保存后分享取信码。</text>
      <view class="btn-save" @tap="onSave">
        <text>保存到相册</text>
      </view>
      <view class="btn-back" @tap="onBack">返回信件列表</view>
    </view>
  </view>
</template>

<script>
import { consumeRoutePayload } from '@/utils/route-payload';

export default {
  data() {
    return {
      letterContent: 'The seed of silence...',
      code: ''
    };
  },
  onLoad(options) {
    const payload = consumeRoutePayload(options.payloadKey);
    if (payload && payload.content) {
      this.letterContent = payload.content;
      this.code = payload.code || '';
      if (!payload.code) {
        console.warn('sealed page missing codeValue in payload', payload);
      }
      return;
    }
    uni.showToast({ title: '信件数据已失效，请重新写信', icon: 'none' });
  },
  methods: {
    onSave() {
      uni.vibrateShort({ type: 'medium' });
      uni.showToast({ title: '已保存（演示）', icon: 'success' });
    },
    onBack() {
      uni.switchTab({ url: '/pages/desk/index' });
    }
  }
};
</script>

<style scoped>
.page-sealed {
  background-color: #d3dcd6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.card-container {
  width: 100%;
  max-width: 600rpx;
  background: white;
  padding: 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
  border-radius: 4rpx;
  margin-bottom: 60rpx;
  min-height: 800rpx;
  position: relative;
  display: flex;
  justify-content: center;
}

.paper-card {
  width: 100%;
  border: 1px solid #f0f0f0;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  position: relative;
  background-image: linear-gradient(to bottom right, #fff, #f9f9f9);
}

.card-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
  padding-bottom: 20rpx;
  margin-bottom: 40rpx;
}

.card-title {
  font-family: var(--font-serif);
  font-size: 32rpx;
  font-weight: bold;
  color: var(--ink);
}

.archive-no {
  text-align: right;
  font-size: 16rpx;
  color: var(--ink-light);
  display: flex;
  flex-direction: column;
}

.code-text {
  font-family: var(--font-sans);
  font-size: 24rpx;
  letter-spacing: 2rpx;
}

.content-body {
  flex: 1;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  line-height: 2;
  font-size: 28rpx;
  color: var(--ink);
  padding: 20rpx;
  align-self: center;
  margin-right: 40rpx;
  max-height: 500rpx;
  overflow: hidden;
}

.card-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-top: 40rpx;
}

.qr-placeholder {
  width: 100rpx;
  height: 100rpx;
  background: #eee;
  font-size: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.stamp-seal {
  border: 4rpx solid var(--rust);
  color: var(--rust);
  padding: 8rpx 20rpx;
  font-size: 24rpx;
  transform: rotate(-15deg);
  opacity: 0.8;
  font-weight: bold;
  letter-spacing: 4rpx;
}

.action-footer {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hint-text {
  font-family: var(--font-serif);
  font-size: 24rpx;
  color: var(--trunk);
  opacity: 0.6;
  margin-bottom: 24rpx;
  font-style: italic;
}

.btn-save {
  background-color: #5a6b5d;
  color: white;
  padding: 24rpx 60rpx;
  border-radius: 4rpx;
  font-size: 26rpx;
  letter-spacing: 4rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
  margin-bottom: 20rpx;
}

.btn-back {
  font-size: 24rpx;
  color: var(--trunk);
  text-decoration: underline;
  opacity: 0.6;
}
</style>
