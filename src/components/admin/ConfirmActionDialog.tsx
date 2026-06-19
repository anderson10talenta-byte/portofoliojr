import { AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  loading = false,
  onOpenChange,
  onConfirm,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <AlertDialogContent className="overflow-hidden border-white/10 bg-[#101313] p-0 text-white shadow-2xl shadow-black/40 sm:max-w-md">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/70 to-transparent" />
        <AlertDialogHeader className="space-y-4 p-6 pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-400/25 bg-red-500/10 text-red-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <AlertDialogTitle className="font-display text-2xl font-semibold text-white">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-sm leading-6 text-white/55">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="border-t border-white/8 bg-white/[0.02] p-4">
          <AlertDialogCancel disabled={loading} className="border-white/12 bg-transparent text-white/70 hover:bg-white/8 hover:text-white">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className="bg-red-500 text-white hover:bg-red-400"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
