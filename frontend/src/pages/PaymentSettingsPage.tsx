import { CreditCard, Save, Store, WalletCards } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../components/Alert";
import { SelectField, TextInput } from "../components/FormField";
import { useAuth } from "../hooks/useAuth";
import { ApiClientError, api } from "../lib/api";
import {
  cardBrandLabels,
  convenienceStoreLabels,
  paymentMethodLabels
} from "../lib/format";
import type {
  CardBrand,
  ConvenienceStoreChain,
  PaymentSettings,
  StoredPaymentMethod
} from "../types/api";

const emptySettings: PaymentSettings = {
  preferredMethod: "credit_card",
  creditCard: {
    holderName: "",
    brand: "visa",
    last4: "",
    expiryMonth: 1,
    expiryYear: new Date().getFullYear()
  },
  convenienceStore: {
    chain: "seven_eleven",
    payerName: "",
    payerPhone: ""
  },
  updatedAt: null
};

function toErrorMessage(caught: unknown, fallback: string) {
  if (caught instanceof ApiClientError) {
    return caught.message;
  }

  if (caught instanceof Error) {
    return caught.message;
  }

  return fallback;
}

export function PaymentSettingsPage() {
  const { refreshMe } = useAuth();
  const [settings, setSettings] = useState<PaymentSettings>(emptySettings);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api
      .myPaymentSettings()
      .then((response) => {
        setSettings({
          ...emptySettings,
          ...response,
          creditCard: response.creditCard ?? emptySettings.creditCard,
          convenienceStore: response.convenienceStore ?? emptySettings.convenienceStore
        });
      })
      .catch((caught) => {
        setError(toErrorMessage(caught, "支払い設定の取得に失敗しました"));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const updatePreferredMethod = (preferredMethod: StoredPaymentMethod) => {
    setSettings((current) => ({
      ...current,
      preferredMethod
    }));
  };

  const updateCardField = <K extends keyof NonNullable<PaymentSettings["creditCard"]>>(
    key: K,
    value: NonNullable<PaymentSettings["creditCard"]>[K]
  ) => {
    setSettings((current) => {
      const creditCard = current.creditCard
        ? { ...current.creditCard }
        : { ...emptySettings.creditCard! };

      creditCard[key] = value;

      return {
        ...current,
        creditCard
      };
    });
  };

  const updateConvenienceField = <K extends keyof NonNullable<PaymentSettings["convenienceStore"]>>(
    key: K,
    value: NonNullable<PaymentSettings["convenienceStore"]>[K]
  ) => {
    setSettings((current) => {
      const convenienceStore = current.convenienceStore
        ? { ...current.convenienceStore }
        : { ...emptySettings.convenienceStore! };

      convenienceStore[key] = value;

      return {
        ...current,
        convenienceStore
      };
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);

    try {
      const payload = {
        preferredMethod: settings.preferredMethod,
        creditCard:
          settings.creditCard && settings.creditCard.last4.trim()
            ? {
                ...settings.creditCard,
                holderName: settings.creditCard.holderName.trim(),
                last4: settings.creditCard.last4.trim()
              }
            : null,
        convenienceStore:
          settings.convenienceStore && settings.convenienceStore.payerName.trim()
            ? {
                ...settings.convenienceStore,
                payerName: settings.convenienceStore.payerName.trim(),
                payerPhone: settings.convenienceStore.payerPhone.trim()
              }
            : null
      } satisfies Omit<PaymentSettings, "updatedAt">;

      const response = await api.updatePaymentSettings(payload);
      setSettings({
        ...emptySettings,
        ...response.paymentSettings,
        creditCard: response.paymentSettings.creditCard ?? emptySettings.creditCard,
        convenienceStore: response.paymentSettings.convenienceStore ?? emptySettings.convenienceStore
      });
      setNotice(response.message);
      await refreshMe();
    } catch (caught) {
      setError(toErrorMessage(caught, "支払い設定の保存に失敗しました"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="panel py-12 text-center text-slate-500">支払い設定を読み込み中...</div>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="panel p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <WalletCards size={22} className="text-campus" aria-hidden />
          <h1 className="text-2xl font-bold">支払い設定</h1>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          ポイント購入で使う優先支払い方法と、入力補助用の保存情報を管理します。
        </p>
        {error && <Alert message={error} />}
        {notice && <Alert tone="success" message={notice} />}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              className={[
                "rounded-lg border p-4 text-left transition",
                settings.preferredMethod === "credit_card"
                  ? "border-campus bg-teal-50"
                  : "border-line bg-white hover:border-campus/40"
              ].join(" ")}
              onClick={() => updatePreferredMethod("credit_card")}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CreditCard size={17} aria-hidden />
                {paymentMethodLabels.credit_card}
              </div>
              <p className="mt-2 text-sm text-slate-500">優先設定にすると、ポイント購入フォームの初期値に反映します。</p>
            </button>

            <button
              type="button"
              className={[
                "rounded-lg border p-4 text-left transition",
                settings.preferredMethod === "convenience_store"
                  ? "border-campus bg-teal-50"
                  : "border-line bg-white hover:border-campus/40"
              ].join(" ")}
              onClick={() => updatePreferredMethod("convenience_store")}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Store size={17} aria-hidden />
                {paymentMethodLabels.convenience_store}
              </div>
              <p className="mt-2 text-sm text-slate-500">支払い先コンビニと名義を保存して、購入操作を短くします。</p>
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-line bg-slate-50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-campus" aria-hidden />
                <h2 className="text-base font-bold">クレジットカード</h2>
              </div>
              <div className="space-y-4">
                <TextInput
                  label="カード名義"
                  htmlFor="cardHolderName"
                  value={settings.creditCard?.holderName ?? ""}
                  onChange={(event) => updateCardField("holderName", event.target.value)}
                  required={settings.preferredMethod === "credit_card"}
                />
                <SelectField
                  label="ブランド"
                  htmlFor="cardBrand"
                  value={settings.creditCard?.brand ?? "visa"}
                  onChange={(event) => updateCardField("brand", event.target.value as CardBrand)}
                >
                  {Object.entries(cardBrandLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </SelectField>
                <TextInput
                  label="カード番号下4桁"
                  htmlFor="cardLast4"
                  inputMode="numeric"
                  maxLength={4}
                  value={settings.creditCard?.last4 ?? ""}
                  onChange={(event) =>
                    updateCardField("last4", event.target.value.replace(/[^\d]/g, "").slice(0, 4))
                  }
                  required={settings.preferredMethod === "credit_card"}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput
                    label="有効期限(月)"
                    htmlFor="cardExpiryMonth"
                    type="number"
                    min={1}
                    max={12}
                    value={settings.creditCard?.expiryMonth ?? 1}
                    onChange={(event) => updateCardField("expiryMonth", Number(event.target.value))}
                    required={settings.preferredMethod === "credit_card"}
                  />
                  <TextInput
                    label="有効期限(年)"
                    htmlFor="cardExpiryYear"
                    type="number"
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 20}
                    value={settings.creditCard?.expiryYear ?? new Date().getFullYear()}
                    onChange={(event) => updateCardField("expiryYear", Number(event.target.value))}
                    required={settings.preferredMethod === "credit_card"}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-slate-50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Store size={18} className="text-campus" aria-hidden />
                <h2 className="text-base font-bold">コンビニ払い</h2>
              </div>
              <div className="space-y-4">
                <SelectField
                  label="利用コンビニ"
                  htmlFor="convenienceChain"
                  value={settings.convenienceStore?.chain ?? "seven_eleven"}
                  onChange={(event) =>
                    updateConvenienceField("chain", event.target.value as ConvenienceStoreChain)
                  }
                >
                  {Object.entries(convenienceStoreLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </SelectField>
                <TextInput
                  label="支払人名"
                  htmlFor="payerName"
                  value={settings.convenienceStore?.payerName ?? ""}
                  onChange={(event) => updateConvenienceField("payerName", event.target.value)}
                  required={settings.preferredMethod === "convenience_store"}
                />
                <TextInput
                  label="電話番号"
                  htmlFor="payerPhone"
                  inputMode="tel"
                  value={settings.convenienceStore?.payerPhone ?? ""}
                  onChange={(event) =>
                    updateConvenienceField("payerPhone", event.target.value.replace(/[^\d]/g, "").slice(0, 11))
                  }
                  required={settings.preferredMethod === "convenience_store"}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary" disabled={isSaving}>
              <Save size={17} aria-hidden />
              保存する
            </button>
            <Link to="/mypage" className="btn-secondary">
              マイページへ戻る
            </Link>
          </div>
        </form>
      </section>

      <aside className="space-y-5">
        <section className="panel p-5">
          <h2 className="text-base font-bold">現在の優先方法</h2>
          <p className="mt-2 text-sm text-slate-600">{paymentMethodLabels[settings.preferredMethod]}</p>
          {settings.updatedAt && (
            <p className="mt-3 text-xs text-slate-500">最終更新: {new Date(settings.updatedAt).toLocaleString("ja-JP")}</p>
          )}
        </section>

        <section className="panel p-5">
          <h2 className="text-base font-bold">保存内容</h2>
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="font-semibold text-slate-700">カード設定</p>
              {settings.creditCard ? (
                <p className="mt-1">
                  {cardBrandLabels[settings.creditCard.brand]} / 下4桁 {settings.creditCard.last4}
                </p>
              ) : (
                <p className="mt-1">未設定</p>
              )}
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="font-semibold text-slate-700">コンビニ設定</p>
              {settings.convenienceStore ? (
                <p className="mt-1">{convenienceStoreLabels[settings.convenienceStore.chain]}</p>
              ) : (
                <p className="mt-1">未設定</p>
              )}
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
