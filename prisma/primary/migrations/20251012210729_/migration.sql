-- DropIndex
DROP INDEX "public"."Token_createdByUserId_idx";

-- DropIndex
DROP INDEX "public"."Token_expiresAt_idx";

-- DropIndex
DROP INDEX "public"."Token_isActive_idx";

-- DropIndex
DROP INDEX "public"."Token_userId_idx";

-- CreateIndex
CREATE INDEX "Token_userId_createdAt_idx" ON "Token"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Token_createdByUserId_createdAt_idx" ON "Token"("createdByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Token_isActive_expiresAt_idx" ON "Token"("isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "Token_revokedAt_idx" ON "Token"("revokedAt");
