import * as React from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface SessionExpiredModalProps {
  open: boolean
  onConfirm: () => void
}

export function SessionExpiredModal({ open, onConfirm }: SessionExpiredModalProps) {
  // Auto redirect after a short delay if the user does not click
  React.useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      onConfirm()
    }, 8000) // 8 seconds
    return () => clearTimeout(timer)
  }, [open, onConfirm])

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Sesi berakhir</AlertDialogTitle>
          <AlertDialogDescription>
            Sesi Anda telah habis. Silakan login kembali untuk melanjutkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction autoFocus onClick={onConfirm}>
            Login kembali
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default SessionExpiredModal


