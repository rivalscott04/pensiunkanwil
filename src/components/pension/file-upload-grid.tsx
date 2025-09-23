import * as React from "react"
import { useState, useRef } from "react"
import { Upload, File, X, Eye, Check, Loader2 } from "lucide-react"
import { AppButton } from "@/components/ui/app-button"
import { AppText } from "@/components/ui/app-typography"
import { Card, CardContent } from "@/components/ui/card"
import { DocumentSection } from "@/components/pension/document-section"
import { cn } from "@/lib/utils"
import { apiUploadFile, apiGetPensionApplicationFiles, apiDeleteFile, FileUploadResponse } from "@/lib/api"

interface FileUploadSlot {
  id: string
  label: string
  required: boolean
  file?: File
}

interface FileUploadGridProps {
  maxFiles?: number
  onFilesChange?: (files: File[]) => void
  uploadedFiles?: File[]
  onFilePreview?: (file: File) => void
  documentLabels?: string[]
  pensionType?: string | null
  pengajuanId?: string | null
  onUploadSuccess?: (uploadedFile: FileUploadResponse) => void
  onUploadError?: (error: string) => void
}

const mandatoryDocuments = [
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

// Map document labels to backend jenis_dokumen values
const mapDocumentLabelToJenisDokumen = (label: string): string => {
  const mapping: Record<string, string> = {
    "Pengantar": "pengantar",
    "DPCP": "dpcp",
    "SK CPNS": "sk_cpns",
    "SKKP Terakhir": "skkp_terakhir",
    "Super HD": "super_hd",
    "Super Pidana": "super_pidana",
    "Pas Foto": "pas_foto",
    "Buku Nikah": "buku_nikah",
    "Kartu Keluarga (KK)": "kartu_keluarga",
    "SKP Terakhir": "skp_terakhir",
    "SK Pensiun": "sk_pensiun",
    "Surat Keterangan Sakit": "lainnya",
    "Akta Kematian": "lainnya",
    "Suket Janda/Duda": "lainnya",
    "Pas Foto Pasangan": "lainnya",
    "Surat Usul PPK": "lainnya",
    "Surat Permohonan PPS": "lainnya"
  }
  return mapping[label] || "lainnya"
}

export function FileUploadGrid({ 
  maxFiles = 12, 
  onFilesChange, 
  uploadedFiles = [], 
  onFilePreview, 
  documentLabels = [], 
  pensionType,
  pengajuanId,
  onUploadSuccess,
  onUploadError
}: FileUploadGridProps) {
  const [files, setFiles] = useState<File[]>(uploadedFiles)
  const [dragActive, setDragActive] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<number, string>>({})

  // Sync with external uploadedFiles prop
  React.useEffect(() => {
    setFiles(uploadedFiles)
  }, [uploadedFiles])

  // Create slots based on maxFiles
  const slots = Array.from({ length: maxFiles }, (_, index) => ({
    id: index,
    file: files[index] || null
  }))

  const handleFileSelect = async (slotIndex: number, file: File) => {
    // Validate file size with special case for SKP
    const label = documentLabels[slotIndex] || ''
    const isSkp = /skp/i.test(label)
    const maxSizeBytes = isSkp ? 1.5 * 1024 * 1024 : 350 * 1024
    if (file.size > maxSizeBytes) {
      const maxLabel = isSkp ? '1.5MB (SKP)' : '350KB'
      setErrors(prev => ({ ...prev, [slotIndex]: `File terlalu besar. Maksimal ${maxLabel} (file: ${formatFileSize(file.size)})` }))
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrors(prev => ({ ...prev, [slotIndex]: 'Tipe file tidak didukung. Hanya PDF, JPG, PNG.' }))
      return
    }
    // clear previous error
    setErrors(prev => {
      const next = { ...prev }
      delete next[slotIndex]
      return next
    })

    const newFiles = [...files]
    newFiles[slotIndex] = file
    setFiles(newFiles)
    onFilesChange?.(newFiles.filter(Boolean))

    // Upload to backend if pengajuanId is provided
    if (pengajuanId && documentLabels[slotIndex]) {
      const fileId = `${slotIndex}-${file.name}`
      setUploadingFiles(prev => new Set(prev).add(fileId))
      
      try {
        const jenisDokumen = mapDocumentLabelToJenisDokumen(documentLabels[slotIndex])
        // If replacing existing document of same jenis, delete it first to avoid duplicates
        try {
          const existing = await apiGetPensionApplicationFiles(pengajuanId)
          const match = existing.find(f => f.jenis_dokumen === jenisDokumen)
          if (match) {
            await apiDeleteFile(String(match.id))
          }
        } catch (_) {
          // best-effort; proceed with upload even if cleanup fails
        }
        const uploadedFile = await apiUploadFile(pengajuanId, file, jenisDokumen, true)
        onUploadSuccess?.(uploadedFile)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        setErrors(prev => ({ ...prev, [slotIndex]: errorMessage }))
        onUploadError?.(errorMessage)
        // Remove file from local state if upload failed
        const updatedFiles = [...files]
        updatedFiles[slotIndex] = undefined as any
        setFiles(updatedFiles.filter(Boolean))
        onFilesChange?.(updatedFiles.filter(Boolean))
      } finally {
        setUploadingFiles(prev => {
          const newSet = new Set(prev)
          newSet.delete(fileId)
          return newSet
        })
      }
    }
  }

  const handleFileRemove = async (slotIndex: number) => {
    const currentLabel = documentLabels[slotIndex]

    // Optimistic UI update
    const newFiles = [...files]
    newFiles[slotIndex] = undefined as any
    const filteredFiles = newFiles.filter(Boolean)
    setFiles(filteredFiles)
    onFilesChange?.(filteredFiles)
    setErrors(prev => {
      const next = { ...prev }
      delete next[slotIndex]
      return next
    })

    // Attempt backend deletion when possible
    try {
      if (pengajuanId && currentLabel) {
        const jenisDokumen = mapDocumentLabelToJenisDokumen(currentLabel)
        const existing = await apiGetPensionApplicationFiles(pengajuanId)
        const match = existing.find(f => f.jenis_dokumen === jenisDokumen)
        if (match) {
          await apiDeleteFile(String(match.id))
        }
      }
    } catch (error) {
      // Surface inline error on this slot (use a stable key)
      const message = error instanceof Error ? error.message : 'Gagal menghapus file di server'
      setErrors(prev => ({ ...prev, [slotIndex]: message }))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault()
    setDragActive(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      const file = droppedFiles[0]
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        handleFileSelect(slotIndex, file)
      }
    }
  }

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const triggerFileInput = (slotIndex: number) => {
    fileInputRefs.current[slotIndex]?.click()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Define document sections
  const getDocumentSections = () => {
    const sections = [
      {
        id: 'main',
        title: 'Dokumen Wajib Utama',
        description: 'Dokumen utama yang wajib dilengkapi',
        indices: [0, 1, 2, 3] // Pengantar, DPCP, SK CPNS, SKKP Terakhir
      },
      {
        id: 'administrative', 
        title: 'Dokumen Administratif',
        description: 'Dokumen administratif kepegawaian',
        indices: [4, 5, 9] // Super HD, Super Pidana, SKP Terakhir
      },
      {
        id: 'personal',
        title: 'Dokumen Personal',
        description: 'Dokumen identitas dan keluarga',
        indices: [6, 7, 8] // Pas Foto, Buku Nikah, KK
      }
    ]

    // Add additional section based on pension type
    if (pensionType && pensionType !== 'bup') {
      const additionalIndices = []
      const baseCount = 10
      
      if (pensionType === 'sakit') {
        additionalIndices.push(baseCount) // Surat Keterangan Sakit
      } else if (pensionType === 'janda_duda') {
        additionalIndices.push(baseCount, baseCount + 1, baseCount + 2) // Akta, Suket, Pas Foto Pasangan
      } else if (pensionType === 'aps') {
        additionalIndices.push(baseCount, baseCount + 1) // Surat Usul, Surat Permohonan
      }

      if (additionalIndices.length > 0) {
        sections.push({
          id: 'additional',
          title: 'Dokumen Tambahan',
          description: `Dokumen khusus untuk pensiun ${pensionType.toUpperCase()}`,
          indices: additionalIndices
        })
      }
    }

    return sections
  }

  const renderFileCard = (slotIndex: number) => {
    const slot = slots.find(s => s.id === slotIndex)
    if (!slot) return null
    
    const hasFile = slot.file
    const fileId = `${slotIndex}-${slot.file?.name || ''}`
    const isUploading = uploadingFiles.has(fileId)
    
    return (
      <Card
        key={slotIndex}
        className={cn(
          "relative transition-all duration-300 cursor-pointer group hover:shadow-hover",
          hasFile
            ? "border-success shadow-card"
            : dragActive
            ? "border-orange shadow-button"
            : cn("border-dashed border-muted-foreground/30 hover:border-orange/50 hover:shadow-card", errors[slotIndex] && "border-destructive")
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, slotIndex)}
      >
        <input
          ref={(el) => { fileInputRefs.current[slotIndex] = el }}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(slotIndex, file)
          }}
        />

        <CardContent className="p-4">
          {hasFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isUploading ? (
                    <div className="p-1 bg-orange text-orange-foreground rounded-full">
                      <Loader2 className="w-3 h-3 animate-spin" />
                    </div>
                  ) : (
                    <div className="p-1 bg-success text-success-foreground rounded-full">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  <AppText size="sm" weight="medium" className={isUploading ? "text-orange" : "text-success"}>
                    {isUploading ? "Uploading..." : "Berhasil"}
                  </AppText>
                </div>
                {!isUploading && (
                  <AppButton
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleFileRemove(slotIndex)}
                  >
                    <X className="w-3 h-3" />
                  </AppButton>
                )}
              </div>
              
              <div>
                <AppText size="sm" weight="medium">
                  {documentLabels[slotIndex] || `Dokumen ${slotIndex + 1}`}
                </AppText>
                <AppText size="xs" color="muted" className="truncate">
                  {hasFile.name}
                </AppText>
                <AppText size="xs" color="muted">
                  {formatFileSize(hasFile.size)}
                </AppText>
              </div>

              <div className="flex space-x-2">
                <AppButton
                  variant="outline"
                  size="sm"
                  className="flex-1 hover:shadow-card hover:scale-105 transition-all duration-200"
                  onClick={() => triggerFileInput(slotIndex)}
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Ganti
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="sm"
                  className="px-2 hover:shadow-card hover:scale-105 transition-all duration-200"
                  onClick={() => onFilePreview?.(hasFile)}
                >
                  <Eye className="w-3 h-3" />
                </AppButton>
              </div>
              {errors[slotIndex] ? (
                <div className="text-xs text-destructive mt-1">{errors[slotIndex]}</div>
              ) : null}
            </div>
          ) : (
            <div 
              className="space-y-4 cursor-pointer group-hover:scale-105 transition-transform duration-200"
              onClick={() => triggerFileInput(slotIndex)}
            >
              <div className="text-center">
                <div className="p-4 bg-orange/10 rounded-xl inline-flex group-hover:bg-orange/20 transition-colors duration-200">
                  <File className="w-8 h-8 text-orange" />
                </div>
              </div>
              
              <div className="text-center space-y-1">
                <AppText size="sm" weight="medium">
                  {documentLabels[slotIndex] || `Dokumen ${slotIndex + 1}`}
                </AppText>
                <AppText size="xs" color="muted">
                  Upload {documentLabels[slotIndex] || 'file dokumen'}
                </AppText>
                <AppText size="xs" color="muted" className="font-medium">
                  Klik atau seret file ke sini
                </AppText>
                {errors[slotIndex] ? (
                  <div className="text-xs text-destructive mt-2">{errors[slotIndex]}</div>
                ) : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <AppText color="muted">
          Unggah dokumen yang diperlukan. Total dokumen: {maxFiles}
        </AppText>
        <AppText size="sm" color="muted">
          Format: PDF, JPG, PNG • Maks. 350KB (SKP maks. 1.5MB)
        </AppText>
      </div>

      {getDocumentSections().map((section) => {
        const sectionFiles = section.indices.map(index => files[index]).filter(Boolean)
        const completedCount = sectionFiles.length
        const totalCount = section.indices.length
        
        return (
          <DocumentSection
            key={section.id}
            title={section.title}
            description={section.description}
            completed={completedCount}
            total={totalCount}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.indices.map((slotIndex) => renderFileCard(slotIndex))}
            </div>
          </DocumentSection>
        )
      })}

      <div className="text-center pt-4 border-t border-border">
        <AppText size="sm" color="muted">
          Total file terunggah: {files.filter(Boolean).length} dari {maxFiles}
        </AppText>
      </div>
    </div>
  )
}