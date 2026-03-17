import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bxmbqrbwcfkltuscutcn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4bWJxcmJ3Y2ZrbHR1c2N1dGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3Nzk1MzMsImV4cCI6MjA4OTM1NTUzM30.ljdXo54qgIArddk5FLpPK-eWIy6LK5IYsCmX-bd77Fc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    