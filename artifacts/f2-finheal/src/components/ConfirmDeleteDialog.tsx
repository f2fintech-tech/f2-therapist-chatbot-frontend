import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmDeleteDialog({
  isOpen,
  title = "Delete Goal",
  description = "Do you want to delete this goal? This action cannot be undone.",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // Call onCancel asynchronously to avoid triggering setState during
        // render in parent components (prevents maximum update depth loops).
        setTimeout(() => onCancel(), 0);
      }
    }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-bold text-gray-900">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-[13px] text-gray-600 mt-[8px]">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="gap-3 sm:gap-3 sm:flex-row-reverse pt-[16px]">
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting || isLoading}
            className="flex-1"
          >
            {isDeleting || isLoading ? "Deleting..." : "Delete"}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting || isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
