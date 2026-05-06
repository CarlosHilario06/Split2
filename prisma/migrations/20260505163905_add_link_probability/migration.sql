-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Link" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "ecpm" REAL NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "utms" JSONB,
    "tab" TEXT NOT NULL DEFAULT '1',
    "splitterId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "probability" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Link_splitterId_fkey" FOREIGN KEY ("splitterId") REFERENCES "Splitter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Link" ("createdAt", "disabled", "ecpm", "id", "impressions", "revenue", "splitterId", "tab", "type", "url", "utms") SELECT "createdAt", "disabled", "ecpm", "id", "impressions", "revenue", "splitterId", "tab", "type", "url", "utms" FROM "Link";
DROP TABLE "Link";
ALTER TABLE "new_Link" RENAME TO "Link";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
