-- CreateTable
CREATE TABLE "Target" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageName" TEXT NOT NULL,
    "minX" DOUBLE PRECISION NOT NULL,
    "maxX" DOUBLE PRECISION NOT NULL,
    "minY" DOUBLE PRECISION NOT NULL,
    "maxY" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Target_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "timeInSeconds" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionHit" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionHit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leaderboard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Anonymous',
    "timeInSeconds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Target_name_key" ON "Target"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SessionHit_sessionId_targetId_key" ON "SessionHit"("sessionId", "targetId");

-- AddForeignKey
ALTER TABLE "SessionHit" ADD CONSTRAINT "SessionHit_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionHit" ADD CONSTRAINT "SessionHit_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Target"("id") ON DELETE CASCADE ON UPDATE CASCADE;
