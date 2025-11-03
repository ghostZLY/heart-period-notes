import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const repoName = 'heart-period-notes'

export default defineConfig({
    plugins: [vue()],
    server: {
        port: 3000
    },
    // Vite特有的配置
    base: process.env.NODE_ENV === 'production'
        ? `/${repoName}/`  // Gitee Pages子路径
        : '/',             // 开发环境

    build: {
        outDir: '../dist',    // 构建输出目录
        assetsDir: 'assets' // 静态资源目录
    }
})