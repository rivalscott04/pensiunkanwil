import * as React from "react"
import { useState, useEffect } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppText } from "@/components/ui/app-typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { StatusUpdateModal } from "./status-update-modal"
// Removed ApplicationDetailModal import as we now use a separate page

interface Application {
  id: string
  tanggalPengajuan: string
  namaPegawai: string
  nip: string
  jenisPensiun: string
  status: 'draft' | 'diajukan' | 'diterima' | 'ditolak'
  tanggalUpdate: string
}

// Real data loader

interface ApplicationsDataTableProps {
  onApplicationSelect?: (application: Application) => void
  selectedApplication?: Application | null
}

export function ApplicationsDataTable({ 
  onApplicationSelect, 
  selectedApplication 
}: ApplicationsDataTableProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("semua")
  const [jenisPensiunFilter, setJenisPensiunFilter] = useState<string>("semua")
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedApplicationForStatus, setSelectedApplicationForStatus] = useState<Application | null>(null)
  // Removed modal state as we now navigate to detail page

  const loadApplications = async () => {
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('search', searchQuery.trim())
    // Backend supports 'status' and 'jenis_pensiun' filters
    if (statusFilter !== 'semua') params.set('status', statusFilter)
    if (jenisPensiunFilter !== 'semua') params.set('jenis_pensiun', jenisPensiunFilter)
    const url = `${API_BASE_URL || ''}/api/pengajuan?${params.toString()}`
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json', ...getAuthHeaders() } })
      if (!res.ok) {
        // Clear list but don't crash UI
        setApplications([])
        return
      }
      const json = await res.json()
      // Controller returns { status: 'success', data: paginator }
      const items = Array.isArray(json?.data?.data) ? json.data.data : []
      const mapped: Application[] = items.map((it: any) => ({
        id: String(it.id ?? it.nomor_pengajuan ?? Math.random()),
        tanggalPengajuan: it.tanggal_pengajuan ?? it.created_at ?? '',
        namaPegawai: it.nama_pegawai ?? '',
        nip: it.nip_pegawai ?? '',
        jenisPensiun: it.jenis_pensiun ?? 'Pensiun Normal',
        status: (it.status as Application['status']) ?? 'draft',
        tanggalUpdate: it.updated_at ?? it.tanggal_pengajuan ?? ''
      }))
      setApplications(mapped)
    } catch (e) {
      setApplications([])
    }
  }

  useEffect(() => {
    loadApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, jenisPensiunFilter])

  // Filter applications based on search and filters
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.namaPegawai.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.nip.includes(searchQuery)
    
    const matchesStatus = statusFilter === "semua" || app.status === statusFilter
    const matchesJenisPensiun = jenisPensiunFilter === "semua" || app.jenisPensiun === jenisPensiunFilter
    
    return matchesSearch && matchesStatus && matchesJenisPensiun
  })

  const getStatusBadge = (status: Application['status'], onClick?: () => void) => {
    const statusMap = {
      draft: { label: "Draft", variant: "secondary" as const, className: "cursor-pointer hover:opacity-80" },
      diajukan: { label: "Diajukan", variant: "outline" as const, className: "border-orange-500/50 text-orange-700 bg-orange-500/10 dark:text-orange-400 dark:bg-orange-500/20 cursor-pointer hover:opacity-80" },
      diterima: { label: "Diterima", variant: "outline" as const, className: "border-green-500/50 text-green-700 bg-green-500/10 dark:text-green-400 dark:bg-green-500/20 cursor-pointer hover:opacity-80" },
      ditolak: { label: "Ditolak", variant: "destructive" as const, className: "cursor-pointer hover:opacity-80" }
    }

    const statusInfo = statusMap[status]
    return (
      <Badge variant={statusInfo.variant} className={statusInfo.className} onClick={onClick}>
        {statusInfo.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleRowClick = (application: Application) => {
    onApplicationSelect?.(application)
  }

  const handleStatusClick = (application: Application) => {
    setSelectedApplicationForStatus(application)
    setStatusModalOpen(true)
  }

  const handleStatusUpdate = (applicationId: string, newStatus: Application['status']) => {
    setApplications(prev => 
      prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus, tanggalUpdate: new Date().toISOString().split('T')[0] }
          : app
      )
    )
  }

  const handleViewDetails = (application: Application) => {
    // Navigate to detail page instead of opening modal
    window.location.href = `/pengajuan/detail/${application.id}`
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Daftar Pengajuan Pensiun</CardTitle>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari nama, NIP, atau ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="diajukan">Diajukan</SelectItem>
              <SelectItem value="diterima">Diterima</SelectItem>
              <SelectItem value="ditolak">Ditolak</SelectItem>
            </SelectContent>
          </Select>

          <Select value={jenisPensiunFilter} onValueChange={setJenisPensiunFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Jenis Pensiun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Jenis</SelectItem>
              <SelectItem value="Pensiun Normal">Pensiun Normal</SelectItem>
              <SelectItem value="Pensiun Dipercepat">Pensiun Dipercepat</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center">
            <AppText size="sm" color="muted">
              Menampilkan {filteredApplications.length} dari {applications.length} pengajuan
            </AppText>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal Pengajuan</TableHead>
                <TableHead>Nama Pegawai</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>Jenis Pensiun</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Update</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <AppText color="muted">
                      Tidak ada pengajuan yang ditemukan
                    </AppText>
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((application) => (
                  <TableRow 
                    key={application.id}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedApplication?.id === application.id ? 'bg-muted/50' : ''
                    }`}
                    onClick={() => handleRowClick(application)}
                  >
                    <TableCell>
                      {formatDate(application.tanggalPengajuan)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{application.namaPegawai}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {application.nip}
                    </TableCell>
                    <TableCell>
                      {application.jenisPensiun}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {getStatusBadge(application.status, () => handleStatusClick(application))}
                    </TableCell>
                    <TableCell>
                      {formatDate(application.tanggalUpdate)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => handleViewDetails(application)}>
                             <Eye className="h-4 w-4 mr-2" />
                             Lihat Detail
                           </DropdownMenuItem>
                          {application.status === 'draft' && (
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {application.status === 'draft' && (
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Batalkan
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      <StatusUpdateModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        application={selectedApplicationForStatus}
        onStatusUpdate={handleStatusUpdate}
      />
      
      {/* Application Detail Modal removed - now using separate page */}
    </Card>
  )
}