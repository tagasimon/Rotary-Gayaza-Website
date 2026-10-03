-- AlterTable
ALTER TABLE "AttendanceRecord" ADD COLUMN     "affiliation" TEXT,
ADD COLUMN     "clubName" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "isGuest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "logoUrl" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PressMention" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEnglish" TEXT,
    "outlet" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'article',
    "language" TEXT,
    "date" TIMESTAMP(3),
    "summary" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressMention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PressMention_url_key" ON "PressMention"("url");

-- CreateIndex
CREATE INDEX "AttendanceRecord_meetingId_email_idx" ON "AttendanceRecord"("meetingId", "email");

-- CreateIndex
CREATE INDEX "AttendanceRecord_meetingId_phone_idx" ON "AttendanceRecord"("meetingId", "phone");
