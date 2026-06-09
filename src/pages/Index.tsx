import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Index() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'secretaria') {
        navigate('/financeiro')
      } else {
        navigate('/dashboard')
      }
    }
  }, [isAuthenticated, user, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      toast({
        title: 'Erro de Autenticação',
        description: 'E-mail ou senha incorretos.',
        variant: 'destructive',
      })
      setLoading(false)
    } else {
      toast({ title: 'Login realizado com sucesso!' })
    }
  }

  return (
    <div className="min-h-screen flex w-full">
      <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://img.usecurling.com/p/800/1200?q=warm%20organic%20modern%20clinic&color=orange"
            alt="Clinic Interior"
            className="w-full h-full object-cover opacity-30 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 to-accent/40 mix-blend-overlay"></div>
        </div>
        <div className="z-10 text-primary-foreground p-12 max-w-lg text-center animate-fade-in-up">
          <div className="bg-white/20 p-4 rounded-2xl inline-flex mb-6 backdrop-blur-sm">
            <Activity size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Gestão inteligente e humana.</h1>
          <p className="text-lg opacity-90">
            Acompanhe a saúde financeira da sua clínica com clareza, simplicidade e calor.
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md shadow-elevation border-0 bg-white/50 backdrop-blur-xl animate-fade-in">
          <CardHeader className="space-y-3 pb-8">
            <div className="flex items-center gap-2 lg:hidden mb-4 text-primary">
              <Activity size={32} />
              <span className="text-2xl font-bold text-foreground">Aevi Financeiro</span>
            </div>
            <CardTitle className="text-3xl text-accent">Entrar</CardTitle>
            <CardDescription className="text-base">
              Insira suas credenciais para acessar o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl h-12 bg-white focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-xl h-12 bg-white focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-full text-base font-semibold shadow-md hover:scale-[1.02] transition-transform"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Acessar'}
              </Button>
              <div className="text-xs text-center text-muted-foreground pt-4">
                <p>Contas de teste (Senha: Skip@Pass123):</p>
                <p>maykow@hotmail.com.br (Médico)</p>
                <p>secretaria@clinicaaevi.com.br (Secretária)</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
