import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // allowedHosts: [
    //   "matterful-denotatively-thaddeus.ngrok-free.dev"
    // ]
    port: 5173
  }
})
