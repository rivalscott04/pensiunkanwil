import * as React from "react";

export type PengantarPensiunRow = {
  nomor: number;
  nama: string;
  nip: string;
  golongan: string;
  jabatanTempatTugas: string;
  keterangan: string; // BUP/JD dll
};

export type PengantarPensiunProps = {
  logoUrl?: string;
  nomorSurat?: string;
  lampiran?: string;
  tanggalSuratText?: string;
  tempatTanggalText?: string;
  rows: PengantarPensiunRow[];
  signatureMode?: "manual" | "tte";
  signatureAnchor?: "^" | "$" | "#";
  penandatanganNama?: string;
  penandatanganNip?: string;
};

export const PengantarPensiunTemplate: React.FC<PengantarPensiunProps> = (props) => {
  const {
    logoUrl = "",
    nomorSurat = "",
    lampiran = "-",
    tanggalSuratText = "",
    tempatTanggalText = "",
    rows = [],
    signatureMode = "manual",
    signatureAnchor = "^",
    penandatanganNama = "",
    penandatanganNip = "",
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
        html, body { margin: 0; padding: 0; }
        @media print { body { -webkit-print-color-adjust: exact; margin: 0 !important; } }
        .sheet { padding: 1.5cm 2cm; page-break-after: always; }
        .sheet:last-child { page-break-after: auto; }
        .header { margin-bottom: 20px; padding-bottom: 12px; border-bottom: 3px solid black; overflow: hidden; }
        .logo { float: left; width: 100px; height: 100px; margin-right: 15px; object-fit: contain; }
        .header-text { font-size: 13pt; font-weight: bold; line-height: 1.2; text-align: center; }
        .header-info { font-size: 11pt; line-height: 1.1; text-align: center; margin-top: 5px; }
        .doc-header { display: flex; justify-content: space-between; margin-bottom: 25px; }
        .document-info { flex-grow: 1; }
        .info-row { display: flex; margin-bottom: 6px; align-items: flex-start; }
        .info-label { width: 80px; flex-shrink: 0; }
        .info-colon { width: 20px; flex-shrink: 0; }
        .info-value { flex-grow: 1; }
        .document-date { text-align: right; min-width: 150px; align-self: flex-start; }
        .addressee { margin-bottom: 16px; }
        .content { margin-bottom: 18px; text-align: justify; line-height: 1.6; }
        .content p { margin-bottom: 12px; }
        table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        th, td { border: 1px solid black; padding: 8px; text-align: left; vertical-align: top; font-size: 10pt; }
        th { font-weight: bold; text-align: center; }
        .number-col { width: 40px; text-align: center; }
        .name-col { width: 220px; }
        .gol-col { width: 80px; text-align: center; }
        .job-col { width: 260px; }
        .ket-col { width: 80px; text-align: center; }
        .signature-section { margin-top: 40px; display: flex; justify-content: flex-end; }
        .signature-block { text-align: left; min-width: 250px; }
        .signature-date { margin-bottom: 3px; color: black; }
        .signature-title { margin-bottom: 60px; color: black; }
        .signature-anchor { margin: 6px 0 24px 0; font-weight: bold; color: black; }
        .signature-name { font-weight: bold; margin-bottom: 5px; color: black; }
        .signature-nip { font-size: 10pt; color: black; }
        .data-table { page-break-inside: auto; }
        .data-table tr { page-break-inside: avoid; page-break-after: auto; }
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
            Jalan Udayana No. 6 Mataram Telp. (0370) 633040; Fax. (0370) 622317<br />
            Website: www.ntb.kemenag.go.id email: updepagntb@gmail.com
          </div>
        </div>

        <div className="content-wrapper">
          <div className="doc-header">
            <div className="document-info">
              <div className="info-row"><div className="info-label">Nomor</div><div className="info-colon">:</div><div className="info-value">{nomorSurat}</div></div>
              <div className="info-row"><div className="info-label">Lamp.</div><div className="info-colon">:</div><div className="info-value">{lampiran}</div></div>
              <div className="info-row"><div className="info-label">Perihal</div><div className="info-colon">:</div><div className="info-value">Usul Permohonan Pensiun sebagai PNS<br />An. {rows.length > 0 ? `${rows[0].nama} / ${formatNip(rows[0].nip)}${rows.length > 1 ? ' dkk' : ''}` : ''}</div></div>
            </div>
            <div className="document-date">{tanggalSuratText}</div>
          </div>

          <div className="addressee">
            <p>
              Kepada Yth.<br />
              Sekretaris Jenderal Kementerian Agama RI<br />
              Up. Kepala Biro SDM<br />
              Jakarta
            </p>
          </div>

          <div className="content">
            <p>Bersama ini disampaikan Permohonan Pensiun BUP/KPP dan Janda/Duda-KPP yang namanya tercantum dibawah ini dan mohon untuk mendapatkan penyelesaian sebagaimana mestinya</p>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th className="number-col">No.</th>
                <th className="name-col">Nama/Nip</th>
                <th className="gol-col">Gol</th>
                <th className="job-col">Jabatan/Tempat Tugas</th>
                <th className="ket-col">Ket.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.nomor}-${r.nip}`}>
                  <td className="number-col">{r.nomor}</td>
                  <td className="name-col">
                    <strong>{r.nama}</strong><br />
                    NIP. {formatNip(r.nip)}
                  </td>
                  <td className="gol-col">{r.golongan}</td>
                  <td className="job-col">{r.jabatanTempatTugas}</td>
                  <td className="ket-col">{r.keterangan}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="signature-section">
            <div className="signature-block">
              <div className="signature-date">{tempatTanggalText}</div>
              <div className="signature-title">Kepala,</div>
              {signatureMode === "tte" ? (<div className="signature-anchor">{signatureAnchor}</div>) : null}
              <div className="signature-name" style={{ color: 'black', fontWeight: 'bold' }}>
                {penandatanganNama || "Nama tidak tersedia"}
              </div>
              <div className="signature-nip" style={{ color: 'black' }}>
                NIP.{formatNip(penandatanganNip) || "NIP tidak tersedia"}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};


