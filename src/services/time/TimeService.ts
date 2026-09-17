import { Atom } from '../../core/state/atom';
export function remainingSeconds(end: string, now: number) {
  return Math.max(0, Math.ceil((Date.parse(end) - now) / 1000));
}
export function formatCountdown(seconds: number) {
  return (
    Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0') +
    ':' +
    (seconds % 60).toString().padStart(2, '0')
  );
}
export class TimeService {
  private offset = 0;
  private timer?: ReturnType<typeof setInterval>;
  tick = new Atom(Date.now());
  now = () => Date.now() + this.offset;
  sync(serverTime: string, requestStarted = Date.now(), received = Date.now()) {
    this.offset = Date.parse(serverTime) - (requestStarted + received) / 2;
    this.tick.set(this.now());
  }
  start() {
    if (!this.timer) {
      this.timer = setInterval(() => this.tick.set(this.now()), 250);
      document.addEventListener('visibilitychange', this.refresh);
    }
  }
  private refresh = () => {
    if (!document.hidden) this.tick.set(this.now());
  };
  stop() {
    clearInterval(this.timer);
    this.timer = undefined;
    document.removeEventListener('visibilitychange', this.refresh);
  }
}
export const timeService = new TimeService();
