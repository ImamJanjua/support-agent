import { createClient } from '@supabase/supabase-js'
import { Database } from '@/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
export default supabase

export async function getTickets() {
    const { data, error } = await supabase.from('tickets').select('*')
    if (error) {
        console.error('Error fetching tickets:', error)
        return null
    }
    return data
}

export async function getTicketById(id: string) {
    const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching ticket:', error)
        return null
    }
    return data
}