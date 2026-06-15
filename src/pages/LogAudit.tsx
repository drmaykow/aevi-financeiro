import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAuditLogs, AuditLog } from '@/services/audit'
import { getUsers, UserRecord } from '@/services/users'
import { Eye, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function LogAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [users, setUsers] = useState<UserRecord[]>([])

  const [period, setPeriod] = useState('7')
  const [selectedUser, setSelectedUser] = useState('Todos')
  const [action, setAction] = useState('Todas')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'desc' | 'asc' | null }>({
    key: '-created',
    direction: 'desc',
  })

  const [viewLog, setViewLog] = useState<AuditLog | null>(null)

  const loadFilterData = async () => {
    try {
      const res = await getUsers()
      setUsers(res)
    } catch {
      /* intentionally ignored */
    }
  }

  const loadData = async () => {
    try {
      const filters = []
      if (period !== 'Sempre') {
        const d = new Date()
        if (period === 'Hoje') d.setHours(0, 0, 0, 0)
        else if (period === '7') d.setDate(d.getDate() - 7)
        else if (period === '30') d.setDate(d.getDate() - 30)
        filters.push(`created >= '${d.toISOString().replace('T', ' ')}'`)
      }
      if (selectedUser !== 'Todos') {
        filters.push(`user = '${selectedUser}'`)
      }
      if (action !== 'Todas') {
        const actionMap: any = {
          Criação: 'create',
          Edição: 'update',
          Exclusão: 'delete',
          Login: 'login',
          Logout: 'logout',
        }
        if (actionMap[action]) {
          filters.push(`action = '${actionMap[action]}'`)
        }
      }

      let sortStr = sortConfig.key
      if (sortConfig.direction === 'asc' && sortStr.startsWith('-')) {
        sortStr = sortStr.substring(1)
      } else if (sortConfig.direction === 'desc' && !sortStr.startsWith('-')) {
        sortStr = '-' + sortStr
      } else if (sortConfig.direction === null) {
        sortStr = '-created'
      }

      const res = await getAuditLogs(page, 25, filters.join(' && '), sortStr)
      setLogs(res.items)
      setTotalPages(res.totalPages)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadFilterData()
  }, [])

  useEffect(() => {
    loadData()
  }, [period, selectedUser, action, page, sortConfig])

  const handleSort = (key: string) => {
    let direction: 'desc' | 'asc' | null = 'desc'
    let actualKey = key.replace('-', '')
    let currentKey = sortConfig.key.replace('-', '')

    if (currentKey === actualKey) {
      if (sortConfig.direction === 'desc') direction = 'asc'
      else if (sortConfig.direction === 'asc') direction = null
    }
    setSortConfig({ key: actualKey, direction })
  }

  const SortableHeader = ({ title, sortKey }: { title: string; sortKey: string }) => {
    const actualKey = sortKey.replace('-', '')
    const currentKey = sortConfig.key.replace('-', '')
    const isActive = currentKey === actualKey && sortConfig.direction !== null
    const Icon = !isActive
      ? ChevronsUpDown
      : sortConfig.direction === 'desc'
        ? ChevronDown
        : ChevronUp

    return (
      <TableHead
        className={`cursor-pointer select-none transition-colors hover:bg-muted/50 ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-500 font-medium'}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center gap-1">
          {title}
          <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
        </div>
      </TableHead>
    )
  }

  const getActionColor = (act: string) => {
    switch (act) {
      case 'create':
        return 'text-green-700 bg-green-100 border-green-200'
      case 'update':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'delete':
        return 'text-red-700 bg-red-100 border-red-200'
      case 'login':
      case 'logout':
        return 'text-gray-700 bg-gray-100 border-gray-200'
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getActionLabel = (act: string) => {
    switch (act) {
      case 'create':
        return 'Criação'
      case 'update':
        return 'Edição'
      case 'delete':
        return 'Exclusão'
      case 'login':
        return 'Login'
      case 'logout':
        return 'Logout'
      default:
        return act
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="rounded-xl h-11 bg-card border-none shadow-sm">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Hoje">Hoje</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="Sempre">Sempre</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="rounded-xl h-11 bg-card border-none shadow-sm">
            <SelectValue placeholder="Usuário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os usuários</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name || u.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="rounded-xl h-11 bg-card border-none shadow-sm">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas as ações</SelectItem>
            <SelectItem value="Criação">Criação</SelectItem>
            <SelectItem value="Edição">Edição</SelectItem>
            <SelectItem value="Exclusão">Exclusão</SelectItem>
            <SelectItem value="Login">Login</SelectItem>
            <SelectItem value="Logout">Logout</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-2xl border-none shadow-subtle overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-none">
                <SortableHeader title="Data/Hora" sortKey="created" />
                <SortableHeader title="Usuário" sortKey="user" />
                <SortableHeader title="Ação" sortKey="action" />
                <TableHead className="font-semibold">Entidade Afetada</TableHead>
                <TableHead className="text-right font-semibold">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="hover:bg-muted/50 border-border/50 transition-colors"
                  >
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(log.created.replace(' ', 'T')).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {(() => {
                        if (!log.user) return 'Sistema'
                        const u = users.find((x) => x.id === log.user)
                        if (u) return u.name || u.email
                        return log.expand?.user?.name || 'Sistema'
                      })()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`font-medium ${getActionColor(log.action)}`}
                      >
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{log.entity}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewLog(log)}
                        className="text-primary hover:bg-primary/10 rounded-full h-8 px-3"
                      >
                        <Eye size={16} className="mr-2" /> Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-2 mt-4">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-full"
        >
          Anterior
        </Button>
        <span className="flex items-center px-4 text-sm font-medium">
          Página {page} de {totalPages || 1}
        </span>
        <Button
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-full"
        >
          Próxima
        </Button>
      </div>

      <Dialog open={!!viewLog} onOpenChange={(op) => !op && setViewLog(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary mb-2">
              Detalhes da Ação
            </DialogTitle>
          </DialogHeader>
          {viewLog && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="font-semibold">Usuário:</span>{' '}
                  {(() => {
                    if (!viewLog.user) return 'Sistema'
                    const u = users.find((x) => x.id === viewLog.user)
                    if (u) return u.name || u.email
                    return viewLog.expand?.user?.name || 'Sistema'
                  })()}
                </div>
                <div>
                  <span className="font-semibold">Data/Hora:</span>{' '}
                  {new Date(viewLog.created.replace(' ', 'T')).toLocaleString('pt-BR')}
                </div>
                <div>
                  <span className="font-semibold">Ação:</span>{' '}
                  <Badge className={getActionColor(viewLog.action)}>
                    {getActionLabel(viewLog.action)}
                  </Badge>
                </div>
                <div>
                  <span className="font-semibold">Entidade:</span> {viewLog.entity}
                </div>
              </div>

              {viewLog.action === 'update' && viewLog.details?.before && viewLog.details?.after ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                    <h4 className="font-semibold text-red-800 mb-2">Antes</h4>
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-red-900">
                      {JSON.stringify(viewLog.details.before, null, 2)}
                    </pre>
                  </div>
                  <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                    <h4 className="font-semibold text-green-800 mb-2">Depois</h4>
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-green-900">
                      {JSON.stringify(viewLog.details.after, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 p-4 rounded-xl border border-border">
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-foreground">
                    {JSON.stringify(viewLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
