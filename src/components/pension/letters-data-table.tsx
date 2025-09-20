import * as React from "react"
import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { SuccessDialog } from "@/components/ui/success-dialog"
import { ErrorModal } from "@/components/pension/error-modal"
import { AppText } from "@/components/ui/app-typography"
import { Eye, Edit, Trash2, MoreHorizontal, Search, Plus, Printer } from "lucide-react"
import { StoredLetter } from "@/lib/letters"
import { listLettersQuery, deleteLetterService } from "@/lib/letters-service"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

export type LetterItem = StoredLetter

type LettersDataTableProps = {
  items?: LetterItem[]
  onCreateNew?: () => void
  onView?: (item: LetterItem) => void
  onEdit?: (item: LetterItem) => void
  onDelete?: (item: LetterItem) => Promise<void> | void
  onPrint?: (item: LetterItem) => void
}

// Mock data removed - now using real API data

export function LettersDataTable({ items, onCreateNew, onView, onEdit, onDelete, onPrint }: LettersDataTableProps) {
  const [search, setSearch] = useState("")
  const [data, setData] = useState<LetterItem[]>(items ?? [])
  React.useEffect(() => {
    let cancelled = false
    if (!items) {
      listLettersQuery({}).then((res) => { if (!cancelled) setData(res) }).catch(() => {})
    }
    return () => { cancelled = true }
  }, [items])

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [errorOpen, setErrorOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [target, setTarget] = useState<LetterItem | null>(null)

  const [type, setType] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({})
  const filtered = data

  React.useEffect(() => {
    if (items) return
    const controller = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await listLettersQuery({ q: search || undefined, type: type || undefined, startDate: startDate || undefined, endDate: endDate || undefined })
        setData(res)
      } catch {
        setData([])
      }
    }, 300)
    return () => { clearTimeout(t); controller.abort() }
  }, [items, search, type, startDate, endDate])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })

  const handleDeleteClick = (item: LetterItem) => {
    setTarget(item)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!target) return
    try {
      setLoading(true)
      if (onDelete) await onDelete(target)
      else await deleteLetterService(target.id)
      setData((prev) => prev.filter((x) => x.id !== target.id))
      setConfirmOpen(false)
      setSuccessOpen(true)
    } catch (e) {
      setConfirmOpen(false)
      setErrorOpen(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Daftar Surat</CardTitle>
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Surat Baru
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari no surat, pegawai, penandatangan..." className="pl-10" />
          </div>
          <div>
            <select className="w-full h-10 rounded border bg-background" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Semua Tipe</option>
              <option value="pengantar_gelar">Pengantar Gelar</option>
              <option value="pengantar_pensiun">Pengantar Pensiun</option>
              <option value="hukuman_disiplin">Hukuman Disiplin</option>
            </select>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start font-normal">
                {startDate || endDate ? (
                  <span className="truncate">{startDate || "—"}{endDate ? ` s/d ${endDate}` : " (pilih akhir)"}</span>
                ) : (
                  <span className="text-muted-foreground">Pilih rentang tanggal</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-2">
              <Calendar
                mode="range"
                selected={range as any}
                onSelect={(r: any) => {
                  setRange(r || {})
                  const from = r?.from as Date | undefined
                  const to = r?.to as Date | undefined
                  const fmt = (d?: Date) => d ? d.toISOString().slice(0,10) : ""
                  setStartDate(fmt(from))
                  setEndDate(fmt(to))
                }}
                numberOfMonths={2}
              />
              <div className="flex justify-between items-center mt-2">
                <Button variant="ghost" onClick={() => { setRange({}); setStartDate(""); setEndDate("") }}>Clear</Button>
                <div className="text-xs text-muted-foreground">Klik awal lalu akhir</div>
              </div>
            </PopoverContent>
          </Popover>
          <div>
            <Button variant="outline" onClick={() => { setSearch(""); setType(""); setStartDate(""); setEndDate("") }}>Reset</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No Surat</TableHead>
                <TableHead>Nama Pegawai</TableHead>
                <TableHead>Nama Penandatangan</TableHead>
                <TableHead>Tanggal Surat</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <AppText color="muted">Belum ada surat</AppText>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.nomorSurat}</TableCell>
                    <TableCell>{item.namaPegawai}</TableCell>
                    <TableCell>{item.namaPenandatangan}</TableCell>
                    <TableCell>{formatDate(item.tanggalSurat)}</TableCell>
                    <TableCell className="uppercase text-xs">{(item as any).type || '-'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView?.(item)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit?.(item)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            if (onPrint) {
                              onPrint(item)
                            } else {
                              window.location.href = `/generate-surat/hukuman-disiplin?reprint=${encodeURIComponent(item.id)}`
                            }
                          }}>
                            <Printer className="h-4 w-4 mr-2" />
                            Cetak
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(item)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
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

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hapus Surat?"
        description={`Anda yakin ingin menghapus surat ${target?.nomorSurat ?? ""}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
        isLoading={loading}
        onConfirm={handleConfirmDelete}
      />

      <SuccessDialog
        open={successOpen}
        onOpenChange={setSuccessOpen}
        title="Berhasil dihapus"
        description="Surat telah dihapus."
      />

      <ErrorModal
        isOpen={errorOpen}
        onClose={() => setErrorOpen(false)}
        onRetry={() => {
          setErrorOpen(false)
          if (target) handleDeleteClick(target)
        }}
        errorMessage="Gagal menghapus surat. Silakan coba lagi."
      />
    </Card>
  )
}


