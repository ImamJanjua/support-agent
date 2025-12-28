'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabase'

const Page = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    anliegen: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()

  // Check if user is authenticated and redirect to /support
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.push('/support')
      } else {
        setCheckingAuth(false)
      }
    })
  }, [router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
    }


    if (!formData.anliegen.trim()) {
      newErrors.anliegen = 'Bitte beschreiben Sie Ihr Anliegen'
    } else if (formData.anliegen.trim().length < 10) {
      newErrors.anliegen = 'Bitte geben Sie eine ausführlichere Beschreibung ein (mindestens 10 Zeichen)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Bitte füllen Sie alle Felder korrekt aus')
      return
    }

    setIsSubmitting(true)

    toast.loading('Ihr Ticket wird erstellt...')
    const response = await fetch(`${process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL}/support-ticket`, {
      method: 'POST',
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        anliegen: formData.anliegen
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (!response.ok) {
      toast.dismiss()
      toast.error('Fehler beim Erstellen des Tickets. Bitte versuchen Sie es erneut.')
      return
    }
    toast.dismiss()
    toast.success('Ihr Ticket wurde erfolgreich erstellt!')
    setIsSuccess(true)
    setFormData({
      name: '',
      email: '',
      anliegen: ''
    })
    setErrors({})
    setIsSubmitting(false)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  if (checkingAuth) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Laden...</div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">Ticket erfolgreich erstellt!</CardTitle>
            <CardDescription className="text-base mt-2">
              Wir haben Ihr Anliegen erhalten und werden uns schnellstmöglich bei Ihnen melden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                setIsSuccess(false)
                router.push('/')
              }}
              variant="outline"
            >
              Neues Ticket erstellen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl relative">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <MessageSquare className="size-8 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">Support kontaktieren</h1>
        <p className="text-muted-foreground text-lg">
          Beschreiben Sie Ihr Anliegen und wir helfen Ihnen gerne weiter
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neues Support-Ticket</CardTitle>
          <CardDescription>
            Füllen Sie das Formular aus und wir melden uns schnellstmöglich bei Ihnen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field orientation="vertical">
                <FieldLabel htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ihr vollständiger Name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <FieldError>{errors.name}</FieldError>}
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldLabel htmlFor="email">
                  E-Mail-Adresse <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ihre.email@beispiel.de"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <FieldError>{errors.email}</FieldError>}
                  <FieldDescription>
                    Wir verwenden diese E-Mail-Adresse, um Ihnen zu antworten
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldLabel htmlFor="anliegen">
                  Ihr Anliegen <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <textarea
                    id="anliegen"
                    rows={8}
                    placeholder="Beschreiben Sie Ihr Problem oder Ihre Frage so detailliert wie möglich..."
                    value={formData.anliegen}
                    onChange={(e) => handleChange('anliegen', e.target.value)}
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                    aria-invalid={!!errors.anliegen}
                  />
                  {errors.anliegen && <FieldError>{errors.anliegen}</FieldError>}
                  <FieldDescription>
                    Je detaillierter Ihre Beschreibung, desto schneller können wir Ihnen helfen
                  </FieldDescription>
                </FieldContent>
              </Field>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Wird gesendet...
                    </>
                  ) : (
                    <>
                      <Send className="size-4 mr-2" />
                      Ticket erstellen
                    </>
                  )}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Page
