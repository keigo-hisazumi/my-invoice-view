import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, authError, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isRegisterMode) {
        await register(email, password)
      } else {
        await login(email, password)
      }
      const redirect = (location.state as { redirect?: string })?.redirect ?? '/'
      navigate(redirect)
    } catch {
      // authError is set by context
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">{isRegisterMode ? '新規登録' : 'ログイン'}</h2>
        <p className="login-subtitle">請求書作成システムへようこそ</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="6文字以上"
              autoComplete="current-password"
              required
            />
          </div>
          {authError && <p className="error-message">{authError}</p>}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? '処理中...' : isRegisterMode ? '新規登録' : 'ログイン'}
          </button>
        </form>

        <p className="toggle-mode">
          {isRegisterMode ? 'すでにアカウントをお持ちの方は' : '初めての方は'}
          <button type="button" className="btn-toggle" onClick={() => setIsRegisterMode(v => !v)}>
            {isRegisterMode ? 'ログイン' : '新規登録'}
          </button>
        </p>
      </div>
    </div>
  )
}
