import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X, LogOut, User, Settings, FileText } from "lucide-react"
import { AppButton } from "@/components/ui/app-button"
import { AppText } from "@/components/ui/app-typography"

interface NavItem {
  name: string
  href: string
  icon?: React.ComponentType<any>
  roles?: string[]
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: User, roles: ["kanwil", "kabupaten", "pusat"] },
  { name: "Pengajuan Pensiun", href: "/pengajuan", icon: FileText, roles: ["kanwil", "kabupaten"] },
  { name: "Data Pegawai", href: "/pegawai", icon: User, roles: ["pusat", "kanwil"] },
  { name: "Pengaturan", href: "/settings", icon: Settings, roles: ["pusat"] },
]

interface NavbarProps {
  userRole?: string
  userName?: string
}

export function Navbar({ userRole = "kanwil", userName = "Admin User" }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  const filteredNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  )

  const isActive = (href: string) => location.pathname === href

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <AppText size="sm" weight="bold" color="white">SP</AppText>
              </div>
              <AppText weight="bold" className="hidden sm:block">
                Sistem Pensiun
              </AppText>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      flex items-center space-x-2
                      ${isActive(item.href)
                        ? 'bg-orange text-orange-foreground shadow-button'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }
                    `}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <AppText size="sm" color="muted">{userName}</AppText>
            <AppButton variant="ghost" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </AppButton>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <AppButton
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </AppButton>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden animate-slide-down">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card border-t border-border">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    block px-3 py-2 rounded-lg text-base font-medium transition-all duration-200
                    flex items-center space-x-2
                    ${isActive(item.href)
                      ? 'bg-orange text-orange-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }
                  `}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.name}</span>
                </Link>
              )
            })}
            <div className="border-t border-border pt-4 pb-3">
              <div className="flex items-center px-3">
                <AppText size="sm" color="muted">{userName}</AppText>
              </div>
              <div className="mt-3 px-3">
                <AppButton variant="ghost" size="sm" className="w-full justify-start">
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}