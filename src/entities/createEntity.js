import { supabase } from '@/lib/supabaseClient'

const toSnake = (str) => str.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)
const toCamel = (str) => str.replace(/_([a-z])/g, (_, l) => l.toUpperCase())

const snakeKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [toSnake(k), v]))
}

const camelKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [toCamel(k), v]))
}

export const createEntity = (tableName) => ({
  async get(id) {
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single()
    if (error) throw error
    return camelKeys(data)
  },

  async filter(filters = {}, orderByField = null) {
    let query = supabase.from(tableName).select('*')
    for (const [k, v] of Object.entries(snakeKeys(filters))) {
      if (v !== undefined && v !== null) query = query.eq(k, v)
    }
    if (orderByField) query = query.order(toSnake(orderByField))
    const { data, error } = await query
    if (error) throw error
    return (data || []).map(camelKeys)
  },

  async create(record) {
    const { data, error } = await supabase
      .from(tableName).insert(snakeKeys(record)).select().single()
    if (error) throw error
    return camelKeys(data)
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from(tableName).update(snakeKeys(updates)).eq('id', id).select().single()
    if (error) throw error
    return camelKeys(data)
  },

  async delete(id) {
    const { error } = await supabase.from(tableName).delete().eq('id', id)
    if (error) throw error
  }
})
