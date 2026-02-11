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
      colors: {
        // Monument Valley / Limbo Inspired Palette (Refreshing & Clean)
        bg: {
          mist: '#F0F4F8', // 晨雾白
          night: '#2B2D42', // 深夜蓝
        },
        tree: {
          trunk: '#8D99AE', // 冷灰树干
          wood: '#D4A373',  // 暖木
        },
        leaf: {
          me: '#E76F51',    // 陶土红 (Me)
          meLight: '#F4A261',
          you: '#2A9D8F',   // 松石绿 (You)
          youLight: '#A8DADC',
        },
        ui: {
          primary: '#264653', // 深青 (UI Text/Icons)
          secondary: '#E9C46A', // 点缀金
          disabled: '#BDC3C7',
        }
      },
      fontFamily: {
        serif: ['"Times New Roman"', 'Songti SC', 'SimSun', 'serif'],
        sans: ['"Helvetica Neue"', 'PingFang SC', 'Microsoft YaHei', 'sans-serif']
      },
      boxShadow: {
        // Hard shadows for geometric feel
        'geo-sm': '4px 4px 0px rgba(38, 70, 83, 0.1)',
        'geo-md': '8px 8px 0px rgba(38, 70, 83, 0.1)',
        'geo-float': '10px 15px 0px rgba(38, 70, 83, 0.1)',
      }
    }
  },
  plugins: []
};
