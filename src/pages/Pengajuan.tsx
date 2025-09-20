import * as React from "react"
import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { SkeletonDataTable } from "@/components/ui/skeleton"
import { ApplicationsDataTable } from "@/components/pension/applications-data-table"

interface Application {
  id: string
  tanggalPengajuan: string
  namaPegawai: string
  nip: string
  jenisPensiun: string
  status: 'draft' | 'diajukan' | 'diterima' | 'ditolak'
  tanggalUpdate: string
}

export default function Pengajuan() {
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleApplicationSelect = (application: Application) => {
    setSelectedApplication(application)
  }

  // Simulate loading for demonstration
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <AppHeading level={1} className="mb-2">
                Pengajuan Pensiun
              </AppHeading>
              <AppText color="muted">
                Daftar dan kelola semua pengajuan pensiun yang telah disubmit
              </AppText>
            </div>
          </div>
          <SkeletonDataTable />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <AppHeading level={1} className="mb-2">
              Pengajuan Pensiun
            </AppHeading>
            <AppText color="muted">
              Daftar dan kelola semua pengajuan pensiun yang telah disubmit
            </AppText>
          </div>
        </div>

        {/* Applications Data Table */}
        <ApplicationsDataTable 
          onApplicationSelect={handleApplicationSelect}
          selectedApplication={selectedApplication}
        />
      </div>
    </AppLayout>
  )
}