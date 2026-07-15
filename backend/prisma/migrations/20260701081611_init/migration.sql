-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_listings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "sellingPrice" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users" ("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "listings_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "textbook_masters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_listings" ("condition", "createdAt", "description", "id", "imageUrl", "masterId", "sellerId", "sellingPrice", "status", "updatedAt") SELECT "condition", "createdAt", "description", "id", "imageUrl", "masterId", "sellerId", "sellingPrice", "status", "updatedAt" FROM "listings";
DROP TABLE "listings";
ALTER TABLE "new_listings" RENAME TO "listings";
CREATE INDEX "listings_sellerId_idx" ON "listings"("sellerId");
CREATE INDEX "listings_masterId_idx" ON "listings"("masterId");
CREATE INDEX "listings_status_idx" ON "listings"("status");
CREATE TABLE "new_point_purchases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "providerReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'paid',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "point_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("uid") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_point_purchases" ("amount", "createdAt", "id", "paymentMethod", "providerReference", "status", "updatedAt", "userId") SELECT "amount", "createdAt", "id", "paymentMethod", "providerReference", "status", "updatedAt", "userId" FROM "point_purchases";
DROP TABLE "point_purchases";
ALTER TABLE "new_point_purchases" RENAME TO "point_purchases";
CREATE INDEX "point_purchases_userId_idx" ON "point_purchases"("userId");
CREATE TABLE "new_textbook_masters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isbn" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "listPrice" INTEGER NOT NULL,
    "courseName" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_textbook_masters" ("academicYear", "courseName", "createdAt", "department", "faculty", "id", "imageUrl", "isbn", "listPrice", "publisher", "title", "updatedAt") SELECT "academicYear", "courseName", "createdAt", "department", "faculty", "id", "imageUrl", "isbn", "listPrice", "publisher", "title", "updatedAt" FROM "textbook_masters";
DROP TABLE "textbook_masters";
ALTER TABLE "new_textbook_masters" RENAME TO "textbook_masters";
CREATE UNIQUE INDEX "textbook_masters_isbn_key" ON "textbook_masters"("isbn");
CREATE INDEX "textbook_masters_title_idx" ON "textbook_masters"("title");
CREATE INDEX "textbook_masters_courseName_idx" ON "textbook_masters"("courseName");
CREATE INDEX "textbook_masters_faculty_idx" ON "textbook_masters"("faculty");
CREATE INDEX "textbook_masters_department_idx" ON "textbook_masters"("department");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
