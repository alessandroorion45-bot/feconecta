import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// import { componentTagger } from "lovable-tagger"; // REMOVIDO - causava lentidão
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // PWA: SW próprio (injectManifest) mantendo os handlers de push +
    // precache versionado a cada deploy. Manifest fica em public/manifest.json.
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}', 'icons/icon-*.png', 'icons/maskable-*.png'],
        globIgnores: ['**/splash/**', 'alianca-logo.png', 'placeholder.svg'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
    // Gzip compression
    mode === "production" && viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Comprimir arquivos > 1KB
      deleteOriginFile: false,
    }),
    // Brotli compression (melhor que gzip)
    mode === "production" && viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    // Otimizações EXTREMAS para produção e escalabilidade
    target: 'es2020',
    minify: 'terser',
    cssMinify: true,
    cssCodeSplit: true,
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        pure_funcs: [],
        passes: 3,
        ecma: 2020,
        module: true,
        toplevel: true,
        unsafe_arrows: true,
        unsafe_methods: true,
      },
      mangle: {
        safari10: true,
        toplevel: true,
      },
      format: {
        comments: false,
        ecma: 2020,
      },
    },
    rollupOptions: {
      output: {
        // Fatia o vendor pesado: cada lib grande vira um chunk próprio, cacheável
        // e baixado em paralelo. Libs só usadas em rotas lazy (charts/flow) já
        // ficam fora do carregamento inicial.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Só react/react-dom/scheduler num chunk próprio (folha estável,
          // muito cacheável). Não fatiar o resto: evita chunks circulares e
          // deixa o Rollup agrupar por grafo de imports.
          if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react-vendor';
          return undefined;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    reportCompressedSize: false,
    assetsInlineLimit: 4096,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    exclude: ['@tanstack/react-query-devtools'],
  },
}));
