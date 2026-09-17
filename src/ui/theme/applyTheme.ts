import { theme, layers } from './tokens';
export function applyTheme(value = theme) {
  const root = document.documentElement;
  const names: Record<keyof typeof theme.colors, string> = {
    background: 'bg',
    surface: 'panel',
    surfaceElevated: 'elevated',
    border: 'border',
    borderStrong: 'border-strong',
    text: 'text',
    textMuted: 'muted',
    primary: 'primary',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    info: 'info',
  };
  for (const [key, color] of Object.entries(value.colors))
    root.style.setProperty('--game-' + names[key as keyof typeof names], color);
  for (const [key, spacing] of Object.entries(value.spacing))
    root.style.setProperty('--space-' + key, spacing + 'px');
  for (const [key, radius] of Object.entries(value.radius))
    root.style.setProperty('--radius-' + key, radius + 'px');
  for (const [key, duration] of Object.entries(value.motion))
    root.style.setProperty('--motion-' + key, duration + 'ms');
  for (const [key, layer] of Object.entries(layers))
    root.style.setProperty('--layer-' + key, String(layer));
}
