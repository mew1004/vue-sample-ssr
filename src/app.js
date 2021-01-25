/**
 * 通用启动入口
 */
import Vue from 'vue'
import App from './App.vue'
import { createRouter } from './router/index'
import { createStore } from './store/index'
import VueMeta from 'vue-meta';
//注册VueMeta
Vue.use(VueMeta);
//设置页面标题模板
Vue.mixin({
  metaInfo: {
    titleTemplate: '%s - 教育'
  }
});

// 导出一个工厂函数，用于创建新的
// 应用程序、router 和 store 实例
export function createApp () {
  const router = createRouter();
  const store = createStore();
  const app = new Vue({
    router, //把路由挂载到Vue根实例中
    store, //把store挂载到Vue根实例中
    render: h => h(App) // 根实例简单的渲染应用程序组件。
  })
  return { app, router, store }
}
