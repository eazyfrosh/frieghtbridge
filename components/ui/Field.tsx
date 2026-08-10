'use client';

import { AlertCircle } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const controlBase =
  'w-full rounded-xl border bg-white px-4 text-[0.95rem] text-ink-900 shadow-[0_1px_2px_rgba(11,21,36,0.04)] transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-ink-300 focus:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:bg-ink-50';

const controlState = (invalid: boolean) =>
  invalid
    ? 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.18)]'
    : 'border-ink-200 hover:border-ink-300 focus:border-brand-500 focus:shadow-[0_0_0_4px_rgba(250,91,10,0.14)]';

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function FieldShell({ id, label, hint, error, required, className, children }: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink-700">
        {label}
        {required && (
          <span className="ml-1 text-brand-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
}

export function TextField({ id, label, hint, error, className, required, ...rest }: TextFieldProps) {
  const invalid = Boolean(error);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <input
        id={id}
        name={id}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-required={required || undefined}
        className={cn(controlBase, controlState(invalid), 'h-12')}
        {...rest}
      />
    </FieldShell>
  );
}

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
}

export function TextAreaField({ id, label, hint, error, className, required, ...rest }: TextAreaFieldProps) {
  const invalid = Boolean(error);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <textarea
        id={id}
        name={id}
        rows={5}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-required={required || undefined}
        className={cn(controlBase, controlState(invalid), 'resize-y py-3 leading-relaxed')}
        {...rest}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className'> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function SelectField({
  id,
  label,
  hint,
  error,
  className,
  options,
  placeholder,
  required,
  ...rest
}: SelectFieldProps) {
  const invalid = Boolean(error);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <div className="relative">
        <select
          id={id}
          name={id}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-required={required || undefined}
          className={cn(
            controlBase,
            controlState(invalid),
            'h-12 appearance-none pr-10',
            rest.value === '' && 'text-ink-400',
          )}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
        >
          <path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
    </FieldShell>
  );
}

interface SegmentedProps {
  legend: string;
  name: string;
  value: string;
  options: Array<{ value: string; label: string; helper?: string }>;
  onChange: (value: string) => void;
  error?: string;
}

/** Accessible radio group styled as a segmented control. */
export function SegmentedField({ legend, name, value, options, onChange, error }: SegmentedProps) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-1 text-sm font-medium text-ink-700">{legend}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                'group flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-3 text-center transition-all duration-200 ease-premium',
                active
                  ? 'border-brand-500 bg-brand-50/70 shadow-[0_0_0_3px_rgba(250,91,10,0.12)]'
                  : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={active}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className={cn('text-sm font-semibold', active ? 'text-brand-700' : 'text-ink-700')}>
                {option.label}
              </span>
              {option.helper && <span className="text-[0.7rem] text-ink-400">{option.helper}</span>}
            </label>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </fieldset>
  );
}
