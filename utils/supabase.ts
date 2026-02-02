import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// CHANGE THIS LINE: Use the variable name currently in your .env file
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// This client runs on the server only, so it's safe to use the Service Role Key
export const supabase = createClient(supabaseUrl, supabaseKey)