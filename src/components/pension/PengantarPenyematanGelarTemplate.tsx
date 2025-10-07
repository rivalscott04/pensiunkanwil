import * as React from "react";

export type PengantarPenyematanGelarRow = {
  nomor: number;
  nama: string;
  nip: string;
  jabatan: string;
  pendidikanLama: string;
  pendidikanTerakhir: string;
};

export type PengantarPenyematanGelarProps = {
  logoUrl?: string;
  nomorSurat?: string;
  lampiran?: string;
  tanggalSuratText?: string; // e.g. "5 September 2025"
  addresseeText?: string; // e.g. "Sekretaris Jenderal Kementerian Agama RI<br />Cq. Kepala Biro Kepegawaian<br />Jakarta"
  penandatanganJabatan?: string;
  penandatanganNama?: string;
  penandatanganNip?: string;
  tempatTanggalText?: string; // e.g. "Mataram, 5 September 2025"
  rows: PengantarPenyematanGelarRow[];
  signatureMode?: "manual" | "tte";
  signatureAnchor?: "^" | "$" | "#";
};

export const PengantarPenyematanGelarTemplate: React.FC<PengantarPenyematanGelarProps> = (props) => {
  const {
    logoUrl = "",
    nomorSurat = "",
    lampiran = "-",
    tanggalSuratText = "",
    addresseeText = "Sekretaris Jenderal Kementerian Agama RI<br />Cq. Kepala Biro Kepegawaian<br />Jakarta",
    penandatanganJabatan = "",
    penandatanganNama = "",
    penandatanganNip = "",
    tempatTanggalText = "",
    rows = [],
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

  return (
    <div className="w-full bg-white text-black">
      <style>{`
        @page { 
          size: A4; 
          margin: 2cm 1.5cm 2cm 1.5cm; 
        }
        @page :first { 
          margin-top: 1.5cm; 
        }
        @page :left { 
          margin-top: 2.5cm; 
        }
        @page :right { 
          margin-top: 2.5cm; 
        }
        html, body { 
          margin: 0; 
          padding: 0; 
        }
        @media print { 
          body { 
            -webkit-print-color-adjust: exact; 
            margin: 0 !important; 
            font-size: 12pt;
            line-height: 1.4;
          } 
          .sheet { 
            padding: 0; 
            page-break-after: always; 
            min-height: 100vh;
          }
          .sheet:first-child { 
            padding-top: 0; 
          }
          .sheet:not(:first-child) { 
            padding-top: 0; 
          }
        }
        .sheet { 
          padding: 0; 
          page-break-after: always; 
          min-height: 100vh;
        }
        .sheet:last-child { 
          page-break-after: auto; 
        }
        
        /* Specific styling for page 2 and beyond */
        .sheet:not(:first-child) {
          padding-top: 0;
        }
        .header { 
          margin-bottom: 20px; 
          padding-bottom: 12px; 
          border-bottom: 3px solid black; 
          overflow: hidden; 
        }
        
        .content-wrapper {
          padding: 0 1cm;
        }
        
        @media print { 
          .content-wrapper {
            padding: 0;
          }
          .sheet:first-child { 
            padding-top: 0 !important; 
          }
          /* Better page margins for print */
          @page { 
            margin: 1.5cm 1cm 1.5cm 1cm !important; 
          }
        }
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
        .addressee { margin-bottom: 15px; line-height: 1.2; }
        .content { margin-bottom: 25px; text-align: justify; line-height: 1.3; }
        .content p { margin-bottom: 15px; page-break-inside: avoid; line-height: 1.3; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { 
          border: 1px solid black; 
          padding: 10px 8px; 
          text-align: left; 
          vertical-align: top; 
          font-size: 10pt; 
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        }
        th { 
          font-weight: bold; 
          text-align: center; 
        }
        .number-col { 
          width: 50px; 
          text-align: center; 
        }
        .name-col { 
          width: 220px; 
          min-width: 180px;
        }
        .position-col { 
          width: 200px; 
          min-width: 150px;
        }
        .education-col { 
          width: 160px; 
          min-width: 120px;
        }
        .attachment-section { margin: 10px 0; page-break-inside: avoid; }
        .attachment-section p { margin-top: 0px !important; margin-bottom: 8px !important; }
        .attachment-list ol { margin: 0; padding-left: 20px; }
        .attachment-list li { margin-bottom: 3px; }
        .signature-section { margin-top: 40px; display: flex; justify-content: flex-end; }
        .signature-block { text-align: left; min-width: 250px; }
        .signature-date { margin-bottom: 6px; color: black; }
        .signature-title { margin-bottom: 60px; color: black; }
        .signature-anchor { margin: 6px 0 24px 0; font-weight: bold; color: black; }
        .signature-name { font-weight: bold; margin-bottom: 5px; color: black; }
        .signature-nip { font-size: 10pt; color: black; }

        /* Improved page break logic for better print handling */
        .data-table { 
          page-break-inside: auto; 
          margin-bottom: 20px;
          table-layout: fixed;
          width: 100%;
        }
        
        .data-table thead { 
          display: table-header-group; 
          page-break-after: avoid;
        }
        
        .data-table tbody tr { 
          page-break-inside: avoid; 
          page-break-after: auto;
          break-inside: avoid;
          min-height: 30px;
        }
        
        /* Better spacing for table rows */
        .data-table tbody tr:last-child { 
          margin-bottom: 15px; 
        }
        
        /* Improved page break handling */
        .data-table tbody tr:nth-last-child(1) { 
          page-break-before: auto; 
        }
        
        .data-table tbody tr:nth-last-child(2) { 
          page-break-after: avoid;
          margin-bottom: 0;
        }
        
        /* Content sections should avoid breaking */
        .content p { 
          page-break-inside: avoid; 
          margin-bottom: 15px; 
        }
        
        .attachment-section { 
          page-break-inside: avoid; 
          margin: 15px 0; 
        }
        
        .signature-section { 
          page-break-inside: avoid; 
          margin-top: 40px; 
        }
        
        @media print { 
          /* Ensure table headers repeat on each page */
          .data-table thead { 
            display: table-header-group !important; 
            page-break-after: avoid !important;
          }
          
          /* Better row handling */
          .data-table tbody tr { 
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            orphans: 2 !important;
            widows: 2 !important;
          }
          
          /* Prevent breaking between table rows */
          .data-table tbody tr:not(:last-child) { 
            page-break-after: avoid !important;
          }
          
          /* Last row spacing */
          .data-table tbody tr:last-child { 
            margin-bottom: 15px !important; 
          }
          
          /* Second to last row should not break after */
          .data-table tbody tr:nth-last-child(2) { 
            page-break-after: avoid !important;
            margin-bottom: 0 !important;
          }
          
          /* Ensure content sections don't break */
          .content p { 
            page-break-inside: avoid !important; 
          }
          
          .attachment-section { 
            page-break-inside: avoid !important; 
          }
          
          .signature-section { 
            page-break-inside: avoid !important; 
          }
          
          /* Better text handling for print */
          th, td { 
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            hyphens: auto !important;
            padding: 10px 8px !important;
            white-space: normal !important;
          }
          
          /* Ensure proper spacing between elements */
          .data-table { 
            margin-bottom: 20px !important; 
          }
          
          /* Better line height for print */
          .data-table td { 
            line-height: 1.3 !important; 
          }
          
          /* Prevent text from being cut off */
          .data-table tbody tr { 
            min-height: 35px !important;
          }
          
          /* Better column width handling */
          .data-table { 
            table-layout: fixed !important;
            width: 100% !important;
          }
          
          /* Better column widths for print */
          .number-col { 
            width: 50px !important; 
          }
          .name-col { 
            width: 220px !important; 
          }
          .position-col { 
            width: 200px !important; 
          }
          .education-col { 
            width: 160px !important; 
          }
          
          /* Better page margins for print */
          @page { 
            margin: 1.5cm 1cm 1.5cm 1cm !important; 
          }
          
          /* Specific margins for page 2 and beyond */
          @page :left { 
            margin-top: 2.5cm !important; 
            margin-bottom: 1.5cm !important;
          }
          @page :right { 
            margin-top: 2.5cm !important; 
            margin-bottom: 1.5cm !important;
          }
          
          /* Better text handling for print */
          .data-table td { 
            padding: 12px 8px !important;
            line-height: 1.4 !important;
          }
          
          /* Specific handling for page 2 and beyond */
          .sheet:not(:first-child) {
            padding-top: 0 !important;
            margin-top: 0 !important;
          }
          
          /* Better spacing for content on page 2+ */
          .sheet:not(:first-child) .content-wrapper {
            padding-top: 0 !important;
          }
          
          /* Ensure proper spacing for table on page 2+ */
          .sheet:not(:first-child) .data-table {
            margin-top: 10px !important;
          }
          
          /* Fix text cutting on page 2+ */
          .sheet:not(:first-child) .data-table td {
            padding: 15px 10px !important;
            line-height: 1.5 !important;
            min-height: 40px !important;
          }
          
          /* Better page break handling for page 2+ */
          .sheet:not(:first-child) .data-table tbody tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            min-height: 45px !important;
          }
          
          /* Ensure proper text spacing on page 2+ */
          .sheet:not(:first-child) .data-table td {
            padding: 15px 10px !important;
            line-height: 1.5 !important;
            word-wrap: break-word !important;
            min-height: 40px !important;
          }
          
          /* Better column handling for page 2+ */
          .sheet:not(:first-child) .data-table {
            table-layout: fixed !important;
            width: 100% !important;
          }
          
          /* Specific column widths for page 2+ */
          .sheet:not(:first-child) .number-col { 
            width: 60px !important; 
          }
          .sheet:not(:first-child) .name-col { 
            width: 250px !important; 
          }
          .sheet:not(:first-child) .position-col { 
            width: 220px !important; 
          }
          .sheet:not(:first-child) .education-col { 
            width: 180px !important; 
          }
          
          /* Better text handling for page 2+ */
          .sheet:not(:first-child) .data-table td {
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            white-space: normal !important;
          }
          
          /* Prevent text cutting on page 2+ */
          .sheet:not(:first-child) .data-table tbody tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            orphans: 2 !important;
            widows: 2 !important;
          }
          
          /* Better spacing for page 2+ */
          .sheet:not(:first-child) .data-table {
            margin-bottom: 25px !important;
          }
        }
      `}</style>

      <section className="sheet">
        <div className="header">
          {resolvedLogoUrl ? (
            <img src={resolvedLogoUrl} alt="Logo Kementerian Agama" className="logo" />
          ) : (
            <div className="logo" />
          )}
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
              <div className="info-row"><div className="info-label">Perihal</div><div className="info-colon">:</div><div className="info-value">Pengakuan dan Penyematan Gelar<br />Pendidikan Terakhir PNS</div></div>
            </div>
            <div className="document-date">{tanggalSuratText}</div>
          </div>

          <div className="addressee">
            <p>
              Yth. <span dangerouslySetInnerHTML={{ __html: addresseeText }} />
            </p>
          </div>

          <div className="content">
            <p>
              Bersama ini kami sampaikan bahan usul pengakuan dan penyematan gelar pendidikan terakhir PNS dilingkungan Kantor Wilayah Kementerian Agama Provinsi NTB yang namanya tercantum dibawah ini, untuk mendapatkan penyelesaian sebagai berikut :
            </p>

            <table className="data-table">
              <thead>
                <tr>
                  <th className="number-col">No</th>
                  <th className="name-col">Nama / NIP</th>
                  <th className="position-col">Jabatan</th>
                  <th className="education-col">Pendidikan Lama</th>
                  <th className="education-col">Pendidikan Terakhir</th>
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
                    <td className="position-col">{r.jabatan}</td>
                    <td className="education-col">{r.pendidikanLama}</td>
                    <td className="education-col">{r.pendidikanTerakhir}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="spacer">
                <tr>
                  <td colSpan={5} style={{ border: "none", padding: "8px 0" }} />
                </tr>
              </tfoot>
            </table>


            <div className="attachment-section">
              <p><strong>Sebagai bahan kelengkapan, berikut ini dokumen terlampir:</strong></p>
              <div className="attachment-list">
                <ol>
                  <li>Surat Pertanggung Jawaban Mutlak (SPTJM)</li>
                  <li>Foto copy SK Tugas Belajar / Izin Belajar</li>
                  <li>Foto copy Ijazah dan Transkrip Nilai</li>
                </ol>
              </div>
            </div>

            <p>Demikian untuk maklum dan atas penyelesainnya disampaikan terima kasih.</p>
          </div>

          <div className="signature-section">
            <div className="signature-block">
              <div className="signature-date">{tempatTanggalText}</div>
              <div className="signature-title">Kepala,</div>
              {signatureMode === "tte" ? (
                <div className="signature-anchor">{signatureAnchor}</div>
              ) : null}
              <div className="signature-name">{penandatanganNama}</div>
              <div className="signature-nip">NIP.{formatNip(penandatanganNip)}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};


