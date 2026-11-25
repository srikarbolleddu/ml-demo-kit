import { DemoApiError } from "../client";
import { useDelayedFlag } from "../hooks";

export function errorMessage(error: unknown): string {
  if (error instanceof DemoApiError) return error.message;
  return "Something went wrong. Please try again.";
}

export function Loading({ label }: { label: string }) {
  const slow = useDelayedFlag(true);
  return (
    <div className="mdk-status" role="status" aria-live="polite">
      <span className="mdk-spinner" aria-hidden="true" />
      <span>
        {label}
        {slow && (
          <span className="mdk-muted">
            {" "}
            Waking the model up. The first request after a quiet spell takes a few seconds.
          </span>
        )}
      </span>
    </div>
  );
}

export function ErrorNotice({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="mdk-status mdk-status--error" role="alert">
      <span>{errorMessage(error)}</span>
      {onRetry && (
        <button type="button" className="mdk-button mdk-button--ghost" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
