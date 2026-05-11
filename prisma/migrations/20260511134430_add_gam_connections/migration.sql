-- CreateTable
CREATE TABLE "GamConnection" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "networkCode" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GamConnection_pkey" PRIMARY KEY ("id")
);
