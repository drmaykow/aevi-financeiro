import pb from '@/lib/pocketbase/client'

export interface TransactionRecord {
  id?: string
  date: string
  type: 'entry' | 'exit'
  entry_type?: 'CONSULTA/PROCEDIMENTO' | 'TAXA DE AGENDAMENTO' | 'ESTORNO DE TAXA'
  doctor?: string
  patient?: string
  procedures?: string[]
  amount: number
  payment_method?: 'PIX' | 'DINHEIRO' | 'CARTÃO DE CRÉDITO'
  card_machine?: string
  installments?: number
  card_fee_percent?: number
  card_fee_amount?: number
  net_amount?: number
  category?: 'ALUGUEL' | 'CONTA FIXA' | 'MATERIAL E INSUMO' | 'OUTRO' | 'ESTORNO DE TAXA'
  description?: string
  created?: string
}

export const getDailyTransactions = async () => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')

  const startOfDay = `${yyyy}-${mm}-${dd} 00:00:00.000Z`
  const endOfDay = `${yyyy}-${mm}-${dd} 23:59:59.999Z`

  return pb.collection('transactions').getList<TransactionRecord>(1, 10, {
    filter: `date >= "${startOfDay}" && date <= "${endOfDay}"`,
    sort: '-created',
  })
}

export const createTransaction = async (data: Partial<TransactionRecord>) => {
  return pb.collection('transactions').create<TransactionRecord>(data)
}

export const deleteTransaction = async (id: string) => {
  return pb.collection('transactions').delete(id)
}
