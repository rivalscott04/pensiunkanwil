import * as React from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
// Removed top header user dropdown per request; account controls live in sidebar
import { AppSidebar } from "@/components/layout/app-sidebar"

interface AppLayoutProps {
  children: React.ReactNode
  userRole?: string
  userName?: string
}

export function AppLayout({ children, userRole = "kanwil", userName = "Admin User" }: AppLayoutProps) {
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