import { createClient } from '@supabase/supabase-js'

// This client uses the SERVICE ROLE KEY
// It bypasses ALL Row Level Security (RLS) policies
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)