import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AppButton } from "@/components/ui/app-button"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { FileText, Heart, UserX, AlertCircle } from "lucide-react"

interface PensionType {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  additionalDocs: string[]
}

const pensionTypes: PensionType[] = [
  {
    id: "bup",
    name: "Batas Usia Pensiun (BUP)",
    description: "Pensiun karena mencapai batas usia maksimal",
    icon: UserX,
    additionalDocs: []
  },
  {
    id: "sakit",
    name: "Pensiun Sakit",
    description: "Pensiun karena alasan kesehatan",
    icon: Heart,
    additionalDocs: ["Surat Keterangan Sakit dari Dokter"]
  },
  {
    id: "janda_duda",
    name: "Pensiun Janda/Duda",
    description: "Pensiun karena pasangan meninggal dunia",
    icon: AlertCircle,
    additionalDocs: [
      "Akta/Suket Kematian",
      "Suket Janda/Duda",
      "Pas Foto Pasangan"
    ]
  },
  {
    id: "aps",
    name: "Atas Permintaan Sendiri (APS)",
    description: "Pensiun atas permintaan sendiri pegawai",
    icon: FileText,
    additionalDocs: [
      "Surat Pernyataan Pensiun Atas Permintaan Sendiri",
      "Surat Usul Pemberhentian dari PPK"
    ]
  }
]

interface PensionTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: PensionType) => void
}

export function PensionTypeModal({ isOpen, onClose, onSelect }: PensionTypeModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const handleSelect = () => {
    const type = pensionTypes.find(t => t.id === selectedType)
    if (type) {
      onSelect(type)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl animate-scale-in">
        <DialogHeader>
          <DialogTitle>
            <AppHeading level={3}>Pilih Jenis Pensiun</AppHeading>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <AppText color="muted">
            Silakan pilih jenis pensiun yang akan diajukan:
          </AppText>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {pensionTypes.map((type) => {
              const Icon = type.icon
              const isSelected = selectedType === type.id
              
              return (
                <div
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                    ${isSelected
                      ? 'border-green-600 dark:border-orange-500 bg-green-50 dark:bg-orange-500/10 shadow-button'
                      : 'border-border hover:border-green-600/50 dark:hover:border-orange-500/50 hover:bg-accent'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`
                      p-2 rounded-lg flex-shrink-0
                      ${isSelected ? 'bg-green-600 dark:bg-orange-500 text-white' : 'bg-muted text-muted-foreground'}
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <AppText weight="semibold" className="mb-1">
                        {type.name}
                      </AppText>
                      <AppText size="sm" color="muted" className="mb-2">
                        {type.description}
                      </AppText>
                      
                      {type.additionalDocs.length > 0 && (
                        <div className="mt-2">
                          <AppText size="xs" weight="medium" className="mb-1 text-green-600 dark:text-orange-400">
                            Dokumen Tambahan:
                          </AppText>
                          <ul className="space-y-0.5">
                            {type.additionalDocs.map((doc, index) => (
                              <li key={index}>
                                <AppText size="xs" color="muted">
                                  • {doc}
                                </AppText>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <AppButton variant="outline" onClick={onClose}>
              Batal
            </AppButton>
            <AppButton 
              variant="hero"
              onClick={handleSelect}
              disabled={!selectedType}
              className="hover:scale-105 transition-all duration-200"
            >
              Lanjutkan
            </AppButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}