import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ command, mode }) => {
  const isBuild = command === 'build'
  const isProd = mode === 'production'

  return {
    plugins: [react()],
    base: isBuild ? './' : '/',
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        'harmonyos-sans/sc-regular': resolve(__dirname, 'node_modules/harmonyos-sans-webfont-splitted/dist/HarmonyOS_Sans_SC/Regular.css'),
        'harmonyos-sans/sc-medium': resolve(__dirname, 'node_modules/harmonyos-sans-webfont-splitted/dist/HarmonyOS_Sans_SC/Medium.css'),
        'harmonyos-sans/sc-bold': resolve(__dirname, 'node_modules/harmonyos-sans-webfont-splitted/dist/HarmonyOS_Sans_SC/Bold.css'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: isProd ? false : 'inline',
      minify: isProd ? 'terser' : false,
      terserOptions: isProd ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug'],
        },
        format: {
          comments: false,
        },
      } : undefined,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@xyflow')) return 'vendor-xyflow'
              if (id.includes('@dnd-kit')) return 'vendor-dnd'
              if (id.includes('@floating-ui')) return 'vendor-floating'
              if (id.includes('lucide-react')) return 'vendor-lucide'
              if (id.includes('zustand')) return 'vendor-zustand'
              if (id.includes('prismjs')) return 'vendor-prism'
              if (id.includes('react')) return 'vendor-react'
              if (id.includes('lxgw-wenkai')) return 'fonts-lxgw'
              if (id.includes('harmonyos-sans')) return 'fonts-harmony'
              if (id.includes('noto-sans')) return 'fonts-noto'
              if (id.includes('@xterm')) return 'vendor-xterm'
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  }
})
