import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export function ProductDetailAccordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group py-1">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="pb-5 text-ink-soft">{children}</div>
    </details>
  );
}
