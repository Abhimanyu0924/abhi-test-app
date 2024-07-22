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
    "quantity" TEXT,
    "discounting" TEXT,
    "subDiscount" TEXT,
    "discountedAmount" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL
);
INSERT INTO "new_discountTable" ("discountedAmount", "discounting", "endDate", "id", "offerName", "offerType", "productId", "productName", "productVariantId", "quantity", "shop", "startDate", "subDiscount") SELECT "discountedAmount", "discounting", "endDate", "id", "offerName", "offerType", "productId", "productName", "productVariantId", "quantity", "shop", "startDate", "subDiscount" FROM "discountTable";
DROP TABLE "discountTable";
ALTER TABLE "new_discountTable" RENAME TO "discountTable";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
