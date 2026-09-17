import { settings, updateSettings } from '../settings';
/** Optional real tracks are registered centrally; no Audio instances in components. */
export class AudioService {
  private context?: AudioContext;
  private sounds = new Map<string, string>();
  private bgm?: HTMLAudioElement;
  private bgmId?: string;
  register(id: string, url: string) {
    this.sounds.set(id, url);
  }
  async unlock() {
    if (!this.context && typeof AudioContext !== 'undefined') this.context = new AudioContext();
    if (this.context?.state === 'suspended') await this.context.resume();
  }
  private volume(channel: 'ui' | 'sfx' | 'notification' | 'bgm') {
    const s = settings.get().sound;
    return s.master * s[channel];
  }
  playUi(id: string) {
    this.play(id, 'ui');
  }
  playSfx(id: string) {
    this.play(id, id.startsWith('notification.') ? 'notification' : 'sfx');
  }
  private play(id: string, channel: 'ui' | 'sfx' | 'notification') {
    const volume = this.volume(channel);
    if (!volume) return;
    const url = this.sounds.get(id);
    if (url) {
      const audio = new Audio(url);
      audio.volume = volume;
      void audio.play().catch(() => {});
      return;
    }
    if (!this.context || this.context.state !== 'running') return;
    const oscillator = this.context.createOscillator(),
      gain = this.context.createGain(),
      now = this.context.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.value = channel === 'notification' ? 660 : 440;
    gain.gain.setValueAtTime(volume * 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.07);
  }
  setBgm(id: string) {
    if (id === this.bgmId) return;
    this.stopBgm();
    this.bgmId = id;
    const url = this.sounds.get(id);
    if (url) {
      this.bgm = new Audio(url);
      this.bgm.loop = true;
      this.bgm.volume = this.volume('bgm');
      void this.bgm.play().catch(() => {});
    }
  }
  syncVolumes() {
    if (this.bgm) this.bgm.volume = this.volume('bgm');
  }
  stopBgm() {
    this.bgm?.pause();
    this.bgm = undefined;
    this.bgmId = undefined;
  }
  setMasterVolume(value: number) {
    updateSettings((s) => ({ ...s, sound: { ...s.sound, master: value } }));
  }
}
export const audioService = new AudioService();
settings.subscribe(() => audioService.syncVolumes());
