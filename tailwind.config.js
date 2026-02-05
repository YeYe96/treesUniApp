module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts}'
  ],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Times New Roman"', 'Songti SC', 'SimSun', 'serif'],
        sans: ['"Helvetica Neue"', 'PingFang SC', 'Microsoft YaHei', 'sans-serif']
      }
    }
  },
  plugins: []
};
