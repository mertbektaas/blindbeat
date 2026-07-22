-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "bpm" INTEGER NOT NULL DEFAULT 120,
ADD COLUMN     "instrumentRoundSeconds" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "playbackLoops" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "songVariantCount" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "stepCount" INTEGER NOT NULL DEFAULT 8;

-- CreateTable
CREATE TABLE "SessionInstrument" (
    "sessionId" INTEGER NOT NULL,
    "instrumentId" INTEGER NOT NULL,
    "orderNo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionInstrument_pkey" PRIMARY KEY ("sessionId","instrumentId")
);

-- CreateIndex
CREATE INDEX "SessionInstrument_instrumentId_idx" ON "SessionInstrument"("instrumentId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionInstrument_sessionId_orderNo_key" ON "SessionInstrument"("sessionId", "orderNo");

-- AddForeignKey
ALTER TABLE "SessionInstrument" ADD CONSTRAINT "SessionInstrument_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionInstrument" ADD CONSTRAINT "SessionInstrument_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
