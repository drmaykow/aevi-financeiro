import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ClipboardList, Microscope } from 'lucide-react'
import { cn } from '@/lib/utils'

export function HeaderNav() {
  const location = useLocation()
  const isFinanceiro = location.pathname === '/financeiro'
  const isMicroscopia = location.pathname === '/microscopia-controle'

  return (
    <div className="flex items-center gap-2">
      <Button
        asChild
        variant={isFinanceiro ? 'default' : 'outline'}
        className={cn('rounded-full gap-2', isFinanceiro && 'shadow-sm')}
      >
        <Link to="/financeiro">
          <ClipboardList size={16} />
          <span className="hidden sm:inline">Lançamento</span>
        </Link>
      </Button>
      <Button
        asChild
        variant={isMicroscopia ? 'default' : 'outline'}
        className={cn('rounded-full gap-2', isMicroscopia && 'shadow-sm')}
      >
        <Link to="/microscopia-controle">
          <Microscope size={16} />
          <span className="hidden sm:inline">Microscopia</span>
        </Link>
      </Button>
    </div>
  )
}
