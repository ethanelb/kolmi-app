import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mcqdaplnjswacvifezdf.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jcWRhcGxuanN3YWN2aWZlemRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjY1NDEsImV4cCI6MjA5NTQwMjU0MX0.eYW5jgA1Hr01dq8ePzrwTQwDkr9Xcpsx-VNJSR-yFUE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
