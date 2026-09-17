import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { AssetImage } from './AssetImage';
import { SystemIcon, type SystemIconName } from '../icons/SystemIcon';
import { audioService } from '../../services/audio/AudioService';
import { useTranslation } from '../../services/localization';
import { useAtom } from '../../core/state/useAtom';
import { timeService, remainingSeconds, formatCountdown } from '../../services/time/TimeService';
import { settings } from '../../services/settings';
import { formatNumber } from '../../services/settings';
import { layers } from '../theme/tokens';
export { AssetImage };
export function GameButton({
  children,
  loading = false,
  variant = 'default',
  className = '',
  onClick,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={'game-button ' + variant + ' ' + className}
      onClick={(event) => {
        void audioService
          .unlock()
          .then(() => audioService.playUi('button.click'))
          .catch(() => {});
        onClick?.(event);
      }}
    >
      {loading && <span className="small-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
export function IconButton({
  icon,
  label,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: SystemIconName;
  label: string;
}) {
  return (
    <GameButton
      {...props}
      className={'icon-button ' + (props.className ?? '')}
      aria-label={label}
      title={label}
    >
      <SystemIcon name={icon} />
    </GameButton>
  );
}
export function GameHeader({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return (
    <header className="game-header">
      <div className="header-title">{children}</div>
      {trailing}
    </header>
  );
}
export function GameDivider() {
  return <hr className="game-divider" />;
}
export function GamePanel({
  title,
  children,
  className = '',
  actions,
  frameUrl,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  frameUrl?: string;
}) {
  const style: CSSProperties = frameUrl
    ? { borderImageSource: 'url("' + frameUrl + '")', borderImageSlice: 24, borderImageWidth: 12 }
    : {};
  return (
    <section className={'game-panel ' + className} style={style}>
      {title && (
        <GameHeader trailing={actions}>
          <h2>{title}</h2>
        </GameHeader>
      )}
      <div className="panel-content">{children}</div>
    </section>
  );
}
export function GameWindow(props: Parameters<typeof GamePanel>[0]) {
  return <GamePanel {...props} className={'game-window ' + (props.className ?? '')} />;
}
function useDialog(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null),
    close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement | null,
      root = ref.current;
    const focusable = () =>
      Array.from(
        root?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select,textarea,[tabindex="0"]',
        ) ?? [],
      );
    (focusable()[0] ?? root)?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        event.preventDefault();
        close.current();
      }
      if (event.key === 'Tab') {
        const items = focusable();
        const first = items[0],
          last = items[items.length - 1];
        if (!first) {
          event.preventDefault();
          root?.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    root?.addEventListener('keydown', handle);
    return () => {
      root?.removeEventListener('keydown', handle);
      prior?.focus();
    };
  }, []);
  return ref;
}
export function GameModal({
  title,
  children,
  onClose,
  className = '',
  layer = 'modal',
  dismissible = true,
  role = 'dialog',
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  layer?: keyof typeof layers;
  dismissible?: boolean;
  role?: 'dialog' | 'alertdialog';
}) {
  const ref = useDialog(dismissible ? onClose : () => {}),
    id = useId(),
    { t } = useTranslation();
  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: layers[layer] }}
      onPointerDown={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={'game-modal ' + className}
        role={role}
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
      >
        <GameHeader
          trailing={
            dismissible ? (
              <IconButton icon="close" label={t('common.close')} onClick={onClose} />
            ) : undefined
          }
        >
          <h2 id={id}>{title}</h2>
        </GameHeader>
        <div className="panel-content">{children}</div>
      </div>
    </div>
  );
}
export function GameDrawer(props: Parameters<typeof GameModal>[0]) {
  return <GameModal {...props} className={'game-drawer ' + (props.className ?? '')} />;
}
export function GameTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string; badge?: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="game-tabs" ref={ref} role="tablist">
      {tabs.map((tab, index) => (
        <GameButton
          key={tab.id}
          role="tab"
          aria-selected={value === tab.id}
          tabIndex={value === tab.id ? 0 : -1}
          className={value === tab.id ? 'selected' : ''}
          onClick={() => onChange(tab.id)}
          onKeyDown={(e) => {
            const next =
              e.key === 'ArrowRight'
                ? (index + 1) % tabs.length
                : e.key === 'ArrowLeft'
                  ? (index + tabs.length - 1) % tabs.length
                  : e.key === 'Home'
                    ? 0
                    : e.key === 'End'
                      ? tabs.length - 1
                      : undefined;
            if (next !== undefined) {
              e.preventDefault();
              onChange(tabs[next].id);
              ref.current?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
            }
          }}
        >
          {tab.label}
          <UnreadBadge count={tab.badge ?? 0} />
        </GameButton>
      ))}
    </div>
  );
}
export function GameTooltip({
  text,
  detail,
  children,
}: {
  text: string;
  detail?: string;
  children: ReactNode;
}) {
  const id = useId(),
    config = useAtom(settings);
  return (
    <span className="tooltip-host" aria-describedby={id}>
      {children}
      <span role="tooltip" id={id} className="game-tooltip" style={{ zIndex: layers.tooltip }}>
        {text}
        {detail && config.interface.tooltip && <small className="tooltip-detail">{detail}</small>}
      </span>
    </span>
  );
}
export function GamePopover({ children, content }: { children: ReactNode; content: ReactNode }) {
  return (
    <details className="game-popover">
      <summary>{children}</summary>
      <div>{content}</div>
    </details>
  );
}
export function GameCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <article className={'game-card ' + className}>{children}</article>;
}
export function ItemSlot({
  assetId,
  label,
  count,
  onClick,
}: {
  assetId?: string;
  label: string;
  count?: number;
  onClick?: () => void;
}) {
  return (
    <GameButton className="item-slot" aria-label={label} title={label} onClick={onClick}>
      {assetId && <AssetImage assetId={assetId} alt={label} />}
      {count !== undefined && <span className="item-count">{formatNumber(count)}</span>}
    </GameButton>
  );
}
export function ItemCard({
  assetId,
  name,
  quantity,
}: {
  assetId: string;
  name: string;
  quantity: number;
}) {
  const { t } = useTranslation();
  return (
    <GameCard className="item-card">
      <ItemSlot assetId={assetId} label={name} count={quantity} />
      <div>
        <strong>{name}</strong>
        <p className="muted">{t('inventory.quantity', { count: formatNumber(quantity) })}</p>
      </div>
    </GameCard>
  );
}
export function CharacterPortrait({
  assetId = 'framework.portrait.default',
  name,
}: {
  assetId?: string;
  name: string;
}) {
  return <AssetImage assetId={assetId} alt={name} className="character-portrait" />;
}
export function StatBar({
  value,
  max,
  label,
  variant = 'health',
}: {
  value: number;
  max: number;
  label: string;
  variant?: 'health' | 'progress';
}) {
  const bounded = Math.max(0, Math.min(max, value));
  return (
    <div
      className={'stat-bar ' + variant}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={bounded}
    >
      <span style={{ width: (max > 0 ? (bounded / max) * 100 : 0) + '%' }} />
      <small>
        {label} · {Math.round(bounded)}/{max}
      </small>
    </div>
  );
}
export function ProgressBar({ value, label }: { value: number; label: string }) {
  return <StatBar value={value} max={100} label={label} variant="progress" />;
}
export function ResourceBadge({ children }: { children: ReactNode }) {
  return <span className="resource-badge">{children}</span>;
}
export function CurrencyDisplay({ value }: { value: number }) {
  const { t } = useTranslation();
  return (
    <ResourceBadge>
      <span className="currency-coin" aria-hidden="true">
        ◇
      </span>
      <span>{formatNumber(value)}</span>
      <small>{t('common.gold')}</small>
    </ResourceBadge>
  );
}
export function StatusBadge({
  children,
  kind = 'info',
}: {
  children: ReactNode;
  kind?: 'info' | 'success' | 'danger';
}) {
  return (
    <span className={'status-badge ' + kind}>
      <i />
      {children}
    </span>
  );
}
export function Countdown({ endsAt }: { endsAt: string }) {
  const now = useAtom(timeService.tick);
  return <time dateTime={endsAt}>{formatCountdown(remainingSeconds(endsAt, now))}</time>;
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="empty-state">
      <AssetImage assetId="framework.empty" alt="" />
      <h3>{title ?? t('common.empty')}</h3>
      <p>{description ?? t('common.emptyHint')}</p>
      {action}
    </div>
  );
}
export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="loading-state" role="status">
      <div className="loading-rune">◇</div>
      <p>{label ?? t('common.loading')}</p>
    </div>
  );
}
export function ErrorState({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="error-state" role="alert">
      <p>{error ?? t('common.error')}</p>
      {onRetry && <GameButton onClick={onRetry}>{t('common.retry')}</GameButton>}
    </div>
  );
}
export function NotificationToast({
  children,
  onClose,
  kind,
}: {
  children: ReactNode;
  onClose: () => void;
  kind: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={'notification-toast ' + kind} role="status">
      <span className="toast-rune">◇</span>
      <span>{children}</span>
      <IconButton icon="close" label={t('common.close')} onClick={onClose} />
    </div>
  );
}
export function UnreadBadge({ count }: { count: number }) {
  return count > 0 ? <span className="unread-badge">{count > 99 ? '99+' : count}</span> : null;
}
