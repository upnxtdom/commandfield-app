import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigateRef = useRef(null)

  const fetchProfile = async (userId) => {
    try {
      const result = await Promise.race([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        new Promise((_, reject) =>
          setTimeout(() => reject(
            new Error('Profile fetch timeout')
          ), 3000)
        )
      ])
      return result.data ?? null
    } catch (e) {
      console.log('fetchProfile error:', e.message)
      return null
    }
  }

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) =>
            setTimeout(() => reject(
              new Error('getSession timeout')
            ), 5000)
          )
        ])
        const s = data?.session ?? null
        if (!mounted) return
        setSession(s)
        setUser(s?.user ?? null)
        if (s?.user) {
          const p = await fetchProfile(s.user.id)
          if (mounted) setProfile(p)
        }
      } catch (e) {
        console.log('init error:', e.message)
      } finally {
        console.log('init finally: setting loading false')
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(
        async (event, s) => {
          if (!mounted) return
          setSession(s)
          setUser(s?.user ?? null)
          if (s?.user) {
            const p = await fetchProfile(s.user.id)
            if (mounted) setProfile(p)
          } else {
            setProfile(null)
          }
          if (event === 'SIGNED_OUT' && navigateRef.current) {
            navigateRef.current('/login')
          }
        }
      )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    try {
      const { data, error } = await
        supabase.auth.signInWithPassword(
          { email, password }
        )
      if (error) return { error }
      return { success: true }
    } catch (e) {
      return { error: e }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.log('SignOut error:', e)
    }
  }

  const setNavigate = (fn) => {
    navigateRef.current = fn
  }

  return (
    <AuthContext.Provider value={{
      session, user, profile,
      loading, signIn, signOut, setNavigate
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
