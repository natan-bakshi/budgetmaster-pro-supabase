import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const body = await req.json()
    const { categoryName, amount } = body
    if (!categoryName || !amount || isNaN(Number(amount))) {
      return new Response(JSON.stringify({ error: 'categoryName and amount are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Get householdId
    const { data: profile } = await supabase
      .from('profiles')
      .select('household_id')
      .eq('id', user.id)
      .single()
    if (!profile?.household_id) {
      return new Response(JSON.stringify({ error: 'No household' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const householdId = profile.household_id

    // Find category by name
    const { data: categories } = await supabase
      .from('categories')
      .select('id')
      .eq('household_id', householdId)
      .eq('type', 'expense')
      .ilike('name', categoryName)
      .limit(1)
    if (!categories || categories.length === 0) {
      return new Response(JSON.stringify({ error: 'Category not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const categoryId = categories[0].id

    // Get current month string (YYYY-MM) — based on today
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Find current instance
    const { data: instances } = await supabase
      .from('category_instances')
      .select('id, current_amount')
      .eq('household_id', householdId)
      .eq('category_id', categoryId)
      .eq('month', currentMonth)
      .limit(1)

    const delta = Number(amount)

    if (instances && instances.length > 0) {
      const instance = instances[0]
      const newAmount = (Number(instance.current_amount) || 0) + delta
      await supabase
        .from('category_instances')
        .update({ current_amount: newAmount })
        .eq('id', instance.id)
      return new Response(
        JSON.stringify({ success: true, newAmount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Instance doesn't exist yet — create it
      const newAmount = delta
      await supabase.from('category_instances').insert({
        category_id: categoryId,
        household_id: householdId,
        current_amount: newAmount,
        month: currentMonth,
        notes: ''
      })
      return new Response(
        JSON.stringify({ success: true, newAmount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
