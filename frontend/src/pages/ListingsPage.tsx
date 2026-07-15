import { Search, SlidersHorizontal } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Alert } from "../components/Alert";
import { SelectField, TextInput } from "../components/FormField";
import { ListingCard } from "../components/ListingCard";
import { ApiClientError, api } from "../lib/api";
import { academicFaculties, getDepartmentsForFaculty } from "../lib/academicOptions";
import type { Listing } from "../types/api";

type Filters = {
  keyword: string;
  faculty: string;
  department: string;
  courseName: string;
};

export function ListingsPage() {
  const [filters, setFilters] = useState<Filters>({
    keyword: "",
    faculty: "",
    department: "",
    courseName: ""
  });
  const [applied, setApplied] = useState<Filters>(filters);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const departmentOptions = getDepartmentsForFaculty(filters.faculty);

  useEffect(() => {
    setIsLoading(true);
    setError("");

    api
      .listings(applied)
      .then(setListings)
      .catch((caught) => {
        setError(caught instanceof ApiClientError ? caught.message : "出品一覧を取得できませんでした");
      })
      .finally(() => setIsLoading(false));
  }, [applied]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setApplied(filters);
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((current) => {
      if (key === "faculty") {
        return {
          ...current,
          faculty: value,
          department: ""
        };
      }

      return { ...current, [key]: value };
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <p className="text-sm font-semibold text-campus">学内リユース</p>
          <h1 className="mt-1 text-3xl font-bold tracking-normal text-ink sm:text-4xl">
            教科書を探す
          </h1>
        </div>

        <form className="panel p-4" onSubmit={handleSubmit}>
          <div className="mb-3 flex items-center gap-2 text-sm font-bold">
            <SlidersHorizontal size={17} aria-hidden />
            検索
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <TextInput
              label="キーワード"
              htmlFor="keyword"
              value={filters.keyword}
              onChange={(event) => updateFilter("keyword", event.target.value)}
            />
            <SelectField
              label="学部"
              htmlFor="faculty"
              value={filters.faculty}
              onChange={(event) => updateFilter("faculty", event.target.value)}
            >
              <option value="">すべての学部</option>
              {academicFaculties.map((faculty) => (
                <option key={faculty} value={faculty}>
                  {faculty}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="学科"
              htmlFor="department"
              value={filters.department}
              onChange={(event) => updateFilter("department", event.target.value)}
              disabled={!filters.faculty}
            >
              <option value="">{filters.faculty ? "すべての学科" : "先に学部を選択してください"}</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </SelectField>
            <TextInput
              label="授業名"
              htmlFor="courseName"
              value={filters.courseName}
              onChange={(event) => updateFilter("courseName", event.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary mt-4 w-full">
            <Search size={17} aria-hidden />
            検索
          </button>
        </form>
      </section>

      {error && <Alert message={error} />}

      {isLoading ? (
        <div className="py-12 text-center text-slate-500">読み込み中...</div>
      ) : listings.length === 0 ? (
        <div className="panel py-12 text-center text-slate-500">該当する出品がありません</div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </section>
      )}
    </div>
  );
}
