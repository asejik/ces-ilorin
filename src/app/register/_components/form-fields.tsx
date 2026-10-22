import type { ChangeEvent, ReactNode } from 'react';

const INPUT_CLASS =
  'w-full h-11 px-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none';
const SELECT_CLASS =
  'w-full h-11 px-3 text-sm rounded-lg border border-ink-200 bg-surface focus:ring-2 focus:ring-solar-500 focus:outline-none';
const TEXTAREA_CLASS =
  'w-full p-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none';

export type FieldChangeHandler = (
  e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => void;

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-ink-950 mb-1.5">
      {children}
      {required && (
        <>
          {' '}
          <span className="text-status-notyet-dot">*</span>
        </>
      )}
    </label>
  );
}

interface TextFieldProps {
  label: string;
  name: string;
  placeholder: string;
  type?: 'text' | 'tel' | 'email';
  required?: boolean;
  value?: string;
  onChange?: FieldChangeHandler;
}

export function TextField({
  label,
  name,
  placeholder,
  type = 'text',
  required,
  value,
  onChange,
}: TextFieldProps) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        name={name}
        {...(value !== undefined ? { value, onChange } : {})}
        required={required}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  name: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: FieldChangeHandler;
  required?: boolean;
}

export function SelectField({
  label,
  name,
  placeholder,
  options,
  value,
  onChange,
  required,
}: SelectFieldProps) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={SELECT_CLASS}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TextAreaField({
  label,
  name,
  placeholder,
  wrapperClassName,
}: {
  label: string;
  name: string;
  placeholder: string;
  wrapperClassName?: string;
}) {
  return (
    <div className={wrapperClassName}>
      <FieldLabel>{label}</FieldLabel>
      <textarea name={name} rows={2} placeholder={placeholder} className={TEXTAREA_CLASS} />
    </div>
  );
}

export const YES_NO_OPTIONS = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];
