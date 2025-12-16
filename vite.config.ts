import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Charge les variables d'environnement depuis .env ou le système (Vercel)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    server: {
      port: 3000
    },
    define: {
      // On définit process.env comme un objet contenant nos clés
      // Cela permet à process.env.API_KEY de fonctionner pour le SDK Google
      // Et évite que "process" soit undefined pour d'autres librairies
      'process.env': {
        API_KEY: env.VITE_API_KEY || env.API_KEY,
        NODE_ENV: mode
      }
    }
  };
});