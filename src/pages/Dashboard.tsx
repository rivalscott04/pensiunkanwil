import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AppButton } from "@/components/ui/app-button"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { AppLayout } from "@/components/layout/app-layout"
import { Users, FileText, Clock, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { apiDashboardStats, apiSyncStatus, type DashboardPengajuanStats, type SyncStatus } from "@/lib/api"

export default function Dashboard() {
  const navigate = useNavigate()

  const [pengajuanStats, setPengajuanStats] = useState<DashboardPengajuanStats | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)

  useEffect(() => {
    let mounted = true
    Promise.allSettled([apiDashboardStats(), apiSyncStatus()])
      .then(([pengajuanRes, syncRes]) => {
        if (!mounted) return
        if (pengajuanRes.status === 'fulfilled') setPengajuanStats(pengajuanRes.value)
        if (syncRes.status === 'fulfilled') setSyncStatus(syncRes.value)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  const stats = useMemo(() => {
    const employeesCount = syncStatus?.employees_count ?? 0
    const lastSyncAt = syncStatus?.last_sync_at
    const totalSubmitted = pengajuanStats?.submitted ?? 0
    const totalDraft = pengajuanStats?.draft ?? 0
    const totalApproved = pengajuanStats?.approved ?? 0
    const thisMonth = pengajuanStats?.this_month ?? 0

    return [
      {
        title: "Total Pegawai",
        value: String(employeesCount),
        description: "Pegawai aktif terdaftar",
        icon: Users,
        trend: lastSyncAt ? `Sinkron: ${new Date(lastSyncAt).toLocaleString('id-ID')}` : "—"
      },
      {
        title: "Pengajuan Pensiun",
        value: String(totalSubmitted),
        description: "Menunggu persetujuan",
        icon: FileText,
        trend: `Bulan ini: ${thisMonth}`
      },
      {
        title: "Dalam Proses",
        value: String(totalDraft),
        description: "Sedang diverifikasi",
        icon: Clock,
        trend: `Bulan ini: ${thisMonth}`
      },
      {
        title: "Selesai",
        value: String(totalApproved),
        description: "Pensiun disetujui",
        icon: CheckCircle,
        trend: `Bulan ini: ${thisMonth}`
      }
    ]
  }, [pengajuanStats, syncStatus])

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <AppHeading level={1} className="mb-2">
              Dashboard SIMPEG Pensiun
            </AppHeading>
            <AppText color="muted">
              Selamat datang di sistem informasi manajemen pensiun pegawai
            </AppText>
          </div>
          
          <AppButton 
            variant="hero"
            size="lg"
            onClick={() => navigate('/pengajuan')}
            className="hover:scale-105 transition-all duration-200"
          >
            <FileText className="h-5 w-5 mr-2" />
            Ajukan Pensiun
          </AppButton>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="hover:shadow-md transition-all duration-200 animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-orange-400">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                  <div className="flex items-center text-xs mt-2">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600 dark:text-orange-400" />
                    <span className="text-green-600 dark:text-orange-400 font-medium">{stat.trend}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>
              Pantau perkembangan pengajuan pensiun terbaru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: "Pengajuan baru",
                  user: "Drs. Ahmad Syukur",
                  time: "2 jam yang lalu",
                  status: "pending",
                  type: "Batas Usia Pensiun (BUP)"
                },
                {
                  action: "Verifikasi selesai",
                  user: "Siti Nurhaliza, S.Pd",
                  time: "5 jam yang lalu",
                  status: "approved",
                  type: "Pensiun Sakit"
                },
                {
                  action: "Dokumen dikembalikan",
                  user: "H. Bambang Sutrisno",
                  time: "1 hari yang lalu",
                  status: "revision",
                  type: "Pensiun Janda/Duda"
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-orange-500/20 flex items-center justify-center">
                    {activity.status === "approved" ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-orange-400" />
                    ) : activity.status === "revision" ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    ) : (
                      <Clock className="h-5 w-5 text-green-600 dark:text-orange-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <AppText weight="medium">{activity.action}</AppText>
                    <AppText size="sm" color="muted">
                      {activity.user} • {activity.type}
                    </AppText>
                  </div>
                  
                  <AppText size="xs" color="muted">
                    {activity.time}
                  </AppText>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}