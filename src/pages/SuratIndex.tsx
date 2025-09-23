import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { LettersDataTable } from "@/components/pension/letters-data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { KemenagDocumentTemplate } from "@/components/pension/KemenagDocumentTemplate"
import { listLetters } from "@/lib/letters-service"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Briefcase, FileSignature, FileText, Search } from "lucide-react"

export default function SuratIndex() {
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [pickerSearch, setPickerSearch] = React.useState("")
  const [pickerTab, setPickerTab] = React.useState<"all" | "pensiun" | "gelar" | "sptjm" | "lainnya">("all")

  const handleCreate = () => {
    setPickerOpen(true)
  }

  type LetterTypeOption = {
    id: string
    label: string
    description: string
    category: "pensiun" | "gelar" | "sptjm" | "lainnya"
    route: string
    keywords?: string[]
    badge?: string
  }

  const LETTER_TYPES: LetterTypeOption[] = React.useMemo(() => [
    {
      id: "pengantar_pensiun",
      label: "Pengantar Pensiun",
      description: "Surat pengantar usul pensiun (BUP/J/D/KPP)",
      category: "pensiun",
      route: "/generate-surat/pengantar-pensiun",
      keywords: ["pensiun", "usul", "bup", "kpp"],
    },
    {
      id: "pengantar_gelar",
      label: "Pengantar Gelar",
      description: "Surat pengantar pengakuan/penyematan gelar",
      category: "gelar",
      route: "/generate-surat/pengantar-gelar",
      keywords: ["gelar", "pendidikan", "pengakuan"],
    },
    {
      id: "sptjm_gelar",
      label: "SPTJM (Pengantar Gelar)",
      description: "Surat Pernyataan Tanggung Jawab Mutlak untuk pengantar gelar",
      category: "sptjm",
      route: "/generate-surat/sptjm?type=gelar",
      keywords: ["sptjm", "gelar"],
    },
    {
      id: "sptjm_pensiun",
      label: "SPTJM (Pengantar Pensiun)",
      description: "SPTJM untuk pengantar pensiun dengan daftar atas nama",
      category: "sptjm",
      route: "/generate-surat/sptjm?type=pensiun",
      keywords: ["sptjm", "pensiun"],
    },
    {
      id: "surat_keterangan_meninggal",
      label: "Surat Keterangan Meninggal",
      description: "Keterangan meninggal dunia",
      category: "lainnya",
      route: "/generate-surat/meninggal",
      keywords: ["meninggal", "keterangan"],
    },
    {
      id: "hukuman_disiplin",
      label: "Surat Hukuman Disiplin",
      description: "Surat Hukuman Disiplin Kemenag",
      category: "lainnya",
      route: "/generate-surat/hukuman-disiplin",
      keywords: ["hukuman", "disiplin", "kemenag", "sanksi"],
    },
  ], [])

  const lastUsedKey = "pf_last_letter_type"
  const lastUsedId = React.useMemo(() => {
    try { return localStorage.getItem(lastUsedKey) || "" } catch { return "" }
  }, [])

  const filteredTypes = React.useMemo(() => {
    const q = (pickerSearch || "").trim().toLowerCase()
    return LETTER_TYPES.filter(t => (pickerTab === "all" || t.category === pickerTab))
      .filter(t => q === "" || [t.label, t.description, ...(t.keywords || [])].join(" ").toLowerCase().includes(q))
  }, [LETTER_TYPES, pickerTab, pickerSearch])

  const getIconFor = (opt: LetterTypeOption) => {
    if (opt.id.startsWith("pengantar_gelar")) return <GraduationCap className="h-5 w-5" />
    if (opt.id.startsWith("pengantar_pensiun")) return <Briefcase className="h-5 w-5" />
    if (opt.id.startsWith("sptjm")) return <FileSignature className="h-5 w-5" />
    if (opt.id.includes("meninggal")) return <FileText className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  const handlePick = (opt: LetterTypeOption) => {
    try { localStorage.setItem(lastUsedKey, opt.id) } catch {}
    window.location.href = opt.route
  }

  // Print modal state
  const [printOpen, setPrintOpen] = React.useState(false)
  const [printLetterId, setPrintLetterId] = React.useState<string | null>(null)
  const [viewOpen, setViewOpen] = React.useState(false)
  const [viewLetterId, setViewLetterId] = React.useState<string | null>(null)

  const [letters, setLetters] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  // Load letters from database
  React.useEffect(() => {
    const loadLetters = async () => {
      try {
        setLoading(true)
        const data = await listLetters()
        setLetters(data)
      } catch (error) {
        console.error('Failed to load letters:', error)
        setLetters([])
      } finally {
        setLoading(false)
      }
    }
    loadLetters()
  }, [])

  const letter = React.useMemo(() => letters.find(l => l.id === printLetterId) || null, [letters, printLetterId])

  const documentNumberPage = letter?.nomorSurat || ""
  const signatureDate = React.useMemo(() => {
    if (!letter?.signatureDateInput) return ""
    const parts = letter.signatureDateInput.split("-")
    if (parts.length !== 3) return ""
    const yyyy = parts[0]
    const mm = parseInt(parts[1], 10)
    const d = parseInt(parts[2], 10)
    const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]
    const monthName = months[(mm - 1) % 12] || ""
    return `${d} ${monthName} ${yyyy}`
  }, [letter?.signatureDateInput])

  const handlePrintNow = () => {
    const printContents = document.getElementById("surat-print-area-index")?.innerHTML || ""
    const base = `${window.location.origin}`
    
    // Create a new window/tab for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) {
      alert('Popup blocked! Please allow popups for this site to print documents.')
      return
    }
    
    const printDocument = printWindow.document
    printDocument.open()
    printDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Surat - Print</title>
          <base href="${base}">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/paper-css/0.4.1/paper.min.css">
          <style>
            @page {
              size: A4;
              margin: 2cm;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 10.5pt;
              line-height: 1.6;
              color: #000;
            }
            h1, h2, h3, h4, h5, h6 {
              font-size: 11.5pt;
            }
            .print-content {
              max-width: 100%;
              margin: 0 auto;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="print-content">
            ${printContents}
          </div>
        </body>
      </html>
    `)
    printDocument.close()
    
    // Wait for images to load then print
    const waitForImages = async () => {
      const images = Array.from(printDocument.images || [])
      await Promise.all(images.map((img) => 
        img.complete && img.naturalWidth > 0 
          ? Promise.resolve() 
          : new Promise<void>((resolve) => { 
              img.onload = () => resolve() 
              img.onerror = () => resolve() 
            })
      ))
    }
    
    waitForImages().then(() => {
      printWindow.focus()
      printWindow.print()
      // Close the window after printing (optional)
      // printWindow.close()
    })
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <LettersDataTable 
          data={letters}
          loading={loading}
          onCreateNew={handleCreate}
          onView={(item) => { setViewLetterId(item.id); setViewOpen(true) }}
          onEdit={(item) => {
            window.location.href = `/generate-surat/hukuman-disiplin?edit=${encodeURIComponent(item.id)}`
          }}
          onPrint={(item) => {
            setPrintLetterId(item.id)
            // Directly print without opening modal
            setTimeout(() => {
              handlePrintNow()
            }, 100)
          }}
        />

        <Dialog open={printOpen} onOpenChange={setPrintOpen}>
          <DialogContent className="max-w-[860px]">
            <DialogHeader>
              <DialogTitle>Cetak Surat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border rounded bg-white overflow-auto">
                <div className="min-w-[800px]">
                  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/paper-css/0.4.1/paper.min.css" />
                  <div id="surat-print-area-index">
                    {letter && (
                      <KemenagDocumentTemplate
                        logoUrl="/logo-kemenag.png"
                        documentNumberPage1={documentNumberPage}
                        documentNumberPage2={documentNumberPage}
                        signatoryName={letter.namaPenandatangan}
                        signatoryNip={letter.nipPenandatangan}
                        signatoryPosition={letter.jabatanPenandatangan}
                        subjectName={letter.namaPegawai}
                        subjectNip={letter.nipPegawai}
                        subjectPosition={letter.posisiPegawai}
                        subjectAgency={letter.unitPegawai}
                        signaturePlace={letter.signaturePlace}
                        signatureDate={signatureDate}
                        signatureMode={letter.signatureMode}
                        signatureAnchor={letter.signatureAnchor}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button className="px-4 py-2 border rounded" onClick={() => setPrintOpen(false)}>Tutup</button>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded" onClick={handlePrintNow}>Print / Download PDF</button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Detail Surat</DialogTitle>
            </DialogHeader>
            {letter && (
              <div className="rounded border overflow-hidden">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">No Surat</TableCell>
                      <TableCell className="font-mono text-sm">{letter.nomorSurat}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tanggal Surat</TableCell>
                      <TableCell>{signatureDate}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Nama Pegawai</TableCell>
                      <TableCell>{letter.namaPegawai}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">NIP Pegawai</TableCell>
                      <TableCell className="font-mono text-sm">{letter.nipPegawai}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Penandatangan</TableCell>
                      <TableCell>{letter.namaPenandatangan}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">NIP Penandatangan</TableCell>
                      <TableCell className="font-mono text-sm">{letter.nipPenandatangan}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Picker dialog */}
        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogContent className="max-w-[840px]">
            <DialogHeader>
              <DialogTitle>Pilih Jenis Surat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value.replace(/\s{2,}/g, " "))}
                  placeholder="Cari jenis surat..." className="pl-10" aria-label="Cari jenis surat"
                />
              </div>
              <Tabs value={pickerTab} onValueChange={(v: any) => setPickerTab(v)}>
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="all">Semua</TabsTrigger>
                  <TabsTrigger value="pensiun">Pensiun</TabsTrigger>
                  <TabsTrigger value="gelar">Gelar</TabsTrigger>
                  <TabsTrigger value="sptjm">SPTJM</TabsTrigger>
                  <TabsTrigger value="lainnya">Lainnya</TabsTrigger>
                </TabsList>
              </Tabs>

              {lastUsedId && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Terakhir digunakan</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {LETTER_TYPES.filter(t => t.id === lastUsedId).map(opt => (
                      <Card key={`recent-${opt.id}`} className="hover:border-primary focus-within:ring-2 focus-within:ring-primary transition cursor-pointer"
                        role="button" tabIndex={0} aria-label={`Pilih ${opt.label}`}
                        onClick={() => handlePick(opt)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handlePick(opt) }}>
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className="mt-0.5 text-primary">{getIconFor(opt)}</div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium truncate">{opt.label}</div>
                              <Badge variant="secondary" className="uppercase">{opt.category}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-2">{opt.description}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTypes.length === 0 ? (
                  <div className="col-span-full text-sm text-muted-foreground">Tidak ada jenis surat yang cocok. Coba reset filter.</div>
                ) : (
                  filteredTypes.map(opt => (
                    <Card key={opt.id} className="hover:border-primary focus-within:ring-2 focus-within:ring-primary transition cursor-pointer"
                      role="button" tabIndex={0} aria-label={`Pilih ${opt.label}`}
                      onClick={() => handlePick(opt)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handlePick(opt) }}>
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="mt-0.5 text-primary">{getIconFor(opt)}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium truncate">{opt.label}</div>
                            <Badge variant="secondary" className="uppercase">{opt.category}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-2">{opt.description}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}


