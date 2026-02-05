<template>
  <view class="app-root">
    <slot />
  </view>
</template>

<script>
export default {
  onLaunch() {
    // 仅微信小程序环境初始化云开发
    // #ifdef MP-WEIXIN
    if (!wx.cloud) {
      // eslint-disable-next-line no-console
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    wx.cloud.init({
      env: 'cloud1-3g8u682ze3797b1d',
      traceUser: true
    });
    // #endif
  }
};
</script>

<style>
.app-root {
  min-height: 100vh;
}
</style>
