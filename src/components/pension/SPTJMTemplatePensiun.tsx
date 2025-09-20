import * as React from "react";
import { SPTJMBaseTemplate, SPTJMBaseProps } from "./SPTJMBaseTemplate";

export type AtasNamaItem = { nama: string; nip: string };

export type SPTJMPensiunProps = SPTJMBaseProps & {
  nomorSuratRujukan: string;
  tanggalSuratRujukanText: string;
  perihalSuratRujukan: string;
  atasNama: AtasNamaItem[];
};

export const SPTJMTemplatePensiun: React.FC<SPTJMPensiunProps> = (props) => {
  const { nomorSuratRujukan, tanggalSuratRujukanText, perihalSuratRujukan, atasNama, ...base } = props;
  const formatNip = React.useCallback((nip?: string) => (nip || "").replace(/\D+/g, ""), []);
  return (
    <SPTJMBaseTemplate {...base}>
      <p>
        Dengan ini menyatakan dan menjamin kebenaran dan bertanggung jawab atas dokumen dan data yang disampaikan dalam surat usul {perihalSuratRujukan} nomor {nomorSuratRujukan} tanggal {tanggalSuratRujukanText} tentang {perihalSuratRujukan} Atas Nama:
      </p>
      <div className="atasnama-wrapper" style={{ marginLeft: 8, marginTop: 4, marginBottom: 8 }}>
        <style>{`
          .atasnama-table { width: 100%; border-collapse: collapse; }
          .atasnama-table td { border: none; padding: 2px 4px; vertical-align: top; font-size: 11pt; }
          .atasnama-no { width: 28px; text-align: left; }
          .atasnama-name { }
          .atasnama-nip { width: 220px; }
        `}</style>
        <table className="atasnama-table">
          <tbody>
            {atasNama.map((p, i) => (
              <tr key={i}>
                <td className="atasnama-no">{i + 1}.</td>
                <td className="atasnama-name">{p.nama}</td>
                <td className="atasnama-nip">NIP. {formatNip(p.nip)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>telah sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.</p>
      <p>Apabila dikemudian hari ditemukan adanya dokumen dan data tersebut ternyata tidak benar, maka saya siap bertanggung jawab dan diberikan sanksi secara administrasi maupun pidana.</p>
      <p>Demikian pernyataan ini saya buat dengan sadar dan tanpa tekanan dari pihak manapun.</p>
    </SPTJMBaseTemplate>
  );
};


