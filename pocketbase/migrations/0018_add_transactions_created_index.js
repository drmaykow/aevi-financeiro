migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('transactions')
    col.addIndex('idx_transactions_created', false, 'created', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('transactions')
    col.removeIndex('idx_transactions_created')
    app.save(col)
  },
)
