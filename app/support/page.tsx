'use client'
import { getTickets } from '@/lib/supabase'
import { useState, useEffect, useMemo } from 'react'
import { Database } from '@/database.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Calendar, User, Mail, MessageSquare, Reply, Bell } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { toast } from "sonner"
import { sendMessage, type TicketMessage } from '@/actions/send-message'
import { updateTicketStatus } from '@/actions/update-ticket-status'
import { Send, CheckCircle2 } from 'lucide-react'
import { useRef } from 'react'
import supabase from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Ticket = Database['public']['Tables']['tickets']['Row']

// Helper function to format status for display (IN_BEARBEITUNG -> In Bearbeitung)
function formatStatusForDisplay(status: string | null): string {
    if (!status) return 'Kein Status'
    return status
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

// Helper function to get status badge variant
function getStatusVariant(status: string | null): "default" | "secondary" | "destructive" | "outline" {
    if (!status) return "outline"
    const normalizedStatus = status.toLowerCase().replace(/_/g, ' ')
    if (normalizedStatus === 'neu') return "default"
    if (normalizedStatus === 'in bearbeitung') return "secondary"
    if (normalizedStatus === 'abgeschlossen') return "outline"
    return "secondary"
}

// Helper function to get status badge class for better distinction
function getStatusBadgeClass(status: string | null): string {
    if (!status) return ""
    const normalizedStatus = status.toLowerCase().replace(/_/g, ' ')
    if (normalizedStatus === 'neu') return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
    if (normalizedStatus === 'in bearbeitung') return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
    if (normalizedStatus === 'abgeschlossen') return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
    return ""
}

// Helper function to format date
function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
}

// Helper function to format priority for display (HOCH -> Hoch)
function formatPriorityForDisplay(priority: string): string {
    return priority
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

// Helper function to get priority from ticket (from priority field or inferred from status)
function getPriority(ticket: Ticket & { priority?: string }): string {
    // Use prioritaet field if available (database field name is prioritaet)
    if (ticket.prioritaet) {
        return ticket.prioritaet.toUpperCase()
    }
    // Fallback: infer from status
    const status = ticket.status?.toLowerCase().replace(/_/g, ' ') || ''
    if (status === 'in bearbeitung') return 'HOCH'
    if (status === 'neu') return 'MITTEL'
    return 'NIEDRIG'
}

// Helper function to get priority badge class for better distinction
function getPriorityBadgeClass(priority: string): string {
    const normalizedPriority = priority.toUpperCase()
    if (normalizedPriority === 'HOCH') return "!bg-red-500/5 !text-red-600 dark:!text-red-400 !border-red-500/10"
    if (normalizedPriority === 'MITTEL') return "!bg-orange-500/5 !text-orange-600 dark:!text-orange-400 !border-orange-500/10"
    return "!bg-gray-500/5 !text-gray-600 dark:!text-gray-400 !border-gray-500/10"
}

async function handleSendMessage(ticketId: string, message: string) {
    return sendMessage(ticketId, message)
}

export default function SupportTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [priorityFilter, setPriorityFilter] = useState<string>('all')
    const [newMessageFilter, setNewMessageFilter] = useState<string>('all')
    const [replyDialogOpen, setReplyDialogOpen] = useState(false)
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
    const [replyText, setReplyText] = useState('')
    const [messages, setMessages] = useState<TicketMessage[]>([])
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const router = useRouter()


    // redirect to login if not authenticated
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user) {
                router.push('/login')
            }
        })
    }, [router])

    const handleSubmit = async () => {
        if (!selectedTicket?.id || !replyText.trim() || sending) return

        setSending(true)
        toast.loading('Nachricht wird gesendet...')
        try {

            await handleSendMessage(selectedTicket.id, replyText)
            setReplyText('')

            // Refresh tickets to get updated messages
            const data = await getTickets()
            if (data) {
                setTickets(data)
                const updatedTicket = data.find(t => t.id === selectedTicket.id)
                if (updatedTicket) {
                    setSelectedTicket(updatedTicket)
                }
            }
            toast.dismiss()
            toast.success('Nachricht gesendet')
        } catch (error) {
            toast.dismiss()
            toast.error('Fehler beim Senden')
        } finally {
            setSending(false)
        }
    }

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const data = await getTickets()
                setTickets(data || [])
            } catch (error) {
                console.error('Error fetching tickets:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchTickets()
    }, [])

    // Load messages when ticket is selected
    useEffect(() => {
        if (selectedTicket && selectedTicket.nachrichten) {
            const ticketMessages = Array.isArray(selectedTicket.nachrichten)
                ? (selectedTicket.nachrichten as unknown as TicketMessage[])
                : []
            // Sort by createdAt
            const sortedMessages = [...ticketMessages].sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
            setMessages(sortedMessages)
        } else {
            setMessages([])
        }
    }, [selectedTicket])

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Filter tickets (always sorted by newest first)
    const filteredTickets = useMemo(() => {
        let filtered = tickets.filter(ticket => {
            // Search filter
            const ticketTitle = (ticket as any).title || ''
            const matchesSearch =
                !searchQuery ||
                ticket.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticketTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.anliegen?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.status?.toLowerCase().includes(searchQuery.toLowerCase())

            // Status filter
            const matchesStatus =
                statusFilter === 'all' ||
                ticket.status === statusFilter

            // Priority filter
            const priority = getPriority(ticket)
            const matchesPriority =
                priorityFilter === 'all' ||
                priority === priorityFilter

            // New message filter
            const matchesNewMessage =
                newMessageFilter === 'all' ||
                (newMessageFilter === 'yes' && ticket.neue_nachricht === true) ||
                (newMessageFilter === 'no' && ticket.neue_nachricht !== true)

            return matchesSearch && matchesStatus && matchesPriority && matchesNewMessage
        })

        // Always sort by newest first
        filtered.sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

        return filtered
    }, [tickets, searchQuery, statusFilter, priorityFilter, newMessageFilter])

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-muted-foreground">Tickets werden geladen...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Support Tickets</h1>
                    <p className="text-muted-foreground">
                        Verwalten und verfolgen Sie alle Support-Tickets an einem Ort
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            await supabase.auth.signOut()
                            router.push('/')
                            router.refresh()
                        }}
                    >
                        <LogOut className="size-4 mr-2" />
                        Abmelden
                    </Button>
                    <ThemeToggle />
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Filter</CardTitle>
                    <CardDescription>Filtern Sie Tickets nach Status, Priorität oder neuen Nachrichten</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                            <Input
                                placeholder="Tickets durchsuchen..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Status</SelectItem>
                                <SelectItem value="NEU">Neu</SelectItem>
                                <SelectItem value="IN_BEARBEITUNG">In Bearbeitung</SelectItem>
                                <SelectItem value="ABGESCHLOSSEN">Abgeschlossen</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Priority Filter */}
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Priorität" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Prioritäten</SelectItem>
                                <SelectItem value="HOCH">Hoch</SelectItem>
                                <SelectItem value="MITTEL">Mittel</SelectItem>
                                <SelectItem value="NIEDRIG">Niedrig</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* New Message Filter */}
                        <Select value={newMessageFilter} onValueChange={setNewMessageFilter}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Nachrichten" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Tickets</SelectItem>
                                <SelectItem value="yes">Mit neuen Nachrichten</SelectItem>
                                <SelectItem value="no">Ohne neue Nachrichten</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Results Count */}
            <div className="mb-4 text-sm text-muted-foreground">
                Zeige {filteredTickets.length} von {tickets.length} Tickets
            </div>

            {/* Tickets List */}
            {filteredTickets.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <MessageSquare className="size-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Keine Tickets gefunden</h3>
                        <p className="text-muted-foreground text-center">
                            {tickets.length === 0
                                ? 'Es wurden noch keine Tickets erstellt.'
                                : 'Versuchen Sie, Ihre Filter anzupassen, um mehr Ergebnisse zu sehen.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredTickets.map((ticket) => {
                        const priority = getPriority(ticket)
                        return (
                            <Card key={ticket.id} className={`hover:shadow-lg transition-all duration-200 border-l-4 ${ticket.neue_nachricht ? 'border-l-orange-500' : 'border-l-primary/20'}`}>
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <CardTitle className="text-lg font-semibold">
                                                    {(ticket as any).title || ticket.anliegen || 'Kein Betreff'}
                                                </CardTitle>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground font-medium">Status:</span>
                                                    <Badge variant={getStatusVariant(ticket.status)} className={`font-medium border ${getStatusBadgeClass(ticket.status)}`}>
                                                        {formatStatusForDisplay(ticket.status)}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground font-medium">Priorität:</span>
                                                    <Badge variant="outline" className={`font-medium ${getPriorityBadgeClass(priority)}`}>
                                                        {formatPriorityForDisplay(priority)}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardDescription className="flex flex-wrap items-center gap-4 text-sm">
                                                {ticket.name && (
                                                    <span className="flex items-center gap-1.5">
                                                        <User className="size-3.5" />
                                                        {ticket.name}
                                                    </span>
                                                )}
                                                {ticket.email && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Mail className="size-3.5" />
                                                        {ticket.email}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="size-3.5" />
                                                    {formatDate(ticket.created_at)}
                                                </span>
                                            </CardDescription>
                                        </div>
                                        {ticket.neue_nachricht && (
                                            <Badge variant="destructive" className="flex items-center gap-1 shrink-0">
                                                <Bell className="size-3" />
                                                Neue Nachricht
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                {ticket.anliegen && (
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                                            {ticket.anliegen}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={async () => {
                                                    setSelectedTicket(ticket)
                                                    setReplyText('')
                                                    setReplyDialogOpen(true)
                                                    // Refresh ticket to get latest messages
                                                    const data = await getTickets()
                                                    if (data) {
                                                        const updatedTicket = data.find(t => t.id === ticket.id)
                                                        if (updatedTicket) {
                                                            setSelectedTicket(updatedTicket)
                                                        }
                                                    }
                                                }}
                                                className="w-full sm:w-auto"
                                            >
                                                <Reply className="size-4 mr-2" />
                                                Antworten
                                            </Button>
                                            {ticket.status !== 'ABGESCHLOSSEN' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={async () => {
                                                        try {
                                                            toast.loading('Ticket wird als abgeschlossen markiert...')
                                                            await updateTicketStatus(ticket.id, 'ABGESCHLOSSEN')
                                                            toast.dismiss()
                                                            toast.success('Ticket als abgeschlossen markiert')
                                                            // Refresh tickets
                                                            const data = await getTickets()
                                                            if (data) {
                                                                setTickets(data)
                                                            }
                                                        } catch (error) {
                                                            toast.dismiss()
                                                            toast.error('Fehler beim Aktualisieren des Status')
                                                        }
                                                    }}
                                                    className="w-full sm:w-auto"
                                                >
                                                    <CheckCircle2 className="size-4 mr-2" />
                                                    Abschließen
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Chat Dialog */}
            <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
                <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedTicket && (
                                <>
                                    Ticket: {(selectedTicket as any).title || selectedTicket.anliegen || 'Kein Titel'}
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedTicket && (
                                <>
                                    {selectedTicket.name || selectedTicket.email}
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Chat Messages Area */}
                    <div className="flex-1 overflow-y-auto space-y-4 py-4 border-t border-b">
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
                                            className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}
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
                    </div>

                    {/* Input Area */}
                    <div className="space-y-2 pt-4">
                        <div className="flex gap-2">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && replyText.trim()) {
                                        handleSubmit()
                                    }
                                }}
                                placeholder="Schreiben Sie eine Nachricht... (Cmd/Ctrl + Enter zum Senden)"
                                className="flex-1 min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                disabled={sending}
                            />
                            <Button
                                onClick={handleSubmit}
                                disabled={!replyText.trim() || sending}
                                size="icon"
                                className="h-[80px]"
                            >
                                <Send className="size-4" />
                            </Button>
                        </div>
                        {selectedTicket && selectedTicket.status !== 'ABGESCHLOSSEN' && (
                            <div className="flex justify-end pt-2 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        if (!selectedTicket?.id) return
                                        try {
                                            toast.loading('Ticket wird als abgeschlossen markiert...')
                                            await updateTicketStatus(selectedTicket.id, 'ABGESCHLOSSEN')
                                            toast.dismiss()
                                            toast.success('Ticket als abgeschlossen markiert')

                                            // Refresh tickets and update selected ticket
                                            const data = await getTickets()
                                            if (data) {
                                                setTickets(data)
                                                const updatedTicket = data.find(t => t.id === selectedTicket.id)
                                                if (updatedTicket) {
                                                    setSelectedTicket(updatedTicket)
                                                }
                                            }
                                        } catch (error) {
                                            toast.dismiss()
                                            toast.error('Fehler beim Aktualisieren des Status')
                                        }
                                    }}
                                >
                                    <CheckCircle2 className="size-4 mr-2" />
                                    Ticket abschließen
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}





