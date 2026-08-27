import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'
import { syncNow, isOnline } from './sync'

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  online: boolean
  configError: string | null
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, nombre: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(navigator.onLine)
  const configError = isSupabaseConfigured
    ? null
    : 'Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env'

  useEffect(() => {
    let mounted = true
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session)
        setLoading(false)
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (mounted) setSession(s)
    })

    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  useEffect(() => {
    if (!session) return
    if (navigator.onLine) syncNow()
  }, [session])

  useEffect(() => {
    if (online && session) syncNow()
  }, [online, session])

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: 'Falta configurar Supabase en el archivo .env' }
    if (!(await isOnline())) return { error: 'Sin conexión. Conéctate a internet para iniciar sesión.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: traduccion(error.message) }
    return {}
  }

  const signUp = async (email: string, password: string, nombre: string) => {
    if (!isSupabaseConfigured) return { error: 'Falta configurar Supabase en el archivo .env' }
    if (!(await isOnline())) return { error: 'Sin conexión. Conéctate a internet para registrarte.' }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    })
    if (error) return { error: traduccion(error.message) }
    return {}
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, online, configError, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

function traduccion(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Email o contraseña incorrectos.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Ese email ya está registrado.'
  if (m.includes('máximo 2') || m.includes('maximum') || m.includes('registro cerrado'))
    return 'Registro cerrado: ya hay 2 usuarios.'
  if (m.includes('password')) return 'La contraseña debe tener al menos 6 caracteres.'
  return msg
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
