import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) {
        console.log('Profile fetch error:', error)
        return null
      }
      return data
    } catch (e) {
      console.log('Profile fetch exception:', e)
      return null
    }
  }

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data: { session } } =
          await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user) {
          setSession(session)
          setUser(session.user)
          const p = await fetchProfile(session.user.id)
          if (mounted) setProfile(p)
        }
      } catch (e) {
        console.log('Init error:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return
          if (session?.user) {
            setSession(session)
            setUser(session.user)
            const p = await fetchProfile(session.user.id)
            if (mounted) setProfile(p)
          } else {
            setSession(null)
            setUser(null)
            setProfile(null)
          }
        }
      )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    const { error } = await
      supabase.auth.signInWithPassword(
        { email, password }
      )
    if (error) return { error }
    return { success: true }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('commandfield-auth')
    setSession(null)
    setUser(null)
    setProfile(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{
      session, user, profile,
      loading, signIn, signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
