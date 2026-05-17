import { defineConfig } from 'vite';

export default defineConfig({
  base: '',   // относительные пути – универсально для GitHub Pages
  server: {
    host: true,
    port: 8000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,  // удалит console.log
      drop_debugger: true
    }
  }
}
});



