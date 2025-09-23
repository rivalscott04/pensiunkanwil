import * as React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { AppLayout } from "@/components/layout/app-layout"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { AppButton } from "@/components/ui/app-button"
import { FileUploadGrid } from "@/components/pension/file-upload-grid"
import { FilePreviewModal } from "@/components/pension/file-preview-modal"
import { Employee } from "@/types/employee"
import { CheckCircle, Upload, ArrowLeft } from "lucide-react"
import { 
  apiCreatePensionApplication, 
  apiSubmitPensionApplication,
  CreatePensionApplicationRequest,
  PensionApplication,
  FileUploadResponse 
} from "@/lib/api"
import { apiUpdatePensionApplicationStatus } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

export default function DocumentUpload() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [pengajuanId, setPengajuanId] = useState<string | null>(null)
  const [createdApplication, setCreatedApplication] = useState<PensionApplication | null>(null)
  const [uploadedFileResponses, setUploadedFileResponses] = useState<FileUploadResponse[]>([])
  const { toast } = useToast()

  // Get data from navigation state
  const employee = location.state?.employee as Employee | null
  const pensionType = location.state?.pensionType as string | null

  // Redirect back if no required data
  useEffect(() => {
    if (!employee || !pensionType) {
      navigate('/pengajuan', { replace: true })
    }
  }, [employee, pensionType, navigate])

  // Create pension application when component mounts
  useEffect(() => {
    const createApplication = async () => {
      if (!employee || !pensionType || pengajuanId) return

      try {
        // Map UI pension type ids to backend accepted enum values
        const toBackendJenis = (type: string): 'BUP' | 'APS' | 'Janda/Duda' | 'Sakit' => {
          switch (type) {
            case 'bup':
              return 'BUP'
            case 'aps':
              return 'APS'
            case 'janda_duda':
              return 'Janda/Duda'
            case 'sakit':
              return 'Sakit'
            default:
              return 'BUP'
          }
        }

        const applicationData: CreatePensionApplicationRequest = {
          nip_pegawai: employee.nip,
          nama_pegawai: employee.nama,
          jabatan: employee.jabatan,
          unit_kerja: employee.unitKerja,
          pangkat_golongan: employee.golongan,
          jenis_pensiun: toBackendJenis(pensionType),
          catatan: `Pengajuan pensiun ${toBackendJenis(pensionType)} untuk ${employee.nama}`
        }

        const createdApp = await apiCreatePensionApplication(applicationData)
        setCreatedApplication(createdApp)
        setPengajuanId(createdApp.id)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Gagal membuat pengajuan"
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        })
        navigate('/pengajuan', { replace: true })
      }
    }

    createApplication()
  }, [employee, pensionType, pengajuanId, navigate, toast])

  // Helper function to map frontend pension type to backend format
  const mapPensionTypeToBackend = (type: string): 'normal' | 'dipercepat' | 'khusus' => {
    switch (type) {
      case 'bup':
        return 'normal'
      case 'sakit':
        return 'khusus'
      case 'janda_duda':
        return 'khusus'
      case 'aps':
        return 'dipercepat'
      default:
        return 'normal'
    }
  }

  // Calculate total documents needed based on pension type
  const getDocumentCount = (type: string | null) => {
    const baseDocuments = 10 // Always 10 mandatory documents
    
    switch (type) {
      case "bup":
        return baseDocuments // No additional documents
      case "sakit":
        return baseDocuments + 1 // + Surat Keterangan Sakit
      case "janda_duda":
        return baseDocuments + 3 // + Akta Kematian, Suket Janda/Duda, Pas Foto Pasangan
      case "aps":
        return baseDocuments + 2 // + Surat Usul Pemberhentian, Surat Permohonan PPS
      default:
        return baseDocuments
    }
  }

  // Get document labels based on pension type
  const getDocumentLabels = (type: string | null) => {
    const mandatoryLabels = [
      "Pengantar",
      "DPCP", 
      "SK CPNS",
      "SKKP Terakhir",
      "Super HD",
      "Super Pidana",
      "Pas Foto",
      "Buku Nikah",
      "Kartu Keluarga (KK)",
      "SKP Terakhir"
    ]
    
    switch (type) {
      case "bup":
        return user?.role === 'superadmin' ? [...mandatoryLabels, "SK Pensiun"] : mandatoryLabels
      case "sakit":
        return user?.role === 'superadmin'
          ? [...mandatoryLabels, "Surat Keterangan Sakit", "SK Pensiun"]
          : [...mandatoryLabels, "Surat Keterangan Sakit"]
      case "janda_duda":
        return user?.role === 'superadmin'
          ? [...mandatoryLabels, "Akta Kematian", "Suket Janda/Duda", "Pas Foto Pasangan", "SK Pensiun"]
          : [...mandatoryLabels, "Akta Kematian", "Suket Janda/Duda", "Pas Foto Pasangan"]
      case "aps":
        return user?.role === 'superadmin'
          ? [...mandatoryLabels, "Surat Usul PPK", "Surat Permohonan PPS", "SK Pensiun"]
          : [...mandatoryLabels, "Surat Usul PPK", "Surat Permohonan PPS"]
      default:
        return user?.role === 'superadmin' ? [...mandatoryLabels, "SK Pensiun"] : mandatoryLabels
    }
  }

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(files)
  }

  const handleFilePreview = (file: File) => {
    setPreviewFile(file)
    setIsPreviewOpen(true)
  }

  const handleUploadSuccess = (uploadedFile: FileUploadResponse) => {
    setUploadedFileResponses(prev => [...prev, uploadedFile])
    // Silent success; inline UI already shows success state per slot
  }

  const handleUploadError = (error: string) => {
    // Error will be shown inline on the specific slot; keep page quiet
  }

  const handleSubmit = async () => {
    if (!pengajuanId || !createdApplication) {
      toast({
        title: "Error",
        description: "Pengajuan belum dibuat",
        variant: "destructive"
      })
      return
    }

    try {
      // For superadmin: finalize directly to diterima
      if (user?.role === 'superadmin') {
        const submittedApp = await apiUpdatePensionApplicationStatus(pengajuanId, 'diterima')
        setCreatedApplication(submittedApp)

        toast({
          title: "Pengajuan Diselesaikan",
          description: `Pengajuan pensiun untuk ${employee?.nama} selesai (diterima).`,
        })

        navigate('/pengajuan', {
          state: {
            step: 'success',
            employee,
            pensionType,
            uploadedFiles,
            pengajuanId,
            application: submittedApp
          }
        })
      } else {
        // Operator: normal submit flow
        const submittedApp = await apiSubmitPensionApplication(pengajuanId)
        setCreatedApplication(submittedApp)
        
        toast({
          title: "Pengajuan Berhasil",
          description: `Pengajuan pensiun untuk ${employee?.nama} berhasil dikirim`,
        })

        navigate('/pengajuan', {
          state: {
            step: 'success',
            employee,
            pensionType,
            uploadedFiles,
            pengajuanId,
            application: submittedApp
          }
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal mengirim pengajuan"
      toast({
        title: "Pengajuan Gagal",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleBack = () => {
    navigate('/pengajuan', {
      state: {
        step: 'pension-type',
        employee
      }
    })
  }

  if (!employee || !pensionType) return null

  const requiredDocuments = getDocumentCount(pensionType)
  const labels = getDocumentLabels(pensionType)
  const maxFiles = labels.length
  const progressPercentage = Math.round((uploadedFiles.length / requiredDocuments) * 100)

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <AppButton variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </AppButton>
          <div>
            <AppHeading level={1} className="mb-1">
              Upload Dokumen Pensiun
            </AppHeading>
            <AppText color="muted">
              {employee.nama} • Jenis: {pensionType.toUpperCase()} • {requiredDocuments} dokumen diperlukan
            </AppText>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-card rounded-lg p-6 shadow-card border border-border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <AppText size="lg" weight="semibold">Progress Upload</AppText>
              <AppText size="lg" weight="bold" className="text-green-600 dark:text-orange-400">
                {uploadedFiles.length}/{requiredDocuments}
              </AppText>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-600 to-green-500 dark:from-orange-500 dark:to-orange-400 transition-all duration-700 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between">
              <AppText size="sm" color="muted">
                {progressPercentage}% selesai
              </AppText>
              <AppText size="sm" color="muted">
                Maksimal 350KB per file (SKP hingga 1.5MB)
              </AppText>
            </div>
          </div>
        </div>

        {/* File Upload Grid */}
        <FileUploadGrid
          maxFiles={maxFiles}
          onFilesChange={handleFileUpload}
          uploadedFiles={uploadedFiles}
          onFilePreview={handleFilePreview}
          documentLabels={labels}
          pensionType={pensionType}
          pengajuanId={pengajuanId}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <AppButton variant="outline" onClick={handleBack}>
            Kembali ke Pilih Jenis
          </AppButton>

          <AppButton
            variant="hero"
            size="lg"
            onClick={handleSubmit}
            disabled={uploadedFiles.length < requiredDocuments}
            className="hover:scale-105 transition-all duration-200"
          >
            {uploadedFiles.length >= requiredDocuments ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                {user?.role === 'superadmin' ? 'Selesaikan Pengajuan' : 'Lanjutkan ke Konfirmasi'}
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Upload Dokumen ({uploadedFiles.length}/{requiredDocuments})
              </>
            )}
          </AppButton>
        </div>

        {/* File Preview Modal */}
        <FilePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          file={previewFile}
        />
      </div>
    </AppLayout>
  )
}