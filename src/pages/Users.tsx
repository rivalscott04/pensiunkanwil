import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AppButton } from "@/components/ui/app-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiListUsers, apiCreateUser, apiUpdateUser, apiDeleteUser, apiImpersonate, apiMe } from "@/lib/api"
import { Search, MoreVertical, UserPlus, Shield, Pencil, Trash2 } from "lucide-react"

type UserItem = {
  id: number
  name: string
  email: string
  role: string
  kabupaten_id?: number | null
  kabupaten?: { id: number; nama: string } | null
  jabatan?: string | null
  status_user: 'aktif' | 'nonaktif'
}

export default function UsersPage() {
  const [currentUserRole, setCurrentUserRole] = React.useState<string>('')
  const [items, setItems] = React.useState<UserItem[]>([])
  const [meta, setMeta] = React.useState<any>(null)
  const [q, setQ] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [perPage] = React.useState(10)
  const [loading, setLoading] = React.useState(false)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<UserItem | null>(null)
  const [form, setForm] = React.useState<any>({ name: "", email: "", role: "operator", jabatan: "", status_user: "aktif" })
  
  const [impersonateOpen, setImpersonateOpen] = React.useState(false)
  const [impersonateSearch, setImpersonateSearch] = React.useState("")
  const [impersonateUsers, setImpersonateUsers] = React.useState<UserItem[]>([])
  const [impersonateLoading, setImpersonateLoading] = React.useState(false)
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [userToDelete, setUserToDelete] = React.useState<UserItem | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const { items, meta } = await apiListUsers({ search: q, perPage, page })
      setItems(items || [])
      setMeta(meta)
    } finally {
      setLoading(false)
    }
  }, [q, perPage, page])

  React.useEffect(() => { load() }, [load])
  
  // Get current user role
  React.useEffect(() => {
    apiMe().then((res) => {
      const user = (res as any)?.user || res
      if (user?.role) setCurrentUserRole(user.role)
    }).catch(() => {})
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: "", email: "", role: "operator", jabatan: "", status_user: "aktif" })
    setDialogOpen(true)
  }
  const openEdit = (u: UserItem) => {
    setEditing(u)
    setForm({ name: u.name, email: u.email, role: u.role, jabatan: u.jabatan ?? "", status_user: u.status_user })
    setDialogOpen(true)
  }

  const submit = async () => {
    // simple validation
    if (!form.nip || !form.name || !form.email || !form.role) return
    if (editing) await apiUpdateUser(editing.id, form)
    else await apiCreateUser(form)
    setDialogOpen(false)
    load()
  }

  const openDeleteConfirm = (u: UserItem) => {
    setUserToDelete(u)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return
    setDeleting(true)
    try {
      await apiDeleteUser(userToDelete.id)
      setDeleteConfirmOpen(false)
      setUserToDelete(null)
      load()
    } finally {
      setDeleting(false)
    }
  }

  const loadImpersonateUsers = async (search: string) => {
    setImpersonateLoading(true)
    try {
      const { items } = await apiListUsers({ search, perPage: 20 })
      setImpersonateUsers(items || [])
    } finally {
      setImpersonateLoading(false)
    }
  }

  const openImpersonate = () => {
    setImpersonateSearch("")
    setImpersonateUsers([])
    setImpersonateOpen(true)
    loadImpersonateUsers("")
  }

  const impersonate = async (u: UserItem) => {
    await apiImpersonate(String(u.id))
    window.location.reload()
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <AppHeading level={1} className="mb-2">Manajemen User</AppHeading>
            <AppText color="muted">Kelola akun pengguna sistem</AppText>
          </div>
          <AppButton variant="hero" onClick={openAdd}>
            <UserPlus className="h-5 w-5 mr-2" /> Tambah User
          </AppButton>
        </div>

        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Cari nama, email, jabatan..." className="pl-9" />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <AppText color="muted">Tidak ada data</AppText>
                    </TableCell>
                  </TableRow>
                ) : items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="font-mono text-sm">{u.email}</TableCell>
                    <TableCell className="capitalize">{u.role}</TableCell>
                    <TableCell className="capitalize">{u.status_user}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <AppButton variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4"/></AppButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(u)}><Pencil className="h-4 w-4 mr-2"/>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => openDeleteConfirm(u)}><Trash2 className="h-4 w-4 mr-2"/>Delete</DropdownMenuItem>
                          {/* Only show impersonate for superadmin */}
                          {currentUserRole === 'superadmin' && (
                            <DropdownMenuItem onClick={openImpersonate}><Shield className="h-4 w-4 mr-2"/>Impersonate</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit User' : 'Tambah User'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><Input placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="md:col-span-2"><Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="md:col-span-1">
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Role"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">superadmin</SelectItem>
                    <SelectItem value="adminpusat">adminpusat</SelectItem>
                    <SelectItem value="operator">operator</SelectItem>
                    <SelectItem value="petugas">petugas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-1">
                <Select value={form.status_user} onValueChange={(v) => setForm({ ...form, status_user: v })}>
                  <SelectTrigger><SelectValue placeholder="Status User"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">aktif</SelectItem>
                    <SelectItem value="nonaktif">nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Input placeholder="Jabatan (opsional)" value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} /></div>
              <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                <AppButton variant="outline" onClick={() => setDialogOpen(false)}>Batal</AppButton>
                <AppButton variant="hero" onClick={submit}>{editing ? 'Simpan' : 'Tambah'}</AppButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Impersonate Modal */}
        <Dialog open={impersonateOpen} onOpenChange={setImpersonateOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Pilih User untuk Impersonate</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={impersonateSearch} 
                  onChange={(e) => { 
                    setImpersonateSearch(e.target.value)
                    loadImpersonateUsers(e.target.value)
                  }} 
                  placeholder="Cari nama, email, NIP..." 
                  className="pl-10" 
                />
              </div>
              <div className="max-h-80 overflow-auto rounded border">
                {impersonateLoading ? (
                  <div className="p-4 text-sm text-muted-foreground">Memuat...</div>
                ) : impersonateUsers.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">Tidak ada user</div>
                ) : (
                  <ul className="divide-y">
                    {impersonateUsers.map((u) => (
                      <li key={u.id} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.email} • {u.role}</div>
                        </div>
                        <AppButton size="sm" onClick={() => impersonate(u)}>Impersonate</AppButton>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Konfirmasi Hapus User"
          description={`Apakah Anda yakin ingin menghapus user "${userToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Hapus"
          cancelText="Batal"
          isLoading={deleting}
          variant="destructive"
          onConfirm={confirmDelete}
        />
      </div>
    </AppLayout>
  )
}


