import { BookPlus, Image as ImageIcon, LoaderCircle, Plus, Save } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "../components/Alert";
import { SelectField, TextArea, TextInput } from "../components/FormField";
import { ApiClientError, api } from "../lib/api";
import { academicFaculties, getDepartmentsForFaculty } from "../lib/academicOptions";
import { yen } from "../lib/format";
import type { ListingCondition, Textbook } from "../types/api";

const conditionOptions: Array<{ value: ListingCondition; label: string }> = [
  { value: "new", label: "新品同様" },
  { value: "good", label: "良好" },
  { value: "fair", label: "使用感あり" },
  { value: "poor", label: "傷みあり" },
  { value: "has_writing", label: "書き込みあり" }
];

const emptyTextbookForm = {
  isbn: "",
  title: "",
  publisher: "",
  listPrice: 3000,
  courseName: "",
  faculty: "",
  department: "",
  academicYear: 1,
  imageUrl: ""
};

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string" || !reader.result) {
        reject(new Error("画像データを読み込めませんでした"));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => reject(new Error("画像データの読み込みに失敗しました"));
    reader.readAsDataURL(blob);
  });
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("画像を圧縮できませんでした"));
        return;
      }

      resolve(blob);
    }, "image/webp", quality);
  });
}

async function prepareImageFile(file: File) {
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("画像サイズは12MB以下にしてください");
  }

  const bitmap = await createImageBitmap(file);

  try {
    for (const maxDimension of [1280, 960, 720]) {
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("画像を処理できませんでした");
      }

      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.82, 0.68, 0.55]) {
        const blob = await canvasToWebp(canvas, quality);

        if (blob.size <= 1_200_000) {
          const baseName = file.name.replace(/\.[^.]+$/u, "") || "textbook";
          return {
            fileName: `${baseName}.webp`,
            dataUrl: await readBlobAsDataUrl(blob)
          };
        }
      }
    }
  } finally {
    bitmap.close();
  }

  throw new Error("画像を十分に圧縮できませんでした。別の画像を選択してください");
}

function toErrorMessage(caught: unknown, fallback: string) {
  if (caught instanceof ApiClientError) {
    return caught.message;
  }

  if (caught instanceof Error) {
    return caught.message;
  }

  return fallback;
}

type ImageUploadFieldProps = {
  label: string;
  htmlFor: string;
  previewUrl: string;
  isUploading: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
};

function ImageUploadField({
  label,
  htmlFor,
  previewUrl,
  isUploading,
  onChange,
  required
}: ImageUploadFieldProps) {
  return (
    <div className="space-y-3">
      <div className="field">
        <label htmlFor={htmlFor}>{label}</label>
        <input
          id={htmlFor}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onChange}
          required={required}
        />
      </div>
      <div className="rounded-lg border border-line bg-white p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
          {isUploading ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <ImageIcon size={16} aria-hidden />}
          画像プレビュー
        </div>
        {previewUrl ? (
          <img src={previewUrl} alt="画像プレビュー" className="h-44 w-full rounded-lg object-cover" />
        ) : (
          <div className="flex h-44 items-center justify-center rounded-lg border border-dashed border-line bg-slate-50 text-sm text-slate-500">
            画像を選択してください
          </div>
        )}
      </div>
    </div>
  );
}

export function CreateListingPage() {
  const navigate = useNavigate();
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [masterId, setMasterId] = useState("");
  const [sellingPrice, setSellingPrice] = useState(1200);
  const [condition, setCondition] = useState<ListingCondition>("good");
  const [imageUrl, setImageUrl] = useState("");
  const [listingPreviewUrl, setListingPreviewUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListingImageUploading, setIsListingImageUploading] = useState(false);
  const [isTextbookImageUploading, setIsTextbookImageUploading] = useState(false);
  const [newTextbook, setNewTextbook] = useState(emptyTextbookForm);
  const [textbookPreviewUrl, setTextbookPreviewUrl] = useState("");

  useEffect(() => {
    api
      .textbooks()
      .then((items) => {
        setTextbooks(items);
        if (items[0]) {
          setMasterId(items[0].id);
          setImageUrl(items[0].imageUrl);
          setListingPreviewUrl(items[0].imageUrl);
        }
      })
      .catch((caught) => {
        setError(toErrorMessage(caught, "教科書マスタの取得に失敗しました"));
      });
  }, []);

  const selectedTextbook = useMemo(
    () => textbooks.find((textbook) => textbook.id === masterId),
    [textbooks, masterId]
  );
  const departmentOptions = getDepartmentsForFaculty(newTextbook.faculty);

  const handleMasterChange = (nextMasterId: string) => {
    setMasterId(nextMasterId);
    const textbook = textbooks.find((item) => item.id === nextMasterId);
    const nextImageUrl = textbook?.imageUrl ?? "";

    setImageUrl(nextImageUrl);
    setListingPreviewUrl(nextImageUrl);
  };

  const handleFacultyChange = (faculty: string) => {
    setNewTextbook((current) => ({
      ...current,
      faculty,
      department: ""
    }));
  };

  const uploadImageFile = async (fileName: string, dataUrl: string) => {
    const uploaded = await api.uploadImage({
      fileName,
      dataUrl
    });

    return uploaded.imageUrl;
  };

  const handleListingImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const previousImageUrl = imageUrl;
    const previousPreviewUrl = listingPreviewUrl;

    setError("");
    setNotice("");
    setIsListingImageUploading(true);

    try {
      const preparedImage = await prepareImageFile(file);
      setListingPreviewUrl(preparedImage.dataUrl);
      const uploadedImageUrl = await uploadImageFile(preparedImage.fileName, preparedImage.dataUrl);
      setImageUrl(uploadedImageUrl);
      setListingPreviewUrl(uploadedImageUrl);
    } catch (caught) {
      setImageUrl(previousImageUrl);
      setListingPreviewUrl(previousPreviewUrl);
      setError(toErrorMessage(caught, "商品の画像アップロードに失敗しました"));
    } finally {
      setIsListingImageUploading(false);
    }
  };

  const handleTextbookImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const previousImageUrl = newTextbook.imageUrl;
    const previousPreviewUrl = textbookPreviewUrl;

    setError("");
    setNotice("");
    setIsTextbookImageUploading(true);

    try {
      const preparedImage = await prepareImageFile(file);
      setTextbookPreviewUrl(preparedImage.dataUrl);
      const uploadedImageUrl = await uploadImageFile(preparedImage.fileName, preparedImage.dataUrl);
      setNewTextbook((current) => ({ ...current, imageUrl: uploadedImageUrl }));
      setTextbookPreviewUrl(uploadedImageUrl);
    } catch (caught) {
      setNewTextbook((current) => ({ ...current, imageUrl: previousImageUrl }));
      setTextbookPreviewUrl(previousPreviewUrl);
      setError(toErrorMessage(caught, "教科書画像のアップロードに失敗しました"));
    } finally {
      setIsTextbookImageUploading(false);
    }
  };

  const handleCreateListing = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const listing = await api.createListing({
        masterId,
        sellingPrice,
        condition,
        imageUrl,
        description: description || undefined
      });

      navigate(`/listings/${listing.id}`);
    } catch (caught) {
      setError(toErrorMessage(caught, "出品に失敗しました"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTextbook = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const textbook = await api.createTextbook(newTextbook);
      setTextbooks((current) => [textbook, ...current]);
      setMasterId(textbook.id);
      setImageUrl(textbook.imageUrl);
      setListingPreviewUrl(textbook.imageUrl);
      setNotice("教科書マスタを追加しました");
      setNewTextbook(emptyTextbookForm);
      setTextbookPreviewUrl("");
    } catch (caught) {
      setError(toErrorMessage(caught, "教科書マスタの追加に失敗しました"));
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <section className="panel p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <BookPlus size={22} className="text-campus" aria-hidden />
          <h1 className="text-2xl font-bold">教科書を出品</h1>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleCreateListing}>
          {error && <Alert message={error} />}
          {notice && <Alert tone="success" message={notice} />}

          <SelectField
            label="教科書マスタ"
            htmlFor="masterId"
            value={masterId}
            onChange={(event) => handleMasterChange(event.target.value)}
            required
          >
            {textbooks.map((textbook) => (
              <option key={textbook.id} value={textbook.id}>
                {textbook.title} / {textbook.courseName}
              </option>
            ))}
          </SelectField>

          {selectedTextbook && (
            <div className="grid gap-4 rounded-lg border border-line bg-slate-50 p-4 text-sm sm:grid-cols-[120px_1fr]">
              <img
                src={selectedTextbook.imageUrl}
                alt={`${selectedTextbook.title}の教科書画像`}
                className="h-32 w-full rounded-lg object-cover sm:w-28"
              />
              <div>
                <p className="font-bold">{selectedTextbook.title}</p>
                <p className="mt-1 text-slate-600">
                  {selectedTextbook.faculty} / {selectedTextbook.department} / 定価 {yen(selectedTextbook.listPrice)}
                </p>
              </div>
            </div>
          )}

          <TextInput
            label="販売価格"
            htmlFor="sellingPrice"
            type="number"
            min={0}
            value={sellingPrice}
            onChange={(event) => setSellingPrice(Number(event.target.value))}
            required
          />

          <SelectField
            label="状態"
            htmlFor="condition"
            value={condition}
            onChange={(event) => setCondition(event.target.value as ListingCondition)}
          >
            {conditionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>

          <ImageUploadField
            label="商品画像アップロード"
            htmlFor="listingImage"
            previewUrl={listingPreviewUrl}
            isUploading={isListingImageUploading}
            onChange={handleListingImageChange}
          />

          <TextArea
            label="説明"
            htmlFor="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isSubmitting || isListingImageUploading || !masterId || !imageUrl}
          >
            <Save size={18} aria-hidden />
            出品する
          </button>
        </form>
      </section>

      <section className="panel p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Plus size={21} className="text-campus" aria-hidden />
          <h2 className="text-xl font-bold">教科書マスタ追加</h2>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleCreateTextbook}>
          <TextInput
            label="ISBN"
            htmlFor="isbn"
            value={newTextbook.isbn}
            onChange={(event) => setNewTextbook((current) => ({ ...current, isbn: event.target.value }))}
            required
          />

          <TextInput
            label="教科書名"
            htmlFor="title"
            value={newTextbook.title}
            onChange={(event) => setNewTextbook((current) => ({ ...current, title: event.target.value }))}
            required
          />

          <TextInput
            label="出版社"
            htmlFor="publisher"
            value={newTextbook.publisher}
            onChange={(event) => setNewTextbook((current) => ({ ...current, publisher: event.target.value }))}
            required
          />

          <TextInput
            label="定価"
            htmlFor="listPrice"
            type="number"
            min={0}
            value={newTextbook.listPrice}
            onChange={(event) =>
              setNewTextbook((current) => ({ ...current, listPrice: Number(event.target.value) }))
            }
            required
          />

          <TextInput
            label="授業名"
            htmlFor="courseName"
            value={newTextbook.courseName}
            onChange={(event) => setNewTextbook((current) => ({ ...current, courseName: event.target.value }))}
            required
          />

          <SelectField
            label="学部"
            htmlFor="faculty"
            value={newTextbook.faculty}
            onChange={(event) => handleFacultyChange(event.target.value)}
            required
          >
            <option value="">学部を選択してください</option>
            {academicFaculties.map((faculty) => (
              <option key={faculty} value={faculty}>
                {faculty}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="学科"
            htmlFor="department"
            value={newTextbook.department}
            onChange={(event) => setNewTextbook((current) => ({ ...current, department: event.target.value }))}
            disabled={!newTextbook.faculty}
            required
          >
            <option value="">{newTextbook.faculty ? "学科を選択してください" : "先に学部を選択してください"}</option>
            {departmentOptions.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </SelectField>

          <TextInput
            label="対象学年"
            htmlFor="academicYear"
            type="number"
            min={1}
            max={6}
            value={newTextbook.academicYear}
            onChange={(event) =>
              setNewTextbook((current) => ({ ...current, academicYear: Number(event.target.value) }))
            }
            required
          />

          <ImageUploadField
            label="教科書画像アップロード"
            htmlFor="textbookImage"
            previewUrl={textbookPreviewUrl}
            isUploading={isTextbookImageUploading}
            onChange={handleTextbookImageChange}
            required={!newTextbook.imageUrl}
          />

          <button
            type="submit"
            className="btn-secondary w-full"
            disabled={isTextbookImageUploading || !newTextbook.imageUrl}
          >
            <Plus size={17} aria-hidden />
            追加する
          </button>
        </form>
      </section>
    </div>
  );
}
