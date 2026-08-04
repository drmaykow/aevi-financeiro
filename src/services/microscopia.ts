import pb from '@/lib/pocketbase/client'
import type { TransactionRecord } from '@/services/transactions'

export interface MicroscopiaRecord {
  id: string
  date: string
  patient: string
  procedures: string[] | null
}

export interface PatientMicroscopia {
  patient: string
  records: MicroscopiaRecord[]
  cycleCount: number
  lastDate: string
}

function isMicroscopia(tx: TransactionRecord): boolean {
  if (tx.type !== 'entry') return false
  if (!tx.procedures) return false
  if (!Array.isArray(tx.procedures)) return false
  return tx.procedures.includes('Microscopia')
}

export async function getMicroscopiaPatients(): Promise<PatientMicroscopia[]> {
  const allEntries = await pb.collection('transactions').getFullList<TransactionRecord>({
    filter: 'type = "entry"',
    sort: 'date',
  })

  const microscopyTx = allEntries.filter(isMicroscopia)

  const grouped = new Map<string, MicroscopiaRecord[]>()

  for (const tx of microscopyTx) {
    const patientName = (tx.patient || 'Desconhecido').trim()
    if (!patientName || patientName === 'Desconhecido') continue

    const record: MicroscopiaRecord = {
      id: tx.id!,
      date: tx.date,
      patient: patientName,
      procedures: Array.isArray(tx.procedures) ? tx.procedures : null,
    }

    if (!grouped.has(patientName)) {
      grouped.set(patientName, [])
    }
    grouped.get(patientName)!.push(record)
  }

  const patients: PatientMicroscopia[] = []

  for (const [patientName, records] of grouped) {
    records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const cycleCount = records.length === 0 ? 0 : ((records.length - 1) % 3) + 1
    const lastDate = records[records.length - 1].date

    patients.push({
      patient: patientName,
      records,
      cycleCount,
      lastDate,
    })
  }

  patients.sort((a, b) => a.patient.localeCompare(b.patient))

  return patients
}
