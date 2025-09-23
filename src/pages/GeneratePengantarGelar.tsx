import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { printFromElement } from "@/lib/print-helper";
import { PejabatSelector, PegawaiSelector, Personnel } from "@/components/pension/personnel-selectors";
import { PengantarPenyematanGelarTemplate, PengantarPenyematanGelarRow } from "@/components/pension/PengantarPenyematanGelarTemplate";
import { saveLetterService } from "@/lib/letters-service";

export default function GeneratePengantarGelar() {
  const url = new URL(window.location.href);
  const editId = url.searchParams.get("edit");

  const [pejabat, setPejabat] = React.useState<Personnel | null>(null);
  const [pegawaiList, setPegawaiList] = React.useState<Personnel[]>([]);

  // nomor: only digits and dot
  const [nomorSurat, setNomorSurat] = React.useState("");
  const [lampiran, setLampiran] = React.useState("-");
  const [tanggalSuratInput, setTanggalSuratInput] = React.useState<string>("");

  const [tempat, setTempat] = React.useState("Mataram");
  const [signatureMode, setSignatureMode] = React.useState<"manual" | "tte">("manual");
  const [signatureAnchor, setSignatureAnchor] = React.useState<"^" | "$" | "#">("^");

  // Addressee fields
  const [addresseeJabatan, setAddresseeJabatan] = React.useState("Biro SDM Kementerian Agama RI");
  const [addresseeKota, setAddresseeKota] = React.useState("Jakarta");

  // Row extra fields managed locally per selected pegawai
  const [rowExtras, setRowExtras] = React.useState<Record<string, { jabatan?: string; pendidikanLama: string; pendidikanTerakhir: string }>>({});

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

  const setExtra = (nip: string, field: "jabatan" | "pendidikanLama" | "pendidikanTerakhir", value: string) => {
    setRowExtras((prev) => ({
      ...prev,
      [nip]: {
        jabatan: prev[nip]?.jabatan || "",
        pendidikanLama: prev[nip]?.pendidikanLama || "",
        pendidikanTerakhir: prev[nip]?.pendidikanTerakhir || "",
        [field]: value,
      },
    }));
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

  const addresseeText = React.useMemo(() => {
    return `${addresseeJabatan}<br />${addresseeKota}`;
  }, [addresseeJabatan, addresseeKota]);

  const finalNomorSurat = React.useMemo(() => {
    const parts = (tanggalSuratInput || "").split("-");
    const mm = parts.length === 3 ? String(parseInt(parts[1] || "", 10)).padStart(2, "0") : "";
    const yyyy = parts.length === 3 ? parts[0] : "";
    const nomorOnly = (nomorSurat || "").replace(/[^0-9.]/g, "");
    const segments: string[] = [];
    if (nomorOnly) segments.push(nomorOnly);
    segments.push("Kw.18.01", "KP.01.1");
    if (mm) segments.push(mm);
    if (yyyy) segments.push(yyyy);
    return segments.join("/");
  }, [nomorSurat, tanggalSuratInput]);

  const rows: PengantarPenyematanGelarRow[] = React.useMemo(() => {
    return pegawaiList.map((p, idx) => {
      const nipKey = (p.nip || "").replace(/\D+/g, "");
      const extra = rowExtras[nipKey] || { jabatan: "", pendidikanLama: "", pendidikanTerakhir: "" };
      return {
        nomor: idx + 1,
        nama: p.name,
        nip: p.nip,
        jabatan: extra.jabatan || p.position || "",
        pendidikanLama: extra.pendidikanLama,
        pendidikanTerakhir: extra.pendidikanTerakhir,
      };
    });
  }, [pegawaiList, rowExtras]);

  const handlePrint = () => {
    printFromElement("pengantar-gelar-print-area", "Pengantar Gelar - Print");
  };

  const [printModalOpen, setPrintModalOpen] = React.useState<boolean>(false);
  const [errorModalOpen, setErrorModalOpen] = React.useState<boolean>(false);
  const [saving, setSaving] = React.useState<boolean>(false);

  const handleSave = async () => {
    const payload: any = {
      id: "",
      nomorSurat: finalNomorSurat,
      tanggalSurat: (tanggalSuratInput || new Date().toISOString().slice(0,10)),
      namaPegawai: pegawaiList[0]?.name || "",
      nipPegawai: pegawaiList[0]?.nip || "",
      posisiPegawai: pegawaiList[0]?.position || "",
      unitPegawai: pegawaiList[0]?.unit || "",
      namaPenandatangan: pejabat?.name || "",
      nipPenandatangan: pejabat?.nip || "",
      jabatanPenandatangan: pejabat?.position || "",
      signaturePlace: tempat,
      signatureDateInput: (tanggalSuratInput || new Date().toISOString().slice(0,10)),
      signatureMode,
      signatureAnchor: "^",
      type: "pengantar_gelar",
      perihal: "Pengakuan dan Penyematan Gelar Pendidikan Terakhir PNS",
      addresseeJabatan: addresseeJabatan,
      addresseeKota: addresseeKota,
      pegawaiData: pegawaiList.map(p => ({
        name: p.name,
        nip: p.nip,
        position: p.position,
        unit: p.unit,
        ...rowExtras[p.nip || ""]
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
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="mb-4 flex items-center gap-3">
          <Button variant="ghost" onClick={() => window.history.back()} className="px-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold">Pengantar Penyematan Gelar</div>
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
                  <Label>Tanda Tangan</Label>
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

              {/* Addressee Section with Best Practice UI/UX */}
              <div className="border-t pt-4">
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-foreground">Penerima Surat</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: Yth. [Jabatan/Instansi]<br />[Kota/Tempat]
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="addressee-jabatan">
                      Jabatan / Instansi <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="addressee-jabatan"
                      value={addresseeJabatan}
                      onChange={(e) => setAddresseeJabatan(e.target.value)}
                      placeholder="Contoh: Biro SDM Kementerian Agama RI"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Masukkan jabatan atau instansi penerima surat
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="addressee-kota">
                      Kota / Tempat <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="addressee-kota"
                      value={addresseeKota}
                      onChange={(e) => setAddresseeKota(e.target.value)}
                      placeholder="Contoh: Jakarta"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Masukkan kota atau tempat penerima surat
                    </p>
                  </div>
                </div>
                
                {/* Preview Addressee */}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Preview Penerima Surat:</p>
                  <div className="text-sm">
                    <strong>Yth. {addresseeJabatan || "[Jabatan/Instansi]"}</strong><br />
                    {addresseeKota || "[Kota/Tempat]"}
                  </div>
                </div>
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
                          <th className="text-left p-2">No</th>
                          <th className="text-left p-2">Nama / NIP</th>
                          <th className="text-left p-2">Jabatan</th>
                          <th className="text-left p-2">Pendidikan Lama</th>
                          <th className="text-left p-2">Pendidikan Terakhir</th>
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
                              <td className="p-2 align-top">
                                <Input
                                  value={rowExtras[nipKey]?.jabatan ?? p.position ?? ""}
                                  onChange={(e) => setExtra(nipKey, "jabatan", e.target.value)}
                                  placeholder="Jabatan"
                                />
                              </td>
                              <td className="p-2 align-top">
                                <Input
                                  value={rowExtras[nipKey]?.pendidikanLama || ""}
                                  onChange={(e) => setExtra(nipKey, "pendidikanLama", e.target.value)}
                                  placeholder="cth: S1 ..."
                                />
                              </td>
                              <td className="p-2 align-top">
                                <Input
                                  value={rowExtras[nipKey]?.pendidikanTerakhir || ""}
                                  onChange={(e) => setExtra(nipKey, "pendidikanTerakhir", e.target.value)}
                                  placeholder="cth: S2 ..."
                                />
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
                  <div id="pengantar-gelar-print-area">
                    <PengantarPenyematanGelarTemplate
                      logoUrl="/logo-kemenag.png"
                      nomorSurat={finalNomorSurat}
                      lampiran={lampiran}
                      tanggalSuratText={renderTanggalSurat}
                      addresseeText={addresseeText}
                      penandatanganJabatan={pejabat?.position || ""}
                      penandatanganNama={pejabat?.name || ""}
                      penandatanganNip={pejabat?.nip || ""}
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


