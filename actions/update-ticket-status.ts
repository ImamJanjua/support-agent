"use server"

import supabase from '@/lib/supabase'

export async function updateTicketStatus(ticketId: string, status: string) {
    // When closing a ticket, also reset neue_nachricht to false
    const updateData: { status: string; neue_nachricht?: boolean } = { status }
    if (status === 'ABGESCHLOSSEN') {
        updateData.neue_nachricht = false
    }

    const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId)

    if (error) {
        console.error('Error updating ticket status:', error)
        throw new Error('Fehler beim Aktualisieren des Ticket-Status')
    }

    return { success: true }
}

