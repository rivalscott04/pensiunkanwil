import * as React from "react"
import { NavLink, useLocation } from "react-router-dom"
import { 
  Home, 
  FileText, 
  Users, 
  Settings,
  Building2,
  MapPin,
  BarChart3
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Shield, Search, LogOut } from "lucide-react"
import { apiImpersonate, apiStopImpersonate } from "@/lib/api"
import { apiListUsersCached, invalidateCache } from "@/lib/api-cached"
import { useAuth } from "@/hooks/use-auth"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  allowedRoles: string[]
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    allowedRoles: ["superadmin", "operator", "adminpusat", "petugas"]
  },
  {
    name: "Pengajuan Pensiun",
    href: "/pengajuan",
    icon: FileText,
    allowedRoles: ["superadmin", "adminpusat", "operator"]
  },
  {
    name: "Pegawai Pensiun",
    href: "/pegawai", 
    icon: Users,
    allowedRoles: ["superadmin", "adminpusat", "operator"]
  },
  {
    name: "User",
    href: "/users",
    icon: Settings,
    allowedRoles: ["superadmin"]
  },
  {
    name: "Laporan",
    href: "/laporan",
    icon: BarChart3,
    allowedRoles: ["adminpusat"]
  },
  {
    name: "Kabupaten/Kota",
    href: "/kabupaten",
    icon: MapPin,
    allowedRoles: ["superadmin", "adminpusat"]
  }
  ,
  {
    name: "Generate Surat",
    href: "/generate-surat",
    icon: FileText,
    allowedRoles: ["superadmin", "petugas"]
  }
]

interface AppSidebarProps {
  userRole?: string
  userName?: string
}

export function AppSidebar({ userRole = "kanwil", userName = "Admin User" }: AppSidebarProps) {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const [impersonateOpen, setImpersonateOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [items, setItems] = React.useState<any[]>([])
  const { impersonation, logout, refetchUser } = useAuth()
  
  const isImpersonating = impersonation?.is_impersonating || false

  // Debounced search for better performance
  const [searchTimeout, setSearchTimeout] = React.useState<NodeJS.Timeout | null>(null)

  const loadUsers = React.useCallback(async (q: string) => {
    setLoading(true)
    try {
      const { items } = await apiListUsersCached({ search: q, perPage: 10 })
      setItems(items || [])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearchChange = React.useCallback((value: string) => {
    setSearch(value)
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      loadUsers(value)
    }, 300) // 300ms delay
    
    setSearchTimeout(timeout)
  }, [searchTimeout, loadUsers])

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  const filteredNavItems = navItems.filter(item => {
    // Superadmin can see all menus
    if (userRole === "superadmin") return true
    return item.allowedRoles.includes(userRole)
  })

  const isCollapsed = state === "collapsed"

  return (
    <Sidebar 
      variant="sidebar" 
      collapsible="icon" 
      className="bg-white dark:bg-[#0a1a2f] border-r border-gray-300 dark:border-gray-700"
    >
      <SidebarHeader className="border-b border-gray-300 dark:border-gray-700 p-6 bg-white dark:bg-[#0a1a2f]">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-extrabold text-[#000000] dark:text-[#ffffff]">
                SIMPEG Pensiun
              </h2>
              <p className="text-sm font-semibold text-[#000000] dark:text-[#ffffff]">
                Sistem Informasi Pensiun
              </p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-100 dark:hover:bg-orange-500/30 text-left w-full">
                    <div className="h-8 w-8 rounded-full bg-green-200 dark:bg-orange-500/30 flex items-center justify-center border-2 border-green-600 dark:border-orange-400">
                      <span className="text-sm font-extrabold text-green-800 dark:text-orange-300">{userName.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold truncate text-[#000000] dark:text-[#ffffff]">{userName}</p>
                      <p className="text-xs capitalize font-bold text-[#000000] dark:text-[#ffffff]">{userRole}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60 animate-in slide-in-from-top-2 duration-300">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{userName}</span>
                      <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userRole === "superadmin" && (
                    !isImpersonating ? (
                      <DropdownMenuItem 
                        onClick={() => { setImpersonateOpen(true); loadUsers(''); setSearch('') }}
                        className="transition-all duration-200 hover:bg-accent/50"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Impersonate...
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem 
                        onClick={() => {
                          invalidateCache()
                          apiStopImpersonate().then(() => refetchUser())
                        }}
                        className="transition-all duration-200 hover:bg-accent/50"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Stop Impersonate
                      </DropdownMenuItem>
                    )
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout} 
                    className="text-destructive transition-all duration-200 hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <FileText className="h-7 w-7 text-green-600 dark:text-orange-400 stroke-[2.5]" />
            <ThemeToggle />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="bg-white dark:bg-[#0a1a2f] py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {filteredNavItems.map((item) => {
                const isActive = currentPath === item.href
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <NavLink 
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 mx-3 rounded-lg transition-all duration-300 font-bold text-sm transform hover:scale-105 hover:shadow-md",
                        isActive 
                          ? "bg-green-600 text-white shadow-lg dark:bg-orange-500 dark:text-white scale-105" 
                          : "text-[#000000] dark:text-[#ffffff] hover:bg-green-100 hover:text-[#000000] dark:hover:bg-orange-500/40 dark:hover:text-[#ffffff]"
                      )}
                    >
                      <item.icon 
                        className={cn(
                          "h-5 w-5 shrink-0 stroke-[2.5] transition-all duration-300",
                          isActive 
                            ? "text-white transform scale-110" 
                            : "text-[#000000] dark:text-[#ffffff] group-hover:scale-110"
                        )} 
                      />
                      {!isCollapsed && (
                        <span className="truncate font-bold transition-all duration-300">{item.name}</span>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-300 dark:border-gray-700 p-3 bg-white dark:bg-[#0a1a2f]" />

      {/* Impersonate Modal */}
      <Dialog open={impersonateOpen} onOpenChange={setImpersonateOpen}>
        <DialogContent className="sm:max-w-[520px] animate-in slide-in-from-bottom-4 duration-300">
          <DialogHeader>
            <DialogTitle>Pilih User untuk Impersonate</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={search} 
                onChange={(e) => handleSearchChange(e.target.value)} 
                placeholder="Cari nama, email, NIP..." 
                className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20" 
              />
            </div>
            <div className="max-h-80 overflow-auto rounded border">
              {loading ? (
                <div className="p-4 text-sm flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-green-600 dark:border-orange-400 border-t-transparent rounded-full"></div>
                  <span className="text-green-600 dark:text-orange-400">Memuat...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">Tidak ada user</div>
              ) : (
                <ul className="divide-y">
                  {items.map((u) => (
                    <li key={u.id} className="p-3 flex items-center justify-between hover:bg-accent/50 transition-all duration-200">
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email} • {u.role}</div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          invalidateCache()
                          apiImpersonate(u.id).then(() => refetchUser())
                        }}
                        className="transition-all duration-200 hover:scale-105"
                      >
                        Impersonate
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}