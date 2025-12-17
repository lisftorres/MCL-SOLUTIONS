
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
      // On définit les variables individuellement pour éviter d'écraser l'objet process.env global
      // Cela permet à process.env.API_KEY de fonctionner pour le SDK Google (strictement requis)
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY || ""),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ""),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ""),
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  };
});
