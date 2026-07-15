export const academicCatalog = {
  "文学部": ["学科共通", "人文社会学科", "その他学科"],
  "経済学部": ["学科共通", "経済学科", "その他学科"],
  "法学部": ["学科共通", "法学科", "政治学科", "その他学科"],
  "商学部": ["学科共通", "商学科", "その他学科"],
  "医学部": ["学科共通", "医学科", "その他学科"],
  "理工学部": [
    "学科共通",
    "機械工学科",
    "電気情報工学科",
    "応用化学科",
    "物理情報工学科",
    "管理工学科",
    "数理科学科",
    "物理学科",
    "化学科",
    "システムデザイン工学科",
    "情報工学科",
    "生命情報学科",
    "その他学科"
  ],
  "総合政策学部": ["学科共通", "総合政策学科", "その他学科"],
  "環境情報学部": ["学科共通", "環境情報学科", "その他学科"],
  "看護医療学部": ["学科共通", "看護学科", "その他学科"],
  "薬学部": ["学科共通", "薬学科", "薬科学科", "その他学科"],
  "その他学部": ["学科共通", "その他学科"]
} as const;

export type AcademicFaculty = keyof typeof academicCatalog;

export const academicFaculties = Object.keys(academicCatalog) as AcademicFaculty[];

export function isAcademicFaculty(value: string): value is AcademicFaculty {
  return Object.prototype.hasOwnProperty.call(academicCatalog, value);
}

export function getDepartmentsForFaculty(faculty: string): readonly string[] {
  if (!isAcademicFaculty(faculty)) {
    return [];
  }

  return academicCatalog[faculty];
}

export function isAcademicDepartmentForFaculty(faculty: string, department: string) {
  return getDepartmentsForFaculty(faculty).includes(department);
}

export function isKnownAcademicDepartment(department: string) {
  return academicFaculties.some((faculty) => getDepartmentsForFaculty(faculty).includes(department));
}
