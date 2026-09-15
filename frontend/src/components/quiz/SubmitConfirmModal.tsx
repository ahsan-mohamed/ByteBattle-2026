import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export function SubmitConfirmModal({
  open,
  answeredCount,
  totalCount,
  submitting,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  answeredCount: number;
  totalCount: number;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} labelledBy="submit-confirm-heading">
      <h2 id="submit-confirm-heading" className="text-lg font-semibold text-ink">
        Submit your quiz?
      </h2>
      <p className="mt-2 text-sm text-subtle">
        You've answered {answeredCount} of {totalCount} questions. Once submitted, you
        can't change your answers.
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={onConfirm} loading={submitting}>
          Submit Quiz
        </Button>
      </div>
    </Modal>
  );
}
