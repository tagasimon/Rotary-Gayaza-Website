-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'ATTENDANCE_MANAGER');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Verification" AS ENUM ('VERIFIED', 'CLUB_RECORD', 'NEEDS_CONFIRMATION');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CLUB_EVENT', 'FELLOWSHIP', 'SERVICE_PROJECT', 'DISTRICT_EVENT', 'DG_VISIT', 'ROTARY_WIDE', 'YOUTH_EVENT', 'SPECIAL_EVENT');

-- CreateEnum
CREATE TYPE "EventScope" AS ENUM ('CLUB', 'DISTRICT', 'COMMUNITY');

-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('MANUAL', 'D9213_ICAL', 'D9213_HOME_EVENTS', 'D9213_STORIES', 'D9213_ALBUMS', 'ROTARYO_FELLOWSHIPS', 'URL_IMPORT');

-- CreateEnum
CREATE TYPE "ClubType" AS ENUM ('ROTARY', 'ROTARACT', 'INTERACT', 'ROTARY_COMMUNITY_CORPS', 'OTHER');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('MOTHER_CLUB', 'SUPPORTED', 'SPONSORED', 'MENTORED', 'CHARTERED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'HONORARY', 'INACTIVE', 'LEFT');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('REGULAR', 'FELLOWSHIP', 'SERVICE', 'DG_VISIT', 'BOARD', 'SPECIAL');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'EXCUSED', 'MAKEUP');

-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('QR', 'MANUAL');

-- CreateEnum
CREATE TYPE "DiscoveredType" AS ENUM ('EVENT', 'STORY', 'PHOTO_ALBUM', 'DG_VISIT', 'CLUB_MENTION', 'CLUB', 'OTHER');

-- CreateEnum
CREATE TYPE "DiscoveredStatus" AS ENUM ('NEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AlbumKind" AS ENUM ('PROJECT', 'DG_VISIT', 'FELLOWSHIP', 'LEADERSHIP', 'EVENT', 'ARCHIVE', 'GENERAL');

-- CreateEnum
CREATE TYPE "TimelineKind" AS ENUM ('FORMATION', 'CHARTER', 'MILESTONE', 'PROJECT', 'YOUTH_CLUB', 'LEADERSHIP', 'DG_VISIT', 'UPCOMING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "userId" TEXT,
    "memberId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "memberNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "joinDate" TIMESTAMP(3),
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "rotaryRole" TEXT,
    "roleOrder" INTEGER NOT NULL DEFAULT 100,
    "showOnLeadership" BOOLEAN NOT NULL DEFAULT false,
    "publicProfile" BOOLEAN NOT NULL DEFAULT false,
    "showContactPublic" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "pinHash" TEXT,
    "pinSetAt" TIMESTAMP(3),
    "failedPinAttempts" INTEGER NOT NULL DEFAULT 0,
    "pinLockedUntil" TIMESTAMP(3),
    "sourceLabel" TEXT,
    "sourceUrl" TEXT,
    "verification" "Verification" NOT NULL DEFAULT 'CLUB_RECORD',
    "clubId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "type" "ClubType" NOT NULL DEFAULT 'ROTARY',
    "isHome" BOOLEAN NOT NULL DEFAULT false,
    "district" TEXT,
    "clubNumber" TEXT,
    "charterDate" TIMESTAMP(3),
    "charterDateLabel" TEXT,
    "meetingDay" TEXT,
    "meetingTime" TEXT,
    "venue" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "email" TEXT,
    "website" TEXT,
    "xUrl" TEXT,
    "logoUrl" TEXT,
    "description" TEXT,
    "story" TEXT,
    "sourceLabel" TEXT,
    "sourceUrl" TEXT,
    "verification" "Verification" NOT NULL DEFAULT 'CLUB_RECORD',
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubRelationship" (
    "id" TEXT NOT NULL,
    "parentClubId" TEXT NOT NULL,
    "childClubId" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "year" TEXT,
    "description" TEXT,
    "sourceLabel" TEXT,
    "sourceUrl" TEXT,
    "verification" "Verification" NOT NULL DEFAULT 'CLUB_RECORD',
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "President" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rotaryYear" TEXT NOT NULL,
    "photoUrl" TEXT,
    "message" TEXT,
    "achievements" TEXT[],
    "awards" TEXT[],
    "archiveLinks" TEXT[],
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "memberId" TEXT,
    "clubId" TEXT,
    "sourceLabel" TEXT,
    "sourceUrl" TEXT,
    "verification" "Verification" NOT NULL DEFAULT 'CLUB_RECORD',
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "President_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSource" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "SourceKind" NOT NULL,
    "url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "keywords" TEXT[],
    "notes" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "lastStatus" TEXT,
    "lastError" TEXT,
    "lastFound" INTEGER NOT NULL DEFAULT 0,
    "lastCreated" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "EventType" NOT NULL DEFAULT 'CLUB_EVENT',
    "scope" "EventScope" NOT NULL DEFAULT 'CLUB',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "timeTbc" BOOLEAN NOT NULL DEFAULT false,
    "venue" TEXT,
    "location" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "organiser" TEXT,
    "imageUrl" TEXT,
    "registrationUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "EventStatus" NOT NULL DEFAULT 'APPROVED',
    "sourceId" TEXT,
    "sourceLabel" TEXT,
    "sourceUrl" TEXT,
    "externalId" TEXT,
    "dedupeKey" TEXT,
    "importedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "clubId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DGVisit" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "governorName" TEXT NOT NULL,
    "rotaryYear" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeLabel" TEXT,
    "venue" TEXT,
    "summary" TEXT,
    "story" TEXT,
    "message" TEXT,
    "projectsHighlighted" TEXT[],
    "heroImageUrl" TEXT,
    "albumId" TEXT,
    "eventId" TEXT,
    "clubId" TEXT,
    "sourceLabel" TEXT,
    "sourceUrl" TEXT,
    "verification" "Verification" NOT NULL DEFAULT 'CLUB_RECORD',
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DGVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "challenge" TEXT,
    "action" TEXT,
    "people" TEXT,
    "result" TEXT,
    "story" TEXT,
    "dateLabel" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "rotaryYear" TEXT,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "projectType" TEXT,
    "areaOfFocus" TEXT,
    "impactCategory" TEXT,
    "participants" TEXT,
    "peopleReached" TEXT,
    "budget" TEXT,
    "fundingSource" TEXT,
    "partners" TEXT[],
    "outcomes" TEXT[],
    "heroImageUrl" TEXT,
    "videoUrls" TEXT[],
    "documentUrls" TEXT[],
    "externalLinks" TEXT[],
    "albumId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "projectStatus" TEXT,
    "clubId" TEXT,
    "sourceLabel" TEXT,
    "sourceUrl" TEXT,
    "verification" "Verification" NOT NULL DEFAULT 'CLUB_RECORD',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dek" TEXT,
    "body" TEXT,
    "heroImageUrl" TEXT,
    "place" TEXT,
    "people" TEXT[],
    "impact" TEXT,
    "projectId" TEXT,
    "albumId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sourceLabel" TEXT,
    "sourceUrl" TEXT,
    "verification" "Verification" NOT NULL DEFAULT 'CLUB_RECORD',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactMetric" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "numericValue" INTEGER,
    "label" TEXT NOT NULL,
    "period" TEXT,
    "category" TEXT,
    "sourceLabel" TEXT,
    "sourceUrl" TEXT,
    "verification" "Verification" NOT NULL DEFAULT 'CLUB_RECORD',
    "featured" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImpactMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dateLabel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" "TimelineKind" NOT NULL DEFAULT 'MILESTONE',
    "chapter" TEXT,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "sourceLabel" TEXT,
    "sourceUrl" TEXT,
    "verification" "Verification" NOT NULL DEFAULT 'CLUB_RECORD',
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT,
    "body" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "audience" TEXT NOT NULL DEFAULT 'members',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" "AlbumKind" NOT NULL DEFAULT 'GENERAL',
    "date" TIMESTAMP(3),
    "coverUrl" TEXT,
    "sourceLabel" TEXT,
    "sourceUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbUrl" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'image',
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "caption" TEXT,
    "credit" TEXT,
    "crop" TEXT,
    "storageKey" TEXT,
    "albumId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "sourceUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "MeetingType" NOT NULL DEFAULT 'REGULAR',
    "date" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "rotaryYear" TEXT NOT NULL,
    "venue" TEXT,
    "notes" TEXT,
    "guestCount" INTEGER NOT NULL DEFAULT 0,
    "countsTowardAttendance" BOOLEAN NOT NULL DEFAULT true,
    "eventId" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "allowGuests" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT,
    "guestName" TEXT,
    "guestPhone" TEXT,
    "guestClub" TEXT,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "method" "AttendanceMethod" NOT NULL DEFAULT 'QR',
    "sessionId" TEXT,
    "note" TEXT,
    "recordedById" TEXT,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveredItem" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "type" "DiscoveredType" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "itemDate" TIMESTAMP(3),
    "summary" TEXT,
    "imageUrl" TEXT,
    "payload" JSONB,
    "suggestedDestination" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "status" "DiscoveredStatus" NOT NULL DEFAULT 'NEW',
    "resultRef" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoveredItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "trigger" TEXT NOT NULL,
    "summary" JSONB,
    "ok" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "interest" TEXT,
    "message" TEXT NOT NULL,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT,
    "meta" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_memberId_key" ON "User"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Member_memberNumber_key" ON "Member"("memberNumber");

-- CreateIndex
CREATE INDEX "Member_status_idx" ON "Member"("status");

-- CreateIndex
CREATE INDEX "Member_fullName_idx" ON "Member"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ClubRelationship_parentClubId_childClubId_relationshipType_key" ON "ClubRelationship"("parentClubId", "childClubId", "relationshipType");

-- CreateIndex
CREATE INDEX "President_rotaryYear_idx" ON "President"("rotaryYear");

-- CreateIndex
CREATE UNIQUE INDEX "EventSource_key_key" ON "EventSource"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_dedupeKey_idx" ON "Event"("dedupeKey");

-- CreateIndex
CREATE INDEX "Event_status_startsAt_idx" ON "Event"("status", "startsAt");

-- CreateIndex
CREATE INDEX "Event_scope_status_startsAt_idx" ON "Event"("scope", "status", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Event_sourceId_externalId_key" ON "Event"("sourceId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "DGVisit_slug_key" ON "DGVisit"("slug");

-- CreateIndex
CREATE INDEX "DGVisit_date_idx" ON "DGVisit"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_status_startDate_idx" ON "Project"("status", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Story_slug_key" ON "Story"("slug");

-- CreateIndex
CREATE INDEX "Story_status_publishedAt_idx" ON "Story"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "TimelineEntry_date_idx" ON "TimelineEntry"("date");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSection_key_key" ON "SiteSection"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Album_slug_key" ON "Album"("slug");

-- CreateIndex
CREATE INDEX "Media_albumId_order_idx" ON "Media"("albumId", "order");

-- CreateIndex
CREATE INDEX "Meeting_date_idx" ON "Meeting"("date");

-- CreateIndex
CREATE INDEX "Meeting_rotaryYear_idx" ON "Meeting"("rotaryYear");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_token_key" ON "AttendanceSession"("token");

-- CreateIndex
CREATE INDEX "AttendanceSession_meetingId_idx" ON "AttendanceSession"("meetingId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_memberId_idx" ON "AttendanceRecord"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_meetingId_memberId_key" ON "AttendanceRecord"("meetingId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveredItem_dedupeKey_key" ON "DiscoveredItem"("dedupeKey");

-- CreateIndex
CREATE INDEX "DiscoveredItem_status_importedAt_idx" ON "DiscoveredItem"("status", "importedAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubRelationship" ADD CONSTRAINT "ClubRelationship_parentClubId_fkey" FOREIGN KEY ("parentClubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubRelationship" ADD CONSTRAINT "ClubRelationship_childClubId_fkey" FOREIGN KEY ("childClubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "President" ADD CONSTRAINT "President_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "President" ADD CONSTRAINT "President_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "EventSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DGVisit" ADD CONSTRAINT "DGVisit_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DGVisit" ADD CONSTRAINT "DGVisit_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DGVisit" ADD CONSTRAINT "DGVisit_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
