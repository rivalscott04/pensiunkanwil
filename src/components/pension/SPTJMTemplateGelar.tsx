import * as React from "react";
import { SPTJMBaseTemplate, SPTJMBaseProps } from "./SPTJMBaseTemplate";

export type SPTJMGelarProps = SPTJMBaseProps & {
  nomorSuratRujukan: string;
  tanggalSuratRujukanText: string;
  perihalSuratRujukan: string;
};

export const SPTJMTemplateGelar: React.FC<SPTJMGelarProps> = (props) => {
  const { nomorSuratRujukan, tanggalSuratRujukanText, perihalSuratRujukan, ...base } = props;
  return (
    <SPTJMBaseTemplate {...base}>
      <p>
        Dengan ini menyatakan dan menjamin kebenaran dan bertanggung jawab atas dokumen dan data yang disampaikan dalam surat usul penyematan gelar nomor {nomorSuratRujukan} tanggal {tanggalSuratRujukanText} perihal {perihalSuratRujukan} telah sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.
      </p>
      <p>Apabila dikemudian hari ditemukan adanya dokumen dan data tersebut ternyata tidak benar, maka saya siap bertanggung jawab dan diberikan sanksi secara administrasi maupun pidana.</p>
      <p>Demikian pernyataan ini saya buat dengan sadar dan tanpa tekanan dari pihak manapun.</p>
    </SPTJMBaseTemplate>
  );
};


