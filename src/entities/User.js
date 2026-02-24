import { supabase } from '@/lib/supabaseClient'

const toProfile = (row) => row ? {
  id: row.id,
  email: row.email,
  full_name: row.full_name,
  householdId: row.household_id,
  role: row.role,
  lastResetCheck: row.last_reset_check,
} : null

export const User = {
  async me() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    if (error) throw error
    return toProfile(data)
  },

  async filter(filters = {}) {
    let query = supabase.from('profiles').select('*')
    if (filters.householdId) query = query.eq('household_id', filters.householdId)
    if (filters.email) query = query.eq('email', filters.email)
    const { data, error } = await query
    if (error) throw error
    return (data || []).map(toProfile)
  },

  // Find user by email using a security-definer RPC (bypasses RLS safely)
  async findByEmail(email) {
    const { data, error } = await supabase.rpc('find_user_by_email', { p_email: email })
    if (error) throw error
    return (data || []).map(toProfile)
  },

  async update(id, updates) {
    const dbUpdates = {}
    if (updates.householdId !== undefined) dbUpdates.household_id = updates.householdId
    if (updates.role !== undefined) dbUpdates.role = updates.role
    if (updates.lastResetCheck !== undefined) dbUpdates.last_reset_check = updates.lastResetCheck
    const { data, error } = await supabase
      .from('profiles').update(dbUpdates).eq('id', id).select().single()
    if (error) throw error
    return toProfile(data)
  },

  // Admin-only: update another user's profile via security-definer RPC
  async adminUpdate(targetId, updates) {
    const params = { p_member_id: targetId }
    if (updates.householdId !== undefined) params.p_household_id = updates.householdId
    if (updates.role !== undefined) params.p_role = updates.role
    const { error } = await supabase.rpc('update_member_profile', params)
    if (error) throw error
  },

  async updateMyUserData(updates) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    return this.update(user.id, updates)
  },

  async logout() {
    await supabase.auth.signOut()
  }
}
