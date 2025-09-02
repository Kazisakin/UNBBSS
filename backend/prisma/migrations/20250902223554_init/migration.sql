-- CreateTable
CREATE TABLE "public"."admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."nomination_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rules" TEXT,
    "slug" TEXT NOT NULL,
    "nominationStartTime" TIMESTAMP(3) NOT NULL,
    "nominationEndTime" TIMESTAMP(3) NOT NULL,
    "withdrawalStartTime" TIMESTAMP(3) NOT NULL,
    "withdrawalEndTime" TIMESTAMP(3) NOT NULL,
    "enableTimeCheck" BOOLEAN NOT NULL DEFAULT true,
    "enableNominationTime" BOOLEAN NOT NULL DEFAULT true,
    "enableWithdrawalTime" BOOLEAN NOT NULL DEFAULT true,
    "eligibleEmails" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowDuplicateEmails" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "nomination_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."nominations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "positions" TEXT[],
    "ipAddress" TEXT NOT NULL,
    "location" TEXT,
    "userAgent" TEXT,
    "isWithdrawn" BOOLEAN NOT NULL DEFAULT false,
    "withdrawnAt" TIMESTAMP(3),
    "withdrawnPositions" TEXT[],
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "withdrawalToken" TEXT NOT NULL,

    CONSTRAINT "nominations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."withdrawal_tokens" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawal_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_sessions" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."security_logs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "email" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "public"."admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "nomination_events_slug_key" ON "public"."nomination_events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "nominations_withdrawalToken_key" ON "public"."nominations"("withdrawalToken");

-- CreateIndex
CREATE UNIQUE INDEX "nominations_email_eventId_key" ON "public"."nominations"("email", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_email_eventId_key" ON "public"."verification_tokens"("email", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_tokens_token_key" ON "public"."withdrawal_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_tokens_email_eventId_key" ON "public"."withdrawal_tokens"("email", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_key" ON "public"."admin_sessions"("token");

-- CreateIndex
CREATE INDEX "security_logs_ipAddress_createdAt_idx" ON "public"."security_logs"("ipAddress", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."nomination_events" ADD CONSTRAINT "nomination_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."nominations" ADD CONSTRAINT "nominations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."nomination_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."verification_tokens" ADD CONSTRAINT "verification_tokens_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."nomination_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."withdrawal_tokens" ADD CONSTRAINT "withdrawal_tokens_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."nomination_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
