import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { format } from 'https://esm.sh/date-fns@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shortcut-token',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
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

    const body = await req.json()
    const { categoryName, amount } = body

    if (!categoryName || amount === undefined || amount === null) {
      return new Response(JSON.stringify({ error: 'Missing categoryName or amount' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const delta = parseFloat(amount)
    if (isNaN(delta) || delta <= 0) {
      return new Response(JSON.stringify({ error: 'amount must be a positive number' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get household
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

    const householdId = profile.household_id

    // Find category by name
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('household_id', householdId)
      .eq('name', categoryName)
      .single()

    if (!category) {
      return new Response(JSON.stringify({ error: `Category "${categoryName}" not found` }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Determine current budget month using reset_day from household
    const { data: household } = await supabase
      .from('households')
      .select('reset_day')
      .eq('id', householdId)
      .single()

    const resetDay = household?.reset_day || 1
    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const periodStart = currentDay >= resetDay
      ? new Date(currentYear, currentMonth, resetDay)
      : new Date(currentYear, currentMonth - 1, resetDay)
    const currentMonthStr = format(periodStart, 'yyyy-MM')

    // Find existing instance
    const { data: instance } = await supabase
      .from('category_instances')
      .select('id, current_amount')
      .eq('category_id', category.id)
      .eq('household_id', householdId)
      .eq('month', currentMonthStr)
      .single()

    if (!instance) {
      return new Response(JSON.stringify({ error: 'Instance not found for current month' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const newAmount = (parseFloat(instance.current_amount) || 0) + delta

    const { error: updateError } = await supabase
      .from('category_instances')
      .update({ current_amount: newAmount })
      .eq('id', instance.id)

    if (updateError) throw updateError

    // Update last_update_time in profiles
    await supabase
      .from('profiles')
      .update({ last_update_time: new Date().toISOString() })
      .eq('id', user.id)

    return new Response(JSON.stringify({
      success: true,
      categoryName,
      added: delta,
      newTotal: newAmount
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
