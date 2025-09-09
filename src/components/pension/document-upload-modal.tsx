import * as React from "react"
import { useState } from "react"
import { Employee } from "@/types/employee"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { AppButton } from "@/components/ui/app-button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileUploadGrid } from "@/components/pension/file-upload-grid"
import { Upload, CheckCircle, ArrowLeft } from "lucide-react"

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onSubmit: (files: File[]) => void;
  employee: Employee | null;
  pensionType: string | null;
}

export function DocumentUploadModal({ 
  isOpen, 
  onClose, 
  onBack, 
  onSubmit, 
  employee, 
  pensionType 
}: DocumentUploadModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  // Calculate total documents needed based on pension type
  const getDocumentCount = (type: string | null) => {
    const baseDocuments = 10 // Always 10 mandatory documents
    
    switch (type) {
      case "bup":
        return baseDocuments // No additional documents
      case "sakit":
        return baseDocuments + 1 // + Surat Keterangan Sakit
      case "janda-duda":
        return baseDocuments + 3 // + Akta Kematian, Suket Janda/Duda, Pas Foto Pasangan
      case "aps":
        return baseDocuments + 2 // + Surat Usul Pemberhentian, Surat Permohonan PPS
      default:
        return baseDocuments
    }
  }

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(files)
  }

  const handleSubmit = () => {
    onSubmit(uploadedFiles)
  }

  const requiredDocuments = getDocumentCount(pensionType)
  const progressPercentage = pensionType 
    ? Math.round((uploadedFiles.length / requiredDocuments) * 100)
    : 0

  if (!employee || !pensionType) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-3">
              <AppButton variant="ghost" size="sm" onClick={onBack} className="p-1">
                <ArrowLeft className="h-4 w-4" />
              </AppButton>
              <div>
                <AppHeading level={3} className="mb-1">
                  Upload Dokumen Pensiun
                </AppHeading>
                <AppText size="sm" color="muted">
                  {employee.nama} • Jenis: {pensionType.toUpperCase()} • {requiredDocuments} dokumen diperlukan
                </AppText>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <AppText size="sm" color="muted">Progress Upload</AppText>
              <AppText size="sm" weight="semibold" className="text-orange">
                {uploadedFiles.length}/{requiredDocuments}
              </AppText>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <AppText size="xs" color="muted">
              {progressPercentage}% selesai
            </AppText>
          </div>

          {/* File Upload Grid */}
          <FileUploadGrid
            maxFiles={requiredDocuments}
            onFilesChange={handleFileUpload}
            uploadedFiles={uploadedFiles}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <AppButton variant="outline" onClick={onBack}>
            Kembali
          </AppButton>

          <AppButton
            variant="hero"
            onClick={handleSubmit}
            disabled={uploadedFiles.length < requiredDocuments}
            className="hover:scale-105 transition-all duration-200"
          >
            {uploadedFiles.length >= requiredDocuments ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Lanjutkan ke Konfirmasi
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Dokumen ({uploadedFiles.length}/{requiredDocuments})
              </>
            )}
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}