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
import { GraduationCap, Briefcase, FileSignature, FileText, Search, Copy, Check } from "lucide-react"

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
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

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

  const letter = React.useMemo(() => letters.find(l => l.id === (printLetterId || viewLetterId)) || null, [letters, printLetterId, viewLetterId])

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

  const handlePrintWithItem = (item: any) => {
    const base = `${window.location.origin}`
    
    // Create a new window/tab for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) {
      alert('Popup blocked! Please allow popups for this site to print documents.')
      return
    }
    
    // Generate signature date from item data
    const formatSignatureDate = (signatureDateInput: string) => {
      if (!signatureDateInput) return ""
      const parts = signatureDateInput.split("-")
      if (parts.length !== 3) return ""
      const yyyy = parts[0]
      const mm = parseInt(parts[1], 10)
      const d = parseInt(parts[2], 10)
      const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]
      const monthName = months[(mm - 1) % 12] || ""
      return `${d} ${monthName} ${yyyy}`
    }
    
    const documentNumberPage = item.nomorSurat || ""
    
    const printContent = `
      <div class="w-full bg-white text-black">
        <style>
          @page { size: auto; margin: 0; }
          @media print { body { -webkit-print-color-adjust: exact; } }
          .sheet { padding: 1.5cm 2cm; page-break-after: always; }
          .sheet:last-child { page-break-after: auto; }
          .content-wrapper { margin: 0 1cm; }
          .header { border-bottom: 3px solid black; padding-bottom: 12px; margin-bottom: 20px; overflow: hidden; }
          .header .logo { width: 100px; height: 100px; float: left; margin-right: 10px; object-fit: contain; }
          .header-text { font-size: 11.5pt; font-weight: bold; line-height: 1.2; text-align: center; margin: 0; }
          .header-info { font-size: 10.5pt; line-height: 1.1; text-align: center; margin: 5px 0 0 0; }
          .title { font-size: 10.5pt; font-weight: bold; text-align: center; margin: 8px 0; }
          .document-number { text-align: center; margin-bottom: 6px; }
          .data-row { display: flex; margin-bottom: 6px; }
          .data-label { width: 150px; flex-shrink: 0; }
          .data-colon { width: 20px; flex-shrink: 0; }
          .data-value { flex-grow: 1; }
          .statement-text { margin: 20px 0; text-align: justify; line-height: 1.5; }
          .signature-section { margin-top: 20px; text-align: right; }
          .signature-inner { display: inline-block; text-align: left; }
          .signature-date { margin-bottom: 1px;}
          .signature-title { margin-bottom: 36px; }
          .signature-name { font-weight: bold; text-decoration: underline; }
          .signature-nip { margin-top: 5px; }
          .signature-anchor { margin: 6px 0 24px 0; font-weight: bold; }
          .reference-note { font-size: 8pt; margin-bottom: 15px; text-align: right; }
        </style>

        <!-- Halaman 1 -->
        <section class="sheet">
          <div class="header">
            <img src="${base}/logo-kemenag.png" alt="Logo Kementerian Agama" class="logo" />
            <div class="header-content">
              <div class="header-text">
                KEMENTERIAN AGAMA REPUBLIK INDONESIA<br />
                KANTOR WILAYAH KEMENTERIAN AGAMA<br />
                PROVINSI NUSA TENGGARA BARAT
              </div>
              <div class="header-info">
                Jalan Udayana No. 6 Tlp. 633040 Fax ( 0370 ) 622317 Mataram<br />
                Website : http://ntb.kemenag.go.id email : updepagntb@gmail.com
              </div>
            </div>
          </div>

          <div class="content-wrapper">
            <div class="title">
              <strong>SURAT PERNYATAAN</strong><br />
              <strong>TIDAK PERNAH DIJATUHI HUKUMAN DISIPLIN TINGKAT SEDANG / BERAT</strong>
            </div>

            <div class="document-number">Nomor : ${documentNumberPage}</div>

            <div class="signatory-info">
              <p>Yang bertanda tangan dibawah ini :</p>
              <div class="data-row"><div class="data-label">Nama</div><div class="data-colon">:</div><div class="data-value">${item.namaPenandatangan || ""}</div></div>
              <div class="data-row"><div class="data-label">Nip</div><div class="data-colon">:</div><div class="data-value">${(item.nipPenandatangan || "").replace(/\D+/g, "")}</div></div>
              <div class="data-row"><div class="data-label">Pangkat/Golongan Ruang</div><div class="data-colon">:</div><div class="data-value">${item.golonganPenandatangan || ""}</div></div>
              <div class="data-row"><div class="data-label">Jabatan</div><div class="data-colon">:</div><div class="data-value">${item.jabatanPenandatangan || ""}</div></div>
            </div>

            <div class="subject-info" style="margin-top: 20px;">
              <p>Dengan ini menyatakan dengan sesungguhnya, bahwa Pegawai Negeri Sipil :</p>
              <div class="data-row"><div class="data-label">Nama</div><div class="data-colon">:</div><div class="data-value">${item.namaPegawai || ""}</div></div>
              <div class="data-row"><div class="data-label">Nip</div><div class="data-colon">:</div><div class="data-value">${(item.nipPegawai || "").replace(/\D+/g, "")}</div></div>
              <div class="data-row"><div class="data-label">Pangkat/Golongan Ruang</div><div class="data-colon">:</div><div class="data-value">${item.golonganPegawai || ""}</div></div>
              <div class="data-row"><div class="data-label">Jabatan</div><div class="data-colon">:</div><div class="data-value">${item.posisiPegawai || ""}</div></div>
              <div class="data-row"><div class="data-label">Instansi</div><div class="data-colon">:</div><div class="data-value">${item.unitPegawai || ""}</div></div>
            </div>

            <div class="statement-text">
              <p>dalam 1 ( satu ) tahun terakhir tidak pernah dijatuhi hukuman disiplin tingkat sedang/berat.</p>
            </div>

            <div class="statement-text">
              <p>Demikian Surat Pernyataan ini saya buat dengan sesungguhnya dengan mengingat sumpah jabatan dan apabila dikemudian hari ternyata isi surat pernyataan ini tidak benar yang mengakibatkan kerugian bagi negara, maka saya bersedia menanggung kerugian tersebut.</p>
            </div>

            <div class="signature-section">
              <div class="signature-inner">
                <div class="signature-date">${item.signaturePlace || ""}${item.signaturePlace && item.signatureDateInput ? ", " : ""}${formatSignatureDate(item.signatureDateInput || "")}</div>
                <div class="signature-title">KEPALA</div>
                ${item.signatureMode === "tte" ? `<div class="signature-anchor">${item.signatureAnchor || "^"}</div>` : ""}
                <div class="signature-name">${item.namaPenandatangan || ""}</div>
                <div class="signature-nip">NIP. ${(item.nipPenandatangan || "").replace(/\D+/g, "")}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Halaman 2 -->
        <section class="sheet">
          <div class="content-wrapper">
            <div class="reference-note">
              ANAK LAMPIRAN 4<br />
              PERATURAN BADAN KEPEGAWAIAN NEGARA<br />
              REPUBLIK INDONESIA<br />
              NOMOR 2 TAHUN 2018<br />
              TENTANG<br />
              PEDOMAN PEMBERIAN PERTIMBANGAN TEHNIS<br />
              PENSIUN PEGAWAI NEGERI SIPIL DAN PENSIUN<br />
              JANDA/DUDA PEGAWAI NEGERI SIPIL
            </div>

            <div class="title">
              <strong>SURAT PERNYATAAN</strong><br />
              <strong>
                TIDAK SEDANG MENJALANI PROSES PIDANA ATAU PERNAH DIPIDANA PENJARA BERDASARKAN
                PUTUSAN PENGADILAN YANG TELAH BERKEKUATAN HUKUM TETAP
              </strong>
            </div>

            <div class="document-number">Nomor : ${documentNumberPage}</div>

            <div class="signatory-info">
              <p>Yang bertanda tangan dibawah ini</p>
              <div class="data-row"><div class="data-label">Nama</div><div class="data-colon">:</div><div class="data-value">${item.namaPenandatangan || ""}</div></div>
              <div class="data-row"><div class="data-label">Nip</div><div class="data-colon">:</div><div class="data-value">${(item.nipPenandatangan || "").replace(/\D+/g, "")}</div></div>
              <div class="data-row"><div class="data-label">Pangkat/Golongan Ruang</div><div class="data-colon">:</div><div class="data-value">${item.golonganPenandatangan || ""}</div></div>
              <div class="data-row"><div class="data-label">Jabatan</div><div class="data-colon">:</div><div class="data-value">${item.jabatanPenandatangan || ""}</div></div>
            </div>

            <div class="subject-info" style="margin-top: 20px;">
              <p>Dengan ini menyatakan dengan sesungguhnya, bahwa Pegawai Negeri Sipil :</p>
              <div class="data-row"><div class="data-label">Nama</div><div class="data-colon">:</div><div class="data-value">${item.namaPegawai || ""}</div></div>
              <div class="data-row"><div class="data-label">Nip</div><div class="data-colon">:</div><div class="data-value">${(item.nipPegawai || "").replace(/\D+/g, "")}</div></div>
              <div class="data-row"><div class="data-label">Pangkat/Golongan Ruang</div><div class="data-colon">:</div><div class="data-value">${item.golonganPegawai || ""}</div></div>
              <div class="data-row"><div class="data-label">Jabatan</div><div class="data-colon">:</div><div class="data-value">${item.posisiPegawai || ""}</div></div>
              <div class="data-row"><div class="data-label">Instansi</div><div class="data-colon">:</div><div class="data-value">${item.unitPegawai || ""}</div></div>
            </div>

            <div class="statement-text">
              <p>
                Tidak sedang menjalani proses pidana atau pernah dipidana penjara berdasarkan putusan pengadilan yang telah berkekuatan hukum tetap karena melakukan tindak pidana kejahatan jabatan atau tindak pidana kejahatan yang ada hubungannya dengan jabatan dan/atau pidana umum.
              </p>
            </div>

            <div class="statement-text">
              <p>
                Demikian surat pernyataan ini saya buat dengan sesungguhnya dengan mengingat sumpah jabatan dan apabila dikemudian hari ternyata isi surat pernyataan ini tidak benar yang mengakibatkan kerugian bagi negara, maka saya bersedia menanggung kerugian negara sesuai dengan ketentuan peraturan perundang-undangan.
              </p>
            </div>

            <div class="signature-section">
              <div class="signature-inner">
                <div class="signature-date">${item.signaturePlace || ""}${item.signaturePlace && item.signatureDateInput ? ", " : ""}${formatSignatureDate(item.signatureDateInput || "")}</div>
                <div class="signature-title">KEPALA</div>
                ${item.signatureMode === "tte" ? `<div class="signature-anchor">${item.signatureAnchor || "^"}</div>` : ""}
                <div class="signature-name">${item.namaPenandatangan || ""}</div>
                <div class="signature-nip">NIP. ${(item.nipPenandatangan || "").replace(/\D+/g, "")}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    `
    
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
            ${printContent}
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

  const handlePrintNow = () => {
    if (!letter) {
      console.error('No letter selected for printing')
      return
    }
    
    handlePrintWithItem(letter)
  }

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const CopyableField = ({ text, field, className = "" }: { text: string, field: string, className?: string }) => (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono text-sm">{text}</span>
      <button
        onClick={() => handleCopy(text, field)}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Copy to clipboard"
      >
        {copiedField === field ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Copy className="h-3 w-3 text-gray-500" />
        )}
      </button>
    </div>
  )

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
            // Directly print with the item data
            handlePrintWithItem(item)
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
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Surat</DialogTitle>
            </DialogHeader>
            {letter && (
              <div className="rounded border overflow-hidden">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">No Surat</TableCell>
                      <TableCell>
                        <CopyableField text={letter.nomorSurat} field={`nomor-${letter.id}`} />
                      </TableCell>
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
                      <TableCell>
                        <CopyableField text={letter.nipPegawai || ""} field={`nip-pegawai-${letter.id}`} />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Pangkat/Golongan Pegawai</TableCell>
                      <TableCell>{(letter as any).golonganPegawai || "-"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Jabatan Pegawai</TableCell>
                      <TableCell>{letter.posisiPegawai || "-"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Unit Kerja</TableCell>
                      <TableCell>{letter.unitPegawai || "-"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Penandatangan</TableCell>
                      <TableCell>{letter.namaPenandatangan}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">NIP Penandatangan</TableCell>
                      <TableCell>
                        <CopyableField text={letter.nipPenandatangan || ""} field={`nip-penandatangan-${letter.id}`} />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Pangkat/Golongan Penandatangan</TableCell>
                      <TableCell>{(letter as any).golonganPenandatangan || "-"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Jabatan Penandatangan</TableCell>
                      <TableCell>{letter.jabatanPenandatangan || "-"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tempat Tanda Tangan</TableCell>
                      <TableCell>{letter.signaturePlace || "-"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Jenis Tanda Tangan</TableCell>
                      <TableCell className="capitalize">{letter.signatureMode || "-"}</TableCell>
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


