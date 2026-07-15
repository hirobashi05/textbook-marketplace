import { UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "../components/Alert";
import { TextInput } from "../components/FormField";
import { ApiClientError, api } from "../lib/api";

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await api.register({ email, name, password });
      navigate("/login", { state: { registered: true } });
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "登録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <section className="panel p-5 sm:p-6">
        <h1 className="text-2xl font-bold">ユーザー登録</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {error && <Alert message={error} />}
          <TextInput
            label="大学メール"
            htmlFor="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <TextInput
            label="名前"
            htmlFor="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <TextInput
            label="パスワード"
            htmlFor="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            <UserPlus size={18} aria-hidden />
            登録
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          登録済みの方は{" "}
          <Link className="font-semibold text-campus hover:underline" to="/login">
            ログイン
          </Link>
        </p>
      </section>
    </div>
  );
}

