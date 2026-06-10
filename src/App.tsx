import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ToastNotification from './components/ToastNotification'
import AdminSubmenu from './components/AdminSubmenu'
import Login from './pages/Login'
import InvoiceList from './pages/InvoiceList'
import InvoiceCreate from './pages/InvoiceCreate'
import InvoicePrint from './pages/InvoicePrint'
import BillingAddressList from './pages/BillingAddressList'
import BillingAddressForm from './pages/BillingAddressForm'
import BillingSourceList from './pages/BillingSourceList'
import BillingSourceForm from './pages/BillingSourceForm'
import ItemMasterList from './pages/ItemMasterList'
import ItemMasterForm from './pages/ItemMasterForm'
import type { ReactNode } from 'react'

function RequireAuth({ children }: { children: ReactNode }) {
  const { currentUser, authLoading } = useAuth()
  const location = useLocation()
  if (authLoading) return null
  if (!currentUser) return <Navigate to="/login" state={{ redirect: location.pathname }} replace />
  return <>{children}</>
}

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const isLoginPage = location.pathname === '/login'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-text">
            <h1>請求書作成システム</h1>
          </div>
          {!isLoginPage && currentUser && (
            <div className="header-user">
              <AdminSubmenu email={currentUser.email ?? ''} onLogout={handleLogout} />
            </div>
          )}
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><InvoiceList /></RequireAuth>} />
          <Route path="/create" element={<RequireAuth><InvoiceCreate /></RequireAuth>} />
          <Route path="/edit/:id" element={<RequireAuth><InvoiceCreate /></RequireAuth>} />
          <Route path="/view/:id" element={<RequireAuth><InvoiceCreate /></RequireAuth>} />
          <Route path="/print/:id" element={<RequireAuth><InvoicePrint /></RequireAuth>} />
          <Route path="/billing-addresses" element={<RequireAuth><BillingAddressList /></RequireAuth>} />
          <Route path="/billing-addresses/create" element={<RequireAuth><BillingAddressForm /></RequireAuth>} />
          <Route path="/billing-addresses/edit/:id" element={<RequireAuth><BillingAddressForm /></RequireAuth>} />
          <Route path="/billing-sources" element={<RequireAuth><BillingSourceList /></RequireAuth>} />
          <Route path="/billing-sources/create" element={<RequireAuth><BillingSourceForm /></RequireAuth>} />
          <Route path="/billing-sources/edit/:id" element={<RequireAuth><BillingSourceForm /></RequireAuth>} />
          <Route path="/items" element={<RequireAuth><ItemMasterList /></RequireAuth>} />
          <Route path="/items/create" element={<RequireAuth><ItemMasterForm /></RequireAuth>} />
          <Route path="/items/edit/:id" element={<RequireAuth><ItemMasterForm /></RequireAuth>} />
        </Routes>
      </main>
      <ToastNotification />
    </div>
  )
}

export default function App() {
  const base = import.meta.env.BASE_URL

  return (
    <BrowserRouter basename={base}>
      <AuthProvider>
        <ToastProvider>
          <AppLayout />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
