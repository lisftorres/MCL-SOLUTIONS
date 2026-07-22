
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
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ""),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ""),
      // Passerelle IA OmniRoute (remplace l'appel direct au SDK Google GenAI)
      'process.env.OMNIROUTE_BASE_URL': JSON.stringify(env.VITE_OMNIROUTE_BASE_URL || env.OMNIROUTE_BASE_URL || "http://localhost:20128/v1"),
      'process.env.OMNIROUTE_API_KEY': JSON.stringify(env.VITE_OMNIROUTE_API_KEY || env.OMNIROUTE_API_KEY || ""),
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  };
});
