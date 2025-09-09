import * as React from "react";

export type SuratKeteranganMeninggalProps = {
  logoUrl?: string;
  documentNumber?: string;
  // Pembuat/penandatangan (pejabat)
  signatoryName?: string;
  signatoryNip?: string;
  signatoryPosition?: string;
  signatoryUnit?: string;
  signatoryAgency?: string;
  // Almarhum (pegawai)
  subjectName?: string;
  subjectNip?: string;
  subjectPosition?: string;
  subjectUnit?: string;
  subjectAgency?: string;
  // Dasar dan tanggal meninggal
  dasarSurat?: string; // misal: Surat Keterangan Rumah Sakit ...
  tanggalMeninggal?: string; // yyyy-mm-dd (akan diformat)
  // TTE & tanda tangan
  signaturePlace?: string;
  signatureDate?: string; // dd MMMM yyyy (sudah diformat dari input date)
  signatureMode?: "manual" | "tte";
  signatureAnchor?: "^" | "$" | "#";
};

export const SuratKeteranganMeninggalTemplate: React.FC<SuratKeteranganMeninggalProps> = (props) => {
  const {
    logoUrl = "/logo-kemenag.png",
    documentNumber = "",
    signatoryName = "",
    signatoryNip = "",
    signatoryPosition = "",
    signatoryUnit = "",
    signatoryAgency = "",
    subjectName = "",
    subjectNip = "",
    subjectPosition = "",
    subjectUnit = "",
    subjectAgency = "",
    dasarSurat = "",
    tanggalMeninggal = "",
    signaturePlace = "",
    signatureDate = "",
    signatureMode = "manual",
    signatureAnchor = "^",
  } = props;

  const resolvedLogoUrl = React.useMemo(() => {
    if (!logoUrl) return "";
    try {
      const u = new URL(logoUrl, window.location.origin);
      return u.toString();
    } catch {
      return logoUrl;
    }
  }, [logoUrl]);

  const formatNip = React.useCallback((nip?: string) => (nip || "").replace(/\D+/g, ""), []);

  const formatTanggalMeninggal = React.useMemo(() => {
    if (!tanggalMeninggal) return "";
    const parts = tanggalMeninggal.split("-");
    if (parts.length !== 3) return tanggalMeninggal;
    const yyyy = parts[0];
    const mm = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    const monthName = months[(mm - 1) % 12] || "";
    return `${d} ${monthName} ${yyyy}`;
  }, [tanggalMeninggal]);

  return (
    <div className="w-full bg-white text-black">
      <style>{`
        @page { size: A4; margin: 0; }
        @media print { body { -webkit-print-color-adjust: exact; } }
        .sheet { padding: 1.5cm 2cm; page-break-after: always; }
        .sheet:last-child { page-break-after: auto; }
        .logo { width: 100px; height: 100px; object-fit: contain; }
        .document-title { text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 15px; text-decoration: underline; }
        .document-number { text-align: center; margin-bottom: 25px; }
        .content { text-align: justify; line-height: 1.6; margin-bottom: 20px; }
        .identity-section { margin-bottom: 25px; margin-left: 20px; }
        .identity-row { display: flex; margin-bottom: 8px; align-items: flex-start; }
        .identity-label { width: 150px; flex-shrink: 0; }
        .identity-colon { width: 20px; flex-shrink: 0; }
        .identity-value { flex-grow: 1; }
        .statement-content { text-align: justify; line-height: 1.6; margin-bottom: 25px; }
        .signature-section { margin-top: 40px; display: flex; justify-content: flex-end; }
        .signature-block { text-align: left; min-width: 300px; }
        .signature-date { margin-bottom: 3px; }
        .signature-title { margin-bottom: 28px; text-transform: uppercase; }
        .signature-anchor-line { text-align: left; margin: 3px 0 36px 20px; font-weight: bold; }
        .signature-name { font-weight: bold; text-decoration: underline; margin-bottom: 10px; }
        .signature-nip { font-size: 10pt; }
        .lampiran-header { text-align: left; margin-bottom: 20px; font-size: 11pt; margin-left: auto; width: fit-content; }
      `}</style>

      <section className="sheet">
        <div className="lampiran-header">
          LAMPIRAN<br />
          PERATURAN BADAN KEPEGAWAIAN NEGARA<br />
          REPUBLIK INDONESIA<br />
          NOMOR 3 TAHUN 2020<br />
          TENTANG<br />
          PETUNJUK TEHNIS PEMBERHENTIAN<br />
          PEGAWAI NEGERI SIPIL
        </div>

        <div className="document-title">SURAT KETERANGAN MENINGGAL DUNIA</div>
        <div className="document-number">Nomor : {documentNumber}</div>

        <div className="content"><p>Yang bertanda tangan dibawah ini :</p></div>

        <div className="identity-section">
          <div className="identity-row"><div className="identity-label">a. Nama</div><div className="identity-colon">:</div><div className="identity-value">{signatoryName}</div></div>
          <div className="identity-row"><div className="identity-label">b. Nip</div><div className="identity-colon">:</div><div className="identity-value">{formatNip(signatoryNip)}</div></div>
          <div className="identity-row"><div className="identity-label">c. Jabatan</div><div className="identity-colon">:</div><div className="identity-value">{signatoryPosition}</div></div>
          <div className="identity-row"><div className="identity-label">d. Unit Organisasi</div><div className="identity-colon">:</div><div className="identity-value">{signatoryUnit}</div></div>
          <div className="identity-row"><div className="identity-label">e. Nama Instansi</div><div className="identity-colon">:</div><div className="identity-value">Kementerian Agama</div></div>
        </div>

        <div className="content"><p>Menerangkan bahwa :</p></div>

        <div className="identity-section">
          <div className="identity-row"><div className="identity-label">a. Nama</div><div className="identity-colon">:</div><div className="identity-value">{subjectName}</div></div>
          <div className="identity-row"><div className="identity-label">b. Nip</div><div className="identity-colon">:</div><div className="identity-value">{formatNip(subjectNip)}</div></div>
          <div className="identity-row"><div className="identity-label">c. Jabatan</div><div className="identity-colon">:</div><div className="identity-value">{subjectPosition}</div></div>
          <div className="identity-row"><div className="identity-label">d. Unit Organisasi</div><div className="identity-colon">:</div><div className="identity-value">{subjectUnit}</div></div>
          <div className="identity-row"><div className="identity-label">e. Nama Instansi</div><div className="identity-colon">:</div><div className="identity-value">Kementerian Agama</div></div>
        </div>

        <div className="statement-content">
          <p>Berdasarkan {dasarSurat} Telah meninggal Dunia pada tanggal {formatTanggalMeninggal}</p>
          <p>Demikian keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
        </div>

        <div className="signature-section">
          <div className="signature-block">
            <div className="signature-date">{signaturePlace}{signaturePlace && signatureDate ? ", " : ""}{signatureDate}</div>
            <div className="signature-title">
              KEPALA KANTOR WILAYAH KEMENTERIAN AGAMA<br />
              PROVINSI NUSA TENGGARA BARAT,
            </div>
            <div className="signature-anchor-line" style={{ visibility: signatureMode === "tte" ? "visible" : "hidden" }}>{signatureAnchor}</div>
            <div className="signature-name">{signatoryName}</div>
            <div className="signature-nip">NIP. {formatNip(signatoryNip)}</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SuratKeteranganMeninggalTemplate;


