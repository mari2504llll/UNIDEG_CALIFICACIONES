import { createClient } from '@supabase/supabase-js'

// Valores de respaldo directos (la anon key está diseñada para ser pública,
// es segura de tener aquí). Si más adelante configuras bien las variables
// de entorno en Vercel, esas tendrán prioridad automáticamente.
const FALLBACK_URL = 'https://qxhddsrtvwuocttmzfxv.supabase.co'
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aGRkc3J0dnd1b2N0dG16Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTc3MzEsImV4cCI6MjEwMTk3MzczMX0.XhTPQ08zdCOHngu8C0640R6S9x9yVv_4k6JnIussFj8'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
