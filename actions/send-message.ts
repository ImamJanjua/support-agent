"use server"
import React from "react";
import Plunk from "@plunk/node";
import { render } from "@react-email/components";
import { TicketResponseEmail } from '@/email/emails/ticket-response-email'
import supabase from '@/lib/supabase'

const plunk = new Plunk(process.env.PLUNK_API_KEY!);

// Simple message structure
export type MessageSender = 'customer' | 'support'

export interface TicketMessage {
    message: string
    sender: MessageSender
    createdAt: string
}

export async function sendMessage(ticketId: string, message: string) {
    // Get the ticket from the database
    const { data: ticket, error: fetchError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single()

    if (fetchError || !ticket) {
        throw new Error('Failed to get ticket')
    }

    // Send the message to n8n workflow to process message
    const response = await fetch(`${process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL}/nachricht-optimieren`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message })
    })

    if (!response.ok) {
        throw new Error('Failed to send message to n8n')
    }

    // Get n8n response
    const responseText = await response.text()
    let n8nGenaratedMessage = message

    if (responseText.trim()) {
        try {
            const jsonData = JSON.parse(responseText)
            n8nGenaratedMessage = jsonData.output || message
        } catch {
            // Not JSON, use original message
        }
    }

    // Get current messages
    const currentMessages: TicketMessage[] = Array.isArray(ticket.nachrichten)
        ? (ticket.nachrichten as unknown as TicketMessage[])
        : []

    // Create new support message
    const newMessage: TicketMessage = {
        message: n8nGenaratedMessage,
        sender: 'support',
        createdAt: new Date().toISOString()
    }

    // Add new message to array
    const updatedMessages = [...currentMessages, newMessage]

    // Determine new status: if ticket is NEU, change to IN_BEARBEITUNG
    const newStatus = ticket.status === 'NEU' ? 'IN_BEARBEITUNG' : ticket.status

    // Update ticket with new messages, reset neue_nachricht flag, and update status if needed
    const { error: updateError } = await supabase
        .from('tickets')
        .update({
            nachrichten: updatedMessages as any,
            neue_nachricht: false,
            status: newStatus
        })
        .eq('id', ticketId)

    if (updateError) {
        throw new Error('Failed to update ticket with message')
    }

    // Send email to the user
    const ticketUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/ticket/${ticketId}`
        : undefined

    const emailHtml = await render(
        React.createElement(TicketResponseEmail, {
            ticketId: ticketId,
            personName: ticket.name ?? undefined,
            response: n8nGenaratedMessage,
            ticketTitle: (ticket as any).title ?? undefined,
            ticketStatus: ticket.status ?? undefined,
            ticketUrl: ticketUrl,
        })
    );

    if (!ticket.email) {
        throw new Error('Ticket has no email address')
    }

    plunk.emails.send({
        to: ticket.email,
        subject: `Re: ${(ticket as any).title || 'Ihr Ticket'} - ${ticket.id}`,
        body: emailHtml,
    });

    return { success: true }
}

// Function to add a customer message
export async function sendCustomerMessage(ticketId: string, message: string) {
    const { data: ticket, error: fetchError } = await supabase
        .from('tickets')
        .select('nachrichten')
        .eq('id', ticketId)
        .single()

    if (fetchError || !ticket) {
        throw new Error('Failed to get ticket')
    }

    const currentMessages: TicketMessage[] = Array.isArray(ticket.nachrichten)
        ? (ticket.nachrichten as unknown as TicketMessage[])
        : []

    const newMessage: TicketMessage = {
        message: message,
        sender: 'customer',
        createdAt: new Date().toISOString()
    }

    const { error: updateError } = await supabase
        .from('tickets')
        .update({ nachrichten: [...currentMessages, newMessage] as any, neue_nachricht: true })
        .eq('id', ticketId)

    if (updateError) {
        throw new Error('Failed to add customer message')
    }

    return { success: true }
}
