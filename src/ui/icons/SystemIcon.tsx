export type SystemIconName =
  'close' | 'minus' | 'plus' | 'expand' | 'dock' | 'back' | 'bell' | 'sound' | 'refresh' | 'lock';
const paths: Record<SystemIconName, string> = {
  close: 'M6 6l12 12M18 6 6 18',
  minus: 'M5 12h14',
  plus: 'M5 12h14M12 5v14',
  expand: 'M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5',
  dock: 'M4 5h16v14H4zM15 5v14',
  back: 'm14 5-7 7 7 7',
  bell: 'M6 17h12l-2-4V9a4 4 0 0 0-8 0v4zM10 20h4',
  sound: 'M4 9h4l5-4v14l-5-4H4zM17 8q5 4 0 8',
  refresh: 'M19 9a8 8 0 1 0 0 7M19 4v5h-5',
  lock: 'M6 10h12v10H6zM8 10V6a4 4 0 0 1 8 0v4',
};
export function SystemIcon({ name }: { name: SystemIconName }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
