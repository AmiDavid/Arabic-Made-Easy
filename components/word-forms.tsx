import { parseForms, FORM_LABEL } from '@/lib/forms';
import { cn } from '@/lib/utils';

/**
 * Shows a notebook word with both of its forms:
 *   بَيت                    مَشَى / حَكَى
 *   pl. بُيُوت              present  بِيحكِي
 */
export function WordWithForms({
  arabic,
  english,
  size = 'md',
  align = 'right',
  hideSecond = false,
  className,
}: {
  arabic: string;
  english?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'right' | 'center';
  hideSecond?: boolean;
  className?: string;
}) {
  const f = parseForms(arabic, english);
  const mainSize = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl', xl: 'text-3xl' }[size];
  const secondSize = { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-2xl' }[size];
  return (
    <div className={cn(align === 'center' ? 'text-center' : 'text-right', className)}>
      <div className={cn('arabic leading-snug', mainSize)}>{f.main}</div>
      {!hideSecond && (f.second || f.feminine) && (
        <div
          className={cn(
            '-mt-1 flex flex-wrap gap-x-3 gap-y-0.5 items-baseline',
            align === 'center' ? 'justify-center' : 'justify-end'
          )}
        >
          {f.feminine && <FormChip label="f." text={f.feminine} size={secondSize} />}
          {f.second && f.kind && <FormChip label={FORM_LABEL[f.kind].short} text={f.second} size={secondSize} />}
        </div>
      )}
    </div>
  );
}

export function FormChip({ label, text, size = 'text-base' }: { label: string; text: string; size?: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5" dir="ltr">
      <span className="text-[11px] tracking-wide text-gold-400/80 font-semibold">{label}</span>
      <span className={cn('arabic leading-tight text-stone-200/85', size)} dir="rtl">
        {text}
      </span>
    </span>
  );
}
