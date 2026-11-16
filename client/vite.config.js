import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The "proxy" forwards every request starting with /api to the Node server.
// So in React we can simply call fetch('/api/...') without writing the full URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
