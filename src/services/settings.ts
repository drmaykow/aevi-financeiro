import pb from '@/lib/pocketbase/client'

export interface CardMachine {
  id?: string
  name: string
  fees: Record<string, number>
}

export interface Procedure {
  id?: string
  name: string
  doctor: 'Dr. Maykow' | 'Dra. Ana Cláudia'
  category: 'CONSULTAS' | 'DIU' | 'IMPLANON' | 'PROCEDIMENTOS'
  active: boolean
}

export const getCardMachines = () =>
  pb.collection('card_machines').getFullList<CardMachine>({ sort: 'created' })
export const createCardMachine = (data: Partial<CardMachine>) =>
  pb.collection('card_machines').create<CardMachine>(data)
export const updateCardMachine = (id: string, data: Partial<CardMachine>) =>
  pb.collection('card_machines').update<CardMachine>(id, data)
export const deleteCardMachine = (id: string) => pb.collection('card_machines').delete(id)

export const getProcedures = () =>
  pb.collection('procedures_list').getFullList<Procedure>({ sort: 'category,name' })
export const createProcedure = (data: Partial<Procedure>) =>
  pb.collection('procedures_list').create<Procedure>(data)
export const updateProcedure = (id: string, data: Partial<Procedure>) =>
  pb.collection('procedures_list').update<Procedure>(id, data)
export const deleteProcedure = (id: string) => pb.collection('procedures_list').delete(id)
