import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { LettersDataTable } from "@/components/pension/letters-data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { KemenagDocumentTemplate } from "@/components/pension/KemenagDocumentTemplate"
import { getLetters } from "@/lib/letters"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

export default function SuratIndex() {
  const handleCreate = () => {
    window.location.href = "/generate-surat/new"
  }

  // Print modal state
  const [printOpen, setPrintOpen] = React.useState(false)
  const [printLetterId, setPrintLetterId] = React.useState<string | null>(null)
  const [viewOpen, setViewOpen] = React.useState(false)
  const [viewLetterId, setViewLetterId] = React.useState<string | null>(null)

  const letter = React.useMemo(() => getLetters().find(l => l.id === printLetterId) || null, [printLetterId])

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
    const frame = document.createElement("iframe")
    frame.style.position = "fixed"
    frame.style.right = "0"
    frame.style.bottom = "0"
    frame.style.width = "0"
    frame.style.height = "0"
    frame.style.border = "0"
    document.body.appendChild(frame)
    const win = frame.contentWindow
    const doc = win?.document
    if (doc) {
      doc.open()
      const base = `${window.location.origin}`
      doc.write(`<!DOCTYPE html><html><head><title>Print</title><base href="${base}"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/paper-css/0.4.1/paper.min.css"></head><body>${printContents}</body></html>`)
      doc.close()
      const waitForImages = async () => {
        const images = Array.from(doc.images || [])
        await Promise.all(
          images.map((img) =>
            img.complete && img.naturalWidth > 0
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.onload = () => resolve()
                  img.onerror = () => resolve()
                })
          )
        )
      }
      waitForImages().then(() => {
        win?.focus()
        win?.print()
        setTimeout(() => document.body.removeChild(frame), 1000)
      })
    } else {
      setTimeout(() => document.body.removeChild(frame), 1000)
    }
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <LettersDataTable 
          onCreateNew={handleCreate}
          onView={(item) => { setViewLetterId(item.id); setViewOpen(true) }}
          onEdit={(item) => {
            window.location.href = `/generate-surat/new?edit=${encodeURIComponent(item.id)}`
          }}
          onPrint={(item) => {
            setPrintLetterId(item.id)
            setPrintOpen(true)
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
      </div>
    </AppLayout>
  )
}


