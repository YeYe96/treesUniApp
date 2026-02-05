import { createSSRApp } from 'vue';
import App from './App.vue';
import './styles/theme.css';
import './styles/tailwind.css';
import './styles/app.css';

export function createApp() {
  const app = createSSRApp(App);
  return {
    app
  };
}
