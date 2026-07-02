import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/shared/Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", destructive, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} description={description} onClose={onClose}>
      <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-4">
        <TriangleAlert className="mt-0.5 size-5 text-amber-500" />
        <p className="text-sm text-muted-foreground">This action is intentional and can affect reporting data.</p>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" variant={destructive ? "destructive" : "default"} onClick={() => void onConfirm()}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
