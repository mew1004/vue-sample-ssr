import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '@/pages/home';

Vue.use(VueRouter);

export const createRouter = () => {
    const router = new VueRouter({
        mode: 'history', //兼容前后端
        routes: [
            {
                path: '/',
                name: 'home',
                component: Home
            },
            {
                path: '/about',
                name: 'about',
                component: () => import('@/pages/about')
            },
            {
                path: '/posts',
                name: 'posts',
                component: () => import('@/pages/posts')
            },
            {
                path: '*',
                name: 'error',
                component: () => import('@/pages/404')
            }
        ]
    });

    return router;
}