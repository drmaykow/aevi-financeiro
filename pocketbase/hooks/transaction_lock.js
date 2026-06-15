onRecordBeforeUpdateRequest((e) => {
  const role = e.auth?.getString('role')
  if (role === 'secretaria') {
    const createdStr = e.record.original().getString('created')
    if (createdStr) {
      const createdDate = new Date(createdStr.replace(' ', 'T'))
      const diff = Date.now() - createdDate.getTime()
      if (diff > 48 * 3600 * 1000) {
        throw new BadRequestError('Modificação não permitida. O prazo de 48 horas expirou.')
      }
    }
  }
  e.next()
}, 'transactions')

onRecordBeforeDeleteRequest((e) => {
  const role = e.auth?.getString('role')
  if (role === 'secretaria') {
    const createdStr = e.record.getString('created')
    if (createdStr) {
      const createdDate = new Date(createdStr.replace(' ', 'T'))
      const diff = Date.now() - createdDate.getTime()
      if (diff > 48 * 3600 * 1000) {
        throw new BadRequestError('Exclusão não permitida. O prazo de 48 horas expirou.')
      }
    }
  }
  e.next()
}, 'transactions')
