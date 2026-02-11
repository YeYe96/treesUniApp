import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import { UnifiedViteWeappTailwindcssPlugin } from 'weapp-tailwindcss/vite';

export default defineConfig({
  plugins: [
    uni(),
    UnifiedViteWeappTailwindcssPlugin({
      appType: 'uni-app-vite'
    })
  ]
});