migrate(
  (app) => {
    // 1. Atualizar registros existentes de transactions
    // de 'Seguimento' para 'Já é paciente'
    app
      .db()
      .newQuery(
        "UPDATE transactions SET patient_source = 'Já é paciente' WHERE patient_source = 'Seguimento'",
      )
      .execute()

    // 2. Atualizar opções do campo patient_source na coleção transactions
    const col = app.findCollectionByNameOrId('transactions')
    col.fields.add(
      new SelectField({
        name: 'patient_source',
        maxSelect: 1,
        values: [
          'Google',
          'Já é paciente',
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
  },
  (app) => {
    // Reverter opções do campo patient_source
    const col = app.findCollectionByNameOrId('transactions')
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

    // Reverter registros de 'Já é paciente' para 'Seguimento'
    app
      .db()
      .newQuery(
        "UPDATE transactions SET patient_source = 'Seguimento' WHERE patient_source = 'Já é paciente'",
      )
      .execute()
  },
)
