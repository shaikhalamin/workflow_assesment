import { defineConfig } from 'vitest/config'
import { createLogger, type LogErrorOptions } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'

const logger = createLogger()
const logError = logger.error.bind(logger)

logger.error = (message: string, options?: LogErrorOptions) => {
  const isSocketProxyError =
    message.includes('http proxy error: /socket.io/') ||
    message.includes('ws proxy error:') ||
    message.includes('ws proxy socket error:')

  if (isSocketProxyError) return

  logError(message, options)
}

// https://vite.dev/config/
export default defineConfig({
  customLogger: logger,
  plugins: [
    TanStackRouterVite({
      routesDirectory: 'src/routes',
      generatedRouteTree: 'src/routeTree.gen.ts',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8870',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:8870',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
})
