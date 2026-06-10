import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { auth } from '../firebase'

interface AuthContextValue {
  currentUser: User | null
  authLoading: boolean
  authError: string
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setAuthLoading(false)
    })
    return unsub
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    setAuthError('')
    setLoading(true)
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      return user
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      setAuthError(translateAuthError(code))
      throw e
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string): Promise<User> => {
    setAuthError('')
    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      return user
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      setAuthError(translateAuthError(code))
      throw e
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await firebaseSignOut(auth)
  }

  const clearError = () => setAuthError('')

  return (
    <AuthContext.Provider value={{ currentUser, authLoading, authError, loading, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function translateAuthError(code: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'このメールアドレスはすでに使われています',
    'auth/invalid-email': 'メールアドレスの形式が正しくありません',
    'auth/weak-password': 'パスワードは6文字以上にしてください',
    'auth/user-not-found': 'メールアドレスまたはパスワードが間違っています',
    'auth/wrong-password': 'メールアドレスまたはパスワードが間違っています',
    'auth/invalid-credential': 'メールアドレスまたはパスワードが間違っています',
    'auth/too-many-requests': 'しばらく時間をおいてから再試行してください'
  }
  return messages[code] ?? `エラーが発生しました (${code})`
}
