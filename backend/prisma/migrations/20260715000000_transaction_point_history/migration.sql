DROP INDEX IF EXISTS "orders_shippingStatus_idx";

ALTER TABLE "orders" RENAME COLUMN "shippingStatus" TO "transactionStatus";

UPDATE "orders"
SET "transactionStatus" = CASE "transactionStatus"
  WHEN 'requested' THEN 'awaiting_seller_confirmation'
  WHEN 'delivered' THEN 'completed'
  ELSE "transactionStatus"
END;

CREATE INDEX "orders_transactionStatus_idx" ON "orders"("transactionStatus");

CREATE TABLE "point_transactions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "orderId" TEXT,
  "pointPurchaseId" TEXT,
  "description" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "point_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "point_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "point_transactions_pointPurchaseId_fkey" FOREIGN KEY ("pointPurchaseId") REFERENCES "point_purchases" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "point_transactions_userId_createdAt_idx" ON "point_transactions"("userId", "createdAt");
CREATE INDEX "point_transactions_orderId_idx" ON "point_transactions"("orderId");
CREATE INDEX "point_transactions_pointPurchaseId_idx" ON "point_transactions"("pointPurchaseId");
