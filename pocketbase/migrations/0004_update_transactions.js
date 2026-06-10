migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('transactions')
    col.fields.add(new TextField({ name: 'patient' }))
    col.fields.add(
      new SelectField({
        name: 'entry_type',
        values: ['CONSULTA/PROCEDIMENTO', 'TAXA DE AGENDAMENTO', 'ESTORNO DE TAXA'],
        maxSelect: 1,
      }),
    )
    col.fields.add(new JSONField({ name: 'procedures' }))
    col.fields.add(new NumberField({ name: 'installments', min: 1, max: 12 }))
    col.fields.add(new NumberField({ name: 'card_fee_percent' }))
    col.fields.add(new NumberField({ name: 'card_fee_amount' }))
    col.fields.add(new NumberField({ name: 'net_amount' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('transactions')
    col.fields.removeByName('patient')
    col.fields.removeByName('entry_type')
    col.fields.removeByName('procedures')
    col.fields.removeByName('installments')
    col.fields.removeByName('card_fee_percent')
    col.fields.removeByName('card_fee_amount')
    col.fields.removeByName('net_amount')
    app.save(col)
  },
)
