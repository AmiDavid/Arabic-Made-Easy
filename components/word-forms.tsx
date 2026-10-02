import Link from 'next/link';
import { parseForms, FORM_LABEL } from '@/lib/forms';
import { verbInfo, VERB_CASES } from '@/lib/verbs';
import { cn } from '@/lib/utils';

/**
 * Shows a notebook word with both of its forms:
 *   بَيت                    حَكَى                 [S.C.4]
 *   pl. بُيُوت              present ✦ يِحكِي      (✦ = suggested, not in the notebook)
 */
export function WordWithForms({
  arabic,
  english = '',
  notes,
  size = 'md',
  align = 'right',
  hideSecond = false,
  showVerbCase = false,
  className,
}: {
  arabic: string;
  english?: string;
  notes?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'right' | 'center';
  hideSecond?: boolean;
  showVerbCase?: boolean;
  className?: string;
}) {
  const f = parseForms(arabic, english);
  const v = verbInfo(arabic, english, notes);
  const suggested = !f.second && v?.present && v.presentSuggested ? v.present : null;
  const mainSize = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl', xl: 'text-3xl' }[size];
  const secondSize = { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-2xl' }[size];
  const hasSecondLine = !hideSecond && (f.second || f.feminine || suggested);
  return (
    <div className={cn(align === 'center' ? 'text-center' : 'text-right', className)}>
      <div
        className={cn(
          'flex items-center gap-2',
          align === 'center' ? 'justify-center' : 'justify-end'
        )}
      >
        {showVerbCase && v && <VerbCaseBadge verbCase={v.verbCase} />}
        <span className={cn('arabic leading-snug', mainSize)}>{f.main}</span>
      </div>
      {hasSecondLine && (
        <div
          className={cn(
            '-mt-1 flex flex-wrap gap-x-3 gap-y-0.5 items-baseline',
            align === 'center' ? 'justify-center' : 'justify-end'
          )}
        >
          {f.feminine && <FormChip label="f." text={f.feminine} size={secondSize} />}
          {f.second && f.kind && <FormChip label={FORM_LABEL[f.kind].short} text={f.second} size={secondSize} />}
          {suggested && <FormChip label="present ✦" text={suggested} size={secondSize} suggested />}
        </div>
      )}
    </div>
  );
}

export function FormChip({
  label,
  text,
  size = 'text-base',
  suggested = false,
}: {
  label: string;
  text: string;
  size?: string;
  suggested?: boolean;
}) {
  return (
    <span
      className="inline-flex items-baseline gap-1.5"
      dir="ltr"
      title={suggested ? 'Suggested: not written in your notebook' : undefined}
    >
      <span
        className={cn(
          'text-[11px] tracking-wide font-semibold',
          suggested ? 'text-sky-300/70' : 'text-gold-400/80'
        )}
      >
        {label}
      </span>
      <span
        className={cn('arabic leading-tight', suggested ? 'text-stone-200/55' : 'text-stone-200/85', size)}
        dir="rtl"
      >
        {text}
      </span>
    </span>
  );
}

export function VerbCaseBadge({ verbCase }: { verbCase: keyof typeof VERB_CASES }) {
  const c = VERB_CASES[verbCase];
  return (
    <Link
      href={`/grammar?open=${c.slug}`}
      title={`${c.long}: open the grammar card`}
      className={cn(
        'shrink-0 text-[10px] font-semibold rounded-full px-2 py-0.5 border',
        verbCase === 'regular'
          ? 'border-white/10 text-stone-200/50'
          : 'border-gold-500/40 text-gold-300 bg-gold-500/10'
      )}
    >
      {c.label}
    </Link>
  );
}
