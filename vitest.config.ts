/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.git/**', 'test/e2e/**'],
    setupFiles: './test/setup.tsx',
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
