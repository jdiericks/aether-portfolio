-- Roles
CREATE TABLE "Role" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "isOwner" BOOLEAN NOT NULL DEFAULT false,
  "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "mcpAccess" TEXT NOT NULL DEFAULT 'none',
  "mcpAllowedTools" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- Users: add team-related columns
ALTER TABLE "User"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "roleId" TEXT,
  ADD COLUMN "mcpAccess" TEXT NOT NULL DEFAULT 'inherit',
  ADD COLUMN "mcpAllowedTools" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "invitedById" TEXT;

CREATE INDEX "User_roleId_idx" ON "User"("roleId");

ALTER TABLE "User"
  ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User"
  ADD CONSTRAINT "User_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
