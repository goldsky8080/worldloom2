export function JobProgress({
  label,
  elapsed,
  duration,
}: {
  label: string;
  elapsed: number;
  duration: number;
}) {
  const percent = Math.max(0, Math.min(100, (elapsed / duration) * 100));
  return (
    <div
      className="fief-action-progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
    >
      <span style={{ width: percent + '%' }} />
    </div>
  );
}
