import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type SuccessDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  onClose?: () => void
}

export function SuccessDialog({ open, onOpenChange, title = "Berhasil", description, onClose }: SuccessDialogProps) {
  React.useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      onOpenChange(false)
      onClose?.()
    }, 1400)
    return () => clearTimeout(timer)
  }, [open, onOpenChange, onClose])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-green-600">
              <path fill="currentColor" d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7 18.9 6.3z"></path>
            </svg>
          </div>
          {description && (
            <p className="text-center text-sm text-muted-foreground px-4">{description}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}



