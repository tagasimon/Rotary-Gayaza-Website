-- AlterTable
ALTER TABLE "AttendanceRecord" ADD COLUMN     "emailError" TEXT,
ADD COLUMN     "emailSentAt" TIMESTAMP(3),
ADD COLUMN     "emailStatus" TEXT;
