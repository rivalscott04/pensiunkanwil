import * as React from "react"
import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose 
} from "@/components/ui/dialog"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  User, 
  Calendar, 
  FileText, 
  Clock, 
  Download, 
  Printer, 
  Edit3,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileIcon,
  Upload
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { apiUploadFile } from "@/lib/api"

interface Application {
  id: string
  tanggalPengajuan: string
  namaPegawai: string
  nip: string
  jenisPensiun: string
  status: 'draft' | 'diajukan' | 'diterima' | 'ditolak'
  tanggalUpdate: string
  files?: Array<{
    id: number
    jenis_dokumen: string
    nama_asli: string
    created_at: string
  }>
}

interface ApplicationDetailModalProps {
  isOpen: boolean
  onClose: () => void
  application: Application | null
}

export function ApplicationDetailModal({ isOpen, onClose, application }: ApplicationDetailModalProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [uploadingSk, setUploadingSk] = useState(false)
  
  if (!application) return null

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", variant: "secondary" as const, icon: Edit3 },
      diajukan: { label: "Diajukan", variant: "default" as const, icon: Clock },
      diterima: { label: "Diterima", variant: "default" as const, icon: CheckCircle },
      ditolak: { label: "Ditolak", variant: "destructive" as const, icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const IconComponent = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
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

  const handleDownload = () => {
    toast({
      title: "Download Berhasil",
      description: "File detail pengajuan berhasil didownload",
    })
  }

  const handlePrint = () => {
    window.print()
    toast({
      title: "Print Initiated",
      description: "Dialog print telah dibuka",
    })
  }

  const triggerUploadSk = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setUploadingSk(true)
      try {
        await apiUploadFile(String(application!.id), file, 'sk_pensiun', false)
        toast({ title: 'SK Pensiun Terunggah', description: 'Dokumen SK Pensiun berhasil diunggah.' })
        // Refresh the application data to show updated files
        window.location.reload()
      } catch (e) {
        toast({ title: 'Gagal Upload', description: e instanceof Error ? e.message : 'Upload gagal', variant: 'destructive' })
      } finally {
        setUploadingSk(false)
      }
    }
    input.click()
  }

  // Check if SK Pensiun file exists
  const skPensiunFile = application?.files?.find(file => file.jenis_dokumen === 'sk_pensiun')
  const hasSkPensiun = !!skPensiunFile

  // Mock data removed - now using real API data
  const documents: any[] = []

  const statusHistory = [
    { status: "Draft", date: "2024-01-15 09:00", user: "Pegawai", note: "Pengajuan dibuat" },
    { status: "Diajukan", date: "2024-01-16 14:30", user: "Pegawai", note: "Pengajuan disubmit" },
    { status: "Diterima", date: "2024-01-18 11:20", user: "Admin HRD", note: "Pengajuan disetujui" }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Detail Pengajuan Pensiun</DialogTitle>
            <DialogClose />
          </div>
          
          {/* Header Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <AppHeading level={3} className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {application.namaPegawai}
                  </AppHeading>
                  <AppText color="muted">NIP: {application.nip}</AppText>
                  <AppText color="muted">Jenis Pensiun: {application.jenisPensiun}</AppText>
                </div>
                <div className="text-right space-y-2">
                  {getStatusBadge(application.status)}
                  <AppText size="sm" color="muted" className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(application.tanggalPengajuan)}
                  </AppText>
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-6">
          <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Dokumen</TabsTrigger>
              <TabsTrigger value="history">Riwayat</TabsTrigger>
              <TabsTrigger value="actions">Aksi</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informasi Pegawai
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <AppText size="sm" color="muted">Nama Lengkap</AppText>
                      <AppText weight="medium">{application.namaPegawai}</AppText>
                    </div>
                    <div>
                      <AppText size="sm" color="muted">NIP</AppText>
                      <AppText weight="medium">{application.nip}</AppText>
                    </div>
                    <div>
                      <AppText size="sm" color="muted">Jenis Pensiun</AppText>
                      <AppText weight="medium">{application.jenisPensiun}</AppText>
                    </div>
                    <div>
                      <AppText size="sm" color="muted">Status</AppText>
                      <div className="mt-1">
                        {getStatusBadge(application.status)}
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <AppText size="sm" color="muted">Tanggal Pengajuan</AppText>
                      <AppText weight="medium">{formatDate(application.tanggalPengajuan)}</AppText>
                    </div>
                    <div>
                      <AppText size="sm" color="muted">Terakhir Diupdate</AppText>
                      <AppText weight="medium">{formatDate(application.tanggalUpdate)}</AppText>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Dokumen Pendukung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <FileIcon className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <AppText weight="medium">{doc.name}</AppText>
                            <AppText size="sm" color="muted">{doc.size} • Diupload {formatDate(doc.uploadDate)}</AppText>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Riwayat Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statusHistory.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                          {index < statusHistory.length - 1 && <div className="w-px h-12 bg-border mt-2"></div>}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <AppText weight="medium">{item.status}</AppText>
                            <Badge variant="secondary" className="text-xs">{item.user}</Badge>
                          </div>
                          <AppText size="sm" color="muted">{item.date}</AppText>
                          <AppText size="sm">{item.note}</AppText>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aksi Tersedia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button onClick={handleDownload} className="justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Download Detail
                    </Button>
                    <Button onClick={handlePrint} variant="outline" className="justify-start">
                      <Printer className="h-4 w-4 mr-2" />
                      Print Detail
                    </Button>
                    {application.status === 'draft' && (
                      <Button variant="outline" className="justify-start">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Pengajuan
                      </Button>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <AppText size="sm" color="muted">Catatan</AppText>
                    <AppText size="sm">
                      Untuk informasi lebih lanjut atau bantuan terkait pengajuan pensiun, 
                      silakan hubungi bagian HRD.
                    </AppText>
                  </div>

                  {user?.role === 'superadmin' && application.status === 'diterima' && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <AppText size="sm" color="muted">SK Pensiun</AppText>
                          <Badge variant={hasSkPensiun ? "default" : "secondary"}>
                            {hasSkPensiun ? "Sudah diunggah" : "Belum diunggah"}
                          </Badge>
                        </div>
                        {hasSkPensiun ? (
                          <div className="space-y-2">
                            <AppText size="sm" color="muted">
                              File: {skPensiunFile?.nama_asli}
                            </AppText>
                            <AppText size="sm" color="muted">
                              Diunggah: {formatDate(skPensiunFile?.created_at || '')}
                            </AppText>
                            <Button onClick={triggerUploadSk} disabled={uploadingSk} variant="outline" className="justify-start">
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadingSk ? 'Mengunggah...' : 'Ganti SK Pensiun'}
                            </Button>
                          </div>
                        ) : (
                          <Button onClick={triggerUploadSk} disabled={uploadingSk} className="justify-start">
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadingSk ? 'Mengunggah...' : 'Upload SK Pensiun'}
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}