
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ihjgihivlvmcjonkbzbf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloamdpaGl2bHZtY2pvbmtiemJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTI2OTUsImV4cCI6MjA4MTQ2ODY5NX0.Dd5VvBsSdyZrRK4m-4KpnNcRxmrKUZgkfGZ_ue9n09Q';

export const supabase = createClient(supabaseUrl, supabaseKey);
