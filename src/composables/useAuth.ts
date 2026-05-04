import { ref } from 'vue'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { auth } from '../firebase'

const currentUser = ref<User | null>(null)
const authLoading = ref(true)

onAuthStateChanged(auth, (user) => {
  currentUser.value = user
  authLoading.value = false
})

export function useAuth() {
  const authError = ref('')
  const loading = ref(false)

  const login = async (email: string, password: string) => {
    authError.value = ''
    loading.value = true
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      return user
    } catch (e: any) {
      authError.value = translateAuthError(e.code)
      throw e
    } finally {
      loading.value = false
    }
  }

  const register = async (email: string, password: string) => {
    authError.value = ''
    loading.value = true
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      return user
    } catch (e: any) {
      authError.value = translateAuthError(e.code)
      throw e
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    await firebaseSignOut(auth)
  }

  return { currentUser, authLoading, authError, loading, login, register, logout }
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
