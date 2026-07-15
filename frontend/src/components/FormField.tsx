import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseProps = {
  label: string;
  htmlFor: string;
};

export function TextInput({ label, htmlFor, ...props }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      <input id={htmlFor} {...props} />
    </div>
  );
}

export function TextArea({
  label,
  htmlFor,
  ...props
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      <textarea id={htmlFor} rows={4} {...props} />
    </div>
  );
}

export function SelectField({
  label,
  htmlFor,
  children,
  ...props
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      <select id={htmlFor} {...props}>
        {children}
      </select>
    </div>
  );
}

