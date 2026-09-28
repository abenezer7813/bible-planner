"use client";

import { useEffect, useRef } from "react";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-description"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md border-0 bg-transparent p-0 text-[var(--ink)] backdrop:bg-black/45"
    >
      <div className="card p-6">
        <h2 id="confirmation-title" className="text-lg font-semibold">{title}</h2>
        <p id="confirmation-description" className="mt-2 text-sm text-[var(--ink-soft)]">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--ink-soft)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="px-4 py-2 rounded-xl bg-red-700 text-white text-sm font-semibold"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
