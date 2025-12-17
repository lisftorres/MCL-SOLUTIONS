
import { createClient } from '@supabase/supabase-js';

// Les identifiants sont récupérés via process.env configuré dans vite.config.ts.
// @ts-ignore
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// @ts-ignore
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// On n'initialise le client que si les variables sont présentes pour éviter l'erreur "supabaseUrl is required"
// Sinon on exporte null, et l'application basculera en mode démo (MOCK_DATA).
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
