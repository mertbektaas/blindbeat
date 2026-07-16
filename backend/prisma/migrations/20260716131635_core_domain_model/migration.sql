-- CreateEnum
CREATE TYPE "LobbyStatus" AS ENUM ('OPEN', 'IN_SESSION', 'CLOSED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('WAITING', 'RUNNING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PatternPoolStatus" AS ENUM ('ACTIVE', 'ARCHIVE', 'CONSUMED');

-- CreateTable
CREATE TABLE "Lobby" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "status" "LobbyStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lobby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "nickname" TEXT NOT NULL,
    "lobbyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "lobbyId" INTEGER NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'WAITING',
    "matchCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionPlayer" (
    "sessionId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionPlayer_pkey" PRIMARY KEY ("sessionId","playerId")
);

-- CreateTable
CREATE TABLE "Instrument" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Instrument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pattern" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,
    "instrumentId" INTEGER NOT NULL,
    "poolStatus" "PatternPoolStatus" NOT NULL DEFAULT 'ACTIVE',
    "patternData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongVariant" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "variantNo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongVariantPattern" (
    "songVariantId" INTEGER NOT NULL,
    "patternId" INTEGER NOT NULL,
    "instrumentId" INTEGER NOT NULL,
    "slotOrder" INTEGER NOT NULL,

    CONSTRAINT "SongVariantPattern_pkey" PRIMARY KEY ("songVariantId","patternId")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "songVariantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionLeaderboard" (
    "sessionId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionLeaderboard_pkey" PRIMARY KEY ("sessionId","playerId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lobby_code_key" ON "Lobby"("code");

-- CreateIndex
CREATE INDEX "Player_lobbyId_idx" ON "Player"("lobbyId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_lobbyId_nickname_key" ON "Player"("lobbyId", "nickname");

-- CreateIndex
CREATE INDEX "Session_lobbyId_status_idx" ON "Session"("lobbyId", "status");

-- CreateIndex
CREATE INDEX "SessionPlayer_playerId_idx" ON "SessionPlayer"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Instrument_code_key" ON "Instrument"("code");

-- CreateIndex
CREATE INDEX "Match_sessionId_idx" ON "Match"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_sessionId_matchNumber_key" ON "Match"("sessionId", "matchNumber");

-- CreateIndex
CREATE INDEX "Pattern_matchId_instrumentId_poolStatus_idx" ON "Pattern"("matchId", "instrumentId", "poolStatus");

-- CreateIndex
CREATE INDEX "Pattern_instrumentId_poolStatus_idx" ON "Pattern"("instrumentId", "poolStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Pattern_playerId_matchId_instrumentId_key" ON "Pattern"("playerId", "matchId", "instrumentId");

-- CreateIndex
CREATE INDEX "SongVariant_matchId_idx" ON "SongVariant"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "SongVariant_matchId_variantNo_key" ON "SongVariant"("matchId", "variantNo");

-- CreateIndex
CREATE INDEX "SongVariantPattern_patternId_idx" ON "SongVariantPattern"("patternId");

-- CreateIndex
CREATE UNIQUE INDEX "SongVariantPattern_songVariantId_instrumentId_key" ON "SongVariantPattern"("songVariantId", "instrumentId");

-- CreateIndex
CREATE INDEX "Vote_songVariantId_idx" ON "Vote"("songVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_matchId_playerId_key" ON "Vote"("matchId", "playerId");

-- CreateIndex
CREATE INDEX "SessionLeaderboard_sessionId_totalScore_idx" ON "SessionLeaderboard"("sessionId", "totalScore");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPlayer" ADD CONSTRAINT "SessionPlayer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPlayer" ADD CONSTRAINT "SessionPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pattern" ADD CONSTRAINT "Pattern_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pattern" ADD CONSTRAINT "Pattern_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pattern" ADD CONSTRAINT "Pattern_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongVariant" ADD CONSTRAINT "SongVariant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongVariantPattern" ADD CONSTRAINT "SongVariantPattern_songVariantId_fkey" FOREIGN KEY ("songVariantId") REFERENCES "SongVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongVariantPattern" ADD CONSTRAINT "SongVariantPattern_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongVariantPattern" ADD CONSTRAINT "SongVariantPattern_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_songVariantId_fkey" FOREIGN KEY ("songVariantId") REFERENCES "SongVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionLeaderboard" ADD CONSTRAINT "SessionLeaderboard_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionLeaderboard" ADD CONSTRAINT "SessionLeaderboard_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
