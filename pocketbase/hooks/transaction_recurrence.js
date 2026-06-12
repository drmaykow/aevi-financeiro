onRecordAfterCreateSuccess((e) => {
  const type = e.record.getString('type')
  const isRecurring = e.record.getBool('is_recurring')

  if (type === 'exit' && isRecurring) {
    const col = $app.findCollectionByNameOrId('transactions')
    const newRecord = new Record(col)

    const fieldsToCopy = [
      'type',
      'doctor',
      'amount',
      'payment_method',
      'category',
      'description',
      'patient',
      'entry_type',
      'procedures',
      'installments',
      'card_fee_percent',
      'card_fee_amount',
      'net_amount',
      'card_machine',
    ]

    for (const f of fieldsToCopy) {
      newRecord.set(f, e.record.get(f))
    }

    const dateStr = e.record.getString('date')
    if (dateStr) {
      // JS Date constructor works best with 'T' separating date and time
      const d = new Date(dateStr.replace(' ', 'T'))
      d.setMonth(d.getMonth() + 1)
      newRecord.set('date', d.toISOString().replace('T', ' '))
    }

    newRecord.set('is_recurring', false)

    $app.save(newRecord)
  }

  e.next()
}, 'transactions')
