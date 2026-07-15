import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseProps = {
  label: string;
  htmlFor: string;
  optional?: boolean;
};

function FieldLabel({
  label,
  htmlFor,
  required,
  optional
}: BaseProps & { required?: boolean }) {
  return (
    <label htmlFor={htmlFor}>
      {label}
      {required && (
        <span className="ml-1 text-red-600" aria-label="必須">
          *
        </span>
      )}
      {optional && <span className="ml-1 text-xs font-normal text-slate-500">[任意]</span>}
    </label>
  );
}

export function TextInput({
  label,
  htmlFor,
  optional,
  required,
  ...props
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <FieldLabel label={label} htmlFor={htmlFor} required={required} optional={optional} />
      <input id={htmlFor} required={required} {...props} />
    </div>
  );
}

export function TextArea({
  label,
  htmlFor,
  optional,
  required,
  ...props
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="field">
      <FieldLabel label={label} htmlFor={htmlFor} required={required} optional={optional} />
      <textarea id={htmlFor} rows={4} required={required} {...props} />
    </div>
  );
}

export function SelectField({
  label,
  htmlFor,
  children,
  optional,
  required,
  ...props
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="field">
      <FieldLabel label={label} htmlFor={htmlFor} required={required} optional={optional} />
      <select id={htmlFor} required={required} {...props}>
        {children}
      </select>
    </div>
  );
}
