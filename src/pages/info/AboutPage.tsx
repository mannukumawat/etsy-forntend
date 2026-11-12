import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLocalized } from '@/hooks/useLocale';
import { contentService } from '@/services/contentService';
import { cn } from '@/utils/cn';

interface AboutSection {
  heading: string;
  body: string;
  image?: string | null;
}

/** Blank line = new paragraph. */
function Paragraphs({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => (
        <p key={i} className={cn('whitespace-pre-line', className)}>
          {p}
        </p>
      ))}
    </>
  );
}

function Hero({ eyebrow, title, intro, image }: { eyebrow: string; title: string; intro: string; image?: string | null }) {
  if (image) {
    return (
      <header className="relative isolate overflow-hidden bg-ink">
        <img src={image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/50 to-ink/20" aria-hidden />
        <div className="container-site flex min-h-[26rem] flex-col justify-end pb-12 pt-32 lg:min-h-[34rem] lg:pb-20">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-200">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] !text-white lg:text-7xl">{title}</h1>
          {intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85 lg:text-xl">{intro}</p>}
        </div>
      </header>
    );
  }
  return (
    <header className="relative isolate overflow-hidden bg-gradient-to-b from-brand-50 via-ivory to-ivory">
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-brand-100/60 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-24 bottom-0 -z-10 h-64 w-64 rounded-full bg-sage-100 blur-3xl" aria-hidden />
      <div className="container-site py-20 text-center lg:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">{eyebrow}</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-5xl leading-[1.05] lg:text-7xl">{title}</h1>
        {intro && <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft lg:text-xl">{intro}</p>}
      </div>
    </header>
  );
}

function SectionBlock({ section, index }: { section: AboutSection; index: number }) {
  const number = String(index + 1).padStart(2, '0');
  const flip = index % 2 === 1;

  if (section.image) {
    return (
      <section className="container-site py-12 lg:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className={cn('relative', flip && 'lg:order-2')}>
            <div className="absolute -inset-3 -z-10 rounded-[1.75rem] border border-brand-200/70 lg:-inset-4" aria-hidden />
            <img src={section.image} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lift" />
          </div>
          <div className={cn(flip && 'lg:order-1')}>
            <span className="font-serif text-5xl font-semibold text-brand-200" aria-hidden>
              {number}
            </span>
            <h2 className="mt-1 text-3xl lg:text-4xl">{section.heading}</h2>
            <div className="mt-2 h-px w-14 bg-brand-500" aria-hidden />
            <div className="mt-5 space-y-4">
              <Paragraphs text={section.body} className="text-base leading-relaxed text-ink-soft lg:text-[16px]" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container-site py-10 lg:py-14">
      <div className="mx-auto max-w-3xl text-center">
        <span className="font-serif text-4xl font-semibold text-brand-200" aria-hidden>
          {number}
        </span>
        <h2 className="mt-1 text-3xl lg:text-4xl">{section.heading}</h2>
        <div className="mx-auto mt-3 h-px w-14 bg-brand-500" aria-hidden />
        <div className="mt-5 space-y-4">
          <Paragraphs text={section.body} className="text-base leading-relaxed text-ink-soft lg:text-[16px]" />
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const { data: live } = useAsync('content:page:about', () => contentService.getPage('about'));
  const content = live?.content;

  const title = content ? loc(content.title) : t('pages.about.title');
  const intro = content ? loc(content.intro) : t('pages.about.intro');
  const heroImage = content?.heroImage ?? null;
  const sections: AboutSection[] = content
    ? content.sections.map((s) => ({ heading: loc(s.heading), body: loc(s.body), image: s.image ?? null }))
    : (t('pages.about.sections', { returnObjects: true }) as AboutSection[]);

  useDocumentTitle(title);

  return (
    <article>
      <Hero eyebrow={t('pages.about.eyebrow', { defaultValue: 'Our story' })} title={title} intro={intro} image={heroImage} />

      <div className="divide-y divide-sand-200/70">
        {sections.map((s, i) => (
          <Fragment key={`${i}-${s.heading}`}>
            <SectionBlock section={s} index={i} />
          </Fragment>
        ))}
      </div>

      <section className="mt-8 bg-ink text-white lg:mt-12">
        <div className="container-site flex flex-col items-center gap-6 py-14 text-center lg:py-20">
          <h2 className="max-w-2xl text-3xl !text-white lg:text-4xl">{t('pages.about.ctaHeading', { defaultValue: 'Bring a piece of the craft home' })}</h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ButtonLink to="/shop" size="lg" icon={<ArrowRight className="order-last h-4 w-4" aria-hidden />}>
              {t('pages.about.cta')}
            </ButtonLink>
            <ButtonLink to="/contact" size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
              {t('nav.contact')}
            </ButtonLink>
          </div>
        </div>
      </section>
    </article>
  );
}
