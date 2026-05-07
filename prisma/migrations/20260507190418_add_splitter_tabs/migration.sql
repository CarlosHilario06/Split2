-- CreateTable
CREATE TABLE "SplitterTab" (
    "id" SERIAL NOT NULL,
    "tab" TEXT NOT NULL,
    "splitterId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SplitterTab_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SplitterTab_splitterId_tab_key" ON "SplitterTab"("splitterId", "tab");

-- AddForeignKey
ALTER TABLE "SplitterTab" ADD CONSTRAINT "SplitterTab_splitterId_fkey" FOREIGN KEY ("splitterId") REFERENCES "Splitter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
