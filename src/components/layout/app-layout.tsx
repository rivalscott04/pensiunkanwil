import * as React from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { useAuth } from "@/hooks/use-auth"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, impersonation, isLoading } = useAuth()

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Get user info from impersonation or current user
  const displayUser = impersonation?.is_impersonating ? impersonation.impersonated : user
  const userRole = displayUser?.role || "kanwil"
  const userName = displayUser?.name || "Admin User"

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar userRole={userRole} userName={userName} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 gap-4">
              <SidebarTrigger className="h-8 w-8 p-1" />
              <div className="flex-1" />
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}