import React, { createContext, useContext, useState, ReactNode } from 'react'

export type Role = 'MEDICO' | 'SECRETARIA'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export type TransactionType = 'INCOME' | 'EXPENSE'
export type ExpenseStatus = 'PAID' | 'PENDING'

export interface Transaction {
  id: string
  type: TransactionType
  description: string
  amount: number
  date: string
  category: string
  patientName?: string
  status?: ExpenseStatus
}

interface MainStore {
  user: User | null
  setUser: (user: User | null) => void
  transactions: Transaction[]
  addTransaction: (t: Omit<Transaction, 'id'>) => void
  updateTransaction: (id: string, t: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
}

export const mockUsers: User[] = [
  { id: '1', name: 'Dr. Maykow', email: 'maykow@hotmail.com.br', role: 'MEDICO' },
  { id: '2', name: 'Dra. Ana', email: 'ana@clinicaaevi.com.br', role: 'MEDICO' },
  { id: '3', name: 'Secretária', email: 'secretaria@clinicaaevi.com.br', role: 'SECRETARIA' },
]

const generateMockTransactions = (): Transaction[] => {
  const txs: Transaction[] = []
  const today = new Date()

  const incomeCategories = ['Consulta', 'Procedimento', 'Exame']
  const expenseCategories = ['Aluguel', 'Suprimentos', 'Folha de Pagamento', 'Marketing']
  const patients = ['João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Souza', 'Pedro Costa']

  for (let i = 0; i < 40; i++) {
    const isIncome = Math.random() > 0.4
    const date = new Date(today)
    date.setDate(date.getDate() - Math.floor(Math.random() * 90))

    if (isIncome) {
      txs.push({
        id: `inc-${i}`,
        type: 'INCOME',
        description: `Recebimento - ${incomeCategories[Math.floor(Math.random() * incomeCategories.length)]}`,
        amount: Math.floor(Math.random() * 500) + 150,
        date: date.toISOString(),
        category: incomeCategories[Math.floor(Math.random() * incomeCategories.length)],
        patientName: patients[Math.floor(Math.random() * patients.length)],
      })
    } else {
      txs.push({
        id: `exp-${i}`,
        type: 'EXPENSE',
        description: `Pagamento - ${expenseCategories[Math.floor(Math.random() * expenseCategories.length)]}`,
        amount: Math.floor(Math.random() * 1000) + 50,
        date: date.toISOString(),
        category: expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
        status: Math.random() > 0.2 ? 'PAID' : 'PENDING',
      })
    }
  }
  return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

const initialTransactions = generateMockTransactions()

export const MainContext = createContext<MainStore | null>(null)

export function MainProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...t, id: `tx-${Date.now()}` }
    setTransactions((prev) =>
      [newTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    )
  }

  const updateTransaction = (id: string, t: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((tx) => (tx.id === id ? { ...tx, ...t } : tx)))
  }

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id))
  }

  return React.createElement(
    MainContext.Provider,
    {
      value: { user, setUser, transactions, addTransaction, updateTransaction, deleteTransaction },
    },
    children,
  )
}

export default function useMainStore() {
  const context = useContext(MainContext)
  if (!context) throw new Error('useMainStore must be used within MainProvider')
  return context
}
