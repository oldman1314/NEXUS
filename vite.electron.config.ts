import { defineConfig } from 'vite'
import { resolve } from 'path'
import { builtinModules } from 'module'

const entryName = process.env.ENTRY || 'main'

const entries: Record<string, string> = {
  main: resolve(__dirname, 'electron/main.ts'),
  preload: resolve(__dirname, 'electron/preload.ts'),
}

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist-electron',
    emptyOutDir: entryName === 'main',
    minify: true,
    lib: {
      entry: entries[entryName],
      formats: ['cjs'],
      fileName: () => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        'electron',
        'ssh2',
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
      ],
    },
  },
})
