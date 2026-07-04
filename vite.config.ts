import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 1000,
      // CSS code splitting - each chunk gets its own CSS
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // React core — smallest, loaded first, cached longest
            if (id.includes('node_modules/react/') ||
                id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/react-router-dom/') ||
                id.includes('node_modules/scheduler/')) {
              return 'vendor-react';
            }
            // Firebase — large but cached after first load
            if (id.includes('node_modules/firebase/') ||
                id.includes('node_modules/@firebase/')) {
              return 'vendor-firebase';
            }
            // Animation
            if (id.includes('node_modules/motion') ||
                id.includes('node_modules/framer-motion')) {
              return 'vendor-motion';
            }
            // Icons
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            // Rich text editor — admin only
            if (id.includes('node_modules/@tiptap')) {
              return 'vendor-editor';
            }
            // Charts — admin CRM only
            if (id.includes('node_modules/recharts') ||
                id.includes('node_modules/d3-') ||
                id.includes('node_modules/victory-')) {
              return 'vendor-charts';
            }
            // PDF + Excel export — admin only
            if (id.includes('node_modules/jspdf') ||
                id.includes('node_modules/xlsx') ||
                id.includes('node_modules/html2canvas')) {
              return 'vendor-export';
            }
          },
          // Consistent chunk naming for better cache headers
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
      sourcemap: false,
      minify: 'esbuild',
      // Strip console.log/warn/debug statements in production builds
      // console.error kept for critical errors
      esbuild: {
        drop: ['debugger'],
        pure: ['console.log', 'console.warn', 'console.debug', 'console.info'],
      },
    },
  };
});
