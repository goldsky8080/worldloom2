import { useRef, useState } from 'react';
import { runtime } from '../../app/bootstrap/services';
import type { GameCommand } from '../contracts';
import { useAtom } from '../state/useAtom';
export function useCommand() {
  const [id, setId] = useState<string | null>(null),
    [sending, setSending] = useState(false),
    [errorKey, setErrorKey] = useState<string | null>(null);
  const lock = useRef(false),
    last = useRef<GameCommand | null>(null),
    commands = useAtom(runtime.commands),
    connection = useAtom(runtime.connection);
  const tracked = id ? commands[id] : undefined;
  const busy =
    sending ||
    tracked?.status === 'REQUESTED' ||
    tracked?.status === 'ACCEPTED' ||
    tracked?.status === 'EXECUTING';
  async function send(command: GameCommand) {
    if (lock.current || busy) return;
    lock.current = true;
    last.current = command;
    setId(command.commandId);
    setSending(true);
    setErrorKey(null);
    try {
      await runtime.send(command);
    } catch (error) {
      const key = error instanceof Error ? error.message : '';
      setErrorKey(/^(auth|common|command|world|mining|storage)\./.test(key) ? key : 'common.error');
    } finally {
      setSending(false);
      lock.current = false;
    }
  }
  return {
    send,
    retry: () => {
      if (last.current) void send(last.current);
    },
    busy,
    tracked,
    errorKey: errorKey ?? tracked?.errorKey,
    disabled: busy || connection !== 'connected',
  };
}
