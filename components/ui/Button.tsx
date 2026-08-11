import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'onDark' | 'outlineDark';
type Size = 'sm' | 'md' | 'lg';

const base =
  'group relative inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em] transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-premium disabled:pointer-events-none disabled:opacity-55 active:translate-y-px';

const variants: Record<Variant, string> = {
  // Bright orange with near-black text (6.5:1). White on this shade is only
  // 2.9:1, so the label has to be dark for the button to stay bright.
  primary:
    'bg-brand-500 text-ink-950 shadow-[0_10px_30px_-12px_rgba(255,106,0,0.9)] hover:bg-brand-400 hover:shadow-[0_18px_40px_-14px_rgba(255,106,0,0.85)] hover:-translate-y-0.5',
  secondary:
    'border border-ink-200 bg-white text-ink-800 shadow-soft hover:-translate-y-0.5 hover:border-ink-300 hover:bg-ink-50',
  ghost: 'text-ink-700 hover:bg-ink-50 hover:text-ink-900',
  onDark:
    'bg-white text-ink-900 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.7)] hover:-translate-y-0.5 hover:bg-ink-50',
  // Secondary on a bright orange band — dark, since white text would not carry.
  outlineDark:
    'border border-ink-950/30 bg-ink-950/[0.04] text-ink-950 hover:-translate-y-0.5 hover:border-ink-950/55 hover:bg-ink-950/[0.08]',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-[0.95rem]',
  lg: 'h-[3.25rem] px-7 text-base',
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

type LinkProps = StyleProps & { href: string } & Omit<
    ComponentPropsWithoutRef<typeof Link>,
    'href' | 'className' | 'children'
  >;

type NativeProps = StyleProps & { href?: never } & Omit<
    ComponentPropsWithoutRef<'button'>,
    'className' | 'children'
  >;

export type ButtonProps = LinkProps | NativeProps;

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className);

  if ('href' in rest && typeof rest.href === 'string') {
    const linkProps = rest as Omit<LinkProps, keyof StyleProps> & { href: string };
    return (
      <Link className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  const buttonProps = rest as Omit<NativeProps, keyof StyleProps>;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
