import { Atom } from '../../core/state/atom';
export class FeatureFlagService {
  flags = new Atom<Record<string, boolean>>({
    MINING_ENABLED: true,
    MAIL_ENABLED: true,
    PVP_ENABLED: false,
    GUILD_ENABLED: false,
  });
  enabled(flag?: string) {
    return !flag || this.flags.get()[flag] === true;
  }
  set(flag: string, value: boolean) {
    this.flags.update((flags) => ({ ...flags, [flag]: value }));
  }
}
export const featureFlags = new FeatureFlagService();
