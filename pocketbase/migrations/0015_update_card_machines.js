migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('card_machines')
    col.fields.add(
      new SelectField({
        name: 'settlement_mode',
        values: ['ANTECIPADO', 'PARCELADO'],
        maxSelect: 1,
        required: false,
      }),
    )
    app.save(col)

    // Update existing records to have a default settlement_mode
    app
      .db()
      .newQuery(
        "UPDATE card_machines SET settlement_mode = 'ANTECIPADO' WHERE settlement_mode IS NULL OR settlement_mode = ''",
      )
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('card_machines')
    col.fields.removeByName('settlement_mode')
    app.save(col)
  },
)
