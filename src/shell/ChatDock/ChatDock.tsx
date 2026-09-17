import { useEffect, useRef, useState } from 'react';
import { runtime, socialGateway, session } from '../../app/bootstrap/services';
import { useAtom } from '../../core/state/useAtom';
import { chatUi } from '../state';
import { useTranslation } from '../../services/localization';
import { settings, formatTime } from '../../services/settings';
import { GameTabs, IconButton, GameButton, ErrorState, UnreadBadge } from '../../ui/components';
import type { ChatMessage } from '../../core/contracts';
export function ChatDock() {
  const messages = useAtom(runtime.cache.chat),
    ui = useAtom(chatUi),
    config = useAtom(settings),
    connection = useAtom(runtime.connection),
    user = useAtom(session),
    { t } = useTranslation();
  const [text, setText] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    list = useRef<HTMLDivElement>(null);
  const channels: ChatMessage['channel'][] = ['global', 'region', 'guild', 'system'];
  const unread = (channel: ChatMessage['channel']) =>
    messages.filter((m) => m.channel === channel && !ui.seen[channel].includes(m.id)).length;
  useEffect(() => {
    if (ui.minimized) return;
    chatUi.update((state) => ({
      ...state,
      seen: {
        ...state.seen,
        [ui.channel]: messages.filter((m) => m.channel === ui.channel).map((m) => m.id),
      },
    }));
    list.current?.scrollTo?.({ top: list.current.scrollHeight });
  }, [messages, ui.channel, ui.minimized]);
  async function send() {
    if (busy || !text.trim() || !user || connection !== 'connected') return;
    setBusy(true);
    setError(false);
    try {
      await socialGateway.sendChat(ui.channel, text, user.nickname);
      setText('');
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  if (ui.minimized)
    return (
      <GameButton
        className="chat-minimized"
        aria-label={t('menu.chat')}
        onClick={() => chatUi.update((s) => ({ ...s, minimized: false }))}
      >
        {t('menu.chat')}
        <UnreadBadge count={channels.reduce((n, c) => n + unread(c), 0)} />
      </GameButton>
    );
  return (
    <section className="chat-dock" aria-label={t('menu.chat')}>
      <header className="chat-header">
        <GameTabs
          value={ui.channel}
          tabs={channels.map((id) => ({ id, label: t('chat.' + id), badge: unread(id) }))}
          onChange={(channel) =>
            chatUi.update((s) => ({ ...s, channel: channel as ChatMessage['channel'] }))
          }
        />
        <IconButton
          icon="minus"
          label={t('common.minimize')}
          onClick={() => chatUi.update((s) => ({ ...s, minimized: true }))}
        />
      </header>
      <div
        className="chat-messages"
        role="log"
        aria-live="polite"
        ref={list}
        style={{ fontSize: config.interface.chatSize }}
      >
        {messages
          .filter((m) => m.channel === ui.channel)
          .map((message) => (
            <p key={message.id} className={'chat-message ' + (message.decoration?.style ?? '')}>
              <time>{formatTime(Date.parse(message.sentAt))}</time>
              {message.decoration?.titleKey && <small>{t(message.decoration.titleKey)}</small>}
              <strong>{message.sender}</strong>
              <span>{message.textKey ? t(message.textKey) : message.text}</span>
            </p>
          ))}
        {ui.channel === 'guild' && <p className="muted">{t('chat.guildHint')}</p>}
      </div>
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          aria-label={t('chat.placeholder')}
          placeholder={t('chat.placeholder')}
          value={text}
          maxLength={500}
          disabled={ui.channel === 'system' || connection !== 'connected'}
          onChange={(e) => setText(e.target.value)}
        />
        <GameButton
          type="submit"
          loading={busy}
          disabled={!text.trim() || ui.channel === 'system' || connection !== 'connected'}
        >
          {t('common.send')}
        </GameButton>
      </form>
      {error && <ErrorState />}
    </section>
  );
}
