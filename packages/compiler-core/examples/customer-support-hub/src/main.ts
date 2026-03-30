import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import 'antd/dist/reset.css';
import './styles/app.scss';

createApp(App).use(router).mount('#app');