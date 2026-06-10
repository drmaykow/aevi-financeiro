import pb from '@/lib/pocketbase/client'

export interface TransactionRecord {
  id?: string
  date: string
  type: 'entry' | 'exit'
  doctor?: string
  amount: number
  payment_method?: string
  category?: string
  description?: string
  patient?: string
  entry_type?: string
  procedures?: any
  installments?: number
  card_fee_percent?: number
  card_fee_amount?: number
  net_amount?: number
  card_machine?: string
  created?: string
  expand?: {
    card_machine?: {
      name: string
    }
  }
}

export const getDailyTransactions = async () => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const filter = `date >= "${start.toISOString()}" && date <= "${end.toISOString()}"`
  const items = await pb.collection('transactions').getFullList<TransactionRecord>({
    filter,
    sort: '-date',
    expand: 'card_machine',
  })
  return { items }
}

export const getTransactions = async () => {
  return pb
    .collection('transactions')
    .getFullList<TransactionRecord>({ sort: '-date', expand: 'card_machine' })
}

export const createTransaction = (data: Partial<TransactionRecord>) =>
  pb.collection('transactions').create<TransactionRecord>(data)

export const deleteTransaction = (id: string) => pb.collection('transactions').delete(id)
