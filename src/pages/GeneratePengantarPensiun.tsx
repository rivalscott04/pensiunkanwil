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
import { PengantarPensiunTemplate, PengantarPensiunRow } from "@/components/pension/PengantarPensiunTemplate";
import { saveLetterService, getLetterById } from "@/lib/letters-service";

export default function GeneratePengantarPensiun() {
  const url = new URL(window.location.href);
  const editId = url.searchParams.get("edit") ? decodeURIComponent(url.searchParams.get("edit")!) : null;
  const reprintId = url.searchParams.get("reprint");
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
  const [addresseeJabatan, setAddresseeJabatan] = React.useState("Sekretaris Jenderal Kementerian Agama RI");
  const [addresseeKota, setAddresseeKota] = React.useState("Jakarta");

  const addPegawai = (p: Personnel | null) => {
    if (!p) return;
    setPegawaiList((prev) => {
      if (prev.find((x) => x.nip === p.nip)) return prev;
      return [...prev, p];
    });
    
    // Auto-fill golongan and jabatan from API data
    const nipKey = (p.nip || "").replace(/\D+/g, "");
    setRowExtras((prev) => ({
      ...prev,
      [nipKey]: {
        gol: p.golongan || prev[nipKey]?.gol || "",
        job: p.position || prev[nipKey]?.job || "",
        ket: prev[nipKey]?.ket || "",
      }
    }));
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

  const addresseeText = React.useMemo(() => {
    return `${addresseeJabatan}<br />${addresseeKota}`;
  }, [addresseeJabatan, addresseeKota]);

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
    printFromElement("pengantar-pensiun-print-area", "Pengantar Pensiun - Print");
  };

  const [printModalOpen, setPrintModalOpen] = React.useState<boolean>(false);
  const [errorModalOpen, setErrorModalOpen] = React.useState<boolean>(false);
  const [saving, setSaving] = React.useState<boolean>(false);

  // Prefill when editing or reprint existing letter
  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      const id = reprintId || editId
      if (!id) return
      try {
        const letter = await getLetterById(id)
        if (cancelled || !letter) return
        // Basic fields
        setNomorSurat((letter.nomorSurat || "").split("/")[0] || "")
        setTanggalSuratInput(letter.tanggalSurat || letter.signatureDateInput || "")
        setTempat(letter.signaturePlace || "Mataram")
        setSignatureMode((letter.signatureMode as any) || "manual")
        setSignatureAnchor((letter.signatureAnchor as any) || "^")
        setAddresseeJabatan((letter as any).addresseeJabatan || "Sekretaris Jenderal Kementerian Agama RI")
        setAddresseeKota((letter as any).addresseeKota || "Jakarta")
        // Pejabat
        setPejabat({
          name: letter.namaPenandatangan || "",
          nip: letter.nipPenandatangan || "",
          position: letter.jabatanPenandatangan || "",
          unit: "",
          golongan: (letter as any).golonganPenandatangan,
        } as any)
        // Pegawai list and extras (support many rows)
        const arr: any[] = (letter as any).pegawaiData || []
        const nextPegawai: Personnel[] = arr.map((r: any, idx: number) => ({
          id: String(r.id ?? r.nip ?? idx + 1),
          name: r.name || r.nama || "",
          nip: r.nip || "",
          position: r.position || r.jabatan || "",
          unit: r.unit || "",
          golongan: r.golongan || r.gol || "",
        }))
        setPegawaiList(nextPegawai)
        const extras: Record<string, { gol: string; job: string; ket: string }> = {}
        arr.forEach((r: any) => {
          const nipKey = String(r.nip || "").replace(/\D+/g, "")
          extras[nipKey] = {
            gol: r.golongan ?? r.gol ?? "",
            job: r.jabatanTempatTugas ?? r.job ?? r.position ?? "",
            ket: r.keterangan ?? r.ket ?? "",
          }
        })
        setRowExtras(extras)
        if (reprintId) setTimeout(() => handlePrint(), 0)
      } catch (e) {
        // ignore
      }
    }
    load()
    return () => { cancelled = true }
  }, [editId, reprintId])

  const handleSave = async () => {
    const payload: any = {
      id: (reprintId || editId) || "",
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
      type: "pengantar_pensiun",
      perihal: "Usul Pensiun BUP, J/D /KPP",
      addresseeJabatan: addresseeJabatan,
      addresseeKota: addresseeKota,
      pegawaiData: pegawaiList.map(p => ({
        name: p.name,
        nip: p.nip,
        position: p.position,
        unit: p.unit,
        golongan: p.golongan,
        ...rowExtras[(p.nip || "").replace(/\D+/g, "")]
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

              {/* Addressee Section with Best Practice UI/UX */}
              <div className="border-t pt-4">
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-foreground">Penerima Surat</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: Kepada Yth.<br />[Jabatan/Instansi]<br />[Kota/Tempat]
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
                      placeholder="Contoh: Sekretaris Jenderal Kementerian Agama RI"
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
                    <strong>Kepada Yth.</strong><br />
                    {addresseeJabatan || "[Jabatan/Instansi]"}<br />
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
                                <Input 
                                  value={rowExtras[nipKey]?.gol || ""} 
                                  onChange={(e) => setExtra(nipKey, "gol", e.target.value)} 
                                  placeholder="IV/a"
                                  className="text-center"
                                />
                              </td>
                              <td className="p-2 align-top">
                                <Input 
                                  value={rowExtras[nipKey]?.job || ""} 
                                  onChange={(e) => setExtra(nipKey, "job", e.target.value)} 
                                  placeholder="Jabatan/Tempat Tugas"
                                />
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
                  <div id="pengantar-pensiun-print-area">
                    <PengantarPensiunTemplate
                      logoUrl="/logo-kemenag.png"
                      nomorSurat={finalNomorSurat}
                      lampiran={lampiran}
                      tanggalSuratText={renderTanggalSurat}
                      addresseeText={addresseeText}
                      tempatTanggalText={tempatTanggalText}
                      rows={rows}
                      signatureMode={signatureMode}
                      signatureAnchor={signatureAnchor}
                      penandatanganNama={pejabat?.name || ""}
                      penandatanganNip={pejabat?.nip || ""}
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


