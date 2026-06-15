routerAdd(
  'GET',
  '/backend/v1/users',
  (e) => {
    if (e.auth?.getString('role') !== 'medico') throw new ForbiddenError('Not authorized')

    const users = $app.findRecordsByFilter('_pb_users_auth_', '1=1', '-created', 1000, 0)
    const result = users.map((u) => ({
      id: u.id,
      name: u.getString('name'),
      email: u.getString('email'),
      role: u.getString('role'),
      created: u.getString('created'),
    }))
    return e.json(200, result)
  },
  $apis.requireAuth(),
)

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

    try {
      const auditCol = $app.findCollectionByNameOrId('audit_logs')
      const audit = new Record(auditCol)
      audit.set('user', e.auth?.id)
      audit.set('action', 'create')
      audit.set('entity', 'users')
      audit.set('details', record.publicExport())
      $app.saveNoValidate(audit)
    } catch (err) {
      console.log('Audit log error:', err.message)
    }

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
    const original = record.publicExport()

    record.setPassword(body.password)
    $app.save(record)

    try {
      const auditCol = $app.findCollectionByNameOrId('audit_logs')
      const audit = new Record(auditCol)
      audit.set('user', e.auth?.id)
      audit.set('action', 'update')
      audit.set('entity', 'users')
      audit.set('details', {
        before: original,
        after: record.publicExport(),
        note: 'Password updated',
      })
      $app.saveNoValidate(audit)
    } catch (err) {
      console.log('Audit log error:', err.message)
    }

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)

routerAdd(
  'PATCH',
  '/backend/v1/users/{id}',
  (e) => {
    const body = e.requestInfo().body
    if (e.auth?.getString('role') !== 'medico') throw new ForbiddenError('Not authorized')

    const id = e.request.pathValue('id')
    const record = $app.findRecordById('_pb_users_auth_', id)
    const original = record.publicExport()

    if (body.name !== undefined) record.set('name', body.name)
    if (body.email !== undefined) record.setEmail(body.email)
    if (body.role !== undefined) record.set('role', body.role)
    $app.save(record)

    try {
      const auditCol = $app.findCollectionByNameOrId('audit_logs')
      const audit = new Record(auditCol)
      audit.set('user', e.auth?.id)
      audit.set('action', 'update')
      audit.set('entity', 'users')
      audit.set('details', { before: original, after: record.publicExport() })
      $app.saveNoValidate(audit)
    } catch (err) {
      console.log('Audit log error:', err.message)
    }

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
