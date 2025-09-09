import * as React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AppButton } from "@/components/ui/app-button"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { Download, X, FileText, Image as ImageIcon } from "lucide-react"

interface FilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  file: File | null
}

export function FilePreviewModal({ isOpen, onClose, file }: FilePreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true)

  if (!file) return null

  const isPDF = file.type === 'application/pdf'
  const isImage = file.type.startsWith('image/')
  const fileURL = React.useMemo(() => {
    return file ? URL.createObjectURL(file) : null
  }, [file])

  React.useEffect(() => {
    return () => {
      if (fileURL) {
        URL.revokeObjectURL(fileURL)
      }
    }
  }, [fileURL])

  const handleDownload = () => {
    if (fileURL) {
      const a = document.createElement('a')
      a.href = fileURL
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isPDF ? (
                  <FileText className="h-5 w-5 text-red-500" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                )}
                <div>
                  <AppHeading level={3} className="mb-1">
                    Preview Dokumen
                  </AppHeading>
                  <AppText size="sm" color="muted">
                    {file.name} • {formatFileSize(file.size)}
                  </AppText>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AppButton
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="hover:scale-105 transition-all duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="hover:scale-105 transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                </AppButton>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-muted rounded-lg">
          {fileURL && (
            <div className="h-[60vh] w-full">
              {isPDF ? (
                <div className="h-full w-full relative">
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-orange border-t-transparent rounded-full animate-spin" />
                        <AppText color="muted">Memuat PDF...</AppText>
                      </div>
                    </div>
                  )}
                  <iframe
                    src={fileURL}
                    className="w-full h-full border-0 rounded-lg"
                    title={`Preview ${file.name}`}
                    onLoad={() => setIsLoading(false)}
                  />
                </div>
              ) : isImage ? (
                <div className="h-full w-full flex items-center justify-center p-4">
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-orange border-t-transparent rounded-full animate-spin" />
                        <AppText color="muted">Memuat gambar...</AppText>
                      </div>
                    </div>
                  )}
                  <img
                    src={fileURL}
                    alt={file.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                    <div>
                      <AppText weight="semibold">File tidak dapat di-preview</AppText>
                      <AppText size="sm" color="muted">
                        Tipe file tidak didukung untuk preview
                      </AppText>
                    </div>
                    <AppButton variant="outline" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download untuk melihat
                    </AppButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <AppButton variant="outline" onClick={onClose}>
            Tutup
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}