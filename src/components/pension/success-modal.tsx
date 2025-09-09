import * as React from "react"
import { Employee } from "@/types/employee"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { AppButton } from "@/components/ui/app-button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { CheckCircle, Calendar, FileText, Building2 } from "lucide-react"

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  pensionType: string | null;
  submissionDate: string;
}

export function SuccessModal({ 
  isOpen, 
  onClose, 
  employee, 
  pensionType, 
  submissionDate 
}: SuccessModalProps) {
  if (!employee || !pensionType) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPensionTypeLabel = (type: string) => {
    switch (type) {
      case "bup":
        return "Batas Usia Pensiun (BUP)"
      case "sakit":
        return "Pensiun Sakit"
      case "janda-duda":
        return "Pensiun Janda/Duda"
      case "aps":
        return "Atas Permintaan Sendiri (APS)"
      default:
        return type.toUpperCase()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md animate-scale-in">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-success/10 flex items-center justify-center animate-ripple">
            <CheckCircle className="h-8 w-8 text-success animate-scale-in" />
          </div>
          <DialogTitle>
            <AppHeading level={3} className="mb-2 text-success">
              Pengajuan Berhasil Dikirim!
            </AppHeading>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <AppText color="muted" className="text-center">
            Pengajuan pensiun telah berhasil dikirim dan sedang diproses oleh tim terkait.
          </AppText>

          <Card className="p-4 space-y-3 bg-success/5 border-success/20">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-success" />
              <div>
                <AppText size="sm" color="muted">Nama Pegawai</AppText>
                <AppText weight="medium">{employee.nama}</AppText>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-success" />
              <div>
                <AppText size="sm" color="muted">Jenis Pensiun</AppText>
                <AppText weight="medium">{getPensionTypeLabel(pensionType)}</AppText>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-success" />
              <div>
                <AppText size="sm" color="muted">Tanggal Pengajuan</AppText>
                <AppText weight="medium">{formatDate(submissionDate)}</AppText>
              </div>
            </div>
          </Card>

          <div className="p-3 rounded-lg bg-orange/10 border border-orange/20">
            <AppText size="sm" className="text-center">
              <strong>ID Pengajuan:</strong> PSN-{employee.nip.slice(-6)}-{Date.now().toString().slice(-4)}
            </AppText>
          </div>

          <div className="space-y-2">
            <AppText size="sm" weight="medium">Langkah Selanjutnya:</AppText>
            <div className="space-y-1">
              <AppText size="sm" color="muted">• Tim akan memverifikasi dokumen yang dikirim</AppText>
              <AppText size="sm" color="muted">• Status pengajuan dapat dilihat di dashboard</AppText>
              <AppText size="sm" color="muted">• Notifikasi akan dikirim untuk setiap update</AppText>
            </div>
          </div>

          <AppButton variant="hero" onClick={onClose} className="w-full">
            Tutup
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}