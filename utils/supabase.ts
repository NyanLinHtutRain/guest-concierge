import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// This client runs on the server only, so it's safe to use the Service Role Key
export const supabase = createClient(supabaseUrl, supabaseKey)