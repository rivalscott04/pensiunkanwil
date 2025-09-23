import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getLetter, StoredLetter } from "@/lib/letters";
import { saveLetterService, getLetterById } from "@/lib/letters-service";
import { Separator } from "@/components/ui/separator";
import { KemenagDocumentTemplate, KemenagTemplateProps } from "@/components/pension/KemenagDocumentTemplate";
import { PegawaiSelector, PejabatSelector, Personnel } from "@/components/pension/personnel-selectors";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { printFromContent } from "@/lib/print-helper";

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
    const base = `${window.location.origin}`;
    const documentNumberPage = documentNumberPage1;
    
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
              <div class="data-row"><div class="data-label">Nama</div><div class="data-colon">:</div><div class="data-value">${pejabat?.name || ""}</div></div>
              <div class="data-row"><div class="data-label">Nip</div><div class="data-colon">:</div><div class="data-value">${(pejabat?.nip || "").replace(/\D+/g, "")}</div></div>
              <div class="data-row"><div class="data-label">Pangkat/Golongan Ruang</div><div class="data-colon">:</div><div class="data-value">${pejabat?.golongan || ""}</div></div>
              <div class="data-row"><div class="data-label">Jabatan</div><div class="data-colon">:</div><div class="data-value">${pejabat?.position || ""}</div></div>
            </div>

            <div class="subject-info" style="margin-top: 20px;">
              <p>Dengan ini menyatakan dengan sesungguhnya, bahwa Pegawai Negeri Sipil :</p>
              <div class="data-row"><div class="data-label">Nama</div><div class="data-colon">:</div><div class="data-value">${pegawai?.name || ""}</div></div>
              <div class="data-row"><div class="data-label">Nip</div><div class="data-colon">:</div><div class="data-value">${(pegawai?.nip || "").replace(/\D+/g, "")}</div></div>
              <div class="data-row"><div class="data-label">Pangkat/Golongan Ruang</div><div class="data-colon">:</div><div class="data-value">${pegawai?.golongan || ""}</div></div>
              <div class="data-row"><div class="data-label">Jabatan</div><div class="data-colon">:</div><div class="data-value">${pegawai?.position || ""}</div></div>
              <div class="data-row"><div class="data-label">Instansi</div><div class="data-colon">:</div><div class="data-value">${pegawai?.unit || ""}</div></div>
            </div>

            <div class="statement-text">
              <p>dalam 1 ( satu ) tahun terakhir tidak pernah dijatuhi hukuman disiplin tingkat sedang/berat.</p>
            </div>

            <div class="statement-text">
              <p>Demikian Surat Pernyataan ini saya buat dengan sesungguhnya dengan mengingat sumpah jabatan dan apabila dikemudian hari ternyata isi surat pernyataan ini tidak benar yang mengakibatkan kerugian bagi negara, maka saya bersedia menanggung kerugian tersebut.</p>
            </div>

            <div class="signature-section">
              <div class="signature-inner">
                <div class="signature-date">${signaturePlace}${signaturePlace && renderSignatureDate ? ", " : ""}${renderSignatureDate}</div>
                <div class="signature-title">KEPALA</div>
                ${signatureMode === "tte" ? `<div class="signature-anchor">${signatureAnchor}</div>` : ""}
                <div class="signature-name">${pejabat?.name || ""}</div>
                <div class="signature-nip">NIP. ${(pejabat?.nip || "").replace(/\D+/g, "")}</div>
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
              <div class="data-row"><div class="data-label">Nama</div><div class="data-colon">:</div><div class="data-value">${pejabat?.name || ""}</div></div>
              <div class="data-row"><div class="data-label">Nip</div><div class="data-colon">:</div><div class="data-value">${(pejabat?.nip || "").replace(/\D+/g, "")}</div></div>
              <div class="data-row"><div class="data-label">Pangkat/Golongan Ruang</div><div class="data-colon">:</div><div class="data-value">${pejabat?.golongan || ""}</div></div>
              <div class="data-row"><div class="data-label">Jabatan</div><div class="data-colon">:</div><div class="data-value">${pejabat?.position || ""}</div></div>
            </div>

            <div class="subject-info" style="margin-top: 20px;">
              <p>Dengan ini menyatakan dengan sesungguhnya, bahwa Pegawai Negeri Sipil :</p>
              <div class="data-row"><div class="data-label">Nama</div><div class="data-colon">:</div><div class="data-value">${pegawai?.name || ""}</div></div>
              <div class="data-row"><div class="data-label">Nip</div><div class="data-colon">:</div><div class="data-value">${(pegawai?.nip || "").replace(/\D+/g, "")}</div></div>
              <div class="data-row"><div class="data-label">Pangkat/Golongan Ruang</div><div class="data-colon">:</div><div class="data-value">${pegawai?.golongan || ""}</div></div>
              <div class="data-row"><div class="data-label">Jabatan</div><div class="data-colon">:</div><div class="data-value">${pegawai?.position || ""}</div></div>
              <div class="data-row"><div class="data-label">Instansi</div><div class="data-colon">:</div><div class="data-value">${pegawai?.unit || ""}</div></div>
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
                <div class="signature-date">${signaturePlace}${signaturePlace && renderSignatureDate ? ", " : ""}${renderSignatureDate}</div>
                <div class="signature-title">KEPALA</div>
                ${signatureMode === "tte" ? `<div class="signature-anchor">${signatureAnchor}</div>` : ""}
                <div class="signature-name">${pejabat?.name || ""}</div>
                <div class="signature-nip">NIP. ${(pejabat?.nip || "").replace(/\D+/g, "")}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
    
    printFromContent(printContent, "Surat Hukuman Disiplin - Print");
  };

  React.useEffect(() => {
    const id = reprintId || editId
    if (id) {
      const loadLetterData = async () => {
        try {
          const stored = await getLetterById(id);
          if (stored) {
            setDocumentSequence(stored.nomorSurat.split("/")[0].replace("B-", ""));
            const parts = stored.nomorSurat.split("/");
            setDocumentMonth(parts[parts.length - 2] || "");
            setDocumentYear(parts[parts.length - 1] || "");
            setSignaturePlace(stored.signaturePlace);
            setSignatureDateInput(stored.signatureDateInput);
            setSignatureMode(stored.signatureMode);
            setSignatureAnchor(stored.signatureAnchor);
            
            // Load pejabat and pegawai data
            if (stored.namaPenandatangan) {
              setPejabat({
                id: stored.id || "",
                name: stored.namaPenandatangan,
                nip: stored.nipPenandatangan || "",
                position: stored.jabatanPenandatangan || "",
                golongan: (stored as any).golonganPenandatangan || ""
              });
            }
            if (stored.namaPegawai) {
              setPegawai({
                id: stored.id || "",
                name: stored.namaPegawai,
                nip: stored.nipPegawai || "",
                position: stored.posisiPegawai || "",
                unit: stored.unitPegawai || "",
                golongan: (stored as any).golonganPegawai || ""
              });
            }
          }
        } catch (error) {
          console.error('Failed to load letter data:', error);
        }
      };
      
      loadLetterData();
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
    const payload = { 
      ...(letter as any), 
      type: 'hukuman_disiplin',
      golonganPenandatangan: pejabat?.golongan,
      golonganPegawai: pegawai?.golongan
    } as any;
    try {
      setSaving(true)
      // Save directly to database
      await saveLetterService(editId ? (payload as any) : { ...(payload as any), id: "" as unknown as string })
      setPrintModalOpen(true)
    } catch (e) {
      console.error('Failed to save letter:', e)
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
                    required
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
                    required
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
                    required
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
                    required
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
                    required
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


