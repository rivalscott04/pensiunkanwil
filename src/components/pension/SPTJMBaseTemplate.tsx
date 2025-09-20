import * as React from "react";

export type SPTJMBaseProps = {
  logoUrl?: string;
  nomorSurat?: string;
  namaPenandatangan?: string;
  nipPenandatangan?: string;
  jabatanPenandatangan?: string;
  tempat?: string;
  tanggalText?: string;
  signatureMode?: "manual" | "tte";
  signatureAnchor?: "^" | "$" | "#";
  children?: React.ReactNode; // body content
};

export const SPTJMBaseTemplate: React.FC<SPTJMBaseProps> = (props) => {
  const {
    logoUrl = "",
    nomorSurat = "",
    namaPenandatangan = "",
    nipPenandatangan = "",
    jabatanPenandatangan = "",
    tempat = "",
    tanggalText = "",
    signatureMode = "manual",
    signatureAnchor = "^",
    children,
  } = props;

  const resolvedLogoUrl = React.useMemo(() => {
    if (!logoUrl) return "";
    try { return new URL(logoUrl, window.location.origin).toString(); } catch { return logoUrl; }
  }, [logoUrl]);

  const formatNip = React.useCallback((nip?: string) => (nip || "").replace(/\D+/g, ""), []);

  return (
    <div className="w-full bg-white text-black">
      <style>{`
        @page { size: auto; margin: 0; }
        @media print { body { -webkit-print-color-adjust: exact; } }
        .sheet { padding: 1.5cm 2cm; page-break-after: always; }
        .sheet:last-child { page-break-after: auto; }
        .header { margin-bottom: 20px; padding-bottom: 12px; border-bottom: 3px solid black; overflow: hidden; }
        .logo { float: left; width: 100px; height: 100px; margin-right: 15px; object-fit: contain; }
        .header-text { font-size: 13pt; font-weight: bold; line-height: 1.2; text-align: center; }
        .header-info { font-size: 11pt; line-height: 1.1; text-align: center; margin-top: 5px; }
        .document-title { text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 10px; text-decoration: underline; }
        .document-number { text-align: center; margin-bottom: 25px; }
        .content { text-align: justify; line-height: 1.6; margin-bottom: 20px; }
        .content p { margin-bottom: 15px; }
        .identity-section { margin-bottom: 25px; }
        .identity-row { display: flex; margin-bottom: 8px; align-items: flex-start; }
        .identity-label { width: 80px; flex-shrink: 0; }
        .identity-colon { width: 20px; flex-shrink: 0; }
        .identity-value { flex-grow: 1; }
        .signature-section { margin-top: 40px; display: flex; justify-content: flex-end; }
        .signature-block { text-align: center; min-width: 250px; }
        .signature-date { margin-bottom: 10px; }
        .signature-title { margin-bottom: 60px; }
        .signature-name { font-weight: bold; text-decoration: underline; }
      `}</style>

      <section className="sheet">
        <div className="header">
          {resolvedLogoUrl ? (<img src={resolvedLogoUrl} alt="Logo Kementerian Agama" className="logo" />) : (<div className="logo" />)}
          <div className="header-text">
            KEMENTERIAN AGAMA REPUBLIK INDONESIA<br />
            KANTOR WILAYAH KEMENTERIAN AGAMA<br />
            PROVINSI NUSA TENGGARA BARAT
          </div>
          <div className="header-info">
            Jalan Udayana No. 6 Tlp. 633040 Fax ( 0370 ) 622317 Mataram<br />
            Website: http:/ntb.kemenag.go.id email: updepagntb@gmail.com
          </div>
        </div>

        <div className="document-title">SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK</div>
        <div className="document-number">Nomor : {nomorSurat}</div>

        <div className="content">
          <p>Yang bertanda tangan di bawah ini:</p>
        </div>

        <div className="identity-section">
          <div className="identity-row"><div className="identity-label">Nama</div><div className="identity-colon">:</div><div className="identity-value">{namaPenandatangan}</div></div>
          <div className="identity-row"><div className="identity-label">NIP.</div><div className="identity-colon">:</div><div className="identity-value">{formatNip(nipPenandatangan)}</div></div>
          <div className="identity-row"><div className="identity-label">Jabatan</div><div className="identity-colon">:</div><div className="identity-value">{jabatanPenandatangan}</div></div>
        </div>

        <div className="content">
          {children}
        </div>

        <div className="signature-section">
          <div className="signature-block">
            <div className="signature-date">{tempat}{tempat && tanggalText ? ", " : ""}{tanggalText}</div>
            <div className="signature-title">Yang Membuat Pernyataan,</div>
            <div className="signature-name">{namaPenandatangan}</div>
          </div>
        </div>
      </section>
    </div>
  );
};


