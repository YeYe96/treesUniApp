const { defineConfig } = require('vite');
const uni = require('@dcloudio/vite-plugin-uni');
const { UnifiedViteWeappTailwindcssPlugin } = require('weapp-tailwindcss/vite');

module.exports = defineConfig(() => {
  const weappTw = UnifiedViteWeappTailwindcssPlugin({
    appType: 'uni-app-vite'
  }) || [];

  return {
    plugins: [
      uni(),
      ...weappTw
    ]
  };
});
