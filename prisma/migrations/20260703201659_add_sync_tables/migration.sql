-- CreateEnum
CREATE TYPE "Source" AS ENUM ('WHOOP', 'GARMIN');

-- CreateTable
CREATE TABLE "Recovery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "Source" NOT NULL DEFAULT 'WHOOP',
    "sourceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "recoveryScore" DOUBLE PRECISION,
    "hrv" DOUBLE PRECISION,
    "restingHeartRate" DOUBLE PRECISION,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sleep" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "Source" NOT NULL DEFAULT 'WHOOP',
    "sourceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sleepPerformancePct" DOUBLE PRECISION,
    "durationMinutes" INTEGER,
    "sleepStart" TIMESTAMP(3),
    "nap" BOOLEAN NOT NULL DEFAULT false,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sleep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "Source" NOT NULL DEFAULT 'WHOOP',
    "sourceId" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "sportName" TEXT NOT NULL,
    "strain" DOUBLE PRECISION,
    "avgHr" INTEGER,
    "maxHr" INTEGER,
    "distanceMeters" DOUBLE PRECISION,
    "zoneDurations" JSONB,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recovery_source_sourceId_key" ON "Recovery"("source", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Recovery_userId_date_key" ON "Recovery"("userId", "date");

-- CreateIndex
CREATE INDEX "Sleep_userId_date_idx" ON "Sleep"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Sleep_source_sourceId_key" ON "Sleep"("source", "sourceId");

-- CreateIndex
CREATE INDEX "Workout_userId_start_idx" ON "Workout"("userId", "start");

-- CreateIndex
CREATE UNIQUE INDEX "Workout_source_sourceId_key" ON "Workout"("source", "sourceId");

-- AddForeignKey
ALTER TABLE "Recovery" ADD CONSTRAINT "Recovery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sleep" ADD CONSTRAINT "Sleep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
