import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    // Use service role to look up by shortcut_api_key (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Find profile by shortcut_api_key
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, household_id')
      .eq('shortcut_api_key', apiKey)
      .single()

    if (profileError || !profile) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    if (!profile.household_id) {
      return new Response(JSON.stringify({ error: 'No household' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('household_id', profile.household_id)
      .eq('type', 'expense')
      .order('order')

    if (catError) throw catError

    const names = (categories || []).map((c: any) => c.name)

    return new Response(
      JSON.stringify({ categories: names }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
