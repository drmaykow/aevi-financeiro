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
  totalCount: number
  cycleCount: number
  lastDate: string
  lastProcedureDate: string
  daysSinceLastProcedure: number
}

function hasProcedure(tx: TransactionRecord, procedureName: string): boolean {
  if (tx.type !== 'entry') return false
  if (!tx.procedures || !Array.isArray(tx.procedures)) return false
  return tx.procedures.includes(procedureName)
}

export async function getMicroscopiaPatients(): Promise<PatientMicroscopia[]> {
  const allEntries = await pb.collection('transactions').getFullList<TransactionRecord>({
    filter: 'type = "entry"',
    sort: 'date',
  })

  const microscopiaTx = allEntries.filter((tx) => hasProcedure(tx, 'Microscopia'))
  const seguimentoTx = allEntries.filter((tx) => hasProcedure(tx, 'Seguimento'))

  const seguimentoByPatient = new Map<string, string[]>()
  for (const tx of seguimentoTx) {
    const patientName = (tx.patient || '').trim()
    if (!patientName) continue
    if (!seguimentoByPatient.has(patientName)) {
      seguimentoByPatient.set(patientName, [])
    }
    seguimentoByPatient.get(patientName)!.push(tx.date)
  }

  const grouped = new Map<string, MicroscopiaRecord[]>()

  for (const tx of microscopiaTx) {
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

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const patients: PatientMicroscopia[] = []

  for (const [patientName, records] of grouped) {
    records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const totalCount = records.length

    const seguimentoDates = seguimentoByPatient.get(patientName) || []
    const hasRecentSeguimento = seguimentoDates.some((dateStr) => {
      const segDate = new Date(dateStr)
      segDate.setHours(0, 0, 0, 0)
      const diffDays = Math.floor((now.getTime() - segDate.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays <= 30 && diffDays >= 0
    })

    const cycleCount = hasRecentSeguimento ? 0 : ((totalCount - 1) % 3) + 1

    const lastDate = records[records.length - 1].date

    const allDates = [...records.map((r) => r.date), ...seguimentoDates]
    allDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    const lastProcedureDate = allDates[allDates.length - 1]

    const lastProcDate = new Date(lastProcedureDate)
    lastProcDate.setHours(0, 0, 0, 0)
    const daysSinceLastProcedure = Math.floor(
      (now.getTime() - lastProcDate.getTime()) / (1000 * 60 * 60 * 24),
    )

    patients.push({
      patient: patientName,
      records,
      totalCount,
      cycleCount,
      lastDate,
      lastProcedureDate,
      daysSinceLastProcedure,
    })
  }

  patients.sort((a, b) => a.patient.localeCompare(b.patient))

  return patients
}
