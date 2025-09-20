import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiUpdatePensionApplicationStatus } from "@/lib/api"

interface Application {
  id: string
  tanggalPengajuan: string
  namaPegawai: string
  nip: string
  jenisPensiun: string
  status: 'draft' | 'diajukan' | 'diterima' | 'ditolak'
  tanggalUpdate: string
}

interface StatusUpdateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  application: Application | null
  onStatusUpdate: (applicationId: string, newStatus: Application['status']) => void
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft':
      return <Badge variant="secondary">Draft</Badge>
    case 'diajukan':
      return <Badge variant="outline" className="border-orange-500/50 text-orange-700 bg-orange-500/10 dark:text-orange-400 dark:bg-orange-500/20">Diajukan</Badge>
    case 'diterima':
      return <Badge variant="outline" className="border-green-500/50 text-green-700 bg-green-500/10 dark:text-green-400 dark:bg-green-500/20">Diterima</Badge>
    case 'ditolak':
      return <Badge variant="destructive">Ditolak</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function StatusUpdateModal({ open, onOpenChange, application, onStatusUpdate }: StatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<Application['status'] | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    if (application) {
      setSelectedStatus(application.status)
    }
  }, [application])

  const handleSave = async () => {
    if (!application || !selectedStatus) return

    // Only allow diterima or ditolak status updates
    if (selectedStatus !== 'diterima' && selectedStatus !== 'ditolak') {
      toast({
        title: "Status tidak valid",
        description: "Hanya dapat mengubah status menjadi 'Diterima' atau 'Ditolak'",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await apiUpdatePensionApplicationStatus(application.id, selectedStatus)
      
      onStatusUpdate(application.id, selectedStatus)
      toast({
        title: "Status berhasil diubah",
        description: `Status pengajuan ${application.namaPegawai} telah diubah menjadi ${selectedStatus}`,
      })
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat mengubah status pengajuan"
      toast({
        title: "Gagal mengubah status",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!application) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ubah Status Pengajuan</DialogTitle>
          <DialogDescription>
            Ubah status pengajuan pensiun untuk {application.namaPegawai}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium">
              Nama:
            </label>
            <div className="col-span-3">
              {application.namaPegawai}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium">
              NIP:
            </label>
            <div className="col-span-3">
              {application.nip}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium">
              Status Saat Ini:
            </label>
            <div className="col-span-3">
              {getStatusBadge(application.status)}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="status" className="text-right text-sm font-medium">
              Status Baru:
            </label>
            <div className="col-span-3">
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as Application['status'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status baru" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="diajukan">Diajukan</SelectItem>
                  <SelectItem value="diterima">Diterima</SelectItem>
                  <SelectItem value="ditolak">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedStatus || selectedStatus === application.status || isLoading}
          >
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}