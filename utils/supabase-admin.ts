import { createClient } from '@supabase/supabase-js'

// This client uses the SERVICE ROLE KEY
// It bypasses ALL Row Level Security (RLS) policies

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey
)