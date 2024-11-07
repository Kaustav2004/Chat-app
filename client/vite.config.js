import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx', // Tell esbuild to handle .js files as JSX
    include: /src\/.*\.js$/, // Include JavaScript files in the src folder for JSX parsing
  },
});