import { createContext, useContext, ReactNode, useState, useMemo, useEffect } from 'react'
import { getTransactions, TransactionRecord } from '@/services/transactions'
import { useRealtime } from '@/hooks/use-realtime'
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns'

export type PeriodFilter =
  | 'current_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'current_year'
  | 'last_year'
  | 'always'
export type DoctorFilter = 'todos' | 'Dr. Maykow' | 'Dra. Ana Cláudia'

export function filterByPeriod(txs: TransactionRecord[], period: PeriodFilter, now = new Date()) {
  if (period === 'always') return txs
  let start: Date,
    end: Date = now
  if (period === 'current_month') {
    start = startOfMonth(now)
    end = now
  } else if (period === 'last_month') {
    start = startOfMonth(subMonths(now, 1))
    end = endOfMonth(subMonths(now, 1))
  } else if (period === 'last_3_months') {
    start = startOfMonth(subMonths(now, 2))
    end = now
  } else if (period === 'last_6_months') {
    start = startOfMonth(subMonths(now, 5))
    end = now
  } else if (period === 'current_year') {
    start = startOfYear(now)
    end = now
  } else if (period === 'last_year') {
    start = startOfYear(subYears(now, 1))
    end = endOfYear(subYears(now, 1))
  } else return txs

  return txs.filter((t) => {
    const d = new Date(t.date)
    return d >= start && d <= end
  })
}

interface DashboardContextType {
  allTransactions: TransactionRecord[]
  filteredTxs: TransactionRecord[]
  period: PeriodFilter
  setPeriod: (p: PeriodFilter) => void
  doctorFilter: DoctorFilter
  setDoctorFilter: (d: DoctorFilter) => void
}

const DashboardContext = createContext<DashboardContextType | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [allTransactions, setAllTransactions] = useState<TransactionRecord[]>([])
  const [period, setPeriod] = useState<PeriodFilter>('current_month')
  const [doctorFilter, setDoctorFilter] = useState<DoctorFilter>('todos')

  const loadData = async () => {
    try {
      const res = await getTransactions()
      setAllTransactions(res.filter((t: any) => new Date(t.date) <= new Date()))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('transactions', () => {
    loadData()
  })

  const filteredTxs = useMemo(
    () => filterByPeriod(allTransactions, period),
    [allTransactions, period],
  )

  return (
    <DashboardContext.Provider
      value={{ allTransactions, filteredTxs, period, setPeriod, doctorFilter, setDoctorFilter }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboard = () => {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider')
  return ctx
}
