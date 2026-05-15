import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/cnpj': {
        target: 'https://publica.cnpj.ws',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cnpj/, '/cnpj'),
      },
    },
  },
})
