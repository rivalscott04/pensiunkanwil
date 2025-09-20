import * as React from "react";

export type KemenagTemplateProps = {
  logoUrl?: string;
  documentNumberPage1?: string;
  documentNumberPage2?: string;
  signatoryName?: string;
  signatoryNip?: string;
  signatoryRank?: string;
  signatoryPosition?: string;
  subjectName?: string;
  subjectNip?: string;
  subjectRank?: string;
  subjectPosition?: string;
  subjectAgency?: string;
  signaturePlace?: string;
  signatureDate?: string;
  signatureMode?: "manual" | "tte";
  signatureAnchor?: "^" | "$" | "#";
};

export const KemenagDocumentTemplate: React.FC<KemenagTemplateProps> = (props) => {
  const {
    logoUrl = "",
    documentNumberPage1 = "",
    documentNumberPage2 = "",
    signatoryName = "",
    signatoryNip = "",
    signatoryRank = "",
    signatoryPosition = "",
    subjectName = "",
    subjectNip = "",
    subjectRank = "",
    subjectPosition = "",
    subjectAgency = "",
    signaturePlace = "",
    signatureDate = "",
    signatureMode = "manual",
    signatureAnchor = "^",
  } = props;

  const resolvedLogoUrl = React.useMemo(() => {
    if (!logoUrl) return "";
    try {
      // Ensure absolute URL so it works inside print iframe
      const u = new URL(logoUrl, window.location.origin);
      return u.toString();
    } catch {
      return logoUrl;
    }
  }, [logoUrl]);

  const formatNip = React.useCallback((nip?: string) => {
    return (nip || "").replace(/\D+/g, "");
  }, []);

  return (
    <div className="w-full bg-white text-black">
      <style>{`
        @page { size: auto; margin: 0; }
        @media print { body { -webkit-print-color-adjust: exact; } }
        .sheet { padding: 1.5cm 2cm; page-break-after: always; }
        .sheet:last-child { page-break-after: auto; }
        .content-wrapper { margin: 0 1cm; }
        .header { border-bottom: 3px solid black; padding-bottom: 12px; margin-bottom: 20px; overflow: hidden; }
        .header .logo { width: 100px; height: 100px; float: left; margin-right: 10px; object-fit: contain; }
        .header-text { font-size: 12pt; font-weight: bold; line-height: 1.2; text-align: center; margin: 0; }
        .header-info { font-size: 11pt; line-height: 1.1; text-align: center; margin: 5px 0 0 0; }
        .title { font-size: 10pt; font-weight: bold; text-align: center; margin: 8px 0; }
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
      `}</style>

      {/* Halaman 1 */}
      <section className="sheet">
        <div className="header">
          {resolvedLogoUrl ? (
            <img src={resolvedLogoUrl} alt="Logo Kementerian Agama" className="logo" />
          ) : (
            <div className="logo" />
          )}
          <div className="header-content">
            <div className="header-text">
              KEMENTERIAN AGAMA REPUBLIK INDONESIA<br />
              KANTOR WILAYAH KEMENTERIAN AGAMA<br />
              PROVINSI NUSA TENGGARA BARAT
            </div>
            <div className="header-info">
              Jalan Udayana No. 6 Tlp. 633040 Fax ( 0370 ) 622317 Mataram<br />
              Website : http://ntb.kemenag.go.id email : updepagntb@gmail.com
            </div>
          </div>
        </div>

        <div className="content-wrapper">
          <div className="title">
            <strong>SURAT PERNYATAAN</strong><br />
            <strong>TIDAK PERNAH DIJATUHI HUKUMAN DISIPLIN TINGKAT SEDANG / BERAT</strong>
          </div>

          <div className="document-number">Nomor : {documentNumberPage1}</div>

          <div className="signatory-info">
            <p>Yang bertanda tangan dibawah ini :</p>
            <div className="data-row"><div className="data-label">Nama</div><div className="data-colon">:</div><div className="data-value">{signatoryName}</div></div>
            <div className="data-row"><div className="data-label">Nip</div><div className="data-colon">:</div><div className="data-value">{formatNip(signatoryNip)}</div></div>
            <div className="data-row"><div className="data-label">Pangkat/Golongan Ruang</div><div className="data-colon">:</div><div className="data-value">{signatoryRank}</div></div>
            <div className="data-row"><div className="data-label">Jabatan</div><div className="data-colon">:</div><div className="data-value">{signatoryPosition}</div></div>
          </div>

          <div className="subject-info" style={{ marginTop: 20 }}>
            <p>Dengan ini menyatakan dengan sesungguhnya, bahwa Pegawai Negeri Sipil :</p>
            <div className="data-row"><div className="data-label">Nama</div><div className="data-colon">:</div><div className="data-value">{subjectName}</div></div>
            <div className="data-row"><div className="data-label">Nip</div><div className="data-colon">:</div><div className="data-value">{formatNip(subjectNip)}</div></div>
            <div className="data-row"><div className="data-label">Pangkat/Golongan Ruang</div><div className="data-colon">:</div><div className="data-value">{subjectRank}</div></div>
            <div className="data-row"><div className="data-label">Jabatan</div><div className="data-colon">:</div><div className="data-value">{subjectPosition}</div></div>
            <div className="data-row"><div className="data-label">Instansi</div><div className="data-colon">:</div><div className="data-value">{subjectAgency}</div></div>
          </div>

          <div className="statement-text">
            <p>dalam 1 ( satu ) tahun terakhir tidak pernah dijatuhi hukuman disiplin tingkat sedang/berat.</p>
          </div>

          <div className="statement-text">
            <p>Demikian Surat Pernyataan ini saya buat dengan sesungguhnya dengan mengingat sumpah jabatan dan apabila dikemudian hari ternyata isi surat pernyataan ini tidak benar yang mengakibatkan kerugian bagi negara, maka saya bersedia menanggung kerugian tersebut.</p>
          </div>

          <div className="signature-section">
            <div className="signature-inner">
              <div className="signature-date">{signaturePlace}{signaturePlace && signatureDate ? ", " : ""}{signatureDate}</div>
              <div className="signature-title">KEPALA</div>
              {signatureMode === "tte" ? (
                <div className="signature-anchor">{signatureAnchor}</div>
              ) : null}
              <div className="signature-name">{signatoryName}</div>
              <div className="signature-nip">NIP. {formatNip(signatoryNip)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Halaman 2 */}
      <section className="sheet">
        <div className="content-wrapper">
          <div className="reference-note">
            ANAK LAMPIRAN 4<br />
            PERATURAN BADAN KEPEGAWAIAN NEGARA<br />
            REPUBLIK INDONESIA<br />
            NOMOR 2 TAHUN 2018<br />
            TENTANG<br />
            PEDOMAN PEMBERIAN PERTIMBANGAN TEHNIS<br />
            PENSIUN PEGAWAI NEGERI SIPIL DAN PENSIUN<br />
            JANDA/DUDA PEGAWAI NEGERI SIPIL
          </div>

          <div className="title">
            <strong>SURAT PERNYATAAN</strong><br />
            <strong>
              TIDAK SEDANG MENJALANI PROSES PIDANA ATAU PERNAH DIPIDANA PENJARA BERDASARKAN
              PUTUSAN PENGADILAN YANG TELAH BERKEKUATAN HUKUM TETAP
            </strong>
          </div>

          <div className="document-number">Nomor : {documentNumberPage2}</div>

          <div className="signatory-info">
            <p>Yang bertanda tangan dibawah ini</p>
            <div className="data-row"><div className="data-label">Nama</div><div className="data-colon">:</div><div className="data-value">{signatoryName}</div></div>
            <div className="data-row"><div className="data-label">Nip</div><div className="data-colon">:</div><div className="data-value">{formatNip(signatoryNip)}</div></div>
            <div className="data-row"><div className="data-label">Pangkat/Golongan Ruang</div><div className="data-colon">:</div><div className="data-value">{signatoryRank}</div></div>
            <div className="data-row"><div className="data-label">Jabatan</div><div className="data-colon">:</div><div className="data-value">{signatoryPosition}</div></div>
          </div>

          <div className="subject-info" style={{ marginTop: 20 }}>
            <p>Dengan ini menyatakan dengan sesungguhnya, bahwa Pegawai Negeri Sipil :</p>
            <div className="data-row"><div className="data-label">Nama</div><div className="data-colon">:</div><div className="data-value">{subjectName}</div></div>
            <div className="data-row"><div className="data-label">Nip</div><div className="data-colon">:</div><div className="data-value">{formatNip(subjectNip)}</div></div>
            <div className="data-row"><div className="data-label">Pangkat/Golongan Ruang</div><div className="data-colon">:</div><div className="data-value">{subjectRank}</div></div>
            <div className="data-row"><div className="data-label">Jabatan</div><div className="data-colon">:</div><div className="data-value">{subjectPosition}</div></div>
            <div className="data-row"><div className="data-label">Instansi</div><div className="data-colon">:</div><div className="data-value">{subjectAgency}</div></div>
          </div>

          <div className="statement-text">
            <p>
              Tidak sedang menjalani proses pidana atau pernah dipidana penjara berdasarkan putusan pengadilan yang telah berkekuatan hukum tetap karena melakukan tindak pidana kejahatan jabatan atau tindak pidana kejahatan yang ada hubungannya dengan jabatan dan/atau pidana umum.
            </p>
          </div>

          <div className="statement-text">
            <p>
              Demikian surat pernyataan ini saya buat dengan sesungguhnya dengan mengingat sumpah jabatan dan apabila dikemudian hari ternyata isi surat pernyataan ini tidak benar yang mengakibatkan kerugian bagi negara, maka saya bersedia menanggung kerugian negara sesuai dengan ketentuan peraturan perundang-undangan.
            </p>
          </div>

          <div className="signature-section">
            <div className="signature-inner">
              <div className="signature-date">{signaturePlace}{signaturePlace && signatureDate ? ", " : ""}{signatureDate}</div>
              <div className="signature-title">KEPALA</div>
              {signatureMode === "tte" ? (
                <div className="signature-anchor">{signatureAnchor}</div>
              ) : null}
              <div className="signature-name">{signatoryName}</div>
              <div className="signature-nip">NIP. {formatNip(signatoryNip)}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};


