import * as React from "react"
import { useState } from "react"
import { Employee, golonganOptions, unitKerjaOptions } from "@/types/employee"
import { API_BASE_URL } from "@/lib/api"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { AppButton } from "@/components/ui/app-button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Users, Eye, Trash2, MoreVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface EmployeeDataTableProps {
  onEmployeeSelect: (employee: Employee) => void;
  selectedEmployee: Employee | null;
}

export function EmployeeDataTable({ onEmployeeSelect, selectedEmployee }: EmployeeDataTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGolongan, setSelectedGolongan] = useState("Semua Golongan")
  const [selectedUnitKerja, setSelectedUnitKerja] = useState("Semua Unit Kerja")
  
  const { toast } = useToast()
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [totalEmployees, setTotalEmployees] = useState<number | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState<number>(1)
  const perPageOptions = [10, 20, 50, 100]

  const loadSyncStatus = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL || ''}/api/sync/status`, { credentials: 'include' })
      if (!resp.ok) return
      const data = await resp.json()
      setLastSync(data?.last_sync_at ?? null)
      setTotalEmployees(typeof data?.employees_count === 'number' ? data.employees_count : null)
    } catch {}
  }

  React.useEffect(() => {
    loadSyncStatus()
    loadEmployees()
  }, [page, perPage])

  const loadEmployees = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL || ''}/api/employees?page=${page}&per_page=${perPage}`, { credentials: 'include' })
      if (!resp.ok) return
      const json = await resp.json()
      const items = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
      const mapped: Employee[] = items.map((it: any) => ({
        id: String(it.id ?? it.nip ?? Math.random()),
        nip: String(it.nip ?? ''),
        nama: String(it.nama ?? ''),
        golongan: String(it.golongan ?? ''),
        tmtPensiun: it.tmt_pensiun ?? '',
        unitKerja: String(it.unit_kerja ?? ''),
        status: 'eligible',
      }))
      setEmployees(mapped)
      if (typeof json?.meta?.total === 'number') setTotalEmployees(json.meta.total)
      else if (typeof json?.total === 'number') setTotalEmployees(json.total)
      else setTotalEmployees(mapped.length)
      if (json?.meta?.last_page) setTotalPages(json.meta.last_page)
      else if (typeof json?.last_page === 'number') setTotalPages(json.last_page)
      else setTotalPages(1)
    } catch {}
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      const resp = await fetch(`${API_BASE_URL || ''}/api/sync/employees`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      })
      const data = await resp.json().catch(() => ({} as any))
      if (resp.ok) {
        const fetched = data?.data?.fetched
        const upserted = data?.data?.upserted
        toast({ title: 'Sync selesai', description: `Fetched: ${fetched ?? '-'} • Upserted: ${upserted ?? '-'}` })
        setTimeout(() => { loadSyncStatus(); loadEmployees(); }, 500)
      } else if (resp.status === 401) {
        toast({ title: 'Butuh login', description: 'Silakan login untuk menjalankan sync.', variant: 'destructive' })
      } else {
        toast({ title: 'Gagal memulai sync', description: data?.message ?? 'Terjadi kesalahan', variant: 'destructive' })
      }
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message ?? 'Tidak dapat menghubungi server', variant: 'destructive' })
    } finally {
      setSyncing(false)
    }
  }

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.nip.includes(searchQuery) ||
                         employee.unitKerja.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesGolongan = selectedGolongan === "Semua Golongan" || employee.golongan === selectedGolongan
    const matchesUnitKerja = selectedUnitKerja === "Semua Unit Kerja" || employee.unitKerja === selectedUnitKerja
    
    return matchesSearch && matchesGolongan && matchesUnitKerja
  })


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Filters and Search */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Select value={selectedGolongan} onValueChange={setSelectedGolongan}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Golongan" />
              </SelectTrigger>
              <SelectContent>
                {golonganOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedUnitKerja} onValueChange={setSelectedUnitKerja}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Unit Kerja" />
              </SelectTrigger>
              <SelectContent>
                {unitKerjaOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NIP pegawai..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Stats and Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-1">
              <AppText size="sm" color="muted">
                Menampilkan {filteredEmployees.length} dari {totalEmployees ?? employees.length} pegawai
              </AppText>
              <AppText size="xs" color="muted">
                Terakhir sync: {lastSync ? new Date(lastSync).toLocaleString('id-ID') : 'Belum pernah'}{totalEmployees !== null ? ` • Total: ${totalEmployees}` : ''}
              </AppText>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <AppText size="sm" color="muted">Tampil</AppText>
                <Select value={String(perPage)} onValueChange={(v) => { const n = parseInt(v, 10) || 50; setPerPage(n); setPage(1) }}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {perPageOptions.map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AppText size="sm" color="muted">/ halaman</AppText>
              </div>
              <AppButton variant="outline" size="default" className="text-sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </AppButton>
              <AppButton variant="hero" size="default" className="text-sm" onClick={handleSync} disabled={syncing}>
                <Users className="h-4 w-4 mr-2" />
                {syncing ? 'Syncing...' : 'Sync'}
              </AppButton>
            </div>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="p-6">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">No</TableHead>
                <TableHead className="font-semibold">Nama</TableHead>
                <TableHead className="font-semibold">NIP</TableHead>
                <TableHead className="font-semibold">Golongan</TableHead>
                <TableHead className="font-semibold">TMT Pensiun</TableHead>
                <TableHead className="font-semibold">Unit Kerja</TableHead>
                <TableHead className="text-right font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee, index) => (
                  <TableRow 
                    key={employee.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                      selectedEmployee?.id === employee.id 
                        ? 'bg-success/10 hover:bg-success/15 dark:bg-orange/10 dark:hover:bg-orange/15' 
                        : ''
                    }`}
                    onClick={() => onEmployeeSelect(employee)}
                  >
                    <TableCell>
                      <AppText size="sm" weight="medium">{(page - 1) * perPage + index + 1}</AppText>
                    </TableCell>
                    <TableCell>
                      <AppText size="sm" weight="medium">{employee.nama}</AppText>
                    </TableCell>
                    <TableCell>
                      <AppText size="sm" className="font-mono">{employee.nip}</AppText>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {employee.golongan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <AppText size="sm">{formatDate(employee.tmtPensiun)}</AppText>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <AppText size="sm" className="truncate">{employee.unitKerja}</AppText>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <AppButton variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </AppButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <AppText color="muted">Tidak ada data pegawai yang ditemukan</AppText>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <AppText size="sm" color="muted">
            Halaman {page} dari {totalPages}
          </AppText>
          <div className="flex gap-2">
            <AppButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</AppButton>
            <AppButton variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</AppButton>
          </div>
        </div>
      </Card>
    </div>
  )
}