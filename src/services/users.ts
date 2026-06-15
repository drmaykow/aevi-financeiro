import pb from '@/lib/pocketbase/client'

export interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  created: string
}

export const getUsers = () =>
  pb.send('/backend/v1/users', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }) as Promise<UserRecord[]>
export const deleteUser = (id: string) => pb.collection('users').delete(id)
export const createUser = (data: any) =>
  pb.send('/backend/v1/users', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })
export const updateUserPassword = (id: string, password: string) =>
  pb.send(`/backend/v1/users/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
    headers: { 'Content-Type': 'application/json' },
  })
