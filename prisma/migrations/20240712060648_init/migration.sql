/*
  Warnings:

  - You are about to drop the `subDiscountTable` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "subDiscountTable";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_discountTable" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "offerName" TEXT NOT NULL,
    "offerType" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "baselineMargin" INTEGER,
    "bafoMargin" INTEGER,
    "discQuantity" INTEGER NOT NULL,
    "discProducts" INTEGER NOT NULL,
    "discAmount" INTEGER,
    "expectedProfit" INTEGER,
    "quantity" INTEGER,
    "discounting" INTEGER,
    "subDiscount" TEXT,
    "discountedAmount" INTEGER,
    "profitMargin" INTEGER,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL
);
INSERT INTO "new_discountTable" ("bafoMargin", "baselineMargin", "discAmount", "discProducts", "discQuantity", "endDate", "expectedProfit", "id", "offerName", "offerType", "productId", "productName", "productVariantId", "shop", "startDate") SELECT "bafoMargin", "baselineMargin", "discAmount", "discProducts", "discQuantity", "endDate", "expectedProfit", "id", "offerName", "offerType", "productId", "productName", "productVariantId", "shop", "startDate" FROM "discountTable";
DROP TABLE "discountTable";
ALTER TABLE "new_discountTable" RENAME TO "discountTable";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
