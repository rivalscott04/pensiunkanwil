import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { PejabatSelector, Personnel } from "@/components/pension/personnel-selectors";
import { SPTJMTemplate } from "@/components/pension/SPTJMTemplate";

export default function GenerateSPTJM() {
  const [nomorSurat, setNomorSurat] = React.useState("");
  const [pejabat, setPejabat] = React.useState<Personnel | null>(null);

  const [nomorSuratRujukan, setNomorSuratRujukan] = React.useState("");
  const [tanggalSuratRujukanInput, setTanggalSuratRujukanInput] = React.useState("");
  const [perihalSuratRujukan, setPerihalSuratRujukan] = React.useState("Pengakuan dan Penyematan Gelar");

  const [tempat, setTempat] = React.useState("Mataram");
  const [tanggalInput, setTanggalInput] = React.useState<string>("");

  const renderTanggal = React.useCallback((val: string) => {
    if (!val) return "";
    const parts = val.split("-");
    if (parts.length !== 3) return "";
    const yyyy = parts[0];
    const mm = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    const monthName = months[(mm - 1) % 12] || "";
    return `${d} ${monthName} ${yyyy}`;
  }, []);

  const tanggalSuratRujukanText = React.useMemo(() => renderTanggal(tanggalSuratRujukanInput), [tanggalSuratRujukanInput, renderTanggal]);
  const tanggalText = React.useMemo(() => renderTanggal(tanggalInput), [tanggalInput, renderTanggal]);

  const handlePrint = () => {
    const printContents = document.getElementById("sptjm-print-area")?.innerHTML || "";
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    document.body.appendChild(frame);
    const win = frame.contentWindow;
    const doc = win?.document;
    if (doc) {
      doc.open();
      const base = `${window.location.origin}`;
      doc.write(`<!DOCTYPE html><html><head><title>Print</title><base href="${base}"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/paper-css/0.4.1/paper.min.css"></head><body>${printContents}</body></html>`);
      doc.close();
      const waitForImages = async () => {
        const images = Array.from(doc.images || []);
        await Promise.all(images.map((img) => img.complete && img.naturalWidth > 0 ? Promise.resolve() : new Promise<void>((resolve) => { img.onload = () => resolve(); img.onerror = () => resolve(); })));
      };
      waitForImages().then(() => { win?.focus(); win?.print(); setTimeout(() => document.body.removeChild(frame), 1000); });
    } else {
      setTimeout(() => document.body.removeChild(frame), 1000);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="mb-4 flex items-center gap-3">
          <Button variant="ghost" onClick={() => window.history.back()} className="px-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold">SPTJM (khusus pejabat)</div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Surat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nomor Surat</Label>
                  <Input value={nomorSurat} onChange={(e) => setNomorSurat(e.target.value)} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Pejabat Penandatangan</Label>
                  <PejabatSelector value={pejabat} onChange={setPejabat} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nomor Surat Rujukan</Label>
                  <Input value={nomorSuratRujukan} onChange={(e) => setNomorSuratRujukan(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Surat Rujukan</Label>
                  <Input type="date" value={tanggalSuratRujukanInput} onChange={(e) => setTanggalSuratRujukanInput(e.target.value)} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Perihal Surat Rujukan</Label>
                  <Input value={perihalSuratRujukan} onChange={(e) => setPerihalSuratRujukan(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tempat</Label>
                  <Input value={tempat} onChange={(e) => setTempat(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input type="date" value={tanggalInput} onChange={(e) => setTanggalInput(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => window.history.back()}>Batal</Button>
                <Button onClick={handlePrint}>Print / Download PDF</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded bg-white overflow-auto">
                <div className="min-w-[800px]">
                  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/paper-css/0.4.1/paper.min.css" />
                  <div id="sptjm-print-area">
                    <SPTJMTemplate
                      logoUrl="/logo-kemenag.png"
                      nomorSurat={nomorSurat}
                      namaPenandatangan={pejabat?.name || ""}
                      nipPenandatangan={pejabat?.nip || ""}
                      jabatanPenandatangan={pejabat?.position || ""}
                      nomorSuratRujukan={nomorSuratRujukan}
                      tanggalSuratRujukanText={tanggalSuratRujukanText}
                      perihalSuratRujukan={perihalSuratRujukan}
                      tempat={tempat}
                      tanggalText={tanggalText}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}


