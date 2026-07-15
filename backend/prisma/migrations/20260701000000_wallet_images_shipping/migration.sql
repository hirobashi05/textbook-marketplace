ALTER TABLE "textbook_masters" ADD COLUMN "imageUrl" TEXT NOT NULL DEFAULT '/images/textbooks/textbook-grid.jpg';
ALTER TABLE "listings" ADD COLUMN "imageUrl" TEXT NOT NULL DEFAULT '/images/textbooks/textbook-grid.jpg';
ALTER TABLE "orders" ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'points';
ALTER TABLE "orders" ADD COLUMN "shippingStatus" TEXT NOT NULL DEFAULT 'requested';

CREATE TABLE "point_purchases" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "providerReference" TEXT,
  "status" TEXT NOT NULL DEFAULT 'paid',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "point_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("uid") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "orders_shippingStatus_idx" ON "orders"("shippingStatus");
CREATE INDEX "point_purchases_userId_idx" ON "point_purchases"("userId");
