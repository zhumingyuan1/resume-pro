import { createClient } from '@supabase/supabase-js';

// Admin client bypasses RLS — server-side only, never expose to client
export function getAdminClient() {
  return createClient(
    'https://bgrrhvtqonltskrqchvo.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );
}
