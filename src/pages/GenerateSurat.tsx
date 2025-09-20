import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getLetter, StoredLetter, saveLetter as saveLocalLetter } from "@/lib/letters";
import { saveLetterService } from "@/lib/letters-service";
import { Separator } from "@/components/ui/separator";
import { KemenagDocumentTemplate, KemenagTemplateProps } from "@/components/pension/KemenagDocumentTemplate";
import { PegawaiSelector, PejabatSelector, Personnel } from "@/components/pension/personnel-selectors";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

export default function CreateSurat() {
  const url = new URL(window.location.href);
  const reprintId = url.searchParams.get("reprint");
  const editId = url.searchParams.get("edit");
  const [printModalOpen, setPrintModalOpen] = React.useState<boolean>(false);
  const [errorModalOpen, setErrorModalOpen] = React.useState<boolean>(false);
  const [saving, setSaving] = React.useState<boolean>(false);
  // Logo fixed to /logo-kemenag.png per request
  const [documentSequence, setDocumentSequence] = React.useState<string>("");
  const [documentMonth, setDocumentMonth] = React.useState<string>("");
  const [documentYear, setDocumentYear] = React.useState<string>("");
  const [signaturePlace, setSignaturePlace] = React.useState<string>("");
  const [signatureDateInput, setSignatureDateInput] = React.useState<string>("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [pejabat, setPejabat] = React.useState<Personnel | null>(null);
  const [pegawai, setPegawai] = React.useState<Personnel | null>(null);
  const [signatureMode, setSignatureMode] = React.useState<"manual" | "tte">("manual");
  const [signatureAnchor, setSignatureAnchor] = React.useState<"^" | "$" | "#">("^");

  const documentNumberPage1 = React.useMemo(() => {
    const seqDigits = (documentSequence || "").replace(/\D+/g, "");
    const seq = seqDigits ? `B-${seqDigits}` : "B-";
    const mmRaw = (documentMonth || "").replace(/\D+/g, "").slice(0, 2);
    const mm = mmRaw.length === 1 ? `0${mmRaw}` : mmRaw;
    const yyyy = (documentYear || "").replace(/\D+/g, "").slice(0, 4);
    return `${seq}/Kw.18.1/2/Kp.01.2/${mm}/${yyyy}`;
  }, [documentSequence, documentMonth, documentYear]);

  const documentNumberPage2 = documentNumberPage1;

  const renderSignatureDate = React.useMemo(() => {
    // Expect input from <input type="date"> -> yyyy-mm-dd
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

  const templateProps: KemenagTemplateProps = {
    logoUrl: "/logo-kemenag.png",
    documentNumberPage1,
    documentNumberPage2,
    signatoryName: pejabat?.name || "",
    signatoryNip: pejabat?.nip || "",
    signatoryRank: pejabat?.rank || "",
    signatoryPosition: pejabat?.position || "",
    subjectName: pegawai?.name || "",
    subjectNip: pegawai?.nip || "",
    subjectRank: pegawai?.rank || "",
    subjectPosition: pegawai?.position || "",
    subjectAgency: pegawai?.unit || "",
    signaturePlace,
    signatureDate: renderSignatureDate,
    signatureMode,
    signatureAnchor,
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
        await Promise.all(
          images.map((img) =>
            img.complete && img.naturalWidth > 0
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                })
          )
        );
      };

      waitForImages().then(() => {
        win?.focus();
        win?.print();
        setTimeout(() => document.body.removeChild(frame), 1000);
      });
    } else {
      setTimeout(() => document.body.removeChild(frame), 1000);
    }
  };

  React.useEffect(() => {
    const id = reprintId || editId
    if (id) {
      const stored = getLetter(id);
      if (stored) {
        setDocumentSequence(stored.nomorSurat.split("/")[0].replace("B-", ""));
        const parts = stored.nomorSurat.split("/");
        setDocumentMonth(parts[parts.length - 2] || "");
        setDocumentYear(parts[parts.length - 1] || "");
        setSignaturePlace(stored.signaturePlace);
        setSignatureDateInput(stored.signatureDateInput);
        setSignatureMode(stored.signatureMode);
        setSignatureAnchor(stored.signatureAnchor);
        // TODO: Could also hydrate pejabat/pegawai if we store IDs later
      }
      if (reprintId) setTimeout(() => setPrintModalOpen(true), 0);
    }
  }, [reprintId, editId]);

  // Live validators per field
  const validateDocumentSequence = (val: string, opts?: { forSubmit?: boolean }) => {
    if (!val) return opts?.forSubmit ? "Nomor Surat wajib diisi" : "";
    if (!/^\d+$/.test(val)) return "Nomor Surat hanya angka";
    return "";
  };
  const validateDocumentMonth = (val: string) => {
    if (!val) return "Bulan wajib diisi";
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 1 || n > 12) return "Bulan tidak valid (01-12)";
    return "";
  };
  const validateDocumentYear = (val: string) => {
    if (!val) return "Tahun wajib diisi";
    if (val.length !== 4) return "Tahun tidak valid (yyyy)";
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 1900) return "Tahun tidak valid";
    return "";
  };
  const validateSignaturePlace = (val: string) => {
    if (!val) return "Tempat tanda tangan wajib diisi";
    return "";
  };
  const validateSignatureDate = (val: string) => {
    if (!val) return "Tanggal tanda tangan wajib diisi";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "Tanggal tidak valid";
    return "";
  };

  const keepDigits = (val: string) => val.replace(/\D+/g, "");

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
    if (!pegawai) next.pegawai = "Nama pegawai wajib dipilih";

    if (!signaturePlace) next.signaturePlace = "Tempat tanda tangan wajib diisi";
    if (!signatureDateInput) next.signatureDateInput = "Tanggal tanda tangan wajib diisi";
    else {
      const d = new Date(signatureDateInput);
      if (isNaN(d.getTime())) next.signatureDateInput = "Tanggal tidak valid";
    }

    setErrors(next);
    return next;
  };

  const handleSave = async () => {
    const v = {
      ...validate(),
      documentSequence: validateDocumentSequence(documentSequence, { forSubmit: true }) || undefined,
    } as Record<string, string>;
    Object.keys(v).forEach((k) => { if (!v[k]) delete v[k] })
    if (Object.keys(v).length > 0) {
      const firstKey = Object.keys(v)[0];
      const el = document.getElementById(`field-${firstKey}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setErrors(v);
      return;
    }
    const id = reprintId || editId || `LET-${Date.now()}`;
    const letter: StoredLetter = {
      id,
      nomorSurat: documentNumberPage1,
      tanggalSurat: signatureDateInput || new Date().toISOString().split('T')[0],
      namaPegawai: pegawai?.name || "",
      nipPegawai: pegawai?.nip,
      posisiPegawai: pegawai?.position,
      unitPegawai: pegawai?.unit,
      namaPenandatangan: pejabat?.name || "",
      nipPenandatangan: pejabat?.nip,
      jabatanPenandatangan: pejabat?.position,
      signaturePlace,
      signatureDateInput: signatureDateInput || new Date().toISOString().split('T')[0],
      signatureMode,
      signatureAnchor,
    };
    const payload = { ...(letter as any), type: 'hukuman_disiplin' } as any;
    try {
      setSaving(true)
      // Save to backend if configured, otherwise local storage
      const saved = await saveLetterService(editId ? (payload as any) : { ...(payload as any), id: "" as unknown as string })
      if (!saved) {
        saveLocalLetter(payload as any)
      }
      setPrintModalOpen(true)
    } catch (e) {
      // Fallback to local save so user does not lose work
      try { saveLocalLetter(payload as any) } catch {}
      setErrorModalOpen(true)
    } finally {
      setSaving(false)
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Surat Hukuman Disiplin</CardTitle>
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
                  <Input
                    id="field-documentSequence"
                    placeholder="Nomor Surat (mis. 125)"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={documentSequence}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const digits = keepDigits(raw);
                      const hadNonDigits = raw !== digits;
                      setDocumentSequence(digits);
                      const msg = hadNonDigits ? "Nomor Surat hanya angka" : "";
                      setErrors((s) => ({ ...s, documentSequence: msg }));
                    }}
                    onBlur={() => {
                      // clear transient message on blur (required is handled on submit)
                      if (errors.documentSequence === "Nomor Surat hanya angka") {
                        setErrors((s) => ({ ...s, documentSequence: "" }));
                      }
                    }}
                    aria-invalid={!!errors.documentSequence}
                    aria-describedby={errors.documentSequence ? "err-documentSequence" : undefined}
                    className={errors.documentSequence ? "border-destructive focus-visible:ring-destructive" : undefined}
                  />
                  <Input
                    id="field-documentMonth"
                    placeholder="Bulan (MM)"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    value={documentMonth}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const digits = keepDigits(raw).slice(0, 2);
                      const hadNonDigits = raw !== digits;
                      setDocumentMonth(digits);
                      const msg = hadNonDigits ? "Bulan hanya angka" : "";
                      setErrors((s) => ({ ...s, documentMonth: msg }));
                    }}
                    onBlur={() => {
                      if (errors.documentMonth === "Bulan hanya angka") {
                        setErrors((s) => ({ ...s, documentMonth: "" }));
                      }
                    }}
                    aria-invalid={!!errors.documentMonth}
                    aria-describedby={errors.documentMonth ? "err-documentMonth" : undefined}
                    className={errors.documentMonth ? "border-destructive focus-visible:ring-destructive" : undefined}
                  />
                  <Input
                    id="field-documentYear"
                    placeholder="Tahun (YYYY)"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={documentYear}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const digits = keepDigits(raw).slice(0, 4);
                      const hadNonDigits = raw !== digits;
                      setDocumentYear(digits);
                      const msg = hadNonDigits ? "Tahun hanya angka" : "";
                      setErrors((s) => ({ ...s, documentYear: msg }));
                    }}
                    onBlur={() => {
                      if (errors.documentYear === "Tahun hanya angka") {
                        setErrors((s) => ({ ...s, documentYear: "" }));
                      }
                    }}
                    aria-invalid={!!errors.documentYear}
                    aria-describedby={errors.documentYear ? "err-documentYear" : undefined}
                    className={errors.documentYear ? "border-destructive focus-visible:ring-destructive" : undefined}
                  />
                </div>
                {/* format helper removed per request; live preview on the right is sufficient */}
                {(errors.documentSequence || errors.documentMonth || errors.documentYear) && (
                  <div className="text-sm text-destructive space-y-1">
                    {errors.documentSequence && <p id="err-documentSequence">{errors.documentSequence}</p>}
                    {errors.documentMonth && <p id="err-documentMonth">{errors.documentMonth}</p>}
                    {errors.documentYear && <p id="err-documentYear">{errors.documentYear}</p>}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Nama Pejabat</Label>
                <div id="field-pejabat">
                  <PejabatSelector value={pejabat} onChange={(v) => { setPejabat(v); setErrors((s) => ({ ...s, pejabat: v ? "" : "Nama pejabat wajib dipilih" })); }} placeholder="Ketik NIP/Nama pejabat" />
                </div>
                {errors.pejabat && <p id="err-pejabat" className="text-sm text-destructive">{errors.pejabat}</p>}
              </div>

              <div className="space-y-2">
                <Label>Nama Pegawai</Label>
                <div id="field-pegawai">
                  <PegawaiSelector value={pegawai} onChange={(v) => { setPegawai(v); setErrors((s) => ({ ...s, pegawai: v ? "" : "Nama pegawai wajib dipilih" })); }} placeholder="Ketik NIP/Nama pegawai" />
                </div>
                {errors.pegawai && <p id="err-pegawai" className="text-sm text-destructive">{errors.pegawai}</p>}
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Jenis Tanda Tangan</Label>
                  <Select value={signatureMode} onValueChange={(v: any) => setSignatureMode(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="tte">TTE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {signatureMode === "tte" && (
                  <div className="space-y-2">
                    <Label>Anchor</Label>
                    <Select value={signatureAnchor} onValueChange={(v: any) => setSignatureAnchor(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih anchor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="^">^</SelectItem>
                        <SelectItem value="$">$</SelectItem>
                        <SelectItem value="#">#</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tempat Tanda Tangan</Label>
                  <Input
                    id="field-signaturePlace"
                    value={signaturePlace}
                    onChange={(e) => { const v = e.target.value; setSignaturePlace(v); setErrors((s) => ({ ...s, signaturePlace: validateSignaturePlace(v) })); }}
                    placeholder="Mataram"
                    aria-invalid={!!errors.signaturePlace}
                    aria-describedby={errors.signaturePlace ? "err-signaturePlace" : undefined}
                    className={errors.signaturePlace ? "border-destructive focus-visible:ring-destructive" : undefined}
                  />
                  {errors.signaturePlace && <p id="err-signaturePlace" className="text-sm text-destructive">{errors.signaturePlace}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Tanda Tangan</Label>
                  <Input
                    id="field-signatureDateInput"
                    type="date"
                    value={signatureDateInput}
                    onChange={(e) => { const v = e.target.value; setSignatureDateInput(v); setErrors((s) => ({ ...s, signatureDateInput: validateSignatureDate(v) })); }}
                    aria-invalid={!!errors.signatureDateInput}
                    aria-describedby={errors.signatureDateInput ? "err-signatureDateInput" : undefined}
                    className={errors.signatureDateInput ? "border-destructive focus-visible:ring-destructive" : undefined}
                  />
                  {errors.signatureDateInput && <p id="err-signatureDateInput" className="text-sm text-destructive">{errors.signatureDateInput}</p>}
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        <div className="bg-white rounded-md border overflow-auto">
          <div className="min-w-[800px]">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/paper-css/0.4.1/paper.min.css" />
            <div id="surat-print-area">
              <KemenagDocumentTemplate {...templateProps} />
            </div>
          </div>
        </div>
      </div>

      <Dialog open={printModalOpen} onOpenChange={(o) => {
        setPrintModalOpen(o)
        if (!o) {
          // After closing success, navigate to index so it refreshes
          window.location.href = "/generate-surat"
        }
      }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Surat tersimpan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Anda dapat mencetak sekarang atau nanti dari daftar surat.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setPrintModalOpen(false)}>Tutup</Button>
              <Button onClick={handlePrint}>Print / Download PDF</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error modal on failed save */}
      <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Gagal menyimpan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Terjadi kesalahan saat menyimpan ke server. Data telah disimpan di perangkat Anda. Anda tetap bisa mencetak sekarang atau mencoba lagi nanti.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setErrorModalOpen(false)}>Tutup</Button>
              <Button onClick={handlePrint}>Print / Download PDF</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}


