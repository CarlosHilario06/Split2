-- CreateTable
CREATE TABLE "SplitterRoute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "domain" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "splitterId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SplitterRoute_splitterId_fkey" FOREIGN KEY ("splitterId") REFERENCES "Splitter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SplitterRoute_domain_slug_key" ON "SplitterRoute"("domain", "slug");
