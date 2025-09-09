import * as React from "react"
import { Employee } from "@/types/employee"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { AppButton } from "@/components/ui/app-button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { User, Calendar, Building2, FileText } from "lucide-react"

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employee: Employee | null;
}

export function ConfirmationModal({ isOpen, onClose, onConfirm, employee }: ConfirmationModalProps) {
  if (!employee) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md animate-scale-in">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-orange/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-orange" />
          </div>
          <DialogTitle>
            <AppHeading level={3} className="mb-2">
              Konfirmasi Pengajuan Pensiun
            </AppHeading>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <AppText color="muted" className="text-center">
            Anda akan mengajukan pensiun untuk pegawai berikut:
          </AppText>

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <AppText size="sm" color="muted">Nama Pegawai</AppText>
                <AppText weight="medium">{employee.nama}</AppText>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <AppText size="sm" color="muted">NIP</AppText>
                <AppText weight="medium" className="font-mono">{employee.nip}</AppText>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <AppText size="sm" color="muted">TMT Pensiun</AppText>
                <AppText weight="medium">{formatDate(employee.tmtPensiun)}</AppText>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <AppText size="sm" color="muted">Unit Kerja</AppText>
                <AppText weight="medium">{employee.unitKerja}</AppText>
              </div>
            </div>
          </Card>

          <div className="flex gap-3 pt-4">
            <AppButton variant="outline" onClick={onClose} className="flex-1">
              Batal
            </AppButton>
            <AppButton variant="hero" onClick={onConfirm} className="flex-1">
              Ya, Lanjutkan
            </AppButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}