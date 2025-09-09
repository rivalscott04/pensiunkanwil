import * as React from "react"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { AppButton } from "@/components/ui/app-button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { XCircle, RefreshCw } from "lucide-react"

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  errorMessage?: string;
}

export function ErrorModal({ isOpen, onClose, onRetry, errorMessage }: ErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md animate-scale-in">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle>
            <AppHeading level={3} className="mb-2 text-destructive">
              Pengajuan Gagal
            </AppHeading>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <AppText color="muted" className="text-center">
            Terjadi kesalahan saat mengirim pengajuan pensiun. Silakan coba lagi.
          </AppText>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AppText size="sm" color="muted">
                <strong>Detail Error:</strong> {errorMessage}
              </AppText>
            </div>
          )}

          <div className="space-y-2">
            <AppText size="sm" weight="medium">Kemungkinan Penyebab:</AppText>
            <div className="space-y-1">
              <AppText size="sm" color="muted">• Koneksi internet terputus</AppText>
              <AppText size="sm" color="muted">• Server sedang maintenance</AppText>
              <AppText size="sm" color="muted">• File yang diunggah terlalu besar</AppText>
              <AppText size="sm" color="muted">• Format dokumen tidak didukung</AppText>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <AppButton variant="outline" onClick={onClose} className="flex-1">
              Tutup
            </AppButton>
            <AppButton variant="hero" onClick={onRetry} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </AppButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}