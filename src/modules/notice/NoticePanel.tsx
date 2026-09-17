import { useState } from 'react';
import { runtime } from '../../app/bootstrap/services';
import { useAtom } from '../../core/state/useAtom';
import { useTranslation } from '../../services/localization';
import { timeService } from '../../services/time/TimeService';
import { GameButton, StatusBadge, GameTabs, EmptyState } from '../../ui/components';
export function NoticePanel() {
  const notices = useAtom(runtime.cache.notices),
    now = useAtom(timeService.tick),
    { t } = useTranslation(),
    [selected, setSelected] = useState<string | null>(null),
    [category, setCategory] = useState('all');
  const active = notices
    .filter((n) => Date.parse(n.startsAt) <= now && Date.parse(n.endsAt) > now)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  const categories = ['all', ...new Set(active.map((n) => n.categoryKey))],
    filtered = active.filter((n) => category === 'all' || n.categoryKey === category);
  return (
    <>
      <GameTabs
        value={category}
        onChange={setCategory}
        tabs={categories.map((id) => ({ id, label: t(id === 'all' ? 'menu.notice' : id) }))}
      />
      {!filtered.length && <EmptyState />}
      {filtered.map((notice) => (
        <article className="notice-row" key={notice.id}>
          <GameButton
            onClick={() => setSelected(selected === notice.id ? null : notice.id)}
            className="notice-title"
          >
            {notice.important && <StatusBadge>{t('notice.important')}</StatusBadge>}
            <strong>{t(notice.titleKey)}</strong>
            {notice.pinned && <small>{t('notice.pinned')}</small>}
          </GameButton>
          <small className="muted">{t(notice.categoryKey)}</small>
          {selected === notice.id && <p className="notice-body">{t(notice.bodyKey)}</p>}
        </article>
      ))}
    </>
  );
}
