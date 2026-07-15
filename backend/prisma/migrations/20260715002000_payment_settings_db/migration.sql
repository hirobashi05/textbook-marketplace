CREATE TABLE "payment_settings" (
  "userId" TEXT NOT NULL PRIMARY KEY,
  "preferredMethod" TEXT NOT NULL DEFAULT 'credit_card',
  "cardHolderName" TEXT,
  "cardBrand" TEXT,
  "cardLast4" TEXT,
  "cardExpiryMonth" INTEGER,
  "cardExpiryYear" INTEGER,
  "convenienceStoreChain" TEXT,
  "conveniencePayerName" TEXT,
  "conveniencePayerPhone" TEXT,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "payment_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("uid") ON DELETE CASCADE ON UPDATE CASCADE
);
