import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        // Proxy WhatsApp API requests to avoid CORS issues in development
        '/api/whatsapp': {
          target: env.WHATSAPP_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/whatsapp/, '/api'),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Add basic auth header from environment variables
              const username = env.WHATSAPP_API_USERNAME || 'admin';
              const password = env.WHATSAPP_API_PASSWORD || '';
              const auth = Buffer.from(`${username}:${password}`).toString('base64');
              proxyReq.setHeader('Authorization', `Basic ${auth}`);
            });
          }
        }
      }
    },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor dependencies - React ecosystem
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          
          // React Router
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }

          // UI components - Radix UI
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui-radix';
          }


          // Supabase
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }

          // React Query
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'react-query';
          }

          // Date utilities
          if (id.includes('node_modules/date-fns')) {
            return 'date-utils';
          }

          // Lucide icons
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }

          // DOMPurify
          if (id.includes('node_modules/dompurify') || id.includes('node_modules/isomorphic-dompurify')) {
            return 'purify';
          }

          // Other large vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js', '@tanstack/react-query']
  },
  // PWA Configuration
  define: {
    __PWA_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
}});
