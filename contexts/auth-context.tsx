"use client"

import type React from "react"

import { createBrowserClient } from "@/lib/supabase"
import type { User } from "@/types"
import type { Session } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"

// Interface que define o tipo do contexto de autenticação
interface AuthContextType {
  user: User | null
  session: any
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateAvatar: (avatarUrl: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)

      // Quando o usuário faz login, salva/atualiza os dados no banco
      if (session?.user) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select()
          .eq('id', session.user.id)
          .single()

        if (!existingUser) {
          // Se o usuário não existe, cria um novo perfil
          await supabase.from('profiles').insert({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata.name || session.user.email?.split('@')[0],
            avatar_url: session.user.user_metadata.avatar_url,
            last_login: new Date().toISOString()
          })
        } else {
          // Se o usuário existe, atualiza o último login
          await supabase
            .from('profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', session.user.id)
        }

        // Redireciona após o login bem-sucedido
        const searchParams = new URLSearchParams(window.location.search)
        const redirectTo = searchParams.get('redirectTo') || '/communities'
        router.push(redirectTo)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          name: email.split('@')[0] // Usa o nome do email como nome inicial
        }
      }
    })
    
    if (error) throw error
    
    if (data.user) {
      // Cria o perfil do usuário no banco
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.name || data.user.email?.split('@')[0],
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      })
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const updateAvatar = async (avatarUrl: string) => {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id)
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
