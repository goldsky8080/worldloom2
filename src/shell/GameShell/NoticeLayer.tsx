import { useEffect, useRef, useState } from 'react';
import { useAtom } from '../../core/state/useAtom';
import { runtime } from '../../app/bootstrap/services';
import { timeService } from '../../services/time/TimeService';
import { useTranslation } from '../../services/localization';
import { GameModal, GameButton } from '../../ui/components';
/** Time-bound and newly published notices stay independent of the shell render cycle. */
export function NoticeLayer({ enabled }: { enabled: boolean }) {
  const notices = useAtom(runtime.cache.notices),
    now = useAtom(timeService.tick),
    { t } = useTranslation();
  const [popup, setPopup] = useState<string | null>(null),
    seen = useRef(new Map<string, boolean>());
  useEffect(() => {
    if (!enabled || popup) return;
    for (const notice of notices) {
      if (!notice.popup || Date.parse(notice.startsAt) > now || Date.parse(notice.endsAt) <= now)
        continue;
      if (!seen.current.has(notice.id)) {
        let stored = false;
        try {
          stored = !!sessionStorage.getItem('lw.notice.' + notice.id);
        } catch {
          /* Optional storage. */
        }
        seen.current.set(notice.id, stored);
      }
      if (!seen.current.get(notice.id)) {
        setPopup(notice.id);
        break;
      }
    }
  }, [notices, now, enabled, popup]);
  const active = notices.filter((n) => Date.parse(n.startsAt) <= now && Date.parse(n.endsAt) > now),
    popupNotice = active.find((n) => n.id === popup),
    emergency = active.find((n) => n.emergency);
  useEffect(() => {
    if (popup && !popupNotice) setPopup(null);
  }, [popup, popupNotice]);
  function close() {
    if (popup) {
      seen.current.set(popup, true);
      try {
        sessionStorage.setItem('lw.notice.' + popup, 'seen');
      } catch {
        /* Optional storage. */
      }
    }
    setPopup(null);
  }
  return (
    <>
      {emergency && (
        <div className="emergency-banner" role="status">
          {t(emergency.titleKey)}
        </div>
      )}
      {popupNotice && enabled && (
        <GameModal title={t(popupNotice.titleKey)} onClose={close}>
          <p>{t(popupNotice.bodyKey)}</p>
          <GameButton variant="primary" onClick={close}>
            {t('common.confirm')}
          </GameButton>
        </GameModal>
      )}
    </>
  );
}
