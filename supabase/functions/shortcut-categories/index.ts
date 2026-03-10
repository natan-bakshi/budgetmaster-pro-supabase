import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shortcut-token',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Auth: expect Bearer token (Supabase anon key) or x-shortcut-token header
    const authHeader = req.headers.get('authorization') || ''
    const shortcutToken = req.headers.get('x-shortcut-token') || ''
    const token = shortcutToken || authHeader.replace('Bearer ', '')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get user's householdId from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('household_id')
      .eq('id', user.id)
      .single()

    if (!profile?.household_id) {
      return new Response(JSON.stringify({ error: 'No household found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch expense categories only (sorted by order)
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('household_id', profile.household_id)
      .eq('type', 'expense')
      .order('order', { ascending: true })

    if (catError) throw catError

    const names = (categories || []).map(c => c.name)

    return new Response(JSON.stringify({ categories: names }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
