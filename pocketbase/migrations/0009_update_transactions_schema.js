/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('transactions')

    const categoryField = col.fields.getByName('category')
    if (categoryField && !categoryField.values.includes('ESTORNO DE TAXA')) {
      categoryField.values.push('ESTORNO DE TAXA')
    }

    const entryTypeField = col.fields.getByName('entry_type')
    if (entryTypeField && !entryTypeField.values.includes('ESTORNO DE TAXA')) {
      entryTypeField.values.push('ESTORNO DE TAXA')
    }

    app.save(col)
  },
  (app) => {},
)
