import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { PejabatSelector, PegawaiSelector, Personnel } from "@/components/pension/personnel-selectors";
import { SPTJMTemplateGelar } from "@/components/pension/SPTJMTemplateGelar";
import { SPTJMTemplatePensiun } from "@/components/pension/SPTJMTemplatePensiun";
import { listLettersByType, saveLetterService } from "@/lib/letters-service";

export default function GenerateSPTJM() {
  const url = new URL(window.location.href);
  const typeParam = (url.searchParams.get("type") || "").toLowerCase();
  type SptjmType = "gelar" | "pensiun";
  const [sptjmType, setSptjmType] = React.useState<SptjmType>((typeParam === "pensiun" || typeParam === "gelar") ? (typeParam as SptjmType) : "gelar");

  // nomor: only digits and dot
  const [nomorSurat, setNomorSurat] = React.useState("");
  const [pejabat, setPejabat] = React.useState<Personnel | null>(null);

  const [nomorSuratRujukan, setNomorSuratRujukan] = React.useState("");
  const [tanggalSuratRujukanInput, setTanggalSuratRujukanInput] = React.useState("");
  const [perihalSuratRujukan, setPerihalSuratRujukan] = React.useState("");

  const [tempat, setTempat] = React.useState("Mataram");
  const [tanggalInput, setTanggalInput] = React.useState<string>("");

  React.useEffect(() => {
    setPerihalSuratRujukan((prev) => prev || (sptjmType === "gelar" ? "Pengakuan dan Penyematan Gelar Pendidikan Terakhir PNS" : "Usul Pensiun BUP, J/D /KPP"));
    const u = new URL(window.location.href);
    if (u.searchParams.get("type") !== sptjmType) {
      u.searchParams.set("type", sptjmType);
      window.history.replaceState({}, "", u.toString());
    }
  }, [sptjmType]);

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

  // Atas Nama list for pensiun type
  const [atasNama, setAtasNama] = React.useState<Personnel[]>([]);
  // Dropdown letters state
  type LetterOption = { id: string; label: string; nomor: string; tanggal: string; perihal?: string };
  const [letterOptions, setLetterOptions] = React.useState<LetterOption[]>([]);
  const [selectedLetterId, setSelectedLetterId] = React.useState<string>("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const type = sptjmType === 'gelar' ? 'pengantar_gelar' as const : 'pengantar_pensiun' as const
        const items = await listLettersByType(type)
        if (cancelled) return
        setLetterOptions(items.map(l => ({ id: l.id, label: `${l.nomorSurat} — ${l.tanggalSurat}`, nomor: l.nomorSurat, tanggal: l.tanggalSurat, perihal: undefined })))
      } catch {
        setLetterOptions([])
      }
    }
    load()
    return () => { cancelled = true }
  }, [sptjmType])

  const handleSelectLetter = (id: string) => {
    setSelectedLetterId(id)
    const found = letterOptions.find(o => o.id === id)
    if (found) {
      setNomorSuratRujukan(found.nomor)
      // backend uses yyyy-mm-dd; keep as is for our renderer
      setTanggalSuratRujukanInput(found.tanggal)
      if (!perihalSuratRujukan) setPerihalSuratRujukan(sptjmType === 'gelar' ? 'Pengakuan dan Penyematan Gelar Pendidikan Terakhir PNS' : 'Usul Pensiun BUP, J/D /KPP')
    }
  }

  const validate = React.useCallback(() => {
    const next: Record<string, string> = {}
    if (!nomorSurat || !/^\d+(?:\.\d+)*$/.test(nomorSurat)) next.nomorSurat = 'Nomor hanya angka & titik'
    if (!pejabat) next.pejabat = 'Pejabat wajib dipilih'
    if (!selectedLetterId || !nomorSuratRujukan) next.ref = 'Pilih surat pengantar'
    if (!tanggalInput) next.tanggalInput = 'Tanggal SPTJM wajib diisi'
    else {
      const d = new Date(tanggalInput)
      if (isNaN(d.getTime())) next.tanggalInput = 'Tanggal tidak valid'
    }
    if (sptjmType === 'pensiun' && atasNama.length < 1) next.atasNama = 'Minimal 1 nama pada Atas Nama'
    return next
  }, [nomorSurat, pejabat, selectedLetterId, nomorSuratRujukan, tanggalInput, sptjmType, atasNama.length])

  const canPrint = React.useMemo(() => Object.keys(validate()).length === 0, [validate])

  const finalNomorSurat = React.useMemo(() => {
    const parts = (tanggalInput || "").split("-");
    const mm = parts.length === 3 ? String(parseInt(parts[1] || "", 10)).padStart(2, "0") : "";
    const yyyy = parts.length === 3 ? parts[0] : "";
    const nomorOnly = (nomorSurat || "").replace(/[^0-9.]/g, "");
    const segments: string[] = [];
    if (sptjmType === "pensiun") {
      const head = nomorOnly ? `B-${nomorOnly}` : "B-";
      segments.push(head, "Kw.18.1", "2", "Kp.09");
    } else {
      if (nomorOnly) segments.push(nomorOnly);
      segments.push("Kw.18.01", "Kp.01.1");
    }
    if (mm) segments.push(mm);
    if (yyyy) segments.push(yyyy);
    return segments.join("/");
  }, [nomorSurat, tanggalInput, sptjmType]);

  const handlePrint = () => {
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length > 0) {
      const firstKey = Object.keys(v)[0]
      const el = document.getElementById(`field-${firstKey}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
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

  const [printModalOpen, setPrintModalOpen] = React.useState<boolean>(false);
  const [errorModalOpen, setErrorModalOpen] = React.useState<boolean>(false);
  const [saving, setSaving] = React.useState<boolean>(false);

  const handleSave = async () => {
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length > 0) {
      const firstKey = Object.keys(v)[0]
      const el = document.getElementById(`field-${firstKey}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const payload: any = {
      id: "",
      nomorSurat: finalNomorSurat,
      tanggalSurat: (tanggalInput || new Date().toISOString().slice(0,10)),
      namaPegawai: atasNama.length > 0 ? atasNama[0].name || "" : "",
      nipPegawai: atasNama.length > 0 ? atasNama[0].nip || "" : "",
      posisiPegawai: atasNama.length > 0 ? atasNama[0].position || "" : "",
      unitPegawai: atasNama.length > 0 ? atasNama[0].unit || "" : "",
      namaPenandatangan: pejabat?.name || "",
      nipPenandatangan: pejabat?.nip || "",
      jabatanPenandatangan: pejabat?.position || "",
      signaturePlace: tempat,
      signatureDateInput: (tanggalInput || new Date().toISOString().slice(0,10)),
      signatureMode: "manual",
      signatureAnchor: "^",
      type: sptjmType === "gelar" ? "sptjm_gelar" : "sptjm_pensiun",
      perihal: sptjmType === "gelar" ? "Surat Pernyataan Tanggung Jawab Mutlak Gelar" : "Surat Pernyataan Tanggung Jawab Mutlak Pensiun",
      nomorSuratRujukan: nomorSuratRujukan,
      tanggalSuratRujukan: tanggalSuratRujukanInput,
      perihalSuratRujukan: perihalSuratRujukan,
      pegawaiData: atasNama.map(p => ({
        name: p.name,
        nip: p.nip,
        position: p.position,
        unit: p.unit,
        golongan: p.golongan
      })),
    }
    
    try {
      setSaving(true)
      // Save directly to database
      await saveLetterService(payload)
      setPrintModalOpen(true)
    } catch (e) {
      console.error('Failed to save letter:', e)
      setErrorModalOpen(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="mb-4 flex items-center gap-3">
          <Button variant="ghost" onClick={() => window.history.back()} className="px-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold">SPTJM</div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Surat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipe SPTJM</Label>
                  <Select value={sptjmType} onValueChange={(v: any) => setSptjmType(v)}>
                    <SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gelar">Pengantar Gelar</SelectItem>
                      <SelectItem value="pensiun">Pengantar Pensiun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nomor (hanya angka & titik)</Label>
                  <Input id="field-nomorSurat" value={nomorSurat} onChange={(e) => setNomorSurat(e.target.value.replace(/[^0-9.]/g, ""))} />
                  {errors.nomorSurat && <div className="text-sm text-destructive mt-1">{errors.nomorSurat}</div>}
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Pejabat Penandatangan</Label>
                  <div id="field-pejabat"><PejabatSelector value={pejabat} onChange={(v) => { setPejabat(v); setErrors((s) => ({ ...s, pejabat: v ? '' : s.pejabat })) }} /></div>
                  {errors.pejabat && <div className="text-sm text-destructive">{errors.pejabat}</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Pilih Surat Pengantar</Label>
                  <Select value={selectedLetterId} onValueChange={handleSelectLetter}>
                    <SelectTrigger><SelectValue placeholder={letterOptions.length ? "Pilih salah satu" : "Tidak ada data"} /></SelectTrigger>
                    <SelectContent>
                      {letterOptions.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.ref && <div className="text-sm text-destructive">{errors.ref}</div>}
                </div>
                <div className="space-y-2">
                  <Label>Nomor Surat Rujukan</Label>
                  <Input value={nomorSuratRujukan} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Surat Rujukan</Label>
                  <Input type="date" value={tanggalSuratRujukanInput} readOnly />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Perihal Surat Rujukan</Label>
                  <Input value={perihalSuratRujukan} onChange={(e) => setPerihalSuratRujukan(e.target.value)} />
                </div>
              </div>

              {sptjmType === "pensiun" && (
                <div className="space-y-3">
                  <Label>Atas Nama</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PegawaiSelector value={null} onChange={(p) => {
                      if (!p) return;
                      setAtasNama((prev) => prev.find((x) => x.nip === p.nip) ? prev : [...prev, p]);
                    }} />
                  </div>
                  {atasNama.length > 0 && (
                    <div className="border rounded bg-background text-foreground">
                      <div className="px-4 py-2 font-semibold">Daftar</div>
                      <div className="p-4">
                        <div className="space-y-2">
                          {atasNama.map((p, i) => {
                            const nipKey = (p.nip || "").replace(/\D+/g, "");
                            return (
                              <div key={nipKey} className="flex items-start justify-between gap-3 border-b py-2">
                                <div>
                                  {i + 1}. {p.name} — NIP. {nipKey}
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setAtasNama((prev) => prev.filter((x) => (x.nip || "").replace(/\D+/g, "") !== nipKey))}>Hapus</Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  {errors.atasNama && <div className="text-sm text-destructive">{errors.atasNama}</div>}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tempat</Label>
                  <Input value={tempat} onChange={(e) => setTempat(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input id="field-tanggalInput" type="date" value={tanggalInput} onChange={(e) => setTanggalInput(e.target.value)} />
                  {errors.tanggalInput && <div className="text-sm text-destructive">{errors.tanggalInput}</div>}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => window.history.back()}>Batal</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
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
                    {sptjmType === "gelar" ? (
                      <SPTJMTemplateGelar
                        logoUrl="/logo-kemenag.png"
                        nomorSurat={finalNomorSurat}
                        namaPenandatangan={pejabat?.name || ""}
                        nipPenandatangan={pejabat?.nip || ""}
                        jabatanPenandatangan={pejabat?.position || ""}
                        nomorSuratRujukan={nomorSuratRujukan}
                        tanggalSuratRujukanText={tanggalSuratRujukanText}
                        perihalSuratRujukan={perihalSuratRujukan || "Pengakuan dan Penyematan Gelar Pendidikan Terakhir PNS"}
                        tempat={tempat}
                        tanggalText={tanggalText}
                      />
                    ) : (
                      <SPTJMTemplatePensiun
                        logoUrl="/logo-kemenag.png"
                        nomorSurat={finalNomorSurat}
                        namaPenandatangan={pejabat?.name || ""}
                        nipPenandatangan={pejabat?.nip || ""}
                        jabatanPenandatangan={pejabat?.position || ""}
                        nomorSuratRujukan={nomorSuratRujukan}
                        tanggalSuratRujukanText={tanggalSuratRujukanText}
                        perihalSuratRujukan={perihalSuratRujukan || "Usul Pensiun BUP, J/D /KPP"}
                        atasNama={atasNama.map(p => ({ nama: p.name, nip: p.nip }))}
                        tempat={tempat}
                        tanggalText={tanggalText}
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={printModalOpen} onOpenChange={(o) => {
        setPrintModalOpen(o)
      }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              Data surat berhasil disimpan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setPrintModalOpen(false)}>Tutup</Button>
              <Button onClick={() => {
                handlePrint();
                setPrintModalOpen(false);
                window.location.href = "/generate-surat";
              }}>Print / Download PDF</Button>
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
            <p className="text-sm text-muted-foreground">Terjadi kesalahan saat menyimpan ke server. Silakan coba lagi.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setErrorModalOpen(false)}>Tutup</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}


