import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

interface EditTransactionModalProps {
  transaction: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditTransactionModal({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: EditTransactionModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '',
        amount: transaction.amount || 0,
        description: transaction.description || '',
        category: transaction.category || '',
        patient: transaction.patient || '',
        doctor: transaction.doctor || '',
        patient_source: transaction.patient_source || '',
        payment_method: transaction.payment_method || '',
      })
    }
  }, [transaction])

  const handleSubmit = async () => {
    if (!transaction?.id) return
    setLoading(true)
    try {
      await pb.collection('transactions').update(transaction.id, {
        date: formData.date ? `${formData.date} 12:00:00.000Z` : transaction.date,
        amount: Number(formData.amount),
        description: formData.description,
        category: formData.category,
        patient: formData.patient,
        doctor: formData.doctor,
        patient_source: formData.patient_source,
        payment_method: formData.payment_method,
      })
      toast({ title: 'Sucesso', description: 'Registro atualizado com sucesso.' })
      onSuccess()
      onOpenChange(false)
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e.message || 'Falha ao atualizar.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary mb-4">
            Editar Lançamento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="rounded-xl h-11 bg-muted/50 border-transparent"
            />
          </div>
          <div className="space-y-2">
            <Label>Valor</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="rounded-xl h-11 bg-muted/50 border-transparent"
            />
          </div>
          {transaction.type === 'exit' && (
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded-xl h-11 bg-muted/50 border-transparent"
              />
            </div>
          )}
          {transaction.type === 'entry' && (
            <>
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Input
                  value={formData.patient}
                  onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                  className="rounded-xl h-11 bg-muted/50 border-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label>Médico</Label>
                <Input
                  value={formData.doctor}
                  onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                  className="rounded-xl h-11 bg-muted/50 border-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(val) => setFormData({ ...formData, payment_method: val })}
                >
                  <SelectTrigger className="rounded-xl h-11 bg-muted/50 border-transparent">
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="DINHEIRO">DINHEIRO</SelectItem>
                    <SelectItem value="CARTÃO DE CRÉDITO">CARTÃO DE CRÉDITO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Origem do Paciente</Label>
                <Select
                  value={formData.patient_source}
                  onValueChange={(val) => setFormData({ ...formData, patient_source: val })}
                >
                  <SelectTrigger className="rounded-xl h-11 bg-muted/50 border-transparent">
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
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
                    ].map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-full bg-primary hover:bg-primary/90 h-11 mt-4"
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
