import { LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert } from "../components/Alert";
import { TextInput } from "../components/FormField";
import { useAuth } from "../hooks/useAuth";
import { ApiClientError } from "../lib/api";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const registered = Boolean((location.state as { registered?: boolean } | null)?.registered);
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "ログインに失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <section className="panel p-5 sm:p-6">
        <h1 className="text-2xl font-bold">ログイン</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {registered && <Alert tone="success" message="登録が完了しました" />}
          {error && <Alert message={error} />}
          <TextInput
            label="email"
            htmlFor="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <TextInput
            label="password"
            htmlFor="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            <LogIn size={18} aria-hidden />
            ログイン
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          はじめての方は{" "}
          <Link className="font-semibold text-campus hover:underline" to="/register">
            ユーザー登録
          </Link>
        </p>
      </section>
    </div>
  );
}

