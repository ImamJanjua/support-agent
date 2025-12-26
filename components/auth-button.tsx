'use client'
import { Button } from '@/components/ui/button'
import { LogIn, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

export function AuthButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()
      setIsAuthenticated(!!data.user)
      setLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return null
  }

  // Don't show on login page or support page (support page has its own button)
  if (pathname === '/login' || pathname === '/support') {
    return null
  }

  // Only show Anmelden button for non-authenticated users
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="absolute top-4 right-4">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => router.push('/login')}
      >
        <LogIn className="size-4 mr-2" />
        Anmelden
      </Button>
    </div>
  )
}

