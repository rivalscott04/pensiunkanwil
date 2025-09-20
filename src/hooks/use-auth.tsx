import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { apiLogout } from '@/lib/api'
import { apiMeCached, invalidateCache } from '@/lib/api-cached'

interface User {
  id: string | number
  nip?: string
  name: string
  email: string
  role: string
  kabupaten?: any
  jabatan?: string
  status_user?: string
  last_login?: string
}

interface Impersonation {
  is_impersonating: boolean
  impersonator?: {
    id: string | number
    name: string
    email: string
    role: string
  }
  impersonated?: {
    id: string | number
    name: string
    email: string
    role: string
  }
}

interface AuthContextType {
  user: User | null
  impersonation: Impersonation | null
  isLoading: boolean
  error: string | null
  refetchUser: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [impersonation, setImpersonation] = useState<Impersonation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiMeCached()
      const userData = response?.user || response
      const impersonationData = response?.impersonation
      
      if (userData) {
        setUser(userData)
        setImpersonation(impersonationData || null)
      } else {
        setUser(null)
        setImpersonation(null)
      }
    } catch (err) {
      setError('Failed to fetch user data')
      setUser(null)
      setImpersonation(null)
    } finally {
      setIsLoading(false)
    }
  }

  const refetchUser = async () => {
    // Invalidate cache before refetching
    invalidateCache('me')
    await fetchUser()
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch (err) {
      // Ignore logout errors
    } finally {
      setUser(null)
      setImpersonation(null)
      window.location.href = '/login'
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const value: AuthContextType = {
    user,
    impersonation,
    isLoading,
    error,
    refetchUser,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
