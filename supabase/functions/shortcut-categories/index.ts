import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shortcut-key',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Auth: JWT from Authorization header (Supabase user token)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    // Get householdId from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('household_id')
      .eq('id', user.id)
      .single()
    if (profileError || !profile?.household_id) {
      return new Response(JSON.stringify({ error: 'No household' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Get expense categories for this household
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('household_id', profile.household_id)
      .eq('type', 'expense')
      .order('order')
    if (catError) throw catError

    const names = (categories || []).map((c: { id: string; name: string }) => c.name)

    return new Response(
      JSON.stringify({ categories: names }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
