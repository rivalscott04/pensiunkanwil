import * as React from "react"
import { Employee } from "@/types/employee"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { AppButton } from "@/components/ui/app-button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { AlertTriangle, FileText, Upload, CheckCircle, Calendar } from "lucide-react"

interface SubmitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onConfirm: () => void;
  employee: Employee | null;
  pensionType: string | null;
  uploadedFiles: File[];
  isSubmitting: boolean;
}

export function SubmitConfirmationModal({ 
  isOpen, 
  onClose, 
  onBack, 
  onConfirm, 
  employee, 
  pensionType, 
  uploadedFiles,
  isSubmitting 
}: SubmitConfirmationModalProps) {
  if (!employee || !pensionType) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
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
      <DialogContent className="max-w-lg animate-scale-in">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
          <DialogTitle>
            <AppHeading level={3} className="mb-2">
              Konfirmasi Final Pengajuan
            </AppHeading>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <AppText color="muted" className="text-center">
            Pastikan semua data sudah benar sebelum mengirim pengajuan pensiun.
          </AppText>

          <Card className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <AppText size="sm" color="muted">Nama Pegawai</AppText>
                <AppText weight="medium">{employee.nama}</AppText>
              </div>

              <div className="flex items-center justify-between">
                <AppText size="sm" color="muted">NIP</AppText>
                <AppText weight="medium" className="font-mono">{employee.nip}</AppText>
              </div>

              <div className="flex items-center justify-between">
                <AppText size="sm" color="muted">Jenis Pensiun</AppText>
                <AppText weight="medium">{getPensionTypeLabel(pensionType)}</AppText>
              </div>

              <div className="flex items-center justify-between">
                <AppText size="sm" color="muted">TMT Pensiun</AppText>
                <AppText weight="medium">{formatDate(employee.tmtPensiun)}</AppText>
              </div>

              <div className="flex items-center justify-between">
                <AppText size="sm" color="muted">Dokumen Terupload</AppText>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AppText weight="medium">{uploadedFiles.length} file</AppText>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <AppText size="sm" color="muted">Tanggal Pengajuan</AppText>
                <AppText weight="medium">{formatDate(new Date().toISOString())}</AppText>
              </div>
            </div>
          </Card>

          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
              <AppText size="sm" color="muted">
                Setelah pengajuan dikirim, data tidak dapat diubah. Pastikan semua informasi sudah benar.
              </AppText>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <AppButton variant="outline" onClick={onBack} className="flex-1" disabled={isSubmitting}>
              Kembali
            </AppButton>
            <AppButton 
              variant="hero" 
              onClick={onConfirm} 
              className="flex-1"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Mengirim..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Ya, Kirim Pengajuan
                </>
              )}
            </AppButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}