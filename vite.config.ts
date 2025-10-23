import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'
import postcssPresetEnv from 'postcss-preset-env'
import postcssPxToViewport from 'postcss-px-to-viewport-8-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 自定义元素白名单
          isCustomElement: tag => tag === 'marquee',
        },
      },
    }),
    // 自动导入 API
    AutoImport({
      // 自动导入 Vue 相关函数，如：ref, reactive, toRef 等
      imports: ['vue', 'vue-router', 'pinia'],
      // 自动导入 Vant 相关函数，如：showDialog, showToast 等
      resolvers: [VantResolver()],
      // 生成自动导入的类型声明文件
      dts: 'src/auto-imports.d.ts',
      // eslint 配置
      eslintrc: {
        enabled: true,
        filepath: './.eslintrc-auto-import.json',
        globalsPropValue: true,
      },
    }),
    // 自动注册组件
    Components({
      // 组件自动导入的目录
      dirs: ['src/components'],
      // 组件的有效文件扩展名
      extensions: ['vue'],
      // 配置文件生成位置
      dts: 'src/components.d.ts',
      // 自动导入 Vant 组件
      resolvers: [VantResolver()],
    }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@api': fileURLToPath(new URL('./src/api', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
      '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
    },
  },

  // 移动端兼容性配置
  esbuild: {
    // 生产环境去除 console 和 debugger
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },

  css: {
    postcss: {
      plugins: [
        postcssPresetEnv({
          // 移动端浏览器兼容性
          browsers: [
            'iOS >= 10',
            'Android >= 6',
            'last 2 versions',
          ],
        }),
        postcssPxToViewport({
          unitToConvert: 'px', // 要转换的单位，默认为"px"
          viewportWidth: 375, // 设计稿的视口宽度，一般是375
          unitPrecision: 6, // 单位转换后保留的精度
          propList: ['*'], // 能转化为vw的属性列表
          viewportUnit: 'vw', // 希望使用的视口单位
          fontViewportUnit: 'vw', // 字体使用的视口单位
          selectorBlackList: [
            '.ignore',
            '.hairlines',
            '.van-', // Vant 组件忽略
            '.dp-', // 第三方组件忽略
            '[data-no-vw]' // 自定义忽略属性
          ],
          minPixelValue: 1, // 最小的转换数值，如果为1的话，只有大于1的值会被转换
          mediaQuery: false, // 媒体查询里的单位是否需要转换单位
          replace: true, // 是否直接更换属性值，而不添加备用属性
          exclude: [
            /node_modules/,
            /\.van-/, // 排除 Vant 组件样式
            /src\/assets\/reset\.css/ // 排除重置样式文件
          ],
          landscape: false, // 是否处理横屏情况
        }),
      ],
    },
    preprocessorOptions: {
      // 配置 less
      less: {
        javascriptEnabled: true,
        // 全局变量文件
        additionalData: `@import "@/styles/variables.less";`,
      },
      // 配置 scss（如果需要）
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },

  build: {
    // 构建目标 - 移动端浏览器兼容
    target: ['es2015', 'chrome58', 'safari11'],
    // 输出目录
    outDir: 'dist',
    // 静态资源目录
    assetsDir: 'assets',
    // 小于此阈值的导入或引用资源将内联为 base64 编码
    assetsInlineLimit: 4096,
    // 启用/禁用 CSS 代码拆分
    cssCodeSplit: true,
    // 构建后是否生成 source map 文件
    sourcemap: process.env.NODE_ENV === 'development',
    // 打包配置
    rollupOptions: {
      output: {
        // 分包策略
        manualChunks: {
          // 将 vue 相关库打包到一个 chunk 中
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // 将 Vant 打包到一个 chunk 中
          'vant': ['vant'],
          // 将工具库打包到一个 chunk 中
          'utils': ['axios', 'dayjs', 'lodash-es'],
        },
        // 用于命名代码拆分时创建的共享块
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/') : []
          const fileName = facadeModuleId[facadeModuleId.length - 2] || '[name]'
          return `js/${fileName}/[name].[hash].js`
        },
        // 用于输出静态资源的命名
        assetFileNames: (assetInfo) => {
          const fileName = assetInfo.names?.[0] || assetInfo.name || 'asset'
          const info = fileName.split('.')
          let extType = info[info.length - 1]
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(fileName)) {
            extType = 'images'
          } else if (/\.(woff2?|eot|ttf|otf)$/i.test(fileName)) {
            extType = 'fonts'
          } else if (/\.css$/i.test(fileName)) {
            extType = 'css'
          }
          return `${extType}/[name].[hash].[ext]`
        },
        // 入口文件名
        entryFileNames: 'js/[name].[hash].js',
      },
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        // 生产环境移除 console
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
        // 移除无用代码
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log'] : [],
      },
      mangle: {
        // 保留函数名（便于调试）
        keep_fnames: process.env.NODE_ENV === 'development',
      },
    },
    // 设置打包文件大小警告限制
    chunkSizeWarningLimit: 1500,
  },

  server: {
    // 服务器主机名 - 允许外部访问（手机调试）
    host: '0.0.0.0',
    // 端口号
    port: 3000,
    // 自动打开浏览器
    open: true,
    // 开启 CORS
    cors: true,
    // 代理配置（如果需要）
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  // 预览服务器配置
  preview: {
    port: 4173,
    host: '0.0.0.0',
    open: true,
  },

  // 依赖优化配置
  optimizeDeps: {
    // 预构建包含的依赖
    include: [
      'vue',
      'vue-router',
      'pinia',
      'axios',
      'vant',
      'dayjs',
      'lodash-es',
    ],
    // 预构建中强制排除的依赖项
    exclude: ['@vant/touch-emulator'],
  },

  // 定义全局常量替换方式
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __DEV__: process.env.NODE_ENV === 'development',
    __PROD__: process.env.NODE_ENV === 'production',
  },
})
