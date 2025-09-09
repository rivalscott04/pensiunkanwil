import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { PejabatSelector, PegawaiSelector, Personnel } from "@/components/pension/personnel-selectors";
import { PengantarPensiunTemplate, PengantarPensiunRow } from "@/components/pension/PengantarPensiunTemplate";

export default function GeneratePengantarPensiun() {
  const [pejabat, setPejabat] = React.useState<Personnel | null>(null);
  const [pegawaiList, setPegawaiList] = React.useState<Personnel[]>([]);

  // nomor: only digits and dot
  const [nomorSurat, setNomorSurat] = React.useState("");
  const [lampiran, setLampiran] = React.useState("-");
  const [tanggalSuratInput, setTanggalSuratInput] = React.useState<string>("");
  const [tempat, setTempat] = React.useState("Mataram");
  const [signatureMode, setSignatureMode] = React.useState<"manual" | "tte">("manual");
  const [signatureAnchor, setSignatureAnchor] = React.useState<"^" | "$" | "#">("^");

  const addPegawai = (p: Personnel | null) => {
    if (!p) return;
    setPegawaiList((prev) => {
      if (prev.find((x) => x.nip === p.nip)) return prev;
      return [...prev, p];
    });
  };

  const removePegawai = (nip?: string) => {
    const key = (nip || "").replace(/\D+/g, "");
    setPegawaiList((prev) => prev.filter((p) => (p.nip || "").replace(/\D+/g, "") !== key));
  };

  const [rowExtras, setRowExtras] = React.useState<Record<string, { gol: string; job: string; ket: string }>>({});
  const setExtra = (nip: string, field: "gol" | "job" | "ket", value: string) => {
    setRowExtras((prev) => ({ ...prev, [nip]: { gol: prev[nip]?.gol || "", job: prev[nip]?.job || "", ket: prev[nip]?.ket || "", [field]: value } }));
  };

  const renderTanggalSurat = React.useMemo(() => {
    if (!tanggalSuratInput) return "";
    const parts = tanggalSuratInput.split("-");
    if (parts.length !== 3) return "";
    const yyyy = parts[0];
    const mm = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    const monthName = months[(mm - 1) % 12] || "";
    return `${d} ${monthName} ${yyyy}`;
  }, [tanggalSuratInput]);

  const tempatTanggalText = React.useMemo(() => {
    const tgl = renderTanggalSurat;
    if (!tgl && !tempat) return "";
    if (!tgl) return tempat;
    if (!tempat) return tgl;
    return `${tempat}, ${tgl}`;
  }, [renderTanggalSurat, tempat]);

  const rows: PengantarPensiunRow[] = React.useMemo(() => {
    return pegawaiList.map((p, idx) => {
      const nipKey = (p.nip || "").replace(/\D+/g, "");
      const extra = rowExtras[nipKey] || { gol: "", job: "", ket: "" };
      return {
        nomor: idx + 1,
        nama: p.name,
        nip: p.nip,
        golongan: extra.gol,
        jabatanTempatTugas: extra.job,
        keterangan: extra.ket,
      };
    });
  }, [pegawaiList, rowExtras]);

  const finalNomorSurat = React.useMemo(() => {
    const parts = (tanggalSuratInput || "").split("-");
    const mm = parts.length === 3 ? String(parseInt(parts[1] || "", 10)).padStart(2, "0") : "";
    const yyyy = parts.length === 3 ? parts[0] : "";
    const nomorOnly = (nomorSurat || "").replace(/[^0-9.]/g, "");
    const segments: string[] = [];
    if (nomorOnly) segments.push(nomorOnly);
    segments.push("Kw.18.1", "2", "Kp.09");
    if (mm) segments.push(mm);
    if (yyyy) segments.push(yyyy);
    return segments.join("/");
  }, [nomorSurat, tanggalSuratInput]);

  const handlePrint = () => {
    const printContents = document.getElementById("pengantar-pensiun-print-area")?.innerHTML || "";
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
        await Promise.all(images.map((img) => img.complete && img.naturalWidth > 0 ? Promise.resolve() : new Promise<void>((resolve) => { img.onload = () => resolve(); img.onerror = () => resolve(); }))); }
      waitForImages().then(() => { win?.focus(); win?.print(); setTimeout(() => document.body.removeChild(frame), 1000); });
    } else { setTimeout(() => document.body.removeChild(frame), 1000); }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="mb-4 flex items-center gap-3">
          <Button variant="ghost" onClick={() => window.history.back()} className="px-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold">Pengantar Pensiun</div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Surat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nomor (hanya angka & titik)</Label>
                  <Input value={nomorSurat} onChange={(e) => setNomorSurat(e.target.value.replace(/[^0-9.]/g, ""))} />
                </div>
                <div>
                  <Label>Lampiran</Label>
                  <Input value={lampiran} onChange={(e) => setLampiran(e.target.value)} />
                </div>
                <div>
                  <Label>Tanggal Surat</Label>
                  <Input type="date" value={tanggalSuratInput} onChange={(e) => setTanggalSuratInput(e.target.value)} />
                </div>
                <div>
                  <Label>Tempat</Label>
                  <Input value={tempat} onChange={(e) => setTempat(e.target.value)} />
                </div>
                <div>
                  <Label>Jenis Tanda Tangan</Label>
                  <Select value={signatureMode} onValueChange={(v: any) => setSignatureMode(v)}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="tte">TTE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {signatureMode === "tte" && (
                  <div>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pejabat Penandatangan</Label>
                  <PejabatSelector value={pejabat} onChange={setPejabat} />
                </div>
                <div className="space-y-2">
                  <Label>Tambah Pegawai</Label>
                  <PegawaiSelector value={null} onChange={addPegawai} />
                </div>
              </div>

              {pegawaiList.length > 0 && (
                <div className="border rounded bg-background text-foreground">
                  <div className="px-4 py-2 font-semibold">Daftar Pegawai</div>
                  <div className="p-4 overflow-auto">
                    <table className="min-w-[800px] w-full text-sm text-foreground">
                      <thead>
                        <tr className="bg-muted text-foreground">
                          <th className="text-left p-2">No.</th>
                          <th className="text-left p-2">Nama / NIP</th>
                          <th className="text-left p-2">Gol</th>
                          <th className="text-left p-2">Jabatan/Tempat Tugas</th>
                          <th className="text-left p-2">Ket.</th>
                          <th className="text-left p-2">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pegawaiList.map((p, idx) => {
                          const nipKey = (p.nip || "").replace(/\D+/g, "");
                          return (
                            <tr key={nipKey} className="bg-card">
                              <td className="p-2 align-top w-12">{idx + 1}</td>
                              <td className="p-2 align-top">
                                <div className="font-semibold leading-tight">{p.name}</div>
                                <div className="text-xs text-muted-foreground">NIP. {nipKey}</div>
                              </td>
                              <td className="p-2 align-top w-24">
                                <Input value={rowExtras[nipKey]?.gol || ""} onChange={(e) => setExtra(nipKey, "gol", e.target.value)} placeholder="IV/a" />
                              </td>
                              <td className="p-2 align-top">
                                <Input value={rowExtras[nipKey]?.job || ""} onChange={(e) => setExtra(nipKey, "job", e.target.value)} placeholder="Guru ... di ..." />
                              </td>
                              <td className="p-2 align-top w-20">
                                <Input value={rowExtras[nipKey]?.ket || ""} onChange={(e) => setExtra(nipKey, "ket", e.target.value)} placeholder="BUP/J/D" />
                              </td>
                              <td className="p-2 align-top w-28">
                                <Button variant="outline" size="sm" onClick={() => removePegawai(p.nip)}>Hapus</Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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
                  <div id="pengantar-pensiun-print-area">
                    <PengantarPensiunTemplate
                      logoUrl="/logo-kemenag.png"
                      nomorSurat={finalNomorSurat}
                      lampiran={lampiran}
                      tanggalSuratText={renderTanggalSurat}
                      tempatTanggalText={tempatTanggalText}
                      rows={rows}
                      signatureMode={signatureMode}
                      signatureAnchor={signatureAnchor}
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


