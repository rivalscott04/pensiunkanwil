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
import { SkeletonDataTable } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { motion } from "framer-motion"
import { Search, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { StatusUpdateModal } from "./status-update-modal"
import { useToast } from "@/hooks/use-toast"
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
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedApplicationForStatus, setSelectedApplicationForStatus] = useState<Application | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()
  // Removed modal state as we now navigate to detail page

  const loadApplications = async () => {
    setIsLoading(true)
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('search', searchQuery.trim())
    // Backend supports 'status' and 'jenis_pensiun' filters
    if (statusFilter !== 'semua') params.set('status', statusFilter)
    const url = `${API_BASE_URL || ''}/api/pengajuan?${params.toString()}`
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json', ...getAuthHeaders() } })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error?.message || 'Failed to load applications')
      }
      const json = await res.json()
      // Controller returns { status: 'success', data: paginator }
      const items = Array.isArray(json?.data?.data) ? json.data.data : []
      const mapped: Application[] = items.map((it: any) => ({
        id: String(it.id ?? it.nomor_pengajuan ?? Math.random()),
        tanggalPengajuan: it.tanggal_pengajuan ?? it.created_at ?? '',
        namaPegawai: it.nama_pegawai ?? '',
        nip: it.nip_pegawai ?? '',
        jenisPensiun: it.jenis_pensiun ?? 'BUP',
        status: (it.status as Application['status']) ?? 'draft',
        tanggalUpdate: it.updated_at ?? it.tanggal_pengajuan ?? ''
      }))
      setApplications(mapped)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load applications'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      setApplications([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter])

  // Filter applications based on search and filters
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.namaPegawai.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.nip.includes(searchQuery)
    
    const matchesStatus = statusFilter === "semua" || app.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: Application['status'], onClick?: () => void) => {
    const statusMap = {
      draft: { label: "Draft", variant: "secondary" as const, className: "cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105" },
      diajukan: { label: "Diajukan", variant: "outline" as const, className: "border-orange-500/50 text-orange-700 bg-orange-500/10 dark:text-orange-400 dark:bg-orange-500/20 cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105" },
      diterima: { label: "Diterima", variant: "outline" as const, className: "border-green-500/50 text-green-700 bg-green-500/10 dark:text-green-400 dark:bg-green-500/20 cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105" },
      ditolak: { label: "Ditolak", variant: "destructive" as const, className: "cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105" }
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

  const handleViewDetails = async (application: Application) => {
    setActionLoading(application.id)
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 500))
    setActionLoading(null)
    // Navigate to detail page instead of opening modal
    window.location.href = `/pengajuan/detail/${application.id}`
  }

  if (isLoading) {
    return <SkeletonDataTable />
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CardTitle>Daftar Pengajuan Pensiun</CardTitle>
        </motion.div>
        
        {/* Filters */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari nama, NIP, atau ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
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
          </motion.div>


          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <AppText size="sm" color="muted">
              Menampilkan {filteredApplications.length} dari {applications.length} pengajuan
            </AppText>
          </motion.div>
        </motion.div>
      </CardHeader>
      
      <CardContent>
        <motion.div 
          className="rounded-md border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Table>
            <TableHeader>
              <motion.tr
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.7 }}
              >
                <motion.th
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 }}
                >
                  Tanggal Pengajuan
                </motion.th>
                <motion.th
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.85 }}
                >
                  Nama Pegawai
                </motion.th>
                <motion.th
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.9 }}
                >
                  NIP
                </motion.th>
                <motion.th
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.95 }}
                >
                  Jenis Pensiun
                </motion.th>
                <motion.th
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 1.0 }}
                >
                  Status
                </motion.th>
                <motion.th
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 1.05 }}
                >
                  Tanggal Update
                </motion.th>
                <motion.th 
                  className="w-[50px]"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 1.1 }}
                >
                </motion.th>
              </motion.tr>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.8 }}
                >
                  <motion.td 
                    colSpan={7} 
                    className="text-center py-8"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 1.0 }}
                  >
                    <AppText color="muted">
                      Tidak ada pengajuan yang ditemukan
                    </AppText>
                  </motion.td>
                </motion.tr>
              ) : (
                filteredApplications.map((application, index) => (
                  <motion.tr
                    key={application.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 1.2 + (index * 0.05) }}
                    className={`cursor-pointer hover:bg-muted/50 transition-all duration-200 hover:scale-[1.01] ${
                      selectedApplication?.id === application.id ? 'bg-muted/50' : ''
                    }`}
                    onClick={() => handleRowClick(application)}
                  >
                    <motion.td
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 1.3 + (index * 0.05) }}
                    >
                      {formatDate(application.tanggalPengajuan)}
                    </motion.td>
                    <motion.td
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 1.3 + (index * 0.05) }}
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{application.namaPegawai}</div>
                      </div>
                    </motion.td>
                    <motion.td 
                      className="font-mono text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 1.3 + (index * 0.05) }}
                    >
                      {application.nip}
                    </motion.td>
                    <motion.td
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 1.3 + (index * 0.05) }}
                    >
                      {application.jenisPensiun}
                    </motion.td>
                    <motion.td 
                      onClick={(e) => e.stopPropagation()}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 1.3 + (index * 0.05) }}
                    >
                      {getStatusBadge(application.status, () => handleStatusClick(application))}
                    </motion.td>
                    <motion.td
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 1.3 + (index * 0.05) }}
                    >
                      {formatDate(application.tanggalUpdate)}
                    </motion.td>
                    <motion.td 
                      onClick={(e) => e.stopPropagation()}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 1.3 + (index * 0.05) }}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="animate-in slide-in-from-top-2 duration-200">
                           <DropdownMenuItem 
                             onClick={() => handleViewDetails(application)}
                             disabled={actionLoading === application.id}
                             className="transition-all duration-200 hover:bg-accent/50"
                           >
                             {actionLoading === application.id ? (
                               <>
                                 <Spinner size="sm" className="mr-2" />
                                 <span className="text-green-600 dark:text-orange-400">Memuat...</span>
                               </>
                             ) : (
                               <>
                                 <Eye className="h-4 w-4 mr-2" />
                                 Lihat Detail
                               </>
                             )}
                           </DropdownMenuItem>
                          {application.status === 'draft' && (
                            <DropdownMenuItem className="transition-all duration-200 hover:bg-accent/50">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {application.status === 'draft' && (
                            <DropdownMenuItem className="text-destructive transition-all duration-200 hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Batalkan
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.td>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </motion.div>
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