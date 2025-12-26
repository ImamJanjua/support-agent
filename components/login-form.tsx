'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import supabase from "@/lib/supabase"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)


    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message || "Fehler beim Anmelden")
        return
      }

      if (data.user) {
        toast.success("Erfolgreich angemeldet")
        router.push("/support")
        router.refresh()
      }
    } catch (error) {
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
      console.error("Login error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Mit deinem Konto anmelden</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Gib deine E-Mail-Adresse und Passwort ein, um dich mit deinem Konto anzumelden
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Passwort</FieldLabel>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </Field>
        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? "Wird angemeldet..." : "Anmelden"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
