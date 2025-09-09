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
import { listLetters, deleteLetterService } from "@/lib/letters-service"

export type LetterItem = StoredLetter

type LettersDataTableProps = {
  items?: LetterItem[]
  onCreateNew?: () => void
  onView?: (item: LetterItem) => void
  onEdit?: (item: LetterItem) => void
  onDelete?: (item: LetterItem) => Promise<void> | void
  onPrint?: (item: LetterItem) => void
}

const mockLetters: LetterItem[] = []

export function LettersDataTable({ items, onCreateNew, onView, onEdit, onDelete, onPrint }: LettersDataTableProps) {
  const [search, setSearch] = useState("")
  const [data, setData] = useState<LetterItem[]>(items ?? [])
  React.useEffect(() => {
    let cancelled = false
    if (!items) {
      listLetters().then((res) => { if (!cancelled) setData(res) }).catch(() => {})
    }
    return () => { cancelled = true }
  }, [items])

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [errorOpen, setErrorOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [target, setTarget] = useState<LetterItem | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return data.filter((d) =>
      d.nomorSurat.toLowerCase().includes(q) ||
      d.namaPegawai.toLowerCase().includes(q) ||
      d.namaPenandatangan.toLowerCase().includes(q)
    )
  }, [search, data])

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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari no surat, pegawai, penandatangan..." className="pl-10" />
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
                              window.location.href = `/generate-surat/new?reprint=${encodeURIComponent(item.id)}`
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


