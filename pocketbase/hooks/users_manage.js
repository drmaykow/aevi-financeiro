routerAdd(
  'POST',
  '/backend/v1/users',
  (e) => {
    const body = e.requestInfo().body
    if (e.auth?.getString('role') !== 'medico') throw new ForbiddenError('Not authorized')

    const users = $app.findCollectionByNameOrId('_pb_users_auth_')
    const record = new Record(users)
    record.set('name', body.name || '')
    record.setEmail(body.email)
    record.setPassword(body.password)
    record.set('role', body.role || 'secretaria')
    record.setVerified(true)

    $app.save(record)
    return e.json(200, record)
  },
  $apis.requireAuth(),
)

routerAdd(
  'PUT',
  '/backend/v1/users/{id}/password',
  (e) => {
    const body = e.requestInfo().body
    if (e.auth?.getString('role') !== 'medico') throw new ForbiddenError('Not authorized')

    const id = e.request.pathValue('id')
    const record = $app.findRecordById('_pb_users_auth_', id)
    record.setPassword(body.password)
    $app.save(record)

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
