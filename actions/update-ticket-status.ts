"use server"

import supabase from '@/lib/supabase'

export async function updateTicketStatus(ticketId: string, status: string) {
    const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticketId)

    if (error) {
        console.error('Error updating ticket status:', error)
        throw new Error('Fehler beim Aktualisieren des Ticket-Status')
    }

    return { success: true }
}

