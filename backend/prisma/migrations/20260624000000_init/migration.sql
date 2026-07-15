CREATE TABLE "users" (
  "uid" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "paymentMethod" TEXT,
  "points" INTEGER NOT NULL DEFAULT 0,
  "userStatus" TEXT NOT NULL DEFAULT 'active',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "textbook_masters" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "isbn" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "publisher" TEXT NOT NULL,
  "listPrice" INTEGER NOT NULL,
  "courseName" TEXT NOT NULL,
  "faculty" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "listings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sellerId" TEXT NOT NULL,
  "masterId" TEXT NOT NULL,
  "sellingPrice" INTEGER NOT NULL,
  "condition" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'available',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users" ("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "listings_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "textbook_masters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "orders" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "listingId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "shippingAddress" TEXT NOT NULL,
  "shippingFee" INTEGER NOT NULL,
  "totalAmount" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'paid',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "orders_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users" ("uid") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "textbook_masters_isbn_key" ON "textbook_masters"("isbn");
CREATE INDEX "textbook_masters_title_idx" ON "textbook_masters"("title");
CREATE INDEX "textbook_masters_courseName_idx" ON "textbook_masters"("courseName");
CREATE INDEX "textbook_masters_faculty_idx" ON "textbook_masters"("faculty");
CREATE INDEX "textbook_masters_department_idx" ON "textbook_masters"("department");
CREATE INDEX "listings_sellerId_idx" ON "listings"("sellerId");
CREATE INDEX "listings_masterId_idx" ON "listings"("masterId");
CREATE INDEX "listings_status_idx" ON "listings"("status");
CREATE UNIQUE INDEX "orders_listingId_key" ON "orders"("listingId");
CREATE INDEX "orders_buyerId_idx" ON "orders"("buyerId");

