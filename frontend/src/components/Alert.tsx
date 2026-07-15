type AlertProps = {
  title?: string;
  message: string;
  tone?: "error" | "success" | "info";
};

const toneClass = {
  error: "border-rose-200 bg-rose-50 text-rose-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-sky-200 bg-sky-50 text-sky-800"
};

export function Alert({ title, message, tone = "error" }: AlertProps) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${toneClass[tone]}`} role="alert">
      {title && <p className="font-semibold">{title}</p>}
      <p>{message}</p>
    </div>
  );
}

