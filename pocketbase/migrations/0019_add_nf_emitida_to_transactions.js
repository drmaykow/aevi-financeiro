migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('transactions')
    if (!col.fields.getByName('nf_emitida')) {
      col.fields.add(
        new BoolField({
          name: 'nf_emitida',
          required: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('transactions')
    const field = col.fields.getByName('nf_emitida')
    if (field) {
      col.fields.removeById(field.id)
      app.save(col)
    }
  },
)
