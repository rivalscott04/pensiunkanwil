import * as React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { AppLayout } from "@/components/layout/app-layout"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { AppButton } from "@/components/ui/app-button"
import { Employee } from "@/types/employee"
import { EmployeeDataTable } from "@/components/pension/employee-data-table"
import { ConfirmationModal } from "@/components/pension/confirmation-modal"
import { PensionTypeModal } from "@/components/pension/pension-type-modal"
import { SubmitConfirmationModal } from "@/components/pension/submit-confirmation-modal"
import { SuccessModal } from "@/components/pension/success-modal"
import { ErrorModal } from "@/components/pension/error-modal"
import { FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  apiCreatePensionApplication, 
  apiSubmitPensionApplication,
  CreatePensionApplicationRequest,
  PensionApplication 
} from "@/lib/api"

type ModalStep = 'none' | 'confirmation' | 'pension-type' | 'upload' | 'submit-confirmation' | 'success' | 'error'

export default function PegawaiPensiun() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [currentModalStep, setCurrentModalStep] = useState<ModalStep>('none')
  const [selectedPensionType, setSelectedPensionType] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionDate, setSubmissionDate] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [pengajuanId, setPengajuanId] = useState<string | null>(null)
  const [createdApplication, setCreatedApplication] = useState<PensionApplication | null>(null)
  const { toast } = useToast()

  // Handle navigation state from DocumentUpload page
  useEffect(() => {
    if (location.state?.step) {
      const { step, employee, pensionType, uploadedFiles: files } = location.state
      
      if (step === 'submit-confirmation' && employee && pensionType && files) {
        setSelectedEmployee(employee)
        setSelectedPensionType(pensionType)
        setUploadedFiles(files)
        setCurrentModalStep('submit-confirmation')
      } else if (step === 'pension-type' && employee) {
        setSelectedEmployee(employee)
        setCurrentModalStep('pension-type')
      }
      
      // Clean up navigation state
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee)
  }

  const handleStartApplication = () => {
    if (!selectedEmployee) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Pilih pegawai terlebih dahulu",
      })
      return
    }
    setCurrentModalStep('confirmation')
  }

  const handleConfirmEmployee = () => {
    setCurrentModalStep('pension-type')
  }

  const handlePensionTypeSelect = (pensionType: any) => {
    const typeId = typeof pensionType === 'string' ? pensionType : pensionType.id
    setSelectedPensionType(typeId)
    
    // Navigate to document upload page instead of modal
    navigate('/pengajuan/upload', {
      state: {
        employee: selectedEmployee,
        pensionType: typeId
      }
    })
  }

  const handleDocumentUpload = (files: File[]) => {
    setUploadedFiles(files)
    setCurrentModalStep('submit-confirmation')
  }

  const handleFinalSubmit = async () => {
    if (!selectedEmployee || !selectedPensionType) {
      setErrorMessage("Data pegawai atau jenis pensiun tidak lengkap")
      setCurrentModalStep('error')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Step 1: Create pension application
      const applicationData: CreatePensionApplicationRequest = {
        nip_pegawai: selectedEmployee.nip,
        nama_pegawai: selectedEmployee.nama,
        jabatan: selectedEmployee.jabatan,
        unit_kerja: selectedEmployee.unitKerja,
        pangkat_golongan: selectedEmployee.golongan,
        tanggal_lahir: selectedEmployee.tanggalLahir,
        tanggal_mulai_kerja: selectedEmployee.tanggalMulaiKerja,
        masa_kerja_tahun: selectedEmployee.masaKerjaTahun,
        masa_kerja_bulan: selectedEmployee.masaKerjaBulan,
        jenis_pensiun: mapPensionTypeToBackend(selectedPensionType),
        tanggal_pensiun: selectedEmployee.tmtPensiun,
        catatan: `Pengajuan pensiun ${selectedPensionType.toUpperCase()} untuk ${selectedEmployee.nama}`
      }

      const createdApp = await apiCreatePensionApplication(applicationData)
      setCreatedApplication(createdApp)
      setPengajuanId(createdApp.id)

      // Step 2: Submit the application
      const submittedApp = await apiSubmitPensionApplication(createdApp.id)
      setCreatedApplication(submittedApp)
      
      setSubmissionDate(new Date().toISOString())
      setCurrentModalStep('success')
      
      toast({
        title: "Pengajuan Berhasil",
        description: `Pengajuan pensiun untuk ${selectedEmployee.nama} berhasil dikirim`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan tidak terduga"
      setErrorMessage(errorMessage)
      setCurrentModalStep('error')
      
      toast({
        title: "Pengajuan Gagal",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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

  const handleCloseModals = () => {
    setCurrentModalStep('none')
    setSelectedEmployee(null)
    setSelectedPensionType(null)
    setUploadedFiles([])
    setSubmissionDate("")
    setErrorMessage("")
    setPengajuanId(null)
    setCreatedApplication(null)
  }

  const handleRetrySubmission = () => {
    setCurrentModalStep('submit-confirmation')
    setErrorMessage("")
  }

  const handleBackToPensionType = () => {
    setCurrentModalStep('pension-type')
    setUploadedFiles([])
  }

  const handleBackToUpload = () => {
    setCurrentModalStep('upload')
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <AppHeading level={1} className="mb-2">
              Pegawai Pensiun
            </AppHeading>
            <AppText color="muted">
              Kelola data pegawai dan buat pengajuan pensiun dengan mudah dan terstruktur
            </AppText>
          </div>
        </div>

        {/* Action Button - Show when employee is selected */}
        {selectedEmployee && (
          <div className="flex justify-end animate-slide-down">
            <AppButton 
              variant="hero" 
              size="lg"
              onClick={handleStartApplication}
              className="hover:scale-105 transition-all duration-200"
            >
              <FileText className="h-5 w-5 mr-2" />
              Buat Pengajuan Pensiun
            </AppButton>
          </div>
        )}

        {/* Employee Data Table */}
        <EmployeeDataTable 
          onEmployeeSelect={handleEmployeeSelect}
          selectedEmployee={selectedEmployee}
        />

        {/* Modal Flow */}
        <ConfirmationModal
          isOpen={currentModalStep === 'confirmation'}
          onClose={handleCloseModals}
          onConfirm={handleConfirmEmployee}
          employee={selectedEmployee}
        />

        <PensionTypeModal
          isOpen={currentModalStep === 'pension-type'}
          onClose={handleCloseModals}
          onSelect={handlePensionTypeSelect}
        />

        <SubmitConfirmationModal
          isOpen={currentModalStep === 'submit-confirmation'}
          onClose={handleCloseModals}
          onBack={handleBackToUpload}
          onConfirm={handleFinalSubmit}
          employee={selectedEmployee}
          pensionType={selectedPensionType}
          uploadedFiles={uploadedFiles}
          isSubmitting={isSubmitting}
        />

        <SuccessModal
          isOpen={currentModalStep === 'success'}
          onClose={handleCloseModals}
          employee={selectedEmployee}
          pensionType={selectedPensionType}
          submissionDate={submissionDate}
        />

        <ErrorModal
          isOpen={currentModalStep === 'error'}
          onClose={handleCloseModals}
          onRetry={handleRetrySubmission}
          errorMessage={errorMessage}
        />
      </div>
    </AppLayout>
  )
}