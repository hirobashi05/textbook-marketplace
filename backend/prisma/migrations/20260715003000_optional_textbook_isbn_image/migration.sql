PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_textbook_masters" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "isbn" TEXT,
  "title" TEXT NOT NULL,
  "publisher" TEXT NOT NULL,
  "listPrice" INTEGER NOT NULL,
  "courseName" TEXT NOT NULL,
  "faculty" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "imageUrl" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_textbook_masters" (
  "academicYear",
  "courseName",
  "createdAt",
  "department",
  "faculty",
  "id",
  "imageUrl",
  "isbn",
  "listPrice",
  "publisher",
  "title",
  "updatedAt"
)
SELECT
  "academicYear",
  "courseName",
  "createdAt",
  "department",
  "faculty",
  "id",
  "imageUrl",
  "isbn",
  "listPrice",
  "publisher",
  "title",
  "updatedAt"
FROM "textbook_masters";

DROP TABLE "textbook_masters";
ALTER TABLE "new_textbook_masters" RENAME TO "textbook_masters";

CREATE UNIQUE INDEX "textbook_masters_isbn_key" ON "textbook_masters"("isbn");
CREATE INDEX "textbook_masters_title_idx" ON "textbook_masters"("title");
CREATE INDEX "textbook_masters_courseName_idx" ON "textbook_masters"("courseName");
CREATE INDEX "textbook_masters_faculty_idx" ON "textbook_masters"("faculty");
CREATE INDEX "textbook_masters_department_idx" ON "textbook_masters"("department");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
