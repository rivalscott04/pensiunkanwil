import * as React from "react"
import { useState, useMemo, useEffect } from "react"
import { API_BASE_URL } from "@/lib/api"
import { useParams, useNavigate } from "react-router-dom"
import { AppLayout } from "@/components/layout/app-layout"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  ExternalLink, 
  Printer, 
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building,
  FileText,
  AlertTriangle
} from "lucide-react"

interface Document {
  id: string
  name: string
  size: string
  uploadDate: string
  isCompliant: boolean
  rejectionReason?: string
  previewUrl: string
  category: string
}

interface Application {
  id: string
  tanggalPengajuan: string
  namaPegawai: string
  nip: string
  jenisPensiun: string
  status: 'draft' | 'diajukan' | 'diterima' | 'ditolak'
  tanggalUpdate: string
  tempatLahir: string
  tanggalLahir: string
  alamat: string
  noTelp: string
  email: string
  unitKerja: string
  jabatan: string
  masaKerja: string
  gajiPokok: string
  documents: Document[]
  statusHistory: Array<{
    status: string
    date: string
    notes?: string
    updatedBy: string
  }>
  rejectionNotes?: string
}

// API-backed initial empty state

export default function DetailPengajuan() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // Fetch application by ID
  const [application, setApplication] = useState<Application | null>(null)
  const [documentCompliance, setDocumentCompliance] = useState<Record<string, boolean>>(
    {}
  )
  const [rejectionNotes, setRejectionNotes] = useState("")
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      const res = await fetch(`${API_BASE_URL || ''}/api/pengajuan/${id}`, { credentials: 'include' })
      const json = await res.json()
      const it = json?.data || json
      const app: Application = {
        id: String(it.id ?? it.nomor_pengajuan ?? id),
        tanggalPengajuan: it.tanggal_pengajuan ?? it.created_at ?? '',
        namaPegawai: it.nama_pegawai ?? '',
        nip: it.nip_pegawai ?? '',
        jenisPensiun: it.jenis_pensiun ?? 'Pensiun Normal',
        status: it.status ?? 'draft',
        tanggalUpdate: it.updated_at ?? it.tanggal_pengajuan ?? '',
        tempatLahir: it.tempat_lahir ?? '',
        tanggalLahir: it.tanggal_lahir ?? '',
        alamat: it.alamat ?? '',
        noTelp: it.no_telp ?? '',
        email: it.email ?? '',
        unitKerja: it.unit_kerja ?? '',
        jabatan: it.jabatan ?? '',
        masaKerja: it.masa_kerja ?? '',
        gajiPokok: it.gaji_pokok ? String(it.gaji_pokok) : '',
        documents: Array.isArray(it.files) ? it.files.map((f: any) => ({
          id: String(f.id),
          name: f.nama_asli ?? f.nama_file ?? 'Dokumen',
          size: f.size ? `${Math.round((f.size/1024/1024)*10)/10} MB` : '-',
          uploadDate: f.created_at ?? '',
          isCompliant: !!f.is_required ? true : false,
          previewUrl: `${API_BASE_URL || ''}/api/files/${f.id}/preview`,
          category: f.jenis_dokumen ?? 'Dokumen'
        })) : [],
        statusHistory: [],
      }
      setApplication(app)
      setDocumentCompliance(Object.fromEntries(app.documents.map(doc => [doc.id, doc.isCompliant])))
    }
    load()
  }, [id])

  const allDocumentsCompliant = useMemo(() => {
    return (application?.documents || []).every(doc => documentCompliance[doc.id])
  }, [documentCompliance, application?.documents])

  const hasNonCompliantDocuments = useMemo(() => {
    return (application?.documents || []).some(doc => !documentCompliance[doc.id])
  }, [documentCompliance, application?.documents])

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { color: "bg-secondary", text: "Draft", icon: Edit },
      diajukan: { color: "bg-orange-500", text: "Diajukan", icon: Clock },
      diterima: { color: "bg-green-500", text: "Diterima", icon: CheckCircle },
      ditolak: { color: "bg-destructive", text: "Ditolak", icon: XCircle }
    }
    
    const config = statusMap[status as keyof typeof statusMap]
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} text-white px-3 py-1`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long', 
      year: 'numeric'
    })
  }

  const handleDocumentComplianceToggle = (documentId: string, isCompliant: boolean) => {
    setDocumentCompliance(prev => ({
      ...prev,
      [documentId]: isCompliant
    }))
  }

  const handlePreviewDocument = (document: Document) => {
    // In real app, this would open the actual document
    window.open(document.previewUrl, '_blank')
    toast({
      title: "Membuka Preview",
      description: `Membuka preview ${document.name} di tab baru`
    })
  }

  const handleDownloadDocument = (document: Document) => {
    // In real app, this would download the actual file
    toast({
      title: "Download Dimulai",
      description: `Mengunduh ${document.name}`
    })
  }

  const handleApproveApplication = async () => {
    setIsSubmittingDecision(true)
    
    try {
      // In real app, call API to approve
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setApplication(prev => ({
        ...prev,
        status: 'diterima',
        tanggalUpdate: new Date().toISOString().split('T')[0]
      }))

      toast({
        title: "Pengajuan Diterima",
        description: "Pengajuan pensiun telah berhasil diterima"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menerima pengajuan",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingDecision(false)
    }
  }

  const handleRejectApplication = async () => {
    if (!rejectionNotes.trim()) {
      toast({
        title: "Catatan Diperlukan",
        description: "Harap masukkan catatan penolakan",
        variant: "destructive"
      })
      return
    }

    setIsSubmittingDecision(true)
    
    try {
      // In real app, call API to reject
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setApplication(prev => ({
        ...prev,
        status: 'ditolak',
        rejectionNotes,
        tanggalUpdate: new Date().toISOString().split('T')[0]
      }))

      toast({
        title: "Pengajuan Ditolak",
        description: "Pengajuan pensiun telah ditolak dengan catatan"
      })
    } catch (error) {
      toast({
        title: "Error", 
        description: "Gagal menolak pengajuan",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingDecision(false)
    }
  }

  const handleEditRejectedDocuments = () => {
    const rejectedDocuments = application.documents
      .filter(doc => !documentCompliance[doc.id])
      .map(doc => doc.id)
    
    // Navigate to document upload with pre-selected rejected documents
    navigate(`/pengajuan/upload?applicationId=${id}&rejectedDocs=${rejectedDocuments.join(',')}`)
  }

  const handlePrint = () => {
    window.print()
    toast({
      title: "Print Document",
      description: "Membuka dialog print"
    })
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        {/* Header with Breadcrumb */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/pengajuan')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Pengajuan
          </Button>
        </div>

        {/* Application Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <AppHeading level={1} className="mb-0">
                    {application.namaPegawai}
                  </AppHeading>
                  {getStatusBadge(application.status)}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {application.nip}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {application.jenisPensiun}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Diajukan {formatDate(application.tanggalPengajuan)}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {application.status === 'draft' && (
                  <Button size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Dokumen</TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
            <TabsTrigger value="actions">Aksi</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Data Pribadi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div>
                      <Label className="text-sm font-medium">Tempat, Tanggal Lahir</Label>
                      <AppText>{application.tempatLahir}, {formatDate(application.tanggalLahir)}</AppText>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Alamat</Label>
                      <AppText>{application.alamat}</AppText>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">No. Telepon</Label>
                      <AppText>{application.noTelp}</AppText>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <AppText>{application.email}</AppText>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Data Kepegawaian
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div>
                      <Label className="text-sm font-medium">Unit Kerja</Label>
                      <AppText>{application.unitKerja}</AppText>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Jabatan</Label>
                      <AppText>{application.jabatan}</AppText>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Masa Kerja</Label>
                      <AppText>{application.masaKerja}</AppText>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Gaji Pokok</Label>
                      <AppText>{application.gajiPokok}</AppText>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dokumen Persyaratan</CardTitle>
                <AppText color="muted">
                  Review kelengkapan dan kesesuaian dokumen yang diupload
                </AppText>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {application.documents.map((document, index) => (
                    <div key={document.id}>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div>
                              <h4 className="font-medium">{document.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {document.size} • Diupload {formatDate(document.uploadDate)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`compliance-${document.id}`}
                                checked={documentCompliance[document.id]}
                                onCheckedChange={(checked) => 
                                  handleDocumentComplianceToggle(document.id, checked)
                                }
                              />
                              <Label 
                                htmlFor={`compliance-${document.id}`}
                                className={`text-sm font-medium ${
                                  documentCompliance[document.id] 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                                }`}
                              >
                                {documentCompliance[document.id] ? 'Sesuai' : 'Tidak Sesuai'}
                              </Label>
                            </div>
                            
                            <Badge variant="outline" className="text-xs">
                              {document.category}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewDocument(document)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadDocument(document)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {index < application.documents.length - 1 && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Approval/Rejection Logic */}
                {application.status === 'diajukan' && (
                  <div className="mt-6 pt-6 border-t">
                    {allDocumentsCompliant ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Semua dokumen sesuai persyaratan</span>
                        </div>
                        <Button 
                          onClick={handleApproveApplication}
                          disabled={isSubmittingDecision}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSubmittingDecision ? "Memproses..." : "TERIMA PENGAJUAN"}
                        </Button>
                      </div>
                    ) : hasNonCompliantDocuments ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-5 w-5" />
                          <span className="font-medium">Ada dokumen yang tidak sesuai</span>
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="rejection-notes" className="text-sm font-medium">
                            Catatan Penolakan <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="rejection-notes"
                            placeholder="Masukkan alasan penolakan dan dokumen mana yang perlu diperbaiki..."
                            value={rejectionNotes}
                            onChange={(e) => setRejectionNotes(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <Button 
                            onClick={handleRejectApplication}
                            disabled={isSubmittingDecision || !rejectionNotes.trim()}
                            variant="destructive"
                          >
                            {isSubmittingDecision ? "Memproses..." : "TOLAK PENGAJUAN"}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Edit Access for Rejected Applications */}
                {application.status === 'ditolak' && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-medium">Pengajuan ditolak</span>
                      </div>
                      {application.rejectionNotes && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                          <p className="text-sm"><strong>Catatan:</strong> {application.rejectionNotes}</p>
                        </div>
                      )}
                      <Button 
                        onClick={handleEditRejectedDocuments}
                        variant="outline"
                        className="border-amber-500 text-amber-600 hover:bg-amber-50"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Dokumen yang Ditolak
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Status</CardTitle>
                <AppText color="muted">
                  Timeline perubahan status pengajuan
                </AppText>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {application.statusHistory.map((history, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        {index < application.statusHistory.length - 1 && (
                          <div className="w-px h-8 bg-border mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{history.status}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatDate(history.date)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{history.notes}</p>
                        <p className="text-xs text-muted-foreground">oleh {history.updatedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Aksi Tersedia</CardTitle>
                <AppText color="muted">
                  Aksi yang dapat dilakukan terhadap pengajuan ini
                </AppText>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-3 lg:grid-cols-2">
                    <Button variant="outline" onClick={handlePrint}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Pengajuan
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export ke PDF
                    </Button>
                    <Button variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Kirim Email
                    </Button>
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Laporan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}