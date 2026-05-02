import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bgrrhvtqonltskrqchvo.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ddmf5guTL0IGrmFfc5x_Sg_-r4hnB_B';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
