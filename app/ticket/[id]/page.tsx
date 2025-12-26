'use client'

import { getTicketById } from '@/lib/supabase'
import { useState, useEffect, useRef } from 'react'
import { Database } from '@/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { useParams } from 'next/navigation'
import { toast } from "sonner"
import { sendCustomerMessage, type TicketMessage } from '@/actions/send-message'
import Link from 'next/link'

type Ticket = Database['public']['Tables']['tickets']['Row']

// Helper function to format status for display (IN_BEARBEITUNG -> In Bearbeitung)
function formatStatusForDisplay(status: string | null): string {
    if (!status) return 'Unbekannt'
    return status
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

export default function TicketPage() {
    const params = useParams()
    const ticketId = params.id as string

    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<TicketMessage[]>([])
    const [messageText, setMessageText] = useState('')
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchTicket = async () => {
            if (!ticketId) return

            try {
                const data = await getTicketById(ticketId)
                if (data) {
                    setTicket(data)
                    // Load messages
                    if (data.nachrichten) {
                        const ticketMessages = Array.isArray(data.nachrichten)
                            ? (data.nachrichten as unknown as TicketMessage[])
                            : []
                        const sortedMessages = [...ticketMessages].sort((a, b) =>
                            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        )
                        setMessages(sortedMessages)
                    }
                } else {
                    toast.error('Ticket nicht gefunden')
                }
            } catch (error) {
                console.error('Error fetching ticket:', error)
                toast.error('Fehler beim Laden des Tickets')
            } finally {
                setLoading(false)
            }
        }

        fetchTicket()
    }, [ticketId])

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSubmit = async () => {
        if (!ticketId || !messageText.trim() || sending) return

        setSending(true)
        try {
            await sendCustomerMessage(ticketId, messageText)
            setMessageText('')

            // Refresh ticket to get updated messages
            const data = await getTicketById(ticketId)
            if (data && data.nachrichten) {
                const ticketMessages = Array.isArray(data.nachrichten)
                    ? (data.nachrichten as unknown as TicketMessage[])
                    : []
                const sortedMessages = [...ticketMessages].sort((a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                )
                setMessages(sortedMessages)
            }

            toast.success('Nachricht gesendet')
        } catch (error) {
            toast.error('Fehler beim Senden')
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground">Lade Ticket...</p>
                </div>
            </div>
        )
    }

    if (!ticket) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <p className="text-muted-foreground mb-4">Ticket nicht gefunden</p>
                        <Button asChild variant="outline">
                            <Link href="/">Zurück zur Übersicht</Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="mb-6">

                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between flex-wrap gap-4">
                            <div className="flex-1">
                                <CardTitle className="text-2xl mb-2">
                                    {(ticket as any).title || 'Ticket'}
                                </CardTitle>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline">
                                        {formatStatusForDisplay(ticket.status)}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        Ticket #{ticket.id.slice(0, 8)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    {ticket.anliegen && (
                        <CardContent>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {ticket.anliegen}
                            </p>
                        </CardContent>
                    )}
                </Card>
            </div>

            {/* Chat Interface */}
            <Card className="h-[600px] flex flex-col">
                <CardHeader className="border-b">
                    <CardTitle className="text-lg">Nachrichten</CardTitle>
                </CardHeader>

                {/* Chat Messages Area */}
                <CardContent className="flex-1 overflow-y-auto space-y-4 py-4">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>Noch keine Nachrichten</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, index) => {
                                const isSupport = msg.sender === 'support'
                                return (
                                    <div
                                        key={index}
                                        className={`flex ${isSupport ? 'justify-start' : 'justify-end'}`}
                                    >
                                        <div
                                            className={`max-w-[75%] rounded-lg px-4 py-2 ${isSupport
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted'
                                                }`}
                                        >
                                            <p className={`text-sm whitespace-pre-wrap ${isSupport ? 'text-primary-foreground' : 'text-foreground'}`}>
                                                {msg.message}
                                            </p>
                                            <p className={`text-xs mt-1 ${isSupport ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                {new Date(msg.createdAt).toLocaleString('de-DE', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </CardContent>

                {/* Input Area */}
                <div className="border-t p-4">
                    <div className="flex gap-2">
                        <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && messageText.trim()) {
                                    handleSubmit()
                                }
                            }}
                            placeholder="Schreiben Sie eine Nachricht... (Cmd/Ctrl + Enter zum Senden)"
                            className="flex-1 min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                            disabled={sending}
                        />
                        <Button
                            onClick={handleSubmit}
                            disabled={!messageText.trim() || sending}
                            size="icon"
                            className="h-[80px]"
                        >
                            <Send className="size-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}

