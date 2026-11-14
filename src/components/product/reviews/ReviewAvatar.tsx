import { cn } from '@/utils/cn';

/** Initial-circle avatar derived from a public display name. */
export function ReviewAvatar({ name }: { name: string }) {
  const palette = [
    'bg-emerald-100 text-emerald-800',
    'bg-amber-100 text-amber-800',
    'bg-sky-100 text-sky-800',
    'bg-rose-100 text-rose-800',
    'bg-violet-100 text-violet-800',
  ];
  const tone = palette[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % palette.length];
  return (
    <span
      className={cn('inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold', tone)}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}
