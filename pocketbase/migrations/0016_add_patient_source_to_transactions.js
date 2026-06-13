migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('transactions')
    if (!col.fields.getByName('patient_source')) {
      col.fields.add(
        new SelectField({
          name: 'patient_source',
          maxSelect: 1,
          values: [
            'Google',
            'Seguimento',
            'Médico(a)',
            'Paciente',
            'Facebook',
            'Instagram',
            'Tik Tok',
            'Chat GPT',
            'Youtube',
            'Doctorália',
            'ECO',
            'Desconhecido',
            'Outros',
          ],
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('transactions')
    const field = col.fields.getByName('patient_source')
    if (field) {
      col.fields.removeById(field.id)
      app.save(col)
    }
  },
)
