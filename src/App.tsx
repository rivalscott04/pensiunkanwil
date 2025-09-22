import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/use-auth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Pengajuan from "./pages/Pengajuan";
import DetailPengajuan from "./pages/DetailPengajuan";
import PegawaiPensiun from "./pages/PegawaiPensiun";
import DocumentUpload from "./pages/DocumentUpload";
import CreateSurat from "./pages/GenerateSurat";
import GenerateSuratMeninggal from "./pages/GenerateSuratMeninggal";
import SuratIndex from "./pages/SuratIndex";
import GeneratePengantarGelar from "./pages/GeneratePengantarGelar";
import GenerateSPTJM from "./pages/GenerateSPTJM";
import GeneratePengantarPensiun from "./pages/GeneratePengantarPensiun";
import NotFound from "./pages/NotFound";
import UsersPage from "./pages/Users";
import SessionExpiredModal from "@/components/ui/session-expired-modal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <SessionExpiredListener />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pengajuan" element={<Pengajuan />} />
              <Route path="/pengajuan/detail/:id" element={<DetailPengajuan />} />
              <Route path="/pegawai" element={<PegawaiPensiun />} />
              <Route path="/pengajuan/upload" element={<DocumentUpload />} />
              <Route path="/generate-surat" element={<SuratIndex />} />
              <Route path="/generate-surat/hukuman-disiplin" element={<CreateSurat />} />
              <Route path="/generate-surat/meninggal" element={<GenerateSuratMeninggal />} />
              <Route path="/generate-surat/pengantar-gelar" element={<GeneratePengantarGelar />} />
              <Route path="/generate-surat/pengantar-pensiun" element={<GeneratePengantarPensiun />} />
              <Route path="/generate-surat/sptjm" element={<GenerateSPTJM />} />
              <Route path="/users" element={<UsersPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

// Local component to listen for global session-expired events and render the modal
function SessionExpiredListener() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const handler = () => {
      // Do not show the modal if already on login page
      if (window.location.pathname === '/login') return
      setOpen(true)
    }
    window.addEventListener('session-expired', handler as EventListener)
    return () => window.removeEventListener('session-expired', handler as EventListener)
  }, [])

  const handleConfirm = React.useCallback(() => {
    try { localStorage.removeItem('auth_token') } catch {}
    // Optional: clear any other client caches if needed
    window.location.href = '/login'
  }, [])

  // If navigated to login while modal open, close it
  React.useEffect(() => {
    const onPopState = () => {
      if (window.location.pathname === '/login') setOpen(false)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return <SessionExpiredModal open={open} onConfirm={handleConfirm} />
}
