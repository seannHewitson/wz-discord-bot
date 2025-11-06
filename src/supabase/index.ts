import { createClient } from '@supabase/supabase-js'

import { config } from '../config'
import { Database } from './types'

export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.service_role
)
