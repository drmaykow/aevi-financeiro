import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import Index from './pages/Index'
import Dashboard from './pages/Dashboard'
import Entradas from './pages/Entradas'
import Saidas from './pages/Saidas'
import Relatorios from './pages/Relatorios'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import FinanceiroSecretaria from './pages/FinanceiroSecretaria'
import Configuracoes from './pages/Configuracoes'

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles?: string[]
}) => {
  const { user, isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/" />
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'secretaria' ? '/financeiro' : '/dashboard'} />
  }
  return children
}

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/financeiro"
            element={
              <ProtectedRoute allowedRoles={['secretaria', 'medico']}>
                <FinanceiroSecretaria />
              </ProtectedRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute allowedRoles={['medico']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/entradas" element={<Entradas />} />
            <Route path="/saidas" element={<Saidas />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
