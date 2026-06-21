import { defineConfig } from 'vite'
import dns from 'dns'
import react from '@vitejs/plugin-react-swc'

dns.setDefaultResultOrder('verbatim')

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
