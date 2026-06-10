import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

interface Props {
  email: string
  onLogout: () => void
}

export default function AdminSubmenu({ email, onLogout }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleNavigate = (path: string) => {
    navigate(path)
    setIsOpen(false)
  }

  const handleLogout = () => {
    onLogout()
    setIsOpen(false)
  }

  return (
    <div className="admin-submenu" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(v => !v) }}
        className={`submenu-trigger${isOpen ? ' active' : ''}`}
        aria-label="メニューを開く"
      >
        <span className="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
      {isOpen && (
        <div className="submenu-dropdown">
          <div className="submenu-user-section">
            <span className="submenu-user-label">ログイン中</span>
            <span className="submenu-user-email">{email}</span>
          </div>
          <div className="submenu-divider"></div>
          <nav className="submenu-nav">
            <button onClick={() => handleNavigate('/billing-sources')} className="submenu-item">請求元管理</button>
            <button onClick={() => handleNavigate('/billing-addresses')} className="submenu-item">請求先管理</button>
            <button onClick={() => handleNavigate('/items')} className="submenu-item">品目管理</button>
          </nav>
          <div className="submenu-divider"></div>
          <button onClick={handleLogout} className="submenu-logout">ログアウト</button>
        </div>
      )}
    </div>
  )
}
