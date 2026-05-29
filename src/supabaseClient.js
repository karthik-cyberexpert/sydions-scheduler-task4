import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://szybxvmtwgqveyksceak.supabase.co'
const supabaseAnonKey = 'sb_publishable_bS6bKE8oOSScjYjsivxJQA_75ntK_P6'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
