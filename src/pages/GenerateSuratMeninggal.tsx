import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import SuratKeteranganMeninggalTemplate from "@/components/pension/SuratKeteranganMeninggalTemplate";
import { PegawaiSelector, PejabatSelector, Personnel } from "@/components/pension/personnel-selectors";

export default function GenerateSuratMeninggal() {
  const url = new URL(window.location.href);
  const reprintId = url.searchParams.get("reprint");
  const editId = url.searchParams.get("edit");

  const [printModalOpen, setPrintModalOpen] = React.useState<boolean>(false);
  // Logo fixed to /logo-kemenag.png per request
  const [documentSequence, setDocumentSequence] = React.useState<string>("");
  const [documentMonth, setDocumentMonth] = React.useState<string>("");
  const [documentYear, setDocumentYear] = React.useState<string>("");
  const [signaturePlace, setSignaturePlace] = React.useState<string>("");
  const [signatureDateInput, setSignatureDateInput] = React.useState<string>("");
  const [tanggalMeninggal, setTanggalMeninggal] = React.useState<string>("");
  const [dasarSurat, setDasarSurat] = React.useState<string>("");
  const [signatureMode, setSignatureMode] = React.useState<"manual" | "tte">("manual");
  const [signatureAnchor, setSignatureAnchor] = React.useState<"^" | "$" | "#">("^");
  const [pejabat, setPejabat] = React.useState<Personnel | null>(null);
  const [pegawai, setPegawai] = React.useState<Personnel | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const keepDigits = (val: string) => val.replace(/\D+/g, "");

  const documentNumber = React.useMemo(() => {
    const seqDigits = (documentSequence || "").replace(/\D+/g, "");
    const seq = seqDigits ? `B-${seqDigits}` : "B-";
    const mmRaw = (documentMonth || "").replace(/\D+/g, "").slice(0, 2);
    const mm = mmRaw.length === 1 ? `0${mmRaw}` : mmRaw;
    const yyyy = (documentYear || "").replace(/\D+/g, "").slice(0, 4);
    return `${seq}/Kw.18.1/2/Kp.01.2/${mm}/${yyyy}`;
  }, [documentSequence, documentMonth, documentYear]);

  const renderSignatureDate = React.useMemo(() => {
    if (!signatureDateInput) return "";
    const parts = signatureDateInput.split("-");
    if (parts.length !== 3) return "";
    const yyyy = parts[0];
    const mm = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    const monthName = months[(mm - 1) % 12] || "";
    return `${d} ${monthName} ${yyyy}`;
  }, [signatureDateInput]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!documentSequence) next.documentSequence = "Nomor urut wajib diisi";
    else if (!/^\d+$/.test(documentSequence)) next.documentSequence = "Nomor urut hanya angka";

    const mmNum = parseInt((documentMonth || "").replace(/\D+/g, ""), 10);
    if (!documentMonth) next.documentMonth = "Bulan wajib diisi";
    else if (isNaN(mmNum) || mmNum < 1 || mmNum > 12) next.documentMonth = "Bulan tidak valid (01-12)";

    const yyyyNum = parseInt((documentYear || "").replace(/\D+/g, ""), 10);
    if (!documentYear) next.documentYear = "Tahun wajib diisi";
    else if (String(documentYear).length !== 4 || isNaN(yyyyNum) || yyyyNum < 1900) next.documentYear = "Tahun tidak valid (yyyy)";

    if (!pejabat) next.pejabat = "Nama pejabat wajib dipilih";
    if (!pegawai) next.pegawai = "Nama pegawai (almarhum) wajib dipilih";

    if (!signaturePlace) next.signaturePlace = "Tempat tanda tangan wajib diisi";
    if (!signatureDateInput) next.signatureDateInput = "Tanggal tanda tangan wajib diisi";
    if (!tanggalMeninggal) next.tanggalMeninggal = "Tanggal meninggal wajib diisi";
    if (!dasarSurat) next.dasarSurat = "Dasar surat wajib diisi";

    setErrors(next);
    return next;
  };

  const handlePrint = () => {
    const printContents = document.getElementById("surat-print-area")?.innerHTML || "";
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

  const templateProps = {
    logoUrl: "/logo-kemenag.png",
    documentNumber,
    signatoryName: pejabat?.name || "",
    signatoryNip: pejabat?.nip || "",
    signatoryPosition: pejabat?.position || "",
    signatoryUnit: pejabat?.unit || "",
    signatoryAgency: "",
    subjectName: pegawai?.name || "",
    subjectNip: pegawai?.nip || "",
    subjectPosition: pegawai?.position || "",
    subjectUnit: pegawai?.unit || "",
    subjectAgency: "",
    dasarSurat,
    tanggalMeninggal,
    signaturePlace,
    signatureDate: renderSignatureDate,
    signatureMode,
    signatureAnchor,
  } as const;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Surat Keterangan Meninggal Dunia</CardTitle>
                <Button variant="outline" size="sm" onClick={() => (window.location.href = "/generate-surat")}> 
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nomor Surat</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input id="field-documentSequence" placeholder="Nomor Surat (mis. 125)" inputMode="numeric" pattern="[0-9]*" value={documentSequence} onChange={(e) => { const raw = e.target.value; const digits = keepDigits(raw); setDocumentSequence(digits); setErrors((s) => ({ ...s, documentSequence: raw !== digits ? "Nomor Surat hanya angka" : "" })); }} />
                  <Input id="field-documentMonth" placeholder="Bulan (MM)" inputMode="numeric" pattern="[0-9]*" maxLength={2} value={documentMonth} onChange={(e) => { const raw = e.target.value; const digits = keepDigits(raw).slice(0, 2); setDocumentMonth(digits); setErrors((s) => ({ ...s, documentMonth: raw !== digits ? "Bulan hanya angka" : "" })); }} />
                  <Input id="field-documentYear" placeholder="Tahun (YYYY)" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={documentYear} onChange={(e) => { const raw = e.target.value; const digits = keepDigits(raw).slice(0, 4); setDocumentYear(digits); setErrors((s) => ({ ...s, documentYear: raw !== digits ? "Tahun hanya angka" : "" })); }} />
                </div>
                {(errors.documentSequence || errors.documentMonth || errors.documentYear) && (
                  <div className="text-sm text-destructive space-y-1">
                    {errors.documentSequence && <p>{errors.documentSequence}</p>}
                    {errors.documentMonth && <p>{errors.documentMonth}</p>}
                    {errors.documentYear && <p>{errors.documentYear}</p>}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Pejabat Penandatangan</Label>
                <div id="field-pejabat">
                  <PejabatSelector value={pejabat} onChange={(v) => { setPejabat(v); setErrors((s) => ({ ...s, pejabat: v ? "" : "Nama pejabat wajib dipilih" })); }} placeholder="Ketik NIP/Nama pejabat" />
                </div>
                {errors.pejabat && <p className="text-sm text-destructive">{errors.pejabat}</p>}
              </div>

              <div className="space-y-2">
                <Label>Almarhum (Pegawai)</Label>
                <div id="field-pegawai">
                  <PegawaiSelector value={pegawai} onChange={(v) => { setPegawai(v); setErrors((s) => ({ ...s, pegawai: v ? "" : "Nama pegawai wajib dipilih" })); }} placeholder="Ketik NIP/Nama pegawai" />
                </div>
                {errors.pegawai && <p className="text-sm text-destructive">{errors.pegawai}</p>}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Dasar Surat</Label>
                <Input id="field-dasarSurat" value={dasarSurat} onChange={(e) => { const v = e.target.value; setDasarSurat(v); setErrors((s) => ({ ...s, dasarSurat: v ? "" : "Dasar surat wajib diisi" })); }} placeholder="Surat Keterangan RS/Desa No. ..." />
                {errors.dasarSurat && <p className="text-sm text-destructive">{errors.dasarSurat}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tanggal Meninggal</Label>
                  <Input id="field-tanggalMeninggal" type="date" value={tanggalMeninggal} onChange={(e) => { const v = e.target.value; setTanggalMeninggal(v); setErrors((s) => ({ ...s, tanggalMeninggal: v ? "" : "Tanggal meninggal wajib diisi" })); }} />
                  {errors.tanggalMeninggal && <p className="text-sm text-destructive">{errors.tanggalMeninggal}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Jenis Tanda Tangan</Label>
                  <Select value={signatureMode} onValueChange={(v: any) => setSignatureMode(v)}>
                    <SelectTrigger><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="tte">TTE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {signatureMode === "tte" && (
                <div className="space-y-2">
                  <Label>Anchor TTE</Label>
                  <Select value={signatureAnchor} onValueChange={(v: any) => setSignatureAnchor(v)}>
                    <SelectTrigger><SelectValue placeholder="Pilih anchor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="^">^</SelectItem>
                      <SelectItem value="$">$</SelectItem>
                      <SelectItem value="#">#</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tempat Tanda Tangan</Label>
                  <Input id="field-signaturePlace" value={signaturePlace} onChange={(e) => { const v = e.target.value; setSignaturePlace(v); setErrors((s) => ({ ...s, signaturePlace: v ? "" : "Tempat tanda tangan wajib diisi" })); }} placeholder="Mataram" />
                  {errors.signaturePlace && <p className="text-sm text-destructive">{errors.signaturePlace}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Tanda Tangan</Label>
                  <Input id="field-signatureDateInput" type="date" value={signatureDateInput} onChange={(e) => { const v = e.target.value; setSignatureDateInput(v); setErrors((s) => ({ ...s, signatureDateInput: v ? "" : "Tanggal tanda tangan wajib diisi" })); }} />
                  {errors.signatureDateInput && <p className="text-sm text-destructive">{errors.signatureDateInput}</p>}
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={() => { const v = validate(); if (Object.keys(v).length === 0) setPrintModalOpen(true); }}>Pratinjau & Cetak</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-md border overflow-auto">
          <div className="min-w-[800px]">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/paper-css/0.4.1/paper.min.css" />
            <div id="surat-print-area">
              <SuratKeteranganMeninggalTemplate {...templateProps} />
            </div>
          </div>
        </div>
      </div>

      <Dialog open={printModalOpen} onOpenChange={setPrintModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Cetak Surat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Pastikan data sudah benar sebelum mencetak.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setPrintModalOpen(false)}>Tutup</Button>
              <Button onClick={handlePrint}>Print / Download PDF</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}


