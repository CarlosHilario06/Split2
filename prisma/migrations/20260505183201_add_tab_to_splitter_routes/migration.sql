-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SplitterRoute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "domain" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tab" TEXT NOT NULL DEFAULT '1',
    "splitterId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SplitterRoute_splitterId_fkey" FOREIGN KEY ("splitterId") REFERENCES "Splitter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SplitterRoute" ("createdAt", "domain", "id", "slug", "splitterId") SELECT "createdAt", "domain", "id", "slug", "splitterId" FROM "SplitterRoute";
DROP TABLE "SplitterRoute";
ALTER TABLE "new_SplitterRoute" RENAME TO "SplitterRoute";
CREATE UNIQUE INDEX "SplitterRoute_domain_slug_key" ON "SplitterRoute"("domain", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
